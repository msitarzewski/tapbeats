import { useClusterStore } from '@/state/clusterStore';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useRecordingStore } from '@/state/recordingStore';
import { useTimelineStore } from '@/state/timelineStore';
import type { DetectedHit } from '@/types/audio';
import type { ClusterData } from '@/types/clustering';
import type { QuantizedHit } from '@/types/quantization';

/**
 * Seed recording, cluster, quantization, and timeline stores with test data.
 * Creates `hitCount` hits distributed round-robin across `clusterCount` clusters
 * at the given `bpm`.
 */
export function seedFullTimeline(
  bpm: number,
  hitCount: number,
  clusterCount: number,
): { quantizedHits: QuantizedHit[]; clusters: ClusterData[] } {
  const interval = 60 / bpm;

  // Seed recording store
  const recStore = useRecordingStore.getState();
  for (let i = 0; i < hitCount; i++) {
    const hit: DetectedHit = {
      onset: {
        timestamp: i * interval,
        strength: 0.5 + Math.random() * 0.5,
        snippetBuffer: null,
      },
      features: null,
    };
    recStore.addOnset(hit);
  }

  // Build clusters and assignments
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
  const instrumentAssignments: Record<number, string> = {};
  const instrumentNames = ['kick-deep', 'snare-crack', 'hihat-closed-1', 'tom-high'];

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
    instrumentAssignments[id] = instrumentNames[id % instrumentNames.length] ?? 'kick-deep';
  }

  useClusterStore.setState({
    status: 'ready',
    clusters,
    assignments,
    featureVectors: [],
    normalization: null,
    silhouette: 0.8,
    error: null,
    instrumentAssignments,
  });

  // Build quantized hits
  const quantizedHits: QuantizedHit[] = [];
  for (let i = 0; i < hitCount; i++) {
    const clusterId = i % clusterCount;
    quantizedHits.push({
      originalTime: i * interval,
      quantizedTime: i * interval,
      gridPosition: i,
      velocity: 0.5 + Math.random() * 0.5,
      clusterId,
      instrumentId: instrumentAssignments[clusterId] ?? 'kick-deep',
      hitIndex: i,
    });
  }

  useQuantizationStore.setState({
    bpm,
    quantizedHits,
  });

  // Init timeline tracks
  const trackIds = clusters.map((c) => c.id);
  useTimelineStore.getState().initTracks(trackIds);

  return { quantizedHits, clusters };
}

/**
 * Reset all stores to initial state.
 */
export function resetAllStores(): void {
  useTimelineStore.getState().reset();
  useQuantizationStore.getState().reset();
  useClusterStore.getState().reset();
  useRecordingStore.getState().reset();
}
