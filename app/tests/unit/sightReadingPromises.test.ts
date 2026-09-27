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
 * (`readingOptions`: the row's params held to what the rung that opened it has
 * taught, C4c — so a row is read at each rung listing it), turns each phrase into the score model the engine
 * plays (OSMD, then `extractScoreModel`), and checks it with the demand
 * detectors in `src/demands/detect.ts` (C2) — the one definition of each fact,
 * which used to be a dozen helpers in this file reading the MusicXML string:
 *
 * - **present** — what each rung listing the row says its reading drill
 *   trains (`PROMISED_BY_RUNG`, each line quoting where it is said) and what the
 *   row's own `concepts` claim;
 * - **absent** — every demand a rung listing the row has not taught
 *   (`content/curriculum/vocabulary/demands.json`, `taughtAt`, read against
 *   the rung's ancestry since E0a, where it was the curriculum's order at the
 *   earliest listing): no eighths before 2.2, no ties or dotted quarters before
 *   2.4, no key signature before 3.1, no syncopation, triplets or compound time
 *   before 4.5 — and 4/4 only before 4.5; no walking bass off blues.5's path;
 *   and, since C4b, nothing no rung teaches at all (sixteenths, S23);
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
import { generateSightReading, sightReadingOptionsFor } from '../../src/engine/sightReading';
import { readingOptions, taughtAtRung } from '../../src/curriculum/session';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { DetectorId } from '../../src/demands/detect';
import type { DemandsFile, SkillsFile } from '../../src/demands/vocabulary';
import {
  beamedByTheBeat,
  CLAIMED_BY_CONCEPT,
  engraving,
  has,
  modelOf,
  PROMISED_BY_RUNG,
  untaughtChecks,
  type Check,
  type Phrase,
} from './helpers/promises';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const SOURCE = join(process.cwd(), '..', 'content');
const { demands } = JSON.parse(readFileSync(join(SOURCE, 'curriculum', 'vocabulary', 'demands.json'), 'utf8')) as DemandsFile;
const { skills } = JSON.parse(readFileSync(join(SOURCE, 'curriculum', 'vocabulary', 'skills.json'), 'utf8')) as SkillsFile;
/**
 * The rows as authored. The build copies `catalog.static.json`'s rows through
 * unchanged, so this is what the built rows carry once the content is rebuilt;
 * read from the source so the check does not wait on a build: `targetSkills`
 * since C2, and since C4b each row's `drill.params` and `concepts` (row 7's
 * recipe gained `sixteenths: false`, S23).
 */
const authored = new Map(
  (JSON.parse(readFileSync(join(SOURCE, 'catalog.static.json'), 'utf8')) as CatalogItem[]).map((row) => [row.id, row]),
);

const SEEDS = Array.from({ length: 40 }, (_, i) => 1 + i * 7919);

// --- the phrase and what is promised: `helpers/promises.ts` (shared with the
// curriculum–generator contract, C4b, so the two hold one definition) --------

/** The rungs in curriculum order, so "before 2.2" is the curriculum's own answer. */
const ORDER: string[] = curriculum.stages.flatMap((stage) =>
  stage.units.flatMap((unit) => unit.lessons.map((lesson: Lesson) => lesson.id)),
);
const position = (id: string): number => {
  const at = ORDER.indexOf(id);
  expect(at, `rung ${id} is not in the curriculum`).toBeGreaterThanOrEqual(0);
  return at;
};

// Removed (C4c): `KNOWN_EARLY`, which named the one demand a row wrote before
// the rung that teaches it — `sight-reading-2-right` leaving C position on 2.2,
// three rungs before 2.5 teaches it (S16, found by C2). C4b proved the
// generator side (`heldToRung`); C4c made the one writer of a phrase
// (`readingOptions`) hold the row to the rung that opens it, for Today and for
// the rung page, and this file now generates each row that way, at each rung
// listing it. The untaught check below has no exceptions left.

/**
 * Everything a rung listing a row has not been taught yet — and, since C4b,
 * every demand no rung teaches (`taughtAt: null`): a row a rung offers does not
 * write what nothing teaches (S23). Revised (E0a): what the rung has taught is
 * its ancestry (`taughtAtRung`), where it was the curriculum's order at the
 * earliest rung listing the row — which credited jazz.8 with the walking bass
 * blues.5 teaches, on another track.
 */
function unintended(rung: string): Check[] {
  position(rung);
  for (const d of demands) if (d.taughtAt !== null) position(d.taughtAt);
  const taught = taughtAtRung(curriculum, rung);
  expect(taught, `rung ${rung} has no ancestry`).toBeDefined();
  return untaughtChecks(rung, ORDER, demands, () => false, taught);
}

/**
 * A promise a rung's own path does not teach (E0a). The hold keeps the demand
 * out of every phrase at that rung (never teach wrong), so the promise is not
 * kept there; this names each such pair rather than letting the check pass on
 * the file's order. Row 7 promises a walking bass (its `walking-bass` concept,
 * and theory.9's lesson: "with triplets and a walking bass"); the vocabulary
 * teaches the walking bass at `blues.5` alone, and neither jazz.8's path
 * (jazz.7, jazz.6, jazz.5, chords-pop.5 …) nor theory.9's goes through it.
 * Before E0a the file's order credited both with `blues.5`, stored before
 * them. The vocabulary's and the curriculum's to settle (jazz.6's lesson
 * teaches a walking line; Entry 93); an entry fails here once its rung has
 * been taught the demand, or a phrase carries it.
 */
const PROMISED_OFF_THE_PATH: readonly { row: string; rung: string; demand: string }[] = [
  { row: 'drill.reading.sight-reading-7', rung: 'jazz.8', demand: 'texture.walking-bass' },
  { row: 'drill.reading.sight-reading-7', rung: 'theory.9', demand: 'texture.walking-bass' },
];

const readers = catalog.filter((row) => row.drill?.kind === 'sight-reading');
const paramsOf = (row: CatalogItem): Readonly<Record<string, unknown>> => (authored.get(row.id) ?? row).drill?.params ?? {};
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
    /** The row as authored, for `readingOptions`, which reads the row's params. */
    const asAuthored = { ...row, drill: { ...row.drill, params: paramsOf(row) } } as CatalogItem;
    /** The phrases the app writes for the row opened from each rung listing it: held to what that rung has taught (C4c). */
    const atRung = new Map<string, Phrase[]>();
    beforeAll(async () => {
      for (const rung of rungs) {
        const list: Phrase[] = [];
        for (const seed of SEEDS) {
          const xml = generateSightReading(readingOptions(asAuthored, undefined, seed, taughtAtRung(curriculum, rung))).musicXml;
          list.push({
            model: await modelOf(xml, `${row.id}.${rung}.${String(seed)}`),
            sheet: engraving(xml),
            level: Number(paramsOf(row).level ?? 1),
          });
        }
        atRung.set(rung, list);
      }
    }, 240_000);
    /** At the earliest rung listing it: what every check but the rungs' own promises reads. */
    const phrases: Phrase[] = [];
    beforeAll(() => {
      phrases.push(...(atRung.get(earliest) ?? []));
    });
    const tagged = (authored.get(row.id) ?? row).concepts.flatMap((concept) => CLAIMED_BY_CONCEPT[concept] ?? []);
    const label = `${row.id} (${rungs.join(', ')})`;

    it(`${label}: contains what its rungs and tags promise, at each rung listing it`, () => {
      expect(tagged.length + rungs.flatMap((rung) => PROMISED_BY_RUNG[rung] ?? []).length, `${row.id} promises nothing this test can check`).toBeGreaterThan(0);
      for (const rung of rungs) {
        const here = atRung.get(rung) ?? [];
        // A promise off the rung's path (E0a): untaught there, and in no phrase, so the entry cannot go stale.
        const off = PROMISED_OFF_THE_PATH.filter((one) => one.row === row.id && one.rung === rung).map((one) => one.demand);
        for (const demand of off) {
          expect(taughtAtRung(curriculum, rung)?.(demand), `${label} at ${rung}: ${demand} is taught there now; remove it from PROMISED_OFF_THE_PATH`).toBe(false);
          const detector = demands.find((d) => d.id === demand)?.detector as DetectorId;
          expect(here.filter((p) => has(detector)(p)).length, `${label} at ${rung}: ${demand} written though untaught`).toBe(0);
        }
        for (const check of [...tagged, ...(PROMISED_BY_RUNG[rung] ?? [])]) {
          if (off.length > 0 && (check.about ?? []).some((demand) => off.includes(demand))) continue;
          const holding = here.filter((p) => check.holds(p)).length;
          if (check.scope === 'every') {
            expect(holding, `${label} at ${rung}: ${check.what} in ${String(holding)} of ${String(here.length)} phrases`).toBe(here.length);
          } else {
            expect(holding, `${label} at ${rung}: ${check.what} in no phrase`).toBeGreaterThan(0);
          }
        }
      }
    });

    // Revised (E0a): at every rung listing the row, each holding it to what that rung has taught. It was
    // the earliest listing in the file's order alone, which on parallel tracks is not the first a learner
    // meets (row 7's jazz.8 and theory.9: neither comes before the other on its path).
    it(`${label}: nothing a rung listing it has not taught`, () => {
      for (const rung of rungs) {
        const here = atRung.get(rung) ?? [];
        for (const check of unintended(rung)) {
          const failing = SEEDS.filter((_, i) => !check.holds(here[i] as Phrase));
          expect(failing, `${label} at ${rung}: ${check.what} fails at seeds ${failing.join(', ')}`).toEqual([]);
        }
      }
    });

    // Revised (C4c): read over the phrases of every rung listing the row, now
    // that each rung holds the row to what it has taught — 2.2's row declares
    // position-shift, whose opportunity (leaving C position) is 2.5's.
    it(`${label}: every skill it declares has its opportunity in its phrases at some rung listing it`, () => {
      const declared = authored.get(row.id)?.targetSkills ?? [];
      expect(declared.length, `${row.id} declares no targetSkills`).toBeGreaterThan(0);
      for (const id of declared) {
        const skill = skills.find((s) => s.id === id);
        expect(skill, `${row.id}: ${id} is not a vocabulary skill`).toBeDefined();
        if (!skill || skill.opportunity === 'every-step') continue;
        const detectors = skill.opportunity.map((d) => demands.find((x) => x.id === d)?.detector as DetectorId);
        const found = rungs.flatMap((rung) => atRung.get(rung) ?? []).filter((p) => detectors.some((d) => has(d)(p))).length;
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

/**
 * Each case below generates sixty eight-bar phrases and parses every one, so it
 * owns its budget (H0, Q37; test class: revise, timeout only). At vitest's
 * default of 5 s it timed out in full unit runs beside another build and passed
 * alone: the work is the same sixty phrases either way, and only the machine's
 * share of a processor changed (Entry 87 has the durations, alone and beside two
 * other unit runs). The file's other generation already runs in `beforeAll`
 * under a 240 s budget; these two read no catalog row, so they sit outside it.
 * No assertion changed.
 */
const SIXTY_PHRASES_MS = 60_000;

describe('levels 6 and 7 write a rest inside a triplet as a triplet rest', () => {
  // Without options, as the goldens are: the bracket fault was in the level,
  // not in the rows. 87 % and 89 % of 8-bar phrases had one (the trace, seeds
  // 1-500); a rest of a triplet's length with no <time-modification>.
  for (const level of [6, 7] as const) {
    it(`level ${String(level)}, 60 phrases`, { timeout: SIXTY_PHRASES_MS }, () => {
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
