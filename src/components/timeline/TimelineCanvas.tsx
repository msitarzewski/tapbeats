import { useCallback, useRef } from 'react';

import { useTimelineEditing } from '@/hooks/useTimelineEditing';
import { useTimelineRenderer } from '@/hooks/useTimelineRenderer';
import { useTimelineStore } from '@/state/timelineStore';

import styles from './TimelineCanvas.module.css';
import { TimelineSRTable } from './TimelineSRTable';

interface TimelineCanvasProps {
  readonly cursorTimeRef: React.RefObject<number>;
}

export function TimelineCanvas({ cursorTimeRef }: TimelineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    dragStateRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    handleContextMenu,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useTimelineEditing();

  useTimelineRenderer(canvasRef, cursorTimeRef, dragStateRef);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { pixelsPerSecond, setZoom, scrollOffsetSeconds, setScrollOffset } =
      useTimelineStore.getState();

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(pixelsPerSecond * factor);
    } else {
      // Horizontal scroll
      const scrollDelta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      const timeDelta = scrollDelta / pixelsPerSecond;
      setScrollOffset(scrollOffsetSeconds + timeDelta);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const { scrollOffsetSeconds, setScrollOffset } = useTimelineStore.getState();
    const scrollStep = 0.5;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        setScrollOffset(scrollOffsetSeconds - scrollStep);
        break;
      case 'ArrowRight':
        e.preventDefault();
        setScrollOffset(scrollOffsetSeconds + scrollStep);
        break;
    }
  }, []);

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        tabIndex={0}
        role="application"
        aria-label="Beat timeline editor. Use arrow keys to navigate."
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <TimelineSRTable />
    </div>
  );
}
