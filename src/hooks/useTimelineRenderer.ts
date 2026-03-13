import { useEffect } from 'react';

import { gridIntervalSeconds } from '@/audio/quantization/gridUtils';
import { useClusterStore } from '@/state/clusterStore';
import { useQuantizationStore } from '@/state/quantizationStore';
import type { ClusterData } from '@/types/clustering';
import type { GridResolution, QuantizedHit } from '@/types/quantization';

import type { RefObject } from 'react';

const TRACK_HEIGHT = 48;
const TRACK_PAD = 4;
const HEADER_WIDTH = 0;
const HIT_RADIUS = 6;
const GHOST_OPACITY = 0.3;
const GHOST_LINE_OPACITY = 0.15;
const CURSOR_COLOR = '#3b82f6';
const GRID_BEAT_COLOR = 'rgba(255, 255, 255, 0.12)';
const GRID_SUB_COLOR = 'rgba(255, 255, 255, 0.04)';
const TRACK_BG_ALT = 'rgba(255, 255, 255, 0.02)';

interface TimelineRendererState {
  quantizedHits: QuantizedHit[];
  clusters: ClusterData[];
  instrumentAssignments: Record<number, string>;
  bpm: number;
  gridResolution: GridResolution;
  strength: number;
}

export function useTimelineRenderer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  cursorTimeRef: RefObject<number>,
): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;

    const ctx = canvas.getContext('2d');
    if (ctx === null) return;

    let rafId = 0;
    let latestState: TimelineRendererState = {
      quantizedHits: [],
      clusters: [],
      instrumentAssignments: {},
      bpm: 120,
      gridResolution: '1/8',
      strength: 75,
    };

    const unsubQuant = useQuantizationStore.subscribe((s) => {
      latestState = {
        ...latestState,
        quantizedHits: s.quantizedHits,
        bpm: s.bpm,
        gridResolution: s.gridResolution,
        strength: s.strength,
      };
    });

    const unsubCluster = useClusterStore.subscribe((s) => {
      latestState = {
        ...latestState,
        clusters: s.clusters,
        instrumentAssignments: s.instrumentAssignments,
      };
    });

    // Initialize from current state
    const qState = useQuantizationStore.getState();
    const cState = useClusterStore.getState();
    latestState = {
      quantizedHits: qState.quantizedHits,
      clusters: cState.clusters,
      instrumentAssignments: cState.instrumentAssignments,
      bpm: qState.bpm,
      gridResolution: qState.gridResolution,
      strength: qState.strength,
    };

    const draw = () => {
      rafId = requestAnimationFrame(draw);

      const dpr = window.devicePixelRatio;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      const scaledWidth = Math.floor(width * dpr);
      const scaledHeight = Math.floor(height * dpr);

      if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const { quantizedHits, clusters, instrumentAssignments, bpm, gridResolution, strength } =
        latestState;

      // Build track list from clusters with non-skip assignments
      const tracks = clusters.filter((c) => {
        const inst = instrumentAssignments[c.id];
        return inst !== undefined && inst !== 'skip';
      });

      if (tracks.length === 0 || quantizedHits.length === 0) return;

      // Time range
      const minTime = quantizedHits[0]?.quantizedTime ?? 0;
      const lastHit = quantizedHits[quantizedHits.length - 1];
      const maxTime = (lastHit?.quantizedTime ?? 0) + 1;
      const duration = maxTime - minTime;
      const drawWidth = width - HEADER_WIDTH;

      const timeToX = (t: number): number => {
        return HEADER_WIDTH + ((t - minTime) / duration) * drawWidth;
      };

      // Draw track backgrounds
      for (let i = 0; i < tracks.length; i++) {
        const y = i * (TRACK_HEIGHT + TRACK_PAD);
        if (i % 2 === 1) {
          ctx.fillStyle = TRACK_BG_ALT;
          ctx.fillRect(0, y, width, TRACK_HEIGHT);
        }
      }

      // Draw grid lines
      const gridInterval = gridIntervalSeconds(bpm, gridResolution);
      const beatInterval = 60 / bpm;
      const totalHeight = tracks.length * (TRACK_HEIGHT + TRACK_PAD);

      for (let t = minTime; t <= maxTime; t += gridInterval) {
        const x = timeToX(t);
        const isBeat = Math.abs((t - minTime) % beatInterval) < gridInterval * 0.1;
        ctx.strokeStyle = isBeat ? GRID_BEAT_COLOR : GRID_SUB_COLOR;
        ctx.lineWidth = isBeat ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, totalHeight);
        ctx.stroke();
      }

      // Build cluster ID -> track index map
      const trackIndexMap = new Map<number, number>();
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track !== undefined) {
          trackIndexMap.set(track.id, i);
        }
      }

      // Draw hits
      for (const hit of quantizedHits) {
        const trackIdx = trackIndexMap.get(hit.clusterId);
        if (trackIdx === undefined) continue;

        const trackY = trackIdx * (TRACK_HEIGHT + TRACK_PAD) + TRACK_HEIGHT / 2;
        const x = timeToX(hit.quantizedTime);

        // Ghost marker (original position) when strength < 100
        if (strength < 100) {
          const ghostX = timeToX(hit.originalTime);

          // Connecting line
          ctx.strokeStyle = `rgba(255, 255, 255, ${String(GHOST_LINE_OPACITY)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ghostX, trackY);
          ctx.lineTo(x, trackY);
          ctx.stroke();

          // Ghost dot
          const track = tracks[trackIdx];
          if (track !== undefined) {
            ctx.globalAlpha = GHOST_OPACITY;
            ctx.fillStyle = track.color;
            ctx.beginPath();
            ctx.arc(ghostX, trackY, HIT_RADIUS * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        // Main hit marker
        const track = tracks[trackIdx];
        if (track !== undefined) {
          const radius = HIT_RADIUS * (0.5 + hit.velocity * 0.5);
          ctx.fillStyle = track.color;
          ctx.beginPath();
          ctx.arc(x, trackY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw playback cursor
      const cursorTime = cursorTimeRef.current ?? 0;
      if (cursorTime > 0) {
        const cursorX = timeToX(cursorTime);
        ctx.strokeStyle = CURSOR_COLOR;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cursorX, 0);
        ctx.lineTo(cursorX, totalHeight);
        ctx.stroke();
      }
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      unsubQuant();
      unsubCluster();
    };
  }, [canvasRef, cursorTimeRef]);
}
