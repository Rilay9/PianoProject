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
import { connectForTest } from '../data/folderLibrary';
import { recordRun, resetProgressForTest } from '../data/progressStore';

export interface TestHooks {
  recordRun: typeof recordRun;
  exportAll: typeof exportAll;
  importAll: typeof importAll;
  /** Empties every store — "a different phone", without closing the page. */
  wipeForTest: () => Promise<void>;
  /**
   * Lends a folder its files for this session, the way a picker would.
   *
   * Exposed because the single most important path on the folder screen could
   * not be tested without it, and was not. `Add` descends the score's stored
   * path in a `FileSystemDirectoryHandle` and imports the one file it finds;
   * a headless browser has no directory picker, and a hand-made handle cannot
   * be put in the database in its place because functions are not
   * structured-cloneable. So every end-to-end test of `Add` exercised the
   * *failure* — no folder open, "pick the folder again" — and the success it
   * was reported broken for went unproven.
   *
   * `connectForTest` is the seam the unit tests already use, and this is the
   * same seam reachable from a page. It hands over real `File` objects, so the
   * import that follows is the ordinary one and not an imitation of it.
   */
  lendFolderFiles: (id: string, files: Map<string, File>) => void;
  /**
   * How many times each screen has been built since the page loaded.
   *
   * A screen built twice for one navigation leaves no mark: the shell empties
   * `main` and appends the second one, so the DOM shows one of it either way.
   * That is exactly how the double mount Entry 52 found went unseen until a
   * *session* it had left on the shared MIDI input recorded a second run over
   * the learner's own. The counter is the cheapest thing that can be asserted
   * from a page, and it is read by `mounted-once.spec.ts`.
   */
  screenMounts: Readonly<Record<string, number>>;
  /** What the score screen's fit is holding; set while a score is open. */
  scoreFit?: () => unknown;
  /** Where the running score is and what it is waiting for; null when no run is on. */
  scoreRun?: () => {
    step: number;
    expected: number[];
    bar: number;
    /** The bar the next step is in, in playing order; null after the last. */
    nextBar: number | null;
    lastBar: number;
    /** The step's notes, by ScoreNote id — the keys the colouring is by. */
    noteIds: string[];
    pitches: number[];
    paused: boolean;
    /** Holding for the learner's first note (T8). */
    armed: boolean;
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
    lendFolderFiles: connectForTest,
    screenMounts: {},
  };
}

/**
 * Counts one build of a screen, by its `data-screen` name.
 *
 * Called by the shell for every screen it builds, lazy or not. It writes only
 * into the test-hook object, so a build with the hooks not installed does
 * nothing at all.
 */
export function countScreenMount(name: string, target: Window = window): void {
  const hooks = target.__pianopath;
  if (!hooks) return;
  const counts = hooks.screenMounts as Record<string, number>;
  counts[name] = (counts[name] ?? 0) + 1;
}
