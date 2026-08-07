import { useReducedMotion } from 'motion/react';

/**
 * The one scroll reveal this site uses: content lifts a little and fades in as
 * it comes into view, once, staggered by position.
 *
 * Every content section had its own copy of this six-line closure. One shared
 * version means the whole site cannot drift into having two slightly different
 * reveals, and there is a single place to change the feel.
 *
 * Returns `reduced` alongside the factory because most callers need to pass it
 * down to a component that animates internally (VerdictCard, for one).
 */
export function useRise() {
  const reduced = useReducedMotion() ?? false;

  const rise = (i = 0) => ({
    initial: { opacity: 0, y: reduced ? 0 : 18 },
    whileInView: { opacity: 1, y: 0 },
    // `once` matters: re-animating on every scroll past is the kind of motion
    // that makes a long page feel restless rather than alive.
    viewport: { once: true, margin: '-70px' } as const,
    transition: { duration: reduced ? 0.001 : 0.55, delay: reduced ? 0 : 0.08 * i },
  });

  return { rise, reduced };
}
