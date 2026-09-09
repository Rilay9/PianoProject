/**
 * A small window handle onto the storage layer, for the end-to-end tests.
 *
 * The alternative is worse. Testing "a run recorded today comes back for
 * review in two days" through the UI alone means either waiting two days or
 * building a clock-injection seam through five screens; testing
 * export-and-restore through the UI means driving a native file-save dialog
 * Playwright cannot see. Both are the *storage* behaviour, and this exposes
 * exactly that and nothing else.
 *
 * It follows the precedent `ui/screens/DevScoreScreen.ts` already set with
 * `window.__pianopathDevScore`: a named handle, documented, and harmless in a
 * personal build that ships to one phone (`00` D19).
 */
import { exportAll, importAll } from '../data/backup';
import { openDatabase, STORE_NAMES } from '../data/db';
import { recordRun, resetProgressForTest } from '../data/progressStore';

export interface TestHooks {
  recordRun: typeof recordRun;
  exportAll: typeof exportAll;
  importAll: typeof importAll;
  /** Empties every store — "a different phone", without closing the page. */
  wipeForTest: () => Promise<void>;
  /** What the score screen's fit is holding; set while a score is open. */
  scoreFit?: () => unknown;
  /** Where the running score is and what it is waiting for; null when no run is on. */
  scoreRun?: () => {
    step: number;
    expected: number[];
    bar: number;
    lastBar: number;
    pitches: number[];
    paused: boolean;
    engineMode: string;
    input: string;
  } | null;
}

declare global {
  interface Window {
    __pianopath?: TestHooks;
  }
}

export function installTestHooks(target: Window = window): void {
  target.__pianopath = {
    recordRun,
    exportAll,
    importAll,
    wipeForTest: async () => {
      const db = await openDatabase();
      for (const store of STORE_NAMES) await db?.clear(store);
      resetProgressForTest();
    },
  };
}
