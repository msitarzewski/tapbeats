import { useCallback, useEffect, useRef } from 'react';

import { AudioCapture } from '@/audio/capture/AudioCapture';
import { RingBuffer } from '@/audio/capture/RingBuffer';
import { useRecordingStore } from '@/state/recordingStore';
import type { AudioCaptureError } from '@/types/audio';

const MAX_DURATION_SECONDS = 120;
const TIMER_INTERVAL_MS = 100;
const WAVEFORM_AMPLITUDE_HISTORY = 128;

export function useAudioCapture() {
  const captureRef = useRef<AudioCapture | null>(null);
  const ringBufferRef = useRef<RingBuffer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const amplitudesRef = useRef<number[]>([]);

  const {
    status,
    elapsedTime,
    hitCount,
    peakLevel,
    error,
    setStatus,
    updateElapsedTime,
    updatePeakLevel,
    updateAmplitudes,
    setError,
    setRawAudioBuffer,
    reset,
  } = useRecordingStore();

  const stopRecording = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (captureRef.current !== null) {
      captureRef.current.stop();
    }

    setStatus('processing');
    // In M2, processing is instant (no onset detection yet)
    setStatus('complete');
  }, [setStatus]);

  const startRecording = useCallback(async () => {
    reset();
    setStatus('requesting_permission');

    const capture = new AudioCapture();
    captureRef.current = capture;

    // Create ring buffer (~2 min at whatever sample rate the context uses)
    const ringBuffer = new RingBuffer(MAX_DURATION_SECONDS + 5, 44100);
    ringBufferRef.current = ringBuffer;
    setRawAudioBuffer(ringBuffer);

    amplitudesRef.current = [];

    // Handle buffer data from worklet
    capture.on('buffer', (buffer: Float32Array) => {
      ringBuffer.write(buffer);

      // Compute peak amplitude
      let peak = 0;
      for (const sample of buffer) {
        const abs = Math.abs(sample);
        if (abs > peak) peak = abs;
      }
      updatePeakLevel(peak);

      // Push amplitude for waveform visualization
      const amps = amplitudesRef.current;
      amps.push(peak);
      if (amps.length > WAVEFORM_AMPLITUDE_HISTORY) {
        amps.shift();
      }
      updateAmplitudes([...amps]);
    });

    capture.on('error', (err: AudioCaptureError) => {
      setError(err);
    });

    capture.on('stateChange', (state) => {
      if (state === 'active') {
        setStatus('recording');
      }
    });

    try {
      await capture.start();

      // Start elapsed timer
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        updateElapsedTime(elapsed);

        // Auto-stop at max duration
        if (elapsed >= MAX_DURATION_SECONDS) {
          stopRecording();
        }
      }, TIMER_INTERVAL_MS);
    } catch {
      setError({
        code: 'UNKNOWN',
        message: 'Failed to start audio capture',
      });
    }
  }, [
    reset,
    setStatus,
    setRawAudioBuffer,
    updatePeakLevel,
    updateAmplitudes,
    setError,
    updateElapsedTime,
    stopRecording,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
      if (captureRef.current !== null) {
        captureRef.current.dispose();
      }
      if (ringBufferRef.current !== null) {
        ringBufferRef.current.dispose();
      }
    };
  }, []);

  return {
    status,
    elapsedTime,
    hitCount,
    peakLevel,
    error,
    startRecording,
    stopRecording,
  };
}
