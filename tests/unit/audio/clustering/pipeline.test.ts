import { describe, it, expect } from 'vitest';

import { featuresToVector, runClustering } from '@/audio/clustering/pipeline';
import type { AudioFeatures, DetectedHit } from '@/types/audio';

import {
  seededRng,
  generateClusterPoints,
  createMockDetectedHits,
} from '../../../helpers/clusteringFixtures';

/** Helper to make a DetectedHit with null features */
function makeNullFeatureHit(index: number): DetectedHit {
  return {
    onset: {
      timestamp: index * 0.1,
      strength: 0.5,
      snippetBuffer: new Float32Array(4410),
    },
    features: null,
  };
}

describe('featuresToVector', () => {
  it('produces 12 elements', () => {
    const features: AudioFeatures = {
      rms: 0.5,
      spectralCentroid: 1000,
      spectralRolloff: 0.85,
      spectralFlatness: 0.3,
      zeroCrossingRate: 0.02,
      attackTime: 0.005,
      decayTime: 0.05,
      mfcc: [10, 20, 30, 40, 50],
    };

    const vec = featuresToVector(features);
    expect(vec.length).toBe(12);
  });

  it('produces elements in correct order', () => {
    const features: AudioFeatures = {
      rms: 0.1,
      spectralCentroid: 0.2,
      spectralRolloff: 0.3,
      spectralFlatness: 0.4,
      zeroCrossingRate: 0.5,
      attackTime: 0.6,
      decayTime: 0.7,
      mfcc: [0.8, 0.9, 1.0, 1.1, 1.2],
    };

    const vec = featuresToVector(features);
    expect(vec[0]).toBe(0.1); // rms
    expect(vec[1]).toBe(0.2); // spectralCentroid
    expect(vec[2]).toBe(0.3); // spectralRolloff
    expect(vec[3]).toBe(0.4); // spectralFlatness
    expect(vec[4]).toBe(0.5); // zeroCrossingRate
    expect(vec[5]).toBe(0.6); // attackTime
    expect(vec[6]).toBe(0.7); // decayTime
    expect(vec[7]).toBe(0.8); // mfcc[0]
    expect(vec[8]).toBe(0.9); // mfcc[1]
    expect(vec[9]).toBe(1.0); // mfcc[2]
    expect(vec[10]).toBe(1.1); // mfcc[3]
    expect(vec[11]).toBe(1.2); // mfcc[4]
  });

  it('handles mfcc with fewer than 5 elements', () => {
    const features: AudioFeatures = {
      rms: 1,
      spectralCentroid: 2,
      spectralRolloff: 3,
      spectralFlatness: 4,
      zeroCrossingRate: 5,
      attackTime: 6,
      decayTime: 7,
      mfcc: [10, 20],
    };

    const vec = featuresToVector(features);
    expect(vec.length).toBe(12);
    expect(vec[7]).toBe(10);
    expect(vec[8]).toBe(20);
    expect(vec[9]).toBe(0); // missing → 0
    expect(vec[10]).toBe(0);
    expect(vec[11]).toBe(0);
  });
});

describe('runClustering', () => {
  it('returns k=0 and silhouette=0 for 0 hits', () => {
    const result = runClustering([]);
    expect(result.clusterCount).toBe(0);
    expect(result.silhouette).toBe(0);
    expect(result.assignments).toEqual([]);
  });

  it('returns k=1 and silhouette=1 for 1 hit', () => {
    const rng = seededRng(42);
    const hits = createMockDetectedHits([
      generateClusterPoints([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 1, 0, rng),
    ]);

    const result = runClustering(hits);
    expect(result.clusterCount).toBe(1);
    expect(result.silhouette).toBe(1);
    expect(result.assignments).toEqual([0]);
  });

  it('caps k at 2 for fewer than 5 hits', () => {
    const rng = seededRng(42);
    // 4 hits in 2 well-separated groups
    const hits = createMockDetectedHits([
      generateClusterPoints(new Array<number>(12).fill(0), 2, 0.01, rng),
      generateClusterPoints(new Array<number>(12).fill(100), 2, 0.01, rng),
    ]);

    const result = runClustering(hits);
    expect(result.clusterCount).toBeLessThanOrEqual(2);
  });

  it('identifies 3 well-separated groups', () => {
    const rng = seededRng(42);
    const center1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const center2 = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50];
    const center3 = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];

    const hits = createMockDetectedHits([
      generateClusterPoints(center1, 10, 1, rng),
      generateClusterPoints(center2, 10, 1, rng),
      generateClusterPoints(center3, 10, 1, rng),
    ]);

    const result = runClustering(hits);
    expect(result.clusterCount).toBe(3);
    expect(result.silhouette).toBeGreaterThan(0.5);
  });

  it('skips hits with null features', () => {
    const rng = seededRng(42);
    const validHits = createMockDetectedHits([
      generateClusterPoints(new Array<number>(12).fill(5), 3, 0.1, rng),
    ]);
    const nullHits: DetectedHit[] = [makeNullFeatureHit(100), makeNullFeatureHit(101)];

    const allHits = [...validHits, ...nullHits];
    const result = runClustering(allHits);

    // Only 3 valid hits are processed
    expect(result.featureVectors.length).toBe(3);
    expect(result.assignments.length).toBe(3);
  });

  it('returns k=1 when all features are null', () => {
    const hits: DetectedHit[] = [
      makeNullFeatureHit(0),
      makeNullFeatureHit(1),
      makeNullFeatureHit(2),
    ];

    const result = runClustering(hits);
    // 0 valid hits → clusterCount=0
    expect(result.clusterCount).toBe(0);
    expect(result.assignments).toEqual([]);
  });

  it('returns k=1 for low variance data', () => {
    const rng = seededRng(42);
    // All points extremely close together → variance below 0.01 after normalization
    const center = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
    const hits = createMockDetectedHits([generateClusterPoints(center, 10, 0.0001, rng)]);

    const result = runClustering(hits);
    expect(result.clusterCount).toBe(1);
  });

  it('completes within 2000ms for 200 hits', () => {
    const rng = seededRng(42);
    const center1 = new Array<number>(12).fill(0);
    const center2 = new Array<number>(12).fill(50);
    const center3 = new Array<number>(12).fill(100);

    const hits = createMockDetectedHits([
      generateClusterPoints(center1, 67, 2, rng),
      generateClusterPoints(center2, 67, 2, rng),
      generateClusterPoints(center3, 66, 2, rng),
    ]);

    const start = performance.now();
    const result = runClustering(hits);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
    expect(result.assignments.length).toBe(200);
  });

  it('produces valid silhouette score', () => {
    const rng = seededRng(42);
    const hits = createMockDetectedHits([
      generateClusterPoints(new Array<number>(12).fill(0), 8, 1, rng),
      generateClusterPoints(new Array<number>(12).fill(50), 8, 1, rng),
    ]);

    const result = runClustering(hits);
    expect(result.silhouette).toBeGreaterThanOrEqual(-1);
    expect(result.silhouette).toBeLessThanOrEqual(1);
  });

  it('featureVectors match number of valid hits', () => {
    const rng = seededRng(42);
    const hits = createMockDetectedHits([
      generateClusterPoints(new Array<number>(12).fill(0), 5, 1, rng),
    ]);

    const result = runClustering(hits);
    expect(result.featureVectors.length).toBe(5);
    expect(result.assignments.length).toBe(5);
    expect(result.normalization.normalized.length).toBe(5);
  });

  it('centroids have correct dimensionality', () => {
    const rng = seededRng(42);
    const hits = createMockDetectedHits([
      generateClusterPoints(new Array<number>(12).fill(0), 8, 1, rng),
      generateClusterPoints(new Array<number>(12).fill(50), 8, 1, rng),
    ]);

    const result = runClustering(hits);
    for (const centroid of result.centroids) {
      expect(centroid.length).toBe(12);
    }
  });

  it('returns silhouette=1 for exactly 2 identical-feature hits', () => {
    const point = new Array<number>(12).fill(5);
    const hits = createMockDetectedHits([[point, point]]);

    const result = runClustering(hits);
    // 2 identical points → low variance → k=1, silhouette=0 for k=1 with n>1
    expect(result.clusterCount).toBe(1);
    expect(result.silhouette).toBe(0);
  });
});
