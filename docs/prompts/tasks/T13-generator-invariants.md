# T13 — Every generated exercise family checked as music, by invariant and by picture

**Read `docs/prompts/working-rules.md` first, then `docs/00-invariants.md`, then
`docs/pending-review.md` Entry 4 (the five faults found in one generator pass, four of
them by looking at the page), then the checklist in `CLAUDE.md` ("Before reporting any
piece of work"). A hook puts that checklist in front of you before your turn can end;
answer it honestly and say what it caught.**

## Why

`tools/content/generate_exercises.py` writes 1,183 exercises; 300 sit on rungs. The five
families written on 2026-09-18 were rendered and looked at, and five faults were found
before they shipped — a cell in the wrong mode, a left hand climbing above middle C on an
exercise about a hand that stays still, a docstring promising four bars over two, text
off the page, a flat fifth spelled as a sharp. No record in `docs/pending-review.md` or
`docs/decisions/` says the earlier families were looked at the same way (searched
2026-09-21 for "rendered", "looked at", "every family"). The owner has said he is not the
gate. So: invariants that a test runs, and one picture per family read by you.

## Part A — invariants, per family

For every maker in `generate_exercises.py` (list them; say how many), a test in
`tools/content/tests/test_generator_invariants.py` that asserts what that family
promises, read from its docstring, its plan entry and the lesson that offers it:

- **hand range**: the left hand stays in the register the family claims (below middle C
  for a bass figure; within a five-finger span for a position exercise; no leap wider
  than the family's stated span);
- **key**: the output's key signature and pitch classes match the key in the item's id
  and title; a cell named for a mode is in that mode in every key it is generated in;
- **length**: bar count equals what the docstring, title or plan entry says;
- **spelling**: chromatic notes are spelled by degree per the family's table (the blues
  scale's blue note is a raised fourth in every key — owner's rule);
- **text**: no text expression longer than the family's page width allows (read the
  render's width or set a character cap and say why);
- **rhythm**: a family that claims a rhythm (tresillo, clave, shuffle, swing pair) has that
  rhythm in the output, asserted on durations;
- **the docstring is true** (`working-rules` §2.17): where code and comment disagree, fix
  the comment and say so.

Proven red: for at least one invariant per family, name the mutation that made it fail.

## Part B — one picture per family

Render one item per family (the C or A version; `tools/content/render_check.py` or the
previews under `build/previews/` — read how they are made) and **look at the whole page,
not a crop** (`working-rules` §2.5). For each, one line:
`<family> | <item rendered> | <what the page shows: hands, range, bars, text> | OK / FAULT <what>`

## Then

Fix every fault you find in the generator, regenerate only what the fix changes, and say
which items changed and how (a diff of the built MusicXML, summarised). Do not re-level
anything and do not change any rung.

## Rules

- Files: `tools/content/generate_exercises.py`, `tools/content/tests/test_generator_invariants.py`,
  the generated exercise files the build writes (only through the generator), one
  appended entry in `docs/pending-review.md` (Entry 27: families counted, invariants per
  family, the picture table, faults fixed, items changed, what is unverified). Nothing
  under `app/`.
- The content build only once, at the end, if the generator changed; say if you ran it.
  No vitest, no Playwright, no port 4173 unless the render step needs it and the
  coordinator has said the port is free.
- Do not re-serialise any JSON file.
- Your scratch folder: `C:\Users\yalir\AppData\Local\Temp\claude\C--Users-yalir-repos-Piano-Stuff\26d8772b-b51d-4e51-bd51-20002e98bae1\scratchpad\T13\`.
- Never name an AI model anywhere you write. Commit nothing.
- Every family has a test and a picture line, or the entry names the ones that do not and
  why. Never stop silently.

## Final message to the coordinator

Families counted; invariants proven red per family; the picture table's FAULT rows; what
was fixed and which items changed; what is unverified.
