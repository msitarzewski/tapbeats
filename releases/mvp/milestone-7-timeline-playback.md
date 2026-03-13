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

## Implementation Notes from Previous Milestones

### Infrastructure from M2
- **Canvas rendering**: `useWaveformRenderer.ts` demonstrates the RAF + canvas + store.subscribe() pattern. Timeline renderer should follow the same approach but with more complex drawing (grid, hit markers, cursor).
- **AudioCapture event emitter**: Typed event emitter pattern in `AudioCapture.ts` — reuse for PlaybackEngine events (onPlay, onStop, onBeat, etc.).
- **useRecordingTimer**: RAF-based timer hook — similar pattern needed for playback position display.
- **ResizeObserver + devicePixelRatio**: LiveWaveform handles responsive canvas sizing. Timeline canvas should use the same approach.

### Infrastructure Already in Place (from M1)
- Timeline screen stub at `src/components/timeline/TimelineScreen.tsx` — extend it
- Slider component for volume controls, Button for transport controls
- CSS transitions defined in theme: `--ease-micro` (100ms), `--ease-state` (250ms), `--ease-spring` (300ms), `--ease-slow` (500ms)
- Animation keyframes in `src/styles/animations.css`
- Web Audio mocks in `tests/helpers/` — extend with scheduling/timing mocks
- Playback engine goes in `src/audio/playback/` (directory exists)

### TypeScript/Lint Rules to Watch
- `verbatimModuleSyntax`: use `import type` for type-only imports
- `strict-boolean-expressions`: `if (isPlaying)` won't work if it's `boolean | undefined` — must be explicit
- `noUncheckedIndexedAccess`: track array access returns `T | undefined`
- `restrict-template-expressions`: `String()` wrap for numbers in template literals (beat numbers, time displays)
- Import ordering: blank lines between groups, CSS modules before type imports
- Canvas rendering code won't be caught by React-focused lint rules but TypeScript strict mode still applies

### Performance Considerations
- Canvas rendering at 60fps — `requestAnimationFrame` loop won't trigger React re-renders (good)
- Lookahead scheduler uses `setInterval` + `AudioContext.currentTime` — test with mock timing
- Playwright E2E config has 5 browser projects ready (Chromium, Firefox, WebKit, mobile Chrome, mobile Safari)
- Dev server is HTTP on port 8087 — no SSL overhead for local perf testing

### Keyboard Shortcuts Note
- No keyboard event handling infrastructure exists yet — build from scratch
- Consider a custom hook (`useKeyboardShortcuts`) in `src/hooks/`

### Lessons from M5 (Instrument Assignment)

#### PlaybackEngine Already Exists
- **`PlaybackEngine.ts`** (`src/audio/playback/PlaybackEngine.ts`) is already a singleton managing the AudioContext + sample buffer cache. M7's lookahead scheduler should use `PlaybackEngine.getInstance()` and extend it (or compose with it) — do NOT create another AudioContext.
- **`playSample(instrumentId)`** already works for one-shot playback. M7 needs to add scheduled playback: `playSampleAt(instrumentId, when: number)` using `AudioBufferSourceNode.start(when)`.
- **`getBuffer(instrumentId)`** returns cached AudioBuffer — the lookahead scheduler can use this directly.
- **`useClusterPlayback.ts`** already delegates to PlaybackEngine — no AudioContext management needed in hooks.

#### Sample & Instrument Data Available
- `SAMPLE_MANIFEST` has 18 instruments with `id`, `label`, `category`, `colorIndex`
- `instrumentAssignments` in clusterStore maps clusterId → instrumentId
- `getInstrumentColor(id)` returns CSS var for track color in timeline
- Skipped clusters (`assignment === 'skip'`) should be excluded from timeline tracks

#### Agent Strategy
- M5 used 6 parallel agents successfully. M7 has more interdependencies (timeline rendering depends on playback state), so consider: PlaybackEngine extension + Timeline canvas + Transport controls + Track controls + State in 4-5 agents.

### Lessons from M4 (Clustering)

#### Canvas & Audio Patterns
- **`useClusterWaveformRenderer.ts`**: One-shot canvas render (no RAF loop) with ResizeObserver + devicePixelRatio. Good pattern for static waveform previews. Timeline needs RAF loop instead but ResizeObserver/DPR handling is reusable.
- **`useClusterPlayback.ts`**: Delegates to PlaybackEngine singleton (refactored in M5). No AudioContext management needed.
- **AudioContext limit**: Already handled by PlaybackEngine singleton (M5).

#### Store Patterns
- **Cross-store reads**: `clusterStore.splitCluster()` reads from `recordingStore.getState()._onsets`. Timeline store may similarly need to read from cluster + recording stores.
- **Contiguous ID remapping**: Cluster operations remap IDs to contiguous 0-based after split/merge. Track IDs should follow the same convention.

#### TypeScript
- `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` + `restrict-template-expressions` — the three most common gotchas. See M4/M5 notes for details.

### Lessons from M3 (Onset Detection)

#### React Patterns
- **Never pass `ref.current` to hooks as a reactive dependency.** React refs don't trigger re-renders, so hooks receiving `ref.current` always get the initial value (usually `null`). Wire event listeners directly where the instance is created (e.g., in `startRecording()` alongside other listeners).
- **Never use `setTimeout` chains inside `useEffect`.** React's effect cleanup runs between setTimeout calls (especially in StrictMode), killing the chain. For post-processing work triggered by state changes, process synchronously within the effect body wrapped in try/catch. If work is too heavy (>3s), use a Web Worker instead.
- **Always handle all status values in conditional renders.** If a component renders different views based on status (idle, recording, processing, complete), ensure every status has a handler. Missing handlers cause the component to fall through to an unexpected default view.

#### AudioWorklet Patterns
- **Worklet files in `public/` may be cached by the browser.** After modifying a worklet file, a hard reload (Cmd+Shift+R) or cache-busting query param is needed. Vite's HMR does not apply to AudioWorklet modules.
- **Spectral flux alone is insufficient for onset gating.** Ambient microphone noise produces spectral flux values of 0.3-0.7 regularly. Use dual gating: spectral flux threshold (>0.5) AND RMS energy gate (>0.01). The energy gate rejects quiet noise regardless of spectral variation.
- **AudioWorklet JS rules**: `var` declarations, old-style `function` syntax, NO arrow functions, NO template literals, NO `console.log` (not available in worklet scope). Add `// @ts-nocheck` and `/* eslint-disable no-undef */` at top.
- **Pre-allocate all buffers in worklet constructor.** Never allocate in `process()` — it runs on the audio thread and allocations cause glitches. Only exception: re-allocating snippet buffer after Transferable transfer.

#### DSP & TypeScript
- **Use `?? 0` for typed array access** to satisfy `no-non-null-assertion` lint rule. E.g., `arr[i] ?? 0` instead of `arr[i]!`.
- **Use dot notation for object property access** (`f.rms`) not bracket notation (`f["rms"]`) to satisfy `dot-notation` lint rule.
- **Synchronous feature extraction is fast enough**: ~5ms per hit × 500 max = ~2.5s worst case. Acceptable since processing overlay is shown.

#### Testing & Debugging
- **Chrome DevTools MCP is highly effective** for debugging AudioWorklet + React integration issues at runtime. Use it to inspect console logs, take snapshots, and interact with the UI programmatically.
- **Canvas in jsdom**: `HTMLCanvasElement.getContext()` returns `null` — mock it in tests with `vi.spyOn(HTMLCanvasElement.prototype, 'getContext')`.
- **ResizeObserver in jsdom**: Not provided — mock globally in test setup.
- **Use `store.subscribe()` (not selectors) for high-frequency canvas rendering** that runs outside React's render cycle (e.g., ProtoTimeline, LiveWaveform).

### Lessons from M6 (Quantization)

#### Quantization Infrastructure Available
- `quantizationStore` holds: bpm, bpmManualOverride, bpmResult, gridResolution, strength, swingAmount, quantizedHits, playbackMode
- `PlaybackEngine.playScheduled(instrumentId, when, velocity)` handles timed sample playback with GainNode velocity control
- `useQuantizedPlayback` implements lookahead scheduling (25ms setInterval, 100ms lookahead window) with before/after comparison
- `useTimelineRenderer` renders canvas at 60fps using `store.subscribe()` pattern (not React selectors)
- Pure algorithm functions in `src/audio/quantization/`: `detectBpm()`, `quantizeHits()`, `gridUtils` — no store coupling

#### Cross-Store Pattern Established
- `quantizationStore.recomputeQuantization()` reads from `useRecordingStore.getState()._onsets` + `useClusterStore.getState()` (clusters, assignments, instrumentAssignments)
- Original-to-remapped cluster ID mapping: build map via `assignments[cluster.hitIndices[0]]` to translate between clustering output IDs and contiguous ClusterData.id

#### TypeScript/Lint (additional to existing)
- `Array<T>` syntax forbidden by eslint `array-type` rule — must use `T[]`
- Import ordering: external → `@/` imports (value+type mixed) → relative imports. CSS modules come before type-only `react` imports in relative group
- `Float64Array` indexed access returns `number | undefined` with `noUncheckedIndexedAccess` — use `?? 0`
- CSS module class concatenation: `[styles.a, condition ? styles.b : ''].filter(Boolean).join(' ')` — never template literals

#### M6 Already Implemented These (Reduce M7 Scope)
The following items from M7's original spec were completed in M6:
- **7.1 Timeline Rendering**: Canvas-based multi-track renderer (`useTimelineRenderer.ts`), grid lines at current resolution, hit markers colored by instrument, ghost markers at original positions (30% opacity with connecting line), playback cursor (2px blue vertical line)
- **7.2 Playback Engine**: Lookahead scheduling (`useQuantizedPlayback.ts`), `playScheduled()` on PlaybackEngine singleton — no new AudioContext needed
- **7.3 Transport Controls**: Play/pause button, stop (skip-back), loop toggle, before/after mode toggle, time display — all in `TransportBar.tsx`
- **7.7 State Management (partial)**: `quantizationStore` manages quantized hits, playback mode. Playback position tracked via `cursorTimeRef` in the hook.

#### What M7 Should Focus On (Remaining)
- **7.1 additions**: Track headers (instrument name, color dot), beat/bar ruler along top, zoom controls (Ctrl+scroll, pinch), horizontal scroll
- **7.2 additions**: Per-track gain nodes for volume, master gain node, seamless loop (schedule next iteration before current ends)
- **7.4 Track Controls**: Per-track mute/solo/volume sliders — these are NEW
- **7.5 Timeline Editing**: Drag hits, add hits, delete hits, undo/redo — these are NEW
- **7.6 Responsive**: Mobile track header collapse, keyboard shortcuts
- **7.7 additions**: Undo/redo stack, per-track derived state

#### Architecture Notes for M7
- `TimelineScreen.tsx` already assembles: QuantizationControls (top) → TimelineCanvas (flex:1) → TransportBar (bottom). M7 adds track headers to the left of TimelineCanvas.
- `useTimelineRenderer.ts` already subscribes to quantizationStore + clusterStore. Extend with track control state (mute/solo/volume).
- `useQuantizedPlayback.ts` schedules all hits — to add mute/solo, filter hits by track/cluster before scheduling.
- Canvas rendering already handles DPR scaling, track lane backgrounds, and grid lines. Track headers should be separate DOM elements (not canvas) for accessibility.
