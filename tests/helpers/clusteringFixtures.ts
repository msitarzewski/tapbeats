import type { AudioFeatures, DetectedHit, OnsetEvent } from '@/types/audio';

/**
 * Mulberry32 seeded PRNG for deterministic tests.
 * Returns a function that produces pseudo-random numbers in [0, 1).
 */
export function seededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate N points around a center with given noise level.
 * Each point is center + uniform noise in [-noise, +noise] per dimension.
 */
export function generateClusterPoints(
  center: number[],
  count: number,
  noise: number,
  rng: () => number,
): number[][] {
  const points: number[][] = [];
  for (let i = 0; i < count; i++) {
    const point: number[] = [];
    for (const val of center) {
      point.push(val + (rng() * 2 - 1) * noise);
    }
    points.push(point);
  }
  return points;
}

/**
 * Convert a 12-dimensional feature vector back into AudioFeatures.
 * Order: rms, spectralCentroid, spectralRolloff, spectralFlatness,
 *        zeroCrossingRate, attackTime, decayTime, mfcc[0..4]
 */
function vectorToFeatures(vec: number[]): AudioFeatures {
  return {
    rms: vec[0] ?? 0,
    spectralCentroid: vec[1] ?? 0,
    spectralRolloff: vec[2] ?? 0,
    spectralFlatness: vec[3] ?? 0,
    zeroCrossingRate: vec[4] ?? 0,
    attackTime: vec[5] ?? 0,
    decayTime: vec[6] ?? 0,
    mfcc: [vec[7] ?? 0, vec[8] ?? 0, vec[9] ?? 0, vec[10] ?? 0, vec[11] ?? 0],
  };
}

/**
 * Create mock DetectedHit[] with specific feature vectors.
 * Each feature group becomes a set of hits. Each 12-dim vector is converted
 * back into AudioFeatures. OnsetEvent has timestamp based on index,
 * strength=0.5, and a simple snippetBuffer.
 */
export function createMockDetectedHits(featureGroups: number[][][]): DetectedHit[] {
  const rng = seededRng(12345);
  const hits: DetectedHit[] = [];
  let index = 0;

  for (const group of featureGroups) {
    for (const vec of group) {
      const snippetBuffer = new Float32Array(4410);
      for (let i = 0; i < snippetBuffer.length; i++) {
        snippetBuffer[i] = (rng() * 2 - 1) * 0.1;
      }

      const onset: OnsetEvent = {
        timestamp: index * 0.1,
        strength: 0.5,
        snippetBuffer,
      };

      const features: AudioFeatures = vectorToFeatures(vec);

      hits.push({ onset, features });
      index++;
    }
  }

  return hits;
}
