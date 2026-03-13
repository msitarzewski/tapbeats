# TapBeats Active Context

## Current State

**Phase**: Milestone 3 complete — all runtime bugs fixed, ready to commit.
**Sprint**: Implementation — onset detection
**Branch**: `milestone-3/onset-detection` (from `milestone-2/audio-capture` commit `46ee54a`)
**Last Updated**: 2026-03-12

---

## Active Work

- Milestone 1: Project Scaffolding & Infrastructure — **COMPLETE** (commit `34680be` on `milestone-1/scaffolding`)
- Milestone 2: Audio Capture & Microphone Pipeline — **COMPLETE** (on `milestone-2/audio-capture`)
- Milestone 3: Real-Time Onset Detection — **COMPLETE** (on `milestone-3/onset-detection`)
  - All source files implemented (5 analysis, 1 worklet, 4 hooks, 2 components, 5 modified)
  - 205 tests passing (18 test files), 0 lint errors, production build succeeds (48KB app)
  - All 5 runtime bugs found and fixed via Chrome DevTools debugging
  - **NOT YET COMMITTED** — awaiting user approval

---

## Bugs Found & Fixed (M3)

1. **72 false onsets in 8.3s** — Minimum flux threshold `0.001` too low, triggering on ambient mic noise. Raised to `0.05`.
2. **Onset events never captured** — `captureRef.current` passed to `useOnsetDetection()` was always `null` (refs don't trigger re-renders). Fixed by moving onset listener into `useAudioCapture.startRecording()` directly.
3. **Stuck on "Analyzing taps..."** — `useProcessing` used `setTimeout` batching that got killed by React effect cleanup between batches. Fixed by making processing synchronous with try/catch.
4. **Stop appeared to do nothing** — `'complete'` status had no handler in RecordingScreen, fell through to recording view. Fixed by adding `useEffect` that navigates to `/` on `'complete'`.
5. **Still ~135 false onsets with 0.05 threshold** — Ambient mic spectral flux regularly exceeds 0.5. Fixed by adding **RMS energy gate** (`rmsEnergy > 0.01`) in tap-processor.js. Result: 1 false detection in 16s of ambient noise.

---

## Key Implementation Details (M3)

### Data Flow
```
tap-processor.js (worklet thread)
  → postMessage({ type: 'onset', timestamp, strength, snippet })
  → AudioCapture.ts port.onmessage → emits 'onset' event
  → useAudioCapture onset listener → store.addOnset({ onset, features: null })
  → HitFlash fires (hitCount increment)
  → StatsBar updates hit count
  → ProtoTimeline draws new dot
```

### On Recording Stop
```
stopRecording() → status = 'processing'
  → useProcessing detects transition (synchronous, in useEffect)
  → FeatureExtractor.extract() on each onset's snippet
  → store.updateHitFeatures(index, features)
  → Z-score normalize all feature vectors
  → status = 'complete'
  → useEffect navigates to '/'
```

### Onset Detection Gating (final)
All three conditions must be true for an onset:
1. `flux > adaptiveThreshold` (running median × multiplier)
2. `flux > 0.5` (absolute flux floor)
3. `rmsEnergy > 0.01` (amplitude energy gate — rejects quiet ambient noise)
4. `timeSinceLastOnset >= minInterOnsetMs` (cooldown)

### Files Created
- `src/audio/analysis/FFT.ts` — Radix-2 Cooley-Tukey FFT
- `src/audio/analysis/dsp-utils.ts` — Hann window, spectral flux, median, mel filter bank
- `src/audio/analysis/FeatureExtractor.ts` — 12-dim feature extraction
- `src/audio/analysis/estimateBpm.ts` — Median-interval BPM estimation
- `public/worklets/tap-processor.js` — Onset-detecting AudioWorklet
- `src/hooks/useOnsetDetection.ts` — (exists but unused, onset wiring in useAudioCapture)
- `src/hooks/useProcessing.ts` — Post-recording feature extraction (synchronous)
- `src/hooks/useBpmEstimate.ts` — BPM from onset timestamps
- `src/hooks/useProtoTimelineRenderer.ts` — Canvas onset dot renderer
- `src/components/recording/ProtoTimeline.tsx` + CSS
- `src/components/recording/SensitivityControl.tsx` + CSS

### Files Modified
- `src/types/audio.ts` — OnsetEvent, AudioFeatures, DetectedHit, SensitivityLevel, etc.
- `src/state/recordingStore.ts` — _onsets, _sensitivity, addOnset, setSensitivity, updateHitFeatures
- `src/audio/capture/AudioCapture.ts` — onset event, tap-processor.js, updateSensitivity()
- `src/hooks/useAudioCapture.ts` — onset listener, sensitivity forwarding, processing-only stop
- `src/components/recording/RecordingScreen.tsx` — ProtoTimeline, SensitivityControl, useProcessing, complete→navigate
- `src/components/recording/StatsBar.tsx` — Live BPM display

---

## Next Actions

1. **Commit M3** — all bugs fixed, tests pass, build succeeds
2. **Merge milestone branches to main** (M1, M2, M3)
3. **Milestone 4: Clustering** — `releases/mvp/milestone-4-clustering.md`
4. **Milestone 5: Instrument Assignment** — `releases/mvp/milestone-5-instrument-assignment.md`

---

## Context Notes

- 4 parallel agents used for M3 (DSP, Integration, UI, Tests + orchestrator). Works well.
- Chrome DevTools MCP used for runtime debugging — very effective for diagnosing worklet/React issues.
- Key lint rules: `no-non-null-assertion` (use `?? 0` for typed array access), `import/order`, `dot-notation`
- Worklet JS: `var` declarations, old-style functions, NO arrow/template/console.log
- PRD is comprehensive (17,500+ lines) — always check section docs before implementing
