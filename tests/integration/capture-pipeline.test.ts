import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AudioCapture } from '@/audio/capture/AudioCapture';
import { RingBuffer } from '@/audio/capture/RingBuffer';
import { useRecordingStore } from '@/state/recordingStore';

import { createMockAudioWorkletNode, createMockMediaStream } from '../helpers/audioMocks';

describe('Capture Pipeline Integration', () => {
  let capture: AudioCapture;
  let ringBuffer: RingBuffer;
  let mockWorkletNode: ReturnType<typeof createMockAudioWorkletNode>;
  let mockMedia: ReturnType<typeof createMockMediaStream>;

  beforeEach(() => {
    vi.useFakeTimers();
    useRecordingStore.getState().reset();

    capture = new AudioCapture();
    ringBuffer = new RingBuffer(125, 44100); // ~2min + buffer

    mockWorkletNode = createMockAudioWorkletNode();
    mockMedia = createMockMediaStream();

    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(
      mockMedia.stream as unknown as MediaStream,
    );

    globalThis.AudioWorkletNode = vi.fn(
      () => mockWorkletNode.node,
    ) as unknown as typeof AudioWorkletNode;
  });

  afterEach(() => {
    capture.dispose();
    ringBuffer.dispose();
    vi.useRealTimers();
  });

  it('data flows from AudioCapture buffer event to recordingStore', async () => {
    // Wire up the pipeline: capture -> ringBuffer -> store
    capture.on('buffer', (buffer: Float32Array) => {
      ringBuffer.write(buffer);

      // Compute peak
      let peak = 0;
      for (const sample of buffer) {
        const abs = Math.abs(sample);
        if (abs > peak) peak = abs;
      }
      useRecordingStore.getState().updatePeakLevel(peak);
    });

    capture.on('stateChange', (state) => {
      if (state === 'active') {
        useRecordingStore.getState().setStatus('recording');
      }
    });

    useRecordingStore.getState().setRawAudioBuffer(ringBuffer);

    await capture.start();

    expect(useRecordingStore.getState().status).toBe('recording');

    // Simulate worklet sending buffer data
    const testBuffer = new Float32Array([0.1, -0.5, 0.3, 0.8, -0.2]);
    const messageEvent = new MessageEvent('message', {
      data: { type: 'buffer', buffer: testBuffer },
    });

    if (mockWorkletNode.port.onmessage !== null) {
      mockWorkletNode.port.onmessage(messageEvent);
    }

    // Verify data flowed through to the ring buffer
    expect(ringBuffer.samplesWritten).toBe(5);
    expect(ringBuffer.length).toBe(5);

    // Verify peak level was updated in the store
    expect(useRecordingStore.getState().peakLevel).toBeCloseTo(0.8, 5);

    // Verify we can read the data back from the ring buffer
    const readBack = ringBuffer.toArray();
    expect(readBack).toEqual(testBuffer);
  });

  it('multiple buffer events accumulate in the ring buffer', async () => {
    capture.on('buffer', (buffer: Float32Array) => {
      ringBuffer.write(buffer);
    });

    await capture.start();

    // Send multiple buffer messages
    const buffer1 = new Float32Array([0.1, 0.2, 0.3]);
    const buffer2 = new Float32Array([0.4, 0.5]);
    const buffer3 = new Float32Array([0.6]);

    for (const buf of [buffer1, buffer2, buffer3]) {
      const event = new MessageEvent('message', {
        data: { type: 'buffer', buffer: buf },
      });
      if (mockWorkletNode.port.onmessage !== null) {
        mockWorkletNode.port.onmessage(event);
      }
    }

    expect(ringBuffer.samplesWritten).toBe(6);

    const result = ringBuffer.toArray();
    expect(result).toEqual(new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]));
  });

  it('auto-stop at 2 minutes using elapsed time check', async () => {
    const MAX_DURATION_SECONDS = 120;
    const TIMER_INTERVAL_MS = 100;
    let stopped = false;

    capture.on('stateChange', (state) => {
      if (state === 'active') {
        useRecordingStore.getState().setStatus('recording');
      }
    });

    await capture.start();

    expect(useRecordingStore.getState().status).toBe('recording');

    // Simulate the timer that useAudioCapture sets up
    const startTime = Date.now();
    const timerHandle = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      useRecordingStore.getState().updateElapsedTime(elapsed);

      if (elapsed >= MAX_DURATION_SECONDS && !stopped) {
        stopped = true;
        capture.stop();
        useRecordingStore.getState().setStatus('processing');
        useRecordingStore.getState().setStatus('complete');
        clearInterval(timerHandle);
      }
    }, TIMER_INTERVAL_MS);

    // Advance time to just before 2 minutes
    vi.advanceTimersByTime(119_900);
    expect(stopped).toBe(false);
    expect(useRecordingStore.getState().status).toBe('recording');

    // Advance past 2 minutes
    vi.advanceTimersByTime(200);
    expect(stopped).toBe(true);
    expect(useRecordingStore.getState().status).toBe('complete');
    expect(capture.state).toBe('idle');
  });
});
