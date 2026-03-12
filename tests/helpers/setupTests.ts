import { afterEach, vi } from 'vitest';

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

class MockAudioContext {
  readonly sampleRate = 44100;
  state: AudioContextState = 'running';
  readonly destination = {} as AudioDestinationNode;

  createOscillator = vi.fn(() => new MockOscillatorNode());
  createGain = vi.fn(() => new MockGainNode());
  createAnalyser = vi.fn(() => new MockAnalyserNode());
  createMediaStreamSource = vi.fn(() => new MockMediaStreamSourceNode());
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

// ---------------------------------------------------------------------------
// Cleanup between tests
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.restoreAllMocks();
});
