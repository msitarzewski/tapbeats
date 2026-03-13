import { estimateBpm } from '@/audio/analysis/estimateBpm';
import { useRecordingStore } from '@/state/recordingStore';

/**
 * Returns the current estimated BPM based on onset timestamps,
 * rounded to the nearest integer, or null if insufficient data.
 */
export function useBpmEstimate(): number | null {
  const onsetTimestamps = useRecordingStore((s) => s._onsetTimestamps);
  const bpm = estimateBpm(onsetTimestamps);
  return bpm !== null ? Math.round(bpm) : null;
}
