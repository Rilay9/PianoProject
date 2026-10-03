/**
 * The seven bundled PDMX scores that print their tempo as text (E50, Entry 163; the brief
 * `docs/prompts/tasks/E50-seven-rows-print-their-tempo.md` and the reviewer's conditional approval in it,
 * `docs/review/responses/questions-bd7d303e.md` §4): each is re-converted so its printed "= N" is its
 * `<metronome>`, and its file's bytes, and so its material identity, move. A learner who opened or played
 * the old file has still met the piece: the old identity is related to the repaired file through E50a's
 * learner-material relation (`provenance.formerIdentities`, here fed from `tools/content/repaired_identities.json`
 * exactly as the build feeds it), for contact, familiarity and project continuity. Since E50b (Entry 181) the
 * Wabash cut, re-cut from the repaired parent, carries its old cut the same way (the table's `cuts`).
 *
 * The boundary, the reviewer's words: the old run stays a run at its recorded tempo and context — never
 * rewritten, re-scored or claimed at the corrected tempo — and the relation must not let old performance
 * evidence satisfy a tempo-dependent standard. E50 showed the alias itself never does. E50b closes the other
 * route the reviewer named (`docs/review/responses/68e0479b.md` §3): a rung re-judges the runs it judged by
 * item id from their stored `tempoPct`, and an old run's 100 % was 100 % of the converter's defaulted 96, not of
 * the tempo the repaired score now prints. The build marks each repair's old identity as tempo-changed
 * (`provenance.tempoRepairedFrom`), and `rungState.meetsStandard` refuses such a run's tempo channel
 * (`material.tempoNotComparable`): it meets a standard that asks no tempo and no standard that asks one. The run
 * itself is never rewritten; its contact, its familiarity and its other observations stay what they were; a run
 * recorded after the repair, and every run of an item no repair touched, is read as before.
 *
 * The continuity cases are red where the relation does not exist (before E50, the committed file is absent);
 * E50b's standard cases are red where the guard does not exist (the old run counts toward the rung at 100 %);
 * the after-the-repair and outside-the-repair cases are guards, green before and after by design
 * (`docs/prompts/runs/E50/`, `docs/prompts/runs/E50b/`).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EncounterRow, ProjectRow, SessionRow } from '../../src/data/db';
import { contactIn } from '../../src/data/progressStore';
import { familiarityIn, type EncounterHistory } from '../../src/data/encounterStore';
import { projectIn } from '../../src/data/projectStore';
import { learnerMaterialKeys, sameMaterial, tempoNotComparable } from '../../src/curriculum/material';
import { loadCatalog, resetContentCacheForTest } from '../../src/curriculum/load';
import { meetsStandard, rungState, type LearnerRecord } from '../../src/evidence/rungState';
import { EVIDENCE_DEFINITIONS, type MeasuredEvidence } from '../../src/evidence/evidence';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { sameIdentity, type Identity } from '../../src/review/record';
import type { CatalogItem, Curriculum, Lesson, Requirement } from '../../src/curriculum/types';

// --- the committed relation, the rows and the historical table ------------------------------------

const REPO = join(process.cwd(), '..');
const readJson = <T>(...parts: string[]): T => JSON.parse(readFileSync(join(REPO, ...parts), 'utf8')) as T;

interface Repair { id: string; file: string; change: string; from: string; date?: string; system?: number; undated?: boolean; to: string; restore: unknown[]; tempoChanged?: boolean }
interface CutRelation { id: string; file: string; of: string; parentFrom: string; parentTo: string; from: string; system: number; to: string; tempoChanged?: boolean }
interface PdmxRow { id: string; cid: string; convertedSha256: string; tempoBpm: number; tempoDefaulted: boolean; level: number }

const SEVEN = [
  'song.pop.margie.pdmx',
  'song.jazz.django-reinhardt-limehouse-blues.pdmx',
  'song.blues.singin-the-blues',
  'song.blues.weary-blues',
  'song.blues.storyville-blues',
  'song.blues.wabash-blues',
  'song.blues.tishomingo-blues',
];
const CUT = 'excerpt.blues.wabash-blues.b1-4';

function committed(): { repairs: Repair[]; cuts: CutRelation[]; rows: Map<string, PdmxRow>; historical: { file: string; date: string; system: number; sha256: string; undated: string }[] } {
  const table = readJson<{ repairs: Repair[]; cuts?: CutRelation[] }>('tools', 'content', 'repaired_identities.json');
  const rows = new Map(readJson<{ items: PdmxRow[] }>('content', 'sources', 'pdmx.json').items.map((row) => [row.id, row]));
  const historical = readJson<{ identities: { file: string; date: string; system: number; sha256: string; undated: string }[] }>('tools', 'content', 'former_identities.json').identities;
  return { repairs: table.repairs, cuts: table.cuts ?? [], rows, historical };
}

const file = (sha256: string): Extract<Identity, { kind: 'file' }> => ({ kind: 'file', sha256 });

/** What the build writes on a repaired row's provenance: the old identity for continuity and, since E50b, as tempo-changed. */
interface Lineage { formerIdentities?: string[]; tempoRepairedFrom?: string[] }

/** One of the repaired rows as the build writes it: its identity the repaired file, the old one among its former identities. */
function built(id: string, type: 'song' | 'excerpt', current: string, tempoBpm: number, lineage: Lineage): CatalogItem {
  return {
    id,
    type,
    title: id,
    level: 3,
    tracks: ['core'],
    concepts: [],
    tags: [],
    tempoBpm,
    file: `scores/${id}.mxl`,
    provenance: {
      source: type === 'song' ? 'pdmx' : 'excerpt',
      facts: {},
      review: { score: null, teaching: null },
      identity: file(current),
      ...(lineage.formerIdentities === undefined ? {} : { formerIdentities: lineage.formerIdentities.map(file) }),
      ...(lineage.tempoRepairedFrom === undefined ? {} : { tempoRepairedFrom: lineage.tempoRepairedFrom.map(file) }),
    },
  } as unknown as CatalogItem;
}

async function loadThe(catalog: readonly CatalogItem[]): Promise<void> {
  resetContentCacheForTest();
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, statusText: 'OK', text: () => Promise.resolve(JSON.stringify(catalog)) })));
  await loadCatalog();
}

// --- stored rows, as the app stored them while the old file was the catalogue's --------------------

const AT = '2026-09-29T12:00:00.000Z';
const RENAMED = 'song.under-another-id';
const RUNG = 'e50.rung';

/** A Keep tempo run of the old file, at 100 % of the tempo the app then gave it: the converter's 96, defaulted. */
function oldRun(itemId: string, from: string, extra: Partial<SessionRow> = {}): SessionRow {
  return {
    itemId,
    lessonId: RUNG,
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: 0.97,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 60_000,
    at: AT,
    baseTempo: { bpm: 96, source: 'defaulted' },
    material: file(from),
    ...extra,
  };
}
/** A legacy run of the item (before D4): no material and no header, played when the item's file was the old one. */
function legacyRun(itemId: string): SessionRow {
  const { material: _material, baseTempo: _base, ...rest } = oldRun(itemId, '0'.repeat(64));
  return { ...rest, at: '2026-09-20T12:00:00.000Z' };
}
/** A Keep tempo run recorded after the repair: the repaired file, at its written tempo. */
function newRun(itemId: string, to: string, bpm: number, extra: Partial<SessionRow> = {}): SessionRow {
  return oldRun(itemId, to, { at: '2026-10-01T09:00:00.000Z', baseTempo: { bpm, source: 'written' }, ...extra });
}
const heardRow = (itemId: string, from: string): EncounterRow => ({
  id: `v-before:${itemId}`,
  key: `file:${from}`,
  material: file(from),
  itemId,
  kind: 'heard',
  at: AT,
  source: { tab: 'library' },
  visit: 'v-before',
});
const projectRow = (itemId: string, from: string): ProjectRow => ({
  id: `file:${from}`,
  material: file(from),
  itemId,
  state: 'learning',
  since: AT,
  history: [{ state: 'learning', at: AT, why: 'learn' }],
});

/** A pitch observation the old run stored with it (the accidentals it read right), which no tempo decides. */
function withPitchEvidence(row: SessionRow): SessionRow {
  const evidence = {
    kind: 'measured',
    skill: 'accidentals',
    observationId: 1,
    standard: 'practice',
    n: 7,
    right: 7,
    at: row.at,
    context: { itemId: row.itemId, ...(row.material === undefined ? {} : { material: row.material }) },
    byDemand: [],
    met: [],
    unattributed: 0,
    estimated: false,
  } as unknown as MeasuredEvidence;
  return { ...row, id: 1, evidence: [evidence], evidenceDefinitions: EVIDENCE_DEFINITIONS };
}

/** A tempo-dependent standard: a song at full tempo. */
const FULL_TEMPO = { minAccuracy: 0.9, minTempoPct: 100 };
/** A standard that asks no tempo: the rung states none, and the learner's pass pair asks none (`LearnerRecord.defaults`). */
const NO_TEMPO = { minAccuracy: 0.9, minTempoPct: 0 };
const NO_TEMPO_LEARNER: LearnerRecord = { defaults: { passAccuracy: 0.9, passTempoPct: 0 } };

function rung(songOptions: string[], mastery = FULL_TEMPO, requirements: Requirement[] = [{ kind: 'runs', from: 'songs', count: 1 }]): Lesson {
  return {
    id: RUNG,
    title: 'The rung holding the seven',
    concepts: [],
    textFile: `lessons/${RUNG}.md`,
    exerciseOptions: [],
    songOptions,
    mastery,
    requirements,
  };
}
const curriculum = (songOptions: string[], mastery = FULL_TEMPO, requirements?: Requirement[]): Curriculum => ({
  version: 1,
  tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
  stages: [{ number: 1, title: 'Stage 1', summary: '', units: [{ id: 'e50', title: 'U', track: 'core', lessons: [rung(songOptions, mastery, requirements)] }] }],
});
const TODAY = new Date('2026-10-01T10:00:00Z');
const FULL = { passAccuracy: 0.9, passTempoPct: 100, masterAccuracy: 0.97, masterTempoPct: 100 };

// ---------------------------------------------------------------------------------------------------

/** Each repaired row: the seven parents and, since E50b, the Wabash cut. */
interface Repaired { id: string; type: 'song' | 'excerpt'; from: string; to: string; tempoBpm: number }

let repairs: Repair[];
let cuts: CutRelation[];
let rows: Map<string, PdmxRow>;
let repaired: Repaired[];
/** The rows as the build writes them since E50b: continuity and the tempo lineage. */
let asBuilt: CatalogItem[];
/** E50's catalogue: the continuity relation alone, no tempo lineage. */
let continuityOnly: CatalogItem[];
let withoutRelation: CatalogItem[];

const catalogOf = (lineage: (one: Repaired) => Lineage): CatalogItem[] => repaired.map((one) => built(one.id, one.type, one.to, one.tempoBpm, lineage(one)));

beforeEach(async () => {
  const data = committed();
  repairs = data.repairs;
  cuts = data.cuts;
  rows = data.rows;
  repaired = [
    ...SEVEN.flatMap((id) => repairs.filter((one) => one.id === id).map((one): Repaired => ({ id, type: 'song', from: one.from, to: one.to, tempoBpm: rows.get(id)!.tempoBpm }))),
    ...cuts.filter((one) => one.id === CUT).map((one): Repaired => ({ id: one.id, type: 'excerpt', from: one.from, to: one.to, tempoBpm: rows.get(one.of)!.tempoBpm })),
  ];
  asBuilt = catalogOf((one) => ({ formerIdentities: [one.from], tempoRepairedFrom: [one.from] }));
  continuityOnly = catalogOf((one) => ({ formerIdentities: [one.from] }));
  withoutRelation = catalogOf(() => ({}));
  await loadThe(asBuilt);
});
afterEach(() => {
  vi.unstubAllGlobals();
  resetContentCacheForTest();
});

describe('the relation: each of the seven repaired files names its old identity, one the historical table proved', () => {
  it('one relation per row, from the old file the table recorded to the file pdmx.json now names', () => {
    const { historical } = committed();
    const e50 = repairs.filter((one) => one.change.startsWith('E50 '));
    expect(e50.map((one) => one.id).sort()).toEqual([...SEVEN].sort());
    for (const one of e50) {
      const row = rows.get(one.id)!;
      expect(one.file).toBe(`scores/pdmx/${row.cid}.mxl`);
      expect(one.to).toBe(row.convertedSha256);
      expect(row.tempoDefaulted).toBe(false);
      // No alias names a dated file that never existed: the old identity is E50a's entry for that file.
      expect(historical.filter((entry) => entry.file === one.file && entry.sha256 === one.from && entry.date === one.date && entry.system === one.system)).toHaveLength(1);
      expect(one.from).not.toBe(one.to);
      // D2's identity stays exact bytes: the old file is not the repaired one.
      expect(sameIdentity(file(one.from), file(one.to))).toBe(false);
    }
  });

  it('E57: every other relation is E57’s, from an old file the table recorded (or its undated form) to the file the row now names', () => {
    // E57 (Entry 183) keeps a later tempo mark the converter used to remove, moving the identities of committed PDMX
    // files (one relation each, as E50's) and of files the build converts (two each: the dated file E50a recorded and
    // its undated form, the identity every catalogue since E50a served). None of them is one of E50's seven.
    // Revised by E59 (Entry 184): E59's relations are a third class, read in their own case below.
    const { historical } = committed();
    const e57 = repairs.filter((one) => !one.change.startsWith('E50 ') && !one.change.startsWith('E59 '));
    expect(e57.length).toBeGreaterThan(0);
    for (const one of e57) {
      expect(one.change.startsWith('E57 '), one.id).toBe(true);
      expect(SEVEN).not.toContain(one.id);
      expect(one.from).not.toBe(one.to);
      expect(sameIdentity(file(one.from), file(one.to))).toBe(false);
      if (one.undated === true) {
        expect(historical.filter((entry) => entry.file === one.file && entry.undated === one.from).length, one.id).toBeGreaterThan(0);
      } else {
        expect(historical.filter((entry) => entry.file === one.file && entry.sha256 === one.from && entry.date === one.date && entry.system === one.system), one.id).toHaveLength(1);
      }
      const row = rows.get(one.id);
      if (row) expect(one.to).toBe(row.convertedSha256);
      else expect(e57.filter((other) => other.id === one.id).map((other) => other.undated === true).sort()).toEqual([false, true]);
    }
  });

  it('E50b: the Wabash cut carries one relation too, the one derived repair the build produced, and every E50 and E57 relation says the tempo changed', () => {
    // Revised by E59 (Entry 184): scoped to E50's, E50b's and E57's relations; E59's say the tempo did not change.
    const wabash = cuts.filter((one) => one.id === CUT);
    expect(wabash).toHaveLength(1);
    const [cut] = wabash;
    const parent = repairs.find((one) => one.id === 'song.blues.wabash-blues')!;
    expect([cut!.of, cut!.parentFrom, cut!.parentTo]).toEqual([parent.id, parent.from, parent.to]);
    expect(cut!.from).not.toBe(cut!.to);
    expect(sameIdentity(file(cut!.from), file(cut!.to))).toBe(false);
    const tempoRepairs = [...repairs.filter((one) => !one.change.startsWith('E59 ')), ...wabash];
    expect(tempoRepairs.map((one) => one.tempoChanged)).toEqual(tempoRepairs.map(() => true));
    expect(repaired).toHaveLength(8);
  });

  it('E59: every other relation is E59’s, a defaulted tempo written as its sound alone, from an old file the table recorded, and none says the tempo changed', () => {
    // E59 (Entry 184): the converter's default 96 was written as a printed quarter = 96 beside its sound; it is now the
    // sound alone. The moved identities: every committed PDMX row tagged `tempoDefaulted` (one relation each), the kern
    // and MuseTrainer files the build converts (two each: the dated file E50a recorded and its undated form) and the
    // approved cuts of the moved PDMX parents. The old file played the tempo the new one plays, so no relation is
    // tempo-changed and no run of an old file is refused a tempo standard for it.
    const { historical } = committed();
    const e59 = repairs.filter((one) => one.change.startsWith('E59 '));
    expect(e59.length).toBeGreaterThan(0);
    for (const one of e59) {
      expect(one.tempoChanged, one.id).toBe(false);
      expect(SEVEN).not.toContain(one.id);
      expect(sameIdentity(file(one.from), file(one.to))).toBe(false);
      if (one.undated === true) {
        expect(historical.filter((entry) => entry.file === one.file && entry.undated === one.from).length, one.id).toBeGreaterThan(0);
      } else {
        expect(historical.filter((entry) => entry.file === one.file && entry.sha256 === one.from && entry.date === one.date && entry.system === one.system), one.id).toHaveLength(1);
      }
      const row = rows.get(one.id);
      if (row) {
        expect(one.to).toBe(row.convertedSha256);
        expect(row.tempoDefaulted, one.id).toBe(true);
      } else {
        expect(e59.filter((other) => other.id === one.id).map((other) => other.undated === true).sort()).toEqual([false, true]);
      }
    }
    expect(e59.filter((one) => rows.has(one.id)).map((one) => one.id).sort())
      .toEqual([...rows.values()].filter((row) => row.tempoDefaulted).map((row) => row.id).sort());
    const e59Cuts = cuts.filter((one) => one.id !== CUT);
    expect(e59Cuts.length).toBeGreaterThan(0);
    for (const cut of e59Cuts) {
      const parent = e59.find((one) => one.id === cut.of)!;
      expect([cut.parentFrom, cut.parentTo, cut.tempoChanged]).toEqual([parent.from, parent.to, false]);
      expect(sameIdentity(file(cut.from), file(cut.to))).toBe(false);
    }
  });

  it('E59: a run of a moved defaulted file is the same piece and keeps its tempo: its 100 % of the defaulted 96 still meets the full-tempo standard', async () => {
    // The learner-facing consequence of `tempoChanged: false`, read through the app as the build writes the rows from the
    // committed relations (`build.attach_provenance`: every old identity among the former identities, and among
    // `tempoRepairedFrom` only a relation marked `tempoChanged`): contact and the tempo standard both read the old run
    // exactly as they read a run of the new file. Marked tempo-changed, every such run would be refused (the E50b
    // guard), though the tempo it was played against is the one the piece plays now.
    const e59 = [...repairs.filter((one) => one.change.startsWith('E59 ')), ...cuts.filter((one) => one.id !== CUT)];
    const ids = [...new Set(e59.map((one) => one.id))];
    const catalog = ids.map((id) => {
      const mine = e59.filter((one) => one.id === id);
      return built(id, id.startsWith('excerpt.') ? 'excerpt' : 'song', mine[0]!.to, 96, {
        formerIdentities: mine.map((one) => one.from),
        tempoRepairedFrom: mine.filter((one) => one.tempoChanged === true).map((one) => one.from),
      });
    });
    await loadThe(catalog);
    for (const one of e59) {
      const run = oldRun(one.id, one.from);
      expect(sameMaterial(file(one.from), file(one.to)), one.id).toBe(true);
      expect(tempoNotComparable(run), one.id).toBe(false);
      expect(meetsStandard(run, FULL), one.id).toBe(true);
      expect(contactIn([oldRun(RENAMED, one.from)], one.id, file(one.to)).contact, one.id).toBe('met');
    }
  });
});

describe('continuity: the old identity is the repaired piece for contact, familiarity and projects', () => {
  it('a run of the old file is met, played, under the piece’s id and under another id', () => {
    for (const one of repaired) {
      const current = file(one.to);
      expect(sameMaterial(file(one.from), current), one.id).toBe(true);
      expect(contactIn([oldRun(one.id, one.from)], one.id, current)).toEqual({ contact: 'met', metById: true, metAs: [one.id], how: ['played'] });
      expect(contactIn([oldRun(RENAMED, one.from)], one.id, current)).toEqual({ contact: 'met', metById: false, metAs: [RENAMED], how: ['played'] });
      expect(learnerMaterialKeys(current, one.id)).toEqual([`file:${one.to}`, `file:${one.from}`]);
    }
  });

  it('a hearing of the old file is familiarity with the repaired piece', () => {
    const byId = new Map(asBuilt.map((one) => [one.id, one]));
    for (const one of repaired) {
      const history: EncounterHistory = { encounters: [heardRow(RENAMED, one.from)], runs: [], contacts: [], byId };
      expect(familiarityIn({ itemId: one.id, material: file(one.to) }, history).heard, one.id).toBe(AT);
    }
  });

  it('a project kept against the old file is the repaired piece’s project', () => {
    for (const one of repaired) {
      const kept = projectRow(RENAMED, one.from);
      expect(projectIn([kept], { itemId: one.id, material: file(one.to) }), one.id).toBe(kept);
    }
  });

  it('without the relation the old file is other material: the same run is unmet under another id', async () => {
    await loadThe(withoutRelation);
    for (const one of repaired) {
      expect(contactIn([oldRun(RENAMED, one.from)], one.id, file(one.to)).contact, one.id).toBe('unmet');
    }
  });
});

describe('the boundary: the old run stays a run at its recorded tempo, and no tempo-dependent standard reads it against the repaired tempo', () => {
  it('a rung counts a run by the item id it was played under: the relation adds no old run to its pool', () => {
    for (const one of repaired) {
      const stored = [oldRun(RENAMED, one.from)];
      const reading = rungState(stored, curriculum([one.id]), VOCABULARY_V0, TODAY).byRung.get(RUNG)!;
      const runs = reading.requirements[0]!;
      // Met by contact through the relation, never counted toward the rung's full-tempo requirement.
      expect(contactIn(stored, one.id, file(one.to)).contact, one.id).toBe('met');
      expect(runs.have, one.id).toBe(0);
      expect(runs.items, one.id).toEqual([]);
      expect(reading.status, one.id).not.toBe('met');
    }
  });

  it('E50b: a run of the old file at 100 % of the defaulted 96 meets no tempo standard of the piece whose written tempo is 120', () => {
    const wabash = repaired.find((one) => one.id === 'song.blues.wabash-blues')!;
    expect(wabash.tempoBpm).toBe(120);
    const run = oldRun(wabash.id, wabash.from);
    expect(meetsStandard(run, FULL)).toBe(false);
    const reading = rungState([run], curriculum([wabash.id]), VOCABULARY_V0, TODAY).byRung.get(RUNG)!;
    expect(reading.requirements[0]).toMatchObject({ holds: false, have: 0, items: [] });
    expect(reading.status).not.toBe('met');
    // Still the learner's contact with the piece, played.
    expect(contactIn([run], wabash.id, file(wabash.to))).toEqual({ contact: 'met', metById: true, metAs: [wabash.id], how: ['played'] });
  });

  it('E50b: for every repaired row, the old run under its own id is refused by the tempo standard and kept by contact', () => {
    for (const one of repaired) {
      const run = oldRun(one.id, one.from);
      expect(meetsStandard(run, FULL), one.id).toBe(false);
      // Refused whatever tempo the standard asks: the old percentage has another denominator, never rescaled.
      expect(meetsStandard(oldRun(one.id, one.from, { tempoPct: 130 }), { ...FULL, passTempoPct: 50 }), one.id).toBe(false);
      expect(rungState([run], curriculum([one.id]), VOCABULARY_V0, TODAY).byRung.get(RUNG)!.requirements[0]!.have, one.id).toBe(0);
      expect(contactIn([run], one.id, file(one.to)).contact, one.id).toBe('met');
    }
  });

  it('E50b: the same old run still satisfies a requirement that asks no tempo: the runs of a rung that states none, and its pitch observation', () => {
    for (const one of repaired) {
      const run = withPitchEvidence(oldRun(one.id, one.from));
      // A rung whose standard asks no tempo counts it, as it counts a Wait run: only the tempo channel is refused.
      const noTempo = rungState([run], curriculum([one.id], NO_TEMPO), VOCABULARY_V0, TODAY, NO_TEMPO_LEARNER).byRung.get(RUNG)!;
      expect(noTempo.requirements[0], one.id).toMatchObject({ holds: true, have: 1, items: [one.id] });
      expect(noTempo.status, one.id).toBe('met');
      // Its stored pitch evidence, which no tempo decides, still reaches a skill requirement.
      const skill = rungState([run], curriculum([one.id], FULL_TEMPO, [{ kind: 'skill', skill: 'accidentals', state: 'familiar' }]), VOCABULARY_V0, TODAY).byRung.get(RUNG)!;
      expect(skill.requirements[0], one.id).toMatchObject({ holds: true });
    }
  });

  it('E50b: a legacy run of a repaired row (before D4: no material, no header) predates the repair, and its tempo is refused too', () => {
    for (const one of repaired) {
      const run = legacyRun(one.id);
      expect(meetsStandard(run, FULL), one.id).toBe(false);
      expect(rungState([run], curriculum([one.id], NO_TEMPO), VOCABULARY_V0, TODAY, NO_TEMPO_LEARNER).byRung.get(RUNG)!.requirements[0]!.have, one.id).toBe(1);
      expect(contactIn([run], one.id, file(one.to)).contact, one.id).toBe('met-by-id');
    }
  });

  it('E50b: a run of a repaired row that recorded no base tempo is refused too: what its percentage is of is never guessed', () => {
    for (const one of repaired) {
      const { baseTempo: _base, ...unrecorded } = newRun(one.id, one.to, one.tempoBpm);
      expect(meetsStandard(unrecorded, FULL), one.id).toBe(false);
      expect(meetsStandard({ ...unrecorded, baseTempo: 'not measured' }, FULL), one.id).toBe(false);
      expect(meetsStandard({ ...unrecorded, baseTempo: { bpm: 96, source: 'defaulted' } }, FULL), one.id).toBe(false);
      expect(rungState([unrecorded], curriculum([one.id], NO_TEMPO), VOCABULARY_V0, TODAY, NO_TEMPO_LEARNER).byRung.get(RUNG)!.requirements[0]!.have, one.id).toBe(1);
    }
  });

  it('E50b guard: a run recorded after the repair, on the repaired file at its written tempo, is read as before', () => {
    for (const one of repaired) {
      const run = newRun(one.id, one.to, one.tempoBpm);
      expect(meetsStandard(run, FULL), one.id).toBe(true);
      expect(meetsStandard(newRun(one.id, one.to, one.tempoBpm, { tempoPct: 80 }), FULL), one.id).toBe(false);
      const reading = rungState([oldRun(one.id, one.from), run], curriculum([one.id]), VOCABULARY_V0, TODAY).byRung.get(RUNG)!;
      expect(reading.requirements[0], one.id).toMatchObject({ holds: true, have: 1, items: [one.id] });
      expect(reading.status, one.id).toBe('met');
    }
  });

  it('E50b guard: only the repair class — a defaulted run of an item no repair touched, and its legacy run, are read as before', async () => {
    const other = 'song.not-repaired';
    const current = 'a'.repeat(64);
    await loadThe([...asBuilt, built(other, 'song', current, 96, {})]);
    expect(meetsStandard(oldRun(other, current), FULL)).toBe(true);
    expect(meetsStandard(legacyRun(other), FULL)).toBe(true);
    expect(rungState([oldRun(other, current)], curriculum([other]), VOCABULARY_V0, TODAY).byRung.get(RUNG)!.requirements[0]!.have).toBe(1);
  });

  it('E50b: the tempo lineage, not the continuity relation, is what refuses the old tempo: E50’s catalogue and none read the old percentage as before', async () => {
    const stored = repaired.flatMap((one) => [oldRun(one.id, one.from), oldRun(RENAMED, one.from)]);
    const asBuiltReading = rungState(stored, curriculum(repaired.map((one) => one.id)), VOCABULARY_V0, TODAY).byRung.get(RUNG)!;
    // As built: no old run meets the full-tempo standard, so the rung reads as if the learner had none of them.
    expect(asBuiltReading.requirements[0]).toMatchObject({ holds: false, have: 0 });
    expect(asBuiltReading.requirements).toEqual(rungState([], curriculum(repaired.map((one) => one.id)), VOCABULARY_V0, TODAY).byRung.get(RUNG)!.requirements);
    for (const catalog of [continuityOnly, withoutRelation]) {
      await loadThe(catalog);
      const reading = rungState(stored, curriculum(repaired.map((one) => one.id)), VOCABULARY_V0, TODAY).byRung.get(RUNG)!;
      expect(reading.requirements[0]).toMatchObject({ holds: true, have: repaired.length });
    }
  });

  it('the old run is never rewritten: after every read it is the row it was, at the defaulted 96', () => {
    for (const one of repaired) {
      const row = withPitchEvidence(oldRun(one.id, one.from));
      const before = structuredClone(row);
      contactIn([row], one.id, file(one.to));
      meetsStandard(row, FULL);
      rungState([row], curriculum([one.id]), VOCABULARY_V0, TODAY);
      rungState([row], curriculum([one.id], NO_TEMPO), VOCABULARY_V0, TODAY, NO_TEMPO_LEARNER);
      familiarityIn({ itemId: one.id, material: file(one.to) }, { encounters: [], runs: [row], contacts: [] });
      expect(row).toEqual(before);
      expect(row.baseTempo).toEqual({ bpm: 96, source: 'defaulted' });
      expect(row.material).toEqual(file(one.from));
      expect(row.tempoPct).toBe(100);
    }
  });
});
