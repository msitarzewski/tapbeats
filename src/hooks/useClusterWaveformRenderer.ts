import { useEffect } from 'react';

import type { RefObject } from 'react';

export function useClusterWaveformRenderer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLElement | null>,
  snippet: Float32Array | null,
  color: string,
): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas === null || container === null || snippet === null) {
      return;
    }

    function draw() {
      if (canvas === null || container === null || snippet === null) {
        return;
      }

      const ctx = canvas.getContext('2d');
      if (ctx === null) {
        return;
      }

      const dpr = window.devicePixelRatio;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const scaledWidth = Math.floor(width * dpr);
      const scaledHeight = Math.floor(height * dpr);

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      canvas.style.width = `${String(width)}px`;
      canvas.style.height = `${String(height)}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (snippet.length === 0) {
        return;
      }

      // Resolve CSS variable color to actual value
      const resolvedColor = resolveColor(color, container);

      // Compute envelope by bucketing samples
      const bucketCount = Math.max(1, Math.floor(width));
      const samplesPerBucket = snippet.length / bucketCount;
      const envelope = new Float32Array(bucketCount);

      for (let b = 0; b < bucketCount; b++) {
        const start = Math.floor(b * samplesPerBucket);
        const end = Math.min(Math.floor((b + 1) * samplesPerBucket), snippet.length);
        let peak = 0;
        for (let s = start; s < end; s++) {
          const val = Math.abs(snippet[s] ?? 0);
          if (val > peak) peak = val;
        }
        envelope[b] = peak;
      }

      // Normalize envelope
      let maxPeak = 0;
      for (let b = 0; b < bucketCount; b++) {
        const val = envelope[b] ?? 0;
        if (val > maxPeak) maxPeak = val;
      }
      const scale = maxPeak > 0 ? 1 / maxPeak : 0;

      // Draw single-sided envelope (top half, mirrored appearance)
      ctx.fillStyle = resolvedColor;
      ctx.beginPath();

      // Top edge (left to right)
      ctx.moveTo(0, height);
      for (let b = 0; b < bucketCount; b++) {
        const x = (b / bucketCount) * width;
        const amp = (envelope[b] ?? 0) * scale;
        const y = height - amp * height * 0.9;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }

    draw();

    const observer = new ResizeObserver(() => {
      draw();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [canvasRef, containerRef, snippet, color]);
}

function resolveColor(color: string, element: HTMLElement): string {
  // If it's a CSS variable reference like 'var(--cluster-0)', resolve it
  const varMatch = /^var\((.+)\)$/.exec(color);
  if (varMatch?.[1] !== undefined) {
    const computed = getComputedStyle(element).getPropertyValue(varMatch[1]).trim();
    return computed.length > 0 ? computed : color;
  }
  return color;
}
