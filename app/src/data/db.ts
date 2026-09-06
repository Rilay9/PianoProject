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
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export const DB_NAME = 'pianopath';
/**
 * 2 adds `levelOverrides` (replan §1.4); 3 adds `folderLibraries` (`04` §4b);
 * 4 gives an import the rungs it belongs to (replan §4.3).
 */
export const DB_VERSION = 4;

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
  /** ISO dates on which this item was passed — `master` needs two, different days. */
  passedOn: string[];
  /** Set by "I already know this" rather than by a measured run. */
  selfPassed?: boolean;
}

export interface SessionRow {
  id?: number;
  itemId: string;
  lessonId?: string;
  mode: string;
  tempoPct: number;
  accuracy: number;
  accuracyEstimated: boolean;
  wrongNotes: number;
  missed: number;
  durationMs: number;
  /** ISO date-time. */
  at: string;
  selfReport?: 'rough' | 'ok' | 'clean';
}

export type ImportKind = 'musicxml' | 'pdf';

export interface ImportRow {
  id: string;
  kind: ImportKind;
  title: string;
  /** MusicXML text, or the PDF's bytes. */
  data: string | ArrayBuffer;
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
}

export interface PlanRow {
  id: 'current';
  stage: number;
  unitId: string;
  trackOrder: string[];
  placement?: { unitId: string; at: string };
}

export interface StreakRow {
  id: 'streak';
  /** ISO date -> minutes practised that day. */
  minutesByDay: Record<string, number>;
  weeklyGoalMinutes: number;
}

export interface SkillRow {
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

/**
 * A folder of scores the owner pointed the app at.
 *
 * The rows are kept and the *files* are not: Android grants a folder for one
 * visit only (there is no `showDirectoryPicker` on Chrome for Android), so a
 * stored handle is not on offer. Keeping the listing means browsing 37,000
 * scores works with nothing plugged in; adding one asks for the folder again.
 */
export interface FolderLibraryRow {
  /** The folder's own name, which is all Android tells us about where it is. */
  id: string;
  addedAt: string;
  /** From the folder's `library.json`, when it had one. */
  source: string | null;
  scores: FolderScore[];
}

interface PianoPathDb extends DBSchema {
  settings: { key: string; value: unknown };
  progress: { key: string; value: ProgressRow };
  sessions: { key: number; value: SessionRow; indexes: { byItem: string; byDate: string } };
  imports: { key: string; value: ImportRow };
  plan: { key: string; value: PlanRow };
  streak: { key: string; value: StreakRow };
  micCalibration: { key: string; value: unknown };
  skills: { key: string; value: SkillRow };
  levelOverrides: { key: string; value: LevelOverrideRow };
  folderLibraries: { key: string; value: FolderLibraryRow };
}

let dbPromise: Promise<IDBPDatabase<PianoPathDb> | null> | null = null;

export function openDatabase(): Promise<IDBPDatabase<PianoPathDb> | null> {
  // `openDB` throws synchronously rather than rejecting when there is no
  // IndexedDB at all, which is the case in a test environment and in a
  // browser with site data blocked — so the guard has to come first.
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  dbPromise ??= openDB<PianoPathDb>(DB_NAME, DB_VERSION, {
    // `oldVersion` is 0 on a fresh database and the previous version on an
    // upgrade, so each block runs exactly once and a phone that has been on
    // version 1 since P7 keeps every row it has.
    upgrade(db, oldVersion, _newVersion, tx) {
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
    },
  }).catch(() => null);
  return dbPromise;
}

/**
 * Every store name, in the order an export writes them.
 *
 * `folderLibraries` is deliberately absent. It is a 6 MB listing of files that
 * are on the phone anyway, rebuilt by pointing at the folder again — putting
 * it in the backup would multiply the size of the one file that holds a year
 * of practice, to save a single tap.
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
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

/** Test hook: forgets the cached handle so a fresh database is opened. */
export function resetDatabaseForTest(): void {
  dbPromise = null;
}
