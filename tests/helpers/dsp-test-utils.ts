import { expect } from 'vitest';

/**
 * Measure precision, recall, and F1 score for onset detection.
 * A detected onset matches a ground truth onset if within `toleranceMs`.
 * Each ground truth onset can only be matched once.
 */
export function measurePrecisionRecall(
  detectedMs: number[],
  truthMs: number[],
  toleranceMs: number,
): { precision: number; recall: number; f1: number } {
  const matched = new Set<number>();
  let truePositives = 0;

  for (const det of detectedMs) {
    let bestIdx = -1;
    let bestDist = Infinity;

    for (let i = 0; i < truthMs.length; i++) {
      if (matched.has(i)) continue;
      const dist = Math.abs(det - (truthMs[i] ?? 0));
      if (dist <= toleranceMs && dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      truePositives++;
      matched.add(bestIdx);
    }
  }

  const precision = detectedMs.length > 0 ? truePositives / detectedMs.length : 0;
  const recall = truthMs.length > 0 ? truePositives / truthMs.length : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return { precision, recall, f1 };
}

/**
 * Custom assertion: compare two Float32Arrays element-wise within tolerance.
 */
export function expectFloat32ArrayClose(
  actual: Float32Array,
  expected: Float32Array,
  tolerance: number,
): void {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++) {
    const a = actual[i] ?? 0;
    const e = expected[i] ?? 0;
    expect(Math.abs(a - e)).toBeLessThanOrEqual(tolerance);
  }
}
