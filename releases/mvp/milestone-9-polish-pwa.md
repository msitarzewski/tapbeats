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
- [ ] Safari: OGG → MP3 sample fallback
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

## Implementation Notes from M1 and M2

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
