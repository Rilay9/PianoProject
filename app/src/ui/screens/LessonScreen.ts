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
import { allItems, loadCurriculum, fetchMarkdown } from '../../curriculum/load';
import { findLesson, idsToCompleteLesson, lessonComplete } from '../../curriculum/selectors';
import { lessonShortfall } from '../../curriculum/needs';
import type { CatalogItem, Curriculum, Lesson, LessonTool, PassRecord } from '../../curriculum/types';
import { allProgress, selfPass } from '../../data/progressStore';
import { getSettings, updateSettings } from '../../data/settingsStore';
import { markLessonLearnt, markSkill } from '../../data/skillsStore';
import { recordPlacement } from '../../data/planStore';
import type { ProgressRow } from '../../data/db';
import { parseFrontMatter, renderMarkdown } from '../markdown';
import { badge, button, el, handsLabel, levelLabel, listRow, openSheet } from '../widgets';
import { hasChordSymbols, isPlayable, openItem, targetFor } from '../openItem';
import { screenFrame, statusLine } from './screenFrame';
import { openFinderSheet } from '../finderSheet';
import { confirmMessage, lockState, type LockState } from '../../curriculum/prerequisites';
import { openPieceSheet } from './ShelfScreen';
import { allBooks, addBook, allShelfPieces, type BookRow, type ShelfPiece } from '../../data/booksStore';
import { plural } from '../../util/plural';
import { simonForStage } from '../../engine/drills/simon';

interface VideoLink {
  label?: string;
  url?: string;
  teacher?: string;
}

/**
 * What the *Song options* block says on a rung that has none (`04` §0 R4).
 *
 * Three rungs of the plan mean three different things by an empty list, and
 * until 2026-09-22 two of them shared a sentence that was wrong for both.
 *
 *   - **`songOptional`** — sixteen rungs, the whole of the theory and
 *     improvisation ladders among them, plus `jam.5`, `jam.6` and
 *     `technique.8`. The rung is *finished* on its exercises (`02` Part G), so
 *     the line is not an apology. It used to end "(docs/00 D21)" — the
 *     repository citing itself in front of somebody at a piano who has no
 *     `docs/00`. `lessonShape.test.ts` forbids a lesson doing that in three
 *     different shapes and nothing forbade the screen doing it.
 *   - **`optionsExempt`** — `0.1`, `0.2` and `0.4`: posture, the keyboard's
 *     layout, the placement test. These said "No songs listed for this lesson
 *     **yet**", which promises a song to a rung that will never have one.
 *   - **Anything else** — a rung the quarry has not filled. "yet" is right
 *     there, and it is the only place it is.
 */
export function noSongsSentence(lesson: Pick<Lesson, 'songOptional' | 'optionsExempt'>): string {
  if (lesson.songOptional === true) return 'No song tests this skill — two exercises finish this rung.';
  if (lesson.optionsExempt === true) return 'No songs on this rung — its exercises are the whole of it.';
  return 'No songs listed for this lesson yet.';
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
  // The state and the two things done *to* a rung, on one line: a badge, one
  // outlined check, and text for the rest (`04` §0 R3). As four boxes of equal
  // weight they took two rows and pushed the options further down.
  const actions = el('div.row.lesson-actions', { id: 'lesson-actions' });
  const needsLine = el('p.needs', { id: 'lesson-needs' });
  const lockLine = el('p.lesson-lock', { id: 'lesson-lock', hidden: true });
  /**
   * The modes this rung recommends, as controls (`04` §3d).
   *
   * Above the options rather than below them, and deliberately: a mode is a way
   * of playing what is on this rung, so it is read *before* choosing which
   * option to play, not after. Hidden entirely when the rung names none, which
   * is most of them — an empty block headed "Ways to play this" would be the
   * dead space `00-invariants` §1 and `04` §0 R4 both forbid.
   */
  const toolRow = el('div.row', { id: 'lesson-tools' });
  const toolsBlock = el(
    'section.block',
    { id: 'lesson-tools-block', hidden: true },
    el('h2', { text: 'Ways to play this' }),
    toolRow,
    // What each of those buttons opens, for the learner who has not met it
    // yet. The guide's list is built from the same table the screens read
    // (`04` §5f), so this is a way in rather than a second explanation.
    el(
      'div.plan-links',
      { id: 'lesson-guide-link' },
      button('What each of these is', () => router.navigate('settings', 'guide'), {
        id: 'lesson-open-guide',
        variant: 'quiet',
      }),
    ),
  );
  /**
   * Where this rung sits, under its own title (`04` §3, 2026-09-23).
   *
   * Opening a lesson answered none of "where am I": the page began with the
   * rung's title and went straight to three things you do *after* playing it
   * and then seven options of equal weight (owner, 2026-09-22: *"it should be
   * intuitive"*). The track, the stage and the unit this rung belongs to are
   * three facts the curriculum already knows and the page never said.
   */
  const where = el('p.lesson-where.muted', { id: 'lesson-where' });
  header.append(where);

  /**
   * One thing to press, and a line saying what it will open.
   *
   * The screen's only filled box (`04` §0 R3). The option rows' own `▶` are
   * secondary on purpose — a rung with nine exercises had nine blue buttons
   * and therefore no answer to "what now?" — and this is that answer: the
   * first thing on the rung, opened exactly as tapping its row would.
   */
  const startWhat = el('p.lesson-start__what.muted', { id: 'lesson-start-what' });
  const startBlock = el('div.lesson-start', { id: 'lesson-start-block', hidden: true });

  const findRow = el('div.row', { id: 'lesson-find' });
  // Where the paper hint lives on a rung with no books behind it (P19 A8).
  const paperHintLine = el('p.paper-hint.muted', { id: 'lesson-paper-hint', hidden: true });

  // The options are what the page is for, and they were about 560 px down a
  // 780 px screen: under a status line, three buttons, a link, the needs line,
  // two more buttons, another link and a hint paragraph (`04` §0 R1).
  //
  // Now: the state and the two things done to a rung, then the options, then
  // everything that is read once and acted on rarely.
  body.append(
    status,
    startBlock,
    actions,
    lockLine,
    toolsBlock,
    el('section.block', {}, el('h2', { text: 'Exercise options' }), exercises),
    el('section.block', {}, el('h2', { text: 'Song options' }), songs),
    el('section.block', { id: 'lesson-paper-block' }, el('h2', { text: 'From your own books' }), paper),
    el(
      'section.block',
      { id: 'lesson-more' },
      el('h2', { text: 'More for this rung' }),
      needsLine,
      findRow,
      paperHintLine,
    ),
    el('section.block', {}, el('h2', { text: 'Concept' }), text),
    el('section.block', {}, el('h2', { text: 'Videos' }), videos),
  );

  let lesson: Lesson | undefined;
  let curriculum: Curriculum | null = null;
  let progress = new Map<string, ProgressRow>();
  let items = new Map<string, CatalogItem>();
  let shelf: ShelfPiece[] = [];
  let lock: LockState = { locked: false, missing: [], reason: '' };

  function records(): PassRecord[] {
    return [...progress.values()].map((row) => ({
      itemId: row.itemId,
      passed: row.status === 'passed' || row.status === 'mastered',
      mastered: row.status === 'mastered',
    }));
  }

  /**
   * Opens an item, asking once first when the rung is gated.
   *
   * Never a disabled card (`00` D17): the confirmation says what the app
   * thinks and leaves the decision where it belongs. Cancelling does nothing
   * and costs one tap; there is no second warning and no tone of disapproval,
   * because skipping ahead is a legitimate thing to do.
   *
   * The rung rides along (`04` §5, `?from=`), so `← Back` on the Score screen
   * comes back to this page rather than dropping the learner on Plan at
   * whatever stage it was scrolled to. This page is where the rung's other
   * options, its lesson and its *Know it* buttons are; the tab is not.
   */
  const open = (target: CatalogItem): void => {
    if (lock.locked && !window.confirm(confirmMessage(lock))) return;
    void openItem(router, target, { from: lessonId });
  };

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
            // Secondary, not primary (R3): a rung with nine exercises had
            // nine blue buttons and therefore no answer to "what now?".
            button('▶', () => open(item), { ariaLabel: `Open ${item.title}` }),
            // The other door into the chord chart (`04` §3b, built
            // 2026-09-21; the Score screen's ⋯ sheet has the first). `jam`
            // and `jazz.5` are the two rungs whose lessons describe the
            // chart, and both are rungs of chord-symbol songs — so the door
            // goes on the row rather than in the rung's `tools`, where it
            // would have to name one of the rung's songs and would be silent
            // about the rest of them.
            //
            // Drawn only where the file has chord symbols in it, so it never
            // appears over a piece that has none.
            ...(hasChordSymbols(item)
              ? [
                  // The rung rides along here too (`04` §3b, `?from=`), for
                  // the reason `open` above carries it: a chart opened from
                  // this row came out on the Library, which is not where the
                  // learner was.
                  button('Chart', () => { router.navigateChart(item.id, { from: lessonId }); }, {
                    variant: 'quiet',
                    ariaLabel: `Open the chord chart for ${item.title}`,
                  }),
                ]
              : []),
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
   * Counted from the lesson the app is holding — imports and shelf pieces
   * overlaid — rather than printed from the build's `needs` block, which was
   * written before the owner added anything (review C3). The floor is still the
   * build's; only the counting is here. See `curriculum/needs.ts`.
   */
  function drawNeeds(current: Lesson): void {
    const needs = lessonShortfall(current);
    const short: string[] = [];
    if (needs.songs > 0) short.push(needs.songs === 1 ? 'one more song' : `${String(needs.songs)} more songs`);
    if (needs.exercises > 0) {
      short.push(
        needs.exercises === 1 ? 'one more exercise' : `${String(needs.exercises)} more exercises`,
      );
    }
    if (short.length === 0) {
      const count = current.songOptions.length + current.exerciseOptions.length;
      needsLine.textContent = `This rung has ${plural(count, 'option')} — enough to choose between.`;
      needsLine.classList.remove('needs--short');
    } else {
      needsLine.textContent =
        `This rung wants ${short.join(' and ')} to reach the floor of ` +
        `${String(needs.floor)}. Find one, or play what is here.`;
      needsLine.classList.add('needs--short');
    }

    findRow.replaceChildren();
    if (current.finder) {
      const finder = current.finder;
      findRow.append(
        // `openFinderSheet`'s own contract calls this "a rung's title, or a
        // concept's name"; it was being handed the id as well.
        button('Find more', () => openFinderSheet(finder, current.title), {
          id: 'lesson-find-more',
          variant: 'quiet',
        }),
      );
    }
    findRow.append(
      // The two-tap path (replan §4.3): the rung goes in the hash, Library
      // imports the file and opens the assign sheet with this rung already
      // chosen, so the only thing left is Save.
      button('Import for this rung', () => router.navigateImportFor(current.id), {
        id: 'lesson-import-for',
        variant: 'quiet',
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

    // A heading, a hint and an empty list on a rung with nothing behind it is
    // the app asking for bookkeeping the owner never agreed to — and 29 rungs
    // carry a paper hint. With no shelf at all the whole section collapses to
    // one muted line under the finder row, which is what the hint is: an
    // aside, not a section. The one thing that does not collapse with it is
    // "I have this on paper", because that is the route onto the shelf and
    // deleting it would mean the shelf could never be started from the rung
    // that wanted it; it moves up beside the finder instead.
    const shelfBlock = section.querySelector('#lesson-paper-block');
    const worthShowing = registered.length > 0 || shelf.length > 0;
    if (shelfBlock instanceof HTMLElement) shelfBlock.hidden = !worthShowing;
    paperHintLine.hidden = worthShowing || !current.paperHint;
    paperHintLine.textContent = current.paperHint ?? '';
    if (!worthShowing) {
      // drawNeeds clears this row and runs first; the guard is for the redraw
      // after a piece is added, which calls drawPaper on its own.
      if (!findRow.querySelector('#lesson-have-paper')) {
        findRow.append(
          button('I have this on paper', () => void addFromPaper(current), {
            id: 'lesson-have-paper',
            variant: 'quiet',
          }),
        );
      }
      paper.replaceChildren();
      return;
    }

    const rows: HTMLElement[] = registered.map((entry) => {
      const row = progress.get(entry.itemId);
      const badges: HTMLElement[] = [];
      if (row && row.status !== 'new') {
        badges.push(badge(row.selfPassed ? 'you said you can play it' : row.status, row.status));
      }
      // Only if the catalog still has it: deleting the import leaves the id
      // on the piece, and the button would open an "Unknown item" page.
      const twin =
        entry.piece.itemId && items.has(entry.piece.itemId) ? entry.piece.itemId : undefined;
      if (twin) badges.push(badge('has a twin', 'passed'));
      const actions = [
        button('Practise', () => router.navigatePaper(entry.book.id, entry.piece.id), {
          variant: 'primary',
        }),
      ];
      if (twin) {
        // The rung rides along here too (`04` §5): this is a door on the
        // lesson page like any other, and it was the one nearly missed.
        actions.push(
          button('With the score', () => router.navigateScore(twin, { from: current.id }), {
            variant: 'quiet',
          }),
        );
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
      rows.unshift(el('p.paper-hint', { id: 'lesson-paper-hint-block', text: current.paperHint }));
    }
    if (registered.length === 0) {
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

  /** The whole rung list — the preselected one needs an option to be, and he
   * can move the piece to a different rung from here if he meant another. */
  function lessonChoicesFor(): { lesson: Lesson; stage: number }[] {
    return curriculum
      ? curriculum.stages.flatMap((stage) =>
          stage.units.flatMap((unit) =>
            unit.lessons.map((entry) => ({ lesson: entry, stage: stage.number })),
          ),
        )
      : [];
  }

  function openPaperSheetFor(book: BookRow, current: Lesson): void {
    openPieceSheet({
      book,
      lessons: lessonChoicesFor(),
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

  /**
   * "I have this on paper" used to file straight into `books[0]` — the
   * alphabetically first book, with no picker anywhere in the flow. With one
   * book (the fixture, and the auto-created "My book") that is always right;
   * with three registered books, every piece added from a lesson page went
   * silently into the first one, and the only way to notice was to open the
   * Shelf. One book keeps the one-tap flow; more than one asks which.
   */
  async function addFromPaper(current: Lesson): Promise<void> {
    let books = await allBooks();
    if (books.length === 0) {
      // With an empty shelf there is nothing to add a piece *to*, and sending
      // him to the Shelf screen to create a book first would be the long way
      // round from a button that promised to be short.
      await addBook({ title: 'My book', kind: 'method' });
      books = await allBooks();
    }
    if (books.length === 1) {
      const [book] = books;
      if (book) openPaperSheetFor(book, current);
      return;
    }
    const sheet = openSheet('Which book?', { id: 'lesson-paper-book-picker' });
    sheet.body.append(
      el('p.muted', { text: 'More than one book is registered — pick the one this piece is in.' }),
      ...books.map((book) =>
        listRow({
          title: book.title,
          subtitle: book.author ?? undefined,
          onClick: () => {
            sheet.close();
            openPaperSheetFor(book, current);
          },
        }),
      ),
    );
  }

  /** The badge and the one-line reason, when gating is on and this rung is gated. */
  function drawLock(): void {
    lockLine.replaceChildren();
    lockLine.hidden = !lock.locked;
    if (!lock.locked) return;
    lockLine.append(badge('comes later', 'warn'), ' ', el('span', { text: lock.reason }));
    const first = lock.missing[0];
    if (first) {
      const id = first.id;
      lockLine.append(
        ' ',
        button(`Go to ${id}`, () => router.navigateLesson(id), {
          variant: 'quiet',
          id: 'lesson-prereq-go',
        }),
      );
    }
  }

  /**
   * A tool's button, or nothing where it cannot open anything.
   *
   * The Score-screen modes need a piece. A rung may name one with `item`; where
   * it does not, the button takes the rung's first playable song, because "play
   * this rung's material as a duet" is the instruction and any of its songs
   * satisfies it. Where the rung has no playable song at all the button is not
   * drawn — a duet with nothing to duet against is a dead control.
   */
  function toolButton(tool: LessonTool, rung: Lesson, sameKindBefore = 0): HTMLElement | null {
    const scorePiece = (): string | null => {
      if (tool.item) {
        // A song **or** an exercise, since 2026-09-22. `technique.7` is the
        // rung that forced it: its sentence is about the two-against-three
        // exercise and its only songs are three Czerny etudes, so the old
        // song-only rule turned "play the exercise as a duet" into a button
        // that opened a study (Entry 24 item 7 left the paragraph unbuilt for
        // exactly this). What has not moved is the rule that matters - the
        // item must be one of *this* rung's options - and the option must
        // still open as notation, which is `targetFor`'s answer and not the
        // id's.
        const offered =
          rung.songOptions.includes(tool.item) || rung.exerciseOptions.includes(tool.item);
        if (!offered) return null;
        const named = items.get(tool.item);
        return named !== undefined && targetFor(named) === 'score' ? tool.item : null;
      }
      return (
        rung.songOptions.find((id) => {
          const item = items.get(id);
          return item !== undefined && isPlayable(item) && item.type === 'song';
        }) ?? null
      );
    };
    /**
     * What *Play it as a duet* does, and why it writes a setting first (T17).
     *
     * A duet is the hand you are *not* playing, and which hands the app plays
     * is a **setting** (`playbackHands`), not a route field. The Library's own
     * *Duet* door writes it for exactly that reason (`04` §4); this one did
     * not — so a learner who had ever switched the Score screen's Duet row
     * off, which is one tap and a thing people do, got a button labelled *Play
     * it as a duet* that opened a screen where the app played nothing at all.
     * Driven from `2.1` on 2026-09-22 and it did.
     *
     * `both` is left alone, the same way the Library door leaves it: a learner
     * who asked for both hands is already hearing the one they are not
     * playing.
     */
    const setDuetPlayback = (): void => {
      updateSettings({
        playbackHands: getSettings().playbackHands === 'both' ? 'both' : 'non-focused',
      });
    };
    const make = (label: string, onClick: () => void): HTMLElement => {
      const node = button(tool.label ?? label, onClick, {
        variant: 'quiet',
        // A rung may name a kind twice — eight rungs now carry both a lab
        // preset and the lab with nothing fixed, because the preset locks the
        // very control the lesson teaches (built 2026-09-21). Two elements
        // with one id is a document that cannot be queried, so the second and
        // later get a suffix and the first keeps the id every existing test
        // and stylesheet already names.
        id:
          sameKindBefore === 0
            ? `lesson-tool-${tool.kind}`
            : `lesson-tool-${tool.kind}-${String(sameKindBefore + 1)}`,
      });
      // What this button says it will open, on the button. The e2e compares it
      // against where the tap actually lands, so the assertion is "the control
      // goes where it claims" rather than a preset id copied into a test — a
      // copy that failed the day a rung was repointed, reporting a correct
      // change as a broken test.
      if (tool.preset) node.dataset.preset = tool.preset;
      return node;
    };

    switch (tool.kind) {
      case 'lab':
        return make('Accompaniment lab', () => {
          // One button that says what it frees and which way round it opens,
          // in place of the two the same rung carried before (Entry 24 item 5).
          router.navigateLab(tool.preset, {
            ...(tool.unlock ? { unlock: tool.unlock } : {}),
            ...(tool.mode ? { mode: tool.mode } : {}),
          });
        });
      case 'play':
        return make('Free play', () => { router.navigatePlay(); });
      case 'simon': {
        // The stage is the leading number of the rung's unit id, which is how
        // `placementTargets` reads it too; a rung id that does not start with
        // one (`blues.3`) takes its second segment.
        // A rung may name its Simon (`tool.item`): the blues rungs name the one
        // seeded from the blues scale, which no stage rule would choose.
        const digits = /(\d+)/.exec(rung.id);
        const id =
          tool.item && items.has(tool.item) ? tool.item : simonForStage(digits ? Number(digits[1]) : 1);
        return items.has(id) ? make('Simon', () => { router.navigateDrill(id); }) : null;
      }
      case 'duet': {
        const id = scorePiece();
        return id === null
          ? null
          : make('Play it as a duet', () => {
              setDuetPlayback();
              router.navigateScore(id, { mode: 'tempo', hands: 'R', from: rung.id });
            });
      }
      case 'blind': {
        const id = scorePiece();
        return id === null
          ? null
          : make('Play it blind', () => { router.navigateScore(id, { blind: true, from: rung.id }); });
      }
      case 'ladder': {
        // An *exercise*, not a song: the ladder loops the whole item, which is
        // what a scale or a Hanon number already is and is absurd on a prelude
        // (`04` §3d). An option that opens as a drill rather than as notation
        // is skipped — `4.3` leads with `drill.chord.inversions`, which has no
        // file — and where a rung offers nothing that opens as a score the
        // button is not drawn, the way a duet with nothing to duet against is
        // not drawn.
        const id =
          rung.exerciseOptions.find((option) => {
            const found = items.get(option);
            return found !== undefined && targetFor(found) === 'score';
          }) ?? null;
        if (id === null) return null;
        const node = make('Climb the ladder', () => {
          router.navigateScore(id, { mode: 'tempo', ladder: true, from: rung.id });
        });
        // Which exercise it claims it will open, on the button, so the e2e can
        // compare the claim against where the tap lands.
        node.dataset.item = id;
        return node;
      }
      default:
        return null;
    }
  }

  /**
   * The track, the stage and the unit this rung belongs to, in that order.
   *
   * Read off the curriculum each draw rather than stored: the lesson is the
   * only thing this screen is given, and its place is a property of the tree
   * it sits in. An empty string when the curriculum has not landed yet, which
   * is the same state the title is in at that moment.
   */
  function placeLine(rung: Lesson): string {
    if (!curriculum) return '';
    for (const stage of curriculum.stages) {
      for (const unit of stage.units) {
        if (!unit.lessons.some((one) => one.id === rung.id)) continue;
        const track = curriculum.tracks.find((entry) => entry.id === unit.track);
        // The unit only when it is not the rung's own title said again: a unit
        // of one rung takes its name, and `Core path · Stage 1 · Right hand C
        // position` under a heading reading *Right hand C position* is the
        // screen saying one thing twice (`00-invariants` §1).
        // Everything here is read defensively. This line is furniture around
        // the rung, not the rung, and a curriculum missing a unit title must
        // cost the learner one line of address rather than the whole page:
        // the screen's one `catch` turns any throw in `draw` into "That lesson
        // could not be opened", which is a lie about a lesson that is fine.
        const unitTitle = unit.title ?? '';
        const sameName =
          unitTitle.trim().toLowerCase() === (rung.title ?? '').trim().toLowerCase();
        return [track?.title ?? unit.track, `Stage ${String(stage.number)}`, sameName ? '' : unitTitle]
          .filter(Boolean)
          .join(' · ');
      }
    }
    return '';
  }

  /**
   * What *Start* opens: the first thing on the rung that can be played.
   *
   * The rung's own order is the teaching order — `02` builds
   * `exerciseOptions` before `songOptions` and each list in the order it means
   * — so "the first one that is playable" is the recommendation, not a guess
   * made here. An import placeholder is skipped because pressing Start on one
   * would open a sheet about a missing file.
   */
  function startItem(rung: Lesson): CatalogItem | null {
    for (const id of [...rung.exerciseOptions, ...rung.songOptions]) {
      const item = items.get(id);
      if (item && isPlayable(item)) return item;
    }
    return null;
  }

  function drawStart(rung: Lesson): void {
    const target = startItem(rung);
    startBlock.replaceChildren();
    if (!target) {
      // `04` §0 R4: no furniture. A rung whose options are all waiting on an
      // import has nothing for this button to open, and the rows below say so
      // one at a time.
      startBlock.hidden = true;
      return;
    }
    startWhat.textContent = `Opens “${target.title}”, the first thing on this rung.`;
    startBlock.append(
      button('Start', () => open(target), { id: 'lesson-start', variant: 'primary' }),
      startWhat,
    );
    startBlock.hidden = false;
  }

  function draw(): void {
    if (!lesson) return;
    const rung = lesson;
    where.textContent = placeLine(rung);
    drawStart(rung);
    const seenKinds = new Map<string, number>();
    const tools = (rung.tools ?? [])
      .map((tool) => {
        const before = seenKinds.get(tool.kind) ?? 0;
        seenKinds.set(tool.kind, before + 1);
        return toolButton(tool, rung, before);
      })
      .filter((node): node is HTMLElement => node !== null);
    toolRow.replaceChildren(...tools);
    toolsBlock.hidden = tools.length === 0;
    exercises.replaceChildren(...lesson.exerciseOptions.map(optionRow));
    songs.replaceChildren(
      ...(lesson.songOptions.length > 0
        ? lesson.songOptions.map(optionRow)
        : [el('p.muted', { text: noSongsSentence(lesson) })]),
    );

    drawNeeds(lesson);
    drawPaper(lesson);
    drawLock();

    const done = lessonComplete(lesson, records(), { requireTwoSongs: getSettings().requireTwoSongs });
    // A lesson finished by *playing* it teaches its concepts too.
    //
    // `markSkill` was called in exactly one place: the `I already know this`
    // shortcut. So a learner who practised a rung properly left every one of
    // its concepts at `unseen` for ever — and because `displayState` derives
    // "rusty" only from a state that is *not* unseen, those concepts could
    // never go rusty either. The Skills review screen was inert for anyone who
    // actually played the piano, which is the opposite of who it is for.
    //
    // Only on the transition, and only for a concept still unseen. Marking on
    // every draw would refresh `lastReviewedAt` each time the page was opened,
    // and a timestamp that keeps moving is one that never reaches thirty days —
    // the screen would then have no rusty skills for the other reason.
    if (done) void markLessonLearnt(lesson.concepts ?? []);
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
        { id: 'lesson-know', variant: 'quiet' },
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
        // 'Mark done' rather than 'Mark lesson done': it is on a lesson page,
        // beside that lesson's state, and the extra word was the one that took
        // the row onto a second line.
        'Mark done',
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
    if (lesson) {
      lock = lockState(lesson, loaded, records(), {
        strict: getSettings().strictPrerequisites,
        requireTwoSongs: getSettings().requireTwoSongs,
      });
    }
    if (!lesson) {
      // `04` §0 R4. It said the rung did not exist and then drew the whole rung
      // anyway: six empty section blocks — Exercise options, Song options, From
      // your own books, More for this rung, Concept, Videos — one sentence, and
      // nothing on the screen that went anywhere. `#/lesson/9.9` parses, so
      // this is one mistyped hash away and not a hypothetical.
      status.textContent = `There is no lesson “${lessonId}”. The plan lists every lesson there is.`;
      status.classList.add('status--error');
      for (const block of body.querySelectorAll('.block')) {
        if (block instanceof HTMLElement) block.hidden = true;
      }
      lockLine.hidden = true;
      startBlock.hidden = true;
      where.textContent = '';
      // The sentence is the first thing in the body and `actions` the second,
      // so the reason still comes before the remedy.
      actions.replaceChildren(
        button('Open the plan', () => router.navigate('plan'), {
          id: 'lesson-open-plan',
          variant: 'primary',
        }),
      );
      return;
    }
    // The title, and nothing else — the same correction Plan's rows already
    // carry. `classical.4.shelf · A singing melody, and the shelf to aim at`
    // spent the first half of the heading on an internal id the learner has no
    // use for, and on a 342 px phone that is the half that wraps. `00` §1:
    // no internal identifiers on screen.
    //
    // The id stays on the screen's own element as `data-lesson`, which is
    // where a test wants it and a person does not. `sweeps.spec` reads it
    // there to prove the route resolved to this rung rather than to the "no
    // such lesson" state, which is the only thing it was ever using the
    // heading for.
    section.dataset.lesson = lesson.id;
    (header.querySelector('h1') as HTMLElement).textContent = lesson.title;
    draw();

    try {
      const { data, body: markdown } = parseFrontMatter(await fetchMarkdown(lesson.textFile));
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
