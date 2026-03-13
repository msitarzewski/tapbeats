# TapBeats Progress

## Overall Status

**Phase**: Milestone 4 complete, ready for browser verification.
**Target**: 12-week MVP delivery
**Last Updated**: 2026-03-12

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

---

## Next Up

| Priority | Item | Reference |
|----------|------|-----------|
| 1 | Browser verification of M4 | Record → stop → `/review` → play/split/merge/continue |
| 2 | Milestone 5: Instrument Assignment | `releases/mvp/milestone-5-instrument-assignment.md` |
| 3 | Milestone 6: Quantization Engine | `releases/mvp/milestone-6-quantization.md` |

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
| Complete status navigates home | M3 has no review screen; M4+ will navigate to /review |
| Complementary normalization (Z-score + min-max) | Z-score for storage/comparison, min-max rescales to [0,1] for clustering distance |
| Clustering runs on main thread (not Worker) | <500ms for 200 hits, no complexity of Worker messaging |
| Silhouette < 0.25 falls back to k=1 | Low silhouette means no natural grouping; better UX to show 1 cluster |
| Max 12 clusters with auto-merge | UI grid practical limit; auto-merge closest centroids |
