import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AudioCapture } from '@/audio/capture/AudioCapture';
import { useRecordingStore } from '@/state/recordingStore';
import type { AudioCaptureError } from '@/types/audio';

import { createMockAudioWorkletNode, createMockMediaStream } from '../helpers/audioMocks';

describe('Permission Flow Integration', () => {
  let capture: AudioCapture;
  let mockWorkletNode: ReturnType<typeof createMockAudioWorkletNode>;

  beforeEach(() => {
    useRecordingStore.getState().reset();
    capture = new AudioCapture();
    mockWorkletNode = createMockAudioWorkletNode();

    globalThis.AudioWorkletNode = vi.fn(
      () => mockWorkletNode.node,
    ) as unknown as typeof AudioWorkletNode;
  });

  afterEach(() => {
    capture.dispose();
  });

  it('permission granted -> recording starts (store status becomes recording)', async () => {
    const mockMedia = createMockMediaStream();
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(
      mockMedia.stream as unknown as MediaStream,
    );

    // Wire capture state changes to the recording store
    capture.on('stateChange', (state) => {
      if (state === 'active') {
        useRecordingStore.getState().setStatus('recording');
      }
    });

    useRecordingStore.getState().setStatus('requesting_permission');

    await capture.start();

    expect(capture.state).toBe('active');
    expect(useRecordingStore.getState().status).toBe('recording');
  });

  it('permission denied -> error with PERMISSION_DENIED code', async () => {
    const domError = new DOMException('User denied mic access', 'NotAllowedError');
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(domError);

    // Wire capture errors to the recording store
    capture.on('error', (err: AudioCaptureError) => {
      useRecordingStore.getState().setError(err);
    });

    useRecordingStore.getState().setStatus('requesting_permission');

    await capture.start();

    expect(capture.state).toBe('error');

    const storeState = useRecordingStore.getState();
    expect(storeState.error).not.toBeNull();
    expect(storeState.error!.code).toBe('PERMISSION_DENIED');
    // setError resets status to idle
    expect(storeState.status).toBe('idle');
  });

  it('device not found -> error with DEVICE_NOT_FOUND code', async () => {
    const domError = new DOMException('No mic available', 'NotFoundError');
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(domError);

    capture.on('error', (err: AudioCaptureError) => {
      useRecordingStore.getState().setError(err);
    });

    useRecordingStore.getState().setStatus('requesting_permission');

    await capture.start();

    expect(capture.state).toBe('error');

    const storeState = useRecordingStore.getState();
    expect(storeState.error).not.toBeNull();
    expect(storeState.error!.code).toBe('DEVICE_NOT_FOUND');
    expect(storeState.status).toBe('idle');
  });
});
