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

## Implementation Notes from M1

### Infrastructure Already in Place
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
