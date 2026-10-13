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
import { holds } from './holds';
import { judge, judgeRhythm, type ExpectedStep, type NoteKind, type PlayedKey } from './matching';

export const ON_TIME_MS = { relaxed: 200, normal: 100, strict: 50 } as const;

// Pausing by itself in the modes that keep going (owner, 2026-10-11), then carrying on from your next key:
// - silence: none of your keys for 3 seconds while at least two of your notes came due (a long rest in your
//   part does not count);
// - mashing: six or more keys the score does not have near then, within a quarter of a second. Fast runs and
//   big chords are in the score, so they never count; a wrong five-finger chord alone does not either.
const SILENCE_MS = 3000;
const SILENCE_NOTES = 2;
const MASH_KEYS = 6;
const MASH_MS = 250;
const NEAR_MS = 300; // how close to a written note a key must come to be one the score has (real ms)
const HINT_MS = SILENCE_MS; // Memorise: no key this long while it waits for a note, and the next note is shown (the same "gone quiet" as above)

/** A stretch of bars that went wrong: its steps (as a loop range) and how many notes or presses were off. */
export interface WeakSpot { a: number; b: number; count: number }
export interface Summary {
  /** short: on time but let go early (holds.ts); every note is one of onTime, early, late, missed, short. */
  total: number; onTime: number; early: number; late: number; missed: number; short: number; wrong: number; tolerance: number; rhythm: boolean;
  /** The worst stretches first (at most three). */
  weak: WeakSpot[];
  /** Each note not played on time (its step in the score) and each wrong key (the step being played then). */
  slips: { step: number; midi: number; kind: NoteKind }[];
  extra: { step: number; midi: number }[];
}

type Hand = 'both' | 'right' | 'left';
/** The hands you play: the bottom bar's L or R, otherwise both. */
export const yours = (s: ScoreSettings): Hand => (s.hands === 'left' || s.hands === 'right' ? s.hands : 'both');
const pianos = (s: ScoreSettings): Hand | null => (s.hands === 'left' ? 'right' : s.hands === 'right' ? 'left' : null);

export class Practice {
  private expected = new Set<number>();
  private fresh = new Set<number>(); // pressed since the marker reached this step
  private played: PlayedKey[] = [];
  private fromIndex = 0;
  private running: 'wait' | 'along' | null = null;
  onSummary: (s: Summary) => void = () => {};
  /** Paused by itself (silence or mashing); resumeStep: where to carry on from. */
  onAutoPause: (reason: 'silence' | 'mash', resumeStep: number) => void = () => {};
  private segments: Summary[] = []; // the run so far, before each pause
  private lastPress = 0; // performance.now() of your last key
  private lastPressSong = 0; // and where the song was then
  private odd: number[] = []; // times of recent keys the score does not have
  private watch = 0;
  /** The loop being practised, if any: its steps and the song time its last bar ends. */
  loop: () => { a: number; b: number; t1: number } | null = () => null;
  /** Wait for me reached the end of the song by itself. */
  onDone: () => void = () => {};

  // Memorise's waiting pass (owner, 2026-10-12: when timing doesn't count it waits for you, and the pass always
  // finishes): Wait for me over set steps that ends there instead of looping, noting the keys that were not
  // asked for and the notes you were helped to (a hint after HINT_MS with no key, or a peek).
  private pass: { a: number; b: number; t1: number } | null = null;
  private passWrong: { step: number; midi: number }[] = [];
  private passHelped: { step: number; midi: number }[] = [];
  private hintTimer = 0;
  // While the piano leads into your next notes, a key of those notes pressed a shade early (or in time, as the
  // marker gets there a moment after the sound) counts for them when the marker arrives, not as a wrong key.
  private coming = new Set<number>();
  private early = new Set<number>();
  private dueAt = 0; // performance.now() when your next notes are due (a held note: the hint counts from then)
  /** The pass reached its end (the piano has finished the last bar). */
  onPassEnd: () => void = () => {};
  /** No key for a while: these are the keys wanted next (shown, and counted as helped). */
  onHint: (keys: number[]) => void = () => {};

  /** Starts a waiting pass over steps a..b (whole bars; t1: where the last bar ends) from step `from`; hints: the next notes shown after a while with no key (not in the Memorise test). */
  startPass(range: { a: number; b: number; t1: number }, from: number, hints = true): void {
    this.passHints = hints;
    this.pass = range;
    this.passWrong = [];
    this.passHelped = [];
    this.view.goTo(from);
    this.running = 'wait';
    this.arrive();
  }

  /** How the waiting pass went: the wanted notes you were helped to, and the keys not asked for. */
  passSlips(): { slips: { step: number; midi: number; kind: 'missed' }[]; extra: { step: number; midi: number }[] } {
    return { slips: this.passHelped.map((h) => ({ ...h, kind: 'missed' as const })), extra: [...this.passWrong] };
  }

  /** A peek during the waiting pass: the notes wanted now count as helped. */
  helped(): void {
    if (!this.pass || this.running !== 'wait') return;
    for (const midi of this.expected) if (!this.passHelped.some((h) => h.step === this.view.index && h.midi === midi)) this.passHelped.push({ step: this.view.index, midi });
  }

  private passHints = true;
  private armHint(): void {
    clearTimeout(this.hintTimer);
    if (!this.pass || !this.passHints || this.running !== 'wait' || !this.expected.size) return;
    this.hintTimer = window.setTimeout(() => {
      if (!this.pass || this.running !== 'wait') return;
      this.helped();
      this.onHint([...this.expected]);
    }, Math.max(HINT_MS, this.dueAt + HINT_MS - performance.now())); // never while you rightly hold a long note
  }

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

  /** Pausing by itself is off while Memorise runs a pass (it has its own way of going on). */
  autoPause = true;

  /** Starts Play along: the caller has started the sound and the marker. continuing: after a pause, same run. */
  startAlong(continuing = false): void {
    this.running = 'along';
    this.played = [];
    this.fromIndex = this.view.index;
    if (!continuing) this.segments = [];
    this.lastPress = performance.now();
    this.lastPressSong = this.view.songNow();
    this.odd = [];
    clearInterval(this.watch);
    this.watch = window.setInterval(() => this.checkSilence(), 250);
  }

  /** The key that started the song (Play along begun from a key): counted as played right on its note. */
  startedBy(midi: number, at?: number): void {
    const t = this.view.currentT;
    this.played.push({ midi, t, speed: this.settings().speed, at });
    this.lastPress = performance.now();
    this.lastPressSong = t;
  }

  /** Stopped (a tap or the end of the song): Play along shows how it went (unless told not to). */
  stop(summary = true): void {
    clearInterval(this.watch);
    clearTimeout(this.hintTimer);
    this.pass = null;
    this.coming.clear();
    this.early.clear();
    this.dueAt = 0;
    const along = this.running === 'along';
    if (along && summary) this.onSummary(this.merged(this.score()));
    if (along) this.segments = []; // a real stop ends the run (a pause by itself keeps it: see suspend)
    this.running = null;
    this.expected.clear();
    this.fresh.clear();
  }

  /** The key that starts Wait for me, pressed before it began (a quick tap may be up already): it counts for the first notes. */
  pressedBefore(midi: number): void { this.early.add(midi); }

  /** Another song, mode, loop or screen: a run paused by itself is over (its parts are not carried into the next). */
  forgetRun(): void { this.segments = []; }

  /** Paused by itself, and you want to see how it went: the run ends with its summary. */
  finishRun(): void {
    const last = this.segments.pop();
    if (last) this.onSummary(this.merged(last));
    this.segments = [];
  }

  /** Paused by itself: keeps how this part went, for the summary when the run ends. */
  suspend(): void {
    clearInterval(this.watch);
    if (this.running === 'along') this.segments.push(this.score());
    this.running = null;
  }

  /** The parts of a run between pauses, added up. */
  private merged(last: Summary): Summary {
    const all = [...this.segments, last];
    const sum = (k: 'total' | 'onTime' | 'early' | 'late' | 'missed' | 'short' | 'wrong') => all.reduce((n, r) => n + r[k], 0);
    const spots = new Map<string, WeakSpot>();
    for (const w of all.flatMap((r) => r.weak)) {
      const key = `${w.a}-${w.b}`, had = spots.get(key);
      spots.set(key, had ? { ...had, count: had.count + w.count } : { ...w });
    }
    return {
      ...last, total: sum('total'), onTime: sum('onTime'), early: sum('early'), late: sum('late'), missed: sum('missed'), short: sum('short'), wrong: sum('wrong'),
      weak: [...spots.values()].sort((x, y) => y.count - x.count).slice(0, 3),
    };
  }

  /** Silence: none of your keys for a while though your notes kept coming. */
  private checkSilence(): void {
    if (!this.autoPause || this.running !== 'along' || !this.view.playing || performance.now() - this.lastPress < SILENCE_MS) return;
    const hand = yours(this.settings()), now = this.view.songNow();
    const due: number[] = [];
    for (let i = this.fromIndex; i <= this.view.index; i++) {
      const t = this.view.stepT(i);
      if (t > this.lastPressSong + 1 && t <= now && this.view.struckAt(i, hand).length) due.push(i);
    }
    if (due.length >= SILENCE_NOTES) this.onAutoPause('silence', due[0]);
  }

  /** Is this key one of your written notes near song time t? */
  private nearNote(midi: number, t: number): boolean {
    const s = this.settings(), hand = yours(s), reach = NEAR_MS * s.speed;
    for (let i = Math.max(0, this.view.index - 12); i < Math.min(this.view.stepCount, this.view.index + 12); i++) {
      if (Math.abs(this.view.stepT(i) - t) <= reach && this.view.struckAt(i, hand).includes(midi)) return true;
    }
    return false;
  }

  key(e: KeyEvent): void {
    if (!this.running) return;
    if (this.running === 'along') {
      if (!e.on) return;
      const s = this.settings(), speed = s.speed, t = this.view.songNow() - (performance.now() - e.time) * speed;
      this.played.push({ midi: e.midi, t, speed, at: e.time });
      this.lastPress = e.time;
      this.lastPressSong = t;
      // Mashing: many keys the score does not have, all at once (in Rhythm any key is fine, so it never counts).
      if (this.autoPause && s.mode !== 'rhythm' && !this.nearNote(e.midi, t)) {
        this.odd = [...this.odd.filter((x) => e.time - x < MASH_MS), e.time];
        if (this.odd.length >= MASH_KEYS) { this.odd = []; this.onAutoPause('mash', this.view.index); }
      }
      return;
    }
    if (e.on && !this.expected.size && this.coming.has(e.midi)) { this.early.add(e.midi); return; } // your next note, as the piano leads into it
    if (e.on) this.fresh.add(e.midi);
    else this.fresh.delete(e.midi);
    if (this.pass && e.on) {
      // A key not wanted here (a chord's other keys are fine) is noted; any key puts the hint off again.
      if (!this.expected.has(e.midi)) this.passWrong.push({ step: this.view.index, midi: e.midi });
      this.armHint();
    }
    if (this.expected.size && [...this.expected].every((m) => this.fresh.has(m) && this.midi.down.has(m))) this.advance();
  }

  /** The marker is at a step: what it waits for (or, if nothing is yours here, move on). */
  private arrive(): void {
    if (this.running !== 'wait') return;
    this.expected = new Set(this.view.struckAt(this.view.index, yours(this.settings())));
    this.fresh = new Set([...this.early].filter((m) => this.expected.has(m))); // (pressed then, held or not: a short note may be up already)
    this.early.clear();
    this.coming.clear();
    if (!this.expected.size) { this.advance(); return; }
    if ([...this.expected].every((m) => this.fresh.has(m))) { this.advance(); return; } // played as the marker came
    this.armHint();
  }

  /**
   * Your notes are played: the piano plays its part up to your next notes, then the marker waits again. Its
   * notes still sounding from before ring on to their written end. In a loop, after your last notes in it
   * the piano plays on to the end of the loop's last bar and the marker goes back to its start.
   */
  private advance(): void {
    clearTimeout(this.hintTimer);
    const s = this.settings(), i = this.view.index, n = this.view.stepCount;
    const loop = this.pass ?? this.loop(), looping = !!loop && i >= loop.a && i <= loop.b;
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
      this.dueAt = performance.now() + (this.view.stepT(j) - from) / s.speed;
      this.view.goTo(j);
      this.arrive();
      return;
    }
    const clicks: Beat[] = s.metronome ? this.view.beats(s.clickOn).filter((b) => b.t >= from && b.t < to) : [];
    this.coming = new Set(j < end ? this.view.struckAt(j, yours(s)) : []);
    this.early.clear();
    this.sound.play(notes, clicks, from, s.speed, true);
    this.view.songClock = () => this.sound.songTime();
    if (j >= end && looping) { this.view.play(-1, to); return; } // the view calls back at the loop's end
    if (j >= n) { this.view.play(); return; } // the piano finishes the song
    this.view.play(j);
  }

  /**
   * The music was laid out again mid-pass (the phone turned): the view stopped, so wait again where it was: at the
   * notes it was waiting for, or (if the piano was leading on) at your next notes.
   */
  carryOn(): void {
    if (this.running !== 'wait') return;
    this.sound.stop();
    this.view.songClock = null;
    if (this.expected.size) { this.arrive(); return; }
    const hand = yours(this.settings()), loop = this.pass ?? this.loop(), end = loop ? loop.b + 1 : this.view.stepCount;
    let i = this.view.index + 1;
    while (i < end && !this.view.struckAt(i, hand).length) i++;
    if (i < end) { this.view.goTo(i); this.arrive(); return; }
    if (this.pass) { this.loopBack(); return; }
    this.view.goTo(this.view.stepCount - 1); this.stop(); this.onDone();
  }

  /** Wait for me in a loop: back to its start, waiting for your first notes there. */
  loopBack(): void {
    if (this.pass && this.running === 'wait') { this.running = null; this.expected.clear(); this.onPassEnd(); return; } // a pass ends, it does not go round
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
      if (keys.length) { steps.push({ t: this.view.stepT(i), keys, durs: this.view.durationsAt(i, hand) }); index.push(i); }
    }
    const rhythm = s.mode === 'rhythm';
    // Each note held its length too (owner, 2026-10-13); a press with no time of its own is not judged for it.
    const held = (p: PlayedKey) => (p.at === undefined ? Infinity : holds.heldFor(p.midi, p.at));
    const r = (rhythm ? judgeRhythm : judge)(steps, this.played, tolerance, held);
    return {
      ...r, tolerance, rhythm, weak: this.weakSpots(r.offSteps.map((k) => index[k]), r.wrongAt),
      slips: r.offNotes.map((o) => ({ step: index[o.k], midi: o.midi, kind: o.kind })),
      extra: r.wrongKeys.map((w) => ({ step: this.stepAt(w.t), midi: w.midi })),
    };
  }

  /** The step being played at song time t (within this run). */
  private stepAt(t: number): number {
    let i = this.fromIndex;
    while (i + 1 <= this.view.index && this.view.stepT(i + 1) <= t) i++;
    return i;
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
