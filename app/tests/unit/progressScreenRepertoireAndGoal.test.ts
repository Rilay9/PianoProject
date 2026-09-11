// @vitest-environment jsdom
/**
 * Two faults on the Progress screen (handoff 5j).
 *
 * **The repertoire list had no cap.** `ProgressScreen.ts:158-189` drew every
 * mastered row, while the history (`recentSessions(30)`) and the
 * performances (`recentPerformances(20)`) are already bounded. Mastery is
 * cumulative by design — it only grows — so an uncapped list here is not a
 * fixture-only quirk, it is the screen's longest list on a phone that has
 * been in use for a year. The fix caps it with a "Show more" the way Skills
 * pages its concept grid.
 *
 * **The weekly-goal confirmation was written far from the control.**
 * `ProgressScreen.ts:134`'s number input is the first control on the screen;
 * `Weekly goal set…` used to be written to the screen's bottom status line,
 * below the heat map, the repertoire list, twenty performances and thirty
 * sessions (`04` §0 R6). It now writes beside the control itself.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { openDatabase } from '../../src/data/db';
import type { ProgressRow } from '../../src/data/db';
import type { Router } from '../../src/router';

vi.mock('../../src/curriculum/load', () => ({
  allItems: vi.fn(() => Promise.resolve([])),
}));

const { ProgressScreen, REPERTOIRE_PAGE_SIZE } = await import('../../src/ui/screens/ProgressScreen');

const router = { navigate: vi.fn() } as unknown as Router;

function masteredRow(n: number): ProgressRow {
  const day = String(n).padStart(3, '0');
  return {
    itemId: `song.mastered.${day}`,
    status: 'mastered',
    bestAccuracy: 0.97,
    bestTempoPct: 1,
    attempts: 3,
    lastPracticedAt: `2026-01-${String((n % 27) + 1).padStart(2, '0')}T10:00:00.000Z`,
    minutes: 12,
    passedOn: ['2026-01-01', '2026-01-02'],
  };
}

async function seedMastered(count: number): Promise<void> {
  const db = await openDatabase();
  for (let i = 0; i < count; i += 1) {
    await db?.put('progress', masteredRow(i));
  }
}

async function mount(): Promise<HTMLElement> {
  const section = ProgressScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(document.querySelector('#progress-goal')).not.toBeNull();
  });
  return section;
}

describe('the repertoire list at scale', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('caps the list and offers a way to see the rest', async () => {
    await seedMastered(REPERTOIRE_PAGE_SIZE + 5);
    const section = await mount();

    await vi.waitFor(() => {
      expect(section.querySelectorAll('#progress-repertoire .list-row').length).toBe(
        REPERTOIRE_PAGE_SIZE,
      );
    });
    const more = section.querySelector<HTMLButtonElement>('#progress-repertoire-more');
    expect(more).not.toBeNull();

    more!.click();

    await vi.waitFor(() => {
      expect(section.querySelectorAll('#progress-repertoire .list-row').length).toBe(
        REPERTOIRE_PAGE_SIZE + 5,
      );
    });
    // Nothing left to page through.
    expect(section.querySelector('#progress-repertoire-more')).toBeNull();
  });

  it('shows every mastered piece when there are fewer than the cap', async () => {
    await seedMastered(3);
    const section = await mount();

    await vi.waitFor(() => {
      expect(section.querySelectorAll('#progress-repertoire .list-row').length).toBe(3);
    });
    expect(section.querySelector('#progress-repertoire-more')).toBeNull();
  });
});

describe('the weekly-goal confirmation', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });
  afterEach(() => {
    clearFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('is written beside the goal control, not the screen’s bottom status line', async () => {
    const section = await mount();
    const goalInput = section.querySelector<HTMLInputElement>('#progress-goal');
    expect(goalInput).not.toBeNull();

    goalInput!.value = '90';
    goalInput!.dispatchEvent(new Event('change'));

    await vi.waitFor(() => {
      expect(document.querySelector('#progress-goal-status')?.textContent).toContain('90');
    });

    // The bottom-of-screen line — the one every other feedback on this
    // screen still uses — must stay untouched by this control.
    expect(document.querySelector('#progress-status')?.textContent ?? '').toBe('');

    // And the confirmation lives inside the same summary block as the
    // control that caused it, not thousands of pixels away.
    const summary = document.querySelector('#progress-summary');
    expect(summary?.querySelector('#progress-goal-status')).not.toBeNull();
  });
});
