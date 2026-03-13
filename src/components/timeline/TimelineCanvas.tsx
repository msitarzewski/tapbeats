import { useRef } from 'react';

import { useTimelineRenderer } from '@/hooks/useTimelineRenderer';

import styles from './TimelineCanvas.module.css';

interface TimelineCanvasProps {
  readonly cursorTimeRef: React.RefObject<number>;
}

export function TimelineCanvas({ cursorTimeRef }: TimelineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useTimelineRenderer(canvasRef, cursorTimeRef);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
