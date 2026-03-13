import { describe, it, expect } from 'vitest';

import { SAMPLE_MANIFEST } from '@/audio/playback/sampleManifest';
import { suggestInstruments } from '@/audio/playback/smartDefaults';
import type { ClusterData } from '@/types/clustering';

const VALID_INSTRUMENT_IDS = new Set(SAMPLE_MANIFEST.map((inst) => inst.id));

function makeCluster(id: number, centroid: number[]): ClusterData {
  return {
    id,
    hitIndices: [0],
    centroid,
    hitCount: 1,
    representativeHitIndex: 0,
    color: `var(--cluster-${String(id % 8)})`,
  };
}

describe('suggestInstruments', () => {
  it('0 clusters returns empty Map', () => {
    const result = suggestInstruments([]);
    expect(result.size).toBe(0);
  });

  it('1 cluster assigns kick-1', () => {
    const clusters = [makeCluster(0, [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])];
    const result = suggestInstruments(clusters);
    expect(result.get(0)).toBe('kick-1');
  });

  it('2 clusters: lowest centroid[1] gets kick, highest gets hihat', () => {
    const clusters = [
      makeCluster(0, [0.5, 0.1, 0.5, 0.5, 0.5, 0.5, 0.5]), // low spectral centroid
      makeCluster(1, [0.5, 0.9, 0.5, 0.5, 0.5, 0.5, 0.5]), // high spectral centroid
    ];
    const result = suggestInstruments(clusters);
    expect(result.get(0)).toBe('kick-1');
    expect(result.get(1)).toBe('hihat-closed-1');
  });

  it('3 clusters: each gets a unique category', () => {
    const clusters = [
      makeCluster(0, [0.9, 0.15, 0.2, 0.3, 0.1, 0.1, 0.7]), // kick-like
      makeCluster(1, [0.7, 0.55, 0.6, 0.6, 0.5, 0.1, 0.4]), // snare-like
      makeCluster(2, [0.4, 0.85, 0.8, 0.8, 0.9, 0.05, 0.2]), // hihat-like
    ];
    const result = suggestInstruments(clusters);
    const instruments = [...result.values()];
    const unique = new Set(instruments);
    expect(unique.size).toBe(3);
  });

  it('5 clusters: all 5 categories used, no duplicates', () => {
    const clusters = [
      makeCluster(0, [0.9, 0.15, 0.2, 0.3, 0.1, 0.1, 0.7]), // kick
      makeCluster(1, [0.7, 0.55, 0.6, 0.6, 0.5, 0.1, 0.4]), // snare
      makeCluster(2, [0.4, 0.85, 0.8, 0.8, 0.9, 0.05, 0.2]), // hihat
      makeCluster(3, [0.6, 0.35, 0.35, 0.3, 0.2, 0.15, 0.6]), // tom
      makeCluster(4, [0.5, 0.5, 0.5, 0.5, 0.4, 0.1, 0.3]), // perc
    ];
    const result = suggestInstruments(clusters);
    expect(result.size).toBe(5);
    const instruments = [...result.values()];
    const unique = new Set(instruments);
    expect(unique.size).toBe(5);
  });

  it('6+ clusters: duplicates allowed after first 5 categories used', () => {
    const clusters = [
      makeCluster(0, [0.9, 0.15, 0.2, 0.3, 0.1, 0.1, 0.7]),
      makeCluster(1, [0.7, 0.55, 0.6, 0.6, 0.5, 0.1, 0.4]),
      makeCluster(2, [0.4, 0.85, 0.8, 0.8, 0.9, 0.05, 0.2]),
      makeCluster(3, [0.6, 0.35, 0.35, 0.3, 0.2, 0.15, 0.6]),
      makeCluster(4, [0.5, 0.5, 0.5, 0.5, 0.4, 0.1, 0.3]),
      makeCluster(5, [0.9, 0.1, 0.15, 0.25, 0.1, 0.1, 0.7]), // kick-like duplicate
    ];
    const result = suggestInstruments(clusters);
    expect(result.size).toBe(6);
    // All 6 clusters should have assignments
    for (const cluster of clusters) {
      expect(result.has(cluster.id)).toBe(true);
    }
  });

  it('cluster with high spectral centroid (0.9) gets hi-hat', () => {
    const clusters = [
      makeCluster(0, [0.4, 0.9, 0.8, 0.8, 0.9, 0.05, 0.2]),
      makeCluster(1, [0.9, 0.15, 0.2, 0.3, 0.1, 0.1, 0.7]),
      makeCluster(2, [0.7, 0.55, 0.6, 0.6, 0.5, 0.1, 0.4]),
    ];
    const result = suggestInstruments(clusters);
    expect(result.get(0)).toBe('hihat-closed-1');
  });

  it('cluster with high RMS + low centroid gets kick', () => {
    const clusters = [
      makeCluster(0, [0.9, 0.1, 0.2, 0.3, 0.1, 0.1, 0.7]),
      makeCluster(1, [0.4, 0.85, 0.8, 0.8, 0.9, 0.05, 0.2]),
      makeCluster(2, [0.7, 0.55, 0.6, 0.6, 0.5, 0.1, 0.4]),
    ];
    const result = suggestInstruments(clusters);
    expect(result.get(0)).toBe('kick-1');
  });

  it('cluster with mid centroid + high ZCR gets snare', () => {
    const clusters = [
      makeCluster(0, [0.7, 0.55, 0.6, 0.6, 0.5, 0.1, 0.4]),
      makeCluster(1, [0.9, 0.15, 0.2, 0.3, 0.1, 0.1, 0.7]),
      makeCluster(2, [0.4, 0.85, 0.8, 0.8, 0.9, 0.05, 0.2]),
    ];
    const result = suggestInstruments(clusters);
    expect(result.get(0)).toBe('snare-1');
  });

  it('all results are valid instrument IDs from the manifest', () => {
    const clusters = [
      makeCluster(0, [0.9, 0.15, 0.2, 0.3, 0.1, 0.1, 0.7]),
      makeCluster(1, [0.7, 0.55, 0.6, 0.6, 0.5, 0.1, 0.4]),
      makeCluster(2, [0.4, 0.85, 0.8, 0.8, 0.9, 0.05, 0.2]),
      makeCluster(3, [0.6, 0.35, 0.35, 0.3, 0.2, 0.15, 0.6]),
      makeCluster(4, [0.5, 0.5, 0.5, 0.5, 0.4, 0.1, 0.3]),
    ];
    const result = suggestInstruments(clusters);
    for (const instrumentId of result.values()) {
      expect(VALID_INSTRUMENT_IDS.has(instrumentId)).toBe(true);
    }
  });

  it('function is pure: same input returns same result', () => {
    const clusters = [
      makeCluster(0, [0.9, 0.15, 0.2, 0.3, 0.1, 0.1, 0.7]),
      makeCluster(1, [0.4, 0.85, 0.8, 0.8, 0.9, 0.05, 0.2]),
      makeCluster(2, [0.7, 0.55, 0.6, 0.6, 0.5, 0.1, 0.4]),
    ];
    const first = suggestInstruments(clusters);
    const second = suggestInstruments(clusters);
    expect([...first.entries()]).toEqual([...second.entries()]);
  });

  it('greedy assignment picks best pair first', () => {
    // Provide a hihat-perfect cluster and a kick-perfect cluster.
    // The greedy approach should assign the best match first.
    const clusters = [
      makeCluster(0, [0.4, 0.85, 0.8, 0.8, 0.9, 0.05, 0.2]), // hihat profile
      makeCluster(1, [0.9, 0.15, 0.2, 0.3, 0.1, 0.1, 0.7]), // kick profile
      makeCluster(2, [0.5, 0.5, 0.5, 0.5, 0.4, 0.1, 0.3]), // perc profile
    ];
    const result = suggestInstruments(clusters);
    // Each perfect match should get its category
    expect(result.get(0)).toBe('hihat-closed-1');
    expect(result.get(1)).toBe('kick-1');
  });
});
