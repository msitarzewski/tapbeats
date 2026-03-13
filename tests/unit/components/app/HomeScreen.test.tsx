import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { HomeScreen } from '@/components/app/HomeScreen';

describe('HomeScreen', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders without crashing', () => {
    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <HomeScreen />
        </MemoryRouter>,
      );
    });

    expect(container.innerHTML).not.toBe('');
  });

  it('renders record button', () => {
    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <HomeScreen />
        </MemoryRouter>,
      );
    });

    const button = container.querySelector('button[aria-label="Start recording"]');
    expect(button).not.toBeNull();
  });

  it('record button is clickable', () => {
    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <HomeScreen />
        </MemoryRouter>,
      );
    });

    const button = container.querySelector('button[aria-label="Start recording"]');
    expect(button).not.toBeNull();
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });
});
