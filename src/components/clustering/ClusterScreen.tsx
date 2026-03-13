import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PlaybackEngine } from '@/audio/playback/PlaybackEngine';
import { suggestInstruments } from '@/audio/playback/smartDefaults';
import { Icon } from '@/components/shared/Icon';
import { useClusterPlayback } from '@/hooks/useClusterPlayback';
import { useClusterStore } from '@/state/clusterStore';
import { useRecordingStore } from '@/state/recordingStore';

import { ActionBar } from './ActionBar';
import { ClusterCard } from './ClusterCard';
import styles from './ClusterScreen.module.css';
import { SampleBrowser } from './SampleBrowser';

type InteractionMode = 'default' | 'split' | 'merge';

export function ClusterScreen() {
  const navigate = useNavigate();
  const clusters = useClusterStore((s) => s.clusters);
  const splitCluster = useClusterStore((s) => s.splitCluster);
  const mergeClusters = useClusterStore((s) => s.mergeClusters);
  const instrumentAssignments = useClusterStore((s) => s.instrumentAssignments);
  const assignInstrument = useClusterStore((s) => s.assignInstrument);
  const skipCluster = useClusterStore((s) => s.skipCluster);
  const setDefaultSuggestions = useClusterStore((s) => s.setDefaultSuggestions);
  const hasAnyAssignment = useClusterStore((s) => s.hasAnyAssignment);
  const onsets = useRecordingStore((s) => s._onsets);

  const { playingClusterId, play, stop } = useClusterPlayback();

  const [mode, setMode] = useState<InteractionMode>('default');
  const [mergeSelection, setMergeSelection] = useState<number[]>([]);
  const [sampleBrowserClusterId, setSampleBrowserClusterId] = useState<number | null>(null);
  const [engineInitialized, setEngineInitialized] = useState(false);

  const clusterCount = clusters.length;

  // Initialize PlaybackEngine and compute smart defaults when clusters change
  useEffect(() => {
    if (clusters.length === 0) return;

    const suggestions = suggestInstruments(clusters);
    setDefaultSuggestions(suggestions);

    // Init PlaybackEngine (will be a no-op if already initialized)
    if (!engineInitialized) {
      void PlaybackEngine.getInstance()
        .init()
        .then(() => {
          setEngineInitialized(true);
        })
        .catch(() => {
          // Samples failed to load — non-fatal, user can still assign
        });
    }
  }, [clusters, setDefaultSuggestions, engineInitialized]);

  // Compute which clusters share the same instrument (for duplicate warning)
  const duplicateMap = useMemo(() => {
    const map = new Map<number, number | null>();
    const instrumentToCluster = new Map<string, number>();
    for (const cluster of clusters) {
      const assignment = instrumentAssignments[cluster.id];
      if (assignment === undefined || assignment === 'skip') {
        map.set(cluster.id, null);
        continue;
      }
      const existingCluster = instrumentToCluster.get(assignment);
      if (existingCluster !== undefined) {
        map.set(cluster.id, existingCluster);
      } else {
        instrumentToCluster.set(assignment, cluster.id);
        map.set(cluster.id, null);
      }
    }
    return map;
  }, [clusters, instrumentAssignments]);

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
    // Auto-assign unassigned clusters before continuing
    const unassigned = clusters.filter((c) => instrumentAssignments[c.id] === undefined);
    if (unassigned.length > 0) {
      const suggestions = suggestInstruments(unassigned);
      setDefaultSuggestions(suggestions);
    }
    navigate('/timeline');
  }, [navigate, clusters, instrumentAssignments, setDefaultSuggestions]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleAssignInstrument = useCallback(
    (clusterId: number, instrumentId: string) => {
      assignInstrument(clusterId, instrumentId);
    },
    [assignInstrument],
  );

  const handleSkipCluster = useCallback(
    (clusterId: number) => {
      skipCluster(clusterId);
    },
    [skipCluster],
  );

  const handleOpenBrowser = useCallback((clusterId: number) => {
    setSampleBrowserClusterId(clusterId);
  }, []);

  const handleBrowserSelect = useCallback(
    (instrumentId: string) => {
      if (sampleBrowserClusterId !== null) {
        assignInstrument(sampleBrowserClusterId, instrumentId);
      }
    },
    [sampleBrowserClusterId, assignInstrument],
  );

  const handleBrowserClose = useCallback(() => {
    setSampleBrowserClusterId(null);
  }, []);

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
  // Continue requires at least 1 assigned (non-skip) cluster
  const canContinue = hasAnyAssignment();

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
          {clusters.map((cluster, index) => {
            const assignment = instrumentAssignments[cluster.id];
            const assignedId =
              assignment !== undefined && assignment !== 'skip' ? assignment : null;
            const isSkipped = assignment === 'skip';

            return (
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
                  assignedInstrumentId={assignedId}
                  isSkipped={isSkipped}
                  duplicateClusterId={duplicateMap.get(cluster.id) ?? null}
                  onAssignInstrument={(instrumentId) => {
                    handleAssignInstrument(cluster.id, instrumentId);
                  }}
                  onSkip={() => {
                    handleSkipCluster(cluster.id);
                  }}
                  onOpenBrowser={() => {
                    handleOpenBrowser(cluster.id);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <ActionBar
        mode={mode}
        canSplit={canSplit}
        canMerge={canMerge}
        canContinue={canContinue}
        selectedCount={mergeSelection.length}
        onSplit={handleSplit}
        onMerge={handleMerge}
        onContinue={handleContinue}
        onCancel={handleCancel}
      />

      <SampleBrowser
        isOpen={sampleBrowserClusterId !== null}
        onClose={handleBrowserClose}
        onSelect={handleBrowserSelect}
        currentSelection={
          sampleBrowserClusterId !== null
            ? (() => {
                const a = instrumentAssignments[sampleBrowserClusterId];
                return a !== undefined && a !== 'skip' ? a : null;
              })()
            : null
        }
      />
    </div>
  );
}
