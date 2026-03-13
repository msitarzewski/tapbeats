/**
 * Distance functions for clustering.
 * All functions are pure with no side effects.
 */

/** Standard euclidean distance between two vectors. */
export function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(euclideanDistanceSquared(a, b));
}

/** Squared euclidean distance — skips sqrt for performance in comparisons. */
export function euclideanDistanceSquared(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    sum += diff * diff;
  }
  return sum;
}
