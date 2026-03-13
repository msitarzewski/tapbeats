import type { SensitivityLevel } from './audio';
import type { GridResolution } from './quantization';

export type ThemeMode = 'dark' | 'light' | 'auto';

export interface SettingsState {
  readonly audioInputDeviceId: string | null;
  readonly defaultBpm: number; // 40-240
  readonly defaultGridResolution: GridResolution;
  readonly theme: ThemeMode;
  readonly defaultSensitivity: SensitivityLevel;
}

export const DEFAULT_SETTINGS: SettingsState = {
  audioInputDeviceId: null,
  defaultBpm: 120,
  defaultGridResolution: '1/8',
  theme: 'dark',
  defaultSensitivity: 'medium',
};
