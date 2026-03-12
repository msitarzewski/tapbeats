# Build & Deployment

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server at `http://localhost:8087` (no SSL) |
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

## Build Tool: Vite 6

**Config**: `vite.config.ts`

Key configuration points:
- **HTTP dev server on port 8087**: No SSL — `@vitejs/plugin-basic-ssl` removed. `getUserMedia` works on localhost without HTTPS in all major browsers. Production deployment must use HTTPS.
- **Path aliases**: `@/*` maps to `./src/*` (via `resolve.alias` + `tsconfig.json` paths)
- **AudioWorklet bundling**: Worklet files in `public/worklets/` are served as-is (not bundled). Worklets cannot be HMR'd -- changes require full page reload.
- **COOP/COEP headers**: `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` for SharedArrayBuffer support
- **Vendor chunk splitting**: `react`, `react-dom`, `zustand` in separate vendor chunk for long-term caching
- **`__DEV__` flag**: Strips DevTools middleware and debug logging in production via `define`
- **Build target**: ES2022, sourcemaps enabled

## Current Build Output (M1 baseline)

| Asset | Size | Gzipped |
|-------|------|---------|
| `index.html` | 0.95 KB | 0.49 KB |
| `index-*.css` | 2.99 KB | 1.28 KB |
| `index-*.js` (app) | 20.20 KB | 7.42 KB |
| `vendor-*.js` (React/Zustand) | 142.20 KB | 45.66 KB |
| **Total** | **166 KB** | **55 KB** |

## CI/CD Pipeline: GitHub Actions

### Workflows
- **`ci.yml`**: Runs on every push/PR to main and develop
- **`e2e.yml`**: Playwright against production build on push to main

### PR Checks (every push)
1. **lint-typecheck** job: `npm run lint` + `npm run typecheck` (5 min timeout)
2. **unit-integration** job: Vitest with coverage, upload coverage artifact (10 min timeout)
3. **build** job: `npm run build` verifies production build (5 min timeout)

### Main Branch (push to main)
4. **e2e** job: Playwright across Chromium, Firefox, WebKit matrix (30 min timeout, fail-fast: false)

All jobs use Node 20 with npm cache.

## TypeScript Configuration

Three tsconfig files:
- **`tsconfig.json`**: Main config — strict mode, all extra flags, includes `src/` only, excludes `tests/`
- **`tsconfig.test.json`**: Extends main — includes `src/` + `tests/`, excludes `node_modules` + `dist`, relaxed `noUnusedLocals`/`noUnusedParameters`
- **`tsconfig.node.json`**: For config files — `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`

ESLint uses `tsconfig.json` for src files and `tsconfig.test.json` for test files (via override in `.eslintrc.cjs`).

## Pre-commit Hooks

**Husky 9.x** + **lint-staged 15.x**

`.husky/pre-commit` runs `npx lint-staged` which executes:
- `src/**/*.{ts,tsx}`: ESLint fix + Prettier write
- `tests/**/*.{ts,tsx}`: ESLint fix + Prettier write
- `src/**/*.css`: Prettier write

Do not bypass with `--no-verify`.

## Deployment Target

**Static hosting** -- any provider that serves static files: Vercel, Netlify, GitHub Pages.

Production build outputs to `dist/`:
- Tree-shaken application code (DevTools middleware, debug logging removed)
- AudioWorklet files copied from `public/worklets/` to `dist/worklets/`
- Instrument samples fingerprinted for cache-busting
- Vendor chunk split for long-term caching
- Source maps generated (do not deploy unless needed for error monitoring)

**Required headers for deployment**: COOP and COEP headers for SharedArrayBuffer support. HTTPS required for `getUserMedia` and service workers.

## Bundle Budget

| Category | Budget |
|----------|--------|
| Application code (`src/`) | < 80KB gzipped |
| Framework + runtime deps (React, Zustand) | < 50KB gzipped |
| Total JavaScript (excl. samples) | < 130KB gzipped |
| CSS | < 10KB gzipped |
| **Total initial page load (excl. samples)** | **< 200KB gzipped** |
| Instrument samples (lazy-loaded) | < 2MB total |

## Environment

- **Node**: 20 LTS+ (required for native ESM support in tooling)
- **Package manager**: npm
- **Browser requirements**: AudioWorklet support (Chrome 66+, Firefox 76+, Safari 14.1+)
- **HTTPS required**: In production only. Localhost works without HTTPS for getUserMedia.
