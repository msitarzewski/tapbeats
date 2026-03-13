# Milestone 6: Quantization Engine

**Target**: Week 6
**Status**: Not Started
**Dependencies**: Milestone 5 (Instrument Assignment)

---

## Objective

Implement the quantization engine that takes messy human timing and snaps it to a musical grid. Includes BPM auto-detection, grid resolution selection, quantization strength control, and before/after comparison.

## Deliverables

### 6.1 BPM Detection
- [ ] Implement `QuantizationEngine` module per developer-experience interfaces
- [ ] Inter-onset interval (IOI) histogram analysis
- [ ] Gaussian kernel smoothing on IOI histogram
- [ ] Peak detection for most likely BPM
- [ ] Tempo ambiguity resolution (80 vs 160 BPM — prefer musically common range 70-180)
- [ ] BPM output with confidence score
- [ ] Manual BPM override input (FR-038, range 40-240)

### 6.2 Grid Quantization Algorithm
- [ ] Nearest-grid-point snap for each onset
- [ ] Grid resolution options (FR-039):
  - 1/4 notes
  - 1/8 notes
  - 1/16 notes
  - 1/4 note triplets
  - 1/8 note triplets
  - 1/16 note triplets
- [ ] Quantization strength parameter 0-100% (FR-040)
  - 0% = original timing preserved
  - 100% = snapped exactly to grid
  - Intermediate = linear interpolation between original and grid position
- [ ] Preserve velocity/energy from original hit
- [ ] Non-destructive: original timestamps always preserved (FR-043)

### 6.3 Real-Time Parameter Adjustment
- [ ] Quantization recalculates in real-time as user changes BPM, grid, or strength (FR-044)
- [ ] Recalculation completes in < 200ms for up to 500 hits (NFR-005)
- [ ] Web Worker offloading if needed for large hit counts

### 6.4 Before/After Comparison
- [ ] Toggle between original and quantized playback (FR-041)
- [ ] Visual indicator of current mode (original vs quantized)
- [ ] Smooth transition between modes

### 6.5 Quantization UI Elements
- [ ] BPM display with detected value and manual override input (FR-038)
- [ ] Grid resolution selector (dropdown or segmented control) (FR-039)
- [ ] Quantization strength slider (0-100%) (FR-040)
- [ ] Before/after toggle button (FR-041)
- [ ] Ghost markers showing original position (FR-042, P1)

### 6.6 State Management
- [ ] Extend `timelineStore` with quantization config (BPM, grid, strength)
- [ ] Store both original and quantized onset times
- [ ] Derived state: quantized hits computed from originals + config

### 6.7 Tests
- [ ] Unit: BPM detection with synthetic onset patterns (known BPMs: 80, 100, 120, 140)
- [ ] Unit: BPM detection with tempo ambiguity
- [ ] Unit: Grid snap algorithm — verify each onset moves to nearest grid point at 100% strength
- [ ] Unit: Quantization strength interpolation (0%, 50%, 100%)
- [ ] Unit: All grid resolutions (1/4, 1/8, 1/16, triplets)
- [ ] Unit: Non-destructive — original timestamps unchanged after quantization
- [ ] Benchmark: Recalculation < 200ms for 500 hits
- [ ] Integration: Full pipeline — onsets → BPM detect → quantize → verify musical result

## Acceptance Criteria

- [ ] BPM auto-detected within ±5 BPM for steady rhythms (FR-037)
- [ ] Manual BPM override works in range 40-240 (FR-038)
- [ ] All 6 grid resolutions available and produce correct timing (FR-039)
- [ ] Strength slider smoothly interpolates 0-100% (FR-040)
- [ ] Before/after toggle plays original vs quantized (FR-041)
- [ ] Quantization is non-destructive (FR-043)
- [ ] Real-time recalculation < 200ms (NFR-005, FR-044)
- [ ] Quantized output sounds musically pleasing for typical 4/4 patterns

## Relevant PRD References

- `product-requirements.md` — FR-037 through FR-044
- `audio-engineering.md` — Section 5 (Quantization algorithm)
- `technical-architecture.md` — Section 6 (Quantization engine)

## Implementation Notes from Previous Milestones

### Infrastructure from M2
- **RingBuffer** (`src/audio/capture/RingBuffer.ts`): Reusable circular buffer pattern — could be adapted for onset history or quantization candidate windows.
- **Store subscription pattern**: High-frequency data (amplitudes) uses `store.subscribe()` outside React to avoid re-render storms. Apply same pattern for real-time quantization preview updates.

### Infrastructure Already in Place (from M1)
- Quantization engine goes in `src/audio/quantization/` (directory exists)
- Slider component available for strength control (0-100%), BPM adjustment
- Button component (3 variants) for grid resolution selector, before/after toggle
- Zustand store pattern established — extend or create new slice in `src/state/`
- Vitest benchmarks can validate < 200ms recalculation budget

### TypeScript/Lint Rules to Watch
- `verbatimModuleSyntax`: use `import type` for type-only imports
- `strict-boolean-expressions`: no truthy checks — explicit comparisons required
- `noUncheckedIndexedAccess`: histogram bin access returns `T | undefined` — must narrow
- `restrict-template-expressions`: `String()` wrap numbers (e.g., BPM display)
- Import ordering: blank lines between groups
- Web Worker files: may need ESLint override similar to AudioWorklet override if using separate `.ts` worker files

### Performance Notes
- Vitest `pool: 'forks'` gives isolated test processes — good for CPU-intensive benchmarks
- Coverage thresholds at 80% — quantization math will be measured
- Vite build target is ES2022 — can use modern JS features freely

### Lessons from M3 (Onset Detection)

#### React Patterns
- **Never pass `ref.current` to hooks as a reactive dependency.** React refs don't trigger re-renders, so hooks receiving `ref.current` always get the initial value (usually `null`). Wire event listeners directly where the instance is created (e.g., in `startRecording()` alongside other listeners).
- **Never use `setTimeout` chains inside `useEffect`.** React's effect cleanup runs between setTimeout calls (especially in StrictMode), killing the chain. For post-processing work triggered by state changes, process synchronously within the effect body wrapped in try/catch. If work is too heavy (>3s), use a Web Worker instead.
- **Always handle all status values in conditional renders.** If a component renders different views based on status (idle, recording, processing, complete), ensure every status has a handler. Missing handlers cause the component to fall through to an unexpected default view.

#### AudioWorklet Patterns
- **Worklet files in `public/` may be cached by the browser.** After modifying a worklet file, a hard reload (Cmd+Shift+R) or cache-busting query param is needed. Vite's HMR does not apply to AudioWorklet modules.
- **Spectral flux alone is insufficient for onset gating.** Ambient microphone noise produces spectral flux values of 0.3-0.7 regularly. Use dual gating: spectral flux threshold (>0.5) AND RMS energy gate (>0.01). The energy gate rejects quiet noise regardless of spectral variation.
- **AudioWorklet JS rules**: `var` declarations, old-style `function` syntax, NO arrow functions, NO template literals, NO `console.log` (not available in worklet scope). Add `// @ts-nocheck` and `/* eslint-disable no-undef */` at top.
- **Pre-allocate all buffers in worklet constructor.** Never allocate in `process()` — it runs on the audio thread and allocations cause glitches. Only exception: re-allocating snippet buffer after Transferable transfer.

#### DSP & TypeScript
- **Use `?? 0` for typed array access** to satisfy `no-non-null-assertion` lint rule. E.g., `arr[i] ?? 0` instead of `arr[i]!`.
- **Use dot notation for object property access** (`f.rms`) not bracket notation (`f["rms"]`) to satisfy `dot-notation` lint rule.
- **Synchronous feature extraction is fast enough**: ~5ms per hit × 500 max = ~2.5s worst case. Acceptable since processing overlay is shown.

#### Testing & Debugging
- **Chrome DevTools MCP is highly effective** for debugging AudioWorklet + React integration issues at runtime. Use it to inspect console logs, take snapshots, and interact with the UI programmatically.
- **Canvas in jsdom**: `HTMLCanvasElement.getContext()` returns `null` — mock it in tests with `vi.spyOn(HTMLCanvasElement.prototype, 'getContext')`.
- **ResizeObserver in jsdom**: Not provided — mock globally in test setup.
- **Use `store.subscribe()` (not selectors) for high-frequency canvas rendering** that runs outside React's render cycle (e.g., ProtoTimeline, LiveWaveform).
