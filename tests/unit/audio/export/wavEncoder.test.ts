import { describe, it, expect } from 'vitest';

import { encodeWav } from '@/audio/export/wavEncoder';

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read blob'));
    };
    reader.readAsArrayBuffer(blob);
  });
}

// Helper to create a simple AudioBuffer mock
function createAudioBuffer(
  channels: number,
  length: number,
  sampleRate: number,
  data?: Float32Array[],
): AudioBuffer {
  const channelData = data ?? Array.from({ length: channels }, () => new Float32Array(length));
  return {
    numberOfChannels: channels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: (ch: number) => channelData[ch] ?? new Float32Array(length),
    copyFromChannel: () => undefined,
    copyToChannel: () => undefined,
  } as unknown as AudioBuffer;
}

describe('wavEncoder', () => {
  it('produces a valid WAV blob', () => {
    const buffer = createAudioBuffer(1, 100, 44100);
    const blob = encodeWav(buffer);

    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBeGreaterThan(44); // At least header size
  });

  it('creates correct file size for mono input', () => {
    const length = 100;
    const buffer = createAudioBuffer(1, length, 44100);
    const blob = encodeWav(buffer);

    // Header (44) + samples (100 * 2 channels * 2 bytes)
    expect(blob.size).toBe(44 + length * 2 * 2);
  });

  it('creates correct file size for stereo input', () => {
    const length = 200;
    const buffer = createAudioBuffer(2, length, 44100);
    const blob = encodeWav(buffer);

    expect(blob.size).toBe(44 + length * 2 * 2);
  });

  it('writes valid RIFF header', async () => {
    const buffer = createAudioBuffer(1, 10, 44100);
    const blob = encodeWav(buffer);
    const arrayBuf = await blobToArrayBuffer(blob);
    const view = new DataView(arrayBuf);

    // "RIFF"
    expect(
      String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)),
    ).toBe('RIFF');
    // "WAVE"
    expect(
      String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11)),
    ).toBe('WAVE');
    // "fmt "
    expect(
      String.fromCharCode(
        view.getUint8(12),
        view.getUint8(13),
        view.getUint8(14),
        view.getUint8(15),
      ),
    ).toBe('fmt ');
    // PCM format = 1
    expect(view.getUint16(20, true)).toBe(1);
    // 2 channels
    expect(view.getUint16(22, true)).toBe(2);
    // Sample rate
    expect(view.getUint32(24, true)).toBe(44100);
    // Bits per sample
    expect(view.getUint16(34, true)).toBe(16);
    // "data"
    expect(
      String.fromCharCode(
        view.getUint8(36),
        view.getUint8(37),
        view.getUint8(38),
        view.getUint8(39),
      ),
    ).toBe('data');
  });

  it('clamps samples to [-1, 1]', async () => {
    const data = new Float32Array([2.0, -2.0, 0.5, -0.5]);
    const buffer = createAudioBuffer(1, 4, 44100, [data]);
    const blob = encodeWav(buffer);
    const arrayBuf = await blobToArrayBuffer(blob);
    const view = new DataView(arrayBuf);

    // First L sample (clamped to 1.0 → 32767)
    const sample0 = view.getInt16(44, true);
    expect(sample0).toBe(32767);

    // Second L sample (clamped to -1.0 → -32768)
    const sample2 = view.getInt16(48, true);
    expect(sample2).toBe(-32768);
  });

  it('handles empty buffer', () => {
    const buffer = createAudioBuffer(1, 0, 44100);
    const blob = encodeWav(buffer);
    expect(blob.size).toBe(44); // Header only
  });

  it('duplicates mono to stereo', async () => {
    const data = new Float32Array([0.5]);
    const buffer = createAudioBuffer(1, 1, 44100, [data]);
    const blob = encodeWav(buffer);
    const arrayBuf = await blobToArrayBuffer(blob);
    const view = new DataView(arrayBuf);

    // L and R should be the same value
    const left = view.getInt16(44, true);
    const right = view.getInt16(46, true);
    expect(left).toBe(right);
  });

  it('handles different sample rates', () => {
    const buffer = createAudioBuffer(1, 100, 22050);
    const blob = encodeWav(buffer);
    expect(blob.size).toBe(44 + 100 * 2 * 2);
  });
});
