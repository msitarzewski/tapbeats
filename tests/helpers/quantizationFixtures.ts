import type { DetectedHit } from '@/types/audio';
import type { ClusterData } from '@/types/clustering';

/**
 * Generate evenly-spaced onset timestamps at a given BPM.
 * @param bpm - Beats per minute
 * @param count - Number of onsets
 * @param jitterMs - Optional random timing jitter in milliseconds (default 0)
 */
export function generateTimestamps(bpm: number, count: number, jitterMs = 0): number[] {
  const interval = 60 / bpm;
  const timestamps: number[] = [];
  for (let i = 0; i < count; i++) {
    const jitter = jitterMs > 0 ? (Math.random() - 0.5) * 2 * (jitterMs / 1000) : 0;
    timestamps.push(i * interval + jitter);
  }
  return timestamps;
}

/**
 * Generate DetectedHit[] with evenly-spaced timestamps at a given BPM.
 */
export function generateHits(bpm: number, count: number, jitterMs = 0): DetectedHit[] {
  const timestamps = generateTimestamps(bpm, count, jitterMs);
  return timestamps.map((t) => ({
    onset: {
      timestamp: t,
      strength: 0.5 + Math.random() * 0.5,
      snippetBuffer: null,
    },
    features: null,
  }));
}

/**
 * Create mock clusters and assignments for a given set of hits.
 * Distributes hits round-robin across the specified number of clusters.
 */
export function createMockClustersAndAssignments(
  hitCount: number,
  clusterCount: number,
): { clusters: ClusterData[]; assignments: number[] } {
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

  return { clusters, assignments };
}
