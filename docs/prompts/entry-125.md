### Entry 125 — U80: on a tablet the Score screen marks when the lesson panel is decided (`data-side` absent, then `text` or `empty`, once per opening) and draws the score only after it, so the first frame has the column it keeps; the side-panel sweep waits on the mark

**Judgement.** The brief's hypothesis held on every piece measured. On the committed tree, on a tablet, the lesson panel was decided **after** the score's first draw on all 84 openings measured (the 14 pieces `side-panel-prose.spec.ts` sweeps, at 1000 × 1000, 1024 × 1366 and 1366 × 1024, each opened twice). What a learner saw first (the Minuet in G, pictures below): at 1000 × 1000 the notation drawn across the whole width with no panel and "Loading…" in the header, both bars on one system at a larger staff; then the panel arrived, the stage lost the column's width, and the music was refitted as two one-bar systems at a smaller staff beside it (`before-first-frame-1000x1000.png` against `before-settled-1000x1000.png`). At 1024 × 1366 the same two systems were drawn centred in the full width and then moved left when the panel came in. At 1366 × 1024 the stage is capped at 1040 px either way, so the panel appeared beside the music without moving it. After U80 the first frame that draws the music has the panel beside it and the width and layout it settles on, at all three tablet sizes (`after-first-frame-*` against `after-settled-*`); the only change after the first draw is the stage's height as the control bar takes its row (U74's follow-up 2, not U80's), which did not move this piece's notation. The brief's two picture sizes, 768 × 1024 and 1024 × 768, are not tablets to the app (`isTablet` wants 900 px on the shorter side), so they have no panel and nothing waits there; they are in the set as controls and did not change. The runner's red was not reproduced by the committed spec alone on this machine (green, 4 of 4), because here the race mostly lets the panel land before the spec reads it; it was reproduced exactly ("no piece in the sweep drew a side panel at all", received 0) with every lesson read answered late, the spec otherwise byte for byte. Nothing heard; the Minuet is unverified as music and was not the question.

**The mechanism, and what told it from the alternative.** `fillSidePanel` ran beside the score's load (a curriculum read, the rung, the lesson file) and set `data-side = 'text'` when the words arrived; the screen was built with `data-side = 'empty'`, the same word a panel left out carries, and a panel left out was never marked at all. So (a) nothing said when the panel had been decided, and the sweep read it when the screen appeared, which is before the panel on either build (the committed read found it hidden on 8 of 84 openings here, and on 6 of 84 after the fix — the screen is shown before the panel is decided in both); and (b) the renderer was made on the stage as it was, without the column, and refitted when the column arrived. The alternative the brief named — the panel decided before the first draw on every piece, the spec alone at fault — was refuted by the page's own frame log (84 of 84 after the first draw, `probe-before.txt`). The discriminating red for the product half: U80's sweep, which waits on `data-side`, still fails against the committed build with late lesson reads (received 0), because the construction-time `empty` satisfies the wait — a spec that waits cannot fix a screen that never says "undecided".

**The change** (`ScoreScreen.ts` only, at the panel builder, `fillSidePanel` and the call order before `WindowRenderer.create`; nothing about the panel's words, the rung rule, the phone or the fit rule):
1. `data-side` is absent until the panel is decided, then `text` (the words are in the panel) or `empty` (a piece on no rung, a lesson that will not read), set once per opening by `decideSidePanel`. Every opening builds a new screen, so the next piece starts undecided. A phone has no panel and is `empty` from construction.
2. The panel's elements are held by the screen that built them, not found by id when the lesson lands: a lesson landing after the learner has opened another piece wrote into the other piece's panel (same ids). Part of item 2's "once per opening"; the unit file's reopen case is red under that one change (mutant `found-by-id`).
3. On a tablet the renderer is made after the panel's decision, waiting no longer than `SIDE_PANEL_WAIT_MS` (1,500 ms, a design value, exported beside the control-bar constants) past the score being ready to draw. The panel's reads start when the item is found, beside the score's, so the wait is only what the panel takes past the score's own load. Past the bound the stage is priced undecided, which on a tablet keeps the column's track (the stylesheet's one-column rule keys on `empty`), so a panel that then arrives with text moves nothing and one left out gives the width back as a resize. The bound exists because the lesson's `fetch` has no timeout of its own and a score must open with or without its prose.
4. `side-panel-prose.spec.ts`: `panelDecided` waits for `data-side` to be `text` or `empty`; `openPiece` waits on it after the svg; the sweep waits on it, skips `empty`, checks the panel is visible for `text`, and keeps its assertion that more than half the pieces drew a panel. No other case changed.

**Whether the wait costs the learner.** Stated as the observed order, not a time: before, the panel arrived at or before the frame where `data-settled` was first said on 83 of 84 openings (after it on one, which then took the word back), so the layout a learner could rely on never came earlier than the panel's decision; after, the first draw is in the panel's frame and `data-settled` follows it on 84 of 84. The first draw of music now comes later than before by whatever the panel took past the score's load — the interim frames at the wrong width are replaced by "Loading…". With every lesson read three seconds late (the bound's path, 14 openings at 1000 × 1000), the score drew before the panel, on a stage already the column's width, and the stage's width did not change when the panel arrived. Chosen over the resize path because the lesson files are precached (`content/**/*.md` in the service worker's list) and read beside the score's own reads; the bound covers the case the brief warned of, a read held on the network.

**Done**
- Item 1, the measurement, before any change and after it: 84 openings each way from the page's frame log and mutation marks (table below); the stage's box at each frame the music was drawn; the bound's path with late lesson reads. Technical.
- Item 2, the mark: absent until decided, `text` or `empty`, once per opening, each opening its own; unit cases red on the committed code (5 of 6; the phone case is a preserved control) and red under each part undone (6 of 6 mutants). Technical.
- Item 3, the panel before the fit on a tablet, bounded: the first frame with music has the panel on 84 of 84 openings; the stage's width never changes after the first draw on any of them. Product (observed in the frame log and the pictures) and technical.
- Item 4, the spec: waits on the mark; red under late lesson reads on the committed build (both the committed sweep and U80's sweep, received 0), green on U80's build with the same lateness; the whole spec green on U80's build.
- Preserved: `score.window-rule.spec.ts`, `score-fit-paths.spec.ts` and `side-panel-prose.spec.ts` (18 of 18), `wide.spec.ts` tablet-portrait and tablet-landscape (2 of 2), `npx tsc -b`, `npm run lint`, the unit file.
- Pedagogical: not applicable (no words, rung or exercise changed); the panel's prose is the rung's as before.

**Not done**
- The brief's word `none` for a panel left out: kept as `empty`. The stylesheet's rule that gives the stage the whole width when there is no panel is `.screen--score[data-tablet='true'][data-side='empty']` (`style.css` 5599), and the stylesheet is not U80's file; writing `none` without that selector would leave a 320 px empty track beside every piece on no rung. Renaming is one token in each file, in one change, by whoever holds `style.css`; nothing else reads the word (the states probe records it as a string).
- The brief's picture sizes 768 × 1024 and 1024 × 768 as tablets: they are not tablets to the app; the tablet pictures are at 1000 × 1000 (the spec's size), 1024 × 1366 and 1366 × 1024, with the brief's two kept as controls.
- The runner's red from the committed spec alone: not reproduced on this machine (`e2e-side-panel-committed-alone.txt`, green); reproduced with late lesson reads (`red-harness-committed.txt`).
- The literal first frame after U80 as a picture: on the three tablet sizes the screencast frame picked landed one layout change after the first draw (the control bar's height, e.g. 704 × 1209 to 704 × 1157); the frame log shows that frame's width and panel equal to the first draw's, but the picture is the next frame. Before U80 the picked frame shows the pre-panel layout the log records.
- A sweep-order probe distinct from fresh loads: `page.goto('/#/score/…')` resolves outside the `/PianoProject/` base and redirects, so every sweep step is a full page load (`debug-navigation.txt`); the probe's "sweep" and "fresh" runs are both fresh documents, the first of each test in a new browser context.

**Follow-ups**
1. (P2, the screen's first frame, cause not investigated) On every path that does not wait — the phone, and the brief's two non-tablet sizes — the first frame with music shows the mode selector at *Wait for me* and "Loading…" in the header, and the settled frame shows *Keep tempo* and the count-in line (`after-first-frame-768x1024.png` against `after-settled-768x1024.png`; the committed tablet pictures show the same). A learner can see the mode change under them after the music is drawn.
2. (P2, U74's follow-up 2, G1's lines) The stage's height still changes after the first draw by the control bar's measured row; after U80 it is the only change after the first draw on a tablet. A height-bound piece would still be refitted.
3. (P3, `fillSidePanel`, latent) The lesson is read with a bare `fetch`; `fetchMarkdown` refuses a static host's `index.html` answered with 200 for a missing file (`looksLikeThePageItself`). A lesson file missing from a build would put the app's page source in the panel. Every rung's file is built today; not changed, because the brief keeps the panel's reading as it was.
4. (Note, per the brief) `score.bar-targets`'s runner failure passed locally on the orchestrator's run; not touched, not run here.
5. (Environment) This worktree's checkout has CRLF endings, and two source-text checks in `lessonClaimsAboutApp.test.ts` search for `\n` in `ScoreScreen.ts` and `style.css` and fail here (`vitest-all.txt`; the matched text, the *Rhythm only* menu row and the blind rule, is untouched by U80 and present with `\r\n`). Two `perfectPerformance` files crashed the worker in the full run and pass alone (507 of 507). CI's checkout has LF.
6. (Environment) The C: drive had about half a gigabyte free during the run; the late-lessons probe's browser context failed to close with `ENOSPC` after its summaries were printed (`probe-after-lessons-late.txt`, exit 1). Other lanes on this machine may hit it.
7. (Observation, the window rule's, not U80's) At 1000 × 1000 the settled window is two one-bar systems in the 680 px column with the lower part of the stage empty, where the pre-panel frame drew both bars on one system at a larger staff: the column's cost in music size, the trade `04` §7a made; U77/U78's questions.

**Questions**
None for the owner. For the reviewer: `SIDE_PANEL_WAIT_MS` is 1,500 ms by choice (the reason is in its comment); only its path's behaviour was observed, not the right length on a slow tablet.

**Files** (worktree; nothing committed, nothing staged):
- `app/src/ui/screens/ScoreScreen.ts` — the mark, the held panel elements, `decideSidePanel`, the bounded wait before `WindowRenderer.create`, `SIDE_PANEL_WAIT_MS`.
- `app/tests/unit/scoreSidePanelDecision.test.ts` — new: the six cases.
- `app/tests/e2e/side-panel-prose.spec.ts` — `panelDecided`; `openPiece` and the sweep wait on it.
- `docs/prompts/runs/U80/` — this entry, every capture, the scripts as they ran (`scripts-zz-u80-probe.spec.ts`, `scripts-zz-u80-pictures.spec.ts`, `scripts-zz-u80-red-harness.spec.ts`, `scripts-zz-u80-debug.spec.ts`, `scripts-playwright.u80-4313.config.ts`, all removed from `app/`; `scripts-mutants.py`, `scripts-sanitise.py`). The probe gained its late-lessons switch and the pictures script its first-frame check after their first runs; both are kept in their final form. Paths in captures read `<worktree>`, `<main checkout>`, `<temp>`.
- `docs/prompts/pictures/u80/` — `before-` and `after-`, `first-frame-` and `settled-`, at 1000x1000, 1024x1366, 1366x1024, 768x1024, 1024x768.
- Not changed: `WindowRenderer.ts`, `tablet.ts`, `style.css`, `docs/04`, `docs/08`. The offline content build rewrote `docs/prompts/inventory.md` and `rung-claims.md`; both restored from HEAD byte for byte. The offline build lacked 228 catalog items (it exits 1 listing them), so `app/public/content` was mirrored from the main checkout's build (`copy-content.txt`); the sweep's pieces are the full catalog's.

**The measurement** (the page's own frame log and mutation marks, served build, port 4313; stage boxes as observed on this machine, no times)

| | Committed tree | U80 |
| --- | --- | --- |
| `data-side` in the screen's first frame | `empty` on 84 of 84 (the same word as a panel left out) | absent on 84 of 84 (the summary line prints `(no frame)` for an absent attribute: its `null ?? '(no frame)'`) |
| The panel's decision against the first frame with music | after, 84 of 84 | before, 84 of 84; the first frame with the panel is the first frame with music on 84 of 84 |
| The panel against the first `data-settled` frame | before 48, same frame 35, after 1 | before, 84 of 84 |
| The stage's width after the first draw, 1000 × 1000 | 1000 then 680 (28 of 28) | 680 throughout (28 of 28) |
| 1024 × 1366 | 1024 then 704 (28 of 28) | 704 throughout (28 of 28) |
| 1366 × 1024 | 1040 throughout, capped (28 of 28) | 1040 throughout (28 of 28) |
| The stage's height after the first draw | shrinks by the control bar's row (every opening) | the same (every opening) |
| The committed spec's read, taken when the screen is visible | panel hidden 8, visible 76 | panel hidden 6, visible 78 |
| Lesson reads 3 s late, 1000 × 1000 fresh (the bound's path) | — | the panel after the first draw on 14 of 14; the stage 680 wide from the first draw, unchanged |
| Pictures, the Minuet in G, first frame | no panel; 1000 × 1000 one system of two bars across the width; 1024 × 1366 two systems centred in the width | the panel beside the music at its settled width and layout (the frame after the first, see Not done) |

**Red lines**
- `red-harness-committed.txt`, the committed sweep with every lesson read late, committed build: `Error: no piece in the sweep drew a side panel at all … Expected: > 7 Received: 0` — the runner's message.
- The same file, U80's sweep (waits on `data-side`) against the committed build, lessons late: `Expected: > 7 Received: 0` — the construction-time `empty` satisfies the wait.
- `harness-after.txt`, U80's build: the committed sweep still red (the old read races on either build), U80's sweep green.
- `red-vitest-committed.txt`, the unit file on the committed screen: `a panel not yet decided reads as decided: expected 'empty' to be null` (three cases), `the next piece opened already decided: expected 'empty' to be null`, `expected [ 'empty' ] to deeply equal [ '(undecided)' ]`; 5 of 6 red, the phone case green.
- `mutants-summary.txt`, each part undone alone on U80's screen: no wait (3 red), no bound (1), no-rung undecided (1), failure undecided (1), elements found by id (1), decided at construction (5); source restored byte for byte.
- Two drafts of the spec's sweep hung on a wait for the previous screen to leave (`red-harness-committed-first-try.txt`, `-second-try.txt`): every sweep step is a full page load (`debug-navigation.txt`), so there is no previous screen; the wait was removed.

**Tests**

| Test | File | Class | Reason | Committed code |
| --- | --- | --- | --- | --- |
| filled: undecided until the lesson reads, then `text`, and the renderer is made after | `scoreSidePanelDecision.test.ts` | add | items 2 and 3 | red |
| left out, a piece on no rung: `empty`, the renderer made with it | same | add | item 2 | red |
| left out, a lesson that will not read: `empty` | same | add | item 2 | red |
| reopened: the next piece undecided, decided by its own lesson; a late lesson lands on its own screen | same | add | item 2, once per opening | red |
| a lesson that never answers holds the first draw no longer than the bound, and decides nothing | same | add | item 3's bound | red |
| a phone: decided at once, nothing waits | same | add | preserved control | green |
| `openPiece` (the phone case and the two single-piece tablet cases) waits on `data-side` | `side-panel-prose.spec.ts` | changed | item 4 | green |
| the sweep waits on `data-side`, skips `empty`, keeps "more than half drew a panel" | same | changed | item 4 | green alone here; red with late lesson reads |
| `score.window-rule.spec.ts`, `score-fit-paths.spec.ts` | — | untouched | preserved (the fit's timing) | green on U80 |
| `wide.spec.ts` tablet-portrait, tablet-landscape | — | untouched | preserved | green on U80 |

**Exit codes**

| Step | Exit | Capture |
| --- | --- | --- |
| `npm ci` | 0 | `npm-ci.txt` |
| parity reference | 0 | `parity.txt` |
| content build, offline (228 catalog items it cannot build offline, listed) | 1 | `content-build.txt` |
| content mirrored from the main checkout (robocopy: files copied) | 1 | `copy-content.txt` |
| build, committed tree | 0 | `build-app-before.txt` |
| `side-panel-prose.spec.ts`, committed spec and build, alone | 0 | `e2e-side-panel-committed-alone.txt` |
| probe, committed build (6 tests, 84 openings) | 0 | `probe-before.txt` |
| unit file on the committed screen (5 of 6 red) | 1 | `red-vitest-committed.txt` |
| unit file on U80 | 0 | `vitest-unit-after.txt` |
| mutants (6 of 6 red, source restored) | 0 | `mutants-run.txt`, `mutants-*.txt` |
| `npx tsc -b` (a first run was 2: the unit file's `hidden` typed `boolean \| 'until-found'`, fixed) | 0 | `tsc.txt` |
| harness and U80's spec on the committed build (two red, four green) | 1 | `red-harness-committed.txt` |
| navigation trace | 0 | `debug-navigation.txt` |
| pictures, committed build (a first run's screenshots landed after the panel: `pictures-before-too-late.txt`) | 0 | `pictures-before.txt` |
| build, U80 | 0 | `build-app.txt` |
| pictures, U80 | 0 | `pictures-after.txt` |
| probe, U80 (6 tests, 84 openings) | 0 | `probe-after.txt` |
| `side-panel-prose`, `score.window-rule`, `score-fit-paths` on U80 (18 tests) | 0 | `e2e-named.txt` |
| `wide.spec.ts --grep tablet` on U80 (2 tests) | 0 | `e2e-wide-tablet.txt` |
| `carry-overs.spec.ts`, the tablet layout and phone panel cases, on U80 (3 tests; another reader of `#score-side`, run at the closing check) | 0 | `e2e-carry-overs-tablet.txt` |
| harness on U80 (committed sweep red, U80's green) | 1 | `harness-after.txt` |
| probe, U80, lessons 3 s late, 1000 × 1000 fresh (summaries printed; context close `ENOSPC`) | 1 | `probe-after-lessons-late.txt` |
| `npx vitest run` (2 CRLF-checkout failures, 2 worker crashes; Follow-up 5) | 1 | `vitest-all.txt` |
| the two crashed files alone | 0 | `vitest-perfect-performance.txt` |
| eslint, the three changed files | 0 | `lint-changed.txt` |
| `npm run lint` | 0 | `lint.txt` |

**Unverified, beside what passes:** nothing heard. The wait's cost on a real tablet or under `perf.spec`'s throttle (not run); the order above is this machine's. The first visit before the service worker has precached was part of each test's first opening but not separated out. The full e2e suite and the states gallery were not run (CI's; the seam is the Score screen's load order on a tablet, and the phone path is unchanged by construction and by the unit control). The literal first frame after U80 as a picture (Not done).

**Orchestrator's note at the landing (2026-09-29).** U80's worktree committed by name (ba86d75c) and merged (ebad0720). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U80/map-min.txt`: e2e	app	npx playwright test tests/e2e/converted-import.spec.ts tests/e2e/first-day.spec.ts tests/e2e/lab.spec.ts tests/e2e/lesson-flow.spec.ts tests/e2e/midi-import.spec.ts tests/e2e/modes-chart-from-), typecheck, lint, the whole unit suite, the app build, the spec names checked, and the side-panel, window-rule, fit-paths, wide, Today and score specs on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; vitest-timeouts-rerun 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; two more cases (`expectedNote`'s every-black-key sweep and `materialOnTheRecord`'s every-built-row sweep) timed out at the suite's limit with four builders' suites sharing the machine, and pass alone (`vitest-timeouts-rerun`): load, not the tree; `runs/U80/orchestrator-exit.txt`). The brief's hypothesis held on every one of the eighty-four openings the builder measured (the panel decided after the score's first draw before the change; before it after), and the builder found and fixed a second fault on the way: `fillSidePanel` looked the panel up by id, so a lesson landing after the learner had opened another piece was written into that piece's panel. The runner's exact red was reproduced only with late lesson reads; the spec alone would not have fixed it, because the screen said `empty` before anything was decided. Two rows: the panel left out is still marked `empty` because `style.css` (not U80's) keys the full-width stage on that word (U86, one rename in one change); the wait limit before the fit is the builder's choice, its length on a slow tablet unverified (U87, the reviewer's question). The builder's disk warning (the machine at a few hundred megabytes free) was answered at the landing by removing twenty-six finished worktrees. Nothing heard; the tablet pictures at three sizes are the observations.


## Doc rows

`docs/04` §5 (the Score screen), after the *One size for the run* paragraph (after U74's *The first window is the measured one* paragraph where that has landed):

> **On a tablet the first draw waits for the side panel (U80, 2026-09-29).** The lesson panel's 320 px column is part of the stage's width, so the Score screen hands the renderer its stage only once the panel is decided: filled (`data-side="text"`) or left out (`data-side="empty"`: a piece on no rung, a lesson that will not read). `data-side` is absent until then and set once per opening; a phone has no panel and is `empty` from the start. The panel's two reads (the curriculum and the lesson file, both precached) start when the item is found, beside the score's own, and the first draw waits for them no longer than `SIDE_PANEL_WAIT_MS` past the score being ready; past it the score draws with the column's track kept, so a panel that then arrives with text moves nothing and one left out gives the width back as a resize. Before, the panel arrived after the first draw on every piece `side-panel-prose.spec.ts` sweeps, at every tablet size measured, and where the column takes width from the stage the music was drawn across the whole width and then refitted narrower beside it.

`docs/04` §7a, after *Ships as of P18*:

> Since U80 the Score screen's first draw on a tablet waits for the panel's decision (§5), so the notation is never drawn at the width it has without the panel and then narrowed when the panel arrives.

`docs/08`, the pieces table, a row:

> | **The tablet side panel's arrival** (U80) | the panel decided after the score's first draw, so the music was drawn without the column and refitted narrower when it arrived; nothing marked the decision (`data-side` read `empty` from construction, as a panel left out does), so the sweep read the panel before it was filled and, on a loaded runner, found none drawn | `tests/unit/scoreSidePanelDecision.test.ts` (the mark, once per opening, each opening its own; the renderer made after the decision or the bound; the phone waits for nothing), `tests/e2e/side-panel-prose.spec.ts` (every case reads the panel after `data-side` is decided) — the unit cases red on the committed code, the sweep red on it with late lesson reads | done (U80, 2026-09-29); the stage's height change after the first draw (the control bar) is U74's follow-up; the word for a panel left out stays `empty`, the stylesheet's |

`docs/08`, the e2e list, the `side-panel-prose.spec.ts` line, append:

> Every case reads the panel only after the screen's `data-side` says it is decided, `text` or `empty` (U80); the sweep used to read it as the screen appeared and, on a loaded runner, found none drawn.

`docs/08`, the unit list:

> - `scoreSidePanelDecision.test.ts` — the tablet side panel's decision on the Score screen (U80): `data-side` absent until decided, `text` when the lesson reads, `empty` for a piece on no rung or a lesson that will not read, once per opening and each opening its own (a lesson landing after the next piece has opened stays on its own screen); the renderer made after the decision, or after the bound when a lesson never answers; a phone decided at once with nothing waiting.
