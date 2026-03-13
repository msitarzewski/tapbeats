# TapBeats - Reddit Launch Posts

---

## Post 1: r/webdev

### Title
I built a real-time drum machine in the browser with custom FFT, onset detection, and k-means++ clustering — all in TypeScript, no audio libraries

### Body

I have been working on TapBeats, a browser-based drum machine that listens to your microphone, detects when you tap on a surface, analyzes the timbre of each hit, clusters similar sounds together, and maps them to drum samples on a beat timeline.

The interesting part (from a web dev perspective) is that the entire DSP pipeline is implemented from scratch in TypeScript:

- **Custom FFT implementation** — not using the Web Audio AnalyserNode. I wrote the butterfly operations by hand because I needed more control over windowing and frame sizes than the built-in node provides.
- **AudioWorklet for real-time processing** — all onset detection runs on a dedicated audio thread. The worklet only sends messages to the main thread when it detects a transient, keeping the MessagePort traffic minimal.
- **Spectral feature extraction** — centroid, spread, rolloff, and zero-crossing rate computed per onset to fingerprint each sound.
- **k-means++ clustering** — groups sounds by timbral similarity so that different tap types (knuckle vs. palm, desk vs. phone) map to different drum samples.

Some web platform things I found interesting along the way:

- AudioWorklet behavior varies across browsers more than you might expect. Safari in particular has some quirks with module loading and message timing.
- Service worker precaching makes the PWA work fully offline, which matters for a music tool — you do not want your instrument to stop working because you lost WiFi.
- The entire bundle is ~98KB gzipped with code-split routes. Keeping it small was a deliberate goal.
- Accessibility was a first-class concern: screen reader support, keyboard navigation for the entire timeline, reduced motion preferences respected.

The app is fully client-side — no data leaves the browser. AGPL-3.0 licensed.

**Try it:** https://tapbeats.zerologic.com

**Source:** https://github.com/msitarzewski/tapbeats

605 tests across 59 files. Happy to talk about the AudioWorklet architecture, the DSP implementation, or any of the cross-browser challenges. Feedback and PRs welcome.

---

## Post 2: r/musicproduction

### Title
I made a free browser tool that turns your desk tapping into drum patterns — it listens to your mic, figures out what sounds you're making, and maps them to samples

### Body

TapBeats is a free, open-source drum machine that runs entirely in your browser. The idea is simple: tap a rhythm on whatever surface is in front of you, and TapBeats turns it into a drum pattern.

Here is how it works in practice:

1. Open the app and give it microphone access.
2. Tap out a rhythm on your desk, your phone, a book, a table — whatever is nearby.
3. The app analyzes each hit and figures out what kind of sound it is (hard tap vs. soft tap, knuckle vs. palm, different surfaces).
4. Similar sounds get grouped together and mapped to drum samples.
5. You get a beat timeline you can loop and play back.

It is surprisingly good at distinguishing different tap types. If you alternate between tapping with your fingertips and slapping with your palm, it will usually separate those into different clusters and assign them to different drum voices.

A few things worth noting:

- **No account, no download.** It is a web app. Open the URL and go. Install it as a PWA if you want it on your home screen.
- **Works offline.** Once you have loaded it, it does not need an internet connection.
- **Nothing leaves your device.** All audio processing happens locally in your browser. Your microphone audio is never sent anywhere.
- **Free and open source.** AGPL-3.0 license, code is on GitHub.

This is not meant to replace a DAW — it is more of a sketchpad for capturing rhythmic ideas quickly. Hear a beat in your head while you are away from your setup? Tap it out, hear it back with real drum sounds.

**Try it:** https://tapbeats.zerologic.com

**Source:** https://github.com/msitarzewski/tapbeats

Would love to hear what you think, especially about the sample mapping and how well the sound clustering works with different surfaces and tap styles.

---

## Post 3: r/WeAreTheMusicMakers

### Title
Wanted a quick way to capture beat ideas without opening a DAW, so I built a browser tool that turns desk tapping into drum patterns

### Body

I kept running into the same situation: I would hear a rhythm in my head or start tapping something out on my desk, and by the time I opened a DAW and set up a drum rack, the idea was gone. So I built TapBeats.

It is a browser-based tool that listens through your microphone while you tap on any surface. It detects each hit, figures out the timbral character of the sound (is this a sharp knock or a dull thud?), groups similar sounds together, and maps each group to a drum sample. The result is a beat timeline you can loop and play back immediately.

The workflow I have been using:

- Tap out a basic kick/snare pattern on my desk using different parts of my hand for different sounds.
- TapBeats separates the sounds and maps them to kit pieces.
- Listen back, adjust if needed.
- Use it as a reference when I sit down at my actual setup.

It is not going to replace finger drumming on a pad or programming beats in a DAW. But as a capture tool for rhythmic ideas, it fills a gap I kept bumping into. It is like a voice memo, but for beats.

The app is free, open source, runs entirely in your browser, and works offline. No account needed, nothing gets uploaded anywhere — all the audio analysis happens on your device.

**Try it:** https://tapbeats.zerologic.com

**Source:** https://github.com/msitarzewski/tapbeats

Curious to hear if this fits into anyone else's workflow, and what would make it more useful. I am thinking about adding export features (MIDI, audio bounce) but want to get feedback on the core experience first.
