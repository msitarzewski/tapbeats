import { Button } from '@/components/shared/Button';
import type { SWStatus } from '@/hooks/useServiceWorker';

import styles from './UpdateToast.module.css';

interface UpdateToastProps {
  status: SWStatus;
  onUpdate: () => void;
}

export function UpdateToast({ status, onUpdate }: UpdateToastProps) {
  if (status !== 'update-available') return null;

  return (
    <div className={styles.toast} role="alert">
      <span className={styles.message}>A new version is available</span>
      <Button variant="primary" size="sm" onClick={onUpdate}>
        Reload
      </Button>
    </div>
  );
}
