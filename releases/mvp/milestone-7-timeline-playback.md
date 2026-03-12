# Milestone 7: Timeline View & Playback Engine

**Target**: Weeks 7-8
**Status**: Not Started
**Dependencies**: Milestone 6 (Quantization)

---

## Objective

Build the DAW-style timeline view and the full playback engine. This is the "big reveal" screen where the user sees their tapped-out beat as a proper multi-track arrangement and hears it played back with real drum samples on perfect timing.

## Deliverables

### 7.1 Timeline Rendering (Canvas) (per `ui-design.md` Section 3 — Timeline Screen)
- [ ] Canvas-based timeline renderer (60fps target)
- [ ] Multi-track layout — one horizontal track per instrument/cluster (FR-045)
  - Track height: 48px, separated by 1px `--surface-1` dividers
  - Track header (120px fixed width): instrument name, color dot, mute/solo/volume
- [ ] Grid lines: `--surface-2` for subdivisions, `--text-secondary` for beat lines, `--text-primary` for bar lines (FR-055)
- [ ] Hit markers: 12×32px rounded rects in instrument color, 80% opacity (100% on hover)
- [ ] Ghost markers at original (pre-quantization) positions: 30% opacity, dashed outline
- [ ] Beat/bar number labels along top ruler (24px height)
- [ ] Playback cursor: 2px `--accent-primary` vertical line, `box-shadow` glow
- [ ] Zoom controls — horizontal zoom (Ctrl+scroll on desktop, pinch on touch)
- [ ] Scroll for beats longer than viewport
- [ ] Hidden data table equivalent for screen readers (ARIA, per `ui-design.md` Section 8)

### 7.2 Playback Engine
- [ ] Lookahead scheduling pattern (100ms lookahead, 25ms timer interval)
- [ ] Schedule sample triggers via `AudioBufferSourceNode` at precise `AudioContext.currentTime`
- [ ] Per-track gain nodes for volume control (FR-049)
- [ ] Master gain node (FR-050)
- [ ] Seamless loop playback — schedule next loop iteration before current ends (FR-051)
- [ ] No audible gap or click at loop boundary (NFR-010, < 5ms gap)

### 7.3 Transport Controls
- [ ] Play button (FR-046)
- [ ] Stop button (FR-046)
- [ ] Loop toggle (FR-046)
- [ ] Visual playback cursor — vertical line moving across timeline in sync (FR-047)
- [ ] Playback start latency < 100ms (NFR-004)

### 7.4 Track Controls
- [ ] Per-track mute toggle (FR-048)
- [ ] Per-track solo toggle (FR-048)
- [ ] Per-track volume slider (FR-049)
- [ ] Master volume slider (FR-050)
- [ ] Visual mute/solo state indicators

### 7.5 Timeline Editing (P1)
- [ ] Drag individual hit markers to adjust timing (FR-052)
- [ ] Click empty position to add new hit (FR-053)
- [ ] Select + delete individual hits (FR-054)
- [ ] Undo/redo for all timeline edits

### 7.6 Responsive Timeline (per `ui-design.md` Section 5)
- [ ] Mobile (xs/sm): Track headers collapse to 48px icon-only, transport bar fixed bottom
- [ ] Tablet (md): Full timeline, touch gestures, bottom sheet for track settings
- [ ] Desktop (lg+): Full timeline with side panels, mouse + keyboard
- [ ] Pinch-to-zoom on touch, Ctrl+scroll on desktop
- [ ] Keyboard shortcuts (per `ui-design.md` Section 4): Space (play/stop), L (loop), M (mute), S (solo), 1-9 (select track), Ctrl+Z/Y (undo/redo), +/- (zoom)

### 7.7 State Management
- [ ] `timelineStore`: quantized hits, playback position, playing state, loop state
- [ ] Derived: per-track hit lists from clustered + quantized data
- [ ] Undo/redo stack for timeline edits (snapshot-based)
- [ ] Playback position sync between audio engine and visual cursor

### 7.8 Tests
- [ ] Unit: Lookahead scheduler — correct scheduling times
- [ ] Unit: Seamless loop — verify schedule overlap
- [ ] Unit: Per-track mute/solo logic
- [ ] Unit: Volume control (gain node values)
- [ ] Unit: Playback position calculation
- [ ] Integration: Full playback — multiple tracks, correct timing
- [ ] E2E: Play/stop/loop controls work
- [ ] Performance: Canvas rendering maintains 60fps with 200+ hits (NFR-002)
- [ ] Performance: Playback start < 100ms (NFR-004)
- [ ] Performance: Loop gap < 5ms (NFR-010)
- [ ] Cross-browser: Playback on all target browsers

## Acceptance Criteria

- [ ] Multi-track timeline renders with grid lines and hit markers (FR-045, FR-055)
- [ ] Playback plays correct samples at correct quantized times
- [ ] Play/stop/loop controls work (FR-046)
- [ ] Playback cursor moves in sync with audio (FR-047)
- [ ] Per-track mute and solo work (FR-048)
- [ ] Per-track and master volume controls work (FR-049, FR-050)
- [ ] Loop playback is seamless with no audible gap (FR-051, NFR-010)
- [ ] Timeline renders at 60fps during playback (NFR-002)
- [ ] Playback starts within 100ms of pressing play (NFR-004)
- [ ] Works on all target browsers including iOS Safari

## Relevant PRD References

- `product-requirements.md` — FR-045 through FR-055
- `audio-engineering.md` — Section 6 (Sample playback architecture)
- `technical-architecture.md` — Section 7 (Playback engine)
- `ui-design.md` — Timeline/arrangement screen
