// The pure, testable half of the metronome.
//
// Split out from `Metronome` on purpose: everything here is arithmetic on an
// audio-clock timeline with no AudioContext, no timers and no DOM, so the
// look-ahead behaviour — the part that is easy to get subtly wrong and
// impossible to eyeball — can be unit-tested in Node.

export interface MetronomeBeat {
  /** 0-based across the whole run, count-in beats included. */
  index: number;
  /** AudioContext time, in seconds, at which this click should sound. */
  timeSec: number;
  /**
   * 1-based musical bar. Count-in bars are numbered 0, -1, … so that bar 1
   * beat 1 is always the downbeat the learner starts playing on.
   */
  bar: number;
  /** 1-based position within the bar. */
  beatInBar: number;
  isCountIn: boolean;
  /** True on beat 1 of a bar; the UI and the click sound both accent it. */
  isAccent: boolean;
}

export interface BeatSchedulerOptions {
  bpm: number;
  beatsPerBar?: number;
  countInBars?: number;
  /** AudioContext time of beat 0 (the first count-in click, if any). */
  startTimeSec: number;
}

/**
 * Guards against a runaway loop if the caller passes a time far in the future
 * (a suspended tab resuming, a fake clock in a test jumping an hour).
 */
const MAX_BEATS_PER_PULL = 1024;

export class BeatScheduler {
  private readonly beatsPerBar: number;
  private readonly countInBeats: number;
  private secondsPerBeat: number;
  private nextIndex = 0;
  private nextTimeSec: number;

  constructor(options: BeatSchedulerOptions) {
    if (!(options.bpm > 0)) throw new RangeError(`bpm must be positive, got ${options.bpm}`);
    this.beatsPerBar = Math.max(1, Math.trunc(options.beatsPerBar ?? 4));
    this.countInBeats = Math.max(0, Math.trunc(options.countInBars ?? 0)) * this.beatsPerBar;
    this.secondsPerBeat = 60 / options.bpm;
    this.nextTimeSec = options.startTimeSec;
  }

  /** Number of clicks before bar 1 beat 1. */
  get countInBeatCount(): number {
    return this.countInBeats;
  }

  /** AudioContext time of the next beat that has not been pulled yet. */
  get nextBeatTimeSec(): number {
    return this.nextTimeSec;
  }

  get currentBpm(): number {
    return 60 / this.secondsPerBeat;
  }

  /**
   * Changes tempo from the next un-pulled beat onwards. Already-scheduled
   * clicks keep their times — they are committed to the audio clock and
   * rewriting them would make the tempo slider audibly stutter.
   */
  setBpm(bpm: number): void {
    if (!(bpm > 0)) throw new RangeError(`bpm must be positive, got ${bpm}`);
    this.secondsPerBeat = 60 / bpm;
  }

  /**
   * Returns every beat starting before `currentTimeSec + lookaheadSec` and
   * advances past them. This is the look-ahead scheduler pattern from
   * docs/01-architecture.md §4.4: a coarse timer wakes up often enough to
   * hand the next few clicks to the audio clock, which then plays them
   * sample-accurately regardless of how late the timer itself ran.
   */
  pull(currentTimeSec: number, lookaheadSec: number): MetronomeBeat[] {
    const horizon = currentTimeSec + lookaheadSec;
    const beats: MetronomeBeat[] = [];
    while (this.nextTimeSec < horizon && beats.length < MAX_BEATS_PER_PULL) {
      beats.push(this.describe(this.nextIndex, this.nextTimeSec));
      this.nextIndex += 1;
      this.nextTimeSec += this.secondsPerBeat;
    }
    return beats;
  }

  private describe(index: number, timeSec: number): MetronomeBeat {
    const musicIndex = index - this.countInBeats;
    const bar = Math.floor(musicIndex / this.beatsPerBar) + 1;
    const beatInBar = (((musicIndex % this.beatsPerBar) + this.beatsPerBar) % this.beatsPerBar) + 1;
    return {
      index,
      timeSec,
      bar,
      beatInBar,
      isCountIn: musicIndex < 0,
      isAccent: beatInBar === 1,
    };
  }
}
