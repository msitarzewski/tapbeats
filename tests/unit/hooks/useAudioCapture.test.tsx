import { act, createElement, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { useRecordingStore } from '@/state/recordingStore';

import { createMockAudioWorkletNode, createMockMediaStream } from '../../helpers/audioMocks';

// We must import the hook dynamically so the mocks are set up first
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let useAudioCapture: typeof import('@/hooks/useAudioCapture').useAudioCapture;

describe('useAudioCapture', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let mockWorkletNode: ReturnType<typeof createMockAudioWorkletNode>;
  let mockMedia: ReturnType<typeof createMockMediaStream>;

  beforeEach(async () => {
    useRecordingStore.getState().reset();

    mockWorkletNode = createMockAudioWorkletNode();
    mockMedia = createMockMediaStream();

    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(
      mockMedia.stream as unknown as MediaStream,
    );

    globalThis.AudioWorkletNode = vi.fn(
      () => mockWorkletNode.node,
    ) as unknown as typeof AudioWorkletNode;

    // Dynamic import to pick up fresh mocks
    const mod = await import('@/hooks/useAudioCapture');
    useAudioCapture = mod.useAudioCapture;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('returns expected interface', () => {
    let hookResult: ReturnType<typeof useAudioCapture> | undefined;

    function TestComponent() {
      hookResult = useAudioCapture();
      return null;
    }

    act(() => {
      root.render(createElement(TestComponent));
    });

    expect(hookResult).toBeDefined();
    expect(hookResult!.status).toBe('idle');
    expect(typeof hookResult!.startRecording).toBe('function');
    expect(typeof hookResult!.stopRecording).toBe('function');
    expect(typeof hookResult!.elapsedTime).toBe('number');
    expect(typeof hookResult!.hitCount).toBe('number');
    expect(typeof hookResult!.peakLevel).toBe('number');
    expect(hookResult!.error).toBeNull();
  });

  it('cleanup on unmount disposes capture', async () => {
    function TestComponent() {
      const { startRecording } = useAudioCapture();
      // Store ref to startRecording so we can call it
      const ref = useRef(startRecording);
      ref.current = startRecording;

      const [started, setStarted] = useState(false);

      useEffect(() => {
        if (!started) {
          setStarted(true);
          void ref.current();
        }
      }, [started]);

      return null;
    }

    await act(async () => {
      root.render(createElement(TestComponent));
      // Allow microtask for the start call to resolve
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    // Unmount should trigger cleanup
    act(() => {
      root.unmount();
    });

    // After unmount, the track should have been stopped (via dispose)
    expect(mockMedia.track.stop).toHaveBeenCalled();
  });
});
