# Product Requirements

> TapBeats PRD -- Core Product Requirements
> Version: 1.0.0 | Date: 2026-03-12 | Status: Draft

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Functional Requirements](#2-functional-requirements)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [User Stories](#4-user-stories)
5. [Scope Boundaries](#5-scope-boundaries)
6. [Dependencies & Assumptions](#6-dependencies--assumptions)
7. [Acceptance Criteria for MVP](#7-acceptance-criteria-for-mvp)

---

## 1. Product Overview

### 1.1 Summary

TapBeats is an open-source, web-first application that lets anyone create drum beats by tapping on any surface -- a table, a cardboard box, their lap, a book. The app captures the raw audio, automatically detects each individual hit, groups similar-sounding hits into clusters, and then lets the user assign a real instrument sample (kick, snare, hi-hat, etc.) to each cluster. The timing is quantized to a musical grid and played back as a polished, looping beat. No musical training, no drum kit, no MIDI controller required -- just hands and a surface.

### 1.2 Problem Statement

Creating drum beats today requires either expensive hardware (drum machines, MIDI controllers, electronic drum kits) or fluency with complex DAW software (placing hits on a grid in Ableton, Logic, FL Studio). Casual users, beginners, and people who just want to sketch a rhythm idea face a steep barrier to entry. The result is that the most intuitive way humans have always made rhythm -- tapping and hitting things -- is disconnected from the tools that produce music.

### 1.3 Solution Statement

TapBeats bridges the gap between physical, intuitive rhythm performance and digital beat production. Users perform naturally by tapping on any surface. The application handles the technical translation: detecting hits, distinguishing between different sounds, and mapping them onto real instrument samples with proper musical timing. The entire workflow runs locally in the browser with zero server dependency.

### 1.4 Key Innovation

**Perform first, assign instruments later.** Traditional beat-making forces users to choose an instrument before playing a note. TapBeats inverts this: users perform their full rhythm freely, using whatever surfaces and tapping techniques feel natural. Only after the performance is captured does the app present the distinct sounds it detected, and the user assigns each one to a drum instrument. This removes the cognitive load of instrument selection during performance and lets creativity flow uninterrupted.

---

## 2. Functional Requirements

All functional requirements are numbered sequentially (FR-001 through FR-072) and assigned a priority:

- **P0** -- Must have for MVP launch. The app is non-functional without these.
- **P1** -- Should have for MVP launch. The app is usable without these but significantly less valuable.
- **P2** -- Nice to have. Deferred past MVP unless trivially implementable.

---

### 2.1 Audio Capture (P0)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | The app shall capture audio from the device microphone using the Web Audio API (`getUserMedia` + `AudioContext`). | P0 |
| FR-002 | The app shall request microphone permission with a clear, user-facing explanation of why microphone access is needed before the browser permission prompt appears. The explanation shall state that audio is processed locally and never transmitted. | P0 |
| FR-003 | The app shall display real-time visual feedback during recording, consisting of: (a) an animated waveform showing the live audio signal, and (b) a level meter showing current input amplitude. | P0 |
| FR-004 | The app shall support recording sessions of up to 2 minutes (120 seconds) in duration. | P0 |
| FR-005 | The app shall display a countdown timer showing remaining recording time during an active session. | P0 |
| FR-006 | The app shall provide a clearly labeled "Start Recording" button that begins audio capture. | P0 |
| FR-007 | The app shall provide a clearly labeled "Stop Recording" button that ends audio capture and initiates the onset detection and clustering pipeline. | P0 |
| FR-008 | The app shall automatically stop recording when the 2-minute maximum duration is reached and proceed to clustering. | P0 |
| FR-009 | The app shall buffer raw audio data in memory during recording for subsequent onset detection and clustering analysis. | P0 |
| FR-010 | The app shall handle microphone permission denial gracefully, displaying a clear message explaining that microphone access is required and how to enable it in browser settings. | P0 |
| FR-011 | The app shall handle the case where no microphone hardware is detected, displaying an appropriate error message. | P0 |

---

### 2.2 Onset Detection (P0)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-012 | The app shall perform real-time onset (hit) detection during recording, identifying each distinct percussive transient in the audio stream. | P0 |
| FR-013 | The app shall display a visual indicator (flash, pulse, or marker) for each detected hit in real time during recording, providing immediate feedback that the tap was registered. | P0 |
| FR-014 | The app shall enforce a minimum inter-onset interval of 20 milliseconds. Any detected onset occurring within 20ms of the previous onset shall be discarded as a duplicate. | P0 |
| FR-015 | The app shall provide a configurable sensitivity control (exposed in settings, see FR-071) that adjusts the onset detection threshold. Higher sensitivity detects quieter taps; lower sensitivity rejects background noise. | P0 |
| FR-016 | The app shall record the precise timestamp (in milliseconds relative to recording start) of each detected onset. | P0 |
| FR-017 | The app shall extract a short audio snippet (window) around each detected onset for use in the clustering pipeline. The extraction window shall capture sufficient audio to characterize the timbre of the hit (recommended: 50ms--200ms). | P0 |
| FR-018 | The app shall display a running count of total detected hits during recording. | P1 |

---

### 2.3 Sound Clustering (P0)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-019 | After recording stops, the app shall automatically group detected hits into clusters based on timbral similarity. Hits that sound alike (e.g., all taps on the same surface with the same technique) shall be placed in the same cluster. | P0 |
| FR-020 | The app shall present clusters visually, with each cluster displayed as a distinct card or panel containing: (a) a representative waveform preview of the cluster's sound, (b) the number of hits in the cluster, and (c) a unique color identifier. | P0 |
| FR-021 | The app shall allow the user to play back a representative audio sample for each cluster by clicking/tapping the cluster's waveform or a play button on the cluster card. | P0 |
| FR-022 | The app shall display the total number of clusters detected. | P0 |
| FR-023 | The app shall allow the user to split a cluster into two or more sub-clusters. When splitting, the app shall present the individual hits within the cluster and allow the user to select which hits belong to which sub-cluster. | P0 |
| FR-024 | The app shall allow the user to merge two or more clusters into a single cluster. The user shall select multiple clusters and trigger a merge action. | P0 |
| FR-025 | The clustering algorithm shall handle a minimum of 3 and a maximum of 12 distinct clusters per recording session. | P0 |
| FR-026 | If the algorithm produces more than 12 clusters, it shall automatically merge the most similar clusters until 12 or fewer remain, and shall notify the user that automatic merging occurred. | P1 |
| FR-027 | If the algorithm produces only 1 cluster (all hits sound identical), the app shall present the single cluster and allow the user to proceed or attempt to split it. | P0 |

---

### 2.4 Instrument Assignment (P0)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-028 | For each cluster, the app shall present a browsable list of available instrument samples that can be assigned to that cluster. | P0 |
| FR-029 | The instrument sample library shall include, at minimum, the following categories: kick drums, snare drums, hi-hats (open and closed), toms (high, mid, low), claps, rim shots, cowbell, and shakers/tambourine. | P0 |
| FR-030 | The app shall allow the user to preview (audition) any instrument sample before assigning it, by clicking/tapping on the sample in the browse list. | P0 |
| FR-031 | The app shall assign each instrument a distinct color that is applied consistently across the cluster card, timeline track, and all UI elements referencing that instrument. | P0 |
| FR-032 | The app shall provide default instrument suggestions for each cluster based on the acoustic characteristics of the cluster's representative sound. Low-frequency, boomy sounds shall suggest kick drums. High-frequency, sharp sounds shall suggest hi-hats. Mid-frequency snappy sounds shall suggest snares. | P0 |
| FR-033 | The user shall be able to override any default suggestion and assign any available instrument to any cluster. | P0 |
| FR-034 | The app shall allow the user to change an instrument assignment at any time after initial assignment, including during timeline/playback view. The change shall take effect immediately on next playback. | P0 |
| FR-035 | The app shall include at least 3 sample variations per instrument category (e.g., 3 different kick drum samples). | P1 |
| FR-036 | The app shall allow the user to skip instrument assignment for a cluster, effectively muting that cluster's hits in playback. | P1 |

---

### 2.5 Quantization (P0)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-037 | The app shall auto-detect the BPM (beats per minute) of the recorded performance using onset timing analysis. | P0 |
| FR-038 | The app shall display the detected BPM to the user and allow manual override via a numeric input field. The allowed BPM range shall be 40--240 BPM. | P0 |
| FR-039 | The app shall provide grid resolution selection with the following options: 1/4 notes, 1/8 notes, 1/16 notes, 1/4 note triplets, 1/8 note triplets, and 1/16 note triplets. | P0 |
| FR-040 | The app shall provide a quantization strength control, expressed as a percentage from 0% (no quantization -- original timing preserved exactly) to 100% (full quantization -- every hit snapped exactly to the nearest grid line). | P0 |
| FR-041 | The app shall provide before/after comparison playback: the user can toggle between hearing the original (unquantized) timing and the quantized timing. | P0 |
| FR-042 | The app shall visually indicate on the timeline how far each hit was moved by quantization (e.g., ghost marker at original position, solid marker at quantized position). | P1 |
| FR-043 | Quantization shall be non-destructive. The original onset timestamps shall be preserved, and quantization shall be re-computable at any time with different parameters. | P0 |
| FR-044 | The app shall apply quantization in real time as the user adjusts BPM, grid resolution, or strength -- no separate "apply" step required. | P0 |

---

### 2.6 Timeline & Playback (P0)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-045 | The app shall display a multi-track timeline view with one horizontal track per instrument/cluster. Each track shall show hit markers at their (quantized) time positions. | P0 |
| FR-046 | The app shall provide play, stop, and loop toggle controls for playback. | P0 |
| FR-047 | The app shall display a visual playback cursor (vertical line) that moves across the timeline in sync with audio playback. | P0 |
| FR-048 | The app shall provide per-track mute and solo controls. Muting a track silences it during playback. Soloing a track silences all other tracks. | P0 |
| FR-049 | The app shall provide per-track volume control (slider or knob) allowing the user to adjust the relative volume of each instrument track. | P0 |
| FR-050 | The app shall provide a master volume control affecting overall output level. | P0 |
| FR-051 | When loop mode is active, playback shall loop seamlessly from the end of the beat back to the beginning with no audible gap or click. | P0 |
| FR-052 | The app shall allow the user to drag/move individual hit markers on the timeline to adjust their timing manually. | P1 |
| FR-053 | The app shall allow the user to add new hits by clicking/tapping on an empty position in a track on the timeline. | P1 |
| FR-054 | The app shall allow the user to delete individual hits by selecting a hit marker and pressing delete or using a context action. | P1 |
| FR-055 | The timeline shall display grid lines corresponding to the selected quantization grid resolution. | P0 |

---

### 2.7 Session Management (P1)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-056 | The app shall save the current session (all recording data, clusters, assignments, quantization settings, and timeline state) to browser local storage (IndexedDB). | P1 |
| FR-057 | The app shall allow the user to load a previously saved session from a session list view. | P1 |
| FR-058 | The app shall allow the user to delete a saved session, with a confirmation dialog before deletion. | P1 |
| FR-059 | The app shall allow the user to name or rename a session. Sessions without a user-provided name shall be auto-named with a timestamp (e.g., "Session -- 2026-03-12 14:30"). | P1 |
| FR-060 | The app shall display a list of saved sessions with name, date created, date modified, duration, and BPM. | P1 |

---

### 2.8 Export (P1/P2)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-061 | The app shall export the current beat as a stereo WAV audio file. The export shall render all tracks with their current volume levels, instrument assignments, and quantization applied. | P1 |
| FR-062 | The app shall export the current beat as a MIDI file, with each cluster/instrument on a separate MIDI channel. | P2 |
| FR-063 | The app shall generate a shareable URL that encodes the session state, allowing another user to open the beat in their browser. | P2 |

---

### 2.9 Layering (P1)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-064 | The app shall allow the user to record additional audio layers over an existing beat. During layered recording, the existing beat plays back through speakers/headphones while the microphone captures new taps. | P1 |
| FR-065 | New layers shall go through the same onset detection and clustering pipeline. New clusters may be merged with existing clusters or kept separate. | P1 |
| FR-066 | The app shall allow the user to merge all layers into a single unified arrangement on the timeline. | P1 |

---

### 2.10 Settings (P1)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-067 | The app shall allow the user to select the audio input device when multiple microphone sources are available. | P1 |
| FR-068 | The app shall allow the user to set a default BPM that is used as the initial value for new sessions. | P1 |
| FR-069 | The app shall allow the user to set a default grid resolution for new sessions. | P1 |
| FR-070 | The app shall provide a theme selection between dark mode and light mode. The app shall default to the user's OS-level preference (`prefers-color-scheme`). | P1 |
| FR-071 | The app shall allow the user to adjust onset detection sensitivity from the settings panel (same control referenced in FR-015). | P1 |
| FR-072 | The app shall persist all settings to browser local storage so they survive page reloads and browser restarts. | P1 |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | Onset detection latency (time from physical tap to visual indicator on screen) | < 50ms |
| NFR-002 | UI rendering frame rate during recording and playback | 60 fps sustained |
| NFR-003 | Time from "Stop Recording" to clusters presented to user | < 2 seconds for recordings up to 60s; < 3 seconds for recordings up to 120s |
| NFR-004 | Playback start latency (time from pressing Play to first audible sound) | < 100ms |
| NFR-005 | Quantization recalculation time (when user changes BPM, grid, or strength) | < 200ms for up to 500 hits |
| NFR-006 | WAV export rendering time | < 10 seconds for a 2-minute, 8-track beat |
| NFR-007 | Initial page load time (first visit, cold cache) | < 3 seconds on broadband (10 Mbps+) |
| NFR-008 | Subsequent page load time (cached/service worker) | < 1 second |
| NFR-009 | Memory usage during recording | < 200 MB for a 2-minute recording session |
| NFR-010 | Audio playback loop gap (silence between loop end and loop start) | < 5ms (imperceptible) |

### 3.2 Browser Support

| ID | Requirement |
|----|-------------|
| NFR-011 | Desktop: Google Chrome 90+, Mozilla Firefox 90+, Apple Safari 15+, Microsoft Edge 90+ |
| NFR-012 | Mobile: iOS Safari 15+ (iPhone and iPad), Chrome for Android 90+ |
| NFR-013 | The app shall detect unsupported browsers and display a clear message listing supported browsers. |
| NFR-014 | The app shall not require any browser extensions or plugins. |

### 3.3 Offline Capability

| ID | Requirement |
|----|-------------|
| NFR-015 | After the initial page load, the app shall function fully without an internet connection. A service worker shall cache all application assets and instrument samples. |
| NFR-016 | The app shall be installable as a Progressive Web App (PWA) on supported platforms. |

### 3.4 Storage

| ID | Requirement |
|----|-------------|
| NFR-017 | Session data shall be stored in IndexedDB. The app shall handle storage quota limits gracefully, warning the user when storage is nearly full and preventing data loss. |
| NFR-018 | The app shall display current storage usage in the settings panel. |
| NFR-019 | Individual session storage shall not exceed 50 MB. The app shall warn if a session approaches this limit. |

### 3.5 Accessibility

| ID | Requirement |
|----|-------------|
| NFR-020 | The app shall conform to WCAG 2.1 Level AA guidelines. |
| NFR-021 | All interactive elements shall be keyboard-navigable. |
| NFR-022 | All images, icons, and visual indicators shall have appropriate `aria-label` or `alt` text. |
| NFR-023 | Color shall not be the sole means of conveying information. All color-coded elements (instrument colors, cluster colors) shall also use shape, pattern, or text labels. |
| NFR-024 | The app shall support screen readers for non-audio-production UI elements (navigation, settings, session management). |
| NFR-025 | All text shall meet minimum contrast ratios (4.5:1 for normal text, 3:1 for large text). |
| NFR-026 | Focus indicators shall be clearly visible on all interactive elements. |

### 3.6 Privacy

| ID | Requirement |
|----|-------------|
| NFR-027 | No audio data, session data, or usage data shall be transmitted to any server. All processing shall occur entirely within the user's browser. |
| NFR-028 | The app shall not use cookies or any third-party tracking scripts. |
| NFR-029 | The app shall not include any analytics or telemetry. |
| NFR-030 | The microphone permission explanation (FR-002) shall explicitly state that audio never leaves the device. |

### 3.7 Security

| ID | Requirement |
|----|-------------|
| NFR-031 | The app shall enforce a Content Security Policy (CSP) that restricts script and resource loading to the application's own origin. |
| NFR-032 | The app shall not load any external resources at runtime (no CDNs, no external fonts, no remote APIs). All assets shall be bundled and served from the same origin. |
| NFR-033 | The app shall be served over HTTPS. |
| NFR-034 | Shareable URLs (FR-063) shall not contain raw audio data. They shall encode only onset timestamps, cluster assignments, instrument mappings, and quantization settings. |

### 3.8 Code Quality & Maintainability

| ID | Requirement |
|----|-------------|
| NFR-035 | The codebase shall be open source under an OSI-approved license. |
| NFR-036 | The app shall include automated tests with a minimum of 80% code coverage for core algorithms (onset detection, clustering, quantization). |
| NFR-037 | The app shall use TypeScript for type safety across the entire codebase. |
| NFR-038 | The app shall include a documented build process that can be executed with a single command. |

---

## 4. User Stories

User stories are grouped by epic and follow the format: "As a [persona], I want to [action], so that [benefit]." Each story includes acceptance criteria.

**Personas**:
- **Casual User** -- No musical background, wants to have fun making beats.
- **Beatmaker** -- Some music experience, wants to sketch rhythm ideas quickly.
- **Educator** -- Music teacher using the app as a teaching tool.

---

### Epic 1: Recording

**US-001: Start a Recording**
As a casual user, I want to tap a single button to start recording my taps, so that I can begin making a beat without any setup.

*Acceptance Criteria:*
- A prominent "Start Recording" button is visible on the home screen.
- Tapping the button requests microphone permission (if not already granted) with a clear explanation.
- After permission is granted, recording begins immediately and visual feedback (waveform + level meter) appears.
- A timer shows elapsed and remaining time.

**US-002: See My Taps Registered**
As a casual user, I want to see a visual flash each time the app detects one of my taps, so that I know my taps are being picked up.

*Acceptance Criteria:*
- Each detected onset triggers a visible indicator (flash, pulse, counter increment) within 50ms.
- The indicator is distinct enough to notice during active tapping.
- A running hit count is displayed.

**US-003: Stop Recording When Ready**
As a beatmaker, I want to stop recording at any point during my session, so that I can control the length of my beat.

*Acceptance Criteria:*
- A "Stop Recording" button is visible at all times during recording.
- Pressing stop immediately ends recording and transitions to the clustering view.
- No audio data is lost between the last tap and pressing stop.

**US-004: Handle Missing Microphone**
As a casual user, I want to see a clear error message if my device has no microphone, so that I understand why the app cannot work.

*Acceptance Criteria:*
- If no microphone is detected, a message explains the requirement.
- The message does not use technical jargon.
- The user is not stuck on a broken screen; they can navigate away or retry.

---

### Epic 2: Clustering

**US-005: See Grouped Sounds**
As a casual user, I want the app to automatically group my taps into categories based on how they sound, so that I can see the different "instruments" I created.

*Acceptance Criteria:*
- After recording stops, clusters appear within 3 seconds.
- Each cluster is visually distinct (color, label).
- Each cluster shows a hit count and waveform preview.
- At least 1 and up to 12 clusters are presented.

**US-006: Listen to a Cluster**
As a beatmaker, I want to play back a representative sample from each cluster, so that I can hear what each group sounds like.

*Acceptance Criteria:*
- Each cluster card has a play button.
- Pressing play audibly plays a representative sample from that cluster.
- Only one cluster sample plays at a time (pressing play on another stops the current one).

**US-007: Split a Cluster**
As a beatmaker, I want to split a cluster that contains two different-sounding hits, so that I can assign them to different instruments.

*Acceptance Criteria:*
- A "Split" action is available on each cluster with more than one hit.
- Splitting presents the individual hits within the cluster with playback capability.
- The user can select which hits go into which sub-cluster.
- After confirming, two (or more) new clusters replace the original.
- Cluster colors update to reflect the new groupings.

**US-008: Merge Clusters**
As a casual user, I want to merge two clusters that sound the same to me, so that they are treated as one instrument.

*Acceptance Criteria:*
- The user can select two or more clusters and trigger a merge action.
- The merged cluster combines all hits from the source clusters.
- The merged cluster adopts a single color and shows the combined hit count.
- The source clusters are removed from the view.

---

### Epic 3: Instrument Assignment

**US-009: Assign an Instrument to a Cluster**
As a casual user, I want to browse instrument sounds and assign one to each cluster, so that my taps become real drum sounds.

*Acceptance Criteria:*
- Clicking "Assign Instrument" on a cluster opens a browsable list of instruments.
- Instruments are organized by category (kicks, snares, hi-hats, etc.).
- Selecting an instrument assigns it to the cluster and updates the color coding.
- The assignment is reflected immediately in the cluster card.

**US-010: Preview Before Assigning**
As a beatmaker, I want to preview an instrument sound before assigning it, so that I can pick the right one without trial and error.

*Acceptance Criteria:*
- Clicking an instrument in the browse list plays its sample.
- The preview plays immediately without delay.
- The user can audition multiple samples quickly by clicking through the list.
- Previewing does not automatically assign the instrument.

**US-011: See Smart Suggestions**
As a casual user, I want the app to suggest which instrument fits each cluster, so that I do not have to browse the entire library for every cluster.

*Acceptance Criteria:*
- Each cluster has a default suggested instrument pre-selected.
- The suggestion is based on acoustic characteristics (low = kick, sharp high = hat, mid snap = snare).
- The user can accept the suggestion with one click or override it by browsing.

**US-012: Change an Assignment Later**
As a beatmaker, I want to change an instrument assignment while on the timeline view, so that I can experiment with different sounds without starting over.

*Acceptance Criteria:*
- Each track on the timeline provides access to change the assigned instrument.
- Changing the instrument takes effect immediately on the next playback.
- The track color updates to match the new instrument.

---

### Epic 4: Quantization & Timeline

**US-013: Quantize My Beat**
As a casual user, I want the app to snap my taps to a musical grid, so that my beat sounds tight and in time even if my tapping was imperfect.

*Acceptance Criteria:*
- After instrument assignment, the app auto-detects BPM and applies default quantization.
- The quantized beat plays back sounding rhythmically coherent.
- The user can adjust BPM, grid resolution, and quantization strength via visible controls.
- Changes apply in real time without a separate "apply" step.

**US-014: Compare Before and After Quantization**
As a beatmaker, I want to toggle between my original timing and the quantized timing, so that I can decide how much quantization to apply.

*Acceptance Criteria:*
- A toggle or A/B button switches between original and quantized playback.
- The switch is instantaneous (no reloading or recalculation delay perceptible to the user).
- Visual markers on the timeline update to reflect whichever version is active.

**US-015: Control Individual Tracks**
As a beatmaker, I want to mute, solo, and adjust the volume of each track, so that I can focus on specific parts of my beat.

*Acceptance Criteria:*
- Each track has mute and solo buttons.
- Each track has a volume slider.
- Muting a track silences it immediately during playback.
- Soloing a track silences all others immediately.
- Volume changes take effect in real time during playback.

**US-016: Loop My Beat**
As a casual user, I want my beat to loop continuously, so that I can hear how it sounds repeating.

*Acceptance Criteria:*
- A loop toggle is available in the playback controls.
- When enabled, playback loops seamlessly with no audible gap.
- The playback cursor resets to the beginning visually on each loop.

**US-017: Edit Hits on the Timeline**
As a beatmaker, I want to move, add, and delete individual hits on the timeline, so that I can fine-tune my beat after recording.

*Acceptance Criteria:*
- Hits can be dragged to new time positions on their track.
- Clicking an empty grid position adds a new hit.
- Selecting a hit and pressing delete (or using a context action) removes it.
- All edits are reflected in playback immediately.

---

### Epic 5: Session Management & Export

**US-018: Save My Beat**
As a casual user, I want to save my beat so I can come back to it later, so that I do not lose my work when I close the browser.

*Acceptance Criteria:*
- A "Save" button is accessible from the timeline view.
- Saving stores all session data (onsets, clusters, assignments, quantization, volumes) to IndexedDB.
- A confirmation message appears after successful save.
- The user can optionally name the session at save time.

**US-019: Load a Previous Beat**
As a beatmaker, I want to see a list of my saved beats and load any one of them, so that I can continue working on a previous idea.

*Acceptance Criteria:*
- A "My Sessions" view shows all saved sessions.
- Each session displays its name, date, duration, and BPM.
- Selecting a session loads it fully into the timeline view, ready for playback.

**US-020: Export as Audio**
As a beatmaker, I want to export my beat as a WAV file, so that I can use it in my DAW or share it with others.

*Acceptance Criteria:*
- An "Export WAV" button is available from the timeline view.
- The export renders all tracks with current volume and instrument settings.
- The exported file downloads to the user's device as a .wav file.
- The export completes in under 10 seconds for a typical beat.

**US-021: Use in a Classroom**
As an educator, I want my students to create beats by tapping on desks and hear them played back as real instruments, so that I can teach rhythm concepts in an engaging, hands-on way.

*Acceptance Criteria:*
- The app works on school Chromebooks and iPads (Chrome 90+, Safari 15+).
- No account, login, or network connection required after initial load.
- Students can complete the full flow (record, cluster, assign, play) in under 5 minutes.
- The UI is simple enough that no instruction manual is needed for ages 10+.

---

## 5. Scope Boundaries

### 5.1 In Scope for MVP

The following capabilities are included in the MVP release:

- Full audio capture pipeline (microphone access, recording, buffering up to 2 minutes)
- Real-time onset detection with visual feedback and configurable sensitivity
- Automatic sound clustering with waveform previews and hit counts
- Manual cluster split and merge operations
- Instrument assignment with browse, preview, and smart suggestions
- Built-in sample library covering standard drum kit sounds (kicks, snares, hi-hats, toms, claps, rim shots, cowbell, shakers/tambourine)
- At least 3 sample variations per instrument category
- BPM auto-detection and manual override (40--240 BPM range)
- Quantization with grid resolution selection (1/4, 1/8, 1/16, triplets) and strength control (0--100%)
- Before/after quantization comparison playback
- Non-destructive quantization (original timestamps always preserved)
- Multi-track timeline view with hit markers and grid lines
- Play, stop, and loop controls with visual playback cursor
- Per-track mute, solo, and volume controls
- Master volume control
- Manual hit editing on timeline (move, add, delete)
- Session save, load, delete, and rename (IndexedDB)
- WAV audio export
- Dark and light theme with OS preference detection
- Settings panel (input device, default BPM, default grid, sensitivity, theme)
- Offline support via service worker (PWA installable)
- Responsive design for desktop and mobile browsers
- WCAG 2.1 AA accessibility compliance
- Zero server dependency -- entirely client-side
- Open-source codebase with TypeScript and automated tests

### 5.2 Explicitly Out of Scope for MVP

The following are **not** part of the MVP and shall not be designed for, implemented, or implied in any MVP work:

- **Multi-user collaboration** -- No real-time or asynchronous collaboration features.
- **Cloud sync** -- No user accounts, no cloud storage, no cross-device session sync.
- **Mobile native app** -- No iOS or Android native builds. Web only.
- **Advanced audio effects** -- No reverb, delay, compression, EQ, or any signal processing beyond volume control.
- **Mixing and mastering** -- No mixing board, no mastering chain, no stereo panning.
- **Melodic or harmonic instruments** -- No pitched instruments (piano, bass, synth). Percussion only.
- **Server-side processing** -- No backend, no API, no server-side audio processing, no database.
- **MIDI export** -- Deferred to post-MVP (FR-062, P2).
- **Shareable URLs** -- Deferred to post-MVP (FR-063, P2).
- **Custom sample upload** -- Users cannot upload their own instrument samples in MVP.
- **Song arrangement** -- No multi-section song structure (verse, chorus, bridge). Single loop only.
- **Time signature support** -- MVP assumes 4/4 time only.
- **Undo/redo system** -- No generalized undo/redo history in MVP.
- **Internationalization** -- English only in MVP.
- **User onboarding tutorial** -- No guided walkthrough in MVP (but UI must be self-explanatory).
- **Audio input monitoring** -- No "listen to yourself" pass-through during recording.
- **Swing/groove quantization** -- Only straight and triplet grids in MVP.
- **Velocity/dynamics** -- Hit velocity is not captured or controllable in MVP.

### 5.3 Future Considerations

Rough priority order for post-MVP features:

1. **MIDI export** (P2) -- High demand from music producers who want to use beats in DAWs.
2. **Shareable URLs** (P2) -- Enables viral sharing and community growth.
3. **Undo/redo** -- Important usability improvement, deferred for MVP simplicity.
4. **Hit velocity/dynamics** -- Capture tap intensity and map to sample velocity layers.
5. **Custom sample upload** -- Let users load their own WAV/MP3 samples as instruments.
6. **Swing/groove quantization** -- Shuffle and groove templates beyond straight/triplet.
7. **Additional time signatures** -- 3/4, 6/8, 5/4, 7/8, etc.
8. **Song arrangement mode** -- Chain multiple loops into a full song structure with sections.
9. **Per-track panning** -- Stereo positioning of individual tracks.
10. **Basic effects** -- Per-track reverb and delay sends.
11. **MIDI controller input** -- Accept hits from MIDI pads as an alternative to microphone.
12. **Mobile native wrappers** -- Capacitor/Cordova or native builds for app store distribution.
13. **Cloud sync and accounts** -- Optional cloud backup of sessions with login.
14. **Collaboration** -- Real-time shared session editing.
15. **Community sample library** -- Users share and download sample packs.
16. **Internationalization** -- Multi-language support.
17. **Guided onboarding** -- Step-by-step tutorial for first-time users.
18. **Audio input monitoring** -- Pass-through for headphone monitoring during recording.

---

## 6. Dependencies & Assumptions

### 6.1 Technical Dependencies

| Dependency | Description | Risk | Mitigation |
|------------|-------------|------|------------|
| **Web Audio API** | Core audio processing: capture, playback, analysis, mixing. Required by all P0 audio features. | Low -- Supported in all target browsers since well before the minimum versions specified. | None needed. |
| **MediaDevices.getUserMedia** | Microphone access for audio capture. Required for FR-001 through FR-011. | Low -- Supported in all target browsers. iOS Safari requires HTTPS and user gesture. | Ensure HTTPS deployment. Trigger getUserMedia from a user-initiated event (button click). |
| **AudioWorklet** | Low-latency audio processing for real-time onset detection (FR-012 through FR-017). | Medium -- Safari support stabilized in Safari 15.4. Safari 15.0--15.3 may need fallback. | Implement ScriptProcessorNode fallback for Safari versions that lack AudioWorklet. Feature-detect at runtime. |
| **IndexedDB** | Persistent session and settings storage. Required for FR-056 through FR-060 and FR-072. | Low -- Universally supported. Storage quotas vary by browser (typically 50--80% of available disk). | Monitor quota usage. Warn users when approaching limits. Handle QuotaExceededError gracefully. |
| **Service Worker API** | Offline capability and PWA install (NFR-015, NFR-016). | Low -- Supported in all target browsers. | None needed. |
| **OfflineAudioContext** | Rendering audio to buffer for WAV export (FR-061). | Low -- Supported in all target browsers. | None needed. |
| **Web Workers** | Offloading clustering computation from the main thread to maintain 60fps during analysis (NFR-002, NFR-003). | Low -- Universally supported. | None needed. |
| **Canvas API or WebGL** | Rendering waveform visualizations and timeline (FR-003, FR-020, FR-045). | Low -- Universally supported. Canvas is sufficient; WebGL optional for performance. | Use Canvas 2D. Fall back gracefully if hardware acceleration unavailable. |

### 6.2 Asset Dependencies

| Dependency | Description | Risk | Mitigation |
|------------|-------------|------|------------|
| **Drum sample library** | CC0, public domain, or permissively licensed percussion samples covering all categories in FR-029, with at least 3 variations per category (FR-035). | Medium -- High-quality CC0 drum samples exist but require curation, quality verification, and license audit. | Begin sample curation early. Candidates: freesound.org (CC0 filter), LMMS sample packs, custom recording sessions. All licenses must be verified before inclusion. |
| **Sample format and specification** | All samples shall be 44.1kHz, 16-bit or higher, in WAV format for maximum browser compatibility and audio quality. OGG may be used as a compressed alternative. | Low -- Standard formats. | Normalize all samples to consistent loudness (LUFS) during curation. |
| **Total sample library size** | Estimated 5--15 MB compressed for the full library. Must be cached by service worker for offline use. | Low -- Acceptable for initial load on broadband. | Lazy-load samples by category if needed. Compress aggressively (OGG). Pre-cache via service worker in background after initial page render. |

### 6.3 Assumptions

1. **Users have a functioning microphone.** Desktop laptops and mobile devices have built-in microphones. Desktop towers may require an external USB microphone or headset. The app will detect and communicate microphone absence (FR-011).

2. **Users grant microphone permission.** The app cannot function without microphone access. The UX for permission denial is a graceful dead end by design (FR-010), with instructions for re-enabling.

3. **Users are in an environment where tapping produces distinct, audible sounds above the noise floor.** The app cannot reliably distinguish taps in extremely noisy environments (concerts, construction sites, loud cafes). Quiet to moderately noisy environments are expected. This is a known limitation documented in-app, not a defect.

4. **Users have a modern browser.** No effort will be made to support browsers outside the compatibility matrix defined in NFR-011 and NFR-012. Unsupported browsers receive a message (NFR-013).

5. **Device performance is sufficient for real-time audio processing.** The Web Audio API, onset detection, and clustering algorithms require moderate CPU. Devices manufactured approximately 2018 or later are expected to perform adequately. Older or very low-end devices may experience degraded performance; this is accepted.

6. **No server infrastructure is needed for core functionality.** The app is a static site. Hosting requires only a static file server (GitHub Pages, Netlify, Vercel, Cloudflare Pages, or equivalent). No backend runtime, no database, no API.

7. **4/4 time signature is sufficient for MVP.** The vast majority of popular music and drum patterns use 4/4 time. Odd time signatures are a post-MVP feature.

8. **Users accept browser storage limitations.** IndexedDB quotas vary by browser and device. Some users on storage-constrained devices may be limited in the number of sessions they can save. The app will communicate storage limits clearly (NFR-017, NFR-018).

---

## 7. Acceptance Criteria for MVP

The MVP is considered complete and shippable when **all** of the following criteria are met. Each criterion has a defined validation method.

### 7.1 End-to-End Flow

| # | Criterion | Validation Method |
|---|-----------|-------------------|
| AC-001 | A user can complete the full flow: open app, record taps, see clusters, assign instruments, adjust quantization, and play back a looping beat -- all without errors or dead ends. | Manual end-to-end test on each supported browser. |
| AC-002 | The full flow is completable in under 5 minutes by a first-time user with no instructions or prior experience with the app. | Usability test with 3+ naive users. Measure time-to-first-loop. |
| AC-003 | The full flow works without any server communication after initial page load. | Network tab inspection in DevTools during full flow: zero outbound requests after service worker installation. |

### 7.2 Clustering Quality

| # | Criterion | Validation Method |
|---|-----------|-------------------|
| AC-004 | At least 3 distinct tapping sounds (e.g., flat palm on desk, fingertip on desk, knuckle on desk) are reliably separated into distinct clusters in at least 80% of test sessions. | Test with 5 different surface/technique combinations across 10 recording sessions. Document success rate. |
| AC-005 | Cluster presentation appears within 2 seconds of stopping a recording of up to 60 seconds, and within 3 seconds for recordings up to 120 seconds. | Automated performance benchmark measuring time from stop-recording event to cluster-view-rendered event. |
| AC-006 | Cluster representative samples are perceptually representative of the hits in that cluster (a listener can identify which cluster a random hit belongs to by ear). | Manual listening test: present 5 random hits from each cluster alongside the representative sample. Evaluator correctly matches >= 80%. |

### 7.3 Quantization Quality

| # | Criterion | Validation Method |
|---|-----------|-------------------|
| AC-007 | Quantized playback of a reasonably performed rhythm (human tapping at a steady tempo with normal human timing variation) sounds musically pleasing and rhythmically coherent at 100% quantization strength. | Listening test by 3+ people with musical experience. Majority must rate as "sounds like a proper beat." |
| AC-008 | BPM auto-detection is accurate within +/- 5 BPM for performances at steady tempos between 60 and 180 BPM. | Automated test: generate synthesized onset patterns at known BPMs (60, 80, 100, 120, 140, 160, 180). Verify detected BPM is within tolerance for each. |
| AC-009 | Quantization strength of 0% preserves original timing exactly (onset positions identical to pre-quantization values, bit-for-bit). | Automated unit test: apply 0% quantization, assert output timestamps equal input timestamps. |
| AC-010 | Quantization strength of 100% places every hit on the nearest grid line exactly (zero deviation from grid positions). | Automated unit test: apply 100% quantization, assert every output timestamp falls exactly on a grid line for the given BPM and resolution. |

### 7.4 Browser & Platform Compatibility

| # | Criterion | Validation Method |
|---|-----------|-------------------|
| AC-011 | Full end-to-end flow works on latest stable Google Chrome (desktop, macOS and Windows). | Manual test on both platforms. |
| AC-012 | Full end-to-end flow works on latest stable Mozilla Firefox (desktop). | Manual test. |
| AC-013 | Full end-to-end flow works on latest stable Apple Safari (desktop, macOS). | Manual test. |
| AC-014 | Full end-to-end flow works on iOS Safari 15+ (iPhone). | Manual test on physical iPhone device. |
| AC-015 | Full end-to-end flow works on Chrome for Android 90+ (Android phone). | Manual test on physical Android device. |
| AC-016 | UI is responsive and usable on viewports from 320px to 2560px wide. No horizontal overflow, no overlapping elements, no unreadable text at any breakpoint. | Manual visual inspection at 320px, 375px, 768px, 1024px, 1440px, 2560px widths. |

### 7.5 Playback Quality

| # | Criterion | Validation Method |
|---|-----------|-------------------|
| AC-017 | Playback loops seamlessly with no audible gap, click, pop, or silence between loop iterations. | Manual listening test: loop for 30+ seconds, listen for artifacts. Automated measurement: gap between last sample end and first sample start < 5ms. |
| AC-018 | Per-track mute, solo, and volume controls affect playback in real time without requiring stop and restart. | Manual test: toggle mute/solo and adjust volume during active playback. Changes take effect within the current loop iteration. |
| AC-019 | Master volume control adjusts overall output level smoothly without introducing distortion, clipping, or audible stepping artifacts. | Manual test at volume levels 0%, 25%, 50%, 75%, 100%. |

### 7.6 Performance

| # | Criterion | Validation Method |
|---|-----------|-------------------|
| AC-020 | Onset detection visual feedback appears within 50ms of the physical tap. | Measurement via AudioContext timestamp comparison or high-speed camera synchronization test. |
| AC-021 | UI maintains 60fps during recording with no visible jank, frame drops, or lag in waveform/level meter rendering. | Chrome DevTools Performance panel recording during a 30-second recording session. Zero long frames (> 16.7ms) in the main thread. |
| AC-022 | Clustering completes in < 2 seconds for recordings up to 60 seconds and < 3 seconds for recordings up to 120 seconds, measured on a mid-range device (2020-era laptop). | Automated performance benchmark on reference hardware. |
| AC-023 | WAV export completes in < 10 seconds for an 8-track, 2-minute beat on a mid-range device. | Automated performance benchmark on reference hardware. |

### 7.7 Offline & Storage

| # | Criterion | Validation Method |
|---|-----------|-------------------|
| AC-024 | After initial page load, the app works fully with no internet connection. User can record, cluster, assign, quantize, play, and save -- all in airplane mode. | Manual test: load app, enable airplane mode (or disconnect network), complete full flow including session save. |
| AC-025 | Sessions saved to IndexedDB survive page reload and browser restart. A saved session loads correctly with all data intact (clusters, assignments, quantization settings, volume levels, hit positions). | Automated integration test: save session, programmatically reload, load session, deep-compare all session data fields. |

### 7.8 Accessibility

| # | Criterion | Validation Method |
|---|-----------|-------------------|
| AC-026 | All interactive elements (buttons, sliders, toggles, instrument list, cluster cards, timeline) are reachable and operable via keyboard alone using Tab, Shift+Tab, Enter, Space, and Arrow keys. | Manual keyboard-only walkthrough of full flow. |
| AC-027 | Automated accessibility audit (axe-core or Lighthouse Accessibility) reports zero critical or serious violations on all primary views (home, recording, clustering, assignment, timeline, settings, session list). | Automated scan of each view. Score >= 90 on Lighthouse Accessibility. |
| AC-028 | Color is never the sole means of conveying information. All color-coded elements (instrument/cluster colors on timeline, cluster cards) also have text labels, distinct shapes, or patterns that communicate the same information. | Manual visual audit with color blindness simulation (Chromatic Vision Simulator or equivalent). |

---

*End of Product Requirements section.*
