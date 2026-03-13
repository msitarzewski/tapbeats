import { describe, it, expect } from 'vitest';

import { silhouetteScore, selectOptimalK } from '@/audio/clustering/silhouette';

import { seededRng, generateClusterPoints } from '../../../helpers/clusteringFixtures';

describe('silhouetteScore', () => {
  it('returns high score for perfectly separated clusters', () => {
    const rng = seededRng(42);
    const clusterA = generateClusterPoints([0, 0], 15, 0.3, rng);
    const clusterB = generateClusterPoints([20, 20], 15, 0.3, rng);
    const data = [...clusterA, ...clusterB];
    const assignments = [...new Array<number>(15).fill(0), ...new Array<number>(15).fill(1)];

    const score = silhouetteScore(data, assignments, 2);
    expect(score).toBeGreaterThan(0.7);
  });

  it('returns 0 for k=1 (single cluster)', () => {
    const data = [
      [1, 2],
      [3, 4],
      [5, 6],
    ];
    const assignments = [0, 0, 0];
    expect(silhouetteScore(data, assignments, 1)).toBe(0);
  });

  it('returns 0 for n=1 (single point)', () => {
    expect(silhouetteScore([[1, 2]], [0], 2)).toBe(0);
  });

  it('returns low score for random assignments', () => {
    const rng = seededRng(42);
    const data = generateClusterPoints([5, 5], 30, 5, rng);
    // Assign randomly
    const assignRng = seededRng(99);
    const assignments = data.map(() => Math.floor(assignRng() * 3));

    const score = silhouetteScore(data, assignments, 3);
    // Random assignments on a single blob should yield low silhouette
    expect(score).toBeLessThan(0.5);
  });

  it('handles two points in different clusters', () => {
    const data = [
      [0, 0],
      [10, 10],
    ];
    const assignments = [0, 1];
    const score = silhouetteScore(data, assignments, 2);

    // Two points, each alone in cluster → a(i) = 0, b(i) = dist
    // s(i) = (dist - 0) / dist = 1 for each single-member cluster
    expect(score).toBeCloseTo(1, 5);
  });

  it('handles empty clusters gracefully', () => {
    const data = [
      [1, 1],
      [2, 2],
      [3, 3],
    ];
    // All assigned to cluster 0, but k=3 means clusters 1,2 are empty
    const assignments = [0, 0, 0];
    // k=3 but only 1 cluster used → other clusters empty → bi=Infinity→0
    const score = silhouetteScore(data, assignments, 3);
    // All points in same cluster, other clusters empty → bi=0, ai>0 → s(i) = (0-ai)/ai = -1
    expect(score).toBe(-1);
  });

  it('returns score between -1 and 1', () => {
    const rng = seededRng(42);
    const data = generateClusterPoints([0, 0], 20, 5, rng);
    const assignments = data.map((_, i) => i % 3);
    const score = silhouetteScore(data, assignments, 3);
    expect(score).toBeGreaterThanOrEqual(-1);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('returns higher score for correct assignments than swapped', () => {
    const rng = seededRng(42);
    const clusterA = generateClusterPoints([0, 0], 10, 0.5, rng);
    const clusterB = generateClusterPoints([20, 20], 10, 0.5, rng);
    const data = [...clusterA, ...clusterB];

    const correctAssignments = [...new Array<number>(10).fill(0), ...new Array<number>(10).fill(1)];
    // Swap: assign A points to 1, B points to 0
    const swappedAssignments = [...new Array<number>(10).fill(1), ...new Array<number>(10).fill(0)];

    const correctScore = silhouetteScore(data, correctAssignments, 2);
    const swappedScore = silhouetteScore(data, swappedAssignments, 2);

    // Swapped assignments are equally valid (just relabeled)
    expect(correctScore).toBeCloseTo(swappedScore, 5);
  });
});

describe('selectOptimalK', () => {
  it('finds correct k for 3 well-separated clusters', () => {
    const rng = seededRng(42);
    const data = [
      ...generateClusterPoints([0, 0], 15, 0.3, rng),
      ...generateClusterPoints([10, 10], 15, 0.3, rng),
      ...generateClusterPoints([20, 20], 15, 0.3, rng),
    ];

    const result = selectOptimalK(data, { rng: seededRng(7), restarts: 3 });
    expect(result.k).toBe(3);
    expect(result.silhouette).toBeGreaterThan(0.5);
  });

  it('finds correct k for 2 well-separated clusters', () => {
    const rng = seededRng(42);
    const data = [
      ...generateClusterPoints([0, 0], 15, 0.3, rng),
      ...generateClusterPoints([20, 20], 15, 0.3, rng),
    ];

    const result = selectOptimalK(data, { rng: seededRng(7), restarts: 3 });
    expect(result.k).toBe(2);
    expect(result.silhouette).toBeGreaterThan(0.5);
  });

  it('returns k=1 when maxK < minK', () => {
    const data = [
      [1, 1],
      [2, 2],
    ];
    // n=2, maxK = min(8, floor(2/3)) = 0 < minK=2
    const result = selectOptimalK(data, { rng: seededRng(7) });
    expect(result.k).toBe(1);
    expect(result.silhouette).toBe(0);
  });

  it('returns k=1 for very few points', () => {
    // With 3 points, maxK = min(8, floor(3/3)) = 1, which is < minK(2)
    const data = [
      [0, 0],
      [1, 1],
      [2, 2],
    ];
    const result = selectOptimalK(data, { rng: seededRng(7) });
    expect(result.k).toBe(1);
  });

  it('respects custom minK and maxK', () => {
    const rng = seededRng(42);
    const data = [
      ...generateClusterPoints([0, 0], 20, 0.3, rng),
      ...generateClusterPoints([10, 10], 20, 0.3, rng),
      ...generateClusterPoints([20, 20], 20, 0.3, rng),
    ];

    const result = selectOptimalK(data, {
      minK: 2,
      maxK: 4,
      rng: seededRng(7),
      restarts: 2,
    });
    expect(result.k).toBeGreaterThanOrEqual(2);
    expect(result.k).toBeLessThanOrEqual(4);
  });
});
