// @vitest-environment jsdom
/**
 * Every sight-reading row writes what its rungs promise, and nothing hard its
 * rungs have not taught (T37 item 7; the reviewer's boundary 7).
 *
 * The Score screen used to hand the generator a level, the hands, the bars and
 * a seed, so every phrase in the app was C major in 4/4 at 72 — and the rows
 * said otherwise: `sight-reading-3` sits on 4.5, *Compound time, triplets and
 * syncopation*, and wrote none of the three; `sight-reading-1` sits on 1.5,
 * *Steps and skips*, and level 1 could not write a skip; rows tagged `keys`
 * and `accidentals` were always C major with no sharp or flat anywhere. And
 * levels 2-4 wrote syncopation nobody had taught in 74-100 % of phrases.
 *
 * This reads the **built** catalog rows and curriculum (the claim is about
 * those), generates every row the way the Score screen does
 * (`sightReadingOptionsFor`), and checks each phrase:
 *
 * - **present** — what each rung listing the row says its reading drill
 *   trains (`PROMISED_BY_RUNG`, each line quoting where it is said) and what the
 *   row's own `concepts` claim;
 * - **absent** — anything the earliest rung listing the row comes before: no
 *   eighths before 2.2, no ties or dotted quarters before 2.4, no key
 *   signature before 3.1, no syncopation or triplets before 4.5 — read off the
 *   curriculum's own order, not written down here;
 * - **well formed** — a rest inside a triplet is a triplet rest.
 *
 * Nothing here is heard. Whether the phrases are musical is a separate
 * question the report answers seed by seed, from the notation.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateSightReading, sightReadingOptionsFor } from '../../src/engine/sightReading';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;

const SEEDS = Array.from({ length: 40 }, (_, i) => 1 + i * 7919);

// --- the phrase, as notes -----------------------------------------------------

interface Note {
  staff: number;
  bar: number;
  /** Divisions from the start of the bar. */
  at: number;
  duration: number;
  midi: number | null;
  tuplet: boolean;
  tieStart: boolean;
  tieStop: boolean;
  chord: boolean;
  /** `begin`, `continue`, `end`, or null where the note has no beam. */
  beam: string | null;
}

interface Phrase {
  notes: Note[];
  fifths: number;
  beats: number;
  beatType: number;
  divisions: number;
  clefs: string[];
}

const STEP: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function read(xml: string): Phrase {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const num = (selector: string, fallback: number): number =>
    Number(doc.querySelector(selector)?.textContent ?? fallback);
  const notes: Note[] = [];
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
      const pitch = child.querySelector('pitch');
      const midi = pitch
        ? (Number(pitch.querySelector('octave')?.textContent) + 1) * 12 +
          (STEP[pitch.querySelector('step')?.textContent ?? 'C'] ?? 0) +
          Number(pitch.querySelector('alter')?.textContent ?? 0)
        : null;
      const at = chord ? last : t;
      notes.push({
        staff: Number(child.querySelector('staff')?.textContent ?? 1),
        bar,
        at,
        duration,
        midi,
        tuplet: child.querySelector('time-modification') !== null,
        tieStart: child.querySelector('tie[type="start"]') !== null,
        tieStop: child.querySelector('tie[type="stop"]') !== null,
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
    fifths: num('fifths', 0),
    beats: num('beats', 4),
    beatType: num('beat-type', 4),
    divisions: num('divisions', 12),
    clefs: Array.from(doc.querySelectorAll('clef sign')).map((sign) => sign.textContent ?? ''),
  };
}

const compound = (p: Phrase): boolean => p.beatType === 8 && p.beats % 3 === 0;
const beatOf = (p: Phrase): number => (compound(p) ? p.divisions * 1.5 : (p.divisions * 4) / p.beatType);
const sounded = (p: Phrase, staff?: number): Note[] =>
  p.notes.filter((n) => n.midi !== null && !n.chord && (staff === undefined || n.staff === staff));
const melodyStaff = (p: Phrase): number => (sounded(p, 1).length > 0 ? 1 : 2);

function scaleSteps(p: Phrase): number[] {
  const tonic = (((p.fifths * 7) % 12) + 12) % 12;
  const degrees = [0, 2, 4, 5, 7, 9, 11];
  const index = (midi: number): number => {
    const rel = midi - tonic;
    const octave = Math.floor(rel / 12);
    const pc = ((rel % 12) + 12) % 12;
    // A chromatic note sits between two degrees; count it with the one below.
    let degree = degrees.length - 1;
    while (degree > 0 && (degrees[degree] ?? 0) > pc) degree -= 1;
    return octave * 7 + degree;
  };
  const line = sounded(p, melodyStaff(p)).filter((n) => !n.tieStop);
  const out: number[] = [];
  for (let i = 1; i < line.length; i += 1) {
    out.push(Math.abs(index(line[i]?.midi ?? 0) - index(line[i - 1]?.midi ?? 0)));
  }
  return out;
}

const hasEighth = (p: Phrase): boolean =>
  p.notes.some((n) => n.midi !== null && !n.tuplet && n.duration === p.divisions / 2);
const hasShorterThanQuarter = (p: Phrase): boolean =>
  p.notes.some((n) => n.midi !== null && n.duration < p.divisions);
const hasTriplet = (p: Phrase): boolean => p.notes.some((n) => n.midi !== null && n.tuplet);
const hasTie = (p: Phrase): boolean => p.notes.some((n) => n.tieStart || n.tieStop);
const hasDottedQuarter = (p: Phrase): boolean =>
  p.notes.some((n) => n.duration === p.divisions * 1.5 && !compound(p));
const hasSixteenth = (p: Phrase): boolean =>
  p.notes.some((n) => n.midi !== null && !n.tuplet && n.duration === p.divisions / 4);
/** A note of a beat or more starting off the beat, or a bar that opens on a rest. */
function hasSyncopation(p: Phrase): boolean {
  const beat = beatOf(p);
  const offBeatLong = p.notes.some(
    (n) => n.midi !== null && !n.tieStop && n.duration >= p.divisions && n.at % beat !== 0,
  );
  const restOnOne = p.notes.some(
    (n) => n.staff === melodyStaff(p) && n.at === 0 && n.midi === null && n.duration < p.divisions * 4,
  );
  const tiedOverTheBar = p.notes.some((n) => n.tieStart && n.at % beat !== 0);
  return offBeatLong || restOnOne || tiedOverTheBar;
}
const hasChromatic = (p: Phrase): boolean => {
  const tonic = (((p.fifths * 7) % 12) + 12) % 12;
  return p.notes.some(
    (n) => n.midi !== null && ![0, 2, 4, 5, 7, 9, 11].includes((((n.midi - tonic) % 12) + 12) % 12),
  );
};
const range = (p: Phrase): [number, number] => {
  const pitches = sounded(p, melodyStaff(p)).map((n) => n.midi as number);
  return [Math.min(...pitches), Math.max(...pitches)];
};
const bothHands = (p: Phrase): boolean => sounded(p, 1).length > 0 && sounded(p, 2).length > 0;
const walkingBass = (p: Phrase): boolean => {
  const bars = new Set(p.notes.map((n) => n.bar));
  return [...bars].every(
    (bar) =>
      sounded(p, 2).filter((n) => n.bar === bar && n.duration === p.divisions).length ===
      (p.beats * 4) / p.beatType,
  );
};
/**
 * Short notes that share a beat share a beam (T37): two adjacent sounded notes
 * shorter than a quarter, not in a triplet, inside one beat, are joined — the
 * second is not the start of a new beam and neither is left with a flag.
 */
function beamedByTheBeat(p: Phrase): boolean {
  const beat = beatOf(p);
  for (const staff of [1, 2]) {
    const line = p.notes.filter((n) => n.staff === staff && !n.chord);
    for (let i = 1; i < line.length; i += 1) {
      const a = line[i - 1] as Note;
      const b = line[i] as Note;
      const short = (n: Note): boolean => n.midi !== null && !n.tuplet && n.duration < p.divisions;
      if (a.bar !== b.bar || !short(a) || !short(b)) continue;
      const beatOfNote = (n: Note): number => Math.floor(n.at / beat);
      const inside = (n: Note): boolean => beatOfNote(n) === Math.floor((n.at + n.duration - 1) / beat);
      if (!inside(a) || !inside(b) || beatOfNote(a) !== beatOfNote(b)) continue;
      if (a.beam === null || a.beam === 'end' || b.beam === null || b.beam === 'begin') return false;
    }
  }
  return true;
}
const hasBeam = (p: Phrase): boolean => p.notes.some((n) => n.beam !== null);

const patternedLeftHand = (p: Phrase): boolean => {
  const bars = new Set(p.notes.map((n) => n.bar));
  return [...bars].every((bar) => sounded(p, 2).filter((n) => n.bar === bar).length > 1);
};

// --- what is promised, and by whom ---------------------------------------------

type Check = { what: string; scope: 'every' | 'some'; holds: (p: Phrase) => boolean };

const every = (what: string, holds: (p: Phrase) => boolean): Check => ({ what, scope: 'every', holds });
const some = (what: string, holds: (p: Phrase) => boolean): Check => ({ what, scope: 'some', holds });

/** In simple time only: a 6/8 phrase is its own new thing and is not asked for these. */
const simple = (holds: (p: Phrase) => boolean) => (p: Phrase): boolean => compound(p) || holds(p);

/** What a row's own `concepts` claim, read as a teacher would check it on the page. */
const CLAIMED_BY_CONCEPT: Record<string, Check[]> = {
  steps: [every('a step', (p) => scaleSteps(p).includes(1))],
  skips: [every('a skip (a third)', (p) => scaleSteps(p).includes(2))],
  eighths: [every('an eighth note', hasEighth)],
  'two-hands': [every('both hands', bothHands)],
  'bass-clef': [
    every(
      'every note on the bass staff',
      (p) => p.clefs.includes('F') && sounded(p, 1).length === 0 && sounded(p, 2).length > 0,
    ),
  ],
  'C-position': [
    every('a range inside C position', (p) => {
      const [low, high] = range(p);
      return melodyStaff(p) === 1 ? low >= 60 && high <= 67 : low >= 48 && high <= 55;
    }),
  ],
  syncopation: [every('syncopation (simple time)', simple(hasSyncopation))],
  '6/8': [some('a phrase in 6/8', (p) => p.beats === 6 && p.beatType === 8)],
  triplets: [every('a triplet (simple time)', simple(hasTriplet))],
  keys: [
    some('a key signature', (p) => p.fifths !== 0),
    some('a sharp key', (p) => p.fifths > 0),
    some('a flat key', (p) => p.fifths < 0),
  ],
  accidentals: [
    every('an accidental', hasChromatic),
    every('each accidental a short note off the strong beats, reached by step, rising a semitone', (p) => {
      const tonic = (((p.fifths * 7) % 12) + 12) % 12;
      const barLength = (p.beats * p.divisions * 4) / p.beatType;
      const line = sounded(p, melodyStaff(p));
      return line.every((n, i) => {
        if (n.midi === null || [0, 2, 4, 5, 7, 9, 11].includes((((n.midi - tonic) % 12) + 12) % 12)) return true;
        const next = line[i + 1];
        const before = line[i - 1];
        const step = before?.midi === null || before === undefined ? 99 : Math.abs(n.midi - before.midi);
        return (
          n.duration <= p.divisions &&
          n.at % (barLength / 2) !== 0 &&
          step >= 1 &&
          step <= 2 &&
          next?.midi !== null &&
          next?.midi === n.midi + 1
        );
      });
    }),
  ],
  sixteenths: [every('a sixteenth', hasSixteenth)],
  'walking-bass': [every('a walking bass', walkingBass)],
  'accompaniment-patterns': [every('a left-hand pattern', patternedLeftHand)],
};

/**
 * What each rung's lesson says its sight-reading drill trains. Only rungs that
 * say something about the phrases are here; a rung that lists the drill and
 * says nothing about it promises nothing beyond the row's own tags.
 */
const PROMISED_BY_RUNG: Record<string, Check[]> = {
  // 1.3: "a fresh four-bar phrase in the bass clef … one finger per key".
  '1.3': [...(CLAIMED_BY_CONCEPT['bass-clef'] ?? []), ...(CLAIMED_BY_CONCEPT['C-position'] ?? [])],
  // 1.5: *Steps and skips*; "every interval is a 2nd or a 3rd and the hand
  // never leaves C position".
  '1.5': [
    ...(CLAIMED_BY_CONCEPT.steps ?? []),
    ...(CLAIMED_BY_CONCEPT.skips ?? []),
    every('only steps and skips', (p) => scaleSteps(p).every((step) => step <= 2)),
    ...(CLAIMED_BY_CONCEPT['C-position'] ?? []),
  ],
  // 2.2: "eighths can turn up in the very first one"; and its concept `beams`
  // — "the beaming is a kindness: it groups the notes into beats".
  '2.2': [...(CLAIMED_BY_CONCEPT.eighths ?? []), every('eighths beamed in their beats', hasBeam)],
  // 2.5: "its phrases already reach up to the C above middle C, beyond C position".
  '2.5': [
    some('a phrase beyond C position', (p) => range(p)[1] > 67),
    every('nothing above the C above middle C', (p) => range(p)[1] <= 72),
  ],
  // 3.4: "sight-reading level 2 (two hands, wider range, quarters and eighths)".
  '3.4': [...(CLAIMED_BY_CONCEPT['two-hands'] ?? []), ...(CLAIMED_BY_CONCEPT.eighths ?? [])],
  // 4.5: *Compound time, triplets and syncopation*; "sight-reading level 3".
  '4.5': [
    ...(CLAIMED_BY_CONCEPT['6/8'] ?? []),
    some('a phrase in 4/4 beside the 6/8 ones', (p) => p.beats === 4 && p.beatType === 4),
    ...(CLAIMED_BY_CONCEPT.triplets ?? []),
    ...(CLAIMED_BY_CONCEPT.syncopation ?? []),
  ],
  // theory.9: "at level 7 … in keys with four accidentals, with triplets and a
  // walking bass".
  'theory.9': [
    some('a key with four accidentals', (p) => Math.abs(p.fifths) === 4),
    ...(CLAIMED_BY_CONCEPT.triplets ?? []),
    ...(CLAIMED_BY_CONCEPT['walking-bass'] ?? []),
  ],
};

/** The rungs in curriculum order, so "before 2.2" is the curriculum's own answer. */
const ORDER: string[] = curriculum.stages.flatMap((stage) =>
  stage.units.flatMap((unit) => unit.lessons.map((lesson: Lesson) => lesson.id)),
);
const position = (id: string): number => {
  const at = ORDER.indexOf(id);
  expect(at, `rung ${id} is not in the curriculum`).toBeGreaterThanOrEqual(0);
  return at;
};

/** Everything the earliest rung listing a row has not been taught yet. */
function unintended(earliest: string): Check[] {
  const before = (rung: string): boolean => position(earliest) < position(rung);
  return [
    ...(before('2.2')
      ? [every('no eighths or anything shorter (before 2.2)', (p) => !hasShorterThanQuarter(p))]
      : []),
    ...(before('2.4')
      ? [
          every('no ties (before 2.4)', (p) => !hasTie(p)),
          every('no dotted quarters (before 2.4)', (p) => !hasDottedQuarter(p)),
        ]
      : []),
    ...(before('3.1') ? [every('no key signature (before 3.1)', (p) => p.fifths === 0)] : []),
    ...(before('4.5')
      ? [
          every('no syncopation (before 4.5)', (p) => !hasSyncopation(p)),
          every('no triplets (before 4.5)', (p) => !hasTriplet(p)),
          every('4/4 only (before 4.5)', (p) => p.beats === 4 && p.beatType === 4),
        ]
      : []),
  ];
}

const readers = catalog.filter((row) => row.drill?.kind === 'sight-reading');
const rungsListing = (id: string): string[] =>
  ORDER.filter((rungId) => {
    for (const stage of curriculum.stages) {
      for (const unit of stage.units) {
        for (const lesson of unit.lessons) {
          if (lesson.id === rungId && (lesson.exerciseOptions.includes(id) || lesson.songOptions.includes(id))) {
            return true;
          }
        }
      }
    }
    return false;
  });

describe('the nine sight-reading rows', () => {
  it('are nine, each on at least one rung', () => {
    expect(readers).toHaveLength(9);
    for (const row of readers) expect(rungsListing(row.id), row.id).not.toHaveLength(0);
  });

  for (const row of readers) {
    const rungs = rungsListing(row.id);
    const earliest = rungs[0] ?? '';
    const phrases = SEEDS.map((seed) =>
      read(generateSightReading(sightReadingOptionsFor(row.drill?.params ?? {}, seed)).musicXml),
    );
    const promised = [
      ...row.concepts.flatMap((concept) => CLAIMED_BY_CONCEPT[concept] ?? []),
      ...rungs.flatMap((rung) => PROMISED_BY_RUNG[rung] ?? []),
    ];
    const label = `${row.id} (${rungs.join(', ')})`;

    it(`${label}: contains what its rungs and tags promise`, () => {
      expect(promised.length, `${row.id} promises nothing this test can check`).toBeGreaterThan(0);
      for (const check of promised) {
        const holding = phrases.filter((p) => check.holds(p)).length;
        if (check.scope === 'every') {
          expect(holding, `${label}: ${check.what} in ${String(holding)} of ${String(phrases.length)} phrases`).toBe(
            phrases.length,
          );
        } else {
          expect(holding, `${label}: ${check.what} in no phrase`).toBeGreaterThan(0);
        }
      }
    });

    it(`${label}: nothing ${earliest} has not taught`, () => {
      for (const check of unintended(earliest)) {
        const failing = SEEDS.filter((_, i) => !check.holds(phrases[i] as Phrase));
        expect(failing, `${label}: ${check.what} fails at seeds ${failing.join(', ')}`).toEqual([]);
      }
    });

    it(`${label}: every rest inside a triplet is a triplet rest`, () => {
      for (const p of phrases) {
        const bad = p.notes.filter((n) => n.midi === null && n.duration === p.divisions / 3 && !n.tuplet);
        expect(bad).toEqual([]);
      }
    });

    it(`${label}: short notes in one beat are beamed together`, () => {
      const failing = SEEDS.filter((_, i) => !beamedByTheBeat(phrases[i] as Phrase));
      expect(failing, `${label}: unbeamed short notes at seeds ${failing.join(', ')}`).toEqual([]);
    });
  }
});

describe('a row’s params reach the generator', () => {
  it('the key, the metre, the tempo and the promises, from the params as the catalog writes them', () => {
    const options = sightReadingOptionsFor(
      { level: 3, bars: 2, hands: 'both', fifths: [-1, 1], timeSig: ['6/8', '3/4'], bpm: 60, triplets: true },
      99,
    );
    expect(options).toMatchObject({
      level: 3,
      bars: 2,
      hands: 'both',
      fifths: [-1, 1],
      timeSig: [
        { beats: 6, beatType: 8 },
        { beats: 3, beatType: 4 },
      ],
      bpm: 60,
      triplets: true,
      seed: 99,
    });
    const phrase = generateSightReading(options);
    expect([-1, 1]).toContain(phrase.fifths);
    expect(phrase.bpm).toBe(60);
  });

  it('a seed names one phrase: the same seed, the same key and metre and music', () => {
    const params = { level: 5, bars: 4, hands: 'both', fifths: [-3, -2, -1, 0, 1, 2, 3], syncopation: true };
    const a = generateSightReading(sightReadingOptionsFor(params, 4242));
    const b = generateSightReading(sightReadingOptionsFor(params, 4242));
    expect(b.musicXml).toBe(a.musicXml);
  });

  it('a key drawn from a list is the key asked for outright, note for note', () => {
    // The choice is made from a stream of its own, so the list changes the key
    // and nothing else.
    const drawn = generateSightReading(sightReadingOptionsFor({ level: 5, bars: 4, hands: 'both', fifths: [-2, 2] }, 777));
    const asked = generateSightReading({ level: 5, bars: 4, hands: 'both', fifths: drawn.fifths, seed: 777 });
    expect(drawn.musicXml).toBe(asked.musicXml);
  });
});

describe('levels 6 and 7 write a rest inside a triplet as a triplet rest', () => {
  // Without options, as the goldens are: the bracket fault was in the level,
  // not in the rows. 87 % and 89 % of 8-bar phrases had one (the trace, seeds
  // 1-500); a rest of a triplet's length with no <time-modification>.
  for (const level of [6, 7] as const) {
    it(`level ${String(level)}, 60 phrases`, () => {
      let restsInTriplets = 0;
      for (let seed = 1; seed <= 60; seed += 1) {
        const p = read(generateSightReading({ level, bars: 8, hands: 'both', seed }).musicXml);
        const untupled = p.notes.filter((n) => n.midi === null && n.duration === p.divisions / 3 && !n.tuplet);
        expect(untupled, `level ${String(level)} seed ${String(seed)}`).toEqual([]);
        restsInTriplets += p.notes.filter((n) => n.midi === null && n.tuplet).length;
      }
      // And the case the fix is about did come up, or the loop proved nothing.
      expect(restsInTriplets).toBeGreaterThan(0);
    });
  }
});
