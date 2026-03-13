import { create } from 'zustand';

import type { RingBuffer } from '@/audio/capture/RingBuffer';
import type { AudioCaptureError, RecordingState } from '@/types/audio';

interface RecordingStoreState {
  // Serializable state
  status: RecordingState;
  elapsedTime: number;
  hitCount: number;
  peakLevel: number;
  error: AudioCaptureError | null;

  // Non-serializable (excluded from persistence)
  _rawAudioBuffer: RingBuffer | null;
  _amplitudes: number[];

  // Actions
  setStatus: (status: RecordingState) => void;
  updateElapsedTime: (time: number) => void;
  incrementHitCount: () => void;
  updatePeakLevel: (level: number) => void;
  updateAmplitudes: (amplitudes: number[]) => void;
  setError: (error: AudioCaptureError) => void;
  setRawAudioBuffer: (buffer: RingBuffer | null) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  status: 'idle' as RecordingState,
  elapsedTime: 0,
  hitCount: 0,
  peakLevel: 0,
  error: null,
  _rawAudioBuffer: null,
  _amplitudes: [] as number[],
};

export const useRecordingStore = create<RecordingStoreState>()((set) => ({
  ...INITIAL_STATE,

  setStatus: (status) => {
    set({ status });
  },

  updateElapsedTime: (time) => {
    set({ elapsedTime: time });
  },

  incrementHitCount: () => {
    set((state) => ({ hitCount: state.hitCount + 1 }));
  },

  updatePeakLevel: (level) => {
    set({ peakLevel: level });
  },

  updateAmplitudes: (amplitudes) => {
    set({ _amplitudes: amplitudes });
  },

  setError: (error) => {
    set({ error, status: 'idle' });
  },

  setRawAudioBuffer: (buffer) => {
    set({ _rawAudioBuffer: buffer });
  },

  reset: () => {
    set({ ...INITIAL_STATE, _amplitudes: [] });
  },
}));
