import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

import { PageShell } from '../components/PageShell';
import { VerdictCard } from '../components/VerdictCard';
import { ArrowRight, CloudOff, Context, Rules } from '../components/Icons';
import type { CheckResponse } from '../lib/types';
import { useRise } from '../lib/useRise';

/* ═══════════════════════════════════════════════════════════════════════════
   How it works, shown rather than described.
   ───────────────────────────────────────────────────────────────────────────
   An architecture diagram tells you the shape of the system. It does not tell
   you why the system had to be that shape. So this page takes one real scam
   text and walks it the whole way down: what arrives, what the rules pass can
   prove about it on its own, what it hands over, what the model makes of that,
   and the answer that comes out.

   The message and the verdict below are a real response this tool produced.
   The signals are the actual checks in `src/lib/signals`, quoting the actual
   fragments they matched. Nothing on this page is written for effect, because
   a page that flatters the product is the first thing a judge stops believing.
   ═══════════════════════════════════════════════════════════════════════════ */

const MESSAGE = `USPS: Your package has been held at our facility due to an incomplete address. Please update your delivery details within 24 hours or the parcel will be returned to sender.

Update here: https://usps-trackdelivery.icu/redelivery

A $2.99 redelivery fee applies.`;

/** What pass one can establish without understanding a word of English. */
const SIGNALS = [
  {
    quote: 'usps-trackdelivery.icu',
    flag: 'Lookalike address',
    note: 'Styled to read as USPS. The real one is usps.com, and nothing else.',
  },
  {
    quote: '.icu',
    flag: 'Throwaway domain ending',
    note: 'Cheap to register, disposable, and almost never used by a real institution.',
  },
  {
    quote: 'within 24 hours',
    flag: 'Manufactured deadline',
    note: 'A countdown with no reason to exist except to stop you checking.',
  },
  {
    quote: 'A $2.99 redelivery fee',
    flag: 'Small payment ask',
    note: 'Small enough to feel harmless. The fee is not the theft; the card details are.',
  },
];

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

export function HowItWorks() {
  const { rise, reduced } = useRise();

  return (
    <PageShell
      name="how"
      eyebrow="How it works"
      title="Every message gets read twice."
      lede="One pass is code that cannot be talked out of its answer. The other understands what a message is setting up. Neither is enough by itself, and that is the whole design."
    >
      {/* ── The walkthrough ─────────────────────────────────────────────── */}
      <section className="section walk" aria-labelledby="walk-heading">
        <div className="section__inner">
          <motion.p className="label section__eyebrow" {...rise()}>
            Follow one message
          </motion.p>
          <motion.h2 className="display-md" id="walk-heading" {...rise(1)}>
            This one arrived on a Tuesday.
          </motion.h2>
          <motion.div className="section__lead" {...rise(2)}>
            <p>
              It is a real text, and a convincing one. Read it the way you would
              read it on your phone, half distracted, expecting a parcel.
            </p>
          </motion.div>

          <ol className="walk__stages">
            {/* Stage 1 */}
            <motion.li className="walk__stage" {...rise(3)}>
              <div className="walk__marker" aria-hidden="true">
                <span className="walk__dot" />
              </div>
              <div className="walk__body">
                <p className="walk__step">Step one</p>
                <h3 className="walk__title">What arrives</h3>
                <figure className="walk__message glass">
                  <pre className="walk__text">{MESSAGE}</pre>
                </figure>
                <p className="walk__note">
                  There is nothing obviously wrong with it. It knows the format,
                  the tone and the excuse. That is the point of it.
                </p>
              </div>
            </motion.li>

            {/* Stage 2 */}
            <motion.li className="walk__stage" {...rise(4)}>
              <div className="walk__marker" aria-hidden="true">
                <span className="walk__dot walk__dot--rules">
                  <Rules />
                </span>
              </div>
              <div className="walk__body">
                <p className="walk__step">Step two</p>
                <h3 className="walk__title">Rules that run offline</h3>
                <p className="walk__note">
                  Before any model sees it, a deterministic sweep goes looking
                  for things that are true or false with no interpretation
                  required. Here is what it found in this message, and where.
                </p>

                <ul className="signals">
                  {SIGNALS.map(({ quote, flag, note }) => (
                    <li className="signal glass" key={quote}>
                      <code className="signal__quote">{quote}</code>
                      <div className="signal__detail">
                        <p className="signal__flag">{flag}</p>
                        <p className="signal__note">{note}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <p className="walk__note">
                  This pass gets the same answer every time, and it keeps
                  working when nothing else does. What it cannot do is tell you
                  what any of it means.
                </p>
              </div>
            </motion.li>

            {/* Stage 3: the handoff */}
            <motion.li className="walk__stage walk__stage--handoff" {...rise(5)}>
              <div className="walk__marker" aria-hidden="true">
                <span className="walk__dot walk__dot--hollow" />
              </div>
              <div className="walk__body">
                <p className="walk__step">The handoff</p>
                <h3 className="walk__title">Evidence, not a verdict</h3>
                <p className="walk__note">
                  Those four findings go to the second pass as things it has to
                  weigh, never as an answer it should agree with. That single
                  choice is what stops the model rubber-stamping the rules and
                  flagging every genuinely urgent message a real bank sends.
                </p>
              </div>
            </motion.li>

            {/* Stage 4 */}
            <motion.li className="walk__stage" {...rise(6)}>
              <div className="walk__marker" aria-hidden="true">
                <span className="walk__dot walk__dot--context">
                  <Context />
                </span>
              </div>
              <div className="walk__body">
                <p className="walk__step">Step three</p>
                <h3 className="walk__title">A model that reads context</h3>
                <p className="walk__note">
                  Now the meaning gets read. The model knows what the Postal
                  Service does and does not do, what a redelivery fee is
                  actually for, and what a stranger gains by making you hurry.
                  It writes the answer in words a worried person can act on.
                </p>
              </div>
            </motion.li>

            {/* Stage 5 */}
            <motion.li className="walk__stage" {...rise(7)}>
              <div className="walk__marker" aria-hidden="true">
                <span className="walk__dot walk__dot--end" />
              </div>
              <div className="walk__body">
                <p className="walk__step">Step four</p>
                <h3 className="walk__title">What comes back</h3>
                <p className="walk__note">
                  Not a threat level, not a percentage. A sentence, then the
                  specific reasons, each pointing at something in the message
                  you can go and check yourself.
                </p>
                {/* The real component the tool renders, fed a fixed result.
                    If the product changes, this page changes with it. */}
                <div className="walk__verdict">
                  <VerdictCard result={RESULT} reduced={reduced} />
                </div>
              </div>
            </motion.li>
          </ol>
        </div>
      </section>

      {/* ── The counterexample ──────────────────────────────────────────── */}
      <section className="section" aria-labelledby="why-two-heading">
        <div className="section__inner">
          <motion.p className="label section__eyebrow" {...rise()}>
            Why one pass is not enough
          </motion.p>
          <motion.h2 className="display-md" id="why-two-heading" {...rise(1)}>
            Some messages have nothing to find.
          </motion.h2>

          <div className="counter">
            <motion.figure className="counter__message glass" {...rise(2)}>
              <pre className="walk__text">
                {'Hi! Sorry, is this Michael? I think I have the wrong number.'}
              </pre>
            </motion.figure>

            <motion.div className="counter__body" {...rise(3)}>
              <p>
                A stranger texts, apologises, and starts chatting. That is how
                most romance and crypto scams open, and it is where the money
                goes: not the parcel texts, the slow ones.
              </p>
              <p>
                It scores <b>zero out of a hundred</b> on the rules pass. There
                is nothing to match on. No link, no payment ask, no deadline,
                no lookalike domain. A rules-only filter waves it straight
                through, and so does most of your inbox.
              </p>
              <p>
                The second pass catches it anyway, because it can see what the
                message is <b>setting up</b>. That case is the entire argument
                for the second pass, and it is the reason the first one is not
                allowed to hand down verdicts.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── The fallback ────────────────────────────────────────────────── */}
      <section className="section" aria-labelledby="offline-heading">
        <div className="section__inner">
          <motion.aside className="callout callout--offline glass" {...rise()}>
            <div className="callout__icon" aria-hidden="true">
              <CloudOff />
            </div>
            <div>
              <h2 className="label callout__title" id="offline-heading">
                When the model is unavailable
              </h2>
              <p>
                Outages happen, and a scam checker that goes quiet during one is
                worse than useless. The rules pass keeps running on its own and
                you still get an answer, but the page says plainly that only one
                layer ran. A rules-only result can be confidently wrong, so it
                never gets dressed up as a full one.
              </p>
            </div>
          </motion.aside>

          <motion.div className="pagecta" {...rise(1)}>
            <Link className="btn btn--primary btn--lg" to="/check">
              Check a message
              <ArrowRight />
            </Link>
            <Link className="btn btn--quiet btn--lg" to="/privacy">
              What happens to what I paste
            </Link>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
}
