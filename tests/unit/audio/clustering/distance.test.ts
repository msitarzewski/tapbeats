import { describe, it, expect } from 'vitest';

import { euclideanDistance, euclideanDistanceSquared } from '@/audio/clustering/distance';

describe('euclideanDistance', () => {
  it('returns 0 for identical points', () => {
    const a = [1, 2, 3, 4, 5];
    expect(euclideanDistance(a, a)).toBe(0);
  });

  it('returns known distance for 3-4-5 triangle', () => {
    const a = [0, 0];
    const b = [3, 4];
    expect(euclideanDistance(a, b)).toBeCloseTo(5, 10);
  });

  it('computes correct distance for high-dimensional vectors', () => {
    // All differences are 1 across 16 dimensions → sqrt(16) = 4
    const a = new Array<number>(16).fill(0);
    const b = new Array<number>(16).fill(1);
    expect(euclideanDistance(a, b)).toBeCloseTo(4, 10);
  });

  it('handles single-element vectors', () => {
    expect(euclideanDistance([3], [7])).toBeCloseTo(4, 10);
  });

  it('returns 0 for zero-length vectors', () => {
    expect(euclideanDistance([], [])).toBe(0);
  });

  it('is symmetric', () => {
    const a = [1.5, 2.7, 3.1];
    const b = [4.2, 0.8, 6.3];
    expect(euclideanDistance(a, b)).toBeCloseTo(euclideanDistance(b, a), 10);
  });
});

describe('euclideanDistanceSquared', () => {
  it('returns the square of euclideanDistance', () => {
    const a = [3, 0];
    const b = [0, 4];
    const d = euclideanDistance(a, b);
    const dSq = euclideanDistanceSquared(a, b);
    expect(dSq).toBeCloseTo(d * d, 10);
  });

  it('returns 0 for identical points', () => {
    const a = [5, 10, 15];
    expect(euclideanDistanceSquared(a, a)).toBe(0);
  });
});
