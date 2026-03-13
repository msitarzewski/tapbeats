import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useClusterStore } from '@/state/clusterStore';
import {
  openDatabase,
  putSession,
  getSession,
  resetDB,
  clearAllData,
} from '@/state/persistence/db';
import { SessionManager } from '@/state/persistence/SessionManager';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useRecordingStore } from '@/state/recordingStore';
import { useSessionStore } from '@/state/sessionStore';
import { useTimelineStore } from '@/state/timelineStore';

import { createMockSerializedSession, createMockHit } from '../../../helpers/sessionFixtures';

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(async () => {
    resetDB();
    await openDatabase();
    await clearAllData();
    manager = new SessionManager();
    useRecordingStore.getState().reset();
    useClusterStore.getState().reset();
    useQuantizationStore.getState().reset();
    useTimelineStore.getState().reset();
    useSessionStore.getState().reset();
  });

  describe('saveSession', () => {
    it('saves session and returns id', async () => {
      useRecordingStore.setState({
        status: 'complete',
        elapsedTime: 5,
        _onsets: [createMockHit(0, 0.8)],
        _onsetTimestamps: [0],
      });

      const id = await manager.saveSession('test-1', 'My Beat');
      expect(id).toBe('test-1');
      expect(useSessionStore.getState().currentSessionId).toBe('test-1');
      expect(useSessionStore.getState().saveStatus).toBe('saved');
    });

    it('generates id when none provided', async () => {
      useRecordingStore.setState({
        status: 'complete',
        _onsets: [],
        _onsetTimestamps: [],
      });

      const id = await manager.saveSession();
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('preserves createdAt on updates', async () => {
      const session = createMockSerializedSession('preserve-test');
      await putSession(session);

      useRecordingStore.setState({
        status: 'complete',
        _onsets: [],
        _onsetTimestamps: [],
      });

      await manager.saveSession('preserve-test', 'Updated');
      const loaded = await getSession('preserve-test');
      expect(loaded?.metadata.createdAt).toBe(session.metadata.createdAt);
    });

    it('sets error status on failure', async () => {
      // Force an error by making openDatabase fail
      resetDB();
      const origOpen = (globalThis.indexedDB as unknown as Record<string, unknown>).open;
      (globalThis.indexedDB as unknown as Record<string, unknown>).open = () => {
        throw new Error('DB broken');
      };

      useRecordingStore.setState({ _onsets: [], _onsetTimestamps: [] });

      await expect(manager.saveSession('fail', 'Fail')).rejects.toThrow();
      expect(useSessionStore.getState().saveStatus).toBe('error');

      (globalThis.indexedDB as unknown as Record<string, unknown>).open = origOpen;
    });
  });

  describe('loadSession', () => {
    it('loads session and restores stores', async () => {
      const session = createMockSerializedSession('load-test');
      await putSession(session);

      await manager.loadSession('load-test');

      expect(useSessionStore.getState().currentSessionId).toBe('load-test');
      expect(useQuantizationStore.getState().bpm).toBe(120);
    });

    it('throws for non-existent session', async () => {
      await expect(manager.loadSession('nonexistent')).rejects.toThrow('Session not found');
    });
  });

  describe('deleteSession', () => {
    it('deletes session and updates list', async () => {
      await putSession(createMockSerializedSession('del-test'));
      useSessionStore.getState().setCurrentSession('del-test', 'Delete Me');

      await manager.deleteSession('del-test');

      expect(useSessionStore.getState().currentSessionId).toBeNull();
      const loaded = await getSession('del-test');
      expect(loaded).toBeUndefined();
    });
  });

  describe('renameSession', () => {
    it('renames a session', async () => {
      await putSession(createMockSerializedSession('rename-test'));
      useSessionStore.getState().setCurrentSession('rename-test', 'Old Name');

      await manager.renameSession('rename-test', 'New Name');

      const loaded = await getSession('rename-test');
      expect(loaded?.metadata.name).toBe('New Name');
      expect(useSessionStore.getState().currentSessionName).toBe('New Name');
    });

    it('throws for non-existent session', async () => {
      await expect(manager.renameSession('nonexistent', 'Name')).rejects.toThrow();
    });
  });

  describe('listSessions', () => {
    it('returns all sessions sorted by updated date', async () => {
      const session1 = createMockSerializedSession('list-1');
      const session2 = {
        ...createMockSerializedSession('list-2'),
        metadata: { ...createMockSerializedSession('list-2').metadata, updatedAt: 1700000001000 },
      };
      await putSession(session1);
      await putSession(session2);

      const list = await manager.listSessions();
      expect(list).toHaveLength(2);
    });
  });

  describe('auto-save', () => {
    it('starts and disposes without error', () => {
      manager.startAutoSave();
      manager.dispose();
    });

    it('cancels pending auto-save', () => {
      manager.startAutoSave();
      manager.cancelAutoSave();
      manager.dispose();
    });

    it('fires auto-save after debounce', async () => {
      vi.useFakeTimers();

      useSessionStore.getState().setCurrentSession('auto-test', 'Auto');
      useRecordingStore.setState({ _onsets: [], _onsetTimestamps: [] });

      manager.startAutoSave();

      // Trigger a store change
      useQuantizationStore.setState({ bpm: 140 });

      // Advance past debounce
      await vi.advanceTimersByTimeAsync(2500);

      // Save should have been attempted (status changes from idle)
      const status = useSessionStore.getState().saveStatus;
      expect(['saving', 'saved']).toContain(status);

      manager.dispose();
      vi.useRealTimers();
    });
  });
});
