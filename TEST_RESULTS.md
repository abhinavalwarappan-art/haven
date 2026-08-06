# Test Results — "Is This Real?"

Generated: 2026-08-06T09:36:47.779Z  ·  Model: `gemini-3.1-flash-lite`  ·  Effort: `low`

## Verdict on the verdicts

**All 16/16 cases landed where a careful human reviewer would put them.** No legitimate message was called a scam, and no scam was called safe. This is demo-ready.

| Metric | Result |
| --- | --- |
| Exact matches | **16/16** |
| Neighbouring verdict | 0 |
| 🚨 Legitimate flagged as scam | **0** (good) |
| 🚨 Scam called safe | **0** (good) |
| Average latency | 1734 ms |
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
| 13 | Real subscription renewal notice | legitimate | 🟢 likely safe | 🟢 likely safe | 100 | ✅ pass |
| 14 | Contractor invoice via Zelle | borderline | 🟡 be careful / 🔴 scam | 🟡 be careful | 75 | ✅ pass |
| 15 | Political fundraising text | borderline | 🟡 be careful / 🟢 likely safe | 🟡 be careful | 75 | ✅ pass |
| 16 | School notice from unknown number | borderline | 🟡 be careful / 🟢 likely safe | 🟡 be careful | 65 | ✅ pass |

## Full results

### 1. Fake USPS redelivery fee  ✅ pass

`scam-usps-redelivery` · **scam** · expected scam

> Classic smishing. Lookalike domain plus a small fee — USPS never texts asking for payment.

**Input (truncated, PII redacted):**

```
USPS: Your package has been held at our facility due to an incomplete address. Please update your delivery details within 24 hours or the parcel will be returned to sender. Update here: https://usps-trackdelivery.icu/redelivery A $2.99 red…
```

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 100/100 · 1754 ms

**Reasons shown to the user:**

- The website link provided (usps-trackdelivery.icu) is not the official USPS.com website.
- The post office does not text people to pay delivery fees, and they will never ask you to click a link to pay them.
- The message uses a fake deadline, claiming you must act within 24 hours to pressure you into making a quick mistake.
- If you are worried about a package, go directly to the official USPS website or call your local post office using a number from a trusted source.

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

**Verdict:** 🔴 scam · **Confidence:** 95/100 · **Risk score (Layer 1):** 75/100 · 3254 ms

**Reasons shown to the user:**

- The website link they sent is fake and is not a real Chase address, so it is likely designed to steal your information.
- They are trying to scare you into clicking quickly by threatening to lock your account in 30 minutes, which is a common trick.
- If you are worried about your account, ignore the message and call the number on the back of your credit card to speak with them directly.

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

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 59/100 · 1439 ms

**Reasons shown to the user:**

- The Social Security Administration will never call to threaten you with arrest or suspend your Social Security number.
- No government agency will ever ask you to pay fees or settle fines using Apple gift cards.
- Telling you to keep the matter secret and not discuss it with anyone is a classic tactic scammers use to prevent you from getting help.
- If you are ever worried about your Social Security status, ignore this message and call the official Social Security number you find on their official website (ssa.gov).

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

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 8/100 · 1413 ms

**Reasons shown to the user:**

- No legitimate person or organization will ever ask you to buy gift cards and send them a picture of the codes.
- This is a very common trick where scammers pretend to be someone you trust, like a pastor or boss, to ask for money.
- If you want to help your pastor, call him using the phone number you already have saved for him to verify this request is real.

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

**Verdict:** 🔴 scam · **Confidence:** 95/100 · **Risk score (Layer 1):** 0/100 · 1576 ms

**Reasons shown to the user:**

- This is a classic 'wrong number' scam, where a stranger starts a conversation on purpose to build trust and eventually ask for money.
- The person claims it was a mistake but immediately tries to get you to move the conversation to WhatsApp, which is a common tactic to keep you off the secure messaging system.
- Be very careful with strangers who message you out of the blue to talk about their life or business, especially if they try to move the chat to a different app.

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

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 33/100 · 1436 ms

**Reasons shown to the user:**

- The request to install 'AnyDesk' is a major red flag because it gives a stranger total control over your computer.
- Real companies like Geek Squad do not ask you to install remote software to issue a refund.
- This message is designed to scare you with a large charge so that you call their phone number, where they will try to steal your money.

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

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 77/100 · 3737 ms

**Reasons shown to the user:**

- Real lotteries never ask you to pay a fee to get your prize; if you have to pay money to get money, it is a scam.
- This message asks for sensitive documents like a copy of your ID, which is how criminals steal your identity.
- You cannot win a lottery you did not enter, and legitimate organizations do not use WhatsApp to manage their winners.

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

**Verdict:** 🔴 scam · **Confidence:** 100/100 · **Risk score (Layer 1):** 85/100 · 1914 ms

**Reasons shown to the user:**

- It promises guaranteed high returns with 'zero losses,' which is a classic sign of an investment scam.
- It asks you to send money using cryptocurrency, which is irreversible and very difficult to get back if something goes wrong.
- The message uses fake urgency like 'only 3 spots remaining' and 'act now' to rush you into making a mistake.
- It asks you to move the conversation to Telegram, which is a common tactic used to keep conversations away from the protection of the app you are currently using.

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

**Verdict:** 🟢 likely safe · **Confidence:** 95/100 · **Risk score (Layer 1):** 0/100 · 1325 ms

**Reasons shown to the user:**

- The link in the message goes directly to the official UPS website, not a fake or hidden address.
- This message is a standard delivery notification that does not ask for any money, passwords, or personal information.
- It provides a specific tracking number you can use to check the status of your package on the official UPS website yourself.

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

**Verdict:** 🟢 likely safe · **Confidence:** 95/100 · **Risk score (Layer 1):** 0/100 · 1452 ms

**Reasons shown to the user:**

- It correctly includes the last four digits of your card, which is a detail a real fraud alert would have.
- It gives you a safe way to check: it tells you to call the number on the back of your card instead of clicking a link.
- It does not ask for any sensitive information like your password, PIN, or Social Security number.
- It asks only for a simple yes or no reply regarding a transaction, which is standard for bank text alerts.

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

**Verdict:** 🟢 likely safe · **Confidence:** 100/100 · **Risk score (Layer 1):** 0/100 · 1225 ms

**Reasons shown to the user:**

- This is a standard appointment reminder that includes specific details like the doctor's name and the exact time of your visit.
- It does not ask you to click any links, provide any passwords, or send any money.
- The message explicitly states that no action is needed if the time works for you, which is typical for a real business.

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

**Verdict:** 🟢 likely safe · **Confidence:** 100/100 · **Risk score (Layer 1):** 0/100 · 1297 ms

**Reasons shown to the user:**

- This is a standard security message from Google that you likely triggered yourself by trying to log in.
- The link provided takes you to the official 'google.com' website, which is the correct and safe place to manage your security.
- The message explicitly warns you not to share this code with anyone, which is the correct advice for keeping your account secure.

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

**Verdict:** 🟢 likely safe · **Confidence:** 100/100 · **Risk score (Layer 1):** 0/100 · 1398 ms

**Reasons shown to the user:**

- It does not ask you to provide any money, passwords, or personal information.
- The link provided goes directly to the official Netflix website, which you can verify by looking at the address.
- The message uses specific details like the last four digits of your card on file, which suggests it is a genuine notification.

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

**Verdict:** 🟡 be careful · **Confidence:** 75/100 · **Risk score (Layer 1):** 0/100 · 1541 ms

**Reasons shown to the user:**

- Asking for payment through Zelle makes it impossible to get your money back if something is wrong with the transaction.
- Using a personal Gmail address for a business payment is unusual and makes it hard to verify who you are actually paying.
- Because the person also offered to come by for a check next week, you should choose that option to be safe instead of using Zelle.

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

**Verdict:** 🟡 be careful · **Confidence:** 75/100 · **Risk score (Layer 1):** 0/100 · 1446 ms

**Reasons shown to the user:**

- This message is a generic political fundraising request, which is common, but these are often sent to random phone numbers.
- The link uses a shortener that hides the true destination, so you cannot see where you are being sent before clicking.
- If you want to donate to a political group, do not click links in text messages; go directly to their official website using your browser.

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

**Verdict:** 🟡 be careful · **Confidence:** 65/100 · **Risk score (Layer 1):** 0/100 · 1534 ms

**Reasons shown to the user:**

- The message asks for personal information like your child's date of birth and emergency contact details.
- While Google Forms are common, schools usually use their own official website or a secure school portal for these documents.
- Before filling this out, please call your school's athletic office directly using a phone number you already have to confirm they are using this form.

**Layer 1 red flags:** _none_

**Layer 1 legitimacy signals:** `no_payment_request`, `no_urgency_pressure`, `recognized_brand_domain`, `no_action_requested`

---

## How to read this

- **Expected** is what a careful human reviewer should conclude, not ground truth from a dataset. Some fixtures legitimately accept two verdicts.
- **Neighbouring verdict** (⚠️ off) means the tool was more or less cautious than expected but did not make a dangerous call — e.g. "be careful" on a real message. Worth reading; not a blocker.
- **Risk score** is Layer 1's advisory heuristic. It is deliberately *not* the verdict — comparing it against the final verdict shows how much the AI layer is actually adding.

Regenerate with `npm run test:checks`. Fixtures live in `fixtures/messages.ts`.
