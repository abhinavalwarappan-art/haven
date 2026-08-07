/* ═══════════════════════════════════════════════════════════════════════════
   Icons
   ───────────────────────────────────────────────────────────────────────────
   Hand-rolled inline SVG rather than the Material Symbols webfont the design
   pass loaded from Google's CDN. Same reasoning as the typefaces: no
   third-party request on a page about not trusting things, nothing to fail on
   venue wi-fi, and an icon font is ~200kb to render a dozen glyphs.

   All 24×24, stroke-based, inheriting `currentColor` so a parent's verdict
   hue flows straight through.
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const ArrowRight = ({ className }: Props) => (
  <svg {...base} className={className}><path d="M4 12h15M13 6l6 6-6 6" /></svg>
);

export const ArrowDown = ({ className }: Props) => (
  <svg {...base} className={className}><path d="M12 4v15M6 13l6 6 6-6" /></svg>
);

export const Check = ({ className }: Props) => (
  <svg {...base} className={className}><path d="M4 12.5l5 5L20 6.5" /></svg>
);

/** Safe verdict. A shield with a tick — reassurance, not security theatre. */
export const ShieldCheck = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 3l7.5 3v5.5c0 4.4-3.1 8.4-7.5 9.5-4.4-1.1-7.5-5.1-7.5-9.5V6z" />
    <path d="M8.8 11.9l2.2 2.2 4.2-4.2" />
  </svg>
);

/** Scam verdict. A shield struck through. */
export const ShieldAlert = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 3l7.5 3v5.5c0 4.4-3.1 8.4-7.5 9.5-4.4-1.1-7.5-5.1-7.5-9.5V6z" />
    <path d="M12 8.4v3.9" />
    <path d="M12 15.6h.01" />
  </svg>
);

/** Uncertain verdict. */
export const QuestionMark = ({ className }: Props) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.4a2.5 2.5 0 114 2.2c-.9.6-1.6 1.2-1.6 2.2" />
    <path d="M12 17.2h.01" />
  </svg>
);

/** Layer 1 — the deterministic rules pass. */
export const Rules = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M6 3.5h8.5L19 8v12.5H6z" />
    <path d="M14 3.5V8h5" />
    <path d="M9 13.5l2 2 4-4" />
  </svg>
);

/** Layer 2 — the model that reads context. */
export const Context = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 4.2a4.2 4.2 0 00-4.2 4.2c0 .9-.4 1.6-1 2.3A3.6 3.6 0 007.6 17H8v2.8h8V17h.4a3.6 3.6 0 00.8-6.3c-.6-.7-1-1.4-1-2.3A4.2 4.2 0 0012 4.2z" />
    <path d="M9.8 11.6l1.6 1.6 2.8-2.8" />
  </svg>
);

/** Trust: nothing kept. */
export const NoTrace = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M5 7h14" />
    <path d="M9.5 7V4.8h5V7" />
    <path d="M6.8 7l.8 12.2h8.8L17.2 7" />
    <path d="M10.2 10.6v5.4M13.8 10.6v5.4" />
  </svg>
);

/** Trust: the one-way fingerprint. */
export const Fingerprint = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M5.2 11a6.8 6.8 0 0113.6 0" />
    <path d="M8.4 11.6a3.6 3.6 0 017.2 0c0 3-.6 5.4-1.6 7.4" />
    <path d="M11.4 11.8a.6.6 0 011.2 0c0 3.4-.5 6-1.5 8" />
    <path d="M7.2 19.4c1-1.8 1.6-4 1.6-6.4" />
  </svg>
);

/** Trust: written for a person, not an analyst. */
export const Heart = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 20s-7.2-4.4-7.2-9.3A3.9 3.9 0 0112 8.2a3.9 3.9 0 017.2 2.5C19.2 15.6 12 20 12 20z" />
  </svg>
);

/** Compose / retry. */
export const Search = ({ className }: Props) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="6.4" />
    <path d="M15.8 15.8L20 20" />
  </svg>
);

/** Thinking. */
export const Sparkle = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M12 3.6l1.9 4.9 4.9 1.9-4.9 1.9L12 17.2l-1.9-4.9-4.9-1.9 4.9-1.9z" />
  </svg>
);

/** Something went wrong. */
export const CloudOff = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M7.5 18.5h9.2a3.6 3.6 0 00.7-7.1 5.4 5.4 0 00-9-3" />
    <path d="M7.5 18.5a3.6 3.6 0 01-.6-7.1" />
    <path d="M4 4l16 16" />
  </svg>
);

/** Rate limit — a pause, not a failure. */
export const Hourglass = ({ className }: Props) => (
  <svg {...base} className={className}>
    <path d="M7 4h10M7 20h10" />
    <path d="M8 4v3.2c0 1.6 1.4 2.9 4 4.8 2.6-1.9 4-3.2 4-4.8V4" />
    <path d="M8 20v-3.2c0-1.6 1.4-2.9 4-4.8 2.6 1.9 4 3.2 4 4.8V20" />
  </svg>
);

export const NoAccount = ({ className }: Props) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8.6" r="3.4" />
    <path d="M5.6 19.4a6.8 6.8 0 0112.8 0" />
    <path d="M4 4l16 16" />
  </svg>
);

export const Timer = ({ className }: Props) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="13" r="7.4" />
    <path d="M12 9.4V13l2.4 1.6" />
    <path d="M9.6 3.4h4.8" />
  </svg>
);
