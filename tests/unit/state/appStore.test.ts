import { describe, it, expect, beforeEach } from 'vitest';

import { useAppStore } from '@/state/appStore';

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.getState().setMicPermission('unknown');
  });

  describe('initial state', () => {
    it('has unknown micPermission', () => {
      expect(useAppStore.getState().micPermission).toBe('unknown');
    });
  });

  describe('setMicPermission', () => {
    it('updates to granted', () => {
      useAppStore.getState().setMicPermission('granted');
      expect(useAppStore.getState().micPermission).toBe('granted');
    });

    it('updates to denied', () => {
      useAppStore.getState().setMicPermission('denied');
      expect(useAppStore.getState().micPermission).toBe('denied');
    });

    it('updates to prompt', () => {
      useAppStore.getState().setMicPermission('prompt');
      expect(useAppStore.getState().micPermission).toBe('prompt');
    });

    it('can reset back to unknown', () => {
      useAppStore.getState().setMicPermission('granted');
      useAppStore.getState().setMicPermission('unknown');
      expect(useAppStore.getState().micPermission).toBe('unknown');
    });
  });
});
