// @vitest-environment jsdom
/**
 * The Library's rows, ranked (`04` §0 R2, R4; the pass the Plan screen had).
 *
 * Two faults, both of them "the same thing announced on every row":
 *
 *  - **`Hands together` on nearly all 1,533 rows.** It is the middle of the
 *    one line that is supposed to tell the rows apart, and it never tells any
 *    two of them apart; it also pushed the type off the end of the line.
 *    `shortHandsLabel` — which exists for exactly this, and which Today
 *    already uses — says nothing for both hands and `RH`/`LH` where the fact
 *    is news. The whole sentence is still on the detail sheet.
 *  - **An empty block under the list.** The drop target used to be a
 *    `div.block` with no text and no control in it, left behind when its
 *    heading and buttons moved into the header. `.block` draws a rule and
 *    seventeen pixels of nothing, so every visit ended with a divider under
 *    the last row separating it from nothing (`04` §0 R4: no furniture). The
 *    listeners move onto the list itself, which is also the better target for
 *    the desktop gesture they exist for.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import type { Router } from '../../src/router';

const { items } = vi.hoisted(() => ({
  items: [
    {
      id: 'song.both',
      type: 'song',
      title: 'Ode to Joy (theme)',
      composer: 'Beethoven',
      level: 1.1,
      hands: 'both',
      tracks: ['core'],
      concepts: [],
      file: 'x.musicxml',
      tags: [],
    },
    {
      id: 'song.right',
      type: 'exercise',
      title: 'A major five-finger pattern — right',
      level: 1.1,
      hands: 'right',
      tracks: ['core'],
      concepts: [],
      file: 'y.musicxml',
      tags: [],
    },
  ],
}));

vi.mock('../../src/curriculum/load', () => ({
  allItems: () => Promise.resolve(items),
  loadCurriculum: () => Promise.resolve({ version: 1, tracks: [], stages: [] }),
}));

const { LibraryScreen } = await import('../../src/ui/screens/LibraryScreen');

const router = { navigate: vi.fn() } as unknown as Router;

async function mount(): Promise<HTMLElement> {
  const section = LibraryScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelectorAll('#library-list .list-row').length).toBe(items.length);
  });
  return section;
}

describe("the Library's detail line", () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('says nothing about hands when the answer is "both"', async () => {
    const section = await mount();
    const row = section.querySelector('[data-item="song.both"] .list-row__metatext');
    expect(row?.textContent).toBe('L1.1 · song');
    // The fact has not been thrown away — it is on the sheet, said in full,
    // where it is read once rather than 1,533 times.
    expect(row?.textContent).not.toContain('Hands together');
  });

  it('still says it where it is news', async () => {
    const section = await mount();
    const row = section.querySelector('[data-item="song.right"] .list-row__metatext');
    expect(row?.textContent).toContain('RH');
  });

  it('says it in full on the item sheet', async () => {
    const section = await mount();
    section.querySelector<HTMLElement>('[data-item="song.both"] .list-row__actions button')?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('#library-detail')).not.toBeNull();
    });
    expect(document.querySelector('#library-detail')?.textContent).toContain('Hands together');
  });
});

describe('the Library drop target', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('is the list, not an empty box under it', async () => {
    const section = await mount();
    const drop = section.querySelector('#library-drop');
    expect(drop).not.toBeNull();
    // The thing you drop onto contains the thing you are dropping into.
    expect(drop?.querySelector('#library-list')).not.toBeNull();
    // And no element on the screen is a block with nothing inside it.
    for (const block of section.querySelectorAll('.block')) {
      expect((block.textContent ?? '').trim().length, block.outerHTML.slice(0, 80)).toBeGreaterThan(
        0,
      );
    }
  });

  it('still takes a drag, on the element that survived', async () => {
    const section = await mount();
    const drop = section.querySelector('#library-drop');
    const event = new Event('dragover', { bubbles: true, cancelable: true });
    drop?.dispatchEvent(event);
    expect(drop?.classList.contains('is-dropping')).toBe(true);
    drop?.dispatchEvent(new Event('dragleave', { bubbles: true }));
    expect(drop?.classList.contains('is-dropping')).toBe(false);
  });
});
