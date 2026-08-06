import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Check } from './routes/Check';
import { Landing } from './routes/Landing';

/**
 * Two routes: the page that explains the product, and the product.
 *
 * `/` has to earn the paste. Someone arrives frightened, holding a message they
 * already suspect, and we are asking them to hand it to a website they have
 * never heard of. The landing page is where that trust gets built.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/check" element={<Check />} />
        {/* Anything else lands on the tool rather than a dead end. */}
        <Route path="*" element={<Check />} />
      </Routes>
    </BrowserRouter>
  );
}
