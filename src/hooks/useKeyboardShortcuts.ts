import { useEffect } from 'react';

import { useTimelineStore } from '@/state/timelineStore';

interface PlaybackControls {
  isPlaying: boolean;
  isLooping: boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggleLoop: () => void;
  onSave?: () => void;
  onExport?: () => void;
}

export function useKeyboardShortcuts(playback: PlaybackControls): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        // Allow Ctrl+S even in inputs
        const isMod = e.ctrlKey || e.metaKey;
        if (isMod && e.key === 's') {
          e.preventDefault();
          playback.onSave?.();
        }
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (playback.isPlaying) {
            playback.pause();
          } else {
            playback.play();
          }
          break;

        case 'l':
        case 'L':
          if (!isMod) {
            e.preventDefault();
            playback.toggleLoop();
          }
          break;

        case 'm':
        case 'M':
          if (!isMod) {
            e.preventDefault();
            const { trackConfigs, selectedTrackIndex, setTrackMute } = useTimelineStore.getState();
            const config = trackConfigs[selectedTrackIndex];
            if (config !== undefined) {
              setTrackMute(config.trackId, !config.muted);
            }
          }
          break;

        case 's':
        case 'S':
          if (isMod) {
            e.preventDefault();
            playback.onSave?.();
          } else {
            e.preventDefault();
            const { trackConfigs, selectedTrackIndex, setTrackSolo } = useTimelineStore.getState();
            const config = trackConfigs[selectedTrackIndex];
            if (config !== undefined) {
              setTrackSolo(config.trackId, !config.soloed);
            }
          }
          break;

        case 'e':
        case 'E':
          if (isMod) {
            e.preventDefault();
            playback.onExport?.();
          }
          break;

        case 'z':
        case 'Z':
          if (isMod) {
            e.preventDefault();
            if (e.shiftKey) {
              useTimelineStore.getState().redo();
            } else {
              useTimelineStore.getState().undo();
            }
          }
          break;

        case 'y':
        case 'Y':
          if (isMod) {
            e.preventDefault();
            useTimelineStore.getState().redo();
          }
          break;

        case '+':
        case '=':
          if (!isMod) {
            e.preventDefault();
            const { pixelsPerSecond, setZoom } = useTimelineStore.getState();
            setZoom(pixelsPerSecond * 1.25);
          }
          break;

        case '-':
          if (!isMod) {
            e.preventDefault();
            const { pixelsPerSecond, setZoom } = useTimelineStore.getState();
            setZoom(pixelsPerSecond / 1.25);
          }
          break;

        default: {
          // Number keys 1-9 for track selection
          const num = parseInt(e.key, 10);
          if (!isMod && num >= 1 && num <= 9) {
            e.preventDefault();
            useTimelineStore.getState().setSelectedTrack(num - 1);
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [playback]);
}
