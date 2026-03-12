import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect } from 'vitest';

import { App } from '@/components/app/App';

describe('App', () => {
  it('renders without crashing', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    act(() => {
      createRoot(container).render(<App />);
    });

    expect(container.innerHTML).not.toBe('');

    document.body.removeChild(container);
  });
});
