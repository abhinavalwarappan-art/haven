import type { Variants } from 'motion/react';

/* ═══════════════════════════════════════════════════════════════════════════
   Motion vocabulary
   ───────────────────────────────────────────────────────────────────────────
   One rule governs the whole product: compose → thinking → result is a single
   continuous reveal, not three screen swaps. Every stage leaves upward and
   quickly (140ms) and the next arrives from below, so the eye is carried
   through rather than cut between.

   Every factory takes `reduced`. Under prefers-reduced-motion the movement is
   dropped and the timing collapses toward zero — the sequence still runs, it
   just stops travelling. That keeps one code path instead of two.
   ═══════════════════════════════════════════════════════════════════════════ */

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** The outgoing stage clears fast; a slow exit is what makes a transition feel
 *  like a page change instead of a reveal. */
export function stageVariants(reduced: boolean): Variants {
  return {
    initial: { opacity: 0, y: reduced ? 0 : 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0.001 : 0.36, ease: EASE, when: 'beforeChildren' },
    },
    exit: {
      opacity: 0,
      y: reduced ? 0 : -10,
      transition: { duration: reduced ? 0.001 : 0.14, ease: 'easeIn' },
    },
  };
}

/** The letter’s children arrive in reading order: eyebrow, headline, rule,
 *  confidence, then each body column. The whole cascade lands inside ~800ms. */
export function letterVariants(reduced: boolean): Variants {
  return {
    initial: { opacity: 0, y: reduced ? 0 : 14, scale: reduced ? 1 : 0.988 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: reduced ? 0.001 : 0.42,
        ease: EASE,
        staggerChildren: reduced ? 0 : 0.055,
        delayChildren: reduced ? 0 : 0.08,
      },
    },
    exit: { opacity: 0, y: reduced ? 0 : -10, transition: { duration: reduced ? 0.001 : 0.14 } },
  };
}

export function letterItem(reduced: boolean): Variants {
  return {
    initial: { opacity: 0, y: reduced ? 0 : 10 },
    animate: { opacity: 1, y: 0, transition: { duration: reduced ? 0.001 : 0.4, ease: EASE } },
  };
}

/** The rule draws itself left to right — the single most satisfying beat in the
 *  reveal, and the one that makes the card read as a printed notice. */
export function ruleItem(reduced: boolean): Variants {
  return {
    initial: { scaleX: reduced ? 1 : 0, opacity: reduced ? 1 : 0.6 },
    animate: {
      scaleX: 1,
      opacity: 1,
      transition: { duration: reduced ? 0.001 : 0.52, ease: EASE },
    },
  };
}

/** Each reason is its own beat so the evidence reads as a list being written
 *  out, not a block appearing. */
export function reasonsList(reduced: boolean): Variants {
  return {
    initial: {},
    animate: { transition: { staggerChildren: reduced ? 0 : 0.05 } },
  };
}
