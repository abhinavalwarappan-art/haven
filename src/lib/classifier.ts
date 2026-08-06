/**
 * Layer 2: the AI classification agent (Google Gemini).
 *
 * Takes the original text plus the Layer 1 signal report and produces a
 * verdict, a confidence level, and 2-4 plain-English reasons.
 *
 * Design notes that matter for classification quality:
 *
 *  - Structured output is enforced with a `responseSchema` and
 *    `responseMimeType: application/json`, not parsed out of free text, so the
 *    API response shape is reliable.
 *  - The prompt is explicit that Layer 1 hits are *evidence, not proof*. This
 *    is the single most important instruction in the system: without it the
 *    model rubber-stamps the rules layer and flags every legitimate bank alert
 *    that happens to contain the word "urgent".
 *  - Nothing here is provider-specific beyond this file. The pipeline calls
 *    `classify()` and gets a `Classification` back; swapping models again means
 *    editing this file alone.
 */

import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import type {
  Classification,
  FlagId,
  SignalReport,
  Verdict,
} from './types.js';
import { redactHighRisk } from './privacy.js';

const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
const VERDICTS: Verdict[] = ['scam', 'likely_safe', 'uncertain_be_careful'];

/**
 * Hard ceiling on how long a user waits before we give them the rules-only
 * answer instead. Someone staring at a suspicious text will not wait a minute.
 * A fast, honest "be careful" beats a slow perfect answer.
 */
const REQUEST_TIMEOUT_MS = Number(process.env.CLASSIFIER_TIMEOUT_MS || 20_000);

/**
 * Effort maps to Gemini's thinking budget (tokens the model may spend
 * reasoning before it answers). This is a short, well-scoped classification,
 * so `low` is the default — measured as accurate as higher settings on the
 * evaluation set while keeping the wait tolerable.
 */
const THINKING_BUDGET: Record<string, number> = {
  low: 512,
  medium: 2048,
  high: 8192,
};

function effort(): string {
  return process.env.CLASSIFIER_EFFORT || 'low';
}

let cached: GoogleGenAI | null = null;

function client(): GoogleGenAI {
  if (!cached) {
    cached = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return cached;
}

export function classifierModel(): string {
  return process.env.CLASSIFIER_MODEL || DEFAULT_MODEL;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
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

**One case needs care, because the obvious reading is the wrong one.** When a message asks for money by a method that cannot be reversed — a payment app, a wire, a bank transfer, gift cards — the question is NOT "does this sender sound like a stranger?" It is "can the reader confirm these payment details actually belong to who they think, and what happens if they can't?"

A plausible backstory is not verification. Invoice-redirect fraud works precisely *because* the job, the tradesperson and the amount are all real — the scammer intercepts a genuine invoice and swaps in their own payment details, often with a reason the usual method is unavailable. So a request to send a substantial sum to a personal email address or phone number, especially alongside "our card reader is down" or any other reason to deviate from the normal way of paying, is **at minimum uncertain_be_careful** — never likely_safe — even when everything else about it reads as genuine. The correct advice is always to confirm the payment details by calling the number the reader already has, not one in the message.

This is not about assuming bad faith. It is that "likely_safe" on an irreversible payment the reader cannot verify is advice that costs them everything if you are wrong, and costs them one phone call if you are right.

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

/**
 * Response schema. Gemini accepts a subset of OpenAPI 3 — objects, arrays,
 * primitives, and enums. Numeric ranges and array-length bounds are not
 * enforced here, so `coerce()` clamps them below.
 */
const RESPONSE_SCHEMA = {
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
      description: 'The rules-layer flag ids you actually relied on. May be empty.',
    },
    calibration_note: {
      type: 'string',
      description: 'One short internal sentence on why this confidence level. Not shown to the user.',
    },
  },
  required: ['verdict', 'confidence', 'reasons', 'cited_flags', 'calibration_note'],
  propertyOrdering: ['verdict', 'confidence', 'reasons', 'cited_flags', 'calibration_note'],
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
    throw new ClassifierUnavailableError('GEMINI_API_KEY is not set');
  }

  // The SDK has no per-request timeout option, so race it. Without this a
  // stalled upstream call would hold the user past any tolerable wait.
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`timed out after ${REQUEST_TIMEOUT_MS}ms`)),
      REQUEST_TIMEOUT_MS
    ).unref?.()
  );

  let response: GenerateContentResponse;
  try {
    response = await Promise.race([
      client().models.generateContent({
        model: classifierModel(),
        contents: buildUserMessage(text, signals),
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
          thinkingConfig: {
            thinkingBudget: THINKING_BUDGET[effort()] ?? THINKING_BUDGET.low!,
          },
        },
      }),
      timeout,
    ]);
  } catch (err) {
    throw new ClassifierUnavailableError(
      `Gemini API call failed: ${err instanceof Error ? err.message : String(err)}`,
      err
    );
  }

  // Safety filters can block a request outright. Check before reading text.
  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    throw new ClassifierUnavailableError(
      `The model declined to classify this message (${blockReason})`
    );
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    throw new ClassifierUnavailableError(
      `The model stopped early (${finishReason})`
    );
  }

  const raw = (response.text ?? '').trim();
  if (!raw) {
    throw new ClassifierUnavailableError('The model returned an empty response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ClassifierUnavailableError('The model returned unparseable output');
  }

  // A JSON body that isn't an object would make property access throw outside
  // the guarded block above, surfacing as a 500 instead of a clean fallback.
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ClassifierUnavailableError('The model returned a non-object response');
  }

  return coerce(parsed, signals);
}

/**
 * Validate and normalize the model's output. The response schema guarantees the
 * shape, but not the ranges or counts — those are enforced here so a
 * misbehaving response can never reach the API surface malformed.
 */
function coerce(parsed: object, signals: SignalReport): Classification {
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
