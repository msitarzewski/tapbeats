import type { BPMResult } from '@/types/quantization';

const DEFAULT_MIN_BPM = 40;
const DEFAULT_MAX_BPM = 240;
const MAX_HIT_DISTANCE = 8;
const GAUSSIAN_SIGMA = 3;
const PREFERRED_LOW = 60;
const PREFERRED_HIGH = 180;
const AMBIGUITY_THRESHOLD = 0.3;
const MAX_ALTERNATIVES = 3;
const FALLBACK_BPM = 120;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computePerBeatIOIs(timestamps: readonly number[]): number[] {
  const iois: number[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    for (let j = i + 1; j <= Math.min(i + MAX_HIT_DISTANCE, timestamps.length - 1); j++) {
      const gap = j - i;
      const ti = timestamps[i] ?? 0;
      const tj = timestamps[j] ?? 0;
      const perBeatIOI = (tj - ti) / gap;
      if (perBeatIOI > 0) {
        iois.push(perBeatIOI);
      }
    }
  }
  return iois;
}

function ioiToBpm(ioi: number): number {
  return 60 / ioi;
}

function buildHistogram(
  bpmValues: readonly number[],
  minBPM: number,
  maxBPM: number,
): Float64Array {
  const numBins = maxBPM - minBPM + 1;
  const histogram = new Float64Array(numBins);
  for (const bpm of bpmValues) {
    const bin = Math.round(bpm) - minBPM;
    if (bin >= 0 && bin < numBins) {
      histogram[bin] = (histogram[bin] ?? 0) + 1;
    }
  }
  return histogram;
}

function gaussianKernel(sigma: number): Float64Array {
  const radius = Math.ceil(sigma * 3);
  const size = 2 * radius + 1;
  const kernel = new Float64Array(size);
  const denom = 2 * sigma * sigma;
  let sum = 0;
  for (let i = 0; i < size; i++) {
    const x = i - radius;
    const val = Math.exp(-(x * x) / denom);
    kernel[i] = val;
    sum += val;
  }
  // Normalize
  for (let i = 0; i < size; i++) {
    kernel[i] = (kernel[i] ?? 0) / sum;
  }
  return kernel;
}

function convolve(signal: Float64Array, kernel: Float64Array): Float64Array {
  const output = new Float64Array(signal.length);
  const radius = Math.floor(kernel.length / 2);
  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    for (let k = 0; k < kernel.length; k++) {
      const j = i + k - radius;
      if (j >= 0 && j < signal.length) {
        sum += (signal[j] ?? 0) * (kernel[k] ?? 0);
      }
    }
    output[i] = sum;
  }
  return output;
}

interface Peak {
  readonly bin: number;
  readonly height: number;
}

function findPeaks(smoothed: Float64Array): Peak[] {
  const peaks: Peak[] = [];
  for (let i = 1; i < smoothed.length - 1; i++) {
    const prev = smoothed[i - 1] ?? 0;
    const curr = smoothed[i] ?? 0;
    const next = smoothed[i + 1] ?? 0;
    if (curr > prev && curr > next) {
      peaks.push({ bin: i, height: curr });
    }
  }
  return peaks.sort((a, b) => b.height - a.height);
}

function binToBpm(bin: number, minBPM: number): number {
  return bin + minBPM;
}

function isInPreferredRange(bpm: number): boolean {
  return bpm >= PREFERRED_LOW && bpm <= PREFERRED_HIGH;
}

function resolveAmbiguity(topBpm: number, peaks: readonly Peak[], minBPM: number): number {
  if (isInPreferredRange(topBpm)) {
    return topBpm;
  }

  const topPeak = peaks[0];
  if (!topPeak) return topBpm;

  // Try halving or doubling toward the preferred range
  const candidates = [topBpm * 2, topBpm / 2];

  for (const candidate of candidates) {
    if (!isInPreferredRange(candidate)) continue;

    // Check if this candidate has a peak with at least 30% of the top peak height
    const candidateBin = Math.round(candidate) - minBPM;
    for (const peak of peaks) {
      if (
        Math.abs(peak.bin - candidateBin) <= GAUSSIAN_SIGMA &&
        peak.height >= topPeak.height * AMBIGUITY_THRESHOLD
      ) {
        return candidate;
      }
    }
  }

  return topBpm;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function detectBpm(
  timestamps: readonly number[],
  minBPM: number = DEFAULT_MIN_BPM,
  maxBPM: number = DEFAULT_MAX_BPM,
): BPMResult {
  if (timestamps.length < 2) {
    return { bpm: FALLBACK_BPM, confidence: 0, alternatives: [] };
  }

  // Step 2: Compute pairwise IOIs
  const iois = computePerBeatIOIs(timestamps);

  // Step 3: Convert to BPM and filter
  const bpmValues = iois.map(ioiToBpm).filter((b) => b >= minBPM && b <= maxBPM);

  if (bpmValues.length === 0) {
    return { bpm: FALLBACK_BPM, confidence: 0, alternatives: [] };
  }

  // Step 4: Build histogram
  const histogram = buildHistogram(bpmValues, minBPM, maxBPM);

  // Step 5: Gaussian smoothing
  const kernel = gaussianKernel(GAUSSIAN_SIGMA);
  const smoothed = convolve(histogram, kernel);

  // Step 6: Peak detection
  const peaks = findPeaks(smoothed);

  if (peaks.length === 0) {
    return { bpm: FALLBACK_BPM, confidence: 0, alternatives: [] };
  }

  // Step 7: Top peak
  const topPeak = peaks[0];
  if (topPeak === undefined) {
    return { bpm: FALLBACK_BPM, confidence: 0, alternatives: [] };
  }
  let selectedBpm = binToBpm(topPeak.bin, minBPM);

  // Step 8: Confidence
  const secondPeak = peaks[1];
  const confidence = secondPeak ? topPeak.height / (topPeak.height + secondPeak.height) : 1.0;

  // Step 9: Ambiguity resolution
  selectedBpm = resolveAmbiguity(selectedBpm, peaks, minBPM);

  // Step 10: Alternatives (up to 3 other peak BPMs)
  const alternatives = peaks
    .map((p) => binToBpm(p.bin, minBPM))
    .filter((b) => b !== selectedBpm)
    .slice(0, MAX_ALTERNATIVES);

  return {
    bpm: Math.round(selectedBpm),
    confidence: Math.round(confidence * 1000) / 1000,
    alternatives,
  };
}
