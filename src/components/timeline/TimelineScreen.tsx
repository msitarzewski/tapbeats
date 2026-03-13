import { useEffect } from 'react';

import { PlaybackEngine } from '@/audio/playback/PlaybackEngine';
import { useQuantizedPlayback } from '@/hooks/useQuantizedPlayback';
import { useQuantizationStore } from '@/state/quantizationStore';

import { QuantizationControls } from './QuantizationControls';
import { TimelineCanvas } from './TimelineCanvas';
import { TransportBar } from './TransportBar';

export function TimelineScreen() {
  const { isPlaying, isLooping, cursorTimeRef, play, pause, stop, toggleLoop } =
    useQuantizedPlayback();

  useEffect(() => {
    const engine = PlaybackEngine.getInstance();
    void engine.init().then(() => {
      useQuantizationStore.getState().detectAndSetBpm();
    });
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      <QuantizationControls />
      <TimelineCanvas cursorTimeRef={cursorTimeRef} />
      <TransportBar
        isPlaying={isPlaying}
        isLooping={isLooping}
        currentTime={cursorTimeRef.current}
        onPlay={play}
        onPause={pause}
        onStop={stop}
        onToggleLoop={toggleLoop}
      />
    </div>
  );
}
