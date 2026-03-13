import { beforeEach, describe, expect, it } from 'vitest';

import { useQuantizationStore } from '@/state/quantizationStore';
import { useTimelineStore } from '@/state/timelineStore';
import type { QuantizedHit } from '@/types/quantization';

import { resetAllStores, seedFullTimeline } from '../../helpers/timelineFixtures';

describe('timeline editing logic', () => {
  beforeEach(() => {
    resetAllStores();
    seedFullTimeline(120, 8, 2);
  });

  describe('add hit', () => {
    it('addHit inserts and sorts', () => {
      const before = useQuantizationStore.getState().quantizedHits.length;
      const newHit: QuantizedHit = {
        originalTime: 0.25,
        quantizedTime: 0.25,
        gridPosition: 0.5,
        velocity: 0.8,
        clusterId: 0,
        instrumentId: 'kick-deep',
        hitIndex: -1,
      };
      useTimelineStore.getState().pushUndo();
      useQuantizationStore.getState().addHit(newHit);
      expect(useQuantizationStore.getState().quantizedHits.length).toBe(before + 1);
    });

    it('added hit appears at correct sorted position', () => {
      const newHit: QuantizedHit = {
        originalTime: 0.125,
        quantizedTime: 0.125,
        gridPosition: 0.25,
        velocity: 0.8,
        clusterId: 0,
        instrumentId: 'kick-deep',
        hitIndex: -1,
      };
      useQuantizationStore.getState().addHit(newHit);
      const hits = useQuantizationStore.getState().quantizedHits;
      const idx = hits.findIndex((h) => h.quantizedTime === 0.125);
      expect(idx).toBeGreaterThanOrEqual(0);

      // Verify it's between time 0 and time 0.5
      if (idx > 0) {
        const prev = hits[idx - 1];
        if (prev !== undefined) {
          expect(prev.quantizedTime).toBeLessThanOrEqual(0.125);
        }
      }
    });
  });

  describe('remove hit', () => {
    it('removeHit removes at index', () => {
      const before = useQuantizationStore.getState().quantizedHits.length;
      useTimelineStore.getState().pushUndo();
      useQuantizationStore.getState().removeHit(0);
      expect(useQuantizationStore.getState().quantizedHits.length).toBe(before - 1);
    });

    it('undo restores removed hit', () => {
      const before = useQuantizationStore.getState().quantizedHits.length;
      useTimelineStore.getState().pushUndo();
      useQuantizationStore.getState().removeHit(0);
      useTimelineStore.getState().undo();
      expect(useQuantizationStore.getState().quantizedHits.length).toBe(before);
    });
  });

  describe('move hit (updateHitTime)', () => {
    it('updates hit time', () => {
      useTimelineStore.getState().pushUndo();
      useQuantizationStore.getState().updateHitTime(0, 5.0);
      const hits = useQuantizationStore.getState().quantizedHits;
      const found = hits.find((h) => h.quantizedTime === 5.0);
      expect(found).toBeDefined();
    });

    it('maintains sort order after move', () => {
      useQuantizationStore.getState().updateHitTime(0, 10.0);
      const hits = useQuantizationStore.getState().quantizedHits;
      for (let i = 1; i < hits.length; i++) {
        const curr = hits[i];
        const prev = hits[i - 1];
        if (curr !== undefined && prev !== undefined) {
          expect(curr.quantizedTime).toBeGreaterThanOrEqual(prev.quantizedTime);
        }
      }
    });

    it('undo restores original position', () => {
      const originalTime = useQuantizationStore.getState().quantizedHits[0]?.quantizedTime;
      useTimelineStore.getState().pushUndo();
      useQuantizationStore.getState().updateHitTime(0, 99.0);
      useTimelineStore.getState().undo();
      expect(useQuantizationStore.getState().quantizedHits[0]?.quantizedTime).toBe(originalTime);
    });
  });

  describe('undo/redo integration', () => {
    it('multiple operations can be undone sequentially', () => {
      const initial = useQuantizationStore.getState().quantizedHits.length;

      // Add a hit
      useTimelineStore.getState().pushUndo();
      useQuantizationStore.getState().addHit({
        originalTime: 99,
        quantizedTime: 99,
        gridPosition: 99,
        velocity: 0.8,
        clusterId: 0,
        instrumentId: 'kick-deep',
        hitIndex: -1,
      });

      // Remove a hit
      useTimelineStore.getState().pushUndo();
      useQuantizationStore.getState().removeHit(0);

      expect(useQuantizationStore.getState().quantizedHits.length).toBe(initial);

      // Undo remove
      useTimelineStore.getState().undo();
      expect(useQuantizationStore.getState().quantizedHits.length).toBe(initial + 1);

      // Undo add
      useTimelineStore.getState().undo();
      expect(useQuantizationStore.getState().quantizedHits.length).toBe(initial);
    });
  });
});
