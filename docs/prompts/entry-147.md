### Entry 147 — G85 — the Library's song rows wear the learner's project state and a Project filter finds them, both read from the one `projectStore`; the row's door to the project sheet did not fit at 342 px and is a question (the reviewer's ruling 3 on the G1b brief; G1b's not-done 1 and follow-up 4; P2) (2026-09-29)

**Judgement.** Nothing was heard, and G85 claims nothing about music. What I looked at: the committed code's app (4dc2f135, built before any source change) and this tree's app on port 4433 at 342 × 740, with *Hot Cross Buns* made a project straight in the store as the sheet writes it (*Learning*), then paused on the one sheet. I also looked at the unit harness and the code. The pictures are in `pictures/g85/`, with every row's words, widths and marks in `before-facts.json` and `after-facts.json`.

- **One row, before and after** (`before-row-hot-cross-buns-learning-342x740.png`, `after-row-hot-cross-buns-learning-342x740.png`, `after-row-hot-cross-buns-paused-342x740.png`; the screens `*-library-search-hot-cross-*.png`; observed). Before, the piece is a project in the store but the Library row says nothing of it: **Hot Cross Buns** / *Traditional (English street…* / *L1.1 · RH · song* / *Details* `⋯`. After, the same row with one plain badge under the detail line, *Learning*, and after the pause *Paused*. The title, the detail line and the actions keep their width (the text column is 164 CSS px before and after, observed here). The row grows by the badge line, as a row with a status badge always has (71 → 95 px observed, inside R2's 96). *Hot Cross Buns (left hand)*, a separate item with no project, wears nothing.
- **The longest badge line** (`row-passed-and-preparing-342x740.png`, `two-badges-facts.json`; observed). A piece both passed and a project in a long state, such as *✓ passed* next to *Preparing for performance*, puts the two badges on two lines and the row stands at 121 px, over R2's 96. The short states fit beside *✓ passed* on one line; the long ones wrap (*Preparing for performance*, and by width, not pictured, *Keeping it playable*, *Ready to perform*, *Bringing it back*). I kept it. The badge line already wraps rather than cut a word. The rows it touches are the learner's own projects, not the catalogue. And the Library already pays R2's excess where there is more to say (the imports' tall rows, `style.css`'s note: "affordable in a list you scroll"). Follow-ups 6.
- **The filter** (`after-filters-342x740.png`, `after-filters-open-342x740.png`, `after-filter-learning-342x740.png`; before `before-filters-open-342x740.png`; observed). A seventh control behind **Filter**, right after the status select: *Project or not* (the default) · *Your projects* · the eight states in the sheet's words. With *Learning* set, the list is that one row and the count line reads *1 of 2092 items · Learning*. The open panel has one more line of selects than before, five instead of four: the longest state, *Preparing for performance*, makes the select too wide to share a line. The panel is closed by default, so the list starts where it did.
- **The door: not built. The brief's "When to deviate" applies** (`probe-twinkle-*.png`, `probe-hot-cross-*.png`, `before-probe-first-page-with-project-word-342x740.png`, `scripts-fit.py` over `before-facts.json`; observed on the committed build). I put a quiet *Project* beside *Details* on every row with a `⋯`, which is what the door would add. The text column went from 164 to 95 CSS px (observed here). The four *Twinkle* rows turned into three identical *Twinkle, Twinkle, Litt…* and one *Twinkle Twinkle Littl…*. Their distinguishing endings, *(hands together)* and *(in F major)*, were cut, and *Details Project* read as one link. Of the fifteen song rows on the first page, seven one-line titles wrapped (rows 71 → 92 px observed), five two-line titles were newly cut, and three were unchanged or already cut. This is the room R2 keeps for the title, and the reason `⋯` is a glyph (`04` §4). So the row wears the state and keeps its actions; where the door goes is Question 1.
- **The badge is plain, not the Stage 9 page's `passed` kind** (a deviation, with the reason). `passed` draws a ✓, and a Stage 9 row reads *✓ Preparing for performance* (`stage9-classical-9-ballade-polishing-342x740.png`, observed). On the Library that would have read *✓ Paused* or *✓ Put away*, next to a status badge's own ✓ for a pass. The app's ✓ means *passed*, and a project state is an intention, not an achievement. Stage 9's ✓ is Follow-ups 1.
- **These are observations against the rules, not a gate.** The Library now agrees with the sheet and with Progress, and a learner looking for their pieces can list them. The filter's two new words, *Project or not* and *Your projects*, are **unverified as copy**. So is whether a learner reads a plain badge as their own word (Questions 3).

## The mechanism

**Not a fault but a missing consumer.** G1b made the store and two doors (the finish sheet, Progress). By G1b's own guard, no Library code read a project: the Library drew `progress` alone, so a piece the learner had saved, was learning, or had paused or put away looked like any other. The reviewer's ruling 3 on the G1b brief (`responses/a96395d.md`) allowed the Library to show the same state, consuming the one store.

**The brief's hypothesis, tested:** the Library can read the store once per load or change and look each row up in a map, without a visible rise in its draw. The refuting test was a visible rise in a full draw on the whole catalogue, and I ran it by timing the two builds alternately on one port, three rounds each (`draw-timing.txt`, `draw-timing-table.txt`, `timing/`). A full `draw()` is one synchronous dispatch of the Type select's change handler, and the load is navigation to the first drawn count line. After over before, the medians of the rounds (the milliseconds are this machine's, observed here) came out as:
- draw: 0.94 with no project, 0.94 with one, 1.06 with forty;
- load: 1.06, 0.96 and 1.02.

Both are inside the rounds' own spread. **It held: no visible rise.** Two single-shot picture runs earlier (`before-facts.json`, `after-facts.json`) had shown the after draw about twice the before. The alternating rounds, which put the machine's load on both builds, did not repeat that. The single shots were the machine: other builders' suites were running.

**What does grow is the index**, and it grows only when the store is read (`cost-probe.txt`: a Node probe on the built catalogue, run once and removed). With no project it costs nothing. With 1, 40 and 400 projects it costs about 2, 20 and 134 times one filter pass over 2,092 items. That is `projectIn`, the store's rule, once per song, so O(songs × projects). At forty projects the browser's load showed no difference. At hundreds it would start to show on the load, never on a filter change (Follow-ups 2).

**The change, on the mechanism** (`LibraryScreen.ts`):

1. **One read.** `readProjects()`, the one `allProjects()` call, joins `refresh`'s `Promise.all` beside the catalogue and progress, and runs again on `onProjectsChange`. A store that cannot be read gives none, as Today's read does. A read overtaken by a later one gives way to it.
2. **One index per read.** `indexProjects()` runs `projectIn(rows, { itemId, material: materialOfItem(item) })` over the songs (`isProjectable`), which is the store's own identity rule and Progress's call. The same file under another id finds the project. An import, whose row names no material, is found by its id, including a project made on the Score screen on its loaded bytes. Another id's id-only row is never taken.
3. **One lookup a row.** `rowFor` reads `projectOf.get(item.id)`: a plain badge (`data-kind="project"`, `data-project=<state>`) right after the status badge, and `data-project-state` on the row. With no project there is no badge and no attribute.
4. **The filter.** `Filters.project` (`all` · `any` · a state) is read in `matches` as `status` is, with the index handed in as a fourth argument, the way `progress` is (the brief's "When to deviate"): `matches` never reads the store. It is absent from the filters the other callers build, and absent means `all`. The select comes from the same `selectRow` as Status, and it takes part in the count line, the empty sentence, *Show everything* and the letter rail's `onMissing`.
5. **A change while the list is up** (`onProjectsChange`) waits one task, then does one read, the index and one draw. The listener is removed on dispose. Without a door on the row, nothing writes the store while the Library is mounted today. The listener is item 1's decision and serves a later door.

**Premises of the brief, checked at the lines** (`operating-procedure.md` §13). Every line number held within a few lines. Where the premise itself differed:
- *"its header on cost: about 1,533 rows, ~15 ms each on the S25"*: the header says 570 rows at about 15 ms **for all of them**, not each; the catalogue here has 2,092 items and a draw builds 60 rows. The header gained one sentence on G85's budget.
- *"the six filter doors"*: five selects and *Only mine*; Project is the seventh.
- *"Its chips wear the same shape as the status filter's"*: the status filter is a `<select>`, not chips, so Project is a select made by the same `selectRow`. The pictures of "the filter's chips" are pictures of that select row.
- *"`library.spec.ts`'s pattern at 342 × 740"*: `library.spec.ts`'s §0 block uses 360 × 780; 342 × 740 is `projects.spec.ts`'s G1d case. The new describe uses 342 × 740.
- *"PDFs (not projectable)"*: `isProjectable` is `type === 'song'`, and a PDF import's catalogue type is `song` (`importStore.ts` 1248), so the store calls a PDF projectable. No door reaches one: a PDF has no finish sheet and never passes. The Library would badge a PDF only if a project for it existed, and none can be made.
- *"the options Progress passes … `bars?`"*: moot, since the door was not built.
- *"*any project*"*: labelled *Your projects*. *Any status*, next to it, means no filter at all, and *Any project* would read the same way (`help.ts`, the comment on `filterAny`).

## Done

1. **Item 1, the badge.** Done, with the kind changed from `passed` to a plain one (the reason is above). The store is read once per load or change, `projectIn` over `materialOfItem` builds one index per read, and each row does one map lookup. Technical: done. Pedagogical: whether the plain badge reads as the learner's own word is **unverified**.
2. **Item 3, the filter.** Done: `all` by default, `any` (*Your projects*), each state in `PROJECT_TEXT.states`' words, read in `matches` as `status` is. The count line, the empty sentence, *Show everything* and the rail's `onMissing` work with it (unit cases). The three words not in `PROJECT_TEXT` were added there: the filter's name, the default, and any state.
3. **Item 4, cost.** Measured before and after on the same catalogue, alternately: no visible rise (the relationship is above). The index's growth with the project count is recorded (Follow-ups 2).
4. **Item 5, the guard.** `ui/screens/LibraryScreen.ts` joined `readers`, and `actors` is still the sheet alone. The test's title said *no … Library code reads one*, so it now says the Library shows one. The comment above it names G85. Nothing else in the guard moved.
5. **Item 6, not G85's.** None of it touched. What the Stage 9 page shows is recorded (Questions 2; the Stage 9 picture and `stage9-facts.json`): its song rows carry ▶ and *Know it*, no door to the sheet; the project badge is `passed` with a ✓; *not started* is on every other row; titles are already cut at 342 px.
6. **Item 7, unit, red first.** A new file, `libraryProjects.test.ts`, has 14 cases:
   - `matches` on constructed rows: each state, *any*, *all*, a caller with no project filter, and the project filter alongside the others;
   - the badge on a row with a project and none without, including the same file under another id, an import's project on its loaded bytes, an exercise with a row in the store, and another id's id-only row;
   - no badge anywhere without projects;
   - a store write redrawing the row while the list is up, with the row's own tap unchanged;
   - the row's actions as they were;
   - the filter's options and place, its listing and count line, its empty list and *Show everything*, a pause taking a piece out of *Learning* and into *Paused*;
   - the source reading the store once and applying `projectIn` once, with no per-row read and no project moved.

   10 of the 14 were red on the committed sources (below) and 4 were green by design; the guard was red too. Technical: done.
7. **Item 8, browser, red first, except the door.** `library.spec.ts` › *the learner's project in the Library (G85)* at 342 × 740 covers the badge, one badge on the screen, and the row's actions as they were. The Project filter set to *Learning* lists the piece alone, with the count line naming it. *Pause* on the one sheet, opened from Progress's project row, is followed by the Library's row reading *Paused* and the filter finding it under *Paused*, not *Learning*. The case was red on the committed build and is green on this tree's. `projects.spec.ts`'s G1d case is revised (Tests touched). The pictures are those above.

## Not done

1. **Item 2, the door.** The brief's "When to deviate": the row's action does not fit at 342 px beside *Details* and `⋯` (the probe, above), so the row wears the badge only, and the door is Question 1. So the Library opens no sheet and calls no `applyProjectAction`. `openProjectSheet` is not imported, and neither is the sheet's `onChange`. The browser case pauses through Progress's door instead of the row's.
2. **The whole browser suite.** The lane's config matches no pattern, so the map names the full required suites. I ran:
   - the six code paths' minimum whole: tsc, lint, the unit suite, the app build, and its eleven browser specs;
   - the fallback's converter harness, content validation, review check and content tests.

   I did not run the whole browser suite (CI's full run).
3. **The offline content build** failed twice. The first attempt ran before `npm ci`, a fault of my ordering (`content-build.log`). The second failed at validation without the fetched folders under `content/` (`content-build-2.log`, exit 1). I copied `app/public/content` from the main checkout (`copy-content.txt`: 2,092 catalogue items). The two reports the build rewrote were put back to HEAD's bytes (`restore-reports.txt`: clean).
4. **The lane's config** (`app/playwright.g85-4433.config.ts`) is kept in `app/` as told and is not for the commit. `npm run lint` fails on it alone (*not found by the project service*), and lint without it exits 0. It moves the fixture's storage-state origin to 4433; without that, the first map run failed 10 cases in `app-shell.spec.ts` and `wide.spec.ts` on the setup tour and a first-sight card (`e2e-map-min-4433.txt`), and the rerun is green (`e2e-map-min-4433-2.txt`).
5. **Mutants.** Not run, since the brief asks for none. The unit cases pin the identity, the gate to songs, the kind, the redraw and the one read.
6. **The state gallery.** The map does not name it for these paths, so not run.

## Follow-ups (recorded, not fixed)

1. **P0 (small), Stage 9's project badge draws a ✓** (`LessonScreen.ts` 270, kind `passed`). A paused or put-away project would read *✓ Paused* or *✓ Put away*, and ✓ is the app's mark for a pass (`04` §9: state not by colour alone, so the mark carries the meaning). It is one word in `LessonScreen.ts`, which is not G85's. `stage9ProjectsPage.test.ts` and `projects.spec.ts`'s Stage 9 case read the text, not the kind.
2. **P3, the index is O(songs × projects).** It is `projectIn` per song, the store's rule, so nothing can differ from it. Tens of projects are invisible and hundreds would show on the load. Keying the rows by `materialKey` would make it one pass, but it has to stay the store's rule (a helper in `projectStore.ts`, not a second rule here).
3. **P3, a composer shown as "NA".** *Twinkle Twinkle Little Star (Easy)* (`probe-twinkle-*.png`) shows it, a catalogue field printed as it stands. This is content's.
4. **P3, *Know it* on the Stage 9 rows.** The rows offer the self-pass on a page that says *there is no rung to pass here* (the Stage 9 picture). This is `LessonScreen`'s.
5. **P3, a lane on another port.** It needs the storage state's origin moved (Not done 4). A lane config that lands would need this, a `tsconfig.node.json` include and a map pattern.
6. **P3, a passed piece with a project in a long state stands at two badge lines** (121 px observed at 342 × 740, over R2's 96; the Judgement). If the eye says no, the options are: the project badge in place of the status badge on a project's row, which changes what the row says; or shorter badge words for the long states, which would be a second name beside the sheet's. Either is a product choice, so it is left as built.

## Questions

1. **Where does the Library's door to the project sheet go?** A word on the row costs the title about two fifths of its width at 342 px. The options:
   - (a) **The Details sheet** (my recommendation): the row already has *Details*; the sheet is the piece's facts; the project state and *What next with this piece?* (the finish sheet's words) would sit under them, one more tap and no width. The sheet closes and the project sheet opens, and `onProjectsChange` redraws the row.
   - (b) **A boxed glyph** beside `⋯` (40 px). No sign in the app means *project*, and an unexplained glyph is a guess.
   - (c) **A row in the `⋯` sheet**, whose title says *Open … as…*, which is a different question.
   - (d) **The badge as the door** on rows with a project. That hides the affordance, and it leaves the rows without a project, where *Save for later* starts, with no door.

   Each is a Library UI choice; the brief named the door as a question.
2. **Stage 9's rows opening the sheet** (item 6's "possibly"). What I saw is in Done 5. The same width problem applies: ▶ and *Know it* already cut the titles there.
3. **The filter's words.** *Project or not* for the default, and *Your projects* for any state, not *Any project* (the reason is above). These are unverified as copy.

## Red lines (`runs/G85/red/`)

- `red-vitest-final-tests-committed-code.txt`: the final `libraryProjects.test.ts` and the revised `projectLifecycle.test.ts` on the committed `LibraryScreen.ts` and `help.ts`, which `scripts-red-on-committed.py` swaps in and puts back by sha256 (*restored: True*). 10 of 14 new cases were red: *each state lists the piece…*, *any project…*, *a caller that sets no project filter…* (a project filter with no projects listed everything), the badge case, the redraw case, the four filter cases and the source case. The guard was red too: *expected [ 'curriculum/session.ts', …(7) ] to deeply equal [ …(8) ]*. The 4 green by design are *all lists everything*, *the project filter narrows alongside the others*, *no projects, no badge*, and the row-actions case, which pins what did not change.
- `red-e2e-committed-app.txt`: the committed build. The G85 case: *expect(locator).toHaveText("Learning") … element(s) not found*. The revised G1d case: *- "libraryProject": "Paused" + "libraryProject": ""*.
- `red-vitest-committed-code-first-draft.txt` and `red-e2e-committed-app-first-draft.txt` are the first drafts' reds, with the door's cases before the probe; they are kept because the drafts were run.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `app/tests/unit/libraryProjects.test.ts` (new) | add | — | items 1, 3, 4, 7 on constructed rows and a mounted Library |
| `app/tests/unit/projectLifecycle.test.ts` › *only the project sheet acts; … the Library shows one (G85) …* | revise | no Library code reads a project | `ui/screens/LibraryScreen.ts` among the readers; `actors` the sheet alone (item 5) |
| `app/tests/e2e/library.spec.ts` › *the learner's project in the Library (G85)* | add | — | item 8 at 342 × 740, the pause on Progress's sheet |
| `app/tests/e2e/projects.spec.ts` › *…paused on its sheet… (G1d)* | revise | the Library row's whole text unchanged by a pause (written when the Library read no project) | the row's text without its project badge unchanged; the badge empty before, *Paused* after |
| the Library's other unit files, the 312 unit files, the map's eleven specs | preserve | — | green (below) |

## Exit codes (each capture ends with its exit)

| Run | Exit | What it said |
| --- | --- | --- |
| parity reference (`parity.log`) | 0 | five reference files; the three real MIDI files skipped, not fetched |
| `build.py --offline` (`content-build.log`; `content-build-2.log`) | 1; 1 | before `npm ci` (my ordering); then validation without the fetched folders (Not done 3) |
| `npm ci` (`npm-ci.log`) | 0 | — |
| reports restored (`restore-reports.txt`); `app/public/content` copied (`copy-content.txt`) | 0; 0 | clean; 2,092 items |
| committed code's app, `vite build --outDir build/g85/dist-head` (`build-app-head.txt`) | 0 | before any source change |
| vitest, the final tests on the committed sources (`red/red-vitest-final-tests-committed-code.txt`) | 1 | the red above |
| Playwright 4433, one worker, the two cases on the committed build (`red/red-e2e-committed-app.txt`) | 1 | the red above |
| vitest, the two files after the change (`green-final.txt`) | **0** | 46 tests |
| `npx tsc -b` (`tsc.txt`) | **0** | — |
| `npm run lint` (`lint.txt`); without the lane config (`lint-without-lane-config.txt`) | 1; **0** | the config's parse error alone |
| vitest, the eleven Library and project files (`vitest-targeted.txt`) | 1 | 423 tests, 2 failed: the recorded `lessonClaimsAboutApp` pair (*blues.3*, *4.7*; CRLF, Entry 101's diagnosis, files G85 does not touch) |
| `npm run build:app` (`build-app.txt`; after the badge's kind, `build-app-2.txt`) | 0; **0** | — |
| Playwright 4433, two workers, the map's eleven specs (`e2e-map-min-4433.txt`; `e2e-map-min-4433-2.txt`) | 1; **0** | 103 passed, 10 failed on the lane's storage-state origin (Not done 4); then **113 passed**, every spec checked present first |
| pictures, committed build and this tree's (`pictures-before.txt`, `pictures-after-2.txt`; the probe `pictures-probe.txt`; Stage 9 `pictures-stage9.txt`; two badges `pictures-two-badges.txt`); copied (`copy-pictures.txt`) | 0, 0, 0, 0, 0; 0 | — |
| draw timing, alternating builds, three rounds (`draw-timing.txt`; `draw-timing-table.txt`) | 0 ×6; 0 | the ratios above |
| cost probe (`cost-probe.txt`) | 1 by design | it reports by failing; the ratios above |
| vitest, the whole suite (`vitest-full.txt`; after the badge's kind, `vitest-full-2.txt`) | 1; 1 | first run: 313 files; 7,167 passed, 6 failed (the recorded pair; `expectedNote`'s sweep, a five-second timeout; three `libraryImportWords` cases in a 1 s `waitFor`). Second run, the machine loaded by other builders' suites (vitest's own per-worker start figure, observed here, rose to about two and a half times the first run's): 23 failed across 11 files, 12 of them timeouts, and five workers crashed (exit 134, one 0xC0000409, one that could not load jsdom) |
| reruns alone (`vitest-timeouts-rerun-2.txt`; `vitest-full-2-failed-files-rerun.txt`; `vitest-full-2-not-started-rerun.txt`) | **0**; 1; **0** | the four files green; the eleven failed files green but for the recorded pair; the five crashed files green |
| A/B, `libraryImportWords.test.ts` on this tree's and the committed sources, alternately (`ab-libraryImportWords.txt`) | 0 ×6 | 8 of 8 on both, three rounds each: the suite's failures there are load, not G85 |
| `checks_for_paths.py`, the seven changed paths (`checks-for-paths.txt`); the six code and test paths (`checks-for-paths-code-only.txt`) | 0; 0 | 6 matched and the lane config unmatched (the full required suites); the six: tsc, lint, unit, build-app, eleven specs |
| the fallback's converter harness, content validation, review check (`fallback-*.txt`) | 0, 0, 0 | — |
| the fallback's content tests (`fallback-content-tests.txt`) | 1 | 1,445 tests, 6 failures: five on the fetched kern edition this worktree lacks, one on the review queue read from the copied content (Entry 142 recorded the same six); no content or tools file changed |

**Unverified**, beside what passes:
- the plain badge and the two filter words as a learner reads them (Questions 3);
- the door (Question 1);
- other widths: only 342 × 740 pictured, and the map's `wide.spec.ts` and `landscape.spec.ts` are green on the Library at theirs;
- a real learner's many projects: at most forty seeded;
- the whole browser suite;
- **CI has not run this tree.**

## Files

In the worktree `agent-af48d71ff71bb2248`, cut from 4dc2f135. Nothing committed, nothing staged.

- Changed:
  - `app/src/ui/screens/LibraryScreen.ts`: the header, the imports, `Filters.project`, `projectBadge`, `matches`, the screen's projects state and index, the Project select, the badge and `data-project-state` in `rowFor`, the rail's and the draw's `matches`, the count line, `clearFilters`, `readProjects`/`indexProjects`/`projectsChanged`, `refresh`, the listener and its disposal;
  - `app/src/ui/help.ts`: three words in `PROJECT_TEXT`;
  - `app/tests/unit/projectLifecycle.test.ts`: the readers list, the test's title and the comment above it;
  - `app/tests/e2e/library.spec.ts`: the G85 describe;
  - `app/tests/e2e/projects.spec.ts`: the header line, `shownElsewhere`, the G1d case's last assertion.
- New:
  - `app/tests/unit/libraryProjects.test.ts`;
  - `app/playwright.g85-4433.config.ts` (the lane, not for the commit; Not done 4).
- Not touched: `projectSheet.ts`, `projectStore.ts`, `LessonScreen.ts`, `session.ts`, `TodayScreen.ts`, `SkillsScreen.ts`, `style.css`, `tools/content/`, `content/`, the docs. No `style.css` rule was needed: the badge and select classes serve.
- Beside this entry:
  - `runs/G85/` holds the captures above, `red/`, `timing/`, and the scripts as they ran: `scripts-chain.cmd`, `scripts-chain-2.cmd`, `scripts-chain-3.cmd`, `scripts-red-on-committed.py`, `scripts-ab.py`, `scripts-fit.py`, `scripts-timing-table.py`, `scripts-copy-pictures.py`, `scripts-sanitise.py`, and the specs `scripts-zz-g85-pictures.spec.ts`, `scripts-zz-g85-draw-timing.spec.ts`, `scripts-zz-g85-probe.spec.ts`, `scripts-zz-g85-stage9.spec.ts`, `scripts-zz-g85-two-badges.spec.ts` and `scripts-zz-g85-cost-probe.test.ts`. Each spec was copied into `app/tests/` for its runs and removed. In the captures, machine paths are replaced by `<worktree>`, `<main checkout>`, `<temp>` and `<home>`.
  - `pictures/g85/` holds the row before and after, the screens, the filter row, the probe, the two-badge row, the Stage 9 page, and the facts files.

**Orchestrator's note at the landing (2026-09-29).** G85's worktree committed by name (ba4c6fea) and merged (760b8f61). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/G85/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 1; vitest-timeouts-rerun 0; e2e-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; the other failures were load and pass alone (`vitest-timeouts-rerun`) — the targeted specs' failures passed alone (`e2e-rerun`); the note names them; `runs/G85/orchestrator-exit.txt`). Your ruling 3 on the G1b brief (`responses/a96395d.md`): the Library may expose the same project state and open the same sheet, consuming the one store. Landed in one chain with U96 under the batching conditions the reviewer set (`responses/questions-b11e4f89.md`): the map's minimum over the union of both merges' paths (b11e4f89 to ee481854), the sixteen specs it named run once for both. Attribution of the reds: the unit timeout (`expectedNote`, 5 s under load) and the one browser failure (`wide.spec.ts`'s sparse-bar case, a score page load that timed out) are in files neither seam touches, and both passed alone (`vitest-timeouts-rerun`, `e2e-rerun`); the 204 other specs passed in the chain. The Library's door is not built (G91, with you).

## Doc rows

**`docs/04-ui-spec.md` §4, the §0 paragraph (about line 1435)**: "The six filters live behind a **Filter ▾** chip" becomes "The seven filters live behind a **Filter ▾** chip".

**`docs/04-ui-spec.md` §4, the *Search + filters* bullet (about line 1500)**: after "concept tag, status," insert "the learner's project (G85: *Project or not*, *Your projects*, each state in the project sheet's words),".

**`docs/04-ui-spec.md` §4, a paragraph after *The letter rail* (about line 1498)**:

> **The learner's project on a row (G85, 2026-09-29; the reviewer's ruling 3 on the G1b brief).** A song row whose project exists wears one badge in the project sheet's words (*Saved for later*, *Learning*, … *Put away*) beside its status badge; a row with no project wears none — exploring is the absence of a project, and *not started* on fifteen hundred rows would say nothing. The badge is plain, not a pass's ✓: the state is what the learner intends, not something achieved. The Library reads the projects store once with the catalogue and again when a project changes, finds each song's project by the store's own rule (`projectIn` over the row's material: the same file under another id, an import by its id), and a draw looks each row up in that index. The **Project** filter, beside Status, offers *Project or not* (the default), *Your projects* (any state) and each state; the count line names it and *Show everything* clears it. The Library moves no project: the project sheet is the one actor, reached from the finish sheet and from Progress. A door to the sheet on the row was tried and not built: a word beside *Details* and `⋯` took about two fifths of a song title's width at 342 px — one-line titles wrapped, two-line titles lost the words that tell them apart — the room R2 keeps for the title; where the Library's door goes is open (Entry 147, question 1).

**Beyond §4, for the same splice** (the record the change makes stale):

- `docs/01-architecture.md`, the `projects` row (about line 266): after "written only by the project sheet;" insert "read by the Library (G85: a song row's badge and the Project filter, one read per load or change, indexed by `projectIn`);".
- `docs/08-test-map.md`, the state-machine row *The learner's projects*:
  - the owners gain "the Library's badge and Project filter (G85)";
  - the faults gain "a Library row showing another piece's project, a non-song's, or a *not started*; a project badge that says a pass (✓); the filter listing a piece without the state, or reading the store per row (G85)";
  - the tests gain "`libraryProjects.test.ts`, `library.spec.ts` › *the learner's project in the Library (G85)* (added); `projectLifecycle.test.ts` and `projects.spec.ts`'s G1d case (revised, G85: the Library a reader) — red on the committed code";
  - the status gains "the Library shows the state and filters by it (G85, Entry 147); its door to the sheet a question".
- `docs/08-test-map.md`, the file lists:
  - `library.spec.ts` gains "; a piece's project as a badge, the Project filter listing it, a pause on its sheet reaching the row (G85)";
  - `projects.spec.ts`'s G1d clause gains "the Library's row wearing *Paused* (G85)";
  - `projectLifecycle.test.ts` gains "; the Library a reader (G85)";
  - a new line: "`libraryProjects.test.ts` — the Library and the learner's projects (G85): `matches` with the Project filter on constructed rows; the badge by the store's identity rule, none without a project or on a non-song; a store write redrawing the row; the row's actions as they were; the filter's options, count line, empty list and *Show everything*; one read of the store and one `projectIn`."
- `docs/prompts/backlog-2026-09-25.md`, G1b's not-done 1 and follow-up 4 (the Library door): "built in part (G85, Entry 147): the Library shows the state and filters by it; the door on the row did not fit at 342 px and is a question".
