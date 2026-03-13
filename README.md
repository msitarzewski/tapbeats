# TapBeats

[![CI](https://github.com/msitarzewski/tapbeats/actions/workflows/ci.yml/badge.svg)](https://github.com/msitarzewski/tapbeats/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

**Tap anything. Make music.**

TapBeats transforms the most instinctive form of music-making -- tapping on
surfaces -- into polished, looping drum beats. Record yourself tapping on a
desk, a cardboard box, your lap, or anything within reach. The app captures
your rhythm, identifies each distinct sound, lets you assign real instrument
samples, quantizes the timing to a musical grid, and plays it back as a
seamless loop. No drum kit, no MIDI controller, no DAW experience required.

---

## How It Works

TapBeats follows a six-step pipeline, all running locally in your browser:

| Step | Name | What Happens |
|------|------|--------------|
| 1 | **Tap** | You tap a rhythm on any surface while the app records via microphone. |
| 2 | **Detect** | Real-time onset detection identifies each individual hit in the audio stream. |
| 3 | **Cluster** | Machine learning groups similar-sounding hits together (e.g., knuckle taps vs. palm hits). |
| 4 | **Assign** | You map each cluster to a drum instrument sample -- kick, snare, hi-hat, and more. |
| 5 | **Quantize** | Timing snaps to a musical grid with adjustable BPM, resolution, and strength. |
| 6 | **Play** | The result loops as a polished beat with per-track volume, mute, and solo controls. |

## The Innovation

Every existing beat-making tool forces you to pick an instrument before you
play a note. TapBeats inverts this: **perform first, assign instruments later.**

You play your full rhythm freely, using whatever tapping techniques feel
natural. Only afterward does the app present the distinct sounds it detected
and let you map each one to a drum voice. This removes the cognitive overhead
of instrument selection during creative performance and lets rhythm ideas flow
without interruption.

## Features

- Record up to 2 minutes of tapping via device microphone
- Real-time onset detection with visual feedback and configurable sensitivity
- Automatic sound clustering with waveform previews and manual split/merge
- Built-in sample library: kicks, snares, hi-hats, toms, claps, rim shots, cowbell, shakers (3+ variations each)
- BPM auto-detection and manual override (40--240 BPM)
- Quantization with grid resolution (1/4, 1/8, 1/16, triplets) and adjustable strength
- Multi-track canvas timeline with hit markers, grid lines, and playback cursor
- Manual hit editing on timeline (move, add, delete)
- Per-track mute, solo, and volume controls
- Session save, load, rename, and delete via IndexedDB
- WAV audio export
- Dark and light themes with OS preference detection
- Installable PWA with offline support
- Responsive design from 320px to 2560px
- WCAG 2.1 AA accessibility compliance

## Screenshots

*Screenshots coming soon.*

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Language | TypeScript 5.7 | Type safety across the entire codebase |
| Framework | React 18.3 | UI components with concurrent rendering |
| Build | Vite 6 | Fast HMR, native ESM, AudioWorklet bundling |
| State | Zustand 5 | Lightweight state management with persistence middleware |
| Audio | Web Audio API + AudioWorklet | Low-latency, real-time audio capture and processing |
| Storage | IndexedDB via `idb` 8+ | Client-side persistence for sessions and audio buffers |
| Timeline | HTML5 Canvas 2D | 60fps rendering for the beat timeline |
| Testing | Vitest 2.1 + Playwright 1.49 | Unit, integration, and cross-browser E2E tests |
| Styling | CSS Modules | Scoped styles with design token system |
| CI/CD | GitHub Actions | Automated testing and deployment |

## Getting Started

### Prerequisites

- Node.js 20 LTS or later
- npm
- A modern browser (Chrome, Firefox, or Safari -- latest stable)
- A working microphone

### Install and Run

```bash
git clone https://github.com/msitarzewski/tapbeats.git
cd tapbeats
npm install
npm run dev
```

### Build for Production

```bash
npm run build
```

The output will be in `dist/`, ready for static hosting.

## Project Structure

```
tapbeats/
  docs/                     # Product requirements and specifications
    PRD.md                  # Master product requirements document
    sections/               # Detailed PRD sections (architecture, audio, UX, etc.)
  releases/
    mvp/                    # MVP release plan and milestone documents
  src/                      # Application source code
    components/             # React UI components
    audio/                  # Audio capture, onset detection, DSP
    clustering/             # Feature extraction and k-means clustering
    quantization/           # BPM detection and grid snapping
    playback/               # Sample playback engine
    timeline/               # Canvas-based timeline renderer
    store/                  # Zustand state management
    samples/                # Built-in instrument sample library
  public/                   # Static assets and PWA manifest
  tests/                    # Test suites (unit, integration, E2E)
```

## Documentation

The full product specification lives in `docs/`:

- [Product Requirements Document](docs/PRD.md) -- master overview and scope
- [Technical Architecture](docs/sections/technical-architecture.md) -- system design and data pipeline
- [Audio Engineering](docs/sections/audio-engineering.md) -- DSP algorithms and implementation
- [UI Design](docs/sections/ui-design.md) -- visual design system, wireframes, and interaction specs
- [Brand Strategy](docs/sections/brand-strategy.md) -- positioning, voice, and identity
- [Developer Experience](docs/sections/developer-experience.md) -- coding standards and workflow
- [Testing Strategy](docs/sections/testing-strategy.md) -- test pyramid and quality gates

## Roadmap

The MVP is planned across [10 milestones](releases/mvp/README.md) over 12 weeks:

1. Project Scaffolding -- build tooling, CI/CD, app shell
2. Audio Capture -- microphone access and raw audio buffering
3. Onset Detection -- real-time hit detection under 50ms latency
4. Sound Clustering -- automatic grouping of similar-sounding hits
5. Instrument Assignment -- sample library and smart defaults
6. Quantization -- BPM detection and grid snapping
7. Timeline and Playback -- multi-track timeline with playback engine
8. Session and Export -- IndexedDB persistence and WAV export
9. Polish and PWA -- offline support, accessibility, cross-browser testing
10. Launch -- deployment, documentation, and go-to-market

Milestone 7 is the first point where the full loop works end-to-end.

## Contributing

Contributions are welcome. Whether it is a bug report, a feature idea, a DSP
improvement, or a documentation fix -- all input helps.

A full contributing guide is coming soon. In the meantime, feel free to open
an issue or start a discussion.

## License

This project is licensed under the GNU Affero General Public License v3.0 — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

TapBeats is built on the belief that rhythm belongs to everyone. The project
draws on the maturity of the Web Audio API, advances in browser-based machine
learning, and the open source creative tools community that has proven
transparent, community-owned software can compete with commercial alternatives.

*Every surface is an instrument. Every person is a musician.*
