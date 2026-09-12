// @vitest-environment jsdom
/**
 * What the screen says about a listing it did not build by walking.
 *
 * Manifest-first is a trade, not a free win, and the owner's complaint that
 * started all of this was that he could not tell what the app was doing. So
 * each half of the trade has to be *said*:
 *
 *   - a listing read out of `library.json` is complete as of the day that file
 *     was written and cannot see a score put into the folder since — with the
 *     rescan named as the one thing that finds it;
 *   - an index that was stopped half way says how far it got and offers to
 *     finish, rather than looking like a folder that is smaller than it is;
 *   - a row whose file has gone comes off the list in front of the owner, where
 *     it was tapped, rather than failing again on the next visit.
 *
 * None of it may go above the list. This screen is 342 px wide on the owner's
 * phone and `04` §0 R1 — the first score visible without scrolling — has been
 * broken twice already by one more sentence there, so the long explanations
 * live in the fold and the fold's own summary is what points at them.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { openDatabase, type FolderScore } from '../../src/data/db';
import { forgetFolder, pickFolder } from '../../src/data/folderLibrary';
import type { Router } from '../../src/router';
import { FolderScreen } from '../../src/ui/screens/FolderScreen';

const router = { navigate: vi.fn() } as unknown as Router;

function scores(count: number): FolderScore[] {
  return Array.from({ length: count }, (_, i) => ({
    file: `${String(i % 4).padStart(2, '0')}/Qm${String(i)}.mxl`,
    title: `Piece ${String(i).padStart(4, '0')}`,
    composer: 'Joplin',
    level: 3.3,
    bars: 24,
    status: 'pd',
    style: 'ragtime',
    rating: 0,
    ratings: 0,
    views: 0,
    lyrics: false,
    garbled: false,
    museScore: '',
  }));
}

/**
 * Writes a listing as one of the three kinds of read would have left it.
 *
 * `listedFrom` and `pending` are the two fields the store carries that nothing
 * else could work out afterwards: 37,261 rows look identical whether they were
 * read out of the manifest in one go or walked over several minutes.
 */
async function seed(
  id: string,
  listedFrom: 'manifest' | 'walk' | 'partial' | undefined,
  count: number,
  pending: string[] = [],
): Promise<void> {
  const db = await openDatabase();
  await db?.put('folderLibraries', {
    id,
    addedAt: new Date().toISOString(),
    source: 'PDMX',
    scores: scores(count),
    ...(listedFrom === undefined ? {} : { listedFrom }),
    ...(pending.length === 0 ? {} : { pending }),
  });
}

async function mount(): Promise<HTMLElement> {
  const section = FolderScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelectorAll('#folder-list .list-row').length).toBeGreaterThan(0);
  });
  return section;
}

function note(section: HTMLElement): string {
  return section.querySelector<HTMLElement>('#folder-rescan-note')?.textContent ?? '';
}

const ids: string[] = [];
function freshId(prefix: string): string {
  const id = `${prefix}-${String(ids.length)}`;
  ids.push(id);
  return id;
}

beforeEach(() => {
  useFakeIndexedDb();
});

afterEach(async () => {
  for (const id of ids.splice(0)) await forgetFolder(id);
  document.body.replaceChildren();
  clearFakeIndexedDb();
});

describe('a listing that came from the manifest says what it cannot see', () => {
  it('names the blind spot and the one thing that cures it', async () => {
    await seed(freshId('manifest'), 'manifest', 120);
    const section = await mount();

    // The trade, in the owner's terms: a score copied into the folder after the
    // index was written is not here, and only the walk finds it.
    expect(note(section)).toMatch(/library\.json/);
    expect(note(section)).toMatch(/cannot see a score put into the folder/i);
    expect(note(section)).toMatch(/Rescan folder reads all 120 files/);
    // And the fold that holds it says there is something under it, because a
    // sentence nobody opens is not far from a sentence nobody wrote.
    expect(section.querySelector('#folder-how summary')?.textContent).toMatch(/what it misses/i);
  });

  it('says the ordinary thing for a listing that was walked', async () => {
    // The guard on the test above: if every listing claimed to be a manifest
    // one, the sentence would be noise rather than information.
    await seed(freshId('walked'), 'walk', 40);
    const section = await mount();
    expect(note(section)).toMatch(/reads all 40 files again/);
    expect(note(section)).not.toMatch(/library\.json/);
    expect(section.querySelector('#folder-how summary')?.textContent).toBe('How this works');
  });

  it('treats a listing from before any of this as a walked one', async () => {
    // Every row in the owner's database today was written by a build that only
    // knew how to walk, and a missing field must not read as a manifest.
    await seed(freshId('legacy'), undefined, 40);
    const section = await mount();
    expect(note(section)).toMatch(/reads all 40 files again/);
  });
});

describe('an index that was stopped half way', () => {
  it('says how far it got, and offers to finish rather than to start again', async () => {
    await seed(freshId('partial'), 'partial', 50, ['07', '08', '09']);
    const section = await mount();

    // "50 scores" with no qualifier would be the screen quietly claiming the
    // folder is that size. It is not; it is how many have been found so far.
    const status = section.textContent ?? '';
    expect(status).toMatch(/50 scores so far/);
    expect(status).toMatch(/3 folders still to index/);
    // And the first thing on offer is the cheap one — carrying on — not the
    // several minutes of starting from the top.
    const resume = section.querySelector<HTMLButtonElement>('#folder-resume');
    expect(resume?.textContent).toBe('Continue indexing');
    expect(section.querySelector('#folder-pick')?.textContent).toBe('Rescan folder');
    expect(note(section)).toMatch(/Continue indexing carries on from there/);
  });
});

describe('adding a score the folder no longer holds', () => {
  const MUSICXML = `<?xml version="1.0"?>
<score-partwise version="4.0">
  <work><work-title>Untitled</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><note><rest/><duration>4</duration></note></measure></part>
</score-partwise>`;

  function mxl(): Uint8Array {
    return zipSync({
      'META-INF/container.xml': strToU8(
        '<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>',
      ),
      'score.xml': strToU8(MUSICXML),
    });
  }

  function handleFor(name: string, files: Record<string, Uint8Array | string>): unknown {
    const entries = Object.entries(files);
    function dirFor(prefix: string): Record<string, unknown> {
      const here = new Map<string, unknown>();
      for (const [path, contents] of entries) {
        if (!path.startsWith(prefix)) continue;
        const rest = path.slice(prefix.length);
        const cut = rest.indexOf('/');
        if (cut === -1) {
          const bytes =
            typeof contents === 'string' ? new TextEncoder().encode(contents) : contents;
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
      const child = (childName: string, kind: 'file' | 'directory'): Promise<unknown> => {
        const found = here.get(childName);
        if (found && (found as { kind?: string }).kind === kind) return Promise.resolve(found);
        return Promise.reject(new DOMException(`no such ${kind}`, 'NotFoundError'));
      };
      return {
        kind: 'directory',
        values: () => here.values(),
        getFileHandle: (childName: string) => child(childName, 'file'),
        getDirectoryHandle: (childName: string) => child(childName, 'directory'),
        queryPermission: () => Promise.resolve('granted' as PermissionState),
      };
    }
    return { ...dirFor(''), name };
  }

  it('takes the row off the list where it was tapped, and offers the rescan there', async () => {
    const id = freshId('deleted');
    const fields = ['file', 'title', 'composer', 'level'];
    const manifest = JSON.stringify({
      kind: 'pianopath-score-folder',
      version: 1,
      source: { name: 'PDMX' },
      fields,
      scores: [
        ['00/here.mxl', 'A score that is here', 'Joplin', 2],
        ['01/gone.mxl', 'A score that is gone', 'Joplin', 2],
      ],
    });
    (window as unknown as Record<string, unknown>).showDirectoryPicker = () =>
      Promise.resolve(handleFor(id, { 'library.json': manifest, '00/here.mxl': mxl() }));
    await pickFolder({});

    const section = await mount();
    await vi.waitFor(() => {
      expect(section.querySelectorAll('#folder-list .list-row')).toHaveLength(2);
    });
    const row = section.querySelector<HTMLElement>('[data-file="01/gone.mxl"]');
    expect(row).not.toBeNull();
    [...row!.querySelectorAll('button')].find((b) => b.textContent === 'Add')?.click();

    // The row goes, because the file behind it is not there and nothing about
    // tapping it again would change that.
    await vi.waitFor(() => {
      expect(section.querySelector('[data-file="01/gone.mxl"]')).toBeNull();
    });
    // And what happened is said where the tap was, with the cure beside it —
    // the walk, not the picker: the folder is open, it is the listing that is
    // behind.
    const said = section.querySelector<HTMLElement>('.folder-row-note');
    expect(said?.textContent).toMatch(/not in the folder any more/);
    expect(said?.textContent).toMatch(/taken off the list/);
    expect([...(said?.querySelectorAll('button') ?? [])].map((b) => b.textContent)).toEqual([
      'Rescan folder',
    ]);
    // The row that is really there still adds, and the listing that is stored
    // has lost only the one row.
    expect(section.querySelector('[data-file="00/here.mxl"]')).not.toBeNull();
  });
});
