import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '@/components/shared/Icon';
import { useClusterPlayback } from '@/hooks/useClusterPlayback';
import { useClusterStore } from '@/state/clusterStore';
import { useRecordingStore } from '@/state/recordingStore';

import { ActionBar } from './ActionBar';
import { ClusterCard } from './ClusterCard';
import styles from './ClusterScreen.module.css';

type InteractionMode = 'default' | 'split' | 'merge';

export function ClusterScreen() {
  const navigate = useNavigate();
  const clusters = useClusterStore((s) => s.clusters);
  const splitCluster = useClusterStore((s) => s.splitCluster);
  const mergeClusters = useClusterStore((s) => s.mergeClusters);
  const onsets = useRecordingStore((s) => s._onsets);

  const { playingClusterId, play, stop } = useClusterPlayback();

  const [mode, setMode] = useState<InteractionMode>('default');
  const [mergeSelection, setMergeSelection] = useState<number[]>([]);

  const clusterCount = clusters.length;

  const getSnippet = useCallback(
    (representativeHitIndex: number): Float32Array | null => {
      return onsets[representativeHitIndex]?.onset.snippetBuffer ?? null;
    },
    [onsets],
  );

  const handlePlay = useCallback(
    (clusterId: number, representativeHitIndex: number) => {
      if (playingClusterId === clusterId) {
        stop();
        return;
      }
      const snippet = getSnippet(representativeHitIndex);
      if (snippet !== null) {
        play(clusterId, snippet);
      }
    },
    [playingClusterId, play, stop, getSnippet],
  );

  const handleCardClick = useCallback(
    (clusterId: number) => {
      if (mode === 'split') {
        splitCluster(clusterId);
        setMode('default');
        return;
      }

      if (mode === 'merge') {
        setMergeSelection((prev) => {
          // Toggle selection
          if (prev.includes(clusterId)) {
            return prev.filter((id) => id !== clusterId);
          }

          const next = [...prev, clusterId];

          // If we now have 2, perform merge
          if (next.length === 2) {
            const a = next[0];
            const b = next[1];
            if (a !== undefined && b !== undefined) {
              mergeClusters(a, b);
            }
            setMode('default');
            return [];
          }

          return next;
        });
        return;
      }
    },
    [mode, splitCluster, mergeClusters],
  );

  const handleSplit = useCallback(() => {
    setMode('split');
    setMergeSelection([]);
  }, []);

  const handleMerge = useCallback(() => {
    setMode('merge');
    setMergeSelection([]);
  }, []);

  const handleCancel = useCallback(() => {
    setMode('default');
    setMergeSelection([]);
  }, []);

  const handleContinue = useCallback(() => {
    navigate('/timeline');
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const isCardSelected = (clusterId: number): boolean => {
    if (mode === 'merge') {
      return mergeSelection.includes(clusterId);
    }
    return false;
  };

  // Split requires at least 1 cluster with 2+ hits
  const canSplit = clusters.some((c) => c.hitCount >= 2);
  // Merge requires at least 2 clusters
  const canMerge = clusterCount >= 2;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button
          className={styles.backButton}
          onClick={handleBack}
          aria-label="Go back"
          type="button"
        >
          <Icon name="arrow-left" size={20} />
        </button>
        <h1 className={styles.title}>Assign Sounds</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.summary}>
          <p className={styles.summaryText}>
            We found {clusterCount} distinct {clusterCount === 1 ? 'sound' : 'sounds'} in your
            recording
          </p>
          {clusterCount === 1 && (
            <p className={styles.guidance}>Try tapping different surfaces for more variety</p>
          )}
          {clusterCount >= 6 && (
            <p className={styles.guidance}>Consider merging similar-sounding clusters</p>
          )}
        </div>

        <div className={styles.grid} role="list">
          {clusters.map((cluster, index) => (
            <div key={cluster.id} role="listitem">
              <ClusterCard
                cluster={cluster}
                snippet={getSnippet(cluster.representativeHitIndex)}
                isPlaying={playingClusterId === cluster.id}
                selected={isCardSelected(cluster.id)}
                onPlay={() => {
                  handlePlay(cluster.id, cluster.representativeHitIndex);
                }}
                onClick={() => {
                  handleCardClick(cluster.id);
                }}
                index={index}
              />
            </div>
          ))}
        </div>
      </div>

      <ActionBar
        mode={mode}
        canSplit={canSplit}
        canMerge={canMerge}
        selectedCount={mergeSelection.length}
        onSplit={handleSplit}
        onMerge={handleMerge}
        onContinue={handleContinue}
        onCancel={handleCancel}
      />
    </div>
  );
}
