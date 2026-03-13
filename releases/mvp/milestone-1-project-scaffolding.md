# Milestone 1: Project Scaffolding & Infrastructure

**Target**: Week 1
**Status**: Complete (2026-03-12)
**Branch**: `milestone-1/scaffolding` — commit `34680be`
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

## M1 Implementation Notes (Lessons Learned)

**Completed**: 2026-03-12 on branch `milestone-1/scaffolding`

### What Changed from Spec

1. **Port 8087, no SSL**: Dev server runs at `http://localhost:8087`. The `@vitejs/plugin-basic-ssl` was removed — localhost doesn't need HTTPS for development. `getUserMedia` works on localhost without SSL in all major browsers. Playwright config updated to match.
2. **CSS token names**: Milestone spec listed old token names (`--surface-base`, `--accent-primary: #6C5CE7`). Implementation uses **`ui-design.md` Appendix A** as canonical source (`--bg-primary: #121214`, `--accent-primary: #FF6B3D`). All future milestones should reference Appendix A tokens, not the M1 spec.
3. **Breakpoints**: Spec listed 5 breakpoints (xs/sm/md/lg/xl). Implementation uses Appendix A breakpoints: sm:380px, md:640px, lg:1024px, xl:1440px (4 breakpoints, mobile-first).
4. **Vite 6**: `server.https: true` causes a type error in Vite 6 — the basicSsl plugin was the intended mechanism, but we removed SSL entirely.

### TypeScript & Lint Gotchas (Apply to ALL Future Milestones)

| Issue | Fix |
|-------|-----|
| `verbatimModuleSyntax` is on | **Must** use `import type { Foo }` for type-only imports |
| ESLint `import/order` with `newlines-between: 'always'` | Blank line required between each import group (external, internal, parent, sibling, type) |
| CSS module imports are "sibling" group | Import CSS modules **before** `import type` lines (sibling < type in group order) |
| `@typescript-eslint/restrict-template-expressions` | Wrap numbers in `String()` inside template literals: `` `${String(num)}%` `` |
| Async mock functions trigger `require-await` | Use `return Promise.resolve()` instead of `async () => {}` in mocks |
| Test files excluded from `tsconfig.json` | `tsconfig.test.json` exists with `"exclude": ["node_modules", "dist"]` — ESLint override for `tests/**` points to it |
| `exactOptionalPropertyTypes` is on | Cannot assign `undefined` to optional props — omit the key instead |
| `noUncheckedIndexedAccess` is on | Array/object index access returns `T \| undefined` — must narrow before use |
| `strict-boolean-expressions` is on | Cannot use `if (str)` — must use `if (str !== undefined)` or `if (str !== '')` |

### Test Infrastructure Available

- `tests/helpers/setupTests.ts` — Global Web Audio mocks (AudioContext, MediaStream) auto-loaded by Vitest
- `tests/helpers/audioMocks.ts` — Factory functions `createMockAudioContext()` and `createMockMediaStream()` for per-test control
- Vitest runs with `jsdom` environment, `forks` pool, `verbose` reporter
- Coverage thresholds: 80% branches/functions/lines/statements
- Path alias `@/` works in test files via `tsconfig.test.json`

### Agent Execution Notes

- Frontend and DevOps agents ran in parallel successfully (no file conflicts)
- Agents needed explicit import ordering guidance — ESLint `import/order` rules are strict
- Pre-commit hook (Husky + lint-staged) catches remaining formatting issues on commit
- React Router v6 emits v7 future flag warnings — cosmetic only, ignore until upgrade
