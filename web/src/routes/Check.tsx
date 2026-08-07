import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { Footer, Nav } from '../components/Chrome';
import { ComposeStage } from '../components/ComposeStage';
import { ErrorNotice } from '../components/ErrorNotice';
import { ThinkingStage } from '../components/ThinkingStage';
import { VerdictCard } from '../components/VerdictCard';
import { check, fetchStats } from '../lib/api';
import { stageVariants } from '../lib/motion';
import type { CheckResponse, Stats } from '../lib/types';

type Stage =
  | { name: 'compose' }
  | { name: 'thinking' }
  | { name: 'result'; result: CheckResponse }
  | { name: 'error'; kind: 'paused' | 'failed'; headline: string; body: string };

export function Check() {
  const [stage, setStage] = useState<Stage>({ name: 'compose' });
  const [text, setText] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const landing = useRef<HTMLDivElement>(null);

  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    void fetchStats().then(setStats);
  }, []);

  /**
   * Move focus for screen readers without letting the browser scroll the nav
   * off the top — the verdict should arrive in place, not yank the page.
   */
  useEffect(() => {
    if (stage.name !== 'result' && stage.name !== 'error') return;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    landing.current?.focus({ preventScroll: true });
  }, [stage.name, reduced]);

  const run = useCallback(async (message: string) => {
    setStage({ name: 'thinking' });
    const outcome = await check(message);
    if (outcome.ok) {
      setStage({ name: 'result', result: outcome.data });
      void fetchStats().then(setStats);
    } else {
      setStage({
        name: 'error',
        kind: outcome.kind,
        headline: outcome.headline,
        body: outcome.body,
      });
    }
  }, []);

  const variants = stageVariants(reduced);

  return (
    <div className="landing">
      <a className="skip" href="#main">
        Skip to the message box
      </a>

      <Nav showChecker={false} />

      <main id="main" className="check__main">
        {/* One presence boundary for the whole flow. `mode="wait"` is what
            makes compose → thinking → result read as a single reveal. */}
        <AnimatePresence mode="wait" initial={false}>
          {stage.name === 'compose' && (
            <motion.div key="compose" variants={variants} initial="initial" animate="animate" exit="exit">
              <ComposeStage value={text} onChange={setText} onSubmit={run} reduced={reduced} />
            </motion.div>
          )}

          {stage.name === 'thinking' && (
            <motion.div key="thinking" variants={variants} initial="initial" animate="animate" exit="exit">
              <ThinkingStage reduced={reduced} />
            </motion.div>
          )}

          {stage.name === 'result' && (
            <motion.div
              key="result"
              ref={landing}
              tabIndex={-1}
              className="checker"
              aria-labelledby="verdict-heading"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ outline: 'none' }}
            >
              <VerdictCard
                result={stage.result}
                reduced={reduced}
                onAgain={() => setStage({ name: 'compose' })}
              />
            </motion.div>
          )}

          {stage.name === 'error' && (
            <motion.div
              key="error"
              ref={landing}
              tabIndex={-1}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ outline: 'none' }}
            >
              <ErrorNotice
                kind={stage.kind}
                headline={stage.headline}
                body={stage.body}
                reduced={reduced}
                onRetry={() => setStage({ name: 'compose' })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer stats={stats} />
    </div>
  );
}
