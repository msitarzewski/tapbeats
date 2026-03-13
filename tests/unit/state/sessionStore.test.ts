import { describe, it, expect, beforeEach } from 'vitest';

import { useSessionStore } from '@/state/sessionStore';

import { createMockSessionListItem } from '../../helpers/sessionFixtures';

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
  });

  describe('initial state', () => {
    it('has null currentSessionId', () => {
      expect(useSessionStore.getState().currentSessionId).toBeNull();
    });

    it('has default session name', () => {
      expect(useSessionStore.getState().currentSessionName).toBe('Untitled Beat');
    });

    it('has empty sessions list', () => {
      expect(useSessionStore.getState().sessions).toEqual([]);
    });

    it('has idle save status', () => {
      expect(useSessionStore.getState().saveStatus).toBe('idle');
    });
  });

  describe('setCurrentSession', () => {
    it('sets session id and name', () => {
      useSessionStore.getState().setCurrentSession('test-id', 'My Beat');
      expect(useSessionStore.getState().currentSessionId).toBe('test-id');
      expect(useSessionStore.getState().currentSessionName).toBe('My Beat');
    });

    it('resets save status to idle', () => {
      useSessionStore.getState().setSaveStatus('saved');
      useSessionStore.getState().setCurrentSession('new', 'New');
      expect(useSessionStore.getState().saveStatus).toBe('idle');
    });
  });

  describe('setCurrentSessionName', () => {
    it('updates only the name', () => {
      useSessionStore.getState().setCurrentSession('test-id', 'Original');
      useSessionStore.getState().setCurrentSessionName('Renamed');
      expect(useSessionStore.getState().currentSessionName).toBe('Renamed');
      expect(useSessionStore.getState().currentSessionId).toBe('test-id');
    });
  });

  describe('setSaveStatus', () => {
    it('updates save status', () => {
      useSessionStore.getState().setSaveStatus('saving');
      expect(useSessionStore.getState().saveStatus).toBe('saving');
    });

    it('can be set to each status', () => {
      const statuses = ['idle', 'saving', 'saved', 'error'] as const;
      for (const status of statuses) {
        useSessionStore.getState().setSaveStatus(status);
        expect(useSessionStore.getState().saveStatus).toBe(status);
      }
    });
  });

  describe('setSessions', () => {
    it('replaces session list', () => {
      const sessions = [createMockSessionListItem('1'), createMockSessionListItem('2')];
      useSessionStore.getState().setSessions(sessions);
      expect(useSessionStore.getState().sessions).toHaveLength(2);
    });
  });

  describe('updateStorageInfo', () => {
    it('updates storage metrics', () => {
      useSessionStore.getState().updateStorageInfo(1000000, 50000000);
      expect(useSessionStore.getState().storageUsed).toBe(1000000);
      expect(useSessionStore.getState().storageQuota).toBe(50000000);
    });
  });

  describe('reset', () => {
    it('resets to initial state', () => {
      useSessionStore.getState().setCurrentSession('test', 'Test');
      useSessionStore.getState().setSaveStatus('saved');
      useSessionStore.getState().reset();

      expect(useSessionStore.getState().currentSessionId).toBeNull();
      expect(useSessionStore.getState().saveStatus).toBe('idle');
    });
  });
});
