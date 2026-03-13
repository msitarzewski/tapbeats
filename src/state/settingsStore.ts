import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { SensitivityLevel } from '@/types/audio';
import type { GridResolution } from '@/types/quantization';
import type { ThemeMode, SettingsState } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'auto') {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return mode;
}

function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(mode);
  document.documentElement.setAttribute('data-theme', resolved);
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', resolved === 'dark' ? '#121214' : '#f8f8fa');
  }
}

interface SettingsStoreState extends SettingsState {
  setAudioInputDeviceId: (deviceId: string | null) => void;
  setDefaultBpm: (bpm: number) => void;
  setDefaultGridResolution: (resolution: GridResolution) => void;
  setTheme: (theme: ThemeMode) => void;
  setDefaultSensitivity: (sensitivity: SensitivityLevel) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  dismissTip: (tipId: string) => void;
  resetTips: () => void;
  reset: () => void;
}

/** Call from the app root to sync `auto` theme with OS preference changes. */
export function initThemeListener(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    const { theme } = useSettingsStore.getState();
    if (theme === 'auto') {
      applyTheme('auto');
    }
  };
  mq.addEventListener('change', handler);
  return () => {
    mq.removeEventListener('change', handler);
  };
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setAudioInputDeviceId: (deviceId) => {
        set({ audioInputDeviceId: deviceId });
      },

      setDefaultBpm: (bpm) => {
        set({ defaultBpm: Math.max(40, Math.min(240, bpm)) });
      },

      setDefaultGridResolution: (resolution) => {
        set({ defaultGridResolution: resolution });
      },

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setDefaultSensitivity: (sensitivity) => {
        set({ defaultSensitivity: sensitivity });
      },

      setHasSeenOnboarding: (seen) => {
        set({ hasSeenOnboarding: seen });
      },

      dismissTip: (tipId) => {
        set((state) => ({
          dismissedTips: state.dismissedTips.includes(tipId)
            ? state.dismissedTips
            : [...state.dismissedTips, tipId],
        }));
      },

      resetTips: () => {
        set({ dismissedTips: [] });
      },

      reset: () => {
        set({ ...DEFAULT_SETTINGS });
      },
    }),
    {
      name: 'tapbeats-settings',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    },
  ),
);
