/**
 * Silhouette score computation and optimal k selection.
 * All functions are pure with no side effects.
 */

import { euclideanDistance } from './distance';
import { kMeans } from './kmeans';

/**
 * Average silhouette coefficient across all data points.
 * For k=1, returns 0 (undefined by convention).
 */
export function silhouetteScore(data: number[][], assignments: number[], k: number): number {
  const n = data.length;
  if (n <= 1 || k <= 1) return 0;

  // Group indices by cluster
  const clusters: number[][] = new Array<number[]>(k);
  for (let c = 0; c < k; c++) {
    clusters[c] = [];
  }
  for (let i = 0; i < n; i++) {
    const cluster = assignments[i] ?? 0;
    (clusters[cluster] ?? []).push(i);
  }

  let totalSilhouette = 0;

  for (let i = 0; i < n; i++) {
    const clusterI = assignments[i] ?? 0;
    const myCluster = clusters[clusterI] ?? [];

    // a(i): average distance to points in same cluster
    let ai = 0;
    if (myCluster.length > 1) {
      let sum = 0;
      for (const j of myCluster) {
        if (j !== i) {
          sum += euclideanDistance(data[i] ?? [], data[j] ?? []);
        }
      }
      ai = sum / (myCluster.length - 1);
    }

    // b(i): minimum average distance to points in any other cluster
    let bi = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === clusterI) continue;
      const otherCluster = clusters[c] ?? [];
      if (otherCluster.length === 0) continue;
      let sum = 0;
      for (const j of otherCluster) {
        sum += euclideanDistance(data[i] ?? [], data[j] ?? []);
      }
      const avgDist = sum / otherCluster.length;
      if (avgDist < bi) {
        bi = avgDist;
      }
    }

    // If only one cluster has points, silhouette is 0
    if (bi === Infinity) {
      bi = 0;
    }

    const maxAB = Math.max(ai, bi);
    const si = maxAB === 0 ? 0 : (bi - ai) / maxAB;
    totalSilhouette += si;
  }

  return totalSilhouette / n;
}

interface SelectOptimalKOptions {
  readonly minK?: number;
  readonly maxK?: number;
  readonly restarts?: number;
  readonly rng?: () => number;
}

/**
 * Test k values from minK to min(maxK, floor(n/3)) and pick the k
 * with the best average silhouette score across restarts.
 */
export function selectOptimalK(
  data: number[][],
  options?: SelectOptimalKOptions,
): { k: number; silhouette: number } {
  const minK = options?.minK ?? 2;
  const maxKOption = options?.maxK ?? 8;
  const restarts = options?.restarts ?? 3;
  const rng = options?.rng ?? Math.random;

  const n = data.length;
  const maxK = Math.min(maxKOption, Math.floor(n / 3));

  if (maxK < minK) {
    // Cannot test any k, return k=1
    return { k: 1, silhouette: 0 };
  }

  let bestK = minK;
  let bestSilhouette = -Infinity;

  for (let k = minK; k <= maxK; k++) {
    let bestScoreForK = -Infinity;

    for (let r = 0; r < restarts; r++) {
      const result = kMeans(data, k, { rng });
      const score = silhouetteScore(data, result.assignments, k);
      if (score > bestScoreForK) {
        bestScoreForK = score;
      }
    }

    if (bestScoreForK > bestSilhouette) {
      bestSilhouette = bestScoreForK;
      bestK = k;
    }
  }

  return { k: bestK, silhouette: bestSilhouette };
}
