# Architectural Decision Records

## Index

1. [Web-first over native](#2026-03-12-web-first-over-native)
2. [Client-only, no server](#2026-03-12-client-only-no-server)
3. [AudioWorklet over ScriptProcessorNode](#2026-03-12-audioworklet-over-scriptprocessornode)
4. [K-means for clustering](#2026-03-12-k-means-for-clustering)
5. [Canvas over DOM for timeline](#2026-03-12-canvas-over-dom-for-timeline)
6. [Zustand over Redux/Context](#2026-03-12-zustand-over-reduxcontext)
7. [Pure JS DSP over WASM](#2026-03-12-pure-js-dsp-over-wasm)
8. ["Fix it in post" UX model](#2026-03-12-fix-it-in-post-ux-model)
9. [IndexedDB for persistence](#2026-03-12-indexeddb-for-persistence)
10. [OGG primary, MP3 fallback](#2026-03-12-ogg-primary-mp3-fallback)
11. [No SSL for local development](#2026-03-12-no-ssl-for-local-development)
12. [Appendix A as canonical design tokens](#2026-03-12-appendix-a-as-canonical-design-tokens)
13. [Separate tsconfig for tests](#2026-03-12-separate-tsconfig-for-tests)
14. [New tap-processor.js worklet](#2026-03-12-new-tap-processorjs-worklet-not-extend-capture-workletjs)
15. [Onset listeners in useAudioCapture](#2026-03-12-onset-listeners-wired-in-useaudiocapture-not-separate-hook)
16. [Synchronous feature processing](#2026-03-12-synchronous-feature-processing-not-settimeout-batches)
17. [RMS energy gate for onset detection](#2026-03-12-rms-energy-gate-for-onset-detection)
18. [Complete status navigates home](#2026-03-12-complete-status-navigates-home)

---

### 2026-03-12: Web-first over native
**Status**: Approved
**Context**: TapBeats needs to run on desktop and mobile with minimal friction. Native apps require app store review, separate codebases per platform, and installation barriers.
**Decision**: Build as a Progressive Web App targeting Chrome, Firefox, Safari (desktop and mobile). Single codebase, instant access via URL, offline support after first load via service worker. PWA installable on all platforms.
**Alternatives**: Native iOS/Android apps (rejected: separate codebases, app store gatekeeping, longer development cycle); Electron desktop wrapper (rejected: unnecessary overhead for a web-native app); React Native (rejected: Web Audio API not available, would need native audio bridges).
**Consequences**: (+) Zero-install access, single codebase, cross-platform from day one. (-) Subject to browser API limitations, audio latency higher than native, no access to low-level audio APIs.

### 2026-03-12: Client-only, no server
**Status**: Approved
**Context**: Audio data is personal and potentially sensitive. Users should not need to trust a server with their recordings. The app needs to work offline.
**Decision**: All audio capture, onset detection, feature extraction, clustering, quantization, and playback run entirely in the browser. No server, no API, no backend for v1. Audio never leaves the device.
**Alternatives**: Server-side ML processing (rejected: adds latency, privacy concerns, hosting costs, offline impossible); Hybrid with optional cloud sync (rejected: complexity for v1, not needed for core functionality).
**Consequences**: (+) Complete privacy, zero hosting cost, full offline support, no auth/accounts needed. (-) Limited to device compute power, no collaboration features, no cross-device sync.

### 2026-03-12: AudioWorklet over ScriptProcessorNode
**Status**: Approved
**Context**: Real-time onset detection requires processing audio on every frame without blocking the main thread. ScriptProcessorNode runs on the main thread and is deprecated.
**Decision**: Use AudioWorklet for real-time PCM capture, ring buffer maintenance, and onset detection. The worklet runs on a dedicated audio rendering thread with 128-sample render quanta. Communication with main thread via MessagePort with Transferable ArrayBuffers for zero-copy transfer.
**Alternatives**: ScriptProcessorNode (rejected: deprecated, runs on main thread causing jank, higher latency); OfflineAudioContext (rejected: not real-time, only for post-processing); Web Workers with manual audio routing (rejected: no direct AudioNode integration).
**Consequences**: (+) Low-latency onset detection (<30ms), main thread stays free for UI, audio-thread-native processing. (-) Worklet files must be served as separate JS (no bundling), strict coding constraints (no allocations in process()), requires Chrome 66+/Firefox 76+/Safari 14.1+.

### 2026-03-12: K-means for clustering
**Status**: Approved
**Context**: Detected tap sounds need to be grouped by timbral similarity so users can assign instruments to groups. Tap sounds on the same surface form tight, spherical clusters in feature space. Users typically produce 2-5 distinct sound types.
**Decision**: K-means with k-means++ initialization, automatic k selection via silhouette scoring (testing k=2 through min(8, floor(n/3))), and 5 restarts per k value. Euclidean distance on z-score normalized 20-dimensional feature vectors.
**Alternatives**: DBSCAN (rejected: sensitive to epsilon/minPoints tuning, struggles with varying density clusters, hard to auto-tune for non-expert users); Hierarchical agglomerative (rejected: O(n^2 log n), slow for interactive use, dendrogram cutting still requires a threshold); Gaussian Mixture Models (rejected: slower convergence, can overfit with few data points, overkill for spherical clusters).
**Consequences**: (+) Fast O(nkd), sub-500ms for 200 hits, deterministic with seeding, well-suited to spherical tap-sound clusters. (-) Assumes similarly-sized spherical clusters, requires specifying k range (mitigated by auto-selection).

### 2026-03-12: Canvas over DOM for timeline
**Status**: Approved
**Context**: The beat timeline must render 500+ hit markers with a real-time playback cursor at 60fps. Users drag, select, and scrub the timeline interactively.
**Decision**: HTML5 Canvas 2D for all timeline rendering including grid lines, hit markers, playback cursor, waveform overview, and selection highlights. Estimated per-frame cost ~8ms with 52% headroom.
**Alternatives**: DOM elements per hit marker (rejected: 500+ DOM nodes with per-frame updates would far exceed 16ms budget, layout thrashing); SVG (rejected: same DOM overhead, poor performance with hundreds of animated elements); WebGL (rejected: overkill for 2D grid rendering, higher complexity, marginal benefit).
**Consequences**: (+) Consistent 60fps, efficient batch rendering, precise control over drawing. (-) No native accessibility for canvas content (requires ARIA overlay), manual hit-testing for click/drag, no CSS styling for canvas-drawn elements.

### 2026-03-12: Zustand over Redux/Context
**Status**: Approved
**Context**: The app needs reactive state management that handles high-frequency audio state updates (playback position, onset events) without causing unnecessary React re-renders.
**Decision**: Zustand 4+ with separate store slices per domain (app, recording, cluster, timeline, session). subscribeWithSelector middleware for fine-grained subscriptions. Persistence middleware for IndexedDB. ~1KB gzipped.
**Alternatives**: Redux Toolkit (rejected: heavier (~11KB), requires provider wrappers, action type boilerplate, dispatch overhead for high-frequency audio updates); React Context + useReducer (rejected: causes re-renders in all consumers on any state change, no built-in selector support, poor for audio-frequency updates); Jotai/Recoil (rejected: atom-based model adds indirection for related state, less mature persistence story).
**Consequences**: (+) Minimal API, no providers, TypeScript-native, selectors prevent re-render storms, middleware for persistence and DevTools. (-) Less structured than Redux (mitigated by slice pattern convention), smaller ecosystem.

### 2026-03-12: Pure JS DSP over WASM
**Status**: Approved
**Context**: The app needs FFT, MFCC computation, spectral analysis, and onset detection. These could be implemented in Rust/C++ compiled to WASM for performance, or in pure TypeScript.
**Decision**: Implement all DSP algorithms in pure TypeScript for v1. Radix-2 Cooley-Tukey FFT, spectral flux onset detection, MFCC via mel filterbank, k-means clustering -- all from scratch. Core algorithms total under 15KB minified.
**Alternatives**: WASM (Rust/C++) for DSP (rejected for v1: adds build complexity, native toolchain dependency, harder to debug, marginal benefit since JS is fast enough for our data sizes); Third-party audio libraries like Meyda/Essentia.js (rejected: 50-200KB+ bundle size, impose their own abstractions and allocation patterns incompatible with real-time constraints, reduce educational value).
**Consequences**: (+) Zero native dependencies, simple build pipeline, full control over allocation patterns, educational reference value, tiny bundle. (-) Potentially slower than WASM for very large datasets (acceptable: typical session is <500 hits). WASM remains a future optimization path.

### 2026-03-12: "Fix it in post" UX model
**Status**: Approved
**Context**: Every existing beat-making tool forces instrument selection before playing a note, creating cognitive overhead during creative performance. Users lose rhythm ideas while navigating instrument menus.
**Decision**: Invert the traditional workflow. Users perform their full rhythm freely by tapping on any surface. The app captures, detects, and clusters sounds automatically. Only after recording does the user assign instruments to clusters. Manual editing (move, add, delete hits; split/merge clusters) is available after the fact.
**Alternatives**: Traditional instrument-first model (rejected: defeats the core product thesis, interrupts creative flow); Real-time instrument assignment during recording (rejected: requires pre-clustering which is impossible without enough data, adds latency and complexity to recording phase).
**Consequences**: (+) Uninterrupted creative flow, natural performance capture, post-hoc corrections for mistakes. (-) Users must wait for analysis after recording (~2s), requires good auto-clustering to feel magical, learning curve for users expecting traditional beat-maker workflow.

### 2026-03-12: IndexedDB for persistence
**Status**: Approved
**Context**: Sessions include audio snippet buffers (Float32Array, ~37KB per hit), metadata, cluster assignments, and optionally full raw recordings. localStorage is limited to ~5MB of string data. The app must work offline.
**Decision**: IndexedDB via `idb-keyval` (~600B) for all persistent storage. Audio snippets stored as raw Float32Array blobs. Session metadata as structured objects. LRU eviction for sample cache at 50MB. Warn users at >100MB across all sessions.
**Alternatives**: localStorage (rejected: 5MB limit, strings only, no binary data support); File System Access API (rejected: limited browser support, requires user interaction for each access); Cloud storage (rejected: violates client-only architecture decision).
**Consequences**: (+) Large binary data support, structured queries, offline-native, no size limit beyond browser quota (~50-100GB typically). (-) Async API only, more complex than localStorage, IndexedDB API is notoriously clunky (mitigated by idb-keyval wrapper).

### 2026-03-12: OGG primary, MP3 fallback
**Status**: Approved
**Context**: Built-in instrument samples need a delivery format. Samples are short percussion sounds (WAV source, 16-bit, 44.1kHz mono). Need to balance file size, quality, and browser compatibility.
**Decision**: Ship samples in dual format: OGG Vorbis as primary (smaller files, open format, supported by Chrome/Firefox/Edge) with MP3 fallback for Safari (which does not support OGG). Runtime detection via `audio.canPlayType('audio/ogg; codecs=vorbis')`. Samples are lazy-loaded on demand, total budget <2MB across all categories.
**Alternatives**: WAV only (rejected: 10x larger files, defeats lazy-loading benefit); MP3 only (rejected: slightly larger than OGG at equivalent quality, licensing historically murky though now patent-free); Opus (rejected: not supported in Safari, would still need MP3 fallback); AAC (rejected: licensing complexity, OGG is open and free).
**Consequences**: (+) Small file sizes, open format where possible, universal browser coverage with fallback. (-) Must maintain two versions of every sample, slightly more complex build pipeline, runtime format detection needed.

### 2026-03-12: No SSL for local development
**Status**: Approved
**Context**: The original spec called for `@vitejs/plugin-basic-ssl` to enable HTTPS locally, since `getUserMedia` requires a secure context. However, all major browsers treat `localhost` as a secure context without HTTPS.
**Decision**: Remove `@vitejs/plugin-basic-ssl`. Dev server runs plain HTTP on port 8087. Production deployment must use HTTPS.
**Alternatives**: Keep self-signed SSL (rejected: causes browser certificate warnings, complicates Playwright testing, unnecessary since localhost is treated as secure).
**Consequences**: (+) Simpler dev setup, no certificate warnings, cleaner Playwright config. (-) Must remember HTTPS is required in production for `getUserMedia` and service workers.
**References**: `releases/mvp/milestone-1-project-scaffolding.md`

### 2026-03-12: Appendix A as canonical design tokens
**Status**: Approved
**Context**: The milestone-1 spec listed older CSS token names (`--surface-base: #0A0A0F`, `--accent-primary: #6C5CE7`). The `ui-design.md` Appendix A uses different, final names (`--bg-primary: #121214`, `--accent-primary: #FF6B3D`).
**Decision**: `ui-design.md` Appendix A is the single source of truth for CSS custom property names and values. All 40+ tokens are implemented in `src/styles/theme.css` using Appendix A naming.
**Alternatives**: Use milestone-1 spec names (rejected: Appendix A is newer, more complete, and explicitly labeled as "Complete Reference").
**Consequences**: (+) Single canonical source, consistent naming across all milestones. (-) Milestone-1 spec section 1.6 is now inaccurate (documented in M1 implementation notes).
**References**: `src/styles/theme.css`, `docs/sections/ui-design.md` lines 1503-1591

### 2026-03-12: New tap-processor.js worklet (not extend capture-worklet.js)
**Status**: Approved
**Context**: M3 onset detection needs FFT, spectral flux, adaptive threshold, and snippet extraction in the AudioWorklet. The existing capture-worklet.js has a single responsibility: buffer raw PCM and post to main thread.
**Decision**: Create a new `tap-processor.js` worklet with all onset detection logic. AudioCapture.ts loads tap-processor instead of capture-worklet during recording. tap-processor posts both `buffer` events (for waveform, same as before) and `onset` events (new).
**Alternatives**: Extend capture-worklet.js with onset detection (rejected: violates SRP, capture-worklet has fundamentally different responsibilities, would create a monolithic worklet).
**Consequences**: (+) Clean separation of concerns, capture-worklet untouched for future raw-PCM use. (-) AudioCapture tests needed updating to expect tap-processor.js instead of capture-worklet.js.
**References**: `public/worklets/tap-processor.js`, `src/audio/capture/AudioCapture.ts:117`

### 2026-03-12: Onset listeners wired in useAudioCapture (not separate hook)
**Status**: Approved
**Context**: Initial implementation passed `captureRef.current` to a `useOnsetDetection` hook. But React refs don't trigger re-renders, so the hook always received `null` — onset events were silently never captured.
**Decision**: Wire onset event listener directly in `useAudioCapture.startRecording()`, alongside existing buffer/error/stateChange listeners. This matches the established pattern and ensures the listener is connected when the capture instance is created.
**Alternatives**: Use state instead of ref for capture instance (rejected: would cause re-renders on every capture creation); Pass ref object to hook (possible but adds complexity for no benefit).
**Consequences**: (+) Onset events reliably captured, matches existing listener pattern. (-) `useOnsetDetection.ts` hook exists but is unused (can be removed).
**References**: `src/hooks/useAudioCapture.ts:88-90`

### 2026-03-12: Synchronous feature processing (not setTimeout batches)
**Status**: Approved
**Context**: `useProcessing` used `setTimeout(() => processBatch(next), 0)` to yield between batches. React's effect cleanup ran between setTimeout calls (especially in StrictMode), setting `cancelled = true` and preventing `setStatus('complete')` from ever being reached.
**Decision**: Process all onsets synchronously within the useEffect, wrapped in try/catch. `setStatus('complete')` always fires regardless of errors.
**Alternatives**: Web Worker for processing (overkill for <500 hits); requestIdleCallback (same cleanup issue); batched with refs instead of effect deps (more complex).
**Consequences**: (+) Reliable completion, simple code, fast enough for typical sessions. (-) Blocks main thread during processing (~5ms per hit × 500 max = ~2.5s worst case). Acceptable since processing overlay is shown.
**References**: `src/hooks/useProcessing.ts`

### 2026-03-12: Separate tsconfig for tests
**Status**: Approved
**Context**: Main `tsconfig.json` excludes `tests/` to keep production builds clean. But ESLint with `@typescript-eslint/parser` requires a tsconfig that includes the files being linted. Test files were failing ESLint parsing.
**Decision**: Create `tsconfig.test.json` extending `tsconfig.json` with `include: ["src/**", "tests/**"]` and `exclude: ["node_modules", "dist"]`. ESLint `.eslintrc.cjs` has an override for `tests/**` pointing `parserOptions.project` to `tsconfig.test.json`. Test tsconfig also relaxes `noUnusedLocals` and `noUnusedParameters`.
**Alternatives**: Include tests in main tsconfig (rejected: would affect production build, risks including test code in bundle); ignore ESLint for test files (rejected: loses type-checked linting).
**Consequences**: (+) Full type-checked linting for test files, clean production tsconfig. (-) One more config file to maintain.
**References**: `tsconfig.test.json`, `.eslintrc.cjs` override at line 50

### 2026-03-12: RMS energy gate for onset detection
**Status**: Approved
**Context**: Spectral flux threshold alone (even at 0.5) is insufficient to reject ambient microphone noise. Mic noise produces spectral flux values of 0.3-0.7 regularly, causing ~10 false onsets per second with no actual tapping. The flux is high because ambient noise has varying spectral content between frames.
**Decision**: Add a third onset gating condition: RMS energy of the current frame must exceed `0.01`. This creates a dual-gating system: (1) spectral flux > adaptive threshold AND flux > 0.5 (absolute floor), AND (2) RMS energy > 0.01 (amplitude gate). Quiet ambient noise has very low RMS even when spectral flux spikes.
**Alternatives**: Raise flux threshold higher (rejected: would miss legitimate quiet taps); Apply noise gate to mic input (rejected: modifies raw signal, complicates DSP); Use peak amplitude instead of RMS (rejected: RMS is more robust to single-sample outliers).
**Consequences**: (+) False onsets reduced from ~135/16s to ~1/16s in ambient noise. Percussive taps have high RMS and easily pass the gate. (-) Very quiet taps may be missed if below 0.01 RMS (acceptable: such taps would be too quiet to produce useful audio snippets anyway). Additional ~0.05ms compute per hop for RMS calculation.
**References**: `public/worklets/tap-processor.js:247-253`

### 2026-03-12: Complete status navigates home
**Status**: Approved
**Context**: After recording stop, `useProcessing` sets status to `'complete'`. RecordingScreen had no handler for `'complete'` — it fell through to the default recording view, making stop appear broken. M3 has no review/clustering screen yet.
**Decision**: Add `useEffect` in RecordingScreen that navigates to `/` (home) when status becomes `'complete'`. Uses existing `useNavigate` from react-router-dom, matching the pattern in RecordingHeader and PermissionDenied.
**Alternatives**: Reset status to 'idle' (rejected: loses the state transition, harder to debug); Show a completion screen in RecordingScreen (rejected: M3 has no results to show yet, premature); Navigate to '/review' (rejected: /review screen not implemented until M4).
**Consequences**: (+) Stop button works as expected, user returns to home after recording. (-) M4+ will need to change this to navigate to `/review` instead of `/`.
**References**: `src/components/recording/RecordingScreen.tsx:27-31`
