type SWStatus = 'pending' | 'registered' | 'update-available' | 'error';
type StatusCallback = (status: SWStatus) => void;

export function registerServiceWorker(onStatus?: StatusCallback): void {
  if (!('serviceWorker' in navigator)) {
    onStatus?.('error');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        onStatus?.('registered');

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker === null) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              onStatus?.('update-available');
            }
          });
        });
      })
      .catch(() => {
        onStatus?.('error');
      });
  });

  // Reload on controller change (new SW activated)
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

export function skipWaiting(): void {
  navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
}
