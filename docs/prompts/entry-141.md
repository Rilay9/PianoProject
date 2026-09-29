### Entry 141 — Q80 — the stale-ladder check tells a build's own placeholders from the catalogue's: a Mutopia file the build could not fetch is now a warning that names the item, not a "ladder.md is stale" error; a licence placeholder or a real ladder change still fails; the kern and MuseTrainer steps write no placeholder at all for a missing clone, so for them the brief's stop line applies (2026-09-29)

**Judgement.** Nothing was looked at on a screen and nothing was heard. This seam changes whether a build passes, not a view. Below is what the runner's log says when a source can't be reached, reproduced here with an offline build that has no copy of Mutopia's two files. That gives the same placeholder reason the step writes on the runner when neither file arrives. That the runner gets exactly this reason is inferred from `import_mutopia.build_entry`, not observed on a runner.

- **Before** (`build-unfetched-before.txt`, the personal flavour CI builds; `build-strict-unfetched-before.txt`, the strict flavour the Pages job builds, with the same lines; both exit 1):

  ```
    ok    import [MUTO]    imported 0 score(s), 1 placeholder(s) (0 cached, 0 converted)
            placeholder song.ragtime.joplin-pine-apple-rag.mutopia: the edition's .ly file was not fetched
    FAIL  validate         content validation FAILED (1 error(s)):
    - docs\generated\ladder.md is stale — the catalog has changed since it was written. Run `python3 tools/content/ladder_report.py` and commit it (replan §2.6).
  ```

- **After** (`build-unfetched-after.txt`, `build-strict-unfetched-after.txt`; exit 0 on both): the same `[MUTO]` line, then `ok validate content validation OK: … (2092 catalog items)` (2091 on the strict build). Running the validator on its own on those catalogues prints the new line (`validate-unfetched-after-rebuilt.txt`, `validate-strict-unfetched-after.txt`, exit 0):

  ```
    WARNING (ladder report, Q80): docs\generated\ladder.md compared without the 1 item this build could not fetch (read as bundled, as the committed report has them): song.ragtime.joplin-pine-apple-rag.mutopia (the edition's .ly file was not fetched); a placeholder made for want of a fetch is not a change to the catalogue
  ```

  On the strict build, Q75's `ragtime.8 claims stride-bass … not judged on this build: 6 of its options unmeasured here` is back beside it. On a build without the rag that claim has no bundled option again, which is true of that build.
- **Where the Q80 line reaches a runner's log, and where it does not.** When the validator passes, `build.py`'s validate step prints only its last line (`step_validate`: `summary_line(output)`). That was already so for Q75's warnings.
  - **The Pages job** runs the build inside `npm run build`, so its log shows the `[MUTO]` placeholder line and "validation OK", but not the Q80 line.
  - **CI** would print the Q80 line in its final "Validate again" step. On a Mutopia outage it never gets there: the content-tests step fails first (below).
  - Read from the build and workflow code and from the local build logs; unverified on a runner.
- **What this changes for the learner (P1 for the phone, stated for the reviewer).** Before this change, a Pages run during a Mutopia outage failed, and the phone kept its last complete build. After it, that run deploys:
  - ragtime.8's *Pine Apple Rag (repeats written out)* as "import your own copy";
  - no bundled option that establishes ragtime.8's stride bass;
  - and that lasts until the next deploy that fetches.

  This is the trade the brief decided, the same rule Q75 applied to claims. It is Question 1, because it changes what the phone runs.

**The mechanism, and the test that told it.**

- **Cause.** The committed report was written on a build that fetched the rag. On a build that did not, the rag's row has no `file`, so `ladder_report.shippable` is false for it. In the unfetched render exactly two lines differ from the committed report (`ladder-diff-unfetched.txt`):
  - `235 song(s) may not be shipped` becomes `236`;
  - `… and 155 more` becomes `… and 156 more`.

  The rag's own row is not printed, because the "wanted" table stops at 80 rows. The rung row is unchanged: its level renders 7.4 either way.
- **Discriminating test.** The same catalogue, with that one placeholder read as bundled, renders the committed report byte for byte. So the difference is the fetch alone. A licence refusal or a song added to the rung is still a difference after the same step (the pins below).
- **The brief's two ways, and the choice.**
  - *Ignore the item's lines*: this cannot work. No line of the report names the item, and the two lines that change carry every other placeholder's count too.
  - *Take the committed catalogue's shippability*: built, but inside the validator's comparison, not inside `ladder_report.render`. `ladder_report.py` (untouched) still writes this catalogue's truth: a report regenerated on a build that could not fetch lists the rag as not bundled, which is what that build ships. That keeps its module note true ("the catalog is the truth about repertoire and Part D is a report of it").

## Done

1. **Item 1: the check tells a build's placeholder from the catalogue's.**
   - `validate.UNFETCHED_REASONS` holds the reasons that count as this build's:
     - *the edition's .ly/.mid file was not fetched*;
     - *<file> is not the pinned file (sha256 …)*.
   - They are read from the placeholder's `importHint`, which is where `import_mutopia.build_entry` writes its reason. `unfetched_placeholders(catalog)` returns each such row with its reason.
   - `ladder_report_findings(catalog, curriculum)` returns errors and warnings. Where the reports differ and such rows exist, it renders once more with those rows given the file their step writes. If that equals the committed report, the result is a warning and no error. If not, the error stands.
   - `stale_ladder_report` keeps its name and its list-of-errors contract, now as the errors half; `main` still adds it to the errors.
   - On real catalogues (`placeholder-reasons.txt`), the rows read as the build's own are:
     - the personal build with every file: 0 of 79 rows without a file;
     - the personal build without Mutopia's files: 1 of 80, the rag;
     - the strict build without them: 1 of 307. Not read there: the 227 licence placeholders (154 "composition is unknown", 46 CC BY-NC-SA, 21 "in-copyright", 6 "still in copyright"), the 7 static rock import rows, the Op. 25 no. 7 étude and the 71 runtime drills.
   - Technically done. Pedagogically: nothing the learner meets changes on a build that fetched. On a build that did not, see the judgement.
2. **Item 2: the build's placeholders are said.**
   - Where the comparison set any rows aside, the validator prints `WARNING (ladder report, Q80): … compared without the N item(s) this build could not fetch …: <id> (<reason>)`, in Q75's voice, printed beside Q75's warnings.
   - Where the error still stands beside a fetch failure, the error goes on to name what it set aside, and says to regenerate the report on a build that fetched them. Without this, the natural fix ("run ladder_report.py and commit it") would write the build's fetch failure into the committed report, and the next build that fetches would fail on it.
3. **Item 3: the strict build's placeholders are unchanged.**
   - The committed report is one report for both flavours by construction: `shippable` reads the personal-only tags as not shipped (P19 review C11, the story in `test_import_musetrainer.py`'s docstring). It was last written on the personal build (Q76's `build-after-personal.txt`).
   - Today the strict build already compares equal to it. `ladder_report.py --check`, whose code Q80 does not touch, says "up to date" on the strict build and on the personal build here, both with every file (`ladder-check-flavours.txt`).
   - On the runner, the Pages runs 36559774503 and 36564690416 validated. Both are from before Q76; no Pages run since Q76 is recorded in this tree, so that is unverified.
   - Kept as it is: no licence reason is read as a fetch (item 1's counts). The strict build with every file validates with no Q80 line and no Q75 line (`validate-strict-fetched-after.txt`, exit 0; 1,785 measured and 235 unmeasured).
4. **Item 4: red first.** `tools/content/tests/test_validate_ladder.py`, 11 cases in 3 classes. The placeholders in it are the ones `import_mutopia.build_entry` really writes (no files; a file that is not the pinned one; a non-commercial licence stated in the `.ly`). If the step's wording changes, the test goes red rather than the check going quiet. The committed report is a temporary file under `build/`, never under `docs/`.
5. **Item 5 held.** No change to the report's content or format, the claim rule, or the import steps. `ladder_report.py`, the workflows and `build.py` are untouched.
6. **The stop line, for two of the three steps that fetch.** `import_kern` and `import_musetrainer` write no placeholder and no reason for a file they cannot find: `report.missing`, and the row is dropped.
   - Observed on a real build with the worktree's `kern/joplin` clone moved aside (`build-kern-joplin-unfetched-after.txt`, exit 1): 2092 items became 2046, and validation failed with 23 errors.
     - one `variantOf … is not in the catalog`;
     - 21 `songOptions references unknown item` (ragtime.5 to ragtime.9);
     - the stale ladder report, with no set-aside clause, because no row carries a fetch reason.
   - The same shape for MuseTrainer, simulated on the built catalogue (`kern-unreachable.txt`: 65 unknown-item errors).
   - Q80 stops there for these two steps. The cross-reference check fails such a build before the ladder check matters, and telling the cause apart needs a placeholder from the import step (Follow-up 1).

## Not done

- **The kern and MuseTrainer steps' missing clones** are not tolerated. The step writes nothing to read. This is the brief's stop line, recorded in Done item 6 and Follow-up 1.
- **The Q80 line in the build step's log.** `build.py` is not this seam's file (Follow-up 3).
- **`ladder_report.py --check`** stays strict and still says "stale" on a build that could not fetch. Searching the worktree outside `node_modules` for `ladder_report.py … check` finds only the tool itself, the validator's note, a schema description and the record. No workflow or map row runs it, so only the validator's check gates.
- **The runner.** No Pages or CI run on this change has been read. That is the orchestrator's, after the reviewer.
- **`docs/03` and `docs/08`** are not edited: another builder is splicing them. The rows are under Doc rows.

## Follow-ups

1. **The kern and MuseTrainer steps drop a file they cannot find (P2, the stop finding).** A GitHub hiccup at clone time on a fresh runner fails CI and the Pages deploy on 22 cross-reference errors (21 unknown items and one `variantOf`) (`build-kern-joplin-unfetched-after.txt`), and the kern step's summary line never says the clone was missing. The candidate: placeholder a missing file with a fetch reason, as `[MUTO]` does, so the ids resolve, and add its wording to `UNFETCHED_REASONS`. That is a change to the import steps, not Q80's.
2. **CI still goes red on a Mutopia outage, through a test (P3).** `test_import_mutopia.TestThePlacement.test_on_the_strict_flavour_ragtime_8s_stride_bass_is_established_by_it` reads the built catalogue. On the build without Mutopia's files it fails with `0 not greater than or equal to 1 : ragtime.8's stride bass is kept by no option on the strict flavour` (`ci-tests-unfetched.txt`, exit 1). The other 10 cases in those two files pass. The rest of the suite's built-catalogue tests were not run against that build.
   - Failing there is CI's recorded design: `ci.yml`, "the content tests that read a fetched edition … do, and fail naming the file".
   - But the message does not name the fetch. It could say when the rag is a fetch placeholder.
3. **The build step hides the validator's warnings when the validator passes (P3).** `build.step_validate` keeps only the last line, so on the Pages job neither Q75's nor Q80's warning reaches the log. It could keep the `WARNING` lines as step warnings, as the `[MUTO]` step does with its placeholder lines.
4. **A relative `--out` breaks the demands step (P3, tooling; met here, worked around).** The detectors run from `app/`, so on a relative `--out` a score file not in `build/demands-cache.json` is looked for under `app\build\…` and not found.
   - A strict build also leaves the cache holding only its own files. So the next personal `--out` build failed (`build-unfetched-after-relative-out.txt`: "attach_demands: 228 of 2012 score files could not be measured … ENOENT … app\build\q80-unfetched\…").
   - A strict one wrote the rag as unmeasured, which brought back Q75's ragtime.8 warning (`validate-strict-fetched-after-relative-out.txt`).
   - Every "after" build quoted here used an absolute `--out` and caches copied fresh from the main checkout (`scripts-chain2-after.ps1`). The relative-out logs are kept under `*-relative-out.*`.
5. **The level the tolerance depends on (P3, a limitation).** A set-aside row keeps its placeholder's level: the table's `placeholderLevel`, 7.4. A fetching build has the level model's estimate, 7.41 in this catalogue. Both render "7.4". If a refit or a table edit makes them render differently, the rung row differs, the tolerance fails, and the error stands, naming the unfetched item, so it is not silent. A test pinning `placeholderLevel` against the built estimate at one decimal would catch it earlier.
6. **A checksum mismatch is read as the build's (judgement, per the brief's list).** If Mutopia republished a pinned file, every build would carry the placeholder and the ladder check would warn every time instead of failing. The `[MUTO]` line and Follow-up 2's test would still show it.

## Questions

1. **Should a Pages deploy go out without a fetched piece?** After Q80, a Mutopia outage at deploy time ships a phone build without *Pine Apple Rag (repeats written out)* and with ragtime.8's stride bass unkept, where it used to fail and leave the previous build on the phone. Keep it that way (the brief's rule: a fetch failure is not a content failure), or add a deploy-side guard that refuses a strict build whose `[MUTO]` step placeheld for want of a fetch? The guard would be a workflow change, for the reviewer.

## Files

- **Changed:** `tools/content/validate.py`:
  - `UNFETCHED_REASONS`, `unfetched_placeholders`;
  - `ladder_report_findings`, with the docstring that was `stale_ladder_report`'s plus the Q80 paragraphs;
  - `stale_ladder_report`, now its errors;
  - one warning loop in `main`.
  - `ladder_report_note` is unchanged: it concerns a missing report, which Q80 does not touch.
- **New:** `tools/content/tests/test_validate_ladder.py`.
- **Not to commit (restored):** the builds rewrote `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md` (line endings only) and `content/scores/imported/SOURCES.md` (the ledger's kern and MuseTrainer rows re-dated, revision `n/a`, because the copied clones have no `.git`). All three were copied back from the snapshot taken before the first build, and `git status` shows them clean (`restore.txt`). `docs/generated/ladder.md` was never rewritten.
- **Captures:** `docs/prompts/runs/Q80/`: this entry, every log named here, and the scripts:
  - `scripts-run-build.ps1`, `scripts-chain-after.ps1`, `scripts-chain2-after.ps1`, `scripts-app-checks.ps1`;
  - `scripts-placeholder-reasons.py`, `scripts-kern-unreachable.py`, `scripts-ci-tests-unfetched.py`.
- **Copied read-only from the main checkout** (`copy.txt`, robocopy 1 = copied, each):
  - `build/cache` (with `build/cache/mutopia`), `build/midi-real`, the three `build/*-cache.json`;
  - `content/scores/imported/kern`, `musetrainer` and `mutopia`, without `.git`.
  - The three caches were copied again before each build of the second chain.
  - The worktree's own `mutopia/published` and `kern/joplin` were moved aside to the scratchpad and back (both back: `chain2-after.txt`). The main checkout's copies were not touched.
- `npm ci` ran in `app/` (`npm-ci.txt`) for the build's detector run.

## The red lines

`red-test_validate_ladder.txt`: the new file on the committed `validate.py`, exit 1, with 6 of the 11 red.

- `test_an_edition_this_build_did_not_fetch_is_not_an_error`: `AssertionError: Lists differ: ['build\\q80-ladder-…\\ladder.md is[125 chars]6).'] != []`.
- `test_a_fetched_file_that_is_not_the_pinned_one_is_the_builds_too`: the same `Lists differ`.
- `test_that_error_names_what_it_set_aside`: `"song.ragtime.joplin-pine-apple-rag.mutopia (the edition's .ly file was not fetched)" not found in '…ladder.md is stale — the catalog has changed since it was written. …'`.
- `test_the_warning_names_the_item_and_its_reason`, `test_nothing_to_set_aside_says_nothing`, `test_a_report_written_without_the_fetch_matches_a_build_without_it_and_needs_no_warning`: `ImportError: cannot import name 'ladder_report_findings'`. The first names the warning. The other two check that the new function stays quiet, and the no-error half of what they pin was already true.
- Green before and after, by design (the pins of "the error as today"):
  - a licence the gate refuses (through `build_entry`);
  - a kern licence placeholder;
  - a song added to the rung;
  - a song added beside an unfetched edition;
  - the strict flavour's licence placeholders against the personal flavour's bundled files.
- The builds' red is the before lines in the judgement: exit 1 on both flavours.

## Tests

| Step | Exit | Note |
| --- | --- | --- |
| `parity_reference.py` (`parity.txt`) · copies (`copy.txt`) · `npm ci` (`npm-ci.txt`) | 0 · 1 each (robocopy: copied) · 0 | the fresh-worktree steps |
| `build.py --offline`, HEAD's code (`build-baseline-personal.txt`) | 0 | `[MUTO] imported 1`; the reports equal to HEAD's apart from line endings and the ledger (`reports-diff-baseline.txt`) |
| `build.py --offline --out …`, Mutopia's files aside, HEAD's code: personal (`build-unfetched-before.txt`) · strict (`build-strict-unfetched-before.txt`) | 1 · 1 | the stale-report error, the before |
| `validate.py` on those two, HEAD's code (`validate-unfetched-before.txt`, `validate-strict-unfetched-before.txt`) | 1 · 1 | the same error |
| the unfetched ladder against the committed one (`ladder-diff-unfetched.txt`) | 1 (diff) | two lines, neither naming the item |
| red `test_validate_ladder` (`red-test_validate_ladder.txt`) | 1 | 6 of 11 red |
| green `test_validate_ladder` (`green-test_validate_ladder.txt`) | 0 | 11 |
| `validate.py` after the change, on the catalogues the before builds wrote (`validate-unfetched-after.txt`, `validate-strict-unfetched-after.txt`) | 0 · 0 | the Q80 warning; no error |
| `build.py`, Mutopia's files aside, after: personal, absolute out (`build-unfetched-after.txt`) · strict, relative out from the first chain (`build-strict-unfetched-after.txt`; every strict file measured from the cache, the rag a placeholder either way) | 0 · 0 | "validation OK"; `validate-unfetched-after-rebuilt.txt` 0, with the warning |
| strict build with every file, absolute out, after (`build-strict-fetched-after.txt`) · its validator (`validate-strict-fetched-after.txt`) | 0 · 0 | no Q80 line and no Q75 line; 1,785 measured, 235 unmeasured |
| `ladder_report.py --check` (unchanged code) on strict, personal and unfetched (`ladder-check-flavours.txt`) | 0 · 0 · 1 | today's comparison: both complete flavours up to date |
| placeholder reasons on three catalogues (`placeholder-reasons.txt`) | 0 | only the rag, on the builds without its files |
| kern `joplin` clone aside, after (`build-kern-joplin-unfetched-after.txt`) · the simulation (`kern-unreachable.txt`) | 1 · 0 | the stop finding: 21 unknown items, one `variantOf`, the stale report |
| the built-catalogue tests on the unfetched build (`ci-tests-unfetched.txt`) | 1 | Follow-up 2's one failure, 10 others pass |
| `build.py --offline`, final, after (`build-final-personal.txt`) · `validate.py` (`validate-final-personal.txt`) · `review.py --check` (`review-check.txt`) | 0 · 0 · 0 | reports equal to HEAD's apart from line endings and the ledger (`reports-diff-final.txt`), then restored |
| targeted: `test_validate`, `test_validate_ladder`, `test_validate_sections`, `test_validate_claims`, `test_import_mutopia`, `test_import_musetrainer` (`targeted-tests.txt`) | 0 | 85 |
| `unittest discover -s tools/content/tests -t tools/content` (`content-tests-all.txt`) | 0 | 1,445, 4 skipped (not identified), on the final build |
| `test_validate_ladder`, `test_validate`, `test_validate_sections` after the last edit, which touched a docstring only (`green-after-docstring.txt`) | 0 | 43 |
| `npx vitest run` (`vitest-all.txt`), the map's `unit` for `tools/content/*.py` | 1 | 311 of 312 files pass. The 2 failures are the recorded `lessonClaimsAboutApp` line-ending pair (blues.3, 4.7; Entry 101), which reads lessons this change does not touch |
| `npm run build:app` (`build-app.txt`) | 0 | — |
| `checks_for_paths.py` over the changed paths (`checks-for-paths.txt`) | 0 | 6 of 6 matched, 0 unmatched. It names content-build, content-validate, review-check, content-tests, unit and build-app; every one ran above |

No browser layer; nothing on port 4173.

Unverified:
- the runner's Mutopia fetch failing, and its log;
- the Pages and CI runs on this change;
- the phone.

**Orchestrator's note at the landing (2026-09-29).** Q80's worktree committed by name (2d9e7e2c) and merged (589a7860). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/Q80/map-min.txt`), the content build offline (the reports compared), the validator, the record check, the whole content suite, then the two app steps the map names for the content tools — the whole unit suite on the rebuilt content and the app build (map-tests 0; map-min 0; content-build 0; content-validate 0; review-check 0; content-tests 0; vitest-all 1; build-app 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/Q80/orchestrator-exit.txt`). The builder's Question 1 — a deploy that could not fetch the rag now ships the phone a build without it, where it used to fail and leave the previous build — is a product choice put to the reviewer in the handoff and recorded as Q86; the orchestrator did not decide it. The map's minimum names the unit suite and the app build for the content tools; the chain's first pass had left them out and a second pass ran them on the rebuilt content before this record.

## Doc rows

- **`docs/03` §3 step 9 (validate).** After "the committed ladder report", insert: "(since Q80, a placeholder the build made for want of a fetch — `import_mutopia`'s *file was not fetched* or *is not the pinned file* — is compared as bundled, as a build that fetched it has it, and warned by name, never failed; a licence placeholder or a changed ladder still fails, and that error names any fetch it set aside; the kern and MuseTrainer steps drop a missing file rather than placeholder it, so a missing clone still fails, on the cross-references)".
- **`docs/03`, the tools list, the `ladder_report.py` line.** Append: "— apart from a build's own fetch failures, which `validate.ladder_report_findings` warns (Q80); the report is one for both flavours, since `shippable` reads the personal-only tags as not shipped, and the generator's own `--check` stays strict".
- **`docs/08`, a new row after Q75's.**
  - Row name: **The stale-ladder check fails the catalogue's changes, not the build's fetch** (Q80, Q76's first landing chain).
  - What it covers: `validate.UNFETCHED_REASONS` and `unfetched_placeholders` (the reasons `import_mutopia.build_entry` writes when its files were not fetched or not the pinned ones). `ladder_report_findings`: where the committed report differs, those rows are read as bundled and the report compared again; equal gives a `WARNING (ladder report, Q80)` naming each item and reason, and no error; still different gives the error, naming what it set aside. `stale_ladder_report` is its errors.
  - What it guards against:
    - a build that could not reach Mutopia's site or the GitHub mirror failing validation on "ladder.md is stale", on CI and on the Pages deploy;
    - a licence placeholder, or a changed rung, passing as a fetch failure;
    - the committed report regenerated on a build that could not fetch.
  - Tests: `tools/content/tests/test_validate_ladder.py`: `TestABuildsOwnPlaceholders` (5), `TestTheCataloguesOwnChanges` (4), `TestAChangeBesideAFetchFailure` (2).
  - Status: done (Q80, 2026-09-29). The runner is unverified until a run with a failed fetch is read.
- **`docs/08`, the file line** for `test_validate_sections.py` stays. Add the line: "`test_validate_ladder.py` — the stale-ladder check tells a build's own placeholders (a Mutopia file not fetched, or not the pinned one) from the catalogue's: warned by name, never failed; a licence placeholder, a song added or either beside a fetch failure still fail (Q80)".
- **Backlog, row Q80,** status: "built (Q80, Entry 141): the validator reads `import_mutopia`'s fetch reasons, compares the ladder report with those rows as bundled, and warns them by name; licence placeholders and ladder changes still fail. The kern and MuseTrainer steps write no placeholder for a missing clone (the brief's stop line), a new row. Verified when a runner's log with a failed fetch is read."
- **Backlog, new rows** (area: content pipeline):
  1. The kern and MuseTrainer steps drop a missing file instead of placeholding it with a reason, so a clone failure fails validation on cross-references (Follow-up 1; P2).
  2. `test_import_mutopia`'s strict-flavour test does not name a fetch placeholder as its cause (Follow-up 2; P3).
  3. `build.step_validate` drops the validator's warnings when the validator passes (Follow-up 3; P3).
  4. A relative `--out` breaks the demands step for uncached files, and a strict build prunes the demands cache to its own files (Follow-up 4; P3).
  5. Question 1: deploy without a fetched piece, or guard the deploy (product; the reviewer and the owner).
