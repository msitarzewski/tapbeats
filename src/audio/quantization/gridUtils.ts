import type { GridResolution } from '@/types/quantization';

/** Convert grid resolution to fraction of a beat. */
export function gridResolutionToBeats(resolution: GridResolution): number {
  // '1/4' = 1 beat, '1/8' = 0.5, '1/16' = 0.25
  // '1/4T' = 2/3, '1/8T' = 1/3, '1/16T' = 1/6
  const map: Record<GridResolution, number> = {
    '1/4': 1,
    '1/8': 0.5,
    '1/16': 0.25,
    '1/4T': 2 / 3,
    '1/8T': 1 / 3,
    '1/16T': 1 / 6,
  };
  return map[resolution];
}

/** Compute the grid interval in seconds for a given BPM and resolution. */
export function gridIntervalSeconds(bpm: number, resolution: GridResolution): number {
  const beatDuration = 60 / bpm;
  return beatDuration * gridResolutionToBeats(resolution);
}

/** Find the nearest grid point to a given time. */
export function nearestGridPoint(time: number, gridOrigin: number, gridInterval: number): number {
  const relativeTime = time - gridOrigin;
  const gridIndex = Math.round(relativeTime / gridInterval);
  return gridOrigin + gridIndex * gridInterval;
}
