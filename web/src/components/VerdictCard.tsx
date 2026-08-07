import type { ReactElement } from 'react';
import { motion } from 'motion/react';

import { VERDICT_COPY, confidenceCopy } from '../lib/copy';
import { letterItem, letterVariants, reasonsList } from '../lib/motion';
import type { CheckResponse, Verdict } from '../lib/types';
import { QuestionMark, Search, ShieldAlert, ShieldCheck } from './Icons';

interface Props {
  result: CheckResponse;
  reduced: boolean;
  /** Omitted on the landing page, where there is nothing to go back to. */
  onAgain?: () => void;
}

const ICON: Record<Verdict, (p: { className?: string }) => ReactElement> = {
  scam: ShieldAlert,
  likely_safe: ShieldCheck,
  uncertain_be_careful: QuestionMark,
};

/**
 * The answer, as a glass card floating in the dreamscape.
 *
 * The card surface stays the same calm glass as everything else on the site;
 * the verdict colour lives in the ink — icon, headline, reason markers — so
 * the answer reads instantly without the screen turning into an alarm.
 */
export function VerdictCard({ result, reduced, onAgain }: Props) {
  const copy = VERDICT_COPY[result.verdict] ?? VERDICT_COPY.uncertain_be_careful;
  const item = letterItem(reduced);
  const Icon = ICON[result.verdict] ?? QuestionMark;

  const notice = result.meta?.notice ?? null;

  return (
    <motion.article
      className="verdict glass"
      data-verdict={result.verdict}
      variants={letterVariants(reduced)}
      initial="initial"
      animate="animate"
    >
      <motion.div className="verdict__icon" variants={item}>
        <Icon />
      </motion.div>

      <motion.h2 className="verdict__headline" id="verdict-heading" variants={item}>
        {copy.headline}
      </motion.h2>

      <motion.p className="verdict__confidence" variants={item}>
        {confidenceCopy(result.verdict, result.confidence)}
      </motion.p>

      {/* When the AI layer was unavailable we say so, rather than presenting a
          rules-only answer with the same authority as a full one. The wording
          comes from meta.notice so the API, the UI and the CLI can't drift. */}
      {notice && (
        <motion.p className="verdict__notice" variants={item}>
          {notice}
        </motion.p>
      )}

      <motion.section className="verdict__section" variants={item}>
        <h3 className="label verdict__label">Why we think so</h3>
        <motion.ul className="reasons" variants={reasonsList(reduced)}>
          {result.reasons.map((reason, i) => (
            <motion.li className="reason" key={`${i}-${reason.slice(0, 24)}`} variants={item}>
              {/* A neutral dash, not a tick. A checkmark beside "the link is
                  fake" reads as *verified*, which is the opposite of what a
                  scam reason means — the verdict colour already carries the
                  judgement. */}
              <span className="reason__mark" aria-hidden="true" />
              <p>{reason}</p>
            </motion.li>
          ))}
        </motion.ul>
      </motion.section>

      {copy.advice && (
        <motion.div className="verdict__advice" variants={item}>
          <h3 className="label verdict__label">What to do</h3>
          <p>{copy.advice}</p>
        </motion.div>
      )}

      {onAgain && (
        <motion.div className="verdict__actions" variants={item}>
          <button type="button" className="btn btn--primary" onClick={onAgain}>
            <Search />
            Check another message
          </button>
        </motion.div>
      )}
    </motion.article>
  );
}
