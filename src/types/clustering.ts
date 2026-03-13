/** Result from k-means algorithm */
export interface ClusterResult {
  readonly assignments: number[];
  readonly centroids: number[][];
  readonly iterations: number;
  readonly converged: boolean;
}

/** Output from the full clustering pipeline */
export interface ClusteringOutput {
  readonly assignments: number[];
  readonly centroids: number[][];
  readonly featureVectors: number[][];
  readonly normalization: NormalizationResult;
  readonly clusterCount: number;
  readonly silhouette: number;
}

/** Per-cluster data for UI rendering */
export interface ClusterData {
  readonly id: number;
  readonly hitIndices: number[];
  readonly centroid: number[];
  readonly hitCount: number;
  readonly representativeHitIndex: number;
  readonly color: string;
}

/** Cluster store state */
export type ClusterStatus = 'idle' | 'ready' | 'error';

/** Normalization result from min-max */
export interface NormalizationResult {
  readonly normalized: number[][];
  readonly mins: number[];
  readonly maxes: number[];
}
