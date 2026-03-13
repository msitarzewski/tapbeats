import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { SensitivityLevel } from '@/types/audio';
import type { GridResolution } from '@/types/quantization';
import type { ThemeMode, SettingsState } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

interface SettingsStoreState extends SettingsState {
  setAudioInputDeviceId: (deviceId: string | null) => void;
  setDefaultBpm: (bpm: number) => void;
  setDefaultGridResolution: (resolution: GridResolution) => void;
  setTheme: (theme: ThemeMode) => void;
  setDefaultSensitivity: (sensitivity: SensitivityLevel) => void;
  reset: () => void;
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
      },

      setDefaultSensitivity: (sensitivity) => {
        set({ defaultSensitivity: sensitivity });
      },

      reset: () => {
        set({ ...DEFAULT_SETTINGS });
      },
    }),
    {
      name: 'tapbeats-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
