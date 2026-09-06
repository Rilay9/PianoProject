/**
 * The lesson page (docs/04 §3).
 *
 * Three things share this screen and they are deliberately not the same
 * weight: the concept text is what you read once, the option cards are what
 * you actually tap, and "I already know this" is the escape hatch that keeps a
 * personal build from turning into homework.
 *
 * "I already know this" records a *self-pass* and says so. It is not the same
 * claim as a measured run and the badge is different, because six months later
 * the difference between "the app watched me play this" and "I said I could"
 * is the only thing that makes the progress record worth anything.
 */
import type { Router } from '../../router';
import { allItems, contentUrl, loadCurriculum } from '../../curriculum/load';
import { findLesson, idsToCompleteLesson, lessonComplete } from '../../curriculum/selectors';
import type { CatalogItem, Curriculum, Lesson, PassRecord } from '../../curriculum/types';
import { allProgress, selfPass } from '../../data/progressStore';
import { getSettings } from '../../data/settingsStore';
import { markSkill } from '../../data/skillsStore';
import { recordPlacement } from '../../data/planStore';
import type { ProgressRow } from '../../data/db';
import { parseFrontMatter, renderMarkdown } from '../markdown';
import { badge, button, el, handsLabel, levelLabel, listRow } from '../widgets';
import { isPlayable, openItem } from '../openItem';
import { screenFrame, statusLine } from './screenFrame';
import { openFinderSheet } from '../finderSheet';
import { openPieceSheet } from './ShelfScreen';
import { allBooks, addBook, allShelfPieces, type ShelfPiece } from '../../data/booksStore';

interface VideoLink {
  label?: string;
  url?: string;
  teacher?: string;
}

export function LessonScreen(router: Router, lessonId: string): HTMLElement {
  const { section, header, body } = screenFrame('lesson', `Lesson ${lessonId}`);
  const status = statusLine('lesson-status');
  const back = button('← Plan', () => router.navigate('plan'), { variant: 'quiet', id: 'lesson-back' });
  header.prepend(back);

  const text = el('div.lesson-text', { id: 'lesson-text' });
  const videos = el('div.list', { id: 'lesson-videos' });
  const exercises = el('div.list', { id: 'lesson-exercises' });
  const songs = el('div.list', { id: 'lesson-songs' });
  const paper = el('div.list', { id: 'lesson-paper' });
  const actions = el('div.row', { id: 'lesson-actions' });
  const needsLine = el('p.needs', { id: 'lesson-needs' });
  const findRow = el('div.row', { id: 'lesson-find' });

  body.append(
    status,
    actions,
    el('section.block', {}, needsLine, findRow),
    el('section.block', {}, el('h2', { text: 'Exercise options' }), exercises),
    el('section.block', {}, el('h2', { text: 'Song options' }), songs),
    el('section.block', { id: 'lesson-paper-block' }, el('h2', { text: 'From your own books' }), paper),
    el('section.block', {}, el('h2', { text: 'Concept' }), text),
    el('section.block', {}, el('h2', { text: 'Videos' }), videos),
  );

  let lesson: Lesson | undefined;
  let curriculum: Curriculum | null = null;
  let progress = new Map<string, ProgressRow>();
  let items = new Map<string, CatalogItem>();
  let shelf: ShelfPiece[] = [];

  function records(): PassRecord[] {
    return [...progress.values()].map((row) => ({
      itemId: row.itemId,
      passed: row.status === 'passed' || row.status === 'mastered',
      mastered: row.status === 'mastered',
    }));
  }

  const open = (target: CatalogItem): void => void openItem(router, target);

  function optionRow(id: string): HTMLElement {
    const item = items.get(id);
    if (!item) {
      return listRow({ title: id, meta: 'Not in the catalog', badges: [badge('missing', 'warn')] });
    }
    const row = progress.get(id);
    const badges: HTMLElement[] = [];
    if (row && row.status !== 'new') {
      badges.push(badge(row.selfPassed && row.status === 'passed' ? 'you said you know it' : row.status, row.status));
    }
    const importNeeded = !isPlayable(item);
    if (importNeeded) badges.push(badge('import needed', 'warn'));

    return listRow({
      title: item.title,
      subtitle: item.composer ?? undefined,
      meta: `${levelLabel(item.level, item.levelSource)} · ${handsLabel(item.hands)} · ${item.source?.name ?? 'PianoPath'}`,
      badges,
      actions: importNeeded
        ? []
        : [
            button('▶', () => open(item), { variant: 'primary' }),
            button('Know it', () => void markKnown(item.id), { variant: 'quiet' }),
          ],
      onClick: importNeeded ? undefined : () => open(item),
      dataset: { 'data-item': item.id },
    });
  }

  async function markKnown(itemId: string): Promise<void> {
    await selfPass(itemId);
    progress = new Map((await allProgress()).map((row) => [row.itemId, row]));
    draw();
    status.textContent = 'Marked as already known. It shows a different badge from a measured pass.';
  }

  /**
   * One line saying what the rung is short of, and the way to fix it.
   *
   * The numbers come from `needs`, written into the built curriculum by
   * validate.py (replan §4.2) — not recounted here, because the counting rules
   * (the floor, a song-optional rung counting both lists together) would then
   * live in two places and drift.
   */
  function drawNeeds(current: Lesson): void {
    const needs = current.needs;
    const short: string[] = [];
    if (needs) {
      if (needs.songs > 0) short.push(needs.songs === 1 ? 'one more song' : `${String(needs.songs)} more songs`);
      if (needs.exercises > 0) {
        short.push(
          needs.exercises === 1 ? 'one more exercise' : `${String(needs.exercises)} more exercises`,
        );
      }
    }
    if (short.length === 0) {
      const count = current.songOptions.length + current.exerciseOptions.length;
      needsLine.textContent = `This rung has ${String(count)} option(s) — enough to choose between.`;
      needsLine.classList.remove('needs--short');
    } else {
      needsLine.textContent =
        `This rung wants ${short.join(' and ')} to reach the floor of ` +
        `${String(needs?.floor ?? 3)}. Find one, or play what is here.`;
      needsLine.classList.add('needs--short');
    }

    findRow.replaceChildren();
    if (current.finder) {
      const finder = current.finder;
      findRow.append(
        button('Find more', () => openFinderSheet(finder, `${current.id} · ${current.title}`), {
          id: 'lesson-find-more',
          variant: short.length > 0 ? 'primary' : 'secondary',
        }),
      );
    }
    findRow.append(
      // The two-tap path (replan §4.3): the rung goes in the hash, Library
      // imports the file and opens the assign sheet with this rung already
      // chosen, so the only thing left is Save.
      button('Import for this rung', () => router.navigateImportFor(current.id), {
        id: 'lesson-import-for',
      }),
    );
  }

  /**
   * What the owner's own books offer for this rung (replan §5.2).
   *
   * Kept apart from the song options because the two are different kinds of
   * thing: a song option is something the app can open and judge, a paper
   * option is a page in a book in the room. Mixing them would make the list
   * longer and the promise vaguer.
   */
  function drawPaper(current: Lesson): void {
    const registered = shelf.filter((entry) => entry.piece.lessonIds.includes(current.id));
    const rows: HTMLElement[] = registered.map((entry) => {
      const row = progress.get(entry.itemId);
      const badges: HTMLElement[] = [];
      if (row && row.status !== 'new') {
        badges.push(badge(row.selfPassed ? 'you said you can play it' : row.status, row.status));
      }
      if (entry.piece.itemId) badges.push(badge('has a twin', 'passed'));
      const actions = [
        button('Practise', () => router.navigatePaper(entry.book.id, entry.piece.id), {
          variant: 'primary',
        }),
      ];
      const twin = entry.piece.itemId;
      if (twin) {
        actions.push(button('With the score', () => router.navigateScore(twin), { variant: 'quiet' }));
      }
      return listRow({
        title: entry.piece.title,
        subtitle: `${entry.book.title}${entry.piece.page === undefined ? '' : ` · page ${String(entry.piece.page)}`}`,
        badges,
        actions,
        dataset: { 'data-paper': entry.itemId },
      });
    });

    if (current.paperHint) {
      rows.unshift(el('p.paper-hint', { id: 'lesson-paper-hint', text: current.paperHint }));
    }
    if (registered.length === 0 && !current.paperHint) {
      rows.push(el('p.muted', { text: 'Nothing registered from your books for this rung yet.' }));
    }
    // The one-tap route onto the shelf, with the rung already chosen. The
    // whole point is that he is looking at this rung and saying his book
    // covers it, so he should not then have to say which rung he meant.
    rows.push(
      el(
        'div.row',
        {},
        button('I have this on paper', () => void addFromPaper(current), {
          id: 'lesson-have-paper',
        }),
      ),
    );
    paper.replaceChildren(...rows);
  }

  async function addFromPaper(current: Lesson): Promise<void> {
    let books = await allBooks();
    if (books.length === 0) {
      // With an empty shelf there is nothing to add a piece *to*, and sending
      // him to the Shelf screen to create a book first would be the long way
      // round from a button that promised to be short.
      await addBook({ title: 'My book', kind: 'method' });
      books = await allBooks();
    }
    const book = books[0];
    if (!book) return;
    // The whole rung list, so the preselected one has an option to be, and so
    // he can move the piece to a different rung from here if he meant another.
    const lessons = curriculum
      ? curriculum.stages.flatMap((stage) =>
          stage.units.flatMap((unit) =>
            unit.lessons.map((entry) => ({ lesson: entry, stage: stage.number })),
          ),
        )
      : [];
    openPieceSheet({
      book,
      lessons,
      items: [...items.values()],
      preselectLesson: current.id,
      onDone: () => {
        void (async () => {
          shelf = await allShelfPieces();
          drawPaper(current);
        })();
      },
    });
  }

  function draw(): void {
    if (!lesson) return;
    exercises.replaceChildren(...lesson.exerciseOptions.map(optionRow));
    songs.replaceChildren(
      ...(lesson.songOptions.length > 0
        ? lesson.songOptions.map(optionRow)
        : [
            el('p.muted', {
              text: lesson.songOptional
                ? 'No song tests this skill — two exercises complete the lesson (docs/00 D21).'
                : 'No songs listed for this lesson yet.',
            }),
          ]),
    );

    drawNeeds(lesson);
    drawPaper(lesson);

    const done = lessonComplete(lesson, records(), { requireTwoSongs: getSettings().requireTwoSongs });
    actions.replaceChildren(
      el('span', { id: 'lesson-state' }, done ? badge('complete', 'passed') : badge('in progress')),
      button(
        'I already know this',
        () => {
          // Marks every option of the lesson self-passed in one go: the claim
          // is about the *skill*, not about one particular tune.
          void (async () => {
            const strict = { requireTwoSongs: getSettings().requireTwoSongs };
            for (const id of lesson ? idsToCompleteLesson(lesson, strict) : []) await selfPass(id);
            for (const concept of lesson?.concepts ?? []) await markSkill(concept, 'known');
            progress = new Map((await allProgress()).map((row) => [row.itemId, row]));
            draw();
            status.textContent = 'Lesson marked as already known.';
          })();
        },
        { id: 'lesson-know', variant: 'secondary' },
      ),
      button(
        'Quick check',
        () => {
          // A 2–3 minute measured test: the lesson's first playable drill,
          // opened for a real run rather than self-assessed.
          const drill = (lesson?.exerciseOptions ?? [])
            .map((id) => items.get(id))
            .find((item) => item && (item.drill || item.file));
          if (drill) open(drill);
          else status.textContent = 'This lesson has no drill to check against yet.';
        },
        { id: 'lesson-check' },
      ),
      button(
        'Mark lesson done',
        () => {
          if (!confirm('Mark this lesson done without a measured run?')) return;
          void (async () => {
            const strict = { requireTwoSongs: getSettings().requireTwoSongs };
            for (const id of lesson ? idsToCompleteLesson(lesson, strict) : []) await selfPass(id);
            progress = new Map((await allProgress()).map((row) => [row.itemId, row]));
            draw();
            status.textContent = 'Marked done by hand.';
          })();
        },
        { id: 'lesson-done', variant: 'quiet' },
      ),
    );

    // docs/02 Stage 0.4: the placement test's answer sets where the plan starts.
    if (lessonId === '0.4') {
      actions.append(
        button(
          'Start here',
          () => {
            void recordPlacement(lessonId).then(() => {
              status.textContent = 'Placement recorded. Today will build from here.';
            });
          },
          { id: 'lesson-placement' },
        ),
      );
    }
  }

  void (async () => {
    const [loaded, loadedItems, rows, pieces] = await Promise.all([
      loadCurriculum(),
      allItems(),
      allProgress(),
      allShelfPieces(),
    ]);
    shelf = pieces;
    curriculum = loaded;
    items = new Map(loadedItems.map((item) => [item.id, item]));
    progress = new Map(rows.map((row) => [row.itemId, row]));
    lesson = findLesson(loaded, lessonId);
    if (!lesson) {
      status.textContent = `There is no lesson ${lessonId}.`;
      return;
    }
    (header.querySelector('h1') as HTMLElement).textContent = `${lesson.id} · ${lesson.title}`;
    draw();

    try {
      const response = await fetch(contentUrl(lesson.textFile));
      if (!response.ok) throw new Error(`${response.status}`);
      const { data, body: markdown } = parseFrontMatter(await response.text());
      text.replaceChildren(renderMarkdown(markdown));
      const links = Array.isArray(data.videos) ? (data.videos as VideoLink[]) : [];
      videos.replaceChildren(
        ...(links.length > 0
          ? links.map((video) =>
              listRow({
                title: video.label ?? video.url ?? 'Video',
                subtitle: video.teacher ?? undefined,
                // docs/04 §8: link-outs say they need the network *before* the tap.
                meta: 'Opens YouTube — needs internet',
                actions: [
                  button('Watch', () => window.open(video.url ?? '', '_blank', 'noreferrer'), {
                    variant: 'quiet',
                  }),
                ],
              }),
            )
          : [el('p.muted', { text: 'No videos listed for this lesson.' })]),
      );
    } catch {
      text.replaceChildren(el('p.muted', { text: 'The lesson text is not on the device yet.' }));
    }
  })().catch((cause: unknown) => {
    status.textContent = `That lesson could not be opened: ${String(cause)}`;
    status.classList.add('status--error');
  });

  return section;
}
