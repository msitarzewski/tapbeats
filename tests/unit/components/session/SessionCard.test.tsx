import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { SessionCard } from '@/components/app/SessionCard';

import { createMockSessionListItem } from '../../../helpers/sessionFixtures';

describe('SessionCard', () => {
  let container: HTMLDivElement;
  const defaultSession = createMockSessionListItem();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders session name', () => {
    act(() => {
      createRoot(container).render(
        <SessionCard session={defaultSession} onClick={vi.fn()} onDelete={vi.fn()} />,
      );
    });
    expect(container.textContent).toContain('Test Beat');
  });

  it('renders BPM', () => {
    act(() => {
      createRoot(container).render(
        <SessionCard session={defaultSession} onClick={vi.fn()} onDelete={vi.fn()} />,
      );
    });
    expect(container.textContent).toContain('120 BPM');
  });

  it('renders hit count', () => {
    act(() => {
      createRoot(container).render(
        <SessionCard session={defaultSession} onClick={vi.fn()} onDelete={vi.fn()} />,
      );
    });
    expect(container.textContent).toContain('4 hits');
  });

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn();
    act(() => {
      createRoot(container).render(
        <SessionCard session={defaultSession} onClick={onClick} onDelete={vi.fn()} />,
      );
    });
    const card = container.querySelector('[role="button"]');
    expect(card).not.toBeNull();
    act(() => {
      card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    act(() => {
      createRoot(container).render(
        <SessionCard session={defaultSession} onClick={vi.fn()} onDelete={onDelete} />,
      );
    });
    const btn = container.querySelector('[aria-label="Delete Test Beat"]');
    expect(btn).not.toBeNull();
    act(() => {
      btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('has accessible aria-label with session details', () => {
    act(() => {
      createRoot(container).render(
        <SessionCard session={defaultSession} onClick={vi.fn()} onDelete={vi.fn()} />,
      );
    });
    const card = container.querySelector('[role="button"]');
    const label = card?.getAttribute('aria-label') ?? '';
    expect(label).toContain('Test Beat');
    expect(label).toContain('120 BPM');
  });
});
