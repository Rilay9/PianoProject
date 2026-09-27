/**
 * Where the learner is in the curriculum, and which tracks they have switched
 * on (docs/01 §4.5, the `plan` store; docs/04 §3 "track chips … ordering by
 * drag").
 *
 * One row, id `'current'`. Track *order* is stored rather than a set of
 * booleans because the Today session builder walks the tracks in order when it
 * picks the day's new material, so "Blues before Classical" is a real choice
 * and not just a display preference.
 *
 * **One authoritative read (L98, the reviewer's C7 fix-forward).** Plan,
 * Today, Skills, Progress and the lesson page all build where the learner is
 * from this row, so every one of them must receive the same row, and never
 * one the store has since replaced. Three rules hold that at this boundary
 * rather than in each screen:
 *
 * - **Concurrent first reads are one read** (`loading`). They used to be one
 *   database read each, each assigning its answer to `memory` when it landed.
 * - **The one-time carry-over is part of that read** (`carryIfDue`): on a
 *   database made before C5, the first read carries the old rungs over before
 *   it answers anyone, so no reader receives the plan from before it. It used
 *   to run later, on the evidence job, as an ordinary `updatePlan`, and a
 *   screen that had read the plan first kept the uncarried row — Today and
 *   Skills on the first open, until a reload (C7's pictures).
 * - **A read publishes only what nothing has replaced since it began**
 *   (`generation`), and **writes run one at a time behind the read**
 *   (`serialised`): a read that landed after `updatePlan` used to put the old
 *   row back into `memory`, and every reader after it got the old row.
 */
import { CARRY_OVER_DUE_KEY, openDatabase, type PlanRow } from './db';
import { FRESH_TRACK_ORDER, activeTracksFor } from '../curriculum/tracks';
import type { Curriculum } from '../curriculum/types';
import { loadCurriculum } from '../curriculum/load';
import { carriedOver } from './carryOver';
import { allProgress } from './progressStore';
import { getSettings } from './settingsStore';

/** Re-exported so the stored default and the "has he touched it?" rule cannot drift. */
export const DEFAULT_TRACK_ORDER = FRESH_TRACK_ORDER;

function fresh(): PlanRow {
  return { id: 'current', stage: 0, unitId: '', trackOrder: [...DEFAULT_TRACK_ORDER] };
}

let memory: PlanRow | null = null;
/** The first read in flight — the carry-over, when due, included — shared by every caller until it lands. */
let loading: Promise<PlanRow> | null = null;
/**
 * Moves whenever the row in memory is replaced or forgotten: a read that began
 * before the move answers its own caller and publishes nothing.
 */
let generation = 0;
/** The rungs the last read carried over, for `carryOverOnce`'s report; taken once. */
let carriedByRead = 0;
/** The writes, one at a time: each starts when the one before it has landed. */
let writes: Promise<unknown> = Promise.resolve();
const listeners = new Set<(row: PlanRow) => void>();

export function onPlanChange(cb: (row: PlanRow) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function serialised<T>(step: () => Promise<T>): Promise<T> {
  const next = writes.then(step, step);
  writes = next.catch(() => undefined);
  return next;
}

/** Puts a row in memory, replacing whatever a read in flight would publish. */
function publish(row: PlanRow): void {
  memory = row;
  generation += 1;
}

function announce(row: PlanRow): void {
  for (const listener of listeners) listener(row);
}

/**
 * The plan row, as every reader must see it (see the module note): from
 * memory once read; otherwise the one read in flight, which carries the old
 * rungs over first where that is due.
 */
export function getPlan(): Promise<PlanRow> {
  if (memory) return Promise.resolve(memory);
  loading ??= readPlan();
  return loading;
}

/** The read itself; the job passes the curriculum and day it already has. */
async function readPlan(curriculum?: Curriculum, now = new Date()): Promise<PlanRow> {
  const began = generation;
  try {
    const db = await openDatabase();
    const stored = (await db?.get('plan', 'current')) ?? fresh();
    const { row, carried } = await carryIfDue(stored, curriculum, now);
    if (generation !== began) return row;
    carriedByRead += carried;
    memory = row;
    return row;
  } finally {
    if (generation === began) loading = null;
  }
}

/**
 * The one-time carry-over (C5, `carryOver.ts`), applied to the row about to be
 * read: only while the version 7 upgrade's flag says a database made before
 * C5 has not been carried over. The rungs the old rule had done before the
 * rung it was recommending go on the row with the day, the row is stored, and
 * the flag is cleared, so it never runs again; a row that already carries
 * them only clears the flag. Where the curriculum cannot be read the row is
 * returned as stored and the flag left for the next read or the job.
 */
async function carryIfDue(
  row: PlanRow,
  curriculum: Curriculum | undefined,
  now: Date,
): Promise<{ row: PlanRow; carried: number }> {
  const db = await openDatabase();
  if (!db || (await db.get('settings', CARRY_OVER_DUE_KEY)) !== true) return { row, carried: 0 };
  if (row.carriedOver !== undefined) {
    await db.delete('settings', CARRY_OVER_DUE_KEY);
    return { row, carried: 0 };
  }
  let content = curriculum;
  if (content === undefined) {
    try {
      content = await loadCurriculum();
    } catch {
      return { row, carried: 0 };
    }
  }
  const rungs = carriedOver(content, await allProgress(), activeTracksFor(row, content), {
    ...(row.placement === undefined ? {} : { startAt: row.placement.unitId }),
    requireTwoSongs: getSettings().requireTwoSongs,
  });
  const next: PlanRow = { ...row, carriedOver: { at: now.toISOString(), rungs } };
  await db.put('plan', next);
  await db.delete('settings', CARRY_OVER_DUE_KEY);
  return { row: next, carried: rungs.length };
}

export function updatePlan(patch: Partial<Omit<PlanRow, 'id'>>): Promise<PlanRow> {
  return serialised(async () => {
    const row: PlanRow = { ...(await getPlan()), ...patch, id: 'current' };
    publish(row);
    const db = await openDatabase();
    await db?.put('plan', row);
    announce(row);
    return row;
  });
}

/**
 * Records the learner's word about a rung (C5): "I already know this" or *Mark
 * done*. It sets the rung aside and meets none of its requirements
 * (`PlanRow.rungWords`); the rung's items are not marked passed.
 */
export async function recordRungWord(rungId: string, kind: 'known' | 'done', now = new Date()): Promise<PlanRow> {
  const words = { ...((await getPlan()).rungWords ?? {}), [rungId]: { kind, at: now.toISOString() } };
  return updatePlan({ rungWords: words });
}

/**
 * Carries the learner's history from before C5 over, once (`carryOver.ts`):
 * only on a database made before C5 (the version 7 upgrade set
 * `CARRY_OVER_DUE_KEY`), the rungs the old rule had done before the rung it
 * was recommending are stored on the plan row with the day, and the flag is
 * cleared, so it never runs again. A database C5 made has no flag and carries
 * nothing, whatever is passed in it. Returns how many rungs were carried by
 * this call or by the first read of the plan since the last call (0 after
 * that, and always 0 without the flag).
 *
 * Since L98 the first read of the plan carries over itself, so no reader sees
 * the plan from before it; this is the evidence job's step (and a test's),
 * which then finds nothing left to do — unless that read could not load the
 * curriculum, when it carries over here, as a write behind any other.
 */
export function carryOverOnce(curriculum: Curriculum, now = new Date()): Promise<number> {
  return serialised(async () => {
    if (memory === null) {
      loading ??= readPlan(curriculum, now);
      await loading;
    } else {
      const { row, carried } = await carryIfDue(memory, curriculum, now);
      if (row !== memory) {
        publish(row);
        announce(row);
      }
      carriedByRead += carried;
    }
    const carried = carriedByRead;
    carriedByRead = 0;
    return carried;
  });
}

/** Records the placement test's answer (docs/02 Stage 0.4). */
export async function recordPlacement(unitId: string, now = new Date()): Promise<PlanRow> {
  return updatePlan({ placement: { unitId, at: now.toISOString() }, unitId });
}

/**
 * Forgets the cached row, so the next read comes off the disk.
 *
 * Restoring a backup writes this store from outside, and the cache is
 * write-through: the next `updatePlan` would have put the pre-restore stage and
 * track order straight back over the restored one.
 */
export function forgetCachedPlan(): void {
  memory = null;
  loading = null;
  carriedByRead = 0;
  generation += 1;
}

/** Test hook. */
export function resetPlanForTest(): void {
  forgetCachedPlan();
  listeners.clear();
}
