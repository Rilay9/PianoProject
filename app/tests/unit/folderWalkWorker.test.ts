// @vitest-environment jsdom
/**
 * The walk goes to a worker, and comes home when it cannot.
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
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

/** A directory handle over a set of paths, as the picker would give one. */
function fakeHandle(files: Record<string, Uint8Array>): unknown {
  const entries = Object.entries(files);
  function dirFor(prefix: string): Record<string, unknown> {
    const here = new Map<string, unknown>();
    for (const [path, bytes] of entries) {
      if (!path.startsWith(prefix)) continue;
      const rest = path.slice(prefix.length);
      const cut = rest.indexOf('/');
      if (cut === -1) {
        here.set(rest, {
          kind: 'file',
          name: rest,
          getFile: () => Promise.resolve(new File([bytes as BlobPart], rest)),
        });
      } else {
        const dir = rest.slice(0, cut);
        if (!here.has(dir)) {
          here.set(dir, { kind: 'directory', name: dir, ...dirFor(prefix + dir + '/') });
        }
      }
    }
    return {
      kind: 'directory',
      values: () => here.values(),
      queryPermission: () => Promise.resolve('granted' as PermissionState),
    };
  }
  return { name: 'Scores', ...dirFor('') };
}

const FILES = { 'aa/one.mxl': mxl(), 'bb/two.mxl': mxl() };

function request(handle: unknown, over: Partial<Parameters<typeof walkFolder>[0]> = {}) {
  return {
    handle: handle as never,
    manifestName: 'library.json',
    scoreExtensions: ['.mxl', '.musicxml', '.xml'],
    maxFiles: 100_000,
    readChunk: 32,
    ...over,
  };
}

describe('the walk itself', () => {
  it('names every file first, then opens the scores', async () => {
    const messages: WalkMessage[] = [];
    await walkFolder(request(fakeHandle(FILES)), (message) => messages.push(message));

    const kinds = messages.map((m) => m.kind);
    // Counting has to finish before reading starts: the total is what reading
    // reports against, and it is not answerable until the walk is over — a
    // directory can hold another directory.
    expect(kinds.indexOf('counting')).toBeLessThan(kinds.indexOf('reading'));
    expect(kinds[kinds.length - 1]).toBe('done');
    expect(messages.filter((m) => m.kind === 'counting')).toHaveLength(2);

    const reading = messages.find((m) => m.kind === 'reading');
    expect(reading?.kind === 'reading' ? reading.total : 0).toBe(2);

    const done = messages[messages.length - 1];
    if (done?.kind !== 'done') throw new Error('the walk did not finish');
    expect(done.files.map(([path]) => path).sort()).toEqual(['aa/one.mxl', 'bb/two.mxl']);
  });

  it('reports the count on a clock, not once per file', async () => {
    // Moving the walk off the main thread does not help if the walk then wakes
    // the main thread once per file: 37,261 messages is a deserialize and a
    // handler every few hundred microseconds on the one thread that has to
    // answer taps, and the read-out throttle that was meant to fix it ran
    // 37,261 times itself.
    const many: Record<string, Uint8Array> = {};
    for (let i = 0; i < 600; i += 1) many[`${String(i % 10)}/f${String(i)}.mxl`] = mxl();
    const messages: WalkMessage[] = [];
    await walkFolder(request(fakeHandle(many)), (message) => messages.push(message));

    const counting = messages.filter((m) => m.kind === 'counting');
    expect(counting.length).toBeLessThan(60);
    // And the last one is the real total, not wherever the clock stopped — the
    // number the owner is left looking at as the reading pass begins.
    const last = counting[counting.length - 1];
    expect(last?.kind === 'counting' ? last.seen : 0).toBe(600);
    expect(messages[messages.length - 1]?.kind).toBe('done');
  });

  it('has no denominator while it is still counting', async () => {
    const messages: WalkMessage[] = [];
    await walkFolder(request(fakeHandle(FILES)), (message) => messages.push(message));
    // A total of nought is how the screen knows to sweep the bar rather than
    // draw 0 %, which is indistinguishable from a bar that is stuck.
    for (const message of messages) {
      if (message.kind === 'counting') expect(message.seen).toBeGreaterThan(0);
    }
  });

  it('refuses a folder far larger than the one that was meant, and stops there', async () => {
    const many: Record<string, Uint8Array> = {};
    for (let i = 0; i < 12; i += 1) many[`f${String(i)}.mxl`] = mxl();
    const messages: WalkMessage[] = [];
    await walkFolder(request(fakeHandle(many), { maxFiles: 5 }), (m) => messages.push(m));

    expect(messages[messages.length - 1]?.kind).toBe('failed');
    expect(messages.some((m) => m.kind === 'done')).toBe(false);
  });

  it('picks the shallowest manifest, and does not list it as a score', async () => {
    const messages: WalkMessage[] = [];
    await walkFolder(
      request(
        fakeHandle({
          'library.json': new TextEncoder().encode('{"scores":[]}'),
          'deep/library.json': new TextEncoder().encode('{"scores":[]}'),
          'deep/one.mxl': mxl(),
        }),
      ),
      (message) => messages.push(message),
    );
    const done = messages[messages.length - 1];
    if (done?.kind !== 'done') throw new Error('the walk did not finish');
    expect(done.manifestRoot).toBe('');
    expect(done.files.map(([path]) => path)).toEqual(['deep/one.mxl']);
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
    record = { started: 0, posted: [] };
  });

  afterEach(() => {
    (globalThis as unknown as Record<string, unknown>).Worker = realWorker;
  });

  it('starts a worker and tells it what counts as a score', async () => {
    installWorker(record, 'silent');
    // Nothing answers, so this never resolves. The assertion is that the work
    // left this thread, which is the entire point of the change.
    void readFolderHandle(fakeHandle(FILES) as never);
    await Promise.resolve();

    expect(record.started, 'the walk stayed on this thread').toBe(1);
    const sent = record.posted[0] as { scoreExtensions: string[]; maxFiles: number };
    expect(sent.scoreExtensions).toContain('.mxl');
    expect(sent.maxFiles).toBeGreaterThan(0);
  });

  it('falls back to this thread when the handle cannot be posted', async () => {
    installWorker(record, 'refuse-handle');
    const library = await readFolderHandle(fakeHandle(FILES) as never);

    expect(record.started).toBe(1);
    // The listing is still complete. A refused clone has to read as "slower",
    // never as an empty folder.
    expect(library.scores).toHaveLength(2);
  });

  it('falls back when the browser has no workers at all', async () => {
    installWorker(record, 'none');
    const library = await readFolderHandle(fakeHandle(FILES) as never);
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
   * back, so the files reaching `readFolderHandle` arrive the way they do in a
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
        // The real one stops the moment the walk resolves, and the files it
        // handed over have to outlive it. That is the thing worth proving: a
        // file that went stale with its worker would look exactly like "Add
        // flashes and nothing happens".
      }
    }
    (globalThis as unknown as Record<string, unknown>).Worker = WalkWorker;
  }

  it('lists the folder, and the files still read after the worker has gone', async () => {
    useFakeIndexedDb();
    installRealWalkWorker();
    const library = await readFolderHandle(fakeHandle(FILES) as never);
    expect(library.scores).toHaveLength(2);

    const score = library.scores.find((s) => s.file === 'aa/one.mxl');
    expect(score).toBeDefined();
    const row = await addFromFolder(library.id, score!);
    expect(row.origin).toEqual({ folder: library.id, file: 'aa/one.mxl' });
    clearFakeIndexedDb();
  });
});
