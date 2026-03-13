/**
 * Generate a Float32Array filled with silence (all zeros).
 */
export function generateSilence(length: number): Float32Array {
  return new Float32Array(length);
}

/**
 * Generate a sine wave at the given frequency and sample rate.
 */
export function generateSineWave(
  length: number,
  frequency: number,
  sampleRate: number,
): Float32Array {
  const buffer = new Float32Array(length);
  const angularFrequency = (2 * Math.PI * frequency) / sampleRate;

  for (let i = 0; i < length; i++) {
    buffer[i] = Math.sin(angularFrequency * i);
  }

  return buffer;
}

/**
 * Generate a buffer with a single impulse (1.0) at the given position.
 */
export function generateImpulse(length: number, position: number): Float32Array {
  const buffer = new Float32Array(length);

  if (position >= 0 && position < length) {
    buffer[position] = 1.0;
  }

  return buffer;
}
