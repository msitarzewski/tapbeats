import { describe, expect, it } from 'vitest';

import {
  gridIntervalSeconds,
  gridResolutionToBeats,
  nearestGridPoint,
} from '@/audio/quantization/gridUtils';

describe('gridResolutionToBeats', () => {
  it('1/4 = 1 beat', () => {
    expect(gridResolutionToBeats('1/4')).toBe(1);
  });

  it('1/8 = 0.5 beats', () => {
    expect(gridResolutionToBeats('1/8')).toBe(0.5);
  });

  it('1/16 = 0.25 beats', () => {
    expect(gridResolutionToBeats('1/16')).toBe(0.25);
  });

  it('1/4T = 2/3 beats', () => {
    expect(gridResolutionToBeats('1/4T')).toBeCloseTo(2 / 3, 10);
  });

  it('1/8T = 1/3 beats', () => {
    expect(gridResolutionToBeats('1/8T')).toBeCloseTo(1 / 3, 10);
  });

  it('1/16T = 1/6 beats', () => {
    expect(gridResolutionToBeats('1/16T')).toBeCloseTo(1 / 6, 10);
  });
});

describe('gridIntervalSeconds', () => {
  it('at 120 BPM, 1/4 = 0.5s', () => {
    expect(gridIntervalSeconds(120, '1/4')).toBeCloseTo(0.5, 10);
  });
});

describe('nearestGridPoint', () => {
  it('snaps correctly', () => {
    // time=0.26, origin=0, interval=0.25 -> nearest grid point is 0.25
    expect(nearestGridPoint(0.26, 0, 0.25)).toBeCloseTo(0.25, 10);
  });
});
