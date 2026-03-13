# System Patterns

## Architecture Overview

TapBeats is a **client-only SPA** with no backend. All audio processing, analysis, and playback run entirely in-browser via Web Audio API and standard Web Platform APIs. The system follows a **unidirectional data pipeline** with a reactive state layer (Zustand).

Six primary subsystems: UI Layer (React + Canvas), State Manager (Zustand), Storage (IndexedDB), Audio Capture, Audio Analysis/Clustering, and Playback Engine.

## Audio Pipeline Pattern

End-to-end data flow from mic to speakers:

```
Microphone (MediaStream, mono, 44.1kHz preferred)
  -> AudioContext
  -> AudioWorkletNode ("tap-processor")
     - Ring buffer (Float32Array, circular, last 10s)
     - FFT (radix-2 Cooley-Tukey, Hann window)
     - Spectral flux onset detection
     - Posts onset events + audio snippets via MessagePort (Transferable)
  -> Main Thread: onset collection, feature extraction
  -> Clustering (k-means++ with auto-K via silhouette)
  -> User maps clusters to instrument samples
  -> Quantization (BPM detection + grid snap)
  -> Playback Engine (lookahead-scheduled AudioBufferSourceNodes)
  -> AudioDestinationNode (speakers)
```

## Threading Model

| Thread | Responsibilities |
|--------|-----------------|
| **Main Thread** | React UI, Canvas timeline (60fps), state management, clustering, quantization, playback scheduling |
| **AudioWorklet Thread** | Real-time PCM capture, ring buffer writes, FFT, spectral flux onset detection, hit event posting |

No Web Worker needed for v1 -- clustering is fast enough on main thread (<200ms for 500 hits).

## Communication Patterns

- **AudioWorklet <-> Main**: `MessagePort` with `Transferable` objects (ArrayBuffer transfer, zero-copy)
- **SharedArrayBuffer**: Available for ring buffers (requires COOP/COEP headers); `MessagePort` is the primary channel
- **Microphone constraints**: `echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false` -- preserves raw signal for DSP

## State Management Pattern

Five independent **Zustand store slices**, each created with `create()`. No combined global store; cross-store reads via direct imports.

| Store | Purpose | Key State |
|-------|---------|-----------|
| `appStore` | Navigation, permissions, errors | `currentScreen`, `micPermission`, `audioContextResumed` |
| `recordingStore` | Active recording lifecycle | `status` (idle/countdown/recording/processing), `onsets[]`, `elapsedSeconds` |
| `clusterStore` | Cluster results and assignments | `result: ClusterResult`, `sampleAssignments`, `clusterLabels` |
| `timelineStore` | Track controls, zoom/scroll, undo/redo | `trackConfigs[]`, `masterVolume`, `pixelsPerSecond`, `scrollOffsetSeconds`, `undoStack`, `redoStack` |
| `sessionStore` | Saved sessions, active session | `sessions[]`, `activeSessionId`, persistence |

**Middleware**: `persistMiddleware` (IndexedDB via idb-keyval), `devtoolsMiddleware` (Redux DevTools integration). Subscriptions with selectors prevent unnecessary re-renders during high-frequency audio updates.

## Audio Processing Patterns

### Onset Detection (implemented in M3)
- **Method**: Spectral flux with adaptive threshold + RMS energy gate (dual gating)
- **FFT**: 1024-point with 256-sample hop (~5.8ms resolution at 44.1kHz), Hann window
- **Gating** (all must be true):
  1. `flux > adaptiveThreshold` (running median of last N flux values × multiplier)
  2. `flux > 0.5` (absolute flux floor — ambient noise regularly produces 0.3-0.7)
  3. `rmsEnergy > 0.01` (amplitude energy gate — rejects quiet ambient noise)
  4. `timeSinceLastOnset >= minInterOnsetMs` (cooldown)
- **Sensitivity presets**: high (window=8, mult=1.2, gap=30ms), medium (window=10, mult=1.5, gap=50ms), low (window=15, mult=2.0, gap=80ms)
- **Output**: `OnsetEvent { timestamp, strength (flux/threshold), snippetBuffer (Transferable Float32Array) }`
- **Worklet**: `tap-processor.js` — all detection runs on audio thread, posts onset + buffer + amplitude messages
- **Key learning**: Spectral flux alone is insufficient — ambient mic noise has high spectral variation between frames. RMS energy gate is essential for noise rejection.

### Feature Extraction (implemented in M3)
- **Per-hit vector** (12 dimensions): RMS, spectral centroid, spectral rolloff, spectral flatness, ZCR, attack time, decay time, MFCC[0..4]
- **Normalization**: Z-score (mean/stddev per dimension across session) applied post-recording
- **Snippet window**: 10ms pre-onset + 200ms post-onset (441 + 8820 = 9,261 samples at 44.1kHz)
- **Processing**: Synchronous in useEffect when status='processing', wrapped in try/catch for reliability
- **BPM estimation**: Median of inter-onset intervals from last 16 onsets, outlier rejection (>2× median), clamped to [40, 240]

### Clustering (implemented in M4)
- **Algorithm**: K-means++ initialization, Lloyd's iteration (max 100 iters, tolerance 1e-6)
- **Dead centroid handling**: Reinitialize to farthest point from nearest centroid
- **Normalization**: Min-max to [0,1] on full 12-dim vectors (complements Z-score from M3)
- **Auto-K**: Test k=2..min(8, floor(n/3)) with 3 restarts each; select k with best silhouette score
- **Fallback**: If best silhouette < 0.25, return k=1 (single sound type)
- **Edge cases**: ≤1 hits → k=1 trivially, <5 hits → cap maxK=2, variance < 0.01 → k=1, >500 hits → subsample 200 for k-selection, >12 clusters → auto-merge closest centroids
- **Distance**: Euclidean on min-max normalized vectors
- **Split/merge operations**: Split runs k=2 on cluster's points (with min-max renormalization), merge reassigns all points, both remap to contiguous IDs
- **Architecture**: All clustering functions are pure (no store access, no side effects). Accept optional `rng: () => number` for deterministic testing.
- **Pipeline entry**: `runClustering(hits: DetectedHit[]) → ClusteringOutput` called from `useProcessing.ts` after feature extraction
- **Store**: `clusterStore` (Zustand) — `setClustering`, `splitCluster`, `mergeClusters`, `reset`. Split/merge actions read hits from `recordingStore` for representative hit selection.

### Instrument Assignment (implemented in M5)
- **Sample manifest**: Compile-time constant `SAMPLE_MANIFEST` (18 instruments, 5 categories) — no JSON fetch
- **PlaybackEngine**: Singleton class, lazy AudioContext init on first user gesture, fetches/decodes all WAV samples from `public/samples/{category}/{id}.wav`
- **Smart defaults**: Pure function `suggestInstruments(clusters)` — weighted Euclidean distance from cluster centroids (first 7 features) to idealized profiles (kick, snare, hihat, tom, percussion)
  - Weights: centroid=3, rms=2, zcr=2, attack=1.5, others=1
  - Greedy assignment: best cluster-category pair first, no duplicate categories for ≤5 clusters, allow duplicates for >5
  - Edge cases: 0→empty, 1→kick, 2→lowest centroid=kick/highest=hihat
- **State**: `instrumentAssignments: Record<number, string>` in clusterStore — values are instrument IDs or `'skip'`
- **Split/merge behavior**: Clears all assignments (IDs remap to contiguous), UI re-triggers `setDefaultSuggestions`
- **UI**: InstrumentChips (quick-pick radiogroup) + SampleBrowser (modal, grouped by category, 3-col grid)
- **Color switching**: When instrument assigned, ClusterCard's `--cluster-color` switches from cluster-based to instrument-based via `getInstrumentColor()`

### Quantization
- **BPM detection**: IOI histogram with subdivision voting (n=1..4), weighted by 1/n
- **Grid snap**: `quantizedTime = original + (nearestGrid - original) * strength`
- **Collision resolution**: Same grid point + same cluster -> keep louder hit
- **Swing**: Delays odd-indexed subdivisions by `gridInterval * swingAmount`
- **Humanization**: Gaussian timing/velocity jitter (Box-Muller transform)

## Playback Pattern

**Lookahead scheduling** (Chris Wilson pattern):
- `setInterval(25ms)` timer checks for upcoming hits
- Pre-schedules `AudioBufferSourceNode.start(when)` for hits within next 100ms
- Provides 75ms safety margin (3 ticks) against main thread jank
- 50ms head start on play to ensure first notes are pre-scheduled
- Velocity mapped via quadratic curve: `gain = velocity^2`

**Audio graph** (implemented in M7): `AudioBufferSourceNode -> GainNode(velocity) -> GainNode(trackVolume) -> GainNode(masterVolume) -> AudioDestination`. Track gain nodes created on play start, gain values adjusted in real-time via timelineStore subscription. No teardown/recreate during playback.

**Sample loading**: WAV samples bundled in `public/samples/`. PlaybackEngine singleton fetches all on init, decodes to `AudioBuffer` cache. OGG/MP3 format detection stub ready for real samples.

## Rendering Pattern

**Timeline**: Canvas 2D at 60fps via `requestAnimationFrame`. Grid lines + hit markers drawn on quantized positions. Zoom (`pixelsPerSecond`) and scroll (`scrollOffsetSeconds`) controlled by `timelineStore`. Time-to-pixel mapping: `timeToX(t) = (t - scrollOffset) * pixelsPerSecond`. Beat/bar ruler at top (24px). Muted tracks render at 30% opacity. Viewport culling skips offscreen hits. Track headers are DOM elements (not canvas) for accessibility — flex layout alongside canvas.

**Hit Editing**: Hit-testing uses same `timeToX()` mapping as rendering (12px threshold). Drag preview stored in ref (not state) for 60fps. Grid snap via `nearestGridPoint()`. All edits push undo before mutation.

## Storage Pattern

**IndexedDB** with two object stores:
- `session-meta`: Lightweight `SessionMeta` objects for fast listing
- `session-data`: Full `Session` objects (loaded on demand)

Audio snippets stored as `Float32Array` blobs. Raw recording optionally stored as WAV-encoded `Blob` for export. Session format versioned for forward-compatible migration.

**Zustand persistence**: `idb-keyval` middleware for serializable state slices. Non-serializable refs (`_audioContext`, `_playbackEngine`) excluded from persistence.

## Undo/Redo Pattern (implemented in M7)

**Snapshot-based** with max depth of 50, managed by `timelineStore`:
- Before each destructive edit: `structuredClone` of `quantizedHits` + `trackConfigs` pushed to undo stack
- `structuredClone` is fast for flat QuantizedHit objects (~0.1ms for 500 hits)
- New action clears redo stack
- `undo()`: push current state to redo, restore snapshot, write hits back via `quantizationStore.setQuantizedHits()`
- `redo()`: push current state to undo, restore snapshot, write hits back
- Cross-store write-back: timelineStore owns undo stack, writes back to quantizationStore on restore
- Audio snippets NOT copied (immutable after creation)

## App State Machine

```
EMPTY -> [new/load session] -> READY -> [start recording] -> RECORDING
  -> [stop] -> ANALYZING (feature extraction + clustering, <2s)
  -> [complete] -> MAPPING (assign instruments)
  -> [done/skip] -> EDITING (timeline, quantization, playback)
  -> [close/new] -> EMPTY
```
