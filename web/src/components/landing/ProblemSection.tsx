import { motion, useReducedMotion } from 'motion/react';

/* Figures from the FTC's 2024 fraud report, the same ones the demo script
   opens with. Stated flat, without adjectives doing the work. */
const FIGURES = [
  { figure: '$12.5B', label: 'lost to fraud in the US in 2024', source: 'FTC' },
  { figure: '2 in 3', label: 'scam texts open with a delivery or account notice', source: 'FTC data' },
  { figure: '60+', label: 'the age group losing the most money per victim', source: 'FBI IC3' },
];

export function ProblemSection() {
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="section section--problem" aria-labelledby="problem-heading">
      <div className="section__inner">
        <motion.p
          className="section__eyebrow"
          initial={{ opacity: 0, y: reduced ? 0 : 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: reduced ? 0.001 : 0.5 }}
        >
          The problem
        </motion.p>

        <motion.h2
          className="section__headline"
          id="problem-heading"
          initial={{ opacity: 0, y: reduced ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: reduced ? 0.001 : 0.55, delay: reduced ? 0 : 0.06 }}
        >
          These messages are built to survive a second look.
        </motion.h2>

        <motion.div
          className="prose"
          initial={{ opacity: 0, y: reduced ? 0 : 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: reduced ? 0.001 : 0.55, delay: reduced ? 0 : 0.12 }}
        >
          <p>
            The people losing the most money are over 60. That is not because
            they are careless. A modern scam text carries a real tracking
            number, a real company name, a link that reads correctly until you
            check the last few characters, and a deadline that gives you a
            reason to stop checking.
          </p>
          <p>
            The advice we give these targets is useless. <b>Look for spelling
            mistakes.</b> <b>Check the sender.</b> Scammers read that advice
            too, and they fixed those tells years ago. Meanwhile the tools that
            actually work were built for security teams, and they answer in a
            language your grandmother has no reason to speak.
          </p>
          <p>
            So someone holding a suspicious message has two options. Ask a
            family member and wait, or guess. We built a third one.
          </p>
        </motion.div>

        <div className="figures">
          {FIGURES.map((stat, i) => (
            <motion.div
              className="figure"
              key={stat.figure}
              initial={{ opacity: 0, y: reduced ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: reduced ? 0.001 : 0.5, delay: reduced ? 0 : 0.08 * i }}
            >
              <span className="figure__value">{stat.figure}</span>
              <span className="figure__label">{stat.label}</span>
              <span className="figure__source">{stat.source}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
