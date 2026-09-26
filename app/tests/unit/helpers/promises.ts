// What a sight-reading phrase is promised to contain, and by whom (T37, C2),
// shared by the two tests that hold the generator to it: the rows as they are
// (`sightReadingPromises.test.ts`) and every move the reading curriculum can
// ask of them (`generatorContract.test.ts`, C4b). Moved here from the first
// unchanged, so the two cannot drift into two definitions of one promise; each
// check now also says which demand it is about (`about`), so the contract can
// tell a promise a move drops on purpose (eighths off drops "an eighth note")
// from one it breaks.

import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { generateSightReading, type SightReadingOptions } from '../../../src/engine/sightReading';
import { extractScoreModel } from '../../../src/score/extractScoreModel';
import type { ScoreModel } from '../../../src/score/types';
import {
  detect,
  keyFifths,
  melodyLine,
  melodyStaff,
  offsetInBar,
  range,
  soundedNotes,
  type DetectorId,
} from '../../../src/demands/detect';
import type { Demand } from '../../../src/demands/vocabulary';

// --- the phrase: the model the engine plays, and the page as engraved ---------

export async function modelOf(musicXml: string, id: string): Promise<ScoreModel> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  try {
    const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
    await osmd.load(musicXml);
    return extractScoreModel(osmd, { id });
  } finally {
    container.remove();
  }
}

/** One written note or rest, for the two engraving checks only. */
export interface Engraved {
  staff: number;
  bar: number;
  /** Divisions from the start of the bar. */
  at: number;
  duration: number;
  rest: boolean;
  tuplet: boolean;
  chord: boolean;
  /** `begin`, `continue`, `end`, or null where the note has no beam. */
  beam: string | null;
}

export interface Sheet {
  notes: Engraved[];
  divisions: number;
  beats: number;
  beatType: number;
  clefs: string[];
}

export function engraving(xml: string): Sheet {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const num = (selector: string, fallback: number): number => Number(doc.querySelector(selector)?.textContent ?? fallback);
  const notes: Engraved[] = [];
  doc.querySelectorAll('measure').forEach((measure, bar) => {
    let t = 0;
    let last = 0;
    for (const child of Array.from(measure.children)) {
      const duration = Number(child.querySelector('duration')?.textContent ?? 0);
      if (child.tagName === 'backup') {
        t -= duration;
        continue;
      }
      if (child.tagName !== 'note') continue;
      const chord = child.querySelector('chord') !== null;
      notes.push({
        staff: Number(child.querySelector('staff')?.textContent ?? 1),
        bar,
        at: chord ? last : t,
        duration,
        rest: child.querySelector('rest') !== null,
        tuplet: child.querySelector('time-modification') !== null,
        chord,
        beam: child.querySelector('beam')?.textContent ?? null,
      });
      if (!chord) {
        last = t;
        t += duration;
      }
    }
  });
  return {
    notes,
    divisions: num('divisions', 12),
    beats: num('beats', 4),
    beatType: num('beat-type', 4),
    clefs: Array.from(doc.querySelectorAll('clef sign')).map((sign) => sign.textContent ?? ''),
  };
}

const compoundSheet = (s: Sheet): boolean => s.beatType === 8 && s.beats % 3 === 0;

/**
 * Short notes that share a beat share a beam (T37): two adjacent sounded notes
 * shorter than a quarter, not in a triplet, inside one beat, are joined — the
 * second is not the start of a new beam and neither is left with a flag.
 */
export function beamedByTheBeat(s: Sheet): boolean {
  const beat = compoundSheet(s) ? s.divisions * 1.5 : (s.divisions * 4) / s.beatType;
  for (const staff of [1, 2]) {
    const line = s.notes.filter((n) => n.staff === staff && !n.chord);
    for (let i = 1; i < line.length; i += 1) {
      const a = line[i - 1] as Engraved;
      const b = line[i] as Engraved;
      const short = (n: Engraved): boolean => !n.rest && !n.tuplet && n.duration < s.divisions;
      if (a.bar !== b.bar || !short(a) || !short(b)) continue;
      const beatOfNote = (n: Engraved): number => Math.floor(n.at / beat);
      const inside = (n: Engraved): boolean => beatOfNote(n) === Math.floor((n.at + n.duration - 1) / beat);
      if (!inside(a) || !inside(b) || beatOfNote(a) !== beatOfNote(b)) continue;
      if (a.beam === null || a.beam === 'end' || b.beam === null || b.beam === 'begin') return false;
    }
  }
  return true;
}

export interface Phrase {
  model: ScoreModel;
  sheet: Sheet;
  /** The generator level the row asked for (`drill.params.level`). */
  level: number;
}

/** One generated phrase, read the way the promises are checked. */
export async function phraseOf(options: SightReadingOptions, id: string): Promise<Phrase> {
  const xml = generateSightReading(options).musicXml;
  return { model: await modelOf(xml, id), sheet: engraving(xml), level: Number(options.level) };
}

export const has = (id: DetectorId) => (p: Phrase): boolean => detect(p.model, id).present;
const compound = has('compoundMetre');
export const metre = (p: Phrase): string => {
  const first = p.model.timeSigMap[0];
  return first ? `${String(first.beats)}/${String(first.beatType)}` : '4/4';
};

// --- what is promised, and by whom ---------------------------------------------

export type Check = {
  what: string;
  scope: 'every' | 'some';
  holds: (p: Phrase) => boolean;
  /** The demands the promise is about: a move that turns one of them off drops it on purpose. */
  about?: readonly string[];
};

const every = (what: string, holds: (p: Phrase) => boolean, about?: readonly string[]): Check => ({
  what,
  scope: 'every',
  holds,
  ...(about ? { about } : {}),
});
const some = (what: string, holds: (p: Phrase) => boolean, about?: readonly string[]): Check => ({
  what,
  scope: 'some',
  holds,
  ...(about ? { about } : {}),
});

/** In simple time only: a 6/8 phrase is its own new thing and is not asked for these. */
const simple = (holds: (p: Phrase) => boolean) => (p: Phrase): boolean => compound(p) || holds(p);

/**
 * Each chromatic note is a short passing or neighbour note (T37's
 * `accidentals` promise): a quarter or less, off the bar's strong beats,
 * reached by a step, and rising a semitone to the next note.
 */
function chromaticAsPassingNotes(p: Phrase): boolean {
  const staff = melodyStaff(p.model);
  const chromatic = new Set(detect(p.model, 'chromatic').at.filter((a) => a.staff === staff).map((a) => a.noteId));
  const line = melodyLine(p.model);
  const barLength = ((p.model.timeSigMap[0]?.beats ?? 4) * 4) / (p.model.timeSigMap[0]?.beatType ?? 4);
  return line.every((n, i) => {
    if (!chromatic.has(n.id)) return true;
    const next = line[i + 1];
    const before = line[i - 1];
    const step = before === undefined ? 99 : Math.abs(n.midi - before.midi);
    return (
      n.duration <= 1 &&
      offsetInBar(p.model, n) % (barLength / 2) !== 0 &&
      step >= 1 &&
      step <= 2 &&
      next?.midi === n.midi + 1
    );
  });
}

/** What a row's own `concepts` claim, read as a teacher would check it on the page. */
export const CLAIMED_BY_CONCEPT: Record<string, Check[]> = {
  steps: [every('a step', has('steps'), ['interval.step'])],
  skips: [every('a skip (a third)', has('skips'), ['interval.skip'])],
  eighths: [every('an eighth note', has('eighths'), ['rhythm.eighths', 'rhythm.shorter-than-quarter'])],
  'two-hands': [every('both hands, together', has('handsTogether'), ['texture.hands-together', 'clef.bass'])],
  'bass-clef': [
    every(
      'every note on the bass staff',
      (p) => p.sheet.clefs.includes('F') && soundedNotes(p.model, 1).length === 0 && has('bassClef')(p),
      ['clef.bass'],
    ),
  ],
  'C-position': [
    every(
      'a range inside C position',
      (p) => {
        const [low, high] = range(p.model);
        return melodyStaff(p.model) === 1 ? low >= 60 && high <= 67 : low >= 48 && high <= 55;
      },
      ['range.beyond-position'],
    ),
  ],
  syncopation: [every('syncopation (simple time)', simple(has('syncopation')), ['rhythm.syncopation'])],
  '6/8': [some('a phrase in 6/8', (p) => metre(p) === '6/8', ['metre.compound'])],
  triplets: [every('a triplet (simple time)', simple(has('triplets')), ['rhythm.triplets'])],
  keys: [
    some('a key signature', (p) => keyFifths(p.model) !== 0, ['key.signature']),
    some('a sharp key', (p) => keyFifths(p.model) > 0, ['key.signature']),
    some('a flat key', (p) => keyFifths(p.model) < 0, ['key.signature']),
  ],
  accidentals: [
    every('an accidental', has('chromatic'), ['pitch.chromatic']),
    every(
      'each accidental a short note off the strong beats, reached by step, rising a semitone',
      chromaticAsPassingNotes,
      ['pitch.chromatic'],
    ),
  ],
  sixteenths: [every('a sixteenth', has('sixteenths'), ['rhythm.sixteenths'])],
  'walking-bass': [every('a walking bass', has('walkingBass'), ['texture.walking-bass'])],
  'accompaniment-patterns': [every('a left-hand pattern', has('leftHandPattern'), ['texture.left-hand-pattern'])],
};

/**
 * What each rung's lesson says its sight-reading drill trains. Only rungs that
 * say something about the phrases are here; a rung that lists the drill and
 * says nothing about it promises nothing beyond the row's own tags.
 */
export const PROMISED_BY_RUNG: Record<string, Check[]> = {
  // 1.3: "a fresh four-bar phrase in the bass clef … one finger per key".
  '1.3': [...(CLAIMED_BY_CONCEPT['bass-clef'] ?? []), ...(CLAIMED_BY_CONCEPT['C-position'] ?? [])],
  // 1.5: *Steps and skips*; "every interval is a 2nd or a 3rd and the hand
  // never leaves C position".
  '1.5': [
    ...(CLAIMED_BY_CONCEPT.steps ?? []),
    ...(CLAIMED_BY_CONCEPT.skips ?? []),
    every('only steps and skips', (p) => !has('leaps')(p), ['interval.leap']),
    ...(CLAIMED_BY_CONCEPT['C-position'] ?? []),
  ],
  // 2.2: "eighths can turn up in the very first one"; and its concept `beams`
  // — "the beaming is a kindness: it groups the notes into beats".
  '2.2': [
    ...(CLAIMED_BY_CONCEPT.eighths ?? []),
    every('eighths beamed in their beats', (p) => p.sheet.notes.some((n) => n.beam !== null), ['rhythm.eighths', 'rhythm.shorter-than-quarter']),
  ],
  // 2.5: "its phrases already reach up to the C above middle C, beyond C position".
  '2.5': [
    some('a phrase beyond C position', (p) => range(p.model)[1] > 67, ['range.beyond-position']),
    every('nothing above the C above middle C', (p) => range(p.model)[1] <= 72),
  ],
  // 3.4: "sight-reading level 2 (two hands, wider range, quarters and eighths)".
  '3.4': [...(CLAIMED_BY_CONCEPT['two-hands'] ?? []), ...(CLAIMED_BY_CONCEPT.eighths ?? [])],
  // 4.5: *Compound time, triplets and syncopation*; "sight-reading level 3".
  '4.5': [
    ...(CLAIMED_BY_CONCEPT['6/8'] ?? []),
    some('a phrase in 4/4 beside the 6/8 ones', (p) => metre(p) === '4/4', ['metre.compound']),
    ...(CLAIMED_BY_CONCEPT.triplets ?? []),
    ...(CLAIMED_BY_CONCEPT.syncopation ?? []),
  ],
  // theory.9: "The sight-reading generator at level 7 makes music … in keys
  // with four accidentals, with triplets and a walking bass". The rung also
  // lists level 6, whose left hand is a broken chord in quarters: the walking
  // bass is the level-7 row's, which is what the sentence says. (The helper
  // this used to call counted any four left-hand quarters as a walk, so level
  // 6 passed it on a broken chord.)
  'theory.9': [
    some('a key with four accidentals', (p) => Math.abs(keyFifths(p.model)) === 4, ['key.signature']),
    ...(CLAIMED_BY_CONCEPT.triplets ?? []),
    every('a walking bass, at the level the lesson names (7)', (p) => p.level !== 7 || has('walkingBass')(p), ['texture.walking-bass']),
  ],
};

/**
 * Every demand a rung has not taught, as checks a phrase must pass (C2's
 * `unintended()`): each demand whose `taughtAt` comes after the rung in the
 * curriculum's order, and every demand no rung teaches (`taughtAt: null`,
 * S23: "never teach wrong" — a demand nothing teaches is not written); and 4/4
 * only before 4.5. `skip` names demands a caller knows arrive early.
 */
export function untaughtChecks(
  rung: string,
  order: readonly string[],
  demands: readonly Demand[],
  skip: (demand: string) => boolean = () => false,
): Check[] {
  const at = (id: string): number => order.indexOf(id);
  const before = (other: string): boolean => at(rung) < at(other);
  return [
    ...demands
      .filter((d) => d.taughtAt === null || before(d.taughtAt))
      .filter((d) => !skip(d.id))
      .map((d) =>
        every(`no ${d.id} (taught at ${String(d.taughtAt)})`, (p) => !has(d.detector)(p), [d.id]),
      ),
    ...(before('4.5')
      ? [every('4/4 only (before 4.5)', (p) => p.model.timeSigMap.every((t) => t.beats === 4 && t.beatType === 4), ['metre.compound'])]
      : []),
  ];
}
