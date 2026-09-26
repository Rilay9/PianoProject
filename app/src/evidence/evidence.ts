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
 *
 * **Per demand, with the overlap kept** (C4a; backlog L64; the reviewer's
 * Part 8). The same counted steps are split by demand: for each demand the
 * skill names (every vocabulary demand, for a skill read over every step) that
 * the played passage contains at those steps, `byDemand` keeps how many of its
 * opportunities could be told right or wrong, how many were right, and which
 * steps they were. A step that is an opportunity for several demands counts
 * under each. Where every other demand sits on those steps is kept too (the
 * entries' own steps, and `otherDemands` for the demands a skill with a list
 * does not count), so `overlapOf` can say which other demands shared a
 * demand's steps and a reader can tell a failure on the demand's own notes
 * from one shared with others. Each (demand, step) is stored once: the overlap
 * stored beside every entry made the evidence several times the observation
 * it came from. Nothing says which demand caused a miss: one wrong note
 * at a skip, in the left hand, during eighths, is wrong under all three, and
 * the record cannot know more. Where a demand sits on some notes of a step
 * that went partly wrong, its note cannot be told (the record keeps the step's
 * code, not which pitch was missed): the step is left out of that demand's
 * count and listed as `unattributed`. The skill's own `n` and `right` are
 * unchanged, and the ladder reads only them.
 *
 * **Its own version** (L66). `EVIDENCE_DEFINITIONS` names this module's rules
 * and shape; the record call stamps it on the row beside the evidence
 * (`SessionRow.evidenceDefinitions`), independent of the observation's
 * `definitions`. `recomputeEvidence` gives what the record call would store
 * today, for a later job that holds the played model.
 */
import type { ConditionId, Skill } from '../demands/vocabulary';
import { detect, type DemandAt } from '../demands/detect';
import type { ScoreModelData, ScoreNote } from '../score/types';
import { isMeasurement, codeAt, takeMeasurements, type Measurement, type Observed, type StepMeasure } from './measurement';
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

/**
 * The evidence's own definitions: the rules above and the shape they write
 * (C4a, L66). Stamped on a stored row as `evidenceDefinitions`; a reader takes
 * stored evidence only under the version in force. Independent of the
 * observation's `OBSERVATION_DEFINITIONS`: a change here moves this and not
 * that, and the other way round.
 *
 * - **1** — C3's evidence, as C4 stored it under the observation's
 *   `definitions` with no stamp of its own: per skill only.
 * - **2** — per-demand counts (`byDemand`) and where every other demand of
 *   the counted steps is (`otherDemands`), from which the overlap is derived
 *   (`overlapOf`); and the per-step verdicts they are told from
 *   (`StepMeasure.uniform`).
 */
export const EVIDENCE_DEFINITIONS = 2;

/** A demand at some steps: another demand on a demand's counted steps (`overlapOf`), or one a skill does not count (`otherDemands`). */
export interface DemandOverlap {
  /** A vocabulary demand id. */
  demand: string;
  /** The steps, ascending. */
  steps: number[];
}

/**
 * One demand's share of a skill's evidence (C4a): its opportunities in the
 * counted steps, told right or wrong by the skill's channels. Keyed by the
 * vocabulary's demand id, never by anything a reader controls.
 */
export interface DemandCount {
  /** A vocabulary demand id. */
  demand: string;
  /** Its opportunity steps the run measured whose right or wrong the record can tell. */
  n: number;
  /** Of those, the steps right on every channel of the skill. */
  right: number;
  /** The `n` steps (model step indexes), ascending: what a later reader audits against the record. */
  steps: number[];
  /** Of `steps`, those not right. */
  wrong: number[];
  /** Measured steps where the demand sat on some notes of a step partly wrong: counted in the skill's `n`, not here. */
  unattributed?: number[];
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
  /**
   * The same steps per demand, in the vocabulary's order: each demand the
   * skill names (every one, for a skill read over every step) with a measured
   * opportunity here. A demand with none is absent.
   */
  byDemand: DemandCount[];
  /**
   * The vocabulary demands the skill does not count, located on its counted
   * steps in the hands played (absent where there are none, and always for a
   * skill read over every step, whose entries hold every demand): with
   * `byDemand`, where every demand of those steps is, so the overlap can be
   * derived (`overlapOf`) rather than stored beside every entry. A fact about
   * the notation, never a cause.
   */
  otherDemands?: DemandOverlap[];
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
  located: Located,
): number[] {
  if (skill.opportunity === 'every-step') {
    return model.steps
      .map((step) => step.index)
      .filter((step) => inRun(step) && learnerNotesAt(model, step, played).length > 0);
  }
  const byId = notesById(model);
  const found = new Set<number>();
  for (const demandId of skill.opportunity) {
    for (const at of located.get(demandId) ?? []) {
      if (inRun(at.step) && handPlayed(byId.get(at.noteId), played)) found.add(at.step);
    }
  }
  return [...found].sort((a, b) => a - b);
}

/**
 * Every vocabulary demand's places in the played notation, by demand id: one
 * pass over the detectors per run, shared by every skill's opportunity, the
 * precision rule and the per-demand counts (C3 ran the detectors per skill).
 * A demand the vocabulary names whose detector finds nothing maps to an empty
 * list; an id the vocabulary does not name is not a key.
 */
type Located = ReadonlyMap<string, readonly DemandAt[]>;

function locateDemands(model: ScoreModelData, vocabulary: Vocabulary): Located {
  const out = new Map<string, readonly DemandAt[]>();
  for (const demand of vocabulary.demands) out.set(demand.id, detect(model, demand.detector).at);
  return out;
}

/**
 * Where the demands are, step by step, in the hands the run played: step ->
 * demand id -> the note ids it is located at. What the per-demand counts and
 * the overlap read. `order` is the vocabulary's order of demand ids.
 */
interface DemandsAtSteps {
  byStep: ReadonlyMap<number, ReadonlyMap<string, ReadonlySet<string>>>;
  order: readonly string[];
}

function demandsAtSteps(
  located: Located,
  model: ScoreModelData,
  played: 'R' | 'L' | 'both' | undefined,
  vocabulary: Vocabulary,
): DemandsAtSteps {
  const byId = notesById(model);
  const byStep = new Map<number, Map<string, Set<string>>>();
  for (const demand of vocabulary.demands) {
    for (const at of located.get(demand.id) ?? []) {
      if (!handPlayed(byId.get(at.noteId), played)) continue;
      const here = byStep.get(at.step) ?? new Map<string, Set<string>>();
      const notes = here.get(demand.id) ?? new Set<string>();
      notes.add(at.noteId);
      here.set(demand.id, notes);
      byStep.set(at.step, here);
    }
  }
  return { byStep, order: vocabulary.demands.map((demand) => demand.id) };
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
function rhythmPrecisionByStep(located: Located, vocabulary: Vocabulary): Map<number, number> {
  const out = new Map<number, number>();
  for (const demand of vocabulary.demands) {
    const quarters = PRECISION_BY_SKILL[demand.copedWithBy];
    if (quarters === undefined) continue;
    for (const at of located.get(demand.id) ?? []) {
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

/**
 * What one demand's notes at a step came to, by the skill's channels: right
 * where the step was right; wrong where the demand is on every note of the
 * step, or where every channel's verdict against it holds for every pitch
 * (all missed); otherwise not to be told from the record (a chord partly
 * wrong, or early at a note the record does not name).
 */
function toldAt(here: readonly (StepMeasure | undefined)[], onEveryNote: boolean): 'right' | 'wrong' | 'untold' {
  if (here.every((measure) => measure?.right === true)) return 'right';
  if (onEveryNote) return 'wrong';
  const against = here.filter((measure): measure is StepMeasure => measure !== undefined && !measure.right);
  return against.every((measure) => measure.uniform) ? 'wrong' : 'untold';
}

interface Tally {
  steps: number[];
  wrong: number[];
  unattributed: number[];
}

/**
 * The other demands on one demand's counted steps, with the steps they share,
 * in the vocabulary's order: derived from where each demand is in the
 * evidence (its entries' steps and unattributed steps, and `otherDemands`).
 * Which demands shared a wrong note is what tells a failure on a demand's own
 * notes from one mixed with others; it never says which caused it.
 */
export function overlapOf(evidence: MeasuredEvidence, demand: string, vocabulary: Vocabulary): DemandOverlap[] {
  const mine = new Set(evidence.byDemand.find((entry) => entry.demand === demand)?.steps ?? []);
  const where = new Map<string, number[]>();
  for (const entry of evidence.byDemand) where.set(entry.demand, [...entry.steps, ...(entry.unattributed ?? [])]);
  for (const other of evidence.otherDemands ?? []) where.set(other.demand, other.steps);
  return vocabulary.demands
    .map((d) => d.id)
    .filter((id) => id !== demand && where.has(id))
    .map((id) => ({ demand: id, steps: (where.get(id) ?? []).filter((step) => mine.has(step)).sort((a, b) => a - b) }))
    .filter((shared) => shared.steps.length > 0);
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
  where: DemandsAtSteps,
): MeasuredEvidence {
  let n = 0;
  let right = 0;
  let unattributed = 0;
  const played = observation.hands?.played;
  const named = skill.opportunity === 'every-step' ? null : new Set(skill.opportunity);
  const tallies = new Map<string, Tally>();
  const others = new Map<string, number[]>();
  for (const step of steps) {
    const here = measurements.map((m) => m.at.get(step));
    if (here.every((measure) => measure === undefined)) continue;
    n += 1;
    const learner = learnerNotesAt(model, step, played);
    if (here.every((measure) => measure?.right === true)) right += 1;
    else if (here.some((measure) => measure?.mixed === true) && learner.length > 1) {
      unattributed += 1;
    }
    // The same step, per demand the skill names (every demand, for a skill
    // read over every step): the counts are the skill's steps split, never a
    // second reading of the run.
    for (const [demand, notes] of where.byStep.get(step) ?? []) {
      if (named !== null && !named.has(demand)) {
        others.set(demand, [...(others.get(demand) ?? []), step]);
        continue;
      }
      const tally = tallies.get(demand) ?? { steps: [], wrong: [], unattributed: [] };
      const told = toldAt(here, learner.every((note) => notes.has(note.id)));
      if (told === 'untold') tally.unattributed.push(step);
      else {
        tally.steps.push(step);
        if (told === 'wrong') tally.wrong.push(step);
      }
      tallies.set(demand, tally);
    }
  }
  const byDemand: DemandCount[] = where.order
    .filter((demand) => tallies.has(demand))
    .map((demand) => {
      const tally = tallies.get(demand) as Tally;
      return {
        demand,
        n: tally.steps.length,
        right: tally.steps.length - tally.wrong.length,
        steps: tally.steps,
        wrong: tally.wrong,
        ...(tally.unattributed.length > 0 ? { unattributed: tally.unattributed } : {}),
      };
    });
  const otherDemands: DemandOverlap[] = where.order.filter((demand) => others.has(demand)).map((demand) => ({ demand, steps: others.get(demand) ?? [] }));
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
    byDemand,
    ...(otherDemands.length > 0 ? { otherDemands } : {}),
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
  const located = locateDemands(played, vocabulary);
  const where = demandsAtSteps(located, played, observation.hands?.played, vocabulary);
  const results: EvidenceResult[] = [];
  for (const id of [...new Set(input.targetSkills)]) {
    const skill = vocabulary.skills.find((candidate) => candidate.id === id);
    if (!skill) {
      results.push(refuse(id, 'unknown-skill', []));
      continue;
    }
    results.push(evidenceForSkill(skill, observation, played, vocabulary, readings, at, located, where));
  }
  return results;
}

/** What the record call stores on a row: the results, stamped with the evidence's own version. */
export interface StoredEvidence {
  evidence: EvidenceResult[];
  evidenceDefinitions: number;
}

/** The results as a row keeps them: the one place the stamp is put on. */
export function stampedEvidence(evidence: EvidenceResult[]): StoredEvidence {
  return { evidence, evidenceDefinitions: EVIDENCE_DEFINITIONS };
}

/**
 * What the record call would store on this row today (L66): the evidence for
 * the skills the row's stored results name (or `targetSkills`, where the item's
 * declaration has changed since), from the row's own observation and the
 * notation played, stamped with the version in force. Pure. For a later job
 * that holds the played model — a generated phrase from its recipe and seed, a
 * file from the catalog — to refresh rows stored under another version;
 * nothing runs that job yet. `undefined` where there is no skill to evidence,
 * as the record call stores no evidence for an item that declares none.
 */
export function recomputeEvidence(
  row: Observed,
  played: ScoreModelData,
  vocabulary: Vocabulary,
  targetSkills?: readonly string[],
): StoredEvidence | undefined {
  const skills = targetSkills ?? [...new Set((row.evidence ?? []).map((result) => result.skill))];
  if (skills.length === 0) return undefined;
  return stampedEvidence(evidenceFor({ observation: row, played, targetSkills: skills, vocabulary }));
}

function evidenceForSkill(
  skill: Skill,
  observation: Observed,
  model: ScoreModelData,
  vocabulary: Vocabulary,
  readings: ReturnType<typeof takeMeasurements>,
  at: string,
  located: Located,
  where: DemandsAtSteps,
): EvidenceResult {
  if (skill.observable === 'none') return refuse(skill.id, 'not-measured:observable', [], 'observable none');

  // A run nothing measured, answered by the learner (design §5): their word,
  // in its own class, where the demand is in what they played.
  const answered = observation.selfReport;
  const nothingMeasured = !isMeasurement(readings.pitch) && !isMeasurement(readings.timing);
  if (answered !== undefined && nothingMeasured) {
    const steps = opportunitySteps(skill, coveredRun(observation, model), observation.hands?.played, model, located);
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
  let steps = opportunitySteps(skill, measuredRun(observation), observation.hands?.played, model, located);
  if (steps.length === 0) return refuse(skill.id, 'no-opportunity', ['steps', 'hands.played']);

  // 5. Precision, for a skill timed at all: only the steps where the window
  // can tell the rhythm from its error count; none, and it is refused.
  const timing = measurements.find((m) => m.channel === 'timing');
  if (timing) {
    const window = timing.toleranceMs;
    if (window === null) return refuse(skill.id, 'precision', ['input.toleranceMs'], 'window not recorded');
    const rhythmAt = rhythmPrecisionByStep(located, vocabulary);
    steps = steps.filter((step) =>
      windowDiscriminates(window, precisionQuartersAt(skill, rhythmAt, step), model, step, observation.tempoPct),
    );
    if (steps.length === 0) return refuse(skill.id, 'precision', ['input.toleranceMs', 'tempoPct'], `${String(window)} ms`);
  }

  // Attribution: only the opportunity steps count, per skill and per demand.
  const evidence = evidenceFrom(measurements, skill, observation, steps, standard, met, model, at, where);
  if (evidence.n === 0) {
    // Every opportunity step fell where the channel measured nothing (a note
    // never played has no onset to time).
    const channel = timing ? 'timing' : 'pitch';
    return refuse(skill.id, `not-measured:${channel}`, ['steps'], 'no opportunity step measured');
  }
  return evidence;
}
