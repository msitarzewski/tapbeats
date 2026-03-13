/**
 * Pure DSP utility functions.
 * All functions are stateless and allocation-aware.
 */

/** Standard Hann window coefficients */
export function createHannWindow(size: number): Float32Array {
  const window = new Float32Array(size);
  const factor = (2 * Math.PI) / (size - 1);
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 * (1 - Math.cos(factor * i));
  }
  return window;
}

/** Element-wise multiply of frame and window into output */
export function applyWindow(frame: Float32Array, window: Float32Array, output: Float32Array): void {
  const len = frame.length;
  for (let i = 0; i < len; i++) {
    output[i] = (frame[i] ?? 0) * (window[i] ?? 0);
  }
}

/**
 * Half-wave rectified spectral flux.
 * Sum of max(0, current[i] - previous[i]) for all bins.
 */
export function computeSpectralFlux(current: Float32Array, previous: Float32Array): number {
  let flux = 0;
  const len = current.length;
  for (let i = 0; i < len; i++) {
    const diff = (current[i] ?? 0) - (previous[i] ?? 0);
    if (diff > 0) {
      flux += diff;
    }
  }
  return flux;
}

/**
 * Median of first `length` elements in `values`.
 * Non-destructive (sorts a copy).
 */
export function computeMedian(values: Float32Array, length: number): number {
  if (length <= 0) return 0;

  // Copy and sort the relevant portion
  const sorted = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    sorted[i] = values[i] ?? 0;
  }
  sorted.sort();

  const mid = length >>> 1;
  if (length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? 0;
}

/** Convert mel frequency to Hz */
export function melToHz(mel: number): number {
  return 700 * (Math.pow(10, mel / 2595) - 1);
}

/** Convert Hz to mel frequency */
export function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700);
}

/**
 * Create a mel-scale triangular filter bank.
 * Returns an array of `numFilters` Float32Array weight vectors,
 * each of length fftSize/2 + 1 (number of magnitude bins).
 */
export function createMelFilterBank(
  numFilters: number,
  fftSize: number,
  sampleRate: number,
): Float32Array[] {
  const numBins = (fftSize >>> 1) + 1;
  const lowMel = hzToMel(0);
  const highMel = hzToMel(sampleRate / 2);

  // numFilters + 2 equally-spaced points in mel space
  const melPoints = new Float32Array(numFilters + 2);
  const melStep = (highMel - lowMel) / (numFilters + 1);
  for (let i = 0; i < numFilters + 2; i++) {
    melPoints[i] = lowMel + i * melStep;
  }

  // Convert mel points to FFT bin indices
  const binIndices = new Float32Array(numFilters + 2);
  for (let i = 0; i < numFilters + 2; i++) {
    const hz = melToHz(melPoints[i] ?? 0);
    binIndices[i] = Math.floor(((fftSize + 1) * hz) / sampleRate);
  }

  const filterBank: Float32Array[] = [];
  for (let m = 0; m < numFilters; m++) {
    const filter = new Float32Array(numBins);
    const start = binIndices[m] ?? 0;
    const center = binIndices[m + 1] ?? 0;
    const end = binIndices[m + 2] ?? 0;

    // Rising slope
    for (let k = Math.ceil(start); k < center; k++) {
      if (k >= 0 && k < numBins && center !== start) {
        filter[k] = (k - start) / (center - start);
      }
    }

    // Peak
    if (center >= 0 && center < numBins) {
      filter[center] = 1;
    }

    // Falling slope
    for (let k = Math.ceil(center) + 1; k <= end; k++) {
      if (k >= 0 && k < numBins && end !== center) {
        filter[k] = (end - k) / (end - center);
      }
    }

    filterBank.push(filter);
  }

  return filterBank;
}
