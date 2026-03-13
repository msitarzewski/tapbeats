import { useEffect, useRef } from 'react';

import { SessionManager } from '@/state/persistence/SessionManager';
import { useSessionStore } from '@/state/sessionStore';

/**
 * Hook that manages auto-save lifecycle.
 * Subscribes to store changes and debounces saves to IndexedDB.
 */
export function useAutoSave(): SessionManager {
  const managerRef = useRef<SessionManager | null>(null);

  managerRef.current ??= new SessionManager();

  const currentSessionId = useSessionStore((s) => s.currentSessionId);

  useEffect(() => {
    const manager = managerRef.current;
    if (manager === null) return;

    if (currentSessionId !== null) {
      manager.startAutoSave();
    }

    return () => {
      manager.cancelAutoSave();
      manager.dispose();
    };
  }, [currentSessionId]);

  return managerRef.current;
}
