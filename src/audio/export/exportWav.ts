import { useQuantizationStore } from '@/state/quantizationStore';
import { useSessionStore } from '@/state/sessionStore';
import type { ExportProgress } from '@/types/session';

import { renderMix } from './renderMix';
import { encodeWav } from './wavEncoder';

/**
 * Export the current mix as a WAV file and trigger a download.
 */
export async function exportWav(onProgress?: (progress: ExportProgress) => void): Promise<void> {
  // Render
  const audioBuffer = await renderMix({
    onProgress: (p) => {
      // Map rendering progress to 0-80%
      onProgress?.({ phase: 'rendering', percent: Math.round(p.percent * 0.8) });
    },
  });

  // Encode
  onProgress?.({ phase: 'encoding', percent: 85 });
  const blob = encodeWav(audioBuffer);
  onProgress?.({ phase: 'encoding', percent: 95 });

  // Build filename
  const sessionName = useSessionStore.getState().currentSessionName;
  const bpm = useQuantizationStore.getState().bpm;
  const safeName = sessionName.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'beat';
  const filename = `tapbeats-${safeName}-${String(bpm)}bpm.wav`;

  // Trigger download
  triggerDownload(blob, filename);

  onProgress?.({ phase: 'complete', percent: 100 });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
