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
