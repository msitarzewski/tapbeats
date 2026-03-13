import { useEffect } from 'react';

import { useRecordingStore } from '@/state/recordingStore';

import type { RefObject } from 'react';

const BAR_WIDTH = 2;
const BAR_GAP = 1;
const BAR_COLOR = '#ff6b3d';
const AMPLITUDE_SCALE = 0.85;

export function useWaveformRenderer(canvasRef: RefObject<HTMLCanvasElement | null>): void {
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
    let latestAmplitudes: readonly number[] = [];

    // Subscribe to amplitude updates outside React render cycle
    const unsubscribe = useRecordingStore.subscribe((state) => {
      latestAmplitudes = state._amplitudes;
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

      const amplitudes = latestAmplitudes;
      if (amplitudes.length === 0) {
        return;
      }

      const centerY = height / 2;
      const barStep = BAR_WIDTH + BAR_GAP;
      const maxBars = Math.floor(width / barStep);

      // Draw from right to left, newest data on right
      const startIndex = Math.max(0, amplitudes.length - maxBars);

      ctx.fillStyle = BAR_COLOR;
      ctx.lineCap = 'round';

      for (let i = startIndex; i < amplitudes.length; i++) {
        const barIndex = i - startIndex;
        const x = width - (amplitudes.length - startIndex - barIndex) * barStep;
        const amplitude = amplitudes[i] ?? 0;
        const barHeight = Math.max(1, amplitude * centerY * AMPLITUDE_SCALE);

        // Mirrored bars: extend up and down from center
        const radius = BAR_WIDTH / 2;

        // Top bar (upward from center)
        drawRoundedRect(ctx, x, centerY - barHeight, BAR_WIDTH, barHeight, radius);

        // Bottom bar (downward from center)
        drawRoundedRect(ctx, x, centerY, BAR_WIDTH, barHeight, radius);
      }
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      unsubscribe();
    };
  }, [canvasRef]);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, height / 2, width / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}
