# Show HN: TapBeats - Hacker News Submission

## Title
Show HN: TapBeats -- a browser drum machine with custom DSP in TypeScript

## URL
https://tapbeats.zerologic.com

---

## Body

TapBeats is a browser-based drum machine. You tap a rhythm on any surface, and it analyzes the audio in real time, clusters your sounds by timbre, maps them to drum samples, and gives you a playable beat timeline. Everything runs client-side. No backend, no audio libraries, no data leaves the browser.

**The DSP pipeline:**

The audio processing chain runs on an AudioWorklet thread to keep the main thread free. Here is what happens to your microphone input:

1. **Onset detection.** A spectral flux algorithm compares successive FFT frames to identify transients. I use an adaptive threshold with a short lookback window to handle varying background noise levels. Getting the sensitivity right — responsive enough to catch light taps but not so sensitive that it fires on ambient noise — was the trickiest part of the project.

2. **Feature extraction.** For each detected onset, I extract a feature vector from the spectral content: spectral centroid, spectral spread, spectral rolloff, and zero-crossing rate. These features give a compact fingerprint of the sound's timbre.

3. **Clustering.** The feature vectors are fed into a k-means++ implementation that groups sounds by timbral similarity. Tap a desk with your knuckles and then with your palm — the algorithm separates them into distinct clusters. Each cluster maps to a different drum sample.

4. **Timeline assembly.** The onset timestamps and cluster assignments are combined into a quantized beat grid. The result is a drum pattern you can loop, edit, and play back.

All of this — FFT, spectral analysis, clustering, quantization — is implemented from scratch in TypeScript. No Web Audio AnalyserNode for the FFT, no third-party DSP library. I wanted to understand every sample moving through the system, and writing it by hand was the best way to do that.

**Interesting challenges:**

- **AudioWorklet communication.** The worklet thread and main thread communicate via MessagePort. Keeping this channel lean was important — serializing full spectral frames at audio rate would be wasteful, so the worklet does its own onset detection and only sends events when something interesting happens.

- **Clustering convergence.** k-means++ on spectral features in a real-time context is tricky because new data points arrive continuously. I re-run clustering periodically rather than trying to maintain it incrementally, which turned out to be simpler and more reliable.

- **Latency vs. accuracy.** Shorter FFT windows give you faster response times but worse frequency resolution. I settled on a compromise that feels responsive without sacrificing too much spectral detail. The onset detector uses a different (shorter) analysis window than the feature extractor.

- **Cross-browser audio.** Safari, Chrome, and Firefox all have subtly different AudioWorklet implementations and microphone permission flows. Getting consistent behavior across all three was a grind.

**Stack:** TypeScript, React, Web Audio API, AudioWorklet, Vite. PWA with service worker precaching — works fully offline after first load. ~98KB gzipped.

**Testing:** 605 tests across 59 files. The DSP code has particularly thorough coverage because numerical bugs in audio processing are hard to catch by ear and easy to catch with assertions on known signals. I test FFT output against known transforms, verify onset detection against synthetic transients, and validate clustering convergence properties.

**What I learned:** The Web Audio API is more capable than most people realize. You can build serious audio applications entirely in the browser without any native code or server-side processing. The AudioWorklet API in particular is a game-changer — having a dedicated real-time audio thread with SharedArrayBuffer support opens up a lot of possibilities.

AGPL-3.0 licensed. Code: https://github.com/msitarzewski/tapbeats

I would appreciate any feedback on the DSP approach, the UX, or the code. Happy to answer questions about the implementation.
