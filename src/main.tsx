import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/styles/global.css';
import { App } from '@/components/app/App';
import { registerServiceWorker } from '@/utils/serviceWorkerRegistration';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker in production
if (!import.meta.env.DEV) {
  registerServiceWorker();
}
