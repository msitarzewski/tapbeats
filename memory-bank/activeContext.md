# TapBeats Active Context

## Current State

**Phase**: Milestone 7 complete — timeline enhancement implemented.
**Sprint**: Implementation — track controls, zoom/scroll, hit editing, undo/redo, keyboard shortcuts
**Branch**: `milestone-7/timeline-enhancement` (from `milestone-6/quantization`)
**Last Updated**: 2026-03-13

---

## Active Work

- Milestone 1: Project Scaffolding & Infrastructure — **COMPLETE** (commit `34680be` on `milestone-1/scaffolding`)
- Milestone 2: Audio Capture & Microphone Pipeline — **COMPLETE** (on `milestone-2/audio-capture`)
- Milestone 3: Real-Time Onset Detection — **COMPLETE** (on `milestone-3/onset-detection`)
- Milestone 4: Sound Clustering & Cluster Review UI — **COMPLETE** (on `milestone-4/clustering`)
- Milestone 5: Instrument Assignment & Sample Library — **COMPLETE** (on `milestone-5/instrument-assignment`)
- Milestone 6: Quantization Engine — **COMPLETE** (on `milestone-6/quantization`)
- Milestone 7: Timeline Enhancement — **COMPLETE** (on `milestone-7/timeline-enhancement`)
  - New timelineStore (Zustand): track controls, zoom/scroll, undo/redo (50-depth)
  - Extended quantizationStore: +4 write-back actions (setQuantizedHits, addHit, removeHit, updateHitTime)
  - PlaybackEngine: per-track gain chain (source → velocityGain → trackGain → masterGain → destination)
  - DOM TrackHeaders (accessible mute/solo), TrackControls (volume sliders)
  - Canvas: zoom/scroll, beat/bar ruler, mute visuals, viewport culling, drag preview
  - Hit editing: drag (grid snap), double-click add, right-click delete
  - Keyboard shortcuts: Space, L, M, S, 1-9, Ctrl+Z/Y, +/-
  - Seamless loop with pre-scheduling
  - Responsive mobile layout
  - 495 tests passing (46 files), 0 lint errors, production build succeeds (101KB app)

---

## Key Implementation Details (M7)

### Data Flow
```
quantizationStore.quantizedHits (source of truth for hit positions)
  + timelineStore.trackConfigs (mute/solo/volume per track)
  + timelineStore.pixelsPerSecond, scrollOffsetSeconds (zoom/scroll)
  → useTimelineRenderer (canvas: grid, hits, ghost markers, cursor, ruler)
  → useQuantizedPlayback (scheduler filters by activeTrackIds, routes through track gains)
  → PlaybackEngine (trackGain → masterGain → destination)

Timeline edits:
  → pushUndo() → modify quantizationStore.quantizedHits → renderer auto-updates
  → undo()/redo() → restore snapshot → write back to quantizationStore
```

### Store Architecture (5 stores)
| Store | Purpose |
|-------|---------|
| `appStore` | Navigation, permissions |
| `recordingStore` | Recording lifecycle, onsets |
| `clusterStore` | Clusters, assignments, instruments |
| `quantizationStore` | BPM, grid, strength, quantizedHits + write-back actions |
| `timelineStore` | Track controls, zoom/scroll, undo/redo |

### Key Components (M7)
- **State**: `timelineStore.ts` (Zustand, undo/redo snapshots via structuredClone)
- **Audio**: `PlaybackEngine.ts` (per-track gain chain, master gain)
- **Hooks**: `useTimelineEditing.ts` (hit-testing, drag, add, delete), `useKeyboardShortcuts.ts`
- **UI**: `TrackHeaders.tsx` (DOM, accessible), `TrackControls.tsx` (volume sliders)
- **Modified**: `useTimelineRenderer.ts` (zoom/scroll/ruler), `useQuantizedPlayback.ts` (mute/solo + seamless loop)

---

## Next Actions

1. **Browser verification of M7** — track controls, zoom/scroll, editing, undo/redo, keyboard shortcuts, loop
2. **Milestone 8: Session Management & WAV Export** — IndexedDB persistence, WAV offline rendering
3. **Milestone 9: Polish, PWA & Cross-Browser** — Service worker, accessibility, animations

---

## Context Notes

- Single-session sequential implementation was efficient for M7 (all phases in one pass)
- Undo snapshots use structuredClone — fast for flat objects, not suitable for IndexedDB persistence
- quantizationStore write-back actions bypass recompute — session save must persist quantizedHits directly when manual edits exist
- PlaybackEngine track gain nodes persist during playback — created on play start, cleaned up on stop
- DOM track headers work well alongside canvas — flex layout syncs heights via shared TRACK_HEIGHT constant
- `no-non-null-assertion` lint rule: Use `if (x === undefined) return` guard after `.pop()` instead of `!`
- `no-confusing-void-expression`: Void arrow functions need `{ }` braces — auto-fixable with `--fix`
