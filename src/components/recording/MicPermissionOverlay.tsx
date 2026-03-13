import { Button } from '@/components/shared/Button';
import { Icon } from '@/components/shared/Icon';

import styles from './MicPermissionOverlay.module.css';

interface MicPermissionOverlayProps {
  readonly onConfirm: () => void;
}

export function MicPermissionOverlay({ onConfirm }: MicPermissionOverlayProps) {
  return (
    <div className={styles.backdrop}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-label="Microphone permission"
      >
        <Icon name="mic" size={48} className={styles.icon} />
        <p className={styles.message}>TapBeats needs microphone access to detect your taps</p>
        <div className={styles.action}>
          <Button variant="primary" size="lg" onClick={onConfirm}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
