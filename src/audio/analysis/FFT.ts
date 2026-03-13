/**
 * Radix-2 Cooley-Tukey FFT
 *
 * Zero-allocation forward transform — all buffers pre-allocated in constructor.
 * Size must be a power of 2.
 */
export class FFT {
  readonly size: number;
  private _cosTable: Float32Array;
  private _sinTable: Float32Array;
  private _reverseTable: Uint32Array;
  private _real: Float32Array | null;
  private _imag: Float32Array | null;

  constructor(size: number) {
    if (size < 2 || (size & (size - 1)) !== 0) {
      throw new Error('FFT size must be a power of 2');
    }

    this.size = size;
    const halfSize = size >>> 1;

    // Pre-compute trig tables for butterfly operations
    this._cosTable = new Float32Array(halfSize);
    this._sinTable = new Float32Array(halfSize);
    for (let i = 0; i < halfSize; i++) {
      const angle = (-2 * Math.PI * i) / size;
      this._cosTable[i] = Math.cos(angle);
      this._sinTable[i] = Math.sin(angle);
    }

    // Pre-compute bit-reversal permutation
    this._reverseTable = new Uint32Array(size);
    const bits = Math.log2(size) | 0;
    for (let i = 0; i < size; i++) {
      let reversed = 0;
      let val = i;
      for (let b = 0; b < bits; b++) {
        reversed = (reversed << 1) | (val & 1);
        val >>>= 1;
      }
      this._reverseTable[i] = reversed;
    }

    // Pre-allocate working buffers
    this._real = new Float32Array(size);
    this._imag = new Float32Array(size);
  }

  /**
   * In-place forward FFT.
   * On entry `input` contains time-domain samples (length === size).
   * On exit internal real/imag buffers hold the complex spectrum.
   * Use the real/imag getters or `magnitudeSpectrum()` to read results.
   */
  forward(input: Float32Array): void {
    const n = this.size;
    const real = this._real ?? new Float32Array(0);
    const imag = this._imag ?? new Float32Array(0);
    const reverseTable = this._reverseTable;
    const cosTable = this._cosTable;
    const sinTable = this._sinTable;

    // Bit-reversal copy
    for (let i = 0; i < n; i++) {
      const ri = reverseTable[i] ?? 0;
      real[ri] = input[i] ?? 0;
      imag[ri] = 0;
    }

    // Butterfly stages
    for (let halfLen = 1; halfLen < n; halfLen <<= 1) {
      const step = n / (halfLen << 1);
      for (let i = 0; i < n; i += halfLen << 1) {
        let tableIdx = 0;
        for (let j = 0; j < halfLen; j++) {
          const evenIdx = i + j;
          const oddIdx = i + j + halfLen;

          const cos = cosTable[tableIdx] ?? 0;
          const sin = sinTable[tableIdx] ?? 0;
          const oddR = real[oddIdx] ?? 0;
          const oddI = imag[oddIdx] ?? 0;
          const evenR = real[evenIdx] ?? 0;
          const evenI = imag[evenIdx] ?? 0;
          const tr = cos * oddR - sin * oddI;
          const ti = cos * oddI + sin * oddR;

          real[oddIdx] = evenR - tr;
          imag[oddIdx] = evenI - ti;
          real[evenIdx] = evenR + tr;
          imag[evenIdx] = evenI + ti;

          tableIdx += step;
        }
      }
    }
  }

  /**
   * Compute magnitude spectrum from current real/imag arrays.
   * Writes size/2 + 1 bins into `output`.
   */
  magnitudeSpectrum(real: Float32Array, imag: Float32Array, output: Float32Array): void {
    const bins = (this.size >>> 1) + 1;
    for (let i = 0; i < bins; i++) {
      const re = real[i] ?? 0;
      const im = imag[i] ?? 0;
      output[i] = Math.sqrt(re * re + im * im);
    }
  }

  /** Access internal real buffer (valid after forward()) */
  get realBuffer(): Float32Array {
    return this._real ?? new Float32Array(0);
  }

  /** Access internal imaginary buffer (valid after forward()) */
  get imagBuffer(): Float32Array {
    return this._imag ?? new Float32Array(0);
  }

  /** Release internal buffers */
  dispose(): void {
    this._cosTable = null as unknown as Float32Array;
    this._sinTable = null as unknown as Float32Array;
    this._reverseTable = null as unknown as Uint32Array;
    this._real = null;
    this._imag = null;
  }
}
