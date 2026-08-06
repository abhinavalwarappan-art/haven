import type { Stats } from '../lib/types';

export function Masthead() {
  return (
    <header className="masthead">
      <h1 className="wordmark">
        Is this real<span className="wordmark__mark">?</span>
      </h1>
      <p className="tagline">Paste a message you’re unsure about. We’ll tell you plainly.</p>
    </header>
  );
}

export function Footer({ stats }: { stats: Stats | null }) {
  const plural = (n: number, word: string) =>
    `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;

  return (
    <footer className="footer">
      {stats && (
        <p className="stats">
          <b>{plural(stats.total_checks, 'message')}</b> checked so far ·{' '}
          <b>{plural(stats.scams_flagged, 'scam')}</b> caught
        </p>
      )}
      <p className="disclaimer">
        A second opinion, not a guarantee. When money or personal details are involved, contact
        the company using a number you already have.
      </p>
    </footer>
  );
}
