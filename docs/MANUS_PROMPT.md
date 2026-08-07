# Build a standalone frontend for "Is This Real?" — a scam-message checker

## What this is

"Is This Real?" is a web tool that helps non-technical, often older, people
figure out whether a text message, email, or DM they received is a scam. They
paste in the suspicious message and get back a plain-English verdict — one of
three outcomes — plus specific, concrete reasons for that verdict, written the
way a trustworthy person would explain it out loud, not the way a security
tool would.

The target user is anxious. They are holding a message they already suspect
might be trying to steal from them or someone they love. Every design and
copy decision should reduce their anxiety and build trust, never add to
either.

**Your job:** build a new, standalone frontend project — a separate
codebase, independently deployable — that calls the existing live backend
API below. **Do not build, modify, reason about, or attempt to replicate any
backend logic.** The backend already exists, is already deployed, is already
correct, and is out of scope entirely. Treat it as a black box you send
requests to and receive JSON from. Your entire job is the frontend
presentation layer: pages, components, state, styling, motion, copy
integration.

---

## The real, exact API contract

Base URL (already live, already deployed, CORS is already open with
`Access-Control-Allow-Origin: *` so a separately-hosted frontend can call it
directly with no backend changes needed):

```
https://haven-safe.vercel.app
```

### `POST /api/check`

The core endpoint. Send the pasted message, get back a verdict.

**Request body:**

```json
{ "text": "the pasted message, up to 20,000 characters" }
```

**Success response — `200 OK`:**

```json
{
  "verdict": "scam",
  "confidence": 85,
  "reasons": [
    "This is a common way scammers start conversations to trick you into a fake investment scheme later.",
    "People who accidentally text the wrong number usually stop once they realize their mistake, rather than asking for your name.",
    "You should not share your name or personal details with a stranger who texts you out of the blue."
  ],
  "flags_detected": ["no_links_present", "no_payment_request", "no_urgency_pressure", "no_action_requested"],
  "raw_signals": { "...": "internal rules-engine detail — see note below, do not build UI around this" },
  "meta": {
    "classifier": "ai",
    "model": "gemini-3.1-flash-lite",
    "duration_ms": 1601,
    "check_id": "ce7a2de8-6588-46c1-9fbc-2d0fb7d7f94d",
    "cached": false,
    "notice": null
  }
}
```

Field-by-field, exactly as returned (this is the real live response, not a
mock):

| Field | Type | Notes |
|---|---|---|
| `verdict` | `"scam"` \| `"likely_safe"` \| `"uncertain_be_careful"` | The three possible outcomes. Exactly these three string values, nothing else. |
| `confidence` | number, 0–100 | **Never show this raw number to the user.** Translate it into a plain-English phrase (see "Confidence copy" below). Showing "85%" invites the reader to do risk arithmetic, which is the wrong mental task for someone in this situation. |
| `reasons` | string[] | 2–4 plain-English sentences, always specific and checkable (they quote the actual link, the actual phrase, the actual ask). Render as a list. This is the core trust-building content on the result screen — give it real visual weight. |
| `flags_detected` | string[] | Internal rule-engine flag IDs (e.g. `lookalike_domain`, `gift_card_request`). **Do not surface these to the user as-is** — they're snake_case internal identifiers, not user-facing copy. Safe to ignore entirely in the UI; `reasons` already contains the human-readable version of whatever these represent. |
| `raw_signals` | object | Full internal rules-engine output (categories, URL analysis, risk score). **Not intended for the end-user UI.** Ignore it unless you want an optional "technical details" collapsed section for power users — not required. |
| `meta.classifier` | `"ai"` \| `"heuristic_fallback"` | When `"heuristic_fallback"`, the AI layer didn't run (no API key / rate limited / timeout) and the answer is rules-only and less reliable. **When this is `"heuristic_fallback"`, or when `meta.notice` is non-null, the UI must visibly say the answer is degraded** — do not present it with the same confidence-of-presentation as a full answer. |
| `meta.model` | string \| null | Which model ran the classification. Not necessarily needed in UI; fine for a footer/about page. |
| `meta.duration_ms` | number | How long the check took server-side. Real checks currently take **~1.5 seconds**. Not required to display, but useful context for pacing your loading state — it should feel like genuine, brief work, not an instant flash and not a long stall. |
| `meta.check_id` | string \| null | Stable ID of the stored record. Not needed for UI unless you want a "copy check ID" support feature — not required. |
| `meta.cached` | boolean | True if this exact message was already checked before and the answer came from cache. `duration_ms` is honest either way — don't assume a fast response means a fast *classification*. Optional to surface (e.g. a subtle "instant — we've seen this one" note), not required. |
| `meta.notice` | string \| null | **When non-null, this is a human-readable caveat you must display to the user**, e.g. explaining the answer is running in a degraded/rules-only mode. Show it near the verdict, not buried. |

**Error responses** — always `{ "error": "<code>", "message": "<user-facing sentence>" }`. The `message` field is already written in plain, calm, non-technical language for the end user — **display `message` directly, do not write your own error copy for these cases:**

| HTTP status | `error` code | When | Extra fields |
|---|---|---|---|
| 400 | `invalid_body` | Malformed request (not valid JSON object) | — |
| 400 | `invalid_type` | `text` field wasn't a string | — |
| 400 | `empty_input` | `text` was empty or whitespace-only | — |
| 400 | `too_long` | `text` exceeded 20,000 characters | `max_length: 20000` |
| 429 | `rate_limited` | This specific visitor has checked too many *new* messages too fast (12 per minute default) | `retry_after_seconds: <number>`, and an `X-RateLimit-*` header pair (not usually needed in UI) |
| 429 | `busy` | The whole service is under heavy load right now (240/min global ceiling) | `retry_after_seconds: <number>` |
| 500 | `check_failed` | Unexpected server error | — |

Live confirmed examples of these error bodies:

```json
{ "error": "empty_input", "message": "Paste the message you want checked — the text field was empty." }
{ "error": "invalid_type", "message": "Field \"text\" must be a string." }
```

**Important UX behavior for rate limiting:** a 429 is **not a failure state** — it resolves on its own after `retry_after_seconds`. Do not present it as a broken app or a scary error. Present it calmly ("we're pausing briefly, try again in about a minute"), ideally using the exact `message` string returned, since it's already written for a non-technical reader and explicitly reassures them nothing is broken.

### `GET /api/examples`

Returns three pre-written example messages for one-click demo chips. **Build
these into the UI as example/quick-start buttons** — this is a core, expected
part of the product.

```json
{
  "examples": [
    { "id": "scam-usps-redelivery", "label": "A delivery text", "hint": "Package on hold", "text": "USPS: Your package has been held..." },
    { "id": "legit-ups-shipping", "label": "A shipping update", "hint": "Arriving Thursday", "text": "UPS: Your package from REI is on the way..." },
    { "id": "scam-romance-wrong-number", "label": "A wrong number", "hint": "Stranger says hello", "text": "Hello David, are we still meeting for lunch..." }
  ]
}
```

Fetch this list rather than hardcoding the three examples, so the demo chips
always match whatever the backend currently serves. Each example is a button
that, when clicked, populates the compose textarea with `text` (and ideally
auto-scrolls the textarea to its start, since some example texts are long).

**Why these three specifically, for your context (not something to display,
just so you understand the product story you're building the UI for):** #1
and #2 look almost identical to a worried reader — one is fake, one is real —
proving the tool doesn't just flag anything urgent-sounding. #3 is a
"wrong-number" romance-scam opener that contains zero red flags a simple
keyword filter could catch (no link, no payment ask, no urgency word) and the
AI still catches it — proving the product needs its AI layer, not just
pattern matching. You don't need to explain this in the UI; it's context for
why these three examples matter to the product.

### `GET /api/stats`

```json
{ "total_checks": 1, "scams_flagged": 1, "likely_safe": 0, "uncertain": 0, "scam_rate": 100 }
```

Optional: a small "X messages checked, Y scams caught" line somewhere (e.g.
footer) for social proof. Not core to the flow. Handle the case where all
counts are 0 gracefully (don't show a jarring "0 scams caught, 0% rate" — either hide the stat line entirely when `total_checks` is 0, or phrase it neutrally).

### `GET /health`

```json
{ "ok": true, "store": "memory", "classifier": "gemini-3.1-flash-lite" }
```

Not user-facing. Useful only if you want an internal "is the API up" check
during development.

### `GET /api/limits`

```json
{ "window_ms": 60000, "max_per_ip": 12, "max_per_ip_cached": 200, "global_max": 240 }
```

Informational only — not required in the UI.

---

## Required screens and states

This is a **single-flow tool**, not a multi-page app. Build it mobile-first;
it must also look good and be well-composed on desktop (don't just stretch
the mobile layout — desktop should feel intentionally designed, with room to
breathe).

**1. Compose / input state**
A large, inviting textarea to paste the message into, a clear primary action
("Check it" / "Check a message" or similar), and the three example chips from
`GET /api/examples`. This is the default/landing state of the tool.

**2. Loading state**
Real checks take about 1.5 seconds. This should read as calm, intentional,
brief work — not an instant flash (which feels untrustworthy, "did it even
check?") and not a long stall (which feels broken). Consider narrating what's
happening in 1–2 short lines of copy (e.g. "Reading the message…" → "Weighing
the evidence…") rather than a bare spinner — it turns the wait into
reassurance rather than uncertainty.

**3. Result state — three distinct verdicts, one calm palette family**
- `scam` — clearly the most serious visual treatment, but still calm, not
  alarming. No flashing, no siren-red klaxon styling.
- `likely_safe` — reassuring, clearly differentiated from `scam` at a glance.
- `uncertain_be_careful` — visually distinct from both of the above (a third
  color/treatment, not just a mix), communicating genuine ambiguity rather
  than a weak version of either other verdict.

  All three verdicts need to be instantly tell-apart-able even to someone
  skimming quickly, while still feeling like they belong to the same calm,
  considered product — not three unrelated alert boxes bolted together.

  Display: the verdict as a clear plain-English headline (not a raw score or
  badge), a translated confidence phrase (see below), and the `reasons` list
  with real visual prominence — this is the content that actually helps the
  user, not decoration.

  **Confidence copy** — never show the raw `confidence` number. Translate it,
  e.g.:
  - ≥92: "We're very confident it is [a scam / genuine]."
  - 80–91: "We're confident it is [a scam / genuine]."
  - 68–79: "We're fairly confident it is [a scam / genuine]."
  - <68: "We lean towards this, but we're not certain."
  - For `uncertain_be_careful` specifically, don't use the scale above at
    all — say something like "This one is genuinely unclear — there are
    signs pointing both ways," since high confidence on this verdict means
    confidently ambiguous, not confidently safe or unsafe.

**4. Empty input / validation error state**
Inline, non-blocking. If the user hits "Check it" with nothing pasted, show
the `empty_input` message near the textarea, not as a jarring full-page
error.

**5. Rate-limited state (429)**
Calm, not alarming — see the rate-limiting UX note above. Should feel like
"please wait a moment," never like "something is broken" or "you did
something wrong."

**6. Network / server error state (500 or network failure)**
Reassuring, offers a retry, does not blame the user, does not expose
technical details (stack traces, raw error objects) to them.

---

## Design direction — read carefully, this is the most important part

**The single biggest constraint: this must NOT look like a typical
cybersecurity product.** Do not use: dark mode as the default theme,
terminal/matrix green, monospace-heavy "hacker" typography, shield or
padlock iconography clichés, red alert klaxon styling, or anything that
reads as "built for an IT security team." All of that actively works against
this product's purpose — the user is a frightened, non-technical person, and
a scary/technical aesthetic makes them trust the tool *less*, not more,
and (per the product's own research) panic is literally what makes people
fall for scams rather than pausing to check. The tool's whole job is to be
the calm, trustworthy voice in a stressful moment.

**Target aesthetic: warm, editorial, calm authority.** Light by default,
confident without being cold, plain-spoken rather than jargon-heavy. Think:
a trusted letter from someone who knows what they're doing, not a scanner
output.

### Specific references — use these exactly, don't substitute your own

- **Aura (aura.com)** — take the warmth of a family digital-safety product.
  It sells a serious protective category without leaning on security-tool
  visual tropes at all.
- **Lemonade (lemonade.com)** — take the way it makes a serious, trust-heavy
  category (insurance) feel human and approachable through bold, confident
  color blocking and plain-English copywriting instead of legal/corporate
  tone.
- **Oscar Health (hioscar.com)** — take the editorial type pairing (a
  characterful display face for headlines, a clean workhorse face for body
  text) and the soft, premium use of color blocking across sections.
- **1Password (1password.com)** — take the proof-of-concept that a security
  and trust product can be light-mode, confident, and inviting rather than
  dark and technical. This is the single best reference for "trust product,
  not scary."
- **Notion** — take the restrained, mostly-neutral palette with one
  intentional accent color used sparingly and consistently, rather than a
  rainbow of "semantic" colors everywhere.
- **Arc browser (arc.net)** — take the type personality and the motion
  quality bar: distinctive and considered, but not over-the-top or
  gimmicky. Motion should clarify what's happening (e.g. the loading state,
  the reveal of a verdict), not just decorate.

Pull specific, real qualities from each of these — don't produce a generic
"clean SaaS" look and call it done. The product should feel deliberately
designed, not templated.

---

## Technical requirements

- **Standalone project.** New repo/codebase, independently deployable
  (Vercel, Netlify, or your default — your choice of framework/stack).
  Do not attempt to merge into or modify the existing backend repository.
- **Consume the live API directly** at `https://haven-safe.vercel.app`
  as documented above. CORS is already open (`*`), so no proxy or backend
  change is required to call it from a different domain.
- Mobile-first responsive, but genuinely well-composed on desktop too —
  don't just center a mobile-width column on a big screen.
- Respect `prefers-reduced-motion` — provide a reduced-motion path for any
  significant animation rather than ignoring the setting.
- Accessible: real semantic HTML, visible focus states, sufficient color
  contrast (verdict colors especially — they carry meaning, so they need to
  be readable, not just decorative), touch targets at least 44×44px on
  mobile.
- Do not persist or display any raw user-pasted text anywhere except the
  current session's own UI (no `localStorage` history feature, no analytics
  capture of the message content) — the backend itself never stores raw
  text either, and the frontend should match that privacy posture.

## What NOT to build

- No login, no accounts, no user database.
- No "family alert" / notify-a-relative feature (this exists as a rough idea
  in the backend's roadmap notes but is not implemented — don't build UI for
  it).
- No attempt to re-implement, call into, or reason about the scam-detection
  logic itself. That is 100% server-side and out of scope. Your frontend's
  only job is: collect input → call `POST /api/check` → render the response
  well → handle the documented error states gracefully.
