/**
 * Known reference values for DSP validation.
 * These are mathematically derived, not empirically measured.
 */

/**
 * DFT of a DC signal (all ones) of length N:
 * Bin 0 = N, all other bins = 0.
 */
export const DC_SIGNAL_FFT = {
  description: 'DFT of DC signal: bin 0 should equal N, others 0',
  // For a signal of all 1.0 with N samples, FFT bin 0 = N
  binZeroEqualsN: true,
  otherBinsZero: true,
};

/**
 * DFT of a pure sine at bin k of length N:
 * Should produce a spike at bin k (and mirror at N-k).
 * Magnitude at bin k = N/2 for a unit-amplitude sine.
 */
export const PURE_SINE_FFT = {
  description: 'DFT of pure sine at bin k: spike at bin k with magnitude N/2',
  magnitudeAtBinK: (n: number) => n / 2,
};

/**
 * Known Hann window coefficients for size 8.
 * w(n) = 0.5 * (1 - cos(2*pi*n / (N-1))) for n=0..7, N=8
 */
export const HANN_WINDOW_SIZE_8 = new Float32Array([
  0.0, // n=0: 0.5*(1-cos(0)) = 0
  0.5 * (1 - Math.cos((2 * Math.PI * 1) / 7)), // n=1
  0.5 * (1 - Math.cos((2 * Math.PI * 2) / 7)), // n=2
  0.5 * (1 - Math.cos((2 * Math.PI * 3) / 7)), // n=3
  0.5 * (1 - Math.cos((2 * Math.PI * 4) / 7)), // n=4
  0.5 * (1 - Math.cos((2 * Math.PI * 5) / 7)), // n=5
  0.5 * (1 - Math.cos((2 * Math.PI * 6) / 7)), // n=6
  0.0, // n=7: 0.5*(1-cos(2*pi)) = 0
]);

/**
 * Spectral centroid of a pure tone at frequency f
 * equals approximately f Hz.
 */
export const SPECTRAL_CENTROID_PURE_TONE = {
  description: 'Spectral centroid of a pure tone at f Hz should be approximately f Hz',
  testFrequencyHz: 1000,
  expectedCentroidHz: 1000,
  // Tolerance depends on FFT size and windowing
  toleranceHz: (sampleRate: number, fftSize: number) => sampleRate / fftSize,
};
