import { Icon } from '@/components/shared/Icon';
import { getMissingFeatures } from '@/utils/featureDetection';

import styles from './UnsupportedBrowser.module.css';

export function UnsupportedBrowser() {
  const missing = getMissingFeatures();

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <Icon name="x" size={48} />
      </div>
      <h1 className={styles.title}>Browser Not Supported</h1>
      <p className={styles.message}>
        TapBeats requires a modern browser with the following features:
      </p>
      <ul className={styles.list}>
        {missing.map((feature) => (
          <li key={feature} className={styles.listItem}>
            {feature}
          </li>
        ))}
      </ul>
      <p className={styles.hint}>
        Try using the latest version of Chrome, Firefox, Edge, or Safari.
      </p>
    </div>
  );
}
