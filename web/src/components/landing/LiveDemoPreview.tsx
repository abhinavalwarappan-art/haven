import { motion, useReducedMotion } from 'motion/react';

import { VerdictCard } from '../VerdictCard';
import type { CheckResponse } from '../../lib/types';

/* ═══════════════════════════════════════════════════════════════════════════
   The real component, not a screenshot.
   ───────────────────────────────────────────────────────────────────────────
   This renders `VerdictCard` — the exact component /check renders — fed a
   fixed result instead of a live one. If the product changes, this section
   changes with it, which is the point: a marketing page that *can* drift from
   the product eventually will.

   The message and the reasons are a real response this tool produced for the
   first demo example. Nothing here is written for effect.
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

  const rise = (i = 0) => ({
    initial: { opacity: 0, y: reduced ? 0 : 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-70px' },
    transition: { duration: reduced ? 0.001 : 0.55, delay: reduced ? 0 : 0.08 * i },
  });

  return (
    <section className="section" aria-labelledby="demo-heading">
      <div className="section__inner">
        <motion.p className="label section__eyebrow" {...rise()}>
          What you get back
        </motion.p>

        <motion.h2 className="display-md" id="demo-heading" {...rise(1)}>
          A sentence, then the reasons.
        </motion.h2>

        <motion.div className="section__lead" {...rise(2)}>
          <p>
            Not a threat level. Not a percentage. The answer reads like
            something a person would say out loud, and every reason points at a
            specific thing in the message you can go and look at yourself.
          </p>
        </motion.div>

        <div className="demo">
          <motion.figure className="demo__input glass" {...rise(3)}>
            <figcaption className="label demo__label">The message</figcaption>
            <pre className="demo__text">{MESSAGE}</pre>
          </motion.figure>

          <motion.div className="demo__output" {...rise(4)}>
            <span className="label demo__label">The answer</span>
            <VerdictCard result={RESULT} reduced={reduced} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
