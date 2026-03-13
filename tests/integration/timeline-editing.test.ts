import { beforeEach, describe, expect, it } from 'vitest';

import { useQuantizationStore } from '@/state/quantizationStore';
import { useTimelineStore } from '@/state/timelineStore';
import type { QuantizedHit } from '@/types/quantization';

import { resetAllStores, seedFullTimeline } from '../helpers/timelineFixtures';

describe('timeline editing integration', () => {
  beforeEach(() => {
    resetAllStores();
    seedFullTimeline(120, 16, 3);
  });

  it('full workflow: add, move, delete, undo all', () => {
    const initialCount = useQuantizationStore.getState().quantizedHits.length;

    // Step 1: Add a hit
    useTimelineStore.getState().pushUndo();
    const newHit: QuantizedHit = {
      originalTime: 0.375,
      quantizedTime: 0.375,
      gridPosition: 0.75,
      velocity: 0.8,
      clusterId: 0,
      instrumentId: 'kick-deep',
      hitIndex: -1,
    };
    useQuantizationStore.getState().addHit(newHit);
    expect(useQuantizationStore.getState().quantizedHits.length).toBe(initialCount + 1);

    // Step 2: Move first hit
    useTimelineStore.getState().pushUndo();
    useQuantizationStore.getState().updateHitTime(0, 8.0);

    // Step 3: Delete last hit
    useTimelineStore.getState().pushUndo();
    const beforeDelete = useQuantizationStore.getState().quantizedHits.length;
    useQuantizationStore.getState().removeHit(beforeDelete - 1);
    expect(useQuantizationStore.getState().quantizedHits.length).toBe(beforeDelete - 1);

    // Undo delete
    useTimelineStore.getState().undo();
    expect(useQuantizationStore.getState().quantizedHits.length).toBe(beforeDelete);

    // Undo move
    useTimelineStore.getState().undo();

    // Undo add
    useTimelineStore.getState().undo();
    expect(useQuantizationStore.getState().quantizedHits.length).toBe(initialCount);
  });

  it('mute/solo affects getActiveTrackIds correctly', () => {
    const store = useTimelineStore.getState();
    const allTracks = store.trackConfigs.map((tc) => tc.trackId);
    expect(store.getActiveTrackIds()).toEqual(allTracks);

    // Mute track 0
    useTimelineStore.getState().setTrackMute(0, true);
    const afterMute = useTimelineStore.getState().getActiveTrackIds();
    expect(afterMute).not.toContain(0);
    expect(afterMute.length).toBe(allTracks.length - 1);

    // Solo track 2 (overrides mute)
    useTimelineStore.getState().setTrackSolo(2, true);
    const afterSolo = useTimelineStore.getState().getActiveTrackIds();
    expect(afterSolo).toEqual([2]);

    // Unsolo
    useTimelineStore.getState().setTrackSolo(2, false);
    const afterUnsolo = useTimelineStore.getState().getActiveTrackIds();
    expect(afterUnsolo).not.toContain(0); // still muted
    expect(afterUnsolo.length).toBe(allTracks.length - 1);
  });

  it('volume changes are independent per track', () => {
    useTimelineStore.getState().setTrackVolume(0, 0.3);
    useTimelineStore.getState().setTrackVolume(1, 0.9);
    useTimelineStore.getState().setMasterVolume(0.5);

    const configs = useTimelineStore.getState().trackConfigs;
    expect(configs.find((tc) => tc.trackId === 0)?.volume).toBeCloseTo(0.3);
    expect(configs.find((tc) => tc.trackId === 1)?.volume).toBeCloseTo(0.9);
    expect(useTimelineStore.getState().masterVolume).toBeCloseTo(0.5);
  });

  it('zoom and scroll stay in bounds', () => {
    useTimelineStore.getState().setZoom(30); // below min
    expect(useTimelineStore.getState().pixelsPerSecond).toBe(50);

    useTimelineStore.getState().setZoom(3000); // above max
    expect(useTimelineStore.getState().pixelsPerSecond).toBe(2000);

    useTimelineStore.getState().setScrollOffset(-10);
    expect(useTimelineStore.getState().scrollOffsetSeconds).toBe(0);
  });

  it('undo preserves track configs alongside hits', () => {
    // Change track config, then undo
    useTimelineStore.getState().pushUndo();
    useTimelineStore.getState().setTrackMute(0, true);
    useTimelineStore.getState().setTrackVolume(1, 0.2);

    // Push another undo and modify
    useTimelineStore.getState().pushUndo();
    useTimelineStore.getState().setTrackMute(1, true);

    // Undo last change
    useTimelineStore.getState().undo();
    const configs = useTimelineStore.getState().trackConfigs;
    expect(configs.find((tc) => tc.trackId === 0)?.muted).toBe(true); // from first change
    expect(configs.find((tc) => tc.trackId === 1)?.muted).toBe(false); // restored
  });

  it('initTracks re-initializes when clusters change', () => {
    useTimelineStore.getState().initTracks([0, 1, 2, 3]);
    expect(useTimelineStore.getState().trackConfigs).toHaveLength(4);
    expect(useTimelineStore.getState().selectedTrackIndex).toBe(0);
  });

  it('selected track bounds checking', () => {
    useTimelineStore.getState().setSelectedTrack(1);
    expect(useTimelineStore.getState().selectedTrackIndex).toBe(1);

    // Out of bounds
    useTimelineStore.getState().setSelectedTrack(99);
    expect(useTimelineStore.getState().selectedTrackIndex).toBe(1); // unchanged
  });
});
