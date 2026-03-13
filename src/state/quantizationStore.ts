import { create } from 'zustand';

import { detectBpm } from '@/audio/quantization/detectBpm';
import { quantizeHits } from '@/audio/quantization/quantizeHits';
import { useClusterStore } from '@/state/clusterStore';
import { useRecordingStore } from '@/state/recordingStore';
import type { BPMResult, GridResolution, PlaybackMode, QuantizedHit } from '@/types/quantization';

interface QuantizationStoreState {
  // State
  bpm: number;
  bpmManualOverride: boolean;
  bpmResult: BPMResult | null;
  gridResolution: GridResolution;
  strength: number;
  swingAmount: number;
  quantizedHits: QuantizedHit[];
  playbackMode: PlaybackMode;

  // Actions
  detectAndSetBpm: () => void;
  setBpm: (bpm: number) => void;
  setGridResolution: (resolution: GridResolution) => void;
  setStrength: (strength: number) => void;
  setSwingAmount: (amount: number) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  recomputeQuantization: () => void;

  // Direct mutation actions (for undo/redo and timeline editing)
  setQuantizedHits: (hits: QuantizedHit[]) => void;
  addHit: (hit: QuantizedHit) => void;
  removeHit: (hitIndex: number) => void;
  updateHitTime: (hitIndex: number, newTime: number) => void;

  reset: () => void;
}

const INITIAL_STATE = {
  bpm: 120,
  bpmManualOverride: false,
  bpmResult: null as BPMResult | null,
  gridResolution: '1/8' as GridResolution,
  strength: 75,
  swingAmount: 0.5,
  quantizedHits: [] as QuantizedHit[],
  playbackMode: 'quantized' as PlaybackMode,
};

export const useQuantizationStore = create<QuantizationStoreState>()((set, get) => ({
  ...INITIAL_STATE,

  detectAndSetBpm: () => {
    const { _onsetTimestamps } = useRecordingStore.getState();
    const bpmResult = detectBpm(_onsetTimestamps);
    const state = get();

    if (state.bpmManualOverride) {
      set({ bpmResult });
    } else {
      set({ bpmResult, bpm: bpmResult.bpm });
    }

    get().recomputeQuantization();
  },

  setBpm: (bpm) => {
    set({ bpm, bpmManualOverride: true });
    get().recomputeQuantization();
  },

  setGridResolution: (resolution) => {
    set({ gridResolution: resolution });
    get().recomputeQuantization();
  },

  setStrength: (strength) => {
    set({ strength });
    get().recomputeQuantization();
  },

  setSwingAmount: (amount) => {
    set({ swingAmount: amount });
    get().recomputeQuantization();
  },

  setPlaybackMode: (mode) => {
    set({ playbackMode: mode });
  },

  recomputeQuantization: () => {
    const { _onsets } = useRecordingStore.getState();
    const { clusters, assignments, instrumentAssignments } = useClusterStore.getState();
    const { bpm, gridResolution, strength, swingAmount } = get();
    const config = { bpm, gridResolution, strength, swingAmount };
    const quantizedHits = quantizeHits(
      _onsets,
      clusters,
      assignments,
      instrumentAssignments,
      config,
    );
    set({ quantizedHits });
  },

  setQuantizedHits: (hits) => {
    set({ quantizedHits: hits });
  },

  addHit: (hit) => {
    const { quantizedHits } = get();
    const updated = [...quantizedHits, hit].sort((a, b) => a.quantizedTime - b.quantizedTime);
    set({ quantizedHits: updated });
  },

  removeHit: (hitIndex) => {
    set((s) => ({
      quantizedHits: s.quantizedHits.filter((_, i) => i !== hitIndex),
    }));
  },

  updateHitTime: (hitIndex, newTime) => {
    set((s) => {
      const updated = s.quantizedHits.map((hit, i) =>
        i === hitIndex
          ? { ...hit, quantizedTime: newTime, gridPosition: newTime * (s.bpm / 60) }
          : hit,
      );
      return { quantizedHits: updated.sort((a, b) => a.quantizedTime - b.quantizedTime) };
    });
  },

  reset: () => {
    set({ ...INITIAL_STATE });
  },
}));
