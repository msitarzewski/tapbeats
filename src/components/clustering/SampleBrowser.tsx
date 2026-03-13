import { useMemo } from 'react';

import { PlaybackEngine } from '@/audio/playback/PlaybackEngine';
import { SAMPLE_MANIFEST, getInstrumentColor } from '@/audio/playback/sampleManifest';
import { Modal } from '@/components/shared/Modal';
import type { InstrumentCategory, InstrumentDef } from '@/types/instrument';

import styles from './SampleBrowser.module.css';

interface SampleBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (instrumentId: string) => void;
  currentSelection: string | null;
}

interface CategoryGroup {
  category: InstrumentCategory;
  instruments: InstrumentDef[];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function SampleBrowser({ isOpen, onClose, onSelect, currentSelection }: SampleBrowserProps) {
  const grouped = useMemo<CategoryGroup[]>(() => {
    const map = new Map<InstrumentCategory, InstrumentDef[]>();
    for (const inst of SAMPLE_MANIFEST) {
      const existing = map.get(inst.category);
      if (existing !== undefined) {
        existing.push(inst);
      } else {
        map.set(inst.category, [inst]);
      }
    }
    const result: CategoryGroup[] = [];
    for (const [category, instruments] of map) {
      result.push({ category, instruments });
    }
    return result;
  }, []);

  const handleTileClick = (instrumentId: string) => {
    PlaybackEngine.getInstance().playSample(instrumentId);
    onSelect(instrumentId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Instrument">
      {grouped.map((group) => (
        <div key={group.category} className={styles.categorySection}>
          <div className={styles.categoryHeader}>{capitalize(group.category)}</div>
          <div className={styles.grid}>
            {group.instruments.map((instrument) => {
              const isSelected = currentSelection === instrument.id;
              return (
                <button
                  key={instrument.id}
                  type="button"
                  className={[styles.tile, isSelected ? styles.tileSelected : ''].join(' ')}
                  style={
                    isSelected
                      ? {
                          borderColor: getInstrumentColor(instrument.id),
                        }
                      : undefined
                  }
                  onClick={() => {
                    handleTileClick(instrument.id);
                  }}
                >
                  {instrument.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </Modal>
  );
}
