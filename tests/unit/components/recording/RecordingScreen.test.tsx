import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { createMockAudioWorkletNode, createMockMediaStream } from '../../../helpers/audioMocks';

// ResizeObserver mock (jsdom does not provide it)
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Canvas context mock
vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  canvas: { width: 300, height: 150 },
  lineWidth: 1,
  strokeStyle: '',
  fillStyle: '',
} as unknown as CanvasRenderingContext2D);

describe('RecordingScreen', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let RecordingScreen: typeof import('@/components/recording/RecordingScreen').RecordingScreen;

  beforeEach(async () => {
    const mockWorkletNode = createMockAudioWorkletNode();
    const mockMedia = createMockMediaStream();

    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(
      mockMedia.stream as unknown as MediaStream,
    );

    globalThis.AudioWorkletNode = vi.fn(
      () => mockWorkletNode.node,
    ) as unknown as typeof AudioWorkletNode;

    const mod = await import('@/components/recording/RecordingScreen');
    RecordingScreen = mod.RecordingScreen;

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

  it('renders without crashing', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <RecordingScreen />
        </MemoryRouter>,
      );
      // Allow useEffect start to settle
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    expect(container.innerHTML).not.toBe('');
  });

  it('shows stop button when recording', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <RecordingScreen />
        </MemoryRouter>,
      );
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    // Click "Got it" on the pre-prompt overlay to start recording
    const gotItButton = container.querySelector('button');
    expect(gotItButton).not.toBeNull();

    await act(async () => {
      gotItButton!.click();
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    const stopButton = container.querySelector('button[aria-label="Stop recording"]');
    expect(stopButton).not.toBeNull();
  });
});
