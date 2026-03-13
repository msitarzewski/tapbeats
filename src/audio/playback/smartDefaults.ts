import type { ClusterData } from '@/types/clustering';

/**
 * Idealized acoustic profiles for drum categories.
 * Each array represents normalized [0,1] values for:
 * [rms, spectralCentroid, spectralRolloff, spectralFlatness, zeroCrossingRate, attackTime, decayTime]
 */
const PROFILES = {
  kick: [0.9, 0.15, 0.2, 0.3, 0.1, 0.1, 0.7],
  snare: [0.7, 0.55, 0.6, 0.6, 0.5, 0.1, 0.4],
  hihat: [0.4, 0.85, 0.8, 0.8, 0.9, 0.05, 0.2],
  tom: [0.6, 0.35, 0.35, 0.3, 0.2, 0.15, 0.6],
  perc: [0.5, 0.5, 0.5, 0.5, 0.4, 0.1, 0.3],
} as const satisfies Record<string, readonly number[]>;

type Category = keyof typeof PROFILES;

const CATEGORIES: readonly Category[] = ['kick', 'snare', 'hihat', 'tom', 'perc'];

const CATEGORY_TO_INSTRUMENT: Record<Category, string> = {
  kick: 'kick-1',
  snare: 'snare-1',
  hihat: 'hihat-closed-1',
  tom: 'tom-high',
  perc: 'clap-1',
};

/**
 * Feature weights by index:
 * [0]=rms:2, [1]=centroid:3, [2]=rolloff:1, [3]=flatness:1,
 * [4]=zcr:2, [5]=attack:1.5, [6]=decay:1
 */
const FEATURE_WEIGHTS: readonly number[] = [2, 3, 1, 1, 2, 1.5, 1];

const PROFILE_FEATURE_COUNT = 7;

function weightedDistance(centroid: readonly number[], profile: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < PROFILE_FEATURE_COUNT; i++) {
    const centroidVal = centroid[i];
    const profileVal = profile[i];
    const weight = FEATURE_WEIGHTS[i];
    if (centroidVal === undefined || profileVal === undefined || weight === undefined) {
      continue;
    }
    const diff = centroidVal - profileVal;
    sum += weight * diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Suggests instrument assignments for sound clusters based on their acoustic features.
 * Uses weighted Euclidean distance from cluster centroids to idealized drum profiles,
 * then greedily assigns unique categories to minimize total distance.
 *
 * Pure function with no side effects.
 */
export function suggestInstruments(clusters: readonly ClusterData[]): Map<number, string> {
  const result = new Map<number, string>();

  if (clusters.length === 0) {
    return result;
  }

  if (clusters.length === 1) {
    const cluster = clusters[0];
    if (cluster !== undefined) {
      result.set(cluster.id, 'kick-1');
    }
    return result;
  }

  if (clusters.length === 2) {
    const a = clusters[0];
    const b = clusters[1];
    if (a !== undefined && b !== undefined) {
      const aCentroid = a.centroid[1] ?? 0;
      const bCentroid = b.centroid[1] ?? 0;
      if (aCentroid <= bCentroid) {
        result.set(a.id, 'kick-1');
        result.set(b.id, 'hihat-closed-1');
      } else {
        result.set(a.id, 'hihat-closed-1');
        result.set(b.id, 'kick-1');
      }
    }
    return result;
  }

  // Compute all cluster x category distances
  const distances: { clusterId: number; category: Category; distance: number }[] = [];

  for (const cluster of clusters) {
    for (const category of CATEGORIES) {
      const profile = PROFILES[category];
      distances.push({
        clusterId: cluster.id,
        category,
        distance: weightedDistance(cluster.centroid, profile),
      });
    }
  }

  // Sort by distance ascending for greedy picking
  distances.sort((a, b) => a.distance - b.distance);

  // First pass: greedy unique assignment (up to 5 categories)
  const assignedClusterIds = new Set<number>();
  const assignedCategories = new Set<Category>();

  for (const entry of distances) {
    if (assignedClusterIds.has(entry.clusterId) || assignedCategories.has(entry.category)) {
      continue;
    }
    result.set(entry.clusterId, CATEGORY_TO_INSTRUMENT[entry.category]);
    assignedClusterIds.add(entry.clusterId);
    assignedCategories.add(entry.category);

    if (
      assignedClusterIds.size >= clusters.length ||
      assignedCategories.size >= CATEGORIES.length
    ) {
      break;
    }
  }

  // Second pass: assign remaining clusters (>5 case, allow duplicate categories)
  if (assignedClusterIds.size < clusters.length) {
    for (const cluster of clusters) {
      if (assignedClusterIds.has(cluster.id)) {
        continue;
      }
      let bestCategory: Category = 'perc';
      let bestDistance = Infinity;
      for (const category of CATEGORIES) {
        const profile = PROFILES[category];
        const dist = weightedDistance(cluster.centroid, profile);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestCategory = category;
        }
      }
      result.set(cluster.id, CATEGORY_TO_INSTRUMENT[bestCategory]);
      assignedClusterIds.add(cluster.id);
    }
  }

  return result;
}
