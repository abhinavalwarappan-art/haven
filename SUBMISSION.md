# Submission Checklist — NextGen Innovation 2026

**Theme:** Cybersecurity & Digital Trust

| Item | Status | Value |
| --- | --- | --- |
| Live demo URL | ✅ Ready | https://is-this-real-app.vercel.app |
| Source code | ✅ Public | https://github.com/abhinavalwarappan-art/is-this-real |
| Project description | ✅ Drafted | Below — copy/paste |
| Theme selection | ✅ | Cybersecurity & Digital Trust |
| Demo script | ✅ Written | [DEMO_SCRIPT.md](DEMO_SCRIPT.md) — 2 min, rehearsed order |
| Test evidence | ✅ | [TEST_RESULTS.md](TEST_RESULTS.md) — 16/16, full reasoning shown |
| **API credits** | 🔴 **BLOCKED** | Balance is zero — live demo is degraded until topped up |
| **Demo video** | ⬜ **TODO** | Needs recording |
| **Team info** | ⬜ **TODO** | Placeholder below |
| **Pitch deck** | ⬜ **TODO** | If required |

---

## 🔴 Blocking: top up Anthropic credits

The live URL currently answers from the **rules layer only** and says so in the UI. Full quality returns the moment the balance is positive — no redeploy, no config change.

→ https://console.anthropic.com/settings/billing

**Verify it's fixed:** paste anything into the live site. If you *don't* see "The AI layer was unavailable," you're good. Or:

```bash
curl -s https://is-this-real-app.vercel.app/api/check -H 'content-type: application/json' \
  -d '{"text":"USPS: package held, pay $2.99 at http://usps-track.icu/pay"}' | grep -o '"classifier":"[a-z_]*"'
```

Want `"classifier":"claude"`. If it says `"heuristic_fallback"`, credits are still empty.

---

## Project description (copy/paste)

**Short (one line)**
> Paste any suspicious text, email or DM and get an instant plain-English verdict on whether it's a scam — built for the people scammers target most.

**Medium (~100 words)**
> Americans lost $12.5 billion to scams last year, and the hardest-hit group is over 60. Existing tools are built for security analysts, not for the person actually holding the suspicious text.
>
> "Is This Real?" is one box and one button. Paste a message, get back "This looks like a scam," "This looks legitimate," or "Be careful with this one" — with 2–4 specific reasons written for a non-technical reader.
>
> Under the hood it runs two layers: a deterministic rules engine that catches lookalike domains and gift-card demands offline and identically every time, feeding structured evidence into a Claude classifier that reads context. Neither layer is sufficient alone — the romance-scam opener in our test set scores 0/100 on rules and is still caught.
>
> The metric we optimised for isn't catching scams; it's *not* flagging real messages. A detector that cries wolf gets ignored on the day it matters. All five legitimate messages in our evaluation set — including a real bank fraud alert — come back clean.

**Technical summary**
> TypeScript · Fastify · Claude Opus 5 (structured JSON output) · Vercel serverless + edge firewall · SQLite locally, Supabase adapter ready.
> 16/16 on a hand-built classification suite (8 scams, 5 legitimate-but-suspicious-looking, 3 borderline). 85 edge-case and privacy assertions. Messages are never stored — only a salted HMAC. Card numbers and SSNs are stripped from AI output before it leaves the server.

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

**Before recording, confirm credits are topped up** — rules-only reasons are generic and will undercut the demo.

---

## Pre-submission checks

```bash
# All should pass
npm run build          # typecheck
npm run test:checks    # 16/16 classification
npm run test:edge      # 85 edge + privacy assertions
npm run test:limits    # 31 rate-limit, cache and hashing assertions
```

- [ ] Credits topped up, live URL returns `"classifier":"claude"`
- [ ] Live URL loads on a phone
- [ ] All three examples return correct verdicts
- [ ] Video recorded
- [ ] Team info filled in
- [ ] GitHub repo is public and README renders
