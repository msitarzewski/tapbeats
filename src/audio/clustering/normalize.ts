/**
 * Min-max normalization for feature vectors.
 * All functions are pure with no side effects.
 */

import type { NormalizationResult } from '@/types/clustering';

/** Scale each dimension of the feature matrix to [0, 1]. */
export function minMaxNormalize(features: number[][]): NormalizationResult {
  if (features.length === 0) {
    return { normalized: [], mins: [], maxes: [] };
  }

  const dims = (features[0] ?? []).length;
  const mins: number[] = new Array<number>(dims).fill(Infinity);
  const maxes: number[] = new Array<number>(dims).fill(-Infinity);

  // Find min/max per dimension
  for (const vec of features) {
    for (let d = 0; d < dims; d++) {
      const val = vec[d] ?? 0;
      if (val < (mins[d] ?? Infinity)) {
        mins[d] = val;
      }
      if (val > (maxes[d] ?? -Infinity)) {
        maxes[d] = val;
      }
    }
  }

  // Normalize
  const normalized: number[][] = [];
  for (const vec of features) {
    const row: number[] = new Array<number>(dims);
    for (let d = 0; d < dims; d++) {
      const min = mins[d] ?? 0;
      const max = maxes[d] ?? 0;
      const range = max - min;
      // If min === max, all values identical — normalize to 0
      row[d] = range === 0 ? 0 : ((vec[d] ?? 0) - min) / range;
    }
    normalized.push(row);
  }

  return { normalized, mins, maxes };
}

/** Re-apply saved normalization parameters to new feature vectors. */
export function applyNormalization(
  features: number[][],
  mins: number[],
  maxes: number[],
): number[][] {
  const normalized: number[][] = [];
  for (const vec of features) {
    const row: number[] = new Array<number>(vec.length);
    for (let d = 0; d < vec.length; d++) {
      const min = mins[d] ?? 0;
      const max = maxes[d] ?? 0;
      const range = max - min;
      row[d] = range === 0 ? 0 : ((vec[d] ?? 0) - min) / range;
    }
    normalized.push(row);
  }
  return normalized;
}
