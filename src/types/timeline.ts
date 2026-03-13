import type { QuantizedHit } from './quantization';

export interface TrackConfig {
  readonly trackId: number; // cluster ID
  readonly muted: boolean;
  readonly soloed: boolean;
  readonly volume: number; // 0-1
}

export interface UndoSnapshot {
  readonly quantizedHits: QuantizedHit[];
  readonly trackConfigs: TrackConfig[];
}
