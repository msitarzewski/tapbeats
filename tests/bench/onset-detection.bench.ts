import { describe, bench } from 'vitest';

import {
  createHannWindow,
  applyWindow,
  computeSpectralFlux,
  computeMedian,
} from '@/audio/analysis/dsp-utils';
import { estimateBpm } from '@/audio/analysis/estimateBpm';
import { FeatureExtractor } from '@/audio/analysis/FeatureExtractor';
import { FFT } from '@/audio/analysis/FFT';

import { generateWhiteNoise } from '../fixtures/audio-samples';

describe('onset detection benchmarks', () => {
  bench(
    'FFT forward on 1024 samples',
    () => {
      const fft = new FFT(1024);
      const signal = generateWhiteNoise(1024, 42);
      fft.forward(signal);
      fft.dispose();
    },
    { time: 1000 },
  );

  bench(
    'full onset detection on 5s of audio',
    () => {
      const sampleRate = 44100;
      const duration = 5; // seconds
      const audio = generateWhiteNoise(sampleRate * duration, 123);

      const fftSize = 1024;
      const hopSize = 256;
      const magnitudeBins = (fftSize >>> 1) + 1;

      const fft = new FFT(fftSize);
      const hannWindow = createHannWindow(fftSize);
      const windowedFrame = new Float32Array(fftSize);
      const magnitudes = new Float32Array(magnitudeBins);
      const prevMagnitudes = new Float32Array(magnitudeBins);
      const magnitudeOutput = new Float32Array(magnitudeBins);

      const fluxHistory = new Float32Array(10);
      let fluxHistoryIndex = 0;
      let fluxHistoryCount = 0;

      for (let frameStart = 0; frameStart + fftSize <= audio.length; frameStart += hopSize) {
        const frame = audio.subarray(frameStart, frameStart + fftSize);
        applyWindow(frame, hannWindow, windowedFrame);
        fft.forward(windowedFrame);
        fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, magnitudeOutput);
        magnitudes.set(magnitudeOutput);

        const flux = computeSpectralFlux(magnitudes, prevMagnitudes);
        fluxHistory[fluxHistoryIndex] = flux;
        fluxHistoryIndex = (fluxHistoryIndex + 1) % 10;
        if (fluxHistoryCount < 10) fluxHistoryCount++;
        computeMedian(fluxHistory, Math.min(10, fluxHistoryCount));

        prevMagnitudes.set(magnitudes);
      }

      fft.dispose();
    },
    { time: 3000 },
  );

  bench(
    'feature extraction per hit',
    () => {
      const extractor = new FeatureExtractor({ fftSize: 1024, sampleRate: 44100 });
      const snippet = generateWhiteNoise(9261, 77);
      extractor.extract(snippet, 44100);
    },
    { time: 1000 },
  );

  bench(
    'estimateBpm on 16 timestamps',
    () => {
      const timestamps: number[] = [];
      for (let i = 0; i < 16; i++) {
        timestamps.push(i * 0.5); // 120 BPM
      }
      estimateBpm(timestamps);
    },
    { time: 1000 },
  );
});
