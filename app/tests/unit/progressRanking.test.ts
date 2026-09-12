// @vitest-environment jsdom
/**
 * Progress, ranked (`04` §0 R1–R4, §6; the pass the Plan screen had first).
 *
 * Four of Plan's six faults were on this screen.
 *
 *  - **A name repeated inside its own heading.** `THIS WEEK`, in the muted
 *    capitals the app uses for section labels, directly above a line reading
 *    "48 of 150 minutes **this week** · 3 days practised" — and the heading
 *    was the half taking the room, while the figure it headed was set at the
 *    same weight as the muted line under it.
 *  - **The same thing announced on every row.** `mastered` badged on every
 *    row of a list headed *Repertoire*, which is queried as "the mastered
 *    ones"; `performance` on every row of one headed *Performances*, queried
 *    as `recentPerformances`. A badge on every row of a list distinguishes
 *    nothing and costs each row the line its title needs.
 *  - **Controls that were not controls.** Twenty performance rows and thirty
 *    history rows drawn with the border, the surface and the height of the
 *    tappable cards, with no click handler at all — Plan's dead-chip fault,
 *    fifty times on one screen. `04` §6 always meant them to open something.
 *  - **Internal identifiers on screen.** The history's second line printed
 *    `session.mode` raw, so a week of drills read `drill:walkthrough` and
 *    `drill:checklist`; and all three lists fell back to `itemId` when the
 *    catalog had no entry, which prints `song.folk.hot-cross-buns` at a reader.
 *
 * And R3: the one filled box was *Export everything*, at the bottom of a
 * screen that is fifty rows long, for the rarest action on it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { openDatabase } from '../../src/data/db';
import type { ProgressRow, SessionRow } from '../../src/data/db';
import { resetProgressForTest } from '../../src/data/progressStore';
import type { Router } from '../../src/router';

/** In the catalog, openable, and with a title long enough to need two lines. */
const KNOWN = {
  id: 'song.ode',
  type: 'song',
  title: 'Ode to Joy — the theme, hands together, as Beethoven left it',
  composer: 'Beethoven',
  level: 1.1,
  hands: 'both',
  tracks: ['core'],
  concepts: [],
  file: 'ode.musicxml',
  tags: [],
};

/** A run whose item has been deleted since. The runs outlive the import. */
const GONE = 'import.deleted.7';

vi.mock('../../src/curriculum/load', () => ({
  allItems: () => Promise.resolve([KNOWN]),
}));

const { ProgressScreen, modeLabel } = await import('../../src/ui/screens/ProgressScreen');

function router(): Router {
  return {
    navigate: vi.fn(),
    navigateScore: vi.fn(),
    navigateDrill: vi.fn(),
    navigatePdf: vi.fn(),
  } as unknown as Router;
}

function masteredRow(): ProgressRow {
  return {
    itemId: KNOWN.id,
    status: 'mastered',
    bestAccuracy: 0.97,
    bestTempoPct: 1,
    attempts: 4,
    lastPracticedAt: '2026-09-10T10:00:00.000Z',
    minutes: 40,
    passedOn: ['2026-09-09', '2026-09-10'],
  };
}

function session(extra: Partial<SessionRow> & { itemId: string; at: string }): SessionRow {
  return {
    mode: 'tempo',
    tempoPct: 100,
    accuracy: 0.95,
    accuracyEstimated: false,
    wrongNotes: 1,
    missed: 0,
    durationMs: 240_000,
    ...extra,
  };
}

async function seed(): Promise<void> {
  const db = await openDatabase();
  if (!db) throw new Error('no database');
  await db.put('progress', masteredRow());
  // An ordinary drill run that he said felt rough — newest, so it is the first
  // row of the history — then a performance, then a run whose item is gone.
  await db.put(
    'sessions',
    session({
      itemId: KNOWN.id,
      at: '2026-09-11T18:00:00.000Z',
      mode: 'drill:walkthrough',
      selfReport: 'rough',
    }),
  );
  await db.put('sessions', session({ itemId: KNOWN.id, at: '2026-09-10T18:00:00.000Z', performance: true }));
  await db.put('sessions', session({ itemId: GONE, at: '2026-09-08T18:00:00.000Z' }));
}

async function mount(nav = router()): Promise<{ section: HTMLElement; nav: Router }> {
  const section = ProgressScreen(nav);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector('#progress-goal')).not.toBeNull();
    expect(section.querySelector('#progress-history .list-row')).not.toBeNull();
  });
  return { section, nav };
}

function text(node: Element | null | undefined): string {
  return (node?.textContent ?? '').trim();
}

describe('Progress says the week once', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    resetProgressForTest();
    document.body.replaceChildren();
  });

  it('does not head the figure with the words the figure ends on', async () => {
    await seed();
    const { section } = await mount();
    const headings = [...section.querySelectorAll('h2')].map((node) =>
      text(node).toLowerCase(),
    );
    expect(headings).not.toContain('this week');
    // One line, one figure, and it still reads as a sentence.
    expect(text(section.querySelector('#progress-week'))).toMatch(
      /^\d+ of \d+ minutes this week$/,
    );
    // The second figure moved to the quiet line rather than being deleted: a
    // headline that wraps is not a headline.
    expect(text(section.querySelector('#progress-week'))).not.toContain('practised');
    expect(text(section.querySelector('#progress-totals'))).toContain('practised');
    expect(text(section.querySelector('#progress-totals'))).toContain('1 mastered');
  });

  it('keeps the map of the same minutes in the same block, above the goal', async () => {
    await seed();
    const { section } = await mount();
    const summary = section.querySelector('#progress-summary');
    expect(summary?.querySelector('#progress-heatmap')).not.toBeNull();
    expect(summary?.querySelector('#progress-heatmap-key')).not.toBeNull();
    // The heading that used to open a section of its own is a caption for the
    // map, and `04` §6 names its words.
    expect([...(summary?.querySelectorAll('h2') ?? [])].map((n) => text(n))).toEqual([
      'Minutes a day, last 13 weeks',
    ]);
    // The subject first, the control you set once last (`04` §0 R1).
    const order = [...(summary?.children ?? [])];
    expect(order.indexOf(summary?.querySelector('#progress-heatmap') as Element)).toBeLessThan(
      order.indexOf(summary?.querySelector('#progress-goal-block') as Element),
    );
    // R6's rule survives the move: the confirmation is still inside the block
    // that holds the control.
    expect(summary?.querySelector('#progress-goal-status')).not.toBeNull();
  });
});

describe('a badge on every row of a list', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    resetProgressForTest();
    document.body.replaceChildren();
  });

  it('is gone from the repertoire and the performances, and kept where it is news', async () => {
    await seed();
    const { section } = await mount();
    await vi.waitFor(() => {
      expect(section.querySelector('#progress-repertoire .list-row')).not.toBeNull();
    });
    // "mastered" under a heading reading Repertoire, on the only kind of row
    // the list can hold.
    expect(section.querySelectorAll('#progress-repertoire .badge')).toHaveLength(0);
    expect(section.querySelectorAll('#progress-performances .badge')).toHaveLength(0);
    // How it felt is on no line of the row, and only on the runs where he
    // said so (`04` §0 R2).
    const rough = section.querySelector('#progress-history .list-row[data-session] .badge');
    expect(text(rough)).toBe('rough');
    expect(section.querySelectorAll('#progress-history .badge')).toHaveLength(1);
  });
});

describe('a row on Progress is a control, because it is drawn as one', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    resetProgressForTest();
    document.body.replaceChildren();
  });

  it('opens the piece it names, from all three lists', async () => {
    await seed();
    const { section, nav } = await mount();
    await vi.waitFor(() => {
      expect(section.querySelector('#progress-repertoire .list-row')).not.toBeNull();
    });
    for (const list of ['#progress-repertoire', '#progress-performances', '#progress-history']) {
      const row = section.querySelector<HTMLElement>(`${list} [data-item="${KNOWN.id}"]`);
      expect(row, list).not.toBeNull();
      expect(row?.getAttribute('role'), list).toBe('button');
      row?.click();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(nav.navigateScore, list).toHaveBeenCalledWith(KNOWN.id);
    }
  });

  it('is not drawn as a control when there is nothing left to open', async () => {
    await seed();
    const { section } = await mount();
    const row = section.querySelector<HTMLElement>(`#progress-history [data-item="${GONE}"]`);
    expect(row).not.toBeNull();
    expect(row?.getAttribute('role')).toBeNull();
    // And it says so in words rather than printing the key it is stored
    // under. The id stays on the row, in the data attribute.
    expect(text(row)).toContain('no longer in the library');
    expect(text(row)).not.toContain(GONE);
  });
});

describe('how a run was played', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    resetProgressForTest();
    document.body.replaceChildren();
  });

  it('is words on the row, never the engine’s own key', async () => {
    await seed();
    const { section } = await mount();
    const row = section.querySelector('#progress-history .list-row[data-session]');
    expect(text(row?.querySelector('.list-row__sub'))).toContain('Drill');
    expect(text(row)).not.toContain('drill:');
    // And nothing on any row of this list is id-shaped — `word:word`, or a
    // dotted key like `song.ode`.
    const lines = text(section.querySelector('#progress-history'));
    expect(lines).not.toMatch(/[a-z][a-z-]*:[a-z]/);
    expect(lines).not.toMatch(/[a-z][a-z-]*\.[a-z][a-z-]*\./);
  });

  it('names every mode the app records, and never with a colon in it', () => {
    expect(modeLabel('wait')).toBe('Wait mode');
    expect(modeLabel('tempo')).toBe('Tempo mode');
    expect(modeLabel('paper')).toBe('From the book');
    expect(modeLabel('listen')).toBe('Listening');
    expect(modeLabel('free')).toBe('Free play');
    expect(modeLabel('read')).toBe('Reading');
    // The four drill harnesses are one word: the row's title is already the
    // drill's name, and which harness ran it is not a fact about the practice.
    for (const kind of ['walkthrough', 'checklist', 'placement', 'reading']) {
      expect(modeLabel(`drill:${kind}`)).toBe('Drill');
    }
    // A mode this map has not met keeps its own word — something to notice is
    // better than a blank — but it cannot arrive in the id-shaped form.
    expect(modeLabel('shadow:v2')).toBe('Shadow');
  });
});

describe('Progress weights its actions by how often they happen', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    resetProgressForTest();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    resetProgressForTest();
    document.body.replaceChildren();
  });

  it('has no filled box, because nothing here is done on most visits', async () => {
    await seed();
    const { section } = await mount();
    await vi.waitFor(() => {
      expect(section.querySelector('#progress-export')).not.toBeNull();
    });
    // `04` §0 R3 allows at most one, and the one it had was the rarest action
    // on the screen, at the bottom of fifty rows.
    expect(section.querySelectorAll('.button--primary')).toHaveLength(0);
    // The one action with a consequence keeps an outline.
    expect(section.querySelector('#progress-export')?.className).toContain('button--secondary');
    // The two that are rarer still are text.
    expect(section.querySelector('#progress-import')?.className).toContain('link-button');
    expect(section.querySelector('#progress-diagnostics')?.className).toContain('link-button');
  });
});
