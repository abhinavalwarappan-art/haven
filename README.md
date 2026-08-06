# Is This Real?

Paste in any suspicious text message, email, or DM and get a plain-English verdict — **"This looks like a scam," "This looks legitimate,"** or **"Be careful with this one"** — with specific reasons why.

Built for non-technical users, especially older adults, who are the most targeted by scams and the least equipped to spot them.

**🔗 Live demo: https://is-this-real-app.vercel.app**

Built for **NextGen Innovation 2026** · Theme: **Cybersecurity & Digital Trust**

**Status:** 16/16 on the classification suite · 85/85 on edge and privacy assertions · ~6s per check, instant on repeats · deployed.

> ⚠️ **The live demo needs Anthropic API credits.** The account backing it is currently at zero balance, so checks fall back to the rules-only layer and say so. Top up at [Plans & Billing](https://console.anthropic.com/settings/billing) to restore full quality — no redeploy needed.

---

## Quick start

```bash
npm install
```

Add your Anthropic API key to `.env.local` (copy `.env.example` if it's missing), then:

```bash
npm run dev
```

Open **http://localhost:3600**. That serves both the UI and the API from one process — it's the only command you need to demo this.

Generate a hashing salt for `HASH_SALT` with:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

> **No API key?** Everything still runs — the rules layer answers alone and the UI says so explicitly. Classification quality is much lower, so don't judge the tool by it.

### Demoing it

The UI ships with three one-click examples chosen to tell a story:

| Click | What it shows |
| --- | --- |
| **A delivery text** → 🔴 scam | Catches the fake domain and the fee |
| **A shipping update** → 🟢 legitimate | Nearly identical shape, correctly cleared. **This is the proof it doesn't cry wolf** |
| **A wrong number** → 🔴 scam | Scores **0/100** on the rules layer and is still caught — the argument for the AI layer |

---

## Run the test harness

This is the thing to look at first.

```bash
npm run test:checks
```

Runs 16 curated messages (8 real scam patterns, 5 legitimate-but-suspicious-looking, 3 genuinely ambiguous) through the full pipeline and writes **[`TEST_RESULTS.md`](TEST_RESULTS.md)** — a readable table of input, verdict, confidence, and reasons, with the two failure modes that matter called out separately:

- 🚨 **Cried wolf** — a legitimate message flagged as a scam.
- 🚨 **Missed scam** — an obvious scam called safe.

Takes ~5 minutes. Exits non-zero if either critical failure occurs.

```bash
npm run test:edge     # 85 robustness + privacy assertions, no API key needed
npm run build         # typecheck
```

---

## The interface

Mobile-first single screen, served as static files from the same Fastify process — no build step, no second server, no framework.

Four states: **compose → thinking → result | error.**

Design notes that are decisions, not decoration:

- **Warm paper and an editorial serif, not a dark security console.** The person using this is frightened. A black screen of red alerts would make that worse, and panic is what makes people act on scams.
- **The verdict is the whole screen**, not a badge — a large serif sentence on a colour field readable at arm's length.
- **Confidence is translated, never a percentage.** "We're very confident it is a scam", not "97%". A number invites the reader to do risk arithmetic, which is the wrong task. The `uncertain` verdict gets its own phrasing ("genuinely unclear — there are signs both ways") since high confidence there means confidently ambiguous.
- **The wait is narrated honestly.** A ~6s check shows rotating copy tracking real pipeline stages — "Checking where the links really go…" — with a bar that eases toward 92% and only completes on a real response. It never claims to be done before it is.
- **Type is oversized throughout** for imperfect eyesight, and all text meets WCAG AA contrast (verified, ≥4.66:1).
- **Fonts are locally available** (Iowan Old Style / Charter, Avenir Next) so there is no webfont request to flash or fail on venue wi-fi.

## The API

### `POST /api/check`

```bash
curl -X POST http://localhost:3600/api/check \
  -H 'content-type: application/json' \
  -d '{"text":"Your account will be closed. Verify at http://chase-secure.tk/login"}'
```

```jsonc
{
  "verdict": "scam",                    // "scam" | "likely_safe" | "uncertain_be_careful"
  "confidence": 94,                     // 0-100
  "reasons": [
    "The link goes to \"chase-secure.tk\", not chase.com — it only looks like Chase.",
    "It threatens to close your account to rush you into acting without thinking.",
    "If you're unsure, call the number on the back of your card instead of using this link."
  ],
  "flags_detected": ["urgency_language", "lookalike_domain", "suspicious_tld"],
  "raw_signals": { /* full Layer 1 output — see below */ },
  "meta": {
    "classifier": "claude",             // or "heuristic_fallback"
    "model": "claude-opus-5",
    "duration_ms": 4820,
    "check_id": "701347a5-…",
    "cached": false,                    // true = served from cache, not re-classified
    "notice": null                      // set to a caveat string when degraded
  }
}
```

`meta.cached` is `true` when the verdict came from the cache. `duration_ms` stays honest either way, so a fast response is never mistaken for a fast *classification*.

`meta.notice` is non-null when the AI layer didn't run — **if you consume this API, surface it**, because a rules-only verdict can be confidently wrong and the caveat is deliberately not inside `reasons`.

**Errors** return `{ error, message }`, with `message` written for the end user:

| Status | `error` | When |
| --- | --- | --- |
| 400 | `empty_input`, `invalid_type`, `too_long`, `invalid_body` | Bad request |
| 429 | `rate_limited` | Per-IP limit hit. Includes `retry_after_seconds` and a `retry-after` header |
| 429 | `busy` | Global cost ceiling hit |
| 500 | `check_failed` | Unexpected server error |

### `GET /api/limits`

Current rate-limit configuration — `window_ms`, `max_per_ip`, `max_per_ip_cached`, `global_max`.

### `GET /api/stats`

```jsonc
{ "total_checks": 412, "scams_flagged": 173, "likely_safe": 190, "uncertain": 49, "scam_rate": 42.0 }
```

Aggregates only — individual checks are never exposed.

### `GET /api/examples`

The three demo messages, read from the evaluation fixtures so what judges click is literally what the test suite grades.

### `GET /health`

Reports which store and classifier are actually active. Useful for confirming your env is wired up.

---

## Architecture: why two layers, not one LLM call

```
   pasted text
        │
        ▼
┌───────────────────────────────────────────┐
│  LAYER 1 — rules / heuristics             │   fast · deterministic · offline
│  urgency · payment · links · identity     │
│  + legitimacy counter-evidence            │
└───────────────────┬───────────────────────┘
                    │  structured signal object (evidence, NOT a verdict)
                    ▼
┌───────────────────────────────────────────┐
│  LAYER 2 — Claude classification agent    │   judgement · plain-English reasons
│  original text + Layer 1 signals          │
│  structured JSON output                   │
└───────────────────┬───────────────────────┘
                    ▼
        verdict · confidence · reasons
                    │
                    ▼
        store hash only (never raw text)
```

**Why not just one Claude call?**

- **Grounding.** The model gets concrete evidence — *this exact domain imitates PayPal*, *these exact words demand payment in gift cards* — instead of reasoning from scratch. Reasons come out specific and checkable rather than vague.
- **Determinism where it's cheap.** Lookalike-domain detection is a string algorithm, not a judgement call. `amaz0n.com` should be caught identically every single time, and it should still be caught when the API is down.
- **Graceful degradation.** No API key, rate limit, timeout, or model refusal takes the product offline — Layer 1 answers alone, clearly marked.
- **Explainability.** For a Digital Trust pitch, "here is exactly what we detected and why" is far stronger than "the AI said so."

**Why not just the rules?** Because rules are blind to context. In the test set, the romance-scam opener scores **0/100** on Layer 1 — no links, no payment ask, no urgency, nothing to match. The AI layer calls it a scam at 93% confidence because it understands what the message is *setting up*. That case alone is the argument for the second layer.

### The hard part: not crying wolf

The failure that kills this product isn't missing a scam — it's flagging a real bank alert. Users who get burned once stop trusting the tool and then ignore it on the day it matters.

Three design decisions address this directly:

1. **Layer 1 produces evidence, never a verdict.** `riskScore` is advisory input to the model and is never surfaced as an answer.
2. **Layer 1 also hunts for *legitimacy* signals** — a genuine brand domain, an order number a stranger couldn't know, a compliant `reply STOP` footer, the absence of any ask. Without counter-evidence, an accumulate-suspicion-only system flags every urgent message.
3. **The prompt makes the discriminator explicit:** judge by *what the message asks you to do*, not by tone. Real companies use urgency constantly; they don't ask for gift cards.

All 5 legitimate fixtures score **0/100** on Layer 1 and come back `likely_safe`.

---

## Project layout

```
public/                    the demo UI — no build step
├── index.html             semantic markup, four stages
├── styles.css             design tokens + components
└── app.js                 state machine, copy, fetch
src/
├── server.ts              Fastify app (API + static UI)
├── routes/                check.ts · stats.ts · examples.ts
├── lib/
│   ├── pipeline.ts        orchestration + heuristic fallback  ← start here
│   ├── classifier.ts      Layer 2: Claude, prompt, JSON schema
│   ├── normalize.ts       unicode / homoglyph / evasion handling
│   ├── privacy.ts         hashing, redaction, evidence clipping
│   ├── types.ts           shared contracts
│   └── signals/           Layer 2 detectors
│       ├── index.ts       aggregation + advisory scoring
│       ├── urgency.ts     pressure, threats, suspension
│       ├── payment.ts     gift cards, wire, crypto, P2P, fees
│       ├── links.ts       shorteners, lookalikes, spoofs, mismatches
│       ├── impersonation.ts  brands, channel switching, credentials
│       └── legitimacy.ts  counter-evidence  ← the anti-cry-wolf piece
├── store/                 index.ts (selection) · sqlite.ts · supabase.ts
fixtures/messages.ts       the 16 curated test messages
scripts/                   test-checks.ts · test-edge-cases.ts · check.ts
supabase/migrations/       0001_init.sql
```

All logic lives in `src/lib/`, so the HTTP layer is disposable — the same `runCheck()` powers the API, the CLI, and the test harness.

---

## Data layer

**SQLite, deliberately** — Node's built-in `node:sqlite`, zero configuration, no native build. It backs the `/api/stats` counter and needs no provisioning, which is the right trade for a hackathon demo.

A **Supabase adapter is written and ready but unused.** The account is at its free-project limit, and switching is two env vars (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) plus applying [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — no code changes. It's there so "how would this scale?" has a real answer, not a slide.

**Tables:** `checks` (one row per check) and `family_links` (**stub schema only** — the "alert my adult child when Mum gets a scam text" idea is roadmap, not built).

### Privacy

The pitch is digital trust, so the raw text never persists:

- Only a **salted HMAC-SHA256** of the normalized input is stored. Not reversible; rotating `HASH_SALT` unlinks old rows by design.
- **Card numbers and Social Security numbers are stripped from the AI's written reasons** before they leave the server. The model is also told not to repeat them — this is the belt-and-braces layer, because a pasted message often contains the reader's own details and a reason that quotes them back lands in every intermediary's request log.
- Input is normalized before hashing, so the same scam pasted by 50 people collapses to one hash — enough for a "seen 50 times tonight" counter without retaining anything.
- Logs redact request bodies at the Fastify level, and `redact()` strips emails, card numbers, phone numbers and SSNs from anything else headed for stdout.
- Evidence snippets in the response are hard-clipped to 80 characters so a detector can never echo a whole message back.
- `checks` has RLS enabled with **no public policies** — the anon key cannot read rows. The public counter reads the `check_stats` aggregate view.

Verified by `npm run test:edge`, which asserts the response and the database never contain a test card number or SSN.

---

## Configuration

| Variable | Default | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | — | Required for Layer 2. Without it, every check uses the fallback. |
| `CLASSIFIER_MODEL` | `claude-opus-5` | |
| `CLASSIFIER_EFFORT` | `medium` | **Set to `low`** — 4–5× faster at identical accuracy. `.env.local` ships with `low`. |
| `CLASSIFIER_TIMEOUT_MS` | `20000` | Falls back to rules after this. |
| `HASH_SALT` | placeholder | **Change before deploying.** Server warns if unset. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | — | Both set → Supabase. Neither → local SQLite. |
| `PORT` | `3600` | |
| `CORS_ORIGIN` | `*` | |

---

## Deploying

Standalone Node service — deploys to **Railway / Render / Fly with no changes**: set the env vars, run `npm start`.

For **Vercel**, the core is already framework-agnostic. A Next.js route handler is a thin wrapper:

```ts
// app/api/check/route.ts
import { runCheck } from '@/lib/pipeline';

export async function POST(req: Request) {
  const { text } = await req.json();
  return Response.json(await runCheck(text));
}
```

Copy `src/lib/` and `src/store/` across and delete `src/server.ts` and `src/routes/`.

---

## How AI was used to build this

Disclosed in full, since the hackathon asks.

**Claude is the product**, not just a build tool — Layer 2 of the classifier is a Claude Opus 5 call with structured JSON output. That's the AI in "AI-powered scam detection", and it is doing real work: the romance-scam opener scores 0/100 on the deterministic rules and is still caught.

**Claude Code wrote most of the implementation**, working from specifications and review. Concretely, it:

- built both classification layers, the API, the store adapters, and the web UI;
- wrote the 16-message evaluation set and the 85-assertion edge suite;
- found and fixed the two bugs described below, both surfaced by tests it wrote.

**What was human-directed:** the product concept and target user, the two-layer architecture, the anti-cry-wolf requirement as the primary success metric, the tone rules for user-facing copy, the effort/latency tradeoff decision, scope boundaries (what got cut), and review of every classification result.

**What was not AI-generated:** the 16 evaluation fixtures are grounded in documented FTC / FBI IC3 / USPS / IRS scam-warning patterns rather than invented, and the expected verdicts were set by human judgement before running them.

## Known limitations

Honest list. See [DECISIONS.md](DECISIONS.md) for reasoning.

| Limitation | Detail |
| --- | --- |
| **API credits** | The live demo degrades to rules-only when the Anthropic balance hits zero. It says so in the UI rather than pretending. |
| **Stats are per-instance on Vercel** | Serverless has no shared state, so the counter reflects one warm instance and resets on cold start. Fine for demo texture; the Supabase adapter is the real fix. |
| **Cache is per-instance** | Same reason. In practice one demo session stays on one warm instance, so repeats are instant. |
| **In-app rate limit is per-instance** | 12/min/IP (200/min for cache hits, which cost nothing) works for sequential requests. Concurrent requests spread across instances and slip past it — which is why there's also a **Vercel edge rule at 40/min/IP** that genuinely is shared. Verified both on the live URL. |
| **The edge rule lives outside this repo** | It's Vercel dashboard state, not `vercel.json`. A redeploy to a *new* Vercel project silently loses it — see "Deploying your own" below. |
| **Self-hosting has no edge backstop** | On Railway/Render/Fly only the in-process limiter runs. Set `TRUST_PROXY=1` so it reads the right forwarded hop, and put a real limiter in front for anything beyond a demo. |
| **~6s per check** | The model's floor for reasoning plus four written explanations. Faster means vaguer reasons. |
| **`x-forwarded-for` is spoofable** | Only the first hop is trusted. Adequate for a cost guard; real production wants signed tokens or platform-level identity. |
| **Family alerting is schema only** | Table exists, logic does not. Deliberate scope line. |

## Deploying your own

```bash
npm i -g vercel && vercel link && vercel --prod
```

Set `ANTHROPIC_API_KEY`, `HASH_SALT`, `CLASSIFIER_EFFORT=low` in the Vercel project. `vercel.json` pins `framework: null` — without it Vercel auto-detects Fastify, finds `public/app.js`, and fails looking for a server entrypoint.

**Two things the repo can't do for you on a fresh Vercel project:**

```bash
# 1. The edge rate limit — the only limiter that works across serverless
#    instances. This is dashboard state; a new project starts without it.
vercel firewall rules add "check-api-rate-limit" --action rate_limit \
  --condition '{"type":"path","op":"pre","value":"/api/check"}' \
  --rate-limit-requests 40 --rate-limit-window 60 --rate-limit-keys ip \
  --rate-limit-action deny --duration 1m --yes
vercel firewall publish --yes

# 2. Deployment Protection is ON by default and 302s every URL to SSO,
#    which makes a public demo unreachable.
vercel project protection disable <project> --sso
```

Railway / Render / Fly run it unchanged with `npm start` and get real SQLite persistence. **Set `TRUST_PROXY=1` there** so the rate limiter reads the forwarded hop your proxy appended; without it (and without a proxy) it correctly falls back to the socket address and ignores forwarding headers, which are otherwise just spoofable user input.
