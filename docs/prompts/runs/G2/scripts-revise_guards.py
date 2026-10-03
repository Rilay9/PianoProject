"""
G2: two test revisions spliced as text (CRLF kept), run from the repository root.

1. `evidenceByDemand.test.ts`'s guard "nothing in the evidence module knows the reader's dimensions":
   the transfer policy the brief places in `src/evidence/` reads D4's relationship (its type, from
   `curriculum/transfer`) and the one material identity (`curriculum/material`), and speaks of the
   relationship's dimensions — which are not the reader's controls. The guard keeps every ban on the
   reader, the generator and its controls, and allows exactly those two imports and that word in the
   files that read the policy.
2. `competenceSurvivesPruning.test.ts`'s established history: the read on another row carries the
   facts `recordRun` writes (G2) — the phrases' material and, on the read after proficiency, its
   relationship (the hands measured to differ) — so the mastered state the test holds across pruning
   is the policy's, not v0's "a different item".
"""
from pathlib import Path


def splice(path: str, pairs: list[tuple[str, str]]) -> None:
    p = Path(path)
    raw = p.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    text = raw.replace("\r\n", "\n")
    for old, new in pairs:
        assert text.count(old) == 1, (path, old[:70])
        text = text.replace(old, new, 1)
    p.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))
    print("ok", path)


splice("app/tests/unit/evidenceByDemand.test.ts", [(
    """      if (file !== 'rungState.ts') {
        expect(source, `${file} reads the curriculum`).not.toMatch(/from ['"][./]*curriculum\\//);
      }
      expect(source, `${file} speaks in the reader's dimensions`).not.toMatch(/READING_DIMENSIONS|ReadingMoves|ReadingRecipe|SightReadingOptions|\\bdimensions?\\b/);""",
    """      // Revised (G2): the transfer policy (`transferPolicy.ts`, which the brief places here) and the
      // ladder that consumes it read D4's relationship facts about the material — the relationship's
      // type (`curriculum/transfer`, a type-only import, also on the evidence context in
      // `evidence.ts`) and the one material identity (`curriculum/material`) — and speak of the
      // relationship's dimensions (family, source, key, hands, texture, rhythm), which are facts about
      // two pieces of material, not the reader's controls. Those two imports, and in the two policy
      // readers that word, are allowed; the reader, the generator and its controls stay banned
      // everywhere, and no other curriculum module may be read.
      const facts = source
        .replace(/import type \\{[^}]*\\} from ['"][./]*curriculum\\/transfer['"];?/g, '')
        .replace(/import \\{ knownMaterial \\} from ['"][./]*curriculum\\/material['"];?/g, '');
      if (file !== 'rungState.ts') {
        expect(facts, `${file} reads the curriculum`).not.toMatch(/from ['"][./]*curriculum\\//);
      }
      const policyReader = file === 'transferPolicy.ts' || file === 'ladder.ts';
      expect(source, `${file} speaks in the reader's dimensions`).not.toMatch(
        policyReader ? /READING_DIMENSIONS|ReadingMoves|ReadingRecipe|SightReadingOptions/ : /READING_DIMENSIONS|ReadingMoves|ReadingRecipe|SightReadingOptions|\\bdimensions?\\b/,
      );""",
)])

splice("app/tests/unit/competenceSurvivesPruning.test.ts", [
    (
        """import { BADLY, readRow } from './helpers/skillEvidence';""",
        """import { BADLY, readRow } from './helpers/skillEvidence';
import { DIMENSIONS, type Relationship } from '../../src/curriculum/transfer';
import type { EvidenceResult } from '../../src/evidence/evidence';
import type { Identity } from '../../src/review/record';

/** A phrase of one of the two rows: the material `recordRun` keeps on the read (G2 reads it). */
const phraseOf = (seed: number, hands: 'right' | 'both'): Identity => ({ kind: 'generator', family: 'sight-reading', version: 2, seed, recipe: { level: 2, bars: 4, hands, fifths: 0 }, tempoBpm: 72 });

/**
 * A read with the facts `recordRun` writes on it (G2): its phrase's material, and on a read after
 * proficiency its relationship to the reads that established the skill — measured to differ in the
 * hands (the other row is both hands) and in nothing else.
 */
function withFacts(row: SessionRow, material: Identity, shownOn?: SessionRow[]): SessionRow {
  const relationship = (skill: string): Relationship | undefined =>
    shownOn === undefined
      ? undefined
      : {
          skill,
          shownOn: shownOn.map((one) => ({ itemId: one.itemId, ...(one.material ? { material: one.material } : {}) })),
          measured: DIMENSIONS.map((dimension) => ({ dimension, candidate: dimension === 'hands' ? 'both' : 'same', shownOn: shownOn.map(() => (dimension === 'hands' ? 'right' : 'same')), differs: dimension === 'hands' })),
          differsOn: ['hands'],
        };
  return {
    ...row,
    material,
    evidence: row.evidence?.map((result) => {
      if (result.kind !== 'measured') return result;
      const facts = relationship(result.skill);
      return { ...result, context: { ...result.context, material, ...(facts === undefined ? {} : { relationship: facts }) } } as EvidenceResult;
    }),
  } as SessionRow;
}""",
    ),
    (
        """ * The established history, the oldest rows in the store: proficient on two
 * days, shown on first contact with another row, then retained a month later
 * — mastered — and one run that met 1.1. And one row whose evidence is under
 * an older version than the one in force: a claim the store keeps and the
 * ladder does not read.
 */""",
        """ * The established history, the oldest rows in the store: proficient on two
 * days, shown on first contact with another row, then retained a month later
 * — mastered — and one run that met 1.1. And one row whose evidence is under
 * an older version than the one in force: a claim the store keeps and the
 * ladder does not read.
 *
 * Revised (G2): "shown on first contact with another row" was v0's transfer, a
 * different item id. The transfer policy reads the facts `recordRun` writes on the
 * attempt, so the reads carry their phrases' material and the read on the other
 * row carries its relationship (the hands measured to differ): the same history,
 * mastered by the policy's reading, is what pruning must keep.
 */""",
    ),
    (
        """    readRow('2019-03-01T12:00:00.000Z', { lessonId: '1.5', itemId: ROW_A, seed: 1 }),
    readRow('2019-03-04T12:00:00.000Z', { lessonId: '1.5', itemId: ROW_A, seed: 2 }),
    readRow('2019-03-10T12:00:00.000Z', { itemId: ROW_B, seed: 3 }),
    readRow('2019-04-12T12:00:00.000Z', { lessonId: '1.5', itemId: ROW_A, seed: 4 }),
  ];""",
        """    ...(() => {
      const shown = [
        withFacts(readRow('2019-03-01T12:00:00.000Z', { lessonId: '1.5', itemId: ROW_A, seed: 1 }), phraseOf(1, 'right')),
        withFacts(readRow('2019-03-04T12:00:00.000Z', { lessonId: '1.5', itemId: ROW_A, seed: 2 }), phraseOf(2, 'right')),
      ];
      return [
        ...shown,
        withFacts(readRow('2019-03-10T12:00:00.000Z', { itemId: ROW_B, seed: 3 }), phraseOf(3, 'both'), shown),
        withFacts(readRow('2019-04-12T12:00:00.000Z', { lessonId: '1.5', itemId: ROW_A, seed: 4 }), phraseOf(4, 'right')),
      ];
    })(),
  ];""",
    ),
])
