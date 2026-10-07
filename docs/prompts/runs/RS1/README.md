# RS1: Blues Riff in C, the two-staff teaching edition

Requirement `A7a1-bluesriff-restaff`. Brief `docs/prompts/runs/A7a1/brief-bluesriff-restaff.md`, under the ruling `docs/review/responses/a7a-lanes-landing.md` sections 12-14 (route (a); a frozen source-event fixture in CI instead of a committed raw member; tempo 96 defaulted). 2026-10-07. Nothing heard: every statement here is about notation and files, unverified as music.

## What landed

- `tools/content/pdmx/restaff.py`: the source-side part selection. It reads the raw member (refused unless its sha256 is `69d5bb7e…`), parses it with `convert.parse_source`, keeps the music21 parts `Riff` and `P1-Staff2`, removes `P1-Staff1` and `Drumset`, refuses any other part shape, and runs the unchanged `convert.normalise` and `write_mxl`. With `--freeze` it also writes the verifier's fixture from the raw bytes. No change to `convert.py`.
- `tools/content/pdmx/restaff_verify.py`: the checker (CK-7 extended), a raw MusicXML walk with the standard library only. `freeze` reads the raw member; `verify` reads an edition against the fixture.
- `content/scores/pdmx/Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.restaff.mxl`: the edition, sha256 `888da99d60de0af55b58398ad8e9f66d3257765e17913d46b086c56a8f0e6d5d`. The same bytes on two runs, and equal to the probe's scratch run (`../A7a1/h1_scratch.out`).
- `tools/content/tests/fixtures/restaff/Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.source-events.json`: the frozen source events, bound to the raw sha256, one event per line.
- `content/sources/pdmx.json`: one row, `song.blues.blues-riff-in-c.pdmx`, by the guarded text splice (`row.py`: 543 → 544 items, the bytes before the insertion unchanged, 86 lines added). It carries a `derivation` block, which `tools/content/import_pdmx.py` validates on every build (`validate_derivation`) and names in the item's edition notes.
- `tools/content/tests/test_restaff.py`: the CI test (`ci.yml`, content pipeline tests).

## Files here

- `red-first.out`: the test before any edition, fixture or validator existed (13 errors, 2 failures).
- `mutants.py` → `mutants.out`: each mutant's failure lines on the committed edition, and the mutant test against a checker that passes everything (red, 9 of 9).
- `crosscheck.py` → `crosscheck.out`: the fixture against the probe's two-reader table and music21 on the raw; the edition read by music21 and partitura; the verifier on the converter's merged file (fails, 180 lines); the quarry's gates on the edition (H2).
- `restaff-run.out`: the run that wrote the committed edition and fixture.
- `row.py`: the row and the splice.
- `content-build-first.out`, `content-build.out`: the first build (refused on a stale `docs/generated/ladder.md`, regenerated) and the passing one.
- `render-report.json`: the render check on port 4311 (58 of 58 cursor steps, 12 measures).
- `refs.py` → `refs.out`, `check_chains.out`: A7a.1's three Blues Riff refs, unresolved without the row and resolved with it.
- `station4.py` → `station4-blues8.out`, `station4-control.out`: the untaught-options probe with the edition as a blues.8 song option on a scratch copy of the built content (not refused), and the same option on 1.1 (refused), which shows the probe read the injected option.
- `keep.py`: the copy into this folder with machine paths replaced.

The raw member is not read by CI. A copy of it was already committed by the A7a.1 probe as evidence (`../A7a1/source/`); this lane's scripts read it from the worktree's `build/` and nothing in the content suite depends on it.
