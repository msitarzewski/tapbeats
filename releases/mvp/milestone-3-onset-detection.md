# Milestone 3: Real-Time Onset Detection

**Target**: Week 3
**Status**: Not Started
**Dependencies**: Milestone 2 (Audio Capture)

---

## Objective

Implement real-time onset (hit) detection that runs during recording. Every time the user taps a surface, the app detects it, timestamps it, extracts a short audio snippet, and shows visual feedback — all with < 50ms latency.

## Deliverables

### 3.1 Onset Detection Algorithm
- [ ] Implement spectral flux onset detection in AudioWorklet
- [ ] Inline FFT computation (radix-2, Hann window)
- [ ] Spectral difference calculation (half-wave rectified)
- [ ] Adaptive threshold with running median
- [ ] Peak picking with minimum inter-onset interval (20ms, FR-014)
- [ ] Sub-frame onset refinement for precise timestamps

### 3.2 OnsetDetector Module
- [ ] Create `OnsetDetector` class per developer-experience interfaces
- [ ] Configurable sensitivity (FR-015)
- [ ] Onset event emission to main thread via MessagePort
- [ ] Per-onset data: timestamp, energy level, audio snippet buffer

### 3.3 Audio Snippet Extraction
- [ ] Extract 50-200ms window around each onset (FR-017)
- [ ] Store as Float32Array per onset
- [ ] Handle edge cases (onset near start/end of recording)

### 3.4 Feature Extraction (prep for Milestone 4)
- [ ] Implement `FeatureExtractor` module
- [ ] Per-hit features: RMS energy, spectral centroid, spectral rolloff, spectral flatness, zero-crossing rate, attack time, decay time
- [ ] Simplified MFCC extraction (5-7 coefficients)
- [ ] Feature vector composition (12 dimensions)
- [ ] Z-score normalization across all hits in a session

### 3.5 Recording UI Updates
- [ ] Visual pulse/flash on each detected hit (FR-013)
- [ ] Running hit count display (FR-018)
- [ ] Proto-timeline showing hits appearing as dots during recording
- [ ] Hit detection indicator animation (< 1 frame delay from detection)

### 3.6 State Management Updates
- [ ] Store detected onsets in `recordingStore` (timestamp, energy, buffer, features)
- [ ] Onset list grows during recording, finalized on stop

### 3.7 Tests
- [ ] Unit: FFT computation against known values
- [ ] Unit: Spectral flux calculation with synthetic signals
- [ ] Unit: Adaptive threshold with known onset patterns
- [ ] Unit: Feature extraction — each feature against analytically known values
- [ ] Unit: Minimum inter-onset interval enforcement
- [ ] Integration: Full onset detection with test audio fixtures (precision/recall/F1)
- [ ] Create test fixtures: WAV files with labeled onsets (clicks, taps, mixed)
- [ ] Benchmark: Onset detection runs within real-time budget (< 0.5% CPU per frame)

## Acceptance Criteria

- [ ] Onset detection latency < 50ms from physical tap to visual indicator (NFR-001)
- [ ] Minimum 20ms inter-onset interval enforced (FR-014)
- [ ] Visual feedback shown per detected hit during recording (FR-013)
- [ ] Onset detection precision > 90% with clean percussion input
- [ ] Onset detection recall > 85% with clean percussion input
- [ ] Feature extraction produces 12-dimension vector per hit
- [ ] Sensitivity control adjusts detection threshold (FR-015)
- [ ] AudioWorklet stays within real-time processing budget
- [ ] Works across Chrome, Firefox, Safari

## Relevant PRD References

- `product-requirements.md` — FR-012 through FR-018
- `audio-engineering.md` — Sections 2-3 (Onset detection, Feature extraction)
- `technical-architecture.md` — Sections 3-4 (Onset detection, Feature extraction)

## Implementation Notes from M1 and M2

### Infrastructure Already in Place (from M1)
- AudioWorklet processor files go in `public/worklets/*.js` — ESLint override exists with relaxed rules and AudioWorklet globals pre-declared
- Ambient types for `AudioWorkletProcessor` and `registerProcessor` in `src/types/global.d.ts`
- Feature extraction module goes in `src/audio/analysis/` (directory exists)
- OnsetDetector module goes in `src/audio/capture/` or `src/audio/analysis/`

### Infrastructure from M2 — Ready to Extend
- **Capture worklet** (`public/worklets/capture-worklet.js`): Currently buffers raw PCM and posts to main thread. For M3, onset detection logic should run IN the worklet (same thread as capture) for lowest latency. Extend or create a new `tap-processor.js` worklet that includes FFT + onset detection.
- **RingBuffer** (`src/audio/capture/RingBuffer.ts`): Circular Float32Array buffer. Can be reused for onset detector's internal ring buffer (last 10s of audio). Already tested with 15 unit tests.
- **AudioCapture class** (`src/audio/capture/AudioCapture.ts`): Typed event emitter with `on('buffer', ...)`. The onset detector should hook into the buffer events, or better: replace the capture worklet with an onset-detecting worklet that posts onset events instead of raw buffers.
- **Recording store** (`src/state/recordingStore.ts`): Has `incrementHitCount()` action — wire this to onset events for live hit count display. The `_amplitudes` array drives the waveform; onset events should also trigger `incrementHitCount()`.
- **HitFlash component** (`src/components/recording/HitFlash.tsx`): Already renders edge glow on hitCount changes — just needs `incrementHitCount()` to be called from onset events.
- **StatsBar component** (`src/components/recording/StatsBar.tsx`): Shows "Hits: N" with bounce animation. Already reads from store. BPM estimate placeholder ready.
- **Test mocks**: `tests/helpers/setupTests.ts` has MockAudioWorkletNode, MockAudioWorkletPort, full navigator.mediaDevices.getUserMedia mock. `tests/helpers/audioMocks.ts` has `createMockAudioWorkletNode()` and `createMockMediaStream()` factories.
- **Test fixtures**: `tests/fixtures/audio-samples.ts` has `generateSilence()`, `generateSineWave()`, `generateImpulse()` helpers. Extend with synthetic click/tap generators for onset testing.

### TypeScript/Lint Rules to Watch
- `verbatimModuleSyntax`: use `import type` for type-only imports
- `strict-boolean-expressions`: no truthy checks — explicit comparisons required (`=== null`, `!== undefined`, `.length > 0`)
- `noUncheckedIndexedAccess`: array index returns `T | undefined` — use `?? 0` for Float32Array access or `for...of` where possible
- `prefer-for-of`: use `for (const x of arr)` instead of `for (let i = 0; ...)` when only the value is needed
- `consistent-type-definitions`: use `interface` instead of `type` for object shapes
- `restrict-template-expressions`: `String()` wrap for numbers in template literals
- Import ordering: external → internal (@/) → parent → sibling → type imports, blank lines between groups
- Test files: `tsconfig.test.json` via ESLint override, relaxed `any` rules. But `no-unsafe-member-access` and `unbound-method` still apply — use typed casts instead of `as any` chains.
- **Worklet JS files**: Must use `var` declarations, old-style `function` syntax for `port.onmessage`, NO arrow functions in class methods, NO template literals, NO console.log, NO imports. Add `// @ts-nocheck` and `/* eslint-disable no-undef */` at top.

### Lessons from M2 Agent Execution
- **Pre-prompt before async API calls**: UI should show informational overlay BEFORE triggering browser permission prompts or async operations. Don't auto-trigger on mount — let user action (button click) initiate.
- **Worklet double-buffer pattern**: capture-worklet.js uses a pool of 2 pre-allocated Float32Arrays and swaps between them. This avoids allocations in `process()`. Apply same pattern for onset detection FFT buffers.
- **Store subscriptions for high-frequency data**: Use `store.subscribe()` outside React (not selectors) for data that updates faster than React should re-render (amplitudes, waveform data). Only use selectors for UI state.
- **Synchronous stop/dispose**: AudioCapture.stop() and dispose() are synchronous — avoid `async` on methods that don't actually await anything (`require-await` rule).
- **Canvas in jsdom**: jsdom doesn't implement `HTMLCanvasElement.getContext()` — mock it in setupTests or per-test with `vi.spyOn(HTMLCanvasElement.prototype, 'getContext')`.
- **ResizeObserver in jsdom**: jsdom doesn't provide ResizeObserver — mock it globally in tests.

### Test Fixtures
- `tests/fixtures/audio-samples.ts` already has `generateSilence`, `generateSineWave`, `generateImpulse` — extend with `generateClickTrack(onsetTimesMs[], sampleRate)` for onset detection testing
- Vitest benchmarks can use `vitest bench` — add `test:bench` script if needed

### Performance Testing
- Coverage thresholds are 80% — onset detection code will be measured
- Vitest `pool: 'forks'` provides test isolation — safe for AudioWorklet simulation
