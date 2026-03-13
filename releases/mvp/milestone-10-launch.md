# Milestone 10: Launch Preparation & Release

**Target**: Week 12
**Status**: Not Started
**Dependencies**: Milestone 9 (Polish & PWA)

---

## Objective

Final QA, deployment setup, launch preparation, and public release. Ship TapBeats to the world.

## Deliverables

### 10.1 Deployment Infrastructure
- [ ] Static hosting setup (Vercel, Netlify, or GitHub Pages)
- [ ] Custom domain configuration (if applicable)
- [ ] HTTPS enforcement (NFR-033)
- [ ] CSP headers configured on hosting platform
- [ ] Cache headers for static assets
- [ ] Service worker update strategy (skip waiting + notify user)

### 10.2 Final QA Round
- [ ] Complete end-to-end flow on all target browsers
- [ ] Complete end-to-end flow on all target mobile browsers
- [ ] Full manual QA checklist (testing-strategy.md Section 10)
- [ ] Real-world testing: various surfaces (wood, metal, plastic, skin)
- [ ] Real-world testing: various environments (quiet room, office, outdoor)
- [ ] Real-world testing: various devices (low-end phone, tablet, laptop, desktop)
- [ ] Bug triage — all P0 bugs fixed, P1 bugs documented

### 10.3 Documentation
- [ ] README.md — polished with screenshots/GIFs
- [ ] CONTRIBUTING.md — full contributing guide
- [ ] CODE_OF_CONDUCT.md
- [ ] LICENSE file (once license decided)
- [ ] CHANGELOG.md (v1.0.0 entry)
- [ ] GitHub repository settings (topics, description, social preview)
- [ ] GitHub Issues templates (bug report, feature request)

### 10.4 Open Source Readiness
- [ ] Code audit — no hardcoded secrets, no personal data
- [ ] Dependency audit — all licenses compatible
- [ ] All samples verified CC0/public domain with attribution file
- [ ] Build reproducibility verified (clean clone → build → works)
- [ ] CI/CD pipeline runs on public GitHub Actions

### 10.5 Launch Assets
- [ ] Landing page content (if separate from app)
- [ ] Demo GIF/video showing core flow (record → cluster → assign → play)
- [ ] Screenshots for various screen sizes
- [ ] Open Graph meta tags (title, description, image)
- [ ] Twitter Card meta tags

### 10.6 Launch Distribution
- [ ] Product Hunt submission draft
- [ ] Hacker News "Show HN" post draft
- [ ] Reddit posts: r/webdev, r/musicproduction, r/WeAreTheMusicMakers
- [ ] Twitter/X announcement thread draft
- [ ] Dev.to / blog post about the technical build

### 10.7 Post-Launch Monitoring
- [ ] Error monitoring setup (optional: Sentry with privacy-respecting config)
- [ ] GitHub Issues monitoring plan
- [ ] Community response plan
- [ ] Known issues list published
- [ ] v1.1 planning based on feedback

## Acceptance Criteria

- [ ] App deployed and accessible via public URL
- [ ] HTTPS enabled, CSP configured
- [ ] Full E2E flow works on deployed version
- [ ] README, CONTRIBUTING, CODE_OF_CONDUCT, LICENSE in repo
- [ ] All samples properly attributed
- [ ] Clean clone → npm install → npm run build → works
- [ ] Launch posts drafted and ready
- [ ] No P0 bugs remaining
- [ ] Team aligned on post-launch support plan

## Relevant PRD References

- `brand-strategy.md` — Sections 6-7 (Go-to-market, Growth strategy)
- `testing-strategy.md` — Section 10 (Manual QA checklist)
- `developer-experience.md` — Section 6 (Development workflow)
- `product-requirements.md` — All NFRs verified

## Implementation Notes from Previous Milestones

### Infrastructure from M9 (Polish, PWA & Cross-Browser)

#### PWA Infrastructure (ALREADY DONE — do not rebuild)
- **Service Worker** (`public/sw.js`): Precache strategy with versioned cache (`tapbeats-v1`). Cache-first for precached assets, network fallback for navigation. Skip-waiting + notify user already implemented.
- **Manifest** (`public/manifest.json`): name, short_name, description, icons (192/512 + maskable), display: standalone, theme_color, background_color.
- **App icons**: `public/icons/` — icon-192.png, icon-512.png, icon-maskable-192.png, icon-maskable-512.png.
- **Install banner**: `InstallBanner.tsx` + `useInstallPrompt.ts` — beforeinstallprompt handling already wired.
- **Update toast**: `UpdateToast.tsx` + `useServiceWorker.ts` — skip-waiting + reload already wired.
- **Fonts**: Self-hosted WOFF2 in `public/fonts/` (Inter + JetBrains Mono). Google Fonts CDN removed.
- **Vite plugin**: `swManifestPlugin` injects `__PRECACHE_MANIFEST__` into sw.js at build time. Collects `/assets/`, `/samples/`, `/worklets/`, `/fonts/`, `/icons/`.

#### 10.1 Deployment — What's Already Done vs What's Needed
| Item | Status | Notes |
|------|--------|-------|
| Service worker update strategy | ✅ Done in M9 | skip-waiting + notify user via UpdateToast |
| Cache headers for static assets | ✅ Done in M9 | SW precache handles caching; hosting platform should set `Cache-Control: max-age=31536000` for `/assets/` (hashed filenames) |
| Static hosting setup | ❌ Needed | Recommend Vercel (zero-config for Vite SPA) or Netlify |
| Custom domain | ❌ Optional | Configure after hosting chosen |
| HTTPS enforcement | ❌ Needed | Required for getUserMedia + SW + PWA install. All recommended hosts provide free HTTPS. |
| CSP headers | ❌ Needed | COOP/COEP headers in `vite.config.ts` are dev-server only. Must add to hosting config. |

#### Hosting Platform Configuration Required
For **Vercel** (`vercel.json`):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; worker-src 'self'; connect-src 'self'" }
      ]
    }
  ],
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
For **Netlify** (`netlify.toml`):
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; worker-src 'self'; connect-src 'self'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
**Critical**: COOP/COEP headers are required for `SharedArrayBuffer` (used by AudioWorklet ring buffers). Without them, audio capture may fail in production.

#### Cross-Browser — What M9 Already Handles
- Feature detection gates app entry (`isBrowserSupported()`) → `UnsupportedBrowser` fallback page
- iOS Safari: `PlaybackEngine.warmUp()` in user gesture, `setupVisibilityHandler()` for background tab
- Touch events for timeline editing on mobile
- `prefers-reduced-motion` respected globally
- Onboarding overlay for first-time users

#### Accessibility — What M9 Already Provides
- Skip-to-content link in AppShell
- Focus trap on all modals (useFocusTrap hook)
- Modal: role="dialog", aria-modal, aria-labelledby, Escape key
- Canvas: role="application", aria-label, keyboard arrow nav, hidden SR table
- Toast/alerts: role="status"/role="alert" with aria-live
- LoadingSpinner: role="status" with aria-label
- ErrorState: role="alert" with retry button

#### Build & Performance Summary (through M9)
- **Code-split build**: 72KB index + 30KB Timeline + 24KB Recording + 13KB Cluster + 5KB Settings + 143KB vendor + 15KB CSS
- **Gzipped total**: ~98KB (under 200KB budget)
- **Tests**: 605 (59 files), lint clean, typecheck clean
- **Version**: v0.9.0 (displayed in SettingsScreen)

### Real-World Testing Notes (cumulative from M7, M8, M9)

#### Session & Storage (M8)
- Test save/load roundtrip: verify all store state restored correctly (recording, cluster, quantization, timeline)
- Test delete session: verify IndexedDB cleanup (both sessions + audioBlobs stores)
- Test auto-save: verify debounced saves don't overwhelm IndexedDB
- Test WAV export: verify stereo output, correct BPM timing, muted tracks excluded
- Test storage quota handling: verify graceful behavior near quota limits
- Test settings persistence: verify localStorage survives page reload
- Test clear all: verify all sessions + blobs deleted, UI reset

#### Timeline & Playback (M7)
- Test mute/solo behavior with multiple tracks — verify solo overrides mute correctly
- Test zoom at extreme levels (50 pps to 2000 pps) — verify grid lines and hit markers scale correctly
- Test seamless loop with various BPMs and track configurations — verify <5ms gap
- Test undo/redo with many operations (push to 50 limit) — verify memory usage stays reasonable
- Test keyboard shortcuts don't fire in input fields (BPM, grid resolution pickers)
- Test responsive layout at 375px (iPhone SE) — track headers should collapse to 48px icons

#### PWA & Cross-Browser (M9)
- Test PWA install on iOS (Add to Home Screen), Android (install banner), Chrome desktop
- Test offline: disconnect network after first load, verify full app works
- Test service worker update: deploy new version, verify toast appears, reload works
- Test onboarding: first visit shows overlay, dismissal persists, replay from settings
- Test unsupported browser: visit in old browser (e.g., IE11), verify fallback page
- Test iOS Safari: AudioContext resumes after backgrounding/foregrounding
- Test touch timeline editing on mobile: drag hits, verify grid snap
- Test prefers-reduced-motion: enable in OS settings, verify no animations
- Test screen reader: navigate with VoiceOver/NVDA, verify timeline table readable

### Infrastructure Already in Place (cumulative)
- **GitHub Actions CI/CD**: `ci.yml` (lint + typecheck + unit + build on PR), `e2e.yml` (Playwright 3-browser matrix on push to main)
- **CONTRIBUTING.md**: Exists with dev commands, code style, PR process, testing requirements
- **LICENSE**: Exists as placeholder ("TBD — all rights reserved")
- **`.gitignore`**: Configured (node_modules, dist, coverage, test-results, env files, editor configs)
- **Build**: Produces clean code-split output to `dist/` — ready for static hosting
- **Tests**: 605 passing (59 files). Strong regression safety net.

### Open Source Readiness — What's Done vs Needed
| Item | Status | Notes |
|------|--------|-------|
| No hardcoded secrets | ✅ Verified M1 | ESLint `no-console` for accidental debug logging |
| Reproducible build | ✅ Works | `npm run build` produces clean dist/ |
| Samples CC0/public domain | ⚠️ Synthetic | Current samples are generated WAVs — technically CC0 since we generated them. Add ATTRIBUTION.md. |
| CI/CD on public GitHub Actions | ✅ Configured | `ci.yml` + `e2e.yml` |
| CONTRIBUTING.md | ✅ Exists | May need polish |
| LICENSE | ⚠️ Placeholder | "TBD — all rights reserved" — needs real license |
| CODE_OF_CONDUCT.md | ❌ Needed | Create using Contributor Covenant |
| CHANGELOG.md | ❌ Needed | Create with v1.0.0 entry |
| GitHub Issues templates | ❌ Needed | Create bug report + feature request |
| Dependency audit | ❌ Needed | Run `npm audit` + check licenses |

### Documentation Gaps to Fill
- README.md needs screenshots/GIFs of the app in action
- Version should bump from v0.9.0 → v1.0.0 in SettingsScreen
- Add Open Graph + Twitter Card meta tags to `index.html`
- Consider adding a simple `404.html` for hosting platforms

### Key TypeScript/Lint Rules (cumulative)
- `Array<T>` syntax forbidden by eslint `array-type` rule — must use `T[]`
- Import ordering: external → `@/` imports (value+type mixed) → relative imports. CSS modules before type-only imports.
- `Float64Array` indexed access returns `number | undefined` with `noUncheckedIndexedAccess` — use `?? 0`
- CSS module class concatenation: `[styles.a, condition ? styles.b : ''].filter(Boolean).join(' ')` — never template literals
- `no-non-null-assertion`: Use `if (x === undefined) return` guard after `.pop()` instead of `!`
- `no-confusing-void-expression`: Arrow functions calling void methods need `{ }` braces — auto-fixable
- `void promise.then(...)` pattern for fire-and-forget async in event handlers (satisfies `no-floating-promises`)
- `React.lazy()` with named exports: `.then(m => ({ default: m.NamedExport }))`

### Key React Patterns (cumulative)
- **Never pass `ref.current` to hooks as a reactive dependency.** Wire listeners where instance is created.
- **Never use `setTimeout` chains inside `useEffect`.** Process synchronously or use Web Workers.
- **Always handle all status values in conditional renders.** Missing handlers cause fall-through bugs.
- **`store.subscribe()` for high-frequency canvas rendering** outside React's render cycle.

### Key AudioWorklet Patterns (cumulative)
- Worklet files in `public/` may be cached — hard reload needed after changes.
- Dual onset gating: spectral flux > 0.5 AND RMS energy > 0.01.
- No arrow functions, template literals, console.log in worklet scope.
- Pre-allocate all buffers in constructor. Never allocate in `process()`.

### Testing Infrastructure
- `fake-indexeddb` for full IndexedDB implementation in jsdom tests
- `createMockAudioContext()` and `createMockMediaStream()` in `tests/helpers/audioMocks.ts`
- Canvas mock: `vi.spyOn(HTMLCanvasElement.prototype, 'getContext')`
- ResizeObserver mock in `setupTests.ts`
- Chrome DevTools MCP for runtime debugging
