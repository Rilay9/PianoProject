"""
G2: revise `app/tests/unit/masteryLadder.test.ts` where v0's transfer condition ("a first reading of
another row") is replaced by the transfer policy (the brief's item 3). Spliced as text, CRLF kept.
Run from the repository root.
"""
from pathlib import Path

p = Path("app/tests/unit/masteryLadder.test.ts")
raw = p.read_bytes().decode("utf-8")
assert "\r\n" in raw
text = raw.replace("\r\n", "\n")


def rep(old: str, new: str) -> None:
    global text
    assert text.count(old) == 1, old[:70]
    text = text.replace(old, new, 1)


rep(""" * Two histories at the end are the brief's check that the moves give states a
 * teacher would recognise. As first written one did not (the stretch); the
 * change to the moves was approved and made (`countsTowardsMovingDown`).
 */""", """ * Two histories at the end are the brief's check that the moves give states a
 * teacher would recognise. As first written one did not (the stretch); the
 * change to the moves was approved and made (`countsTowardsMovingDown`).
 *
 * Revised (G2): transfer and the stretch's protection are the transfer policy's
 * (`transferPolicy.ts`), read over facts each read carries as `recordRun` writes
 * them — its phrase's material, its measured demands and its relationship to the
 * reads that established the skill (`withFacts`). v0's "a first reading of another
 * row" is no longer enough, and a read without those facts is unknown: it credits
 * no transfer and is spared nothing.
 */""")

rep("""import { ladderState, RETENTION_DAYS, RECENT_ATTEMPTS, SUPPORT_SHARE } from '../../src/evidence/ladder';""",
    """import { ladderState, RETENTION_DAYS, RECENT_ATTEMPTS, SUPPORT_SHARE } from '../../src/evidence/ladder';
import type { MeasuredEvidence } from '../../src/evidence/evidence';
import { DIMENSIONS, type Dimension, type Relationship } from '../../src/curriculum/transfer';
import type { Identity } from '../../src/review/record';""")

rep("""/** Four of the eight notes left out: well under the support share. */
const BADLY = { wrongSteps: [1, 3, 5, 7] };
const today = new Date(day(60));""", """/** Four of the eight notes left out: well under the support share. */
const BADLY = { wrongSteps: [1, 3, 5, 7] };
const today = new Date(day(60));

const LEVEL_2_RECIPE = { level: 2, bars: 4, hands: 'right', fifths: 0, timeSig: '4/4' };
const LEVEL_4_RECIPE = { level: 4, bars: 4, hands: 'right', fifths: 0, timeSig: '4/4', eighths: true, dotted: true };
const phraseOf = (seed: number, recipe: Record<string, unknown>): Identity => ({ kind: 'generator', family: 'sight-reading', version: 2, seed, recipe, tempoBpm: 72 });

/**
 * A read with the facts `recordRun` writes on it (G2): its phrase's material, the demands its run
 * measured, and — for a read after proficiency — its relationship to the reads before it, whose
 * measured facts differ on `differs` and on nothing else.
 */
function withFacts(e: Evidence, facts: { seed: number; recipe?: Record<string, unknown>; differs?: Dimension[]; extraDemands?: string[] }): Evidence {
  const measured = e as MeasuredEvidence;
  const located = [...new Set([...measured.byDemand.map((d) => d.demand), ...(measured.otherDemands ?? []).map((d) => d.demand)])].sort();
  const relationship: Relationship | undefined =
    facts.differs === undefined
      ? undefined
      : {
          skill: measured.skill,
          shownOn: [{ itemId: LEVEL_2, material: phraseOf(0, LEVEL_2_RECIPE) }],
          measured: DIMENSIONS.map((dimension) => ({ dimension, candidate: 'this', shownOn: ['that'], differs: facts.differs?.includes(dimension) === true })),
          differsOn: [...facts.differs],
        };
  return {
    ...measured,
    context: {
      ...measured.context,
      material: phraseOf(facts.seed, facts.recipe ?? LEVEL_2_RECIPE),
      demands: [...located, ...(facts.extraDemands ?? [])].sort(),
      ...(relationship === undefined ? {} : { relationship }),
    },
  } as unknown as Evidence;
}""")

rep("""describe('transfer needs unfamiliar material; retained needs a later day', () => {
  const shown = (): Evidence[] => [read(day(0)), read(day(1))];

  it('another phrase of the same row is not transfer; a first reading of another row is', () => {
    expect(ladderState({ evidence: [...shown(), read(day(2), { seed: 99 })], today }).state).toBe('proficient');
    const other = read(day(2), { itemId: LEVEL_4 });
    expect(ladderState({ evidence: [...shown(), other], today }).state).toBe('transfer demonstrated');""",
    """describe('transfer needs unfamiliar material; retained needs a later day', () => {
  const shown = (): Evidence[] => [withFacts(read(day(0)), { seed: 0 }), withFacts(read(day(1)), { seed: 1 })];
  /** A first reading of level 4's row whose relationship measures another rhythm: transfer for sight-reading (G2). */
  const transferRead = (at: string): Evidence => withFacts(read(at, { itemId: LEVEL_4 }), { seed: 2, recipe: LEVEL_4_RECIPE, differs: ['rhythm'] });

  // Revised (G2): v0 read any first reading of another row as transfer. The policy reads the facts:
  // another row whose measured rhythm differs is transfer, on rhythm; another row with no facts is
  // unknown; another phrase of the same row is a new seed and no transfer, whatever it measured.
  it('another phrase of the same row is not transfer, even measured different; a first reading of another row is, where its facts say so', () => {
    expect(ladderState({ evidence: [...shown(), read(day(2), { seed: 99 })], today }).state).toBe('proficient');
    const newSeed = withFacts(read(day(2), { seed: 99 }), { seed: 99, differs: ['rhythm'] });
    expect(ladderState({ evidence: [...shown(), newSeed], today }).state, 'a new seed of the row').toBe('proficient');
    const other = transferRead(day(2));
    const reading = ladderState({ evidence: [...shown(), other], today });
    expect(reading.state).toBe('transfer demonstrated');
    expect(reading.transferScope).toEqual([{ on: ['rhythm'], since: day(2) }]);
    expect(ladderState({ evidence: [...shown(), read(day(2), { itemId: LEVEL_4 })], today }).state, 'another row, no facts: unknown').toBe('proficient');""")

rep("""    const transferred = [...shown(), read(day(2), { itemId: LEVEL_4 })];""",
    """    const transferred = [...shown(), transferRead(day(2))];""")

rep("""    const retained = [...shown(), read(day(2), { itemId: LEVEL_4 }), read(day(2 + RETENTION_DAYS))];""",
    """    const retained = [...shown(), transferRead(day(2)), read(day(2 + RETENTION_DAYS))];""")

rep("""  it('the steady reader: five first readings on five days, then a harder row first time — transfer demonstrated', () => {
    const history = [
      ...Array.from({ length: 5 }, (_, n) => read(day(n), { seed: n })),
      read(day(5), { itemId: LEVEL_4 }),
    ];""", """  // Revised (G2): the harder row's read carries its facts, as `recordRun` writes them — another rhythm measured.
  it('the steady reader: five first readings on five days, then a harder row first time — transfer demonstrated', () => {
    const history = [
      ...Array.from({ length: 5 }, (_, n) => withFacts(read(day(n), { seed: n }), { seed: n })),
      withFacts(read(day(5), { itemId: LEVEL_4 }), { seed: 5, recipe: LEVEL_4_RECIPE, differs: ['rhythm'] }),
    ];""")

rep("""  it('the stretch: proficient at level 2, then two first readings of level 4 that go badly — still proficient', () => {
    const history = [
      read(day(0)),
      read(day(1)),
      read(day(2)),
      read(day(3), { itemId: LEVEL_4, ...BADLY }),
      read(day(4), { itemId: LEVEL_4, ...BADLY }),
    ];""", """  // Revised (G2): the level-4 reads carry their facts — another rhythm measured, and a demand the
  // level-2 reads never carried — and the policy spares them; without the facts, nothing is spared.
  it('the stretch: proficient at level 2, then two first readings of level 4 that go badly — still proficient', () => {
    const history = [
      withFacts(read(day(0)), { seed: 0 }),
      withFacts(read(day(1)), { seed: 1 }),
      withFacts(read(day(2)), { seed: 2 }),
      withFacts(read(day(3), { itemId: LEVEL_4, ...BADLY }), { seed: 3, recipe: LEVEL_4_RECIPE, differs: ['rhythm'] }),
      withFacts(read(day(4), { itemId: LEVEL_4, ...BADLY }), { seed: 4, recipe: LEVEL_4_RECIPE, differs: [], extraDemands: ['rhythm.dotted-quarter'] }),
    ];""")

rep("""    const reading = ladderState({ evidence: history, today: new Date(day(5)) });
    expect(reading.state, 'a stretch onto harder material took the skill back to familiar').toBe('proficient');
    expect(reading.transfer).toBe(false);
  });""", """    const reading = ladderState({ evidence: history, today: new Date(day(5)) });
    expect(reading.state, 'a stretch onto harder material took the skill back to familiar').toBe('proficient');
    expect(reading.transfer).toBe(false);
    // The same two failures with no facts on them: unknown, never guessed into protection.
    const bare = [read(day(0)), read(day(1)), read(day(2)), read(day(3), { itemId: LEVEL_4, ...BADLY }), read(day(4), { itemId: LEVEL_4, ...BADLY })];
    expect(ladderState({ evidence: bare, today: new Date(day(5)) }).state).toBe('familiar');
  });""")

p.write_bytes(text.replace("\n", "\r\n").encode("utf-8"))
print("ok")
