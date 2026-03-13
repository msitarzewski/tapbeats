import { describe, it, expect } from 'vitest';

import {
  createHannWindow,
  applyWindow,
  computeSpectralFlux,
  computeMedian,
  melToHz,
  hzToMel,
  createMelFilterBank,
} from '@/audio/analysis/dsp-utils';

import { HANN_WINDOW_SIZE_8 } from '../../../fixtures/dsp-reference-values';
import { expectFloat32ArrayClose } from '../../../helpers/dsp-test-utils';

describe('dsp-utils', () => {
  describe('createHannWindow', () => {
    it('matches known coefficients for size 8', () => {
      const window = createHannWindow(8);
      expectFloat32ArrayClose(window, HANN_WINDOW_SIZE_8, 1e-6);
    });

    it('has zero at endpoints', () => {
      const window = createHannWindow(16);
      expect(window[0]).toBeCloseTo(0, 5);
      expect(window[15]).toBeCloseTo(0, 5);
    });

    it('has maximum at center for size 4', () => {
      const window = createHannWindow(4);
      // w(0)=0, w(1)=0.75, w(2)=0.75, w(3)=0
      expect(window[0]).toBeCloseTo(0, 5);
      expect(window[1]).toBeCloseTo(0.75, 3);
      expect(window[2]).toBeCloseTo(0.75, 3);
      expect(window[3]).toBeCloseTo(0, 5);
    });
  });

  describe('applyWindow', () => {
    it('multiplies element-wise', () => {
      const frame = new Float32Array([1, 2, 3, 4]);
      const window = new Float32Array([0.5, 1.0, 0.5, 0.0]);
      const output = new Float32Array(4);

      applyWindow(frame, window, output);

      expect(output[0]).toBeCloseTo(0.5, 5);
      expect(output[1]).toBeCloseTo(2.0, 5);
      expect(output[2]).toBeCloseTo(1.5, 5);
      expect(output[3]).toBeCloseTo(0.0, 5);
    });
  });

  describe('computeSpectralFlux', () => {
    it('computes half-wave rectified sum of differences', () => {
      const current = new Float32Array([5, 3, 10, 1]);
      const previous = new Float32Array([2, 4, 5, 1]);

      const flux = computeSpectralFlux(current, previous);

      // Only positive diffs: (5-2)=3, (10-5)=5 -> total 8
      // (3-4)=-1 ignored, (1-1)=0 ignored
      expect(flux).toBeCloseTo(8, 5);
    });

    it('has no negative contributions', () => {
      const current = new Float32Array([1, 1, 1]);
      const previous = new Float32Array([5, 5, 5]);

      const flux = computeSpectralFlux(current, previous);
      expect(flux).toBe(0);
    });

    it('returns 0 for identical spectra', () => {
      const spectrum = new Float32Array([1, 2, 3]);
      expect(computeSpectralFlux(spectrum, spectrum)).toBe(0);
    });
  });

  describe('computeMedian', () => {
    it('returns correct median for odd-length array', () => {
      const values = new Float32Array([3, 1, 2, 5, 4]);
      expect(computeMedian(values, 5)).toBe(3);
    });

    it('returns average of two middle values for even-length array', () => {
      const values = new Float32Array([4, 1, 3, 2]);
      expect(computeMedian(values, 4)).toBeCloseTo(2.5, 5);
    });

    it('returns 0 for length 0', () => {
      expect(computeMedian(new Float32Array([1, 2, 3]), 0)).toBe(0);
    });

    it('handles single element', () => {
      const values = new Float32Array([42]);
      expect(computeMedian(values, 1)).toBe(42);
    });
  });

  describe('mel/Hz conversions', () => {
    it('round-trips mel -> Hz -> mel accurately', () => {
      const melValue = 1000;
      const hz = melToHz(melValue);
      const melBack = hzToMel(hz);
      expect(melBack).toBeCloseTo(melValue, 2);
    });

    it('round-trips Hz -> mel -> Hz accurately', () => {
      const hzValue = 440;
      const mel = hzToMel(hzValue);
      const hzBack = melToHz(mel);
      expect(hzBack).toBeCloseTo(hzValue, 2);
    });

    it('converts 0 Hz to 0 mel', () => {
      expect(hzToMel(0)).toBeCloseTo(0, 5);
    });
  });

  describe('createMelFilterBank', () => {
    it('returns correct number of filters', () => {
      const bank = createMelFilterBank(26, 1024, 44100);
      expect(bank.length).toBe(26);
    });

    it('each filter has correct length (fftSize/2 + 1)', () => {
      const fftSize = 1024;
      const bank = createMelFilterBank(10, fftSize, 44100);
      const expectedLen = (fftSize >>> 1) + 1;

      for (const filter of bank) {
        expect(filter.length).toBe(expectedLen);
      }
    });

    it('filters have triangular shape (values in [0, 1])', () => {
      const bank = createMelFilterBank(10, 1024, 44100);

      for (const filter of bank) {
        for (const val of filter) {
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(1.001); // small tolerance
        }
      }
    });
  });
});
