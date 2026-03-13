import { Button } from '@/components/shared/Button';
import { Icon } from '@/components/shared/Icon';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

import styles from './InstallBanner.module.css';

export function InstallBanner() {
  const { installState, promptInstall, dismiss } = useInstallPrompt();

  if (installState !== 'available') return null;

  return (
    <div className={styles.banner} role="complementary" aria-label="Install app">
      <div className={styles.content}>
        <Icon name="download" size={20} />
        <span className={styles.text}>Install TapBeats for offline use</span>
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={dismiss}>
          Not now
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            void promptInstall();
          }}
        >
          Install
        </Button>
      </div>
    </div>
  );
}
