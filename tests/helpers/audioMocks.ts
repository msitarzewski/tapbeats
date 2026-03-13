import { vi } from 'vitest';

/**
 * Factory: create a mock AudioWorkletNode-like object for individual test control.
 */
export function createMockAudioWorkletNode() {
  const port = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    start: vi.fn(),
    close: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };

  const node = {
    port,
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  };

  return { node, port };
}

/**
 * Factory: create a mock AudioContext-like object for individual test control.
 *
 * Use this when you need to spy on or customise AudioContext behaviour beyond
 * what the global mock in setupTests.ts provides.
 */
export function createMockAudioContext() {
  const gainNode = {
    gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  };

  const oscillatorNode = {
    frequency: { value: 440, setValueAtTime: vi.fn() },
    type: 'sine' as OscillatorType,
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };

  const analyserNode = {
    fftSize: 2048,
    frequencyBinCount: 1024,
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
    getByteFrequencyData: vi.fn((array: Uint8Array) => {
      array.fill(0);
    }),
    getByteTimeDomainData: vi.fn((array: Uint8Array) => {
      array.fill(128);
    }),
    getFloatFrequencyData: vi.fn((array: Float32Array) => {
      array.fill(-Infinity);
    }),
    getFloatTimeDomainData: vi.fn((array: Float32Array) => {
      array.fill(0);
    }),
  };

  const mediaStreamSourceNode = {
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  };

  let state: AudioContextState = 'running';

  const ctx = {
    get sampleRate() {
      return 44100;
    },
    get state() {
      return state;
    },
    destination: {} as AudioDestinationNode,
    audioWorklet: {
      addModule: vi.fn(() => Promise.resolve()),
    },
    createOscillator: vi.fn(() => ({ ...oscillatorNode })),
    createGain: vi.fn(() => ({ ...gainNode })),
    createAnalyser: vi.fn(() => ({ ...analyserNode })),
    createMediaStreamSource: vi.fn(() => ({ ...mediaStreamSourceNode })),
    resume: vi.fn(() => {
      state = 'running';
      return Promise.resolve();
    }),
    close: vi.fn(() => {
      state = 'closed';
      return Promise.resolve();
    }),
    suspend: vi.fn(() => {
      state = 'suspended';
      return Promise.resolve();
    }),
  };

  return ctx;
}

/**
 * Factory: create a mock MediaStream-like object for individual test control.
 */
export function createMockMediaStream() {
  const track = {
    kind: 'audio' as const,
    enabled: true,
    stop: vi.fn(),
  };

  const stream = {
    getTracks: vi.fn(() => [track]),
    getAudioTracks: vi.fn(() => [track]),
    getVideoTracks: vi.fn(() => []),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
  };

  return { stream, track };
}

/**
 * Factory: create a mock AudioWorkletNode-like object that simulates
 * onset detection messages (tap-processor worklet protocol).
 */
export function createMockOnsetWorkletNode() {
  const port = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    start: vi.fn(),
    close: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };

  const node = {
    port,
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  };

  return { node, port };
}

/**
 * Fire an onset message event on a mock port, simulating the
 * tap-processor worklet posting an onset detection.
 */
export function simulateOnsetEvent(
  port: { onmessage: ((event: MessageEvent) => void) | null },
  timestamp: number,
  strength: number,
  snippet?: Float32Array,
): void {
  const snippetData = snippet ?? new Float32Array(9261);
  const messageEvent = new MessageEvent('message', {
    data: {
      type: 'onset',
      timestamp,
      strength,
      snippet: snippetData,
    },
  });

  if (port.onmessage !== null) {
    port.onmessage(messageEvent);
  }
}
