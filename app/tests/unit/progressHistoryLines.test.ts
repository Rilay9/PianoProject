// @vitest-environment jsdom
/**
 * The Progress history prints what the run measured, and nothing it did not
 * (C1 item 5 and item 9; backlog L41, L43, L49).
 *
 * One fault in three places, and one mechanism behind it: the history line was
 * `N% at T%` for every run that was not paper, so it printed
 *
 * - a Wait for me run as "88% at 70%" — the slider, as if the learner had kept
 *   that tempo (L41);
 * - a self-reported run as "0% at 70%" — a run nothing heard, as a zero (L43);
 * - a kept backing-track run as "0% at 100%" — a jam nothing judged (L49).
 *
 * Each case is read off the real Progress screen over rows in a fake
 * IndexedDB, in the shape older builds wrote them (they are on the phone) and
 * in the shape this build writes. The words are `help.ts`'s, so the sentence on
 * the screen and the one in `04` §6 are one sentence.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';
import { openDatabase, type SessionRow } from '../../src/data/db';
import type { Router } from '../../src/router';

vi.mock('../../src/curriculum/load', () => ({
  allItems: vi.fn(() => Promise.resolve([])),
}));

const { ProgressScreen } = await import('../../src/ui/screens/ProgressScreen');

const router = { navigate: vi.fn() } as unknown as Router;
const NOT_MEASURED = 'not measured';

let minute = 0;
/** A stored run; the parts a case does not name are a measured Keep tempo run. */
function row(itemId: string, partial: Record<string, unknown>): SessionRow {
  minute += 1;
  return {
    itemId,
    mode: 'tempo',
    tempoPct: 70,
    accuracy: 0.88,
    accuracyEstimated: false,
    wrongNotes: 1,
    missed: 0,
    durationMs: 60_000,
    at: `2026-09-20T10:${String(minute).padStart(2, '0')}:00.000Z`,
    ...partial,
  };
}

async function seed(rows: SessionRow[]): Promise<void> {
  const db = await openDatabase();
  for (const each of rows) await db?.add('sessions', each);
}

async function mount(): Promise<HTMLElement> {
  const section = ProgressScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelectorAll('#progress-history .list-row').length).toBeGreaterThan(0);
  });
  return section;
}

/** The detail line of the history row (or performance row) for one item. */
function line(section: HTMLElement, itemId: string, list = 'progress-history'): string {
  const node = section.querySelector(`#${list} .list-row[data-item="${itemId}"] .list-row__metatext`);
  expect(node, `no row for ${itemId} in #${list}`).not.toBeNull();
  return node?.textContent ?? '';
}

beforeEach(() => {
  useFakeIndexedDb();
});
afterEach(() => {
  clearFakeIndexedDb();
  document.body.replaceChildren();
});

describe('the history line says what was measured (L41, L43, L49: one mechanism)', () => {
  it('a Wait run is not "at 70%": its tempo was the slider, not a measurement', async () => {
    await seed([
      row('song.wait.t37', { mode: 'wait', tempoMeasured: false }),
      // Before T37 a Wait row carried no flag; the mode alone says it.
      row('song.wait.old', { mode: 'wait' }),
      // And a Keep tempo run, measured, still says its tempo.
      row('song.tempo', { tempoMeasured: true }),
    ]);
    const section = await mount();
    expect(line(section, 'song.wait.t37')).toBe('88% · tempo not judged · 1 min');
    expect(line(section, 'song.wait.old')).toBe('88% · tempo not judged · 1 min');
    expect(line(section, 'song.tempo')).toBe('88% at 70% · 1 min');
  });

  it('a self-reported run prints the answer, not 0%', async () => {
    await seed([
      // As T37 and T40 wrote it: accuracy 0 beside the answer.
      row('song.self.old', { accuracy: 0, missed: 8, selfReport: 'clean', tempoMeasured: false }),
      // As this build writes it.
      row('song.self.new', {
        accuracy: NOT_MEASURED,
        wrongNotes: NOT_MEASURED,
        missed: NOT_MEASURED,
        selfReport: 'rough',
        tempoMeasured: false,
      }),
    ]);
    const section = await mount();
    expect(line(section, 'song.self.old')).toBe('Not measured · you said Clean · 1 min');
    expect(line(section, 'song.self.new')).toBe('Not measured · you said Rough · 1 min');
  });

  it('a run that judged nothing prints what it counted, not 0%', async () => {
    await seed([
      // As T41 left it: a kept jam, accuracy 0 and the notes played as wrong.
      row('drill.improv.old', { mode: 'drill:backing-track', tempoPct: 100, accuracy: 0, wrongNotes: 4 }),
      row('drill.improv.new', {
        mode: 'drill:backing-track',
        tempoPct: 100,
        accuracy: NOT_MEASURED,
        wrongNotes: NOT_MEASURED,
        missed: NOT_MEASURED,
        notesHeard: 4,
      }),
    ]);
    const section = await mount();
    expect(line(section, 'drill.improv.old')).toBe('Not judged · 1 min');
    expect(line(section, 'drill.improv.new')).toBe('Not judged · 4 notes played · 1 min');
  });
});

describe('a run that was not a first reading, or had help, says so in a word', () => {
  it('a sight-read met before, and a take heard part way', async () => {
    await seed([
      row('drill.reading.seen', { unseen: false, tempoMeasured: true }),
      row('song.helped', { demonstrated: true, tempoMeasured: true }),
    ]);
    const section = await mount();
    expect(line(section, 'drill.reading.seen')).toBe('88% at 70% · not first sight · 1 min');
    expect(line(section, 'song.helped')).toBe('88% at 70% · heard part way · 1 min');
  });

  it('the performances list reads the same rule', async () => {
    await seed([row('song.performed.wait', { mode: 'wait', tempoMeasured: false, performance: true })]);
    const section = await mount();
    expect(line(section, 'song.performed.wait', 'progress-performances')).toBe(
      '88% · tempo not judged · 1 min',
    );
  });
});

describe('the words are the ones `04` §6 prints', () => {
  it('every history word is in the spec', async () => {
    const { HISTORY_TEXT } = await import('../../src/ui/help');
    const spec = readFileSync(resolve('..', 'docs', '04-ui-spec.md'), 'utf8');
    const start = spec.indexOf('## 6. Progress');
    const end = spec.indexOf('## 7. Settings');
    const section = spec.slice(start, end);
    const words = [
      HISTORY_TEXT.tempoNotJudged,
      HISTORY_TEXT.notMeasured,
      HISTORY_TEXT.youSaid('clean'),
      HISTORY_TEXT.notJudged,
      HISTORY_TEXT.notFirstSight,
      HISTORY_TEXT.heardPartWay,
      HISTORY_TEXT.rhythmOnly,
    ];
    expect(words.filter((word) => !section.includes(word))).toEqual([]);
  });
});
