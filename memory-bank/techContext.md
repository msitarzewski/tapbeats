# Tech Context

## Core Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI with concurrent rendering, `useSyncExternalStore` for Zustand |
| TypeScript | 5.7.2 | Strict mode + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` |
| Vite | 6.0.3 | Dev server (http://localhost:8087, no SSL), ESM-native, serves `public/worklets/` as-is |
| Zustand | 5.0.1 | State management (~1KB gzipped), selector-based subscriptions, middleware |
| React Router | 6.28.0 | Client-side routing (5 screens: /, /record, /review, /timeline, /settings) |

## Audio Stack

| API | Usage |
|-----|-------|
| **Web Audio API** | Core audio graph: `AudioContext`, `AudioBufferSourceNode`, `GainNode`, `StereoPannerNode`, `AudioDestinationNode` |
| **AudioWorklet** | Real-time onset detection on dedicated audio thread. Processes 128-sample render quanta. Communicates via `MessagePort` |
| **MediaStream API** | `navigator.mediaDevices.getUserMedia()` for microphone capture |
| **AnalyserNode** | Available for visualization; not used in core pipeline |
| **OfflineAudioContext** | Batch post-processing and WAV bounce-to-file export |

**Critical constraints for `getUserMedia`**: `echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`, `channelCount: 1`, `sampleRate: { ideal: 44100 }`.

**AudioContext rules**: Exactly ONE instance for the entire app. Created/resumed inside user gesture handler. Always read `ctx.sampleRate` (never hardcode 44100).

## Testing Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 2.1.5 | Unit + integration tests; jsdom environment; V8 coverage; `pool: 'forks'` |
| Playwright | 1.49.0 | E2E across 5 projects: Chromium, Firefox, WebKit, Pixel 7, iPhone 14 |
| jsdom | 25.0.1 | DOM environment for component tests |
| @vitest/coverage-v8 | 2.1.5 | V8 coverage provider; 80% thresholds (branches/functions/lines/statements) |

**Test structure**: `tests/unit/` mirrors `src/`; `tests/integration/` for multi-module pipelines; `tests/e2e/` for Playwright; `tests/fixtures/` for WAV files; `tests/helpers/` for mocks and setup.

**Test infrastructure**: `setupTests.ts` provides global AudioContext + MediaStream mocks. `audioMocks.ts` exports `createMockAudioContext()` and `createMockMediaStream()` factories. Test files use `tsconfig.test.json` (includes tests/, relaxed unused-var rules).

## Build and Tooling

| Tool | Version | Config |
|------|---------|--------|
| ESLint | 8.57.1 | `.eslintrc.cjs` — strict-type-checked, stylistic-type-checked, react-hooks, import/order |
| Prettier | 3.4.2 | `.prettierrc` — single quotes, trailing commas, 100-char, LF |
| Husky | 9.1.7 | `.husky/pre-commit` — runs lint-staged |
| lint-staged | 15.2.10 | ESLint fix + Prettier on staged .ts/.tsx/.css files |
| GitHub Actions | - | `ci.yml` (lint, typecheck, unit tests, build), `e2e.yml` (Playwright 3-browser matrix) |

**Vite specifics**: AudioWorklet files served from `public/worklets/` as static JS (no bundling). No SSL plugin — dev server is plain HTTP. COOP/COEP headers set for SharedArrayBuffer. Worklet files must not import from `src/`.

## Browser Targets

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 90+ | Full support |
| Safari | 15+ (15.4+ preferred) | AudioWorklet since 14.1; SharedArrayBuffer since 16.4 |
| iOS Safari | 15+ (15.4+ preferred) | Most restrictive -- see quirks below |
| Chrome Android | 90+ | Full support |
| Edge | 90+ | Full support (Chromium-based) |

**SharedArrayBuffer** requires COOP/COEP headers: `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`.

## Key Browser Quirks

### iOS Safari (mandatory workarounds)
1. **AudioContext resume**: Must be created/resumed inside `touchend`/`click`/`pointerup` handler (not `touchstart`). Creation must be synchronous within handler.
2. **Sample rate locking**: iOS devices report 48000Hz. Requesting 44100 may be silently ignored. Scale FFT size accordingly: `sampleRate <= 44100 ? 1024 : 2048`.
3. **Page visibility**: Backgrounding suspends AudioContext. Detect via `visibilitychange`, warn user, pause recording.
4. **Memory pressure**: Keep total audio buffer allocations under 50MB on older iPhones (2-3GB RAM).
5. **`echoCancellation: false`**: May be silently ignored on iOS Safari.

### Safari General
- OGG codec not supported: fall back to MP3 for sample loading (`canPlayType('audio/ogg; codecs=vorbis')`).
- Max ~4 AudioContext instances (vs ~6 on Chrome/Firefox).

### getUserMedia & HTTPS
- `getUserMedia` requires HTTPS in production. On `localhost`, all browsers allow it over HTTP.
- Dev server runs HTTP on port 8087 — no SSL needed locally.

## Performance Budgets

| Metric | Target |
|--------|--------|
| Onset detection latency | < 50ms (23.2ms hop + processing) |
| Feature extraction (50 onsets) | < 50ms total |
| Clustering (500 hits, K=8) | < 3s (typically <200ms) |
| Playback start latency | < 100ms (50ms head start + scheduling) |
| Timeline rendering | 60fps (Canvas 2D) |
| Bundle size | < 200KB gzipped |
| Audio memory (ring buffer, 10s) | ~1.7MB |
| Per-hit snippet | ~37KB (210ms at 44.1kHz) |

## Dependencies Policy

**Minimal external dependencies**. Core DSP (FFT, spectral analysis, onset detection, clustering, quantization) is built in-house using pure TypeScript. No audio processing libraries.

Rationale: Full control over AudioWorklet-compatible code (no DOM/fetch dependencies), deterministic behavior, smaller bundle, deeper understanding for debugging.

**Allowed external deps**: React, Zustand, react-router-dom, Vite (build). Testing tools are devDependencies only.

## Project Structure

```
src/
  components/          # React UI by screen: app/, recording/, clustering/, timeline/, session/, shared/
  audio/               # Pure TS audio engine (zero React deps), testable without DOM
    capture/           # MediaStream, AudioWorklet connection, ring buffer
    analysis/          # OnsetDetector, FeatureExtractor, FFT (pure TS radix-2)
    clustering/        # SoundClusterer (k-means), distance metrics, silhouette
    quantization/      # QuantizationEngine, BPMDetector, grid/swing helpers
    playback/          # PlaybackEngine (lookahead scheduler), SampleBank
  state/               # Zustand stores (5 slices) + middleware/ (persist, devtools)
  hooks/               # React hooks bridging audio modules and component lifecycle
  types/               # Shared TS types + global.d.ts (AudioWorklet ambient types, __DEV__)
  utils/               # Pure utilities: math, time, arrayBuffer, platform detection
  styles/              # theme.css (40+ custom props), global.css (reset), animations.css (keyframes)
  assets/samples/      # Built-in instrument samples
public/
  worklets/            # AudioWorklet processor JS files (served as static, separate from src/)
tests/
  unit/                # Mirrors src/ structure
  integration/         # Multi-module pipeline tests
  e2e/                 # Playwright browser tests
  fixtures/            # WAV files, pre-computed feature vectors
  helpers/             # setupTests.ts (global mocks), audioMocks.ts (factories)
```
