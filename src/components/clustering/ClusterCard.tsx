import { useRef } from 'react';

import { Card } from '@/components/shared/Card';
import { Icon } from '@/components/shared/Icon';
import { useClusterWaveformRenderer } from '@/hooks/useClusterWaveformRenderer';
import type { ClusterData } from '@/types/clustering';

import styles from './ClusterCard.module.css';

interface ClusterCardProps {
  cluster: ClusterData;
  snippet: Float32Array | null;
  isPlaying: boolean;
  selected: boolean;
  onPlay: () => void;
  onClick: () => void;
  index: number;
}

export function ClusterCard({
  cluster,
  snippet,
  isPlaying,
  selected,
  onPlay,
  onClick,
  index,
}: ClusterCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);

  useClusterWaveformRenderer(canvasRef, waveformContainerRef, snippet, cluster.color);

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
        className={styles.card}
        style={{ '--cluster-color': cluster.color } as React.CSSProperties}
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
          <span className={styles.hitCount}>
            {cluster.hitCount} {cluster.hitCount === 1 ? 'hit' : 'hits'}
          </span>
        </div>
        <div ref={waveformContainerRef} className={styles.waveformContainer}>
          <canvas ref={canvasRef} className={styles.waveformCanvas} />
        </div>
      </Card>
    </div>
  );
}
