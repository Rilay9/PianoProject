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
 * Only the walk lives here. Parsing the manifest and building the listing stay
 * where they were: they are fast, they need no file system, and splitting them
 * across a message boundary would buy nothing and cost a second copy of every
 * file.
 */

/** Sent to the worker to start a walk. */
export interface WalkRequest {
  handle: FileSystemDirectoryHandle;
  manifestName: string;
  /** Extensions that count as a score, lower case, with the dot. */
  scoreExtensions: string[];
  maxFiles: number;
  readChunk: number;
}

/** Sent back as the walk goes, and once when it ends. */
export type WalkMessage =
  | { kind: 'counting'; seen: number; file: string }
  | { kind: 'reading'; done: number; total: number; file: string }
  | {
      kind: 'done';
      files: [string, File][];
      manifest: File | null;
      manifestRoot: string;
    }
  | { kind: 'failed'; reason: 'too-many' | 'unreadable'; message: string };

function isScoreFile(path: string, extensions: readonly string[]): boolean {
  const lower = path.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext));
}

/**
 * The walk itself, with somewhere to send what it finds.
 *
 * Exported and given `post` rather than reaching for `self.postMessage`, so it
 * can be driven directly by a test. Running it through a fake `Worker` instead
 * meant asserting the module-loading trick rather than the walk, and the trick
 * broke first.
 */
export async function walkFolder(
  request: WalkRequest,
  post: (message: WalkMessage) => void,
): Promise<void> {
  let manifestHandle: FileSystemFileHandle | null = null;
  let manifestRoot = '';
  const scoreHandles: { path: string; handle: FileSystemFileHandle }[] = [];
  const stack: { dir: FileSystemDirectoryHandle; prefix: string }[] = [
    { dir: request.handle, prefix: '' },
  ];
  let seen = 0;
  /**
   * How often the count is reported, in milliseconds.
   *
   * A message costs this thread almost nothing, which is what "every file, not
   * one in every N" was reasoning from — but it does not land on this thread.
   * Every one of them wakes the main thread to deserialize it and run a
   * handler, and 37,261 of those is a wake-up every few hundred microseconds
   * on the one thread that has to answer taps. Throttling the *painting* did
   * not help, because the throttle itself ran 37,261 times.
   *
   * The numbers change far faster than anyone can read them, so nothing is
   * lost — except the last one, which is why it is flushed below rather than
   * left to the throttle.
   */
  const COUNT_EVERY_MS = 50;
  let countedAt = -Infinity;
  let pending: { seen: number; file: string } | null = null;
  while (stack.length > 0) {
    const next = stack.pop();
    if (!next) break;
    for await (const entry of next.dir.values()) {
      const path = next.prefix + entry.name;
      if (entry.kind === 'directory') {
        stack.push({ dir: entry, prefix: path + '/' });
        continue;
      }
      seen += 1;
      if (seen > request.maxFiles) {
        post({
          kind: 'failed',
          reason: 'too-many',
          message: `That folder holds more than ${request.maxFiles.toLocaleString()} files. Pick the folder with the scores in it, not the one above it.`,
        });
        return;
      }
      if (entry.name === request.manifestName) {
        if (manifestHandle === null || next.prefix.length < manifestRoot.length) {
          manifestHandle = entry;
          manifestRoot = next.prefix;
        }
        continue;
      }
      if (isScoreFile(path, request.scoreExtensions)) scoreHandles.push({ path, handle: entry });
      pending = { seen, file: path };
      const at = performance.now();
      if (at - countedAt >= COUNT_EVERY_MS) {
        countedAt = at;
        post({ kind: 'counting', ...pending });
        pending = null;
      }
    }
  }
  // The last count always lands, whatever the throttle would have said: the
  // number the owner is left looking at while the reading pass starts has to be
  // the real total found, not wherever the clock happened to stop.
  if (pending) post({ kind: 'counting', ...pending });

  const files: [string, File][] = [];
  const manifest = manifestHandle === null ? null : await manifestHandle.getFile();
  for (let at = 0; at < scoreHandles.length; at += request.readChunk) {
    const chunk = scoreHandles.slice(at, at + request.readChunk);
    const opened = await Promise.all(chunk.map((entry) => entry.handle.getFile()));
    chunk.forEach((entry, index) => {
      const file = opened[index];
      if (file) files.push([entry.path, file]);
    });
    const last = chunk[chunk.length - 1];
    post({
      kind: 'reading',
      done: Math.min(at + chunk.length, scoreHandles.length),
      total: scoreHandles.length,
      file: last ? last.path : '',
    });
  }
  post({ kind: 'done', files, manifest, manifestRoot });
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
