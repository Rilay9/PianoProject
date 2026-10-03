/**
 * The transfer policy (G2; audit Part 26; the brief's items 1, 2 and 7; the reviewer's fact path,
 * `docs/review/responses/a96395d.md`): one reading, skill-relative, of three facts an attempt
 * carries — contact novelty (`firstContact`, G1a's relation), the context relationship (D4's
 * `relationshipOf`, measured and declared kept apart) and the skill's own dimensions (the
 * vocabulary's `transfer` block) — beside the establishing contexts the ladder's replay holds.
 *
 * Written first against a stub that answered `unknown` to everything, one case per adversary of
 * Part 26's fourteen, so any adversary the three facts could not tell apart would show before a
 * line of the policy was written (the entry's premise table).
 *
 * Revised (G2a; the G2 review's one required change, `docs/review/responses/030ce744.md`): a
 * composition the learner has already played (`relationship.composition.playedAs` non-empty) is read
 * before the dimensions and credits nothing. The relationship names the composition and the items of
 * it played, and nothing that tells a new section of one arrangement from another arrangement — or
 * either from familiarity with the tune — so adversaries 4, 5 and 6 read `unknown` with today's facts,
 * and may diverge only once the relationship's owner carries the arrangement or section fact.
 */
import { describe, expect, it } from 'vitest';
import { line, phrase } from './helpers/phrase';
import { observe } from './helpers/observed';
import { evidenceFor, type MeasuredEvidence } from '../../src/evidence/evidence';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { sparesFailure, transferReading, type EstablishedContext, type SkillTransferSource } from '../../src/evidence/transferPolicy';
import type { Dimension, DimensionFact, MaterialReference, Relationship } from '../../src/curriculum/transfer';
import type { TransferOf } from '../../src/curriculum/types';
import type { Identity } from '../../src/review/record';

// --- the facts, constructed ------------------------------------------------------------------

const RECIPE_A = { level: 2, bars: 4, hands: 'right', fifths: 0, timeSig: '4/4', eighths: true, skips: true };
const phraseOf = (seed: number, recipe: Record<string, unknown> = RECIPE_A, version = 2): Identity => ({
  kind: 'generator',
  family: 'sight-reading',
  version,
  seed,
  recipe,
  tempoBpm: 72,
});
const file = (sha256: string): Identity => ({ kind: 'file', sha256 });

/** Two phrases of one reading row: what established the skill, with the demands their runs measured. */
const SHOWN_DEMANDS = ['interval.step', 'interval.skip', 'rhythm.eighths'];
const ESTABLISHED: EstablishedContext[] = [
  { itemId: 'drill.reading.sight-reading-2-right', material: phraseOf(1), demands: SHOWN_DEMANDS },
  { itemId: 'drill.reading.sight-reading-2-right', material: phraseOf(2), demands: SHOWN_DEMANDS },
];
const SHOWN_ON: MaterialReference[] = ESTABLISHED.map(({ itemId, material }) => ({ itemId, ...(material === undefined ? {} : { material }) }));

/** A skill whose transfer dimensions are key, hands and texture (reading by interval's, as the vocabulary states it). */
const INTERVALS: SkillTransferSource = { id: 'interval-reading', transfer: { dimensions: ['key', 'hands', 'texture'], why: 'constructed' } };
/** A rhythm skill: rhythm and texture. */
const SUBDIVISION: SkillTransferSource = { id: 'subdivision', transfer: { dimensions: ['rhythm', 'texture'], why: 'constructed' } };
/** A skill the data has not yet given dimensions. */
const UNSTATED: SkillTransferSource = { id: 'reading-ahead' };

/** One measured fact per dimension: `true` differs, `false` the same, `'unknown'` not known. */
function relation(
  measured: Partial<Record<Dimension, boolean | 'unknown'>>,
  extra: { shownOn?: MaterialReference[]; declared?: TransferOf; composition?: { key: string; playedAs: string[] }; skill?: string } = {},
): Relationship {
  const dims: Dimension[] = ['family', 'source', 'key', 'hands', 'texture', 'rhythm'];
  const facts: DimensionFact[] = dims.map((dimension) => {
    const differs = measured[dimension] ?? false;
    return { dimension, candidate: differs === 'unknown' ? null : differs ? 'new' : 'shown', shownOn: (extra.shownOn ?? SHOWN_ON).map(() => 'shown'), differs };
  });
  return {
    skill: extra.skill ?? 'interval-reading',
    shownOn: extra.shownOn ?? SHOWN_ON,
    ...(extra.declared ? { declared: extra.declared } : {}),
    measured: facts,
    differsOn: [...new Set([...facts.filter((f) => f.differs === true).map((f) => f.dimension), ...(extra.declared?.differs ?? [])])],
    ...(extra.composition ? { composition: extra.composition } : {}),
  };
}

interface Plan {
  itemId?: string;
  material?: Identity;
  firstContact?: boolean;
  relationship?: Relationship;
  demands?: string[];
  intent?: 'transfer';
  right?: number;
  n?: number;
  standard?: 'full' | 'practice';
}

/** One attempt's evidence, as the ladder reads it: its context carries every fact the policy reads. */
function attempt(plan: Plan = {}): MeasuredEvidence {
  return {
    kind: 'measured',
    skill: 'interval-reading',
    observationId: null,
    standard: plan.standard ?? 'full',
    n: plan.n ?? 10,
    right: plan.right ?? 10,
    at: '2026-09-20T10:00:00.000Z',
    context: {
      itemId: plan.itemId ?? 'excerpt.somewhere',
      ...(plan.material === undefined ? {} : { material: plan.material }),
      ...(plan.intent === undefined ? {} : { intent: plan.intent }),
      ...(plan.firstContact === undefined ? {} : { firstContact: plan.firstContact }),
      ...(plan.relationship === undefined ? {} : { relationship: plan.relationship }),
      ...(plan.demands === undefined ? {} : { demands: plan.demands }),
      met: [],
      unattributed: 0,
      estimated: false,
    },
    byDemand: [],
  } as unknown as MeasuredEvidence;
}

const BADLY = { right: 2, n: 10 };

// --- the fourteen ------------------------------------------------------------------------------

describe('Part 26’s fourteen adversaries, each on the facts the attempt carries', () => {
  it('1. a new seed of one family is not transfer, even where the seed happened to measure another rhythm', () => {
    const run = attempt({
      itemId: 'drill.reading.sight-reading-2-right',
      material: phraseOf(9),
      firstContact: true,
      relationship: relation({ rhythm: true, texture: true }),
      demands: [...SHOWN_DEMANDS, 'rhythm.dotted-quarter'],
    });
    const reading = transferReading(SUBDIVISION, ESTABLISHED, run);
    expect(reading).toMatchObject({ verdict: 'not-transfer', on: [], differs: [], newDemands: [] });
    expect(reading.why).toMatch(/new seed/);
    // …and failing it counts against the skill: the material the skill was shown on, again.
    expect(sparesFailure(transferReading(SUBDIVISION, ESTABLISHED, { ...run, ...BADLY }), { ...run, ...BADLY })).toBe(false);
  });

  it('2. a family’s context changed by contract (the recipe moved the key) may qualify, on the dimensions changed', () => {
    const run = attempt({
      itemId: 'drill.reading.sight-reading-2-right',
      material: phraseOf(9, { ...RECIPE_A, fifths: 1 }),
      firstContact: true,
      relationship: relation({ key: true }),
      demands: [...SHOWN_DEMANDS, 'key.signature'],
    });
    expect(transferReading(INTERVALS, ESTABLISHED, run)).toMatchObject({ verdict: 'demonstrated', on: ['key'] });
  });

  it('3. a transfer-role item without the target opportunity gives no evidence at all: the gate’s, and the policy is never asked', () => {
    // Four repeated notes: no step, skip or leap, so reading by interval has no opportunity.
    const unison = phrase({ bars: [line(['C4', 'C4', 'C4', 'C4'], 1)] });
    const observation = { ...observe(unison, { mode: 'tempo', unseen: true, guide: 'off', itemId: 'exercise.transfer.role' }), intent: 'transfer' as const };
    const [result] = evidenceFor({ observation, played: unison, targetSkills: ['interval-reading'], vocabulary: VOCABULARY_V0 });
    expect(result).toMatchObject({ kind: 'refusal', reason: 'no-opportunity' });
  });

  // Revised (G2a): this read `not-transfer` from the dimensions (nothing interval-reading names
  // differs). The composition is now read before the dimensions, so a neighbouring cut of a piece
  // already played is decided on that fact alone and credits nothing: no consumer tells the two
  // verdicts apart (promotion takes `demonstrated`; protection reads `differs` and `newDemands`,
  // empty and the same either way).
  it('4. a neighbouring excerpt with the same pattern credits nothing: the composition already played is read before the dimensions', () => {
    const run = attempt({
      material: file('b'.repeat(64)),
      firstContact: true,
      relationship: relation({ source: true }, { composition: { key: 'work:anh113', playedAs: ['excerpt.anh113.1-8'] } }),
    });
    const reading = transferReading(INTERVALS, ESTABLISHED, run);
    expect(reading).toMatchObject({ verdict: 'unknown', on: [], differs: [] });
    expect(reading.why).toMatch(/work:anh113/);
  });

  // Rewritten (G2a; the reviewer's discriminating case): this read `demonstrated` on key and texture,
  // the composition named in `why`. Familiarity with the tune, its structure or its arrangement can
  // carry a first reading of another cut; the relationship cannot say whether this is an independent
  // context, so the honest verdict with today's facts is `unknown`.
  it('5. a new section of the same arrangement is unknown with today’s facts: the composition met before, the section fact not carried, not credited', () => {
    const facts = {
      material: file('c'.repeat(64)),
      firstContact: true,
      relationship: relation({ source: true, key: true, texture: true }, { composition: { key: 'work:anh113', playedAs: ['excerpt.anh113.1-8'] } }),
    };
    const reading = transferReading(INTERVALS, ESTABLISHED, attempt(facts));
    expect(reading).toMatchObject({ verdict: 'unknown', on: [], differs: [] });
    expect(reading.why).toMatch(/work:anh113/);
    expect(reading.why).toMatch(/excerpt\.anh113\.1-8/);
    expect(reading.why).toMatch(/arrangement or section/);
    expect(reading.why).toMatch(/not credited/);
    // Protection reads the same unknown: the measured key and texture are not a stretch it can lean
    // on (the cut played before may have been in that key), so two bad readings count.
    const failed = attempt({ ...facts, ...BADLY });
    expect(sparesFailure(transferReading(INTERVALS, ESTABLISHED, failed), failed)).toBe(false);
  });

  // Rewritten (G2a; the reviewer's discriminating case): this read `demonstrated` on hands, "related"
  // in `why`. A different arrangement carries the same shape of fact as case 5 — the composition's key
  // and the items of it played — so the two cannot diverge until the relationship says which it is.
  it('6. a different arrangement is unknown with the same facts as a new section: the composition met before, the arrangement fact not carried, not credited', () => {
    const facts = {
      material: file('d'.repeat(64)),
      firstContact: true,
      relationship: relation({ source: true, hands: true }, { composition: { key: 'work:ode', playedAs: ['kern.ode.easy'] } }),
    };
    const reading = transferReading(INTERVALS, ESTABLISHED, attempt(facts));
    expect(reading).toMatchObject({ verdict: 'unknown', on: [], differs: [] });
    expect(reading.why).toMatch(/work:ode/);
    expect(reading.why).toMatch(/kern\.ode\.easy/);
    expect(reading.why).toMatch(/arrangement or section/);
    expect(reading.why).toMatch(/not credited/);
    // Protection as for any unknown reading: a demand no establishing record carried still spares a
    // failure (a separate, known fact); without one the failure counts.
    const failed = attempt({ ...facts, ...BADLY });
    expect(sparesFailure(transferReading(INTERVALS, ESTABLISHED, failed), failed)).toBe(false);
    const stretched = attempt({ ...facts, ...BADLY, demands: ['interval.leap'] });
    const stretchedReading = transferReading(INTERVALS, ESTABLISHED, stretched);
    expect(stretchedReading.newDemands).toEqual(['interval.leap']);
    expect(sparesFailure(stretchedReading, stretched)).toBe(true);
  });

  it('7. a duplicate or imported copy regains no first contact (G1 met it by its bytes): not transfer, whatever its row claims', () => {
    const run = attempt({ material: file('e'.repeat(64)), firstContact: false, relationship: relation({ key: true, texture: true }) });
    expect(transferReading(INTERVALS, ESTABLISHED, run)).toMatchObject({ verdict: 'not-transfer', on: [] });
    expect(sparesFailure(transferReading(INTERVALS, ESTABLISHED, { ...run, ...BADLY }), { ...run, ...BADLY })).toBe(false);
  });

  it('8. heard but never played is not first contact: not transfer', () => {
    const run = attempt({ material: file('f'.repeat(64)), firstContact: false, relationship: relation({ key: true }) });
    const reading = transferReading(INTERVALS, ESTABLISHED, run);
    expect(reading).toMatchObject({ verdict: 'not-transfer', on: [] });
    expect(reading.why).toMatch(/first contact/);
  });

  it('9. an unfamiliar excerpt with appropriate demands, at the full standard, demonstrates transfer on its dimensions', () => {
    const run = attempt({
      material: file('1'.repeat(64)),
      firstContact: true,
      relationship: relation({ family: true, source: true, key: true, texture: true }),
      demands: ['interval.step', 'interval.skip', 'texture.hands-together'],
    });
    expect(transferReading(INTERVALS, ESTABLISHED, run)).toMatchObject({ verdict: 'demonstrated', on: ['key', 'texture'] });
  });

  it('10. an unfamiliar excerpt with untaught demands, failed badly, does not count against the simpler skill', () => {
    const run = attempt({
      material: file('2'.repeat(64)),
      firstContact: true,
      relationship: relation({ family: true, source: true }),
      demands: ['interval.leap', 'rhythm.syncopation'],
      ...BADLY,
    });
    const reading = transferReading(INTERVALS, ESTABLISHED, run);
    expect(reading.verdict).toBe('not-transfer');
    expect(reading.newDemands).toEqual(['interval.leap', 'rhythm.syncopation']);
    expect(sparesFailure(reading, run)).toBe(true);
  });

  it('11. familiar material after 21 days is retention, not new transfer: no first contact', () => {
    const run = attempt({ material: phraseOf(1), firstContact: false, relationship: relation({}) });
    expect(transferReading(INTERVALS, ESTABLISHED, run)).toMatchObject({ verdict: 'not-transfer', on: [] });
  });

  it('12. right-hand transfer does not establish anything about the hands: `on` excludes hands and texture', () => {
    const run = attempt({ material: file('3'.repeat(64)), firstContact: true, relationship: relation({ family: true, key: true }) });
    const reading = transferReading(INTERVALS, ESTABLISHED, run);
    expect(reading).toMatchObject({ verdict: 'demonstrated', on: ['key'] });
    expect(reading.on).not.toContain('hands');
    expect(reading.on).not.toContain('texture');
  });

  it('13. a generator version change is another identity, judged on the dimensions (not a new seed)', () => {
    const run = attempt({
      itemId: 'drill.reading.sight-reading-2-right',
      material: phraseOf(1, RECIPE_A, 3),
      firstContact: true,
      relationship: relation({ rhythm: true }),
    });
    expect(transferReading(SUBDIVISION, ESTABLISHED, run)).toMatchObject({ verdict: 'demonstrated', on: ['rhythm'] });
  });

  it('14. historical evidence without provenance keeps its place and reads unknown: no credit, no protection', () => {
    const run = attempt({ itemId: 'drill.reading.sight-reading-4', firstContact: true });
    const reading = transferReading(INTERVALS, ESTABLISHED, run);
    expect(reading).toMatchObject({ verdict: 'unknown', on: [], differs: [] });
    expect(sparesFailure(transferReading(INTERVALS, ESTABLISHED, { ...run, ...BADLY }), { ...run, ...BADLY })).toBe(false);
  });
});

// --- the composition fact's boundary (G2a) -----------------------------------------------------

describe('a composition already played fails closed, and only that fact', () => {
  it('the same material facts with no composition relationship still read demonstrated on the differing dimension', () => {
    const section = attempt({ material: file('c'.repeat(64)), firstContact: true, relationship: relation({ source: true, key: true, texture: true }) });
    expect(transferReading(INTERVALS, ESTABLISHED, section)).toMatchObject({ verdict: 'demonstrated', on: ['key', 'texture'] });
    const arrangement = attempt({ material: file('d'.repeat(64)), firstContact: true, relationship: relation({ source: true, hands: true }) });
    expect(transferReading(INTERVALS, ESTABLISHED, arrangement)).toMatchObject({ verdict: 'demonstrated', on: ['hands'] });
  });

  it('a composition with nothing of it played (the first cut met) is no familiarity fact: judged on the dimensions', () => {
    // `relationshipOf` writes `composition` wherever the item names one, `playedAs: []` where no run
    // of it exists (`transferRelationship.test.ts`, adversary 6): the tune is new to this learner.
    const run = attempt({ material: file('c'.repeat(64)), firstContact: true, relationship: relation({ source: true, key: true }, { composition: { key: 'work:anh113', playedAs: [] } }) });
    const reading = transferReading(INTERVALS, ESTABLISHED, run);
    expect(reading).toMatchObject({ verdict: 'demonstrated', on: ['key'] });
    expect(reading.why).not.toMatch(/work:anh113/);
  });

  it('the earlier facts keep their verdicts: not first contact and unknown contact are read before the composition', () => {
    const played = { composition: { key: 'work:ode', playedAs: ['kern.ode.easy'] } };
    const again = attempt({ material: file('d'.repeat(64)), firstContact: false, relationship: relation({ hands: true }, played) });
    expect(transferReading(INTERVALS, ESTABLISHED, again)).toMatchObject({ verdict: 'not-transfer', on: [] });
    const unrecorded = attempt({ material: file('d'.repeat(64)), relationship: relation({ hands: true }, played) });
    expect(transferReading(INTERVALS, ESTABLISHED, unrecorded).why).toMatch(/first contact not recorded/);
  });
});

// --- the rules the adversaries rest on ---------------------------------------------------------

describe('declared and measured apart; unknown never guessed', () => {
  it('a dimension declared to differ and measured the same credits nothing, and the reading says so (D4’s pentatonic, rhythm)', () => {
    const declared: TransferOf = { skill: 'position-shift', from: ['position_shift'], differs: ['family', 'rhythm'], notMeasured: ['the thumb passing under'] };
    const pentatonic: Identity = { kind: 'generator', family: 'pentatonic', version: 1, seed: null, recipe: { key: 'A', form: 'blues', hands: 'right' }, tempoBpm: 72 };
    const run = attempt({ material: pentatonic, firstContact: true, relationship: relation({ family: true }, { declared }) });
    const reading = transferReading(SUBDIVISION, ESTABLISHED, run);
    expect(reading.verdict).toBe('not-transfer');
    expect(reading.on).toEqual([]);
    expect(reading.why).toMatch(/rhythm: declared to differ, measured the same/);
  });

  it('`differsOn` is never read: a list that names a dimension the measured facts do not is no evidence', () => {
    const run = attempt({ material: file('4'.repeat(64)), firstContact: true, relationship: { ...relation({}), differsOn: ['key', 'hands', 'texture'] } });
    expect(transferReading(INTERVALS, ESTABLISHED, run)).toMatchObject({ verdict: 'not-transfer', on: [] });
  });

  it('a transfer-intended row with no relationship (D4’s race, G68) is transfer-intended with the relationship unknown', () => {
    const run = attempt({ material: file('5'.repeat(64)), intent: 'transfer', firstContact: true });
    const reading = transferReading(INTERVALS, ESTABLISHED, run);
    expect(reading).toMatchObject({ verdict: 'unknown', on: [] });
    expect(reading.why).toMatch(/G68/);
  });

  it('first contact not recorded (a row from before G1a) is unknown, never read from anything else', () => {
    const run = attempt({ material: file('6'.repeat(64)), relationship: relation({ key: true }) });
    expect(transferReading(INTERVALS, ESTABLISHED, run)).toMatchObject({ verdict: 'unknown', on: [] });
    expect(sparesFailure(transferReading(INTERVALS, ESTABLISHED, { ...run, ...BADLY }), { ...run, ...BADLY })).toBe(false);
  });

  it('every establishing reference unknown (legacy reads) is unknown: facts against unknown material are not measured facts', () => {
    const legacy: EstablishedContext[] = [{ itemId: 'drill.reading.sight-reading-2-right' }, { itemId: 'drill.reading.sight-reading-2-right' }];
    const run = attempt({ material: file('7'.repeat(64)), firstContact: true, relationship: relation({ key: true }, { shownOn: legacy }) });
    expect(transferReading(INTERVALS, legacy, run)).toMatchObject({ verdict: 'unknown', on: [] });
  });

  it('a skill without a transfer block credits nothing, whatever differs', () => {
    const run = attempt({ material: file('8'.repeat(64)), firstContact: true, relationship: relation({ key: true, hands: true, texture: true, rhythm: true }) });
    const reading = transferReading(UNSTATED, ESTABLISHED, run);
    expect(reading).toMatchObject({ verdict: 'unknown', on: [], differs: [] });
    expect(reading.why).toMatch(/no transfer dimensions/);
  });

  it('no skill dimension known to differ and one not known: unknown, never not-transfer and never demonstrated', () => {
    const run = attempt({ material: file('9'.repeat(64)), firstContact: true, relationship: relation({ key: 'unknown' }) });
    expect(transferReading(INTERVALS, ESTABLISHED, run)).toMatchObject({ verdict: 'unknown', on: [] });
  });

  it('a practice-standard or failed run is never demonstrated, though its dimensions differ', () => {
    const differing = { material: file('a'.repeat(64)), firstContact: true, relationship: relation({ key: true }) };
    expect(transferReading(INTERVALS, ESTABLISHED, attempt({ ...differing, standard: 'practice' })).verdict).toBe('not-transfer');
    const failed = transferReading(INTERVALS, ESTABLISHED, attempt({ ...differing, ...BADLY }));
    expect(failed).toMatchObject({ verdict: 'not-transfer', on: [], differs: ['key'] });
  });

  it('protection needs a known fact: new demands only where the attempt’s and every establishing record’s demands are known', () => {
    const run = attempt({ material: file('0'.repeat(64)), firstContact: true, relationship: relation({}), demands: ['interval.leap'], ...BADLY });
    const partlyKnown: EstablishedContext[] = [ESTABLISHED[0] as EstablishedContext, { itemId: 'drill.reading.sight-reading-2-right', material: phraseOf(2) }];
    const reading = transferReading(INTERVALS, partlyKnown, run);
    expect(reading.newDemands).toBeUndefined();
    expect(sparesFailure(reading, run)).toBe(false);
  });
});
