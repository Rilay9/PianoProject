"""G30's edit of app/tests/unit/generatedIdentityContinuity.test.ts: the guards read the catalogue G30 builds.

usage: python docs/prompts/runs/G30/scripts-edit_ts_test.py
Replaces the header's guard list and the built-catalogue describe block; the hand-built reader's rules
are kept as they are. Idempotent: a file already carrying the G30 block is left.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
p = ROOT / "app" / "tests" / "unit" / "generatedIdentityContinuity.test.ts"
raw = p.read_bytes()
crlf = b"\r\n" in raw
s = raw.decode("utf-8").replace("\r\n", "\n")

OLD_HEAD = """ * and `material.ts` resolves a learner row stored against it to the row's current material. The reviewer's
 * five guards, on the built catalogue (`app/public/content/catalog.json`, as the other catalogue cases here):
 *
 * 1. an unchanged octave tremolo's `tremolo_octaves` v1 identity resolves to its v2 row for learner continuity;
 * 2. an unchanged blues-form pentatonic's `pentatonic` v1 identity does the same;
 * 3. a changed third-shape tremolo's or pentatonic-form item's v1 identity does not resolve as its v2 material;
 * 4. the current review identity is the new exact identity, and the relation is never read by `sameIdentity`;
 * 5. the family a bumped row belongs to is unchanged for transfer's family-scoped reads.
 *"""
NEW_HEAD = """ * and `material.ts` resolves a learner row stored against it to the row's current material. The reviewer's
 * five guards, on the built catalogue (`app/public/content/catalog.json`, as the other catalogue cases here):
 *
 * 1. an unchanged octave tremolo's `tremolo_octaves` v1 identity resolves to its current row for learner continuity;
 * 2. an unchanged blues-form pentatonic's `pentatonic` v1 identity does the same;
 * 3. a changed third-shape tremolo's or pentatonic-form item's v1 identity does not resolve as its current material;
 * 4. the current review identity is the new exact identity, and the relation is never read by `sameIdentity`;
 * 5. the family a bumped row belongs to is unchanged for transfer's family-scoped reads.
 *
 * G30 moved both families again (v2 -> v3), with forty more: the bump that took their unsourced printed fingering
 * off the page (`docs/review/responses/questions-90b19bee.md` §1). It changed no item's music, so every item carries
 * its v2 identity, and a second bump carries what the first carried: the siblings CL15 left unchanged list v2 and
 * v1, so a run stored before CL15 still resolves to the row G30 wrote in one lookup. Revised from the CL15 guards
 * (the old assumption: v2 was the current version, and a CL15-changed sibling carried nothing at all).
 *"""

START = "describe('the built catalogue carries the relation for the unchanged siblings and only them', () => {"
END = "describe('the reader’s rules, on a hand-built catalogue', () => {"

NEW_BLOCK = """describe('the built catalogue carries the relation for the unchanged siblings and only them', () => {
  it('reads the families the guards name: six octave and six third tremolos, three blues and three pentatonic forms', () => {
    expect([OCTAVES.length, THIRDS.length, BLUES.length, PENTATONIC.length]).toEqual([6, 6, 3, 3]);
  });

  it('guard 1: an unchanged octave tremolo’s v1 identity resolves to its current row, and so does its v2', () => {
    for (const item of OCTAVES) {
      const current = identityOf(item);
      const [v1, v2] = [atVersion(item, 1), atVersion(item, 2)];
      expect(current.version, item.id).toBe(3);
      expect(item.provenance?.formerGeneratorIdentities, item.id).toEqual([v2, v1]);
      expect(sameMaterial(v1, current), item.id).toBe(true);
      expect(sameMaterial(v2, current), item.id).toBe(true);
      expect(learnerMaterialKey(v1, item.id)).toBe(learnerMaterialKey(current, item.id));
      expect(learnerMaterialKeys(current, item.id)).toEqual([materialKey(current, item.id), materialKey(v2, item.id), materialKey(v1, item.id)]);
      expect(contactIn([run(item.id, v1)], item.id, current)).toEqual({ contact: 'met', metById: true, metAs: [item.id], how: ['played'] });
    }
  });

  it('guard 2: an unchanged blues-form pentatonic’s v1 identity resolves to its current row', () => {
    for (const item of BLUES) {
      const current = identityOf(item);
      const [v1, v2] = [atVersion(item, 1), atVersion(item, 2)];
      expect(current.version, item.id).toBe(3);
      expect(item.provenance?.formerGeneratorIdentities, item.id).toEqual([v2, v1]);
      expect(sameMaterial(v1, current), item.id).toBe(true);
      expect(learnerMaterialKey(v1, item.id)).toBe(learnerMaterialKey(current, item.id));
      expect(contactIn([run(item.id, v1)], item.id, current).contact).toBe('met');
    }
  });

  it('guard 3: a changed third tremolo’s or pentatonic-form item’s v1 identity does not resolve; its v2, which G30 left unchanged, does', () => {
    for (const item of [...THIRDS, ...PENTATONIC]) {
      const current = identityOf(item);
      const [v1, v2] = [atVersion(item, 1), atVersion(item, 2)];
      expect(current.version, item.id).toBe(3);
      expect(item.provenance?.formerGeneratorIdentities, item.id).toEqual([v2]);
      expect(sameMaterial(v1, current), item.id).toBe(false);
      expect(learnerMaterialKey(v1, item.id)).not.toBe(learnerMaterialKey(current, item.id));
      expect(learnerMaterialKeys(current, item.id)).toEqual([materialKey(current, item.id), materialKey(v2, item.id)]);
      // A run of the notes CL15 replaced is history under the item's id, never contact with this material.
      expect(contactIn([run(item.id, v1)], item.id, current)).toEqual({ contact: 'unmet', metById: true });
      // A run of the notes G30 left as they were, fingering withdrawn, is.
      expect(contactIn([run(item.id, v2)], item.id, current).contact).toBe('met');
    }
  });

  it('guard 4: the current review identity is the new exact identity; sameIdentity never reads the relation', () => {
    for (const item of [...OCTAVES, ...THIRDS, ...BLUES, ...PENTATONIC]) {
      const current = identityOf(item);
      expect(generatorIdentity(item), item.id).toEqual(current);
      expect(sameIdentity(generatorIdentity(item) ?? undefined, atVersion(item, 1)), item.id).toBe(false);
      expect(sameIdentity(generatorIdentity(item) ?? undefined, atVersion(item, 2)), item.id).toBe(false);
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

describe('G30: withdrawing an unsourced printed fingering keeps the learner’s history', () => {
  /** A family G30 moved, the version it moved to, and a few of its rows: its pre-G30 identity is carried. */
  const MOVED: [string, string, number][] = [
    ['exercise.five-finger.', 'five_finger', 3],
    ['exercise.tumbao.', 'tumbao', 2],
    ['exercise.cadence.', 'cadence', 2],
    // CL15 changed every walking-bass item, so its v2 identities were never carried; G30's v3 is.
    ['exercise.walking-bass.', 'walking_bass', 4],
  ];

  it('an item of a moved family carries the identity it had, and a run stored against it is contact', () => {
    for (const [prefix, family, version] of MOVED) {
      const items = generated(prefix);
      expect(items.length, prefix).toBeGreaterThan(0);
      for (const item of items) {
        const current = identityOf(item);
        const before = atVersion(item, version - 1);
        expect([current.family, current.version], item.id).toEqual([family, version]);
        expect(item.provenance?.formerGeneratorIdentities, item.id).toEqual([before]);
        expect(sameMaterial(before, current), item.id).toBe(true);
        expect(sameIdentity(before, current), item.id).toBe(false);
        expect(contactIn([run(item.id, before)], item.id, current).contact, item.id).toBe('met');
      }
    }
  });

  describe('over the store', () => {
    beforeEach(() => {
      useFakeIndexedDb();
      resetProgressForTest();
    });
    afterEach(() => clearFakeIndexedDb());

    it('a run recorded against an octave tremolo’s identity before CL15 is contact with the row G30 wrote, in one lookup', async () => {
      const item = byId.get('exercise.tremolo.c.right');
      if (item === undefined) throw new Error('exercise.tremolo.c.right is not in the catalogue');
      const current = identityOf(item);
      const result: RunResult = {
        itemId: item.id,
        mode: 'tempo',
        tempoPct: 100,
        accuracy: 1,
        accuracyEstimated: false,
        wrongNotes: 0,
        missed: 0,
        durationMs: 1000,
        passed: true,
        masterEligible: false,
        material: atVersion(item, 1),
      };
      await recordRun(result, new Date(2026, 8, 29, 12));
      expect(current.version).toBe(3);
      expect(await contact(item.id, current)).toEqual({ contact: 'met', metById: true, metAs: [item.id], how: ['played'] });
    });
  });
});

"""

if "describe('G30: withdrawing an unsourced printed fingering" not in s:
    assert s.count(OLD_HEAD) == 1
    s = s.replace(OLD_HEAD, NEW_HEAD)
    a, b = s.index(START), s.index(END)
    s = s[:a] + NEW_BLOCK + s[b:]
OLD_AT = "/** The identity the catalogue held for this row at the version its family left (CL15 moved each family one version). */"
NEW_AT = "/** The identity the catalogue held for this row at an earlier version of its family (CL15, then G30, moved each one version). */"
if NEW_AT not in s:
    assert s.count(OLD_AT) == 1
    s = s.replace(OLD_AT, NEW_AT)
out = (s.replace("\n", "\r\n") if crlf else s).encode("utf-8")
if out != raw:
    p.write_bytes(out)
print("ok")
