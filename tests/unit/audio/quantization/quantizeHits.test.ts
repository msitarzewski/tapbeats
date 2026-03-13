import { describe, expect, it } from 'vitest';

import { quantizeHits } from '@/audio/quantization/quantizeHits';
import type { QuantizationConfig } from '@/types/quantization';

import {
  createMockClustersAndAssignments,
  generateHits,
} from '../../../helpers/quantizationFixtures';

const defaultConfig: QuantizationConfig = {
  bpm: 120,
  gridResolution: '1/8',
  strength: 75,
  swingAmount: 0.5,
};

describe('quantizeHits', () => {
  it('returns empty for no hits', () => {
    const { clusters, assignments } = createMockClustersAndAssignments(0, 2);
    const result = quantizeHits([], clusters, assignments, {}, defaultConfig);
    expect(result).toEqual([]);
  });

  it('returns empty when all clusters are skipped', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'skip', 1: 'skip' };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, defaultConfig);
    expect(result).toEqual([]);
  });

  it('quantizes hits to 1/4 grid', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const config: QuantizationConfig = { ...defaultConfig, gridResolution: '1/4', strength: 100 };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    expect(result.length).toBeGreaterThan(0);
    // At 120 BPM, quarter note = 0.5s. All quantized times should be on 0.5s grid relative to origin.
    const origin = result[0]?.quantizedTime ?? 0;
    for (const hit of result) {
      const relativeTime = hit.quantizedTime - origin;
      const gridIndex = Math.round(relativeTime / 0.5);
      expect(hit.quantizedTime).toBeCloseTo(origin + gridIndex * 0.5, 5);
    }
  });

  it('quantizes hits to 1/8 grid', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const config: QuantizationConfig = { ...defaultConfig, gridResolution: '1/8', strength: 100 };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    expect(result.length).toBeGreaterThan(0);
    // At 120 BPM, eighth note = 0.25s
    const origin = result[0]?.quantizedTime ?? 0;
    for (const hit of result) {
      const relativeTime = hit.quantizedTime - origin;
      const gridIndex = Math.round(relativeTime / 0.25);
      expect(hit.quantizedTime).toBeCloseTo(origin + gridIndex * 0.25, 5);
    }
  });

  it('quantizes hits to 1/16 grid', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const config: QuantizationConfig = { ...defaultConfig, gridResolution: '1/16', strength: 100 };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    expect(result.length).toBeGreaterThan(0);
    // At 120 BPM, sixteenth note = 0.125s
    const origin = result[0]?.quantizedTime ?? 0;
    for (const hit of result) {
      const relativeTime = hit.quantizedTime - origin;
      const gridIndex = Math.round(relativeTime / 0.125);
      expect(hit.quantizedTime).toBeCloseTo(origin + gridIndex * 0.125, 5);
    }
  });

  it('quantizes hits to 1/8T (triplet) grid', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const config: QuantizationConfig = { ...defaultConfig, gridResolution: '1/8T', strength: 100 };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    expect(result.length).toBeGreaterThan(0);
    // At 120 BPM, 1/8T = (1/3) * 0.5s = ~0.1667s
    const interval = (60 / 120) * (1 / 3);
    const origin = result[0]?.quantizedTime ?? 0;
    for (const hit of result) {
      const relativeTime = hit.quantizedTime - origin;
      const gridIndex = Math.round(relativeTime / interval);
      expect(hit.quantizedTime).toBeCloseTo(origin + gridIndex * interval, 5);
    }
  });

  it('quantizes hits to 1/16T grid', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const config: QuantizationConfig = { ...defaultConfig, gridResolution: '1/16T', strength: 100 };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    expect(result.length).toBeGreaterThan(0);
    // At 120 BPM, 1/16T = (1/6) * 0.5s = ~0.0833s
    const interval = (60 / 120) * (1 / 6);
    const origin = result[0]?.quantizedTime ?? 0;
    for (const hit of result) {
      const relativeTime = hit.quantizedTime - origin;
      const gridIndex = Math.round(relativeTime / interval);
      expect(hit.quantizedTime).toBeCloseTo(origin + gridIndex * interval, 5);
    }
  });

  it('quantizes hits to 1/4T grid', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const config: QuantizationConfig = { ...defaultConfig, gridResolution: '1/4T', strength: 100 };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    expect(result.length).toBeGreaterThan(0);
    // At 120 BPM, 1/4T = (2/3) * 0.5s = ~0.3333s
    const interval = (60 / 120) * (2 / 3);
    const origin = result[0]?.quantizedTime ?? 0;
    for (const hit of result) {
      const relativeTime = hit.quantizedTime - origin;
      const gridIndex = Math.round(relativeTime / interval);
      expect(hit.quantizedTime).toBeCloseTo(origin + gridIndex * interval, 5);
    }
  });

  it('strength 0% preserves original timing', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const config: QuantizationConfig = { ...defaultConfig, strength: 0 };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    for (const hit of result) {
      expect(hit.quantizedTime).toBeCloseTo(hit.originalTime, 10);
    }
  });

  it('strength 50% moves halfway to grid', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const config50: QuantizationConfig = { ...defaultConfig, strength: 50 };
    const config100: QuantizationConfig = { ...defaultConfig, strength: 100 };
    const result50 = quantizeHits(hits, clusters, assignments, instrumentAssignments, config50);
    const result100 = quantizeHits(hits, clusters, assignments, instrumentAssignments, config100);
    // At 50% strength, the quantized time should be halfway between original and 100%-quantized
    for (let i = 0; i < result50.length; i++) {
      const hit50 = result50[i];
      const hit100 = result100[i];
      if (hit50 === undefined || hit100 === undefined) continue;
      const expectedMid = hit50.originalTime + (hit100.quantizedTime - hit50.originalTime) * 0.5;
      // Allow small tolerance due to swing interaction
      expect(hit50.quantizedTime).toBeCloseTo(expectedMid, 5);
    }
  });

  it('strength 100% snaps fully to grid', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const config: QuantizationConfig = { ...defaultConfig, strength: 100 };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, config);
    // At 120 BPM with 1/8 grid, interval = 0.25s
    const gridInterval = 0.25;
    const origin = result[0]?.quantizedTime ?? 0;
    for (const hit of result) {
      const relativeTime = hit.quantizedTime - origin;
      const gridIndex = Math.round(relativeTime / gridInterval);
      expect(hit.quantizedTime).toBeCloseTo(origin + gridIndex * gridInterval, 5);
    }
  });

  it('preserves velocity from onset strength', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, defaultConfig);
    for (const hit of result) {
      expect(hit.velocity).toBeGreaterThanOrEqual(0);
      expect(hit.velocity).toBeLessThanOrEqual(1);
    }
  });

  it('skips hits assigned to skip instrument', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'skip' };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, defaultConfig);
    // Only cluster 0 hits should be present
    for (const hit of result) {
      expect(hit.instrumentId).toBe('kick-deep');
    }
  });

  it('skips hits with no instrument assignment', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    // Only assign cluster 0, leave cluster 1 unassigned
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep' };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, defaultConfig);
    for (const hit of result) {
      expect(hit.instrumentId).toBe('kick-deep');
    }
  });

  it('sorts output by quantized time', () => {
    const hits = generateHits(120, 16);
    const { clusters, assignments } = createMockClustersAndAssignments(16, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, defaultConfig);
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1];
      const curr = result[i];
      if (prev === undefined || curr === undefined) continue;
      expect(curr.quantizedTime).toBeGreaterThanOrEqual(prev.quantizedTime);
    }
  });

  it('swing shifts odd grid positions', () => {
    // Generate hits at eighth-note spacing (240 BPM) so they land on both even and odd
    // grid positions when quantized to a 1/8 grid at 120 BPM
    const hits = generateHits(240, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 1);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep' };
    const configNoSwing: QuantizationConfig = { ...defaultConfig, strength: 100, swingAmount: 0.5 };
    const configSwing: QuantizationConfig = { ...defaultConfig, strength: 100, swingAmount: 0.6 };
    const resultNoSwing = quantizeHits(
      hits,
      clusters,
      assignments,
      instrumentAssignments,
      configNoSwing,
    );
    const resultSwing = quantizeHits(
      hits,
      clusters,
      assignments,
      instrumentAssignments,
      configSwing,
    );
    // Some hits should differ between swing and no-swing
    let hasDifference = false;
    for (let i = 0; i < resultNoSwing.length; i++) {
      const noSwingHit = resultNoSwing[i];
      const swingHit = resultSwing[i];
      if (noSwingHit === undefined || swingHit === undefined) continue;
      if (Math.abs(noSwingHit.quantizedTime - swingHit.quantizedTime) > 1e-6) {
        hasDifference = true;
        break;
      }
    }
    expect(hasDifference).toBe(true);
  });

  it('gridPosition is in beats from start', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, defaultConfig);
    const beatDuration = 60 / defaultConfig.bpm;
    const origin = result[0]?.quantizedTime ?? 0;
    for (const hit of result) {
      const expectedGridPosition = (hit.quantizedTime - origin) / beatDuration;
      expect(hit.gridPosition).toBeCloseTo(expectedGridPosition, 5);
    }
  });

  it('hitIndex references correct onset', () => {
    const hits = generateHits(120, 8);
    const { clusters, assignments } = createMockClustersAndAssignments(8, 2);
    const instrumentAssignments: Record<number, string> = { 0: 'kick-deep', 1: 'snare-crack' };
    const result = quantizeHits(hits, clusters, assignments, instrumentAssignments, defaultConfig);
    for (const hit of result) {
      expect(hit.hitIndex).toBeGreaterThanOrEqual(0);
      expect(hit.hitIndex).toBeLessThan(hits.length);
      const originalHit = hits[hit.hitIndex];
      expect(originalHit).toBeDefined();
      expect(hit.originalTime).toBe(originalHit?.onset.timestamp);
    }
  });
});
