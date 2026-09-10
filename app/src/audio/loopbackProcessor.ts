// The listening half of the acoustic loopback measurement.
//
// One number per render quantum: how much energy the microphone is receiving
// at the frequency of the click the app is emitting. That is all the main
// thread needs to find when the click came back, and it is the only way to get
// a *timestamp* out of the input path at all — `MicSource`'s raw-audio stream
// carries no clock, and an AnalyserNode polled from `requestAnimationFrame`
// resolves nothing finer than a frame.
//
// Inside `process()`, `currentTime` is the AudioContext time at the start of
// the quantum being rendered, and the samples in `inputs` are that quantum's.
// So the time the click was *heard* comes out on the same clock the click was
// *scheduled* on, and the difference between the two is the whole round trip:
// output buffer, speaker, air, microphone, input buffer.
//
// Goertzel rather than an FFT: one bin is wanted, the click is a sine, and the
// whole thing is four multiplies per sample with no allocation.

import type { FromLoopbackWorklet, ToLoopbackWorklet } from './loopbackMessages';

/**
 * Quanta per message.
 *
 * 128 samples at 48 kHz is 2.67 ms, so posting each one is nearly 400 messages
 * a second at the moment the app is also engraving a preview. Sixteen is a
 * message every 43 ms, and the resolution of the answer is still one quantum
 * because each quantum keeps its own entry.
 */
const BATCH = 16;

class LoopbackProcessor extends AudioWorkletProcessor {
  private armed = false;
  /** `2 cos ω` — the whole of the Goertzel recurrence's state. */
  private coeff = 0;
  /** Reused: the audio thread must not allocate on a quantum. */
  private readonly magnitudes = new Float32Array(BATCH);
  private filled = 0;
  private batchStartSec = 0;
  private stepSec = 128 / sampleRate;

  constructor() {
    super();
    this.port.onmessage = (event: MessageEvent<ToLoopbackWorklet>) => {
      this.handle(event.data);
    };
  }

  private handle(message: ToLoopbackWorklet): void {
    if (message.type === 'disarm') {
      this.flush();
      this.armed = false;
      return;
    }
    this.coeff = 2 * Math.cos((2 * Math.PI * message.hz) / sampleRate);
    this.filled = 0;
    this.armed = true;
  }

  process(inputs: Float32Array[][]): boolean {
    // Stay alive when not armed and when the stream has not started yet: a
    // processor that returns false is torn down and never runs again.
    if (!this.armed) return true;
    const channel = inputs[0]?.[0];
    if (!channel || channel.length === 0) return true;

    if (this.filled === 0) this.batchStartSec = currentTime;
    this.stepSec = channel.length / sampleRate;

    let s1 = 0;
    let s2 = 0;
    for (let i = 0; i < channel.length; i += 1) {
      const s = this.coeff * s1 - s2 + (channel[i] as number);
      s2 = s1;
      s1 = s;
    }
    const power = s1 * s1 + s2 * s2 - this.coeff * s1 * s2;
    // Back to an amplitude comparable with the samples themselves, so a
    // threshold can be read as dBFS rather than as an arbitrary score.
    this.magnitudes[this.filled] = (2 * Math.sqrt(power > 0 ? power : 0)) / channel.length;
    this.filled += 1;
    if (this.filled >= BATCH) this.flush();
    return true;
  }

  private flush(): void {
    if (this.filled === 0) return;
    this.port.postMessage({
      type: 'frames',
      startSec: this.batchStartSec,
      stepSec: this.stepSec,
      magnitudes: this.magnitudes.subarray(0, this.filled),
    } satisfies FromLoopbackWorklet);
    this.filled = 0;
  }
}

registerProcessor('loopback-listener', LoopbackProcessor);
