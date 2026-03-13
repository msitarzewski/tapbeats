import { describe, it, expect } from 'vitest';

import { splitCluster, mergeClusters, computeCentroids } from '@/audio/clustering/operations';

import { seededRng, generateClusterPoints } from '../../../helpers/clusteringFixtures';

describe('splitCluster', () => {
  it('increases cluster count by 1', () => {
    const rng = seededRng(42);
    const features = [
      ...generateClusterPoints([0, 0], 10, 0.5, rng),
      ...generateClusterPoints([10, 10], 10, 0.5, rng),
    ];
    const assignments = [...new Array<number>(10).fill(0), ...new Array<number>(10).fill(1)];

    const result = splitCluster(features, assignments, 0, seededRng(7));
    const uniqueBefore = new Set(assignments).size;
    const uniqueAfter = new Set(result.assignments).size;

    expect(uniqueAfter).toBe(uniqueBefore + 1);
  });

  it('assigns split points to exactly 2 sub-groups', () => {
    const rng = seededRng(42);
    const features = generateClusterPoints([5, 5], 20, 3, rng);
    const assignments = new Array<number>(20).fill(0);

    const result = splitCluster(features, assignments, 0, seededRng(7));
    const unique = new Set(result.assignments);
    expect(unique.size).toBe(2);
  });

  it('returns unchanged assignments for cluster with 1 point', () => {
    const features = [
      [1, 1],
      [2, 2],
      [3, 3],
    ];
    const assignments = [0, 1, 2];

    const result = splitCluster(features, assignments, 0, seededRng(7));
    // Cluster 0 has only 1 point → no split
    expect(new Set(result.assignments).size).toBe(3);
  });

  it('returns unchanged assignments for cluster with 0 points', () => {
    const features = [
      [1, 1],
      [2, 2],
    ];
    const assignments = [0, 1];

    const result = splitCluster(features, assignments, 5, seededRng(7));
    // Cluster 5 doesn't exist → no split possible
    expect(new Set(result.assignments).size).toBe(2);
  });

  it('preserves total point count', () => {
    const rng = seededRng(42);
    const features = generateClusterPoints([0, 0], 20, 2, rng);
    const assignments = new Array<number>(20).fill(0);

    const result = splitCluster(features, assignments, 0, seededRng(7));
    expect(result.assignments.length).toBe(20);
  });

  it('produces contiguous IDs after split', () => {
    const rng = seededRng(42);
    const features = [
      ...generateClusterPoints([0, 0], 10, 0.5, rng),
      ...generateClusterPoints([10, 10], 10, 0.5, rng),
    ];
    const assignments = [...new Array<number>(10).fill(0), ...new Array<number>(10).fill(1)];

    const result = splitCluster(features, assignments, 0, seededRng(7));
    const ids = [...new Set(result.assignments)].sort((a, b) => a - b);
    // Should be contiguous: 0, 1, 2
    for (let i = 0; i < ids.length; i++) {
      expect(ids[i]).toBe(i);
    }
  });
});

describe('mergeClusters', () => {
  it('decreases unique cluster count by 1', () => {
    const features = [
      [0, 0],
      [1, 1],
      [10, 10],
      [11, 11],
    ];
    const assignments = [0, 0, 1, 1];

    const result = mergeClusters(features, assignments, 0, 1);
    expect(new Set(result.assignments).size).toBe(1);
  });

  it('preserves total point count', () => {
    const features = [
      [0, 0],
      [1, 1],
      [10, 10],
      [11, 11],
      [20, 20],
    ];
    const assignments = [0, 0, 1, 1, 2];

    const result = mergeClusters(features, assignments, 0, 1);
    expect(result.assignments.length).toBe(5);
  });

  it('produces contiguous IDs after merge', () => {
    const features = [
      [0, 0],
      [1, 1],
      [10, 10],
      [11, 11],
      [20, 20],
    ];
    const assignments = [0, 0, 1, 1, 2];

    const result = mergeClusters(features, assignments, 0, 1);
    const ids = [...new Set(result.assignments)].sort((a, b) => a - b);
    for (let i = 0; i < ids.length; i++) {
      expect(ids[i]).toBe(i);
    }
  });

  it('reassigns all clusterB points to clusterA', () => {
    const features = [
      [0, 0],
      [1, 1],
      [10, 10],
      [11, 11],
    ];
    const assignments = [0, 0, 1, 1];

    const result = mergeClusters(features, assignments, 0, 1);
    // All points should be in one cluster
    const unique = new Set(result.assignments);
    expect(unique.size).toBe(1);
    expect(result.assignments[2]).toBe(result.assignments[0]);
  });
});

describe('computeCentroids', () => {
  it('computes correct centroid for known data', () => {
    const features = [
      [0, 0],
      [2, 4],
      [4, 8],
    ];
    const assignments = [0, 0, 0];

    const centroids = computeCentroids(features, assignments);
    expect(centroids.length).toBe(1);
    expect(centroids[0]?.[0]).toBeCloseTo(2, 10);
    expect(centroids[0]?.[1]).toBeCloseTo(4, 10);
  });

  it('computes separate centroids per cluster', () => {
    const features = [
      [0, 0],
      [2, 2],
      [10, 10],
      [12, 12],
    ];
    const assignments = [0, 0, 1, 1];

    const centroids = computeCentroids(features, assignments);
    expect(centroids.length).toBe(2);
    expect(centroids[0]?.[0]).toBeCloseTo(1, 10);
    expect(centroids[0]?.[1]).toBeCloseTo(1, 10);
    expect(centroids[1]?.[0]).toBeCloseTo(11, 10);
    expect(centroids[1]?.[1]).toBeCloseTo(11, 10);
  });

  it('returns empty array for empty features', () => {
    expect(computeCentroids([], [])).toEqual([]);
  });
});

describe('split then merge round-trip', () => {
  it('returns to original cluster count after split then merge', () => {
    const rng = seededRng(42);
    const features = generateClusterPoints([5, 5], 20, 2, rng);
    const assignments = new Array<number>(20).fill(0);
    const originalCount = new Set(assignments).size;

    const splitResult = splitCluster(features, assignments, 0, seededRng(7));
    const splitIds = [...new Set(splitResult.assignments)].sort((a, b) => a - b);
    expect(splitIds.length).toBe(originalCount + 1);

    const mergeResult = mergeClusters(
      features,
      splitResult.assignments,
      splitIds[0] ?? 0,
      splitIds[1] ?? 1,
    );
    expect(new Set(mergeResult.assignments).size).toBe(originalCount);
  });
});
