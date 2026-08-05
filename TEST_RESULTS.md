# Test Results — "Is This Real?"

Generated: 2026-08-05T09:04:46.267Z  ·  Model: `claude-opus-5` · effort `medium`

> ### ⚠️ Read this before trusting the numbers below
>
> **These results are real and were produced by the full two-layer pipeline against the live Claude API — but they are one commit stale.** After this run I fixed three Layer 1 bugs that the edge-case suite caught (see DECISIONS.md § "Bugs found and fixed"). None of them touch any of the 16 fixtures here — I re-ran Layer 1 across all of them afterwards and the signals are unchanged — but the honest status is *"very likely still 16/16, not re-verified end-to-end"*.
>
> **Two of the 16 cases (#2 and #10) never reached the AI layer.** They hit API rate limiting, exhausted retries after ~3 minutes, and were graded on the rules-only fallback. Their verdicts happened to land correctly but say nothing about classification quality. Test concurrency has since been dropped from 4 to 2 to prevent this.
>
> **To get a clean run:** put your Anthropic API key in `.env.local` (see README § Setup — I was not able to write a credential to disk) and run `npm run test:checks`. It takes about 5 minutes and overwrites this file.

## Verdict on the verdicts

**All 16/16 cases landed where a careful human reviewer would put them.** No legitimate message was called a scam, and no scam was called safe. This is demo-ready.

| Metric | Result |
| --- | --- |
| Exact matches | **16/16** |
| Neighbouring verdict | 0 |
| 🚨 Legitimate flagged as scam | **0** (good) |
| 🚨 Scam called safe | **0** (good) |
| Average latency | 58307 ms |
| Rules-only fallbacks | 2 ← the AI layer did not run for these |

Test set: 8 scams · 5 legitimate · 3 borderline.

## At a glance

| # | Case | Type | Expected | Got | Conf. | |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Fake USPS redelivery fee | scam | 🔴 scam | 🔴 scam | 97 | ✅ pass |
| 2 | Fake bank fraud alert | scam | 🔴 scam | 🔴 scam | 80 | ✅ pass |
| 3 | Fake SSA arrest threat | scam | 🔴 scam | 🔴 scam | 99 | ✅ pass |
| 4 | Gift-card request (impersonation) | scam | 🔴 scam | 🔴 scam | 98 | ✅ pass |
| 5 | Romance / pig-butchering opener | scam | 🔴 scam | 🔴 scam | 93 | ✅ pass |
| 6 | Fake tech-support renewal invoice | scam | 🔴 scam | 🔴 scam | 97 | ✅ pass |
| 7 | Prize / lottery scam | scam | 🔴 scam | 🔴 scam | 98 | ✅ pass |
| 8 | Crypto investment scam | scam | 🔴 scam | 🔴 scam | 98 | ✅ pass |
| 9 | Real shipping notification | legitimate | 🟢 likely safe | 🟢 likely safe | 92 | ✅ pass |
| 10 | Real bank security alert | legitimate | 🟢 likely safe / 🟡 be careful | 🟢 likely safe | 62 | ✅ pass |
| 11 | Real appointment reminder | legitimate | 🟢 likely safe | 🟢 likely safe | 95 | ✅ pass |
| 12 | Real two-factor code | legitimate | 🟢 likely safe | 🟢 likely safe | 92 | ✅ pass |
| 13 | Real subscription renewal notice | legitimate | 🟢 likely safe | 🟢 likely safe | 93 | ✅ pass |
| 14 | Contractor invoice via Zelle | borderline | 🟡 be careful / 🔴 scam | 🟡 be careful | 60 | ✅ pass |
| 15 | Political fundraising text | borderline | 🟡 be careful / 🟢 likely safe | 🟡 be careful | 60 | ✅ pass |
| 16 | School notice from unknown number | borderline | 🟡 be careful / 🟢 likely safe | 🟢 likely safe | 80 | ✅ pass |

## Full results

### 1. Fake USPS redelivery fee  ✅ pass

`scam-usps-redelivery` · **scam** · expected scam

> Classic smishing. Lookalike domain plus a small fee — USPS never texts asking for payment.

**Input (truncated, PII redacted):**

```
USPS: Your package has been held at our facility due to an incomplete address. Please update your delivery details within 24 hours or the parcel will be returned to sender. Update here: https://usps-trackdelivery.icu/redelivery A $2.99 red…
```

**Verdict:** 🔴 scam · **Confidence:** 97/100 · **Risk score (Layer 1):** 100/100 · 14552 ms

**Reasons shown to the user:**

- The link goes to "usps-trackdelivery.icu", not the real usps.com website — it only looks like USPS.
- It asks for a $2.99 payment for redelivery; the Postal Service does not text you asking for card details like this.
- The 24-hour deadline and the "reply Y to activate the link" trick are pressure tactics to stop you checking.
- If you're expecting a package, look up the tracking number yourself at usps.com or call USPS directly instead.

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

**Verdict:** 🔴 scam · **Confidence:** 80/100 · **Risk score (Layer 1):** 75/100 · 189070 ms · ⚠️ rules-only fallback

**Reasons shown to the user:**

- This message secure-chase-verify.chasealerts-online.com puts "Chase" in front of an unrelated domain (chasealerts-online.com) to look official.
- We could not fully analyse this one, so treat it carefully and check with the sender using a number you already have.
- Our detailed checker was unavailable, so this is a quick automatic assessment — double-check before acting on it.

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

**Verdict:** 🔴 scam · **Confidence:** 99/100 · **Risk score (Layer 1):** 59/100 · 14994 ms

**Reasons shown to the user:**

- It demands $2,480 in Apple gift cards — no government agency ever accepts gift cards as payment.
- Social Security numbers are never 'suspended', and the government does not phone people about arrest warrants.
- It tells you not to discuss the case with anyone, which is a trick to stop you asking family or your bank.
- If you're worried, hang up and call Social Security yourself at 1-800-772-1213, not the number in this message.

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

**Verdict:** 🔴 scam · **Confidence:** 98/100 · **Risk score (Layer 1):** 8/100 · 75797 ms

**Reasons shown to the user:**

- It asks you to buy $400 in Apple gift cards and text photos of the codes — that is money gone for good, and no real church does this.
- It says the person can't talk on the phone, which stops you from hearing whether it's really your pastor.
- It asks you to keep it secret 'as a surprise', a classic trick to stop you checking with anyone.
- Call your church office or the pastor's known number yourself — don't reply to this text.

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

**Verdict:** 🔴 scam · **Confidence:** 93/100 · **Risk score (Layer 1):** 0/100 · 68106 ms

**Reasons shown to the user:**

- The "wrong number" opening followed by friendly chat is the standard opening move of romance and investment fraud.
- A real stranger who dialed wrong does not immediately share their job, life story and ask to move to WhatsApp.
- Mentions of luxury wine import and "fate wanted us to meet" are bait to build trust before a money or crypto request arrives.
- Best action is to delete and block the number without replying — even a polite reply tells them a real person is here.

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

**Verdict:** 🔴 scam · **Confidence:** 97/100 · **Risk score (Layer 1):** 33/100 · 9004 ms

**Reasons shown to the user:**

- It claims $429.99 was already taken and pushes you to call within 24 hours — a classic trick to panic you into calling.
- To 'refund' you, the agent wants you to install AnyDesk, which gives a stranger full control of your computer and bank access.
- Real companies never need remote control of your computer to reverse a charge, and they don't greet a customer as 'Dear Customer'.
- Don't call that number; check your bank or card statement for any real charge, or call Best Buy using the number on their official website.

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

**Verdict:** 🔴 scam · **Confidence:** 98/100 · **Risk score (Layer 1):** 77/100 · 101797 ms

**Reasons shown to the user:**

- You cannot win a lottery you never entered, and no real draw picks winners by mobile number.
- It asks for a $299 fee before releasing the money — real prizes never require you to pay first.
- It wants your date of birth and a copy of your ID, which is exactly what someone needs to steal your identity.
- It pushes you to a private WhatsApp number and a 48-hour deadline so you won't stop to check — delete it and don't reply.

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

**Verdict:** 🔴 scam · **Confidence:** 98/100 · **Risk score (Layer 1):** 85/100 · 16913 ms

**Reasons shown to the user:**

- It asks you to send $500 in cryptocurrency to a stranger's wallet — that money can never be recovered.
- The promise of '340% returns with zero losses' is impossible; no real investment works that way.
- It pushes you to act tonight because 'only 3 spots' remain, a classic trick to stop you thinking it over.
- It moves you to a private Telegram chat with 'CryptoMentorLisa' — no licensed investment firm operates this way.

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

**Verdict:** 🟢 likely safe · **Confidence:** 92/100 · **Risk score (Layer 1):** 0/100 · 13916 ms

**Reasons shown to the user:**

- The link goes to the real UPS website, ups.com, not a lookalike address.
- It doesn't ask for money, a password, or any personal information — it just tells you when the package arrives.
- It names the sender (REI) and gives a tracking number you can type into ups.com yourself to check.
- It includes the standard 'reply STOP to opt out' notice that real delivery alert services use.

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

**Verdict:** 🟢 likely safe · **Confidence:** 62/100 · **Risk score (Layer 1):** 0/100 · 181299 ms · ⚠️ rules-only fallback

**Reasons shown to the user:**

- This message contains no links at all, so there is nothing to click that could steal your information.
- This message does not ask you for money or payment of any kind.
- This message does not pressure you to act immediately.
- Our detailed checker was unavailable, so this is a quick automatic assessment — double-check before acting on it.

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

**Verdict:** 🟢 likely safe · **Confidence:** 95/100 · **Risk score (Layer 1):** 0/100 · 29081 ms

**Reasons shown to the user:**

- It's a simple appointment reminder that names your dentist, Dr. Patel, and a specific date and time you can check against your own calendar.
- It asks for no money, no password, and no personal details of any kind.
- There are no links to click — just a front desk phone number you can look up independently to confirm.
- It even says no action is needed if the time still works, which is the opposite of scam pressure.

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

**Verdict:** 🟢 likely safe · **Confidence:** 92/100 · **Risk score (Layer 1):** 0/100 · 36091 ms

**Reasons shown to the user:**

- This is a normal Google sign-in code message; it tells you the code but never asks you to send or share it.
- It warns you not to give the code to anyone, including people claiming to be from Google — real scam messages want the opposite.
- The only link goes to Google's own real website, google.com, not a lookalike.
- If you did not ask for this code, don't reply to anyone about it — just change your Google password yourself by typing google.com into your browser.

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

**Verdict:** 🟢 likely safe · **Confidence:** 93/100 · **Risk score (Layer 1):** 0/100 · 65619 ms

**Reasons shown to the user:**

- It only tells you about an upcoming renewal and says no action is needed — it asks for nothing.
- The one link goes to the real Netflix website, netflix.com, not a lookalike address.
- It names the last four digits of your Visa card, something a stranger would not know.
- It doesn't ask for your password, a code, or any payment.

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

**Verdict:** 🟡 be careful · **Confidence:** 60/100 · **Risk score (Layer 1):** 0/100 · 71957 ms

**Reasons shown to the user:**

- It asks for $1,450 by Zelle, which works like handing over cash — once sent, it cannot be reversed if the person isn't really Danny.
- The payment goes to a free Gmail address rather than a business account, which is what scammers use when they pretend to be a contractor you hired.
- In its favour, it names a real job you'd remember, doesn't rush you, and offers to collect a cheque instead — a scammer rarely offers the slower option.
- Before paying, call Kowalski Landscaping on the number from your original paperwork and confirm the amount and the email; if it's genuine, just write the cheque.

**Layer 1 red flags:** `p2p_payment_request`

**Layer 1 legitimacy signals:** `recognized_brand_domain`, `no_urgency_pressure`

---

### 15. Political fundraising text  ✅ pass

`border-political-fundraising` · **borderline** · expected uncertain_be_careful or likely_safe

> Aggressive urgency, a shortened link, a money ask — but this is legal, extremely common, and not fraud. Tests whether pressure alone triggers a scam verdict.

**Input (truncated, PII redacted):**

```
URGENT: The FEC deadline is at MIDNIGHT and we are $4,200 short of our goal. 😳 Sarah, we've asked 3 times and haven't heard back. If we miss this deadline our opponents will outspend us 3-to-1 in the final stretch. Can you chip in $25 rig…
```

**Verdict:** 🟡 be careful · **Confidence:** 60/100 · **Risk score (Layer 1):** 0/100 · 38265 ms

**Reasons shown to the user:**

- This looks like a political fundraising text, and real campaigns do send these — but scammers copy them almost word for word.
- The donation link is a shortened bit.ly address, so you can't see what website it actually opens before you tap it.
- It leans hard on pressure — 'MIDNIGHT', 'we've asked 3 times' — to get you to give money before you think it over.
- If you want to support this group, look them up yourself or give through a site you know, rather than using this link.

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

**Verdict:** 🟢 likely safe · **Confidence:** 80/100 · **Risk score (Layer 1):** 0/100 · 6448 ms

**Reasons shown to the user:**

- It asks only for your student's name, birth date and an emergency contact — normal information for a school sports form, not passwords or bank details.
- It doesn't ask for any money or payment, and there's no threat about your account.
- The link is an ordinary Google Forms address, not a lookalike of a bank or company website.
- Anyone can create a Google form, so if you want to be sure, call the school's athletics office using the number from the school's own website.

**Layer 1 red flags:** _none_

**Layer 1 legitimacy signals:** `no_payment_request`, `no_urgency_pressure`, `recognized_brand_domain`, `no_action_requested`

---

## How to read this

- **Expected** is what a careful human reviewer should conclude, not ground truth from a dataset. Some fixtures legitimately accept two verdicts.
- **Neighbouring verdict** (⚠️ off) means the tool was more or less cautious than expected but did not make a dangerous call — e.g. "be careful" on a real message. Worth reading; not a blocker.
- **Risk score** is Layer 1's advisory heuristic. It is deliberately *not* the verdict — comparing it against the final verdict shows how much the AI layer is actually adding.

Regenerate with `npm run test:checks`. Fixtures live in `fixtures/messages.ts`.
