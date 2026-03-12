# Developer Experience & Project Setup

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Technology Stack Detail](#2-technology-stack-detail)
3. [Key Module Specifications](#3-key-module-specifications)
4. [State Management Architecture](#4-state-management-architecture)
5. [Coding Standards](#5-coding-standards)
6. [Development Workflow](#6-development-workflow)
7. [Dependency Policy](#7-dependency-policy)
8. [Configuration Files](#8-configuration-files)

---

## 1. Project Structure

```
tapbeats/
├── src/
│   ├── components/                # React components
│   │   ├── app/                   # Top-level app shell, routing, layout
│   │   │   ├── App.tsx            # Root component, screen router
│   │   │   ├── AppShell.tsx       # Layout wrapper (header, footer, transitions)
│   │   │   └── ErrorBoundary.tsx  # Global error boundary with recovery UI
│   │   ├── recording/             # Recording screen components
│   │   │   ├── RecordingScreen.tsx        # Main recording view
│   │   │   ├── TapVisualizer.tsx          # Real-time waveform / tap feedback
│   │   │   ├── RecordingControls.tsx      # Start/stop/timer controls
│   │   │   └── OnsetIndicator.tsx         # Visual pulse on detected onset
│   │   ├── clustering/            # Cluster review screen components
│   │   │   ├── ClusterScreen.tsx          # Main cluster assignment view
│   │   │   ├── ClusterCard.tsx            # Single cluster with waveform preview
│   │   │   ├── InstrumentPicker.tsx       # Sample assignment dropdown/grid
│   │   │   └── ClusterPlayback.tsx        # Audition cluster sounds
│   │   ├── timeline/              # Beat timeline / playback screen
│   │   │   ├── TimelineScreen.tsx         # Main timeline view
│   │   │   ├── TimelineGrid.tsx           # Quantized grid with hit markers
│   │   │   ├── PlaybackControls.tsx       # Play/pause/loop/BPM controls
│   │   │   ├── HitMarker.tsx              # Individual hit on the grid
│   │   │   └── BPMSelector.tsx            # Tempo adjustment with tap-to-set
│   │   ├── session/               # Session management components
│   │   │   ├── SessionList.tsx            # Saved sessions browser
│   │   │   ├── SessionCard.tsx            # Session preview card
│   │   │   └── ExportDialog.tsx           # Export options (WAV, JSON)
│   │   └── shared/                # Reusable UI primitives
│   │       ├── Button.tsx
│   │       ├── Slider.tsx
│   │       ├── Modal.tsx
│   │       ├── WaveformDisplay.tsx        # Canvas-based waveform renderer
│   │       ├── LoadingSpinner.tsx
│   │       └── PermissionGate.tsx         # Microphone permission request UI
│   │
│   ├── audio/                     # Audio processing modules (core engine)
│   │   ├── capture/               # Microphone capture and raw audio buffering
│   │   │   ├── AudioCapture.ts            # Main capture class, manages MediaStream
│   │   │   ├── AudioCaptureConfig.ts      # Configuration types
│   │   │   └── captureUtils.ts            # Helpers: permission check, device enum
│   │   ├── analysis/              # Onset detection and feature extraction
│   │   │   ├── OnsetDetector.ts           # Energy-based onset detection
│   │   │   ├── FeatureExtractor.ts        # Spectral centroid, ZCR, MFCC, RMS
│   │   │   ├── FFT.ts                     # Pure-TypeScript radix-2 FFT
│   │   │   └── analysisUtils.ts           # Windowing functions, normalization
│   │   ├── clustering/            # Sound clustering algorithms
│   │   │   ├── SoundClusterer.ts          # K-means on feature vectors
│   │   │   ├── distanceMetrics.ts         # Euclidean, cosine similarity
│   │   │   └── clusterUtils.ts            # Silhouette score, auto-K selection
│   │   ├── quantization/          # Timing quantization engine
│   │   │   ├── QuantizationEngine.ts      # Snap onsets to grid positions
│   │   │   ├── BPMDetector.ts             # Inter-onset interval BPM estimation
│   │   │   └── quantizationUtils.ts       # Grid builders, swing helpers
│   │   └── playback/              # Sample playback engine
│   │       ├── PlaybackEngine.ts          # Scheduled sample playback via AudioContext
│   │       ├── SampleBank.ts              # Load, decode, cache instrument samples
│   │       └── playbackUtils.ts           # Gain normalization, fade helpers
│   │
│   ├── state/                     # Zustand state management
│   │   ├── appStore.ts                    # App-level: current screen, permissions, errors
│   │   ├── recordingStore.ts              # Recording: status, onsets, raw buffers
│   │   ├── clusterStore.ts                # Clusters: groups, instrument assignments
│   │   ├── timelineStore.ts               # Timeline: quantized hits, BPM, playback pos
│   │   ├── sessionStore.ts                # Sessions: saved sessions, active session
│   │   ├── middleware/
│   │   │   ├── persistMiddleware.ts       # IndexedDB persistence via idb-keyval
│   │   │   └── devtoolsMiddleware.ts      # Redux DevTools integration
│   │   └── index.ts                       # Re-exports, store composition helpers
│   │
│   ├── utils/                     # Shared utilities
│   │   ├── id.ts                          # Unique ID generation (nanoid-compatible)
│   │   ├── time.ts                        # Time formatting, conversion helpers
│   │   ├── math.ts                        # Clamp, lerp, statistical helpers
│   │   ├── arrayBuffer.ts                 # Float32Array merge, slice, copy
│   │   ├── platform.ts                    # Browser capability detection
│   │   └── constants.ts                   # App-wide magic numbers, limits
│   │
│   ├── types/                     # TypeScript type definitions
│   │   ├── audio.ts                       # Audio pipeline types (Onset, AudioFeatures)
│   │   ├── clustering.ts                  # Cluster, ClusterResult types
│   │   ├── timeline.ts                    # QuantizedHit, GridPosition types
│   │   ├── session.ts                     # Session, SessionMeta types
│   │   ├── instruments.ts                 # InstrumentCategory, SampleMapping types
│   │   └── global.d.ts                    # Ambient declarations (AudioWorklet, etc.)
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAudioCapture.ts             # Wrap AudioCapture lifecycle
│   │   ├── useOnsetDetection.ts           # Stream onsets during recording
│   │   ├── useClustering.ts               # Trigger clustering, subscribe to results
│   │   ├── usePlayback.ts                 # Playback controls, position tracking
│   │   ├── useAnimationFrame.ts           # requestAnimationFrame wrapper
│   │   ├── useMicrophonePermission.ts     # Permission state management
│   │   └── useMediaQuery.ts              # Responsive breakpoint hook
│   │
│   ├── styles/                    # Global styles and theme tokens
│   │   ├── global.css                     # CSS reset, base typography
│   │   ├── theme.css                      # CSS custom properties (colors, spacing)
│   │   └── animations.css                 # Shared keyframe animations
│   │
│   ├── assets/                    # Static assets bundled by Vite
│   │   ├── samples/                       # Built-in instrument samples (WAV, 16-bit, 44.1kHz)
│   │   │   ├── kick/
│   │   │   ├── snare/
│   │   │   ├── hihat/
│   │   │   ├── tom/
│   │   │   ├── clap/
│   │   │   └── percussion/
│   │   └── icons/                         # SVG icons
│   │
│   ├── main.tsx                   # Entry point: render App, register service worker
│   └── vite-env.d.ts             # Vite client type references
│
├── public/
│   ├── worklets/                  # AudioWorklet processor files (served as-is)
│   │   ├── onset-processor.js             # Real-time onset detection in audio thread
│   │   └── capture-processor.js           # Raw audio ring buffer in audio thread
│   ├── manifest.json              # PWA manifest
│   ├── favicon.svg
│   └── robots.txt
│
├── tests/
│   ├── unit/                      # Unit tests mirroring src/ structure
│   │   ├── audio/
│   │   │   ├── OnsetDetector.test.ts
│   │   │   ├── FeatureExtractor.test.ts
│   │   │   ├── SoundClusterer.test.ts
│   │   │   ├── QuantizationEngine.test.ts
│   │   │   └── PlaybackEngine.test.ts
│   │   ├── state/
│   │   │   ├── recordingStore.test.ts
│   │   │   └── timelineStore.test.ts
│   │   └── utils/
│   │       └── math.test.ts
│   ├── integration/               # Multi-module integration tests
│   │   ├── recordingFlow.test.ts          # Capture -> onset -> features pipeline
│   │   ├── clusteringFlow.test.ts         # Features -> clustering -> assignment
│   │   └── playbackFlow.test.ts           # Quantized hits -> scheduled playback
│   ├── e2e/                       # Playwright end-to-end tests
│   │   ├── recording.spec.ts
│   │   ├── clustering.spec.ts
│   │   ├── playback.spec.ts
│   │   └── session.spec.ts
│   ├── fixtures/                  # Test audio files and mock data
│   │   ├── single-tap.wav                 # Isolated tap sound (44.1kHz, 16-bit)
│   │   ├── multi-tap-sequence.wav         # 8-tap sequence with 3 distinct sounds
│   │   ├── silence.wav                    # 1 second of silence (edge case)
│   │   ├── noisy-taps.wav                 # Taps with background noise
│   │   └── features/                      # Pre-computed feature vectors for snapshot tests
│   │       └── multi-tap-features.json
│   └── helpers/
│       ├── audioMocks.ts                  # AudioContext, MediaStream mocks
│       ├── createTestOnsets.ts            # Factory for Onset test data
│       └── setupTests.ts                  # Global test setup (Web Audio polyfill)
│
├── docs/
│   ├── sections/                  # PRD sections
│   ├── architecture.md            # System architecture diagrams
│   └── audio-pipeline.md          # Detailed audio processing docs
│
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint, typecheck, unit tests, build
│       └── e2e.yml                # Playwright tests on push to main
│
├── index.html                     # Vite HTML entry point
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
└── README.md
```

### Directory Purposes

| Directory | Purpose |
|-----------|---------|
| `src/components/` | All React UI components, organized by screen/feature. Each subdirectory maps to a user-facing view. `shared/` contains reusable primitives with no business logic. |
| `src/audio/` | The core audio engine. Pure TypeScript modules with zero React dependencies. Each subdirectory handles one stage of the audio pipeline: capture, analysis, clustering, quantization, playback. These modules must be testable in isolation without a DOM. |
| `src/audio/capture/` | Manages `MediaStream` acquisition, `AudioWorkletNode` connection, and raw audio buffering. Emits audio chunks for downstream processing. |
| `src/audio/analysis/` | Onset detection (energy thresholding on spectral flux) and feature extraction (spectral centroid, zero-crossing rate, MFCCs, RMS energy). Includes a pure-TypeScript FFT implementation. |
| `src/audio/clustering/` | K-means clustering on normalized feature vectors. Includes distance metrics, automatic K selection via silhouette score, and cluster merging/splitting. |
| `src/audio/quantization/` | Snaps detected onset timestamps to the nearest grid position given a BPM and subdivision. Includes BPM estimation from inter-onset intervals. |
| `src/audio/playback/` | Scheduled sample playback using `AudioBufferSourceNode`. Manages a sample bank, preloading, gain normalization, and loop scheduling with sub-millisecond precision. |
| `src/state/` | Zustand store slices. Each file exports a single store. Middleware subdirectory contains IndexedDB persistence and Redux DevTools integration. |
| `src/types/` | Shared TypeScript type definitions. Imported by both `audio/` and `components/`. No runtime code, only types and interfaces. |
| `src/hooks/` | Custom React hooks that bridge audio modules and React component lifecycle. Handle setup/teardown, subscription to audio events, and reactive state updates. |
| `src/utils/` | Pure utility functions with no side effects. Math helpers, array buffer operations, platform detection. |
| `src/styles/` | Global CSS. No CSS modules or CSS-in-JS; components use CSS custom properties defined in `theme.css`. |
| `src/assets/samples/` | Built-in instrument samples. WAV format, 16-bit, 44.1kHz mono. Organized by instrument category. Each category contains 2-4 variations. |
| `public/worklets/` | AudioWorklet processor scripts. Served as static files because worklets require a separate JS file URL. These run on the audio rendering thread and must not import from `src/`. |
| `tests/unit/` | Unit tests mirror `src/` structure. Each module file has a corresponding `.test.ts`. |
| `tests/integration/` | Tests that exercise multi-module pipelines (e.g., capture through clustering). Use real audio fixtures, not mocks. |
| `tests/e2e/` | Playwright browser tests. Simulate full user flows including microphone permission grants, tapping, and playback. |
| `tests/fixtures/` | WAV files and pre-computed data for deterministic test assertions. |

---

## 2. Technology Stack Detail

### Core Runtime

| Technology | Version | Justification |
|-----------|---------|---------------|
| **React** | 18.3+ | Concurrent rendering enables non-blocking UI updates during audio processing. `useSyncExternalStore` provides tear-free reads from Zustand stores. Suspense boundaries allow lazy-loading the sample bank without blocking the recording screen. |
| **TypeScript** | 5.4+ | Strict mode (`strict: true`) catches null reference bugs in audio buffer handling. Template literal types enforce valid instrument category strings. `satisfies` operator validates configuration objects at compile time. |
| **Vite** | 5.x | Sub-100ms HMR for rapid UI iteration. Native ESM means no bundling during development. Built-in support for serving `public/worklets/` as static files, which is required for `AudioWorklet.addModule()`. The `vite-plugin-static-copy` pattern is not needed: Vite serves `public/` as-is. |

### State Management

| Technology | Version | Justification |
|-----------|---------|---------------|
| **Zustand** | 4.5+ | Minimal API surface (no providers, no reducers, no action types). Subscriptions with selectors prevent unnecessary re-renders during high-frequency audio state updates. Middleware system supports IndexedDB persistence and DevTools without wrapper complexity. Roughly 1KB gzipped. |

### Testing

| Technology | Version | Justification |
|-----------|---------|---------------|
| **Vitest** | 1.x | Shares Vite's transform pipeline, so TypeScript and ESM work identically in tests and app code. `vi.fn()` and `vi.mock()` for Web Audio API mocking. Built-in coverage via `@vitest/coverage-v8`. Runs unit tests in under 2 seconds for the expected module count. |
| **Playwright** | 1.42+ | Cross-browser E2E testing (Chromium, Firefox, WebKit). Supports `navigator.mediaDevices.getUserMedia` mocking via `browserContext.grantPermissions()`. Can inject synthetic audio streams for deterministic tap testing. |

### Code Quality

| Technology | Version | Justification |
|-----------|---------|---------------|
| **ESLint** | 8.x | With `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` for type-aware linting. `eslint-plugin-react-hooks` enforces rules of hooks. Custom rule configuration for audio-specific patterns (no `any` in audio pipeline). |
| **Prettier** | 3.x | Automated formatting eliminates style debates. Configured for consistency with single quotes, trailing commas, and 100-character line width to accommodate audio processing code. |
| **Husky** | 9.x | Git hooks manager. Runs `lint-staged` on pre-commit. |
| **lint-staged** | 15.x | Runs ESLint fix and Prettier on staged files only. Keeps commits fast even as the codebase grows. |

### CI/CD

| Technology | Justification |
|-----------|---------------|
| **GitHub Actions** | Runs on every push and PR. Two workflows: `ci.yml` (lint, typecheck, unit/integration tests, production build) and `e2e.yml` (Playwright against production build). Caches `node_modules` and Playwright browsers. |

---

## 3. Key Module Specifications

### 3a. AudioCapture

```typescript
// src/audio/capture/AudioCaptureConfig.ts

/** Configuration for microphone audio capture. */
export interface AudioCaptureConfig {
  /** Target sample rate in Hz. Defaults to 44100. */
  sampleRate: number;

  /** Size of each audio processing buffer in samples. Must be a power of 2.
   *  Smaller values reduce latency but increase CPU overhead.
   *  Defaults to 2048. */
  bufferSize: 256 | 512 | 1024 | 2048 | 4096;

  /** Number of audio channels. TapBeats uses mono (1). Defaults to 1. */
  channelCount: 1;

  /** Whether to apply automatic gain control. Defaults to false.
   *  Disabled because AGC interferes with energy-based onset detection. */
  autoGainControl: boolean;

  /** Whether to apply noise suppression. Defaults to false.
   *  Disabled because it can suppress percussive transients. */
  noiseSuppression: boolean;

  /** Whether to apply echo cancellation. Defaults to false. */
  echoCancellation: boolean;
}

/** Default capture configuration optimized for percussive onset detection. */
export const DEFAULT_CAPTURE_CONFIG: AudioCaptureConfig = {
  sampleRate: 44100,
  bufferSize: 2048,
  channelCount: 1,
  autoGainControl: false,
  noiseSuppression: false,
  echoCancellation: false,
};
```

```typescript
// src/audio/capture/AudioCapture.ts

import type { AudioCaptureConfig } from './AudioCaptureConfig';

/** Events emitted by AudioCapture. */
export interface AudioCaptureEvents {
  /** Fired when a new buffer of audio samples is available.
   *  @param buffer - Mono audio samples in the range [-1.0, 1.0]. */
  onBuffer: (buffer: Float32Array) => void;

  /** Fired when capture starts successfully. */
  onStart: () => void;

  /** Fired when capture stops (user-initiated or error). */
  onStop: () => void;

  /** Fired on unrecoverable errors (permission denied, device lost).
   *  @param error - The underlying error. */
  onError: (error: AudioCaptureError) => void;
}

/** Structured error for audio capture failures. */
export interface AudioCaptureError {
  /** Machine-readable error code. */
  code:
    | 'PERMISSION_DENIED'
    | 'DEVICE_NOT_FOUND'
    | 'DEVICE_LOST'
    | 'WORKLET_LOAD_FAILED'
    | 'UNKNOWN';

  /** Human-readable description. */
  message: string;

  /** The original Error, if available. */
  cause?: Error;
}

/** Current state of the audio capture pipeline. */
export type AudioCaptureState = 'idle' | 'requesting_permission' | 'active' | 'error';

/**
 * Manages microphone audio capture via the Web Audio API.
 *
 * Uses an AudioWorklet for low-latency, glitch-free audio buffering on the
 * audio rendering thread. Falls back to ScriptProcessorNode if AudioWorklet
 * is unavailable (logged as a warning; onset detection accuracy may degrade).
 *
 * Lifecycle:
 *   1. `start()` - Request mic permission, create AudioContext, connect worklet.
 *   2. Buffers flow via `onBuffer` callback.
 *   3. `stop()` - Disconnect nodes, close stream, release mic.
 *
 * @example
 * ```ts
 * const capture = new AudioCapture();
 * capture.on('onBuffer', (buffer) => onsetDetector.process(buffer));
 * capture.on('onError', (err) => console.error(err.code, err.message));
 * await capture.start();
 * // ... user taps ...
 * capture.stop();
 * ```
 */
export class AudioCapture {
  /** Subscribe to a capture event. */
  on<K extends keyof AudioCaptureEvents>(event: K, handler: AudioCaptureEvents[K]): void;

  /** Unsubscribe from a capture event. */
  off<K extends keyof AudioCaptureEvents>(event: K, handler: AudioCaptureEvents[K]): void;

  /** Current capture state. */
  get state(): AudioCaptureState;

  /** The AudioContext instance. Null until `start()` is called. */
  get audioContext(): AudioContext | null;

  /**
   * Begin audio capture.
   *
   * Requests microphone permission if not already granted,
   * creates an AudioContext, loads the capture AudioWorklet,
   * and begins streaming audio buffers.
   *
   * @param config - Optional configuration overrides.
   * @throws {AudioCaptureError} On permission denial or device failure.
   */
  start(config?: Partial<AudioCaptureConfig>): Promise<void>;

  /**
   * Stop audio capture and release all resources.
   *
   * Disconnects audio nodes, stops the MediaStream tracks,
   * and closes the AudioContext. Safe to call multiple times.
   */
  stop(): void;

  /**
   * Check whether the browser supports AudioWorklet.
   * Used to decide between AudioWorklet and ScriptProcessorNode fallback.
   */
  static supportsAudioWorklet(): boolean;

  /**
   * Enumerate available audio input devices.
   * Requires microphone permission to return labeled devices.
   */
  static enumerateInputDevices(): Promise<MediaDeviceInfo[]>;
}
```

### 3b. OnsetDetector

```typescript
// src/audio/analysis/OnsetDetector.ts

/** Configuration for onset detection. */
export interface OnsetDetectorConfig {
  /** Sample rate of incoming audio in Hz. Must match AudioCapture. Defaults to 44100. */
  sampleRate: number;

  /** FFT size for spectral flux computation. Must be a power of 2. Defaults to 1024. */
  fftSize: 256 | 512 | 1024 | 2048;

  /** Hop size in samples between successive FFT frames. Defaults to fftSize / 2. */
  hopSize: number;

  /** Adaptive threshold multiplier above the moving median of spectral flux.
   *  Higher values reduce false positives but may miss soft taps.
   *  Range: [1.0, 10.0]. Defaults to 3.0. */
  thresholdMultiplier: number;

  /** Number of past spectral flux frames for the moving median window.
   *  Defaults to 10. */
  medianWindowSize: number;

  /** Minimum time in milliseconds between consecutive onsets.
   *  Prevents double-triggers from a single tap.
   *  Defaults to 50. */
  minimumInterOnsetMs: number;

  /** Number of samples to capture before the onset point for the onset buffer.
   *  Provides attack transient context. Defaults to 512. */
  preOnsetSamples: number;

  /** Number of samples to capture after the onset point for the onset buffer.
   *  Captures the body/decay of the tap. Defaults to 4096. */
  postOnsetSamples: number;
}

/** Default onset detector configuration for percussive surface taps. */
export const DEFAULT_ONSET_CONFIG: OnsetDetectorConfig = {
  sampleRate: 44100,
  fftSize: 1024,
  hopSize: 512,
  thresholdMultiplier: 3.0,
  medianWindowSize: 10,
  minimumInterOnsetMs: 50,
  preOnsetSamples: 512,
  postOnsetSamples: 4096,
};

/** A single detected onset event. */
export interface Onset {
  /** Unique identifier for this onset. */
  id: string;

  /** Timestamp in seconds relative to the start of recording. */
  timestamp: number;

  /** Spectral flux energy at the onset frame.
   *  Higher values indicate louder/sharper transients.
   *  Not normalized; useful for relative comparison within a session. */
  energy: number;

  /** Audio samples surrounding the onset point.
   *  Length = preOnsetSamples + postOnsetSamples.
   *  Used for feature extraction and waveform display. */
  buffer: Float32Array;
}

/** Events emitted by the OnsetDetector. */
export interface OnsetDetectorEvents {
  /** Fired when a new onset is detected.
   *  @param onset - The detected onset with timestamp, energy, and audio buffer. */
  onOnset: (onset: Onset) => void;

  /** Fired with the current spectral flux value for visualization.
   *  Useful for debugging threshold tuning.
   *  @param flux - Current spectral flux value.
   *  @param threshold - Current adaptive threshold value. */
  onFlux: (flux: number, threshold: number) => void;
}

/**
 * Detects percussive onsets in a real-time audio stream using spectral flux.
 *
 * Algorithm:
 *   1. Compute FFT magnitude spectrum for each hop.
 *   2. Calculate spectral flux (sum of positive magnitude differences).
 *   3. Maintain a moving median of flux values as adaptive threshold.
 *   4. Onset = flux exceeds median * thresholdMultiplier, subject to minimum
 *      inter-onset gap.
 *   5. Extract audio buffer around onset point for downstream feature extraction.
 *
 * Feed audio buffers from AudioCapture via `process()`. The detector maintains
 * internal state (ring buffer, previous spectrum) across calls.
 *
 * @example
 * ```ts
 * const detector = new OnsetDetector({ thresholdMultiplier: 2.5 });
 * detector.on('onOnset', (onset) => {
 *   recordingStore.getState().addOnset(onset);
 * });
 * capture.on('onBuffer', (buffer) => detector.process(buffer));
 * ```
 */
export class OnsetDetector {
  constructor(config?: Partial<OnsetDetectorConfig>);

  /** Subscribe to detector events. */
  on<K extends keyof OnsetDetectorEvents>(event: K, handler: OnsetDetectorEvents[K]): void;

  /** Unsubscribe from detector events. */
  off<K extends keyof OnsetDetectorEvents>(event: K, handler: OnsetDetectorEvents[K]): void;

  /**
   * Process a buffer of audio samples.
   * Call this with each buffer received from AudioCapture.
   * May emit zero or more `onOnset` events per call.
   *
   * @param buffer - Mono audio samples, [-1.0, 1.0].
   */
  process(buffer: Float32Array): void;

  /**
   * Reset internal state (ring buffer, previous spectrum, median window).
   * Call between recording sessions.
   */
  reset(): void;

  /**
   * Update detection sensitivity at runtime without resetting state.
   */
  updateConfig(
    config: Partial<Pick<OnsetDetectorConfig, 'thresholdMultiplier' | 'minimumInterOnsetMs'>>,
  ): void;

  /** Total number of onsets detected since last reset. */
  get onsetCount(): number;
}
```

### 3c. FeatureExtractor

```typescript
// src/audio/analysis/FeatureExtractor.ts

/** Audio features extracted from an onset's audio buffer. */
export interface AudioFeatures {
  /** Onset ID this feature set belongs to. */
  onsetId: string;

  /** Spectral centroid in Hz. Indicates the "brightness" of the sound.
   *  Higher values = brighter/sharper. Typical range: 500-8000 Hz. */
  spectralCentroid: number;

  /** Spectral flatness in range [0, 1].
   *  0 = tonal/harmonic, 1 = noise-like. Percussive taps are typically 0.3-0.8. */
  spectralFlatness: number;

  /** Spectral rolloff frequency in Hz.
   *  The frequency below which 85% of spectral energy is concentrated. */
  spectralRolloff: number;

  /** Zero-crossing rate (crossings per sample).
   *  Higher values indicate noisier/brighter sounds. Range: [0, 0.5]. */
  zeroCrossingRate: number;

  /** Root mean square energy (linear scale).
   *  Indicates overall loudness of the onset. */
  rmsEnergy: number;

  /** Mel-frequency cepstral coefficients (13 coefficients).
   *  Compact representation of spectral shape. Primary features for clustering. */
  mfcc: Float64Array;

  /** Attack time in milliseconds.
   *  Time from onset to peak amplitude. Shorter = sharper transient. */
  attackTimeMs: number;

  /** Temporal centroid in milliseconds relative to onset.
   *  Indicates where the energy is concentrated in time.
   *  Early = sharp attack, late = sustained/reverberant. */
  temporalCentroid: number;
}

/** Configuration for feature extraction. */
export interface FeatureExtractorConfig {
  /** Sample rate of the audio data. Defaults to 44100. */
  sampleRate: number;

  /** FFT size for spectral feature computation. Defaults to 2048. */
  fftSize: 1024 | 2048 | 4096;

  /** Number of MFCC coefficients to compute. Defaults to 13. */
  numMfcc: number;

  /** Number of mel filter banks. Defaults to 26. */
  numMelBands: number;

  /** Minimum frequency for mel filter bank in Hz. Defaults to 20. */
  melMinFreq: number;

  /** Maximum frequency for mel filter bank in Hz. Defaults to 20000. */
  melMaxFreq: number;

  /** Spectral rolloff percentile (0-1). Defaults to 0.85. */
  rolloffPercentile: number;
}

/** Default feature extraction configuration. */
export const DEFAULT_FEATURE_CONFIG: FeatureExtractorConfig = {
  sampleRate: 44100,
  fftSize: 2048,
  numMfcc: 13,
  numMelBands: 26,
  melMinFreq: 20,
  melMaxFreq: 20000,
  rolloffPercentile: 0.85,
};

/**
 * Extracts audio features from onset buffers for sound clustering.
 *
 * Computes a set of spectral and temporal features that characterize the
 * timbral quality of each tap. These features form the input vectors for
 * the SoundClusterer.
 *
 * Feature extraction is performed on the main thread. For a typical session
 * (20-50 onsets), extraction completes in under 50ms total.
 *
 * @example
 * ```ts
 * const extractor = new FeatureExtractor();
 * const features = extractor.extract(onset.id, onset.buffer);
 * // features.mfcc, features.spectralCentroid, etc.
 * ```
 */
export class FeatureExtractor {
  constructor(config?: Partial<FeatureExtractorConfig>);

  /**
   * Extract features from an onset audio buffer.
   *
   * @param onsetId - The ID of the onset this buffer belongs to.
   * @param buffer - Audio samples surrounding the onset. Mono, [-1.0, 1.0].
   * @returns Extracted audio features.
   */
  extract(onsetId: string, buffer: Float32Array): AudioFeatures;

  /**
   * Extract features from multiple onsets in batch.
   * More efficient than repeated `extract()` calls due to FFT plan reuse.
   *
   * @param onsets - Array of onset objects.
   * @returns Array of features in the same order as input onsets.
   */
  extractBatch(onsets: ReadonlyArray<{ id: string; buffer: Float32Array }>): AudioFeatures[];

  /**
   * Convert AudioFeatures to a normalized feature vector for clustering.
   * Applies z-score normalization across the provided feature set.
   *
   * @param features - Array of features from a recording session.
   * @returns Array of normalized vectors, each of length getVectorLength().
   */
  toNormalizedVectors(features: AudioFeatures[]): Float64Array[];

  /**
   * Length of the feature vector produced by toNormalizedVectors.
   * Currently: 13 (MFCC) + 5 (spectral centroid, flatness, rolloff, ZCR, RMS)
   *            + 2 (attack time, temporal centroid) = 20.
   */
  getVectorLength(): number;
}
```

### 3d. SoundClusterer

```typescript
// src/audio/clustering/SoundClusterer.ts

/** Configuration for sound clustering. */
export interface SoundClustererConfig {
  /** Maximum number of clusters to consider.
   *  Auto-K selection will test K=2 through maxClusters.
   *  Defaults to 8. */
  maxClusters: number;

  /** Minimum number of clusters. Defaults to 2. */
  minClusters: number;

  /** Maximum K-means iterations before convergence timeout. Defaults to 100. */
  maxIterations: number;

  /** Convergence threshold. K-means stops when centroid movement is below
   *  this value. Defaults to 0.001. */
  convergenceThreshold: number;

  /** Number of K-means restarts with different random seeds.
   *  Best result (lowest inertia) is selected. Defaults to 5. */
  numRestarts: number;

  /** Distance metric for comparing feature vectors. Defaults to 'euclidean'. */
  distanceMetric: 'euclidean' | 'cosine';

  /** Random seed for reproducible clustering. Undefined = non-deterministic.
   *  Set in tests for deterministic assertions. */
  seed?: number;
}

/** Default clustering configuration. */
export const DEFAULT_CLUSTER_CONFIG: SoundClustererConfig = {
  maxClusters: 8,
  minClusters: 2,
  maxIterations: 100,
  convergenceThreshold: 0.001,
  numRestarts: 5,
  distanceMetric: 'euclidean',
  seed: undefined,
};

/** A single cluster of similar-sounding onsets. */
export interface Cluster {
  /** Unique identifier for this cluster. */
  id: string;

  /** Human-readable label. Initially auto-generated ("Group A", "Group B").
   *  User may rename during instrument assignment. */
  label: string;

  /** Centroid of the cluster in feature space.
   *  Used for distance calculations and nearest-cluster assignment. */
  centroid: Float64Array;

  /** IDs of onsets assigned to this cluster. */
  onsetIds: string[];

  /** Average distance of members to centroid. Lower = tighter cluster. */
  avgIntraDistance: number;

  /** Assigned instrument sample ID, or null if not yet assigned. */
  assignedSampleId: string | null;

  /** Display color for UI differentiation (CSS hex string). */
  color: string;
}

/** Complete result of a clustering operation. */
export interface ClusterResult {
  /** The determined clusters. */
  clusters: Cluster[];

  /** Number of clusters selected (K). */
  k: number;

  /** Silhouette score for the selected K. Range [-1, 1]. Higher is better.
   *  Values above 0.5 indicate well-separated clusters. */
  silhouetteScore: number;

  /** Silhouette scores for each tested K value, for visualization.
   *  Key = K, value = silhouette score. */
  silhouetteScores: Map<number, number>;

  /** Total K-means inertia (sum of squared distances to centroids). */
  inertia: number;

  /** Map from onset ID to cluster ID for fast lookup. */
  assignments: Map<string, string>;

  /** Number of iterations until convergence. */
  iterations: number;

  /** Elapsed time for the clustering operation in milliseconds. */
  durationMs: number;
}

/**
 * Clusters onset sounds by timbral similarity using K-means.
 *
 * Algorithm:
 *   1. Accept normalized feature vectors from FeatureExtractor.
 *   2. Run K-means for K=minClusters..maxClusters, each with numRestarts.
 *   3. Select optimal K using silhouette score.
 *   4. Return clusters with onset assignments.
 *
 * The clusterer is stateless between calls to `cluster()`. Each invocation
 * produces a fresh result from the provided feature vectors.
 *
 * @example
 * ```ts
 * const clusterer = new SoundClusterer();
 * const features = extractor.extractBatch(onsets);
 * const vectors = extractor.toNormalizedVectors(features);
 * const result = clusterer.cluster(
 *   onsets.map((o) => o.id),
 *   vectors,
 * );
 * console.log(`Found ${result.k} distinct sounds (silhouette: ${result.silhouetteScore})`);
 * ```
 */
export class SoundClusterer {
  constructor(config?: Partial<SoundClustererConfig>);

  /**
   * Cluster onset feature vectors.
   *
   * @param onsetIds - Onset IDs corresponding 1:1 with vectors.
   * @param vectors - Normalized feature vectors from FeatureExtractor.toNormalizedVectors().
   * @returns Clustering result with optimal K, cluster assignments, and quality metrics.
   * @throws {Error} If vectors.length < minClusters.
   */
  cluster(onsetIds: string[], vectors: Float64Array[]): ClusterResult;

  /**
   * Run clustering with a specific K (skip auto-K selection).
   * Useful when the user manually adjusts the number of clusters.
   *
   * @param onsetIds - Onset IDs corresponding 1:1 with vectors.
   * @param vectors - Normalized feature vectors.
   * @param k - Desired number of clusters.
   * @returns Clustering result for the specified K.
   * @throws {Error} If k > vectors.length or k < 1.
   */
  clusterWithK(onsetIds: string[], vectors: Float64Array[], k: number): ClusterResult;

  /**
   * Assign a single new onset to the nearest existing cluster.
   * Does not re-run clustering. Uses existing centroids.
   *
   * @param vector - Normalized feature vector of the new onset.
   * @param clusters - Existing clusters with centroids.
   * @returns ID of the nearest cluster.
   */
  assignToNearest(vector: Float64Array, clusters: Cluster[]): string;
}
```

### 3e. QuantizationEngine

```typescript
// src/audio/quantization/QuantizationEngine.ts

/** Subdivision levels for the quantization grid. */
export type Subdivision = 1 | 2 | 4 | 8 | 16;

/** Configuration for timing quantization. */
export interface QuantizationConfig {
  /** Beats per minute. Range: [40, 300]. */
  bpm: number;

  /** Time signature numerator. Defaults to 4 (4/4 time). */
  beatsPerBar: 2 | 3 | 4 | 5 | 6 | 7;

  /** Quantization subdivision.
   *  1 = whole beat, 4 = sixteenth notes, 16 = sixty-fourth notes.
   *  Defaults to 4 (sixteenth notes). */
  subdivision: Subdivision;

  /** Quantization strength in range [0, 1].
   *  0 = no quantization (original timing preserved).
   *  1 = full snap to grid.
   *  Values between apply proportional correction.
   *  Defaults to 1.0. */
  strength: number;

  /** Swing amount in range [0, 1].
   *  0 = straight (even subdivisions).
   *  0.5 = dotted-eighth feel.
   *  1.0 = full triplet swing.
   *  Only affects even-numbered subdivisions.
   *  Defaults to 0. */
  swing: number;

  /** Number of bars to quantize into. If undefined, computed from onset span. */
  numBars?: number;
}

/** Default quantization configuration. */
export const DEFAULT_QUANTIZATION_CONFIG: QuantizationConfig = {
  bpm: 120,
  beatsPerBar: 4,
  subdivision: 4,
  strength: 1.0,
  swing: 0,
};

/** A position on the quantized grid. */
export interface GridPosition {
  /** Bar number (0-indexed). */
  bar: number;

  /** Beat within the bar (0-indexed). */
  beat: number;

  /** Subdivision tick within the beat (0-indexed). */
  tick: number;

  /** Absolute time in seconds. */
  timeSeconds: number;
}

/** A single hit on the quantized timeline. */
export interface QuantizedHit {
  /** Unique ID for this hit. */
  id: string;

  /** ID of the source onset. */
  onsetId: string;

  /** ID of the cluster this onset belongs to. */
  clusterId: string;

  /** Original (unquantized) timestamp in seconds. */
  originalTime: number;

  /** Quantized grid position. */
  gridPosition: GridPosition;

  /** Quantized timestamp in seconds. */
  quantizedTime: number;

  /** Time difference between original and quantized time in seconds.
   *  Positive = pushed later, negative = pulled earlier. */
  offsetSeconds: number;

  /** Velocity in range [0, 1], derived from onset energy. */
  velocity: number;
}

/** Result of a quantization operation. */
export interface QuantizationResult {
  /** Quantized hits, sorted by quantizedTime. */
  hits: QuantizedHit[];

  /** The config used for this quantization. */
  config: QuantizationConfig;

  /** Detected BPM (if auto-detected), or the user-specified BPM. */
  bpm: number;

  /** Total number of bars in the quantized timeline. */
  numBars: number;

  /** Total duration of the timeline in seconds. */
  durationSeconds: number;

  /** Grid points for visualization (all possible positions in the grid). */
  gridPoints: GridPosition[];
}

/**
 * Quantizes onset timestamps to a musical grid.
 *
 * Takes raw onset timestamps and snaps them to the nearest grid position
 * defined by BPM, time signature, and subdivision. Supports variable
 * quantization strength and swing.
 *
 * @example
 * ```ts
 * const engine = new QuantizationEngine();
 * const result = engine.quantize(onsets, clusterAssignments, {
 *   bpm: 95,
 *   subdivision: 4,
 *   strength: 0.85,
 *   swing: 0.2,
 * });
 * console.log(`${result.hits.length} hits across ${result.numBars} bars at ${result.bpm} BPM`);
 * ```
 */
export class QuantizationEngine {
  constructor(config?: Partial<QuantizationConfig>);

  /**
   * Quantize onsets to a grid.
   *
   * @param onsets - Array of detected onsets with timestamps.
   * @param assignments - Map from onset ID to cluster ID.
   * @param config - Optional config overrides.
   * @returns Quantization result with hits and grid.
   */
  quantize(
    onsets: ReadonlyArray<{ id: string; timestamp: number; energy: number }>,
    assignments: Map<string, string>,
    config?: Partial<QuantizationConfig>,
  ): QuantizationResult;

  /**
   * Re-quantize existing hits with updated configuration.
   * Preserves onset associations but recalculates grid positions.
   *
   * @param hits - Previously quantized hits.
   * @param config - New configuration.
   * @returns Updated quantization result.
   */
  requantize(hits: QuantizedHit[], config: Partial<QuantizationConfig>): QuantizationResult;

  /**
   * Build the grid structure without any hits.
   * Useful for rendering an empty grid before hits are placed.
   *
   * @param config - Grid configuration.
   * @param numBars - Number of bars.
   * @returns Array of all grid positions.
   */
  buildGrid(config: Partial<QuantizationConfig>, numBars: number): GridPosition[];
}
```

### 3f. PlaybackEngine

```typescript
// src/audio/playback/PlaybackEngine.ts

import type { QuantizedHit, GridPosition } from '../types/timeline';

/** Configuration for the playback engine. */
export interface PlaybackConfig {
  /** Whether to loop playback. Defaults to true. */
  loop: boolean;

  /** Master volume in range [0, 1]. Defaults to 0.8. */
  masterVolume: number;

  /** Lookahead time in seconds for scheduling.
   *  The scheduler pre-schedules events this far ahead.
   *  Defaults to 0.1 (100ms). */
  lookaheadSeconds: number;

  /** Scheduling interval in milliseconds.
   *  How often the scheduler checks for upcoming events.
   *  Defaults to 25. */
  scheduleIntervalMs: number;

  /** Metronome click enabled. Defaults to false. */
  metronomeEnabled: boolean;

  /** Metronome volume in range [0, 1]. Defaults to 0.3. */
  metronomeVolume: number;
}

/** Default playback configuration. */
export const DEFAULT_PLAYBACK_CONFIG: PlaybackConfig = {
  loop: true,
  masterVolume: 0.8,
  lookaheadSeconds: 0.1,
  scheduleIntervalMs: 25,
  metronomeEnabled: false,
  metronomeVolume: 0.3,
};

/** Events emitted during playback. */
export interface PlaybackEvents {
  /** Fired when playback starts. */
  onPlay: () => void;

  /** Fired when playback is paused. */
  onPause: () => void;

  /** Fired when playback stops and position resets. */
  onStop: () => void;

  /** Fired when the playback loop restarts from the beginning. */
  onLoopRestart: () => void;

  /** Fired each time a hit is played.
   *  @param hit - The quantized hit being played. */
  onHitPlayed: (hit: QuantizedHit) => void;

  /** Fired at the scheduler interval with current playback position.
   *  @param positionSeconds - Current position in seconds.
   *  @param positionGrid - Current grid position. */
  onPositionUpdate: (positionSeconds: number, positionGrid: GridPosition) => void;
}

/** State of the playback engine. */
export type PlaybackState = 'stopped' | 'playing' | 'paused';

/** Per-cluster volume and mute settings. */
export interface ClusterMix {
  /** Cluster ID. */
  clusterId: string;

  /** Volume in range [0, 1]. */
  volume: number;

  /** Whether this cluster is muted. */
  muted: boolean;

  /** Stereo pan in range [-1, 1]. -1 = full left, 1 = full right. */
  pan: number;
}

/**
 * Schedules and plays back quantized hits as instrument samples.
 *
 * Uses a lookahead scheduler pattern: a setInterval callback runs every
 * scheduleIntervalMs, checks which hits fall within the next lookaheadSeconds,
 * and pre-schedules them via AudioBufferSourceNode.start(). This achieves
 * sample-accurate timing even on the main thread.
 *
 * Each cluster maps to an instrument sample loaded by SampleBank.
 *
 * @example
 * ```ts
 * const engine = new PlaybackEngine(audioContext);
 * await engine.loadSamples(clusterSampleMap);
 * engine.setHits(quantizationResult.hits);
 * engine.setBpm(95);
 * engine.setDuration(quantizationResult.durationSeconds);
 * engine.on('onHitPlayed', (hit) => highlightHit(hit.id));
 * engine.play();
 * ```
 */
export class PlaybackEngine {
  constructor(audioContext: AudioContext);

  /** Subscribe to playback events. */
  on<K extends keyof PlaybackEvents>(event: K, handler: PlaybackEvents[K]): void;

  /** Unsubscribe from playback events. */
  off<K extends keyof PlaybackEvents>(event: K, handler: PlaybackEvents[K]): void;

  /** Current playback state. */
  get state(): PlaybackState;

  /** Current playback position in seconds. */
  get positionSeconds(): number;

  /**
   * Load instrument samples for each cluster.
   *
   * @param mapping - Map from cluster ID to sample file URL.
   * @returns Promise that resolves when all samples are decoded and cached.
   */
  loadSamples(mapping: Map<string, string>): Promise<void>;

  /**
   * Set the quantized hits to play back.
   * Can be called during playback (hits update takes effect at next scheduler tick).
   *
   * @param hits - Array of quantized hits.
   */
  setHits(hits: QuantizedHit[]): void;

  /**
   * Set the BPM for playback timing.
   * Can be called during playback.
   *
   * @param bpm - Beats per minute.
   */
  setBpm(bpm: number): void;

  /**
   * Set the total duration of the loop in seconds.
   *
   * @param durationSeconds - Loop length.
   */
  setDuration(durationSeconds: number): void;

  /** Start playback from the current position. */
  play(): void;

  /** Pause playback at the current position. */
  pause(): void;

  /** Stop playback and reset position to the beginning. */
  stop(): void;

  /**
   * Seek to a specific position.
   *
   * @param positionSeconds - Target position in seconds.
   */
  seek(positionSeconds: number): void;

  /** Update playback configuration. */
  setConfig(config: Partial<PlaybackConfig>): void;

  /**
   * Set per-cluster mix levels.
   *
   * @param mix - Array of cluster mix settings.
   */
  setMix(mix: ClusterMix[]): void;

  /** Release all audio resources. Call when the engine is no longer needed. */
  dispose(): void;
}
```

### 3g. SessionManager

```typescript
// src/audio/SessionManager.ts

import type { QuantizationConfig } from './quantization/QuantizationEngine';

/** Metadata for a saved session (stored in IndexedDB index). */
export interface SessionMeta {
  /** Unique session ID. */
  id: string;

  /** User-provided session name. */
  name: string;

  /** ISO 8601 timestamp of session creation. */
  createdAt: string;

  /** ISO 8601 timestamp of last modification. */
  updatedAt: string;

  /** Number of detected onsets. */
  onsetCount: number;

  /** Number of clusters. */
  clusterCount: number;

  /** BPM setting. */
  bpm: number;

  /** Total duration in seconds. */
  durationSeconds: number;

  /** Byte size of the full session data (for storage management). */
  sizeBytes: number;
}

/** Complete serialized session data. */
export interface Session {
  /** Session metadata. */
  meta: SessionMeta;

  /** Serialized onset data. Buffers stored as base64 for IndexedDB compatibility. */
  onsets: Array<{
    id: string;
    timestamp: number;
    energy: number;
    /** Base64-encoded Float32Array of audio samples. */
    bufferBase64: string;
  }>;

  /** Extracted features per onset. Typed arrays stored as plain number arrays
   *  for serialization compatibility. */
  features: Array<{
    onsetId: string;
    spectralCentroid: number;
    spectralFlatness: number;
    spectralRolloff: number;
    zeroCrossingRate: number;
    rmsEnergy: number;
    mfcc: number[];
    attackTimeMs: number;
    temporalCentroid: number;
  }>;

  /** Cluster definitions and assignments. */
  clusters: Array<{
    id: string;
    label: string;
    centroid: number[];
    onsetIds: string[];
    assignedSampleId: string | null;
    color: string;
  }>;

  /** Quantization configuration used. */
  quantizationConfig: QuantizationConfig;

  /** Quantized hit data. */
  hits: Array<{
    id: string;
    onsetId: string;
    clusterId: string;
    originalTime: number;
    quantizedTime: number;
    velocity: number;
    gridPosition: { bar: number; beat: number; tick: number };
  }>;

  /** Version of the session format. Used for forward-compatible migration. */
  version: number;
}

/** Events emitted by the SessionManager. */
export interface SessionManagerEvents {
  /** Fired when a session is saved. */
  onSave: (meta: SessionMeta) => void;

  /** Fired when a session is deleted. */
  onDelete: (sessionId: string) => void;

  /** Fired when storage usage changes.
   *  @param usedBytes - Bytes used by all sessions.
   *  @param quotaBytes - Estimated storage quota. */
  onStorageUpdate: (usedBytes: number, quotaBytes: number) => void;
}

/** Export format options. */
export type ExportFormat = 'wav' | 'json';

/**
 * Manages saving, loading, and exporting sessions via IndexedDB.
 *
 * Session data is stored in two IndexedDB object stores:
 *   - `session-meta`: SessionMeta objects (lightweight, for listing).
 *   - `session-data`: Full Session objects (larger, loaded on demand).
 *
 * This two-store design keeps the session list fast to load even when
 * individual sessions contain large audio buffer data.
 *
 * @example
 * ```ts
 * const manager = new SessionManager();
 * await manager.initialize();
 *
 * // Save current state
 * const meta = await manager.save('My Beat', currentSessionData);
 *
 * // List saved sessions
 * const sessions = await manager.list();
 *
 * // Load a session
 * const session = await manager.load(sessions[0].id);
 *
 * // Export as WAV
 * const blob = await manager.export(session, 'wav', audioContext);
 * ```
 */
export class SessionManager {
  /** Subscribe to session events. */
  on<K extends keyof SessionManagerEvents>(event: K, handler: SessionManagerEvents[K]): void;

  /** Unsubscribe from session events. */
  off<K extends keyof SessionManagerEvents>(event: K, handler: SessionManagerEvents[K]): void;

  /**
   * Initialize the IndexedDB database.
   * Must be called before any other operations.
   * Handles database versioning and schema migrations.
   */
  initialize(): Promise<void>;

  /**
   * Save a session.
   *
   * @param name - User-provided session name.
   * @param data - Complete session data (excluding meta, which is auto-generated).
   * @returns The generated session metadata.
   */
  save(name: string, data: Omit<Session, 'meta'>): Promise<SessionMeta>;

  /**
   * Update an existing session.
   *
   * @param sessionId - ID of the session to update.
   * @param data - Updated session data.
   * @returns Updated session metadata.
   * @throws {Error} If session does not exist.
   */
  update(sessionId: string, data: Omit<Session, 'meta'>): Promise<SessionMeta>;

  /**
   * Load a full session by ID.
   *
   * @param sessionId - Session ID.
   * @returns The complete session data.
   * @throws {Error} If session does not exist.
   */
  load(sessionId: string): Promise<Session>;

  /**
   * List all saved session metadata, sorted by updatedAt descending.
   */
  list(): Promise<SessionMeta[]>;

  /**
   * Delete a session and its associated data.
   *
   * @param sessionId - Session ID to delete.
   */
  delete(sessionId: string): Promise<void>;

  /**
   * Rename a session.
   *
   * @param sessionId - Session ID.
   * @param newName - New session name.
   */
  rename(sessionId: string, newName: string): Promise<void>;

  /**
   * Duplicate a session.
   *
   * @param sessionId - Source session ID.
   * @param newName - Name for the duplicate.
   * @returns Metadata of the new session.
   */
  duplicate(sessionId: string, newName: string): Promise<SessionMeta>;

  /**
   * Export a session to a downloadable format.
   *
   * @param session - The session to export.
   * @param format - 'wav' renders the beat as a stereo audio file.
   *                 'json' exports the raw session data for re-import.
   * @param audioContext - Required for WAV export to render samples through
   *                       the playback engine. Ignored for JSON export.
   * @returns A Blob containing the exported data.
   */
  export(session: Session, format: ExportFormat, audioContext?: AudioContext): Promise<Blob>;

  /**
   * Import a session from a JSON blob previously exported via `export()`.
   *
   * @param blob - JSON blob from a previous export.
   * @returns The imported session metadata.
   * @throws {Error} If the blob is not a valid session or version is unsupported.
   */
  import(blob: Blob): Promise<SessionMeta>;

  /**
   * Get current storage usage and estimated quota.
   */
  getStorageInfo(): Promise<{ usedBytes: number; quotaBytes: number }>;
}
```

---

## 4. State Management Architecture

### Store Slices

TapBeats uses Zustand with five independent store slices. Each store is a standalone Zustand store created with `create()`. Stores reference each other via direct imports when cross-store reads are needed (no global combined store).

#### appStore

```typescript
// src/state/appStore.ts

import { create } from 'zustand';

/** Application screens / navigation states. */
export type AppScreen = 'home' | 'recording' | 'clustering' | 'timeline' | 'sessions';

/** Microphone permission state. */
export type PermissionState = 'unknown' | 'prompt' | 'granted' | 'denied';

interface AppState {
  /** Current active screen. */
  currentScreen: AppScreen;

  /** Microphone permission status. */
  micPermission: PermissionState;

  /** Whether the AudioContext has been resumed (requires user gesture). */
  audioContextResumed: boolean;

  /** Global error message, or null. Displayed in error banner. */
  globalError: string | null;

  /** Whether the app is in an initialization phase. */
  isInitializing: boolean;
}

interface AppActions {
  /** Navigate to a screen. */
  setScreen: (screen: AppScreen) => void;

  /** Update microphone permission state. */
  setMicPermission: (state: PermissionState) => void;

  /** Mark AudioContext as resumed after user gesture. */
  setAudioContextResumed: (resumed: boolean) => void;

  /** Set or clear the global error. */
  setGlobalError: (error: string | null) => void;

  /** Mark initialization complete. */
  setInitialized: () => void;
}

export const useAppStore = create<AppState & AppActions>()((set) => ({
  currentScreen: 'home',
  micPermission: 'unknown',
  audioContextResumed: false,
  globalError: null,
  isInitializing: true,

  setScreen: (screen) => set({ currentScreen: screen }),
  setMicPermission: (micPermission) => set({ micPermission }),
  setAudioContextResumed: (audioContextResumed) => set({ audioContextResumed }),
  setGlobalError: (globalError) => set({ globalError }),
  setInitialized: () => set({ isInitializing: false }),
}));
```

#### recordingStore

```typescript
// src/state/recordingStore.ts

import { create } from 'zustand';
import type { Onset } from '../types/audio';

export type RecordingStatus = 'idle' | 'countdown' | 'recording' | 'processing';

interface RecordingState {
  /** Current recording status. */
  status: RecordingStatus;

  /** Detected onsets during the current recording. */
  onsets: Onset[];

  /** Recording start time (performance.now()). Null when not recording. */
  startTime: number | null;

  /** Recording elapsed time in seconds. Updated by animation frame. */
  elapsedSeconds: number;

  /** Maximum recording duration in seconds. Defaults to 30. */
  maxDurationSeconds: number;

  /** Current audio energy level for VU meter display. Range [0, 1]. */
  currentEnergy: number;
}

interface RecordingActions {
  /** Begin a new recording. Clears previous onsets. */
  startRecording: () => void;

  /** Stop the current recording. */
  stopRecording: () => void;

  /** Add a detected onset. */
  addOnset: (onset: Onset) => void;

  /** Update elapsed time (called from animation frame). */
  updateElapsed: (seconds: number) => void;

  /** Update current energy level for VU meter. */
  updateEnergy: (energy: number) => void;

  /** Clear all recording data. */
  reset: () => void;
}

export const useRecordingStore = create<RecordingState & RecordingActions>()((set) => ({
  status: 'idle',
  onsets: [],
  startTime: null,
  elapsedSeconds: 0,
  maxDurationSeconds: 30,
  currentEnergy: 0,

  startRecording: () =>
    set({
      status: 'recording',
      onsets: [],
      startTime: performance.now(),
      elapsedSeconds: 0,
    }),
  stopRecording: () => set({ status: 'processing', startTime: null }),
  addOnset: (onset) => set((state) => ({ onsets: [...state.onsets, onset] })),
  updateElapsed: (seconds) => set({ elapsedSeconds: seconds }),
  updateEnergy: (energy) => set({ currentEnergy: energy }),
  reset: () =>
    set({
      status: 'idle',
      onsets: [],
      startTime: null,
      elapsedSeconds: 0,
      currentEnergy: 0,
    }),
}));
```

#### clusterStore

```typescript
// src/state/clusterStore.ts

import { create } from 'zustand';
import type { ClusterResult } from '../types/clustering';

interface ClusterState {
  /** Current clustering result, or null if not yet clustered. */
  result: ClusterResult | null;

  /** Whether clustering is in progress. */
  isClustering: boolean;

  /** Map from cluster ID to assigned instrument sample URL. */
  sampleAssignments: Map<string, string>;

  /** User-modified cluster labels. */
  clusterLabels: Map<string, string>;
}

interface ClusterActions {
  /** Set clustering result from SoundClusterer. */
  setResult: (result: ClusterResult) => void;

  /** Mark clustering as in progress. */
  setIsClustering: (isClustering: boolean) => void;

  /** Assign an instrument sample to a cluster. */
  assignSample: (clusterId: string, sampleUrl: string) => void;

  /** Rename a cluster. */
  renameCluster: (clusterId: string, label: string) => void;

  /** Signal a re-cluster with a different K. Sets isClustering to true
   *  so the UI can show a loading indicator while the hook re-runs clustering. */
  requestRecluster: (k: number) => void;

  /** Clear all cluster data. */
  reset: () => void;
}

export const useClusterStore = create<ClusterState & ClusterActions>()((set) => ({
  result: null,
  isClustering: false,
  sampleAssignments: new Map(),
  clusterLabels: new Map(),

  setResult: (result) => set({ result, isClustering: false }),
  setIsClustering: (isClustering) => set({ isClustering }),
  assignSample: (clusterId, sampleUrl) =>
    set((state) => {
      const next = new Map(state.sampleAssignments);
      next.set(clusterId, sampleUrl);
      return { sampleAssignments: next };
    }),
  renameCluster: (clusterId, label) =>
    set((state) => {
      const next = new Map(state.clusterLabels);
      next.set(clusterId, label);
      return { clusterLabels: next };
    }),
  requestRecluster: (_k) => set({ isClustering: true }),
  reset: () =>
    set({
      result: null,
      isClustering: false,
      sampleAssignments: new Map(),
      clusterLabels: new Map(),
    }),
}));
```

#### timelineStore

```typescript
// src/state/timelineStore.ts

import { create } from 'zustand';
import type { QuantizedHit, QuantizationConfig, GridPosition } from '../types/timeline';

interface TimelineState {
  /** Quantized hits on the timeline. */
  hits: QuantizedHit[];

  /** Current quantization configuration. */
  config: QuantizationConfig;

  /** Current playback position in seconds. */
  playbackPosition: number;

  /** Current playback grid position. */
  playbackGridPosition: GridPosition | null;

  /** Whether playback is active. */
  isPlaying: boolean;

  /** Total number of bars. */
  numBars: number;

  /** Total duration in seconds. */
  durationSeconds: number;

  /** Grid points for rendering. */
  gridPoints: GridPosition[];
}

interface TimelineActions {
  /** Set quantized hits from QuantizationEngine. */
  setHits: (hits: QuantizedHit[]) => void;

  /** Update quantization config (triggers re-quantize via hook). */
  setConfig: (config: Partial<QuantizationConfig>) => void;

  /** Update playback position (called from PlaybackEngine via hook). */
  setPlaybackPosition: (seconds: number, grid: GridPosition | null) => void;

  /** Toggle playback state. */
  setIsPlaying: (isPlaying: boolean) => void;

  /** Set timeline dimensions after quantization. */
  setTimeline: (numBars: number, durationSeconds: number, gridPoints: GridPosition[]) => void;

  /** Remove a single hit from the timeline (user edit). */
  removeHit: (hitId: string) => void;

  /** Adjust a hit's velocity (user edit). */
  setHitVelocity: (hitId: string, velocity: number) => void;

  /** Clear timeline data. */
  reset: () => void;
}

export const useTimelineStore = create<TimelineState & TimelineActions>()((set) => ({
  hits: [],
  config: { bpm: 120, beatsPerBar: 4, subdivision: 4, strength: 1.0, swing: 0 },
  playbackPosition: 0,
  playbackGridPosition: null,
  isPlaying: false,
  numBars: 4,
  durationSeconds: 8,
  gridPoints: [],

  setHits: (hits) => set({ hits }),
  setConfig: (partial) => set((state) => ({ config: { ...state.config, ...partial } })),
  setPlaybackPosition: (seconds, grid) =>
    set({
      playbackPosition: seconds,
      playbackGridPosition: grid,
    }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setTimeline: (numBars, durationSeconds, gridPoints) =>
    set({ numBars, durationSeconds, gridPoints }),
  removeHit: (hitId) =>
    set((state) => ({
      hits: state.hits.filter((h) => h.id !== hitId),
    })),
  setHitVelocity: (hitId, velocity) =>
    set((state) => ({
      hits: state.hits.map((h) => (h.id === hitId ? { ...h, velocity } : h)),
    })),
  reset: () =>
    set({
      hits: [],
      playbackPosition: 0,
      playbackGridPosition: null,
      isPlaying: false,
      numBars: 4,
      durationSeconds: 8,
      gridPoints: [],
    }),
}));
```

#### sessionStore

```typescript
// src/state/sessionStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionMeta } from '../types/session';
import { indexedDBStorage } from './middleware/persistMiddleware';

interface SessionState {
  /** List of saved session metadata. */
  sessions: SessionMeta[];

  /** Currently active session ID, or null for unsaved work. */
  activeSessionId: string | null;

  /** Whether sessions are being loaded from IndexedDB. */
  isLoading: boolean;

  /** Whether a save operation is in progress. */
  isSaving: boolean;
}

interface SessionActions {
  /** Set the sessions list (after loading from IndexedDB). */
  setSessions: (sessions: SessionMeta[]) => void;

  /** Set the active session. */
  setActiveSession: (sessionId: string | null) => void;

  /** Add or update a session in the list. */
  upsertSession: (meta: SessionMeta) => void;

  /** Remove a session from the list. */
  removeSession: (sessionId: string) => void;

  /** Set loading state. */
  setIsLoading: (isLoading: boolean) => void;

  /** Set saving state. */
  setIsSaving: (isSaving: boolean) => void;
}

export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,
      isLoading: false,
      isSaving: false,

      setSessions: (sessions) => set({ sessions, isLoading: false }),
      setActiveSession: (activeSessionId) => set({ activeSessionId }),
      upsertSession: (meta) =>
        set((state) => {
          const index = state.sessions.findIndex((s) => s.id === meta.id);
          const sessions = [...state.sessions];
          if (index >= 0) {
            sessions[index] = meta;
          } else {
            sessions.unshift(meta);
          }
          return { sessions, isSaving: false };
        }),
      removeSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          activeSessionId:
            state.activeSessionId === sessionId ? null : state.activeSessionId,
        })),
      setIsLoading: (isLoading) => set({ isLoading }),
      setIsSaving: (isSaving) => set({ isSaving }),
    }),
    {
      name: 'tapbeats-sessions',
      storage: indexedDBStorage,
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
    },
  ),
);
```

### Store Composition Pattern

Stores are **independent**; there is no combined root store. Cross-store communication happens through two patterns:

1. **React hooks** that read from multiple stores and orchestrate actions:
   ```typescript
   // Example: hook that bridges recording completion to clustering
   function useRecordingComplete() {
     const onsets = useRecordingStore((s) => s.onsets);
     const setResult = useClusterStore((s) => s.setResult);
     // Orchestration logic: extract features, cluster, set result
   }
   ```

2. **Direct store reads** in non-React code (audio module callbacks):
   ```typescript
   // Audio callback reads recording store directly (outside React)
   const onsets = useRecordingStore.getState().onsets;
   ```

This avoids the complexity of a single monolithic store while keeping cross-store dependencies explicit and traceable.

### Middleware

#### IndexedDB Persistence

```typescript
// src/state/middleware/persistMiddleware.ts

import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/**
 * Custom Zustand storage adapter for IndexedDB via idb-keyval.
 *
 * Only sessionStore uses persistence. Other stores hold transient
 * session-in-progress data that does not survive page reload. This is
 * intentional: the user must explicitly save via SessionManager to persist
 * their work.
 */
export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get<string>(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};
```

#### Redux DevTools

```typescript
// src/state/middleware/devtoolsMiddleware.ts

/**
 * All stores use Zustand's built-in devtools middleware in development.
 * Each store registers with a unique name for identification in Redux DevTools.
 *
 * In production, devtools middleware is a no-op (Zustand checks
 * process.env.NODE_ENV internally), but we additionally guard it behind
 * the __DEV__ flag defined in vite.config.ts for tree-shaking.
 *
 * Usage pattern:
 *   import { devtools } from 'zustand/middleware';
 *
 *   export const useRecordingStore = create<State>()(
 *     devtools(
 *       (set) => ({ ... }),
 *       { name: 'recordingStore', enabled: __DEV__ },
 *     ),
 *   );
 */
```

---

## 5. Coding Standards

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (components) | PascalCase | `RecordingScreen.tsx` |
| Files (modules) | PascalCase | `OnsetDetector.ts` |
| Files (utilities) | camelCase | `arrayBuffer.ts` |
| Files (types) | camelCase | `audio.ts` |
| Files (hooks) | camelCase, `use` prefix | `useAudioCapture.ts` |
| Files (stores) | camelCase, `Store` suffix | `recordingStore.ts` |
| Files (tests) | Match source + `.test.ts` | `OnsetDetector.test.ts` |
| Interfaces | PascalCase, no `I` prefix | `AudioFeatures` |
| Types | PascalCase | `RecordingStatus` |
| Union types over enums | Prefer string/number unions | `type Subdivision = 1 \| 2 \| 4 \| 8 \| 16` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_CAPTURE_CONFIG` |
| Functions | camelCase | `computeSpectralFlux()` |
| React components | PascalCase | `TapVisualizer` |
| CSS custom properties | `--tb-{category}-{name}` | `--tb-color-primary` |
| Event handler props | `on` prefix | `onBuffer`, `onOnset` |
| Boolean variables | `is`/`has`/`should` prefix | `isPlaying`, `hasPermission` |

### File Organization Rules

1. **One export per file** for classes and components. Utility files may export multiple related functions.
2. **Co-locate types** with their module when used only by that module. Shared types go in `src/types/`.
3. **No circular imports.** The dependency graph flows one direction: `types` <- `utils` <- `audio/*` <- `state` <- `hooks` <- `components`. Never import upstream.
4. **Index files** (`index.ts`) only for re-exports. No logic in index files.
5. **Test files** mirror source structure under `tests/unit/`.

### Import Ordering

Enforced by ESLint `import/order`:

```typescript
// 1. External packages
import { create } from 'zustand';
import React, { useCallback, useRef } from 'react';

// 2. Internal absolute imports (src/ aliased as @/)
import type { Onset } from '@/types/audio';
import { clamp } from '@/utils/math';

// 3. Relative imports
import { OnsetDetector } from './OnsetDetector';
import type { OnsetDetectorConfig } from './OnsetDetectorConfig';
```

Blank line between each group. Type-only imports use `import type`.

### Error Handling Patterns

```typescript
// 1. Structured errors with machine-readable codes (never bare strings).
export interface AudioCaptureError {
  code: 'PERMISSION_DENIED' | 'DEVICE_NOT_FOUND';
  message: string;
  cause?: Error;
}

// 2. Audio modules emit errors via events; they never throw during processing.
//    This prevents unhandled exceptions from crashing the audio pipeline.
detector.on('onError', (error) => {
  appStore.getState().setGlobalError(error.message);
});

// 3. Async operations use explicit try/catch with typed error handling.
try {
  await capture.start();
} catch (error) {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    appStore.getState().setMicPermission('denied');
  }
}

// 4. React components: ErrorBoundary at screen level.
//    Each screen is wrapped in an ErrorBoundary that shows recovery UI
//    and reports the error to appStore.

// 5. Never swallow errors silently. Always log or propagate.
```

### Logging Approach

```typescript
// src/utils/logger.ts

/**
 * Minimal structured logger. Wraps console methods with module prefixes.
 *
 * In development: all levels active.
 * In production:  warn and error only.
 *
 * Output format:
 *   [AudioCapture] Started with sampleRate=44100
 *   [OnsetDetector] Detected onset at t=1.234s energy=0.87
 *
 * Audio thread (worklets): use this.port.postMessage({ type: 'log', ... })
 * Never call console.log inside an AudioWorkletProcessor.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function createLogger(module: string): Record<LogLevel, (...args: unknown[]) => void>;
```

### Performance-Sensitive Code Guidelines

**Audio thread (AudioWorklet processors in `public/worklets/`):**

- No object allocation inside `process()`. Pre-allocate all buffers in the constructor.
- No closures, no `Array.map`/`filter`/`reduce`. Use indexed `for` loops.
- No string concatenation or template literals.
- No calls to `Math.random()` (uses slow system entropy on some platforms). Use a pre-seeded PRNG if randomness is needed.
- No `console.log` (serialization stalls the audio thread). Use `this.port.postMessage()` for debug output.
- Target: `process()` completes in under 3ms for a 2048-sample buffer at 44.1kHz (budget is ~46ms per callback at that buffer size, but leave headroom for the rest of the audio graph).

**Main thread audio processing (`src/audio/`):**

- Avoid allocations in hot paths (onset detection per frame). Reuse typed arrays declared at the module or instance level.
- Use `Float32Array` / `Float64Array`, not plain `number[]`, for audio and feature data.
- FFT: Compute in-place when possible. Avoid copying intermediate buffers.
- Prefer `for` loops over array methods for buffers larger than 1024 samples.

**React components:**

- Use `React.memo()` for components that receive stable props (cluster cards, hit markers).
- Use `useCallback` / `useMemo` for callbacks and derived data passed to child components.
- Zustand selectors with shallow equality (`useStore(selector, shallow)`) for derived state.
- Canvas rendering (waveforms, timeline grid) via `requestAnimationFrame`, not React re-renders.
- Never read audio buffers (`Float32Array`) inside React render. Copy scalar values (energy, timestamp) to state; keep buffers in refs or audio modules.

### TypeScript Strict Mode Rules

All enabled in `tsconfig.json`:

| Flag | Enforcement |
|------|-------------|
| `strict: true` | Enables all strict checks below. |
| `noUncheckedIndexedAccess: true` | Array/object index access returns `T \| undefined`. Forces explicit bounds checking on audio buffers. |
| `exactOptionalPropertyTypes: true` | `undefined` and optional are distinct. Prevents accidental `undefined` assignment to optional fields. |
| `noImplicitReturns: true` | Every code path in a function must return a value. |
| `noFallthroughCasesInSwitch: true` | Switch cases must break or return. |
| `forceConsistentCasingInFileNames: true` | Prevents cross-platform file path issues. |

**Additional rules enforced via ESLint:**

- `any` is forbidden in `src/audio/`. Use `unknown` with type narrowing.
- `as` type assertions are forbidden except in test files. Use type guards.
- Non-null assertion (`!`) is forbidden. Handle `null`/`undefined` explicitly.

---

## 6. Development Workflow

### Getting Started

```bash
# Clone the repository
git clone https://github.com/tapbeats/tapbeats.git
cd tapbeats

# Install dependencies (Node.js 20+ required)
npm install

# Start the development server
npm run dev

# Open in browser (HTTPS required for microphone access)
# Vite serves on https://localhost:5173 with a self-signed cert
```

**Prerequisites:**

- Node.js 20.x or later (required for native ESM support in tooling).
- A browser with AudioWorklet support (Chrome 66+, Firefox 76+, Safari 14.1+).
- A microphone (built-in or external).
- HTTPS context (Vite dev server configures this automatically via `@vitejs/plugin-basic-ssl`).

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HTTPS and HMR. |
| `npm run build` | Production build to `dist/`. Runs typecheck first. |
| `npm run preview` | Preview production build locally. |
| `npm run typecheck` | Run `tsc --noEmit` for type checking without emitting. |
| `npm run lint` | Run ESLint on all source and test files. |
| `npm run lint:fix` | Run ESLint with auto-fix. |
| `npm run format` | Run Prettier on all files. |
| `npm run format:check` | Check Prettier formatting without writing. |
| `npm run test` | Run Vitest in watch mode. |
| `npm run test:run` | Run Vitest once (CI mode). |
| `npm run test:coverage` | Run Vitest with V8 coverage report. |
| `npm run test:e2e` | Run Playwright E2E tests (headless). |
| `npm run test:e2e:ui` | Run Playwright with interactive UI mode. |

### Hot Reloading with AudioWorklet Considerations

Vite HMR works for all React components and most TypeScript modules. AudioWorklet processors in `public/worklets/` require special handling:

1. **Worklet files are not HMR-eligible.** Changes to `onset-processor.js` or `capture-processor.js` require a full page reload. This is a Web Audio API limitation: once a worklet module is loaded into an `AudioWorkletGlobalScope`, it cannot be replaced.
2. **Audio module changes** (`src/audio/`) trigger HMR but require re-initializing the audio pipeline. The `useAudioCapture` hook handles teardown (stopping the stream, disconnecting nodes) and re-setup on module replacement.
3. **State stores** are HMR-safe. Zustand stores preserve their state across module replacements by default, so recording-in-progress data survives code edits.

### Debugging Audio

1. **Chrome Web Audio Inspector** (`chrome://inspect/#audio`): Visualizes the AudioContext node graph. Verify connections: `MediaStreamSource` -> `AudioWorkletNode` -> `AnalyserNode` (optional) -> destination.
2. **AudioWorklet logging**: Worklet processors communicate via `this.port.postMessage()`. The main thread receives these messages and logs them in the console with a `[Worklet]` prefix. Use this instead of `console.log` inside worklet code.
3. **Onset detection tuning**: Enable `onFlux` events on the `OnsetDetector`. The `TapVisualizer` component can render spectral flux and adaptive threshold values in real time, making it easy to see why onsets are or are not being triggered.
4. **Latency measurement**: Use `performance.now()` timestamps at the AudioCapture buffer callback and at onset event emission to measure end-to-end detection latency. Target: under 50ms from physical tap to onset event on the main thread.
5. **Buffer inspection**: The `WaveformDisplay` shared component accepts a `Float32Array` and renders it as a canvas waveform. Pass `onset.buffer` to it to visually inspect individual onset captures.

### Testing Locally

**Unit and integration tests:**

```bash
npm run test          # Watch mode, re-runs on file changes
npm run test:run      # Single run (use in CI)
npm run test:coverage # With V8 coverage report in coverage/
```

**E2E tests:**

```bash
npx playwright install  # First time only: download browser binaries
npm run test:e2e        # Headless across all configured browsers
npm run test:e2e:ui     # Interactive UI for debugging individual tests
```

**E2E microphone mocking:** Playwright tests use `browserContext.grantPermissions(['microphone'])` and inject a synthetic audio stream via `getUserMedia` override. See `tests/helpers/audioMocks.ts` for the implementation. Test fixtures in `tests/fixtures/` provide deterministic audio input.

### Building for Production

```bash
npm run build
```

Production build outputs to `dist/`. Key optimizations applied by Vite:

- Tree-shaking removes unused code (DevTools middleware, debug logging behind `__DEV__`).
- AudioWorklet files from `public/worklets/` are copied as-is to `dist/worklets/`.
- Instrument samples in `src/assets/samples/` are fingerprinted for cache-busting.
- Vendor chunk (`react`, `react-dom`, `zustand`) is split for long-term caching.
- Source maps are generated (`.map` files) but should not be deployed to production servers unless needed for error monitoring.

### Contributing Guide Outline

1. Fork the repository and create a feature branch from `main`.
2. Follow the coding standards defined in this document.
3. Write tests for all new functionality (unit tests required, integration tests encouraged).
4. Ensure all checks pass locally: `npm run lint && npm run typecheck && npm run test:run`.
5. Open a pull request with a clear description of changes and motivation.
6. Pre-commit hooks (Husky + lint-staged) automatically enforce formatting and linting on staged files. Do not bypass them with `--no-verify`.

---

## 7. Dependency Policy

### Philosophy

TapBeats implements all core audio processing algorithms from scratch. This is a deliberate choice:

1. **Educational value.** The project serves as a reference for Web Audio API programming. Wrapping a library teaches nothing about the underlying signal processing.
2. **Bundle size.** Audio processing libraries are large (often 50-200KB+). Our core algorithms (FFT, onset detection, K-means, MFCC) total under 15KB minified.
3. **Control.** Audio processing requires fine-grained control over buffer sizes, allocation patterns, and threading. Third-party libraries impose their own abstractions and allocation patterns that may not align with real-time audio constraints.
4. **No native dependencies.** Everything runs in the browser. No WASM compilation steps, no native modules, no server-side processing.

### What We Build (no external dependencies allowed)

- FFT (radix-2 Cooley-Tukey)
- Onset detection (spectral flux with adaptive threshold)
- Feature extraction (spectral centroid, ZCR, MFCC, RMS)
- K-means clustering with auto-K selection
- Distance metrics (Euclidean, cosine similarity)
- Quantization (grid snapping, swing)
- Playback scheduling (lookahead scheduler pattern)
- WAV encoding (for session export)

### Approved Dependency Categories

| Category | Examples | Justification |
|----------|---------|---------------|
| **UI framework** | `react`, `react-dom` | Core rendering. Not reinventing a UI framework. |
| **State management** | `zustand` | 1KB gzipped, minimal API, purpose-built for this use case. |
| **Build tools** | `vite`, `typescript`, `@vitejs/plugin-react`, `@vitejs/plugin-basic-ssl` | Development toolchain. Not shipped to production users. |
| **Testing** | `vitest`, `@vitest/coverage-v8`, `@playwright/test`, `@testing-library/react` | Development only. |
| **Code quality** | `eslint`, `prettier`, `husky`, `lint-staged`, `@typescript-eslint/*` | Development only. |
| **Tiny runtime utilities** | `nanoid` (~400B) for ID generation, `idb-keyval` (~600B) for IndexedDB | Focused libraries that replace error-prone boilerplate. Must be under 1KB each. |

### Evaluation Criteria for New Dependencies

Before adding any runtime dependency, all of the following must be true:

1. **Cannot implement in under 100 lines?** If we can write it ourselves in under 100 lines of well-tested code, we do.
2. **Not in the audio processing path?** Any dependency used in the real-time audio pipeline (capture, onset detection, feature extraction, clustering, quantization, playback scheduling) is rejected. We own the audio pipeline completely.
3. **Minified + gzipped size under 5KB?** Runtime dependencies must be tiny. Measure with `npx bundlephobia <package>` or https://bundlephobia.com.
4. **Actively maintained?** Must have had a release within the last 12 months or be feature-complete/stable.
5. **Tree-shakeable?** Must export ESM and support dead-code elimination.
6. **TypeScript types included?** Must ship TypeScript declarations or have `@types/` definitions available.
7. **Compatible license?** Must be MIT, BSD-2-Clause, BSD-3-Clause, or Apache-2.0.

### Bundle Size Budget

| Category | Budget |
|----------|--------|
| **Application code** (all `src/` modules) | < 80KB gzipped |
| **Framework + runtime dependencies** (React, Zustand, nanoid, idb-keyval) | < 50KB gzipped |
| **Total JavaScript** (excluding samples) | < 130KB gzipped |
| **CSS** (all stylesheets) | < 10KB gzipped |
| **Total initial page load** (excluding samples) | < 200KB gzipped |
| **Instrument samples** (lazy-loaded on demand) | < 2MB total across all categories |

Bundle size is validated in CI by running `vite build` and checking output sizes. Pull requests that exceed any budget category are blocked until addressed.

---

## 8. Configuration Files

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },

    "outDir": "./dist",
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### tsconfig.node.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

### vite.config.ts

```typescript
import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    // Self-signed HTTPS cert for local dev (required for getUserMedia)
    basicSsl(),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  server: {
    https: true,
    port: 5173,
    // Required headers for SharedArrayBuffer support (used by AudioWorklet
    // ring buffers when available, with fallback for browsers that do not
    // support cross-origin isolation).
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  build: {
    target: 'ES2022',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunk for long-term caching
          vendor: ['react', 'react-dom', 'zustand'],
        },
      },
    },
  },

  // Serve public/ directory as-is (includes worklet scripts)
  publicDir: 'public',

  define: {
    // Strip devtools middleware and debug logging in production
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
});
```

### .eslintrc.cjs

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'],
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:react-hooks/recommended',
    'prettier', // Must be last: disables formatting rules that conflict with Prettier
  ],
  rules: {
    // TypeScript strict rules
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/prefer-readonly': 'error',

    // Import ordering
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'type',
        ],
        pathGroups: [
          { pattern: '@/**', group: 'internal', position: 'before' },
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-duplicates': 'error',

    // General quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],

    // React hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      // Relaxed rules for test files
      files: ['tests/**/*.ts', 'tests/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        'no-console': 'off',
      },
    },
    {
      // AudioWorklet processor files are plain JS with special globals
      files: ['public/worklets/**/*.js'],
      env: { browser: false },
      globals: {
        AudioWorkletProcessor: 'readonly',
        registerProcessor: 'readonly',
        sampleRate: 'readonly',
        currentFrame: 'readonly',
        currentTime: 'readonly',
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};
```

### .prettierrc

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "overrides": [
    {
      "files": "*.css",
      "options": {
        "singleQuote": false
      }
    }
  ]
}
```

### vitest.config.ts

```typescript
import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  test: {
    // jsdom for DOM APIs and React component testing
    environment: 'jsdom',

    // Global test setup: Web Audio API mocks, custom matchers
    setupFiles: ['./tests/helpers/setupTests.ts'],

    // Test file patterns
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/integration/**/*.test.ts',
    ],

    // Exclude E2E tests (run separately via Playwright)
    exclude: ['tests/e2e/**'],

    // V8 coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.d.ts',
        'src/types/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },

    // Process CSS imports in component tests
    css: true,

    // Use forked workers for test isolation
    pool: 'forks',

    // Verbose reporter for local development
    reporters: ['verbose'],
  },
});
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',

  // Fail CI on test.only
  forbidOnly: !!process.env['CI'],

  // Retry flaky tests on CI only
  retries: process.env['CI'] ? 2 : 0,

  // Single worker on CI to avoid resource contention; parallel locally
  workers: process.env['CI'] ? 1 : undefined,

  // GitHub Actions reporter on CI, HTML report locally
  reporter: process.env['CI'] ? 'github' : 'html',

  use: {
    // Dev server URL
    baseURL: 'https://localhost:5173',

    // Collect trace on first retry for debugging failures
    trace: 'on-first-retry',

    // Screenshot on failure for visual debugging
    screenshot: 'only-on-failure',

    // Accept self-signed cert from Vite dev server
    ignoreHTTPSErrors: true,

    // Grant microphone permission for all tests by default
    permissions: ['microphone'],
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],

  // Start Vite dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'https://localhost:5173',
    reuseExistingServer: !process.env['CI'],
    ignoreHTTPSErrors: true,
    timeout: 30_000,
  },
});
```

### package.json (scripts and lint-staged)

```json
{
  "name": "tapbeats",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint 'src/**/*.{ts,tsx}' 'tests/**/*.{ts,tsx}'",
    "lint:fix": "eslint --fix 'src/**/*.{ts,tsx}' 'tests/**/*.{ts,tsx}'",
    "format": "prettier --write 'src/**/*.{ts,tsx,css}' 'tests/**/*.{ts,tsx}'",
    "format:check": "prettier --check 'src/**/*.{ts,tsx,css}' 'tests/**/*.{ts,tsx}'",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "prepare": "husky"
  },
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "tests/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "src/**/*.css": [
      "prettier --write"
    ]
  }
}
```

### .gitignore

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Test output
coverage/
test-results/
playwright-report/
blob-report/

# Environment
.env
.env.local
.env.*.local

# Editor
.vscode/settings.json
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Vite
*.local

# TypeScript
*.tsbuildinfo
```

### Husky Pre-commit Hook

```bash
# .husky/pre-commit
npx lint-staged
```
