/**
 * Layer 1 entry point: run every detector and assemble the structured signal
 * object that Layer 2 receives as evidence.
 *
 * This layer is deliberately fast, deterministic and offline. It never decides
 * anything on its own — `riskScore` is advisory input, not a verdict.
 */

import type {
  CategoryResult,
  FlagId,
  SignalMatch,
  SignalReport,
} from '../types.js';
import { countAllCapsWords, countWords, normalize } from '../normalize.js';
import { detectPressure } from './urgency.js';
import { detectPayment } from './payment.js';
import { detectLinks } from './links.js';
import { detectImpersonation } from './impersonation.js';
import { detectLegitimacy } from './legitimacy.js';

/**
 * Advisory weights. Payment demands and lookalike domains are near-decisive;
 * urgency alone is close to worthless because legitimate senders use it too.
 */
const WEIGHTS: Record<FlagId, number> = {
  // Payment — strongest positive evidence of a scam.
  gift_card_request: 40,
  wire_transfer_request: 28,
  crypto_payment_request: 30,
  p2p_payment_request: 22,
  unexpected_fee_request: 22,

  // Links
  lookalike_domain: 38,
  deep_subdomain_spoof: 34,
  link_text_mismatch: 30,
  ip_address_url: 26,
  url_shortener: 14,
  suspicious_tld: 16,

  // Credentials and control
  raw_credential_request: 36,

  // Pressure — weak on its own, meaningful in combination.
  urgency_language: 8,
  threat_language: 20,
  account_suspension_threat: 12,

  // Identity
  impersonates_organization: 4,
  generic_greeting: 6,
  contact_channel_switch: 18,
  unsolicited_relationship_opener: 26,
  prize_or_windfall: 26,

  // Counter-evidence — negative weights.
  no_links_present: -12,
  no_payment_request: -8,
  no_urgency_pressure: -10,
  personalized_details: -16,
  recognized_brand_domain: -18,
  standard_optout_footer: -10,
  no_action_requested: -14,
};

const LEGITIMACY_FLAGS = new Set<FlagId>([
  'no_links_present',
  'no_payment_request',
  'no_urgency_pressure',
  'personalized_details',
  'recognized_brand_domain',
  'standard_optout_footer',
  'no_action_requested',
]);

export function analyzeSignals(input: string): SignalReport {
  const text = normalize(input);

  const pressure = detectPressure(text);
  const payment = detectPayment(text);
  const { findings: urls, matches: linkMatches } = detectLinks(text);
  const { matches: identity, claimedOrganizations } = detectImpersonation(text);

  const hasPayment = payment.length > 0;
  const hasUrgency = pressure.some(
    (m) => m.flag === 'urgency_language' || m.flag === 'threat_language'
  );

  const { matches: legitimacy } = detectLegitimacy(text, urls, hasPayment, hasUrgency);

  // `recognized_brand_domain` can be raised by both the link and legitimacy
  // detectors; dedupe by flag+index so it is only counted once.
  const categories: CategoryResult[] = [
    { category: 'pressure', matches: pressure },
    { category: 'payment', matches: payment },
    { category: 'links', matches: linkMatches },
    { category: 'identity', matches: identity },
    { category: 'legitimacy', matches: legitimacy },
  ];

  const all: SignalMatch[] = categories.flatMap((c) => c.matches);
  const flagsDetected = dedupe(all.map((m) => m.flag));
  const legitimacySignals = flagsDetected.filter((f) => LEGITIMACY_FLAGS.has(f));

  return {
    flagsDetected,
    legitimacySignals,
    categories,
    urls,
    claimedOrganizations,
    riskScore: score(flagsDetected, urls.length),
    stats: {
      charCount: input.length,
      wordCount: countWords(input),
      linkCount: urls.length,
      nonAsciiRatio: Number(text.nonAsciiRatio.toFixed(3)),
      allCapsWordCount: countAllCapsWords(input),
    },
  };
}

function dedupe(flags: FlagId[]): FlagId[] {
  return [...new Set(flags)];
}

/**
 * Advisory 0-100 score. Deliberately conservative: a single weak signal should
 * never land in scam territory, which is why urgency alone tops out around 8.
 */
function score(flags: FlagId[], linkCount: number): number {
  let raw = 0;
  for (const flag of flags) raw += WEIGHTS[flag] ?? 0;

  // Combination bonus: pressure + a way to pay or click is the actual scam
  // shape. Neither half alone means much.
  const hasPressure = flags.some((f) =>
    ['urgency_language', 'threat_language', 'account_suspension_threat'].includes(f)
  );
  const hasHook = flags.some((f) =>
    [
      'gift_card_request', 'wire_transfer_request', 'crypto_payment_request',
      'p2p_payment_request', 'unexpected_fee_request', 'raw_credential_request',
      'lookalike_domain', 'deep_subdomain_spoof', 'url_shortener',
      'link_text_mismatch', 'ip_address_url',
    ].includes(f)
  );
  if (hasPressure && hasHook) raw += 15;

  // An impersonated brand plus any dodgy link is the phishing template.
  if (flags.includes('impersonates_organization') && linkCount > 0 && hasHook) {
    raw += 10;
  }

  return Math.max(0, Math.min(100, Math.round(raw)));
}

export { WEIGHTS, LEGITIMACY_FLAGS };
