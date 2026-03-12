# Project Rules & Coding Standards

## Language & Type Safety

- TypeScript 5.7 with `strict: true` in `tsconfig.json`.
- Additional strict flags: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`.
- `any` is forbidden in `src/audio/`. Use `unknown` with type narrowing.
- `as` type assertions forbidden except in test files. Use type guards instead.
- Non-null assertion (`!`) is forbidden. Handle `null`/`undefined` explicitly.
- Prefer string/number union types over enums: `type Subdivision = 1 | 2 | 4 | 8 | 16`.
- `verbatimModuleSyntax` is enabled: **must** use `import type { X }` for type-only imports.
- `strict-boolean-expressions` is enabled: no `if (x)` for non-boolean types — use `if (x !== undefined)`.
- `restrict-template-expressions`: wrap numbers in `String()` inside template literals.
- `noUncheckedIndexedAccess`: array/object index access returns `T | undefined` — must narrow before use.
- `exactOptionalPropertyTypes`: cannot assign `undefined` to optional properties — omit the key instead.

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Component files | PascalCase `.tsx` | `RecordingScreen.tsx` |
| Module files | PascalCase `.ts` | `OnsetDetector.ts` |
| Utility files | camelCase `.ts` | `arrayBuffer.ts` |
| Type files | camelCase `.ts` | `audio.ts` |
| Hook files | camelCase, `use` prefix | `useAudioCapture.ts` |
| Store files | camelCase, `Store` suffix | `recordingStore.ts` |
| Test files | Match source + `.test.ts` | `OnsetDetector.test.ts` |
| Interfaces | PascalCase, no `I` prefix | `AudioFeatures` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_CAPTURE_CONFIG` |
| Functions | camelCase | `computeSpectralFlux()` |
| CSS custom props | `--tb-{category}-{name}` | `--tb-color-primary` |
| Event handler props | `on` prefix | `onBuffer`, `onOnset` |
| Booleans | `is`/`has`/`should` prefix | `isPlaying`, `hasPermission` |

## File Organization

- One export per file for classes and components. Utilities may export multiple related functions.
- Co-locate types with their module when used only by that module. Shared types go in `src/types/`.
- No circular imports. Dependency flow: `types` <- `utils` <- `audio/*` <- `state` <- `hooks` <- `components`.
- Index files (`index.ts`) for re-exports only. No logic in index files.
- Test files mirror source structure under `tests/unit/`.

## Import Ordering

Enforced by ESLint `import/order` with `newlines-between: 'always'` and `alphabetize: { order: 'asc' }`. **Must have blank line between each group.** Type-only imports use `import type` (required by `verbatimModuleSyntax`).

Groups in order:
1. External packages (`react`, `zustand`, `react-router-dom`)
2. Internal absolute imports (`@/types/audio`, `@/utils/math`)
3. Parent imports (`../recording/RecordingScreen`)
4. Sibling imports (`./AppShell`, `./Button.module.css`)
5. Type imports (`import type { ReactNode } from 'react'`)

**Important**: CSS module imports (sibling group) must come **before** `import type` lines. The `import/order` rule enforces this strictly.

## Error Handling

- Structured errors with machine-readable codes. Never bare strings: `{ code: 'PERMISSION_DENIED', message: string, cause?: Error }`.
- Audio modules emit errors via events; they never throw during processing.
- Async operations use explicit try/catch with typed error handling.
- React components: `ErrorBoundary` at screen level with recovery UI.
- Never swallow errors silently. Always log or propagate.

## Audio Thread Rules (AudioWorklet)

- No object allocation inside `process()`. Pre-allocate all buffers in the constructor.
- No closures, no `Array.map`/`filter`/`reduce`. Use indexed `for` loops.
- No string concatenation or template literals.
- No `console.log` (serialization stalls the audio thread). Use `this.port.postMessage()` for debug output.
- No `Math.random()`. Use a pre-seeded PRNG if randomness is needed.
- Target: `process()` completes in under 3ms for a 2048-sample buffer at 44.1kHz.
- Communication with main thread via `MessagePort` with `Transferable` objects (ArrayBuffers) to avoid copying.

## React Patterns

- Functional components only.
- Custom hooks in `src/hooks/` bridge audio modules and React lifecycle.
- `React.memo()` for components with stable props (cluster cards, hit markers).
- `useCallback`/`useMemo` for callbacks and derived data passed to children.
- Canvas rendering (waveforms, timeline) via `requestAnimationFrame`, not React re-renders.
- Never read `Float32Array` audio buffers inside React render. Copy scalar values to state; keep buffers in refs.
- No prop drilling. Use Zustand stores with selectors.

## State Management (Zustand)

- Separate store files per domain: `appStore`, `recordingStore`, `clusterStore`, `timelineStore`, `sessionStore`.
- Zustand selectors with shallow equality (`useStore(selector, shallow)`) for derived state.
- Persistence middleware connects to IndexedDB for session save/load.
- Non-serializable runtime objects (AudioContext, engines) prefixed with `_` and excluded from persistence.
- `subscribeWithSelector` middleware for reactive cross-store updates.

## CSS Approach

- CSS Modules for component-scoped styles. No CSS-in-JS.
- CSS custom properties defined in `src/styles/theme.css` for theming (dark/light).
- 4px spacing base unit.
- Global reset and base typography in `src/styles/global.css`.
- Shared keyframe animations in `src/styles/animations.css`.
- Prettier formatting: single quotes, trailing commas, 100-character line width.

## Testing Rules

- Unit tests for all audio algorithms (FFT, onset detection, clustering, quantization).
- Integration tests for multi-module pipelines (capture -> onset -> features, features -> clustering).
- E2E tests with Playwright for full user flows (microphone mock via `browserContext.grantPermissions`).
- Test fixtures: real WAV files in `tests/fixtures/`, pre-computed feature vectors for snapshot tests.
- Coverage thresholds: 80% branches, 80% functions, 80% lines.
- Deterministic tests: set `seed` on clusterer config, use known audio fixtures.
- Vitest for unit/integration, Playwright for E2E.

## Performance Rules

- Canvas 2D for timeline rendering. Target 60fps with 500+ hit markers.
- Use `Float32Array`/`Float64Array` for audio data, not `number[]`.
- FFT compute in-place. Avoid copying intermediate buffers.
- Prefer `for` loops over array methods for buffers > 1024 samples.
- Onset detection latency < 30ms from tap to event.
- Feature extraction < 10ms per hit.
- Clustering < 500ms for 200 hits.
- Total working memory < 50MB.

## Dependency Policy

- All core audio processing implemented from scratch: FFT, onset detection, MFCC, k-means, quantization, WAV encoding.
- No external audio processing libraries. No WASM for v1.
- Runtime dependencies must be < 5KB minified+gzipped, tree-shakeable, TypeScript-typed, MIT/BSD/Apache licensed.
- Approved runtime deps: `react`, `react-dom`, `zustand`, `nanoid` (~400B), `idb-keyval` (~600B).
- Bundle budget: app code < 80KB gzip, framework+deps < 50KB gzip, total JS < 130KB gzip, total initial load < 200KB gzip.
- Samples lazy-loaded, < 2MB total.

## Commit & Workflow

- Feature branches from `main`. PRs with clear descriptions.
- Pre-commit hooks via Husky + lint-staged: ESLint fix + Prettier on staged files. Never bypass with `--no-verify`.
- All checks must pass before merge: `npm run lint && npm run typecheck && npm run test:run`.
- CI: GitHub Actions runs lint, typecheck, unit tests, build on every push. Playwright E2E on push to main.
