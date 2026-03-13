/**
 * BPM estimation from onset timestamps.
 *
 * Uses inter-onset intervals with outlier rejection and median filtering.
 */

/**
 * Estimate BPM from an array of onset timestamps (in seconds).
 *
 * @param timestamps - Onset timestamps in seconds, in chronological order
 * @param minHits - Minimum number of onsets required (default 4)
 * @returns Estimated BPM clamped to [40, 240], or null if insufficient data
 */
export function estimateBpm(timestamps: number[], minHits = 4): number | null {
  if (timestamps.length < minHits) {
    return null;
  }

  // Use last 16 timestamps
  const recent = timestamps.slice(-16);

  if (recent.length < 2) {
    return null;
  }

  // Compute inter-onset intervals
  const intervals: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    const interval = (recent[i] ?? 0) - (recent[i - 1] ?? 0);
    if (interval > 0) {
      intervals.push(interval);
    }
  }

  if (intervals.length === 0) {
    return null;
  }

  // Compute median interval for outlier detection
  const sortedForMedian = [...intervals].sort((a, b) => a - b);
  const mid = sortedForMedian.length >>> 1;
  const medianInterval =
    sortedForMedian.length % 2 === 0
      ? ((sortedForMedian[mid - 1] ?? 0) + (sortedForMedian[mid] ?? 0)) / 2
      : (sortedForMedian[mid] ?? 0);

  // Filter outliers: remove intervals > 2x median
  const filtered = intervals.filter((v) => v <= 2 * medianInterval);

  if (filtered.length === 0) {
    return null;
  }

  // Median of filtered intervals
  const sortedFiltered = [...filtered].sort((a, b) => a - b);
  const fMid = sortedFiltered.length >>> 1;
  const filteredMedian =
    sortedFiltered.length % 2 === 0
      ? ((sortedFiltered[fMid - 1] ?? 0) + (sortedFiltered[fMid] ?? 0)) / 2
      : (sortedFiltered[fMid] ?? 0);

  if (filteredMedian <= 0) {
    return null;
  }

  // BPM from median interval, clamped to [40, 240]
  const bpm = 60 / filteredMedian;
  return Math.max(40, Math.min(240, bpm));
}
