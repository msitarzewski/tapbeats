import { describe, it, expect } from 'vitest';

import { estimateBpm } from '@/audio/analysis/estimateBpm';

describe('estimateBpm', () => {
  it('returns null with fewer than 4 hits', () => {
    expect(estimateBpm([0, 0.5, 1.0])).toBeNull();
  });

  it('returns null with empty array', () => {
    expect(estimateBpm([])).toBeNull();
  });

  it('detects 120 BPM (0.5s intervals)', () => {
    // 120 BPM = 0.5 seconds per beat
    const timestamps = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5];
    const bpm = estimateBpm(timestamps);
    expect(bpm).not.toBeNull();
    expect(bpm).toBeCloseTo(120, 0);
  });

  it('detects 60 BPM (1.0s intervals)', () => {
    const timestamps = [0, 1, 2, 3, 4, 5, 6, 7];
    const bpm = estimateBpm(timestamps);
    expect(bpm).not.toBeNull();
    expect(bpm).toBeCloseTo(60, 0);
  });

  it('handles outlier interval (one gap doubled) and still returns correct BPM', () => {
    // 120 BPM with one missed beat (doubled gap)
    const timestamps = [0, 0.5, 1.0, 2.0, 2.5, 3.0, 3.5, 4.0];
    const bpm = estimateBpm(timestamps);
    expect(bpm).not.toBeNull();
    // The outlier (1.0s gap) should be filtered out, median of remaining ≈ 0.5s → 120 BPM
    expect(bpm).toBeCloseTo(120, 0);
  });

  it('clamps to minimum of 40 BPM', () => {
    // Very slow tempo: 2 seconds per beat = 30 BPM, should clamp to 40
    const timestamps = [0, 2, 4, 6, 8];
    const bpm = estimateBpm(timestamps);
    expect(bpm).toBe(40);
  });

  it('clamps to maximum of 240 BPM', () => {
    // Very fast tempo: 0.2 seconds per beat = 300 BPM, should clamp to 240
    const timestamps = [0, 0.2, 0.4, 0.6, 0.8];
    const bpm = estimateBpm(timestamps);
    expect(bpm).toBe(240);
  });

  it('uses last 16 timestamps only', () => {
    // Create 20 timestamps at 120 BPM, then shift the first 4 to a different tempo
    // Only the last 16 should matter
    const timestamps: number[] = [];
    // First 4 at 60 BPM
    for (let i = 0; i < 4; i++) {
      timestamps.push(i * 1.0);
    }
    // Next 16 at 120 BPM (starting after last timestamp)
    const offset = 4;
    for (let i = 0; i < 16; i++) {
      timestamps.push(offset + i * 0.5);
    }

    const bpm = estimateBpm(timestamps);
    expect(bpm).not.toBeNull();
    expect(bpm).toBeCloseTo(120, 0);
  });

  it('handles irregular intervals', () => {
    // Somewhat irregular but centered around 0.5s (120 BPM)
    const timestamps = [0, 0.48, 0.97, 1.52, 2.01, 2.49, 3.0, 3.51];
    const bpm = estimateBpm(timestamps);
    expect(bpm).not.toBeNull();
    // Should be approximately 120, within a few BPM
    expect(bpm).toBeGreaterThan(110);
    expect(bpm).toBeLessThan(130);
  });

  it('respects custom minHits parameter', () => {
    const timestamps = [0, 0.5, 1.0, 1.5];
    // With minHits=5, 4 timestamps should return null
    expect(estimateBpm(timestamps, 5)).toBeNull();
    // With minHits=4, it should succeed
    expect(estimateBpm(timestamps, 4)).not.toBeNull();
  });

  it('returns null when all intervals are 0', () => {
    const timestamps = [1, 1, 1, 1, 1];
    expect(estimateBpm(timestamps)).toBeNull();
  });
});
