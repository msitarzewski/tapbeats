# TapBeats Progress

## Overall Status

**Phase**: Milestone 1 complete. Ready for Milestone 2.
**Target**: 12-week MVP delivery
**Last Updated**: 2026-03-12

---

## Completed

### Planning & Documentation
- Full PRD with 8 section documents (17,500+ lines total)
  - Product requirements (72 functional requirements, P0/P1/P2 prioritized)
  - UX research (personas, journey maps, competitive analysis)
  - Brand & product strategy (positioning, go-to-market)
  - Technical architecture (6 subsystems, data models, audio pipeline)
  - Audio engineering & DSP (onset detection, clustering, quantization algorithms)
  - Developer experience (project structure, coding standards, state management)
  - Testing & QA strategy (test pyramid, CI/CD, quality gates)
  - UI design (design system, wireframes, component inventory, animations)

### Release Planning
- MVP release plan with 10 milestones across 12 weeks
- Individual milestone documents with acceptance criteria
- Risk register with mitigations
- Success metrics defined

### Milestone 1: Project Scaffolding & Infrastructure (2026-03-12)
- **Branch**: `milestone-1/scaffolding`, commit `34680be`
- Vite 6 + React 18 + TypeScript 5.7 (strict mode, all extra flags)
- Full directory structure per developer-experience.md
- CSS design system: 40+ custom properties in `theme.css` (dark theme, per `ui-design.md` Appendix A)
- Typography: Inter (UI) + JetBrains Mono (code) via Google Fonts
- Shared components: Button (3 variants x 3 sizes), Slider, Card, Modal — all CSS modules
- React Router with 5 screen shells (Home, Record, Review, Timeline, Settings)
- ESLint (strict-type-checked) + Prettier + Husky + lint-staged
- Vitest (jsdom, V8 coverage, 80% thresholds) + Playwright (5 browser projects)
- Web Audio API test mocks (`setupTests.ts` + `audioMocks.ts` factories)
- GitHub Actions CI/CD (`ci.yml` + `e2e.yml`)
- CONTRIBUTING.md + LICENSE placeholder
- Production build: 166KB total, 54KB gzipped
- All milestones updated with M1 lessons learned

---

### Milestone 2: Audio Capture & Microphone Pipeline (2026-03-12)
- **Branch**: `milestone-2/audio-capture`
- Audio engine: RingBuffer (circular Float32Array), AudioCapture class (getUserMedia → AudioContext → AudioWorklet pipeline), capture-worklet.js (double-buffer pool, Transferable messaging)
- State: recordingStore (Zustand) + appStore with mic permission tracking
- Hooks: useAudioCapture, useRecordingTimer, useReducedMotion, useMicPermission, useWaveformRenderer
- UI: HomeScreen with RecordButton (80px pulsing circle), RecordingScreen with LiveWaveform (canvas, 60fps), RecordingHeader (timer, back button), StatsBar, StopButton, HitFlash, ProcessingOverlay, MicPermissionOverlay, PermissionDenied screen
- Shared: Icon component (6 inline SVG icons)
- Permission flow: pre-prompt overlay → "Got it" triggers getUserMedia → browser prompt → recording or error
- 88 tests (15 RingBuffer, 17 AudioCapture, 14 recordingStore, 5 appStore, 2 useAudioCapture, 3 HomeScreen, 2 RecordingScreen, 3 LiveWaveform, 3 permission-flow integration, 3 capture-pipeline integration, 1 App)
- Production build: 37.8KB app + 142.8KB vendor + 13KB CSS
- **Key fix**: MicPermissionOverlay must show BEFORE calling startRecording() — original implementation auto-started on mount, causing overlay + browser prompt to appear simultaneously
- **Execution pattern**: 4 parallel agents (audio engine, UI, tests, orchestrator) with orchestrator fixing lint/integration issues across agent outputs

---

## Current Focus

**Milestone 3: Real-Time Onset Detection** (Week 3)

Deliverables:
- Spectral flux onset detection in AudioWorklet
- Inline FFT (radix-2 Cooley-Tukey, Hann window)
- Adaptive threshold (running median * multiplier)
- Audio snippet extraction (10ms pre + 200ms post onset)
- OnsetDetector class with configurable sensitivity
- Hit visual feedback (HitFlash wiring, hitCount increment)
- Feature extraction (13-dim vector per hit)

---

## Next Up

| Priority | Item | Reference |
|----------|------|-----------|
| 1 | Milestone 3: Onset Detection | `releases/mvp/milestone-3-onset-detection.md` |
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
| Vitest + Playwright | Fast unit tests + cross-browser E2E coverage |
| Port 8087, no SSL | localhost doesn't need HTTPS; simplifies dev setup |
| Appendix A tokens canonical | `--bg-primary: #121214`, `--accent-primary: #FF6B3D` — not older spec names |
