# Test Results: Haven

Generated: 2026-08-07T20:42:23.985Z  ·  Model: `gemini-3.1-flash-lite`  ·  Effort: `low`

## Verdict on the verdicts

**All 16/16 cases landed where a careful human reviewer would put them.** No legitimate message was called a scam, and no scam was called safe. This is demo-ready.

| Metric | Result |
| --- | --- |
| Exact matches | **16/16** |
| Neighbouring verdict | 0 |
| 🚨 Legitimate flagged as scam | **0** (good) |
| 🚨 Scam called safe | **0** (good) |
| Average latency | 1674 ms |
| Rules-only fallbacks | 0 |

Test set: 8 scams · 5 legitimate · 3 borderline.

### Classifier

Layer 2 runs on Google Gemini (`gemini-3.1-flash-lite`) with JSON-schema structured output. `CLASSIFIER_EFFORT` maps to the Gemini thinking budget: `low` = 512 tokens, `medium` = 2048, `high` = 8192.

The project previously ran on Claude Opus 5, which scored the same 16/16 at ~6 s per check. The move to Gemini was driven by API credit availability, not by classification quality — the fixtures and grading are unchanged, so the two runs are directly comparable.

## At a glance

| # | Case | Type | Expected | Got | Conf. | |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Fake USPS redelivery fee | scam | 🔴 scam | 🔴 scam | 100 | ✅ pass |
| 2 | Fake bank fraud alert | scam | 🔴 scam | 🔴 scam | 95 | ✅ pass |
| 3 | Fake SSA arrest threat | scam | 🔴 scam | 🔴 scam | 100 | ✅ pass |
| 4 | Gift-card request (impersonation) | scam | 🔴 scam | 🔴 scam | 100 | ✅ pass |
| 5 | Romance / pig-butchering opener | scam | 🔴 scam | 🔴 scam | 95 | ✅ pass |
| 6 | Fake tech-support renewal invoice | scam | 🔴 scam | 🔴 scam | 100 | ✅ pass |
| 7 | Prize / lottery scam | scam | 🔴 scam | 🔴 scam | 100 | ✅ pass |
| 8 | Crypto investment scam | scam | 🔴 scam | 🔴 scam | 100 | ✅ pass |
| 9 | Real shipping notification | legitimate | 🟢 likely safe | 🟢 likely safe | 95 | ✅ pass |
| 10 | Real bank security alert | legitimate | 🟢 likely safe / 🟡 be careful | 🟢 likely safe | 95 | ✅ pass |
| 11 | Real appointment reminder | legitimate | 🟢 likely safe | 🟢 likely safe | 100 | ✅ pass |
| 12 | Real two-factor code | legitimate | 🟢 likely safe | 🟢 likely safe | 100 | ✅ pass |
| 13 | Real subscription renewal notice | legitimate | 🟢 likely safe | 🟢 likely safe | 95 | ✅ pass |
| 14 | Contractor invoice via Zelle | borderline | 🟡 be careful / 🔴 scam | 🟡 be careful | 85 | ✅ pass |
| 15 | Political fundraising text | borderline | 🟡 be careful / 🟢 likely safe | 🟢 likely safe | 80 | ✅ pass |
| 16 | School notice from unknown number | borderline | 🟡 be careful / 🟢 likely safe | 🟢 likely safe | 85 | ✅ pass |

## Full results

### 1. Fake USPS redelivery fee  ✅ pass

`scam-usps-redelivery` · **scam** · expected scam

> Classic smishing. Lookalike domain plus a small fee — USPS never texts asking for payment.

**Input (truncated, PII redacted):**

```
USPS: Your package has been held at our facility due to an incomplete address. Please update your delivery details within 24 hours or the parcel will be returned to sender. Update here: https://usps-trackdelivery.icu/redelivery A $2.99 red…
```

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 100/100 · 1787 ms

**Reasons shown to the user:**

- The website link uses a suspicious ending (.icu) and is not the official usps.com website.
- The United States Postal Service does not send text messages asking for small fees to update an address.
- The message uses a false deadline of 24 hours to rush you into making a mistake without thinking.
- If you are expecting a package, go directly to the official USPS website or your local post office to check its status.

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

**Verdict:** 🔴 scam · **Confidence:** 95/100 · **Risk score (Layer 1):** 75/100 · 1844 ms

**Reasons shown to the user:**

- The website address provided is not a real Chase website; it is a fake address designed to look official.
- Legitimate banks will never threaten to lock your account in 30 minutes to pressure you into clicking a link.
- If you are worried about this charge, call the customer service number on the back of your physical credit card to check on your account.

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

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 59/100 · 3204 ms

**Reasons shown to the user:**

- The Social Security Administration does not suspend numbers or issue warrants for arrest.
- No government agency will ever ask you to pay fines or fees using gift cards.
- Telling you to keep this private and not talk to anyone is a tactic used to keep you from asking for help or checking the truth.

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

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 8/100 · 1462 ms

**Reasons shown to the user:**

- No legitimate organization or leader will ever ask you to buy gift cards and send them a picture of the codes.
- This is a very common trick where a scammer pretends to be someone you trust to get you to spend your own money.
- The request to keep it a secret is a classic tactic used to stop you from calling the person to verify if the story is true.

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

**Verdict:** 🔴 scam · **Confidence:** 95/100 · **Risk score (Layer 1):** 0/100 · 1472 ms

**Reasons shown to the user:**

- This is a classic setup where a stranger pretends to text the wrong person to start a conversation.
- The person quickly pivots to personal details like moving from Singapore and working in luxury wine, which is a common tactic to build fake trust.
- Asking you to move the conversation to WhatsApp is a major red flag that often leads to investment scams or pressure to send money later.

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

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 33/100 · 1497 ms

**Reasons shown to the user:**

- Legitimate companies never ask you to install software like AnyDesk to give you a refund.
- Asking you to install remote-access software gives a stranger full control over your computer.
- This is a common tactic to trick you into believing you have been charged when you have not.
- Do not call the number provided. If you are worried, check your actual bank statement or call the company using a number from their official website.

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

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 77/100 · 1705 ms

**Reasons shown to the user:**

- Real lotteries never ask you to pay a fee to collect your winnings.
- This message asks for sensitive personal details like a copy of your ID, which scammers use to steal your identity.
- Legitimate organizations do not ask you to message them on WhatsApp to claim a prize.
- It creates fake pressure by saying the offer expires in 48 hours to make you act without thinking.

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

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 85/100 · 1435 ms

**Reasons shown to the user:**

- The message promises impossible returns of 340 percent, which is a classic sign of a scam.
- Legitimate businesses do not ask you to send money to anonymous cryptocurrency wallets.
- This person is trying to move you to a private Telegram conversation to hide their actions from authorities.
- The message creates fake pressure by saying there are only 3 spots left to force you into acting quickly.

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

**Verdict:** 🟢 likely safe · **Confidence:** 95/100 · **Risk score (Layer 1):** 0/100 · 2652 ms

**Reasons shown to the user:**

- The link in this message leads directly to the official UPS website, where you can safely check your delivery status.
- This message does not ask you for money, your password, or any personal information.
- It includes a specific tracking number, which is common for legitimate shipping updates.

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

**Verdict:** 🟢 likely safe · **Confidence:** 95/100 · **Risk score (Layer 1):** 0/100 · 1535 ms

**Reasons shown to the user:**

- It uses a specific card ending in 3391, which suggests this is a real alert from your bank.
- The message does not ask you to click a link or provide any passwords, codes, or money.
- It correctly tells you to call the number on the back of your card if you have any questions or concerns.

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

**Verdict:** 🟢 likely safe · **Confidence:** 100/100 · **Risk score (Layer 1):** 0/100 · 1302 ms

**Reasons shown to the user:**

- It gives specific details about a personal appointment with Dr. Patel that you would expect from your own dentist.
- It does not ask for money, passwords, or personal account information.
- There are no web links included, so there is nothing dangerous to click on.
- The message explicitly states that no action is required if the appointment time works for you.

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

**Verdict:** 🟢 likely safe · **Confidence:** 100/100 · **Risk score (Layer 1):** 0/100 · 1305 ms

**Reasons shown to the user:**

- This is a standard security alert from Google that does not ask for money or your password.
- The link provided takes you to the official Google website to help you secure your account.
- The message correctly advises you to never share this code with anyone, which is the standard safety procedure for these requests.

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

**Verdict:** 🟢 likely safe · **Confidence:** 95/100 · **Risk score (Layer 1):** 0/100 · 1413 ms

**Reasons shown to the user:**

- The link directs you to the official Netflix website, which is a safe place to manage your account.
- This message is just a courtesy reminder and does not ask you to provide any money or personal information.
- It uses your name and mentions a card ending in 2214, which shows the sender is familiar with your actual account details.

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

**Verdict:** 🟡 be careful · **Confidence:** 85/100 · **Risk score (Layer 1):** 0/100 · 1476 ms

**Reasons shown to the user:**

- Asking to pay by Zelle instead of a normal invoice method is a red flag because Zelle offers no protection for money sent to the wrong person.
- The sender is asking for payment to a personal email address rather than a business bank account.
- Since they offered to come by for a check next week, you should choose that option instead of sending money electronically.
- Call Danny using the phone number you normally use for his business to confirm he actually sent this message and that the payment details are correct.

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

**Verdict:** 🟢 likely safe · **Confidence:** 80/100 · **Risk score (Layer 1):** 0/100 · 1403 ms

**Reasons shown to the user:**

- This is a common fundraising request for a political campaign or cause.
- It includes a standard unsubscribe option at the end, which is typical for legitimate bulk emails and texts.
- While it asks for money, this is a standard request for a donation rather than a deceptive attempt to steal your payment information.

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

**Verdict:** 🟢 likely safe · **Confidence:** 85/100 · **Risk score (Layer 1):** 0/100 · 1292 ms

**Reasons shown to the user:**

- The message uses a standard Google Forms link, which schools often use for simple signups.
- It asks only for basic information like a student name and emergency contact, not financial or sensitive account passwords.
- There is no pressure to pay money or provide bank details, which are the hallmarks of a scam.

**Layer 1 red flags:** _none_

**Layer 1 legitimacy signals:** `no_payment_request`, `no_urgency_pressure`, `recognized_brand_domain`, `no_action_requested`

---

## How to read this

- **Expected** is what a careful human reviewer should conclude, not ground truth from a dataset. Some fixtures legitimately accept two verdicts.
- **Neighbouring verdict** (⚠️ off) means the tool was more or less cautious than expected but did not make a dangerous call — e.g. "be careful" on a real message. Worth reading; not a blocker.
- **Risk score** is Layer 1's advisory heuristic. It is deliberately *not* the verdict — comparing it against the final verdict shows how much the AI layer is actually adding.

Regenerate with `npm run test:checks`. Fixtures live in `fixtures/messages.ts`.
