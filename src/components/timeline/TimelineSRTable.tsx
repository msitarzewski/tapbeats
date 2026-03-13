import { useClusterStore } from '@/state/clusterStore';
import { useQuantizationStore } from '@/state/quantizationStore';

import styles from './TimelineSRTable.module.css';

export function TimelineSRTable() {
  const clusters = useClusterStore((s) => s.clusters);
  const instrumentAssignments = useClusterStore((s) => s.instrumentAssignments);
  const quantizedHits = useQuantizationStore((s) => s.quantizedHits);
  const bpm = useQuantizationStore((s) => s.bpm);

  const tracks = clusters.filter((c) => {
    const inst = instrumentAssignments[c.id];
    return inst !== undefined && inst !== 'skip';
  });

  return (
    <div className={styles.srOnly}>
      <table aria-label={`Timeline at ${String(bpm)} BPM, ${String(tracks.length)} tracks`}>
        <thead>
          <tr>
            <th scope="col">Track</th>
            <th scope="col">Instrument</th>
            <th scope="col">Hit Count</th>
            <th scope="col">Hit Times</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => {
            const instrumentId = instrumentAssignments[track.id];
            const trackHits = quantizedHits.filter((h) => h.clusterId === track.id);
            return (
              <tr key={track.id}>
                <td>Track {String(track.id + 1)}</td>
                <td>
                  {instrumentId !== undefined && instrumentId !== 'skip'
                    ? instrumentId
                    : 'Unassigned'}
                </td>
                <td>{String(trackHits.length)}</td>
                <td>
                  {trackHits.map((h) => `${h.quantizedTime.toFixed(2)}s`).join(', ') || 'No hits'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
