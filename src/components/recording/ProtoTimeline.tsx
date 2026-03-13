import { useEffect, useRef } from 'react';

import { useProtoTimelineRenderer } from '@/hooks/useProtoTimelineRenderer';

import styles from './ProtoTimeline.module.css';

export function ProtoTimeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useProtoTimelineRenderer(canvasRef);

  // Handle resize via ResizeObserver for proper canvas sizing
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (container === null || canvas === null) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry === undefined) {
        return;
      }
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <canvas ref={canvasRef} className={styles.canvas} aria-label="Onset timeline" role="img" />
    </div>
  );
}
