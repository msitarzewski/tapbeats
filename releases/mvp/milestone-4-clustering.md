# Milestone 4: Sound Clustering & Cluster Review UI

**Target**: Week 4
**Status**: Not Started
**Dependencies**: Milestone 3 (Onset Detection)

---

## Objective

After recording stops, automatically group similar-sounding hits into clusters using k-means on extracted audio features. Present clusters to the user with waveform previews, playback, and the ability to split/merge.

## Deliverables

### 4.1 Clustering Algorithm
- [ ] Implement `SoundClusterer` module per developer-experience interfaces
- [ ] K-means clustering with k-means++ initialization
- [ ] Euclidean distance on normalized feature vectors
- [ ] Automatic K selection via silhouette score (range: 2-8)
- [ ] Elbow method as secondary K validation
- [ ] Maximum iterations and convergence threshold

### 4.2 Edge Case Handling
- [ ] All hits identical → 1 cluster, allow user to proceed (FR-027)
- [ ] Too few hits (< 5) → simple amplitude-based grouping fallback
- [ ] Too many hits (> 500) → reservoir sampling before clustering
- [ ] More than 12 clusters → auto-merge most similar (FR-026)
- [ ] Gradual variation (no clear clusters) → present best guess with merge hints

### 4.3 Cluster Review UI (per `ui-design.md` Section 3 — Cluster Review Screen)
- [ ] Cluster review screen with card layout (FR-020)
- [ ] Per-cluster card: `--surface-2` background, 12px radius, instrument color left border
  - Waveform thumbnail (64px height, instrument color fill)
  - Hit count badge
  - Playback button (FR-021)
  - Quick-pick instrument chips (top 4 suggestions)
- [ ] Full sample browser (bottom sheet on mobile, side panel on desktop)
- [ ] Total cluster count display (FR-022)
- [ ] Split cluster action — show individual hits, user selects groups (FR-023)
- [ ] Merge clusters action — multi-select via checkboxes, merge button (FR-024)
- [ ] Cluster formation animation (1.2s choreographed: fade in → group → color)
- [ ] "Continue" button to proceed to timeline
- [ ] Responsive: cards stack on mobile (xs/sm), 2-col on tablet (md), 3-col on desktop (lg+)

### 4.4 Re-clustering
- [ ] When user splits a cluster, update clustering results
- [ ] When user merges clusters, update clustering results
- [ ] Maintain hit-to-cluster mapping throughout edits
- [ ] Visual transitions when clusters change

### 4.5 State Management
- [ ] `clusterStore` Zustand slice (clusters, assignments, activeCluster)
- [ ] Cluster lifecycle: computing → ready → editing → confirmed

### 4.6 Tests
- [ ] Unit: K-means with synthetic feature vectors (known clusters)
- [ ] Unit: K-means++ initialization correctness
- [ ] Unit: Silhouette score calculation against known values
- [ ] Unit: Auto-K selection (elbow + silhouette)
- [ ] Unit: Edge cases (1 cluster, < 5 hits, > 500 hits)
- [ ] Unit: Split and merge operations
- [ ] Integration: End-to-end onset → feature → cluster pipeline
- [ ] Benchmark: Clustering completes in < 2s for 60s recording, < 3s for 120s (NFR-003)

## Acceptance Criteria

- [ ] Clustering produces 2-8 meaningful groups for typical percussion input
- [ ] Clustering completes in < 2 seconds for recordings up to 60s (NFR-003)
- [ ] Clustering completes in < 3 seconds for recordings up to 120s (NFR-003)
- [ ] Each cluster card shows waveform, hit count, and unique color (FR-020)
- [ ] User can play back each cluster's representative sound (FR-021)
- [ ] User can split a cluster into sub-clusters (FR-023)
- [ ] User can merge clusters together (FR-024)
- [ ] Single-cluster edge case handled gracefully (FR-027)
- [ ] Silhouette score > 0.4 for cleanly separated percussion sounds

## Relevant PRD References

- `product-requirements.md` — FR-019 through FR-027
- `audio-engineering.md` — Section 4 (Sound clustering)
- `technical-architecture.md` — Section 5 (Clustering)
- `ui-design.md` — Cluster review screen

## Implementation Notes from M1

### Infrastructure Already in Place
- Cluster screen stub at `src/components/clustering/ClusterScreen.tsx` — extend it
- Shared components available: `Button` (3 variants x 3 sizes), `Card` (with selected state), `Modal` (responsive bottom sheet/centered), `Slider`
- CSS design system: all cluster colors (`--cluster-0` through `--cluster-7`), spacing, radii, transitions in `src/styles/theme.css`
- Animation keyframes in `src/styles/animations.css` (fadeIn, slideUp, scaleSpring, pulse, shimmer)
- Clustering algorithm goes in `src/audio/clustering/` (directory exists)

### TypeScript/Lint Rules to Watch
- `verbatimModuleSyntax`: use `import type` for type-only imports
- `strict-boolean-expressions`: no truthy checks on arrays/objects — use explicit length/null checks
- `noUncheckedIndexedAccess`: array index returns `T | undefined` — critical for k-means centroid access
- `exactOptionalPropertyTypes`: cannot assign `undefined` to optional props — omit key instead
- `restrict-template-expressions`: `String()` wrap numbers in template literals
- Import ordering: blank lines between groups, CSS modules before type imports

### Component Patterns Established
- All components use CSS modules (`.module.css`)
- Named exports only (no default exports)
- CSS custom properties from `theme.css` — use `var(--token-name)` not hardcoded values
- Responsive: mobile-first with `@media (min-width: 640px)` for desktop overrides
- Card component already has `selected` state and `onClick` with proper ARIA attributes
