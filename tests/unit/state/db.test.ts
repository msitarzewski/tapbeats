import { describe, it, expect, beforeEach } from 'vitest';

import {
  openDatabase,
  resetDB,
  putSession,
  getSession,
  deleteSession,
  listSessionMetadata,
  putAudioBlobs,
  getAudioBlobsBySession,
  deleteAudioBlobsBySession,
  clearAllData,
} from '@/state/persistence/db';

import { createMockSerializedSession, createMockAudioBlob } from '../../helpers/sessionFixtures';

describe('IndexedDB wrapper', () => {
  beforeEach(async () => {
    resetDB();
    await openDatabase();
    await clearAllData();
  });

  describe('openDatabase', () => {
    it('opens and returns a database', async () => {
      resetDB();
      const db = await openDatabase();
      expect(db).toBeDefined();
      expect(db.name).toBe('tapbeats');
    });

    it('returns same instance on second call', async () => {
      const db1 = await openDatabase();
      const db2 = await openDatabase();
      expect(db1).toBe(db2);
    });
  });

  describe('putSession / getSession', () => {
    it('stores and retrieves a session', async () => {
      const session = createMockSerializedSession('db-test-1');
      await putSession(session);

      const loaded = await getSession('db-test-1');
      expect(loaded).toBeDefined();
      expect(loaded?.id).toBe('db-test-1');
      expect(loaded?.metadata.name).toBe('Test Beat');
    });

    it('returns undefined for missing session', async () => {
      const loaded = await getSession('nonexistent');
      expect(loaded).toBeUndefined();
    });

    it('overwrites existing session', async () => {
      const session = createMockSerializedSession('db-test-2');
      await putSession(session);

      const updated = {
        ...session,
        metadata: { ...session.metadata, name: 'Updated' },
      };
      await putSession(updated);

      const loaded = await getSession('db-test-2');
      expect(loaded?.metadata.name).toBe('Updated');
    });
  });

  describe('deleteSession', () => {
    it('removes a session', async () => {
      await putSession(createMockSerializedSession('del-1'));
      await deleteSession('del-1');
      const loaded = await getSession('del-1');
      expect(loaded).toBeUndefined();
    });

    it('does not throw for missing session', async () => {
      await expect(deleteSession('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('listSessionMetadata', () => {
    it('returns empty array when no sessions', async () => {
      const list = await listSessionMetadata();
      expect(list).toEqual([]);
    });

    it('returns all sessions', async () => {
      await putSession(createMockSerializedSession('list-1'));
      await putSession(createMockSerializedSession('list-2'));

      const list = await listSessionMetadata();
      expect(list).toHaveLength(2);
    });

    it('returns correct fields', async () => {
      await putSession(createMockSerializedSession('list-fields'));

      const list = await listSessionMetadata();
      const item = list[0];
      expect(item?.id).toBe('list-fields');
      expect(item?.name).toBe('Test Beat');
      expect(item?.bpm).toBe(120);
      expect(item?.hitCount).toBe(4);
    });
  });

  describe('audio blobs', () => {
    it('stores and retrieves blobs', async () => {
      const blobs = [
        createMockAudioBlob('blob-test', 'raw', 'raw'),
        createMockAudioBlob('blob-test', 'snippet', '0'),
      ];
      await putAudioBlobs(blobs);

      const loaded = await getAudioBlobsBySession('blob-test');
      expect(loaded).toHaveLength(2);
    });

    it('handles empty blob array', async () => {
      await putAudioBlobs([]);
      // Should not throw
    });

    it('deletes blobs by session', async () => {
      await putAudioBlobs([
        createMockAudioBlob('del-blob', 'raw', 'raw'),
        createMockAudioBlob('del-blob', 'snippet', '0'),
      ]);
      await deleteAudioBlobsBySession('del-blob');

      const loaded = await getAudioBlobsBySession('del-blob');
      expect(loaded).toHaveLength(0);
    });
  });

  describe('clearAllData', () => {
    it('removes all sessions and blobs', async () => {
      await putSession(createMockSerializedSession('clear-1'));
      await putAudioBlobs([createMockAudioBlob('clear-1', 'raw', 'raw')]);

      await clearAllData();

      const sessions = await listSessionMetadata();
      expect(sessions).toHaveLength(0);
      const blobs = await getAudioBlobsBySession('clear-1');
      expect(blobs).toHaveLength(0);
    });
  });
});
