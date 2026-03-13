import { detectAudioFormat } from './formatDetection';
import { SAMPLE_MANIFEST } from './sampleManifest';

export class PlaybackEngine {
  private static instance: PlaybackEngine | null = null;

  // Private state
  private context: AudioContext | null = null;
  private readonly buffers = new Map<string, AudioBuffer>();
  private currentSource: AudioBufferSourceNode | null = null;
  private _ready = false;

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
