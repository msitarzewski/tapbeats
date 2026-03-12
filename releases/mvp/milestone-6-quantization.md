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
