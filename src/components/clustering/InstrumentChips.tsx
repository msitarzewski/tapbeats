import { QUICK_PICKS, getInstrumentColor } from '@/audio/playback/sampleManifest';
import { Icon } from '@/components/shared/Icon';

import styles from './InstrumentChips.module.css';

interface InstrumentChipsProps {
  clusterId: number;
  selectedInstrumentId: string | null;
  isSkipped: boolean;
  duplicateClusterId: number | null;
  onSelect: (instrumentId: string) => void;
  onSkip: () => void;
  onMore: () => void;
}

export function InstrumentChips({
  clusterId,
  selectedInstrumentId,
  isSkipped,
  duplicateClusterId,
  onSelect,
  onSkip,
  onMore,
}: InstrumentChipsProps) {
  return (
    <div className={styles.container}>
      <span className={styles.label}>Assign instrument:</span>
      <div
        className={styles.chipRow}
        role="radiogroup"
        aria-label={`Instrument selection for cluster ${String(clusterId + 1)}`}
      >
        {QUICK_PICKS.map((instrument) => {
          const isSelected = !isSkipped && selectedInstrumentId === instrument.id;
          return (
            <button
              key={instrument.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={[styles.chip, isSelected ? styles.chipSelected : ''].join(' ')}
              style={isSelected ? { background: getInstrumentColor(instrument.id) } : undefined}
              onClick={() => {
                onSelect(instrument.id);
              }}
            >
              {instrument.shortLabel}
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={isSkipped}
          className={[styles.chip, isSkipped ? styles.chipSkipped : ''].join(' ')}
          onClick={onSkip}
        >
          {isSkipped ? <Icon name="volume-x" size={14} /> : null}
          Skip
        </button>
        <button type="button" className={[styles.chip, styles.chipMore].join(' ')} onClick={onMore}>
          More
          <Icon name="chevron-down" size={14} />
        </button>
      </div>
      {duplicateClusterId !== null && (
        <span className={styles.duplicateWarning}>
          {'Same as Cluster '}
          {duplicateClusterId + 1}
        </span>
      )}
    </div>
  );
}
