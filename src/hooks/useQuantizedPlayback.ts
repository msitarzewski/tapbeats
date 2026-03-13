import { useCallback, useEffect, useRef, useState } from 'react';

import { PlaybackEngine } from '@/audio/playback/PlaybackEngine';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useTimelineStore } from '@/state/timelineStore';

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
  const isLoopingRef = useRef(false);
  const unsubTimelineRef = useRef<(() => void) | null>(null);

  // Keep looping ref in sync
  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  const stopScheduler = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);

    // Clean up timeline subscription and track nodes
    if (unsubTimelineRef.current !== null) {
      unsubTimelineRef.current();
      unsubTimelineRef.current = null;
    }
    const engine = PlaybackEngine.getInstance();
    engine.removeAllTracks();
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

    // Set up track gain nodes
    const timelineState = useTimelineStore.getState();
    for (const tc of timelineState.trackConfigs) {
      const volume = tc.muted ? 0 : tc.volume;
      engine.createTrack(String(tc.trackId), volume);
    }
    engine.setMasterVolume(timelineState.masterVolume);

    // Subscribe to volume/mute changes during playback
    unsubTimelineRef.current = useTimelineStore.subscribe((s) => {
      for (const tc of s.trackConfigs) {
        const activeIds = s.trackConfigs.some((t) => t.soloed)
          ? s.trackConfigs.filter((t) => t.soloed).map((t) => t.trackId)
          : null;

        if (activeIds !== null) {
          // Solo mode: mute all non-soloed
          engine.setTrackVolume(String(tc.trackId), activeIds.includes(tc.trackId) ? tc.volume : 0);
        } else {
          engine.setTrackVolume(String(tc.trackId), tc.muted ? 0 : tc.volume);
        }
      }
      engine.setMasterVolume(s.masterVolume);
    });

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
      cursorTimeRef.current = firstTime + (elapsed % totalDuration);

      // Check if playback has ended (non-looping)
      if (!isLoopingRef.current && elapsed >= totalDuration) {
        stopScheduler();
        pauseOffsetRef.current = 0;
        cursorTimeRef.current = 0;
        return;
      }

      // Seamless loop: if near boundary, schedule next iteration
      if (isLoopingRef.current && elapsed >= totalDuration) {
        startTimeRef.current += totalDuration;
        scheduledUpToRef.current = 0;
      }

      const { quantizedHits: hits, playbackMode: mode } = useQuantizationStore.getState();
      const activeTrackIds = useTimelineStore.getState().getActiveTrackIds();
      const lookaheadEnd = audioCtx.currentTime - startTimeRef.current + LOOKAHEAD_MS / 1000;

      for (const hit of hits) {
        // Filter by active tracks
        if (!activeTrackIds.includes(hit.clusterId)) continue;

        const hitTime = mode === 'original' ? hit.originalTime : hit.quantizedTime;
        const relativeTime = hitTime - firstTime;

        if (relativeTime > scheduledUpToRef.current && relativeTime <= lookaheadEnd) {
          const when = startTimeRef.current + relativeTime;
          engine.playScheduled(hit.instrumentId, when, hit.velocity, String(hit.clusterId));
        }
      }

      // Pre-schedule next loop iteration for seamless playback
      if (isLoopingRef.current) {
        const timeUntilEnd = totalDuration - (audioCtx.currentTime - startTimeRef.current);
        if (timeUntilEnd < LOOKAHEAD_MS / 1000) {
          for (const hit of hits) {
            if (!activeTrackIds.includes(hit.clusterId)) continue;
            const hitTime = mode === 'original' ? hit.originalTime : hit.quantizedTime;
            const relativeTime = hitTime - firstTime;
            if (relativeTime <= LOOKAHEAD_MS / 1000 - timeUntilEnd) {
              const when = startTimeRef.current + totalDuration + relativeTime;
              engine.playScheduled(hit.instrumentId, when, hit.velocity, String(hit.clusterId));
            }
          }
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
