# E54 — a rejection of the current approval withdraws it: the approval moves to `superseded`, the rejection kept as the event that replaced it, and the build stops cutting the range (E54's P2 half; ruled `responses/questions-71bd6cee.md`:199; fast path, `responses/questions-53670d2a.md`:338)

**Read first:**
- `docs/prompts/operating-procedure.md` §11–§13.
- **The row.** `docs/prompts/backlog-2026-09-25.md`:669 has three parts: the rejection (P2, this lane); *the workbench cannot show stored approvals or their staleness* (P3, not ruled, not built here, stays open); E51a's map row and comment (landed, Entry 164).
- **The rulings.** `responses/questions-71bd6cee.md`:199 (item 1). `responses/dffa9c34.md`:11–19 says a reject is a new event and the old approval stays intact. A curriculum reference to a withdrawn excerpt failing validation is correct (:17). The same file's :37–39 kept this case apart from E51.
- **The mechanism.** `docs/prompts/entry-159.md` (E51: Mechanism; Follow-up 1 is this row). `entry-164.md` item 5 (the comment guard).

## What is decided

1. **The ruling, verbatim** (`responses/questions-71bd6cee.md`:199):

   > **E54:** an explicit rejection of the currently active approval **supersedes/withdraws it and stops the cut**. Keeping the approval active beside a current rejection is contradictory. Preserve both events; active state follows the latest explicit decision.

2. **Premises at the lines** (HEAD 4f5f9eea; `tools/content/excerpts.py` unless named):
   - **What current means.** `approval_staleness` (:738–753) returns `[]` unless one of two conditions holds:
     - *stale by provenance* (:747): `parentSha256` is present and is not the parent's current built bytes (judged only when those bytes are given);
     - *stale by cut version* (:750–752): `approved_cut_version(row) != CUT_VERSION`, where a row with no `cutVersion` counts as 1 (:79–81).

     So a current approval has matching or unjudged parent bytes **and** cut version 2. All five committed rows lack `cutVersion`, so none is current and this change moves none of them.
   - **Where a rejection lands.** `merge_text` (:766) finds the stored row with the same parent, bars and selection for every decision (:820–821) and judges it (:823). The reject branch withdraws only `if at is not None and stale:` (:843; comment :844 reads *"a rejection of a current one is kept beside it"*). Otherwise the current row stays, and the rejection is appended to `rejected` (:848).
   - **Why the cut continues.** `attach_excerpts` (:576) cuts every row of `excerpts` (:593) and never reads `rejected`.
   - **The print.** `main` prints `+ {event}, superseding {old} ({'; '.join(why)})` (:996), so an empty `why` prints `()`.
   - **Text stating the old rule.** `COMMENT` :149–151 and `_comment` (`content/sources/excerpts.json`:19–21) say `superseded` holds an approval *"re-decided after it went stale"*; so do :774–784 and :844. `test_excerpts.py`:414–421 asserts `_comment == COMMENT`.
   - **The workbench.** `DevExcerptView.ts`:283 reads the proposer's projection, not the definitions; nothing there follows.
   - **The map.** `checks.json`:141 and :147 already name `excerpts.spec.ts`; no row is added.

3. **Hypothesis and refuting test.** The drafted hypothesis was that the approval list and the rejected list are read independently. It does not hold: the reject branch does look the approval up (:820–823). **Refined hypothesis:** the `stale` gate at :843 is the whole fault; without it, a rejection of a current approval takes E51's withdrawal path unchanged. **Refuting test:** case (a) fails on the committed code with `excerpts` still holding the row. If it fails elsewhere or passes, say where and stop before building.

4. **What to build** (`merge_text` and `main`'s print):
   - **Withdrawal.** A rejection of a stored approval's range withdraws it, stale or current: the approval leaves `excerpts` for `superseded` as `{**old, "supersededBy": <rejection event>}`, and the rejection stays in `rejected` with its reason. Both events are preserved.
   - **The print.** For a current approval, the `superseding` entry's `why` says so (e.g. *current; withdrawn by a rejection*), so :996 never prints `()`.
   - **Active state follows the latest explicit decision, in merge order**: line order within an export, then later merges. This is the merge's existing convention, and no timestamps are compared.
     - A later approval with its own event is a new decision: a plain append (`at is None`), stamped `cutVersion` by `_row_of`.
     - The old approval's export merged again is skipped (`by_event` indexes `superseded`, :791–793). It is never revived.
   - **No bytes check** on a rejection, as in E51.
   - **Words.** Change `COMMENT` :149–151 and `_comment` :19–21 identically, to say `superseded` also keeps an approval a rejection withdrew while current. Also change :774–784 and :844. Merge no row into `excerpts.json`.
   - **The built catalogue follows by construction** (:593). No byte moves: no committed row is current, and the build does not read `_comment` (Entry 164's sha check).

5. **Acceptance, red first on the committed code.** A new class, `TheWithdrawal`, sits beside `TheRenewal` and reuses its helpers.
   - **(a)** A current approval (`cutVersion` 2, current bytes via `shas`), then a rejection of its range:
     - `excerpts == []`: no cut;
     - `superseded[0]` is the old row kept whole, with `supersededBy` naming the rejection (`assertKeptWhole`);
     - the rejection is in `rejected` with its reason;
     - `superseding`'s `why` is non-empty;
     - the whole export merged again appends nothing, and the serialisation is unchanged.
   - **(b)** A rejection of a stale approval behaves as today: `TheRenewal` (g) stays green and unedited.
   - **(c)** A renewal after the rejection is a new decision: a new approval event becomes the one active row (`cutVersion` 2); the rejection and the superseded row stay; the old approval event merged again is skipped.
   - **(d)** The round-trip and the comment guard (`TheMerge` :407–421) stay green and unedited. The guard goes red when only one of `COMMENT` and `_comment` has changed.
   - **Mutants.** Each is exec'd over the loaded module, with the tree's file untouched:
     - **M1, the rejection ignored** (the `and stale` gate restored): caught by (a).
     - **M2, the approval deleted instead of superseded**: caught by (a)'s kept-whole assertion and by its rerun, which appends the old approval again.

6. **Deviations.** A wrong premise: say so, take the better path, record why.

## Verification layers

**Unit.**
- The new class, red on the committed code (quote the red line), then green.
- `python -m unittest tools.content.tests.test_excerpts tools.content.tests.test_validate_excerpts`.
- Both mutants.
- `python -m unittest discover -s tools/content/tests -t tools/content`. Where it needs built content, copy `app/public/content` read-only from the main checkout and say so.

**The landing chain** runs the rest of the map's minimum: the content build, the validator (five stale warnings, unchanged), the review check, vitest, the app build and `excerpts.spec.ts`. That spec (:130–136) asserts the summary line; run it only if `main`'s summary line (:990) changes.

**The product layer.** Nothing on a screen, nothing heard, no boundary judged; the five approvals stay stale.

## Rules and files

**You own:**
- `tools/content/excerpts.py`: `merge_text` and its docstring, the print at :996, `COMMENT`;
- `tools/content/tests/test_excerpts.py`: the new class and the module note;
- `content/sources/excerpts.json`: `_comment` only;
- `docs/prompts/runs/E54/`.

**Doc rows,** as text under `## Doc rows`, not edited: `docs/03`:923 (after E51's pending row), `docs/08`'s excerpt and `test_excerpts.py` rows, the backlog row.

**Not yours:** `convert.py`, `build.py`, `material.ts` (E50); `validate.py`, `review.py`, `excerpt_proposer.py`, `DevExcerptView.ts`, `checks.json`, `app/**`.

**Base.** Origin's head at dispatch (4f5f9eea or later), stated in the entry.

**Harness.**
- Work in your own worktree, and never commit, stage, stash, reset or check out. Temp state goes under `build/`.
- No Playwright unless `excerpts.spec.ts` must run. Then use a config copy under `app/build/e54/` on port 4973 with an absolute `storageState`.
- Logs under 300 KB; delete copies and `app/test-results` at the end.

Never name an AI model. Every item is done or has an explicit not-done line.

## Report

**Judgement first:** what a person's rejection of a current approval now does, and the red line.

**Then** Done / Not done / Follow-ups (E54's P3 half) / Questions / Files; the mechanism; the tests table (class, old assumption); the mutants; exit codes; what is unverified; technical and pedagogical verdicts, separately (pedagogical: not applicable); `## Doc rows`.

Entry: `docs/prompts/runs/E54/ENTRY.md`, Entry 174.

**Landed 2026-09-29** (Entry 174; 496fa11d, merged 11fc6978); handoff `handoffs/496fa11d.md`.

## Record

lane: E54 · closes: E54 · entry: 174
index: A rejection of the current excerpt approval withdraws it and stops the cut (the reviewer's ruling; backlog E54, P2) | content | **done 2026-09-29**, Entry 174; merged 11fc6978; handoff `handoffs/496fa11d.md`
in-flight: brief drafted 2026-09-30 (`E54-a-rejection-withdraws-the-approval.md`): a rejection of the current excerpt approval withdraws it to `superseded` with the rejection as the event that replaced it, and the build stops cutting the range (the reviewer's ruling, `responses/questions-71bd6cee.md`; queued first under the fast path, `responses/questions-53670d2a.md`); dispatched 2026-09-30 from df275e8f without a second pre-review, as the reviewer allowed (Entry 174). **Landed** 2026-09-29 (merged 11fc6978, chain green); handoff `handoffs/496fa11d.md`, with the reviewer.
state: landed 2026-09-30: merged 11fc6978; handoff `handoffs/496fa11d.md`
- closed 2026-09-30: APPROVE — merge/event order defines the latest explicit decision, no wall-clock precedence; the P3 workbench visibility separate (`responses/496fa11d.md`)
