/**
 * Per-concept skill state for the Skills review screen (docs/04 §3a).
 *
 * The curriculum's `concepts[]` are the vocabulary; this store remembers what
 * has happened to each one. "Rusty" is not stored — it is derived from
 * `lastReviewedAt`, because a skill goes stale by the calendar moving and not
 * by anything the app does.
 */
import { openDatabase, type SkillRow } from './db';

/** docs/04 §3a: "rusty = not practised in 30 days". */
export const RUSTY_AFTER_DAYS = 30;

export type SkillState = SkillRow['state'] | 'rusty';

const memory = new Map<string, SkillRow>();

export async function allSkills(): Promise<SkillRow[]> {
  const db = await openDatabase();
  const rows = (await db?.getAll('skills')) ?? [...memory.values()];
  for (const row of rows) memory.set(row.conceptId, row);
  return rows;
}

export async function markSkill(
  conceptId: string,
  state: SkillRow['state'],
  now = new Date(),
): Promise<SkillRow> {
  const row: SkillRow = { conceptId, state, lastReviewedAt: now.toISOString() };
  memory.set(conceptId, row);
  const db = await openDatabase();
  await db?.put('skills', row);
  return row;
}

/** The state a grid cell should show, `rusty` included. */
export function displayState(row: SkillRow | undefined, now = new Date()): SkillState {
  if (!row) return 'unseen';
  if (row.state === 'unseen') return 'unseen';
  if (!row.lastReviewedAt) return row.state;
  const days = (now.getTime() - new Date(row.lastReviewedAt).getTime()) / 86_400_000;
  return days >= RUSTY_AFTER_DAYS ? 'rusty' : row.state;
}

/** Test hook. */
export function resetSkillsForTest(): void {
  memory.clear();
}
