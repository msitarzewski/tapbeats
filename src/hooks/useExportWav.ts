import { useCallback, useState } from 'react';

import { exportWav } from '@/audio/export/exportWav';
import type { ExportProgress } from '@/types/session';

interface UseExportWavReturn {
  readonly isExporting: boolean;
  readonly progress: ExportProgress | null;
  readonly error: string | null;
  readonly startExport: () => void;
}

export function useExportWav(): UseExportWavReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startExport = useCallback(() => {
    if (isExporting) return;

    setIsExporting(true);
    setError(null);
    setProgress({ phase: 'rendering', percent: 0 });

    exportWav((p) => {
      setProgress(p);
    })
      .then(() => {
        setIsExporting(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Export failed');
        setIsExporting(false);
      });
  }, [isExporting]);

  return { isExporting, progress, error, startExport };
}
