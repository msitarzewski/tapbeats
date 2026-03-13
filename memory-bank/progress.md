# TapBeats Progress

## Overall Status

**Phase**: Milestone 3 complete, ready to commit.
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
- **Status**: Complete, NOT YET COMMITTED
- Spectral flux onset detection in AudioWorklet with dual gating (flux threshold + RMS energy)
- 12-dim feature extraction, Z-score normalization, BPM estimation
- ProtoTimeline (canvas), SensitivityControl, complete→navigate flow
- 5 runtime bugs found and fixed via Chrome DevTools debugging
- 205 tests passing (18 test files), 0 lint errors, production build succeeds (48KB app)

---

## Next Up

| Priority | Item | Reference |
|----------|------|-----------|
| 1 | Commit M3 + merge branches to main | `milestone-3/onset-detection` branch |
| 2 | Milestone 4: Clustering | `releases/mvp/milestone-4-clustering.md` |
| 3 | Milestone 5: Instrument Assignment | `releases/mvp/milestone-5-instrument-assignment.md` |

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
