### Entry 164 — E51a — the map names the merge's one browser consumer, and the committed file says what its format holds: `tools/content/excerpts.py` and `content/sources/excerpts.json` each gain an e2e-only row naming `excerpts.spec.ts`, and the committed `_comment` gains the three `superseded` lines `COMMENT` already carries; no approval renewed, no decision merged, the built catalogue byte-identical (the E51 review's two required changes, `responses/dffa9c34.md`, and the reviewer's second row, `responses/questions-bbd7f99a.md`; 2026-09-29)

**Base.** Origin's head at dispatch, `c5988012`, which holds E51 and this brief with the reviewer's second row folded in. Nothing committed, staged or stashed; the orchestrator commits the named files.

**Judgement.**
- **The map, before and after.** `python tools/docs/checks_for_paths.py tools/content/excerpts.py` printed six lines before, all from `tools/content/*.py`: the content build, the validator, the review check, the whole content suite, the whole unit suite and the app build, and no browser spec. After, it matches `tools/content/*.py, tools/content/excerpts.py` and prints the same six lines plus one: `e2e<TAB>app<TAB>npx playwright test tests/e2e/excerpts.spec.ts --workers=4`. For `content/sources/excerpts.json`, the e2e line went from `tests/e2e/library.spec.ts` to `tests/e2e/excerpts.spec.ts tests/e2e/library.spec.ts`; the six other lines are unchanged (`red-on-committed.txt`, `green-unit.txt`).
- **The committed `_comment`'s three new strings**, after the `rejected` line and before the empty string, character for character from `excerpts.py`'s `COMMENT`:
  - "`superseded` (written once there is one) keeps each approval a person re-decided after it went stale, by",
  - "parent bytes or by cut version: the old row as it was, with `supersededBy`, the event that replaced it. A",
  - "renewal names the parent's current bytes and is merged under the cutter in force; nothing renews by itself."
- **`excerpts.spec.ts` on E51's merge, its first run since E51: passed.** The merge case (`excerpts.spec.ts:98`, the export merged at :130 and asserted at :131–137) passed with the other three, on port 4553, two workers (`e2e.txt`). It merged into a copy of the spliced committed file, so the rerun's byte check held on the 22-string comment too. No E51 finding.
- **The catalogue.** The sha256 of `app/public/content/catalog.json` was `e0842d0dc5601eee6c3df6478aa8f8a95a1104f42b8640bc6264a51b79c72278` after the setup build on the base and the same after the map's build: equal. The build's 13 warning lines are equal too (`chain.txt`). The comment leaves the built content unchanged, as predicted.
- **One finding that is not E51a's leads the follow-ups.** `transferOffer.test.ts`'s G1e case is red alone on this base with this build. E51a's diff cannot reach it (`vitest.txt`); the orchestrator decides where it goes.

**The product layer.** Nothing shows on a screen and nothing is heard. A person who opens `content/sources/excerpts.json` now reads the format the file can hold, `superseded` included. I read the three lines in the file as it now stands. No boundary was judged.

**Hypotheses (item 8), each tested.**
- (a) `tools/content/excerpts.py` matched only the folder row, so the map named no browser spec for it. It held: the new case was red on the committed map at `e2e_names`' *one e2e command naming its specs* (0 against 1).
- (b) The committed comment differed from `COMMENT` by exactly the three strings, and nothing but the merge reads it. It held. The new case was red at element 16, with 19 strings against 22. The committed list equals `COMMENT` with elements 16–18 removed (measured). The catalogue's sha256 did not move.

## Done

- **Technical verdict.** The map runs the one browser spec that drives the merge when `excerpts.py` or the committed definitions change, never the whole suite. The committed file states its own format. Both changes are text splices: `checks.json` reads `2 0`, `excerpts.json` `3 0`, and each file with its added lines removed equals the base's blob (`identity.py`). No row, decision or built byte moved.
- **Pedagogical verdict.** Not applicable to a test map and a format comment. The five boundaries remain *by rule, unheard; unverified as music*. All five are still stale by cut version (the validator's five warnings, `chain.txt`), and none was re-decided.

Item by item:
1. **The policy and the goal.** Exactly the two required changes, plus the second map row the reviewer folded in. Nothing else was edited outside the run folder.
2. **The map rows.** Both are e2e-only, spliced as text, one line each (`splice.py`; a rerun changes nothing).
   - `{"pattern": "tools/content/excerpts.py", "checks": {"e2e": ["tests/e2e/excerpts.spec.ts"]}, "reason": "the merge's browser consumer: excerpts.spec.ts runs excerpts.py --merge into a copy of the committed definitions and asserts its summary line (docs/08's excerpt row and the spec's file line; the E51 review's required change, docs/review/responses/dffa9c34.md); the folder row gives the rest"}` goes after `tools/content/*.py` (base :145).
   - `{"pattern": "content/sources/excerpts.json", "checks": {"e2e": ["tests/e2e/excerpts.spec.ts"]}, "reason": "the definitions the merge's browser consumer reads: excerpts.spec.ts copies this file and merges an exported approval into the copy, asserting the summary line and, on a rerun, the copy's bytes unchanged (docs/08's excerpt row and the spec's file line; the reviewer's word on E51a, docs/review/responses/questions-bbd7f99a.md); the content/** and content/sources/** rows give the rest"}` goes after `content/sources/**` (base :140).
   - **Placement, my choice.** The brief put the second row "beside the first". I placed each row after its own folder's row instead, which is the map's convention for a file's own row (`tools/midi-cleanup/**` then `midi_to_musicxml.py`), so a reader scanning the `content/` block finds it. The reader sorts spec names and takes the union, so the output is the same either way, and `git diff --numstat` reads `2 0` either way.
3. **Red first, the map.** One case in `TheMinimumSemantics`, after the score-model case (base :305–310).
   - It asserts four things: `e2e_names("tools/content/excerpts.py") == ["excerpts.spec.ts"]`; the six folder checks are still named for the file; `tools/content/build.py` names no `e2e`; and `e2e_names("content/sources/excerpts.json") == ["excerpts.spec.ts", "library.spec.ts"]`.
   - It was red on the committed map, then green.
   - Three mutants, each caught at its predicted line, with the file restored and checked by sha256 after each (`mutants.txt`, `mutants.py`):
     - the spec on the folder row instead: red at the `build.py` line;
     - `"e2e": "*"` on the new row: red at the whole-suite assertion;
     - the second row omitted: red at the last assertion.
4. **The comment.** Three strings spliced after the `rejected` line at four spaces, each with a trailing comma, CRLF like the rest of the working file.
   - No `superseded` key was written, no row was renewed and no decision was merged.
   - `excerpts` (5 rows) and `rejected` (17 rows) equal the base's as data, and byte for byte by the removal check.
   - The round-trip `test_the_committed_file_is_the_merges_own_serialisation` stays green unedited, so the splice is the serialiser's own form.
5. **Red first, the comment.** One case in `TheMerge`, after the round-trip: `X.read_definitions()["_comment"] == X.COMMENT`, skipped when the file is absent. It was red on the committed file, then green. It stays as the guard: the merge keeps a stored comment, so a later change to `COMMENT` goes red here until the file follows it.
6. **Consumers.** I grepped the readers of `content/sources/excerpts.json` in `tools/`, `app/src`, `app/tests` and `app/scripts`, and the readers of `_comment` in `tools/content`, `app/src` and `app/tests`.
   - `_comment` is read only by `merge_text` (which keeps it), `serialise_definitions` and the two `TheMerge` cases.
   - `validate.py:1007` and `test_measured_truth.py:418` read `excerpts` only.
   - `build.py` names the file in provenance strings.
   - No `app/src` file reads it.
   - The catalogue's sha256 is equal before and after.
7. **Not E51a's, untouched.** `merge_text` and the rest of `excerpts.py`, including the module header at :12–18, which is E51's recorded not-done. Also untouched: every decision on the five approvals, a rejection of a current approval (the reviewer's "E53"), the workbench, `excerpts.spec.ts`, the `content/sources/**` row itself, `validate.py`, `review.py`, `docs/03`, `docs/08` and `app/**`.
8. **The hypotheses.** Both held (above). `excerpts.spec.ts`'s merge case passed. No failure occurred in either spec, so nothing needed rerunning or attributing there.
- **The seven checks the map names, in its order** (`chain.txt`):
  - the content build: 0;
  - the validator: 0;
  - the review check: 0;
  - the whole content suite: 0, 1534 tests, 4 skipped;
  - the whole unit suite: 1, three failing cases, each file rerun alone and attributed (`vitest.txt`);
  - the app build: 0;
  - `excerpts.spec.ts` with `library.spec.ts`: 0, 19 passed.

## Not done

- **None of the five stale approvals was renewed, rejected or re-decided** (by the brief and the review). They stay stale by cut version.
- **`transferOffer.test.ts`'s failing case was not fixed or investigated beyond attribution.** It is outside E51a's files (follow-up 1).
- **`docs/08` was not edited.** Its rows are under `

**Orchestrator's note at the landing (2026-09-29).** E51a's worktree committed by name (70043128) and merged (7d7d1e9c). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/E51a/map-min.txt`), the content build offline (the reports compared), the validator, the record check, the whole content suite, then the app steps the map names — the whole unit suite on the rebuilt content, the app build, and the specs the map's minimum names where it names any (map-tests 0; map-min 0; content-build 0; content-validate 0; review-check 0; content-tests 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0; vitest-load-rerun 1 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; the other failures were the machine's load — timeouts — and those files pass alone (`vitest-load-rerun`, the recorded pair apart); `runs/E51a/orchestrator-exit.txt`). Your two required changes on E51 (`responses/dffa9c34.md`) and your approval of the brief with the second row folded in (`responses/questions-bbd7f99a.md`). Landed alone: the content build, validator, record check and content suite; the unit suite red on the recorded pair and thirteen load cases across nine files (three builders running; five 5-second timeouts and timing assertions) that pass alone (`vitest-load-rerun`, 358 of 360 with the pair); the app build; the two specs the map names for `content/sources/excerpts.json` — `excerpts.spec.ts`, named by this seam's own row for the first time, and `library.spec.ts` — 19 passed.

## Doc rows` for the orchestrator.
- **Nothing was heard, and no boundary or workbench route was driven** beyond what `excerpts.spec.ts` drives.
- **CI has not run this tree.**

## Follow-ups

1. **A finding, not E51a's: `transferOffer.test.ts` › *a transfer candidate the learner paused or put away is not offered (G1e)* › *offered with no project…* is red alone.**
   - `:431` expects `song.pentatonic-a` (the A pentatonic remade as a song) to be the offer and gets `exercise.pentatonic.d.pentatonic`.
   - It is deterministic: red in the whole run and alone.
   - It is not E51a's. The test reads `app/src` and the built catalogue. E51a changes no app file, the catalogue's sha256 is equal before and after, and it equals the main checkout's built catalogue (read-only).
   - **Hypothesis, not tested.** G1e (`8e640ee6`) is not an ancestor of L120b's implementation HEAD (`c8680b70`, checked with `git merge-base --is-ancestor`), so L120b's builder never ran this case; they met at the merge `4ccb7927`. L120b's record says its gate change makes the D pentatonic the next transfer offer in this file's constructed learner (`runs/L120b/ENTRY.md:22`), and G1e's case still expects the A pentatonic song.
   - The test that would tell: the case at G1e's landing against the same case at `4ccb7927`, each on its own build. If L120b's gate is the cause, the fix is G1e's case or its constructed learner, not the gate.
   - Proposed: P0 until classified (a red case on origin's head); owner G1e/L120b.
2. **The `content/sources/**` row and `excerpts.spec.ts`: resolved here, recorded.** The brief's item 7 said to leave this mapping as a follow-up. The reviewer's word folded it in as the second row, so it landed. The folder row still names `library.spec.ts` alone and the union gives both. The map's other rows for `content/**` were not surveyed for further direct consumers.
3. **No E51 finding from the spec.** The merge case passed on E51's merge.
4. **A harness note for later config copies.** In a Playwright config kept outside `app/`, `use.storageState` resolved against the working directory (`app/`), not the config's folder, although the brief assumed the config's folder. `testDir` and the fixture import did resolve from the config's folder, with `NODE_PATH` set to `app/node_modules`. The first attempt failed all 19 tests before a page opened; an absolute path fixed it (`e2e.txt`). Proposed: P3, process (brief templates).
5. **Still open from E51:** the module header at `excerpts.py:12–18`, which names `rejected` alone (E51's not-done).

## Questions

None blocking. Follow-up 1 needs an owner.

## Deviations from the brief, each with its reason

- **Port 4553, not 4623.** This is the orchestrator's instruction at dispatch.
- **The browser run covered both specs the map's seventh line names**, `excerpts.spec.ts` and `library.spec.ts`, in one invocation, once. An earlier attempt ran no test body (follow-up 4).
- **The config copy loaded from `build/e51a/`**, with `NODE_PATH` set to `app/node_modules`, so no copy went into `app/`.
- **The second map row sits after its folder's row** (item 2).
- **The two test files were edited while the setup build ran.** `build.py` reads neither test file (grep). The two data files were edited only after that build finished, so the catalogue's "before" is the base's data.

## Files

- **Changed:**
  - `docs/prompts/checks.json`: two rows;
  - `content/sources/excerpts.json`: three strings in `_comment`;
  - `tools/content/tests/test_checks_for_paths.py`: one case in `TheMinimumSemantics`;
  - `tools/content/tests/test_excerpts.py`: one case in `TheMerge`.
- **Added:**
  - `docs/prompts/runs/E51a/ENTRY.md`;
  - `splice.py`, `identity.py`, `mutants.py`;
  - `red-on-committed.txt`, `green-unit.txt`, `mutants.txt`, `chain.txt`, `vitest.txt`, `e2e.txt`, `restore.txt`.
- **Build side effects, restored:** the builds rewrote `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md`, and both were copied back from the snapshot taken before the first build. `content/scores/imported/SOURCES.md` was not rewritten. The validator regenerated the views with 0 stale, and `git status` shows none of these changed (`restore.txt`).
- **Deleted at the end:** `content/scores/imported/{kern,musetrainer,mutopia}` and `build/cache`, which were copied read-only from the main checkout; `app/dist`; `app/node_modules`; the config copy and its test results under `build/e51a/`. The full vitest and build captures were not kept; the summaries and failing names are in `chain.txt` and `vitest.txt` (`restore.txt`).

## The red lines

- `tools/content/tests/test_checks_for_paths.py:229` (`e2e_names`, from :318), on the committed map: `AssertionError: 0 != 1 : ('tools/content/excerpts.py',): one e2e command naming its specs`.
- `tools/content/tests/test_excerpts.py:421`, on the committed file: `Lists differ … First differing element 16: '' / '`superseded` (written once there is one) [59 chars], by' … Second list contains 3 additional elements.`
- The mutants (`mutants.txt`):
  1. the spec on the folder row, at :322: `'e2e' unexpectedly found in [...] : the spec is the merge's, not every pipeline module's`;
  2. `"e2e": "*"` on the new row, at :227 in `e2e_names`: `('e2e', 'app', 'npx playwright test --workers=4') unexpectedly found in [...]`;
  3. the second row omitted, at :324: `Lists differ: ['library.spec.ts'] != ['excerpts.spec.ts', 'library.spec.ts']`.

## Tests

| Test | Class | The old assumption | Committed | After |
| --- | --- | --- | --- | --- |
| `test_checks_for_paths.py` › `TheMinimumSemantics` › `test_the_merge_and_its_definitions_name_the_merge_s_browser_spec` | add | the folder row covers `excerpts.py`, its browser specs left to the builder; `content/sources/excerpts.json` reaches `library.spec.ts` alone | red (:229 via :318) | green; three mutants red |
| `test_excerpts.py` › `TheMerge` › `test_the_committed_file_says_what_its_format_holds` | add | the committed comment may lag `COMMENT` until a renewal rewrites it (none would, since the merge keeps the stored comment) | red (:421) | green |
| `test_excerpts.py` › `TheMerge` › `test_the_committed_file_is_the_merges_own_serialisation` | preserve, unedited | — | green | green (the splice is the serialiser's own form) |
| `app/tests/e2e/excerpts.spec.ts` (4 tests) | preserve | — | not run since E51 | green, port 4553, two workers |
| `app/tests/e2e/library.spec.ts` (15 tests) | preserve | — | — | green, same run |

## Exit codes (the last line of each capture)

| Command | Exit | Note |
| --- | --- | --- |
| `npm ci` (app/, setup) | 0 | — |
| `python tools/midi-cleanup/tests/parity_reference.py` (setup) | 0 | — |
| `python tools/content/build.py --offline` (setup, on the base, before any data edit) | 0 | the catalogue's "before" |
| the two new cases on the committed map and file | 1 | red as predicted (`red-on-committed.txt`) |
| `python -m unittest tools.content.tests.test_checks_for_paths tools.content.tests.test_excerpts` | 0 | 78 tests (`green-unit.txt`) |
| `python docs/prompts/runs/E51a/identity.py` | 0 | `green-unit.txt` |
| `python docs/prompts/runs/E51a/mutants.py` | 0 | three caught, restored by sha256 |
| `python tools/docs/checks_for_paths.py …` (before, after, final paths) | 0 | `red-on-committed.txt`, `green-unit.txt` |
| `python tools/content/build.py --offline` | 0 | catalogue sha256 equal |
| `python tools/content/validate.py --allow-nc --personal` | 0 | five stale-by-cut-version warnings, as before |
| `python tools/content/review.py --check` | 0 | — |
| `python -m unittest discover -s tools/content/tests -t tools/content` | 0 | 1534 tests, 4 skipped |
| `npx vitest run` | 1 | the recorded `lessonClaimsAboutApp` pair (Entry 101) and `transferOffer`'s G1e case, each red alone (`vitest.txt`) |
| `npx vitest run tests/unit/transferOffer.test.ts tests/unit/lessonClaimsAboutApp.test.ts` | 1 | the same three, alone |
| `npm run build:app` | 0 | — |
| `npx playwright test … excerpts.spec.ts library.spec.ts --workers=2` (port 4553), attempt 1 | 1 | harness: the storage path, no test body ran |
| the same, the run | 0 | 19 passed (`e2e.txt`) |

**Unverified beside what passes:** CI on this tree; the full browser suite (the map names two specs, and the reviewer ruled out the whole suite); the workbench route to the five stored ranges; anything heard.

## Doc rows

Written against E51's pending rows (`entry-159.md` `## Doc rows`, not yet in `docs/08` at `c5988012`). Line numbers are at `c5988012`.

**`docs/08` line 39, the excerpt row, the status column.** After E51's pending *"; E51 (Entry 159): the merge renews or withdraws a stale approval; none of the five re-decided"*, append: "; E51a (Entry 164): the committed `_comment` states the `superseded` format, and the checks map runs `excerpts.spec.ts` for `tools/content/excerpts.py` and `content/sources/excerpts.json`". The tests column already names `tests/e2e/excerpts.spec.ts` for the merge, so it needs no change.

**`docs/08` line 711, `test_checks_for_paths.py`.** Before the closing sentence naming the mutant scripts, insert: "Since E51a, `tools/content/excerpts.py` names `excerpts.spec.ts` alone, the smallest spec and never the whole suite, beside the six checks its folder row gives, while `tools/content/build.py` names no browser spec; `content/sources/excerpts.json` names `excerpts.spec.ts` and `library.spec.ts`." Then extend the closing sentence with "and `docs/prompts/runs/E51a/mutants.py`".

**`docs/08` line 721, `test_excerpts.py`.** After E51's pending `TheRenewal` addition, append: "Since E51a, the committed file's `_comment` equals `COMMENT`: the merge keeps a stored comment, so a change to the format's description is red until the committed file follows it in the same change."
