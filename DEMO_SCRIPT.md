# Demo Script — 2 minutes

**Live:** https://havenscamprotection.website
**Theme:** Cybersecurity & Digital Trust

> **No warm-up needed.** Checks run in about 1.5 seconds, so the three examples return almost immediately whether or not they're cached. Just confirm the site loads before you go on.
---

## The hook (15 seconds)

> "Last year Americans lost **$12.5 billion** to scams. The people losing the most are over 60 — not because they're careless, but because these messages are genuinely hard to tell apart, and the tools that exist are built for security analysts, not for your grandmother.
>
> So we built the simplest possible thing. You paste the message. It tells you, in plain English, whether it's real."

*Have the site already open on the compose screen.*

---

## Beat 1 — It catches the scam (25 seconds)

**Click "A delivery text."** Then **"Check it."**

> "This is a real smishing pattern — a fake USPS delivery notice."

*Verdict lands red: **"This looks like a scam."***

> "Not a risk score. Not 'threat level: elevated.' A sentence. And underneath, why — in words that don't need explaining."

**Read one reason aloud, pointing at it:**

> "*'The link goes to usps-trackdelivery.icu, which is not the real USPS website.'* That's the actual thing that's wrong with it, in language my grandmother can act on."

---

## Beat 2 — It doesn't cry wolf (35 seconds) ← *the important one*

**Click "A shipping update."** Then **"Check it."**

> "Now here's the part that actually matters. This is a **real** UPS notification. Same shape as the scam: a brand name, a tracking number, a link, a delivery date."

*Verdict lands green: **"This looks legitimate."***

> "Green. And this is the whole ballgame — because a scam detector that flags real messages is worse than useless. You get burned once, you stop trusting it, and then you ignore it on the day it actually matters.
>
> Every one of our five legitimate test messages comes back clean. Including a real bank fraud alert, which is urgent, mentions suspicious activity, and names a brand — everything a naive filter would flag."

---

## Beat 3 — Why two layers (35 seconds)

**Click "A wrong number."** Then **"Check it."**

> "A stranger texts 'sorry, wrong number,' then starts chatting. This is how essentially every romance and crypto scam begins."

*Verdict lands red.*

> "Here's the thing. We run **two** layers. First a deterministic rules engine — lookalike domains, gift-card demands, urgency patterns. It scores this message **zero out of a hundred**. No links. No payment request. No urgency. There is literally nothing for a rules engine to match on.
>
> The AI layer catches it anyway, because it understands what the message is *setting up*.
>
> And it runs the other way too. The rules layer catches homoglyph domains — a Cyrillic 'а' pretending to be a Latin 'a' — deterministically, every single time, and it still works when the API is down. Neither layer is sufficient. That's the architecture."

---

## Close — engineering rigor (20 seconds)

> "Two bugs we caught building this, because we tested rather than assumed.
>
> **One:** our Unicode normalizer was folding a Cyrillic lookalike domain into the *real* PayPal domain — so an impersonation site got credited as genuine. The anti-evasion code was creating the vulnerability.
>
> **Two:** the AI was quoting card numbers and Social Security numbers back inside its explanations. Invisible until we had a live API key, because without one everything fell back to the rules layer. Now stripped server-side.
>
> That's the difference between a prompt wrapper and a product. 16 out of 16 on our classification suite, 91 assertions on edge cases and privacy. It's live, it's open source, and a check takes about a second and a half."

---

## If asked

**"Is this just ChatGPT with a prompt?"**
> No. The rules layer is deterministic and runs offline — it catches lookalike domains and gift-card demands identically every time, and still works if the API is down. It feeds structured evidence into the model, which is why the reasons cite specific domains and amounts instead of being vague. And the model is explicitly instructed that rule hits are *evidence, not proof* — that's what stops it rubber-stamping the rules layer and flagging every urgent-sounding real message.

**"What about false positives?"**
> That's the metric we optimised for. Five legitimate messages in the suite, all clean. The rules layer hunts for *legitimacy* signals too — genuine brand domains, order numbers a stranger couldn't know, opt-out footers, and the absence of any ask — with negative weights. Without counter-evidence you'd flag every real bank alert.

**"How fast is it?"**
> About a second and a half, and instant on a repeat. That covers the deterministic rules layer, the model reasoning over its evidence, and writing four specific explanations.

**"What's the privacy story?"**
> We never store the message. Only a salted hash — enough to count duplicates, impossible to reverse. Card numbers and SSNs are stripped from the AI's output before it leaves the server.

**"What's next?"**
> Family alerting — an adult child gets notified when a parent checks something that comes back as a scam. The schema is in the repo; the logic isn't built. That's a deliberate scope line, not a claim.

---

## Backup if the live site misbehaves

1. `npm run dev` locally → http://localhost:3600 (same UI, same code).
2. `TEST_RESULTS.md` in the repo — the full 16-case table with verdicts and reasons.
3. Screenshots of all three verdict states.

**Do not** improvise a new example live. The three buttons are chosen because they tell the whole story in order.
