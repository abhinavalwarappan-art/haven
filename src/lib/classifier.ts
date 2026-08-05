/**
 * Layer 2: the Claude classification agent.
 *
 * Takes the original text plus the Layer 1 signal report and produces a
 * verdict, a confidence level, and 2-4 plain-English reasons.
 *
 * Design notes that matter for classification quality:
 *
 *  - Structured output is enforced with `output_config.format` (JSON schema),
 *    not parsed out of free text, so the API response shape is reliable.
 *  - The prompt is explicit that Layer 1 hits are *evidence, not proof*. This
 *    is the single most important instruction in the system: without it the
 *    model rubber-stamps the rules layer and flags every legitimate bank alert
 *    that happens to contain the word "urgent".
 *  - Adaptive thinking is left ON. On Claude Opus 5, disabling thinking can
 *    cause the model to emit malformed structured output, which would silently
 *    break the whole pipeline.
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  Classification,
  FlagId,
  SignalReport,
  Verdict,
} from './types.js';
import { redactHighRisk } from './privacy.js';

const DEFAULT_MODEL = 'claude-opus-5';
const VERDICTS: Verdict[] = ['scam', 'likely_safe', 'uncertain_be_careful'];

/**
 * Hard ceiling on how long a user waits before we give them the rules-only
 * answer instead. Someone staring at a suspicious text will not wait a minute.
 * A fast, honest "be careful" beats a slow perfect answer.
 */
const REQUEST_TIMEOUT_MS = Number(process.env.CLASSIFIER_TIMEOUT_MS || 20_000);

/**
 * Effort controls thinking depth, and is the primary latency lever on Claude
 * Opus 5.
 *
 * `medium` is the default because it is the setting the evaluation set was
 * actually measured at (16/16, see TEST_RESULTS.md) — it costs ~14-30s per
 * check, which is slow for the "instant verdict" pitch.
 *
 * `low` is very likely the right production setting and is the first thing to
 * try: on Claude Opus 5 it is unusually strong for short, well-scoped
 * classification. It is NOT the default only because it has not been run
 * against the evaluation set yet. Set CLASSIFIER_EFFORT=low, re-run
 * `npm run test:checks`, and if it still scores 16/16 make it the default.
 */
const EFFORT = (process.env.CLASSIFIER_EFFORT || 'medium') as
  | 'low'
  | 'medium'
  | 'high';

let cached: Anthropic | null = null;

function client(): Anthropic {
  if (!cached) {
    cached = new Anthropic({
      timeout: REQUEST_TIMEOUT_MS,
      // One retry, not the default two: a second failure means we should show
      // the user the fallback rather than keep them waiting through backoff.
      maxRetries: 1,
    });
  }
  return cached;
}

export function classifierModel(): string {
  return process.env.CLASSIFIER_MODEL || DEFAULT_MODEL;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

const SYSTEM_PROMPT = `You help ordinary people — especially older adults — decide whether a message they received is a scam. You are the second stage of a two-stage system.

## Who you are writing for

The reader is not technical. They may be 75 years old. They are worried, and they are about to make a decision based on what you say. Write every reason the way you would explain it to your own grandmother over the phone: short, concrete, and calm. Never use words like "phishing", "spoofed", "malicious", "credential harvesting", "threat actor", "social engineering", or "URL". Say "fake website", "pretending to be", "the link goes somewhere else", "asks for your password" instead.

## What you receive

1. The exact text of the message.
2. A signal report from a fast rules layer that ran first. It lists patterns that matched, with the specific text that triggered each one, plus counter-evidence suggesting the message may be genuine.

## How to weigh the signal report — read this carefully

The rules layer is a keyword and pattern matcher. It is EVIDENCE, NOT PROOF. It has no understanding of context. Use it to make sure you didn't miss anything, then apply your own judgement.

Two failure modes to avoid, in order of importance:

**1. Crying wolf (worst outcome).** Legitimate organizations use urgency all the time. A real bank fraud alert says "unusual activity — respond immediately". A real pharmacy says "your prescription is ready, pick up by Friday". A real airline says "final call". A real doctor's office sends an appointment reminder. If you flag these as scams, the person stops trusting the tool and then ignores it on the day it matters. Urgency alone, a brand name alone, or a link alone is NOT enough to call something a scam.

**2. Missing a real scam.** If the message asks for gift cards, a wire transfer, cryptocurrency, or a verification code, that is close to decisive — legitimate organizations do not do this, ever.

## The actual test

Do not judge by tone. Judge by **what the message wants you to do**, and **what it costs you if it's fake**:

- Does it want money, and by a method that can't be undone (gift cards, wire, crypto, a payment app to a stranger)? → Very strong scam signal.
- Does it want a password, PIN, Social Security number, or a verification/one-time code? → Very strong scam signal. Real companies never ask for these.
- Does it want you to click a link to a website that is *not* the company's real one (a lookalike spelling, an unrelated domain dressed up with the brand name, a shortened link that hides where it goes)? → Strong scam signal.
- Does it just *tell* you something — an order shipped, an appointment is Tuesday, a code you requested — without asking you to pay, click somewhere unfamiliar, or hand over information? → That is what a legitimate message looks like.

A message that is urgent, generic, and slightly awkward but asks for nothing is far more likely to be clumsy marketing than a scam.

Details a stranger could not know — the last four digits of a card, a real order number you can look up, a named appointment time — are meaningful evidence the sender has a genuine relationship with the reader.

## Choosing a verdict

- **scam** — You are confident this is fraudulent. There is a clear ask that benefits the sender, and acting on it would cost the reader money, account access, or personal information.
- **uncertain_be_careful** — Genuinely mixed. Something is off, or there isn't enough context to be sure, but you cannot rule out that it's legitimate. Use this honestly rather than guessing. It is the right answer for a real-looking alert that you cannot verify.
- **likely_safe** — Consistent with a normal, legitimate message. No unreversible ask, no unfamiliar link, nothing secret requested.

## Confidence (0-100)

Report how sure you are of the verdict you chose.
- 90-100: unmistakable. Gift card demand, or an obvious impersonation with a fake website.
- 70-89: clear, with one or two strong signals and nothing contradicting them.
- 50-69: leaning, but genuinely arguable.
- Below 50: you should probably have chosen uncertain_be_careful.
Do not inflate confidence. A well-calibrated "I'm not sure" is more useful to this reader than a confident guess.

## Reasons (2-4 of them)

Each reason must:
- Be one sentence, under about 25 words.
- Point at something specific and checkable in **this** message — quote or paraphrase the actual words, name the actual website. Not "contains urgency indicators" but "It says your account closes in 24 hours to rush you".
- Be understandable with no technical background.
- Never be generic filler.

If the verdict is **likely_safe**, you must still give real reasons — say concretely why it looks fine ("It doesn't ask for money or personal details", "The link goes to the company's real website", "It names your actual order number"). Never say only "looks fine". A verdict with no reasoning teaches the reader nothing and makes the tool untrustworthy.

If the verdict is **scam** or **uncertain_be_careful**, make at least one reason something the reader can act on or verify independently — for example, calling the number on the back of their card instead of the one in the message.

**Never repeat a full card number or a Social Security number back in your reasons**, even if the message contains one. Say "your card number" or "your Social Security number" instead. Quoting the last four digits is fine. Naming a phone number, email address or website from the message is fine and often useful.

## cited_flags

List only the rules-layer flags you actually judged relevant to your verdict. If a flag fired but you decided it was a false alarm in context, leave it out. An empty list is fine.`;

/** JSON schema for the structured response. */
const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    verdict: {
      type: 'string',
      enum: VERDICTS,
      description: 'The overall judgement.',
    },
    confidence: {
      type: 'integer',
      description: 'How sure you are of the verdict, from 0 to 100.',
    },
    reasons: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Between 2 and 4 short, specific, plain-English reasons a non-technical reader can understand.',
    },
    cited_flags: {
      type: 'array',
      items: { type: 'string' },
      description:
        'The rules-layer flag ids you actually relied on. May be empty.',
    },
    calibration_note: {
      type: 'string',
      description:
        'One short internal sentence on why this confidence level. Not shown to the user.',
    },
  },
  required: ['verdict', 'confidence', 'reasons', 'cited_flags', 'calibration_note'],
  additionalProperties: false,
} as const;

/** Render the Layer 1 report as compact, readable evidence for the model. */
export function renderSignalsForPrompt(signals: SignalReport): string {
  const lines: string[] = [];

  const suspicious = signals.categories.filter(
    (c) => c.category !== 'legitimacy' && c.matches.length > 0
  );
  const legit = signals.categories.find((c) => c.category === 'legitimacy');

  lines.push(`Advisory heuristic risk score: ${signals.riskScore}/100 (NOT a verdict — a weighted sum of the patterns below.)`);
  lines.push('');

  if (suspicious.length === 0) {
    lines.push('SUSPICIOUS PATTERNS MATCHED: none.');
  } else {
    lines.push('SUSPICIOUS PATTERNS MATCHED:');
    for (const cat of suspicious) {
      for (const m of cat.matches) {
        lines.push(`- [${m.flag}] ${m.detail ?? ''} (matched text: "${m.evidence}")`);
      }
    }
  }
  lines.push('');

  if (legit && legit.matches.length > 0) {
    lines.push('COUNTER-EVIDENCE SUGGESTING IT MAY BE LEGITIMATE:');
    for (const m of legit.matches) {
      lines.push(`- [${m.flag}] ${m.detail ?? ''}`);
    }
  } else {
    lines.push('COUNTER-EVIDENCE SUGGESTING IT MAY BE LEGITIMATE: none found.');
  }
  lines.push('');

  if (signals.urls.length > 0) {
    lines.push('LINKS FOUND:');
    for (const u of signals.urls) {
      const notes: string[] = [];
      if (u.isShortener) notes.push('link shortener, destination hidden');
      if (u.isIpLiteral) notes.push('bare IP address, no domain name');
      if (u.lookalikeOf) notes.push(`appears to imitate ${u.lookalikeOf}`);
      if (u.suspiciousTld) notes.push(`unusual domain ending .${u.suspiciousTld}`);
      if (u.displayTextMismatch) {
        notes.push(
          `displayed as ${u.displayTextMismatch.shown} but goes to ${u.displayTextMismatch.actual}`
        );
      }
      if (u.subdomainDepth > 2) notes.push(`${u.subdomainDepth} subdomain levels`);
      lines.push(
        `- ${u.raw} → real domain: ${u.registrableDomain ?? 'unknown'}${
          notes.length ? ` (${notes.join('; ')})` : ' (nothing unusual detected)'
        }`
      );
    }
  } else {
    lines.push('LINKS FOUND: none.');
  }
  lines.push('');

  lines.push(
    `ORGANIZATIONS THE MESSAGE CLAIMS TO BE: ${
      signals.claimedOrganizations.length
        ? signals.claimedOrganizations.join(', ')
        : 'none named'
    }`
  );
  lines.push(
    `TEXT STATS: ${signals.stats.wordCount} words, ${signals.stats.linkCount} links, ` +
      `${signals.stats.allCapsWordCount} shouted words, ` +
      `${(signals.stats.nonAsciiRatio * 100).toFixed(1)}% unusual characters`
  );

  return lines.join('\n');
}

function buildUserMessage(text: string, signals: SignalReport): string {
  return [
    'Here is the message someone received. Decide whether it is a scam.',
    '',
    '<message>',
    text,
    '</message>',
    '',
    '<signal_report>',
    renderSignalsForPrompt(signals),
    '</signal_report>',
  ].join('\n');
}

export class ClassifierUnavailableError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'ClassifierUnavailableError';
  }
}

/**
 * Run the classification agent. Throws ClassifierUnavailableError if the model
 * could not produce a usable answer — callers fall back to the rules layer.
 */
export async function classify(
  text: string,
  signals: SignalReport
): Promise<Classification> {
  if (!hasApiKey()) {
    throw new ClassifierUnavailableError('ANTHROPIC_API_KEY is not set');
  }

  let response;
  try {
    response = await client().beta.messages.create({
      model: classifierModel(),
      max_tokens: 4096,
      // Server-side fallback: if safety classifiers decline the request, the
      // API retries on another model rather than returning nothing. Scam text
      // is benign, but this makes the demo resilient to a false positive.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: EFFORT,
        format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
      },
      // The system prompt is ~1800 static tokens and is byte-identical on every
      // request, so caching it removes it from the critical path after the first
      // check. Matters for a live demo: the second message someone pastes is
      // noticeably faster than the first.
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: buildUserMessage(text, signals) }],
    } as Anthropic.Beta.Messages.MessageCreateParamsNonStreaming);
  } catch (err) {
    throw new ClassifierUnavailableError(
      `Claude API call failed: ${err instanceof Error ? err.message : String(err)}`,
      err
    );
  }

  // Safety classifiers can decline a request. Check before reading content.
  if (response.stop_reason === 'refusal') {
    throw new ClassifierUnavailableError('The model declined to classify this message');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new ClassifierUnavailableError('The model response was cut off');
  }

  const raw = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  if (!raw) {
    throw new ClassifierUnavailableError('The model returned an empty response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ClassifierUnavailableError(`The model returned unparseable output`);
  }

  return coerce(parsed, signals);
}

/**
 * Validate and normalize the model's output. The JSON schema guarantees the
 * shape, but not the ranges or counts — those are enforced here so a
 * misbehaving response can never reach the API surface malformed.
 */
function coerce(parsed: unknown, signals: SignalReport): Classification {
  const obj = parsed as Record<string, unknown>;

  const verdict = VERDICTS.includes(obj.verdict as Verdict)
    ? (obj.verdict as Verdict)
    : 'uncertain_be_careful';

  const rawConfidence = Number(obj.confidence);
  const confidence = Number.isFinite(rawConfidence)
    ? Math.max(0, Math.min(100, Math.round(rawConfidence)))
    : 50;

  // Defence in depth: the system prompt tells the model not to repeat card
  // numbers or SSNs, and this guarantees it even if the model does anyway.
  // Without it, a pasted message containing the user's own card number comes
  // straight back out in a reason and into any intermediary's request logs.
  const reasons = Array.isArray(obj.reasons)
    ? obj.reasons
        .filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
        .map((r) => redactHighRisk(r.trim()))
        .slice(0, 4)
    : [];

  if (reasons.length === 0) {
    reasons.push(
      'We could not produce a detailed explanation for this message — treat it with caution and verify with the sender directly.'
    );
  }

  const known = new Set(signals.flagsDetected);
  const citedFlags = Array.isArray(obj.cited_flags)
    ? (obj.cited_flags.filter(
        (f): f is FlagId => typeof f === 'string' && known.has(f as FlagId)
      ) as FlagId[])
    : [];

  return {
    verdict,
    confidence,
    reasons,
    citedFlags,
    calibrationNote:
      typeof obj.calibration_note === 'string' ? obj.calibration_note : undefined,
  };
}
