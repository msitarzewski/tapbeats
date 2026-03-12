# Milestone 5: Instrument Assignment & Sample Library

**Target**: Week 5
**Status**: Not Started
**Dependencies**: Milestone 4 (Clustering)

---

## Objective

Build the sample library and instrument assignment flow. Users browse available drum sounds, preview them, and assign one to each cluster. Smart defaults suggest instruments based on acoustic characteristics.

## Deliverables

### 5.1 Sample Library
- [ ] Source CC0/public domain drum samples (no licensing issues for open source)
- [ ] Minimum instrument set (FR-029):
  - Kick drum (3 variations)
  - Snare drum (3 variations)
  - Hi-hat closed (2 variations)
  - Hi-hat open (2 variations)
  - Tom high, mid, low (1 each)
  - Clap (2 variations)
  - Rim shot (1 variation)
  - Cowbell (1 variation)
  - Shaker/tambourine (1 variation)
- [ ] Audio format: OGG primary, MP3 fallback for Safari
- [ ] Normalize all samples (44.1kHz, mono, -1dBFS peak)
- [ ] Trim silence, consistent envelope
- [ ] Bundle samples with app (no runtime loading)

### 5.2 Sample Playback Infrastructure
- [ ] `PlaybackEngine` module — AudioBuffer loading and caching
- [ ] Sample triggering via `AudioBufferSourceNode` with precise timing
- [ ] OGG/MP3 format detection and fallback
- [ ] Preload all samples on app startup

### 5.3 Smart Default Suggestions
- [ ] Analyze cluster features to suggest instruments (FR-032):
  - Low spectral centroid + high energy → kick drum
  - High spectral centroid + sharp attack → hi-hat
  - Mid spectral centroid + high energy → snare
  - Mid-low centroid + medium energy → tom
- [ ] Present suggestion as pre-selected but easily changeable

### 5.4 Assignment UI
- [ ] Instrument browser per cluster (FR-028)
  - Grid of instrument categories
  - Variations within each category
  - Preview (audition) on tap/click (FR-030)
- [ ] Per-instrument color assignment (FR-031)
- [ ] Color coding applied to cluster card when assigned
- [ ] "Skip" option to mute a cluster (FR-036)
- [ ] Change assignment at any time (FR-034)
- [ ] "Continue to Timeline" button when at least 1 cluster assigned

### 5.5 State Management Updates
- [ ] Extend `clusterStore` with instrument assignments
- [ ] Instrument mapping: clusterId → { instrumentId, sampleUrl, color }
- [ ] Default suggestions populated automatically
- [ ] User overrides tracked

### 5.6 Tests
- [ ] Unit: Sample loading and AudioBuffer creation
- [ ] Unit: Smart suggestion algorithm with synthetic features
- [ ] Unit: OGG/MP3 fallback detection
- [ ] Integration: Full cluster → assignment → preview flow
- [ ] E2E: Assign instruments to clusters, hear preview
- [ ] Verify all bundled samples load without errors
- [ ] Cross-browser: Sample playback on Chrome, Firefox, Safari, iOS Safari

## Acceptance Criteria

- [ ] At least 20 drum samples available across all categories (FR-029)
- [ ] User can browse and preview any sample before assigning (FR-028, FR-030)
- [ ] Smart defaults suggest reasonable instruments based on sound characteristics (FR-032)
- [ ] User can override any suggestion (FR-033)
- [ ] Instrument colors applied consistently across UI (FR-031)
- [ ] User can change assignment after initial selection (FR-034)
- [ ] All samples are CC0/public domain licensed
- [ ] Sample playback works on all target browsers
- [ ] Total sample bundle < 2MB

## Relevant PRD References

- `product-requirements.md` — FR-028 through FR-036
- `audio-engineering.md` — Sections 6-7 (Playback architecture, Sample library)
- `technical-architecture.md` — Section 7 (Playback engine)
- `ui-design.md` — Cluster review / instrument assignment screen
