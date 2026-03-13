import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { SettingsScreen } from '@/components/session/SettingsScreen';
import { useSettingsStore } from '@/state/settingsStore';

describe('SettingsScreen', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    useSettingsStore.getState().reset();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders without crashing', () => {
    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <SettingsScreen />
        </MemoryRouter>,
      );
    });
    expect(container.innerHTML).not.toBe('');
  });

  it('shows Settings title', () => {
    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <SettingsScreen />
        </MemoryRouter>,
      );
    });
    expect(container.textContent).toContain('Settings');
  });

  it('shows Audio section', () => {
    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <SettingsScreen />
        </MemoryRouter>,
      );
    });
    expect(container.textContent).toContain('Audio');
  });

  it('shows Theme section', () => {
    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <SettingsScreen />
        </MemoryRouter>,
      );
    });
    expect(container.textContent).toContain('Appearance');
  });

  it('shows Storage section', () => {
    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <SettingsScreen />
        </MemoryRouter>,
      );
    });
    expect(container.textContent).toContain('Storage');
  });

  it('has back button', () => {
    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <SettingsScreen />
        </MemoryRouter>,
      );
    });
    const backBtn = container.querySelector('[aria-label="Back to home"]');
    expect(backBtn).not.toBeNull();
  });

  it('shows BPM input with default value', () => {
    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <SettingsScreen />
        </MemoryRouter>,
      );
    });
    const input = container.querySelector('input[type="number"]');
    expect(input).not.toBeNull();
    expect((input as HTMLInputElement | null)?.value).toBe('120');
  });

  it('shows theme pills', () => {
    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <SettingsScreen />
        </MemoryRouter>,
      );
    });
    expect(container.textContent).toContain('Dark');
    expect(container.textContent).toContain('Light');
    expect(container.textContent).toContain('Auto');
  });

  it('shows Clear All button', () => {
    act(() => {
      createRoot(container).render(
        <MemoryRouter>
          <SettingsScreen />
        </MemoryRouter>,
      );
    });
    const buttons = container.querySelectorAll('button');
    const clearBtn = Array.from(buttons).find((b) => b.textContent.includes('Clear All'));
    expect(clearBtn).toBeDefined();
  });
});
