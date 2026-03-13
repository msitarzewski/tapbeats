import { describe, it, expect, vi, beforeEach } from 'vitest';

import { encodeWav } from '@/audio/export/wavEncoder';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useTimelineStore } from '@/state/timelineStore';

import { createMockQuantizedHit, createMockTrackConfig } from '../helpers/sessionFixtures';

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

describe('export pipeline integration', () => {
  beforeEach(() => {
    useQuantizationStore.getState().reset();
    useTimelineStore.getState().reset();
  });

  describe('encodeWav produces valid output', () => {
    it('encodes a synthetic AudioBuffer to WAV', () => {
      const length = 44100; // 1 second
      const data = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        data[i] = Math.sin((2 * Math.PI * 440 * i) / 44100) * 0.5;
      }

      const buffer = {
        numberOfChannels: 1,
        length,
        sampleRate: 44100,
        duration: 1,
        getChannelData: () => data,
      } as unknown as AudioBuffer;

      const blob = encodeWav(buffer);
      expect(blob.size).toBe(44 + length * 4); // header + stereo 16-bit
      expect(blob.type).toBe('audio/wav');
    });

    it('encodes stereo buffer correctly', () => {
      const length = 1000;
      const left = new Float32Array(length).fill(0.3);
      const right = new Float32Array(length).fill(-0.3);

      const buffer = {
        numberOfChannels: 2,
        length,
        sampleRate: 44100,
        duration: length / 44100,
        getChannelData: (ch: number) => (ch === 0 ? left : right),
      } as unknown as AudioBuffer;

      const blob = encodeWav(buffer);
      expect(blob.size).toBe(44 + length * 4);
    });
  });

  describe('renderMix with mocked OfflineAudioContext', () => {
    it('uses correct store state', async () => {
      // renderMix reads from stores. Set up some state.
      useQuantizationStore.setState({
        quantizedHits: [
          createMockQuantizedHit(0, 0, 'kick-basic'),
          createMockQuantizedHit(1, 1, 'snare-basic'),
        ],
      });
      useTimelineStore.setState({
        trackConfigs: [createMockTrackConfig(0), createMockTrackConfig(1)],
        masterVolume: 0.8,
      });

      // The OfflineAudioContext is mocked in setupTests.ts
      // renderMix will create an instance and try to render
      const { renderMix } = await import('@/audio/export/renderMix');

      // Mock PlaybackEngine.getBuffer to return something
      const { PlaybackEngine } = await import('@/audio/playback/PlaybackEngine');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      vi.spyOn(PlaybackEngine, 'getInstance').mockReturnValue({
        getBuffer: () => ({
          duration: 0.5,
          length: 22050,
          sampleRate: 44100,
          numberOfChannels: 1,
          getChannelData: () => new Float32Array(22050),
          copyFromChannel: vi.fn(),
          copyToChannel: vi.fn(),
        }),
      } as never);

      const result = await renderMix();
      expect(result).toBeDefined();
    });
  });

  describe('full export flow', () => {
    it('encodeWav produces correct size for known input', () => {
      const length = 22050; // 0.5 seconds at 44100
      const data = new Float32Array(length).fill(0.25);
      const buffer = {
        numberOfChannels: 1,
        length,
        sampleRate: 44100,
        duration: 0.5,
        getChannelData: () => data,
      } as unknown as AudioBuffer;

      const blob = encodeWav(buffer);
      // 44 header + 22050 samples * 2 channels * 2 bytes
      expect(blob.size).toBe(44 + 22050 * 4);
    });

    it('WAV header contains correct sample rate', async () => {
      const data = new Float32Array(100).fill(0.1);
      const buffer = {
        numberOfChannels: 1,
        length: 100,
        sampleRate: 48000,
        duration: 100 / 48000,
        getChannelData: () => data,
      } as unknown as AudioBuffer;

      const blob = encodeWav(buffer);
      const ab = await blobToArrayBuffer(blob);
      const view = new DataView(ab);
      expect(view.getUint32(24, true)).toBe(48000);
    });
  });
});
