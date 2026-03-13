# TapBeats - Product Hunt Submission

## Name
TapBeats

## Tagline
Tap any surface. Get a beat. No account needed.

## URL
https://tapbeats.zerologic.com

## GitHub
https://github.com/msitarzewski/tapbeats

---

## Description

TapBeats is a browser-based drum machine that turns your tapping into music. Open the app, tap a rhythm on your desk, your phone, a cardboard box — anything. TapBeats listens through your microphone, analyzes each hit in real time using custom digital signal processing, clusters your sounds by timbre, maps them to drum samples, and assembles a playable beat timeline. No signup, no downloads, no data leaves your device.

The entire audio pipeline runs client-side using the Web Audio API and AudioWorklet. That means real-time FFT, spectral analysis, onset detection, and k-means++ clustering all happen in TypeScript — no audio libraries, no server processing, no cloud dependency. Install it as a PWA and it works fully offline. The gzipped bundle is under 100KB.

TapBeats was built with accessibility in mind from day one. It supports screen readers, full keyboard navigation, and respects reduced motion preferences. The codebase is backed by 605 tests across 59 files and is AGPL-3.0 licensed. Whether you are a musician looking for a quick sketchpad, a developer curious about browser audio, or someone who just likes tapping on things, TapBeats is for you.

We believe creative tools should be open, private, and available to everyone. TapBeats is our contribution to that idea. We would love your feedback.

---

## Topics
- Productivity
- Open Source
- Music
- Web App
- Developer Tools

## Makers
@msitarzewski

---

## Maker's First Comment

Hey Product Hunt! I'm Michael, the developer behind TapBeats.

This project started from a simple question: what would it take to build a real-time audio analysis pipeline entirely in the browser? No libraries, no backend, just the Web Audio API and TypeScript. Turns out, quite a lot — but the result is something I'm genuinely proud of.

The hardest part was getting onset detection right. Distinguishing a genuine tap from background noise, in real time, on a dedicated AudioWorklet thread, with low enough latency that it feels responsive — that took dozens of iterations. The clustering algorithm (k-means++ on spectral features) was another rabbit hole. Getting it to reliably tell the difference between a desk tap and a palm slap was more nuanced than I expected.

A few things I'm especially happy about:

- **Zero dependencies for DSP.** Every FFT butterfly, every spectral bin, every clustering step is hand-written TypeScript. It was a deliberate choice — I wanted to understand every sample.
- **True offline.** Service worker precaches everything. Once loaded, the app never needs a network connection again.
- **Accessibility.** Screen reader announcements, keyboard-navigable timeline, reduced motion support. These weren't afterthoughts.
- **605 tests.** The DSP code is particularly well-covered because audio math is unforgiving.

I'd love to hear what you think. Try tapping on different surfaces — the timbre clustering can tell the difference, and it's oddly satisfying to watch it work. Bug reports, feature ideas, and PRs are all welcome on GitHub.

Thanks for checking it out!
