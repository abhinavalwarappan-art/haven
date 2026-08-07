import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';

import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/compose.css';
import './styles/thinking.css';
import './styles/verdict.css';
import './styles/landing.css';
import './styles/pages.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing from index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
