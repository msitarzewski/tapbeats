import { useEffect } from 'react';

import { gridIntervalSeconds } from '@/audio/quantization/gridUtils';
import { useClusterStore } from '@/state/clusterStore';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useTimelineStore } from '@/state/timelineStore';
import type { ClusterData } from '@/types/clustering';
import type { GridResolution, QuantizedHit } from '@/types/quantization';
import type { TrackConfig } from '@/types/timeline';

import type { RefObject } from 'react';

export const TRACK_HEIGHT = 48;
export const TRACK_PAD = 4;
export const HEADER_WIDTH = 120;
export const RULER_HEIGHT = 24;
export const HIT_RADIUS = 6;
const GHOST_OPACITY = 0.3;
const GHOST_LINE_OPACITY = 0.15;
const CURSOR_COLOR = '#3b82f6';
const GRID_BEAT_COLOR = 'rgba(255, 255, 255, 0.12)';
const GRID_SUB_COLOR = 'rgba(255, 255, 255, 0.04)';
const TRACK_BG_ALT = 'rgba(255, 255, 255, 0.02)';
const RULER_BG = 'rgba(0, 0, 0, 0.3)';
const RULER_TEXT_COLOR = 'rgba(255, 255, 255, 0.5)';
const RULER_TICK_COLOR = 'rgba(255, 255, 255, 0.3)';
const SELECTED_TRACK_BG = 'rgba(255, 107, 61, 0.06)';
const MUTED_TRACK_OPACITY = 0.3;

interface DragPreview {
  hitIndex: number;
  currentTime: number;
  startTime: number;
}

interface TimelineRendererState {
  quantizedHits: QuantizedHit[];
  clusters: ClusterData[];
  instrumentAssignments: Record<number, string>;
  bpm: number;
  gridResolution: GridResolution;
  strength: number;
  trackConfigs: TrackConfig[];
  selectedTrackIndex: number;
  pixelsPerSecond: number;
  scrollOffsetSeconds: number;
}

/** Resolve a CSS variable string (e.g. "var(--cluster-0)") to a computed color value.
 *  Non-variable strings are returned unchanged. */
function resolveCssColor(raw: string, el: Element): string {
  const m = /^var\(([^)]+)\)$/.exec(raw);
  if (m === null) return raw;
  const varName = m[1];
  if (varName === undefined) return raw;
  return getComputedStyle(el).getPropertyValue(varName).trim() || raw;
}

export function useTimelineRenderer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  cursorTimeRef: RefObject<number>,
  dragStateRef?: RefObject<DragPreview | null>,
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
      trackConfigs: [],
      selectedTrackIndex: 0,
      pixelsPerSecond: 200,
      scrollOffsetSeconds: 0,
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

    const unsubTimeline = useTimelineStore.subscribe((s) => {
      latestState = {
        ...latestState,
        trackConfigs: s.trackConfigs,
        selectedTrackIndex: s.selectedTrackIndex,
        pixelsPerSecond: s.pixelsPerSecond,
        scrollOffsetSeconds: s.scrollOffsetSeconds,
      };
    });

    // Initialize from current state
    const qState = useQuantizationStore.getState();
    const cState = useClusterStore.getState();
    const tState = useTimelineStore.getState();
    latestState = {
      quantizedHits: qState.quantizedHits,
      clusters: cState.clusters,
      instrumentAssignments: cState.instrumentAssignments,
      bpm: qState.bpm,
      gridResolution: qState.gridResolution,
      strength: qState.strength,
      trackConfigs: tState.trackConfigs,
      selectedTrackIndex: tState.selectedTrackIndex,
      pixelsPerSecond: tState.pixelsPerSecond,
      scrollOffsetSeconds: tState.scrollOffsetSeconds,
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

      const {
        quantizedHits,
        clusters,
        instrumentAssignments,
        bpm,
        gridResolution,
        strength,
        trackConfigs,
        selectedTrackIndex,
        pixelsPerSecond,
        scrollOffsetSeconds,
      } = latestState;

      // Build track list from clusters with non-skip assignments
      const tracks = clusters.filter((c) => {
        const inst = instrumentAssignments[c.id];
        return inst !== undefined && inst !== 'skip';
      });

      if (tracks.length === 0 || quantizedHits.length === 0) return;

      // Resolve CSS variable colors to computed values for canvas rendering
      const resolvedColors = new Map<number, string>();
      for (const t of tracks) {
        resolvedColors.set(t.id, resolveCssColor(t.color, canvas));
      }

      // Zoom/scroll time-to-pixel mapping
      const timeToX = (t: number): number => {
        return (t - scrollOffsetSeconds) * pixelsPerSecond;
      };

      const totalHeight = RULER_HEIGHT + tracks.length * (TRACK_HEIGHT + TRACK_PAD);

      // --- Draw ruler ---
      ctx.fillStyle = RULER_BG;
      ctx.fillRect(0, 0, width, RULER_HEIGHT);

      const beatInterval = 60 / bpm;
      const barInterval = beatInterval * 4; // assume 4/4

      // Determine visible time range
      const visibleStartTime = scrollOffsetSeconds;
      const visibleEndTime = scrollOffsetSeconds + width / pixelsPerSecond;

      // Draw bar/beat markers in ruler
      const firstBar = Math.floor(visibleStartTime / barInterval);
      const lastBar = Math.ceil(visibleEndTime / barInterval);

      const monoFont = getComputedStyle(canvas).getPropertyValue('--font-mono') || 'monospace';
      ctx.font = `10px ${monoFont}`;
      ctx.textBaseline = 'middle';

      for (let bar = firstBar; bar <= lastBar; bar++) {
        const barTime = bar * barInterval;
        const x = timeToX(barTime);

        if (x >= -20 && x <= width + 20) {
          // Bar number
          ctx.fillStyle = RULER_TEXT_COLOR;
          ctx.textAlign = 'left';
          ctx.fillText(String(bar + 1), x + 3, RULER_HEIGHT / 2);

          // Bar tick
          ctx.strokeStyle = RULER_TICK_COLOR;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, RULER_HEIGHT);
          ctx.stroke();
        }

        // Beat ticks within bar
        for (let beat = 1; beat < 4; beat++) {
          const beatTime = barTime + beat * beatInterval;
          const bx = timeToX(beatTime);
          if (bx >= 0 && bx <= width) {
            ctx.strokeStyle = RULER_TICK_COLOR;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(bx, RULER_HEIGHT * 0.5);
            ctx.lineTo(bx, RULER_HEIGHT);
            ctx.stroke();
          }
        }
      }

      // --- Draw track backgrounds ---
      for (let i = 0; i < tracks.length; i++) {
        const y = RULER_HEIGHT + i * (TRACK_HEIGHT + TRACK_PAD);

        // Selected track highlight
        if (i === selectedTrackIndex) {
          ctx.fillStyle = SELECTED_TRACK_BG;
          ctx.fillRect(0, y, width, TRACK_HEIGHT);
        } else if (i % 2 === 1) {
          ctx.fillStyle = TRACK_BG_ALT;
          ctx.fillRect(0, y, width, TRACK_HEIGHT);
        }
      }

      // --- Draw grid lines ---
      const gridInterval = gridIntervalSeconds(bpm, gridResolution);
      const firstGrid = Math.floor(visibleStartTime / gridInterval) * gridInterval;

      for (let t = firstGrid; t <= visibleEndTime; t += gridInterval) {
        const x = timeToX(t);
        if (x < 0 || x > width) continue;

        const isBeat = Math.abs(t % beatInterval) < gridInterval * 0.1;
        ctx.strokeStyle = isBeat ? GRID_BEAT_COLOR : GRID_SUB_COLOR;
        ctx.lineWidth = isBeat ? 1 : 0.5;
        ctx.beginPath();
        ctx.moveTo(x, RULER_HEIGHT);
        ctx.lineTo(x, totalHeight);
        ctx.stroke();
      }

      // --- Build cluster ID -> track index map ---
      const trackIndexMap = new Map<number, number>();
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track !== undefined) {
          trackIndexMap.set(track.id, i);
        }
      }

      // Build mute/solo state
      const trackConfigMap = new Map<number, TrackConfig>();
      for (const tc of trackConfigs) {
        trackConfigMap.set(tc.trackId, tc);
      }
      const anySoloed = trackConfigs.some((tc) => tc.soloed);

      // Get drag preview info
      const drag = dragStateRef?.current ?? null;

      // --- Draw hits ---
      for (let hitIdx = 0; hitIdx < quantizedHits.length; hitIdx++) {
        const hit = quantizedHits[hitIdx];
        if (hit === undefined) continue;

        const trackIdx = trackIndexMap.get(hit.clusterId);
        if (trackIdx === undefined) continue;

        const trackY = RULER_HEIGHT + trackIdx * (TRACK_HEIGHT + TRACK_PAD) + TRACK_HEIGHT / 2;

        // Use drag preview time if this hit is being dragged
        const displayTime =
          drag !== null && drag.hitIndex === hitIdx ? drag.currentTime : hit.quantizedTime;
        const x = timeToX(displayTime);

        // Viewport culling
        if (x < -HIT_RADIUS || x > width + HIT_RADIUS) continue;

        // Check mute/solo for opacity
        const tc = trackConfigMap.get(hit.clusterId);
        const isMuted = tc?.muted ?? false;
        const isSoloed = tc?.soloed ?? false;
        const isTrackActive = anySoloed ? isSoloed : !isMuted;

        const prevAlpha = ctx.globalAlpha;
        if (!isTrackActive) {
          ctx.globalAlpha = MUTED_TRACK_OPACITY;
        }

        // Ghost marker (original position) when strength < 100
        if (strength < 100) {
          const ghostX = timeToX(hit.originalTime);

          if (ghostX >= -HIT_RADIUS && ghostX <= width + HIT_RADIUS) {
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
              ctx.globalAlpha = GHOST_OPACITY * (isTrackActive ? 1 : MUTED_TRACK_OPACITY);
              ctx.fillStyle = resolvedColors.get(track.id) ?? track.color;
              ctx.beginPath();
              ctx.arc(ghostX, trackY, HIT_RADIUS * 0.7, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = isTrackActive ? 1 : MUTED_TRACK_OPACITY;
            }
          }
        }

        // Main hit marker
        const track = tracks[trackIdx];
        if (track !== undefined) {
          const radius = HIT_RADIUS * (0.5 + hit.velocity * 0.5);
          ctx.fillStyle = resolvedColors.get(track.id) ?? track.color;
          ctx.beginPath();
          ctx.arc(x, trackY, radius, 0, Math.PI * 2);
          ctx.fill();

          // Drag preview: ghost at original position
          if (drag !== null && drag.hitIndex === hitIdx) {
            const origX = timeToX(drag.startTime);
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = resolvedColors.get(track.id) ?? track.color;
            ctx.beginPath();
            ctx.arc(origX, trackY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = isTrackActive ? 1 : MUTED_TRACK_OPACITY;
          }
        }

        ctx.globalAlpha = prevAlpha;
      }

      // --- Draw playback cursor ---
      const cursorTime = cursorTimeRef.current ?? 0;
      if (cursorTime > 0) {
        const cursorX = timeToX(cursorTime);
        if (cursorX >= 0 && cursorX <= width) {
          ctx.strokeStyle = CURSOR_COLOR;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cursorX, RULER_HEIGHT);
          ctx.lineTo(cursorX, totalHeight);
          ctx.stroke();
        }
      }
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      unsubQuant();
      unsubCluster();
      unsubTimeline();
    };
  }, [canvasRef, cursorTimeRef, dragStateRef]);
}
