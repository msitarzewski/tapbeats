import { NavLink, useLocation } from 'react-router-dom';

import { Icon } from '@/components/shared/Icon';

import styles from './BottomNav.module.css';

const TABS = [
  { to: '/', label: 'Home', icon: 'home' as const },
  { to: '/record', label: 'Record', icon: 'mic' as const },
  { to: '/review', label: 'Review', icon: 'layers' as const },
  { to: '/timeline', label: 'Timeline', icon: 'music' as const },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const isTimeline = pathname === '/timeline';

  return (
    <nav className={styles.nav} aria-label="Main navigation" data-hidden={isTimeline}>
      {TABS.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')
          }
        >
          <Icon name={icon} size={20} />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
