import { create } from 'zustand';

import type { SaveStatus, SessionListItem } from '@/types/session';

interface SessionStoreState {
  currentSessionId: string | null;
  currentSessionName: string;
  sessions: SessionListItem[];
  saveStatus: SaveStatus;
  storageUsed: number;
  storageQuota: number;

  // Actions
  setCurrentSession: (id: string | null, name: string) => void;
  setCurrentSessionName: (name: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setSessions: (sessions: SessionListItem[]) => void;
  updateStorageInfo: (used: number, quota: number) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  currentSessionId: null as string | null,
  currentSessionName: 'Untitled Beat',
  sessions: [] as SessionListItem[],
  saveStatus: 'idle' as SaveStatus,
  storageUsed: 0,
  storageQuota: 0,
};

export const useSessionStore = create<SessionStoreState>()((set) => ({
  ...INITIAL_STATE,

  setCurrentSession: (id, name) => {
    set({ currentSessionId: id, currentSessionName: name, saveStatus: 'idle' });
  },

  setCurrentSessionName: (name) => {
    set({ currentSessionName: name });
  },

  setSaveStatus: (status) => {
    set({ saveStatus: status });
  },

  setSessions: (sessions) => {
    set({ sessions });
  },

  updateStorageInfo: (used, quota) => {
    set({ storageUsed: used, storageQuota: quota });
  },

  reset: () => {
    set({ ...INITIAL_STATE });
  },
}));
