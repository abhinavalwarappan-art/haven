import { motion, useReducedMotion } from 'motion/react';

/* The figures the demo script opens with, kept verbatim rather than replaced.
   The design pass invented "$10B+ lost annually" and "1 in 4 people targeted
   every month" — neither is sourced anywhere in this repo, and a scam-safety
   product citing numbers it cannot back is exactly the wrong look. These two
   are the ones already carried in DEMO_SCRIPT.md. */
const FIGURES = [
  {
    value: '$12.5B',
    label: 'lost to fraud in the United States in a single year.',
    source: 'FTC',
  },
  {
    value: '60+',
    label: 'the age group losing the most money per victim, by a wide margin.',
    source: 'FBI IC3',
  },
];

export function ProblemSection() {
  const reduced = useReducedMotion() ?? false;

  const rise = (i = 0) => ({
    initial: { opacity: 0, y: reduced ? 0 : 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-70px' },
    transition: { duration: reduced ? 0.001 : 0.55, delay: reduced ? 0 : 0.08 * i },
  });

  return (
    <section className="section" id="problem" aria-labelledby="problem-heading">
      <div className="section__inner">
        <motion.p className="label section__eyebrow" {...rise()}>
          The problem
        </motion.p>

        <motion.h2 className="display-md" id="problem-heading" {...rise(1)}>
          These messages are built to survive a second look.
        </motion.h2>

        <motion.div className="section__lead" {...rise(2)}>
          <p>
            The people losing the most money are over 60, and it is not because
            they are careless. A modern scam text carries a real tracking
            number, a real company name, a link that reads correctly until you
            check the last few characters, and a deadline that gives you a
            reason to stop checking.
          </p>
        </motion.div>

        <div className="figures">
          {FIGURES.map((figure, i) => (
            <motion.div className="figure glass" key={figure.value} {...rise(i + 3)}>
              <span className="figure__value">{figure.value}</span>
              <p className="figure__label">{figure.label}</p>
              <span className="figure__source label">{figure.source}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
