import { describe, it, expect, beforeEach } from 'vitest';

import { RingBuffer } from '@/audio/capture/RingBuffer';
import { useClusterStore } from '@/state/clusterStore';
import {
  serializeSession,
  deserializeOnsets,
  deserializeRingBuffer,
  restoreStores,
} from '@/state/persistence/serialization';
import { useQuantizationStore } from '@/state/quantizationStore';
import { useRecordingStore } from '@/state/recordingStore';
import { useTimelineStore } from '@/state/timelineStore';
import type { AudioBlobEntry } from '@/types/session';

import {
  createMockHit,
  createMockSerializedSession,
  createMockAudioBlob,
} from '../../../helpers/sessionFixtures';

describe('serialization', () => {
  beforeEach(() => {
    useRecordingStore.getState().reset();
    useClusterStore.getState().reset();
    useQuantizationStore.getState().reset();
    useTimelineStore.getState().reset();
  });

  describe('serializeSession', () => {
    it('serializes current state', () => {
      // Set up recording store with some data
      const hit0 = createMockHit(0, 0.8, true, true);
      const hit1 = createMockHit(0.5, 0.6, false, false);
      useRecordingStore.setState({
        status: 'complete',
        elapsedTime: 5,
        hitCount: 2,
        _onsets: [hit0, hit1],
        _sensitivity: 'medium',
        _onsetTimestamps: [0, 0.5],
      });

      useQuantizationStore.setState({ bpm: 120 });

      const { session, blobs } = serializeSession('test-id', 'Test Beat', 44100);

      expect(session.id).toBe('test-id');
      expect(session.metadata.name).toBe('Test Beat');
      expect(session.onsetTimestamps).toEqual([0, 0.5]);
      expect(session.onsetStrengths).toEqual([0.8, 0.6]);
      expect(session.onsetFeatures[0]).not.toBeNull();
      expect(session.onsetFeatures[1]).toBeNull();
      // One snippet blob for hit0 (hit1 has no snippet)
      expect(blobs.filter((b) => b.type === 'snippet')).toHaveLength(1);
    });

    it('includes raw audio blob when buffer exists', () => {
      const rb = new RingBuffer(1, 44100);
      rb.write(new Float32Array([0.1, 0.2, 0.3]));
      useRecordingStore.setState({
        _rawAudioBuffer: rb,
        _onsets: [],
      });

      const { blobs } = serializeSession('test-id', 'Test', 44100);
      const rawBlobs = blobs.filter((b) => b.type === 'raw');
      expect(rawBlobs).toHaveLength(1);
      expect(rawBlobs[0]?.key).toBe('test-id:raw');
    });

    it('excludes raw blob when no buffer', () => {
      useRecordingStore.setState({
        _rawAudioBuffer: null,
        _onsets: [],
      });

      const { blobs } = serializeSession('test-id', 'Test', 44100);
      expect(blobs.filter((b) => b.type === 'raw')).toHaveLength(0);
    });
  });

  describe('deserializeOnsets', () => {
    it('reconstructs DetectedHit array', () => {
      const session = createMockSerializedSession();
      const snippetBlobs = new Map<string, AudioBlobEntry>();
      snippetBlobs.set('0', createMockAudioBlob('test-session-1', 'snippet', '0'));

      const hits = deserializeOnsets(session, snippetBlobs);
      expect(hits).toHaveLength(4);
      expect(hits[0]?.onset.timestamp).toBe(0);
      expect(hits[0]?.onset.snippetBuffer).not.toBeNull();
      expect(hits[1]?.onset.snippetBuffer).toBeNull(); // No blob for index 1
      expect(hits[0]?.features).not.toBeNull();
      expect(hits[1]?.features).toBeNull();
    });
  });

  describe('deserializeRingBuffer', () => {
    it('reconstructs a RingBuffer from blob', () => {
      const data = new Float32Array([0.1, 0.2, 0.3, 0.4]);
      const blob: AudioBlobEntry = {
        key: 'test:raw',
        sessionId: 'test',
        type: 'raw',
        subId: 'raw',
        data: data.buffer,
        sampleRate: 44100,
      };

      const rb = deserializeRingBuffer(blob);
      expect(rb.length).toBe(4);
      const arr = rb.toArray();
      expect(arr[0]).toBeCloseTo(0.1);
      expect(arr[3]).toBeCloseTo(0.4);
    });
  });

  describe('restoreStores', () => {
    it('restores all stores from serialized session', () => {
      const session = createMockSerializedSession();
      const blobs = [
        createMockAudioBlob('test-session-1', 'raw', 'raw'),
        createMockAudioBlob('test-session-1', 'snippet', '0'),
      ];

      restoreStores(session, blobs);

      // Recording store
      expect(useRecordingStore.getState().status).toBe('complete');
      expect(useRecordingStore.getState()._onsets).toHaveLength(4);
      expect(useRecordingStore.getState()._rawAudioBuffer).not.toBeNull();

      // Cluster store
      expect(useClusterStore.getState().status).toBe('ready');
      expect(useClusterStore.getState().instrumentAssignments).toEqual({
        0: 'kick-basic',
        1: 'snare-basic',
      });

      // Quantization store
      expect(useQuantizationStore.getState().bpm).toBe(120);
      expect(useQuantizationStore.getState().quantizedHits).toHaveLength(4);

      // Timeline store
      expect(useTimelineStore.getState().trackConfigs).toHaveLength(2);
      expect(useTimelineStore.getState().masterVolume).toBe(0.8);
    });

    it('resets all stores before restore', () => {
      // Set some existing state
      useQuantizationStore.setState({ bpm: 200 });
      useTimelineStore.setState({ masterVolume: 0.5 });

      const session = createMockSerializedSession();
      restoreStores(session, []);

      expect(useQuantizationStore.getState().bpm).toBe(120);
      expect(useTimelineStore.getState().masterVolume).toBe(0.8);
    });
  });
});
