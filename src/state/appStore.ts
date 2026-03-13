import { create } from 'zustand';

import type { MicPermissionState } from '@/types/audio';

interface AppStoreState {
  micPermission: MicPermissionState;
  setMicPermission: (status: MicPermissionState) => void;
}

export const useAppStore = create<AppStoreState>()((set) => ({
  micPermission: 'unknown',

  setMicPermission: (status) => {
    set({ micPermission: status });
  },
}));
