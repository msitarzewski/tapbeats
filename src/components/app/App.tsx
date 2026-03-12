import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { ClusterScreen } from '../clustering/ClusterScreen';
import { RecordingScreen } from '../recording/RecordingScreen';
import { SettingsScreen } from '../session/SettingsScreen';
import { TimelineScreen } from '../timeline/TimelineScreen';

import { AppShell } from './AppShell';
import { ErrorBoundary } from './ErrorBoundary';
import { HomeScreen } from './HomeScreen';

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/record" element={<RecordingScreen />} />
            <Route path="/review" element={<ClusterScreen />} />
            <Route path="/timeline" element={<TimelineScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
