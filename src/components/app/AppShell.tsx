import { useLocation } from 'react-router-dom';

import { BottomNav } from '@/components/navigation/BottomNav';
import { RouteAnnouncer } from '@/components/navigation/RouteAnnouncer';

import styles from './AppShell.module.css';

import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation();
  const isTimeline = pathname === '/timeline';

  return (
    <div className={styles.shell} data-route={isTimeline ? 'timeline' : undefined}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>
      <BottomNav />
      <main id="main-content" className={styles.main}>
        {children}
      </main>
      <RouteAnnouncer />
    </div>
  );
}
