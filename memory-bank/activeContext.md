# TapBeats Active Context

## Current State

**Phase**: Milestone 5 complete — instrument assignment & sample library implemented.
**Sprint**: Implementation — instrument assignment, smart defaults, playback engine
**Branch**: `milestone-5/instrument-assignment` (from `milestone-4/clustering`)
**Last Updated**: 2026-03-12

---

## Active Work

- Milestone 1: Project Scaffolding & Infrastructure — **COMPLETE** (commit `34680be` on `milestone-1/scaffolding`)
- Milestone 2: Audio Capture & Microphone Pipeline — **COMPLETE** (on `milestone-2/audio-capture`)
- Milestone 3: Real-Time Onset Detection — **COMPLETE** (on `milestone-3/onset-detection`)
- Milestone 4: Sound Clustering & Cluster Review UI — **COMPLETE** (on `milestone-4/clustering`)
- Milestone 5: Instrument Assignment & Sample Library — **COMPLETE** (on `milestone-5/instrument-assignment`)
  - 4 audio/playback files, 2 UI components + CSS, types, script, 18 WAV samples
  - Extended clusterStore with assignment state, refactored useClusterPlayback to use PlaybackEngine
  - 377 tests passing (35 test files), 0 lint errors, production build succeeds (74KB app)

---

## Key Implementation Details (M5)

### Instrument Assignment Flow
```
Clusters loaded (from M4 pipeline)
  → suggestInstruments(clusters) computes weighted Euclidean distances
  → setDefaultSuggestions() populates store (only unassigned)
  → PlaybackEngine.getInstance().init() loads 18 WAV samples
  → User sees InstrumentChips on each ClusterCard (quick picks: Kick, Snare, HH, Tom)
  → Tap chip → assignInstrument(clusterId, instrumentId)
  → Tap "More" → SampleBrowser modal (grouped by category, 3-col grid)
  → Tap "Skip" → skipCluster(clusterId), card dims
  → Continue button enabled when hasAnyAssignment() === true
  → On continue: auto-assign unassigned clusters with smart defaults → navigate('/timeline')
```

### PlaybackEngine Singleton
- Single AudioContext (avoids iOS Safari 1-context limit)
- Fetches + decodes all 18 WAV files from `public/samples/{category}/{id}.wav`
- `playSample(id)` for instrument preview, `playBuffer(Float32Array)` for cluster snippet playback
- `useClusterPlayback` refactored to delegate to PlaybackEngine

### Smart Defaults Algorithm
- 5 idealized profiles: kick, snare, hihat, tom, percussion (7-dim feature vectors)
- Weights: centroid=3, rms=2, zcr=2, attack=1.5, others=1
- Greedy assignment: best cluster-category pair first, no duplicates for ≤5 clusters
- Edge cases: 0→empty, 1→kick, 2→lowest centroid=kick/highest=hihat, >5→allow duplicates

### Files Created (M5)
**Audio** (`src/audio/playback/`): sampleManifest.ts, formatDetection.ts, smartDefaults.ts, PlaybackEngine.ts
**Types**: `src/types/instrument.ts`
**UI**: InstrumentChips.tsx + CSS, SampleBrowser.tsx + CSS
**Scripts**: `scripts/generate-samples.ts`
**Samples**: 18 WAV files in `public/samples/` (448KB total)

### Files Modified (M5)
- `src/state/clusterStore.ts` — instrumentAssignments + 4 new actions
- `src/hooks/useClusterPlayback.ts` — delegates to PlaybackEngine
- `src/components/clustering/ClusterCard.tsx` — instrument chips, badge, muted state
- `src/components/clustering/ClusterScreen.tsx` — smart defaults, SampleBrowser, duplicate detection
- `src/components/clustering/ActionBar.tsx` — canContinue gate
- `src/components/shared/Icon.tsx` — +3 icons (chevron-down, volume-x, check)

---

## Next Actions

1. **Browser verification of M5** — cluster → assign instruments → skip → continue
2. **Milestone 6: Quantization Engine** — BPM detection, grid snap, strength slider
3. **Milestone 7: Timeline & Playback** — DAW-style timeline, lookahead-scheduled playback

---

## Context Notes

- 6 parallel agents for M5 implementation + 1 Test agent. Most efficient yet.
- `string | 'skip'` is redundant for eslint — use `string` type, document 'skip' as convention
- CSS module template literals trigger `restrict-template-expressions` — use `[a, b].join(' ')`
- Split/merge clears all instrumentAssignments (IDs remapped) — re-suggest on next render
- Smart defaults fire via useEffect on clusters change — no user action needed
- PlaybackEngine init is async (fetches samples) but non-blocking — assignment works even if samples haven't loaded
