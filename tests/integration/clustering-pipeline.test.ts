import { describe, it, expect } from 'vitest';

import { runClustering } from '@/audio/clustering/pipeline';
import type { DetectedHit } from '@/types/audio';

import {
  seededRng,
  generateClusterPoints,
  createMockDetectedHits,
} from '../helpers/clusteringFixtures';

describe('clustering pipeline integration', () => {
  it('clusters 3 distinct groups correctly with silhouette > 0.5', () => {
    const rng = seededRng(42);
    const center1 = new Array<number>(12).fill(0);
    const center2 = new Array<number>(12).fill(50);
    const center3 = new Array<number>(12).fill(100);

    const hits = createMockDetectedHits([
      generateClusterPoints(center1, 10, 1, rng),
      generateClusterPoints(center2, 10, 1, rng),
      generateClusterPoints(center3, 10, 1, rng),
    ]);

    const result = runClustering(hits);

    expect(result.clusterCount).toBe(3);
    expect(result.silhouette).toBeGreaterThan(0.5);
  });

  it('merges 2 identical groups into 1 cluster', () => {
    const rng = seededRng(42);
    // Two groups with identical center and tiny noise → effectively same cluster
    const center = new Array<number>(12).fill(10);
    const hits = createMockDetectedHits([
      generateClusterPoints(center, 10, 0.0001, rng),
      generateClusterPoints(center, 10, 0.0001, rng),
    ]);

    const result = runClustering(hits);
    expect(result.clusterCount).toBe(1);
  });

  it('returns k=1 for a single group', () => {
    const rng = seededRng(42);
    const center = new Array<number>(12).fill(5);
    const hits = createMockDetectedHits([generateClusterPoints(center, 15, 0.001, rng)]);

    const result = runClustering(hits);
    expect(result.clusterCount).toBe(1);
  });

  it('handles 100 hits without error', () => {
    const rng = seededRng(42);
    const center1 = new Array<number>(12).fill(0);
    const center2 = new Array<number>(12).fill(50);

    const hits = createMockDetectedHits([
      generateClusterPoints(center1, 50, 2, rng),
      generateClusterPoints(center2, 50, 2, rng),
    ]);

    const result = runClustering(hits);
    expect(result.assignments.length).toBe(100);
    expect(result.clusterCount).toBeGreaterThanOrEqual(1);
    expect(result.featureVectors.length).toBe(100);
  });

  it('assigns all points from the same group to the same cluster', () => {
    const rng = seededRng(42);
    const center1 = new Array<number>(12).fill(0);
    const center2 = new Array<number>(12).fill(80);
    const center3 = new Array<number>(12).fill(160);

    const group1Size = 8;
    const group2Size = 8;
    const group3Size = 8;

    const hits = createMockDetectedHits([
      generateClusterPoints(center1, group1Size, 0.5, rng),
      generateClusterPoints(center2, group2Size, 0.5, rng),
      generateClusterPoints(center3, group3Size, 0.5, rng),
    ]);

    const result = runClustering(hits);

    // Group 1: indices 0..7 should all have the same assignment
    const group1Assignment = result.assignments[0] ?? -1;
    for (let i = 0; i < group1Size; i++) {
      expect(result.assignments[i]).toBe(group1Assignment);
    }

    // Group 2: indices 8..15 should all have the same assignment
    const group2Assignment = result.assignments[group1Size] ?? -1;
    for (let i = group1Size; i < group1Size + group2Size; i++) {
      expect(result.assignments[i]).toBe(group2Assignment);
    }

    // Group 3: indices 16..23 should all have the same assignment
    const group3Assignment = result.assignments[group1Size + group2Size] ?? -1;
    for (let i = group1Size + group2Size; i < group1Size + group2Size + group3Size; i++) {
      expect(result.assignments[i]).toBe(group3Assignment);
    }

    // All three groups should have different assignments
    const uniqueGroups = new Set([group1Assignment, group2Assignment, group3Assignment]);
    expect(uniqueGroups.size).toBe(3);
  });

  it('returns normalization parameters matching feature vector count', () => {
    const rng = seededRng(42);
    const hits = createMockDetectedHits([
      generateClusterPoints(new Array<number>(12).fill(0), 10, 1, rng),
      generateClusterPoints(new Array<number>(12).fill(50), 10, 1, rng),
    ]);

    const result = runClustering(hits);
    expect(result.normalization.normalized.length).toBe(20);
    expect(result.normalization.mins.length).toBe(12);
    expect(result.normalization.maxes.length).toBe(12);
  });

  it('produces valid centroid count matching cluster count', () => {
    const rng = seededRng(42);
    const hits = createMockDetectedHits([
      generateClusterPoints(new Array<number>(12).fill(0), 10, 1, rng),
      generateClusterPoints(new Array<number>(12).fill(50), 10, 1, rng),
      generateClusterPoints(new Array<number>(12).fill(100), 10, 1, rng),
    ]);

    const result = runClustering(hits);
    expect(result.centroids.length).toBe(result.clusterCount);
  });

  it('handles hits with mixed null and valid features', () => {
    const rng = seededRng(42);
    const validHits = createMockDetectedHits([
      generateClusterPoints(new Array<number>(12).fill(0), 10, 1, rng),
      generateClusterPoints(new Array<number>(12).fill(50), 10, 1, rng),
    ]);
    const nullHits: DetectedHit[] = Array.from({ length: 5 }, (_, i) => ({
      onset: { timestamp: (100 + i) * 0.1, strength: 0.5, snippetBuffer: new Float32Array(4410) },
      features: null,
    }));

    const result = runClustering([...validHits, ...nullHits]);
    // Only 20 valid hits should be processed
    expect(result.featureVectors.length).toBe(20);
    expect(result.assignments.length).toBe(20);
  });
});
