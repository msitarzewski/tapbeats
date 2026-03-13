import { useEffect, useState } from 'react';

import styles from './Toast.module.css';

type ToastVariant = 'info' | 'success' | 'warning' | 'error';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onDismiss?: () => void;
}

export function Toast({ message, variant = 'info', duration = 3000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration, onDismiss]);

  if (!visible) return null;

  const variantClass = (styles as Record<string, string>)[variant] ?? '';

  return (
    <div className={`${styles.toast ?? ''} ${variantClass}`} role="status" aria-live="polite">
      <span className={styles.message}>{message}</span>
    </div>
  );
}
