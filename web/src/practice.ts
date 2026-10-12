// Playing with a MIDI keyboard (owner, 2026-10-11).
// - Wait for me: the marker waits at each of your notes until every key of it is down together (each pressed
//   after the marker got there, so a held chord does not carry you through repeats). Then the piano plays
//   its hands' notes up to your next ones, at the song's tempo, and the marker follows; with nothing for
//   the piano in between, the marker moves straight on.
// - Play along: the song plays at its tempo; your notes are recorded and, when it stops, compared with the
//   score: on time, early, late, wrong (keys the score did not ask for) and missed.
// "Your hands" are the bottom bar's L | R | Both (Both and Off: you play everything, the piano is silent).

import type { FollowView } from './follow';
import type { KeyEvent, MidiInput } from './midi';
import type { Beat, NoteEvent, Sound } from './sound';
import type { ScoreSettings } from './settings';
import { judge, judgeRhythm, type ExpectedStep, type PlayedKey } from './matching';

export const ON_TIME_MS = { relaxed: 200, normal: 100, strict: 50 } as const;

/** A stretch of bars that went wrong: its steps (as a loop range) and how many notes or presses were off. */
export interface WeakSpot { a: number; b: number; count: number }
export interface Summary {
  total: number; onTime: number; early: number; late: number; missed: number; wrong: number; tolerance: number; rhythm: boolean;
  /** The worst stretches first (at most three). */
  weak: WeakSpot[];
}

type Hand = 'both' | 'right' | 'left';
const yours = (s: ScoreSettings): Hand => (s.hands === 'left' || s.hands === 'right' ? s.hands : 'both');
const pianos = (s: ScoreSettings): Hand | null => (s.hands === 'left' ? 'right' : s.hands === 'right' ? 'left' : null);

export class Practice {
  private expected = new Set<number>();
  private fresh = new Set<number>(); // pressed since the marker reached this step
  private played: PlayedKey[] = [];
  private fromIndex = 0;
  private running: 'wait' | 'along' | null = null;
  onSummary: (s: Summary) => void = () => {};
  /** The loop being practised, if any: its steps and the song time its last bar ends. */
  loop: () => { a: number; b: number; t1: number } | null = () => null;
  /** Wait for me reached the end of the song by itself. */
  onDone: () => void = () => {};

  constructor(
    private readonly view: FollowView,
    private readonly sound: Sound,
    private readonly midi: MidiInput,
    private readonly settings: () => ScoreSettings,
  ) {
    view.onReached = () => this.arrive();
  }

  get active(): boolean { return this.running !== null; }

  /** Starts Wait for me at the marker. */
  startWait(): void {
    this.running = 'wait';
    this.arrive();
  }

  /** Starts Play along: the caller has started the sound and the marker. */
  startAlong(): void {
    this.running = 'along';
    this.played = [];
    this.fromIndex = this.view.index;
  }

  /** Stopped (a tap or the end of the song): Play along shows how it went (unless told not to). */
  stop(summary = true): void {
    if (this.running === 'along' && summary) this.onSummary(this.score());
    this.running = null;
    this.expected.clear();
    this.fresh.clear();
  }

  key(e: KeyEvent): void {
    if (!this.running) return;
    if (this.running === 'along') {
      const speed = this.settings().speed;
      if (e.on) this.played.push({ midi: e.midi, t: this.view.songNow() - (performance.now() - e.time) * speed, speed });
      return;
    }
    if (e.on) this.fresh.add(e.midi);
    else this.fresh.delete(e.midi);
    if (this.expected.size && [...this.expected].every((m) => this.fresh.has(m) && this.midi.down.has(m))) this.advance();
  }

  /** The marker is at a step: what it waits for (or, if nothing is yours here, move on). */
  private arrive(): void {
    if (this.running !== 'wait') return;
    this.fresh.clear();
    this.expected = new Set(this.view.struckAt(this.view.index, yours(this.settings())));
    if (!this.expected.size) this.advance();
  }

  /**
   * Your notes are played: the piano plays its part up to your next notes, then the marker waits again. Its
   * notes still sounding from before ring on to their written end. In a loop, after your last notes in it
   * the piano plays on to the end of the loop's last bar and the marker goes back to its start.
   */
  private advance(): void {
    const s = this.settings(), i = this.view.index, n = this.view.stepCount;
    const loop = this.loop(), looping = !!loop && i >= loop.a && i <= loop.b;
    const end = looping ? loop!.b + 1 : n; // the first step past what is being played
    let j = i + 1;
    while (j < end && !this.view.struckAt(j, yours(s)).length) j++;
    const from = this.view.stepT(i), to = j < end ? this.view.stepT(j) : looping ? loop!.t1 : this.view.stepT(j);
    const piano = pianos(s);
    const notes: NoteEvent[] = piano ? this.view.notesBetween(piano, from, to) : [];
    this.expected.clear();
    // The piano's notes struck with yours sound now; if it has none after them before your next notes, the
    // marker moves straight on (no waiting at the tempo for nothing).
    if (!notes.some((e) => e.t > from)) {
      if (notes.length) this.sound.play(notes, [], from, s.speed, true);
      if (j >= end && looping) { this.loopBack(); return; }
      if (j >= n) { this.view.goTo(n - 1); this.stop(); this.onDone(); return; } // the end of the song
      this.view.goTo(j);
      this.arrive();
      return;
    }
    const clicks: Beat[] = s.metronome ? this.view.beats(s.clickOn).filter((b) => b.t >= from && b.t < to) : [];
    this.sound.play(notes, clicks, from, s.speed, true);
    this.view.songClock = () => this.sound.songTime();
    if (j >= end && looping) { this.view.play(-1, to); return; } // the view calls back at the loop's end
    if (j >= n) { this.view.play(); return; } // the piano finishes the song
    this.view.play(j);
  }

  /** Wait for me in a loop: back to its start, waiting for your first notes there. */
  loopBack(): void {
    const loop = this.loop();
    if (this.running !== 'wait' || !loop) return;
    this.view.goTo(loop.a);
    this.arrive();
  }

  /** Play along in a loop: how this pass went; the next pass starts with startAlong. */
  passResult(): Summary { return { ...this.score() }; }

  /** Play along: your keys matched with the written notes of your hands (the rule is in matching.ts). */
  private score(): Summary {
    const s = this.settings(), hand = yours(s), tolerance = ON_TIME_MS[s.onTime];
    const steps: ExpectedStep[] = [];
    const index: number[] = []; // the view's step for each of these
    for (let i = this.fromIndex; i <= this.view.index; i++) {
      const keys = this.view.struckAt(i, hand);
      if (keys.length) { steps.push({ t: this.view.stepT(i), keys }); index.push(i); }
    }
    const rhythm = s.mode === 'rhythm';
    const r = (rhythm ? judgeRhythm : judge)(steps, this.played, tolerance);
    return { ...r, tolerance, rhythm, weak: this.weakSpots(r.offSteps.map((k) => index[k]), r.wrongAt) };
  }

  /**
   * Where it went wrong, bar by bar: each note not on time counts for its bar, each wrong press for the bar
   * being played then. Neighbouring bars that both went wrong make one stretch; the worst three stretches.
   */
  private weakSpots(offSteps: number[], wrongAt: number[]): WeakSpot[] {
    const bars = new Map<number, WeakSpot>(); // keyed by the bar's first step
    const add = (step: number) => {
      const range = this.view.loopRange(step, step);
      const bar = bars.get(range.a) ?? { ...range, count: 0 };
      bar.count++;
      bars.set(range.a, bar);
    };
    offSteps.forEach(add);
    for (const t of wrongAt) {
      let i = this.fromIndex;
      while (i + 1 <= this.view.index && this.view.stepT(i + 1) <= t) i++;
      add(i);
    }
    const spots: WeakSpot[] = [];
    for (const bar of [...bars.values()].sort((x, y) => x.a - y.a)) {
      const last = spots.at(-1);
      if (last && last.b + 1 === bar.a) { last.b = bar.b; last.count += bar.count; }
      else spots.push({ ...bar });
    }
    return spots.sort((x, y) => y.count - x.count).slice(0, 3);
  }
}
