# Milestone 9: Polish, PWA & Cross-Browser Hardening

**Target**: Weeks 10-11
**Status**: Not Started
**Dependencies**: Milestone 8 (Session Management & Export)

---

## Objective

Polish the end-to-end experience, add PWA support for offline use and installability, harden cross-browser compatibility (especially iOS Safari), implement accessibility standards, and run full QA.

## Deliverables

### 9.1 Progressive Web App
- [ ] Service worker for asset caching (NFR-015)
- [ ] Web app manifest (name, icons, theme color, display: standalone)
- [ ] Install prompt handling
- [ ] Offline functionality — full app works without internet after first load (NFR-015)
- [ ] PWA installable on iOS, Android, desktop (NFR-016)
- [ ] App icons (192x192, 512x512)
- [ ] Splash screens

### 9.2 Onboarding Flow
- [ ] First-time user detection
- [ ] Interactive tutorial (< 30 seconds):
  1. "Tap the record button"
  2. "Tap on a surface — watch the hits appear"
  3. "Stop and see your sounds grouped"
  4. "Assign instruments and hit play"
- [ ] Skip option
- [ ] Don't show again preference

### 9.3 Cross-Browser Hardening
- [ ] iOS Safari: AudioContext resume on user gesture
- [ ] iOS Safari: Sample rate normalization (lock to 44.1kHz)
- [ ] iOS Safari: Background tab audio suspension handling
- [ ] Firefox: AudioWorklet compatibility verification
- [ ] Safari: OGG → MP3 sample fallback (currently WAV-only via `formatDetection.ts` — swap synthetic WAVs for CC0 OGG+MP3 samples)
- [ ] Edge: Full functionality verification
- [ ] Mobile Chrome: Touch event handling for timeline
- [ ] Test and fix all browsers in compatibility matrix

### 9.4 Accessibility Audit
- [ ] WCAG 2.1 AA compliance audit (NFR-020)
- [ ] Keyboard navigation for all interactive elements (NFR-021)
- [ ] All icons/images have aria-labels (NFR-022)
- [ ] Color not sole means of conveying info — add patterns/labels (NFR-023)
- [ ] Screen reader support for navigation, settings, session management (NFR-024)
- [ ] Contrast ratios verified (4.5:1 normal, 3:1 large) (NFR-025)
- [ ] Focus indicators visible on all interactive elements (NFR-026)
- [ ] `prefers-reduced-motion` support
- [ ] axe-core automated testing integration

### 9.5 Security Hardening
- [ ] Content Security Policy headers (NFR-031)
- [ ] Verify no external resource loading (NFR-032)
- [ ] HTTPS enforcement (NFR-033)
- [ ] No cookies, no tracking, no analytics (NFR-028, NFR-029)

### 9.6 Performance Optimization
- [ ] Lighthouse CI — target 90+ on all categories
- [ ] Initial load < 3s on broadband (NFR-007)
- [ ] Cached load < 1s (NFR-008)
- [ ] Bundle size audit — < 200KB gzipped (excluding samples)
- [ ] Tree-shaking verification
- [ ] Lazy loading for non-critical routes (settings, about)
- [ ] Memory profiling — verify < 200MB for 2-minute session (NFR-009)

### 9.7 UI Polish (per `ui-design.md` Sections 7 + 9)
- [ ] Hit detection pulse (5 visual layers: ripple + flash + counter bounce + waveform spike + haptic)
- [ ] Cluster formation animation (1.2s: dots fade in → slide to groups → color fills → cards scale up)
- [ ] Quantization snap (spring physics: overshoot 15%, settle 300ms, ghost marker fade)
- [ ] Playback cursor (smooth `requestAnimationFrame`, glow pulse at loop boundary)
- [ ] Button press spring feedback (scale 0.95 → 1.02 → 1.0, 200ms)
- [ ] Empty-to-content stagger transitions (50ms delay per item)
- [ ] Export celebration (confetti burst from export button, 2s duration)
- [ ] Loading states and skeleton screens
- [ ] Screen transition animations (shared element where possible)
- [ ] All 9 error states implemented with copy from `ui-design.md` Section 7
- [ ] Empty states (no sessions, no hits detected) with illustrations
- [ ] `prefers-reduced-motion`: all animations replaced with opacity crossfades

### 9.8 Unsupported Browser Handling
- [ ] Browser detection on load (NFR-013)
- [ ] Graceful fallback page listing supported browsers
- [ ] Feature detection (Web Audio API, AudioWorklet, getUserMedia)

### 9.9 Tests
- [ ] Full E2E suite across Chrome, Firefox, Safari, Edge
- [ ] Mobile E2E on iOS Safari, Chrome Android
- [ ] Accessibility: axe-core audit passes with 0 violations
- [ ] Performance: Lighthouse CI gates pass
- [ ] Offline: App functions after network disconnect
- [ ] PWA: Install and launch from home screen
- [ ] Manual QA checklist execution (from testing-strategy.md)

## Acceptance Criteria

- [ ] PWA installable and works offline (NFR-015, NFR-016)
- [ ] First-time onboarding completes in < 30 seconds
- [ ] Works on all target browsers: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ (NFR-011)
- [ ] Works on iOS Safari 15+ and Chrome Android 90+ (NFR-012)
- [ ] WCAG 2.1 AA — 0 axe-core violations (NFR-020)
- [ ] Lighthouse scores > 90 on all categories
- [ ] Initial load < 3s, cached load < 1s (NFR-007, NFR-008)
- [ ] No external resource loading, proper CSP (NFR-031, NFR-032)
- [ ] No cookies, tracking, or analytics (NFR-028, NFR-029)
- [ ] All micro-interactions implemented and smooth
- [ ] Manual QA checklist passed

## Relevant PRD References

- `product-requirements.md` — NFR-007 through NFR-033 (all non-functional requirements)
- `testing-strategy.md` — Sections 7-10 (Accessibility, Cross-browser, CI/CD, Manual QA)
- `ui-design.md` — Onboarding, micro-interactions, error states
- `brand-strategy.md` — First-time user experience

## Implementation Notes from Previous Milestones

### From M5 (Instrument Assignment)

#### Sample Format & PWA
- Current samples are synthetic WAVs in `public/samples/` (448KB total). For PWA:
  - Replace with real CC0 samples in OGG (primary) + MP3 (Safari fallback)
  - `formatDetection.ts` already has the detection stub — extend to check `Audio.canPlayType('audio/ogg')` and fall back to MP3
  - Service worker must cache sample files for offline playback
  - Consider lazy-loading samples (load on first play vs. all at init) to reduce initial cache size
- **PlaybackEngine singleton** ensures single AudioContext — iOS Safari AudioContext resume on user gesture is already handled in `PlaybackEngine.init()` and `ensureResumed()`
- **InstrumentChips** uses `role="radiogroup"` with proper ARIA — audit for keyboard navigation (arrow keys within group)
- **SampleBrowser** modal uses existing Modal component — verify focus trap and escape-to-close accessibility

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

#### Animations to Polish (M6)
- Quantization snap animation: when strength slider changes, hits should animate from old to new position (spring physics per ui-design.md)
- Ghost marker fade: when toggling before/after, ghost markers should fade in/out smoothly
- BPM detection confidence indicator could pulse/glow when confidence is high

### Lessons from M8 (Session Management & WAV Export)

#### Session/Settings Infrastructure
- **SessionManager** (`src/state/persistence/SessionManager.ts`): Orchestrator for save/load/delete/rename. Auto-save via `startAutoSave()` with debounced 2s saves.
- **IndexedDB** (`src/state/persistence/db.ts`): Database `tapbeats` v1, two object stores: `sessions` (session JSON) + `audioBlobs` (binary audio data). Promise wrappers for IDB operations.
- **settingsStore** (`src/state/settingsStore.ts`): Zustand + `persist` middleware with localStorage. Theme, BPM, grid, sensitivity.
- **sessionStore** (`src/state/sessionStore.ts`): Session list, current session ID/name, save status, storage info.

#### UI Components to Polish (M8)
- **SessionCard** (`src/components/app/SessionCard.tsx`): Session list item — name, date, BPM, duration, delete. Has `role="button"` and `aria-label`. Polish: add swipe-to-delete on mobile, long-press confirmation.
- **ExportModal** (`src/components/timeline/ExportModal.tsx`): Progress bar, success icon, error/retry states. Polish: add export celebration animation (confetti per ui-design.md).
- **HomeScreen** (`src/components/app/HomeScreen.tsx`): Session list + empty state (folder icon). Polish: session card entrance animation (stagger), empty state illustration.
- **SettingsScreen** (`src/components/session/SettingsScreen.tsx`): Pill-based selectors, storage bar. Polish: transition animations, audio input device dropdown (currently unimplemented — `audioInputDeviceId` is in state but no UI for enumeration yet).
- **TransportBar** (+save/export buttons): Polish: save status indicator (saved/saving/error), flash on successful save.

#### Service Worker & PWA Notes (M8)
- IndexedDB data must be accessible offline — service worker should NOT cache/intercept IndexedDB operations (they're already local).
- `public/samples/` WAV files MUST be pre-cached by service worker for offline playback.
- Settings in localStorage survive cache clear — but IndexedDB may be evicted under storage pressure. Consider `navigator.storage.persist()` for opt-in persistent storage.
- `estimateStorageUsage()` already exists in `db.ts` — wire into settings screen for real-time quota display.

#### Accessibility Audit Points (M8)
- SessionCard has `role="button"`, `tabIndex={0}`, keyboard Enter/Space handlers — verify screen reader
- ExportModal uses Modal component (has `role="dialog"`, `aria-modal`) — verify focus trap
- SettingsScreen pill buttons: need `role="radiogroup"` with `role="radio"` and `aria-checked` for proper semantics
- Storage bar: add `aria-label` with current usage text
- Delete confirmation modals: verify focus returns to trigger element on close

#### Build Size (M8)
- 127KB app + 143KB vendor = 270KB total (gzipped ~94KB). Grew 26KB from M7's 101KB due to IndexedDB + serialization + WAV encoding. Still under 200KB gzipped budget.
- Test count: 605 (59 files). Target ~650+ by launch.

#### TypeScript/Lint (M8)
- No new lint rule issues discovered in M8
- Pattern: `void manager.doSomething().then(...)` for fire-and-forget async in event handlers (satisfies `no-floating-promises`)

### Lessons from M7 (Timeline Enhancement)

#### UI Components to Polish
- **TrackHeaders** (`src/components/timeline/TrackHeaders.tsx`): DOM-based with mute (volume-2/volume-x icon) and solo ("S" text) buttons. Responsive at <=640px (48px icon-only, no name label, solo hidden). Verify touch targets meet Apple HIG 44px minimum.
- **TrackControls** (`src/components/timeline/TrackControls.tsx`): Per-track + master volume sliders in collapsible panel. Reuses shared Slider component.
- **TransportBar** (`src/components/timeline/TransportBar.tsx`): Now includes undo/redo buttons (disabled state), master volume slider, save/export buttons, dividers. Mobile: fixed bottom, volume hidden.
- **TimelineCanvas**: Has `touch-action: none` for gesture control. Verify pinch-to-zoom doesn't conflict with browser zoom on iOS Safari.

#### Accessibility Audit Points (M7)
- Track headers use real `<button>` elements with `aria-label` and `aria-pressed` — verify screen reader announces mute/solo state
- TrackHeaders `role="list"` with `role="listitem"` — verify navigation
- Keyboard shortcuts (`useKeyboardShortcuts.ts`): Space, L, M, S, 1-9, Ctrl+Z/Y, +/-, Ctrl+S, Ctrl+E — document in help/tooltip overlay
- Canvas hit editing has no keyboard equivalent yet — consider Tab to cycle hits, Enter to select, arrow keys to nudge
- Volume sliders reuse shared Slider (range input) — verify ARIA labels present

#### Animations to Polish (M7)
- Mute toggle: fade track opacity 1 → 0.3 smoothly (currently instant)
- Solo glow: highlighted border/background animation on solo button
- Drag preview: smooth follow with grid snap indicator line
- Zoom: smooth transition between zoom levels (currently instant)
- Undo/redo: flash or brief highlight on restored hits

#### Performance Notes (M7)
- Canvas viewport culling implemented — only draws hits within visible range. Should maintain 60fps with 200+ hits at any zoom level.
- PlaybackEngine track gain nodes persist during playback — no allocation/deallocation jank
- structuredClone for undo: ~0.1ms for 500 hits — negligible
- Build size through M8: 127KB app (grew 26KB from M7's 101KB). Monitor for M9 additions.

#### TypeScript/Lint (M7 additions)
- `no-non-null-assertion`: Use `if (x === undefined) return` guard after `.pop()` instead of `!`
- `no-confusing-void-expression`: Arrow functions calling void methods need `{ }` braces — auto-fixable with `--fix`

### Infrastructure from M2
- **Reduced motion support**: `useReducedMotion` hook + CSS `@media (prefers-reduced-motion: reduce)` already applied to RecordButton glow, HitFlash, StatsBar bounce, RecordingHeader dot pulse. Extend pattern to all new animations.
- **ARIA live regions**: RecordingScreen has `role="status"` + `aria-live="polite"` for screen reader announcements. ProcessingOverlay has `role="alert"` + `aria-live="assertive"`. Apply to all dynamic status changes.
- **Error screens**: PermissionDenied component shows full-screen error with retry. Use as pattern for other error states (unsupported browser, storage full, etc.).
- **Production build baseline**: 37.8KB app + 142.8KB vendor + 13KB CSS (total ~193KB, well under 200KB budget after M2).

### Infrastructure Already in Place (from M1)
- Playwright config has 5 browser projects (Chromium, Firefox, WebKit, mobile Chrome, mobile Safari) — ready for cross-browser E2E
- GitHub Actions CI runs lint + typecheck + unit tests + build on PR; E2E on push to main
- CSS `animations.css` has base keyframes (fadeIn, slideUp, scaleSpring, pulse, shimmer) — extend for polish
- ErrorBoundary exists at `src/components/app/ErrorBoundary.tsx` — extend for error states
- `.editorconfig` ensures consistent formatting across editors

### SSL / HTTPS Notes
- Dev server runs HTTP on port 8087 — no `@vitejs/plugin-basic-ssl`
- **Production deployment MUST use HTTPS** — required for `getUserMedia`, service workers, and PWA install
- Service worker registration should check `location.protocol === 'https:'` or `location.hostname === 'localhost'`
- CSP headers: currently only COOP/COEP set in `vite.config.ts` server headers — add CSP for production deployment config

### Accessibility Starting Point
- Button component already has focus ring (`2px solid var(--border-focus)`)
- Card component has `role="button"` and `tabIndex` when interactive
- Modal has `role="dialog"` and `aria-modal="true"`
- Missing: skip links, landmark regions, screen reader announcements for dynamic content

### Performance Baseline
- Current production build: ~166KB total, ~54KB gzipped (well under 200KB budget)
- Vendor chunk (React + ReactDOM + Zustand): 142KB / 46KB gzipped
- App chunk: 20KB / 7KB gzipped
- CSS: 3KB / 1.3KB gzipped

### React Router v6 Warnings
- React Router v6 emits future flag warnings (`v7_startTransition`, `v7_relativeSplatPath`) — address during polish or upgrade to v7

### Lessons from M4 (Clustering)

- **Canvas elements**: ClusterCard uses 48px canvas waveform preview. Ensure accessibility: canvas has `aria-hidden` and is supplemented by text (hit count, cluster name).
- **CSS custom properties**: ClusterCard injects `--cluster-color` and `--entrance-delay` via inline `style` prop. Verify these work with `prefers-reduced-motion` (entrance animation should be disabled).
- **AudioContext per play**: `useClusterPlayback` creates one AudioContext — verify iOS Safari handles this correctly (needs user gesture to resume).
- **Test count at 314+** — full regression suite should run before launch.

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
