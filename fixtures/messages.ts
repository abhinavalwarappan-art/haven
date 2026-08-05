/**
 * Curated evaluation set.
 *
 * The scam examples are written from documented, widely-reported patterns
 * (FTC / FBI IC3 / USPS and IRS public warnings): smishing delivery notices,
 * bank impersonation, government-threat calls, romance "wrong number" openers,
 * tech-support renewal invoices, prize scams, gift-card requests, and
 * pig-butchering crypto approaches.
 *
 * The legitimate examples are the harder and more important half. Each one
 * deliberately contains something that looks suspicious in isolation — urgency,
 * a brand name, a link, the phrase "verification code", an unusual charge —
 * but is a normal message a real company or clinic sends. If the tool flags
 * these, it is not trustworthy.
 */

import type { Verdict } from '../src/lib/types.js';

export type Category = 'scam' | 'legitimate' | 'borderline';

export interface Fixture {
  id: string;
  category: Category;
  /** Short human label for the results table. */
  label: string;
  /** What a careful human reviewer should conclude. */
  expected: Verdict[];
  text: string;
  /** Why this case is in the set — shown in TEST_RESULTS.md. */
  note: string;
}

export const FIXTURES: Fixture[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // SCAMS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'scam-usps-redelivery',
    category: 'scam',
    label: 'Fake USPS redelivery fee',
    expected: ['scam'],
    note: 'Classic smishing. Lookalike domain plus a small fee — USPS never texts asking for payment.',
    text: `USPS: Your package has been held at our facility due to an incomplete address. Please update your delivery details within 24 hours or the parcel will be returned to sender.

Update here: https://usps-trackdelivery.icu/redelivery

A $2.99 redelivery fee applies. Reply Y then reopen this message to activate the link.`,
  },
  {
    id: 'scam-chase-fraud-alert',
    category: 'scam',
    label: 'Fake bank fraud alert',
    expected: ['scam'],
    note: 'Impersonates a bank fraud desk. The tell is the lookalike domain and that it asks you to log in via the link.',
    text: `CHASE ALERT: A charge of $847.32 at BEST BUY #4471 was attempted on your card ending 4419. If you did NOT authorize this, your account will be locked within 30 minutes.

Verify your identity immediately to stop this transaction:
https://secure-chase-verify.chasealerts-online.com/login

Do not ignore this message. Chase Fraud Prevention Dept.`,
  },
  {
    id: 'scam-ssa-arrest',
    category: 'scam',
    label: 'Fake SSA arrest threat',
    expected: ['scam'],
    note: 'Government-impersonation threat. Social Security numbers are never suspended, and no agency demands gift cards.',
    text: `FINAL NOTICE from the Social Security Administration.

Your Social Security Number has been SUSPENDED due to suspicious activity linked to money laundering in Texas. A warrant for your arrest has been issued.

To avoid arrest you must call our officer immediately at (872) 214-0083 and settle the outstanding amount of $2,480 in Apple gift cards. Do not discuss this case with anyone as it is under federal investigation.

Case ID: SSA-4471-TX`,
  },
  {
    id: 'scam-grandparent-giftcard',
    category: 'scam',
    label: 'Gift-card request (impersonation)',
    expected: ['scam'],
    note: 'Authority-impersonation gift card ask. Should be caught even with no link at all.',
    text: `Hi, it's Pastor Michael. Are you available? I need a favor and I can't talk on the phone right now, I'm in a meeting.

I need to get some Apple gift cards for the church youth retreat but I can't leave. Could you pick up 4 cards at $100 each from Walgreens and text me photos of the codes on the back? The church will reimburse you tomorrow.

Please keep this between us for now, I want it to be a surprise for the kids. God bless.`,
  },
  {
    id: 'scam-romance-wrong-number',
    category: 'scam',
    label: 'Romance / pig-butchering opener',
    expected: ['scam'],
    note: 'The "wrong number" opener that begins most crypto romance scams. No link, no ask yet — the tool must still recognise the setup.',
    text: `Hello David, are we still meeting for lunch at 12:30 tomorrow? Please confirm.

Oh I am so sorry! I think I have the wrong number. My assistant gave me the wrong contact.

But since we are talking, how is your day going? I am Cindy, I moved to Los Angeles from Singapore last year. I work in luxury wine import. You seem like a kind person, maybe fate wanted us to meet 😊 Do you use WhatsApp? It is easier for me to chat there, my number is +1 (628) 555-0147.`,
  },
  {
    id: 'scam-geeksquad-renewal',
    category: 'scam',
    label: 'Fake tech-support renewal invoice',
    expected: ['scam'],
    note: 'Refund-scam invoice. The goal is to get you to call and install remote-access software.',
    text: `GEEK SQUAD
INVOICE #GS-88241-A

Dear Customer,

Thank you. Your Geek Squad Total Protection Plan has been automatically renewed. The amount of $429.99 has been debited from your registered account.

Product: PC Optimizer Premium (36 months)
Amount: $429.99 USD

If you did not authorize this renewal and wish to CANCEL and receive a full refund, you must contact our billing helpdesk within 24 hours at +1 (808) 400-2261. Our agent will guide you to install AnyDesk so we can process the reversal on your computer.

Billing Support Team`,
  },
  {
    id: 'scam-lottery-prize',
    category: 'scam',
    label: 'Prize / lottery scam',
    expected: ['scam'],
    note: 'Advance-fee fraud: a prize you never entered for, unlocked by a processing fee.',
    text: `CONGRATULATIONS!!! 🎉🎉

Your mobile number has been selected as a WINNER in the 2026 Mega Millions International Promotional Draw held in London.

You have won: $850,000.00 USD

To claim your prize, contact our claims agent Mr. Andrew Coleman via WhatsApp on +44 7418 555023 with the following:
- Full name
- Home address
- Date of birth
- A copy of your ID

A one-time clearance fee of $299 is required to release the funds to your account. This offer expires in 48 hours. Do not share this winning code with anyone: MM-2026-XT4471`,
  },
  {
    id: 'scam-crypto-investment',
    category: 'scam',
    label: 'Crypto investment scam',
    expected: ['scam'],
    note: 'Guaranteed-returns crypto pitch pushing to Telegram and a wallet address.',
    text: `Hello dear! I hope this message finds you well.

My uncle is a senior analyst at a major exchange and he shares signals with our small private group. Our members made 340% returns last month with zero losses. I am only sharing this with a few kind people.

The minimum to start is $500 in USDT. You send to our pool wallet and profits are withdrawn daily:
bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh

Message me on Telegram @CryptoMentorLisa to get started before the window closes tonight. Act now, only 3 spots remaining!`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LEGITIMATE — the tool must NOT flag these
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'legit-ups-shipping',
    category: 'legitimate',
    label: 'Real shipping notification',
    expected: ['likely_safe'],
    note: 'Has a brand, a link and a delivery date. All genuine: real domain, real tracking number, no ask.',
    text: `UPS: Your package from REI is on the way and is scheduled to arrive Thursday, August 7 by 9:00 PM.

Tracking: 1Z999AA10123456784
Track it: https://www.ups.com/track?tracknum=1Z999AA10123456784

Reply STOP to opt out of UPS delivery alerts. Msg & data rates may apply.`,
  },
  {
    id: 'legit-bank-security-alert',
    category: 'legitimate',
    label: 'Real bank security alert',
    expected: ['likely_safe', 'uncertain_be_careful'],
    note: 'THE hardest case. Real fraud alerts are urgent and mention suspicious activity — but this one asks you to call the number on your card and contains no link.',
    text: `Chase Fraud Alert: Did you make a $312.48 purchase at HOME DEPOT #6612 on 08/04 with your card ending in 3391?

Reply YES if this was you, or NO if it was not.

We will never ask you for your password, PIN, or a one-time code. If you have questions, call the number on the back of your card.

Reply STOP to end alerts.`,
  },
  {
    id: 'legit-appointment-reminder',
    category: 'legitimate',
    label: 'Real appointment reminder',
    expected: ['likely_safe'],
    note: 'Named clinic, named doctor, specific date. Explicitly no action needed. Should be an easy safe.',
    text: `Hi Margaret, this is a reminder from Lakeside Family Dentistry about your cleaning with Dr. Patel on Tuesday, August 12 at 2:15 PM.

Please arrive 10 minutes early. No action is needed if this time still works for you — just reply R to reschedule or call our front desk at (972) 555-0164.

See you soon!`,
  },
  {
    id: 'legit-2fa-code',
    category: 'legitimate',
    label: 'Real two-factor code',
    expected: ['likely_safe'],
    note: 'Contains "verification code" and urgency, which naive filters flag. But it GIVES a code and warns against sharing it — the opposite of a scam.',
    text: `734912 is your Google verification code. It expires in 10 minutes.

Google will never ask you for this code. Do not share it with anyone, including people claiming to be from Google.

If you did not request this code, someone may be trying to access your account — you can secure it at https://myaccount.google.com/security`,
  },
  {
    id: 'legit-subscription-renewal',
    category: 'legitimate',
    label: 'Real subscription renewal notice',
    expected: ['likely_safe'],
    note: 'A charge notice with a dollar amount and a cancel link — the same shape as the Geek Squad scam, but genuine. Good false-positive test.',
    text: `Hi Robert,

This is a reminder that your Netflix subscription will renew on August 14, 2026. Your Standard plan is $17.99/month and will be charged to the Visa ending in 2214 on file.

No action is needed if you'd like to continue watching.

You can view or change your plan any time at https://www.netflix.com/youraccount

— The Netflix Team`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BORDERLINE — honest "be careful" territory
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'border-contractor-zelle',
    category: 'borderline',
    label: 'Contractor invoice via Zelle',
    expected: ['uncertain_be_careful', 'scam'],
    note: 'Small contractors really do ask for Zelle. But this is also exactly how invoice-redirect fraud looks. "Be careful" is the honest answer.',
    text: `Hi this is Danny from Kowalski Landscaping. Following up on the invoice for the retaining wall job we finished last week, $1,450.

Our card reader is down so if you could send it by Zelle to danny.kowalski.landscape@gmail.com that would be easiest. Or I can swing by for a check next week whenever works.

Thanks again, the wall came out great.`,
  },
  {
    id: 'border-political-fundraising',
    category: 'borderline',
    label: 'Political fundraising text',
    expected: ['uncertain_be_careful', 'likely_safe'],
    note: 'Aggressive urgency, a shortened link, a money ask — but this is legal, extremely common, and not fraud. Tests whether pressure alone triggers a scam verdict.',
    text: `URGENT: The FEC deadline is at MIDNIGHT and we are $4,200 short of our goal. 😳

Sarah, we've asked 3 times and haven't heard back. If we miss this deadline our opponents will outspend us 3-to-1 in the final stretch.

Can you chip in $25 right now?? → https://bit.ly/3xKp2Rq

Reply STOP to unsubscribe. Paid for by Citizens for a Better District.`,
  },
  {
    id: 'border-school-form',
    category: 'borderline',
    label: 'School notice from unknown number',
    expected: ['uncertain_be_careful', 'likely_safe'],
    note: 'Unknown sender, generic greeting, a form link asking for personal details. Probably real, worth verifying. Genuinely ambiguous.',
    text: `Hello parents,

This is a reminder that fall sports physical forms are due this Friday, August 8. Please complete the online form with your student's name, date of birth, and emergency contact information:

https://forms.gle/aB3xK9mPqR2sT7vN

Late submissions may prevent your student from participating in tryouts. Contact the athletics office with questions.

- FMHS Athletics`,
  },
];

export const COUNTS = {
  scam: FIXTURES.filter((f) => f.category === 'scam').length,
  legitimate: FIXTURES.filter((f) => f.category === 'legitimate').length,
  borderline: FIXTURES.filter((f) => f.category === 'borderline').length,
  total: FIXTURES.length,
};
