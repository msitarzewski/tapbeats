import { PlaybackEngine } from '@/audio/playback/PlaybackEngine';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useTimelineStore } from '@/state/timelineStore';
import type { ExportProgress } from '@/types/session';

export interface RenderOptions {
  readonly sampleRate?: number;
  readonly tailSeconds?: number; // Extra time after last hit for decay
  readonly onProgress?: (progress: ExportProgress) => void;
}

/**
 * Render the current mix to an AudioBuffer using OfflineAudioContext.
 * Mirrors PlaybackEngine's gain chain: source → velocityGain → trackGain → masterGain → destination
 */
export async function renderMix(options: RenderOptions = {}): Promise<AudioBuffer> {
  const sampleRate = options.sampleRate ?? 44100;
  const tailSeconds = options.tailSeconds ?? 2;
  const onProgress = options.onProgress;

  const { quantizedHits } = useQuantizationStore.getState();
  const { trackConfigs, masterVolume } = useTimelineStore.getState();
  const engine = PlaybackEngine.getInstance();

  // Determine duration
  const anySoloed = trackConfigs.some((tc) => tc.soloed);
  const activeTrackIds = new Set(
    anySoloed
      ? trackConfigs.filter((tc) => tc.soloed).map((tc) => tc.trackId)
      : trackConfigs.filter((tc) => !tc.muted).map((tc) => tc.trackId),
  );

  // Filter to active hits
  const activeHits = quantizedHits.filter((hit) => {
    const clusterId = hit.clusterId;
    return activeTrackIds.has(clusterId);
  });

  if (activeHits.length === 0) {
    // Return empty stereo buffer
    const ctx = new OfflineAudioContext(2, sampleRate, sampleRate);
    return ctx.startRendering();
  }

  // Find the latest hit time + longest sample duration + tail
  let maxEndTime = 0;
  for (const hit of activeHits) {
    const buffer = engine.getBuffer(hit.instrumentId);
    const bufferDuration = buffer !== null ? buffer.duration : 0;
    const endTime = hit.quantizedTime + bufferDuration;
    if (endTime > maxEndTime) maxEndTime = endTime;
  }

  const totalDuration = maxEndTime + tailSeconds;
  const totalFrames = Math.ceil(totalDuration * sampleRate);

  onProgress?.({ phase: 'rendering', percent: 5 });

  // Create offline context
  const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);

  // Master gain
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = masterVolume;
  masterGain.connect(offlineCtx.destination);

  // Create track gain nodes
  const trackGains = new Map<number, GainNode>();
  for (const tc of trackConfigs) {
    if (!activeTrackIds.has(tc.trackId)) continue;
    const gain = offlineCtx.createGain();
    gain.gain.value = tc.volume;
    gain.connect(masterGain);
    trackGains.set(tc.trackId, gain);
  }

  onProgress?.({ phase: 'rendering', percent: 20 });

  // Schedule all hits
  for (let i = 0; i < activeHits.length; i++) {
    const hit = activeHits[i];
    if (hit === undefined) continue;

    const buffer = engine.getBuffer(hit.instrumentId);
    if (buffer === null) continue;

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    // Velocity gain
    const velocityGain = offlineCtx.createGain();
    velocityGain.gain.value = Math.max(0, Math.min(1, hit.velocity));
    source.connect(velocityGain);

    // Route through track gain
    const trackGain = trackGains.get(hit.clusterId);
    if (trackGain !== undefined) {
      velocityGain.connect(trackGain);
    } else {
      velocityGain.connect(masterGain);
    }

    source.start(hit.quantizedTime);

    // Report progress periodically
    if (i % 50 === 0) {
      const pct = 20 + Math.round((i / activeHits.length) * 60);
      onProgress?.({ phase: 'rendering', percent: pct });
    }
  }

  onProgress?.({ phase: 'rendering', percent: 80 });

  const rendered = await offlineCtx.startRendering();

  onProgress?.({ phase: 'rendering', percent: 100 });

  return rendered;
}
