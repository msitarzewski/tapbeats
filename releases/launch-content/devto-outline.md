# Dev.to Blog Post Outline

## Title
Building a Real-Time Drum Machine in the Browser: Custom DSP with TypeScript and AudioWorklet

## Subtitle
How I built FFT, onset detection, spectral analysis, and k-means++ clustering from scratch — and shipped it as a 98KB PWA

## Tags
webdev, typescript, audio, opensource

## Estimated reading time
15-18 minutes

---

## Section Outline

### 1. Introduction: Why Build a Drum Machine in the Browser?
The origin of the idea — wanting to capture rhythmic ideas without opening a DAW. The decision to build everything client-side with no audio processing libraries. What the finished product does: tap on any surface, get a drum pattern. Link to the live app and a brief demo walkthrough.

### 2. Architecture Overview: The Audio Pipeline
High-level diagram of the data flow from microphone input to playable beat timeline. The key stages: capture, onset detection, feature extraction, clustering, sample mapping, timeline assembly. Why each stage exists and how they connect. Introduction of the AudioWorklet boundary between the audio thread and main thread.

### 3. AudioWorklet: Real-Time Processing on a Dedicated Thread
What AudioWorklet is and why it matters for audio applications. The difference between AudioWorklet and the older ScriptProcessorNode. How the worklet processor is structured: extending AudioWorkletProcessor, implementing the process() method. The MessagePort communication pattern between worklet and main thread, and why keeping this channel lean is critical.

### 4. Implementing FFT from Scratch in TypeScript
Why I chose to write my own FFT instead of using the Web Audio AnalyserNode. The Cooley-Tukey radix-2 algorithm: butterfly operations, bit-reversal permutation, twiddle factors. Windowing functions (Hann window) and why they matter for spectral analysis. Performance considerations and how TypedArrays help. Testing FFT output against known transforms.

### 5. Onset Detection: Finding Taps in a Noisy Signal
The challenge of distinguishing a genuine tap from background noise in real time. Spectral flux as an onset detection function: comparing successive FFT frames to find sudden changes in spectral energy. Adaptive thresholding with a lookback window to handle varying noise floors. The tradeoff between sensitivity and false positive rate. Tuning the detector for percussive transients specifically.

### 6. Spectral Feature Extraction: Fingerprinting Each Sound
What makes a knuckle tap sound different from a palm slap, and how to capture that difference numerically. The four features: spectral centroid (brightness), spectral spread (bandwidth), spectral rolloff (high-frequency content), zero-crossing rate (noisiness). How these features are computed from the FFT output. Building a feature vector that meaningfully represents timbre.

### 7. k-Means++ Clustering: Grouping Sounds by Timbre
The clustering problem: given a set of feature vectors arriving in real time, group similar sounds together. Why k-means++ over vanilla k-means (smarter initialization, faster convergence). The re-clustering strategy: periodic batch re-runs rather than incremental updates, and why this was simpler and more reliable. Choosing k: how many clusters to expect, and handling the case where the user produces fewer distinct sounds than expected.

### 8. Sample Mapping and Beat Timeline Assembly
Mapping each cluster to a drum sample: the assignment strategy and how it handles re-clustering gracefully. Quantization: snapping onset timestamps to a beat grid. Building the visual timeline representation. Playback: scheduling sample playback using Web Audio API's precise timing (AudioContext.currentTime) for tight loops.

### 9. Cross-Browser Audio: The Unglamorous Reality
The differences between Chrome, Firefox, and Safari AudioWorklet implementations. Safari's quirks with module loading and AudioContext resume policies. Microphone permission flows and how they vary. Strategies for graceful degradation and consistent behavior. Specific bugs encountered and how they were resolved.

### 10. PWA and Offline: Your Instrument Should Not Need WiFi
The case for offline-first in a music tool. Service worker strategy: precaching all assets with Workbox. The install experience and home screen integration. Keeping the bundle small (~98KB gzipped) with code-split routes and tree shaking. What "fully offline" means in practice and the edge cases to watch for.

### 11. Accessibility: Creative Tools for Everyone
Why accessibility was a first-class concern from the start, not a bolt-on. Screen reader support: ARIA labels, live regions for announcing detected beats, meaningful focus management. Keyboard navigation: making the entire timeline navigable without a mouse. Reduced motion preferences: respecting prefers-reduced-motion for animations and visual feedback. Testing accessibility with real assistive technology.

### 12. Testing Audio Code: 605 Tests and Why They Matter
Why audio DSP code needs particularly thorough testing — numerical bugs are silent and cumulative. Testing FFT against known transforms with synthetic signals. Testing onset detection with crafted audio buffers containing known transients. Testing clustering convergence properties. The testing stack and how tests are organized across 59 files. What 605 tests actually cover and where the coverage boundaries are.

### 13. Lessons Learned and What Comes Next
The Web Audio API is more capable than most developers realize. AudioWorklet is a genuine platform capability, not a toy. Writing your own DSP is educational but humbling. What I would do differently. Potential next steps: MIDI export, audio bounce, more sample kits, collaborative features. How to contribute (AGPL-3.0 licensed, open to PRs).

---

## Links to include
- Live app: https://tapbeats.zerologic.com
- Source code: https://github.com/msitarzewski/tapbeats
- Web Audio API spec references where relevant
- AudioWorklet documentation links
- Relevant Wikipedia articles for DSP concepts (FFT, k-means++, spectral analysis)
