import { Suspense, lazy, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';

import { StackFallback } from './StackFallback';

/* Three.js is ~600kb. Splitting it here means the headline and the button paint
   immediately, `/check` never downloads a byte of it, and a slow connection
   gets the static illustration instead of an empty rectangle. */
const MessageStack3D = lazy(() => import('./MessageStack3D'));

export function Hero() {
  const reduced = useReducedMotion() ?? false;

  // Mount WebGL after first paint so the canvas never competes with the copy
  // for the main thread on load. Reduced motion skips it entirely: not a paused
  // animation, no canvas at all.
  const [mount3D, setMount3D] = useState(false);
  useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => setMount3D(true), 120);
    return () => window.clearTimeout(id);
  }, [reduced]);

  const rise = {
    initial: { opacity: 0, y: reduced ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero__copy">
        <motion.p
          className="hero__eyebrow"
          {...rise}
          transition={{ duration: reduced ? 0.001 : 0.5, delay: reduced ? 0 : 0.05 }}
        >
          Scam checker
        </motion.p>

        <motion.h1
          className="hero__headline"
          id="hero-heading"
          {...rise}
          transition={{ duration: reduced ? 0.001 : 0.6, delay: reduced ? 0 : 0.12 }}
        >
          Is this real<span className="hero__mark">?</span>
        </motion.h1>

        <motion.p
          className="hero__sub"
          {...rise}
          transition={{ duration: reduced ? 0.001 : 0.6, delay: reduced ? 0 : 0.2 }}
        >
          Paste the text, email or DM you are unsure about. You get one sentence
          back saying whether it looks like a scam, and the specific reasons why.
          No jargon, no risk score, nothing to sign up for.
        </motion.p>

        <motion.div
          className="hero__actions"
          {...rise}
          transition={{ duration: reduced ? 0.001 : 0.6, delay: reduced ? 0 : 0.28 }}
        >
          <Link className="btn btn--primary" to="/check">
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
          <a className="btn btn--quiet" href="#how">
            How it works
          </a>
        </motion.div>

        <motion.p
          className="hero__proof"
          {...rise}
          transition={{ duration: reduced ? 0.001 : 0.6, delay: reduced ? 0 : 0.36 }}
        >
          <b>16 of 16</b> on our classification suite · <b>1.5 seconds</b> a check ·
          your message is never stored
        </motion.p>
      </div>

      <div className="hero__stage">
        {mount3D ? (
          <Suspense fallback={<StackFallback />}>
            <MessageStack3D />
          </Suspense>
        ) : (
          <StackFallback />
        )}
      </div>
    </section>
  );
}
