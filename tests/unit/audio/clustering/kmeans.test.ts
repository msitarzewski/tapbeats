import { describe, it, expect } from 'vitest';

import { euclideanDistance } from '@/audio/clustering/distance';
import { kMeansPlusPlusInit, kMeans } from '@/audio/clustering/kmeans';

import { seededRng, generateClusterPoints } from '../../../helpers/clusteringFixtures';

describe('kMeansPlusPlusInit', () => {
  it('returns k centroids', () => {
    const rng = seededRng(42);
    const data = generateClusterPoints([0, 0], 20, 1, rng);
    const centroids = kMeansPlusPlusInit(data, 3, seededRng(99));
    expect(centroids.length).toBe(3);
  });

  it('returns centroids with correct dimensionality', () => {
    const rng = seededRng(42);
    const data = generateClusterPoints([0, 0, 0, 0], 10, 1, rng);
    const centroids = kMeansPlusPlusInit(data, 2, seededRng(99));
    for (const c of centroids) {
      expect(c.length).toBe(4);
    }
  });

  it('spreads centroids apart for well-separated data', () => {
    const rng = seededRng(42);
    const data = [
      ...generateClusterPoints([0, 0], 10, 0.1, rng),
      ...generateClusterPoints([20, 20], 10, 0.1, rng),
    ];
    const centroids = kMeansPlusPlusInit(data, 2, seededRng(99));

    const dist = euclideanDistance(centroids[0] ?? [], centroids[1] ?? []);
    // Centroids should be far apart, not both near the same cluster
    expect(dist).toBeGreaterThan(5);
  });

  it('returns empty array for k=0', () => {
    expect(kMeansPlusPlusInit([[1, 2]], 0)).toEqual([]);
  });

  it('returns empty array for empty data', () => {
    expect(kMeansPlusPlusInit([], 3)).toEqual([]);
  });

  it('returns copies of all data when k >= n', () => {
    const data = [
      [1, 2],
      [3, 4],
    ];
    const centroids = kMeansPlusPlusInit(data, 5);
    expect(centroids.length).toBe(2);
  });
});

describe('kMeans', () => {
  it('converges for well-separated clusters', () => {
    const rng = seededRng(42);
    const data = [
      ...generateClusterPoints([0, 0], 15, 0.5, rng),
      ...generateClusterPoints([10, 10], 15, 0.5, rng),
      ...generateClusterPoints([20, 20], 15, 0.5, rng),
    ];

    const result = kMeans(data, 3, { rng: seededRng(7) });
    expect(result.converged).toBe(true);
  });

  it('returns correct k centroids', () => {
    const rng = seededRng(42);
    const data = [
      ...generateClusterPoints([0, 0], 10, 0.5, rng),
      ...generateClusterPoints([10, 10], 10, 0.5, rng),
    ];

    const result = kMeans(data, 2, { rng: seededRng(7) });
    expect(result.centroids.length).toBe(2);
  });

  it('assignments cover all k cluster IDs', () => {
    const rng = seededRng(42);
    const data = [
      ...generateClusterPoints([0, 0], 15, 0.5, rng),
      ...generateClusterPoints([10, 10], 15, 0.5, rng),
      ...generateClusterPoints([20, 20], 15, 0.5, rng),
    ];

    const result = kMeans(data, 3, { rng: seededRng(7) });
    const uniqueAssignments = new Set(result.assignments);
    expect(uniqueAssignments.size).toBe(3);
  });

  it('assigns everything to cluster 0 when k=1', () => {
    const rng = seededRng(42);
    const data = generateClusterPoints([5, 5], 20, 2, rng);

    const result = kMeans(data, 1, { rng: seededRng(7) });
    for (const a of result.assignments) {
      expect(a).toBe(0);
    }
    expect(result.centroids.length).toBe(1);
  });

  it('respects maxIterations', () => {
    const rng = seededRng(42);
    const data = generateClusterPoints([0, 0], 50, 10, rng);

    const result = kMeans(data, 5, { maxIterations: 3, rng: seededRng(7) });
    expect(result.iterations).toBeLessThanOrEqual(3);
  });

  it('converges quickly with identical data', () => {
    const data = Array.from({ length: 10 }, () => [5, 5, 5]);

    const result = kMeans(data, 1, { rng: seededRng(7) });
    expect(result.converged).toBe(true);
    expect(result.iterations).toBeLessThanOrEqual(2);
  });

  it('returns empty result for empty data', () => {
    const result = kMeans([], 3);
    expect(result.assignments).toEqual([]);
    expect(result.centroids).toEqual([]);
    expect(result.converged).toBe(true);
  });

  it('produces deterministic results with seeded rng', () => {
    const rng = seededRng(42);
    const data = [
      ...generateClusterPoints([0, 0], 10, 1, rng),
      ...generateClusterPoints([10, 10], 10, 1, rng),
    ];

    const result1 = kMeans(data, 2, { rng: seededRng(123) });
    const result2 = kMeans(data, 2, { rng: seededRng(123) });

    expect(result1.assignments).toEqual(result2.assignments);
    expect(result1.iterations).toBe(result2.iterations);
  });

  it('handles case where effectiveK is capped to n', () => {
    const data = [
      [1, 1],
      [2, 2],
    ];
    const result = kMeans(data, 10, { rng: seededRng(7) });

    // effectiveK = min(10, 2) = 2
    expect(result.centroids.length).toBe(2);
    expect(result.assignments.length).toBe(2);
  });

  it('assigns points correctly for well-separated data', () => {
    const rng = seededRng(42);
    const groupA = generateClusterPoints([0, 0], 10, 0.3, rng);
    const groupB = generateClusterPoints([20, 20], 10, 0.3, rng);
    const data = [...groupA, ...groupB];

    const result = kMeans(data, 2, { rng: seededRng(7) });

    // All points in groupA should have the same assignment
    const assignmentA = result.assignments[0] ?? 0;
    for (let i = 0; i < 10; i++) {
      expect(result.assignments[i]).toBe(assignmentA);
    }

    // All points in groupB should have the same assignment, different from A
    const assignmentB = result.assignments[10] ?? 0;
    expect(assignmentB).not.toBe(assignmentA);
    for (let i = 10; i < 20; i++) {
      expect(result.assignments[i]).toBe(assignmentB);
    }
  });

  it('reinitializes dead centroids', () => {
    // Create data where one centroid is likely to become dead:
    // 2 very tight clusters and k=3 → one centroid may get no points
    const rng = seededRng(42);
    const data = [
      ...generateClusterPoints([0, 0], 20, 0.01, rng),
      ...generateClusterPoints([50, 50], 20, 0.01, rng),
    ];

    const result = kMeans(data, 3, { rng: seededRng(7) });

    // After dead centroid reinitialization, we should still get valid assignments
    expect(result.assignments.length).toBe(40);
    for (const a of result.assignments) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(3);
    }
  });
});
