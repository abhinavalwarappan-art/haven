import { motion } from 'motion/react';
import type { ReactNode } from 'react';

import { useRise } from '../lib/useRise';

export interface Clause {
  heading: string;
  body: ReactNode;
}

/**
 * The shared body layout for the policy and the terms.
 *
 * Numbered so a person can point at one ("clause 4 says..."), measure-capped
 * so the lines stay readable, and deliberately plainer than the rest of the
 * site: this is the one place where being interesting is the wrong goal.
 */
export function LegalDoc({ updated, clauses }: { updated: string; clauses: Clause[] }) {
  const { rise } = useRise();

  return (
    <section className="section legal" aria-label="Document">
      <div className="section__inner">
        <motion.p className="legal__updated" {...rise()}>
          Last updated {updated}
        </motion.p>

        <ol className="legal__clauses">
          {clauses.map(({ heading, body }, i) => (
            <motion.li className="legal__clause" key={heading} {...rise(Math.min(i, 6))}>
              <h2 className="legal__heading">{heading}</h2>
              <div className="prose">{body}</div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
