import type { InstrumentCategory, InstrumentDef } from '@/types/instrument';

/**
 * Compile-time constant manifest of all available drum instruments.
 * Order is intentional: kicks → snares → hihats → toms → percussion.
 */
export const SAMPLE_MANIFEST: readonly InstrumentDef[] = [
  // Kicks
  {
    id: 'kick-1',
    label: 'Kick 1',
    shortLabel: 'Kick',
    category: 'kicks',
    colorIndex: 0,
    isQuickPick: true,
  },
  {
    id: 'kick-2',
    label: 'Kick Deep',
    shortLabel: 'Kick 2',
    category: 'kicks',
    colorIndex: 0,
    isQuickPick: false,
  },
  {
    id: 'kick-3',
    label: 'Kick Tight',
    shortLabel: 'Kick 3',
    category: 'kicks',
    colorIndex: 0,
    isQuickPick: false,
  },

  // Snares
  {
    id: 'snare-1',
    label: 'Snare 1',
    shortLabel: 'Snare',
    category: 'snares',
    colorIndex: 1,
    isQuickPick: true,
  },
  {
    id: 'snare-2',
    label: 'Snare Crack',
    shortLabel: 'Snare 2',
    category: 'snares',
    colorIndex: 1,
    isQuickPick: false,
  },
  {
    id: 'snare-3',
    label: 'Snare Rim',
    shortLabel: 'Rim',
    category: 'snares',
    colorIndex: 1,
    isQuickPick: false,
  },

  // Hi-hats
  {
    id: 'hihat-closed-1',
    label: 'HH Closed 1',
    shortLabel: 'HH',
    category: 'hihats',
    colorIndex: 2,
    isQuickPick: true,
  },
  {
    id: 'hihat-closed-2',
    label: 'HH Closed Tight',
    shortLabel: 'HH 2',
    category: 'hihats',
    colorIndex: 2,
    isQuickPick: false,
  },
  {
    id: 'hihat-open-1',
    label: 'HH Open 1',
    shortLabel: 'HH-O',
    category: 'hihats',
    colorIndex: 3,
    isQuickPick: false,
  },
  {
    id: 'hihat-open-2',
    label: 'HH Open Long',
    shortLabel: 'HH-O 2',
    category: 'hihats',
    colorIndex: 3,
    isQuickPick: false,
  },

  // Toms
  {
    id: 'tom-high',
    label: 'Tom High',
    shortLabel: 'Tom',
    category: 'toms',
    colorIndex: 4,
    isQuickPick: true,
  },
  {
    id: 'tom-mid',
    label: 'Tom Mid',
    shortLabel: 'Tom-M',
    category: 'toms',
    colorIndex: 5,
    isQuickPick: false,
  },
  {
    id: 'tom-low',
    label: 'Tom Low',
    shortLabel: 'Tom-L',
    category: 'toms',
    colorIndex: 5,
    isQuickPick: false,
  },

  // Percussion
  {
    id: 'clap-1',
    label: 'Clap 1',
    shortLabel: 'Clap',
    category: 'percussion',
    colorIndex: 6,
    isQuickPick: false,
  },
  {
    id: 'clap-2',
    label: 'Clap 2',
    shortLabel: 'Clap 2',
    category: 'percussion',
    colorIndex: 6,
    isQuickPick: false,
  },
  {
    id: 'rimshot-1',
    label: 'Rimshot',
    shortLabel: 'Rim',
    category: 'percussion',
    colorIndex: 7,
    isQuickPick: false,
  },
  {
    id: 'cowbell-1',
    label: 'Cowbell',
    shortLabel: 'Bell',
    category: 'percussion',
    colorIndex: 7,
    isQuickPick: false,
  },
  {
    id: 'shaker-1',
    label: 'Shaker',
    shortLabel: 'Shake',
    category: 'percussion',
    colorIndex: 6,
    isQuickPick: false,
  },
] as const;

/** Instruments flagged for the quick-pick selector (kick, snare, hihat-closed, tom-high). */
export const QUICK_PICKS: readonly InstrumentDef[] = SAMPLE_MANIFEST.filter(
  (inst) => inst.isQuickPick,
);

/** Look up an instrument definition by its unique id. */
export function getInstrumentById(id: string): InstrumentDef | undefined {
  return SAMPLE_MANIFEST.find((inst) => inst.id === id);
}

/** Return all instruments belonging to the given category. */
export function getInstrumentsByCategory(category: InstrumentCategory): readonly InstrumentDef[] {
  return SAMPLE_MANIFEST.filter((inst) => inst.category === category);
}

/** Map an instrument id to its CSS custom-property color, e.g. `var(--cluster-2)`. */
export function getInstrumentColor(instrumentId: string): string {
  const inst = getInstrumentById(instrumentId);
  const index = inst?.colorIndex ?? 0;
  return `var(--cluster-${String(index)})`;
}
