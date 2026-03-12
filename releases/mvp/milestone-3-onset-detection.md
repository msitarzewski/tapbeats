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

## Implementation Notes from M1

### Infrastructure Already in Place
- AudioWorklet processor files go in `public/worklets/*.js` — ESLint override exists with relaxed rules and AudioWorklet globals pre-declared
- Ambient types for `AudioWorkletProcessor` and `registerProcessor` in `src/types/global.d.ts`
- Web Audio mocks ready in `tests/helpers/` — extend with onset-specific mock data
- Feature extraction module goes in `src/audio/analysis/` (directory exists)
- OnsetDetector module goes in `src/audio/capture/` or `src/audio/analysis/`

### TypeScript/Lint Rules to Watch
- `verbatimModuleSyntax`: use `import type` for type-only imports
- `strict-boolean-expressions`: no truthy checks — explicit comparisons required
- `noUncheckedIndexedAccess`: array index returns `T | undefined` — must narrow
- `restrict-template-expressions`: `String()` wrap for numbers in template literals
- Import ordering: blank lines between groups, CSS modules before type imports
- Test files: `tsconfig.test.json` used via ESLint override, relaxed `any` rules

### Test Fixtures
- `tests/fixtures/` directory exists with README — place WAV test files here
- Test audio files with labeled onsets should be committed as fixtures
- Vitest benchmarks can use `vitest bench` — add `test:bench` script if needed

### Performance Testing
- Coverage thresholds are 80% — onset detection code will be measured
- Vitest `pool: 'forks'` provides test isolation — safe for AudioWorklet simulation
