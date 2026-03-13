import { create } from 'zustand';

import type { RingBuffer } from '@/audio/capture/RingBuffer';
import type {
  AudioCaptureError,
  AudioFeatures,
  DetectedHit,
  RecordingState,
  SensitivityLevel,
} from '@/types/audio';

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
  _onsets: DetectedHit[];
  _sensitivity: SensitivityLevel;
  _onsetTimestamps: number[];

  // Actions
  setStatus: (status: RecordingState) => void;
  updateElapsedTime: (time: number) => void;
  incrementHitCount: () => void;
  updatePeakLevel: (level: number) => void;
  updateAmplitudes: (amplitudes: number[]) => void;
  setError: (error: AudioCaptureError) => void;
  setRawAudioBuffer: (buffer: RingBuffer | null) => void;
  addOnset: (hit: DetectedHit) => void;
  setSensitivity: (level: SensitivityLevel) => void;
  updateHitFeatures: (index: number, features: AudioFeatures) => void;
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
  _onsets: [] as DetectedHit[],
  _sensitivity: 'medium' as SensitivityLevel,
  _onsetTimestamps: [] as number[],
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

  addOnset: (hit) => {
    set((state) => ({
      _onsets: [...state._onsets, hit],
      _onsetTimestamps: [...state._onsetTimestamps, hit.onset.timestamp],
      hitCount: state.hitCount + 1,
    }));
  },

  setSensitivity: (level) => {
    set({ _sensitivity: level });
  },

  updateHitFeatures: (index, features) => {
    set((state) => {
      const onsets = [...state._onsets];
      const existing = onsets[index];
      if (existing === undefined) return state;
      onsets[index] = { ...existing, features };
      return { _onsets: onsets };
    });
  },

  reset: () => {
    set({ ...INITIAL_STATE, _amplitudes: [], _onsets: [], _onsetTimestamps: [] });
  },
}));
