import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/shared/Button';
import { Icon } from '@/components/shared/Icon';

import styles from './PermissionDenied.module.css';

interface PermissionDeniedProps {
  readonly onRetry: () => void;
}

export function PermissionDenied({ onRetry }: PermissionDeniedProps) {
  const navigate = useNavigate();

  const handleGoBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className={styles.container}>
      <Icon name="mic-off" size={56} className={styles.icon} />
      <h2 className={styles.heading}>Microphone Access Required</h2>
      <p className={styles.instructions}>
        TapBeats needs microphone access to listen for your taps. Please allow microphone access in
        your browser settings and try again.
      </p>
      <div className={styles.actions}>
        <Button variant="primary" size="lg" onClick={onRetry}>
          Try Again
        </Button>
        <Button variant="ghost" size="lg" onClick={handleGoBack}>
          Go Back
        </Button>
      </div>
    </div>
  );
}
