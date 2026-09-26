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
 * (`sightReadingOptionsFor`), turns each phrase into the score model the engine
 * plays (OSMD, then `extractScoreModel`), and checks it with the demand
 * detectors in `src/demands/detect.ts` (C2) — the one definition of each fact,
 * which used to be a dozen helpers in this file reading the MusicXML string:
 *
 * - **present** — what each rung listing the row says its reading drill
 *   trains (`PROMISED_BY_RUNG`, each line quoting where it is said) and what the
 *   row's own `concepts` claim;
 * - **absent** — every demand vocabulary v0 says is taught after the earliest
 *   rung listing the row (`content/curriculum/vocabulary/demands.json`,
 *   `taughtAt`, placed in the curriculum's own order): no eighths before 2.2, no
 *   ties or dotted quarters before 2.4, no key signature before 3.1, no
 *   syncopation, triplets or compound time before 4.5 — and 4/4 only before 4.5;
 * - **declared** — every skill the row says it practises (`targetSkills`) has
 *   its opportunity somewhere in the row's phrases;
 * - **well formed** — a rest inside a triplet is a triplet rest, and short
 *   notes in one beat share a beam. These two are about how the page is
 *   engraved, which the score model deliberately does not carry (it has no
 *   rests and no beams), so they read the MusicXML as before.
 *
 * Nothing here is heard. Whether the phrases are musical is a separate
 * question the report answers seed by seed, from the notation.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { generateSightReading, sightReadingOptionsFor } from '../../src/engine/sightReading';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import type { ScoreModel } from '../../src/score/types';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import {
  detect,
  keyFifths,
  melodyLine,
  melodyStaff,
  offsetInBar,
  range,
  soundedNotes,
  type DetectorId,
} from '../../src/demands/detect';
import type { DemandsFile, SkillsFile } from '../../src/demands/vocabulary';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const SOURCE = join(process.cwd(), '..', 'content');
const { demands } = JSON.parse(readFileSync(join(SOURCE, 'curriculum', 'vocabulary', 'demands.json'), 'utf8')) as DemandsFile;
const { skills } = JSON.parse(readFileSync(join(SOURCE, 'curriculum', 'vocabulary', 'skills.json'), 'utf8')) as SkillsFile;
/**
 * `targetSkills` as authored. The build copies `catalog.static.json`'s rows
 * through unchanged, so this is what the built rows carry once the content is
 * rebuilt; read from the source so the check does not wait on a build.
 */
const authored = new Map(
  (JSON.parse(readFileSync(join(SOURCE, 'catalog.static.json'), 'utf8')) as CatalogItem[]).map((row) => [row.id, row]),
);

const SEEDS = Array.from({ length: 40 }, (_, i) => 1 + i * 7919);

// --- the phrase: the model the engine plays, and the page as engraved ---------

async function modelOf(musicXml: string, id: string): Promise<ScoreModel> {
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
interface Engraved {
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

interface Sheet {
  notes: Engraved[];
  divisions: number;
  beats: number;
  beatType: number;
  clefs: string[];
}

function engraving(xml: string): Sheet {
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
function beamedByTheBeat(s: Sheet): boolean {
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

interface Phrase {
  model: ScoreModel;
  sheet: Sheet;
  /** The generator level the row asked for (`drill.params.level`). */
  level: number;
}

const has = (id: DetectorId) => (p: Phrase): boolean => detect(p.model, id).present;
const compound = has('compoundMetre');
const metre = (p: Phrase): string => {
  const first = p.model.timeSigMap[0];
  return first ? `${String(first.beats)}/${String(first.beatType)}` : '4/4';
};

// --- what is promised, and by whom ---------------------------------------------

type Check = { what: string; scope: 'every' | 'some'; holds: (p: Phrase) => boolean };

const every = (what: string, holds: (p: Phrase) => boolean): Check => ({ what, scope: 'every', holds });
const some = (what: string, holds: (p: Phrase) => boolean): Check => ({ what, scope: 'some', holds });

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
const CLAIMED_BY_CONCEPT: Record<string, Check[]> = {
  steps: [every('a step', has('steps'))],
  skips: [every('a skip (a third)', has('skips'))],
  eighths: [every('an eighth note', has('eighths'))],
  'two-hands': [every('both hands, together', has('handsTogether'))],
  'bass-clef': [
    every(
      'every note on the bass staff',
      (p) => p.sheet.clefs.includes('F') && soundedNotes(p.model, 1).length === 0 && has('bassClef')(p),
    ),
  ],
  'C-position': [
    every('a range inside C position', (p) => {
      const [low, high] = range(p.model);
      return melodyStaff(p.model) === 1 ? low >= 60 && high <= 67 : low >= 48 && high <= 55;
    }),
  ],
  syncopation: [every('syncopation (simple time)', simple(has('syncopation')))],
  '6/8': [some('a phrase in 6/8', (p) => metre(p) === '6/8')],
  triplets: [every('a triplet (simple time)', simple(has('triplets')))],
  keys: [
    some('a key signature', (p) => keyFifths(p.model) !== 0),
    some('a sharp key', (p) => keyFifths(p.model) > 0),
    some('a flat key', (p) => keyFifths(p.model) < 0),
  ],
  accidentals: [
    every('an accidental', has('chromatic')),
    every('each accidental a short note off the strong beats, reached by step, rising a semitone', chromaticAsPassingNotes),
  ],
  sixteenths: [every('a sixteenth', has('sixteenths'))],
  'walking-bass': [every('a walking bass', has('walkingBass'))],
  'accompaniment-patterns': [every('a left-hand pattern', has('leftHandPattern'))],
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
    every('only steps and skips', (p) => !has('leaps')(p)),
    ...(CLAIMED_BY_CONCEPT['C-position'] ?? []),
  ],
  // 2.2: "eighths can turn up in the very first one"; and its concept `beams`
  // — "the beaming is a kindness: it groups the notes into beats".
  '2.2': [
    ...(CLAIMED_BY_CONCEPT.eighths ?? []),
    every('eighths beamed in their beats', (p) => p.sheet.notes.some((n) => n.beam !== null)),
  ],
  // 2.5: "its phrases already reach up to the C above middle C, beyond C position".
  '2.5': [
    some('a phrase beyond C position', (p) => range(p.model)[1] > 67),
    every('nothing above the C above middle C', (p) => range(p.model)[1] <= 72),
  ],
  // 3.4: "sight-reading level 2 (two hands, wider range, quarters and eighths)".
  '3.4': [...(CLAIMED_BY_CONCEPT['two-hands'] ?? []), ...(CLAIMED_BY_CONCEPT.eighths ?? [])],
  // 4.5: *Compound time, triplets and syncopation*; "sight-reading level 3".
  '4.5': [
    ...(CLAIMED_BY_CONCEPT['6/8'] ?? []),
    some('a phrase in 4/4 beside the 6/8 ones', (p) => metre(p) === '4/4'),
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
    some('a key with four accidentals', (p) => Math.abs(keyFifths(p.model)) === 4),
    ...(CLAIMED_BY_CONCEPT.triplets ?? []),
    every('a walking bass, at the level the lesson names (7)', (p) => p.level !== 7 || has('walkingBass')(p)),
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

/**
 * A demand a row writes before the rung that teaches it, known and named, so
 * the check stays on for everything else. Each one is asserted still to happen:
 * when the generator stops writing it, this list says to remove the line.
 */
const KNOWN_EARLY: { row: string; demand: string; why: string }[] = [
  {
    row: 'drill.reading.sight-reading-2-right',
    demand: 'range.beyond-position',
    why:
      'Level 2 writes the right hand from C4 to C5, and 2.5 counts on it ("its phrases already reach up ' +
      'to the C above middle C, beyond C position"), but the row is listed first on 2.2, three rungs before ' +
      'the hand is taught to leave C position. Found by C2 when the taught-at table moved into the ' +
      'vocabulary; the fix is the per-rung row (S16, D), not this list.',
  },
];

/** Everything the earliest rung listing a row has not been taught yet. */
function unintended(row: string, earliest: string): Check[] {
  const before = (rung: string): boolean => position(earliest) < position(rung);
  return [
    ...demands
      .filter((d) => d.taughtAt !== null && before(d.taughtAt))
      .filter((d) => !KNOWN_EARLY.some((k) => k.row === row && k.demand === d.id))
      .map((d) => every(`no ${d.id} (taught at ${String(d.taughtAt)})`, (p) => !has(d.detector)(p))),
    ...(before('4.5') ? [every('4/4 only (before 4.5)', (p) => p.model.timeSigMap.every((t) => t.beats === 4 && t.beatType === 4))] : []),
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
    const phrases: Phrase[] = [];
    beforeAll(async () => {
      for (const seed of SEEDS) {
        const xml = generateSightReading(sightReadingOptionsFor(row.drill?.params ?? {}, seed)).musicXml;
        phrases.push({
          model: await modelOf(xml, `${row.id}.${String(seed)}`),
          sheet: engraving(xml),
          level: Number(row.drill?.params?.level ?? 1),
        });
      }
    }, 120_000);
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
      for (const check of unintended(row.id, earliest)) {
        const failing = SEEDS.filter((_, i) => !check.holds(phrases[i] as Phrase));
        expect(failing, `${label}: ${check.what} fails at seeds ${failing.join(', ')}`).toEqual([]);
      }
      for (const known of KNOWN_EARLY.filter((k) => k.row === row.id)) {
        const detector = demands.find((d) => d.id === known.demand)?.detector as DetectorId;
        expect(phrases.some(has(detector)), `${label}: ${known.demand} no longer comes early — remove it from KNOWN_EARLY`).toBe(true);
      }
    });

    it(`${label}: every skill it declares has its opportunity in its phrases`, () => {
      const declared = authored.get(row.id)?.targetSkills ?? [];
      expect(declared.length, `${row.id} declares no targetSkills`).toBeGreaterThan(0);
      for (const id of declared) {
        const skill = skills.find((s) => s.id === id);
        expect(skill, `${row.id}: ${id} is not a vocabulary skill`).toBeDefined();
        if (!skill || skill.opportunity === 'every-step') continue;
        const detectors = skill.opportunity.map((d) => demands.find((x) => x.id === d)?.detector as DetectorId);
        const found = phrases.filter((p) => detectors.some((d) => has(d)(p))).length;
        expect(found, `${label}: declares ${id}, and none of ${skill.opportunity.join(', ')} is in any phrase`).toBeGreaterThan(0);
      }
    });

    it(`${label}: every rest inside a triplet is a triplet rest`, () => {
      for (const p of phrases) {
        const bad = p.sheet.notes.filter((n) => n.rest && n.duration === p.sheet.divisions / 3 && !n.tuplet);
        expect(bad).toEqual([]);
      }
    });

    it(`${label}: short notes in one beat are beamed together`, () => {
      const failing = SEEDS.filter((_, i) => !beamedByTheBeat((phrases[i] as Phrase).sheet));
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
        const s = engraving(generateSightReading({ level, bars: 8, hands: 'both', seed }).musicXml);
        const untupled = s.notes.filter((n) => n.rest && n.duration === s.divisions / 3 && !n.tuplet);
        expect(untupled, `level ${String(level)} seed ${String(seed)}`).toEqual([]);
        restsInTriplets += s.notes.filter((n) => n.rest && n.tuplet).length;
      }
      // And the case the fix is about did come up, or the loop proved nothing.
      expect(restsInTriplets).toBeGreaterThan(0);
    });
  }
});
