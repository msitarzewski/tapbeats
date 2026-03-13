# TapBeats - Twitter/X Launch Thread

---

### Tweet 1 (Hook)

I built a drum machine that runs entirely in your browser.

Tap a rhythm on your desk. It listens, clusters your sounds by timbre, maps them to drum samples, and gives you a beat.

No account. No download. No data leaves your device.

Try it: https://tapbeats.zerologic.com

---

### Tweet 2 (How it works)

How it works:

Your mic picks up taps. An AudioWorklet thread runs onset detection using spectral flux analysis. Each hit gets a timbral fingerprint (spectral centroid, spread, rolloff). k-means++ clustering groups similar sounds. Each cluster maps to a drum voice.

All of it: custom TypeScript. Zero audio libraries.

---

### Tweet 3 (Technical depth)

The DSP pipeline I'm most proud of:

- Hand-written FFT (every butterfly operation in TypeScript)
- Adaptive onset detection that handles varying noise floors
- Real-time feature extraction on a dedicated audio thread
- k-means++ that can tell your knuckle tap from your palm slap

~98KB gzipped. 605 tests.

---

### Tweet 4 (Privacy and PWA)

Your audio never leaves the browser. There is no backend. No analytics tracking your beats. No cloud processing.

Install it as a PWA and it works fully offline. Service worker precaches everything. Your instrument should not need WiFi.

---

### Tweet 5 (Quality and accessibility)

Things I refused to skip:

- Screen reader support throughout
- Full keyboard navigation
- Reduced motion preferences respected
- 605 tests across 59 files
- Cross-browser: Chrome, Firefox, Safari
- Code-split routes, ~98KB gzipped

Creative tools should be accessible to everyone.

---

### Tweet 6 (Open source CTA)

TapBeats is AGPL-3.0 licensed and fully open source.

If you're interested in browser audio, real-time DSP, or AudioWorklet architecture, the codebase might be a useful reference.

Stars, issues, and PRs are all welcome.

https://github.com/msitarzewski/tapbeats
