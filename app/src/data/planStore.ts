/**
 * Where the learner is in the curriculum, and which tracks they have switched
 * on (docs/01 §4.5, the `plan` store; docs/04 §3 "track chips … ordering by
 * drag").
 *
 * One row, id `'current'`. Track *order* is stored rather than a set of
 * booleans because the Today session builder walks the tracks in order when it
 * picks the day's new material, so "Blues before Classical" is a real choice
 * and not just a display preference.
 */
import { CARRY_OVER_DUE_KEY, openDatabase, type PlanRow } from './db';
import { FRESH_TRACK_ORDER, activeTracksFor } from '../curriculum/tracks';
import type { Curriculum } from '../curriculum/types';
import { carriedOver } from './carryOver';
import { allProgress } from './progressStore';
import { getSettings } from './settingsStore';

/** Re-exported so the stored default and the "has he touched it?" rule cannot drift. */
export const DEFAULT_TRACK_ORDER = FRESH_TRACK_ORDER;

function fresh(): PlanRow {
  return { id: 'current', stage: 0, unitId: '', trackOrder: [...DEFAULT_TRACK_ORDER] };
}

let memory: PlanRow | null = null;
const listeners = new Set<(row: PlanRow) => void>();

export function onPlanChange(cb: (row: PlanRow) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function getPlan(): Promise<PlanRow> {
  if (memory) return memory;
  const db = await openDatabase();
  memory = (await db?.get('plan', 'current')) ?? fresh();
  return memory;
}

export async function updatePlan(patch: Partial<Omit<PlanRow, 'id'>>): Promise<PlanRow> {
  const row: PlanRow = { ...(await getPlan()), ...patch, id: 'current' };
  memory = row;
  const db = await openDatabase();
  await db?.put('plan', row);
  for (const listener of listeners) listener(row);
  return row;
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
 * nothing, whatever is passed in it. Returns how many rungs it carried on
 * this call (0 after the first, and always 0 without the flag).
 */
export async function carryOverOnce(curriculum: Curriculum, now = new Date()): Promise<number> {
  const db = await openDatabase();
  if (!db || (await db.get('settings', CARRY_OVER_DUE_KEY)) !== true) return 0;
  const plan = await getPlan();
  const rungs =
    plan.carriedOver?.rungs ??
    carriedOver(curriculum, await allProgress(), activeTracksFor(plan, curriculum), {
      ...(plan.placement === undefined ? {} : { startAt: plan.placement.unitId }),
      requireTwoSongs: getSettings().requireTwoSongs,
    });
  if (plan.carriedOver === undefined) await updatePlan({ carriedOver: { at: now.toISOString(), rungs } });
  await db.delete('settings', CARRY_OVER_DUE_KEY);
  return plan.carriedOver === undefined ? rungs.length : 0;
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
}

/** Test hook. */
export function resetPlanForTest(): void {
  forgetCachedPlan();
  listeners.clear();
}
