import { describe, it, expect } from 'vitest';

import {
  SAMPLE_MANIFEST,
  QUICK_PICKS,
  getInstrumentById,
  getInstrumentsByCategory,
  getInstrumentColor,
} from '@/audio/playback/sampleManifest';

describe('sampleManifest', () => {
  it('SAMPLE_MANIFEST has 18 entries', () => {
    expect(SAMPLE_MANIFEST).toHaveLength(18);
  });

  it('all IDs are unique', () => {
    const ids = SAMPLE_MANIFEST.map((inst) => inst.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all 5 categories are represented', () => {
    const categories = new Set(SAMPLE_MANIFEST.map((inst) => inst.category));
    expect(categories).toEqual(new Set(['kicks', 'snares', 'hihats', 'toms', 'percussion']));
  });

  it('QUICK_PICKS has exactly 4 entries with correct IDs', () => {
    expect(QUICK_PICKS).toHaveLength(4);
    const ids = QUICK_PICKS.map((inst) => inst.id);
    expect(ids).toEqual(['kick-1', 'snare-1', 'hihat-closed-1', 'tom-high']);
  });

  it('getInstrumentById returns correct instrument', () => {
    const kick = getInstrumentById('kick-1');
    expect(kick).toBeDefined();
    expect(kick?.id).toBe('kick-1');
    expect(kick?.label).toBe('Kick 1');
    expect(kick?.category).toBe('kicks');
  });

  it('getInstrumentById returns undefined for unknown id', () => {
    const result = getInstrumentById('nonexistent-999');
    expect(result).toBeUndefined();
  });

  it('getInstrumentsByCategory returns correct count per category', () => {
    expect(getInstrumentsByCategory('kicks')).toHaveLength(3);
    expect(getInstrumentsByCategory('snares')).toHaveLength(3);
    expect(getInstrumentsByCategory('hihats')).toHaveLength(4);
    expect(getInstrumentsByCategory('toms')).toHaveLength(3);
    expect(getInstrumentsByCategory('percussion')).toHaveLength(5);
  });

  it('getInstrumentColor returns correct CSS var string', () => {
    // kick-1 has colorIndex 0
    expect(getInstrumentColor('kick-1')).toBe('var(--cluster-0)');
    // snare-1 has colorIndex 1
    expect(getInstrumentColor('snare-1')).toBe('var(--cluster-1)');
    // unknown instrument defaults to colorIndex 0
    expect(getInstrumentColor('nonexistent')).toBe('var(--cluster-0)');
  });
});
