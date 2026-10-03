### Entry 89 — Q24: CI builds the content before it tests it, runs the MIDI converter's harness, and writes the parity reference the unit tests compare the port against; the thirteen skip sites that hid a gate now fail naming the missing input and the step that provides it, the eight environmental ones keep their skip with the reason at the site; the workflow's order held by `test_ci_order.py`, seen red on the committed `ci.yml` and on nine mutants (2026-09-27)

**Judgement.** Three kinds of gate were open, and each is closed by the order of the steps plus a failure where there was a skip.

1. **The content tests that read the build.** `ci.yml` ran "Content pipeline tests" (committed line 61) before "Build content" (line 64). A run of the committed tree in the state that order gave it (no build, no fetched editions; `run-unittest-committed-no-build.txt`) skipped 26 tests; 22 of them skipped for want of the build or of craigsapp's Joplin edition that the build fetches: `score_checks`' eight known items, the real-curriculum `technique_units` (four), and one each in `finder`, `tips`, `validate_p11`, `validate_reach` and `pdmx` (17 for the build), plus the Cleopha and `school.krn` rags in `bar_splits`, `loose_attributes` and `note_loss` (5). A 23rd, `score_checks`' archive test, carried the build's message through its class but also needs the unpacked PDMX archive, so it stays an environmental skip (site 14); the other three skips are sites 2, 3 and 12. Now "Build content" runs first, and each of those tests fails naming the file, the command that makes it and the CI step (`red-gate-built.txt`: 17 red; `red-gate-joplin.txt`: 5 red; both green with the input back). After the build, with the changes, every one of the 22 runs and passes: 991 tests, OK, 4 skipped, all four environmental (`run-unittest-after-build.txt`).
2. **The MIDI parity test.** In the committed state the whole comparison of the app's TypeScript port against the Python converter was one skipped test and one passing "is missing" test (`run-midiParity-committed-no-reference.txt`: 1 passed, 1 skipped). No step wrote the reference. Now the step "Write the MIDI parity reference" runs `parity_reference.py` before "Unit tests"; from committed files alone it writes four references (two renderings of a committed exercise, `crossed-hands.mid`, `two-hands.mid`), and the port agrees with all four: 38 passed, 4 skipped (`green-midiParity-with-reference.txt`). The 4 skipped are the split-hands case, which by design needs a reference that split (see Follow-ups). Without the reference the suite fails naming the script and the step (`red-midiParity-no-reference.txt`).
3. **The converter's harness** never ran in CI. It needs only music21 (already installed for the content pipeline) and one committed fixture, so it is now the step "MIDI converter harness": 25 tests, 16 run and pass, 9 skip (`run-converter-harness.txt`). The 9 are `TestRealRecordings`, the three MAESTRO performances, which are not redistributable and are not fetched. That is the one part of the harness that still does not run in CI, so the invariants only that class holds (among them the note count read from the file's own bytes) are still not gated there (Not done, Questions).

Two committed-input gates would also have skipped silently if their file went: the fitted PDMX proxy (`test_pdmx` › *the shipped proxy is fitted*) and the converter harness's round-trip fixture. Both now fail (`red-gate-proxy.txt`, `red-gate-fixture.txt`).

**I cannot run GitHub's workflow here.** The proof of the order is `tools/content/tests/test_ci_order.py`, which reads `ci.yml`'s text: red on the committed file (4 of 8, `red-ci-order-on-committed-ci.txt`), green on the edited one, and red on each of nine mutants of the edited file, with three controls green (`red-ci-order-mutants.txt`). The workflow itself runs only on the next push; what the runner's fresh clone of each source brings is unverified (Unverified 1).

No product code changed; no assertion was weakened; nothing was deleted. Nothing here is heard or seen on a screen: this is tooling, and there is no pedagogical verdict to give.

## The mechanism, and the test that told it from the alternatives

**The claim under test:** the gated tests skip in CI because of the step order, not because the inputs are missing on the runner for another reason (a failed fetch, a path the runner does not have, an input no step makes).

- **Order.** The committed `ci.yml` has the content tests one step before the build, and nothing else in the job writes `app/public/content` or `build/catalog.generated.json` before them. The worktree was put in the same state (checked out, no build, no `content/scores/imported/kern`) and the committed tests run: the 22 skip with the build's messages. The same worktree after `build.py --offline` with the changed tests: all 22 run and pass. So the build supplies every input those 22 need; the order was the cause. What the offline build cannot show is the runner's online fetch (Unverified 1).
- **An input no step makes.** The parity reference is not made by the build at all, so reordering alone could never close it; the discriminating fact is that `parity_reference.py` needs only committed files for four of its seven references (`run-parity-reference.txt`: "wrote 4 reference file(s)", the three MAESTRO files missing). Hence a new step rather than a move.
- **The harness.** The alternative, that the harness could not run in CI (an input or a runtime the runner lacks), is refuted by running it in the same clean worktree: 16 pass, and the 9 skips are all for the MAESTRO files. One wrinkle found on the way: the command in `test_converter.py`'s docstring (`-t .`) fails with "Start directory is not importable" (no `__init__.py`); the CI step uses `discover -s tools/midi-cleanup/tests` without `-t`, which works (Follow-ups).

**The skip that becomes a failure** is the part a person could get wrong both ways, so each site was classified by one question: *can a CI step provide this precondition?* If yes (the build, the build's fetch, the checkout, a script over committed files), the skip hid a gate and is now `self.fail(…)` (or, in vitest, `expect(…, why)`) naming the file, the command and the step. If no (an archive or recording not in the repository and fetched by no step, a live run's lock on the same checkout, a tool the machine may lack), the skip stays, and its reason says why CI cannot have it.

## The red lines

All captured beside this entry.

- **`red-ci-order-on-committed-ci.txt`** (the new test on the committed `ci.yml`): 4 failed of 8.
  - `test_the_content_is_built_before_the_content_tests_read_it`: `'Build content' (step 8) must run before 'Content pipeline tests' (step 7): the content tests read the built catalogue, the curriculum and the fetched editions, and fail when they are missing`.
  - `test_the_converter_harness_runs`: `expected one step in ci.yml running 'unittest discover -s tools/midi-cleanup/tests', found 0`.
  - `test_the_parity_reference_is_written_before_the_unit_tests_compare_against_it`: `… running 'tools/midi-cleanup/tests/parity_reference.py', found 0`.
  - `test_the_steps_the_failure_messages_name_exist`: `['MIDI converter harness', 'Write the MIDI parity reference'] != []`.
  - Green by design on the committed file, because they hold orders Q24 does not move: the build after the cache and the pip install; the unit tests after the build and `npm ci`; the render check after the app build and the second validation after the render check; the `concurrency` block. Their power is in the mutants.
- **`red-ci-order-mutants.txt`** (`mutate_ci_order.py`): each mutant of the edited `ci.yml` turns its test red — unit tests before the build; validate before the render check; build before the pip install; parity reference after the unit tests; `concurrency` removed; `cancel-in-progress: false`; the harness step renamed; the harness step removed; the content tests back before the build. Controls green: the file unchanged, the steps re-joined by the script, and the build's `run:` written as a `|` block (the parser reads block values).
- **`red-gate-built.txt`** (`red_by_precondition.py built`): `catalog.json`, `curriculum.json` and `build/catalog.generated.json` renamed aside, 17 failed and 1 skipped of 18 (the skip is `score_checks`' archive test, environmental); renamed back, sha256 identical, 18 run, OK (skipped=1). Each failure reads like `` …\app\public\content\catalog.json is missing, and these tests read the built catalogue: run `python tools/content/build.py` first (CI: the step 'Build content', before 'Content pipeline tests') ``.
- **`red-gate-joplin.txt`**: `content/scores/imported/kern/joplin` renamed aside, 5 failed of 5, each `` …\kern\joplin\kern\cleopha.krn is missing: craigsapp's Joplin edition is fetched, not committed. Run `python tools/content/fetch.py --only kern-joplin` (CI: the step 'Build content' clones it, before 'Content pipeline tests') `` (`school.krn` for `note_loss`); back, 5 OK.
- **`red-gate-proxy.txt`**: `content/sources/pdmx-csv-level.json` renamed aside, 1 failed of 7 (`` …is missing or not fitted, and it is committed: refit it with `python tools/content/pdmx/index.py --fit` (CI has it from the checkout) ``); back, sha256 identical, 7 OK.
- **`red-gate-fixture.txt`**: the committed `exercise.five-finger.c-major.both.mxl` renamed aside, both `TestRenderedInput` cases fail (`…is missing, and it is committed: the round trip has no input (CI has it from the checkout)`); back, sha256 identical, 2 OK.
- **midiParity, in order** (`midi_parity_sequence.py`, which ends by byte-comparing the file with the final one):
  1. `run-midiParity-committed-no-reference.txt`: the committed file, no reference: exit 0, 1 passed, 1 skipped. The open gate.
  2. `red-midiParity-no-reference-old-message.txt`: the skip sites converted, the old message kept: exit 1, `has a reference to compare against` fails with the old message (which names no step), and the new assertion `expected '…' to contain '"Write the MIDI parity reference"'`.
  3. `red-midiParity-reference-old-message.txt`: the same file with the reference written: exit 1, 37 passed, 4 skipped, 1 failed: `expected '' to contain 'parity_reference.py'` (the old `why` was set only when nothing was found).
  4. `green-midiParity-with-reference.txt`: the message always defined, naming the CI step: exit 0, 38 passed, 4 skipped.
  5. `red-midiParity-no-reference.txt`: the final file, the reference renamed aside: exit 1, `` no reference in …\build\midi-parity: run `python tools/midi-cleanup/tests/parity_reference.py` from the repository root (CI: the step "Write the MIDI parity reference", before "Unit tests"). …: expected 0 to be greater than 0 ``.
- **Before, for the two committed-input gates:** not run on the committed code with the file removed; the committed lines are `self.skipTest("no fitted proxy committed")` and `self.skipTest(f"{self.fixture} is missing")`, so the silent skip is read from the code, not observed.

## Every skip site

The brief's grep (`skipTest|unittest.skip|self.skipTest|test.skip(|describe.skip` over `tools/content/tests` and `app/tests/unit`) finds 21 sites. A wider search of the same trees plus `tools/midi-cleanup/tests` (adding `skipIf`, `skipUnless`, `.todo(`, `.only(`, `SkipTest`, `expectedFailure`) finds three more, marked †: the converter harness joins CI in this change, and `midiParity` has a per-case `it.skipIf`. The vitest run's fifth skip then showed that search had missed `runIf`, which adds two more (25† and 26†); a search for `runIf` over `app/tests/unit` and `app/src` finds no others. No silent early-`return` skip was found in those trees (searched for `exists()` / `is_file()` / `existsSync` checks followed by `return`). `app/tests/e2e` and `app/tests/tour` are outside this search (Follow-ups).

| # | File and line (committed → now) | What it skipped on | Class | What it does now |
|---|---|---|---|---|
| 1 | `tools/content/tests/test_bar_splits.py:213` → `setUp` at 223 | `content/scores/imported/kern/joplin/kern/cleopha.krn`, fetched by the build (gitignored) | gate | fails naming the file, `fetch.py --only kern-joplin` and 'Build content' |
| 2 | `test_export_durations.py:351` | `build/pdmx-rerun/raw/<cid>.mxl`, the 2026-09-15 re-run over an unpacked PDMX archive | environmental | skip kept; the reason names the path, the archive, and that no CI step fetches it |
| 3 | `test_export_durations.py:357` → 360 | `build/pdmx-rerun/quarried.json`, the same re-run's results | environmental | as 2 |
| 4 | `test_finder.py:246` | `app/public/content/curriculum.json` | gate | fails naming the file, `build.py` and 'Build content' |
| 5 | `test_loose_attributes.py:129` → `setUp` at 136 | `cleopha.krn` | gate | as 1 |
| 6 | `test_note_loss.py:213` → `setUp` at 214 | `…/joplin/kern/school.krn` | gate | as 1 |
| 7 | `test_pdmx.py:438` | `app/public/content/catalog.json` | gate | as 4 |
| 8 | `test_pdmx.py:704` → 710 | `build/.content-lock` held by a live content run on the same checkout | environmental (a concurrent run) | skip kept; a comment and the message say the test would have to take or remove a live run's lock, and that nothing in CI runs beside the step |
| 9 | `test_pdmx.py:719` → 727 | as 8 | environmental | as 8 |
| 10 | `test_pdmx.py:732` → 742 | as 8 | environmental | as 8 |
| 11 | `test_pdmx.py:795` → 805 | `content/sources/pdmx-csv-level.json` fitted; the file is committed and fitted | gate (a committed input) | fails naming the file and `pdmx/index.py --fit`; CI has it from the checkout |
| 12 | `test_pdmx.py:1240` → 1254 | `build/pdmx/candidates.json`, written by a quarry over a PDMX archive | environmental | skip kept, the reason at the site |
| 13 | `test_score_checks.py:682` (class decorator) → `KnownItems.setUp` at 690 | `app/public/content/catalog.json` (eight tests) | gate | each of the eight fails naming the file, `build.py` and 'Build content' |
| 14 | `test_score_checks.py:759` → 766 | `build/pdmx/library/library.json`, the unpacked PDMX archive | environmental | skip kept, the reason at the site |
| 15 | `test_serve_lan.py:53` | `openssl` on `PATH` | environmental (a tool) | unchanged; its reason was already at the site. openssl was on `PATH` here, so it ran; it should run on the Ubuntu runner too (Unverified 3) |
| 16 | `test_technique_units.py:89` | `build/catalog.generated.json`, read relative to the working directory | gate | fails naming the resolved path, `build.py` and 'Build content' |
| 17 | `test_tips.py:183` | `app/public/content/catalog.json` | gate | as 4 |
| 18 | `test_validate_p11.py:158` | `app/public/content/catalog.json` and `curriculum.json` | gate | as 4 |
| 19 | `test_validate_reach.py:82` | `app/public/content/catalog.json` | gate | as 4 |
| 20 | `app/tests/unit/midiParity.test.ts:107` (`describe.skipIf`) → 104 | `build/midi-parity/*.json` | gate | the suite always runs; `has a reference to compare against` fails with a message naming `parity_reference.py` and the new step 'Write the MIDI parity reference' |
| 21 | `midiParity.test.ts:223` (`describe.skipIf`) → 226 | its complement: it ran, and passed with a `console.warn`, only when the reference was missing | gate (the silent pass beside 20) | always runs; asserts the failure message names the script and the step. The warning is gone, since a missing reference is now a failure |
| 22† | `midiParity.test.ts:208` (`it.skipIf`) → 211 | a reference with no hand split (`keep`, or `auto` on two note tracks) | neither: not applicable to that case | skip kept; a comment now says why, and that no committed fixture produces a split, so this runs only where the MAESTRO references exist (Follow-ups) |
| 23† | `tools/midi-cleanup/tests/test_converter.py:403` → 405 | the committed `exercise.five-finger.c-major.both.mxl` | gate (a committed input) | fails; CI has it from the checkout |
| 24† | `test_converter.py:434` (class decorator, reason at 58) → 439 | `build/midi-real/*.mid`, three MAESTRO performances | environmental (licence) | skip kept; the reason now adds that they are test input only, not redistributable, not committed, and fetched by no CI step (Questions) |

| 25† | `app/tests/unit/demandsOfFiles.test.ts:46` (`describe.runIf`) | the environment variables `PIANOPATH_DEMANDS_IN` and `PIANOPATH_DEMANDS_OUT`, which `tools/content/demands.py` sets when the build measures files through vitest | neither: an invocation mode | unchanged; the file's header gives the reason. In a plain run the other branch runs instead |
| 26† | `demandsOfFiles.test.ts:63` (`describe.runIf`) | the complement: skipped when the build calls the file | neither: an invocation mode | unchanged; in a plain run this is the Anh. 113 proof, and it ran |

Of the brief's 21: 13 gates converted, 8 environmental kept. With the five more: 14 converted, 9 environmental, and three kept by design (22, 25, 26).

## Tests touched

| Test | Class | Old assumption | Now |
|---|---|---|---|
| `test_ci_order` (new file, 8 tests) | add | — | the order of `ci.yml`'s steps where it is the point, the `concurrency` block, and the step names the failure messages cite |
| sites 1, 4–7, 13, 16–19 (the 22 tests behind them) | revise (the skip line only) | "no input, so nothing to check" | a failure naming the input, the command and the CI step; the assertions below each are untouched |
| site 11, `test_pdmx` › `TestArchiveIndex.test_the_shipped_proxy_is_fitted_and_agrees_with_the_real_model` | revise (the skip line only) | an unfitted proxy is a reason not to check | an unfitted or missing committed proxy fails |
| site 23, `test_converter` › `TestRenderedInput` (2 tests) | revise (the skip line only) | a missing committed fixture is a reason not to check | fails |
| sites 20–21, `midiParity` › *has a reference*, *the parity reference* | revise | a missing reference skips, with a warning | a missing reference fails, naming the script and step; the message is asserted to name both |
| sites 2, 3, 8–10, 12, 14, 24 | preserve (reason reworded) | — | the same skip, with the reason CI cannot have the input |
| site 15 | preserve, untouched | — | — |
| site 22 | preserve (a comment added) | — | — |
| every other test in the touched files | preserve, untouched | — | green |

## Checks (unpiped; exit codes read)

From the worktree root:

- **Content tests on the committed tree before any build: exit 1**, 983 tests, `FAILED (failures=1, skipped=26)` (`run-unittest-committed-no-build.txt`). The one failure is `test_demands_tool` › *a file that will not load is named, not dropped*: the detector's vitest run wrote no report ("Test Files no tests"). This run started while `npm ci` was still installing `app/node_modules` in the background (its completion was reported after the run began). The same test passed in the after-build run, and passed again with the build renamed aside (`probe-demands-tool-without-build.txt`), so the build is not its cause; the concurrent install is the explanation I hold, not shown in isolation.
- **Setup.** The worktree had no import libraries; `copy_inputs.py` copied the main checkout's `content/scores/imported/kern` and `musetrainer` without version-control folders, and the complete pairs of its conversion cache into `build/cache/convert`, overwriting nothing (3,495 pairs copied, 34 already present in this worktree and left alone; `run-copy-inputs.txt`).
- **`python tools/content/build.py --offline`: exit 0** (`run-build.txt`): "content validation OK … (2061 catalog items)". The offline fetch rewrote the tracked `content/scores/imported/SOURCES.md`; it is restored to the working copy's committed bytes (`SOURCES.md.committed-working-copy`, sha256 compared) and `git status` does not list it.
- **`python tools/content/validate.py --allow-nc --personal`: exit 0** (`run-validate.txt`).
- **Content tests after the build, with the changes: exit 0**, 991 tests, `OK (skipped=4)` (`run-unittest-after-build.txt`): 983 plus the 8 new. The four skips are sites 2, 3, 12 and 14.
- **`python -m unittest discover -s tools/midi-cleanup/tests -v`** (the new CI step): exit 0, 25 tests, `OK (skipped=9)`, on the committed harness (`run-converter-harness-committed.txt`) and on the changed one (`run-converter-harness.txt`).
- **`python tools/midi-cleanup/tests/parity_reference.py`** (the new CI step): exit 0, 4 references (`run-parity-reference.txt`).
- **`test_ci_order`** alone: exit 1 on the committed `ci.yml`, exit 0 on the edited one (`green-ci-order.txt`); `mutate_ci_order.py` exit 0.

From `app/` (`npm ci` first, exit 0, `run-npm-ci.txt`: `node_modules` was absent):

- **`npx eslint --max-warnings=0 tests/unit/midiParity.test.ts`: exit 0** (`run-eslint-midiParity.txt`). Prettier reports the file both before and after this change, on the same two pre-existing lines (105 and 215 of the committed file); none of the changed lines.
- **`npm run typecheck`** (`tsc -b --noEmit`, whose app project includes `tests/unit`): **exit 0** (`run-typecheck.txt`).
- **`npx vitest run`: exit 1**: 4 failed, 6,026 passed and 5 skipped of 6,035, in 259 files (`run-vitest.txt`), with the four CI-writable references in `build/midi-parity/`. None of the four reds is in a file this change touches.
  - **Two are the worktree's CRLF checkout**, as in Entries 84 and 85: `lessonClaimsAboutApp.test.ts` › *blues.3 … Rhythm only is not one of them* and › *4.7: blind hides the score …* each look for a literal `\n` sequence in `ui/screens/ScoreScreen.ts` (test line 1568) and `style.css` (line 1778), both checked out here with CRLF endings. `crlf_check.py` (`vitest-two-reds-are-crlf.txt`): each clause is false on the file as checked out and true on the same text with LF.
  - **Two are load:** `sightReadingPromises.test.ts` › *levels 6 and 7 write a rest inside a triplet as a triplet rest*, both "Test timed out in 5000ms" in the full run; the same file alone: exit 0, 51 of 51 (`run-vitest-sightReadingPromises-alone.txt`).
  - **The five skips:** `midiParity`'s split-hands case on each of the four references (site 22), and `demandsOfFiles.test.ts`'s build entry point (site 25), which runs only when the content build calls it.

No browser, no app build, no Playwright. No JSON re-serialised; every edited file was spliced as text with its CRLF endings kept (`edit_ci.py`, `edit_skip_sites.py`, `wrap_two_lines.py`, `edit_midi_parity.py`). No commit, push, stash or checkout.

## Unverified, beside what passes

1. **The workflow on GitHub.** Not run; it runs on the next push. The order test proves the file's order, not the runner. In particular the runner's `build.py` fetches each source's current head, which may differ from the main checkout's copies used here; if `craigsapp/joplin` cannot be reached, the build still succeeds (as before) and the five Joplin tests now fail naming the file, where they used to skip.
2. **The four CI parity references** were written here on Windows with music21 10.5.0, the version `requirements.txt` pins. That the runner writes the same four files is inferred from the pin and the fixed seed in `render_midi`, not observed.
3. **`test_serve_lan` on the runner** (site 15): expected to run, since Ubuntu images ship openssl; not observed.
4. **The runner's time.** Two steps are added and 22 content tests that used to skip now run; what that adds to the job on GitHub is unmeasured.

## Not done

- **The MAESTRO part of the converter harness does not run in CI** (site 24; nine tests, among them *no note is lost or invented between the file and the score*, the invariant the test inventory names as held only by the harness). Its inputs are three performances from the MAESTRO v3.0.0 MIDI zip (58,416,533 bytes per `build/midi-real/SOURCE.md` in the main checkout, itself gitignored), which that note calls "test input only", not for redistribution in the app. A step that downloads the zip into a cache and extracts the three files would make it run, and would also give `midiParity` its three split references (site 22). I did not add a third-party download to every CI run on a licence recalled rather than re-read: see Questions.
- Every other item in the brief is done.

## Follow-ups

- **P2, the split-hands parity never runs in CI** (site 22). None of the four references CI can write holds a split, so `midiParity` › *splits the hands the same way* skips four times on every run there. A committed one-track, two-hand MIDI fixture (written by a script like `app/tests/fixtures/imports/make-two-hands-midi.py`) added to `parity_reference.py`'s `APP_FIXTURES` would put `splitHands` under parity without MAESTRO. Not this seam's files.
- **P2, a consumer: every fresh worktree's `npx vitest run` now needs the parity reference.** Without `build/midi-parity/`, `midiParity` fails naming `python tools/midi-cleanup/tests/parity_reference.py`. The main checkout has the directory (dated 2026-09-23), so the end-of-wave chain is unaffected; builder briefs that run vitest in a new worktree should add that one command (or copy the directory, as with the conversion cache). Likewise a fresh worktree's content tests now fail, rather than skip, until the build has run and the Joplin edition is present; builders already copy both.
- **P3, record (Q25's seam, not changed here).** `docs/03-content-pipeline.md` line 68 and `docs/08-test-map.md` line 388 say the parity tests "skip with a message naming the script"; they now fail. `docs/08` has no row for `test_ci_order.py`.
- **P3, `test_converter.py`'s docstring run command** (`python -m unittest discover -s tools/midi-cleanup/tests -t .`) fails: "Start directory is not importable". `docs/08` line 608's `-t tools/midi-cleanup/tests` and the CI step's form work.
- **P3, the e2e and tour skip sites are unclassified.** The same kind of search over `app/tests/e2e` and `app/tests/tour` finds 13 sites. Three in `carry-overs.spec.ts` (lines 116, 135, 145) call `test.skip()` with no reason when an element is absent, which is the pattern this task removed elsewhere.
- **P3, `test_technique_units` reads `Path("build")` relative to the working directory**, so from any directory other than the repository root it now fails where it used to skip. The message prints the resolved path and says to run the build; the path itself was left alone (not a skip line).

## Questions

- **Should CI fetch MAESTRO's MIDI zip** to gate the real-recording class and the split-hands parity (Not done)? It is a new third-party download per run (a cache would make it once per key), and the licence line in `SOURCE.md` was recalled, not re-read, when the files were fetched. If yes, it is one step plus the skip at site 24 becoming a failure; I left it for that decision.

## Files

- `.github/workflows/ci.yml`: "Build content" now before "Content pipeline tests" (its comment updated: the build still tolerates an unreachable source, the Joplin tests do not); two new steps after them, "MIDI converter harness" and "Write the MIDI parity reference". Nothing else moved; the `concurrency` block is unchanged.
- `tools/content/tests/test_ci_order.py` (new).
- The skip lines and their messages only: `tools/content/tests/test_bar_splits.py`, `test_export_durations.py`, `test_finder.py`, `test_loose_attributes.py`, `test_note_loss.py`, `test_pdmx.py`, `test_score_checks.py`, `test_technique_units.py`, `test_tips.py`, `test_validate_p11.py`, `test_validate_reach.py`; `tools/midi-cleanup/tests/test_converter.py`; `app/tests/unit/midiParity.test.ts`.

Beside this entry:

- **Red lines:** `red-ci-order-on-committed-ci.txt`, `red-ci-order-mutants.txt`, `red-gate-built.txt`, `red-gate-joplin.txt`, `red-gate-proxy.txt`, `red-gate-fixture.txt`, `red-midiParity-no-reference-old-message.txt`, `red-midiParity-reference-old-message.txt`, `red-midiParity-no-reference.txt`.
- **Runs:** `run-unittest-committed-no-build.txt`, `run-copy-inputs.txt`, `run-build.txt`, `run-validate.txt`, `run-unittest-after-build.txt`, `run-converter-harness-committed.txt`, `run-converter-harness.txt`, `run-parity-reference.txt`, `green-ci-order.txt`, `run-midiParity-committed-no-reference.txt`, `green-midiParity-with-reference.txt`, `run-npm-ci.txt`, `run-eslint-midiParity.txt`, `run-vitest.txt`, `run-vitest-sightReadingPromises-alone.txt`, `vitest-two-reds-are-crlf.txt` (from `crlf_check.py`), `run-typecheck.txt`, `probe-demands-tool-without-build.txt`.
- **Scripts:** `copy_inputs.py`, `edit_ci.py`, `edit_skip_sites.py`, `wrap_two_lines.py`, `edit_midi_parity.py`, `midi_parity_sequence.py`, `mutate_ci_order.py`, `red_by_precondition.py`, `crlf_check.py`, `snapshot.py`.
- **Snapshots of the committed files:** `HEAD/*.HEAD` (the fifteen files before any edit, including the untouched `test_serve_lan.py`), `midiParity.test.ts.final`, `SOURCES.md.committed-working-copy`.
