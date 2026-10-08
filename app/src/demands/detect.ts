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
import { barLength, beatLength, isCompound } from '../score/metre';

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
  'threeFour',
  'keySignature',
  'chromatic',
  'beyondPosition',
  'handsTogether',
  'leftHandPattern',
  'walkingBass',
  'habaneraCell',
  'tresilloCell',
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

/*
 * Compound time, the felt beat and the bar's length: `isCompound`, `beatLength` and `barLength`, the one reading
 * of a bar's beat (L120b; the reviewer's ruling on L120a, `docs/review/responses/0bcd3be0.md`: 3/8 is three
 * eighth beats, not compound). Moved unchanged to `score/metre.ts` (MT1) so the chord chart counts its bars by the
 * same rule; `syncopation` and `dottedQuarters` below read 3/8 by it too.
 */

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

// --- the habanera and the tresillo: onset cells in the left hand (CD1) -----------------

/**
 * The two cells as onset sets, in fractions of the bar from its start (CD1 D1; CK-5). The source is
 * the upgrade's habanera, "dotted eighth, sixteenth, eighth, eighth in 2/4 … compared with the
 * tresillo (3+3+2)" (`CURRICULUM-UPGRADE.md:21`), with Wikipedia's Habanera and Tresillo pages as
 * the secondary source ("the habanera is the tresillo plus the second main beat"). The habanera
 * sounds at 0, 3/8, 1/2 and 3/4 of its 2/4 bar; the tresillo's 3+3+2 at 0, 3/8 and 3/4. The doubled
 * form in 4/4 or 2/2 (a dotted quarter, an eighth, a quarter, a quarter; Por Una Cabeza's quarter,
 * eighth rest, eighth, quarter, quarter) is the same fractions of its bar, so the definition rests
 * on the onsets, never on the written durations (`ABILITY-MAP.md`'s L1 amendment).
 *
 * Stated here and again in `tools/content/cells.py`, each from the cited definition, on purpose:
 * that module is the build's independent witness, reading partitura's parse of the same bytes, and
 * an oracle that imported these constants would not be one. The sourced fixtures and the
 * differential (`tools/content/tests/test_cells.py`) hold the two statements equal.
 */
const HABANERA_CELL: readonly number[] = [0, 3 / 8, 1 / 2, 3 / 4];
const TRESILLO_CELL: readonly number[] = [0, 3 / 8, 3 / 4];

/** The metres the cells are read in: the published 2/4, and its doubled form in 4/4 or 2/2. */
function cellMetre(metre: { beats: number; beatType: number }): boolean {
  return (
    (metre.beats === 2 && metre.beatType === 4) ||
    (metre.beats === 4 && metre.beatType === 4) ||
    (metre.beats === 2 && metre.beatType === 2)
  );
}

/**
 * The bars whose left-hand onsets are exactly `cell` (CD1 D2), located at one note per onset: the
 * lowest left-hand note there, so a habanera bar locates four places and a tresillo bar three,
 * whatever the voicing. Read per unrolled measure, in 2/4, 4/4 or 2/2 only (a 3/8 fraction of a 3/4
 * bar is no published cell, and in 6/8 the 3+3 is the beat itself), never in a pickup bar. The left
 * hand is the note's `hand`, which a cross-staff note keeps and a one-staff item takes from its
 * declared hand (HD1). Chords and voices merge into their distinct onsets; a tie chain is one note,
 * so a bar entered by a tie has no onset at its start; grace notes are left out (`placed`). Exact
 * equality, never "contains": a tresillo bar lacks the habanera's 1/2, a habanera bar has one onset
 * more than the tresillo, and a habanera whose sixteenth is tied over the half bar is a tresillo.
 *
 * The onsets, never the style. In 4/4 the doubled habanera is also the common dotted-quarter,
 * eighth, quarter, quarter bass. What this finds is that the left hand holds the declared onset
 * cell; that the piece is a habanera or a tango, that it suits teaching the cell, or that a learner
 * plays it with its feel are not facts it finds (`docs/review/responses/eeff22fe.md` §2).
 */
function cellBars(model: ScoreModelData, cell: readonly number[]): DemandAt[] {
  const starts = barStarts(model);
  const lowestByBar = new Map<number, Placed[]>();
  for (const p of placed(model)) {
    if (p.note.hand !== 'L') continue;
    const bar = p.note.measureIndex;
    if (model.pickup === true && bar === 0) continue;
    if (!cellMetre(metreAt(model, bar))) continue;
    const held = lowestByBar.get(bar) ?? [];
    const at = held.findIndex((q) => same(q.note.onset, p.note.onset));
    if (at < 0) held.push(p);
    else if (p.note.midi < (held[at] as Placed).note.midi) held[at] = p;
    lowestByBar.set(bar, held);
  }
  const out: DemandAt[] = [];
  for (const [bar, lowest] of lowestByBar) {
    if (lowest.length !== cell.length) continue;
    const start = starts.get(bar) ?? 0;
    const length = barLength(metreAt(model, bar));
    const fractions = lowest.map((p) => (p.note.onset - start) / length).sort((a, b) => a - b);
    if (fractions.every((f, i) => same(f, cell[i] as number))) out.push(...lowest.map(locate));
  }
  return out.sort((a, b) => a.step - b.step);
}

// --- the detectors -----------------------------------------------------------------

/** A second on the staff: C to D, C♯ to D, E to F. */
const LEAP_FROM = 3;

/** A five-finger position spans a fifth: seven semitones from thumb to fifth finger. */
const POSITION_SPAN = 7;

/** A step in a walking line: a semitone (a chromatic run or approach) or a whole tone (a scale tone). */
const STEP_SEMITONES = 2;

/**
 * The least share of a walking line's moves that are steps (`walkingBass`). Operational: the catalogue's
 * walking lines measure a fifth to a quarter (2026-10-07), a repeated broken chord none; an eighth leaves
 * room for a walk that arpeggiates more than these do.
 */
const WALK_STEP_SHARE = 1 / 8;

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
   * Syncopation: "a momentary contradiction of the prevailing meter or pulse" (The Harvard Dictionary
   * of Music, ed. Randel, "Syncopation"), made operational by Longuet-Higgins and Lee's rule ("The
   * rhythmic interpretation of monophonic music", Music Perception 1, 1984): a syncopation is a note
   * at a weaker metrical position followed by no new note — a rest, or the note's own continuation —
   * at the stronger position after it. Both are taken from secondary statements of them (the papers on
   * measuring syncopation that quote the dictionary and restate the rule, e.g. Sioros and Guedes,
   * "Syncopation as transformation", 2014); neither original was read here. T37's three clauses, for
   * the generator, are that rule's cases at the beat and at the bar line:
   *
   * - a note written a quarter or longer that starts off the beat: it is still sounding on the beat;
   * - a tie that starts off the beat: its continuation is;
   * - a bar whose melody opens on a rest and then plays, **after a bar in which the melody sounded**:
   *   the silent downbeat follows that note (located at the note that enters).
   *
   * **The silence must follow a note (the owner's and the reviewer's ruling of 2026-10-07: "a pickup is
   * not automatically syncopation; its rhythmic relationship to the established meter matters").** A
   * downbeat rest with no melody in the bar before is not the downbeat a note was bound to: the
   * opening of a pickup bar (the model pads it to a full bar, `barStarts`, so it opens on a "rest"
   * nobody wrote), a first bar that opens on a written rest, and a bar after one the melody rests
   * through are a late entry, not a contradiction of the metre. Inside a pickup the first two clauses
   * still apply, read against the beats the pickup is counted on: a pickup note held across a beat, or
   * tied into the downbeat, contradicts the metre the notation gives. Validated on the catalogue
   * (2026-10-07 proving run, `docs/classifier/proving/2026-10-07/`): of 83 items where only this
   * detector found syncopation, 82 had it in a pickup bar, where the padding made the third clause fire.
   * A bar the melody rests through is a rest, not syncopation.
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
      if (heldAcross) continue;
      // The silent downbeat must follow a note: the melody sounds somewhere in the bar before. None
      // before a pickup or a first bar; none after a bar the melody rests through.
      const before = starts.get(bar - 1);
      const soundedBefore =
        before !== undefined && melody.some((p) => p.note.onset < start - EPSILON && p.note.onset + p.note.duration > before + EPSILON);
      if (soundedBefore) at.push(locate(first));
    }
    const seen = new Set<string>();
    return found(
      'syncopation',
      at.filter((a) => !seen.has(a.noteId) && Boolean(seen.add(a.noteId))).sort((a, b) => a.step - b.step),
    );
  },

  /** A note written in a triplet. A tuplet of another number is not one. */
  triplets: (m) => found('triplets', placed(m).filter((p) => p.note.tuplet === 3).map(locate)),

  /**
   * Compound time: more than one beat of three eighths (6/8, 9/8, 12/8; never 3/8, which is simple
   * triple, `isCompound`). Located at every note in a compound bar, so a 3/8 piece with one 6/8 bar
   * is located at that bar's notes alone.
   */
  compoundMetre: (m) => {
    const present = m.timeSigMap.some((t) => isCompound(t));
    return found(
      'compoundMetre',
      placed(m).filter((p) => isCompound(metreAt(m, p.note.measureIndex))).map(locate),
      present,
    );
  },

  /**
   * Three-four time (SR2; the reviewer's ruling on SR1, `docs/review/responses/sr1-sightreading-quality.md`
   * §1): a bar of exactly three quarter-note beats, 3/4, as 1.4 teaches it (`content/lessons/1.4.md:23`).
   * Never 3/8 (simple triple in eighths) or 3/2 (in halves), which 1.4 does not teach, and never a compound
   * metre. Located at every note in a 3/4 bar, as `compoundMetre` is at a compound bar's, so a 4/4 piece
   * with one 3/4 bar is located at that bar's notes alone.
   */
  threeFour: (m) => {
    const threeFour = (t: { beats: number; beatType: number }): boolean => t.beats === 3 && t.beatType === 4;
    return found(
      'threeFour',
      placed(m).filter((p) => threeFour(metreAt(m, p.note.measureIndex))).map(locate),
      m.timeSigMap.some(threeFour),
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
   * Both hands at once, located where the hands have to be coordinated (C4d,
   * backlog L72; the reviewer's C4.5 review).
   *
   * **Present** when both hands sound at once anywhere: a note in one hand
   * starts while the other hand has a note sounding, or both start together.
   * Hands that alternate never are. This is the texture, and what the reading
   * rows' promises and the contract read.
   *
   * **Located** only at the steps where the two hands must be coordinated: a
   * step where the left hand strikes while the right hand sounds — both hands
   * striking together, or the left hand changing under a held right-hand
   * note — at every note struck there. A right-hand note over a held left-hand
   * note is not an opportunity: under a sustained accompaniment (whole-note
   * roots under a melody) the opportunities are the steps where the root
   * changes with the melody, not every melody note; under a moving left hand
   * (an Alberti or broken-chord pattern) they are every left-hand note the
   * melody sounds over. C2 located every note that sounded over the other
   * hand, so in a level-2 two-hand phrase playing together sat on every
   * right-hand note, and a learner's wrong skips could never be read apart
   * from it. A texture with no such step (a left-hand note struck alone, a
   * melody entering over it held) is present with nowhere to point, as a key
   * signature whose altered letters never sound is.
   */
  handsTogether: (m) => {
    const notes = placed(m);
    const sounding = (hand: 'R' | 'L', at: number): boolean =>
      notes.some((q) => q.note.hand === hand && q.note.onset <= at + EPSILON && q.note.onset + q.note.duration > at + EPSILON);
    const present = notes.some((p) => sounding(p.note.hand === 'R' ? 'L' : 'R', p.note.onset));
    const coordinated = new Set(notes.filter((p) => p.note.hand === 'L' && sounding('R', p.note.onset)).map((p) => p.step));
    return found('handsTogether', notes.filter((p) => coordinated.has(p.step)).map(locate), present);
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
   * A walking bass: "unsyncopated notes of equal value, usually quarter notes", using "a mixture of
   * scale tones, arpeggios, chromatic runs, and passing tones to outline the chord progression", which
   * "creates a feeling of regular quarter note movement, akin to the regular alternation of feet while
   * walking" (Friedland, Building Walking Bass Lines, 1995, pp. 4 and 44, as Wikipedia's "Walking bass"
   * cites it; the book was not read here). Read in the left hand (staff 2), one note per onset (the
   * lowest), under a right hand that plays too, in every bar:
   *
   * - **Equal values:** a quarter on every beat of the bar, four in 4/4 and three in 3/4.
   * - **Movement (the 2026-10-07 ruling: "walking bass should not accept stationary pulses merely
   *   because they meet a note-duration pattern"):** the line changes pitch on more than half of the
   *   bar's beat-to-beat moves, so a walk may stall once in 4/4 and never in 3/4. A pulse on one pitch
   *   (the clave pulse exercises, B4 on every beat), a stride or oom-pah left hand (a root, then one
   *   chord note repeated: C2 E3 E3 E3, or C2 E3 E3 in 3/4) and a line that moves every two beats are
   *   not walks.
   * - **Never back in the bar to a pitch it has left:** a broken chord in quarters (root, fifth, third,
   *   fifth) circles and is a pattern, not a walk.
   * - **It walks by step somewhere:** of the whole line's moves (across bar lines too), at least one in
   *   `WALK_STEP_SHARE` is a step of one or two semitones — the scale tones, chromatic runs and passing
   *   tones of the definition. A line of arpeggios alone is a broken-chord accompaniment: the same
   *   rising triad in every bar (Scarborough Fair's E3 G3 B3; Duvernoy's op. 176 no. 18, refused as a
   *   walk in `content/sources/excerpts.json`) never moves by step.
   *
   * The thresholds are operational and were validated on the built catalogue (2026-10-07), not quoted:
   * the generated walking lines and the I Got Rhythm passage change pitch on at least two of three moves
   * in every bar and move by step on a fifth to just over a quarter of their moves; every over-match
   * found (the proving run's ten detector-only items, and the five waltz accompaniments its witness
   * shared the fault on) repeats one pitch on two thirds of a bar or more. The same quarters with
   * nothing over them are a bass line read alone.
   */
  walkingBass: (m) => {
    const notes = placed(m);
    const left = lineOf(m, 2);
    const walks = (bar: number): boolean => {
      const inBar = left.filter((p) => p.note.measureIndex === bar);
      const quarters = inBar.filter((p) => same(parts(p.note)[0] ?? 0, 1));
      const pitches = quarters.map((p) => p.note.midi);
      const moves = pitches.slice(1).filter((pitch, i) => pitch !== pitches[i]).length;
      return (
        quarters.length === inBar.length &&
        quarters.length === barLength(metreAt(m, bar)) &&
        moves * 2 > pitches.length - 1 &&
        !turnsBack(pitches)
      );
    };
    const tune = (bar: number): boolean => notes.some((p) => p.note.staff === 1 && p.note.measureIndex === bar);
    const everyBar = m.measureCount > 0 && Array.from({ length: m.measureCount }, (_, bar) => walks(bar) && tune(bar)).every(Boolean);
    const moves = left.slice(1).map((p, i) => Math.abs(p.note.midi - (left[i] as Placed).note.midi)).filter((size) => size > 0);
    const steps = moves.filter((size) => size <= STEP_SEMITONES).length;
    const stepwise = moves.length > 0 && steps >= moves.length * WALK_STEP_SHARE;
    return found('walkingBass', everyBar && stepwise ? left.map(locate) : []);
  },

  /**
   * The habanera onset cell in the left hand (CD1): a bar whose left-hand onsets are exactly 0, 3/8,
   * 1/2 and 3/4 of the bar, in 2/4, 4/4 or 2/2 (`cellBars`). Located at four places per such bar.
   */
  habaneraCell: (m) => found('habaneraCell', cellBars(m, HABANERA_CELL)),

  /**
   * The tresillo onset cell in the left hand (CD1): a bar whose left-hand onsets are exactly 0, 3/8
   * and 3/4 of the bar, in 2/4, 4/4 or 2/2 (`cellBars`). Located at three places per such bar. A bar
   * of eight sixteenths grouped 3+3+2 by accent sounds every sixteenth, and is not one.
   */
  tresilloCell: (m) => found('tresilloCell', cellBars(m, TRESILLO_CELL)),
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
