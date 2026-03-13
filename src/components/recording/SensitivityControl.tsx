import { useRecordingStore } from '@/state/recordingStore';
import type { SensitivityLevel } from '@/types/audio';

import styles from './SensitivityControl.module.css';

const LEVELS: SensitivityLevel[] = ['high', 'medium', 'low'];
const LABELS: Record<SensitivityLevel, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function SensitivityControl() {
  const sensitivity = useRecordingStore((s) => s._sensitivity);
  const setSensitivity = useRecordingStore((s) => s.setSensitivity);

  return (
    <div className={styles.container}>
      <span className={styles.label}>Sensitivity:</span>
      <div className={styles.segmented} role="radiogroup" aria-label="Detection sensitivity">
        {LEVELS.map((level) => (
          <button
            key={level}
            className={[styles.option, sensitivity === level ? styles.active : '']
              .filter(Boolean)
              .join(' ')}
            role="radio"
            aria-checked={sensitivity === level}
            onClick={() => {
              setSensitivity(level);
            }}
          >
            {LABELS[level]}
          </button>
        ))}
      </div>
    </div>
  );
}
