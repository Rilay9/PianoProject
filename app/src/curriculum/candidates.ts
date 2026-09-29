/**
 * The chooser's material layer (E2; Part 25 layers 3 to 6): one candidate contract over every
 * source, the material requirements an experience states, what each candidate's source can prove
 * (validity), and the one gate asked of all three. Purposes, experience contracts, ranking and
 * the session's composition (Part 25 layers 1, 2, 7 and 8) are not here: they are the session's
 * and the teacher layer's (L32, X), and they stand on this.
 *
 * **One contract, every source** (item 1). A {@link Candidate} is a catalogue item — a bundled
 * score, a generated item, a runtime drill, an approved excerpt — an import (the learner's
 * MusicXML or converted MIDI, or a PDF, through `importToCatalogItem` as before), or an
 * **external recommendation** (I14): a title, a source and estimates with a confidence, never a
 * `CatalogItem` and never playable. Each carries its source kind; a catalogue candidate carries its
 * item, and with it the provenance and the measured facts it has. Nothing in the app constructs a
 * recommendation yet: X's screens will; here the tests and `recommendationsFromSeed` do.
 *
 * **Material requirements as data** (item 2). {@link MaterialRequirements} states what would make
 * an experience serve its purpose: the target opportunity (as a {@link Want} names it), the
 * forbidden, allowed and supporting demands, range, hands, duration, novelty, completeness and
 * D0's physical limits, and — the reviewer's required change (`responses/12af708.md`) — the
 * experience's own contract: `automatic` (raised by the session on its own, constrained) or
 * `chosen` (an exploration or a project the learner explicitly chose). The existing `Want`s are
 * the simplest requirements ({@link requirementsFromWant}).
 *
 * **Validity before the questions** (item 3). {@link validityOf} says, fact by fact, whether the
 * candidate's source can answer: generated — the family contract and the four validators; notated
 * — measured demands and the two review bits; an excerpt — the parent's provenance, the cut's
 * demands, the boundary decision and the admission; an import — conversion provenance, the
 * corrected inference, measured demands; a PDF — nothing about the notes; an external
 * recommendation — estimates with a confidence, never measured. **An unknown is not an observed
 * absence**: a forbidden or unprepared demand the source cannot rule out makes the candidate
 * ineligible for an automatic experience, with the demands named (`unknown-forbidden`), and leaves
 * it open to an explicitly chosen one with the missing fact named; an opportunity fact it cannot
 * answer makes it `exploration-only` for that requirement. Never eligible by silence, never a
 * competence claim by absence.
 *
 * **The one gate** (E2a; the E2 review's required change, `docs/review/responses/2532022.md`, and the
 * E2a brief's, `responses/1b09a1f.md`). E2 built this gate beside `eligibleFor`; since E2a the exported
 * `eligibleFor` *is* this gate asked of a want's requirements, so every automatic offer is judged
 * here. The established questions — the teaching-use admission, the coping question, the opportunity
 * question, the untrusted-tempo marker and their verdicts — are one private core,
 * `eligibilityCore.ts`, which this module asks and which imports neither gate: core ← candidates ←
 * eligibility, no edge back, no recursion. The reviewer's rule moves one case of a want's verdict: an
 * unmeasured candidate asked for a skill, a requirement, a demand or an equivalent by a learner who
 * does not cope with every demand was `exploration-only`, and is `unknown-forbidden`
 * (`materialLayer.test.ts` sweeps the built catalogue and names every moved case against the core).
 *
 * **Novelty bound to D4** (E2a). A candidate's contact identity is D4's material identity
 * (`material.materialOfItem`: the build's `provenance.identity` — a generator's whole identity, a
 * notated file's sha256, an excerpt's cut; `none` for an import); the learner's contact is D4's
 * reading (`progressStore.contactIn`) over the stored runs the caller already holds, passed in through
 * {@link contactFromRuns}. The gate reads no store.
 */
import { contactIn, type Contact } from '../data/progressStore';
import type { SessionRow } from '../data/db';
import { VOCABULARY_V0, type Vocabulary } from '../evidence/vocabulary';
import type { Identity } from '../review/record';
import { establishedQuestions, knowsTheLearner, measurementOf, uncoped, type CoreVerdict, type Learner, type Want } from './eligibilityCore';
import { isExcerpt } from './excerpt';
import { materialOfItem } from './material';
import type { CatalogItem, Measurement, Provenance } from './types';

/** Where a candidate's material comes from (Part 25 layer 4). Origin is never purpose. */
export type SourceKind = 'notated' | 'generated' | 'runtime' | 'excerpt' | 'import' | 'pdf' | 'external';

/** How settled an estimate is. An estimate at any confidence is still not a measurement. */
export type Confidence = 'low' | 'medium' | 'high';

/**
 * An external recommendation (I14; Part 25): what a teacher, a list or a site says of a work the
 * app holds no notation for. Its demands and level are estimates with a confidence, and its
 * provenance says so; it is never a `CatalogItem`, and nothing plays it.
 */
export interface ExternalRecommendation {
  /** `external.…` — never a catalogue id. */
  id: string;
  title: string;
  composer?: string;
  /** Why it is recommended, in words. */
  why: string;
  /** Where the recommendation comes from. */
  source: { name: string; url?: string | null };
  estimated: {
    level?: { value: number; confidence: Confidence };
    demands: readonly { demand: string; confidence: Confidence }[];
    skills?: readonly string[];
    concepts?: readonly string[];
  };
  /** Whether a score or a recording is known to exist somewhere; the app holds neither. */
  media?: { score?: boolean; audio?: boolean };
  /** What the learner said they like about it: ranking's to weigh (layer 7), never validity's or eligibility's. */
  interest?: readonly string[];
  provenance: { kind: 'estimated'; via: string };
}

/** One candidate for an experience, whatever its source (item 1). */
export type Candidate =
  | { source: Exclude<SourceKind, 'external'>; id: string; title: string; item: CatalogItem }
  | { source: 'external'; id: string; title: string; recommendation: ExternalRecommendation };

/** The source kind of a catalogue item or an import, from its provenance and its type. */
export function sourceOf(item: CatalogItem): Exclude<SourceKind, 'external'> {
  if (isExcerpt(item) || item.provenance?.source === 'excerpt') return 'excerpt';
  if (item.imported === true || item.provenance?.source.startsWith('imported-') === true) {
    return item.kind === 'pdf' || item.provenance?.source === 'imported-pdf' ? 'pdf' : 'import';
  }
  switch (item.provenance?.source) {
    case 'generated':
      return 'generated';
    case 'runtime':
      return 'runtime';
    case undefined:
      break;
    default:
      return 'notated';
  }
  // A constructed item with no provenance: by what it is.
  if (item.drill && !item.file) return 'runtime';
  return item.type === 'song' ? 'notated' : 'generated';
}

/** A catalogue item or an import as a candidate. */
export function candidateOf(item: CatalogItem): Candidate {
  return { source: sourceOf(item), id: item.id, title: item.title, item };
}

/** An external recommendation as a candidate. */
export function externalCandidate(recommendation: ExternalRecommendation): Candidate {
  return { source: 'external', id: recommendation.id, title: recommendation.title, recommendation };
}

/** How much of a piece of music the material is: a whole piece, a section, a phrase, or an isolating exercise. */
export type Completeness = 'whole' | 'section' | 'phrase' | 'isolation';

/** The names the gate gives the requirements, in a verdict and in a `none`. */
export type RequirementName =
  | 'target'
  | 'forbidden'
  | 'allowed'
  | 'supporting'
  | 'range'
  | 'hands'
  | 'duration'
  | 'novelty'
  | 'completeness'
  | 'physical';

/**
 * What would make an experience serve its purpose (item 2; Part 25 layer 3), as data the gate
 * reads. Every field but `experience` may be absent, and an absent field asks nothing.
 */
export interface MaterialRequirements {
  /**
   * The experience contract's two kinds the reviewer told apart: `automatic` — a requirement the
   * session raises on its own for a skill, a demand, a requirement or an equivalent, constrained;
   * `chosen` — an exploration or a project the learner explicitly chose.
   */
  experience: 'automatic' | 'chosen';
  /** The target opportunity, as a `Want` names it. Absent: no opportunity is claimed (discovery, plain exploration, a first-contact read). */
  target?: Exclude<Want, { for: 'exploration' }>;
  /** Demands the experience forbids beyond the learner's unprepared ones, which are always forbidden (the gate's first question). */
  forbidden?: readonly string[];
  /** When given, the only demands the material may carry besides the target's and the supporting ones. */
  allowed?: readonly string[];
  /** Demands the material must also carry, present in its notes. */
  supporting?: readonly string[];
  /** `within-position`: no hand shifts beyond a five-finger position (`range.beyond-position` absent). */
  range?: 'within-position';
  /** `one`: one hand at a time (`texture.hands-together` absent); `both`: the hands together (present). */
  hands?: 'one' | 'both';
  /** Seconds, either bound optional. */
  duration?: { minSec?: number; maxSec?: number };
  /** `first-contact`: material the learner has not met (D4's contact reading, `MaterialLearner.contact`); `familiar`: material they have. */
  novelty?: 'first-contact' | 'familiar';
  /** At least this much of a piece of music: `phrase` takes a phrase, a section or a whole; `whole` only a whole. */
  completeness?: Exclude<Completeness, 'isolation'>;
  /** D0's physical limits — an octave's reach, a leap's time, twelve notes a second — checked by the candidate's source. */
  physical?: 'd0-limits';
}

/**
 * A `Want` as the simplest requirements (item 2): `exploration` is an explicitly chosen experience
 * with no target; every other want is an automatic, constrained experience with that target.
 */
export function requirementsFromWant(want: Want): MaterialRequirements {
  return want.for === 'exploration' ? { experience: 'chosen' } : { experience: 'automatic', target: want };
}

/**
 * The `Want` whose two questions a requirement asks: its target; with none, `exploration` for a
 * chosen experience and `equivalent` for an automatic one — the first question (can the learner
 * cope) with no opportunity claimed, which is what an automatic experience with no target asks.
 */
export function wantOf(requirements: MaterialRequirements): Want {
  if (requirements.target) return requirements.target;
  return requirements.experience === 'chosen' ? { for: 'exploration' } : { for: 'equivalent' };
}

// --- validity -------------------------------------------------------------------------------

/** The facts a source may or may not be able to answer. */
export type FactName = 'demands' | 'opportunity' | 'tempo' | 'hands' | 'teaching' | 'physical' | 'completeness' | 'duration' | 'contact' | 'level';

/**
 * How a source knows a fact: `measured` (the app's detectors on the file), `contract` (a generated
 * family's contract and its validators), `runtime` (written when the drill opens), `authored` (the
 * file, the edition, the generator's recipe or the learner's correction), `inferred` (a converter's
 * or an estimator's guess), `reviewed` (a person's recorded decision), `boundary` (an excerpt's
 * boundary, approved by the rules), `catalogue` (what the catalogue row says), `notes` (a notated
 * song's notes are its own truth), `record` (the learner's record, keyed by the candidate's identity),
 * `described` (what a recommendation names), `estimated` (a recommendation's estimate).
 */
export type FactBasis =
  | 'measured'
  | 'contract'
  | 'runtime'
  | 'authored'
  | 'inferred'
  | 'reviewed'
  | 'boundary'
  | 'catalogue'
  | 'notes'
  | 'record'
  | 'described'
  | 'estimated';

/** One fact: answered, and how; or not, and what is missing. */
export type FactValidity = { answers: true; by: FactBasis; value?: string | number } | { answers: false; missing: string };

/** What a candidate's source can prove (item 3; Part 25 layer 5). */
export interface Validity {
  source: SourceKind;
  facts: Readonly<Record<FactName, FactValidity>>;
  /** R42's two review bits as stored: `null`, no person has decided. */
  review?: { score: boolean | null; teaching: boolean | null };
  /** What a converter decided, and by which version, where one did. */
  converter?: { name: string; version?: string | number };
  /** Tempo-sensitive demands whose difficulty rests on a tempo the file did not state. */
  untrusted?: readonly string[];
}

const known = (by: FactBasis, value?: string | number): FactValidity => (value === undefined ? { answers: true, by } : { answers: true, by, value });
const unknown = (missing: string): FactValidity => ({ answers: false, missing });

/** What a phrase of words says of a recommendation's estimates. */
function estimateWords(recommendation: ExternalRecommendation): string {
  const confidences = recommendation.estimated.demands.map((one) => one.confidence);
  const at = confidences.length === 0 ? 'no demand estimated' : `estimated at ${[...new Set(confidences)].join(' and ')} confidence`;
  return `an external recommendation's demands are estimates, never measured (${at}; ${recommendation.provenance.via})`;
}

/** The completeness a candidate's source states, or undefined where it cannot say. */
export function completenessOf(candidate: Candidate): Completeness | undefined {
  const fact = validityOf(candidate).facts.completeness;
  return fact.answers ? (fact.value as Completeness) : undefined;
}

/**
 * The identity a learner's contact is read by (E2a): D4's material identity (`materialOfItem`) — the
 * build's `provenance.identity` for a catalogue item (a generator's family, version, seed, recipe and
 * tempo; a notated file's sha256; an excerpt's cut, never its parent), `none` for an import (D4 keys
 * none: its contact is read by its id, and the verdict says so), undefined for a catalogue row built
 * before D4 (by id too) and for an external recommendation (the app keeps no record of it).
 */
export function contactIdentity(candidate: Candidate): Identity | undefined {
  return candidate.source === 'external' ? undefined : materialOfItem(candidate.item);
}

/**
 * The learner's contact as the material gate reads it, from the stored runs the caller already holds
 * (E2a): D4's `progressStore.contactIn` over those rows, keyed by the candidate's id and its material
 * (`contactIdentity`) — `met` across every item id that carries the material, `met-by-id` for a run of
 * the id that knows no material (a legacy run), `unmet` otherwise. The gate stays pure: it reads no
 * store, and a caller that asks for novelty passes this. The session's card holds the rows
 * (`BuildInput.rows`); no caller asks for novelty yet (the four `eligibleFor` callers ask wants, which
 * carry none).
 */
export function contactFromRuns(rows: readonly Pick<SessionRow, 'itemId' | 'material'>[]): (itemId: string, material: Identity | undefined) => Contact {
  return (itemId, material) => contactIn(rows, itemId, material);
}

/** The promise a generated item's family makes for its recipe (D3a), where the build wrote one. */
function promiseOf(item: CatalogItem): string | undefined {
  return item.provenance?.facts.promise?.value;
}

function isReadingRow(item: CatalogItem): boolean {
  return item.drill?.kind === 'sight-reading';
}

function demandsValidity(source: SourceKind, item: CatalogItem, measurement: Measurement): { demands: FactValidity; opportunity: FactValidity } {
  if (measurement.status === 'measured') {
    // One basis for every notated source the detectors read — bundled, excerpt, import alike
    // (adversary 3): the file measured is the item's own, the cut, or the learner's stored score.
    const opportunity = source === 'generated' && (measurement.contract?.length ?? 0) > 0 ? known('contract') : known('measured');
    return { demands: known('measured'), opportunity };
  }
  if (measurement.status === 'runtime') {
    return isReadingRow(item)
      ? { demands: known('runtime'), opportunity: known('runtime') }
      : { demands: known('runtime'), opportunity: unknown('a drill written when it opens: no fixed opportunity in its notes') };
  }
  const why = source === 'pdf' ? 'a PDF: the app reads no notes from it' : measurement.reason;
  return { demands: unknown(why), opportunity: unknown(why) };
}

/** Tempo-sensitive demands on a tempo the file did not state (R11): the provenance's list (the build's, and the import path's since E2). */
function untrustedOf(item: CatalogItem): readonly string[] {
  return item.provenance?.facts.demands?.untrusted ?? [];
}

function tempoValidity(source: SourceKind, item: CatalogItem, measurement: Measurement): FactValidity {
  if (measurement.status === 'runtime') return known('runtime');
  if (measurement.status !== 'measured') return unknown(source === 'pdf' ? 'a PDF: no notes, so nothing to play at a tempo' : 'no measured notes to play at a tempo');
  const tempo = item.provenance?.facts.tempo;
  if (untrustedOf(item).length > 0 || tempo?.kind === 'inferred') return unknown('the tempo is the converter’s default, not one the score states');
  if (source === 'generated') return known('contract');
  return known(tempo?.kind === 'authored' ? 'authored' : 'catalogue');
}

function handsValidity(source: SourceKind, item: CatalogItem): FactValidity {
  const hands = item.provenance?.facts.hands;
  if (hands?.kind === 'inferred') return known('inferred', hands.via);
  if (hands?.kind === 'authored') return known('authored', hands.via);
  if (source === 'pdf') return unknown('a PDF: the app reads no staves from it');
  if (source === 'generated') return known('contract');
  if (source === 'runtime') return known('runtime');
  if (source === 'import') return unknown('imported before the app recorded how the hands were decided');
  return known('catalogue');
}

function teachingValidity(source: SourceKind, item: CatalogItem): FactValidity {
  const teaching = item.provenance?.review.teaching ?? null;
  const decided = teaching === null ? undefined : teaching ? 'yes' : 'no';
  if (source === 'excerpt' || promiseOf(item) === 'music') {
    // Music whose teaching use rests on a person's decision (D3a, E1a): the bit, or nothing yet.
    return decided === undefined ? unknown('no person has decided its teaching use') : known('reviewed', decided);
  }
  if (source === 'generated') return known('contract', promiseOf(item) ?? 'drill');
  if (source === 'runtime') return known('runtime');
  // A notated song, an import, a PDF: the notes (or the pages) are its own truth (D3a).
  return known('notes');
}

function physicalValidity(source: SourceKind, item: CatalogItem): FactValidity {
  // D0's physical gate runs on every generated item the build writes (`confirm_physical`), and a
  // large-hand voicing it declares is on the row; nothing else writes a reach onto a catalogue row.
  if (source === 'generated') return known('contract', item.provenance?.physical ? 'declares a large-hand voicing' : 'within D0’s limits');
  if (source === 'excerpt') return unknown('the proposer’s physical gate passed the window, and no reach is written on the cut');
  if (source === 'runtime') return unknown('written per phrase: no reach is recorded');
  return unknown('no reach is measured in the notes');
}

function completenessValidity(source: SourceKind, item: CatalogItem): FactValidity {
  switch (source) {
    case 'excerpt':
      return known('boundary', 'phrase');
    case 'generated':
      // A family that promises music writes phrases (D3's grammar; unheard); a drill isolates.
      return known('contract', promiseOf(item) === 'music' ? 'phrase' : 'isolation');
    case 'runtime':
      return known('runtime', isReadingRow(item) ? 'phrase' : 'isolation');
    case 'import':
      return known('authored', 'whole');
    case 'pdf':
      return unknown('pages, not notes: what the pages hold is not read');
    default:
      return known('catalogue', item.type === 'song' ? 'whole' : 'isolation');
  }
}

/**
 * What a candidate's source can prove, fact by fact (item 3). Read by the gate before its
 * questions; read by nothing to rank (Part 25 layer 7 is X's).
 */
export function validityOf(candidate: Candidate): Validity {
  if (candidate.source === 'external') {
    const recommendation = candidate.recommendation;
    const estimate = estimateWords(recommendation);
    const level = recommendation.estimated.level;
    return {
      source: 'external',
      facts: {
        demands: unknown(estimate),
        opportunity: unknown(estimate),
        tempo: unknown('no notation: nothing to play at a tempo'),
        hands: unknown('no notation: no staves'),
        teaching: unknown('not a catalogue item: nothing the app offers to play'),
        physical: unknown(estimate),
        completeness: known('described', 'whole'),
        duration: unknown('no duration is known'),
        contact: unknown('the app keeps no record of the learner meeting a work outside it'),
        level: level === undefined ? unknown('no level estimated') : known('estimated', level.value),
      },
    };
  }
  const { source, item } = candidate;
  const measurement = measurementOf(item);
  const { demands, opportunity } = demandsValidity(source, item, measurement);
  const provenance: Provenance | undefined = item.provenance;
  const untrusted = untrustedOf(item);
  return {
    source,
    facts: {
      demands,
      opportunity,
      tempo: tempoValidity(source, item, measurement),
      hands: handsValidity(source, item),
      teaching: teachingValidity(source, item),
      physical: physicalValidity(source, item),
      completeness: completenessValidity(source, item),
      duration: typeof item.durationSec === 'number' ? known('catalogue', item.durationSec) : unknown('no duration on the catalogue row'),
      contact: source === 'runtime' ? known('runtime') : known('record'),
      level: known(item.levelSource === 'judged' ? 'authored' : 'inferred', item.level),
    },
    ...(provenance ? { review: { score: provenance.review.score, teaching: provenance.review.teaching } } : {}),
    ...(provenance?.converter ? { converter: provenance.converter } : {}),
    ...(untrusted.length > 0 ? { untrusted } : {}),
  };
}

// --- the gate -------------------------------------------------------------------------------

/** The learner as the material gate asks of them: the one gate's learner, and their contact with material. */
export interface MaterialLearner extends Learner {
  /**
   * The learner's contact with the material a candidate id and identity name: D4's reading
   * (`progressStore.Contact`), passed by the caller from the stored runs it holds
   * ({@link contactFromRuns}). Absent: the record was not given, and a novelty requirement waits.
   */
  contact?: (itemId: string, material: Identity | undefined) => Contact;
}

type CoreEligible = Extract<CoreVerdict, { verdict: 'eligible' }>;

/** The material gate's verdict: the established questions', and the three things only the material layer can say. */
export type MaterialVerdict =
  | Exclude<CoreVerdict, { verdict: 'eligible' }>
  | (CoreEligible & {
      /**
       * Novelty was asked and the learner's contact was read by the item id alone (D4's `met-by-id`, or
       * a candidate with no material to compare — an import, D4's `none`): said, not hidden.
       */
      contactBy?: 'id';
    })
  /** A forbidden or unprepared demand the source cannot rule out, under an automatic experience (the reviewer's required change). */
  | { verdict: 'ineligible'; why: 'unknown-forbidden'; demands: readonly string[]; missing: string }
  /** D0's limits asked of material whose source checked no reach, under an automatic experience. */
  | { verdict: 'ineligible'; why: 'unknown-physical'; missing: string }
  /** A material requirement the candidate's facts answer, and fail. */
  | { verdict: 'ineligible'; why: 'requirement'; requirement: RequirementName; found: string };

/** Every vocabulary demand the learner is not prepared for: the one gate's first question, asked of the whole vocabulary. */
export function unpreparedDemands(learner: Learner, vocabulary: Vocabulary = VOCABULARY_V0): string[] {
  const every: CatalogItem = {
    id: 'e2.every-demand',
    type: 'song',
    title: 'every demand in the vocabulary',
    level: 0,
    hands: 'both',
    tracks: [],
    concepts: [],
    demands: vocabulary.demands.map((demand) => demand.id),
    measurement: { status: 'measured', definitions: 0, located: {}, bars: 1, steps: 0, notes: 0, established: [] },
  };
  return uncoped(every, learner, vocabulary);
}

/** The demands a target wants, for an `allowed` set to leave room for. */
function targetDemands(requirements: MaterialRequirements, vocabulary: Vocabulary): string[] {
  const target = requirements.target;
  if (target === undefined || target.for === 'equivalent') return [];
  if (target.for === 'demand') return [target.demand];
  const opportunity = vocabulary.skills.find((skill) => skill.id === target.skill)?.opportunity;
  return Array.isArray(opportunity) ? [...opportunity] : [];
}

/**
 * The forbidden demands a candidate would have to rule out: the learner's unprepared ones (where a
 * learner is given), the requirement's own, every demand outside an `allowed` set, and those a
 * range or a one-hand requirement forbids — in the vocabulary's order.
 */
function mustRuleOut(requirements: MaterialRequirements, learner: Learner, vocabulary: Vocabulary): string[] {
  const out = new Set<string>();
  if (knowsTheLearner(learner)) for (const demand of unpreparedDemands(learner, vocabulary)) out.add(demand);
  for (const demand of requirements.forbidden ?? []) out.add(demand);
  if (requirements.allowed) {
    const room = new Set([...requirements.allowed, ...(requirements.supporting ?? []), ...targetDemands(requirements, vocabulary)]);
    for (const demand of vocabulary.demands) if (!room.has(demand.id)) out.add(demand.id);
  }
  if (requirements.range === 'within-position') out.add('range.beyond-position');
  if (requirements.hands === 'one') out.add('texture.hands-together');
  return vocabulary.demands.map((demand) => demand.id).filter((id) => out.has(id));
}

const COMPLETENESS_RANK: Record<Completeness, number> = { isolation: 0, phrase: 1, section: 2, whole: 3 };

/**
 * The material requirements beyond the want, asked of a candidate the one gate found eligible.
 * A requirement the facts answer and fail refuses; a forbidding requirement the facts cannot answer
 * refuses under an automatic experience; any other unanswered requirement leaves it for
 * exploration only, the missing fact named.
 */
function materialRequirements(
  requirements: MaterialRequirements,
  candidate: Extract<Candidate, { item: CatalogItem }>,
  validity: Validity,
  learner: MaterialLearner,
  passed: CoreEligible,
  vocabulary: Vocabulary,
): MaterialVerdict {
  const item = candidate.item;
  const demands = validity.facts.demands.answers && Array.isArray(item.demands) ? item.demands : undefined;
  const refuse = (requirement: RequirementName, found: string): MaterialVerdict => ({ verdict: 'ineligible', why: 'requirement', requirement, found });
  const automatic = requirements.experience === 'automatic';

  if (demands !== undefined) {
    const forbidden = demands.find((demand) => requirements.forbidden?.includes(demand));
    if (forbidden !== undefined) return refuse('forbidden', forbidden);
    if (requirements.allowed) {
      const room = new Set([...requirements.allowed, ...(requirements.supporting ?? []), ...targetDemands(requirements, vocabulary)]);
      const outside = demands.find((demand) => !room.has(demand));
      if (outside !== undefined) return refuse('allowed', outside);
    }
    if (requirements.range === 'within-position' && demands.includes('range.beyond-position')) return refuse('range', 'range.beyond-position');
    if (requirements.hands === 'one' && demands.includes('texture.hands-together')) return refuse('hands', 'texture.hands-together');
    if (requirements.hands === 'both' && !demands.includes('texture.hands-together')) return refuse('hands', 'one hand at a time');
    const lacking = (requirements.supporting ?? []).find((demand) => !demands.includes(demand));
    if (lacking !== undefined) return refuse('supporting', lacking);
  }

  const open: string[] = [];
  const unanswered = (requirement: RequirementName, fact: FactValidity): void => {
    if (!fact.answers) open.push(`${requirement}: ${fact.missing}`);
  };
  if (demands === undefined && (requirements.hands === 'both' || (requirements.supporting?.length ?? 0) > 0)) {
    unanswered(requirements.hands === 'both' ? 'hands' : 'supporting', validity.facts.demands);
  }

  if (requirements.physical === 'd0-limits') {
    const physical = validity.facts.physical;
    if (!physical.answers) {
      if (automatic) return { verdict: 'ineligible', why: 'unknown-physical', missing: physical.missing };
      open.push(`physical: ${physical.missing}`);
    }
  }

  if (requirements.completeness !== undefined) {
    const fact = validity.facts.completeness;
    if (fact.answers) {
      const has = fact.value as Completeness;
      if (COMPLETENESS_RANK[has] < COMPLETENESS_RANK[requirements.completeness]) return refuse('completeness', has);
    } else unanswered('completeness', fact);
  }

  if (requirements.duration !== undefined) {
    const fact = validity.facts.duration;
    if (fact.answers) {
      const seconds = Number(fact.value);
      const { minSec, maxSec } = requirements.duration;
      if ((minSec !== undefined && seconds < minSec) || (maxSec !== undefined && seconds > maxSec)) return refuse('duration', `${String(seconds)} s`);
    } else unanswered('duration', fact);
  }

  let byId = false;
  if (requirements.novelty !== undefined) {
    if (candidate.source === 'runtime') {
      // A phrase the reader writes when it opens is new each time, from an unseen seed (C4): first contact by construction.
      if (requirements.novelty === 'familiar') return refuse('novelty', 'unmet');
    } else {
      // D4's reading, over the runs the caller holds: `met` and `met-by-id` are contact — a legacy run of the
      // id is never first contact — and `unmet` is none; read by the id alone, the verdict says so.
      const reading = learner.contact?.(candidate.id, contactIdentity(candidate));
      if (reading === undefined) open.push('novelty: no record of the learner’s contact with it');
      else if (requirements.novelty === 'first-contact' && reading.contact !== 'unmet') return refuse('novelty', reading.contact);
      else if (requirements.novelty === 'familiar' && reading.contact === 'unmet') return refuse('novelty', 'unmet');
      else byId = reading.contact === 'met-by-id' || reading.materialUnknown === true;
    }
  }

  const judged = byId ? { ...passed, contactBy: 'id' as const } : passed;
  if (open.length > 0) {
    // A chosen exploration keeps its own verdict and names what is missing; any other claim waits for the fact.
    if (passed.for === 'exploration') return { ...judged, missing: [passed.missing, ...open].filter(Boolean).join('; ') };
    return { verdict: 'exploration-only', missing: open.join('; ') };
  }
  return judged;
}

/**
 * An external recommendation, which has no measured fact to ask the one gate about: refused where
 * an automatic experience would have to rule something out, exploration only for any claim, and
 * open to a chosen discovery with the estimate said as an estimate. It names a whole work, so a
 * completeness requirement never refuses it.
 */
function externalVerdict(requirements: MaterialRequirements, candidate: Extract<Candidate, { source: 'external' }>, learner: MaterialLearner, vocabulary: Vocabulary): MaterialVerdict {
  const validity = validityOf(candidate);
  const missing = (validity.facts.demands as Extract<FactValidity, { answers: false }>).missing;
  if (requirements.experience === 'automatic') {
    const cannot = mustRuleOut(requirements, learner, vocabulary);
    if (cannot.length > 0) return { verdict: 'ineligible', why: 'unknown-forbidden', demands: cannot, missing };
    if (requirements.physical === 'd0-limits') return { verdict: 'ineligible', why: 'unknown-physical', missing };
  }
  // No measured opportunity, and no measured demand for a practice claim: never eligible by estimate.
  if (requirements.target !== undefined || requirements.experience === 'automatic') return { verdict: 'exploration-only', missing };
  const also: string[] = [];
  for (const [asked, name] of [
    [requirements.novelty, 'novelty'],
    [requirements.duration, 'duration'],
    [requirements.physical, 'physical'],
  ] as const) {
    if (asked === undefined) continue;
    const fact = validity.facts[name === 'novelty' ? 'contact' : name];
    if (!fact.answers) also.push(`${name}: ${fact.missing}`);
  }
  return { verdict: 'eligible', for: 'exploration', missing: [missing, ...also].join('; ') };
}

/**
 * The one gate asked of a candidate under material requirements (items 2 and 3; Part 25 layer 6):
 * validity before the questions, the established questions (the private core, asked of the want the
 * requirements name — never the exported `eligibleFor`, which delegates here), then the material
 * requirements beyond the want. Exported beside `eligibleFor` for a caller whose requirements go
 * beyond a want (none yet; X's chooser, with novelty and the contact it holds).
 */
export function eligibleForMaterial(
  requirements: MaterialRequirements,
  candidate: Candidate,
  learner: MaterialLearner,
  vocabulary: Vocabulary = VOCABULARY_V0,
): MaterialVerdict {
  if (candidate.source === 'external') return externalVerdict(requirements, candidate, learner, vocabulary);
  const validity = validityOf(candidate);
  const asked = establishedQuestions(candidate.item, learner, wantOf(requirements), vocabulary);
  const demands = validity.facts.demands;
  if (!demands.answers && asked.verdict !== 'ineligible' && requirements.experience === 'automatic') {
    // An unknown is not an observed absence: what the source cannot rule out, an automatic experience may not risk.
    const cannot = mustRuleOut(requirements, learner, vocabulary);
    if (cannot.length > 0) return { verdict: 'ineligible', why: 'unknown-forbidden', demands: cannot, missing: demands.missing };
  }
  if (asked.verdict !== 'eligible') return asked;
  return materialRequirements(requirements, candidate, validity, learner, asked, vocabulary);
}

/** The material a requirement found, or `none` with what was unmet — never a weakened gate (adversary 9). */
export type MaterialChoice =
  | { verdict: 'found'; eligible: readonly { candidate: Candidate; verdict: Extract<MaterialVerdict, { verdict: 'eligible' }> }[] }
  | { verdict: 'none'; unmet: readonly string[] };

/** A verdict's reason in a word or two, for a `none`. */
export function unmetOf(verdict: MaterialVerdict): string {
  switch (verdict.verdict) {
    case 'eligible':
      return 'eligible';
    case 'exploration-only':
      return `exploration only: ${verdict.missing}`;
    case 'ineligible':
      switch (verdict.why) {
        case 'untaught':
        case 'unknown-forbidden':
          return `${verdict.why}: ${verdict.demands.join(', ')}`;
        case 'absent':
        case 'incidental':
          return `${verdict.why}: ${verdict.wanted}`;
        case 'not-a-target':
          return `not a target: ${verdict.skill}`;
        case 'requirement':
          return `${verdict.requirement}: ${verdict.found}`;
        case 'teaching-use-not-approved':
          return 'teaching use not approved';
        case 'unknown-physical':
          return `physical: ${verdict.missing}`;
        default:
          return verdict.why;
      }
  }
}

/**
 * Every candidate the requirements admit, in the order given (ranking is layer 7's, X's), or `none`
 * with each distinct reason the candidates gave. Changing the experience, generating material or
 * saying the need cannot be served is the teacher layer's (X), never this gate's.
 */
export function materialFor(
  requirements: MaterialRequirements,
  candidates: readonly Candidate[],
  learner: MaterialLearner,
  vocabulary: Vocabulary = VOCABULARY_V0,
): MaterialChoice {
  const eligible: { candidate: Candidate; verdict: Extract<MaterialVerdict, { verdict: 'eligible' }> }[] = [];
  const unmet = new Set<string>();
  for (const candidate of candidates) {
    const verdict = eligibleForMaterial(requirements, candidate, learner, vocabulary);
    if (verdict.verdict === 'eligible') eligible.push({ candidate, verdict });
    else unmet.add(unmetOf(verdict));
  }
  return eligible.length > 0 ? { verdict: 'found', eligible } : { verdict: 'none', unmet: [...unmet] };
}

// --- the seed list as recommendations -------------------------------------------------------

/** One work of `content/sources/teaching-repertoire.json` (E28). */
export interface SeedWork {
  composer: string;
  died: number;
  work: string;
  concepts: readonly string[];
  known: string;
  confidence: Confidence;
  catalogue: readonly string[];
}

/** The seed list, as the file holds it. */
export interface TeachingRepertoire {
  v: number;
  about: string;
  works: readonly SeedWork[];
}

function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * The seed list read as external recommendations (E28; the one seed reader item 1 names): each work
 * a recommendation whose estimates are its reputation. A concept that is a vocabulary skill whose
 * opportunity is one demand names that demand as an estimate (the rule `claims.concepts_naming`
 * reads); every other concept is carried as a concept and estimates nothing. No level is estimated.
 */
export function recommendationsFromSeed(seed: TeachingRepertoire, vocabulary: Vocabulary = VOCABULARY_V0): ExternalRecommendation[] {
  return seed.works.map((work) => {
    const skills = work.concepts.filter((concept) => vocabulary.skills.some((skill) => skill.id === concept));
    const demands = skills.flatMap((id) => {
      const opportunity = vocabulary.skills.find((skill) => skill.id === id)?.opportunity;
      return Array.isArray(opportunity) && opportunity.length === 1 ? [{ demand: opportunity[0] as string, confidence: work.confidence }] : [];
    });
    return {
      id: `external.seed.${slug(`${work.composer.split(' (')[0] ?? work.composer} ${work.work}`)}`,
      title: work.work,
      composer: work.composer,
      why: `Known for ${work.known}.`,
      source: { name: 'content/sources/teaching-repertoire.json' },
      estimated: { demands, skills, concepts: [...work.concepts] },
      media: { score: work.catalogue.length > 0 },
      provenance: { kind: 'estimated', via: 'the seed list of teaching repertoire: reputation, never measured' },
    };
  });
}
