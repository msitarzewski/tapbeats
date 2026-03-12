# TapBeats MVP Release Plan

**Version**: 1.0.0
**Target**: 12 weeks
**Status**: Planning Complete
**Last Updated**: 2026-03-12

---

## Vision

Turn the universal human behavior of tapping on things into polished drum beats. **Perform first, assign instruments later.**

## Release Overview

The MVP delivers the complete core loop: **Record → Detect → Cluster → Assign → Quantize → Play → Save → Export**

Built as a web-first PWA using React + TypeScript + Web Audio API. All processing on-device. No server. No tracking. Open source (license TBD).

Complete visual design system specified: dark theme with 40+ CSS tokens, 8-color instrument palette, Inter/JetBrains Mono typography, 5 responsive breakpoints, ASCII wireframes for all screens, and 7 micro-interaction specs with animation curves. See `ui-design.md` for implementation-ready details.

---

## Milestone Tracker

| # | Milestone | Target | Status | Key Deliverable |
|---|-----------|--------|--------|-----------------|
| 1 | [Project Scaffolding](./milestone-1-project-scaffolding.md) | Week 1 | Not Started | Build tooling, CI/CD, app shell |
| 2 | [Audio Capture](./milestone-2-audio-capture.md) | Week 2 | Not Started | Microphone → raw audio buffer |
| 3 | [Onset Detection](./milestone-3-onset-detection.md) | Week 3 | Not Started | Real-time hit detection (< 50ms) |
| 4 | [Sound Clustering](./milestone-4-clustering.md) | Week 4 | Not Started | Auto-group similar sounds |
| 5 | [Instrument Assignment](./milestone-5-instrument-assignment.md) | Week 5 | Not Started | Sample library + smart defaults |
| 6 | [Quantization](./milestone-6-quantization.md) | Week 6 | Not Started | BPM detection + grid snap |
| 7 | [Timeline & Playback](./milestone-7-timeline-playback.md) | Weeks 7-8 | Not Started | Multi-track timeline + playback engine |
| 8 | [Session & Export](./milestone-8-session-export.md) | Week 9 | Not Started | IndexedDB persistence + WAV export |
| 9 | [Polish & PWA](./milestone-9-polish-pwa.md) | Weeks 10-11 | Not Started | Offline, accessibility, cross-browser |
| 10 | [Launch](./milestone-10-launch.md) | Week 12 | Not Started | Deploy, docs, go-to-market |

---

## Architecture at a Glance

```
Microphone → AudioWorklet (onset detection) → Feature Extraction → K-Means Clustering
    ↓                                                                        ↓
Live Waveform UI                                                   Cluster Review UI
                                                                         ↓
                                                              Instrument Assignment
                                                                         ↓
                                                              Quantization Engine
                                                                         ↓
                                                              Timeline + Playback
                                                                         ↓
                                                              Save (IndexedDB) / Export (WAV)
```

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React 18 + TypeScript | Type safety, ecosystem, concurrent features |
| Build | Vite | Fast HMR, native ESM, AudioWorklet support |
| Audio | Web Audio API + AudioWorklet | Low-latency, real-time processing, no server |
| State | Zustand | Minimal boilerplate, good for audio state |
| Timeline | Canvas 2D | 60fps rendering for timeline with many hits |
| Storage | IndexedDB (via idb) | Large binary data (audio buffers), offline |
| Testing | Vitest + Playwright | Fast unit tests + cross-browser E2E |
| CI/CD | GitHub Actions | Free for open source |

## Critical Path

The milestones are sequential — each builds on the previous:

```
Scaffolding → Capture → Detection → Clustering → Assignment → Quantization → Timeline → Sessions → Polish → Launch
```

**Milestone 7 (Timeline & Playback)** is the first point where the full magic loop works end-to-end. This is the internal "does this actually feel good?" checkpoint.

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Onset detection accuracy too low | High | Medium | Tune sensitivity, offer manual correction |
| iOS Safari AudioWorklet issues | High | Medium | ScriptProcessorNode fallback |
| Clustering produces poor groupings | Medium | Medium | User split/merge controls |
| Web Audio latency too high on mobile | High | Low | Buffer size tuning, skip AudioWorklet on slow devices |
| Sample library licensing issues | Medium | Low | Source only CC0/public domain |

## Success Metrics (MVP)

- End-to-end flow works: tap → hear polished beat in < 2 minutes
- At least 3 distinct sounds reliably clustered
- Quantization produces musically pleasing output
- Works on Chrome + Firefox + Safari (desktop + mobile)
- < 3 seconds from "stop recording" to clusters shown
- Loop playback with no audible gap

## PRD Reference

Full PRD and all section documents: [`/docs/PRD.md`](../../docs/PRD.md)

| Section | Document |
|---------|----------|
| Master PRD | [`docs/PRD.md`](../../docs/PRD.md) |
| Product Requirements | [`docs/sections/product-requirements.md`](../../docs/sections/product-requirements.md) |
| UX Research | [`docs/sections/ux-research.md`](../../docs/sections/ux-research.md) |
| Brand Strategy | [`docs/sections/brand-strategy.md`](../../docs/sections/brand-strategy.md) |
| Technical Architecture | [`docs/sections/technical-architecture.md`](../../docs/sections/technical-architecture.md) |
| Audio Engineering | [`docs/sections/audio-engineering.md`](../../docs/sections/audio-engineering.md) |
| UI Design | [`docs/sections/ui-design.md`](../../docs/sections/ui-design.md) |
| Developer Experience | [`docs/sections/developer-experience.md`](../../docs/sections/developer-experience.md) |
| Testing Strategy | [`docs/sections/testing-strategy.md`](../../docs/sections/testing-strategy.md) |

---

*"Every surface is an instrument. Every person is a musician."*
