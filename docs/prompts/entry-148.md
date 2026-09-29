### Entry 148 — Q83 + Q84 — a runner's log names the fetch: the build's validate step now prints the validator's `WARNING` lines when it passes, so a Pages deploy that could not fetch the rag says so under *validate*; and the strict Mutopia test, when it fails on such a build, names the placeholder and the reason its row gives (2026-09-29)

**Judgement.** Nothing was looked at on a screen and nothing was heard. This seam changes two logs, not anything the learner meets: the build's own summary, which is the one log a Pages deploy leaves, and the message of one content test that fails on CI during a Mutopia outage. Both were reproduced here with offline builds that have no copy of Mutopia's two files (the worktree's `content/scores/imported/mutopia/published` moved aside, as Q80's `unfetch.txt` did). That a runner's fetch failure gives the same placeholder reason is inferred from `import_mutopia.build_entry`, as in Q80, not observed on a runner.

- **The Pages flavour (strict), the build step's lines under *validate*, before** (`build-strict-unfetched-before.txt`, HEAD's `build.py`, exit 0):

  ```
    ok    import [MUTO]    imported 0 score(s), 1 placeholder(s) (0 cached, 0 converted)
            placeholder song.ragtime.joplin-pine-apple-rag.mutopia: the edition's .ly file was not fetched
    …
    ok    validate         content validation OK: …\build\q83-strict-unfetched\content (2091 catalog items)
  ```

  Nothing under *validate*, although the validator prints 13 `WARNING` lines on that catalogue: `validate-strict-unfetched-after.txt` is the validator run alone on the same `--out`, as the after build rewrote it from the same inputs. The validator is unchanged, so the same 13 were printed before and dropped by the step; that the before run printed exactly these is inferred, not captured.

- **After** (`build-strict-unfetched-after.txt`, exit 0): the same `[MUTO]` lines, then

  ```
    ok    validate         content validation OK: …\build\q83-strict-unfetched\content (2091 catalog items)
            WARNING (excerpt, E1): excerpts.json row 1 (excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32): stale by cut version — …
            … (five E1 lines, the E0 summary, five F2 deferrals)
            WARNING (rung claims, Q75): ragtime.8 claims stride-bass (texture.left-hand-pattern), not judged on this build: 6 of its options unmeasured here (a placeholder, or a file the app could not load) and none of its 6 checked options establishes it; an unmeasured option establishes nothing and refutes nothing
            …
            WARNING (ladder report, Q80): docs\generated\ladder.md compared without the 1 item this build could not fetch (read as bundled, as the committed report has them): song.ragtime.joplin-pine-apple-rag.mutopia (the edition's .ly file was not fetched); a placeholder made for want of a fetch is not a change to the catalogue
  ```

  The 13 lines under *validate* are the validator's 13 `WARNING` lines, in its order, character for character once the indentation is stripped (`warnings-verbatim-after.txt`: equal, exit 0; on the before log, 0 lines, `warnings-verbatim-before.txt`). CI's flavour (personal) shows the same shape: 12 lines, the Q80 line last and no Q75 line, since ragtime.8's bundled craigsapp options are measured there (`build-unfetched-after.txt`).

- **CI's content-tests step on that build, the strict Mutopia case's message, before** (`ci-tests-unfetched-before.txt`, exit 1):

  ```
  AssertionError: 0 not greater than or equal to 1 : ragtime.8's stride bass is kept by no option on the strict flavour
  ```

  **After** (`ci-tests-unfetched-after.txt`, exit 1, the same catalogue, the same failure):

  ```
  AssertionError: 0 not greater than or equal to 1 : ragtime.8's stride bass is kept by no option on the strict flavour: song.ragtime.joplin-pine-apple-rag.mutopia is a placeholder (the edition's .ly file was not fetched)
  ```

- **What a runner's log now says during a Mutopia outage (inferred from the workflows and these logs; unverified on a runner).**
  - **Pages** (`npm run build`, whose `prebuild` runs the strict content build): the `[MUTO]` placeholder line, then under *validate* Q75's ragtime.8 line and Q80's set-aside line, and the deploy goes ahead, as Q80 made it. This is the log the Q86 question (deploy without the fetched piece, or guard it) can now be judged from.
  - **CI**: its "Build content" step (personal) now shows the Q80 line under *validate*, before the "Content pipeline tests" step fails, by design, with the message above. The fetch is named in both steps.
- **The cost, for the reviewer.** On every build, fetched or not, the validate step now prints every line the validator starts with `WARNING`: on the final fetched build here, 11 (five E1 excerpt lines, the E0 summary, five F2 deferrals; `build-final-personal.txt`), where it printed none. That is the brief's rule ("every line … that starts with `WARNING`"), and I think right: each is a line the validator already says "out loud on every run". But the Q80 line is one line among a dozen, not a headline. No summary or ordering was added (not decided here; Follow-up 1).

**The mechanism, and the test that told it.**

- **Q84's cause.** `build.step_validate` built its `Step` with `detail=summary_line(output)` on a pass and no `warnings`, so every line but the verdict was discarded before the summary printed anything. The summary's printer was never the fault: it prints a step's `warnings` under the step whether the step passed or failed (`build.py`'s `run_build`, the loop over `step.warnings` has no `ok` test), which is how the `[MUTO]` step's placeholder lines already reached a passing build's log.
- **Discriminating test.** The validator run alone on the same catalogue prints 13 `WARNING` lines; the build log's *validate* block held 0 before and holds the same 13 after, with the printer untouched. So the loss was the step's, not the printer's and not the validator's.
- **Q83's cause.** The strict case's message was a fixed sentence. The case already reads the built catalogue, where the rag's row carries no `file` and an `importHint` that says why (`import_mutopia.IMPORT_HINT`, "Not bundled in this build: {why}. Fetch …"); it just did not look. It now does, and only for its message.

## Done

1. **Item 1 (Q84): the warnings survive a pass.** `step_validate` collects each line of the validator's output whose text after its indentation starts with `WARNING`, stripped, into the step's `warnings`, on a pass and a failure alike; `detail` is unchanged (the verdict line on a pass, the whole output on a failure). The printer needed no change: it already prints each warning indented under the step, pass or fail. Nothing else in `build.py` moved (a docstring on `step_validate` says the above). Technically done; pedagogically nothing changes for the learner.
2. **Item 2 (Q83): the strict test names the cause.** When the built catalogue's rag row has no `file`, the assertion's message appends `: <id> is a placeholder (<reason>)`, the reason being the text `import_mutopia.IMPORT_HINT` wraps as `{why}` (read from the row's `importHint`; the whole hint if it does not fit the template, "no importHint" if it is empty). The pass condition and every other assertion are unchanged. The case can see the row: it already loads the built catalogue.
3. **Item 3: red first, unit.** `tools/content/tests/test_runner_log.py` (new, 6 cases in 2 classes):
   - `TestTheValidateStepKeepsTheValidatorsWarnings` (4): `step_validate` with `build.python` faked to return a passing validator's output carrying Q75's and Q80's lines: its `warnings` are both lines verbatim; the detail is still the verdict; a pass without warnings has none; a failure (the views check, the one failure printed after the warnings) keeps them too, with the whole output as detail.
   - `TestTheStrictCaseNamesTheFetch` (2): the strict case run on the built catalogue with the rag replaced by the placeholder `import_mutopia.build_entry` really writes for missing files (and the build's `unmeasured` fields): the message names the id and "the edition's .ly file was not fetched". Control: a rag that is bundled but was not measured fails without the word "placeholder".
   - Red on the committed code: 3 of 6 (below). Six mutants, each killed (`mutants-test.txt`, `mutants-build.txt`).
   - The Q83 half also ran the brief's way: the Q80 script's approach (`scripts-ci-tests-unfetched.py`) on a real unfetched build, before and after (the judgement).
4. **Item 4: observed, not inferred.** Four offline builds with Mutopia's files aside, each to an absolute `--out`, with the three `build/*-cache.json` copied fresh from the main checkout before each (Q80's Follow-up 4): strict and personal, before (HEAD's `build.py`) and after. All exit 0. The logs are in the run folder; the lines are in the judgement.
5. **Item 5 held.** The validator's words, the ladder check, the deploy guard, the workflows and `import_mutopia.py` are untouched. The CI order stays: I think the content-tests step failing on an outage is right, since it is the only step that fails, and it now says why.

## Not done

- **The runner.** No Pages or CI run on this change has been read; that is the orchestrator's, after landing.
- **A unit test of the printer.** The loop in `run_build` that prints a step's warnings is unchanged and has no unit test; testing it needs every step of `run_build` stubbed. The four builds are its evidence (the printed lines equal the validator's).
- **`docs/03` and `docs/08`**: not edited, per the brief; the rows are under Doc rows.

## Follow-ups

1. **The log is longer on every build (P3, for information).** The validate step now prints every `WARNING` line: 11 on a fetched build here, where it printed none; the Q80 line is the last of 13 on the strict build without the rag. If a reader of the Pages log should find a fetch failure at a glance, a candidate is for the validate step to lead with the fetch lines, or for the `[MUTO]` step's line to be read as the headline, as it already is. Not built: nothing decided it.
2. **On one failure path the warnings print twice (P3, a premise of the brief).** The brief's "the step's detail stays the summary line" holds on a pass. On a failure the detail has always been the whole output. The validator prints its warnings only after it has decided there are no errors (`validate.main`: the errors branch exits first), so on an error the list is empty and nothing doubles. But when the last check fails (the views check, `split_prompt_views.refresh_for_validator`), the output already holds the warnings, and they print once in the detail and once under it. The brief's "on a pass and a failure alike" was kept; the doubling is harmless and rare.
3. **Line numbers in the brief.** `step_validate` is at 1358–1369 and `step_render` at 1372–1377, as the brief says. The strict-flavour case in `test_import_mutopia.py` is at 224 (the brief's "about 188" is `TestTheEntry.test_the_row_says_what_happened`). No test covered `step_validate` before this: `test_build.py` does not exist, and the one mention of `step_validate` under `tools/content/tests` is a docstring in `test_score_checks.py`.

## Questions

None. Q86 (deploy without a fetched piece, or guard the deploy) stays the reviewer's and the owner's; this seam only makes its log readable.

## Files

- **Changed:**
  - `tools/content/build.py`: `step_validate` only (its `warnings`, and a docstring).
  - `tools/content/tests/test_import_mutopia.py`: `TestThePlacement.test_on_the_strict_flavour_ragtime_8s_stride_bass_is_established_by_it`, the first assertion's message only.
- **New:** `tools/content/tests/test_runner_log.py`.
- **The brief, copied from the main checkout:** `docs/prompts/tasks/Q83-Q84-runner-log-names-the-fetch.md`.
- **Not to commit (restored):** the default-out builds rewrote `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md` (line endings only) and `content/scores/imported/SOURCES.md` (the ledger re-dated; the copied clones have no `.git`), as in Q80 (`reports-diff-final.txt`). All three were copied back from the snapshot taken before the first build (`restore.txt`). `docs/generated/ladder.md` was never rewritten.
- **Captures:** `docs/prompts/runs/Q83-Q84/`: this entry, every log named here, and the scripts:
  - `scripts-copy.ps1`, `scripts-run-build.ps1`, `scripts-chain-unfetched.ps1`, `scripts-suites.ps1`;
  - `scripts-ci-tests-unfetched.py`, `scripts-warnings-verbatim.py`, `scripts-mutants.py`.
- **Copied read-only from the main checkout** (`copy.txt`, robocopy 1 = copied, each): `build/cache`, `build/midi-real`, the three `build/*-cache.json` (again before each build), `content/scores/imported/kern`, `musetrainer` and `mutopia`, without `.git`. The worktree's own `mutopia/published` was moved aside to the scratchpad and back twice (`chain-unfetched-before.txt`, `chain-unfetched-after.txt`: back, both times). The main checkout was not written.
- The worktree's `app/public/content` came from its own offline build (`build-baseline-personal.txt`), not a copy. `npm ci` ran in `app/` (`npm-ci.txt`); `parity_reference.py` wrote its references (`parity.txt`).

## The red lines

`red-test_runner_log.txt`: the new file on the committed code, exit 1, 3 of 6 red.

- `test_a_pass_keeps_both_warning_lines_verbatim` and `test_a_failure_keeps_them_too_and_its_detail_is_the_whole_output`: `AssertionError: Lists differ: [] != ['WARNING (rung claims, Q75): ragtime.8 cl[587 chars]gue"]`.
- `test_an_unfetched_edition_is_named_with_its_reason`: `AssertionError: "song.ragtime.joplin-pine-apple-rag.mutopia is a placeholder (the edition's .ly file was not fetched)" not found in "0 not greater than or equal to 1 : ragtime.8's stride bass is kept by no option on the strict flavour"`.
- Green before and after, by design: the detail is the verdict on a pass; a pass without warnings has none; a bundled rag that was not measured is not called a placeholder.
- `red-q84-test_runner_log.txt`: the Q84 class alone, run first, the same two reds.
- The builds' red is the before lines in the judgement: nothing under *validate*.

## Tests

| Step | Exit | Note |
| --- | --- | --- |
| copies (`copy.txt`) · `parity_reference.py` (`parity.txt`) · `npm ci` (`npm-ci.txt`) | 1 each (robocopy: copied) · 0 · 0 | the fresh-worktree steps |
| `build.py --offline --out <abs app/public/content>`, HEAD's code (`build-baseline-personal.txt`) | 0 | produced `app/public/content`; nothing under *validate* |
| red `test_runner_log` (`red-test_runner_log.txt`; the Q84 class first, `red-q84-test_runner_log.txt`) | 1 · 1 | 3 of 6 red · 2 of 4 |
| Mutopia's files aside, HEAD's code: strict (`build-strict-unfetched-before.txt`) · personal (`build-unfetched-before.txt`) | 0 · 0 | the `[MUTO]` placeholder line; nothing under *validate* |
| the strict case on the personal unfetched catalogue, before (`ci-tests-unfetched-before.txt`) | 1 | the old message |
| green: `test_runner_log` and `test_import_mutopia` (`green-targeted.txt`) | 0 | 18 |
| the strict case on the same catalogue, after (`ci-tests-unfetched-after.txt`) | 1 | the message names the placeholder and its reason; the other case passes |
| mutants: `test_import_mutopia` (`mutants-test.txt`) · `build.py` (`mutants-build.txt`) | 0 · 0 | 3 killed each; every file restored byte for byte |
| Mutopia's files aside, after: strict (`build-strict-unfetched-after.txt`) · personal (`build-unfetched-after.txt`) | 0 · 0 | 13 and 12 lines under *validate*, the Q80 line last |
| `validate.py --dir <strict unfetched> --strict-license` (`validate-strict-unfetched-after.txt`) · the comparison (`warnings-verbatim-after.txt`, `warnings-verbatim-before.txt`) | 0 · 0 · 1 | the build's lines equal the validator's; the before log has none |
| `build.py --offline --out <abs app/public/content>`, final (`build-final-personal.txt`) | 0 | 11 lines under *validate*, no Q75 or Q80 line; reports equal to HEAD's apart from line endings and the ledger (`reports-diff-final.txt`), then restored |
| `validate.py --allow-nc --personal` (`validate-final-personal.txt`) · `validate.py`, as the map names it (`validate-final-map.txt`) · `review.py --check` (`review-check.txt`) | 0 · 0 · 0 | — |
| `unittest discover -s tools/content/tests -t tools/content` (`content-tests-all.txt`) | 0 | 1,451, 4 skipped (not identified), on the final build: Q80's 1,445 and the 6 new |
| `npx vitest run` (`vitest-all.txt`, `vitest-all.stderr.txt`), the map's `unit` for `tools/content/**` | 1 | 308 of 312 files pass; 4 tests fail. Two are the recorded `lessonClaimsAboutApp` line-ending pair (blues.3, 4.7; Entry 101), which reads lessons this change does not touch. The other two (`expectedNote`: a 5 s timeout; `simonTurnCue`: a timing assertion) and a worker that exited with code 134 on `perfectPerformance.4` came from load: the machine was starved at the time (the shell's own `fork: Resource temporarily unavailable`) |
| the three files alone (`vitest-rerun-three.txt`) | 0 | `expectedNote`, `simonTurnCue`, `perfectPerformance.4`: every test passes. So it was load, not a fault; none of the three reads anything this change touches |
| `npm run build:app` (`build-app.txt`) | 0 | — |
| `checks_for_paths.py` over every changed path (`checks-for-paths.txt`) | 0 | 63 of 63 matched, 0 unmatched. It names content-build, content-validate, review-check, content-tests, unit and build-app; every one ran above |

No browser layer; nothing on any port.

Unverified: a runner's Mutopia fetch failing and its log; the Pages and CI runs on this change; the phone.

**Orchestrator's note at the landing (2026-09-29).** Q83+Q84's worktree committed by name (c80e33f2) and merged (36282f6f). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/Q83-Q84/map-min.txt`), the content build offline (the reports compared), the validator, the record check, the whole content suite, then the app steps the map names — the whole unit suite on the rebuilt content, the app build, and the specs the map's minimum names where it names any (map-tests 0; map-min 0; content-build 0; content-validate 0; review-check 0; content-tests 0; vitest-all 1; build-app 0; vitest-timeouts-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; the other failures were timeouts under the machine's load and pass alone (`vitest-timeouts-rerun`); `runs/Q83-Q84/orchestrator-exit.txt`). Q80's follow-ups 2 and 3 (P3), one lane. Beyond the recorded pair, eight unit files failed in the suite under seven builders' load (six five-second timeouts and four assertions in files this seam does not touch, while the shell reported forks failing); all seven files pass alone, 72 of 72 (`vitest-timeouts-rerun`). The map named no browser spec for these files.

## Doc rows

- **`docs/03` §3 step 9 (validate).** Append to the step: "Its `WARNING` lines (Q75's claims not judged on this build, Q80's placeholders set aside for want of a fetch, E1's excerpts, F2's deferrals and the E0 summary) are the step's warnings, printed under it in the validator's own words on a pass as on a failure (Q84, `build.step_validate`); until Q84 a passing step printed only its verdict, so a Pages deploy's log never showed them."
- **`docs/08`, a new row after Q80's** (after Q76's, row "The public build keeps 2.4's tie and ragtime.8's stride bass", if Q80's is not yet spliced):
  - Row name: **A runner's log names the fetch** (Q83 + Q84, Q80's follow-ups 2 and 3).
  - What it covers: `build.step_validate` keeps each line the validator starts with `WARNING` as the step's warnings, indentation stripped, word for word, on a pass and a failure; the summary prints them under *validate*. `test_import_mutopia`'s strict-flavour case, where the built catalogue's rag has no file, names the id and the reason from its `importHint` (what `import_mutopia.IMPORT_HINT` wraps as `{why}`); its pass condition is unchanged.
  - What it guards against: the Pages deploy's log reading "validation OK" with Q75's and Q80's warnings dropped; CI failing on a Mutopia outage with a message that does not say the edition was not fetched; a bundled rag that was not measured called a placeholder.
  - Tests: `tools/content/tests/test_runner_log.py` (added: `TestTheValidateStepKeepsTheValidatorsWarnings`, 4; `TestTheStrictCaseNamesTheFetch`, 2), `test_import_mutopia.py` (the strict case's message) — red on the committed code; six mutants killed (`docs/prompts/runs/Q83-Q84/`).
  - Status: done (Q83 + Q84, Entry 148). The runner is unverified until a Pages or CI log with a failed fetch is read.
- **`docs/08`, the file list** (after `test_review_record.py`, alphabetically after `test_roles.py`/`test_renumber.py` as the list stands): "`test_runner_log.py` — a runner's log names the fetch (Q83, Q84): the validate step keeps the validator's `WARNING` lines on a pass, word for word; the strict Mutopia case's failure names the rag's placeholder and its reason, and never calls a bundled rag one."
- **Backlog, row Q83,** status: "built (Q83 + Q84, Entry 148): the strict case's message names the placeholder's id and its `importHint` reason; the pass condition unchanged. Verified on a runner when a CI log with a failed fetch is read."
- **Backlog, row Q84,** status: "built (Q83 + Q84, Entry 148): `step_validate` keeps the validator's `WARNING` lines as the step's warnings, and the summary prints them under *validate* on a pass. Verified on a runner when a Pages log is read."
- **Backlog, a new row** (area: content pipeline; P3; from Entry 148's Follow-up 1): the validate step now prints every `WARNING` line on every build (11 on a fetched build here), so a fetch failure is one line among a dozen; whether the fetch lines should lead is undecided.
