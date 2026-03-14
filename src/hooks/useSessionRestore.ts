import { useEffect, useState } from 'react';

import { PlaybackEngine } from '@/audio/playback/PlaybackEngine';
import { SessionManager } from '@/state/persistence/SessionManager';
import { useSessionStore } from '@/state/sessionStore';

const LAST_SESSION_KEY = 'tapbeats-last-session';

/** Persist the current session ID to localStorage whenever it changes. */
function trackCurrentSession(): () => void {
  return useSessionStore.subscribe((s) => {
    if (s.currentSessionId !== null) {
      localStorage.setItem(LAST_SESSION_KEY, s.currentSessionId);
    } else {
      localStorage.removeItem(LAST_SESSION_KEY);
    }
  });
}

/**
 * On app startup, restore the last active session from IndexedDB.
 * Also refreshes the session list for HomeScreen.
 */
export function useSessionRestore(): { restoring: boolean } {
  const [restoring, setRestoring] = useState(() => {
    return localStorage.getItem(LAST_SESSION_KEY) !== null;
  });

  useEffect(() => {
    const unsub = trackCurrentSession();
    const manager = new SessionManager();

    const restore = async () => {
      // Initialize PlaybackEngine eagerly so samples are ready for any screen
      void PlaybackEngine.getInstance().init();

      // Always refresh the session list
      await manager.refreshSessionList();
      await manager.refreshStorageInfo();

      const lastId = localStorage.getItem(LAST_SESSION_KEY);
      if (lastId !== null) {
        try {
          await manager.loadSession(lastId);
        } catch {
          // Session may have been deleted — clear stale reference
          localStorage.removeItem(LAST_SESSION_KEY);
        }
      }
      setRestoring(false);
    };

    void restore();

    return unsub;
  }, []);

  return { restoring };
}
