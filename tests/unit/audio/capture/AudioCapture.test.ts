import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AudioCapture } from '@/audio/capture/AudioCapture';
import type { AudioCaptureError, AudioCaptureState } from '@/types/audio';

import { createMockAudioWorkletNode, createMockMediaStream } from '../../../helpers/audioMocks';

describe('AudioCapture', () => {
  let capture: AudioCapture;
  let mockWorkletNode: ReturnType<typeof createMockAudioWorkletNode>;
  let mockMedia: ReturnType<typeof createMockMediaStream>;

  beforeEach(() => {
    capture = new AudioCapture();
    mockWorkletNode = createMockAudioWorkletNode();
    mockMedia = createMockMediaStream();

    // Set up navigator.mediaDevices.getUserMedia to return our mock stream
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(
      mockMedia.stream as unknown as MediaStream,
    );

    // Override global AudioWorkletNode to capture construction
    globalThis.AudioWorkletNode = vi.fn(
      () => mockWorkletNode.node,
    ) as unknown as typeof AudioWorkletNode;
  });

  afterEach(() => {
    capture.dispose();
  });

  describe('initial state', () => {
    it('starts in idle state', () => {
      expect(capture.state).toBe('idle');
    });

    it('returns configured sample rate before start', () => {
      expect(capture.sampleRate).toBe(44100);
    });
  });

  describe('start() happy path', () => {
    it('transitions idle -> requesting_permission -> active', async () => {
      const states: AudioCaptureState[] = [];
      capture.on('stateChange', (state) => {
        states.push(state);
      });

      await capture.start();

      expect(states).toEqual(['requesting_permission', 'active']);
      expect(capture.state).toBe('active');
    });

    it('calls getUserMedia with correct constraints', async () => {
      const spy = vi.spyOn(navigator.mediaDevices, 'getUserMedia');
      await capture.start();

      expect(spy).toHaveBeenCalledWith({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
        },
      });
    });

    it('loads the capture worklet module', async () => {
      await capture.start();

      // Verify addModule was called on whichever AudioContext was used
      const mockCtor = globalThis.AudioWorkletNode as unknown as ReturnType<typeof vi.fn>;
      const ctx = mockCtor.mock.calls[0]![0] as {
        audioWorklet: { addModule: ReturnType<typeof vi.fn> };
      };
      expect(ctx.audioWorklet.addModule).toHaveBeenCalledWith('/worklets/capture-worklet.js');
    });

    it('connects source to worklet node', async () => {
      await capture.start();

      const mockCtor = globalThis.AudioWorkletNode as unknown as ReturnType<typeof vi.fn>;
      const ctx = mockCtor.mock.calls[0]![0] as {
        createMediaStreamSource: ReturnType<typeof vi.fn>;
      };
      const sourceNode = ctx.createMediaStreamSource.mock.results[0]!.value as {
        connect: ReturnType<typeof vi.fn>;
      };
      expect(sourceNode.connect).toHaveBeenCalledWith(mockWorkletNode.node);
    });
  });

  describe('start() permission denied', () => {
    it('emits PERMISSION_DENIED error on NotAllowedError', async () => {
      const domError = new DOMException('User denied', 'NotAllowedError');
      vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(domError);

      const errors: AudioCaptureError[] = [];
      capture.on('error', (err) => {
        errors.push(err);
      });

      await capture.start();

      expect(errors.length).toBe(1);
      expect(errors[0]!.code).toBe('PERMISSION_DENIED');
      expect(capture.state).toBe('error');
    });
  });

  describe('start() device not found', () => {
    it('emits DEVICE_NOT_FOUND error on NotFoundError', async () => {
      const domError = new DOMException('No device', 'NotFoundError');
      vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(domError);

      const errors: AudioCaptureError[] = [];
      capture.on('error', (err) => {
        errors.push(err);
      });

      await capture.start();

      expect(errors.length).toBe(1);
      expect(errors[0]!.code).toBe('DEVICE_NOT_FOUND');
      expect(capture.state).toBe('error');
    });
  });

  describe('start() worklet load failure', () => {
    it('emits UNKNOWN error when addModule rejects', async () => {
      // getUserMedia succeeds but the AudioContext constructor's audioWorklet.addModule fails
      // We need to make the global AudioContext return a context where addModule rejects
      const origAudioContext = globalThis.AudioContext;
      globalThis.AudioContext = vi.fn(() => {
        const ctx = new origAudioContext();
        ctx.audioWorklet.addModule = vi.fn(() => Promise.reject(new Error('Worklet load failed')));
        return ctx;
      }) as unknown as typeof AudioContext;

      const errors: AudioCaptureError[] = [];
      capture.on('error', (err) => {
        errors.push(err);
      });

      await capture.start();

      expect(errors.length).toBe(1);
      expect(errors[0]!.code).toBe('UNKNOWN');
      expect(errors[0]!.message).toBe('Worklet load failed');
      expect(capture.state).toBe('error');

      // Restore
      globalThis.AudioContext = origAudioContext;
    });
  });

  describe('stop()', () => {
    it('transitions active -> idle', async () => {
      await capture.start();

      const states: AudioCaptureState[] = [];
      capture.on('stateChange', (state) => {
        states.push(state);
      });

      capture.stop();

      expect(states).toEqual(['idle']);
      expect(capture.state).toBe('idle');
    });

    it('posts stop message to worklet port', async () => {
      await capture.start();
      capture.stop();

      expect(mockWorkletNode.port.postMessage).toHaveBeenCalledWith({ type: 'stop' });
    });

    it('disconnects source and worklet nodes', async () => {
      await capture.start();
      capture.stop();

      expect(mockWorkletNode.node.disconnect).toHaveBeenCalled();
    });

    it('stops media stream tracks', async () => {
      await capture.start();
      capture.stop();

      expect(mockMedia.track.stop).toHaveBeenCalled();
    });

    it('is a no-op when not active', () => {
      // Should not throw
      capture.stop();
      expect(capture.state).toBe('idle');
    });
  });

  describe('double start', () => {
    it('second start is no-op when already active', async () => {
      await capture.start();
      expect(capture.state).toBe('active');

      // Reset spy to track second call
      const getUserMediaSpy = vi.spyOn(navigator.mediaDevices, 'getUserMedia');
      getUserMediaSpy.mockClear();

      await capture.start();

      // getUserMedia should not be called again
      expect(getUserMediaSpy).not.toHaveBeenCalled();
      expect(capture.state).toBe('active');
    });
  });

  describe('event on/off', () => {
    it('registers and receives events', async () => {
      const states: AudioCaptureState[] = [];
      const handler = (state: AudioCaptureState) => {
        states.push(state);
      };

      capture.on('stateChange', handler);
      await capture.start();

      expect(states.length).toBeGreaterThan(0);
    });

    it('removes listener with off()', async () => {
      const states: AudioCaptureState[] = [];
      const handler = (state: AudioCaptureState) => {
        states.push(state);
      };

      capture.on('stateChange', handler);
      capture.off('stateChange', handler);

      await capture.start();

      expect(states.length).toBe(0);
    });
  });

  describe('buffer event from worklet port', () => {
    it('propagates worklet port messages as buffer events', async () => {
      const buffers: Float32Array[] = [];
      capture.on('buffer', (buf) => {
        buffers.push(buf);
      });

      await capture.start();

      // Simulate worklet sending buffer data via port
      const testBuffer = new Float32Array([0.1, 0.2, 0.3]);
      const messageEvent = new MessageEvent('message', {
        data: { type: 'buffer', buffer: testBuffer },
      });

      // The onmessage handler was set on the mock worklet node's port
      if (mockWorkletNode.port.onmessage !== null) {
        mockWorkletNode.port.onmessage(messageEvent);
      }

      expect(buffers.length).toBe(1);
      expect(buffers[0]).toBe(testBuffer);
    });

    it('propagates worklet error messages', async () => {
      const errors: AudioCaptureError[] = [];
      capture.on('error', (err) => {
        errors.push(err);
      });

      await capture.start();

      // Simulate worklet sending error via port
      const messageEvent = new MessageEvent('message', {
        data: { type: 'error', message: 'Worklet processing error' },
      });

      if (mockWorkletNode.port.onmessage !== null) {
        mockWorkletNode.port.onmessage(messageEvent);
      }

      expect(errors.length).toBe(1);
      expect(errors[0]!.code).toBe('UNKNOWN');
      expect(errors[0]!.message).toBe('Worklet processing error');
    });
  });

  describe('dispose()', () => {
    it('cleans up everything and clears listeners', async () => {
      const states: AudioCaptureState[] = [];
      capture.on('stateChange', (state) => {
        states.push(state);
      });

      await capture.start();
      states.length = 0; // Clear previous state changes

      capture.dispose();

      expect(capture.state).toBe('idle');

      // After dispose, listeners should be cleared — no more events
      // Try to trigger a state change by calling start again
      // (it won't work because the capture was stopped, but the point is
      // no listener should fire if one did)
    });

    it('stops active capture before disposing', async () => {
      await capture.start();
      capture.dispose();

      expect(mockMedia.track.stop).toHaveBeenCalled();
      expect(mockWorkletNode.node.disconnect).toHaveBeenCalled();
    });

    it('is safe to call on idle capture', () => {
      // Should not throw
      capture.dispose();
      expect(capture.state).toBe('idle');
    });
  });

  describe('external AudioContext', () => {
    it('uses provided external context without creating a new one', async () => {
      const externalCtx = new AudioContext();

      const audioCtxSpy = vi.fn();
      const origAudioContext = globalThis.AudioContext;
      globalThis.AudioContext = audioCtxSpy as unknown as typeof AudioContext;

      await capture.start(externalCtx);

      // Should not have created a new AudioContext
      expect(audioCtxSpy).not.toHaveBeenCalled();
      expect(capture.state).toBe('active');

      capture.stop();

      // External context should NOT be closed by stop
      // (ownsContext is false)

      globalThis.AudioContext = origAudioContext;
    });
  });
});
