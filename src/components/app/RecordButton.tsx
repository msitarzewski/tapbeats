import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { PlaybackEngine } from '@/audio/playback/PlaybackEngine';
import { Icon } from '@/components/shared/Icon';

import styles from './RecordButton.module.css';

export function RecordButton() {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    // Warm up AudioContext within user gesture (required for iOS Safari)
    void PlaybackEngine.getInstance().warmUp();
    navigate('/record');
  }, [navigate]);

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.button}
        onClick={handleClick}
        aria-label="Start recording"
        type="button"
      >
        <Icon name="record" size={32} />
      </button>
    </div>
  );
}
