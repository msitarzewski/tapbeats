import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAudioCapture } from '@/hooks/useAudioCapture';
import { useProcessing } from '@/hooks/useProcessing';

import { HitFlash } from './HitFlash';
import { LiveWaveform } from './LiveWaveform';
import { MicPermissionOverlay } from './MicPermissionOverlay';
import { PermissionDenied } from './PermissionDenied';
import { ProcessingOverlay } from './ProcessingOverlay';
import { ProtoTimeline } from './ProtoTimeline';
import { RecordingHeader } from './RecordingHeader';
import styles from './RecordingScreen.module.css';
import { SensitivityControl } from './SensitivityControl';
import { StatsBar } from './StatsBar';
import { StopButton } from './StopButton';

export function RecordingScreen() {
  const { status, error, startRecording, stopRecording } = useAudioCapture();
  const [showPrePrompt, setShowPrePrompt] = useState(true);
  const navigate = useNavigate();

  useProcessing(44100);

  // Navigate away when processing completes
  useEffect(() => {
    if (status === 'complete') {
      navigate('/review');
    }
  }, [status, navigate]);

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
          <ProtoTimeline />
          <StatsBar />
          <SensitivityControl />
        </div>

        <div className={styles.bottom}>
          <StopButton onStop={handleStop} />
        </div>
      </div>

      <HitFlash />

      {/* ARIA live region for screen reader announcements */}
      <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {status === 'recording' ? 'Recording in progress' : ''}
      </div>
    </div>
  );
}
