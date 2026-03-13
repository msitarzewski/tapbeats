import { useEffect } from 'react';

import { useRecordingStore } from '@/state/recordingStore';

import type { RefObject } from 'react';

const DOT_COLOR = '#ff6b3d';
const CENTER_LINE_COLOR = 'rgba(255, 255, 255, 0.1)';
const VISIBLE_WINDOW = 10;
const MIN_RADIUS = 3;
const MAX_RADIUS = 8;
const STRENGTH_SCALE = 4;

export function useProtoTimelineRenderer(canvasRef: RefObject<HTMLCanvasElement | null>): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      return;
    }

    let rafId = 0;
    let latestOnsets: readonly { onset: { timestamp: number; strength: number } }[] = [];
    let latestElapsedTime = 0;

    // Subscribe to store updates outside React render cycle
    const unsubscribe = useRecordingStore.subscribe((state) => {
      latestOnsets = state._onsets;
      latestElapsedTime = state.elapsedTime;
    });

    const draw = () => {
      rafId = requestAnimationFrame(draw);

      const dpr = window.devicePixelRatio;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      // Resize canvas for crisp rendering
      const scaledWidth = Math.floor(width * dpr);
      const scaledHeight = Math.floor(height * dpr);

      if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const centerY = height / 2;

      // Draw subtle horizontal center line
      ctx.strokeStyle = CENTER_LINE_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      const onsets = latestOnsets;
      if (onsets.length === 0) {
        return;
      }

      const elapsedTime = latestElapsedTime;
      const visibleWindow = elapsedTime < VISIBLE_WINDOW ? elapsedTime : VISIBLE_WINDOW;

      if (visibleWindow <= 0) {
        return;
      }

      const offset = elapsedTime > VISIBLE_WINDOW ? elapsedTime - VISIBLE_WINDOW : 0;

      ctx.fillStyle = DOT_COLOR;

      for (const hit of onsets) {
        const onset = hit.onset;
        const timestamp = onset.timestamp;

        // Only draw onsets within the visible window
        if (timestamp < offset) {
          continue;
        }

        const x = ((timestamp - offset) / visibleWindow) * width;
        const radius = Math.min(
          MAX_RADIUS,
          Math.max(MIN_RADIUS, MIN_RADIUS + onset.strength * STRENGTH_SCALE),
        );

        ctx.beginPath();
        ctx.arc(x, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      unsubscribe();
    };
  }, [canvasRef]);
}
