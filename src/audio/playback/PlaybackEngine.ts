import { detectAudioFormat } from './formatDetection';
import { SAMPLE_MANIFEST } from './sampleManifest';

export class PlaybackEngine {
  private static instance: PlaybackEngine | null = null;

  // Private state
  private context: AudioContext | null = null;
  private readonly buffers = new Map<string, AudioBuffer>();
  private currentSource: AudioBufferSourceNode | null = null;
  private _ready = false;

  // Track gain chain
  private masterGain: GainNode | null = null;
  private readonly trackNodes = new Map<string, { gain: GainNode }>();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static getInstance(): PlaybackEngine {
    PlaybackEngine.instance ??= new PlaybackEngine();
    return PlaybackEngine.instance;
  }

  /** For testing only */
  static resetInstance(): void {
    if (PlaybackEngine.instance !== null) {
      PlaybackEngine.instance.dispose();
      PlaybackEngine.instance = null;
    }
  }

  get ready(): boolean {
    return this._ready;
  }

  getContext(): AudioContext | null {
    return this.context;
  }

  async init(): Promise<void> {
    // If already initialized, just resume if suspended
    if (this.context !== null) {
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      return;
    }

    this.context = new AudioContext({ sampleRate: 44100 });

    // Create master gain node
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.context.destination);

    const format = detectAudioFormat();

    const loadPromises = SAMPLE_MANIFEST.map(async (instrument) => {
      try {
        const url = `/samples/${instrument.category}/${instrument.id}.${format}`;
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Failed to load sample: ${url}`);
          return;
        }
        const arrayBuffer = await response.arrayBuffer();
        const ctx = this.context;
        if (ctx === null) return;
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.buffers.set(instrument.id, audioBuffer);
      } catch (e) {
        console.warn(`Failed to decode sample ${instrument.id}:`, e);
      }
    });

    await Promise.all(loadPromises);
    this._ready = true;
  }

  dispose(): void {
    this.stop();
    this.removeAllTracks();
    if (this.masterGain !== null) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.context !== null) {
      void this.context.close();
      this.context = null;
    }
    this.buffers.clear();
    this._ready = false;
  }

  playSample(instrumentId: string): void {
    const buffer = this.buffers.get(instrumentId);
    if (buffer === undefined || this.context === null) return;

    this.stop();
    this.ensureResumed();

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.onended = () => {
      if (this.currentSource === source) {
        this.currentSource = null;
      }
    };
    this.currentSource = source;
    source.start();
  }

  playBuffer(samples: Float32Array, sampleRate?: number): void {
    if (this.context === null) return;

    this.stop();
    this.ensureResumed();

    const rate = sampleRate ?? this.context.sampleRate;
    const audioBuffer = this.context.createBuffer(1, samples.length, rate);
    const channelData = new Float32Array(samples);
    audioBuffer.copyToChannel(channelData, 0);

    const source = this.context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.context.destination);
    source.onended = () => {
      if (this.currentSource === source) {
        this.currentSource = null;
      }
    };
    this.currentSource = source;
    source.start();
  }

  /**
   * Schedule a sample to play at a specific AudioContext time with velocity control.
   * When trackId is provided, routes through the track's gain node chain.
   */
  playScheduled(instrumentId: string, when: number, velocity: number, trackId?: string): void {
    const buffer = this.buffers.get(instrumentId);
    if (buffer === undefined || this.context === null) return;

    this.ensureResumed();

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    // Apply velocity via gain node
    const velocityGain = this.context.createGain();
    velocityGain.gain.value = Math.max(0, Math.min(1, velocity));
    source.connect(velocityGain);

    // Route through track gain if available, otherwise through master
    const trackNode = trackId !== undefined ? this.trackNodes.get(trackId) : undefined;
    if (trackNode !== undefined) {
      velocityGain.connect(trackNode.gain);
    } else if (this.masterGain !== null) {
      velocityGain.connect(this.masterGain);
    } else {
      velocityGain.connect(this.context.destination);
    }

    source.start(when);
  }

  // --- Track gain chain management ---

  createTrack(trackId: string, volume: number): void {
    if (this.context === null || this.masterGain === null) return;
    if (this.trackNodes.has(trackId)) return;

    const gain = this.context.createGain();
    gain.gain.value = Math.max(0, Math.min(1, volume));
    gain.connect(this.masterGain);

    this.trackNodes.set(trackId, { gain });
  }

  setTrackVolume(trackId: string, volume: number): void {
    const node = this.trackNodes.get(trackId);
    if (node !== undefined) {
      node.gain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setTrackMute(trackId: string, muted: boolean): void {
    const node = this.trackNodes.get(trackId);
    if (node !== undefined) {
      node.gain.gain.value = muted ? 0 : 1;
    }
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain !== null) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  removeTrack(trackId: string): void {
    const node = this.trackNodes.get(trackId);
    if (node !== undefined) {
      node.gain.disconnect();
      this.trackNodes.delete(trackId);
    }
  }

  removeAllTracks(): void {
    for (const [, node] of this.trackNodes) {
      node.gain.disconnect();
    }
    this.trackNodes.clear();
  }

  stop(): void {
    if (this.currentSource !== null) {
      try {
        this.currentSource.stop();
      } catch {
        // Already stopped
      }
      this.currentSource.disconnect();
      this.currentSource = null;
    }
  }

  getBuffer(instrumentId: string): AudioBuffer | null {
    return this.buffers.get(instrumentId) ?? null;
  }

  private ensureResumed(): void {
    if (this.context !== null && this.context.state === 'suspended') {
      void this.context.resume();
    }
  }
}
