// @ts-nocheck
/* eslint-disable no-undef */

/**
 * CaptureWorkletProcessor
 * Accumulates 128-sample input quanta into larger buffers and posts them to the main thread.
 */
class CaptureWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 2048;
    this._bufferPool = [
      new Float32Array(this._bufferSize),
      new Float32Array(this._bufferSize)
    ];
    this._poolIndex = 0;
    this._writeOffset = 0;
    this._stopped = false;

    this.port.onmessage = function(event) {
      if (event.data && event.data.type === 'stop') {
        this._stopped = true;
      }
    }.bind(this);

    this.port.postMessage({ type: 'ready' });
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
    var currentBuffer = this._bufferPool[this._poolIndex];

    for (var i = 0; i < channelData.length; i++) {
      currentBuffer[this._writeOffset] = channelData[i];
      this._writeOffset++;

      if (this._writeOffset >= this._bufferSize) {
        // Buffer is full — send it via Transferable
        var copy = currentBuffer.buffer.slice(0);
        this.port.postMessage(
          { type: 'buffer', buffer: new Float32Array(copy) },
          [copy]
        );

        // Swap to next buffer in pool
        this._poolIndex = (this._poolIndex + 1) % 2;
        currentBuffer = this._bufferPool[this._poolIndex];
        this._writeOffset = 0;
      }
    }

    return true;
  }
}

registerProcessor('capture-worklet', CaptureWorkletProcessor);
