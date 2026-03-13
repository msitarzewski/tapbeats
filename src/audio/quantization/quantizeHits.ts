import type { DetectedHit } from '@/types/audio';
import type { ClusterData } from '@/types/clustering';
import type { QuantizationConfig, QuantizedHit } from '@/types/quantization';

import { gridIntervalSeconds, nearestGridPoint } from './gridUtils';

/**
 * Build a map from original cluster ID (as stored in the assignments array)
 * to remapped cluster ID (the contiguous 0-based ClusterData.id).
 *
 * Each cluster's hitIndices contains onset indices belonging to it.
 * We look up assignments[hitIndices[0]] to find the original cluster ID,
 * then map that to cluster.id (the remapped ID).
 */
function buildOriginalToRemappedMap(
  clusters: readonly ClusterData[],
  assignments: readonly number[],
): Map<number, number> {
  const map = new Map<number, number>();
  for (const cluster of clusters) {
    const firstHitIndex = cluster.hitIndices[0];
    if (firstHitIndex === undefined) continue;
    const originalId = assignments[firstHitIndex];
    if (originalId === undefined) continue;
    map.set(originalId, cluster.id);
  }
  return map;
}

/**
 * Quantize detected hits to a rhythmic grid.
 *
 * Pure function: takes all data as arguments, produces a sorted array of
 * QuantizedHit objects. Skips hits whose cluster instrument is 'skip' or
 * has no assignment.
 */
export function quantizeHits(
  onsets: readonly DetectedHit[],
  clusters: readonly ClusterData[],
  assignments: readonly number[],
  instrumentAssignments: Readonly<Record<number, string>>,
  config: QuantizationConfig,
): QuantizedHit[] {
  const originalToRemapped = buildOriginalToRemappedMap(clusters, assignments);
  const gridInterval = gridIntervalSeconds(config.bpm, config.gridResolution);
  const beatDuration = 60 / config.bpm;

  // Collect non-skipped onset indices and find grid origin
  const validEntries: {
    index: number;
    onset: DetectedHit;
    instrumentId: string;
    remappedClusterId: number;
  }[] = [];

  for (let i = 0; i < onsets.length; i++) {
    const onset = onsets[i];
    if (onset === undefined) continue;

    const originalClusterId = assignments[i];
    if (originalClusterId === undefined) continue;

    const remappedClusterId = originalToRemapped.get(originalClusterId);
    if (remappedClusterId === undefined) continue;

    const instrumentId = instrumentAssignments[remappedClusterId];
    if (instrumentId === undefined || instrumentId === 'skip') continue;

    validEntries.push({ index: i, onset, instrumentId, remappedClusterId });
  }

  if (validEntries.length === 0) return [];

  // Grid origin = timestamp of the first non-skipped onset
  const firstEntry = validEntries[0];
  if (firstEntry === undefined) return [];
  const gridOrigin = firstEntry.onset.onset.timestamp;

  const result: QuantizedHit[] = [];

  for (const entry of validEntries) {
    const originalTime = entry.onset.onset.timestamp;

    // Find nearest grid point
    const nearest = nearestGridPoint(originalTime, gridOrigin, gridInterval);

    // Apply swing: shift odd grid positions
    const gridIndex = Math.round((originalTime - gridOrigin) / gridInterval);
    let nearestWithSwing = nearest;
    if (gridIndex % 2 !== 0) {
      nearestWithSwing += (config.swingAmount - 0.5) * gridInterval;
    }

    // Strength interpolation: blend between original and quantized position
    const quantizedTime =
      originalTime + (nearestWithSwing - originalTime) * (config.strength / 100);

    // Grid position in beats from start
    const gridPosition = (quantizedTime - gridOrigin) / beatDuration;

    // Velocity from onset strength, clamped to 0-1
    const velocity = Math.max(0, Math.min(1, entry.onset.onset.strength));

    result.push({
      originalTime,
      quantizedTime,
      gridPosition,
      velocity,
      clusterId: entry.remappedClusterId,
      instrumentId: entry.instrumentId,
      hitIndex: entry.index,
    });
  }

  // Sort by quantized time ascending
  result.sort((a, b) => a.quantizedTime - b.quantizedTime);

  return result;
}
