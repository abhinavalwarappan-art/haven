import { useEffect, useState } from 'react';

import { Footer, Nav } from '../components/Chrome';
import { ClosingLine, FinalCta } from '../components/landing/FinalCta';
import { Hero } from '../components/landing/Hero';
import { LiveDemoPreview } from '../components/landing/LiveDemoPreview';
import { ProblemSection } from '../components/landing/ProblemSection';
import { HowItWorksTeaser, PrivacyTeaser } from '../components/landing/Teasers';
import { fetchStats } from '../lib/api';
import type { Stats } from '../lib/types';

/**
 * Reading order is the argument: here is the thing, here is why it needs to
 * exist, here is how it works, here is what it gives you, here is why you can
 * hand it something private, now go use it.
 *
 * The how-it-works and privacy beats are teasers now. Both answers deserve
 * more room than a scroll-past section, and both are things a cautious person
 * goes looking for deliberately, so they live at /how-it-works and /privacy
 * where they can be read, linked and returned to.
 */
export function Landing() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void fetchStats().then(setStats);
  }, []);

  return (
    <div className="landing">
      <a className="skip" href="#main">
        Skip to content
      </a>

      <Nav />

      <main id="main">
        <Hero />
        <ProblemSection />
        <HowItWorksTeaser />
        <LiveDemoPreview />
        <PrivacyTeaser />
        <ClosingLine />
        <FinalCta />
      </main>

      <Footer stats={stats} />
    </div>
  );
}
