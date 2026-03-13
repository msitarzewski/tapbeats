import { describe, expect, it } from 'vitest';

import { detectBpm } from '@/audio/quantization/detectBpm';
import { gridIntervalSeconds } from '@/audio/quantization/gridUtils';
import { quantizeHits } from '@/audio/quantization/quantizeHits';
import type { QuantizationConfig } from '@/types/quantization';

import { createMockClustersAndAssignments, generateHits } from '../helpers/quantizationFixtures';

describe('quantization pipeline integration', () => {
  it('full pipeline: detect BPM then quantize', () => {
    const hits = generateHits(120, 20);
    const timestamps = hits.map((h) => h.onset.timestamp);
    const bpmResult = detectBpm(timestamps);

    const { clusters, assignments } = createMockClustersAndAssignments(20, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const config: QuantizationConfig = {
      bpm: bpmResult.bpm,
      gridResolution: '1/8',
      strength: 75,
      swingAmount: 0.5,
    };

    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBe(20);
    for (const hit of result) {
      expect(hit.velocity).toBeGreaterThanOrEqual(0);
      expect(hit.velocity).toBeLessThanOrEqual(1);
    }
  });

  it('round-trip: quantize at 0% preserves original', () => {
    const hits = generateHits(120, 16);
    const { clusters, assignments } = createMockClustersAndAssignments(16, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const config: QuantizationConfig = {
      bpm: 120,
      gridResolution: '1/8',
      strength: 0,
      swingAmount: 0.5,
    };

    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    for (const hit of result) {
      expect(hit.quantizedTime).toBeCloseTo(hit.originalTime, 10);
    }
  });

  it('round-trip: quantize at 100% snaps to grid', () => {
    const hits = generateHits(120, 16);
    const { clusters, assignments } = createMockClustersAndAssignments(16, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const config: QuantizationConfig = {
      bpm: 120,
      gridResolution: '1/8',
      strength: 100,
      swingAmount: 0.5,
    };

    const gridInterval = gridIntervalSeconds(120, '1/8');
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    const origin = result[0]?.quantizedTime ?? 0;

    for (const hit of result) {
      const relativeTime = hit.quantizedTime - origin;
      const gridIndex = Math.round(relativeTime / gridInterval);
      expect(hit.quantizedTime).toBeCloseTo(origin + gridIndex * gridInterval, 5);
    }
  });

  it('strength sweep: higher strength = closer to grid', () => {
    const hits = generateHits(120, 16);
    const { clusters, assignments } = createMockClustersAndAssignments(16, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const gridInterval = gridIntervalSeconds(120, '1/8');
    const strengths = [0, 25, 50, 75, 100];
    const meanDeviations: number[] = [];

    for (const strength of strengths) {
      const config: QuantizationConfig = {
        bpm: 120,
        gridResolution: '1/8',
        strength,
        swingAmount: 0.5,
      };
      const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
      if (result.length === 0) {
        meanDeviations.push(0);
        continue;
      }
      const origin = result[0]?.quantizedTime ?? 0;
      let totalDeviation = 0;
      for (const hit of result) {
        const relativeTime = hit.quantizedTime - origin;
        const nearestGrid = Math.round(relativeTime / gridInterval) * gridInterval;
        totalDeviation += Math.abs(relativeTime - nearestGrid);
      }
      meanDeviations.push(totalDeviation / result.length);
    }

    // Each successive strength should produce equal or lower mean deviation
    for (let i = 1; i < meanDeviations.length; i++) {
      const prev = meanDeviations[i - 1];
      const curr = meanDeviations[i];
      if (prev === undefined || curr === undefined) continue;
      expect(curr).toBeLessThanOrEqual(prev + 1e-9);
    }
  });

  it('handles single hit', () => {
    const hits = generateHits(120, 1);
    const timestamps = hits.map((h) => h.onset.timestamp);
    const bpmResult = detectBpm(timestamps);

    const { clusters, assignments } = createMockClustersAndAssignments(1, 1);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep' };
    const config: QuantizationConfig = {
      bpm: bpmResult.bpm,
      gridResolution: '1/8',
      strength: 75,
      swingAmount: 0.5,
    };

    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    expect(result.length).toBe(1);
  });

  it('handles two hits', () => {
    const hits = generateHits(120, 2);
    const timestamps = hits.map((h) => h.onset.timestamp);
    const bpmResult = detectBpm(timestamps);

    const { clusters, assignments } = createMockClustersAndAssignments(2, 1);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep' };
    const config: QuantizationConfig = {
      bpm: bpmResult.bpm,
      gridResolution: '1/8',
      strength: 75,
      swingAmount: 0.5,
    };

    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    expect(result.length).toBe(2);
  });

  it('pipeline with multiple clusters', () => {
    const hits = generateHits(120, 24);
    const { clusters, assignments } = createMockClustersAndAssignments(24, 3);
    const instrumentAssignments: Record<number, string> = {
      0: 'kick-deep',
      1: 'snare-crack',
      2: 'hihat-closed',
    };
    const config: QuantizationConfig = {
      bpm: 120,
      gridResolution: '1/8',
      strength: 75,
      swingAmount: 0.5,
    };

    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    expect(result.length).toBe(24);
    const instruments = new Set(result.map((h) => h.instrumentId));
    expect(instruments.size).toBe(3);
  });

  it('pipeline skips unassigned clusters', () => {
    const hits = generateHits(120, 12);
    const { clusters, assignments } = createMockClustersAndAssignments(12, 3);
    // Only assign 2 of 3 clusters
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const config: QuantizationConfig = {
      bpm: 120,
      gridResolution: '1/8',
      strength: 75,
      swingAmount: 0.5,
    };

    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    // Cluster 2 hits (indices 2, 5, 8, 11) should be skipped
    expect(result.length).toBe(8);
    for (const hit of result) {
      expect(hit.instrumentId).not.toBe('skip');
      expect(['kick-deep', 'snare-crack']).toContain(hit.instrumentId);
    }
  });
});
