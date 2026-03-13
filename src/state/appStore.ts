import { create } from 'zustand';

import type { MicPermissionState } from '@/types/audio';

type InstallState = 'idle' | 'available' | 'installed' | 'dismissed';
type SWStatus = 'pending' | 'registered' | 'update-available' | 'error';

interface AppStoreState {
  micPermission: MicPermissionState;
  setMicPermission: (status: MicPermissionState) => void;

  installState: InstallState;
  setInstallState: (state: InstallState) => void;

  swStatus: SWStatus;
  setSwStatus: (status: SWStatus) => void;
}

export const useAppStore = create<AppStoreState>()((set) => ({
  micPermission: 'unknown',

  setMicPermission: (status) => {
    set({ micPermission: status });
  },

  installState: 'idle',

  setInstallState: (state) => {
    set({ installState: state });
  },

  swStatus: 'pending',

  setSwStatus: (status) => {
    set({ swStatus: status });
  },
}));
