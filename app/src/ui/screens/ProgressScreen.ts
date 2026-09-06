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
import { exportAll, importAll, isBackupFile, saveBackupFile } from '../../data/backup';
import type { ProgressRow, SessionRow } from '../../data/db';
import {
  allProgress,
  getStreak,
  recentSessions,
  setWeeklyGoal,
  weekSoFar,
} from '../../data/progressStore';
import { badge, button, el, listRow, minutesLabel, numberControl } from '../widgets';
import { openItem } from '../openItem';
import { screenFrame, statusLine } from './screenFrame';

/** Days shown in the heat-map: enough to see a term, short enough to fit. */
export const HEATMAP_DAYS = 91;

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Buckets minutes into the five levels the heat-map colours. */
export function heatLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 10) return 1;
  if (minutes < 25) return 2;
  if (minutes < 45) return 3;
  return 4;
}

export function ProgressScreen(router: Router): HTMLElement {
  const { section, body } = screenFrame('progress', 'Progress');
  const status = statusLine('progress-status');
  const summary = el('div.block', { id: 'progress-summary' });
  const heat = el('div.heatmap', { id: 'progress-heatmap', role: 'img', 'aria-label': 'Practice minutes by day' });
  const repertoire = el('div.list', { id: 'progress-repertoire' });
  const history = el('div.list', { id: 'progress-history' });
  const performances = el('div.list', { id: 'progress-performances' });
  const dataBlock = el('div.block', { id: 'progress-data' });

  body.append(
    summary,
    el('section.block', {}, el('h2', { text: 'Last three months' }), heat),
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
    const goalInput = numberControl('progress-goal', goal, (value) => {
      void setWeeklyGoal(value).then(() => {
        status.textContent = `Weekly goal set to ${String(Math.round(value))} minutes.`;
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
    );
  }

  function drawRepertoire(rows: ProgressRow[], items: Map<string, CatalogItem>): void {
    const mastered = rows
      .filter((row) => row.status === 'mastered')
      .sort((a, b) => b.lastPracticedAt.localeCompare(a.lastPracticedAt));
    repertoire.replaceChildren(
      ...(mastered.length > 0
        ? mastered.map((row) => {
            const item = items.get(row.itemId);
            const last = row.lastPracticedAt ? row.lastPracticedAt.slice(0, 10) : 'never';
            return listRow({
              title: item?.title ?? row.itemId,
              meta: `Last played ${last} · best ${String(Math.round(row.bestAccuracy * 100))}%`,
              badges: [badge('mastered', 'mastered')],
              // Through `openItem`, because a mastered *drill* belongs on the
              // drill screen and the Score screen would have nothing to show.
              actions: item
                ? [button('▶', () => void openItem(router, item), { variant: 'primary' })]
                : [],
              dataset: { 'data-item': row.itemId },
            });
          })
        : [el('p.muted', { text: 'Nothing mastered yet. A piece joins this list after two clean runs on different days.' })]),
    );
  }

  /**
   * Runs played as performances (replan §8).
   *
   * Separate from the history because it answers a different question. The
   * history says how practice is going; this says how many times he has
   * actually played a piece through for somebody, which is the thing that
   * never happens unless you can see that it has not been happening.
   */
  function drawPerformances(sessions: SessionRow[], items: Map<string, CatalogItem>): void {
    const runs = sessions.filter((session) => session.performance);
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
        : [
            el('p.muted', {
              text: 'No performances yet. A performance is one run through with no restarts and no looping — start one from the Score screen.',
            }),
          ]),
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
                      `${String(session.notesHeard ?? 0)} note(s) heard`,
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
        : [el('p.muted', { text: 'No runs recorded yet.' })]),
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
        button(
          'Export everything',
          () => {
            void exportAll()
              .then((file) => saveBackupFile(file))
              .then((how) => {
                status.textContent =
                  how === 'download' ? 'Backup downloaded.' : 'Backup saved — check where you put it.';
              })
              .catch((cause: unknown) => {
                status.textContent = `The export failed: ${String(cause)}`;
                status.classList.add('status--error');
              });
          },
          { id: 'progress-export', variant: 'primary' },
        ),
        button('Import a backup', () => filePicker.click(), { id: 'progress-import' }),
        filePicker,
        button('Diagnostics', () => router.navigate('settings', 'diagnostics'), { id: 'progress-diagnostics' }),
      ),
    );
  }

  async function load(): Promise<void> {
    const [rows, streak, sessions, items, shelf] = await Promise.all([
      allProgress(),
      getStreak(),
      recentSessions(100),
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
    drawPerformances(sessions, byId);
    drawHistory(sessions, byId);
    drawData();
  }

  void load().catch((cause: unknown) => {
    status.textContent = `Progress could not be loaded: ${String(cause)}`;
    status.classList.add('status--error');
  });

  return section;
}
