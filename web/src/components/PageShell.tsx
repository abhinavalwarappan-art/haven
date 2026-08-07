import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { Footer, Nav } from './Chrome';
import { fetchStats } from '../lib/api';
import type { Stats } from '../lib/types';

interface Props {
  /** Short kebab-case name, used as the page's root class hook. */
  name: string;
  eyebrow: string;
  title: string;
  lede: string;
  children: ReactNode;
}

/**
 * The frame every non-landing content page shares: nav, a masthead, the body,
 * and the footer.
 *
 * The scroll reset matters more than it looks. React Router keeps the scroll
 * position across a client-side navigation, so following "Privacy policy" from
 * the bottom of /privacy would drop you two thirds of the way down the policy
 * with no idea you had moved.
 */
export function PageShell({ name, eyebrow, title, lede, children }: Props) {
  const { pathname } = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    void fetchStats().then(setStats);
  }, []);

  return (
    <div className={`page page--${name}`}>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <Nav />

      <main id="main">
        <header className="masthead">
          <div className="masthead__inner">
            <p className="label masthead__eyebrow">{eyebrow}</p>
            <h1 className="display-lg masthead__title">{title}</h1>
            <p className="masthead__lede">{lede}</p>
          </div>
        </header>

        {children}
      </main>

      <Footer stats={stats} />
    </div>
  );
}
