# Technical Architecture

**Document Version**: 1.0.0
**Last Updated**: 2026-03-12
**Status**: Draft PRD Section

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Audio Pipeline Deep Dive](#2-audio-pipeline-deep-dive)
3. [Onset Detection Algorithm](#3-onset-detection-algorithm)
4. [Feature Extraction](#4-feature-extraction)
5. [Sound Clustering](#5-sound-clustering)
6. [Quantization Engine](#6-quantization-engine)
7. [Playback Engine](#7-playback-engine)
8. [Data Models](#8-data-models)
9. [State Management](#9-state-management)
10. [Performance Requirements](#10-performance-requirements)
11. [Technology Stack Recommendation](#11-technology-stack-recommendation)
12. [Security and Privacy](#12-security-and-privacy)
13. [Future Architecture Considerations](#13-future-architecture-considerations)

---

## 1. System Overview

### 1.1 High-Level Architecture

TapBeats is a client-only single-page application. All audio processing, analysis, and playback happen entirely within the browser using the Web Audio API and standard Web Platform APIs. No server is required for v1 functionality.

The system is composed of six primary subsystems connected by a unidirectional data pipeline with a reactive state layer.

```
+------------------------------------------------------------------+
|                        TapBeats Application                       |
|                                                                   |
|  +------------------+    +------------------+    +--------------+ |
|  |   UI Layer        |    |  State Manager   |    |  Storage     | |
|  |  (React + Canvas) |<-->|  (Zustand Store) |<-->|  (IndexedDB) | |
|  +--------+---------+    +--------+---------+    +--------------+ |
|           |                       |                               |
|           v                       v                               |
|  +----------------------------------------------------------+    |
|  |                    Audio Engine Core                       |    |
|  |                                                            |    |
|  |  +-----------+   +----------+   +-----------+             |    |
|  |  | Capture   |-->| Analysis |-->| Clustering|             |    |
|  |  | Pipeline  |   | Pipeline |   | Engine    |             |    |
|  |  +-----------+   +----------+   +-----------+             |    |
|  |       |               |              |                     |    |
|  |       v               v              v                     |    |
|  |  +-----------+   +----------+   +-----------+             |    |
|  |  | Onset     |   | Feature  |   | Quantize  |             |    |
|  |  | Detector  |   | Extractor|   | Engine    |             |    |
|  |  +-----------+   +----------+   +-----------+             |    |
|  |                                      |                     |    |
|  |                                      v                     |    |
|  |                               +-----------+               |    |
|  |                               | Playback  |               |    |
|  |                               | Engine    |               |    |
|  |                               +-----------+               |    |
|  +----------------------------------------------------------+    |
+------------------------------------------------------------------+
```

### 1.2 End-to-End Data Flow

The complete data flow from microphone input to polished beat playback follows this pipeline:

```
Microphone (MediaStream)
    |
    v
AudioContext (44.1kHz / 48kHz)
    |
    v
AudioWorkletNode (real-time PCM stream)
    |
    +---> Ring Buffer (continuous audio, last N seconds)
    |
    v
Onset Detector (spectral flux + adaptive threshold)
    |
    +---> Raw Hit Events { timestamp, bufferIndex }
    |
    v
Hit Extractor (slices audio window around each onset)
    |
    +---> Hit Audio Snippets (Float32Array, ~50-200ms each)
    |
    v
Feature Extractor (per-hit spectral analysis)
    |
    +---> Feature Vectors (13-dimensional: centroid, rolloff, ZCR, RMS,
    |                       attack, decay, MFCC[0..6])
    |
    v
Clustering Engine (k-means with auto-k selection)
    |
    +---> Cluster Assignments { hitId -> clusterId }
    |
    v
User Mapping (assign cluster -> instrument sample)
    |
    +---> Instrument Assignments { clusterId -> sampleId }
    |
    v
Quantization Engine (BPM detection + grid snap)
    |
    +---> Quantized Hit Sequence { time, velocity, sampleId }
    |
    v
Playback Engine (Web Audio scheduled playback)
    |
    +---> AudioDestinationNode (speakers)
```

### 1.3 Threading Model

```
Main Thread                          AudioWorklet Thread
+----------------------------+       +---------------------------+
| React UI rendering          |       | Real-time PCM capture     |
| State management            |       | Ring buffer write          |
| Canvas timeline drawing     |       | Onset detection (spectral |
| Clustering (post-capture)   |       |   flux computation)       |
| Quantization                |       | Hit event posting via     |
| Playback scheduling         |       |   MessagePort             |
+----------------------------+       +---------------------------+
        ^           |                         |
        |           v                         v
        |   +----------------+        MessagePort (hit events,
        +---|  MessagePort   |<-------  audio buffer transfers)
            +----------------+
```

The AudioWorklet thread handles all latency-critical work: continuous PCM capture, ring buffer maintenance, and real-time onset detection. The main thread handles everything else. Communication between threads uses `MessagePort` with `Transferable` objects (ArrayBuffers) to avoid copying overhead.

---

## 2. Audio Pipeline Deep Dive

### 2.1 Microphone Capture

#### MediaStream Acquisition

```typescript
async function acquireMicrophone(): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: false,   // Preserve raw audio characteristics
      noiseSuppression: false,   // We handle noise floor ourselves
      autoGainControl: false,    // Preserve dynamic range for velocity
      channelCount: 1,           // Mono is sufficient for percussion
      sampleRate: { ideal: 44100 },
    },
    video: false,
  };

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    if (err instanceof DOMException) {
      switch (err.name) {
        case 'NotAllowedError':
          throw new MicrophonePermissionDeniedError();
        case 'NotFoundError':
          throw new NoMicrophoneError();
        case 'NotReadableError':
          throw new MicrophoneInUseError();
        default:
          throw new MicrophoneError(err.message);
      }
    }
    throw err;
  }
}
```

**Critical constraint rationale**: `echoCancellation`, `noiseSuppression`, and `autoGainControl` are all disabled because these browser-level DSP processors destructively alter the audio signal. Echo cancellation removes frequency content. Noise suppression masks subtle timbral differences between tap types. Auto gain control normalizes amplitude, destroying velocity information that we need for both feature extraction and velocity-sensitive playback.

#### AudioContext and Node Graph Setup

```typescript
interface AudioPipelineConfig {
  sampleRate: number;
  fftSize: number;
  bufferSeconds: number;
  onsetCallback: (event: OnsetEvent) => void;
}

async function createAudioPipeline(
  stream: MediaStream,
  config: AudioPipelineConfig
): Promise<AudioPipelineHandle> {
  const audioContext = new AudioContext({
    sampleRate: config.sampleRate,
    latencyHint: 'interactive',
  });

  // Load worklet module
  const workletUrl = new URL(
    '../audio/capture/tap-processor.worklet.ts',
    import.meta.url
  );
  await audioContext.audioWorklet.addModule(workletUrl.href);

  const sourceNode = audioContext.createMediaStreamSource(stream);

  const workletNode = new AudioWorkletNode(audioContext, 'tap-processor', {
    processorOptions: {
      fftSize: config.fftSize,
      sampleRate: audioContext.sampleRate, // Use actual rate
      ringBufferSeconds: config.bufferSeconds,
    },
    numberOfInputs: 1,
    numberOfOutputs: 0,
    channelCount: 1,
    channelCountMode: 'explicit',
  });

  sourceNode.connect(workletNode);

  workletNode.port.onmessage = (event: MessageEvent) => {
    if (event.data.type === 'onset') {
      config.onsetCallback(event.data.payload as OnsetEvent);
    }
  };

  return {
    audioContext,
    sourceNode,
    workletNode,
    stop() {
      sourceNode.disconnect();
      workletNode.disconnect();
      stream.getTracks().forEach(t => t.stop());
    },
  };
}
```

#### Complete Audio Node Graph

```
RECORDING PHASE:

  MediaStream (microphone)
      |
      v
  MediaStreamSourceNode
      |
      v
  AudioWorkletNode ("tap-processor")
      |   - Ring buffer (Float32Array, circular)
      |   - FFT computation (spectral flux onset detection)
      |   - Posts onset events via MessagePort
      |   - Posts audio snippet buffers via Transferable
      |
      (no output connections -- analysis only, no monitoring)


PLAYBACK PHASE:

  AudioBufferSourceNode (sample A) -----> GainNode (velocity A) --+
                                                                   |
  AudioBufferSourceNode (sample B) -----> GainNode (velocity B) --+
                                                                   |
  AudioBufferSourceNode (sample C) -----> GainNode (velocity C) --+
      .                                         .                  |
      .                                         .                  |
                                                                   v
                                                          +-----------------+
                                                          | Per-Track Nodes |
                                                          |                 |
                                              +-----------+ StereoPannerNode|
                                              |           | GainNode (vol)  |
                                              |           +-----------------+
                                              |                    |
                                              v                    v
                                       +-------------+    +-------------+
                                       | Track 0 Pan |    | Track 1 Pan |  ...
                                       | Track 0 Vol |    | Track 1 Vol |
                                       +------+------+    +------+------+
                                              |                    |
                                              +--------+-----------+
                                                       |
                                                       v
                                              +--------+--------+
                                              |  Master GainNode |
                                              +--------+--------+
                                                       |
                                                       v
                                              +--------+--------+
                                              | AudioDestination |
                                              | (speakers)       |
                                              +-----------------+
```

### 2.2 Sample Rate Considerations

| Sample Rate | Pros | Cons | Recommendation |
|---|---|---|---|
| **44.1 kHz** | CD-quality standard; smaller buffers; sufficient Nyquist ceiling (22.05 kHz) for percussion analysis; wider browser support for explicit rate requests | Slightly lower spectral resolution above 20 kHz (irrelevant for tapping) | **Preferred for v1** |
| **48 kHz** | Native rate on many audio interfaces and mobile devices; avoids potential resampling artifacts on some hardware | 8.8% more data per second; some mobile browsers may silently resample to device native rate anyway | Use if 44.1 kHz is unavailable |

**Strategy**: Request 44100 Hz via constraints. If the actual `AudioContext.sampleRate` differs (browser may override), detect and adapt. All downstream processing references `audioContext.sampleRate` rather than a hardcoded value.

```typescript
// ALWAYS use this, never hardcode a sample rate
const actualRate = audioContext.sampleRate;
```

### 2.3 Buffer Size Tradeoffs

The AudioWorklet processes audio in **render quanta** of 128 samples. This is fixed by the Web Audio API specification and cannot be changed. The processing callback `process()` receives exactly 128 samples per invocation.

| Buffer Accumulation | Samples | Latency at 44.1kHz | Use |
|---|---|---|---|
| 1 render quantum | 128 | 2.9 ms | Too small for FFT |
| 8 quanta (hop) | 1024 | 23.2 ms | Onset detection hop size |
| 16 quanta (FFT) | 2048 | 46.4 ms | Single FFT window |

**Onset detection operates on accumulated buffers**: We accumulate 128-sample quanta into a 1024-sample hop buffer inside the worklet. Each time the hop buffer fills, we compute an FFT over the most recent 2048 samples (overlapping window), yielding spectral flux values with 23.2 ms temporal resolution. This is well under the human perception threshold for simultaneous events (~50 ms) and sufficient for onset detection accuracy.

**Ring buffer sizing**: The ring buffer stores the last N seconds of raw PCM for hit extraction. At 44100 Hz mono Float32, 10 seconds requires:

```
44100 samples/sec * 10 sec * 4 bytes/sample = 1,764,000 bytes (~1.7 MB)
```

This is trivial for any modern device.

### 2.4 Audio Format and Storage

**In-memory format**: All audio is stored as `Float32Array` with values in the range [-1.0, 1.0]. This is the native format of the Web Audio API and avoids any conversion overhead.

**Per-hit snippet storage**: When an onset is detected, a window of audio around the onset is extracted from the ring buffer:
- Pre-onset padding: 10 ms (to capture the full attack transient)
- Post-onset window: 200 ms (sufficient for most percussive decays)
- Total snippet: ~210 ms = ~9,261 samples at 44.1 kHz = ~37 KB per hit

**Persistent storage**: Sessions are saved to IndexedDB. Audio snippets are stored as raw `Float32Array` blobs. Full session audio (the complete ring buffer at time of stop) is optionally stored as a WAV-encoded `Blob` for potential future export.

**WAV encoding** (for export only):

```typescript
function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);           // chunk size
  view.setUint16(20, 1, true);            // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Convert Float32 [-1,1] to Int16
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
```

---

## 3. Onset Detection Algorithm

### 3.1 Problem Statement

Onset detection identifies the precise moments when a user taps on a surface. The detector must handle:
- Variable tap loudness (soft finger taps to hard palm slaps)
- Background noise (ambient room noise, HVAC, etc.)
- Rapid successive taps (up to ~15 Hz for fast rolls)
- Different surfaces (desk, table, book, thigh) with varying spectral profiles

### 3.2 Algorithm Comparison

| Method | Principle | Pros | Cons |
|---|---|---|---|
| **Amplitude threshold** | RMS exceeds fixed/adaptive threshold | Simple, low CPU | Poor in noise; misses soft taps after loud ones; threshold tuning fragile |
| **Spectral flux** | Sum of positive frequency bin magnitude changes between frames | Excellent for percussive sounds; naturally adaptive to spectral changes; robust to steady-state noise | Higher CPU (requires FFT per frame); slight latency from windowing |
| **Complex-domain spectral flux** | Uses both magnitude and phase changes | Most accurate for mixed signals | Overkill for percussive-only use case; significantly higher CPU |
| **High-frequency content** | Weighted spectral flux emphasizing high frequencies | Good for transient detection | Biased against low-frequency taps |

### 3.3 Recommended Approach: Spectral Flux with Adaptive Threshold

**Rationale**: Percussive taps produce broadband spectral energy that appears suddenly. Spectral flux -- measuring the frame-to-frame increase in spectral energy -- naturally captures this. Combined with an adaptive threshold that tracks the noise floor, it provides robust detection across varying environments and tap intensities.

#### 3.3.1 Spectral Flux Computation

For each analysis frame (hop of 1024 samples, FFT of 2048 samples with Hann window):

```
Pseudocode: SpectralFlux

INPUT:
  currentMagnitudes[N]   -- magnitude spectrum of current frame
                         -- (N = fftSize/2 + 1 = 1025)
  previousMagnitudes[N]  -- magnitude spectrum of previous frame

OUTPUT:
  flux: number           -- non-negative spectral flux value

ALGORITHM:
  flux = 0
  for i = 0 to N-1:
    diff = currentMagnitudes[i] - previousMagnitudes[i]
    if diff > 0:                -- half-wave rectification: only count increases
      flux += diff * diff       -- square for emphasis on large changes
  return flux
```

**Half-wave rectification** is critical: we only measure *increases* in spectral energy. Decreases (sound dying away) should not trigger onsets.

#### 3.3.2 Adaptive Threshold

A fixed threshold fails because tap loudness varies and background noise changes over time. Instead, we maintain a running statistical model of the spectral flux:

```
Pseudocode: AdaptiveOnsetDetection

PARAMETERS:
  MEDIAN_WINDOW = 10          -- frames for running median
  THRESHOLD_MULTIPLIER = 2.0  -- sensitivity
                              -- (user-adjustable: 1.5=sensitive, 3.0=strict)
  THRESHOLD_FLOOR = 0.001     -- absolute minimum threshold
                              -- (prevents triggering on silence)
  MIN_INTER_ONSET_MS = 50     -- minimum time between consecutive onsets
  COOLDOWN_FRAMES = ceil(MIN_INTER_ONSET_MS / HOP_DURATION_MS)

STATE:
  fluxHistory[MEDIAN_WINDOW]  -- circular buffer of recent flux values
  frameSinceLastOnset = COOLDOWN_FRAMES  -- start ready to detect

ALGORITHM (called once per hop frame):
  flux = computeSpectralFlux(currentMagnitudes, previousMagnitudes)

  -- Compute adaptive threshold from recent flux median
  medianFlux = median(fluxHistory)
  threshold = max(THRESHOLD_FLOOR, medianFlux * THRESHOLD_MULTIPLIER)

  -- Push current flux into history AFTER threshold calculation
  -- to avoid self-influence
  fluxHistory.push(flux)

  frameSinceLastOnset += 1

  -- Detection: flux exceeds threshold AND cooldown has elapsed
  if flux > threshold AND frameSinceLastOnset >= COOLDOWN_FRAMES:
    frameSinceLastOnset = 0
    emit OnsetEvent {
      timestamp: currentFrameTimestamp,
      strength: flux / threshold,      -- relative onset strength (>1.0)
      ringBufferIndex: currentWritePosition
    }
```

#### 3.3.3 Full AudioWorklet Implementation

```typescript
// tap-processor.worklet.ts

interface OnsetEvent {
  timestamp: number;
  strength: number;
  ringBufferIndex: number;
  audioSnippet: ArrayBuffer;
}

class TapProcessor extends AudioWorkletProcessor {
  // Ring buffer
  private ringBuffer: Float32Array;
  private ringWritePos = 0;
  private ringCapacity: number;

  // Hop accumulation
  private hopSize: number;
  private hopBuffer: Float32Array;
  private hopFillPos = 0;

  // FFT state
  private fftSize: number;
  private fftWindow: Float32Array;
  private prevMagnitudes: Float32Array;

  // Onset detection state
  private fluxHistory: Float32Array;
  private fluxHistoryPos = 0;
  private fluxHistoryLen = 10;
  private frameSinceLastOnset: number;
  private cooldownFrames: number;
  private thresholdMultiplier = 2.0;
  private thresholdFloor = 0.001;

  // Config
  private sampleRate: number;

  // FFT internals (radix-2 Cooley-Tukey)
  private fftReal: Float32Array;
  private fftImag: Float32Array;
  private bitReversalTable: Uint32Array;
  private twiddleReal: Float32Array;
  private twiddleImag: Float32Array;

  constructor(options: AudioWorkletNodeOptions) {
    super();

    const opts = options.processorOptions!;
    this.fftSize = opts.fftSize || 2048;
    this.hopSize = 1024;
    this.sampleRate = opts.sampleRate || 44100;
    this.ringCapacity = Math.floor(
      this.sampleRate * (opts.ringBufferSeconds || 10)
    );

    // Allocate buffers
    this.ringBuffer = new Float32Array(this.ringCapacity);
    this.hopBuffer = new Float32Array(this.hopSize);
    this.prevMagnitudes = new Float32Array(this.fftSize / 2 + 1);
    this.fluxHistory = new Float32Array(this.fluxHistoryLen);
    this.fftReal = new Float32Array(this.fftSize);
    this.fftImag = new Float32Array(this.fftSize);

    // Precompute Hann window
    this.fftWindow = new Float32Array(this.fftSize);
    for (let i = 0; i < this.fftSize; i++) {
      this.fftWindow[i] =
        0.5 * (1 - Math.cos((2 * Math.PI * i) / (this.fftSize - 1)));
    }

    // Precompute bit-reversal and twiddle factors for FFT
    this.bitReversalTable = this.buildBitReversalTable(this.fftSize);
    const twiddles = this.buildTwiddleFactors(this.fftSize);
    this.twiddleReal = twiddles.real;
    this.twiddleImag = twiddles.imag;

    // Onset timing
    const hopDurationMs = (this.hopSize / this.sampleRate) * 1000;
    const minInterOnsetMs = 50;
    this.cooldownFrames = Math.ceil(minInterOnsetMs / hopDurationMs);
    this.frameSinceLastOnset = this.cooldownFrames;

    this.port.onmessage = (e: MessageEvent) => this.handleMessage(e);
  }

  process(
    inputs: Float32Array[][],
    _outputs: Float32Array[][],
    _params: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0]?.[0];
    if (!input) return true;

    // Write to ring buffer
    for (let i = 0; i < input.length; i++) {
      this.ringBuffer[this.ringWritePos] = input[i];
      this.ringWritePos =
        (this.ringWritePos + 1) % this.ringCapacity;
    }

    // Accumulate into hop buffer
    for (let i = 0; i < input.length; i++) {
      this.hopBuffer[this.hopFillPos++] = input[i];

      if (this.hopFillPos >= this.hopSize) {
        this.hopFillPos = 0;
        this.processHop();
      }
    }

    return true;
  }

  private processHop(): void {
    // Build FFT input from ring buffer (last fftSize samples, windowed)
    const start =
      (this.ringWritePos - this.fftSize + this.ringCapacity) %
      this.ringCapacity;
    for (let i = 0; i < this.fftSize; i++) {
      const idx = (start + i) % this.ringCapacity;
      this.fftReal[i] = this.ringBuffer[idx] * this.fftWindow[i];
      this.fftImag[i] = 0;
    }

    // In-place FFT
    this.fft(this.fftReal, this.fftImag);

    // Compute magnitudes
    const numBins = this.fftSize / 2 + 1;
    const magnitudes = new Float32Array(numBins);
    for (let i = 0; i < numBins; i++) {
      magnitudes[i] = Math.sqrt(
        this.fftReal[i] * this.fftReal[i] +
        this.fftImag[i] * this.fftImag[i]
      );
    }

    // Spectral flux (half-wave rectified, squared)
    let flux = 0;
    for (let i = 0; i < numBins; i++) {
      const diff = magnitudes[i] - this.prevMagnitudes[i];
      if (diff > 0) {
        flux += diff * diff;
      }
    }

    // Adaptive threshold from median of recent flux
    const sorted = Array.from(this.fluxHistory).sort((a, b) => a - b);
    const medianFlux = sorted[Math.floor(sorted.length / 2)];
    const threshold = Math.max(
      this.thresholdFloor,
      medianFlux * this.thresholdMultiplier
    );

    // Update history AFTER threshold calculation
    this.fluxHistory[this.fluxHistoryPos] = flux;
    this.fluxHistoryPos =
      (this.fluxHistoryPos + 1) % this.fluxHistoryLen;

    this.frameSinceLastOnset++;

    // Detection
    if (
      flux > threshold &&
      this.frameSinceLastOnset >= this.cooldownFrames
    ) {
      this.frameSinceLastOnset = 0;

      // Extract snippet around onset
      const preOnsetSamples = Math.floor(this.sampleRate * 0.01);
      const postOnsetSamples = Math.floor(this.sampleRate * 0.2);
      const snippetLen = preOnsetSamples + postOnsetSamples;
      const snippet = new Float32Array(snippetLen);

      const onsetPos =
        (this.ringWritePos - this.hopSize + this.ringCapacity) %
        this.ringCapacity;
      const snippetStart =
        (onsetPos - preOnsetSamples + this.ringCapacity) %
        this.ringCapacity;

      for (let i = 0; i < snippetLen; i++) {
        snippet[i] =
          this.ringBuffer[(snippetStart + i) % this.ringCapacity];
      }

      this.port.postMessage(
        {
          type: 'onset',
          payload: {
            timestamp: currentTime, // AudioWorklet global
            strength: flux / threshold,
            ringBufferIndex: onsetPos,
            audioSnippet: snippet.buffer,
          } as OnsetEvent,
        },
        [snippet.buffer] // Transfer ownership, zero-copy
      );
    }

    // Store magnitudes for next frame
    this.prevMagnitudes.set(magnitudes);
  }

  // Radix-2 Cooley-Tukey in-place FFT
  private fft(real: Float32Array, imag: Float32Array): void {
    const n = real.length;

    // Bit-reversal permutation
    for (let i = 0; i < n; i++) {
      const j = this.bitReversalTable[i];
      if (i < j) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
    }

    // Butterfly stages
    for (let size = 2; size <= n; size *= 2) {
      const halfSize = size / 2;
      const step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = 0; j < halfSize; j++) {
          const twIdx = j * step;
          const tR = this.twiddleReal[twIdx];
          const tI = this.twiddleImag[twIdx];
          const evenIdx = i + j;
          const oddIdx = i + j + halfSize;

          const tmpR = real[oddIdx] * tR - imag[oddIdx] * tI;
          const tmpI = real[oddIdx] * tI + imag[oddIdx] * tR;

          real[oddIdx] = real[evenIdx] - tmpR;
          imag[oddIdx] = imag[evenIdx] - tmpI;
          real[evenIdx] += tmpR;
          imag[evenIdx] += tmpI;
        }
      }
    }
  }

  private buildBitReversalTable(n: number): Uint32Array {
    const table = new Uint32Array(n);
    const bits = Math.log2(n);
    for (let i = 0; i < n; i++) {
      let reversed = 0;
      let val = i;
      for (let b = 0; b < bits; b++) {
        reversed = (reversed << 1) | (val & 1);
        val >>= 1;
      }
      table[i] = reversed;
    }
    return table;
  }

  private buildTwiddleFactors(n: number): {
    real: Float32Array;
    imag: Float32Array;
  } {
    const half = n / 2;
    const real = new Float32Array(half);
    const imag = new Float32Array(half);
    for (let i = 0; i < half; i++) {
      const angle = (-2 * Math.PI * i) / n;
      real[i] = Math.cos(angle);
      imag[i] = Math.sin(angle);
    }
    return { real, imag };
  }

  private handleMessage(event: MessageEvent): void {
    if (event.data.type === 'updateThreshold') {
      this.thresholdMultiplier = event.data.value;
    }
    if (event.data.type === 'updateMinInterOnset') {
      const hopDurationMs = (this.hopSize / this.sampleRate) * 1000;
      this.cooldownFrames = Math.ceil(event.data.value / hopDurationMs);
    }
  }
}

registerProcessor('tap-processor', TapProcessor);
```

### 3.4 Handling False Positives and Negatives

**False positives** (detecting an onset when no tap occurred):
- Caused by sudden ambient sounds (door slam, voice, phone notification).
- Mitigation: The `MIN_INTER_ONSET_MS` cooldown prevents burst false positives. The `THRESHOLD_MULTIPLIER` can be tuned higher for noisy environments. The UI provides a "sensitivity" slider mapped to this multiplier.
- Post-capture mitigation: Users can delete hits in the timeline editor. Clustering also naturally separates accidental sounds into their own cluster, which the user can delete entirely.

**False negatives** (missing a real tap):
- Caused by very soft taps falling below threshold, or two taps within the cooldown window.
- Mitigation: Lower `THRESHOLD_MULTIPLIER` for sensitivity. The 50ms minimum inter-onset interval allows up to 20 taps per second, which exceeds human drumming speed for distinct hits. For extremely fast rolls, consider reducing to 30ms (33 taps/sec).
- Post-capture mitigation: Users can manually add hits in the timeline editor.

### 3.5 Sensitivity Controls Exposed to User

| Control | Internal Parameter | Range | Default | UI Element |
|---|---|---|---|---|
| Sensitivity | `THRESHOLD_MULTIPLIER` | 1.2 - 4.0 (inverted in UI: higher slider = lower multiplier) | 2.0 | Slider |
| Minimum gap | `MIN_INTER_ONSET_MS` | 20 - 150 ms | 50 ms | Advanced settings |

---

## 4. Feature Extraction

### 4.1 Purpose

After onset detection produces a set of hit audio snippets, feature extraction computes a compact numerical representation (feature vector) of each hit's timbral characteristics. These feature vectors are the input to the clustering algorithm that groups similar-sounding taps together.

### 4.2 Per-Hit Features

Each hit snippet (~210 ms of audio) is analyzed to produce the following features:

| Feature | Description | Typical Range | Discriminative Power |
|---|---|---|---|
| **Spectral Centroid** | Weighted mean of frequencies by magnitude; perceptual "brightness" | 200 - 8000 Hz | High: distinguishes dull thuds from sharp clicks |
| **Spectral Rolloff** (85th percentile) | Frequency below which 85% of spectral energy is concentrated | 500 - 12000 Hz | Medium: separates broadband from narrow-band sounds |
| **Zero-Crossing Rate** | Rate at which signal changes sign; correlates with noisiness | 0.01 - 0.5 | Medium: noisy taps vs. tonal taps |
| **RMS Energy** | Root-mean-square amplitude; perceptual loudness | 0.001 - 1.0 | Low for clustering (volume-dependent), high for velocity |
| **Attack Time** | Time from onset to peak amplitude | 0.5 - 20 ms | High: sharp attacks vs. soft attacks |
| **Decay Time** | Time from peak to -20dB | 5 - 200 ms | High: short percussive vs. resonant sounds |
| **MFCC[0..6]** | First 7 Mel-Frequency Cepstral Coefficients; compact timbral fingerprint | Varies | Very high: captures overall spectral shape |

**Total feature vector dimensionality**: 13 (1 + 1 + 1 + 1 + 1 + 1 + 7)

### 4.3 Feature Computation Algorithms

```typescript
interface HitFeatures {
  spectralCentroid: number;    // Hz
  spectralRolloff: number;     // Hz
  zeroCrossingRate: number;    // 0.0 - 1.0
  rmsEnergy: number;           // 0.0 - 1.0
  attackTimeMs: number;        // ms
  decayTimeMs: number;         // ms
  mfcc: number[];              // 7 coefficients
}

function extractFeatures(
  snippet: Float32Array,
  sampleRate: number
): HitFeatures {
  const magnitudes = computeMagnitudeSpectrum(snippet, sampleRate);

  return {
    spectralCentroid: computeSpectralCentroid(magnitudes, sampleRate),
    spectralRolloff: computeSpectralRolloff(magnitudes, sampleRate, 0.85),
    zeroCrossingRate: computeZeroCrossingRate(snippet),
    rmsEnergy: computeRMS(snippet),
    attackTimeMs: computeAttackTime(snippet, sampleRate),
    decayTimeMs: computeDecayTime(snippet, sampleRate),
    mfcc: computeMFCC(snippet, sampleRate, 7),
  };
}
```

#### Spectral Centroid

```
Pseudocode: SpectralCentroid

INPUT: magnitudeSpectrum M[0..N/2], sampleRate
OUTPUT: centroid frequency in Hz

1. freqPerBin = sampleRate / fftSize

2. weightedSum = 0
   magnitudeSum = 0
   for i = 0 to N/2:
     freq = i * freqPerBin
     weightedSum += freq * M[i]
     magnitudeSum += M[i]

3. if magnitudeSum == 0: return 0
   return weightedSum / magnitudeSum
```

#### Spectral Rolloff

```
Pseudocode: SpectralRolloff

INPUT: magnitudeSpectrum M[0..N/2], sampleRate, rolloffPercent (0.85)
OUTPUT: rolloff frequency in Hz

1. totalEnergy = sum(M[i]^2 for i = 0 to N/2)
2. threshold = totalEnergy * rolloffPercent

3. cumulativeEnergy = 0
   for i = 0 to N/2:
     cumulativeEnergy += M[i]^2
     if cumulativeEnergy >= threshold:
       return i * (sampleRate / fftSize)

4. return sampleRate / 2   // fallback: all energy within band
```

#### Zero-Crossing Rate

```
Pseudocode: ZeroCrossingRate

INPUT: audio snippet samples[L]
OUTPUT: rate in range [0.0, 1.0]

1. crossings = 0
   for i = 1 to L-1:
     if (samples[i] >= 0) != (samples[i-1] >= 0):
       crossings += 1

2. return crossings / (L - 1)
```

#### RMS Energy

```
Pseudocode: RMSEnergy

INPUT: audio snippet samples[L]
OUTPUT: RMS value in range [0.0, 1.0]

1. sumSquares = 0
   for i = 0 to L-1:
     sumSquares += samples[i] * samples[i]

2. return sqrt(sumSquares / L)
```

#### Attack Time

```
Pseudocode: AttackTime

INPUT: audio snippet samples[L], sampleRate
OUTPUT: attack time in milliseconds

1. Compute amplitude envelope:
   envelope[i] = abs(samples[i])
   Apply 1ms moving average smoothing (window = sampleRate / 1000):
     smoothed[i] = mean(envelope[i - halfWin .. i + halfWin])

2. peakIndex = argmax(smoothed)
   peakAmplitude = smoothed[peakIndex]

3. // Find the point where envelope first exceeds 10% of peak
   onsetThreshold = peakAmplitude * 0.1
   onsetIndex = 0
   for i = 0 to peakIndex:
     if smoothed[i] >= onsetThreshold:
       onsetIndex = i
       break

4. attackSamples = peakIndex - onsetIndex
   return (attackSamples / sampleRate) * 1000
```

#### Decay Time

```
Pseudocode: DecayTime

INPUT: audio snippet samples[L], sampleRate
OUTPUT: decay time in milliseconds (peak to -20dB)

1. Compute smoothed amplitude envelope (same as AttackTime)
2. peakIndex = argmax(smoothed)
   peakAmplitude = smoothed[peakIndex]

3. // -20dB below peak = 10% of peak amplitude
   decayThreshold = peakAmplitude * 0.1

4. decayEndIndex = L - 1     // default: end of snippet
   for i = peakIndex to L-1:
     if smoothed[i] <= decayThreshold:
       decayEndIndex = i
       break

5. decaySamples = decayEndIndex - peakIndex
   return (decaySamples / sampleRate) * 1000
```

#### MFCC Computation

```
Pseudocode: MFCC

INPUT: audio snippet samples[L], sampleRate, numCoefficients (7)
OUTPUT: array of numCoefficients MFCC values

PARAMETERS:
  numMelFilters = 26
  fftSize = 2048
  lowFreq = 20 Hz
  highFreq = sampleRate / 2

HELPER:
  hzToMel(f) = 2595 * log10(1 + f / 700)
  melToHz(m) = 700 * (10^(m / 2595) - 1)

1. Apply Hann window, compute FFT, get power spectrum:
   for i = 0 to fftSize-1:
     windowed[i] = samples[i] * hannWindow[i]
   FFT(windowed) -> (re, im)
   powerSpectrum[i] = (re[i]^2 + im[i]^2) / fftSize
     for i = 0 to fftSize/2

2. Create Mel filterbank:
   melLow = hzToMel(lowFreq)
   melHigh = hzToMel(highFreq)
   melPoints[0..numMelFilters+1] = linspace(melLow, melHigh, numMelFilters + 2)
   hzPoints[k] = melToHz(melPoints[k])
   binPoints[k] = floor((fftSize + 1) * hzPoints[k] / sampleRate)

   Create triangular filters:
   for each filter f = 0 to numMelFilters-1:
     for bin = binPoints[f] to binPoints[f+1]:
       weight[f][bin] = (bin - binPoints[f]) / (binPoints[f+1] - binPoints[f])
     for bin = binPoints[f+1] to binPoints[f+2]:
       weight[f][bin] = (binPoints[f+2] - bin) / (binPoints[f+2] - binPoints[f+1])

3. Apply filterbank:
   for f = 0 to numMelFilters-1:
     melEnergy[f] = sum(powerSpectrum[bin] * weight[f][bin])

4. Apply log (with epsilon to avoid log(0)):
   logMelEnergy[f] = log(melEnergy[f] + 1e-10)

5. DCT Type II to get cepstral coefficients:
   for k = 0 to numCoefficients-1:
     mfcc[k] = 0
     for f = 0 to numMelFilters-1:
       mfcc[k] += logMelEnergy[f] * cos(PI * k * (f + 0.5) / numMelFilters)

6. return mfcc[0..numCoefficients-1]
```

### 4.4 Feature Vector Composition

```typescript
function featuresToVector(features: HitFeatures): Float64Array {
  return new Float64Array([
    features.spectralCentroid,
    features.spectralRolloff,
    features.zeroCrossingRate,
    features.rmsEnergy,
    features.attackTimeMs,
    features.decayTimeMs,
    ...features.mfcc,
  ]);
  // Total: 13 dimensions
}
```

### 4.5 Normalization Strategy

Features have vastly different scales (spectral centroid in Hz vs. zero-crossing rate as a fraction). Without normalization, high-magnitude features dominate distance calculations in clustering.

**Method: Z-score normalization (standardization)**

```
Pseudocode: NormalizeFeatureSet

INPUT: featureVectors[M][D]   -- M hits, D dimensions (13)
OUTPUT: normalizedVectors[M][D], means[D], stdDevs[D]

1. For each dimension d = 0 to D-1:
     means[d] = mean(featureVectors[*][d])
     stdDevs[d] = stddev(featureVectors[*][d])
     if stdDevs[d] < 1e-10:
       stdDevs[d] = 1.0     -- avoid division by zero for constant features

2. For each hit m and dimension d:
     normalizedVectors[m][d] =
       (featureVectors[m][d] - means[d]) / stdDevs[d]

3. return normalizedVectors, means, stdDevs
```

**Why Z-score over min-max**: Z-score is robust to outliers (a single unusually loud tap does not compress the entire feature range). It preserves the distribution shape and naturally handles the case where features have different variances.

The `means` and `stdDevs` are stored alongside the session data so that new hits (if the user re-records) can be normalized consistently.

---

## 5. Sound Clustering

### 5.1 Problem Statement

Given a set of normalized feature vectors (one per hit), group them into clusters where each cluster represents a distinct "type" of sound the user produced. For example: knuckle tap on desk (cluster A), fingertip tap on desk (cluster B), palm slap (cluster C).

### 5.2 Algorithm Comparison

| Algorithm | Pros | Cons |
|---|---|---|
| **k-means** | Fast O(nkd); deterministic with k-means++; works well with spherical clusters; simple to implement | Requires specifying k; assumes spherical, similarly-sized clusters |
| **DBSCAN** | No k required; finds arbitrary cluster shapes; identifies noise points | Sensitive to epsilon/minPoints; struggles with varying density; hard to auto-tune |
| **Hierarchical (agglomerative)** | Produces dendrogram; no k needed upfront; interpretable | O(n^2 log n) or worse; cutting dendrogram still requires threshold; slow |
| **Gaussian Mixture Model** | Models elliptical clusters; probabilistic assignment | Slower; can overfit with few data points; overkill for this use case |

### 5.3 Recommended Approach: k-means with Automatic k Selection

**Rationale**: Tap sounds on the same surface tend to form tight, spherical clusters in feature space. k-means is the natural fit. Users typically produce 2-5 distinct sound types, making automatic k selection via silhouette score both feasible and reliable. The algorithm is fast enough to run interactively (sub-second for up to ~500 hits with k <= 8).

#### 5.3.1 Automatic k Selection

```
Pseudocode: AutoSelectK

INPUT: normalizedVectors[M][D]
OUTPUT: optimalK

PARAMETERS:
  MIN_K = 2
  MAX_K = min(8, floor(M / 3))   -- at least 3 hits per cluster
  NUM_INIT = 5                     -- k-means++ initializations per k

1. if M < 4:
     return 1   -- too few hits to cluster meaningfully

2. bestK = 1
   bestScore = -1

3. for k = MIN_K to MAX_K:
     bestClusteringForK = null
     bestInertiaForK = Infinity

     for init = 0 to NUM_INIT-1:
       result = kMeans(normalizedVectors, k)
       if result.inertia < bestInertiaForK:
         bestClusteringForK = result
         bestInertiaForK = result.inertia

     score = silhouetteScore(normalizedVectors, bestClusteringForK.assignments)

     if score > bestScore:
       bestScore = score
       bestK = k

4. // If best silhouette is very low, user likely produced
   // only one type of sound
   if bestScore < 0.25:
     return 1

5. return bestK
```

#### 5.3.2 k-means with k-means++ Initialization

```
Pseudocode: KMeans

INPUT: vectors[M][D], k
OUTPUT: { centroids[k][D], assignments[M], inertia }

PARAMETERS:
  MAX_ITER = 100

-- k-means++ initialization --
1. centroids[0] = vectors[randomIndex]
2. for c = 1 to k-1:
     for each vector v in vectors:
       dist[v] = min Euclidean distance from v to any existing centroid
     probabilities[v] = dist[v]^2 / sum(dist[*]^2)
     centroids[c] = vectors[weightedRandomChoice(probabilities)]

-- Iterative refinement (Lloyd's algorithm) --
3. for iteration = 0 to MAX_ITER-1:
     -- Assignment step
     for each vector v in vectors:
       assignments[v] = argmin_c(euclideanDistance(v, centroids[c]))

     -- Update step
     for each cluster c = 0 to k-1:
       members = vectors where assignments == c
       if members is empty:
         -- Reinitialize dead centroid to the farthest point
         centroids[c] = argmax_v(min_c'(distance(v, centroids[c'])))
       else:
         centroids[c] = mean(members)  -- component-wise mean

     -- Convergence check
     if assignments unchanged from previous iteration:
       break

4. inertia = sum(distance(v, centroids[assignments[v]])^2 for all v)
5. return { centroids, assignments, inertia }
```

#### 5.3.3 Silhouette Score

```
Pseudocode: SilhouetteScore

INPUT: vectors[M][D], assignments[M]
OUTPUT: score in range [-1, 1]

1. for each point i in 0..M-1:
     -- a(i) = mean distance to other points in same cluster
     sameCluster = { j : assignments[j] == assignments[i], j != i }
     if sameCluster is empty:
       silhouette[i] = 0
       continue
     a_i = mean(euclideanDistance(vectors[i], vectors[j]) for j in sameCluster)

     -- b(i) = smallest mean distance to any OTHER cluster
     b_i = Infinity
     for each cluster c != assignments[i]:
       clusterPoints = { j : assignments[j] == c }
       if clusterPoints is not empty:
         meanDist = mean(distance(vectors[i], vectors[j]) for j in clusterPoints)
         b_i = min(b_i, meanDist)

     silhouette[i] = (b_i - a_i) / max(a_i, b_i)

2. return mean(silhouette[0..M-1])
```

### 5.4 Edge Case Handling

| Case | Detection | Handling |
|---|---|---|
| **Only one sound type** | Silhouette < 0.25 for all k >= 2, or M < 4 | Set k=1; all hits in single cluster; user maps to one instrument |
| **Too many similar sounds** | Optimal k is 1 or 2 but user expects more | Manual split: user selects hits in timeline, creates new cluster |
| **Outlier hits** (accidental sounds) | Hit distance > 2x cluster radius from centroid | Mark as outlier; display with visual indicator; user can delete |
| **User corrects assignment** | User drags hit between clusters in UI | Semi-supervised re-clustering (see below) |

### 5.5 Semi-Supervised Re-clustering

When a user manually reassigns a hit, we incorporate their correction as a constraint:

```
Pseudocode: ReClusterWithConstraints

INPUT:
  vectors[M][D]
  currentAssignments[M]
  corrections: Map<hitIndex, newClusterId>

1. pinnedAssignments = merge(currentAssignments, corrections)

2. // Recompute centroids from pinned assignments
   for each cluster c:
     members = vectors where pinnedAssignments == c
     centroids[c] = mean(members)

3. // Run constrained k-means: pinned points never move
   for iteration = 0 to MAX_ITER:
     for each UNPINNED vector v:
       assignments[v] = argmin_c(distance(v, centroids[c]))
     for each PINNED vector v:
       assignments[v] = pinnedAssignments[v]

     for each cluster c:
       members = vectors where assignments == c
       centroids[c] = mean(members)

     if converged: break

4. return assignments
```

### 5.6 Performance Characteristics

| Hits (M) | Max k | Approximate Time (single-threaded) |
|---|---|---|
| 20 | 5 | < 5 ms |
| 100 | 8 | < 50 ms |
| 500 | 8 | < 200 ms |

These are well within interactive response requirements. No Web Worker offloading is needed for clustering in v1.

---

## 6. Quantization Engine

### 6.1 Purpose

Raw tap timestamps have natural human timing imprecision. The quantization engine snaps hit times to a musical grid while preserving the user's intended rhythm and velocity dynamics.

### 6.2 BPM Detection

Before quantizing, we need a tempo reference. The tap pattern itself provides this.

```
Pseudocode: DetectBPM

INPUT: hitTimestamps[M]   -- sorted array of onset times in seconds
OUTPUT: { bpm, downbeatOffset }

PARAMETERS:
  MIN_BPM = 60
  MAX_BPM = 200
  BPM_RESOLUTION = 0.5

1. if M < 4: return { bpm: 120, downbeatOffset: hitTimestamps[0] }

2. -- Compute inter-onset intervals (IOIs)
   iois = []
   for i = 1 to M-1:
     iois.push(hitTimestamps[i] - hitTimestamps[i-1])

3. -- Build IOI histogram
   -- Each IOI votes for BPM values it is consistent with
   -- IOI of t seconds is consistent with BPM = 60*n/t for int n
   bpmVotes = Map<number, number>()   // bpm -> vote weight

   for each ioi in iois:
     for n = 1 to 4:    // up to 4x subdivisions
       candidateBPM = (60 * n) / ioi
       if candidateBPM >= MIN_BPM and candidateBPM <= MAX_BPM:
         quantizedBPM = round(candidateBPM / BPM_RESOLUTION) * BPM_RESOLUTION
         bpmVotes[quantizedBPM] += 1.0 / n  // weight by 1/subdivision

4. -- Find peak
   bpm = key with max value in bpmVotes

5. -- Find downbeat offset: the hit that best aligns with grid
   beatDuration = 60 / bpm
   bestOffset = hitTimestamps[0]
   bestScore = 0

   for each candidate in hitTimestamps:
     score = 0
     for each hit in hitTimestamps:
       distToGrid = ((hit - candidate) % beatDuration + beatDuration) % beatDuration
       distToGrid = min(distToGrid, beatDuration - distToGrid)
       score += 1.0 / (1.0 + distToGrid * 100)
     if score > bestScore:
       bestScore = score
       bestOffset = candidate

6. return { bpm, downbeatOffset: bestOffset }
```

### 6.3 Grid Resolution Options

| Resolution | Name | Subdivisions per Beat | Common Use |
|---|---|---|---|
| 1/4 | Quarter note | 1 | Simple patterns, slow tempos |
| 1/8 | Eighth note | 2 | Standard rock/pop beats |
| 1/16 | Sixteenth note | 4 | Hi-hat patterns, fast rhythms |
| 1/8T | Eighth triplet | 3 | Shuffle, swing, jazz |
| 1/16T | Sixteenth triplet | 6 | Complex rhythmic patterns |

The user selects a grid resolution in the UI. The default is 1/16 (finest common subdivision), which can snap to any coarser grid as well.

### 6.4 Quantization Algorithm

```
Pseudocode: QuantizeHits

INPUT:
  hits[M] = { timestamp, clusterId, velocity }
  bpm: number
  downbeatOffset: number
  gridSubdivision: number        -- subdivisions per beat (1,2,3,4,6)
  quantizeStrength: number       -- 0.0 (no snap) to 1.0 (full snap)

OUTPUT:
  quantizedHits[M] = { time, clusterId, velocity, originalTime, gridIndex }

1. gridInterval = 60 / (bpm * gridSubdivision)   -- seconds per grid line

2. for each hit in hits:
     relativeTime = hit.timestamp - downbeatOffset
     gridIndex = round(relativeTime / gridInterval)
     nearestGridTime = downbeatOffset + gridIndex * gridInterval

     // Interpolate between original and snapped based on strength
     quantizedTime = hit.timestamp +
       (nearestGridTime - hit.timestamp) * quantizeStrength

     quantizedHits.push({
       time: quantizedTime,
       clusterId: hit.clusterId,
       velocity: hit.velocity,
       originalTime: hit.timestamp,
       gridIndex: gridIndex,
     })

3. -- Resolve collisions: two hits on same grid point AND same cluster
   -- keep the louder one
   seen = Map<string, QuantizedHit>()   // key = "gridIndex:clusterId"
   for each qh in quantizedHits:
     key = qh.gridIndex + ":" + qh.clusterId
     if seen.has(key):
       if qh.velocity > seen.get(key).velocity:
         seen.set(key, qh)
     else:
       seen.set(key, qh)
   quantizedHits = Array.from(seen.values())

4. return quantizedHits
```

### 6.5 Swing Quantization

Swing delays every other subdivision grid line by a swing amount:

```
Pseudocode: ApplySwing

INPUT:
  gridIndex: integer
  gridInterval: number (seconds)
  swingAmount: number (0.0 = straight, 0.5 = full triplet swing)
                       Range: 0.0 - 0.7

OUTPUT:
  adjusted time offset in seconds

1. if gridIndex is odd:    -- every other grid line
     swingDelay = gridInterval * swingAmount
     return gridIndex * gridInterval + swingDelay
   else:
     return gridIndex * gridInterval
```

With `swingAmount = 0.33`, eighth notes become triplet-feel. With `swingAmount = 0.5`, the offbeat is delayed to the last third of the beat, producing a heavy shuffle.

### 6.6 Humanization

After quantization, optionally re-introduce slight timing and velocity variation to avoid a mechanical feel:

```
Pseudocode: Humanize

INPUT:
  quantizedHits[M]
  timingVarianceMs: number    -- e.g., 5ms (subtle) to 20ms (loose)
  velocityVariance: number    -- e.g., 0.05 (subtle) to 0.15 (dynamic)

OUTPUT:
  humanizedHits[M]

1. for each hit in quantizedHits:
     // Gaussian random timing offset
     timeOffset = gaussianRandom(mean=0, stddev=timingVarianceMs / 1000)
     hit.time += timeOffset

     // Gaussian random velocity offset, clamped to [0, 1]
     velOffset = gaussianRandom(mean=0, stddev=velocityVariance)
     hit.velocity = clamp(hit.velocity + velOffset, 0.0, 1.0)

2. return quantizedHits
```

**Gaussian random via Box-Muller transform**:

```typescript
function gaussianRandom(mean: number, stddev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}
```

### 6.7 Handling Polyrhythms and Odd Time Signatures

The quantization engine does not enforce a time signature. The grid is purely subdivisions of a beat. Polyrhythms emerge naturally when the user taps patterns that span different subdivision levels.

For odd time signatures (5/4, 7/8, etc.), the user sets a **loop length** in beats. The loop length is independent of the grid resolution. A 7/8 pattern at 1/8 grid resolution simply has 7 grid points per measure.

```typescript
interface QuantizationConfig {
  bpm: number;                         // Detected or user-set
  bpmDetected: number;                 // Auto-detected value (for reference)
  gridSubdivision: 1 | 2 | 3 | 4 | 6;
  quantizeStrength: number;            // 0.0 - 1.0
  swingAmount: number;                 // 0.0 - 0.7
  loopLengthBeats: number;             // e.g., 4 for 4/4, 3.5 for 7/8
  humanizeTimingMs: number;            // 0 - 20
  humanizeVelocity: number;            // 0.0 - 0.15
}
```

---

## 7. Playback Engine

### 7.1 Architecture

The playback engine uses the Web Audio API to schedule sample-accurate playback of instrument samples, replacing the original tap sounds with high-quality audio.

```
Playback Scheduling Model (Lookahead Pattern):

  Time ---->
  |---------|---------|---------|---------|---------|
  ^         ^         ^
  |         |         +-- scheduleUntil (currentTime + 100ms)
  |         +-- currentTime (AudioContext clock)
  +-- previously scheduled notes (already playing)

  The scheduler runs on a setInterval(25ms) timer.
  Each tick, it schedules all notes between currentTime
  and currentTime + 100ms that haven't been scheduled yet.
  This provides 75ms of safety margin (3 ticks) against
  main thread jank.
```

### 7.2 Sample Library Management

```typescript
interface SampleLibrary {
  categories: SampleCategory[];
}

interface SampleCategory {
  id: string;                    // "drums", "percussion", "electronic"
  name: string;
  samples: SampleDefinition[];
}

interface SampleDefinition {
  id: string;                    // "kick_acoustic_01"
  name: string;                  // "Acoustic Kick 1"
  categoryId: string;
  urlOgg: string;                // Primary format
  urlMp3: string;                // Fallback for Safari
  audioBuffer?: AudioBuffer;     // Cached after decode
  durationMs: number;
  tags: string[];                // ["punchy", "deep", "acoustic"]
}

class SampleLoader {
  private cache = new Map<string, AudioBuffer>();
  private loading = new Map<string, Promise<AudioBuffer>>();
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async load(sampleDef: SampleDefinition): Promise<AudioBuffer> {
    // Return cached
    const cached = this.cache.get(sampleDef.id);
    if (cached) return cached;

    // Return in-flight promise (dedup concurrent loads)
    const inflight = this.loading.get(sampleDef.id);
    if (inflight) return inflight;

    const promise = this.fetchAndDecode(sampleDef);
    this.loading.set(sampleDef.id, promise);

    try {
      const buffer = await promise;
      this.cache.set(sampleDef.id, buffer);
      return buffer;
    } finally {
      this.loading.delete(sampleDef.id);
    }
  }

  private async fetchAndDecode(
    sampleDef: SampleDefinition
  ): Promise<AudioBuffer> {
    // Try OGG first, fall back to MP3
    const url = this.supportsOgg()
      ? sampleDef.urlOgg
      : sampleDef.urlMp3;

    const response = await fetch(url);
    if (!response.ok) {
      throw new SampleLoadError(sampleDef.id, response.status);
    }
    const arrayBuffer = await response.arrayBuffer();
    return this.audioContext.decodeAudioData(arrayBuffer);
  }

  private supportsOgg(): boolean {
    const audio = new Audio();
    return audio.canPlayType('audio/ogg; codecs=vorbis') !== '';
  }

  evict(sampleId: string): void {
    this.cache.delete(sampleId);
  }

  clearAll(): void {
    this.cache.clear();
  }
}
```

### 7.3 Playback Engine Implementation

```typescript
interface TrackNode {
  gainNode: GainNode;
  panNode: StereoPannerNode;
  sample: AudioBuffer | null;
  muted: boolean;
  soloed: boolean;
}

class PlaybackEngine {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private tracks = new Map<string, TrackNode>();
  private scheduledSources: AudioBufferSourceNode[] = [];

  private isPlaying = false;
  private loopStartTime = 0;
  private loopDurationSec = 0;

  // Lookahead scheduling parameters
  private readonly scheduleAheadSec = 0.1;    // 100ms lookahead
  private readonly schedulerIntervalMs = 25;   // 25ms check interval
  private schedulerTimer: number | null = null;

  private sortedHits: QuantizedHit[] = [];
  private nextScheduleTime = 0;
  private currentLoopIteration = 0;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.masterGain = audioContext.createGain();
    this.masterGain.connect(audioContext.destination);
  }

  createTrack(
    clusterId: string,
    volume: number,
    pan: number,
    sample: AudioBuffer | null
  ): void {
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;

    const panNode = this.audioContext.createStereoPanner();
    panNode.pan.value = pan;

    panNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    this.tracks.set(clusterId, {
      gainNode,
      panNode,
      sample,
      muted: false,
      soloed: false,
    });
  }

  play(hits: QuantizedHit[], loopDurationSec: number): void {
    this.stop();

    this.sortedHits = [...hits].sort((a, b) => a.time - b.time);
    this.loopDurationSec = loopDurationSec;
    this.isPlaying = true;

    // 50ms head start so first notes are pre-scheduled
    this.loopStartTime = this.audioContext.currentTime + 0.05;
    this.currentLoopIteration = 0;
    this.nextScheduleTime = this.loopStartTime;

    this.schedulerTimer = window.setInterval(
      () => this.schedulerTick(),
      this.schedulerIntervalMs
    );
  }

  private schedulerTick(): void {
    if (!this.isPlaying) return;

    const currentTime = this.audioContext.currentTime;
    const scheduleUntil = currentTime + this.scheduleAheadSec;

    // Check if any tracks are soloed
    const hasSolo = Array.from(this.tracks.values()).some(t => t.soloed);

    while (this.nextScheduleTime < scheduleUntil) {
      // Determine which hit to schedule next
      const loopTime = this.nextScheduleTime - this.loopStartTime;
      const loopPosition = loopTime % this.loopDurationSec;

      // Find all hits at or near this loop position
      for (const hit of this.sortedHits) {
        const hitAbsTime =
          this.loopStartTime +
          this.currentLoopIteration * this.loopDurationSec +
          hit.time;

        if (hitAbsTime < currentTime) continue;
        if (hitAbsTime > scheduleUntil) break;

        const track = this.tracks.get(hit.clusterId);
        if (!track || !track.sample) continue;

        // Mute/solo logic
        if (hasSolo && !track.soloed) continue;
        if (track.muted) continue;

        this.scheduleNote(track, hitAbsTime, hit.velocity);
      }

      // Advance to next loop iteration
      this.currentLoopIteration++;
      this.nextScheduleTime =
        this.loopStartTime +
        this.currentLoopIteration * this.loopDurationSec;
    }
  }

  private scheduleNote(
    track: TrackNode,
    when: number,
    velocity: number
  ): void {
    const source = this.audioContext.createBufferSource();
    source.buffer = track.sample;

    // Velocity -> gain: quadratic curve for natural feel
    const velocityGain = this.audioContext.createGain();
    velocityGain.gain.value = velocity * velocity;

    source.connect(velocityGain);
    velocityGain.connect(track.panNode);

    source.start(when);
    this.scheduledSources.push(source);

    // Auto-cleanup after sample finishes
    source.onended = () => {
      const idx = this.scheduledSources.indexOf(source);
      if (idx !== -1) this.scheduledSources.splice(idx, 1);
    };
  }

  stop(): void {
    this.isPlaying = false;
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    for (const source of this.scheduledSources) {
      try { source.stop(); } catch { /* already stopped */ }
    }
    this.scheduledSources = [];
  }

  setTrackVolume(clusterId: string, volume: number): void {
    const track = this.tracks.get(clusterId);
    if (track) {
      track.gainNode.gain.setTargetAtTime(
        volume, this.audioContext.currentTime, 0.01
      );
    }
  }

  setTrackPan(clusterId: string, pan: number): void {
    const track = this.tracks.get(clusterId);
    if (track) {
      track.panNode.pan.setTargetAtTime(
        pan, this.audioContext.currentTime, 0.01
      );
    }
  }

  setTrackMuted(clusterId: string, muted: boolean): void {
    const track = this.tracks.get(clusterId);
    if (track) track.muted = muted;
  }

  setTrackSoloed(clusterId: string, soloed: boolean): void {
    const track = this.tracks.get(clusterId);
    if (track) track.soloed = soloed;
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.setTargetAtTime(
      volume, this.audioContext.currentTime, 0.01
    );
  }

  // Returns current playback position within the loop (0 to loopDurationSec)
  getCurrentPosition(): number {
    if (!this.isPlaying) return 0;
    const elapsed = this.audioContext.currentTime - this.loopStartTime;
    return elapsed % this.loopDurationSec;
  }
}
```

### 7.4 Seamless Looping

Seamless looping is achieved by the lookahead scheduler pattern. Because notes are scheduled ahead in `AudioContext` time (a monotonically increasing hardware clock), there are no gaps or timing drift at loop boundaries. The scheduler continuously calculates absolute times for upcoming notes regardless of loop iteration count.

### 7.5 Latency Compensation

Web Audio API `AudioContext.currentTime` accounts for output latency internally. However, the initial play action has a perceived latency from user click to first audible sound:

- `AudioContext` resume latency (if suspended): ~50ms
- Scheduler lookahead: up to ~100ms
- Audio output buffer: ~5-20ms (depending on `latencyHint`)

**Strategy**: Resume the AudioContext on the very first user interaction (the "Start Recording" tap), not on play. This eliminates the resume latency from the playback path. The 50ms head start in `play()` ensures the first note is scheduled before the scheduler's first tick fires.

### 7.6 Output Routing

V1 outputs to `AudioDestinationNode` (system default output). The architecture supports future extension to:
- `MediaStreamDestinationNode` for recording the mix output
- `OfflineAudioContext` for bounce-to-file export (WAV rendering)

---

## 8. Data Models

### 8.1 Core Entity Definitions

```typescript
// ===================== SESSION =====================
interface Session {
  id: string;                          // UUID v4
  name: string;                        // User-assigned or auto-generated
  createdAt: number;                   // Unix timestamp ms
  updatedAt: number;                   // Unix timestamp ms
  sampleRate: number;                  // AudioContext sample rate used
  durationMs: number;                  // Total recording duration

  // Audio data (stored separately in IndexedDB audioBlobs store)
  rawAudioBufferId: string | null;     // Reference to raw recording blob

  // Derived data
  hits: Hit[];
  clusters: Cluster[];
  tracks: Track[];

  // Configuration
  quantization: QuantizationConfig;
  masterVolume: number;                // 0.0 - 1.0
  isLooping: boolean;

  // Feature normalization params (needed for consistent re-clustering)
  featureMeans: Float64Array | null;   // 13-D
  featureStdDevs: Float64Array | null; // 13-D

  // Undo/redo
  undoStack: SessionSnapshot[];
  redoStack: SessionSnapshot[];
}

// ===================== HIT =====================
interface Hit {
  id: string;                          // UUID v4
  sessionId: string;

  // Timing
  timestamp: number;                   // Original onset time (seconds from rec start)
  quantizedTime: number;               // Snapped time (seconds)
  gridIndex: number;                   // Position on quantization grid

  // Audio (snippet stored separately in IndexedDB)
  audioSnippetId: string;              // Reference to audio blob
  snippetDurationMs: number;           // ~210ms
  snippetPreOnsetMs: number;           // 10ms pre-onset padding

  // Features
  features: HitFeatures;
  featureVector: Float64Array;         // Normalized 13-D vector

  // Classification
  clusterId: string;                   // Assigned cluster
  isUserOverridden: boolean;           // User manually reassigned
  isOutlier: boolean;                  // Flagged as potential outlier

  // Dynamics
  velocity: number;                    // 0.0 - 1.0
  onsetStrength: number;               // Raw spectral flux ratio
}

// ===================== HIT FEATURES =====================
interface HitFeatures {
  spectralCentroid: number;            // Hz
  spectralRolloff: number;             // Hz
  zeroCrossingRate: number;            // 0.0 - 1.0
  rmsEnergy: number;                   // 0.0 - 1.0
  attackTimeMs: number;                // ms
  decayTimeMs: number;                 // ms
  mfcc: number[];                      // 7 coefficients
}

// ===================== CLUSTER =====================
interface Cluster {
  id: string;                          // UUID v4
  sessionId: string;
  label: string;                       // "Sound A", "Kick", etc.
  color: string;                       // Hex color for UI

  // Statistics
  centroid: Float64Array;              // Mean feature vector (13-D)
  hitCount: number;
  radius: number;                      // Mean distance from centroid

  // Instrument mapping
  instrumentMapping: InstrumentMapping | null;
}

// ===================== INSTRUMENT MAPPING =====================
interface InstrumentMapping {
  clusterId: string;
  sampleId: string;                    // -> SampleDefinition.id
  sampleName: string;                  // Denormalized for display
  volume: number;                      // Per-mapping volume (0.0 - 1.0)
  pitchShift: number;                  // Semitones (-12 to +12); v1: always 0
}

// ===================== TRACK =====================
interface Track {
  id: string;                          // UUID v4
  sessionId: string;
  clusterId: string;                   // One track per cluster

  // Mixer
  volume: number;                      // 0.0 - 1.0
  pan: number;                         // -1.0 (L) to 1.0 (R)
  muted: boolean;
  soloed: boolean;
}

// ===================== QUANTIZATION CONFIG =====================
interface QuantizationConfig {
  bpm: number;                         // User-set or detected
  bpmDetected: number;                 // Auto-detected (preserved)
  gridSubdivision: 1 | 2 | 3 | 4 | 6;
  quantizeStrength: number;            // 0.0 - 1.0
  swingAmount: number;                 // 0.0 - 0.7
  loopLengthBeats: number;             // 4.0 for 4/4, 3.5 for 7/8, etc.
  humanizeTimingMs: number;            // 0 - 20
  humanizeVelocity: number;            // 0.0 - 0.15
}

// ===================== SESSION SNAPSHOT =====================
interface SessionSnapshot {
  timestamp: number;                   // When snapshot was taken
  description: string;                 // "Reassign hit to Cluster B"
  hits: Hit[];                         // Deep copy of hits metadata
  clusters: Cluster[];
  tracks: Track[];
  quantization: QuantizationConfig;
  // NOTE: audio snippets are NOT copied (immutable after creation)
}
```

### 8.2 Entity Relationships

```
Session (1) --------< (M) Hit
Session (1) --------< (M) Cluster
Session (1) --------< (M) Track
Session (1) --------> (1) QuantizationConfig (embedded)

Hit     (M) >------- (1) Cluster        [many hits per cluster]
Cluster (1) --------> (0..1) InstrumentMapping (embedded)
Cluster (1) <------> (1) Track          [one track per cluster]

Session (1) --------< (M) SessionSnapshot [undo/redo stack]
```

### 8.3 Entity Lifecycle

```
RECORDING PHASE:
  Session CREATED with empty hits/clusters/tracks
  Hits CREATED incrementally as onsets are detected
  Hit.audioSnippetId points to blob stored in IndexedDB immediately

POST-RECORDING ANALYSIS:
  Hit.features COMPUTED (batch, all hits)
  Hit.featureVector NORMALIZED (using session-level means/stdDevs)
  Session.featureMeans / featureStdDevs STORED
  Clusters CREATED (k-means result)
  Hit.clusterId ASSIGNED
  Tracks CREATED (one per cluster)

USER MAPPING:
  Cluster.instrumentMapping ASSIGNED by user selecting samples

QUANTIZATION:
  QuantizationConfig POPULATED (auto BPM + user adjustments)
  Hit.quantizedTime and Hit.gridIndex COMPUTED

PLAYBACK:
  All entities STABLE (read-only during playback)
  Track volume/pan/mute/solo ADJUSTABLE in real-time

EDITING:
  SessionSnapshot CREATED before each destructive edit
  Hits: DELETE, REASSIGN cluster, manual ADD
  Clusters: MERGE, SPLIT, DELETE, RENAME
  Quantization: any parameter change
```

---

## 9. State Management

### 9.1 Application State Machine

```
                    +------------+
                    |   EMPTY    |  No session loaded
                    +-----+------+
                          |
                    [new / load session]
                          |
                          v
                    +-----+------+
            +------>|   READY    |  Session loaded, not recording
            |       +-----+------+
            |             |
            |       [start recording]
            |             |
            |             v
            |       +-----+------+
            |       | RECORDING  |  Mic active, onsets detected in real-time
            |       +-----+------+
            |             |
            |       [stop recording]
            |             |
            |             v
            |       +-----+------+
            |       | ANALYZING  |  Feature extraction + clustering
            |       +-----+------+  (typically < 2 seconds)
            |             |
            |       [analysis complete]
            |             |
            |             v
            |       +-----+------+
            |       |  MAPPING   |  Assign instruments to clusters
            |       +-----+------+
            |             |
            |       [done mapping / skip]
            |             |
            |             v
            |       +-----+------+
            +-------|  EDITING   |  Timeline, quantization, playback
                    +-----+------+
                          |
                    [close / new session]
                          |
                          v
                    +-----+------+
                    |   EMPTY    |
                    +------------+
```

### 9.2 Zustand Store Design

```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

type AppPhase =
  | 'empty'
  | 'ready'
  | 'recording'
  | 'analyzing'
  | 'mapping'
  | 'editing';

interface UIState {
  selectedHitIds: Set<string>;
  selectedClusterId: string | null;
  timelineZoom: number;            // pixels per second
  timelineScroll: number;          // scroll offset (seconds)
  playbackPosition: number;        // current position in loop (seconds)
  isPlaying: boolean;
  sensitivitySlider: number;       // 0-100, maps to THRESHOLD_MULTIPLIER
  showAdvancedSettings: boolean;
}

interface AppState {
  phase: AppPhase;
  session: Session | null;
  ui: UIState;
  sampleLibrary: SampleLibrary | null;

  // Non-serializable (runtime only, not persisted)
  _audioContext: AudioContext | null;
  _playbackEngine: PlaybackEngine | null;
  _captureHandle: AudioPipelineHandle | null;
}

interface AppActions {
  // Session lifecycle
  createSession: () => Promise<void>;
  loadSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  listSessions: () => Promise<SessionSummary[]>;

  // Recording
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;

  // Analysis (feature extraction + clustering)
  runAnalysis: () => Promise<void>;

  // Mapping
  assignInstrument: (clusterId: string, sampleId: string) => void;
  clearInstrument: (clusterId: string) => void;

  // Editing (all push undo snapshot first)
  deleteHits: (hitIds: string[]) => void;
  reassignHit: (hitId: string, newClusterId: string) => void;
  addManualHit: (timestamp: number, clusterId: string) => void;
  mergeClusters: (clusterIds: string[]) => void;
  splitCluster: (clusterId: string, hitGroupA: string[], hitGroupB: string[]) => void;
  renameCluster: (clusterId: string, name: string) => void;

  // Quantization
  updateQuantization: (partial: Partial<QuantizationConfig>) => void;
  reQuantize: () => void;

  // Mixer
  setTrackVolume: (clusterId: string, volume: number) => void;
  setTrackPan: (clusterId: string, pan: number) => void;
  setTrackMuted: (clusterId: string, muted: boolean) => void;
  setTrackSoloed: (clusterId: string, soloed: boolean) => void;
  setMasterVolume: (volume: number) => void;

  // Playback
  play: () => void;
  stop: () => void;
  togglePlayback: () => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;

  // Persistence
  saveSession: () => Promise<void>;
  autoSave: () => Promise<void>;  // Debounced, called on edits

  // UI
  setSelectedHits: (ids: Set<string>) => void;
  setTimelineZoom: (zoom: number) => void;
  setTimelineScroll: (scroll: number) => void;
}

const useAppStore = create<AppState & AppActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    phase: 'empty',
    session: null,
    ui: {
      selectedHitIds: new Set(),
      selectedClusterId: null,
      timelineZoom: 100,
      timelineScroll: 0,
      playbackPosition: 0,
      isPlaying: false,
      sensitivitySlider: 50,
      showAdvancedSettings: false,
    },
    sampleLibrary: null,
    _audioContext: null,
    _playbackEngine: null,
    _captureHandle: null,

    // ... action implementations ...
  }))
);
```

### 9.3 Undo/Redo Architecture

Undo/redo operates on a snapshot model. Before each destructive action, a snapshot of the current session state (hits, clusters, tracks, quantization config) is pushed onto the undo stack.

```typescript
const MAX_UNDO_DEPTH = 50;

function pushUndoSnapshot(session: Session, description: string): void {
  const snapshot: SessionSnapshot = {
    timestamp: Date.now(),
    description,
    hits: structuredClone(session.hits),
    clusters: structuredClone(session.clusters),
    tracks: structuredClone(session.tracks),
    quantization: structuredClone(session.quantization),
  };

  session.undoStack.push(snapshot);
  session.redoStack = [];  // New action clears redo

  if (session.undoStack.length > MAX_UNDO_DEPTH) {
    session.undoStack.shift();
  }
}

function performUndo(session: Session): boolean {
  if (session.undoStack.length === 0) return false;

  // Push current to redo
  session.redoStack.push({
    timestamp: Date.now(),
    description: 'redo point',
    hits: structuredClone(session.hits),
    clusters: structuredClone(session.clusters),
    tracks: structuredClone(session.tracks),
    quantization: structuredClone(session.quantization),
  });

  // Restore from undo
  const snapshot = session.undoStack.pop()!;
  session.hits = snapshot.hits;
  session.clusters = snapshot.clusters;
  session.tracks = snapshot.tracks;
  session.quantization = snapshot.quantization;
  return true;
}

function performRedo(session: Session): boolean {
  if (session.redoStack.length === 0) return false;

  session.undoStack.push({
    timestamp: Date.now(),
    description: 'undo point',
    hits: structuredClone(session.hits),
    clusters: structuredClone(session.clusters),
    tracks: structuredClone(session.tracks),
    quantization: structuredClone(session.quantization),
  });

  const snapshot = session.redoStack.pop()!;
  session.hits = snapshot.hits;
  session.clusters = snapshot.clusters;
  session.tracks = snapshot.tracks;
  session.quantization = snapshot.quantization;
  return true;
}
```

**Memory efficiency**: Audio snippets (`Float32Array` blobs) are stored by reference ID and are immutable after creation. Undo snapshots only copy metadata and assignments (~1-5 KB each), not audio data. 50 snapshots costs ~50-250 KB.

### 9.4 Session Persistence (IndexedDB)

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TapBeatsDB extends DBSchema {
  sessions: {
    key: string;
    value: SerializedSession;
    indexes: {
      'by-updated': number;
    };
  };
  audioBlobs: {
    key: string;               // "${sessionId}:${type}:${subId}"
    value: {
      sessionId: string;
      type: 'raw' | 'snippet';
      subId: string;           // hit ID for snippets
      data: ArrayBuffer;
      sampleRate: number;
    };
    indexes: {
      'by-session': string;
    };
  };
  sampleCache: {
    key: string;               // sample URL
    value: {
      url: string;
      data: ArrayBuffer;
      cachedAt: number;
    };
  };
}

const DB_NAME = 'tapbeats';
const DB_VERSION = 1;

async function initDB(): Promise<IDBPDatabase<TapBeatsDB>> {
  return openDB<TapBeatsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Sessions store
      const sessions = db.createObjectStore('sessions', {
        keyPath: 'id',
      });
      sessions.createIndex('by-updated', 'updatedAt');

      // Audio blobs store (large binary data separated from metadata)
      const blobs = db.createObjectStore('audioBlobs', {
        keyPath: 'key',
      });
      blobs.createIndex('by-session', 'sessionId');

      // Sample cache (optional offline support)
      db.createObjectStore('sampleCache', { keyPath: 'url' });
    },
  });
}
```

**Serialization strategy**: Before persisting a `Session`:

1. Strip non-serializable fields (`_audioContext`, `_playbackEngine`, etc.).
2. Extract `Float32Array` / `Float64Array` fields from each hit and store as separate `audioBlobs` entries.
3. Store session metadata, hit metadata, clusters, tracks, and config in the `sessions` store.
4. On load, rehydrate by joining session metadata with audio blobs.

This separation avoids loading megabytes of audio data when listing sessions or loading only metadata.

**Auto-save**: A debounced save fires 2 seconds after the last edit action. This ensures work is not lost without excessive write IO.

---

## 10. Performance Requirements

### 10.1 Latency Targets

| Operation | Target | Rationale |
|---|---|---|
| Onset detection | < 30 ms from physical tap to hit event | Must feel instantaneous during recording |
| Feature extraction (per hit) | < 10 ms | 100 hits should complete in < 1s post-recording |
| Clustering (full run) | < 500 ms for 200 hits | Must feel interactive |
| Quantization computation | < 50 ms for 200 hits | Near-instant when adjusting BPM/grid |
| Playback start | < 100 ms from button press to first sound | Standard audio UX expectation |
| UI frame rendering | < 16.67 ms (60 fps) | Smooth timeline scrubbing and dragging |

### 10.2 Memory Budget

| Resource | Budget | Calculation |
|---|---|---|
| Ring buffer (recording) | ~1.7 MB | 10s * 44100 Hz * 4 bytes |
| Hit snippets (100 hits) | ~3.7 MB | 100 * 9261 samples * 4 bytes |
| Hit snippets (500 hits) | ~18.5 MB | 500 * 9261 samples * 4 bytes |
| Feature vectors (500 hits) | ~52 KB | 500 * 13 dims * 8 bytes |
| Decoded sample library | ~5-20 MB | Depends on loaded sample count |
| Undo stack (50 snapshots) | ~0.25 MB | 50 * ~5 KB metadata (no audio) |
| **Total working set** | **< 50 MB** | Comfortable for any modern device |

### 10.3 Storage Budget (IndexedDB)

| Data | Size per Session | Management |
|---|---|---|
| Session metadata | ~5 KB | No limit |
| Hit snippets | ~3.7 MB (100 hits) | Warn at > 500 hits |
| Raw recording blob | ~1.7 MB (10s) | Optional; user can discard |
| Sample cache | ~5-20 MB shared | LRU eviction at 50 MB |
| **Per session total** | **~5-20 MB** | Warn at > 100 MB across all sessions |

### 10.4 Browser Compatibility Matrix

| Browser | Min Version | AudioWorklet | MediaDevices | IndexedDB | Notes |
|---|---|---|---|---|---|
| **Chrome** | 66+ | Yes | Yes | Yes | Primary target; full support |
| **Firefox** | 76+ | Yes | Yes | Yes | Full support |
| **Safari** | 14.1+ | Yes | Yes | Yes | Requires user gesture for AudioContext; no OGG (use MP3) |
| **Edge** | 79+ | Yes | Yes | Yes | Chromium-based; same as Chrome |
| **iOS Safari** | 14.5+ | Yes | Yes | Yes | No background audio; WebKit audio restrictions |
| **Chrome Android** | 66+ | Yes | Yes | Yes | Potentially higher audio latency |
| **Not supported** | IE (any), Safari < 14.1, pre-Chromium Edge | | | | |

### 10.5 Canvas Timeline Rendering Budget

```
Target: 60 fps = 16.67 ms per frame

Per-frame cost estimate:
  State read + transform:          < 0.5 ms
  Canvas clear:                    < 0.3 ms
  Grid lines + beat markers:       < 1.0 ms
  Hit markers (500 hits):          < 3.0 ms  (batch draw by cluster)
  Playback cursor + position:      < 0.3 ms
  Waveform overview (precomputed): < 2.0 ms
  Selection highlights:            < 0.5 ms
  Cluster color legends:           < 0.4 ms
  --------------------------------
  Total:                           ~8.0 ms
  Headroom:                        ~8.7 ms  (52% budget remaining)
```

Canvas 2D is chosen over DOM rendering for the timeline because rendering 500+ hit markers with real-time playback cursor updates in DOM would far exceed the 16ms budget.

---

## 11. Technology Stack Recommendation

### 11.1 Core Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| **Language** | TypeScript | 5.4+ | Type safety for complex audio data structures; IDE support |
| **Framework** | React | 18+ | Component model; concurrent features; ecosystem |
| **Build** | Vite | 5+ | Fast HMR; ESM native; AudioWorklet bundling via plugin |
| **State** | Zustand | 4+ | Minimal boilerplate; TypeScript; no providers; persistence middleware |
| **Audio** | Web Audio API + AudioWorklet | Native | Low-latency capture + playback; real-time processing thread |
| **Storage** | IndexedDB via `idb` | 8+ | Binary blob support; Promise API; structured storage |
| **Timeline** | HTML5 Canvas 2D | Native | 60fps rendering of hit markers and playback cursor |
| **Testing** | Vitest | 1+ | Vite-native; fast; Web Audio mockable |
| **Linting** | ESLint + Prettier | Latest | Consistency |
| **Styling** | CSS Modules | Native | Scoped; no runtime cost; simple for v1 |

### 11.2 Project Structure

```
tapbeats/
  src/
    main.tsx
    App.tsx

    audio/
      capture/
        microphone.ts                 # MediaStream acquisition
        tap-processor.worklet.ts      # AudioWorklet (onset detection)
        ring-buffer.ts                # Ring buffer utility
      analysis/
        feature-extractor.ts          # Per-hit feature computation
        fft.ts                        # Radix-2 FFT (pure JS)
        mfcc.ts                       # MFCC computation
        spectral.ts                   # Centroid, rolloff, ZCR
        envelope.ts                   # Attack/decay time
      clustering/
        kmeans.ts                     # k-means with k-means++ init
        silhouette.ts                 # Silhouette score
        auto-k.ts                     # Automatic k selection
        reclustering.ts               # Semi-supervised re-clustering
      quantization/
        bpm-detector.ts               # BPM from IOI histogram
        quantizer.ts                  # Grid snap
        swing.ts                      # Swing offset
        humanize.ts                   # Timing/velocity variance
      playback/
        playback-engine.ts            # Lookahead sample scheduling
        sample-loader.ts              # Fetch, decode, cache
      utils/
        wav-encoder.ts                # WAV export
        audio-math.ts                 # Shared DSP utilities

    state/
      store.ts                        # Zustand store
      actions/
        session-actions.ts
        recording-actions.ts
        analysis-actions.ts
        editing-actions.ts
        playback-actions.ts
        undo-actions.ts
      persistence/
        db.ts                         # IndexedDB schema
        serialization.ts              # Session (de)serialization

    components/
      layout/
        AppShell.tsx
        Header.tsx
      recording/
        RecordingView.tsx
        SensitivityControl.tsx
        LiveWaveform.tsx
        HitCounter.tsx
      mapping/
        MappingView.tsx
        ClusterCard.tsx
        SamplePicker.tsx
      editing/
        EditingView.tsx
        Timeline.tsx                  # React wrapper
        TimelineCanvas.ts             # Canvas 2D rendering logic
        MixerPanel.tsx
        QuantizationPanel.tsx
        TransportBar.tsx
      shared/
        Button.tsx
        Slider.tsx
        Modal.tsx
        Icons.tsx

    samples/
      drums/
        kick_acoustic_01.ogg
        kick_acoustic_01.mp3
        snare_acoustic_01.ogg
        snare_acoustic_01.mp3
        hihat_closed_01.ogg
        hihat_closed_01.mp3
        ...
      percussion/
        ...
      manifest.json                   # Sample library definition

    types/
      audio.ts
      session.ts
      ui.ts

    utils/
      uuid.ts
      math.ts
      color.ts

  public/
    index.html
    favicon.ico

  tests/
    audio/
      fft.test.ts
      feature-extractor.test.ts
      kmeans.test.ts
      silhouette.test.ts
      bpm-detector.test.ts
      quantizer.test.ts
      onset-detection.test.ts
    state/
      store.test.ts
      persistence.test.ts
      undo.test.ts
    components/
      RecordingView.test.tsx
      Timeline.test.tsx
    fixtures/
      synthetic-signals.ts           # Sine waves, noise bursts, etc.

  vite.config.ts
  tsconfig.json
  package.json
  .eslintrc.cjs
  .prettierrc
```

### 11.3 AudioWorklet Bundling with Vite

AudioWorklet modules run in a separate global scope and must be loaded as standalone files.

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
  },
});
```

```typescript
// Loading the worklet in application code:
const workletUrl = new URL(
  './capture/tap-processor.worklet.ts',
  import.meta.url
);
await audioContext.audioWorklet.addModule(workletUrl.href);
```

### 11.4 Testing Strategy

**Unit tests** (Vitest):
- All pure computation: FFT, feature extraction, k-means, silhouette, BPM detection, quantization, swing, humanization.
- These modules accept typed arrays and return typed arrays with zero browser API dependencies.
- Use synthetic test signals (sine waves at known frequencies for FFT/centroid, noise bursts with known timing for onset detection).

**Web Audio API mocking**:

```typescript
// tests/mocks/web-audio.ts
class MockAudioContext {
  sampleRate = 44100;
  currentTime = 0;
  state: AudioContextState = 'running';
  destination = {} as AudioDestinationNode;

  createGain(): MockGainNode { return new MockGainNode(); }
  createBufferSource(): MockBufferSourceNode { return new MockBufferSourceNode(); }
  createStereoPanner(): MockStereoPannerNode { return new MockStereoPannerNode(); }
  decodeAudioData(buf: ArrayBuffer): Promise<AudioBuffer> { /* ... */ }
}

// Apply globally in test setup:
// vi.stubGlobal('AudioContext', MockAudioContext);
```

**Integration tests**:
- Full session lifecycle with synthetic data injected directly into the pipeline (bypass microphone).
- Save to IndexedDB, reload, verify data integrity.
- Undo/redo sequences.

**Manual test protocol** (documented checklist, not automated):
- Real microphone on desk, book, lap, table.
- Various BPMs and subdivision patterns.
- Safari, Chrome, Firefox on desktop and mobile.

---

## 12. Security and Privacy

### 12.1 Microphone Permissions Model

The microphone is requested **only** when the user explicitly taps "Start Recording". The lifecycle:

1. **Request**: `navigator.mediaDevices.getUserMedia()` called on record button press.
2. **Active**: `MediaStream` connected to audio graph during recording.
3. **Release**: On stop, `stream.getTracks().forEach(t => t.stop())` is called. Browser microphone indicator turns off.
4. **Re-request**: Next recording re-acquires. If persistent permission was granted, no prompt appears.

The application never requests microphone access at launch, on page load, or proactively.

### 12.2 Data Locality Guarantee

All processing is local. Specifically:

- Zero network requests for audio processing, analysis, clustering, or playback.
- Zero audio data transmitted to any server, ever.
- Zero telemetry, analytics, or crash reporting in v1.
- Application functions fully offline after initial page load.
- Sample library bundled with application assets, not fetched from external CDN.

The **only** network requests are the initial page load (HTML, JS, CSS, bundled sample files) and optional PWA update checks.

### 12.3 Storage Security

- All data in browser's IndexedDB (origin-scoped, inaccessible to other origins).
- No cookies set.
- No `localStorage` used for audio or sensitive data.
- Audio stored as raw PCM, not encrypted at rest. Threat model assumes user's device is trusted. Encrypting local audio adds complexity without meaningful benefit for a client-only app.

### 12.4 Content Security Policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  media-src 'self' blob:;
  worker-src 'self' blob:;
  connect-src 'self';
  img-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'none';
```

| Directive | Rationale |
|---|---|
| `script-src 'self' 'wasm-unsafe-eval'` | Bundled scripts + potential future WASM FFT. No inline scripts. |
| `worker-src 'self' blob:` | Required for AudioWorklet module loading (some browsers use blob URLs). |
| `media-src 'self' blob:` | Required for audio playback from blob URLs and bundled samples. |
| `connect-src 'self'` | No external API calls permitted. |
| `object-src 'none'` | No plugins, no Flash, no embeds. |

### 12.5 Dependency Minimization

Third-party runtime dependencies are minimized to reduce supply chain attack surface:

| Dependency | Purpose | Risk Profile |
|---|---|---|
| **React** | UI framework | Large community; heavily audited |
| **Zustand** | State management | ~1KB; minimal dependency tree |
| **idb** | IndexedDB wrapper | Thin Promise wrapper; well-audited |

All DSP code (FFT, MFCC, onset detection, clustering) is implemented in-house. No third-party audio processing libraries. This maintains full control and auditability of the signal processing pipeline.

Dev-only dependencies (Vite, ESLint, Vitest, Prettier) are not shipped in the production bundle.

---

## 13. Future Architecture Considerations

These features are out of scope for v1. The architecture is designed so that none of these require fundamental rewrites.

### 13.1 MIDI Export

**Concept**: Export quantized beat as Standard MIDI File (.mid).

**Architecture readiness**: The `Hit` model already stores `quantizedTime`, `gridIndex`, and `velocity`, which map directly to MIDI note-on events. Each `Cluster` maps to a GM Drum Map note number (kick=36, snare=38, hi-hat=42, etc.).

**Implementation**: Pure function `exportToMIDI(hits, clusters, quantization) -> Blob`. No architectural changes to existing code required.

### 13.2 Collaboration via WebRTC

**Concept**: Two users build a beat together in real-time, hearing each other's taps.

**Architecture readiness**:
- `Hit` entities use UUIDs (safe for distributed creation, no collisions).
- `PlaybackEngine` accepts a hit sequence as input with no single-writer assumption.
- Zustand store uses immutable state updates, compatible with future CRDT sync.

**Required additions**: WebRTC DataChannel transport layer; CRDT or OT conflict resolution for concurrent edits; presence/cursor awareness UI.

### 13.3 Server-Side ML Classification

**Concept**: Upload hit audio to a server for neural network classification, replacing or augmenting on-device k-means.

**Architecture readiness**: Feature extraction and clustering are separate pipeline stages. The clustering interface should be abstracted:

```typescript
interface ClusteringStrategy {
  cluster(hits: Hit[]): Promise<ClusterResult>;
}

// v1: on-device
class LocalKMeansStrategy implements ClusteringStrategy { /* ... */ }

// future: server-assisted
class ServerMLStrategy implements ClusteringStrategy { /* ... */ }
```

A server response mapping `hitId -> clusterId` integrates identically to the k-means output. No changes to downstream quantization or playback.

### 13.4 Native App Wrappers (Capacitor / Tauri)

**Concept**: Package TapBeats as installable mobile or desktop app.

**Architecture readiness**:
- All code uses standard Web APIs (Web Audio, MediaDevices, IndexedDB).
- No Node.js or server dependencies.
- Both Capacitor (WebView) and Tauri (WebView) support these APIs.

**Known risks to monitor**:
- iOS WebView AudioContext requires user gesture (Capacitor has plugins).
- Audio latency may differ in WebView vs. native browser.
- Test in WebKit and Chromium WebViews explicitly.

### 13.5 Plugin System for Custom Instruments

**Concept**: Users or third parties add sample packs or synthesis engines.

**Architecture readiness**: The `SampleLibrary` loads from a `manifest.json`. Plugins provide additional manifests. Sample IDs are namespaced to avoid collisions.

For synthesis plugins (generating sound instead of playing samples), abstract the sound source:

```typescript
interface SoundSource {
  trigger(when: number, velocity: number, audioContext: AudioContext): AudioNode;
}

// v1
class SampleSoundSource implements SoundSource {
  constructor(private buffer: AudioBuffer) {}
  trigger(when: number, velocity: number, ctx: AudioContext): AudioNode {
    const source = ctx.createBufferSource();
    source.buffer = this.buffer;
    source.start(when);
    return source;
  }
}

// future
class SynthSoundSource implements SoundSource {
  trigger(when: number, velocity: number, ctx: AudioContext): AudioNode {
    // Web Audio oscillators, filters, envelopes
    // ...
  }
}
```

**v1 recommendation**: Implement the `SoundSource` interface now (low cost) to avoid refactoring the playback engine later.

---

## Appendix A: In-Worklet FFT Implementation Note

The AudioWorklet thread does not have access to `AnalyserNode`. A pure-JavaScript radix-2 Cooley-Tukey FFT is implemented within the worklet (see Section 3.3.3 for the full implementation).

**Performance characteristics for 2048-point real FFT**:

| Engine | Approximate Time per Transform |
|---|---|
| Chrome V8 | ~0.1 ms |
| Firefox SpiderMonkey | ~0.15 ms |
| Safari JavaScriptCore | ~0.12 ms |

At a hop rate of ~43 transforms/second (1024-sample hop at 44.1 kHz), FFT consumes < 1% of a single core. If profiling reveals a bottleneck, a WASM FFT (compiled from C or Rust) can be loaded via `WebAssembly.instantiate()` inside the worklet.

## Appendix B: Cluster Color Generation

Clusters are assigned visually distinct colors using evenly-spaced hues:

```typescript
function generateClusterColors(k: number): string[] {
  const colors: string[] = [];
  const saturation = 70;
  const lightness = 55;
  const hueOffset = 220; // Start from blue, perceptually distinct from red UI elements

  for (let i = 0; i < k; i++) {
    const hue = (hueOffset + (i * 360) / k) % 360;
    colors.push(`hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`);
  }

  return colors;
}
```

For k <= 8 (the maximum), this produces easily distinguishable colors. Colors are reassigned after merge/split operations to maintain visual distinction.

## Appendix C: Glossary

| Term | Definition |
|---|---|
| **Onset** | The beginning of a musical event (tap/hit); the moment energy appears |
| **Spectral Flux** | Frame-to-frame change in spectral magnitude; high values indicate onsets |
| **MFCC** | Mel-Frequency Cepstral Coefficients; compact representation of spectral shape |
| **Quantization** | Snapping event times to a regular musical grid |
| **Silhouette Score** | Measure of cluster quality; -1 (poor) to +1 (excellent) |
| **Ring Buffer** | Circular fixed-size buffer overwriting oldest data when full |
| **AudioWorklet** | Web Audio API mechanism for custom audio processing on a dedicated real-time thread |
| **Render Quantum** | Fixed 128-sample block processed per AudioWorklet callback invocation |
| **IOI** | Inter-Onset Interval; time between consecutive detected onsets |
| **Hop Size** | Samples between consecutive analysis frames; controls overlap |
| **BPM** | Beats Per Minute; tempo measurement |
| **Grid Subdivision** | Division of one beat into equal parts (2=eighth, 4=sixteenth) |
| **k-means++** | Initialization strategy for k-means that spreads initial centroids apart |
| **Z-score** | Normalization: (value - mean) / standard_deviation |
| **Lookahead Scheduling** | Technique of scheduling audio events ahead of real-time to absorb main thread jank |
| **Transferable** | Web API mechanism to transfer ArrayBuffer ownership between threads without copying |
