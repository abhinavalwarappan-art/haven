/**
 * Privacy hygiene. The product's whole pitch is digital trust, so raw pasted
 * text — which routinely contains the user's own name, account numbers and
 * phone numbers — must never reach the database or the logs.
 *
 * Rules enforced here:
 *   1. Only a salted hash of the input is persisted.
 *   2. Anything that gets logged is redacted first.
 *   3. Evidence snippets kept in the response are short and bounded.
 */

import { createHmac } from 'node:crypto';

const DEFAULT_SALT = 'change-me-in-production';

/**
 * Salted HMAC of the input. Lets us count duplicates and rate-limit repeat
 * submissions without being able to recover what anyone pasted.
 *
 * We normalize whitespace/case first so trivially-different pastes of the same
 * scam collapse to one hash — useful for a "seen N times tonight" demo counter.
 */
export function hashInput(text: string): string {
  const salt = process.env.HASH_SALT || DEFAULT_SALT;
  const canonical = text.trim().toLowerCase().replace(/\s+/g, ' ');
  return createHmac('sha256', salt).update(canonical).digest('hex');
}

/** True when the deployment is still using the placeholder salt. */
export function isUsingDefaultSalt(): boolean {
  return (process.env.HASH_SALT || DEFAULT_SALT) === DEFAULT_SALT;
}

const REDACTIONS: Array<[RegExp, string]> = [
  // Emails
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]'],
  // Card-like runs of 13-19 digits, optionally separated
  [/\b(?:\d[ -]?){13,19}\b/g, '[card]'],
  // US-style phone numbers
  [/\+?\d{0,2}[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, '[phone]'],
  // SSN
  [/\b\d{3}-\d{2}-\d{4}\b/g, '[ssn]'],
  // Long digit runs (account/order numbers)
  [/\b\d{7,}\b/g, '[number]'],
];

/**
 * Strip obvious PII. Used on anything headed for stdout or an error report.
 * This is defense in depth, not a substitute for simply not logging the text.
 */
export function redact(text: string): string {
  return REDACTIONS.reduce((acc, [pattern, mask]) => acc.replace(pattern, mask), text);
}

/**
 * Redact only the identifiers that have no legitimate reason to appear in an
 * explanation shown back to the user: full card numbers and Social Security
 * numbers.
 *
 * Applied to the model's written reasons. Deliberately narrower than
 * `redact()` — naming the scammer's phone number or email address is useful,
 * actionable advice ("don't call (872) 214-0083"), so those are left intact.
 * A card number or SSN in a reason is pure liability with no upside.
 */
const HIGH_RISK: Array<[RegExp, string]> = [
  [/\b(?:\d[ -]?){13,19}\b/g, 'your card number'],
  [/\b\d{3}-\d{2}-\d{4}\b/g, 'your Social Security number'],
];

export function redactHighRisk(text: string): string {
  return HIGH_RISK.reduce((acc, [pattern, mask]) => acc.replace(pattern, mask), text);
}

/** Bound an evidence snippet so a detector can never echo a whole message. */
export function clipEvidence(text: string, max = 80): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= max) return collapsed;
  return `${collapsed.slice(0, max - 1)}…`;
}

/**
 * A short, redacted preview for human-readable test output only.
 * Never persisted and never returned by the API.
 */
export function previewForReport(text: string, max = 90): string {
  return clipEvidence(redact(text), max);
}
