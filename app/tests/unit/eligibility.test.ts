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
 * 8. `demands: unmeasured` → eligible for exploration only, the missing measurement said;
 * 9. genre and tags satisfy no requirement;
 *
 * plus the reason text, the declared large-hand voicing (D0 finding 5), the rung
 * requirement that only evidence can meet (the reviewer's constraint (a)), the
 * readiness floor the brief asked to compare, and the density rule held equal to the
 * build's on every built item.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  eligibleFor,
  OPPORTUNITY_DENSITY,
  targetDemandsFor,
  targetSkillsFor,
  usefulDensity,
  type Learner,
} from '../../src/curriculum/eligibility';
import { indexCatalog, tieredAlternatives } from '../../src/curriculum/selectors';
import { taughtAtRung } from '../../src/curriculum/session';
import { SHIPPED_SKILL_ACTIVATION, EVERY_DECLARED_SKILL } from '../../src/curriculum/skillActivation';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';
import { addImport, correctImportHands, importToCatalogItem } from '../../src/data/importStore';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
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

  it('8. demands unmeasured: eligible for exploration and project work only, with the missing measurement said', () => {
    const candidate = song('song.unread', unmeasured('the app could not load the file'));
    for (const want of [{ for: 'equivalent' }, { for: 'demand', demand: 'interval.skip' }, { for: 'skill', skill: 'interval-reading' }, { for: 'requirement', skill: 'interval-reading' }] as const) {
      expect(eligibleFor(candidate, STEPS_AND_SKIPS, want), want.for).toEqual({ verdict: 'exploration-only', missing: 'the app could not load the file' });
    }
    expect(eligibleFor(candidate, STEPS_AND_SKIPS, { for: 'exploration' })).toEqual({ verdict: 'eligible', for: 'exploration', missing: 'the app could not load the file' });
    // An item with no measurement record at all (a catalogue from before E0) is not "no demands".
    expect(eligibleFor(song('song.no-record'), STEPS_AND_SKIPS, { for: 'equivalent' }).verdict).toBe('exploration-only');
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
  it('names every vocabulary demand, and no two rules are the whole table', () => {
    expect(Object.keys(OPPORTUNITY_DENSITY.demands).sort()).toEqual(VOCABULARY_V0.demands.map((d) => d.id).sort());
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
 * Q8's case on the real corpus (E1 item 7; Part 24's adversaries 1 and 2): the whole of Anh. 113
 * is refused for a Stage 3 want — it carries sixteenths (taught at no rung) and triplets (4.5),
 * which `classical.3`, its rung, has not taught — and its approved excerpt is eligible, measured on
 * the cut; the parent's demands are the parent's, unchanged by the cut. No excerpt branch in the
 * gate: the cut's measured demands are what it reads.
 */
describe('Anh. 113 whole and in its excerpt, through the one gate (E1, Q8)', () => {
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

  it('its approved excerpt is eligible there, for the key signature its bars establish, and the parent is unchanged', () => {
    expect(excerpts.length, 'an approved excerpt of Anh. 113 is in the built catalogue').toBeGreaterThan(0);
    for (const excerpt of excerpts) {
      expect(eligibleFor(excerpt, atClassical3, { for: 'equivalent' }).verdict, excerpt.id).toBe('eligible');
      expect(eligibleFor(excerpt, atClassical3, { for: 'demand', demand: 'key.signature' }), excerpt.id).toMatchObject({
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

