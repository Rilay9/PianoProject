/**
 * The skills store, retired to exposures, and what the screens read about a
 * learner's skills (C7; `04` §3a and §6).
 *
 * Until C7 this module kept its own truth per concept — `unseen`, `learning`
 * or `known` — written by the lesson page when a rung was met and by *I
 * already know this*, and "rusty" thirty days after that write whether or not
 * anything had been played since (L16). That was a second definition of what
 * a learner knows beside the evidence. C7 deletes the writers and the calendar
 * rather than bypassing them: what a learner knows is what the stored runs'
 * evidence shows, read on the ladder (`evidence/ladder.ts`) whichever rung
 * judged them; "rusty" is the ladder's `notShownRecently`; a concept the
 * vocabulary cannot measure is not judged; the learner's word about a lesson
 * stays his, apart (`PlanRow.rungWords`).
 *
 * What is left here:
 *
 * - **The migration** (the reviewer's pre-dispatch change, 5a). A row an older
 *   build wrote, or an older backup restores, can honestly say only that the
 *   old system had met the concept: it recorded no item, no run, nothing seen,
 *   heard or played. So a `learning` or `known` row becomes an exposure dated
 *   the day it is carried over, in place (`SkillRow`), and an `unseen` row is
 *   dropped. Once per row: a row already carried over is left as it is. Never
 *   evidence, never a met requirement, never an encounter with material; the
 *   shared encounter record (Part 27, L97) waits for material identity.
 * - **The exposures** the ladder reads beside the evidence: those rows, and the
 *   concepts of the rungs carried over before C5 (`carriedExposures`). An
 *   exposure makes a skill *introduced* and nothing more (`ladderState`).
 * - **The screens' readings**, pure: when a skill was last supported, the
 *   ladder as of an earlier day, and which skills moved in the last weeks.
 */
import { openDatabase, type LegacySkillRow, type PlanRow, type SessionRow, type SkillRow } from './db';
import type { Curriculum } from '../curriculum/types';
import { carriedExposures, skillLadders } from '../evidence/rungState';
import { storedEvidence } from '../evidence/readingState';
import { LADDER_STATES, supports, type LadderReading } from '../evidence/ladder';
import type { Vocabulary } from '../evidence/vocabulary';

function isLegacy(row: SkillRow | LegacySkillRow): row is LegacySkillRow {
  return 'state' in row;
}

/**
 * Carries the retired store's rows over as exposures, once (see the module
 * note): `learning` and `known` become `{ conceptId, exposedAt }` dated `now`,
 * `unseen` is dropped, and a row already carried over is untouched. Returns
 * how many rows it changed — none the second time.
 */
export async function migrateLegacySkills(now = new Date()): Promise<number> {
  const db = await openDatabase();
  if (!db) return 0;
  const tx = db.transaction('skills', 'readwrite');
  let changed = 0;
  let cursor = await tx.store.openCursor();
  while (cursor) {
    const row = cursor.value;
    if (isLegacy(row)) {
      if (row.state === 'unseen') await cursor.delete();
      else await cursor.update({ conceptId: row.conceptId, exposedAt: now.toISOString() });
      changed += 1;
    }
    cursor = await cursor.continue();
  }
  await tx.done;
  return changed;
}

/**
 * Every exposure the ladder reads, by concept (ISO date-times): the carried
 * rungs' concepts and the retired store's rows, migrated first if an older
 * build or backup left any. Exposures only — the ladder reads them as
 * *introduced* and no requirement reads them at all.
 */
export async function learnerExposures(
  curriculum: Curriculum,
  plan: Pick<PlanRow, 'carriedOver'>,
  now = new Date(),
): Promise<Map<string, string[]>> {
  await migrateLegacySkills(now);
  const exposures = carriedExposures(curriculum, plan.carriedOver);
  const db = await openDatabase();
  for (const row of (await db?.getAll('skills')) ?? []) {
    if (isLegacy(row)) continue;
    const list = exposures.get(row.conceptId) ?? [];
    if (!list.includes(row.exposedAt)) list.push(row.exposedAt);
    exposures.set(row.conceptId, list);
  }
  return exposures;
}

/**
 * When each skill was last supported (a measured evidence record at or above
 * the ladder's support share, `supports`), up to `asOf` when given: what "not
 * shown in 4 weeks" counts from. Pure.
 */
export function lastSupported(rows: readonly SessionRow[], asOf?: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const row of rows) {
    for (const evidence of storedEvidence(row)) {
      if (evidence.kind !== 'measured' || !supports(evidence)) continue;
      if (asOf !== undefined && evidence.at > asOf) continue;
      const last = out.get(evidence.skill);
      if (last === undefined || evidence.at > last) out.set(evidence.skill, evidence.at);
    }
  }
  return out;
}

/**
 * The ladder's reading of every vocabulary skill with an observable as it was
 * on `day`: only the runs and exposures dated by then, read as of then. The
 * ladder itself is untouched; this only hands it the history up to a day.
 */
export function readingsAsOf(
  rows: readonly SessionRow[],
  vocabulary: Vocabulary,
  day: Date,
  exposures: ReadonlyMap<string, readonly string[]> = new Map(),
): Map<string, LadderReading> {
  const until = day.toISOString();
  const exposed = new Map<string, string[]>();
  for (const [concept, dates] of exposures) {
    const kept = dates.filter((at) => at <= until);
    if (kept.length > 0) exposed.set(concept, kept);
  }
  return skillLadders(
    rows.filter((row) => row.at <= until),
    vocabulary,
    day,
    exposed,
  );
}

/**
 * How far back Progress looks for a skill that moved: four weeks. A choice,
 * not a measurement — long enough to hold the ladder's retention span, so a
 * skill that went unshown inside it is listed, and short enough to be
 * "lately" (`04` §6).
 */
export const COMPETENCE_WINDOW_DAYS = 28;

/** One skill whose state moved in the window, and how (Progress, `04` §6). */
export interface SkillMove {
  skill: string;
  then: LadderReading;
  now: LadderReading;
  /** The last supporting evidence, today: what "not shown in N weeks" counts from. */
  lastSupport?: string;
  /** Up, down, gone unshown, or shown again: the order Progress lists them in. */
  kind: 'up' | 'down' | 'unshown' | 'shown again';
}

/**
 * The skills whose ladder state moved between `windowDays` ago and today, and
 * how (X3's first half): a step up or down the ladder where evidence is on
 * either side of it, or a skill gone unshown for the retention span, or shown
 * again after one. Moving between *not introduced* and *introduced* is an
 * exposure and not competence, so it is not listed. Pure.
 */
export function skillMoves(
  rows: readonly SessionRow[],
  vocabulary: Vocabulary,
  today: Date,
  exposures: ReadonlyMap<string, readonly string[]> = new Map(),
  windowDays = COMPETENCE_WINDOW_DAYS,
): SkillMove[] {
  const start = new Date(today);
  start.setDate(start.getDate() - windowDays);
  const before = readingsAsOf(rows, vocabulary, start, exposures);
  const after = readingsAsOf(rows, vocabulary, today, exposures);
  const last = lastSupported(rows, today.toISOString());
  const rank = (reading: LadderReading): number => LADDER_STATES.indexOf(reading.state);
  const practised = LADDER_STATES.indexOf('practised');
  const order: SkillMove['kind'][] = ['up', 'down', 'unshown', 'shown again'];
  const out: SkillMove[] = [];
  for (const [skill, now] of after) {
    const then = before.get(skill);
    if (!then) continue;
    const stepped = now.state !== then.state && Math.max(rank(now), rank(then)) >= practised;
    let kind: SkillMove['kind'] | undefined;
    if (stepped) kind = rank(now) > rank(then) ? 'up' : 'down';
    else if (now.notShownRecently !== then.notShownRecently) kind = now.notShownRecently ? 'unshown' : 'shown again';
    if (kind === undefined) continue;
    const since = last.get(skill);
    out.push({ skill, then, now, kind, ...(since === undefined ? {} : { lastSupport: since }) });
  }
  return out.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}
