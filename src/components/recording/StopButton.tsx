import { useEffect, useState } from 'react';

import { Icon } from '@/components/shared/Icon';

import styles from './StopButton.module.css';

interface StopButtonProps {
  readonly onStop: () => void;
}

export function StopButton({ onStop }: StopButtonProps) {
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHintVisible(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const hintClass = [styles.hint, hintVisible ? undefined : styles.hintHidden]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      <button className={styles.button} onClick={onStop} aria-label="Stop recording" type="button">
        <Icon name="square" size={20} />
      </button>
      <span className={hintClass} aria-hidden="true">
        Tap any surface
      </span>
    </div>
  );
}
