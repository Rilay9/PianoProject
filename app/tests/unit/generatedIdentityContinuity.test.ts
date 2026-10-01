/**
 * A family-wide generator version bump keeps an unchanged sibling's learner history, and only that (CL15,
 * What to build item 9; the reviewer's required change, `docs/review/responses/questions-122a5224.md` §CL15).
 *
 * A generator family's version belongs to the whole family (`family_contracts.identity`), so CL15's note
 * changes moved every item of five families to a new identity, the items whose notes did not change among
 * them. The build writes each unchanged item's old identity on its row (`provenance.formerGeneratorIdentities`,
 * only where the item's music digest at the version the family left equals its digest now:
 * `family_contracts.former_generator_identities`, re-proved by `tools/content/tests/test_family_contracts.py`),
 * and `material.ts` resolves a learner row stored against it to the row's current material. The reviewer's
 * five guards, on the built catalogue (`app/public/content/catalog.json`, as the other catalogue cases here):
 *
 * 1. an unchanged octave tremolo's `tremolo_octaves` v1 identity resolves to its v2 row for learner continuity;
 * 2. an unchanged blues-form pentatonic's `pentatonic` v1 identity does the same;
 * 3. a changed third-shape tremolo's or pentatonic-form item's v1 identity does not resolve as its v2 material;
 * 4. the current review identity is the new exact identity, and the relation is never read by `sameIdentity`;
 * 5. the family a bumped row belongs to is unchanged for transfer's family-scoped reads.
 *
 * Then the reader's own rules on a hand-built catalogue: a generator identity that is some row's current
 * identity is never read back as a former one, and the learner's key agrees with `sameMaterial`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { SessionRow } from '../../src/data/db';
import { contact, contactIn, recordRun, resetProgressForTest, type RunResult } from '../../src/data/progressStore';
import { learnFormerIdentities, learnerMaterialKey, learnerMaterialKeys, materialKey, sameMaterial } from '../../src/curriculum/material';
import { relationshipOf, type Established } from '../../src/curriculum/transfer';
import { generatorIdentity, sameIdentity, type Identity } from '../../src/review/record';
import type { CatalogItem } from '../../src/curriculum/types';

type Generator = Extract<Identity, { kind: 'generator' }>;

const catalog = JSON.parse(readFileSync(resolve('public/content/catalog.json'), 'utf8')) as CatalogItem[];
const byId = new Map(catalog.map((item) => [item.id, item]));
const generated = (prefix: string, suffix = ''): CatalogItem[] =>
  catalog.filter((item) => item.id.startsWith(prefix) && item.id.endsWith(suffix));

const OCTAVES = generated('exercise.tremolo.');
const THIRDS = generated('exercise.tremolo-third.');
const BLUES = generated('exercise.pentatonic.', '.blues');
const PENTATONIC = generated('exercise.pentatonic.', '.pentatonic');

function identityOf(item: CatalogItem): Generator {
  const identity = item.provenance?.identity;
  if (identity?.kind !== 'generator') throw new Error(`${item.id} has no generator identity`);
  return identity;
}
/** The identity the catalogue held for this row at the version its family left (CL15 moved each family one version). */
const atVersion = (item: CatalogItem, version: number): Generator => ({ ...identityOf(item), version });

const AT = '2026-09-29T12:00:00.000Z';
/** A run stored against `material`, as `recordRun` wrote it on a device that had the old catalogue. */
const run = (itemId: string, material: Identity): SessionRow => ({
  itemId,
  mode: 'tempo',
  tempoPct: 100,
  accuracy: 0.9,
  accuracyEstimated: false,
  wrongNotes: 1,
  missed: 0,
  durationMs: 60_000,
  at: AT,
  material,
});

beforeEach(() => learnFormerIdentities(catalog));
afterEach(() => learnFormerIdentities([]));

describe('the built catalogue carries the relation for the unchanged siblings and only them', () => {
  it('reads the families the guards name: six octave and six third tremolos, three blues and three pentatonic forms', () => {
    expect([OCTAVES.length, THIRDS.length, BLUES.length, PENTATONIC.length]).toEqual([6, 6, 3, 3]);
  });

  it('guard 1: an unchanged octave tremolo’s v1 identity resolves to its v2 row', () => {
    for (const item of OCTAVES) {
      const current = identityOf(item);
      const old = atVersion(item, 1);
      expect(current.version, item.id).toBe(2);
      expect(item.provenance?.formerGeneratorIdentities, item.id).toEqual([old]);
      expect(sameMaterial(old, current), item.id).toBe(true);
      expect(learnerMaterialKey(old, item.id)).toBe(learnerMaterialKey(current, item.id));
      expect(learnerMaterialKeys(current, item.id)).toEqual([materialKey(current, item.id), materialKey(old, item.id)]);
      expect(contactIn([run(item.id, old)], item.id, current)).toEqual({ contact: 'met', metById: true, metAs: [item.id], how: ['played'] });
    }
  });

  it('guard 2: an unchanged blues-form pentatonic’s v1 identity resolves to its v2 row', () => {
    for (const item of BLUES) {
      const current = identityOf(item);
      const old = atVersion(item, 1);
      expect(current.version, item.id).toBe(2);
      expect(item.provenance?.formerGeneratorIdentities, item.id).toEqual([old]);
      expect(sameMaterial(old, current), item.id).toBe(true);
      expect(learnerMaterialKey(old, item.id)).toBe(learnerMaterialKey(current, item.id));
      expect(contactIn([run(item.id, old)], item.id, current).contact).toBe('met');
    }
  });

  it('guard 3: a changed third tremolo’s or pentatonic-form item’s v1 identity does not resolve as its v2 material', () => {
    for (const item of [...THIRDS, ...PENTATONIC]) {
      const current = identityOf(item);
      const old = atVersion(item, 1);
      expect(current.version, item.id).toBe(2);
      expect(item.provenance?.formerGeneratorIdentities, item.id).toBeUndefined();
      expect(sameMaterial(old, current), item.id).toBe(false);
      expect(learnerMaterialKey(old, item.id)).not.toBe(learnerMaterialKey(current, item.id));
      expect(learnerMaterialKeys(current, item.id)).toEqual([materialKey(current, item.id)]);
      // A run of the old notes is history under the item's id, never contact with this material.
      expect(contactIn([run(item.id, old)], item.id, current)).toEqual({ contact: 'unmet', metById: true });
    }
  });

  it('guard 4: the current review identity is the new exact identity; sameIdentity never reads the relation', () => {
    for (const item of [...OCTAVES, ...THIRDS, ...BLUES, ...PENTATONIC]) {
      const current = identityOf(item);
      expect(generatorIdentity(item), item.id).toEqual(current);
      expect(sameIdentity(generatorIdentity(item) ?? undefined, atVersion(item, 1)), item.id).toBe(false);
      for (const former of item.provenance?.formerGeneratorIdentities ?? []) {
        expect(sameIdentity(former, current), item.id).toBe(false);
      }
    }
  });

  it('guard 5: a bumped row’s family is the family it had, in transfer’s family dimension', () => {
    for (const item of [...OCTAVES, ...THIRDS, ...BLUES, ...PENTATONIC]) {
      const current = identityOf(item);
      const old = atVersion(item, 1);
      const family = item.id.startsWith('exercise.tremolo') ? 'tremolo_octaves' : 'pentatonic';
      expect(current.family, item.id).toBe(family);
      // The skill was shown on the old identity of this very item; the candidate is its row now.
      const shown: Established[] = [{ reference: { itemId: item.id, material: old }, row: run(item.id, old) }];
      const fact = relationshipOf('position-shift', item, [], byId, shown).measured.find((one) => one.dimension === 'family');
      expect(fact, item.id).toEqual({ dimension: 'family', candidate: family, shownOn: [family], differs: false });
    }
  });

  it('every former generator identity on the catalogue is its row’s identity at an earlier version, never a current one', () => {
    const current = new Set(catalog.flatMap((item) => (item.provenance?.identity?.kind === 'generator' ? [materialKey(item.provenance.identity, item.id)] : [])));
    let rows = 0;
    for (const item of catalog) {
      const formers = item.provenance?.formerGeneratorIdentities;
      if (formers === undefined) continue;
      rows += 1;
      const own = identityOf(item);
      for (const former of formers) {
        expect({ ...former, version: own.version }, item.id).toEqual(own);
        expect(former.version, item.id).toBeLessThan(own.version);
        expect(current.has(materialKey(former, item.id)), item.id).toBe(false);
      }
    }
    // The octave tremolos, the blues forms and the sixteenth syncopation at least (the generator decides the rest by digest).
    expect(rows).toBeGreaterThanOrEqual(OCTAVES.length + BLUES.length + 1);
    expect(byId.get('exercise.syncopation.sixteenth')?.provenance?.formerGeneratorIdentities).toHaveLength(1);
    expect(byId.get('exercise.syncopation.tied-across-bar')?.provenance?.formerGeneratorIdentities).toBeUndefined();
  });
});

describe('the reader’s rules, on a hand-built catalogue', () => {
  const generator = (version: number, seed: number | null = null, recipe: Record<string, unknown> = { key: 'C', shape: 'octave', hands: 'right' }): Generator => ({
    kind: 'generator',
    family: 'tremolo_octaves',
    version,
    seed,
    recipe,
    tempoBpm: 60,
  });
  const row = (id: string, identity: Generator, formers?: Generator[]): CatalogItem =>
    ({
      id,
      type: 'exercise',
      title: id,
      level: 5,
      hands: 'right',
      tracks: ['technique'],
      concepts: [],
      tags: [],
      file: `scores/generated/${id}.mxl`,
      provenance: { source: 'generated', facts: {}, review: { score: null, teaching: null }, identity, ...(formers === undefined ? {} : { formerGeneratorIdentities: formers }) },
    }) as unknown as CatalogItem;

  const V1 = generator(1);
  const V2 = generator(2);
  const OTHER_ROW_CURRENT = generator(2, null, { key: 'G', shape: 'octave', hands: 'right' });

  it('a generator identity that is another row’s current identity is never read back as a former one', () => {
    learnFormerIdentities([row('a', V2, [V1, OTHER_ROW_CURRENT]), row('b', OTHER_ROW_CURRENT)]);
    expect(sameMaterial(V1, V2)).toBe(true);
    expect(sameMaterial(OTHER_ROW_CURRENT, V2)).toBe(false);
    expect(learnerMaterialKeys(V2, 'a')).toEqual([materialKey(V2, 'a'), materialKey(V1, 'a')]);
  });

  it('the learner’s key agrees with sameMaterial, and the table is the loaded catalogue’s alone', () => {
    learnFormerIdentities([row('a', V2, [V1])]);
    const all: Generator[] = [V1, V2, OTHER_ROW_CURRENT, generator(3)];
    for (const a of all) {
      for (const b of all) expect(learnerMaterialKey(a, 'x') === learnerMaterialKey(b, 'y'), `${a.version}/${b.version}`).toBe(sameMaterial(a, b));
    }
    learnFormerIdentities([row('a', V2)]);
    expect(sameMaterial(V1, V2)).toBe(false);
  });

  describe('over the store', () => {
    beforeEach(() => {
      useFakeIndexedDb();
      resetProgressForTest();
    });
    afterEach(() => clearFakeIndexedDb());

    it('a run recorded against the v1 identity is contact with the v2 row, looked up by its former key', async () => {
      learnFormerIdentities([row('exercise.tremolo.c.right', V2, [V1])]);
      const result: RunResult = {
        itemId: 'exercise.tremolo.c.right',
        mode: 'tempo',
        tempoPct: 100,
        accuracy: 1,
        accuracyEstimated: false,
        wrongNotes: 0,
        missed: 0,
        durationMs: 1000,
        passed: true,
        masterEligible: false,
        material: V1,
      };
      await recordRun(result, new Date(2026, 8, 29, 12));
      expect(await contact('exercise.tremolo.c.right', V2)).toEqual({ contact: 'met', metById: true, metAs: ['exercise.tremolo.c.right'], how: ['played'] });
    });
  });
});
