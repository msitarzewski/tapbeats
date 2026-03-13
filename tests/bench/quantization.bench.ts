import { bench, describe } from 'vitest';

import { detectBpm } from '@/audio/quantization/detectBpm';
import { quantizeHits } from '@/audio/quantization/quantizeHits';
import type { QuantizationConfig } from '@/types/quantization';

import {
  createMockClustersAndAssignments,
  generateHits,
  generateTimestamps,
} from '../helpers/quantizationFixtures';

describe('detectBpm benchmarks', () => {
  const timestamps100 = generateTimestamps(120, 100);
  const timestamps500 = generateTimestamps(120, 500);

  bench('detectBpm with 100 timestamps', () => {
    detectBpm(timestamps100);
  });

  bench('detectBpm with 500 timestamps', () => {
    detectBpm(timestamps500);
  });
});

describe('quantizeHits benchmarks', () => {
  const config: QuantizationConfig = {
    bpm: 120,
    gridResolution: '1/8',
    strength: 75,
    swingAmount: 0.5,
  };

  const hits100 = generateHits(120, 100);
  const { clusters: clusters100, assignments: assignments100 } = createMockClustersAndAssignments(
    100,
    4,
  );
  const instrumentAssignments100: Record<number, string> = {
    0: 'kick-deep',
    1: 'snare-crack',
    2: 'hihat-closed',
    3: 'tom-mid',
  };

  const hits500 = generateHits(120, 500);
  const { clusters: clusters500, assignments: assignments500 } = createMockClustersAndAssignments(
    500,
    4,
  );
  const instrumentAssignments500: Record<number, string> = {
    0: 'kick-deep',
    1: 'snare-crack',
    2: 'hihat-closed',
    3: 'tom-mid',
  };

  bench('quantizeHits with 100 hits', () => {
    quantizeHits(hits100, clusters100, assignments100, instrumentAssignments100, config);
  });

  bench('quantizeHits with 500 hits', () => {
    quantizeHits(hits500, clusters500, assignments500, instrumentAssignments500, config);
  });
});
