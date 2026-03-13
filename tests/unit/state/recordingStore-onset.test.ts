import { describe, it, expect, beforeEach } from 'vitest';

import { useRecordingStore } from '@/state/recordingStore';
import type { AudioFeatures, DetectedHit, OnsetEvent } from '@/types/audio';

function makeOnset(timestamp: number, strength: number): OnsetEvent {
  return { timestamp, strength, snippetBuffer: null };
}

function makeHit(timestamp: number, strength: number): DetectedHit {
  return { onset: makeOnset(timestamp, strength), features: null };
}

function makeFeatures(overrides: Partial<AudioFeatures> = {}): AudioFeatures {
  return {
    rms: 0.5,
    spectralCentroid: 1000,
    spectralRolloff: 0.85,
    spectralFlatness: 0.3,
    zeroCrossingRate: 0.02,
    attackTime: 0.005,
    decayTime: 0.05,
    mfcc: [1, 2, 3, 4, 5],
    ...overrides,
  };
}

describe('recordingStore onset actions', () => {
  beforeEach(() => {
    useRecordingStore.getState().reset();
  });

  describe('addOnset', () => {
    it('pushes hit to _onsets', () => {
      const hit = makeHit(1.0, 0.8);
      useRecordingStore.getState().addOnset(hit);

      const state = useRecordingStore.getState();
      expect(state._onsets.length).toBe(1);
      expect(state._onsets[0]?.onset.timestamp).toBe(1.0);
    });

    it('pushes timestamp to _onsetTimestamps', () => {
      const hit = makeHit(2.5, 0.6);
      useRecordingStore.getState().addOnset(hit);

      const state = useRecordingStore.getState();
      expect(state._onsetTimestamps.length).toBe(1);
      expect(state._onsetTimestamps[0]).toBe(2.5);
    });

    it('increments hitCount atomically', () => {
      useRecordingStore.getState().addOnset(makeHit(0.5, 0.9));
      expect(useRecordingStore.getState().hitCount).toBe(1);
    });

    it('accumulates multiple onsets', () => {
      useRecordingStore.getState().addOnset(makeHit(0.5, 0.9));
      useRecordingStore.getState().addOnset(makeHit(1.0, 0.7));
      useRecordingStore.getState().addOnset(makeHit(1.5, 0.8));

      const state = useRecordingStore.getState();
      expect(state._onsets.length).toBe(3);
      expect(state._onsetTimestamps.length).toBe(3);
      expect(state.hitCount).toBe(3);
    });

    it('preserves onset data correctly', () => {
      const hit = makeHit(3.14, 0.42);
      useRecordingStore.getState().addOnset(hit);

      const stored = useRecordingStore.getState()._onsets[0];
      expect(stored?.onset.timestamp).toBe(3.14);
      expect(stored?.onset.strength).toBe(0.42);
      expect(stored?.features).toBeNull();
    });
  });

  describe('setSensitivity', () => {
    it('updates _sensitivity to high', () => {
      useRecordingStore.getState().setSensitivity('high');
      expect(useRecordingStore.getState()._sensitivity).toBe('high');
    });

    it('updates _sensitivity to medium', () => {
      useRecordingStore.getState().setSensitivity('high');
      useRecordingStore.getState().setSensitivity('medium');
      expect(useRecordingStore.getState()._sensitivity).toBe('medium');
    });

    it('updates _sensitivity to low', () => {
      useRecordingStore.getState().setSensitivity('low');
      expect(useRecordingStore.getState()._sensitivity).toBe('low');
    });
  });

  describe('updateHitFeatures', () => {
    it('updates features at valid index', () => {
      useRecordingStore.getState().addOnset(makeHit(1.0, 0.5));
      const features = makeFeatures({ rms: 0.9 });

      useRecordingStore.getState().updateHitFeatures(0, features);

      const stored = useRecordingStore.getState()._onsets[0];
      expect(stored?.features).not.toBeNull();
      expect(stored?.features?.rms).toBe(0.9);
    });

    it('ignores invalid index (out of bounds)', () => {
      useRecordingStore.getState().addOnset(makeHit(1.0, 0.5));
      const features = makeFeatures();

      // Should not throw or modify state
      useRecordingStore.getState().updateHitFeatures(5, features);

      const state = useRecordingStore.getState();
      expect(state._onsets.length).toBe(1);
      expect(state._onsets[0]?.features).toBeNull();
    });

    it('ignores negative index', () => {
      useRecordingStore.getState().addOnset(makeHit(1.0, 0.5));
      const features = makeFeatures();

      useRecordingStore.getState().updateHitFeatures(-1, features);
      expect(useRecordingStore.getState()._onsets[0]?.features).toBeNull();
    });

    it('updates only the specified hit, leaving others unchanged', () => {
      useRecordingStore.getState().addOnset(makeHit(1.0, 0.5));
      useRecordingStore.getState().addOnset(makeHit(2.0, 0.6));

      const features = makeFeatures({ rms: 0.99 });
      useRecordingStore.getState().updateHitFeatures(1, features);

      const state = useRecordingStore.getState();
      expect(state._onsets[0]?.features).toBeNull();
      expect(state._onsets[1]?.features?.rms).toBe(0.99);
    });
  });

  describe('reset', () => {
    it('clears _onsets', () => {
      useRecordingStore.getState().addOnset(makeHit(1.0, 0.5));
      useRecordingStore.getState().addOnset(makeHit(2.0, 0.6));

      useRecordingStore.getState().reset();
      expect(useRecordingStore.getState()._onsets).toEqual([]);
    });

    it('clears _onsetTimestamps', () => {
      useRecordingStore.getState().addOnset(makeHit(1.0, 0.5));

      useRecordingStore.getState().reset();
      expect(useRecordingStore.getState()._onsetTimestamps).toEqual([]);
    });

    it('resets _sensitivity to medium', () => {
      useRecordingStore.getState().setSensitivity('high');

      useRecordingStore.getState().reset();
      expect(useRecordingStore.getState()._sensitivity).toBe('medium');
    });

    it('resets hitCount to 0', () => {
      useRecordingStore.getState().addOnset(makeHit(1.0, 0.5));
      useRecordingStore.getState().addOnset(makeHit(2.0, 0.6));

      useRecordingStore.getState().reset();
      expect(useRecordingStore.getState().hitCount).toBe(0);
    });
  });
});
