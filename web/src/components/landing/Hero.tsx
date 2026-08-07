import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';

import { ArrowRight, Check, NoAccount, ShieldAlert, Timer } from '../Icons';

const MARKERS = [
  { icon: Check, label: 'Free' },
  { icon: NoAccount, label: 'No account needed' },
  { icon: Timer, label: 'About a second and a half' },
];

/** Three fragments of a real scam text, and what the checker made of each. */
const SPECIMEN_LINES = [
  'USPS: Your package has been held at our facility.',
  'Update within 24 hours or it returns to sender.',
  'https://usps-trackdelivery.icu/redelivery',
];

export function Hero() {
  const reduced = useReducedMotion() ?? false;

  const rise = (delay = 0) => ({
    initial: { opacity: 0, y: reduced ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0.001 : 0.6, delay: reduced ? 0 : delay },
  });

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero__bg">
        {/* The real, self-hosted asset. The design pass pointed at a Google
            preview CDN URL that is neither this file nor a stable public one.
            2200px wide, WebP, 226kb, down from a 6.5mb PNG. */}
        <img
          src="/images/haven-hero.webp"
          alt=""
          width={2200}
          height={1228}
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero__scrim" aria-hidden="true" />
      </div>

      <div className="hero__inner">
        {/* Sits over the reflective floor, the one genuinely quiet region of
            the photograph, and uses the strong glass so body copy never has
            to fight the image behind it. */}
        <motion.div className="hero__panel glass glass--strong" {...rise(0.05)}>
          <div className="hero__lead">
            <h1 className="hero__wordmark" id="hero-heading">
              Haven
            </h1>
            <p className="hero__tagline">Your safe place to check anything.</p>
            <p className="hero__sub">
              Paste the text, email or DM you are unsure about. You get one
              sentence back saying whether it looks like a scam, and the
              specific reasons why.
            </p>

            <div className="hero__actions">
              <Link className="btn btn--primary btn--lg" to="/check">
                Check a message
                <ArrowRight />
              </Link>
              <Link className="btn btn--glass btn--lg" to="/how-it-works">
                How it works
              </Link>
            </div>

            <ul className="hero__markers">
              {MARKERS.map(({ icon: Icon, label }) => (
                <li className="hero__marker" key={label}>
                  <Icon />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* The product, in miniature, before anyone has to click anything.
              A landing page that only describes the thing asks the reader to
              take it on faith; showing the shape of an answer costs one small
              panel and removes that step. */}
          <div className="hero__specimen" aria-hidden="true">
            <p className="label hero__specimen-label">A message</p>
            <div className="specimen__msg">
              {SPECIMEN_LINES.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>

            <div className="specimen__arrowline">
              <span />
            </div>

            <p className="label hero__specimen-label">Haven says</p>
            <div className="specimen__verdict">
              <span className="specimen__icon">
                <ShieldAlert />
              </span>
              <div>
                <p className="specimen__headline">This looks like a scam.</p>
                <p className="specimen__reason">
                  The link goes to usps-trackdelivery.icu, which is not the real
                  USPS website.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
