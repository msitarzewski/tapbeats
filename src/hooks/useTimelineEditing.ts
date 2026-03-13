import { useCallback, useRef } from 'react';

import { gridIntervalSeconds, nearestGridPoint } from '@/audio/quantization/gridUtils';
import { useClusterStore } from '@/state/clusterStore';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useTimelineStore } from '@/state/timelineStore';
import type { QuantizedHit } from '@/types/quantization';

import type { RefObject } from 'react';

const HIT_TEST_THRESHOLD = 12;
const TRACK_HEIGHT = 48;
const TRACK_PAD = 4;
const RULER_HEIGHT = 24;
const HEADER_WIDTH = 120;

interface DragState {
  hitIndex: number;
  startX: number;
  startTime: number;
  currentTime: number;
}

export interface TimelineEditingResult {
  dragStateRef: RefObject<DragState | null>;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  handleDoubleClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

function getCanvasCoords(e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } {
  const rect = e.currentTarget.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function getTracks() {
  const { clusters, instrumentAssignments } = useClusterStore.getState();
  return clusters.filter((c) => {
    const inst = instrumentAssignments[c.id];
    return inst !== undefined && inst !== 'skip';
  });
}

function getTimeMapping(canvasWidth: number) {
  const { pixelsPerSecond, scrollOffsetSeconds } = useTimelineStore.getState();
  const timeToX = (t: number): number => HEADER_WIDTH + (t - scrollOffsetSeconds) * pixelsPerSecond;
  const xToTime = (x: number): number => (x - HEADER_WIDTH) / pixelsPerSecond + scrollOffsetSeconds;
  return { timeToX, xToTime, pixelsPerSecond, canvasWidth };
}

function hitTest(
  x: number,
  y: number,
  canvasWidth: number,
): { hitIndex: number; hit: QuantizedHit } | null {
  const { quantizedHits } = useQuantizationStore.getState();
  const tracks = getTracks();
  const { timeToX } = getTimeMapping(canvasWidth);

  const trackIndexMap = new Map<number, number>();
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    if (track !== undefined) {
      trackIndexMap.set(track.id, i);
    }
  }

  let bestDist = HIT_TEST_THRESHOLD;
  let bestIdx = -1;
  let bestHit: QuantizedHit | null = null;

  for (let i = 0; i < quantizedHits.length; i++) {
    const hit = quantizedHits[i];
    if (hit === undefined) continue;
    const trackIdx = trackIndexMap.get(hit.clusterId);
    if (trackIdx === undefined) continue;

    const hitX = timeToX(hit.quantizedTime);
    const hitY = RULER_HEIGHT + trackIdx * (TRACK_HEIGHT + TRACK_PAD) + TRACK_HEIGHT / 2;

    const dx = x - hitX;
    const dy = y - hitY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
      bestHit = hit;
    }
  }

  if (bestIdx >= 0 && bestHit !== null) {
    return { hitIndex: bestIdx, hit: bestHit };
  }
  return null;
}

export function useTimelineEditing(): TimelineEditingResult {
  const dragStateRef = useRef<DragState | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const { x, y } = getCanvasCoords(e);
    const canvasWidth = e.currentTarget.clientWidth;
    const result = hitTest(x, y, canvasWidth);

    if (result !== null) {
      useTimelineStore.getState().pushUndo();
      dragStateRef.current = {
        hitIndex: result.hitIndex,
        startX: x,
        startTime: result.hit.quantizedTime,
        currentTime: result.hit.quantizedTime,
      };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const drag = dragStateRef.current;
    if (drag === null) return;

    const { x } = getCanvasCoords(e);
    const canvasWidth = e.currentTarget.clientWidth;
    const { xToTime } = getTimeMapping(canvasWidth);
    const { bpm, gridResolution } = useQuantizationStore.getState();
    const gridInterval = gridIntervalSeconds(bpm, gridResolution);
    const rawTime = xToTime(x);
    const snappedTime = nearestGridPoint(rawTime, 0, gridInterval);

    dragStateRef.current = { ...drag, currentTime: Math.max(0, snappedTime) };
  }, []);

  const handleMouseUp = useCallback(() => {
    const drag = dragStateRef.current;
    if (drag === null) return;

    if (drag.currentTime !== drag.startTime) {
      useQuantizationStore.getState().updateHitTime(drag.hitIndex, drag.currentTime);
    }
    dragStateRef.current = null;
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const canvasWidth = e.currentTarget.clientWidth;
    const tracks = getTracks();
    const { xToTime } = getTimeMapping(canvasWidth);
    const { instrumentAssignments } = useClusterStore.getState();
    const { bpm, gridResolution } = useQuantizationStore.getState();

    // Determine track from y
    const trackIndex = Math.floor((y - RULER_HEIGHT) / (TRACK_HEIGHT + TRACK_PAD));
    if (trackIndex < 0 || trackIndex >= tracks.length) return;
    const track = tracks[trackIndex];
    if (track === undefined) return;

    // Determine time from x, snap to grid
    const gridInterval = gridIntervalSeconds(bpm, gridResolution);
    const rawTime = xToTime(x);
    const snappedTime = nearestGridPoint(rawTime, 0, gridInterval);
    if (snappedTime < 0) return;

    const instrumentId = instrumentAssignments[track.id];
    if (instrumentId === undefined || instrumentId === 'skip') return;

    const newHit: QuantizedHit = {
      originalTime: snappedTime,
      quantizedTime: snappedTime,
      gridPosition: snappedTime * (bpm / 60),
      velocity: 0.8,
      clusterId: track.id,
      instrumentId,
      hitIndex: -1,
    };

    useTimelineStore.getState().pushUndo();
    useQuantizationStore.getState().addHit(newHit);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const canvasWidth = e.currentTarget.clientWidth;
    const result = hitTest(x, y, canvasWidth);

    if (result !== null) {
      useTimelineStore.getState().pushUndo();
      useQuantizationStore.getState().removeHit(result.hitIndex);
    }
  }, []);

  return {
    dragStateRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    handleContextMenu,
  };
}
