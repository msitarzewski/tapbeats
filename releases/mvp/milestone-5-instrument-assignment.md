# Milestone 5: Instrument Assignment & Sample Library

**Target**: Week 5
**Status**: Not Started
**Dependencies**: Milestone 4 (Clustering)

---

## Objective

Build the sample library and instrument assignment flow. Users browse available drum sounds, preview them, and assign one to each cluster. Smart defaults suggest instruments based on acoustic characteristics.

## Deliverables

### 5.1 Sample Library
- [ ] Source CC0/public domain drum samples (no licensing issues for open source)
- [ ] Minimum instrument set (FR-029):
  - Kick drum (3 variations)
  - Snare drum (3 variations)
  - Hi-hat closed (2 variations)
  - Hi-hat open (2 variations)
  - Tom high, mid, low (1 each)
  - Clap (2 variations)
  - Rim shot (1 variation)
  - Cowbell (1 variation)
  - Shaker/tambourine (1 variation)
- [ ] Audio format: OGG primary, MP3 fallback for Safari
- [ ] Normalize all samples (44.1kHz, mono, -1dBFS peak)
- [ ] Trim silence, consistent envelope
- [ ] Bundle samples with app (no runtime loading)

### 5.2 Sample Playback Infrastructure
- [ ] `PlaybackEngine` module — AudioBuffer loading and caching
- [ ] Sample triggering via `AudioBufferSourceNode` with precise timing
- [ ] OGG/MP3 format detection and fallback
- [ ] Preload all samples on app startup

### 5.3 Smart Default Suggestions
- [ ] Analyze cluster features to suggest instruments (FR-032):
  - Low spectral centroid + high energy → kick drum
  - High spectral centroid + sharp attack → hi-hat
  - Mid spectral centroid + high energy → snare
  - Mid-low centroid + medium energy → tom
- [ ] Present suggestion as pre-selected but easily changeable

### 5.4 Assignment UI
- [ ] Instrument browser per cluster (FR-028)
  - Grid of instrument categories
  - Variations within each category
  - Preview (audition) on tap/click (FR-030)
- [ ] Per-instrument color assignment (FR-031)
- [ ] Color coding applied to cluster card when assigned
- [ ] "Skip" option to mute a cluster (FR-036)
- [ ] Change assignment at any time (FR-034)
- [ ] "Continue to Timeline" button when at least 1 cluster assigned

### 5.5 State Management Updates
- [ ] Extend `clusterStore` with instrument assignments
- [ ] Instrument mapping: clusterId → { instrumentId, sampleUrl, color }
- [ ] Default suggestions populated automatically
- [ ] User overrides tracked

### 5.6 Tests
- [ ] Unit: Sample loading and AudioBuffer creation
- [ ] Unit: Smart suggestion algorithm with synthetic features
- [ ] Unit: OGG/MP3 fallback detection
- [ ] Integration: Full cluster → assignment → preview flow
- [ ] E2E: Assign instruments to clusters, hear preview
- [ ] Verify all bundled samples load without errors
- [ ] Cross-browser: Sample playback on Chrome, Firefox, Safari, iOS Safari

## Acceptance Criteria

- [ ] At least 20 drum samples available across all categories (FR-029)
- [ ] User can browse and preview any sample before assigning (FR-028, FR-030)
- [ ] Smart defaults suggest reasonable instruments based on sound characteristics (FR-032)
- [ ] User can override any suggestion (FR-033)
- [ ] Instrument colors applied consistently across UI (FR-031)
- [ ] User can change assignment after initial selection (FR-034)
- [ ] All samples are CC0/public domain licensed
- [ ] Sample playback works on all target browsers
- [ ] Total sample bundle < 2MB

## Relevant PRD References

- `product-requirements.md` — FR-028 through FR-036
- `audio-engineering.md` — Sections 6-7 (Playback architecture, Sample library)
- `technical-architecture.md` — Section 7 (Playback engine)
- `ui-design.md` — Cluster review / instrument assignment screen

## Implementation Notes from Previous Milestones

### Infrastructure from M2
- **Audio types pattern**: `src/types/audio.ts` shows how to define shared interfaces/constants. Follow same pattern for sample/instrument types.
- **Event emitter pattern**: `AudioCapture` class uses typed Map-based event emitter — reuse for playback engine events.
- **Canvas rendering pattern**: `useWaveformRenderer.ts` shows RAF loop + store subscription outside React — apply same pattern for sample waveform previews.

### Infrastructure Already in Place (from M1)
- Sample files go in `src/assets/samples/` (directory exists) or `public/` for runtime loading
- Playback engine module goes in `src/audio/playback/` (directory exists)
- Modal component available for instrument browser (responsive bottom sheet on mobile, centered on desktop)
- Card and Button components ready for instrument grid UI
- Web Audio mocks in `tests/helpers/` — extend with `AudioBufferSourceNode` mocks for sample playback testing
- Cluster colors `--cluster-0` through `--cluster-7` defined in theme

### TypeScript/Lint Rules to Watch
- `verbatimModuleSyntax`: use `import type` for type-only imports
- `strict-boolean-expressions`: no truthy checks — `if (sample !== undefined)` not `if (sample)`
- `noUncheckedIndexedAccess`: map/array lookups return `T | undefined`
- Import ordering: blank lines between groups, CSS modules before type imports
- Async mocks: use `return Promise.resolve()` not `async`

### Sample Bundle Considerations
- No SSL locally — dev server is `http://localhost:8087`
- Vite serves `public/` directory as-is — samples here are not processed by bundler
- `src/assets/` files are processed by Vite (hashed filenames, tree-shaken)
- Choose `public/` for runtime-loaded samples, `src/assets/` for import-time samples

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
