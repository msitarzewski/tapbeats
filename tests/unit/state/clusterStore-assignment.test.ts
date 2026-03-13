import { describe, it, expect, beforeEach } from 'vitest';

import { useClusterStore } from '@/state/clusterStore';
import { useRecordingStore } from '@/state/recordingStore';
import type { DetectedHit } from '@/types/audio';
import type { ClusteringOutput } from '@/types/clustering';

import {
  seededRng,
  generateClusterPoints,
  createMockDetectedHits,
} from '../../helpers/clusteringFixtures';

function makeMockClusteringOutput(featureGroups: number[][][]): {
  output: ClusteringOutput;
  hits: DetectedHit[];
} {
  const allVectors: number[][] = [];
  const assignments: number[] = [];

  for (let g = 0; g < featureGroups.length; g++) {
    for (const vec of featureGroups[g] ?? []) {
      allVectors.push(vec);
      assignments.push(g);
    }
  }

  const hits = createMockDetectedHits(featureGroups);

  const centroids: number[][] = [];
  for (const group of featureGroups) {
    const dims = (group[0] ?? []).length;
    const centroid = new Array<number>(dims).fill(0);
    for (const vec of group) {
      for (let d = 0; d < dims; d++) {
        centroid[d] = (centroid[d] ?? 0) + (vec[d] ?? 0);
      }
    }
    if (group.length > 0) {
      for (let d = 0; d < dims; d++) {
        centroid[d] = (centroid[d] ?? 0) / group.length;
      }
    }
    centroids.push(centroid);
  }

  const output: ClusteringOutput = {
    assignments,
    centroids,
    featureVectors: allVectors,
    normalization: { normalized: allVectors, mins: [], maxes: [] },
    clusterCount: featureGroups.length,
    silhouette: 0.8,
  };

  return { output, hits };
}

function setupWithClusters(): void {
  const rng = seededRng(42);
  const { output, hits } = makeMockClusteringOutput([
    generateClusterPoints(new Array<number>(12).fill(0), 5, 0.1, rng),
    generateClusterPoints(new Array<number>(12).fill(10), 5, 0.1, rng),
    generateClusterPoints(new Array<number>(12).fill(20), 5, 0.1, rng),
  ]);

  for (const hit of hits) {
    useRecordingStore.getState().addOnset(hit);
  }

  useClusterStore.getState().setClustering(output, hits);
}

describe('clusterStore instrument assignments', () => {
  beforeEach(() => {
    useClusterStore.getState().reset();
    useRecordingStore.getState().reset();
  });

  it('initial instrumentAssignments is empty', () => {
    const state = useClusterStore.getState();
    expect(state.instrumentAssignments).toEqual({});
  });

  it('assignInstrument sets instrument for cluster', () => {
    useClusterStore.getState().assignInstrument(0, 'kick-1');
    expect(useClusterStore.getState().instrumentAssignments[0]).toBe('kick-1');
  });

  it('assignInstrument with null removes assignment', () => {
    useClusterStore.getState().assignInstrument(0, 'kick-1');
    expect(useClusterStore.getState().instrumentAssignments[0]).toBe('kick-1');

    useClusterStore.getState().assignInstrument(0, null);
    expect(useClusterStore.getState().instrumentAssignments[0]).toBeUndefined();
  });

  it('skipCluster sets skip', () => {
    useClusterStore.getState().skipCluster(1);
    expect(useClusterStore.getState().instrumentAssignments[1]).toBe('skip');
  });

  it('setDefaultSuggestions populates unassigned clusters', () => {
    const suggestions = new Map<number, string>([
      [0, 'kick-1'],
      [1, 'snare-1'],
      [2, 'hihat-closed-1'],
    ]);
    useClusterStore.getState().setDefaultSuggestions(suggestions);

    const assignments = useClusterStore.getState().instrumentAssignments;
    expect(assignments[0]).toBe('kick-1');
    expect(assignments[1]).toBe('snare-1');
    expect(assignments[2]).toBe('hihat-closed-1');
  });

  it('setDefaultSuggestions does not override existing assignments', () => {
    useClusterStore.getState().assignInstrument(0, 'tom-high');

    const suggestions = new Map<number, string>([
      [0, 'kick-1'],
      [1, 'snare-1'],
    ]);
    useClusterStore.getState().setDefaultSuggestions(suggestions);

    const assignments = useClusterStore.getState().instrumentAssignments;
    expect(assignments[0]).toBe('tom-high'); // not overridden
    expect(assignments[1]).toBe('snare-1');
  });

  it('hasAnyAssignment returns false when empty', () => {
    expect(useClusterStore.getState().hasAnyAssignment()).toBe(false);
  });

  it('hasAnyAssignment returns false when all skipped', () => {
    useClusterStore.getState().skipCluster(0);
    useClusterStore.getState().skipCluster(1);
    expect(useClusterStore.getState().hasAnyAssignment()).toBe(false);
  });

  it('hasAnyAssignment returns true when at least one assigned', () => {
    useClusterStore.getState().skipCluster(0);
    useClusterStore.getState().assignInstrument(1, 'kick-1');
    expect(useClusterStore.getState().hasAnyAssignment()).toBe(true);
  });

  it('splitCluster clears instrumentAssignments', () => {
    setupWithClusters();
    useClusterStore.getState().assignInstrument(0, 'kick-1');
    expect(useClusterStore.getState().instrumentAssignments[0]).toBe('kick-1');

    useClusterStore.getState().splitCluster(0);
    expect(useClusterStore.getState().instrumentAssignments).toEqual({});
  });

  it('mergeClusters clears instrumentAssignments', () => {
    setupWithClusters();
    useClusterStore.getState().assignInstrument(0, 'kick-1');
    useClusterStore.getState().assignInstrument(1, 'snare-1');

    useClusterStore.getState().mergeClusters(0, 1);
    expect(useClusterStore.getState().instrumentAssignments).toEqual({});
  });

  it('reset clears instrumentAssignments', () => {
    useClusterStore.getState().assignInstrument(0, 'kick-1');
    useClusterStore.getState().assignInstrument(1, 'snare-1');

    useClusterStore.getState().reset();
    expect(useClusterStore.getState().instrumentAssignments).toEqual({});
  });
});
