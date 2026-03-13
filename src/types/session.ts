import type { AudioFeatures, SensitivityLevel } from './audio';
import type { GridResolution, PlaybackMode, QuantizedHit } from './quantization';
import type { TrackConfig } from './timeline';

export interface SessionMetadata {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number; // Unix ms
  readonly updatedAt: number; // Unix ms
  readonly sampleRate: number;
  readonly durationMs: number;
  readonly hitCount: number;
  readonly bpm: number;
  readonly version: number; // Schema version
}

export interface SerializedAudioFeatures {
  readonly rms: number;
  readonly spectralCentroid: number;
  readonly spectralRolloff: number;
  readonly spectralFlatness: number;
  readonly zeroCrossingRate: number;
  readonly attackTime: number;
  readonly decayTime: number;
  readonly mfcc: number[];
}

export interface SerializedSession {
  readonly id: string;
  readonly metadata: SessionMetadata;
  // Recording
  readonly sensitivity: SensitivityLevel;
  readonly onsetTimestamps: number[];
  readonly onsetStrengths: number[];
  readonly onsetFeatures: (SerializedAudioFeatures | null)[];
  // Clustering
  readonly featureVectors: number[][];
  readonly normalizationMins: number[];
  readonly normalizationMaxes: number[];
  readonly assignments: number[];
  readonly silhouette: number;
  readonly instrumentAssignments: Record<number, string>;
  // Quantization
  readonly bpm: number;
  readonly bpmManualOverride: boolean;
  readonly gridResolution: GridResolution;
  readonly strength: number;
  readonly swingAmount: number;
  readonly quantizedHits: QuantizedHit[];
  readonly playbackMode: PlaybackMode;
  // Timeline
  readonly trackConfigs: TrackConfig[];
  readonly masterVolume: number;
}

export interface AudioBlobEntry {
  readonly key: string; // "{sessionId}:raw" or "{sessionId}:snippet:{hitIndex}"
  readonly sessionId: string;
  readonly type: 'raw' | 'snippet';
  readonly subId: string;
  readonly data: ArrayBuffer;
  readonly sampleRate: number;
}

export interface SessionListItem {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly durationMs: number;
  readonly bpm: number;
  readonly hitCount: number;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface ExportProgress {
  readonly phase: 'rendering' | 'encoding' | 'complete';
  readonly percent: number;
}

export const SESSION_SCHEMA_VERSION = 1;

/** Serialize AudioFeatures to a plain object (strips readonly arrays) */
export function serializeFeatures(f: AudioFeatures): SerializedAudioFeatures {
  return {
    rms: f.rms,
    spectralCentroid: f.spectralCentroid,
    spectralRolloff: f.spectralRolloff,
    spectralFlatness: f.spectralFlatness,
    zeroCrossingRate: f.zeroCrossingRate,
    attackTime: f.attackTime,
    decayTime: f.decayTime,
    mfcc: [...f.mfcc],
  };
}

/** Deserialize back to AudioFeatures */
export function deserializeFeatures(s: SerializedAudioFeatures): AudioFeatures {
  return {
    rms: s.rms,
    spectralCentroid: s.spectralCentroid,
    spectralRolloff: s.spectralRolloff,
    spectralFlatness: s.spectralFlatness,
    zeroCrossingRate: s.zeroCrossingRate,
    attackTime: s.attackTime,
    decayTime: s.decayTime,
    mfcc: s.mfcc,
  };
}
