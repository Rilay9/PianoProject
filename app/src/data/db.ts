/**
 * IndexedDB, as docs/01-architecture.md §4.5 lays it out.
 *
 * One database, one version number, one place that knows the schema. Every
 * store is opened through here so a migration is a single function rather
 * than something each caller has to remember.
 *
 * Storage can fail — private browsing, a browser with site data blocked, a
 * quota that is already full. None of that should stop the app: `withDb`
 * returns `null` when the database is unavailable and every store above it
 * falls back to memory for the session. A learner who cannot save progress
 * should still be able to practise.
 */
import {
  openDB,
  type DBSchema,
  type IDBPDatabase,
  type IDBPTransaction,
  type StoreNames,
} from 'idb';
import type { BarTally, HandsFilter, NotMeasured, RunMeasures } from '../engine/types';
import type { TodaySlot } from '../router';
import type { EvidenceResult } from '../evidence/evidence';
import type { Measurement, Provenance } from '../curriculum/types';
import type { Identity } from '../review/record';
import type { Relationship } from '../curriculum/transfer';

export const DB_NAME = 'pianopath';
/**
 * 2 adds `levelOverrides` (replan §1.4); 3 adds `folderLibraries` (`04` §4b);
 * 4 gives an import the rungs it belongs to (replan §4.3); 5 adds `books` —
 * the shelf of paper the owner already owns (replan §5.1); 6 splits a folder
 * listing into one record per score plus a compact per-folder index, so
 * opening the browse screen and adding one piece stop costing the whole
 * listing (see `folderLibraries` below).
 *
 * C1's observations (`RunObservation` on `SessionRow`) changed no store and no
 * index — every field is optional on a value, which IndexedDB does not
 * describe — so they are not a version: a row written before them reads as
 * one with none, and the `upgrade` below has nothing to do for them. D1a's
 * `generator` (the phrase's family, version and seed) is one more such field:
 * absent means version 1. D4's `material`, `role`, `intent` and `relationship`
 * are more: absent `material` is a legacy run, its material unknown, and no
 * index is added for them (contact novelty reads the rows the rung state
 * already holds in memory, `progressStore.contactIn`).
 *
 * 7 (C5) changes no store either. It is a version so that the one moment a
 * database made before C5 is first opened by C5's code can be told apart from
 * every other open: that upgrade marks the old record as due to be carried
 * over (`CARRY_OVER_DUE_KEY`, `data/carryOver.ts`), and a database C5 makes
 * never is.
 *
 * 8 (G1; Part 27, L97) adds two stores and touches no other: `encounters`, what
 * the learner met that is not a run — the notation drawn for them on the Score
 * screen, a playback to them, a demonstration — one small row each
 * (`EncounterRow`); and `contacts`, one durable summary per material of the runs
 * the retention cap deleted (`ContactSummaryRow`), folded in the same
 * transaction as the deletion, so no fact a familiarity query reads is lost to
 * the cap (the reviewer's constraint, `docs/review/responses/9193261.md`). Runs
 * stay in `sessions`, the record of runs; neither new store copies a live run.
 *
 * 9 (G1b; R19, R47, R18, L86) adds one store and touches no other: `projects`,
 * what the learner says they are doing with a piece — saved, learning,
 * polishing, ready, kept playable, brought back, paused, put away — one row per
 * piece (`ProjectRow`), written only by the learner's action on the project
 * sheet. Intention, never a fact about what was met (the encounters and runs)
 * or measured (the evidence); nothing is carried into it from a store already
 * there, so a database from before G1b opens with no project.
 *
 * 10 (CL23, L53) adds one index and touches no store: `sessions.byPerformance`,
 * over a performance run's marker and its date (`performanceMark`, `at`), so
 * the Progress screen's performances are found however far back they are —
 * `recentPerformances` walked the dates and gave up after the old cap's 2,200
 * runs, and the cap had been 25,000 since C1. The marker, not `performance`
 * itself, because a boolean is not an IndexedDB key: an index on it holds no
 * row at all. The upgrade marks every performance already stored, in its own
 * transaction (version 4's pattern), and writes nothing else; `recordRun`
 * marks every new one (`withPerformanceMark`) and a restored backup is marked
 * on the way in (`backup.importAll`), which never runs this upgrade.
 */
export const DB_VERSION = 10;

/**
 * Set in the `settings` store by the version 7 upgrade of a database made
 * before C5, and cleared by the plan store once the learner's old rungs have
 * been carried over — by the first read of the plan since L98. Never set on a
 * database C5 made.
 */
export const CARRY_OVER_DUE_KEY = 'pianopath.carryOverDue';

export type ProgressStatus = 'new' | 'started' | 'passed' | 'mastered';

export interface ProgressRow {
  itemId: string;
  status: ProgressStatus;
  bestAccuracy: number;
  bestTempoPct: number;
  attempts: number;
  /** ISO date-time of the last run. */
  lastPracticedAt: string;
  minutes: number;
  /** ISO dates on which this item was passed. The review calendar reads them. */
  passedOn: string[];
  /**
   * ISO dates of the runs that met the master standard (T37).
   *
   * `02` Part G's master is 97 % at full tempo *twice on different days*, and
   * the store used to grant it on one such run plus any earlier pass, because
   * it counted `passedOn`. The two lists are kept apart so a pass at 90 % on
   * Monday and one master-standard run on Tuesday is still one master day.
   * Absent on rows written before it existed, which read as none.
   */
  masteredOn?: string[];
  /** Set by "I already know this" rather than by a measured run. */
  selfPassed?: boolean;
}

/**
 * Which set of definitions wrote a row's observation (C1).
 *
 * The accuracy definitions, the tolerance, the step codes and the "not
 * measured" mark all belong to this number, so a later reader can tell which
 * rules produced a row and derive again from it. Absent: a row written before
 * observations were stored, which has only the seven numbers it always had.
 *
 * **2** (CL11a): in Keep tempo a wrong key costs a note. The row's `accuracy` is
 * the written notes played right in time, less one note per wrong key, and a
 * right note played late is charged once, as the miss, never also as a wrong
 * key. What was observed is kept beside the verdict and apart from it:
 * `pitch.right` is still the notes struck in their window, `wrongNotes` the
 * wrong keys, and a step whose notes all came in time still codes `h`, so a
 * reader that wants the step's verdict reads its wrong keys too
 * (`evidence/measurement.ts`). Rows written under **1** keep the reading they
 * were judged with: they cannot tell a wrong key from a late right note (both
 * are in `steps.wrong`) and hold no expected pitches to tell them by, so they
 * are never re-judged.
 */
export const OBSERVATION_DEFINITIONS = 2;

/**
 * What a run was, as the screen that ran it knew it: the header half of an
 * observation (C1; design §3). Every field optional, because rows written
 * before C1 have none of them; a C1 row has all of them that apply.
 */
export interface RunHeader {
  /** `OBSERVATION_DEFINITIONS` at the time of writing. */
  definitions?: number;
  /**
   * The printed measures the run covered (`ScoreStep.sourceMeasureIndex`,
   * 0-based): the whole piece, or the loop it was confined to.
   */
  range?: { fromMeasure: number; toMeasure: number };
  /**
   * Whether the run covered the whole item it was a run of (RG1; FABLE §6; the reviewer's ruling,
   * `docs/review/responses/6e7475c1.md` §5): `true` where no step the run gave the learner to play
   * lies outside the steps it judged, `false` where some does — a loop over part of the item. Not
   * `range`, which is written on every judged run, the whole piece's included, and is no loop flag.
   *
   * Derived by the Score screen from the run's own prepared session (`coversWholeItem`), where both
   * the judged span and the item's whole step sequence are in hand; an excerpt's item is its cut,
   * never the parent. A loop whose bars take in the whole item is `true`: the evidence covers the
   * item although Loop was used. A fact about the range only: the hand the run played is `hands`.
   *
   * Read by `rungState`'s named `runs` requirement (one with `items`), which counts a run only where
   * this is not `false`. Absent — every run written before RG1, and the drill and paper screens'
   * runs, which have no range to cover — counts as such runs always did (the compatibility rule in
   * `rungState`). Optional, so no `DB_VERSION` and no upgrade (C1's rule), and no row is rewritten.
   */
  wholeItem?: boolean;
  /**
   * What opened the Score screen: the tab the learner came from, the rung
   * that judged it (`?from=`, or the rung a Today card chose, `?rung=`), the
   * tour, and the Today slot. Only a Today card names a slot (C3 item 0b,
   * L50); any other opening stores it as not measured, and says so.
   */
  opened?: { tab: string; rung?: string; tour?: string; slot: TodaySlot | NotMeasured };
  /**
   * The tempo the percentage is of: the score's first marking, `written` or
   * `defaulted` where the converter made it up (the `tempo-defaulted` tag).
   */
  baseTempo?: { bpm: number; source: 'written' | 'defaulted' } | NotMeasured;
  /** The hand the learner played, and what the app played beside it. */
  hands?: { played: HandsFilter; appPlayed: 'none' | 'other hand' | 'both hands' };
  /**
   * What the keys under the score showed during the run: the view, the guide
   * ahead of time, finger numbers on the marked keys, and whether a note's
   * name was on the screen (the ribbon's label, or *Name the note I am
   * waiting for* in Wait). A run the keys guided is not clean evidence of
   * reading the staff (reviewer decision 5).
   */
  keys?: { view: 'strip' | 'ribbon' | 'off'; guide: 'next' | 'next-two' | 'off'; fingers: boolean; names: boolean };
  /** Whether grace notes were judged (`05` §1.3). */
  graceNotes?: boolean | NotMeasured;
  /** The input, the timing window it was judged with, and the latency taken off. */
  input?: {
    source: 'midi' | 'mic' | 'keys' | 'none';
    toleranceMs: number | NotMeasured;
    latencyMs: number | NotMeasured;
  };
  /**
   * First contact, the fact (G1a; the reviewer's required change on G1,
   * `docs/review/responses/b48342f.md`): the encounter relation of the run's
   * material at the moment of the run, derived from the encounter history
   * (`encounterStore.firstContactIn`) and read again before the run is stored.
   * `true` where nothing of this material had been met before — no run of it,
   * no playback or demonstration of it on any visit, no viewing of it on
   * another visit (the view that reading it needs, this visit's, does not
   * count); `false` otherwise.
   *
   * Written by the Score screen on every run it records — a notated piece, an
   * excerpt, an import, a generated phrase. A fact, never a competence or an
   * evidence state, and never a gate on a pass: a piece practised again is
   * refused nothing. This is the field a consumer of general contact reads (G2's
   * offer, X's session, the later lifecycle), and it needs no `isPhraseRun` to
   * read it. Absent — unknown, never inferred from `unseen` — on every run
   * written before G1a, and on the drill and paper screens' runs.
   */
  firstContact?: boolean;
  /**
   * The generated phrase's sight-reading condition (C1): `true` on a first
   * reading, `false` where the phrase was read, heard or seen before — which
   * keeps the run practice and never evidence of reading (reviewer decision
   * 3). `recordRun`, the rung state, the history line and the evidence job read
   * it so, through `isPhraseRun`; the evidence's `unseen` condition and the
   * ladder's first-contact context read it on the phrase runs that alone have
   * evidence (`skillActivation`). Written on phrase runs only, beside
   * `firstContact` and derived from that relation and the visit rule — today
   * the same value, one derivation with two names, so a later change to the
   * visit rule moves this field and not the fact (G1a).
   *
   * Absent on anything but a phrase — with one window: G1's app wrote it on
   * every Score-screen run as the first-contact fact, between G1's landing and
   * G1a's, so a piece's run stored then carries it (and no `firstContact`);
   * `isPhraseRun` reads such a row as no phrase.
   */
  unseen?: boolean;
  /** The piece was played to the learner part way through this run (`Hear it` over it, T33). */
  demonstrated?: boolean;
  /**
   * The exact material played (E1 item 7; D4 item 2), D2's `Identity`: the catalogue row's
   * `provenance.identity` for a bundled item — a generated item's generator, a notated item's built
   * file (an excerpt's cut, never the parent's) — the phrase's complete generator identity for a
   * sight-reading run (`curriculum/material.phraseMaterial`), an import's stored bytes by their
   * sha256 since G1 (`material.textIdentity`, hashed where the Score screen loads them; `none` before
   * G1, or where the browser offers no digest), `none` for a drill made when it opens. Carried into
   * the evidence context beside `itemId` and `seed`; read by contact
   * novelty (`progressStore.contactIn`) across every item id. Absent: a legacy run, from before D4
   * (or E1), whose material is unknown and is never guessed.
   */
  material?: Identity;
  /** The item's role for its primary skill where it has one (D0, `CatalogItem.role`), as played (D4). Intent, never evidence. */
  role?: 'canonical' | 'variable' | 'transfer';
  /**
   * `transfer` where the run came from the session's transfer offer (D4 item 2), else absent: the
   * intent the material was offered with, never a claim that the run demonstrated transfer — which
   * is the post-E evidence policy's to read from these facts.
   */
  intent?: 'transfer';
  /**
   * How the material relates to what the skill was shown on, as facts (D4 item 5,
   * `curriculum/transfer.ts`): written with a transfer-intended run, for the later policy. No
   * distance, no verdict.
   */
  relationship?: Relationship;
  /**
   * What a generated phrase was written from (C4): the catalog row, and the
   * dimensions the reader moved away from the row's own recipe. Written on
   * every sight-reading run — from the route where Today's reader chose it
   * (`?recipe=`), the row's own recipe otherwise — so the reader can tell the
   * learner's last recipe from their last row. Absent on anything else, and on
   * sight-reads recorded before C4, which read as the row's own recipe.
   */
  recipe?: ReadingRecipe;
  /**
   * Which generator wrote the phrase (D1a; G21, D0's `drill.generator` shape):
   * its family, its version and its seed. Written on every run of a generated
   * phrase from the phrase itself (`SightReadingResult.generator`), because a
   * seed names one phrase *per version*: version 2 writes other music from
   * most seeds version 1 read. Every reader that asks whether a run met a
   * phrase, and the evidence job writing a stored run's phrase again, reads the
   * version beside the seed (`phraseVersionOf`).
   *
   * Optional, so no `DB_VERSION` and no upgrade (C1's rule, above): absent on
   * every run recorded before it, and absent means version 1 — the only
   * version the app wrote until D1a, which the generator still writes note
   * for note. Here beside `recipe`, the other half of what a generated phrase
   * was, so `SessionRow` and the run a screen hands `recordRun` both carry it.
   */
  generator?: PhraseGenerator;
}

/**
 * A generated phrase's identity on the record (D1a). `version` is a number,
 * not the generator's own type: a row outlives the code that wrote it, and a
 * version this build does not know is kept and never written by another in
 * its place (`evidenceJob.candidatePhrases`).
 */
export interface PhraseGenerator {
  family: 'sight-reading';
  version: number;
  seed: number;
}

/**
 * The generator version a stored run's phrase was written by: the record's
 * own, or 1 where the row has none — every run recorded before D1a, when
 * version 1 was the only version in force (D1a; the reviewer's finding 2 on
 * D1).
 */
export function phraseVersionOf(row: Pick<RunHeader, 'generator'>): number {
  return row.generator?.version ?? 1;
}

/**
 * `RunHeader.wholeItem` from a run's prepared session (RG1): whether every step the run gave the
 * learner to play lies inside the steps it judged (`firstStep`..`lastStep`, the loop's or the whole
 * item's). The steps are the item's whole sequence, one per cursor position of its own model — for
 * an excerpt, its cut's. Steps outside the span with nothing to play (the other hand's, under a hand
 * filter) are not asked of the learner, so leaving them out leaves nothing out.
 *
 * By steps, not by printed bars: a loop of bars 1 to 4 of a piece that ends *Fine* in bar 4 starts
 * and ends in the bars a whole run does, and covers a third of it.
 */
export function coversWholeItem(run: {
  steps: readonly { isEmpty: boolean }[];
  firstStep: number;
  lastStep: number;
}): boolean {
  return run.steps.every((step, index) => (index >= run.firstStep && index <= run.lastStep) || step.isEmpty);
}

/**
 * Whether a run is of a generated sight-reading phrase (C1, C4, D1a), which is what the first-reading
 * rules read: a phrase read before passes nothing, masters nothing, ticks no day, meets no rung and
 * says *not first sight* on its history line.
 *
 * Until G1 the first-reading flag alone said so — C1 wrote `unseen` on phrases and on nothing else —
 * and every reader asked `unseen !== undefined`. G1's app wrote the flag on every run the Score screen
 * recorded, as the first-contact fact; a piece played again stored then is `unseen: false` and must
 * not lose its pass. So: a phrase's recipe (every sight-read since C4), or the flag on a run whose
 * material is none but a phrase's — a sight-reading generator identity (D4), or no material at all,
 * which is a run from before D4, when only phrases carried the flag. Every row written before G1 reads
 * exactly as before, and so does every row G1's app wrote.
 *
 * Since G1a the fact has its own field (`firstContact`) and `unseen` is a phrase's again, so this is
 * the classifier for the phrase readers and for rows without a recipe, not a question a consumer of
 * general contact asks: that consumer reads `firstContact`. The relation alone never makes a run a
 * phrase.
 */
export function isPhraseRun(row: Pick<RunHeader, 'unseen' | 'recipe' | 'material'>): boolean {
  if (row.recipe !== undefined) return true;
  if (row.unseen === undefined) return false;
  const material = row.material;
  return material === undefined || (material.kind === 'generator' && material.family === 'sight-reading');
}

/**
 * The generator parameters the reader can move (C4; since C4c every option the
 * control map moves, `readingControls.ts`), in the spelling a catalog row's
 * `drill.params` uses so the two merge as they are (`sightReadingOptionsFor`).
 * `position` is one the rows never write: the melody held inside one
 * five-finger position whatever the level's range (`false`: promised beyond
 * it). The tri-state controls are C4b's: `true` promises the demand, `false`
 * keeps it out, absent is the row's own. `fifths` is a key, or a set of keys
 * the seed chooses from (the key signature's control is every key the level
 * writes with one, never a ladder, C4c).
 */
export interface ReadingMoves {
  hands?: 'right' | 'left' | 'both';
  position?: boolean;
  ledger?: boolean;
  skips?: boolean;
  leaps?: boolean;
  eighths?: boolean;
  sixteenths?: boolean;
  dottedQuarters?: boolean;
  ties?: boolean;
  syncopation?: boolean;
  triplets?: boolean;
  timeSig?: '4/4' | '6/8';
  fifths?: number | readonly number[];
  accidentals?: boolean;
  leftHand?: 'whole' | 'chord' | 'alberti' | 'broken' | 'walking';
}

/** A phrase's recipe: the row, what was moved, and whether it was the easy one on purpose. */
export interface ReadingRecipe {
  /** The catalog row (`drill.reading.…`) the phrase was generated from. */
  row: string;
  /** Only what differs from the row's own params; absent when nothing does. */
  moved?: ReadingMoves;
  /** One dimension below the learner's recipe, on purpose, for fluency (S13). */
  easy?: true;
}

/**
 * What a stored run measured (C1): the engine's measures, and — once a row is
 * older than the observation window — its per-step detail folded into bars.
 */
export interface RunObservation extends RunHeader, Partial<RunMeasures> {
  /** Per-bar tallies, where `steps` was compacted (`progressStore.compactObservation`). */
  bars?: BarTally[];
  /**
   * What this run is evidence of, and what it is not (C4 item 0): the evidence
   * function's results for the skills the item declares, computed once by the
   * Score screen when it records the run, because the played model it needs
   * exists only there. A cache of a derived value, stamped with the
   * evidence's own version (`evidenceDefinitions`, C4a): a reader uses it only
   * when that is the version in force (`evidence/readingState.ts`); a row
   * with another stamp, or none, is refreshed only by `recomputeEvidence`
   * given the played model, which nothing runs yet. Refusals are kept beside
   * the evidence, citing what they read. No observation field changes for it.
   * Compaction keeps it, every record and every count, and folds one thing
   * (CL23, L69): a measured record's per-demand step indexes (`byDemand`'s
   * `steps`, `wrong` and `unattributed`, `otherDemands`' `steps`), emptied
   * once the record is proven outside the demand readings' window — its
   * item's newest five measured records of its skill under its stamp
   * (`progressStore.compactObservation`). The demand, `n` and `right` stay,
   * which is all the other readers take.
   */
  evidence?: EvidenceResult[];
  /**
   * `EVIDENCE_DEFINITIONS` when `evidence` was computed (C4a, L66): the
   * evidence's rules and shape, independent of the observation's
   * `definitions` — the observation's rules can hold while the evidence's
   * change, and the other way round. Absent on rows C4 stored, whose evidence
   * had no stamp of its own (version 1, per skill only).
   */
  evidenceDefinitions?: number;
  /**
   * Set by the evidence job (C5, `data/evidenceJob.ts`) where it could not
   * bring this row's evidence under the version in force: that version, and
   * why. The row then contributes nothing, as any row under another version
   * does, and the job does not try it again until the version moves. Absent
   * on a row it has not tried, or has brought up to date.
   */
  evidenceRecompute?: { definitions: number; excluded: EvidenceExclusion };
}

/**
 * Why the evidence job keeps a row out (C5): recorded before each note was kept
 * or compacted to bars (`no-steps`); its exercise gone from the catalog
 * (`item-gone`); a generated phrase with no seed (`no-seed`); not a generated
 * phrase (`not-generated`); or the phrase written today is not the one the run
 * read (`phrase-differs`).
 */
export type EvidenceExclusion = 'no-steps' | 'item-gone' | 'no-seed' | 'not-generated' | 'phrase-differs';

export interface SessionRow extends RunObservation {
  id?: number;
  itemId: string;
  lessonId?: string;
  mode: string;
  tempoPct: number;
  /**
   * The run's accuracy as a fraction, or `not measured` where it measured none
   * (a run nothing heard, a drill nothing judged, C1). It was written as 0
   * there, and the history printed "0%".
   */
  accuracy: number | NotMeasured;
  accuracyEstimated: boolean;
  wrongNotes: number | NotMeasured;
  missed: number | NotMeasured;
  /**
   * A judged drill set's answered count, as its model counts it (U102): cards closed as answers, a skipped
   * card among them; taps on a rhythm set, the onsets hit and every extra tap; attempts on a Simon set (U96a).
   * `0` is a set in which nothing was answered, stored beside `accuracy: 'not measured'` — its accuracy was
   * written as 0, and the history printed "0%" under a sheet that said *Not measured*. Readers ask only
   * whether it is `0`, through the one reading (`data/accuracyReading.ts`). Absent on a drill that judges
   * nothing (it has `notesHeard`), on every run that is not a drill's, and on every drill row stored before
   * it, which that reading reads by the reviewer's compatibility order.
   *
   * Optional, so no `DB_VERSION` and no upgrade (C1's rule, above), and no row is rewritten.
   */
  answered?: number;
  durationMs: number;
  /** ISO date-time. */
  at: string;
  selfReport?: 'rough' | 'ok' | 'clean';
  /**
   * Paper runs only (replan §5.3): the standard deviation of onset offset from
   * the nearest metronome click, in ms.
   *
   * Absent when the metronome was off, when there was no MIDI, or when too few
   * notes landed near a click for the number to be evidence. Its absence means
   * "not measured" and never "measured as zero".
   */
  steadinessMs?: number;
  /** Paper runs: how many note-ons were heard. Not how many were right. */
  notesHeard?: number;
  /** The click's tempo, when there was one. */
  bpm?: number;
  /**
   * A run played as a performance (replan §8): started once, no restarts and
   * no looping, and recorded as such whatever the accuracy came out at.
   *
   * The point is not the score. It is that playing a piece through for
   * somebody is a different act from practising it, and the Progress screen
   * lists them separately so the owner can see he has actually done it.
   */
  performance?: boolean;
  /**
   * `1` on a performance and absent on every other run (CL23, L53): what the
   * `byPerformance` index keys, beside `at`, because `performance` itself is a
   * boolean and IndexedDB keys no boolean. Derived from `performance`, never
   * written on its own (`withPerformanceMark`).
   */
  performanceMark?: 1;
  /**
   * A rhythm-only run (`05` §3a): timing judged, pitches not, so the row is
   * practice but never a pass, and the history can say so.
   */
  rhythmOnly?: boolean;
  /**
   * Whether the run measured a tempo (T37).
   *
   * `false` on a Wait for me run, whose `tempoPct` is the slider's setting and
   * not anything played to, and on a run nothing was listening to. Absent on
   * rows written before it existed and on the writers that do not say (a drill,
   * paper), which read as they always did.
   */
  tempoMeasured?: boolean;
  /**
   * The generated phrase's seed, on a sight-reading run (T37).
   *
   * What makes a retry on the same music tellable from a new phrase: the Score
   * screen refuses a second first attempt at a phrase whose seed is already in
   * a row, which is what re-opening today's read used to be — the seed under
   * the same version since D1a (`generator`, absent meaning version 1).
   */
  seed?: number;
}

/**
 * A session row as the `byPerformance` index needs it (CL23, L53): `performanceMark` present
 * exactly when `performance` is `true`. The one definition every writer of a row uses — the
 * version 10 upgrade for the rows already stored, `recordRun` for a new run, `importAll` for a
 * restored one — so the index finds what the boolean says, whoever wrote the row. A row already
 * right comes back as it was.
 */
export function withPerformanceMark<T extends Pick<SessionRow, 'performance' | 'performanceMark'>>(row: T): T {
  const performed = row.performance === true;
  if (performed === (row.performanceMark === 1)) return row;
  if (performed) return { ...row, performanceMark: 1 };
  const { performanceMark: _mark, ...rest } = row;
  return rest as T;
}

export type ImportKind = 'musicxml' | 'pdf';

export interface ImportRow {
  id: string;
  kind: ImportKind;
  title: string;
  /** MusicXML text, or the PDF's bytes. */
  data: string | ArrayBuffer;
  /**
   * How big `data` is, in real bytes, written when the row is.
   *
   * Recorded rather than measured because measuring means loading the file,
   * and the one screen that wants the number is the storage report — the
   * screen the owner opens *because* storage is tight. It is also the only way
   * to be honest about text: `String.length` is UTF-16 code units, and the
   * report puts its total beside `navigator.storage.estimate()`, which is
   * bytes. A MusicXML score full of accented composer names was being
   * under-reported against a real measurement.
   *
   * Optional because rows written before this existed do not have it; the
   * reader fills it in for those from the row it has already loaded.
   */
  bytes?: number;
  tags: string[];
  level?: number;
  addedAt: string;
  /** PDF only: corrected system cut lines per page, in page coordinates. */
  cuts?: Record<number, number[]>;
  /**
   * The rungs this piece is an option of (replan §4.3).
   *
   * This is what stops an imported score "sitting outside the curriculum":
   * `curriculum/load.ts` appends it to each named lesson's `songOptions` at
   * runtime, so it counts toward completion, appears in swaps and can be
   * picked by the session builder like anything bundled.
   */
  lessonIds?: string[];
  /** Concepts it trains — the rung's, unless the owner edited them. */
  concepts?: string[];
  /**
   * Where the level came from. `estimated` is the runtime model's guess
   * (§4.4); it becomes `judged` the moment the owner types a number, because
   * he is a better source than the estimate he is overruling.
   */
  levelSource?: 'estimated' | 'judged';
  /**
   * The folder row this came from, when it came from one.
   *
   * The folder screen has to know which of its 37,261 rows are already in the
   * library, and it used to answer by matching titles — which greys out the
   * five other *Entertainer*s and the dozens of *Minuet in G*s the moment one
   * is added. The file name inside the folder is the identity that actually
   * distinguishes them. Absent on anything imported by share or picker, which
   * is why the title fallback stays.
   */
  origin?: { folder: string; file: string };
  /**
   * What the app's detectors measured on the score when it was imported, and again
   * whenever the learner corrects its hands (E0; R34's truth half), with the
   * counts the one gate's density judgement reads (`importStore.measureImport`).
   * `'unmeasured'` with the reason in `measurement` for a PDF or a score the app
   * could not read. Absent on a row imported before E0: it reads as unmeasured.
   */
  demands?: string[] | 'unmeasured';
  measurement?: Measurement;
  /**
   * Where the score came from and how each fact about it is known (E0; R35, Part 21
   * §B): what came from the file, what the converter inferred and by which version,
   * what the learner corrected. Inferred, measured and learner-supplied facts are
   * never flattened into one field.
   */
  provenance?: Provenance;
}

export interface PlanRow {
  id: 'current';
  stage: number;
  unitId: string;
  trackOrder: string[];
  placement?: { unitId: string; at: string };
  /**
   * The learner's word about a rung (C5): "I already know this" (`known`) or
   * *Mark done* (`done`), when. Kept about the rung and apart from the
   * evidence: it never meets a requirement, and it sets the rung aside in the
   * recommendation the way a placement sets aside the rungs behind it. It
   * replaced marking the rung's items passed, which credited every other rung
   * listing them. Absent: none said.
   */
  rungWords?: Record<string, { kind: 'known' | 'done'; at: string }>;
  /**
   * The rungs done under the old rule (a count of passed items) before C5,
   * carried over once on the first open of C5's code (`evidence/carryOver.ts`),
   * and when. Shown apart as done before the app judged rungs by evidence, set
   * aside like the learner's word, never met. Absent: nothing to carry, or
   * never looked.
   */
  carriedOver?: { at: string; rungs: string[] };
}

export interface StreakRow {
  id: 'streak';
  /** ISO date -> minutes practised that day. */
  minutesByDay: Record<string, number>;
  weeklyGoalMinutes: number;
}

/**
 * A row of the `skills` store since C7: a concept the retired store had as
 * learning or known, kept only as an exposure dated the day it was carried
 * over — the ladder's first state, *introduced*, and never evidence, a met
 * requirement or an encounter with any material (`data/skillsStore.ts`). The
 * app writes nothing else here.
 */
export interface SkillRow {
  conceptId: string;
  exposedAt: string;
}

/**
 * A row as the store held it before C7 — its own truth per concept, written by
 * the lesson page and *I already know this*, read with a thirty-day calendar
 * for "rusty". Read once by the migration, which turns it into a `SkillRow`
 * (or drops it, for `unseen`); an older backup restores rows of this shape.
 */
export interface LegacySkillRow {
  conceptId: string;
  state: 'unseen' | 'learning' | 'known';
  lastReviewedAt?: string;
}

/**
 * The owner's own difficulty number for one item (replan §1.4).
 *
 * Most levels outside the authored material are *estimated* — from the opus,
 * or from a group of pieces banded together on import — and an estimate that
 * feels wrong is worth one tap to fix. An override wins over the catalog
 * everywhere a level is read, and re-levelling an item also makes it count as
 * judged: the owner playing it is a better source than the estimate was.
 */
export interface LevelOverrideRow {
  itemId: string;
  level: number;
  /** ISO date-time, so a later import can prefer the newer of two. */
  at: string;
}

/**
 * The non-run encounters (G1; Part 27, L97): the notation drawn for the learner on the Score screen
 * (`viewed`, once per visit), the piece played to them because they asked to hear it (`heard`: *Play
 * it to me*, a Listen run), and the app demonstrating it (`demonstrated`: *Hear it*, a bar held down).
 * A playback writes one kind, by the learner's action, never two. Runs are not here: `attempted`,
 * `practised` and `performed` are the runs' own (`sessions`, and `contacts` for those the cap deleted).
 */
export type EncounterKind = 'viewed' | 'heard' | 'demonstrated';

/** What an encounter was of: a known material (D2's `Identity`, never `none`), or the item id where there is none. */
export type EncounterMaterial = Exclude<Identity, { kind: 'none' }> | { kind: 'id'; itemId: string };

/** What opened the screen the encounter happened on, as `RunHeader.opened` says it of a run. */
export interface EncounterSource {
  tab: string;
  /** The Today slot that opened it, where a card did. */
  slot?: TodaySlot;
  /** The rung that opened it or judges its runs (`?from=`, `?rung=`). */
  rung?: string;
  tour?: string;
  /** Opened from Today's transfer offer (D4). */
  intent?: 'transfer';
}

/** One encounter that is not a run (G1). Small, never pruned, carried by the backup. */
export interface EncounterRow {
  /** `<visit>:<n>`: unique, and the same after a restore, so restoring a backup twice adds nothing. */
  id: string;
  /** `material.materialKey` of the material, or `id:<itemId>`: what the `byKey` index finds it by. */
  key: string;
  material: EncounterMaterial;
  itemId: string;
  kind: EncounterKind;
  /** ISO date-time. */
  at: string;
  source: EncounterSource;
  /**
   * The visit it happened on: one opening of the Score screen (a reload, a return and a second tab
   * are each another), minted when the screen opens. First contact compares visits, never times: the
   * viewing reading needs is this visit's; one from any other visit is prior contact.
   */
  visit: string;
  /**
   * The printed bars it covered — 1-based positions in the item's own score, a pickup counted as bar
   * 1, as `provenance.excerpt` counts them (E1) — where it covered only some: a held bar, a section
   * played to the learner. Absent: the whole.
   */
  bars?: [number, number];
}

/**
 * What one run the retention cap deleted leaves behind, merged with others of its material (G1; the
 * reviewer's required change, `docs/review/responses/7863bee.md`): what happened — `performed` for a
 * performance take (`SessionRow.performance`), `practised` for any other run, and every span an
 * attempt — over which printed bars (1-based positions in the run's own item, as `EncounterRow.bars`;
 * absent, the whole), when first and last, and from which screens.
 */
export interface ContactSpan {
  run: 'practised' | 'performed';
  bars?: [number, number];
  first: string;
  last: string;
  /** `opened.tab`, with `:slot` where a Today card opened it; `not measured` where the run did not say. */
  sources: string[];
}

/**
 * The durable summary of the deleted runs of one material (G1): the encounter projection only —
 * material or the id, the item ids, the spans — never evidence, accuracy or a verdict. Written in the
 * transaction that deletes the runs (`progressStore.pruneSessions`), merged idempotently
 * (`progressStore.mergeSummaries`), carried by the backup. A live run is never copied here.
 */
export interface ContactSummaryRow {
  /** `material.materialKey`: one row per material, or per item id for runs that knew none. */
  key: string;
  material: EncounterMaterial;
  /** The item ids the runs were stored under. */
  itemIds: string[];
  /** Folded from runs that knew no material (a legacy run, or `none`): the facts rest on the id alone. */
  byId: boolean;
  spans: ContactSpan[];
}

/**
 * What the learner says they are doing with a piece (G1b; R19, Part 27's list). *Exploring* is the
 * absence of a row: meeting a piece, playing it once, passing it, makes no project.
 *
 * - `saved` — "Save for later": the piece kept to come back to.
 * - `learning` — "Learn this", before or after any success.
 * - `polishing` — "Prepare it for performance".
 * - `performance-ready` — "It is ready".
 * - `maintaining` — "Keep it playable", or "I performed it" with the day it was performed.
 * - `refreshing` — "Bring it back", from paused, put away or kept playable: relearning while the
 *   encounter history truthfully says the music is familiar (R47).
 * - `paused` — "Pause". `retired` — "Put it away". Neither deletes anything.
 */
export type ProjectState =
  | 'saved'
  | 'learning'
  | 'polishing'
  | 'performance-ready'
  | 'maintaining'
  | 'refreshing'
  | 'paused'
  | 'retired';

/** The learner's action on the project sheet that entered a state (`projectStore.ACTION_STATE`). */
export type ProjectAction = 'save' | 'learn' | 'polish' | 'ready' | 'performed' | 'keep' | 'bring-back' | 'pause' | 'retire';

/** One line of a project's history: the state entered, when, and by which action of the learner's. */
export interface ProjectStep {
  state: ProjectState;
  /** ISO date-time the learner chose it. */
  at: string;
  /** The action: two states can be entered two ways (`maintaining` by "Keep it playable" or "I performed it"). */
  why: ProjectAction;
  /**
   * "I performed it": the day the learner says they performed it (`YYYY-MM-DD`, local), a fact they
   * state about the project — never a performance run, an encounter, a result or evidence (the
   * reviewer's ruling on G1b). Absent on every other action.
   */
  performedOn?: string;
}

/** A passage the learner named (R18): printed bars, 1-based, within the piece's own bars. */
export interface ProjectSection {
  from: number;
  to: number;
  label: string;
}

/**
 * One project (G1b): the learner's stated relationship with one piece. Keyed by the piece's material
 * where it has one (`material.materialKey`: an import's stored bytes, a notated item's built file),
 * so two catalogue ids of one file are one project; by the item id where it has none, and then never
 * another id's. `since` is when the current state was entered; `history` every state the project
 * has been in, appended and never rewritten. `goal`, `problem` and `sections` are the learner's own
 * words (R18), and choose nothing. Read by the project sheet, Progress and Stage 9's page — never
 * by evidence, skill, eligibility or session code. Carried by the backup, cleared by *Reset progress*.
 */
export interface ProjectRow {
  /** `material.materialKey` of the material, or `id:<itemId>`. */
  id: string;
  material: EncounterMaterial;
  /** The id the project was made under. */
  itemId: string;
  state: ProjectState;
  /** ISO date-time the current state was entered. */
  since: string;
  history: ProjectStep[];
  /** This week's goal, as the learner typed it. */
  goal?: string;
  /** The current problem, as the learner typed it. */
  problem?: string;
  sections?: ProjectSection[];
}

/** One score sitting in a folder on the phone (docs/04 §4b). */
export interface FolderScore {
  /** Path relative to the picked folder, e.g. `bb/Qmbb4….mxl`. The identity. */
  file: string;
  title: string;
  composer: string;
  /** Estimated, not measured, when it came from a manifest — the row says so. */
  level: number | null;
  bars: number | null;
  status: string;
  style: string;
  rating: number;
  ratings: number;
  views: number;
  lyrics: boolean;
  /** The manifest's own title is mojibake; only the source has the real one. */
  garbled: boolean;
  museScore: string;
}

/** Where a listing came from, and so what it can be trusted to know. */
export type FolderListing = 'manifest' | 'walk' | 'partial';

/**
 * One score in one folder, as its own record.
 *
 * **This used to be an element of `FolderLibraryRow.scores`, and that was the
 * fault.** IndexedDB cannot read or write part of a record, so a listing held
 * as one array meant that every operation cost the whole 37,261 of it: opening
 * the browse screen deserialized some forty megabytes to draw a screenful, and
 * taking one dead row out of the listing read the array, copied it, and wrote
 * all of it back. One record per score makes both of those proportional to
 * what is actually wanted — a page of sixty rows, or one row.
 *
 * The key is `[folder, file]`, which is the identity the rest of the app
 * already uses: `ImportRow.origin` is exactly that pair.
 */
export interface FolderScoreRow extends FolderScore {
  /** The folder this sits in. First half of the key and of `byTitle`. */
  folder: string;
  /**
   * The title, folded — accents off, lower-cased — which is what `byTitle` is
   * an index on.
   *
   * Stored rather than derived because an index can only be built on a field
   * that is in the record, and it is what turns the A-to-Z rail from a walk of
   * the listing into a key-range seek.
   */
  sort: string;
  /**
   * ISO date-time at which the file behind this row was found to be gone.
   *
   * Marked rather than deleted: a rescan run while the card is out would
   * otherwise throw away the whole listing, and a row that comes back should
   * come back as itself. A marked row is left out of the folder's index, so
   * nothing lists it, and a later scan that finds the file clears the mark.
   */
  missingAt?: string;
}

/**
 * The compact per-folder index the browse screen filters over.
 *
 * `ui/screens/FolderScreen.ts` already folds every title once at load into
 * parallel arrays and filters over *those* on each keystroke — that part was
 * always right. What was wrong is where the arrays came from: they were built
 * by reading all 37,261 full rows, which is forty-odd megabytes of structured
 * clone to produce about two of index. So the arrays are stored, and opening
 * the screen reads this record instead of the rows. The rows are then fetched
 * by key, for the sixty that are about to be drawn.
 *
 * Everything here is parallel to `files` and in the same order, which is the
 * order the listing is drawn in.
 */
export interface FolderIndexRow {
  /** The folder's name — the same key `folderLibraries` uses. */
  id: string;
  /** Each row's path, which is also the second half of its record's key. */
  files: string[];
  /** `fold(title + ' ' + composer)` — what the search box matches against. */
  haystacks: string[];
  /**
   * One character per row: the letter it files under, packed into a single
   * string rather than an array of 37,261 one-character strings.
   */
  letters: string;
  /** `NaN` where a row has no level, which is not the same as level 0. */
  levels: Float64Array;
  /** The distinct styles, sorted — which is also what the filter's menu lists. */
  styleNames: string[];
  /** An index into `styleNames` per row. Low-cardinality, so a dictionary. */
  styles: Uint16Array;
  /** The distinct statuses. Same dictionary trick, same reason. */
  statusNames: string[];
  statuses: Uint16Array;
  /** 1 where `rating >= 4 && ratings >= 5` — all the rated filter asks. */
  rated: Uint8Array;
  /** How many rows are titled with a placeholder or a content hash. */
  unnamed: number;
}

/**
 * A folder of scores the owner pointed the app at — the folder itself, not
 * its contents.
 *
 * The rows are kept and the *files* are not: Android grants a folder for one
 * visit only unless a handle was kept (see `folderLibrary.ts`), so a
 * stored handle is not on offer. Keeping the listing means browsing 37,000
 * scores works with nothing plugged in; adding one asks for the folder again.
 *
 * The scores themselves live in `folderScores`, one record each, and the index
 * the screen filters over lives in `folderIndexes`. This row is the handful of
 * facts about the folder as a whole, so reading every saved folder — which is
 * what the screen does first, on every visit — is a few small records.
 */
export interface FolderLibraryRow {
  /** The folder's own name, which is all Android tells us about where it is. */
  id: string;
  addedAt: string;
  /** From the folder's `library.json`, when it had one. */
  source: string | null;
  /** Listable rows — every score in the folder bar the ones marked missing. */
  count?: number;
  /** How the listing was made, and so what it cannot know. */
  listedFrom?: FolderListing;
  /** Top-level folders an interrupted walk has still to index. */
  pending?: string[];
  /**
   * Paths marked missing since the index was last built.
   *
   * Kept here, in the small record, rather than folded into the index: a row
   * dropping out is a one-row change, and rebuilding the index for it would
   * put a megabyte-and-a-half write back on the path this whole shape exists
   * to take it off. The next scan rebuilds the index without them and empties
   * this, so it stays as short as the number of files deleted between scans.
   */
  missing?: string[];
  /**
   * A `FileSystemDirectoryHandle`, when the browser gave one and the owner
   * asked for it to be kept (the `folderHandles` setting).
   *
   * Typed as `unknown` because it is a live browser object IndexedDB stores by
   * structured clone, not a shape this file should describe;
   * `data/folderLibrary.ts` is the only thing that opens it, and it checks
   * before using it. Absent on every folder picked the ordinary way.
   */
  handle?: unknown;
  /**
   * The whole listing, as every build before version 6 wrote it.
   *
   * Not written any more. It is still read, once, by `folderLibrary.ts`'s
   * `folderIndex()`: a row in this shape is split into records and an index
   * the first time the folder is opened, and the field is dropped. Doing it
   * there rather than in the `upgrade` block is deliberate — rewriting 37,261
   * records inside a `versionchange` transaction blocks every other connection
   * to the database for as long as it takes, and a blocked open at start-up is
   * precisely the failure `app/boot.ts` is written around.
   */
  scores?: FolderScore[];
}

/**
 * One piece inside a book on the shelf (replan §5.1).
 *
 * Registered by hand: the owner is looking at paper and types a page number.
 * Nothing is scanned and nothing is inferred — that is the honest input, and
 * it is why `page` is a number he read rather than something OMR guessed.
 */
export interface BookPiece {
  id: string;
  title: string;
  /** Page in the book. Opens the linked PDF there, when there is one. */
  page?: number;
  /** Bars this piece occupies, when he wants only part of a page. */
  bars?: [number, number];
  /** Rungs it is an option of — the same overlay mechanism as an import. */
  lessonIds: string[];
  concepts: string[];
  level?: number;
  levelSource: 'estimated' | 'judged';
  /**
   * A MusicXML twin: an import, or a bundled item linked by search.
   *
   * This is what makes a paper piece *scorable*. With a twin the Score screen
   * can run it properly and credit the book piece too; without one the paper
   * screen measures only what it can actually hear (replan §5.3).
   */
  itemId?: string;
}

/**
 * A book the owner owns, on paper (replan §5.1).
 *
 * The app has no copy of it and never will. What it has is a list of what is
 * in it and which rung each piece answers, so a rung can say "or the
 * equivalent in your book" and mean something specific.
 */
export interface BookRow {
  /** `book.<slug>`. */
  id: string;
  title: string;
  author?: string;
  kind: 'method' | 'repertoire' | 'other';
  /** The owner's own PDF of it, if he has one, as an import id. */
  pdfImportId?: string;
  /** For the PDF viewer's timed mode. Per book, not per open. */
  barsPerSystem?: number;
  pieces: BookPiece[];
  addedAt: string;
}

interface PianoPathDb extends DBSchema {
  settings: { key: string; value: unknown };
  progress: { key: string; value: ProgressRow };
  sessions: { key: number; value: SessionRow; indexes: { byItem: string; byDate: string; byPerformance: [number, string] } };
  imports: { key: string; value: ImportRow };
  plan: { key: string; value: PlanRow };
  streak: { key: string; value: StreakRow };
  micCalibration: { key: string; value: unknown };
  skills: { key: string; value: SkillRow | LegacySkillRow };
  levelOverrides: { key: string; value: LevelOverrideRow };
  folderLibraries: { key: string; value: FolderLibraryRow };
  folderScores: {
    key: [string, string];
    value: FolderScoreRow;
    indexes: { byTitle: [string, string] };
  };
  folderIndexes: { key: string; value: FolderIndexRow };
  books: { key: string; value: BookRow };
  encounters: { key: string; value: EncounterRow; indexes: { byKey: string; byItem: string } };
  contacts: { key: string; value: ContactSummaryRow };
  projects: { key: string; value: ProjectRow; indexes: { byItem: string } };
}

let dbPromise: Promise<IDBPDatabase<PianoPathDb> | null> | null = null;

/**
 * Whether a version bump is being held up by a connection somewhere else, and
 * by which version.
 *
 * `null` is the ordinary state. It becomes a value when `blocked` fires, which
 * means another page — another tab, or the outgoing page of a service-worker
 * update's own reload — still holds this database open at the older version.
 * The screen that can say something useful about it is the storage report.
 */
export interface DatabaseBlock {
  /** The version this page is trying to open at. */
  wanted: number;
  /** The version the connection in the way is holding, when it says. */
  held: number | null;
  /** True once the open gave up waiting and the app fell back to memory. */
  gaveUp: boolean;
}

let block: DatabaseBlock | null = null;

/** What is holding the database open at an older version, if anything. */
export function databaseBlock(): DatabaseBlock | null {
  return block;
}

/**
 * How long a blocked open waits before the app carries on without a database.
 *
 * The alternative is what used to happen, and it is much worse than no
 * storage: a blocked `open()` never fires `success` *or* `error` — only the
 * silent `blocked` event — so `hydratePersisted()` never settled, and
 * `app/boot.ts`'s own note records the result, which was a launch with no tab
 * bar at all. Every store above this one already falls back to memory for the
 * session when there is no database, so giving up is a degraded app rather
 * than a dead one, and the storage report says which it is. The real open is
 * left running: whichever call comes next gets it once the other connection
 * has gone away.
 */
export const BLOCKED_GIVE_UP_MS = 4000;

export function openDatabase(): Promise<IDBPDatabase<PianoPathDb> | null> {
  // `openDB` throws synchronously rather than rejecting when there is no
  // IndexedDB at all, which is the case in a test environment and in a
  // browser with site data blocked — so the guard has to come first.
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (dbPromise === null) {
    // Asked alongside the first open rather than from a screen: by the time a
    // screen could ask, rows have already been written in best-effort mode.
    askToPersist();
    dbPromise = openBounded();
  }
  return dbPromise;
}

function openBounded(): Promise<IDBPDatabase<PianoPathDb> | null> {
  let settle: (db: IDBPDatabase<PianoPathDb> | null) => void = () => undefined;
  const bounded = new Promise<IDBPDatabase<PianoPathDb> | null>((resolve) => {
    settle = resolve;
  });
  let done = false;
  const finish = (db: IDBPDatabase<PianoPathDb> | null): void => {
    if (done) return;
    done = true;
    settle(db);
  };

  const open = openDb();
  void open.then((db) => {
    // The request that was blocked has come through after all, which means the
    // connection in the way has closed. Nothing to report any more.
    if (db !== null && block !== null && !block.gaveUp) block = null;
    finish(db);
  });
  return bounded;

  function openDb(): Promise<IDBPDatabase<PianoPathDb> | null> {
    return openDB<PianoPathDb>(DB_NAME, DB_VERSION, {
      // `oldVersion` is 0 on a fresh database and the previous version on an
      // upgrade, so each block runs exactly once and a phone that has been on
      // version 1 since P7 keeps every row it has.
      upgrade,
      /**
       * Something else is holding the old version open, so this open will not
       * complete until it lets go.
       *
       * There was no handler here at all, and that is the hole `app/boot.ts`
       * describes: the spec fires neither `success` nor `upgradeneeded` while
       * an open is blocked, so the promise simply never settled and everything
       * awaiting it waited for ever. Two things change that. The other page now
       * closes itself (see `blocking`), which fixes it outright whenever both
       * pages are running this code; and when the page in the way is an older
       * build that has no such handler, this bounds the wait.
       */
      blocked(currentVersion, blockedVersion) {
        block = { wanted: blockedVersion ?? DB_VERSION, held: currentVersion, gaveUp: false };
        setTimeout(() => {
          if (done) return;
          if (block) block.gaveUp = true;
          // The next caller waits on the real open rather than starting a
          // second one, so the moment the other connection goes away the app
          // has its database back without a reload.
          dbPromise = open;
          finish(null);
        }, BLOCKED_GIVE_UP_MS);
      },
      /**
       * This connection is what is standing in another one's way.
       *
       * The other side of the same fault, and the half that actually cures it:
       * a service-worker update reloads the page, the outgoing page's
       * connection is not reliably gone before the incoming page asks to open
       * at the bumped version, and the incoming page then blocks on a
       * connection nobody is using. Letting go at once costs this page
       * nothing — `dbPromise` is cleared, so the next read reopens, by which
       * time the upgrade will have happened.
       */
      blocking() {
        const held = dbPromise;
        dbPromise = null;
        void held?.then((db) => {
          db?.close();
        });
      },
      /**
       * The browser closed the connection underneath us — storage cleared, or
       * the tab evicted. Forgetting it means the next read opens a fresh one
       * instead of calling into a dead handle for the rest of the session.
       */
      terminated() {
        dbPromise = null;
      },
    }).catch(() => null);
  }
}

/** The transaction an upgrade runs in — every store, at `versionchange`. */
type UpgradeTx = IDBPTransaction<PianoPathDb, StoreNames<PianoPathDb>[], 'versionchange'>;

// `oldVersion` is 0 on a fresh database and the previous version on an
// upgrade, so each block runs exactly once and a phone that has been on
// version 1 since P7 keeps every row it has.
function upgrade(
  db: IDBPDatabase<PianoPathDb>,
  oldVersion: number,
  _newVersion: number | null,
  tx: UpgradeTx,
): void {
      if (oldVersion < 1) {
        db.createObjectStore('settings');
        db.createObjectStore('progress', { keyPath: 'itemId' });
        const sessions = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        sessions.createIndex('byItem', 'itemId');
        sessions.createIndex('byDate', 'at');
        db.createObjectStore('imports', { keyPath: 'id' });
        db.createObjectStore('plan', { keyPath: 'id' });
        db.createObjectStore('streak', { keyPath: 'id' });
        db.createObjectStore('micCalibration');
        db.createObjectStore('skills', { keyPath: 'conceptId' });
      }
      if (oldVersion < 2) {
        db.createObjectStore('levelOverrides', { keyPath: 'itemId' });
      }
      if (oldVersion < 3) {
        db.createObjectStore('folderLibraries', { keyPath: 'id' });
      }
      if (oldVersion < 4) {
        // `imports` gains three optional fields, so no store is created and
        // nothing has to be rewritten to be readable. One thing is worth
        // saying explicitly, though: a level on an import that predates P15
        // was typed by the owner in the edit sheet, so it is judged, not
        // estimated. Left unset it would later be printed as `≈`, which would
        // be the app telling him his own number was a guess.
        if (oldVersion >= 1) {
          void (async () => {
            let cursor = await tx.objectStore('imports').openCursor();
            while (cursor) {
              const row = cursor.value;
              if (row.level !== undefined && row.levelSource === undefined) {
                await cursor.update({ ...row, levelSource: 'judged' });
              }
              cursor = await cursor.continue();
            }
          })();
        }
      }
      if (oldVersion < 5) {
        // The shelf (replan §5.1). A whole store rather than a field, because
        // a book is a thing in its own right: it has pieces, and a piece has
        // its own rungs, page and level.
        db.createObjectStore('books', { keyPath: 'id' });
      }
      if (oldVersion < 6) {
        // The stores are made here; the listings already on the phone are
        // **not** moved into them here. A `versionchange` transaction holds
        // every other connection to the database shut for as long as it runs,
        // and rewriting the owner's 37,261 rows inside one would do that at
        // start-up, which is exactly the blocked-open failure `app/boot.ts` is
        // written around. `folderLibrary.ts`'s `folderIndex()` splits an old
        // row the first time that folder is opened instead — on a screen that
        // already has somewhere to say it is working, and where nothing else
        // is waiting on the answer.
        const scores = db.createObjectStore('folderScores', { keyPath: ['folder', 'file'] });
        // Lower-cased and accent-folded, so the A-to-Z rail is a seek over a
        // key range rather than a walk of the listing.
        scores.createIndex('byTitle', ['folder', 'sort']);
        db.createObjectStore('folderIndexes', { keyPath: 'id' });
      }
      // Guarded on the store: a database some other code opened at an older
      // version without making the stores (a test's stand-in for another tab)
      // has nothing to carry, and a write to a missing store would abort the
      // whole upgrade.
      if (oldVersion >= 1 && oldVersion < 7 && db.objectStoreNames.contains('settings')) {
        // C5: a record the old rule read, from before rungs were judged by
        // evidence. One flag in the upgrade, nothing rewritten here (the
        // reason v6 gives); the carry-over itself runs later, on the evidence
        // job, where nothing is waiting on it.
        void tx.objectStore('settings').put(true, CARRY_OVER_DUE_KEY);
      }
      if (oldVersion < 8) {
        // G1: two stores made, nothing else touched or rewritten. What the
        // learner met beside the runs, found by material; and one durable
        // summary per material of the runs the retention cap deleted.
        const encounters = db.createObjectStore('encounters', { keyPath: 'id' });
        encounters.createIndex('byKey', 'key');
        encounters.createIndex('byItem', 'itemId');
        db.createObjectStore('contacts', { keyPath: 'key' });
      }
      if (oldVersion < 9) {
        // G1b: one store made, nothing else touched or rewritten, and nothing
        // carried into it — a passed piece is no project until the learner says so.
        const projects = db.createObjectStore('projects', { keyPath: 'id' });
        projects.createIndex('byItem', 'itemId');
      }
      // Guarded on the store, as version 7 is: a test's stand-in for another
      // tab may have opened a version without making it.
      if (oldVersion < 10 && db.objectStoreNames.contains('sessions')) {
        // CL23 (L53): the performances' index, over the marker and the date, so
        // the newest performance is the index's last entry however many runs
        // came after it. Every row already stored is read once, here, and only a
        // performance is written (`withPerformanceMark`): no other row, no key and
        // no other field changes. A fresh database has nothing to mark.
        const sessions = tx.objectStore('sessions');
        if (!sessions.indexNames.contains('byPerformance')) sessions.createIndex('byPerformance', ['performanceMark', 'at']);
        if (oldVersion >= 1) {
          void (async () => {
            let cursor = await sessions.openCursor();
            while (cursor) {
              const row = cursor.value;
              const marked = withPerformanceMark(row);
              if (marked !== row) await cursor.update(marked);
              cursor = await cursor.continue();
            }
          })();
        }
      }
}

/**
 * Whether the browser has promised not to evict this app's storage.
 *
 * `null` until the question has been put, which `openDatabase()` does the
 * first time anything opens the database.
 */
export type PersistenceState = 'persisted' | 'best-effort' | 'unavailable' | null;

let persistence: PersistenceState = null;

/** What `navigator.storage.persist()` answered, or `null` before it was asked. */
export function persistenceState(): PersistenceState {
  return persistence;
}

/**
 * Asks the browser to stop treating this app's storage as disposable.
 *
 * **Nothing in the app asked, and everything in it is local.** IndexedDB
 * starts in best-effort mode, which means the browser is free to throw the
 * whole origin away when the device runs short of space — and what it would be
 * throwing away is the practice history, the progress, the imported scores and
 * the folder listing, none of which exists anywhere else. There is no server
 * copy to come back from.
 *
 * Asked once, from here, because this is the one place every store goes
 * through and because it has to be asked *before* the answer matters rather
 * than from a screen the owner may never open. Chrome grants it silently for
 * an installed PWA — installation is one of the signals it scores — so on the
 * phone this is expected to be a promotion with no prompt at all; a browser
 * that would prompt instead is one where the app is not installed, and there
 * the answer is simply no and nothing is worse than it was.
 *
 * Fire and forget: the answer changes what the storage report says and nothing
 * else. A failure is an answer too.
 */
function askToPersist(): void {
  const storage = (globalThis as { navigator?: { storage?: StorageManager } }).navigator?.storage;
  if (typeof storage?.persist !== 'function') {
    persistence = 'unavailable';
    return;
  }
  void (async () => {
    try {
      // Already granted is the common case after the first launch, and asking
      // again is free — but `persisted()` is cheaper and never prompts.
      const already = (await storage.persisted?.()) ?? false;
      persistence = already || (await storage.persist()) ? 'persisted' : 'best-effort';
    } catch {
      persistence = 'unavailable';
    }
  })();
}

/* ---------------------------------------------------------------------------
 * Storage Buckets: considered, and the answer is no.
 *
 * The API splits an origin's storage into named buckets, each with its own
 * durability, persistence and expiry, and — the part that would matter here —
 * its own eviction. So it looks made for this app's one real asymmetry: the
 * folder listing (`folderScores` and `folderIndexes`, some 6 MB of it) is the
 * only thing in the database that can be rebuilt, because the files it
 * describes are on the phone and one folder pick reads them again. Everything
 * else — the practice history, the progress, the imported scores — exists
 * nowhere else at all. A bucket per class would let a phone running short of
 * space throw away the rebuildable half and keep the year of practice.
 *
 * It is still the wrong trade, for three reasons that do not depend on which
 * Chrome the phone is running:
 *
 *   1. **A bucket is a separate IndexedDB namespace.** `bucket.indexedDB`
 *      opens a *different* database from `indexedDB`, with its own version
 *      ladder, its own upgrades and its own `blocked` path. The change this
 *      file has just been through exists because one blocked open left the app
 *      shell unmounted; doubling the number of connections that can block, to
 *      protect 6 MB that a folder pick rebuilds, is paying in the currency
 *      that has already cost the most.
 *   2. **The line is already drawn, and drawn for free.** `STORE_NAMES` below
 *      leaves the folder stores out of the backup for exactly the reason a
 *      bucket would be created: they are rebuildable. Eviction and export want
 *      the same answer, and one list gives it.
 *   3. **`persist()` makes the question moot in the case that matters.** An
 *      installed PWA is expected to be granted persistence, and a persisted
 *      origin is not evicted — so there is nothing to prioritise. When it is
 *      *not* granted, the browser evicts the whole origin rather than choosing
 *      within it, and a bucket would then be the difference between losing the
 *      listing and losing everything. That is the case worth revisiting, and
 *      the storage report now says when the app is in it (Settings →
 *      Content: "Storage is best-effort…").
 *
 * Revisit when both halves are true on the phone: `navigator.storageBuckets`
 * exists there, *and* the report says best-effort. Until then this is a
 * mechanism with no risk to answer.
 * ------------------------------------------------------------------------- */

/**
 * Every store name, in the order an export writes them.
 *
 * `folderLibraries` is deliberately absent, and so are `folderScores` and
 * `folderIndexes` for the same reason. Between them they are a 6 MB listing of
 * files that are on the phone anyway, rebuilt by pointing at the folder again
 * — putting it in the backup would multiply the size of the one file that
 * holds a year of practice, to save a single tap.
 *
 * `encounters` and `contacts` (G1) are in it: what the learner met is learner
 * history, and follows a restore (U31, E10). So is `projects` (G1b): what the
 * learner said they are doing with a piece is theirs, and no other copy exists.
 */
export const STORE_NAMES = [
  'settings',
  'progress',
  'sessions',
  'imports',
  'plan',
  'streak',
  'micCalibration',
  'skills',
  'levelOverrides',
  'books',
  'encounters',
  'contacts',
  'projects',
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

/** Test hook: forgets the cached handle so a fresh database is opened. */
export function resetDatabaseForTest(): void {
  dbPromise = null;
  block = null;
  persistence = null;
}
