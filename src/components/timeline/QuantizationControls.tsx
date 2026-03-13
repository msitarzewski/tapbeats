import { Slider } from '@/components/shared/Slider';
import { useQuantizationStore } from '@/state/quantizationStore';
import type { GridResolution } from '@/types/quantization';

import styles from './QuantizationControls.module.css';

import type { ChangeEvent } from 'react';

const GRID_OPTIONS: readonly GridResolution[] = ['1/4', '1/8', '1/16', '1/8T', '1/16T'];

export function QuantizationControls() {
  const bpm = useQuantizationStore((s) => s.bpm);
  const bpmResult = useQuantizationStore((s) => s.bpmResult);
  const gridResolution = useQuantizationStore((s) => s.gridResolution);
  const strength = useQuantizationStore((s) => s.strength);
  const setBpm = useQuantizationStore((s) => s.setBpm);
  const setGridResolution = useQuantizationStore((s) => s.setGridResolution);
  const setStrength = useQuantizationStore((s) => s.setStrength);

  const handleBpmChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val >= 40 && val <= 240) {
      setBpm(val);
    }
  };

  const stepBpm = (delta: number) => {
    const next = Math.max(40, Math.min(240, bpm + delta));
    setBpm(next);
  };

  return (
    <div className={styles.controls}>
      <div className={styles.bpmSection}>
        <span className={styles.bpmLabel}>BPM</span>
        <div className={styles.bpmInputWrap}>
          <button
            className={styles.bpmStep}
            onClick={() => {
              stepBpm(-1);
            }}
            aria-label="Decrease BPM"
          >
            -
          </button>
          <input
            type="number"
            className={styles.bpmInput}
            value={bpm}
            onChange={handleBpmChange}
            min={40}
            max={240}
            aria-label="BPM"
          />
          <button
            className={styles.bpmStep}
            onClick={() => {
              stepBpm(1);
            }}
            aria-label="Increase BPM"
          >
            +
          </button>
        </div>
        {bpmResult !== null && (
          <span className={styles.confidence}>{Math.round(bpmResult.confidence * 100)}%</span>
        )}
      </div>

      <div className={styles.gridSection}>
        <span className={styles.gridLabel}>Grid</span>
        <div className={styles.gridPills}>
          {GRID_OPTIONS.map((res) => (
            <button
              key={res}
              className={[styles.gridPill, res === gridResolution ? styles.gridPillActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                setGridResolution(res);
              }}
              aria-label={`Grid ${res}`}
              aria-pressed={res === gridResolution}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.strengthSection}>
        <Slider
          value={strength}
          onChange={setStrength}
          min={0}
          max={100}
          step={1}
          label="Strength"
        />
        <span className={styles.strengthValue}>{strength}%</span>
      </div>
    </div>
  );
}
