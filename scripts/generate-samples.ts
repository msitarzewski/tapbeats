/**
 * generate-samples.ts
 *
 * Synthesizes drum samples as WAV files (44100Hz, mono, 16-bit PCM).
 * Run: npx tsx scripts/generate-samples.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

const SAMPLE_RATE = 44100;
const NORMALIZATION_CEILING = 0.89; // -1 dBFS

// ---------------------------------------------------------------------------
// WAV writer
// ---------------------------------------------------------------------------

function writeWav(
  filename: string,
  samples: Float32Array,
  sampleRate: number,
): void {
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const numSamples = samples.length;
  const bytesPerSample = 2; // 16-bit
  const dataSize = numSamples * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt  sub-chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // sub-chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data sub-chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = clamped < 0 ? clamped * 32768 : clamped * 32767;
    buffer.writeInt16LE(Math.round(int16), 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalize(samples: Float32Array): Float32Array {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
  }
  if (peak === 0) return samples;

  const gain = NORMALIZATION_CEILING / peak;
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    out[i] = samples[i] * gain;
  }
  return out;
}

// ---------------------------------------------------------------------------
// DSP helpers
// ---------------------------------------------------------------------------

function whiteNoise(length: number): Float32Array {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = Math.random() * 2 - 1;
  }
  return out;
}

/**
 * Simple one-pole highpass filter.
 * cutoff in Hz relative to sampleRate.
 */
function highpass(
  samples: Float32Array,
  cutoff: number,
  sampleRate: number,
): Float32Array {
  const rc = 1.0 / (2 * Math.PI * cutoff);
  const dt = 1.0 / sampleRate;
  const alpha = rc / (rc + dt);
  const out = new Float32Array(samples.length);
  out[0] = samples[0];
  for (let i = 1; i < samples.length; i++) {
    out[i] = alpha * (out[i - 1] + samples[i] - samples[i - 1]);
  }
  return out;
}

/**
 * Simple bandpass: highpass then lowpass.
 */
function bandpass(
  samples: Float32Array,
  lowCut: number,
  highCut: number,
  sampleRate: number,
): Float32Array {
  // Highpass first
  let out = highpass(samples, lowCut, sampleRate);
  // Then lowpass (one-pole)
  const rc = 1.0 / (2 * Math.PI * highCut);
  const dt = 1.0 / sampleRate;
  const alpha = dt / (rc + dt);
  const lp = new Float32Array(out.length);
  lp[0] = out[0];
  for (let i = 1; i < out.length; i++) {
    lp[i] = lp[i - 1] + alpha * (out[i] - lp[i - 1]);
  }
  return lp;
}

function msToSamples(ms: number): number {
  return Math.round((ms / 1000) * SAMPLE_RATE);
}

// ---------------------------------------------------------------------------
// Synthesis: Kicks
// ---------------------------------------------------------------------------

function synthKick(
  startFreq: number,
  endFreq: number,
  sweepMs: number,
  decayTau: number,
): Float32Array {
  const duration = Math.max(sweepMs / 1000, decayTau * 5);
  const numSamples = Math.round(duration * SAMPLE_RATE);
  const out = new Float32Array(numSamples);
  const sweepSamples = msToSamples(sweepMs);

  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Exponential frequency sweep
    const sweepProgress = Math.min(i / sweepSamples, 1);
    const freq =
      startFreq * Math.pow(endFreq / startFreq, sweepProgress);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const envelope = Math.exp(-t / decayTau);
    out[i] = Math.sin(phase) * envelope;
  }

  return normalize(out);
}

// ---------------------------------------------------------------------------
// Synthesis: Snares
// ---------------------------------------------------------------------------

function synthSnare(
  noiseLoHz: number,
  noiseHiHz: number,
  noiseDecayMs: number,
  toneFreq: number,
  toneDecayMs: number,
  noiseMix: number,
): Float32Array {
  const duration = Math.max(noiseDecayMs, toneDecayMs) / 1000 + 0.05;
  const numSamples = Math.round(duration * SAMPLE_RATE);

  // Noise component
  const noise = bandpass(whiteNoise(numSamples), noiseLoHz, noiseHiHz, SAMPLE_RATE);
  // Tone component
  const tone = new Float32Array(numSamples);
  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    phase += (2 * Math.PI * toneFreq) / SAMPLE_RATE;
    const noiseEnv = Math.exp(-t / (noiseDecayMs / 1000));
    const toneEnv = Math.exp(-t / (toneDecayMs / 1000));
    tone[i] = Math.sin(phase) * toneEnv * (1 - noiseMix);
    noise[i] *= noiseEnv * noiseMix;
  }

  const out = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    out[i] = noise[i] + tone[i];
  }

  return normalize(out);
}

// ---------------------------------------------------------------------------
// Synthesis: Hi-hats
// ---------------------------------------------------------------------------

function synthHihat(
  cutoffHz: number,
  decayTau: number,
  totalMs: number,
): Float32Array {
  const numSamples = msToSamples(totalMs);
  const noise = highpass(whiteNoise(numSamples), cutoffHz, SAMPLE_RATE);

  const out = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    out[i] = noise[i] * Math.exp(-t / decayTau);
  }

  return normalize(out);
}

// ---------------------------------------------------------------------------
// Synthesis: Toms
// ---------------------------------------------------------------------------

function synthTom(
  startFreq: number,
  endFreq: number,
  decayTau: number,
  durationMs: number,
): Float32Array {
  const numSamples = msToSamples(durationMs);
  const out = new Float32Array(numSamples);

  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;
    const freq = startFreq + (endFreq - startFreq) * progress;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const envelope = Math.exp(-t / decayTau);
    out[i] = Math.sin(phase) * envelope;
  }

  return normalize(out);
}

// ---------------------------------------------------------------------------
// Synthesis: Percussion
// ---------------------------------------------------------------------------

function synthClap(
  numBursts: number,
  burstMs: number,
  spacingMs: number,
  reverbDecayMs: number,
): Float32Array {
  const totalMs =
    numBursts * burstMs + (numBursts - 1) * spacingMs + reverbDecayMs + 50;
  const numSamples = msToSamples(totalMs);
  const out = new Float32Array(numSamples);

  // Generate bursts
  for (let b = 0; b < numBursts; b++) {
    const startSample = msToSamples(b * (burstMs + spacingMs));
    const burstLen = msToSamples(burstMs);
    for (let i = 0; i < burstLen && startSample + i < numSamples; i++) {
      out[startSample + i] += (Math.random() * 2 - 1) * 0.8;
    }
  }

  // Apply bandpass 1-4kHz
  const filtered = bandpass(out, 1000, 4000, SAMPLE_RATE);

  // Add reverb tail (exponential decay envelope starting after last burst)
  const reverbStart = msToSamples(
    numBursts * burstMs + (numBursts - 1) * spacingMs,
  );
  const result = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    if (i < reverbStart) {
      result[i] = filtered[i];
    } else {
      const t = (i - reverbStart) / SAMPLE_RATE;
      result[i] = filtered[i] * Math.exp(-t / (reverbDecayMs / 1000));
    }
  }

  return normalize(result);
}

function synthRimshot(): Float32Array {
  const numSamples = msToSamples(80);
  const out = new Float32Array(numSamples);

  // Sharp transient click at sample 0
  out[0] = 1.0;

  // Sine 800Hz with fast decay
  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    phase += (2 * Math.PI * 800) / SAMPLE_RATE;
    out[i] += Math.sin(phase) * Math.exp(-t / 0.015) * 0.7;
  }

  return normalize(out);
}

function synthCowbell(): Float32Array {
  const numSamples = msToSamples(300);
  const out = new Float32Array(numSamples);

  let phase1 = 0;
  let phase2 = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    phase1 += (2 * Math.PI * 560) / SAMPLE_RATE;
    phase2 += (2 * Math.PI * 845) / SAMPLE_RATE;
    const envelope = Math.exp(-t / 0.15);
    out[i] = (Math.sin(phase1) + Math.sin(phase2)) * 0.5 * envelope;
  }

  // Light bandpass to shape the tone
  const filtered = bandpass(out, 400, 1200, SAMPLE_RATE);
  return normalize(filtered);
}

function synthShaker(): Float32Array {
  const numSamples = msToSamples(100);
  const noise = bandpass(whiteNoise(numSamples), 3000, 10000, SAMPLE_RATE);

  const riseMs = 10;
  const fallMs = 90;
  const riseSamples = msToSamples(riseMs);
  const out = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    let envelope: number;
    if (i < riseSamples) {
      envelope = i / riseSamples; // linear rise
    } else {
      const t = (i - riseSamples) / SAMPLE_RATE;
      envelope = Math.exp(-t / (fallMs / 1000));
    }
    out[i] = noise[i] * envelope;
  }

  return normalize(out);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const BASE_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
  "public",
  "samples",
);

interface SampleDef {
  path: string;
  generate: () => Float32Array;
}

const samples: SampleDef[] = [
  // Kicks
  {
    path: "kicks/kick-1.wav",
    generate: () => synthKick(150, 40, 300, 0.15),
  },
  {
    path: "kicks/kick-2.wav",
    generate: () => synthKick(120, 30, 400, 0.2),
  },
  {
    path: "kicks/kick-3.wav",
    generate: () => synthKick(200, 60, 200, 0.1),
  },

  // Snares
  {
    path: "snares/snare-1.wav",
    generate: () => synthSnare(1000, 5000, 100, 200, 80, 0.5),
  },
  {
    path: "snares/snare-2.wav",
    generate: () => synthSnare(2000, 8000, 80, 200, 60, 0.8),
  },
  {
    path: "snares/snare-3.wav",
    generate: () => synthSnare(1000, 6000, 60, 400, 40, 0.4),
  },

  // Hi-hats
  {
    path: "hihats/hihat-closed-1.wav",
    generate: () => synthHihat(7000, 0.01, 50),
  },
  {
    path: "hihats/hihat-closed-2.wav",
    generate: () => synthHihat(9000, 0.008, 40),
  },
  {
    path: "hihats/hihat-open-1.wav",
    generate: () => synthHihat(6000, 0.08, 200),
  },
  {
    path: "hihats/hihat-open-2.wav",
    generate: () => synthHihat(5000, 0.12, 300),
  },

  // Toms
  {
    path: "toms/tom-high.wav",
    generate: () => synthTom(250, 200, 0.1, 200),
  },
  {
    path: "toms/tom-mid.wav",
    generate: () => synthTom(180, 140, 0.12, 200),
  },
  {
    path: "toms/tom-low.wav",
    generate: () => synthTom(120, 90, 0.15, 250),
  },

  // Percussion
  {
    path: "percussion/clap-1.wav",
    generate: () => synthClap(3, 5, 10, 80),
  },
  {
    path: "percussion/clap-2.wav",
    generate: () => synthClap(4, 5, 15, 100),
  },
  {
    path: "percussion/rimshot-1.wav",
    generate: () => synthRimshot(),
  },
  {
    path: "percussion/cowbell-1.wav",
    generate: () => synthCowbell(),
  },
  {
    path: "percussion/shaker-1.wav",
    generate: () => synthShaker(),
  },
];

console.log(`Generating ${samples.length} drum samples to ${BASE_DIR}\n`);

for (const sample of samples) {
  const fullPath = path.join(BASE_DIR, sample.path);
  const data = sample.generate();
  writeWav(fullPath, data, SAMPLE_RATE);
  const fileSize = fs.statSync(fullPath).size;
  console.log(
    `  Created ${sample.path} (${data.length} samples, ${fileSize} bytes)`,
  );
}

console.log(`\nDone! Generated ${samples.length} WAV files.`);
