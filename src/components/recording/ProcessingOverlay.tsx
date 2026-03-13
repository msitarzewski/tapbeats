import styles from './ProcessingOverlay.module.css';

export function ProcessingOverlay() {
  return (
    <div className={styles.overlay} role="alert" aria-live="assertive">
      <p className={styles.text}>Analyzing taps...</p>
    </div>
  );
}
