// @vitest-environment jsdom
/**
 * The one gate (E0 item 3; R38, Part 23, Part 25 layer 6): `eligibleFor` answers
 * "can the learner cope" and "does this material provide the opportunity claimed",
 * from the facts the candidate has, and nothing else. Part 23's nine adversaries on
 * constructed learners and items, each at its cheapest layer — through the gate and,
 * where a consumer is the claim, through the consumer (`tieredAlternatives`):
 *
 * 1. shares the target with taught demands only → eligible;
 * 2. shares it plus one untaught demand → refused;
 * 3. contains the target incidentally → not presented as its practice;
 * 4. level-close but not ready → refused;
 * 5. level-far but a clean ready target → eligible (4 and 5 on one swap sheet);
 * 6. an explicit `alternatives[]` entry contradicting measured demands → refused;
 * 7. an import whose corrected hand split moves it between eligible and ineligible;
 * 8. `demands: unmeasured` → refused for every automatic want where the learner is not prepared for
 *    every demand (`unknown-forbidden`, the one gate since E2a), exploration-only where nothing is left
 *    to rule out, eligible for exploration — the missing measurement said in each;
 * 9. genre and tags satisfy no requirement;
 *
 * plus the reason text, the declared large-hand voicing (D0 finding 5), the rung
 * requirement that only evidence can meet (the reviewer's constraint (a)), the
 * readiness floor the brief asked to compare, and the density rule held equal to the
 * build's on every built item; since D3a and E1a, the teaching-use admission for a
 * music-promising generated item and for an excerpt.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  admittedForTeaching,
  eligibleFor,
  OPPORTUNITY_DENSITY,
  targetDemandsFor,
  targetSkillsFor,
  uncoped,
  usefulDensity,
  type Learner,
} from '../../src/curriculum/eligibility';
import { isExcerpt } from '../../src/curriculum/excerpt';
import { indexCatalog, tieredAlternatives } from '../../src/curriculum/selectors';
import { taughtAtRung } from '../../src/curriculum/session';
import { SHIPPED_SKILL_ACTIVATION, EVERY_DECLARED_SKILL } from '../../src/curriculum/skillActivation';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import { addImport, correctImportHands, importToCatalogItem } from '../../src/data/importStore';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { bits, identityOf, resolve, type HumanEvent, type Identity } from '../../src/review/record';
import { swapTierWords } from '../../src/ui/help';
import { clearFakeIndexedDb, fakeFile, useFakeIndexedDb } from './helpers/idb';
import { measured, unmeasured } from './helpers/measured';
import { installTextMeasurer } from './helpers/scoreCatalog';

function song(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return { id, type: 'song', title: id, level: 2, hands: 'both', tracks: ['core'], concepts: [], file: `scores/${id}.mxl`, ...over };
}

/** A learner whose lessons have taught steps and skips, and nothing else. */
const STEPS_AND_SKIPS: Learner = { taught: (demand) => demand === 'interval.step' || demand === 'interval.skip' };

describe('Part 23’s adversaries, through the gate', () => {
  it('1. shares the target with taught demands only: eligible, as practice of the target', () => {
    const candidate = song('song.clean', measured(['interval.step', 'interval.skip']));
    const result = eligibleFor(candidate, STEPS_AND_SKIPS, { for: 'demand', demand: 'interval.skip' });
    expect(result).toMatchObject({ verdict: 'eligible', for: 'demand', practises: 'interval.skip' });
  });

  it('2. shares the target plus one untaught demand: refused, naming it', () => {
    const candidate = song('song.plus-syncopation', measured(['interval.step', 'interval.skip', 'rhythm.syncopation']));
    expect(eligibleFor(candidate, STEPS_AND_SKIPS, { for: 'demand', demand: 'interval.skip' })).toEqual({
      verdict: 'ineligible',
      why: 'untaught',
      demands: ['rhythm.syncopation'],
    });
  });

  it('3. contains the target incidentally: never presented as its practice', () => {
    // Two skips in forty bars: present, and below the useful density.
    const candidate = song(
      'song.two-skips',
      measured(['interval.step', 'interval.skip'], { located: { 'interval.step': 80, 'interval.skip': 2 }, bars: 40, established: ['interval.step'] }),
    );
    expect(eligibleFor(candidate, STEPS_AND_SKIPS, { for: 'demand', demand: 'interval.skip' })).toMatchObject({
      verdict: 'ineligible',
      why: 'incidental',
      wanted: 'interval.skip',
      located: 2,
    });
    // And the density rule the build writes says the same of those counts.
    expect(usefulDensity({ 'interval.step': 80, 'interval.skip': 2 }, 40)).toEqual(['interval.step']);
  });

  it('6. an explicit alternatives[] entry contradicting measured demands: refused; provenance is not immunity', () => {
    const catalog = indexCatalog([
      song('song.source', { ...measured(['interval.step', 'interval.skip']), alternatives: ['song.named-but-syncopated', 'song.named-and-clean'] }),
      song('song.named-but-syncopated', measured(['interval.step', 'rhythm.syncopation'])),
      song('song.named-and-clean', measured(['interval.step'])),
    ]);
    const ids = tieredAlternatives({ itemId: 'song.source' }, EMPTY, catalog, SHIPPED_SKILL_ACTIVATION, STEPS_AND_SKIPS).map((one) => [one.item.id, one.tier]);
    expect(ids).toEqual([['song.named-and-clean', 'alternative']]);
  });

  it('8. demands unmeasured: refused for every automatic want where the learner is not prepared for every demand (unknown-forbidden, E2a), exploration-only with nothing to rule out, eligible for exploration — the missing measurement said in each', () => {
    const candidate = song('song.unread', unmeasured('the app could not load the file'));
    // An unknown is not an observed absence (the E2 review's required change, through the exported gate): every demand but steps and skips.
    // Revised (CD1 D5; responses/33497357.md §3): less the demands the coping question never asks (`notAsked`: the habanera and
    // the tresillo); the old assumption was every vocabulary demand. An ordinary demand without `notAsked` is still included.
    const unprepared = VOCABULARY_V0.demands
      .filter((demand) => demand.notAsked === undefined)
      .map((demand) => demand.id)
      .filter((id) => id !== 'interval.step' && id !== 'interval.skip');
    expect(unprepared).toContain('rhythm.syncopation');
    expect(unprepared).not.toContain('rhythm.tresillo');
    for (const want of [{ for: 'equivalent' }, { for: 'demand', demand: 'interval.skip' }, { for: 'skill', skill: 'interval-reading' }, { for: 'requirement', skill: 'interval-reading' }] as const) {
      expect(eligibleFor(candidate, STEPS_AND_SKIPS, want), want.for).toEqual({ verdict: 'ineligible', why: 'unknown-forbidden', demands: unprepared, missing: 'the app could not load the file' });
    }
    expect(eligibleFor(candidate, STEPS_AND_SKIPS, { for: 'exploration' })).toEqual({ verdict: 'eligible', for: 'exploration', missing: 'the app could not load the file' });
    // An item with no measurement record at all (a catalogue from before E0) is not "no demands": refused the same way.
    expect(eligibleFor(song('song.no-record'), STEPS_AND_SKIPS, { for: 'equivalent' })).toEqual({ verdict: 'ineligible', why: 'unknown-forbidden', demands: unprepared, missing: 'no measurement record' });
    // Nothing to rule out — a learner prepared for every demand, or none described — and the claim waits for the measurement, as before.
    expect(eligibleFor(candidate, { taught: () => true }, { for: 'equivalent' })).toEqual({ verdict: 'exploration-only', missing: 'the app could not load the file' });
    expect(eligibleFor(candidate, {}, { for: 'equivalent' })).toEqual({ verdict: 'exploration-only', missing: 'the app could not load the file' });
  });

  it('8, on every entry path: an unmeasured same-lesson option and named stand-in are not offered as equivalent', () => {
    const curriculum: Curriculum = {
      version: 1,
      tracks: [],
      stages: [{ number: 1, title: 'One', summary: '', units: [{ id: 'u', title: 'U', track: 'core', lessons: [{ id: 'L', title: 'L', concepts: [], textFile: 'l.md', exerciseOptions: [], songOptions: ['song.source', 'song.lesson-unread', 'song.lesson-read'], mastery: { minAccuracy: 0.9, minTempoPct: 0.8 }, requirements: [] }] }] }],
    };
    const catalog = indexCatalog([
      song('song.source', { ...measured(['interval.step']), alternatives: ['song.named-unread'] }),
      song('song.lesson-unread', unmeasured()),
      song('song.lesson-read', measured(['interval.step'])),
      song('song.named-unread', unmeasured()),
    ]);
    const ids = tieredAlternatives({ itemId: 'song.source', lessonId: 'L' }, curriculum, catalog, SHIPPED_SKILL_ACTIVATION, STEPS_AND_SKIPS).map((one) => one.item.id);
    expect(ids).toEqual(['song.lesson-read']);
  });

  it('9. genre, tags and concepts satisfy no requirement: only what the notes establish', () => {
    const candidate = song('song.says-jazz', {
      genre: ['jazz'],
      tags: ['rootless-voicings', 'syncopation'],
      concepts: ['syncopation', 'walking-bass'],
      ...measured(['interval.step']),
    });
    const learner: Learner = { taught: () => true };
    expect(eligibleFor(candidate, learner, { for: 'demand', demand: 'rhythm.syncopation' })).toEqual({ verdict: 'ineligible', why: 'absent', wanted: 'rhythm.syncopation' });
    expect(eligibleFor(candidate, learner, { for: 'skill', skill: 'syncopation' })).toEqual({ verdict: 'ineligible', why: 'not-a-target', skill: 'syncopation' });
  });
});

const EMPTY: Curriculum = { version: 1, tracks: [], stages: [] };

describe('level orders eligible candidates and rescues nothing (adversaries 4 and 5, on the swap sheet)', () => {
  const catalog = indexCatalog([
    // The row targets interval reading, and its notes provide skips (its steps are incidental).
    song('song.source', { level: 2, targetSkills: ['interval-reading'], ...measured(['interval.step', 'interval.skip'], { established: ['interval.skip'] }) }),
    // 4. At the source's level, and it brings a leap the learner has not met: refused.
    song('song.level-close-not-ready', { level: 2, ...measured(['interval.step', 'interval.skip', 'interval.leap']) }),
    // 5. Three levels away, and clean: offered.
    song('song.level-far-clean', { level: 5, ...measured(['interval.step', 'interval.skip']) }),
  ]);
  // The row sits on 1.5, which the vocabulary says teaches skips and leaps.
  const ON_1_5: Curriculum = {
    version: 1,
    tracks: [],
    stages: [{ number: 1, title: 'One', summary: '', units: [{ id: 'u', title: 'U', track: 'core', lessons: [{ id: '1.5', title: '1.5', concepts: [], textFile: 'l.md', exerciseOptions: [], songOptions: ['song.source'], mastery: { minAccuracy: 0.9, minTempoPct: 0.8 }, requirements: [] }] }] }],
  };
  const offered = tieredAlternatives({ itemId: 'song.source' }, ON_1_5, catalog, EVERY_DECLARED_SKILL, STEPS_AND_SKIPS);

  it('4. refuses the level-close candidate the learner is not ready for', () => {
    expect(offered.map((one) => one.item.id)).not.toContain('song.level-close-not-ready');
  });

  it('5. offers the level-far candidate that is a clean, ready target, as practice of the demand the row’s rung teaches', () => {
    expect(offered.map((one) => [one.item.id, one.tier, one.shared])).toEqual([['song.level-far-clean', 'demand', 'interval.skip']]);
    expect(targetDemandsFor(catalog.byId.get('song.source') as CatalogItem, '1.5', EVERY_DECLARED_SKILL)).toEqual(['interval.skip']);
    // Never the steps every tune has, which would make the tier the catalogue by level.
    expect(targetDemandsFor(catalog.byId.get('song.source') as CatalogItem, '1.1', EVERY_DECLARED_SKILL)).toEqual([]);
  });
});

describe('7. an import whose corrected hand split moves it between ineligible and eligible', () => {
  afterAll(() => clearFakeIndexedDb());

  const note = (step: string, octave: number, staff: 1 | 2): string =>
    `<note><pitch><step>${step}</step><octave>${String(octave)}</octave></pitch><duration>1</duration><voice>${staff === 1 ? '1' : '5'}</voice><type>quarter</type><staff>${String(staff)}</staff></note>`;
  const rest = (staff: 1 | 2): string => `<note><rest measure="yes"/><duration>4</duration><voice>${staff === 1 ? '1' : '5'}</voice><staff>${String(staff)}</staff></note>`;
  const bar = (n: number, pitches: [string, number][], staff: 1 | 2, first: boolean): string =>
    `<measure number="${String(n)}">` +
    (first
      ? '<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves>' +
        '<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>'
      : '') +
    (staff === 1
      ? pitches.map(([s, o]) => note(s, o, 1)).join('') + '<backup><duration>4</duration></backup>' + rest(2)
      : rest(1) + '<backup><duration>4</duration></backup>' + pitches.map(([s, o]) => note(s, o, 2)).join('')) +
    '</measure>';
  /** One tune, C4 to F4 and back, written with the hands as `staves` says bar by bar. */
  const tune = (staves: [1 | 2, 1 | 2, 1 | 2, 1 | 2]): string => {
    const up: [string, number][] = [['C', 4], ['D', 4], ['E', 4], ['F', 4]];
    const down: [string, number][] = [['E', 4], ['D', 4], ['C', 4], ['D', 4]];
    const bars = [up, down, up, down].map((pitches, i) => bar(i + 1, pitches, staves[i] as 1 | 2, i === 0)).join('');
    return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>A tune in one hand</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${bars}</part></score-partwise>`;
  };
  // The automatic split sent the tune's falling bars to the left hand; the learner puts them back.
  const SPLIT = tune([1, 2, 1, 2]);
  const CORRECTED = tune([1, 1, 1, 1]);
  /** A learner on the first rung: steps taught, nothing else. */
  const FIRST_RUNG: Learner = { taught: (demand) => demand === 'interval.step' };

  it('is measured at import, refused as the split wrote it, and eligible once the learner corrects the hands', async () => {
    useFakeIndexedDb();
    installTextMeasurer();
    const row = await addImport(fakeFile('tune.musicxml', SPLIT));
    expect(row.measurement?.status, JSON.stringify(row.measurement)).toBe('measured');
    expect(row.demands).toEqual(expect.arrayContaining(['clef.bass']));
    const before = eligibleFor(importToCatalogItem(row), FIRST_RUNG, { for: 'equivalent' });
    expect(before).toMatchObject({ verdict: 'ineligible', why: 'untaught' });

    const fixed = await correctImportHands(row.id, CORRECTED, new Date('2026-09-27T10:00:00Z'));
    expect(fixed).toBeDefined();
    expect(fixed?.demands).toEqual(['interval.step']);
    // The correction is source truth: the stored score is the corrected one, and the provenance says whose it is.
    expect(fixed?.data).toBe(CORRECTED);
    expect(fixed?.provenance?.facts.hands).toMatchObject({ kind: 'authored' });
    expect(fixed?.provenance?.facts.hands?.via).toMatch(/learner/);
    expect(fixed?.provenance?.facts.demands?.kind).toBe('measured');
    const after = eligibleFor(importToCatalogItem(fixed as NonNullable<typeof fixed>), FIRST_RUNG, { for: 'demand', demand: 'interval.step' });
    expect(after).toMatchObject({ verdict: 'eligible', practises: 'interval.step' });
  });
});

describe('what the gate never does', () => {
  it('recommends no declared large-hand voicing: the prerequisite and the alternative come with the refusal (D0 finding 5)', () => {
    const add9 = song('exercise.open-voicing.c.add9', {
      type: 'exercise',
      ...measured(['texture.hands-together']),
      provenance: {
        source: 'generated',
        facts: {},
        review: { score: null, teaching: null },
        physical: { largeHandSpan: 14, prerequisite: 'a hand that takes a ninth', alternative: 'the root in the left hand' },
      },
    });
    for (const want of [{ for: 'equivalent' }, { for: 'demand', demand: 'texture.hands-together' }, { for: 'exploration' }] as const) {
      expect(eligibleFor(add9, { taught: () => true }, want)).toEqual({
        verdict: 'ineligible',
        why: 'physical',
        prerequisite: 'a hand that takes a ninth',
        alternative: 'the root in the left hand',
      });
    }
  });

  it('lets no item serve a rung’s skill requirement unless the evidence readers act on its runs (constraint (a))', () => {
    // A generated interval drill: declares interval reading, provides skips, the learner copes.
    const drill = song('exercise.interval-reading.c.01', { type: 'exercise', targetSkills: ['interval-reading'], ...measured(['interval.step', 'interval.skip']) });
    expect(eligibleFor(drill, STEPS_AND_SKIPS, { for: 'skill', skill: 'interval-reading' })).toMatchObject({ verdict: 'eligible', practises: 'interval-reading' });
    // As shipped, the evidence readers act on the reading rows' skills only: its runs could not meet the requirement.
    expect(eligibleFor(drill, STEPS_AND_SKIPS, { for: 'requirement', skill: 'interval-reading' })).toEqual({ verdict: 'ineligible', why: 'not-a-target', skill: 'interval-reading' });
    expect(targetSkillsFor(drill)).toEqual(['interval-reading']);
  });

  it('never acts on a declared skill whose opportunity the notes do not establish', () => {
    const declaresButLacks = song('exercise.claims-triplets', { type: 'exercise', targetSkills: ['triplets'], ...measured(['interval.step']) });
    expect(targetSkillsFor(declaresButLacks)).toEqual([]);
    expect(eligibleFor(declaresButLacks, { taught: () => true }, { for: 'skill', skill: 'triplets' })).toEqual({ verdict: 'ineligible', why: 'absent', wanted: 'rhythm.triplets' });
  });

  it('asks a learner: with none described, no practice claim is made', () => {
    const candidate = song('song.clean', measured(['interval.step', 'interval.skip']));
    expect(eligibleFor(candidate, {}, { for: 'demand', demand: 'interval.skip' })).toEqual({ verdict: 'ineligible', why: 'no-learner' });
    expect(eligibleFor(candidate, {}, { for: 'equivalent' }).verdict).toBe('eligible');
  });

  it('marks tempo-sensitive demands untrusted where the tempo was the converter’s (R11)', () => {
    const defaulted = song('song.defaulted', {
      ...measured(['interval.step', 'rhythm.eighths']),
      provenance: { source: 'pdmx', facts: { demands: { kind: 'measured', untrusted: ['rhythm.eighths'] }, tempo: { kind: 'inferred' } }, review: { score: null, teaching: null } },
    });
    expect(eligibleFor(defaulted, { taught: () => true }, { for: 'demand', demand: 'rhythm.eighths' })).toMatchObject({ verdict: 'eligible', untrusted: ['rhythm.eighths'] });
  });
});

describe('the readiness floor the brief asked to compare', () => {
  const candidate = song('song.eighths', measured(['interval.step', 'rhythm.eighths']));
  const states: Record<string, string> = { 'interval-reading': 'familiar', subdivision: 'introduced' };
  const skillState = (skill: string) => states[skill] as never;

  it('familiar (the repertoire slot’s rule, kept): subdivision only introduced does not cope with eighths', () => {
    expect(eligibleFor(candidate, { skillState }, { for: 'equivalent' })).toEqual({ verdict: 'ineligible', why: 'untaught', demands: ['rhythm.eighths'] });
  });

  it('introduced: the same learner copes', () => {
    expect(eligibleFor(candidate, { skillState, floor: 'introduced' }, { for: 'equivalent' }).verdict).toBe('eligible');
  });
});

describe('the reason words state the strongest fact known', () => {
  it('the tiers the gate turned on say what the option also practises and that the rest is met', () => {
    expect(swapTierWords('demand', 'interval.skip')).toBe('Also practises skips, with the other demands you have met');
    expect(swapTierWords('skill', 'interval-reading')).toBe('Also trains reading by interval, with the other demands you have met');
  });

  it('never "similar difficulty", and never a level', () => {
    for (const tier of ['lesson', 'alternative', 'skill', 'demand', 'kind'] as const) {
      expect(swapTierWords(tier, 'interval.skip')).not.toMatch(/similar|difficult|level/i);
    }
  });
});

describe('one density rule, read by the build and by the gate', () => {
  // Revised (CD1 §3a; responses/33497357.md §2, §4): a demand is named by a rule or, by decision, as curated-only (the
  // habanera and the tresillo), never both; the old assumption was a rule for every demand.
  it('names every vocabulary demand, by a rule or as curated-only and never both, and no two rules are the whole table', () => {
    const ruled = Object.keys(OPPORTUNITY_DENSITY.demands);
    const curated = Object.keys(OPPORTUNITY_DENSITY.curatedOnly);
    expect([...ruled, ...curated].sort()).toEqual(VOCABULARY_V0.demands.map((d) => d.id).sort());
    expect(curated.filter((id) => ruled.includes(id))).toEqual([]);
    expect(curated.sort()).toEqual(['rhythm.habanera', 'rhythm.tresillo']);
    for (const id of curated) expect(OPPORTUNITY_DENSITY.curatedOnly[id]?.why.length ?? 0, id).toBeGreaterThan(20);
    // No count of located places establishes a curated-only demand, however dense.
    expect(usefulDensity({ 'rhythm.habanera': 4000, 'rhythm.tresillo': 3000 }, 10)).toEqual([]);
    expect(new Set(Object.values(OPPORTUNITY_DENSITY.demands).map((r) => `${String(r.min)}/${String(r.perBar)}`)).size).toBeGreaterThan(5);
  });

  it('gives, on every measured item of the built catalog, exactly what the build wrote (the build’s rule plus the family contract, and an excerpt’s window rule)', () => {
    const catalog = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'catalog.json'), 'utf8')) as CatalogItem[];
    const measuredItems = catalog.filter((item) => item.measurement?.status === 'measured');
    expect(measuredItems.length, 'no measured item in the built catalog — has the content build run?').toBeGreaterThan(1000);
    const differ: string[] = [];
    for (const item of measuredItems) {
      const m = item.measurement;
      if (m?.status !== 'measured') continue;
      const spoilt = new Set(m.misread?.demands ?? []);
      // E1: an excerpt also establishes by the window rule (`minInWindow`), written as `window`.
      const mine = new Set([...usefulDensity(m.located, m.bars), ...(m.contract ?? []), ...(m.window ?? [])].filter((d) => !spoilt.has(d)));
      const theirs = new Set(m.established);
      if (mine.size !== theirs.size || [...mine].some((d) => !theirs.has(d))) differ.push(item.id);
    }
    expect(differ.slice(0, 10), `${String(differ.length)} items`).toEqual([]);
  });
});

/**
 * D3a (the reviewer's required change on D3, `responses/ee70b43.md`, and on D3a's brief,
 * `responses/d483be4.md`): a generated item whose family promises music for its recipe
 * (`provenance.facts.promise`, the build's authored fact from the contract table) and whose
 * `provenance.review.teaching` is not `true` is refused for every automatic offer — a skill, a
 * requirement, a demand and an equivalent (an authored alternative or a lesson's own option
 * included) — as `teaching-use-not-approved`, with the stored bit (`null` undecided, `false` a
 * `no` or a `fix` on record) kept in the verdict; `exploration` passes to the existing questions.
 * An affirmative decision admits it to the same gates as everything else. Drills, notated songs
 * and the runtime reading rows are untouched. Read from the built catalogue.
 */
describe('a generated item that promises music, without an affirmative teaching-use decision (D3a)', () => {
  const built = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'catalog.json'), 'utf8')) as CatalogItem[];
  const byId = new Map(built.map((item) => [item.id, item]));
  const familyOf = (item: CatalogItem): string | undefined => (item.drill as { generator?: { family?: string } } | null | undefined)?.generator?.family;
  const study = built.find((item) => familyOf(item) === 'study') as CatalogItem;
  const get = (id: string): CatalogItem => {
    const item = byId.get(id);
    if (item === undefined) throw new Error(`${id} is not in the built catalogue — has the content build run?`);
    return item;
  };
  /** A learner who copes with every demand anything carries. */
  const COPES: Learner = { taught: () => true };
  /** The item with a teaching-use decision on its current identity, as D2's build writes it: the bit and its `reviewed` fact. */
  const decided = (item: CatalogItem, value: 'yes' | 'no' | 'fix'): CatalogItem => {
    const provenance = item.provenance as NonNullable<CatalogItem['provenance']>;
    return {
      ...item,
      provenance: {
        ...provenance,
        facts: { ...provenance.facts, reviewedTeaching: { kind: 'reviewed', via: 'content/review/decisions.jsonl', value } },
        review: { ...provenance.review, teaching: value === 'yes' },
      },
    };
  };
  const skill = (): string => targetSkillsFor(study)[0] as string;
  const demand = (): string => (study.measurement?.status === 'measured' ? study.measurement.established : []).find((d) => d === 'texture.hands-together') as string;

  it('the study read from the build promises music, and no person has decided its teaching use', () => {
    expect(study, 'no generated study in the built catalogue').toBeDefined();
    expect(study.provenance?.facts.promise, `${study.id}: the promise fact`).toMatchObject({ kind: 'authored', value: 'music' });
    expect(study.provenance?.review.teaching, study.id).toBeNull();
    expect(skill(), `${study.id}: a declared skill its notes establish`).toBeDefined();
    expect(demand(), `${study.id}: hands together established`).toBe('texture.hands-together');
  });

  it('is refused for a skill, a demand it measurably provides, a requirement and an equivalent: teaching-use-not-approved, undecided', () => {
    for (const want of [
      { for: 'skill', skill: skill(), activation: EVERY_DECLARED_SKILL },
      { for: 'requirement', skill: skill(), activation: EVERY_DECLARED_SKILL },
      { for: 'demand', demand: demand() },
      { for: 'equivalent' },
    ] as const) {
      expect(eligibleFor(study, COPES, want), `${study.id} for ${want.for}`).toEqual({ verdict: 'ineligible', why: 'teaching-use-not-approved', teaching: null });
    }
  });

  it('passes to the existing questions for exploration: the one exemption, deliberate', () => {
    expect(eligibleFor(study, COPES, { for: 'exploration' }), study.id).toEqual({ verdict: 'eligible', for: 'exploration' });
  });

  it('a no and a fix on record are refused the same way, their stored bit kept distinct from undecided', () => {
    for (const value of ['no', 'fix'] as const) {
      const reviewed = decided(study, value);
      expect(reviewed.provenance?.review.teaching).toBe(false);
      for (const want of [{ for: 'skill', skill: skill() }, { for: 'demand', demand: demand() }, { for: 'equivalent' }] as const) {
        expect(eligibleFor(reviewed, COPES, want), `${study.id} with a ${value} for ${want.for}`).toEqual({
          verdict: 'ineligible',
          why: 'teaching-use-not-approved',
          teaching: false,
        });
      }
      expect(eligibleFor(reviewed, COPES, { for: 'exploration' }).verdict, `${study.id} with a ${value}, exploring`).toBe('eligible');
    }
  });

  it('an affirmative decision admits it to the existing gates: eligible where the learner copes and the opportunity is established, still refused for an untaught demand', () => {
    const approved = decided(study, 'yes');
    expect(eligibleFor(approved, COPES, { for: 'skill', skill: skill() }), study.id).toMatchObject({ verdict: 'eligible', for: 'skill', practises: skill() });
    expect(eligibleFor(approved, COPES, { for: 'demand', demand: demand() }), study.id).toMatchObject({ verdict: 'eligible', for: 'demand', practises: demand() });
    expect(eligibleFor(approved, COPES, { for: 'equivalent' }), study.id).toEqual({ verdict: 'eligible', for: 'equivalent' });
    // A learner taught steps and skips only: the study's bass clef, leaps and hands together are not met.
    expect(eligibleFor(approved, STEPS_AND_SKIPS, { for: 'demand', demand: demand() }), study.id).toMatchObject({ verdict: 'ineligible', why: 'untaught' });
  });

  it('the promise is the recipe’s: the meter family’s 12/8 blues is refused, its 5/4 drill is not', () => {
    expect(eligibleFor(get('exercise.meter.12-8'), COPES, { for: 'equivalent' })).toEqual({ verdict: 'ineligible', why: 'teaching-use-not-approved', teaching: null });
    expect(get('exercise.meter.5-4').provenance?.facts.promise, 'exercise.meter.5-4').toMatchObject({ value: 'drill' });
    expect(eligibleFor(get('exercise.meter.5-4'), COPES, { for: 'equivalent' })).toEqual({ verdict: 'eligible', for: 'equivalent' });
  });

  it('leaves a drill, a notated song and a runtime reading row exactly as before, each with no teaching-use decision', () => {
    const drill = get('exercise.interval-reading.c-position.right.01');
    expect(drill.provenance?.review.teaching).toBeNull();
    expect(eligibleFor(drill, COPES, { for: 'skill', skill: 'interval-reading' }), drill.id).toMatchObject({ verdict: 'eligible', practises: 'interval-reading' });
    expect(eligibleFor(drill, COPES, { for: 'demand', demand: 'interval.skip' }), drill.id).toMatchObject({ verdict: 'eligible', practises: 'interval.skip' });

    const song = get('song.folk.twinkle.ht');
    expect(song.provenance?.review.teaching).toBeNull();
    expect(song.provenance?.facts.promise, song.id).toBeUndefined();
    expect(eligibleFor(song, COPES, { for: 'equivalent' }), song.id).toEqual({ verdict: 'eligible', for: 'equivalent' });
    expect(eligibleFor(song, COPES, { for: 'demand', demand: 'texture.hands-together' }), song.id).toMatchObject({ verdict: 'eligible', practises: 'texture.hands-together' });

    const reader = get('drill.reading.sight-reading-1');
    expect(reader.measurement?.status).toBe('runtime');
    expect(reader.provenance?.facts.promise, reader.id).toBeUndefined();
    expect(eligibleFor(reader, COPES, { for: 'requirement', skill: 'sight-reading' }), reader.id).toEqual({ verdict: 'eligible', for: 'requirement', practises: 'sight-reading' });
    expect(eligibleFor(reader, COPES, { for: 'skill', skill: 'sight-reading' }), reader.id).toEqual({ verdict: 'eligible', for: 'skill', practises: 'sight-reading' });
  });
});

/**
 * The item with a teaching-use decision on its current identity, as D2's build writes it: the bit
 * (`yes` true; `no` and `fix` false) and its `reviewed` fact. No excerpt in the built catalogue has
 * one, so every row this makes is constructed from a built one.
 */
function withTeachingUse(item: CatalogItem, value: 'yes' | 'no' | 'fix'): CatalogItem {
  const provenance = item.provenance as NonNullable<CatalogItem['provenance']>;
  return {
    ...item,
    provenance: {
      ...provenance,
      facts: { ...provenance.facts, reviewedTeaching: { kind: 'reviewed', via: 'content/review/decisions.jsonl', value } },
      review: { ...provenance.review, teaching: value === 'yes' },
    },
  };
}

/**
 * Q8's case on the real corpus (E1 item 7; Part 24's adversaries 1 and 2): the whole of Anh. 113
 * is refused for a Stage 3 want — it carries sixteenths (taught at no rung) and triplets (4.5),
 * which `classical.3`, its rung, has not taught — and its excerpt of bars 25–32 (the boundary
 * approved by the rules, E1) is eligible there once a teaching-use `yes` is on the cut, and refused
 * until then (E1a): measured on the cut, the parent's demands the parent's, unchanged by the cut.
 * No excerpt branch in the gate's two questions: the cut's measured demands are what they read.
 * The teaching-use admission before them is the one every excerpt and every music-promising
 * generated item passes.
 */
describe('Anh. 113 whole and in its excerpt, through the one gate (E1, Q8; revised by E1a)', () => {
  const catalog = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'catalog.json'), 'utf8')) as CatalogItem[];
  const curriculum = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'curriculum.json'), 'utf8')) as Curriculum;
  const WHOLE = 'song.classical.bach-menuet-bwv-anh-113.pdmx';
  const whole = catalog.find((one) => one.id === WHOLE);
  const excerpts = catalog.filter((one) => one.type === 'excerpt' && one.excerptOf === WHOLE);
  const atClassical3: Learner = { taught: taughtAtRung(curriculum, 'classical.3') ?? ((): boolean => false) };

  it('the whole is refused at classical.3 for what it carries that the rung has not taught', () => {
    expect(whole, 'Anh. 113 is in the built catalogue').toBeDefined();
    const result = eligibleFor(whole as CatalogItem, atClassical3, { for: 'equivalent' });
    expect(result).toMatchObject({ verdict: 'ineligible', why: 'untaught' });
    expect(result.verdict === 'ineligible' && result.why === 'untaught' ? [...result.demands].sort() : []).toEqual(['rhythm.sixteenths', 'rhythm.triplets']);
  });

  it('its excerpt is eligible there once approved for teaching use, for the key signature its bars establish, and refused until then; the parent is unchanged', () => {
    expect(excerpts.length, 'an excerpt of Anh. 113 is in the built catalogue').toBeGreaterThan(0);
    for (const excerpt of excerpts) {
      // As built: no person has decided its teaching use, so no automatic offer takes it.
      expect(excerpt.provenance?.review.teaching, excerpt.id).toBeNull();
      const refused = { verdict: 'ineligible', why: 'teaching-use-not-approved', teaching: null };
      expect(eligibleFor(excerpt, atClassical3, { for: 'equivalent' }), excerpt.id).toEqual(refused);
      expect(eligibleFor(excerpt, atClassical3, { for: 'demand', demand: 'key.signature' }), excerpt.id).toEqual(refused);
      // Once a yes is on the cut (the built row with `teaching: true` set, constructed): eligible.
      const approved = withTeachingUse(excerpt, 'yes');
      expect(eligibleFor(approved, atClassical3, { for: 'equivalent' }).verdict, excerpt.id).toBe('eligible');
      expect(eligibleFor(approved, atClassical3, { for: 'demand', demand: 'key.signature' }), excerpt.id).toMatchObject({
        verdict: 'eligible',
        practises: 'key.signature',
      });
      expect(excerpt.demands, excerpt.id).not.toContain('rhythm.sixteenths');
      expect(excerpt.demands, excerpt.id).not.toContain('rhythm.triplets');
    }
    expect(whole?.demands).toContain('rhythm.sixteenths');
    expect(whole?.demands).toContain('rhythm.triplets');
  });
});

/**
 * E1a (the reviewer's required change on E1, `responses/8326ff3.md`; Q59; the brief approved in
 * `responses/7bdd8a0.md`): an excerpt is music whose teaching suitability is not established until a
 * person says so, exactly like a study, so the one admission reads its stored bit as it reads a
 * music-promising generated item's. Measured notes, a boundary approved by the rules and a rung's
 * listing establish no teaching use. The built Anh. 113 cut has otherwise eligible measured demands at
 * `classical.3`; the build declares no target skill on a cut, so the skill and requirement wants are
 * asked of the same row with `key-signature` declared (constructed). A `yes` recorded on an older cut
 * of the same definition resolves to nothing on the current cut, because the identity a decision binds
 * to is the cut file's sha256 (D2; the app's own implementation of the resolution, `review/record.ts`):
 * the bit stays `null` and the cut unadmitted. The build side of the same proof is
 * `test_review_record.py` › `TestAStaleDecisionOnAnOlderCutAdmitsNothing`.
 */
describe('an excerpt reaches an automatic offer only with a current teaching-use yes on its cut (E1a)', () => {
  const catalog = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'catalog.json'), 'utf8')) as CatalogItem[];
  const curriculum = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'curriculum.json'), 'utf8')) as Curriculum;
  const CUT = 'excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32';
  const cut = catalog.find((one) => one.id === CUT) as CatalogItem;
  const atClassical3: Learner = { taught: taughtAtRung(curriculum, 'classical.3') ?? ((): boolean => false) };
  /** A learner who copes with every demand anything carries. */
  const COPES: Learner = { taught: () => true };
  /** The row with the key signature declared as its target skill: what the skill and requirement wants ask of. */
  const declaring = (item: CatalogItem): CatalogItem => ({ ...item, targetSkills: ['key-signature'] });
  const WANTS = [
    { for: 'skill', skill: 'key-signature', activation: EVERY_DECLARED_SKILL },
    { for: 'requirement', skill: 'key-signature', activation: EVERY_DECLARED_SKILL },
    { for: 'demand', demand: 'key.signature' },
    { for: 'equivalent' },
  ] as const;

  it('the built cut is an excerpt no person has decided on, whose bars establish the key signature and carry nothing classical.3 has not taught', () => {
    expect(cut, `${CUT} is not in the built catalogue — has the content build run?`).toBeDefined();
    expect(isExcerpt(cut)).toBe(true);
    expect(cut.provenance?.review.teaching, CUT).toBeNull();
    expect(cut.provenance?.facts.promise, CUT).toBeUndefined();
    expect(cut.measurement?.status === 'measured' ? cut.measurement.established : [], CUT).toContain('key.signature');
    expect(uncoped(cut, atClassical3), CUT).toEqual([]);
  });

  it('undecided, and with a no or a fix on record, it is refused for a skill, a requirement, a demand its bars establish and an equivalent: teaching-use-not-approved, the bit kept', () => {
    const rows = [
      [declaring(cut), null],
      [declaring(withTeachingUse(cut, 'no')), false],
      [declaring(withTeachingUse(cut, 'fix')), false],
    ] as const;
    for (const [row, teaching] of rows) {
      expect(admittedForTeaching(row), `${CUT} at ${String(teaching)}`).toBe(false);
      for (const want of WANTS) {
        expect(eligibleFor(row, atClassical3, want), `${CUT} at ${String(teaching)} for ${want.for}`).toEqual({
          verdict: 'ineligible',
          why: 'teaching-use-not-approved',
          teaching,
        });
      }
    }
  });

  it('exploration opens it whatever the bit: the one exemption, deliberate', () => {
    for (const row of [cut, withTeachingUse(cut, 'no'), withTeachingUse(cut, 'fix'), withTeachingUse(cut, 'yes')]) {
      expect(eligibleFor(row, atClassical3, { for: 'exploration' }), `${CUT} at ${String(row.provenance?.review.teaching)}`).toMatchObject({
        verdict: 'eligible',
        for: 'exploration',
      });
    }
  });

  it('with a yes on the cut it is admitted to the existing gates: eligible at classical.3 for each want, still refused for a learner who has not met what it carries', () => {
    const approved = declaring(withTeachingUse(cut, 'yes'));
    expect(admittedForTeaching(approved)).toBe(true);
    expect(eligibleFor(approved, atClassical3, WANTS[0])).toMatchObject({ verdict: 'eligible', for: 'skill', practises: 'key-signature' });
    expect(eligibleFor(approved, atClassical3, WANTS[1])).toMatchObject({ verdict: 'eligible', for: 'requirement', practises: 'key-signature' });
    expect(eligibleFor(approved, atClassical3, WANTS[2])).toMatchObject({ verdict: 'eligible', for: 'demand', practises: 'key.signature' });
    expect(eligibleFor(approved, atClassical3, WANTS[3])).toMatchObject({ verdict: 'eligible', for: 'equivalent' });
    // A learner taught steps and skips only: the cut's bass clef, ledger lines, leaps, eighths and key signature are not met.
    expect(eligibleFor(approved, STEPS_AND_SKIPS, WANTS[2])).toMatchObject({ verdict: 'ineligible', why: 'untaught' });
  });

  /**
   * Revised (Entry 253, 2026-10-06): the Bizet left-hand cut carries a current teaching-use yes for its MODEL
   * role in A7c.1, decided by the outside reviewer from its verified facts (`responses/lp1-latin4-placement.md`
   * section 1). Entry 255 moved the cut's identity (the cutter pins the archive's creating system), which made
   * that decision stale; Entry 257 re-issued it on the current identity with `supersedes`, as the reviewer ruled
   * (`responses/g13-landing.md` section 2). It is the one decided cut; every other cut the build made is still
   * undecided and admitted to nothing automatic.
   */
  const DECIDED_CUTS = new Set(['excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh']);

  it('every excerpt the build cut is undecided, admitted to no automatic offer and open to exploration, except the one cut a reviewer decided', () => {
    const cuts = catalog.filter(isExcerpt);
    expect(cuts.length, 'no excerpt in the built catalogue').toBeGreaterThan(0);
    const decided = cuts.filter((excerpt) => DECIDED_CUTS.has(excerpt.id));
    expect(decided.map((excerpt) => excerpt.id).sort(), 'the decided cut is in the built catalogue').toEqual([...DECIDED_CUTS].sort());
    for (const excerpt of decided) {
      expect(excerpt.provenance?.review.teaching, excerpt.id).toBe(true);
      expect(admittedForTeaching(excerpt), excerpt.id).toBe(true);
      expect(eligibleFor(excerpt, COPES, { for: 'exploration' }).verdict, excerpt.id).toBe('eligible');
    }
    for (const excerpt of cuts.filter((candidate) => !DECIDED_CUTS.has(candidate.id))) {
      expect(excerpt.provenance?.review.teaching, excerpt.id).toBeNull();
      expect(admittedForTeaching(excerpt), excerpt.id).toBe(false);
      expect(eligibleFor(excerpt, COPES, { for: 'equivalent' }), excerpt.id).toEqual({ verdict: 'ineligible', why: 'teaching-use-not-approved', teaching: null });
      expect(eligibleFor(excerpt, COPES, { for: 'exploration' }).verdict, excerpt.id).toBe('eligible');
    }
  });

  it('a yes recorded on an older cut of the same definition admits nothing: the current cut resolves no decision, its bit null, the admission false, the verdict not approved', () => {
    const sha256 = createHash('sha256')
      .update(readFileSync(join(process.cwd(), 'public', 'content', cut.file as string)))
      .digest('hex');
    const current = identityOf(cut, sha256);
    expect(current).toEqual({ kind: 'file', sha256 });
    /** An earlier cut's sha256 (constructed; the build side makes a real one from a changed parent). */
    const OLDER: Identity = { kind: 'file', sha256: 'e1a0'.repeat(16) };
    expect(OLDER).not.toEqual(current);
    const yes = (event: string, identity: Identity): HumanEvent => ({
      v: 1,
      event,
      item: CUT,
      identity,
      dimension: 'goodTeachingUse',
      value: 'yes',
      basis: 'heard',
      category: 'usefulness',
      reason: 'a constructed decision for the staleness case',
      by: 'A. Reviewer',
      at: '2026-09-28T10:00:00.000Z',
    });
    /** The row as the build fills it from a record: the bit of the current decision on the cut's current identity. */
    const built = (events: HumanEvent[]) => {
      const { decided, status } = resolve(events, (item) => (item === CUT ? current : undefined));
      const provenance = cut.provenance as NonNullable<CatalogItem['provenance']>;
      return { status, row: { ...cut, provenance: { ...provenance, review: bits(decided.get(CUT)) } } };
    };

    const stale = built([yes('ev-e1a-older-cut', OLDER)]);
    expect(stale.status.get('ev-e1a-older-cut')).toBe('stale');
    expect(stale.row.provenance.review.teaching).toBeNull();
    expect(admittedForTeaching(stale.row)).toBe(false);
    expect(eligibleFor(stale.row, atClassical3, { for: 'equivalent' })).toEqual({ verdict: 'ineligible', why: 'teaching-use-not-approved', teaching: null });
    expect(eligibleFor(stale.row, atClassical3, { for: 'demand', demand: 'key.signature' })).toEqual({ verdict: 'ineligible', why: 'teaching-use-not-approved', teaching: null });

    // The same yes on the cut as it is now: current, the bit true, admitted.
    const fresh = built([yes('ev-e1a-this-cut', current)]);
    expect(fresh.status.get('ev-e1a-this-cut')).toBe('current');
    expect(fresh.row.provenance.review.teaching).toBe(true);
    expect(admittedForTeaching(fresh.row)).toBe(true);
    expect(eligibleFor(fresh.row, atClassical3, { for: 'equivalent' })).toMatchObject({ verdict: 'eligible', for: 'equivalent' });
  });
});

