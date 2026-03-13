import { describe, it, expect } from 'vitest';

import { detectAudioFormat } from '@/audio/playback/formatDetection';

describe('detectAudioFormat', () => {
  it("returns 'wav'", () => {
    expect(detectAudioFormat()).toBe('wav');
  });

  it('return type is consistent across calls', () => {
    const first = detectAudioFormat();
    const second = detectAudioFormat();
    expect(first).toBe(second);
  });
});
