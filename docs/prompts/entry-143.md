### Entry 143 — U92 — a Skills row's detail never shows a wrong number: it leads with the count, "15 to practise · Stage 2 · core", and takes the lines it needs beside Drill it and Find more on every font, with an ellipsis where a word is still cut; red first on the stack and under the wide face, green after (2026-09-29)

U90's follow-up 1 (P2), repaired on its own as the reviewer ruled (`responses/994586f9.md`), under the brief `docs/prompts/tasks/U92-skills-count-never-cut.md`, on base 9007d68a. Every capture is in `docs/prompts/runs/U92/`; each run's `.txt` starts with its command and ends with `exit=<code>`, except the derived files (`*-summary.txt`, `compare-probe.txt`'s body, the failing-name lists). The pictures are in `docs/prompts/pictures/u92/`, named `<before|after|count-first-ellipsis>-<stack|wide>-<shifting|longest>-342x740.png`, plus `wide.spec.ts`'s two Skills scenes after. "Stack" is the app's own font stack, which draws Segoe UI here (U90's CDP reading); "wide" is U90's forced face, `body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }`. Nothing was heard; nothing here is music.

## Judgement

I looked at the two rows U90 pictured, at 342 × 740, before and after, on the stack and under the wide face, and read every row the list draws over every stage in both faces (the probe, `scripts-u92-probe.spec.ts`).

- **"Shifting position" (Stage 2, fifteen exercises under it).**
  - **Stack, before** (`before-stack-shifting-342x740.png`): the detail reads "Stage 2 · core · 1" beside *Drill it* and *Find more*, with *Show all 15* a few rows below it. The line stops at the row's edge with no mark. A learner reads one exercise.
  - **Wide, before** (`before-wide-shifting-342x740.png`): "Stage 2 · co".
  - **Stack, after** (`after-stack-shifting-342x740.png`): "15 to practise ·" over "Stage 2 · core", under the two-line name, the buttons centred at the right. One entry; the count first and whole.
  - **Wide, after** (`after-wide-shifting-342x740.png`): "15 to / practise · / Stage 2 · / core", four short lines in the column the buttons leave. True and whole, and narrow.
- **"Primary chords with the dominant seventh" (Stage 3, twenty-five under it).**
  - **Stack, before** (`before-stack-longest-342x740.png`): "Stage 3 · core · 2". **After** (`after-stack-longest-342x740.png`): "25 to practise ·" over "Stage 3 · core", under the four-line name.
  - **Wide, before** (`before-wide-longest-342x740.png`): "Stage 3 · co". **After** (`after-wide-longest-342x740.png`): "25 to / practise · / Stage 3 · / core" under a five-line name. It is the tallest concept row on the list under that face, and it still reads as one entry.
  - A highlighted exercise row under it in these pictures (a different one before and after) is the pointer resting where *Show all* was pressed, not a state.
- **Every row, both faces** (`compare-probe.txt`, from `probe-before-*.json` and `probe-after-*.json`; 285 concept rows and 418 exercise rows).
  - **Before, stack:** eleven concept rows showed their count cut to a different number: *C position* "… · 2" for 21, *Reading by interval* "2" for 20, *Steps* and *Skips* "2" for 23, *A held left hand* "1" for 11, *Shifting position* "1" for 15, *Lining the hands up* "1" for 10, *Primary chords with the dominant seventh* "2" for 25, *F major* "3" for 34, *Swing* "8" for 81, *Bossa nova* "1" for 10. Of the other 274, 31 showed the count whole; on 89 the digits stood with "to practise" cut or gone ("… · core · 8" for eight); on 83 the count was out of view; and on 71 it was not on the line at all (the mechanism below). *Syncopation*'s stages read "Stage 3, 4, 5, 6, 7" for "3, 4, 5, 6, 7, 8".
  - **Before, wide:** five rows showed the count whole (each "0 to practise"); on 58 the digits stood with the noun cut or gone; on 151 it was out of view; on 71 not on the line. None showed a count cut to another number only because the line was cut sooner. 27 stage lists were cut part-way and read as fewer stages ("Stage 0, 4," for *Octaves*' "0, 4, 7").
  - (These counts are `compare-probe.txt`'s and `breakdown-before.txt`'s, from the probe's readings; a character counts as read when most of it is in view.)
  - **After, both faces:** every count is read whole, and no detail line is cut anywhere, concept or exercise row.
  - **The cost:** the rows are taller. On the stack 261 of 285 concept rows take two or more detail lines, and the concept rows' heights summed grow by about three tenths here; under the wide face 276 rows, about a half. The 418 exercise rows are unchanged in words and height. Sideways (`after-wide-spec-phone-landscape-skills-740x342.png`, the first screenful only) each detail line is one line, reordered.
- **As a teacher would read it.** The count is the fact the learner chooses by ("fifteen things to practise this with"), and "1" for fifteen or "8" for eighty-one is a false fact on the screen: the wrong-number rows are gone, and so are the stage lists that dropped a stage. A taller row is the price, and on the wide face a narrow four-line detail beside two buttons is plainly not pretty; it is the Skills structure question U93 holds. One new thing is now prominent: 110 of 285 concept rows lead with "0 to practise" (the concepts with nothing to drill, mostly *not judged by the app* with *Find more* alone), where it used to sit last and was usually out of view (Follow-up 2). The words are U90's; only the order moved.

**The mechanism, and the test that told it from the alternatives.**

- **Two causes, not one.** The count was the last fact on a detail line that is one line, `nowrap`, `overflow: hidden` and deliberately without an ellipsis (`.list-row__metatext`), so the row's edge cut it mid-number with no mark. And the brief's premise that the Skills row does not pass through `fitDetail` is wrong: `listRow` passes every `meta` through `fitDetail(meta, 42)` (`widgets.ts` 171–187), which keeps the first fact and drops whole facts from the end, so on the 71 lines over forty-two characters it was the count that went (`Stage 0, 4, 7` on *Octaves*; `Stage 0, 1 · core, practice` on *The review queue*). Putting the count first answers both: `fitDetail` now drops the tracks, then the stages, never the count.
- **The discriminating test for item 3: the count first on one line, with an ellipsis, measured** (`build-app-count-first-ellipsis.txt`, `probe-count-first-ellipsis-summary.txt`, `count-first-ellipsis-*-shifting-342x740.png`).
  - On the stack every count then fit except the four three-figure ones, where the ellipsis took the end of the noun: *Arpeggios* "120 to practise", *Scales* 258, *Similar motion* 216, *Seventh chords* 186.
  - Under the wide face 172 of 285 counts were cut: "15 to prac…" on *Shifting position*.
  - So one line cannot hold the count beside *Drill it* and *Find more* on either face, and item 3's rule chose the wrap: `white-space: normal` for `#skills-list` alone. It is chosen by that measurement, not by taste.
  - That state also showed why an ellipsis alone costs more than it looks: a line over its box by less than half a pixel (`scrollWidth` equal to `clientWidth`) still draws the ellipsis, and *Leaps: a fourth or fifth* read "0 to practise · Stage 2 · co…" where it had read whole. The spec and the probe measure in fractions of a pixel for that reason.
- **Tried and not kept: `text-wrap: balance`** (`probe-count-first-wrap-balance-summary.txt`). It mended the lone "core" on some rows, but it opened lines on the dot ("15 to practise / · Stage 2 · core") and, under the wide face, parted "Stage" from its number ("· Stage / 2 · core"). Not clearly better; not an extra worth adding.
- **Alternatives, and why they do not hold.** The viewport and the stage filter are the case's own. The content: Skills lists exercises and drills only, and the offline build has every exercise and drill the main checkout's full build has (`compare-content.txt`: the 228 items only in the full build are 227 songs and one excerpt), so the counts are the full build's (inferred from the item ids; the items' concept lists were not compared). The face: the wide face reproduces the cut, and the stack shows the same fault with fewer rows.
- **The change acts on the mechanism.** The count cannot be dropped (it is the first fact) and cannot be clipped (the line has no single line to overflow); an ellipsis marks a word wider than the column, and none was observed in either face after. There is no per-font threshold.

## Done

1. **The count first (item 1).** `SkillsScreen.ts`'s concept row `meta` reads `` `${N} to practise · Stage ${stages} · ${tracks}` ``, with its reason beside it. The words are unchanged.
   - **The second `listRow`** (the exercise rows under a concept, `SkillsScreen.ts` about 341) is read and left as it is: its detail is `L2.5 · exercise`, a level and a kind, no count. Its first fact (the level, a number) was never cut in any state or face measured (`drillsCut 0`, `drillsFirstTokenNotWhole 0` in every probe summary), because those rows carry no buttons.
   - **Several stages** read "47 to practise · / Stage 3, 4, 5, 6, / 7, 8" (*Syncopation*, stack). Nothing wrong in it; a stage list split over lines is recorded (Follow-up 3).
2. **A cut is visible (item 2).** `style.css` gains `#skills-list .list-row__metatext { white-space: normal; text-overflow: ellipsis; }` after `.list-row__metatext`, with its reason. The site-wide rule and its comment ("No ellipsis. `fitDetail` has already dropped whole tokens…") are untouched; nothing else in `style.css` moved (`git diff` on it is the one added block).
   - **Scope.** `#skills-list` is built only by `SkillsScreen.ts` (153); the rule reaches the concept rows and the exercise rows under them, nothing on any other screen. The exercise rows did not change in words or height in either face (`compare-probe.txt`).
3. **The count itself is never cut (item 3).** Measured, not eyeballed; the choice is the wrap, by the test above. After, every row's count is inside its line's visible box on both faces, and no line is cut.
4. **Not U92's (item 4), untouched:** `.list-row__title` and U90's case, the Library's and Today's detail lines, the buttons, `fitDetail`, `widgets.ts`, and the words.
5. **Red first, browser (item 5).** `plan.spec.ts`'s F2b describe gains one case, run on both of U90's faces beside U90's: *every Skills row's count is read whole, and a cut detail line says it is cut*. Over every stage with *Show all* pressed to the end, on every detail line the list draws (concept and exercise rows):
   - *Shifting position*'s line reads `^\d+ to practise · Stage 2 · core$` (the order);
   - the text up to the first ` · ` lies inside the line's visible box (the line's own, inside the clipping meta line), clear of the ellipsis where one is drawn, measured with a Range with the ellipsis switched off for the reading, in fractions of a pixel;
   - a line cut anywhere shows an ellipsis;
   - the line sits inside its row (a wrapped detail still reads as the row's).
   - Soft assertions, so the red shows all three faults at once.
   - **The row's height** did change, because item 3 chose the wrap (the brief's exception); the pictures and `compare-probe.txt` say by how much.
   - **U90's case** is unchanged and green on both faces.
   - **Pictures:** the eight before/after × stack/wide × the two rows; the two count-first-with-ellipsis pictures that decided item 3; `wide.spec.ts`'s Skills scenes after (phone-portrait and phone-landscape).
6. **Red first, unit (item 6).** `app/tests/unit/skillsCountFirst.test.ts`, in the pattern of `unmeasuredConceptsSaySo.test.ts` (the real Skills screen over the built curriculum and catalog, paged to the end): every concept row's detail starts with `N to practise`, N equals the items under it (its *Show all N*, or the rows under it where there are three or fewer), then a stage list, then tracks, and never more than three facts.
7. **Consumers.** `plan.spec.ts` reads the Skills detail with `toContainText('Stage 2 · core')`, `'Stage 7, 9'` and `'to practise'`; all hold with the count first. No unit test read the Skills detail before this one. The specs that open Skills ran green: `competence`, `finder`, `help-strip`, `first-day`, `landscape`, `offline` (43 passed), `wide.spec.ts`'s phone-portrait and phone-landscape (2 passed). `guide-shots.spec.ts` also opens Skills but runs only with `GUIDE_SHOTS=1` and writes the guide's tracked pictures; not run.
8. **The map** (`checks-for-paths.txt`). With the kept config copy among the paths it prints UNMATCHED for it and falls back to the full required suites; without it (`checks-for-paths-without-config-copy.txt`) it names `tsc`, `lint`, `unit` (whole), `build-app` and `e2e` (whole). Everything it names was run, the browser suite on this lane's port and worker limit (the table).
   - **The whole browser suite** (`e2e-all-fixed.txt`, two workers, port 4423, about three quarters of an hour here): 797 passed, 39 failed, 7 skipped. `triage-suite.txt` reads each failure's spec file: **none of the 39 reaches the Skills screen** (no route to it, no `#skills-list`), and U92 changes nothing a screen other than Skills draws. By first error they are: `audio.spec.ts` (it expects `localhost:4173` in a URL, and this lane runs on 4423); fifteen screenshot cases whose `-win32.png` references a fresh worktree lacks ("A snapshot doesn't exist", and the run wrote them, ignored by `.gitignore:44`); pieces the offline build lacks (`carry-overs.spec.ts` opens the Petzold minuet, `score.strip-span.spec.ts` two Chopin editions, all absent from this catalogue and present in the main checkout's); and, on long Score-screen runs, timeouts or an attribute that never reached its value (`score.window-rule` six, `score.fill` three, `perf`, `score.arrange-race`, `score.screen`'s T41 case, `mic`), plus `folder.add` three and `projects.spec.ts`'s Stage 9 page. Not rerun alone and not run on the committed build here, so which of the last group are load and which content is unverified; that none is U92's is inferred from the scope.
   - **The content checks** the fallback names: converter harness 54 ran, OK (9 skipped); `review.py --check` exit 0; `validate.py` exit 1 with the offline build's 121 errors; the content unit tests 28 failures of 1,445, their names about pieces the offline build does not fetch (Cleopha, the Greensleeves variants, the Ode to Joy excerpt's parent) (inferred; not compared with a full build). U92 touches no content and no tool.
   - **The whole unit suite** (`vitest-all.txt`): 65 failures in 10 files. The same ten files on the committed `SkillsScreen.ts` and `style.css` fail the same 65 names (`vitest-compare.txt`: identical). They are the offline catalogue's (U90 recorded nine of the files; the tenth, `scoreModelTempo`, asks for the Canon in D's score, which the offline build lacks) and the two line-ending assertions Entry 101 recorded.
9. **The brief's line numbers held** within two lines: the row's `meta` at 316 (about 314), the exercise rows' `listRow` at 337 (341 after the new comment), `listRow` at 171, `fitDetail` at 153, `.list-row__meta` at 3713, `.list-row__metatext` at 3741. One premise did not: the Skills row does pass through `fitDetail` (the mechanism above).

## Not done

- **The whole browser suite at four workers on port 4173**, as the map writes it: not allowed in this lane; run at two workers on port 4423 instead (item 8).
- **The tour** (`tests/tour/tour.spec.ts`, its *50-skills* scene): not named by the brief, and a long run; not run. What it pictures of Skills after U92 is unverified.
- **Rerunning the 39 whole-suite failures alone**, or on the committed build: not done; they are classified by their first errors and by scope (item 8).
- **Sideways over every row**: the probe read 342 × 740 only; sideways is the first screenful of `wide.spec.ts`'s phone-landscape picture, plus `landscape.spec.ts` green.

## Follow-ups

1. **P3, the wrap's height on Skills.** On the stack most concept rows gain a detail line, and under a wide face a four-line detail stands in a narrow column beside a five-line name. Two ways to win the height back, neither U92's: U93's structure (the actions under the words when the text column is narrow, which gives the detail the row's width and one line), or a detail drawn as one span per fact in `listRow` (`widgets.ts`), so the facts after the count ellipsise on one line while the count stays whole.
2. **P3, words: "0 to practise" leads 110 of 285 concept rows.** True, and now the first thing read on every concept with nothing to drill. Whether a zero count should say something else, or be left off, is a question about U90's words, not their order.
3. **P3, a stage list split over lines.** "Stage / 2, 3, 4, 5, 6" (*Carols*, wide face) and "Stage 3, 4, 5, 6, / 7, 8" (*Syncopation*, stack). Still true; a non-breaking space after "Stage" would keep "Stage 2" together. Not taken: it changes the string's characters, and the brief keeps the words.
4. **Adjacent, the kept config copy fails `npm run lint`.** `app/playwright.u92-4423.config.ts` matches `eslint.config.js`'s `*.config.ts` but no tsconfig includes it, so the project service refuses it (`lint.txt`, exit 1, that file alone; `lint-without-config-copy.txt`, exit 0). U90 moved its copy out of `app/` for this reason. It is lane scaffolding, not for committing as it stands.

## Questions

None. The one choice left to me, the wrap against a cut count, was decided by item 3's measurement as the brief set it.

## Files

- **Changed:**
  - `app/src/ui/screens/SkillsScreen.ts`: the concept row's `meta` order and its comment.
  - `app/src/style.css`: the `#skills-list .list-row__metatext` rule and its comment, after `.list-row__metatext`.
  - `app/tests/e2e/plan.spec.ts`: the new case in the F2b describe, on both faces.
- **Added:**
  - `app/tests/unit/skillsCountFirst.test.ts`.
  - `app/playwright.u92-4423.config.ts`: the lane's port copy, kept as asked (Follow-up 4).
- **Pictures:** `docs/prompts/pictures/u92/`, 12 PNGs.
- **Captures and scripts:** `docs/prompts/runs/U92/`: this entry, the logs in the table, the probe readings (`probe-*.json`, `probe-*-summary.txt`), `compare-probe.txt`, the failing-name lists, and the scripts:
  - `scripts-u92-probe.spec.ts`: the probe, run from `app/tests/e2e/` and moved here;
  - `scripts-run.sh`: one command, logged;
  - `scripts-run-e2e.sh`: checks that every named spec exists and port 4423 is free, then runs on the copy with two workers;
  - `scripts-summarise-probe.py`, `scripts-compare-probe.py`, `scripts-breakdown-before.py`, `scripts-triage-suite.py`, `scripts-map-all-paths.py`, `scripts-compare-content.py` (U90's, copied).
- **Not to commit** (line endings only): `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md`. The offline build rewrote them; I wrote their committed content back from `git show HEAD:<path>`, and `git diff` on them is empty, though `git status` lists them.
- **Environment:** `npm ci` (exit 0); `parity_reference.py` (exit 0, three MAESTRO files skipped by design); `build.py --offline` wrote `app/public/content` with exit 1 (the MuseTrainer and kern libraries are not fetched offline; 121 validation errors about pieces not in the catalogue). The build was kept, not copied from the main checkout, because Skills' input matches (`compare-content.txt`).

## The red lines

- **Unit** (`red-unit-committed.txt`, the new test on the committed `SkillsScreen.ts`, exit 1): `AssertionError: rows whose detail does not lead with the count:` then `black-key-groups: "Stage 0 · core · 0 to practise" does not start with the count`, … `octaves: "Stage 0, 4, 7" does not start with the count` (no count on the line at all), at `skillsCountFirst.test.ts:111`.
- **Browser** (`red-f2b-committed-final-spec.txt`, the final spec on the committed build, exit 1; U90's two cases passed in the same run). Both passes of the new case failed, each on three soft assertions:
  - **Stack:** `Error: the count leads the detail line … Expected pattern: /^\d+ to practise · Stage 2 · core$/ Received string: "Stage 2 · core · 15 to practise"`; `Error: counts on Skills that are not read whole` (the two stage lists standing first where `fitDetail` had dropped the count and they were themselves cut: "Stage 3, 4, 5, 6, 7, 8", "Stage 4, 5, 6, 8, 9"); `Error: detail lines on Skills cut without an ellipsis` (252 lines).
  - **Wide face:** the same order failure; `counts on Skills that are not read whole` (27); `detail lines on Skills cut without an ellipsis` (271).
  - `plan.spec.ts:337` in both (the `for` line of the new case).
- An earlier draft of the case, measuring with `scrollWidth` alone, was red on the same three assertions (`red-f2b-committed.txt`); it was rewritten to measure in fractions of a pixel after the count-first-with-ellipsis state showed a sub-pixel ellipsis that `scrollWidth` misses.
- **After:** `e2e-plan-fixed.txt`, `plan.spec.ts` whole, 28 passed; `vitest-skills-fixed.txt`, the new unit test green.

## Tests

| Step (file in `runs/U92/`) | Exit | Note |
| --- | --- | --- |
| `npm-ci.txt` | 0 | — |
| `parity-reference.txt` | 0 | three MAESTRO files skipped by design |
| `content-build-offline.txt` | 1 | offline libraries absent; `app/public/content` written |
| `compare-content.txt` | 0 | Skills' exercises and drills match the main checkout's full build (item ids) |
| `tsc-tests-before-change.txt` | 0 | the new tests typecheck on the committed code |
| `red-unit-committed.txt` | 1 | the unit red |
| `build-app-committed.txt` | 0 | committed code, for the first red |
| `red-f2b-committed.txt` | 1 | the case's first draft, red |
| `build-app-count-first-ellipsis.txt`, `probe-count-first-ellipsis.txt` | 0, 0 | the item 3 test: count first, one line, ellipsis |
| `build-app-count-first-wrap.txt`, `probe-count-first-wrap.txt` | 0, 0 | the wrap |
| `build-app-count-first-wrap-balance.txt`, `probe-count-first-wrap-balance.txt` | 0, 0 | `text-wrap: balance`, not kept |
| `build-app-committed-2.txt` | 0 | committed code again (only the new comment in `SkillsScreen.ts`), for the before readings and the final red |
| `probe-before.txt` | 0 | before readings and pictures |
| `red-f2b-committed-final-spec.txt` | 1 | the final case on the committed build, red on both faces; U90's two cases passed |
| `build-app-fixed.txt` | 0 | the change |
| `probe-after.txt` | 0 | after readings and pictures |
| `compare-probe.txt` | 0 | before against after, every row, both faces |
| `breakdown-before.txt` | 0 | how each count showed before, per face |
| `e2e-plan-fixed.txt` (`plan.spec.ts` whole) | 0 | 28 passed, U90's case and the new one on both faces |
| `e2e-skills-readers-fixed.txt` (`competence`, `finder`, `help-strip`, `first-day`, `landscape`, `offline`) | 0 | 43 passed |
| `e2e-wide-phones-fixed.txt` (`wide.spec.ts`, phone-portrait and phone-landscape) | 0 | 2 passed; its Skills pictures copied |
| `vitest-skills-fixed.txt` (the new test and the eight files that drive the Skills screen or `fitDetail`) | 1 | 63 of 64 passed, the new test among them; `legacyStorage`'s Library case wants `song.folk.bella-ciao`, absent from the offline catalogue (`bella-ciao-in-catalogs.txt`) |
| `vitest-all.txt` | 1 | 65 failures in 10 files |
| `vitest-failing-files-committed-src.txt`, `vitest-compare.txt` | 1, 0 | the ten files on the committed source: the same 65 names |
| `checks-for-paths.txt`, `checks-for-paths-without-config-copy.txt`, `checks-for-paths-every-path.txt` | 0, 0, 0 | the map (item 8); every path U92 adds or changes, the runs and pictures included (`docs/**` needs no check), gives the same union: the config copy's fallback |
| `converter-harness.txt` | 0 | 54 ran, 9 skipped |
| `content-validate.txt` | 1 | the offline build's 121 errors |
| `review-check.txt` | 0 | — |
| `content-tests.txt` | 1 | 28 of 1,445, pieces the offline build lacks (inferred) |
| `e2e-all-fixed.txt` (whole suite, port 4423, two workers) | 1 | 797 passed, 39 failed, 7 skipped |
| `triage-suite.txt` | 0 | none of the 39 reaches Skills; classes in item 8 |
| `tsc.txt` (`npx tsc -b`, final tree) | 0 | — |
| `lint.txt` (`npm run lint`, final tree) | 1 | the kept config copy alone (Follow-up 4) |
| `lint-without-config-copy.txt` | 0 | `eslint . --max-warnings=0 --ignore-pattern playwright.u92-4423.config.ts` |

- **Unverified:** what a real phone's face draws (Roboto, San Francisco) and what CI's runner draws; the runner's result on this change; the tour's Skills scene; sideways beyond the first screenful. Nothing heard.

**Orchestrator's note at the landing (2026-09-29).** U92's worktree committed by name (4de29cdd) and merged (51b15bac). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U92/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 1; e2e-targeted 1; e2e-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner — the targeted specs' failures passed alone (`e2e-rerun`); the note names them — the spec-existence step read an empty list because the map names the whole suite, and said so; `runs/U92/orchestrator-exit.txt`). U90's follow-up 1, the reviewer's separate repair. The map names the whole browser suite for the stylesheet: 832 passed and five failed under seven builders' load (a harmony drill, the window rule at two phone sizes with six-minute click timeouts, two lesson-page sweeps); the three files rerun alone passed but for a second harmony-drill case (a timing assertion), which then passed alone with one worker, 7 of 7 (`e2e-rerun`); none of the five opens Skills.

## Doc rows

- **`docs/04` §3a, after the paragraph "A name is never cut (U90, 2026-09-29)"**, a new paragraph:
  "**The count first, and never cut (U92, 2026-09-29).** A skill's detail line reads *15 to practise · Stage 2 · core*: how many exercises and drills train it, then the stage or stages, then the track or tracks. It takes the lines it needs beside *Drill it* and *Find more*, as the name above it does, and a word still wider than the column ends in an ellipsis.
  With the count last on one line, clipped at the row's edge without a mark, it said a different number: *Shifting position* read *Stage 2 · core · 1* for fifteen and *Swing* *Stage 4 · core · 8* for eighty-one; and a line over `fitDetail`'s budget lost its count altogether, since `fitDetail` keeps the first fact and drops from the end (*Octaves*: *Stage 0, 4, 7*). With the count first on one line and an ellipsis, a face wider than Segoe UI (Verdana) still cut it to *15 to prac…*, and Segoe UI a three-figure count, so the line wraps: a wrap costs the row a line, a cut count costs the truth.
  On a long line `fitDetail` now drops the tracks, then the stages, never the count. Upright at 342 px most concept rows take two or three detail lines (more under a wider face), and such rows stand past R2's 96 px more often. The exercise rows under a concept are unchanged."
- **`docs/04` §0 R2, after the Skills sentence (U90)** ("… wrap rather than being cut, whatever the font (§3a)."), appended:
  "Its detail line wraps too, with the count first (U92, 2026-09-29, §3a)."
- **`docs/08`, the `plan.spec.ts` row**, appended before "; a project stage's line…":
  "; since U92 the same describe reads every detail line Skills draws over every stage, on both faces: the text up to the first ` · ` (the count, on a concept row) inside the line's visible box and clear of an ellipsis, measured in fractions of a pixel; any cut line ending in an ellipsis; each line inside its row"
- **`docs/08`, the unit list, after `tracks.test.ts`** (alphabetical placement is the splicer's), a new row:
  "- `skillsCountFirst.test.ts` — the Skills row's detail on the real screen over the built curriculum and catalog (U92): every concept row leads with *N to practise*, N the items under it, then its stages, then its tracks."
