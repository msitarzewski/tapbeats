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

  // Compute simple centroids
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

describe('clusterStore', () => {
  beforeEach(() => {
    useClusterStore.getState().reset();
    useRecordingStore.getState().reset();
  });

  describe('initial state', () => {
    it('has idle status', () => {
      expect(useClusterStore.getState().status).toBe('idle');
    });

    it('has empty clusters array', () => {
      expect(useClusterStore.getState().clusters).toEqual([]);
    });

    it('has empty assignments array', () => {
      expect(useClusterStore.getState().assignments).toEqual([]);
    });

    it('has zero silhouette', () => {
      expect(useClusterStore.getState().silhouette).toBe(0);
    });

    it('has null error', () => {
      expect(useClusterStore.getState().error).toBeNull();
    });
  });

  describe('setClustering', () => {
    it('sets status to ready', () => {
      const rng = seededRng(42);
      const { output, hits } = makeMockClusteringOutput([
        generateClusterPoints(new Array<number>(12).fill(0), 5, 0.1, rng),
        generateClusterPoints(new Array<number>(12).fill(10), 5, 0.1, rng),
      ]);

      useClusterStore.getState().setClustering(output, hits);
      expect(useClusterStore.getState().status).toBe('ready');
    });

    it('populates clusters with correct count', () => {
      const rng = seededRng(42);
      const { output, hits } = makeMockClusteringOutput([
        generateClusterPoints(new Array<number>(12).fill(0), 5, 0.1, rng),
        generateClusterPoints(new Array<number>(12).fill(10), 5, 0.1, rng),
        generateClusterPoints(new Array<number>(12).fill(20), 5, 0.1, rng),
      ]);

      useClusterStore.getState().setClustering(output, hits);
      expect(useClusterStore.getState().clusters.length).toBe(3);
    });

    it('assigns correct colors based on cluster ID', () => {
      const rng = seededRng(42);
      const { output, hits } = makeMockClusteringOutput([
        generateClusterPoints(new Array<number>(12).fill(0), 5, 0.1, rng),
        generateClusterPoints(new Array<number>(12).fill(10), 5, 0.1, rng),
      ]);

      useClusterStore.getState().setClustering(output, hits);
      const clusters = useClusterStore.getState().clusters;
      expect(clusters[0]?.color).toBe('var(--cluster-0)');
      expect(clusters[1]?.color).toBe('var(--cluster-1)');
    });

    it('stores assignments array with correct length', () => {
      const rng = seededRng(42);
      const { output, hits } = makeMockClusteringOutput([
        generateClusterPoints(new Array<number>(12).fill(0), 4, 0.1, rng),
        generateClusterPoints(new Array<number>(12).fill(10), 6, 0.1, rng),
      ]);

      useClusterStore.getState().setClustering(output, hits);
      expect(useClusterStore.getState().assignments.length).toBe(10);
    });

    it('each cluster has correct hitCount', () => {
      const rng = seededRng(42);
      const { output, hits } = makeMockClusteringOutput([
        generateClusterPoints(new Array<number>(12).fill(0), 3, 0.1, rng),
        generateClusterPoints(new Array<number>(12).fill(10), 7, 0.1, rng),
      ]);

      useClusterStore.getState().setClustering(output, hits);
      const clusters = useClusterStore.getState().clusters;
      expect(clusters[0]?.hitCount).toBe(3);
      expect(clusters[1]?.hitCount).toBe(7);
    });

    it('representative hit index is valid', () => {
      const rng = seededRng(42);
      const { output, hits } = makeMockClusteringOutput([
        generateClusterPoints(new Array<number>(12).fill(0), 5, 0.1, rng),
        generateClusterPoints(new Array<number>(12).fill(10), 5, 0.1, rng),
      ]);

      useClusterStore.getState().setClustering(output, hits);
      const clusters = useClusterStore.getState().clusters;
      for (const cluster of clusters) {
        expect(cluster.representativeHitIndex).toBeGreaterThanOrEqual(0);
        expect(cluster.representativeHitIndex).toBeLessThan(hits.length);
        // Representative must be within the cluster's own hit indices
        expect(cluster.hitIndices).toContain(cluster.representativeHitIndex);
      }
    });
  });

  describe('splitCluster', () => {
    it('increases cluster count', () => {
      const rng = seededRng(42);
      const { output, hits } = makeMockClusteringOutput([
        generateClusterPoints(new Array<number>(12).fill(0), 10, 2, rng),
        generateClusterPoints(new Array<number>(12).fill(50), 10, 2, rng),
      ]);

      // Populate recordingStore with hits for splitCluster to read
      for (const hit of hits) {
        useRecordingStore.getState().addOnset(hit);
      }

      useClusterStore.getState().setClustering(output, hits);
      const before = useClusterStore.getState().clusters.length;

      useClusterStore.getState().splitCluster(0);
      const after = useClusterStore.getState().clusters.length;

      expect(after).toBe(before + 1);
    });
  });

  describe('mergeClusters', () => {
    it('decreases cluster count', () => {
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
      const before = useClusterStore.getState().clusters.length;

      useClusterStore.getState().mergeClusters(0, 1);
      const after = useClusterStore.getState().clusters.length;

      expect(after).toBe(before - 1);
    });
  });

  describe('reset', () => {
    it('returns to initial state', () => {
      const rng = seededRng(42);
      const { output, hits } = makeMockClusteringOutput([
        generateClusterPoints(new Array<number>(12).fill(0), 5, 0.1, rng),
      ]);

      useClusterStore.getState().setClustering(output, hits);
      expect(useClusterStore.getState().status).toBe('ready');

      useClusterStore.getState().reset();

      const state = useClusterStore.getState();
      expect(state.status).toBe('idle');
      expect(state.clusters).toEqual([]);
      expect(state.assignments).toEqual([]);
      expect(state.silhouette).toBe(0);
      expect(state.error).toBeNull();
    });
  });
});
