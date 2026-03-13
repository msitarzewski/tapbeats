import { describe, it, expect, beforeEach } from 'vitest';

import {
  createHannWindow,
  applyWindow,
  computeSpectralFlux,
  computeMedian,
} from '@/audio/analysis/dsp-utils';
import { estimateBpm } from '@/audio/analysis/estimateBpm';
import { FeatureExtractor } from '@/audio/analysis/FeatureExtractor';
import { FFT } from '@/audio/analysis/FFT';
import { useRecordingStore } from '@/state/recordingStore';
import { SENSITIVITY_PRESETS } from '@/types/audio';
import type { DetectedHit, SensitivityLevel } from '@/types/audio';

import { generateClickTrack, generateSilence, generateNoiseFloor } from '../fixtures/audio-samples';
import { measurePrecisionRecall } from '../helpers/dsp-test-utils';

// ---------------------------------------------------------------------------
// Simplified onset detection pipeline for integration testing
// (mirrors tap-processor.js logic but runs synchronously in Node)
// ---------------------------------------------------------------------------

interface OnsetResult {
  timestampMs: number;
  strength: number;
  snippetStart: number;
}

function runOnsetDetection(
  audio: Float32Array,
  sampleRate: number,
  sensitivity: SensitivityLevel = 'medium',
): OnsetResult[] {
  const params = SENSITIVITY_PRESETS[sensitivity];
  const fftSize = 1024;
  const hopSize = 256;
  const magnitudeBins = (fftSize >>> 1) + 1;

  const fft = new FFT(fftSize);
  const hannWindow = createHannWindow(fftSize);
  const windowedFrame = new Float32Array(fftSize);
  const magnitudes = new Float32Array(magnitudeBins);
  const prevMagnitudes = new Float32Array(magnitudeBins);
  const magnitudeOutput = new Float32Array(magnitudeBins);

  const fluxHistory = new Float32Array(params.medianWindowSize);
  let fluxHistoryIndex = 0;
  let fluxHistoryCount = 0;

  const onsets: OnsetResult[] = [];
  let lastOnsetMs = -Infinity;

  // Process audio in hop-size steps
  for (let frameStart = 0; frameStart + fftSize <= audio.length; frameStart += hopSize) {
    // Extract frame
    const frame = audio.subarray(frameStart, frameStart + fftSize);

    // Window and FFT
    applyWindow(frame, hannWindow, windowedFrame);
    fft.forward(windowedFrame);
    fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, magnitudeOutput);

    // Copy to magnitudes
    magnitudes.set(magnitudeOutput);

    // Spectral flux
    const flux = computeSpectralFlux(magnitudes, prevMagnitudes);

    // Update history
    fluxHistory[fluxHistoryIndex] = flux;
    fluxHistoryIndex = (fluxHistoryIndex + 1) % params.medianWindowSize;
    if (fluxHistoryCount < params.medianWindowSize) fluxHistoryCount++;

    // Adaptive threshold
    const windowSize = Math.min(params.medianWindowSize, fluxHistoryCount);
    const median = computeMedian(fluxHistory, windowSize);
    const threshold = median * params.multiplier;

    // Time of current frame center
    const frameTimeMs = ((frameStart + fftSize / 2) / sampleRate) * 1000;
    const timeSinceLastOnset = frameTimeMs - lastOnsetMs;

    if (flux > threshold && flux > 0.05 && timeSinceLastOnset >= params.minInterOnsetMs) {
      onsets.push({
        timestampMs: frameTimeMs,
        strength: threshold > 0 ? flux / threshold : flux,
        snippetStart: frameStart,
      });
      lastOnsetMs = frameTimeMs;
    }

    // Swap
    prevMagnitudes.set(magnitudes);
  }

  fft.dispose();
  return onsets;
}

describe('onset detection pipeline (integration)', () => {
  beforeEach(() => {
    useRecordingStore.getState().reset();
  });

  describe('silence input', () => {
    it('produces 0 onsets', () => {
      const silence = generateSilence(44100); // 1 second
      const onsets = runOnsetDetection(silence, 44100);
      expect(onsets.length).toBe(0);
    });
  });

  describe('click track detection', () => {
    it('detects known onset positions with precision > 90% and recall > 85%', () => {
      const sampleRate = 44100;
      const truthMs = [200, 700, 1200, 1700, 2200];
      const audio = generateClickTrack(truthMs, sampleRate, 5);

      const onsets = runOnsetDetection(audio, sampleRate);
      const detectedMs = onsets.map((o) => o.timestampMs);

      const { precision, recall } = measurePrecisionRecall(detectedMs, truthMs, 50);

      expect(precision).toBeGreaterThan(0.9);
      expect(recall).toBeGreaterThan(0.85);
    });

    it('detects closely spaced clicks', () => {
      const sampleRate = 44100;
      const truthMs = [100, 250, 400, 550, 700];
      const audio = generateClickTrack(truthMs, sampleRate, 3);

      const onsets = runOnsetDetection(audio, sampleRate);

      // Should detect at least some of them
      expect(onsets.length).toBeGreaterThan(0);
    });
  });

  describe('inter-onset interval enforcement', () => {
    it('skips onsets closer than minInterOnsetMs', () => {
      const sampleRate = 44100;
      // Two clicks only 20ms apart, then one far away
      const truthMs = [500, 520, 1500];
      const audio = generateClickTrack(truthMs, sampleRate, 5);

      // Medium preset has minInterOnsetMs = 50
      const onsets = runOnsetDetection(audio, sampleRate, 'medium');

      // Both 500 and 520 should be merged into one detection
      // because they are < 50ms apart
      const onsetsInRange = onsets.filter((o) => o.timestampMs > 480 && o.timestampMs < 560);
      // At most 1 onset should be detected in the 500-520ms range
      expect(onsetsInRange.length).toBeLessThanOrEqual(1);
    });
  });

  describe('feature extraction post-stop', () => {
    it('all hits get features after extraction', () => {
      const sampleRate = 44100;
      const truthMs = [200, 700, 1200];
      const audio = generateClickTrack(truthMs, sampleRate, 5);

      const onsets = runOnsetDetection(audio, sampleRate);

      // Simulate storing onsets and extracting features
      const store = useRecordingStore.getState();
      const extractor = new FeatureExtractor({ fftSize: 1024, sampleRate });

      for (const onset of onsets) {
        const hit: DetectedHit = {
          onset: {
            timestamp: onset.timestampMs / 1000,
            strength: onset.strength,
            snippetBuffer: null,
          },
          features: null,
        };
        store.addOnset(hit);
      }

      // Extract features for each hit
      const state = useRecordingStore.getState();
      for (let i = 0; i < state._onsets.length; i++) {
        const snippetStart = onsets[i]?.snippetStart ?? 0;
        const snippetEnd = Math.min(snippetStart + 9261, audio.length);
        const snippet = audio.subarray(snippetStart, snippetEnd);
        const features = extractor.extract(snippet, sampleRate);
        useRecordingStore.getState().updateHitFeatures(i, features);
      }

      // All hits should now have features
      const finalState = useRecordingStore.getState();
      for (const onset of finalState._onsets) {
        expect(onset.features).not.toBeNull();
        expect(onset.features?.mfcc.length).toBe(5);
      }
    });
  });

  describe('multiple clicks', () => {
    it('produces correct hit count', () => {
      const sampleRate = 44100;
      const truthMs = [300, 800, 1300, 1800, 2300];
      const audio = generateClickTrack(truthMs, sampleRate, 5);

      const onsets = runOnsetDetection(audio, sampleRate);

      // Store in recording store
      for (const onset of onsets) {
        useRecordingStore.getState().addOnset({
          onset: {
            timestamp: onset.timestampMs / 1000,
            strength: onset.strength,
            snippetBuffer: null,
          },
          features: null,
        });
      }

      expect(useRecordingStore.getState().hitCount).toBe(onsets.length);
      expect(useRecordingStore.getState()._onsets.length).toBe(onsets.length);
    });
  });

  describe('sensitivity presets', () => {
    it('high sensitivity detects more onsets than low', () => {
      const sampleRate = 44100;
      // Mix of strong and weak clicks
      const truthMs = [200, 500, 800, 1100, 1400];
      const audio = generateClickTrack(truthMs, sampleRate, 3);

      // Add low-amplitude noise floor so weak clicks are more ambiguous
      const noise = generateNoiseFloor(audio.length, 0.05);
      const mixed = new Float32Array(audio.length);
      for (let i = 0; i < audio.length; i++) {
        mixed[i] = (audio[i] ?? 0) + (noise[i] ?? 0);
      }

      const highOnsets = runOnsetDetection(mixed, sampleRate, 'high');
      const lowOnsets = runOnsetDetection(mixed, sampleRate, 'low');

      // High sensitivity should detect >= as many onsets as low
      expect(highOnsets.length).toBeGreaterThanOrEqual(lowOnsets.length);
    });

    it('low sensitivity has fewer false positives on noise', () => {
      const sampleRate = 44100;
      const noise = generateNoiseFloor(44100, 0.1); // 1 second of noise

      const highOnsets = runOnsetDetection(noise, sampleRate, 'high');
      const lowOnsets = runOnsetDetection(noise, sampleRate, 'low');

      // Low sensitivity should produce fewer false detections
      expect(lowOnsets.length).toBeLessThanOrEqual(highOnsets.length);
    });
  });

  describe('BPM estimation from pipeline', () => {
    it('correctly estimates BPM from detected onsets', () => {
      const sampleRate = 44100;
      const bpm = 120;
      const intervalMs = (60 / bpm) * 1000; // 500ms

      const truthMs: number[] = [];
      for (let i = 0; i < 8; i++) {
        truthMs.push(200 + i * intervalMs);
      }

      const audio = generateClickTrack(truthMs, sampleRate, 5);
      const onsets = runOnsetDetection(audio, sampleRate);

      const timestamps = onsets.map((o) => o.timestampMs / 1000);
      const estimatedBpm = estimateBpm(timestamps);

      expect(estimatedBpm).not.toBeNull();
      if (estimatedBpm !== null) {
        expect(estimatedBpm).toBeGreaterThan(100);
        expect(estimatedBpm).toBeLessThan(140);
      }
    });
  });

  describe('noise-only input', () => {
    it('low-level noise produces few or no onsets', () => {
      const sampleRate = 44100;
      const noise = generateNoiseFloor(44100, 0.01);

      const onsets = runOnsetDetection(noise, sampleRate);

      // Very low noise should produce very few onsets
      expect(onsets.length).toBeLessThan(5);
    });
  });

  describe('onset strength', () => {
    it('all detected onsets have strength > 0', () => {
      const sampleRate = 44100;
      const truthMs = [200, 700, 1200];
      const audio = generateClickTrack(truthMs, sampleRate, 5);

      const onsets = runOnsetDetection(audio, sampleRate);

      for (const onset of onsets) {
        expect(onset.strength).toBeGreaterThan(0);
      }
    });
  });
});
