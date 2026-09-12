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
import {
  openDB,
  type DBSchema,
  type IDBPDatabase,
  type IDBPTransaction,
  type StoreNames,
} from 'idb';

export const DB_NAME = 'pianopath';
/**
 * 2 adds `levelOverrides` (replan §1.4); 3 adds `folderLibraries` (`04` §4b);
 * 4 gives an import the rungs it belongs to (replan §4.3); 5 adds `books` —
 * the shelf of paper the owner already owns (replan §5.1); 6 splits a folder
 * listing into one record per score plus a compact per-folder index, so
 * opening the browse screen and adding one piece stop costing the whole
 * listing (see `folderLibraries` below).
 */
export const DB_VERSION = 6;

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
  /**
   * Paper runs only (replan §5.3): the standard deviation of onset offset from
   * the nearest metronome click, in ms.
   *
   * Absent when the metronome was off, when there was no MIDI, or when too few
   * notes landed near a click for the number to be evidence. Its absence means
   * "not measured" and never "measured as zero".
   */
  steadinessMs?: number;
  /** Paper runs: how many note-ons were heard. Not how many were right. */
  notesHeard?: number;
  /** The click's tempo, when there was one. */
  bpm?: number;
  /**
   * A run played as a performance (replan §8): started once, no restarts and
   * no looping, and recorded as such whatever the accuracy came out at.
   *
   * The point is not the score. It is that playing a piece through for
   * somebody is a different act from practising it, and the Progress screen
   * lists them separately so the owner can see he has actually done it.
   */
  performance?: boolean;
}

export type ImportKind = 'musicxml' | 'pdf';

export interface ImportRow {
  id: string;
  kind: ImportKind;
  title: string;
  /** MusicXML text, or the PDF's bytes. */
  data: string | ArrayBuffer;
  /**
   * How big `data` is, in real bytes, written when the row is.
   *
   * Recorded rather than measured because measuring means loading the file,
   * and the one screen that wants the number is the storage report — the
   * screen the owner opens *because* storage is tight. It is also the only way
   * to be honest about text: `String.length` is UTF-16 code units, and the
   * report puts its total beside `navigator.storage.estimate()`, which is
   * bytes. A MusicXML score full of accented composer names was being
   * under-reported against a real measurement.
   *
   * Optional because rows written before this existed do not have it; the
   * reader fills it in for those from the row it has already loaded.
   */
  bytes?: number;
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
  /**
   * The folder row this came from, when it came from one.
   *
   * The folder screen has to know which of its 37,261 rows are already in the
   * library, and it used to answer by matching titles — which greys out the
   * five other *Entertainer*s and the dozens of *Minuet in G*s the moment one
   * is added. The file name inside the folder is the identity that actually
   * distinguishes them. Absent on anything imported by share or picker, which
   * is why the title fallback stays.
   */
  origin?: { folder: string; file: string };
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

/** Where a listing came from, and so what it can be trusted to know. */
export type FolderListing = 'manifest' | 'walk' | 'partial';

/**
 * One score in one folder, as its own record.
 *
 * **This used to be an element of `FolderLibraryRow.scores`, and that was the
 * fault.** IndexedDB cannot read or write part of a record, so a listing held
 * as one array meant that every operation cost the whole 37,261 of it: opening
 * the browse screen deserialized some forty megabytes to draw a screenful, and
 * taking one dead row out of the listing read the array, copied it, and wrote
 * all of it back. One record per score makes both of those proportional to
 * what is actually wanted — a page of sixty rows, or one row.
 *
 * The key is `[folder, file]`, which is the identity the rest of the app
 * already uses: `ImportRow.origin` is exactly that pair.
 */
export interface FolderScoreRow extends FolderScore {
  /** The folder this sits in. First half of the key and of `byTitle`. */
  folder: string;
  /**
   * The title, folded — accents off, lower-cased — which is what `byTitle` is
   * an index on.
   *
   * Stored rather than derived because an index can only be built on a field
   * that is in the record, and it is what turns the A-to-Z rail from a walk of
   * the listing into a key-range seek.
   */
  sort: string;
  /**
   * ISO date-time at which the file behind this row was found to be gone.
   *
   * Marked rather than deleted: a rescan run while the card is out would
   * otherwise throw away the whole listing, and a row that comes back should
   * come back as itself. A marked row is left out of the folder's index, so
   * nothing lists it, and a later scan that finds the file clears the mark.
   */
  missingAt?: string;
}

/**
 * The compact per-folder index the browse screen filters over.
 *
 * `ui/screens/FolderScreen.ts` already folds every title once at load into
 * parallel arrays and filters over *those* on each keystroke — that part was
 * always right. What was wrong is where the arrays came from: they were built
 * by reading all 37,261 full rows, which is forty-odd megabytes of structured
 * clone to produce about two of index. So the arrays are stored, and opening
 * the screen reads this record instead of the rows. The rows are then fetched
 * by key, for the sixty that are about to be drawn.
 *
 * Everything here is parallel to `files` and in the same order, which is the
 * order the listing is drawn in.
 */
export interface FolderIndexRow {
  /** The folder's name — the same key `folderLibraries` uses. */
  id: string;
  /** Each row's path, which is also the second half of its record's key. */
  files: string[];
  /** `fold(title + ' ' + composer)` — what the search box matches against. */
  haystacks: string[];
  /**
   * One character per row: the letter it files under, packed into a single
   * string rather than an array of 37,261 one-character strings.
   */
  letters: string;
  /** `NaN` where a row has no level, which is not the same as level 0. */
  levels: Float64Array;
  /** The distinct styles, sorted — which is also what the filter's menu lists. */
  styleNames: string[];
  /** An index into `styleNames` per row. Low-cardinality, so a dictionary. */
  styles: Uint16Array;
  /** The distinct statuses. Same dictionary trick, same reason. */
  statusNames: string[];
  statuses: Uint16Array;
  /** 1 where `rating >= 4 && ratings >= 5` — all the rated filter asks. */
  rated: Uint8Array;
  /** How many rows are titled with a placeholder or a content hash. */
  unnamed: number;
}

/**
 * A folder of scores the owner pointed the app at — the folder itself, not
 * its contents.
 *
 * The rows are kept and the *files* are not: Android grants a folder for one
 * visit only unless a handle was kept (see `folderLibrary.ts`), so a
 * stored handle is not on offer. Keeping the listing means browsing 37,000
 * scores works with nothing plugged in; adding one asks for the folder again.
 *
 * The scores themselves live in `folderScores`, one record each, and the index
 * the screen filters over lives in `folderIndexes`. This row is the handful of
 * facts about the folder as a whole, so reading every saved folder — which is
 * what the screen does first, on every visit — is a few small records.
 */
export interface FolderLibraryRow {
  /** The folder's own name, which is all Android tells us about where it is. */
  id: string;
  addedAt: string;
  /** From the folder's `library.json`, when it had one. */
  source: string | null;
  /** Listable rows — every score in the folder bar the ones marked missing. */
  count?: number;
  /** How the listing was made, and so what it cannot know. */
  listedFrom?: FolderListing;
  /** Top-level folders an interrupted walk has still to index. */
  pending?: string[];
  /**
   * Paths marked missing since the index was last built.
   *
   * Kept here, in the small record, rather than folded into the index: a row
   * dropping out is a one-row change, and rebuilding the index for it would
   * put a megabyte-and-a-half write back on the path this whole shape exists
   * to take it off. The next scan rebuilds the index without them and empties
   * this, so it stays as short as the number of files deleted between scans.
   */
  missing?: string[];
  /**
   * A `FileSystemDirectoryHandle`, when the browser gave one and the owner
   * asked for it to be kept (the `folderHandles` setting).
   *
   * Typed as `unknown` because it is a live browser object IndexedDB stores by
   * structured clone, not a shape this file should describe;
   * `data/folderLibrary.ts` is the only thing that opens it, and it checks
   * before using it. Absent on every folder picked the ordinary way.
   */
  handle?: unknown;
  /**
   * The whole listing, as every build before version 6 wrote it.
   *
   * Not written any more. It is still read, once, by `folderLibrary.ts`'s
   * `folderIndex()`: a row in this shape is split into records and an index
   * the first time the folder is opened, and the field is dropped. Doing it
   * there rather than in the `upgrade` block is deliberate — rewriting 37,261
   * records inside a `versionchange` transaction blocks every other connection
   * to the database for as long as it takes, and a blocked open at start-up is
   * precisely the failure `app/boot.ts` is written around.
   */
  scores?: FolderScore[];
}

/**
 * One piece inside a book on the shelf (replan §5.1).
 *
 * Registered by hand: the owner is looking at paper and types a page number.
 * Nothing is scanned and nothing is inferred — that is the honest input, and
 * it is why `page` is a number he read rather than something OMR guessed.
 */
export interface BookPiece {
  id: string;
  title: string;
  /** Page in the book. Opens the linked PDF there, when there is one. */
  page?: number;
  /** Bars this piece occupies, when he wants only part of a page. */
  bars?: [number, number];
  /** Rungs it is an option of — the same overlay mechanism as an import. */
  lessonIds: string[];
  concepts: string[];
  level?: number;
  levelSource: 'estimated' | 'judged';
  /**
   * A MusicXML twin: an import, or a bundled item linked by search.
   *
   * This is what makes a paper piece *scorable*. With a twin the Score screen
   * can run it properly and credit the book piece too; without one the paper
   * screen measures only what it can actually hear (replan §5.3).
   */
  itemId?: string;
}

/**
 * A book the owner owns, on paper (replan §5.1).
 *
 * The app has no copy of it and never will. What it has is a list of what is
 * in it and which rung each piece answers, so a rung can say "or the
 * equivalent in your book" and mean something specific.
 */
export interface BookRow {
  /** `book.<slug>`. */
  id: string;
  title: string;
  author?: string;
  kind: 'method' | 'repertoire' | 'other';
  /** The owner's own PDF of it, if he has one, as an import id. */
  pdfImportId?: string;
  /** For the PDF viewer's timed mode. Per book, not per open. */
  barsPerSystem?: number;
  pieces: BookPiece[];
  addedAt: string;
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
  folderScores: {
    key: [string, string];
    value: FolderScoreRow;
    indexes: { byTitle: [string, string] };
  };
  folderIndexes: { key: string; value: FolderIndexRow };
  books: { key: string; value: BookRow };
}

let dbPromise: Promise<IDBPDatabase<PianoPathDb> | null> | null = null;

/**
 * Whether a version bump is being held up by a connection somewhere else, and
 * by which version.
 *
 * `null` is the ordinary state. It becomes a value when `blocked` fires, which
 * means another page — another tab, or the outgoing page of a service-worker
 * update's own reload — still holds this database open at the older version.
 * The screen that can say something useful about it is the storage report.
 */
export interface DatabaseBlock {
  /** The version this page is trying to open at. */
  wanted: number;
  /** The version the connection in the way is holding, when it says. */
  held: number | null;
  /** True once the open gave up waiting and the app fell back to memory. */
  gaveUp: boolean;
}

let block: DatabaseBlock | null = null;

/** What is holding the database open at an older version, if anything. */
export function databaseBlock(): DatabaseBlock | null {
  return block;
}

/**
 * How long a blocked open waits before the app carries on without a database.
 *
 * The alternative is what used to happen, and it is much worse than no
 * storage: a blocked `open()` never fires `success` *or* `error` — only the
 * silent `blocked` event — so `hydratePersisted()` never settled, and
 * `app/boot.ts`'s own note records the result, which was a launch with no tab
 * bar at all. Every store above this one already falls back to memory for the
 * session when there is no database, so giving up is a degraded app rather
 * than a dead one, and the storage report says which it is. The real open is
 * left running: whichever call comes next gets it once the other connection
 * has gone away.
 */
export const BLOCKED_GIVE_UP_MS = 4000;

export function openDatabase(): Promise<IDBPDatabase<PianoPathDb> | null> {
  // `openDB` throws synchronously rather than rejecting when there is no
  // IndexedDB at all, which is the case in a test environment and in a
  // browser with site data blocked — so the guard has to come first.
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (dbPromise === null) {
    // Asked alongside the first open rather than from a screen: by the time a
    // screen could ask, rows have already been written in best-effort mode.
    askToPersist();
    dbPromise = openBounded();
  }
  return dbPromise;
}

function openBounded(): Promise<IDBPDatabase<PianoPathDb> | null> {
  let settle: (db: IDBPDatabase<PianoPathDb> | null) => void = () => undefined;
  const bounded = new Promise<IDBPDatabase<PianoPathDb> | null>((resolve) => {
    settle = resolve;
  });
  let done = false;
  const finish = (db: IDBPDatabase<PianoPathDb> | null): void => {
    if (done) return;
    done = true;
    settle(db);
  };

  const open = openDb();
  void open.then((db) => {
    // The request that was blocked has come through after all, which means the
    // connection in the way has closed. Nothing to report any more.
    if (db !== null && block !== null && !block.gaveUp) block = null;
    finish(db);
  });
  return bounded;

  function openDb(): Promise<IDBPDatabase<PianoPathDb> | null> {
    return openDB<PianoPathDb>(DB_NAME, DB_VERSION, {
      // `oldVersion` is 0 on a fresh database and the previous version on an
      // upgrade, so each block runs exactly once and a phone that has been on
      // version 1 since P7 keeps every row it has.
      upgrade,
      /**
       * Something else is holding the old version open, so this open will not
       * complete until it lets go.
       *
       * There was no handler here at all, and that is the hole `app/boot.ts`
       * describes: the spec fires neither `success` nor `upgradeneeded` while
       * an open is blocked, so the promise simply never settled and everything
       * awaiting it waited for ever. Two things change that. The other page now
       * closes itself (see `blocking`), which fixes it outright whenever both
       * pages are running this code; and when the page in the way is an older
       * build that has no such handler, this bounds the wait.
       */
      blocked(currentVersion, blockedVersion) {
        block = { wanted: blockedVersion ?? DB_VERSION, held: currentVersion, gaveUp: false };
        setTimeout(() => {
          if (done) return;
          if (block) block.gaveUp = true;
          // The next caller waits on the real open rather than starting a
          // second one, so the moment the other connection goes away the app
          // has its database back without a reload.
          dbPromise = open;
          finish(null);
        }, BLOCKED_GIVE_UP_MS);
      },
      /**
       * This connection is what is standing in another one's way.
       *
       * The other side of the same fault, and the half that actually cures it:
       * a service-worker update reloads the page, the outgoing page's
       * connection is not reliably gone before the incoming page asks to open
       * at the bumped version, and the incoming page then blocks on a
       * connection nobody is using. Letting go at once costs this page
       * nothing — `dbPromise` is cleared, so the next read reopens, by which
       * time the upgrade will have happened.
       */
      blocking() {
        const held = dbPromise;
        dbPromise = null;
        void held?.then((db) => {
          db?.close();
        });
      },
      /**
       * The browser closed the connection underneath us — storage cleared, or
       * the tab evicted. Forgetting it means the next read opens a fresh one
       * instead of calling into a dead handle for the rest of the session.
       */
      terminated() {
        dbPromise = null;
      },
    }).catch(() => null);
  }
}

/** The transaction an upgrade runs in — every store, at `versionchange`. */
type UpgradeTx = IDBPTransaction<PianoPathDb, StoreNames<PianoPathDb>[], 'versionchange'>;

// `oldVersion` is 0 on a fresh database and the previous version on an
// upgrade, so each block runs exactly once and a phone that has been on
// version 1 since P7 keeps every row it has.
function upgrade(
  db: IDBPDatabase<PianoPathDb>,
  oldVersion: number,
  _newVersion: number | null,
  tx: UpgradeTx,
): void {
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
      if (oldVersion < 5) {
        // The shelf (replan §5.1). A whole store rather than a field, because
        // a book is a thing in its own right: it has pieces, and a piece has
        // its own rungs, page and level.
        db.createObjectStore('books', { keyPath: 'id' });
      }
      if (oldVersion < 6) {
        // The stores are made here; the listings already on the phone are
        // **not** moved into them here. A `versionchange` transaction holds
        // every other connection to the database shut for as long as it runs,
        // and rewriting the owner's 37,261 rows inside one would do that at
        // start-up, which is exactly the blocked-open failure `app/boot.ts` is
        // written around. `folderLibrary.ts`'s `folderIndex()` splits an old
        // row the first time that folder is opened instead — on a screen that
        // already has somewhere to say it is working, and where nothing else
        // is waiting on the answer.
        const scores = db.createObjectStore('folderScores', { keyPath: ['folder', 'file'] });
        // Lower-cased and accent-folded, so the A-to-Z rail is a seek over a
        // key range rather than a walk of the listing.
        scores.createIndex('byTitle', ['folder', 'sort']);
        db.createObjectStore('folderIndexes', { keyPath: 'id' });
      }
}

/**
 * Whether the browser has promised not to evict this app's storage.
 *
 * `null` until the question has been put, which `openDatabase()` does the
 * first time anything opens the database.
 */
export type PersistenceState = 'persisted' | 'best-effort' | 'unavailable' | null;

let persistence: PersistenceState = null;

/** What `navigator.storage.persist()` answered, or `null` before it was asked. */
export function persistenceState(): PersistenceState {
  return persistence;
}

/**
 * Asks the browser to stop treating this app's storage as disposable.
 *
 * **Nothing in the app asked, and everything in it is local.** IndexedDB
 * starts in best-effort mode, which means the browser is free to throw the
 * whole origin away when the device runs short of space — and what it would be
 * throwing away is the practice history, the progress, the imported scores and
 * the folder listing, none of which exists anywhere else. There is no server
 * copy to come back from.
 *
 * Asked once, from here, because this is the one place every store goes
 * through and because it has to be asked *before* the answer matters rather
 * than from a screen the owner may never open. Chrome grants it silently for
 * an installed PWA — installation is one of the signals it scores — so on the
 * phone this is expected to be a promotion with no prompt at all; a browser
 * that would prompt instead is one where the app is not installed, and there
 * the answer is simply no and nothing is worse than it was.
 *
 * Fire and forget: the answer changes what the storage report says and nothing
 * else. A failure is an answer too.
 */
function askToPersist(): void {
  const storage = (globalThis as { navigator?: { storage?: StorageManager } }).navigator?.storage;
  if (typeof storage?.persist !== 'function') {
    persistence = 'unavailable';
    return;
  }
  void (async () => {
    try {
      // Already granted is the common case after the first launch, and asking
      // again is free — but `persisted()` is cheaper and never prompts.
      const already = (await storage.persisted?.()) ?? false;
      persistence = already || (await storage.persist()) ? 'persisted' : 'best-effort';
    } catch {
      persistence = 'unavailable';
    }
  })();
}

/* ---------------------------------------------------------------------------
 * Storage Buckets: considered, and the answer is no.
 *
 * The API splits an origin's storage into named buckets, each with its own
 * durability, persistence and expiry, and — the part that would matter here —
 * its own eviction. So it looks made for this app's one real asymmetry: the
 * folder listing (`folderScores` and `folderIndexes`, some 6 MB of it) is the
 * only thing in the database that can be rebuilt, because the files it
 * describes are on the phone and one folder pick reads them again. Everything
 * else — the practice history, the progress, the imported scores — exists
 * nowhere else at all. A bucket per class would let a phone running short of
 * space throw away the rebuildable half and keep the year of practice.
 *
 * It is still the wrong trade, for three reasons that do not depend on which
 * Chrome the phone is running:
 *
 *   1. **A bucket is a separate IndexedDB namespace.** `bucket.indexedDB`
 *      opens a *different* database from `indexedDB`, with its own version
 *      ladder, its own upgrades and its own `blocked` path. The change this
 *      file has just been through exists because one blocked open left the app
 *      shell unmounted; doubling the number of connections that can block, to
 *      protect 6 MB that a folder pick rebuilds, is paying in the currency
 *      that has already cost the most.
 *   2. **The line is already drawn, and drawn for free.** `STORE_NAMES` below
 *      leaves the folder stores out of the backup for exactly the reason a
 *      bucket would be created: they are rebuildable. Eviction and export want
 *      the same answer, and one list gives it.
 *   3. **`persist()` makes the question moot in the case that matters.** An
 *      installed PWA is expected to be granted persistence, and a persisted
 *      origin is not evicted — so there is nothing to prioritise. When it is
 *      *not* granted, the browser evicts the whole origin rather than choosing
 *      within it, and a bucket would then be the difference between losing the
 *      listing and losing everything. That is the case worth revisiting, and
 *      the storage report now says when the app is in it (Settings →
 *      Content: "Storage is best-effort…").
 *
 * Revisit when both halves are true on the phone: `navigator.storageBuckets`
 * exists there, *and* the report says best-effort. Until then this is a
 * mechanism with no risk to answer.
 * ------------------------------------------------------------------------- */

/**
 * Every store name, in the order an export writes them.
 *
 * `folderLibraries` is deliberately absent, and so are `folderScores` and
 * `folderIndexes` for the same reason. Between them they are a 6 MB listing of
 * files that are on the phone anyway, rebuilt by pointing at the folder again
 * — putting it in the backup would multiply the size of the one file that
 * holds a year of practice, to save a single tap.
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
  'books',
] as const;

export type StoreName = (typeof STORE_NAMES)[number];

/** Test hook: forgets the cached handle so a fresh database is opened. */
export function resetDatabaseForTest(): void {
  dbPromise = null;
  block = null;
  persistence = null;
}
