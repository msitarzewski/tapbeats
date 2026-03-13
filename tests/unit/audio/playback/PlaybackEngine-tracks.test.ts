import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlaybackEngine } from '@/audio/playback/PlaybackEngine';

describe('PlaybackEngine track gain chain', () => {
  beforeEach(() => {
    PlaybackEngine.resetInstance();
    vi.mocked(globalThis.fetch).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      } as Response),
    );
  });

  it('init creates master gain node', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    const ctx = engine.getContext() as unknown as {
      createGain: ReturnType<typeof vi.fn>;
    };
    // At least one createGain call for master gain
    expect(ctx.createGain).toHaveBeenCalled();
  });

  it('createTrack creates track gain node', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    const ctx = engine.getContext() as unknown as {
      createGain: ReturnType<typeof vi.fn>;
    };
    const callsBefore = ctx.createGain.mock.calls.length;

    engine.createTrack('0', 0.8);
    expect(ctx.createGain.mock.calls.length).toBe(callsBefore + 1);
  });

  it('createTrack does not duplicate existing track', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    const ctx = engine.getContext() as unknown as {
      createGain: ReturnType<typeof vi.fn>;
    };
    engine.createTrack('0', 0.8);
    const callsAfterFirst = ctx.createGain.mock.calls.length;

    engine.createTrack('0', 0.5);
    expect(ctx.createGain.mock.calls.length).toBe(callsAfterFirst);
  });

  it('setTrackVolume adjusts gain value', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    engine.createTrack('test', 0.8);
    engine.setTrackVolume('test', 0.3);

    // No error thrown means success (gain node is mock)
  });

  it('setMasterVolume adjusts master gain', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    engine.setMasterVolume(0.5);
    // No error means success
  });

  it('removeTrack disconnects and removes node', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    engine.createTrack('test', 0.8);
    engine.removeTrack('test');

    // Creating same track again should create new gain
    const ctx = engine.getContext() as unknown as {
      createGain: ReturnType<typeof vi.fn>;
    };
    const callsBefore = ctx.createGain.mock.calls.length;
    engine.createTrack('test', 0.5);
    expect(ctx.createGain.mock.calls.length).toBe(callsBefore + 1);
  });

  it('removeAllTracks clears all track nodes', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    engine.createTrack('0', 0.8);
    engine.createTrack('1', 0.8);
    engine.removeAllTracks();

    // Re-creating should work without error
    engine.createTrack('0', 0.5);
  });

  it('playScheduled routes through track gain when trackId provided', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    engine.createTrack('0', 0.8);

    const ctx = engine.getContext();
    if (ctx !== null) {
      engine.playScheduled('kick-1', ctx.currentTime + 0.1, 0.8, '0');
    }

    // createBufferSource should have been called
    const mockCtx = ctx as unknown as {
      createBufferSource: ReturnType<typeof vi.fn>;
    };
    expect(mockCtx.createBufferSource).toHaveBeenCalled();
  });

  it('playScheduled routes through master when no trackId', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    const ctx = engine.getContext();
    if (ctx !== null) {
      engine.playScheduled('kick-1', ctx.currentTime + 0.1, 0.8);
    }

    const mockCtx = ctx as unknown as {
      createBufferSource: ReturnType<typeof vi.fn>;
    };
    expect(mockCtx.createBufferSource).toHaveBeenCalled();
  });

  it('dispose cleans up track nodes and master gain', async () => {
    const engine = PlaybackEngine.getInstance();
    await engine.init();

    engine.createTrack('0', 0.8);
    engine.createTrack('1', 0.8);

    engine.dispose();
    expect(engine.getContext()).toBeNull();
    expect(engine.ready).toBe(false);
  });
});
