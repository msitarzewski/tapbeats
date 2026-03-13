import styles from './HomeScreen.module.css';
import { RecordButton } from './RecordButton';

export function HomeScreen() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>TapBeats</h1>
      <p className={styles.subtitle}>Tap any surface to create a beat</p>
      <RecordButton />
    </div>
  );
}
