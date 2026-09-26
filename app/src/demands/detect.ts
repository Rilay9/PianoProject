/**
 * The demand detectors: one definition of each musical fact vocabulary v0
 * names (C2; design 2026-09-26 §1, §7).
 *
 * A *material demand* is something the notation contains, found here and
 * located in steps and staves: triplet eighths in bar 3, a skip in the left
 * hand, a note on a ledger line. A person never types one. The vocabulary
 * (`content/curriculum/vocabulary/demands.json`) says which demands exist,
 * which detector finds each, which skill copes with it and which rung teaches
 * it; this module is the detectors, and nothing else in the tree may define
 * the same fact again.
 *
 * **They read the score model, never the MusicXML.** The model is what the
 * engine plays and what the evidence function will attribute a run to, so a
 * demand found here is a demand at a step the learner was asked to play. It
 * carries what the page writes where a detector needs it: the written parts of
 * a tie chain (`tiedDurations`), the tuplet (`tuplet`), the accidental as
 * written (`accidental`, T41). Two facts it does not carry, and which these
 * detectors therefore assume:
 *
 * - **The clef.** Staff 1 is read as the treble clef and staff 2 as the bass,
 *   which the sight-reading writer guarantees and a grand staff almost always
 *   has. A one-staff part in the bass clef, or a clef change, reads wrong in
 *   `bassClef` and `ledgerLines` — E's work, before repertoire carries demands.
 * - **A key change.** The model keeps the first key (`keySig`). `keySignature`
 *   and `chromatic` judge every note against it.
 *
 * Grace notes are never counted: they are ornaments (E), and OSMD gives them a
 * duration they do not have on the page. Rests are not on the model; the one
 * detector that needs one (a bar opening on a rest, for syncopation) finds it
 * as the gap before a bar's first note.
 *
 * A detector returns an `Opportunity`: whether the demand is present and where.
 * It says what the page asks; it is never evidence that anyone did it.
 */
import { ACCIDENTAL_SEMITONES, timeSignatureAt, type ScoreModelData, type ScoreNote } from '../score/types';
import { keySignatureName } from '../score/extractScoreModel';

export const DETECTOR_IDS = [
  'bassClef',
  'ledgerLines',
  'steps',
  'skips',
  'leaps',
  'eighths',
  'shorterThanQuarter',
  'sixteenths',
  'dottedQuarters',
  'ties',
  'syncopation',
  'triplets',
  'compoundMetre',
  'keySignature',
  'chromatic',
  'beyondPosition',
  'handsTogether',
  'leftHandPattern',
  'walkingBass',
] as const;
export type DetectorId = (typeof DETECTOR_IDS)[number];

/** One place a demand occurs: the step the learner meets it at, and the note. */
export interface DemandAt {
  /** `ScoreStep.index`. */
  step: number;
  noteId: string;
  /** Unrolled measure index. */
  measure: number;
  staff: 1 | 2;
}

/** What a detector found. Never evidence: only where to look. */
export interface Opportunity {
  detector: DetectorId;
  present: boolean;
  at: DemandAt[];
}

export type Detector = (model: ScoreModelData) => Opportunity;

// --- the notes, as the page writes them ------------------------------------------

interface Placed {
  note: ScoreNote;
  step: number;
}

/** Every sounded note, grace notes left out, in step order. */
function placed(model: ScoreModelData): Placed[] {
  const out: Placed[] = [];
  for (const step of model.steps) {
    for (const note of step.notes) if (note.graceNote !== true) out.push({ note, step: step.index });
  }
  return out;
}

const locate = (p: Placed): DemandAt => ({ step: p.step, noteId: p.note.id, measure: p.note.measureIndex, staff: p.note.staff });

function found(detector: DetectorId, at: DemandAt[], present = at.length > 0): Opportunity {
  return { detector, present, at };
}

/** Every note the staff sounds (grace notes left out), in step order. */
export function soundedNotes(model: ScoreModelData, staff?: 1 | 2): ScoreNote[] {
  return placed(model)
    .map((p) => p.note)
    .filter((n) => staff === undefined || n.staff === staff);
}

/** The written parts of a note: the tie chain's, or the note's own length. */
const parts = (note: ScoreNote): number[] => note.tiedDurations ?? [note.duration];

const EPSILON = 1e-6;
const same = (a: number, b: number): boolean => Math.abs(a - b) < EPSILON;

/** The time signature over a measure, 4/4 where the model has none. */
function metreAt(model: ScoreModelData, measure: number): { beats: number; beatType: number } {
  return timeSignatureAt(model.timeSigMap, measure) ?? { beats: 4, beatType: 4 };
}

/** Beats of three eighths: the generator's own rule (`sightReading.ts`), 3/8 included. */
function isCompound(metre: { beats: number; beatType: number }): boolean {
  return metre.beatType === 8 && metre.beats % 3 === 0;
}

/** The felt beat, in quarter-note beats: a dotted quarter in compound time. */
function beatLength(metre: { beats: number; beatType: number }): number {
  return isCompound(metre) ? 1.5 : 4 / metre.beatType;
}

function barLength(metre: { beats: number; beatType: number }): number {
  return (metre.beats * 4) / metre.beatType;
}

/**
 * Where each unrolled measure starts, in beats. A pickup bar starts where a
 * full bar would have, so its notes sit on the beats they are counted on.
 */
function barStarts(model: ScoreModelData): Map<number, number> {
  const starts = new Map<number, number>();
  for (const step of model.steps) {
    if (step.isMeasureStart && !starts.has(step.measureIndex)) starts.set(step.measureIndex, step.onset);
  }
  if (model.pickup === true && starts.has(0) && starts.has(1)) {
    starts.set(0, (starts.get(1) ?? 0) - barLength(metreAt(model, 0)));
  }
  return starts;
}

/** Beats from the start of its bar to the note. */
export function offsetInBar(model: ScoreModelData, note: ScoreNote): number {
  const start = barStarts(model).get(note.measureIndex) ?? 0;
  return note.onset - start;
}

// --- the written pitch -------------------------------------------------------------

const LETTER_OF_PC: Readonly<Record<number, number>> = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };
/** Letters as indexes C D E F G A B = 0..6. */
const SHARPS_ORDER = [3, 0, 4, 1, 5, 2, 6]; // F C G D A E B
const FLATS_ORDER = [6, 2, 5, 1, 4, 0, 3]; // B E A D G C F
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

const mod = (n: number, m: number): number => ((n % m) + m) % m;

interface Written {
  /** C = 0 … B = 6. */
  letter: number;
  alter: number;
  /** Staff position: octave × 7 + letter. Middle C is 28. */
  position: number;
  /** False for a black key with no spelling (a hand-built model). */
  spelled: boolean;
}

/**
 * The note as written: its letter, its alter, its place on the staff (T41's
 * `accidental`). A black key with no spelling is read as a sharp, and marked.
 */
function written(note: ScoreNote): Written {
  const alter = note.accidental === undefined ? 0 : ACCIDENTAL_SEMITONES[note.accidental];
  let natural = note.midi - alter;
  let letter = LETTER_OF_PC[mod(natural, 12)];
  let spelled = true;
  let a = alter;
  if (letter === undefined) {
    natural -= 1;
    a = alter + 1;
    letter = LETTER_OF_PC[mod(natural, 12)] ?? 0;
    spelled = false;
  }
  const octave = Math.floor(natural / 12) - 1;
  return { letter, alter: a, position: octave * 7 + letter, spelled };
}

/**
 * The key signature as sharps (positive) or flats (negative), read back from
 * the model's `keySig` through the extractor's own table, so the name and the
 * number cannot disagree. Zero where the model has no key.
 */
export function keyFifths(model: ScoreModelData): number {
  const name = model.keySig;
  if (name === undefined) return 0;
  for (let fifths = -7; fifths <= 7; fifths += 1) {
    if (keySignatureName(fifths, 0) === name || keySignatureName(fifths, 1) === name) return fifths;
  }
  return 0;
}

/** How the key signature alters a letter: +1, -1 or 0. */
function keyAlter(letter: number, fifths: number): number {
  if (fifths > 0) return SHARPS_ORDER.slice(0, fifths).includes(letter) ? 1 : 0;
  if (fifths < 0) return FLATS_ORDER.slice(0, -fifths).includes(letter) ? -1 : 0;
  return 0;
}

// --- lines ---------------------------------------------------------------------

/** The staff the melody is on: the upper one when it plays, else the lower. */
export function melodyStaff(model: ScoreModelData): 1 | 2 {
  return soundedNotes(model, 1).length > 0 ? 1 : 2;
}

/**
 * One staff as a line: one note per onset, the top of a chord on the upper
 * staff and the bottom on the lower, in time order. A tie chain is one note.
 */
function lineOf(model: ScoreModelData, staff: 1 | 2): Placed[] {
  const byOnset = new Map<number, Placed>();
  for (const p of placed(model)) {
    if (p.note.staff !== staff) continue;
    const held = byOnset.get(p.note.onset);
    const better = held === undefined || (staff === 1 ? p.note.midi > held.note.midi : p.note.midi < held.note.midi);
    if (better) byOnset.set(p.note.onset, p);
  }
  return [...byOnset.values()].sort((a, b) => a.note.onset - b.note.onset);
}

/** The melody, as a line (see `melodyStaff`). */
export function melodyLine(model: ScoreModelData): ScoreNote[] {
  return lineOf(model, melodyStaff(model)).map((p) => p.note);
}

/** Lowest and highest MIDI number of the melody. */
export function range(model: ScoreModelData): [number, number] {
  const pitches = melodyLine(model).map((n) => n.midi);
  return [Math.min(...pitches), Math.max(...pitches)];
}

/** Each melodic interval in either staff, in staff positions (a step is 1). */
function intervals(model: ScoreModelData): { size: number; to: Placed }[] {
  const out: { size: number; to: Placed }[] = [];
  for (const staff of [1, 2] as const) {
    const line = lineOf(model, staff);
    for (let i = 1; i < line.length; i += 1) {
      const a = line[i - 1] as Placed;
      const b = line[i] as Placed;
      out.push({ size: Math.abs(written(b.note).position - written(a.note).position), to: b });
    }
  }
  return out;
}

/** True when a line comes back to a pitch it has moved away from (a repeated note is not moving away). */
function turnsBack(pitches: number[]): boolean {
  const left = new Set<number>();
  for (let i = 1; i < pitches.length; i += 1) {
    const before = pitches[i - 1] as number;
    const here = pitches[i] as number;
    if (here === before) continue;
    left.add(before);
    if (left.has(here)) return true;
  }
  return false;
}

// --- the detectors -----------------------------------------------------------------

/** A second on the staff: C to D, C♯ to D, E to F. */
const LEAP_FROM = 3;

/** A five-finger position spans a fifth: seven semitones from thumb to fifth finger. */
const POSITION_SPAN = 7;

/** Staff positions of the lines a ledger line starts beyond (middle C is 28). */
const TREBLE_LEDGER_BELOW = 27; // B3 and lower; middle C left out
const TREBLE_LEDGER_ABOVE = 40; // A5 and higher
const BASS_LEDGER_BELOW = 16; // E2 and lower
const BASS_LEDGER_ABOVE = 29; // D4 and higher; middle C left out

export const DETECTORS: Readonly<Record<DetectorId, Detector>> = {
  /** A note on the bass staff (staff 2; see the module note on clefs). */
  bassClef: (m) => found('bassClef', placed(m).filter((p) => p.note.staff === 2).map(locate)),

  /**
   * A note that needs a ledger line, other than middle C's: middle C is the
   * first landmark a learner reads (1.1, 1.3) and the ledger-line skill is the
   * lines beyond it (3.4, "both hands away from middle C"). Read from the
   * written letter, so B♯3 hangs under middle C's line and C♭4 sits on it.
   */
  ledgerLines: (m) =>
    found(
      'ledgerLines',
      placed(m)
        .filter((p) => {
          const at = written(p.note).position;
          return p.note.staff === 1
            ? at <= TREBLE_LEDGER_BELOW || at >= TREBLE_LEDGER_ABOVE
            : at <= BASS_LEDGER_BELOW || at >= BASS_LEDGER_ABOVE;
        })
        .map(locate),
    ),

  /** A step, counted on the staff: letters one apart, whatever the accidentals. */
  steps: (m) => found('steps', intervals(m).filter((i) => i.size === 1).map((i) => locate(i.to))),

  /** A skip: a third on the staff (C to E, D♯ to F). */
  skips: (m) => found('skips', intervals(m).filter((i) => i.size === 2).map((i) => locate(i.to))),

  /** A leap: a fourth or wider on the staff. */
  leaps: (m) => found('leaps', intervals(m).filter((i) => i.size >= LEAP_FROM).map((i) => locate(i.to))),

  /** A written eighth outside a tuplet, including one end of a tie. */
  eighths: (m) =>
    found('eighths', placed(m).filter((p) => p.note.tuplet === undefined && parts(p.note).some((d) => same(d, 0.5))).map(locate)),

  /** Anything written shorter than a quarter: eighths, sixteenths, a triplet, a tie's short end. */
  shorterThanQuarter: (m) =>
    found('shorterThanQuarter', placed(m).filter((p) => parts(p.note).some((d) => d < 1 - EPSILON)).map(locate)),

  /** A written sixteenth outside a tuplet. */
  sixteenths: (m) =>
    found('sixteenths', placed(m).filter((p) => p.note.tuplet === undefined && parts(p.note).some((d) => same(d, 0.25))).map(locate)),

  /**
   * A written dotted quarter in simple time. In compound time it is the beat
   * itself, and a quarter tied to an eighth lasts as long without being one.
   */
  dottedQuarters: (m) =>
    found(
      'dottedQuarters',
      placed(m)
        .filter(
          (p) =>
            p.note.tuplet === undefined &&
            !isCompound(metreAt(m, p.note.measureIndex)) &&
            parts(p.note).some((d) => same(d, 1.5)),
        )
        .map(locate),
    ),

  /** A tied note. */
  ties: (m) => found('ties', placed(m).filter((p) => (p.note.tieLength ?? 1) > 1).map(locate)),

  /**
   * Syncopation, as T37 defined it for the generator: a note written a quarter
   * or longer that starts off the beat; a tie that starts off the beat; a bar
   * whose melody opens on a rest and then plays (located at the note that
   * enters). A bar the melody rests through is a rest, not syncopation.
   */
  syncopation: (m) => {
    const starts = barStarts(m);
    const at: DemandAt[] = [];
    for (const p of placed(m)) {
      const metre = metreAt(m, p.note.measureIndex);
      const offset = p.note.onset - (starts.get(p.note.measureIndex) ?? 0);
      const beat = beatLength(metre);
      const into = mod(offset, beat);
      const offBeat = into > EPSILON && beat - into > EPSILON;
      const firstPart = parts(p.note)[0] ?? p.note.duration;
      if (offBeat && (firstPart >= 1 - EPSILON || (p.note.tieLength ?? 1) > 1)) at.push(locate(p));
    }
    const melody = lineOf(m, melodyStaff(m));
    const byBar = new Map<number, Placed[]>();
    for (const p of melody) byBar.set(p.note.measureIndex, [...(byBar.get(p.note.measureIndex) ?? []), p]);
    for (const [bar, notes] of byBar) {
      const start = starts.get(bar) ?? 0;
      const first = notes[0];
      if (first === undefined || first.note.onset <= start + EPSILON) continue;
      const heldAcross = melody.some((p) => p.note.onset < start - EPSILON && p.note.onset + p.note.duration > start + EPSILON);
      if (!heldAcross) at.push(locate(first));
    }
    const seen = new Set<string>();
    return found(
      'syncopation',
      at.filter((a) => !seen.has(a.noteId) && Boolean(seen.add(a.noteId))).sort((a, b) => a.step - b.step),
    );
  },

  /** A note written in a triplet. A tuplet of another number is not one. */
  triplets: (m) => found('triplets', placed(m).filter((p) => p.note.tuplet === 3).map(locate)),

  /** Compound time: beats of three eighths (6/8, 9/8, 12/8; 3/8 by the same rule). Located at every note in it. */
  compoundMetre: (m) => {
    const present = m.timeSigMap.some((t) => isCompound(t));
    return found(
      'compoundMetre',
      placed(m).filter((p) => isCompound(metreAt(m, p.note.measureIndex))).map(locate),
      present,
    );
  },

  /**
   * A key signature: present when the key has sharps or flats, located at the
   * notes whose letter it alters — where the learner has to remember it. A key
   * whose altered letters never sound is present with nowhere to point.
   */
  keySignature: (m) => {
    const fifths = keyFifths(m);
    return found(
      'keySignature',
      placed(m)
        .filter((p) => {
          const w = written(p.note);
          return keyAlter(w.letter, fifths) !== 0 && w.alter === keyAlter(w.letter, fifths);
        })
        .map(locate),
      fifths !== 0,
    );
  },

  /**
   * A note outside the key signature: its written alter is not the one the
   * key gives its letter (F♯ in C, B♮ in F, E♯ anywhere but C♯ major). A black
   * key with no spelling falls back to its pitch class against the key's
   * major scale.
   */
  chromatic: (m) => {
    const fifths = keyFifths(m);
    const tonic = mod(fifths * 7, 12);
    return found(
      'chromatic',
      placed(m)
        .filter((p) => {
          const w = written(p.note);
          if (!w.spelled) return !MAJOR.includes(mod(p.note.midi - tonic, 12));
          return w.alter !== keyAlter(w.letter, fifths);
        })
        .map(locate),
    );
  },

  /**
   * One hand's notes span more than a five-finger position (a fifth). Located
   * at each note that widens the hand's span past it.
   */
  beyondPosition: (m) => {
    const at: DemandAt[] = [];
    for (const hand of ['R', 'L'] as const) {
      let low = Infinity;
      let high = -Infinity;
      for (const p of placed(m)) {
        if (p.note.hand !== hand) continue;
        const widens = p.note.midi < low || p.note.midi > high;
        low = Math.min(low, p.note.midi);
        high = Math.max(high, p.note.midi);
        if (widens && high - low > POSITION_SPAN) at.push(locate(p));
      }
    }
    return found('beyondPosition', at.sort((a, b) => a.step - b.step));
  },

  /**
   * Both hands sounding at once: a note in one hand starts while the other
   * hand has a note sounding, or both start together. Hands that alternate
   * never are. Located at the note that makes it together.
   */
  handsTogether: (m) => {
    const notes = placed(m);
    const sounding = (hand: 'R' | 'L', at: number): boolean =>
      notes.some((q) => q.note.hand === hand && q.note.onset <= at + EPSILON && q.note.onset + q.note.duration > at + EPSILON);
    return found('handsTogether', notes.filter((p) => sounding(p.note.hand === 'R' ? 'L' : 'R', p.note.onset)).map(locate));
  },

  /**
   * The left hand (staff 2) plays more than one note in every bar, under a
   * right hand that plays too: a pattern under a tune. A melody in the left
   * hand alone is reading the bass clef, not this.
   */
  leftHandPattern: (m) => {
    const notes = placed(m);
    const left = notes.filter((p) => p.note.staff === 2);
    const onsets = (bar: number): number => new Set(left.filter((p) => p.note.measureIndex === bar).map((p) => p.note.onset)).size;
    const tune = (bar: number): boolean => notes.some((p) => p.note.staff === 1 && p.note.measureIndex === bar);
    const everyBar =
      m.measureCount > 0 && Array.from({ length: m.measureCount }, (_, bar) => onsets(bar) > 1 && tune(bar)).every(Boolean);
    return found('leftHandPattern', everyBar ? left.map(locate) : []);
  },

  /**
   * A line that walks: a quarter on every beat of every bar in the left hand
   * (staff 2), a quarter per beat in 4/4 and three in 3/4, that never turns
   * back in the bar to a pitch it has left, under a right hand that plays too.
   * A broken chord in quarters (root, fifth, third, fifth) circles back to its
   * fifth and is a pattern, not a walk; a walk that stalls on a repeated note
   * still walks; the same quarters with nothing over them are a bass line read
   * alone.
   */
  walkingBass: (m) => {
    const notes = placed(m);
    const left = lineOf(m, 2);
    const walks = (bar: number): boolean => {
      const inBar = left.filter((p) => p.note.measureIndex === bar);
      const quarters = inBar.filter((p) => same(parts(p.note)[0] ?? 0, 1));
      return (
        quarters.length === inBar.length &&
        quarters.length === barLength(metreAt(m, bar)) &&
        !turnsBack(quarters.map((p) => p.note.midi))
      );
    };
    const tune = (bar: number): boolean => notes.some((p) => p.note.staff === 1 && p.note.measureIndex === bar);
    const everyBar = m.measureCount > 0 && Array.from({ length: m.measureCount }, (_, bar) => walks(bar) && tune(bar)).every(Boolean);
    return found('walkingBass', everyBar ? left.map(locate) : []);
  },
};

/** One detector over one model. */
export function detect(model: ScoreModelData, id: DetectorId): Opportunity {
  return DETECTORS[id](model);
}

/** Every detector over one model. */
export function detectAll(model: ScoreModelData): Record<DetectorId, Opportunity> {
  const out = {} as Record<DetectorId, Opportunity>;
  for (const id of DETECTOR_IDS) out[id] = DETECTORS[id](model);
  return out;
}

/**
 * The vocabulary's demand ids present in a model, in the vocabulary's order:
 * what the content build writes for a file (`tools/content/demands.py`). The
 * vocabulary is passed in, not imported, so this module stays free of content.
 */
export function measuredDemands(model: ScoreModelData, demands: readonly { id: string; detector: string }[]): string[] {
  const found = detectAll(model);
  return demands.filter((d) => found[d.detector as DetectorId]?.present === true).map((d) => d.id);
}
