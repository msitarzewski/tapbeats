import { Icon } from '@/components/shared/Icon';
import { Slider } from '@/components/shared/Slider';
import { useQuantizationStore } from '@/state/quantizationStore';
import type { PlaybackMode } from '@/types/quantization';

import styles from './TransportBar.module.css';

interface TransportBarProps {
  readonly isPlaying: boolean;
  readonly isLooping: boolean;
  readonly currentTime: number;
  readonly onPlay: () => void;
  readonly onPause: () => void;
  readonly onStop: () => void;
  readonly onToggleLoop: () => void;
  readonly masterVolume: number;
  readonly onMasterVolumeChange: (volume: number) => void;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export function TransportBar({
  isPlaying,
  isLooping,
  currentTime,
  onPlay,
  onPause,
  onStop,
  onToggleLoop,
  masterVolume,
  onMasterVolumeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: TransportBarProps) {
  const playbackMode = useQuantizationStore((s) => s.playbackMode);
  const setPlaybackMode = useQuantizationStore((s) => s.setPlaybackMode);

  const toggleMode = () => {
    const next: PlaybackMode = playbackMode === 'original' ? 'quantized' : 'original';
    setPlaybackMode(next);
  };

  const formatTime = (t: number): string => {
    const s = Math.floor(t);
    const ms = Math.floor((t - s) * 10);
    return `${String(s)}.${String(ms)}s`;
  };

  const playBtnClass = [styles.transportBtn, styles.playBtn].join(' ');
  const loopBtnClass = [styles.transportBtn, isLooping ? styles.loopActive : '']
    .filter(Boolean)
    .join(' ');
  const modeClass = [styles.modeToggle, playbackMode === 'original' ? styles.modeActive : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.transport}>
      <button
        className={styles.transportBtn}
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
      >
        <Icon name="undo" size={18} />
      </button>

      <button
        className={styles.transportBtn}
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
      >
        <Icon name="redo" size={18} />
      </button>

      <div className={styles.divider} />

      <button className={styles.transportBtn} onClick={onStop} aria-label="Stop">
        <Icon name="skip-back" size={20} />
      </button>

      <button
        className={playBtnClass}
        onClick={isPlaying ? onPause : onPlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <Icon name={isPlaying ? 'pause' : 'play'} size={24} />
      </button>

      <button
        className={loopBtnClass}
        onClick={onToggleLoop}
        aria-label={isLooping ? 'Disable loop' : 'Enable loop'}
      >
        <Icon name="repeat" size={20} />
      </button>

      <button
        className={modeClass}
        onClick={toggleMode}
        aria-label={`Playback mode: ${playbackMode}`}
      >
        {playbackMode === 'original' ? 'Before' : 'After'}
      </button>

      <span className={styles.position}>{formatTime(currentTime)}</span>

      <div className={styles.divider} />

      <div className={styles.volumeControl}>
        <Icon name="volume-2" size={16} />
        <Slider
          value={Math.round(masterVolume * 100)}
          onChange={(v) => {
            onMasterVolumeChange(v / 100);
          }}
          min={0}
          max={100}
          step={1}
        />
      </div>
    </div>
  );
}
