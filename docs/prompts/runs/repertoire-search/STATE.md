# Repertoire search state

This file is the compact restart checkpoint. The detailed evidence lives in `LEDGER.md`. A future chat should read this file first, then only the current candidate XML and any ledger row it actually needs. Do **not** reload the full search history.

## Objective
Find real, legally usable repertoire/arrangements that are genuinely good exemplars of requested piano-learning textures A–O. Use both directions iteratively:

`web-known candidate -> archive lookup -> exact score validation`

and

`archive feature/candidate -> identify/research repertoire -> exact score validation`.

Canonical song identity never proves the archive arrangement. The exact MusicXML wins.

## Immutable source
- Repository: `Rilay9/PianoProject`
- Working branch: `claude/xml-dump-2`
- Immutable XML dump commit: `e9592fcb1beb570a35207beaa91e1b5b2bf83941`
- Dump: `docs/prompts/runs/xml-dump-2/`
- 94 unchanged MusicXML files + `MANIFEST.md`
- Earlier mining basis: 42,196-row licence-safe piano shortlist

## Taxonomy
A power chord/open fifth/heavy riff; B repeating arpeggio/broken-chord accompaniment; C Alberti bass; D waltz bass/oom-pah-pah in 3/4; E ragtime oom-pah + syncopated upper voice; F stride; G boogie-woogie bass; H walking bass; I blues form vs shuffle; J habanera/tresillo/son; K bossa nova; L montuno/tumbao; M tango accompaniment/style boundary; N hymn four-part texture; O gospel walk-ups/passing.

## Cursor
- Rows 1–8 are recorded in `LEDGER.md`.
- A block: rows 1–4 closed as rejects at the exact-arrangement layer.
- Classical-accompaniment block is active.
- B: row 5 Chopin Op. 9 No. 2 = strong PASS; row 6 Clocks = archive-arrangement FAIL despite canonical broken-chord riff.
- D: row 7 Gymnopédie No. 1 = near-neighbor / strict FAIL because the exact XML attacks bass on beat 1 and one chord on beat 2 sustained through beat 3, rather than bass + separate chord + separate chord.
- C: row 8 Mozart K.545/III = PASS **as an excerpt**. Opening texture is not Alberti; at m.9 LH is C4–G4–E4–G4 and m.10 begins B3–G4–D4–G4, explicit low–high–middle–high cells.
- External/archive cross-edge for C: K.545/I PDMX `QmXaLndsVZvGL5n1saWern2cbW1Ze1kEKpeUofRBBmhT1D` is in the project's quarry record, selected and converted successfully; web pedagogy identifies it as a sustained Alberti-bass exemplar. It is nominated only until its exact archive XML is inspected.
- Next uninspected dump row: **9 — Muzio Clementi, Sonate en UT Majeur**.
- Current purpose at row 9: determine whether the exact arrangement offers a cleaner sustained C exemplar or a distinct B/C control. Do not assume from Classical-sonatina reputation.

## Restart algorithm
1. Read this file only.
2. Fetch current row from `MANIFEST.md` and the minimum useful slice of its XML.
3. Establish actual instrumentation/staves/meter/attack pattern before researching by title.
4. If feature identity remains plausible, research the work/texture online; if web research nominates a better piece, cross-check whether that exact piece/arrangement exists in the archive.
5. Append one concise evidence row to `LEDGER.md`.
6. Advance this cursor.
7. Every few rows, deliberately search outside the existing dump for a better-known exemplar of the active target and cross-check it against the 42,196-row shortlist/archive. Do not reduce the workflow to keyword searching the archive.

## Context budget rule
Keep only: this checkpoint, current candidate, target definition, and decision-relevant evidence in active reasoning. Detailed prior evidence stays in `LEDGER.md`; XML stays in the repo. Never paste/reload all 94 scores or the full ledger into the conversation.
