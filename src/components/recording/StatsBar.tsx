import { useEffect, useRef, useState } from 'react';

import { useRecordingStore } from '@/state/recordingStore';

import styles from './StatsBar.module.css';

export function StatsBar() {
  const hitCount = useRecordingStore((s) => s.hitCount);
  const [bouncing, setBouncing] = useState(false);
  const prevHitRef = useRef(0);

  useEffect(() => {
    if (hitCount > prevHitRef.current) {
      setBouncing(true);
      const timer = setTimeout(() => {
        setBouncing(false);
      }, 300);
      prevHitRef.current = hitCount;
      return () => {
        clearTimeout(timer);
      };
    }
    prevHitRef.current = hitCount;
    return undefined;
  }, [hitCount]);

  const valueClass = [styles.value, bouncing ? styles.valueBounce : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.bar}>
      <div className={styles.stat}>
        <span className={styles.label}>Hits:</span>
        <span className={valueClass}>{hitCount}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.label}>BPM:</span>
        <span className={styles.value}>~-- (est.)</span>
      </div>
    </div>
  );
}
