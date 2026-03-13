# TapBeats Active Context

## Current State

**Phase**: Milestone 2 complete. Ready for Milestone 3.
**Sprint**: Implementation — onset detection
**Last Updated**: 2026-03-12

---

## Active Work

- Milestone 1: Project Scaffolding & Infrastructure — **COMPLETE** (commit `34680be` on `milestone-1/scaffolding`)
- Milestone 2: Audio Capture & Microphone Pipeline — **COMPLETE** (on `milestone-2/audio-capture`)
  - Full audio capture pipeline: getUserMedia → AudioContext → AudioWorklet → RingBuffer
  - Recording UI: HomeScreen with record button, RecordingScreen with live waveform, timer, stats, stop button
  - Permission flow: pre-prompt overlay → browser permission → recording or error screen
  - 88 tests passing (11 test files), 0 lint errors, production build succeeds

---

## Next Actions

1. **Begin Milestone 3: Real-Time Onset Detection**
   - Spectral flux onset detection in AudioWorklet
   - FFT computation (radix-2, Hann window)
   - Adaptive threshold with running median
   - Audio snippet extraction per hit
   - Visual feedback (HitFlash already built, needs incrementHitCount wiring)
   - See: `releases/mvp/milestone-3-onset-detection.md`

2. **Merge milestone-1 and milestone-2 to main**
   - User review of completed work
   - Sequential merge of feature branches

3. **Create GitHub remote repository**

---

## Open Questions

- **License selection**: Open source, specific license TBD
- **Hosting platform**: Deployment target not yet decided (Vercel, Netlify, GitHub Pages, etc.)
- **GitHub remote**: Repository not yet created on GitHub

---

## Recent Decisions

- **Pre-prompt before getUserMedia**: MicPermissionOverlay shows BEFORE calling startRecording(), not during. The "Got it" button triggers the actual browser permission request. This prevents the overlay and browser prompt from appearing simultaneously.
- **Capture worklet uses double-buffer pool**: Two pre-allocated Float32Array buffers swapped on fill, avoiding allocations in process() hot path.
- **AudioCapture.stop()/dispose() are synchronous**: No async needed since cleanup is all synchronous DOM API calls. Avoids `require-await` lint errors.
- **Recording auto-stops at 120s**: Timer in useAudioCapture checks elapsed time and calls stopRecording().
- **Waveform subscribes outside React**: useWaveformRenderer uses `useRecordingStore.subscribe()` directly (not via selector) to avoid re-renders from high-frequency amplitude updates.
- All prior decisions remain in `memory-bank/decisions.md`.

---

## Context Notes

- PRD is comprehensive (17,500+ lines) — always check section docs before implementing
- MVP is 10 milestones over 12 weeks, strictly sequential (each builds on previous)
- Milestone 7 (Timeline & Playback) is the first end-to-end "magic moment" checkpoint
- iOS Safari AudioWorklet support is a known risk — ScriptProcessorNode fallback planned
- All milestones now have "Implementation Notes" sections with TypeScript/lint gotchas
- **Multi-agent parallel execution works well**: M2 used 3 parallel agents (audio engine, UI, tests) with orchestrator fixes. Key lesson: agents need very precise lint rule instructions to avoid post-hoc cleanup.
