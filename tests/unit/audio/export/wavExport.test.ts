import { describe, it, expect, vi, beforeEach } from 'vitest';

import { exportWav } from '@/audio/export/exportWav';
import { renderMix } from '@/audio/export/renderMix';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useSessionStore } from '@/state/sessionStore';
import { useTimelineStore } from '@/state/timelineStore';
import type { ExportProgress } from '@/types/session';

vi.mock('@/audio/export/renderMix', () => ({
  renderMix: vi.fn(),
}));

describe('exportWav', () => {
  beforeEach(() => {
    useSessionStore.getState().setCurrentSession('test', 'My Beat');
    useQuantizationStore.setState({ bpm: 120 });
    useTimelineStore.setState({ trackConfigs: [], masterVolume: 0.8 });

    // Mock renderMix to return a fake AudioBuffer
    const mockBuffer = {
      numberOfChannels: 2,
      length: 100,
      sampleRate: 44100,
      duration: 100 / 44100,
      getChannelData: () => new Float32Array(100),
    } as unknown as AudioBuffer;

    vi.mocked(renderMix).mockResolvedValue(mockBuffer);
  });

  it('calls renderMix and triggers download', async () => {
    const progress: ExportProgress[] = [];
    await exportWav((p) => {
      progress.push(p);
    });

    expect(renderMix).toHaveBeenCalled();
    expect(progress.length).toBeGreaterThan(0);
    expect(progress[progress.length - 1]?.phase).toBe('complete');
  });

  it('generates correct filename', async () => {
    // Track the anchor element that gets created for download
    let capturedDownload = '';
    const origAppendChild = document.body.appendChild.bind(document.body);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
      if (node instanceof HTMLAnchorElement) {
        capturedDownload = node.download;
        node.click = vi.fn();
      }
      return origAppendChild(node);
    });

    await exportWav();

    expect(capturedDownload).toBe('tapbeats-My Beat-120bpm.wav');
  });

  it('reports progress phases', async () => {
    const phases: string[] = [];
    await exportWav((p) => {
      phases.push(p.phase);
    });

    // With renderMix mocked (resolves instantly), inner rendering progress
    // doesn't fire, but the outer encoding + complete phases do.
    expect(phases).toContain('encoding');
    expect(phases).toContain('complete');
    expect(phases.length).toBeGreaterThanOrEqual(2);
  });
});

describe('renderMix', () => {
  // renderMix is tested in integration since it uses OfflineAudioContext
  it('is a function', async () => {
    const { renderMix: actual } = await vi.importActual<{ renderMix: typeof renderMix }>(
      '@/audio/export/renderMix',
    );
    expect(typeof actual).toBe('function');
  });
});
