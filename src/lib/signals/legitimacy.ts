/**
 * Counter-evidence: reasons a message looks legitimate.
 *
 * This detector exists because of the hardest requirement in the product — not
 * crying wolf. A real bank fraud alert contains urgency ("unusual activity"),
 * a brand name, and a call to action. If Layer 1 only ever accumulated
 * suspicion, every legitimate alert would score as a scam.
 *
 * So we also look for the things scams structurally *cannot* fake cheaply:
 * personal details the sender could only know from a real account relationship,
 * a genuine brand domain, a compliant opt-out footer, and — most importantly —
 * the absence of any ask.
 */

import type { FlagId, SignalMatch, UrlFinding } from '../types.js';
import type { NormalizedText } from '../normalize.js';
import { clipEvidence } from '../privacy.js';

interface Detected {
  matches: SignalMatch[];
  legitimacyFlags: FlagId[];
}

/** Details a stranger would not have: last-4s, order numbers, appointment times. */
const PERSONALIZED: Array<{ re: RegExp; detail: string }> = [
  {
    re: /\b(?:ending in|ending with|last four|last 4|\*{2,}|x{4,})\s*[-–]?\s*\d{4}\b/gi,
    detail: 'references the last four digits of a specific card or account',
  },
  {
    re: /\b(?:order|tracking|confirmation|reference|case|policy|invoice|claim)\s*(?:#|number|no\.?|id)?\s*[:#]?\s*[A-Z0-9][A-Z0-9-]{5,}\b/gi,
    detail: 'includes a specific order or tracking number you can look up independently',
  },
  {
    re: /\b(?:appointment|reservation|booking|visit)\b.{0,60}\b(?:on|at)\b.{0,30}\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi,
    detail: 'names a specific appointment date and time',
  },
  {
    re: /\bdr\.?\s+[a-z]+\b|\bwith\s+dr\b/gi,
    detail: 'names a specific person you have a relationship with',
  },
];

/** Opt-out footers are a legal requirement for real bulk senders. */
const OPTOUT_RE =
  /\b(?:reply|text)\s+stop\b|\bstop\s*(?:to|2)\s*(?:opt.?out|cancel|end|unsubscribe)\b|\bunsubscribe\b|\bmsg\s*&?\s*data rates\b|\bstd (?:msg|rates) (?:&|and) data\b/gi;

/**
 * Phrases that indicate the message is purely informational — it tells you
 * something and asks nothing of you. The single strongest legitimacy signal.
 */
const NO_ACTION_RE =
  /\b(?:no action (?:is )?(?:needed|required)|nothing (?:to do|is needed)|for your records|this is (?:just )?a (?:reminder|confirmation|receipt|notification)|you don'?t need to (?:do|reply)|if this was you,? (?:you can )?(?:ignore|disregard))\b/gi;

/** Asks that would make a message actionable (and therefore exploitable). */
const ACTION_RE =
  /\b(?:click|tap|visit|go to|log ?in|sign ?in|verify|confirm|update|pay|send|call|reply|respond|download|install|enter|provide|share)\b/gi;

export function detectLegitimacy(
  text: NormalizedText,
  urls: UrlFinding[],
  hasPaymentSignal: boolean,
  hasUrgencySignal: boolean
): Detected {
  const matches: SignalMatch[] = [];
  const flags: FlagId[] = [];

  const add = (flag: FlagId, evidence: string, index: number, detail: string) => {
    matches.push({ flag, evidence: clipEvidence(evidence), index, detail });
    flags.push(flag);
  };

  // 1. No links at all — nothing to phish with.
  if (urls.length === 0) {
    add('no_links_present', '(no links)', 0, 'contains no links at all, so there is nothing to click that could steal your information');
  }

  // 2. No payment request.
  if (!hasPaymentSignal) {
    add('no_payment_request', '(no payment ask)', 0, 'does not ask you for money or payment of any kind');
  }

  // 3. No pressure.
  if (!hasUrgencySignal) {
    add('no_urgency_pressure', '(no pressure)', 0, 'does not pressure you to act immediately');
  }

  // 4. Details only a real sender would have.
  for (const { re, detail } of PERSONALIZED) {
    re.lastIndex = 0;
    const m = re.exec(text.display);
    if (m) {
      add('personalized_details', m[0], m.index, detail);
      break;
    }
  }

  // 5. Genuine brand domain (set by the link detector; mirrored here as a flag).
  const genuine = urls.find((u) => u.lookalikeOf === null && u.registrableDomain && !u.isShortener && !u.suspiciousTld && !u.isIpLiteral);
  if (genuine?.registrableDomain && urls.every((u) => !u.lookalikeOf && !u.isShortener && !u.isIpLiteral)) {
    add(
      'recognized_brand_domain',
      genuine.registrableDomain,
      0,
      `every link points to ${genuine.registrableDomain}, not a lookalike or a hidden shortener`
    );
  }

  // 6. Compliant opt-out footer.
  OPTOUT_RE.lastIndex = 0;
  const optout = OPTOUT_RE.exec(text.matchable);
  if (optout) {
    add('standard_optout_footer', optout[0], optout.index, 'includes a standard "reply STOP to unsubscribe" footer that real bulk senders are legally required to provide');
  }

  // 7. Explicitly asks nothing of you.
  NO_ACTION_RE.lastIndex = 0;
  const noAction = NO_ACTION_RE.exec(text.matchable);
  ACTION_RE.lastIndex = 0;
  const hasAction = ACTION_RE.test(text.matchable);
  if (noAction) {
    add('no_action_requested', noAction[0], noAction.index, 'explicitly tells you that no action is needed');
  } else if (!hasAction && urls.length === 0) {
    add('no_action_requested', '(informational only)', 0, 'is purely informational — it does not ask you to click, pay, call or reply');
  }

  return { matches, legitimacyFlags: flags };
}
