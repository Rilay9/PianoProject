// Metronome: look-ahead scheduling on the AudioContext clock, with count-in.
//
// Why not just `setInterval(click, 60000/bpm)`: JS timers on Android drift by
// tens of milliseconds under load and stop entirely when the tab is
// backgrounded, which is audible immediately and would poison the latency
// measurements on the diagnostics screen. Instead a coarse 25 ms timer wakes
// up, asks BeatScheduler for every click due within the next 100 ms, and hands
// those to the audio clock with explicit start times (docs/01 §4.4). The timer
// may fire late; the clicks still land where they should.

import { BeatScheduler, type MetronomeBeat } from './BeatScheduler';

export type MetronomeSound = 'wood' | 'beep';

export interface MetronomeOptions {
  bpm?: number;
  beatsPerBar?: number;
  /** Bars of clicks before bar 1. UI default is 1 bar (docs/04 §7). */
  countInBars?: number;
  volume?: number;
  sound?: MetronomeSound;
  /** Node to connect to; defaults to `context.destination`. */
  destination?: AudioNode;
}

/** Timer cadence and horizon from docs/01-architecture.md §4.4. */
export const SCHEDULER_INTERVAL_MS = 25;
export const SCHEDULER_LOOKAHEAD_MS = 100;

/** A click is scheduled this far ahead of `currentTime` at the earliest. */
const MIN_SCHEDULE_LEAD_SEC = 0.005;

export class Metronome {
  private readonly context: BaseAudioContext;
  private readonly output: GainNode;
  private scheduler: BeatScheduler | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly tickListeners = new Set<(beat: MetronomeBeat) => void>();
  private noiseBuffer: AudioBuffer | null = null;
  private bpm: number;
  private beatsPerBar: number;
  private countInBars: number;
  private sound: MetronomeSound;

  constructor(context: BaseAudioContext, options: MetronomeOptions = {}) {
    this.context = context;
    this.bpm = options.bpm ?? 90;
    this.beatsPerBar = options.beatsPerBar ?? 4;
    this.countInBars = options.countInBars ?? 1;
    this.sound = options.sound ?? 'wood';
    this.output = context.createGain();
    this.output.gain.value = options.volume ?? 0.6;
    this.output.connect(options.destination ?? context.destination);
  }

  get running(): boolean {
    return this.timer !== null;
  }

  get currentBpm(): number {
    return this.bpm;
  }

  /**
   * Starts clicking. `startTimeSec` defaults to a hair in the future so the
   * first click is never scheduled in the past (which browsers play
   * immediately, making the count-in sound like a stumble).
   */
  start(startTimeSec?: number): void {
    this.stop();
    const begin = startTimeSec ?? this.context.currentTime + 0.1;
    this.scheduler = new BeatScheduler({
      bpm: this.bpm,
      beatsPerBar: this.beatsPerBar,
      countInBars: this.countInBars,
      startTimeSec: begin,
    });
    this.tick();
    this.timer = setInterval(() => this.tick(), SCHEDULER_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.scheduler = null;
  }

  /** Fires once per scheduled click, ahead of the sound (`beat.timeSec`). */
  onTick(cb: (beat: MetronomeBeat) => void): () => void {
    this.tickListeners.add(cb);
    return () => this.tickListeners.delete(cb);
  }

  setBpm(bpm: number): void {
    this.bpm = bpm;
    this.scheduler?.setBpm(bpm);
  }

  setBeatsPerBar(beats: number): void {
    this.beatsPerBar = beats;
  }

  setCountInBars(bars: number): void {
    this.countInBars = bars;
  }

  setVolume(volume: number): void {
    this.output.gain.value = Math.min(1, Math.max(0, volume));
  }

  setSound(sound: MetronomeSound): void {
    this.sound = sound;
  }

  dispose(): void {
    this.stop();
    this.tickListeners.clear();
    this.output.disconnect();
  }

  private tick(): void {
    if (!this.scheduler) return;
    const beats = this.scheduler.pull(
      this.context.currentTime,
      SCHEDULER_LOOKAHEAD_MS / 1000,
    );
    for (const beat of beats) {
      const when = Math.max(beat.timeSec, this.context.currentTime + MIN_SCHEDULE_LEAD_SEC);
      this.click(when, beat.isAccent);
      for (const l of this.tickListeners) l(beat);
    }
  }

  private click(whenSec: number, accent: boolean): void {
    return this.sound === 'wood'
      ? this.woodClick(whenSec, accent)
      : this.beepClick(whenSec, accent);
  }

  /**
   * A short noise burst through a narrow band-pass reads as a woodblock; a
   * bare oscillator reads as a beep, which is harder to hear over a piano.
   */
  private woodClick(whenSec: number, accent: boolean): void {
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = accent ? 2400 : 1600;
    filter.Q.value = 12;

    const source = this.context.createBufferSource();
    source.buffer = this.getNoiseBuffer();

    gain.gain.setValueAtTime(accent ? 1 : 0.6, whenSec);
    gain.gain.exponentialRampToValueAtTime(0.0001, whenSec + 0.045);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.output);
    source.start(whenSec);
    source.stop(whenSec + 0.06);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  private beepClick(whenSec: number, accent: boolean): void {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = 'square';
    osc.frequency.value = accent ? 1500 : 1000;
    gain.gain.setValueAtTime(accent ? 0.5 : 0.3, whenSec);
    gain.gain.exponentialRampToValueAtTime(0.0001, whenSec + 0.04);
    osc.connect(gain);
    gain.connect(this.output);
    osc.start(whenSec);
    osc.stop(whenSec + 0.05);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  /** Built once and reused: allocating 50 ms of noise per click would churn. */
  private getNoiseBuffer(): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const length = Math.ceil(this.context.sampleRate * 0.06);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
    return buffer;
  }
}

export type { MetronomeBeat };
