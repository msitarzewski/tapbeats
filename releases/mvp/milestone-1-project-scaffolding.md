# Milestone 1: Project Scaffolding & Infrastructure

**Target**: Week 1
**Status**: Not Started
**Dependencies**: None

---

## Objective

Set up the complete project foundation — build tooling, CI/CD pipeline, linting, testing infrastructure, and the basic app shell. After this milestone, any developer can clone, install, and start building features immediately.

## Deliverables

### 1.1 Project Initialization
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure `tsconfig.json` with strict mode
- [ ] Configure `vite.config.ts` with AudioWorklet support
- [ ] Set up path aliases (`@/components`, `@/audio`, `@/state`, etc.)

### 1.2 Directory Structure
- [ ] Create full directory structure per developer-experience spec:
  - `src/components/`, `src/audio/capture/`, `src/audio/analysis/`, `src/audio/clustering/`, `src/audio/quantization/`, `src/audio/playback/`
  - `src/state/`, `src/utils/`, `src/types/`, `src/hooks/`, `src/styles/`, `src/assets/`
  - `public/worklets/`
  - `tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/fixtures/`

### 1.3 Tooling Configuration
- [ ] ESLint config (`.eslintrc.cjs`) with React + TypeScript rules
- [ ] Prettier config (`.prettierrc`)
- [ ] Husky + lint-staged for pre-commit hooks
- [ ] EditorConfig for consistent formatting

### 1.4 Testing Infrastructure
- [ ] Vitest configuration (`vitest.config.ts`)
- [ ] Playwright configuration (`playwright.config.ts`)
- [ ] First passing smoke test (app renders)
- [ ] Test fixture directory with README

### 1.5 CI/CD Pipeline
- [ ] GitHub Actions workflow: lint + typecheck on PR
- [ ] GitHub Actions workflow: unit tests on PR
- [ ] GitHub Actions workflow: full suite on merge to main

### 1.6 App Shell & Design System Foundation
- [ ] Basic React app entry point
- [ ] Dark theme CSS custom properties (full token set from `ui-design.md` Appendix A):
  - Surface colors: `--surface-base: #0A0A0F`, `--surface-1: #12121A`, `--surface-2: #1A1A24`
  - Text colors: `--text-primary: #F0F0F5`, `--text-secondary: #8888A0`
  - Accent: `--accent-primary: #6C5CE7`
  - 8-color instrument palette (kick `#E74C3C` through shaker `#95A5A6`)
- [ ] Typography setup: Inter (UI) + JetBrains Mono (data), 1.25 modular scale
- [ ] Spacing system: 4px base (`--space-1` through `--space-16`)
- [ ] Elevation model (surface brightness, not shadows)
- [ ] Base component stubs: Button (3 variants × 3 sizes), Slider, Card, Modal
- [ ] Router setup (home, record, review, timeline, settings screens as empty shells)
- [ ] Responsive viewport meta tag and base layout with 5 breakpoints:
  - xs: 0–479px, sm: 480–767px, md: 768–1023px, lg: 1024–1439px, xl: 1440px+

### 1.7 Documentation
- [ ] README.md with project description, getting started, dev commands
- [ ] CONTRIBUTING.md outline
- [ ] LICENSE placeholder (TBD)

## Acceptance Criteria

- [ ] `npm install && npm run dev` launches the app successfully
- [ ] `npm test` runs and passes with at least 1 test
- [ ] `npm run build` produces a production build with no errors
- [ ] `npm run lint` passes with no errors
- [ ] CI pipeline runs on GitHub Actions
- [ ] App renders a basic dark-themed shell in Chrome, Firefox, Safari

## Relevant PRD References

- `developer-experience.md` — Project structure, config files, coding standards
- `testing-strategy.md` — CI/CD pipeline, Vitest/Playwright setup
- `product-requirements.md` — NFR-031 through NFR-038 (code quality)
- `ui-design.md` — Section 2 (Visual Design System), Appendix A (CSS custom properties)
