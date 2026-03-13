import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_NAMES: Record<string, string> = {
  '/': 'Home',
  '/record': 'Record',
  '/review': 'Review',
  '/timeline': 'Timeline',
  '/settings': 'Settings',
};

export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const name = ROUTE_NAMES[pathname] ?? 'Page';
    setAnnouncement(`Navigated to ${name}`);
  }, [pathname]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {announcement}
    </div>
  );
}
