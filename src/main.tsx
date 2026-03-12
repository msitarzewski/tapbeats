import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/styles/global.css';
import { App } from '@/components/app/App';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
