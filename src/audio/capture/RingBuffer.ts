export class RingBuffer {
  private _buffer: Float32Array | null;
  private readonly _capacity: number;
  private _writeIndex = 0;
  private _samplesWritten = 0;

  constructor(durationSeconds: number, sampleRate: number) {
    this._capacity = Math.ceil(durationSeconds * sampleRate);
    this._buffer = new Float32Array(this._capacity);
  }

  get capacity(): number {
    return this._capacity;
  }

  get samplesWritten(): number {
    return this._samplesWritten;
  }

  get length(): number {
    return Math.min(this._samplesWritten, this._capacity);
  }

  write(samples: Float32Array): void {
    if (this._buffer === null) return;
    for (const sample of samples) {
      this._buffer[this._writeIndex] = sample;
      this._writeIndex = (this._writeIndex + 1) % this._capacity;
    }
    this._samplesWritten += samples.length;
  }

  read(startIndex: number, length: number): Float32Array {
    if (this._buffer === null) return new Float32Array(0);
    const result = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      const idx = (startIndex + i) % this._capacity;
      result[i] = this._buffer[idx] ?? 0;
    }
    return result;
  }

  toArray(): Float32Array {
    if (this._buffer === null) return new Float32Array(0);
    const len = this.length;
    if (this._samplesWritten <= this._capacity) {
      return this._buffer.slice(0, len);
    }
    // Unroll from writeIndex (oldest) to writeIndex-1 (newest)
    const result = new Float32Array(this._capacity);
    for (let i = 0; i < this._capacity; i++) {
      const idx = (this._writeIndex + i) % this._capacity;
      result[i] = this._buffer[idx] ?? 0;
    }
    return result;
  }

  dispose(): void {
    this._buffer = null;
    this._writeIndex = 0;
    this._samplesWritten = 0;
  }
}
