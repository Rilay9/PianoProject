// A small in-place radix-2 FFT.
//
// Vendored rather than pulled from a package for two reasons: the hot path
// must not allocate (docs/05 §11.2), which rules out most npm FFTs that return
// fresh arrays, and it has to run unchanged inside an AudioWorklet, where
// module resolution is its own problem. Radix-2 rather than a mixed-radix or
// split-radix: the window sizes are 4096 and 8192, both powers of two, and the
// extra complexity would buy maybe 30 % on an operation that already fits the
// 3 ms budget with room to spare.
//
// Everything is preallocated in `FftContext`; `forward()` writes into buffers
// the caller owns.

export interface FftContext {
  readonly size: number;
  /** Twiddle factors, cos/sin per stage, laid out flat. */
  readonly cosTable: Float32Array;
  readonly sinTable: Float32Array;
  /** Bit-reversal permutation. */
  readonly reverse: Uint32Array;
  /** Scratch for the imaginary part of a real-valued input. */
  readonly imag: Float32Array;
}

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

export function createFft(size: number): FftContext {
  if (!isPowerOfTwo(size)) {
    throw new RangeError(`FFT size must be a power of two, got ${size}`);
  }
  const cosTable = new Float32Array(size / 2);
  const sinTable = new Float32Array(size / 2);
  for (let i = 0; i < size / 2; i += 1) {
    cosTable[i] = Math.cos((-2 * Math.PI * i) / size);
    sinTable[i] = Math.sin((-2 * Math.PI * i) / size);
  }

  const bits = Math.log2(size);
  const reverse = new Uint32Array(size);
  for (let i = 0; i < size; i += 1) {
    let value = 0;
    for (let bit = 0; bit < bits; bit += 1) {
      value = (value << 1) | ((i >>> bit) & 1);
    }
    reverse[i] = value;
  }

  return { size, cosTable, sinTable, reverse, imag: new Float32Array(size) };
}

/**
 * In-place complex FFT. `real` and `imag` are both length `size` and are
 * overwritten with the transform.
 *
 * The input here is always real (audio), so `imag` is zeroed by the caller;
 * doing the standard real-input packing would halve the work but doubles the
 * places a sign error can hide, and the measured cost is already fine.
 */
export function fftInPlace(ctx: FftContext, real: Float32Array, imag: Float32Array): void {
  const { size, cosTable, sinTable, reverse } = ctx;

  for (let i = 0; i < size; i += 1) {
    const j = reverse[i] as number;
    if (j > i) {
      const tempReal = real[i] as number;
      real[i] = real[j] as number;
      real[j] = tempReal;
      const tempImag = imag[i] as number;
      imag[i] = imag[j] as number;
      imag[j] = tempImag;
    }
  }

  for (let half = 1; half < size; half *= 2) {
    const step = size / (half * 2);
    for (let i = 0; i < size; i += half * 2) {
      for (let j = i, k = 0; j < i + half; j += 1, k += step) {
        const cos = cosTable[k] as number;
        const sin = sinTable[k] as number;
        const partner = j + half;
        const pr = real[partner] as number;
        const pi = imag[partner] as number;
        const tr = pr * cos - pi * sin;
        const ti = pr * sin + pi * cos;
        real[partner] = (real[j] as number) - tr;
        imag[partner] = (imag[j] as number) - ti;
        real[j] = (real[j] as number) + tr;
        imag[j] = (imag[j] as number) + ti;
      }
    }
  }
}

/** A Hann window of `size` points. Built once, reused every hop. */
export function hannWindow(size: number): Float32Array {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i += 1) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return window;
}
