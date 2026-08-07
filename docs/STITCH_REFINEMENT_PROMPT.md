This needs two things: a real craft upgrade, and content it's currently
missing entirely. Let me be specific about both.

## 1. What's wrong with the current pass

Right now every screen is a centered white/cream card with a small circular
icon (checkmark / triangle / question mark) and a short colored label
underneath. That's the exact "default AI-generated card UI" look — flat, no
depth, no atmosphere, type doing none of the emotional work. It reads like a
UI-kit demo, not a considered product. Specifically:

- **No depth or atmosphere.** Every surface is flat and evenly lit. Nothing
  in the frame suggests light, layering, or physical presence.
- **The verdict treatment is too small and too generic.** A tiny badge icon
  + one line of colored text is not enough visual weight for the single most
  important moment in the product — the verdict is what the user came for,
  it should feel like the biggest, most confident thing on the screen, not
  a status chip.
- **Type has no personality.** The serif in "Is This Real?" is doing
  nothing distinctive — pick something with real character (closer to an
  editorial magazine headline face — think Times/Georgia's more refined
  cousins, or something with genuine calligraphic warmth) and let it run
  much larger on the verdict screens specifically.
- **Backgrounds are inert.** Flat cream on every screen with no variation.

## 2. Add atmosphere — soft gradient backgrounds

I'm attaching two reference images: soft, diffuse, multi-tone gradient blurs
— warm cream/blush/pale-gold on one, cooler mint/lavender/blush on the
other, both with no hard edges, no visible shapes, just very gentle color
bleeding into color like light through frosted glass. Use this exact quality
of atmosphere as a background treatment, especially behind the hero and the
verdict screens: a soft, out-of-focus color wash sitting behind the content,
subtle enough that body text stays perfectly legible on top of it, warm and
optimistic in tone rather than moody. Do not make it a hard graphic gradient
with visible bands or a recognizable shape (no visible "blob," no obvious
radial circle) — it should look like atmosphere, not decoration.

Keep the verdict-specific colors (the scam red, the safe green, the
uncertain amber) as accents within this system, not as the dominant
background color of their respective screens — the warmth of the paper/mist
background should stay consistent across all three verdicts, with the
verdict color appearing in the headline, an accent line, and the evidence
markers, the way it would in a well-designed printed letter, not as a
full-bleed colored panel.

## 3. Bigger miss: this only shows the product, not the story

You've only designed the tool itself (compose → checking → verdict). This
needs to be a full informational website that teaches someone about the
problem before it hands them the tool — right now there's no way for a
visitor to understand why this exists or why to trust it. Add a proper
scrollable homepage, in this order, above the compose tool:

**Hero** — Big, confident headline (reuse "Is this real?" as the wordmark,
but give it a proper hero moment — large scale, generous whitespace, the
gradient atmosphere behind it) plus one sentence explaining what the tool
does, and a primary "Check a message" button that leads down to the tool.

**The problem, explained** — A section that teaches the visitor why this
matters before asking them to use anything: scam messages are built to look
real, and the people targeted hardest are non-technical and often older, not
careless — they're targeted by design, not by mistake. Include a small
row of 2-3 hard statistics presented with real typographic weight (large
serif numbers, small labels underneath) — e.g. total dollars lost to fraud
last year, and which age group loses the most per victim. Numbers should
feel authoritative, not like a decorative stat-card grid.

**How it works** — Explain, in plain language a non-technical reader can
follow, that every message is checked two different ways: a fast rules pass
that catches obvious fakes (fake links, urgent threats, requests for gift
cards) and a second, smarter pass that reads the message the way a person
would, catching things that don't trip any obvious red flag — like a
stranger who "texts the wrong number" and starts a friendly conversation,
which has no link, no money ask, nothing an automated filter would catch,
but which the second pass still recognizes as the opening move of a scam.
Present this as two clearly related but distinct stages, not a wall of
paragraph text — give it real layout structure (e.g. two side-by-side or
stacked panels, connected by a visible line or arrow showing the message
flowing from one into the other).

**Why you can trust it with something private** — A short section on what
happens to the message after it's checked: it is never stored as text, only
a scrambled, unreadable fingerprint of it is kept (enough to notice if the
same scam is going around, but impossible to turn back into the original
message), so nobody's private text sits in a database anywhere.

**Then the tool itself** — the compose/checking/verdict screens you already
built, now arrived at as the payoff of the page rather than the entire page.

The whole homepage should read like a well-written short magazine feature
that happens to end in a working tool — informative and calm, never
alarmist, consistent with everything already established: warm, editorial,
confident, explicitly not a dark security-tool aesthetic anywhere on the
page.

Raise the overall craft bar to match Aura, 1Password, Lemonade, and Oscar
Health — soft shadows, real type hierarchy, generous breathing room, and
color used with intention rather than every element getting its own badge
color.
