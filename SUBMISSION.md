# Submission Checklist — NextGen Innovation 2026

**Theme:** Cybersecurity & Digital Trust

| Item | Status | Value |
| --- | --- | --- |
| Live demo URL | ✅ Ready | https://haven-safe.vercel.app |
| Source code | ✅ Public | https://github.com/abhinavalwarappan-art/haven |
| Project description | ✅ Drafted | Below — copy/paste |
| Theme selection | ✅ | Cybersecurity & Digital Trust |
| Demo script | ✅ Written | [DEMO_SCRIPT.md](DEMO_SCRIPT.md) — 2 min, rehearsed order |
| Test evidence | ✅ | [TEST_RESULTS.md](TEST_RESULTS.md) — 16/16, full reasoning shown |
| API credits | ✅ Live | Gemini key active; live demo returns real AI verdicts |
| **Demo video** | ⬜ **TODO** | Needs recording |
| **Team info** | ⬜ **TODO** | Placeholder below |
| **Pitch deck** | ⬜ **TODO** | If required |

---

---

## Project description (copy/paste)

**Short (one line)**
> Paste any suspicious text, email or DM and get an instant plain-English verdict on whether it's a scam — built for the people scammers target most.

**Medium (~100 words)**
> Americans lost $12.5 billion to scams last year, and the hardest-hit group is over 60. Existing tools are built for security analysts, not for the person actually holding the suspicious text.
>
> Haven is one box and one button. Paste a message, get back "This looks like a scam," "This looks legitimate," or "Be careful with this one" — with 2–4 specific reasons written for a non-technical reader.
>
> Under the hood it runs two layers: a deterministic rules engine that catches lookalike domains and gift-card demands offline and identically every time, feeding structured evidence into a Gemini classifier that reads context. Neither layer is sufficient alone — the romance-scam opener in our test set scores 0/100 on rules and is still caught.
>
> The metric we optimised for isn't catching scams; it's *not* flagging real messages. A detector that cries wolf gets ignored on the day it matters. All five legitimate messages in our evaluation set — including a real bank fraud alert — come back clean.

**Technical summary**
> TypeScript · Fastify · Google Gemini (JSON-schema structured output) · Vercel serverless + edge firewall · SQLite locally, Supabase adapter ready.
> 16/16 on a hand-built classification suite (8 scams, 5 legitimate-but-suspicious-looking, 3 borderline). 91 edge-case and privacy assertions. Messages are never stored — only a salted HMAC. Card numbers and SSNs are stripped from AI output before it leaves the server.

---

## Team info — **fill this in**

| Field | Value |
| --- | --- |
| Team name | _TODO_ |
| Members | _TODO — names, schools, roles_ |
| Contact email | _TODO_ |
| School | Flower Mound High School |

---

## Demo video — **needs recording**

Not started. [DEMO_SCRIPT.md](DEMO_SCRIPT.md) has the full 2-minute script with timings.

Suggested shape (~90s):

1. **0:00–0:15** — Hook: $12.5B, over-60s hit hardest, existing tools built for analysts.
2. **0:15–0:40** — Paste the fake delivery text → red verdict, read one reason aloud.
3. **0:40–1:15** — Paste the real shipping update → green. *This is the money shot.* Same shape, correctly cleared.
4. **1:15–1:40** — Paste the wrong-number opener → red, despite 0/100 on rules. Why two layers.
5. **1:40–2:00** — The two bugs found (homoglyph spoofing, PII leak) as evidence of rigor.

**Record on a phone in portrait** — the UI is mobile-first and it's a mobile product. Warm the three examples immediately before recording so they return instantly (see the warm-up note at the top of DEMO_SCRIPT.md — the window is only 60s while credits are empty).

**Checks now run in ~1.5s**, so the wait is barely perceptible on camera — you no longer need to pre-warm the examples to avoid a pause.

---

## Pre-submission checks

```bash
# All should pass
npm run build          # typecheck
npm run test:checks    # 16/16 classification
npm run test:edge      # 91 edge + privacy assertions
npm run test:limits    # 31 rate-limit, cache and hashing assertions
```

- [x] Live URL returns `"classifier":"ai"` with a real model
- [ ] Live URL loads on a phone
- [ ] All three examples return correct verdicts
- [ ] Video recorded
- [ ] Team info filled in
- [ ] GitHub repo is public and README renders
