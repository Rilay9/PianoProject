### Entry 190 — E50c — a fresh mastery award counts only comparable days

**Base.** `36be5a50`, origin's head at dispatch, checked first (`git log -1`). The brief's premises cite `e71ef3ad`; no file under `app/` differs between the two (`git diff --stat e71ef3ad 36be5a50 -- app/` empty), so every cited line was read as it stands. A fast-path lane (`operating-procedure.md` §11): E50b's one required change, `docs/review/responses/65ae9d5f.md`. Nothing committed, staged or stashed; the orchestrator commits the named files.

**Product layer, first.** I opened no screen and heard nothing. The store's decision is read through `recordRun` over constructed rows in a fake IndexedDB, and the sheet's heading through the real Score screen with the store stubbed (`scoreSummaryTruth.test.ts`). Nothing here needs an ear: it is a state transition, not a musical judgement.

## Judgement

**The stop condition did not fire.** The stored session rows already hold every field the decision reads — `itemId`, `material`, `baseTempo`, `at`, `tempoMeasured`, `accuracy`, `tempoPct`, `rhythmOnly` — and they survive compaction and pruning (premise 13). `ProgressRow`, `db.ts` and every stored shape are untouched; no field was added.

**Technical verdict: the fresh mastery decision now matches what a learner's history supports**, for the discriminating case and both controls.

- **The discriminating case.** For a tempo-repaired item, one old day at 100 % of the defaulted 96 (the old file, `masterEligible: true`) plus one new day at the printed tempo leaves the row `passed`, where the committed code made it `mastered`; `masteredOn` keeps both dates. A legacy run with no material and no base, and a run of the repaired file that records no base, are refused the same way. On the day the repair lands, a comparable run below the master standard, or a rhythm-only run at the master numbers, does not make the old master run's day count.
- **Control: two comparable days still master.** Two days at the printed tempo give `mastered`. After a refused old day, the next comparable day gives `mastered`: the guard refuses, it never raises the bar past `MASTER_DAYS`.
- **Control: an item no repair touched is unchanged.** The three existing mastery cases (`recordTruth.test.ts` :63–87) pass as they stood, and so does an unrepaired item whose first master day was a defaulted-tempo run with no material. The guard returns `masteredOn.length` without reading anything for an id the loaded catalogue does not mark repaired (`material.tempoRepairedRow`).
- **History.** No date is rewritten or dropped. A row mastered before the repair stays mastered: the `row.status === 'mastered'` disjunct is untouched, and a mutant that re-judges it reddens a test.
- **The sheet.** *Mastery run N of 2* never counts past the row's status. Over the discriminating row (two dates, `passed`) it reads *Mastery run 1 of 2*, where the committed code printed *Mastery run 2 of 2*. *Mastered* and the ordinary *1 of 2* read as before.

**Without IndexedDB no session row is ever written** (`progressStore.ts` :309–318), and `rungRows()` returns none (:474–477). So a repaired item can never be freshly mastered in a browser with no IndexedDB: no earlier day is supported. That is refusal, consistent with the rule the reviewer named, and not a gap the fix leaves open. It is asserted (`recordTruth.test.ts`, the no-database case). An item no repair touched still masters there as before.

**What stays unverified.** No browser spec was run (the brief's layer 5, below). The whole unit suite's 78 failing files are all the absent content build, and they fail identically on the base source. The heading is exact only within a scope (the mechanism, below).

## The mechanism and the discriminating test

- **The cause.** `recordRun`'s fresh transition (`progressStore.ts` :242 at the base) counted every date in `masteredOn` toward `MASTER_DAYS` and never asked what supported it. `rungState.meetsStandard` already refuses an old file's tempo channel (`tempoNotComparable`); `recordRun` asked the old question. **Red line** on the base source (`red-base.txt`): `an old defaulted-tempo day made the second master day: expected 'mastered' to be 'passed'`. Seven of 66 tests in the two owned files are red on the base; all 66 are green after.
- **Which test told it from the alternative.** The alternative says the old run's `masterEligible: true` was itself wrong at write time. The same old run, recorded with the lineage not loaded, masters a row, and that row stays mastered after the lineage loads (`a row mastered before the repair is never demoted`). The old day was a legitimate judgement under its own day's rules. What changed is reading it now against the repaired standard. The fix acts only where that reading happens, the fresh threshold; mutant (h), which re-judges the stored status, reddens that test.
- **The fix.** `daysTowardMastery` (`progressStore.ts` :194), a module-private helper `recordRun` calls only while the row is not mastered.
  - Below `MASTER_DAYS` dates, or for an id no repair touched, it returns `masteredOn.length`.
  - Otherwise it counts the days in `masteredOn` that a run supports. Today counts if the in-flight run is master-eligible and `!tempoNotComparable(result)`. Any date counts if a stored run of the item on that calendar day is comparable and its own numbers meet the master terms (`meetsMasterTerms`, :215: `tempoMeasured`, `DEFAULT_MASTERY`'s 0.97 and 100, not `rhythmOnly`).
  - `material.tempoRepairedRow` (:138) is the one new export: whether the loaded catalogue marks the id repaired.
  - The heading (`ScoreScreen.ts` :3874) reads `Math.min(MASTER_DAYS - 1, masteredOn.length)`: a row the store left unmastered holds fewer than `MASTER_DAYS` counted days.
- **The heading's scope, exactly.**
  - For every item the guard does not apply to, the number is unchanged: an unmastered row there always held fewer than `MASTER_DAYS` dates.
  - For a repaired item at `MASTER_DAYS` 2, it equals the store's count whenever the in-flight run is itself comparable. That holds for a Score screen run of the eight under the current catalogue: its material is the row's current file, and its base is `written` wherever the model reads a first tempo. None of the seven parents is `tempoDefaulted` in `pdmx.json`, and the cut inherits its parent's tags (`excerpts.INHERITED_TAGS`).
  - Where an in-flight master-eligible run is itself refused and no earlier day stands, the heading would read 1 where the store counts none. At a `MASTER_DAYS` above 2 the number is an upper bound, not the count. Exact counting would need `recordRun` to hand the count back beside the row it stores. That is a return-contract change the brief did not name (question 2).

**The builder's-judgement choices, one line each.**

- **Reaching the earlier date:** `sessionsForItem(itemId, Number.POSITIVE_INFINITY)`. An earliest date can sit any number of runs back. A restored backup writes older runs under newer keys, so stopping early by date is unsafe. The read happens only while a repaired item's mastery is pending. Mutant (e), the default cap of five, reddens the reach case.
- **Today's run:** asked of the in-flight `result`, as the brief says. Stored rows are asked for every date in `masteredOn`, today's included (an earlier run today), under one rule.
- **Where the check lives:** a small module-private helper beside `recordRun`, plus `meetsMasterTerms`; `recordRun`'s line is the only call.
- **The tests:** in `recordTruth.test.ts`, which calls `recordRun`. The lineage is fed through `learnFormerIdentities` directly (the module says a test may), not through `repairedTempoLineage.test.ts`'s fetch-stubbed `loadThe`, which that file keeps. `repairedTempoLineage.test.ts` ran unchanged and green.
- **docs/05's sentence:** qualified in place (below).
- **docs/02's Part G bullet:** read and not revised. It says `master` counts the days *the master standard itself* was met. An old day at 100 % of 96 was not a day the repaired piece's master standard was met, so the bullet makes no overclaim.

## Done

1. **The guard** (the reviewer's required change): `progressStore.recordRun` via `daysTowardMastery` and `meetsMasterTerms`. `masteredOn` is kept as history. The historical disjunct is untouched. The decision is derived from the stored session rows and `tempoNotComparable`, and a legacy run with no material or no base is refused.
2. **The one new export:** `material.tempoRepairedRow` (premise 16). `tempoNotComparable` and `learnFormerIdentities` are unmoved.
3. **The heading** (premise 15): `ScoreScreen.ts` :3874 only, plus its comment.
4. **Red first:** every discriminating case was seen red on the base source (`red-base.txt`): six in `recordTruth.test.ts` and the heading case in `scoreSummaryTruth.test.ts`. The controls, the reach case and the calendar-day case are green on the base by design, and each is held by a mutant.
5. **Mutants:** the brief's (a), (b) and (c) were each seen reddening a test that the fixed tree passes, with (c) run in both of its readings. Seven more hold the rest of the change. 11 of 11 were killed (`mutants.txt`, `scripts-mutants.mjs`). The script restores each file from a copy, never from git, and the fixed tree passes after the restore.
6. **Verification:** the owned and adjacent files, the whole unit suite once, `npx tsc -b`, `npm run lint`, and `record_mirrors.py --check`; see below.
7. **Docs and map:** `docs/05-score-follow-engine.md` :997–1004; `docs/08-test-map.md` :21 and :583 (`

**Orchestrator's note at the landing (2026-09-30).** E50c's worktree committed by name (4a83af56) and merged (6e2f7c5d). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/E50c/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 1; e2e-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner — the targeted specs' failures passed alone (`e2e-rerun`); the note names them; `runs/E50c/orchestrator-exit.txt`). The reviewer's required change on E50b (`responses/65ae9d5f.md`: APPROVE WITH ONE REQUIRED CHANGE — a fresh mastery award cannot count an incomparable old day; keep `masteredOn` itself as history, do not rewrite or delete old dates; for a repaired-tempo item the fresh mastery transition must count only days supported by runs whose tempo channel is comparable under the E50b rule, preferably derived from the stored session rows and `tempoNotComparable`, a legacy run with no material/base proof refused; do not add a new per-day base field to `ProgressRow` merely to solve this if the session record already supplies the needed truth; if the existing session history cannot support the decision without a stored-shape change, stop and bring that schema choice back rather than manufacturing provenance for old dates; a required-change fast path — same invariant, no new product choice), taken under the fast path (`operating-procedure.md` §11: a required change returns to a builder without a second brief review, the verdict the pre-reviewed brief by construction).. Landed: a fresh mastery award counts only the masteredOn days a stored comparable run supports whose own numbers meet the master standard (`daysTowardMastery`, `meetsMasterTerms`), history untouched, a row already mastered never demoted, the sheet's *Mastery run N of 2* never counting past the row's status; the chain's unit reds are the known CRLF pair, and its one browser red, `tour-practice-modes.spec.ts`'s piece-opened-outside-the-tour case (`#score-title` not found), passed alone (`e2e-rerun`).

## Doc rows`).

## Tests

| Test (`recordTruth.test.ts` unless named) | Base | After | Mutants that redden it |
| --- | --- | --- | --- |
| an old day at 100 % of the defaulted 96 and one new day at the printed tempo is not mastery | red | green | a |
| two days at the printed tempo still are (control) | green | green | b, c-i |
| an old day does not count, and a second new day then makes mastery | green | green | b, c-i |
| a legacy run with no material and no base proves nothing | red | green | a, c-ii |
| a run naming the repaired file but recording no base proves nothing either | red | green | a, c-ii |
| a comparable run that met no master standard does not carry an old master run's day | red | green | a, d |
| nor does a rhythm-only run at the master numbers | red | green | a, d, j |
| an earlier comparable day is reached however many runs came after it | green | green | b, c-i, e |
| a stored run's day is the learner's calendar day, not its UTC date (New York, 20:30) | green | green | b, c-i, g |
| a row mastered before the repair is never demoted | green | green | h |
| an item no repair touched, a defaulted-tempo run with no material included (control) | green | green | none (a control) |
| without a database: an unrepaired item masters as before; a repaired one never freshly does | red | green | a, f |
| the three existing mastery cases (:63–87) | green | green | none (controls) |
| `scoreSummaryTruth.test.ts`: a row kept *passed* over two dates heads *Mastery run 1 of 2*, never *2 of 2* | red | green | i |
| `scoreSummaryTruth.test.ts`: *Mastery run 1 of 2* (one date) and *Mastered* (existing) | green | green | none (controls) |

The mutants: (a) guard removed; (b) every day of a repaired item refused; (c-i) keyed on the id alone; (c-ii) the repaired-file material alone, with the per-run id clause never asked; (d) master terms dropped; (e) default cap; (f) repaired-row gate removed; (g) UTC date; (h) historical disjunct re-judged; (i) heading counts dates; (j) `rhythmOnly` not read.

## Counts and exit codes

- `npm ci` (in `app/`): exit 0.
- Base source, the two owned files (`red-base.txt`): 7 failed, 59 passed (66); exit 1.
- Fixed tree, `recordTruth`, `scoreSummaryTruth` and `repairedTempoLineage` (`green-after.txt`): 3 files, 82 passed; exit 0.
- Mutants (`mutants.txt`): 11 run, 11 killed. After restore, the two owned files: 66 passed, exit 0. Script exit 0.
- **Whole unit suite, once, on the final tree** (`unit-all.txt`): Test Files 78 failed, 244 passed (322); Tests 34 failed, 3688 passed, 1 skipped (3723); exit 1.
  - Every failure is the absent content build: `app/public/content` not found (78 file-level), the test's own *run the content build first* (15), `curriculum.json: 404` (4), no MIDI-parity reference under `build/` (1), and one timeout in a file that reads `public/content` through a fetch stub (1).
  - The same 78 files run on the base source (`scripts-base-compare.mjs`, `failing-base-vs-fixed.txt`) give the same 99 FAIL lines, identical.
  - None of the 78 records a master-eligible run of any of the eight repaired ids. That was searched in those files; they could not exercise one without the content anyway.
- `npx tsc -b`: exit 0. `npm run lint`: exit 0 (`tsc-lint.txt`).
- `python tools/docs/record_mirrors.py --check`: exit 0, *fresh*. No `## Record` block was touched.

## Not done

- **No browser spec** was run, per the brief's layer 5. For every item the guard does not apply to, the heading's number is provably unchanged (above), and no other screen sentence moved. The map's minimum for these paths also lists `build-app`, the e2e specs and `states` (`checks_for_paths.py`); those were left to CI, as the brief directs.
- **No screen opened and nothing heard.** The Library badge and the other status readers were not looked at. What they show for a repaired item follows from the row's status, which is asserted.
- **No content build and no Python content tests.** Nothing under `content/` or `tools/content/` changed.

## Deviations, with reasons

- **The master terms read from a stored run add `rhythmOnly !== true`** to the three the brief decided (`tempoMeasured`, 0.97, 100). The Score screen never lets a rhythm-only run master (`ScoreScreen.ts` :3689), and the row stores that fact (`sessionRowFor` keeps `rhythmOnly`), so reading it reads the run's own record. Premise 14 names the two refusals the row does not store; this is the third refusal at the same lines, and the row does store it. It has its own test and mutant (j). An earlier draft also required `mode === 'tempo'`. It was dropped: stored `tempoMeasured: true` already says the mode was Keep tempo, and no test could tell the two apart.
- **Premise 3 holds before the fix and not after.** A refused row keeps its dates while staying `passed`, so a later day can meet two or more earlier dates. The helper counts every date, at no extra cost.
- **One sentence outside `recordRun` in `progressStore.ts` was corrected:** `RunResult`'s note said the store acts on none of the header's facts. It now names the one question it reads `material` and `baseTempo` for. No behaviour moves.
- **Kept scripts and logs** are in this folder. The raw outputs under `build/e50c/` were deleted at the end.

## Questions for the reviewer

1. **The stored master terms.** Keep `rhythmOnly !== true` beside `tempoMeasured`, 0.97 and 100, or hold to the three the brief named? Either way the old-day case stays refused.
2. **The heading's number.** At `MASTER_DAYS` 2 the status bound equals the store's count wherever the in-flight run is itself comparable, which is every Score screen run of the eight under the current catalogue. Is that enough, or should `recordRun` hand back the count it decided beside the row, so the sheet reads it exactly at any `MASTER_DAYS`? That is a return-contract change, and every caller and the 17 test files that mock `progressStore` would need reading.

## Follow-ups (recorded, not built; observations for the next checkpoint)

- **A run under an id no repair touched that names a repaired-from file** is not consulted for that id's fresh mastery. The gate is the row id, as the brief decided: "a no-op for an item the loaded catalogue never marks repaired". Whether any current id was ever served one of the eight old files was not examined against a built catalogue; this worktree has none. It is an implementation edge.
- **A comparable supporting run removed by the last-resort cap** would stop supporting its day. The cap removes a run only when the store is past `MAX_SESSIONS` plus slack, the run is outside the 90-day window, and it holds no evidence and no rung. That is refusal, consistent with the rule, and not reachable short of that cap.
- **The unstored refusals** (premise 14, as the brief asked, stated not closed): a technique-bound run the Score screen refused, if its numbers meet the terms, reads as support. First-reading refusals are a phrase's, and a repaired item is a piece.
- **`docs/02-curriculum.md` :1146** cites only `rungState.meetsStandard` for "no tempo-dependent standard reads it". A proposed row is below.

## Doc rows

- **Applied (owned):**
  - `docs/05-score-follow-engine.md` :997–1004: the progress row's derivations stay history, and one decision is taken now. A fresh *mastered* of a repaired item counts only the `masteredOn` days that a stored comparable, master-standard run supports; the dates stay, a mastered row stays mastered, and the sheet never counts past the status.
  - `docs/08-test-map.md` :21 (the adversary cases, the tests and the status: unit only, since no browser spec reaches a repaired item's mastery) and :583 (`recordTruth.test.ts`'s row).
- **Read, not revised:** `docs/02-curriculum.md` Part G (:1348–1356). No overclaim (above).
- **Proposed, not applied:**
  - `docs/02-curriculum.md` :1146: "(`rungState.meetsStandard`, below)" → "(`rungState.meetsStandard`, below; since E50c also a fresh *mastered*, `progressStore.recordRun`, Part G)".
  - `docs/08-test-map.md` :615 (`scoreSummaryTruth.test.ts`'s row): after "*Mastery run 1 of 2*", add "(since E50c also over a row the store kept *passed* with two dates, never *2 of 2*)".

## Content

No file under `content/` or `scores/` changes, so there is no itemisation list. **One learner-facing reading changes**, named for the orchestrator's judgement. For the eight tempo-repaired rows, take a learner whose history holds a pre-repair master-standard day and who gains one post-repair master-standard day. The Score screen's sheet now reads *Mastery run 1 of 2* where it read *Mastered*. Every reader of the row's status reads *passed* where it read *mastered*: the Library badge and filter, the lesson option badges, and Progress's counts and lists, among E50b's list of readers. The history line's stored percentages, the dates, contact and familiarity read as before.

## Files

- **Code:** `app/src/data/progressStore.ts` (`daysTowardMastery`, `meetsMasterTerms`, `recordRun`'s transition line, `RunResult`'s note), `app/src/curriculum/material.ts` (`tempoRepairedRow`), `app/src/ui/screens/ScoreScreen.ts` (the mastery heading).
- **Tests:** `app/tests/unit/recordTruth.test.ts` (the E50c describe, 12 cases), `app/tests/unit/scoreSummaryTruth.test.ts` (one case in describe 2).
- **Docs:** `docs/05-score-follow-engine.md`, `docs/08-test-map.md`.
- **Run folder:** `docs/prompts/runs/E50c/`: this entry; `scripts-mutants.mjs`, `scripts-base-compare.mjs`, `scripts-collect-logs.py`; `mutants.txt`, `red-base.txt`, `green-after.txt`, `unit-all.txt`, `failing-base-vs-fixed.txt`, `tsc-lint.txt`. Each is under 300 KB, with machine paths replaced.
- **Not touched:** `app/src/data/db.ts`, `app/src/evidence/rungState.ts`, `tempoNotComparable`, `learnFormerIdentities`, every residue reader E50b listed, `content/`, `tools/content/`, `docs/02-curriculum.md`.
