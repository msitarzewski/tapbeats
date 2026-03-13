import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/styles/global.css';
import { App } from '@/components/app/App';
import { registerServiceWorker } from '@/utils/serviceWorkerRegistration';

// Expose Zustand stores on window in dev mode for Chrome DevTools testing
if (import.meta.env.DEV) {
  const w = window as Record<string, unknown>;
  void import('./state/recordingStore').then((m) => {
    w.__recordingStore = m.useRecordingStore;
  });
  void import('./state/clusterStore').then((m) => {
    w.__clusterStore = m.useClusterStore;
  });
  void import('./state/quantizationStore').then((m) => {
    w.__quantizationStore = m.useQuantizationStore;
  });
  void import('./state/timelineStore').then((m) => {
    w.__timelineStore = m.useTimelineStore;
  });
  void import('./state/sessionStore').then((m) => {
    w.__sessionStore = m.useSessionStore;
  });
  void import('./state/appStore').then((m) => {
    w.__appStore = m.useAppStore;
  });
}

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
