// @ts-nocheck
/* eslint-disable no-undef */

/**
 * TapProcessorWorklet
 * Real-time onset detection via spectral flux with adaptive thresholding.
 * Posts onset events with audio snippets to the main thread.
 */
class TapProcessorWorklet extends AudioWorkletProcessor {
  constructor() {
    super();

    var self = this;
    var i, j, bits, reversed, val, angle;

    // FFT / analysis constants
    self._fftSize = 1024;
    self._hopSize = 256;
    self._magnitudeBins = 513; // fftSize/2 + 1
    self._sampleRate = 44100;

    // Pre-allocated analysis buffers
    self._frameBuffer = new Float32Array(1024);
    self._windowedFrame = new Float32Array(1024);
    self._fftReal = new Float32Array(1024);
    self._fftImag = new Float32Array(1024);
    self._magnitudes = new Float32Array(513);
    self._prevMagnitudes = new Float32Array(513);

    // Hann window
    self._hannWindow = new Float32Array(1024);
    for (i = 0; i < 1024; i++) {
      self._hannWindow[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / 1023));
    }

    // Flux history ring buffer for adaptive threshold
    self._fluxHistory = new Float32Array(15);
    self._fluxHistoryIndex = 0;
    self._fluxHistoryCount = 0;

    // Ring buffer for snippet extraction (~500ms at 44100)
    self._ringBuffer = new Float32Array(22050);
    self._ringWriteIndex = 0;

    // Snippet buffer for onset posts (210ms at 44100: 10ms pre + 200ms post)
    self._snippetBuffer = new Float32Array(9261);

    // Frame accumulation state
    self._hopCounter = 0;
    self._frameWriteIndex = 0;

    // Waveform buffer for display (matches capture-worklet pattern)
    self._waveformBuffer = new Float32Array(2048);
    self._waveformWriteIndex = 0;

    // Amplitude reporting throttle
    self._amplitudeSampleCounter = 0;

    // Bit-reversal permutation table
    self._bitReversal = new Uint32Array(1024);
    bits = 10; // log2(1024)
    for (i = 0; i < 1024; i++) {
      reversed = 0;
      val = i;
      for (j = 0; j < bits; j++) {
        reversed = (reversed << 1) | (val & 1);
        val >>>= 1;
      }
      self._bitReversal[i] = reversed;
    }

    // Trig tables for FFT butterfly
    self._cosTable = new Float32Array(512);
    self._sinTable = new Float32Array(512);
    for (i = 0; i < 512; i++) {
      angle = (-2 * Math.PI * i) / 1024;
      self._cosTable[i] = Math.cos(angle);
      self._sinTable[i] = Math.sin(angle);
    }

    // State flags
    self._stopped = false;
    self._lastOnsetTime = -Infinity;

    // Sensitivity defaults (medium preset)
    self._medianWindowSize = 10;
    self._multiplier = 1.5;
    self._minInterOnsetMs = 50;

    // Port message handler
    self.port.onmessage = function(event) {
      var data = event.data;
      if (!data) return;
      if (data.type === 'stop') {
        self._stopped = true;
      } else if (data.type === 'updateSensitivity') {
        var params = data.params;
        if (params) {
          self._medianWindowSize = params.medianWindowSize;
          self._multiplier = params.multiplier;
          self._minInterOnsetMs = params.minInterOnsetMs;
        }
      }
    };

    self.port.postMessage({ type: 'ready' });
  }

  process(inputs) {
    if (this._stopped) {
      return false;
    }

    var input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) {
      return true;
    }

    var channelData = input[0];
    var chunkLen = channelData.length;
    var i, k;

    // Peak amplitude detection for this chunk
    var peak = 0;
    for (i = 0; i < chunkLen; i++) {
      var absVal = channelData[i] < 0 ? -channelData[i] : channelData[i];
      if (absVal > peak) {
        peak = absVal;
      }
    }

    // Report amplitude periodically (~every 2048 samples)
    this._amplitudeSampleCounter += chunkLen;
    if (this._amplitudeSampleCounter >= 2048) {
      this.port.postMessage({ type: 'amplitude', peak: peak });
      this._amplitudeSampleCounter = 0;
    }

    // Copy input samples into frame buffer and ring buffer
    for (i = 0; i < chunkLen; i++) {
      var sample = channelData[i];

      // Frame buffer for FFT analysis
      if (this._frameWriteIndex < 1024) {
        this._frameBuffer[this._frameWriteIndex] = sample;
      }
      this._frameWriteIndex++;

      // Ring buffer for snippet extraction
      this._ringBuffer[this._ringWriteIndex] = sample;
      this._ringWriteIndex++;
      if (this._ringWriteIndex >= 22050) {
        this._ringWriteIndex = 0;
      }

      // Waveform buffer for display
      this._waveformBuffer[this._waveformWriteIndex] = sample;
      this._waveformWriteIndex++;
      if (this._waveformWriteIndex >= 2048) {
        var waveformCopy = this._waveformBuffer.buffer.slice(0);
        this.port.postMessage(
          { type: 'buffer', buffer: new Float32Array(waveformCopy) },
          [waveformCopy]
        );
        this._waveformWriteIndex = 0;
      }
    }

    // Advance hop counter
    this._hopCounter += chunkLen;

    // Process when hop size reached
    if (this._hopCounter >= this._hopSize) {
      // Apply Hann window
      for (i = 0; i < 1024; i++) {
        this._windowedFrame[i] = this._frameBuffer[i] * this._hannWindow[i];
      }

      // Copy windowed frame to FFT buffers
      for (i = 0; i < 1024; i++) {
        this._fftReal[i] = this._windowedFrame[i];
        this._fftImag[i] = 0;
      }

      // In-place FFT
      this._performFFT(this._fftReal, this._fftImag);

      // Compute magnitude spectrum
      for (i = 0; i < 513; i++) {
        var re = this._fftReal[i];
        var im = this._fftImag[i];
        this._magnitudes[i] = Math.sqrt(re * re + im * im);
      }

      // Compute spectral flux (half-wave rectified)
      var flux = 0;
      for (i = 0; i < 513; i++) {
        var diff = this._magnitudes[i] - this._prevMagnitudes[i];
        if (diff > 0) {
          flux += diff;
        }
      }

      // Add flux to history ring buffer
      this._fluxHistory[this._fluxHistoryIndex] = flux;
      this._fluxHistoryIndex++;
      if (this._fluxHistoryIndex >= 15) {
        this._fluxHistoryIndex = 0;
      }
      if (this._fluxHistoryCount < 15) {
        this._fluxHistoryCount++;
      }

      // Compute adaptive threshold from running median
      var windowSize = this._medianWindowSize;
      if (windowSize > this._fluxHistoryCount) {
        windowSize = this._fluxHistoryCount;
      }

      var threshold = 0;
      if (windowSize > 0) {
        // Collect the most recent windowSize flux values
        var medianArr = new Float32Array(windowSize);
        for (k = 0; k < windowSize; k++) {
          var idx = this._fluxHistoryIndex - 1 - k;
          if (idx < 0) {
            idx += 15;
          }
          medianArr[k] = this._fluxHistory[idx];
        }
        // Sort for median
        medianArr.sort();
        var mid = windowSize >>> 1;
        var median;
        if (windowSize % 2 === 0) {
          median = (medianArr[mid - 1] + medianArr[mid]) / 2;
        } else {
          median = medianArr[mid];
        }
        threshold = median * this._multiplier;
      }

      // Onset detection
      var nowMs = currentTime * 1000;
      var timeSinceLastOnset = nowMs - this._lastOnsetTime;

      // Compute RMS energy of the current frame as an amplitude gate
      var rmsEnergy = 0;
      for (k = 0; k < 1024; k++) {
        rmsEnergy += this._frameBuffer[k] * this._frameBuffer[k];
      }
      rmsEnergy = Math.sqrt(rmsEnergy / 1024);

      if (flux > threshold && flux > 0.5 && rmsEnergy > 0.01 && timeSinceLastOnset >= this._minInterOnsetMs) {
        // Extract snippet from ring buffer
        // 441 samples before (10ms) + 8820 samples after (200ms) = 9261 total
        var preSamples = 441;
        var totalSnippetLen = 9261;
        var snippetStart = this._ringWriteIndex - preSamples;
        if (snippetStart < 0) {
          snippetStart += 22050;
        }

        for (k = 0; k < totalSnippetLen; k++) {
          var readIdx = snippetStart + k;
          if (readIdx >= 22050) {
            readIdx -= 22050;
          }
          this._snippetBuffer[k] = this._ringBuffer[readIdx];
        }

        // Post onset with transferable snippet
        var snippetCopy = this._snippetBuffer.buffer.slice(0);
        this.port.postMessage(
          {
            type: 'onset',
            timestamp: currentTime,
            strength: flux / threshold,
            snippet: new Float32Array(snippetCopy)
          },
          [snippetCopy]
        );

        // Re-allocate snippet buffer (previous was transferred)
        this._snippetBuffer = new Float32Array(9261);

        this._lastOnsetTime = nowMs;
      }

      // Swap magnitude buffers (swap references)
      var tempMag = this._prevMagnitudes;
      this._prevMagnitudes = this._magnitudes;
      this._magnitudes = tempMag;

      // Shift frame buffer: keep last 768 samples (1024 - 256 overlap)
      for (i = 0; i < 768; i++) {
        this._frameBuffer[i] = this._frameBuffer[i + 256];
      }
      this._frameWriteIndex = 768;

      // Reset hop counter
      this._hopCounter = 0;
    }

    return true;
  }

  _performFFT(real, imag) {
    var n = 1024;
    var reverseTable = this._bitReversal;
    var cosTable = this._cosTable;
    var sinTable = this._sinTable;
    var i, j, halfLen, step, evenIdx, oddIdx, tableIdx;
    var tr, ti, tempR, tempI;

    // Bit-reversal permutation
    var tempReal = new Float32Array(n);
    var tempImag = new Float32Array(n);
    for (i = 0; i < n; i++) {
      tempReal[reverseTable[i]] = real[i];
      tempImag[reverseTable[i]] = imag[i];
    }
    for (i = 0; i < n; i++) {
      real[i] = tempReal[i];
      imag[i] = tempImag[i];
    }

    // Butterfly stages
    for (halfLen = 1; halfLen < n; halfLen = halfLen << 1) {
      step = n / (halfLen << 1);
      for (i = 0; i < n; i += halfLen << 1) {
        tableIdx = 0;
        for (j = 0; j < halfLen; j++) {
          evenIdx = i + j;
          oddIdx = i + j + halfLen;

          tr = cosTable[tableIdx] * real[oddIdx] - sinTable[tableIdx] * imag[oddIdx];
          ti = cosTable[tableIdx] * imag[oddIdx] + sinTable[tableIdx] * real[oddIdx];

          real[oddIdx] = real[evenIdx] - tr;
          imag[oddIdx] = imag[evenIdx] - ti;
          real[evenIdx] = real[evenIdx] + tr;
          imag[evenIdx] = imag[evenIdx] + ti;

          tableIdx += step;
        }
      }
    }
  }
}

registerProcessor('tap-processor', TapProcessorWorklet);
