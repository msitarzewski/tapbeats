import { useEffect } from 'react';

import { AudioCapture } from '@/audio/capture/AudioCapture';
import { useRecordingStore } from '@/state/recordingStore';
import type { OnsetEvent } from '@/types/audio';

export function useOnsetDetection(capture: AudioCapture | null): void {
  const addOnset = useRecordingStore((s) => s.addOnset);

  useEffect(() => {
    if (capture === null) return;

    const handleOnset = (onset: OnsetEvent) => {
      addOnset({
        onset,
        features: null, // Features computed later during processing
      });
    };

    capture.on('onset', handleOnset);
    return () => {
      capture.off('onset', handleOnset);
    };
  }, [capture, addOnset]);
}
