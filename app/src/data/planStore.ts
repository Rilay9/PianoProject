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
import { openDatabase, type PlanRow } from './db';
import { FRESH_TRACK_ORDER } from '../curriculum/tracks';

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
