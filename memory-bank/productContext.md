# Product Context

> Last updated: 2026-03-12 | Source: `docs/sections/ux-research.md`, `docs/sections/brand-strategy.md`

---

## Why This Product Exists

TapBeats started because the founder spent a lifetime tapping on tables, cups, their chest -- any surface within reach -- and asked: *what if that could actually become music?* Not music that requires learning an instrument or buying software, but music that already exists in the tapping itself. The gap between rhythmic impulse and a real, shareable beat should be zero. TapBeats captures acoustic gestures via microphone, clusters distinct sounds automatically, maps them to instrument samples, quantizes timing, and produces polished beats -- entirely in the browser, with no downloads, no accounts, and no musical training.

**Vision**: Every surface is an instrument. Every person is a musician.

**Core paradigm inversion**: Traditional tools say "select instrument, then perform." TapBeats says "perform first, assign later."

---

## User Personas

### Ria -- The Compulsive Tapper
Age 24, barista in Austin. No music training. Taps on tables, cups, and steering wheels constantly. Sessions are 2-5 minutes, spontaneous. Shares on TikTok/Instagram. Abandons apps if the first 30 seconds are not rewarding. Needs one-tap record, instant gratification, social sharing. Free tier only.

### Marcus -- The Aspiring Musician
Age 17, high school junior in Detroit. Listens to hip-hop obsessively, beatboxes, no instrument access. Uses a school Chromebook and budget Android phone. Sessions are 15-30 minutes, iterative. Wants beats that sound like real music, not toys. Needs cross-device sync, contemporary samples (808s, trap), layering. Cannot afford paid tools.

### Priya -- The Experienced Producer
Age 31, freelance producer in LA. 12+ years with Ableton/Logic. Wants a rapid sketch pad for capturing rhythmic ideas away from the studio. Sessions are 1-3 minute captures, refined later. Needs MIDI export, WAV stems, adjustable quantization strength, velocity preservation. Evaluates by output quality and DAW integration.

### David -- The Music Educator
Age 45, middle school music teacher in Portland. Trained pianist, limited electronic production experience. Needs tools that work on 25+ school Chromebooks simultaneously, produce results in a 45-minute class period, and require no software installation. Values visual feedback for teaching rhythm/timbre concepts. Budget: $0 or district PO.

---

## User Goals by Persona

| Persona | Primary Goal | Success Looks Like |
|---------|-------------|-------------------|
| Ria | Capture and share beats from daily life | Shared a beat to social media in under 3 minutes |
| Marcus | Create beats that sound professional without gear | Made a beat he is proud enough to show friends |
| Priya | Capture fleeting rhythmic ideas for DAW refinement | Exported clean MIDI/WAV into Ableton workflow |
| David | Engage non-musical students with rhythm creation | Students who "hate music class" are making beats |

---

## Market Position

### Category Creation: "Gesture-to-Music"

TapBeats does not fit existing categories (DAW, beat maker, drum machine, education tool). It defines a new one: **Gesture-to-Music** -- tools that convert physical real-world gestures into structured musical output.

**Strategic position**: Easier than anything that sounds good. Sounds better than anything that is this easy.

**Key differentiators**:
1. **Physical-world input** -- real acoustic taps, not virtual pads or grids
2. **Intelligent sound clustering** -- ML-based automatic separation of distinct sounds (the "magic moment")
3. **Zero-setup browser-native** -- open a URL, start tapping, no install/signup/tutorial
4. **Open source** -- community-owned, transparent microphone handling, contribution flywheel
5. **Quantization with character** -- tight but human; preserves performance feel

---

## Competitive Landscape

| Competitor | What It Does Well | Where TapBeats Wins |
|-----------|------------------|-------------------|
| **GarageBand** | Massive sound library, polished UI, free | Apple-only; instrument-first paradigm; overwhelming for beginners |
| **Koala Sampler** | Excellent real-world sampling, strong effects | Manual pad assignment; no auto-clustering; mobile-only; $4.99 |
| **BandLab** | Cross-platform web DAW, free, social features | Full DAW complexity; no onset detection; intimidating for casuals |
| **Soundtrap** | Education tier, real-time collaboration, Chrome | Still a full DAW; education features paywalled at $7.99/mo |
| **Incredibox** | Engaging design, impossible to sound bad | No user audio input; premade loops only; no original creation |
| **Chrome Music Lab** | Free, educational, Chromebook-friendly | Demonstration tool, not creation tool; no saving/export |
| **Figure** | Brilliant gesture-based UI, instant gratification | iOS-only; no mic input; abandoned since 2019; homogeneous output |

---

## Target Audience Segments

| Segment | Description | Size Estimate | 18-Month Target |
|---------|------------|--------------|----------------|
| **Primary**: Casual Rhythm Makers | People who already tap/drum on surfaces habitually; ages 13-45 | 50-100M addressable globally | 500K-2M |
| **Secondary**: Music Hobbyists | Active music enthusiasts using GarageBand/BandLab; ages 18-40 | 5-15M addressable | 100K-500K |
| **Tertiary**: Producers & Educators | Professional producers, music teachers, therapists; ages 25-55 | 2-5M total market | 10K-50K |

---

## Brand Identity

**Personality** (in order of prominence): Playful, Immediate, Inclusive, Honest, Inventive.

**Voice**: Like a creative friend excited about what you made -- not a music teacher grading your performance. Plain language, active verbs, second person, short sentences, contractions. Never use musical jargon without inline definition.

**Taglines**:
- Primary: **"Tap anything. Make music."**
- Campaign/storytelling: "Your hands already know how to play."
- Social/viral: "Every surface is a drum kit."

**Visual direction**: Warm, energetic primary color (coral/amber/electric orange) to differentiate from the blues/purples of existing music software. Geometric sans-serif logotype. Fingertip-with-sound-waves icon mark.

---

## Go-to-Market

### Launch Channels (Tiered)

**Tier 1 -- Launch week**: Product Hunt (top-5 target, 5-15K visitors), Hacker News Show HN (technical angle + open source), Twitter/X demo GIF thread, Reddit (r/InternetIsBeautiful, r/WeAreTheMusicMakers, r/WebDev).

**Tier 2 -- Weeks 2-4**: Music tech YouTubers (Andrew Huang, Fireship), TikTok/Reels "I tapped on [object] and made this beat" series, music production forums (KVR, Gearspace).

**Tier 3 -- Months 2-6**: Music education outlets (ISTE, NAMM), accessibility communities, podcast circuit.

### Viral Mechanics

The core shareable moment is the **transformation**: mundane tapping sounds become a polished beat. Every piece of content should show mundane input, magical output, and collapse the time between them. Challenge format ("tap three things near you, drop your beat") is designed for social engagement. Seed community of 200-500 beta users before launch, armed with shareable demos and talking points.

### Revenue Model

Lead with **premium hosted version** (free open-source self-hosted; paid cloud with storage/sharing/premium samples). Supplement with **premium sample packs** and **education site licenses**. Donations and grants as non-core supplemental revenue.
