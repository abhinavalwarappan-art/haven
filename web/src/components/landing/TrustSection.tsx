import { motion, useReducedMotion } from 'motion/react';

const PROMISES = [
  {
    title: 'Your message is never stored',
    body: 'We keep a salted one-way hash of it and nothing else. That is enough to count how many people have seen the same scam tonight. It cannot be turned back into your text, and rotating the salt cuts the link to older rows on purpose.',
  },
  {
    title: 'Card numbers and SSNs get stripped',
    body: 'A pasted message often contains the reader’s own details. The model is told not to repeat them, and we strip them from its written reasons on the server anyway, because a reason that quotes your card number lands in every log between us and you.',
  },
  {
    title: 'No account, no email, no tracking',
    body: 'There is nothing to sign up for and nobody to sell. Open the page, paste, read the answer, close the tab.',
  },
  {
    title: 'It tells you when it is guessing',
    body: 'If the model cannot run, the rules answer alone and the page says so in plain words. A rules-only verdict can be confidently wrong, so it never gets to borrow the authority of a full one.',
  },
];

export function TrustSection() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="section section--trust" aria-labelledby="trust-heading">
      <div className="section__inner">
        <p className="section__eyebrow">Trust</p>
        <h2 className="section__headline" id="trust-heading">
          We are asking you to paste something private.
        </h2>

        <div className="prose prose--lead">
          <p>
            A tool that tells you what to be suspicious of should hold itself to
            the same standard. Here is exactly what happens to what you paste.
          </p>
        </div>

        <div className="promises">
          {PROMISES.map((promise, i) => (
            <motion.article
              className="promise"
              key={promise.title}
              initial={{ opacity: 0, y: reduced ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: reduced ? 0.001 : 0.5, delay: reduced ? 0 : 0.07 * i }}
            >
              <h3 className="promise__title">{promise.title}</h3>
              <p className="promise__body">{promise.body}</p>
            </motion.article>
          ))}
        </div>

        <motion.aside
          className="receipt"
          initial={{ opacity: 0, y: reduced ? 0 : 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: reduced ? 0.001 : 0.5 }}
        >
          <h3 className="receipt__title">We found this one ourselves</h3>
          <p>
            An early version let the model quote card numbers and Social
            Security numbers back inside its explanations. Nothing crashed and
            no test failed, because without a live API key every check fell
            through to the rules layer and the model never spoke. We caught it
            the day we wired up a real key, then fixed it in two places and
            wrote 91 assertions that fail if a test card number ever reaches the
            response or the database again.
          </p>
          <p className="receipt__note">
            That is the difference between a prompt wrapper and a product. The
            whole build log is in the repo, including the parts that make us
            look bad.
          </p>
        </motion.aside>
      </div>
    </section>
  );
}
