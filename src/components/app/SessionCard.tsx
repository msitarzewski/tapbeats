import { Icon } from '@/components/shared/Icon';
import type { SessionListItem } from '@/types/session';

import styles from './SessionCard.module.css';

interface SessionCardProps {
  readonly session: SessionListItem;
  readonly onClick: () => void;
  readonly onDelete: () => void;
}

export function SessionCard({ session, onClick, onDelete }: SessionCardProps) {
  const formatDate = (ts: number): string => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatDuration = (ms: number): string => {
    const s = Math.round(ms / 1000);
    if (s < 60) return `${String(s)}s`;
    const m = Math.floor(s / 60);
    const remainder = s % 60;
    return `${String(m)}m ${String(remainder)}s`;
  };

  return (
    <div
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${session.name}, ${String(session.bpm)} BPM, ${formatDuration(session.durationMs)}, ${String(session.hitCount)} hits`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.info}>
        <div className={styles.name}>{session.name}</div>
        <div className={styles.meta}>
          <span>{formatDate(session.updatedAt)}</span>
          <span>{String(session.bpm)} BPM</span>
          <span>{formatDuration(session.durationMs)}</span>
          <span>{String(session.hitCount)} hits</span>
        </div>
      </div>
      <button
        className={styles.deleteBtn}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label={`Delete ${session.name}`}
      >
        <Icon name="trash-2" size={16} />
      </button>
    </div>
  );
}
