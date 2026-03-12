# TapBeats -- Project Brief

**Tagline:** Tap anything. Make music.

---

## Vision

Every surface is an instrument. Every person is a musician.

TapBeats envisions a world where the barrier between rhythmic impulse and musical creation disappears entirely -- where the universal human instinct to tap, drum, and beat on surfaces becomes a direct pathway to making real music.

## Mission

TapBeats makes it effortless for anyone to turn everyday tapping into polished, shareable beats by capturing acoustic gestures, intelligently clustering distinct sounds, mapping them to real instrument samples, and quantizing the timing -- all in a web browser, with no accounts, no downloads, and no musical training required.

## Core Value Proposition

TapBeats turns the sounds you already make -- tapping on tables, cups, your chest, anything -- into real music in seconds.

## The Innovation: Perform First, Assign Instruments Later

Every existing beat-making tool forces you to pick an instrument before you play a note. TapBeats inverts this: you perform your full rhythm freely, using whatever tapping techniques feel natural. Only afterward does the app present the distinct sounds it detected and let you map each one to a drum voice. This removes the cognitive overhead of instrument selection during creative performance and lets rhythm ideas flow without interruption.

---

## Problem Statement

Creating drum beats today requires either expensive hardware (drum machines, MIDI controllers, electronic kits) or fluency with complex DAW software. The most intuitive way humans have always created rhythm -- tapping and hitting things -- is completely disconnected from the tools that produce music. Casual users, beginners, and anyone who just wants to sketch a rhythm idea face a steep barrier to entry.

## Solution: The 6-Step Flow

1. **Tap** -- User taps a rhythm on any surface while the app records via microphone.
2. **Detect** -- Real-time onset detection identifies each individual hit in the audio stream.
3. **Cluster** -- ML groups similar-sounding hits together (e.g., all knuckle taps in one cluster, all palm hits in another).
4. **Assign** -- User maps each cluster to a drum instrument sample (kick, snare, hi-hat, etc.).
5. **Quantize** -- Timing is snapped to a musical grid with adjustable strength, BPM, and resolution.
6. **Play** -- The result loops as a polished beat with per-track volume, mute, and solo controls.

The entire workflow runs locally in the browser with zero server dependency. Audio never leaves the device.

---

## Target Users

**Primary -- Casual Rhythm Makers:** People who already tap and drum on surfaces habitually but do not identify as musicians. Ages 13-45, skewing 16-30. Motivated by curiosity, novelty, social sharing, and self-expression without intimidation.

**Secondary -- Music Enthusiasts & Hobbyists:** Active music creators who are not professionals. May own a MIDI controller or have tried GarageBand. Motivated by the novel creative input method, quick idea capture, and augmenting existing workflows.

**Tertiary -- Producers & Educators:** Professional/semi-professional producers, music teachers, and music therapy practitioners. Motivated by unique sample sourcing, rapid beat prototyping, teaching rhythm concepts accessibly, and rhythm-based therapy exercises.

---

## Platform Strategy

**Web-first Progressive Web App.** All audio capture, onset detection, feature extraction, clustering, quantization, and playback run on-device in the browser. The choice to go web-first means:

- No app store gatekeeping; instant access via URL
- Offline-capable after first load via service worker
- Single codebase for desktop and mobile
- PWA installable on any platform
- Privacy by architecture -- audio never leaves the device

**Browser targets:** Chrome, Firefox, Safari (latest stable desktop), iOS Safari 15+, Chrome for Android 90+. Responsive from 320px to 2560px viewport width.

**Core stack:** TypeScript 5.4+, React 18+, Vite 5+, Zustand 4+, Web Audio API + AudioWorklet, IndexedDB, HTML5 Canvas 2D, Vitest, CSS Modules.

---

## Open Source

License TBD. Community-first from day one. Open source is a strategic advantage for TapBeats: it aligns with the mission that rhythm belongs to everyone, builds trust around microphone access through code transparency, creates a community-driven competitive moat, and unlocks distribution channels (GitHub trending, Hacker News, developer communities) unavailable to proprietary products.

---

## MVP Scope

### Included

- Full audio capture pipeline (microphone access, recordings up to 2 minutes)
- Real-time onset detection with visual feedback and configurable sensitivity
- Automatic sound clustering with waveform previews and manual split/merge
- Instrument assignment with preview, browse, and smart suggestions
- Built-in sample library: kicks, snares, hi-hats, toms, claps, rim shots, cowbell, shakers/tambourine (3+ variations each)
- BPM auto-detection and manual override (40-240 BPM)
- Quantization with grid resolution (1/4, 1/8, 1/16, triplets), strength 0-100%, before/after comparison
- Multi-track timeline with hit markers, grid lines, and playback cursor
- Per-track mute, solo, volume; master volume; manual hit editing (move, add, delete)
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

## Success Metrics

**North Star Metric:** Beats completed per week (a "completed beat" = user tapped, sounds were clustered, instruments were assigned, and the beat played back at least once).

| Category | Metric | Target (Month 6) |
|----------|--------|-------------------|
| Activation | % of visitors who complete first beat | > 40% |
| Engagement | Beats per active user per week | > 2.5 |
| Retention | Week-1 return rate | > 25% |
| Virality | Share rate (% sessions generating a link) | > 15% |
| Virality | K-factor (viral coefficient) | > 0.3 |
| Community | GitHub stars | > 5,000 |
| Community | Monthly active contributors | > 25 |
| Quality | Beat completion rate (started vs. completed) | > 60% |
| Performance | Time from page load to first beat playback | < 90 seconds |

**Key MVP acceptance gates:** First-time user completes full flow in under 5 minutes; 3 distinct tapping sounds reliably separated into clusters in 80%+ of sessions; clustering completes in under 3 seconds; seamless loop playback with no audible gaps; full offline functionality after first load; WCAG 2.1 AA compliance (Lighthouse score >= 90).

---

*Source documents: `docs/PRD.md`, `docs/sections/brand-strategy.md`, `docs/sections/product-requirements.md`*
