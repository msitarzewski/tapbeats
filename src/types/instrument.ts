export type InstrumentCategory = 'kicks' | 'snares' | 'hihats' | 'toms' | 'percussion';

export interface InstrumentDef {
  readonly id: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly category: InstrumentCategory;
  readonly colorIndex: number;
  readonly isQuickPick: boolean;
}

export interface InstrumentAssignment {
  readonly instrumentId: string;
  readonly color: string;
}
