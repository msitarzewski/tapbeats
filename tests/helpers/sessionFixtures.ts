import type { DetectedHit, AudioFeatures, SensitivityLevel } from '@/types/audio';
import type { QuantizedHit } from '@/types/quantization';
import type {
  SerializedSession,
  SessionMetadata,
  AudioBlobEntry,
  SessionListItem,
} from '@/types/session';
import type { TrackConfig } from '@/types/timeline';

export const MOCK_FEATURES: AudioFeatures = {
  rms: 0.5,
  spectralCentroid: 2000,
  spectralRolloff: 4000,
  spectralFlatness: 0.3,
  zeroCrossingRate: 0.1,
  attackTime: 0.01,
  decayTime: 0.05,
  mfcc: [1, 2, 3, 4, 5],
};

export function createMockHit(
  timestamp: number,
  strength: number,
  withSnippet = true,
  withFeatures = true,
): DetectedHit {
  return {
    onset: {
      timestamp,
      strength,
      snippetBuffer: withSnippet ? new Float32Array([0.1, 0.2, 0.3, 0.4]) : null,
    },
    features: withFeatures ? MOCK_FEATURES : null,
  };
}

export function createMockQuantizedHit(
  index: number,
  clusterId = 0,
  instrumentId = 'kick-basic',
): QuantizedHit {
  return {
    originalTime: index * 0.5,
    quantizedTime: index * 0.5,
    gridPosition: index,
    velocity: 0.8,
    clusterId,
    instrumentId,
    hitIndex: index,
  };
}

export function createMockTrackConfig(trackId: number): TrackConfig {
  return {
    trackId,
    muted: false,
    soloed: false,
    volume: 0.8,
  };
}

export function createMockMetadata(id = 'test-session-1'): SessionMetadata {
  return {
    id,
    name: 'Test Beat',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    sampleRate: 44100,
    durationMs: 5000,
    hitCount: 4,
    bpm: 120,
    version: 1,
  };
}

export function createMockSerializedSession(id = 'test-session-1'): SerializedSession {
  return {
    id,
    metadata: createMockMetadata(id),
    sensitivity: 'medium' as SensitivityLevel,
    onsetTimestamps: [0, 0.5, 1.0, 1.5],
    onsetStrengths: [0.8, 0.6, 0.7, 0.9],
    onsetFeatures: [
      {
        rms: 0.5,
        spectralCentroid: 2000,
        spectralRolloff: 4000,
        spectralFlatness: 0.3,
        zeroCrossingRate: 0.1,
        attackTime: 0.01,
        decayTime: 0.05,
        mfcc: [1, 2, 3, 4, 5],
      },
      null,
      {
        rms: 0.5,
        spectralCentroid: 2000,
        spectralRolloff: 4000,
        spectralFlatness: 0.3,
        zeroCrossingRate: 0.1,
        attackTime: 0.01,
        decayTime: 0.05,
        mfcc: [1, 2, 3, 4, 5],
      },
      null,
    ],
    featureVectors: [
      [0.1, 0.2],
      [0.3, 0.4],
      [0.5, 0.6],
      [0.7, 0.8],
    ],
    normalizationMins: [0, 0],
    normalizationMaxes: [1, 1],
    assignments: [0, 0, 1, 1],
    silhouette: 0.7,
    instrumentAssignments: { 0: 'kick-basic', 1: 'snare-basic' },
    bpm: 120,
    bpmManualOverride: false,
    gridResolution: '1/8',
    strength: 75,
    swingAmount: 0.5,
    quantizedHits: [
      createMockQuantizedHit(0, 0, 'kick-basic'),
      createMockQuantizedHit(1, 0, 'kick-basic'),
      createMockQuantizedHit(2, 1, 'snare-basic'),
      createMockQuantizedHit(3, 1, 'snare-basic'),
    ],
    playbackMode: 'quantized',
    trackConfigs: [createMockTrackConfig(0), createMockTrackConfig(1)],
    masterVolume: 0.8,
  };
}

export function createMockAudioBlob(
  sessionId: string,
  type: 'raw' | 'snippet',
  subId: string,
): AudioBlobEntry {
  const data = new Float32Array([0.1, 0.2, 0.3, 0.4]);
  return {
    key: type === 'raw' ? `${sessionId}:raw` : `${sessionId}:snippet:${subId}`,
    sessionId,
    type,
    subId,
    data: data.buffer,
    sampleRate: 44100,
  };
}

export function createMockSessionListItem(id = 'test-session-1'): SessionListItem {
  return {
    id,
    name: 'Test Beat',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    durationMs: 5000,
    bpm: 120,
    hitCount: 4,
  };
}
