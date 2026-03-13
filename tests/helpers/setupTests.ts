import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';

import { resetDB } from '@/state/persistence/db';

// ---------------------------------------------------------------------------
// Web Audio API mocks for jsdom (which has no Web Audio support)
// ---------------------------------------------------------------------------

class MockGainNode {
  readonly gain = { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
}

class MockOscillatorNode {
  readonly frequency = { value: 440, setValueAtTime: vi.fn() };
  readonly type = 'sine';
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockAnalyserNode {
  fftSize = 2048;
  readonly frequencyBinCount = 1024;
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
  getByteFrequencyData = vi.fn((array: Uint8Array) => {
    array.fill(0);
  });
  getByteTimeDomainData = vi.fn((array: Uint8Array) => {
    array.fill(128);
  });
  getFloatFrequencyData = vi.fn((array: Float32Array) => {
    array.fill(-Infinity);
  });
  getFloatTimeDomainData = vi.fn((array: Float32Array) => {
    array.fill(0);
  });
}

class MockMediaStreamSourceNode {
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
}

// ---------------------------------------------------------------------------
// AudioWorkletNode mock
// ---------------------------------------------------------------------------

class MockAudioWorkletPort {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  start = vi.fn();
  close = vi.fn();
  dispatchEvent = vi.fn(() => true);
}

class MockAudioWorkletNode {
  readonly port = new MockAudioWorkletPort();
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
}

class MockBufferSourceNode {
  buffer: unknown = null;
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockAudioBuffer {
  readonly numberOfChannels = 1;
  readonly length = 100;
  readonly sampleRate = 44100;
  readonly duration = 100 / 44100;
  copyToChannel = vi.fn();
  getChannelData = vi.fn(() => new Float32Array(100));
}

class MockAudioContext {
  readonly sampleRate = 44100;
  state: AudioContextState = 'running';
  readonly destination = {} as AudioDestinationNode;
  readonly audioWorklet = {
    addModule: vi.fn(() => Promise.resolve()),
  };

  createOscillator = vi.fn(() => new MockOscillatorNode());
  createGain = vi.fn(() => new MockGainNode());
  createAnalyser = vi.fn(() => new MockAnalyserNode());
  createMediaStreamSource = vi.fn(() => new MockMediaStreamSourceNode());
  createBufferSource = vi.fn(() => new MockBufferSourceNode());
  createBuffer = vi.fn(() => new MockAudioBuffer());
  decodeAudioData = vi.fn(() => Promise.resolve(new MockAudioBuffer()));
  resume = vi.fn(() => {
    this.state = 'running';
    return Promise.resolve();
  });
  close = vi.fn(() => {
    this.state = 'closed';
    return Promise.resolve();
  });
  suspend = vi.fn(() => {
    this.state = 'suspended';
    return Promise.resolve();
  });
}

// ---------------------------------------------------------------------------
// MediaStream mock
// ---------------------------------------------------------------------------

class MockMediaStreamTrack {
  readonly kind = 'audio';
  enabled = true;
  stop = vi.fn();
}

class MockMediaStream {
  private readonly tracks = [new MockMediaStreamTrack()];

  getTracks = vi.fn(() => [...this.tracks]);
  getAudioTracks = vi.fn(() => [...this.tracks]);
  getVideoTracks = vi.fn(() => []);
  addTrack = vi.fn();
  removeTrack = vi.fn();
}

// ---------------------------------------------------------------------------
// Assign to globalThis so code under test can use them transparently
// ---------------------------------------------------------------------------

globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext;
(globalThis as Record<string, unknown>).webkitAudioContext =
  MockAudioContext as unknown as typeof AudioContext;
globalThis.MediaStream = MockMediaStream as unknown as typeof MediaStream;
globalThis.AudioWorkletNode = MockAudioWorkletNode as unknown as typeof AudioWorkletNode;

// ---------------------------------------------------------------------------
// navigator.mediaDevices mock
// ---------------------------------------------------------------------------

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(() => Promise.resolve(new MockMediaStream())),
  },
  writable: true,
  configurable: true,
});

// ---------------------------------------------------------------------------
// Global fetch mock
// ---------------------------------------------------------------------------

globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
  } as Response),
);

// ---------------------------------------------------------------------------
// Cleanup between tests
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// localStorage mock (jsdom doesn't support it for opaque origins)
// ---------------------------------------------------------------------------

const localStorageData = new Map<string, string>();
const localStorageMock: Storage = {
  get length() {
    return localStorageData.size;
  },
  key(index: number) {
    return [...localStorageData.keys()][index] ?? null;
  },
  getItem(key: string) {
    return localStorageData.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    localStorageData.set(key, value);
  },
  removeItem(key: string) {
    localStorageData.delete(key);
  },
  clear() {
    localStorageData.clear();
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// ---------------------------------------------------------------------------
// OfflineAudioContext mock
// ---------------------------------------------------------------------------

class MockOfflineAudioContext {
  readonly sampleRate: number;
  readonly length: number;
  readonly numberOfChannels: number;

  constructor(channels: number, length: number, sampleRate: number) {
    this.numberOfChannels = channels;
    this.length = length;
    this.sampleRate = sampleRate;
  }

  createGain = vi.fn(() => new MockGainNode());
  createBufferSource = vi.fn(() => new MockBufferSourceNode());

  startRendering = vi.fn(() => {
    return Promise.resolve(new MockAudioBuffer());
  });
}

globalThis.OfflineAudioContext = MockOfflineAudioContext as unknown as typeof OfflineAudioContext;

// ---------------------------------------------------------------------------
// URL.createObjectURL / revokeObjectURL mocks
// ---------------------------------------------------------------------------

if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = vi.fn();
}

// ---------------------------------------------------------------------------
// Cleanup between tests
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.restoreAllMocks();
  resetDB();
  localStorageData.clear();
});
