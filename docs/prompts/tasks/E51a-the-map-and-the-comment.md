# E51a — The map names the merge's one browser consumer, and the committed file says what its format holds: `tools/content/excerpts.py` maps to `excerpts.spec.ts` alone, and `content/sources/excerpts.json`'s `_comment` gains the three `superseded` lines `COMMENT` already carries, with no row renewed and no decision merged (the E51 review's two required changes, `responses/dffa9c34.md`; Entry 164; a narrow fix-forward under 788427c, sent to the reviewer before dispatch; its builder starts only on the reviewer's word (the owner's rule of 2026-09-30: every brief reviewed first); the checks-map row is a test-map change the reviewer itself required)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/reviewer-context.md:144–150` (the policy: a narrow fix-forward proceeds from the accepted contract without another pre-build round). `docs/review/responses/dffa9c34.md` whole (on origin; `git show origin/claude/piano-teaching-app-bo19td:docs/review/responses/dffa9c34.md` if your tree predates it): the two required changes (:21–27 and :29–35, quoted in item 1), the current-approval rejection kept separate (:37–39), and *E51 closes* once both land (:41). `docs/review/handoffs/dffa9c34.md:11–13` (the questions that drew them); `docs/prompts/entry-159.md:81` (E51 ran no browser spec because the map named none) and :94–95 (its follow-ups 3 and 4, which are these two items).
- **The map.** `docs/prompts/checks.json`: a pattern row is one line, `{"pattern", "checks", "reason"}`. `checks` names ids from the `checks` list, each with `true`, `"*"` or a list of names (for `e2e`, spec paths relative to `app/`). Every pattern that matches a path contributes (the union; `:2`, the map's rule: a spec is named where `docs/08`'s file lines tie it to the module).
  - `tools/content/excerpts.py` today matches only `tools/content/*.py` (:145): the content build, the validator, the review check, the whole content suite, the whole unit suite and the app build; no browser spec. Its reason leaves a pipeline change's browser specs "the builder's to name".
  - The precedent for a file's own row after its folder's: `tools/midi-cleanup/**` (:156) and `tools/midi-cleanup/midi_to_musicxml.py` (:157). Also `content/**` (:136), `content/sources/**` (:140), the map's own row (:169).
  - `tools/docs/checks_for_paths.py:138–187` (`checks_for`) and :190–203 (`missing_names`).
  - `tools/content/tests/test_checks_for_paths.py`: `TheCommittedMap` (:121–153: every name exists, every pattern matches a tracked path, every row has a reason); `TheMinimumSemantics` (:211–399) and its `e2e_names` (:224–230, which fails on the whole suite and on anything but one `e2e` command).
- **The consumer.** `app/tests/e2e/excerpts.spec.ts:124–137`. It copies the committed `content/sources/excerpts.json` into a temporary folder (:125–128) and runs `tools/content/excerpts.py --merge <export> --definitions <copy> --content app/public/content` (:130, through `python()` at :62–67). It asserts exit 0 and `appended 1` (:131–132), then reruns and asserts exit 0, `appended 0, already in the file 1` and the copy's bytes unchanged (:134–137). The line it reads is printed by `excerpts.py:990–991` (`Merged <file>: appended N, already in the file M, refused K.`). `docs/08-test-map.md:39` (the excerpt row names `tests/e2e/excerpts.spec.ts` for the merge) and :253 (the spec's file line: the exported approval "accepted by `tools/content/excerpts.py --merge`").
- **The comment.** `tools/content/excerpts.py:132–155` (`COMMENT`; the three `superseded` lines E51 added at :149–151); :158–165 (`read_definitions`); :168–177 (`serialise_definitions`: `_comment` is the data's own, `COMMENT` only when absent, :173); :851 (`merge_text` keeps the stored comment). `content/sources/excerpts.json:2–22` (`_comment`: nineteen strings, `COMMENT` as it was before E51). `tools/content/tests/test_excerpts.py`: `TheMerge` (:349–412) and its round-trip `test_the_committed_file_is_the_merges_own_serialisation` (:407–412, which serialises the file's own comment).

## What is decided

1. **The policy and the goal.** The E51 review approved the renewal mechanism and required two changes. This lane makes exactly those two: a narrow fix-forward under the concurrency policy of 788427c (`reviewer-context.md:150`), sent to the reviewer before dispatch; its builder starts only on the reviewer's word (the owner's rule of 2026-09-30: every brief reviewed first). The checks-map row is a test-map change, the class that goes to the reviewer before a push. This one is the reviewer's own required change, and the handoff quotes the row as built. The reviewer's words, verbatim (`responses/dffa9c34.md:21–35`):

   > ### Required change 1: test map
   >
   > Add `app/tests/e2e/excerpts.spec.ts` to the checks-map coverage for changes to the merge path in `tools/content/excerpts.py`.
   >
   > That browser test actually exercises `--merge` and asserts its summary. A path-to-check map that omits a known behavioral consumer is incomplete. This is exactly the kind of omission the map exists to prevent.
   >
   > Do not add the whole browser suite; add the smallest specific existing spec.
   >
   > ### Required change 2: committed format comment
   >
   > Land the new `superseded` format explanation in the committed `content/sources/excerpts.json` `_comment` now.
   >
   > Do not wait for the first real renewal to incidentally rewrite the file's explanatory comment. The persisted format has already changed; its committed self-description should change with it.
   >
   > This is documentation/schema truth only. Do **not** renew any of the five stale approvals merely to make the comment appear.

   Mine: a change to the merge runs the one browser test that drives the merge, and a person who opens the committed definitions reads the format the file can now hold. No approval, decision or built byte moves.
2. **The map row.** One line inserted after `checks.json:145`, spliced as text (the file is hand-formatted, one row per line; never re-serialised). The file is otherwise byte-identical: `git diff --numstat` reads `1 0`. The row: `{"pattern": "tools/content/excerpts.py", "checks": {"e2e": ["tests/e2e/excerpts.spec.ts"]}, "reason": "…"}`. The reason, in these words or better: *the merge's browser consumer: excerpts.spec.ts runs excerpts.py --merge into a copy of the committed definitions and asserts its summary line (docs/08's excerpt row and the spec's file line; the E51 review's required change, responses/dffa9c34.md); the folder row gives the rest*.
   - The row carries `e2e` only. The union already gives the file the six checks of :145, and the new row never replaces that row.
   - **A second row, folded in on the reviewer's word** (`responses/questions-bbd7f99a.md`: *leaving a known direct consumer unmapped would knowingly ship the same class of defect one line away*): `content/sources/excerpts.json` is itself copied and read by `excerpts.spec.ts` (:125–128), so a row `{"pattern": "content/sources/excerpts.json", "checks": {"e2e": ["tests/e2e/excerpts.spec.ts"]}, "reason": "…"}` goes beside the first, e2e only; the `content/sources/**` row (:140, `library.spec.ts`) stays and the union gives both. `git diff --numstat` then reads `2 0`.
   - Why the map missed the spec: its rule names a spec where `docs/08`'s file lines tie it to the module (:2), and `docs/08:253` does; the folder row left pipeline specs to the builder, and E51's builder ran none.
   - Checked at drafting: `excerpts.spec.ts` runs `--merge` at :130 and asserts on its summary line at :132 (`appended 1`) and :136 (`appended 0, already in the file 1`).
3. **Red first, the map** (`TheMinimumSemantics`, one case beside :305–310's):
   - `self.assertEqual(self.e2e_names("tools/content/excerpts.py"), ["excerpts.spec.ts"])`: the smallest spec and no other, never the whole suite;
   - the six checks of :145 still named for it;
   - `tools/content/build.py` still names no `e2e` (the row is the file's own, not the folder's).
   - `self.e2e_names("content/sources/excerpts.json")` gives `["excerpts.spec.ts", "library.spec.ts"]` in the map's order (the second row plus the folder row's spec), red on the committed map at the missing `excerpts.spec.ts`; a third mutant: the second row omitted.

   Red on the committed map at `e2e_names`' *one e2e command naming its specs*, since there is no `e2e` line today. Two mutants, each restored by sha256: the spec added to the `tools/content/*.py` row instead (red at the `build.py` line), and `"e2e": "*"` on the new row (red at `e2e_names`' whole-suite assertion). Capture `python tools/docs/checks_for_paths.py tools/content/excerpts.py` before and after. After, it prints one more line: `e2e<TAB>app<TAB>npx playwright test tests/e2e/excerpts.spec.ts --workers=4`.
4. **The comment.** Insert the three strings of `excerpts.py:149–151`, character for character, after `content/sources/excerpts.json:18` (the `rejected` line) and before the empty string at :19. Each goes at four spaces with a trailing comma, spliced as text. Nothing else in the file moves:
   - no row renewed and no decision merged;
   - no `superseded` key written (the serialiser writes it only when it holds a row, :175–176);
   - `excerpts` and `rejected` byte for byte: `git diff --numstat` reads `3 0`, and the file with those three lines removed equals the base's blob, line endings normalised.

   The round-trip (:407–412) stays green unedited. It serialised the file's own comment before and does after, so its staying green proves the splice is the serialiser's own form. If it goes red, the splice is wrong, not the test. The three strings:
   - "`superseded` (written once there is one) keeps each approval a person re-decided after it went stale, by",
   - "parent bytes or by cut version: the old row as it was, with `supersededBy`, the event that replaced it. A",
   - "renewal names the parent's current bytes and is merged under the cutter in force; nothing renews by itself.",
5. **Red first, the comment** (`TheMerge`, beside the round-trip): the committed file's `_comment` equals `COMMENT` (`X.read_definitions()["_comment"] == X.COMMENT`, skipped like the round-trip when the file is absent). Red on the committed file: nineteen strings against twenty-two, the first difference after the `rejected` line. The case stays as the guard. The merge keeps a stored comment (:851), so a later change to `COMMENT` goes red here until the file follows in the same change. That is the reviewer's *its committed self-description should change with it*.
6. **Consumers, read at drafting.**
   - Only `merge_text` (which keeps it, :851), `serialise_definitions` (:173) and the round-trip test read `_comment`.
   - `attach_excerpts` (:588 onward), `validate.excerpt_findings` (`validate.py:1007`) and `test_measured_truth.py:418` read `excerpts` only.
   - `DevExcerptView.ts` reads the proposer's projection, not this file; `excerpts.spec.ts:125–128` copies the file and merges into the copy.

   The prediction: the comment leaves the built catalogue unchanged. Take the sha256 of `app/public/content/catalog.json`, which carries every cut's identity, after the setup build on the base (run before any edit) and again after the map's build. They are equal. If they differ, say what differs and what reads it.
7. **Not E51a's.**
   - `merge_text` and the rest of `tools/content/excerpts.py`. Its `COMMENT` is already right, and its module header at :12–18, which names `rejected` alone, is E51's recorded not-done.
   - Any decision, renewal or rejection on the five stale approvals.
   - A rejection of a *current* approval (the reviewer's "E53", `responses/dffa9c34.md:37–39`, kept separate). It is not the backlog's E53 at `views/backlog/E.md:115`, which is a pre-E32 import's text tempo; the orchestrator resolves the name.
   - The workbench (`DevExcerptView.ts`, `excerpt_proposer.py`), and `excerpts.spec.ts` itself.
   - The `content/sources/**` row (:140). It names `library.spec.ts` only, although `excerpts.spec.ts:125–128` copies `content/sources/excerpts.json`. That is a second test-map question: record it as a follow-up for the reviewer, and do not add it. The reviewer scoped required change 1 to the merge path.
   - `validate.py`, `review.py`, `docs/03`, `docs/08` (doc rows in the entry only), `app/**`.
8. **The hypothesis, and when to deviate.** I hold two things:
   - (a) `tools/content/excerpts.py` matches only the folder row, so the map names no browser spec for it. Refuted if item 3's case is green on the committed map.
   - (b) The committed comment differs from `COMMENT` by exactly the three strings, and nothing but the merge reads it. Refuted if item 5's case shows any other difference, or if the catalogue's sha256 moves.

   If either is refuted, stop that item and report what the line shows. This is also the first run of `excerpts.spec.ts` since E51 changed `merge_text` (E51 ran none, `entry-159.md:81`). If its merge case fails, that is a finding on E51's merge: record the failing assertion and its line, leave `merge_text` alone and put the finding first in the report. The row and the comment still land. A failure elsewhere in either spec is rerun alone once and attributed, never inferred green.

## Verification layers

**Unit, red first.** Run the two new cases on the committed map and file before either edit (`runs/E51a/red-on-committed.txt`, with the red lines quoted). Then `python -m unittest tools.content.tests.test_checks_for_paths tools.content.tests.test_excerpts` must be green (`green-unit.txt`). Then the two map mutants (`mutants.txt`, with its script beside it).

**The map.** For the final changed paths, run `python tools/docs/checks_for_paths.py docs/prompts/checks.json content/sources/excerpts.json tools/content/tests/test_checks_for_paths.py tools/content/tests/test_excerpts.py`, adding any other path changed outside `docs/prompts/runs/`, and capture the output. At drafting it printed seven lines, not four: the content build, the validator, the review check and the whole content suite, then **the whole unit suite** and **the app build** (both from `content/**`, :136), and **`library.spec.ts`** (from `content/sources/**`, :140). Run every line it prints, in its order:
- `python tools/content/build.py --offline`;
- `python tools/content/validate.py --allow-nc --personal`;
- `python tools/content/review.py --check`;
- `python -m unittest discover -s tools/content/tests -t tools/content`;
- `npx vitest run`: attribute each failure and rerun it alone (the recorded `lessonClaimsAboutApp` pair, Entry 101; load timeouts); none is inferred green;
- `npm run build:app`.

**Browser, once,** at `--workers=2`, with each spec file checked to exist first:
- `tests/e2e/excerpts.spec.ts`: the new row's spec. E51a's diff does not include `excerpts.py`, so running it is judgement's addition. The spec also reads the committed file.
- `tests/e2e/library.spec.ts`: the map's.

Run them on port 4623 through a copy of `app/playwright.config.ts` kept under `build/e51a/`:
- `baseURL` and `webServer.url` on 4623;
- the server `npm run build:app && npx vite preview --port 4623 --strictPort` (the `preview` script pins 4173, `app/package.json:10`);
- `storageState`: the fixture with its origin re-keyed to 4623, under `build/e51a/`.

Playwright resolves `@playwright/test`, `testDir`, the fixture import and `storageState` from the config's folder. If it cannot load the copy from `build/e51a/`, copy it into `app/` for the run and remove it at once, as U96a did (`runs/U96a/ENTRY.md:92`). Nothing on port 4173.

**The product layer.** Nothing shows on a screen: a person reading `content/sources/excerpts.json` reads the `superseded` format. Nothing heard, no boundary judged.

## Rules and files

**Base.** Origin's head at dispatch, stated by the orchestrator. At drafting that was `fd16f8ed`, which holds E51's merge `6c858986`. The files named here are identical at both except `docs/08`, which carries other lanes' splices; its line numbers are read at `fd16f8ed`.

**You own:**
- `docs/prompts/checks.json`: the one row;
- `content/sources/excerpts.json`: the three strings in `_comment`, nothing else;
- `tools/content/tests/test_checks_for_paths.py`: one case in `TheMinimumSemantics`;
- `tools/content/tests/test_excerpts.py`: one case in `TheMerge`;
- `docs/prompts/runs/E51a/`;
- the `docs/08` lines in the entry's `## Doc rows`. Write them against E51's pending rows (`entry-159.md` `## Doc rows`, not yet in `docs/08` at the base). The `test_checks_for_paths.py` line (:711) and the `test_excerpts.py` line (:721) each gain the new case, and the excerpt row (:39) gains its status. The excerpt row lists the tests that prove it, not the checks, and already names `excerpts.spec.ts` for the merge, so the map needs no correction there.

**Not yours:** item 7's list.

**The rules.**
- Never name an AI model. Never assert a number measured on this machine.
- No commits, pushes, stashes, resets or checkouts. Never write in the main checkout. Temp state goes under the worktree's own gitignored `build/`.
- Fresh-worktree setup as E51's: `npm ci` in `app/`; `python tools/midi-cleanup/tests/parity_reference.py`; `python tools/content/build.py --offline` (Q24), with `content/scores/imported/{kern,musetrainer,mutopia}` and `build/cache` copied read-only from `C:\Users\yalir\repos\Piano Stuff\PianoProject`. If the build cannot produce `app/public/content`, copy that folder from the main checkout and say so. This setup build runs on the base before any edit, and it is item 6's before.
- Snapshot `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md` and `content/scores/imported/SOURCES.md` before the first build and restore them after the last; `git status` shows none of them.
- The disk is nearly full. When the run is over, delete the worktree's `app/dist`, `app/test-results` and `app/node_modules`, the copied caches (a copied `app/public/content` among them) and the config copy. Keep no log over 300 KB in the run folder: keep the summary and the failing names, and say the full log was not kept.
- Every item done, or an explicit not-done line.

## Report

**Judgement first:**
- what `checks_for_paths.py tools/content/excerpts.py` printed before and after;
- the committed `_comment`'s three new strings;
- whether `excerpts.spec.ts`'s merge case passed on E51's merge (its first run since E51);
- the catalogue's sha256 before and after, equal or not.

**Then** Done / Not done / Follow-ups (the `content/sources/**` row and `excerpts.spec.ts`; any E51 finding from the spec) / Questions / Files, with each decided item done or given an explicit not-done line. Then the red lines; the tests table, with each test's class (add, preserve) and the old assumption; exit codes; unverified beside what passes; and `## Doc rows`. State the technical and pedagogical verdicts separately. The pedagogical one is not applicable: the five boundaries remain by rule and unheard, unverified as music. `operating-procedure.md` §11 and §12 apply.

**Entry 164.** Every run file goes under `docs/prompts/runs/E51a/`, and the entry is `docs/prompts/runs/E51a/ENTRY.md`, starting `### Entry 164 — E51a`.

**Brief approved for dispatch 2026-09-30, the second map gap folded in** (`responses/questions-bbd7f99a.md`). Both checks-map rows name `app/tests/e2e/excerpts.spec.ts` — `tools/content/excerpts.py`'s, and `content/sources/excerpts.json`'s, which the spec copies and reads — e2e-specific, never the whole browser suite; the `superseded` lines spliced into the committed comment now, no approval renewed. Dispatched.

**Landed 2026-09-29** (Entry 164; 70043128, merged 7d7d1e9c); handoff `handoffs/70043128.md`.

**Accepted 2026-09-30** (`responses/70043128.md`, APPROVE). The two required repairs landed at the right boundaries: `tools/content/excerpts.py` now maps to the existing `excerpts.spec.ts` consumer rather than relying only on unit coverage; `content/sources/excerpts.json` maps to that same consumer while keeping the Library spec through the map's union semantics; the committed `_comment` describes `superseded` before any real renewal writes the key; no approval, rejection, cut or learner-facing catalogue row changed as collateral work. The map placement after each broader folder row is fine: what matters is the resolved minimum check set. The first run of `excerpts.spec.ts` against the E51 merge confirms the previously missing consumer is now exercised. The Playwright `storageState` note is a harness/template follow-up only, recorded in `operating-procedure.md` §11; it does not affect this seam's product or test-map contract. The load-red count's typo was already corrected at 125b0328 and does not affect the verdict. E51a closes E51. Closed.
