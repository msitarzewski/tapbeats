import { useEffect, useState } from 'react';

import { registerServiceWorker, skipWaiting } from '@/utils/serviceWorkerRegistration';

export type SWStatus = 'pending' | 'registered' | 'update-available' | 'error';

export function useServiceWorker() {
  const [status, setStatus] = useState<SWStatus>('pending');

  useEffect(() => {
    if (import.meta.env.DEV) return;
    registerServiceWorker(setStatus);
  }, []);

  return {
    status,
    update: skipWaiting,
  };
}
