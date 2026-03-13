/** Audio capture configuration */
export interface AudioCaptureConfig {
  readonly sampleRate: number;
  readonly bufferSize: number; // Must be power of 2
  readonly channelCount: 1;
  readonly echoCancellation: boolean;
  readonly noiseSuppression: boolean;
  readonly autoGainControl: boolean;
}

/** Structured audio capture error */
export interface AudioCaptureError {
  readonly code:
    | 'PERMISSION_DENIED'
    | 'DEVICE_NOT_FOUND'
    | 'CONTEXT_FAILED'
    | 'WORKLET_LOAD_FAILED'
    | 'STREAM_ENDED'
    | 'UNKNOWN';
  readonly message: string;
  readonly cause?: unknown;
}

/** Audio capture engine state */
export type AudioCaptureState = 'idle' | 'requesting_permission' | 'active' | 'error';

/** Recording flow state (UI-level) */
export type RecordingState =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'processing'
  | 'complete';

/** Messages from capture worklet to main thread */
export type CaptureWorkletMessage =
  | { readonly type: 'buffer'; readonly buffer: Float32Array }
  | { readonly type: 'ready' }
  | { readonly type: 'error'; readonly message: string };

/** Messages from main thread to capture worklet */
export interface CaptureWorkletCommand {
  readonly type: 'stop';
}

/** Default capture configuration */
export const DEFAULT_CAPTURE_CONFIG: AudioCaptureConfig = {
  sampleRate: 44100,
  bufferSize: 2048,
  channelCount: 1,
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
} as const;

/** Microphone permission state */
export type MicPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied';

/** Single detected onset event from worklet */
export interface OnsetEvent {
  readonly timestamp: number;
  readonly strength: number;
  readonly snippetBuffer: Float32Array | null;
}

/** 12-dimensional feature vector per hit */
export interface AudioFeatures {
  readonly rms: number;
  readonly spectralCentroid: number;
  readonly spectralRolloff: number;
  readonly spectralFlatness: number;
  readonly zeroCrossingRate: number;
  readonly attackTime: number;
  readonly decayTime: number;
  readonly mfcc: readonly number[];
}

/** Hit with onset + optional features */
export interface DetectedHit {
  readonly onset: OnsetEvent;
  readonly features: AudioFeatures | null;
}

/** Sensitivity control */
export type SensitivityLevel = 'high' | 'medium' | 'low';

export interface SensitivityParams {
  readonly medianWindowSize: number;
  readonly multiplier: number;
  readonly minInterOnsetMs: number;
}

/** Messages from tap-processor worklet to main thread */
export type TapProcessorMessage =
  | {
      readonly type: 'onset';
      readonly timestamp: number;
      readonly strength: number;
      readonly snippet: Float32Array;
    }
  | { readonly type: 'buffer'; readonly buffer: Float32Array }
  | { readonly type: 'amplitude'; readonly peak: number }
  | { readonly type: 'ready' }
  | { readonly type: 'error'; readonly message: string };

/** Messages from main thread to tap-processor worklet */
export type TapProcessorCommand =
  | { readonly type: 'stop' }
  | { readonly type: 'updateSensitivity'; readonly params: SensitivityParams };

/** Sensitivity preset map */
export const SENSITIVITY_PRESETS: Readonly<Record<SensitivityLevel, SensitivityParams>> = {
  high: { medianWindowSize: 8, multiplier: 1.2, minInterOnsetMs: 30 },
  medium: { medianWindowSize: 10, multiplier: 1.5, minInterOnsetMs: 50 },
  low: { medianWindowSize: 15, multiplier: 2.0, minInterOnsetMs: 80 },
};
