import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { LiveWaveform } from '@/components/recording/LiveWaveform';

// ResizeObserver mock (jsdom does not provide it)
class MockResizeObserver {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

describe('LiveWaveform', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  let getContextSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Mock canvas getContext to return a minimal 2d context
    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
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
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
    getContextSpy.mockRestore();
  });

  it('mounts a canvas element', () => {
    act(() => {
      root.render(<LiveWaveform />);
    });

    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
  });

  it('getContext 2d is called', () => {
    act(() => {
      root.render(<LiveWaveform />);
    });

    expect(getContextSpy).toHaveBeenCalledWith('2d');
  });

  it('cleans up on unmount', () => {
    act(() => {
      root.render(<LiveWaveform />);
    });

    // Unmount
    act(() => {
      root.unmount();
    });

    // After unmount, the canvas should no longer be in the DOM
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeNull();
  });
});
