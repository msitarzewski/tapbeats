import { create } from 'zustand';

import { mergeClusters as mergeOp, splitCluster as splitOp } from '@/audio/clustering/operations';
import { silhouetteScore } from '@/audio/clustering/silhouette';
import { useRecordingStore } from '@/state/recordingStore';
import type { DetectedHit } from '@/types/audio';
import type {
  ClusterData,
  ClusteringOutput,
  ClusterStatus,
  NormalizationResult,
} from '@/types/clustering';

interface ClusterStoreState {
  // State
  status: ClusterStatus;
  clusters: ClusterData[];
  featureVectors: number[][];
  normalization: NormalizationResult | null;
  assignments: number[];
  silhouette: number;
  error: string | null;

  // Actions
  setClustering: (output: ClusteringOutput, hits: DetectedHit[]) => void;
  splitCluster: (clusterId: number) => void;
  mergeClusters: (clusterA: number, clusterB: number) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  status: 'idle' as ClusterStatus,
  clusters: [] as ClusterData[],
  featureVectors: [] as number[][],
  normalization: null as NormalizationResult | null,
  assignments: [] as number[],
  silhouette: 0,
  error: null as string | null,
};

function buildClusterData(
  assignments: number[],
  featureVectors: number[][],
  hits: DetectedHit[],
): ClusterData[] {
  // Group hit indices by assignment
  const groups = new Map<number, number[]>();
  for (let i = 0; i < assignments.length; i++) {
    const clusterId = assignments[i];
    if (clusterId === undefined) continue;
    const existing = groups.get(clusterId);
    if (existing !== undefined) {
      existing.push(i);
    } else {
      groups.set(clusterId, [i]);
    }
  }

  // Sort cluster IDs and remap to contiguous 0-based
  const sortedIds = [...groups.keys()].sort((a, b) => a - b);

  return sortedIds.map((originalId, newId) => {
    const hitIndices = groups.get(originalId) ?? [];

    // Compute centroid from feature vectors of this cluster's hits
    const clusterVectors = hitIndices
      .map((idx) => featureVectors[idx])
      .filter((v): v is number[] => v !== undefined);

    const dims = clusterVectors[0]?.length ?? 0;
    const centroid = new Array<number>(dims).fill(0);
    for (const vec of clusterVectors) {
      for (let d = 0; d < dims; d++) {
        centroid[d] = (centroid[d] ?? 0) + (vec[d] ?? 0);
      }
    }
    if (clusterVectors.length > 0) {
      for (let d = 0; d < dims; d++) {
        centroid[d] = (centroid[d] ?? 0) / clusterVectors.length;
      }
    }

    // Find representative hit: closest to centroid among hits with non-null features
    let representativeHitIndex = hitIndices[0] ?? 0;
    let minDist = Infinity;
    for (const idx of hitIndices) {
      const hit = hits[idx];
      if (hit?.features === null || hit?.features === undefined) continue;
      const vec = featureVectors[idx];
      if (vec === undefined) continue;
      let dist = 0;
      for (let d = 0; d < dims; d++) {
        const diff = (vec[d] ?? 0) - (centroid[d] ?? 0);
        dist += diff * diff;
      }
      if (dist < minDist) {
        minDist = dist;
        representativeHitIndex = idx;
      }
    }

    return {
      id: newId,
      hitIndices,
      centroid,
      hitCount: hitIndices.length,
      representativeHitIndex,
      color: `var(--cluster-${String(newId % 8)})`,
    };
  });
}

export const useClusterStore = create<ClusterStoreState>()((set, get) => ({
  ...INITIAL_STATE,

  setClustering: (output, hits) => {
    try {
      const clusters = buildClusterData(output.assignments, output.featureVectors, hits);
      set({
        status: 'ready',
        clusters,
        featureVectors: output.featureVectors,
        normalization: output.normalization,
        assignments: output.assignments,
        silhouette: output.silhouette,
        error: null,
      });
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : 'Failed to set clustering data',
      });
    }
  },

  splitCluster: (clusterId) => {
    const state = get();
    try {
      const result = splitOp(state.featureVectors, state.assignments, clusterId);
      const hits = useRecordingStore.getState()._onsets;
      const clusters = buildClusterData(result.assignments, state.featureVectors, hits);
      const k = new Set(result.assignments).size;
      const newSilhouette = silhouetteScore(state.featureVectors, result.assignments, k);
      set({
        assignments: result.assignments,
        clusters,
        silhouette: newSilhouette,
        error: null,
      });
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : 'Failed to split cluster',
      });
    }
  },

  mergeClusters: (clusterA, clusterB) => {
    const state = get();
    try {
      const result = mergeOp(state.featureVectors, state.assignments, clusterA, clusterB);
      const hits = useRecordingStore.getState()._onsets;
      const clusters = buildClusterData(result.assignments, state.featureVectors, hits);
      const k = new Set(result.assignments).size;
      const newSilhouette = silhouetteScore(state.featureVectors, result.assignments, k);
      set({
        assignments: result.assignments,
        clusters,
        silhouette: newSilhouette,
        error: null,
      });
    } catch (e) {
      set({
        status: 'error',
        error: e instanceof Error ? e.message : 'Failed to merge clusters',
      });
    }
  },

  reset: () => {
    set({ ...INITIAL_STATE });
  },
}));
