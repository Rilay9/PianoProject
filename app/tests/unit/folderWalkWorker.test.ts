// @vitest-environment jsdom
/**
 * The walk goes to a worker, comes home when it cannot, and can be finished
 * later when it is interrupted.
 *
 * A real import froze the owner's phone: the files arrived and looked right,
 * the app stopped answering taps, and the phone struggled while the page sat in
 * the background. Throttling the read-out and opening files in chunks took most
 * of the wait out, but the work still ran on the thread that has to answer — so
 * those were a saturated thread made less saturated rather than a free one.
 *
 * A directory handle is serializable, so the walk can happen off-thread. What
 * is asserted here is the walk itself, driven directly, plus the two wiring
 * failures that would otherwise be silent: a fallback that always fires looks
 * exactly like a fix that works, and a `postMessage` that throws inside a
 * promise surfaces as "no scores found" rather than as an error.
 *
 * Three things about the walk changed when the manifest became the index and
 * this became the fallback, and each has its own test below: it opens no files,
 * it reports in folders rather than in files, and it can be asked for only the
 * folders an earlier run did not reach.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { addFromFolder, readFolderHandle } from '../../src/data/folderLibrary';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { walkFolder, type WalkMessage } from '../../src/data/folderWalk.worker';

const MUSICXML = `<?xml version="1.0"?>
<score-partwise version="4.0">
  <work><work-title>Walked</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><note><rest/><duration>4</duration></note></measure></part>
</score-partwise>`;

/**
 * A real `.mxl` — a zip with a container and a score in it.
 *
 * Not a stub eight bytes of zip header. The importer opens what it is given,
 * so a fake one only ever proves the importer rejects fakes, and the question
 * here is whether a file that travelled through a worker still opens.
 */
function mxl(): Uint8Array {
  return zipSync({
    'META-INF/container.xml': strToU8(
      '<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>',
    ),
    'score.xml': strToU8(MUSICXML),
  });
}

interface Tally {
  /** Files actually opened. The walk must open none of them. */
  opened: string[];
  /** Directories enumerated, by path — which is what "was this branch walked" means. */
  listed: string[];
}

/**
 * A directory handle over a set of paths, as the picker would give one.
 *
 * `getFileHandle` and `getDirectoryHandle` are not decoration: descending one
 * path is how `Add` fetches a file now, and how the manifest is found without
 * enumerating anything. A double without them could only ever be walked, so it
 * could only ever exercise the expensive path.
 */
function fakeHandle(files: Record<string, Uint8Array | string>): { handle: unknown; tally: Tally } {
  const tally: Tally = { opened: [], listed: [] };
  const entries = Object.entries(files);
  function dirFor(prefix: string): Record<string, unknown> {
    const here = new Map<string, unknown>();
    for (const [path, contents] of entries) {
      if (!path.startsWith(prefix)) continue;
      const rest = path.slice(prefix.length);
      const cut = rest.indexOf('/');
      if (cut === -1) {
        const bytes = typeof contents === 'string' ? new TextEncoder().encode(contents) : contents;
        here.set(rest, {
          kind: 'file',
          name: rest,
          getFile: () => {
            tally.opened.push(prefix + rest);
            return Promise.resolve(new File([bytes as BlobPart], rest));
          },
        });
      } else {
        const dir = rest.slice(0, cut);
        if (!here.has(dir)) {
          here.set(dir, { kind: 'directory', name: dir, ...dirFor(prefix + dir + '/') });
        }
      }
    }
    const child = (name: string, kind: 'file' | 'directory'): Promise<unknown> => {
      const found = here.get(name);
      if (found && (found as { kind?: string }).kind === kind) return Promise.resolve(found);
      return Promise.reject(new DOMException(`no such ${kind}: ${name}`, 'NotFoundError'));
    };
    return {
      kind: 'directory',
      values: () => {
        tally.listed.push(prefix);
        return here.values();
      },
      getFileHandle: (name: string) => child(name, 'file'),
      getDirectoryHandle: (name: string) => child(name, 'directory'),
      queryPermission: () => Promise.resolve('granted' as PermissionState),
    };
  }
  return { tally, handle: { name: 'Scores', ...dirFor('') } };
}

const FILES = { 'aa/one.mxl': mxl(), 'bb/two.mxl': mxl() };

function request(handle: unknown, over: Record<string, unknown> = {}) {
  return {
    handle: handle as never,
    manifestName: 'library.json',
    scoreExtensions: ['.mxl', '.musicxml', '.xml'],
    maxFiles: 100_000,
    ...over,
  };
}

/** Every score path the walk announced, in the order it announced them. */
function pathsFrom(messages: WalkMessage[]): string[] {
  return messages.flatMap((message) => (message.kind === 'found' ? message.paths : []));
}

describe('the walk itself', () => {
  it('names every score and opens not one file', async () => {
    // The listing is built out of paths now, and `Add` descends the path of the
    // one score it wants. The old walk called `getFile()` on all 37,261 — a
    // round trip each, and by the profile most of the wait on Android — to
    // build rows it then threw the files away from.
    const { handle, tally } = fakeHandle(FILES);
    const messages: WalkMessage[] = [];
    await walkFolder(request(handle), (message) => messages.push(message));

    expect(pathsFrom(messages).sort()).toEqual(['aa/one.mxl', 'bb/two.mxl']);
    expect(messages[messages.length - 1]?.kind).toBe('done');
    expect(tally.opened).toEqual([]);
  });

  it('counts the folders before it enters them, so there is a denominator at once', async () => {
    // "37,261 files" is not answerable until the walk is over, which is to say
    // until it no longer matters. How many folders there are at the top is
    // answerable after the first directory listing, and that is the number the
    // screen turns into "319 of 619".
    const many: Record<string, Uint8Array> = {};
    for (let i = 0; i < 600; i += 1) many[`${String(i % 10)}/f${String(i)}.mxl`] = mxl();
    const messages: WalkMessage[] = [];
    await walkFolder(request(fakeHandle(many).handle), (message) => messages.push(message));

    const plan = messages.find((message) => message.kind === 'plan');
    expect(plan?.kind === 'plan' ? plan.branches.length : 0).toBe(10);
    // And the end of each one is announced, because that is the point an
    // interrupted run can be picked up from.
    const branches = messages.filter((message) => message.kind === 'branch');
    expect(branches).toHaveLength(10);
    const last = branches[branches.length - 1];
    expect(last?.kind === 'branch' ? last.branchesDone : 0).toBe(10);
    expect(pathsFrom(messages)).toHaveLength(600);
  });

  it('does not wake the main thread once per file', async () => {
    // Moving the walk off the main thread does not help if the walk then wakes
    // the main thread once per file: 37,261 messages is a deserialize and a
    // handler every few hundred microseconds on the one thread that has to
    // answer taps.
    const many: Record<string, Uint8Array> = {};
    for (let i = 0; i < 600; i += 1) many[`${String(i % 10)}/f${String(i)}.mxl`] = mxl();
    const messages: WalkMessage[] = [];
    await walkFolder(request(fakeHandle(many).handle), (message) => messages.push(message));
    expect(messages.length).toBeLessThan(60);
  });

  it('walks only the folders it is asked for, which is how a stopped run is finished', async () => {
    const { handle, tally } = fakeHandle({
      'aa/one.mxl': mxl(),
      'bb/two.mxl': mxl(),
      'cc/three.mxl': mxl(),
    });
    const messages: WalkMessage[] = [];
    await walkFolder(request(handle, { only: ['cc'] }), (message) => messages.push(message));

    // The one that was left, and nothing that was already indexed: on the
    // owner's archive the difference is 618 folders not walked twice.
    expect(pathsFrom(messages)).toEqual(['cc/three.mxl']);
    expect(tally.listed).toEqual(['', 'cc/']);
    // The folders already done still count towards the total, or a resumed run
    // would count from nought and look as though it had lost its work.
    const branches = messages.filter((message) => message.kind === 'branch');
    expect(branches).toHaveLength(3);
    const last = branches[branches.length - 1];
    expect(last?.kind === 'branch' ? last.branchesDone : 0).toBe(3);
  });

  it('stops where it stands when it is told to', async () => {
    const many: Record<string, Uint8Array> = {};
    for (let i = 0; i < 40; i += 1) many[`${String(i % 8)}/f${String(i)}.mxl`] = mxl();
    const messages: WalkMessage[] = [];
    let branchesSeen = 0;
    await walkFolder(
      request(fakeHandle(many).handle),
      (message) => {
        if (message.kind === 'branch') branchesSeen += 1;
        messages.push(message);
      },
      { stopped: () => branchesSeen >= 2 },
    );
    expect(branchesSeen).toBe(2);
    expect(messages.some((message) => message.kind === 'done')).toBe(false);
  });

  it('refuses a folder far larger than the one that was meant, and stops there', async () => {
    const many: Record<string, Uint8Array> = {};
    for (let i = 0; i < 12; i += 1) many[`f${String(i)}.mxl`] = mxl();
    const messages: WalkMessage[] = [];
    await walkFolder(request(fakeHandle(many).handle, { maxFiles: 5 }), (m) => messages.push(m));

    expect(messages[messages.length - 1]?.kind).toBe('failed');
    expect(messages.some((m) => m.kind === 'done')).toBe(false);
  });

  it('picks the shallowest manifest, and does not list it as a score', async () => {
    const messages: WalkMessage[] = [];
    await walkFolder(
      request(
        fakeHandle({
          'library.json': '{"scores":[]}',
          'deep/library.json': '{"scores":[]}',
          'deep/one.mxl': mxl(),
        }).handle,
      ),
      (message) => messages.push(message),
    );
    const manifests = messages.filter((message) => message.kind === 'manifest');
    expect(manifests).toHaveLength(1);
    expect(manifests[0]?.kind === 'manifest' ? manifests[0].path : '').toBe('library.json');
    expect(pathsFrom(messages)).toEqual(['deep/one.mxl']);
  });
});

interface Recorder {
  started: number;
  posted: unknown[];
}

/**
 * A `Worker` that records what it is given and never answers.
 *
 * Only the wiring needs this. Routing the real walk through a fake worker was
 * tried and it asserted a module-loading trick rather than the walk — and the
 * trick broke before the walk did, which is the worst kind of test.
 */
function installWorker(record: Recorder, behaviour: 'silent' | 'refuse-handle' | 'none'): void {
  if (behaviour === 'none') {
    Reflect.deleteProperty(globalThis, 'Worker');
    return;
  }
  class StubWorker {
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
    onerror: (() => void) | null = null;
    constructor() {
      record.started += 1;
    }
    postMessage(message: unknown): void {
      record.posted.push(message);
      // What a browser that will not clone a handle actually does.
      if (behaviour === 'refuse-handle') {
        throw new DOMException('could not be cloned', 'DataCloneError');
      }
    }
    terminate(): void {
      // Nothing to stop.
    }
  }
  (globalThis as unknown as Record<string, unknown>).Worker = StubWorker;
}

describe('handing the walk to a worker', () => {
  let record: Recorder;
  const realWorker = (globalThis as unknown as Record<string, unknown>).Worker;

  beforeEach(() => {
    useFakeIndexedDb();
    record = { started: 0, posted: [] };
  });

  afterEach(() => {
    (globalThis as unknown as Record<string, unknown>).Worker = realWorker;
    clearFakeIndexedDb();
  });

  it('starts a worker and tells it what counts as a score', async () => {
    installWorker(record, 'silent');
    // Nothing answers, so this never resolves. The assertion is that the work
    // left this thread, which is the entire point of the change. Waited for
    // rather than counted in microtasks: the manifest is probed for first now,
    // and that is a round trip or two before the walk is started at all.
    void readFolderHandle(fakeHandle(FILES).handle as never);
    await vi.waitFor(() => {
      expect(record.started, 'the walk stayed on this thread').toBe(1);
    });
    const sent = record.posted[0] as { scoreExtensions: string[]; maxFiles: number };
    expect(sent.scoreExtensions).toContain('.mxl');
    expect(sent.maxFiles).toBeGreaterThan(0);
  });

  it('falls back to this thread when the handle cannot be posted', async () => {
    installWorker(record, 'refuse-handle');
    const library = await readFolderHandle(fakeHandle(FILES).handle as never);

    expect(record.started).toBe(1);
    // The listing is still complete. A refused clone has to read as "slower",
    // never as an empty folder.
    expect(library.scores).toHaveLength(2);
  });

  it('falls back when the browser has no workers at all', async () => {
    installWorker(record, 'none');
    const library = await readFolderHandle(fakeHandle(FILES).handle as never);
    expect(library.scores).toHaveLength(2);
  });
});

describe('adding a score after a walk that went through the worker', () => {
  const realWorker = (globalThis as unknown as Record<string, unknown>).Worker;

  afterEach(() => {
    (globalThis as unknown as Record<string, unknown>).Worker = realWorker;
  });

  /**
   * A `Worker` that runs the real walk in this thread and posts its messages
   * back, so the paths reaching `readFolderHandle` arrive the way they do in a
   * browser — through the message handler — rather than from the fallback.
   *
   * This is the gap every other folder test leaves. jsdom has no `Worker`, so
   * all of them exercise the path the owner's phone does *not* take, and the
   * first report of "Add flashes and does nothing" came from a phone.
   */
  function installRealWalkWorker(): void {
    class WalkWorker {
      onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
      onerror: (() => void) | null = null;
      postMessage(message: unknown): void {
        void walkFolder(message as Parameters<typeof walkFolder>[0], (out) => {
          this.onmessage?.({ data: out } as MessageEvent<unknown>);
        });
      }
      terminate(): void {
        // The real one stops the moment the walk resolves, and what it handed
        // over has to outlive it.
      }
    }
    (globalThis as unknown as Record<string, unknown>).Worker = WalkWorker;
  }

  it('lists the folder, and the file is fetched after the worker has gone', async () => {
    useFakeIndexedDb();
    installRealWalkWorker();
    const { handle, tally } = fakeHandle(FILES);
    const library = await readFolderHandle(handle as never);
    expect(library.scores).toHaveLength(2);
    // Nothing was opened to build the listing.
    expect(tally.opened).toEqual([]);

    const score = library.scores.find((s) => s.file === 'aa/one.mxl');
    expect(score).toBeDefined();
    const row = await addFromFolder(library.id, score!);
    expect(row.origin).toEqual({ folder: library.id, file: 'aa/one.mxl' });
    // One file, fetched by descending its own path — the thing the walk no
    // longer does for all of them.
    expect(tally.opened).toEqual(['aa/one.mxl']);
    clearFakeIndexedDb();
  });
});
