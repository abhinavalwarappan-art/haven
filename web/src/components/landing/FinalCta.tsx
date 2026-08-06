import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';

export function FinalCta() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="section section--cta" aria-labelledby="cta-heading">
      <motion.div
        className="ctacard"
        initial={{ opacity: 0, y: reduced ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: reduced ? 0.001 : 0.55 }}
      >
        <h2 className="ctacard__headline" id="cta-heading">
          Got a message you are not sure about?
        </h2>
        <p className="ctacard__sub">
          Paste it in. You will have an answer in about a second and a half.
        </p>
        <Link className="btn btn--primary btn--lg" to="/check">
          Check a message
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <p className="ctacard__fine">
          Free, no account. A second opinion, not a guarantee: when money or
          personal details are involved, call the company on a number you
          already have.
        </p>
      </motion.div>
    </section>
  );
}
