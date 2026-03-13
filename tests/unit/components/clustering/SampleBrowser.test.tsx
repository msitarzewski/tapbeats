import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock PlaybackEngine to avoid audio context issues
vi.mock('@/audio/playback/PlaybackEngine', () => ({
  PlaybackEngine: {
    getInstance: () => ({
      playSample: vi.fn(),
    }),
  },
}));

const { SampleBrowser } = await import('@/components/clustering/SampleBrowser');

describe('SampleBrowser', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders nothing when isOpen is false', () => {
    act(() => {
      createRoot(container).render(
        <SampleBrowser
          isOpen={false}
          onClose={vi.fn()}
          onSelect={vi.fn()}
          currentSelection={null}
        />,
      );
    });
    // Modal returns null when not open
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when isOpen is true', () => {
    act(() => {
      createRoot(container).render(
        <SampleBrowser
          isOpen={true}
          onClose={vi.fn()}
          onSelect={vi.fn()}
          currentSelection={null}
        />,
      );
    });
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(container.textContent).toContain('Choose Instrument');
  });

  it('shows all category sections', () => {
    act(() => {
      createRoot(container).render(
        <SampleBrowser
          isOpen={true}
          onClose={vi.fn()}
          onSelect={vi.fn()}
          currentSelection={null}
        />,
      );
    });
    const text = container.textContent;
    expect(text).toContain('Kicks');
    expect(text).toContain('Snares');
    expect(text).toContain('Hihats');
    expect(text).toContain('Toms');
    expect(text).toContain('Percussion');
  });

  it('shows all instruments in grid', () => {
    act(() => {
      createRoot(container).render(
        <SampleBrowser
          isOpen={true}
          onClose={vi.fn()}
          onSelect={vi.fn()}
          currentSelection={null}
        />,
      );
    });
    // 18 instrument tiles as buttons
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(18);
  });

  it('calls onSelect and onClose when tile clicked', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    act(() => {
      createRoot(container).render(
        <SampleBrowser
          isOpen={true}
          onClose={onClose}
          onSelect={onSelect}
          currentSelection={null}
        />,
      );
    });
    // Click the first button (Kick 1)
    const buttons = container.querySelectorAll('button');
    act(() => {
      buttons[0]!.click();
    });
    expect(onSelect).toHaveBeenCalledWith('kick-1');
    expect(onClose).toHaveBeenCalled();
  });

  it('selected tile has different style', () => {
    act(() => {
      createRoot(container).render(
        <SampleBrowser
          isOpen={true}
          onClose={vi.fn()}
          onSelect={vi.fn()}
          currentSelection="kick-1"
        />,
      );
    });
    const buttons = container.querySelectorAll('button');
    const kickButton = buttons[0]!;
    // Selected tile should have borderColor style applied
    expect(kickButton.style.borderColor).not.toBe('');
  });
});
