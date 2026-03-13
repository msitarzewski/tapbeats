import { useCallback, useEffect } from 'react';

import { useAppStore } from '@/state/appStore';
import type { MicPermissionState } from '@/types/audio';

export function useMicPermission() {
  const micPermission = useAppStore((s) => s.micPermission);
  const setMicPermission = useAppStore((s) => s.setMicPermission);

  // Query current permission state on mount
  useEffect(() => {
    void navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((result) => {
        const mapped = mapPermissionState(result.state);
        setMicPermission(mapped);

        result.addEventListener('change', () => {
          setMicPermission(mapPermissionState(result.state));
        });
      })
      .catch(() => {
        // permissions.query not supported for microphone in some browsers
        setMicPermission('unknown');
      });
  }, [setMicPermission]);

  const requestMicPermission = useCallback(async (): Promise<MicPermissionState> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop all tracks immediately - we just needed the permission
      for (const track of stream.getTracks()) {
        track.stop();
      }
      setMicPermission('granted');
      return 'granted';
    } catch {
      setMicPermission('denied');
      return 'denied';
    }
  }, [setMicPermission]);

  return { micPermission, requestMicPermission };
}

function mapPermissionState(state: PermissionState): MicPermissionState {
  switch (state) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    case 'prompt':
      return 'prompt';
    default:
      return 'unknown';
  }
}
