/**
 * Urgency, pressure and threat detection.
 *
 * IMPORTANT: a hit here is weak evidence on its own. Real banks, real pharmacies
 * and real airlines all send urgent messages. What separates a scam is urgency
 * *combined with* an action that benefits the sender (pay, click, hand over a
 * code). We surface the pressure and let Layer 2 weigh it in context.
 */

import type { SignalMatch } from '../types.js';
import type { NormalizedText } from '../normalize.js';
import { clipEvidence } from '../privacy.js';

interface Pattern {
  re: RegExp;
  detail: string;
}

const URGENCY: Pattern[] = [
  { re: /\bact (?:now|immediately|fast|today)\b/g, detail: 'demands immediate action' },
  { re: /\b(?:respond|reply|call|click|verify|confirm|update)\s+(?:back\s+)?(?:immediately|now|within|right away|asap|at once)\b/g, detail: 'demands an immediate response' },
  { re: /\bwithin (?:the next )?\d+\s*(?:minute|hour|day)s?\b/g, detail: 'imposes a short deadline' },
  { re: /\b(?:final|last|urgent|important)\s+(?:notice|warning|reminder|attempt|chance)\b/g, detail: 'framed as a final warning' },
  { re: /\bdo not ignore\b|\bdon'?t ignore\b/g, detail: 'pressures against ignoring it' },
  { re: /\b(?:expires?|expiring|expired)\s+(?:today|tonight|soon|in \d+)\b/g, detail: 'claims something expires imminently' },
  { re: /\btime[- ]sensitive\b|\bimmediate attention\b|\bimmediate action (?:is )?required\b/g, detail: 'labelled time-sensitive' },
  { re: /\bonly \d+ (?:left|remaining|spots?|hours?)\b/g, detail: 'manufactures scarcity' },
  { re: /\blast chance\b|\bhurry\b|\bdon'?t (?:wait|delay)\b/g, detail: 'rushes the reader' },
];

const THREATS: Pattern[] = [
  { re: /\b(?:legal action|lawsuit|sue you|court (?:date|summons|appearance)|prosecut(?:e|ion|ed))\b/g, detail: 'threatens legal action' },
  { re: /\b(?:arrest(?:ed|\s+warrant)?|warrant for your arrest|taken into custody|jail|imprison)/g, detail: 'threatens arrest' },
  { re: /\b(?:seiz(?:e|ed|ure)|garnish|lien|levy)\b.{0,30}\b(?:asset|wage|property|account|refund)/g, detail: 'threatens to seize money or property' },
  { re: /\bdeport(?:ed|ation)?\b/g, detail: 'threatens deportation' },
  { re: /\byour (?:social security|ssn)\b.{0,40}\b(?:suspend|block|terminat)/g, detail: 'threatens Social Security suspension (a hallmark scam — SSNs are never suspended)' },
  { re: /\b(?:we will|will be) (?:report|forward)(?:ed|ing)? to (?:the )?(?:police|authorities|law enforcement|credit bureau)/g, detail: 'threatens to report you' },
  { re: /\bpermanent(?:ly)? (?:clos|delet|terminat|ban)/g, detail: 'threatens permanent loss of an account' },
];

const SUSPENSION: Pattern[] = [
  { re: /\byour account (?:will be|has been|is being) (?:suspend|clos|lock|restrict|disabl|terminat|deactivat)/g, detail: 'claims the account is being suspended' },
  { re: /\b(?:account|access|card|service) (?:suspend|lock|restrict|disabl|deactivat)(?:ed|ion)\b/g, detail: 'claims an account or card is locked' },
  { re: /\bto (?:avoid|prevent) (?:suspension|closure|termination|deactivation|interruption|cancellation)\b/g, detail: 'offers to avert a suspension if you act' },
  { re: /\bverify (?:your )?(?:account|identity|information)\b.{0,40}\b(?:avoid|prevent|or)\b/g, detail: 'ties identity verification to a threatened consequence' },
];

export function detectPressure(text: NormalizedText): SignalMatch[] {
  const matches: SignalMatch[] = [];

  const run = (patterns: Pattern[], flag: SignalMatch['flag']) => {
    for (const { re, detail } of patterns) {
      // Patterns are module-level with /g; reset lastIndex before each use.
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text.matchable)) !== null) {
        matches.push({
          flag,
          evidence: clipEvidence(m[0]),
          index: m.index,
          detail,
        });
        if (m[0].length === 0) re.lastIndex++;
        break; // one hit per pattern is enough evidence
      }
    }
  };

  run(URGENCY, 'urgency_language');
  run(THREATS, 'threat_language');
  run(SUSPENSION, 'account_suspension_threat');

  return matches;
}
