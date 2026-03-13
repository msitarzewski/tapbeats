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

### Infrastructure from M2
- **88 tests established**: Strong test baseline. Each milestone adds tests; maintain green suite.
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

### Lessons from M4 (Clustering)

- **Build size tracking**: M4 added ~15KB to app bundle (48KB → 63KB). Monitor growth through remaining milestones.
- **Test count**: 314 tests as of M4. Target ~500+ by launch with good coverage across all milestones.
- **Real-world testing needed**: Clustering accuracy with actual taps on varied surfaces (wood, metal, skin) — synthetic test data doesn't capture real-world variance.

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

#### Build Size Tracking
- M6 added ~12KB to app bundle (74KB → 86KB). Total through M6: 86KB app + 143KB vendor = 229KB (gzipped ~75KB). Still well under 200KB gzipped budget.
- Test count: 438 as of M6. On track for 500+ by launch.

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
