import type {
  AudioCaptureConfig,
  AudioCaptureError,
  AudioCaptureState,
  OnsetEvent,
  SensitivityParams,
  TapProcessorMessage,
} from '@/types/audio';
import { DEFAULT_CAPTURE_CONFIG } from '@/types/audio';

interface AudioCaptureEventMap {
  stateChange: AudioCaptureState;
  buffer: Float32Array;
  error: AudioCaptureError;
  onset: OnsetEvent;
}

type EventCallback<T> = (data: T) => void;

export class AudioCapture {
  private readonly _config: AudioCaptureConfig;
  private _state: AudioCaptureState = 'idle';
  private _audioContext: AudioContext | null = null;
  private _stream: MediaStream | null = null;
  private _sourceNode: MediaStreamAudioSourceNode | null = null;
  private _workletNode: AudioWorkletNode | null = null;
  private _ownsContext = false;

  private readonly _listeners: {
    stateChange: Set<EventCallback<AudioCaptureState>>;
    buffer: Set<EventCallback<Float32Array>>;
    error: Set<EventCallback<AudioCaptureError>>;
    onset: Set<EventCallback<OnsetEvent>>;
  } = {
    stateChange: new Set(),
    buffer: new Set(),
    error: new Set(),
    onset: new Set(),
  };

  constructor(config: Partial<AudioCaptureConfig> = {}) {
    this._config = { ...DEFAULT_CAPTURE_CONFIG, ...config };
  }

  get state(): AudioCaptureState {
    return this._state;
  }

  get sampleRate(): number {
    return this._audioContext?.sampleRate ?? this._config.sampleRate;
  }

  getAudioContext(): AudioContext | null {
    return this._audioContext;
  }

  on<K extends keyof AudioCaptureEventMap>(
    event: K,
    callback: EventCallback<AudioCaptureEventMap[K]>,
  ): void {
    (this._listeners[event] as Set<EventCallback<AudioCaptureEventMap[K]>>).add(callback);
  }

  off<K extends keyof AudioCaptureEventMap>(
    event: K,
    callback: EventCallback<AudioCaptureEventMap[K]>,
  ): void {
    (this._listeners[event] as Set<EventCallback<AudioCaptureEventMap[K]>>).delete(callback);
  }

  private _emit<K extends keyof AudioCaptureEventMap>(
    event: K,
    data: AudioCaptureEventMap[K],
  ): void {
    for (const cb of this._listeners[event] as Set<EventCallback<AudioCaptureEventMap[K]>>) {
      cb(data);
    }
  }

  private _setState(state: AudioCaptureState): void {
    this._state = state;
    this._emit('stateChange', state);
  }

  async start(externalContext?: AudioContext): Promise<void> {
    if (this._state === 'active') return;

    this._setState('requesting_permission');

    try {
      // Get microphone stream
      this._stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: this._config.channelCount,
          echoCancellation: this._config.echoCancellation,
          noiseSuppression: this._config.noiseSuppression,
          autoGainControl: this._config.autoGainControl,
          sampleRate: this._config.sampleRate,
        },
      });

      // Create or use provided AudioContext
      if (externalContext !== undefined) {
        this._audioContext = externalContext;
        this._ownsContext = false;
      } else {
        this._audioContext = new AudioContext({ sampleRate: this._config.sampleRate });
        this._ownsContext = true;
      }

      // Resume if suspended (required for user-gesture policy)
      if (this._audioContext.state === 'suspended') {
        await this._audioContext.resume();
      }

      // Load worklet
      await this._audioContext.audioWorklet.addModule('/worklets/tap-processor.js');

      // Create nodes
      this._sourceNode = this._audioContext.createMediaStreamSource(this._stream);
      this._workletNode = new AudioWorkletNode(this._audioContext, 'tap-processor');

      // Handle messages from worklet
      this._workletNode.port.onmessage = (event: MessageEvent<TapProcessorMessage>) => {
        const msg = event.data;
        if (msg.type === 'buffer') {
          this._emit('buffer', msg.buffer);
        } else if (msg.type === 'onset') {
          const onsetEvent: OnsetEvent = {
            timestamp: msg.timestamp,
            strength: msg.strength,
            snippetBuffer: msg.snippet,
          };
          this._emit('onset', onsetEvent);
        } else if (msg.type === 'error') {
          this._emitError('UNKNOWN', msg.message);
        }
      };

      // Connect: source → worklet (NOT to destination — we don't need playback)
      this._sourceNode.connect(this._workletNode);

      this._setState('active');
    } catch (err) {
      this._handleStartError(err);
    }
  }

  stop(): void {
    if (this._state !== 'active') return;

    // Signal worklet to stop
    if (this._workletNode !== null) {
      this._workletNode.port.postMessage({ type: 'stop' });
    }

    this._cleanup();
    this._setState('idle');
  }

  updateSensitivity(params: SensitivityParams): void {
    if (this._workletNode !== null) {
      this._workletNode.port.postMessage({ type: 'updateSensitivity', params });
    }
  }

  dispose(): void {
    this.stop();
    this._listeners.stateChange.clear();
    this._listeners.buffer.clear();
    this._listeners.error.clear();
    this._listeners.onset.clear();
  }

  private _cleanup(): void {
    // Disconnect nodes
    if (this._sourceNode !== null) {
      this._sourceNode.disconnect();
      this._sourceNode = null;
    }
    if (this._workletNode !== null) {
      this._workletNode.disconnect();
      this._workletNode.port.onmessage = null;
      this._workletNode = null;
    }

    // Stop all tracks
    if (this._stream !== null) {
      for (const track of this._stream.getTracks()) {
        track.stop();
      }
      this._stream = null;
    }

    // Close context if we own it
    if (this._audioContext !== null && this._ownsContext) {
      void this._audioContext.close();
      this._audioContext = null;
    }
  }

  private _handleStartError(err: unknown): void {
    this._cleanup();

    if (err instanceof DOMException) {
      switch (err.name) {
        case 'NotAllowedError':
          this._emitError('PERMISSION_DENIED', 'Microphone permission denied');
          break;
        case 'NotFoundError':
          this._emitError('DEVICE_NOT_FOUND', 'No microphone found');
          break;
        default:
          this._emitError('UNKNOWN', err.message, err);
      }
    } else {
      const message =
        err instanceof Error ? err.message : 'Unknown error during audio capture start';
      this._emitError('UNKNOWN', message, err);
    }

    this._setState('error');
  }

  private _emitError(code: AudioCaptureError['code'], message: string, cause?: unknown): void {
    const error: AudioCaptureError =
      cause !== undefined ? { code, message, cause } : { code, message };
    this._emit('error', error);
  }
}
