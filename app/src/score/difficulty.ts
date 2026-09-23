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
 * Four features Python measures are reported here as zero, because OSMD gives
 * us notes rather than expressions and the ScoreModel has no note-against-note
 * register comparison: `ornaments`, `handCrossings`, `maxSimultaneousRight` and
 * `maxSimultaneousLeft`. Three of the four carry no weight at all in the
 * committed fit and cost nothing. `ornaments` is no longer one of them — the
 * 2026-09-22 refit gives it +0.0175, so an ornament-heavy piece reads low here
 * by `0.0175 * log1p(ornaments)`, which is under a tenth of a stage on the most
 * ornamented anchor in the calibration set. If a future fit gives any of the
 * four a real weight, the agreement test is what will notice.
 *
 * **The crossing floor has no counterpart on this side.** `difficulty.py` takes
 * the right hand's lowest note at an offset across every voice sounding there,
 * so that a two-voice staff cannot hand the crossing count whichever voice
 * music21 happened to walk last. Here `handCrossings` is the constant zero, so
 * there is no floor to get right; the rule is recorded rather than ported, and
 * porting it would mean adding a feature the model does not weigh.
 *
 * Two of the 42 fixtures still measure a *feature* differently — six cells in
 * all, enumerated because a future reader will otherwise rediscover them:
 *
 *   - **Ties.** music21 counts a tied continuation as a note; the ScoreModel
 *     merges tie chains into the first note. `chords-ties` reads `notesPerBar`
 *     4 here against 5 there, and `notesPerSecond` 1.5 against 1.875.
 *   - **Grace notes.** music21 gives them zero duration, so they drop out of
 *     `shortestValue` and out of the chord they are printed against; OSMD gives
 *     them a real duration at the same onset as the note they decorate. On
 *     `pickup-grace` that is `shortestValue` 0.5 here against 1,
 *     `distinctRhythms` 2 against 1, `maxSpanRight` 13 against 0 — the grace
 *     note and its principal read as a chord — and `maxLeapRight` 15 against 13.
 *
 * The two that used to be on this list are gone, and they are named because a
 * list that only ever grows stops being read: **voices in one staff** is the
 * fix below in `handStats` and `two-voices` and `cross-staff` now agree on span,
 * leap and range to the note; **an inferred key** is `fingering-rests`, which
 * no longer disagrees on `keyAccidentals`. Both were re-measured across all 42
 * fixtures rather than taken from this comment.
 *
 * Neither remaining difference moves the *level* by more than 0.2, which is the
 * number that matters and the number the test holds.
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
 * `extractScoreModel` stores the *name*, and the feature is the number of
 * sharps or flats. Inverting the table is smaller and clearer than threading a
 * second field through the model.
 *
 * Both spellings, and that is the whole point of `tonicKey`. These tables were
 * written as "E-flat" and "F-sharp"; `keySignatureName`, which is what actually
 * fills `model.keySig`, writes "Eb" and "F#". So every key with an accidental
 * in it — sixteen of the thirty signatures, every flat key and every sharp key
 * — looked up nothing and scored **zero** accidentals, which is what C major
 * scores. A piece in D flat was fed to the level model as though it had no
 * black notes in its signature at all.
 *
 * It survived because the unit test called this function with "E-flat major",
 * a string nothing produces. A test that writes its own input cannot find a
 * disagreement between two modules about what the input is; the round-trip
 * test beside it now goes through `keySignatureName`, so the two vocabularies
 * are checked against each other rather than against a third one.
 */
const FIFTHS_BY_TONIC: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F-sharp': 6, 'C-sharp': 7,
  F: 1, 'B-flat': 2, 'E-flat': 3, 'A-flat': 4, 'D-flat': 5, 'G-flat': 6, 'C-flat': 7,
};

const FIFTHS_BY_MINOR_TONIC: Record<string, number> = {
  A: 0, E: 1, B: 2, 'F-sharp': 3, 'C-sharp': 4, 'G-sharp': 5, 'D-sharp': 6, 'A-sharp': 7,
  D: 1, G: 2, C: 3, F: 4, 'B-flat': 5, 'E-flat': 6, 'A-flat': 7,
};

/** "Eb" and "E-flat" are the same key; the tables are written the long way. */
function tonicKey(tonic: string): string {
  return tonic.replace(/^([A-G])(?:b|♭)$/, '$1-flat').replace(/^([A-G])(?:#|♯)$/, '$1-sharp');
}

export function keyAccidentals(keySig: string | undefined): number {
  if (!keySig) return 0;
  // The mode has to be read first. "A minor" has no accidentals; A *major* has
  // three, and looking the tonic up in the major table regardless of mode
  // hands every minor-key exercise three sharps it does not have — worth
  // 0.53 of a stage, which is most of the agreement budget on its own.
  const minor = /(?:^|\s)minor\s*$/i.test(keySig);
  const tonic = keySig.replace(/\s+(major|minor)\s*$/i, '').trim();
  const table = minor ? FIFTHS_BY_MINOR_TONIC : FIFTHS_BY_TONIC;
  return table[tonicKey(tonic)] ?? 0;
}

interface HandStats {
  span: number;
  leap: number;
  range: number;
}

/**
 * Span, leap and range for one staff, its voices measured as separate lines.
 *
 * **Two voices sharing a staff are two lines, not one hand's worth of music.**
 * Grouping every note on the staff by its onset ran them together twice over.
 * A note in voice 1 and a note in voice 2 sounding at the same moment read as a
 * chord — on the `two-voices` fixture that is a seven-semitone hand on the upper
 * staff and a four-semitone one on the lower, and neither is a chord anybody
 * plays — and the melodic line stepped out of one voice and into the other,
 * which is a leap nobody plays either.
 *
 * This is `voice_lines` in `tools/content/difficulty.py`, ported. Both sides
 * split by **staff**, not by the hand `extractScoreModel` infers: Python reads
 * music21 parts and has only the staff to go on, the two implementations have to
 * agree to within 0.2 of a stage, and following `hand` here alone would break
 * that. A voice printed on the other staff is measured with the staff it is
 * printed on, which is a known difference between the page and the playing.
 *
 * `range` is deliberately *not* per voice: Python accumulates its pitches
 * outside the per-voice loop, because the lowest and highest note a hand has to
 * reach is a fact about the hand and not about one of its lines.
 */
function handStats(notes: ScoreNote[]): HandStats {
  if (notes.length === 0) return { span: 0, leap: 0, range: 0 };
  const byVoice = new Map<number, Map<number, number[]>>();
  for (const note of notes) {
    let onsets = byVoice.get(note.voice);
    if (!onsets) {
      onsets = new Map<number, number[]>();
      byVoice.set(note.voice, onsets);
    }
    const list = onsets.get(note.sourceOnset);
    if (list) list.push(note.midi);
    else onsets.set(note.sourceOnset, [note.midi]);
  }
  let span = 0;
  let leap = 0;
  for (const byOnset of byVoice.values()) {
    const onsets = [...byOnset.keys()].sort((a, b) => a - b);
    const melodic: number[] = [];
    for (const onset of onsets) {
      const midis = (byOnset.get(onset) ?? []).slice().sort((a, b) => a - b);
      // A chord's span, matching Python: only a chord has one, a single note
      // contributes nothing. A music21 Chord belongs to one voice, which is
      // what this grouping now says too.
      const top = midis[midis.length - 1];
      const bottom = midis[0];
      if (top !== undefined && bottom !== undefined && midis.length > 1) {
        span = Math.max(span, top - bottom);
      }
      // Python takes the lowest note of each chord as the melodic line.
      if (bottom !== undefined) melodic.push(bottom);
    }
    for (let i = 1; i < melodic.length; i += 1) {
      leap = Math.max(leap, Math.abs((melodic[i] as number) - (melodic[i - 1] as number)));
    }
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
  // **A printed chord symbol is not a sounding note.** This is `sounding()` in
  // `tools/content/difficulty.py`, ported: nobody plays the `C`, `F` or `G7`
  // printed over a lead sheet, it is a name for a harmony the player voices
  // themselves, and music21 was handing it to Python from
  // `recurse().notes` as a three- or four-note chord — four simultaneous notes,
  // a ten-semitone hand and a twenty-one-semitone leap on a sixteen-bar
  // single-line melody.
  //
  // On this side the rule holds by construction rather than by subtraction, and
  // that was measured rather than assumed: OSMD parses `<harmony>` into a chord
  // symbol container hung off the source measure, never into a voice entry, so
  // `extractScoreModel`'s walk over `CurrentVisibleVoiceEntries()` cannot see
  // one. A two-bar single-staff lead sheet carrying three chord symbols over
  // five melody notes yields five `ScoreNote`s, `maxSpanRight` 0,
  // `maxSimultaneousRight` 0 and `notesPerBar` 2.5. `printedNotes` is therefore
  // the whole of the filter, and the test named for this rule in
  // `difficulty.test.ts` is what will notice if a future change to the
  // extractor starts letting symbols through into `steps[].notes`.
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
