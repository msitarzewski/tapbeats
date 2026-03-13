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

// ---------------------------------------------------------------------------
// Seeded PRNG (LCG) for deterministic test outputs
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * Generate audio with short noise bursts at specified onset positions.
 * Each click is random noise * 0.8 amplitude with default 5ms duration.
 * Uses seeded deterministic random for reproducibility.
 */
export function generateClickTrack(
  onsetTimesMs: number[],
  sampleRate: number,
  clickDurationMs = 5,
): Float32Array {
  // Determine total length: enough to hold the last click + some padding
  const lastOnsetMs = onsetTimesMs.length > 0 ? Math.max(...onsetTimesMs) : 0;
  const totalSamples = Math.ceil(((lastOnsetMs + clickDurationMs + 50) / 1000) * sampleRate);
  const buffer = new Float32Array(totalSamples);
  const clickSamples = Math.ceil((clickDurationMs / 1000) * sampleRate);
  const rand = seededRandom(42);

  for (const onsetMs of onsetTimesMs) {
    const startSample = Math.round((onsetMs / 1000) * sampleRate);
    for (let i = 0; i < clickSamples; i++) {
      const idx = startSample + i;
      if (idx < totalSamples) {
        // Random noise * 0.8 amplitude, centered around 0
        buffer[idx] = (rand() * 2 - 1) * 0.8;
      }
    }
  }

  return buffer;
}

/**
 * Generate deterministic low-level noise using seeded random.
 */
export function generateNoiseFloor(numSamples: number, amplitude: number): Float32Array {
  const buffer = new Float32Array(numSamples);
  const rand = seededRandom(123);

  for (let i = 0; i < numSamples; i++) {
    buffer[i] = (rand() * 2 - 1) * amplitude;
  }

  return buffer;
}

/**
 * Generate full-range white noise for spectral flatness testing.
 */
export function generateWhiteNoise(numSamples: number, seed = 999): Float32Array {
  const buffer = new Float32Array(numSamples);
  const rand = seededRandom(seed);

  for (let i = 0; i < numSamples; i++) {
    buffer[i] = rand() * 2 - 1;
  }

  return buffer;
}

/**
 * Generate a constant-value (DC) signal.
 */
export function generateDCSignal(numSamples: number, amplitude: number): Float32Array {
  const buffer = new Float32Array(numSamples);
  buffer.fill(amplitude);
  return buffer;
}

/**
 * Generate an envelope with linear attack and exponential decay.
 */
export function generateEnvelope(
  numSamples: number,
  attackSamples: number,
  decaySamples: number,
  peak: number,
): Float32Array {
  const buffer = new Float32Array(numSamples);

  // Attack: linear ramp from 0 to peak
  for (let i = 0; i < attackSamples && i < numSamples; i++) {
    buffer[i] = (i / attackSamples) * peak;
  }

  // Decay: exponential decay from peak
  const decayRate = -Math.log(0.001) / decaySamples; // decay to 0.1% of peak
  for (let i = attackSamples; i < numSamples; i++) {
    const decayIdx = i - attackSamples;
    buffer[i] = peak * Math.exp(-decayRate * decayIdx);
  }

  return buffer;
}
