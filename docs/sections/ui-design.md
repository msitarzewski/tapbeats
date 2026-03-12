# UI/UX Design

> TapBeats PRD -- Section: UI/UX Design Specification
> Version: 1.0 | Date: 2026-03-12 | Status: Draft

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Visual Design System](#2-visual-design-system)
3. [Screen-by-Screen Breakdown](#3-screen-by-screen-breakdown)
4. [Interaction Patterns](#4-interaction-patterns)
5. [Responsive Behavior](#5-responsive-behavior)
6. [Onboarding Flow](#6-onboarding-flow)
7. [Error States & Edge Cases](#7-error-states--edge-cases)
8. [Accessibility](#8-accessibility)
9. [Micro-interactions & Delight](#9-micro-interactions--delight)

---

## 1. Design Philosophy

### 1.1 Core Principles

TapBeats is an instrument, not software. Every design decision flows from this distinction. When a drummer sits behind a kit, the kit does not demand attention -- the kit disappears. The sticks, the heads, the pedals become extensions of the body. TapBeats must achieve this same vanishing act: the interface should be felt, not seen.

Five principles govern every pixel, animation, and interaction:

**Principle 1: Instrument-first, not software-first.** The UI is a control surface, not an application. Controls should feel physical. The Record button is not a form submission -- it is a "go" trigger with the same urgency as pressing a foot pedal. Cluster cards are not data tables -- they are sound objects you tap to hear. The timeline is not a spreadsheet -- it is a rhythmic surface you scan with your eyes and manipulate with your hands.

**Principle 2: Minimal until needed.** Show only what the current moment demands. During recording, the user needs the waveform, the hit indicators, and the stop button. Nothing else. Complexity emerges progressively -- never all at once. Every element must earn its screen real estate by serving the immediate task.

**Principle 3: Dark mode default, studio aesthetic.** Professional audio tools live in dark environments -- studios, stages, bedrooms with the lights off. A dark interface reduces eye strain during focused creative work, makes colored waveforms and hit indicators pop visually, and signals to the user that this is a creative tool, not a utility app. The dark theme is not an afterthought toggle -- it is the primary design surface.

**Principle 4: One-hand mobile first.** The primary use case is a phone in one hand while the other hand taps. This means: large touch targets (minimum 48px), thumb-reachable controls in the lower two-thirds of the screen, no precision gestures required during recording, and no two-hand interactions for core functionality.

**Principle 5: Accessible from day one.** Accessibility is not a compliance checkbox. Screen reader support, keyboard navigation, color contrast, reduced motion, and alternative input methods are designed into the foundation, not bolted on after visual design is "done." Every component has an accessible implementation plan from the start.

### 1.2 Design Mood

The visual language sits at the intersection of three references:

- **Professional DAW** -- the seriousness, precision, and dark palette of Ableton Live or Logic Pro
- **Mobile-native simplicity** -- the gestural ease and progressive disclosure of iOS or Material Design
- **Instrument physicality** -- the tactile, responsive feel of hardware drum machines (Akai MPC, Roland TR-808)

The result is an interface that feels premium but not intimidating, minimal but not empty, dark but not grim.

### 1.3 Design Constraints

These constraints are non-negotiable and derived from the technical architecture (`technical-architecture.md#11`) and product requirements (`product-requirements.md#3`):

| Constraint | Implication |
|---|---|
| Client-only SPA (React + CSS Modules) | No server-rendered layouts; all UI state managed via Zustand |
| 60fps during recording and playback (`NFR-002`) | Canvas for timeline and waveform; no DOM-heavy animations during audio |
| < 50ms onset-to-visual latency (`NFR-001`) | Hit indicators must use requestAnimationFrame, not React re-renders |
| One AudioContext for entire app | UI transitions must not disrupt audio; no page reloads during session |
| IndexedDB for persistence | Session list is async; loading states required |
| No accounts, no server | All data is local; export flows replace "save to cloud" |

---

## 2. Visual Design System

### 2.1 Color Palette -- Dark Theme (Primary)

The palette is built on a warm neutral base (charcoal, not blue-black) with a coral-orange primary accent per brand direction (`brand-strategy.md#Logo Direction`). Instrument/cluster colors are chosen for maximum mutual distinguishability under color vision deficiency simulation (deuteranopia, protanopia, tritanopia).

#### Core Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#121214` | App background, main canvas |
| `--bg-secondary` | `#1A1A1E` | Card backgrounds, panels, sidebar |
| `--bg-tertiary` | `#242428` | Elevated surfaces, dropdowns, modals |
| `--bg-hover` | `#2E2E34` | Hover state for interactive surfaces |
| `--bg-active` | `#38383F` | Active/pressed state for surfaces |
| `--border-subtle` | `#2E2E34` | Dividers, card borders |
| `--border-default` | `#3A3A42` | Input borders, section dividers |
| `--border-focus` | `#FF6B3D` | Focus ring color (matches primary) |

#### Text Colors

| Token | Hex | Contrast on `#121214` | Usage |
|---|---|---|---|
| `--text-primary` | `#F0F0F2` | 15.2:1 | Headings, primary labels |
| `--text-secondary` | `#A0A0A8` | 7.1:1 | Body text, descriptions |
| `--text-tertiary` | `#6E6E78` | 4.5:1 | Captions, timestamps, hints |
| `--text-disabled` | `#4A4A52` | 3.0:1 | Disabled labels (not for actionable text) |
| `--text-inverse` | `#121214` | N/A (used on light surfaces) | Text on accent buttons |

#### Accent Colors

| Token | Hex | Usage |
|---|---|---|
| `--accent-primary` | `#FF6B3D` | Primary CTA (Record button), links, focus rings |
| `--accent-primary-hover` | `#FF8259` | Hover state for primary accent |
| `--accent-primary-muted` | `#FF6B3D26` | 15% opacity background tint for selected states |
| `--accent-secondary` | `#3B82F6` | Playback cursor, timeline selection, info |
| `--accent-secondary-muted` | `#3B82F626` | 15% opacity background tint |

#### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#34D399` | Successful export, valid state |
| `--color-warning` | `#FBBF24` | Caution, sensitivity warnings |
| `--color-error` | `#F87171` | Errors, permission denied, recording failure |
| `--color-info` | `#60A5FA` | Informational banners, tooltips |

#### Instrument/Cluster Colors

These eight colors are the default cluster assignment palette. They are ordered for perceptual distinctness and tested against all three common color vision deficiency types. Each color has a dark variant (used for track backgrounds) and a light variant (used for hit markers and waveforms).

| Index | Name | Base Hex | Dark (15%) Hex | Assignment |
|---|---|---|---|---|
| 0 | Coral | `#FF6B6B` | `#FF6B6B26` | Kick (default) |
| 1 | Amber | `#FFB347` | `#FFB34726` | Snare (default) |
| 2 | Cyan | `#4DD4E6` | `#4DD4E626` | Hi-hat closed (default) |
| 3 | Violet | `#A78BFA` | `#A78BFA26` | Hi-hat open (default) |
| 4 | Lime | `#86EFAC` | `#86EFAC26` | Tom high |
| 5 | Pink | `#F9A8D4` | `#F9A8D426` | Tom low |
| 6 | Sky | `#7DD3FC` | `#7DD3FC26` | Ride |
| 7 | Gold | `#FDE68A` | `#FDE68A26` | Crash |

#### Light Theme Override (Secondary)

For users who prefer light mode or outdoor usage. Toggled in Settings.

| Token | Light Value |
|---|---|
| `--bg-primary` | `#FAFAFA` |
| `--bg-secondary` | `#FFFFFF` |
| `--bg-tertiary` | `#F3F3F5` |
| `--text-primary` | `#121214` |
| `--text-secondary` | `#52525B` |
| `--accent-primary` | `#E85D30` (darkened for contrast on white) |
| `--border-default` | `#D4D4D8` |

### 2.2 Typography

The type system uses two families: a geometric sans-serif for UI and a monospace for numerical/code-like data (BPM, timecodes, grid values). Per brand direction (`brand-strategy.md#Logo Direction`), the primary font should have rounded terminals.

#### Font Stack

```css
--font-primary: 'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', ui-monospace, monospace;
```

Inter is recommended as the primary: it is open source (SIL Open Font License), has an extensive weight range, excellent legibility at small sizes, and tabular number support. If a more rounded alternative is preferred for brand alignment, `DM Sans` or `Plus Jakarta Sans` are viable substitutes with similar characteristics.

#### Type Scale

Built on a 1.25 modular scale (Major Third) from a 16px base. All sizes specified in `rem` for user font-size preference scaling.

| Token | Size (rem) | Size (px) | Line Height | Weight | Usage |
|---|---|---|---|---|---|
| `--text-xs` | 0.6875 | 11 | 1.45 | 400 | Timestamps, fine print |
| `--text-sm` | 0.8125 | 13 | 1.45 | 400 | Captions, secondary labels |
| `--text-base` | 1.0 | 16 | 1.5 | 400 | Body text, input values, cluster card content |
| `--text-md` | 1.125 | 18 | 1.45 | 500 | Subheadings, button labels |
| `--text-lg` | 1.25 | 20 | 1.4 | 600 | Section headers, screen titles |
| `--text-xl` | 1.5 | 24 | 1.35 | 600 | Page-level headings |
| `--text-2xl` | 2.0 | 32 | 1.25 | 700 | Hero text (landing screen only) |
| `--text-3xl` | 2.5 | 40 | 1.2 | 700 | BPM display (large), recording timer |

Monospace is used for: BPM values, time displays (00:08.3), grid resolution labels (1/16), quantization percentage, and hit counts.

#### Font Weight Assignments

| Weight | Value | Usage |
|---|---|---|
| Regular | 400 | Body text, descriptions, input values |
| Medium | 500 | Button labels, navigation items, subheadings |
| Semibold | 600 | Section headers, emphasis, active navigation |
| Bold | 700 | Hero text, BPM large display, critical alerts |

### 2.3 Spacing System

An 4px base unit with a spacing scale that covers all layout needs. Consistent spacing creates visual rhythm -- appropriate for a rhythm app.

| Token | Value | Usage |
|---|---|---|
| `--space-0` | 0px | Reset |
| `--space-1` | 4px | Inline icon-to-text gap, fine adjustments |
| `--space-2` | 8px | Compact padding (badges, chips), icon padding |
| `--space-3` | 12px | Input padding (vertical), tight list item gap |
| `--space-4` | 16px | Standard padding, gap between related elements |
| `--space-5` | 20px | Card content padding |
| `--space-6` | 24px | Section gap, card-to-card margin |
| `--space-8` | 32px | Major section separation |
| `--space-10` | 40px | Page margin (mobile) |
| `--space-12` | 48px | Touch target minimum dimension |
| `--space-16` | 64px | Large component height (transport bar) |
| `--space-20` | 80px | Record button diameter |

### 2.4 Elevation & Shadows

Dark themes rely on surface brightness rather than shadows for depth. Each elevation level increases `--bg-*` brightness.

| Level | Surface Color | Border | Usage |
|---|---|---|---|
| 0 (base) | `--bg-primary` (#121214) | None | Page background |
| 1 (raised) | `--bg-secondary` (#1A1A1E) | `--border-subtle` | Cards, panels |
| 2 (elevated) | `--bg-tertiary` (#242428) | `--border-default` | Dropdowns, popovers, modals |
| 3 (floating) | `#2C2C32` | `--border-default` + `0 8px 24px #00000060` | Tooltips, toasts |

Shadow is used sparingly and only at level 3 (floating elements).

### 2.5 Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Badges, small chips |
| `--radius-md` | 8px | Buttons, inputs, cards |
| `--radius-lg` | 12px | Modals, large panels |
| `--radius-xl` | 16px | Cluster cards, recording panel |
| `--radius-full` | 9999px | Circular buttons (Record), pills, avatars |

### 2.6 Component Inventory

All components use CSS Modules per the tech stack (`technical-architecture.md#11.1`). Each component listed here maps to a file in `src/components/` per the project structure.

#### Buttons

Three variants, three sizes. All meet 48px minimum touch target on mobile (padding expands the hit area even if visual size is smaller).

```
Variant        Background               Text Color          Border
-------        ----------               ----------          ------
Primary        --accent-primary         --text-inverse      none
Secondary      transparent              --text-primary      --border-default
Ghost          transparent              --text-secondary    none

Size           Height    Padding (h)    Font Size    Min Touch Target
----           ------    -----------    ---------    ----------------
Small          32px      12px           --text-sm    48px (via padding)
Medium         40px      16px           --text-base  48px
Large          48px      20px           --text-md    48px

States:
  :hover       +8% brightness on background
  :active      -4% brightness on background, scale(0.98)
  :focus       2px solid --border-focus, 2px offset
  :disabled    40% opacity, pointer-events: none
```

The Record button is a special case -- see Section 3.2.

#### Inputs

Text inputs, number inputs, and select dropdowns follow a single visual pattern.

```
Property        Value
--------        -----
Height          40px
Padding         12px horizontal
Background      --bg-secondary
Border          1px solid --border-default
Border Radius   --radius-md
Font            --text-base, --font-primary
Placeholder     --text-tertiary

States:
  :focus        border-color: --accent-primary; box-shadow: 0 0 0 3px --accent-primary-muted
  :invalid      border-color: --color-error; box-shadow: 0 0 0 3px #F8717126
  :disabled     opacity: 0.4
```

#### Sliders

Used for quantization strength, volume, and BPM adjustment.

```
Property        Value
--------        -----
Track Height    4px
Track Color     --bg-hover (unfilled), --accent-primary (filled)
Thumb Size      20px diameter (48px touch target via transparent padding)
Thumb Color     --accent-primary
Thumb Border    2px solid --bg-primary (creates visual separation)

States:
  :hover        Thumb scales to 24px
  :active       Thumb scales to 22px, --accent-primary-hover fill
  :focus        2px focus ring around thumb
```

#### Cards

Used for cluster display, session list, and sample browser.

```
Property        Value
--------        -----
Background      --bg-secondary
Border          1px solid --border-subtle
Border Radius   --radius-xl
Padding         --space-5
Gap (children)  --space-3

States:
  :hover        background: --bg-hover; border-color: --border-default
  Selected      border-color: --accent-primary; background: --accent-primary-muted
```

#### Modal / Bottom Sheet

On mobile, modals render as bottom sheets (slide up from bottom). On desktop, they render as centered overlays.

```
Mobile (Bottom Sheet):
  Width           100%
  Max Height      85vh
  Border Radius   --radius-lg --radius-lg 0 0 (top corners only)
  Background      --bg-tertiary
  Backdrop        #00000080

Desktop (Modal):
  Width           min(480px, 90vw)
  Max Height      80vh
  Border Radius   --radius-lg
  Background      --bg-tertiary
  Backdrop        #00000060
  Shadow          0 16px 48px #00000040
```

### 2.7 Waveform Rendering Style

Waveforms appear in three contexts: live recording, cluster card previews, and full-track overview. All are rendered on HTML5 Canvas 2D.

```
Live Waveform (Recording Screen):
  Style           Mirrored (centered) amplitude bars
  Bar Width       2px
  Bar Gap         1px
  Bar Radius      1px (rounded caps)
  Idle Color      --text-tertiary (30% opacity)
  Active Color    --accent-primary
  Hit Flash       White (#FFFFFF) at 80% opacity, fades over 150ms
  Frame Rate      60fps via requestAnimationFrame

Cluster Card Waveform:
  Style           Single-sided amplitude envelope (top only)
  Height          48px
  Color           Cluster's assigned instrument color
  Background      transparent
  Resolution      1 bar per 2px

Timeline Track Waveform (optional, behind hit markers):
  Style           Ghost waveform of original recording
  Color           --text-disabled at 20% opacity
  Height          Full track height
```

### 2.8 Icon Style

Icons follow a consistent stroke-based style at 24x24 default size with 1.5px stroke width. Preferred source: Lucide Icons (MIT license, consistent with React ecosystem). Custom icons only where no suitable Lucide icon exists.

```
Default Size    24x24
Stroke Width    1.5px
Corner Radius   Rounded joins
Color           currentColor (inherits from parent text color)
Touch Target    48x48 minimum (padded)

Custom icons needed:
  - Waveform (3-bar sound wave)
  - Drum pad (rounded square with concentric rings)
  - Quantize (grid with snap indicator)
  - Cluster (grouped dots)
```

### 2.9 Animation Principles

| Property | Duration | Easing | Usage |
|---|---|---|---|
| Micro-interaction | 100-150ms | `ease-out` | Button press, toggle, checkbox |
| State change | 200-300ms | `ease-in-out` | Panel open/close, view transition |
| Emphasis | 300-500ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring) | Hit pulse, cluster formation, snap |
| Loading | 1000ms+ | `linear` | Skeleton shimmer, progress bar |

All animations respect `prefers-reduced-motion: reduce`. When reduced motion is active: transitions drop to 0ms (instant), pulses/springs become opacity fades at 150ms, and the playback cursor still moves (functional, not decorative).

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  /* Exception: playback cursor motion is functional */
  .timeline-cursor {
    transition-duration: 0ms;  /* Still moves, just no easing */
  }
}
```

---

## 3. Screen-by-Screen Breakdown

### 3.1 Landing / Home Screen

The home screen serves two audiences: first-time users who need a clear path to recording, and returning users who want to resume a session. The design heavily favors the first-time path -- the Record button dominates.

#### Layout

```
+------------------------------------------+
|  [=]  TapBeats                    [gear]  |   <- Header: 56px
|------------------------------------------|
|                                          |
|                                          |
|                                          |
|              [ (()) ]                    |   <- Record button: 80px circle
|            Tap to Record                 |   <- Label: --text-secondary
|                                          |
|                                          |
|------------------------------------------|
|  Recent Sessions                  See all |   <- Section header
|  +------+  +------+  +------+           |
|  | Ses1 |  | Ses2 |  | Ses3 |           |   <- Horizontal scroll
|  | 4 trk|  | 3 trk|  | 2 trk|           |
|  | 2m ago|  | 1d   |  | 3d   |           |
|  +------+  +------+  +------+           |
|                                          |
+------------------------------------------+
```

#### Element Specifications

**Header** (maps to `src/components/layout/Header.tsx`):
- Height: 56px
- Left: hamburger menu icon (24px, `--text-secondary`) -- opens settings/about panel
- Center: "TapBeats" wordmark in `--text-lg`, `--font-primary`, weight 600
- Right: gear icon (24px, `--text-secondary`) -- navigates to Settings
- Background: `--bg-primary` (same as page, no visual separation -- feels open)
- Bottom border: none on home screen (added on other screens for context)

**Record Button**:
- Size: 80px diameter circle
- Background: `--accent-primary` (#FF6B3D)
- Icon: filled circle (record dot), 24px, `--text-inverse`
- Shadow: `0 0 0 4px #FF6B3D26` (subtle outer glow ring)
- Position: centered horizontally, vertically placed at ~40% from top (golden section, thumb-reachable)
- Label below: "Tap to Record" in `--text-base`, `--text-secondary`, 8px below button
- Touch target: 80px (exceeds 48px minimum)
- Idle animation: slow pulse on the outer glow ring (opacity oscillates 0.15 to 0.35 over 2 seconds, `ease-in-out` loop). Communicates "ready" without being distracting. Disabled under `prefers-reduced-motion`.

**Recent Sessions List**:
- Section header: "Recent Sessions" in `--text-md`, weight 500; "See all" link in `--accent-primary`, `--text-sm`
- Layout: horizontal scrolling row, snap-scrolling to card boundaries
- Card size: 140px wide, auto height
- Card content: session name (auto-generated: "Session 1", "Session 2" or timestamp-based), track count ("4 tracks"), relative time ("2 min ago"), and a tiny color-coded track strip (4px tall bars in instrument colors)
- Empty state (no sessions): card replaced by dashed-outline ghost card with text "Your sessions will appear here"
- Maximum visible: 3 cards on mobile before scroll indicator, more on tablet/desktop

**Background**: `--bg-primary`, completely empty. No patterns, no gradients, no illustrations. The Record button is the sole focal point.

#### Visual Hierarchy

1. Record button (size + color + animation)
2. "Tap to Record" label (proximity to button)
3. Recent Sessions (position, lower third)
4. Header (small, subdued)

### 3.2 Recording Screen

The recording screen is the most performance-critical view. It must render at 60fps while audio capture and onset detection run in the AudioWorklet thread. The UI must provide instant visual confirmation that each tap was detected.

#### Layout

```
+------------------------------------------+
|  [<]  Recording            00:08.3  [?]  |   <- Header with timer
|------------------------------------------|
|                                          |
|  |||||| |||| ||||||||| || |||| ||||||||  |   <- Live waveform
|  |||||| |||| ||||||||| || |||| ||||||||  |   <- (mirrored, centered)
|                                          |
|------------------------------------------|
|  * * *     *   * * *     *   * *         |   <- Proto-timeline (hit dots)
|------------------------------------------|
|                                          |
|  Hits: 24              BPM: ~92 (est.)   |   <- Stats bar
|                                          |
|------------------------------------------|
|                                          |
|              [ STOP ]                    |   <- Stop button: 64px circle
|                                          |
|           "Tap any surface"              |   <- Hint text
+------------------------------------------+
```

#### Transition from Home

When the user taps Record:

1. Microphone permission check (see Section 6 for permission flow)
2. If granted: the Record button expands and morphs into the recording view. The circle grows to fill the screen (300ms, `ease-in-out`), background transitions from coral to `--bg-primary`, and the recording UI fades in. This maintains visual continuity -- the user does not "leave" a page, they "enter" the recording.
3. Under reduced motion: instant cut to recording screen with a 150ms opacity fade.

#### Element Specifications

**Header**:
- Height: 56px
- Left: back arrow (returns to home, with "Discard recording?" confirmation if hits > 0)
- Center: "Recording" label in `--text-lg`, weight 600, with a small red recording dot (8px, pulsing) to the left
- Right: elapsed time in `--text-lg`, `--font-mono`, `--text-primary`. Format: `MM:SS.d` (one decimal). Below that or beside it on wide screens: a help icon (?) that shows recording tips overlay
- Recording dot pulse: 8px circle, `--color-error` (#F87171), opacity oscillates 1.0 to 0.3 over 1 second

**Live Waveform** (maps to `src/components/recording/LiveWaveform.tsx`):
- Occupies ~40% of screen height, horizontally full-width with 16px side padding
- Renders on a dedicated `<canvas>` element at device pixel ratio for crispness
- Style: mirrored amplitude bars (bars extend up and down from center horizontal axis)
- Bar width: 2px, gap: 1px, rounded caps (1px radius)
- Color: `--text-tertiary` at 30% opacity for ambient/silent signal, transitioning to `--accent-primary` proportional to amplitude
- Scroll direction: new data enters from the right, old data scrolls left
- Scroll speed: matched to real time (1 second of audio spans a fixed pixel width, approximately 120px on mobile)
- Canvas clears and redraws each frame via `requestAnimationFrame`
- Background: transparent (shows `--bg-primary` through)

**Hit Detection Flash**:
When the onset detector fires a hit event:
1. The waveform bar at the current position flashes white (`#FFFFFF`, 80% opacity)
2. A circular pulse ring expands outward from the hit point (radius 0 to 40px, opacity 0.6 to 0, 300ms, `ease-out`)
3. The entire waveform container border briefly flashes (2px `--accent-primary`, 150ms fade)
4. A subtle screen-edge vignette flash (radial gradient from transparent to `--accent-primary` at 5% opacity, 200ms)

These four layers of feedback create an unmistakable "the app heard that" signal without being visually overwhelming. Under reduced motion: only the border flash fires (no expanding ring, no vignette).

**Proto-Timeline** (hit dot strip):
- Height: 24px, full width
- Background: `--bg-secondary` with faint grid lines every beat (estimated from running BPM detection)
- Each detected hit renders as a dot: 8px diameter circle
- Dot color: `--text-primary` initially (clusters not yet assigned), transitions to cluster colors after recording ends
- Dots scroll left in sync with the waveform above
- Purpose: gives the user a growing visual record of their hit pattern, building anticipation for what the final beat will look like

**Stats Bar**:
- Height: 40px
- Left: "Hits: 24" -- hit count in `--font-mono`, `--text-md`, updates on each detection. The number animates: scale(1.2) on increment, spring easing back to scale(1) over 200ms
- Right: "BPM: ~92 (est.)" -- running BPM estimate from the IOI histogram, `--font-mono`, `--text-md`. Prefixed with "~" and "(est.)" to communicate uncertainty. Updates every 2 seconds to avoid jitter. If fewer than 8 hits detected, shows "BPM: --" (not enough data)
- Separator: 1px `--border-subtle` top and bottom

**Stop Button**:
- Size: 64px diameter circle
- Background: `--bg-tertiary`
- Icon: filled square with rounded corners (stop symbol), 24px, `--text-primary`
- Border: 2px solid `--border-default`
- Position: centered, in the lower third (thumb zone)
- Label below: "Tap any surface" in `--text-sm`, `--text-tertiary`. This hint text fades out after the first hit is detected (the user has figured it out) and does not return for the session.

**"The App Is Listening" Indicators**:
Multiple visual cues confirm the microphone is active:
1. Recording dot in header (pulsing red)
2. Waveform showing ambient noise floor (faint, moving bars even in silence)
3. Browser-level recording indicator (red dot in tab/address bar -- controlled by browser, not app)
4. On mobile: a faint, slow radial gradient animation behind the waveform area (concentric rings expanding outward from center, 3-second cycle, 5% opacity). Evokes "sound waves being captured." Disabled under reduced motion.

#### Recording End Transition

When the user taps Stop:
1. Stop button animates: scale(0.95), 100ms, then the recording UI crossfades to a processing state
2. Processing state: the waveform freezes, a progress indicator appears ("Analyzing taps..."), and the proto-timeline dots animate -- they jitter and then slide into cluster groups, previewing the clustering that is happening
3. When analysis completes (typically < 2 seconds per `NFR-003` target), the view transitions to the Cluster Review Screen

### 3.3 Cluster Review Screen

This screen is where the core innovation lives -- "perform first, assign instruments later." The user sees their taps grouped by sound similarity and assigns each group to a drum instrument. The design must make clustering feel intuitive ("these sound alike") rather than technical.

#### Layout

```
+------------------------------------------+
|  [<]  Assign Sounds             [>>]     |   <- Header (>> = skip to timeline)
|------------------------------------------|
|  We found 3 distinct sounds              |   <- Summary text
|------------------------------------------|
|  +--------------------------------------+|
|  | [>]  Cluster 1             12 hits   ||   <- Cluster card
|  |  /\/\/\/\                            ||   <- Waveform preview
|  |                                      ||
|  |  Assign instrument:                  ||
|  |  [Kick] [Snare] [HH] [Tom] [More v] ||   <- Quick-pick chips
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  | [>]  Cluster 2              8 hits   ||
|  |  /\  /\  /\                          ||
|  |                                      ||
|  |  Assign instrument:                  ||
|  |  [Kick] [Snare] [HH] [Tom] [More v] ||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  | [>]  Cluster 3              4 hits   ||
|  |  /\/\                                ||
|  |                                      ||
|  |  Assign instrument:                  ||
|  |  [Kick] [Snare] [HH] [Tom] [More v] ||
|  +--------------------------------------+|
|                                          |
|  [ Split / Merge ]        [ Continue >> ]|   <- Action bar
+------------------------------------------+
```

#### Element Specifications

**Header**:
- Left: back arrow (returns to recording screen with "Re-record? Current analysis will be lost" confirmation)
- Center: "Assign Sounds" in `--text-lg`, weight 600
- Right: skip button (">>") that jumps directly to the timeline with auto-assigned instruments (smart defaults based on spectral features -- low-frequency clusters get Kick, mid-frequency get Snare, high-frequency get Hi-hat)

**Summary Text**:
- "We found N distinct sounds" in `--text-base`, `--text-secondary`
- If only 1 cluster: "We found 1 distinct sound. Try tapping different surfaces for more variety." (guidance toward better input)
- If 6+ clusters: "We found N distinct sounds. You may want to merge similar ones." (guidance toward simplification)

**Cluster Card** (maps to `src/components/mapping/ClusterCard.tsx`):
- Background: `--bg-secondary`
- Border: 2px solid with cluster color (left border only, 4px wide, for color identification)
- Border radius: `--radius-xl`
- Padding: `--space-5`
- Width: 100% (full content width minus page margins)
- Gap between cards: `--space-4`

Card contents, top to bottom:

1. **Header row**: Play button (32px circle, cluster color background, white play triangle icon) | "Cluster N" label in `--text-md`, weight 500 | Hit count ("12 hits") in `--text-sm`, `--font-mono`, `--text-tertiary`, right-aligned

2. **Waveform preview**: 48px tall, full card width. Renders the representative hit's waveform (the hit closest to the cluster centroid in feature space). Color: cluster's assigned color. Style: single-sided envelope (top only). Tap/click on waveform triggers playback of the representative sample.

3. **Instrument assignment**: "Assign instrument:" label in `--text-sm`, `--text-tertiary`. Below: a row of quick-pick chips for common instruments (Kick, Snare, Hi-hat Closed, Hi-hat Open, Tom). Each chip is a pill-shaped button (`--radius-full`, 32px tall, `--bg-tertiary` background, `--text-secondary` text). The selected chip fills with the cluster color and shows white text. A "More" chip at the end opens the full sample browser (see below).

4. **Selected state**: When an instrument is assigned, the card's left border thickens to 4px, the waveform color updates to match the instrument color from the palette, and a small instrument icon appears next to the cluster name.

**Quick-Pick Chips** -- selection behavior:
- Tap a chip: selects that instrument, plays a preview of the sample, updates the card
- Tap the same chip again: deselects (returns to unassigned)
- Only one chip selected per cluster
- If two clusters are assigned the same instrument, a subtle warning appears: "Same instrument as Cluster N" in `--color-warning`, `--text-xs`. This is allowed but flagged.

**Full Sample Browser** ("More" chip action):
- Opens as a bottom sheet (mobile) or dropdown panel (desktop)
- Grid layout: 3 columns of sample tiles
- Each tile: instrument name, small icon, tap-to-preview
- Categories: Kicks, Snares, Hi-hats, Toms, Cymbals, Percussion, Electronic
- Search field at top for large sample packs
- Selecting a sample closes the browser and updates the chip row to show the custom selection

**Split / Merge Controls**:
- "Split" button: selects a cluster, then lets the user draw a line on the waveform to split into two sub-clusters. Advanced feature, secondary (`--text-secondary` ghost button).
- "Merge" button: enter merge mode, tap two cluster cards to combine them. Cards animate together (slide + merge, 300ms).
- Both controls live in a bottom action bar, 56px tall, `--bg-secondary` background

**Continue Button**:
- Position: bottom-right of action bar
- Style: Primary button, `--accent-primary` background
- Label: "Continue" with right arrow icon
- Disabled state: if any cluster is unassigned. Tooltip: "Assign an instrument to each sound to continue"
- Alternative: if the user taps Continue with unassigned clusters, auto-assign smart defaults and show a brief toast: "Auto-assigned remaining sounds"

### 3.4 Timeline / Arrangement Screen

The timeline is the most complex screen. It presents a simplified DAW-like view where the user sees their hits placed on a grid, can adjust timing (quantization), tweak the mix, and control playback. The design must be dramatically simpler than a real DAW while retaining enough power for meaningful editing.

#### Layout -- Mobile Portrait

```
+------------------------------------------+
|  [<]  Timeline              [share] [...]|   <- Header
|------------------------------------------|
|  BPM: [120]    Grid: [1/16]   Q: [===|] |   <- Control strip
|------------------------------------------|
|  Kick    [M][S]  ====|==========         |
|  -------*----*---------*----*--------*---|   <- Track 1
|                                          |
|  Snare   [M][S]  ==|============        |
|  ---*--------*---*--------*---*------*---|   <- Track 2
|                                          |
|  HH-C   [M][S]  ====|==========        |
|  -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*--|   <- Track 3
|                                          |
|  |                                       |   <- Playback cursor
|------------------------------------------|
|  [|<]  [ > ]  [>|]       1/4   [loop]   |   <- Transport bar
+------------------------------------------+
```

#### Layout -- Desktop / Tablet Landscape

```
+------------------------------------------------------------+
|  [<]  Timeline                        [share] [export] [...]|
|------------------------------------------------------------|
| BPM: [120]  Grid: [1/16]  Quantize: [======|====]  78%    |
|------------------------------------------------------------|
| Track       | M S V |  1     2     3     4     | Controls  |
|-------------|-------|--------------------------|-----------|
| Kick   [##] | o o = |  *  .     *     *  .  *  | Vol [===] |
| Snare  [##] | o o = |     *        *     *     | Vol [===] |
| HH-C   [##] | o o = |  * * * * * * * * * * * * | Vol [===] |
| HH-O   [##] | o o = |        *           *     | Vol [===] |
|-------------|-------|--------------------------|-----------|
|             | |                                             |
|------------------------------------------------------------|
|  [|<]  [ PLAY ]  [>|]    Bar 1 of 4    1/4   [loop on]    |
+------------------------------------------------------------+
```

#### Element Specifications

**Header**:
- Left: back arrow (returns to Cluster Review, no data loss -- timeline state is preserved)
- Center: "Timeline" in `--text-lg`, weight 600
- Right: share icon (opens export/share options), overflow menu icon (...) with options: "Re-cluster", "Reset quantization", "Clear all edits", "Settings"

**Control Strip** (maps to `src/components/editing/QuantizationPanel.tsx`):
- Height: 48px on mobile, can expand to two rows on very narrow screens
- Three primary controls in a row:

1. **BPM**: label + editable number field. `--font-mono`, `--text-md`. Tap to type a value, or use +/- stepper buttons (1 BPM increments, long-press for fast scroll). Range: 40-240. The detected BPM is pre-filled. Changing BPM re-quantizes all hits in real time (`FR-044`).

2. **Grid Resolution**: segmented control or dropdown. Options: 1/4, 1/8, 1/16, 1/32, 1/8T (triplet), 1/16T. Default: 1/16. Each segment is a pill chip, 32px tall. Selected segment: `--accent-primary` background.

3. **Quantization Strength**: horizontal slider (maps to `src/components/shared/Slider.tsx`). Range: 0% (no quantization, original timing) to 100% (perfect grid snap). Default: 75%. Label shows current percentage in `--font-mono`. Changing the slider re-positions hit markers in real time with a smooth animation (hits slide to new positions over 200ms).

**Timeline Canvas** (maps to `src/components/editing/TimelineCanvas.ts`):
- Rendered on a `<canvas>` element, full available width, height depends on track count
- Track height: 64px on mobile, 80px on desktop
- Track gap: 1px (`--border-subtle` color, acts as separator)

Track anatomy:
```
+---[Label]---[M][S]---[========================]---[Vol]---+
|  Track       Mute     Hit markers on grid          Volume  |
|  name +      Solo                                  slider  |
|  color chip                                                |
+------------------------------------------------------------+
```

- **Track label area** (left, 80px on mobile, 120px on desktop): instrument name in `--text-sm`, weight 500, truncated with ellipsis. Below name: a 12x12 color chip (rounded square) in the cluster/instrument color. The label area background is slightly tinted with the instrument color at 8% opacity.

- **Mute/Solo buttons** (M/S): 24px square each, `--bg-tertiary`. Mute (M): toggles the track on/off. When muted, the track visually dims (40% opacity on hit markers). Solo (S): when active, all other tracks mute. Active Mute: `--color-warning` background. Active Solo: `--accent-secondary` background.

- **Grid area** (center, flexible width): the main timeline surface.
  - Grid lines: vertical lines at each grid division. Beat lines (quarter notes) are 1px `--border-default`. Sub-beat lines are 1px `--border-subtle`. Bar lines are 2px `--text-tertiary`.
  - Beat numbers: "1", "2", "3", "4" above the first track at each beat position, `--text-xs`, `--text-tertiary`.
  - Hit markers: rounded rectangles, 12px wide, full track height minus 16px padding (48px on mobile, 64px on desktop), centered on the quantized time position. Color: instrument color at 80% opacity. Border: 1px solid instrument color at 100%.
  - Ghost markers (original position, per `FR-042`): same shape as hit markers but rendered as a 2px wide line in instrument color at 30% opacity, connected to the quantized marker by a faint horizontal line. Only visible when quantization strength < 100%.

- **Volume slider** (right, desktop only, 60px wide): vertical slider per track. On mobile, access volume via long-press on track label, which opens a popover with volume slider.

**Playback Cursor**:
- 2px wide vertical line spanning all tracks
- Color: `--accent-secondary` (#3B82F6)
- A small downward-pointing triangle (8px) at the top marks the cursor head
- Moves left-to-right during playback at a rate determined by BPM and zoom level
- Positioned via `requestAnimationFrame` driven by the playback engine's scheduling clock (not setTimeout) for audio-visual sync

**Transport Bar** (maps to `src/components/editing/TransportBar.tsx`):
- Height: 64px
- Background: `--bg-secondary`
- Border top: 1px `--border-subtle`

Controls left to right:
1. **Rewind** (|<): go to beat 1. Icon button, ghost variant.
2. **Play/Pause** (center, prominent): 48px circle, `--accent-primary` background when paused (shows play triangle), `--bg-tertiary` when playing (shows pause bars). Tap toggles playback.
3. **Forward** (>|): go to end/loop point. Icon button, ghost variant.
4. **Position indicator**: "Bar 1 of 4" or "Beat 1.3" in `--font-mono`, `--text-sm`, `--text-secondary`
5. **Time signature**: "1/4" display (informational for v1; editable in future)
6. **Loop toggle**: icon button, loop icon. Active: `--accent-primary` color. Inactive: `--text-tertiary`. Default: on.

**Zoom and Scroll**:
- Horizontal scroll: swipe/drag to move through time. Momentum scrolling enabled.
- Pinch-to-zoom (mobile): increases/decreases the horizontal time scale (more or fewer beats visible).
- Scroll wheel + Ctrl/Cmd (desktop): horizontal zoom.
- Zoom range: 1 bar visible (zoomed in, for precise editing) to full session visible (zoomed out, for overview).
- A mini-map (16px tall, above the transport bar) shows the full timeline with a highlighted viewport rectangle, indicating current scroll/zoom position.

**Hit Editing Interactions**:
- **Drag hit**: touch/click and drag a hit marker horizontally to reposition. Snaps to grid based on current grid resolution. Shows time offset in a small tooltip during drag.
- **Add hit**: double-tap (mobile) or double-click (desktop) on empty grid space. Creates a new hit at the nearest grid line on that track.
- **Delete hit**: swipe up on a hit marker (mobile) or right-click > Delete (desktop). Hit marker fades out (150ms).
- **Select multiple**: long-press and drag to create a selection rectangle (desktop). Selected hits get a highlight border. Actions: delete, move, copy.

### 3.5 Settings Screen

Settings are accessed via the gear icon in the header or the hamburger menu. On mobile, settings is a full-screen view. On desktop, it opens as a side panel (320px wide) overlaying the right edge.

#### Layout

```
+------------------------------------------+
|  [<]  Settings                           |
|------------------------------------------|
|                                          |
|  AUDIO                                   |   <- Section header
|  Audio Input          [Built-in Mic  v]  |
|  Input Sensitivity    [=======|===]  70% |
|  Sample Rate          44100 Hz           |
|                                          |
|  RHYTHM                                  |
|  Default BPM          [120]              |
|  Default Grid         [1/16         v]   |
|  Default Quantize     [75%]              |
|  Count-in Beats       [0 | 1 | 2 | 4]   |
|                                          |
|  SAMPLES                                 |
|  Sample Pack          [Default Kit   v]  |
|  Preview on Select    [on/off]           |
|                                          |
|  APPEARANCE                              |
|  Theme                [Dark | Light]     |
|  Reduced Motion       [System | On | Off]|
|  Waveform Style       [Bars | Line]      |
|                                          |
|  DATA                                    |
|  Export All Sessions  [Export]            |
|  Clear All Data       [Clear...]         |
|                                          |
|  ABOUT                                   |
|  Version              1.0.0              |
|  Open Source          GitHub [->]        |
|  Licenses             View [->]          |
|                                          |
+------------------------------------------+
```

#### Element Specifications

**Section Headers**: uppercase, `--text-xs`, `--text-tertiary`, weight 600, letter-spacing: 0.08em, with `--space-8` top margin and `--space-3` bottom margin.

**Setting Rows**: each row is 48px tall (minimum touch target), with label on the left (`--text-base`, `--text-primary`) and control on the right. Rows are separated by 1px `--border-subtle` bottom borders.

**Controls by type**:
- Dropdown: renders as a select-style button showing current value, opens bottom sheet (mobile) or dropdown (desktop) on tap
- Slider: inline horizontal slider with value label, as per component spec in Section 2.6
- Segmented control: pill-style row of options (e.g., count-in beats: 0, 1, 2, 4). Selected segment has `--accent-primary` background
- Toggle: 44x24px toggle switch, `--bg-hover` track (off), `--accent-primary` track (on), white thumb (12px circle)
- Number input: `--font-mono`, editable, with stepper +/- buttons

**Audio Input** dropdown:
- Lists available `MediaDevices` from `navigator.mediaDevices.enumerateDevices()`
- Shows device labels when permission is granted
- Shows "Default Microphone" when permission not yet granted (labels are unavailable before first grant)
- If no devices available: shows "No microphone detected" in `--color-error`

**Sample Pack** dropdown:
- Lists available sample packs (v1: one default pack; designed for future expansion)
- Each option shows: pack name, instrument count, total size
- "Get more packs" link at bottom for future expansion

**Clear All Data**:
- Destructive action; requires confirmation modal
- Modal text: "This will permanently delete all sessions and settings. This cannot be undone."
- Two buttons: "Cancel" (secondary) and "Delete Everything" (`--color-error` background, white text)

**About Section**:
- Version: app version from `package.json`
- Open Source: links to GitHub repository (external link icon)
- Licenses: opens a list of open-source dependencies and their licenses

---

## 4. Interaction Patterns

### 4.1 Microphone Permission Flow

The microphone permission flow is the single most critical interaction in the app. If it fails or confuses the user, nothing else works.

```
User taps Record
       |
       v
  Permission state?
       |
  +----+----+--------+
  |         |        |
granted   prompt   denied
  |         |        |
  v         v        v
Start    Show      Show
Record   browser   Permission
         prompt    Denied
         |         Screen
    +----+----+
    |         |
  granted   denied
    |         |
    v         v
  Start    Permission
  Record   Denied
           Screen
```

**Permission Prompt Preparation** (shown before browser prompt triggers):
- A brief overlay appears for 2 seconds (or until dismissed): a microphone icon, the text "TapBeats needs microphone access to hear your taps", and a "Got it" button
- This primes the user so the browser prompt is expected, not surprising
- The overlay is suppressed on subsequent visits (stored in localStorage)

**Permission Denied Screen**:
- Full-screen overlay replacing the recording view
- Icon: microphone with slash-through, 48px, `--color-error`
- Heading: "Microphone Access Required" in `--text-xl`
- Body text: "TapBeats needs to hear your taps through the microphone. Without it, the app can't work." in `--text-base`, `--text-secondary`
- Instructions (browser-specific, detected via user agent):
  - Chrome: "Tap the lock icon in the address bar > Site settings > Microphone > Allow"
  - Safari: "Go to Settings > Safari > Camera & Microphone Access"
  - Firefox: "Tap the shield icon in the address bar > Permissions > Microphone > Allow"
- Button: "Try Again" (re-triggers `getUserMedia`) and "Go Back" (returns to home)

### 4.2 Gesture Vocabulary

| Gesture | Context | Action |
|---|---|---|
| Tap | Record button | Start recording |
| Tap | Stop button | Stop recording |
| Tap | Cluster play button | Play cluster's representative sound |
| Tap | Instrument chip | Assign instrument to cluster |
| Tap | Hit marker (timeline) | Select hit |
| Tap | Play/Pause (transport) | Toggle playback |
| Tap | Mute/Solo buttons | Toggle mute/solo |
| Double-tap | Empty grid space (timeline) | Add new hit |
| Long-press | Hit marker | Open hit context menu (delete, duplicate) |
| Long-press | Track label (mobile) | Open track controls (volume, pan) |
| Swipe left/right | Timeline | Scroll through time |
| Swipe up | Hit marker | Delete hit |
| Swipe down | Recording screen (no hits) | Cancel recording |
| Pinch | Timeline | Zoom in/out |
| Drag | Hit marker (horizontal) | Reposition hit in time |
| Drag | Quantization slider | Adjust quantization strength |

### 4.3 Keyboard Shortcuts (Desktop)

All shortcuts are documented in a help overlay accessible via `?` key.

| Key | Action |
|---|---|
| `Space` | Play / Pause (global, when not in text input) |
| `R` | Start / Stop recording (toggles) |
| `Escape` | Stop recording / Close modal / Deselect |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Delete` / `Backspace` | Delete selected hit(s) |
| `+` / `-` | Zoom in / out on timeline |
| `0` | Reset zoom to fit all |
| `Left Arrow` | Move playback cursor back 1 beat |
| `Right Arrow` | Move playback cursor forward 1 beat |
| `Shift + Left/Right` | Move playback cursor back/forward 1 bar |
| `Home` | Go to beginning |
| `End` | Go to end |
| `M` | Mute selected track |
| `S` | Solo selected track |
| `L` | Toggle loop |
| `Up / Down Arrow` | Select previous / next track |
| `?` | Show keyboard shortcuts overlay |
| `Cmd/Ctrl + E` | Export |
| `Cmd/Ctrl + S` | Save session (to IndexedDB) |

### 4.4 Undo / Redo

The undo system operates on the snapshot model defined in the technical architecture (`technical-architecture.md#9.3`). Every user action that modifies session data pushes a snapshot onto the undo stack.

**Undoable actions**: hit move, hit delete, hit add, instrument assignment change, cluster merge, cluster split, quantization parameter change, BPM change, volume change, mute/solo toggle.

**Non-undoable actions**: playback start/stop, zoom, scroll, settings changes, recording (you cannot un-record).

**Visual feedback**: on undo/redo, a brief toast appears: "Undo: moved hit" or "Redo: assigned Kick to Cluster 1" in `--text-sm`, displayed for 2 seconds, in the top-center.

### 4.5 Drag-and-Drop

Drag-and-drop is used in two contexts:

1. **Hit repositioning** (timeline): drag horizontally. Visual: the hit marker lifts slightly (scale 1.05, shadow appears), a time tooltip shows the target position ("Beat 2.3"), grid lines highlight at valid snap points. On drop: hit snaps to nearest grid line with a spring animation (100ms).

2. **Track reordering** (timeline, desktop): drag the track label vertically. Visual: the entire track row lifts, a drop indicator line appears between other tracks. On drop: tracks reorder with a 200ms slide animation.

### 4.6 Haptic Feedback (Mobile)

Using the Vibration API (`navigator.vibrate()`) where supported.

| Event | Pattern |
|---|---|
| Hit detected (during recording) | Single pulse: 15ms |
| Instrument assigned | Double pulse: 10ms, 30ms gap, 10ms |
| Quantization snap (during slider drag, at 25% intervals) | Single tick: 8ms |
| Error action (e.g., tap Continue with unassigned clusters) | Triple pulse: 10ms, 20ms, 10ms, 20ms, 10ms |
| Playback start | Single pulse: 20ms |

Haptics are disabled when the device is in silent/vibrate-off mode, or when the user has disabled them in system settings. No setting in TapBeats to control this -- respect system behavior.

---

## 5. Responsive Behavior

### 5.1 Breakpoints

| Breakpoint | Width | Designation | Primary Context |
|---|---|---|---|
| `xs` | < 380px | Small phone | iPhone SE, older Android |
| `sm` | 380px - 639px | Standard phone portrait | iPhone 14/15, Pixel, Galaxy S |
| `md` | 640px - 1023px | Tablet portrait / phone landscape | iPad Mini, iPad, phone rotated |
| `lg` | 1024px - 1439px | Desktop / tablet landscape | Laptops, iPad Pro landscape |
| `xl` | >= 1440px | Large desktop | External monitors, iMac |

### 5.2 Layout Behavior per Screen

#### Home Screen

| Breakpoint | Layout |
|---|---|
| `xs` / `sm` | Single column. Record button centered. Sessions as horizontal scroll. |
| `md` | Record button left-center, sessions grid (2 columns) to the right. |
| `lg` / `xl` | Two-column layout. Left: Record button with tagline. Right: session list as vertical cards with more detail (waveform preview per session). Max content width: 960px, centered. |

#### Recording Screen

| Breakpoint | Layout |
|---|---|
| `xs` / `sm` | Full-screen. Waveform takes ~40% of height. Stats, proto-timeline, and stop button stacked below. All controls in thumb zone. |
| `md` | Waveform takes ~50% of height. Stats bar becomes two-column. Timer enlarges. |
| `lg` / `xl` | Waveform takes center 60% of width. Left panel: timer, hit count, BPM (large, stacked). Right panel: sensitivity control, recording tips. Stop button centered below waveform. |

#### Cluster Review Screen

| Breakpoint | Layout |
|---|---|
| `xs` / `sm` | Vertical stack of full-width cluster cards. Scroll to see all. Action bar pinned to bottom. |
| `md` | 2-column grid of cluster cards. Action bar pinned to bottom. |
| `lg` / `xl` | 3-column grid. Cards become wider with more instrument chip options visible. Side panel for the sample browser instead of bottom sheet. Max content width: 1200px. |

#### Timeline Screen

| Breakpoint | Layout |
|---|---|
| `xs` / `sm` | Control strip collapses to a single row (BPM, grid, quantize accessible via horizontal scroll or a "Controls" toggle). Track labels show abbreviated names (K, S, HH). Volume sliders hidden (accessible via long-press). Transport bar pinned to bottom. Mini-map hidden. |
| `md` | Control strip fully visible. Track labels show full names. Volume sliders appear as small inline controls. Mini-map visible. |
| `lg` / `xl` | Full DAW-style layout. Track labels wide (120px) with color chips. Volume sliders visible per track. Control strip has extra space for swing, humanize controls. Mixer panel optionally visible as a right sidebar (240px). Mini-map visible. |

#### Settings Screen

| Breakpoint | Layout |
|---|---|
| `xs` / `sm` | Full-screen view. Single column of settings rows. |
| `md` | Full-screen or side panel (320px). Settings grouped in visible sections. |
| `lg` / `xl` | Side panel (400px) overlaying right edge. Two-column layout within panel for certain settings groups. |

### 5.3 Touch Target Scaling

All interactive elements maintain a 48px minimum touch target on touch devices. On desktop (`pointer: fine` media query), visual sizes can be smaller (32px buttons) because mouse precision is higher, but keyboard focus targets remain full-size.

```css
@media (pointer: fine) {
  .btn--sm { height: 32px; min-width: 32px; }
  .hit-marker { width: 8px; }
}
@media (pointer: coarse) {
  .btn--sm { height: 32px; min-width: 32px; padding: 8px; /* expands touch target to 48px */ }
  .hit-marker { width: 12px; min-height: 48px; }
}
```

### 5.4 Orientation Handling

**Mobile landscape** is used for the timeline screen. When the user rotates to landscape on the timeline, the layout shifts:
- Transport bar moves to the left edge (vertical strip, 56px wide)
- Track labels collapse to icons
- Maximum horizontal timeline area (primary benefit of landscape)
- Control strip becomes a floating toolbar toggled by a button

A non-intrusive hint appears on first landscape rotation: "Landscape mode gives you more timeline space" -- shown once, stored in localStorage.

---

## 6. Onboarding Flow

### 6.1 Design Principles for Onboarding

- Under 30 seconds total. Users came here to tap, not to read.
- Maximum 3 steps. Each step is one sentence and one visual.
- Skip is always available and prominent.
- No account creation, no email, no anything.
- Onboarding plays once per device (stored in localStorage). Can be re-triggered from Settings > About > "Show Tutorial".

### 6.2 Onboarding Steps

The onboarding is a lightweight overlay on top of the home screen, not a separate flow. The home screen is visible behind a scrim.

```
Step 1 of 3                              [Skip]
+------------------------------------------+
|                                          |
|     [hand icon tapping surface]          |
|                                          |
|   Tap on any surface.                    |
|   TapBeats listens and finds             |
|   the different sounds.                  |
|                                          |
|              [ Next -> ]                 |
+------------------------------------------+

Step 2 of 3                              [Skip]
+------------------------------------------+
|                                          |
|     [cluster cards morphing              |
|      into instrument icons]              |
|                                          |
|   Assign each sound to                   |
|   a real instrument.                     |
|                                          |
|              [ Next -> ]                 |
+------------------------------------------+

Step 3 of 3                              [Skip]
+------------------------------------------+
|                                          |
|     [timeline with play button           |
|      and notes snapping to grid]         |
|                                          |
|   Hit play. Your taps become             |
|   a polished beat.                       |
|                                          |
|           [ Start Tapping ]              |
+------------------------------------------+
```

#### Specifications

**Overlay**: `--bg-primary` at 95% opacity over the home screen. Border radius: `--radius-lg`. Max width: 340px, centered.

**Illustrations**: simple, single-color line illustrations using `--accent-primary` for the active element and `--text-tertiary` for supporting lines. No photographs. No multi-color complexity. These can be implemented as inline SVGs.

**Step indicator**: three small dots (8px) at the top. Current step: `--accent-primary`. Others: `--text-tertiary`. Standard pagination dot pattern.

**Skip button**: top-right, "Skip" in `--text-sm`, `--text-secondary`. Tap dismisses onboarding entirely.

**Next button**: primary style. "Next" with right arrow on steps 1-2. "Start Tapping" on step 3 (which dismisses the overlay and focuses the Record button).

**Transition between steps**: horizontal slide (current slides left, next slides in from right, 250ms, `ease-in-out`). Under reduced motion: crossfade (150ms).

### 6.3 Microphone Permission Education

If the user taps Record and microphone permission has not been granted, the onboarding inserts a permission-education step before the browser prompt:

```
+------------------------------------------+
|                                          |
|     [microphone icon with               |
|      sound waves entering]               |
|                                          |
|   TapBeats needs your microphone         |
|   to hear your taps.                     |
|                                          |
|   Nothing is recorded to a server.       |
|   All audio stays on your device.        |
|                                          |
|         [ Allow Microphone ]             |
+------------------------------------------+
```

- "Allow Microphone" triggers `navigator.mediaDevices.getUserMedia()`, which surfaces the browser's native permission dialog
- The privacy reassurance ("Nothing is recorded to a server") directly addresses the #1 user concern identified in UX research (`ux-research.md#6`)
- After permission is granted, the overlay dismisses and recording begins immediately

### 6.4 Contextual Tips (Post-Onboarding)

After the initial onboarding, contextual tips appear as small, dismissable tooltips at key moments:

| Trigger | Tip | Shown |
|---|---|---|
| First recording ends | "Tap each cluster to hear how TapBeats grouped your sounds" | Once |
| First instrument assigned | "Try tapping different chips to preview instruments" | Once |
| First time on timeline | "Pinch to zoom, swipe to scroll" (mobile) / "Scroll to navigate, Ctrl+scroll to zoom" (desktop) | Once |
| First playback | "Drag the quantization slider to tighten or loosen the timing" | Once |
| 3rd session | "Tip: Try tapping with different fingers and surfaces for more variety" | Once |

Tips appear as popovers (elevated surface, `--bg-tertiary`, `--border-default` border, small arrow pointing to relevant control, max-width 240px). Dismiss via tap anywhere or an explicit "x" button. Each tip ID is stored in localStorage when dismissed.

---

## 7. Error States & Edge Cases

### 7.1 Error State Design Pattern

All error states follow a consistent visual structure:

```
+------------------------------------------+
|                                          |
|     [icon, 48px, semantic color]         |
|                                          |
|   Heading (what happened)                |
|   Body (why + what to do)                |
|                                          |
|   [Primary Action]   [Secondary Action]  |
+------------------------------------------+
```

- Icon: relevant Lucide icon in the appropriate semantic color
- Heading: `--text-lg`, `--text-primary`, weight 600, max 6 words
- Body: `--text-base`, `--text-secondary`, 1-2 sentences, actionable
- Actions: primary button for the recommended path, secondary button for alternatives

### 7.2 Specific Error States

**No Microphone Detected** (no audio input devices found):
- Icon: microphone-off, `--color-error`
- Heading: "No Microphone Found"
- Body: "TapBeats needs a microphone to hear your taps. Connect a microphone or use a device with a built-in mic."
- Action: "Check Again" (re-enumerates devices) | "Go Back"
- Note: on desktop, this is a real possibility; on mobile, extremely rare

**Permission Denied** (user denied or previously blocked):
- See Section 4.1 for full permission denied screen
- Key detail: browser-specific instructions for re-enabling

**Too Much Background Noise**:
- Detected when the onset detector fires continuously (> 20 hits/second for > 2 seconds)
- Display: a yellow banner slides down from below the header (does not interrupt recording)
- Banner: warning icon, "Noisy environment detected. Try reducing background noise or lowering sensitivity in Settings." with a "Dismiss" button and an inline link to sensitivity control
- Does not stop recording -- the user decides

**No Hits Detected** (recording stopped with 0 hits):
- Display: replaces the processing screen
- Icon: hand with question mark, `--text-tertiary`
- Heading: "No Taps Detected"
- Body: "We didn't hear any taps. Try tapping harder, moving closer to the mic, or increasing sensitivity in Settings."
- Action: "Try Again" (returns to recording) | "Adjust Sensitivity" (opens settings)

**Only One Cluster** (all hits sound the same):
- Display: cluster review screen with a single card + guidance
- Summary text changes to: "All your taps sounded similar -- we grouped them as one sound."
- Guidance banner below: "Tip: Tap different surfaces (table, cup, your chest) to create more distinct sounds. You can also split this cluster manually."
- Single-cluster flow: user assigns one instrument, continues to timeline with a single-track beat. This is a valid outcome -- a simple kick pattern, for example.

**Recording Too Short** (< 1 second or < 3 hits):
- Display: replaces the processing screen
- Icon: timer, `--color-warning`
- Heading: "Recording Too Short"
- Body: "Record at least a few taps to create a beat. Aim for 4-8 seconds."
- Action: "Record Again" | "Go Home"
- Threshold: minimum 3 hits AND minimum 1 second of recording. Below either threshold, this error fires.

**Recording Too Long** (> 60 seconds for v1):
- Recording auto-stops at the maximum duration
- A toast appears: "Maximum recording length reached (60 seconds). Stopping automatically."
- Processing begins immediately. No error screen -- the session is valid.

**Unsupported Browser**:
- Detected on app load by checking for: `AudioContext` (or `webkitAudioContext`), `AudioWorklet`, `navigator.mediaDevices.getUserMedia`, `IndexedDB`
- Display: full-page takeover (replaces entire app)
- Icon: browser icon, `--color-warning`
- Heading: "Browser Not Supported"
- Body: "TapBeats requires a modern browser with audio support. Please use a recent version of Chrome, Firefox, Safari, or Edge."
- Detected missing API listed: "Missing: AudioWorklet" (for debugging/support)
- No action buttons besides a link to browser download pages

**IndexedDB Unavailable** (private browsing in some browsers, or storage full):
- Display: yellow banner on home screen
- Text: "Storage unavailable. Sessions won't be saved between visits. Use a non-private browser window for full functionality."
- App continues to work -- sessions exist only in memory for the current visit

**Audio Context Suspended** (autoplay policy blocks audio):
- Display: overlay on first playback attempt if AudioContext is suspended
- Text: "Tap anywhere to enable audio" with a speaker icon
- On tap: calls `audioContext.resume()` and dismisses overlay
- This is a browser restriction, not an app error. Keep tone neutral and brief.

### 7.3 Empty States

**No Sessions (Home Screen)**:
- In the "Recent Sessions" area, show a dashed-border ghost card
- Text inside: "No sessions yet. Tap the record button to create your first beat."
- Icon: music note + plus sign, `--text-tertiary`

**No Sample Packs (Settings)**:
- Should not occur in v1 (default pack is bundled)
- Defensive state: "No sample packs found. The default pack may still be loading." with a "Reload" button

---

## 8. Accessibility

### 8.1 Standards Compliance

TapBeats targets WCAG 2.1 Level AA compliance across all non-audio-production UI. Audio production elements (waveforms, timeline) have equivalent accessible alternatives documented below.

### 8.2 Color Contrast

All text and interactive elements meet minimum contrast ratios:

| Element | Foreground | Background | Ratio | Requirement |
|---|---|---|---|---|
| Primary text | `#F0F0F2` | `#121214` | 15.2:1 | 4.5:1 (AA normal text) |
| Secondary text | `#A0A0A8` | `#121214` | 7.1:1 | 4.5:1 (AA normal text) |
| Tertiary text | `#6E6E78` | `#121214` | 4.5:1 | 3.0:1 (AA large text only) |
| Primary accent on bg | `#FF6B3D` | `#121214` | 5.3:1 | 3.0:1 (AA UI components) |
| Primary accent button text | `#121214` | `#FF6B3D` | 5.3:1 | 4.5:1 (AA normal text) |
| Error text | `#F87171` | `#121214` | 5.7:1 | 4.5:1 (AA normal text) |

Tertiary text (`--text-tertiary`) is only used for non-essential information (timestamps, hints) and at large text sizes (14px+ bold or 18px+ regular) where the 3:1 ratio applies.

### 8.3 Keyboard Navigation

All interactive elements are reachable and operable via keyboard:

- **Tab order** follows visual layout (left-to-right, top-to-bottom). Managed via DOM order, not `tabindex` hacks.
- **Focus indicators**: 2px solid `--border-focus` (#FF6B3D) with 2px offset. Visible on `:focus-visible` only (not on click/tap, to avoid visual clutter for mouse users).
- **Skip link**: hidden link at the top of the page, visible on focus: "Skip to main content". Target: the primary content area of the current screen.
- **Focus trapping**: modals and bottom sheets trap focus within themselves until dismissed. Tab cycles through modal controls. Escape closes the modal and returns focus to the trigger element.
- **Arrow key navigation**: within segmented controls, radio groups, and the instrument chip row, arrow keys move selection. This follows the WAI-ARIA roving tabindex pattern.
- **Timeline keyboard interaction**: when a track is focused, Left/Right moves between hits, Enter selects/deselects a hit, Delete removes it, and Space toggles playback.

### 8.4 Screen Reader Support

TapBeats is an audio application, which creates inherent tension with screen reader use. The approach: make all navigation, settings, session management, and instrument assignment fully accessible. Waveform and timeline visualizations have text equivalents.

**ARIA landmarks**:
```html
<header role="banner">          <!-- App header -->
<nav role="navigation">         <!-- Screen navigation -->
<main role="main">              <!-- Primary content -->
<footer role="contentinfo">     <!-- Transport bar -->
```

**Screen-specific announcements**:

| Screen | Live Region Announcements |
|---|---|
| Recording | "Recording started." / "Hit detected. Total: 24." / "Recording stopped. 24 hits detected. Analyzing." |
| Cluster Review | "3 clusters found. Cluster 1: 12 hits. Cluster 2: 8 hits. Cluster 3: 4 hits." |
| Timeline | "Playback started at beat 1." / "Playback paused at beat 3." / "BPM changed to 120." |

**Cluster Card accessibility**:
```html
<article role="group" aria-label="Cluster 1, 12 hits, assigned to Kick">
  <button aria-label="Play Cluster 1 sound">Play</button>
  <p>12 hits</p>
  <fieldset>
    <legend>Assign instrument to Cluster 1</legend>
    <label><input type="radio" name="cluster-1-instrument" value="kick"> Kick</label>
    <label><input type="radio" name="cluster-1-instrument" value="snare"> Snare</label>
    <!-- ... -->
  </fieldset>
</article>
```

**Timeline accessibility**:
The canvas-based timeline is not inherently accessible. A hidden, screen-reader-only data table provides equivalent information:

```html
<table class="sr-only" aria-label="Beat timeline">
  <thead>
    <tr><th>Track</th><th>Beat 1</th><th>Beat 2</th><th>Beat 3</th><th>Beat 4</th></tr>
  </thead>
  <tbody>
    <tr><th>Kick</th><td>Hit</td><td></td><td>Hit</td><td></td></tr>
    <tr><th>Snare</th><td></td><td>Hit</td><td></td><td>Hit</td></tr>
    <tr><th>Hi-hat</th><td>Hit</td><td>Hit</td><td>Hit</td><td>Hit</td></tr>
  </tbody>
</table>
```

This table updates in sync with the visual timeline. It is hidden from sighted users via `.sr-only` (visually hidden, not `display: none`).

### 8.5 Reduced Motion

All animations have reduced-motion alternatives as specified in Section 2.9. Additionally:

- The recording waveform still renders (it is functional, not decorative) but the scrolling is instant (no smooth scroll)
- The hit detection pulse becomes an opacity flash (no expanding ring)
- The cluster formation animation becomes a fade-in (no spatial movement)
- The quantization snap animation becomes an instant position change (no sliding)
- The onboarding step transitions become crossfades (no sliding)
- The playback cursor moves linearly (no easing -- easing is decorative on a cursor)

### 8.6 Alternative Input

Beyond keyboard:
- **Switch access**: all controls are focusable and activable via single-switch scanning (linear tab order, Enter to activate)
- **Voice control**: all buttons and controls have visible text labels that match their accessible names (no icon-only controls without `aria-label`)
- **Touch accommodation**: large touch targets (48px minimum), no time-dependent gestures required for core functionality (double-tap is convenience, not required -- context menus provide the same actions)

### 8.7 Audio Accessibility Considerations

For users with hearing impairments using TapBeats (which is plausible -- someone might use visual feedback to compose beats):

- All hit detections have visual confirmation (waveform flash, dot on proto-timeline, counter increment)
- Playback has visual cursor movement as the primary feedback mechanism
- Cluster playback buttons show a brief visual waveform animation when playing
- The timeline hit markers visually pulse when their sound plays during playback
- Volume levels are displayed numerically, not just as slider positions

---

## 9. Micro-interactions & Delight

These details elevate TapBeats from functional to memorable. Each micro-interaction is designed to reinforce the "instrument-first" feel -- responsive, physical, alive.

### 9.1 Hit Detection Pulse

The signature interaction. When the onset detector fires during recording:

**Visual layers** (all simultaneous, triggered within one animation frame):
1. **Waveform bar flash**: the current waveform bar renders at `#FFFFFF` 80% opacity, then fades to the amplitude-mapped color over 150ms
2. **Ripple ring**: a circle centered on the waveform hit point expands from 0 to 40px radius while fading from `--accent-primary` at 60% opacity to transparent. Duration: 300ms. Easing: `ease-out`. Renders on the waveform canvas (no DOM elements created).
3. **Edge vignette**: a full-width radial gradient pulses once from the edges of the waveform container. Color: `--accent-primary` at 5% opacity. Duration: 200ms. Barely perceptible but subconsciously reinforces the "event."
4. **Counter bump**: the hit count number scales to 1.15x and springs back to 1.0x over 200ms using `cubic-bezier(0.34, 1.56, 0.64, 1)`. The number text briefly flashes `--accent-primary` before returning to `--text-primary`.
5. **Proto-timeline dot**: a new dot fades in at the current time position (opacity 0 to 1, 100ms). On appearance, a tiny downward bounce (translate 2px down, spring back, 150ms).
6. **Haptic**: 15ms vibration pulse.

**Performance**: layers 1-3 are canvas-only operations (no DOM manipulation). Layer 4 uses CSS transform (GPU-composited). Layer 5 is a canvas operation. Total additional render cost per hit: < 0.5ms.

**Reduced motion**: only layers 1 (flash, shortened to 100ms) and 4 (counter update without scale animation) fire.

### 9.2 Cluster Formation Animation

After recording stops and analysis completes, the transition from "raw hits" to "clusters" is visualized:

1. The proto-timeline dots from the recording screen persist on screen during the transition
2. Each dot receives a cluster color assignment. Over 500ms, dots animate from white to their cluster color (staggered start, 20ms between each dot, left to right)
3. Dots with the same cluster color slide vertically toward each other, forming visible groups (300ms, `ease-in-out`)
4. The groups separate with gentle spacing (200ms) and then the cluster cards fade in below/around them (300ms)
5. Total sequence: approximately 1.2 seconds

This animation tells a story: "Your taps were analyzed, similar sounds found each other, and here are the groups." It transforms a 1-2 second processing wait into a satisfying reveal.

**Reduced motion**: dots instantly colorize (no stagger). Cards fade in over 200ms. No spatial movement.

### 9.3 Quantization Snap Animation

When the user adjusts the quantization strength slider, hit markers on the timeline slide between their original (unquantized) and grid-snapped positions:

- Each hit marker moves horizontally using a spring animation (duration proportional to distance moved, 100-300ms, `cubic-bezier(0.34, 1.56, 0.64, 1)`)
- A faint trail connects the original and quantized positions during movement (1px line in instrument color at 20% opacity)
- At 100% quantization, ghost markers (original positions) become visible as faint outlines
- At 0% quantization, ghost markers are hidden (positions are identical)
- A subtle grid line brightening effect occurs: as hits snap to lines, those grid lines briefly brighten (opacity increases from 0.1 to 0.3, 200ms, then back)

The overall effect: the beat "tightens up" visually as the slider increases, directly mapping the audible tightening to a visual one.

**Reduced motion**: hit markers teleport to new positions instantly. No trails, no grid brightening.

### 9.4 Playback Cursor

The playback cursor is a 2px vertical line in `--accent-secondary` (#3B82F6) that moves across the timeline during playback.

- At the top of the cursor: a small downward triangle (8px) that glows softly (box-shadow: `0 0 6px #3B82F680`)
- When the cursor passes over a hit marker: the hit marker briefly brightens (opacity increases to 100%, 50ms, then returns to 80%). On the waveform, this corresponds to the moment the sound plays.
- At loop boundaries: when the cursor reaches the end and loops, it does not slide back to the start (that would be disorienting). Instead: the cursor fades out at the end (100ms), immediately appears at the start (opacity 0), and fades in (100ms). This creates a "wrap" effect that feels rhythmically correct.

### 9.5 Export Celebration

When the user exports their beat (WAV, audio share, or future formats):

1. A brief success modal appears with a checkmark icon
2. The checkmark draws itself (SVG stroke-dashoffset animation, 400ms)
3. Confetti particles burst from behind the checkmark (12-16 small rectangles in instrument colors, physics-based fall, 1.5 seconds). Canvas-rendered, not DOM elements.
4. Text: "Beat exported!" in `--text-xl`, fading in over 200ms
5. Below: "Share" button and "Done" button
6. Auto-dismiss after 4 seconds if no interaction

This is the payoff moment. The user started with tapping on a table and now has a polished beat file. The celebration should match the achievement.

**Reduced motion**: checkmark appears instantly (no draw animation). No confetti. Text appears immediately. Modal still shows for 4 seconds.

### 9.6 Button Press Feedback

All buttons use a consistent press animation:

```css
.btn:active {
  transform: scale(0.97);
  transition: transform 80ms ease-out;
}
.btn:not(:active) {
  transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

The press is fast (80ms in), the release is slower with a spring overshoot (150ms out, slight bounce past 1.0 before settling). This mimics the feel of pressing a physical button.

The Record button has an amplified version: scale(0.93) on press, with the outer glow ring compressing inward simultaneously.

### 9.7 Empty-to-Content Transitions

When data appears for the first time (first session card, first cluster card, first hit on timeline):

- The element fades in from 0 opacity and slides up 8px (200ms, `ease-out`)
- Subsequent elements in a list stagger their entrance by 50ms each
- Maximum stagger: 5 elements (elements 6+ appear simultaneously with element 5)

This prevents the jarring appearance of data "popping" into existence and creates a gentle, polished reveal.

---

## Appendix A: CSS Custom Properties -- Complete Reference

```css
:root {
  /* Backgrounds */
  --bg-primary: #121214;
  --bg-secondary: #1A1A1E;
  --bg-tertiary: #242428;
  --bg-hover: #2E2E34;
  --bg-active: #38383F;

  /* Borders */
  --border-subtle: #2E2E34;
  --border-default: #3A3A42;
  --border-focus: #FF6B3D;

  /* Text */
  --text-primary: #F0F0F2;
  --text-secondary: #A0A0A8;
  --text-tertiary: #6E6E78;
  --text-disabled: #4A4A52;
  --text-inverse: #121214;

  /* Accents */
  --accent-primary: #FF6B3D;
  --accent-primary-hover: #FF8259;
  --accent-primary-muted: #FF6B3D26;
  --accent-secondary: #3B82F6;
  --accent-secondary-muted: #3B82F626;

  /* Semantic */
  --color-success: #34D399;
  --color-warning: #FBBF24;
  --color-error: #F87171;
  --color-info: #60A5FA;

  /* Instrument Colors */
  --cluster-0: #FF6B6B;
  --cluster-1: #FFB347;
  --cluster-2: #4DD4E6;
  --cluster-3: #A78BFA;
  --cluster-4: #86EFAC;
  --cluster-5: #F9A8D4;
  --cluster-6: #7DD3FC;
  --cluster-7: #FDE68A;

  /* Typography */
  --font-primary: 'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', ui-monospace, monospace;
  --text-xs: 0.6875rem;
  --text-sm: 0.8125rem;
  --text-base: 1rem;
  --text-md: 1.125rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5rem;
  --text-2xl: 2rem;
  --text-3xl: 2.5rem;

  /* Spacing */
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows (dark theme -- minimal) */
  --shadow-float: 0 8px 24px #00000060;

  /* Transitions */
  --ease-micro: 100ms ease-out;
  --ease-state: 250ms ease-in-out;
  --ease-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-slow: 500ms ease-in-out;
}
```

## Appendix B: Component-to-File Mapping

This table maps design components to their implementation files per the project structure in `technical-architecture.md#11.2`.

| Design Component | Implementation File | Notes |
|---|---|---|
| App Shell / Layout | `src/components/layout/AppShell.tsx` | Screen routing, responsive shell |
| Header | `src/components/layout/Header.tsx` | Shared across all screens |
| Record Button | Part of Home view | Custom component, not shared `Button.tsx` |
| Live Waveform | `src/components/recording/LiveWaveform.tsx` | Canvas-based, 60fps |
| Hit Counter | `src/components/recording/HitCounter.tsx` | Animated counter |
| Sensitivity Control | `src/components/recording/SensitivityControl.tsx` | Slider component |
| Cluster Card | `src/components/mapping/ClusterCard.tsx` | Card with waveform + chips |
| Sample Picker | `src/components/mapping/SamplePicker.tsx` | Bottom sheet / dropdown |
| Timeline (wrapper) | `src/components/editing/Timeline.tsx` | React wrapper |
| Timeline (canvas) | `src/components/editing/TimelineCanvas.ts` | Canvas 2D rendering |
| Mixer Panel | `src/components/editing/MixerPanel.tsx` | Volume/pan controls |
| Quantization Panel | `src/components/editing/QuantizationPanel.tsx` | BPM, grid, strength |
| Transport Bar | `src/components/editing/TransportBar.tsx` | Playback controls |
| Button | `src/components/shared/Button.tsx` | Primary/Secondary/Ghost |
| Slider | `src/components/shared/Slider.tsx` | Horizontal slider |
| Modal | `src/components/shared/Modal.tsx` | Modal / Bottom Sheet |
| Icons | `src/components/shared/Icons.tsx` | Lucide + custom icons |

## Appendix C: Screen Flow Diagram

```
+----------+     +----------+     +---------+     +----------+
|          |     |          |     |         |     |          |
|  Home    +---->+ Record   +---->+ Cluster +---->+ Timeline |
|  Screen  |     | Screen   |     | Review  |     | Screen   |
|          |     |          |     |         |     |          |
+----+-----+     +----+-----+     +----+----+     +----+-----+
     |                |                |                |
     v                v                v                v
+---------+     +---------+     +---------+     +---------+
| Settings|     | Error:  |     | Sample  |     | Export  |
| Screen  |     | No mic  |     | Browser |     | Flow    |
+---------+     | No hits |     +---------+     +---------+
                | Too short|
                +---------+
```

Navigation is linear for the core flow (Home > Record > Cluster > Timeline) but every screen has a back action. The user can jump from Timeline back to Cluster Review without losing timeline state. Settings is accessible from any screen via the header.

---

**Cross-references**:
- `product-requirements.md` -- Functional requirements (FR-001 through FR-072) mapped throughout
- `technical-architecture.md#11` -- Tech stack (React, CSS Modules, Canvas, Zustand)
- `technical-architecture.md#11.2` -- Project structure and component file mapping
- `brand-strategy.md#Logo Direction` -- Color direction (coral/amber/orange primary, charcoal secondary)
- `ux-research.md#2` -- User personas informing design decisions
- `ux-research.md#3` -- User journey maps informing screen flows
- `audio-engineering.md#1.1` -- AudioContext lifecycle informing permission and resume flows
