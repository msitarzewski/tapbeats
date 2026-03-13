import { describe, it, expect, beforeEach } from 'vitest';

import { useSettingsStore } from '@/state/settingsStore';
import { DEFAULT_SETTINGS } from '@/types/settings';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('matches DEFAULT_SETTINGS', () => {
      const state = useSettingsStore.getState();
      expect(state.audioInputDeviceId).toBe(DEFAULT_SETTINGS.audioInputDeviceId);
      expect(state.defaultBpm).toBe(DEFAULT_SETTINGS.defaultBpm);
      expect(state.defaultGridResolution).toBe(DEFAULT_SETTINGS.defaultGridResolution);
      expect(state.theme).toBe(DEFAULT_SETTINGS.theme);
      expect(state.defaultSensitivity).toBe(DEFAULT_SETTINGS.defaultSensitivity);
    });
  });

  describe('setAudioInputDeviceId', () => {
    it('sets device id', () => {
      useSettingsStore.getState().setAudioInputDeviceId('device-123');
      expect(useSettingsStore.getState().audioInputDeviceId).toBe('device-123');
    });

    it('clears device id with null', () => {
      useSettingsStore.getState().setAudioInputDeviceId('device-123');
      useSettingsStore.getState().setAudioInputDeviceId(null);
      expect(useSettingsStore.getState().audioInputDeviceId).toBeNull();
    });
  });

  describe('setDefaultBpm', () => {
    it('sets BPM within range', () => {
      useSettingsStore.getState().setDefaultBpm(140);
      expect(useSettingsStore.getState().defaultBpm).toBe(140);
    });

    it('clamps BPM to min 40', () => {
      useSettingsStore.getState().setDefaultBpm(10);
      expect(useSettingsStore.getState().defaultBpm).toBe(40);
    });

    it('clamps BPM to max 240', () => {
      useSettingsStore.getState().setDefaultBpm(300);
      expect(useSettingsStore.getState().defaultBpm).toBe(240);
    });
  });

  describe('setDefaultGridResolution', () => {
    it('sets grid resolution', () => {
      useSettingsStore.getState().setDefaultGridResolution('1/16');
      expect(useSettingsStore.getState().defaultGridResolution).toBe('1/16');
    });
  });

  describe('setTheme', () => {
    it('sets theme', () => {
      useSettingsStore.getState().setTheme('light');
      expect(useSettingsStore.getState().theme).toBe('light');
    });

    it('supports all theme values', () => {
      const themes = ['dark', 'light', 'auto'] as const;
      for (const t of themes) {
        useSettingsStore.getState().setTheme(t);
        expect(useSettingsStore.getState().theme).toBe(t);
      }
    });
  });

  describe('setDefaultSensitivity', () => {
    it('sets sensitivity', () => {
      useSettingsStore.getState().setDefaultSensitivity('high');
      expect(useSettingsStore.getState().defaultSensitivity).toBe('high');
    });
  });

  describe('reset', () => {
    it('resets to defaults', () => {
      useSettingsStore.getState().setDefaultBpm(200);
      useSettingsStore.getState().setTheme('light');
      useSettingsStore.getState().reset();

      expect(useSettingsStore.getState().defaultBpm).toBe(120);
      expect(useSettingsStore.getState().theme).toBe('dark');
    });
  });

  describe('persistence', () => {
    it('persists to localStorage with correct key', () => {
      useSettingsStore.getState().setDefaultBpm(160);
      const stored = localStorage.getItem('tapbeats-settings');
      expect(stored).not.toBeNull();
      if (stored !== null) {
        const parsed = JSON.parse(stored) as { state: { defaultBpm: number } };
        expect(parsed.state.defaultBpm).toBe(160);
      }
    });
  });
});
