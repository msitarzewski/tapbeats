import { Icon } from '@/components/shared/Icon';
import { useClusterStore } from '@/state/clusterStore';
import { useTimelineStore } from '@/state/timelineStore';

import styles from './TrackHeaders.module.css';

export function TrackHeaders() {
  const clusters = useClusterStore((s) => s.clusters);
  const instrumentAssignments = useClusterStore((s) => s.instrumentAssignments);
  const trackConfigs = useTimelineStore((s) => s.trackConfigs);
  const selectedTrackIndex = useTimelineStore((s) => s.selectedTrackIndex);
  const setTrackMute = useTimelineStore((s) => s.setTrackMute);
  const setTrackSolo = useTimelineStore((s) => s.setTrackSolo);
  const setSelectedTrack = useTimelineStore((s) => s.setSelectedTrack);

  const tracks = clusters.filter((c) => {
    const inst = instrumentAssignments[c.id];
    return inst !== undefined && inst !== 'skip';
  });

  return (
    <div className={styles.headers} role="list" aria-label="Track headers">
      {tracks.map((track, index) => {
        const config = trackConfigs.find((tc) => tc.trackId === track.id);
        const isMuted = config?.muted ?? false;
        const isSoloed = config?.soloed ?? false;
        const isSelected = index === selectedTrackIndex;
        const instrumentId = instrumentAssignments[track.id] ?? '';
        const displayName = instrumentId.replace(/-/g, ' ');

        const headerClass = [styles.header, isSelected ? styles.headerSelected : '']
          .filter(Boolean)
          .join(' ');
        const muteClass = [styles.muteBtn, isMuted ? styles.muteBtnActive : '']
          .filter(Boolean)
          .join(' ');
        const soloClass = [styles.soloBtn, isSoloed ? styles.soloBtnActive : '']
          .filter(Boolean)
          .join(' ');

        return (
          <div
            key={track.id}
            className={headerClass}
            role="listitem"
            onClick={() => {
              setSelectedTrack(index);
            }}
          >
            <span className={styles.colorDot} style={{ backgroundColor: track.color }} />
            <span className={styles.trackName} title={displayName}>
              {displayName}
            </span>
            <button
              className={muteClass}
              onClick={(e) => {
                e.stopPropagation();
                setTrackMute(track.id, !isMuted);
              }}
              aria-label={isMuted ? `Unmute ${displayName}` : `Mute ${displayName}`}
              aria-pressed={isMuted}
            >
              <Icon name={isMuted ? 'volume-x' : 'volume-2'} size={14} />
            </button>
            <button
              className={soloClass}
              onClick={(e) => {
                e.stopPropagation();
                setTrackSolo(track.id, !isSoloed);
              }}
              aria-label={isSoloed ? `Unsolo ${displayName}` : `Solo ${displayName}`}
              aria-pressed={isSoloed}
            >
              S
            </button>
          </div>
        );
      })}
    </div>
  );
}
