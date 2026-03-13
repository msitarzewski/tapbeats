import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '@/components/shared/Icon';
import { useRecordingTimer } from '@/hooks/useRecordingTimer';

import styles from './RecordingHeader.module.css';

interface RecordingHeaderProps {
  readonly onStop: () => void;
}

export function RecordingHeader({ onStop }: RecordingHeaderProps) {
  const navigate = useNavigate();
  const { displayTime } = useRecordingTimer();

  const handleBack = useCallback(() => {
    onStop();
    navigate('/');
  }, [onStop, navigate]);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          className={styles.backButton}
          onClick={handleBack}
          aria-label="Stop recording and go back"
          type="button"
        >
          <Icon name="arrow-left" size={20} />
        </button>
        <div className={styles.titleGroup}>
          <div className={styles.recordingDot} aria-hidden="true" />
          <span className={styles.titleText}>Recording</span>
        </div>
      </div>

      <span className={styles.timer} aria-label={`Elapsed time: ${displayTime}`}>
        {displayTime}
      </span>

      <button className={styles.helpButton} aria-label="Help" type="button">
        <Icon name="help-circle" size={20} />
      </button>
    </header>
  );
}
