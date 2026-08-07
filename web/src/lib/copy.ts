import type { Verdict } from './types';

/* ═══════════════════════════════════════════════════════════════════════════
   The guiding rule for every string in this file: it is being read by a
   worried non-technical person, possibly in their seventies. No jargon, no
   percentages, no security vocabulary. Say what happened and what to do.
   ═══════════════════════════════════════════════════════════════════════════ */

interface VerdictCopy {
  eyebrow: string;
  headline: string;
  /** The closing line of the letter. Null when there is nothing to advise. */
  advice: string | null;
}

/** The headline is a sentence a person would say out loud. "Likely a scam" is
 *  a label; "This looks like a scam" is a verdict. */
export const VERDICT_COPY: Record<Verdict, VerdictCopy> = {
  scam: {
    eyebrow: 'Our answer',
    headline: 'This looks like a scam.',
    advice:
      "Don’t reply, don’t click anything in it, and don’t send money or codes. If it claims to be from a company you use, contact them with a number you already have, never one from this message.",
  },
  uncertain_be_careful: {
    eyebrow: 'Our answer',
    headline: 'Be careful with this one.',
    advice:
      "We couldn’t rule it out either way. Before you act on it, check with the sender directly using contact details you already have.",
  },
  likely_safe: {
    eyebrow: 'Our answer',
    headline: 'This looks legitimate.',
    advice: null,
  },
};

/**
 * Turn a 0-100 confidence into something a person understands.
 *
 * Never show the raw number. "84%" invites the reader to do arithmetic about
 * their own risk, which is exactly the wrong cognitive task. For the uncertain
 * verdict, high confidence means "confidently ambiguous", so it needs its own
 * phrasing rather than sounding like a weak scam call.
 */
export function confidenceCopy(verdict: Verdict, confidence: number): string {
  if (verdict === 'uncertain_be_careful') {
    return 'This one is genuinely unclear. There are signs both ways.';
  }
  const subject = verdict === 'scam' ? 'it is a scam' : 'it is genuine';
  if (confidence >= 92) return `We’re very confident ${subject}.`;
  if (confidence >= 80) return `We’re confident ${subject}.`;
  if (confidence >= 68) return `We’re fairly confident ${subject}.`;
  return `We lean towards this, but we’re not certain.`;
}

/* Honest narration beats a spinner: these track what the pipeline is genuinely
   doing, in order.

   Paced for the current ~1.5s check. The previous cadence was built for a ~6s
   wait: at 1.9s a step, a fast check showed one line and the bar crawled to 15%
   before the answer arrived, which read as a stutter rather than progress.
   Steps advance at 600ms so a typical check shows two or three, while still
   degrading sensibly if a cold start takes several seconds. */
export const THINKING_STEPS = [
  'Reading the message…',
  'Checking where the links really go…',
  'Looking for pressure tactics…',
  'Weighing it all up…',
  'Almost there…',
] as const;

export const STEP_MS = 600;

export const MAX_LENGTH = 20_000;
export const WARN_AT = 16_000;
