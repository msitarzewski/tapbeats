import { describe, it, expect } from 'vitest';

import { minMaxNormalize, applyNormalization } from '@/audio/clustering/normalize';

describe('minMaxNormalize', () => {
  it('places all values in [0, 1]', () => {
    const data = [
      [10, 200, 0.5],
      [20, 100, 0.9],
      [15, 300, 0.1],
    ];
    const { normalized } = minMaxNormalize(data);

    for (const row of normalized) {
      for (const val of row) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('maps min to 0 and max to 1 per dimension', () => {
    const data = [
      [10, 100],
      [20, 200],
      [30, 300],
    ];
    const { normalized } = minMaxNormalize(data);

    // Min values → 0
    expect(normalized[0]?.[0]).toBeCloseTo(0, 10);
    expect(normalized[0]?.[1]).toBeCloseTo(0, 10);

    // Max values → 1
    expect(normalized[2]?.[0]).toBeCloseTo(1, 10);
    expect(normalized[2]?.[1]).toBeCloseTo(1, 10);
  });

  it('returns all zeros for a single point', () => {
    const { normalized } = minMaxNormalize([[5, 10, 15]]);
    for (const val of normalized[0] ?? []) {
      expect(val).toBe(0);
    }
  });

  it('returns all zeros for constant feature (same value in a dimension)', () => {
    const data = [
      [1, 5],
      [2, 5],
      [3, 5],
    ];
    const { normalized } = minMaxNormalize(data);

    // Second dimension is constant → all 0
    for (const row of normalized) {
      expect(row[1]).toBe(0);
    }

    // First dimension should still vary
    expect(normalized[0]?.[0]).toBeCloseTo(0, 10);
    expect(normalized[2]?.[0]).toBeCloseTo(1, 10);
  });

  it('returns empty arrays for empty input', () => {
    const result = minMaxNormalize([]);
    expect(result.normalized).toEqual([]);
    expect(result.mins).toEqual([]);
    expect(result.maxes).toEqual([]);
  });

  it('preserves number of points and dimensions', () => {
    const data = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [10, 11, 12],
    ];
    const { normalized } = minMaxNormalize(data);

    expect(normalized.length).toBe(4);
    for (const row of normalized) {
      expect(row.length).toBe(3);
    }
  });

  it('stores correct mins and maxes', () => {
    const data = [
      [10, 100],
      [20, 200],
      [30, 300],
    ];
    const { mins, maxes } = minMaxNormalize(data);

    expect(mins[0]).toBe(10);
    expect(mins[1]).toBe(100);
    expect(maxes[0]).toBe(30);
    expect(maxes[1]).toBe(300);
  });
});

describe('applyNormalization', () => {
  it('reproduces the same result as the original normalization', () => {
    const data = [
      [10, 200],
      [20, 100],
      [30, 300],
    ];
    const { normalized, mins, maxes } = minMaxNormalize(data);
    const reApplied = applyNormalization(data, mins, maxes);

    for (let i = 0; i < data.length; i++) {
      for (let d = 0; d < (data[0] ?? []).length; d++) {
        expect(reApplied[i]?.[d]).toBeCloseTo(normalized[i]?.[d] ?? 0, 10);
      }
    }
  });

  it('normalizes new data using saved parameters', () => {
    const training = [
      [0, 0],
      [10, 100],
    ];
    const { mins, maxes } = minMaxNormalize(training);

    const newData = [[5, 50]];
    const result = applyNormalization(newData, mins, maxes);

    expect(result[0]?.[0]).toBeCloseTo(0.5, 10);
    expect(result[0]?.[1]).toBeCloseTo(0.5, 10);
  });

  it('handles constant dimension (range=0) as 0', () => {
    const mins = [0, 5];
    const maxes = [10, 5]; // second dim has range 0
    const result = applyNormalization([[5, 5]], mins, maxes);

    expect(result[0]?.[0]).toBeCloseTo(0.5, 10);
    expect(result[0]?.[1]).toBe(0);
  });
});
