### Entry 180 — U32a — a long piece loads the sheets its settled shape needs, never the whole document inside a run

**Base** `827289d0` (origin's head at dispatch, checked first), worktree `agent-ac01cdc63c9797105`. U32's required change under the fast path: the reviewer's verdict on U32 (`review/responses/2f67b047.md`, APPROVE WITH ONE REQUIRED CHANGE) is the brief, with the coordinator's three corrections sent mid-task (below, *Premises*). `npm ci` in `app/` (exit 0); `app/public/content` copied read-only from the main checkout (every item but the tracked `audio/`), no content build; `build/rung-claims.json` copied the same way and `python tools/midi-cleanup/tests/parity_reference.py` run (exit 0) only to give two unit files the inputs a fresh worktree lacks. Every browser run went through a config copy (`scripts-playwright.u32a.config.ts`, kept at `app/build/u32a/` for its runs: `testDir` and the storage state by absolute path, the storage state re-keyed to `http://localhost:4531`, baseURL and `vite preview --strictPort` on **port 4531**, serving a build folder under `build/u32a/` built once before the runs — `dist-base` from the base before any edit, `dist-final` from the final code — never rebuilt under a run). One Playwright at a time. Nothing committed, staged, stashed, reset or checked out.

**Unverified on a device; nothing heard.** Every figure is this machine's and this run's, under Chrome's ×4 CPU throttle where said; the phone's are unmeasured. No note, sound or timing of music changed.

## Judgement

**What a learner sees** (`docs/prompts/pictures/u32a/`: before | after pairs of the first paint and the settled shape, and the after build's three pictures in turn where a sheet comes after the measurement; the Nocturne op. 48 no. 1, the Scherzo no. 2 and Twinkle at 342 × 740, Bars 4 and 8):

- **The first paint is the same picture.** Pixel-identical before and after in all six cells (`first-paint-compare.txt`): `create` still draws a long piece's first window from its two sheets, unmeasured. It is the transitional draw U74 recorded as not done — the Nocturne's four bars on one row at a 14 px staff and its eight at 7 px, both under the floor — unchanged by this lane.
- **The settled shape is the same shape.** Rows, bars shown, staff, ink share and free height identical in all six cells (`look-summary.txt`); the long pieces' pixels differ only at anti-aliased edges (0.3 % to 2.1 % of the picture, none strongly, `settled-compare.txt`) because the engraving settled at another zoom at the same drawn size. The Nocturne at Bars 4: bars 1–4 on two rows with 5–6 greyed below, as U32 gave it. At Bars 8: six of eight on three rows at 23.7 px, *8 would be too small here*, as U32 and as a short piece's chooser answers (the chooser is unchanged; unit (i)). The Scherzo at Bars 4: two rows and room below that the reserve prices as no row (U78, both builds).
- **What changed is the order between them.** U32 made every sheet before measuring, so the under-floor first draw stayed on the glass until one re-plan brought the window and its greyed row together. Now the piece is measured first and the window a learner reads arrives with the measurement's re-plan, drawn from the two sheets there are; where the settled shape needs a third sheet, it loads after that and a second re-plan follows. At ×4 (one open a cell; the frames in `look-summary.txt`), the readable window came in about half to seven-tenths of U32's time after the first ink on the Nocturne, and under a third of it on the Scherzo. What the second re-plan does depends on the cell (`*__sequence-after.png`): the Nocturne at Bars 4 gains the greyed row under a window that does not move; the Nocturne at Bars 8 goes from four of eight on two rows to six of eight on three, about a twentieth smaller; the Scherzo at Bars 8 goes from eight bars on two rows to three rows, larger. `data-settled` came a little later on the Nocturne and earlier on the Scherzo. **That second re-plan is a deviation from U32's item 4e, taken for the reviewer's order** (current music comfortably readable before look-ahead) and put as Question 1.
- **Pressing Play** (unthrottled, base and final interleaved over two rounds, four opens a cell each, `play-press-summary.txt`): the Nocturne at 342 Bars 4 and Bars 8, the same within the spread; the Scherzo at 390 Bars 2, shorter after, with no overlap between the builds — its long task after the press about halved, as U32 found when the unused sheets were not made; the Scherzo at 342 Bars 4, about half — **and that run no longer has its greyed row.** A run takes a taller stage than the one at rest (531 → 668 px here, `mode-reprice-and-run-stage.txt`) and is re-planned there before its first note; U32 had the sheet for the row, a first run after U32a does not, since no sheet loads in a run. Runs after a stopped fit have it (the renderer now prices the need on the last run's stage too, unit (m)); the first run on a page does not. Question 2.
- **Memory** (after two forced collections, unthrottled, two opens a cell, repeatable within 1 %, `heap-summary.txt`): one engraver fewer on the Nocturne (the heap about a sixth smaller), two fewer on the Scherzo (about two-fifths smaller).
- **The three goods held**, as far as the pictures and the specs read them: nothing drawn wider than natural spacing (window-rule (a) at five shapes, green); no staff under the floor once measured, and the settled window never smaller than U32's in the six cells (the transitional draws above are as before, or readable sooner); the next music where the stage and the sheets allow — unchanged at rest, lost in a first run on the one cell above; the count said in words when it yields.

**Technical verdict:** built and guarded — eight unit cases red on the base, three mutants each killed, the snapshot of 240 short-piece cells identical before and after, window-rule, arrange-race (pinned to Bars 4), perf and fill green on the final. **Pedagogical verdict:** as observations against the three goods, a readable window sooner is a gain on the first good; the greyed row joining a window already drawn is a small late change before any note is played; the Nocturne's Bars-8 window shrinking from four bars to six after the learner may have started reading, and the Scherzo's first run without its row, read worse and are put to the reviewer; *unverified as music* and unverified on a phone.

## Premises, checked at the line

- *"The Nocturne (the 780-bar piece the perf spec uses)"*: the Nocturne op. 48 no. 1 is 81 bars (`notation.bars` in the built catalogue); the 780-bar piece `perf.spec` opens is the Scherzo no. 2. Both were pictured at the cells asked.
- The coordinator's correction 1 (Bars 8 out of this seam): taken. A chooser rule for Question 2 had been written from the verdict's words before the correction arrived; it was removed before any browser run and is not in the diff (the chooser's answer is byte-for-byte the base's logic; the 240-cell snapshot is identical). Measured instead, as asked: a long piece at Bars 8 is priced as a short piece is by construction — unit (i) on the stand-in; the Nocturne settles at six of eight in both builds.
- Correction 2 (the mechanism): as read, with the lines as they now are. `mostSlots` (was ~1747) is in `priceWindowShape` (:1804), priced from the probe's measurement with an assumed sheet count; the effects (`priced`, `sizeTargetAbs`, `windowWhy`, the `mayReshape` counter through `settleShape`, were ~2054–2083) are returned by the pass and applied only by `chooseWindowShape` (:1742), and `canReshape` (:2155) answers the ladder's question without spending a rung; the measurement's wait behind the sheets (was ~4153–4156) is gone (`scheduleMeasure`, :4317). Loading follows every stopped-state re-price: the end of every fit (:3154, which a turn, Size, the count, a new zoom and the measurement all reach) and every step taken while stopped (:1266, for a seek or start bar drawn warm, which has no fit).
- Correction 3 (arrange-race): taken; what the check asserts is under *Done* 4.

## The mechanism, and the discriminating test

**Mechanism as built** (`app/src/score/WindowRenderer.ts`). `create` is unchanged: two sheets for a piece past 48 bars, four and the probe for any other. The probe loads and measures on idle first; its re-plan draws what the sheets that exist can draw. At the end of every fit, and at every step taken while stopped, `scheduleSheet` asks `sheetsNeeded` (:4143): with the piece measured and no run on, it prices the shape with every sheet a stage can hold (`priceWindowShape('slots', stage, MAX_SLOTS)`) and returns the fewest sheets that reproduce that shape exactly — and the same on the last run's stage (`runStage`, recorded by each fit while a run is on, :2889) where that differs, taking the larger. Only the shortfall is loaded, one whole-document load an idle callback, re-priced when the callback fires; the landing re-plans through `updateReadAhead` wherever the cursor is (`sheetLanded`, :4296). No load starts while a run is on or frozen (unchanged from U32, 4h), and a run keeps the arrangement it started with. `data-settled` stays withheld while a sheet is queued or loading. `debugFit().sheets.pending` is the priced need less the loaded sheets. Short pieces never reach the pricing (they have all four).

**The hypothesis and its test.** The reviewer's premise: a side-effect-free pricing pass is possible without extra engravers or slicing, because the chooser's only link to the sheets is `mostSlots`. Alternative: the pricing reads something only a drawn sheet provides, so an assumed count mis-prices. The discriminator: price with an assumed count, make that many, and compare the shape drawn against the shape a renderer holding every sheet draws. Held: on the stand-in the long piece's settled shape equals the short piece's with the same bars (units (c), (h), (i); a throwaway pass over four stages, three bar widths and Bars 1, 2, 4, 8 said the same and was not kept), and in the browser the six cells settle to the same shapes as U32 with fewer sheets. The Play-press relationship moved with the sheet count where the shape was unchanged (the Scherzo at 390 Bars 2), which is U32's hypothesis about the press cost, confirmed from the other side.

## Done

1. **Sheets by the settled shape** (the verdict's required change; decided item 1): as above. A later stopped-state change that needs a sheet loads it before the next run — unit (j) the count, (l) a Size step and a taller stage. No whole-document load inside a run — unit (k), the run-freeze unchanged. No document slicing, no new renderer-ownership abstraction: the pass is a split of the chooser into its pricing and its effects.
2. **Bars 8** (decided item 2): out of this seam by the coordinator's correction 1; measured — a long piece follows the short piece's chooser by construction (unit (i); the pictures).
3. **A run started before later sheets exist** (item 3): freezes with what it has; unit (e), (k), (m); arrange-race's trade on the Nocturne (below).
4. **arrange-race pinned to Bars 4** (item 4), `app/tests/e2e/score.arrange-race.spec.ts`, class *revise*. Bars 4 set by an init script for both runs and asserted (`barsAsked`). The patient run now starts at `data-settled` (after the measurement and any sheet it needs; it waited on `data-measured`, which a long piece's later sheets used to precede and now follow). **The check now:** the two runs' windows are equal — the same `data-slots`, systems and bars shown, and neither frozen blind — except for one allowed difference, the accepted trade: the eager run exactly one slot short, the patient run's extra slot its greyed next row, the eager run holding fewer sheets than the patient's shape uses; the trade is recorded as an annotation. Any other difference fails. On the final the Nocturne takes the trade (both drawn at the same size, the eager run without the row, `arrange-race-final-annotation.txt`); every other piece is exactly equal. T60: the header's stale `fixme` section is replaced by what has held since 2026-09-14 (181ab80c).
5. **Item 5** (U32a's describe and the harness): no per-sheet cut; U108–U110 untouched.
6. **window-rule** (`score.window-rule.spec.ts`), class *revise* in words only: the header's (c), the `MAX_SLOTS` mirror's comment, the (c) fault's comment and message (*can make*), `settle`'s comment and the mid-run case's comment say sheets are made by the shape's need. No assertion changed.
7. **Doc rows**: below.

## Tests: red and green lines, classes

`app/tests/unit/windowRendererStage.test.ts` (27 cases; the U32 describe revised, a U32a describe added):

| Case | Class | Old assumption (if revised) | On the base (`red-unit-base.txt`) |
| --- | --- | --- | --- |
| U32 (b) the sheet the shape needs arrives, greyed row below two systems | revise | every sheet up to `MAX_SLOTS` (4) | red: *the sheets made after the first window … expected 4 to be 3* |
| U32 (e) a run started before idle keeps its sheets | revise | two more owed during the run | red: *expected { made: 2, loaded: 2, pending: 2 } to deeply equal { … pending: 0 }* |
| U32 (g) a short piece makes no sheet after create | revise (one assertion added) | — | green, a guard |
| U32 (a), (c), (d), (f) | preserve | — | green, guards |
| U32a (h) Bars 4: one sheet more for two rows and the greyed row, the short piece's shape | add | — | red: *sheets made … expected 4 to be 3* |
| U32a (i) Bars 8: priced as the short piece, three sheets | add | — | red: *expected { made: 4, loaded: 4 … } to deeply equal { made: 3, loaded: 3 … }* (the shape itself equal on the base) |
| U32a (j) a stopped count change that needs one more loads it | add | — | red: *two bars … expected { made: 4 … } to deeply equal { made: 3 … }* |
| U32a (k) no load while a run is on, even for a count changed during it | add | — | red: *measured, and the sheet … queued, not made: expected { … pending: 2 } to deeply equal { … pending: 1 }* |
| U32a (l) a Size step, and a taller stage, each load the sheet they need | add | — | red: *at 100 % … expected { made: 4 … } to deeply equal { made: 2 … }* |
| U32a (m) a run on a taller stage: the first keeps what it has, the next has the row | add | — | red: *at rest two bars fill the stage: expected { made: 4 … } to deeply equal { made: 2 … }* |
| U74, U82 describes | preserve | — | green |

After: 27 of 27 (`unit-stage-after.txt`); with `slots.test.ts` and `slotsFromEvidence.test.ts`, 67 of 67 (`unit-files-after.txt`).

Browser (the edited specs, run against both builds):

- `score.arrange-race.spec.ts` on the base: **red on the Scherzo, not on sheets** — *2 slots (2 systems, 4 bars) on 4 sheets … when started at once, 3 slots (… a greyed next row) on 4 sheets … when started after everything landed* (`arrange-race-base.txt`). Both runs had every sheet, the same window at the same scale; the greyed row was priced differently. On the final, green: the Scherzo's two runs are equal (two sheets each), the Nocturne takes the trade. So the pinned case does not discriminate U32a (a guard) and it did find something on the base: Follow-up 1.
- `score.window-rule.spec.ts` (11 tests, five shapes), `perf.spec.ts` (6), `score.fill.spec.ts` (3), `score.arrange-race.spec.ts` (1) on the final at two workers: **21 passed** (`e2e-targeted-final.txt`).
- The slot snapshot (U32's probe, `scripts-zz-u32a-slot-snapshot.spec.ts`): 240 cells (12 pieces of 48 bars or fewer × 5 shapes × Bars 1, 2, 4, 8), **0 differences** before against after (`slot-snapshot-diff.txt`) — the chooser split changed no short piece's shape, zoom, transform or sheet count.

## Mutants (the brief's kind, plus the run stage), each killed

| Mutant | Edit | Killed by |
| --- | --- | --- |
| 1, the pass loading `MAX_SLOTS` again | `sheetsNeeded` returns `MAX_SLOTS` once priceable | unit (b), (e), (h), (i), (j), (k), (l), (m) |
| 2, a load inside a run | every running/frozen guard on the sheet path removed | unit (e) *engravers made while the run was on: expected 4 to be 3*, (k) *expected 5 to be 3*, (m) *expected 4 to be 3* |
| 3, the run's stage not priced | `alsoRun` false | unit (m) *the sheet the run's shape needs, made once it stopped* |

Logs: `mutant-*-unit.txt`; the edits: `scripts-make-mutants.py`. Not tried as browser mutants: each is a unit-level mechanism and the unit harness drives the real renderer.

## Not done

- The map's whole set of 28 specs and the state gallery were not run: the coordinator scoped the browser layer to `perf.spec`, `arrange-race` and U32's named specs (window-rule, fill); the chooser's answer for every short piece is shown unchanged by the 240-cell snapshot instead. CI is the full run.
- The corpus legs of the two long pieces (U32 item 9): not run; the six pictured cells settle identically.
- The second run's greyed row on the Scherzo (unit (m)) was not driven in the browser: a run cannot be stopped there without finishing it or restarting it through a mode change (which restarts in the same task, leaving no idle time for a load). Unit-proven only.
- Mid-run pictures: not asked this time, not taken.

## Deviations, each with its reason

1. **Two re-plans after the first paint where the shape needs a sheet** (U32 item 4e: at most one). Holding the measurement's re-plan until the sheet lands would keep the under-floor first draw on the glass for a whole-document load (on the Nocturne's Bars 8, a 7 px staff), which puts look-ahead before comfortable reading; the frames are in `look-summary.txt`, the pictures in `*__sequence-after.png`. Question 1.
2. **The need is priced on the last run's stage too** (`runStage`). The verdict's words are the settled shape; the run's shape is re-planned on a taller stage, and without this every run on such a cell loses the greyed row U32 gave it. The first run still does (the verdict's answer to U32's question 3). Mutant 3.
3. **A step taken while stopped also asks for sheets** (`showStep`): a seek or a start bar drawn warm has no fit to ask at its end, and the coordinator asked that every stopped-state re-price can load.
4. **arrange-race's patient run waits for `data-settled`**, not `data-measured` (correction 3: the wait follows the new order).
5. **The probes write outside `test-results/`** (`build/u32a/out/`): the first round of the Play-press probe on the base was emptied by the next run's clean; its lines, read at the time, are kept in `play-press-base-round0.txt` and agree with the later rounds.
6. **The first paint is shot with idle callbacks held** (`U32A_HOLD=1`, unthrottled): under ×4 the harness's screenshot came after the re-plans on some cells; the intermediate picture likewise holds every idle callback asked after `data-measured` (`U32A_HOLD=sheets`).
7. **The heap is read after forced collections** (CDP), where U32 read `performance.memory`, whose single samples moved with collection timing (both kept: the throttled look's figures are in `look-summary.txt`).

## Follow-ups (recorded, not fixed)

1. **P2, attached to U78 (responsive-reading): the greyed row priced two ways for the same stage.** On the base, arrange-race at Bars 4 froze the Scherzo with and without the greyed row depending on when Play was tapped, both runs holding all four sheets, the same window at the same scale. Hypotheses: the row priced at the drawn rows when the shape is already on the glass and at the reserve when it is not (the eager run reaches its shape during the freeze), or the run's stage growing in two steps (531 → 583 → 668) against the freeze. On the final the case passes without exercising it, since neither run has a third sheet. Discriminating test: arrange-race's Scherzo on the base with the stage height and `debugFit().priced` logged at the freeze.
2. **Observation: a paused run is a run** (`session.running` stays true), so no sheet loads during a pause; the arrangement cannot change until the run ends anyway. No row.
3. **Observation: the row's sentence at Bars 8.** Unchanged, as the chooser is.
4. U108 (a bar past 48 shrinks a frozen run), U109 (the first notes wait behind post-paint work), U110 (the gallery's end-of-piece race): untouched, still current.

## Questions for the reviewer

1. **The order after the measurement.** As built, the window is drawn readable from the two sheets as soon as the piece is measured, and a sheet the settled shape needs follows with a second re-plan (on the Nocturne's Bars 8 that re-plan shrinks four readable bars to six smaller ones). The alternative holds the measurement's re-plan until the sheet lands: one re-plan, the under-floor first draw kept for one more whole-document load. Keep readable-first?
2. **The first run on a taller run stage.** A run's stage is taller than the stage at rest (the chrome folds), so a run can have room for a greyed row the stage at rest does not; U32 had the sheet for it, U32a's first run on a page does not (the Scherzo at 342 × 740, Bars 4), later runs do. Covering the first run needs the renderer to know the run's stage before it starts — the Score screen's layout (`ScoreScreen.ts`, G86a's) — or a spare sheet made on speculation, which is the cost this change removes. Accept as the question-3 trade, or a lane?
3. **Bars 8** (your question 2, out of this seam): with the order above, a learner opening the Nocturne at Bars 8 now sees four of eight readable for a sheet load before the settled six of eight; the pictures (`nocturne__342x740__bars-8__sequence-after.png`) are the input for that product decision.

## Exit codes

- `npx tsc -b`: 0 (`tsc.txt`). `npm run lint`: 0 (`lint.txt`), with the lane's config copy and probes out of `app/`. `npm run build:app`: 0 (`build-app-final.txt`).
- `npx vitest run tests/unit/windowRendererStage.test.ts`: 27 passed, exit 0; with the two slots files, 67 passed, exit 0.
- Whole `npx vitest run`: exit 1 — 7,406 passed, 4 failed: the two `lessonClaimsAboutApp` line-ending claims (CRLF checkout, Entry 101), and `midiParity` and `taughtByAncestry` on inputs a fresh worktree lacks; with those written or copied the two files pass, 80 passed, exit 0 (`vitest-all-summary.txt`, `vitest-env-rerun.txt`).
- Browser on the final, two workers: window-rule, perf, fill, arrange-race — 21 passed, exit 0. arrange-race on the base: exit 1 (the Scherzo, Follow-up 1). Slot snapshot: 61 passed on each build, exit 0; diff 0. Probes: every run exit 0.
- `perf.spec.ts` whole at one worker, base and final interleaved twice: 6 passed each, exit 0; the Scherzo's first window on the final inside the base's spread, the 2-bar median inside the base's own drift between its passes (`perf-interleaved.txt`).
- `python tools/docs/checks_for_paths.py` over the touched files: exit 0 (`checks-for-paths.txt`): tsc, lint, the whole unit suite, the app build, the 28 score specs at four workers, the state gallery, and for the entry the record mirrors and their test. `python tools/docs/record_mirrors.py --check`: fresh, exit 0; `test_record_mirrors.py`: 36 OK.

## Not run as the map writes it

Port 4531 through a config copy, not 4173; two workers for the targeted specs, one for the probes; `vite preview` serving kept build folders, not `npm run build:app && npm run preview`; four of the map's 28 specs (the coordinator's scope); the state gallery not run; `record_mirrors.py` run with `--check` only (the entry changes no brief's Record block).

## Unverified

A device; any sound (nothing here is heard); the second run's greyed row in the browser (unit only); the time course beyond one throttled open a cell; CI on this tree.

## Files

- `app/src/score/WindowRenderer.ts` — `priceWindowShape` split from `chooseWindowShape`; `canReshape`; `sheetsNeeded`, `sheetsWanted`, `runStage`; `scheduleSheet` by need, from the end of every fit and every stopped step; `sheetLanded` re-plans through `updateReadAhead`; `scheduleMeasure` no longer waits for sheets; comments on `MAX_SLOTS`, `create`, `debugFit`.
- `app/tests/unit/windowRendererStage.test.ts` — U32's (b), (e), (g) revised; the U32a describe (h)–(m).
- `app/tests/e2e/score.arrange-race.spec.ts` — Bars 4, the patient run at `data-settled`, the window check with the trade, the header (T60).
- `app/tests/e2e/score.window-rule.spec.ts` — comments and one message.
- `docs/04-ui-spec.md`, `docs/08-score-render-states.md`, `docs/08-test-map.md` — below.
- `docs/prompts/pictures/u32a/` — 15 pictures; `docs/prompts/runs/U32a/` — this entry, the summaries, the logs under 300 KB, the probes and scripts (`scripts-*`).

## Doc rows

- `docs/04-ui-spec.md` §5, the probe's first-draw sentence (:1868): a long piece is measured before any sheet past its first two is made (U32a). Rule 2's last sentence: a long piece gets the sheets its settled shape needs once measured; a change made while stopped (count, Size, a turn, a start bar) that needs a sheet loads it before the next run, and so does a row a run's taller stage has room for, once one run has been played; a run started before then plays without it. *A run keeps its arrangement once started* stands unchanged.
- `docs/08-score-render-states.md` §3.2 item 1 (the probe comes before any sheet; its re-plan brings the window to size, a sheet it is short of follows), §4.1 (the SLOTS paragraph: priced sheets, the second re-plan, every stopped fit or step re-prices, the last run's stage, no load in a run), §9 invariant 7 (the sheets the settled shape needs).
- `docs/08-test-map.md`: the systems row (arrange-race at Bars 4, the patient wait, the check), the first-window row (the U32a describe), the `score.arrange-race` line, the `score.window-rule` (c) line.
- `docs/prompts/checks.json`: unchanged (U32 already added `perf.spec.ts` to the `app/src/score/**` row, and the reviewer read it back as correct).
