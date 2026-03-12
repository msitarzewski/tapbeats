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
| Framework | React 18 + TypeScript 5.7 (strict) |
| Build | Vite 6 |
| State | Zustand 5 |
| Audio | Web Audio API + AudioWorklet |
| Storage | IndexedDB (planned) |
| Timeline | HTML5 Canvas 2D (60fps) |
| Testing | Vitest 2.1 (unit) + Playwright 1.49 (E2E) |
| Styling | CSS Modules + CSS custom properties |
| Linting | ESLint 8 (strict-type-checked) + Prettier 3 |
| CI/CD | GitHub Actions |

## Dev Commands

```bash
npm run dev         # Vite dev server at http://localhost:8087
npm run build       # tsc --noEmit + vite build to dist/
npm run preview     # Preview production build
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint on src + tests
npm run lint:fix    # ESLint with auto-fix
npm run format      # Prettier on all files
npm run test        # Vitest in watch mode
npm run test:run    # Vitest single run
npm run test:coverage # Vitest with V8 coverage
npm run test:e2e    # Playwright headless
```

## Key Directories

```
src/audio/          -- Core audio engine (capture, analysis, clustering, quantization, playback)
src/components/     -- React components (app/, recording/, clustering/, timeline/, session/, shared/)
src/state/          -- Zustand stores + middleware
src/types/          -- TypeScript type definitions
src/utils/          -- Shared utilities
src/styles/         -- CSS design system (theme.css, global.css, animations.css)
src/hooks/          -- Custom React hooks
src/assets/samples/ -- Built-in instrument samples
public/worklets/    -- AudioWorklet processor files (served as static JS)
tests/unit/         -- Vitest unit tests (mirrors src/)
tests/integration/  -- Vitest integration tests
tests/e2e/          -- Playwright browser tests
tests/helpers/      -- Test utilities (setupTests.ts, audioMocks.ts)
tests/fixtures/     -- Test fixtures (WAV files, etc.)
docs/               -- PRD and 8 section documents
releases/mvp/       -- MVP release plan with 10 milestone docs
memory-bank/        -- AI session context and project history
```

## Current Phase

Milestone 1 (Project Scaffolding) **complete** on branch `milestone-1/scaffolding`. **Next: Milestone 2 (Audio Capture).**

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
| `src/styles/theme.css` | All 40+ CSS custom properties (canonical design tokens) |

## TypeScript Strict Mode Gotchas

These rules are enforced and cause the most friction:

| Rule | Impact |
|------|--------|
| `verbatimModuleSyntax` | Must use `import type { Foo }` for type-only imports |
| `strict-boolean-expressions` | No `if (x)` — use `if (x !== undefined)` |
| `noUncheckedIndexedAccess` | Array/object index returns `T \| undefined` |
| `exactOptionalPropertyTypes` | Cannot assign `undefined` to optional props |
| `restrict-template-expressions` | `String()` wrap numbers in template literals |
| `import/order` (ESLint) | Blank lines between groups, CSS modules before type imports |

## Common Patterns

- **Zustand stores**: One store per domain (app, recording, cluster, timeline, session). Persistence middleware writes to IndexedDB. No provider wrappers needed.
- **AudioWorklet communication**: Main thread sends config via `port.postMessage()`, worklet posts onset events back. Worklet files live in `public/worklets/`.
- **Canvas rendering**: Timeline grid and hit markers render via Canvas 2D at 60fps. Playback cursor animated with `requestAnimationFrame`.
- **Pure-JS DSP**: FFT, MFCC, spectral analysis all in TypeScript -- no native deps, no WASM for v1.
- **CSS Modules**: Component-scoped styles. Design tokens defined as CSS custom properties in `theme.css`.
- **Error boundaries**: Global `ErrorBoundary.tsx` wraps the app with recovery UI.
- **Shared components**: Button (primary/secondary/ghost x sm/md/lg), Slider, Card (with selected state), Modal (responsive bottom sheet / centered overlay).
