# TapBeats Progress

## Overall Status

**Phase**: Milestone 9 complete, ready for launch preparation (M10).
**Target**: 12-week MVP delivery
**Last Updated**: 2026-03-13

---

## Completed

### Planning & Documentation
- Full PRD with 8 section documents (17,500+ lines total)
- MVP release plan with 10 milestones across 12 weeks

### Milestone 1: Project Scaffolding & Infrastructure (2026-03-12)
- **Branch**: `milestone-1/scaffolding`, commit `34680be`
- Vite 6 + React 18 + TypeScript 5.7 (strict mode)
- CSS design system, shared components, React Router, ESLint/Prettier/Husky
- Vitest + Playwright, GitHub Actions CI/CD
- Production build: 166KB total, 54KB gzipped

### Milestone 2: Audio Capture & Microphone Pipeline (2026-03-12)
- **Branch**: `milestone-2/audio-capture`, commit `46ee54a`
- Full audio capture pipeline: getUserMedia → AudioContext → AudioWorklet → RingBuffer → Zustand store
- Recording UI: HomeScreen, RecordingScreen, LiveWaveform, permission flow
- 88 tests passing across 11 test files
- Production build: 37.8KB app + 142.8KB vendor + 13KB CSS

### Milestone 3: Real-Time Onset Detection (2026-03-12)
- **Branch**: `milestone-3/onset-detection` (from M2)
- Spectral flux onset detection in AudioWorklet with dual gating (flux threshold + RMS energy)
- 12-dim feature extraction, Z-score normalization, BPM estimation
- ProtoTimeline (canvas), SensitivityControl, complete→navigate flow
- 5 runtime bugs found and fixed via Chrome DevTools debugging
- 205 tests passing (18 test files), 0 lint errors, production build succeeds (48KB app)

### Milestone 4: Sound Clustering & Cluster Review UI (2026-03-12)
- **Branch**: `milestone-4/clustering` (from M3)
- K-means++ clustering with auto-K via silhouette scoring
- Min-max normalization on full 12-dim feature vectors (complements Z-score from M3)
- Cluster review screen at `/review`: ClusterCard grid, waveform preview, playback, split/merge
- ClusterStore Zustand slice, pipeline integration in useProcessing
- 314 tests passing (27 test files, +109 new), 0 lint errors, production build succeeds (63KB app)
- Pattern: 3 parallel agents (Algorithm, State/Integration, UI) + separate Test agent

### Milestone 5: Instrument Assignment & Sample Library (2026-03-12)
- **Branch**: `milestone-5/instrument-assignment` (from M4)
- PlaybackEngine singleton (shared AudioContext, sample loading/caching/playback)
- 18-instrument manifest across 5 categories (kicks, snares, hihats, toms, percussion)
- Synthetic drum sample generation (18 WAV files, 448KB total in `public/samples/`)
- Smart defaults: weighted Euclidean distance to idealized profiles, greedy assignment
- InstrumentChips quick-pick UI + SampleBrowser modal
- Extended clusterStore with assignment state (assign, skip, defaults, hasAnyAssignment)
- Refactored useClusterPlayback to delegate to PlaybackEngine
- 377 tests passing (35 test files, +63 new), 0 lint errors, production build succeeds (74KB app)
- Pattern: 6 parallel agents (Types/Manifest, SmartDefaults, PlaybackEngine, State, UI, SampleGen) + Test agent

### Milestone 6: Quantization Engine (2026-03-13)
- **Branch**: `milestone-6/quantization` (from M5)
- BPM detection via IOI histogram + Gaussian smoothing + ambiguity resolution (not median IOI)
- Grid quantization with 6 resolutions (1/4, 1/8, 1/8T, 1/16, 1/16T, 1/32), strength 0-100%, swing 0-100%
- `quantizationStore` Zustand slice with cross-store reads from clusterStore + recordingStore
- Timeline UI: QuantizationControls, TimelineCanvas (canvas 2D), TransportBar
- `useTimelineRenderer` hook (requestAnimationFrame canvas loop), `useQuantizedPlayback` hook (lookahead scheduler)
- `PlaybackEngine.playScheduled()` method for timed sample playback
- 438 tests passing (40 test files, +61 new), 0 lint errors, production build succeeds (86KB app)
- Benchmarks: detectBpm 0.13ms, quantizeHits 0.02ms for 500 items
- Pattern: 4 parallel agents (Phase 1) + sequential test agent
- Key learnings: import ordering convention, `Array<T>` vs `T[]`, `Float64Array` with `noUncheckedIndexedAccess`

### Milestone 7: Timeline Enhancement (2026-03-13)
- **Branch**: `milestone-7/timeline-enhancement` (from `milestone-6/quantization`)
- New `timelineStore` Zustand store: track controls (mute/solo/volume), zoom/scroll, undo/redo (50-depth)
- Extended `quantizationStore` with write-back actions: `setQuantizedHits`, `addHit`, `removeHit`, `updateHitTime`
- PlaybackEngine per-track gain chain: `source → velocityGain → trackGain → masterGain → destination`
- DOM-based TrackHeaders (accessible mute/solo buttons), TrackControls (per-track + master volume sliders)
- Canvas enhancements: zoom/scroll mapping, beat/bar ruler, mute visuals (30% opacity), viewport culling, drag preview
- Hit editing: drag-to-move (grid snap), double-click add, right-click delete — all with undo
- Keyboard shortcuts: Space, L, M, S, 1-9, Ctrl+Z/Y, +/-
- Seamless loop playback with pre-scheduling next iteration before boundary
- Responsive: 48px icon-only headers at <=640px, fixed bottom transport on mobile
- 495 tests passing (46 files, +57 new), 0 lint errors, production build succeeds (101KB app)
- Pattern: Single-session sequential implementation (types → stores → audio → hooks → UI → tests)

### Milestone 8: Session Management & WAV Export (2026-03-13)
- **Branch**: `milestone-8/session-export` (from `milestone-7/timeline-enhancement`)
- **Status**: Complete
- **Files created**: `src/types/session.ts`, `src/types/settings.ts`, `src/state/sessionStore.ts`, `src/state/settingsStore.ts`, `src/state/persistence/db.ts`, `src/state/persistence/serialization.ts`, `src/state/persistence/SessionManager.ts`, `src/audio/export/wavEncoder.ts`, `src/audio/export/renderMix.ts`, `src/audio/export/exportWav.ts`, `src/hooks/useAutoSave.ts`, `src/hooks/useExportWav.ts`, `src/components/app/SessionCard.tsx` + CSS, `src/components/timeline/ExportModal.tsx` + CSS, `src/components/session/SettingsScreen.module.css`
- **Files modified**: `HomeScreen.tsx` (session list, delete confirmation), `SettingsScreen.tsx` (full settings UI), `TransportBar.tsx` (+save/export buttons), `TimelineScreen.tsx` (+auto-save, export modal), `Icon.tsx` (+5 icons), `useKeyboardShortcuts.ts` (+Ctrl+S, Ctrl+E), `RingBuffer.ts` (+`fromArray` static method), `setupTests.ts` (fake-indexeddb)
- **Tests**: 605 passing (59 files, +110 new), 0 lint errors, production build succeeds (127KB app + 143KB vendor)
- **Key features**: IndexedDB persistence (2 object stores), full session serialize/deserialize (all stores + audio blobs), auto-save (debounced 2s), session list/load/delete, WAV export (OfflineAudioContext + 16-bit PCM encoding + download), settings (theme/BPM/grid/sensitivity with localStorage), storage usage display
- **Key learnings**:
  - IndexedDB wrapping: Promise-based wrappers for IDBRequest/IDBTransaction clean up callback APIs
  - Audio blob strategy: Store raw audio + snippets as separate blobs keyed by `{sessionId}:{type}:{subId}` — avoids serializing ArrayBuffers in session JSON
  - Session restore order matters: reset all → recording → cluster (setClustering + assignments) → quantization → timeline
  - `RingBuffer.fromArray()` needed for session restore — can't reconstruct from constructor alone
  - OfflineAudioContext mirrors real-time gain chain exactly for faithful WAV export
  - Zustand `persist` middleware with `createJSONStorage(() => localStorage)` is clean for settings
  - `fake-indexeddb` provides full IDB implementation in jsdom tests — much better than mocking
- Pattern: Sequential implementation (types → persistence → stores → export → hooks → UI → tests)

---

### Milestone 9: Polish, PWA & Cross-Browser (2026-03-13)
- **Branch**: `milestone-9/polish-pwa` (from `milestone-8/session-export`)
- **Status**: Complete
- **New files created**:
  - PWA: `public/sw.js`, `public/manifest.json`, `public/icons/` (4 icons), `public/fonts/` (2 WOFF2), `src/utils/serviceWorkerRegistration.ts`, `src/hooks/useServiceWorker.ts`, `src/hooks/useInstallPrompt.ts`, `src/components/app/InstallBanner.tsx` + CSS, `src/components/app/UpdateToast.tsx` + CSS, `src/styles/fonts.css`
  - Onboarding: `src/components/onboarding/OnboardingOverlay.tsx` + CSS, `src/components/onboarding/OnboardingStep.tsx` + CSS
  - Cross-browser: `src/utils/featureDetection.ts`, `src/components/app/UnsupportedBrowser.tsx` + CSS
  - Accessibility: `src/hooks/useFocusTrap.ts`, `src/hooks/useContextualTip.ts`, `src/components/timeline/TimelineSRTable.tsx` + CSS, `src/components/shared/Tooltip.tsx` + CSS
  - UI Polish: `src/components/shared/Confetti.tsx` + CSS, `src/components/shared/ErrorState.tsx` + CSS, `src/components/shared/LoadingSpinner.tsx` + CSS, `src/components/shared/Skeleton.tsx` + CSS, `src/components/shared/Toast.tsx` + CSS
- **Files modified**: `index.html` (manifest link, apple meta, removed Google Fonts CDN), `vite.config.ts` (swManifestPlugin, manual chunks), `src/main.tsx` (+SW registration), `src/components/app/App.tsx` (lazy routes, Suspense, UnsupportedBrowser gate, UpdateToast), `src/components/app/AppShell.tsx` (+skip link), `src/components/app/HomeScreen.tsx` (+onboarding, install banner, stagger animations), `src/components/app/RecordButton.tsx` (+AudioContext warmUp), `src/audio/playback/PlaybackEngine.ts` (+warmUp, +actualSampleRate, +setupVisibilityHandler), `src/state/appStore.ts` (+installState, +swStatus), `src/state/settingsStore.ts` (+hasSeenOnboarding, +dismissedTips, +tip actions), `src/types/settings.ts` (+hasSeenOnboarding, +dismissedTips), `src/styles/animations.css` (+6 keyframes, +reduced-motion query), `src/styles/global.css` (+fonts import, +sr-only utility), `src/components/shared/Modal.tsx` (+focus trap, +aria-labelledby, +Escape key), `src/components/shared/Button.module.css` (+spring easing), `src/components/timeline/ExportModal.tsx` (+confetti, +animated checkmark), `src/components/timeline/TimelineCanvas.tsx` (+touch events, +keyboard nav, +ARIA, +SR table), `src/hooks/useTimelineEditing.ts` (+touch handlers), `src/components/session/SettingsScreen.tsx` (+tutorial replay, v0.9.0), `src/components/app/SessionCard.module.css` (+stagger animation), `src/components/app/HomeScreen.module.css` (+stagger animations)
- **Tests**: 605 passing (59 files), 0 lint errors, typecheck clean
- **Build**: Code-split output — 72KB index + 30KB Timeline + 24KB Recording + 13KB Cluster + 5KB Settings + 143KB vendor + 15KB CSS
- **Key features**: Service worker with precaching for offline-first, PWA installable with manifest + icons, lazy route loading, 4-step onboarding, feature detection + unsupported browser fallback, iOS Safari AudioContext warm-up + visibility handler, touch timeline editing, focus trap for modals, skip-to-content link, screen-reader timeline table, confetti export celebration, stagger entrance animations, `prefers-reduced-motion` support, self-hosted fonts
- **Key learnings**:
  - Custom Vite plugin can inject precache manifest into service worker at build time
  - `React.lazy()` + dynamic import `.then(m => ({ default: m.NamedExport }))` for named exports
  - iOS Safari requires AudioContext creation within synchronous user gesture handler
  - `visibilitychange` event needed to resume AudioContext after background tab
  - Focus trap: find all focusable elements, wrap Tab/Shift+Tab, restore previous focus on cleanup
  - Canvas needs `role="application"` + `aria-label` for screen readers, plus hidden HTML table for data
  - Self-hosting fonts (WOFF2 + font-display: swap) eliminates external CDN dependency for offline PWA
- Pattern: Sequential implementation (PWA → onboarding → cross-browser → accessibility → UI polish)

---

### Post-Launch: App-Wide Navigation (2026-03-13)
- **Branch**: `feature/app-navigation` (from `fix/qa-touchups`)
- **Status**: Implementation complete, pending visual QA
- **New files**: `src/components/navigation/BottomNav.tsx` + CSS, `src/components/navigation/RouteAnnouncer.tsx`
- **Modified files**: `Icon.tsx` (+3 icons: home, layers, music), `theme.css` (z-index scale + nav tokens), `AppShell.tsx` + CSS (nav integration + route-aware padding), `QuantizationControls.tsx` + CSS (home button for timeline escape), `TransportBar.module.css` (z-index token)
- **Key features**: Mobile bottom tab bar (56px + safe area), desktop side rail (64px icon-only), 4 tabs (Home/Record/Review/Timeline), tab bar hides on timeline mobile (transport bar conflict), home button in QuantizationControls for timeline escape, route announcer for a11y, glassmorphism nav background
- **Key decisions**:
  - Single responsive component (not separate mobile/desktop)
  - Settings excluded from tabs (low-frequency, stays as gear icon)
  - Tab bar hides on timeline rather than stacking two fixed bottom bars
  - Z-index scale formalized in theme tokens

## Next Up

| Priority | Item | Reference |
|----------|------|-----------|
| 1 | Visual QA for navigation | Chrome DevTools MCP at mobile + desktop breakpoints |

---

## Blockers

None.

---

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Web-first PWA | No app store gatekeeping, instant access via URL, single codebase |
| Client-only (no server) | Privacy (audio never leaves device), simplicity, offline-first |
| AudioWorklet for onset detection | Low-latency real-time processing on dedicated audio thread |
| K-means clustering | Well-understood algorithm, auto-k via silhouette scoring |
| Canvas 2D for timeline | 60fps rendering for smooth playback cursor and hit markers |
| Zustand for state | Lightweight, TypeScript-native, no provider wrappers |
| Pure-JS DSP (no WASM) | No native dependencies, simpler build, sufficient for v1 |
| CSS Modules | Component-scoped styles, avoids runtime CSS-in-JS overhead |
| Port 8087, no SSL | localhost doesn't need HTTPS; simplifies dev setup |
| New tap-processor.js (not extend capture-worklet) | SRP: different responsibilities (onset detection vs raw PCM) |
| Onset listeners in useAudioCapture (not separate hook) | Refs don't trigger re-renders; wire where instance created |
| Synchronous processing (not setTimeout batches) | React cleanup kills async chains in effects |
| RMS energy gate + flux threshold 0.5 | Dual gating rejects ambient noise (spectral flux alone insufficient) |
| Complementary normalization (Z-score + min-max) | Z-score for storage/comparison, min-max rescales to [0,1] for clustering distance |
| Clustering runs on main thread (not Worker) | <500ms for 200 hits, no complexity of Worker messaging |
| Silhouette < 0.25 falls back to k=1 | Low silhouette means no natural grouping; better UX to show 1 cluster |
| Max 12 clusters with auto-merge | UI grid practical limit; auto-merge closest centroids |
| Singleton PlaybackEngine | Avoids Chrome 6-context / iOS Safari 1-context AudioContext limits |
| Synthetic WAV samples (not CC0) | Quick to generate, distinguishable; real samples swap in-place later |
| Smart defaults via weighted distance | Best-effort heuristic; user always overrides; greedy prevents duplicates |
| Split/merge clears assignments | IDs remap to contiguous; simpler than tracking old→new mapping |
| IOI histogram BPM (not median IOI) | Histogram + Gaussian smoothing handles tempo ambiguity; median fails on swing/expressive timing |
| Separate quantizationStore (not extend clusterStore) | SRP: quantization is a distinct concern; cross-store reads via getState() |
| Canvas 2D for timeline rendering | rAF loop at 60fps; DOM too slow for real-time hit marker updates |
| playScheduled() method on PlaybackEngine | Lookahead scheduler needs precise timing; separate from immediate playSample() |
| Separate timelineStore (not extend quantizationStore) | SRP: UI interaction state (mute/solo/volume/zoom/undo) vs quantization parameters |
| DOM track headers (not canvas) | Accessibility requires real `<button>` elements for mute/solo; canvas can't do ARIA |
| Undo snapshots via structuredClone | Fast for flat QuantizedHit objects (0.1ms/500 hits); max 50 depth; write-back to quantizationStore on restore |
| Per-track gain chain (not per-hit) | Create nodes once on play start, adjust gain values in real-time; no teardown during playback |
| Write-back actions on quantizationStore | `setQuantizedHits`, `addHit`, `removeHit`, `updateHitTime` bypass recompute for manual edits |
