# Doc-splice — six landed entries' doc rows spliced into the specs they name, each row checked against the code at HEAD before it goes in, each splice a tight insertion at the named section with the entry beside it, nothing invented, what the code no longer matches recorded instead of spliced

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13 (the specs serve the code: when the implementation makes more sense, the spec changes with the reason beside it); `docs/prompts/working-rules.md` (the evidence rules); the six entries' doc-row sections: `docs/prompts/entry-109.md` from "## Doc rows" (D4a: `docs/04` §2, `docs/08`), `entry-112.md` from "## Doc rows" (G1: `docs/01` §4.5, `docs/08`; its `docs/04` rows were spliced by G1's builder, verify), `entry-113.md` from "## Doc rows" (Q47: `docs/08`), `entry-114.md` from "**Doc rows**" (U74: `docs/04` §5, `docs/08`), `entry-115.md` from "**Doc rows**" (E-tail: `docs/03` §4a and §4c, `docs/08`), `entry-116.md` (Q-tooling: `docs/08`'s CI paragraph and the lines for `test_ci_order.py` and `test_prompt_views.py`; note that the views step moved from `build.py` to `validate.py`'s last step — the row must say what the code does).

## The goal, in the orchestrator's words

Six seams landed this week with their spec rows written into their entries because another builder held the file. The specs are a debugging aid for the next reader and the reviewer reads `docs/08` as the test map; a row that lives only in an entry is a row nobody finds. Every row goes where its entry says, once, worded as the entry wrote it unless the code at HEAD says otherwise — and then the code wins and the entry's wording is corrected in the spec with a line saying why.

## What is decided

1. **Each row checked before it is spliced.** For every row: open the code the row describes at HEAD (the function, the field, the test file), confirm the row is true there, then splice. Where the code differs (Q-tooling's views step is the known case), write the row as the code is and note the difference in the entry's table (item 4). Where a row describes something the code no longer has, do not splice it; record it.
2. **Each splice tight.** An insertion at the named section — a sentence, a bullet or a table row in the file's own voice and format — never a rewrite of surrounding text, never a reformat (the `diff-growth` hook warns at 150 removed lines; a doc splice removes none). The entry number in parentheses at the end of the inserted text, as the files already do ("(G1, 2026-09-29)").
3. **`docs/08` rows** go into the table or list the entry names (the seam row in the state-machine table; the spec-file lines under the file list; the unit-file lines), in the file's existing order. Where a row names a spec or unit file, confirm the file exists at HEAD.
4. **Idempotence.** Before each splice, search the target file for the row's key phrase; a row already present (G1's `docs/04` rows; anything an earlier record spliced) is left alone and listed as "already present".
5. **The entry's table.** `docs/prompts/runs/Doc-splice/ENTRY.md`: one row per doc row — entry, target file and section, spliced / already present / not spliced, and the reason where not verbatim.
6. **Not this seam's:** any row from a seam still building (G1a, Q65a, F2a, X3: their rows come with their landings); any spec sentence the rows do not name; `docs/02` (F2a's); `docs/prompts/*`; the code.

## Verification layers

`npx vitest run tests/unit/docsConsistency.test.ts` from `app/` (the documents against the code: `docs/00`, `docs/03`, `docs/04` headings); `python tools/content/validate.py --allow-nc --personal` from the root after `python tools/content/build.py --offline` (if the offline build cannot produce `app/public/content`, copy that folder from `C:\Users\yalir\repos\Piano Stuff\PianoProject\app\public\content` and say so); `git diff --stat` showing insertions only, or a removal explained per line. No browser, no pictures.

## Rules and files

You own `docs/01-architecture.md`, `docs/03-content-pipeline.md`, `docs/04-ui-spec.md` and `docs/08-test-map.md` at the named sections only. X3 owns one line of `docs/03` (the import sheet): keep every `docs/03` insertion inside §4a and §4c and say the line numbers in the entry so a merge conflict can be settled. Not the entries (read only), not the code, not `docs/02`, not `docs/00`. Never name an AI model. Never assert a number measured on this machine. No commits, pushes, stashes or checkouts — report the files and the orchestrator commits by name.

## When to deviate

If a row cannot be verified because the code it names is not at HEAD (renamed, moved), search for the new name; if none, do not splice and say so. If a section the entry names does not exist under that number (Entry 114 notes `docs/04` §4 is §5 in the file), use the section whose heading matches the content and say so.

## Report

Judgement first: which rows the code contradicted and how the spec now reads there, as observations; then Done / Not done / Follow-ups / Questions / Files; the table of item 5; exit codes; unverified beside anything not checked at the code.
