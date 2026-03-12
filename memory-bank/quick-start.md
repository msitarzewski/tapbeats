# TapBeats Quick Start

## What is TapBeats

TapBeats is an open-source, web-first application that transforms tapping on any surface into polished, looping drum beats. Users record themselves tapping, the app detects each hit, groups similar-sounding hits via unsupervised machine learning (k-means), lets the user assign real instrument samples to each group, quantizes timing to a musical grid, and plays it back as a seamless loop. The core innovation is "perform first, assign instruments later" -- no hardware or DAW experience required.

## Core Flow

```
Record -> Detect -> Cluster -> Assign -> Quantize -> Play
```

1. **Record** -- Capture tapping via microphone (up to 2 min)
2. **Detect** -- Real-time onset detection identifies each hit (< 50ms latency)
3. **Cluster** -- K-means groups similar sounds (auto-k via silhouette scoring)
4. **Assign** -- User maps each cluster to a drum sample (kick, snare, hi-hat, etc.)
5. **Quantize** -- Snap timing to grid (1/4, 1/8, 1/16, triplets) with adjustable strength
6. **Play** -- Loop playback with per-track volume, mute, solo controls

## Tech Stack Quick Ref

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript 5.4+ |
| Build | Vite 5+ |
| State | Zustand 4+ |
| Audio | Web Audio API + AudioWorklet |
| Storage | IndexedDB via `idb` 8+ |
| Timeline | HTML5 Canvas 2D (60fps) |
| Testing | Vitest 1+ (unit) + Playwright (E2E) |
| Styling | CSS Modules |
| Linting | ESLint + Prettier |
| CI/CD | GitHub Actions |

## Key Directories

```
src/audio/          -- Core audio engine (capture, analysis, clustering, quantization, playback)
src/components/     -- React components (app/, recording/, clustering/, timeline/, session/, shared/)
src/state/          -- Zustand stores (app, recording, cluster, timeline, session) + middleware
src/types/          -- TypeScript type definitions (audio, clustering, timeline, session)
src/utils/          -- Shared utilities (id, time, math, arrayBuffer, platform, constants)
public/worklets/    -- AudioWorklet processor files (run on audio thread)
docs/               -- PRD and 8 section documents
releases/mvp/       -- MVP release plan with 10 milestone docs
memory-bank/        -- AI session context and project history
```

## Dev Commands

```bash
npm run dev         # Start Vite dev server with HMR
npm test            # Run Vitest unit tests
npm run build       # Production build
npm run lint        # ESLint + Prettier check
```

## Current Phase

Planning phase complete. Full PRD (17,500+ lines across 8 section docs) and MVP release plan (10 milestones, 12 weeks) finalized. Implementation not yet started. **Next: Milestone 1 (Project Scaffolding).**

## Key Files

| File | Purpose |
|------|---------|
| `docs/PRD.md` | Master PRD entry point |
| `docs/sections/technical-architecture.md` | System architecture, data models, audio pipeline |
| `docs/sections/audio-engineering.md` | DSP algorithms, onset detection, clustering spec |
| `docs/sections/developer-experience.md` | Project structure, coding standards, state management |
| `docs/sections/ui-design.md` | Design system, wireframes, component inventory |
| `docs/sections/testing-strategy.md` | Test pyramid, CI/CD, quality gates |
| `releases/mvp/README.md` | MVP milestone tracker and risk register |
| `releases/mvp/milestone-1-project-scaffolding.md` | First milestone details |

## Common Patterns

- **Zustand stores**: One store per domain (app, recording, cluster, timeline, session). Persistence middleware writes to IndexedDB. No provider wrappers needed.
- **AudioWorklet communication**: Main thread sends config via `port.postMessage()`, worklet posts onset events back. Worklet files live in `public/worklets/`.
- **Canvas rendering**: Timeline grid and hit markers render via Canvas 2D at 60fps. Playback cursor animated with `requestAnimationFrame`.
- **Pure-JS DSP**: FFT, MFCC, spectral analysis all in TypeScript -- no native deps, no WASM for v1.
- **CSS Modules**: Component-scoped styles. Design tokens defined as CSS custom properties.
- **Error boundaries**: Global `ErrorBoundary.tsx` wraps the app with recovery UI.
