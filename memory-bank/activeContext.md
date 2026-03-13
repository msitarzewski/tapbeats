# TapBeats Active Context

## Current State

**Phase**: Milestone 9 complete — Polish, PWA & Cross-Browser hardening.
**Sprint**: Implementation — PWA, onboarding, accessibility, animations, cross-browser, code splitting
**Branch**: `milestone-9/polish-pwa` (from `milestone-8/session-export`)
**Last Updated**: 2026-03-13

---

## Active Work

- Milestones 1–8: **COMPLETE** (see `progress.md` for details)
- Milestone 9: Polish, PWA & Cross-Browser — **COMPLETE** (on `milestone-9/polish-pwa`)
  - **PWA**: Service worker (`public/sw.js`) with precache + cache-first strategy, web app manifest, app icons (192/512 + maskable), install banner + `beforeinstallprompt` handling, update toast with skip-waiting, self-hosted WOFF2 fonts (Inter + JetBrains Mono, removed Google Fonts CDN)
  - **Onboarding**: 4-step overlay (welcome → recording → review → export), persisted `hasSeenOnboarding` in settingsStore, replay from Settings
  - **Cross-browser**: Feature detection (`featureDetection.ts` — AudioContext, AudioWorklet, mediaDevices, IndexedDB, SW), `UnsupportedBrowser` full-page fallback, iOS Safari AudioContext `warmUp()` on user gesture, `PlaybackEngine.setupVisibilityHandler()` for background tab suspension, touch events for timeline editing (drag-to-move hits on mobile)
  - **Accessibility**: Focus trap hook for modals, skip-to-content link in AppShell, `aria-labelledby` on Modal with `useId()`, canvas `role="application"` + `aria-label` + keyboard arrow navigation, `TimelineSRTable` (hidden screen-reader table of timeline data), Tooltip component with `role="tooltip"`, LoadingSpinner with `role="status"`, ErrorState with `role="alert"`, Toast with `aria-live="polite"`
  - **Performance**: Lazy-loaded routes via `React.lazy()` + `Suspense` (Recording, Cluster, Timeline, Settings), Vite manual chunks (vendor separation), SW precaching for offline-first
  - **UI Polish**: Stagger slide-up entrance animations (HomeScreen title/subtitle/actions/cards), button spring feedback (scale 0.97 active + spring easing), export celebration (confetti canvas + animated SVG checkmark), `prefers-reduced-motion` media query disables all animations globally, skeleton loader component, new animation keyframes (counterBump, staggerSlideUp, confettiFall, checkDraw, dotBounce, spinIn)
  - **Stores**: `appStore` +`installState` + `swStatus`, `settingsStore` +`hasSeenOnboarding` + `dismissedTips[]` + tip management actions
  - **Build**: Vite `swManifestPlugin` injects precache manifest into `sw.js` at build time, code-split output (72KB index + 30KB Timeline + 24KB Recording + 13KB Cluster + 5KB Settings + 143KB vendor + 15KB CSS)
  - **Tests**: 605 passing (59 files), 0 lint errors, typecheck clean, build succeeds

---

## Key Implementation Details (M9)

### PWA Architecture
```
main.tsx → registerServiceWorker() (production only)
  → public/sw.js: precache __PRECACHE_MANIFEST__ (injected by Vite plugin)
  → Cache-first for precached assets, network fallback for navigation
  → Skip-waiting message for immediate update activation
  → Page reload on controllerchange

useServiceWorker hook → tracks SWStatus ('pending'|'registered'|'update-available'|'error')
  → UpdateToast shows "New version available" with reload button

useInstallPrompt hook → intercepts beforeinstallprompt event
  → InstallBanner shows install prompt with accept/dismiss
  → Detects already-installed via display-mode: standalone
```

### Code Splitting
```
App.tsx:
  HomeScreen — eager (in main chunk)
  RecordingScreen — lazy (separate chunk, ~24KB)
  ClusterScreen — lazy (separate chunk, ~13KB)
  TimelineScreen — lazy (separate chunk, ~30KB)
  SettingsScreen — lazy (separate chunk, ~5KB)
  Suspense fallback: LoadingSpinner
```

### iOS Safari Handling
```
PlaybackEngine.warmUp() — called in RecordButton click handler (user gesture)
  → Creates/resumes AudioContext within gesture (iOS requirement)
  → Locks to 44100Hz sample rate

PlaybackEngine.setupVisibilityHandler()
  → visibilitychange listener resumes AudioContext on foreground return

Touch events in useTimelineEditing:
  → handleTouchStart/Move/End mirror mouse handlers
  → Grid snap + undo for touch-based hit dragging
```

### Store Architecture (7 stores, extended)
| Store | Purpose |
|-------|---------|
| `appStore` | Navigation, permissions, **installState, swStatus** |
| `recordingStore` | Recording lifecycle, onsets |
| `clusterStore` | Clusters, assignments, instruments |
| `quantizationStore` | BPM, grid, strength, quantizedHits + write-back actions |
| `timelineStore` | Track controls, zoom/scroll, undo/redo |
| `sessionStore` | Session list, current session ID/name, save status, storage info |
| `settingsStore` | Theme, BPM, grid, sensitivity, **hasSeenOnboarding, dismissedTips[]** |

---

## Next Actions

1. **Milestone 10: Launch** — Deployment, final QA, documentation, open source readiness
2. Deploy to static hosting (Vercel/Netlify/GitHub Pages) with HTTPS + CSP headers
3. Final QA: real-world testing across surfaces, environments, devices
4. Documentation: README with screenshots/GIFs, CHANGELOG, CODE_OF_CONDUCT, GitHub Issues templates
5. Launch assets: OG/Twitter meta tags, demo GIF, launch post drafts

---

## Context Notes

- Google Fonts CDN removed; self-hosted WOFF2 fonts in `public/fonts/` (Inter + JetBrains Mono latin subsets)
- Service worker only registered in production (`!import.meta.env.DEV`)
- `swManifestPlugin` collects all hashed assets + public resources (samples, worklets, fonts, icons) for precache
- Feature detection gates app entry — unsupported browsers see `UnsupportedBrowser` instead of broken app
- Focus trap hook used by Modal — traps Tab/Shift+Tab, restores focus on close
- TimelineSRTable provides semantic HTML table of timeline data for screen readers (hidden via sr-only)
- Confetti component respects `prefers-reduced-motion` via `useReducedMotion()` hook
- Version bumped to v0.9.0 in SettingsScreen
