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
import { screenFrame, statusLine } from './screenFrame';

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
  const actions = el('div.row', { id: 'lesson-actions' });

  body.append(
    status,
    actions,
    el('section.block', {}, el('h2', { text: 'Exercise options' }), exercises),
    el('section.block', {}, el('h2', { text: 'Song options' }), songs),
    el('section.block', {}, el('h2', { text: 'Concept' }), text),
    el('section.block', {}, el('h2', { text: 'Videos' }), videos),
  );

  let lesson: Lesson | undefined;
  let curriculum: Curriculum | null = null;
  let progress = new Map<string, ProgressRow>();
  let items = new Map<string, CatalogItem>();

  function records(): PassRecord[] {
    return [...progress.values()].map((row) => ({
      itemId: row.itemId,
      passed: row.status === 'passed' || row.status === 'mastered',
      mastered: row.status === 'mastered',
    }));
  }

  function openItem(item: CatalogItem): void {
    if (item.kind === 'pdf') router.navigatePdf(item.id);
    else router.navigateScore(item.id);
  }

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
    const importNeeded = !item.file && !item.imported && !item.drill;
    if (importNeeded) badges.push(badge('import needed', 'warn'));

    return listRow({
      title: item.title,
      subtitle: item.composer ?? undefined,
      meta: `${levelLabel(item.level)} · ${handsLabel(item.hands)} · ${item.source?.name ?? 'PianoPath'}`,
      badges,
      actions: importNeeded
        ? []
        : [
            button('▶', () => openItem(item), { variant: 'primary' }),
            button('Know it', () => void markKnown(item.id), { variant: 'quiet' }),
          ],
      onClick: importNeeded ? undefined : () => openItem(item),
      dataset: { 'data-item': item.id },
    });
  }

  async function markKnown(itemId: string): Promise<void> {
    await selfPass(itemId);
    progress = new Map((await allProgress()).map((row) => [row.itemId, row]));
    draw();
    status.textContent = 'Marked as already known. It shows a different badge from a measured pass.';
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
          if (drill) openItem(drill);
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
    const [loaded, loadedItems, rows] = await Promise.all([loadCurriculum(), allItems(), allProgress()]);
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
    void curriculum;
  })().catch((cause: unknown) => {
    status.textContent = `That lesson could not be opened: ${String(cause)}`;
    status.classList.add('status--error');
  });

  return section;
}
