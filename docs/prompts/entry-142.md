### Entry 142 — G1d — repertoire retention reads the learner's project: a piece paused or put away on its sheet is no longer offered as *Keeping this piece playable*; Today hands the session the projects, `review()` looks each learned piece's project up once by the lesson page's identity, and nothing else in the session reads a state (G82, ruled; the first consumer of the lifecycle) (2026-09-29)

**Judgement.** Nothing was heard, and G1d claims nothing about music. What I looked at: the app built from this tree and from the committed code (e39a41f7) on port 4413 at 342 × 740, for `today.spec.ts`'s learner on 2.2 — *Ode to Joy (hands together)* passed on 2.1 twenty days back and not played since, seeded straight into the stores — with the piece made a project on its sheet (*Keep it playable*) and then paused (`pictures/g1d/`; every row's words and marks in `before-facts.json` and `after-facts.json`); the unit harness; the code.

- **Today's review row with the piece paused, before** (`before-today-paused-342x740.png`, `before-today-paused-review-row-342x740.png`, observed): **Ode to Joy (hands…** / *Keeping this piece playable —…* / *Review · 5 min · L2.1* / *✓ passed*. The project sheet one tap away says *Paused since* today; the card contradicted it.
- **After** (`after-today-paused-342x740.png`, `after-today-paused-review-row-342x740.png`, observed): **Rhythm reading with…** / *Nothing due for review — mo…* / *Review · 5 min · L2.2* / *✓ passed* — the fallback ladder's rung step (claim `rung`), the row a learner with nothing due gets. The card's other four rows (the warm-up's chord drill, *London Bridge*, *Merrily We Roll Along*, the reading row) are the same items with the same words before and after (the facts files). Nothing on the card mentions the pause (the browser case searches the card for it).
- **Unpaused, and kept playable** (`*-today-unpaused-*.png`, observed on both builds): the retention row as it was. The browser case walks *Keep it playable* (`maintaining`, the positive retention state) before *Pause* and finds Today's row unchanged, so it is the pause, not having a project, that takes the offer away.
- **As observations against the rules, never a gate.** The card now agrees with the sheet: the learner said *pause*, and the app stops asking them to keep the piece up. A teacher reading the after picture might note two things, neither G1d's: *Nothing due for review* is true from the app's side while the learner knows the piece has gone unplayed (it is what they asked for); and the ladder's rung step now offers the eighths drill passed yesterday — its existing *counted items first* order. Whether the silent card serves a learner better than a line saying why is **unverified as pedagogy** (Questions 1).
- **X1's stored run** (the brief's "When to deviate", observed on both builds; `*-today-running-session-paused-342x740.png`, `*-facts-running-session.json`): a session started while the piece was on the card, the piece then paused, Today opened again — the running card still shows *Ode to Joy* with *Keeping this piece playable*, pending, under *Continue today's session*. That is X1's design (the card while a session runs is the composition as it was at *Start session*, never rebuilt); the next composition — another day, *End today's session*, a finished session, Shuffle or a length — leaves the piece out (read in `TodayScreen.ts`'s `loadRun` and `recompose`, not observed). Named and stopped at the finding: `sessionRun.ts` and `sessionRunner.ts` are not G1d's (Questions 2).
- **Adjacent, seen, not G1d's:** the reason line is cut at 342 px before and after (*Keeping this piece playable —…*, *Nothing due for review — mo…*), the row layout every Today row has.

## The mechanism

**The fault.** `review()`'s learned-piece loop (`session.ts`, the loop at 1362 on the committed code) read `ctx.learned` — `learnedPieces`: songs passed or mastered on a measured run, with when each was last played — and nothing of intention. G1b's store held `paused` and `retired`, and by G1b's own guard no session code read it. So *Keeping this piece playable* overrode a stated intention, and the reviewer ruled it (G82): once the session consumes the lifecycle, `paused` and `retired` suppress automatic retention offers.

**The brief's hypothesis, tested:** the suppression belongs at the retention reader, not on `learned` upstream. The refuting test is a reader of `learned` that must drop a paused piece to stay truthful. `learned`'s readers in `session.ts` at the lines: the review loop (the offer, the only one whose sentence is *keeping playable*), `fresh`'s order (1145: a piece not yet learned before one learned), the repertoire fallback's order (1398) and `known` (1547: a mastered piece is *a piece you know*). None but the review claims the piece should be kept up, so the filter went into the loop, and `learned`, *a piece you know* and the orders read what they read before. **It held**, with one policy observation for the repertoire slot (Follow-ups 1).

**The discriminating test.** On the committed code, a learned piece fifteen days unplayed with a `paused` or `retired` row is still offered with `piece-retention` (`red/red-vitest-retention-committed-code.txt`); in the browser, after *Pause* on the sheet, Today's review row still reads `piece-retention` (`red/red-e2e-projects-committed-app.txt`). The same cases with `maintaining`, `refreshing`, `saved`, `learning`, `polishing`, `performance-ready` and no row are green on both sides, by design: only the two ruled states move the offer. Nine mutants of the loop and the guard, nine caught (`mutants.txt`).

**The change, on the mechanism:**

1. **Where the read happens** (`TodayScreen.ts`): `allProjects().catch(() => [])` joins the `Promise.all` before `buildSession` and is passed as `projects`; a store that cannot be read gives none, which suppresses nothing.
2. **The input** (`session.ts`, `BuildInput.projects?: readonly ProjectRow[]`): absent, nothing suppressed; the session never opens the store.
3. **The reader** (`session.ts`, `review()`'s learned-piece loop): after `usable()`, `projectIn(ctx.input.projects ?? [], { itemId: piece.itemId, material: materialOfItem(item) })` — Progress's identity (`ProgressScreen.ts` 430) — and a project in `paused` or `retired` skips the piece before `due` sees it. The sort, the window, `pick` and the claim are the lines they were. `SlotContext` needed nothing: the loop reads `ctx.input`.
4. **The guard and the header** (`projectLifecycle.test.ts`, `projectStore.ts`), below.

**Premises of the brief, checked at the lines** (`operating-procedure.md` §13): every line number held within a line or two. *"`TodayScreen.ts` … imports `allProjects` and the row type"* — it imports `allProjects` only; the rows' type is inferred, and an unused type import would be dead. *"If `session.ts` cannot import `materialOfItem` or `projectIn` without a cycle"* — it already imported both modules (`./material` for `materialOfItem`; `../data/projectStore` for `PROJECT_STAGES`), so no new module edge. *"A second caller constructs `BuildInput`"* — `buildSession(` in `app/src` is called from `TodayScreen.ts` alone (1109 on the committed code). *"If the seeding path cannot set a played date"* — it can: the Stage 9 case's direct IndexedDB write puts a run and a progress row twenty days back as well as a project.

## Done

1. **Item 1, where the read happens** — as above. Technical: done.
2. **Item 2, what the reader does** — `projectIn` over `materialOfItem`: a row of the same file under another id suppresses; a row under the piece's own id suppresses, even made on a file the catalogue has since built again; another id's id-only row, or another file under another id, does not (unit case d). `paused` and `retired` skip; `saved`, `learning`, `polishing`, `performance-ready`, `maintaining`, `refreshing` and no row leave the whole card deep-equal to the card without projects (unit case c, every state). Not a filter on `learned`. Technical: done.
3. **Item 3, silent** — no line, chip or word; the unit case searches every reason on the card, the browser case the card's text, for the pause. Pedagogical: **unverified** (Questions 1).
4. **Item 4, not G1d's** — the diff touches `session.ts` at the import and its comment, `BuildInput` and the loop only; `repertoire()`, `uncountedFirst`, skill retention, the exposure rule, `learnedPieces`, `ProgressRow.status`, the encounter and contact reads, `sessionRun.ts`, `sessionRunner.ts`, the sheet, Progress, the Library, Plan and the lesson page are not in it. *A piece you know* is Follow-ups 1, with the observation.
5. **Item 5, the one-reader guard** — revised: `curriculum/session.ts` and `ui/screens/TodayScreen.ts` among the readers; Plan alone among the stage-number importers; no file under `evidence/` or named for eligibility or skills imports from the store; `session.ts`'s bindings from the store are exactly `PROJECT_STAGES`, `projectIn`, `type ProjectRow` (so `allProjects` or `projectFor` in the session is red — G1c's mutant keeps its teeth); `projectIn(` once in `session.ts`, inside `review()`; `actors` unchanged. The file's header sentence narrowed to match. Technical: done.
6. **Item 6, the store's header** — narrowed: no evidence, skill or eligibility code reads a state; the session reads one thing for one purpose; `learnedPieces`, *A piece you know* and the rest of the session read what they read before. A comment.
7. **Item 7, unit, red first** — four cases added to `repertoireRetention.test.ts` (a, b paused and put away; c every other state and no row; d identity; e three pieces due, the most overdue paused: the next offered in the words it had, then the third — the brief's two-piece case is its first two); (f) the file's nine earlier cases, which pass no projects, green untouched. The block runs on the file's items measured with no demands (`helpers/measured`): with the file's unmeasured items the ladder's rung step asks the one gate, which offers no unmeasured option automatically (X1, L113), so a review with nothing due has no row and "the ladder's row" would have been a missing row — found by the first red run, whose first failure was that premise (*expected [ 'rung', … ] to include undefined*); that capture was overwritten by the corrected run. Technical: done.
8. **Item 8, browser, red first** — `projects.spec.ts` › *a piece passed and unplayed past the window, paused on its sheet…* at 342 × 740: the retention row; *Make it a project* → *Keep it playable* on Progress, Today unchanged; *Pause*, Today's row something else and the card silent; Progress (the piece's run in *Recent sessions*, the *Repertoire* list) and the Library's row for the piece text-equal before and after; the project listed *Paused since* today. Red on the committed build at the claim, green on this tree's. Technical: done.

## Not done

1. **The docs are rows, not edits** (the brief) — `

**Orchestrator's note at the landing (2026-09-29).** G1d's worktree committed by name (d59f2ef8) and merged (85dee758). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/G1d/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0; vitest-timeouts-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; the other failures were timeouts under the machine's load and pass alone (`vitest-timeouts-rerun`); `runs/G1d/orchestrator-exit.txt`). The reviewer's G82 ruling (`responses/536d9bc2.md`) built as the session's one read of a project. CI on the runner was green on 031abce3 (the tree with G1c, Q76, X3e and X1) at 19:11Z; this tree's run follows the one on 9007d68a. The one extra unit red in the chain, the fixture-spelling sweep in `expectedNote.test.ts`, was a five-second timeout under four builders' load and passed alone.

## Doc rows` below.
2. **The map's fallback for the lane's config.** `app/playwright.g1d-4413.config.ts` (kept in `app/`, as told; the orchestrator decides whether it lands) matches no pattern, so the map names the full required suites. Run: the six code paths' minimum whole (tsc, lint, the unit suite, the app build, its sixteen browser specs), the parity reference, the converter harness, content validation and the review check. Not run: the whole browser suite (CI's full run; the config is the lane's harness, not product). `content-tests` ran and failed on this worktree's inputs (below), not on a G1d file. `npm run lint` fails on the config alone (*not found by the project service*): a landed config needs a `tsconfig.node.json` include and a map pattern, or it moves under `runs/G1d/` as G1b's and G1c's did.
3. **The offline content build** could not produce a whole `app/public/content` here: without the fetched kern and musetrainer folders, which live under `content/` (another builder's in this wave), the merge and validation failed (`content-build.log`, exit 1). The built folder was copied read-only from the main checkout (`copy-content.txt`: 2,092 catalogue items), as the brief allows; the two reports the build rewrote put back to HEAD's bytes (`restore-reports.txt`: clean).
4. **The state gallery** — not named by the map for these paths; not run.

## Follow-ups (recorded, not fixed)

1. **P2 — *A piece you know* can offer the paused piece** (the brief's item 4 question, with the observation). A unit probe on constructed items (`probe-a-piece-you-know.txt`; the probe ran once and was removed): a mastered piece paused, on the 30-minute card with one song on the learner's rung — the review steps past it as ruled, and the repertoire slot's fallback, whose exposure step reaches the songs of earlier lessons, offers it as *A piece you know — for variety: a song from an earlier lesson — none played since 30 Sep*. So in a thin catalogue the paused piece moves from one row to another under a gentler sentence. In the real app's picture state the repertoire row was a rung song (*Merrily We Roll Along*) and the paused piece appeared nowhere on the card (the facts files). Whether *a piece you know* should also step past `paused` and `retired` is a policy question for the reviewer; it would be one more read in `repertoire()`'s fallback order, which G1d's guard would then have to admit.
2. **P2 — a session already running keeps the paused piece** (Questions 2): X1's run card is the composition at *Start session*.
3. **P3 — `projectStore.ts`'s comment on `PROJECT_STAGES`** still says `session.ts` keeps its own constant (G1c's follow-up 1, still open; not the header, so not G1d's).
4. **P3 — `docs/01-architecture.md` says "`DB_VERSION` is 8"** (line 268) where `db.ts` is at 9 since G1b; the `projects` row beside it is right. For the next splice.
5. **P3 — the lane's Playwright config** (Not done 2): if it lands it needs the tsconfig include and a map pattern.

## Questions

1. **Silent, or say why?** The brief decided silent, and I built it silent. The case for a line: a learner who paused a piece weeks ago and forgot may wonder where it went; the case against: the sheet says it, Progress lists it *Paused since …*, and a line on Today repeats the learner's own word back as the app's. My view: silent is right while Progress shows the state; a line would be U-series copy, not G1d's.
2. **A running session after a pause.** X1 holds the card as composed so new evidence never rebuilds a running lesson. A pause is the learner's word, not evidence: should the runner skip (or mark) a pending activity whose piece the learner paused since *Start session*? Stopped at the finding, as briefed; the reviewer's call and X1's seam.
3. ***A piece you know* and a paused piece** (Follow-ups 1).

## Red lines (`runs/G1d/red/`)

- `red-vitest-retention-committed-code.txt` — `repertoireRetention.test.ts` on the committed `session.ts`: 3 of 13 red — *paused: the piece is still offered: expected 'song.learned' not to be 'song.learned'*; *the same file under another id: expected 'song.learned' not to be 'song.learned'*; the three-piece case *expected [ Array(2) ] to deeply equal [ …(2) ]*. The fourth new case (every other state leaves the card) and the nine earlier cases green, by design.
- `red-vitest-guard-committed-code.txt` — the revised guard on the committed sources: 1 of 32 red, *expected [ 'data/backup.ts', …(5) ] to deeply equal [ 'curriculum/session.ts', …(7) ]*.
- `red-e2e-projects-committed-app.txt` — the browser case against the committed build: seeding, the retention row, *Keep it playable* and *Pause* passed; then *Expected: not "piece-retention" Received: "piece-retention"* on Today's review row.
- `mutants.txt` — nine mutants (`scripts-mutants.py`, the file restored by sha256 after each), nine caught: the suppression removed; `paused` only; `retired` only; `maintaining` suppressed too; any project suppressing; identity by id alone; a `break` in place of `continue`; the session importing `allProjects`; a second `projectIn(` outside `review()`.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `app/tests/unit/repertoireRetention.test.ts` › *a piece the learner paused or put away is not kept playable by the review (G1d; G82)* | add | — | the brief's item 7: paused and put away not offered, silent, the ladder's row; every other state and no row leave the card; identity; the order of the rest |
| `app/tests/unit/projectLifecycle.test.ts` › *only the project sheet acts; the session reads a project for one thing…* | revise | no session code reads a project; the session imports the stage numbers alone | the session reads one, for retention's suppression: `projectIn(` once inside `review()`, its store bindings pinned, Today a reader, no evidence, skill or eligibility importer (G1d item 5) |
| `app/tests/e2e/projects.spec.ts` › *a piece passed and unplayed past the window, paused on its sheet… (G1d)* | add | — | the brief's item 8 at 342 × 740 |
| the 26 other unit files that build a session or mount Today; `projects.spec.ts` (the rest), `today.spec.ts`, the map's other fourteen specs | preserve | — | green |

## Exit codes (each capture ends with its exit)

| Run | Exit | What it said |
| --- | --- | --- |
| `npm ci` (`npm-ci.log`) | 0 | installed |
| copies from the main checkout, read only: `build/` caches and the real MIDI (`copy.txt`); parity reference (`parity.log`) | 0 each; 0 | eight reference files |
| `build.py --offline` (`content-build.log`) | 1 | the merge and validation failed without the fetched `content/scores/imported` folders (Not done 3) |
| `app/public/content` copied from the main checkout (`copy-content.txt`); reports restored (`restore-reports.txt`) | 0; 0 | 2,092 items; both reports clean |
| committed code's app, `vite build --outDir <scratchpad>/dist-head` (`build-app-head.txt`) | 0 | before any source change |
| vitest, the new cases on the committed code (`red/red-vitest-retention-committed-code.txt`) | 1 | the red above |
| vitest, the revised guard on the committed code (`red/red-vitest-guard-committed-code.txt`) | 1 | the red above |
| Playwright 4413, one worker, the new case on the committed build (`red/red-e2e-projects-committed-app.txt`) | 1 | the red above |
| vitest, the two files after the change (`green-1.txt`) | **0** | 2 files, 45 tests |
| `npx tsc -b` (`tsc.txt`) | **0** | — |
| `npm run lint` (`lint.txt`); without the lane's config (`lint-without-lane-config.txt`) | 1; **0** | the config's parse error alone (Not done 2) |
| vitest, 28 files: the brief's list, every file calling `buildSession(`, every file mounting Today (`vitest-targeted.txt`) | **0** | 28 files, 364 tests |
| mutants (`mutants.txt`; `mutants-run.log`) | harness 0 | 9 of 9 caught |
| `npm run build:app` (`build-app.txt`, no preview running) | **0** | — |
| Playwright 4413, one worker, the new case (`e2e-projects-g1d-case.txt`) | **0** | 1 passed |
| pictures on the committed build and this tree's (`pictures-before.txt`, `pictures-after.txt`); copied (`copy-pictures.txt`) | 0, 0; 0 | — |
| Playwright 4413, two workers, `projects.spec.ts` and `today.spec.ts` whole (`e2e-projects-today-4413.txt`) | **0** | 21 passed; both files checked present first |
| vitest, the whole suite (`vitest-full.txt`) | 1 | 312 files; 7,187 passed, 2 failed, 5 skipped, 1 todo — the two recorded `lessonClaimsAboutApp` reds (*blues.3 … Rhythm only*, *4.7: blind hides the score…*; they search `ScoreScreen.ts` and `style.css`, which G1d does not touch, for a literal `\n` in this CRLF checkout, Entry 101's diagnosis) |
| probe, *a piece you know* (`probe-a-piece-you-know.txt`) | 1 by design | the probe reports by throwing; Follow-ups 1 |
| `checks_for_paths.py` on the seven changed paths (`checks-for-paths.txt`); on the six code paths (`checks-for-paths-code-only.txt`) | 0; 0 | 6 matched and the lane config unmatched (the full required suites); the six alone: tsc, lint, the unit suite, the app build, sixteen browser specs |
| Playwright 4413, two workers, the map's sixteen specs (`e2e-map-min-4413.txt`) | **0** | 145 passed; every spec file checked present first; `docs/prompts/pictures/x1/` unchanged after (`git status`) |
| the fallback's converter harness, content validation, review check (`fallback-*.txt`) | 0, 0, 0 | — |
| the fallback's `content-tests` (`fallback-content-tests.txt`) | 1 | 1,434 tests, 6 failures: five on the fetched kern edition this worktree does not have (*cleopha.krn is missing*), one on the review queue read from the copied built content against this worktree's inputs; no content or tools file changed |

**Unverified**, beside what passes: silence as pedagogy (Questions 1); the running-session behaviour as a product choice (Questions 2); *a piece you know* in the real catalogue beyond the one picture state (Follow-ups 1, a constructed probe); Today at other widths (only 342 × 740 pictured; the rows are the rows Today already draws); a real learner's years of projects (constructed rows and one seeded learner); the whole browser suite; **CI has not run this tree.**

## Files

In the worktree `agent-abcdcd59da4a6920d`, cut from e39a41f7; nothing committed, nothing staged.

- Changed, in the brief's list: `app/src/curriculum/session.ts` (the import and its comment, `BuildInput.projects`, `review()`'s learned-piece loop), `app/src/ui/screens/TodayScreen.ts` (the import, the `Promise.all`, the `buildSession` call), `app/src/data/projectStore.ts` (the header comment), `app/tests/unit/projectLifecycle.test.ts` (the guard, and the file header's sentence about it), `app/tests/unit/repertoireRetention.test.ts` (the header, the imports, the block), `app/tests/e2e/projects.spec.ts` (the header, `putRows`, the case).
- Changed outside the list, and why: `session.ts`'s import line and the comment above it (the import item 5 requires; the comment said "nothing here reads a project"); `TodayScreen.ts`'s import line (item 1 requires it).
- New: `app/playwright.g1d-4413.config.ts` (the lane's port, kept as told; Not done 2).
- Not touched: `sessionRun.ts`, `sessionRunner.ts`, `progressStore.ts`, `eligibility.ts`, `projectSheet.ts`, the Progress, Library, Plan and lesson screens, `help.ts`, `docs/prompts/checks.json`, `tools/content/`, `content/`, the docs.
- Beside this entry: `runs/G1d/` (`red/`, the captures above, and the scripts as they ran: `scripts-copy.sh`, `scripts-copy-content.sh`, `scripts-restore_reports.py`, `scripts-build_app.sh`, `scripts-playwright.sh`, `scripts-mutants.py`, `scripts-zz-g1d-pictures.spec.ts` (copied into `app/tests/e2e/` for its two runs and removed), `scripts-copy_pictures.py`, `scripts-fallback-checks.sh`, `scripts-sanitise.py`; the probe's source is not kept, its output is; captures' machine paths replaced by `<worktree>`, `<main checkout>`, `<scratchpad>`, `<home>`, U74's rule) and `pictures/g1d/` (before and after, unpaused, paused and the running session, at 342 × 740, the review row cut out, and the facts files).

## Doc rows

**`docs/02-curriculum.md` Part G, the *Review has two reasons* bullet (about line 1411), after "the line is the piece's ("Keeping this piece playable")."** — a sentence:

> A piece the learner paused or put away on its project sheet is not brought back: the review reads the learner's project for that alone (G1d; the reviewer's G82 ruling) — `maintaining` is the positive retention state, `refreshing` active work, and every other state or no project leaves the offer as it was; nothing on the card says why.

**`docs/02-curriculum.md` Part A, principle 6, *Spaced review* (about line 113)** — "a piece learned (passed or mastered) that has not been played for two weeks" gains ", unless the learner paused it or put it away (G1d)".

**`docs/04-ui-spec.md` §2, the *Review has two reasons* bullet (about line 244), after "however recently its skills were shown elsewhere."** — sentences:

> Not a piece whose project the learner paused or put away on its sheet (§5; G1d, the reviewer's G82 ruling): Today hands the session the projects (`BuildInput.projects`) and the review steps past it silently — the learner said it on the sheet and no line repeats it — so the row is whatever else is due, or the ladder's. Every other project state, *Keeping it playable* and *Bringing it back* among them, leaves the offer as it was. A session already started keeps its card as composed (X1), so a piece paused mid-session stays on today's running card.

**`docs/01-architecture.md`, the `projects` row (about line 266)** — after "written only by the project sheet;" insert:

> read by one session rule (G1d): Today hands the rows to `buildSession` (`BuildInput.projects`) and the review's repertoire retention does not offer a piece whose project is `paused` or `retired`; no evidence, skill or eligibility code reads it;

**Beyond the brief's three, for the same splice** (the record the change makes stale):

- `docs/08-test-map.md`, the state-machine row *The learner's projects*: the fault "a project read by evidence, rung, skill, eligibility or session code" becomes "a project read by evidence, rung, skill or eligibility code, or by the session beyond retention's suppression (G1d)"; the faults gain "a paused or put-away piece offered as *Keeping this piece playable*; another state, or no project, moving the offer; the same file's project under another id missed, or another id's id-only row taken for the piece (G1d)"; the tests gain "`repertoireRetention.test.ts` › *a piece the learner paused or put away…* and `projects.spec.ts` › *…paused on its sheet… (G1d)* (added), `projectLifecycle.test.ts` (revised, G1d: the session a reader for retention alone, `projectIn(` once inside `review()`) — red on the committed code; 9 mutants caught"; the status's "retention and a put-away piece is Questions 1" becomes "retention's suppression of a paused or put-away piece done (G1d, Entry 142), silence unverified as pedagogy; a running session keeps a paused piece and *a piece you know* can offer one (Entry 142's questions)".
- `docs/08-test-map.md`, the file lists: `projects.spec.ts` gains "; a piece past the window paused on its sheet leaving Today's review, Progress and the Library as before (G1d)"; `projectLifecycle.test.ts` gains "; the session reading a project for retention's suppression alone (G1d)"; `repertoireRetention.test.ts` gains "; a paused or put-away piece not offered, every other state as before, found by the lesson page's identity (G1d)".
- `docs/prompts/backlog-2026-09-25.md`, G82: "built (G1d, Entry 142): `review()` steps past a learned piece whose project is `paused` or `retired`; closes on G1d's review".
