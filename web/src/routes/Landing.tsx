import { FinalCta } from '../components/landing/FinalCta';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { LiveDemoPreview } from '../components/landing/LiveDemoPreview';
import { Nav } from '../components/landing/Nav';
import { ProblemSection } from '../components/landing/ProblemSection';
import { TrustSection } from '../components/landing/TrustSection';

/**
 * Reading order is the argument: here is the thing, here is why it needs to
 * exist, here is how it works, here is what it gives you, here is why you can
 * hand it something private, now go use it.
 */
export function Landing() {
  return (
    <div className="landing">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="grain" aria-hidden="true" />

      <Nav />

      <main id="main">
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <LiveDemoPreview />
        <TrustSection />
        <FinalCta />
      </main>

      <footer className="landing__footer">
        <div className="landing__footer-inner">
          <p className="landing__footer-mark">
            Is this real<span className="nav__q">?</span>
          </p>
          <p className="landing__footer-note">
            Built for NextGen Innovation 2026 · Cybersecurity &amp; Digital
            Trust. Classification runs on Google Gemini behind a deterministic
            rules layer. Built with AI assistance, disclosed in full in the
            repository.
          </p>
        </div>
      </footer>
    </div>
  );
}
