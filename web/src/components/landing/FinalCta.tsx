import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';

import { ArrowRight } from '../Icons';

/** The breathing moment before the tool. Nothing else in the frame. */
export function ClosingLine() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="closing" aria-label="In short">
      <motion.p
        className="closing__line"
        initial={{ opacity: 0, y: reduced ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: reduced ? 0.001 : 0.7 }}
      >
        The best time to ask if something is real is before you respond to it.
      </motion.p>
    </section>
  );
}

export function FinalCta() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="finale" aria-labelledby="cta-heading">
      <motion.div
        className="finale__card glass"
        initial={{ opacity: 0, y: reduced ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: reduced ? 0.001 : 0.55 }}
      >
        <h2 className="display-md finale__headline" id="cta-heading">
          Got a message you are not sure about?
        </h2>
        <p className="finale__sub">
          Paste it in. You will have an answer in about a second and a half.
        </p>
        <Link className="btn btn--primary btn--lg" to="/check">
          Check a message
          <ArrowRight />
        </Link>
        <p className="finale__fine">
          Free, no account. A second opinion, not a guarantee: when money or
          personal details are involved, call the company on a number you
          already have.
        </p>
      </motion.div>
    </section>
  );
}
