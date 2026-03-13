/**
 * Cluster operations: split, merge, and centroid computation.
 * All functions are pure with no side effects.
 */

import { kMeans } from './kmeans';
import { minMaxNormalize } from './normalize';

/**
 * Split a single cluster into two by running k=2 on its points.
 * Remaps all assignments to contiguous IDs and recomputes all centroids.
 */
export function splitCluster(
  features: number[][],
  assignments: number[],
  clusterId: number,
  rng?: () => number,
): { assignments: number[]; centroids: number[][] } {
  const n = features.length;

  // Gather indices belonging to the target cluster
  const clusterIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    if ((assignments[i] ?? 0) === clusterId) {
      clusterIndices.push(i);
    }
  }

  // If 0 or 1 points, nothing to split
  if (clusterIndices.length <= 1) {
    return {
      assignments: [...assignments],
      centroids: computeCentroids(features, assignments),
    };
  }

  // Extract sub-features for the cluster
  const subFeatures: number[][] = [];
  for (const idx of clusterIndices) {
    subFeatures.push(features[idx] ?? []);
  }

  // Normalize sub-features for k-means, then apply
  const norm = minMaxNormalize(subFeatures);
  const subResult = kMeans(norm.normalized, 2, rng !== undefined ? { rng } : undefined);

  // Find all unique cluster IDs (excluding the one being split)
  const existingIds = new Set<number>();
  for (let i = 0; i < n; i++) {
    existingIds.add(assignments[i] ?? 0);
  }

  // The new second cluster gets the next available ID
  const maxExistingId = Math.max(...existingIds);
  const newClusterId = maxExistingId + 1;

  // Build new assignments
  const newAssignments = [...assignments];
  for (let si = 0; si < clusterIndices.length; si++) {
    const originalIdx = clusterIndices[si] ?? 0;
    const subAssignment = subResult.assignments[si] ?? 0;
    // Sub-cluster 0 keeps the original clusterId, sub-cluster 1 gets newClusterId
    newAssignments[originalIdx] = subAssignment === 0 ? clusterId : newClusterId;
  }

  // Remap to contiguous IDs
  const remapped = remapContiguous(newAssignments);
  const centroids = computeCentroids(features, remapped);

  return { assignments: remapped, centroids };
}

/**
 * Merge two clusters: reassign all clusterB points to clusterA,
 * remap to contiguous IDs, and recompute centroids.
 */
export function mergeClusters(
  features: number[][],
  assignments: number[],
  clusterA: number,
  clusterB: number,
): { assignments: number[]; centroids: number[][] } {
  const newAssignments = [...assignments];

  // Reassign all clusterB points to clusterA
  for (let i = 0; i < newAssignments.length; i++) {
    if ((newAssignments[i] ?? 0) === clusterB) {
      newAssignments[i] = clusterA;
    }
  }

  // Remap to contiguous IDs
  const remapped = remapContiguous(newAssignments);
  const centroids = computeCentroids(features, remapped);

  return { assignments: remapped, centroids };
}

/**
 * Compute the centroid (mean) of each cluster.
 * Returns an array indexed by cluster ID.
 */
export function computeCentroids(features: number[][], assignments: number[]): number[][] {
  const n = features.length;
  if (n === 0) return [];

  const dims = (features[0] ?? []).length;

  // Find max cluster ID
  let maxId = 0;
  for (let i = 0; i < n; i++) {
    const id = assignments[i] ?? 0;
    if (id > maxId) maxId = id;
  }

  const k = maxId + 1;
  const sums: number[][] = [];
  const counts = new Array<number>(k).fill(0);

  for (let c = 0; c < k; c++) {
    sums.push(new Array<number>(dims).fill(0));
  }

  for (let i = 0; i < n; i++) {
    const cluster = assignments[i] ?? 0;
    counts[cluster] = (counts[cluster] ?? 0) + 1;
    const sum = sums[cluster] ?? [];
    const point = features[i] ?? [];
    for (let d = 0; d < dims; d++) {
      sum[d] = (sum[d] ?? 0) + (point[d] ?? 0);
    }
  }

  const centroids: number[][] = [];
  for (let c = 0; c < k; c++) {
    const count = counts[c] ?? 0;
    const sum = sums[c] ?? [];
    const centroid = new Array<number>(dims);
    for (let d = 0; d < dims; d++) {
      centroid[d] = count === 0 ? 0 : (sum[d] ?? 0) / count;
    }
    centroids.push(centroid);
  }

  return centroids;
}

/** Remap assignments to contiguous IDs starting from 0. */
function remapContiguous(assignments: number[]): number[] {
  const uniqueIds = [...new Set(assignments)].sort((a, b) => a - b);
  const idMap = new Map<number, number>();
  for (let i = 0; i < uniqueIds.length; i++) {
    idMap.set(uniqueIds[i] ?? 0, i);
  }
  return assignments.map((id) => idMap.get(id) ?? 0);
}
