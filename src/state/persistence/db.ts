import type { SerializedSession, AudioBlobEntry, SessionListItem } from '@/types/session';

const DB_NAME = 'tapbeats';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';
const AUDIO_BLOBS_STORE = 'audioBlobs';

let dbInstance: IDBDatabase | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance !== null) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
        sessionsStore.createIndex('by-updated', 'metadata.updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(AUDIO_BLOBS_STORE)) {
        const blobsStore = db.createObjectStore(AUDIO_BLOBS_STORE, { keyPath: 'key' });
        blobsStore.createIndex('by-session', 'sessionId', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${String(request.error?.message)}`));
    };
  });
}

export function getDB(): IDBDatabase | null {
  return dbInstance;
}

/** Reset cached DB instance (for testing) */
export function resetDB(): void {
  dbInstance = null;
}

function wrapRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(new Error(String(request.error)));
    };
  });
}

function wrapTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      resolve();
    };
    tx.onerror = () => {
      reject(new Error(String(tx.error)));
    };
    tx.onabort = () => {
      reject(tx.error ?? new Error('Transaction aborted'));
    };
  });
}

export async function putSession(session: SerializedSession): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(SESSIONS_STORE, 'readwrite');
  const store = tx.objectStore(SESSIONS_STORE);
  store.put(session);
  await wrapTransaction(tx);
}

export async function getSession(id: string): Promise<SerializedSession | undefined> {
  const db = await openDatabase();
  const tx = db.transaction(SESSIONS_STORE, 'readonly');
  const store = tx.objectStore(SESSIONS_STORE);
  return wrapRequest(store.get(id)) as Promise<SerializedSession | undefined>;
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(SESSIONS_STORE, 'readwrite');
  const store = tx.objectStore(SESSIONS_STORE);
  store.delete(id);
  await wrapTransaction(tx);
}

export async function listSessionMetadata(): Promise<SessionListItem[]> {
  const db = await openDatabase();
  const tx = db.transaction(SESSIONS_STORE, 'readonly');
  const store = tx.objectStore(SESSIONS_STORE);
  const index = store.index('by-updated');

  return new Promise((resolve, reject) => {
    const items: SessionListItem[] = [];
    const request = index.openCursor(null, 'prev'); // newest first

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor !== null) {
        const session = cursor.value as SerializedSession;
        items.push({
          id: session.id,
          name: session.metadata.name,
          createdAt: session.metadata.createdAt,
          updatedAt: session.metadata.updatedAt,
          durationMs: session.metadata.durationMs,
          bpm: session.metadata.bpm,
          hitCount: session.metadata.hitCount,
        });
        cursor.continue();
      } else {
        resolve(items);
      }
    };

    request.onerror = () => {
      reject(new Error(String(request.error)));
    };
  });
}

export async function putAudioBlobs(blobs: AudioBlobEntry[]): Promise<void> {
  if (blobs.length === 0) return;
  const db = await openDatabase();
  const tx = db.transaction(AUDIO_BLOBS_STORE, 'readwrite');
  const store = tx.objectStore(AUDIO_BLOBS_STORE);
  for (const blob of blobs) {
    store.put(blob);
  }
  await wrapTransaction(tx);
}

export async function getAudioBlobsBySession(sessionId: string): Promise<AudioBlobEntry[]> {
  const db = await openDatabase();
  const tx = db.transaction(AUDIO_BLOBS_STORE, 'readonly');
  const store = tx.objectStore(AUDIO_BLOBS_STORE);
  const index = store.index('by-session');
  return wrapRequest(index.getAll(sessionId)) as Promise<AudioBlobEntry[]>;
}

export async function deleteAudioBlobsBySession(sessionId: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(AUDIO_BLOBS_STORE, 'readwrite');
  const store = tx.objectStore(AUDIO_BLOBS_STORE);
  const index = store.index('by-session');

  return new Promise((resolve, reject) => {
    const request = index.openCursor(sessionId);
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor !== null) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => {
      reject(new Error(String(request.error)));
    };
  });
}

export async function estimateStorageUsage(): Promise<{ used: number; quota: number }> {
  try {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
    };
  } catch {
    return { used: 0, quota: 0 };
  }
}

export async function clearAllData(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction([SESSIONS_STORE, AUDIO_BLOBS_STORE], 'readwrite');
  tx.objectStore(SESSIONS_STORE).clear();
  tx.objectStore(AUDIO_BLOBS_STORE).clear();
  await wrapTransaction(tx);
}
