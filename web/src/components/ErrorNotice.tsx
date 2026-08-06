import { motion } from 'motion/react';

import { letterItem } from '../lib/motion';

interface Props {
  headline: string;
  body: string;
  reduced: boolean;
  onRetry: () => void;
}

/**
 * Deliberately not a red error box. Most of what lands here is a rate-limit
 * pause, which is not a failure at all — and to the reader, an alarming error
 * screen on a scam checker looks like the scam checker itself is compromised.
 */
export function ErrorNotice({ headline, body, reduced, onRetry }: Props) {
  const item = letterItem(reduced);

  return (
    <motion.article className="notice" initial="initial" animate="animate">
      <motion.p className="notice__eyebrow" variants={item}>
        A note
      </motion.p>
      <motion.h2 className="notice__headline" variants={item}>
        {headline}
      </motion.h2>
      <motion.p className="notice__body" variants={item}>
        {body}
      </motion.p>
      <motion.button type="button" className="cta cta--ghost" onClick={onRetry} variants={item}>
        Try again
      </motion.button>
    </motion.article>
  );
}
