import { useEffect, useState } from 'react';

import { PlaybackEngine } from '@/audio/playback/PlaybackEngine';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useQuantizedPlayback } from '@/hooks/useQuantizedPlayback';
import { useClusterStore } from '@/state/clusterStore';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useSessionStore } from '@/state/sessionStore';
import { useTimelineStore } from '@/state/timelineStore';

import { ExportModal } from './ExportModal';
import { QuantizationControls } from './QuantizationControls';
import { TimelineCanvas } from './TimelineCanvas';
import { TrackControls } from './TrackControls';
import { TrackHeaders } from './TrackHeaders';
import { TransportBar } from './TransportBar';

export function TimelineScreen() {
  const { isPlaying, isLooping, cursorTimeRef, play, pause, stop, toggleLoop } =
    useQuantizedPlayback();

  const masterVolume = useTimelineStore((s) => s.masterVolume);
  const setMasterVolume = useTimelineStore((s) => s.setMasterVolume);
  const undo = useTimelineStore((s) => s.undo);
  const redo = useTimelineStore((s) => s.redo);
  const undoStack = useTimelineStore((s) => s.undoStack);
  const redoStack = useTimelineStore((s) => s.redoStack);
  const initTracks = useTimelineStore((s) => s.initTracks);

  const [showVolumePanel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const sessionManager = useAutoSave();

  useKeyboardShortcuts({
    isPlaying,
    isLooping,
    play,
    pause,
    stop,
    toggleLoop,
    onSave: () => {
      void sessionManager.saveSession();
    },
    onExport: () => {
      setShowExportModal(true);
    },
  });

  useEffect(() => {
    const engine = PlaybackEngine.getInstance();
    void engine.init().then(() => {
      useQuantizationStore.getState().detectAndSetBpm();
    });

    // Auto-create a session ID if there isn't one yet, so auto-save works
    const { currentSessionId } = useSessionStore.getState();
    if (currentSessionId === null) {
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      useSessionStore.getState().setCurrentSession(id, 'Untitled Beat');
    }
  }, []);

  // Initialize track configs when clusters/instruments change
  useEffect(() => {
    const { clusters, instrumentAssignments } = useClusterStore.getState();
    const trackIds = clusters
      .filter((c) => {
        const inst = instrumentAssignments[c.id];
        return inst !== undefined && inst !== 'skip';
      })
      .map((c) => c.id);

    if (trackIds.length > 0) {
      initTracks(trackIds);
    }

    return useClusterStore.subscribe((s) => {
      const ids = s.clusters
        .filter((c) => {
          const inst = s.instrumentAssignments[c.id];
          return inst !== undefined && inst !== 'skip';
        })
        .map((c) => c.id);

      if (ids.length > 0) {
        initTracks(ids);
      }
    });
  }, [initTracks]);

  const handleSave = () => {
    void sessionManager.saveSession();
  };

  const handleSessionNameChange = (name: string) => {
    useSessionStore.getState().setCurrentSessionName(name);
  };

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
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <TrackHeaders />
        <TimelineCanvas cursorTimeRef={cursorTimeRef} />
      </div>
      {showVolumePanel && <TrackControls />}
      <TransportBar
        isPlaying={isPlaying}
        isLooping={isLooping}
        currentTime={cursorTimeRef.current}
        onPlay={play}
        onPause={pause}
        onStop={stop}
        onToggleLoop={toggleLoop}
        masterVolume={masterVolume}
        onMasterVolumeChange={setMasterVolume}
        onUndo={undo}
        onRedo={redo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onSave={handleSave}
        onExport={() => {
          setShowExportModal(true);
        }}
        onSessionNameChange={handleSessionNameChange}
      />
      <ExportModal
        isOpen={showExportModal}
        onClose={() => {
          setShowExportModal(false);
        }}
      />
    </div>
  );
}
