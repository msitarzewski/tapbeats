# Testing Patterns

## Test Pyramid

- **65% Unit** (Vitest + OfflineAudioContext) -- fast, deterministic, highest leverage
- **25% Integration** (Vitest + jsdom/happy-dom) -- module composition validation
- **10% E2E** (Playwright) -- real browser APIs, critical user journeys

Audio DSP algorithms are pure functions over typed arrays, making unit tests the highest-value investment.

## Unit Testing

**Framework**: Vitest | **Environment**: jsdom for DOM tests, Node for pure algorithms | **Coverage**: V8 provider

Key configuration: `vitest.config.ts` -- globals enabled, setup file at `src/test/setup.ts` (cleans AudioContexts after each test, polyfills OfflineAudioContext in Node).

- Compare Float32Arrays with tolerance (`toBeCloseTo` / epsilon), never strict equality
- Use `OfflineAudioContext` for deterministic rendering (no real-time clock)
- Use `fake-indexeddb/auto` for storage tests (in-memory IndexedDB)
- Fixed random seeds (`seed: 42`) for any stochastic algorithm (k-means init)

## Audio Testing Patterns

### Onset Detection
- Generate synthetic click tracks via `OfflineAudioContext` with known onset times
- Measure precision, recall, F1 against ground truth with 20ms tolerance window
- Test edge cases: silence (zero false positives), close onsets (50ms apart), varying amplitude, background noise
- Benchmark accuracy per fixture: F1 >= 0.95 (clean), >= 0.80 (noisy/varying)

### Feature Extraction
- Test against analytically known values: RMS of DC signal = value, sine wave RMS = amplitude/sqrt(2)
- Zero-crossing rate of sine ~ 2*freq/sampleRate
- Spectral centroid of pure sine ~ dominant frequency (within FFT bin resolution)
- MFCCs: correct count returned, near-zero for silence
- Full feature vector has consistent dimensionality

### Clustering
- Synthetic clusters with known centroids and low noise, verify purity >= 0.9
- Silhouette score >= 0.5 for well-separated clusters
- Edge cases: single cluster, more K requested than points, deterministic with fixed seed

### Quantization
- Snap offsets to nearest grid position, verify deviation < 5ms from ideal grid
- Merge onsets that land on same grid point, preserve count for distinct onsets
- Partial strength (interpolated), zero strength (identity), auto-BPM detection
- Benchmark: mean deviation < 3ms for 16th note grid at 120 BPM

## Integration Testing

- **Audio pipeline end-to-end**: capture buffer -> onset detection -> feature extraction -> clustering. Verify two distinct synthetic sounds cluster into k=2 groups.
- **Recording flow with mocked MediaStream**: `vi.spyOn(navigator.mediaDevices, 'getUserMedia')` returns a synthetic stream from `createMediaStreamDestination()`.
- **Session save/load roundtrip**: `fake-indexeddb/auto` for in-memory IndexedDB. Save session, load, verify data integrity including Float32Array roundtrip.
- **Playback scheduling accuracy**: Verify scheduled events within 5ms of intended times; loop boundaries respected.

## E2E Testing

**Framework**: Playwright | **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome (Pixel 7), Mobile Safari (iPhone 14)

- Mock microphone via `getUserMedia` override injecting synthetic oscillator bursts at known times
- Chromium alternative: `--use-fake-device-for-media-stream` with WAV file
- **Core flows**: first-time user (record -> cluster -> assign -> play), returning user (load -> modify -> save), error handling (permission denied, no mic, unsupported browser)
- Visual regression: timeline screenshots with `toHaveScreenshot()`, maxDiffPixelRatio 0.01

## Performance Testing

- **Lighthouse CI** (`.lighthouserc.json`): Performance >= 0.9, Accessibility >= 0.95, FCP < 1.5s, LCP < 2.5s, CLS < 0.1, TBT < 200ms, TTI < 3.5s
- **Audio processing benchmarks** (Vitest `bench`): onset detection 5s < 200ms, 30s < 1s; feature extraction < 5ms/onset; clustering 50 vectors < 50ms; quantization 100 onsets < 10ms
- **Canvas FPS**: Timeline maintains 30+ FPS with 200+ hits (measured via `requestAnimationFrame` counting)
- **Memory**: Heap growth < 20MB after 5s recording session

## Accessibility Testing

- **axe-core** via `@axe-core/playwright`: WCAG 2.1 AA on every screen state (home, recording, cluster assignment)
- **Screen reader matrix** (manual): VoiceOver/Safari (macOS + iOS) required; NVDA/Chrome (Windows) required; JAWS, TalkBack recommended
- **Keyboard navigation**: all interactive elements reachable via Tab, Space/Enter activates buttons, Escape closes modals
- **Reduced motion**: `prefers-reduced-motion: reduce` disables all animations and waveform visualizer animation
- **Color contrast**: 4.5:1 for normal text, 3:1 for large text (enforced by axe-core)

## Cross-Browser Testing

### Browser Matrix
| Browser | Priority | Notes |
|---------|----------|-------|
| Chrome 120+ | P0 | Primary target |
| Firefox 120+ | P0 | Different Web Audio impl |
| Safari 17+ (desktop + iOS) | P0 | Most divergent audio behavior |
| Edge 120+ | P1 | Chromium-based |
| Chrome 100-119, Samsung Internet | P2 | Older/mobile |

### Known Safari/iOS Issues
- AudioContext must resume inside touch/click handler (not programmatic)
- Sample rate may be 48000 Hz (not 44100); detect and resample if needed
- Page visibility: iOS suspends AudioContext when backgrounded
- Aggressive audio buffer memory limits; verify 2-minute recording stability
- No MediaRecorder in Safari < 14.3; use AudioWorklet recording fallback

## Coverage Targets

| Module | Statements | Branches |
|--------|-----------|----------|
| `src/audio/onset-detection.*` | 95% | 90% |
| `src/audio/feature-extraction.*` | 95% | 90% |
| `src/audio/clustering.*` | 90% | 85% |
| `src/audio/quantization.*` | 95% | 90% |
| `src/audio/playback.*` | 85% | 80% |
| `src/state/*` | 90% | 85% |
| `src/components/*` | 80% | 75% |
| **Global minimum** | **85%** | **80%** |

## Quality Gates

### PR Gates (every push)
- Lint (ESLint, zero warnings) + typecheck (`tsc --noEmit`)
- Unit + integration tests with coverage thresholds
- Accessibility tests (axe-core on Chromium)

### Merge Gates (push to main)
- All PR gates +
- Full E2E across Chromium, Firefox, WebKit
- Performance benchmarks (Vitest bench + Lighthouse CI)

### Release Gates (tagged version)
- All merge gates +
- Cross-browser via BrowserStack (desktop + mobile matrix)
- Manual QA checklist (device matrix, real-world noise, surface types, accessibility)
- Sign-off required before release
