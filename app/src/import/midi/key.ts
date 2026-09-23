/**
 * The key: estimating it, choosing between it and its relative, and spelling in it.
 *
 * The ports of `key_estimate`, `relative_by_ending` and `spell_in_key`. The
 * first is the only place the Python leans on music21 for a *judgement* rather
 * than for bookkeeping, so it is the only place this file has to reproduce an
 * algorithm rather than a rule:
 *
 * **`stream.analyze('key')` is the Aarden–Essen profile**, not Krumhansl —
 * music21 dispatches the word "key" to `AardenEssen` (read out of
 * `music21.analysis.discrete`, whose own docstring states it). The method: add
 * up how long each of the twelve pitch classes sounds, take the correlation
 * coefficient between that histogram and the profile rotated to each of the
 * twelve tonics, for major and for minor, and answer with the highest. The
 * weights below are that module's, copied rather than re-derived.
 *
 * A key estimate is a guess and is reported as one; `--key` overrules it in the
 * tool, and the app's sheet shows what was chosen.
 */
import type { NoteEvent } from './readMidi';
import { lengthOf } from './readMidi';
import { type Frac, cmp, toNumber } from './fraction';

export type Mode = 'major' | 'minor';

export interface EstimatedKey {
  /** `C`, `E-`, `F#` — music21's spelling, with `-` for a flat. */
  tonic: string;
  mode: Mode;
  /** Sharps positive, flats negative, as in MusicXML `<fifths>`. */
  fifths: number;
}

/** music21's `analysis.discrete.AardenEssen` weights. */
const AARDEN_MAJOR = [
  17.7661, 0.145624, 14.9265, 0.160186, 19.8049, 11.3587, 0.291248, 22.062, 0.145624, 8.15494,
  0.232998, 4.95122,
];
const AARDEN_MINOR = [
  18.2648, 0.737619, 14.0499, 16.8599, 0.702494, 14.4362, 0.702494, 18.6161, 4.56621, 1.93186,
  7.37619, 1.75623,
];

/**
 * How a pitch class is named when it is the tonic of a major or a minor key.
 *
 * music21 builds the answer as `Pitch(pitchClass)` and then flips it if that
 * name is not one a key is written with: the twelve default names are all
 * valid minor tonics, and the one that is not a valid major tonic is G sharp,
 * which becomes A flat.
 */
const MAJOR_TONIC = ['C', 'C#', 'D', 'E-', 'E', 'F', 'F#', 'G', 'A-', 'A', 'B-', 'B'];
const MINOR_TONIC = ['C', 'C#', 'D', 'E-', 'E', 'F', 'F#', 'G', 'G#', 'A', 'B-', 'B'];

/** The key signature each tonic takes, by name, as `<fifths>`. */
const MAJOR_FIFTHS: Record<string, number> = {
  'C-': -7, 'G-': -6, 'D-': -5, 'A-': -4, 'E-': -3, 'B-': -2, F: -1, C: 0,
  G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
};
const MINOR_FIFTHS: Record<string, number> = {
  'A-': -7, 'E-': -6, 'B-': -5, F: -4, C: -3, G: -2, D: -1, A: 0,
  E: 1, B: 2, 'F#': 3, 'C#': 4, 'G#': 5, 'D#': 6, 'A#': 7,
};
const MAJOR_BY_FIFTHS = Object.fromEntries(
  Object.entries(MAJOR_FIFTHS).map(([name, fifths]) => [fifths, name]),
) as Record<number, string>;
const MINOR_BY_FIFTHS = Object.fromEntries(
  Object.entries(MINOR_FIFTHS).map(([name, fifths]) => [fifths, name]),
) as Record<number, string>;

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

/** A name like `E-` or `F#` as its letter, its alteration and its pitch class. */
export function readName(name: string): { letter: string; alter: number; pitchClass: number } {
  const letter = name[0] ?? 'C';
  let alter = 0;
  for (const mark of name.slice(1)) {
    if (mark === '#') alter += 1;
    else if (mark === '-' || mark === 'b') alter -= 1;
  }
  const natural = LETTER_SEMITONES[LETTERS.indexOf(letter)] ?? 0;
  return { letter, alter, pitchClass: (((natural + alter) % 12) + 12) % 12 };
}

export const fifthsFor = (tonic: string, mode: Mode): number =>
  (mode === 'major' ? MAJOR_FIFTHS[tonic] : MINOR_FIFTHS[tonic]) ?? 0;

export function keyOf(tonic: string, mode: Mode): EstimatedKey {
  return { tonic, mode, fifths: fifthsFor(tonic, mode) };
}

/** music21's `Key.relative`: the same key signature, the other mode. */
export function relativeOf(key: EstimatedKey): EstimatedKey {
  const mode: Mode = key.mode === 'major' ? 'minor' : 'major';
  const tonic = (mode === 'major' ? MAJOR_BY_FIFTHS : MINOR_BY_FIFTHS)[key.fifths] ?? key.tonic;
  return { tonic, mode, fifths: key.fifths };
}

function correlations(histogram: number[], weights: number[]): number[] {
  const profileAverage = weights.reduce((a, b) => a + b, 0) / weights.length;
  const histogramAverage = histogram.reduce((a, b) => a + b, 0) / histogram.length;
  const out: number[] = [];
  for (let i = 0; i < 12; i += 1) {
    let top = 0;
    let bottomRight = 0;
    let bottomLeft = 0;
    let solution = 0;
    for (let j = 0; j < 12; j += 1) {
      const weight = (weights[(((j - i) % 12) + 12) % 12] ?? 0) - profileAverage;
      const share = (histogram[j] ?? 0) - histogramAverage;
      top += weight * share;
      bottomRight += weight * weight;
      bottomLeft += share * share;
      solution = bottomRight === 0 || bottomLeft === 0 ? 0 : top / Math.sqrt(bottomRight * bottomLeft);
    }
    out.push(solution);
  }
  return out;
}

/**
 * The key the notes suggest, weighted by how long each sounds.
 *
 * Built with the real onsets and lengths because the analysis weights a pitch
 * class by how long it sounds; counting each note once would give a passing
 * sixteenth the same say as a held bass.
 */
export function keyEstimate(events: NoteEvent[]): EstimatedKey {
  if (events.length === 0) return keyOf('C', 'major');
  const histogram = new Array<number>(12).fill(0);
  // The order music21 sums in: by offset, and by the order they were inserted
  // within an offset. Only the last bits of a float depend on it, but a port
  // that reorders a float sum is a port that disagrees at a tie.
  const ordered = [...events].sort((a, b) => cmp(a.start, b.start));
  for (const event of ordered) {
    const pitchClass = ((event.midi % 12) + 12) % 12;
    histogram[pitchClass] = (histogram[pitchClass] ?? 0) + toNumber(lengthOf(event));
  }
  const major = correlations(histogram, AARDEN_MAJOR);
  const minor = correlations(histogram, AARDEN_MINOR);

  let best: { coefficient: number; pitchClass: number; mode: Mode } | null = null;
  for (const [mode, values] of [
    ['major', major],
    ['minor', minor],
  ] as const) {
    values.forEach((coefficient, pitchClass) => {
      // Python sorts the whole list ascending and takes the last, so the
      // highest coefficient wins and an exact tie goes to the higher pitch
      // class, then to minor over major.
      const better =
        best === null ||
        coefficient > best.coefficient ||
        (coefficient === best.coefficient &&
          (pitchClass > best.pitchClass ||
            (pitchClass === best.pitchClass && mode === 'minor' && best.mode === 'major')));
      if (better) best = { coefficient, pitchClass, mode };
    });
  }
  const chosen = best as { coefficient: number; pitchClass: number; mode: Mode } | null;
  if (chosen === null) return keyOf('C', 'major');
  const names = chosen.mode === 'major' ? MAJOR_TONIC : MINOR_TONIC;
  return keyOf(names[chosen.pitchClass] ?? 'C', chosen.mode);
}

/**
 * The estimate, or its relative major/minor if that is where the music ends.
 *
 * A key estimate from how often each note sounds cannot tell a key from its
 * relative — the A blues scale and C major share most of their notes. The
 * lowest note of the last chord is the tiebreak a musician would use.
 */
export function relativeByEnding(events: NoteEvent[], estimate: EstimatedKey): EstimatedKey {
  if (events.length === 0) return estimate;
  let lastStart: Frac = events[0]?.start ?? { n: 0n, d: 1n };
  for (const event of events) if (cmp(event.start, lastStart) > 0) lastStart = event.start;
  let bass = Infinity;
  for (const event of events) {
    if (cmp(event.start, lastStart) === 0) bass = Math.min(bass, event.midi);
  }
  const bassClass = ((bass % 12) + 12) % 12;
  const relative = relativeOf(estimate);
  if (
    bassClass === readName(relative.tonic).pitchClass &&
    bassClass !== readName(estimate.tonic).pitchClass
  ) {
    return relative;
  }
  return estimate;
}

/**
 * How each of the twelve pitch classes above the tonic is spelled, as an
 * interval. The seven notes of the scale take the key's own names. The five
 * chromatic ones follow common practice for a melody line: in a major key the
 * raised tonic (C sharp in C), the flat third, the raised fourth, the flat
 * sixth and the flat seventh — the blues notes of C are E flat, F sharp and B
 * flat — and in a minor key the flat second, the raised third and fourth, and
 * the raised sixth and seventh of the melodic and harmonic minor.
 */
const SPELLING: Record<Mode, [number, number][]> = {
  // [letter steps above the tonic, semitones above the tonic]
  major: [[0, 0], [0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [3, 6], [4, 7], [5, 8], [5, 9], [6, 10], [6, 11]],
  minor: [[0, 0], [1, 1], [1, 2], [2, 3], [2, 4], [3, 5], [3, 6], [4, 7], [5, 8], [5, 9], [6, 10], [6, 11]],
};

/**
 * music21's `simplifyEnharmonic(mostCommon=True)`: the spelling a reader
 * expects when neither key nor context says otherwise.
 */
const MOST_COMMON = ['C', 'C#', 'D', 'E-', 'E', 'F', 'F#', 'G', 'A-', 'A', 'B-', 'B'];

/**
 * How a key spells each of the twelve pitch classes: `{ step, alter }` by class.
 *
 * The sound never changes — only the name. Where the interval above the tonic
 * would need a double sharp or flat (a raised fourth in F sharp major, say),
 * the simpler of the note's two names is used instead, which is what the
 * Python does with `simplifyEnharmonic`.
 */
export function spellingFor(key: EstimatedKey): Record<number, { step: string; alter: number }> {
  const tonic = readName(key.tonic);
  const tonicLetter = LETTERS.indexOf(tonic.letter);
  const out: Record<number, { step: string; alter: number }> = {};
  for (let step = 0; step < 12; step += 1) {
    const [letterSteps, semitones] = SPELLING[key.mode][step] ?? [0, 0];
    const letterIndex = (tonicLetter + letterSteps) % 7;
    const letter = LETTERS[letterIndex] ?? 'C';
    const natural = LETTER_SEMITONES[letterIndex] ?? 0;
    const sounding = (tonic.pitchClass + semitones) % 12;
    let alter = (((sounding - natural + 18) % 12) - 6);
    let name = letter;
    if (Math.abs(alter) > 1) {
      const common = readName(MOST_COMMON[sounding] ?? 'C');
      name = common.letter;
      alter = common.alter;
    }
    out[sounding] = { step: name, alter };
  }
  return out;
}
