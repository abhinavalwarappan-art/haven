import { motion } from 'motion/react';

import { letterItem, letterVariants } from '../lib/motion';
import { CloudOff, Hourglass, Search } from './Icons';

interface Props {
  kind: 'paused' | 'failed';
  headline: string;
  body: string;
  reduced: boolean;
  onRetry: () => void;
}

/**
 * Deliberately not a red error box.
 *
 * Most of what lands here is a rate-limit pause, which is not a failure at all
 * — it clears on its own in about a minute. To a frightened reader, an
 * alarming error screen on a scam checker looks like the scam checker itself
 * has been compromised, so `paused` gets the calm blue treatment and only a
 * genuine fault gets the neutral one.
 */
export function ErrorNotice({ kind, headline, body, reduced, onRetry }: Props) {
  const item = letterItem(reduced);
  const Icon = kind === 'paused' ? Hourglass : CloudOff;

  return (
    <section className="checker">
      <motion.article
        className="notice glass"
        data-kind={kind}
        variants={letterVariants(reduced)}
        initial="initial"
        animate="animate"
        role="alert"
      >
        <motion.div className="notice__icon" variants={item}>
          <Icon />
        </motion.div>
        <motion.h2 className="headline notice__headline" variants={item}>
          {headline}
        </motion.h2>
        <motion.p className="notice__body" variants={item}>
          {body}
        </motion.p>
        <motion.div variants={item}>
          <button type="button" className="btn btn--primary" onClick={onRetry}>
            <Search />
            Try again
          </button>
        </motion.div>
      </motion.article>
    </section>
  );
}
