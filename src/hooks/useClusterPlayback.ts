import { useCallback, useEffect, useRef, useState } from 'react';

import { PlaybackEngine } from '@/audio/playback/PlaybackEngine';

interface ClusterPlaybackResult {
  playingClusterId: number | null;
  play: (clusterId: number, snippet: Float32Array) => void;
  stop: () => void;
}

export function useClusterPlayback(): ClusterPlaybackResult {
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [playingClusterId, setPlayingClusterId] = useState<number | null>(null);
  const engine = PlaybackEngine.getInstance();

  const stopCurrent = useCallback(() => {
    engine.stop();
    setPlayingClusterId(null);
  }, [engine]);

  const play = useCallback(
    (clusterId: number, snippet: Float32Array) => {
      stopCurrent();

      // Ensure engine context is available (init must have been called elsewhere)
      const ctx = engine.getContext();
      if (ctx === null) return;

      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const buffer = ctx.createBuffer(1, snippet.length, ctx.sampleRate);
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
    [stopCurrent, engine],
  );

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
      // Don't close AudioContext here — PlaybackEngine owns it
    };
  }, []);

  return { playingClusterId, play, stop: stopCurrent };
}
