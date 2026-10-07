// @vitest-environment node
/**
 * latin.4 is met by the chain record's two counted runs and by nothing else (LP1, finish item 4;
 * `docs/chains/A7c.1.yaml`, `evidence.updates` and `never_credits`).
 *
 * Read from the *built* curriculum, the rung as the app loads it, through `rungState`, the one path
 * from the stored rows to "this rung is met" (`rungStateFromEvidence.test.ts`). The counted actions are
 * the record's step 13 (the whole left-hand cut in Keep tempo) and the 2/4 tresillo control in Keep
 * tempo (`exercise.bass-cell.tresillo.c`, the exact 2/4, ♩ = 60 counterpart of the habanera drill),
 * each at the pass pair and each opened from latin.4. Everything the record calls self-checked or never
 * credited — a Wait run, a Rhythm only run, a partial loop, the parent or another piece in the cut's
 * place, a run another rung judged, a run below the tempo floor, and (G13) the habanera drill or a 4/4
 * tresillo exercise in the control's place — leaves it unmet.
 *
 * Revised (G13; the ruling `docs/review/responses/g13-habanera-control.md` §2): the exercises requirement
 * names the 2/4 tresillo control, so a run of any other exercise option no longer meets it. The old
 * assumption was "one run of any of the three 4/4 tresillo items", which let the rung complete without
 * the like-for-like control ever being played at pitch.
 *
 * What the rows prove is notes and rough timing at a tempo against the app's clock (MODE-SHEET §2); none
 * of it is the cell's identity, the recognition or the feel, and nothing here was heard.
 *
 * **A7c.1's acceptance path** (lane A7S; the record's top-level `acceptance_test`, which the chain checker's
 * R8 reads; FABLE §9: a self-checked independence test has the app record only the permitted self-check and
 * award no unsupported skill evidence). Beside the two counted runs above, the last block drives every
 * self-checked step that leaves an app row — a *Hear it* (an encounter, no run), a *Rhythm only* run and a
 * *Wait for me* run on every latin.4 option, the uncounted Keep tempo runs, and the step-20 pieces on latin.6
 * and latin.7 (the lesson's numbering; the record's step 24) — through the entry points the app uses: the
 * activation boundary the Score screen and the evidence job ask (`skillsInForce`), the store (`recordRun`,
 * `recordEncounter`, `rungRows`), the evidence job (`runEvidenceJob`), the ladder (`skillLadders`) and
 * `rungState`. It asserts no row carries skill evidence, no skill moves (`habanera-and-tresillo` is observable
 * `none` and absent from the ladder before and after), nothing stored names a cell or its demands outside the
 * played item's own identity, and latin.4 meets on the two counted rows and on nothing else.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rungState, skillLadders } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { storedEvidence } from '../../src/evidence/readingState';
import { skillsInForce } from '../../src/curriculum/skillActivation';
import { runFacts } from '../../src/curriculum/material';
import { runEvidenceJob } from '../../src/data/evidenceJob';
import { recordRun, resetProgressForTest, rungRows, sessionsTidied, walkSessions, type RunResult } from '../../src/data/progressStore';
import { allEncounters, recordEncounter, resetEncountersForTest } from '../../src/data/encounterStore';
import { NOT_MEASURED } from '../../src/engine/types';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { EncounterRow, SessionRow } from '../../src/data/db';

const curriculum = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'curriculum.json'), 'utf8')) as Curriculum;
const catalog = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'catalog.json'), 'utf8')) as CatalogItem[];

const RUNG = 'latin.4';
const CUT = 'excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh';
const PARENT = 'song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx';
const CABEZA = 'song.folk.por-una-cabeza-carlos-gardel.pdmx';
const CRAVE = 'song.jazz.the-crave';
/** The counted exercise: the 2/4 tresillo control (G13). */
const CONTROL = 'exercise.bass-cell.tresillo.c';
/** The habanera drill, its control's partner, in C, F and G: lesson steps, never the counted exercise. */
const HABANERAS = ['exercise.bass-cell.habanera.c', 'exercise.bass-cell.habanera.f', 'exercise.bass-cell.habanera.g'];
/** The 4/4 tresillo exercises latin.3 also uses: practice and continuity here, never counted. */
const TRESILLOS = ['exercise.tresillo.c', 'exercise.tresillo.f', 'exercise.tresillo.g'];
const TODAY = new Date('2026-10-10T12:00:00Z');

function lesson(): Lesson | undefined {
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) for (const one of unit.lessons) if (one.id === RUNG) return one;
  }
  return undefined;
}

/** A Keep tempo run at the pass pair, judged by latin.4, covering the whole item, as the Score screen writes it. */
function run(itemId: string, over: Partial<SessionRow> = {}): SessionRow {
  return {
    itemId,
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: 0.95,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    at: '2026-10-01T10:00:00.000Z',
    lessonId: RUNG,
    range: { fromMeasure: 0, toMeasure: 11 },
    wholeItem: true,
    ...over,
  };
}

const LEFT = { hands: { played: 'L' as const, appPlayed: 'none' as const } };
const EIGHT_BARS = { range: { fromMeasure: 0, toMeasure: 7 } };

function status(rows: SessionRow[]): string | undefined {
  return rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get(RUNG)?.status;
}

describe('latin.4 as the build wrote it', () => {
  it('is in the built curriculum with the two requirements the record names, the exercise one naming the 2/4 control', () => {
    const rung = lesson();
    expect(rung, 'latin.4 is not in the built curriculum').toBeDefined();
    expect(rung?.mastery).toEqual({ minAccuracy: 0.9, minTempoPct: 0.8 });
    expect(rung?.requirements).toEqual([
      { kind: 'runs', from: 'exercises', items: [CONTROL], count: 1 },
      { kind: 'runs', from: 'songs', items: [CUT], count: 1 },
    ]);
    // Revised (G13): seven options, the 2/4 pair first (the counted control, then its habanera partner), the
    // habanera's other keys, then the 4/4 tresillo items; was the three 4/4 tresillo items alone.
    expect(rung?.exerciseOptions).toEqual([CONTROL, ...HABANERAS, ...TRESILLOS]);
  });
});

describe('met by the two counted runs', () => {
  it('a passing Keep tempo run of the 2/4 tresillo control and of the whole cut, both opened from latin.4', () => {
    expect(status([run(CONTROL, EIGHT_BARS), run(CUT, LEFT)])).toBe('met');
  });

  it('at the pass pair exactly: 90 % accuracy at 80 % of the written tempo', () => {
    expect(status([run(CONTROL, { ...EIGHT_BARS, accuracy: 0.9, tempoPct: 80 }), run(CUT, { ...LEFT, accuracy: 0.9, tempoPct: 80 })])).toBe('met');
  });
});

describe('not met by anything else: the other requirement holds, so the rung stays in progress', () => {
  const control = run(CONTROL, EIGHT_BARS);

  it('either counted run alone', () => {
    expect(status([control])).toBe('in progress');
    expect(status([run(CUT, LEFT)])).toBe('in progress');
  });

  // G13: the requirement names the control, so no other exercise option stands in for it.
  it.each(HABANERAS)('%s in the 2/4 tresillo control’s place', (habanera) => {
    expect(status([run(habanera, EIGHT_BARS), run(CUT, LEFT)])).toBe('in progress');
  });

  it.each(TRESILLOS)('the 4/4 %s in the 2/4 tresillo control’s place', (tresillo) => {
    expect(status([run(tresillo, EIGHT_BARS), run(CUT, LEFT)])).toBe('in progress');
  });

  it('every other exercise option at once, with the cut', () => {
    expect(status([...HABANERAS, ...TRESILLOS].map((id) => run(id, EIGHT_BARS)).concat(run(CUT, LEFT)))).toBe('in progress');
  });

  it('the cut in Wait for me', () => {
    expect(status([control, run(CUT, { ...LEFT, mode: 'wait', tempoMeasured: false })])).toBe('in progress');
  });

  it('the cut with Rhythm only', () => {
    expect(status([control, run(CUT, { ...LEFT, rhythmOnly: true })])).toBe('in progress');
  });

  it('the control with Rhythm only (the contrast taps of steps 6 and 7)', () => {
    expect(status([run(CONTROL, { ...EIGHT_BARS, rhythmOnly: true }), run(CUT, LEFT)])).toBe('in progress');
  });

  it('the cut looped over part of its bars', () => {
    expect(status([control, run(CUT, { ...LEFT, range: { fromMeasure: 0, toMeasure: 1 }, wholeItem: false })])).toBe('in progress');
  });

  it.each([PARENT, CABEZA, CRAVE])('%s played in the cut’s place', (other) => {
    expect(status([control, run(other)])).toBe('in progress');
  });

  it('the cut opened from another rung, or from none', () => {
    expect(status([control, run(CUT, { ...LEFT, lessonId: 'latin.6' })])).toBe('in progress');
    const { lessonId: _dropped, ...unjudged } = run(CUT, LEFT);
    expect(status([control, unjudged as SessionRow])).toBe('in progress');
  });

  it('the control opened from another rung', () => {
    expect(status([run(CONTROL, { ...EIGHT_BARS, lessonId: 'latin.3' }), run(CUT, LEFT)])).toBe('in progress');
  });

  it('a control run below the tempo floor', () => {
    expect(status([run(CONTROL, { ...EIGHT_BARS, tempoPct: 79 }), run(CUT, LEFT)])).toBe('in progress');
  });

  it('a control run below the accuracy floor', () => {
    expect(status([run(CONTROL, { ...EIGHT_BARS, accuracy: 0.89 }), run(CUT, LEFT)])).toBe('in progress');
  });
});

// --- A7c.1's acceptance path: the self-checked steps record only their permitted rows and credit nothing ---

/** The skill the two cells are coped with by: observable `none` (CD1). */
const SKILL = 'habanera-and-tresillo';
const CUMPARSITA_B = 'song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-b.pdmx';
const CHOCLO = 'song.classical.el-choclo-piano.pdmx';
/** A reading row: the shipped activation's kind of item, whose runs the evidence job does pick up. */
const READING_ROW = 'drill.reading.sight-reading-2-right';
const AT = '2026-10-01T10:00:00.000Z';
const byId = new Map(catalog.map((item) => [item.id, item]));

type Tool = 'hear' | 'rhythm' | 'wait' | 'tempo';
interface Case {
  /** The lesson's step number (the brief's), then the record's. */
  step: string;
  itemId: string;
  rung: string;
  tool: Tool;
  over?: Partial<SessionRow>;
}

function optionsOf(rungId: string): string[] {
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) for (const one of unit.lessons) if (one.id === rungId) return [...one.exerciseOptions, ...one.songOptions];
  }
  return [];
}

function itemOf(id: string): CatalogItem {
  const item = byId.get(id);
  if (item === undefined) throw new Error(`${id} is not in the built catalog`);
  return item;
}

/** The latin.6 and latin.7 pieces step 20's task line names (Entry 259). */
const STEP_20: [string, string][] = [
  ['latin.6', CABEZA],
  ['latin.6', CRAVE],
  ['latin.6', CUMPARSITA_B],
  ['latin.7', CHOCLO],
];

const UNMEASURED: readonly Tool[] = ['hear', 'rhythm', 'wait'];

/**
 * Every self-checked step that leaves an app row, and the uncounted practice beside them, each at the pass
 * pair over the whole item unless the step loops: the worst case, a row that would count if its tool were
 * not refused.
 */
const SELF_CHECKED: Case[] = [
  // Lesson steps 2-7, 11, 12, 15, 16, 18 and 19 (record steps 2-7, 15, 16, 19, 20, 22 and 23): any latin.4
  // option heard, tapped in Rhythm only, or played in Wait for me.
  ...optionsOf(RUNG).flatMap((itemId) => UNMEASURED.map((tool): Case => ({ step: 'lesson 2-7, 11, 12, 15, 16, 18, 19', itemId, rung: RUNG, tool }))),
  // Lesson step 14 (record 18): the bass under the tune, the app playing the right hand, on a loop of bars 1-12.
  {
    step: 'lesson 14 (record 18)',
    itemId: PARENT,
    rung: RUNG,
    tool: 'tempo',
    over: { range: { fromMeasure: 0, toMeasure: 11 }, wholeItem: false, hands: { played: 'L', appPlayed: 'other hand' } },
  },
  // Lesson step 16 (record 20): The Crave's bars 21-22 tapped on a loop.
  { step: 'lesson 16 (record 20)', itemId: CRAVE, rung: RUNG, tool: 'rhythm', over: { range: { fromMeasure: 20, toMeasure: 21 }, wholeItem: false } },
  // Lesson step 19 (record 23): Por Una Cabeza's bars 1-14 (the pickup is bar 0) tapped on a loop.
  { step: 'lesson 19 (record 23)', itemId: CABEZA, rung: RUNG, tool: 'rhythm', over: { range: { fromMeasure: 1, toMeasure: 14 }, wholeItem: false } },
  // Lesson steps 7a, 7b, 8, 9 and 10 (record 8-10, 12-14): the uncounted Keep tempo practice (never_credits).
  ...[...HABANERAS, ...TRESILLOS].map((itemId): Case => ({ step: 'lesson 7a-10 (record 8-10, 12-14)', itemId, rung: RUNG, tool: 'tempo' })),
  // Lesson step 20 (record 24): the later rung's pieces, heard, tapped, waited on and played.
  ...STEP_20.flatMap(([rung, itemId]) =>
    (['hear', 'rhythm', 'wait', 'tempo'] as const).map((tool): Case => ({ step: `lesson 20 (record 24) on ${rung}`, itemId, rung, tool })),
  ),
];

/**
 * A run as the Score screen hands it to the store (`ScoreScreen.ts`, the `run` it builds in `showSummary`):
 * Rhythm only is a Keep tempo run with `rhythmOnly` and its pass and mastery refused; Wait for me measures
 * no tempo. Its evidence is what the screen computes: none where `skillsInForce(item)` is empty, which the
 * first case below holds for every item here.
 */
function scoreScreenRun(c: Pick<Case, 'itemId' | 'rung' | 'tool' | 'over'>): RunResult {
  const rhythm = c.tool === 'rhythm';
  const wait = c.tool === 'wait';
  return {
    itemId: c.itemId,
    lessonId: c.rung,
    opened: { tab: 'lesson', rung: c.rung, slot: NOT_MEASURED },
    ...runFacts(itemOf(c.itemId)),
    mode: wait ? 'wait' : 'tempo',
    tempoPct: 100,
    tempoMeasured: !wait,
    accuracy: 0.95,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    passed: !rhythm,
    masterEligible: !rhythm,
    ...(rhythm ? { rhythmOnly: true } : {}),
    range: { fromMeasure: 0, toMeasure: 7 },
    wholeItem: true,
    hands: { played: 'L', appPlayed: 'none' },
    at: AT,
    ...c.over,
  };
}

/** Each case as the app writes it: a Hear it as the encounter `noteHearing` writes, every other tool as a run. */
async function store(cases: readonly Case[]): Promise<{ rows: SessionRow[]; encounters: EncounterRow[] }> {
  for (const [index, c] of cases.entries()) {
    if (c.tool === 'hear') {
      await recordEncounter({
        kind: 'heard',
        itemId: c.itemId,
        material: runFacts(itemOf(c.itemId)).material,
        source: { tab: 'lesson', rung: c.rung },
        visit: `a7s-${String(index)}`,
        at: new Date(AT),
      });
    } else {
      await recordRun(scoreScreenRun(c), new Date(AT));
    }
  }
  await sessionsTidied();
  return { rows: await rungRows(), encounters: await allEncounters() };
}

describe('A7c.1’s acceptance path: every self-checked step records only its permitted row and credits nothing', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
    resetEncountersForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
  });

  it('the cells’ skill is observable none, and no item these steps open has a skill in force (the Score screen’s and the job’s gate)', () => {
    expect(VOCABULARY_V0.skills.find((skill) => skill.id === SKILL)?.observable).toBe('none');
    const inForce = [...new Set(SELF_CHECKED.map((c) => c.itemId))]
      .map((id) => [id, skillsInForce(itemOf(id))] as const)
      .filter(([, skills]) => skills.length > 0)
      .map(([id, skills]) => `${id}: ${skills.join(', ')}`);
    expect(inForce).toEqual([]);
    // Not vacuous: the gate does let the reading rows' skills through.
    expect(skillsInForce(itemOf(READING_ROW)).length).toBeGreaterThan(0);
  });

  it('a Hear it writes an encounter and no run; Rhythm only, Wait for me and Keep tempo write one run each, Rhythm only flagged', async () => {
    const { rows, encounters } = await store(SELF_CHECKED);
    const heard = SELF_CHECKED.filter((c) => c.tool === 'hear');
    expect(encounters.map((row) => `${row.kind} ${row.itemId} ${row.source.rung ?? ''}`).sort()).toEqual(
      heard.map((c) => `heard ${c.itemId} ${c.rung}`).sort(),
    );
    expect(rows).toHaveLength(SELF_CHECKED.length - heard.length);
    expect(rows.filter((row) => row.rhythmOnly === true)).toHaveLength(SELF_CHECKED.filter((c) => c.tool === 'rhythm').length);
    expect(rows.filter((row) => row.mode === 'wait' && row.tempoMeasured === false)).toHaveLength(SELF_CHECKED.filter((c) => c.tool === 'wait').length);
  });

  it('no stored run carries skill evidence, and no skill moves: the ladder reads as it does for a learner with no runs', async () => {
    const { rows } = await store(SELF_CHECKED);
    const carrying = rows.filter((row) => row.evidence !== undefined || row.evidenceDefinitions !== undefined || storedEvidence(row).length > 0);
    expect(carrying.map((row) => `${row.itemId} ${row.mode}${row.rhythmOnly === true ? ' rhythm' : ''}`)).toEqual([]);
    const after = skillLadders(rows, VOCABULARY_V0, TODAY);
    expect(after).toEqual(skillLadders([], VOCABULARY_V0, TODAY));
    // The ladder never lists a skill no run observes: nothing to move, before or after.
    expect(after.has(SKILL)).toBe(false);
  });

  it('nothing stored names a cell, its demands or its skill, outside the played item’s own identity', async () => {
    const { rows, encounters } = await store(SELF_CHECKED);
    const faults: string[] = [];
    for (const row of [...rows, ...encounters] as unknown as Record<string, unknown>[]) {
      // The identity of what was played (its id, its material and the encounter's key built from it) names
      // the item, a generator's recipe included; it is the fact of what was opened, not a claim about the learner.
      const { itemId, material: _material, key: _key, ...rest } = row;
      if (/habanera|tresillo/i.test(JSON.stringify(rest))) faults.push(`${String(itemId)}: ${JSON.stringify(rest)}`);
      if (/rhythm\.habanera|rhythm\.tresillo|habanera-and-tresillo/.test(JSON.stringify(row))) faults.push(`${String(itemId)} names a cell demand or the skill`);
    }
    expect(faults).toEqual([]);
  });

  it('the evidence job leaves every one of these runs alone, and is seen to pick up a run whose item bears evidence', async () => {
    await store(SELF_CHECKED);
    // A reading-row run stored with no evidence: the one kind of run the job is for.
    await recordRun({ ...scoreScreenRun({ itemId: READING_ROW, rung: '1.5', tool: 'tempo' }), passed: false, masterEligible: false }, new Date(AT));
    const reading = (await rungRows()).find((row) => row.itemId === READING_ROW);
    const writes: number[] = [];
    const status = await runEvidenceJob({
      curriculum: () => Promise.resolve(curriculum),
      items: () => Promise.resolve(catalog),
      walkRuns: walkSessions,
      writeEvidence: (id) => {
        writes.push(id);
        return Promise.resolve();
      },
      modelOf: () => Promise.reject(new Error('no model in this test')),
      write: () => {
        throw new Error('no phrase in this test');
      },
      vocabulary: VOCABULARY_V0,
      idle: () => Promise.resolve(),
      carryOver: () => Promise.resolve(0),
      normalise: () => Promise.resolve([]),
      announce: () => undefined,
    });
    expect(reading?.id).toBeDefined();
    expect(writes).toEqual([reading?.id]);
    expect(status.recomputed).toBe(0);
  });

  it('latin.4 meets on the two counted rows and on nothing else; the hearing, tapping and waiting count toward no rung', async () => {
    const { rows } = await store(SELF_CHECKED);
    const alone = rungState(rows, curriculum, VOCABULARY_V0, TODAY).byRung.get(RUNG);
    expect(alone?.requirements.map((reading) => [reading.have, reading.items])).toEqual([
      [0, []],
      [0, []],
    ]);
    expect(alone?.status).toBe('in progress');

    await recordRun(scoreScreenRun({ itemId: CONTROL, rung: RUNG, tool: 'tempo' }), new Date(AT));
    await recordRun(scoreScreenRun({ itemId: CUT, rung: RUNG, tool: 'tempo', over: { range: { fromMeasure: 0, toMeasure: 11 } } }), new Date(AT));
    const met = rungState(await rungRows(), curriculum, VOCABULARY_V0, TODAY).byRung.get(RUNG);
    expect(met?.status).toBe('met');
    expect(met?.requirements.map((reading) => reading.items)).toEqual([[CONTROL], [CUT]]);

    // Step 20's later rungs: a Rhythm only or Wait for me row meets nothing there either (a Hear it writes no run).
    const unmeasured = rows.filter((row) => row.rhythmOnly === true || row.mode === 'wait');
    const later = rungState(unmeasured, curriculum, VOCABULARY_V0, TODAY);
    for (const rung of ['latin.6', 'latin.7']) {
      expect(later.byRung.get(rung)?.requirements.map((reading) => reading.have), rung).toEqual([0, 0]);
    }
  });
});
