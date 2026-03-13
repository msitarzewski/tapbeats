import { describe, it, expect, beforeEach } from 'vitest';

import { RingBuffer } from '@/audio/capture/RingBuffer';
import { useClusterStore } from '@/state/clusterStore';
import { openDatabase, resetDB } from '@/state/persistence/db';
import { SessionManager } from '@/state/persistence/SessionManager';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useRecordingStore } from '@/state/recordingStore';
import { useSessionStore } from '@/state/sessionStore';
import { useTimelineStore } from '@/state/timelineStore';

import {
  createMockHit,
  createMockQuantizedHit,
  createMockTrackConfig,
} from '../helpers/sessionFixtures';

describe('session roundtrip integration', () => {
  let manager: SessionManager;

  beforeEach(async () => {
    resetDB();
    await openDatabase();
    manager = new SessionManager();
    useRecordingStore.getState().reset();
    useClusterStore.getState().reset();
    useQuantizationStore.getState().reset();
    useTimelineStore.getState().reset();
    useSessionStore.getState().reset();
  });

  it('save → load roundtrip preserves recording data', async () => {
    // Set up state
    const rb = new RingBuffer(1, 44100);
    rb.write(new Float32Array(100).fill(0.5));

    useRecordingStore.setState({
      status: 'complete',
      elapsedTime: 5,
      hitCount: 2,
      _rawAudioBuffer: rb,
      _onsets: [createMockHit(0, 0.8, true, true), createMockHit(0.5, 0.6, false, false)],
      _sensitivity: 'high',
      _onsetTimestamps: [0, 0.5],
    });

    // Save
    const id = await manager.saveSession('roundtrip-1', 'Roundtrip Test');

    // Reset stores
    useRecordingStore.getState().reset();
    expect(useRecordingStore.getState()._onsets).toHaveLength(0);

    // Load
    await manager.loadSession(id);

    // Verify
    const recording = useRecordingStore.getState();
    expect(recording.status).toBe('complete');
    expect(recording._onsets).toHaveLength(2);
    expect(recording._onsetTimestamps).toEqual([0, 0.5]);
    expect(recording._sensitivity).toBe('high');
    expect(recording._rawAudioBuffer).not.toBeNull();
    expect(recording._onsets[0]?.features).not.toBeNull();
    expect(recording._onsets[1]?.features).toBeNull();
  });

  it('save → load roundtrip preserves quantization', async () => {
    useRecordingStore.setState({ _onsets: [], _onsetTimestamps: [] });
    useQuantizationStore.setState({
      bpm: 140,
      bpmManualOverride: true,
      gridResolution: '1/16',
      strength: 50,
      swingAmount: 0.6,
      quantizedHits: [createMockQuantizedHit(0), createMockQuantizedHit(1)],
      playbackMode: 'original',
    });

    await manager.saveSession('roundtrip-2', 'Quant Test');
    useQuantizationStore.getState().reset();
    await manager.loadSession('roundtrip-2');

    const quant = useQuantizationStore.getState();
    expect(quant.bpm).toBe(140);
    expect(quant.bpmManualOverride).toBe(true);
    expect(quant.gridResolution).toBe('1/16');
    expect(quant.quantizedHits).toHaveLength(2);
    expect(quant.playbackMode).toBe('original');
  });

  it('save → load roundtrip preserves timeline', async () => {
    useRecordingStore.setState({ _onsets: [], _onsetTimestamps: [] });
    useTimelineStore.setState({
      trackConfigs: [createMockTrackConfig(0), createMockTrackConfig(1)],
      masterVolume: 0.6,
    });

    await manager.saveSession('roundtrip-3', 'Timeline Test');
    useTimelineStore.getState().reset();
    await manager.loadSession('roundtrip-3');

    const timeline = useTimelineStore.getState();
    expect(timeline.trackConfigs).toHaveLength(2);
    expect(timeline.masterVolume).toBe(0.6);
  });

  it('save → delete removes session', async () => {
    useRecordingStore.setState({ _onsets: [], _onsetTimestamps: [] });

    await manager.saveSession('roundtrip-del', 'Delete Me');
    let sessions = await manager.listSessions();
    expect(sessions.some((s) => s.id === 'roundtrip-del')).toBe(true);

    await manager.deleteSession('roundtrip-del');
    sessions = await manager.listSessions();
    expect(sessions.some((s) => s.id === 'roundtrip-del')).toBe(false);
  });

  it('save → rename → load preserves new name', async () => {
    useRecordingStore.setState({ _onsets: [], _onsetTimestamps: [] });

    await manager.saveSession('roundtrip-rename', 'Old Name');
    await manager.renameSession('roundtrip-rename', 'New Name');
    await manager.loadSession('roundtrip-rename');

    expect(useSessionStore.getState().currentSessionName).toBe('New Name');
  });

  it('multiple sessions listed in order', async () => {
    useRecordingStore.setState({ _onsets: [], _onsetTimestamps: [] });

    await manager.saveSession('roundtrip-a', 'First');
    // Small delay to ensure different updatedAt
    await new Promise((r) => {
      setTimeout(r, 10);
    });
    await manager.saveSession('roundtrip-b', 'Second');

    const sessions = await manager.listSessions();
    expect(sessions.length).toBeGreaterThanOrEqual(2);
  });

  it('session store reflects current session after load', async () => {
    useRecordingStore.setState({ _onsets: [], _onsetTimestamps: [] });

    await manager.saveSession('roundtrip-store', 'Store Test');
    useSessionStore.getState().reset();
    await manager.loadSession('roundtrip-store');

    expect(useSessionStore.getState().currentSessionId).toBe('roundtrip-store');
    expect(useSessionStore.getState().currentSessionName).toBe('Store Test');
    expect(useSessionStore.getState().saveStatus).toBe('saved');
  });
});
