import { useReducedMotion } from 'motion/react';

import { VerdictLetter } from '../VerdictLetter';
import type { CheckResponse } from '../../lib/types';

/* ═══════════════════════════════════════════════════════════════════════════
   The real component, not a screenshot.
   ───────────────────────────────────────────────────────────────────────────
   This renders `VerdictLetter` — the exact component `/check` renders — fed a
   fixed result instead of a live one. Same fonts, same letterhead rule, same
   staggered reveal. If the product changes, this section changes with it,
   which is the point: a marketing page that can drift from the product is a
   marketing page that will.

   The message and the reasons below are a real response this tool produced for
   the first demo example. Nothing here is written for effect.
   ═══════════════════════════════════════════════════════════════════════════ */

const MESSAGE = `USPS: Your package has been held at our facility due to an incomplete address. Please update your delivery details within 24 hours or the parcel will be returned to sender.

Update here: https://usps-trackdelivery.icu/redelivery

A $2.99 redelivery fee applies.`;

const RESULT: CheckResponse = {
  verdict: 'scam',
  confidence: 100,
  reasons: [
    'The website link uses a strange address (usps-trackdelivery.icu) that is not the real USPS website.',
    'The Postal Service will not ask you to pay a small fee by text message to redeliver a package.',
    'This message uses fake pressure by claiming they will return your package if you do not act within 24 hours.',
  ],
  meta: null,
};

export function LiveDemoPreview() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="section section--demo" aria-labelledby="demo-heading">
      <div className="section__inner">
        <p className="section__eyebrow">What you get back</p>
        <h2 className="section__headline" id="demo-heading">
          A sentence, then the reasons.
        </h2>

        <div className="prose prose--lead">
          <p>
            Not a threat level. Not a percentage. The answer reads like
            something a person would say out loud, and every reason points at a
            specific thing in the message you can go and look at yourself.
          </p>
        </div>

        <div className="demo">
          <figure className="demo__input">
            <figcaption className="demo__label">The message</figcaption>
            <pre className="demo__text">{MESSAGE}</pre>
          </figure>

          <div className="demo__output">
            <span className="demo__label demo__label--out">The answer</span>
            {/* The live component, minus its follow-on button. */}
            <VerdictLetter result={RESULT} reduced={reduced} />
          </div>
        </div>
      </div>
    </section>
  );
}
