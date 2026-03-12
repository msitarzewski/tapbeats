# TapBeats -- Product Requirements Document

**Version**: 1.0.0
**Date**: 2026-03-12
**Status**: Draft

---

## Executive Summary

TapBeats is an open-source, web-first application that transforms the most instinctive form of music-making -- tapping on surfaces -- into polished, looping drum beats. Users record themselves tapping on a desk, a cardboard box, their lap, or any surface. The app captures the raw audio, detects each individual hit, groups similar-sounding hits into clusters using unsupervised machine learning, and then lets the user assign a real instrument sample (kick, snare, hi-hat) to each cluster. Timing is quantized to a musical grid and played back as a seamless loop. No drum kit, no MIDI controller, no DAW experience required -- just hands and a surface.

The core innovation is **"perform first, assign instruments later."** Every existing beat-making tool forces you to pick an instrument before you play a note. TapBeats inverts this: you perform your full rhythm freely, using whatever tapping techniques feel natural. Only afterward does the app present the distinct sounds it detected and let you map each one to a drum voice. This removes the cognitive overhead of instrument selection during creative performance and lets rhythm ideas flow without interruption.

TapBeats is built entirely for the browser. All audio capture, onset detection, feature extraction, clustering, quantization, and playback run on-device with zero server dependency. The application ships as a Progressive Web App installable on any platform. The choice to go web-first means no app store gatekeeping, instant access via URL, offline support after first load, and a single codebase that runs on desktop and mobile. The project is open source (license TBD) and designed for community contribution from day one.

---

## Table of Contents

| Section | Document |
|---------|----------|
| Product Requirements | [sections/product-requirements.md](sections/product-requirements.md) |
| UX Research | [sections/ux-research.md](sections/ux-research.md) |
| Brand & Product Strategy | [sections/brand-strategy.md](sections/brand-strategy.md) |
| Technical Architecture | [sections/technical-architecture.md](sections/technical-architecture.md) |
| Audio Engineering & DSP | [sections/audio-engineering.md](sections/audio-engineering.md) |
| Developer Experience | [sections/developer-experience.md](sections/developer-experience.md) |
| Testing & QA Strategy | [sections/testing-strategy.md](sections/testing-strategy.md) |
| UI Design | [sections/ui-design.md](sections/ui-design.md) |

---

## Product Overview

### The Problem

Creating drum beats today requires either expensive hardware (drum machines, MIDI controllers, electronic kits) or fluency with complex DAW software. The most intuitive way humans have always created rhythm -- tapping and hitting things -- is completely disconnected from the tools that produce music. Casual users, beginners, and anyone who just wants to sketch a rhythm idea face a steep barrier to entry.

### The Solution

TapBeats bridges the gap between physical rhythm performance and digital beat production. The entire workflow runs locally in the browser:

1. **Tap** -- User taps a rhythm on any surface while the app records via microphone.
2. **Detect** -- Real-time onset detection identifies each individual hit in the audio stream.
3. **Cluster** -- Machine learning groups similar-sounding hits together (e.g., all knuckle taps in one cluster, all palm hits in another).
4. **Assign** -- User maps each cluster to a drum instrument sample (kick, snare, hi-hat, etc.).
5. **Quantize** -- Timing is snapped to a musical grid with adjustable strength, BPM, and resolution.
6. **Play** -- The result loops as a polished beat with per-track volume, mute, and solo controls.

### Target Platforms

TapBeats is a web-first Progressive Web App. Primary targets:

- Chrome, Firefox, Safari (latest stable, desktop)
- iOS Safari 15+ (iPhone)
- Chrome for Android 90+
- Responsive from 320px to 2560px viewport width
- Offline-capable after first load via service worker

### Licensing

Open source. License TBD. The project is designed for community contribution with clear coding standards, comprehensive test coverage, and thorough documentation.

---

## Technical Summary

### Core Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript 5.4+ |
| Framework | React 18+ |
| Build | Vite 5+ |
| State | Zustand 4+ |
| Audio | Web Audio API + AudioWorklet |
| Storage | IndexedDB via `idb` 8+ |
| Timeline Rendering | HTML5 Canvas 2D |
| Testing | Vitest 1+ |
| Styling | CSS Modules |
| Linting | ESLint + Prettier |

### Key Architecture Decisions

- **Client-only SPA.** All processing runs in the browser. No server, no API, no backend of any kind for v1. Audio never leaves the device.
- **AudioWorklet for real-time processing.** Onset detection runs in an AudioWorklet on a dedicated audio thread, ensuring low-latency tap detection without blocking the main thread.
- **K-means clustering with automatic k selection.** Hits are grouped by audio features (spectral centroid, MFCC, zero-crossing rate, attack time) using k-means++ initialization. The optimal number of clusters is selected automatically via silhouette scoring.
- **Zustand for state management.** Lightweight, TypeScript-native, no provider wrappers. Persistence middleware connects to IndexedDB for session save/load.
- **Canvas-based timeline.** The beat timeline renders at 60fps using HTML5 Canvas 2D for smooth playback cursor animation and hit marker rendering.
- **Pure-JS DSP.** FFT, MFCC computation, and spectral analysis are implemented in pure TypeScript -- no native dependencies, no WASM for v1.

---

## MVP Scope

### Included in MVP

- Full audio capture pipeline (microphone access, recording up to 2 minutes)
- Real-time onset detection with visual feedback and configurable sensitivity
- Automatic sound clustering with waveform previews and manual split/merge
- Instrument assignment with preview, browse, and smart suggestions
- Built-in sample library: kicks, snares, hi-hats, toms, claps, rim shots, cowbell, shakers/tambourine (3+ variations each)
- BPM auto-detection and manual override (40--240 BPM)
- Quantization with grid resolution (1/4, 1/8, 1/16, triplets), strength control (0--100%), and before/after comparison
- Multi-track timeline with hit markers, grid lines, and playback cursor
- Per-track mute, solo, and volume; master volume
- Manual hit editing on timeline (move, add, delete)
- Session save/load/delete/rename via IndexedDB
- WAV audio export
- Dark and light theme with OS preference detection
- PWA installable with offline support
- Responsive design for desktop and mobile
- WCAG 2.1 AA accessibility compliance

### Explicitly Out of Scope

- Multi-user collaboration or cloud sync
- Native mobile apps (iOS/Android builds)
- Audio effects (reverb, delay, compression, EQ, panning)
- Melodic/harmonic instruments (percussion only)
- Server-side processing or backend of any kind
- MIDI export, shareable URLs, custom sample upload
- Song arrangement (multi-section structure)
- Time signatures other than 4/4
- Internationalization (English only)

---

## Section Index

### Product Requirements
`sections/product-requirements.md` -- Complete functional requirements (FR-001 through FR-072) with P0/P1/P2 prioritization. Non-functional requirements covering performance, accessibility, and browser compatibility. User stories, scope boundaries, dependencies, and detailed MVP acceptance criteria.

### UX Research
`sections/ux-research.md` -- User personas (casual tapper, bedroom producer, music educator, accessibility user), journey maps through the full recording-to-playback flow, competitive analysis of existing tools, usability principles, research questions to validate, success metrics and KPIs, and a research roadmap.

### Brand & Product Strategy
`sections/brand-strategy.md` -- Vision and mission statements, brand identity guidelines, market positioning against DAWs and casual music apps, target audience segmentation, open-source strategy, go-to-market plan, growth and engagement strategy, and risk analysis.

### Technical Architecture
`sections/technical-architecture.md` -- System architecture (six subsystems with unidirectional data pipeline), audio pipeline deep dive, onset detection algorithm, feature extraction, sound clustering, quantization engine, playback engine, data models, state management, performance requirements, full technology stack, security and privacy considerations, and future architecture roadmap.

### Audio Engineering & DSP
`sections/audio-engineering.md` -- Implementation-ready DSP reference with TypeScript pseudocode throughout. Web Audio API lifecycle and browser quirks, onset detection algorithms (spectral flux, adaptive thresholding), feature extraction (FFT, MFCC, spectral centroid, zero-crossing rate, envelope), k-means clustering specification, quantization algorithm, sample playback architecture, sample library specification, performance optimization, and audio-specific testing strategies.

### Developer Experience
`sections/developer-experience.md` -- Project directory structure, technology stack detail with version pins, key module specifications, state management architecture (Zustand stores and slices), coding standards, development workflow (branching, commits, PR process), dependency policy, and configuration files (tsconfig, vite, eslint, prettier).

### Testing & QA Strategy
`sections/testing-strategy.md` -- Testing philosophy and pyramid (65% unit, 25% integration, 10% E2E), unit testing with Vitest and OfflineAudioContext, integration testing, Playwright E2E tests, audio-specific testing challenges and approaches, performance testing, accessibility testing, cross-browser testing matrix, CI/CD pipeline configuration, manual QA checklist, and quality metrics with gate criteria.

### UI Design
`sections/ui-design.md` -- Complete visual design system (dark/light theme with 40+ hex-coded tokens, Inter/JetBrains Mono typography, 4px spacing system), full component inventory (buttons, sliders, cards, modals, waveform displays), screen-by-screen breakdown with ASCII wireframes for all 5 screens, interaction patterns (16 gestures, 20+ keyboard shortcuts), 5 responsive breakpoints, onboarding flow, 9 error states with copy, WCAG 2.1 AA accessibility spec with ARIA examples, and 7 micro-interaction specifications with animation timing curves.

---

## Project Metadata

| Field | Value |
|-------|-------|
| **Repository** | `tapbeats` |
| **Language** | TypeScript |
| **Framework** | React 18+ / Vite 5+ |
| **License** | TBD (open source) |
| **Node Version** | 20 LTS+ |
| **Package Manager** | npm |
| **Browser Targets** | Chrome, Firefox, Safari (latest stable); iOS Safari 15+; Chrome Android 90+ |
| **Accessibility** | WCAG 2.1 AA |
| **Contributing** | See contributing guidelines (TBD) |
| **Code of Conduct** | TBD |

---

*This document is the entry point to the TapBeats PRD. For detailed requirements, architecture, and specifications, follow the links in the Table of Contents above.*
