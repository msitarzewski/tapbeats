import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PlaybackEngine } from '@/audio/playback/PlaybackEngine';
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay';
import { Button } from '@/components/shared/Button';
import { Icon } from '@/components/shared/Icon';
import { Modal } from '@/components/shared/Modal';
import { useClusterStore } from '@/state/clusterStore';
import { SessionManager } from '@/state/persistence/SessionManager';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useRecordingStore } from '@/state/recordingStore';
import { useSessionStore } from '@/state/sessionStore';
import { useSettingsStore } from '@/state/settingsStore';
import { useTimelineStore } from '@/state/timelineStore';

import styles from './HomeScreen.module.css';
import { InstallBanner } from './InstallBanner';
import { RecordButton } from './RecordButton';
import { SessionCard } from './SessionCard';

export function HomeScreen() {
  const navigate = useNavigate();
  const sessions = useSessionStore((s) => s.sessions);
  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleNewSession = useCallback(() => {
    useRecordingStore.getState().reset();
    useClusterStore.getState().reset();
    useQuantizationStore.getState().reset();
    useTimelineStore.getState().reset();
    useSessionStore.getState().setCurrentSession(null, 'Untitled Beat');
    void PlaybackEngine.getInstance().warmUp();
    navigate('/record');
  }, [navigate]);

  useEffect(() => {
    const manager = new SessionManager();
    void manager.refreshSessionList();
    void manager.refreshStorageInfo();
  }, []);

  const handleLoadSession = (id: string) => {
    const manager = new SessionManager();
    void manager.loadSession(id).then(() => {
      navigate('/timeline');
    });
  };

  const handleDeleteSession = () => {
    if (deleteId === null) return;
    const manager = new SessionManager();
    void manager.deleteSession(deleteId).then(() => {
      setDeleteId(null);
    });
  };

  const deleteSession = sessions.find((s) => s.id === deleteId);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>TapBeats</h1>
      <p className={styles.subtitle}>Tap any surface to create a beat</p>

      <div className={styles.actions}>
        {sessions.length > 0 ? (
          <Button variant="primary" onClick={handleNewSession}>
            <Icon name="plus" size={18} />
            New Session
          </Button>
        ) : (
          <RecordButton />
        )}
        <button
          className={styles.settingsBtn}
          onClick={() => {
            navigate('/settings');
          }}
          aria-label="Settings"
        >
          <Icon name="settings" size={20} />
        </button>
      </div>

      {sessions.length > 0 && (
        <div className={styles.sessionsSection}>
          <h2 className={styles.sessionsTitle}>Recent Sessions</h2>
          <div className={styles.sessionList}>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => {
                  handleLoadSession(session.id);
                }}
                onDelete={() => {
                  setDeleteId(session.id);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className={styles.emptyState}>
          <Icon name="folder" size={48} />
          <p>No sessions yet</p>
          <p className={styles.emptyHint}>Record a beat to get started</p>
        </div>
      )}

      <Modal
        isOpen={deleteId !== null}
        onClose={() => {
          setDeleteId(null);
        }}
        title="Delete Session?"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          Are you sure you want to delete &ldquo;{deleteSession?.name ?? 'this session'}&rdquo;?
          This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteId(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDeleteSession}>
            Delete
          </Button>
        </div>
      </Modal>

      <InstallBanner />

      {!hasSeenOnboarding && <OnboardingOverlay />}
    </div>
  );
}
