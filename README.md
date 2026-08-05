# Is This Real?

Paste in any suspicious text message, email, or DM and get an instant, plain-English verdict — **"Likely a scam," "Looks legit,"** or **"Be careful"** — with specific reasons why.

Built for non-technical users, especially older adults, who are the most targeted by scams and the least equipped to spot them.

Backend only. No UI yet.

---

## Quick start

```bash
npm install
```

Then add your Anthropic API key to `.env.local`:

```bash
cp .env.example .env.local
```

Open `.env.local` and set `ANTHROPIC_API_KEY=sk-ant-...`, plus a random `HASH_SALT`. Generate a salt with:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

Check that it works:

```bash
npm run check -- "USPS: your package is held. Pay a \$2.99 fee at https://usps-track.icu/pay within 24 hours."
```

Expected: `🔴 LIKELY A SCAM` with reasons about the fake domain and the fee.

> **No API key?** Everything still runs — the rules layer answers on its own and the response is marked `heuristic_fallback`. Classification quality is much lower, so don't judge the tool by it.

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

## The API

```bash
npm run dev           # http://localhost:3600
```

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
    "check_id": "701347a5-…"
  }
}
```

Errors return `400` with `{ error, message }` — the message is written for the end user, not the developer. Codes: `empty_input`, `invalid_type`, `too_long`, `invalid_body`.

### `GET /api/stats`

```jsonc
{ "total_checks": 412, "scams_flagged": 173, "likely_safe": 190, "uncertain": 49, "scam_rate": 42.0 }
```

Aggregates only — individual checks are never exposed.

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
src/
├── server.ts              Fastify app (thin HTTP shell)
├── routes/                check.ts · stats.ts
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

Runs on **local SQLite by default with zero configuration** (Node's built-in `node:sqlite` — no native build). Set both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` and it switches to Supabase Postgres with no code change.

To use Supabase, apply [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) first — via the Supabase SQL editor, or `supabase db push`.

**Tables:** `checks` (one row per check) and `family_links` (**stub schema only** — the "alert my adult child when Mum gets a scam text" stretch goal is not implemented).

### Privacy

The pitch is digital trust, so the raw text never persists:

- Only a **salted HMAC-SHA256** of the normalized input is stored. Not reversible; rotating `HASH_SALT` unlinks old rows by design.
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
| `CLASSIFIER_EFFORT` | `medium` | **Try `low` first** — likely a 3× latency win. See DECISIONS.md. |
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

## Known rough edges

See [DECISIONS.md](DECISIONS.md) for the full list, judgment calls, and what's stubbed versus built.
