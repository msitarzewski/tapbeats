import { useClusterStore } from '@/state/clusterStore';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useSessionStore } from '@/state/sessionStore';
import { useTimelineStore } from '@/state/timelineStore';
import type { SessionListItem } from '@/types/session';

import {
  deleteAudioBlobsBySession,
  deleteSession as dbDeleteSession,
  estimateStorageUsage,
  getAudioBlobsBySession,
  getSession,
  listSessionMetadata,
  putAudioBlobs,
  putSession,
} from './db';
import { restoreStores, serializeSession } from './serialization';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class SessionManager {
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribers: (() => void)[] = [];
  private dirty = false;

  /** Save current state to IndexedDB */
  async saveSession(id?: string, name?: string): Promise<string> {
    const sessionStore = useSessionStore.getState();
    const sessionId = id ?? sessionStore.currentSessionId ?? generateId();
    const sessionName = name ?? sessionStore.currentSessionName;

    sessionStore.setSaveStatus('saving');

    try {
      const { session, blobs } = serializeSession(sessionId, sessionName, 44100);

      // If this is an update, preserve createdAt from existing session
      const existing = await getSession(sessionId);
      if (existing !== undefined) {
        const updated = {
          ...session,
          metadata: {
            ...session.metadata,
            createdAt: existing.metadata.createdAt,
            updatedAt: Date.now(),
          },
        };
        await putSession(updated);
      } else {
        await putSession(session);
      }

      await putAudioBlobs(blobs);

      // Update session store
      sessionStore.setCurrentSession(sessionId, sessionName);
      sessionStore.setSaveStatus('saved');

      // Refresh session list
      await this.refreshSessionList();
      await this.refreshStorageInfo();

      this.dirty = false;
      return sessionId;
    } catch (e) {
      sessionStore.setSaveStatus('error');
      throw e;
    }
  }

  /** Load a session from IndexedDB and restore all stores */
  async loadSession(id: string): Promise<void> {
    const session = await getSession(id);
    if (session === undefined) {
      throw new Error(`Session not found: ${id}`);
    }

    const blobs = await getAudioBlobsBySession(id);
    restoreStores(session, blobs);

    useSessionStore.getState().setCurrentSession(id, session.metadata.name);
    useSessionStore.getState().setSaveStatus('saved');
    this.dirty = false;
  }

  /** Delete a session and its audio blobs */
  async deleteSession(id: string): Promise<void> {
    await dbDeleteSession(id);
    await deleteAudioBlobsBySession(id);

    const sessionStore = useSessionStore.getState();
    if (sessionStore.currentSessionId === id) {
      sessionStore.setCurrentSession(null, 'Untitled Beat');
      sessionStore.setSaveStatus('idle');
    }

    await this.refreshSessionList();
    await this.refreshStorageInfo();
  }

  /** Rename a session */
  async renameSession(id: string, newName: string): Promise<void> {
    const session = await getSession(id);
    if (session === undefined) {
      throw new Error(`Session not found: ${id}`);
    }

    const updated = {
      ...session,
      metadata: {
        ...session.metadata,
        name: newName,
        updatedAt: Date.now(),
      },
    };
    await putSession(updated);

    const sessionStore = useSessionStore.getState();
    if (sessionStore.currentSessionId === id) {
      sessionStore.setCurrentSessionName(newName);
    }

    await this.refreshSessionList();
  }

  /** Get the list of all sessions */
  async listSessions(): Promise<SessionListItem[]> {
    return listSessionMetadata();
  }

  /** Refresh session list in store */
  async refreshSessionList(): Promise<void> {
    const sessions = await listSessionMetadata();
    useSessionStore.getState().setSessions(sessions);
  }

  /** Refresh storage info in store */
  async refreshStorageInfo(): Promise<void> {
    const { used, quota } = await estimateStorageUsage();
    useSessionStore.getState().updateStorageInfo(used, quota);
  }

  /** Start auto-save with store subscriptions */
  startAutoSave(): void {
    const markDirty = () => {
      this.dirty = true;
      this.scheduleAutoSave();
    };

    this.unsubscribers.push(useClusterStore.subscribe(markDirty));
    this.unsubscribers.push(useQuantizationStore.subscribe(markDirty));
    this.unsubscribers.push(useTimelineStore.subscribe(markDirty));
  }

  /** Schedule a debounced auto-save */
  private scheduleAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = setTimeout(() => {
      const { currentSessionId } = useSessionStore.getState();
      if (currentSessionId !== null && this.dirty) {
        void this.saveSession(currentSessionId);
      }
      this.autoSaveTimer = null;
    }, 2000);
  }

  /** Cancel pending auto-save */
  cancelAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /** Clean up subscriptions and timers */
  dispose(): void {
    this.cancelAutoSave();
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }
}
