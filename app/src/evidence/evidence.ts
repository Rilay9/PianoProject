/**
 * The evidence function (C3; design 2026-09-26 §4): what one observation
 * supports about one skill, and nothing more.
 *
 * > An observation is evidence about a skill only through a measurement named
 * > in the skill's definition, taken in that run, under the conditions the
 * > definition names, at the places where the notation actually played
 * > contains the demand the skill exercises.
 *
 * `evidenceFor` takes the observation, the notation actually played, the
 * skills the item (or its use) declares, and the vocabulary, and returns one
 * result per declared skill: an `Evidence` record, or a `Refusal` saying which
 * part of the rule failed. It has no parameter for the item's level, rung or
 * tags, and it never looks past the declared skills: a skill nobody declared
 * gets nothing, whatever the notation contains.
 *
 * **What this machinery can and cannot do.** It enforces evidentiary honesty:
 * nothing supports a skill except a channel the run measured, under the
 * skill's conditions, at the steps where its demand is. It does not prove that
 * the channel shows the skill — right notes in a fixed position are what a
 * note-namer plays as well as an interval-reader (the reviewer's principle,
 * `audit-2026-09-25-outside.md` Part 7). That still needs constructed
 * material, conditions, adversarial tests and a musician.
 *
 * The rule's five parts, in the order a refusal is decided:
 *
 * 1. **Target.** Only `targetSkills`; an id the vocabulary lacks is refused.
 * 2. **Channel.** Every channel of the skill's `observable` was measured
 *    (`measurement.ts`). `observable: none` is refused outright.
 * 3. **Conditions.** The run meets the skill's full standard, else its
 *    practice standard, else it is refused with the first practice condition
 *    it missed. The conditions and their meaning are the vocabulary's
 *    (`skills.json`); `CONDITION_MET` reads the field each one's `recordedBy`
 *    names, and a test holds the two together.
 * 4. **Opportunity.** The skill's demands (or every step) inside the steps the
 *    run covered, in the hands it played.
 * 5. **Precision** (timing skills, reviewer decision 6): the window must be
 *    narrower than the error the skill is about, at the run's tempo.
 *
 * Then **attribution**: `n` counts the opportunity steps the channels
 * measured, and `right` those right on every channel. A self-reported run is
 * evidence of the class `self-assessed`, which no requirement accepts.
 */
import type { ConditionId, Skill } from '../demands/vocabulary';
import { detect } from '../demands/detect';
import type { ScoreModelData, ScoreNote } from '../score/types';
import { isMeasurement, codeAt, takeMeasurements, type Measurement, type Observed } from './measurement';
import type { Vocabulary } from './vocabulary';

export type Standard = 'practice' | 'full';

/** Why a declared skill got no evidence from this run. The names are C3's. */
export type RefusalReason =
  | 'unknown-skill'
  | 'not-measured:observable'
  | 'not-measured:pitch'
  | 'not-measured:timing'
  | `condition:${ConditionId}`
  | 'no-opportunity'
  | 'precision';

export interface Refusal {
  kind: 'refusal';
  skill: string;
  reason: RefusalReason;
  /** The observation fields the refusal read: what the sheet's line is about. */
  cites: string[];
  /** A word more, for a reader: `wait`, `rhythm-only`, `compacted`, `R`, … */
  detail?: string;
}

/** What the evidence says about where it came from, for the ladder's transfer and retention. */
export interface EvidenceContext {
  itemId: string;
  seed?: number;
  /** A generated phrase read for the first time (`unseen: true`): first contact with the material. */
  firstContact: boolean;
  /** Of the conditions the skill's standards name, those this run met. */
  met: ConditionId[];
  /** Opportunity steps counted in `n` whose own note the record cannot tell right from wrong (a chord partly missed). */
  unattributed: number;
  /** The pitch was the microphone's estimate. */
  estimated: boolean;
}

declare const EVIDENCE: unique symbol;

/** Evidence from a measurement: the only class a requirement can accept. */
export interface MeasuredEvidence {
  readonly [EVIDENCE]: 'measured';
  kind: 'measured';
  skill: string;
  /** `SessionRow.id`; `null` for a run not yet stored (the summary sheet's own run). */
  observationId: number | null;
  standard: Standard;
  /** Opportunity steps the skill's channels measured. */
  n: number;
  /** Of those, the steps right on every channel. */
  right: number;
  /** When the run was (`SessionRow.at`). */
  at: string;
  context: EvidenceContext;
}

/** The learner's own word about a run nothing measured (design §5): shown apart, accepted by no requirement. */
export interface SelfAssessedEvidence {
  readonly [EVIDENCE]: 'self-assessed';
  kind: 'self-assessed';
  skill: string;
  observationId: number | null;
  report: 'rough' | 'ok' | 'clean';
  at: string;
  context: Pick<EvidenceContext, 'itemId' | 'seed'>;
}

export type Evidence = MeasuredEvidence | SelfAssessedEvidence;
export type EvidenceResult = Evidence | Refusal;

export function isRefusal(result: EvidenceResult): result is Refusal {
  return result.kind === 'refusal';
}

// --- conditions ----------------------------------------------------------------

/**
 * Whether a run met each vocabulary condition, read from the field that
 * condition's `recordedBy` names in `skills.json` (item 7). Keyed by the
 * vocabulary's own ids, so a condition added there without a reader here is a
 * type error, not a silent pass.
 */
export const CONDITION_MET: Readonly<Record<ConditionId, { field: string; met: (o: Observed) => boolean }>> = {
  'keep-tempo': { field: 'SessionRow.mode', met: (o) => o.mode === 'tempo' && o.tempoMeasured !== false },
  unseen: { field: 'SessionRow.unseen', met: (o) => o.unseen === true },
  'guide-off': { field: 'SessionRow.keys.guide', met: (o) => o.keys?.guide === 'off' },
  'both-hands': { field: 'SessionRow.hands.played', met: (o) => o.hands?.played === 'both' },
};

/** The observation field a condition's refusal cites, in the row's own spelling. */
const CONDITION_CITES: Readonly<Record<ConditionId, string[]>> = {
  'keep-tempo': ['mode', 'tempoMeasured'],
  unseen: ['unseen'],
  'guide-off': ['keys.guide'],
  'both-hands': ['hands.played'],
};

// --- timing precision (reviewer decision 6, S21) ----------------------------------

/**
 * The error each v0 timing skill is about, in quarter-note beats: the
 * smallest distance between where the written rhythm puts a note and where the
 * likely wrong rhythm puts it. A window as wide as this or wider records the
 * wrong rhythm as hits, so the measurement cannot tell them apart and the
 * skill gets no evidence (`precision`). The global window is not changed.
 *
 * - **triplets** `1/12`: triplet eighths at 0, 1/3, 2/3 of a beat against the
 *   rushed sixteenth-sixteenth-eighth at 0, 1/4, 1/2 (design §4's case):
 *   the second note is 1/12 of a beat early, the third 1/6.
 * - **subdivision** `1/6`: two even eighths against the same pair played
 *   long-short as a swing, the second at 2/3 of the beat.
 * - **6/8** `1/4`: the compound lilt, a quarter then an eighth (0 and 1 in
 *   quarters), evened into two dotted eighths (0 and 3/4).
 * - **dotted-quarter**, **syncopation**, **tie** `1/2`: the note after the dot
 *   placed on the beat, an off-beat note moved onto the beat, the tie cut short
 *   by its written part: each a displacement of an eighth.
 *
 * Skills whose rhythm is the whole phrase's (`every-step` opportunity, or a
 * texture: sight-reading, hand-independence) take, step by step, the finest
 * of these among the rhythm demands located at that step, and an eighth where
 * none is; the steps the window cannot resolve are left out of their count.
 */
export const TIMING_PRECISION_QUARTERS = {
  triplets: 1 / 12,
  subdivision: 1 / 6,
  '6/8': 1 / 4,
  'dotted-quarter': 1 / 2,
  syncopation: 1 / 2,
  tie: 1 / 2,
} as const;

/** The same table, read by any skill id: `undefined` for a skill with no rhythm of its own. */
const PRECISION_BY_SKILL: Readonly<Record<string, number | undefined>> = TIMING_PRECISION_QUARTERS;

/** The coarsest error any rhythm has: a note moved by an eighth. */
export const DEFAULT_PRECISION_QUARTERS = 1 / 2;

/** Milliseconds per quarter at a beat of the played notation, at the run's tempo. */
export function msPerQuarterAt(model: ScoreModelData, beat: number, tempoPct: number): number {
  let bpm = model.tempoMap[0]?.bpm ?? 120;
  for (const entry of model.tempoMap) {
    if (entry.atBeat <= beat) bpm = entry.bpm;
    else break;
  }
  const scale = tempoPct > 0 ? tempoPct / 100 : 1;
  return 60_000 / (bpm * scale);
}

// --- opportunity ------------------------------------------------------------------

function notesById(model: ScoreModelData): Map<string, ScoreNote> {
  const out = new Map<string, ScoreNote>();
  for (const step of model.steps) for (const note of step.notes) out.set(note.id, note);
  return out;
}

/** Whether the learner played this note: the hand filter the run was under. */
function handPlayed(note: ScoreNote | undefined, played: 'R' | 'L' | 'both' | undefined): boolean {
  if (!note) return false;
  if (played === undefined || played === 'both') return true;
  return note.hand === played;
}

/** The learner's notes at a step, in the hands played (grace notes are never judged). */
function learnerNotesAt(model: ScoreModelData, step: number, played: 'R' | 'L' | 'both' | undefined): ScoreNote[] {
  return (model.steps[step]?.notes ?? []).filter((note) => note.graceNote !== true && handPlayed(note, played));
}

/**
 * The skill's opportunity steps: its demands (or every step with a note for
 * the learner), at the steps `inRun` accepts, in the hands the run played.
 */
function opportunitySteps(
  skill: Skill,
  inRun: (step: number) => boolean,
  played: 'R' | 'L' | 'both' | undefined,
  model: ScoreModelData,
  vocabulary: Vocabulary,
): number[] {
  if (skill.opportunity === 'every-step') {
    return model.steps
      .map((step) => step.index)
      .filter((step) => inRun(step) && learnerNotesAt(model, step, played).length > 0);
  }
  const byId = notesById(model);
  const found = new Set<number>();
  for (const demandId of skill.opportunity) {
    const demand = vocabulary.demands.find((d) => d.id === demandId);
    if (!demand) continue;
    for (const at of detect(model, demand.detector).at) {
      if (inRun(at.step) && handPlayed(byId.get(at.noteId), played)) found.add(at.step);
    }
  }
  return [...found].sort((a, b) => a - b);
}

/** A measured run's steps: inside its codes, with something for the learner, reached. */
function measuredRun(observation: Observed): (step: number) => boolean {
  return (step) => {
    const code = codeAt(observation, step);
    return code !== null && code !== '-' && code !== '.';
  };
}

/**
 * A run nothing measured keeps no per-step codes, so its steps are the printed
 * bars it covered (`range`), or the whole notation where the row has none.
 */
function coveredRun(observation: Observed, model: ScoreModelData): (step: number) => boolean {
  const range = observation.range;
  return (step) => {
    const at = model.steps[step];
    return at !== undefined && (range === undefined || (at.sourceMeasureIndex >= range.fromMeasure && at.sourceMeasureIndex <= range.toMeasure));
  };
}

/**
 * The error, in quarters, a timing skill must see at one step: its own
 * (`TIMING_PRECISION_QUARTERS`), or for a skill whose rhythm is the phrase's
 * the finest of the rhythm demands located at that step, and an eighth where
 * none is.
 */
function precisionQuartersAt(skill: Skill, rhythmAt: ReadonlyMap<number, number>, step: number): number {
  return PRECISION_BY_SKILL[skill.id] ?? Math.min(DEFAULT_PRECISION_QUARTERS, rhythmAt.get(step) ?? DEFAULT_PRECISION_QUARTERS);
}

/** Step -> the finest precision any rhythm demand located there asks for. */
function rhythmPrecisionByStep(model: ScoreModelData, vocabulary: Vocabulary): Map<number, number> {
  const out = new Map<number, number>();
  for (const demand of vocabulary.demands) {
    const quarters = PRECISION_BY_SKILL[demand.copedWithBy];
    if (quarters === undefined) continue;
    for (const at of detect(model, demand.detector).at) {
      out.set(at.step, Math.min(out.get(at.step) ?? Infinity, quarters));
    }
  }
  return out;
}

/**
 * Whether the run's window can tell the skill's rhythm from its error at a
 * step: narrower than the error at the tempo the run kept there. The engine
 * counts a note on the window's edge as in, so equal is not narrower.
 */
export function windowDiscriminates(
  windowMs: number,
  quarters: number,
  model: ScoreModelData,
  step: number,
  tempoPct: number,
): boolean {
  const onset = model.steps[step]?.onset ?? 0;
  return windowMs < quarters * msPerQuarterAt(model, onset, tempoPct);
}

// --- the function -------------------------------------------------------------------

function refuse(skill: string, reason: RefusalReason, cites: string[], detail?: string): Refusal {
  return { kind: 'refusal', skill, reason, cites, ...(detail === undefined ? {} : { detail }) };
}

/** The one constructor of measured evidence: from measurements, and nothing else. */
function evidenceFrom(
  measurements: readonly Measurement[],
  skill: Skill,
  observation: Observed,
  steps: readonly number[],
  standard: Standard,
  met: ConditionId[],
  model: ScoreModelData,
  at: string,
): MeasuredEvidence {
  let n = 0;
  let right = 0;
  let unattributed = 0;
  const played = observation.hands?.played;
  for (const step of steps) {
    const here = measurements.map((m) => m.at.get(step));
    if (here.every((measure) => measure === undefined)) continue;
    n += 1;
    if (here.every((measure) => measure?.right === true)) right += 1;
    else if (here.some((measure) => measure?.mixed === true) && learnerNotesAt(model, step, played).length > 1) {
      unattributed += 1;
    }
  }
  return {
    kind: 'measured',
    skill: skill.id,
    observationId: observation.id ?? null,
    standard,
    n,
    right,
    at,
    context: {
      itemId: observation.itemId,
      ...(observation.seed === undefined ? {} : { seed: observation.seed }),
      firstContact: observation.unseen === true,
      met,
      unattributed,
      estimated: measurements.some((m) => m.estimated),
    },
  } as unknown as MeasuredEvidence;
}

function selfAssessed(skill: Skill, observation: Observed, report: 'rough' | 'ok' | 'clean', at: string): SelfAssessedEvidence {
  return {
    kind: 'self-assessed',
    skill: skill.id,
    observationId: observation.id ?? null,
    report,
    at,
    context: { itemId: observation.itemId, ...(observation.seed === undefined ? {} : { seed: observation.seed }) },
  } as unknown as SelfAssessedEvidence;
}

export interface EvidenceInput {
  /** One stored observation (a `SessionRow`), or the run a screen is about to store. */
  observation: Observed;
  /** The notation actually played: the phrase this seed generated, the file, the slice. */
  played: ScoreModelData;
  /** The skills the item, or the rung's use of it, declares. Nothing else is considered. */
  targetSkills: readonly string[];
  vocabulary: Vocabulary;
  /** When the run was, for a run not yet stored; a stored row's own `at` wins. */
  now?: Date;
}

/**
 * One result per declared skill: evidence, or the refusal that says which part
 * of the rule failed. Pure: the same input gives the same answer.
 */
export function evidenceFor(input: EvidenceInput): EvidenceResult[] {
  const { observation, played, vocabulary } = input;
  const at = observation.at ?? (input.now ?? new Date()).toISOString();
  const readings = takeMeasurements(observation);
  const results: EvidenceResult[] = [];
  for (const id of [...new Set(input.targetSkills)]) {
    const skill = vocabulary.skills.find((candidate) => candidate.id === id);
    if (!skill) {
      results.push(refuse(id, 'unknown-skill', []));
      continue;
    }
    results.push(evidenceForSkill(skill, observation, played, vocabulary, readings, at));
  }
  return results;
}

function evidenceForSkill(
  skill: Skill,
  observation: Observed,
  model: ScoreModelData,
  vocabulary: Vocabulary,
  readings: ReturnType<typeof takeMeasurements>,
  at: string,
): EvidenceResult {
  if (skill.observable === 'none') return refuse(skill.id, 'not-measured:observable', [], 'observable none');

  // A run nothing measured, answered by the learner (design §5): their word,
  // in its own class, where the demand is in what they played.
  const answered = observation.selfReport;
  const nothingMeasured = !isMeasurement(readings.pitch) && !isMeasurement(readings.timing);
  if (answered !== undefined && nothingMeasured) {
    const steps = opportunitySteps(skill, coveredRun(observation, model), observation.hands?.played, model, vocabulary);
    if (steps.length === 0) return refuse(skill.id, 'no-opportunity', ['range', 'hands.played']);
    return selfAssessed(skill, observation, answered, at);
  }

  // 2. The channels.
  const measurements: Measurement[] = [];
  for (const channel of skill.observable) {
    const reading = readings[channel];
    if (!isMeasurement(reading)) {
      return refuse(skill.id, `not-measured:${channel}`, reading.cites, reading.why);
    }
    measurements.push(reading);
  }

  // 3. The conditions: the full standard, else the practice one.
  const named = [...new Set([...skill.standards.practice, ...skill.standards.full])];
  const met = named.filter((condition) => CONDITION_MET[condition].met(observation));
  const meets = (conditions: readonly ConditionId[]): boolean => conditions.every((c) => met.includes(c));
  const standard: Standard | null = meets(skill.standards.full) ? 'full' : meets(skill.standards.practice) ? 'practice' : null;
  if (standard === null) {
    const first = skill.standards.practice.find((c) => !met.includes(c)) as ConditionId;
    const detail = first === 'both-hands' ? observation.hands?.played : undefined;
    return refuse(skill.id, `condition:${first}`, CONDITION_CITES[first], detail);
  }

  // 4. The opportunity, inside the run and the hands it played.
  let steps = opportunitySteps(skill, measuredRun(observation), observation.hands?.played, model, vocabulary);
  if (steps.length === 0) return refuse(skill.id, 'no-opportunity', ['steps', 'hands.played']);

  // 5. Precision, for a skill timed at all: only the steps where the window
  // can tell the rhythm from its error count; none, and it is refused.
  const timing = measurements.find((m) => m.channel === 'timing');
  if (timing) {
    const window = timing.toleranceMs;
    if (window === null) return refuse(skill.id, 'precision', ['input.toleranceMs'], 'window not recorded');
    const rhythmAt = rhythmPrecisionByStep(model, vocabulary);
    steps = steps.filter((step) =>
      windowDiscriminates(window, precisionQuartersAt(skill, rhythmAt, step), model, step, observation.tempoPct),
    );
    if (steps.length === 0) return refuse(skill.id, 'precision', ['input.toleranceMs', 'tempoPct'], `${String(window)} ms`);
  }

  // Attribution: only the opportunity steps count.
  const evidence = evidenceFrom(measurements, skill, observation, steps, standard, met, model, at);
  if (evidence.n === 0) {
    // Every opportunity step fell where the channel measured nothing (a note
    // never played has no onset to time).
    const channel = timing ? 'timing' : 'pitch';
    return refuse(skill.id, `not-measured:${channel}`, ['steps'], 'no opportunity step measured');
  }
  return evidence;
}
