/**
 * FeatureExtractor
 *
 * Computes a 12-dimensional AudioFeatures vector from a raw audio snippet.
 * Uses FFT internally. Individual pure functions are exported for unit testing.
 */
import { applyWindow, createHannWindow, createMelFilterBank } from './dsp-utils';
import { FFT } from './FFT';

import type { AudioFeatures } from '../../types/audio';

// ---------------------------------------------------------------------------
// Pure feature functions (exported for testing)
// ---------------------------------------------------------------------------

/** Root-mean-square energy */
export function computeRMS(signal: Float32Array): number {
  let sum = 0;
  const len = signal.length;
  for (let i = 0; i < len; i++) {
    const s = signal[i] ?? 0;
    sum += s * s;
  }
  return Math.sqrt(sum / len);
}

/** Spectral centroid in Hz (weighted mean of frequency bins) */
export function computeSpectralCentroid(
  magnitudes: Float32Array,
  sampleRate: number,
  fftSize: number,
): number {
  let weightedSum = 0;
  let totalMagnitude = 0;
  const binCount = magnitudes.length;
  const freqResolution = sampleRate / fftSize;

  for (let i = 0; i < binCount; i++) {
    const freq = i * freqResolution;
    const mag = magnitudes[i] ?? 0;
    weightedSum += freq * mag;
    totalMagnitude += mag;
  }

  return totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
}

/** Spectral rolloff: frequency bin below which `rolloffPercent` of spectral energy resides */
export function computeSpectralRolloff(magnitudes: Float32Array, rolloffPercent = 0.85): number {
  let totalEnergy = 0;
  const len = magnitudes.length;
  for (let i = 0; i < len; i++) {
    const mag = magnitudes[i] ?? 0;
    totalEnergy += mag * mag;
  }

  const threshold = totalEnergy * rolloffPercent;
  let cumulative = 0;
  for (let i = 0; i < len; i++) {
    const mag = magnitudes[i] ?? 0;
    cumulative += mag * mag;
    if (cumulative >= threshold) {
      return i / len;
    }
  }
  return 1;
}

/** Spectral flatness: geometric mean / arithmetic mean of magnitude spectrum */
export function computeSpectralFlatness(magnitudes: Float32Array): number {
  const len = magnitudes.length;
  if (len === 0) return 0;

  let logSum = 0;
  let arithmeticSum = 0;
  let validCount = 0;

  for (let i = 0; i < len; i++) {
    const mag = magnitudes[i] ?? 0;
    if (mag > 0) {
      logSum += Math.log(mag);
      validCount++;
    }
    arithmeticSum += mag;
  }

  if (validCount === 0 || arithmeticSum === 0) return 0;

  const geometricMean = Math.exp(logSum / validCount);
  const arithmeticMean = arithmeticSum / len;

  return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
}

/** Zero crossing rate: fraction of adjacent sample sign changes */
export function computeZeroCrossingRate(signal: Float32Array): number {
  let crossings = 0;
  const len = signal.length;
  for (let i = 1; i < len; i++) {
    if ((signal[i] ?? 0) >= 0 !== (signal[i - 1] ?? 0) >= 0) {
      crossings++;
    }
  }
  return crossings / (len - 1);
}

/** Attack time: seconds from signal start to peak amplitude */
export function computeAttackTime(signal: Float32Array, sampleRate: number): number {
  let peakIdx = 0;
  let peakVal = 0;
  const len = signal.length;

  for (let i = 0; i < len; i++) {
    const absVal = Math.abs(signal[i] ?? 0);
    if (absVal > peakVal) {
      peakVal = absVal;
      peakIdx = i;
    }
  }

  return peakIdx / sampleRate;
}

/** Decay time: seconds from peak amplitude to 10% of peak */
export function computeDecayTime(signal: Float32Array, sampleRate: number): number {
  let peakIdx = 0;
  let peakVal = 0;
  const len = signal.length;

  for (let i = 0; i < len; i++) {
    const absVal = Math.abs(signal[i] ?? 0);
    if (absVal > peakVal) {
      peakVal = absVal;
      peakIdx = i;
    }
  }

  const decayThreshold = peakVal * 0.1;
  for (let i = peakIdx + 1; i < len; i++) {
    if (Math.abs(signal[i] ?? 0) <= decayThreshold) {
      return (i - peakIdx) / sampleRate;
    }
  }

  // Signal never decays to 10% — return time to end
  return (len - 1 - peakIdx) / sampleRate;
}

/**
 * Compute MFCCs from magnitude spectrum using mel filter bank.
 * Applies log compression and DCT-II.
 */
export function computeMFCCs(
  magnitudes: Float32Array,
  melFilterBank: Float32Array[],
  numCoefficients = 5,
): number[] {
  const numFilters = melFilterBank.length;

  // Apply mel filter bank -> log energy per filter
  const melEnergies = new Float32Array(numFilters);
  for (let m = 0; m < numFilters; m++) {
    let energy = 0;
    const filter = melFilterBank[m];
    if (!filter) continue;
    const filterLen = filter.length;
    for (let k = 0; k < filterLen; k++) {
      energy += (magnitudes[k] ?? 0) * (filter[k] ?? 0);
    }
    // Log compression (floor to avoid -Infinity)
    melEnergies[m] = Math.log(Math.max(energy, 1e-10));
  }

  // DCT-II to get cepstral coefficients
  const mfccs: number[] = [];
  const scale = Math.sqrt(2 / numFilters);
  for (let c = 0; c < numCoefficients; c++) {
    let sum = 0;
    for (let m = 0; m < numFilters; m++) {
      sum += (melEnergies[m] ?? 0) * Math.cos((Math.PI * c * (m + 0.5)) / numFilters);
    }
    mfccs.push(sum * scale);
  }

  return mfccs;
}

// ---------------------------------------------------------------------------
// FeatureExtractor class
// ---------------------------------------------------------------------------

interface FeatureExtractorConfig {
  fftSize: number;
  sampleRate: number;
}

export class FeatureExtractor {
  private readonly fftSize: number;
  private readonly sampleRate: number;
  private readonly fft: FFT;
  private readonly window: Float32Array;
  private readonly melFilterBank: Float32Array[];
  private readonly windowedBuffer: Float32Array;
  private readonly magnitudeBuffer: Float32Array;

  constructor(config: FeatureExtractorConfig) {
    this.fftSize = config.fftSize;
    this.sampleRate = config.sampleRate;
    this.fft = new FFT(config.fftSize);
    this.window = createHannWindow(config.fftSize);
    this.melFilterBank = createMelFilterBank(26, config.fftSize, config.sampleRate);
    this.windowedBuffer = new Float32Array(config.fftSize);
    this.magnitudeBuffer = new Float32Array((config.fftSize >>> 1) + 1);
  }

  /**
   * Extract a full 12-dimensional AudioFeatures vector from a raw audio snippet.
   * The snippet can be any length; the first fftSize samples are used for spectral features.
   */
  extract(snippet: Float32Array, sampleRate: number): AudioFeatures {
    const fftSize = this.fftSize;
    const usedSampleRate = sampleRate || this.sampleRate;

    // Prepare an fftSize-length frame from the snippet
    // If snippet is shorter, zero-pad; if longer, use the first fftSize samples
    const frame = new Float32Array(fftSize);
    const copyLen = Math.min(snippet.length, fftSize);
    for (let i = 0; i < copyLen; i++) {
      frame[i] = snippet[i] ?? 0;
    }

    // Window and FFT
    applyWindow(frame, this.window, this.windowedBuffer);
    this.fft.forward(this.windowedBuffer);
    this.fft.magnitudeSpectrum(this.fft.realBuffer, this.fft.imagBuffer, this.magnitudeBuffer);

    // Time-domain features use full snippet
    const rms = computeRMS(snippet);
    const zeroCrossingRate = computeZeroCrossingRate(snippet);
    const attackTime = computeAttackTime(snippet, usedSampleRate);
    const decayTime = computeDecayTime(snippet, usedSampleRate);

    // Spectral features
    const spectralCentroid = computeSpectralCentroid(this.magnitudeBuffer, usedSampleRate, fftSize);
    const spectralRolloff = computeSpectralRolloff(this.magnitudeBuffer);
    const spectralFlatness = computeSpectralFlatness(this.magnitudeBuffer);

    // MFCCs
    const mfcc = computeMFCCs(this.magnitudeBuffer, this.melFilterBank, 5);

    return {
      rms,
      spectralCentroid,
      spectralRolloff,
      spectralFlatness,
      zeroCrossingRate,
      attackTime,
      decayTime,
      mfcc,
    };
  }
}
