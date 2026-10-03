### Entry 159 — E51 — a stale excerpt approval can be renewed: a new explicit decision naming the parent's current bytes supersedes an approval stale by provenance or by cut version, and the old row is kept whole in `superseded`; a rejection withdraws a stale approval; an approval of a range whose approval is current is still refused; nothing becomes current by implication. On this worktree's build all five approvals are stale by cut version and none by provenance, and none was re-decided (2026-09-29)

**Judgement.** A person holding the five stale approvals now has a path for each: a decision on the passage, exported and merged with `python tools/content/excerpts.py --merge`. There are three outcomes.
- **Approve or adjust.** The line must name the parent's current built bytes. It then becomes the one active row, merged under cutter version 2, and the old row moves whole to the file's new `superseded` list with the event that replaced it.
- **Reject.** This withdraws the stale approval: the build stops cutting it, and the old row is kept the same way.
- **A line naming no bytes, or other bytes.** It is refused, and the refusal says why.

Once a range is renewed, a further approval of it is refused as before, because its approval is current again.

Nothing was re-decided here. The builder merged no renewal and no decision into `content/sources/excerpts.json`: a renewal is a person's decision after comparing the cuts, and E51 comes before any renewed boundary approval is sought or claimed. Nothing was heard and no boundary was judged. What a learner meets is unchanged today, since the five stay in the Library on no rung.

**The counts (item 5), on this worktree's offline build at `f6d36ee9`, with the existing tools.**
- **Stale by cut version: 5 of 5** (`validate.txt`, `validate.py --allow-nc --personal`, exit 0). Each row was merged before E33 and carries no `cutVersion`, so it reads as version 1 against the cutter's 2:
  - row 1 `excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32` (event `ex-4a4c15fa…`);
  - row 2 `excerpt.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28` (`ex-05f48703…`);
  - row 3 `excerpt.classical.beethoven-ode-to-joy.easy.b9-12` (`ex-b09dcf7b…`);
  - row 4 `excerpt.classical.i-got-rythm.pdmx.b15-18` (`ex-0fe1ee6a…`);
  - row 5 `excerpt.blues.wabash-blues.b1-4` (`ex-a57de44f…`).
- **Stale by provenance: 0 of 5.** Every row's `parentSha256` equals its parent's built file on this build. The merge's own judgement agrees row by row (`dry-run.md`, first section).
- **D2's record, a different record, for information** (`review-check.txt`, exit 0): *4 event(s), 4 by a person, 0 triage; 4 current, 0 superseded, 0 stale, 0 on an item the catalogue does not have.*

**What a person sees** (`dry-run.md`). The dry run used a scratch copy (`build/e51/excerpts.json`), hand-made lines signed *E51 dry run* and the command a person runs. It ran twice, then the validator's excerpt check read the scratch copy against the same build. The committed file was unchanged afterwards (its sha256 compared before and after).
- **A renewal:** `+ e51-dry-run-0001, superseding ex-b09dcf7b-… (stale by cut version: approved under cutter version 1, the cutter is now version 2)`.
- **Two refusals**, one for a line naming no bytes and one for a line naming bytes the parent does not have: `excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32: its approval (event ex-4a4c15fa-…) is stale by cut version: …; a renewal is a decision on the current parent, and this line names no parent bytes` and `… and this line names the parent's bytes 000000000000…, the parent is now e31397242245…`.
- **A current approval refused:** the renewed range approved again gives `excerpt.classical.beethoven-ode-to-joy.easy.b9-12 is already approved (event e51-dry-run-0001)`.
- **A skip:** the old Wabash export counts in the summary line, *already in the file 1*. The second run gives *appended 0, already in the file 3, refused 3*.
- **A withdrawal:** `+ e51-dry-run-0003, superseding ex-0fe1ee6a-…`. It left the I Got Rhythm row out of `excerpts`.
- **The scratch copy after:** both superseded rows are byte-identical to their committed rows, with no `cutVersion` added. The renewal carries `cutVersion` 2 and the parent's current bytes.
- **The validator on the scratch copy:**
  - it reports 3 stale warnings where the committed file has 5 (the renewed and withdrawn rows are gone);
  - it reports no duplicate signature;
  - it reports one error: *excerpt.classical.i-got-rythm.pdmx.b15-18: an excerpt with no approved row*. The error is expected. The built catalogue was cut from the committed file and nothing was rebuilt over the scratch copy; a build over it would no longer cut the withdrawn passage.

**Mechanism, and the hypothesis tested: it held.** The brief's hypothesis was that the refusal at `excerpts.py:764–770` matches on parent, bars and selection alone and never asks whether the stored approval is stale, so a renewal has no path. The test that could refute it was case 4(a) passing on the committed code. It failed there with the refusal: *`[(1, 'excerpt.test.parent.b5-8 is already approved (event ex-renew-0001)')] != []`* (`red-on-committed.txt`).

The change acts on that mechanism:
- `merge_text` now finds the stored row with the same signature and asks `approval_staleness`, the validator's two conditions stated once in the merge. The first is **by provenance**: a `parentSha256` that is present and differs from the parent's current bytes, judged only when those bytes are given. The second is **by cut version**: `approved_cut_version(row) != CUT_VERSION`.
- A current row is refused with exactly today's words.
- For a stale row, an approval or adjustment must pass `_renewal_fault`: it must name bytes, and the bytes must be the current ones where those are known. It then replaces the row in place, and the old row is appended to `superseded` as `{**old, "supersededBy": new event}`.
- A rejection of a stale row pops it into `superseded` and is appended to `rejected`.
- `main` reads each stored row's parent's built file (`sha256_of(content / file)`, as the validator and the build do) and passes the map beside `known_ids`.

**Premises checked at the lines** (base `f6d36ee9`; `ee481854` is its ancestor, with no change between them in these three files).
- `excerpts.py` stands where the brief says: `merge_text` at 729, the refusal at 764–770, `main`'s call at 904, `COMMENT`/`read_definitions`/`serialise_definitions` at 132–169, and `_row_of` stamping `cutVersion` on every non-rejection.
- `validate.py`'s `excerpt_findings` is at **962** (the brief says 984). Its duplicate-signature error is at 1006–1007, *stale by provenance* at 1055–1059 and *stale by cut version* at 1060–1063. The content is as the brief says; the line numbers are 22 lower, and were at `ee481854` too.
- The consumers of `content/sources/excerpts.json` were searched in `tools/` and `app/`:
  - `attach_excerpts`, `validate.excerpt_findings` and `test_measured_truth.py:418` read `excerpts` only;
  - `build.py:1031–1033` reads the carried event;
  - `DevExcerptView.ts` reads the proposer's projection;
  - `excerpt_proposer.py` reads no approvals.

  None breaks on a `superseded` list. **One more consumer runs the merge itself:** `app/tests/e2e/excerpts.spec.ts` (at about lines 125–138) calls `excerpts.py --merge` on a copy of the committed file and asserts *appended 1* and *appended 0, already in the file 1*. The summary line is unchanged, and its range (Anh. 113 bars 26–32) is not a stored range, so that path is the plain append. The spec was not run (below).
- **Where the byte-identity of the superseded row is kept:** by comparing it without `supersededBy`, inside `merge_text`. `_same_decision` is untouched, which keeps the lane to what the brief names.
- **Premise refuted: none.** No deviation from the brief's decisions.

## Done

- **Item 1, the rule.** The merge now records a new explicit decision on a stale approval (the ruling's :12), keeps the old event, and carries nothing over by byte equality (:15). Case 4(a)'s stored row has the same parent bytes as its renewal and is still renewed only by the incoming event.
- **Item 2, stale in the code's terms.** `approval_staleness(row, current_parent_sha)` states the validator's two conditions. Provenance is judged only where the row has a `parentSha256` and the current bytes are given. `main` hands the current bytes of each stored row's parent, read from the built content, beside `known_ids`. With no bytes (`None`), or for a parent the build did not write, provenance is not judged and a row stale by provenance alone is refused as current (fails closed; case 4(e); mutant M9).
- **Item 3, the new path.**
  - Approve or adjust on a stale row is accepted only when the event names the parent's current bytes. A line naming none is refused (*this line names no parent bytes*), and so is one naming other bytes (*names the parent's bytes …, the parent is now …*), each with *a renewal is a decision on the current parent*. Without the current bytes, the line must still name bytes. The new row is stamped `cutVersion = CUT_VERSION` by `_row_of` and takes the stale row's place in `excerpts`, so row numbers stay stable.
  - A reject on a stale row withdraws it: the row leaves `excerpts` and the rejection is kept in `rejected` with its reason.
  - The old row is kept byte for byte in a top-level `superseded` list: every field and its order as it was, an absent `cutVersion` still absent, the old `parentSha256` unchanged, plus `supersededBy`. A chain keeps every earlier row in order.
  - `read_definitions` defaults the key. `serialise_definitions` writes it after `rejected`, and only when it is non-empty. `COMMENT` gains three lines for it.
  - `by_event` indexes superseded rows, compared without `supersededBy`, so the old export merged again is skipped and so is the renewal.
  - An approval of a range whose approval is current is refused exactly as today, with the row named.
  - The merge never rewrites a stored row's `parentSha256` or `cutVersion`, and nothing is renewed without an incoming event with its own id, reviewer and time.
  - Beyond `merge_text`, the lane widened only by `main`'s call (the map of current bytes and the `+ …, superseding …` line), `read_definitions`, `serialise_definitions` and `COMMENT`. It also added two private helpers beside `merge_text` (`approval_staleness`, `_renewal_fault`).
- **Item 4, red first, unit.** `TheRenewal` sits in `test_excerpts.py` beside `TheMerge`, with 11 cases: 4(a)–(i), 4(d) in two parts, and (j), the command reading the parents' current bytes from built content.
  - On the committed code, 10 are red: 7 fail on assertions, and 3 error because `current_shas` does not exist. That is (b), (h) and the with-bytes half of (d), whose three subtests error.
  - Green there by design: (d)'s case without bytes, and the old `TheMerge` and `TheCutVersion` cases (`red-on-committed.txt`).
  - After the change, all 21 cases of the three classes pass, unedited apart from the new class.
  - Nine mutants were each caught (`mutants.txt`, `mutants.py`).
- **Item 5, counts with the existing tools.** Done above, and nothing edited. The dry run targeted only `build/e51/excerpts.json`.
- **Technical verdict.** The merge takes the decision the ruling asks for. The validator reads a renewed file as one current row (case 4(i), and the dry run on the real build). The committed file still round-trips byte-identical.
- **Pedagogical verdict.** Not applicable to a merge path. The five boundaries remain *by rule, unheard; unverified as music*, and no teaching-use decision exists on any of them.

## Not done

- **No renewal, rejection or other decision merged for any of the five** (item 5, by the brief). They stay stale by cut version.
- **The browser spec that runs the merge (`app/tests/e2e/excerpts.spec.ts`) was not run.** The map names no browser spec for these paths and the brief says to run none. Its two asserted substrings come from the summary line, which is unchanged; that is checked by reading, and the dry run printed the same form. It is not verified by a run.
- **The workbench route to each of the five ranges was not driven.** The view exports `parentSha256` as the proposer read the built file (`excerpt_proposer.py:825`, `DevExcerptView.ts:608`). So a renewal exported after the latest build names current bytes, and one from an older projection is refused by the merge. Whether the proposer (`propose --for <target> --of <parent>`) and the view's boundary moves reach each stored range, and whether a gate-refused window can be approved there, was not checked.
- **`docs/03` and `docs/08` not edited:** their lines are under `## Doc rows` for the orchestrator.
- **The module header docstring (`excerpts.py:12–18`, which names `rejected`) not edited:** it is outside the lane the brief names exactly. `merge_text`'s docstring and `COMMENT` state `superseded`.

## Follow-ups

1. **A rejection of a *current* approval** is still appended to `rejected` beside the active row, and the build goes on cutting it. That is today's behaviour for a current approval, and not E51's. A person's *reject* on an approved range should probably withdraw it whatever its staleness, or be refused with the row named. Proposed: P2, E.
2. **E50's Wabash row.** When E50 re-converts `song.blues.wabash-blues`, its approval (bars 1–4, row 5) will be stale by provenance as well as by cut version. E51 is the path for that re-decision (a renewal naming the re-converted file's bytes, or a rejection), not its fix; E50 handles the approval explicitly through it. Row: E50/E51.
3. **The committed file's `_comment` lags `COMMENT`.** It equals the old `COMMENT`, so it lacks the three `superseded` lines, and the merge keeps a file's stored comment, so the first renewal merged into it will not add them. The orchestrator can splice the three lines (from `excerpts.py`'s `COMMENT`, after the `rejected` line) into `content/sources/excerpts.json`'s `_comment`; the round-trip test reads the file's own comment, so it stays green either way. Alternatively, leave it until a renewal lands. Proposed: P3, content (not mine: `content/**`).
4. **The test map.** `checks_for_paths.py` names no browser spec for `tools/content/excerpts.py`, although `excerpts.spec.ts` runs its `--merge`. Mapping `tools/content/excerpts.py` to that spec is a test-map change, so it goes to the reviewer before a push. Proposed: P3, process.
5. **The workbench cannot see stored approvals.** It reads no approvals, so a person re-deciding learns which ranges are stale from the validator's warnings, not from the view. Whether the view should show a stored approval and its staleness is a later workbench question, recorded and not assumed. Proposed: P3, E/workbench.

## Questions

None blocking.

## Files

Changed and added are in this worktree (base `f6d36ee9`); nothing was committed, staged or stashed.

- **Changed:**
  - `tools/content/excerpts.py`: `COMMENT` (three lines), `read_definitions`, `serialise_definitions`, `approval_staleness` and `_renewal_fault` (new, beside `merge_text`), `merge_text`, and `main`'s merge branch;
  - `tools/content/tests/test_excerpts.py`: the module note, four imports, and the class `TheRenewal`.
- **Added:**
  - `docs/prompts/tasks/E51-a-stale-approval-can-be-renewed.md` (the brief, copied unchanged);
  - `docs/prompts/runs/E51/ENTRY.md`;
  - `docs/prompts/runs/E51/red-on-committed.txt`, `green-unit.txt`, `mutants.txt`, `mutants.py`, `dry-run.md`, `dry_run.py`, `validate.txt`, `review-check.txt`, `build-after.txt`, `content-suite.txt`, `vitest.txt`, `build-app.txt` and `restore.txt`.
- **Not changed:** `content/sources/excerpts.json` (sha256 unchanged by the dry run), `validate.py`, `review.py`, `content/review/decisions.jsonl`, the cutter and `CUT_VERSION`, `attach_excerpts`, `DevExcerptView.ts`, `convert.py`, `app/**`, `docs/03`, `docs/08`.
- **Build side effects, restored:** `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md` were rewritten by the builds and copied back from the snapshot taken before the first build. `content/scores/imported/SOURCES.md` was not rewritten. `validate.py` regenerated the views, 0 of them stale, and `git status` shows none changed.
- **Copied read-only from the main checkout, and deleted at the end:** `content/scores/imported/{kern,musetrainer,mutopia}` and `build/cache`. Also deleted at the end: `app/dist`, and the 891 KB vitest capture, which is summarised in `vitest.txt`. `app/test-results` was never created, since no browser spec ran (`restore.txt`).

## The red lines

`red-on-committed.txt`: `TheRenewal`, `TheMerge` and `TheCutVersion` against the committed `excerpts.py` gave exit 1 (21 run, 7 failures, 5 errors).

**Assertion failures (7):**
- 4(a): `[(1, 'excerpt.test.parent.b5-8 is already approved (event ex-renew-0001)')] != []`, **the hypothesis's red line**.
- 4(c): `'a renewal is a decision on the current parent' not found in 'excerpt.test.parent.b5-8 is already approved (event ex-renew-0001)'`.
- 4(e): `([], [(1, '… is already approved …')]) != (['ex-renew-0002'], [])`. The half that fails closed passes there, since it is today's refusal; the half renewing by cut version fails.
- 4(f): `[] != ['ex-renew-0002']`.
- 4(g): the stale row still in `excerpts` after the rejection.
- 4(i): the renewal refused, so the validator's stale warning stays.
- (j): the command's refusal is *already approved*, not the named bytes.

**Errors (3 cases, 5 counted):** 4(b), 4(h) and 4(d)'s with-bytes half (three subtests) give `TypeError: merge_text() got an unexpected keyword argument 'current_shas'`. The parameter is new, so these are red by construction, not by behaviour.

**Green there by design:** 4(d) without bytes, `TheMerge`'s six and `TheCutVersion`'s four.

`mutants.txt`: each mutant is exec'd over the loaded module, and the tree's file is untouched. All 9 were caught:

| Mutant | Cases red |
| --- | --- |
| M1: staleness never judged | 9 |
| M2: the renewal's bytes never checked | 2 (c, j) |
| M3: superseded rows not indexed by event | 1 (f) |
| M4: `main` passes no current bytes | 1 (j) |
| M5: a rejection never withdraws | 1 (g) |
| M6: the renewal appended beside the stale row | 5 |
| M7: the old row stamped with the new cutter | 2 (a, h) |
| M8: `superseded` always written | 4, the committed file's round-trip among them |
| M9: provenance judged without the current bytes | 8, (d) and (e) among them |

## Tests

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `test_excerpts.py` › `TheRenewal` (11) | add | a range approved once can never be approved again, stale or not | the renewal of a stale approval, 4(a)–(i) and (j) |
| `test_excerpts.py` › `TheMerge` (6), incl. the refusal (:371–381) and the round-trip (:400–405) | preserve | — | green, unedited |
| `test_excerpts.py` › `TheCutVersion` (4) | preserve | — | green, unedited |
| `test_validate_excerpts.py` | preserve | — | green, unedited (the fixture pattern reused inline in 4(i)) |

## Exit codes (the last line of each capture)

| Run | Exit |
| --- | --- |
| `parity_reference.py` · `npm ci` in `app/` | 0 · 0 |
| content build, offline, the setup build: started on the committed code, with `excerpts.py` edited while it ran, so it is setup, not a before measurement (`restore.txt` has the stopped first attempt) | 0 |
| red (`red-on-committed.txt`) · mutants (`mutants.txt`, 9 of 9 caught) | 1, as intended · 0 |
| `python -m unittest tools.content.tests.test_excerpts tools.content.tests.test_validate_excerpts` (`green-unit.txt`, 69) | **0** (OK) |
| **the map, in order:** content build, offline (`build-after.txt`) | **0** (2,092 items, validation OK) |
| `validate.py --allow-nc --personal` (`validate.txt`) | **0** (content validation OK) |
| `review.py --check` (`review-check.txt`) | **0** |
| the content suite, `unittest discover -s tools/content/tests -t tools/content` (`content-suite.txt`, 1,488) | **0** (OK, 4 skipped) |
| `npx vitest run` (`vitest.txt`, a summary; the capture was over 300 KB) | 1: 311 of 315 files pass; 5 of 7,188 cases fail (7,177 pass, 5 skipped, 1 todo). Two are the recorded line-ending pair in `lessonClaimsAboutApp` (blues.3, 4.7; Entry 101), which still fail alone. Three pass alone: `expectedNote`'s black-key case (a 5-second timeout in the suite, as X31 recorded), `firstContactOnTheScore`'s *Play it to me* count and `simonTurnCue`'s key-while-playing case. Passing alone is the load signature, inferred. E51 changes no app file |
| `npm run build:app` (`build-app.txt`) | **0** |
| the dry run (`dry-run.md`; the two merges inside it exit 1 each, for their intended refusals) | 0 |

**What the map names** (`checks_for_paths.py tools/content/excerpts.py tools/content/tests/test_excerpts.py`): the content build, validate, the review check, the content suite, the unit suite and the app build. No browser spec. All were run, in that order, with the dry run between the review check and the content suite (it reads the built content and writes only under `build/e51/`).

**Unverified, beside what passes.**
- Nothing heard, no boundary compared or judged, no teaching-use decision.
- `excerpts.spec.ts` was not run (above).
- The workbench route to the five ranges was not driven (above).
- The counts are this worktree's build at `f6d36ee9`. A re-conversion (E50) would move Wabash's provenance.
- CI has not run this tree.

## Doc rows

**`docs/03` §4c, the excerpt workflow bullet (lines 881–882).** Replace *"(a range approved twice is refused with the row named)"* with:

"(a range approved twice is refused with the row named, unless its approval is stale, by parent bytes or by cut version (E51, Entry 159). A new decision then supersedes it:
- an approval or adjustment that names the parent's current built bytes becomes the active row, merged under the cutter in force; one naming other bytes, or none, is refused with the reason;
- a rejection withdraws it, so the build stops cutting it.

Either way the old row is kept whole, with `supersededBy`, the event that replaced it, in the file's `superseded` list, which neither the build nor the validator reads. The merge rewrites no stored row and renews nothing without a person's event; a byte-identical cut carries nothing over)"

**`docs/03` lines 750–756** (the provenance block's `stale` and `approvedCutVersion`): no change. The block is unchanged, and `stale` keeps its one meaning.

**`docs/08` line 39, the excerpt row.**
- In the *breaks it* column, append: "; a stale approval with no path to be re-decided, or made current by byte equality or by implication (E51)".
- In the tests column, after *"the merge idempotent, refusing a range twice and a malformed line"*, insert: "; since E51 (`TheRenewal`), a stale approval renewed by a decision naming the parent's current bytes or withdrawn by a rejection. The old row is kept whole in `superseded`. A renewal naming other bytes or none is refused, provenance fails closed without the current bytes, and a current approval is refused as before. The old export and the renewal merged again are skipped, a chain of renewals is kept in order, the validator reads a renewed file as one current row, and the command reads the parents' current bytes".
- In the status column, append: "; E51 (Entry 159): the merge renews or withdraws a stale approval; none of the five re-decided".

**`docs/08` line 719, `test_excerpts.py`.** Append: "Since E51, `TheRenewal` tests the merge's renewal of a stale approval:
- a decision naming the parent's current bytes supersedes a row stale by provenance or by cut version, and the old row is kept whole in `superseded` with the event that replaced it;
- a rejection withdraws a stale row;
- a renewal naming other bytes or none is refused;
- provenance fails closed without the current bytes;
- a current approval is refused as before;
- reruns are skipped and the file is idempotent;
- a chain of renewals is kept in order;
- the validator's check reads a renewed file as one current row;
- the command reads the parents' current bytes from the built content."
