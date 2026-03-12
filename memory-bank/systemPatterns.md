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
| `timelineStore` | Quantized hits, playback position | `hits[]`, `config: QuantizationConfig`, `isPlaying`, `numBars` |
| `sessionStore` | Saved sessions, active session | `sessions[]`, `activeSessionId`, persistence |

**Middleware**: `persistMiddleware` (IndexedDB via idb-keyval), `devtoolsMiddleware` (Redux DevTools integration). Subscriptions with selectors prevent unnecessary re-renders during high-frequency audio updates.

## Audio Processing Patterns

### Onset Detection
- **Method**: Spectral flux with adaptive threshold (running median * multiplier)
- **FFT**: 2048-point with 1024-sample hop (23.2ms resolution at 44.1kHz), Hann window
- **Threshold**: `max(FLOOR=0.001, median(last 10 flux values) * MULTIPLIER)`, default multiplier=2.0
- **Cooldown**: 50ms minimum inter-onset gap (supports up to 20 taps/sec)
- **Output**: `OnsetEvent { timestamp, strength (flux/threshold), audioSnippet (Transferable) }`

### Feature Extraction
- **Per-hit vector** (13 dimensions): spectral centroid, spectral rolloff, ZCR, RMS energy, attack time, decay time, MFCC[0..6]
- **Normalization**: Z-score (mean/stddev per dimension across session); robust to outliers
- **Snippet window**: 10ms pre-onset + 200ms post-onset (~9,261 samples at 44.1kHz)

### Clustering
- **Algorithm**: K-means++ initialization, Lloyd's iteration (max 100 iters, convergence threshold 0.001)
- **Auto-K**: Test K=2..min(8, floor(M/3)) with 5 restarts each; select K with best silhouette score
- **Fallback**: If best silhouette < 0.25, return K=1 (single sound type)
- **Distance**: Euclidean on z-score normalized vectors
- **Semi-supervised re-clustering**: User corrections pin assignments; constrained k-means for remaining points

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

**Audio graph**: Per-hit `AudioBufferSourceNode -> GainNode(velocity)` -> per-track `StereoPannerNode -> GainNode(volume)` -> `MasterGainNode -> AudioDestination`

**Sample loading**: OGG primary, MP3 fallback (Safari). Deduped concurrent loads. In-memory `AudioBuffer` cache.

## Rendering Pattern

**Timeline**: Canvas 2D at 60fps via `requestAnimationFrame`. Grid lines + hit markers drawn on quantized positions. Zoom (pixels/sec) and scroll (offset in seconds) controlled by `timelineStore`.

## Storage Pattern

**IndexedDB** with two object stores:
- `session-meta`: Lightweight `SessionMeta` objects for fast listing
- `session-data`: Full `Session` objects (loaded on demand)

Audio snippets stored as `Float32Array` blobs. Raw recording optionally stored as WAV-encoded `Blob` for export. Session format versioned for forward-compatible migration.

**Zustand persistence**: `idb-keyval` middleware for serializable state slices. Non-serializable refs (`_audioContext`, `_playbackEngine`) excluded from persistence.

## Undo/Redo Pattern

**Snapshot-based** with max depth of 50:
- Before each destructive edit: `structuredClone` of hits, clusters, tracks, quantization config pushed to undo stack
- Audio snippets NOT copied (immutable after creation)
- New action clears redo stack
- `undo()`: push current state to redo, restore from undo stack
- `redo()`: push current state to undo, restore from redo stack

## App State Machine

```
EMPTY -> [new/load session] -> READY -> [start recording] -> RECORDING
  -> [stop] -> ANALYZING (feature extraction + clustering, <2s)
  -> [complete] -> MAPPING (assign instruments)
  -> [done/skip] -> EDITING (timeline, quantization, playback)
  -> [close/new] -> EMPTY
```
