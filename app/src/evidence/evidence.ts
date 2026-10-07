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
 *    names, and a test holds the two together. A note's name on the screen
 *    is supported reading (CL11b, L58): `names-off`, met only where the row
 *    records `keys.names === false`, stands beside every `guide-off` of a
 *    full standard.
 * 4. **Opportunity.** The skill's demands (or every step) inside the steps the
 *    run covered, in the hands it played.
 * 5. **Precision** (timing skills, reviewer decision 6): the window must be
 *    narrower than the error the skill is about, at the run's tempo. It is a
 *    refusal of the timing channel, step by step (CL04, L73): where the window
 *    cannot resolve a step, timing measures nothing there and pitch still
 *    counts; a skill whose window resolves no step is refused. The errors are
 *    the vocabulary's (`precision`, CL11b, L57), read from the vocabulary the
 *    function is handed.
 *
 * Then **attribution**: `n` counts the opportunity steps the channels
 * measured, and `right` those right on every channel that measured the step.
 * A self-reported run is evidence of the class `self-assessed`, which no
 * requirement accepts.
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
import { quartersOf, type Vocabulary } from './vocabulary';
import type { Identity } from '../review/record';
import type { Relationship } from '../curriculum/transfer';

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
  /**
   * The exact material the run played (E1 item 7; D4 item 2), D2's `Identity` as the run stored it
   * (`RunHeader.material`): a generated item's generator, a notated item's built file (an excerpt's
   * cut), a sight-reading phrase's complete generator identity. A stable reference, never a copied
   * catalogue object; absent on a legacy run. The transfer policy (G2, `transferPolicy.ts`) reads it
   * beside the establishing references': a new seed of material the skill was shown on is no transfer.
   */
  material?: Identity;
  /**
   * `transfer` where the run came from the session's transfer offer (D4 item 2): intent, never
   * evidence that anything transferred. The policy reads it only to say why a transfer-intended row
   * with no relationship is unknown (G68).
   */
  intent?: 'transfer';
  /**
   * First contact, the fact (G1a's relation): the run header's `firstContact`, copied as the run stored
   * it — never `unseen`, the phrase's sight-reading condition, and absent where the header's is absent
   * (a row from before G1a, or a drill or paper run), never rebuilt from `unseen`, the item's identity or
   * the encounter history (the G1a review, `responses/5b14b7a.md`). Evidence stored before G2 carried
   * `unseen === true` here, which on the phrase runs that alone had evidence was the same value.
   */
  firstContact?: boolean;
  /**
   * How the run's material relates to what established the skill (G2; the reviewer's fact path): D4's
   * `relationshipOf`, measured and declared apart, written once by `recordRun` against the establishing
   * contexts as they stood before the run — or, on a transfer-offer run, the offer's relationship for
   * its skill, as the offer made it. Absent: unknown (a legacy row, a D4 race row, a row from before
   * G2, a run with no material), never reconstructed later.
   */
  relationship?: Relationship;
  /**
   * The demands the run measured (G2): every demand its measured records located — each record's
   * `byDemand` and `otherDemands` — once each, sorted; written by `recordRun` with the relationship.
   * What challenge protection compares with the establishing records' demands. Absent: unknown.
   */
  demands?: string[];
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
 * - **3** — the same shape; playing hands together (`texture.hands-together`)
 *   counted only where the hands are coordinated, a left-hand note struck
 *   while the right hand sounds, not every note over the other hand's held
 *   note (C4d, L72: `detect.ts`). The hands-together skill's `n` and `right`
 *   and every entry for that demand change with it, so rows under 2 wait for a
 *   recompute like any other.
 * - **4** — the same shape; 3/8 read as simple triple, three eighth-note beats,
 *   by every detector that reads a bar's beat (L120b, `detect.ts`'s
 *   `isCompound`): compound time is no longer located in a 3/8 bar, a quarter
 *   entering on its second or third eighth is no longer syncopation, and a
 *   written dotted quarter in it is a dotted quarter. Evidence stored on a 3/8
 *   piece under 3 counted the 6/8, syncopation and dotted-quarter skills'
 *   opportunities, and every demand's entries, by the old reading, so rows
 *   under 3 wait for a recompute like any other.
 * - **5** — the same shape; the timing refusal per channel (CL04, L73): at a
 *   step the run's window cannot resolve, timing measures nothing and pitch
 *   still counts, so a misread note there counts against a skill that is
 *   pitched as well as timed (sight-reading, hand-independence) and against
 *   the step's pitch demands, and a right one counts right; the rhythm demands
 *   there (those whose coping skill has a precision of its own) are counted
 *   by none and kept in `otherDemands` at that step. A skill whose window
 *   resolves no step is still refused `precision`, and a timing-only skill
 *   reads as under 4. Evidence stored under 4 left those steps out on both
 *   channels, so rows under 4 wait for a recompute like any other.
 * - **6** — the same shape; a read with a note's name on the screen is never
 *   the full standard of a skill whose full standard has the guide off
 *   (CL11b, L58): `names-off`, met only by a recorded `keys.names === false`,
 *   joins those standards. Evidence stored under 5 counted a Wait first
 *   reading with *Name the note I am waiting for* on and the guide off as the
 *   full standard of the bass clef, ledger lines, reading by interval, key
 *   signatures and accidentals, so rows under 5 wait for a recompute like any
 *   other; it reads them at the practice standard. The support share and the
 *   timing precisions moved into the vocabulary at the same time (L57) with
 *   their values unchanged, which alone would have moved nothing.
 * - **7** — two demands join the vocabulary (CD1): `rhythm.habanera` and `rhythm.tresillo`, the
 *   left hand's onset cells (`detect.ts`'s `habaneraCell`, `tresilloCell`). Every vocabulary demand is
 *   located on every run (`locateDemands`), so a run on a cell-bearing item gains per-demand and
 *   `otherDemands` entries for them; their skill, `habanera-and-tresillo`, is observable `none` with no
 *   precision, so no skill's own `n` or `right` moves. Evidence stored under 6 lacks the cells, so rows
 *   under 6 wait for a recompute like any other.
 */
export const EVIDENCE_DEFINITIONS = 7;

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
  /** Of those, the steps right on every channel of the skill that measured the step (L73). */
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
  /** Of those, the steps right on every channel that measured the step (L73). */
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
   * steps in the hands played (absent where there are none): with `byDemand`,
   * where every demand of those steps is, so the overlap can be derived
   * (`overlapOf`) rather than stored beside every entry. A fact about the
   * notation, never a cause. A skill read over every step counts every demand
   * but one kind: the rhythm demands at a step its window could not time,
   * which land here (L73), so a pitch miss beside an eighth there is never read
   * as the pitch demand's alone.
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
  context: Pick<EvidenceContext, 'itemId' | 'seed' | 'material' | 'intent'>;
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
  // Recorded false, not merely unrecorded: a row that does not say the names
  // were off is not shown to have had them off (CL11b, L58; the approval's
  // lane-2 point, `responses/1afa30d3.md` §2).
  'names-off': { field: 'SessionRow.keys.names', met: (o) => o.keys?.names === false },
};

/** The observation field a condition's refusal cites, in the row's own spelling. */
const CONDITION_CITES: Readonly<Record<ConditionId, string[]>> = {
  'keep-tempo': ['mode', 'tempoMeasured'],
  unseen: ['unseen'],
  'guide-off': ['keys.guide'],
  'both-hands': ['hands.played'],
  'names-off': ['keys.names'],
};

// --- timing precision (reviewer decision 6, S21; CL11b, L57) ----------------------

/*
 * The error each timing skill is about, in quarter-note beats, is the
 * vocabulary's (`skills.json`'s `precision`, with its reason beside it; until
 * CL11b a table here): the smallest distance between where the written rhythm
 * puts a note and where the likely wrong rhythm puts it. A window as wide as
 * this or wider records the wrong rhythm as hits, so the measurement cannot
 * tell them apart. The global window is not changed.
 *
 * A rhythm skill has its own; its demands are the rhythm demands. Skills whose
 * rhythm is the whole phrase's (`every-step` opportunity, or a texture:
 * sight-reading, hand-independence) take, step by step, the finest precision
 * among the rhythm demands located at that step, and the vocabulary's default
 * (an eighth) where none is. At a step the window cannot resolve, the timing
 * channel measures nothing and the pitch channel still counts (CL04, L73): a
 * misread note there counts against them and a right one counts right, while
 * the rhythm demands located there are counted by none. Where the window
 * resolves no step at all, the skill is refused.
 */

/** Each skill's own precision in the vocabulary, in quarter-note beats: a rhythm skill's; absent for the others. */
function ownPrecisions(vocabulary: Vocabulary): ReadonlyMap<string, number> {
  const out = new Map<string, number>();
  for (const skill of vocabulary.skills) if (skill.precision !== undefined) out.set(skill.id, quartersOf(skill.precision));
  return out;
}

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
 * The error, in quarters, a timing skill must see at one step: its own (the
 * vocabulary's `precision` on the skill), or for a skill whose rhythm is the
 * phrase's the finest of the rhythm demands located at that step, and the
 * vocabulary's default where none is.
 */
function precisionQuartersAt(
  skill: Skill,
  own: ReadonlyMap<string, number>,
  fallback: number,
  rhythmAt: ReadonlyMap<number, number>,
  step: number,
): number {
  return own.get(skill.id) ?? Math.min(fallback, rhythmAt.get(step) ?? fallback);
}

/** The rhythm demands: those whose coping skill has a precision of its own (`rhythmPrecisionByStep`'s). */
function rhythmDemands(vocabulary: Vocabulary, own: ReadonlyMap<string, number>): Set<string> {
  return new Set(vocabulary.demands.filter((demand) => own.has(demand.copedWithBy)).map((demand) => demand.id));
}

/**
 * What the timing channel measured of a skill's steps (L73): the steps its
 * window resolves, and the rhythm demands, which only timing can tell and so
 * are counted nowhere else. Absent for a skill with no timing channel.
 */
interface TimedSteps {
  steps: ReadonlySet<number>;
  rhythm: ReadonlySet<string>;
}

/** Step -> the finest precision any rhythm demand located there asks for. */
function rhythmPrecisionByStep(located: Located, vocabulary: Vocabulary, own: ReadonlyMap<string, number>): Map<number, number> {
  const out = new Map<number, number>();
  for (const demand of vocabulary.demands) {
    const quarters = own.get(demand.copedWithBy);
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
  timed?: TimedSteps,
): MeasuredEvidence {
  let n = 0;
  let right = 0;
  let unattributed = 0;
  const played = observation.hands?.played;
  const named = skill.opportunity === 'every-step' ? null : new Set(skill.opportunity);
  const tallies = new Map<string, Tally>();
  const others = new Map<string, number[]>();
  for (const step of steps) {
    // Where the window could not time the step, timing measured nothing there
    // (L73): it is left out, never read as a miss, and the other channels count.
    const untimed = timed !== undefined && !timed.steps.has(step);
    const here = (untimed ? measurements.filter((m) => m.channel !== 'timing') : measurements).map((m) => m.at.get(step));
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
      // A demand the skill does not count here: one it does not name, or a
      // rhythm demand at a step timing did not measure (L73). Where it is, kept.
      if ((named !== null && !named.has(demand)) || (untimed && timed.rhythm.has(demand))) {
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
      ...(observation.material === undefined ? {} : { material: observation.material }),
      ...(observation.intent === undefined ? {} : { intent: observation.intent }),
      // The relation as the run header stored it (G1a), never `unseen`: absent stays absent.
      ...(observation.firstContact === undefined ? {} : { firstContact: observation.firstContact }),
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
    context: {
      itemId: observation.itemId,
      ...(observation.seed === undefined ? {} : { seed: observation.seed }),
      ...(observation.material === undefined ? {} : { material: observation.material }),
      ...(observation.intent === undefined ? {} : { intent: observation.intent }),
    },
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
  return stampedEvidence(keptAttemptFacts(evidenceFor({ observation: row, played, targetSkills: skills, vocabulary }), row.evidence));
}

/**
 * The facts `recordRun` wrote on the attempt (G2) — each measured record's `relationship` and
 * `demands` — kept across a recompute, skill by skill: written once, at the run, against the
 * contexts established then, so a later job carries them forward and never computes or fills one.
 * A skill whose stored result carried none stays without.
 */
function keptAttemptFacts(fresh: EvidenceResult[], stored: readonly EvidenceResult[] | undefined): EvidenceResult[] {
  const facts = new Map<string, Pick<EvidenceContext, 'relationship' | 'demands'>>();
  for (const result of stored ?? []) {
    if (result.kind !== 'measured') continue;
    const { relationship, demands } = result.context;
    if (relationship !== undefined || demands !== undefined) {
      facts.set(result.skill, { ...(relationship === undefined ? {} : { relationship }), ...(demands === undefined ? {} : { demands }) });
    }
  }
  if (facts.size === 0) return fresh;
  return fresh.map((result) => {
    const kept = result.kind === 'measured' ? facts.get(result.skill) : undefined;
    return kept === undefined ? result : ({ ...result, context: { ...(result as MeasuredEvidence).context, ...kept } } as unknown as MeasuredEvidence);
  });
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
  const steps = opportunitySteps(skill, measuredRun(observation), observation.hands?.played, model, located);
  if (steps.length === 0) return refuse(skill.id, 'no-opportunity', ['steps', 'hands.played']);

  // 5. Precision, for a skill timed at all, per channel (L73): timing measures
  // only the steps where the window can tell the rhythm from its error, and
  // the other channels still count the rest; none resolvable, and it is refused.
  const timing = measurements.find((m) => m.channel === 'timing');
  let timed: TimedSteps | undefined;
  if (timing) {
    const window = timing.toleranceMs;
    if (window === null) return refuse(skill.id, 'precision', ['input.toleranceMs'], 'window not recorded');
    const own = ownPrecisions(vocabulary);
    const fallback = quartersOf(vocabulary.precision);
    const rhythmAt = rhythmPrecisionByStep(located, vocabulary, own);
    const resolved = steps.filter((step) =>
      windowDiscriminates(window, precisionQuartersAt(skill, own, fallback, rhythmAt, step), model, step, observation.tempoPct),
    );
    if (resolved.length === 0) return refuse(skill.id, 'precision', ['input.toleranceMs', 'tempoPct'], `${String(window)} ms`);
    timed = { steps: new Set(resolved), rhythm: rhythmDemands(vocabulary, own) };
  }

  // Attribution: only the opportunity steps count, per skill and per demand.
  const evidence = evidenceFrom(measurements, skill, observation, steps, standard, met, model, at, where, timed);
  if (evidence.n === 0) {
    // Every opportunity step fell where the channel measured nothing (a note
    // never played has no onset to time).
    const channel = timing ? 'timing' : 'pitch';
    return refuse(skill.id, `not-measured:${channel}`, ['steps'], 'no opportunity step measured');
  }
  return evidence;
}
