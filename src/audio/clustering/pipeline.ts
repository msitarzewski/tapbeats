/**
 * Main clustering pipeline: feature extraction, normalization, and clustering.
 * All functions are pure with no side effects.
 */

import type { AudioFeatures, DetectedHit } from '@/types/audio';
import type { ClusteringOutput } from '@/types/clustering';

import { euclideanDistanceSquared } from './distance';
import { kMeans } from './kmeans';
import { minMaxNormalize } from './normalize';
import { computeCentroids, mergeClusters } from './operations';
import { selectOptimalK, silhouetteScore } from './silhouette';

/** Number of MFCC coefficients to include in the feature vector. */
const MFCC_COUNT = 5;

/** Total feature vector dimensionality: 7 scalars + 5 MFCCs. */
const FEATURE_DIMS = 12;

/**
 * Flatten AudioFeatures into a 12-dimensional numeric array.
 * Order: rms, spectralCentroid, spectralRolloff, spectralFlatness,
 *        zeroCrossingRate, attackTime, decayTime, mfcc[0..4]
 */
export function featuresToVector(f: AudioFeatures): number[] {
  const vec = new Array<number>(FEATURE_DIMS);
  vec[0] = f.rms;
  vec[1] = f.spectralCentroid;
  vec[2] = f.spectralRolloff;
  vec[3] = f.spectralFlatness;
  vec[4] = f.zeroCrossingRate;
  vec[5] = f.attackTime;
  vec[6] = f.decayTime;
  for (let i = 0; i < MFCC_COUNT; i++) {
    vec[7 + i] = f.mfcc[i] ?? 0;
  }
  return vec;
}

/**
 * Main clustering entry point.
 *
 * 1. Filter hits with non-null features
 * 2. Convert to feature vectors
 * 3. Handle edge cases (<=1 hits, <5 hits)
 * 4. Normalize, check variance
 * 5. Subsample for k-selection if >500 hits
 * 6. Find optimal k, enforce quality thresholds
 * 7. Cap at 12 clusters, auto-merging if needed
 */
export function runClustering(hits: DetectedHit[]): ClusteringOutput {
  // Step 1: filter hits with non-null features
  const validHits: DetectedHit[] = [];
  for (const hit of hits) {
    if (hit.features !== null) {
      validHits.push(hit);
    }
  }

  // Step 2: convert to feature vectors
  const featureVectors: number[][] = [];
  for (const hit of validHits) {
    if (hit.features !== null) {
      featureVectors.push(featuresToVector(hit.features));
    }
  }

  const n = featureVectors.length;

  // Step 3: trivial case — 0 or 1 valid hits
  if (n <= 1) {
    const norm =
      n === 0
        ? { normalized: [], mins: [], maxes: [] }
        : {
            normalized: [new Array<number>(FEATURE_DIMS).fill(0)],
            mins: featureVectors[0] ?? [],
            maxes: featureVectors[0] ?? [],
          };
    return {
      assignments: n === 0 ? [] : [0],
      centroids: n === 0 ? [] : [featureVectors[0] ?? []],
      featureVectors,
      normalization: norm,
      clusterCount: n === 0 ? 0 : 1,
      silhouette: n === 0 ? 0 : 1,
    };
  }

  // Step 5: normalize all vectors
  const normalization = minMaxNormalize(featureVectors);
  const normalized = normalization.normalized;

  // Step 6: check feature variance — if max variance < 0.01, return k=1
  if (maxVariance(normalized) < 0.01) {
    return makeSingleClusterResult(featureVectors, normalized, normalization);
  }

  // Step 4 & 7: determine k selection bounds
  let maxK: number;
  if (n < 5) {
    maxK = Math.min(n, 2);
  } else {
    maxK = 8;
  }

  // Step 7: subsample for k-selection if >500 hits
  let kSelectionData: number[][];
  if (n > 500) {
    kSelectionData = reservoirSample(normalized, 200);
  } else {
    kSelectionData = normalized;
  }

  // Step 8: find optimal k
  const optimal = selectOptimalK(kSelectionData, { maxK });

  // Step 9: if silhouette < 0.25, return k=1
  if (optimal.silhouette < 0.25) {
    return makeSingleClusterResult(featureVectors, normalized, normalization);
  }

  // Run full k-means on all data with the selected k
  const result = kMeans(normalized, optimal.k);
  let assignments = [...result.assignments];
  let centroids = [...result.centroids];
  let k = optimal.k;

  // Step 10: if k > 12, auto-merge most similar centroids until <= 12
  while (k > 12) {
    const mergeTarget = findMostSimilarPair(centroids);
    const merged = mergeClusters(featureVectors, assignments, mergeTarget.a, mergeTarget.b);
    assignments = merged.assignments;
    centroids = merged.centroids;
    k--;
  }

  // Recompute final silhouette on normalized data
  const finalSilhouette = silhouetteScore(normalized, assignments, k);

  return {
    assignments,
    centroids: computeCentroids(featureVectors, assignments),
    featureVectors,
    normalization,
    clusterCount: k,
    silhouette: finalSilhouette,
  };
}

/** Compute max variance across all dimensions of normalized data. */
function maxVariance(data: number[][]): number {
  const n = data.length;
  if (n === 0) return 0;

  const dims = (data[0] ?? []).length;
  let maxVar = 0;

  for (let d = 0; d < dims; d++) {
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < n; i++) {
      const val = (data[i] ?? [])[d] ?? 0;
      sum += val;
      sumSq += val * val;
    }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    if (variance > maxVar) {
      maxVar = variance;
    }
  }

  return maxVar;
}

/** Build a single-cluster result. */
function makeSingleClusterResult(
  featureVectors: number[][],
  _normalized: number[][],
  normalization: { normalized: number[][]; mins: number[]; maxes: number[] },
): ClusteringOutput {
  const n = featureVectors.length;
  const assignments = new Array<number>(n).fill(0);
  const centroids = computeCentroids(featureVectors, assignments);

  return {
    assignments,
    centroids,
    featureVectors,
    normalization,
    clusterCount: 1,
    silhouette: n <= 1 ? 1 : 0,
  };
}

/** Reservoir sampling: select sampleSize elements uniformly at random. */
function reservoirSample(data: number[][], sampleSize: number): number[][] {
  const n = data.length;
  if (n <= sampleSize) return [...data];

  const sample: number[][] = [];
  for (let i = 0; i < sampleSize; i++) {
    sample.push(data[i] ?? []);
  }

  for (let i = sampleSize; i < n; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    if (j < sampleSize) {
      sample[j] = data[i] ?? [];
    }
  }

  return sample;
}

/** Find the pair of centroids with smallest squared distance. */
function findMostSimilarPair(centroids: number[][]): { a: number; b: number } {
  let minDist = Infinity;
  let bestA = 0;
  let bestB = 1;

  for (let i = 0; i < centroids.length; i++) {
    for (let j = i + 1; j < centroids.length; j++) {
      const d = euclideanDistanceSquared(centroids[i] ?? [], centroids[j] ?? []);
      if (d < minDist) {
        minDist = d;
        bestA = i;
        bestB = j;
      }
    }
  }

  return { a: bestA, b: bestB };
}
