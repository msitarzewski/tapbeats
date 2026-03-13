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

### Infrastructure from M8 (Session Management & WAV Export)

#### Session & Storage Infrastructure
- **SessionManager** (`src/state/persistence/SessionManager.ts`): Save/load/delete/rename sessions. Auto-save with 2s debounce via store subscriptions.
- **IndexedDB** (`src/state/persistence/db.ts`): Database `tapbeats` v1, two object stores: `sessions` + `audioBlobs`. Promise wrappers for IDB operations.
- **settingsStore** (`src/state/settingsStore.ts`): Zustand + `persist` middleware (localStorage). Theme, BPM, grid, sensitivity.
- **sessionStore**: Session list, current session, save status, storage quota.
- **WAV export**: OfflineAudioContext → wavEncoder (16-bit PCM RIFF) → browser download. Mirrors real-time gain chain.

#### Real-World Testing Notes (M8)
- Test save/load roundtrip: verify all store state restored correctly (recording, cluster, quantization, timeline)
- Test delete session: verify IndexedDB cleanup (both sessions + audioBlobs stores)
- Test auto-save: verify debounced saves don't overwhelm IndexedDB
- Test WAV export: verify stereo output, correct BPM timing, muted tracks excluded
- Test storage quota handling: verify graceful behavior near quota limits
- Test settings persistence: verify localStorage survives page reload
- Test clear all: verify all sessions + blobs deleted, UI reset

#### Build Size
- Through M8: 127KB app + 143KB vendor = 270KB (gzipped ~94KB). Under 200KB gzipped budget.
- Test count: 605 (59 files). Target ~650+ by launch.

### Infrastructure from M7 (Timeline Enhancement)

#### Real-World Testing Notes (M7)
- Test mute/solo behavior with multiple tracks — verify solo overrides mute correctly
- Test zoom at extreme levels (50 pps to 2000 pps) — verify grid lines and hit markers scale correctly
- Test seamless loop with various BPMs and track configurations — verify <5ms gap
- Test undo/redo with many operations (push to 50 limit) — verify memory usage stays reasonable
- Test keyboard shortcuts don't fire in input fields (BPM, grid resolution pickers)
- Test responsive layout at 375px (iPhone SE) — track headers should collapse to 48px icons

### Infrastructure from M2
- **88 tests established**: Strong test baseline. Each milestone adds tests; maintain green suite (605 as of M8).
- **Multi-agent execution pattern**: M2 used 4 parallel agents successfully. Orchestrator must fix lint/integration issues across agent outputs — budget time for this.
- **Permission/async flow lesson**: Always show informational UI before triggering browser APIs (getUserMedia, etc.). Don't auto-trigger on component mount.

### Infrastructure Already in Place (from M1)
- GitHub Actions CI/CD: `ci.yml` (lint + typecheck + unit + build on PR), `e2e.yml` (Playwright 3-browser matrix on push to main)
- `CONTRIBUTING.md` exists with dev commands, code style, PR process, testing requirements
- `LICENSE` exists as placeholder ("TBD — all rights reserved")
- `.gitignore` configured (node_modules, dist, coverage, test-results, env files, editor configs)
- Build produces clean output to `dist/` — ready for static hosting

### Deployment Notes
- Dev server: HTTP on port 8087 — **production must use HTTPS**
- COOP/COEP headers in `vite.config.ts` are dev-server only — must configure on hosting platform too
- Vite build target is ES2022 — verify hosting platform serves correct MIME types
- Vendor chunk splitting already configured (React/ReactDOM/Zustand separate from app code)
- IndexedDB data is local — service worker should NOT intercept IDB operations
- `public/samples/` WAV files must be cached by service worker for offline playback

### Open Source Readiness Baseline
- All samples must be CC0/public domain (Milestone 5)
- No hardcoded secrets in codebase (verified at M1)
- ESLint `no-console` rule prevents accidental debug logging (warnings only for `console.warn/error`)
- `npm run build` produces reproducible output

### Documentation Gaps to Fill
- README.md exists but needs screenshots/GIFs after UI is built
- No CODE_OF_CONDUCT.md yet — create during M10
- No CHANGELOG.md yet — create during M10
- No GitHub Issues templates yet — create during M10

### Key TypeScript/Lint Rules (cumulative)
- `Array<T>` syntax forbidden by eslint `array-type` rule — must use `T[]`
- Import ordering: external → `@/` imports (value+type mixed) → relative imports. CSS modules before type-only imports.
- `Float64Array` indexed access returns `number | undefined` with `noUncheckedIndexedAccess` — use `?? 0`
- CSS module class concatenation: `[styles.a, condition ? styles.b : ''].filter(Boolean).join(' ')` — never template literals
- `no-non-null-assertion`: Use `if (x === undefined) return` guard after `.pop()` instead of `!`
- `no-confusing-void-expression`: Arrow functions calling void methods need `{ }` braces — auto-fixable
- `void promise.then(...)` pattern for fire-and-forget async in event handlers (satisfies `no-floating-promises`)

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
