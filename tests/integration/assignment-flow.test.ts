import { describe, it, expect, beforeEach } from 'vitest';

import { suggestInstruments } from '@/audio/playback/smartDefaults';
import { useClusterStore } from '@/state/clusterStore';
import { useRecordingStore } from '@/state/recordingStore';
import type { DetectedHit } from '@/types/audio';
import type { ClusteringOutput } from '@/types/clustering';

import {
  seededRng,
  generateClusterPoints,
  createMockDetectedHits,
} from '../helpers/clusteringFixtures';

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

describe('assignment flow integration', () => {
  beforeEach(() => {
    useClusterStore.getState().reset();
    useRecordingStore.getState().reset();
  });

  it('default suggestions are computed from cluster data', () => {
    const rng = seededRng(42);
    // Use feature vectors that resemble different drum categories
    // 7 features: [rms, spectralCentroid, spectralRolloff, spectralFlatness, zeroCrossingRate, attackTime, decayTime]
    const kickFeatures = generateClusterPoints([0.9, 0.15, 0.2, 0.3, 0.1, 0.1, 0.7], 5, 0.05, rng);
    const hihatFeatures = generateClusterPoints(
      [0.4, 0.85, 0.8, 0.8, 0.9, 0.05, 0.2],
      5,
      0.05,
      rng,
    );

    const { output, hits } = makeMockClusteringOutput([kickFeatures, hihatFeatures]);
    useClusterStore.getState().setClustering(output, hits);

    const clusters = useClusterStore.getState().clusters;
    const suggestions = suggestInstruments(clusters);

    expect(suggestions.size).toBe(2);
    // Each cluster should get a suggestion
    for (const cluster of clusters) {
      expect(suggestions.has(cluster.id)).toBe(true);
    }
  });

  it('user can assign instrument to cluster', () => {
    const rng = seededRng(42);
    const { output, hits } = makeMockClusteringOutput([
      generateClusterPoints(new Array<number>(7).fill(0), 5, 0.1, rng),
      generateClusterPoints(new Array<number>(7).fill(10), 5, 0.1, rng),
    ]);

    useClusterStore.getState().setClustering(output, hits);

    // Suggest defaults
    const clusters = useClusterStore.getState().clusters;
    const suggestions = suggestInstruments(clusters);
    useClusterStore.getState().setDefaultSuggestions(suggestions);

    // User overrides cluster 0 with a specific instrument
    useClusterStore.getState().assignInstrument(0, 'tom-high');
    expect(useClusterStore.getState().instrumentAssignments[0]).toBe('tom-high');
    expect(useClusterStore.getState().hasAnyAssignment()).toBe(true);
  });

  it('user can skip a cluster', () => {
    const rng = seededRng(42);
    const { output, hits } = makeMockClusteringOutput([
      generateClusterPoints(new Array<number>(7).fill(0), 5, 0.1, rng),
      generateClusterPoints(new Array<number>(7).fill(10), 5, 0.1, rng),
    ]);

    useClusterStore.getState().setClustering(output, hits);

    const clusters = useClusterStore.getState().clusters;
    const suggestions = suggestInstruments(clusters);
    useClusterStore.getState().setDefaultSuggestions(suggestions);

    // User skips cluster 0
    useClusterStore.getState().skipCluster(0);
    expect(useClusterStore.getState().instrumentAssignments[0]).toBe('skip');
  });

  it('hasAnyAssignment returns correct values through a flow', () => {
    // Initially no assignments
    expect(useClusterStore.getState().hasAnyAssignment()).toBe(false);

    // Skip a cluster - still no "real" assignment
    useClusterStore.getState().skipCluster(0);
    expect(useClusterStore.getState().hasAnyAssignment()).toBe(false);

    // Assign a real instrument - now we have an assignment
    useClusterStore.getState().assignInstrument(1, 'kick-1');
    expect(useClusterStore.getState().hasAnyAssignment()).toBe(true);

    // Remove the instrument assignment
    useClusterStore.getState().assignInstrument(1, null);
    expect(useClusterStore.getState().hasAnyAssignment()).toBe(false);

    // Reset clears everything
    useClusterStore.getState().reset();
    expect(useClusterStore.getState().hasAnyAssignment()).toBe(false);
  });
});
