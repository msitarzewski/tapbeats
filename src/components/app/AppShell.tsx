import styles from './AppShell.module.css';

import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>
      <main id="main-content" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
