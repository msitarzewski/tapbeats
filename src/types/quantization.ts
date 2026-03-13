export type GridResolution = '1/4' | '1/8' | '1/16' | '1/4T' | '1/8T' | '1/16T';
export type PlaybackMode = 'original' | 'quantized';

export interface QuantizationConfig {
  readonly bpm: number;
  readonly gridResolution: GridResolution;
  readonly strength: number; // 0-100
  readonly swingAmount: number; // 0.5 (straight) to 0.667 (triplet)
}

export interface QuantizedHit {
  readonly originalTime: number;
  readonly quantizedTime: number;
  readonly gridPosition: number; // in beats from start
  readonly velocity: number;
  readonly clusterId: number;
  readonly instrumentId: string;
  readonly hitIndex: number; // index into recordingStore._onsets
}

export interface BPMResult {
  readonly bpm: number;
  readonly confidence: number; // 0-1
  readonly alternatives: readonly number[];
}
