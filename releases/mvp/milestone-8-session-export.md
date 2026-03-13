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

## Implementation Notes from Previous Milestones

### Infrastructure from M2
- **HomeScreen** (`src/components/app/HomeScreen.tsx`): Currently has title + RecordButton. Extend with session list below the record button.
- **Icon component**: Already has mic, arrow-left, square, etc. Extend with session/export icons (download, trash, folder).
- **Pre-prompt overlay pattern**: MicPermissionOverlay shows informational UI before triggering async operations. Use same pattern for destructive actions (delete session confirmation).

### Infrastructure Already in Place (from M1)
- Home screen stub at `src/components/app/HomeScreen.tsx` — extend for session list
- Settings screen stub at `src/components/session/SettingsScreen.tsx` — extend
- Card component for session list items (has selected state, onClick, ARIA)
- Modal component for delete confirmation dialogs (responsive)
- Button, Slider components for settings controls
- Zustand store pattern established in `src/state/`
- Router already has `/` (Home) and `/settings` routes

### TypeScript/Lint Rules to Watch
- `verbatimModuleSyntax`: use `import type` for type-only imports
- `strict-boolean-expressions`: IndexedDB result checks must be explicit (`!== undefined`)
- `noUncheckedIndexedAccess`: session lookups return `T | undefined`
- `exactOptionalPropertyTypes`: cannot assign `undefined` to optional session fields — omit key
- `no-floating-promises`: IndexedDB operations return promises — must `await` or `.catch()`
- Import ordering: blank lines between groups

### New Dependencies Needed
- `fake-indexeddb` not in devDependencies yet — add it for IndexedDB unit tests
- `localStorage` for settings — no special test setup needed (jsdom supports it)
- WAV export: offline `AudioContext` rendering — extend `createMockAudioContext()` in `tests/helpers/audioMocks.ts`

### Lessons from M5 (Instrument Assignment)

#### Session Data to Persist
- `instrumentAssignments: Record<number, string>` in clusterStore — must be saved/restored with session
- `SAMPLE_MANIFEST` is compile-time constant — no need to serialize instrument definitions
- WAV samples are in `public/samples/` — loaded at runtime by PlaybackEngine, not stored in session
- PlaybackEngine singleton will need re-init on session load (call `init()` to reload samples)

#### WAV Export Integration
- `PlaybackEngine.getBuffer(instrumentId)` provides AudioBuffers for offline rendering
- Each track's instrument assignment determines which sample buffer to use
- Skipped clusters (`assignment === 'skip'`) should be excluded from export

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

#### Session Data to Persist (M6 additions)
- `quantizationStore` state must be saved/restored: bpm, bpmManualOverride, gridResolution, strength, swingAmount, playbackMode
- `quantizedHits` array: if user has made manual edits (add/move/delete), persist quantizedHits directly; otherwise recompute from config
- BPM detection runs on load — restore manual override flag to prevent re-detection from overwriting user's BPM

#### WAV Export Integration (M6 additions)
- `quantizedHits` provides the final hit schedule for offline rendering: each hit has `quantizedTime`, `instrumentId`, `velocity`
- `PlaybackEngine.getBuffer(instrumentId)` provides AudioBuffers for offline rendering
- Before/after comparison in export: user should choose whether to export original or quantized timing

### Lessons from M7 (Timeline Enhancement)

#### Timeline Store & Write-Back Actions
- `timelineStore` manages: `trackConfigs` (mute/solo/volume per track), `masterVolume`, `selectedTrackIndex`, `pixelsPerSecond`, `scrollOffsetSeconds`, `undoStack`, `redoStack`
- `quantizationStore` has write-back actions: `setQuantizedHits(hits)`, `addHit(hit)`, `removeHit(index)`, `updateHitTime(index, time)` — these bypass recompute for manual edits
- **Session save must handle manual edits**: If user has dragged/added/deleted hits, `quantizedHits` can no longer be recomputed from config alone. Detect this (e.g., dirty flag or compare to recomputed output) and persist `quantizedHits` directly.

#### Audio Graph for WAV Export
- `PlaybackEngine` now has per-track gain chain: `source → velocityGain → trackGain → masterGain → destination`
- Methods available: `createTrack(trackId, volume)`, `setTrackVolume(trackId, volume)`, `setMasterVolume(volume)`
- WAV offline rendering should use same gain routing: create offline AudioContext, mirror track gain chain, schedule all hits, render to AudioBuffer
- `playScheduled(instrumentId, when, velocity, trackId?)` already routes through track gain when `trackId` provided

#### Session Data to Persist (M7 additions)
- `timelineStore.trackConfigs`: per-track mute/solo/volume state
- `timelineStore.masterVolume`: master volume level
- Do NOT persist: undoStack, redoStack (not serializable via structuredClone for IndexedDB), pixelsPerSecond, scrollOffsetSeconds (UI-only state)
- Do NOT persist: selectedTrackIndex (reset on load)

#### TypeScript/Lint (M7 additions)
- `no-non-null-assertion`: Use `if (x === undefined) return` guard after `.pop()` instead of `!`
- `no-confusing-void-expression`: Arrow functions calling void methods need `{ }` braces — auto-fixable with `--fix`
- `structuredClone` works for QuantizedHit (flat readonly properties) but undo snapshots are NOT suitable for IndexedDB persistence

### Export Considerations
- Build output goes to `dist/` — already .gitignored
- WAV files are generated client-side — no server needed
- Dev server is HTTP on port 8087 — download triggers work without HTTPS

### Lessons from M4 (Clustering)

- **Store serialization**: `clusterStore` has `featureVectors: number[][]` and `normalization` — these need to be included in session save/load. `NormalizationResult` has `mins` and `maxes` arrays.
- **ClusterData includes `representativeHitIndex`** which indexes into `recordingStore._onsets` — session restore must reconstruct this mapping.
- **Pure algorithm functions**: Clustering functions are pure and accept data directly (no store dependency), making them easy to re-run on loaded session data.
- **Test count at 314** as of M4 — session roundtrip tests should verify clustering state restores correctly.

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
- **Synchronous feature extraction is fast enough**: ~5ms per hit x 500 max = ~2.5s worst case. Acceptable since processing overlay is shown.

#### Testing & Debugging
- **Chrome DevTools MCP is highly effective** for debugging AudioWorklet + React integration issues at runtime. Use it to inspect console logs, take snapshots, and interact with the UI programmatically.
- **Canvas in jsdom**: `HTMLCanvasElement.getContext()` returns `null` — mock it in tests with `vi.spyOn(HTMLCanvasElement.prototype, 'getContext')`.
- **ResizeObserver in jsdom**: Not provided — mock globally in test setup.
- **Use `store.subscribe()` (not selectors) for high-frequency canvas rendering** that runs outside React's render cycle (e.g., ProtoTimeline, LiveWaveform).
