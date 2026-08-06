import { motion } from 'motion/react';

import { VERDICT_COPY, confidenceCopy } from '../lib/copy';
import { letterItem, letterVariants, reasonsList, ruleItem } from '../lib/motion';
import type { CheckResponse } from '../lib/types';

interface Props {
  result: CheckResponse;
  reduced: boolean;
  /** Omitted on the landing page, where there is nothing to go back to. */
  onAgain?: () => void;
}

/**
 * The verdict, composed as a letterhead: masthead, rule, standfirst, then the
 * body set in columns. See letter.css for why this shape rather than a card.
 */
export function VerdictLetter({ result, reduced, onAgain }: Props) {
  const copy = VERDICT_COPY[result.verdict] ?? VERDICT_COPY.uncertain_be_careful;
  const item = letterItem(reduced);

  // When the AI layer was unavailable we say so, rather than presenting a
  // rules-only answer with the same authority as a full one. The wording comes
  // from meta.notice so the API, the UI and the CLI can’t drift apart.
  const advice = [copy.advice, result.meta?.notice].filter(Boolean).join(' ');

  return (
    <>
      <motion.article
        className="letter"
        data-verdict={result.verdict}
        variants={letterVariants(reduced)}
        initial="initial"
        animate="animate"
      >
        <motion.p className="letter__eyebrow" variants={item}>
          {copy.eyebrow}
        </motion.p>

        <motion.h2 className="letter__headline" id="verdict-heading" variants={item}>
          {copy.headline}
        </motion.h2>

        <motion.div className="letter__rule" variants={ruleItem(reduced)} aria-hidden="true" />

        <motion.p className="letter__confidence" variants={item}>
          {confidenceCopy(result.verdict, result.confidence)}
        </motion.p>

        <div className="letter__cols" data-cols={advice ? '2' : '1'}>
          <motion.section variants={item}>
            <h3 className="letter__label">Why we think so</h3>
            <motion.ul className="reasons" variants={reasonsList(reduced)}>
              {result.reasons.map((reason, i) => (
                <motion.li key={`${i}-${reason.slice(0, 24)}`} variants={item}>
                  {reason}
                </motion.li>
              ))}
            </motion.ul>
          </motion.section>

          {advice && (
            <motion.section variants={item}>
              <h3 className="letter__label">What to do</h3>
              <p className="letter__advice">{advice}</p>
            </motion.section>
          )}
        </div>
      </motion.article>

      {onAgain && (
        <motion.button
          type="button"
          className="cta cta--ghost result__again"
          onClick={onAgain}
          variants={item}
          initial="initial"
          animate="animate"
          transition={{ delay: reduced ? 0 : 0.34 }}
        >
          Check another message
        </motion.button>
      )}
    </>
  );
}
