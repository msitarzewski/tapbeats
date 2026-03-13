import { useCallback, useEffect, useRef, useState } from 'react';

import { DEFAULT_CAPTURE_CONFIG } from '@/types/audio';

interface ClusterPlaybackResult {
  playingClusterId: number | null;
  play: (clusterId: number, snippet: Float32Array) => void;
  stop: () => void;
}

export function useClusterPlayback(): ClusterPlaybackResult {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [playingClusterId, setPlayingClusterId] = useState<number | null>(null);

  const stopCurrent = useCallback(() => {
    if (sourceRef.current !== null) {
      try {
        sourceRef.current.stop();
      } catch {
        // Already stopped — ignore
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setPlayingClusterId(null);
  }, []);

  const play = useCallback(
    (clusterId: number, snippet: Float32Array) => {
      // Stop any current playback first
      stopCurrent();

      // Lazy-init AudioContext on first user gesture
      audioCtxRef.current ??= new AudioContext({
        sampleRate: DEFAULT_CAPTURE_CONFIG.sampleRate,
      });

      const ctx = audioCtxRef.current;

      // Resume if suspended (autoplay policy)
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const buffer = ctx.createBuffer(1, snippet.length, ctx.sampleRate);
      // Ensure ArrayBuffer backing (not SharedArrayBuffer) for copyToChannel
      const channelData = new Float32Array(snippet);
      buffer.copyToChannel(channelData, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      source.onended = () => {
        if (sourceRef.current === source) {
          sourceRef.current = null;
          setPlayingClusterId(null);
        }
      };

      sourceRef.current = source;
      setPlayingClusterId(clusterId);
      source.start();
    },
    [stopCurrent],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current !== null) {
        try {
          sourceRef.current.stop();
        } catch {
          // Already stopped
        }
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (audioCtxRef.current !== null) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  return { playingClusterId, play, stop: stopCurrent };
}
