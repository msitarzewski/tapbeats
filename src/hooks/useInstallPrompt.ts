import { useCallback, useEffect, useRef } from 'react';

import { useAppStore } from '@/state/appStore';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const installState = useAppStore((s) => s.installState);
  const setInstallState = useAppStore((s) => s.setInstallState);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setInstallState('available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed (display-mode: standalone)
    if (typeof window.matchMedia === 'function') {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setInstallState('installed');
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [setInstallState]);

  const promptInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (prompt === null) return;

    await prompt.prompt();
    const result = await prompt.userChoice;

    if (result.outcome === 'accepted') {
      setInstallState('installed');
    } else {
      setInstallState('dismissed');
    }

    deferredPromptRef.current = null;
  }, [setInstallState]);

  const dismiss = useCallback(() => {
    setInstallState('dismissed');
  }, [setInstallState]);

  return {
    installState,
    promptInstall,
    dismiss,
  };
}
