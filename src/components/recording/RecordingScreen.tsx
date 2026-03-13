import { useCallback, useState } from 'react';

import { useAudioCapture } from '@/hooks/useAudioCapture';

import { HitFlash } from './HitFlash';
import { LiveWaveform } from './LiveWaveform';
import { MicPermissionOverlay } from './MicPermissionOverlay';
import { PermissionDenied } from './PermissionDenied';
import { ProcessingOverlay } from './ProcessingOverlay';
import { RecordingHeader } from './RecordingHeader';
import styles from './RecordingScreen.module.css';
import { StatsBar } from './StatsBar';
import { StopButton } from './StopButton';

export function RecordingScreen() {
  const { status, error, startRecording, stopRecording } = useAudioCapture();
  const [showPrePrompt, setShowPrePrompt] = useState(true);

  const handleStop = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  const handleRetry = useCallback(() => {
    void startRecording();
  }, [startRecording]);

  const handlePermissionConfirm = useCallback(() => {
    setShowPrePrompt(false);
    void startRecording();
  }, [startRecording]);

  if (error !== null && error.code === 'PERMISSION_DENIED') {
    return <PermissionDenied onRetry={handleRetry} />;
  }

  if (showPrePrompt && status === 'idle') {
    return (
      <div className={styles.screen}>
        <MicPermissionOverlay onConfirm={handlePermissionConfirm} />
      </div>
    );
  }

  if (status === 'requesting_permission') {
    return (
      <div className={styles.screen}>
        <div className={styles.permissionWaiting}>Waiting for microphone permission...</div>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className={styles.screen}>
        <ProcessingOverlay />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <RecordingHeader onStop={handleStop} />

      <div className={styles.content}>
        <div className={styles.middle}>
          <LiveWaveform />
          <StatsBar />
        </div>

        <div className={styles.bottom}>
          <StopButton onStop={handleStop} />
        </div>
      </div>

      <HitFlash />

      {/* ARIA live region for screen reader announcements */}
      <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {status === 'recording' ? 'Recording in progress' : ''}
        {status === 'complete' ? 'Recording complete' : ''}
      </div>
    </div>
  );
}
