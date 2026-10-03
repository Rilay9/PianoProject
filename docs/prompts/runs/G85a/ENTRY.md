### Entry 160 — G85a — the Details sheet is the Library's door to the one project sheet: one row inside a song's Details, *What next with this piece?* over the sheet's own state line, opens the sheet Progress and the Score screen open, on the target the index resolved; the list row spends no width (the reviewer's required change on G85, `responses/ba4c6fea.md`; a narrow fix-forward under 788427c; app only) (2026-09-29)

**Judgement.** Nothing was heard, and G85a claims nothing about music. What I looked at: the committed code's app (built from HEAD's `LibraryScreen.ts` into `build/g85a/dist-head`) and this tree's, both on port 4533 at 342 × 740, on this worktree's offline content build (1,864 catalogue items; the main checkout's full build has 2,092). *Twinkle, Twinkle, Little Star (hands together)* was made a project (*Learning*) straight in the store, as the sheet writes it. The pictures are in `pictures/g85a/`, with the rows, the Details sheets' children and item 8's measurements in `before-facts.json` and `after-facts.json`.

- **Details, before and after, for a project row** (`before-details-learning-end-342x740.png`, `after-details-learning-end-342x740.png`; observed). Before: the facts, *Your level*, then *Open*. After: the same, with one row between *Your level* and *Open*: **What next with this piece?** over *Learning since 2026-09-29*, in the list-row shape the placeholder's *Play this instead* rows use. It reads as its own row with *Open*, not as part of *Your level*: its own border, a wider gap above it than below it (the facts file: the gap to *Your level* is twice the gap to *Open*), and *Open* stays the one filled box, last. The whole sheet still fits the screen at this size.
- **Details for a song with no project** (`before-details-no-project-end-342x740.png`, `after-details-no-project-end-342x740.png`, *Twinkle … (in F major)*; observed). Before: *Your level*, then *Open*. After: the same row over **Not a project yet**, the sheet's own words for no project, so the door does not say a project exists. The sheet opened from Details and the row after *Pause* and *Close* are pictured on this tree's build only: the committed build has no door to open them from.
- **Details for a placeholder and for a PDF import** (`after-details-placeholder-end-342x740.png`, `after-details-pdf-end-342x740.png`; observed): no door on either. The placeholder's sheet ends with its import sentence, *Import a score* and *Play this instead* as before; the PDF's with *Open*.
- **The sheet opened from Details** (`after-sheet-from-details-learning-342x740.png`; observed): the piece's title, *Learning since 2026-09-29*, and the actions the sheet offers from Learning. Its met line says *You have never opened it.*, which is true of this test: the project was put in the store and the piece was never played. *Pause* (`after-sheet-paused-342x740.png`): *Paused since 2026-09-29*, the history line, and *Paused.* beside the actions.
- **The Library after *Pause* and *Close*** (`after-library-after-pause-close-342x740.png`, `after-row-twinkle-ht-paused-342x740.png`; observed): the list as it was, the row wearing *Paused*; the four *Twinkle* rows keep their two-line titles whole, *(hands together)* and *(in F major)* included. In every picture, before and after, each of the four titles has the same width, and none is cut (the facts files: `scrollWidth ≤ clientWidth` and `scrollHeight ≤ clientHeight` on every row).
- **The sheet from no project** (`after-sheet-from-details-no-project-342x740.png`; observed): *Not a project yet*, *You have never opened it.*, and the four offers, *Save for later*, *Learn this*, *Prepare it for performance*, *Keep it playable*. Whether *Keep it playable* reads right for a piece the learner has never played in the app is the sheet's question (item 10; Follow-ups 2). **Unverified as copy**: the door's words in this place, as a learner reads them.

**Item 8, what the look found** (`after-item8-letter-m-before-342x740.png`, `after-item8-letter-m-after-342x740.png`, `item8*` in `after-facts.json`; observed here):
- **The list keeps its place.** Sorted by title, a jump to *M* moved the window, and a song eight rows into it was put mid-screen. I acted on it through Details (*Save for later* on the sheet). Measured before, under the sheet after the write, and after *Close*: the scrolling element (`div.screen-body`) scrolled by the same amount, the row's top at the same place, the same window of the list (the count line's *showing …* range, the first and last rows drawn), and the rail shown. The hypothesis held: `draw` keeps `from` and `shown` and rebuilds within one task, and the rebuilt list is no shorter, so the scroll position stands. Nothing to fix in the redraw path. The row itself grew by its new badge line, so the rows below it moved down by that line.
- **Focus after *Close* lands on the page's body** (`focusAfterClose` and `item8FocusAfterClose`). The door closes Details, which returns focus to the row's *Details*; the project sheet then opens, and records that button as where focus goes back to (`widgets.ts:266, 273`). The write redraws the list and replaces the row and its button, so on *Close* the focus call reaches a detached button, and focus falls to the body. Recorded, not fixed (the brief), Follow-ups 1. Measured only after a write; with no write the button would still be on the page (inferred, not measured).

## The mechanism

**Not a fault but a missing door**, as G85 left it. The reviewer approved the state and the filter and required the door, inside Details, without spending row width (`responses/ba4c6fea.md` :20–36).

**The brief's hypothesis, tested:** the door needs no second read and no new redraw path. The index gives the words, the sheet resolves the same project by the store's rule over the same target, and G85's listener redraws. What would have refuted it: (b) opening a sheet that says *Not a project yet*, or acting on a second row; or the browser case's badge still reading *Learning* after *Close*. Neither happened. (b) opens *Saved for later since …* for `song.twin` (the project made under `song.twin.before`), and *Learn this* there leaves one row for file `d`, under `song.twin.before`, now `learning`, with six rows in the store as seeded. The Library row's badge reads *Learning* after the listener's redraw. In the browser, the badge reads *Paused* after *Close*, and the store holds one row, the seeded `file:<sha256>`, `paused`. **It held.**

**The change** (`LibraryScreen.ts`):

1. **`projectDoor(item, sheet)`**, beside `showDetail`: one `listRow`, title `PROJECT_TEXT.door`, subtitle `projectSince(project.state, project.since, dayKey)` where `projectOf` holds a project and `PROJECT_TEXT.none` where it does not, `id="library-detail-project"`. Tapped, it closes Details (as *Open* and *Play this instead* do) and calls `openProjectSheet({ item, material: materialOfItem(item), bars?, owner: section })`. `item` and `materialOfItem(item)` are the target `indexProjects` resolved the row with, so the sheet's own read (`projectFor`, `projectIn` over the same target) finds the same project. `bars` is computed as Progress computes it. There is no `onChange`: every sheet write reaches `notify()`, and `projectsChanged` already redraws the badge, the filter's result and the count once per burst.
2. **Where it appears:** `projectOf.has(item.id) || (isProjectable(item) && targetFor(item) === 'score')`. That is wherever a project exists, and with none, only on a song that opens on the Score screen. There the four offers from no project are the learner's intentions, allowed before any run, and the met line reads the history that screen writes. It never appears without a project on a PDF (the viewer writes no encounter, so the sheet would say *never opened* of a PDF read daily), on a placeholder (a project made there would be keyed `id:<placeholder>` and stay there when the file arrives under its own id), or on a non-song (never in the index).
3. **Placement:** directly above *Open*. On a placeholder, which has no *Open* and gets the door only where its project exists, the door goes at the end of the sheet.
4. **The rest:** the imports of `openProjectSheet`, `dayKey` and `projectSince`, the header's line on doors, and `rowFor`'s comment, which now points at `projectDoor`. The row is untouched.

**One read, still.** The door's words come from `projectOf.get(item.id)`; opening Details reads nothing. `LibraryScreen.ts` keeps one `allProjects(`, one `projectIn(`, no `projectFor(`, `applyProjectAction` or notes or sections writer, and now one `openProjectSheet(` (the source pin). `projectLifecycle.test.ts:509–553` is unchanged and green: the Library was already a reader, and `actors` is still the sheet alone.

**Premises of the brief, checked at the lines.** Every cited line held within a few lines (`showDetail` at 723–824, `projectOf` 334, `indexProjects` 1291–1301, `projectsChanged` 1309–1321, the listener 1410, `rowFor`'s lookup and comment 986 and 1011–1014; `projectSheet.ts` 33–49, 79–255, 241; `ProgressScreen.ts` 405–414; `ScoreScreen.ts` 3872–3888; `projectStore.ts` 68–83, 99–128, 177–190; `material.ts` 43–59; `openItem.ts` 23–33, 71–73; `help.ts` 617–687; `widgets.ts` 265–293). Where a premise needed more than the line:
- *"`library.spec.ts`'s G85 describe already sets 342 × 740"*: it does (:251). The §0 describe is 360 × 780.
- *"`song.folk.twinkle.ht` … Check its id and file identity"*: in this worktree's catalogue, its title is *Twinkle, Twinkle, Little Star (hands together)* and its identity a `file`. The case reads both from `content/catalog.json` at run time, as the G85 case does.
- **The unit harness needed one stub the brief did not name.** The sheet opened from Details reads the history through `encounterStore.familiarity`, which reads `catalogIndex` from `curriculum/load`. `libraryProjects.test.ts`'s mock had no `catalogIndex`, so the met line stayed at *Looking at what you have played…* (the first run of (d), observed). The mock gained `catalogIndex` over the same fixture items, as `projectSheet.test.ts` stubs it. It is a harness change in a file G85a owns, and no source moved for it.
- *"Opening wrote nothing"* holds at the store: (d) compares the store's rows before and after opening the sheet, and the browser pictures' `storeAfterNoProjectSheet` shows the one paused row and nothing for the no-project piece.

## Done

1. **Item 1, the goal.** A learner who finds a piece in the Library reaches the one project sheet from that piece's Details, in the sheet's own words, and the row they scanned is as it was. Technical: done (items 2–7). Pedagogical: the door's words in this place are **unverified as copy**. No music is claimed.
2. **Item 2, the door.** One `listRow` in `showDetail`, `PROJECT_TEXT.door` over the state line or `PROJECT_TEXT.none`, id `library-detail-project`, directly above *Open*. On a placeholder it goes at the end. It closes Details and opens `openProjectSheet({ item, material: materialOfItem(item), bars?, owner: section })`, with no `onChange` and no new word in `help.ts`.
3. **Item 3, the honest-door rule.** `projectOf.has(item.id) || (isProjectable(item) && targetFor(item) === 'score')`, in `projectDoor`, with each reason in its comment. The unit cases cover each branch: a bundled song, an import on its bytes, the same file under another id, a song with none, a placeholder and a PDF without one, an exercise with a row, and a PDF and a placeholder with one.
4. **Item 4, one store read.** Kept. The source pin gained `openProjectSheet(` ×1 and still holds one `allProjects(`, one `projectIn(`, and none of `projectFor(`, `applyProjectAction`, `setProjectNotes`, `addProjectSection`, `removeProjectSection`. `projectLifecycle.test.ts` is unchanged and green.
5. **Item 5, the row untouched.** `rowFor` changed only in its comment. The row-actions case keeps its assertions, gains the two new fixture rows' actions (`Details` on the placeholder; `Edit`, `Assign`, `Details` on the PDF), and has a revised title. The file header's lines on the door and the describe's title (*item 2 a question*) are revised. In the browser, the row's title width is equal before, with its badge, and after the pause, and its actions are exactly `Details`, `⋯`.
6. **Item 6, unit, red first.** A new describe, *the Details sheet is the door to the one project sheet (G85a)*, has six cases: (a), (b), (c), (d), (e) split into *no door without a project* and *a project shown whatever the item*. The fixtures gain a placeholder song (`song.wanted`, no file, not imported, identity `none`) and a PDF import (`import.pdf`), and the load mock gains `catalogIndex`. No existing case changed its meaning. Red on the committed `LibraryScreen.ts`: (a)–(d), (e)'s *a project shown*, and the extended source pin. (e)'s *no door* case was green there, by design: there was no door anywhere.
7. **Item 7, browser, red first: the reviewer's adversary.** `library.spec.ts` › *Details opens the one project sheet: the title stays whole, a pause there reaches the row and the filter on closing, and the store holds the one project (G85a)*, in the G85 describe at 342 × 740, on `song.folk.twinkle.ht`. The steps are as briefed: the title whole before, then with *Learning* at the same width; the door in Details over *Learning since <today>*; the sheet's title and state; *Pause*; *Close* with no navigation (the URL and a marker on `window` unchanged); the badge *Paused*, and one project badge; Project *Learning* shows `#library-empty` naming it; *Paused* lists the row alone; the title still whole at the same width; the store holding one row, the seeded id, `paused`. Red on the committed build at the door (*expected 1, received 0* for `#library-detail #library-detail-project`); every step before it passed there, which is the row being untouched. Green on this tree's build. The G85 case beside it is unchanged and green on both builds.
8. **Item 8, look and record.** Both done (above): the place is kept; focus falls to the body.
9. **Item 9, the hypothesis.** Tested and held (the mechanism). None of the three deviations applied. The door above *Open* does not read as part of *Your level* or of a placeholder's import block, since a placeholder shows no door without a project. No item turned up that item 3 does not cover. The listener fired for every write seen: the sheet's *Learn this* in (b), *Pause* in the browser case, and *Save for later* in item 8.
10. **Item 10, not G85a's.** Not touched: the Stage 9 rows' door, the filter copy, the index's cost, `projectSheet.ts`, `isProjectable`, the backlog and `current.md`. The sheet's *Keep it playable* from no project is recorded (Follow-ups 2).
11. **Doc rows** (below), written against Entry 147's pending rows.

## Not done

1. **The whole browser suite.** The map names four specs for these paths, and I ran those four (51 passed). CI's full run was not run.
2. **Mutants.** Not run: the brief asks for none. The cases pin the rule's branches, the target (another id's project, an import's), the no-`onChange` redraw, and the one read.
3. **Other widths.** Only 342 × 740 was pictured. The map's specs ran at their own viewports.
4. **The lane config** (`app/playwright.g85a-4533.config.ts`) and its storage state (`build/g85a/storageState-4533.json`) are not for the commit. `npm run lint` was run with the config moved aside, and exited 0.

## Follow-ups (recorded, not fixed)

1. **P3 (accessibility), focus after the project sheet's *Close* falls to the page's body** when a write redrew the list behind it (item 8). The sheet returns focus to the element focused when it opened, the row's *Details*, which the redraw replaced. Two ways out, neither G85a's to take: the Library could put focus back on the redrawn row (by `data-item`) when a draw replaces the focused row's button, or `openSheet` could fall back to a named element when its return target is gone. The first is `LibraryScreen.ts`, the second `widgets.ts`, which every sheet uses.
2. **P2 (the sheet's, G87's lane), *Keep it playable* offered from no project on a piece never played in the app** (`after-sheet-from-details-no-project-342x740.png`: *You have never opened it.* above *Keep it playable*). `OFFERS.none` includes it because Progress's *Make it a project* is for a piece already passed (`projectStore.ts:62–67`). Through the Library door, the same offer appears on a piece the learner may never have played. It is honest as the learner's statement, but the words may not fit. Unverified as copy.
3. **P3, a PDF import's detail line says *song*** (`after-details-pdf-*`, the row in its picture: *≈ L5.0 · song*). `importSourceWords` has nothing for a PDF, so the row falls back to the type, beside its own *PDF · pages, not notes* badge. Observed in passing; X3's line, not G85a's.
4. **P3, a two-line title with a project badge makes the row taller than R2's 96 px** (the facts files: the *(hands together)* row grows by one badge line, before and after G85a alike). This is G85's badge on a two-line title, the same as a status badge on one. It is related to Entry 147's Follow-up 6, and G85a changes nothing in it.
5. **The record G85a makes stale beyond `04` and `08`, not written here:** `docs/01-architecture.md`'s `projects` row (Entry 147's pending *read by the Library* could add *and opened from a piece's Details*), and the backlog's G1b not-done 1 and follow-up 4 (Entry 147's pending *the door on the row did not fit at 342 px and is a question* is now answered by the Details door). Both are the orchestrator's.

## Questions

None that block. The Stage 9 rows' door is the reviewer's Question 2 (*later, through an existing secondary surface*), not G85a's.

## Red lines (`runs/G85a/red/`)

- `red-unit-committed.txt`: the final `libraryProjects.test.ts` and `projectLifecycle.test.ts` run on HEAD's `LibraryScreen.ts`. `scripts-red-on-committed.py` swapped it in and put it back by sha256 (*restored, sha256 equal: True*). 6 of 52 failed:
  - (a): *expected [] to have a length of 1 but got +0* (`#library-detail-project` in Details);
  - (b), (c), (d) and (e)'s *a project shown*: *expected [ '', '' ] to deeply equal [ 'What next with this piece?', … ]*;
  - the source pin: *one place opens the one sheet: Target cannot be null or undefined.*

  Green there: (e)'s *no door* case (by design), the 14 G85 cases, and `projectLifecycle.test.ts`.
- `red-e2e-committed.txt`: the G85 describe on the committed build (`build/g85a/dist-head`, built by `scripts-build-committed-app.py` with the same swap, *restored: True*). The G85a case failed: *expect(locator).toHaveCount(expected) failed — Locator: locator('#library-detail #library-detail-project') Expected: 1 Received: 0*. The G85 case passed.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `app/tests/unit/libraryProjects.test.ts` › *the Details sheet is the door to the one project sheet (G85a)*, six cases | add | — | items 2–4 and 6 on the mounted Library |
| `libraryProjects.test.ts` › *the row’s actions are the ones it had … the door to the sheet is inside Details, never on the row (G85a; Entry 147)* | revise | the door a question (the title) | the title names Details as the door; its assertions kept; the two new fixture rows' actions pinned |
| `libraryProjects.test.ts` › the describe *the Library row wears the learner’s project (G85 item 1; the door in Details, G85a)* | revise | *item 2 a question* (the title) | the title only |
| `libraryProjects.test.ts` › *one read of the store, one identity rule, …* | revise (extend) | the Library opens no sheet | one `openProjectSheet(`; the rest unchanged |
| `libraryProjects.test.ts`, the fixtures, the load mock and the header | revise | six fixture items; no `catalogIndex`; the door a question | a placeholder and a PDF import added; `catalogIndex` over the same items (the sheet's met line reads it); the header names the Details door |
| `app/tests/e2e/library.spec.ts` › *Details opens the one project sheet: … (G85a)* | add | — | item 7, the reviewer's adversary at 342 × 740 |
| `library.spec.ts`, the G85 describe's comment | revise | the door did not fit, so there is none | a door beside the actions did not fit; the second case opens the sheet from Details |
| `library.spec.ts` › *a piece Learning wears the badge, … (G85)* | preserve | — | green on both builds: it pins the Progress path |
| `app/tests/unit/projectLifecycle.test.ts` | preserve | — | unchanged, green |
| the map's four specs, and the unit suite | preserve | — | below |

## Exit codes (each capture ends with its exit)

| Run | Exit | What it said |
| --- | --- | --- |
| `npm ci` (`npm-ci.log`) | 0 | — |
| parity reference (`parity-reference.txt`) | 0 | five reference files; the three real MIDI files skipped, not fetched |
| `build.py --offline` (`content-build-offline.txt`) | 1 | validation without the fetched folders (the caches were not copied: the disk had about 3 GB free, and the fetched sources are about 700 MB); it wrote `app/public/content` (1,864 items), which was kept, as U96 did. The items G85a reads are in it: the four *Twinkle* rows with file identities, the placeholder *Final Masquerade* |
| the three reports restored (`restore-reports.txt`) | 0 | same bytes as the snapshots; `git status` clean on them |
| vitest, the final tests on HEAD's `LibraryScreen.ts` (`red/red-unit-committed.txt`) | 1 | the red above; restored True |
| vitest, the two files after the change (`green-unit.txt`) | **0** | 52 tests |
| `npx tsc -b` (`tsc.txt`) | **0** | — |
| `npm run lint`, the lane config moved aside (`lint-without-config-copy.txt`) | **0** | — |
| the committed code's app into `build/g85a/dist-head` (`build-app-committed.txt`) | 0 | only `LibraryScreen.ts` differs under `app/src`; restored True |
| Playwright 4533, the G85 describe on the committed build (`red/red-e2e-committed.txt`) | 1 | the red above; the G85 case passed |
| `npm run build:app` (`build-app.txt`) | **0** | — |
| Playwright 4533, the G85 describe on this tree's build (`green-e2e-g85-describe.txt`) | **0** | 2 passed |
| pictures, the committed build and this tree's (`pictures-before.txt`, `pictures-after.txt`); copied (`copy-pictures.txt`) | 0, 0; 0 | before: 1 passed, item 8 skipped (no door to act through); after: 2 passed; 31 files copied |
| `checks_for_paths.py`, the final paths (`checks-for-paths.txt`) | 0 | 8 of 8 matched; tsc, lint, the whole unit suite, the app build, and `doors`, `finder`, `library`, `modes-rhythm-only` |
| Playwright 4533, two workers, the map's four specs, each checked present (`e2e-map-specs.txt`) | **0** | **51 passed** |
| vitest, the whole suite (`vitest-full-summary.txt`; the full log, about 950 KB of it jsdom's *Not implemented* lines, was not kept) | 1 | 315 files; 6,894 passed, 66 failed in 11 files, 5 skipped, 1 todo |
| the 11 failed files alone, on this tree's and on HEAD's `LibraryScreen.ts` (`vitest-failed-files-compare.txt`, `scripts-compare-failed-files.py`, restored True) | 1; 1 | 66 failed on this tree and 65 on HEAD's, the 65 the same names on both. They are the offline catalogue's missing pieces (for example `legacyStorage`'s *song.folk.bella-ciao is not in the built catalog*; `lessonClaimsAboutMusic`, `lessonClaimsAboutApp` with Entry 101's two line-ending assertions among them, `firstThirtyDaysOnTheLadder`, `curriculumIntegrity`, `everyOptionOpens`, `planNoUnobtainableRungs`, `materialOnTheRecord`, `scoreModelTempo`, `lessonClaims`), so not G85a's. The one on this tree only was `expectedNote`'s sweep, *Test timed out in 5000ms* (it imports neither the Library nor the sheet) |
| `expectedNote.test.ts` alone (`vitest-expectedNote-alone.txt`) | **0** | 12 of 12: the timeout was load |

**Unverified**, beside what passes:
- the door's words in Details, as a learner reads them (copy);
- *Keep it playable* from no project on a piece never played (the sheet's; Follow-ups 2);
- other widths: only 342 × 740 pictured;
- a real learner's many projects, and a real encounter history behind the met line: the projects were seeded in the store, so the sheet said *You have never opened it.* in every picture;
- the whole browser suite;
- the full catalogue: this worktree's offline build has 1,864 items, not the main checkout's 2,092;
- **CI has not run this tree.**

## Files

In the worktree `agent-a006ea5e3b88fa4ac`, cut from origin's head `f6d36ee9` (it holds G85's merge `760b8f61` and U96's `ee481854`). Nothing committed, nothing staged.

- Changed:
  - `app/src/ui/screens/LibraryScreen.ts`: the header's line on doors; the imports of `dayKey`, `openProjectSheet` and `projectSince`; `showDetail`'s door, placed above *Open* or at a placeholder's end; `projectDoor`; `rowFor`'s comment;
  - `app/tests/unit/libraryProjects.test.ts`: the header, the two fixture items, `catalogIndex` in the load mock, the imports, the describe's and the row-actions case's titles, the two new rows' actions, the new describe, the extended source pin;
  - `app/tests/e2e/library.spec.ts`: the G85 describe's comment and the G85a case.
- New:
  - `docs/prompts/tasks/G85a-the-details-sheet-is-the-door.md` (the brief, copied unchanged);
  - `docs/prompts/runs/G85a/`: this entry, the captures in the table, `red/`, and the scripts as they ran: `scripts-red-on-committed.py`, `scripts-build-committed-app.py`, `scripts-run-e2e.sh`, `scripts-zz-g85a-pictures.spec.ts` (copied into `app/tests/e2e/` for its two runs and removed), `scripts-copy-pictures.py`, `scripts-restore-reports.py`, `scripts-compare-failed-files.py`, `scripts-summarise-unit-suite.py`, `scripts-sanitise.py`. In the captures, machine paths are replaced by `<worktree>`, `<main checkout>`, `<temp>` and `<home>`. No file in the folder is over 300 KB;
  - `docs/prompts/pictures/g85a/`: 31 files, the before and after pictures and the two facts files;
  - `app/playwright.g85a-4533.config.ts`: the lane, **not for the commit** (Not done 4).
- Not touched: `projectSheet.ts`, `projectStore.ts`, `help.ts`, `ProgressScreen.ts`, `ScoreScreen.ts`, `LessonScreen.ts`, `style.css` (the list-row and sheet classes served), `session.ts`, `DrillScreen.ts`, `projects.spec.ts`, `tools/content/**`, `docs/04`, `docs/08`.
- Cleaned after the runs: `app/dist`, `app/test-results`, `build/g85a/dist-head`, the built `app/public/content` (everything but the committed `audio/`), `app/public/dev`, and the temp copies under `build/g85a/`. No cache was copied from the main checkout. `app/node_modules` is still there: the brief did not name it.

## Doc rows

**`docs/04-ui-spec.md` §4, the paragraph Entry 147 adds after *The letter rail* (*The learner's project on a row*)**: its last sentence, "A door to the sheet on the row was tried and not built: … where the Library's door goes is open (Entry 147, question 1).", becomes:

> The Library's door to the sheet is inside the piece's **Details**, never on the row (G85a, 2026-09-29; the reviewer's required change on G85, `responses/ba4c6fea.md`). A word beside *Details* and `⋯` was tried at 342 px and cut the titles: the four *Twinkle* rows lost the endings that tell them apart, which is the room R2 keeps for the title (Entry 147). Details carries one row, directly above *Open*: *What next with this piece?* (the finish sheet's words for the same door) over the sheet's own state line, *Learning since …* where a project exists and *Not a project yet* where none does. The row's words come from the index the list already holds, so opening Details reads nothing. Tapped, Details closes and the one project sheet, the one Progress and the Score screen open, opens on the piece's target and finds the project the row's badge shows. The door is there wherever a project exists. With none, it is there only on a song that opens on the Score screen, where the sheet's offers from no project are the learner's intentions and its line of what was played reads the history that screen writes. It is not on a PDF, whose viewer writes no history, so the sheet would say *never opened* of a PDF read every day; or on a placeholder, where a project would stay on its id when the file arrives under its own; the placeholder's honest action is its import. A change on the sheet redraws the row's badge, the filter's result and the count behind it, from one read of the store; the list keeps its place.

**`docs/08-test-map.md`, the state-machine row *The learner's projects*** (as Entry 147 amends it):
- the owners gain "the Library's Details door to the sheet (G85a)";
- the faults gain "a door to the sheet on the Library row; a door implying a project where none exists, or on a PDF or placeholder without one; the door's sheet finding another project, or making a second; a store read per row or on opening Details (G85a)";
- the tests gain "`libraryProjects.test.ts` › *the Details sheet is the door to the one project sheet (G85a)* (added) and its source pin (extended, one `openProjectSheet(`); `library.spec.ts` › *Details opens the one project sheet … (G85a)* (added) — red on the committed code";
- the status's "its door to the sheet a question" becomes "its door in the piece's Details (G85a, Entry 160)".

**`docs/08-test-map.md`, the file lists** (as Entry 147 amends them):
- `library.spec.ts` gains "; Details opening the one sheet at 342 px, the title whole before and after, a pause there reaching the row's badge and the Project filter on *Close*, one project in the store (G85a)";
- `libraryProjects.test.ts` gains "; the Details door (G85a): its words from the index, the sheet it opens finding the same project (another id's, an import's), the four offers from none with nothing written, no door on a PDF, a placeholder or an exercise without a project, and one shown on a PDF or placeholder with one".
