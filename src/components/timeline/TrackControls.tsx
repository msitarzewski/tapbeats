import { Slider } from '@/components/shared/Slider';
import { useClusterStore } from '@/state/clusterStore';
import { useTimelineStore } from '@/state/timelineStore';

import styles from './TrackControls.module.css';

export function TrackControls() {
  const clusters = useClusterStore((s) => s.clusters);
  const instrumentAssignments = useClusterStore((s) => s.instrumentAssignments);
  const trackConfigs = useTimelineStore((s) => s.trackConfigs);
  const setTrackVolume = useTimelineStore((s) => s.setTrackVolume);
  const masterVolume = useTimelineStore((s) => s.masterVolume);
  const setMasterVolume = useTimelineStore((s) => s.setMasterVolume);

  const tracks = clusters.filter((c) => {
    const inst = instrumentAssignments[c.id];
    return inst !== undefined && inst !== 'skip';
  });

  return (
    <div className={styles.panel}>
      {tracks.map((track) => {
        const config = trackConfigs.find((tc) => tc.trackId === track.id);
        const volume = config?.volume ?? 0.8;
        const instrumentId = instrumentAssignments[track.id] ?? '';
        const displayName = instrumentId.replace(/-/g, ' ');

        return (
          <div key={track.id} className={styles.trackVolume}>
            <span className={styles.trackLabel} title={displayName}>
              {displayName}
            </span>
            <Slider
              value={Math.round(volume * 100)}
              onChange={(v) => {
                setTrackVolume(track.id, v / 100);
              }}
              min={0}
              max={100}
              step={1}
            />
          </div>
        );
      })}
      <div className={styles.masterDivider} />
      <div className={styles.trackVolume}>
        <span className={styles.masterLabel}>Master</span>
        <Slider
          value={Math.round(masterVolume * 100)}
          onChange={(v) => {
            setMasterVolume(v / 100);
          }}
          min={0}
          max={100}
          step={1}
        />
      </div>
    </div>
  );
}
