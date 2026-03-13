import { beforeEach, describe, expect, it } from 'vitest';

import { useQuantizationStore } from '@/state/quantizationStore';
import { useTimelineStore } from '@/state/timelineStore';

import { resetAllStores, seedFullTimeline } from '../../helpers/timelineFixtures';

describe('timelineStore', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('initTracks', () => {
    it('creates track configs for given IDs', () => {
      useTimelineStore.getState().initTracks([0, 1, 2]);
      const { trackConfigs } = useTimelineStore.getState();
      expect(trackConfigs).toHaveLength(3);
      expect(trackConfigs[0]?.trackId).toBe(0);
      expect(trackConfigs[0]?.muted).toBe(false);
      expect(trackConfigs[0]?.soloed).toBe(false);
      expect(trackConfigs[0]?.volume).toBe(0.8);
    });

    it('resets selected track index to 0', () => {
      useTimelineStore.getState().initTracks([0, 1]);
      expect(useTimelineStore.getState().selectedTrackIndex).toBe(0);
    });
  });

  describe('mute/solo', () => {
    beforeEach(() => {
      useTimelineStore.getState().initTracks([0, 1, 2]);
    });

    it('setTrackMute toggles mute state', () => {
      useTimelineStore.getState().setTrackMute(1, true);
      expect(useTimelineStore.getState().trackConfigs[1]?.muted).toBe(true);
      useTimelineStore.getState().setTrackMute(1, false);
      expect(useTimelineStore.getState().trackConfigs[1]?.muted).toBe(false);
    });

    it('setTrackSolo toggles solo state', () => {
      useTimelineStore.getState().setTrackSolo(0, true);
      expect(useTimelineStore.getState().trackConfigs[0]?.soloed).toBe(true);
    });

    it('getActiveTrackIds returns all non-muted when no solo', () => {
      useTimelineStore.getState().setTrackMute(1, true);
      const active = useTimelineStore.getState().getActiveTrackIds();
      expect(active).toEqual([0, 2]);
    });

    it('getActiveTrackIds returns only soloed tracks when any soloed', () => {
      useTimelineStore.getState().setTrackSolo(2, true);
      const active = useTimelineStore.getState().getActiveTrackIds();
      expect(active).toEqual([2]);
    });

    it('solo overrides mute', () => {
      useTimelineStore.getState().setTrackMute(0, true);
      useTimelineStore.getState().setTrackSolo(0, true);
      const active = useTimelineStore.getState().getActiveTrackIds();
      expect(active).toEqual([0]);
    });
  });

  describe('volume', () => {
    beforeEach(() => {
      useTimelineStore.getState().initTracks([0, 1]);
    });

    it('setTrackVolume clamps to 0-1', () => {
      useTimelineStore.getState().setTrackVolume(0, 1.5);
      expect(useTimelineStore.getState().trackConfigs[0]?.volume).toBe(1);
      useTimelineStore.getState().setTrackVolume(0, -0.5);
      expect(useTimelineStore.getState().trackConfigs[0]?.volume).toBe(0);
    });

    it('setMasterVolume clamps to 0-1', () => {
      useTimelineStore.getState().setMasterVolume(2);
      expect(useTimelineStore.getState().masterVolume).toBe(1);
      useTimelineStore.getState().setMasterVolume(-1);
      expect(useTimelineStore.getState().masterVolume).toBe(0);
    });
  });

  describe('selectedTrack', () => {
    it('setSelectedTrack changes index within bounds', () => {
      useTimelineStore.getState().initTracks([0, 1, 2]);
      useTimelineStore.getState().setSelectedTrack(2);
      expect(useTimelineStore.getState().selectedTrackIndex).toBe(2);
    });

    it('setSelectedTrack ignores out of bounds', () => {
      useTimelineStore.getState().initTracks([0, 1]);
      useTimelineStore.getState().setSelectedTrack(5);
      expect(useTimelineStore.getState().selectedTrackIndex).toBe(0);
    });
  });

  describe('zoom/scroll', () => {
    it('setZoom clamps between min and max', () => {
      useTimelineStore.getState().setZoom(10);
      expect(useTimelineStore.getState().pixelsPerSecond).toBe(50);
      useTimelineStore.getState().setZoom(5000);
      expect(useTimelineStore.getState().pixelsPerSecond).toBe(2000);
    });

    it('setScrollOffset clamps to >= 0', () => {
      useTimelineStore.getState().setScrollOffset(-5);
      expect(useTimelineStore.getState().scrollOffsetSeconds).toBe(0);
      useTimelineStore.getState().setScrollOffset(3.5);
      expect(useTimelineStore.getState().scrollOffsetSeconds).toBe(3.5);
    });
  });

  describe('undo/redo', () => {
    beforeEach(() => {
      seedFullTimeline(120, 8, 2);
    });

    it('pushUndo captures current state', () => {
      useTimelineStore.getState().pushUndo();
      expect(useTimelineStore.getState().undoStack).toHaveLength(1);
      expect(useTimelineStore.getState().canUndo()).toBe(true);
    });

    it('undo restores previous state', () => {
      const originalHits = [...useQuantizationStore.getState().quantizedHits];
      useTimelineStore.getState().pushUndo();

      // Modify state
      useQuantizationStore.getState().removeHit(0);
      expect(useQuantizationStore.getState().quantizedHits.length).toBe(originalHits.length - 1);

      // Undo
      useTimelineStore.getState().undo();
      expect(useQuantizationStore.getState().quantizedHits.length).toBe(originalHits.length);
    });

    it('redo restores after undo', () => {
      useTimelineStore.getState().pushUndo();
      const beforeRemove = useQuantizationStore.getState().quantizedHits.length;
      useQuantizationStore.getState().removeHit(0);
      const afterRemove = useQuantizationStore.getState().quantizedHits.length;

      useTimelineStore.getState().undo();
      expect(useQuantizationStore.getState().quantizedHits.length).toBe(beforeRemove);

      useTimelineStore.getState().redo();
      expect(useQuantizationStore.getState().quantizedHits.length).toBe(afterRemove);
    });

    it('new action clears redo stack', () => {
      useTimelineStore.getState().pushUndo();
      useQuantizationStore.getState().removeHit(0);
      useTimelineStore.getState().undo();
      expect(useTimelineStore.getState().canRedo()).toBe(true);

      // New action
      useTimelineStore.getState().pushUndo();
      expect(useTimelineStore.getState().canRedo()).toBe(false);
    });

    it('undo with empty stack does nothing', () => {
      const hitsBefore = useQuantizationStore.getState().quantizedHits.length;
      useTimelineStore.getState().undo();
      expect(useQuantizationStore.getState().quantizedHits.length).toBe(hitsBefore);
    });

    it('max 50 undo snapshots', () => {
      for (let i = 0; i < 55; i++) {
        useTimelineStore.getState().pushUndo();
      }
      expect(useTimelineStore.getState().undoStack.length).toBe(50);
    });
  });

  describe('reset', () => {
    it('clears all state', () => {
      seedFullTimeline(120, 8, 2);
      useTimelineStore.getState().pushUndo();
      useTimelineStore.getState().setZoom(500);

      useTimelineStore.getState().reset();

      const state = useTimelineStore.getState();
      expect(state.trackConfigs).toHaveLength(0);
      expect(state.undoStack).toHaveLength(0);
      expect(state.pixelsPerSecond).toBe(200);
      expect(state.masterVolume).toBe(0.8);
    });
  });
});
