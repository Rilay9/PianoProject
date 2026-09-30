### Entry 174 — E54 — a rejection of the current approval withdraws it: the approval moves whole to `superseded` with the rejection as the event that replaced it, the rejection stays in `rejected` with its reason, and the build stops cutting the range; a later approval is a new decision, and the withdrawn approval's export never revives it (E54's P2 half; the reviewer's ruling, `responses/questions-71bd6cee.md`:199; fast path, `responses/questions-53670d2a.md`:338; 2026-09-30)

**Base.** Origin's head at dispatch, `df275e8f`. The brief's premises were stated at `4f5f9eea`; every line it cites in `tools/content/excerpts.py` is at the same place at `df275e8f` (`:576`, `:593`, `:738`, `:766`, `:843`, `:844`, `:983`, `:996`, checked by grep). Nothing committed, staged or stashed; the orchestrator commits the named files.

**Judgement.**
- **What a person's rejection of a current approval now does.** It withdraws the approval. The approval leaves `excerpts`, so `attach_excerpts` (which cuts every row of `excerpts`, `:593`) no longer cuts it. The approval is kept byte for byte in `superseded` with `supersededBy` naming the rejection, and the rejection is kept in `rejected` with its reason. The command prints `+ <rejection>, superseding <approval> (current; withdrawn by a rejection)`, never an empty `()`. Before, the rejection was appended beside the approval, and the build kept cutting the range.
- **The red line**, `tools/content/tests/test_excerpts.py:691` on the committed merge (`red-on-committed.txt`): `AssertionError: Lists differ: [{'of': 'song.test.parent', 'fromBar': 5, [270 chars]: 2}] != [] … : the build stops cutting it: attach_excerpts cuts every row of excerpts`. `excerpts` still held the row (`'event': 'ex-renew-0001'`, `'cutVersion': 2`), as the brief's refuting test predicted.
- **The hypothesis held.** The `stale` gate at `:843` was the whole fault. Without it, a rejection of a current approval takes E51's withdrawal path unchanged. The one addition is the `why` for a current approval.
- **No committed row moved.** The five approvals are unchanged (the diff of `content/sources/excerpts.json` touches `_comment` alone) and are still stale by cut version. No decision was merged.

**The product layer.** Nothing shows on a screen and nothing is heard. No learner meets this directly: the five excerpts stay in the Library on no rung. What changes is what a reviewer's *reject* means: the range stops being cut and catalogued. The merge now follows the latest explicit decision, and it no longer keeps two contradictory records active. No boundary was judged; the five stay *by rule, unheard; unverified as music*.

**Hypothesis and refuting test (brief item 3).** Hypothesis: the `and stale` condition at `:843` is the whole fault. Refuting test: case (a) fails on the committed code somewhere other than `excerpts` still holding the row, or passes. It failed at the `excerpts == []` line with the row present, so the hypothesis stands. Mutant M1 restores that one condition and is red at the same line (below).

## Done

- **Technical verdict.** In `merge_text`'s reject branch, the gate `if at is not None and stale:` is now `if at is not None:` (`excerpts.py:857`). A rejection of a stored approval's range therefore withdraws it whether the approval is stale or current. The old row goes to `superseded` as `{**old, "supersededBy": <rejection event>}`, and the rejection is appended to `rejected`. There is no bytes check on a rejection, as in E51. `superseding` carries `stale or [WITHDRAWN_WHILE_CURRENT]`; the constant `"current; withdrawn by a rejection"` is at `:768`. The approval branch, `_row_of`, `by_event` and the serialiser are unchanged.
- **Pedagogical verdict.** Not applicable: this is a merge rule, not a teaching change. No boundary was judged or heard.

Item by item (brief item 4):
1. **The withdrawal.** Built as above. The rejection's event is the `supersededBy`, and both events are preserved.
2. **The print.** `main`'s line at `:1011` (the brief's `:996`) is unedited. It joins `why`, which is now never empty on a withdrawal: a stale approval gives its staleness as before, and a current one gives `current; withdrawn by a rejection`. The renewal branch reaches `superseding` only when `stale` is non-empty (`:842` refuses otherwise). So `()` cannot be printed from either path. Case (e) asserts the printed line through `main`.
3. **The active state follows the latest explicit decision, in merge order.**
   - After a withdrawal, a new approval with its own event finds no active row (`at is None`). It is a plain append, stamped `cutVersion` 2 by `_row_of`.
   - The withdrawn approval's export merged again is found through `by_event`'s index of `superseded` (`:802–807`) and skipped.
   - The rejection merged again after a renewal is found in `rejected` and skipped, so it does not withdraw the renewal.
   - Within one export, line order decides: an approval then its rejection leaves no active row; a rejection then an approval leaves the approval active. No timestamps are compared.
4. **The words.** Each is changed in the same change:
   - `COMMENT` (`:149–152`) and `_comment` (`content/sources/excerpts.json`:19–22) are identical. One string was replaced by two: "parent bytes or by cut version, and each one a person's rejection withdrew while it was current: the old" / "row as it was, with `supersededBy`, the event that replaced it (a rejection is kept in `rejected` too). A".
   - The docstring of `merge_text` has a new E54 paragraph (`:787–792`).
   - The comment at the reject branch (`:858–859`) no longer says a rejection of a current approval is kept beside it.
   - `_comment` was spliced as text (`2 1` numstat, CRLF kept). The round-trip `test_the_committed_file_is_the_merges_own_serialisation` is green unedited, so the splice is the serialiser's own form.
5. **No row merged into `excerpts.json`.** `excerpts` (5 rows) and `rejected` are untouched. The build reads only `excerpts`, so the built catalogue follows by construction. It was not rebuilt here (see *Unverified*).

Consumers, grepped over `tools/`, `app/src`, `app/scripts` and `app/tests` (`.py`, `.ts`, `.mjs`):
- `validate.py:1005` and `test_measured_truth.py:495` read `excerpts` only, and `attach_excerpts` reads `excerpts` only.
- Nothing outside `merge_text` and its tests reads `rejected` or `superseded`. `review.py`'s `"superseded"` is the review record's own status, another thing.
- `excerpts.spec.ts` merges an adjusted approval and has no rejection (grep), so its merge case is unaffected by construction. It was not run.
- `DevExcerptView.ts` reads the proposer's projection.
- `checks.json` already names `excerpts.spec.ts` for both files, so no row was added.

No test asserted the old behaviour. The only rejections in the tests are `TheMerge`'s into an empty file (`:394`, `:397`) and `TheRenewal` (g)'s of a stale approval, and both are unedited and green. So nothing was deleted or replaced.

## Not done

- **E54's P3 half:** the workbench still cannot show stored approvals or their staleness. It is not ruled and was not built here, and it stays open (follow-up 1).
- **No build, validator, review check, whole unit suite, app build or `excerpts.spec.ts` run here.** The map names them for these paths (`checks.txt`), and the landing chain runs them.
- **None of the five approvals was renewed, rejected or re-decided.**
- **The module header at `excerpts.py:12–18`** was read and left: it says rejections are kept beside the approvals in `rejected`, which is still true of the file's lists. It is E51's recorded not-done, outside `merge_text`.
- **Nothing heard, no screen driven.**

## Follow-ups

1. **E54's P3 half (stays open, not ruled):** the workbench (`DevExcerptView.ts`) reads the proposer's projection only. It cannot show which ranges already have a stored approval, whether that approval is stale or current, or that a *reject* on one now withdraws it. A reviewer rejecting a range sees no sign that a current approval exists. Owner: E; P3 as recorded.
2. **For the doc splicer:** E51's pending `docs/03` and `docs/08` rows (`runs/E51/ENTRY.md` `

**Orchestrator's note at the landing (2026-09-29).** E54's worktree committed by name (496fa11d) and merged (11fc6978). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/E54/map-min.txt`), the content build offline (the reports compared), the validator, the record check, the whole content suite, then the app steps the map names — the whole unit suite on the rebuilt content, the app build, and the specs the map's minimum names where it names any (map-tests 0; map-min 0; content-build 0; content-validate 0; review-check 0; content-tests 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/E54/orchestrator-exit.txt`). Your ruling on E54 (`responses/questions-71bd6cee.md`, item 1 of the survey decisions) and your queue putting it first under the fast path (`responses/questions-53670d2a.md`). Landed in one content chain with the other (merge range ef5e25fc..11fc6978): map, the content build (the regenerated rung-claims.md committed with L120d's record, as its TestTheReports reads it), validate, review, the content suite, the whole unit suite (only the known CRLF pair red), the app build and the map's nine browser specs, 97 passed. Dispatched under the fast path the reviewer allowed, without a second pre-review.

## Doc rows`) are still unapplied. E54's rows were applied standalone into today's text (below). When E51's rows land, they go before E54's at the same anchors. E51's bullet "a rejection withdraws it, so the build stops cutting it" then reads as the stale case of E54's sentence, and can be dropped or kept.

## Questions

None.

## Deviations from the brief, each with its reason

- **Two cases beyond (a)–(d):**
  - `test_c_within_one_export_line_order_is_the_order_of_decision` pins the brief's "line order within an export".
  - `test_e_the_command_says_the_current_approval_was_withdrawn` pins the print the brief assigns. It is the one place `()` could show.
- **The kept-whole assertion in (a) is preceded by `len(superseded) == 1`.** That is where M2 goes red (a clearer message than an `IndexError`).
- **`main`'s print was not edited.** The brief's goal (the `why` says so, `()` is never printed) is met in `merge_text`, which the print reads.
- **`app/node_modules` installed in the worktree (`npm ci`).** `test_6` measures through the bridge, which runs vitest, and it errored without it (`Cannot find package 'vitest'`).

## Files

- **Changed:**
  - `tools/content/excerpts.py`: `COMMENT`, `WITHDRAWN_WHILE_CURRENT`, and `merge_text`'s docstring and reject branch;
  - `tools/content/tests/test_excerpts.py`: the module note and the class `TheWithdrawal`;
  - `content/sources/excerpts.json`: `_comment` only;
  - `docs/03-content-pipeline.md`: the §4c merge bullet;
  - `docs/08-test-map.md`: the excerpt row and the `test_excerpts.py` line.
- **Added:** `docs/prompts/runs/E54/`, holding `ENTRY.md`, `red-on-committed.txt`, `green-unit.txt`, `mutants.py`, `mutants.txt`, `splice_docs08.py`, `checks.txt` and `content-suite.txt`.
- **Deleted at the end, after the suite finished:**
  - the built content copied read-only from the main checkout into `app/public/content/` (everything but the tracked `audio/`);
  - `app/public/dev/`, `content/scores/imported/kern/`, and `build/` (the three copied outputs, the suite's `cache/`, `e54/`), all copied for the attribution rerun or written by the runs;
  - `app/node_modules` (from `npm ci`);
  - the `__pycache__` folders under `tools/`, `docs/prompts/runs/E54/`, `content/scores/authored/` and `packaging/`.
  `git status --short --ignored` then shows the five changed files and `docs/prompts/runs/E54/` alone (with the tracked-side `app/public/content/audio/`).

## The red lines

- **(a)**, `test_excerpts.py:691` on the committed merge: `AssertionError: Lists differ: [{'of': 'song.test.parent', 'fromBar': 5, [270 chars]: 2}] != [] … the build stops cutting it: attach_excerpts cuts every row of excerpts`.
- **(c)** at `:717`: `([], [(1, 'excerpt.test.parent.b5-8 is already approved (event ex-renew-0001)')]) != (['ex-withdraw-0003'], [])`. The renewal was refused because the rejected approval was still active.
- **(c, line order)** at `:738`: the approval still in `excerpts` after its rejection in the same export.
- **(e)** at `:769`: `'+ ex-withdraw-0002, superseding ex-renew-0001 (current' not found in '… appended 1, already in the file 0, refused 0.\n  + ex-withdraw-0002\n'`.
- **The guard, live**, with `COMMENT` changed and the file not yet spliced, at `:421`: `Lists differ … First differing element 17 … Second list contains 1 additional elements` (`checks.txt`).

## Tests

| Test | Class | Committed | After |
| --- | --- | --- | --- |
| `TheWithdrawal` (a): a rejection of the current approval withdraws it, kept whole, the rejection kept, `why` non-empty, the rerun byte-identical | added, the learner-facing result (the cut stops) | red at `:691` | green |
| `TheWithdrawal` (c): a renewal after the rejection is a new decision; the old approval's export and the rejection merged again are skipped | added | red at `:717` | green |
| `TheWithdrawal` (c): line order within one export is the order of decision | added | red at `:738` | green |
| `TheWithdrawal` (e): the command's line names the withdrawal | added | red at `:769` | green |
| `TheRenewal` (g) and all of `TheRenewal` (b) | unedited | green | green |
| `TheMerge` round-trip and comment guard (d) | unedited | green | green; the guard red with only one side changed (D1, D2) |
| `python -m unittest tools.content.tests.test_excerpts tools.content.tests.test_validate_excerpts` | | | 74 run, OK, 0 skipped (`green-unit.txt`) |
| `python -m unittest discover -s tools/content/tests -t tools/content` | | | 1567 run, exit 1: 10 failures, 4 errors, 5 skipped, finished after the handback. All 14 name a gitignored build output or fetched source missing from the worktree (`build/score-checks.json`, `build/rung-claims.json`, `build/catalog.generated.json`, `app/public/dev/review/microscope.json`, the fetched Joplin edition). With those copied read-only from the main checkout, the six modules holding the 14 (`test_measured_truth`, `test_review_record`, `test_bar_splits`, `test_loose_attributes`, `test_note_loss`, `test_technique_units`): 127 run, OK (`content-suite.txt`). None is E54's |
| `npx vitest run tests/unit/docsConsistency.test.ts tests/unit/libraryImportWords.test.ts` (the map's unit files for `docs/03`) | | | 2 files, 11 tests passed (`checks.txt`) |

## The mutants (`mutants.py`, `mutants.txt`)

Each mutant was exec'd over the loaded `excerpts` module, and the tree's files were hashed equal before and after. `merge_text` was put back after each.
- **M1, the rejection ignored** (`if at is not None and stale:` restored): caught. `TheWithdrawal` (a) went red at `:693`, the `excerpts == []` line (`:691` before the module note grew by two lines), and (c), (c, line order) and (e) went red too. `TheRenewal` stayed green, as E51's behaviour predicts. Under M1, (a)'s rerun leaves `ex-renew-0001` active.
- **M2, the approval deleted instead of superseded:** caught.
  - (a) went red at `:694`: `0 != 1 : the approval is kept, not deleted`.
  - (a)'s rerun on its own: `appended ['ex-renew-0001']`. The deleted approval's export revives it, and the bytes change.
  - `TheRenewal` (g) went red too, as did (c), (c, line order) and (e).
- **D1, only `COMMENT` changed** (the file's `_comment` the base's, in a scratch copy): the guard went red. The round-trip stayed green.
- **D2, only `_comment` changed** (`COMMENT` the base's, exec'd over the module): the guard went red. With both sides as the tree has them, the guard is green.

## Unverified

- **Not rebuilt here:** the built catalogue. The build reads `excerpts` alone (`:593`), and neither its rows nor the cutter changed, so no byte should move. That is inferred, not measured.
- **Not run:** the validator, the review check, the whole unit suite, the app build and `excerpts.spec.ts` + `library.spec.ts` (the map's minimum; the landing chain).
- **The copied built content** is the main checkout's (catalogue sha256 `72a14d84…`). Whether it matches this base's build was not checked. Only the validator's built-catalogue case in `test_validate_excerpts` and the content suite read it.
- **Nothing heard; CI has not run this tree.**

## Doc rows

Applied here into today's text. E51's pending rows are not in today's text (follow-up 2).

**`docs/03-content-pipeline.md` §4c, the excerpt workflow bullet (`:923`).** After *"(a range approved twice is refused with the row named)."* insert: "A rejection of an approved range withdraws the approval, current or stale, so the build stops cutting it; both decisions are kept, the approval whole in the file's `superseded` list with the rejection as the event that replaced it, the rejection in `rejected` with its reason, and a later approval of the range, with its own event, is a new decision (E54, Entry 174)." Applied at `:923–927`.

**`docs/08-test-map.md` `:40`, the excerpt row** (`splice_docs08.py`, idempotent). Applied at `:40`.
- In the *breaks it* column, after *"the attribution lost with the header"*: "; a rejection of a current approval kept beside it, so the build goes on cutting a range a person rejected (E54)".
- In the tests column, after *"the merge idempotent, refusing a range twice and a malformed line"*: "; since E54 (`TheWithdrawal`), a rejection of the current approval withdraws it, the approval kept whole in `superseded` and the rejection in `rejected`, a rerun appending nothing, a later approval a new decision that the withdrawn approval's export never overturns, line order within one export the order of decision, and the command's line naming the withdrawal".
- In the status column, after *"unverified as music"*: "; E54 (Entry 174): a rejection withdraws a current approval as well as a stale one; none of the five re-decided".

**`docs/08-test-map.md` `:725`, `test_excerpts.py`.** Appended: "Since E54, `TheWithdrawal` tests the withdrawal of a current approval: a rejection of it moves it whole to `superseded` with the rejection as the event that replaced it, the rejection kept in `rejected` with its reason, and a rerun appends nothing; a later approval is a new decision, and the withdrawn approval's export merged again never revives it; within one export, line order is the order of decision; the command's line names the withdrawal." Applied at `:725`.
