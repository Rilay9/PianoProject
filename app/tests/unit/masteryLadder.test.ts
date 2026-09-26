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
 */
import { describe, expect, it } from 'vitest';
import { phrase, line } from './helpers/phrase';
import { observe, type RunPlan } from './helpers/observed';
import { evidenceFor, type Evidence, type EvidenceResult } from '../../src/evidence/evidence';
import { ladderState, RETENTION_DAYS, RECENT_ATTEMPTS, SUPPORT_SHARE } from '../../src/evidence/ladder';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { DEFAULT_MASTERY } from '../../src/engine/Scoring';
import { REVIEW_INTERVALS_DAYS } from '../../src/data/progressStore';

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

describe('the numbers are named and are what the design says they are', () => {
  it('21 days is the review calendar’s last step; two recent attempts; supporting is Part G’s pass share', () => {
    expect(RETENTION_DAYS).toBe(REVIEW_INTERVALS_DAYS[REVIEW_INTERVALS_DAYS.length - 1]);
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
  const shown = (): Evidence[] => [read(day(0)), read(day(1))];

  it('another phrase of the same row is not transfer; a first reading of another row is', () => {
    expect(ladderState({ evidence: [...shown(), read(day(2), { seed: 99 })], today }).state).toBe('proficient');
    const other = read(day(2), { itemId: LEVEL_4 });
    expect(ladderState({ evidence: [...shown(), other], today }).state).toBe('transfer demonstrated');
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

  it(`retained is a first attempt of a day, supporting, ${String(RETENTION_DAYS)} days or more after the last support`, () => {
    const transferred = [...shown(), read(day(2), { itemId: LEVEL_4 })];
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
    const retained = [...shown(), read(day(2), { itemId: LEVEL_4 }), read(day(2 + RETENTION_DAYS))];
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
  it('the steady reader: five first readings on five days, then a harder row first time — transfer demonstrated', () => {
    const history = [
      ...Array.from({ length: 5 }, (_, n) => read(day(n), { seed: n })),
      read(day(5), { itemId: LEVEL_4 }),
    ];
    // A teacher: "reads level-2 phrases reliably, and read a harder one at
    // sight" — proficient, and shown on material it had not met. Recognisable.
    expect(ladderState({ evidence: history, today: new Date(day(6)) }).state).toBe('transfer demonstrated');
  });

  it('the stretch: proficient at level 2, then two first readings of level 4 that go badly — still proficient', () => {
    const history = [
      read(day(0)),
      read(day(1)),
      read(day(2)),
      read(day(3), { itemId: LEVEL_4, ...BADLY }),
      read(day(4), { itemId: LEVEL_4, ...BADLY }),
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
  });
});
