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
export const DB_VERSION = 1;

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

interface PianoPathDb extends DBSchema {
  settings: { key: string; value: unknown };
  progress: { key: string; value: ProgressRow };
  sessions: { key: number; value: SessionRow; indexes: { byItem: string; byDate: string } };
  imports: { key: string; value: ImportRow };
  plan: { key: string; value: PlanRow };
  streak: { key: string; value: StreakRow };
  micCalibration: { key: string; value: unknown };
  skills: { key: string; value: SkillRow };
}

let dbPromise: Promise<IDBPDatabase<PianoPathDb> | null> | null = null;

export function openDatabase(): Promise<IDBPDatabase<PianoPathDb> | null> {
  // `openDB` throws synchronously rather than rejecting when there is no
  // IndexedDB at all, which is the case in a test environment and in a
  // browser with site data blocked — so the guard has to come first.
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  dbPromise ??= openDB<PianoPathDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
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
    },
  }).catch(() => null);
  return dbPromise;
}

/** Every store name, in the order an export writes them. */
export const STORE_NAMES = [
  'settings',
  'progress',
  'sessions',
  'imports',
  'plan',
  'streak',
  'micCalibration',
  'skills',
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

/** Test hook: forgets the cached handle so a fresh database is opened. */
export function resetDatabaseForTest(): void {
  dbPromise = null;
}
