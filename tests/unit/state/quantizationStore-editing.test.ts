import { beforeEach, describe, expect, it } from 'vitest';

import { useQuantizationStore } from '@/state/quantizationStore';
import type { QuantizedHit } from '@/types/quantization';

import { resetAllStores, seedFullTimeline } from '../../helpers/timelineFixtures';

function makeHit(overrides: Partial<QuantizedHit> = {}): QuantizedHit {
  return {
    originalTime: 0,
    quantizedTime: 0,
    gridPosition: 0,
    velocity: 0.8,
    clusterId: 0,
    instrumentId: 'kick-deep',
    hitIndex: 0,
    ...overrides,
  };
}

describe('quantizationStore editing actions', () => {
  beforeEach(() => {
    resetAllStores();
    seedFullTimeline(120, 8, 2);
  });

  describe('setQuantizedHits', () => {
    it('replaces all hits without recompute', () => {
      const newHits = [makeHit({ quantizedTime: 1.0 }), makeHit({ quantizedTime: 2.0 })];
      useQuantizationStore.getState().setQuantizedHits(newHits);
      expect(useQuantizationStore.getState().quantizedHits).toEqual(newHits);
    });
  });

  describe('addHit', () => {
    it('adds hit and maintains sort order', () => {
      const before = useQuantizationStore.getState().quantizedHits.length;
      const newHit = makeHit({ quantizedTime: 0.25, clusterId: 0 });
      useQuantizationStore.getState().addHit(newHit);

      const hits = useQuantizationStore.getState().quantizedHits;
      expect(hits.length).toBe(before + 1);

      // Verify sorted
      for (let i = 1; i < hits.length; i++) {
        const curr = hits[i];
        const prev = hits[i - 1];
        if (curr !== undefined && prev !== undefined) {
          expect(curr.quantizedTime).toBeGreaterThanOrEqual(prev.quantizedTime);
        }
      }
    });
  });

  describe('removeHit', () => {
    it('removes hit at index', () => {
      const before = useQuantizationStore.getState().quantizedHits.length;
      useQuantizationStore.getState().removeHit(0);
      expect(useQuantizationStore.getState().quantizedHits.length).toBe(before - 1);
    });

    it('out of range index removes nothing', () => {
      const before = useQuantizationStore.getState().quantizedHits.length;
      useQuantizationStore.getState().removeHit(999);
      expect(useQuantizationStore.getState().quantizedHits.length).toBe(before);
    });
  });

  describe('updateHitTime', () => {
    it('updates hit time and re-sorts', () => {
      useQuantizationStore.getState().updateHitTime(0, 10.0);
      const hits = useQuantizationStore.getState().quantizedHits;
      const lastHit = hits[hits.length - 1];
      expect(lastHit?.quantizedTime).toBe(10.0);

      // Verify sorted
      for (let i = 1; i < hits.length; i++) {
        const curr = hits[i];
        const prev = hits[i - 1];
        if (curr !== undefined && prev !== undefined) {
          expect(curr.quantizedTime).toBeGreaterThanOrEqual(prev.quantizedTime);
        }
      }
    });
  });
});
