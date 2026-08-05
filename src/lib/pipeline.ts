/**
 * The two-layer pipeline: rules → AI → storage.
 *
 * Exported as a plain function so the test harness can exercise the exact same
 * code path the HTTP route uses, with no server running.
 */

import type { CheckResponse, Classification, SignalReport } from './types.js';
import { analyzeSignals } from './signals/index.js';
import { classify, classifierModel, ClassifierUnavailableError } from './classifier.js';
import { hashInput } from './privacy.js';
import { getStore } from '../store/index.js';

export const MAX_INPUT_LENGTH = 20_000;

export class InvalidInputError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}

export interface CheckOptions {
  /** Skip persistence. Used by the test harness so runs don't pollute stats. */
  persist?: boolean;
}

export function validateInput(text: unknown): string {
  if (typeof text !== 'string') {
    throw new InvalidInputError('Field "text" must be a string.', 'invalid_type');
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new InvalidInputError(
      'Paste the message you want checked — the text field was empty.',
      'empty_input'
    );
  }
  if (text.length > MAX_INPUT_LENGTH) {
    throw new InvalidInputError(
      `That message is too long to check (${text.length} characters, limit ${MAX_INPUT_LENGTH}). Paste just the suspicious part.`,
      'too_long'
    );
  }
  return text;
}

export async function runCheck(
  rawText: string,
  options: CheckOptions = {}
): Promise<CheckResponse> {
  const started = Date.now();
  const text = validateInput(rawText);

  // Layer 1 — always runs, always succeeds, never calls the network.
  const signals = analyzeSignals(text);

  // Layer 2 — may be unavailable (no key, API error, refusal). Degrade rather
  // than fail: a rules-only answer is far better than a 500 for a user who is
  // staring at a suspicious text message.
  let classification: Classification;
  let source: 'claude' | 'heuristic_fallback' = 'claude';
  try {
    classification = await classify(text, signals);
  } catch (err) {
    if (!(err instanceof ClassifierUnavailableError)) throw err;
    classification = heuristicFallback(signals);
    source = 'heuristic_fallback';
  }

  const response: CheckResponse = {
    verdict: classification.verdict,
    confidence: classification.confidence,
    reasons: classification.reasons,
    flags_detected: signals.flagsDetected,
    raw_signals: signals,
    meta: {
      classifier: source,
      model: source === 'claude' ? classifierModel() : null,
      duration_ms: Date.now() - started,
      check_id: null,
    },
  };

  if (options.persist !== false) {
    // Storage must never break a check. If the database is down the user still
    // gets their answer; only the demo counter loses a row.
    try {
      const stored = await getStore().recordCheck({
        input_text_hash: hashInput(text),
        input_length: text.length,
        verdict: response.verdict,
        confidence: response.confidence,
        flags_detected: response.flags_detected,
        classifier: source,
      });
      response.meta.check_id = stored?.id ?? null;
    } catch (err) {
      console.error(
        '[store] failed to record check:',
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  return response;
}

/**
 * Rules-only verdict, used when the classifier is unavailable.
 *
 * Deliberately conservative: it will say "be careful" far more readily than it
 * will say "scam" or "safe", because without the model's reading of the text we
 * genuinely know less. Thresholds are tuned so that no single weak signal can
 * push a message into "scam".
 */
export function heuristicFallback(signals: SignalReport): Classification {
  const reasons: string[] = [];
  const { riskScore, flagsDetected, legitimacySignals } = signals;

  const decisive = flagsDetected.filter((f) =>
    [
      'gift_card_request',
      'crypto_payment_request',
      'wire_transfer_request',
      'raw_credential_request',
      'lookalike_domain',
      'deep_subdomain_spoof',
      'link_text_mismatch',
    ].includes(f)
  );

  // Pull the most useful human-readable details straight from the detectors.
  for (const cat of signals.categories) {
    if (cat.category === 'legitimacy') continue;
    for (const m of cat.matches) {
      if (m.detail && reasons.length < 3 && decisive.includes(m.flag)) {
        reasons.push(capitalize(`this message ${m.detail}.`));
      }
    }
  }

  let verdict: Classification['verdict'];
  let confidence: number;

  if (decisive.length > 0 && riskScore >= 45) {
    verdict = 'scam';
    confidence = Math.min(88, 55 + riskScore / 3);
  } else if (riskScore >= 35) {
    verdict = 'uncertain_be_careful';
    confidence = 60;
  } else if (riskScore <= 5 && legitimacySignals.length >= 3) {
    verdict = 'likely_safe';
    confidence = 62;
  } else {
    verdict = 'uncertain_be_careful';
    confidence = 50;
  }

  if (verdict === 'likely_safe') {
    for (const cat of signals.categories) {
      if (cat.category !== 'legitimacy') continue;
      for (const m of cat.matches) {
        if (m.detail && reasons.length < 3) {
          reasons.push(capitalize(`this message ${m.detail}.`));
        }
      }
    }
  }

  if (reasons.length < 2) {
    reasons.push(
      verdict === 'likely_safe'
        ? 'Nothing in this message asks you for money, passwords or personal details.'
        : 'We could not fully analyse this one, so treat it carefully and check with the sender using a number you already have.'
    );
  }

  reasons.push(
    'Our detailed checker was unavailable, so this is a quick automatic assessment — double-check before acting on it.'
  );

  return {
    verdict,
    confidence: Math.round(confidence),
    reasons: reasons.slice(0, 4),
    citedFlags: decisive,
    calibrationNote: `heuristic fallback, riskScore=${riskScore}`,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
