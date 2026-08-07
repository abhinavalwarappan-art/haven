# Design screens for "Is This Real?" — a calm, trustworthy scam-message checker

**Platform: this is a responsive website, not a native mobile app.** Design
it mobile-web-first, but it must also compose well as a desktop website —
not an iOS/Android app shell, no native app chrome (no tab bars, no
platform-specific nav patterns).

## The product, in one paragraph

"Is This Real?" helps everyday people — often older, often anxious in the
moment — figure out whether a text, email, or DM they just received is a
scam. They paste in the suspicious message and get back one of three plain-English
verdicts (definitely a scam / looks legitimate / genuinely unclear), with
specific written reasons underneath, explained the way a calm, trustworthy
person would explain it out loud — not the way a security scanner would.
The person using this is often holding a message they're already scared of.
Every screen should lower that fear, not add to it.

This is a scoped design request: **generate the visual screens and design
system only.** A separate engineering effort wires this design up to an
already-built, already-live backend API — you do not need to design any
backend logic, data model, or authentication. There is no login and no user
accounts anywhere in this product.

---

## The one rule that overrides every instinct toward a "security product" look

**Do not design this like a cybersecurity tool.** No dark mode as the
default. No terminal/matrix green. No monospace-heavy hacker typography. No
shield or padlock icon clichés. No siren-red alert-klaxon styling. All of
that is the opposite of what this product needs — the user is frightened and
non-technical, and a scary or overly technical look makes them trust the
tool *less*. The entire design goal is: **warm, editorial, calm authority.**
Light by default. Confident, not cold. Plain-spoken, not jargon-y. It should
feel like a trusted, well-written letter — not a scanner readout.

## Reference designs — pull specific real qualities from each, don't default to generic SaaS

1. **Aura (aura.com)** — the warmth of a family digital-safety brand. Proof
   that a protective/security-adjacent product can feel human, not clinical.
2. **Lemonade (lemonade.com)** — bold, confident color blocking and
   plain-English copy tone applied to a serious, trust-heavy category
   (insurance). Take the *confidence* of the color use, not timidity.
3. **Oscar Health (hioscar.com)** — the type pairing: a characterful serif
   or display face for big moments/headlines, paired with a clean, highly
   legible workhorse sans for body copy. Soft, premium color-blocked
   sections rather than flat white everywhere.
4. **1Password (1password.com)** — the single best proof-of-concept that a
   trust/security product can be light-mode, inviting, and confident instead
   of dark and technical. Study how it uses restraint and whitespace to
   signal competence rather than using dark UI to signal "serious tech."
5. **Notion** — a restrained, mostly-neutral base palette (warm off-whites,
   soft grays/creams) with exactly one intentional accent color used
   sparingly and consistently — not a different "semantic" color slapped on
   every element.
6. **Arc browser (arc.net)** — type personality and a motion/interaction
   quality bar that feels distinctive and crafted without being flashy or
   gimmicky.

Synthesize these into one coherent system — don't literally copy any single
one. The result should look like nothing else in the "AI scam detector"
space, which currently skews entirely toward dark, techy, red-alert
aesthetics. This product should stand out precisely by refusing that look.

---

## Screens to design (mobile-first, but also design a desktop composition — don't just show one breakpoint)

### 1. Compose / home screen
The default screen. A large, inviting text-input area inviting the user to
paste a suspicious message, a clear primary call-to-action button ("Check
it" or similar), and three small "try an example" quick-start chips/buttons
below the input:
- "A delivery text" — hint text "Package on hold"
- "A shipping update" — hint text "Arriving Thursday"
- "A wrong number" — hint text "Stranger says hello"

(For your context, not something to explain on-screen: the first two look
nearly identical to a worried reader but one is fake and one is real —
proving the tool doesn't cry wolf on real messages. The third contains no
obvious red flags at all and is still correctly caught — proving the product
is smarter than a keyword filter. You don't need to convey this story in the
UI copy, just know it's why these three examples exist, in case it informs
tone or iconography choices.)

### 2. Loading / "checking" state
A brief (roughly 1–2 second) wait between submitting and getting a result.
Design this as calm, intentional progress — not a jarring instant flash and
not a long dead stall. Consider a short sequence of reassuring status lines
(e.g. "Reading the message…" then "Weighing the evidence…") rather than a
bare spinner, so the wait itself communicates "we're doing careful work,"
not "please stand by."

### 3. Result screen — three verdict variants

Design three visually distinct but clearly-related states, all within the
same calm overall palette family (not three unrelated alert-box styles):

- **Scam verdict.** The most serious of the three, but still calm and
  composed — never alarming, flashing, or klaxon-red. This should read as
  "a serious, trustworthy warning," not "DANGER."
- **Likely-safe verdict.** Clearly reassuring, and instantly
  distinguishable from the scam state at a glance (someone should be able to
  tell which one they got from across the room).
- **Uncertain / "be careful" verdict.** A genuinely distinct third
  treatment — not a visual blend of the other two, not a washed-out middle
  ground. It should communicate real ambiguity ("we can't be sure either
  way") as its own honest state, not a hedge.

Each result screen shows:
- A clear, large, plain-English headline stating the verdict as a sentence a
  person would actually say (e.g. "This looks like a scam" / "This looks
  legitimate" / "We're not sure about this one") — **never a raw score,
  percentage, or badge like "Risk: 85%."**
- A short translated-confidence line in plain words (e.g. "We're very
  confident about this" / "This one is genuinely unclear, there are signs
  pointing both ways") — again, never a raw number.
- A prominent, well-typeset list of 2–4 specific written reasons explaining
  the verdict (these come from the backend as plain sentences — design a
  clean, readable list treatment for them; this content is the core value
  of the product, so give it real visual weight, not an afterthought
  footnote).
- A clear way to check another message.

### 4. Empty-input / gentle validation state
What it looks like when someone taps "Check it" with nothing pasted — a
small, calm, inline nudge near the input, not a jarring full-screen error.

### 5. "Please wait a moment" state (rate limiting)
If someone checks too many messages too quickly, they see a calm, friendly
pause message — this is explicitly **not a failure or error condition**
(the product resolves it automatically after about a minute), so it should
never be styled like a broken/error state. Warm and patient in tone, closer
to a gentle "hang on" than a red error banner.

### 6. Something-went-wrong state
For genuine failures (network issue, server error). Reassuring, offers a
clear retry action, does not use technical language or expose raw error
detail.

---

## Design system deliverables

Please also produce (or make clearly derivable from the screens):

- **Color palette** — a warm, mostly-neutral base (think warm off-white /
  cream, not stark white or gray) plus one confident primary accent color,
  plus three clearly differentiated but family-consistent verdict colors
  (scam / safe / uncertain) that all still feel like they belong to the same
  calm system.
- **Type system** — a distinctive display/headline face with real character
  (this carries a lot of the "not generic" burden — avoid default system
  fonts or the most overused geometric sans-serifs) paired with a highly
  legible body face. Type should be generously sized throughout — this
  product is explicitly used by people who may have imperfect eyesight, so
  err larger and clearer over compact and dense.
- **Spacing/component rhythm** — buttons, input fields, cards, and the
  verdict-result layout, in a consistent visual language across all screens.
- **Motion notes** — even if Stitch's output is static frames, note where
  motion should live (e.g. the loading-state progression, the verdict
  appearing) and what quality it should have (referencing the Arc-browser
  note above: purposeful and clarifying, not decorative for its own sake).

## Explicit non-goals

- No login/account screens, no user profile, no settings screens.
- No dashboard, no history of past checks, no admin views.
- No dark-mode-first design (a light/dark toggle is fine as a nice-to-have,
  but light must be the primary, default, hero-presented mode — that's what
  should appear when the design is shown).
- Do not design or imply any backend/data-model decisions — this is a visual
  design and design-system request only.
