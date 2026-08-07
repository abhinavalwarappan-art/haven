# Rebrand and rebuild the frontend as "Haven" — work autonomously overnight

I'm going to sleep. Work through this whole brief without stopping to ask me
questions — make the calls yourself where a decision is needed, document why
in `DECISIONS.md` the way the rest of this repo already does, and have a
fully working, deployed, verified site by morning.

## Context: what this project already is

This is `~/Downloads/haven` — a scam-message checker built for a
hackathon (NextGen Innovation 2026, Cybersecurity & Digital Trust theme). The
**backend is done, live, and must not be touched**: `src/`, `api/`,
`scripts/`, `fixtures/`. It's a two-layer pipeline (deterministic rules +
Gemini classification) with a real, deployed API at
`https://havenscamprotection.website`. 16/16 on the classification suite, 91
edge-case assertions, all currently green.

The **frontend** is React 19 + Vite + Motion (`web/`), currently two routes:
`/` (a landing page) and `/check` (the compose → thinking → result → error
tool). This whole frontend gets restyled and partly rebuilt tonight — the
*content structure and the API integration* stay, the *visual design*
changes completely.

Read `DECISIONS.md` in full before starting. It's the running log of every
judgment call made on this project across six prior sessions, including
several bugs that were introduced and fixed — don't repeat them.

## The rename: "Is This Real?" becomes "Haven"

Replace the product name everywhere: the wordmark, `<title>`, meta
description, `package.json` name if reasonable, footer, any string literal
that says "Is This Real?" or "Is this real?". New tagline under the
wordmark: **"Your safe place to check anything."**

The question "is this real?" can still appear naturally inside body copy
(e.g. a placeholder like "paste the message you're wondering about"), but
the brand name is Haven throughout.

## The new visual direction: soft dreamcore, not warm editorial paper

The previous design (documented in `DECISIONS.md` sessions 6-7) was a warm
cream/paper editorial look with Instrument Serif and a letterhead motif.
**That direction is retired.** The new one is a soft, glowing pastel
dreamscape — pink and powder-blue skies, glossy reflective surfaces, gentle
neon edge-lighting, calm and premium rather than childish or loud. Not a
dark security-tool aesthetic either — still no terminal green, no
shield/lock clichés, no siren-red klaxon styling. The person using this is
frightened and often older; the whole point of Haven is to feel like a
window opening onto clear sky, not an alarm going off.

### Ground truth: a real design pass already happened

I ran this exact rebrand through Google Stitch (a design-generation tool)
tonight and got back real, reviewed HTML/Tailwind for 5 screens. **This is
your visual and content reference — match it closely, don't reinvent it.**
The full exported markup for all 5 screens is in
[`docs/HAVEN_STITCH_EXPORT.html`](./HAVEN_STITCH_EXPORT.html) (saved
alongside this file, verbatim, all 5 documents concatenated). Read that file
in full before writing any component code.

It uses a genuine Material Design 3 color token system (not just a few hex
codes) — pull the actual token values from it rather than approximating:
`primary: #7b5455`, `secondary: #4d6077`, `tertiary: #5c5d6e`,
`error: #ba1a1a`, `background: #faf9f6`, `primary-container: #f4c2c2`,
`secondary-container: #cde1fc`, and so on — the full set is in the
`tailwind.config` block at the top of each exported document. Typography:
**Libre Caslon Text** (display serif) + **Plus Jakarta Sans** (body/UI
sans), both real Google Fonts — self-host them the way the current project
already self-hosts Instrument Serif/Sans (`web/public/fonts/`,
`@font-face` in a `fonts.css`, `<link rel="preload">` in `index.html`) —
don't load Tailwind or fonts from a CDN in the shipped build.

**The hero background image is at `web/public/images/haven-hero.png`** — a
photorealistic render of a glossy marble interior with a double archway
opening onto pastel clouds, traced in neon-pink edge lighting. This is the
real file, already in the repo. **Use this exact file for the hero
background — the Stitch export's hero `<img>` tag points at a Google-hosted
preview URL (`lh3.googleusercontent.com/aida-public/...`) that is NOT this
file and is not safe to hotlink (it's an internal preview CDN link, not a
stable public asset).** Compress `haven-hero.png` before shipping — it's
6.5MB straight out of generation; convert to WebP or re-export at a
reasonable quality/size for a hero background (target well under 500KB) and
verify it still looks good at full-bleed size.

### Six concrete issues found in the Stitch export — fix all of them

I reviewed the export critically before handing it to you. Fix every one of
these as you build; don't just port the markup as-is:

1. **Hero image swap** — use the real local file as described above, not the
   hotlinked Google preview URL. Self-host it, compress it.
2. **Desktop and mobile tell two different stories right now.** The Stitch
   export's desktop home page says "Haven — Your safe place to check
   anything" with $10B+/1-in-4 stat cards and a trust-pillars section. The
   mobile export says "Find clarity in the noise" with completely different
   problem copy ("Information Overload," "Hidden Agendas") and no trust
   section at all. **Unify these into one copy deck** — use the desktop
   version's content as the base (it's more complete: hero, stats, how it
   works, trust pillars, closing statement) and make it responsive, rather
   than keeping two divergent narratives.
3. **The "safe" verdict's headline isn't color-coded like the other two.**
   In the export, the scam verdict headline is red (`text-error`) and the
   uncertain verdict headline is amber, but the safe verdict headline is
   plain near-black `text-on-surface`. All three verdicts need to be
   identifiable at a glance from across a room — give the safe verdict's
   headline a clearly "good news" color (a calm green or the token system's
   `secondary` blue-teal, whichever reads more clearly as "safe" against the
   pastel background — your call, but it must not be neutral black).
4. **Two required states are missing from the export entirely**: the
   loading/"checking" state (compose submitted, waiting ~1.5s for the real
   API), and the error/rate-limited state. Design and build both in the same
   visual system as the 5 exported screens — glass-card panels, the same
   color tokens, the same soft gradient backgrounds. The loading state
   should narrate real pipeline stages (reuse the honest-narration approach
   from the current `ThinkingStage.tsx` — "Reading the message…", "Checking
   where the links really go…" — don't just show a bare spinner). The error
   state must distinguish a genuine failure from a rate-limit pause (a 429
   is not a failure, it resolves on its own — see `lib/api.ts` for how this
   distinction is already handled, keep that logic, just restyle it).
5. **A real usability bug**: in the export, the "Analyze" button is
   absolutely positioned inside the textarea, overlapping its bottom-right
   corner. On a long pasted message, typed text runs underneath the button.
   Fix the layout so the submit button never overlaps the text-entry area —
   put it below the textarea, the way the current `ComposeStage.tsx` already
   does it.
6. **Tailwind was loaded via the CDN `<script>` tag in the export** (the Play
   CDN) — this compiles in the browser on every page load and is explicitly
   not meant for production; Tailwind's own docs say so. **Do not add
   Tailwind as a dependency at all.** Translate the exported design's visual
   intent (the M3 color tokens, the spacing scale, the glass-panel
   treatment, the type scale) into the project's **existing hand-written CSS
   architecture** instead — extend `web/src/styles/tokens.css` with the new
   Haven color tokens, and either heavily rework or fully replace
   `global.css`, `compose.css`, `thinking.css`, `letter.css`, `landing.css`
   to match the new look. This keeps the project dependency-light and
   consistent with how it's built so far (no new runtime CSS framework,
   self-hosted assets, small bundle) — translate Tailwind's utility classes
   into real CSS rules with the same visual result, don't just copy
   className strings into JSX and hope a Tailwind build step appears later.

## What to actually build

1. **Rework `tokens.css`** with the new Haven palette (the M3 tokens above),
   new type stack (Libre Caslon Text + Plus Jakarta Sans, self-hosted).
2. **Rebuild the landing page** (`web/src/routes/Landing.tsx` and its
   `components/landing/*`) to match the Stitch export's structure: hero
   (with the real background image, glass-panel headline card, the "Free /
   No account needed / 90 seconds" trust-marker row), the problem section
   (stats: "$10B+ lost to digital fraud annually", "1 in 4 people targeted"
   — verify these figures against what's already cited in
   `DEMO_SCRIPT.md`/`README.md` and use the existing, already-fact-checked
   numbers rather than inventing new ones if they differ), the "How Haven
   Works" two-step diagram (rules pass → context pass), the trust pillars
   (never stored / scrambled fingerprint / your safety), and the closing
   statement ("The best time to ask if something is real is before you
   respond to it.").
3. **Rebuild the verdict states** (`VerdictLetter.tsx` or its replacement)
   to match the glass-card verdict screens: icon circle, colored headline,
   description, a reasons grid (bento-style, matching the export), actions.
   All three verdicts (scam/safe/uncertain) plus the two new states
   (loading, error/rate-limited).
4. **Keep every bit of existing logic intact**: `lib/api.ts` (the real
   `/api/check` integration, error handling, rate-limit distinction),
   `lib/motion.ts` (adapt timings/easings to the new visual system, but the
   underlying Motion-based reveal architecture is sound — keep it),
   `App.tsx`'s router (`/` and `/check`), the three real demo chips pulled
   from `GET /api/examples`.
5. **Self-host fonts and images.** No CDN font loading, no hotlinked images.
   Preload the critical font weight the way `index.html` already does for
   the current fonts.
6. **Reduced motion**: every animated reveal needs a `prefers-reduced-motion`
   fallback, same as the current codebase already does throughout
   (`useReducedMotion()` from Motion, checked in every animated component).

## Verification — do not skip this, do not claim done without it

Use the browser tools available to you (chrome-devtools-mcp or equivalent)
to actually look at what you build, the same rigor as the rest of this
project's history:

1. `npm run build` — both `tsc` passes clean, no type errors.
2. Screenshot every state — compose, loading, all 3 verdicts, error/rate-
   limited — at mobile (390×844) and desktop (1440×900), plus specifically
   at 1280×720 (the recording-frame size used throughout this project's
   history — check `DECISIONS.md` sessions 6 for why this size matters and
   how tight the fit needs to be).
3. **Run all three demo chips through the real live API** and confirm the
   verdict, headline, and reasons render correctly in the new design —
   don't just check that the static screens look right, confirm the actual
   data flow still works end to end.
4. Contrast-check every text/background pairing in the new palette — this
   audience needs WCAG AA at minimum, and several past sessions in this repo
   had to fix contrast failures after the fact. Verify before you ship, not
   after.
5. Touch targets ≥44px on mobile.
6. Force `prefers-reduced-motion: reduce` (stub `matchMedia`, as prior
   sessions in this repo did) and confirm every animated element still
   renders correctly with motion removed, not broken or invisible.
7. No console errors on either route.
8. Re-run `npm run test:limits` and `npm run test:edge` from the repo root —
   confirm the backend suites are still green (they should be untouched,
   but prove it rather than assume it).

## Deploy

`vercel --prod --force` (force avoids a stale cached build — this has bitten
prior sessions, see `DECISIONS.md`). Re-alias to
`havenscamprotection.website` if the deploy produces a new preview URL.
Confirm the live URL passes everything in the verification section above,
not just the local dev build.

## Document it

Add a new session entry to `DECISIONS.md` following the exact format every
prior entry uses (judgment calls and why, newest first) — the Haven rename,
the aesthetic pivot, the six issues found and fixed, and any new judgment
calls you had to make that I haven't already specified above.

## When I wake up, tell me

- Confirmation every verification step passed, not just "should work."
- The live URL.
- Anything you had to deviate from this brief on, and why.
- Anything that still needs my human judgment before the demo.
