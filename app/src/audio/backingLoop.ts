/**
 * A bass-and-drums loop for the chord chart (docs/04 §3b, P7 carry-over).
 *
 * P7 shipped the chart's "loop" as the metronome plus a block chord on each
 * bar, which is enough to hear the harmony and nothing like enough to play
 * against: there is no pulse below the comp and no backbeat, so the one thing
 * a jam needs — something that keeps time whether or not you do — was missing.
 *
 * Three synthesised sounds rather than samples. The app already carries a
 * 13 MB piano and a soundfont; a drum kit would be megabytes more for three
 * noises that a filtered oscillator and a burst of noise imitate well enough
 * to play along with. Nobody is going to release a record with this.
 *
 * `barSchedule` is pure and returns *what* to play at *which beat offset*, so
 * the pattern can be tested without an AudioContext — which is the half of
 * this that would otherwise only be checkable by ear.
 */

/** What the loop plays. `bass` carries a pitch; the drums do not. */
export interface BackingEvent {
  kind: 'kick' | 'snare' | 'hat' | 'bass';
  /** Beats from the start of the bar. Fractional for a swung off-beat. */
  atBeat: number;
  /** MIDI note, for `bass` only. */
  midi?: number;
  /** 0..1. The hat is quiet, the backbeat is not. */
  gain: number;
}

/**
 * Where a swung off-beat lands.
 *
 * Straight eighths are at 0.5; a triplet shuffle puts them at two thirds of
 * the beat. Real playing sits between the two and moves with the tempo, but
 * the loop has to pick one and 2/3 is what "swing" means when it is written
 * down.
 */
export const SWING_OFFBEAT = 2 / 3;
export const STRAIGHT_OFFBEAT = 0.5;

/**
 * One bar of bass and drums.
 *
 * The bass plays root on beat 1 and fifth on beat 3 — the oldest
 * accompaniment there is, and the one that stays out of the way of whatever
 * the pianist is doing with the same chord. An octave below the comp, so it is
 * felt rather than heard over.
 *
 * The kit is a straight-ahead pattern: kick on 1 and 3, snare on the backbeat,
 * hat on every off-beat, which swings when the swing toggle is on.
 */
export function barSchedule(options: {
  /** Pitch classes of the bar's chord, root first. */
  pitchClasses: readonly number[];
  beatsPerBar?: number;
  swing?: boolean;
  /** The octave the comp is in; the bass sits an octave below it. */
  compOctaveMidi?: number;
}): BackingEvent[] {
  const beats = Math.max(1, Math.trunc(options.beatsPerBar ?? 4));
  const offbeat = options.swing ? SWING_OFFBEAT : STRAIGHT_OFFBEAT;
  const compBase = options.compOctaveMidi ?? 48;
  const root = options.pitchClasses[0];
  const events: BackingEvent[] = [];

  // --- bass ---------------------------------------------------------------
  if (root !== undefined) {
    events.push({ kind: 'bass', atBeat: 0, midi: compBase - 12 + root, gain: 0.5 });
    if (beats >= 3) {
      // The fifth if the chord has one, else the root again: a triad's third
      // entry is the fifth, but a two-note chord symbol has no fifth to take
      // and repeating the root is better than inventing one.
      const fifth = options.pitchClasses[2] ?? root;
      events.push({ kind: 'bass', atBeat: 2, midi: compBase - 12 + fifth, gain: 0.45 });
    }
  }

  // --- drums --------------------------------------------------------------
  for (let beat = 0; beat < beats; beat += 1) {
    if (beat % 2 === 0) events.push({ kind: 'kick', atBeat: beat, gain: 0.55 });
    // The backbeat: beats 2 and 4 of a four-beat bar. In three it lands on 2
    // only, which is what a jazz waltz does.
    if (beat % 2 === 1) events.push({ kind: 'snare', atBeat: beat, gain: 0.5 });
    events.push({ kind: 'hat', atBeat: beat, gain: 0.22 });
    if (beat + offbeat < beats) {
      events.push({ kind: 'hat', atBeat: beat + offbeat, gain: 0.14 });
    }
  }
  return events.sort((a, b) => a.atBeat - b.atBeat);
}

/**
 * Three drum sounds from an oscillator and a noise burst.
 *
 * Deliberately crude and deliberately short: everything here decays inside
 * 200 ms so that nothing rings into the next beat and turns the loop to mud
 * at a fast tempo.
 */
export class DrumKit {
  private readonly context: BaseAudioContext;
  private readonly output: GainNode;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(context: BaseAudioContext, destination?: AudioNode) {
    this.context = context;
    this.output = context.createGain();
    this.output.gain.value = 1;
    this.output.connect(destination ?? context.destination);
  }

  get gain(): GainNode {
    return this.output;
  }

  setVolume(value: number): void {
    this.output.gain.value = Math.max(0, Math.min(1, value));
  }

  play(event: BackingEvent, whenSec: number): void {
    switch (event.kind) {
      case 'kick':
        this.tone(whenSec, 110, 45, 0.18, event.gain);
        break;
      case 'bass':
        // A short plucked sine. The pitch is the point, the timbre is not.
        this.tone(whenSec, midiToHz(event.midi ?? 36), midiToHz(event.midi ?? 36), 0.35, event.gain);
        break;
      case 'snare':
        this.noise(whenSec, 0.13, event.gain, 1800);
        break;
      case 'hat':
        this.noise(whenSec, 0.05, event.gain, 7000);
        break;
    }
  }

  /** A sine sweeping from `fromHz` to `toHz` — a kick when it drops, a note when it does not. */
  private tone(whenSec: number, fromHz: number, toHz: number, seconds: number, gain: number): void {
    const osc = this.context.createOscillator();
    const level = this.context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(fromHz, whenSec);
    if (toHz !== fromHz) osc.frequency.exponentialRampToValueAtTime(toHz, whenSec + seconds);
    level.gain.setValueAtTime(gain, whenSec);
    level.gain.exponentialRampToValueAtTime(0.0001, whenSec + seconds);
    osc.connect(level).connect(this.output);
    osc.start(whenSec);
    osc.stop(whenSec + seconds + 0.02);
  }

  private noise(whenSec: number, seconds: number, gain: number, highpassHz: number): void {
    const buffer = this.ensureNoise();
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = highpassHz;
    const level = this.context.createGain();
    level.gain.setValueAtTime(gain, whenSec);
    level.gain.exponentialRampToValueAtTime(0.0001, whenSec + seconds);
    source.connect(filter).connect(level).connect(this.output);
    source.start(whenSec);
    source.stop(whenSec + seconds + 0.02);
  }

  private ensureNoise(): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const frames = Math.floor(this.context.sampleRate * 0.3);
    const buffer = this.context.createBuffer(1, frames, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
    return buffer;
  }

  dispose(): void {
    this.output.disconnect();
  }
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
