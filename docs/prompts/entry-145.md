### Entry 145 — Q82 — the kern and MuseTrainer import steps placeholder a file they cannot find, with the fetch reason, as Mutopia's step does: with the `kern/joplin` clone, five MuseTrainer files or the whole MuseTrainer clone moved aside, the build now validates on both flavours where it failed on 23, 15 and 88 errors; a sectioned fetch placeholder is warned, not failed (a second `validate.py` change, ruled during the seam); the Chopin first editions' group rows still drop (the brief's stop line) (2026-09-29)

**Judgement.** Nothing was looked at on a screen and nothing was heard. This seam changes whether a build passes and which rows a build carries, not a view. Below is what the runner's log says when a clone does not arrive, reproduced with offline builds in which the worktree's own copy of the clone was moved aside. That this is exactly what a runner logs when GitHub fails at clone time is inferred from `fetch.py` (a clone that fails leaves no folder) and `build.py` (the step's last line is what the log shows), not observed on a runner.

- **`kern/joplin` aside** (the personal flavour CI builds; the strict flavour the Pages job builds prints the same lines with 2045 and 2091 items):

  Before (`build-kern-personal-before.txt`, exit 1):
  ```
    ok    import [KERN]    imported 116 score(s), 1 placeholder(s), excluded 72 (116 cached, 0 converted)
    ok    merge catalog    2046 items, …
    FAIL  validate         content validation FAILED (23 error(s)):
    - song.ragtime.joplin-pine-apple-rag.mutopia: variantOf song.ragtime.joplin-pine-apple-rag is not in the catalog
    - lesson ragtime.5: songOptions references unknown item song.ragtime.joplin-augustan-club-waltz
      … 20 more unknown items on ragtime.5 to ragtime.9 …
    - docs\generated\ladder.md is stale — the catalog has changed since it was written. …
  ```
  After (`build-kern-personal-after.txt`, exit 0; `build-kern-strict-after.txt`, exit 0):
  ```
    ok    import [KERN]    imported 116 score(s), 1 placeholder(s), excluded 73, 46 not fetched (placeheld) (116 cached, 0 converted)
    ok    merge catalog    2092 items, …
    ok    validate         content validation OK: … (2092 catalog items)
  ```
  The validator on its own (`validate-kern-personal-after-final.txt`, `validate-kern-strict-after-final.txt`, exit 0) prints **no Q80 ladder warning**. This differs from the brief's expectation ("with the Q80 warning naming the placeholders"). The Joplin rows are CC BY-NC-SA, so a fetching build ships none of them either: on the personal flavour they are bundled with `nc-personal-build`, on the strict flavour they are licence placeholders. The rows are also not printed within the report's 80 "wanted" rows. So the report does not change and the check has nothing to set aside. The report's equality is inferred from the check's silence, not diffed. What the log does say about the missing clone is the `[KERN]` line above, and Q75's claim line ("36 unmeasured on this build" personal, "59" strict), with ragtime.5's deferral naming "3 unmeasured on this build".

- **The whole MuseTrainer clone aside** (what a failed clone leaves):

  Before (`build-mtlib-personal-before.txt`, exit 1; strict the same with 2026 items):
  ```
    ok    import [MT]      musetrainer library not present at …\musetrainer\scores; run tools/content/fetch.py first
    FAIL  merge catalog    2027 items, … excerpts refused: excerpt.classical.beethoven-ode-to-joy.easy.b9-12: its parent 'song.classical.beethoven-ode-to-joy.easy' is not in the catalogue
    FAIL  validate         content validation FAILED (88 error(s)):
  ```
  The 88 errors:
  - 65 unknown items (lessons 2.3 onwards);
  - 4 `variantOf` and 8 `alternatives` naming absent rows;
  - 8 `sections.json names … not in the catalog`;
  - 1 excerpt parent;
  - the stale report;
  - one claim failed outright (3.4 ledger-lines, "0 unmeasured on this build", because the dropped options were simply gone).

  Q80 simulated 65 unknown items; the real failure is wider. The merge step stops the build before validation matters.

  After (`build-mtlib-personal-after.txt`, `build-mtlib-strict-after.txt`, exit 0 both):
  ```
    ok    import [MT]      imported 0 score(s), excluded 4, normalised 0, 64 not fetched (placeheld) (0 cached, 0 converted)
    ok    merge catalog    2091 items, 22 with named sections, 4 excerpt(s) cut (1 not: the parent is not bundled here), …
    ok    validate         content validation OK: … (2091 catalog items)
  ```
  2091 is the full build's 2092 less the one excerpt that is not cut. The strict build has 2090. The validator on its own (`validate-mtlib-*-after.txt`, exit 0) prints:
  - `WARNING (ladder report, Q80): … compared without the 64 items this build could not fetch …`, each with its reason. The free songs would ship on a fetching build, so here the report does differ, and differs by the fetch alone;
  - eight `WARNING (sections, Q82): <id>: named sections not checked on this build: <file> was not fetched: the MuseTrainer library is not on this build`;
  - Q75's line "21 unmeasured on this build" (80 on the strict flavour).
- **Five MuseTrainer files aside** (three free songs on rungs 2.3 to 2.5, one the owner's build carries for its composition, one the table excludes for its edition):
  - Before (exit 1 both): the merge step fails on the same excerpt, then 15 validation errors.
  - After, on the final code (`build-mt-*-after2.txt`, exit 0 both): `[MT] … 4 not fetched (placeheld)`. `Canon_in_D_3` stays excluded. The Q80 warning names 4 items, and two section warnings follow.
- **What this changes for the learner, stated for Q86, not decided here.** Before Q82, a CI run or a Pages deploy whose GitHub clone of MuseTrainer or `craigsapp/joplin` failed failed validation, and the phone kept its previous build. After Q82 that deploy goes out:
  - with the missing library's 64 songs as *import your own copy* rows, among them the songs of rungs 2.3 to 2.5 (Happy Birthday, Greensleeves, Ode to Joy);
  - or, for Joplin, with the strict flavour unchanged, since its Joplin rows are licence placeholders anyway.

  The words such a row shows are the step's `importHint` (read from the catalogue, `rows.txt`; the screen was not looked at): *Not bundled in this build: Happy_Birthday_To_You_C_Major.mxl was not fetched: the MuseTrainer library is not on this build. Clone it with `python tools/content/fetch.py --only musetrainer` on a machine that can reach github.com, or import your own copy of the score.* That is a file name and a command line in front of a learner, in the style Mutopia's and the licence placeholders' hints already have (Follow-up 4).

**The mechanism, and the tests that told it.**

- **Cause.** `import_kern.build_entry` and `import_musetrainer.import_library` appended a file they could not find to `report.missing` and wrote no row. Both steps' `main()` also returned an empty fragment when the clone's folder was absent. So every consumer that names such an id pointed at nothing: the curriculum, a `variantOf`, an `alternatives` list, `sections.json`, an approved excerpt. The build failed on the first of them to run (the merge step's excerpt cutter, then the validator).
- **Discriminating test.** The same offline build, the same moved-aside clone, the step's code before and after:
  - before, the ids are absent and the build fails;
  - after, the ids are placeholders, and every cross-reference that failed resolves (`counts.txt`: 0 curriculum errors, 0 catalogue cross-reference errors, 0 ladder errors on every "after" catalogue).
  - The change acts at the import step, where Mutopia's already did, not on each consumer.
- **A second mechanism, met in the "after" run.** With the clone aside, validation still failed on 2 errors from a check outside the brief's files. `validate.section_errors` needs a sectioned item's printed bar count, from `build/render-report.json` or from the item's file. `build.attach_sections` puts the sections on every item by id, placeholders included, and a placeholder has no file.
  - This worktree has no render report. Neither does a fresh runner when it validates: neither workflow restores it (their cache is `build/cache` and `build/render-manifest.json`), and CI's render step runs after the build. That is read from the workflows, not observed.
  - The owner's machine has a render report from an earlier render, and there the check reads that count and passes (`sections.txt`, the main checkout's report read only), which is why the owner's build would not have shown this.
  - I asked; the orchestrator ruled a narrow change (b). An item that `unfetched_placeholders` names, with no file and no counted bars, is warned, not failed. Every other case of the check is unchanged, and pinned (the red lines).

## Done

1. **Item 1, kern.**
   - A file the clone lacks is a placeholder (`unfetched_placeholder`) in the licence placeholder's shape:
     - no file;
     - the table's `level`, `levelSource` "estimated" if banded else "judged", as the licence placeholder takes it;
     - tracks, concepts, subtitle, composer, genre, grade;
     - `alternatives`, `variantOf`, `variantLabel`;
     - tags `kern, <repo>, import-only`;
     - the source block's name, url and editionNotes.
   - `importHint`: *Not bundled in this build: `<path>` was not fetched: the kern clone is not on this build. Clone it with `python tools/content/fetch.py --only kern` …*. The reason is `UNFETCHED_REASON`, the same words on every such row.
   - What only the file says is left out, not guessed: the licence records (the source's `license` reads *not read on this build: the file was not fetched*), key, metre, tempo, and `fetchedAt` (None).
   - The table's `exclude` is now read before the missing-file check, so `searchlight.krn` is excluded whether or not it arrived (`excluded 73` in both builds), and `missing` counts exactly the placeholders.
   - The whole-folder early exit in `main()` is removed (deviation 1, approved); its stderr notice stays, reworded.
   - The stderr list still names every missing file. The last line adds `, N not fetched (placeheld)` only when N > 0, so a build that fetched everything prints the line it always did (`build-final-personal.txt` against `build-baseline-personal.txt`: all 14 step lines equal, `compare-builds.txt`).
   - Technically done. Pedagogically, nothing changes on a build that fetched. On one that did not, see the judgement.
2. **Item 2, MuseTrainer.**
   - A filename the library lacks is a placeholder in the strict-build placeholder's shape (`STATED_LICENSE`, the table's level, `judged`), with `importHint` *`<file>` was not fetched: the MuseTrainer library is not on this build* and the same "Clone it with …" tail.
   - The check sits after the edition exclusion, which stays an exclusion, and after the composition verdict, whose `personal-build` tag and `compositionStatus` the row keeps.
   - It counts in `missing`, not in `placeheld` or `imported`.
   - The early exit is removed. The stderr now lists each missing file, and the last line counts them.
3. **Item 3, the validator.** `UNFETCHED_REASONS` gains `\S+ was not fetched: the (?:kern clone|MuseTrainer library) is not on this build`, and its comment is updated. `unfetched_placeholders` and `ladder_report_findings` read the new rows as Q80 reads Mutopia's (the MuseTrainer builds' warnings above).
   - **Beyond the brief, ruled during the seam: a second change to `validate.py`, in `section_errors`.**
     - It is now `section_findings` (errors, warnings); `section_errors` keeps its name and contract as the errors half.
     - A sectioned item that `unfetched_placeholders` names, with no file and no counted bars, gives `named sections not checked on this build: <reason>` as a warning.
     - `main` computes it once and prints `WARNING (sections, Q82): …` beside the Q80 line.
     - Why: without it, a build whose MuseTrainer clone did not arrive still failed, on a reason that says nothing about the content (the mechanism above).
4. **Item 4, both flavours alike.**
   - The unit tests hold the same row on both flavours: `test_both_flavours_carry_the_same_row`, `test_the_two_builds_carry_the_same_placeholders`, `test_both_reasons_are_read_as_this_builds_on_either_flavour`.
   - Every moved-aside case was built on both flavours; the cross-references resolve on both (`counts.txt`).
5. **Item 5, red first, unit.** 22 new cases; 18 red on the code they test and 4 green pins (the red lines):
   - `test_import_kern.TestAFileTheCloneLacks` (6);
   - `test_import_musetrainer.TestAFileTheLibraryLacks` (7);
   - `test_validate_ladder.TestTheKernAndMuseTrainerStepsOwnPlaceholders` (4: 3 red, 1 pin);
   - `test_validate_sections.TestAPlaceholderThisBuildCouldNotFetch` (5: 2 red, 3 pins).

   Every placeholder in the ladder tests is built by the step itself. Q80's 11 cases are untouched and green.
6. **Item 6, red first, the build.**
   - The builds are in the judgement, before and after, on both flavours, with counts in `counts.txt` (`scripts-counts.py` reads each real catalogue).
   - Q80's `scripts-kern-unreachable.py` was not rerun as the evidence. It simulates the old behaviour by deleting a repository's rows from a built catalogue, so its result cannot change with the code. The real builds replace it, and the brief's "before" is reproduced exactly: 2046 items and 23 errors.
   - MuseTrainer was built for real, not simulated: five files aside, and the whole clone aside.
7. **Item 7 held.**
   - Untouched: `build.py`, `ladder_report.py`, `import_mutopia.py`, `difficulty.py`, `test_difficulty.py`, `app/src/**` and the workflows.
   - A placeholder's level is the licence placeholder's source (the table).
8. **The stop line, observed** (the coordinator's ruling on finding 2). With `kern/chopin-first-editions` aside (`build-chopin-personal-after.txt`, exit 1):
   - `[KERN] imported 46 score(s), 0 placeholder(s), excluded 1`;
   - 1975 items (117 `.nifc` rows gone);
   - 13 errors: 12 unknown items on classical.4.shelf, classical.6 to 9 and rock.6, and the stale report.

   The group rows get their ids, titles and levels from a survey of the files (`expand_groups`), so there is nothing to placeholder from. Built nothing for it (Follow-up 1).
9. **Finding 3, demonstrated** (`nc-set-aside.txt`, exit 0; fixture):
   - A kern CC BY-NC-SA row, bundled on a fetching personal build with `nc-personal-build`, is not shippable, and neither is its fetch placeholder. Where the report prints the row, its "why" differs, and Q80's second render gives the row a file but not the tag, reading it as shippable.
   - Result: `1 error(s), 0 warning(s)`, the error naming `song.ragtime.kern-rag (nifc/kern/rag.krn was not fetched: …)`.
   - `validate.py` is unchanged for it (Follow-up 2).

## Not done

- **The Chopin first editions' group rows.** A missing `chopin-first-editions` clone still drops 117 rows and fails on 12 unknown items: the brief's stop line (Done 8, Follow-up 1).
- **The Q80 warning on a kern-only fetch failure.** It does not appear, because the report does not change. That is an observation against the brief's expectation, not a fault; the `[KERN]` line is the log's only statement of it (Follow-up 3).
- **The runner.** No CI or Pages run on this change has been read, and no real GitHub failure was provoked. Unverified.
- **`docs/03` and `docs/08`.** Not edited; the rows are under Doc rows.

## Follow-ups

1. **The Chopin first editions' group rows cannot be placeheld (P2, the stop finding).**
   - A clone failure of `pl-wnifc/humdrum-chopin-first-editions` drops 117 rows, 12 of them named on 6 rungs, and fails CI and the Pages deploy.
   - The `[KERN]` line gives no sign: "imported 46 score(s), 0 placeholder(s), excluded 1". The only sign is `guard chopin-first-editions (group Op. …): not cloned` on stdout, which `build.py` does not show.
   - The candidate: commit the expanded group rows (id, title, level, file key) as a table the step reads when the clone is absent, then placeholder them as item 1 does.
2. **Q80's set-aside and a kern NC row (P3, latent; finding 3).** The second render gives a set-aside row a file and no tag. A fetching build's `nc-personal-build` row is not shippable, so where the report prints such a row the tolerance fails and the error names it (Done 9). On the real catalogue the Joplin rows sit past the 80 printed rows, so it does not fire today. A report that printed them, or a filter that shortened the list, would.
3. **What the log says for a kern-only fetch failure (P3).** Only the `[KERN]` line's "46 not fetched (placeheld)" says it. The Q80 check is silent, since the report does not change, and Q84 (the build step hides the validator's warnings) would not change that for kern.
4. **The words a learner reads on a build that could not clone (P2 for the phone; unverified on a screen).** The placeholder's hint names a file and a command line ("Clone it with `python tools/content/fetch.py --only musetrainer` …"), as Mutopia's and the licence placeholders' hints do. On a Pages deploy after a failed MuseTrainer clone, those are the words on rungs 2.3 to 2.5's songs. This belongs with Q86: whether such a deploy should happen at all, and if so what the row should say to a learner.
5. **One set of words for two situations (P3; finding 4, kept as ruled).** A clone that arrived but lacks a file (an upstream rename, a stale local clone) gets "the kern clone is not on this build", which is then not literally true. Such a build now passes, with a warning for MuseTrainer and silently for kern apart from the step line, where it used to fail on cross-references.
6. **CI's content tests on a missing clone (P3; read, not run).** Tests that read an edition the build fetches fail naming the fetch by design (`test_note_loss.py` reads `kern/joplin/kern/school.krn`; `ci.yml`'s build-step comment). So CI stays red on a Joplin clone failure after Q82. The Pages job runs no tests, so it deploys. The built-catalogue tests were not run against the moved-aside builds.
7. **Tooling (P3).**
   - The shared session scratchpad lost the worktree's moved MuseTrainer clone during the "before" phase: moved at 15:38:23, gone at 15:49:37. It was copied again read-only from the main checkout, 69 files as there (`copy-musetrainer-again.txt`). Later phases moved clones into the worktree's own `build/`.
   - Windows PowerShell drops an empty-string argument to a native command, which broke the first final chain (`chain-final-first-attempt.txt`); fixed in `scripts-final.ps1`.

## Questions

1. **Q86, widened.** After Q82 the question covers two more sources:
   - a deploy whose MuseTrainer clone failed now ships 64 *import your own copy* rows, among them rungs 2.3 to 2.5's songs, where it used to fail and leave the previous build on the phone;
   - a Joplin clone failure changes nothing a strict build ships.

   The brief leaves the answer to the reviewer and the owner, and this seam does not prejudge it.

## Files

- **Changed:**
  - `tools/content/import_kern.py`: `UNFETCHED_REASON`, `UNFETCHED_HINT`, `UNFETCHED_LICENSE`, `unfetched_placeholder`, `build_entry`'s order and its missing branch, `main`'s early exit and summary.
  - `tools/content/import_musetrainer.py`: `UNFETCHED_REASON`, `UNFETCHED_HINT`, `import_library`'s missing branch and the tags moved above it, `main`'s early exit and summary.
  - `tools/content/validate.py`: `UNFETCHED_REASONS` and its comment; `section_findings`, with `section_errors` as its errors half, and the one call and one warning loop in `main` (the ruled second change).
  - `tools/content/tests/test_import_kern.py`
  - `tools/content/tests/test_import_musetrainer.py`
  - `tools/content/tests/test_validate_ladder.py`
  - `tools/content/tests/test_validate_sections.py`
- **Added:** `docs/prompts/tasks/Q82-clone-missing-is-a-placeholder.md` (the brief, copied from the main checkout) and `docs/prompts/runs/Q82/`.
- **Not to commit (restored):** the builds rewrote `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md` (line endings only) and `content/scores/imported/SOURCES.md` (the ledger re-dated, revision `n/a`, since the copied clones have no `.git`). All three were copied back from the snapshot taken before the first build, and `git status` shows them clean (`restore.txt`). `docs/generated/ladder.md` was never rewritten.
- **Captures:** `docs/prompts/runs/Q82/`, which holds this entry, every log named here, and these scripts:
  - `scripts-copy.ps1`, `scripts-run.ps1`, `scripts-chain.ps1` (`-Phase before|after|after2`, `-Only`), `scripts-final.ps1`;
  - `scripts-counts.py`, `scripts-sections.py`, `scripts-nc-set-aside.py`, `scripts-rows.py`, `scripts-compare-builds.py`.
- **Copied read-only from the main checkout** (`copy.txt`, robocopy 1 = copied, each):
  - `build/cache`, `build/midi-real`, the three `build/*-cache.json` (copied again before each build);
  - `content/scores/imported/kern`, `musetrainer` and `mutopia`, without `.git`.
  - The main checkout was never written.
- `npm ci` ran in `app/` (`npm-ci.txt`).

## The red lines

`red-unit.stderr.txt` holds the three step and ladder files on the unchanged code: 75 run, 10 failures and 6 errors, which are 16 of the 17 new cases.

- **kern:**
  - `Lists differ: [] != ['song.ragtime.test-rag']` (the placeholder; both flavours);
  - `KeyError: 'song.ragtime.other'` (the licence placeholder's shape);
  - `Lists differ: ['joplin/kern/rag.krn'] != []` (an excluded row counted missing);
  - `'1 not fetched' not found in 'imported 0 score(s), 0 placeholder(s), excluded 0 (0 cached, 0 converted)'`;
  - `SystemExit: 0` at `main`'s `sys.exit(0)` (no kern folder at all).
- **MuseTrainer:**
  - `'song.classical.gone' not found in {…}`;
  - `KeyError: 'song.classical.modern'` / `'song.classical.gone'` (three cases);
  - `'edition.mxl' not found in []` (an edition exclusion counted missing);
  - `'2 not fetched' not found in 'imported 1 score(s), excluded 0, normalised 1 (…)'`;
  - `SystemExit: 0` (no library at all).
- **ladder:**
  - `Lists differ: ['build\\q82-ladder-…\\ladder.md is[125 chars]6).'] != []` (kern and MuseTrainer);
  - `Lists differ: [] != [('song.ragtime.kern-rag', 'nifc/kern/rag.[151 chars]ld')]`.

  The pin `test_both_steps_licence_placeholders_are_still_the_catalogues` was green before and after.
- **sections** (`red-test_validate_sections.stderr.txt`: 20 run, 1 failure, 1 error):
  - `Lists differ: ['song.test: has named sections but its pr[104 chars]ked'] != []`;
  - `ImportError: cannot import name 'section_findings'`.

  Three pins were green before and after: a licence placeholder of either step, a bundled file with no countable bars, and a fetch placeholder the render report counts.
- **The builds' red** is the "before" lines in the judgement: exit 1 on all six "before" builds and their validators.

## Tests

| Step | Exit | Note |
| --- | --- | --- |
| copies (`copy.txt`) · MuseTrainer again (`copy-musetrainer-again.txt`) · `parity_reference.py` (`parity.txt`) · `npm ci` (`npm-ci.txt`) | 1 each (robocopy: copied) · 1 · 0 · 0 | the fresh-worktree steps |
| `build.py --offline`, HEAD's code (`build-baseline-personal.txt`) | 0 | 2092 items; the rewritten reports recorded (`reports-diff-baseline.txt`) |
| "before" chain, HEAD's code (`chain-before.txt`; the first launch was stopped, `chain-before-stopped.txt`): kern, mt, mtlib × personal, strict | 1 on all six builds and all six validators | 23 · 23 · 15 · 15 · 88 · 88 errors; mt and mtlib fail at the merge first |
| red unit, 4 modules (`red-unit.*`) | 1 | 16 of 17 new red |
| green unit, 4 modules (`green-unit.*`) | 0 | 75 |
| `scripts-nc-set-aside.py` (`nc-set-aside.txt`) | 0 | finding 3: 1 error on the fixture |
| "after" chain (`chain-after.txt`): kern personal · kern strict | 0 / 0 · 0 / 0 (build / validator) | 2092 · 2091 items; no Q80 warning |
| — mt personal · mt strict (built before the sections change) | 1 / 1 · 1 / 0 | the sections finding: 2 errors; the strict validator ran after the change and passed |
| — mtlib personal · mtlib strict | 0 / 0 · 0 / 0 | 64 placeheld; Q80 warning (64); 8 section warnings |
| — chopin personal | 1 / 1 | the stop line: 1975 items, 12 unknown items |
| red `test_validate_sections` (`red-test_validate_sections.*`) | 1 | 2 of 5 new red |
| green `test_validate_sections`, `test_validate_ladder`, `test_validate` (`green-test_validate_sections.*`) | 0 | 52 |
| "after2" (`chain-after2.txt`): mt personal · mt strict, on the final code | 0 / 0 · 0 / 0 | Q80 warning (4); 2 section warnings |
| `scripts-counts.py` (`counts.txt`) · `scripts-sections.py` (`sections.txt`) · `scripts-rows.py` (`rows.txt`) | 0 · 0 · 0 | every "after" catalogue: 0 cross-reference errors |
| final chain (`chain-final.txt`; the first attempt's Python steps did not start, `chain-final-first-attempt.txt`, and its vitest and app build ran on the baseline content, `*-first-attempt.*`): validators on the kern "after" catalogues, final code | 0 · 0 | — |
| strict build, every clone (`build-whole-strict-after.txt`) · its validator | 0 · 0 | 2091 items; `[MT]`/`[KERN]` lines as HEAD's; 59 unmeasured; no Q80 or Q82 line |
| `build.py --offline --out <abs>/app/public/content` (`build-final-personal.txt`) · `validate.py` (`validate-final.txt`) · `validate.py --allow-nc --personal` (`validate-final-personal.txt`) | 0 · 0 · 0 | all 14 step lines equal to the baseline's (`compare-builds.txt`, exit 0; the elapsed time is on its own line) |
| `review.py --check` (`review-check.txt`) | 0 | — |
| `unittest discover -s tools/content/tests -t tools/content` (`content-tests-all.*`) | 0 | 1,467, 4 skipped (not identified), on the final build |
| `npx vitest run` (`vitest-all.*`) | 1 | 310 of 312 files pass. The 3 failures: the recorded `lessonClaimsAboutApp` line-ending pair (blues.3, 4.7; Entry 101), and `expectedNote.test.ts` timing out at 5 s, which passes alone (`vitest-expectedNote-alone.*`, exit 0, 12 of 12): load, read as such |
| `npm run build:app` (`build-app.*`) | 0 | — |
| `checks_for_paths.py` over the changed paths (`checks-for-paths.txt`) | 0 | 9 of 9 matched; names content-build, content-validate, review-check, content-tests, unit and build-app, every one run above |

No browser layer; nothing on ports 4173, 4413 or 4423.

**Unverified:**
- a runner's failed clone and its log;
- the CI and Pages runs on this change;
- the phone and the words on a screen.

**The brief's line numbers.** The brief was wrong in one place: the kern licence placeholder is not at "about 505–515", which is group expansion's level override. It is the `else` branch at 679–684 at HEAD, with the shared `catalog_item` call after it. Its other line numbers held at HEAD: `ImportReport.missing` 104, `build_entry` 543 with `report.missing.append` at 559, `import_kern` 725, the summary 807–822, and MuseTrainer's 82, 139–232 and 159.

**Orchestrator's note at the landing (2026-09-29).** Q82's worktree committed by name (7cdc0f72) and merged (6143a26e). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/Q82/map-min.txt`), the content build offline (the reports compared), the validator, the record check, the whole content suite, then the app steps the map names — the whole unit suite on the rebuilt content, the app build, and the specs the map's minimum names where it names any (map-tests 0; map-min 0; content-build 0; content-validate 0; review-check 0; content-tests 0; vitest-all 1; build-app 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/Q82/orchestrator-exit.txt`). Q80's follow-up 1 and its stop line (P2), under Q75's ruling and Q80's mechanism (`handoffs/2d9e7e2c.md`, with you). Landed in one chain with X31a under your batching conditions (`responses/questions-b11e4f89.md`): the map's minimum over the union of both merges' paths (f6d36ee9 to 6143a26e); the content build, validator, record check and content suite once for both; the unit suite red only on the recorded pair; the map named no browser spec. Your Q86 ruling and Q88's architecture approval (`responses/questions-ea14b1fe.md`) came after this seam was built; Q88's guard reads the placeholders this seam writes.

## Doc rows

- **`docs/03` §3 step 1 (fetch).** After "a source that cannot be reached is a smaller build rather than a failed one", append: "— and every import step keeps that promise: a file that did not arrive is a placeholder that says it was not fetched (`[MUTO]` since Q76, `[MT]` and `[KERN]` since Q82), except the Chopin first editions' group rows, whose ids come from the files (Q82's stop line)".
- **`docs/03` §3 step 2 (import [MT]).** Append: "A file the library does not have (the clone failed, or lacks it) is a placeholder on both flavours, `importHint` *`<file>` was not fetched: the MuseTrainer library is not on this build*, after the edition exclusion (which stays one), keeping the composition's tag and label; a library that is not there at all is every row a placeholder, not an empty fragment; the step's last line counts them, `N not fetched (placeheld)` (Q82)."
- **`docs/03` §3 step 3 (import [KERN]).** Append: "A file the clone does not have is a placeholder in the licence placeholder's shape (the table's level, tracks, concepts and `alternatives`; no licence claimed, *not read on this build*), `importHint` *`<path>` was not fetched: the kern clone is not on this build*, on both flavours; the table's `exclude` is read first; the last line counts them (Q82). The group rows (the Chopin first editions) are not covered: their ids come from a survey of the files, so a missing clone still drops them."
- **`docs/03` §3 step 9 (validate).** Entry 141's row, with its last clause ("the kern and MuseTrainer steps drop a missing file rather than placeholder it, so a missing clone still fails, on the cross-references") replaced by: "the kern and MuseTrainer steps' *was not fetched* placeholders are read the same way since Q82; and a sectioned fetch placeholder whose printed bars cannot be counted (no file, and no render report, as on a fresh runner) is warned, *named sections not checked on this build: <reason>*, not failed (Q82)".
- **`docs/08`, a new row after Q80's.**
  - Row name: **A clone that did not arrive is placeholders, not holes** (Q82, Q80's stop line).
  - What it covers:
    - `import_kern.build_entry` → `unfetched_placeholder` and `import_musetrainer.import_library`'s missing branch: the row with no file, the fetch reason in `importHint`, the licence or strict placeholder's shape, the same row on both flavours; the table's exclusion before the missing-file check;
    - both steps' `main()` with no clone folder;
    - the last line's `N not fetched (placeheld)`;
    - `validate.UNFETCHED_REASONS`' third pattern;
    - `validate.section_findings`: a sectioned fetch placeholder with no counted bars is warned.
  - What it guards against:
    - a GitHub failure at clone time failing CI and the Pages deploy on cross-references (21 unknown items and a `variantOf` for Joplin; 65 unknown items, 12 `variantOf`/`alternatives`, 8 section names, an excerpt parent and the merge step for MuseTrainer);
    - the named-sections check failing a placeholder a fresh runner cannot count;
    - an excluded row reappearing as a placeholder;
    - a licence placeholder read as a fetch.
  - Tests:
    - `tools/content/tests/test_import_kern.py`: `TestAFileTheCloneLacks` (6);
    - `test_import_musetrainer.py`: `TestAFileTheLibraryLacks` (7);
    - `test_validate_ladder.py`: `TestTheKernAndMuseTrainerStepsOwnPlaceholders` (4);
    - `test_validate_sections.py`: `TestAPlaceholderThisBuildCouldNotFetch` (5).
  - Status: done (Q82, 2026-09-29). The runner is unverified until a run with a failed clone is read. The Chopin first editions' group rows are not covered (the stop line).
- **`docs/08`, the file lines.**
  - `test_import_kern.py`: append "; since Q82 a file the clone lacks is a placeholder with the fetch reason, in the licence placeholder's shape, on both flavours, and no kern folder at all is every row a placeholder".
  - `test_import_musetrainer.py`: append "; since Q82 a file the library lacks, or no library at all, is a placeholder with the fetch reason on both flavours, an edition exclusion still an exclusion".
  - `test_validate_ladder.py` (Entry 141's line): append "; since Q82 the kern and MuseTrainer steps' *was not fetched* placeholders too, built by the steps themselves, and both steps' licence placeholders still a change".
  - `test_validate_sections.py`: append "; a sectioned placeholder this build could not fetch is warned, not failed, and a licence placeholder or an uncountable bundled file still fails (Q82)".
- **Backlog, row Q82,** status: "built (Q82, Entry 145): the kern and MuseTrainer steps placeholder a missing file with the fetch reason, and no clone folder at all is every row a placeholder; `UNFETCHED_REASONS` reads them; a sectioned fetch placeholder is warned by the sections check (a second `validate.py` change, ruled). Observed with the clones moved aside, both flavours: 23, 15 and 88 errors became validation OK. The Chopin first editions' group rows still drop (a new row). Verified when a runner's log with a failed clone is read."
- **Backlog, new rows** (area: content pipeline):
  1. The Chopin first editions' group rows cannot be placeheld, because their ids come from the files; a clone failure drops 117 rows and fails on 12 unknown items (Follow-up 1; P2).
  2. Q80's set-aside gives a row a file but not the `nc-personal-build` tag, so a kern NC row printed in the report would fail the tolerance (Follow-up 2; P3, latent).
  3. A placeholder's hint shows a learner a file name and a command line, on a deploy that could not clone (Follow-up 4; P2, with Q86).
  4. One set of words ("the clone is not on this build") for a clone that arrived without the file (Follow-up 5; P3).
