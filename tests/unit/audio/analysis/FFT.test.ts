import { describe, it, expect } from 'vitest';

import { FFT } from '@/audio/analysis/FFT';

import {
  generateSilence,
  generateSineWave,
  generateImpulse,
  generateDCSignal,
} from '../../../fixtures/audio-samples';

describe('FFT', () => {
  describe('constructor', () => {
    it('accepts power-of-2 sizes', () => {
      const fft = new FFT(256);
      expect(fft.size).toBe(256);
      fft.dispose();
    });

    it('rejects non-power-of-2 sizes', () => {
      expect(() => new FFT(100)).toThrow('FFT size must be a power of 2');
    });

    it('rejects size less than 2', () => {
      expect(() => new FFT(1)).toThrow('FFT size must be a power of 2');
    });

    it('rejects size of 0', () => {
      expect(() => new FFT(0)).toThrow('FFT size must be a power of 2');
    });
  });

  describe('DC signal', () => {
    it('concentrates all energy in bin 0 for size 256', () => {
      const size = 256;
      const fft = new FFT(size);
      const dc = generateDCSignal(size, 1.0);

      fft.forward(dc);

      const bins = (size >>> 1) + 1;
      const output = new Float32Array(bins);
      fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, output);

      // Bin 0 should equal N (all samples are 1.0)
      expect(output[0]).toBeCloseTo(size, 1);

      // All other bins should be approximately 0
      for (let i = 1; i < bins; i++) {
        expect(output[i] ?? 0).toBeCloseTo(0, 3);
      }

      fft.dispose();
    });

    it('concentrates all energy in bin 0 for size 1024', () => {
      const size = 1024;
      const fft = new FFT(size);
      const dc = generateDCSignal(size, 1.0);

      fft.forward(dc);

      const bins = (size >>> 1) + 1;
      const output = new Float32Array(bins);
      fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, output);

      expect(output[0]).toBeCloseTo(size, 1);

      for (let i = 1; i < bins; i++) {
        expect(output[i] ?? 0).toBeCloseTo(0, 2);
      }

      fft.dispose();
    });
  });

  describe('pure sine at specific bin', () => {
    it.each([256, 512, 1024, 2048])('detects sine at bin 4 for size %d', (size) => {
      const fft = new FFT(size);
      const targetBin = 4;
      const sampleRate = size; // so that bin k corresponds to k Hz
      const frequency = targetBin; // Hz

      const signal = generateSineWave(size, frequency, sampleRate);
      fft.forward(signal);

      const bins = (size >>> 1) + 1;
      const output = new Float32Array(bins);
      fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, output);

      // Energy should be concentrated at bin targetBin
      const maxBin = findMaxBin(output, bins);
      expect(maxBin).toBe(targetBin);

      // Magnitude at target bin should be approximately N/2
      expect(output[targetBin] ?? 0).toBeCloseTo(size / 2, 0);

      fft.dispose();
    });

    it('detects sine at bin 10 for size 512', () => {
      const size = 512;
      const fft = new FFT(size);
      const targetBin = 10;

      const signal = generateSineWave(size, targetBin, size);
      fft.forward(signal);

      const bins = (size >>> 1) + 1;
      const output = new Float32Array(bins);
      fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, output);

      const maxBin = findMaxBin(output, bins);
      expect(maxBin).toBe(targetBin);

      fft.dispose();
    });
  });

  describe('Parseval theorem', () => {
    it('sum of squared magnitudes approximately equals sum of squared time-domain samples', () => {
      const size = 1024;
      const fft = new FFT(size);
      const signal = generateSineWave(size, 50, size);

      // Time-domain energy
      let timeDomainEnergy = 0;
      for (let i = 0; i < size; i++) {
        const s = signal[i] ?? 0;
        timeDomainEnergy += s * s;
      }

      fft.forward(signal);

      // Frequency-domain energy: sum of |X[k]|^2 / N
      let freqDomainEnergy = 0;
      for (let i = 0; i < size; i++) {
        const re = fft.realBuffer[i] ?? 0;
        const im = fft.imagBuffer[i] ?? 0;
        freqDomainEnergy += re * re + im * im;
      }
      freqDomainEnergy /= size;

      expect(freqDomainEnergy).toBeCloseTo(timeDomainEnergy, 1);

      fft.dispose();
    });
  });

  describe('Hann-windowed sine', () => {
    it('main lobe is at the correct bin', () => {
      const size = 1024;
      const fft = new FFT(size);
      const targetBin = 20;
      const sampleRate = size;

      // Generate sine, apply Hann window
      const signal = generateSineWave(size, targetBin, sampleRate);
      const windowed = new Float32Array(size);
      for (let i = 0; i < size; i++) {
        const hannCoeff = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
        windowed[i] = (signal[i] ?? 0) * hannCoeff;
      }

      fft.forward(windowed);

      const bins = (size >>> 1) + 1;
      const output = new Float32Array(bins);
      fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, output);

      const maxBin = findMaxBin(output, bins);
      expect(maxBin).toBe(targetBin);

      fft.dispose();
    });
  });

  describe('zero input', () => {
    it('produces zero output', () => {
      const size = 512;
      const fft = new FFT(size);
      const silence = generateSilence(size);

      fft.forward(silence);

      const bins = (size >>> 1) + 1;
      const output = new Float32Array(bins);
      fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, output);

      for (let i = 0; i < bins; i++) {
        expect(output[i] ?? 0).toBeCloseTo(0, 5);
      }

      fft.dispose();
    });
  });

  describe('impulse at t=0', () => {
    it('produces flat spectrum', () => {
      const size = 256;
      const fft = new FFT(size);
      const impulse = generateImpulse(size, 0);

      fft.forward(impulse);

      const bins = (size >>> 1) + 1;
      const output = new Float32Array(bins);
      fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, output);

      // All bins should have magnitude 1.0 (since impulse has unit amplitude)
      for (let i = 0; i < bins; i++) {
        expect(output[i] ?? 0).toBeCloseTo(1.0, 3);
      }

      fft.dispose();
    });
  });

  describe('magnitudeSpectrum', () => {
    it('produces correct number of bins', () => {
      const size = 1024;
      const fft = new FFT(size);
      const signal = generateSilence(size);

      fft.forward(signal);

      const expectedBins = (size >>> 1) + 1;
      const output = new Float32Array(expectedBins);
      fft.magnitudeSpectrum(fft.realBuffer, fft.imagBuffer, output);

      // Output buffer is the expected number of bins
      expect(output.length).toBe(513);

      fft.dispose();
    });
  });

  describe('dispose', () => {
    it('releases internal buffers', () => {
      const fft = new FFT(256);
      fft.dispose();

      // After dispose, realBuffer and imagBuffer should be empty arrays
      expect(fft.realBuffer.length).toBe(0);
      expect(fft.imagBuffer.length).toBe(0);
    });

    it('forward throws after dispose since buffers are nulled', () => {
      const fft = new FFT(256);
      fft.dispose();

      // After dispose, internal buffers are null so forward will throw
      expect(() => {
        fft.forward(new Float32Array(256));
      }).toThrow();
    });
  });

  describe('various sizes', () => {
    it.each([256, 512, 1024, 2048])('constructs and runs forward for size %d', (size) => {
      const fft = new FFT(size);
      const signal = generateSineWave(size, 10, size);

      expect(() => {
        fft.forward(signal);
      }).not.toThrow();

      expect(fft.realBuffer.length).toBe(size);
      expect(fft.imagBuffer.length).toBe(size);

      fft.dispose();
    });
  });
});

/** Helper: find the bin index with maximum magnitude */
function findMaxBin(spectrum: Float32Array, bins: number): number {
  let maxIdx = 0;
  let maxVal = 0;
  for (let i = 0; i < bins; i++) {
    const val = spectrum[i] ?? 0;
    if (val > maxVal) {
      maxVal = val;
      maxIdx = i;
    }
  }
  return maxIdx;
}
