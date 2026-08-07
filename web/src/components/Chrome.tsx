import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { Stats } from '../lib/types';

/** Shared across both routes, so the site reads as one product. */
export function Nav({ showChecker = true }: { showChecker?: boolean }) {
  // Transparent over the hero, then it earns a surface once content scrolls
  // underneath it.
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="nav" data-lifted={lifted ? 'true' : undefined} aria-label="Main">
      <div className="nav__inner">
        <Link className="nav__mark" to="/">
          Haven
        </Link>
        {/* Real routes, not anchors into the landing page. Both answer a
            question someone asks before they trust the tool, and both deserve
            a page they can read, link to, and come back to. */}
        <div className="nav__links">
          <Link className="nav__link" to="/how-it-works">
            How it works
          </Link>
          <Link className="nav__link" to="/privacy">
            Privacy
          </Link>
        </div>
        {showChecker && (
          <Link className="btn btn--primary btn--sm" to="/check">
            Check a message
          </Link>
        )}
      </div>
    </nav>
  );
}

export function Footer({ stats }: { stats?: Stats | null }) {
  const plural = (n: number, word: string) =>
    `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;

  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__mark">Haven</p>

        {stats && (
          <p className="footer__stats">
            <b>{plural(stats.total_checks, 'message')}</b> checked ·{' '}
            <b>{plural(stats.scams_flagged, 'scam')}</b> caught
          </p>
        )}

        <p className="footer__note">
          A second opinion, not a guarantee. When money or personal details are
          involved, contact the company using a number you already have.
        </p>
      </div>
    </footer>
  );
}
