This is a visual and content pass only. **Do not touch the API integration,
the check/verdict logic, the example-chip data, or any state management —
everything currently wired to `/api/check`, `/api/examples`, and `/api/stats`
must keep working exactly as it does now.** Every change below is CSS,
layout, typography, and new static content sections.

## 1. What's wrong with the current design

It reads as a default AI-app-builder template right now: flat cream
background with no variation, a small circular "?" icon standing in for a
logo, thin generic serif for the wordmark, a plain bordered box for the
textarea, and a flat white card with numbered circles for "How it works."
Nothing has depth, nothing has atmosphere, and the type has no personality.
Specifically fix:

- **Flat, inert background.** Replace the single flat cream fill with a
  soft, diffuse, multi-tone gradient wash — see the two reference images
  attached (warm cream/blush/pale-gold in one, cool mint/lavender/blush in
  the other). This should look like soft, out-of-focus light bleeding
  between colors, not a hard graphic gradient with a visible band or a
  recognizable shape. Implement it as a large, blurred radial/conic gradient
  mesh behind the content (CSS `background` with multiple soft radial
  gradients layered, or an SVG blur filter) — subtle enough that body text
  stays perfectly legible sitting on top of it. Keep it lightest and most
  neutral behind body copy, and let it warm up and get slightly more present
  behind the hero and the verdict result specifically.
- **The wordmark needs real typographic presence.** Swap the current serif
  for something with genuine editorial character — a display serif with
  visible personality (something in the spirit of a magazine masthead, not
  a generic system serif). Let it run much larger in the hero.
- **The verdict result (when a check comes back) needs to be the visual
  climax of the whole page**, not a small card. Give it generous size, a
  confident headline set in the display serif, soft depth (a subtle shadow
  and a faint background tint drawn from the verdict color — red-leaning for
  scam, green-leaning for safe, amber for uncertain — without making the
  whole card a solid color block).
- **Add soft depth throughout.** Cards, the textarea, and buttons should
  have a gentle layered shadow and a very slightly warm-tinted border, not
  a flat 1px gray line. Buttons should have a soft press/hover state, not
  just a flat color swap.

Raise the whole thing to the craft level of Aura (aura.com), 1Password
(1password.com), Lemonade (lemonade.com), and Oscar Health (hioscar.com) —
warm, confident, editorial, generous whitespace, restrained color used with
real intention. Explicitly avoid anything that reads as a dark or techy
security-tool aesthetic anywhere on the page.

## 2. Add the informational content that's still missing

Right now the page goes straight from the wordmark into the tool, with only
one "How it works" section and a single line about privacy in the footer.
This needs to read as an actual informative homepage that teaches someone
about the problem before handing them the tool, not just a UI for the tool
itself. Add these sections, in this order, **above** the existing compose
tool (keep the compose tool and its example chips exactly as they are,
just move them down the page and let them be the payoff at the end):

**Hero** — Keep "Is This Real?" as the big moment, but give it real scale
and the gradient atmosphere behind it, plus one clear sentence of subhead
explaining what it does, and a button that scrolls down to the tool.

**The problem** — A short section, 2-3 sentences, explaining that scam
messages are specifically built to look real, and that the people targeted
hardest are non-technical and often older — not because they're careless,
but because these messages are designed to survive a careful second look.
Under that, a row of 2-3 large statistics with real typographic weight
(big serif numbers, small label underneath each) — total dollars lost to
fraud in the US last year, and which age group loses the most money per
victim. These should look authoritative, like a stat you'd see in a
magazine feature, not a decorative icon-card grid.

**How it works** — Keep the existing 3-step structure but give each step
more visual separation and depth (not three cells of one flat table) — and
add one more layer of explanation underneath: that the tool checks each
message two different ways, a fast rules-based pass that catches obvious
fakes, and a second pass that reads the message the way a person would,
catching things with zero obvious red flags — like a stranger who "texts
the wrong number" and starts a friendly conversation, which has no link, no
money ask, nothing an automated filter would catch, but is still recognized
as the opening move of a scam. Make this the emotional core of "why this
tool is different," not a footnote.

**Trust and privacy** — Expand well past the current one-line footer note.
A proper short section: the message is never stored as text, only a
scrambled one-way fingerprint of it is kept (enough to notice the same scam
going around, impossible to turn back into the original message). State
this plainly and confidently, like a promise, not fine print.

**Then the tool** — the existing compose/example-chips/verdict flow,
untouched functionally, restyled to match everything above it.

The end result should read like a well-written short magazine feature that
happens to end in a working tool, not a form with a paragraph above it.
