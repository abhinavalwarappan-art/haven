import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   The two-layer architecture, in the language a judge and a user both read.
   CSS 3D rather than a flat diagram: the two layers sit at different depths on
   a shared perspective and separate as you scroll past them, so the structure
   is something you see rather than something you are told.
   ═══════════════════════════════════════════════════════════════════════════ */

const LAYER_ONE = [
  'Links that only look like the real company',
  'Gift cards, wire transfers, crypto, payment apps',
  'Manufactured deadlines and account threats',
  'Signs a message is genuine, weighted the other way',
];

const LAYER_TWO = [
  'Reads the original text alongside the evidence',
  'Weighs what the message asks you to do, not its tone',
  'Writes the reasons in plain English',
  'Says when it cannot tell',
];

export function HowItWorks() {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // The layers pull apart as the section crosses the viewport. Small values on
  // purpose: enough to read as depth, not enough to become a ride.
  const topZ = useTransform(scrollYProgress, [0, 0.5, 1], [0, 34, 0]);
  const topY = useTransform(scrollYProgress, [0, 0.5, 1], [16, -10, 16]);
  const botZ = useTransform(scrollYProgress, [0, 0.5, 1], [0, -22, 0]);

  return (
    <section className="section section--how" id="how" aria-labelledby="how-heading">
      <div className="section__inner">
        <p className="section__eyebrow">How it works</p>
        <h2 className="section__headline" id="how-heading">
          Every message gets read twice.
        </h2>

        <div className="prose prose--lead">
          <p>
            One layer is code that cannot be talked out of its answer. The other
            understands what a message is setting up. Neither is enough by
            itself, and that is the whole design.
          </p>
        </div>

        <div className="layers" ref={ref}>
          <motion.article
            className="layer layer--rules"
            style={reduced ? undefined : { z: topZ, y: topY }}
          >
            <header className="layer__head">
              <span className="layer__num">Layer 1</span>
              <h3 className="layer__title">Rules that run offline</h3>
            </header>
            <p className="layer__body">
              A deterministic pass over the text. It catches <code>amaz0n.com</code>{' '}
              pretending to be Amazon the same way every single time, and it
              keeps working when the API is down.
            </p>
            <ul className="layer__list">
              {LAYER_ONE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.article>

          <div className="layers__link" aria-hidden="true">
            <span className="layers__wire" />
            <span className="layers__note">evidence, not a verdict</span>
            <span className="layers__wire" />
          </div>

          <motion.article
            className="layer layer--ai"
            style={reduced ? undefined : { z: botZ }}
          >
            <header className="layer__head">
              <span className="layer__num">Layer 2</span>
              <h3 className="layer__title">A model that reads context</h3>
            </header>
            <p className="layer__body">
              The findings from Layer 1 go to the model as evidence it has to
              weigh, never as an answer it should agree with. That distinction
              is what stops it rubber-stamping the rules and flagging every
              urgent message a real bank sends.
            </p>
            <ul className="layer__list">
              {LAYER_TWO.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.article>
        </div>

        <div className="callouts">
          <article className="callout">
            <h3 className="callout__title">Why the rules alone fail</h3>
            <p>
              A stranger texts “sorry, wrong number,” then starts chatting. That
              is how most romance and crypto scams open. It scores{' '}
              <b>zero out of a hundred</b> on the rules layer, because there is
              nothing to match on. No link, no payment ask, no urgency. The
              model catches it anyway.
            </p>
          </article>

          <article className="callout">
            <h3 className="callout__title">Why the model alone fails</h3>
            <p>
              A Cyrillic <code>а</code> dropped into <code>pаypal.com</code>{' '}
              renders identically to the Latin one. Catching that is a string
              algorithm, not a judgement call, and it should give the same
              answer on the thousandth message as the first.
            </p>
          </article>

          <article className="callout callout--wide">
            <h3 className="callout__title">The failure we actually optimise for</h3>
            <p>
              Missing a scam is bad. Flagging a real bank alert is worse. Get
              burned once and you stop trusting the tool, then you ignore it on
              the day it matters. So Layer 1 hunts for reasons a message is{' '}
              <em>genuine</em> too, and weights them against suspicion: a real
              brand domain, an order number a stranger could not know, a
              compliant unsubscribe footer, the absence of any ask. All five
              legitimate messages in our test set come back clean, including a
              real fraud alert that is urgent, mentions suspicious activity, and
              names a bank.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
