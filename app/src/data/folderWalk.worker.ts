/**
 * Walks a picked folder off the main thread.
 *
 * The owner's phone froze on a real import: the files arrived and looked right,
 * the app stopped answering, and the phone struggled while it sat in the
 * background. Throttling the progress read-out and opening the files in chunks
 * took most of the wait out of it, but the work was still happening on the
 * thread that has to answer taps — so the fixes were making a saturated thread
 * less saturated rather than making it free.
 *
 * A directory handle is serializable, so the whole walk can happen here
 * instead. Three things follow. The main thread stays responsive by
 * construction, however many files there are. Cancel is a message rather than
 * a flag checked between blocking hops, so it is honoured immediately. And a
 * browser that throttles a page it cannot see slows this down instead of
 * wedging it, which is what "it hung in the background" was.
 *
 * Three things changed when the manifest became the index and this became the
 * fallback (see `folderLibrary.ts`):
 *
 *   - **Nothing is opened.** The walk used to name every file and then call
 *     `getFile()` on all 37,261 of them, because the listing was built out of
 *     `File` objects. It is built out of *paths* now — a row needs a path, and
 *     `Add` descends that path when it wants the bytes — so the second pass, a
 *     round trip per file and most of the wait on Android, is gone entirely.
 *   - **It reports in folders, not in files.** The root's directories are
 *     counted before any of them is entered, so "319 of 619 folders" is a real
 *     fraction from the first second rather than a count with no denominator.
 *   - **It is resumable.** Each top-level folder is finished before the next is
 *     started and its name is announced when it is done, so an interrupted run
 *     has a list of what is left and can be asked for exactly that. A phone
 *     that kills the app half way through 37,261 files must not start again
 *     from nothing.
 */

/** Sent to the worker to start a walk. */
export interface WalkRequest {
  handle: FileSystemDirectoryHandle;
  manifestName: string;
  /** Extensions that count as a score, lower case, with the dot. */
  scoreExtensions: string[];
  maxFiles: number;
  /**
   * Only these top-level folders, by name — how an interrupted run is finished.
   *
   * The root's own files are cheap and are read either way; everything else is
   * skipped unless it is named here. Absent means all of them.
   */
  only?: string[];
  /** How many paths travel in one message. */
  batchSize?: number;
}

/** Sent back as the walk goes, and once when it ends. */
export type WalkMessage =
  /** The root has been read: this is how many folders there are to go through. */
  | { kind: 'plan'; branches: string[]; files: number }
  /** Scores found since the last one of these. */
  | {
      kind: 'found';
      paths: string[];
      seen: number;
      file: string;
      branchesDone: number;
      branches: number;
    }
  /** One top-level folder is completely indexed — a place an interrupted run can resume from. */
  | { kind: 'branch'; name: string; branchesDone: number; branches: number; seen: number }
  /** Where a `library.json` was found, if one turned up deeper than the probe looks. */
  | { kind: 'manifest'; path: string }
  | { kind: 'done'; seen: number }
  | { kind: 'failed'; reason: 'too-many' | 'unreadable'; message: string };

/**
 * What the caller can do to a walk that is running on its own thread.
 *
 * Only the main-thread fallback passes these. In a worker, cancelling is
 * `terminate()` and there is no UI on this thread to give a tick to.
 */
export interface WalkHost {
  /** Checked between entries; true ends the walk where it stands. */
  stopped?: () => boolean;
  /** Awaited between batches, so the thread being borrowed can still paint. */
  breathe?: () => Promise<void>;
}

function isScoreFile(path: string, extensions: readonly string[]): boolean {
  const lower = path.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext));
}

/** How many paths are sent in one message when nothing else flushes them. */
const BATCH_SIZE = 500;

/**
 * The walk itself, with somewhere to send what it finds.
 *
 * Exported and given `post` rather than reaching for `self.postMessage`, so it
 * can be driven directly by a test — and so the main thread can run the very
 * same code when there is no worker to be had. Running it through a fake
 * `Worker` instead meant asserting the module-loading trick rather than the
 * walk, and the trick broke first.
 */
export async function walkFolder(
  request: WalkRequest,
  post: (message: WalkMessage) => void,
  host: WalkHost = {},
): Promise<void> {
  const batchSize = request.batchSize ?? BATCH_SIZE;
  const only = request.only === undefined ? null : new Set(request.only);
  let seen = 0;
  /** The prefix of the shallowest `library.json` seen, or null for none yet. */
  let manifestRoot: string | null = null;
  let batch: string[] = [];
  let lastPath = '';
  let branchesDone = 0;
  const branches: { name: string; dir: FileSystemDirectoryHandle }[] = [];

  const flush = (): void => {
    if (batch.length === 0) return;
    post({
      kind: 'found',
      paths: batch,
      seen,
      file: lastPath,
      branchesDone,
      branches: branches.length,
    });
    batch = [];
  };

  /** One file entry. `false` means the ceiling was hit and the walk is over. */
  const consider = (entry: FileSystemFileHandle, path: string, prefix: string): boolean => {
    seen += 1;
    if (seen > request.maxFiles) {
      post({
        kind: 'failed',
        reason: 'too-many',
        message: `That folder holds more than ${request.maxFiles.toLocaleString()} files. Pick the folder with the scores in it, not the one above it.`,
      });
      return false;
    }
    if (entry.name === request.manifestName) {
      // Shallowest wins. The phone's own unzip puts the archive's folder inside
      // a folder of the same name, and the person picks the outer one.
      if (manifestRoot === null || prefix.length < manifestRoot.length) {
        manifestRoot = prefix;
        post({ kind: 'manifest', path });
      }
      return true;
    }
    if (isScoreFile(path, request.scoreExtensions)) {
      batch.push(path);
      lastPath = path;
    }
    return true;
  };

  // The root first, and only the root: its directories are the denominator
  // every later message reports against, and they are not knowable until it
  // has been read to the end.
  for await (const entry of request.handle.values()) {
    if (host.stopped?.()) return;
    if (entry.kind === 'directory') {
      branches.push({ name: entry.name, dir: entry });
      continue;
    }
    if (!consider(entry, entry.name, '')) return;
  }
  post({ kind: 'plan', branches: branches.map((branch) => branch.name), files: seen });
  flush();

  for (const branch of branches) {
    if (host.stopped?.()) return;
    // Announced as done even when it is skipped: `branchesDone` is what the
    // screen turns into "319 of 619", and a resumed run that did not count the
    // folders it already has would count backwards from where it left off.
    if (only !== null && !only.has(branch.name)) {
      branchesDone += 1;
      post({ kind: 'branch', name: branch.name, branchesDone, branches: branches.length, seen });
      continue;
    }
    // Iterative rather than recursive, and one branch at a time rather than one
    // stack over the whole tree: a branch finished is a thing that can be
    // written down, and a stack spanning the tree has no such moment in it.
    const stack: { dir: FileSystemDirectoryHandle; prefix: string }[] = [
      { dir: branch.dir, prefix: branch.name + '/' },
    ];
    while (stack.length > 0) {
      const next = stack.pop();
      if (!next) break;
      for await (const entry of next.dir.values()) {
        if (host.stopped?.()) return;
        const path = next.prefix + entry.name;
        if (entry.kind === 'directory') {
          stack.push({ dir: entry, prefix: path + '/' });
          continue;
        }
        if (!consider(entry, path, next.prefix)) return;
        if (batch.length >= batchSize) {
          flush();
          await host.breathe?.();
        }
      }
    }
    flush();
    branchesDone += 1;
    post({ kind: 'branch', name: branch.name, branchesDone, branches: branches.length, seen });
    await host.breathe?.();
  }
  post({ kind: 'done', seen });
}

/** The shell: a message in, `walkFolder`'s messages out. */
function listen(): void {
  const post = (message: WalkMessage): void => {
    self.postMessage(message);
  };
  self.onmessage = (event: MessageEvent<WalkRequest>): void => {
    void walkFolder(event.data, post).catch((cause: unknown) => {
      post({
        kind: 'failed',
        reason: 'unreadable',
        message: cause instanceof Error ? cause.message : 'That folder could not be read.',
      });
    });
  };
}

// Guarded so the module can be imported by a test without a worker scope.
if (typeof self !== 'undefined' && typeof self.postMessage === 'function') listen();
