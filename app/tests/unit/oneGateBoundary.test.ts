/**
 * One gate at the consumer boundary (E2a; the E2 review's required change, `docs/review/responses/2532022.md`):
 * an unmeasured candidate — a bundled row with no measurement, a score imported before the app measured
 * demands — is never offered automatically to a learner not prepared for every demand. Proved through the
 * consumers the app calls (`buildSession`'s card, `tieredAlternatives`, `swapOptions`) and at the one exported
 * gate they ask (`eligibility.eligibleFor`, recorded as they call it and returned unchanged): every automatic
 * question about such a candidate is refused `unknown-forbidden`, the unprepared demands and the missing
 * measurement named. Before E2a the same questions answered `exploration-only`, which refused as well, for a
 * reason that said only that a fact was missing — so the recorded verdicts, not the rows alone, are what tell
 * the one gate from the old path, and what the unknown-forbidden mutant turns red.
 *
 * Each case beside a control: the same candidate measured and clean is offered by the same path, so the path
 * is live and the refusal is the measurement's.
 *
 * The Library opens it: browsing never asks the gate, and an exploration want is eligible with the missing
 * measurement said.
 *
 * What the proof does not cover, by E0's and D3b's design: a row the card takes straight from a rung's own
 * list (the `runs`, `done` and `measure` asks, the ladder's rung and prerequisite steps, the jam slot, the
 * exposure rule) passes the teaching-use admission (`session.usable`) and not the gate — an authored
 * placement, or the learner's own assignment of an import to a rung, is not a selection. The last case
 * shows it, so the claim above is read at its scope.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as Gate from '../../src/curriculum/eligibility';

/** Every question the consumers ask the exported gate, with its answer, in the order asked. */
const recorder = vi.hoisted(() => ({ calls: [] as { id: string; want: { for: string }; verdict: { verdict: string; why?: string; demands?: readonly string[]; missing?: string } }[] }));

vi.mock('../../src/curriculum/eligibility', async (importOriginal) => {
  const actual = await importOriginal<typeof Gate>();
  return {
    ...actual,
    eligibleFor: (...args: Parameters<typeof actual.eligibleFor>) => {
      const verdict = actual.eligibleFor(...args);
      recorder.calls.push({ id: args[0].id, want: args[2], verdict });
      return verdict;
    },
  };
});

import { eligibleFor } from '../../src/curriculum/eligibility';
import { buildSession, swapOptions, type BuildInput, type SessionSlot } from '../../src/curriculum/session';
import { indexCatalog, tieredAlternatives } from '../../src/curriculum/selectors';
import { SHIPPED_SKILL_ACTIVATION } from '../../src/curriculum/skillActivation';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { ImportRow, SessionRow } from '../../src/data/db';
import { importToCatalogItem } from '../../src/data/importStore';
import { evidenceFor, stampedEvidence } from '../../src/evidence/evidence';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0, type Vocabulary } from '../../src/evidence/vocabulary';
import type { Identity } from '../../src/review/record';
import { matches as libraryMatches } from '../../src/ui/screens/LibraryScreen';
import { measured, unmeasured } from './helpers/measured';
import { observe } from './helpers/observed';
import { line, phrase } from './helpers/phrase';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const built = (id: string): CatalogItem => {
  const item = catalog.find((one) => one.id === id);
  if (!item) throw new Error(`${id} is not in the built catalogue — has the content build run?`);
  return item;
};

const TODAY = new Date(2026, 9, 20, 9);
const on = (day: number, hour = 12): string => new Date(2026, 9, day, hour).toISOString();
const READING_ROW = 'drill.reading.sight-reading-2-right';

/** D4's learner (`transferOffer.test.ts`): two first reads of a phrase that leaves the five-finger position, on two days. */
const SHIFT = phrase({ bars: [line(['C4', 'D4', 'E4', 'F4'], 1), line(['G4', 'A4', 'B4', 'C5'], 1)] });
const phraseOf = (seed: number): Identity => ({
  kind: 'generator',
  family: 'sight-reading',
  version: 2,
  seed,
  recipe: { level: 2, bars: 4, hands: 'R', fifths: 0, eighths: true, skips: true },
  tempoBpm: 72,
});
function read(day: number, material: Identity): SessionRow {
  const observation = { ...observe(SHIFT, { mode: 'tempo', unseen: true, guide: 'off', itemId: READING_ROW, at: on(day), hands: 'R' }), material };
  const results = evidenceFor({ observation, played: SHIFT, targetSkills: ['sight-reading', 'interval-reading', 'position-shift'], vocabulary: VOCABULARY_V0 });
  return { ...observation, ...stampedEvidence(results) } as SessionRow;
}
/** Proficient at shifting position, reading by interval and sight-reading: the transfer offer's learner. */
const SHOWN: SessionRow[] = [read(10, phraseOf(10)), read(11, phraseOf(11))];

/** Every demand taught at A and B but key signatures and notes outside the key: not prepared for every demand. */
const UNTAUGHT = ['key.signature', 'pitch.chromatic'];
const VOCABULARY: Vocabulary = {
  ...VOCABULARY_V0,
  demands: VOCABULARY_V0.demands.map((demand) => (UNTAUGHT.includes(demand.id) ? { ...demand, taughtAt: [] } : { ...demand, taughtAt: ['A', 'B'] })),
};

const lesson = (id: string, over: Partial<Lesson>): Lesson => ({
  id,
  title: `Lesson ${id}`,
  concepts: [],
  textFile: `lessons/${id}.md`,
  exerciseOptions: [],
  songOptions: [],
  mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
  requirements: [],
  ...over,
});
/** A behind the placement, lists the reading row; B the learner's rung, asking only its reads (the reader's). */
function curriculumWith(b: Partial<Lesson> = {}): Curriculum {
  return {
    version: 1,
    tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
    stages: [
      {
        number: 2,
        title: 'Two',
        summary: '',
        units: [
          {
            id: 'u',
            title: 'U',
            track: 'core',
            lessons: [
              lesson('A', { exerciseOptions: [READING_ROW, 'ex.a'], requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] }),
              lesson('B', { exerciseOptions: ['ex.b'], requirements: [{ kind: 'reads', skill: 'sight-reading', standard: 'full', share: 0.9, count: 5 }], ...b }),
            ],
          },
        ],
      },
    ],
  };
}

const exercise = (id: string): CatalogItem => ({ id, type: 'exercise', title: id, level: 2, hands: 'right', tracks: ['core'], concepts: [], file: `scores/${id}.mxl`, ...measured(['interval.step']) });
const song = (id: string, over: Partial<CatalogItem> = {}): CatalogItem => ({ id, type: 'song', title: id, level: 2, hands: 'right', tracks: ['core'], concepts: [], file: `scores/${id}.mxl`, ...over });
function importRow(id: string, over: Partial<ImportRow> = {}): ImportRow {
  return { id, kind: 'musicxml', title: id, data: '<score-partwise/>', tags: [], addedAt: '2026-09-29T08:00:00.000Z', level: 2, ...over };
}

/** The transfer offer's one candidate the gate passes, measured (the control) and with its measurement taken off. */
const PENT_A = built('exercise.pentatonic.a.pentatonic');
const PENT_UNREAD: CatalogItem = { ...PENT_A, ...unmeasured('no measurement record') };
/** A bundled song on no rung: the repertoire slot's candidate, measured and clean, and unmeasured. */
const SONG_READ = song('song.e2a.read', measured(['interval.step']));
const SONG_UNREAD = song('song.e2a.unread', unmeasured('no measurement record'));
/** A score imported before the app measured demands, not yet measured by the launch. */
const OLD_IMPORT = importToCatalogItem(importRow('import.e2a.from-before'));
const UNMEASURED = [PENT_UNREAD.id, SONG_UNREAD.id, OLD_IMPORT.id];

const BASE = [built(READING_ROW), exercise('ex.a'), exercise('ex.b')];

function card(items: CatalogItem[], minutes: number, curriculum = curriculumWith()): SessionSlot[] {
  const input: BuildInput = {
    curriculum,
    catalog: indexCatalog(items),
    items,
    states: rungState(SHOWN, curriculum, VOCABULARY_V0, TODAY),
    rows: SHOWN,
    learned: [],
    lastPlayed: new Map(),
    activeTracks: ['core'],
    minutes,
    startAt: 'B',
    today: TODAY,
    vocabulary: VOCABULARY,
  };
  return buildSession(input).slots;
}

/** The automatic questions the consumers asked about `ids`, and those not refused `unknown-forbidden` with demands and the missing fact named. */
function asked(ids: readonly string[]) {
  const automatic = recorder.calls.filter((call) => ids.includes(call.id) && call.want.for !== 'exploration');
  const otherwise = automatic.filter(
    (call) => !(call.verdict.verdict === 'ineligible' && call.verdict.why === 'unknown-forbidden' && (call.verdict.demands?.length ?? 0) > 0 && (call.verdict.missing ?? '') !== ''),
  );
  return { automatic, otherwise: otherwise.map((call) => `${call.id} ${JSON.stringify(call.want)}: ${JSON.stringify(call.verdict)}`) };
}

beforeEach(() => {
  recorder.calls.length = 0;
});

describe('the card: no row holds an unmeasured candidate the gate is asked about, and every question about one is refused unknown-forbidden', () => {
  it('control: measured and clean, the pentatonic is the transfer offer and the song the repertoire slot’s piece', () => {
    const held = [15, 30, 60, 120].flatMap((minutes) => card([...BASE, PENT_A, SONG_READ], minutes).map((slot) => `${slot.item?.id ?? ''} (${slot.claim?.kind ?? 'no claim'})`));
    expect(held).toContain(`${PENT_A.id} (transfer)`);
    expect(held).toContain(`${SONG_READ.id} (ready)`);
  });

  it('unmeasured in their place, with a score imported before the measurement: no row at any length, and each was asked and refused unknown-forbidden', () => {
    for (const minutes of [15, 30, 60, 120]) {
      const slots = card([...BASE, PENT_UNREAD, SONG_UNREAD, OLD_IMPORT], minutes);
      expect(
        slots.filter((slot) => UNMEASURED.includes(slot.item?.id ?? '')).map((slot) => `${slot.item?.id ?? ''} (${slot.claim?.kind ?? 'no claim'})`),
        `${String(minutes)} min`,
      ).toEqual([]);
    }
    const { automatic, otherwise } = asked(UNMEASURED);
    expect(otherwise.slice(0, 6), `${String(otherwise.length)} automatic questions not refused unknown-forbidden`).toEqual([]);
    // The transfer offer asked about the pentatonic (a skill), the repertoire slot about the song and the import (a demand).
    for (const id of UNMEASURED) expect(automatic.some((call) => call.id === id), id).toBe(true);
    expect(automatic.find((call) => call.id === PENT_UNREAD.id)?.verdict).toMatchObject({ why: 'unknown-forbidden', demands: UNTAUGHT, missing: 'no measurement record' });
  });
});

describe('the swap sheet: no tier and no last resort holds one, the rung’s own other option included', () => {
  const rung = lesson('1.5', { songOptions: ['song.source', SONG_UNREAD.id, OLD_IMPORT.id], requirements: [{ kind: 'runs', from: 'songs', count: 1 }] });
  const curriculum: Curriculum = { version: 1, tracks: [], stages: [{ number: 1, title: 'One', summary: '', units: [{ id: 'u', title: 'U', track: 'core', lessons: [rung] }] }] };
  /** The rung teaches steps and skips, and nothing else. */
  const STEPS_AND_SKIPS: Vocabulary = {
    ...VOCABULARY_V0,
    demands: VOCABULARY_V0.demands.map((demand) => ({ ...demand, taughtAt: demand.id === 'interval.step' || demand.id === 'interval.skip' ? ['1.5'] : [] })),
  };
  const learner = { taught: (demand: string) => demand === 'interval.step' || demand === 'interval.skip' };
  const source = song('song.source', { targetSkills: ['interval-reading'], ...measured(['interval.step', 'interval.skip'], { established: ['interval.skip'] }) });
  const slot = (item: CatalogItem): SessionSlot => ({ kind: 'repertoire', minutes: 10, item, lessonId: '1.5', reason: '' });
  const sheet = (items: CatalogItem[]): string[] => {
    const index = indexCatalog(items);
    const tiers = tieredAlternatives({ itemId: source.id, lessonId: '1.5', limit: 50 }, curriculum, index, SHIPPED_SKILL_ACTIVATION, learner).map((one) => `${one.item.id} (${one.tier})`);
    const options = swapOptions(slot(source), [slot(source)], curriculum, index, { items, rung: '1.5', vocabulary: STEPS_AND_SKIPS, activeTracks: [] }).map((one) => `${one.item.id} (${one.tier})`);
    return [...tiers, ...options];
  };

  it('control: the rung’s other song, measured and clean, is on the sheet', () => {
    const clean = song(SONG_UNREAD.id, measured(['interval.step']));
    expect(sheet([source, clean])).toContain(`${SONG_UNREAD.id} (lesson)`);
  });

  it('unmeasured, and a score imported before the measurement assigned to the rung: on no tier, and every question about them refused unknown-forbidden', () => {
    const offered = sheet([source, SONG_UNREAD, OLD_IMPORT]);
    expect(offered.filter((one) => UNMEASURED.some((id) => one.startsWith(`${id} `)))).toEqual([]);
    const { automatic, otherwise } = asked([SONG_UNREAD.id, OLD_IMPORT.id]);
    expect(otherwise.slice(0, 6), `${String(otherwise.length)} automatic questions not refused unknown-forbidden`).toEqual([]);
    for (const id of [SONG_UNREAD.id, OLD_IMPORT.id]) expect(automatic.some((call) => call.id === id && call.want.for === 'equivalent'), id).toBe(true);
    expect(automatic.find((call) => call.id === OLD_IMPORT.id)?.verdict.missing).toBe('imported before the app measured demands');
  });
});

describe('the Library opens it: browsing is not an offer, and exploration is eligible with the missing measurement said', () => {
  it('lists the unmeasured song and the import, and the exploration want is eligible for exploration', () => {
    const browse = { query: '', type: 'all', track: 'all', status: 'all', hands: 'all', minLevel: 0, maxLevel: 10, importedOnly: false, sort: 'level' } as const;
    expect(libraryMatches(SONG_UNREAD, browse as never, new Map())).toBe(true);
    expect(libraryMatches(OLD_IMPORT, { ...browse, importedOnly: true }, new Map())).toBe(true);
    const learner = { taught: (demand: string) => demand === 'interval.step' };
    expect(eligibleFor(SONG_UNREAD, learner, { for: 'exploration' })).toEqual({ verdict: 'eligible', for: 'exploration', missing: 'no measurement record' });
    expect(eligibleFor(OLD_IMPORT, learner, { for: 'exploration' })).toEqual({ verdict: 'eligible', for: 'exploration', missing: 'imported before the app measured demands' });
  });
});

describe('the proof’s scope: a rung’s own list is placement, not selection (E0, D3b)', () => {
  it('a rung that lists the unmeasured song as its songs option offers it from its own list: the admission is asked, not the gate', () => {
    const listing = curriculumWith({ songOptions: [SONG_UNREAD.id], requirements: [{ kind: 'runs', from: 'songs', count: 1 }] });
    const kinds = card([...BASE, SONG_UNREAD], 30, listing)
      .filter((slot) => slot.item?.id === SONG_UNREAD.id)
      .map((slot) => slot.claim?.kind);
    // The rung's own ask, or the fallback ladder's rung step: both take the rung's list through `usable`.
    expect(kinds).toHaveLength(1);
    expect(['asked', 'rung']).toContain(kinds[0]);
  });
});
