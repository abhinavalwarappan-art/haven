import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Check } from './routes/Check';
import { HowItWorks } from './routes/HowItWorks';
import { Landing } from './routes/Landing';
import { Privacy } from './routes/Privacy';
import { PrivacyPolicy } from './routes/PrivacyPolicy';
import { Terms } from './routes/Terms';

/**
 * The product, the page that sells it, and the pages that answer the two
 * questions a cautious person asks before pasting anything: how does this
 * actually work, and what happens to what I paste.
 *
 * `/` has to earn the paste. Someone arrives frightened, holding a message they
 * already suspect, and we are asking them to hand it to a website they have
 * never heard of. The landing page is where that trust gets built; these pages
 * are where it gets substantiated, at whatever length the reader wants.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/check" element={<Check />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        {/* Anything else lands on the tool rather than a dead end. */}
        <Route path="*" element={<Check />} />
      </Routes>
    </BrowserRouter>
  );
}
