import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ExportModal } from '@/components/timeline/ExportModal';

// Mock useExportWav
vi.mock('@/hooks/useExportWav', () => ({
  useExportWav: vi.fn(() => ({
    isExporting: false,
    progress: null,
    error: null,
    startExport: vi.fn(),
  })),
}));

describe('ExportModal', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders nothing when closed', () => {
    act(() => {
      createRoot(container).render(<ExportModal isOpen={false} onClose={vi.fn()} />);
    });
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when open', () => {
    act(() => {
      createRoot(container).render(<ExportModal isOpen={true} onClose={vi.fn()} />);
    });
    expect(container.textContent).toContain('Export WAV');
  });

  it('shows description text', () => {
    act(() => {
      createRoot(container).render(<ExportModal isOpen={true} onClose={vi.fn()} />);
    });
    expect(container.textContent).toContain('stereo WAV');
  });

  it('has Export button', () => {
    act(() => {
      createRoot(container).render(<ExportModal isOpen={true} onClose={vi.fn()} />);
    });
    const buttons = container.querySelectorAll('button');
    const exportBtn = Array.from(buttons).find((b) => b.textContent.includes('Export'));
    expect(exportBtn).toBeDefined();
  });

  it('has Cancel button', () => {
    act(() => {
      createRoot(container).render(<ExportModal isOpen={true} onClose={vi.fn()} />);
    });
    const buttons = container.querySelectorAll('button');
    const cancelBtn = Array.from(buttons).find((b) => b.textContent.includes('Cancel'));
    expect(cancelBtn).toBeDefined();
  });
});
