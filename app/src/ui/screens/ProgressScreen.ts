/**
 * Progress (docs/04 §6).
 *
 * The heat-map is minutes, not sessions, and the headline number is the week
 * rather than a streak — same reasoning as Today. A streak counter turns a
 * missed Tuesday into a loss, and the curriculum says plainly that missing
 * weekdays never breaks anything.
 *
 * Export/import lives here because this is the screen you are on when you
 * think about losing all of it.
 */
import type { Router } from '../../router';
import { allItems } from '../../curriculum/load';
import { allShelfPieces } from '../../data/booksStore';
import type { CatalogItem } from '../../curriculum/types';
import { importAll, isBackupFile, writeBackup } from '../../data/backup';
import type { ProgressRow, SessionRow } from '../../data/db';
import {
  allProgress,
  dayKey,
  getStreak,
  recentPerformances,
  recentSessions,
  setWeeklyGoal,
  weekSoFar,
} from '../../data/progressStore';
import { badge, button, el, listRow, minutesLabel, numberControl } from '../widgets';
import { openItem } from '../openItem';
import { screenFrame, statusLine } from './screenFrame';
import { plural } from '../../util/plural';

/** Days shown in the heat-map: enough to see a term, short enough to fit. */
export const HEATMAP_DAYS = 91;

/**
 * Mastered pieces shown before "Show more" (`08` §13).
 *
 * Mastery is cumulative by design — it only ever grows, unlike the history
 * and the performances, which are already capped (`recentSessions(30)`,
 * `recentPerformances(20)`). Without a cap this list would eventually be the
 * longest thing on the screen and the slowest to draw; with one it needs a
 * way to see the rest, since — unlike a stale session — a piece mastered
 * last year is still true today.
 */
export const REPERTOIRE_PAGE_SIZE = 20;

/**
 * The day a date falls on, locally — the same key the minutes are stored under.
 *
 * This walked the last ninety-one days with *local* arithmetic
 * (`setDate(getDate() - back)`) and then named each one in *UTC*, so on the
 * owner's side of the Atlantic the walk and the key disagreed by a day: the
 * same square could be emitted twice and another skipped, and today's cell read
 * zero while the evening's minutes sat in tomorrow's. One rule, in
 * `progressStore`, used by both.
 */
const isoDay = dayKey;

/** Buckets minutes into the five levels the heat-map colours. */
export function heatLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 10) return 1;
  if (minutes < 25) return 2;
  if (minutes < 45) return 3;
  return 4;
}

/**
 * An empty list's sentence and the one control that acts on it (`04` §0 R4).
 *
 * All three lists on this screen are empty on a fresh phone and all three said
 * so and stopped there — "No runs recorded yet." with nothing to press, and
 * "start one from the Score screen" naming a screen the reader had no route
 * to. The sentence comes first because a button whose explanation is
 * underneath it is a button you press to find out what it does.
 *
 * Quiet, never filled: `04` §0 R3 allows one filled box per screen and this
 * screen's is Export everything.
 */
function emptyList(text: string, label: string, act: () => void, id: string): HTMLElement[] {
  return [el('p.muted', { text }), button(label, act, { id, variant: 'quiet' })];
}

export function ProgressScreen(router: Router): HTMLElement {
  const { section, body } = screenFrame('progress', 'Progress');
  const status = statusLine('progress-status');
  const summary = el('div.block', { id: 'progress-summary' });
  const heat = el('div.heatmap', { id: 'progress-heatmap', role: 'img', 'aria-label': 'Practice minutes by day' });
  // The thresholds are `heatLevel`'s, written once so the key cannot drift
  // from the colours it explains.
  const heatKey = el('div.heatmap-key', { id: 'progress-heatmap-key' });
  for (const [level, label] of [[0, '0'], [1, '<10'], [2, '<25'], [3, '<45'], [4, '45+ min']] as const) {
    heatKey.append(
      el('span.heatmap-key__swatch', { 'data-level': level, 'aria-hidden': 'true' }),
      el('span.heatmap-key__label', { text: label }),
    );
  }
  const repertoire = el('div.list', { id: 'progress-repertoire' });
  const history = el('div.list', { id: 'progress-history' });
  const performances = el('div.list', { id: 'progress-performances' });
  const dataBlock = el('div.block', { id: 'progress-data' });
  // Held so "Show more" can redraw from the same data without a re-fetch —
  // the same shape as Skills' `entries` (`08` §13).
  let repertoireRows: ProgressRow[] = [];
  let repertoireItems: Map<string, CatalogItem> = new Map();
  let repertoireShown = REPERTOIRE_PAGE_SIZE;

  body.append(
    summary,
    el(
      'section.block',
      {},
      // The squares have had five levels since they were built; what they
      // never had was a heading saying what they measure or a key saying what
      // the shades mean, so two blues side by side told nobody anything
      // (`04` §6).
      el('h2', { text: 'Minutes a day, last 13 weeks' }),
      heat,
      heatKey,
    ),
    el('section.block', {}, el('h2', { text: 'Repertoire' }), repertoire),
    el('section.block', {}, el('h2', { text: 'Performances' }), performances),
    el('section.block', {}, el('h2', { text: 'Recent sessions' }), history),
    dataBlock,
    status,
  );

  function drawHeatmap(minutesByDay: Record<string, number>): void {
    heat.replaceChildren();
    const today = new Date();
    for (let back = HEATMAP_DAYS - 1; back >= 0; back -= 1) {
      const day = new Date(today);
      day.setDate(day.getDate() - back);
      const key = isoDay(day);
      const minutes = minutesByDay[key] ?? 0;
      heat.append(
        el('span.heat-cell', {
          'data-level': heatLevel(minutes),
          'data-day': key,
          title: `${key}: ${minutesLabel(minutes)}`,
        }),
      );
    }
  }

  function drawSummary(
    rows: ProgressRow[],
    minutesByDay: Record<string, number>,
    goal: number,
  ): void {
    const week = weekSoFar({ id: 'streak', minutesByDay, weeklyGoalMinutes: goal });
    const total = Object.values(minutesByDay).reduce((sum, value) => sum + value, 0);
    const counts = { started: 0, passed: 0, mastered: 0 };
    for (const row of rows) {
      if (row.status === 'started') counts.started += 1;
      if (row.status === 'passed') counts.passed += 1;
      if (row.status === 'mastered') counts.mastered += 1;
    }
    // R6 (`04` §0): a message belongs beside the control that caused it. This
    // one used to be written to the screen's status line — the *last* element
    // in the body, below the heat map, the repertoire list, twenty
    // performances and thirty sessions — for a control at the very top of the
    // screen, so "Weekly goal set" landed thousands of pixels below the
    // finger that caused it. `goalStatus` is that control's own line.
    const goalStatus = statusLine('progress-goal-status');
    const goalInput = numberControl('progress-goal', goal, (value) => {
      void setWeeklyGoal(value).then(() => {
        goalStatus.textContent = `Weekly goal set to ${String(Math.round(value))} minutes.`;
      });
    }, { min: 0, max: 2000, step: 10 });

    summary.replaceChildren(
      el('h2', { text: 'This week' }),
      el('p.today-goal', {
        id: 'progress-week',
        // Same wording as Today's header, deliberately: it is the same number,
        // and two phrasings for one figure reads as two different figures.
        text: `${String(Math.round(week.minutes))} of ${String(goal)} minutes this week · ${String(
          week.days,
        )} day${week.days === 1 ? '' : 's'} practised`,
      }),
      el('p.muted', {
        id: 'progress-totals',
        text: `${minutesLabel(total)} in total · ${String(counts.started)} started · ${String(
          counts.passed,
        )} passed · ${String(counts.mastered)} mastered`,
      }),
      el('div.setting-row', {}, el('label', { htmlFor: 'progress-goal', text: 'Weekly goal (minutes)' }), goalInput),
      goalStatus,
    );
  }

  function drawRepertoire(rows: ProgressRow[], items: Map<string, CatalogItem>): void {
    repertoireRows = rows;
    repertoireItems = items;
    const mastered = rows
      .filter((row) => row.status === 'mastered')
      .sort((a, b) => b.lastPracticedAt.localeCompare(a.lastPracticedAt));
    const page = mastered.slice(0, repertoireShown);
    repertoire.replaceChildren(
      ...(mastered.length > 0
        ? page.map((row) => {
            const item = items.get(row.itemId);
            const last = row.lastPracticedAt ? row.lastPracticedAt.slice(0, 10) : 'never';
            return listRow({
              title: item?.title ?? row.itemId,
              meta: `Last played ${last} · best ${String(Math.round(row.bestAccuracy * 100))}%`,
              badges: [badge('mastered', 'mastered')],
              // Through `openItem`, because a mastered *drill* belongs on the
              // drill screen and the Score screen would have nothing to show.
              actions: item
                ? [
                    button('▶', () => void openItem(router, item), {
                      ariaLabel: `Open ${item.title}`,
                    }),
                  ]
                : [],
              dataset: { 'data-item': row.itemId },
            });
          })
        : emptyList(
            'Nothing mastered yet. A piece joins this list after two clean runs on different days.',
            "Start today's session",
            () => router.navigate('today'),
            'progress-repertoire-start',
          )),
    );
    // Mastery only grows — the history and the performances are capped by
    // asking for a bounded number of *recent* rows, but a piece mastered a
    // year ago is still mastered, so this cap needs its own way to see the
    // rest instead of one that quietly drops the oldest half of a list that
    // is never wrong to be on.
    const more = mastered.length - page.length;
    if (more > 0) {
      repertoire.append(
        el(
          'div.row',
          {},
          button(
            `Show ${String(Math.min(REPERTOIRE_PAGE_SIZE, more))} more`,
            () => {
              repertoireShown += REPERTOIRE_PAGE_SIZE;
              drawRepertoire(repertoireRows, repertoireItems);
            },
            { id: 'progress-repertoire-more', variant: 'quiet' },
          ),
        ),
      );
    }
  }

  /**
   * Runs played as performances (replan §8).
   *
   * Separate from the history because it answers a different question. The
   * history says how practice is going; this says how many times he has
   * actually played a piece through for somebody, which is the thing that
   * never happens unless you can see that it has not been happening.
   */
  function drawPerformances(runs: SessionRow[], items: Map<string, CatalogItem>): void {
    performances.replaceChildren(
      ...(runs.length > 0
        ? runs.slice(0, 20).map((session) =>
            listRow({
              title: items.get(session.itemId)?.title ?? session.itemId,
              subtitle: session.at.slice(0, 16).replace('T', ' '),
              meta: `${String(Math.round(session.accuracy * 100))}% at ${String(session.tempoPct)}% · ${minutesLabel(session.durationMs / 60_000)}`,
              badges: [badge('performance', 'passed')],
              dataset: { 'data-performance': session.id ?? 0 },
            }),
          )
        : emptyList(
            'No performances yet. A performance is one run through with no restarts and no looping.',
            'Pick a piece to perform',
            () => router.navigate('library'),
            'progress-performances-pick',
          )),
    );
  }

  function drawHistory(sessions: SessionRow[], items: Map<string, CatalogItem>): void {
    history.replaceChildren(
      ...(sessions.length > 0
        ? sessions.slice(0, 30).map((session) =>
            listRow({
              title: items.get(session.itemId)?.title ?? session.itemId,
              subtitle: `${session.at.slice(0, 16).replace('T', ' ')} · ${session.mode}`,
              // A paper run has no accuracy and must not be printed as 0 %:
              // the app could not see the notes, and a zero would read as a
              // verdict rather than as an absence (replan §5.3).
              meta:
                session.mode === 'paper'
                  ? [
                      `${plural(session.notesHeard ?? 0, 'note')} heard`,
                      session.steadinessMs === undefined
                        ? 'steadiness not measured'
                        : `±${String(session.steadinessMs)} ms`,
                      minutesLabel(session.durationMs / 60_000),
                    ].join(' · ')
                  : `${String(Math.round(session.accuracy * 100))}%${
                      session.accuracyEstimated ? ' (estimated)' : ''
                    } at ${String(session.tempoPct)}% · ${minutesLabel(session.durationMs / 60_000)}`,
              badges: session.selfReport ? [badge(session.selfReport)] : [],
              dataset: { 'data-session': session.id ?? 0 },
            }),
          )
        : emptyList(
            'No runs recorded yet. Playing a piece through records one.',
            "Start today's session",
            () => router.navigate('today'),
            'progress-history-start',
          )),
    );
  }

  function drawData(): void {
    const filePicker = el('input', {
      type: 'file',
      id: 'progress-file',
      accept: '.json,application/json',
      className: 'visually-hidden',
    }) as HTMLInputElement;
    filePicker.addEventListener('change', () => {
      const file = filePicker.files?.[0];
      if (!file) return;
      void file
        .text()
        .then((text) => {
          const parsed: unknown = JSON.parse(text);
          if (!isBackupFile(parsed)) throw new Error('That is not a PianoPath backup file.');
          // Merging is the default: restoring last week's backup should never
          // throw away this week's practice (see data/backup.ts).
          return importAll(parsed);
        })
        .then((report) => {
          status.textContent = `Restored. ${String(report.written.progress ?? 0)} progress rows written, ${String(
            report.keptLocal,
          )} kept because this device was further along. Reload to see it all.`;
          void load();
        })
        .catch((cause: unknown) => {
          status.textContent = cause instanceof Error ? cause.message : String(cause);
          status.classList.add('status--error');
        })
        .finally(() => {
          filePicker.value = '';
        });
    });

    dataBlock.replaceChildren(
      el('h2', { text: 'Your data' }),
      el('p.muted', {
        text: 'Everything is on this phone and nowhere else. The backup file is the only copy — imports included.',
      }),
      el(
        'div.row',
        {},
        exportButton,
        button('Import a backup', () => filePicker.click(), { id: 'progress-import' }),
        filePicker,
        button('Diagnostics', () => router.navigate('settings', 'diagnostics'), { id: 'progress-diagnostics' }),
      ),
    );
  }

  /**
   * Export, which reports how far it has got on its own face.
   *
   * `writeBackup` rather than `exportAll` then `saveBackupFile`: those two
   * built the whole file in memory and then made a second copy of it as one
   * JavaScript string. Forty imported PDFs of 4 MB is ~213 MB once base64 has
   * inflated it, with the rows, the encoded copies and the final JSON all live
   * at once — a `RangeError` or a killed WebView on the one operation whose
   * entire purpose is protecting what exists nowhere else. This writes a row at
   * a time, so the peak is the largest single row.
   *
   * The count goes on the button because that is where the tap was (`04` §0
   * R6), and because a backup of this library is a minute of work: a minute of
   * silence here is the worst place in the app to be silent.
   */
  const exportButton: HTMLButtonElement = button(
    'Export everything',
    () => {
      const wasLabel = exportButton.textContent;
      exportButton.disabled = true;
      status.classList.remove('status--error');
      void writeBackup(new Date(), (progress) => {
        exportButton.textContent = `Saving… ${String(progress.rows)} of ${String(progress.total)}`;
      })
        .then((how) => {
          status.textContent =
            how === 'download' ? 'Backup downloaded.' : 'Backup saved — check where you put it.';
        })
        .catch((cause: unknown) => {
          status.textContent = `The export failed: ${String(cause)}`;
          status.classList.add('status--error');
        })
        .finally(() => {
          exportButton.disabled = false;
          exportButton.textContent = wasLabel ?? 'Export everything';
        });
    },
    { id: 'progress-export', variant: 'primary' },
  );

  async function load(): Promise<void> {
    const [rows, streak, sessions, performed, items, shelf] = await Promise.all([
      allProgress(),
      getStreak(),
      // Thirty, which is what the history list draws. It asked for a hundred
      // when the performances were sifted out of the same read; they have their
      // own query now.
      recentSessions(30),
      // Asked for as performances rather than filtered out of the last hundred
      // runs of anything: a performance is rare by design, so a few weeks of
      // ordinary practice used to push the last one out of that window and this
      // section then said "No performances yet" over a history full of them.
      recentPerformances(20),
      allItems(),
      allShelfPieces(),
    ]);
    const byId = new Map(items.map((item) => [item.id, item]));
    // A book piece is not in the catalog — the app has no copy of it — but it
    // is practised and recorded, so it has to be nameable here or the history
    // prints `book.czerny-599/no-12` at somebody who wants to read it.
    for (const entry of shelf) {
      if (byId.has(entry.itemId)) continue;
      byId.set(entry.itemId, {
        id: entry.itemId,
        type: 'song',
        title: entry.piece.title,
        level: entry.piece.level ?? 0,
        levelSource: entry.piece.levelSource,
        hands: 'both',
        tracks: [],
        concepts: entry.piece.concepts,
        file: null,
        tags: [],
        composer: entry.book.title,
      });
    }
    drawSummary(rows, streak.minutesByDay, streak.weeklyGoalMinutes);
    drawHeatmap(streak.minutesByDay);
    drawRepertoire(rows, byId);
    drawPerformances(performed, byId);
    drawHistory(sessions, byId);
    drawData();
  }

  void load().catch((cause: unknown) => {
    status.textContent = `Progress could not be loaded: ${String(cause)}`;
    status.classList.add('status--error');
  });

  return section;
}
