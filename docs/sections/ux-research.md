# UX Research

## Table of Contents

1. [Research Overview](#1-research-overview)
2. [User Personas](#2-user-personas)
3. [User Journey Maps](#3-user-journey-maps)
4. [Competitive Analysis](#4-competitive-analysis)
5. [Usability Principles](#5-usability-principles)
6. [Key User Research Questions](#6-key-user-research-questions)
7. [Success Metrics and KPIs](#7-success-metrics-and-kpis)
8. [Research Roadmap](#8-research-roadmap)

---

## 1. Research Overview

### Purpose

This section defines the user research foundation for TapBeats. It establishes who the users are, how they will interact with the product, where the competitive landscape presents opportunity, and what principles must govern the experience. Every design and engineering decision should trace back to insights documented here.

### Core Assumption Under Test

TapBeats inverts the traditional music-creation paradigm. Instead of "select an instrument, then perform," users perform first by tapping on any surface, and assign instruments afterward. The fundamental research question is whether this inversion reduces creative friction or introduces confusion. All research activities should pressure-test this assumption.

### Methodology Notes

The personas below are hypothetical archetypes derived from analogous product research, founder interviews, and competitive landscape analysis. They should be validated through the primary research plan outlined in Section 6. Confidence levels are noted where applicable.

---

## 2. User Personas

### 2.1 Persona: Ria - The Compulsive Tapper

**Archetype**: Casual creative who taps on everything already

| Attribute | Detail |
|-----------|--------|
| **Age** | 24 |
| **Location** | Austin, TX |
| **Occupation** | Barista / part-time college student |
| **Education** | Some college (communications) |
| **Tech Comfort** | High with consumer apps, low with specialized audio software |
| **Devices** | iPhone 14, older MacBook Air, uses Chrome |
| **Music Background** | No formal training; taps on tables, cups, steering wheels constantly |
| **Income** | ~$28K/year |

**Goals**
- Capture the beats she is already tapping in daily life before they disappear from memory.
- Share creations with friends on social media.
- Feel like a musician without needing to learn an instrument or music theory.
- Kill time creatively during breaks.

**Frustrations**
- Has tried GarageBand but found the instrument grid intimidating. "I don't know which drum is which."
- Downloaded beat-making apps that required selecting sounds before playing. Lost the moment.
- Does not understand BPM, time signatures, or quantization vocabulary.
- Feels like music creation tools are made for people who already know music.

**Behavioral Patterns**
- Sessions are spontaneous and short (2-5 minutes).
- Motivated by immediate gratification and shareability.
- Will abandon an app if the first 30 seconds are not rewarding.
- Shares content on TikTok and Instagram Stories.

**Usage Scenario**

Ria is drumming on her coffee shop counter during a slow shift. She opens TapBeats on her phone, hits record, and taps out an 8-bar pattern using the counter, a cup, and a spoon. The app detects three distinct sounds, clusters them, and she assigns kick, snare, and hi-hat. She quantizes, listens to the polished playback, and shares a 15-second video to her Instagram Story. Total time: under 3 minutes.

**Quote**
> "I've been making beats my whole life. I just never had a way to save them."

**Design Implications**
- Onboarding must take under 15 seconds with zero music vocabulary.
- Recording must start in one tap or fewer.
- The share flow must be fast and produce content sized for social platforms.
- Cluster-to-instrument assignment must use audio previews, not text labels alone.

---

### 2.2 Persona: Marcus - The Aspiring Musician

**Archetype**: Wants to make music but is blocked by traditional instruments

| Attribute | Detail |
|-----------|--------|
| **Age** | 17 |
| **Location** | Detroit, MI |
| **Occupation** | High school junior |
| **Education** | 11th grade |
| **Tech Comfort** | Very high; digital native, comfortable with web apps and mobile |
| **Devices** | Samsung Galaxy A54, Chromebook (school-issued), uses Chrome |
| **Music Background** | Listens to hip-hop and electronic music obsessively; beatboxes; no instrument training |
| **Income** | Part-time job, ~$6K/year |

**Goals**
- Create beats that sound like the music he listens to.
- Build a catalog of beats he can rap or sing over.
- Learn music production without expensive software or hardware.
- Impress peers and potentially post beats online.

**Frustrations**
- Cannot afford a DAW, MIDI controller, or studio time.
- School Chromebook cannot run desktop production software.
- YouTube tutorials for FL Studio and Ableton assume existing knowledge.
- Tried free beat makers but they all sound "toy-like" and limit creative expression.
- Feels gatekept by the cost and complexity of music production.

**Behavioral Patterns**
- Longer sessions (15-30 minutes) when engaged.
- Iterates repeatedly, tweaking and re-recording.
- Watches tutorials and is willing to learn if the learning curve is gradual.
- Compares his output to professional tracks and is self-critical.

**Usage Scenario**

Marcus is in study hall with his Chromebook. He opens TapBeats in Chrome, records himself tapping a beat on his desk and beatboxing kick and snare sounds. The app separates his vocal percussion from his desk taps into distinct clusters. He assigns 808 kick, clap, and hi-hat samples, adjusts the quantization strength to keep some swing, and loops it. He layers a second pass of taps for a ride cymbal pattern. He exports the loop and plays it back through his earbuds, nodding along. Later at home, he opens the same project on his phone and tweaks the tempo.

**Quote**
> "I hear beats in my head all day. I just need something that lets me get them out without buying a thousand dollars of gear."

**Design Implications**
- Must run well on low-end Android and Chromebooks (web-first is critical).
- Sample library must include sounds that feel contemporary, not generic.
- Must support iterative layering (record additional passes over existing loops).
- Cross-device project persistence is important.
- Export formats should be useful (WAV stems, shareable audio).

---

### 2.3 Persona: Priya - The Experienced Producer

**Archetype**: Professional who wants a rapid sketch pad

| Attribute | Detail |
|-----------|--------|
| **Age** | 31 |
| **Location** | Los Angeles, CA |
| **Occupation** | Freelance music producer and sound designer |
| **Education** | B.A. in Music Technology |
| **Tech Comfort** | Expert with DAWs, audio interfaces, MIDI, synthesis |
| **Devices** | MacBook Pro, iPhone 15 Pro, iPad Pro; uses Ableton, Logic, various plugins |
| **Music Background** | 12+ years of production; works with indie artists and ad agencies |
| **Income** | ~$75K/year |

**Goals**
- Capture rhythmic ideas quickly when away from the studio.
- Use tapped rhythms as a starting point that can be exported to a real DAW.
- Explore unconventional sounds and textures from real-world surfaces.
- Reduce the gap between "I have an idea" and "I have a recordable sketch."

**Frustrations**
- Voice memos capture the idea but not the structure. She still has to rebuild in the DAW.
- Existing mobile apps are either too simple (no export) or too complex (full DAW on a phone).
- Koala Sampler is close but still requires pre-assigning pads.
- Losing ideas because the capture-to-structure pipeline is too slow.

**Behavioral Patterns**
- Short, intense capture sessions (1-3 minutes) followed by refinement later.
- Wants MIDI export and WAV stem export above all else.
- Will tolerate a learning curve if the payoff is real.
- Evaluates tools by output quality and professional integration.

**Usage Scenario**

Priya is on the subway and hears a rhythm in the train's motion. She opens TapBeats, taps the rhythm on her phone screen and thigh, capturing the pattern in about 20 seconds. Later in her studio, she opens the project on her laptop, reviews the clustered sounds, and exports the quantized pattern as a MIDI file. She drags it into Ableton, assigns her own samples, and uses it as the foundation for a client track. The original tapped audio becomes a textural layer she chops and processes.

**Quote**
> "I don't need another DAW. I need a net that catches ideas before they disappear."

**Design Implications**
- MIDI export is non-negotiable for this persona.
- WAV stem export (per cluster/instrument) must be available.
- Tempo and time signature must be adjustable with precision.
- The app must not impose a ceiling that frustrates experienced users.
- Minimal, non-patronizing UI that respects expertise.
- Offline capability matters (subway, airplane).

---

### 2.4 Persona: David - The Music Educator

**Archetype**: Teacher who needs engaging tools for students

| Attribute | Detail |
|-----------|--------|
| **Age** | 45 |
| **Location** | Portland, OR |
| **Occupation** | Middle school music teacher |
| **Education** | M.Ed. in Music Education |
| **Tech Comfort** | Moderate; comfortable with educational technology, not audio engineering |
| **Devices** | School-issued Windows laptop, personal iPad, classroom has a SMART Board |
| **Music Background** | Trained pianist and choral director; limited experience with electronic production |
| **Income** | ~$62K/year |

**Goals**
- Engage students who are not interested in traditional instruments.
- Teach rhythm, pattern recognition, and ensemble playing through accessible tools.
- Run classroom activities that work with 25+ students simultaneously.
- Demonstrate that music creation is for everyone, not just "talented" kids.

**Frustrations**
- Chrome Music Lab is great for younger kids but too limited for middle schoolers.
- GarageBand requires Apple devices the school cannot afford uniformly.
- Students lose interest when tools require reading music or understanding theory first.
- Needs activities that produce results in a single class period (45 minutes).
- IT department restricts software installation; web apps are the only option.

**Behavioral Patterns**
- Plans activities in advance; needs predictable, reliable behavior.
- Uses tools in guided, structured ways with clear objectives.
- Values the ability to demonstrate on a projector/SMART Board.
- Needs to manage noise levels (30 students tapping simultaneously).

**Usage Scenario**

David projects TapBeats on the SMART Board and demonstrates by tapping a simple pattern on his desk. Students see the waveform, the detected clusters, and the instrument assignment in real time. He then has each student open TapBeats on their Chromebook, tap a 4-bar pattern, and assign instruments. Students share their loops with the class. Advanced students layer multiple passes. The lesson covers rhythm, timbre, and arrangement concepts without requiring anyone to read notation.

**Quote**
> "If I can get a kid who thinks they're 'not musical' to make a beat and smile, I've done my job."

**Design Implications**
- Must work on Chromebooks and school-managed devices with restricted permissions.
- Should support a "classroom mode" or sharable session concept.
- Visual feedback (waveform, cluster visualization) is pedagogically valuable.
- Audio output must work through laptop speakers (no audio interface assumed).
- Consider a "quiet mode" that works with softer taps or screen taps only.
- Content must be appropriate for educational settings (no explicit sample names).

---

### 2.5 Persona Summary Matrix

| Dimension | Ria (Tapper) | Marcus (Aspiring) | Priya (Producer) | David (Educator) |
|-----------|-------------|-------------------|------------------|-----------------|
| **Primary device** | iPhone / Chrome | Android / Chromebook | MacBook / iPhone | Windows / Chromebook |
| **Session length** | 2-5 min | 15-30 min | 1-3 min capture, longer refine | 45 min (class period) |
| **Music knowledge** | None | Low-moderate | Expert | Moderate (traditional) |
| **Primary goal** | Capture + share | Create + learn | Sketch + export | Teach + engage |
| **Key feature need** | One-tap record, social share | Layering, good samples | MIDI/WAV export | Visual feedback, Chromebook support |
| **Tolerance for complexity** | Very low | Moderate | High | Low-moderate |
| **Success metric** | Shared a beat | Made a beat they are proud of | Exported to DAW | Students engaged |
| **Willingness to pay** | Free tier only | Free; maybe $5/mo | $10-20/mo or one-time | School budget ($0 or district PO) |

---

## 3. User Journey Maps

### 3.1 Journey Map: Ria - The Compulsive Tapper

#### Stage 1: Discovery

| Element | Detail |
|---------|--------|
| **Touchpoint** | Sees a TikTok of someone tapping a beat on a coffee cup that transforms into a polished track |
| **Action** | Clicks link in bio, lands on TapBeats website |
| **Thought** | "Wait, that's literally what I do all day" |
| **Emotion** | Curiosity, excitement |
| **Pain point** | If the landing page looks like a "music production tool," she bounces |
| **Delight** | The page shows a 10-second video of tap-to-beat transformation, no jargon |

#### Stage 2: First Use

| Element | Detail |
|---------|--------|
| **Touchpoint** | Opens web app on phone |
| **Action** | Sees a large "Tap to Record" button, presses it, starts tapping on her desk |
| **Thought** | "That's it? Just tap?" |
| **Emotion** | Surprise, slight skepticism |
| **Pain point** | If there is a sign-up wall, tutorial, or permissions dialog before recording, she leaves |
| **Delight** | She is recording within 3 seconds of opening the app. Real-time waveform shows her taps being captured |

#### Stage 3: Core Loop (Cluster + Assign + Play)

| Element | Detail |
|---------|--------|
| **Touchpoint** | Recording stops; app shows 3 detected sound clusters with visual grouping |
| **Action** | Taps each cluster to hear the raw sound, then browses instrument options and assigns kick, snare, hi-hat |
| **Thought** | "Oh my god, that actually sounds like a real beat" |
| **Emotion** | Delight, pride, "I made this" moment |
| **Pain point** | If clusters are wrong (two distinct sounds merged, or one sound split), trust erodes quickly |
| **Pain point** | If instrument previews do not clearly differ from each other, assignment feels arbitrary |
| **Delight** | The quantized playback sounds musical. The before/after comparison is dramatic |

#### Stage 4: Return Use

| Element | Detail |
|---------|--------|
| **Touchpoint** | Opens app again the next day at work |
| **Action** | Records a new beat, tries different surfaces, experiments with tempo |
| **Thought** | "I wonder what this sounds like on a metal tray" |
| **Emotion** | Playful exploration |
| **Pain point** | If previous beats are lost (no persistence without sign-up), motivation drops |
| **Delight** | Discovers that different surfaces create different cluster profiles, feels creative agency |

#### Stage 5: Power Use

| Element | Detail |
|---------|--------|
| **Touchpoint** | Has made 10+ beats, shares regularly |
| **Action** | Starts layering, exploring more instrument options, adjusting quantization |
| **Thought** | "I want to make this one really good" |
| **Emotion** | Investment, creative ambition |
| **Pain point** | Hits ceiling of free sample library; wants more sounds |
| **Delight** | Discovers she can layer multiple recording passes to build complexity |

---

### 3.2 Journey Map: Marcus - The Aspiring Musician

#### Stage 1: Discovery

| Element | Detail |
|---------|--------|
| **Touchpoint** | YouTube video titled "Make beats with NO equipment - just tap" |
| **Action** | Opens link on school Chromebook during lunch |
| **Thought** | "This is probably trash, but let me see" |
| **Emotion** | Skepticism mixed with hope |
| **Pain point** | If it does not work on Chrome OS or requires installation, dead end |
| **Delight** | It loads instantly in the browser with no install |

#### Stage 2: First Use

| Element | Detail |
|---------|--------|
| **Touchpoint** | Web app on Chromebook |
| **Action** | Records himself tapping on the desk and beatboxing |
| **Thought** | "Okay it's picking up my sounds... let's see what happens" |
| **Emotion** | Cautious interest |
| **Pain point** | Chromebook microphone quality is poor; if the app cannot handle low-quality input, results suffer |
| **Pain point** | Cafeteria background noise may contaminate the recording |
| **Delight** | App successfully separates his beatbox kick from his desk taps despite noise |

#### Stage 3: Core Loop

| Element | Detail |
|---------|--------|
| **Touchpoint** | Cluster assignment screen |
| **Action** | Assigns 808 kick, trap snare, hi-hat; enables quantization; loops playback |
| **Thought** | "That actually sounds like something I'd listen to" |
| **Emotion** | Excitement, validation |
| **Pain point** | If available samples sound dated or generic (stock MIDI drums), he dismisses the tool |
| **Delight** | The sample library includes contemporary sounds (808s, trap percussion, lo-fi textures) |

#### Stage 4: Return Use

| Element | Detail |
|---------|--------|
| **Touchpoint** | At home on his phone |
| **Action** | Opens a beat he started at school, adds a second layer, adjusts swing |
| **Thought** | "I'm going to make this one for real" |
| **Emotion** | Creative flow, determination |
| **Pain point** | If cross-device sync requires an account he is reluctant to create, friction occurs |
| **Pain point** | If the phone UI is too different from the Chromebook UI, re-learning is required |
| **Delight** | Seamless continuation from Chromebook to phone; same project, same state |

#### Stage 5: Power Use

| Element | Detail |
|---------|--------|
| **Touchpoint** | Has made 20+ beats over several weeks |
| **Action** | Exports a beat as audio, plays it for friends, considers posting online |
| **Thought** | "I want to rap over this. Can I export just the beat?" |
| **Emotion** | Ambition, pride |
| **Pain point** | If export is behind a paywall he cannot afford, he is blocked at the moment of maximum engagement |
| **Delight** | Free tier includes basic audio export; he downloads and plays the beat in another app while recording vocals |

---

### 3.3 Journey Map: Priya - The Experienced Producer

#### Stage 1: Discovery

| Element | Detail |
|---------|--------|
| **Touchpoint** | Sees a post on a music production subreddit: "This app turns desk tapping into MIDI" |
| **Action** | Opens web app on laptop, reads the feature list first |
| **Thought** | "If this actually exports clean MIDI, it could be useful" |
| **Emotion** | Professional curiosity, high bar for quality |
| **Pain point** | If the marketing is aimed entirely at beginners, she assumes the tool is not for her |
| **Delight** | Feature list mentions MIDI export, WAV stems, adjustable time signature, and quantization strength |

#### Stage 2: First Use

| Element | Detail |
|---------|--------|
| **Touchpoint** | Web app on MacBook Pro |
| **Action** | Records a quick 4-bar pattern tapping on her desk, evaluates the onset detection accuracy |
| **Thought** | "Let me see how accurate the transient detection is" |
| **Emotion** | Evaluative, clinical |
| **Pain point** | If onset detection misses ghost notes or creates false positives, she does not trust the tool |
| **Pain point** | If there is no way to manually correct onset detection errors, it is a dealbreaker |
| **Delight** | Detection is accurate on clear hits; she can manually add/remove/adjust onset markers |

#### Stage 3: Core Loop

| Element | Detail |
|---------|--------|
| **Touchpoint** | Cluster review and export |
| **Action** | Reviews clusters, does not care about built-in samples, exports MIDI directly |
| **Thought** | "I'll use my own samples in Ableton. I just need the pattern" |
| **Emotion** | Efficiency-focused |
| **Pain point** | If MIDI export loses velocity information or timing nuance, the tool is useless to her |
| **Delight** | MIDI export preserves velocity (mapped from tap intensity), and she can control quantization strength to retain human feel |

#### Stage 4: Return Use

| Element | Detail |
|---------|--------|
| **Touchpoint** | On the subway, idea strikes |
| **Action** | Opens app on phone, taps rhythm on her thigh, saves project for later |
| **Thought** | "Captured. I'll refine this at the studio" |
| **Emotion** | Satisfaction at capturing a fleeting idea |
| **Pain point** | If the mobile experience is too dumbed down and loses professional features, she will not use it |
| **Delight** | Mobile and desktop are the same web app with responsive layout; all features available |

#### Stage 5: Power Use

| Element | Detail |
|---------|--------|
| **Touchpoint** | Integrated into her workflow |
| **Action** | Uses TapBeats as her standard rhythm capture tool; has exported 50+ patterns |
| **Thought** | "This is faster than finger-drumming on my Push for initial ideas" |
| **Emotion** | Professional reliance |
| **Pain point** | Wants API access or a plugin version for deeper integration |
| **Delight** | Discovers she can use the raw tapped audio as textural elements in her productions |

---

### 3.4 Journey Map: David - The Music Educator

#### Stage 1: Discovery

| Element | Detail |
|---------|--------|
| **Touchpoint** | Music education conference session: "Technology for Non-Traditional Music Making" |
| **Action** | Visits website on his iPad, bookmarks it, tests later on school laptop |
| **Thought** | "Could this work for my rhythm unit?" |
| **Emotion** | Professional interest, cautious optimism |
| **Pain point** | If it requires software installation, his IT department will block it |
| **Delight** | It is a web app that works in Chrome with no installation or plugins |

#### Stage 2: First Use

| Element | Detail |
|---------|--------|
| **Touchpoint** | Testing alone at his desk after school |
| **Action** | Records himself clapping a simple pattern, walks through the full flow |
| **Thought** | "This is simple enough that my 6th graders could do it" |
| **Emotion** | Relief, planning mode |
| **Pain point** | If microphone permissions are confusing or require admin access on school devices, it is a blocker |
| **Pain point** | If the app uses any language that is inappropriate for a school setting, he cannot use it |
| **Delight** | Clean, appropriate interface; microphone permission is a standard browser dialog students have seen before |

#### Stage 3: Core Loop (Classroom Activity)

| Element | Detail |
|---------|--------|
| **Touchpoint** | Full class of 28 students, each on a Chromebook |
| **Action** | Demonstrates on the SMART Board, then students work individually |
| **Thought** | "They're all engaged. Even Tyler, who never participates" |
| **Emotion** | Professional satisfaction |
| **Pain point** | 28 students tapping simultaneously is loud; classroom management challenge |
| **Pain point** | Some Chromebooks have poor microphones; inconsistent experience across devices |
| **Pain point** | If 28 simultaneous users cause performance issues, the lesson fails |
| **Delight** | Students who "hate music class" are making beats and showing each other. The visual cluster display sparks conversations about timbre and rhythm |

#### Stage 4: Return Use

| Element | Detail |
|---------|--------|
| **Touchpoint** | Next class session; extending the lesson |
| **Action** | Has students load their previous beats, then layer new parts to create arrangements |
| **Thought** | "This maps perfectly to the arrangement concepts in my curriculum" |
| **Emotion** | Confidence in the tool |
| **Pain point** | If student work did not persist between sessions (Chromebooks may clear local data), the lesson plan falls apart |
| **Delight** | Optional account creation preserves projects; students can also share via link |

#### Stage 5: Power Use

| Element | Detail |
|---------|--------|
| **Touchpoint** | End-of-semester project |
| **Action** | Students create multi-layer beats as a final performance piece; David presents TapBeats at a department meeting |
| **Thought** | "I need to write this up as a lesson plan for the district" |
| **Emotion** | Advocacy, ownership |
| **Pain point** | Wants student progress tracking or classroom management features that do not exist yet |
| **Delight** | Colleagues in the department want to adopt it; the tool becomes part of the curriculum |

---

### 3.5 Journey Map Synthesis: Critical Moments

The following moments appear across all four journeys and represent make-or-break interactions:

| Critical Moment | What Must Happen | What Must Not Happen |
|----------------|------------------|---------------------|
| **First recording** | Recording starts within 3 seconds; no gates, walls, or lengthy permissions flows | Sign-up required before first use; tutorial longer than 10 seconds; confusing permissions |
| **Cluster reveal** | Clusters are visually clear, aurally distinct, and mostly correct | Clusters are wrong, unexplained, or presented as raw data without visual grouping |
| **Instrument assignment** | Previews are instant, sound good, and feel meaningfully different from each other | Text-only labels; previews that lag; sounds that all sound the same |
| **First quantized playback** | The "wow" moment. Messy taps become a polished-sounding beat | Over-quantized robotic output; loss of the feel of the original performance |
| **Sharing/export** | One-tap share to social or export to file; fast, no friction | Multi-step export; format limitations; watermarked output |

---

## 4. Competitive Analysis

### 4.1 Competitive Landscape Overview

TapBeats operates at the intersection of three categories: (1) casual music creation tools, (2) sample-based beat makers, and (3) audio capture/processing utilities. No existing product combines real-time onset detection, automatic sound clustering, instrument assignment, and quantization in a single flow.

### 4.2 Detailed Competitor Analysis

#### 4.2.1 GarageBand (Apple)

| Dimension | Assessment |
|-----------|-----------|
| **Platform** | iOS, iPadOS, macOS only |
| **Price** | Free (Apple devices only) |
| **Core model** | Select instrument first, then perform |
| **Strengths** | Massive sound library. Polished UI. Deep feature set. Live Loops for pattern-based creation. Smart Drums offer some "tap and assign" behavior. Strong brand trust. Free. |
| **Weaknesses** | Apple ecosystem lock-in excludes Android and Chromebook users entirely. Steep learning curve for beginners despite Apple's design polish. Instrument-first paradigm requires users to know what they want before they play. Smart Drums still require selecting drum types before placing them. File format is proprietary. Overwhelming feature density for casual users. |
| **TapBeats differentiation** | TapBeats inverts the creation model (perform first, assign later). Works cross-platform in any browser. Radically simpler entry point. Captures real-world sounds rather than offering a virtual instrument. |

#### 4.2.2 BandLab

| Dimension | Assessment |
|-----------|-----------|
| **Platform** | Web, iOS, Android |
| **Price** | Free |
| **Core model** | Full DAW in browser with social/collaboration features |
| **Strengths** | Cross-platform web app. Free with no paywall. Social features (collaboration, sharing, community). Full multitrack recording. Large sound library. No account required to explore. |
| **Weaknesses** | Full DAW complexity is intimidating for casual users. Beat-making requires knowledge of track structure, patterns, and sound selection. No automatic onset detection or sound clustering. Latency issues on web for real-time recording. Social features can feel cluttered. Performance on low-end devices is poor. |
| **TapBeats differentiation** | TapBeats is purpose-built for a single flow (tap to beat) rather than being a general-purpose DAW. Automatic clustering eliminates manual sound sorting. Dramatically lower complexity. Faster time-to-result. |

#### 4.2.3 Soundtrap (Spotify)

| Dimension | Assessment |
|-----------|-----------|
| **Platform** | Web (Chrome-optimized), iOS, Android |
| **Price** | Free tier; $7.99/mo for full features |
| **Core model** | Cloud-based collaborative DAW with education focus |
| **Strengths** | Strong education tier with classroom management. Real-time collaboration. Works in Chrome (good for schools). Spotify backing provides resources and brand recognition. Solid loop library. Podcast creation tools expand use cases. |
| **Weaknesses** | Still a full DAW with associated complexity. No microphone-based beat creation flow. Education features require paid tier. Free tier is limited. Instrument-first paradigm. Collaboration features are overkill for solo casual creation. UI is busy. |
| **TapBeats differentiation** | TapBeats offers a fundamentally different interaction model. Free tier can include core features without a paywall. Simpler UI for the specific task of rhythm creation. Microphone-first approach is novel. |

#### 4.2.4 Figure (by Reason Studios)

| Dimension | Assessment |
|-----------|-----------|
| **Platform** | iOS only |
| **Price** | Free |
| **Core model** | Gesture-based electronic music creation with constrained parameters |
| **Strengths** | Brilliantly simple interaction model. Almost impossible to make something that sounds bad. Extremely fast to create loops. Beautiful, minimal UI. Teaches musical concepts through constraints. Immediate gratification. |
| **Weaknesses** | iOS only. Very limited sound palette. No microphone input. No user audio capture. Output sounds homogeneous after extended use. No export to DAW-friendly formats. Abandoned by developer (last update 2019). Creative ceiling is low. |
| **TapBeats differentiation** | TapBeats captures real-world audio (user taps) rather than generating synthetic sounds. Cross-platform. Active development. Export capability. Each creation is unique because it starts from the user's own sounds and timing. |

#### 4.2.5 Koala Sampler

| Dimension | Assessment |
|-----------|-----------|
| **Platform** | iOS, Android |
| **Price** | $4.99 (one-time) |
| **Core model** | Record samples, assign to pads, sequence or perform |
| **Strengths** | Excellent for sampling real-world sounds. Intuitive pad interface. Strong effects and slicing tools. Active developer. Export options including Ableton integration. Affordable one-time price. Popular in lo-fi and beat-making communities. |
| **Weaknesses** | Still requires manual pad assignment before performing a beat. No automatic onset detection within a continuous recording. No automatic clustering of similar sounds. Requires conscious "sample this, then that" workflow. Learning curve for sequencing. Mobile-only (no web). UI is functional but not welcoming to total beginners. |
| **TapBeats differentiation** | TapBeats automates the sample-to-pad pipeline. Instead of "record a sound, assign to pad, perform a pattern," TapBeats lets users perform the complete pattern first, then handles separation and assignment automatically. This is the core paradigm difference. Koala is "build then play"; TapBeats is "play then build." Web-first makes it accessible without app installation. |

#### 4.2.6 Incredibox

| Dimension | Assessment |
|-----------|-----------|
| **Platform** | Web, iOS, Android |
| **Price** | Free (web demo); $4.99 (mobile app) |
| **Core model** | Drag-and-drop premade loops onto animated characters |
| **Strengths** | Extraordinarily engaging visual design. Impossible to make something that sounds bad. Very popular in education. Low barrier to entry. Charming aesthetic. Multiple themed versions keep it fresh. Great for younger audiences. |
| **Weaknesses** | No user audio input whatsoever. All sounds are premade. Zero creative flexibility beyond arrangement of existing loops. Not a creation tool, more of an arrangement toy. No export. No original content creation. Limited to predefined musical styles. Creative ceiling reached within minutes. |
| **TapBeats differentiation** | TapBeats uses the user's own sounds and timing, making every creation genuinely original. Deeper creative expression. Actual rhythm creation rather than loop arrangement. Output is the user's own performance, processed and polished. |

#### 4.2.7 Chrome Music Lab

| Dimension | Assessment |
|-----------|-----------|
| **Platform** | Web (Chrome) |
| **Price** | Free |
| **Core model** | Collection of music education experiments |
| **Strengths** | Excellent for education. Completely free. No account needed. Beautiful visualizations. Teaches fundamentals (rhythm, pitch, harmonics) intuitively. Works on Chromebooks. Google brand trust in education. |
| **Weaknesses** | Not a music creation tool. Experiments are isolated and shallow. No saving, no export, no persistence. No microphone-based interaction in most experiments. Designed for demonstration, not production. No beat-making capability. Very limited depth. |
| **TapBeats differentiation** | TapBeats is a creation tool, not a demonstration tool. Produces saveable, exportable, shareable output. Microphone-first interaction. Deeper engagement loop. Serves education use case with genuine creative output rather than passive exploration. |

### 4.3 Competitive Positioning Map

```
                        HIGH CREATIVE CEILING
                              |
                    Ableton   |
                    Live      |
                              |
              Koala           |
              Sampler    BandLab  Soundtrap
                              |
                              |
COMPLEX ----------------------+---------------------- SIMPLE
                              |
                              |     TapBeats
                              |     (target position)
                    Figure    |
                              |
              GarageBand      |     Incredibox
              (Smart Drums)   |
                              |     Chrome
                              |     Music Lab
                        LOW CREATIVE CEILING
```

TapBeats targets the upper-right quadrant: simple to use but with genuine creative depth. The key insight is that simplicity of input (tapping) does not require simplicity of output (polished, exportable beats).

### 4.4 Competitive Differentiation Summary

| Differentiator | Unique to TapBeats? | Competitive Advantage |
|---------------|---------------------|----------------------|
| Perform first, assign later | Yes | Eliminates the "blank canvas" problem; captures natural rhythm |
| Automatic onset detection from continuous audio | Yes (in this context) | No manual slicing or sample assignment required |
| Automatic sound clustering | Yes | Intelligent grouping reduces user effort |
| Any-surface instrument | Yes | No hardware required; creative exploration of surfaces |
| Web-first, cross-platform | Shared with BandLab, Soundtrap | But with dramatically lower complexity |
| Zero-prerequisite music creation | Shared with Incredibox, Figure | But with genuine creative originality (user's own sounds) |

---

## 5. Usability Principles

### 5.1 Zero-Friction Recording

**Principle**: The time from "I want to record" to "I am recording" must approach zero.

**Implementation guidelines**:
- The primary screen must feature a single, dominant, unmistakable record control.
- No account creation, tutorial, or onboarding gate before first recording. Users must be able to record within 3 seconds of first opening the app.
- Microphone permission should be requested at the moment of first record tap, not on app load (avoid premature permission prompts that get denied reflexively).
- If permission is denied, provide a clear, non-technical explanation of why it is needed and how to re-enable it, with platform-specific instructions.
- Auto-detect silence at the end of a performance to suggest stopping, but never auto-stop during intentional pauses.
- Latency between tap and visual feedback must be under 50ms to maintain the feeling of real-time response.

**Validation metric**: 90% of first-time users successfully complete a recording within 60 seconds of opening the app.

### 5.2 Audio Feedback Design

**Principle**: Users must always understand what the app is hearing and doing with their audio.

**Implementation guidelines**:
- During recording: real-time waveform or amplitude visualization that responds visibly to each tap. Users must see that their sounds are being captured.
- Onset detection markers should appear in real-time (or near-real-time) during recording so users can verify detection accuracy as they perform.
- Cluster assignment must include instant audio preview. When a user taps a cluster, they hear the representative sound from that cluster immediately. When they select an instrument, they hear the instrument sample immediately.
- Quantization must offer an audible before/after comparison. Users should be able to toggle between their raw timing and quantized timing to understand and control the effect.
- Quantization strength should be a continuous control (not binary on/off) so users can dial in the right amount of correction.
- All audio feedback must be low-latency. Perceptible delay between user action and audio response breaks the sense of direct manipulation.
- Visual representations of audio (waveforms, cluster maps, beat grids) must be accurate and responsive, not decorative approximations.

**Validation metric**: In usability testing, 80% of users can correctly identify which cluster a given tap belongs to by looking at the visual display.

### 5.3 Error Recovery and Forgiveness

**Principle**: Users performing live audio input cannot "undo" a sound. The app must compensate with robust correction tools.

**Implementation guidelines**:
- **Mis-detected onsets**: Users must be able to add missed onsets, remove false positives, and adjust onset timing after recording. This is the most critical correction tool.
- **Mis-clustered sounds**: Users must be able to reassign individual onsets from one cluster to another by dragging, tapping, or selecting. Cluster boundaries must be adjustable.
- **Wrong instrument assignment**: Instrument assignment must be changeable at any time, non-destructively. The original audio is always preserved.
- **Unwanted recording**: Clear and prominent "discard and re-record" option. No "are you sure?" dialog on the first recording (nothing to lose); confirmation dialog on subsequent recordings where previous work exists.
- **Over-quantization**: Quantization must be non-destructive and adjustable after application. Users should be able to return to raw timing at any point.
- **Undo/redo**: Standard undo/redo for all editing operations (cluster reassignment, onset adjustment, instrument changes, quantization changes).
- **Non-destructive editing**: All operations must preserve the original recorded audio. Every transformation must be reversible.

**Validation metric**: Users who make an error during usability testing can recover to their intended state within 10 seconds, without external help.

### 5.4 Progressive Disclosure

**Principle**: Simple by default, powerful on demand. The interface must serve Ria on first use and Priya on power use without compromise.

**Implementation guidelines**:
- The default view shows only: Record, Clusters, Assign, Play/Loop, Share.
- Advanced controls (quantization strength, swing, tempo adjustment, time signature, onset editing, MIDI export, stem export) are accessible but not visible by default.
- Advanced features should be discoverable through natural exploration (expanding panels, long-press/right-click menus, settings) rather than hidden in deep menus.
- The UI must never present music theory vocabulary without context. If "BPM" appears, it should be alongside a human-readable description ("speed") or an interactive control that demonstrates the concept.
- Feature complexity should increase along a natural gradient: Record (anyone) > Assign instruments (anyone) > Adjust quantization (curious) > Edit onsets (invested) > Export MIDI (professional).

**Validation metric**: Ria (casual persona) completes the core flow without encountering any advanced controls. Priya (producer persona) finds MIDI export within 30 seconds of looking for it.

### 5.5 Accessibility

**Principle**: Audio-centric apps present unique accessibility challenges. TapBeats must be usable by people with diverse abilities.

**Implementation guidelines**:

#### For users who are deaf or hard of hearing
- All audio feedback must have a visual equivalent. Waveforms, onset markers, cluster color coding, and beat grid visualizations are not optional polish; they are primary output for users who cannot hear.
- Haptic feedback (vibration on mobile devices) should accompany audio playback events where the platform supports it.
- The visual beat grid with playing indicator must be precise enough to serve as the primary interface for a user who cannot hear the audio.

#### For users with motor impairments
- Screen tapping is a valid input method alongside surface tapping. The app should work entirely through screen interaction without requiring physical surface tapping.
- Touch targets must meet WCAG minimum sizes (44x44px).
- All features must be operable via keyboard on desktop (tab navigation, spacebar for record, arrow keys for navigation).
- Drag interactions (e.g., cluster reassignment, onset adjustment) must have keyboard/button alternatives.

#### For users with visual impairments
- All interface elements must have proper ARIA labels and screen reader support.
- Color must not be the sole differentiator for clusters. Use shape, pattern, or spatial position in addition to color.
- The interface must be usable at 200% zoom without loss of functionality.
- Contrast ratios must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text and UI components).

#### For users with cognitive disabilities
- Minimize the number of decisions required at each step. The core flow should present one clear action per screen/state.
- Use consistent, predictable layout and interaction patterns.
- Provide clear, jargon-free labels and instructions.
- Avoid time-pressure interactions (no countdown timers for recording length, no auto-advancing screens).

#### For users with photosensitive conditions
- Audio visualizations must not flash at frequencies above 3 Hz.
- Provide a reduced-motion mode that simplifies animations.

#### Screen reader behavior specific to audio apps
- Recording state changes (started, stopped) must be announced to screen readers.
- Cluster contents must be navigable and described (e.g., "Cluster 1: 12 hits, sounds like a low thud").
- Playback position should be queryable ("Currently playing beat 3 of 8").

**Validation metric**: A screen reader user can complete the core flow (record, review clusters, assign instruments, play back) without sighted assistance. WCAG 2.1 AA compliance on all pages.

### 5.6 Performance as UX

**Principle**: In a real-time audio application, performance is not a technical concern; it is a user experience concern. Latency, dropped frames, and audio glitches are usability failures.

**Implementation guidelines**:
- Audio input-to-visual-feedback latency must be under 50ms.
- Audio playback latency from user action (tap play) to sound must be under 100ms.
- The app must function on devices with limited resources: Chromebooks with 4GB RAM, Android phones three generations old, laptops on battery power.
- If processing (onset detection, clustering) takes more than 500ms, show a progress indicator. If it takes more than 2 seconds, show an estimated time remaining.
- Offline capability for core recording and playback. Network-dependent features (sharing, sync, cloud samples) must degrade gracefully when offline.
- Audio processing should happen on the client to minimize latency. Server processing should be limited to optional enhancement features.

**Validation metric**: Core flow (record, detect, cluster, assign, play) completes in under 5 seconds of total processing time on a baseline Chromebook.

### 5.7 Trust and Transparency

**Principle**: Users are recording audio in their environments. The app must earn and maintain trust about what happens with that audio.

**Implementation guidelines**:
- Clearly indicate when the microphone is active (persistent visual indicator, not just during initial permission).
- Audio data should be processed locally by default. If any audio is sent to a server, this must be explicitly communicated and consented to.
- Privacy policy must be accessible from the recording screen, not buried in settings.
- No always-on listening. Recording happens only during an explicit, user-initiated recording session.
- Provide clear data deletion controls. Users must be able to permanently delete their recordings.
- In educational contexts, comply with COPPA and FERPA requirements for student data.

**Validation metric**: In usability testing, zero users express discomfort about audio privacy when asked directly.

---

## 6. Key User Research Questions

### 6.1 Core Concept Validation

These questions test whether the fundamental product hypothesis is sound.

| ID | Question | Method | Priority | Success Signal |
|----|----------|--------|----------|----------------|
| CQ-1 | Does the "perform first, assign later" model feel more natural than "select then perform" for rhythm creation? | A/B concept testing with 40+ participants; show both workflows, measure preference and task completion | Critical | 60%+ prefer TapBeats model; faster time-to-first-beat |
| CQ-2 | Do users understand what "clustering" means without explanation, or does the concept need to be reframed? | First-use observation (20+ users); note confusion points at cluster reveal | Critical | 80%+ understand the cluster display within 10 seconds without help |
| CQ-3 | Is the quantized output perceived as "my beat, polished" or "the computer changed my beat"? | Post-task interview; semantic differential scale (my creation vs. computer's creation) | Critical | 70%+ identify the output as primarily their own creation |
| CQ-4 | At what point does quantization stop feeling like "fixing my timing" and start feeling like "erasing my feel"? | Quantization strength experiment; have users set preferred strength, measure distribution | High | Clear preference cluster emerges; informs default quantization value |
| CQ-5 | Do users want to hear their original tapped sounds in the output, or are they happy to fully replace with instrument samples? | Preference testing with three modes: original only, hybrid, full replacement | High | Determines default playback mode and whether hybrid mode is worth building |

### 6.2 Interaction Design Validation

| ID | Question | Method | Priority | Success Signal |
|----|----------|--------|----------|----------------|
| IQ-1 | How do users expect to assign instruments to clusters? (Tap cluster then browse? Drag instrument to cluster? Side-by-side?) | Design exploration with 3 prototypes; preference ranking and task timing | High | One design variant is measurably faster and preferred |
| IQ-2 | What is the minimum viable visual feedback during recording that makes users feel confident their taps are being captured? | Progressive reduction test: start with rich visualization, remove elements until confidence drops | High | Identifies the threshold visualization that must ship in v1 |
| IQ-3 | Do users attempt to "undo" taps during recording, and if so, what gesture do they expect? | First-use observation; note spontaneous undo attempts | Medium | Determines whether real-time onset deletion during recording is needed |
| IQ-4 | How do users expect to layer additional parts? (New recording over loop? Separate track? Overdub mode?) | Task-based testing with think-aloud protocol | High | Informs multi-layer recording design |
| IQ-5 | When clusters are wrong (merged or split incorrectly), do users notice, and can they correct it without instruction? | Intentionally imperfect clustering in test; observe correction behavior | High | Determines UX investment needed in cluster editing tools |

### 6.3 Audience and Market Validation

| ID | Question | Method | Priority | Success Signal |
|----|----------|--------|----------|----------------|
| MQ-1 | Which persona segment shows the strongest product-market fit in early adoption? | Segmented beta launch; measure engagement and retention by persona type | High | One segment shows 2x+ engagement; informs marketing and feature priority |
| MQ-2 | Is the education market a viable early adoption channel? | Teacher interviews (15+); classroom pilot (3+ classrooms) | Medium | Teachers report it fits curriculum needs; students engage without constant prompting |
| MQ-3 | What sample/sound library is minimum viable for each persona? | Card sorting exercise with sound categories; preference ranking | Medium | Identifies launch sample library composition |
| MQ-4 | What is the willingness to pay, and for what features? | Van Westendorp pricing study (200+ respondents); feature-value ranking | Medium | Identifies price sensitivity and monetizable features |
| MQ-5 | Do users share their creations? If so, where and why? | In-app share tracking; post-share survey (why did you share? where?) | Medium | Determines social features investment and platform integrations |

### 6.4 Technical Experience Validation

| ID | Question | Method | Priority | Success Signal |
|----|----------|--------|----------|----------------|
| TQ-1 | Does onset detection accuracy meet user expectations on real-world input (varied surfaces, ambient noise, low-quality microphones)? | Controlled test with 10 surface types, 5 microphone qualities, 3 noise levels; measure detection accuracy and user satisfaction | Critical | 90%+ detection accuracy on clean input; 75%+ on noisy/low-quality input; user satisfaction correlates |
| TQ-2 | How does clustering accuracy degrade with more than 4 distinct sound sources, and does this match user expectations? | Progressive complexity test: 2, 3, 4, 5, 6 distinct sounds; measure clustering accuracy and user frustration | High | Identifies the practical limit for v1 (likely 3-5 clusters) |
| TQ-3 | Is the Web Audio API sufficient for acceptable recording and playback latency across target devices? | Technical benchmarking on Chromebook, low-end Android, midrange iPhone, MacBook; measure actual latency | Critical | Sub-100ms input-to-feedback on 80%+ of target devices |
| TQ-4 | Do users on low-end Chromebooks experience performance degradation that affects usability? | Task completion test on minimum-spec Chromebook; measure time-on-task and errors vs. high-end device | High | Less than 20% degradation in task completion time; zero critical failures |

### 6.5 Longitudinal and Retention Questions

| ID | Question | Method | Priority | Success Signal |
|----|----------|--------|----------|----------------|
| LQ-1 | What triggers return visits? (New idea? Social prompt? Notification? Boredom?) | Diary study (2 weeks, 20 participants); return-visit survey | Medium | Identifies organic return triggers to amplify |
| LQ-2 | Does creative output quality improve with repeated use, and does the user perceive improvement? | Longitudinal skill tracking; rate output quality over 10 sessions; self-assessment survey | Medium | Users perceive improvement; objective quality increases |
| LQ-3 | At what point do users exhaust the sample library and want more? | Usage tracking of sample selection diversity over time | Medium | Informs sample library expansion roadmap |
| LQ-4 | Do users transition from TapBeats to traditional DAWs, and does TapBeats accelerate that transition? | 3-month follow-up survey with export users | Low | Determines positioning: gateway vs. standalone tool |

---

## 7. Success Metrics and KPIs

### 7.1 North Star Metric

**Beats completed and played back per week (across all users)**

This metric captures the full value delivery chain: a user recorded, the app processed, the user assigned instruments, and the output was played. It reflects both acquisition and engagement, and it requires the core technology to work correctly.

### 7.2 Acquisition Metrics

| Metric | Definition | Target (6-month) | Measurement |
|--------|-----------|-------------------|-------------|
| **Monthly Active Users (MAU)** | Unique users who open the app in a 30-day period | 50,000 | Analytics |
| **First Recording Rate** | % of new visitors who complete at least one recording | 60% | Funnel analytics |
| **Time to First Recording** | Median time from first page load to recording start | < 30 seconds | Event timing |
| **Microphone Permission Grant Rate** | % of users who grant mic permission when prompted | 75% | Permission API tracking |
| **Bounce Rate (pre-recording)** | % of visitors who leave before recording | < 40% | Analytics |

### 7.3 Activation Metrics

| Metric | Definition | Target (6-month) | Measurement |
|--------|-----------|-------------------|-------------|
| **Core Loop Completion Rate** | % of users who complete Record > Cluster > Assign > Play | 50% of those who start recording | Funnel analytics |
| **"Aha Moment" Rate** | % of users who play back a quantized beat (hypothesized activation event) | 45% of new users | Event tracking |
| **Cluster Interaction Rate** | % of users who interact with at least one cluster (tap to preview, reassign) | 70% of those who reach cluster view | Event tracking |
| **Instrument Assignment Completion** | % of users who assign instruments to all clusters (vs. accepting defaults or abandoning) | 60% of those who reach assignment | Event tracking |

### 7.4 Engagement Metrics

| Metric | Definition | Target (6-month) | Measurement |
|--------|-----------|-------------------|-------------|
| **Sessions per Week (active users)** | Average sessions per active user per week | 3+ | Analytics |
| **Beats per Session** | Average complete beats created per session | 1.5+ | Event tracking |
| **Session Duration** | Median session length | 5-15 minutes (varies by persona) | Analytics |
| **Layering Rate** | % of beats that use more than one recording pass | 20% | Event tracking |
| **Feature Depth Score** | Average number of distinct features used per session (record, cluster edit, quantization adjust, tempo change, export, share) | 3+ features | Event tracking |
| **Advanced Feature Adoption** | % of users who use onset editing, quantization strength, or tempo adjustment within first 5 sessions | 15% | Event tracking |

### 7.5 Retention Metrics

| Metric | Definition | Target (6-month) | Measurement |
|--------|-----------|-------------------|-------------|
| **Day 1 Retention** | % of new users who return on day 2 | 30% | Cohort analysis |
| **Day 7 Retention** | % of new users who return within 7 days | 20% | Cohort analysis |
| **Day 30 Retention** | % of new users who return within 30 days | 10% | Cohort analysis |
| **Weekly Active / Monthly Active Ratio** | WAU/MAU stickiness | 40%+ | Analytics |
| **Resurrection Rate** | % of churned users (inactive 30+ days) who return | 5% | Cohort analysis |

### 7.6 Output and Quality Metrics

| Metric | Definition | Target (6-month) | Measurement |
|--------|-----------|-------------------|-------------|
| **Onset Detection Accuracy** | % of taps correctly detected (no false positives, no missed taps) | 92%+ on standard input | Automated testing + user reports |
| **Clustering Accuracy** | % of onsets assigned to the correct cluster (validated against human judgment) | 85%+ with 3-4 distinct sounds | Validation study |
| **Share Rate** | % of completed beats that are shared (any channel) | 15% | Event tracking |
| **Export Rate** | % of completed beats that are exported (audio or MIDI) | 10% | Event tracking |
| **Playback Listen-Through Rate** | % of playbacks where the user listens to the full loop at least twice | 60% | Audio playback tracking |

### 7.7 Satisfaction Metrics

| Metric | Definition | Target (6-month) | Measurement |
|--------|-----------|-------------------|-------------|
| **Net Promoter Score (NPS)** | Likelihood to recommend (0-10 scale, % promoters minus % detractors) | 40+ | In-app survey (after 5th session) |
| **System Usability Scale (SUS)** | Standardized usability questionnaire (0-100) | 75+ (good) | Periodic survey |
| **Creative Satisfaction** | "How satisfied are you with the beat you just made?" (1-5 scale) | 3.8+ average | Post-creation prompt |
| **Perceived Ownership** | "This beat feels like something I created" (1-5 agreement scale) | 4.0+ average | Post-creation prompt |
| **App Store / Review Rating** | Average public rating | 4.3+ stars | Store analytics |

### 7.8 Education-Specific Metrics

| Metric | Definition | Target (6-month) | Measurement |
|--------|-----------|-------------------|-------------|
| **Classroom Adoption** | Number of verified educators using TapBeats in lessons | 100+ classrooms | Educator registration |
| **Student Engagement Rate** | % of students in a class session who complete at least one beat | 85% | Classroom pilot data |
| **Lesson Plan Completion** | % of educator-designed activities completed within a class period | 90% | Educator survey |
| **Educator NPS** | NPS among verified educators | 50+ | Educator survey |

### 7.9 Technical Performance KPIs (UX-impacting)

| Metric | Definition | Target | Measurement |
|--------|-----------|--------|-------------|
| **Recording Start Latency** | Time from record button tap to actual audio capture start | < 200ms | Technical profiling |
| **Audio Playback Latency** | Time from play button tap to audio output | < 100ms | Technical profiling |
| **Processing Time (onset + clustering)** | Time from recording stop to cluster display for an 8-bar, 4-cluster beat | < 3 seconds on Chromebook | Technical profiling |
| **Page Load Time** | Time from navigation to interactive state | < 2 seconds on 4G | Lighthouse / RUM |
| **Error Rate** | % of sessions with a JavaScript error or audio processing failure | < 1% | Error tracking |
| **Cross-Browser Compatibility** | % of target browsers (Chrome, Safari, Firefox, Edge) passing full test suite | 100% | Automated testing |

### 7.10 Metric Dependencies and Funnel

```
Visitors
  |-- Mic Permission Granted (75%)
       |-- First Recording Started (80% of permitted = 60% of visitors)
            |-- Recording Completed (85%)
                 |-- Clusters Reviewed (90%)
                      |-- Instruments Assigned (75%)
                           |-- Quantized Playback Heard (90%)
                                |-- ** "Aha Moment" ** (= ~31% of all visitors)
                                     |-- Shared (15%)
                                     |-- Exported (10%)
                                     |-- Created Another Beat (40%)
                                     |-- Returned Next Day (30%)
```

Each step in this funnel represents a measurable drop-off point. Research should focus on understanding and reducing the largest drops, prioritized by impact on the north star metric.

---

## 8. Research Roadmap

### Phase 1: Concept Validation (Pre-development)

**Timeline**: 2-3 weeks

**Objective**: Validate the core "perform first, assign later" hypothesis before significant engineering investment.

| Activity | Participants | Deliverable |
|----------|-------------|-------------|
| Concept interviews | 20 participants across all 4 persona types | Concept validation report with go/no-go recommendation |
| Competitive experience audit | Internal team uses all 8 competitors for a week | Competitive insight document with annotated screenshots |
| Paper prototype testing of core flow | 12 participants | Interaction model preference data |
| Technical feasibility spike: onset detection accuracy | Internal | Accuracy benchmarks on target devices |

### Phase 2: Design Validation (During development)

**Timeline**: 4-6 weeks, concurrent with engineering

**Objective**: Validate key interaction design decisions and identify usability issues before launch.

| Activity | Participants | Deliverable |
|----------|-------------|-------------|
| Usability testing on interactive prototype | 5 participants per round, 3 rounds | Prioritized usability findings per round |
| Cluster UI design exploration (IQ-1, IQ-5) | 15 participants | Recommended cluster interaction design |
| Quantization perception study (CQ-3, CQ-4) | 20 participants | Recommended default quantization settings |
| Accessibility audit | 3 participants with disabilities + automated tools | Accessibility compliance report |
| Chromebook and low-end device testing (TQ-3, TQ-4) | 10 participants on school Chromebooks | Device compatibility findings |

### Phase 3: Beta Validation (Pre-launch)

**Timeline**: 3-4 weeks

**Objective**: Validate the complete experience end-to-end with real users in real contexts.

| Activity | Participants | Deliverable |
|----------|-------------|-------------|
| Closed beta with instrumented analytics | 200-500 users across persona segments | Funnel analysis, engagement data, bug reports |
| Classroom pilot | 3 classrooms, 75+ students | Education-specific findings and lesson plan templates |
| Diary study (LQ-1, LQ-2) | 20 beta users over 2 weeks | Return-use triggers, skill progression data |
| NPS and SUS baseline survey | All beta users | Baseline satisfaction scores |

### Phase 4: Post-Launch Continuous Research

**Timeline**: Ongoing

**Objective**: Continuously improve the product based on real usage data and ongoing user feedback.

| Activity | Cadence | Deliverable |
|----------|---------|-------------|
| Funnel analysis and drop-off investigation | Weekly | Prioritized UX improvement backlog |
| User interviews (focused on churn and power use) | Biweekly, 5 users per round | Churn insights, power user feature requests |
| A/B testing (cluster UI, onboarding, sample library) | Continuous | Data-driven design decisions |
| Accessibility regression testing | Monthly | Compliance maintenance |
| Competitive monitoring | Quarterly | Updated competitive positioning |
| Pricing and willingness-to-pay study (MQ-4) | Once, post product-market fit signal | Monetization strategy |

---

*This UX Research section should be treated as a living document. Findings from each research phase should be documented and fed back into persona refinements, journey map updates, and metric target adjustments. Research questions that are validated should be marked as such with a summary of findings. Questions that are invalidated should trigger reassessment of dependent design decisions.*
