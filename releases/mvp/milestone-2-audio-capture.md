# Milestone 2: Audio Capture & Microphone Pipeline

**Target**: Week 2
**Status**: Not Started
**Dependencies**: Milestone 1 (Project Scaffolding)

---

## Objective

Implement the complete audio capture pipeline — from microphone permission request through to raw audio buffering. Users should be able to hit record, see a live waveform, and have the raw audio stored in memory for processing.

## Deliverables

### 2.1 Microphone Permission Flow
- [ ] Permission request with pre-prompt explanation (FR-002)
- [ ] "Audio never leaves your device" messaging
- [ ] Handle permission granted → proceed to recording
- [ ] Handle permission denied → show recovery instructions (FR-010)
- [ ] Handle no microphone hardware detected (FR-011)
- [ ] Handle browser not supported → show supported browser list (NFR-013)

### 2.2 AudioContext & MediaStream Setup
- [ ] Create `AudioCapture` module per developer-experience interfaces
- [ ] `getUserMedia` with correct constraints (disable echo cancellation, noise suppression, AGC)
- [ ] AudioContext creation with user gesture handling (iOS Safari)
- [ ] AudioContext resume on user interaction
- [ ] Sample rate detection and normalization

### 2.3 AudioWorklet for Capture
- [ ] Create `capture-worklet.ts` AudioWorklet processor
- [ ] Ring buffer implementation for audio data transfer
- [ ] Main thread ↔ AudioWorklet communication via MessagePort
- [ ] Raw audio buffering in Float32Array chunks
- [ ] Memory management (bounded buffer for 2-minute max)

### 2.4 Recording UI (per `ui-design.md` Section 3 — Recording Screen)
- [ ] Home screen: dominant Record button (64px, `--accent-primary`, spring scale animation)
- [ ] Recording screen with live waveform (Canvas, `--accent-primary` stroke, 2px, mirrored)
- [ ] Level meter showing input amplitude (FR-003)
- [ ] Countdown timer showing remaining time (FR-005)
- [ ] "Stop Recording" button (FR-007)
- [ ] Auto-stop at 2-minute limit (FR-008)
- [ ] Visual "listening" indicator (concentric ring pulse, 2s ease-in-out infinite)
- [ ] Stats bar: hit count + elapsed time + peak level

### 2.5 State Management
- [ ] `recordingStore` Zustand slice (recording state, raw audio buffer, elapsed time)
- [ ] State machine: idle → requesting_permission → recording → processing → complete

### 2.6 Tests
- [ ] Unit: AudioCapture module with mocked MediaStream
- [ ] Unit: Ring buffer implementation
- [ ] Unit: State transitions in recordingStore
- [ ] Integration: Permission flow (mock getUserMedia)
- [ ] E2E: Full record flow with fake audio stream (Playwright)

## Acceptance Criteria

- [ ] Microphone permission requested with clear explanation (FR-002)
- [ ] Permission denial handled gracefully with recovery path (FR-010)
- [ ] Live waveform renders during recording at 60fps (FR-003, NFR-002)
- [ ] Audio data buffered correctly for up to 2 minutes (FR-004, FR-009)
- [ ] Recording auto-stops at 2 minutes (FR-008)
- [ ] Works on Chrome, Firefox, Safari desktop
- [ ] Works on iOS Safari and Chrome Android
- [ ] No audio data leaves the device (NFR-027)

## Relevant PRD References

- `product-requirements.md` — FR-001 through FR-011
- `audio-engineering.md` — Section 1 (Web Audio API), Section 8 (Performance)
- `technical-architecture.md` — Sections 1-2 (System overview, Audio pipeline)
- `ui-design.md` — Recording screen design
