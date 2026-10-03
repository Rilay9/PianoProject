"""
G2: revise `app/tests/unit/materialOnTheRecord.test.ts`'s D4 case "no ladder state moves for the D4
fields" to the policy's verdicts (the brief's item 3), spliced as text with the file's CRLF kept.
Run from the repository root.
"""
from pathlib import Path

p = Path("app/tests/unit/materialOnTheRecord.test.ts")
raw = p.read_bytes().decode("utf-8")
assert "\r\n" in raw
text = raw.replace("\r\n", "\n")


def rep(old: str, new: str) -> None:
    global text
    assert text.count(old) == 1, old[:70]
    text = text.replace(old, new, 1)


rep(""" * - **no ladder state and no rung state moves for any of it** (item 6): the same history read
 *   with and without the D4 fields gives the same reading, on every constructed history here.
 */""", """ * - **no ladder state and no rung state moves for any of it** (item 6): the same history read
 *   with and without the D4 fields gives the same reading, on every constructed history here —
 *   revised (G2): **except where the transfer policy says `demonstrated`**, which needs the facts G2
 *   writes on the attempt (a relationship whose measured facts differ on one of the skill's
 *   dimensions, first contact); a D4 field alone moves nothing.
 */""")

rep("""  it('a measured record: material and intent beside itemId and seed, first contact as before', () => {""",
    """  // Revised (G2): first contact is the run header's `firstContact` (the helper's run carries both,
  // as a phrase run does), never read from `unseen` (the G1a review).
  it('a measured record: material and intent beside itemId and seed, first contact as the header says', () => {""")

rep("""describe('no ladder state and no rung state moves for the D4 fields (item 6)', () => {""",
    """// Revised (G2, the brief's item 3): v0's ladder read none of these fields, so every reading was equal.
// The transfer policy reads the attempt's own facts, so a history now changes exactly where the policy
// says `demonstrated`: the four D4 histories carry no relationship on their evidence (they were not
// stored through `recordRun`) and read as before; a fifth carries one, as `recordRun` writes it.
describe('no ladder state and no rung state moves for the D4 fields, but where the policy says demonstrated (item 6; G2 item 3)', () => {""")

rep("""  const strip = (row: SessionRow): SessionRow => {
    const { material: _m, role: _r, intent: _i, relationship: _rel, ...rest } = row;
    const evidence = rest.evidence?.map((result) =>
      result.kind === 'refusal' ? result : ({ ...result, context: (({ material: _cm, intent: _ci, ...context }) => context)(result.context) } as EvidenceResult),
    );
    return { ...rest, ...(evidence ? { evidence } : {}) };
  };""", """  const strip = (row: SessionRow): SessionRow => {
    const { material: _m, role: _r, intent: _i, relationship: _rel, ...rest } = row;
    const evidence = rest.evidence?.map((result) =>
      result.kind === 'refusal'
        ? result
        : ({ ...result, context: (({ material: _cm, intent: _ci, relationship: _cr, demands: _cd, ...context }) => context)(result.context as MeasuredEvidence['context']) } as EvidenceResult),
    );
    return { ...rest, ...(evidence ? { evidence } : {}) };
  };
  /** A read carrying the facts `recordRun` writes (G2): a relationship measured against the two reads before it, the key differing. */
  const withRelationship = (row: SessionRow, shown: SessionRow[]): SessionRow => ({
    ...row,
    evidence: row.evidence?.map((result) =>
      result.kind !== 'measured'
        ? result
        : ({
            ...result,
            context: {
              ...result.context,
              relationship: {
                skill: result.skill,
                shownOn: shown.map((one) => ({ itemId: one.itemId, ...(one.material ? { material: one.material } : {}) })),
                measured: [
                  { dimension: 'key', candidate: '1', shownOn: shown.map(() => '0'), differs: true },
                  { dimension: 'hands', candidate: 'right', shownOn: shown.map(() => 'right'), differs: false },
                ],
                differsOn: ['key'],
              },
            },
          } as EvidenceResult),
    ),
  });""")

rep("""    'a phrase met before, read again': [read(1, READING_ROW, { material: other(1) }), read(2, READING_ROW, { material: other(1) }, { unseen: false }), read(3, READING_ROW, { material: other(3) })],
  };""", """    'a phrase met before, read again': [read(1, READING_ROW, { material: other(1) }), read(2, READING_ROW, { material: other(1) }, { unseen: false }), read(3, READING_ROW, { material: other(3) })],
    // G2: the one history whose third read carries its relationship — first contact, another key.
    'two reads, then a first reading in another key with its relationship recorded': (() => {
      const shown = [read(1, READING_ROW, { material: other(1) }), read(2, READING_ROW, { material: other(2) })];
      const inAnotherKey = { ...PHRASE, seed: 3, recipe: { ...(PHRASE as { recipe: Record<string, unknown> }).recipe, fifths: 1 } } as Identity;
      return [...shown, withRelationship(read(3, READING_ROW, { material: inAnotherKey }), shown)];
    })(),
  };""")

rep("""  for (const [name, rows] of Object.entries(HISTORIES)) {
    it(`the same reading with and without them: ${name}`, () => {
      const today = new Date(2026, 9, 30, 9);
      const bare = rows.map(strip);
      for (const skill of ['sight-reading', 'interval-reading', 'position-shift']) {
        const of = (list: SessionRow[]) => ladderState({ evidence: list.flatMap(storedEvidence).filter((e) => e.skill === skill), today });
        const withFields = of(rows);
        expect(LADDER_STATES).toContain(withFields.state);
        expect({ ...withFields, selfAssessed: withFields.selfAssessed.length }, `${name}: ${skill}`).toEqual({ ...of(bare), selfAssessed: of(bare).selfAssessed.length });
      }
      const states = rungState(rows, curriculum, VOCABULARY_V0, today);
      const bareStates = rungState(bare, curriculum, VOCABULARY_V0, today);
      for (const id of ['2.5', '3.1', '3.4']) {
        expect(states.byRung.get(id)?.status, `${name}: ${id}`).toBe(bareStates.byRung.get(id)?.status);
      }
    });
  }""", """  const summary = (reading: ReturnType<typeof ladderState>) => ({
    state: reading.state,
    transfer: reading.transfer,
    retained: reading.retained,
    notShownRecently: reading.notShownRecently,
    selfAssessed: reading.selfAssessed.length,
    established: reading.established.map((one) => one.itemId),
  });
  const DEMONSTRATED = 'two reads, then a first reading in another key with its relationship recorded';

  for (const [name, rows] of Object.entries(HISTORIES)) {
    it(`the same reading with and without them, but where the policy says demonstrated: ${name}`, () => {
      const today = new Date(2026, 9, 30, 9);
      const bare = rows.map(strip);
      let moved = false;
      for (const skill of ['sight-reading', 'interval-reading', 'position-shift']) {
        const of = (list: SessionRow[]) => ladderState({ evidence: list.flatMap(storedEvidence).filter((e) => e.skill === skill), today });
        const withFields = of(rows);
        const without = of(bare);
        expect(LADDER_STATES).toContain(withFields.state);
        expect(without.transferScope, `${name}: ${skill} without the facts`).toEqual([]);
        if (withFields.transferScope.length === 0) {
          expect(summary(withFields), `${name}: ${skill}`).toEqual(summary(without));
        } else {
          // Only here: the policy read the attempt's relationship as demonstrated, on the key.
          moved = true;
          expect(withFields.transferScope, `${name}: ${skill}`).toEqual([{ on: ['key'], since: new Date(2026, 9, 3, 12).toISOString() }]);
          expect([withFields.state, without.state], `${name}: ${skill}`).toEqual(['transfer demonstrated', 'proficient']);
        }
      }
      expect(moved, name).toBe(name === DEMONSTRATED);
      if (!moved) {
        const states = rungState(rows, curriculum, VOCABULARY_V0, today);
        const bareStates = rungState(bare, curriculum, VOCABULARY_V0, today);
        for (const id of ['2.5', '3.1', '3.4']) {
          expect(states.byRung.get(id)?.status, `${name}: ${id}`).toBe(bareStates.byRung.get(id)?.status);
        }
      }
    });
  }""")

p.write_bytes(text.replace("\n", "\r\n").encode("utf-8"))
print("ok")
