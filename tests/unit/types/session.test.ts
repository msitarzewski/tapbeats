import { describe, it, expect } from 'vitest';

import type { AudioFeatures } from '@/types/audio';
import { SESSION_SCHEMA_VERSION, serializeFeatures, deserializeFeatures } from '@/types/session';

import { MOCK_FEATURES } from '../../helpers/sessionFixtures';

describe('session types', () => {
  describe('SESSION_SCHEMA_VERSION', () => {
    it('is a positive integer', () => {
      expect(SESSION_SCHEMA_VERSION).toBe(1);
    });
  });

  describe('serializeFeatures', () => {
    it('converts AudioFeatures to SerializedAudioFeatures', () => {
      const result = serializeFeatures(MOCK_FEATURES);
      expect(result.rms).toBe(0.5);
      expect(result.spectralCentroid).toBe(2000);
      expect(result.mfcc).toEqual([1, 2, 3, 4, 5]);
    });

    it('creates a mutable copy of mfcc array', () => {
      const result = serializeFeatures(MOCK_FEATURES);
      expect(result.mfcc).not.toBe(MOCK_FEATURES.mfcc);
    });

    it('preserves all fields', () => {
      const result = serializeFeatures(MOCK_FEATURES);
      expect(result).toEqual({
        rms: 0.5,
        spectralCentroid: 2000,
        spectralRolloff: 4000,
        spectralFlatness: 0.3,
        zeroCrossingRate: 0.1,
        attackTime: 0.01,
        decayTime: 0.05,
        mfcc: [1, 2, 3, 4, 5],
      });
    });
  });

  describe('deserializeFeatures', () => {
    it('converts SerializedAudioFeatures back to AudioFeatures', () => {
      const serialized = serializeFeatures(MOCK_FEATURES);
      const result = deserializeFeatures(serialized);
      expect(result.rms).toBe(0.5);
      expect(result.spectralCentroid).toBe(2000);
    });

    it('roundtrip preserves all values', () => {
      const serialized = serializeFeatures(MOCK_FEATURES);
      const result = deserializeFeatures(serialized);
      expect(result).toEqual(MOCK_FEATURES);
    });

    it('handles edge case with empty mfcc', () => {
      const features: AudioFeatures = {
        ...MOCK_FEATURES,
        mfcc: [],
      };
      const serialized = serializeFeatures(features);
      const result = deserializeFeatures(serialized);
      expect(result.mfcc).toEqual([]);
    });

    it('handles zero values', () => {
      const features: AudioFeatures = {
        rms: 0,
        spectralCentroid: 0,
        spectralRolloff: 0,
        spectralFlatness: 0,
        zeroCrossingRate: 0,
        attackTime: 0,
        decayTime: 0,
        mfcc: [0, 0, 0],
      };
      const serialized = serializeFeatures(features);
      const result = deserializeFeatures(serialized);
      expect(result).toEqual(features);
    });
  });
});
