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
  private beatsPerBar: number;
  private readonly countInBeats: number;
  private secondsPerBeat: number;
  private nextIndex = 0;
  private nextTimeSec: number;
  /**
   * The beat index that is beat 1 of a bar, and the bar number it carries.
   *
   * Bar numbering used to be `floor((index - countInBeats) / beatsPerBar) + 1`,
   * which only works while `beatsPerBar` never changes. A meter change moves
   * this pair instead, so beats already handed to the audio clock keep the
   * numbers they were given and the new meter starts a new bar.
   */
  private barOriginIndex = 0;
  private barOriginBar: number;

  constructor(options: BeatSchedulerOptions) {
    if (!(options.bpm > 0)) throw new RangeError(`bpm must be positive, got ${options.bpm}`);
    this.beatsPerBar = Math.max(1, Math.trunc(options.beatsPerBar ?? 4));
    const countInBars = Math.max(0, Math.trunc(options.countInBars ?? 0));
    this.countInBeats = countInBars * this.beatsPerBar;
    this.barOriginBar = 1 - countInBars;
    this.secondsPerBeat = 60 / options.bpm;
    this.nextTimeSec = options.startTimeSec;
  }

  /** Number of clicks before bar 1 beat 1. */
  get countInBeatCount(): number {
    return this.countInBeats;
  }

  /** Beats to a bar as of now — the changed value after `setBeatsPerBar`. */
  get beatsInBar(): number {
    return this.beatsPerBar;
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
   * Changes the meter from the next un-pulled beat onwards, which becomes
   * beat 1 of a new bar.
   *
   * A new bar rather than a re-slicing of the one already sounding: the beats
   * behind the look-ahead window have already been given a `beatInBar`, the UI
   * has already lit those dots, and renumbering them retrospectively would put
   * the accent somewhere the click did not fall. Truncating the current bar is
   * what a person switching the metronome from 4/4 to 3/4 mid-click expects —
   * the next click is a downbeat.
   */
  setBeatsPerBar(beats: number): void {
    const next = Math.max(1, Math.trunc(beats));
    if (next === this.beatsPerBar) return;
    // The bar the last handed-out beat belonged to; the new meter starts the
    // one after it. With nothing handed out since the last origin, the next
    // beat is already a downbeat and keeps its bar number.
    const lastBar =
      this.nextIndex > this.barOriginIndex
        ? this.describe(this.nextIndex - 1, 0).bar
        : this.barOriginBar - 1;
    this.barOriginBar = lastBar + 1;
    this.barOriginIndex = this.nextIndex;
    this.beatsPerBar = next;
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
    const offset = index - this.barOriginIndex;
    const bar = this.barOriginBar + Math.floor(offset / this.beatsPerBar);
    const beatInBar = (((offset % this.beatsPerBar) + this.beatsPerBar) % this.beatsPerBar) + 1;
    return {
      index,
      timeSec,
      bar,
      beatInBar,
      // The count-in is a fixed number of clicks, fixed when the run started:
      // changing the meter part-way through one does not buy more of them.
      isCountIn: index < this.countInBeats,
      isAccent: beatInBar === 1,
    };
  }
}
