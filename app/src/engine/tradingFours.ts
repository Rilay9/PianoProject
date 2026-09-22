/**
 * Trading fours — the app takes a phrase, the learner answers it, round and
 * round over the accompaniment lab's bass-and-drum bed (docs/04 §3c).
 *
 * Four rungs' plans ask for it (`blues.5`, `blues.7`, `jazz.4`, `improv.4`) and
 * none of them had a mode for it. Everything here is pure: who is playing in a
 * given bar, what the app plays, and what the learner's bars are worth. The
 * screen schedules the sound and draws the words; none of that is in this file,
 * so the musical decisions are testable without an AudioContext.
 *
 * ## The three decisions this file holds
 *
 * **The app leads, always.** Every plan entry describes it the same way — *the
 * app plays two bars, you answer two* — so the learner's entry is always after
 * music they have just heard in audible time. That makes it T8's case 2 (the
 * app leads) and there is no first-note latch anywhere in this mode: coming in
 * on time *is* the skill being practised, and latching the clock to the first
 * note would quietly remove it.
 *
 * **The call is generated, not taken out of a piece.** The lab has no piece —
 * it has a key, a progression and a tempo — so a call drawn from the loop's own
 * harmony is the only one it can honestly make. A call lifted from the tune on
 * the rung is a different exercise and belongs on the chord-chart screen, which
 * is where the piece is; it is not built.
 *
 * **What is judged is measured, not marked.** Nothing here returns a pass, a
 * mark or an accuracy, and nothing it produces is written to the practice
 * history. Two facts come back about the learner's bars — whether they came in
 * inside their own window, and how many of their notes were in the scale the
 * rung teaches — because a teaching device that says nothing back is a
 * metronome. Matching the call note for note is deliberately *not* judged: the
 * answer to a phrase is your own phrase, and a mode that scored imitation would
 * teach the opposite of the thing.
 */
import { makeRng } from './sightReading';
import { phraseScale } from './drills/factories';

export type TradeSide = 'app' | 'learner';

export interface TradePosition {
  /** Whose bars these are. The app takes the first trade. */
  side: TradeSide;
  /** Which trade this is, counting both sides, from nought. */
  trade: number;
  /** Bar within this trade, from nought. */
  barInTrade: number;
}

/**
 * Whose bar this is.
 *
 * `bar` counts from the first bar of the mode, not from the first bar of the
 * loop: a twelve-bar form and a two-bar trade do not line up, and which of the
 * two the learner is following is the *form*'s business and not this one's.
 */
export function tradeAt(bar: number, tradeBars: number): TradePosition {
  const length = Math.max(1, Math.trunc(tradeBars));
  const index = Math.max(0, Math.trunc(bar));
  const trade = Math.floor(index / length);
  return {
    side: trade % 2 === 0 ? 'app' : 'learner',
    trade,
    barInTrade: index % length,
  };
}

export interface CallNote {
  midi: number;
  /** Beats from the first beat of the call. */
  atBeat: number;
}

/** Every MIDI note between `low` and `high` whose pitch class is in `pitchClasses`. */
function pitchesInRange(
  pitchClasses: readonly number[],
  low: number,
  high: number,
): number[] {
  const wanted = new Set(pitchClasses.map((value) => (((value % 12) + 12) % 12)));
  const out: number[] = [];
  for (let midi = Math.ceil(low); midi <= Math.floor(high); midi += 1) {
    if (wanted.has(((midi % 12) + 12) % 12)) out.push(midi);
  }
  return out;
}

function nearest(pool: readonly number[], to: number): number {
  return pool.reduce((best, midi) => (Math.abs(midi - to) < Math.abs(best - to) ? midi : best), pool[0] ?? to);
}

/**
 * The phrase the app plays in its own bars.
 *
 * One note a beat, and the **last beat of the call is a rest** — a call with no
 * breath at the end of it gives the learner nowhere to come in from, and the
 * silence is what makes the hand-over audible rather than something that has to
 * be counted.
 *
 * The shape rules are deliberately plain, because a call that is hard to hear
 * is a call nobody can answer: a chord tone on every downbeat so the phrase
 * agrees with the bar underneath it, and everywhere else a note of the scale
 * within a fourth of the one before, so the line moves rather than leaping
 * about. Seeded, so the same settings give the same call twice.
 */
export function callPhrase(options: {
  /** One pitch-class set per bar of the call — the loop's own chords. */
  chords: readonly (readonly number[])[];
  /** Pitch classes the phrase may use: the scale the rung teaches. */
  scale: readonly number[];
  beatsPerBar?: number;
  seed?: number;
  /** The bottom of the octave the call is played in. */
  lowMidi?: number;
}): CallNote[] {
  const beats = Math.max(1, Math.trunc(options.beatsPerBar ?? 4));
  const bars = options.chords.length;
  if (bars === 0) return [];
  const low = options.lowMidi ?? 60;
  const high = low + 12;
  const pool = pitchesInRange(options.scale, low, high);
  if (pool.length === 0) return [];
  const rng = makeRng(options.seed ?? 21);
  const notes: CallNote[] = [];
  let previous = nearest(pool, low + 4);
  // One short of the full count: the last beat is the breath.
  const steps = bars * beats - 1;
  for (let step = 0; step < steps; step += 1) {
    const bar = Math.floor(step / beats);
    const onDownbeat = step % beats === 0;
    const chord = options.chords[bar] ?? [];
    const wanted = onDownbeat && chord.length > 0 ? pitchesInRange(chord, low, high) : pool;
    const candidates = wanted.length > 0 ? wanted : pool;
    // Within a fourth of the last note, and not the same note again: a line,
    // not a leap and not a repeated key.
    const close = candidates.filter((midi) => midi !== previous && Math.abs(midi - previous) <= 5);
    const from = close.length > 0 ? close : candidates;
    const midi = from[Math.min(from.length - 1, Math.floor(rng() * from.length))] ?? previous;
    notes.push({ midi, atBeat: step });
    previous = midi;
  }
  return notes;
}

export interface TradeJudgement {
  /** Notes whose onset fell inside the learner's own bars. */
  notesInWindow: number;
  /** ...of which are in the scale the rung teaches. */
  notesInScale: number;
  /** Notes that landed over the app's bars instead — before it, or after it. */
  notesOutside: number;
  /**
   * Something was played, and the first of it fell inside the window.
   *
   * False for a learner who played nothing, one who was still finishing over
   * the app's call, and one who came in after their own bars had gone by.
   */
  cameIn: boolean;
  /**
   * Milliseconds from the start of the window to the first note, negative for
   * a pick-up before it. `null` when nothing was played at all, which is a
   * different answer from "late".
   */
  entryOffsetMs: number | null;
}

/**
 * What the learner's bars were worth.
 *
 * Not a mark. `notesInScale` is named after the scale where it is shown — *six
 * of seven in the blues scale* — because that is a measurement a learner can
 * act on, while "86 %" over an improvisation is a number pretending to be one.
 *
 * `graceMs` is the caller's, because an early entry is a pick-up and a pick-up
 * is measured in beats: the screen passes half a beat at the tempo it is
 * playing rather than a duration written down here.
 */
export function judgeTrade(options: {
  notes: readonly { midi: number; tMs: number }[];
  windowStartMs: number;
  windowEndMs: number;
  /** Pitch classes that count as in the scale. */
  scale: readonly number[];
  graceMs?: number;
}): TradeJudgement {
  const grace = Math.max(0, options.graceMs ?? 0);
  const start = options.windowStartMs - grace;
  const end = options.windowEndMs;
  const wanted = new Set(options.scale.map((value) => (((value % 12) + 12) % 12)));
  const inside = options.notes.filter((note) => note.tMs >= start && note.tMs < end);
  const first = options.notes[0];
  return {
    notesInWindow: inside.length,
    notesInScale: inside.filter((note) => wanted.has(((note.midi % 12) + 12) % 12)).length,
    notesOutside: options.notes.length - inside.length,
    cameIn: first !== undefined && first.tMs >= start && first.tMs < end,
    entryOffsetMs: first === undefined ? null : first.tMs - options.windowStartMs,
  };
}

/**
 * Which scale the rung's notes are counted against.
 *
 * The twelve-bar form gets the blues scale, because that is the scale the three
 * rungs built on it teach; every other progression here is diatonic and gets
 * the key's own scale. Two branches rather than a table per preset: a preset is
 * a set of pickers, and what belongs over a progression is a property of the
 * progression.
 */
export function tradeScaleName(progressionId: string, mode: 'major' | 'minor'): string {
  return progressionId === 'blues' ? 'blues' : mode;
}

/** The pitch classes of that scale in a key. */
export function tradeScale(options: {
  progressionId: string;
  tonic: number;
  mode: 'major' | 'minor';
}): number[] {
  const offsets = phraseScale(tradeScaleName(options.progressionId, options.mode)) ?? [];
  return [...new Set(offsets.map((offset) => (((options.tonic + offset) % 12) + 12) % 12))].sort(
    (a, b) => a - b,
  );
}
