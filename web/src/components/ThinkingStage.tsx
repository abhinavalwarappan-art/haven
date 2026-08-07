import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { STEP_MS, THINKING_STEPS } from '../lib/copy';
import { Sparkle } from './Icons';

/**
 * The wait, narrated honestly.
 *
 * This state was missing from the design pass entirely — built here in the
 * same glass-and-pastel system as the screens that were exported.
 */
export function ThinkingStage({ reduced }: { reduced: boolean }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const steps = setInterval(() => {
      setStep((current) => Math.min(current + 1, THINKING_STEPS.length - 1));
    }, STEP_MS);

    // Eases toward 92% and stops. It never completes on its own — only a real
    // response finishes the bar — so the UI never claims to be done before it
    // is. The 130ms tick puts it around 70% at 1.5s, which reads as genuine
    // progress rather than a bar that barely moved.
    const bar = setInterval(() => {
      setProgress((current) => current + (92 - current) * 0.14);
    }, 130);

    return () => {
      clearInterval(steps);
      clearInterval(bar);
    };
  }, []);

  return (
    <section className="checker" aria-live="polite" aria-busy="true">
      <div className="thinking glass">
        <div className="thinking__orb" aria-hidden="true">
          <Sparkle />
        </div>

        {/* Each line replaces the last in place. Crossfading rather than
            swapping the text keeps the narration calm — a hard cut every
            600ms reads as flickering. */}
        <p className="thinking__copy">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={step}
              initial={{ opacity: 0, y: reduced ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : -6 }}
              transition={{ duration: reduced ? 0.001 : 0.22 }}
              style={{ display: 'inline-block' }}
            >
              {THINKING_STEPS[step]}
            </motion.span>
          </AnimatePresence>
        </p>

        <p className="thinking__sub">
          This takes a moment. We read it properly rather than guessing.
        </p>

        <div className="thinking__bar" aria-hidden="true">
          <span
            className="thinking__fill"
            style={{ transform: `scaleX(${(progress / 100).toFixed(3)})` }}
          />
        </div>
      </div>
    </section>
  );
}
