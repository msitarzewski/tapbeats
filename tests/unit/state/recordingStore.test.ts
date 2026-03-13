import { describe, it, expect, beforeEach } from 'vitest';

import { useRecordingStore } from '@/state/recordingStore';
import type { AudioCaptureError } from '@/types/audio';

describe('recordingStore', () => {
  beforeEach(() => {
    useRecordingStore.getState().reset();
  });

  describe('initial state', () => {
    it('has idle status', () => {
      expect(useRecordingStore.getState().status).toBe('idle');
    });

    it('has zero elapsed time', () => {
      expect(useRecordingStore.getState().elapsedTime).toBe(0);
    });

    it('has zero hit count', () => {
      expect(useRecordingStore.getState().hitCount).toBe(0);
    });

    it('has zero peak level', () => {
      expect(useRecordingStore.getState().peakLevel).toBe(0);
    });

    it('has null error', () => {
      expect(useRecordingStore.getState().error).toBeNull();
    });

    it('has null raw audio buffer', () => {
      expect(useRecordingStore.getState()._rawAudioBuffer).toBeNull();
    });

    it('has empty amplitudes array', () => {
      expect(useRecordingStore.getState()._amplitudes).toEqual([]);
    });
  });

  describe('setStatus', () => {
    it('updates status to recording', () => {
      useRecordingStore.getState().setStatus('recording');
      expect(useRecordingStore.getState().status).toBe('recording');
    });

    it('updates status to processing', () => {
      useRecordingStore.getState().setStatus('processing');
      expect(useRecordingStore.getState().status).toBe('processing');
    });

    it('updates status to complete', () => {
      useRecordingStore.getState().setStatus('complete');
      expect(useRecordingStore.getState().status).toBe('complete');
    });
  });

  describe('updateElapsedTime', () => {
    it('updates elapsed time', () => {
      useRecordingStore.getState().updateElapsedTime(5.5);
      expect(useRecordingStore.getState().elapsedTime).toBe(5.5);
    });

    it('can update to zero', () => {
      useRecordingStore.getState().updateElapsedTime(10);
      useRecordingStore.getState().updateElapsedTime(0);
      expect(useRecordingStore.getState().elapsedTime).toBe(0);
    });
  });

  describe('incrementHitCount', () => {
    it('increments from 0 to 1', () => {
      useRecordingStore.getState().incrementHitCount();
      expect(useRecordingStore.getState().hitCount).toBe(1);
    });

    it('increments multiple times', () => {
      useRecordingStore.getState().incrementHitCount();
      useRecordingStore.getState().incrementHitCount();
      useRecordingStore.getState().incrementHitCount();
      expect(useRecordingStore.getState().hitCount).toBe(3);
    });
  });

  describe('updatePeakLevel', () => {
    it('updates peak level', () => {
      useRecordingStore.getState().updatePeakLevel(0.85);
      expect(useRecordingStore.getState().peakLevel).toBe(0.85);
    });
  });

  describe('updateAmplitudes', () => {
    it('updates amplitudes array', () => {
      const amps = [0.1, 0.5, 0.3];
      useRecordingStore.getState().updateAmplitudes(amps);
      expect(useRecordingStore.getState()._amplitudes).toEqual(amps);
    });

    it('replaces previous amplitudes', () => {
      useRecordingStore.getState().updateAmplitudes([0.1, 0.2]);
      useRecordingStore.getState().updateAmplitudes([0.9]);
      expect(useRecordingStore.getState()._amplitudes).toEqual([0.9]);
    });
  });

  describe('setError', () => {
    it('sets error and resets status to idle', () => {
      useRecordingStore.getState().setStatus('recording');

      const error: AudioCaptureError = {
        code: 'PERMISSION_DENIED',
        message: 'Microphone permission denied',
      };
      useRecordingStore.getState().setError(error);

      expect(useRecordingStore.getState().error).toEqual(error);
      expect(useRecordingStore.getState().status).toBe('idle');
    });

    it('preserves error cause when provided', () => {
      const cause = new Error('Original error');
      const error: AudioCaptureError = {
        code: 'UNKNOWN',
        message: 'Something went wrong',
        cause,
      };
      useRecordingStore.getState().setError(error);

      expect(useRecordingStore.getState().error?.cause).toBe(cause);
    });
  });

  describe('setRawAudioBuffer', () => {
    it('stores buffer reference', () => {
      // Use a minimal mock object instead of real RingBuffer
      const mockBuffer = {
        capacity: 44100,
        length: 0,
      } as unknown as import('@/audio/capture/RingBuffer').RingBuffer;
      useRecordingStore.getState().setRawAudioBuffer(mockBuffer);
      expect(useRecordingStore.getState()._rawAudioBuffer).toBe(mockBuffer);
    });

    it('can be set to null', () => {
      const mockBuffer = {
        capacity: 44100,
        length: 0,
      } as unknown as import('@/audio/capture/RingBuffer').RingBuffer;
      useRecordingStore.getState().setRawAudioBuffer(mockBuffer);
      useRecordingStore.getState().setRawAudioBuffer(null);
      expect(useRecordingStore.getState()._rawAudioBuffer).toBeNull();
    });
  });

  describe('reset', () => {
    it('returns to initial state', () => {
      // Set various state values
      useRecordingStore.getState().setStatus('recording');
      useRecordingStore.getState().updateElapsedTime(42);
      useRecordingStore.getState().incrementHitCount();
      useRecordingStore.getState().updatePeakLevel(0.9);
      useRecordingStore.getState().updateAmplitudes([0.1, 0.5]);
      useRecordingStore
        .getState()
        .setRawAudioBuffer({
          capacity: 100,
        } as unknown as import('@/audio/capture/RingBuffer').RingBuffer);

      useRecordingStore.getState().reset();

      const state = useRecordingStore.getState();
      expect(state.status).toBe('idle');
      expect(state.elapsedTime).toBe(0);
      expect(state.hitCount).toBe(0);
      expect(state.peakLevel).toBe(0);
      expect(state.error).toBeNull();
      expect(state._rawAudioBuffer).toBeNull();
      expect(state._amplitudes).toEqual([]);
    });
  });
});
