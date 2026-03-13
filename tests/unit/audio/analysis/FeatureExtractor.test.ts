import { describe, it, expect } from 'vitest';

import { createMelFilterBank } from '@/audio/analysis/dsp-utils';
import {
  computeRMS,
  computeSpectralCentroid,
  computeSpectralRolloff,
  computeSpectralFlatness,
  computeZeroCrossingRate,
  computeAttackTime,
  computeDecayTime,
  computeMFCCs,
  FeatureExtractor,
} from '@/audio/analysis/FeatureExtractor';
import { FFT } from '@/audio/analysis/FFT';

import {
  generateSineWave,
  generateDCSignal,
  generateWhiteNoise,
  generateEnvelope,
  generateSilence,
} from '../../../fixtures/audio-samples';

describe('FeatureExtractor', () => {
  describe('computeRMS', () => {
    it('returns amplitude for DC signal', () => {
      const dc = generateDCSignal(1024, 0.5);
      expect(computeRMS(dc)).toBeCloseTo(0.5, 3);
    });

    it('returns A/sqrt(2) for unit sine wave', () => {
      // For a sine wave with amplitude 1, RMS = 1/sqrt(2) ≈ 0.7071
      // Need enough cycles for accuracy
      const sine = generateSineWave(44100, 440, 44100);
      expect(computeRMS(sine)).toBeCloseTo(1 / Math.sqrt(2), 2);
    });

    it('returns 0 for silence', () => {
      const silence = generateSilence(1024);
      expect(computeRMS(silence)).toBe(0);
    });
  });

  describe('computeSpectralCentroid', () => {
    it('returns approximately 1000 Hz for a pure 1000 Hz tone', () => {
      const size = 2048;
      const sampleRate = 44100;
      const freq = 1000;

      // Generate sine at a frequency that lands exactly on a bin to minimize leakage
      // Bin frequency = k * sampleRate / fftSize
      // k = freq * fftSize / sampleRate = 1000 * 2048 / 44100 ≈ 46.44
      // Use a Hann window to reduce spectral leakage
      const signal = generateSineWave(size, freq, sampleRate);
      const windowed = new Float32Array(size);
      for (let i = 0; i < size; i++) {
        const hannCoeff = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
        windowed[i] = (signal[i] ?? 0) * hannCoeff;
      }

      const fft = new FFT(size);
      fft.forward(windowed);

      const bins = (size >>> 1) + 1;
      const magnitudes = new Float32Array(bins);
      fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, magnitudes);

      const centroid = computeSpectralCentroid(magnitudes, sampleRate, size);

      // With Hann windowing, centroid should be within a few bins of the true frequency
      // Allow tolerance of 5% of the target frequency
      expect(Math.abs(centroid - freq)).toBeLessThan(freq * 0.05);

      fft.dispose();
    });

    it('returns 0 for zero magnitudes', () => {
      const magnitudes = new Float32Array(513);
      expect(computeSpectralCentroid(magnitudes, 44100, 1024)).toBe(0);
    });
  });

  describe('computeSpectralRolloff', () => {
    it('returns value in [0, 1]', () => {
      const magnitudes = new Float32Array(513);
      for (let i = 0; i < 513; i++) {
        magnitudes[i] = Math.random();
      }

      const rolloff = computeSpectralRolloff(magnitudes);
      expect(rolloff).toBeGreaterThanOrEqual(0);
      expect(rolloff).toBeLessThanOrEqual(1);
    });

    it('returns low value for low-frequency concentrated energy', () => {
      const magnitudes = new Float32Array(513);
      // Energy concentrated in first 10 bins
      for (let i = 0; i < 10; i++) {
        magnitudes[i] = 10;
      }

      const rolloff = computeSpectralRolloff(magnitudes);
      expect(rolloff).toBeLessThan(0.1);
    });

    it('returns 0 for zero magnitudes (threshold met immediately at bin 0)', () => {
      const magnitudes = new Float32Array(513);
      // When all magnitudes are 0, totalEnergy=0, threshold=0, and
      // cumulative(0) >= threshold(0) is true at bin 0, so returns 0/len = 0
      expect(computeSpectralRolloff(magnitudes)).toBe(0);
    });
  });

  describe('computeSpectralFlatness', () => {
    it('returns close to 1 for white noise', () => {
      const size = 2048;
      const noise = generateWhiteNoise(size);
      const fft = new FFT(size);
      fft.forward(noise);

      const bins = (size >>> 1) + 1;
      const magnitudes = new Float32Array(bins);
      fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, magnitudes);

      const flatness = computeSpectralFlatness(magnitudes);
      // White noise should have flatness > 0.5 (close to 1)
      expect(flatness).toBeGreaterThan(0.5);

      fft.dispose();
    });

    it('returns close to 0 for pure tone', () => {
      const size = 2048;
      const sine = generateSineWave(size, 440, 44100);
      const fft = new FFT(size);
      fft.forward(sine);

      const bins = (size >>> 1) + 1;
      const magnitudes = new Float32Array(bins);
      fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, magnitudes);

      const flatness = computeSpectralFlatness(magnitudes);
      // Pure tone: energy concentrated, flatness should be low
      // Due to spectral leakage, value may be slightly above 0.1
      expect(flatness).toBeLessThan(0.2);

      fft.dispose();
    });

    it('returns 0 for zero magnitudes', () => {
      const magnitudes = new Float32Array(513);
      expect(computeSpectralFlatness(magnitudes)).toBe(0);
    });

    it('returns 0 for empty array', () => {
      expect(computeSpectralFlatness(new Float32Array(0))).toBe(0);
    });
  });

  describe('computeZeroCrossingRate', () => {
    it('returns approximately 2*freq/sampleRate for pure sine', () => {
      const sampleRate = 44100;
      const freq = 440;
      const signal = generateSineWave(sampleRate, freq, sampleRate); // 1 second

      const zcr = computeZeroCrossingRate(signal);
      const expectedZcr = (2 * freq) / sampleRate;

      // Allow 1% tolerance
      expect(zcr).toBeCloseTo(expectedZcr, 2);
    });

    it('returns 0 for DC signal', () => {
      const dc = generateDCSignal(1024, 0.5);
      expect(computeZeroCrossingRate(dc)).toBe(0);
    });

    it('returns close to 1 for alternating signal', () => {
      const signal = new Float32Array([1, -1, 1, -1, 1, -1]);
      expect(computeZeroCrossingRate(signal)).toBeCloseTo(1, 5);
    });
  });

  describe('computeAttackTime', () => {
    it('returns correct attack time for envelope signal', () => {
      const sampleRate = 44100;
      const attackSamples = 441; // 10ms
      const signal = generateEnvelope(4410, attackSamples, 2000, 1.0);

      const attackTime = computeAttackTime(signal, sampleRate);
      // Peak should be at or near end of attack phase
      expect(attackTime).toBeCloseTo(attackSamples / sampleRate, 2);
    });

    it('returns 0 for signal with peak at start', () => {
      const signal = new Float32Array([1.0, 0.5, 0.25, 0.1]);
      expect(computeAttackTime(signal, 44100)).toBeCloseTo(0, 5);
    });
  });

  describe('computeDecayTime', () => {
    it('returns correct decay time for envelope signal', () => {
      const sampleRate = 44100;
      const attackSamples = 10;
      const decaySamples = 4400;
      const signal = generateEnvelope(8820, attackSamples, decaySamples, 1.0);

      const decayTime = computeDecayTime(signal, sampleRate);
      // Decay from peak to 10% of peak
      expect(decayTime).toBeGreaterThan(0);
      expect(decayTime).toBeLessThan(decaySamples / sampleRate);
    });

    it('returns time to end for signal that never decays', () => {
      const signal = generateDCSignal(100, 1.0);
      // Peak at index 0, never drops to 10%
      const decayTime = computeDecayTime(signal, 100);
      expect(decayTime).toBeCloseTo((100 - 1) / 100, 2);
    });
  });

  describe('computeMFCCs', () => {
    it('returns requested number of coefficients', () => {
      const magnitudes = new Float32Array(513);
      for (let i = 0; i < 513; i++) {
        magnitudes[i] = 1;
      }
      const bank = createMelFilterBank(26, 1024, 44100);
      const mfccs = computeMFCCs(magnitudes, bank, 5);

      expect(mfccs.length).toBe(5);
    });

    it('first coefficient (c0) is typically largest in absolute value', () => {
      const size = 1024;
      const noise = generateWhiteNoise(size);
      const fft = new FFT(size);
      fft.forward(noise);

      const bins = (size >>> 1) + 1;
      const magnitudes = new Float32Array(bins);
      fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, magnitudes);

      const bank = createMelFilterBank(26, size, 44100);
      const mfccs = computeMFCCs(magnitudes, bank, 5);

      // c0 represents overall energy, should be largest
      const c0Abs = Math.abs(mfccs[0] ?? 0);
      for (let i = 1; i < mfccs.length; i++) {
        expect(c0Abs).toBeGreaterThanOrEqual(Math.abs(mfccs[i] ?? 0) * 0.5);
      }

      fft.dispose();
    });

    it('produces finite values', () => {
      const magnitudes = new Float32Array(513);
      magnitudes.fill(0.001);
      const bank = createMelFilterBank(26, 1024, 44100);
      const mfccs = computeMFCCs(magnitudes, bank, 5);

      for (const coeff of mfccs) {
        expect(isFinite(coeff)).toBe(true);
      }
    });
  });

  describe('FeatureExtractor.extract', () => {
    it('returns a 12-dimensional AudioFeatures object', () => {
      const extractor = new FeatureExtractor({ fftSize: 1024, sampleRate: 44100 });
      const signal = generateSineWave(9261, 440, 44100);

      const features = extractor.extract(signal, 44100);

      expect(typeof features.rms).toBe('number');
      expect(typeof features.spectralCentroid).toBe('number');
      expect(typeof features.spectralRolloff).toBe('number');
      expect(typeof features.spectralFlatness).toBe('number');
      expect(typeof features.zeroCrossingRate).toBe('number');
      expect(typeof features.attackTime).toBe('number');
      expect(typeof features.decayTime).toBe('number');
      expect(features.mfcc.length).toBe(5);

      // Total dimension: 7 numeric + 5 MFCC = 12
      const totalDims = 7 + features.mfcc.length;
      expect(totalDims).toBe(12);
    });

    it('handles snippet shorter than fftSize (zero-pads)', () => {
      const extractor = new FeatureExtractor({ fftSize: 1024, sampleRate: 44100 });
      const shortSignal = generateSineWave(256, 440, 44100);

      const features = extractor.extract(shortSignal, 44100);

      expect(isFinite(features.rms)).toBe(true);
      expect(isFinite(features.spectralCentroid)).toBe(true);
    });

    it('handles snippet longer than fftSize', () => {
      const extractor = new FeatureExtractor({ fftSize: 1024, sampleRate: 44100 });
      const longSignal = generateSineWave(9261, 440, 44100);

      const features = extractor.extract(longSignal, 44100);

      expect(isFinite(features.rms)).toBe(true);
      expect(features.rms).toBeGreaterThan(0);
    });

    it('produces all finite values', () => {
      const extractor = new FeatureExtractor({ fftSize: 1024, sampleRate: 44100 });
      const signal = generateWhiteNoise(9261);

      const features = extractor.extract(signal, 44100);

      expect(isFinite(features.rms)).toBe(true);
      expect(isFinite(features.spectralCentroid)).toBe(true);
      expect(isFinite(features.spectralRolloff)).toBe(true);
      expect(isFinite(features.spectralFlatness)).toBe(true);
      expect(isFinite(features.zeroCrossingRate)).toBe(true);
      expect(isFinite(features.attackTime)).toBe(true);
      expect(isFinite(features.decayTime)).toBe(true);
      for (const coeff of features.mfcc) {
        expect(isFinite(coeff)).toBe(true);
      }
    });

    it('RMS of silence is 0', () => {
      const extractor = new FeatureExtractor({ fftSize: 1024, sampleRate: 44100 });
      const silence = generateSilence(9261);

      const features = extractor.extract(silence, 44100);
      expect(features.rms).toBe(0);
    });
  });

  describe('z-score normalization', () => {
    it('normalizing a feature set produces mean near 0 and std near 1', () => {
      const extractor = new FeatureExtractor({ fftSize: 1024, sampleRate: 44100 });

      // Extract features from multiple signals
      const rmsValues: number[] = [];
      for (let freq = 100; freq <= 4000; freq += 100) {
        const signal = generateSineWave(9261, freq, 44100);
        const features = extractor.extract(signal, 44100);
        rmsValues.push(features.rms);
      }

      // Compute z-scores
      const mean = rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;
      const variance = rmsValues.reduce((a, b) => a + (b - mean) ** 2, 0) / rmsValues.length;
      const std = Math.sqrt(variance);

      const zScores = rmsValues.map((v) => (std > 0 ? (v - mean) / std : 0));

      // Z-score mean should be ~0
      const zMean = zScores.reduce((a, b) => a + b, 0) / zScores.length;
      expect(zMean).toBeCloseTo(0, 5);

      // Z-score std should be ~1
      const zVariance = zScores.reduce((a, b) => a + (b - zMean) ** 2, 0) / zScores.length;
      expect(Math.sqrt(zVariance)).toBeCloseTo(1, 5);
    });
  });
});
