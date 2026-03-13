import { useEffect, useRef, useState } from 'react';

import { useRecordingStore } from '@/state/recordingStore';

import styles from './HitFlash.module.css';

export function HitFlash() {
  const hitCount = useRecordingStore((s) => s.hitCount);
  const [active, setActive] = useState(false);
  const prevHitRef = useRef(0);

  useEffect(() => {
    if (hitCount > prevHitRef.current && hitCount > 0) {
      setActive(true);
      const timer = setTimeout(() => {
        setActive(false);
      }, 250);
      prevHitRef.current = hitCount;
      return () => {
        clearTimeout(timer);
      };
    }
    prevHitRef.current = hitCount;
    return undefined;
  }, [hitCount]);

  const className = [styles.flash, active ? styles.flashActive : undefined]
    .filter(Boolean)
    .join(' ');

  return <div className={className} aria-hidden="true" />;
}
