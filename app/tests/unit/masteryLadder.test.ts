/**
 * The mastery ladder (C3 item 4; design §5; backlog Q6 `masteryLadder`, L11,
 * L25): exposure is not mastery, "transfer" needs evidence on unfamiliar
 * material, "retained" needs a later day, and states fall when the evidence
 * does and never with the calendar alone.
 *
 * Every history here is made of real evidence: runs played through the engine
 * (`helpers/observed.ts`) and read by `evidenceFor`, dated as the learner would
 * have played them. The ladder is then read on the evidence list alone, the
 * way it will be read of a learner's store.
 *
 * Two histories at the end are the brief's check that the moves give states a
 * teacher would recognise. As first written one did not (the stretch); the
 * change to the moves was approved and made (`countsTowardsMovingDown`).
 *
 * Revised (G2): transfer and the stretch's protection are the transfer policy's
 * (`transferPolicy.ts`), read over facts each read carries as `recordRun` writes
 * them — its phrase's material, its measured demands and its relationship to the
 * reads that established the skill (`withFacts`). v0's "a first reading of another
 * row" is no longer enough, and a read without those facts is unknown: it credits
 * no transfer and is spared nothing.
 */
import { describe, expect, it } from 'vitest';
import { phrase, line } from './helpers/phrase';
import { observe, type RunPlan } from './helpers/observed';
import { evidenceFor, type Evidence, type EvidenceResult } from '../../src/evidence/evidence';
import { ladderState, RETENTION_DAYS, RECENT_ATTEMPTS, SUPPORT_SHARE } from '../../src/evidence/ladder';
import type { MeasuredEvidence } from '../../src/evidence/evidence';
import { DIMENSIONS, type Dimension, type Relationship } from '../../src/curriculum/transfer';
import type { Identity } from '../../src/review/record';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { DEFAULT_MASTERY } from '../../src/engine/Scoring';
import { REPERTOIRE_WINDOW_DAYS } from '../../src/curriculum/session';

/** Two bars a reader reads: ten notes, every one an opportunity for sight-reading. */
const PHRASE = phrase({ bars: [line(['C4', 'D4', 'E4', 'C4'], 1), line(['E4', 'F4', 'G4', 'G4'], 1)] });
const LEVEL_2 = 'drill.reading.sight-reading-2';
const LEVEL_4 = 'drill.reading.sight-reading-4';

const day = (n: number, hour = 10): string => new Date(Date.UTC(2026, 8, 1 + n, hour)).toISOString();

/** A first reading, guide off, Keep tempo: the full standard for sight-reading. */
const FIRST_READING: RunPlan = { mode: 'tempo', unseen: true, guide: 'off' };

function read(at: string, plan: RunPlan & { wrongSteps?: number[] } = {}): Evidence {
  const observation = observe(PHRASE, {
    ...FIRST_READING,
    itemId: LEVEL_2,
    ...plan,
    at,
    ...(plan.wrongSteps ? { skip: plan.wrongSteps } : {}),
  });
  const result = evidenceFor({ observation, played: PHRASE, targetSkills: ['sight-reading'], vocabulary: VOCABULARY_V0 })[0] as EvidenceResult;
  expect(result.kind, JSON.stringify(result)).not.toBe('refusal');
  return result as Evidence;
}

/** Four of the eight notes left out: well under the support share. */
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
function withFacts(
  e: Evidence,
  facts: {
    seed: number;
    recipe?: Record<string, unknown>;
    differs?: Dimension[];
    extraDemands?: string[];
    /** A notated cut's own material in place of a phrase's (G2a). */
    material?: Identity;
    /** The relationship's composition fact: the composition and the items of it already played (G2a). */
    composition?: { key: string; playedAs: string[] };
  },
): Evidence {
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
          ...(facts.composition === undefined ? {} : { composition: facts.composition }),
        };
  return {
    ...measured,
    context: {
      ...measured.context,
      material: facts.material ?? phraseOf(facts.seed, facts.recipe ?? LEVEL_2_RECIPE),
      demands: [...located, ...(facts.extraDemands ?? [])].sort(),
      ...(relationship === undefined ? {} : { relationship }),
    },
  };
}

describe('the numbers are named and are what the design says they are', () => {
  // Revised (C6): 21 days was named as the review calendar's last step; the
  // calendar is retired (the reviewer's correction of 2026-09-26) and the span
  // stays the ladder's own hypothesis, with a piece's repertoire window apart.
  it('21 days is the ladder’s retention span, apart from a piece’s repertoire window; two recent attempts; supporting is Part G’s pass share', () => {
    expect(RETENTION_DAYS).toBe(21);
    expect(REPERTOIRE_WINDOW_DAYS).not.toBe(RETENTION_DAYS);
    expect(RECENT_ATTEMPTS).toBe(2);
    expect(SUPPORT_SHARE).toBe(DEFAULT_MASTERY.passAccuracy);
  });
});

describe('exposure is not mastery', () => {
  it('nothing is not introduced; a lesson page read is introduced, and no more', () => {
    expect(ladderState({ evidence: [], today }).state).toBe('not introduced');
    expect(ladderState({ evidence: [], exposures: [day(0)], today }).state).toBe('introduced');
  });

  it('one run against the skill is practised; one run with it, guided, is familiar and never more', () => {
    expect(ladderState({ evidence: [read(day(0), BADLY)], today }).state).toBe('practised');
    const guided = read(day(0), { guide: 'next' });
    expect(guided).toMatchObject({ standard: 'practice' });
    expect(ladderState({ evidence: [guided], today }).state).toBe('familiar');
    // Ten guided days are still familiar: the full standard was never met.
    const tenDays = Array.from({ length: 10 }, (_, n) => read(day(n), { guide: 'next' }));
    expect(ladderState({ evidence: tenDays, today }).state).toBe('familiar');
  });

  it('a Wait run of a timing skill leaves no record, so it cannot move the ladder at all', () => {
    const observation = observe(PHRASE, { mode: 'wait', itemId: LEVEL_2, at: day(0) });
    const result = evidenceFor({ observation, played: PHRASE, targetSkills: ['sight-reading'], vocabulary: VOCABULARY_V0 });
    expect(result[0]).toMatchObject({ kind: 'refusal', reason: 'not-measured:timing' });
  });

  it('self-assessed evidence is shown apart and moves nothing', () => {
    const silent = observe(PHRASE, { ...FIRST_READING, itemId: LEVEL_2, at: day(0), silent: true });
    const answered = evidenceFor({
      observation: { ...silent, selfReport: 'clean' },
      played: PHRASE,
      targetSkills: ['sight-reading'],
      vocabulary: VOCABULARY_V0,
    })[0] as Evidence;
    expect(answered.kind).toBe('self-assessed');
    const reading = ladderState({ evidence: [answered, answered], exposures: [day(0)], today });
    expect(reading.state).toBe('introduced');
    expect(reading.selfAssessed).toHaveLength(2);
  });
});

describe('proficient, and falling back', () => {
  it('one day at the full standard is familiar; two different days, the latest supporting, is proficient', () => {
    expect(ladderState({ evidence: [read(day(0))], today }).state).toBe('familiar');
    expect(ladderState({ evidence: [read(day(0)), read(day(0, 18))], today }).state, 'two runs on one day').toBe('familiar');
    expect(ladderState({ evidence: [read(day(0)), read(day(1))], today }).state).toBe('proficient');
  });

  it('one full-standard attempt against it keeps proficient; two in a row put it back to familiar', () => {
    const shown = [read(day(0)), read(day(1))];
    expect(ladderState({ evidence: [...shown, read(day(2), BADLY)], today }).state).toBe('proficient');
    expect(ladderState({ evidence: [...shown, read(day(2), BADLY), read(day(3), BADLY)], today }).state).toBe('familiar');
    // And it is shown again from there: two more days.
    const back = [...shown, read(day(2), BADLY), read(day(3), BADLY), read(day(4))];
    expect(ladderState({ evidence: back, today }).state).toBe('familiar');
    expect(ladderState({ evidence: [...back, read(day(5))], today }).state).toBe('proficient');
  });

  it('time alone lowers nothing: evidence weeks old keeps its state and says it has not been shown recently', () => {
    const shown = [read(day(0)), read(day(1))];
    const now = ladderState({ evidence: shown, today: new Date(day(2)) });
    const later = ladderState({ evidence: shown, today: new Date(day(1 + RETENTION_DAYS + 19)) });
    expect(later.state).toBe(now.state);
    expect(now.notShownRecently).toBe(false);
    expect(later.notShownRecently).toBe(true);
  });
});

describe('transfer needs unfamiliar material; retained needs a later day', () => {
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
    expect(ladderState({ evidence: [...shown(), read(day(2), { itemId: LEVEL_4 })], today }).state, 'another row, no facts: unknown').toBe('proficient');
    // Not on material met before. Revised (C3 second pass, reviewer decision
    // 3): this asserted that a heard phrase was practice-standard evidence of
    // sight-reading. A phrase heard before is no evidence of reading at any
    // standard: the run is refused, citing the record's `unseen`, and the
    // ladder has nothing from it.
    const heard = observe(PHRASE, { ...FIRST_READING, itemId: LEVEL_4, at: day(2), unseen: false });
    const [seenBefore] = evidenceFor({ observation: heard, played: PHRASE, targetSkills: ['sight-reading'], vocabulary: VOCABULARY_V0 });
    expect(seenBefore, 'a phrase heard before still gave sight-reading evidence').toMatchObject({
      kind: 'refusal',
      reason: 'condition:unseen',
      cites: ['unseen'],
    });
    expect(ladderState({ evidence: shown(), today }).state).toBe('proficient');
  });

  // G2a (the G2 review's required change): another cut of a composition the learner has played is
  // not an independent context the relationship can vouch for. The earlier cut's run is in the store
  // (so the relationship names it) and is no evidence of reading here — in the shipped app only the
  // reading rows are — so this learner's only transfer-quality read is the related one.
  const CUT_25_32: Identity = { kind: 'file', sha256: 'c'.repeat(64) };
  const ANH_113 = { key: 'work:anh113', playedAs: ['excerpt.anh113.1-8'] };
  const relatedRead = (at: string, plan: RunPlan & { wrongSteps?: number[] } = {}, composition: typeof ANH_113 | null = ANH_113): Evidence =>
    withFacts(read(at, { itemId: 'excerpt.anh113.25-32', ...plan }), { seed: 0, material: CUT_25_32, differs: ['key'], ...(composition === null ? {} : { composition }) });

  it('a first reading of another cut of a piece already played, another key measured, is not transfer demonstrated: the composition fails closed', () => {
    const related = ladderState({ evidence: [...shown(), relatedRead(day(2))], today });
    expect(related.state, 'a related cut read as transfer').toBe('proficient');
    expect(related.transfer).toBe(false);
    expect(related.transferScope).toEqual([]);
    // The same read with no composition fact is transfer, on the key: the gate is that fact alone.
    const unrelated = ladderState({ evidence: [...shown(), relatedRead(day(2), {}, null)], today });
    expect(unrelated.state).toBe('transfer demonstrated');
    expect(unrelated.transferScope).toEqual([{ on: ['key'], since: day(2) }]);
  });

  it('two bad first readings of another cut of a piece already played count, as any unknown reading does: back to familiar', () => {
    const failed = [...shown(), relatedRead(day(2), BADLY), relatedRead(day(3), BADLY)];
    expect(ladderState({ evidence: failed, today }).state, 'a related cut spared as a stretch').toBe('familiar');
    // Without the composition fact the measured key is a stretch, and the two are spared.
    const stretched = [...shown(), relatedRead(day(2), BADLY, null), relatedRead(day(3), BADLY, null)];
    expect(ladderState({ evidence: stretched, today }).state).toBe('proficient');
  });

  it(`retained is a first attempt of a day, supporting, ${String(RETENTION_DAYS)} days or more after the last support`, () => {
    const transferred = [...shown(), transferRead(day(2))];
    const tooSoon = read(day(2 + RETENTION_DAYS - 1));
    expect(ladderState({ evidence: [...transferred, tooSoon], today }).state).toBe('transfer demonstrated');
    const later = read(day(2 + RETENTION_DAYS));
    const retainedState = ladderState({ evidence: [...transferred, later], today });
    expect(retainedState.state).toBe('mastered');
    expect(retainedState.retained).toBe(true);
    // A warm-up that failed first and a success later the same day is not retention.
    const warmUp = [read(day(2 + RETENTION_DAYS), BADLY), read(day(2 + RETENTION_DAYS, 18))];
    expect(ladderState({ evidence: [...transferred, ...warmUp], today }).retained).toBe(false);
  });

  it(`mastered needs no full-standard attempt against it among the last ${String(RECENT_ATTEMPTS)}`, () => {
    const retained = [...shown(), transferRead(day(2)), read(day(2 + RETENTION_DAYS))];
    expect(ladderState({ evidence: retained, today }).state).toBe('mastered');
    const slip = read(day(3 + RETENTION_DAYS), BADLY);
    expect(ladderState({ evidence: [...retained, slip], today }).state).toBe('retained');
    const recovered = read(day(4 + RETENTION_DAYS));
    expect(ladderState({ evidence: [...retained, slip, recovered], today }).state, 'one slip is still within the last two').toBe(
      'retained',
    );
    expect(ladderState({ evidence: [...retained, slip, recovered, read(day(5 + RETENTION_DAYS))], today }).state).toBe('mastered');
  });
});

/**
 * The brief's check (When to deviate): two constructed histories, and the
 * state the moves as written give each. What a teacher would say is written
 * beside the assertion; both are asserted as they are, so a change to the
 * moves shows up here.
 */
describe('two histories a teacher can read', () => {
  // Revised (G2): the harder row's read carries its facts, as `recordRun` writes them — another rhythm measured.
  it('the steady reader: five first readings on five days, then a harder row first time — transfer demonstrated', () => {
    const history = [
      ...Array.from({ length: 5 }, (_, n) => withFacts(read(day(n), { seed: n }), { seed: n })),
      withFacts(read(day(5), { itemId: LEVEL_4 }), { seed: 5, recipe: LEVEL_4_RECIPE, differs: ['rhythm'] }),
    ];
    // A teacher: "reads level-2 phrases reliably, and read a harder one at
    // sight" — proficient, and shown on material it had not met. Recognisable.
    expect(ladderState({ evidence: history, today: new Date(day(6)) }).state).toBe('transfer demonstrated');
  });

  // Revised (G2): the level-4 reads carry their facts — another rhythm measured, and a demand the
  // level-2 reads never carried — and the policy spares them; without the facts, nothing is spared.
  it('the stretch: proficient at level 2, then two first readings of level 4 that go badly — still proficient', () => {
    const history = [
      withFacts(read(day(0)), { seed: 0 }),
      withFacts(read(day(1)), { seed: 1 }),
      withFacts(read(day(2)), { seed: 2 }),
      withFacts(read(day(3), { itemId: LEVEL_4, ...BADLY }), { seed: 3, recipe: LEVEL_4_RECIPE, differs: ['rhythm'] }),
      withFacts(read(day(4), { itemId: LEVEL_4, ...BADLY }), { seed: 4, recipe: LEVEL_4_RECIPE, differs: [], extraDemands: ['rhythm.dotted-quarter'] }),
    ];
    // A teacher: "still reads level 2; level 4 is a stretch for now". Revised
    // (C3 second pass): the moves as first written said familiar, because two
    // attempts against in a row counted whatever material they were on. Now an
    // attempt against on first contact with material other than where
    // proficiency was shown does not count towards moving down
    // (`countsTowardsMovingDown`, a hypothesis): it is evidence about the new
    // material, and it is not transfer.
    const reading = ladderState({ evidence: history, today: new Date(day(5)) });
    expect(reading.state, 'a stretch onto harder material took the skill back to familiar').toBe('proficient');
    expect(reading.transfer).toBe(false);
    // The same two failures with no facts on them: unknown, never guessed into protection.
    const bare = [read(day(0)), read(day(1)), read(day(2)), read(day(3), { itemId: LEVEL_4, ...BADLY }), read(day(4), { itemId: LEVEL_4, ...BADLY })];
    expect(ladderState({ evidence: bare, today: new Date(day(5)) }).state).toBe('familiar');
  });
});
