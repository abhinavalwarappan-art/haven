import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

import { ArrowRight, Context, Fingerprint, Heart, NoTrace, Rules } from '../Icons';
import { useRise } from '../../lib/useRise';

/* ═══════════════════════════════════════════════════════════════════════════
   Landing-page teasers for the two pages that carry the real argument.
   ───────────────────────────────────────────────────────────────────────────
   Both of these used to be full sections here, which made `/` a very long
   scroll that answered questions nobody had asked yet. They now say the one
   thing worth saying on a first visit and hand off to a page with room.

   The rule for a teaser: it has to be true and complete as far as it goes.
   Cutting to a cliffhanger to force a click is the pattern this whole product
   exists to argue against.
   ═══════════════════════════════════════════════════════════════════════════ */

export function HowItWorksTeaser() {
  const { rise } = useRise();

  return (
    <section className="section" id="how" aria-labelledby="how-heading">
      <div className="section__inner">
        <motion.p className="label section__eyebrow" {...rise()}>
          How Haven works
        </motion.p>

        <motion.h2 className="display-md" id="how-heading" {...rise(1)}>
          Every message gets read twice.
        </motion.h2>

        <motion.div className="section__lead" {...rise(2)}>
          <p>
            One pass is code that cannot be talked out of its answer. The other
            understands what a message is setting up. Neither is enough by
            itself, and that is the whole design.
          </p>
        </motion.div>

        <div className="steps">
          <motion.article className="step step--rules glass" {...rise(3)}>
            <div className="step__icon" aria-hidden="true">
              <Rules />
            </div>
            <p className="step__num">Pass one</p>
            <h3 className="step__title">Rules that run offline</h3>
            <p className="step__body">
              A deterministic sweep for fake links, gift-card demands and
              manufactured deadlines. Same answer every time, and it keeps
              working when the model is down.
            </p>
          </motion.article>

          <motion.div className="steps__wire" aria-hidden="true" {...rise(4)}>
            <span />
            <span className="steps__note">evidence, not a verdict</span>
            <span />
          </motion.div>

          <motion.article className="step step--context glass" {...rise(5)}>
            <div className="step__icon" aria-hidden="true">
              <Context />
            </div>
            <p className="step__num">Pass two</p>
            <h3 className="step__title">A model that reads context</h3>
            <p className="step__body">
              Everything the first pass found arrives as evidence to weigh,
              never as an answer to agree with. That is what stops it flagging
              every urgent message a real bank sends.
            </p>
          </motion.article>
        </div>

        <motion.div className="section__more" {...rise(6)}>
          <Link className="morelink" to="/how-it-works">
            Watch a real scam text go through both passes
            <ArrowRight />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    icon: NoTrace,
    title: 'Your message is never stored',
    body: 'Not as text, not anywhere. What you paste is checked and then it is gone.',
  },
  {
    icon: Fingerprint,
    title: 'Only a scrambled fingerprint is kept',
    body: 'A one-way hash, and nothing else. Impossible to turn back into what you pasted.',
  },
  {
    icon: Heart,
    title: 'No account, no email, no tracking',
    body: 'Nothing to sign up for and nobody to sell. Paste, read, close the tab.',
  },
];

export function PrivacyTeaser() {
  const { rise } = useRise();

  return (
    <section className="section" id="trust" aria-labelledby="trust-heading">
      <div className="section__inner">
        <motion.p className="label section__eyebrow" {...rise()}>
          Privacy
        </motion.p>

        <motion.h2 className="display-md" id="trust-heading" {...rise(1)}>
          We are asking you to paste something private.
        </motion.h2>

        <motion.div className="section__lead" {...rise(2)}>
          <p>
            A tool that tells you what to be suspicious of should hold itself to
            the same standard. Here is the short version.
          </p>
        </motion.div>

        <div className="pillars">
          {PILLARS.map(({ icon: Icon, title, body }, i) => (
            <motion.article className="pillar glass" key={title} {...rise(i + 3)}>
              <div className="pillar__icon" aria-hidden="true">
                <Icon />
              </div>
              <h3 className="headline pillar__title">{title}</h3>
              <p className="pillar__body">{body}</p>
            </motion.article>
          ))}
        </div>

        <motion.div className="section__more" {...rise(6)}>
          <Link className="morelink" to="/privacy">
            The full list, including a privacy bug we shipped and fixed
            <ArrowRight />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
