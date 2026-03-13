import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { isBrowserSupported } from '@/utils/featureDetection';

import { AppShell } from './AppShell';
import { ErrorBoundary } from './ErrorBoundary';
import { HomeScreen } from './HomeScreen';
import { UnsupportedBrowser } from './UnsupportedBrowser';
import { UpdateToast } from './UpdateToast';

const RecordingScreen = lazy(() =>
  import('../recording/RecordingScreen').then((m) => ({ default: m.RecordingScreen })),
);
const ClusterScreen = lazy(() =>
  import('../clustering/ClusterScreen').then((m) => ({ default: m.ClusterScreen })),
);
const TimelineScreen = lazy(() =>
  import('../timeline/TimelineScreen').then((m) => ({ default: m.TimelineScreen })),
);
const SettingsScreen = lazy(() =>
  import('../session/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
);

function RouteSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-16)' }}>
      <LoadingSpinner size="lg" label="Loading..." />
    </div>
  );
}

export function App() {
  const { status, update } = useServiceWorker();

  if (!isBrowserSupported()) {
    return <UnsupportedBrowser />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppShell>
          <Suspense fallback={<RouteSpinner />}>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/record" element={<RecordingScreen />} />
              <Route path="/review" element={<ClusterScreen />} />
              <Route path="/timeline" element={<TimelineScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
            </Routes>
          </Suspense>
        </AppShell>
        <UpdateToast status={status} onUpdate={update} />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
