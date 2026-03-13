import { useRef } from 'react';

import { getInstrumentById, getInstrumentColor } from '@/audio/playback/sampleManifest';
import { Card } from '@/components/shared/Card';
import { Icon } from '@/components/shared/Icon';
import { useClusterWaveformRenderer } from '@/hooks/useClusterWaveformRenderer';
import type { ClusterData } from '@/types/clustering';

import styles from './ClusterCard.module.css';
import { InstrumentChips } from './InstrumentChips';

interface ClusterCardProps {
  cluster: ClusterData;
  snippet: Float32Array | null;
  isPlaying: boolean;
  selected: boolean;
  onPlay: () => void;
  onClick: () => void;
  index: number;
  assignedInstrumentId: string | null;
  isSkipped: boolean;
  duplicateClusterId: number | null;
  onAssignInstrument: (instrumentId: string) => void;
  onSkip: () => void;
  onOpenBrowser: () => void;
}

export function ClusterCard({
  cluster,
  snippet,
  isPlaying,
  selected,
  onPlay,
  onClick,
  index,
  assignedInstrumentId,
  isSkipped,
  duplicateClusterId,
  onAssignInstrument,
  onSkip,
  onOpenBrowser,
}: ClusterCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);

  const effectiveColor =
    assignedInstrumentId !== null ? getInstrumentColor(assignedInstrumentId) : cluster.color;
  const assignedInstrument =
    assignedInstrumentId !== null ? getInstrumentById(assignedInstrumentId) : undefined;

  useClusterWaveformRenderer(canvasRef, waveformContainerRef, snippet, effectiveColor);

  const handlePlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onPlay();
  };

  return (
    <div
      className={styles.entrance}
      style={{ '--entrance-delay': `${String(index * 60)}ms` } as React.CSSProperties}
    >
      <Card
        selected={selected}
        onClick={onClick}
        className={[styles.card, isSkipped ? styles.muted : ''].join(' ')}
        style={{ '--cluster-color': effectiveColor } as React.CSSProperties}
      >
        <div className={styles.header}>
          <button
            className={styles.playButton}
            onClick={handlePlay}
            disabled={snippet === null}
            aria-label={
              isPlaying
                ? `Stop cluster ${String(cluster.id + 1)}`
                : `Play cluster ${String(cluster.id + 1)}`
            }
            type="button"
          >
            <Icon name={isPlaying ? 'square' : 'play'} size={14} />
          </button>
          <span className={styles.clusterName}>
            {'Cluster '}
            {cluster.id + 1}
          </span>
          {assignedInstrument !== undefined && (
            <span className={styles.instrumentBadge} style={{ background: effectiveColor }}>
              {assignedInstrument.shortLabel}
            </span>
          )}
          <span className={styles.hitCount}>
            {cluster.hitCount} {cluster.hitCount === 1 ? 'hit' : 'hits'}
          </span>
        </div>
        <div ref={waveformContainerRef} className={styles.waveformContainer}>
          <canvas ref={canvasRef} className={styles.waveformCanvas} />
        </div>
        <div className={styles.instrumentSection}>
          <InstrumentChips
            clusterId={cluster.id}
            selectedInstrumentId={assignedInstrumentId}
            isSkipped={isSkipped}
            duplicateClusterId={duplicateClusterId}
            onSelect={onAssignInstrument}
            onSkip={onSkip}
            onMore={onOpenBrowser}
          />
        </div>
      </Card>
    </div>
  );
}
