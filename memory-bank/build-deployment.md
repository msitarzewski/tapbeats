# Build & Deployment

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HTTPS + HMR (https://localhost:5173) |
| `npm run build` | Production build to `dist/` (runs typecheck first) |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | `tsc --noEmit` type checking |
| `npm run lint` | ESLint on all src + test files |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier on all files |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest single run (CI mode) |
| `npm run test:coverage` | Vitest with V8 coverage report |
| `npm run test:e2e` | Playwright headless, all browsers |
| `npm run test:e2e:ui` | Playwright interactive UI mode |

## Build Tool: Vite 5.x

**Config**: `vite.config.ts`

Key configuration points:
- **HTTPS dev server**: `@vitejs/plugin-basic-ssl` for self-signed cert (required for `getUserMedia`)
- **Path aliases**: `@/*` maps to `./src/*` (via `resolve.alias` + `tsconfig.json` paths)
- **AudioWorklet bundling**: Worklet files in `public/worklets/` are served as-is (not bundled). Worklets cannot be HMR'd -- changes require full page reload.
- **COOP/COEP headers**: `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` for SharedArrayBuffer support
- **Vendor chunk splitting**: `react`, `react-dom`, `zustand` in separate vendor chunk for long-term caching
- **`__DEV__` flag**: Strips DevTools middleware and debug logging in production via `define`
- **Build target**: ES2022, sourcemaps enabled

## CI/CD Pipeline: GitHub Actions

### Workflows
- **`ci.yml`**: Runs on every push/PR to main and develop
- **`e2e.yml`**: Playwright against production build on push to main

### PR Checks (every push)
1. **lint-typecheck** job: `npm run lint` + `npm run typecheck` (5 min timeout)
2. **unit-integration** job: Vitest with coverage, upload coverage artifact (10 min timeout)
3. **accessibility** job: Playwright axe-core tests on Chromium (10 min timeout)

### Main Branch (push to main)
4. **e2e** job: Playwright across Chromium, Firefox, WebKit matrix (30 min timeout, fail-fast: false)
5. **performance** job: Vitest benchmarks + Lighthouse CI (15 min timeout)

### Release Suite (tagged versions `v*`)
6. **release-tests** job: Full test suite + coverage + all Playwright browsers + audio benchmarks + BrowserStack cross-browser (45 min timeout)

All jobs use Node 20 with npm cache. Playwright browsers are cached.

## Pre-commit Hooks

**Husky 9.x** + **lint-staged 15.x**

`.husky/pre-commit` runs `npx lint-staged` which executes:
- `src/**/*.{ts,tsx}`: ESLint fix + Prettier write
- `tests/**/*.{ts,tsx}`: ESLint fix + Prettier write
- `src/**/*.css`: Prettier write

Typecheck also runs as part of the pre-commit hook. Do not bypass with `--no-verify`.

## Deployment Target

**Static hosting** -- any provider that serves static files: Vercel, Netlify, GitHub Pages.

Production build outputs to `dist/`:
- Tree-shaken application code (DevTools middleware, debug logging removed)
- AudioWorklet files copied from `public/worklets/` to `dist/worklets/`
- Instrument samples fingerprinted for cache-busting
- Vendor chunk split for long-term caching
- Source maps generated (do not deploy unless needed for error monitoring)

**Required headers for deployment**: COOP and COEP headers for SharedArrayBuffer support (same as dev server config).

## PWA Configuration

- **Service worker**: Registered in `src/main.tsx`
- **Manifest**: `public/manifest.json` -- app name, icons, theme color, standalone display
- **Offline caching strategy**: Cache app shell and audio worklet files. Instrument samples cached on first load. IndexedDB sessions available offline.

## Bundle Budget

| Category | Budget |
|----------|--------|
| Application code (`src/`) | < 80KB gzipped |
| Framework + runtime deps (React, Zustand, nanoid, idb-keyval) | < 50KB gzipped |
| Total JavaScript (excl. samples) | < 130KB gzipped |
| CSS | < 10KB gzipped |
| **Total initial page load (excl. samples)** | **< 200KB gzipped** |
| Instrument samples (lazy-loaded) | < 2MB total |

Bundle size validated in CI via `vite build` output size checks. PRs exceeding any budget are blocked.

Tree-shaking verification: `__DEV__`-gated code removed in production. Core audio algorithms total < 15KB minified (FFT, onset detection, k-means, MFCC).

## Environment

- **Node**: 20 LTS+ (required for native ESM support in tooling)
- **Package manager**: npm
- **Browser requirements**: AudioWorklet support (Chrome 66+, Firefox 76+, Safari 14.1+)
- **HTTPS required**: Microphone access (`getUserMedia`) requires secure context
