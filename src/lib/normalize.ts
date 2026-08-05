/**
 * Text normalization shared by every detector.
 *
 * Scam text is adversarial: attackers pad with zero-width spaces, swap Cyrillic
 * lookalikes for Latin letters, and break up keywords ("g i f t  c a r d") to
 * dodge naive keyword filters. Normalizing once, up front, means each detector
 * can stay a simple pattern match.
 */

/** Confusable characters mapped to their Latin equivalent. */
const CONFUSABLES: Record<string, string> = {
  // Cyrillic
  а: 'a', в: 'b', с: 'c', е: 'e', н: 'h', к: 'k', м: 'm', о: 'o',
  р: 'p', ѕ: 's', т: 't', у: 'y', х: 'x', і: 'i', ј: 'j',
  // Greek
  α: 'a', β: 'b', ε: 'e', ι: 'i', κ: 'k', ο: 'o', ρ: 'p', τ: 't', υ: 'u', χ: 'x',
  // Fullwidth
  '？': '?', '！': '!', '．': '.', '：': ':', '／': '/',
};

/** Invisible characters used to break up keywords. */
const INVISIBLE = /[­​-‏‪-‮⁠-⁤﻿]/g;

export interface NormalizedText {
  /** Lowercased, confusable-folded, invisible-stripped. For pattern matching. */
  matchable: string;
  /**
   * Lowercased and invisible-stripped, but NOT confusable-folded.
   *
   * Needed because folding is lossy in a way that matters: "раypal.com" written
   * with Cyrillic р and а folds to the genuine "paypal.com", which would make an
   * impersonation domain look like the real brand. Detectors that care about
   * authenticity must consult this, not `matchable`.
   */
  unfolded: string;
  /** Whitespace-collapsed original case. For evidence snippets. */
  display: string;
  /** The untouched input. */
  original: string;
  nonAsciiRatio: number;
  /** True when at least one confusable character was folded away. */
  hadConfusables: boolean;
}

export function normalize(input: string): NormalizedText {
  const original = input;

  // NFKC folds fullwidth/styled unicode (𝗔𝗖𝗧 𝗡𝗢𝗪 → ACT NOW) into plain forms.
  const nfkc = input.normalize('NFKC').replace(INVISIBLE, '');

  const nonAscii = [...nfkc].filter((ch) => ch.charCodeAt(0) > 127).length;
  const nonAsciiRatio = nfkc.length > 0 ? nonAscii / nfkc.length : 0;

  const lowered = nfkc.toLowerCase();

  let hadConfusables = false;
  const folded = [...lowered]
    .map((ch) => {
      const swap = CONFUSABLES[ch];
      if (swap !== undefined) hadConfusables = true;
      return swap ?? ch;
    })
    .join('');

  return {
    matchable: collapseSpacedOutLetters(folded),
    unfolded: lowered,
    display: nfkc.replace(/[ \t]+/g, ' ').trim(),
    original,
    nonAsciiRatio,
    hadConfusables,
  };
}

/** Single letters that are real English words and must not be absorbed. */
const STANDALONE_WORDS = new Set(['a', 'i']);

/**
 * Collapse deliberate letter-spacing ("g i f t  c a r d" → "giftcard") while
 * leaving normal prose alone. Only fires on runs of 4+ single letters.
 *
 * Leading "a"/"i" are preserved as their own words — otherwise "buy a g i f t
 * c a r d" collapses to "agiftcard" and the word boundary the payment detector
 * needs disappears, which is exactly the evasion we are trying to catch.
 */
function collapseSpacedOutLetters(text: string): string {
  return text.replace(/(?:\b[a-z]\s+){3,}[a-z]\b/g, (run) => {
    const letters = run.split(/\s+/).filter(Boolean);
    const prefix: string[] = [];
    while (letters.length > 4 && STANDALONE_WORDS.has(letters[0]!)) {
      prefix.push(letters.shift()!);
    }
    if (letters.length < 4) return run;
    return [...prefix, letters.join('')].join(' ');
  });
}

/** Count words in ALL CAPS in the original — a shouting/pressure indicator. */
export function countAllCapsWords(text: string): number {
  const words = text.match(/\b[A-Z]{3,}\b/g) ?? [];
  // Common legitimate acronyms shouldn't count as shouting.
  const allowed = new Set([
    'USPS', 'FedEx', 'UPS', 'DHL', 'IRS', 'SSA', 'FBI', 'ATM', 'PIN', 'USA',
    'USD', 'FAQ', 'CEO', 'HTTP', 'HTTPS', 'URL', 'SMS', 'ID', 'OTP', 'DMV',
    'STOP', 'HELP', 'END', 'PM', 'AM', 'EST', 'PST', 'CST', 'MST',
  ].map((w) => w.toUpperCase()));
  return words.filter((w) => !allowed.has(w)).length;
}

export function countWords(text: string): number {
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}
