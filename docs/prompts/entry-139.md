### Entry 139 — G1c — Plan stops presenting Stage 9 as rungs to pass: the stage line says the page's sentence and counts nothing, no bar, no *complete* on the stage or its rows; one `PROJECT_STAGES` constant, the session importing the store's (G83, P1; G84) (2026-09-29)

**Judgement.** Nothing was heard, and G1c claims nothing about music. What I looked at: the app built from this tree and from the committed code (03ee5146) on port 4413, at 342 × 740, with the evidence meeting `classical.9` (a Stage 9 rung) and `technique.8` (a Stage 8 one) through runs judged by each rung, the default tracks on (`pictures/g1c/`, the words and the Stage 8 block's HTML in `before-facts.json` and `after-facts.json`); the code.

- **Plan's Stage 9 block, before** (`before-stage9-342x740.png`, observed): *Stage 9 · Projects* / **1 of 3 lessons · open-ended** over a bar a third filled; under the stage's own words (*…Nothing here is a rung to pass; they are pieces to live with.*) the Classical row *Choosing one piece and staying with it* wore **✓ complete**. The page that row opens says *A project: there is no rung to pass here.* — Plan and the page contradicted each other, one tap apart.
- **After** (`after-stage9-342x740.png`, observed): *Stage 9 · Projects* / **A project: there is no rung to pass here.** — no count, no bar, no badge; the same summary; the three rows (Classical, Chords & pop, Theory & ear) with their cost lines as before (*6 exercises · 6 songs · ~365 days*) and no badge. The rung state is still `met` in the evidence (the unit case reads it), and Plan presents none of it.
- **Beside it, one other stage unchanged** (`before-stage8-342x740.png`, `after-stage8-342x740.png`, observed): *Stage 8 · Advanced* / *1 of 4 lessons · 12-18 months*, its bar a quarter filled, *Four octaves in sixteenths…* wearing *✓ complete* — the two pictures alike, and the block's HTML byte-equal before and after (`compare-facts.txt`). The closed stage list (`before-/after-stage-lines-342x740.png`): Stages 1–8 each read *n of m lessons · duration* over a bar, as before; Stage 9 now reads the sentence and has no bar under it, its row the same height as before (the facts compare the two heights; the bar is drawn over the row's bottom edge and costs it nothing).
- **As observations against the rules, never a gate.** The line is the page's own sentence (`PROJECT_TEXT.stageNine`), so the stage row and the page it leads to say one thing in one set of words. Two things a teacher reading the screen might note: the singular *A project:* sits under the plural heading *Projects* (the page's sentence reused verbatim, not a new phrase of Plan's — Questions 1); and the rows still show the curriculum's estimate (*~365 days*), which is a duration, not a pass. Whether this sentence serves a learner better than another is **unverified as pedagogy**.
- **Adjacent, read in the code, not G1c's:** *Next up* can name a Stage 9 unit once every earlier rung on the tracks switched on is met or set aside (`nextRecommended` walks Stage 9), and the status line says *Every lesson is complete.* only when Stage 9's rungs are met in the evidence too (Follow-ups 3). Neither was on screen in this state.

## The mechanism

**The fault.** Plan drew every stage the same way: `completion()` counted each unit's rung state (`met`, the learner's word, the carry-over), the stage line printed it through `stageCountWords`, the bar drew it, the stage wore *complete* when every rung was met, and `lessonRow` gave each row `rungBadge(state)`. G1b made the Stage 9 page read `projectStore.PROJECT_STAGES` and stop presenting the requirements; Plan never read that fact, so it presented Stage 9's `runs` requirements — still in the data and still read by `rungState`, by G1b's ruling — as rungs met.

**The brief's hypothesis, tested:** Plan's claim comes only from its own presentation of the rung state, and no consumer needs Stage 9's count (the refuting test: a reader of Plan's Stage 9 line or its count). Searched: `tests/e2e` for the stage rows' selectors (`plan.spec.ts` reads Stages 0, 2 and 4; `plan.hierarchy.spec.ts` and `empty-states.spec.ts` Stage 5 and 0; `wide.spec.ts` Stage 0 as its proof), the unit tests that mount Plan (`planHierarchy`, `planStageChevron`, `planTracks*`, `legacyStorage`: Stages 1–2 or row counts), `app/src` for `stageCountWords`, `plan-stage-bar` and `data-stage` outside `PlanScreen.ts` (none), and Today's stage sentence (*Working on Stage n · …*, from `nextRecommended`, not from Plan's count). **It held:** nothing reads Stage 9's count; the "When to deviate" stop did not arise.

**The discriminating test.** The unit case meets a Stage 9 rung in the evidence and shows `rungState` saying `met` while Plan, on the committed code, says *1 of 4 lessons · open-ended*, draws the bar and badges the row *complete* (`red/red-vitest-plan-committed-code.txt`); the browser case on the committed build reads Stage 9's line as *1 of 3 lessons · open-ended* (`red/red-e2e-plan-committed-app.txt`). After the change the same cases read the sentence, no bar, no badge — the claim moved with the presentation alone, `rungState.ts` untouched.

**The change, on the mechanism** (`PlanScreen.ts`): `isProjectStage(stage)` reads `projectStore.PROJECT_STAGES`, the page's constant. For a project stage the stage line is `PROJECT_TEXT.stageNine` (no *x of y*, *by your word* or *done before*), no bar is drawn and no *complete* worn; each row is drawn with `project: true` and wears no badge; and the legend over the list counts carried rungs only in stages that draw a bar, so rungs carried in Stage 9 alone no longer name a fill no stage draws. Every other stage takes the same code path as before.

**Two premises of the brief, corrected at the lines** (`operating-procedure.md` §13):

1. *"`docs/02-curriculum.md` at Stage 9 ('Nothing here is a rung to pass; they are pieces to live with')"* — `docs/02` holds no such line (its Stage 9 is a table row, *Open repertoire & specialisation · Learner-chosen projects*, line 162); the sentence is the curriculum data's own, `content/curriculum/stage-9.json`'s `summary`, which Plan already prints under the open stage. So the line is in `PROJECT_TEXT`'s words (the brief's other allowed source), not the summary's — the summary's words on the row would be the same sentence twice, one line apart (`00` D26).
2. *Item 1's readers "behave exactly as before; `parallelStrands.test.ts`'s Stage 9 cases stay green untouched"* — true (green, untouched), but the brief did not name the third consumer: G1b's one-reader walk in `projectLifecycle.test.ts` named every file importing `projectStore` a reader of projects, and went red the moment `session.ts` imported the constant (`red/red-vitest-guard-after-session-import.txt`: *curriculum/session.ts* among the readers). The walk now tells an import of `PROJECT_STAGES` alone from a read of the store and pins both lists: the six readers as before, and `curriculum/session.ts` and `ui/screens/PlanScreen.ts` as importers of the stage numbers only. A mutant that makes `session.ts` import `allProjects` beside the constant is caught (below), so the guard still holds G1b's ruling that no session code reads a project. Questions 2 asks the reviewer to confirm the revision.

## Done

1. **Item 1, one constant** — `session.ts`'s own `PROJECT_STAGES` and its comment removed; `import { PROJECT_STAGES } from '../data/projectStore'`, with the comment beside the import. Its two readers (lines 635 and 874 now) unchanged; `parallelStrands.test.ts` green untouched, `session.test.ts` green. The source walk in `planProjectStage.test.ts` holds that only `data/projectStore.ts` declares it and that the session, Plan and the lesson page import it. Technical: done.
2. **Item 2, the stage line** — for a stage in `PROJECT_STAGES`: `PROJECT_TEXT.stageNine`, no count, no bar, no *complete*. The duration (*open-ended*) is not on the line: the detail line keeps 42 characters (`fitDetail`) and the sentence takes 41, and the summary under the open stage says *for as long as it takes*. Every other stage's line, bar and badges are the committed code's: the unit case (a Stage 8 with a met rung, a whole stage met, the learner's word, a carried rung) green before and after; the browser case's Stage 8 line; the Stage 8 block's HTML byte-equal in the pictures. Technical: done. Pedagogical: **unverified as pedagogy** (Questions 1).
3. **Item 3, the rows** — no evidence badge, word or carry-over on a project stage's row. **What the row is, from the data:** each Stage 9 unit is one rung listing several pieces — `stage-9.json`'s seven units list 6, 6, 3, 6, 0, 0 and 4 songs — so one row cannot wear their several project states; it wears nothing, and the page it opens shows each piece's (G1b). Technical: done.
4. **Item 4, nothing else moves** — `rungState.ts`, the evidence, `LessonScreen.ts`, `projectStore.ts`, `help.ts` and every other stage's badges not touched; the session changed at the import alone. The rung state for Stage 9 units still exists (the unit cases read `met`, `in progress`, the word and the carry-over for them).
5. **Item 5, red first** — the unit cases and the browser case, each red on the committed code at the claim the brief names (the red lines below), green after.
6. **Item 6** — none of the Stage 9 page, the project sheet, the Library, Progress or the *Start* line was opened for change.

## Not done

1. **The docs are rows, not edits** (the brief) — `

**Orchestrator's note at the landing (2026-09-29).** G1c's worktree committed by name (77b1027f) and merged (70730cdd). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/G1c/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/G1c/orchestrator-exit.txt`). G1b's follow-up 1 (P1), built as briefed. The map's twelve specs and the session, Today and transfer readers ran here at four workers: 105 passed, none red; the merge was clean. The builder corrected two of the brief's premises at the lines (docs/02 has no *no rung to pass* line — the sentence is stage-9.json's summary, so the line uses PROJECT_TEXT's words; and G1b's one-reader guard was a third consumer of the constant, revised to list importers of the stage numbers apart, with a mutant guarding the session against reading the store). The two questions (the stage line's singular sentence, U99; the revised guard) are in the handoff. Nothing heard; the sentence unverified as pedagogy, in the builder's words.

## Doc rows` below.
2. **The state gallery** (`playwright.states.config.ts`) was not run: it drives the Score screen, not Plan (the map names it for none of the changed paths).
3. **Browser specs beyond the fifteen run** — the map's minimum for these paths is twelve specs; all twelve ran, with `empty-states`, `projects` and `wide` (the other readers of Plan's stage rows and of Stage 9's page). CI's full run holds the rest.

## Follow-ups (recorded, not fixed)

1. **P3 — `projectStore.ts`'s comment on `PROJECT_STAGES`** still says "`session.ts` keeps its own `PROJECT_STAGES` … the two should be one constant when X1 next holds `session.ts`" — now stale; not G1c's file.
2. **P3 — `help.ts`'s comment on `PROJECT_TEXT.stageNine`** says "Stage 9's page, in place of *What the app counts*"; Plan's stage line reads it too now. Comment only; `help.ts` was G1c's only for a missing sentence.
3. **P3 — Plan's status line and *Next up* near Stage 9.** `nextRecommended` walks Stage 9 like any stage, so once every earlier rung on the tracks switched on is met or set aside, *Next up · Stage 9 · Classical* names a project as the next thing (no rung word in it, and a project is a sensible next thing — recorded, not judged a fault), and *Every lesson is complete.* appears only when Stage 9's rungs are met in the evidence as well — a completion sentence that still reads Stage 9's rung state. Session's and Plan's status; left as they were (item 4); **unverified on screen** (the state was not constructed).
4. **P3 — `session-run.spec.ts` writes its pictures into the tracked `docs/prompts/pictures/x1/` on every run**, so any lane running the map's minimum for `session.ts` rewrites five tracked PNGs; this run's five were put back to HEAD's bytes (`restore-x1-pictures.txt`). The spec's output belongs outside the tree or behind a flag.

## Questions

1. **The stage line's words.** *A project: there is no rung to pass here.* — the page's sentence verbatim, under the heading *Stage 9 · Projects*. The singular reads a little oddly over a stage of seven projects; the alternatives the brief allows are the curriculum's own summary (already printed under the open stage, so the row would repeat it) or a new `PROJECT_TEXT` sentence for the stage (a new phrase — the brief says not Plan's own, and `help.ts` was G1c's only if `PROJECT_TEXT` lacked one). My choice: one sentence in one place. A plural wording would be one new `PROJECT_TEXT` entry.
2. **The revised guard** in `projectLifecycle.test.ts` (G1b's). Item 1 made it red by design of its regex; the revision separates "imports the stage numbers" from "reads the store" and pins both lists. Does the reviewer accept it as keeping ruling 4's "no session code reads a project"?

## Red lines (`runs/G1c/red/`)

- `red-vitest-plan-committed-code.txt` — `planProjectStage.test.ts` on the committed `PlanScreen.ts` and `session.ts`: 5 of 6 red — *expected '1 of 4 lessons · open-ended' to be 'A project: there is no rung to pass h…'*; *the project stage draws a completion bar*; *the met Stage 9 rung wears the evidence's word: expected [ 'complete' ]*; the whole stage *expected [ 'complete' ] to deeply equal []*; *a legend for a fill no stage draws*; the one-constant walk *expected [ 'curriculum/session.ts', … ] to deeply equal [ 'data/projectStore.ts' ]*. The sixth, every other stage as it was, green on both sides by design. (That capture is of the file as first written; its hoisted state was rewritten for lint afterwards.)
- `red-vitest-final-tests-head-sources.txt` — the final tests over HEAD's `PlanScreen.ts` and `session.ts` (this tree's two files written back by their bytes after, sha256 checked; `scripts-final_tests_head_sources.py`): the same five of six red; the revised guard red (*expected [] to deeply equal [ 'curriculum/session.ts', 'ui/screens/PlanScreen.ts' ]* — nothing imports the constant alone there); `lessonClaimsAboutApp`'s two reds, identical to this tree's.
- `red-e2e-plan-committed-app.txt` — the browser case against the committed code's build at 342 × 740: Stage 8's line passed (*1 of … lessons*), then *Expected: "A project: there is no rung to pass here." Received: "1 of 3 lessons · open-ended"*.
- `red-vitest-guard-after-session-import.txt` — `session.ts` importing the constant, before the guard's revision: `projectLifecycle` › *only the project sheet acts…* red, *curriculum/session.ts* among the readers; `parallelStrands.test.ts` green in the same run (1 of 44 red).
- `mutants.txt` — 8 mutants (`scripts-mutants.py`, each file restored by sha256), 8 caught: the row's badge back, the stage line counting, the stage wearing *complete*, the bar drawn, the legend counting Stage 9's carried rungs, no stage a project, `session.ts` declaring its own constant again, `session.ts` importing `allProjects` beside it.
- `probe-seed.txt` — not a red: the first browser red failed on Stage 8's line (*0 of 4 lessons*) because the seed wrote one run per requirement and the built `technique.8` asks for two exercises (*What the app counts — 0 of 1 … (1 of 2)*); the seed now writes as many runs as each requirement counts (`scripts-fix_seed.py`) and the red was taken again at the intended line.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `app/tests/unit/planProjectStage.test.ts` | add | — | Plan's Stage 9 with a rung met, in progress, marked done and carried: the line the page's sentence, no count, bar or badge, no row badge; the evidence alone meeting one rung (soft, the brief's red); every Stage 9 rung met, no *complete*; every other stage's line, bar and badges as before; the legend only for fills drawn; one `PROJECT_STAGES` |
| `app/tests/e2e/plan.spec.ts` › *Plan: a project stage counts nothing (G1c)* | add | — | the brief's browser case at 342 × 740: Stage 9's line, bar and rows; Stage 8's line, bar and *complete* |
| `app/tests/unit/projectLifecycle.test.ts` › *only the project sheet acts…* | revise | every file importing `projectStore` reads projects | an import of `PROJECT_STAGES` alone is the stage numbers, listed apart (`session.ts`, `PlanScreen.ts`); the six readers unchanged (G1c item 1) |
| `parallelStrands.test.ts`, `session.test.ts`, `planHierarchy.test.ts`, `planStageChevron.test.ts`, `planTracksGrouped.test.ts`, `planTracksSheet.test.ts`, `legacyStorage.test.ts`, `stage9ProjectsPage.test.ts`, `placementStartsThePlan.test.ts` | preserve | — | green |
| `plan.spec.ts` (the rest), `plan.hierarchy.spec.ts`, and the map's other ten specs with `empty-states`, `projects`, `wide` | preserve | — | green on port 4413 |

## Exit codes (each capture ends with its exit)

| Run | Exit | What it said |
| --- | --- | --- |
| `npm ci` (`npm-ci.log`) | 0 | installed (no junction) |
| copies from the main checkout, read only (`copy.txt`); parity reference (`parity.log`) | 0 each; 0 | the three build caches and four folders without `.git`; eight reference files |
| `build.py --offline` (`content-build.log`) | 0 | 2,090 catalogue items, validation OK; `SOURCES.md`, `inventory.md`, `rung-claims.md` put back to HEAD's bytes (`restore-reports.txt`: clean) |
| vitest, the new file on the committed code (`red/red-vitest-plan-committed-code.txt`) | 1 | the red above |
| committed code's app, `vite build --outDir <scratchpad>/dist-head` (`build-app-head.txt`) | 0 | before any source change |
| Playwright 4413, the new case on the committed build (`red/red-e2e-plan-committed-app.txt`) | 1 | the red above |
| Playwright 4413, the seed probe on the committed build (`probe-seed.txt`) | 0 | the seed's mechanism |
| pictures on the committed build (`pictures-before.txt`) | 0 | — |
| vitest, `projectLifecycle` and `parallelStrands` after the import, before the revision (`red/red-vitest-guard-after-session-import.txt`) | 1 | the guard's red; `parallelStrands` green |
| vitest, eleven Plan and session files (`green-plan-session.txt`) | **0** | 11 files, 124 tests |
| `npx tsc -b` (`tsc.txt`, `tsc-final.txt`) | **0**, **0** | — |
| `npm run build:app` (`build-app.txt`, no preview running) | **0** | — |
| Playwright 4413, two workers, `plan.spec.ts` and `plan.hierarchy.spec.ts` (`e2e-plan-4413.txt`) | **0** | 32 passed |
| pictures on the changed build (`pictures-after.txt`); the facts compared (`compare-facts.txt`) | 0; **0** | Stage 8's block byte-equal |
| Playwright 4413, two workers, thirteen specs — the map's other ten with `empty-states`, `projects`, `wide` (`e2e-readers-4413.txt`) | **0** | 100 passed; every spec file checked present first |
| mutants (`mutants.txt`) | harness 0 | 8 of 8 caught |
| `npm run lint` (`lint-1.txt`, `lint-final.txt`) | 1, **0** | first: a needless type assertion in the new test's hoisted state, rewritten; after the lane's Playwright config left `app/` |
| vitest, the final tests over HEAD's `PlanScreen.ts` and `session.ts` (`red/red-vitest-final-tests-head-sources.txt`) | 1 | 8 of 322 red: the five Plan cases, the revised guard, the two `lessonClaimsAboutApp` cases; this tree's files restored by sha256 |
| vitest, the whole suite (`vitest-full.txt`) | 1 | 312 files; 7,181 passed, 2 failed, 5 skipped, 1 todo — the two recorded `lessonClaimsAboutApp` reds (*blues.3 … Rhythm only* and *4.7: blind hides the score…*, which search `ScoreScreen.ts` and `style.css` for a literal `\n` in this CRLF checkout, Entry 101's diagnosis), red identically over HEAD's two sources (`red/red-vitest-final-tests-head-sources.txt`) |
| `checks_for_paths.py` on the changed paths (`checks-for-paths.txt`) | 0 | 11 paths, 11 matched, 0 unmatched; tsc, lint, the unit suite, the app build, and twelve browser specs (all twelve run above) |

**Unverified**, beside what passes: the sentence as pedagogy; *Next up* and the status line in a state reaching Stage 9 (Follow-ups 3, not constructed); Plan at other widths (only 342 × 740 was pictured; the line is one of the detail line's existing 42-character strings, which every width already lays out); a real learner's rows (the evidence is two seeded runs per rung); every browser spec the map does not name; **CI has not run this tree.**

## Files

In the worktree `agent-aa6c4ea58e9e550ea`, cut from 03ee5146; nothing committed, nothing staged.

- New: `app/tests/unit/planProjectStage.test.ts`.
- Changed, in the brief's list: `app/src/ui/screens/PlanScreen.ts` (`isProjectStage`, the stage line, the bar, the stage badge, the row badge, the legend), `app/src/curriculum/session.ts` (the import, the constant removed), `app/tests/e2e/plan.spec.ts` (the case, appended by `scripts-append_plan_spec.py`, CRLF kept).
- Changed, outside the list, and why: `app/tests/unit/projectLifecycle.test.ts` (the guard's walk, forced by item 1; Questions 2).
- Not touched: `LessonScreen.ts`, `projectStore.ts`, `rungState.ts`, `help.ts`, `tools/content/`, `content/`, `docs/prompts/checks.json` (every changed path matched).
- Run through and put back to HEAD's bytes, so not changed: `content/scores/imported/SOURCES.md`, `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md` (the offline build), `docs/prompts/pictures/x1/` five PNGs (`session-run.spec.ts`).
- Beside this entry: `runs/G1c/` (`red/`, the captures above, and the scripts as they ran: `scripts-setup.sh`, `scripts-vitest.sh`, `scripts-build_app.sh`, `scripts-playwright.sh`, `scripts-playwright.g1c-4413.config.ts` (run as `app/playwright.g1c-4413.config.ts`, moved here after the runs so lint does not parse a config no tsconfig includes, as G1b did), `scripts-append_plan_spec.py`, `scripts-add_soft_case.py`, `scripts-fix_seed.py`, `scripts-fix_seed_comments.py`, `scripts-apply_source.py`, `scripts-revise_guard.py`, `scripts-mutants.py`, `scripts-compare_facts.py`, `scripts-restore_reports.py`, `scripts-restore_x1_pictures.py`, `scripts-final_tests_head_sources.py`, `scripts-fill_entry.py`, `scripts-entry_rows.py`, `scripts-sanitise.py`, `scripts-zz-g1c-pictures.spec.ts`, `scripts-zz-g1c-probe.spec.ts` (the two specs copied into `app/tests/e2e/` for their runs and removed); captures' machine paths replaced by `<worktree>`, `<main checkout>`, `<scratchpad>`, `<home>`, U74's rule) and `pictures/g1c/` (`before-` and `after-` `stage9`, `stage8` and `stage-lines` at 342 × 740, and the two facts files).

## Doc rows

**`docs/04-ui-spec.md` §3, the first bullet** — "Stage list (0–9) with completion rings; expand → units → lessons." becomes:

> - Stage list (0–9) with completion rings — none on Stage 9, a project stage, whose line says what it is (§3f) — expand → units → lessons.

**`docs/04-ui-spec.md` §3f, after the "**Plan.**" paragraph** — a paragraph:

> **A project stage on Plan (G1c; G83, L86).** Stage 9 says "Nothing here is a rung to pass", and its page says so (*A project: there is no rung to pass here.*, below). Plan reads the same constant (`projectStore.PROJECT_STAGES`): a project stage's line is that sentence (`PROJECT_TEXT.stageNine`) — no *x of y*, no *by your word*, no *done before* — with no bar under it and no *complete*; its rows wear no rung badge, no learner's word and no carry-over. A unit there lists several pieces, so its row wears none of their project states either; the page it opens shows each piece's. The rungs keep their state in the evidence (`rungState.ts`, unchanged); Plan stops presenting it. The legend names the bar's two fills only where a stage that draws a bar carried rungs.

**`docs/08-test-map.md`, the state-machine table, the row *The learner's projects* (G1b)** — the first cell gains ", Plan's project stage (G1c)"; the faults gain "Plan counting a project stage's rungs, drawing its bar or badging its rows (G1c); a second `PROJECT_STAGES`"; the tests gain "`planProjectStage.test.ts`, `plan.spec.ts` › *Plan: a project stage counts nothing* (added, G1c); `projectLifecycle.test.ts` (revised, G1c: an import of the stage numbers alone listed apart) — red on the committed code; 8 mutants caught"; the status gains "; Plan's project stage done (G1c, Entry 139), the sentence unverified as pedagogy".

**`docs/08-test-map.md`, the file lists** — the unit list gains, after `planNoUnobtainableRungs.test.ts`:

> - `planProjectStage.test.ts` — Plan reads a project stage as the lesson page does (G1c): with Stage 9 rungs met, in progress, marked done and carried, the line is the page's sentence, no count, bar or *complete*, and no row wears a rung's word; every other stage's line, bar and badges as before; the legend only for fills a stage draws; one `PROJECT_STAGES`, the session and Plan importing the store's.

> the entry for `plan.spec.ts` gains "; a project stage's line, bar and rows at 342 × 740 beside Stage 8's unchanged (G1c)"; the entry for `projectLifecycle.test.ts` gains "; the session and Plan importing only the project stages' constant (G1c)".

**`docs/prompts/backlog-2026-09-25.md`** — G83: "built (G1c, Entry 139): Plan's project stage counts nothing, draws no bar, wears no badge; closes on G1c's review"; G84: "built (G1c item 1): `session.ts` imports `projectStore.PROJECT_STAGES`; the G1b guard revised to list the importers of the constant apart".
