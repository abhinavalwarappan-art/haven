# Test Results: Haven

Generated: 2026-08-07T20:02:28.863Z  ·  Model: `gemini-3.1-flash-lite`  ·  Effort: `low`

## Verdict on the verdicts

**All 16/16 cases landed where a careful human reviewer would put them.** No legitimate message was called a scam, and no scam was called safe. This is demo-ready.

| Metric | Result |
| --- | --- |
| Exact matches | **16/16** |
| Neighbouring verdict | 0 |
| 🚨 Legitimate flagged as scam | **0** (good) |
| 🚨 Scam called safe | **0** (good) |
| Average latency | 1738 ms |
| Rules-only fallbacks | 0 |

Test set: 8 scams · 5 legitimate · 3 borderline.

### Classifier

Layer 2 runs on Google Gemini (`gemini-3.1-flash-lite`) with JSON-schema structured output. `CLASSIFIER_EFFORT` maps to the Gemini thinking budget: `low` = 512 tokens, `medium` = 2048, `high` = 8192.

The project previously ran on Claude Opus 5, which scored the same 16/16 at ~6 s per check. The move to Gemini was driven by API credit availability, not by classification quality — the fixtures and grading are unchanged, so the two runs are directly comparable.

## At a glance

| # | Case | Type | Expected | Got | Conf. | |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Fake USPS redelivery fee | scam | 🔴 scam | 🔴 scam | 100 | ✅ pass |
| 2 | Fake bank fraud alert | scam | 🔴 scam | 🔴 scam | 100 | ✅ pass |
| 3 | Fake SSA arrest threat | scam | 🔴 scam | 🔴 scam | 100 | ✅ pass |
| 4 | Gift-card request (impersonation) | scam | 🔴 scam | 🔴 scam | 100 | ✅ pass |
| 5 | Romance / pig-butchering opener | scam | 🔴 scam | 🔴 scam | 95 | ✅ pass |
| 6 | Fake tech-support renewal invoice | scam | 🔴 scam | 🔴 scam | 95 | ✅ pass |
| 7 | Prize / lottery scam | scam | 🔴 scam | 🔴 scam | 100 | ✅ pass |
| 8 | Crypto investment scam | scam | 🔴 scam | 🔴 scam | 100 | ✅ pass |
| 9 | Real shipping notification | legitimate | 🟢 likely safe | 🟢 likely safe | 95 | ✅ pass |
| 10 | Real bank security alert | legitimate | 🟢 likely safe / 🟡 be careful | 🟢 likely safe | 95 | ✅ pass |
| 11 | Real appointment reminder | legitimate | 🟢 likely safe | 🟢 likely safe | 100 | ✅ pass |
| 12 | Real two-factor code | legitimate | 🟢 likely safe | 🟢 likely safe | 95 | ✅ pass |
| 13 | Real subscription renewal notice | legitimate | 🟢 likely safe | 🟢 likely safe | 100 | ✅ pass |
| 14 | Contractor invoice via Zelle | borderline | 🟡 be careful / 🔴 scam | 🟡 be careful | 75 | ✅ pass |
| 15 | Political fundraising text | borderline | 🟡 be careful / 🟢 likely safe | 🟢 likely safe | 75 | ✅ pass |
| 16 | School notice from unknown number | borderline | 🟡 be careful / 🟢 likely safe | 🟡 be careful | 60 | ✅ pass |

## Full results

### 1. Fake USPS redelivery fee  ✅ pass

`scam-usps-redelivery` · **scam** · expected scam

> Classic smishing. Lookalike domain plus a small fee — USPS never texts asking for payment.

**Input (truncated, PII redacted):**

```
USPS: Your package has been held at our facility due to an incomplete address. Please update your delivery details within 24 hours or the parcel will be returned to sender. Update here: https://usps-trackdelivery.icu/redelivery A $2.99 red…
```

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 100/100 · 1809 ms

**Reasons shown to the user:**

- The website link uses a fake address, usps-trackdelivery.icu, which is not the official usps.com website.
- The United States Postal Service will not send you a text message asking for a fee to redeliver a package.
- It tries to rush you by threatening to return your package if you do not act within 24 hours.

**Layer 1 red flags:** `urgency_language`, `unexpected_fee_request`, `lookalike_domain`, `suspicious_tld`, `impersonates_organization`

**Layer 1 legitimacy signals:** _none_

---

### 2. Fake bank fraud alert  ✅ pass

`scam-chase-fraud-alert` · **scam** · expected scam

> Impersonates a bank fraud desk. The tell is the lookalike domain and that it asks you to log in via the link.

**Input (truncated, PII redacted):**

```
CHASE ALERT: A charge of $847.32 at BEST BUY #4471 was attempted on your card ending 4419. If you did NOT authorize this, your account will be locked within 30 minutes. Verify your identity immediately to stop this transaction: https://sec…
```

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 75/100 · 1721 ms

**Reasons shown to the user:**

- The website link chasealerts-online.com is fake. It uses the name Chase to look official, but it is not the real Chase website.
- Legitimate banks do not threaten to lock your account in 30 minutes to pressure you into acting quickly.
- This message is trying to trick you into entering your account login information on a fake website.
- If you are worried about your card, call the number on the back of your physical bank card instead of using any link in this text.

**Layer 1 red flags:** `urgency_language`, `account_suspension_threat`, `deep_subdomain_spoof`, `impersonates_organization`

**Layer 1 legitimacy signals:** `no_payment_request`

---

### 3. Fake SSA arrest threat  ✅ pass

`scam-ssa-arrest` · **scam** · expected scam

> Government-impersonation threat. Social Security numbers are never suspended, and no agency demands gift cards.

**Input (truncated, PII redacted):**

```
FINAL NOTICE from the Social Security Administration. Your Social Security Number has been SUSPENDED due to suspicious activity linked to money laundering in Texas. A warrant for your arrest has been issued. To avoid arrest you must call o…
```

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 59/100 · 1592 ms

**Reasons shown to the user:**

- The Social Security Administration never threatens you with arrest or asks for money over the phone.
- No government agency ever accepts payment for fines or fees using Apple gift cards.
- The claim that your Social Security number can be suspended is a common lie used by criminals to frighten you.
- Ignore this message and do not call the number provided in it, as that will connect you directly to the scammers.

**Layer 1 red flags:** `urgency_language`, `threat_language`, `gift_card_request`, `impersonates_organization`

**Layer 1 legitimacy signals:** `no_links_present`, `personalized_details`

---

### 4. Gift-card request (impersonation)  ✅ pass

`scam-grandparent-giftcard` · **scam** · expected scam

> Authority-impersonation gift card ask. Should be caught even with no link at all.

**Input (truncated, PII redacted):**

```
Hi, it's Pastor Michael. Are you available? I need a favor and I can't talk on the phone right now, I'm in a meeting. I need to get some Apple gift cards for the church youth retreat but I can't leave. Could you pick up 4 cards at $100 eac…
```

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 8/100 · 1412 ms

**Reasons shown to the user:**

- No legitimate organization or leader will ever ask you to buy gift cards as a favor or payment.
- Sending photos of gift card codes is the same as giving away cash and cannot be undone.
- The person claims they cannot talk on the phone, which is a common trick used to prevent you from verifying who they really are.
- To be safe, call the church office or the pastor directly using a phone number you already have saved, not by replying to this text.

**Layer 1 red flags:** `gift_card_request`, `impersonates_organization`

**Layer 1 legitimacy signals:** `no_links_present`, `no_urgency_pressure`, `no_action_requested`

---

### 5. Romance / pig-butchering opener  ✅ pass

`scam-romance-wrong-number` · **scam** · expected scam

> The "wrong number" opener that begins most crypto romance scams. No link, no ask yet — the tool must still recognise the setup.

**Input (truncated, PII redacted):**

```
Hello David, are we still meeting for lunch at 12:30 tomorrow? Please confirm. Oh I am so sorry! I think I have the wrong number. My assistant gave me the wrong contact. But since we are talking, how is your day going? I am Cindy, I moved …
```

**Verdict:** 🔴 scam · **Confidence:** 95/100 · **Risk score (Layer 1):** 0/100 · 1535 ms

**Reasons shown to the user:**

- This is a well known scam called pig butchering where a stranger pretends they messaged you by mistake to start a fake friendship.
- The sender immediately pivots to personal details about their life and suggests moving the conversation to WhatsApp, which is a classic tactic.
- No one you actually know would introduce themselves, claim they have the wrong number, and then immediately try to start a friendship with a stranger.

**Layer 1 red flags:** _none_

**Layer 1 legitimacy signals:** `no_links_present`, `no_payment_request`, `no_urgency_pressure`

---

### 6. Fake tech-support renewal invoice  ✅ pass

`scam-geeksquad-renewal` · **scam** · expected scam

> Refund-scam invoice. The goal is to get you to call and install remote-access software.

**Input (truncated, PII redacted):**

```
GEEK SQUAD INVOICE #GS-88241-A Dear Customer, Thank you. Your Geek Squad Total Protection Plan has been automatically renewed. The amount of $429.99 has been debited from your registered account. Product: PC Optimizer Premium (36 months) A…
```

**Verdict:** 🔴 scam · **Confidence:** 95/100 · **Risk score (Layer 1):** 33/100 · 1494 ms

**Reasons shown to the user:**

- This message claims you were charged but then asks you to call a number for a refund.
- Legitimate companies like Geek Squad will never ask you to install software like AnyDesk to give you a refund.
- Asking to install remote software allows a stranger to take full control of your computer.
- If you are worried about your subscription, log in to your account through the official Geek Squad website or call their real support number found on your original paperwork.

**Layer 1 red flags:** `urgency_language`, `impersonates_organization`, `generic_greeting`, `raw_credential_request`

**Layer 1 legitimacy signals:** `no_links_present`, `no_payment_request`, `personalized_details`

---

### 7. Prize / lottery scam  ✅ pass

`scam-lottery-prize` · **scam** · expected scam

> Advance-fee fraud: a prize you never entered for, unlocked by a processing fee.

**Input (truncated, PII redacted):**

```
CONGRATULATIONS!!! 🎉🎉 Your mobile number has been selected as a WINNER in the 2026 Mega Millions International Promotional Draw held in London. You have won: $850,000.00 USD To claim your prize, contact our claims agent Mr. Andrew Colema…
```

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 77/100 · 1662 ms

**Reasons shown to the user:**

- Real lotteries do not ask you to pay a fee to receive your winnings.
- No legitimate company will ask you to send them a copy of your personal ID over a text message or WhatsApp.
- Winning a large prize without ever entering a contest is a common sign of a scam designed to steal your money.
- Asking you to move the conversation to WhatsApp is a tactic used to hide the conversation from service providers who could block the scammer.

**Layer 1 red flags:** `urgency_language`, `unexpected_fee_request`, `contact_channel_switch`, `prize_or_windfall`

**Layer 1 legitimacy signals:** `no_links_present`

---

### 8. Crypto investment scam  ✅ pass

`scam-crypto-investment` · **scam** · expected scam

> Guaranteed-returns crypto pitch pushing to Telegram and a wallet address.

**Input (truncated, PII redacted):**

```
Hello dear! I hope this message finds you well. My uncle is a senior analyst at a major exchange and he shares signals with our small private group. Our members made 340% returns last month with zero losses. I am only sharing this with a f…
```

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 85/100 · 1599 ms

**Reasons shown to the user:**

- The message asks you to send cryptocurrency to a digital wallet which cannot be undone or recovered if you change your mind.
- Promising huge guaranteed returns like 340 percent is a classic sign of a financial scam.
- Being asked to move the conversation to a private app like Telegram is a common tactic to keep you away from oversight.
- The sender uses fake urgency by claiming there are only 3 spots left to pressure you into acting without thinking.

**Layer 1 red flags:** `urgency_language`, `crypto_payment_request`, `contact_channel_switch`, `unsolicited_relationship_opener`

**Layer 1 legitimacy signals:** `no_links_present`

---

### 9. Real shipping notification  ✅ pass

`legit-ups-shipping` · **legitimate** · expected likely_safe

> Has a brand, a link and a delivery date. All genuine: real domain, real tracking number, no ask.

**Input (truncated, PII redacted):**

```
UPS: Your package from REI is on the way and is scheduled to arrive Thursday, August 7 by 9:00 PM. Tracking: 1Z999AA[phone] Track it: https://www.ups.com/track?tracknum=1Z999AA[phone] Reply STOP to opt out of UPS delivery alerts. Msg & dat…
```

**Verdict:** 🟢 likely safe · **Confidence:** 95/100 · **Risk score (Layer 1):** 0/100 · 2802 ms

**Reasons shown to the user:**

- The link in the message takes you directly to the official UPS website, which is the correct and safe address for checking deliveries.
- The message does not ask you for any money, passwords, or personal information.
- It includes a specific tracking number that you can use to verify your package status on the official UPS website yourself.

**Layer 1 red flags:** `impersonates_organization`

**Layer 1 legitimacy signals:** `recognized_brand_domain`, `no_payment_request`, `no_urgency_pressure`, `personalized_details`, `standard_optout_footer`

---

### 10. Real bank security alert  ✅ pass

`legit-bank-security-alert` · **legitimate** · expected likely_safe or uncertain_be_careful

> THE hardest case. Real fraud alerts are urgent and mention suspicious activity — but this one asks you to call the number on your card and contains no link.

**Input (truncated, PII redacted):**

```
Chase Fraud Alert: Did you make a $312.48 purchase at HOME DEPOT #6612 on 08/04 with your card ending in 3391? Reply YES if this was you, or NO if it was not. We will never ask you for your password, PIN, or a one-time code. If you have qu…
```

**Verdict:** 🟢 likely safe · **Confidence:** 95/100 · **Risk score (Layer 1):** 0/100 · 1321 ms

**Reasons shown to the user:**

- It provides specific details about a transaction and the last four digits of your card, which is common for real bank alerts.
- The message does not ask you to click any links or provide any sensitive information like a password or PIN.
- It gives you the correct advice to call the number on the back of your card if you are ever in doubt.

**Layer 1 red flags:** `impersonates_organization`

**Layer 1 legitimacy signals:** `no_links_present`, `no_payment_request`, `no_urgency_pressure`, `personalized_details`, `standard_optout_footer`

---

### 11. Real appointment reminder  ✅ pass

`legit-appointment-reminder` · **legitimate** · expected likely_safe

> Named clinic, named doctor, specific date. Explicitly no action needed. Should be an easy safe.

**Input (truncated, PII redacted):**

```
Hi Margaret, this is a reminder from Lakeside Family Dentistry about your cleaning with Dr. Patel on Tuesday, August 12 at 2:15 PM. Please arrive 10 minutes early. No action is needed if this time still works for you — just reply R to resc…
```

**Verdict:** 🟢 likely safe · **Confidence:** 100/100 · **Risk score (Layer 1):** 0/100 · 1232 ms

**Reasons shown to the user:**

- This message only provides a friendly reminder about an appointment that you presumably already scheduled.
- It does not ask for any money, passwords, or personal information.
- The instructions are simple and do not try to rush or panic you into doing something quickly.

**Layer 1 red flags:** _none_

**Layer 1 legitimacy signals:** `no_links_present`, `no_payment_request`, `no_urgency_pressure`, `personalized_details`, `no_action_requested`

---

### 12. Real two-factor code  ✅ pass

`legit-2fa-code` · **legitimate** · expected likely_safe

> Contains "verification code" and urgency, which naive filters flag. But it GIVES a code and warns against sharing it — the opposite of a scam.

**Input (truncated, PII redacted):**

```
734912 is your Google verification code. It expires in 10 minutes. Google will never ask you for this code. Do not share it with anyone, including people claiming to be from Google. If you did not request this code, someone may be trying t…
```

**Verdict:** 🟢 likely safe · **Confidence:** 95/100 · **Risk score (Layer 1):** 0/100 · 1252 ms

**Reasons shown to the user:**

- This is a standard security message sent when someone tries to sign in to your Google account.
- The link provided takes you to the official Google website at myaccount.google.com.
- It correctly tells you not to share the code with anyone, which is exactly how legitimate security codes work.

**Layer 1 red flags:** `urgency_language`, `impersonates_organization`

**Layer 1 legitimacy signals:** `recognized_brand_domain`, `no_payment_request`

---

### 13. Real subscription renewal notice  ✅ pass

`legit-subscription-renewal` · **legitimate** · expected likely_safe

> A charge notice with a dollar amount and a cancel link — the same shape as the Geek Squad scam, but genuine. Good false-positive test.

**Input (truncated, PII redacted):**

```
Hi Robert, This is a reminder that your Netflix subscription will renew on August 14, 2026. Your Standard plan is $17.99/month and will be charged to the Visa ending in 2214 on file. No action is needed if you'd like to continue watching. …
```

**Verdict:** 🟢 likely safe · **Confidence:** 100/100 · **Risk score (Layer 1):** 0/100 · 3884 ms

**Reasons shown to the user:**

- It provides a simple reminder about your subscription renewal instead of asking for money or passwords.
- It correctly mentions the last four digits of your payment card on file, which shows it knows your specific account details.
- The link provided goes directly to the official Netflix website.

**Layer 1 red flags:** `impersonates_organization`

**Layer 1 legitimacy signals:** `recognized_brand_domain`, `no_payment_request`, `no_urgency_pressure`, `personalized_details`, `no_action_requested`

---

### 14. Contractor invoice via Zelle  ✅ pass

`border-contractor-zelle` · **borderline** · expected uncertain_be_careful or scam

> Small contractors really do ask for Zelle. But this is also exactly how invoice-redirect fraud looks. "Be careful" is the honest answer.

**Input (truncated, PII redacted):**

```
Hi this is Danny from Kowalski Landscaping. Following up on the invoice for the retaining wall job we finished last week, $1,450. Our card reader is down so if you could send it by Zelle to [email] that would be easiest. Or I can swing by …
```

**Verdict:** 🟡 be careful · **Confidence:** 75/100 · **Risk score (Layer 1):** 0/100 · 1386 ms

**Reasons shown to the user:**

- The sender is asking for payment by Zelle, which offers no protection if you send money to the wrong person.
- The request to use a personal email address for payment is a common way to intercept funds, even if the job itself was real.
- Because the message also offers to pick up a check in person, you can simply choose that option to avoid any risk with online transfers.

**Layer 1 red flags:** `p2p_payment_request`

**Layer 1 legitimacy signals:** `no_links_present`, `no_urgency_pressure`

---

### 15. Political fundraising text  ✅ pass

`border-political-fundraising` · **borderline** · expected uncertain_be_careful or likely_safe

> Aggressive urgency, a shortened link, a money ask — but this is legal, extremely common, and not fraud. Tests whether pressure alone triggers a scam verdict.

**Input (truncated, PII redacted):**

```
URGENT: The FEC deadline is at MIDNIGHT and we are $4,200 short of our goal. 😳 Sarah, we've asked 3 times and haven't heard back. If we miss this deadline our opponents will outspend us 3-to-1 in the final stretch. Can you chip in $25 rig…
```

**Verdict:** 🟢 likely safe · **Confidence:** 75/100 · **Risk score (Layer 1):** 0/100 · 1485 ms

**Reasons shown to the user:**

- This is a common fundraising request for a political campaign, which often use urgent language to encourage donations.
- The message includes a legal opt-out instruction to reply STOP, which is standard for legitimate bulk political messages.
- While the link is shortened, this is a standard practice for tracking donations in political campaigns rather than a sign of a scam.

**Layer 1 red flags:** `url_shortener`

**Layer 1 legitimacy signals:** `no_payment_request`, `no_urgency_pressure`, `standard_optout_footer`

---

### 16. School notice from unknown number  ✅ pass

`border-school-form` · **borderline** · expected uncertain_be_careful or likely_safe

> Unknown sender, generic greeting, a form link asking for personal details. Probably real, worth verifying. Genuinely ambiguous.

**Input (truncated, PII redacted):**

```
Hello parents, This is a reminder that fall sports physical forms are due this Friday, August 8. Please complete the online form with your student's name, date of birth, and emergency contact information: https://forms.gle/aB3xK9mPqR2sT7vN…
```

**Verdict:** 🟡 be careful · **Confidence:** 60/100 · **Risk score (Layer 1):** 0/100 · 1628 ms

**Reasons shown to the user:**

- The link uses a generic Google Forms address instead of an official school district website.
- The message asks for personal information like a birth date, which is sensitive.
- If you have a child in sports, call the school athletics office using a number you already have to confirm they are collecting forms this way.

**Layer 1 red flags:** _none_

**Layer 1 legitimacy signals:** `no_payment_request`, `no_urgency_pressure`, `recognized_brand_domain`, `no_action_requested`

---

## How to read this

- **Expected** is what a careful human reviewer should conclude, not ground truth from a dataset. Some fixtures legitimately accept two verdicts.
- **Neighbouring verdict** (⚠️ off) means the tool was more or less cautious than expected but did not make a dangerous call — e.g. "be careful" on a real message. Worth reading; not a blocker.
- **Risk score** is Layer 1's advisory heuristic. It is deliberately *not* the verdict — comparing it against the final verdict shows how much the AI layer is actually adding.

Regenerate with `npm run test:checks`. Fixtures live in `fixtures/messages.ts`.
