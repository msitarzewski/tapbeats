# TapBeats Active Context

## Current State

**Phase**: Milestone 6 complete — quantization engine implemented.
**Sprint**: Implementation — BPM detection, grid quantization, timeline UI, playback
**Branch**: `milestone-6/quantization` (from `milestone-5/instrument-assignment`)
**Last Updated**: 2026-03-13

---

## Active Work

- Milestone 1: Project Scaffolding & Infrastructure — **COMPLETE** (commit `34680be` on `milestone-1/scaffolding`)
- Milestone 2: Audio Capture & Microphone Pipeline — **COMPLETE** (on `milestone-2/audio-capture`)
- Milestone 3: Real-Time Onset Detection — **COMPLETE** (on `milestone-3/onset-detection`)
- Milestone 4: Sound Clustering & Cluster Review UI — **COMPLETE** (on `milestone-4/clustering`)
- Milestone 5: Instrument Assignment & Sample Library — **COMPLETE** (on `milestone-5/instrument-assignment`)
  - 4 audio/playback files, 2 UI components + CSS, types, script, 18 WAV samples
  - Extended clusterStore with assignment state, refactored useClusterPlayback to use PlaybackEngine
  - 377 tests passing (35 test files), 0 lint errors, production build succeeds (74KB app)
- Milestone 6: Quantization Engine — **COMPLETE** (on `milestone-6/quantization`)
  - 3 algorithm files, 1 store, 3 UI components, 2 hooks, PlaybackEngine enhanced
  - BPM detection (IOI histogram + Gaussian smoothing + ambiguity resolution), grid quantization (6 resolutions, strength 0-100%, swing)
  - quantizationStore Zustand slice with cross-store reads
  - Timeline UI: QuantizationControls, TimelineCanvas, TransportBar
  - useTimelineRenderer (rAF canvas), useQuantizedPlayback (lookahead scheduler), PlaybackEngine.playScheduled()
  - 438 tests passing (40 test files), 0 lint errors, production build succeeds (86KB app)

---

## Key Implementation Details (M6)

### Quantization Flow
```
Assigned hits (from M5 pipeline)
  → detectBpm(hits) uses IOI histogram + Gaussian smoothing + ambiguity resolution
  → quantizeHits(hits, bpm, resolution, strength, swing) snaps to grid
  → quantizationStore manages BPM, resolution, strength, swing state
  → Cross-store reads: quantizationStore reads from clusterStore + recordingStore
  → TimelineCanvas renders hits on canvas (rAF loop via useTimelineRenderer)
  → QuantizationControls: BPM, resolution picker (6 levels), strength slider, swing knob
  → TransportBar: play/pause/stop, position display, loop toggle
  → useQuantizedPlayback: lookahead scheduler for sample-accurate timing
  → PlaybackEngine.playScheduled(sampleId, when) for timed sample playback
```

### Data Pipeline
- BPM detection: IOI (inter-onset interval) histogram with Gaussian smoothing, resolves octave ambiguity (60/120/240 BPM)
- Grid quantization: 6 resolutions (1/4, 1/8, 1/8T, 1/16, 1/16T, 1/32), strength 0-100%, swing 0-100%
- Benchmarks: detectBpm 0.13ms, quantizeHits 0.02ms for 500 items

### Key Components
- **Algorithm** (`src/audio/quantization/`): detectBpm.ts, quantizeHits.ts, gridUtils.ts
- **Store**: `src/state/quantizationStore.ts` (Zustand slice, cross-store reads)
- **UI**: QuantizationControls.tsx, TimelineCanvas.tsx, TransportBar.tsx
- **Hooks**: useTimelineRenderer.ts (rAF canvas), useQuantizedPlayback.ts (lookahead scheduler)
- **PlaybackEngine**: Enhanced with `playScheduled()` method for timed playback

---

## Next Actions

1. **Browser verification of M6** — quantization controls, timeline canvas, transport playback
2. **Milestone 7: Timeline Enhancement** — DAW-style timeline polish, multi-track view
3. **Milestone 8: Session Management** — save/load sessions, export

---

## Context Notes

- 4 parallel agents for M6 Phase 1 + sequential test agent
- Import ordering convention: enforce consistent import grouping (external, internal, types)
- Use `Array<T>` instead of `T[]` for complex generic types per project lint rules
- `Float64Array` requires careful handling with `noUncheckedIndexedAccess` — always check bounds
- Cross-store reads in Zustand: quantizationStore uses `getState()` from clusterStore + recordingStore
- IOI histogram approach for BPM detection is more robust than simple median IOI
- Canvas timeline with rAF loop provides smooth 60fps rendering for hit visualization
- Lookahead scheduler pattern (from Web Audio API spec) ensures sample-accurate playback timing
