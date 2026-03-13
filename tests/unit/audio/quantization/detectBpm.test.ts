import { describe, expect, it } from 'vitest';

import { detectBpm } from '@/audio/quantization/detectBpm';

import { generateTimestamps } from '../../../helpers/quantizationFixtures';

describe('detectBpm', () => {
  it('returns 120 BPM with 0 confidence for empty input', () => {
    const result = detectBpm([]);
    expect(result.bpm).toBe(120);
    expect(result.confidence).toBe(0);
  });

  it('returns 120 BPM with 0 confidence for single timestamp', () => {
    const result = detectBpm([0.0]);
    expect(result.bpm).toBe(120);
    expect(result.confidence).toBe(0);
  });

  it('detects 120 BPM from evenly spaced onsets', () => {
    const timestamps = generateTimestamps(120, 16);
    const result = detectBpm(timestamps);
    expect(result.bpm).toBe(120);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('detects 100 BPM', () => {
    const timestamps = generateTimestamps(100, 16);
    const result = detectBpm(timestamps);
    expect(result.bpm).toBe(100);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('detects 80 BPM', () => {
    const timestamps = generateTimestamps(80, 20);
    const result = detectBpm(timestamps);
    expect(result.bpm).toBe(80);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('detects 140 BPM', () => {
    const timestamps = generateTimestamps(140, 16);
    const result = detectBpm(timestamps);
    expect(result.bpm).toBe(140);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('handles timing jitter', () => {
    const timestamps = generateTimestamps(120, 20, 15);
    const result = detectBpm(timestamps);
    expect(result.bpm).toBeGreaterThanOrEqual(118);
    expect(result.bpm).toBeLessThanOrEqual(122);
  });

  it('confidence is high for consistent tempo', () => {
    const timestamps = generateTimestamps(120, 32);
    const result = detectBpm(timestamps);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('respects minBPM/maxBPM range', () => {
    const timestamps = generateTimestamps(50, 16);
    const result = detectBpm(timestamps, 60, 240);
    expect(result.bpm).toBeGreaterThanOrEqual(60);
  });

  it('handles very few onsets (3)', () => {
    const timestamps = generateTimestamps(120, 3);
    const result = detectBpm(timestamps);
    expect(result.bpm).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it('handles many onsets (100)', () => {
    const timestamps = generateTimestamps(120, 100);
    const result = detectBpm(timestamps);
    expect(result.bpm).toBe(120);
  });

  it('provides alternatives array', () => {
    const timestamps = generateTimestamps(120, 20);
    const result = detectBpm(timestamps);
    expect(Array.isArray(result.alternatives)).toBe(true);
  });

  it('alternatives do not include selected BPM', () => {
    const timestamps = generateTimestamps(120, 20);
    const result = detectBpm(timestamps);
    expect(result.alternatives).not.toContain(result.bpm);
  });

  it('handles non-uniform spacing', () => {
    const timestamps = [0, 0.5, 1.0, 1.5, 2.0, 2.5];
    const result = detectBpm(timestamps);
    expect(result.bpm).toBe(120);
  });

  it('does not crash on identical timestamps', () => {
    const timestamps = [0, 0, 0, 0];
    const result = detectBpm(timestamps);
    expect(result.bpm).toBeGreaterThan(0);
  });
});
