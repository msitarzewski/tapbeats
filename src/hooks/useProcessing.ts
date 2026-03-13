import { useEffect } from 'react';

import { FeatureExtractor } from '@/audio/analysis/FeatureExtractor';
import { useRecordingStore } from '@/state/recordingStore';
import type { AudioFeatures } from '@/types/audio';

export function useProcessing(sampleRate: number): void {
  const status = useRecordingStore((s) => s.status);
  const setStatus = useRecordingStore((s) => s.setStatus);

  useEffect(() => {
    if (status !== 'processing') return;

    const onsets = useRecordingStore.getState()._onsets;
    if (onsets.length === 0) {
      setStatus('complete');
      return;
    }

    // Process all onsets synchronously — they're small enough
    try {
      const extractor = new FeatureExtractor({ fftSize: 1024, sampleRate });

      for (let i = 0; i < onsets.length; i++) {
        const hit = onsets[i];
        if (hit?.onset.snippetBuffer !== null && hit?.onset.snippetBuffer !== undefined) {
          const features = extractor.extract(hit.onset.snippetBuffer, sampleRate);
          useRecordingStore.getState().updateHitFeatures(i, features);
        }
      }

      normalizeFeatures();
    } catch {
      // Feature extraction failed — still complete the recording
    }

    setStatus('complete');
  }, [status, sampleRate, setStatus]);
}

function normalizeFeatures(): void {
  const state = useRecordingStore.getState();
  const onsets = state._onsets;
  const withFeatures = onsets.filter((h) => h.features !== null);
  if (withFeatures.length < 2) return;

  const stats = computeFeatureStats(
    withFeatures.map((h) => h.features).filter((f): f is AudioFeatures => f !== null),
  );

  for (let i = 0; i < onsets.length; i++) {
    const hit = onsets[i];
    if (hit?.features === null || hit?.features === undefined) continue;
    const f = hit.features;
    const normalized: AudioFeatures = {
      ...f,
      rms: (f.rms - stats.rms.mean) / stats.rms.std,
      spectralCentroid:
        (f.spectralCentroid - stats.spectralCentroid.mean) / stats.spectralCentroid.std,
      spectralRolloff: (f.spectralRolloff - stats.spectralRolloff.mean) / stats.spectralRolloff.std,
      spectralFlatness:
        (f.spectralFlatness - stats.spectralFlatness.mean) / stats.spectralFlatness.std,
      zeroCrossingRate:
        (f.zeroCrossingRate - stats.zeroCrossingRate.mean) / stats.zeroCrossingRate.std,
      attackTime: (f.attackTime - stats.attackTime.mean) / stats.attackTime.std,
      decayTime: (f.decayTime - stats.decayTime.mean) / stats.decayTime.std,
    };
    state.updateHitFeatures(i, normalized);
  }
}

interface FeatureStat {
  mean: number;
  std: number;
}

type FeatureStats = Record<
  | 'rms'
  | 'spectralCentroid'
  | 'spectralRolloff'
  | 'spectralFlatness'
  | 'zeroCrossingRate'
  | 'attackTime'
  | 'decayTime',
  FeatureStat
>;

function computeFeatureStats(features: AudioFeatures[]): FeatureStats {
  const keys = [
    'rms',
    'spectralCentroid',
    'spectralRolloff',
    'spectralFlatness',
    'zeroCrossingRate',
    'attackTime',
    'decayTime',
  ] as const;

  const result = {} as FeatureStats;

  for (const key of keys) {
    const values = features.map((f) => f[key]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
    result[key] = { mean, std: Math.sqrt(variance) || 1 };
  }

  return result;
}
