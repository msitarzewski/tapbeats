# TapBeats Active Context

## Current State

**Phase**: Milestone 4 complete — clustering + review UI implemented, needs browser verification.
**Sprint**: Implementation — clustering & cluster review
**Branch**: `milestone-4/clustering` (from `milestone-3/onset-detection`)
**Last Updated**: 2026-03-12

---

## Active Work

- Milestone 1: Project Scaffolding & Infrastructure — **COMPLETE** (commit `34680be` on `milestone-1/scaffolding`)
- Milestone 2: Audio Capture & Microphone Pipeline — **COMPLETE** (on `milestone-2/audio-capture`)
- Milestone 3: Real-Time Onset Detection — **COMPLETE** (on `milestone-3/onset-detection`)
- Milestone 4: Sound Clustering & Cluster Review UI — **COMPLETE** (on `milestone-4/clustering`)
  - 6 clustering algorithm files, clusterStore, 2 hooks, 3 UI components + CSS modules
  - useProcessing extended with clustering pipeline, RecordingScreen navigates to `/review`
  - 314 tests passing (27 test files), 0 lint errors, production build succeeds (63KB app)
  - **Pending browser verification** before merge

---

## Key Implementation Details (M4)

### Clustering Pipeline (added to useProcessing)
```
status='processing' triggers useProcessing effect
  → FeatureExtractor.extract() per onset (existing M3)
  → Z-score normalize scalar features (existing M3)
  → runClustering(onsets) → ClusteringOutput     ← NEW M4
    → Filter null features, convert to 12-dim vectors
    → Min-max normalize to [0,1]
    → Auto-K via silhouette (k=2..8, 3 restarts each)
    → K-means++ with Lloyd's iteration
    → Edge cases: ≤1 hits→k=1, <5 hits→cap k=2, variance<0.01→k=1, silhouette<0.25→k=1
  → clusterStore.setClustering(output, onsets)    ← NEW M4
  → setStatus('complete')
  → RecordingScreen navigates to '/review'        ← CHANGED M4
```

### Cluster Review Screen (`/review`)
- Header: back button + "Assign Sounds" title
- Summary: "We found N distinct sounds in your recording" + contextual guidance
- Responsive grid: 1col mobile, 2col 640px, 3col 1024px
- ClusterCard: play button, cluster name, hit count, 48px waveform canvas
- ActionBar: Split (ghost), Merge (ghost), Continue (primary → `/timeline`)
- Interaction modes: default, split (tap card), merge (tap 2 cards)

### Files Created (M4)
**Algorithm** (`src/audio/clustering/`): distance.ts, normalize.ts, kmeans.ts, silhouette.ts, operations.ts, pipeline.ts
**State**: `src/state/clusterStore.ts` — Zustand store with setClustering, splitCluster, mergeClusters
**Hooks**: `useClusterPlayback.ts` (AudioContext + AudioBufferSourceNode), `useClusterWaveformRenderer.ts` (canvas one-shot render)
**UI**: `ClusterScreen.tsx` + CSS, `ClusterCard.tsx` + CSS, `ActionBar.tsx` + CSS
**Types**: `src/types/clustering.ts`

### Files Modified (M4)
- `src/hooks/useProcessing.ts` — added clustering pipeline after Z-score normalization
- `src/components/recording/RecordingScreen.tsx` — navigate to `/review` instead of `/`
- `src/components/shared/Card.tsx` — added `style` prop for CSS custom properties
- `src/components/shared/Icon.tsx` — added `play` and `chevron-right` icons

---

## Next Actions

1. **Browser verification of M4** — full flow from record → cluster → review → play/split/merge
2. **Milestone 5: Instrument Assignment** — sample library, smart defaults, assignment UI
3. **Milestone 6: Quantization Engine** — BPM detection, grid snap, strength slider

---

## Context Notes

- 3 parallel agents for M4 implementation (Algorithm, State/Integration, UI) + 1 Test agent. Efficient.
- `exactOptionalPropertyTypes` causes subtle issues: can't pass `{ rng }` when `rng` might be `undefined` — use conditional `rng !== undefined ? { rng } : undefined`
- Card component needed `style` prop for CSS custom property injection (cluster colors)
- Silhouette edge cases: 2 points in different clusters → s=1 (not 0), empty clusters with bi=Infinity→0 → s=-1
- Staggered CSS entrance animation via `--entrance-delay` custom property per card index
- All clustering algorithms are pure functions — no store access, optional seeded PRNG for deterministic testing
