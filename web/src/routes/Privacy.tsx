import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

import { PageShell } from '../components/PageShell';
import { ArrowRight, Fingerprint, Heart, NoTrace } from '../components/Icons';
import { useRise } from '../lib/useRise';

/* ═══════════════════════════════════════════════════════════════════════════
   Privacy, stated as fact rather than as reassurance.
   ───────────────────────────────────────────────────────────────────────────
   A tool that tells you what to be suspicious of has to survive being pointed
   at itself. So this page says exactly what is kept, exactly what is not, and
   names one privacy bug that shipped and had to be fixed. That last part is
   the only bit that is actually hard to fake.
   ═══════════════════════════════════════════════════════════════════════════ */

const PILLARS = [
  {
    icon: NoTrace,
    title: 'Your message is never stored',
    body: 'Not as text, not anywhere. What you paste is checked and then it is gone. There is no history to browse, no archive to leak, and nothing to hand over if somebody asks.',
  },
  {
    icon: Fingerprint,
    title: 'Only a scrambled fingerprint is kept',
    body: 'A one-way hash of the message and nothing else. Enough to notice the same scam going around tonight, impossible to turn back into what you pasted.',
  },
  {
    icon: Heart,
    title: 'No account, no email, no tracking',
    body: 'There is nothing to sign up for and nobody to sell. No analytics script, no advertising pixel, no third-party font request. Open the page, paste, read the answer, close the tab.',
  },
];

const KEPT = [
  'A salted one-way hash of the message',
  'The verdict, and how confident it was',
  'Which rule signals fired, as short labels',
  'A timestamp, and how long the check took',
];

const NOT_KEPT = [
  'The message you pasted, in any form',
  'Your name, email address or phone number',
  'Your IP address, beyond counting requests in memory',
  'Cookies, analytics, advertising or fingerprinting',
];

export function Privacy() {
  const { rise } = useRise();

  return (
    <PageShell
      name="privacy"
      eyebrow="Privacy"
      title="We are asking you to paste something private."
      lede="A tool that tells you what to be suspicious of should hold itself to the same standard. Here is exactly what happens to what you paste, in the order it happens."
    >
      {/* ── The three pillars ───────────────────────────────────────────── */}
      <section className="section" aria-labelledby="pillars-heading">
        <div className="section__inner">
          <h2 className="sr-only" id="pillars-heading">
            The short version
          </h2>
          <div className="pillars">
            {PILLARS.map(({ icon: Icon, title, body }, i) => (
              <motion.article className="pillar glass" key={title} {...rise(i)}>
                <div className="pillar__icon" aria-hidden="true">
                  <Icon />
                </div>
                <h3 className="headline pillar__title">{title}</h3>
                <p className="pillar__body">{body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ── The ledger ──────────────────────────────────────────────────── */}
      <section className="section" aria-labelledby="ledger-heading">
        <div className="section__inner">
          <motion.p className="label section__eyebrow" {...rise()}>
            The whole list
          </motion.p>
          <motion.h2 className="display-md" id="ledger-heading" {...rise(1)}>
            Kept, and not kept.
          </motion.h2>
          <motion.div className="section__lead" {...rise(2)}>
            <p>
              Two columns, no footnotes. If something is not in the left column,
              it does not exist on our side.
            </p>
          </motion.div>

          <div className="ledger">
            <motion.div className="ledger__col ledger__col--kept glass" {...rise(3)}>
              <h3 className="label ledger__title">What is kept</h3>
              <ul className="ledger__list">
                {KEPT.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </motion.div>

            <motion.div className="ledger__col ledger__col--not glass" {...rise(4)}>
              <h3 className="label ledger__title">What is not</h3>
              <ul className="ledger__list">
                {NOT_KEPT.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── The hash ────────────────────────────────────────────────────── */}
      <section className="section" aria-labelledby="hash-heading">
        <div className="section__inner">
          <motion.p className="label section__eyebrow" {...rise()}>
            The fingerprint
          </motion.p>
          <motion.h2 className="display-md" id="hash-heading" {...rise(1)}>
            What a one-way hash actually means.
          </motion.h2>

          <motion.div className="prose" {...rise(2)}>
            <p>
              When you paste a message, it gets run through a function that
              turns any text into the same fixed string of characters every
              time. That string is what we store. The function only runs one
              direction: you cannot feed it the string and get your message
              back, and neither can we.
            </p>
            <p>
              It is also salted, which means a secret value is mixed in before
              the scrambling. Without that, somebody holding a list of common
              scam texts could hash them all and check which ones we had seen.
              The salt makes that guessing game useless to anyone outside.
            </p>
            <p>
              What it buys is small and specific: when the same scam gets
              forwarded to forty people in one evening, the forty checks collapse
              to one fingerprint, and the counter in the footer can say so. That
              is the entire reason it exists.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── The bug ─────────────────────────────────────────────────────── */}
      <section className="section" aria-labelledby="bug-heading">
        <div className="section__inner">
          <motion.p className="label section__eyebrow" {...rise()}>
            One we got wrong
          </motion.p>
          <motion.h2 className="display-md" id="bug-heading" {...rise(1)}>
            A privacy bug that shipped.
          </motion.h2>

          <motion.div className="prose" {...rise(2)}>
            <p>
              For a while the written answers were quoting card numbers and
              Social Security numbers straight back out of the pasted message.
              Nothing was ever stored, but that text travelled back across the
              network, where anything in the middle could have logged it.
            </p>
            <p>
              It hid well. The privacy tests passed for as long as there was no
              working model key, because the rules pass never echoes its input.
              The moment a real key was present, two assertions failed and the
              bug appeared. It had been there the whole time.
            </p>
            <p>
              It is fixed in two places now. Card numbers and Social Security
              numbers are stripped from the answer on the server, and the model
              is told not to repeat them. Deliberately narrow: naming the
              scammer's phone number or email address is useful advice, so those
              stay. Your card number in an answer is nothing but liability.
            </p>
            <p>
              This is on the page because a privacy claim nobody has ever tested
              is worth very little, and the test that caught this one is still
              running.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── The documents ───────────────────────────────────────────────── */}
      <section className="section section--docs" aria-labelledby="docs-heading">
        <div className="section__inner">
          <motion.div className="docs" {...rise()}>
            <div className="docs__head">
              <h2 className="headline" id="docs-heading">
                The long versions
              </h2>
              <p className="docs__note">
                Everything above in formal terms, for anyone who wants it that
                way.
              </p>
            </div>

            <div className="docs__links">
              <Link className="doclink glass" to="/privacy-policy">
                <span className="doclink__label">Privacy policy</span>
                <span className="doclink__sub">
                  What is collected, why, how long it lives, and your rights
                  over it.
                </span>
                <ArrowRight />
              </Link>

              <Link className="doclink glass" to="/terms">
                <span className="doclink__label">Terms of service</span>
                <span className="doclink__sub">
                  What Haven is, what it is not, and the limits of what an
                  answer here means.
                </span>
                <ArrowRight />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
}
