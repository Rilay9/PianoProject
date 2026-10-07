### Entry 191 — CL23 — store and schema: a performance found however far back it is, and a run's per-demand evidence folded to counts once no reader can reach its positions

Base: origin's head **fadafbfa** (`git log -1 --format=%h` in the worktree, before anything else; the dispatch named the same sha). Worktree only; nothing committed, pushed, stashed, reset or checked out; nothing written in the main checkout, whose built content (`app/public/content`) was copied read-only for the unit suite and the browser specs — `content/` and `tools/content/` do not differ between fadafbfa and the main checkout's head (`git diff --stat`, empty). Brief `tasks/CL23-store-and-schema-performance-reach-and-evidence-fold.md` (Entry 191), approved with one required change by `responses/questions-122a5224.md` §CL23 and amended to it.

## Judgement

**The stop condition did not fire.** The protected set was identified at the data/compaction boundary with no change to `app/src/evidence/demandReadings.ts` and no new evidence rule: per item, per skill, per evidence stamp, the newest `PROTECTED_READS` (5) measured records — the brief's safe superset (premise 21) of the readings' pooled window — with the readings' own filters copied (measured records only, counted by record; the same stamp; strictly later by the readings' own `localeCompare`, so a tie with the fifth stays protected; nothing dated after the compaction's day; and the 500-row key-order read handled as *only records under higher keys count*). The window's size is copied, not imported (the store keeps the evidence modules out, `holdsEvidence`), and a test holds `PROTECTED_READS` equal to `DEMAND_WINDOW_READS`. The superset protects more than the readings reach, never less; nothing in it is an age.

**Technical verdict.** L53 is built: `DB_VERSION` 10, an index `byPerformance` on `['performanceMark', 'at']` (a marker `1` derived from the boolean, never the boolean as a key), the upgrade marking every stored performance, `recordRun` and `importAll` marking theirs through one helper, and `recentPerformances` walking the performances alone with no scan limit. L69's fold is built: `compactObservation` folds a measured record proven outside the reach — each `byDemand` entry to its demand, `n` and `right`, each `otherDemands` entry to its demand, the step-index arrays emptied — and a run with a measured record walks its own item afterwards for the read it pushed out of the five (the brief's premise 24), with a row still holding positions counted as not compact there. Every case the brief names was red on the committed code and is green; seventeen mutants, all killed by the case expected. E50c's `daysTowardMastery` and `meetsMasterTerms` are untouched (no diff hunk in their lines) and read no field this lane changes.

**One clause of L69 is not done, because the measurement refutes it.** The budget case now carries an evidence-bearing fixture — a real sight-read, the largest evidence of the catalogue's nine reading rows — and what it shows is that the store at the cap under `SESSIONS_BUDGET_BYTES` does **not** hold for such rows: measured where this lane was built, a store in which about one run in five or more is that sight-read is at or over the budget even with the fold, and under it at one in ten (`budget-relations.txt`). The fold removes a minority of a compacted sight-read (folded / kept between 0.70 and 0.99 across the nine rows, measured here); the evidence's demand ids, contexts and refusals are the bulk, and a folded compacted sight-read is still between about two and five times a compacted row without evidence. So the budget assertion is not extended to evidence (no share of runs was chosen to make it pass); the test holds what L69 changes — positions gone, counts kept, smaller than kept — and the at-cap finding belongs to L51's byte bound (a DECISION row of CL23's own cluster), attached there, not a new row.

**No pedagogical verdict:** nothing here needs an ear, and none was asked. What a learner meets: Progress's *Performances* lists a performance played any number of runs ago (unit layer: behind 2,300 later runs, after a version 9 upgrade, after an old backup's restore; the map's browser specs pass on the change, none of them built for this case); what the reader decides from a learner's reads is unchanged by compaction (unit layer: `demandReadings` identical before and after on the six-read, two-item and stale-stamp learners). Not looked at on a screen.

**Counts.** Tests added 18 (4 in the new `performanceReach.test.ts`, 2 in `backup.test.ts`, 12 in `sessionRetention.test.ts`), of which 14 red on the committed code and 4 guards green on it by design (the copied filters, each with its own mutant); revised 1 (`projectLifecycle.test.ts`'s version assertion) and 2 fixtures (`progressRanking.test.ts`, `progressHistoryLines.test.ts`: a performance written without the marker); preserved: every other case in the touched files, `sessionRetention.test.ts`'s nine among them, now under jsdom. Exit codes (table under *Exit codes*): `tsc -b` 0, lint 0, `build:app` 0, the map's twelve browser specs 0 (155 passed, port 5183), the mutant script 0 (17 of 17); the whole unit suite 1 on this machine — four failures that fail identically on the committed source (two LF-against-CRLF source checks, two absent build reports) and, in the final run, timeouts under load in twelve files that all pass rerun at two workers; `record_mirrors.py --check` 2 on its one finding, that the brief's record still ends at `approved` beside this entry, which the landing's record step clears.

**Deviations** (under *Deviations*): (1) a folded entry keeps empty arrays rather than none; (2) the 500-row cap as key order; (3) the not-compact rule in the item's pass, not in the date walk; (4) the budget assertion not extended (the not-done above); (5) three test files outside the owned list; (6) `sessionRetention.test.ts` under jsdom; (7) `PERFORMANCE_REACH` retired; (8) the map's browser specs run, though the brief adds none (the dispatch's rule); (9) cases and mutants beyond the brief's list.

**Question:** one, deviation 1 (*Questions*).

## The migration and backup compatibility, itemised

1. **What changes on disk.** Built as decided. `sessions` gains one index, `byPerformance`, keyPath `['performanceMark', 'at']` (`db.ts`:1276–1295); a row with `performance: true` gains `performanceMark: 1` (`db.ts`:455–461, `withPerformanceMark` :494). The upgrade walks every stored session once inside the version-change transaction (version 4's pattern) and writes only a performance; no store is created, no field removed or renamed, no key changed. A fresh database creates the index and has nothing to mark (the version 10 block is keyed on the old version, as every block is). Test: `performanceReach.test.ts` › *a version-9 database opens at version 10…* — a version 9 schema built as `db.ts` made it, a performance and 2,300 later runs; after the upgrade every key and every row is `toEqual` the version 9 rows but for the one marker, and `recentPerformances` lists the performance; › *a fresh database has the index and nothing to backfill*.
2. **What a backup carries.** `BACKUP_VERSION` stays 1; the file's shape is unchanged; a session row serialises as it is stored, a performance with its marker. No test needed beyond the existing round trips (`backup.test.ts` › *round-trips every store…*, green).
3. **The gap the migration opens.** `importAll` writes rows with a plain `put` and never runs `upgrade()`, so a pre-version-10 performance restored onto a version 10 store would have been invisible to the index. Closed (item 4).
4. **The restored row satisfies the same invariant.** `importAll`'s `sessions` branch marks the row through the same helper before the `put` (`backup.ts`:309–316); a merge still drops the id first. Test: `backup.test.ts` › *a performance in a backup written before version 10* › *is listed after a replace restore…* and *…after a merge restore…* — the file carries the boolean alone and 2,300 later runs (asserted: no row in it has the marker), restored onto a version 10 store with a run of its own; `recentPerformances` lists it, and only it carries the marker.
5. **A backup written after this lane, restored onto an older build.** Not this lane's to build, as decided: the format version does not move, and an older build carries `performanceMark` as a field it does not read. Not tested (nothing to build); an older build cannot open a version 10 database at all (IndexedDB refuses a lower version), so it cannot write an unmarked performance beside marked ones.
6. **Proof on both paths.** The upgrade path (item 1's test) and the restore path (item 4's tests) are separate cases; the mutants separate them too: M1b (the upgrade's backfill dropped) fails only the upgrade case, M3 (the restore not marked) only the two restore cases.

## The mechanism and the discriminating test, per row

**L53 — a performance past the old reach.** *Hypothesis:* the scan's stop at 2,200 rows is the whole fault, and an index needs a key IndexedDB accepts, which a boolean is not; refuted if any path already reached further, or if an index on the boolean held rows. *Mechanism:* `recentPerformances` (`progressStore.ts`:588) walks `byPerformance` newest first and stops at `limit`; the `catch` fallback (a full read filtered) is as it was — it also covers a store without the index. *Discriminating tests:* `performanceReach.test.ts` › *finds a performance with more runs after it than the old walk looked at…*. *Red on the committed code:* `AssertionError: the performance behind the old reach was not listed: expected [ 'song.finale', 'song.encore' ] to …` (the third, `song.recital`, behind 2,300 runs, missing). The boolean sub-hypothesis, tested rather than cited: mutant M16 keys the index on `['performance', 'at']` and the performances vanish — the upgrade case and the reach case fail. Not refuted.

**L69 — the fold.** *Hypothesis:* `compactObservation` folded `steps` and forgot the evidence's arrays of the same lifecycle; refuted if a compacted measured record already lost them. *Mechanism:* `foldRecord`/`foldEvidence` (`progressStore.ts`:948–967) and `compactObservation(row, outside)` (:980), whose `outside` defaults to nothing, so a caller that does not prove the reach keeps every position. *Discriminating tests:* `sessionRetention.test.ts` › *the fold itself* › *folds a measured record proven outside to its counts…* (a refusal and a self-assessed record kept whole, a row with no evidence compacted as before), › *leaves what heldBack and playedDemands read bit for bit as it was*, and › *the budget, with a run that carried evidence (L69)* › *folds a compacted sight-read's positions away, keeps its counts, and is smaller for it*. *Red:* `AssertionError: a step index survived the fold: expected true to be false` (the fold case and the budget case), `AssertionError: expected true to be false` (the regression case's first assertion). The regression case is a stand-in, said as one: `heldBack` (`session.ts`:2395–2405) and `playedDemands` (`transfer.ts`:161–166) are module-private, so it asserts the fields they read — each `byDemand` entry's demand, `n`, `right`; every `byDemand` and `otherDemands` demand — and calls `attemptDemands`, the exported projection `playedDemands` repeats; mutant M5 (the fold takes `n` and `right`) reddens it. Not refuted.

**L69 — the protected set, against `demandReadings`' window.** *Mechanism:* `outsideReach` (`progressStore.ts`:1035) counts, for each measured record of a row, the records of later rows of its item that are of its skill, under its stamp, strictly later, and dated no later than the compaction's day (`newerOf`, :1003); five or more and the record is outside. `compactSessions` (:1064) holds each row crossing the window's edge against its item's rows under higher keys, read down the item's index from the newest key and stopped as soon as every measured record is proven outside or its own key is reached. `foldEvidenceOfItem` (:1123), run in the tidy of a run with a measured record (:320, :1170), walks that item the same way and folds what an old, compacted row now has five later records against; there a row past the edge that still holds positions resets the stop's count, so fifty compact rows are needed in a row before the walk ends. *Which rows the guard kept, and why:*

- **The six-read case** (reads at 200, 150, 120, 100, 50 and 5 days, the window 90): `demandReadings`' window for each of the three skills is the newest five (asserted: the observations are exactly those five keys), three of them past the edge. After `compactSessions`, the reads at 150, 120 and 100 days are compacted to bars and **keep** their positions, the read at 200 days is folded (counts equal to before), the two inside the window keep their steps, and `demandReadings` is `toEqual` before and after. *Red:* `AssertionError: the sixth read is outside the reader's five and kept its positions: expected true to be false`. Mutant M6 (fold by age) reddens it, and every other protected-set case.
- **The two-item case:** item A read at 200, 40, 30, 20, 10, 5 days, item B once at 120. B is outside the pooled five (asserted) and inside its own item's five: **kept**; A's read at 200 days folded; the readings identical. *Red:* `AssertionError: A's sixth read kept its positions: expected true to be false`. Mutant M7 (the newer records counted across items) folds B.
- **The stale-stamp case:** reads at 300, 200, 40, 30, 20 (stamped `EVIDENCE_DEFINITIONS − 1`), 10, 5. The readings read the read at 200 days (asserted: the stale read leaves it in the newest five): **kept**, four same-stamp reads after it; the read at 300 days folded, five same-stamp reads after it. *Red:* `AssertionError: the read with five same-stamp reads after it kept its positions: expected true to be false`. Mutant M8 (stamp not matched) folds the read at 200 days.
- **The copied filters** (four guards, green on the committed code by design, since nothing folded there): a later read tied with the candidate, a read dated after the compaction's day, the newest read under a lower key, a later run whose records are a refusal and a self-assessment — in each the candidate has four counted reads after it and is **kept**. Mutants M11–M14, one per filter, each fold it.
- **The deferred fold:** a read compacted with its positions kept (four reads after it), sixty rows above it each the only record of its skill (protected for good), four recent reads; a new measured run of the item is recorded, its tidy folds the old read, and the sixty stay protected. *Red:* `AssertionError: the read the new run pushed out of the five kept its positions: expected true to be false`. Mutant M9 (no item pass) and M10 (a row holding positions counted as compact in that pass, so the walk stops on the sixty) each leave it kept.

*Monotone, and its two exceptions:* a measured row is never deleted and the counts only grow as runs are added, so a folded record stays outside; a device clock set back, and a restore whose rows change places by key (a merge, on an item with more than the Today read's 500 rows), are the ways a folded record can come back into a reader's window. There an emptied array reads as no step (deviation 1). Not tested beyond the arithmetic: no case sets a clock back.

## Done

- `DB_VERSION` 9 → 10 with `byPerformance` over the derived marker, the guarded upgrade block and its backfill (`db.ts`); the comment narrating the versions extended with 10.
- `withPerformanceMark`, the one definition, used by the upgrade, `recordRun` (`sessionRowFor`) and `importAll`.
- `recentPerformances` on the index, no scan limit; `PERFORMANCE_REACH` retired with its reasoning moved into the reader's comment.
- The fold (`foldRecord`, `foldEvidence`, `compactObservation(row, outside)`), the protected set (`PROTECTED_READS`, `newerOf`, `outsideReach`), `compactSessions` holding each crossing row against its item, `foldEvidenceOfItem` and the tidy that runs it after a run with a measured record.
- `db.ts`'s `RunObservation.evidence` comment corrected in the change (it said *compaction keeps it*); `compactObservation`'s, `compactSessions`', `recentPerformances`' and `pruneSessions`' comments say what compaction now does to evidence (the last said *their evidence never folded*).
- Every brief-named case red then green; seventeen mutants killed.
- `sessionRetention.test.ts`'s budget case given an evidence-bearing fixture (the real largest sight-read).

## Not done

- **The budget assertion proven against an evidence-bearing compacted row** (the brief's L69 clause, premise 17's gap): refuted by measurement, not built — see the judgement; the relations are in `budget-relations.txt`, the finding attached to L51. No one in this lane may choose the budget, the cap or a share of runs; that is L51's decision.
- **The deferred fold for a row the item's pass cannot reach** (more than fifty compact rows of the item between it and the last row still holding positions): left protected, redundantly — safe for the readings, a saving not taken. Not tested at that depth.

## Deviations

1. **A folded entry keeps empty arrays.** The brief decided `{ demand, n, right }`, dropping `steps`, `wrong`, `unattributed` and `otherDemands[].steps`. Built as `{ demand, n, right, steps: [], wrong: [] }` and `{ demand, steps: [] }` (`unattributed` dropped, being optional). Reason: `evidence.ts` declares `DemandCount.steps`, `wrong` and `DemandOverlap.steps` required, and `stepsOf` (`demandReadings.ts`:129–139) and `overlapOf` (`evidence.ts`:551–556) iterate them unguarded, so a missing array throws where an empty one reads as no step; a folded record reaches a reader only in the exceptions above, and there a throw in the session builder would stop Today drawing. Cost, measured here: with the arrays dropped instead, the largest compacted sight-read is about a sixth smaller (dropped / emptied = 0.83, `budget-relations.txt`). One line in `foldRecord` and two assertions if the reviewer prefers dropping (*Questions*).
2. **The 500-row cap as key order.** Premise 22 offered moving `READING_HISTORY` (touching `TodayScreen.ts`) or folding nothing for an item whose key and date orders disagree above the candidate. Built instead: a later record counts only from a row under a higher key. If the candidate is inside an item's newest N rows by key, so is every row above it, whatever N is; if it is outside, no reader reads it. Exact at any cap, no other file, and it folds where the brief's second option would have folded nothing.
3. **The not-compact rule lives in the item's pass.** Premise 24 says the settled check must treat a row with kept arrays as not compact. In `foldEvidenceOfItem` it does (M10). `compactSessions`' date walk keeps its check as it was (a row without steps is settled): there the rule would make every protected row restart the fifty on every tidy and walk the store's history behind them, and the date walk folds no row already compacted — a row protected when it crossed becomes foldable only on a later run of its item, whose pass handles it.
4. **The budget assertion not extended** (Not done).
5. **Three test files outside the owned list.** `projectLifecycle.test.ts` asserted `DB_VERSION` and the opened version `toBe(9)`; now `toBeGreaterThanOrEqual(9)` and `toBe(DB_VERSION)`, as `encounterModel.test.ts` reads version 8's (class: an assertion on the old version number). `progressRanking.test.ts` and `progressHistoryLines.test.ts` wrote a performance straight into the store without the marker, which no writer of the store does since version 10 (class: a fixture in the old row shape); both now write through `withPerformanceMark`. Each failed in the first whole-suite run on the change, for that reason only.
6. **`sessionRetention.test.ts` under jsdom:** its budget fixture is generated, rendered into the engine's model through OSMD and played (`helpers/reader`), as the reader tests do; its nine earlier cases pass unchanged there.
7. **`PERFORMANCE_REACH` retired**, the builder's call: nothing read it once the scan was gone; the tests name the old reach as a local constant with its arithmetic.
8. **The map's browser specs run** although the brief adds none: the dispatch's rule (the map's minimum names twelve specs for `db.ts`), on port 5183 from a config copy under `app/build/cl23/`.
9. **Beyond the brief's list:** the four filter guards, the deferred-fold case, the window-copy test, and mutants M9–M16 (the brief named eight; M1 is split into M1a and M1b).

## Follow-ups (classified; none fixed here)

- **L51 (attach, existing DECISION row):** the byte budget does not hold for a store whose runs are sight-reads with their evidence, before or after the fold (`budget-relations.txt`); the evidence's non-positional content is the bulk. Observation for L51's owner, with the relation measured; not a new row.
- **Observation:** the version 10 upgrade reads every stored session once inside the version-change transaction, the shape version 6's comment warns about for writes; here only performances are written, and it is one more whole-store read of the kind `rungRows` makes at every session's start. Not measured on a phone.
- **Observation:** `rungRows`' in-memory copy keeps the arrays the store has folded until it is read again; its readers take counts and demand ids only.

## Questions

1. (For the reviewer.) A folded `byDemand` entry is stored as `{ demand, n, right, steps: [], wrong: [] }` and a folded `otherDemands` entry as `{ demand, steps: [] }`, keeping `evidence.ts`'s declared shape so that `stepsOf`/`overlapOf` read no step rather than throw if a folded record ever reaches them (a device clock set back); dropping the arrays, as the brief wrote, makes the largest compacted sight-read about a sixth smaller. Keep the empty arrays, or drop them?

## Files

Changed: `app/src/data/db.ts`, `app/src/data/progressStore.ts`, `app/src/data/backup.ts`, `app/tests/unit/backup.test.ts`, `app/tests/unit/sessionRetention.test.ts`, `app/tests/unit/projectLifecycle.test.ts`, `app/tests/unit/progressRanking.test.ts`, `app/tests/unit/progressHistoryLines.test.ts`. Added: `app/tests/unit/performanceReach.test.ts`; `docs/prompts/runs/CL23/`: this entry; the scripts (`scripts-mutants.py`, `scripts-budget-relations.test.ts`, `scripts-playwright.cl23-5183.config.ts`); the kept logs (`budget-relations.txt`, `red-unit-committed.txt`, `red-retention-committed.txt`, `green-unit-targeted-1.txt`, `green-unit-targeted-2.txt`, `mutants.txt`, `tsc.txt`, `lint.txt`, `vitest-all-1-summary.txt`, `vitest-all-2-summary.txt`, `vitest-rerun-suite-only.txt`, `env-failures-committed.txt`, `build-app.txt`, `e2e-map-minimum.txt`, `checks-for-paths.txt`), each under 300 KB, machine paths replaced.

## Tests table

| Test | Class | Old assumption | Red on fadafbfa |
| --- | --- | --- | --- |
| `performanceReach` › a version-9 database opens at version 10… | added (migration) | — | yes: `expected 9 to be greater than or equal to 10` |
| `performanceReach` › a fresh database has the index… | added (schema) | — | yes: `expected [ 'byDate', 'byItem' ] to deeply equal [ 'byDate', 'byItem', 'byPerformance' ]` |
| `performanceReach` › finds a performance with more runs after it… | added (reach) | — | yes: `the performance behind the old reach was not listed` |
| `performanceReach` › marks a performance when it is recorded… | added (writer) | — | yes: `expected { itemId: 'song.recital', …(10) } to match object { performance: true, …(1) }` |
| `backup` › …is listed after a replace restore… | added (restore) | — | yes: `the restored performance was not listed: expected [] to deeply equal [ 'song.recital' ]` |
| `backup` › …is listed after a merge restore… | added (restore) | — | yes: the same line |
| `sessionRetention` › copies the reader's window… | added (copy guard) | — | yes: `expected undefined to be 5` |
| `sessionRetention` › folds a measured record proven outside… | added (fold) | — | yes: `a step index survived the fold` |
| `sessionRetention` › leaves what heldBack and playedDemands read… | added (regression, stand-in) | — | yes: `expected true to be false` |
| `sessionRetention` › folds a compacted sight-read's positions away… | added (budget fixture) | — | yes: `a step index survived the fold` |
| `sessionRetention` › six reads… | added (protected set) | — | yes: `the sixth read is outside the reader's five and kept its positions` |
| `sessionRetention` › two items… | added (protected set) | — | yes: `A's sixth read kept its positions` |
| `sessionRetention` › a newer read under another evidence stamp… | added (protected set) | — | yes: `the read with five same-stamp reads after it kept its positions` |
| `sessionRetention` › does not count a newer read tied with the candidate… | added (filter guard) | — | no, by design (M11) |
| `sessionRetention` › does not count a read dated after the compaction's day… | added (filter guard) | — | no, by design (M12) |
| `sessionRetention` › does not count the newest read under a lower key… | added (filter guard) | — | no, by design (M13) |
| `sessionRetention` › does not count a newer run whose records are not measured… | added (filter guard) | — | no, by design (M14) |
| `sessionRetention` › a new run of the item folds the read it pushed out… | added (trigger) | — | yes: `the read the new run pushed out of the five kept its positions` |
| `projectLifecycle` › a version-8 database … opens at version 9… | revised | the newest version is 9 | — |
| `progressRanking` (fixture `session`) | revised fixture | a stored performance is the boolean alone | — |
| `progressHistoryLines` (fixture `seed`) | revised fixture | the same | — |

## Mutants

`scripts-mutants.py` (each applies one edit, runs the targeted file, restores the bytes and checks the restore; the worktree's diff stat was identical before and after the run). Log: `mutants.txt`.

| Mutant | Killed by |
| --- | --- |
| M1a `DB_VERSION` back to 9 | the version 9 upgrade case |
| M1b the upgrade's backfill dropped | the version 9 upgrade case |
| M16 the index keyed on the boolean | the upgrade case, the reach case |
| M2 `recentPerformances` back to scan-and-stop at 2,200 | the reach case, the upgrade case, both restore cases |
| M3 `importAll` not marking | both restore cases |
| M4 the evidence fold reverted | the budget case, the fold case, the regression case, every protected-set and trigger case |
| M5 the fold takes `n` and `right` | the regression case (and the fold, budget and six-read cases) |
| M6 the reach guarded by age | the six-read case (and the two-item, stale-stamp and four filter cases) |
| M7 the newer records counted across items | the two-item case |
| M8 the stamp not matched | the stale-stamp case |
| M9 no item pass after a run | the deferred-fold case |
| M10 a row holding positions counted as compact in that pass | the deferred-fold case |
| M11 a tie counted as later | the tie guard |
| M12 a read after the day counted | the after-the-day guard |
| M13 a later read under a lower key counted | the key-order guard |
| M14 a record that is not measured counted | the not-measured guard |
| M15 the copied window drifts to 4 | the window-copy test (and every protected-set case) |

## Exit codes

All from `app/` unless said; logs beside this entry, machine paths replaced.

| Step | Exit | Result | Log |
| --- | --- | --- | --- |
| Red: the four touched files on the committed source (`performanceReach`, `backup`, `sessionRetention`, `projectLifecycle`) | 1 | 14 failed, 65 passed (79) | `red-unit-committed.txt` |
| Red: `sessionRetention` again, its fixture changed to a phrase whose records carry `otherDemands` (the first fixture had none, so the fold case failed on the fixture's own assertion) | 1 | 8 failed, 13 passed (21), each on the line quoted above | `red-retention-committed.txt` |
| Green: the same four files | 0 | 79 passed | `green-unit-targeted-1.txt` |
| Mutants (`scripts-mutants.py`, from the worktree root) | 0 | 17 of 17 killed by the case expected; restores checked | `mutants.txt` |
| `npx tsc -b` | 0 | — | `tsc.txt` |
| `npm run lint` | 0 | — | `lint.txt` |
| `npx vitest run`, first, before the two fixtures were revised | 1 | 7 failed, 7538 passed, 1 skipped, 1 todo (7547): the two fixtures (deviation 5), four of this machine's (below), `tempoSoundAgainstMark` timed out (passes alone, 6 of 6) | `vitest-all-1-summary.txt` |
| The four of this machine's, on the committed source (the three changed sources swapped for fadafbfa's and restored, hashes checked) | 1 | the same 4 failed, 324 passed | `env-failures-committed.txt` |
| Targeted again after the fixtures (15 files: the touched ones, the store's and the upgrades') | 1 | 211 passed, 1 failed: `tempoSoundAgainstMark`'s timeout again; alone it passes | `green-unit-targeted-2.txt` |
| `npx vitest run`, on the final tree | 1 | 18 failed, 7527 passed, 1 skipped, 1 todo (7547): the four of this machine's, and 14 in 12 files timed out (`Test timed out in 5000ms`, `Timed out in waitFor!`) or failed beside a timeout under load | `vitest-all-2-summary.txt` |
| Those 12 files again, at two workers | 0 | 151 passed (151) | `vitest-rerun-suite-only.txt` |
| `npm run build:app` | 0 | — | `build-app.txt` |
| The map's browser specs (`checks_for_paths.py`'s `e2e` line, the twelve files, asserted present first), port 5183, config copy under `app/build/cl23/` | 0 | 155 passed | `e2e-map-minimum.txt` |
| `python tools/docs/checks_for_paths.py` over every touched path (from the root) | 0 | the lines above, plus `record-mirrors` and `content-tests` for the entry | `checks-for-paths.txt` |
| `python tools/docs/record_mirrors.py --check` (root) | 2 | one finding: *stale-record* — the brief's `## Record` ends at `approved` while this entry exists; with the entry set aside (and put back, hash checked) the check is 0. The landing's record script appends the event; a builder does not edit the record | — |
| `python -m unittest … -p test_record_mirrors.py` (root) | 1 | 2 errors, the same finding | — |

**This machine's four**, failing identically on the committed source: `lessonClaimsAboutApp` × 2 (each checks source text for an LF string, `includes("menuRow(\n    'Rhythm only'")` and the blind rule's CSS, against this Windows checkout's CRLF); `midiParity` (no reference under the worktree's `build/midi-parity`, written by a Python step CI runs); `taughtByAncestry` (no `build/rung-claims.json`, the content build's report). Not touched by this lane.

So every unit file has been seen passing on the final tree but those four: 313 files in the final whole run and the other 12 in the rerun.

## Unverified, beside what passes

- No screen was looked at: the performances list's words for an old performance, and any reading card, are unit-layer only.
- The upgrade's cost on the owner's phone (one read of every stored session inside the version-change transaction) is not measured; neither is the item pass's cost after a run (the item's rows inside the window and up to fifty compact rows past it).
- The budget relations are this machine's structured-clone measurements of generated rows; the readPhrase row omits the transfer facts `recordRun` adds to each measured record, so a stored row is larger than the fixture.
- The two non-monotone cases (clock set back, a merge-restore reordering an item of more than 500 rows) are reasoned, not tested.

## Post-action gate

Read back: every changed file re-read after the edits, the mutant script's restores checked by hash and diff stat, the targeted files rerun green after lint's fixes. Intent: Progress finds a performance at any depth (L53) and compaction stops keeping positions no count reader needs while keeping every position a demand reading can reach (L69); both met, the budget clause refuted and returned to L51 rather than satisfied by a chosen mix. Context: the reviewer's path (b) and its stop condition honoured; E50c untouched; no evidence module, screen or engine file edited. Side effects: stored evidence meaning unchanged for every reader that can reach a record; the marker a new field on performance rows only. New work: one observation attached to L51, two observations, no new row. Next step: the reviewer's answer to the one question; the doc rows below. VERIFIED: the red and green lines, the mutants, the exit codes listed. NOT YET VERIFIED: anything on a phone; the exceptions. HYPOTHESIS: none carried.

**Orchestrator's note at the landing (2026-09-30).** CL23's worktree committed by name (1f2ef2fd) and merged (6e8b0d70). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/CL23/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/CL23/orchestrator-exit.txt`). The reviewer's required change on CL23's own brief (`responses/questions-122a5224.md` §CL23: APPROVE WITH ONE REQUIRED CHANGE — *L53 is ready as written ... Do not use a boolean directly as the IndexedDB key, and do not let the DB bump alter E50c's mastery semantics*; the required change choosing path (b): *A row that is still reachable by demandReadings's current five-read window must retain the step-index arrays that drive rival/alone/selectivity ... The protection must follow the reader's actual reach, not an age approximation ... Implement the guard in the data/compaction boundary without changing demandReadings semantics ... If the data layer cannot identify that protected set without changing app/src/evidence/demandReadings.ts or inventing a new evidence rule, stop and return that architecture choice rather than approximating it*), taken under the fast path (operating-procedure.md §11: a required change returns to a builder without a second brief review, the verdict the pre-reviewed brief by construction); queued by the re-check ruling making L53 and L69 the next CL23 pre-reviewed brief together, two separately tested invariants inside one storage seam (`responses/questions-e71ef3ad.md` §'L53 + L69 / CL23').. a performance found however far back it is and the evidence fold outside the readings' reach; the byte-budget clause refuted and attached to L51; the folded entries' empty arrays with the reviewer

## Doc rows

- **In the change:** `db.ts`'s `RunObservation.evidence` comment (it said *No observation field changes for it; compaction keeps it*, at :355 on the base) now says compaction keeps every record and count and empties a measured record's step indexes once it is proven outside the readings' window (`db.ts`:365–373); `compactObservation`'s comment says the same (`progressStore.ts`:968–979); the version narrative gains 10 (`db.ts`:70–80); `pruneSessions`' comment no longer says the kept rows' evidence is never folded.
- **Proposed, `docs/08-test-map.md`:**
  - the file list, a new line: `performanceReach.test.ts` — a performance found however far back it is (L53, `DB_VERSION` 10): the version 9 upgrade marking the performances already stored with every other row and key unchanged, a fresh database's index, a performance behind more runs than the old 2,200-row walk, the marker written by `recordRun` on a performance only.
  - `backup.test.ts`'s line: add *a performance in a backup written before version 10, restored by replace and by merge onto a version 10 store, listed behind more runs than the old walk reached (CL23)*.
  - `sessionRetention.test.ts`'s line: add *since CL23 a measured record's per-demand step indexes folded to counts once it is outside its item's newest five reads of its skill under its stamp — the six-read, two-item and stale-stamp learners with `demandReadings` identical before and after, the copied filters, the fold a new run of the item starts; the budget case's evidence-bearing fixture (the largest real sight-read), which holds the fold and not the at-cap budget (L51)*.
  - `dbUpgrades.test.ts`'s line: add *version 10 is `performanceReach.test.ts`'s*.
  - the row *Finding a rare run in a long history* (:123): add *and behind more runs than the old 2,200-row reach, by the performances' own index (`performanceReach.test.ts`, CL23)*.
  - the row *Anything that grows* (:116): add *a compacted run's evidence folded to counts outside the readings' reach; an evidence-bearing store at the cap is not under the budget (L51)*.

## Content

Nothing under `content/` or `scores/` changes; no itemised content list is owed.
