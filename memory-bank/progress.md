# TapBeats Progress

## Overall Status

**Phase**: Milestone 7 complete, ready for browser verification.
**Target**: 12-week MVP delivery
**Last Updated**: 2026-03-13

---

## Completed

### Planning & Documentation
- Full PRD with 8 section documents (17,500+ lines total)
- MVP release plan with 10 milestones across 12 weeks

### Milestone 1: Project Scaffolding & Infrastructure (2026-03-12)
- **Branch**: `milestone-1/scaffolding`, commit `34680be`
- Vite 6 + React 18 + TypeScript 5.7 (strict mode)
- CSS design system, shared components, React Router, ESLint/Prettier/Husky
- Vitest + Playwright, GitHub Actions CI/CD
- Production build: 166KB total, 54KB gzipped

### Milestone 2: Audio Capture & Microphone Pipeline (2026-03-12)
- **Branch**: `milestone-2/audio-capture`, commit `46ee54a`
- Full audio capture pipeline: getUserMedia → AudioContext → AudioWorklet → RingBuffer → Zustand store
- Recording UI: HomeScreen, RecordingScreen, LiveWaveform, permission flow
- 88 tests passing across 11 test files
- Production build: 37.8KB app + 142.8KB vendor + 13KB CSS

### Milestone 3: Real-Time Onset Detection (2026-03-12)
- **Branch**: `milestone-3/onset-detection` (from M2)
- Spectral flux onset detection in AudioWorklet with dual gating (flux threshold + RMS energy)
- 12-dim feature extraction, Z-score normalization, BPM estimation
- ProtoTimeline (canvas), SensitivityControl, complete→navigate flow
- 5 runtime bugs found and fixed via Chrome DevTools debugging
- 205 tests passing (18 test files), 0 lint errors, production build succeeds (48KB app)

### Milestone 4: Sound Clustering & Cluster Review UI (2026-03-12)
- **Branch**: `milestone-4/clustering` (from M3)
- K-means++ clustering with auto-K via silhouette scoring
- Min-max normalization on full 12-dim feature vectors (complements Z-score from M3)
- Cluster review screen at `/review`: ClusterCard grid, waveform preview, playback, split/merge
- ClusterStore Zustand slice, pipeline integration in useProcessing
- 314 tests passing (27 test files, +109 new), 0 lint errors, production build succeeds (63KB app)
- Pattern: 3 parallel agents (Algorithm, State/Integration, UI) + separate Test agent

### Milestone 5: Instrument Assignment & Sample Library (2026-03-12)
- **Branch**: `milestone-5/instrument-assignment` (from M4)
- PlaybackEngine singleton (shared AudioContext, sample loading/caching/playback)
- 18-instrument manifest across 5 categories (kicks, snares, hihats, toms, percussion)
- Synthetic drum sample generation (18 WAV files, 448KB total in `public/samples/`)
- Smart defaults: weighted Euclidean distance to idealized profiles, greedy assignment
- InstrumentChips quick-pick UI + SampleBrowser modal
- Extended clusterStore with assignment state (assign, skip, defaults, hasAnyAssignment)
- Refactored useClusterPlayback to delegate to PlaybackEngine
- 377 tests passing (35 test files, +63 new), 0 lint errors, production build succeeds (74KB app)
- Pattern: 6 parallel agents (Types/Manifest, SmartDefaults, PlaybackEngine, State, UI, SampleGen) + Test agent

### Milestone 6: Quantization Engine (2026-03-13)
- **Branch**: `milestone-6/quantization` (from M5)
- BPM detection via IOI histogram + Gaussian smoothing + ambiguity resolution (not median IOI)
- Grid quantization with 6 resolutions (1/4, 1/8, 1/8T, 1/16, 1/16T, 1/32), strength 0-100%, swing 0-100%
- `quantizationStore` Zustand slice with cross-store reads from clusterStore + recordingStore
- Timeline UI: QuantizationControls, TimelineCanvas (canvas 2D), TransportBar
- `useTimelineRenderer` hook (requestAnimationFrame canvas loop), `useQuantizedPlayback` hook (lookahead scheduler)
- `PlaybackEngine.playScheduled()` method for timed sample playback
- 438 tests passing (40 test files, +61 new), 0 lint errors, production build succeeds (86KB app)
- Benchmarks: detectBpm 0.13ms, quantizeHits 0.02ms for 500 items
- Pattern: 4 parallel agents (Phase 1) + sequential test agent
- Key learnings: import ordering convention, `Array<T>` vs `T[]`, `Float64Array` with `noUncheckedIndexedAccess`

### Milestone 7: Timeline Enhancement (2026-03-13)
- **Branch**: `milestone-7/timeline-enhancement` (from `milestone-6/quantization`)
- New `timelineStore` Zustand store: track controls (mute/solo/volume), zoom/scroll, undo/redo (50-depth)
- Extended `quantizationStore` with write-back actions: `setQuantizedHits`, `addHit`, `removeHit`, `updateHitTime`
- PlaybackEngine per-track gain chain: `source → velocityGain → trackGain → masterGain → destination`
- DOM-based TrackHeaders (accessible mute/solo buttons), TrackControls (per-track + master volume sliders)
- Canvas enhancements: zoom/scroll mapping, beat/bar ruler, mute visuals (30% opacity), viewport culling, drag preview
- Hit editing: drag-to-move (grid snap), double-click add, right-click delete — all with undo
- Keyboard shortcuts: Space, L, M, S, 1-9, Ctrl+Z/Y, +/-
- Seamless loop playback with pre-scheduling next iteration before boundary
- Responsive: 48px icon-only headers at <=640px, fixed bottom transport on mobile
- 495 tests passing (46 files, +57 new), 0 lint errors, production build succeeds (101KB app)
- Pattern: Single-session sequential implementation (types → stores → audio → hooks → UI → tests)

---

## Next Up

| Priority | Item | Reference |
|----------|------|-----------|
| 1 | Browser verification of M7 | Track controls, zoom/scroll, editing, undo/redo, keyboard shortcuts |
| 2 | Milestone 8: Session Management & WAV Export | `releases/mvp/milestone-8-session-export.md` |
| 3 | Milestone 9: Polish, PWA & Cross-Browser | `releases/mvp/milestone-9-polish-pwa.md` |
| 4 | Milestone 10: Launch | `releases/mvp/milestone-10-launch.md` |

---

## Blockers

None.

---

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Web-first PWA | No app store gatekeeping, instant access via URL, single codebase |
| Client-only (no server) | Privacy (audio never leaves device), simplicity, offline-first |
| AudioWorklet for onset detection | Low-latency real-time processing on dedicated audio thread |
| K-means clustering | Well-understood algorithm, auto-k via silhouette scoring |
| Canvas 2D for timeline | 60fps rendering for smooth playback cursor and hit markers |
| Zustand for state | Lightweight, TypeScript-native, no provider wrappers |
| Pure-JS DSP (no WASM) | No native dependencies, simpler build, sufficient for v1 |
| CSS Modules | Component-scoped styles, avoids runtime CSS-in-JS overhead |
| Port 8087, no SSL | localhost doesn't need HTTPS; simplifies dev setup |
| New tap-processor.js (not extend capture-worklet) | SRP: different responsibilities (onset detection vs raw PCM) |
| Onset listeners in useAudioCapture (not separate hook) | Refs don't trigger re-renders; wire where instance created |
| Synchronous processing (not setTimeout batches) | React cleanup kills async chains in effects |
| RMS energy gate + flux threshold 0.5 | Dual gating rejects ambient noise (spectral flux alone insufficient) |
| Complementary normalization (Z-score + min-max) | Z-score for storage/comparison, min-max rescales to [0,1] for clustering distance |
| Clustering runs on main thread (not Worker) | <500ms for 200 hits, no complexity of Worker messaging |
| Silhouette < 0.25 falls back to k=1 | Low silhouette means no natural grouping; better UX to show 1 cluster |
| Max 12 clusters with auto-merge | UI grid practical limit; auto-merge closest centroids |
| Singleton PlaybackEngine | Avoids Chrome 6-context / iOS Safari 1-context AudioContext limits |
| Synthetic WAV samples (not CC0) | Quick to generate, distinguishable; real samples swap in-place later |
| Smart defaults via weighted distance | Best-effort heuristic; user always overrides; greedy prevents duplicates |
| Split/merge clears assignments | IDs remap to contiguous; simpler than tracking old→new mapping |
| IOI histogram BPM (not median IOI) | Histogram + Gaussian smoothing handles tempo ambiguity; median fails on swing/expressive timing |
| Separate quantizationStore (not extend clusterStore) | SRP: quantization is a distinct concern; cross-store reads via getState() |
| Canvas 2D for timeline rendering | rAF loop at 60fps; DOM too slow for real-time hit marker updates |
| playScheduled() method on PlaybackEngine | Lookahead scheduler needs precise timing; separate from immediate playSample() |
| Separate timelineStore (not extend quantizationStore) | SRP: UI interaction state (mute/solo/volume/zoom/undo) vs quantization parameters |
| DOM track headers (not canvas) | Accessibility requires real `<button>` elements for mute/solo; canvas can't do ARIA |
| Undo snapshots via structuredClone | Fast for flat QuantizedHit objects (0.1ms/500 hits); max 50 depth; write-back to quantizationStore on restore |
| Per-track gain chain (not per-hit) | Create nodes once on play start, adjust gain values in real-time; no teardown during playback |
| Write-back actions on quantizationStore | `setQuantizedHits`, `addHit`, `removeHit`, `updateHitTime` bypass recompute for manual edits |
