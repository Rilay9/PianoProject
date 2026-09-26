/**
 * The evidence recompute job's rules (C5; L78, L66): which stored rows carry
 * evidence under another version, how their phrase is written again, how the
 * phrase written today is checked against the one the learner read, and what
 * is kept out, with the reason. The rules are pure and tested as such; the
 * job below them runs them in the browser, paced so it never holds up a
 * screen (`startEvidenceJob`). Here and not in `evidence/`, because writing
 * a phrase again is the reader's and the generator's business, which the
 * evidence modules are kept from knowing (C4a).
 *
 * **Why it exists.** The evidence on a row is a cache of a derived value,
 * stamped with the evidence's own version (`EVIDENCE_DEFINITIONS`, C4a). A row
 * stamped with another version, or with none, contributes nothing to the
 * reader or to `rungState` until it is computed again under the version in
 * force (decided at C4d: no mixing of old counts for a window). Computing it
 * needs the notation played, which a row does not carry — only the item, the
 * seed, the recipe and the rung that held the phrase. For a generated phrase
 * that is enough to write it again (`readingOptions`, the one writer of a
 * phrase), and the observation's own record of the run — its steps, its bars,
 * the notes it expected and the ones it heard early — says whether the phrase
 * written today is the one the learner read. Where it is not, or where the row
 * never kept its steps, the row stays out and says why. Nothing is estimated.
 *
 * **Which phrase.** The Score screen has written a phrase three ways since
 * observations were kept: the row's own params (before C4), with the reader's
 * recipe (C4 on), and held to the rung that opened it (C4c on). Each candidate
 * is tried, newest first, and only one that matches the observation is used;
 * the generator's own changes (C4d's redraw budget, for one) show up here as a
 * phrase that no longer matches, which is kept out rather than guessed at.
 */
import type { EvidenceExclusion, SessionRow } from './db';
import type { CatalogItem, Curriculum } from '../curriculum/types';
import type { SightReadingOptions } from '../engine/sightReading';
import type { ScoreModelData, ScoreStep } from '../score/types';
import { readingOptions, taughtAtRung } from '../curriculum/session';
import { EVIDENCE_DEFINITIONS, recomputeEvidence, type StoredEvidence } from '../evidence/evidence';
import type { Vocabulary } from '../evidence/vocabulary';

/** Why a row stays out of the evidence (`db.ts`); the storage report says each in words. */
export type RecomputeExclusion = EvidenceExclusion;

/** Whether a row's evidence is under another version than the one in force, and not already kept out under it. */
export function needsRecompute(row: SessionRow, current: number = EVIDENCE_DEFINITIONS): boolean {
  if (row.evidenceDefinitions === current) return false;
  if (row.evidenceRecompute?.definitions === current) return false;
  return true;
}

/**
 * The phrases a stored run could have been, newest writer first, or why it
 * cannot be written again. `item` is the catalog row the run names (or
 * `undefined` when the catalog no longer has it).
 */
export function candidatePhrases(
  row: SessionRow,
  item: CatalogItem | undefined,
  curriculum: Curriculum,
): SightReadingOptions[] | RecomputeExclusion {
  if (item === undefined) return 'item-gone';
  if (item.drill?.kind !== 'sight-reading') return 'not-generated';
  if (!row.steps) return 'no-steps';
  if (row.seed === undefined) return 'no-seed';
  const rung = row.opened?.rung ?? row.lessonId;
  const recipe = row.recipe === undefined ? undefined : { row: row.recipe.row, ...(row.recipe.moved ? { moved: row.recipe.moved } : {}) };
  const out: SightReadingOptions[] = [];
  const seen = new Set<string>();
  const add = (options: SightReadingOptions): void => {
    const key = JSON.stringify(options);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(options);
  };
  const taught = taughtAtRung(curriculum, rung);
  if (taught) add(readingOptions(item, recipe, row.seed, taught));
  add(readingOptions(item, recipe, row.seed));
  if (recipe !== undefined) add(readingOptions(item, undefined, row.seed));
  return out;
}

/** The pitches a step asks of the hands the run played. */
function expected(step: ScoreStep | undefined, hands: 'R' | 'L' | 'both'): number[] {
  if (!step) return [];
  return step.notes.filter((note) => hands === 'both' || note.hand === hands).map((note) => note.midi);
}

/**
 * Whether the phrase written today is the one this run read, by what the run
 * itself recorded (C1): the same steps with something to play and the same
 * steps with nothing, bar for bar; the same count of expected notes; and every
 * note it heard early one the phrase asks for at that step. A phrase that
 * differed only in pitches where the learner played nothing early would pass
 * this; the generator's version is not on the row (Part 9 §8 wants it), so
 * that is the limit, and it is said where the job is described.
 */
export function phraseMatches(row: SessionRow, model: Pick<ScoreModelData, 'steps'>): boolean {
  const steps = row.steps;
  if (!steps) return false;
  const hands = row.hands?.played ?? 'both';
  const last = steps.from + steps.codes.length - 1;
  if (steps.from < 0 || last >= model.steps.length) return false;
  const measures: number[] = [];
  let lastMeasure: number | null = null;
  let notes = 0;
  let playable = 0;
  for (let offset = 0; offset < steps.codes.length; offset += 1) {
    const step = model.steps[steps.from + offset];
    if (step && step.measureIndex !== lastMeasure) {
      measures.push(offset, step.sourceMeasureIndex);
      lastMeasure = step.measureIndex;
    }
    const asks = expected(step, hands);
    const code = steps.codes[offset];
    if ((code === '-') !== (asks.length === 0)) return false;
    notes += asks.length;
    if (asks.length > 0) playable += 1;
  }
  if (measures.length !== steps.measures.length || measures.some((value, index) => value !== steps.measures[index])) return false;
  for (let i = 0; i + 1 < steps.early.length; i += 2) {
    const at = steps.early[i] as number;
    const midi = steps.early[i + 1] as number;
    if (!expected(model.steps[at], hands).includes(midi)) return false;
  }
  const pitch = row.pitch;
  if (pitch !== undefined && pitch !== 'not measured') {
    const of = pitch.definition === 'tempo-notes' ? notes : playable;
    if (pitch.of !== of) return false;
  }
  return true;
}

/** The evidence a matched phrase gives the row today, for the skills its item declares. */
export function recomputed(
  row: SessionRow,
  model: ScoreModelData,
  item: CatalogItem,
  vocabulary: Vocabulary,
): StoredEvidence | undefined {
  return recomputeEvidence(row, model, vocabulary, item.targetSkills ?? []);
}

// --- the job ---------------------------------------------------------------

/** What the job has done, for the storage report (Settings → Content). */
export interface EvidenceJobStatus {
  state: 'waiting' | 'running' | 'done';
  /** Runs of evidence-bearing items whose evidence is under the version in force. */
  current: number;
  /** Brought up to date by this run of the job. */
  recomputed: number;
  /** Still to do. */
  pending: number;
  /** Kept out, by reason: they contribute nothing, and the report says why. */
  excluded: Partial<Record<EvidenceExclusion, number>>;
  /** Reading rows an older build passed or mastered, put back to practised (S8). */
  normalised: number;
  /** Rungs carried over from before C5 on this open (none after the first). */
  carried: number;
  /** The store failed part way: what is left is tried again on the next open. */
  stopped?: boolean;
}

/** What the job reads and writes, so a test can hand it a store and a renderer of its own. */
export interface EvidenceJobDeps {
  curriculum: () => Promise<Curriculum>;
  items: () => Promise<CatalogItem[]>;
  /** Every stored run of one item, with its per-step detail. */
  runsOf: (itemId: string) => Promise<SessionRow[]>;
  /** Writes a row's evidence, or its exclusion, by the row's key. */
  writeEvidence: (id: number, patch: Pick<SessionRow, 'evidence' | 'evidenceDefinitions' | 'evidenceRecompute'>) => Promise<void>;
  /** The score model the engine plays for a MusicXML phrase. */
  modelOf: (musicXml: string, id: string) => Promise<ScoreModelData>;
  /** The phrase a set of options writes (`generateSightReading`). */
  write: (options: SightReadingOptions) => { musicXml: string };
  vocabulary: Vocabulary;
  /** Waits for the browser to be idle between rows; resolves at once in a test. */
  idle: () => Promise<void>;
  /** The carry-over and the normalisation (once each; see `carryOver.ts`, `normaliseGeneratedRows`). */
  carryOver: (curriculum: Curriculum) => Promise<number>;
  normalise: (isGenerated: (itemId: string) => boolean) => Promise<string[]>;
  /** Tells the screens the store changed, once, at the end. */
  announce: () => void;
}

/**
 * One pass of the job (see the module note). Order: the carry-over and the
 * normalisation first — cheap, and what where-the-learner-is depends on —
 * then each stale run, one per idle slice, newest item first. Reports as it
 * goes through `onStatus`. Never throws: a row that cannot be done is kept out
 * with its reason, and a failure of the whole store leaves the job `done`
 * with what it managed.
 */
export async function runEvidenceJob(deps: EvidenceJobDeps, onStatus: (status: EvidenceJobStatus) => void = () => undefined): Promise<EvidenceJobStatus> {
  const status: EvidenceJobStatus = { state: 'running', current: 0, recomputed: 0, pending: 0, excluded: {}, normalised: 0, carried: 0 };
  const say = (): void => onStatus({ ...status, excluded: { ...status.excluded } });
  say();
  let changed = false;
  try {
    const [curriculum, items] = await Promise.all([deps.curriculum(), deps.items()]);
    const byId = new Map(items.map((item) => [item.id, item]));
    status.carried = await deps.carryOver(curriculum);
    const isGenerated = (itemId: string): boolean => byId.get(itemId)?.drill?.kind === 'sight-reading';
    status.normalised = (await deps.normalise(isGenerated)).length;
    changed = status.carried > 0 || status.normalised > 0;
    const bearing = items.filter((item) => (item.targetSkills?.length ?? 0) > 0);
    const stale: SessionRow[] = [];
    for (const item of bearing) {
      for (const row of await deps.runsOf(item.id)) {
        if (row.id === undefined) continue;
        if (!needsRecompute(row)) {
          if (row.evidenceDefinitions === EVIDENCE_DEFINITIONS) status.current += 1;
          else if (row.evidenceRecompute?.excluded) status.excluded[row.evidenceRecompute.excluded] = (status.excluded[row.evidenceRecompute.excluded] ?? 0) + 1;
          continue;
        }
        stale.push(row);
      }
    }
    status.pending = stale.length;
    say();
    for (const row of stale) {
      await deps.idle();
      const item = byId.get(row.itemId);
      const plan = candidatePhrases(row, item, curriculum);
      let outcome: StoredEvidence | EvidenceExclusion = 'phrase-differs';
      if (typeof plan === 'string') {
        outcome = plan;
      } else {
        for (const options of plan) {
          try {
            const model = await deps.modelOf(deps.write(options).musicXml, row.itemId);
            if (!phraseMatches(row, model)) continue;
            outcome = recomputed(row, model, item as CatalogItem, deps.vocabulary) ?? 'not-generated';
            break;
          } catch {
            // A phrase that cannot be drawn is one that does not match.
          }
        }
      }
      if (typeof outcome === 'string') {
        await deps.writeEvidence(row.id as number, { evidenceRecompute: { definitions: EVIDENCE_DEFINITIONS, excluded: outcome } });
        status.excluded[outcome] = (status.excluded[outcome] ?? 0) + 1;
      } else {
        await deps.writeEvidence(row.id as number, { ...outcome, evidenceRecompute: undefined });
        status.recomputed += 1;
        status.current += 1;
        changed = true;
      }
      status.pending -= 1;
      say();
    }
  } catch {
    // The store failed: nothing more on this open, and the report says so
    // rather than reading like a finished job.
    status.stopped = true;
  }
  status.state = 'done';
  say();
  if (changed) deps.announce();
  return status;
}

// --- in the browser --------------------------------------------------------

let lastStatus: EvidenceJobStatus = { state: 'waiting', current: 0, recomputed: 0, pending: 0, excluded: {}, normalised: 0, carried: 0 };
const statusListeners = new Set<(status: EvidenceJobStatus) => void>();
let started: Promise<EvidenceJobStatus> | null = null;

/** The job's last report, for the storage report. */
export function evidenceJobStatus(): EvidenceJobStatus {
  return lastStatus;
}

/** Publishes a report: kept as the last one and handed to every listener (the storage report's line). */
export function reportEvidenceJob(status: EvidenceJobStatus): void {
  lastStatus = status;
  for (const listener of statusListeners) listener(status);
}

/** Called with every report the job makes; returns the unsubscribe. */
export function onEvidenceJobChange(cb: (status: EvidenceJobStatus) => void): () => void {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

/**
 * Resolves when the browser next has nothing to do, or after `timeoutMs` at
 * the latest: the job does one row per call, so a phone busy drawing a score
 * or taking a run is never kept waiting by it.
 */
function whenIdle(timeoutMs = 2000): Promise<void> {
  return new Promise((resolve) => {
    const idle = (globalThis as { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
    if (typeof idle === 'function') idle(() => resolve(), { timeout: timeoutMs });
    else setTimeout(resolve, 50);
  });
}

/** The phrase's model, parsed and never drawn: OSMD in a detached element (as `estimateImport` does). */
async function modelInTheBrowser(musicXml: string, id: string): Promise<ScoreModelData> {
  const [{ OpenSheetMusicDisplay }, { extractScoreModel }] = await Promise.all([
    import('opensheetmusicdisplay'),
    import('../score/extractScoreModel'),
  ]);
  const host = document.createElement('div');
  const osmd = new OpenSheetMusicDisplay(host, { autoResize: false, drawingParameters: 'compact' });
  await osmd.load(musicXml);
  return extractScoreModel(osmd, { id });
}

/**
 * Starts the evidence job once per open (C5): after the first screen is up —
 * `delayMs` after the call, then one row per idle slice — so it never holds
 * up the first screen, a score being drawn or a run being taken. OSMD is
 * loaded only when a row needs a phrase written again. A second call returns
 * the same run.
 */
export function startEvidenceJob(delayMs = 1500): Promise<EvidenceJobStatus> {
  started ??= new Promise<void>((resolve) => setTimeout(resolve, delayMs)).then(async () => {
    const [load, progress, plan, sight, vocabulary] = await Promise.all([
      import('../curriculum/load'),
      import('./progressStore'),
      import('./planStore'),
      import('../engine/sightReading'),
      import('../evidence/vocabulary'),
    ]);
    return runEvidenceJob(
      {
        curriculum: load.loadCurriculum,
        items: load.allItems,
        runsOf: (itemId) => progress.sessionsForItem(itemId, progress.MAX_SESSIONS),
        writeEvidence: progress.replaceSessionEvidence,
        modelOf: modelInTheBrowser,
        write: sight.generateSightReading,
        vocabulary: vocabulary.VOCABULARY_V0,
        idle: () => whenIdle(),
        carryOver: (curriculum) => plan.carryOverOnce(curriculum),
        normalise: progress.normaliseGeneratedRows,
        announce: progress.announceProgressChange,
      },
      reportEvidenceJob,
    );
  });
  return started;
}

/** Test hook. */
export function resetEvidenceJobForTest(): void {
  started = null;
  lastStatus = { state: 'waiting', current: 0, recomputed: 0, pending: 0, excluded: {}, normalised: 0, carried: 0 };
  statusListeners.clear();
}
