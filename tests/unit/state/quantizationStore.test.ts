import { beforeEach, describe, expect, it } from 'vitest';

import { useClusterStore } from '@/state/clusterStore';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useRecordingStore } from '@/state/recordingStore';
import type { DetectedHit } from '@/types/audio';
import type { ClusterData } from '@/types/clustering';

function seedRecordingStore(count: number, bpm: number): void {
  const interval = 60 / bpm;
  const store = useRecordingStore.getState();
  for (let i = 0; i < count; i++) {
    const hit: DetectedHit = {
      onset: {
        timestamp: i * interval,
        strength: 0.8,
        snippetBuffer: null,
      },
      features: null,
    };
    store.addOnset(hit);
  }
}

function seedClusterStore(hitCount: number, clusterCount: number): void {
  const assignments: number[] = [];
  const groups = new Map<number, number[]>();

  for (let i = 0; i < hitCount; i++) {
    const clusterId = i % clusterCount;
    assignments.push(clusterId);
    const existing = groups.get(clusterId);
    if (existing !== undefined) {
      existing.push(i);
    } else {
      groups.set(clusterId, [i]);
    }
  }

  const clusters: ClusterData[] = [];
  for (let id = 0; id < clusterCount; id++) {
    const hitIndices = groups.get(id) ?? [];
    clusters.push({
      id,
      hitIndices,
      centroid: [],
      hitCount: hitIndices.length,
      representativeHitIndex: hitIndices[0] ?? 0,
      color: `var(--cluster-${String(id % 8)})`,
    });
  }

  const instrumentAssignments: Record<number, string> = {};
  for (let id = 0; id < clusterCount; id++) {
    instrumentAssignments[id] = id === 0 ? 'kick-deep' : 'snare-crack';
  }

  useClusterStore.setState({
    status: 'ready',
    clusters,
    assignments,
    instrumentAssignments,
    featureVectors: [],
    normalization: null,
    silhouette: 0.5,
    error: null,
  });
}

describe('quantizationStore', () => {
  beforeEach(() => {
    useQuantizationStore.getState().reset();
    useRecordingStore.getState().reset();
    useClusterStore.getState().reset();
  });

  it('initializes with default values', () => {
    const state = useQuantizationStore.getState();
    expect(state.bpm).toBe(120);
    expect(state.gridResolution).toBe('1/8');
    expect(state.strength).toBe(75);
    expect(state.swingAmount).toBe(0.5);
    expect(state.bpmManualOverride).toBe(false);
    expect(state.bpmResult).toBeNull();
    expect(state.quantizedHits).toEqual([]);
    expect(state.playbackMode).toBe('quantized');
  });

  it('setBpm updates bpm and sets manual override', () => {
    useQuantizationStore.getState().setBpm(140);
    const state = useQuantizationStore.getState();
    expect(state.bpm).toBe(140);
    expect(state.bpmManualOverride).toBe(true);
  });

  it('setGridResolution updates grid and recomputes', () => {
    useQuantizationStore.getState().setGridResolution('1/16');
    expect(useQuantizationStore.getState().gridResolution).toBe('1/16');
  });

  it('setStrength updates strength', () => {
    useQuantizationStore.getState().setStrength(50);
    expect(useQuantizationStore.getState().strength).toBe(50);
  });

  it('setSwingAmount updates swing', () => {
    useQuantizationStore.getState().setSwingAmount(0.6);
    expect(useQuantizationStore.getState().swingAmount).toBe(0.6);
  });

  it('setPlaybackMode updates mode', () => {
    useQuantizationStore.getState().setPlaybackMode('original');
    expect(useQuantizationStore.getState().playbackMode).toBe('original');
  });

  it('detectAndSetBpm reads from recording store', () => {
    seedRecordingStore(16, 120);
    useQuantizationStore.getState().detectAndSetBpm();
    const state = useQuantizationStore.getState();
    expect(state.bpmResult).not.toBeNull();
    expect(state.bpmResult?.bpm).toBe(120);
  });

  it('detectAndSetBpm does not override manual BPM', () => {
    seedRecordingStore(16, 100);
    useQuantizationStore.getState().setBpm(140);
    useQuantizationStore.getState().detectAndSetBpm();
    const state = useQuantizationStore.getState();
    expect(state.bpm).toBe(140);
    expect(state.bpmManualOverride).toBe(true);
    expect(state.bpmResult).not.toBeNull();
  });

  it('recomputeQuantization reads cross-store data', () => {
    seedRecordingStore(8, 120);
    seedClusterStore(8, 2);
    useQuantizationStore.getState().recomputeQuantization();
    const state = useQuantizationStore.getState();
    expect(state.quantizedHits.length).toBeGreaterThan(0);
  });

  it('reset restores defaults', () => {
    useQuantizationStore.getState().setBpm(140);
    useQuantizationStore.getState().setStrength(50);
    useQuantizationStore.getState().setPlaybackMode('original');
    useQuantizationStore.getState().reset();
    const state = useQuantizationStore.getState();
    expect(state.bpm).toBe(120);
    expect(state.strength).toBe(75);
    expect(state.playbackMode).toBe('quantized');
    expect(state.bpmManualOverride).toBe(false);
  });

  it('quantizedHits empty when no onsets', () => {
    seedClusterStore(0, 2);
    useQuantizationStore.getState().recomputeQuantization();
    expect(useQuantizationStore.getState().quantizedHits).toEqual([]);
  });

  it('quantizedHits empty when no instrument assignments', () => {
    seedRecordingStore(8, 120);
    // Set up clusters but with no instrument assignments
    const assignments: number[] = [];
    const clusters: ClusterData[] = [];
    for (let i = 0; i < 8; i++) {
      assignments.push(i % 2);
    }
    for (let id = 0; id < 2; id++) {
      const hitIndices = assignments
        .map((a, idx) => (a === id ? idx : -1))
        .filter((idx) => idx >= 0);
      clusters.push({
        id,
        hitIndices,
        centroid: [],
        hitCount: hitIndices.length,
        representativeHitIndex: hitIndices[0] ?? 0,
        color: `var(--cluster-${String(id % 8)})`,
      });
    }
    useClusterStore.setState({
      status: 'ready',
      clusters,
      assignments,
      instrumentAssignments: {},
      featureVectors: [],
      normalization: null,
      silhouette: 0.5,
      error: null,
    });
    useQuantizationStore.getState().recomputeQuantization();
    expect(useQuantizationStore.getState().quantizedHits).toEqual([]);
  });
});
