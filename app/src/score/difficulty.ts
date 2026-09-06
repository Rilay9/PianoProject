/**
 * Levelling a score in the app, by the same arithmetic as the quarry (replan §4.4).
 *
 * `tools/content/difficulty.py` levels everything the content pipeline touches.
 * When the owner imports a file on his phone there is no Python, so this is the
 * same model measured off the `ScoreModel` the app already builds. The point is
 * not to have two estimators; it is to have one formula in two places, which is
 * why `difficulty.test.ts` runs both over the same fixtures and fails if they
 * disagree by more than 0.2 of a stage.
 *
 * The coefficients are not here. They live in `content/sources/level-model.json`,
 * are copied into `public/content/` by the build, and are fetched at runtime —
 * so refitting the model does not mean editing TypeScript.
 *
 * Two features Python measures are deliberately absent: `ornaments` (the model
 * has no ornament data — OSMD gives us notes, not expressions) and
 * `handCrossings`. Both carry a weight of exactly zero in the fitted model, so
 * their absence changes no estimate; if a future fit gives them a weight, the
 * agreement test is what will notice.
 *
 * Four of the 41 fixtures still measure a *feature* differently, and the
 * reasons are real rather than bugs. They are listed because a future reader
 * will otherwise rediscover them:
 *
 *   - **Ties.** music21 counts a tied continuation as a note; the ScoreModel
 *     merges tie chains into the first note. `chords-ties` therefore reads 4
 *     notes per bar here and 5 there.
 *   - **Grace notes.** music21 gives them zero duration and they drop out of
 *     `shortestValue`; OSMD gives them a real one, so `pickup-grace` sees a
 *     shorter shortest note.
 *   - **Voices in one staff.** Where two voices share a staff, what music21
 *     calls the left part and what the model calls staff 2 are not the same
 *     notes, so `two-voices` disagrees on the left hand's span and leap.
 *   - **An inferred key.** OSMD reports no key signature for `fingering-rests`
 *     where music21 infers three.
 *
 * None of them moves the *level* by more than 0.2, which is the number that
 * matters and the number the test holds.
 */
import type { ScoreModel, ScoreNote } from './types';
import { printedNoteKey } from './types';

/** `02` Part B's stages, and nothing outside them means anything. */
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 9;

/** Must match `difficulty.py`'s `LEDGER_LOW`/`LEDGER_HIGH`. */
const LEDGER_LOW = 43;
const LEDGER_HIGH = 79;

const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);

/** Not log-scaled: ratios and a duration that are already small. */
const LINEAR_FEATURES = new Set(['blackKeyRatio', 'ledgerRatio', 'shortestValue']);

export interface LevelModel {
  fitted?: boolean;
  bias?: number;
  weights?: Record<string, number>;
  means?: Record<string, number>;
  fallback?: { bins?: { maxNotesPerBar: number; minShortestValue: number; level: number }[] };
}

export interface LevelEstimate {
  level: number;
  /** `model` or `fallback` — the same two words Python uses. */
  source: 'model' | 'fallback';
  /** The three features that moved the estimate furthest from the bias. */
  drivers: [string, number][];
}

export type Features = Record<string, number>;

function logScale(name: string, value: number): number {
  if (LINEAR_FEATURES.has(name)) return value;
  return Math.log1p(Math.max(0, value));
}

/**
 * Fifths from a key signature name, because that is what Python counts.
 *
 * `extractScoreModel` stores the *name* ("E-flat major"), and the feature is
 * the number of sharps or flats. Inverting the table is smaller and clearer
 * than threading a second field through the model.
 */
const FIFTHS_BY_TONIC: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F-sharp': 6, 'C-sharp': 7,
  F: 1, 'B-flat': 2, 'E-flat': 3, 'A-flat': 4, 'D-flat': 5, 'G-flat': 6, 'C-flat': 7,
};

const FIFTHS_BY_MINOR_TONIC: Record<string, number> = {
  A: 0, E: 1, B: 2, 'F-sharp': 3, 'C-sharp': 4, 'G-sharp': 5, 'D-sharp': 6, 'A-sharp': 7,
  D: 1, G: 2, C: 3, F: 4, 'B-flat': 5, 'E-flat': 6, 'A-flat': 7,
};

export function keyAccidentals(keySig: string | undefined): number {
  if (!keySig) return 0;
  // The mode has to be read first. "A minor" has no accidentals; A *major* has
  // three, and looking the tonic up in the major table regardless of mode
  // hands every minor-key exercise three sharps it does not have — worth
  // 0.53 of a stage, which is most of the agreement budget on its own.
  const minor = /(?:^|\s)minor\s*$/i.test(keySig);
  const tonic = keySig.replace(/\s+(major|minor)\s*$/i, '').trim();
  const table = minor ? FIFTHS_BY_MINOR_TONIC : FIFTHS_BY_TONIC;
  return table[tonic] ?? 0;
}

interface HandStats {
  span: number;
  leap: number;
  range: number;
}

function handStats(notes: ScoreNote[]): HandStats {
  if (notes.length === 0) return { span: 0, leap: 0, range: 0 };
  const byOnset = new Map<number, number[]>();
  for (const note of notes) {
    const list = byOnset.get(note.sourceOnset);
    if (list) list.push(note.midi);
    else byOnset.set(note.sourceOnset, [note.midi]);
  }
  const onsets = [...byOnset.keys()].sort((a, b) => a - b);
  let span = 0;
  const melodic: number[] = [];
  for (const onset of onsets) {
    const midis = (byOnset.get(onset) ?? []).slice().sort((a, b) => a - b);
    // A chord's span, matching Python: only a chord has one, a single note
    // contributes nothing.
    const top = midis[midis.length - 1];
    const bottom = midis[0];
    if (top !== undefined && bottom !== undefined && midis.length > 1) {
      span = Math.max(span, top - bottom);
    }
    // Python takes the lowest note of each chord as the melodic line.
    if (bottom !== undefined) melodic.push(bottom);
  }
  let leap = 0;
  for (let i = 1; i < melodic.length; i += 1) {
    leap = Math.max(leap, Math.abs((melodic[i] as number) - (melodic[i - 1] as number)));
  }
  const pitches = notes.map((n) => n.midi);
  const highest = pitches.reduce((a, b) => Math.max(a, b), pitches[0] ?? 0);
  const lowest = pitches.reduce((a, b) => Math.min(a, b), pitches[0] ?? 0);
  return { span, leap, range: highest - lowest };
}

/**
 * Every note as printed, once.
 *
 * The model unrolls repeats — a repeated section appears twice in `steps` — and
 * Python reads the printed score, where it appears once. Deduplicating by the
 * printed key is what makes the two counts comparable.
 */
export function printedNotes(model: ScoreModel): ScoreNote[] {
  const seen = new Set<string>();
  const out: ScoreNote[] = [];
  for (const step of model.steps) {
    for (const note of step.notes) {
      const key = printedNoteKey(note);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(note);
    }
  }
  return out;
}

/**
 * The features the model reads, measured off a ScoreModel.
 *
 * Total by construction: a score with one staff, no tempo or no key signature
 * yields zeros rather than throwing, because the caller is an import screen
 * holding a file nobody has looked at.
 */
export function features(model: ScoreModel): Features {
  const notes = printedNotes(model);
  const bars = Math.max(1, model.sourceMeasureCount || 1);
  const noteCount = notes.length;

  // Split by *staff*, not by hand. Python reads music21 parts, which are
  // staves; the model's `hand` deliberately differs from the staff for a
  // cross-staff note, and following it here would swap the two hands' ranges
  // on exactly the fixtures that test cross-staff writing.
  const right = notes.filter((n) => n.staff === 1);
  const left = notes.filter((n) => n.staff === 2);
  const rightStats = handStats(right);
  const leftStats = handStats(left);

  const durations = new Set<number>();
  for (const note of notes) if (note.duration > 0) durations.add(note.duration);
  const shortest = durations.size ? Math.min(...durations) : 1;

  // Python takes the first tempo and the first time signature and treats the
  // whole piece as if they held — a rough number, but the same rough number.
  const bpm = model.tempoMap[0]?.bpm ?? 100;
  // `beats` is the numerator: 6 for 6/8. Reaching for a `numerator` field the
  // type does not have silently made every compound-time score 4/4.
  const beatsPerBar = model.timeSigMap[0]?.beats ?? 4;
  const seconds = (bars * beatsPerBar * 60) / Math.max(1, bpm);

  // music21 reports 0 voices for a measure written without explicit <voice>
  // containers, and N when there are several. A staff that never has more than
  // one voice therefore counts as 0, not 1 — worth 0.21 of a stage if it were
  // got wrong, which is more than the whole agreement budget.
  const voicesPerMeasureStaff = new Map<string, Set<number>>();
  for (const note of notes) {
    const key = `${String(note.sourceMeasureIndex)}:${String(note.staff)}`;
    const set = voicesPerMeasureStaff.get(key) ?? new Set<number>();
    set.add(note.voice);
    voicesPerMeasureStaff.set(key, set);
  }
  let maxVoices = 0;
  for (const set of voicesPerMeasureStaff.values()) maxVoices = Math.max(maxVoices, set.size);
  const voicesPerStaff = maxVoices > 1 ? maxVoices : 0;

  let black = 0;
  let ledger = 0;
  for (const note of notes) {
    if (BLACK_KEYS.has(((note.midi % 12) + 12) % 12)) black += 1;
    if (note.midi < LEDGER_LOW || note.midi > LEDGER_HIGH) ledger += 1;
  }

  return {
    bars,
    notesPerBar: noteCount / bars,
    notesPerSecond: seconds > 0 ? noteCount / seconds : 0,
    maxSimultaneousRight: 0,
    maxSimultaneousLeft: 0,
    maxSpanRight: rightStats.span,
    maxSpanLeft: leftStats.span,
    maxLeapRight: rightStats.leap,
    maxLeapLeft: leftStats.leap,
    rangeRight: rightStats.range,
    rangeLeft: leftStats.range,
    blackKeyRatio: noteCount ? black / noteCount : 0,
    keyAccidentals: keyAccidentals(model.keySig),
    shortestValue: shortest,
    voicesPerStaff,
    handCrossings: 0,
    ornaments: 0,
    ledgerRatio: noteCount ? ledger / noteCount : 0,
    distinctRhythms: durations.size,
  };
}

/** The coarse table, used until a fit meets the bar. Mirrors `fallback_level`. */
export function fallbackLevel(values: Features, model: LevelModel): LevelEstimate {
  const density = values.notesPerBar ?? 0;
  const shortest = values.shortestValue ?? 1;
  const drivers: [string, number][] = [
    ['notesPerBar', density],
    ['shortestValue', shortest],
  ];
  for (const row of model.fallback?.bins ?? []) {
    if (density <= row.maxNotesPerBar && shortest >= row.minShortestValue) {
      return { level: row.level, source: 'fallback', drivers };
    }
  }
  return { level: MAX_LEVEL, source: 'fallback', drivers };
}

/** A level in [1, 9] from the features, by the model or by the table. */
export function estimate(values: Features, model: LevelModel): LevelEstimate {
  const weights = model.weights;
  if (!weights || !model.fitted) return fallbackLevel(values, model);

  const means = model.means ?? {};
  let total = model.bias ?? 4;
  const contributions: [string, number][] = [];
  for (const [name, rawWeight] of Object.entries(weights)) {
    const weight = Number(rawWeight);
    if (!weight) continue;
    const scaled = logScale(name, values[name] ?? 0) - (means[name] ?? 0);
    const contribution = weight * scaled;
    total += contribution;
    contributions.push([name, contribution]);
  }
  contributions.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  return {
    level: Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, Math.round(total * 100) / 100)),
    source: 'model',
    drivers: contributions.slice(0, 3).map(([name, value]) => [name, Math.round(value * 1000) / 1000]),
  };
}

export function estimateFor(model: ScoreModel, levelModel: LevelModel): LevelEstimate {
  return estimate(features(model), levelModel);
}
