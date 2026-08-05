# Test Results — "Is This Real?"

Generated: 2026-08-05T19:28:00.598Z  ·  Model: `claude-opus-5`  ·  Effort: `low`

## Verdict on the verdicts

**All 16/16 cases landed where a careful human reviewer would put them.** No legitimate message was called a scam, and no scam was called safe. This is demo-ready.

| Metric | Result |
| --- | --- |
| Exact matches | **16/16** |
| Neighbouring verdict | 0 |
| 🚨 Legitimate flagged as scam | **0** (good) |
| 🚨 Scam called safe | **0** (good) |
| Average latency | 6340 ms |
| Rules-only fallbacks | 0 |

Test set: 8 scams · 5 legitimate · 3 borderline.

### Effort level: settled on `low`

| Effort | Accuracy | Avg latency | Rules-only fallbacks |
| --- | --- | --- | --- |
| `medium` (previous) | 16/16 | ~14–30 s per check | 2 (rate-limited out) |
| **`low` (current)** | **16/16** | **~6 s per check** | **0** |

`low` is **4–5× faster with zero accuracy cost** — no fixture flipped, and confidence actually rose on two of the hardest cases (the fake bank alert 80→95, the real bank alert 62→88). There was no quality/speed tradeoff to split, so no middle ground was needed.

The system prompt (~1,800 tokens) is prompt-cached, so the steady-state warm path is ~5.8–6.7 s. The first check after an idle period pays a cold-cache penalty and can take ~25 s.

~6 s misses the 2–3 s ideal: it is the model's generation floor for reasoning plus four written reasons at this effort. Going lower means a smaller model or fewer/shorter reasons — both trade away the thing that makes the output trustworthy. The UI is built to hold this wait deliberately.

## At a glance

| # | Case | Type | Expected | Got | Conf. | |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Fake USPS redelivery fee | scam | 🔴 scam | 🔴 scam | 97 | ✅ pass |
| 2 | Fake bank fraud alert | scam | 🔴 scam | 🔴 scam | 95 | ✅ pass |
| 3 | Fake SSA arrest threat | scam | 🔴 scam | 🔴 scam | 99 | ✅ pass |
| 4 | Gift-card request (impersonation) | scam | 🔴 scam | 🔴 scam | 98 | ✅ pass |
| 5 | Romance / pig-butchering opener | scam | 🔴 scam | 🔴 scam | 93 | ✅ pass |
| 6 | Fake tech-support renewal invoice | scam | 🔴 scam | 🔴 scam | 97 | ✅ pass |
| 7 | Prize / lottery scam | scam | 🔴 scam | 🔴 scam | 99 | ✅ pass |
| 8 | Crypto investment scam | scam | 🔴 scam | 🔴 scam | 99 | ✅ pass |
| 9 | Real shipping notification | legitimate | 🟢 likely safe | 🟢 likely safe | 93 | ✅ pass |
| 10 | Real bank security alert | legitimate | 🟢 likely safe / 🟡 be careful | 🟢 likely safe | 88 | ✅ pass |
| 11 | Real appointment reminder | legitimate | 🟢 likely safe | 🟢 likely safe | 95 | ✅ pass |
| 12 | Real two-factor code | legitimate | 🟢 likely safe | 🟢 likely safe | 92 | ✅ pass |
| 13 | Real subscription renewal notice | legitimate | 🟢 likely safe | 🟢 likely safe | 93 | ✅ pass |
| 14 | Contractor invoice via Zelle | borderline | 🟡 be careful / 🔴 scam | 🟡 be careful | 55 | ✅ pass |
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

**Verdict:** 🔴 scam · **Confidence:** 97/100 · **Risk score (Layer 1):** 100/100 · 6287 ms

**Reasons shown to the user:**

- The link goes to "usps-trackdelivery.icu", not the real USPS website usps.com.
- It asks for a $2.99 fee, which means handing your card details to a fake site — USPS does not charge redelivery fees by text.
- The "reply Y then reopen this message" trick is used to get around your phone's spam blocking.
- If you're expecting a package, check it at usps.com or call USPS yourself instead of using this link.

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

**Verdict:** 🔴 scam · **Confidence:** 95/100 · **Risk score (Layer 1):** 75/100 · 5662 ms

**Reasons shown to the user:**

- The link goes to 'chasealerts-online.com', not Chase's real website — the word Chase is just dressed up in front of a stranger's address.
- It threatens to lock your account within 30 minutes so you click without thinking; real banks don't set a 30-minute clock.
- It asks you to 'verify your identity' on that page, which is how they collect your login details.
- If you're worried about the $847.32 charge, call the number on the back of your Chase card instead of using this link.

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

**Verdict:** 🔴 scam · **Confidence:** 99/100 · **Risk score (Layer 1):** 59/100 · 5690 ms

**Reasons shown to the user:**

- It demands $2,480 in Apple gift cards — no government agency ever asks to be paid that way.
- Social Security numbers are never 'suspended', and the agency doesn't threaten arrest by phone or text.
- It tells you not to discuss the case with anyone, a trick to stop you checking with family or your bank.
- Don't call that number; if worried, hang up and call Social Security yourself at 1-800-772-1213.

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

**Verdict:** 🔴 scam · **Confidence:** 98/100 · **Risk score (Layer 1):** 8/100 · 6138 ms

**Reasons shown to the user:**

- It asks you to buy $400 in Apple gift cards and text photos of the codes — that is money a scammer can take instantly and you can never get back.
- It says the sender can't talk on the phone right now, which stops you from checking that it's really your pastor.
- It asks you to keep it secret 'as a surprise', a classic trick to stop you asking anyone for advice.
- Call your church office or the pastor's known number yourself before doing anything — real churches never buy supplies this way.

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

**Verdict:** 🔴 scam · **Confidence:** 93/100 · **Risk score (Layer 1):** 0/100 · 6167 ms

**Reasons shown to the user:**

- The classic 'wrong number' opening — a stranger texts about lunch with 'David', then apologizes and keeps chatting anyway.
- She immediately mentions luxury wine import and 'fate', which is how these fake-friendship money scams begin.
- She wants to move you to WhatsApp right away, where the conversation usually turns into a fake investment or crypto request.
- Best action: do not reply at all, block and delete the number — replying tells them a real person is here.

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

**Verdict:** 🔴 scam · **Confidence:** 97/100 · **Risk score (Layer 1):** 33/100 · 7567 ms

**Reasons shown to the user:**

- It claims you were charged $429.99 for a plan you never bought, to panic you into calling.
- The number given asks you to install 'AnyDesk', which lets a stranger take control of your computer and your bank accounts.
- Real companies never need remote control of your computer to refund money.
- If you're worried about a charge, hang up and call Best Buy or your bank using the number on your card or statement.

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

**Verdict:** 🔴 scam · **Confidence:** 99/100 · **Risk score (Layer 1):** 77/100 · 6065 ms

**Reasons shown to the user:**

- You cannot win a lottery you never entered, and no real prize requires a $299 'clearance fee' up front.
- It asks for your ID copy, date of birth and address — everything needed to steal your identity.
- It pushes you onto WhatsApp with a stranger and says the offer dies in 48 hours to rush you.
- Do not reply, pay, or send documents; simply delete it, and if unsure ask a family member.

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

**Verdict:** 🔴 scam · **Confidence:** 99/100 · **Risk score (Layer 1):** 85/100 · 5843 ms

**Reasons shown to the user:**

- It asks you to send $500 in cryptocurrency to a stranger's wallet — money sent that way can never be recovered.
- Promises of 340% returns with 'zero losses' are impossible; no real investment works this way.
- It pressures you with 'only 3 spots remaining' and a window closing tonight so you won't stop to think.
- It wants you to move to Telegram to talk privately — a common trick to avoid being reported.

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

**Verdict:** 🟢 likely safe · **Confidence:** 93/100 · **Risk score (Layer 1):** 0/100 · 6869 ms

**Reasons shown to the user:**

- The link goes to the real UPS website, ups.com, not a lookalike address.
- It just tells you a delivery date and gives a tracking number you can look up yourself.
- It doesn't ask for money, a password, or any personal details.
- It has the normal 'reply STOP to opt out' notice that real delivery alerts include.

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

**Verdict:** 🟢 likely safe · **Confidence:** 88/100 · **Risk score (Layer 1):** 0/100 · 5618 ms

**Reasons shown to the user:**

- It only asks you to reply YES or NO — no link to click, no money, no personal details requested.
- It names the exact amount, store and the last four digits of your card, which a stranger wouldn't know.
- It even tells you it will never ask for your password, PIN or a code, and to call the number on the back of your card.
- To be completely sure, call the number printed on your card rather than any number in a text.

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

**Verdict:** 🟢 likely safe · **Confidence:** 95/100 · **Risk score (Layer 1):** 0/100 · 4901 ms

**Reasons shown to the user:**

- It's a normal appointment reminder naming your dentist, Dr. Patel, and a specific date and time.
- There are no links to click and it asks for no money, password, or personal details.
- It says no action is needed, and gives a front desk number you can check against your own records.

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

**Verdict:** 🟢 likely safe · **Confidence:** 92/100 · **Risk score (Layer 1):** 0/100 · 5414 ms

**Reasons shown to the user:**

- This is a real Google code message — it tells you the code and warns you not to share it with anyone.
- The only link goes to Google's own website, myaccount.google.com, not a lookalike.
- It doesn't ask for money, a password, or for you to send the code back.
- If you didn't request it, don't share the code with anyone who calls or texts asking for it.

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

**Verdict:** 🟢 likely safe · **Confidence:** 93/100 · **Risk score (Layer 1):** 0/100 · 5247 ms

**Reasons shown to the user:**

- It only tells you your subscription renews and says no action is needed.
- The link goes to Netflix's real website, netflix.com, not a lookalike.
- It names the last four digits of your card, which a stranger wouldn't know.
- It never asks for a password, code, or payment.

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

**Verdict:** 🟡 be careful · **Confidence:** 55/100 · **Risk score (Layer 1):** 0/100 · 11258 ms

**Reasons shown to the user:**

- It asks for $1,450 by Zelle, which is like handing over cash — you can't get it back if the sender isn't really Danny.
- The payment address is a free Gmail account, not a company email, which is something a stranger could easily set up.
- Good signs: it names a real job you'd remember, doesn't rush you, and offers to collect a check instead.
- Before paying, call Kowalski Landscaping on the number you've used before and confirm the amount and how to pay — then choose the check.

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

**Verdict:** 🟡 be careful · **Confidence:** 60/100 · **Risk score (Layer 1):** 0/100 · 6332 ms

**Reasons shown to the user:**

- This is the classic style of real political fundraising texts, which do use all-caps deadlines and guilt — but scammers copy that style exactly.
- The link is a shortened bit.ly address, so you cannot see what website it really goes to before tapping.
- It asks you to send $25 right now, and there's no way to tell where that money would actually land.
- If you want to support this group, look them up yourself and donate through their own website rather than through this link.

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

**Verdict:** 🟢 likely safe · **Confidence:** 80/100 · **Risk score (Layer 1):** 0/100 · 6375 ms

**Reasons shown to the user:**

- It asks only for routine school information like your student's name and emergency contact, not passwords, card numbers or money.
- The link goes to Google Forms (forms.gle), a normal tool schools use, not a lookalike bank or payment site.
- The deadline for sports physicals is a normal school date, not a threat to close an account.
- If you want to be sure, call the school athletics office using the number from the school's own website before filling it in.

**Layer 1 red flags:** _none_

**Layer 1 legitimacy signals:** `no_payment_request`, `no_urgency_pressure`, `recognized_brand_domain`, `no_action_requested`

---

## How to read this

- **Expected** is what a careful human reviewer should conclude, not ground truth from a dataset. Some fixtures legitimately accept two verdicts.
- **Neighbouring verdict** (⚠️ off) means the tool was more or less cautious than expected but did not make a dangerous call — e.g. "be careful" on a real message. Worth reading; not a blocker.
- **Risk score** is Layer 1's advisory heuristic. It is deliberately *not* the verdict — comparing it against the final verdict shows how much the AI layer is actually adding.

Regenerate with `npm run test:checks`. Fixtures live in `fixtures/messages.ts`.
