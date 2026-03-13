import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const SIZE_MAP = { sm: 20, md: 32, lg: 48 };

export function LoadingSpinner({ size = 'md', label = 'Loading...' }: LoadingSpinnerProps) {
  const px = SIZE_MAP[size];

  return (
    <div className={styles.container} role="status" aria-label={label}>
      <svg
        className={styles.spinner}
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className={styles.track} cx="12" cy="12" r="10" strokeWidth="3" />
        <circle
          className={styles.indicator}
          cx="12"
          cy="12"
          r="10"
          strokeWidth="3"
          strokeDasharray="31.4 31.4"
          strokeLinecap="round"
        />
      </svg>
      <span className={styles.srOnly}>{label}</span>
    </div>
  );
}
