# Milestone 8: Session Management & WAV Export

**Target**: Week 9
**Status**: Not Started
**Dependencies**: Milestone 7 (Timeline & Playback)

---

## Objective

Add persistence — save sessions to IndexedDB so users can return to their beats. Add WAV export so users can share their creations. This milestone turns TapBeats from a toy into a tool.

## Deliverables

### 8.1 Session Manager Module
- [ ] Implement `SessionManager` per developer-experience interfaces
- [ ] IndexedDB storage with two object stores (metadata + audio blobs)
- [ ] Save complete session state:
  - Raw audio buffer (compressed)
  - Onset data (timestamps, features, snippets)
  - Cluster definitions and instrument assignments
  - Quantization config (BPM, grid, strength)
  - Timeline edits (manual adds/deletes/moves)
  - Track settings (volume, mute, solo)
- [ ] Session naming — auto-name with timestamp, allow rename (FR-059)
- [ ] Session list with name, date, duration, BPM (FR-060)

### 8.2 Save/Load Flow
- [ ] Auto-save on significant changes (after clustering, after assignment, periodically during editing)
- [ ] Manual save trigger
- [ ] Load session — fully restore all state (FR-057)
- [ ] Delete session with confirmation dialog (FR-058)
- [ ] Handle storage quota limits gracefully (NFR-017)
- [ ] Display current storage usage in settings (NFR-018)

### 8.3 Home Screen Updates
- [ ] Recent sessions list on home screen
- [ ] Session cards: name, date, BPM, duration
- [ ] Tap to load session
- [ ] Swipe or long-press to delete
- [ ] "New Beat" prominent alongside session list

### 8.4 WAV Export
- [ ] Offline rendering of full beat to stereo WAV (FR-061)
- [ ] Render all tracks with current volume levels
- [ ] Apply instrument assignments and quantization
- [ ] Progress indicator during export
- [ ] Browser download trigger on completion
- [ ] Export time < 10 seconds for 2-minute, 8-track beat (NFR-006)

### 8.5 Settings Screen
- [ ] Audio input device selection (FR-067)
- [ ] Default BPM setting (FR-068)
- [ ] Default grid resolution (FR-069)
- [ ] Theme selection dark/light with OS preference default (FR-070)
- [ ] Onset detection sensitivity (FR-071)
- [ ] Persist all settings to localStorage (FR-072)
- [ ] Storage usage display (NFR-018)
- [ ] About / open source info

### 8.6 State Management
- [ ] `sessionStore` Zustand slice (saved sessions, current session ID, save status)
- [ ] IndexedDB persistence middleware for Zustand
- [ ] Settings store with localStorage persistence

### 8.7 Tests
- [ ] Unit: SessionManager save/load roundtrip
- [ ] Unit: IndexedDB operations with fake-indexeddb
- [ ] Unit: WAV export — verify WAV header, sample count, stereo channels
- [ ] Unit: Storage quota detection
- [ ] Integration: Full save → close → reopen → load cycle
- [ ] Integration: WAV export produces playable audio file
- [ ] E2E: Save session, navigate away, return, load session
- [ ] E2E: Export WAV and verify download
- [ ] Performance: WAV export time within budget (NFR-006)

## Acceptance Criteria

- [ ] Sessions saved to IndexedDB with all state (FR-056)
- [ ] Sessions load fully — same state as when saved (FR-057)
- [ ] Session delete works with confirmation (FR-058)
- [ ] Session list shows name, date, BPM, duration (FR-060)
- [ ] WAV export produces valid stereo WAV file (FR-061)
- [ ] WAV export completes in < 10 seconds (NFR-006)
- [ ] Storage quota handled gracefully (NFR-017)
- [ ] All settings persist across sessions (FR-072)
- [ ] Settings screen functional with all options
- [ ] Individual session < 50MB storage (NFR-019)

## Relevant PRD References

- `product-requirements.md` — FR-056 through FR-072
- `technical-architecture.md` — Section 8 (State management), Section 9 (Session persistence)
- `ui-design.md` — Home screen, Settings screen
