/**
 * Identity and social-engineering cues.
 *
 * Detects who the message *claims* to be, plus the setups that only ever appear
 * in scams: unsolicited "hi dear" openers, requests to move to WhatsApp/Telegram,
 * prize announcements for contests you never entered, and demands for the codes
 * that are explicitly never supposed to be shared.
 */

import type { FlagId, SignalMatch } from '../types.js';
import type { NormalizedText } from '../normalize.js';
import { clipEvidence } from '../privacy.js';

/** Organizations commonly impersonated, matched by how they'd be named in text. */
const ORGANIZATIONS: Array<{ label: string; re: RegExp }> = [
  { label: 'USPS', re: /\bu\.?s\.?p\.?s\.?\b|\bunited states postal\b|\bpostal service\b/g },
  { label: 'FedEx', re: /\bfedex\b|\bfed ex\b/g },
  { label: 'UPS', re: /\bups\b(?! ?to date)/g },
  { label: 'DHL', re: /\bdhl\b/g },
  { label: 'Amazon', re: /\bamazon\b/g },
  { label: 'Apple', re: /\bapple\b(?! (?:pie|juice|watch band))|\bicloud\b/g },
  { label: 'Microsoft', re: /\bmicrosoft\b|\bwindows (?:defender|support|security)\b/g },
  { label: 'Google', re: /\bgoogle\b/g },
  { label: 'PayPal', re: /\bpaypal\b/g },
  { label: 'Netflix', re: /\bnetflix\b/g },
  { label: 'IRS', re: /\bi\.?r\.?s\.?\b|\binternal revenue\b/g },
  { label: 'Social Security Administration', re: /\bsocial security(?: administration)?\b|\bssa\b/g },
  { label: 'Medicare', re: /\bmedicare\b/g },
  { label: 'a bank', re: /\b(?:chase|wells fargo|bank of america|citibank|capital one|us bank|pnc|truist|navy federal)\b/g },
  { label: 'your bank', re: /\byour bank\b|\bbank security\b|\bfraud department\b/g },
  { label: 'Geek Squad', re: /\bgeek squad\b/g },
  { label: 'Norton', re: /\bnorton\b/g },
  { label: 'McAfee', re: /\bmcafee\b/g },
  { label: 'Coinbase', re: /\bcoinbase\b/g },
  { label: 'law enforcement', re: /\b(?:police department|sheriff|fbi|dea|homeland security|county court)\b/g },
  { label: 'a utility company', re: /\b(?:electric company|power company|utility company|water department)\b/g },
];

interface Pattern {
  re: RegExp;
  flag: FlagId;
  detail: string;
}

const PATTERNS: Pattern[] = [
  // Generic greetings — real companies know your name.
  {
    re: /(?:^|\n)\s*(?:dear\s+)?(?:customer|user|client|sir\/?\s?madam|account holder|valued customer|member|friend|dear)\b[\s,!:.]/gi,
    flag: 'generic_greeting',
    detail: 'greets you generically instead of by name, which a real company with your account would use',
  },

  // Moving the conversation somewhere unmonitored.
  {
    re: /\b(?:text|message|contact|reach|add|dm|write)\s+(?:me|us)\b.{0,30}\b(?:on|via|at|through)\b.{0,15}\b(?:whatsapp|telegram|signal|wechat|hangouts|kik|viber)\b/g,
    flag: 'contact_channel_switch',
    detail: 'asks you to continue on WhatsApp/Telegram, away from a platform that could flag the scam',
  },
  {
    re: /\b(?:whatsapp|telegram)\b.{0,20}\b(?:\+?\d[\d\s().-]{7,})/g,
    flag: 'contact_channel_switch',
    detail: 'provides a WhatsApp or Telegram number to move the conversation to',
  },
  {
    re: /\bcall (?:this|the following|our) number\b|\bcall (?:us )?(?:immediately|now|back) at\b/g,
    flag: 'contact_channel_switch',
    detail: 'pushes you to call a number in the message rather than one you look up yourself',
  },

  // Romance / unsolicited relationship openers.
  {
    re: /(?:^|\n)\s*(?:hi|hello|hey|good (?:morning|day|evening))\s*(?:dear|handsome|beautiful|gorgeous|love)\b/g,
    flag: 'unsolicited_relationship_opener',
    detail: 'opens with unearned affection from someone you do not know',
  },
  {
    re: /\b(?:i (?:got|found) your (?:number|contact)|is this (?:still )?your number|do you remember me|sorry,? wrong number)\b/g,
    flag: 'unsolicited_relationship_opener',
    detail: 'uses a "wrong number" or vague-familiarity opener, the standard way romance and crypto scams start a conversation',
  },
  {
    re: /\b(?:my (?:late )?husband|my (?:late )?wife) (?:died|passed)\b|\bwidow(?:ed)?\b.{0,40}\b(?:inheritance|fortune|estate)\b/g,
    flag: 'unsolicited_relationship_opener',
    detail: 'uses a bereavement backstory, a common romance-scam script',
  },

  // Prizes and windfalls.
  {
    re: /\b(?:you(?:'ve| have)?\s+(?:won|been selected|been chosen)|congratulations)\b.{0,60}\b(?:prize|winner|lottery|sweepstakes|gift|award|\$\d|cash)/g,
    flag: 'prize_or_windfall',
    detail: 'claims you won something',
  },
  {
    re: /\b(?:claim your|collect your)\s+(?:prize|reward|winnings|refund|payment|inheritance)\b/g,
    flag: 'prize_or_windfall',
    detail: 'tells you to claim a prize or windfall',
  },
  {
    re: /\b(?:unclaimed|pending)\s+(?:funds?|refund|payment|settlement|inheritance)\b/g,
    flag: 'prize_or_windfall',
    detail: 'dangles money that is supposedly already yours',
  },

  // Credential harvesting.
  {
    re: /\b(?:verification|security|one[- ]time|otp|access|confirmation|2fa)\s*code\b.{0,50}\b(?:send|share|reply|text|provide|give|confirm|read)/g,
    flag: 'raw_credential_request',
    detail: 'asks you to share a verification code — no real company ever asks for these',
  },
  {
    re: /\b(?:send|share|reply with|provide|confirm|enter)\b.{0,30}\b(?:password|pin|ssn|social security number|full card number|cvv|security code|date of birth)\b/g,
    flag: 'raw_credential_request',
    detail: 'asks for a password, PIN or other secret directly',
  },
  {
    re: /\b(?:install|download)\b.{0,40}\b(?:anydesk|teamviewer|remote (?:access|desktop)|screen ?share)\b/g,
    flag: 'raw_credential_request',
    detail: 'asks you to install remote-access software, which hands over control of your device',
  },
];

export function detectImpersonation(text: NormalizedText): {
  matches: SignalMatch[];
  claimedOrganizations: string[];
} {
  const matches: SignalMatch[] = [];
  const seen = new Set<FlagId>();
  const orgs: string[] = [];

  for (const { label, re } of ORGANIZATIONS) {
    re.lastIndex = 0;
    if (re.test(text.matchable) && !orgs.includes(label)) orgs.push(label);
  }

  if (orgs.length > 0) {
    matches.push({
      flag: 'impersonates_organization',
      evidence: clipEvidence(orgs.join(', ')),
      index: 0,
      detail: `claims to be from ${orgs.join(', ')} — verify by contacting them through a number or app you already have`,
    });
  }

  for (const { re, flag, detail } of PATTERNS) {
    if (seen.has(flag)) continue;
    re.lastIndex = 0;
    const m = re.exec(text.matchable);
    if (!m) continue;
    seen.add(flag);
    matches.push({ flag, evidence: clipEvidence(m[0]), index: m.index, detail });
  }

  return { matches, claimedOrganizations: orgs };
}
