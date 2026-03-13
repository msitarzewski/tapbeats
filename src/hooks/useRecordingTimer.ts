import { useRecordingStore } from '@/state/recordingStore';

export function useRecordingTimer(): { displayTime: string; elapsedMs: number } {
  const elapsedTime = useRecordingStore((s) => s.elapsedTime);

  const totalMs = Math.floor(elapsedTime * 1000);
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = Math.floor(elapsedTime % 60);
  const tenths = Math.floor((totalMs % 1000) / 100);

  const displayTime =
    String(minutes).padStart(2, '0') +
    ':' +
    String(seconds).padStart(2, '0') +
    '.' +
    String(tenths);

  return { displayTime, elapsedMs: totalMs };
}
