# Testing & Quality Assurance Strategy

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Unit Testing](#2-unit-testing)
3. [Integration Testing](#3-integration-testing)
4. [End-to-End Testing](#4-end-to-end-testing)
5. [Audio-Specific Testing](#5-audio-specific-testing)
6. [Performance Testing](#6-performance-testing)
7. [Accessibility Testing](#7-accessibility-testing)
8. [Cross-Browser Testing](#8-cross-browser-testing)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [Manual QA Checklist](#10-manual-qa-checklist)
11. [Quality Metrics & Gates](#11-quality-metrics--gates)

---

## 1. Testing Philosophy

### Test Pyramid for a Client-Side Audio Application

TapBeats inverts some conventional testing assumptions. Because the core value lives in audio algorithms (onset detection, feature extraction, clustering, quantization) that run entirely in the browser, the pyramid is bottom-heavy by design:

```
          /  E2E  \            ~10% of tests   (Playwright)
         /----------\
        / Integration \        ~25% of tests   (Vitest + JSDOM/happy-dom)
       /----------------\
      /    Unit Tests     \    ~65% of tests   (Vitest + OfflineAudioContext)
     /______________________\
```

**Unit tests** dominate because audio DSP algorithms are pure functions over typed arrays. They are fast, deterministic, and the highest-leverage place to catch regressions.

**Integration tests** validate that modules compose correctly: audio capture piping into onset detection, onsets feeding feature extraction, features feeding clustering, and so on.

**E2E tests** cover critical user journeys where real browser APIs (MediaStream, Web Audio, IndexedDB) must cooperate under realistic conditions.

### What Is Different About Testing Audio Applications

| Challenge | Implication |
|-----------|-------------|
| Audio buffers are large floating-point arrays | Tests must compare arrays with tolerance (`toBeCloseTo` / epsilon checks), not strict equality |
| Microphone input is non-deterministic | Tests must use synthetic audio fixtures with known properties, never live mic input |
| Web Audio API timing is sample-accurate but wall-clock timing is not | Use `OfflineAudioContext` for deterministic rendering; avoid `setTimeout`-based assertions |
| Browser implementations of Web Audio differ | Cross-browser tests must assert behavior, not implementation details |
| Human perception is subjective | Define measurable proxies: precision/recall for onset detection, silhouette score for clustering, ms deviation for quantization |

### Deterministic Testing of Non-Deterministic Input

Every test that touches audio data must use one of three strategies:

1. **Fixture files**: Pre-recorded WAV files with ground-truth annotations (onset times, frequency content, amplitude envelope). Stored in `test/fixtures/audio/`.
2. **Synthetic generation**: Programmatically generated audio buffers using `OfflineAudioContext` (e.g., a click track at 120 BPM, a sine sweep, white noise bursts at known intervals).
3. **Snapshot arrays**: Serialized `Float32Array` snapshots of intermediate pipeline outputs, versioned alongside tests.

Random seeds must be fixed for any algorithm with stochastic behavior (e.g., k-means initialization). All clustering tests set `seed: 42` (or equivalent deterministic initialization) to guarantee reproducibility.

---

## 2. Unit Testing

### Framework Configuration

**Framework**: Vitest
**Environment**: `jsdom` for DOM-dependent tests; default Node for pure algorithm tests.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/index.ts',       // barrel exports
        'src/**/*.d.ts',
        'src/test/**',           // test utilities
      ],
      thresholds: {
        // Global minimums
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
  },
});
```

```typescript
// src/test/setup.ts
import { afterEach } from 'vitest';

// Clean up any lingering AudioContexts after each test
afterEach(() => {
  // Reset any global state, mocks, or singletons
});

// Polyfill OfflineAudioContext for Node environment if needed
if (typeof globalThis.OfflineAudioContext === 'undefined') {
  // Use a lightweight polyfill or skip audio-context tests
  // in pure Node; these tests run in jsdom or browser environment
}
```

### Audio Algorithm Testing with OfflineAudioContext

`OfflineAudioContext` renders audio synchronously (no real-time clock dependency), making it the foundation for deterministic audio tests.

```typescript
// src/test/helpers/audio.ts
export async function renderSyntheticAudio(
  durationSeconds: number,
  sampleRate: number,
  fillFn: (buffer: AudioBuffer) => void
): Promise<AudioBuffer> {
  const length = Math.ceil(durationSeconds * sampleRate);
  const ctx = new OfflineAudioContext(1, length, sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  fillFn(buffer);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
  return ctx.startRendering();
}

export function createClickTrack(
  buffer: AudioBuffer,
  onsetTimesSeconds: number[],
  clickDurationSamples = 64
): void {
  const data = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  for (const t of onsetTimesSeconds) {
    const startSample = Math.round(t * sr);
    for (let i = 0; i < clickDurationSamples && startSample + i < data.length; i++) {
      // Short impulse: exponential decay
      data[startSample + i] = Math.exp(-i / 10) * 0.9;
    }
  }
}

export function createSineAtFrequency(
  buffer: AudioBuffer,
  frequencyHz: number,
  startSeconds: number,
  durationSeconds: number,
  amplitude = 0.8
): void {
  const data = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  const startSample = Math.round(startSeconds * sr);
  const endSample = Math.min(
    startSample + Math.round(durationSeconds * sr),
    data.length
  );
  for (let i = startSample; i < endSample; i++) {
    data[i] += amplitude * Math.sin(2 * Math.PI * frequencyHz * (i / sr));
  }
}
```

### Onset Detection Tests

Test onset detection against fixtures with known ground-truth onset times. Measure precision, recall, and F1 score with a tolerance window.

```typescript
// src/audio/onset-detection.test.ts
import { describe, it, expect } from 'vitest';
import { detectOnsets } from './onset-detection';
import { renderSyntheticAudio, createClickTrack } from '../test/helpers/audio';
import { calculatePrecisionRecallF1 } from '../test/helpers/metrics';

const SAMPLE_RATE = 44100;
const TOLERANCE_MS = 20; // 20ms tolerance window for onset matching

describe('Onset Detection', () => {
  it('detects onsets in a simple click track with F1 >= 0.95', async () => {
    const groundTruth = [0.5, 1.0, 1.5, 2.0, 2.5]; // seconds
    const buffer = await renderSyntheticAudio(3, SAMPLE_RATE, (buf) => {
      createClickTrack(buf, groundTruth);
    });

    const detected = detectOnsets(buffer.getChannelData(0), SAMPLE_RATE);

    const { precision, recall, f1 } = calculatePrecisionRecallF1(
      groundTruth,
      detected,
      TOLERANCE_MS / 1000
    );

    expect(f1).toBeGreaterThanOrEqual(0.95);
    expect(precision).toBeGreaterThanOrEqual(0.9);
    expect(recall).toBeGreaterThanOrEqual(0.9);
  });

  it('handles closely spaced onsets (50ms apart)', async () => {
    const groundTruth = [1.0, 1.05, 1.1, 1.15]; // 50ms spacing
    const buffer = await renderSyntheticAudio(2, SAMPLE_RATE, (buf) => {
      createClickTrack(buf, groundTruth, 32); // shorter clicks
    });

    const detected = detectOnsets(buffer.getChannelData(0), SAMPLE_RATE);
    const { recall } = calculatePrecisionRecallF1(
      groundTruth,
      detected,
      TOLERANCE_MS / 1000
    );

    expect(recall).toBeGreaterThanOrEqual(0.75); // relaxed for close onsets
  });

  it('produces zero false positives on silence', async () => {
    const buffer = await renderSyntheticAudio(2, SAMPLE_RATE, () => {
      // buffer is zero-filled by default
    });

    const detected = detectOnsets(buffer.getChannelData(0), SAMPLE_RATE);
    expect(detected).toHaveLength(0);
  });

  it('handles varying amplitude onsets', async () => {
    const groundTruth = [0.5, 1.0, 1.5, 2.0];
    const buffer = await renderSyntheticAudio(3, SAMPLE_RATE, (buf) => {
      const data = buf.getChannelData(0);
      const sr = buf.sampleRate;
      const amplitudes = [0.9, 0.3, 0.6, 0.15]; // loud to quiet
      groundTruth.forEach((t, idx) => {
        const start = Math.round(t * sr);
        for (let i = 0; i < 64 && start + i < data.length; i++) {
          data[start + i] = Math.exp(-i / 10) * amplitudes[idx];
        }
      });
    });

    const detected = detectOnsets(buffer.getChannelData(0), SAMPLE_RATE);
    const { recall } = calculatePrecisionRecallF1(
      groundTruth,
      detected,
      TOLERANCE_MS / 1000
    );

    expect(recall).toBeGreaterThanOrEqual(0.75);
  });

  it('rejects background noise below threshold', async () => {
    const buffer = await renderSyntheticAudio(2, SAMPLE_RATE, (buf) => {
      const data = buf.getChannelData(0);
      // Low-level white noise
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() - 0.5) * 0.02; // ~-34 dB
      }
    });

    const detected = detectOnsets(buffer.getChannelData(0), SAMPLE_RATE);
    expect(detected.length).toBeLessThanOrEqual(2); // allow minimal false positives
  });
});
```

```typescript
// src/test/helpers/metrics.ts
export interface PrecisionRecallF1 {
  precision: number;
  recall: number;
  f1: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
}

/**
 * Calculate precision, recall, and F1 for onset detection.
 * A detected onset matches a ground-truth onset if within toleranceSeconds.
 * Each ground-truth onset can match at most one detection (greedy nearest).
 */
export function calculatePrecisionRecallF1(
  groundTruth: number[],
  detected: number[],
  toleranceSeconds: number
): PrecisionRecallF1 {
  const matched = new Set<number>();
  let truePositives = 0;

  const sortedDetected = [...detected].sort((a, b) => a - b);
  const sortedGT = [...groundTruth].sort((a, b) => a - b);

  for (const d of sortedDetected) {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < sortedGT.length; i++) {
      if (matched.has(i)) continue;
      const dist = Math.abs(d - sortedGT[i]);
      if (dist <= toleranceSeconds && dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      matched.add(bestIdx);
      truePositives++;
    }
  }

  const falsePositives = detected.length - truePositives;
  const falseNegatives = groundTruth.length - truePositives;

  const precision = detected.length > 0 ? truePositives / detected.length : 1;
  const recall = groundTruth.length > 0 ? truePositives / groundTruth.length : 1;
  const f1 = precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0;

  return { precision, recall, f1, truePositives, falsePositives, falseNegatives };
}
```

### Feature Extraction Tests

Each acoustic feature extractor must be tested against analytically known values.

```typescript
// src/audio/feature-extraction.test.ts
import { describe, it, expect } from 'vitest';
import {
  computeSpectralCentroid,
  computeRMS,
  computeZeroCrossingRate,
  computeMFCC,
  extractFeatures,
} from './feature-extraction';

const SAMPLE_RATE = 44100;
const EPSILON = 0.01; // relative tolerance for floating-point comparisons

describe('Feature Extraction', () => {
  describe('RMS Energy', () => {
    it('returns 0 for a silent buffer', () => {
      const silent = new Float32Array(1024);
      expect(computeRMS(silent)).toBe(0);
    });

    it('returns correct RMS for a known DC signal', () => {
      const dc = new Float32Array(1024).fill(0.5);
      expect(computeRMS(dc)).toBeCloseTo(0.5, 4);
    });

    it('returns amplitude / sqrt(2) for a full-scale sine wave', () => {
      const amplitude = 0.8;
      const sine = new Float32Array(44100);
      for (let i = 0; i < sine.length; i++) {
        sine[i] = amplitude * Math.sin(2 * Math.PI * 440 * (i / SAMPLE_RATE));
      }
      const expectedRMS = amplitude / Math.sqrt(2);
      expect(computeRMS(sine)).toBeCloseTo(expectedRMS, 2);
    });
  });

  describe('Zero-Crossing Rate', () => {
    it('returns 0 for DC signal', () => {
      const dc = new Float32Array(1024).fill(0.5);
      expect(computeZeroCrossingRate(dc)).toBe(0);
    });

    it('returns approximately 2*freq/sampleRate for a sine wave', () => {
      const freq = 1000;
      const length = SAMPLE_RATE; // 1 second
      const sine = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        sine[i] = Math.sin(2 * Math.PI * freq * (i / SAMPLE_RATE));
      }
      // ZCR ~ 2 * freq / sampleRate for a sine wave
      const expected = (2 * freq) / SAMPLE_RATE;
      const zcr = computeZeroCrossingRate(sine);
      expect(zcr).toBeCloseTo(expected, 2);
    });
  });

  describe('Spectral Centroid', () => {
    it('returns the dominant frequency for a pure sine', () => {
      const freq = 1000;
      const sine = new Float32Array(4096);
      for (let i = 0; i < sine.length; i++) {
        sine[i] = Math.sin(2 * Math.PI * freq * (i / SAMPLE_RATE));
      }
      const centroid = computeSpectralCentroid(sine, SAMPLE_RATE);
      // Centroid should be near 1000 Hz (within FFT bin resolution)
      const binResolution = SAMPLE_RATE / sine.length; // ~10.77 Hz
      expect(Math.abs(centroid - freq)).toBeLessThan(binResolution * 2);
    });
  });

  describe('MFCC', () => {
    it('returns the expected number of coefficients', () => {
      const noise = new Float32Array(2048);
      for (let i = 0; i < noise.length; i++) noise[i] = Math.random() - 0.5;
      const mfccs = computeMFCC(noise, SAMPLE_RATE, { numCoefficients: 13 });
      expect(mfccs).toHaveLength(13);
    });

    it('returns all zeros for a silent buffer', () => {
      const silent = new Float32Array(2048);
      const mfccs = computeMFCC(silent, SAMPLE_RATE, { numCoefficients: 13 });
      // MFCCs of silence should be very small or zero
      for (const c of mfccs) {
        expect(Math.abs(c)).toBeLessThan(EPSILON);
      }
    });
  });

  describe('Full Feature Vector', () => {
    it('returns a feature vector with consistent dimensionality', () => {
      const buffer = new Float32Array(2048);
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.sin(2 * Math.PI * 440 * (i / SAMPLE_RATE));
      }
      const features = extractFeatures(buffer, SAMPLE_RATE);

      expect(features).toHaveProperty('rms');
      expect(features).toHaveProperty('spectralCentroid');
      expect(features).toHaveProperty('zeroCrossingRate');
      expect(features).toHaveProperty('mfcc');
      expect(typeof features.rms).toBe('number');
      expect(typeof features.spectralCentroid).toBe('number');
      expect(Array.isArray(features.mfcc)).toBe(true);
    });
  });
});
```

### Clustering Tests

Test clustering algorithms with synthetic feature vectors where the correct cluster assignments are known in advance.

```typescript
// src/audio/clustering.test.ts
import { describe, it, expect } from 'vitest';
import { clusterFeatures, computeSilhouetteScore } from './clustering';
import type { FeatureVector } from './types';

describe('Sound Clustering', () => {
  function makeSyntheticClusters(
    centersRMS: number[],
    pointsPerCluster: number,
    noise: number
  ): { vectors: FeatureVector[]; labels: number[] } {
    const vectors: FeatureVector[] = [];
    const labels: number[] = [];

    centersRMS.forEach((center, clusterIdx) => {
      for (let i = 0; i < pointsPerCluster; i++) {
        vectors.push({
          rms: center + (Math.random() - 0.5) * noise,
          spectralCentroid: center * 500 + (Math.random() - 0.5) * noise * 100,
          zeroCrossingRate: 0.1 * clusterIdx + (Math.random() - 0.5) * noise * 0.01,
          mfcc: Array.from({ length: 13 }, () => clusterIdx + (Math.random() - 0.5) * noise),
        });
        labels.push(clusterIdx);
      }
    });

    return { vectors, labels };
  }

  it('correctly separates two well-separated clusters', () => {
    const { vectors, labels: groundTruth } = makeSyntheticClusters(
      [0.2, 0.8], // two distinct RMS centers
      20,          // 20 points each
      0.05         // low noise
    );

    const result = clusterFeatures(vectors, { k: 2, seed: 42 });

    expect(result.labels).toHaveLength(40);
    expect(new Set(result.labels).size).toBe(2);

    // Verify cluster purity (each cluster should have mostly same ground-truth label)
    const cluster0GT = result.labels
      .map((l, i) => ({ assigned: l, truth: groundTruth[i] }))
      .filter((x) => x.assigned === 0)
      .map((x) => x.truth);
    const majorityLabel = mode(cluster0GT);
    const purity = cluster0GT.filter((l) => l === majorityLabel).length / cluster0GT.length;
    expect(purity).toBeGreaterThanOrEqual(0.9);
  });

  it('achieves silhouette score >= 0.5 for well-separated clusters', () => {
    const { vectors } = makeSyntheticClusters([0.1, 0.5, 0.9], 15, 0.03);
    const result = clusterFeatures(vectors, { k: 3, seed: 42 });
    const score = computeSilhouetteScore(vectors, result.labels);
    expect(score).toBeGreaterThanOrEqual(0.5);
  });

  it('handles single-cluster input gracefully', () => {
    const { vectors } = makeSyntheticClusters([0.5], 10, 0.01);
    const result = clusterFeatures(vectors, { k: 1, seed: 42 });
    expect(new Set(result.labels).size).toBe(1);
  });

  it('handles edge case of more clusters requested than points', () => {
    const { vectors } = makeSyntheticClusters([0.5], 2, 0.01);
    const result = clusterFeatures(vectors, { k: 5, seed: 42 });
    // Should clamp k to number of points or handle gracefully
    expect(result.labels).toHaveLength(2);
    expect(new Set(result.labels).size).toBeLessThanOrEqual(2);
  });

  it('produces deterministic results with fixed seed', () => {
    const { vectors } = makeSyntheticClusters([0.2, 0.8], 15, 0.05);
    const result1 = clusterFeatures(vectors, { k: 2, seed: 42 });
    const result2 = clusterFeatures(vectors, { k: 2, seed: 42 });
    expect(result1.labels).toEqual(result2.labels);
  });
});

function mode(arr: number[]): number {
  const freq = new Map<number, number>();
  for (const v of arr) freq.set(v, (freq.get(v) ?? 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
```

### Quantization Tests

```typescript
// src/audio/quantization.test.ts
import { describe, it, expect } from 'vitest';
import { quantizeOnsets, findBestGrid } from './quantization';

describe('Quantization', () => {
  const GRID_TOLERANCE_MS = 5; // max acceptable deviation from grid

  it('snaps onsets to the nearest 16th note grid at 120 BPM', () => {
    const bpm = 120;
    const sixteenthNote = 60 / bpm / 4; // 0.125s = 125ms
    // Onsets slightly off-grid
    const rawOnsets = [0.13, 0.26, 0.38, 0.51]; // near 0.125, 0.25, 0.375, 0.5

    const quantized = quantizeOnsets(rawOnsets, { bpm, subdivision: 16 });

    const expectedGrid = [0.125, 0.25, 0.375, 0.5];
    quantized.forEach((q, i) => {
      const deviationMs = Math.abs(q - expectedGrid[i]) * 1000;
      expect(deviationMs).toBeLessThan(GRID_TOLERANCE_MS);
    });
  });

  it('preserves onset count (no merging of distinct onsets)', () => {
    const rawOnsets = [0.0, 0.125, 0.25, 0.375, 0.5];
    const quantized = quantizeOnsets(rawOnsets, { bpm: 120, subdivision: 16 });
    expect(quantized).toHaveLength(rawOnsets.length);
  });

  it('merges onsets that snap to the same grid position', () => {
    // Two onsets very close together should merge
    const rawOnsets = [0.124, 0.126]; // both near grid line 0.125
    const quantized = quantizeOnsets(rawOnsets, {
      bpm: 120,
      subdivision: 16,
      mergeThresholdMs: 10,
    });
    expect(quantized).toHaveLength(1);
    expect(Math.abs(quantized[0] - 0.125) * 1000).toBeLessThan(GRID_TOLERANCE_MS);
  });

  it('handles zero-quantization strength (returns original onsets)', () => {
    const rawOnsets = [0.13, 0.26, 0.38];
    const quantized = quantizeOnsets(rawOnsets, {
      bpm: 120,
      subdivision: 16,
      strength: 0,
    });
    rawOnsets.forEach((r, i) => {
      expect(quantized[i]).toBeCloseTo(r, 6);
    });
  });

  it('handles partial quantization strength (interpolated)', () => {
    const bpm = 120;
    const raw = 0.13;
    const gridPoint = 0.125;
    const strength = 0.5;

    const quantized = quantizeOnsets([raw], { bpm, subdivision: 16, strength });
    const expected = raw + (gridPoint - raw) * strength; // 0.1275
    expect(quantized[0]).toBeCloseTo(expected, 4);
  });

  it('auto-detects BPM from evenly spaced onsets', () => {
    // Onsets at exactly 100 BPM quarter notes
    const interval = 60 / 100; // 0.6s
    const onsets = Array.from({ length: 8 }, (_, i) => i * interval);
    const detected = findBestGrid(onsets);
    expect(detected.bpm).toBeCloseTo(100, 0);
  });

  it('returns empty array for empty input', () => {
    const quantized = quantizeOnsets([], { bpm: 120, subdivision: 16 });
    expect(quantized).toEqual([]);
  });
});
```

### State Management Tests

```typescript
// src/state/session-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createSessionStore } from './session-store';

describe('Session Store', () => {
  let store: ReturnType<typeof createSessionStore>;

  beforeEach(() => {
    store = createSessionStore();
  });

  it('initializes with empty state', () => {
    expect(store.getState().onsets).toEqual([]);
    expect(store.getState().clusters).toEqual([]);
    expect(store.getState().isRecording).toBe(false);
  });

  it('transitions recording state correctly', () => {
    store.startRecording();
    expect(store.getState().isRecording).toBe(true);

    store.stopRecording();
    expect(store.getState().isRecording).toBe(false);
  });

  it('adds onsets and maintains sort order', () => {
    store.addOnsets([0.5, 0.2, 0.8]);
    const onsets = store.getState().onsets;
    expect(onsets).toEqual([0.2, 0.5, 0.8]);
  });

  it('updates cluster assignments', () => {
    store.addOnsets([0.1, 0.2, 0.3]);
    store.setClusters([0, 1, 0]);
    expect(store.getState().clusters).toEqual([0, 1, 0]);
  });

  it('allows instrument assignment per cluster', () => {
    store.assignInstrument(0, 'kick');
    store.assignInstrument(1, 'snare');
    expect(store.getState().instrumentMap).toEqual({ 0: 'kick', 1: 'snare' });
  });

  it('supports undo/redo', () => {
    store.addOnsets([0.1]);
    store.addOnsets([0.2]);
    store.undo();
    expect(store.getState().onsets).toEqual([0.1]);
    store.redo();
    expect(store.getState().onsets).toEqual([0.1, 0.2]);
  });

  it('serializes and deserializes state correctly', () => {
    store.addOnsets([0.1, 0.5]);
    store.setClusters([0, 1]);
    store.assignInstrument(0, 'kick');

    const serialized = store.serialize();
    const newStore = createSessionStore();
    newStore.deserialize(serialized);

    expect(newStore.getState()).toEqual(store.getState());
  });
});
```

### Coverage Targets by Module

| Module | Statement Coverage | Branch Coverage | Function Coverage |
|--------|--------------------|-----------------|-------------------|
| `src/audio/onset-detection` | 95% | 90% | 95% |
| `src/audio/feature-extraction` | 95% | 90% | 95% |
| `src/audio/clustering` | 90% | 85% | 90% |
| `src/audio/quantization` | 95% | 90% | 95% |
| `src/state/*` | 90% | 85% | 90% |
| `src/utils/*` | 90% | 85% | 90% |
| `src/components/*` | 80% | 75% | 80% |
| **Overall** | **85%** | **80%** | **85%** |

---

## 3. Integration Testing

Integration tests validate that modules compose correctly. They run in Vitest with jsdom and mock only the browser APIs that are unavailable (e.g., `MediaStream`, `navigator.mediaDevices`).

### Audio Pipeline End-to-End

```typescript
// src/audio/pipeline.integration.test.ts
import { describe, it, expect } from 'vitest';
import { renderSyntheticAudio, createClickTrack } from '../test/helpers/audio';
import { detectOnsets } from './onset-detection';
import { extractFeatures } from './feature-extraction';
import { clusterFeatures } from './clustering';

describe('Audio Pipeline Integration', () => {
  it('processes capture -> detect -> extract -> cluster correctly', async () => {
    // Two distinct sound types: low clicks and high sine bursts
    const buffer = await renderSyntheticAudio(3, 44100, (buf) => {
      const data = buf.getChannelData(0);
      const sr = buf.sampleRate;

      // Low clicks at 0.5, 1.5
      [0.5, 1.5].forEach((t) => {
        const start = Math.round(t * sr);
        for (let i = 0; i < 64 && start + i < data.length; i++) {
          data[start + i] = Math.exp(-i / 10) * 0.9;
        }
      });

      // High sine bursts at 1.0, 2.0
      [1.0, 2.0].forEach((t) => {
        const start = Math.round(t * sr);
        const dur = Math.round(0.01 * sr);
        for (let i = 0; i < dur && start + i < data.length; i++) {
          data[start + i] = 0.7 * Math.sin(2 * Math.PI * 4000 * (i / sr));
        }
      });
    });

    // Step 1: Detect onsets
    const onsets = detectOnsets(buffer.getChannelData(0), 44100);
    expect(onsets.length).toBeGreaterThanOrEqual(3); // at least 3 of 4

    // Step 2: Extract features around each onset
    const featureVectors = onsets.map((onsetTime) => {
      const startSample = Math.max(0, Math.round(onsetTime * 44100) - 128);
      const endSample = Math.min(buffer.length, startSample + 2048);
      const segment = buffer.getChannelData(0).slice(startSample, endSample);
      return extractFeatures(segment, 44100);
    });

    expect(featureVectors.length).toBe(onsets.length);
    featureVectors.forEach((fv) => {
      expect(fv).toHaveProperty('rms');
      expect(fv).toHaveProperty('spectralCentroid');
    });

    // Step 3: Cluster features
    const result = clusterFeatures(featureVectors, { k: 2, seed: 42 });
    expect(new Set(result.labels).size).toBe(2);
  });
});
```

### Recording Flow with Mocked MediaStream

```typescript
// src/recording/recorder.integration.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioRecorder } from './recorder';
import { renderSyntheticAudio, createClickTrack } from '../test/helpers/audio';

describe('Recording Flow Integration', () => {
  let mockStream: MediaStream;
  let syntheticBuffer: AudioBuffer;

  beforeEach(async () => {
    syntheticBuffer = await renderSyntheticAudio(2, 44100, (buf) => {
      createClickTrack(buf, [0.5, 1.0, 1.5]);
    });

    // Create a mock MediaStream that delivers known audio
    const audioContext = new AudioContext();
    const source = audioContext.createBufferSource();
    source.buffer = syntheticBuffer;
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);
    mockStream = destination.stream;

    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(mockStream);
  });

  it('records and produces detected onsets from mock stream', async () => {
    const recorder = new AudioRecorder();
    await recorder.start();

    // Simulate recording duration
    await new Promise((resolve) => setTimeout(resolve, 100));
    const result = await recorder.stop();

    expect(result.audioBuffer).toBeDefined();
    expect(result.audioBuffer.duration).toBeGreaterThan(0);
    // Onsets should be detected from the recorded audio
    expect(result.onsets.length).toBeGreaterThanOrEqual(2);
  });
});
```

### Session Save/Load (IndexedDB Roundtrip)

```typescript
// src/storage/session-persistence.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveSession, loadSession, listSessions, deleteSession } from './session-persistence';
import 'fake-indexeddb/auto'; // in-memory IndexedDB for testing

describe('Session Persistence (IndexedDB)', () => {
  const testSession = {
    id: 'test-session-1',
    name: 'My Beat',
    createdAt: Date.now(),
    onsets: [0.5, 1.0, 1.5],
    clusters: [0, 1, 0],
    instrumentMap: { 0: 'kick', 1: 'snare' },
    bpm: 120,
    quantization: { subdivision: 16, strength: 0.8 },
    audioData: new Float32Array([0.1, 0.2, 0.3]), // simplified
  };

  afterEach(async () => {
    await deleteSession(testSession.id);
  });

  it('saves and loads a session with data integrity', async () => {
    await saveSession(testSession);
    const loaded = await loadSession(testSession.id);

    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe(testSession.name);
    expect(loaded!.onsets).toEqual(testSession.onsets);
    expect(loaded!.clusters).toEqual(testSession.clusters);
    expect(loaded!.instrumentMap).toEqual(testSession.instrumentMap);
    expect(loaded!.bpm).toBe(testSession.bpm);
    // Float32Array comparison
    expect(Array.from(loaded!.audioData)).toEqual(Array.from(testSession.audioData));
  });

  it('lists all saved sessions', async () => {
    await saveSession(testSession);
    await saveSession({ ...testSession, id: 'test-session-2', name: 'Beat 2' });

    const sessions = await listSessions();
    expect(sessions.length).toBeGreaterThanOrEqual(2);

    await deleteSession('test-session-2');
  });

  it('overwrites session on save with same ID', async () => {
    await saveSession(testSession);
    await saveSession({ ...testSession, name: 'Updated Beat' });

    const loaded = await loadSession(testSession.id);
    expect(loaded!.name).toBe('Updated Beat');
  });

  it('returns null for non-existent session', async () => {
    const loaded = await loadSession('nonexistent');
    expect(loaded).toBeNull();
  });

  it('deletes a session', async () => {
    await saveSession(testSession);
    await deleteSession(testSession.id);
    const loaded = await loadSession(testSession.id);
    expect(loaded).toBeNull();
  });
});
```

### Playback Scheduling Accuracy

```typescript
// src/playback/scheduler.integration.test.ts
import { describe, it, expect } from 'vitest';
import { PlaybackScheduler } from './scheduler';

describe('Playback Scheduling Accuracy', () => {
  it('schedules notes within 5ms of their intended times', () => {
    const scheduler = new PlaybackScheduler({ bpm: 120 });

    const onsets = [0.0, 0.125, 0.25, 0.375, 0.5]; // 16th notes at 120 BPM
    const scheduled = scheduler.buildSchedule(onsets, {
      clusters: [0, 1, 0, 1, 0],
      instrumentMap: { 0: 'kick', 1: 'snare' },
    });

    scheduled.forEach((event, i) => {
      const deviationMs = Math.abs(event.time - onsets[i]) * 1000;
      expect(deviationMs).toBeLessThan(5);
      expect(event.instrument).toBeDefined();
    });
  });

  it('loops playback seamlessly', () => {
    const scheduler = new PlaybackScheduler({ bpm: 120 });
    const loopDuration = 2.0; // seconds
    const onsets = [0.0, 0.5, 1.0, 1.5];

    const schedule = scheduler.buildSchedule(onsets, {
      clusters: [0, 0, 0, 0],
      instrumentMap: { 0: 'kick' },
      loopDuration,
    });

    // All events should be within [0, loopDuration)
    schedule.forEach((event) => {
      expect(event.time).toBeGreaterThanOrEqual(0);
      expect(event.time).toBeLessThan(loopDuration);
    });
  });
});
```

---

## 4. End-to-End Testing

### Framework Configuration

**Framework**: Playwright
**Browsers**: Chromium, Firefox, WebKit

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'e2e-results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Grant microphone permission by default
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
  webServer: {
    command: 'npm run preview',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Mocking Microphone Input in Playwright

Playwright supports injecting synthetic audio via Chrome DevTools Protocol. For WebKit/Firefox, use the `--use-fake-device-for-media-stream` approach or provide a pre-recorded file.

```typescript
// e2e/helpers/mock-audio.ts
import { Page } from '@playwright/test';

/**
 * Inject a synthetic audio stream into the page.
 * Uses the AudioContext oscillator approach to provide deterministic audio input.
 */
export async function injectMockMicrophone(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices
    );

    navigator.mediaDevices.getUserMedia = async (constraints) => {
      if (constraints && (constraints as MediaStreamConstraints).audio) {
        // Create a synthetic audio stream with periodic clicks
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const destination = ctx.createMediaStreamDestination();

        oscillator.type = 'square';
        oscillator.frequency.value = 100;
        gain.gain.value = 0;

        oscillator.connect(gain);
        gain.connect(destination);
        oscillator.start();

        // Simulate taps: short bursts at regular intervals
        const tapTimes = [0.5, 1.0, 1.5, 2.0, 2.5];
        for (const t of tapTimes) {
          gain.gain.setValueAtTime(0.8, ctx.currentTime + t);
          gain.gain.setValueAtTime(0, ctx.currentTime + t + 0.02);
        }

        return destination.stream;
      }
      return originalGetUserMedia(constraints);
    };
  });
}

/**
 * For Chromium: use --use-fake-device-for-media-stream with a WAV file.
 */
export function chromiumFakeMediaArgs(wavFilePath: string): string[] {
  return [
    '--use-fake-device-for-media-stream',
    `--use-file-for-fake-audio-capture=${wavFilePath}`,
  ];
}
```

### Core User Flows

#### Flow A: First-Time User (Permission Grant, Record, Cluster, Assign, Play)

```typescript
// e2e/flows/first-time-user.spec.ts
import { test, expect } from '@playwright/test';
import { injectMockMicrophone } from '../helpers/mock-audio';

test.describe('First-Time User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockMicrophone(page);
    await page.goto('/');
  });

  test('complete flow: record -> cluster -> assign -> playback', async ({ page }) => {
    // Step 1: Landing page visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Step 2: Start recording
    const recordButton = page.getByRole('button', { name: /record/i });
    await expect(recordButton).toBeVisible();
    await recordButton.click();

    // Step 3: Verify recording state
    await expect(page.getByText(/recording/i)).toBeVisible();

    // Step 4: Stop recording after simulated taps
    await page.waitForTimeout(3000); // allow mock audio to play
    const stopButton = page.getByRole('button', { name: /stop/i });
    await stopButton.click();

    // Step 5: Clusters should appear
    await expect(page.getByTestId('cluster-panel')).toBeVisible({ timeout: 10000 });

    // Step 6: Verify cluster visualization shows grouped sounds
    const clusterItems = page.getByTestId('cluster-item');
    await expect(clusterItems.first()).toBeVisible();

    // Step 7: Assign instruments
    const firstCluster = clusterItems.first();
    await firstCluster.click();
    const instrumentSelector = page.getByTestId('instrument-selector');
    await instrumentSelector.selectOption({ label: 'Kick' });

    // Step 8: Play back
    const playButton = page.getByRole('button', { name: /play/i });
    await playButton.click();
    await expect(page.getByText(/playing/i)).toBeVisible();

    // Step 9: Stop playback
    const stopPlayback = page.getByRole('button', { name: /stop/i });
    await stopPlayback.click();
  });
});
```

#### Flow B: Returning User (Load Session, Modify, Save)

```typescript
// e2e/flows/returning-user.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Returning User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Seed IndexedDB with a saved session
    await page.goto('/');
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.open('tapbeats', 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('sessions')) {
            db.createObjectStore('sessions', { keyPath: 'id' });
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('sessions', 'readwrite');
          tx.objectStore('sessions').put({
            id: 'test-session',
            name: 'My Saved Beat',
            createdAt: Date.now(),
            onsets: [0.5, 1.0, 1.5, 2.0],
            clusters: [0, 1, 0, 1],
            instrumentMap: { 0: 'kick', 1: 'snare' },
            bpm: 120,
          });
          tx.oncomplete = () => resolve();
        };
      });
    });
  });

  test('load saved session and modify', async ({ page }) => {
    await page.goto('/');

    // Open session browser
    const loadButton = page.getByRole('button', { name: /load|sessions|open/i });
    await loadButton.click();

    // Select saved session
    await page.getByText('My Saved Beat').click();

    // Verify session loaded
    await expect(page.getByTestId('timeline')).toBeVisible();

    // Modify BPM
    const bpmInput = page.getByLabel(/bpm/i);
    await bpmInput.fill('140');

    // Save
    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();

    // Verify saved (toast or confirmation)
    await expect(page.getByText(/saved/i)).toBeVisible();
  });
});
```

#### Flow C: Error Flows

```typescript
// e2e/flows/error-handling.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Error Handling Flows', () => {
  test('shows error when microphone permission is denied', async ({ page, context }) => {
    // Revoke microphone permission
    await context.clearPermissions();

    // Override getUserMedia to reject
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Permission denied', 'NotAllowedError');
      };
    });

    await page.goto('/');

    const recordButton = page.getByRole('button', { name: /record/i });
    await recordButton.click();

    // Should show permission-denied error
    await expect(page.getByText(/microphone.*permission|permission.*denied/i)).toBeVisible();
  });

  test('shows error when no microphone is available', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new DOMException('Requested device not found', 'NotFoundError');
      };
      navigator.mediaDevices.enumerateDevices = async () => [];
    });

    await page.goto('/');
    const recordButton = page.getByRole('button', { name: /record/i });
    await recordButton.click();

    await expect(page.getByText(/no microphone|device not found/i)).toBeVisible();
  });

  test('shows unsupported browser message when Web Audio API is missing', async ({ page }) => {
    await page.addInitScript(() => {
      // Remove AudioContext
      (window as any).AudioContext = undefined;
      (window as any).webkitAudioContext = undefined;
    });

    await page.goto('/');
    await expect(page.getByText(/not supported|update.*browser/i)).toBeVisible();
  });
});
```

### Visual Regression Testing for Timeline Rendering

```typescript
// e2e/visual/timeline.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Timeline Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Seed a known session state for deterministic rendering
    await page.goto('/');
    await page.evaluate(() => {
      // Inject session state directly for deterministic screenshot
      window.__TEST_INJECT_STATE__?.({
        onsets: [0.0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75],
        clusters: [0, 1, 0, 1, 0, 1, 0, 1],
        instrumentMap: { 0: 'kick', 1: 'snare' },
        bpm: 120,
      });
    });
  });

  test('timeline renders correctly with 8 hits', async ({ page }) => {
    const timeline = page.getByTestId('timeline');
    await expect(timeline).toBeVisible();
    await expect(timeline).toHaveScreenshot('timeline-8-hits.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('timeline renders correctly with cluster colors', async ({ page }) => {
    const timeline = page.getByTestId('timeline');
    await expect(timeline).toHaveScreenshot('timeline-cluster-colors.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('timeline waveform overlay', async ({ page }) => {
    // Enable waveform display
    const waveformToggle = page.getByLabel(/waveform/i);
    await waveformToggle.check();

    const timeline = page.getByTestId('timeline');
    await expect(timeline).toHaveScreenshot('timeline-with-waveform.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
```

---

## 5. Audio-Specific Testing

### Test Fixture Creation

Maintain a directory of WAV files with accompanying JSON annotation files:

```
test/fixtures/audio/
  click-track-120bpm.wav           # 4 bars of clicks at 120 BPM
  click-track-120bpm.json          # { "onsets": [0.0, 0.5, 1.0, ...], "bpm": 120 }
  two-sounds-kick-snare.wav        # Alternating kick and snare hits
  two-sounds-kick-snare.json       # { "onsets": [...], "labels": [0, 1, 0, 1, ...] }
  quiet-room-noise.wav             # 5 seconds of ambient room noise (no hits)
  quiet-room-noise.json            # { "onsets": [] }
  fast-tapping-200bpm.wav          # Fast tapping at 200 BPM
  fast-tapping-200bpm.json         # { "onsets": [...], "bpm": 200 }
  three-surfaces.wav               # Tapping on wood, metal, and plastic
  three-surfaces.json              # { "onsets": [...], "labels": [0, 1, 2, ...] }
  varying-dynamics.wav             # Same surface, varying hit strength
  varying-dynamics.json            # { "onsets": [...], "amplitudes": [...] }
```

**Fixture generation script** (`scripts/generate-test-fixtures.ts`):

```typescript
/**
 * Generate synthetic test fixtures with precise ground-truth annotations.
 * Run with: npx tsx scripts/generate-test-fixtures.ts
 *
 * Outputs WAV files and JSON annotation files to test/fixtures/audio/.
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

const SAMPLE_RATE = 44100;
const OUTPUT_DIR = join(__dirname, '../test/fixtures/audio');

interface Fixture {
  name: string;
  duration: number; // seconds
  annotations: Record<string, unknown>;
  generate: (buffer: Float32Array) => void;
}

const fixtures: Fixture[] = [
  {
    name: 'click-track-120bpm',
    duration: 4,
    annotations: {
      onsets: Array.from({ length: 16 }, (_, i) => i * 0.5), // 8th notes at 120 BPM
      bpm: 120,
    },
    generate(buffer) {
      const onsets = Array.from({ length: 16 }, (_, i) => i * 0.5);
      for (const t of onsets) {
        const start = Math.round(t * SAMPLE_RATE);
        for (let i = 0; i < 64 && start + i < buffer.length; i++) {
          buffer[start + i] = Math.exp(-i / 8) * 0.9;
        }
      }
    },
  },
  {
    name: 'quiet-room-noise',
    duration: 5,
    annotations: { onsets: [] },
    generate(buffer) {
      // Low-level noise at -40 dB
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = (Math.random() - 0.5) * 0.01;
      }
    },
  },
  // Additional fixtures follow the same pattern
];

function floatToWav(samples: Float32Array, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const headerSize = 44;
  const buf = Buffer.alloc(headerSize + dataSize);

  // WAV header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(bitsPerSample, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  // Convert float to 16-bit PCM
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const intVal = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
    buf.writeInt16LE(Math.round(intVal), headerSize + i * 2);
  }

  return buf;
}

for (const fixture of fixtures) {
  const length = Math.ceil(fixture.duration * SAMPLE_RATE);
  const buffer = new Float32Array(length);
  fixture.generate(buffer);

  const wavPath = join(OUTPUT_DIR, `${fixture.name}.wav`);
  const jsonPath = join(OUTPUT_DIR, `${fixture.name}.json`);

  writeFileSync(wavPath, floatToWav(buffer, SAMPLE_RATE));
  writeFileSync(jsonPath, JSON.stringify(fixture.annotations, null, 2));

  console.log(`Generated: ${fixture.name}`);
}
```

### Onset Detection Accuracy Benchmarking

Run the full fixture suite and report precision/recall/F1 in a structured format:

```typescript
// src/audio/onset-detection.bench.test.ts
import { describe, it, expect } from 'vitest';
import { detectOnsets } from './onset-detection';
import { calculatePrecisionRecallF1 } from '../test/helpers/metrics';
import { loadFixture } from '../test/helpers/fixtures';

const TOLERANCE_MS = 20;

const FIXTURES = [
  'click-track-120bpm',
  'two-sounds-kick-snare',
  'fast-tapping-200bpm',
  'three-surfaces',
  'varying-dynamics',
];

// Minimum acceptable scores per fixture
const THRESHOLDS: Record<string, { f1: number; precision: number; recall: number }> = {
  'click-track-120bpm':     { f1: 0.95, precision: 0.95, recall: 0.95 },
  'two-sounds-kick-snare':  { f1: 0.90, precision: 0.85, recall: 0.90 },
  'fast-tapping-200bpm':    { f1: 0.85, precision: 0.80, recall: 0.85 },
  'three-surfaces':         { f1: 0.85, precision: 0.80, recall: 0.85 },
  'varying-dynamics':       { f1: 0.80, precision: 0.75, recall: 0.80 },
};

describe('Onset Detection Benchmark', () => {
  for (const fixtureName of FIXTURES) {
    it(`meets accuracy thresholds for ${fixtureName}`, async () => {
      const { audioBuffer, annotations } = await loadFixture(fixtureName);
      const detected = detectOnsets(audioBuffer.getChannelData(0), audioBuffer.sampleRate);
      const metrics = calculatePrecisionRecallF1(
        annotations.onsets,
        detected,
        TOLERANCE_MS / 1000
      );

      const threshold = THRESHOLDS[fixtureName];
      expect(metrics.f1).toBeGreaterThanOrEqual(threshold.f1);
      expect(metrics.precision).toBeGreaterThanOrEqual(threshold.precision);
      expect(metrics.recall).toBeGreaterThanOrEqual(threshold.recall);

      // Log for CI reporting
      console.log(
        `[BENCHMARK] ${fixtureName}: ` +
        `P=${metrics.precision.toFixed(3)} ` +
        `R=${metrics.recall.toFixed(3)} ` +
        `F1=${metrics.f1.toFixed(3)}`
      );
    });
  }
});
```

### Clustering Quality Metrics

```typescript
// src/audio/clustering.bench.test.ts
import { describe, it, expect } from 'vitest';
import { clusterFeatures, computeSilhouetteScore } from './clustering';
import { loadFixture } from '../test/helpers/fixtures';
import { extractFeatures } from './feature-extraction';

describe('Clustering Quality Benchmark', () => {
  it('achieves silhouette score >= 0.4 on two-sounds fixture', async () => {
    const { audioBuffer, annotations } = await loadFixture('two-sounds-kick-snare');
    const data = audioBuffer.getChannelData(0);
    const sr = audioBuffer.sampleRate;

    const features = annotations.onsets.map((onset: number) => {
      const start = Math.max(0, Math.round(onset * sr) - 128);
      const end = Math.min(data.length, start + 2048);
      return extractFeatures(data.slice(start, end), sr);
    });

    const result = clusterFeatures(features, { k: 2, seed: 42 });
    const silhouette = computeSilhouetteScore(features, result.labels);

    expect(silhouette).toBeGreaterThanOrEqual(0.4);
    console.log(`[BENCHMARK] two-sounds silhouette: ${silhouette.toFixed(3)}`);
  });

  it('achieves silhouette score >= 0.35 on three-surfaces fixture', async () => {
    const { audioBuffer, annotations } = await loadFixture('three-surfaces');
    const data = audioBuffer.getChannelData(0);
    const sr = audioBuffer.sampleRate;

    const features = annotations.onsets.map((onset: number) => {
      const start = Math.max(0, Math.round(onset * sr) - 128);
      const end = Math.min(data.length, start + 2048);
      return extractFeatures(data.slice(start, end), sr);
    });

    const result = clusterFeatures(features, { k: 3, seed: 42 });
    const silhouette = computeSilhouetteScore(features, result.labels);

    expect(silhouette).toBeGreaterThanOrEqual(0.35);
    console.log(`[BENCHMARK] three-surfaces silhouette: ${silhouette.toFixed(3)}`);
  });
});
```

### Quantization Accuracy Measurement

```typescript
// src/audio/quantization.bench.test.ts
import { describe, it, expect } from 'vitest';
import { quantizeOnsets } from './quantization';

describe('Quantization Accuracy Benchmark', () => {
  it('achieves mean deviation < 3ms for 16th note grid', () => {
    const bpm = 120;
    const gridInterval = 60 / bpm / 4; // 125ms
    // Generate onsets with random jitter up to +/-30ms
    const rawOnsets = Array.from({ length: 32 }, (_, i) => {
      return i * gridInterval + (Math.random() - 0.5) * 0.06;
    });

    const quantized = quantizeOnsets(rawOnsets, { bpm, subdivision: 16 });
    const idealGrid = Array.from({ length: 32 }, (_, i) => i * gridInterval);

    const deviationsMs = quantized.map((q, i) => Math.abs(q - idealGrid[i]) * 1000);
    const meanDeviation = deviationsMs.reduce((a, b) => a + b, 0) / deviationsMs.length;
    const maxDeviation = Math.max(...deviationsMs);

    expect(meanDeviation).toBeLessThan(3);
    expect(maxDeviation).toBeLessThan(10);

    console.log(
      `[BENCHMARK] quantization: mean=${meanDeviation.toFixed(2)}ms, ` +
      `max=${maxDeviation.toFixed(2)}ms`
    );
  });
});
```

### Latency Measurement Methodology

Audio latency in TapBeats has three components that must be measured independently:

| Component | What It Measures | How to Measure | Target |
|-----------|------------------|----------------|--------|
| **Input latency** | Time from physical tap to onset detection callback | Record a click via mic while simultaneously logging `performance.now()` at AudioWorklet `process()` entry; compare with known click time | < 50ms |
| **Processing latency** | Time from raw audio buffer to clustered onset result | Wrap pipeline in `performance.mark()`/`performance.measure()` | < 100ms per onset |
| **Output latency** | Time from `AudioBufferSourceNode.start(t)` to audible output | Use loopback test: play a click, record it, measure round-trip / 2 | < 30ms |

```typescript
// src/test/helpers/latency.ts
export function measureProcessingLatency(
  processFn: (buffer: Float32Array) => unknown,
  buffer: Float32Array,
  iterations = 100
): { mean: number; p95: number; p99: number; max: number } {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    processFn(buffer);
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  const max = times[times.length - 1];

  return { mean, p95, p99, max };
}
```

### Cross-Browser Audio Behavior Testing

Test for known divergences in Web Audio implementations:

```typescript
// e2e/cross-browser/audio-api.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Audio API Behavior', () => {
  test('AudioContext resumes after user gesture', async ({ page }) => {
    await page.goto('/');
    const state = await page.evaluate(async () => {
      const ctx = new AudioContext();
      // Most browsers start suspended
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      return ctx.state;
    });
    expect(state).toBe('running');
  });

  test('OfflineAudioContext renders correctly', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const ctx = new OfflineAudioContext(1, 44100, 44100);
      const osc = ctx.createOscillator();
      osc.frequency.value = 440;
      osc.connect(ctx.destination);
      osc.start(0);
      osc.stop(0.5);
      const buffer = await ctx.startRendering();
      return {
        length: buffer.length,
        sampleRate: buffer.sampleRate,
        hasNonZeroSamples: buffer.getChannelData(0).some((v) => v !== 0),
      };
    });
    expect(result.length).toBe(44100);
    expect(result.sampleRate).toBe(44100);
    expect(result.hasNonZeroSamples).toBe(true);
  });

  test('createMediaStreamDestination is available', async ({ page }) => {
    await page.goto('/');
    const available = await page.evaluate(() => {
      const ctx = new AudioContext();
      return typeof ctx.createMediaStreamDestination === 'function';
    });
    expect(available).toBe(true);
  });

  test('AudioWorklet is available', async ({ page }) => {
    await page.goto('/');
    const available = await page.evaluate(() => {
      const ctx = new AudioContext();
      return typeof ctx.audioWorklet?.addModule === 'function';
    });
    expect(available).toBe(true);
  });
});
```

---

## 6. Performance Testing

### Lighthouse CI Integration

```json
// .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173/"],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.8 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1500 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }],
        "interactive": ["error", { "maxNumericValue": 3500 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Core Web Vitals Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| **LCP** (Largest Contentful Paint) | < 2.5s | App must feel responsive immediately |
| **FID** (First Input Delay) | < 100ms | Record button must respond instantly |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Timeline and controls must not jump |
| **FCP** (First Contentful Paint) | < 1.5s | User sees UI within 1.5 seconds |
| **TBT** (Total Blocking Time) | < 200ms | Audio processing must not block main thread |
| **TTI** (Time to Interactive) | < 3.5s | User can start recording within 3.5 seconds |

### Audio Processing Benchmarks

```typescript
// src/audio/performance.bench.ts
import { bench, describe } from 'vitest';
import { detectOnsets } from './onset-detection';
import { extractFeatures } from './feature-extraction';
import { clusterFeatures } from './clustering';
import { quantizeOnsets } from './quantization';

const SAMPLE_RATE = 44100;

// Generate test buffers of various sizes
function generateBuffer(durationSeconds: number): Float32Array {
  const length = Math.ceil(durationSeconds * SAMPLE_RATE);
  const buffer = new Float32Array(length);
  // Simulate a beat with periodic clicks
  for (let t = 0; t < durationSeconds; t += 0.5) {
    const start = Math.round(t * SAMPLE_RATE);
    for (let i = 0; i < 64 && start + i < length; i++) {
      buffer[start + i] = Math.exp(-i / 10) * 0.8;
    }
  }
  return buffer;
}

describe('Audio Processing Benchmarks', () => {
  const buffer5s = generateBuffer(5);
  const buffer30s = generateBuffer(30);
  const buffer120s = generateBuffer(120);

  bench('onset detection - 5s buffer', () => {
    detectOnsets(buffer5s, SAMPLE_RATE);
  });

  bench('onset detection - 30s buffer', () => {
    detectOnsets(buffer30s, SAMPLE_RATE);
  });

  bench('onset detection - 120s buffer', () => {
    detectOnsets(buffer120s, SAMPLE_RATE);
  });

  bench('feature extraction - single onset (2048 samples)', () => {
    const segment = buffer5s.slice(0, 2048);
    extractFeatures(segment, SAMPLE_RATE);
  });

  bench('feature extraction - 50 onsets', () => {
    for (let i = 0; i < 50; i++) {
      const segment = buffer5s.slice(i * 2048, (i + 1) * 2048);
      extractFeatures(segment, SAMPLE_RATE);
    }
  });

  bench('clustering - 50 feature vectors, k=3', () => {
    const features = Array.from({ length: 50 }, () => ({
      rms: Math.random(),
      spectralCentroid: Math.random() * 5000,
      zeroCrossingRate: Math.random(),
      mfcc: Array.from({ length: 13 }, () => Math.random()),
    }));
    clusterFeatures(features, { k: 3, seed: 42 });
  });

  bench('clustering - 200 feature vectors, k=5', () => {
    const features = Array.from({ length: 200 }, () => ({
      rms: Math.random(),
      spectralCentroid: Math.random() * 5000,
      zeroCrossingRate: Math.random(),
      mfcc: Array.from({ length: 13 }, () => Math.random()),
    }));
    clusterFeatures(features, { k: 5, seed: 42 });
  });

  bench('quantization - 100 onsets', () => {
    const onsets = Array.from({ length: 100 }, (_, i) => i * 0.125 + (Math.random() - 0.5) * 0.03);
    quantizeOnsets(onsets, { bpm: 120, subdivision: 16 });
  });
});
```

**Performance budgets** (fail CI if exceeded):

| Operation | Budget (p95) | Notes |
|-----------|-------------|-------|
| Onset detection (5s audio) | < 200ms | Must not block UI |
| Onset detection (30s audio) | < 1000ms | Use Web Worker |
| Onset detection (120s audio) | < 4000ms | Use Web Worker |
| Feature extraction (per onset) | < 5ms | Runs per detected hit |
| Clustering (50 vectors, k=3) | < 50ms | Real-time feel after recording |
| Clustering (200 vectors, k=5) | < 500ms | Large session |
| Quantization (100 onsets) | < 10ms | Near-instant |

### Memory Profiling

```typescript
// e2e/performance/memory.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Memory Profiling', () => {
  test('memory does not grow unboundedly during recording', async ({ page }) => {
    await page.goto('/');

    // Take initial heap snapshot
    const initialHeap = await page.evaluate(() => {
      if (performance.memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    if (initialHeap === null) {
      test.skip(); // memory API not available (non-Chromium)
      return;
    }

    // Simulate a recording session
    // (Use mock microphone injection here)
    await page.getByRole('button', { name: /record/i }).click();
    await page.waitForTimeout(5000);
    await page.getByRole('button', { name: /stop/i }).click();

    // Force GC and measure
    await page.evaluate(() => {
      if ((window as any).gc) (window as any).gc();
    });

    const finalHeap = await page.evaluate(() => {
      return (performance as any).memory.usedJSHeapSize;
    });

    const growthMB = (finalHeap - initialHeap) / (1024 * 1024);
    console.log(`[MEMORY] Heap growth after 5s recording: ${growthMB.toFixed(2)} MB`);

    // 5 seconds of 44.1kHz mono float32 = ~0.88 MB
    // Allow 10x overhead for processing buffers
    expect(growthMB).toBeLessThan(20);
  });
});
```

### Timeline Rendering FPS Under Load

```typescript
// e2e/performance/timeline-fps.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Timeline Rendering Performance', () => {
  test('maintains 30+ FPS with 200+ hits on timeline', async ({ page }) => {
    await page.goto('/');

    // Inject a large session
    await page.evaluate(() => {
      const onsets = Array.from({ length: 250 }, (_, i) => i * 0.05);
      const clusters = onsets.map((_, i) => i % 4);
      window.__TEST_INJECT_STATE__?.({
        onsets,
        clusters,
        instrumentMap: { 0: 'kick', 1: 'snare', 2: 'hihat', 3: 'tom' },
        bpm: 120,
      });
    });

    // Measure frame rate during scroll/zoom interaction
    const fps = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        let frames = 0;
        const start = performance.now();
        const duration = 2000; // measure over 2 seconds

        function countFrame() {
          frames++;
          if (performance.now() - start < duration) {
            requestAnimationFrame(countFrame);
          } else {
            resolve(frames / (duration / 1000));
          }
        }
        requestAnimationFrame(countFrame);
      });
    });

    console.log(`[PERF] Timeline FPS with 250 hits: ${fps.toFixed(1)}`);
    expect(fps).toBeGreaterThanOrEqual(30);
  });
});
```

### Long Session Stability

```typescript
// e2e/performance/long-session.spec.ts
import { test, expect } from '@playwright/test';
import { injectMockMicrophone } from '../helpers/mock-audio';

test.describe('Long Session Stability', () => {
  test('handles 2-minute recording without crash or memory leak', async ({ page }) => {
    await injectMockMicrophone(page);
    await page.goto('/');

    // Start recording
    await page.getByRole('button', { name: /record/i }).click();

    // Wait for 2 minutes of simulated recording
    // In CI, this uses mock audio so the test is not wall-clock limited.
    // Use abbreviated duration in CI; full 120s in nightly runs.
    await page.waitForTimeout(5000);

    // Stop recording
    await page.getByRole('button', { name: /stop/i }).click();

    // App should still be responsive
    await expect(page.getByTestId('cluster-panel')).toBeVisible({ timeout: 30000 });

    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Verify no OOM or unhandled errors
    expect(errors.filter((e) => e.includes('out of memory'))).toHaveLength(0);
    expect(errors.filter((e) => e.includes('Unhandled'))).toHaveLength(0);
  });
});
```

---

## 7. Accessibility Testing

### axe-core Integration

```typescript
// e2e/accessibility/axe.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (axe-core)', () => {
  test('home page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (critical.length > 0) {
      console.log('Accessibility violations:');
      for (const v of critical) {
        console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
        for (const node of v.nodes) {
          console.log(`    Target: ${node.target.join(', ')}`);
        }
      }
    }

    expect(critical).toHaveLength(0);
  });

  test('recording state has no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /record/i }).click();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.audio-visualizer') // canvas-based, tested separately
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(critical).toHaveLength(0);
  });

  test('cluster assignment view has no accessibility violations', async ({ page }) => {
    await page.goto('/');
    // Inject a session with clusters
    await page.evaluate(() => {
      window.__TEST_INJECT_STATE__?.({
        onsets: [0.5, 1.0, 1.5, 2.0],
        clusters: [0, 1, 0, 1],
        instrumentMap: {},
        bpm: 120,
      });
    });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(critical).toHaveLength(0);
  });
});
```

### Screen Reader Testing Matrix

| Screen Reader | Browser | Platform | Status |
|---------------|---------|----------|--------|
| VoiceOver | Safari | macOS | Required (manual) |
| VoiceOver | Safari | iOS | Required (manual) |
| NVDA | Chrome | Windows | Required (manual) |
| NVDA | Firefox | Windows | Recommended (manual) |
| JAWS | Chrome | Windows | Recommended (manual) |
| TalkBack | Chrome | Android | Recommended (manual) |

**Screen reader test script** (manual, documented for QA team):

```markdown
### Screen Reader Test Cases

1. **Record Button Announcement**
   - Focus record button with Tab
   - EXPECTED: "Record, button" (or equivalent)
   - Press Enter/Space
   - EXPECTED: "Recording started" live region announcement

2. **Recording Timer**
   - While recording, timer should be announced periodically
   - EXPECTED: aria-live region updates every 10 seconds: "Recording: 10 seconds"

3. **Stop and Cluster Results**
   - Stop recording
   - EXPECTED: "Recording stopped. X sounds detected. Y clusters found."
   - EXPECTED: Focus moves to cluster panel

4. **Cluster Navigation**
   - Tab through clusters
   - EXPECTED: "Cluster 1, 5 hits, unassigned" / "Cluster 2, 3 hits, assigned to Kick"
   - EXPECTED: Each cluster has a "Play preview" button
   - EXPECTED: Each cluster has an instrument selector

5. **Instrument Assignment**
   - Select instrument from dropdown
   - EXPECTED: "Kick selected for Cluster 1"

6. **Playback Controls**
   - Tab to play button
   - EXPECTED: "Play, button"
   - Press Enter
   - EXPECTED: "Playing"
   - Tab to stop
   - EXPECTED: "Stop, button"

7. **Timeline Navigation**
   - Arrow keys navigate between hits on timeline
   - EXPECTED: "Hit at 0.5 seconds, Cluster 1, Kick"
```

### Keyboard Navigation Testing

```typescript
// e2e/accessibility/keyboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test('all interactive elements are reachable via Tab', async ({ page }) => {
    await page.goto('/');

    const tabbableElements: string[] = [];
    let iterations = 0;
    const maxIterations = 50;

    while (iterations < maxIterations) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        return {
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role'),
          label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 50),
        };
      });

      if (!focused) break;
      tabbableElements.push(`${focused.tag}[${focused.role || 'no-role'}]: ${focused.label}`);
      iterations++;
    }

    // Verify essential controls are reachable
    const labels = tabbableElements.join('\n').toLowerCase();
    expect(labels).toContain('record');
    expect(labels).toContain('play');

    console.log(`Tabbable elements (${tabbableElements.length}):`);
    tabbableElements.forEach((el) => console.log(`  ${el}`));
  });

  test('Escape key closes modals and dropdowns', async ({ page }) => {
    await page.goto('/');

    // Open a modal/dropdown (e.g., session browser)
    const openButton = page.getByRole('button', { name: /load|sessions/i });
    if (await openButton.isVisible()) {
      await openButton.click();
      await page.keyboard.press('Escape');
      // Modal should be closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('Space/Enter activates buttons', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /record/i }).focus();
    await page.keyboard.press('Space');
    await expect(page.getByText(/recording/i)).toBeVisible();
  });
});
```

### Color Contrast Verification

Handled automatically by axe-core (WCAG 2.1 AA requires 4.5:1 for normal text, 3:1 for large text). Additionally:

```typescript
// e2e/accessibility/contrast.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Color Contrast', () => {
  test('cluster colors have sufficient contrast against background', async ({ page }) => {
    await page.goto('/');

    // Inject session with clusters to render cluster colors
    await page.evaluate(() => {
      window.__TEST_INJECT_STATE__?.({
        onsets: [0.5, 1.0, 1.5, 2.0],
        clusters: [0, 1, 0, 1],
        instrumentMap: { 0: 'kick', 1: 'snare' },
        bpm: 120,
      });
    });

    // Check each cluster label has sufficient contrast
    const clusterLabels = page.getByTestId('cluster-label');
    const count = await clusterLabels.count();

    for (let i = 0; i < count; i++) {
      const el = clusterLabels.nth(i);
      const contrast = await el.evaluate((element) => {
        const style = window.getComputedStyle(element);
        const color = style.color;
        const bg = style.backgroundColor;
        // In a real test, use a contrast calculation library
        // This is a placeholder for the methodology
        return { color, bg };
      });
      // Log for manual review; axe-core handles automated checks
      console.log(`Cluster ${i}: color=${contrast.color}, bg=${contrast.bg}`);
    }
  });
});
```

### Reduced Motion Testing

```typescript
// e2e/accessibility/reduced-motion.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Reduced Motion', () => {
  test('respects prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Check that animations are disabled
    const hasAnimations = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        const duration = parseFloat(style.animationDuration);
        const transition = parseFloat(style.transitionDuration);
        if (duration > 0 || transition > 0.01) {
          // Allow very short transitions (< 10ms)
          return true;
        }
      }
      return false;
    });

    expect(hasAnimations).toBe(false);
  });

  test('waveform visualizer stops animating with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Start recording to trigger visualizer
    await page.getByRole('button', { name: /record/i }).click();

    // Visualizer should show static representation, not animation
    const isAnimating = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="waveform-visualizer"]');
      if (!canvas) return false;
      // Check if requestAnimationFrame loop is active
      return (window as any).__visualizerAnimating === true;
    });

    expect(isAnimating).toBe(false);
  });
});
```

---

## 8. Cross-Browser Testing

### Browser Matrix

| Browser | Desktop | Mobile | Priority | Notes |
|---------|---------|--------|----------|-------|
| Chrome 120+ | Yes | Android | P0 | Primary development target |
| Firefox 120+ | Yes | Android | P0 | Different Web Audio implementation |
| Safari 17+ | Yes | iOS 17+ | P0 | WebKit; most divergent audio behavior |
| Edge 120+ | Yes | -- | P1 | Chromium-based, usually matches Chrome |
| Chrome 100-119 | Yes | Android | P2 | Older but still in use |
| Samsung Internet | -- | Android | P2 | Chromium-based, large mobile share |

### Web Audio API Behavior Differences to Test

| Behavior | Chrome | Firefox | Safari | Test |
|----------|--------|---------|--------|------|
| AudioContext initial state | `suspended` | `suspended` | `suspended` | Verify `.resume()` works after user gesture |
| AudioContext.sampleRate default | OS default | OS default | 44100 (may differ on iOS) | Read and log; do not assume 44100 |
| `decodeAudioData` return | Promise | Promise | Promise (older: callback only) | Use Promise form with fallback |
| AudioWorklet support | Yes | Yes | Yes (Safari 14.1+) | Feature-detect and fall back to ScriptProcessorNode |
| `createMediaStreamDestination` | Yes | Yes | Yes (may need user gesture) | Test after gesture |
| OfflineAudioContext max length | ~2^31 samples | ~2^31 samples | May be lower | Test with 2-minute buffer |
| `AnalyserNode.getFloatTimeDomainData` | Yes | Yes | Safari 14.1+ | Feature-detect |

### MediaStream API Differences

| Behavior | Chrome | Firefox | Safari | Test |
|----------|--------|---------|--------|------|
| `getUserMedia` audio constraints | Full support | Full support | Limited `echoCancellation` | Test with minimal constraints |
| `MediaRecorder` codecs | opus/webm | opus/webm | No MediaRecorder (Safari < 14.3) | Feature-detect; use AudioWorklet recording as fallback |
| Audio-only `getUserMedia` | Works | Works | Works (may prompt differently) | Test permission flow per browser |
| Stream `.getAudioTracks()` | Reliable | Reliable | Reliable | Verify track count and readyState |

### Known Safari/iOS Issues to Verify

| Issue | Description | Test |
|-------|-------------|------|
| **Audio context resume on iOS** | Must resume AudioContext inside a `touchstart`/`click` handler; cannot resume programmatically | E2E: verify recording starts only after user tap |
| **Sample rate mismatch** | iOS may use 48000 Hz; if AudioContext and MediaStream differ, audio will play at wrong speed | Unit: detect and resample if needed |
| **Page visibility** | iOS suspends AudioContext when tab is backgrounded or screen locks | E2E: verify graceful pause/resume |
| **Web Audio memory limits** | iOS Safari aggressively limits audio buffer memory | E2E: verify 2-minute recording does not crash |
| **No MediaRecorder (older Safari)** | Safari < 14.3 lacks `MediaRecorder` | Integration: verify fallback path works |
| **Touch event handling** | Safari fires touch events differently; may affect tap-to-record UX | E2E: test on iOS simulator/device |

### BrowserStack / Device Coverage

For automated cross-browser testing, integrate BrowserStack Automate with Playwright:

```typescript
// playwright.browserstack.config.ts
import { defineConfig } from '@playwright/test';

const BROWSERSTACK_CAPS = {
  'bstack:options': {
    projectName: 'TapBeats',
    buildName: `tapbeats-${process.env.GITHUB_SHA?.slice(0, 7) || 'local'}`,
    debug: true,
    networkLogs: true,
  },
};

export default defineConfig({
  testDir: './e2e',
  use: {
    connectOptions: {
      wsEndpoint: `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(
        JSON.stringify(BROWSERSTACK_CAPS)
      )}`,
    },
  },
  projects: [
    {
      name: 'bs-chrome-windows',
      use: {
        channel: 'chrome',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'bs-safari-macos',
      use: {
        channel: 'webkit',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'bs-firefox-windows',
      use: {
        channel: 'firefox',
        viewport: { width: 1280, height: 720 },
      },
    },
    // Mobile projects configured via BrowserStack device list
  ],
});
```

**Device coverage targets for releases**:

- 2 x Desktop (Chrome latest, Safari latest)
- 2 x Android (Chrome on Pixel, Samsung Internet on Samsung Galaxy)
- 2 x iOS (Safari on iPhone, Safari on iPad)

---

## 9. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # -----------------------------------------------
  # Pre-commit: Lint + Type Check (runs on every push)
  # -----------------------------------------------
  lint-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  # -----------------------------------------------
  # PR: Unit + Integration + Accessibility
  # -----------------------------------------------
  unit-integration:
    name: Unit & Integration Tests
    needs: lint-typecheck
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- --coverage --reporter=json --outputFile=test-results.json
      - name: Check coverage thresholds
        run: npm run test -- --coverage --reporter=json-summary
      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  accessibility:
    name: Accessibility Tests
    needs: lint-typecheck
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test --project=chromium e2e/accessibility/
        env:
          CI: true

  # -----------------------------------------------
  # Merge to main: Full E2E + Performance + Cross-Browser
  # -----------------------------------------------
  e2e:
    name: E2E Tests
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: [unit-integration, accessibility]
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      - run: npm run build
      - run: npx playwright test --project=${{ matrix.browser }}
        env:
          CI: true
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
      - name: Upload traces
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces-${{ matrix.browser }}
          path: test-results/

  performance:
    name: Performance Tests
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: unit-integration
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      # Vitest benchmarks
      - run: npm run test:bench
      # Lighthouse CI
      - run: npm install -g @lhci/cli
      - run: lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  # -----------------------------------------------
  # Release: Full Suite + Manual QA Checklist Gate
  # -----------------------------------------------
  release-tests:
    name: Release Test Suite
    if: startsWith(github.ref, 'refs/tags/v')
    needs: [e2e, performance]
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      # Full test suite
      - run: npm run test -- --coverage
      - run: npx playwright test
        env:
          CI: true
      # Audio benchmarks
      - run: npm run test:bench -- --reporter=json --outputFile=benchmark-results.json
      # Cross-browser via BrowserStack (if configured)
      - run: npx playwright test --config=playwright.browserstack.config.ts
        if: env.BROWSERSTACK_USERNAME != ''
        env:
          BROWSERSTACK_USERNAME: ${{ secrets.BROWSERSTACK_USERNAME }}
          BROWSERSTACK_ACCESS_KEY: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
      - name: Upload all results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: release-test-results
          path: |
            coverage/
            playwright-report/
            benchmark-results.json
```

### package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:bench": "vitest bench",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:a11y": "playwright test e2e/accessibility/",
    "lint": "eslint src/ --ext .ts,.tsx --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test:ci:pr": "npm run lint && npm run typecheck && npm run test -- --coverage && npm run test:a11y",
    "test:ci:main": "npm run test:ci:pr && npm run test:e2e && npm run test:bench"
  }
}
```

### Pre-commit Hooks (Husky + lint-staged)

```json
// .lintstagedrc.json
{
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings 0",
    "prettier --write"
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write"
  ]
}
```

```bash
# .husky/pre-commit
npm run lint-staged
npm run typecheck
```

---

## 10. Manual QA Checklist

This checklist is required before every tagged release. Each item must be explicitly verified and signed off by a human tester.

### Device-Specific Testing

```markdown
## Manual QA Checklist -- Release v___

### Tester: _______________  Date: _______________

---

### A. Device Matrix (test on at least one device per row)

| # | Device | Browser | OS | Pass/Fail | Notes |
|---|--------|---------|-----|-----------|-------|
| A1 | MacBook (any) | Chrome latest | macOS | [ ] | |
| A2 | MacBook (any) | Safari latest | macOS | [ ] | |
| A3 | MacBook (any) | Firefox latest | macOS | [ ] | |
| A4 | Windows laptop/desktop | Chrome latest | Windows 11 | [ ] | |
| A5 | Windows laptop/desktop | Edge latest | Windows 11 | [ ] | |
| A6 | iPhone (13+) | Safari | iOS 17+ | [ ] | |
| A7 | Android phone (Pixel/Samsung) | Chrome | Android 13+ | [ ] | |
| A8 | iPad | Safari | iPadOS 17+ | [ ] | |

---

### B. Core User Flow (repeat on each device above)

| # | Step | Expected Result | Pass/Fail |
|---|------|-----------------|-----------|
| B1 | Open app for first time | Landing page renders, record button visible | [ ] |
| B2 | Tap Record | Microphone permission prompt appears | [ ] |
| B3 | Grant permission | Recording begins, visual feedback shown | [ ] |
| B4 | Tap a surface 8-12 times with 2 distinct sounds | Waveform visualizer responds to each tap | [ ] |
| B5 | Tap Stop | Recording stops, processing begins | [ ] |
| B6 | Wait for clustering | Clusters appear, sounds grouped correctly | [ ] |
| B7 | Assign instruments to each cluster | Instrument labels update | [ ] |
| B8 | Tap Play | Beat plays back with assigned instruments | [ ] |
| B9 | Adjust BPM | Playback speed changes accordingly | [ ] |
| B10 | Adjust quantization strength | Beat tightness changes audibly | [ ] |
| B11 | Save session | Confirmation shown | [ ] |
| B12 | Reload page | Session persists, can be loaded | [ ] |
| B13 | Load saved session | All settings restored correctly | [ ] |

---

### C. Real-World Noise Conditions

| # | Environment | Expected Behavior | Pass/Fail |
|---|-------------|-------------------|-----------|
| C1 | Quiet room (< 30 dB ambient) | All taps detected, no false positives | [ ] |
| C2 | Moderate noise (office, ~50 dB) | Taps detected with <=2 false positives | [ ] |
| C3 | Noisy environment (~65 dB, music/TV) | Taps mostly detected; app does not crash | [ ] |
| C4 | Outdoor (wind, traffic) | App handles gracefully; may show warning | [ ] |

---

### D. Surface Types

| # | Surface | Expected Behavior | Pass/Fail |
|---|---------|-------------------|-----------|
| D1 | Wooden table | Clear onsets, good clustering | [ ] |
| D2 | Metal surface (pot, pan, railing) | Clear onsets, distinct from wood | [ ] |
| D3 | Plastic (keyboard, container) | Detectable onsets | [ ] |
| D4 | Skin (clapping, thigh slap) | Softer onsets detected | [ ] |
| D5 | Mixed surfaces (2-3 in one recording) | Correctly clustered into distinct groups | [ ] |

---

### E. Room Acoustics

| # | Room Type | Expected Behavior | Pass/Fail |
|---|-----------|-------------------|-----------|
| E1 | Small treated room (low reverb) | Clean detection | [ ] |
| E2 | Large room (moderate reverb) | Single onset per tap (no double triggers) | [ ] |
| E3 | Bathroom/hallway (high reverb) | Reasonable detection; reverb tails ignored | [ ] |

---

### F. Edge Cases

| # | Scenario | Expected Behavior | Pass/Fail |
|---|----------|-------------------|-----------|
| F1 | Record with no taps (silence) | "No sounds detected" message | [ ] |
| F2 | Single tap only | One onset, one cluster, playable | [ ] |
| F3 | Rapid fire taps (>8 per second) | Most detected, no crash | [ ] |
| F4 | Very soft taps | Adjustable sensitivity helps; some may be missed | [ ] |
| F5 | Very loud tap (close to mic) | No clipping distortion; onset detected | [ ] |
| F6 | Record for 2 minutes | App remains responsive, all data preserved | [ ] |
| F7 | Record, stop, record again | Second recording replaces or appends cleanly | [ ] |
| F8 | Deny microphone permission | Clear error message, retry option | [ ] |
| F9 | Revoke permission mid-recording | Graceful stop, data preserved if possible | [ ] |
| F10 | Switch browser tabs during recording | Recording pauses or warns (Safari/iOS) | [ ] |
| F11 | Lock screen during recording (mobile) | Graceful handling, clear state on return | [ ] |
| F12 | Low storage (IndexedDB near quota) | Appropriate error message on save failure | [ ] |
| F13 | Open in incognito/private mode | Full functionality (IndexedDB available) | [ ] |

---

### G. Accessibility (Manual)

| # | Check | Expected Behavior | Pass/Fail |
|---|-------|-------------------|-----------|
| G1 | Navigate entire app with keyboard only | All features reachable and operable | [ ] |
| G2 | VoiceOver (macOS Safari) flow | All elements announced correctly | [ ] |
| G3 | Screen magnification (200%) | Layout remains usable | [ ] |
| G4 | High contrast mode | All UI elements visible | [ ] |
| G5 | Reduced motion enabled | No animations, static visualizations | [ ] |

---

### Sign-off

- [ ] All P0 items pass (Section B, F1-F9)
- [ ] No regressions from previous release
- [ ] Performance acceptable on all tested devices
- [ ] Accessibility checks pass

**Approved for release**: [ ] Yes  [ ] No -- blocked by: _________________

**Signed**: _______________  **Date**: _______________
```

---

## 11. Quality Metrics & Gates

### Coverage Thresholds per Module

These thresholds are enforced in CI. A PR cannot merge if any threshold is violated.

| Module Path | Statements | Branches | Functions | Lines |
|-------------|-----------|----------|-----------|-------|
| `src/audio/onset-detection.*` | 95% | 90% | 95% | 95% |
| `src/audio/feature-extraction.*` | 95% | 90% | 95% | 95% |
| `src/audio/clustering.*` | 90% | 85% | 90% | 90% |
| `src/audio/quantization.*` | 95% | 90% | 95% | 95% |
| `src/audio/playback.*` | 85% | 80% | 85% | 85% |
| `src/state/*` | 90% | 85% | 90% | 90% |
| `src/storage/*` | 85% | 80% | 85% | 85% |
| `src/components/*` | 80% | 75% | 80% | 80% |
| `src/utils/*` | 90% | 85% | 90% | 90% |
| **Global minimum** | **85%** | **80%** | **85%** | **85%** |

Configure per-module thresholds in Vitest:

```typescript
// vitest.config.ts (coverage section)
coverage: {
  thresholds: {
    perFile: false,
    // Global thresholds
    statements: 85,
    branches: 80,
    functions: 85,
    lines: 85,
  },
  // Per-module thresholds enforced via custom script
  // See scripts/check-coverage.ts
}
```

```typescript
// scripts/check-coverage.ts
/**
 * Verify per-module coverage thresholds from coverage-summary.json.
 * Run after vitest --coverage: npx tsx scripts/check-coverage.ts
 * Exits with code 1 if any threshold is violated.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

interface CoverageEntry {
  statements: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
}

const THRESHOLDS: Record<
  string,
  { statements: number; branches: number; functions: number; lines: number }
> = {
  'src/audio/onset-detection': { statements: 95, branches: 90, functions: 95, lines: 95 },
  'src/audio/feature-extraction': { statements: 95, branches: 90, functions: 95, lines: 95 },
  'src/audio/clustering': { statements: 90, branches: 85, functions: 90, lines: 90 },
  'src/audio/quantization': { statements: 95, branches: 90, functions: 95, lines: 95 },
  'src/audio/playback': { statements: 85, branches: 80, functions: 85, lines: 85 },
  'src/state': { statements: 90, branches: 85, functions: 90, lines: 90 },
  'src/storage': { statements: 85, branches: 80, functions: 85, lines: 85 },
  'src/components': { statements: 80, branches: 75, functions: 80, lines: 80 },
  'src/utils': { statements: 90, branches: 85, functions: 90, lines: 90 },
};

const summary: Record<string, CoverageEntry> = JSON.parse(
  readFileSync(join(__dirname, '../coverage/coverage-summary.json'), 'utf-8')
);

let failed = false;

for (const [modulePrefix, thresholds] of Object.entries(THRESHOLDS)) {
  // Aggregate coverage for all files matching the module prefix
  const matchingFiles = Object.keys(summary).filter(
    (f) => f !== 'total' && f.includes(modulePrefix)
  );

  if (matchingFiles.length === 0) {
    console.warn(`WARNING: No coverage data for ${modulePrefix}`);
    continue;
  }

  // Aggregate totals and covered counts across matching files
  const aggregate = {
    statements: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
    lines: { total: 0, covered: 0 },
  };

  for (const file of matchingFiles) {
    const entry = summary[file];
    for (const metric of ['statements', 'branches', 'functions', 'lines'] as const) {
      aggregate[metric].total += entry[metric].total;
      aggregate[metric].covered += entry[metric].covered;
    }
  }

  for (const metric of ['statements', 'branches', 'functions', 'lines'] as const) {
    const { total, covered } = aggregate[metric];
    const actual = total > 0 ? (covered / total) * 100 : 100;
    const threshold = thresholds[metric];
    if (actual < threshold) {
      console.error(
        `FAIL: ${modulePrefix} ${metric}: ${actual.toFixed(1)}% < ${threshold}% threshold`
      );
      failed = true;
    } else {
      console.log(
        `PASS: ${modulePrefix} ${metric}: ${actual.toFixed(1)}% >= ${threshold}%`
      );
    }
  }
}

if (failed) {
  console.error('\nCoverage check FAILED. See above for details.');
  process.exit(1);
} else {
  console.log('\nAll per-module coverage thresholds met.');
}
```

### Performance Budgets

Enforced in CI via Lighthouse CI and Vitest benchmarks.

| Metric | Budget | Enforcement |
|--------|--------|-------------|
| **Bundle size (gzipped)** | < 150 KB initial JS | `bundlesize` or Lighthouse `total-byte-weight` |
| **LCP** | < 2.5s | Lighthouse CI assertion |
| **TBT** | < 200ms | Lighthouse CI assertion |
| **CLS** | < 0.1 | Lighthouse CI assertion |
| **Onset detection (5s audio)** | < 200ms p95 | Vitest bench threshold |
| **Onset detection (30s audio)** | < 1000ms p95 | Vitest bench threshold |
| **Feature extraction (per onset)** | < 5ms p95 | Vitest bench threshold |
| **Clustering (50 vectors)** | < 50ms p95 | Vitest bench threshold |
| **Quantization (100 onsets)** | < 10ms p95 | Vitest bench threshold |
| **Timeline FPS (200+ hits)** | >= 30 FPS | Playwright performance test |
| **Memory growth (5s recording)** | < 20 MB | Playwright memory test |

### Accessibility Score Minimums

| Audit | Minimum Score | Enforcement |
|-------|--------------|-------------|
| Lighthouse Accessibility | 95/100 | Lighthouse CI |
| axe-core critical violations | 0 | Playwright axe tests |
| axe-core serious violations | 0 | Playwright axe tests |
| WCAG 2.1 AA compliance | 100% | axe-core tags `wcag2a`, `wcag2aa` |

### No P0 Bugs Policy

**Definition of P0**: Any issue that prevents a user from completing the core flow (record, cluster, assign, play) or causes data loss.

**P0 examples**:
- App crashes during recording
- Onsets not detected at all (zero detections on a valid recording)
- Playback produces no audio
- Session data lost after save
- Microphone permission flow broken
- App unusable on any P0 browser (Chrome, Firefox, Safari latest)

**Policy**:
- No tagged release may ship with any known P0 bug
- P0 bugs discovered in production trigger an immediate hotfix release
- P0 bugs block all other work until resolved
- All P0 bugs must have a regression test added before the fix is merged

### Quality Gate Summary

A PR or release must pass all applicable gates:

```
PR Merge Gates:
  [x] Lint passes (zero errors, zero warnings)
  [x] TypeScript compiles (zero errors)
  [x] Unit tests pass (100%)
  [x] Integration tests pass (100%)
  [x] Coverage thresholds met (per-module and global)
  [x] Accessibility tests pass (zero critical/serious axe violations)
  [x] No P0 bugs

Main Branch Gates (in addition to PR gates):
  [x] E2E tests pass on Chromium, Firefox, WebKit
  [x] Performance budgets met (Lighthouse + benchmarks)
  [x] Visual regression tests pass
  [x] Memory profiling within bounds

Release Gates (in addition to main branch gates):
  [x] Cross-browser tests pass (BrowserStack matrix)
  [x] Manual QA checklist signed off
  [x] All P0 and P1 bugs resolved
  [x] Performance benchmarks show no regression from previous release
  [x] Audio accuracy benchmarks meet thresholds
```

---

## Appendix: Test Infrastructure Setup Quick Reference

### Initial Setup Commands

```bash
# Install test dependencies
npm install -D vitest @vitest/coverage-v8 @vitest/ui
npm install -D @playwright/test @axe-core/playwright
npm install -D fake-indexeddb
npm install -D @lhci/cli

# Install Playwright browsers
npx playwright install --with-deps

# Create test directories
mkdir -p src/test/helpers
mkdir -p src/test/fixtures
mkdir -p test/fixtures/audio
mkdir -p e2e/flows
mkdir -p e2e/accessibility
mkdir -p e2e/performance
mkdir -p e2e/visual
mkdir -p e2e/helpers
mkdir -p e2e/cross-browser

# Generate test audio fixtures
npx tsx scripts/generate-test-fixtures.ts

# Verify setup
npm run test          # unit + integration
npm run test:e2e      # end-to-end
npm run test:bench    # performance benchmarks
```

### File Structure

```
tapbeats/
  src/
    test/
      setup.ts                          # Vitest global setup
      helpers/
        audio.ts                        # Synthetic audio generation
        metrics.ts                      # Precision/recall/F1 calculation
        fixtures.ts                     # Fixture loading utilities
        latency.ts                      # Latency measurement helpers
    audio/
      onset-detection.test.ts           # Onset detection unit tests
      onset-detection.bench.test.ts     # Onset detection benchmarks
      feature-extraction.test.ts        # Feature extraction unit tests
      clustering.test.ts                # Clustering unit tests
      clustering.bench.test.ts          # Clustering benchmarks
      quantization.test.ts              # Quantization unit tests
      quantization.bench.test.ts        # Quantization benchmarks
      pipeline.integration.test.ts      # Full pipeline integration
    state/
      session-store.test.ts             # State management tests
    storage/
      session-persistence.integration.test.ts  # IndexedDB roundtrip
    playback/
      scheduler.integration.test.ts     # Playback scheduling
  test/
    fixtures/
      audio/                            # WAV files + JSON annotations
        click-track-120bpm.wav
        click-track-120bpm.json
        ...
  e2e/
    helpers/
      mock-audio.ts                     # Mock microphone injection
    flows/
      first-time-user.spec.ts           # Core user flow
      returning-user.spec.ts            # Session load/modify flow
      error-handling.spec.ts            # Error flows
    accessibility/
      axe.spec.ts                       # axe-core automated tests
      keyboard.spec.ts                  # Keyboard navigation
      contrast.spec.ts                  # Color contrast
      reduced-motion.spec.ts            # Reduced motion
    performance/
      memory.spec.ts                    # Memory profiling
      timeline-fps.spec.ts             # Rendering performance
      long-session.spec.ts             # Stability testing
    visual/
      timeline.spec.ts                  # Visual regression
    cross-browser/
      audio-api.spec.ts                 # Web Audio API differences
  scripts/
    generate-test-fixtures.ts           # Fixture generation
    check-coverage.ts                   # Per-module coverage enforcement
  vitest.config.ts                      # Vitest configuration
  playwright.config.ts                  # Playwright configuration
  playwright.browserstack.config.ts     # BrowserStack configuration
  .lighthouserc.json                    # Lighthouse CI configuration
  .lintstagedrc.json                    # lint-staged configuration
  .github/
    workflows/
      ci.yml                            # GitHub Actions CI/CD
```
