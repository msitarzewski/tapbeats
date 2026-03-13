import { create } from 'zustand';

import { useQuantizationStore } from '@/state/quantizationStore';
import type { TrackConfig, UndoSnapshot } from '@/types/timeline';

const MAX_UNDO = 50;
const DEFAULT_PPS = 200; // pixels per second
const MIN_PPS = 50;
const MAX_PPS = 2000;

interface TimelineStoreState {
  // Track controls
  trackConfigs: TrackConfig[];
  masterVolume: number;
  selectedTrackIndex: number;

  // Zoom / scroll
  pixelsPerSecond: number;
  scrollOffsetSeconds: number;

  // Undo / redo
  undoStack: UndoSnapshot[];
  redoStack: UndoSnapshot[];

  // Actions — track controls
  initTracks: (trackIds: number[]) => void;
  setTrackMute: (trackId: number, muted: boolean) => void;
  setTrackSolo: (trackId: number, soloed: boolean) => void;
  setTrackVolume: (trackId: number, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  setSelectedTrack: (index: number) => void;

  // Actions — zoom / scroll
  setZoom: (pps: number) => void;
  setScrollOffset: (seconds: number) => void;

  // Actions — undo / redo
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Derived
  getActiveTrackIds: () => number[];

  // Reset
  reset: () => void;
}

const INITIAL_STATE = {
  trackConfigs: [] as TrackConfig[],
  masterVolume: 0.8,
  selectedTrackIndex: 0,
  pixelsPerSecond: DEFAULT_PPS,
  scrollOffsetSeconds: 0,
  undoStack: [] as UndoSnapshot[],
  redoStack: [] as UndoSnapshot[],
};

export const useTimelineStore = create<TimelineStoreState>()((set, get) => ({
  ...INITIAL_STATE,

  initTracks: (trackIds) => {
    const configs: TrackConfig[] = trackIds.map((id) => ({
      trackId: id,
      muted: false,
      soloed: false,
      volume: 0.8,
    }));
    set({ trackConfigs: configs, selectedTrackIndex: 0 });
  },

  setTrackMute: (trackId, muted) => {
    set((s) => ({
      trackConfigs: s.trackConfigs.map((tc) => (tc.trackId === trackId ? { ...tc, muted } : tc)),
    }));
  },

  setTrackSolo: (trackId, soloed) => {
    set((s) => ({
      trackConfigs: s.trackConfigs.map((tc) => (tc.trackId === trackId ? { ...tc, soloed } : tc)),
    }));
  },

  setTrackVolume: (trackId, volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    set((s) => ({
      trackConfigs: s.trackConfigs.map((tc) =>
        tc.trackId === trackId ? { ...tc, volume: clamped } : tc,
      ),
    }));
  },

  setMasterVolume: (volume) => {
    set({ masterVolume: Math.max(0, Math.min(1, volume)) });
  },

  setSelectedTrack: (index) => {
    const { trackConfigs } = get();
    if (index >= 0 && index < trackConfigs.length) {
      set({ selectedTrackIndex: index });
    }
  },

  setZoom: (pps) => {
    set({ pixelsPerSecond: Math.max(MIN_PPS, Math.min(MAX_PPS, pps)) });
  },

  setScrollOffset: (seconds) => {
    set({ scrollOffsetSeconds: Math.max(0, seconds) });
  },

  pushUndo: () => {
    const { quantizedHits } = useQuantizationStore.getState();
    const { trackConfigs, undoStack } = get();
    const snapshot: UndoSnapshot = {
      quantizedHits: structuredClone(quantizedHits),
      trackConfigs: structuredClone(trackConfigs),
    };
    const newStack = [...undoStack, snapshot];
    if (newStack.length > MAX_UNDO) {
      newStack.shift();
    }
    set({ undoStack: newStack, redoStack: [] });
  },

  undo: () => {
    const { undoStack, redoStack, trackConfigs } = get();
    if (undoStack.length === 0) return;

    // Save current state to redo
    const { quantizedHits: currentHits } = useQuantizationStore.getState();
    const redoSnapshot: UndoSnapshot = {
      quantizedHits: structuredClone(currentHits),
      trackConfigs: structuredClone(trackConfigs),
    };

    const newUndoStack = [...undoStack];
    const snapshot = newUndoStack.pop();
    if (snapshot === undefined) return;

    // Restore
    useQuantizationStore.getState().setQuantizedHits(snapshot.quantizedHits);
    set({
      trackConfigs: snapshot.trackConfigs,
      undoStack: newUndoStack,
      redoStack: [...redoStack, redoSnapshot],
    });
  },

  redo: () => {
    const { undoStack, redoStack, trackConfigs } = get();
    if (redoStack.length === 0) return;

    // Save current state to undo
    const { quantizedHits: currentHits } = useQuantizationStore.getState();
    const undoSnapshot: UndoSnapshot = {
      quantizedHits: structuredClone(currentHits),
      trackConfigs: structuredClone(trackConfigs),
    };

    const newRedoStack = [...redoStack];
    const snapshot = newRedoStack.pop();
    if (snapshot === undefined) return;

    // Restore
    useQuantizationStore.getState().setQuantizedHits(snapshot.quantizedHits);
    set({
      trackConfigs: snapshot.trackConfigs,
      undoStack: [...undoStack, undoSnapshot],
      redoStack: newRedoStack,
    });
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  getActiveTrackIds: () => {
    const { trackConfigs } = get();
    const anySoloed = trackConfigs.some((tc) => tc.soloed);
    if (anySoloed) {
      return trackConfigs.filter((tc) => tc.soloed).map((tc) => tc.trackId);
    }
    return trackConfigs.filter((tc) => !tc.muted).map((tc) => tc.trackId);
  },

  reset: () => {
    set({ ...INITIAL_STATE });
  },
}));
