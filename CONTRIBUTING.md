# Contributing to TapBeats

## Getting Started

```bash
git clone <repo-url>
cd tapbeats
npm install
npm run dev
```

The dev server starts at `https://localhost:5173` (self-signed HTTPS required for Web Audio APIs).

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HTTPS |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format |
| `npm run format:check` | Prettier check |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest single run |
| `npm run test:coverage` | Vitest with coverage |
| `npm run test:e2e` | Playwright E2E tests |

## Code Style

- **TypeScript**: Strict mode enabled. No `any`, no non-null assertions.
- **Formatting**: Prettier handles formatting (single quotes, trailing commas, 100-char width).
- **Linting**: ESLint with strict-type-checked rules. Pre-commit hooks run automatically via Husky.
- **Imports**: Ordered by group (builtin, external, internal, parent, sibling). Use `@/` path alias for `src/` imports.

## Pull Request Process

1. Create a feature branch from `main`
2. Make changes following existing patterns
3. Ensure all checks pass: `npm run lint && npm run typecheck && npm run test:run && npm run build`
4. Open a PR with a clear description of changes
5. CI must pass before merge

## Testing Requirements

- Unit tests for all new functions and components
- Integration tests for workflows spanning multiple modules
- Maintain 80% coverage threshold (branches, functions, lines, statements)
- Tests must be deterministic — no flaky tests

## Project Structure

```
src/
  components/   — React components grouped by feature
  audio/        — Web Audio API modules (capture, analysis, clustering, quantization, playback)
  state/        — Zustand stores and middleware
  hooks/        — Custom React hooks
  types/        — TypeScript type definitions
  utils/        — Utility functions
  styles/       — CSS design system and global styles
  assets/       — Static assets (samples, icons)
public/
  worklets/     — AudioWorklet processor scripts
tests/
  unit/         — Vitest unit tests
  integration/  — Vitest integration tests
  e2e/          — Playwright end-to-end tests
  fixtures/     — Test fixtures
  helpers/      — Test utilities and mocks
```
