# Changelog

All notable changes to TapBeats will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-13

### Added
- Audio capture pipeline with microphone input (getUserMedia, AudioWorklet)
- Real-time onset detection using spectral flux analysis with RMS energy gating
- 12-dimensional feature extraction (RMS, spectral centroid, rolloff, flatness, ZCR, attack/decay, MFCCs)
- K-means++ sound clustering with automatic K selection via silhouette scoring
- 18-instrument sample library across 5 categories (kicks, snares, hi-hats, toms, percussion)
- Smart instrument assignment using weighted Euclidean distance to idealized drum profiles
- BPM detection via inter-onset interval histogram with Gaussian smoothing
- Grid quantization with 6 resolutions (1/4 to 1/32 notes), adjustable strength and swing
- Interactive timeline with Canvas 2D rendering at 60fps
- Track controls: mute, solo, volume per track and master
- Hit editing: drag-to-move with grid snap, double-click to add, right-click to delete
- Undo/redo system (50-depth snapshot-based)
- Keyboard shortcuts (Space, L, M, S, 1-9, Ctrl+Z/Y, +/-)
- Session persistence via IndexedDB (auto-save with 2s debounce)
- WAV export (stereo 16-bit PCM via OfflineAudioContext)
- PWA with service worker precaching and offline support
- Installable on mobile and desktop (beforeinstallprompt + Add to Home Screen)
- Service worker update detection with user notification
- 4-step onboarding overlay for first-time users
- Cross-browser feature detection with unsupported browser fallback
- iOS Safari AudioContext warm-up and background tab handling
- Touch event support for mobile timeline editing
- Full accessibility: skip-to-content, focus trap, ARIA labels, screen reader timeline table
- Reduced motion support (prefers-reduced-motion media query)
- Code-split routes via React.lazy() for performance
- Self-hosted WOFF2 fonts (Inter + JetBrains Mono)
- CI/CD with GitHub Actions (lint, typecheck, unit tests, build, Playwright E2E)
- 605 tests across 59 test files
