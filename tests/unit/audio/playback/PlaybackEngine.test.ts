import { describe, it, expect, beforeEach, vi } from 'vitest';

import { PlaybackEngine } from '@/audio/playback/PlaybackEngine';

describe('PlaybackEngine', () => {
  beforeEach(() => {
    PlaybackEngine.resetInstance();
    vi.mocked(globalThis.fetch).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      } as Response),
    );
  });

  it('getInstance returns same instance', () => {
    const a = PlaybackEngine.getInstance();
    const b = PlaybackEngine.getInstance();
    expect(a).toBe(b);
  });

  it('resetInstance creates fresh instance', () => {
    const a = PlaybackEngine.getInstance();
    PlaybackEngine.resetInstance();
    const b = PlaybackEngine.getInstance();
    expect(a).not.toBe(b);
  });

  it('ready is false before init, true after', async () => {
    const engine = PlaybackEngine.getInstance();
    expect(engine.ready).toBe(false);
    await engine.init();
    expect(engine.ready).toBe(true);
  });

  it('init creates AudioContext', async () => {
    const engine = PlaybackEngine.getInstance();
    expect(engine.getContext()).toBeNull();
    await engine.init();
    expect(engine.getContext()).not.toBeNull();
  });

  it('init fetches samples from correct URLs', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();
    // Should have fetched one URL per manifest entry (18 samples)
    expect(globalThis.fetch).toHaveBeenCalledTimes(18);
    // Check a specific URL pattern
    expect(globalThis.fetch).toHaveBeenCalledWith('/samples/kicks/kick-1.wav');
    expect(globalThis.fetch).toHaveBeenCalledWith('/samples/snares/snare-1.wav');
    expect(globalThis.fetch).toHaveBeenCalledWith('/samples/hihats/hihat-closed-1.wav');
  });

  it('playSample creates and starts source node', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    engine.playSample('kick-1');

    const ctx = engine.getContext() as unknown as {
      createBufferSource: ReturnType<typeof vi.fn>;
      createBuffer: ReturnType<typeof vi.fn>;
    };
    expect(ctx).not.toBeNull();
    // createBufferSource should have been called
    expect(ctx.createBufferSource).toHaveBeenCalled();
  });

  it('playSample with unknown ID does nothing', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    const ctx = engine.getContext() as unknown as {
      createBufferSource: ReturnType<typeof vi.fn>;
    };
    const callsBefore = ctx.createBufferSource.mock.calls.length;

    engine.playSample('nonexistent-999');

    const callsAfter = ctx.createBufferSource.mock.calls.length;
    expect(callsAfter).toBe(callsBefore);
  });

  it('playBuffer creates buffer and plays', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    const samples = new Float32Array([0.1, 0.2, 0.3]);
    engine.playBuffer(samples);

    const ctx = engine.getContext() as unknown as {
      createBufferSource: ReturnType<typeof vi.fn>;
      createBuffer: ReturnType<typeof vi.fn>;
    };
    expect(ctx.createBuffer).toHaveBeenCalled();
    expect(ctx.createBufferSource).toHaveBeenCalled();
  });

  it('stop disconnects current source', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    engine.playSample('kick-1');
    engine.stop();

    // After stop, playing another sample should work without errors
    engine.playSample('snare-1');
  });

  it('getBuffer returns null for unknown instrument', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();
    expect(engine.getBuffer('nonexistent-999')).toBeNull();
  });

  it('dispose cleans up context', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    expect(engine.getContext()).not.toBeNull();
    expect(engine.ready).toBe(true);

    engine.dispose();

    expect(engine.getContext()).toBeNull();
    expect(engine.ready).toBe(false);
  });
});
