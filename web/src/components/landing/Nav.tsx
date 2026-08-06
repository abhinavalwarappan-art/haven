import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export function Nav() {
  // Transparent over the hero, then it earns a surface once content scrolls
  // underneath it. Bound to a scroll listener rather than IntersectionObserver
  // because the threshold is a single pixel value, not an element boundary.
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="nav" data-lifted={lifted ? 'true' : undefined} aria-label="Main">
      <Link className="nav__mark" to="/">
        Is this real<span className="nav__q">?</span>
      </Link>
      <Link className="btn btn--primary btn--sm" to="/check">
        Check a message
      </Link>
    </nav>
  );
}
