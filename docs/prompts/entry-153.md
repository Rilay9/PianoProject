### Entry 153 — G87 — the project sheet's date box wears the sheet's own input look, a project stage's *Start* line names what it opens and no more, and a project's badge on the Stage 9 page loses the pass style's tick (G1b's follow-ups 3 and 6; the coordinator's item 3, found by G85's builder; P3) (2026-09-29)

**Judgement.** Nothing was heard, and G87 claims nothing about music. What I looked at: the app built from this tree and from the committed code (ea14b1fe) on port 4463, at 342 × 740, the sheet in light and dark (`pictures/g87/`, the computed looks and the Start lines in `before-facts.json` and `after-facts.json`, compared in `runs/G87/compare-facts.txt`); the code.

- **The sheet's date box, before** (`before-sheet-342x740.png`, `before-sheet-actions-342x740.png`, observed): beside *I performed it · When*, a small box with a grey inset border, square corners, the browser's small default type in a monospace face — alone among the sheet's controls, whose goal and problem boxes below it are rounded, filled with the page's colour and a touch target tall. In dark (`before-sheet-actions-dark-342x740.png`) a grey box with a light inset edge, unlike the dark fields under it.
- **After** (`after-sheet-342x740.png`, `after-sheet-actions-342x740.png`, `after-sheet-dark-342x740.png`, observed): the date box is drawn as the goal box is — the same face, type size, border, corners, padding, fill and text colour, light and dark (the computed looks equal, `compare-facts.txt`), and as tall. It is still the browser's control: its calendar button, today's date, no day after today. It stays on the *I performed it · When* line at 342 px, inside the screen's edge; the actions row grows by the box's new height, and the notes below move down by that.
- **The Stage 9 page's Start line, before** (`before-stage9-342x740.png`, observed): *Opens "Hanon No. 20 (C major) — both", the first thing on this rung.* two lines above *A project: there is no rung to pass here.* **After** (`after-stage9-342x740.png`): *Opens "Hanon No. 20 (C major) — both".* — the same pick, the clause gone. **A Stage 1 page** (`1.1`, `before-/after-stage1-342x740.png`): *Opens "Right-hand five-finger walk", the first thing on this rung.* — the Start block's HTML byte-equal before and after.
- **Item 3, a paused project's row on the Stage 9 page** (`before-/after-stage9-paused-342x740.png`, `-row-` crops, observed): before, the Ballade's badge read **✓ Paused** in the accent colour — the pass style's tick on a stated intention. After, **Paused** in the neutral pill, drawn exactly as *not started* is on the rows under it (same colour, no mark; `compare-facts.txt`); *not started* itself unchanged.
- **As observations against the rules, never a gate.** The date box's digits are in the browser's own order (*09/29/2026* in these pictures) while the sheet's lines say *2026-09-29*: the native control's format, kept, since the brief keeps the picker's behaviour (Follow-ups 2). The face the date box now shares with the sheet's text boxes is the browser's control face, not the app's face the sheet's words are set in (Follow-ups 1). On the Stage 9 page Start opens an exercise (Hanon) on a page about choosing a piece, and each song row still offers *Know it* (Follow-ups 3, 4). The line is true now; whether Start and *Know it* belong on a project page is a product question, **unverified as pedagogy**.

## The mechanism

**The date box.** The sheet's input rule is `.sheet__body input[type='text'], .sheet__body input[type='number']` (`style.css` 3807–3816 at HEAD); the date input (`projectSheet.ts` 135) sits in the same `.sheet__body` but is `type='date'`, so no author rule reached it and the browser's own stylesheet drew it. *Hypothesis:* no rule reaches the date type. *Alternative:* a rule reaches it and loses to the browser's (specificity, `appearance`). *Discriminating test:* the committed build's computed look of the box is the browser's defaults exactly — an inset border, square corners, the small default size and, in Chromium, `monospace` (its own date-input rule) — and the unit case finds no rule in `style.css` whose selector the date box matches (`red/red-vitest-final-tests-head-sources.txt`: *no rule in style.css reaches the date box*). The first held. *The change:* one rule beside the sheet's rule, `.sheet__body input[type='date']`, with that rule's box, border, corners, fill, colour and size, and `font: -webkit-small-control` before the size — the face the browser gives every other input (a probe of the browser with no author CSS gave a text box that face and a date box `monospace`; with the rule the two faces are equal). Why not `font: inherit`: the sheet's text boxes are in the browser's control face, not the app's, so `inherit` would give the date box a face its neighbours do not have. Why a rule of its own rather than one more selector on the text rule: the face needs its own declaration anyway, and the browser case holds the date box's look equal to the goal box's, so the two cannot drift apart unseen. `projectSheet.ts` is unchanged: the input already carries what the rule targets.

**The Start line.** `LessonScreen.drawStart` said *the first thing on this rung* whenever Start's pick was the rung's first option (D3c); on a Stage 9 unit the first exercise is usually the pick, so the page that says there is no rung to pass called it the first thing on this rung. The condition now reads `target.id === first && !isProjectRung(rung)`: `isProjectRung` is the lesson page's own reading of `projectStore.PROJECT_STAGES`, the one that already hides the count, the state badge and the learner's word on that page (G1b), and the constant Plan reads (G1c). *Discriminating test:* the unit case for a Stage 9 unit red on the committed code while the Stage 1 case beside it is green; after, both green; a mutant that drops the clause everywhere turns the Stage 1 case red.

**Item 3, the badge.** `LessonScreen.optionRow` drew a project stage's song badge with `badge(words, project ? 'passed' : 'neutral')`, and `.badge[data-kind='passed']::before` draws `✓ ` in the accent colour — so every project state, *Paused* and *Put away* among them, wore the pass mark. The badge is now `'neutral'` for every state. *Test:* the paused case and the every-state case red on the committed code (`kind: 'passed'`), green after; a mutant that keeps the pass style for all but *paused* and *put away* is caught by the every-state case.

**Premises of the brief, corrected at the lines** (`operating-procedure.md` §13):

1. *"G1b's follow-ups 3 and 7"*, with 3 named as the date box and 7 as the Start line — in Entry 138 follow-up 3 is the Start line (line 80), 6 the date box (line 83) and 7 the history view (line 84); the backlog's G87 row says *follow-ups 3, 6, 7*. G87 built 3 and 6; 7 stays recorded, as the brief's item 3 says in words.
2. *"`isProjectStage` (about 201 onward)"* in `LessonScreen.ts` — the lesson page's function there is `isProjectRung(rung)` (206–209: the rung's stage, then `PROJECT_STAGES.has`); `isProjectStage(stage)` is `PlanScreen.ts`'s (G1c). Same constant; `isProjectRung` used.
3. *"`.sheet` (about 3780)"* — 3767; the sheet's inputs rule 3807–3816. The sheet's inputs share no class; the rule they share is `.sheet__body input[type=…]`, so the new rule is `.sheet__body input[type='date']`, no id or class needed.
4. *The Start case "the pattern of `planProjectStage.test.ts`"* — that file mounts Plan with its stores mocked; the lesson page needs other stores, and `stage9ProjectsPage.test.ts` is the Stage 9 page's own screen test with a Stage 1 rung beside it. The cases went there, in the pattern (the project stage changes, the ordinary stage held as before). Item 3's cases too.
5. *"`projects.spec.ts` (the sheet's cases and pictures)"* — it takes no pictures; the pictures come from a probe spec copied into `tests/e2e/` for its runs and removed, writing under the worktree's `build/` and copied into `pictures/g87/` by hand.

## Done

1. **Item 1, the date box** — one rule beside the sheet's rules (after 3816, not at the file's end). Technical: done; light and dark pictured at 342 × 740 before and after; **Chromium only** (Firefox and WebKit are not installed here: the face rule is unverified there).
2. **Item 2, the Start line** — a project stage's line is *Opens "X".*; every other stage's line unchanged (the Stage 1 block byte-equal; the unit case). Technical: done.
3. **Item 3 (the coordinator's), the project badge** — neutral for every project state; *not started* unchanged. Technical: done. Found by G85's builder; the reviewer's Library ruling: a badge is a stated intention, never a pass.
4. **The brief's item 3, nothing else** — the history view, the sheet's actions and states, `projectStore.ts`, Plan, the Library, the session: not opened. `projectSheet.ts` not changed.
5. **Items 4 and 5, red first** — the unit cases and the browser cases, each red on the committed code at the claim, green after (the red lines below).

## Not done

1. **The docs are rows, not edits** (the brief) — `

**Orchestrator's note at the landing (2026-09-29).** G87's worktree committed by name (8f2a1e73) and merged (25a0bc9c). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/G87/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 1; e2e-targeted 1; e2e-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner — the targeted specs' failures passed alone (`e2e-rerun`); the note names them — the spec-existence step read an empty list because the map names the whole suite, and said so; `runs/G87/orchestrator-exit.txt`). G1b's follow-ups 3 and 7 (P3), released by G1b's acceptance. Landed in one chain with G1e under your batching conditions (`responses/questions-b11e4f89.md`): the map's minimum over the union of both merges' paths (c41042e4 to 25a0bc9c) fell back to the whole suites, so the whole browser suite ran here: 841 of 843 passed; the two reds (`help-strip.spec.ts`'s first-card case, `wide.spec.ts`'s sparse-bar case; files neither seam touches) passed alone. The merge onto main met G1e's and G85's test blocks in `projects.spec.ts` (both kept). The two whole-suite unit logs over 300 KB are kept out of the record.

## Doc rows` below.
2. **`audio.spec.ts` › *pressing "Test sound"*** — red in the full run because it expects the literal `http://localhost:4173/…` and the lane serves 4463; it cannot pass on any port but 4173, which this lane may not use. **Unverified here**; CI runs it on the default port (Follow-ups 5).
3. **The state gallery** (`playwright.states.config.ts`) was not run: the map names the default suite, not the gallery, for these paths.
4. **The whole unit suite on the final tree is two runs, not one clean one** — the final run met a machine out of breath (worker forks crashing, `spawn UNKNOWN`, 5 s timeouts, two files not started); its 24 failed files were rerun at two workers and passed but for the recorded pair (below). The disk had under a gigabyte free in the full browser run (two `ENOSPC` reds); this worktree's own copied caches were deleted to make room (`content/scores/imported/{kern,musetrainer,mutopia}`, `build/cache`, the first run's `build/test-results-g87`).

## Follow-ups (recorded, not fixed)

1. **P3 — the sheet's text and number boxes are in the browser's control face**, not the app's face the sheet's words use (the goal box's computed family is the browser's control font here). The date box now matches them. `font: inherit` on both sheet input rules would put every sheet box in the app's face — every sheet's inputs, not G87's.
2. **P3 — the date box shows the browser's locale format** (*09/29/2026* in these pictures) beside the sheet's *2026-09-29*; the native control's, kept by the brief.
3. **P3 — Start on a project stage's page opens the unit's first exercise** (Hanon No. 20 on `classical.9`) on a page about choosing a piece; true now; whether a project page offers Start, or opens a piece, is product — **unverified as pedagogy**.
4. **P3 — each Stage 9 song row still offers *Know it*** (the learner's word that a piece is passed) on a page that says there is no rung to pass; seen in `after-stage9-paused-342x740.png`, not G87's.
5. **P3 — `audio.spec.ts` hard-codes port 4173** in an expected URL, so every lane config on another port fails it by construction; `baseURL` would serve.
6. **G1b's follow-up 7** (a whole-history view) stays recorded (the brief's item 3).

## Questions

1. **The face.** `-webkit-small-control` (the browser's control face, as the sheet's text boxes) against `inherit` (the app's face, unlike the boxes beside it). I took the first because the brief asks the date box to match the sheet's other input; Follow-ups 1 is the way to the second for every sheet box at once.

## Red lines (`runs/G87/red/`)

- `red-vitest-committed-code.txt` — the two unit files as first written, on the committed code: 2 of 15 red — *expected 'Opens "Title of 9", the first thing o…' to be 'Opens "Title of 9".'*; *no sheet rule in style.css reaches the date box*. The Stage 1 case green on both sides by design.
- `red-e2e-committed-app.txt` — the two browser cases on the committed code's build at 342 × 740: the date box's computed look (a monospace face, the browser's small default size, an inset border, square corners, no padding, the browser's fill) against the goal box's, every property unequal but weight and style; the Stage 1 line passed, then *Received: "Opens "Hanon No. 20 (C major) — both", the first thing on this rung."*
- `red-vitest-item3-badge.txt` — item 3's two cases on the tree before the badge change: *expected { word: 'Paused', kind: 'passed' } to deeply equal { word: 'Paused', kind: 'neutral' }*; every one of the eight states `passed`.
- `red-vitest-final-tests-head-sources.txt` — the final tests over HEAD's `style.css` and `LessonScreen.ts` (this tree's written back, sha256 checked; `scripts-final_tests_head_sources.py`): the four G87 cases red (the date rule, the Start line, paused, every state); `lessonClaimsAboutApp`'s two recorded reds, identical to this tree's.
- `mutants.txt` — 8 mutants (`scripts-mutants.py`, each file restored by sha256), 8 caught: the clause dropped everywhere; the committed condition; the badge back in the pass style; the pass style kept for all but paused and put away; the face line dropped; the corners dropped; the type size changed; the selector naming another type.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `app/tests/unit/projectSheet.test.ts` › *the date box beside I performed it wears the sheet's input look* | add | — | a rule of `style.css` reaches the date box and declares the goal box's min-height, padding, border, radius, fill, colour and size, and a face; the box still `type=date`, today, `max` today |
| `app/tests/unit/stage9ProjectsPage.test.ts` › *its Start line names what Start opens and no more*; *its Start line still calls its first option the first thing on this rung*; *a paused project's badge says Paused with no tick*; *no project state wears the tick* | add | — | a Stage 9 unit's line *Opens "X".*; a Stage 1 rung's line unchanged; *Paused* neutral; all eight states neutral, *not started* neutral |
| `app/tests/e2e/projects.spec.ts` › *the project sheet's date box … (G87)*; *a Stage 9 page's Start line … (G87)* | add | — | at 342 × 740: the date box's computed face, size, weight, style, four borders, four corners, four paddings, min-height, fill and colour equal the goal box's, the box inside the screen, still the browser's date control; `1.1`'s line with the clause, `classical.9`'s without |
| the rest of `projectSheet.test.ts`, `stage9ProjectsPage.test.ts`, `projects.spec.ts`; `lessonPagePicksPassTheAdmission`, `planProjectStage` and the lesson-page, Plan and project files | preserve | — | green |

## Exit codes (each capture ends with its exit)

| Run | Exit | What it said |
| --- | --- | --- |
| `npm ci` (`npm-ci.log`); copies from the main checkout (`copy.txt`, `copy-mutopia.txt`); parity reference (`parity.log`) | 0; 0 each; 0 | eight reference files |
| `build.py --offline` (`content-build.log`), then again with the mutopia edition (`content-build-2.log`) | 0, 0 | the first build made the Joplin mutopia item a placeholder (its edition not copied); the second's inventory and rung claims equal HEAD's but for line endings; the three reports put back to HEAD's bytes (`restore-reports.txt`: clean) |
| vitest, the new cases on the committed code (`red/red-vitest-committed-code.txt`) | 1 | the red above |
| committed code's app into `build/dist-head` (`build-app-head.txt`) | 0 | before any source change |
| Playwright 4463, the new cases on the committed build (`red/red-e2e-committed-app.txt`) | 1 | the red above |
| pictures on the committed build (`pictures-before.txt`, `pictures-before-2.txt` with item 3) | 0, 0 | — |
| vitest, sixteen project-sheet, lesson-page and Plan files (`green-sheet-lesson-plan.txt`); the two G87 files (`green-sheet-2.txt`, `green-item3.txt`, `green-final.txt`) | **0**; **0**, **0**, **0** | 16 files, 150 tests; 17 tests in the two files at the end |
| vitest, item 3's cases before the change (`red/red-vitest-item3-badge.txt`) | 1 | the red above |
| `npx tsc -b` (`tsc.txt`, `tsc-final.txt`) | **0**, **0** | — |
| `npm run lint` (`lint-1.txt`, `lint-final.txt`) | 1, **0** | first: only the lane's Playwright config, which no tsconfig includes (kept, not for the commit); final: with it moved aside for the run and put back |
| `npm run build:app` (`build-app.txt`, `build-app-2.txt` on the second content build, `build-app-3.txt` with item 3), no preview running | **0**, **0**, **0** | — |
| pictures on the changed build (`pictures-after.txt`, `pictures-after-2.txt`); the facts compared (`compare-facts.txt`) | 0, 0; **0** | 16 of 16 checks |
| Playwright 4463, two workers, the map's five specs for `LessonScreen.ts` (`e2e-targeted-4463.txt`; again on the item-3 build, `e2e-lesson-4463.txt`) | **0**; 1 | 45 passed; then 44 and `lesson-flow` › *a run played from Today* played one note short under load — rerun alone, green (`rerun-lesson-flow.txt`, **0**) |
| Playwright 4463, two workers, the whole suite the map names for `style.css`, every spec file listed and checked present (`e2e-full-4463.txt`) | 1 | 844 tests: 817 passed, 7 skipped, 20 failed — `audio` (the hard-coded port, Not done 2); `doors` › *Open as…* and `side-panel-prose` (timeouts) and `score-fit-paths`, `score.arrange-race` (`ENOSPC` at the context's close) — each file rerun alone, green (`rerun-doors.txt`, `rerun-side-panel-prose.txt`, `rerun-score-fit-paths.txt`, `rerun-score.arrange-race.txt`, **0** each); fifteen screenshots with no `-win32` reference in a fresh worktree |
| the fifteen screenshots: the baseline written from the committed code's build (`snapshots-baseline-head.txt`), then compared on the final build (`snapshots-compare.txt`) | 0; **0** | 15 passed: the score screen's pictures equal the committed code's |
| vitest, the whole suite (`vitest-full.txt`, before item 3) | 1 | 312 files: 3 failed — the two recorded `lessonClaimsAboutApp` reds (a literal `\n` searched for in this CRLF checkout, Entry 101's diagnosis; red identically over HEAD's sources) and `expectedNote` › *every black key…* at the 5 s timeout |
| vitest, the whole suite on the final tree (`vitest-full-final.txt`) | 1 | the machine thrashing: worker crashes, `spawn UNKNOWN`, 15 timeouts, 24 files failed |
| vitest, those 24 files at two workers (`vitest-rerun-failed.txt`) | 1 | 983 tests: all green but the two recorded `lessonClaimsAboutApp` reds; `expectedNote` green |
| mutants (`mutants.txt`) | harness 0 | 8 of 8 caught |
| `checks_for_paths.py` on the changed paths (`checks-for-paths.txt`) | 0 | 8 paths, 8 matched, 0 unmatched: tsc, lint, the unit suite, the app build, the whole e2e suite (`style.css`) |

**Unverified**, beside what passes: the date box's face in Firefox and WebKit (not installed here); the sheet at widths other than 342; the words and the badge as pedagogy; `audio.spec.ts` on this tree (port); the whole unit suite in one clean pass on the final tree (two passes cover it); the state gallery; **CI has not run this tree.**

## Files

In the worktree `agent-a351bd155eb5de958`, cut from ea14b1fe; nothing committed, nothing staged.

- Changed, in the brief's list: `app/src/style.css` (one rule after the sheet's inputs rule), `app/src/ui/screens/LessonScreen.ts` (the Start line's condition; item 3's badge kind), `app/tests/unit/projectSheet.test.ts`, `app/tests/e2e/projects.spec.ts` (two cases and a helper, appended).
- Changed, outside the named tests, and why: `app/tests/unit/stage9ProjectsPage.test.ts` (four cases — the Stage 9 page's own screen test, Premises 4).
- New: `docs/prompts/tasks/G87-project-sheet-small-truths.md` (the brief, copied from the main checkout); `pictures/g87/` (before and after: the sheet, its actions row, both dark; `stage9`, `stage1`, `stage9-paused` and its row; the two facts files); `runs/G87/` (the captures above, `red/`, and the scripts as they ran: `scripts-setup.sh`, `scripts-setup-mutopia.sh`, `scripts-vitest.sh`, `scripts-build_app.sh`, `scripts-playwright.sh`, `scripts-chain.sh`, `scripts-chain-2.sh`, `scripts-zz-g87-pictures.spec.ts`, `scripts-compare_facts.py`, `scripts-final_tests_head_sources.py`, `scripts-mutants.py`, `scripts-restore_reports.py`, `scripts-sanitise.py`; machine paths replaced by `<worktree>`, `<main checkout>`, `<home>`).
- Kept, not for the commit: `app/playwright.g87-4463.config.ts` (the lane's config).
- Not touched: `projectSheet.ts`, `help.ts`, `projectStore.ts`, `session.ts`, `TodayScreen.ts`, `LibraryScreen.ts`, `SkillsScreen.ts`, `DrillScreen.ts`, `sessionRunner.ts`, `tools/content/`, `content/`.
- Run through and put back to HEAD's bytes, so not changed: `content/scores/imported/SOURCES.md`, `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md` (the offline build).

## Doc rows

**`docs/04-ui-spec.md` §3e, the bullet *And what will it do*** — after "…the longer line would be false about that row." add:

> And never on a project stage's page (G87): a unit of a stage in `projectStore.PROJECT_STAGES` says *A project: there is no rung to pass here.*, so its line is *Opens "X".* whatever Start opens — the same constant the page's other presentation and Plan read.

**`docs/04-ui-spec.md` §3f, the paragraph *A project stage's page (G1b; L86)*** — "…each song option a badge of the learner's project state (`PROJECT_TEXT.states`) or *not started*." becomes "…each song option a badge of the learner's project state (`PROJECT_TEXT.states`) or *not started*, every one in the neutral style — no tick, no accent: a project state is a stated intention, never a pass (G87 item 3; the reviewer's Library ruling)."; and after "Changing one project changes that row alone." add "Start's line there names what it opens and no more (§3e, G87)."

**`docs/04-ui-spec.md` §5, the paragraph *What next with this piece? (G1b)*** — "*I performed it* with a date" becomes "*I performed it* with a date (the date box in the sheet's input look — the goal box's face, size, border, corners and height, light and dark; still the browser's date control and picker, G87)".

**`docs/08-test-map.md`, the state-machine table, the row *The learner's projects* (G1b)** — the first cell gains ", the sheet's date box and a project stage's Start line and badges (G87)"; the faults gain "the date box drawn as the browser's own control; a project stage's Start line calling its pick the first thing on this rung; a project badge in the pass style (G87)"; the tests gain "`projectSheet.test.ts`, `stage9ProjectsPage.test.ts`, `projects.spec.ts` (cases added, G87) — red on the committed code; 8 mutants caught"; the status gains "; the date box, the Start line and the badge done (G87, Entry 153), nothing heard".

**`docs/08-test-map.md`, the file lists** — `projects.spec.ts` gains "; the sheet's date box wearing the goal box's computed look at 342 × 740, and a Stage 9 page's Start line without *the first thing on this rung* beside a Stage 1 page's with it (G87)"; `projectSheet.test.ts` gains "; a rule of `style.css` reaching the date box with the text box's box, border, corners and size, and a face (G87)"; `stage9ProjectsPage.test.ts` gains "; the Start line naming what it opens and no more, an ordinary rung's line as before; a project badge neutral in every state, *Paused* with no tick (G87)".

**`docs/prompts/backlog-2026-09-25.md`, the row G87** — status: "built (G87, Entry 153): the date box styled with the sheet's rule (follow-up 6), the Start line's words for a project stage (follow-up 3), and a project badge without the pass style's tick (item 3); the history view (follow-up 7) stays recorded; closes on review".
