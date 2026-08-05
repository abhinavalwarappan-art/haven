/**
 * Payment-method detection.
 *
 * This is the single highest-signal category in the whole system. Legitimate
 * organizations essentially never ask to be paid in gift cards, wire transfers,
 * crypto, or peer-to-peer apps — those rails are chosen precisely because they
 * are irreversible. A confident hit here is close to decisive.
 */

import type { FlagId, SignalMatch } from '../types.js';
import type { NormalizedText } from '../normalize.js';
import { clipEvidence } from '../privacy.js';

interface Pattern {
  re: RegExp;
  flag: FlagId;
  detail: string;
}

const PATTERNS: Pattern[] = [
  // Gift cards — the classic. Almost never legitimate as a payment demand.
  {
    re: /\b(?:gift|prepaid|itunes|apple|google play|steam|amazon|visa)\s*(?:card|gift ?card)s?\b/g,
    flag: 'gift_card_request',
    detail: 'mentions gift cards, which no real agency or company accepts as payment',
  },
  {
    re: /\b(?:buy|purchase|get|send|scratch|redeem)\b.{0,40}\b(?:gift ?card|prepaid card|voucher)s?\b/g,
    flag: 'gift_card_request',
    detail: 'asks the reader to buy or send gift cards',
  },
  {
    re: /\b(?:card )?(?:code|pin)s?\b.{0,30}\b(?:back|to me|photo|picture|scratch)/g,
    flag: 'gift_card_request',
    detail: 'asks for the codes off the back of a card',
  },

  // Wire transfer
  {
    re: /\b(?:wire|western union|moneygram|bank transfer|money order)\b/g,
    flag: 'wire_transfer_request',
    detail: 'requests a wire transfer, which cannot be reversed',
  },
  {
    re: /\b(?:routing|account) number\b.{0,40}\b(?:send|provide|confirm|reply|need)/g,
    flag: 'wire_transfer_request',
    detail: 'asks for bank routing or account numbers',
  },

  // Crypto
  {
    re: /\b(?:bitcoin|btc|ethereum|eth|usdt|tether|crypto(?:currency)?|binance|coinbase)\b/g,
    flag: 'crypto_payment_request',
    detail: 'involves cryptocurrency, which is irreversible and untraceable',
  },
  {
    re: /\b(?:bitcoin|crypto|btc)\s*(?:atm|machine|wallet|address)\b/g,
    flag: 'crypto_payment_request',
    detail: 'directs the reader to a crypto ATM or wallet address',
  },
  // Bare wallet addresses
  {
    re: /\b(?:bc1[a-z0-9]{20,}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-f0-9]{40})\b/g,
    flag: 'crypto_payment_request',
    detail: 'contains a cryptocurrency wallet address',
  },

  // Peer-to-peer apps
  {
    re: /\b(?:zelle|venmo|cash ?app|paypal (?:friends|f&f)|apple ?pay|\$cashtag)\b/g,
    flag: 'p2p_payment_request',
    detail: 'directs payment through a peer-to-peer app with no buyer protection',
  },
  {
    re: /\bsend\b.{0,25}\b(?:zelle|venmo|cash ?app)\b/g,
    flag: 'p2p_payment_request',
    detail: 'asks the reader to send money via a P2P app',
  },

  // Unexpected fees — the delivery/customs scam shape
  {
    re: /\b(?:small |a |outstanding |unpaid |shipping |customs |redelivery |handling |processing )?(?:fee|charge|toll|duty|tax|balance)\b.{0,50}\b(?:pay|settle|clear|submit|due|owed|outstanding)/g,
    flag: 'unexpected_fee_request',
    detail: 'asks for an unexpected fee',
  },
  {
    re: /\b(?:pay|settle|clear|remit)\b.{0,40}\b(?:\$|usd|dollars?)\s?\d/g,
    flag: 'unexpected_fee_request',
    detail: 'asks for a specific payment amount',
  },
  {
    re: /\b(?:processing|redelivery|shipping|customs|clearance|activation) fee\b/g,
    flag: 'unexpected_fee_request',
    detail: 'names a fee that legitimate carriers do not charge by text',
  },
];

export function detectPayment(text: NormalizedText): SignalMatch[] {
  const matches: SignalMatch[] = [];
  const seen = new Set<FlagId>();

  for (const { re, flag, detail } of PATTERNS) {
    re.lastIndex = 0;
    const m = re.exec(text.matchable);
    if (!m) continue;
    // Record the most specific detail per flag, but only once.
    if (seen.has(flag)) continue;
    seen.add(flag);
    matches.push({ flag, evidence: clipEvidence(m[0]), index: m.index, detail });
  }

  return matches;
}
