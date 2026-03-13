import { describe, it, expect, beforeEach } from 'vitest';

import { RingBuffer } from '@/audio/capture/RingBuffer';

import {
  generateImpulse,
  generateSilence,
  generateSineWave,
} from '../../../fixtures/audio-samples';

describe('RingBuffer', () => {
  let buffer: RingBuffer;
  const SAMPLE_RATE = 44100;
  const DURATION = 2; // seconds
  const EXPECTED_CAPACITY = Math.ceil(DURATION * SAMPLE_RATE);

  beforeEach(() => {
    buffer = new RingBuffer(DURATION, SAMPLE_RATE);
  });

  describe('constructor', () => {
    it('creates buffer with correct capacity', () => {
      expect(buffer.capacity).toBe(EXPECTED_CAPACITY);
    });

    it('starts with zero samples written', () => {
      expect(buffer.samplesWritten).toBe(0);
    });

    it('starts with zero length', () => {
      expect(buffer.length).toBe(0);
    });

    it('calculates 48kHz capacity correctly', () => {
      const highRateBuffer = new RingBuffer(2, 48000);
      expect(highRateBuffer.capacity).toBe(96000);
      highRateBuffer.dispose();
    });
  });

  describe('write and read', () => {
    it('writes samples and reads them back correctly', () => {
      const samples = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]);
      buffer.write(samples);

      const result = buffer.read(0, 5);
      expect(result).toEqual(samples);
    });

    it('tracks samplesWritten correctly', () => {
      const samples = new Float32Array([0.1, 0.2, 0.3]);
      buffer.write(samples);

      expect(buffer.samplesWritten).toBe(3);
    });

    it('tracks length correctly before wrap', () => {
      const samples = new Float32Array([0.1, 0.2, 0.3]);
      buffer.write(samples);

      expect(buffer.length).toBe(3);
    });

    it('caps length at capacity after wrap', () => {
      const big = generateSilence(EXPECTED_CAPACITY + 100);
      buffer.write(big);

      expect(buffer.length).toBe(EXPECTED_CAPACITY);
      expect(buffer.samplesWritten).toBe(EXPECTED_CAPACITY + 100);
    });

    it('reads silence from a sine wave buffer', () => {
      const sine = generateSineWave(1024, 440, SAMPLE_RATE);
      buffer.write(sine);

      const result = buffer.read(0, 1024);
      expect(result.length).toBe(1024);
      // The first sample of a sine at 0 should be ~0
      expect(Math.abs(result[0]!)).toBeLessThan(0.001);
    });

    it('reads impulse correctly', () => {
      const impulse = generateImpulse(128, 64);
      buffer.write(impulse);

      const result = buffer.read(0, 128);
      expect(result[64]).toBe(1.0);
      expect(result[0]).toBe(0);
      expect(result[63]).toBe(0);
      expect(result[65]).toBe(0);
    });
  });

  describe('wrap-around (circular behavior)', () => {
    it('overwrites oldest samples when capacity is exceeded', () => {
      // Use a small buffer for easy testing
      const small = new RingBuffer(1, 4); // capacity = 4
      const first = new Float32Array([1, 2, 3, 4]);
      const second = new Float32Array([5, 6]);

      small.write(first);
      small.write(second);

      // After wrap, buffer should contain [5, 6, 3, 4] in raw storage
      // Reading from writeIndex 2 for 4 samples should give: 3, 4, 5, 6
      const arr = small.toArray();
      expect(arr).toEqual(new Float32Array([3, 4, 5, 6]));

      small.dispose();
    });

    it('handles exact capacity wrap correctly', () => {
      const small = new RingBuffer(1, 4); // capacity = 4
      const first = new Float32Array([1, 2, 3, 4]);
      const second = new Float32Array([5, 6, 7, 8]);

      small.write(first);
      small.write(second);

      const arr = small.toArray();
      expect(arr).toEqual(new Float32Array([5, 6, 7, 8]));

      small.dispose();
    });
  });

  describe('toArray', () => {
    it('returns chronological data (oldest to newest)', () => {
      const small = new RingBuffer(1, 4); // capacity = 4
      small.write(new Float32Array([1, 2, 3, 4, 5, 6]));

      const arr = small.toArray();
      // Oldest to newest: 3, 4, 5, 6
      expect(arr).toEqual(new Float32Array([3, 4, 5, 6]));

      small.dispose();
    });

    it('returns only written data before wrap', () => {
      const samples = new Float32Array([0.1, 0.2, 0.3]);
      buffer.write(samples);

      const arr = buffer.toArray();
      expect(arr.length).toBe(3);
      expect(arr).toEqual(samples);
    });

    it('returns empty array before any writes', () => {
      const arr = buffer.toArray();
      expect(arr.length).toBe(0);
    });
  });

  describe('boundary conditions', () => {
    it('write exactly capacity samples', () => {
      const exact = new Float32Array(EXPECTED_CAPACITY);
      for (let i = 0; i < EXPECTED_CAPACITY; i++) {
        exact[i] = i / EXPECTED_CAPACITY;
      }
      buffer.write(exact);

      expect(buffer.length).toBe(EXPECTED_CAPACITY);
      expect(buffer.samplesWritten).toBe(EXPECTED_CAPACITY);

      const result = buffer.toArray();
      expect(result.length).toBe(EXPECTED_CAPACITY);
      expect(result[0]).toBe(exact[0]);
    });

    it('read at buffer edges', () => {
      const small = new RingBuffer(1, 8); // capacity = 8
      small.write(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]));

      // Read first element
      const first = small.read(0, 1);
      expect(first[0]).toBe(1);

      // Read last element
      const last = small.read(7, 1);
      expect(last[0]).toBe(8);

      small.dispose();
    });

    it('multiple small writes accumulate correctly', () => {
      buffer.write(new Float32Array([0.1]));
      buffer.write(new Float32Array([0.2]));
      buffer.write(new Float32Array([0.3]));

      expect(buffer.samplesWritten).toBe(3);
      expect(buffer.length).toBe(3);

      const arr = buffer.toArray();
      expect(arr).toEqual(new Float32Array([0.1, 0.2, 0.3]));
    });
  });

  describe('dispose', () => {
    it('releases buffer and subsequent read returns empty', () => {
      buffer.write(new Float32Array([1, 2, 3]));
      buffer.dispose();

      const result = buffer.read(0, 3);
      expect(result.length).toBe(0);
    });

    it('subsequent toArray returns empty', () => {
      buffer.write(new Float32Array([1, 2, 3]));
      buffer.dispose();

      const arr = buffer.toArray();
      expect(arr.length).toBe(0);
    });

    it('subsequent write is a no-op', () => {
      buffer.dispose();
      buffer.write(new Float32Array([1, 2, 3]));

      expect(buffer.samplesWritten).toBe(0);
    });
  });
});
