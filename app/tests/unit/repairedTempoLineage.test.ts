/**
 * The seven bundled PDMX scores that print their tempo as text (E50, Entry 163; the brief
 * `docs/prompts/tasks/E50-seven-rows-print-their-tempo.md` and the reviewer's conditional approval in it,
 * `docs/review/responses/questions-bd7d303e.md` §4): each is re-converted so its printed "= N" is its
 * `<metronome>`, and its file's bytes, and so its material identity, move. A learner who opened or played
 * the old file has still met the piece: the old identity is related to the repaired file through E50a's
 * learner-material relation (`provenance.formerIdentities`, here fed from `tools/content/repaired_identities.json`
 * exactly as the build feeds it), for contact, familiarity and project continuity.
 *
 * The boundary, the reviewer's words: the old run stays a run at its recorded tempo and context — never
 * rewritten, re-scored or claimed at the corrected tempo — and the relation must not let old performance
 * evidence satisfy a tempo-dependent standard. The standard a run meets (`meetsStandard`: a Keep tempo run
 * at `passTempoPct` of the run's own base tempo) and the rung that counts it read the run's own stored
 * numbers under its item id; the relation is read by none of them. These cases pin that: every rung reading
 * and every standard is the same with the relation loaded as without it, and a run of the old file under
 * another item id is met by contact and counted by no rung.
 *
 * The continuity cases are red where the relation does not exist (before E50, the committed file is absent);
 * the standard's cases are guards, green by design wherever the relation exists, and a mutant that routes a
 * rung's pool through the relation is what they catch (`docs/prompts/runs/E50/`).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EncounterRow, ProjectRow, SessionRow } from '../../src/data/db';
import { contactIn } from '../../src/data/progressStore';
import { familiarityIn, type EncounterHistory } from '../../src/data/encounterStore';
import { projectIn } from '../../src/data/projectStore';
import { learnerMaterialKeys, sameMaterial } from '../../src/curriculum/material';
import { loadCatalog, resetContentCacheForTest } from '../../src/curriculum/load';
import { meetsStandard, rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { sameIdentity, type Identity } from '../../src/review/record';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';

// --- the committed relation, the rows and the historical table ------------------------------------

const REPO = join(process.cwd(), '..');
const readJson = <T>(...parts: string[]): T => JSON.parse(readFileSync(join(REPO, ...parts), 'utf8')) as T;

interface Repair { id: string; file: string; from: string; date: string; system: number; to: string }
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

function committed(): { repairs: Repair[]; rows: Map<string, PdmxRow>; historical: { file: string; date: string; system: number; sha256: string }[] } {
  const repairs = readJson<{ repairs: Repair[] }>('tools', 'content', 'repaired_identities.json').repairs;
  const rows = new Map(readJson<{ items: PdmxRow[] }>('content', 'sources', 'pdmx.json').items.map((row) => [row.id, row]));
  const historical = readJson<{ identities: { file: string; date: string; system: number; sha256: string }[] }>('tools', 'content', 'former_identities.json').identities;
  return { repairs, rows, historical };
}

const file = (sha256: string): Extract<Identity, { kind: 'file' }> => ({ kind: 'file', sha256 });

/** A repaired row as the build writes it: its identity the repaired file, the old one among its former identities. */
function built(row: PdmxRow, formerIdentities: string[] | undefined): CatalogItem {
  return {
    id: row.id,
    type: 'song',
    title: row.id,
    level: row.level,
    tracks: ['core'],
    concepts: [],
    tags: [],
    tempoBpm: row.tempoBpm,
    file: `scores/pdmx/${row.cid}.mxl`,
    provenance: {
      source: 'pdmx',
      facts: {},
      review: { score: null, teaching: null },
      identity: file(row.convertedSha256),
      ...(formerIdentities === undefined ? {} : { formerIdentities: formerIdentities.map(file) }),
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

function rung(songOptions: string[]): Lesson {
  return {
    id: RUNG,
    title: 'The rung holding the seven',
    concepts: [],
    textFile: `lessons/${RUNG}.md`,
    exerciseOptions: [],
    songOptions,
    // A tempo-dependent standard: a song at full tempo.
    mastery: { minAccuracy: 0.9, minTempoPct: 100 },
    requirements: [{ kind: 'runs', from: 'songs', count: 1 }],
  };
}
const curriculum = (songOptions: string[]): Curriculum => ({
  version: 1,
  tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
  stages: [{ number: 1, title: 'Stage 1', summary: '', units: [{ id: 'e50', title: 'U', track: 'core', lessons: [rung(songOptions)] }] }],
});
const TODAY = new Date('2026-10-01T10:00:00Z');

// ---------------------------------------------------------------------------------------------------

let repairs: Repair[];
let rows: Map<string, PdmxRow>;
let withRelation: CatalogItem[];
let withoutRelation: CatalogItem[];

beforeEach(async () => {
  const data = committed();
  repairs = data.repairs;
  rows = data.rows;
  withRelation = SEVEN.map((id) => built(rows.get(id)!, repairs.filter((one) => one.id === id).map((one) => one.from)));
  withoutRelation = SEVEN.map((id) => built(rows.get(id)!, undefined));
  await loadThe(withRelation);
});
afterEach(() => {
  vi.unstubAllGlobals();
  resetContentCacheForTest();
});

describe('the relation: each of the seven repaired files names its old identity, one the historical table proved', () => {
  it('one relation per row, from the old file the table recorded to the file pdmx.json now names', () => {
    const { historical } = committed();
    expect(repairs.map((one) => one.id).sort()).toEqual([...SEVEN].sort());
    for (const one of repairs) {
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
});

describe('continuity: the old identity is the repaired piece for contact, familiarity and projects', () => {
  it('a run of the old file is met, played, under the piece’s id and under another id', () => {
    for (const one of repairs) {
      const repaired = file(one.to);
      expect(sameMaterial(file(one.from), repaired), one.id).toBe(true);
      expect(contactIn([oldRun(one.id, one.from)], one.id, repaired)).toEqual({ contact: 'met', metById: true, metAs: [one.id], how: ['played'] });
      expect(contactIn([oldRun(RENAMED, one.from)], one.id, repaired)).toEqual({ contact: 'met', metById: false, metAs: [RENAMED], how: ['played'] });
      expect(learnerMaterialKeys(repaired, one.id)).toEqual([`file:${one.to}`, `file:${one.from}`]);
    }
  });

  it('a hearing of the old file is familiarity with the repaired piece', () => {
    const byId = new Map(withRelation.map((one) => [one.id, one]));
    for (const one of repairs) {
      const history: EncounterHistory = { encounters: [heardRow(RENAMED, one.from)], runs: [], contacts: [], byId };
      expect(familiarityIn({ itemId: one.id, material: file(one.to) }, history).heard, one.id).toBe(AT);
    }
  });

  it('a project kept against the old file is the repaired piece’s project', () => {
    for (const one of repairs) {
      const kept = projectRow(RENAMED, one.from);
      expect(projectIn([kept], { itemId: one.id, material: file(one.to) }), one.id).toBe(kept);
    }
  });

  it('without the relation the old file is other material: the same run is unmet under another id', async () => {
    await loadThe(withoutRelation);
    for (const one of repairs) {
      expect(contactIn([oldRun(RENAMED, one.from)], one.id, file(one.to)).contact, one.id).toBe('unmet');
    }
  });
});

describe('the boundary: the old run stays a run at its recorded tempo, and no tempo-dependent standard reads the relation', () => {
  it('the standard a run meets is read from the run’s own numbers, the same with the relation as without it', async () => {
    const stored = repairs.flatMap((one) => [oldRun(one.id, one.from), oldRun(one.id, one.from, { tempoPct: 60 }), oldRun(RENAMED, one.from)]);
    const criteria = { passAccuracy: 0.9, passTempoPct: 100, masterAccuracy: 0.97, masterTempoPct: 100 };
    const withIt = stored.map((row) => meetsStandard(row, criteria));
    await loadThe(withoutRelation);
    expect(stored.map((row) => meetsStandard(row, criteria))).toEqual(withIt);
    // At 60 % of its own base the run meets no full-tempo standard, relation or not.
    expect(withIt.filter((_, index) => index % 3 === 1)).toEqual(repairs.map(() => false));
  });

  it('a rung counts a run by the item id it was played under: the relation adds no old run to its pool', () => {
    for (const one of repairs) {
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

  it('every rung reading over the old runs is the same with the relation loaded as without it', async () => {
    const stored = repairs.flatMap((one) => [oldRun(one.id, one.from), oldRun(RENAMED, one.from)]);
    const withIt = rungState(stored, curriculum(SEVEN), VOCABULARY_V0, TODAY).byRung.get(RUNG)!;
    await loadThe(withoutRelation);
    const withoutIt = rungState(stored, curriculum(SEVEN), VOCABULARY_V0, TODAY).byRung.get(RUNG)!;
    expect(withIt.requirements).toEqual(withoutIt.requirements);
    expect(withIt.status).toBe(withoutIt.status);
  });

  it('the old run is never rewritten: after every read it is the row it was, at the defaulted 96', () => {
    for (const one of repairs) {
      const row = oldRun(one.id, one.from);
      const before = structuredClone(row);
      contactIn([row], one.id, file(one.to));
      meetsStandard(row, { passAccuracy: 0.9, passTempoPct: 100, masterAccuracy: 0.97, masterTempoPct: 100 });
      rungState([row], curriculum([one.id]), VOCABULARY_V0, TODAY);
      familiarityIn({ itemId: one.id, material: file(one.to) }, { encounters: [], runs: [row], contacts: [] });
      expect(row).toEqual(before);
      expect(row.baseTempo).toEqual({ bpm: 96, source: 'defaulted' });
      expect(row.material).toEqual(file(one.from));
    }
  });
});
