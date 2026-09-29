# Q65b — Q65a finished: the two shared frame helpers bounded by the union of their importing screens' browser sets, with a drift test that discovers the importers and proves the union holds; the universal paths keep the whole suite and the unit suite stays whole, as ruled

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/responses/3c661d4.md` in full (the Q65a review: the required change; the universal paths keep the whole suite; the unit suite stays whole; the content-suite audit, Q69 and the `docs/08` additions are later waves; the prune line); `docs/prompts/entry-120.md` (Q65a: table 1's rows for `screenFrame.ts` and `subScreen.ts`, the importer counts, the derivation aid under `runs/Q65a/scripts/`); `docs/prompts/checks.json` at the two rows and at every `app/src/ui/screens/*` row; `tools/content/tests/test_checks_for_paths.py` (`TheMinimumSemantics`, the helper-reader drift test Q65a added for `scoreControls.ts` and the fixtures — the pattern to follow); `tools/docs/checks_for_paths.py` (the union; unchanged unless it must be).

## The goal, in the orchestrator's words

Q65a left two rows whole by judgement: the frame eleven screens are drawn in and the chrome twelve pushed sub-screens share. Their reach is known, so the map's own rule — the smallest set that discriminates what the changed path reaches — says their check is the union of what those screens' rows name, not the whole suite. And a union kept by hand drifts the day a new screen imports the helper; the test that discovers the importers is what keeps it true.

## What is decided

1. **The union, computed and committed.** For each helper, the set of browser specs is the union of the `e2e` lists of the map rows matching each screen file that imports it (`app/src/ui/screens/*.ts`, discovered by import statements, as Q65a's importer script does), plus the universal guards the `app/src/**` row already gives. The committed row names that union explicitly (sorted, deduplicated) with the reason stating the importers by name. If the union equals the whole default suite, the row keeps `"*"` and its reason says the union was computed and is the whole suite.
2. **The drift test.** In `test_checks_for_paths.py`: discover each helper's importing screens from the source at test time; for each importer, take the map's `e2e` set for that file; assert the helper's committed set contains every one of them (and, where the helper's row is `"*"`, that the union is indeed the whole suite or the row says why). A new importer with a mapped set the helper's row lacks makes the test red with the file named.
3. **The reader unchanged** unless a helper's row needs a form it cannot read (say why). `test_ci_order`'s superset case stays green.
4. **Nothing else moves:** the universal rows (`router.ts`, `main.ts`, `app/src/app/**`, `AppShell.ts`, `style.css`, the Playwright harness, the package and config entry points, the icons step) keep the whole suite as ruled; the unit suite stays whole on app code; the content-suite audit (Q70), the chain guard at the source (Q69) and the `docs/08` additions stay recorded for their own seams.
5. **The prune:** any hand-maintained list of the frames' screens elsewhere in the map or its tests goes once the union test owns it (the reviewer's prune line); say what was removed.

## Verification layers

Python unit, red first: the drift test red on the committed map for both helpers (their rows are `"*"` while the computed union is not, or the assertion form is missing); green after; a mutant that drops one screen's spec from a helper's row is caught. `test_ci_order` green throughout. The reader on the two helper paths as the product look (the named lists). No browser run (tooling); no content build needed (the map and its test only; if `test_checks_for_paths` needs the built content for a case, copy `app/public/content` from the main checkout and say so).

## Rules and files

You own `docs/prompts/checks.json` at the two rows (and any hand list item 5 removes), `tools/content/tests/test_checks_for_paths.py`, `tools/docs/checks_for_paths.py` only if it must change. Not `ci.yml`, not `docs/08`, not any other builder's files. Never name an AI model. Never assert a number measured on this machine. Every change red first; no commits, pushes, stashes or checkouts.

## Sequencing

A narrow tooling fix-forward under Q65a's accepted contract (788427c): dispatched on the reviewer's required change with a for-information line; the post-build review closes Q65 and the map stops being advisory.

## When to deviate

If a screen's own row is missing from the map (an importer with no `e2e` set of its own), do not invent one: the helper's union takes the whole suite for that importer, the test says which file, and the entry records it as a finding for the map's owner.

## Report

Judgement first: what the map now says for a change to `screenFrame.ts` and to `subScreen.ts`, as the reader's output; then Done / Not done / Follow-ups / Questions / Files; the importers table per helper; the red lines; the tests table; exit codes; unverified beside what passes.
