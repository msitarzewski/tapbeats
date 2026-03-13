# TapBeats Active Context

## Current State

**Phase**: Milestone 8 complete — session management & WAV export implemented.
**Sprint**: Implementation — IndexedDB persistence, session CRUD, WAV export, settings, auto-save
**Branch**: `milestone-8/session-export` (from `milestone-7/timeline-enhancement`)
**Last Updated**: 2026-03-13

---

## Active Work

- Milestone 1: Project Scaffolding & Infrastructure — **COMPLETE** (commit `34680be` on `milestone-1/scaffolding`)
- Milestone 2: Audio Capture & Microphone Pipeline — **COMPLETE** (on `milestone-2/audio-capture`)
- Milestone 3: Real-Time Onset Detection — **COMPLETE** (on `milestone-3/onset-detection`)
- Milestone 4: Sound Clustering & Cluster Review UI — **COMPLETE** (on `milestone-4/clustering`)
- Milestone 5: Instrument Assignment & Sample Library — **COMPLETE** (on `milestone-5/instrument-assignment`)
- Milestone 6: Quantization Engine — **COMPLETE** (on `milestone-6/quantization`)
- Milestone 7: Timeline Enhancement — **COMPLETE** (on `milestone-7/timeline-enhancement`)
- Milestone 8: Session Management & WAV Export — **COMPLETE** (on `milestone-8/session-export`)
  - New types: `session.ts` (SessionMetadata, SerializedSession, AudioBlobEntry, SessionListItem, ExportProgress), `settings.ts` (SettingsState, ThemeMode)
  - New stores: `sessionStore.ts` (Zustand: sessions list, current session, save status, storage info), `settingsStore.ts` (Zustand + localStorage persist: theme, BPM, grid, sensitivity)
  - Persistence layer: `db.ts` (IndexedDB with 2 object stores: sessions + audioBlobs), `serialization.ts` (serialize/deserialize full app state + audio blobs), `SessionManager.ts` (save/load/delete/rename sessions, auto-save with debounce)
  - WAV export: `wavEncoder.ts` (stereo 16-bit PCM RIFF), `renderMix.ts` (OfflineAudioContext with track gain chain mirroring PlaybackEngine), `exportWav.ts` (download trigger)
  - Hooks: `useAutoSave.ts` (SessionManager lifecycle + store subscriptions), `useExportWav.ts` (export state + progress)
  - UI: `SessionCard.tsx` (name, date, BPM, duration, delete), `ExportModal.tsx` (progress bar, success/error states), HomeScreen (session list + empty state + delete confirmation), SettingsScreen (BPM, grid, sensitivity, theme, storage usage, clear all), TransportBar (+save/export buttons), TimelineScreen (+auto-save + export modal)
  - Extended: `Icon.tsx` (+check, download, folder, save, settings), `useKeyboardShortcuts.ts` (+Ctrl+S save, Ctrl+E export)
  - `RingBuffer.fromArray()` static method for session restore
  - `fake-indexeddb` dev dependency for unit tests
  - 605 tests passing (59 files, +110 new), 0 lint errors, production build succeeds (127KB app + 143KB vendor)

---

## Key Implementation Details (M8)

### Session Persistence Architecture
```
SessionManager (orchestrator)
  → serializeSession() reads all 4 data stores → SerializedSession + AudioBlobEntry[]
  → db.ts: putSession() + putAudioBlobs() → IndexedDB (sessions + audioBlobs object stores)
  → restoreStores(): reset all → recording → cluster → quantization → timeline

Auto-save:
  → useAutoSave hook creates SessionManager, subscribes to cluster/quantization/timeline stores
  → Debounced 2s save after any store change (only if currentSessionId exists)
```

### WAV Export Pipeline
```
renderMix() → OfflineAudioContext
  → Mirrors PlaybackEngine gain chain: source → velocityGain → trackGain → masterGain → destination
  → Filters by active tracks (mute/solo logic)
  → Schedules all quantizedHits with correct timing
  → Returns AudioBuffer
→ encodeWav() → stereo 16-bit PCM RIFF WAV Blob
→ triggerDownload() → browser download
```

### Store Architecture (7 stores)
| Store | Purpose |
|-------|---------|
| `appStore` | Navigation, permissions |
| `recordingStore` | Recording lifecycle, onsets |
| `clusterStore` | Clusters, assignments, instruments |
| `quantizationStore` | BPM, grid, strength, quantizedHits + write-back actions |
| `timelineStore` | Track controls, zoom/scroll, undo/redo |
| `sessionStore` | Session list, current session ID/name, save status, storage info |
| `settingsStore` | Theme, default BPM/grid/sensitivity (localStorage persist via Zustand middleware) |

### IndexedDB Schema
- **Database**: `tapbeats`, version 1
- **Object store `sessions`**: keyPath `id`, index `by-updated` on `metadata.updatedAt`
- **Object store `audioBlobs`**: keyPath `key` (format: `{sessionId}:{type}:{subId}`), index `by-session` on `sessionId`
- Audio blobs store raw recording as `{id}:raw` and per-hit snippets as `{id}:snippet:{index}`

---

## Next Actions

1. **Browser verification of M8** — session save/load/delete, WAV export, settings persistence, auto-save
2. **Milestone 9: Polish, PWA & Cross-Browser** — Service worker, accessibility, animations
3. **Milestone 10: Launch** — Deployment, final QA, documentation

---

## Context Notes

- Session serialization captures all 4 data stores (recording, cluster, quantization, timeline) + audio blobs
- Audio blobs stored separately from session JSON for efficient IndexedDB handling (avoid serializing large ArrayBuffers in JSON)
- `RingBuffer.fromArray()` static method added to reconstruct ring buffer from stored raw audio
- `restoreStores()` resets all stores first, then restores in dependency order: recording → cluster → quantization → timeline
- Instrument assignments restored after `setClustering` (which clears them)
- Undo/redo stacks NOT persisted (not useful across sessions, and structuredClone snapshots aren't suitable for IndexedDB)
- Settings use `zustand/middleware` `persist` with `createJSONStorage(() => localStorage)` — separate from IndexedDB
- WAV export uses same mute/solo/volume logic as real-time playback
- Build size grew 26KB (101KB → 127KB app) due to IndexedDB + serialization + WAV encoding
- `fake-indexeddb` provides full IndexedDB implementation for unit tests in jsdom
