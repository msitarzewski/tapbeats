import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { InstrumentChips } from '@/components/clustering/InstrumentChips';

describe('InstrumentChips', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function renderChips(
    overrides: Partial<{
      clusterId: number;
      selectedInstrumentId: string | null;
      isSkipped: boolean;
      duplicateClusterId: number | null;
      onSelect: (id: string) => void;
      onSkip: () => void;
      onMore: () => void;
    }> = {},
  ) {
    const props = {
      clusterId: 0,
      selectedInstrumentId: null,
      isSkipped: false,
      duplicateClusterId: null,
      onSelect: vi.fn(),
      onSkip: vi.fn(),
      onMore: vi.fn(),
      ...overrides,
    };
    act(() => {
      createRoot(container).render(<InstrumentChips {...props} />);
    });
    return props;
  }

  it('renders quick-pick chips', () => {
    renderChips();
    // 4 quick-picks + Skip + More = 6 buttons
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(6);
    // Check quick-pick labels are present
    expect(container.textContent).toContain('Kick');
    expect(container.textContent).toContain('Snare');
    expect(container.textContent).toContain('HH');
    expect(container.textContent).toContain('Tom');
  });

  it('calls onSelect when chip clicked', () => {
    const props = renderChips();
    const buttons = container.querySelectorAll('button');
    // First button is kick-1
    act(() => {
      buttons[0]!.click();
    });
    expect(props.onSelect).toHaveBeenCalledWith('kick-1');
  });

  it('shows selected style for selected instrument', () => {
    renderChips({ selectedInstrumentId: 'kick-1' });
    const buttons = container.querySelectorAll('button[role="radio"]');
    const kickButton = buttons[0]!;
    expect(kickButton.getAttribute('aria-checked')).toBe('true');
    expect(kickButton.getAttribute('style')).toContain('background');
  });

  it('shows skip state when isSkipped is true', () => {
    renderChips({ isSkipped: true });
    const skipButton = Array.from(container.querySelectorAll('button[role="radio"]')).find((b) =>
      b.textContent.includes('Skip'),
    );
    expect(skipButton).toBeDefined();
    expect(skipButton!.getAttribute('aria-checked')).toBe('true');
  });

  it('calls onSkip when skip clicked', () => {
    const props = renderChips();
    const skipButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Skip'),
    );
    act(() => {
      skipButton!.click();
    });
    expect(props.onSkip).toHaveBeenCalled();
  });

  it('calls onMore when more clicked', () => {
    const props = renderChips();
    const moreButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent.includes('More'),
    );
    act(() => {
      moreButton!.click();
    });
    expect(props.onMore).toHaveBeenCalled();
  });

  it('shows duplicate warning when duplicateClusterId is set', () => {
    renderChips({ duplicateClusterId: 2 });
    expect(container.textContent).toContain('Same as Cluster 3');
  });

  it('has correct aria labels', () => {
    renderChips({ clusterId: 0 });
    const radiogroup = container.querySelector('[role="radiogroup"]');
    expect(radiogroup).not.toBeNull();
    expect(radiogroup!.getAttribute('aria-label')).toBe('Instrument selection for cluster 1');
  });
});
