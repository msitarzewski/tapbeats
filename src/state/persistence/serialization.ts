import { RingBuffer } from '@/audio/capture/RingBuffer';
import { useClusterStore } from '@/state/clusterStore';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useRecordingStore } from '@/state/recordingStore';
import { useTimelineStore } from '@/state/timelineStore';
import type { DetectedHit } from '@/types/audio';
import type { AudioBlobEntry, SerializedSession, SessionMetadata } from '@/types/session';
import { SESSION_SCHEMA_VERSION, serializeFeatures, deserializeFeatures } from '@/types/session';

/** Copy Float32Array to a standalone ArrayBuffer */
function toArrayBuffer(f32: Float32Array): ArrayBuffer {
  const buf = new ArrayBuffer(f32.byteLength);
  new Float32Array(buf).set(f32);
  return buf;
}

/**
 * Serialize current app state into an IndexedDB-safe format.
 * Returns the JSON-safe session + binary blobs for audio data.
 */
export function serializeSession(
  sessionId: string,
  name: string,
  sampleRate: number,
): { session: SerializedSession; blobs: AudioBlobEntry[] } {
  const recording = useRecordingStore.getState();
  const cluster = useClusterStore.getState();
  const quantization = useQuantizationStore.getState();
  const timeline = useTimelineStore.getState();

  const blobs: AudioBlobEntry[] = [];

  // Store raw audio buffer as blob
  if (recording._rawAudioBuffer !== null) {
    const rawData = recording._rawAudioBuffer.toArray();
    blobs.push({
      key: `${sessionId}:raw`,
      sessionId,
      type: 'raw',
      subId: 'raw',
      data: toArrayBuffer(rawData),
      sampleRate,
    });
  }

  // Store snippet buffers as individual blobs
  for (let i = 0; i < recording._onsets.length; i++) {
    const hit = recording._onsets[i];
    if (hit?.onset.snippetBuffer !== null && hit?.onset.snippetBuffer !== undefined) {
      const snippet = hit.onset.snippetBuffer;
      blobs.push({
        key: `${sessionId}:snippet:${String(i)}`,
        sessionId,
        type: 'snippet',
        subId: String(i),
        data: toArrayBuffer(snippet),
        sampleRate,
      });
    }
  }

  const onsetTimestamps: number[] = [];
  const onsetStrengths: number[] = [];
  const onsetFeatures: (ReturnType<typeof serializeFeatures> | null)[] = [];

  for (const hit of recording._onsets) {
    onsetTimestamps.push(hit.onset.timestamp);
    onsetStrengths.push(hit.onset.strength);
    onsetFeatures.push(hit.features !== null ? serializeFeatures(hit.features) : null);
  }

  const metadata: SessionMetadata = {
    id: sessionId,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sampleRate,
    durationMs: recording.elapsedTime * 1000,
    hitCount: recording._onsets.length,
    bpm: quantization.bpm,
    version: SESSION_SCHEMA_VERSION,
  };

  const session: SerializedSession = {
    id: sessionId,
    metadata,
    sensitivity: recording._sensitivity,
    onsetTimestamps,
    onsetStrengths,
    onsetFeatures,
    featureVectors: cluster.featureVectors,
    normalizationMins: cluster.normalization?.mins ?? [],
    normalizationMaxes: cluster.normalization?.maxes ?? [],
    assignments: cluster.assignments,
    silhouette: cluster.silhouette,
    instrumentAssignments: { ...cluster.instrumentAssignments },
    bpm: quantization.bpm,
    bpmManualOverride: quantization.bpmManualOverride,
    gridResolution: quantization.gridResolution,
    strength: quantization.strength,
    swingAmount: quantization.swingAmount,
    quantizedHits: quantization.quantizedHits.map((h) => ({ ...h })),
    playbackMode: quantization.playbackMode,
    trackConfigs: timeline.trackConfigs.map((tc) => ({ ...tc })),
    masterVolume: timeline.masterVolume,
  };

  return { session, blobs };
}

/**
 * Reconstruct DetectedHit[] from serialized session + snippet blobs.
 */
export function deserializeOnsets(
  session: SerializedSession,
  snippetBlobs: Map<string, AudioBlobEntry>,
): DetectedHit[] {
  const hits: DetectedHit[] = [];

  for (let i = 0; i < session.onsetTimestamps.length; i++) {
    const timestamp = session.onsetTimestamps[i] ?? 0;
    const strength = session.onsetStrengths[i] ?? 0;
    const featureData = session.onsetFeatures[i];

    const snippetBlob = snippetBlobs.get(String(i));
    const snippetBuffer = snippetBlob !== undefined ? new Float32Array(snippetBlob.data) : null;

    hits.push({
      onset: { timestamp, strength, snippetBuffer },
      features:
        featureData !== null && featureData !== undefined ? deserializeFeatures(featureData) : null,
    });
  }

  return hits;
}

/**
 * Reconstruct a RingBuffer from a raw audio blob.
 */
export function deserializeRingBuffer(rawBlob: AudioBlobEntry): RingBuffer {
  const data = new Float32Array(rawBlob.data);
  return RingBuffer.fromArray(data, rawBlob.sampleRate);
}

/**
 * Restore all stores from a serialized session + audio blobs.
 * Order: reset all → recording → cluster → quantization → timeline
 */
export function restoreStores(session: SerializedSession, blobs: AudioBlobEntry[]): void {
  // Reset all stores first
  useRecordingStore.getState().reset();
  useClusterStore.getState().reset();
  useQuantizationStore.getState().reset();
  useTimelineStore.getState().reset();

  // Organize blobs by type
  const snippetBlobs = new Map<string, AudioBlobEntry>();
  let rawBlob: AudioBlobEntry | null = null;

  for (const blob of blobs) {
    if (blob.type === 'raw') {
      rawBlob = blob;
    } else {
      snippetBlobs.set(blob.subId, blob);
    }
  }

  // 1. Restore recording store
  const onsets = deserializeOnsets(session, snippetBlobs);
  const ringBuffer = rawBlob !== null ? deserializeRingBuffer(rawBlob) : null;

  useRecordingStore.setState({
    status: 'complete',
    elapsedTime: session.metadata.durationMs / 1000,
    hitCount: onsets.length,
    peakLevel: 0,
    error: null,
    _rawAudioBuffer: ringBuffer,
    _amplitudes: [],
    _onsets: onsets,
    _sensitivity: session.sensitivity,
    _onsetTimestamps: session.onsetTimestamps,
  });

  // 2. Restore cluster store
  const normalization =
    session.normalizationMins.length > 0
      ? {
          normalized: session.featureVectors,
          mins: session.normalizationMins,
          maxes: session.normalizationMaxes,
        }
      : null;

  // Use setClustering to properly rebuild cluster data
  if (session.assignments.length > 0) {
    const clusterCount = new Set(session.assignments).size;
    useClusterStore.getState().setClustering(
      {
        assignments: session.assignments,
        centroids: [], // Will be recomputed by buildClusterData inside setClustering
        featureVectors: session.featureVectors,
        normalization: normalization ?? { normalized: [], mins: [], maxes: [] },
        clusterCount,
        silhouette: session.silhouette,
      },
      onsets,
    );
  }

  // Restore instrument assignments after setClustering (which clears them)
  useClusterStore.setState({
    instrumentAssignments: { ...session.instrumentAssignments },
  });

  // 3. Restore quantization store
  useQuantizationStore.setState({
    bpm: session.bpm,
    bpmManualOverride: session.bpmManualOverride,
    gridResolution: session.gridResolution,
    strength: session.strength,
    swingAmount: session.swingAmount,
    quantizedHits: session.quantizedHits,
    playbackMode: session.playbackMode,
  });

  // 4. Restore timeline store
  useTimelineStore.setState({
    trackConfigs: session.trackConfigs,
    masterVolume: session.masterVolume,
    selectedTrackIndex: 0,
    undoStack: [],
    redoStack: [],
  });
}
