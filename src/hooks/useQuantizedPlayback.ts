import { useCallback, useEffect, useRef, useState } from 'react';

import { PlaybackEngine } from '@/audio/playback/PlaybackEngine';
import { useQuantizationStore } from '@/state/quantizationStore';

const LOOKAHEAD_MS = 100;
const SCHEDULE_INTERVAL_MS = 25;

export function useQuantizedPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const cursorTimeRef = useRef<number>(0);

  const startTimeRef = useRef(0);
  const pauseOffsetRef = useRef(0);
  const scheduledUpToRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);

  const stopScheduler = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    const engine = PlaybackEngine.getInstance();
    if (!engine.ready) return;

    const ctx = engine.getContext();
    if (ctx === null) return;

    const { quantizedHits } = useQuantizationStore.getState();
    if (quantizedHits.length === 0) return;

    isPlayingRef.current = true;
    setIsPlaying(true);

    const now = ctx.currentTime;
    startTimeRef.current = now - pauseOffsetRef.current;
    scheduledUpToRef.current = pauseOffsetRef.current;

    const firstTime = quantizedHits[0]?.quantizedTime ?? 0;
    const lastHit = quantizedHits[quantizedHits.length - 1];
    const endTime = (lastHit?.quantizedTime ?? 0) + 0.5;
    const totalDuration = endTime - firstTime;

    intervalRef.current = setInterval(() => {
      if (!isPlayingRef.current) return;

      const audioCtx = engine.getContext();
      if (audioCtx === null) {
        stopScheduler();
        return;
      }

      const elapsed = audioCtx.currentTime - startTimeRef.current;
      cursorTimeRef.current = firstTime + elapsed;

      // Check if playback has ended
      if (elapsed >= totalDuration) {
        stopScheduler();
        pauseOffsetRef.current = 0;
        cursorTimeRef.current = 0;
        return;
      }

      const { quantizedHits: hits, playbackMode: mode } = useQuantizationStore.getState();
      const lookaheadEnd = elapsed + LOOKAHEAD_MS / 1000;

      for (const hit of hits) {
        const hitTime = mode === 'original' ? hit.originalTime : hit.quantizedTime;
        const relativeTime = hitTime - firstTime;

        if (relativeTime > scheduledUpToRef.current && relativeTime <= lookaheadEnd) {
          const when = startTimeRef.current + relativeTime;
          engine.playScheduled(hit.instrumentId, when, hit.velocity);
        }
      }

      scheduledUpToRef.current = lookaheadEnd;
    }, SCHEDULE_INTERVAL_MS);
  }, [stopScheduler]);

  const pause = useCallback(() => {
    const engine = PlaybackEngine.getInstance();
    const ctx = engine.getContext();
    if (ctx !== null) {
      pauseOffsetRef.current = ctx.currentTime - startTimeRef.current;
    }
    stopScheduler();
  }, [stopScheduler]);

  const stop = useCallback(() => {
    stopScheduler();
    pauseOffsetRef.current = 0;
    cursorTimeRef.current = 0;
  }, [stopScheduler]);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => !prev);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isPlaying,
    isLooping,
    cursorTimeRef,
    play,
    pause,
    stop,
    toggleLoop,
  };
}
