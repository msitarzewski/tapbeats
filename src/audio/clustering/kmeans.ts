/**
 * K-means clustering with k-means++ initialization.
 * All functions are pure with no side effects.
 */

import type { ClusterResult } from '@/types/clustering';

import { euclideanDistanceSquared } from './distance';

interface KMeansOptions {
  readonly maxIterations?: number;
  readonly tolerance?: number;
  readonly rng?: () => number;
}

/**
 * K-means++ initialization: select k initial centroids with probability
 * proportional to squared distance from nearest existing centroid.
 */
export function kMeansPlusPlusInit(
  data: number[][],
  k: number,
  rng: () => number = Math.random,
): number[][] {
  const n = data.length;
  if (n === 0 || k <= 0) return [];
  if (k >= n) return data.map((row) => [...row]);

  const centroids: number[][] = [];

  // Pick first centroid uniformly at random
  const firstIdx = Math.floor(rng() * n);
  centroids.push([...(data[firstIdx] ?? [])]);

  // Distances from each point to its nearest centroid
  const minDists = new Float64Array(n);
  minDists.fill(Infinity);

  for (let c = 1; c < k; c++) {
    const lastCentroid = centroids[c - 1] ?? [];

    // Update min distances with the newly added centroid
    let totalDist = 0;
    for (let i = 0; i < n; i++) {
      const d = euclideanDistanceSquared(data[i] ?? [], lastCentroid);
      if (d < (minDists[i] ?? Infinity)) {
        minDists[i] = d;
      }
      totalDist += minDists[i] ?? 0;
    }

    // If all distances are 0, pick randomly
    if (totalDist === 0) {
      const idx = Math.floor(rng() * n);
      centroids.push([...(data[idx] ?? [])]);
      continue;
    }

    // Weighted random selection
    const threshold = rng() * totalDist;
    let cumulative = 0;
    let chosenIdx = 0;
    for (let i = 0; i < n; i++) {
      cumulative += minDists[i] ?? 0;
      if (cumulative >= threshold) {
        chosenIdx = i;
        break;
      }
    }
    centroids.push([...(data[chosenIdx] ?? [])]);
  }

  return centroids;
}

/**
 * Lloyd's k-means algorithm.
 * Dead centroid handling: if a centroid has 0 assigned points, reinitialize it
 * to the data point farthest from its nearest centroid.
 */
export function kMeans(data: number[][], k: number, options?: KMeansOptions): ClusterResult {
  const maxIterations = options?.maxIterations ?? 100;
  const tolerance = options?.tolerance ?? 1e-6;
  const rng = options?.rng ?? Math.random;

  const n = data.length;

  if (n === 0) {
    return { assignments: [], centroids: [], iterations: 0, converged: true };
  }

  const effectiveK = Math.min(k, n);
  const dims = (data[0] ?? []).length;

  // Initialize centroids with k-means++
  let centroids = kMeansPlusPlusInit(data, effectiveK, rng);
  const assignments = new Array<number>(n).fill(0);

  let converged = false;
  let iter = 0;

  for (iter = 0; iter < maxIterations; iter++) {
    // Assignment step: assign each point to nearest centroid
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < effectiveK; c++) {
        const d = euclideanDistanceSquared(data[i] ?? [], centroids[c] ?? []);
        if (d < minDist) {
          minDist = d;
          bestCluster = c;
        }
      }
      assignments[i] = bestCluster;
    }

    // Update step: compute new centroids
    const newCentroids: number[][] = [];
    const counts = new Array<number>(effectiveK).fill(0);

    for (let c = 0; c < effectiveK; c++) {
      newCentroids.push(new Array<number>(dims).fill(0));
    }

    for (let i = 0; i < n; i++) {
      const cluster = assignments[i] ?? 0;
      counts[cluster] = (counts[cluster] ?? 0) + 1;
      const centroid = newCentroids[cluster] ?? [];
      const point = data[i] ?? [];
      for (let d = 0; d < dims; d++) {
        centroid[d] = (centroid[d] ?? 0) + (point[d] ?? 0);
      }
    }

    // Finalize centroids and handle dead centroids
    for (let c = 0; c < effectiveK; c++) {
      const count = counts[c] ?? 0;
      if (count === 0) {
        // Dead centroid: reinitialize to farthest point from its nearest centroid
        newCentroids[c] = findFarthestPoint(data, centroids);
      } else {
        const centroid = newCentroids[c] ?? [];
        for (let d = 0; d < dims; d++) {
          centroid[d] = (centroid[d] ?? 0) / count;
        }
      }
    }

    // Check convergence: max centroid shift
    let maxShift = 0;
    for (let c = 0; c < effectiveK; c++) {
      const shift = euclideanDistanceSquared(centroids[c] ?? [], newCentroids[c] ?? []);
      if (shift > maxShift) {
        maxShift = shift;
      }
    }

    centroids = newCentroids;

    if (maxShift < tolerance * tolerance) {
      converged = true;
      iter++;
      break;
    }
  }

  return {
    assignments: [...assignments],
    centroids,
    iterations: iter,
    converged,
  };
}

/**
 * Find the data point farthest from its nearest centroid.
 * Used for dead centroid reinitialization.
 */
function findFarthestPoint(data: number[][], centroids: number[][]): number[] {
  let maxDist = -1;
  let farthestIdx = 0;

  for (let i = 0; i < data.length; i++) {
    let minDistToCentroid = Infinity;
    for (const centroid of centroids) {
      const d = euclideanDistanceSquared(data[i] ?? [], centroid);
      if (d < minDistToCentroid) {
        minDistToCentroid = d;
      }
    }
    if (minDistToCentroid > maxDist) {
      maxDist = minDistToCentroid;
      farthestIdx = i;
    }
  }

  return [...(data[farthestIdx] ?? [])];
}
