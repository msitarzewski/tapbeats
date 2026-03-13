# Milestone 10: Launch Preparation & Release

**Target**: Week 12
**Status**: Planning Complete — Ready for Implementation
**Dependencies**: Milestone 9 (Polish & PWA) ✅
**Branch**: `milestone-10/launch` (from `milestone-9/polish-pwa`)

---

## Objective

Final QA, deployment setup, launch preparation, and public release. Ship TapBeats to the world.

## Implementation Plan (4 Phases)

### Phase 1: Infrastructure & Config (parallel agents)

#### Agent 1: DevOps — Deployment Config

**Hosting**: Self-hosted at `tapbeats.zerologic.com` on user's web server.
**Deployment**: `npm run build` → copy `dist/` contents to web server document root.

**Required web server configuration** (nginx example — adapt for Apache/Caddy):
```nginx
server {
    listen 443 ssl http2;
    server_name tapbeats.zerologic.com;

    root /path/to/tapbeats/dist;
    index index.html;

    # COOP/COEP — CRITICAL for SharedArrayBuffer (AudioWorklet)
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;

    # CSP
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; manifest-src 'self'; worker-src 'self'; connect-src 'self'" always;

    # Service Worker — must NOT be cached (browser needs to check for updates)
    location = /sw.js {
        add_header Cache-Control "no-cache" always;
        add_header Cross-Origin-Opener-Policy "same-origin" always;
        add_header Cross-Origin-Embedder-Policy "require-corp" always;
    }

    # Hashed assets — cache forever (Vite content-hashed filenames)
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        add_header Cross-Origin-Opener-Policy "same-origin" always;
        add_header Cross-Origin-Embedder-Policy "require-corp" always;
    }

    # SPA fallback — serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache equivalent** (`.htaccess` in document root):
```apache
# COOP/COEP headers
Header always set Cross-Origin-Opener-Policy "same-origin"
Header always set Cross-Origin-Embedder-Policy "require-corp"
Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; manifest-src 'self'; worker-src 'self'; connect-src 'self'"

# Service Worker — no cache
<Files "sw.js">
    Header set Cache-Control "no-cache"
</Files>

# Hashed assets — cache forever
<FilesMatch "^assets/">
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# SPA fallback
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**Key header requirements**:
- `font-src 'self'` and `manifest-src 'self'` in CSP (required for self-hosted fonts + PWA manifest)
- `/sw.js` with `Cache-Control: no-cache` (critical — browser must check for SW updates)
- `/assets/` with `immutable` cache (Vite hashed filenames)
- COOP/COEP must be on ALL responses (nginx `add_header` in location blocks doesn't inherit from parent — must repeat or use `always`)

Create `public/404.html` — simple page that redirects to `/` (web server `try_files` handles SPA routing, 404.html is a safety net).

#### Agent 2: Frontend — Meta Tags & Version Bump

**Open Graph meta tags** (add to `index.html` `<head>`):
```html
<meta property="og:type" content="website" />
<meta property="og:title" content="TapBeats — Tap anything. Make music." />
<meta property="og:description" content="Browser-based drum machine. Tap rhythms on any surface, auto-cluster sounds, map to drum samples, play back as beats. Free, open source, works offline." />
<meta property="og:url" content="https://tapbeats.zerologic.com" />
<meta property="og:image" content="https://tapbeats.zerologic.com/og-image.png" />
```

**Twitter Card meta tags** (add to `index.html` `<head>`):
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="TapBeats — Tap anything. Make music." />
<meta name="twitter:description" content="Browser-based drum machine. Tap rhythms on any surface, auto-cluster sounds, map to drum samples. Free, offline, open source." />
<meta name="twitter:image" content="https://tapbeats.zerologic.com/og-image.png" />
```

**Version bumps**:
- `package.json`: `"version": "0.1.0"` → `"version": "1.0.0"`
- `src/components/session/SettingsScreen.tsx:200`: `TapBeats v0.9.0` → `TapBeats v1.0.0`

**Console statement review**:
- `src/components/app/ErrorBoundary.tsx` — Keep (error boundary logging is appropriate)
- `src/audio/playback/PlaybackEngine.ts` — Gate behind `__DEV__` or remove

---

### Phase 2: Documentation (parallel agents)

#### Agent 3: Open Source Docs

**Create `CODE_OF_CONDUCT.md`**: Contributor Covenant v2.1 (industry standard)

**Create `CHANGELOG.md`**: v1.0.0 entry summarizing M1-M10:
- Audio capture pipeline (M2)
- Real-time onset detection with spectral flux + RMS gating (M3)
- K-means++ clustering with auto-K (M4)
- 18-instrument sample library with smart defaults (M5)
- BPM detection and grid quantization (M6)
- Timeline with track controls, hit editing, undo/redo (M7)
- Session persistence (IndexedDB) and WAV export (M8)
- PWA, accessibility, cross-browser, UI polish (M9)
- Deployment, documentation, launch (M10)

**Create `ATTRIBUTION.md`**: Document that all drum samples are synthetically generated by the project's `scripts/generate-samples.ts` script and are CC0/public domain.

**Replace `LICENSE`**: AGPL-3.0 (copyleft, copyright holder retains commercial licensing rights)

**Create `.github/ISSUE_TEMPLATE/bug_report.md`**: Structured template with browser, OS, steps to reproduce, expected vs actual behavior, screenshots

**Create `.github/ISSUE_TEMPLATE/feature_request.md`**: Template with problem description, proposed solution, alternatives considered

#### Agent 4: README Polish

- Update tech versions: TypeScript 5.7, Vite 6, React 18, Zustand 5
- Add CI badge (`![CI](https://github.com/msitarzewski/tapbeats/actions/workflows/ci.yml/badge.svg)`)
- Add license badge (`![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)`)
- Add "Screenshots" section (placeholder for actual screenshots)
- Update project structure to reflect M9 additions (PWA, onboarding, accessibility components)
- Verify Getting Started instructions are accurate

---

### Phase 3: Launch Content (already drafted)

Drafts created during planning session. Files to create in `releases/launch-content/`:
- `product-hunt.md` — Tagline, description, first comment
- `show-hn.md` — Technical deep-dive post
- `reddit-posts.md` — r/webdev, r/musicproduction, r/WeAreTheMusicMakers
- `twitter-thread.md` — 7-tweet thread
- `devto-outline.md` — Blog post outline

---

### Phase 4: QA with Chrome DevTools MCP

Final verification using Chrome DevTools MCP tools against `npm run preview` (production build served locally) and against the deployed Vercel URL.

#### 4.1 Production Build Verification
```
1. npm run build — verify clean output
2. npm run preview — start local preview server
3. mcp__chrome-devtools__navigate_page → http://localhost:4173
4. mcp__chrome-devtools__take_screenshot → verify app loads
```

#### 4.2 COOP/COEP Header Verification (on Vercel deploy)
```
1. mcp__chrome-devtools__navigate_page → https://tapbeats.zerologic.com (or Vercel preview URL)
2. mcp__chrome-devtools__list_network_requests → check response headers for COOP/COEP/CSP
3. mcp__chrome-devtools__get_network_request → verify exact header values on index.html
4. mcp__chrome-devtools__evaluate_script → `typeof SharedArrayBuffer !== 'undefined'` (must be true)
5. mcp__chrome-devtools__evaluate_script → `typeof AudioWorklet !== 'undefined'` (must be true)
```

#### 4.3 Service Worker Verification
```
1. mcp__chrome-devtools__evaluate_script → `navigator.serviceWorker.controller !== null`
2. mcp__chrome-devtools__list_network_requests → verify assets served from SW cache (status 200, from SW)
3. mcp__chrome-devtools__evaluate_script → `caches.keys().then(k => k)` → should include 'tapbeats-v1'
```

#### 4.4 Core E2E Flow (Record → Cluster → Assign → Timeline → Export)
```
1. mcp__chrome-devtools__take_screenshot → HomeScreen loads correctly
2. mcp__chrome-devtools__click → Record button
3. mcp__chrome-devtools__take_screenshot → Permission prompt / recording UI visible
4. (Manual: tap surface to generate onsets)
5. mcp__chrome-devtools__take_screenshot → Recording screen with waveform
6. mcp__chrome-devtools__click → Stop button
7. mcp__chrome-devtools__wait_for → Processing indicator
8. mcp__chrome-devtools__take_screenshot → Cluster review screen with cards
9. mcp__chrome-devtools__click → Continue / assign instruments
10. mcp__chrome-devtools__take_screenshot → Timeline screen with quantized hits
11. mcp__chrome-devtools__click → Play button
12. mcp__chrome-devtools__evaluate_script → check AudioContext state === 'running'
13. mcp__chrome-devtools__take_screenshot → Timeline with playback cursor
```

#### 4.5 PWA & Meta Tag Verification
```
1. mcp__chrome-devtools__evaluate_script → `document.querySelector('meta[property="og:title"]')?.content`
2. mcp__chrome-devtools__evaluate_script → `document.querySelector('meta[name="twitter:card"]')?.content`
3. mcp__chrome-devtools__evaluate_script → `document.querySelector('link[rel="manifest"]')?.href`
4. mcp__chrome-devtools__get_network_request → /manifest.json (verify 200, correct content)
```

#### 4.6 Performance Audit
```
1. mcp__chrome-devtools__lighthouse_audit → performance, accessibility, best-practices, seo, pwa
2. Targets: Performance > 90, Accessibility > 95, Best Practices > 90, SEO > 90, PWA passing
```

#### 4.7 Console Error Check
```
1. mcp__chrome-devtools__list_console_messages → verify no errors on load
2. Navigate through all screens, check for console errors at each step
3. mcp__chrome-devtools__get_console_message → inspect any warnings
```

#### 4.8 Responsive / Mobile Verification
```
1. mcp__chrome-devtools__emulate → iPhone 14 viewport
2. mcp__chrome-devtools__take_screenshot → HomeScreen mobile layout
3. mcp__chrome-devtools__navigate_page → /timeline
4. mcp__chrome-devtools__take_screenshot → Timeline mobile layout (48px icon headers)
5. mcp__chrome-devtools__emulate → iPad viewport
6. mcp__chrome-devtools__take_screenshot → Tablet layout
```

#### 4.9 Offline Verification
```
1. Load app fully (all assets cached by SW)
2. mcp__chrome-devtools__evaluate_script → `navigator.onLine` (should be true)
3. Disconnect network (or throttle to offline via DevTools)
4. mcp__chrome-devtools__navigate_page → reload
5. mcp__chrome-devtools__take_screenshot → verify app still renders
6. mcp__chrome-devtools__list_console_messages → verify no network errors
```

---

## Deliverable Checklist

### 10.1 Deployment Infrastructure
- [ ] Web server config created (nginx/Apache) with COOP/COEP + CSP + cache headers
- [ ] `public/404.html` created
- [ ] `npm run build` → copy `dist/` to `tapbeats.zerologic.com` document root
- [ ] HTTPS enforcement verified (required for getUserMedia + SW + PWA install)
- [ ] SharedArrayBuffer available on deployed URL (Chrome DevTools MCP verify)

### 10.2 Final QA Round (Chrome DevTools MCP)
- [ ] Production build clean (`npm run build`)
- [ ] COOP/COEP headers present on all responses
- [ ] CSP headers correct (including font-src, manifest-src)
- [ ] Service worker registered and caching assets
- [ ] Full E2E flow works (record → cluster → assign → timeline → play)
- [ ] OG + Twitter Card meta tags render correctly
- [ ] Lighthouse audit: Performance >90, A11y >95, PWA passing
- [ ] No console errors on any screen
- [ ] Mobile layout correct (iPhone, iPad viewports)
- [ ] Offline mode works after initial load

### 10.3 Documentation
- [ ] `README.md` — polished with correct versions, badges
- [ ] `CONTRIBUTING.md` — verified accurate (exists from M1)
- [ ] `CODE_OF_CONDUCT.md` — Contributor Covenant v2.1
- [ ] `LICENSE` — AGPL-3.0 (replace TBD placeholder)
- [ ] `CHANGELOG.md` — v1.0.0 entry covering M1-M10
- [ ] `ATTRIBUTION.md` — synthetic samples documentation
- [ ] `.github/ISSUE_TEMPLATE/bug_report.md`
- [ ] `.github/ISSUE_TEMPLATE/feature_request.md`

### 10.4 Open Source Readiness
- [x] Code audit — no hardcoded secrets (verified via grep, clean)
- [x] Dependency audit — all 465 licenses permissive (MIT 393, ISC 30, Apache-2.0 16, BSD 16)
- [x] 6 moderate vulns all dev-only (esbuild <=0.24.2), no production risk
- [ ] All samples documented as CC0/synthetic in ATTRIBUTION.md
- [x] Build reproducibility verified (`npm run build` clean)
- [x] CI/CD pipeline configured (`ci.yml` + `e2e.yml`)

### 10.5 Launch Assets
- [ ] Open Graph meta tags in `index.html`
- [ ] Twitter Card meta tags in `index.html`
- [ ] OG image (`public/og-image.png`, 1200x630)
- [ ] Demo GIF/video (record → cluster → assign → play)
- [ ] Screenshots for various screen sizes (via Chrome DevTools MCP)

### 10.6 Launch Distribution (drafts created)
- [ ] Product Hunt submission draft → `releases/launch-content/product-hunt.md`
- [ ] Show HN post draft → `releases/launch-content/show-hn.md`
- [ ] Reddit posts draft → `releases/launch-content/reddit-posts.md`
- [ ] Twitter/X thread draft → `releases/launch-content/twitter-thread.md`
- [ ] Dev.to blog outline → `releases/launch-content/devto-outline.md`

### 10.7 Version & Release
- [ ] `package.json` version → `1.0.0`
- [ ] `SettingsScreen.tsx` version → `v1.0.0`
- [ ] Console statements gated behind `__DEV__` in PlaybackEngine.ts
- [ ] Git tag `v1.0.0`

---

## Acceptance Criteria

- [ ] App deployed and accessible at `https://tapbeats.zerologic.com`
- [ ] HTTPS enabled, COOP/COEP/CSP headers verified via Chrome DevTools MCP
- [ ] SharedArrayBuffer available (AudioWorklet functions correctly)
- [ ] Full E2E flow works on deployed version (verified via Chrome DevTools MCP)
- [ ] README, CONTRIBUTING, CODE_OF_CONDUCT, LICENSE (AGPL-3.0) in repo
- [ ] All samples attributed in ATTRIBUTION.md
- [ ] Clean clone → `npm install` → `npm run build` → works
- [ ] Lighthouse: Performance >90, A11y >95, PWA passing
- [ ] Launch posts drafted and ready in `releases/launch-content/`
- [ ] No P0 bugs remaining
- [ ] Version 1.0.0 everywhere

---

## Hosting Decision: Self-Hosted at `tapbeats.zerologic.com`

### Why Self-Hosted
User's own web server — full control over headers, deployment, and configuration. No third-party hosting service needed.

### Deployment Process
1. `npm run build` — produces `dist/` with code-split, hashed assets
2. Copy `dist/` contents to web server document root for `tapbeats.zerologic.com`
3. Configure web server headers (nginx or Apache — configs above)
4. Verify HTTPS is active (required for getUserMedia + Service Worker + PWA install)
5. Verify COOP/COEP headers via Chrome DevTools MCP

### COOP/COEP Implications
- Third-party iframes will break unless they also send `Cross-Origin-Resource-Policy: cross-origin`
- External images/media from CDNs will be blocked unless those servers send CORP headers
- `window.open` and popup communication is restricted
- TapBeats is fully self-contained (all assets local), so none of these are issues

### Critical nginx Note
`add_header` in a child `location` block does **not** inherit from parent. Each location that needs COOP/COEP must set them explicitly (see config above). Use `always` to ensure headers are sent on all response codes (including 304).

---

## Relevant PRD References

- `brand-strategy.md` — Sections 6-7 (Go-to-market, Growth strategy)
- `testing-strategy.md` — Section 10 (Manual QA checklist)
- `developer-experience.md` — Section 6 (Development workflow)
- `product-requirements.md` — All NFRs verified

## Infrastructure Already in Place (cumulative through M9)

- **GitHub Actions CI/CD**: `ci.yml` (lint + typecheck + unit + build on PR), `e2e.yml` (Playwright 3-browser matrix on push to main)
- **PWA**: Service worker, manifest, icons, install banner, update toast, self-hosted fonts
- **Accessibility**: Skip link, focus trap, ARIA labels, SR table, reduced motion
- **Cross-browser**: Feature detection gate, iOS Safari handling, touch events
- **Testing**: 605 tests (59 files), lint clean, typecheck clean
- **Build**: Code-split — 72KB index + 30KB Timeline + 24KB Recording + 13KB Cluster + 5KB Settings + 143KB vendor + 15KB CSS (~98KB gzipped)

## Key TypeScript/Lint Rules (cumulative)
- `Array<T>` syntax forbidden by eslint `array-type` rule — must use `T[]`
- Import ordering: external → `@/` imports (value+type mixed) → relative imports. CSS modules before type-only imports.
- `Float64Array` indexed access returns `number | undefined` with `noUncheckedIndexedAccess` — use `?? 0`
- CSS module class concatenation: `[styles.a, condition ? styles.b : ''].filter(Boolean).join(' ')` — never template literals
- `no-non-null-assertion`: Use `if (x === undefined) return` guard after `.pop()` instead of `!`
- `no-confusing-void-expression`: Arrow functions calling void methods need `{ }` braces — auto-fixable
- `void promise.then(...)` pattern for fire-and-forget async in event handlers (satisfies `no-floating-promises`)
- `React.lazy()` with named exports: `.then(m => ({ default: m.NamedExport }))`
