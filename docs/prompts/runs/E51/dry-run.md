## The five approved rows, as the merge judges them against this build

- row 1 `excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32` (event ex-4a4c15fa-bb27-4b0e-994f-230100e132cf): stale by cut version: approved under cutter version 1, the cutter is now version 2
- row 2 `excerpt.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28` (event ex-05f48703-2543-4c65-aa4d-8c0b6a9058cc): stale by cut version: approved under cutter version 1, the cutter is now version 2
- row 3 `excerpt.classical.beethoven-ode-to-joy.easy.b9-12` (event ex-b09dcf7b-663b-4461-bbf8-5531cb2a1526): stale by cut version: approved under cutter version 1, the cutter is now version 2
- row 4 `excerpt.classical.i-got-rythm.pdmx.b15-18` (event ex-0fe1ee6a-7620-4979-8b42-159b06d522f9): stale by cut version: approved under cutter version 1, the cutter is now version 2
- row 5 `excerpt.blues.wabash-blues.b1-4` (event ex-a57de44f-ebc6-4a41-a93e-b7af6eeefdeb): stale by cut version: approved under cutter version 1, the cutter is now version 2

The line naming other bytes is on `excerpt.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28` and names bytes no parent has (0…0): no row is stale by provenance on this build.

## The merge, first: exit 1

```
Merged build\e51\dry-decisions.jsonl: appended 2, already in the file 1, refused 3.
  + e51-dry-run-0001, superseding ex-b09dcf7b-663b-4461-bbf8-5531cb2a1526 (stale by cut version: approved under cutter version 1, the cutter is now version 2)
  + e51-dry-run-0003, superseding ex-0fe1ee6a-7620-4979-8b42-159b06d522f9 (stale by cut version: approved under cutter version 1, the cutter is now version 2)
  line 2: refused: excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32: its approval (event ex-4a4c15fa-bb27-4b0e-994f-230100e132cf) is stale by cut version: approved under cutter version 1, the cutter is now version 2; a renewal is a decision on the current parent, and this line names no parent bytes
  line 3: refused: excerpt.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28: its approval (event ex-05f48703-2543-4c65-aa4d-8c0b6a9058cc) is stale by cut version: approved under cutter version 1, the cutter is now version 2; a renewal is a decision on the current parent, and this line names the parent's bytes 000000000000…, the parent is now e31397242245…
  line 5: refused: excerpt.classical.beethoven-ode-to-joy.easy.b9-12 is already approved (event e51-dry-run-0001)
```

## The merge, second (the same file again): exit 1

```
Merged build\e51\dry-decisions.jsonl: appended 0, already in the file 3, refused 3.
  line 2: refused: excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32: its approval (event ex-4a4c15fa-bb27-4b0e-994f-230100e132cf) is stale by cut version: approved under cutter version 1, the cutter is now version 2; a renewal is a decision on the current parent, and this line names no parent bytes
  line 3: refused: excerpt.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28: its approval (event ex-05f48703-2543-4c65-aa4d-8c0b6a9058cc) is stale by cut version: approved under cutter version 1, the cutter is now version 2; a renewal is a decision on the current parent, and this line names the parent's bytes 000000000000…, the parent is now e31397242245…
  line 5: refused: excerpt.classical.beethoven-ode-to-joy.easy.b9-12 is already approved (event e51-dry-run-0001)
```

## The scratch copy after

- excerpts: ['ex-4a4c15fa-bb27-4b0e-994f-230100e132cf', 'ex-05f48703-2543-4c65-aa4d-8c0b6a9058cc', 'e51-dry-run-0001', 'ex-a57de44f-ebc6-4a41-a93e-b7af6eeefdeb']
- rejected: 18 (the last e51-dry-run-0003)
- superseded: [('ex-b09dcf7b-663b-4461-bbf8-5531cb2a1526', 'e51-dry-run-0001'), ('ex-0fe1ee6a-7620-4979-8b42-159b06d522f9', 'e51-dry-run-0003')]
  - ex-b09dcf7b-663b-4461-bbf8-5531cb2a1526 kept whole (every field and its order as in the committed row): True; cutVersion present: False
  - ex-0fe1ee6a-7620-4979-8b42-159b06d522f9 kept whole (every field and its order as in the committed row): True; cutVersion present: False
- the renewal: event e51-dry-run-0001, cutVersion 2, parentSha256 96e7b89cd750… (the parent now 96e7b89cd750…)

## The validator's excerpt check over the same build

- committed file: 0 error(s), 5 stale warning(s)
  - excerpts.json row 1 (excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32): stale by cut version — approved when the cutter was version 1, the cutter is now version 2: nothing carries the approval to this cut; a person re-decides it
  - excerpts.json row 2 (excerpt.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28): stale by cut version — approved when the cutter was version 1, the cutter is now version 2: nothing carries the approval to this cut; a person re-decides it
  - excerpts.json row 3 (excerpt.classical.beethoven-ode-to-joy.easy.b9-12): stale by cut version — approved when the cutter was version 1, the cutter is now version 2: nothing carries the approval to this cut; a person re-decides it
  - excerpts.json row 4 (excerpt.classical.i-got-rythm.pdmx.b15-18): stale by cut version — approved when the cutter was version 1, the cutter is now version 2: nothing carries the approval to this cut; a person re-decides it
  - excerpts.json row 5 (excerpt.blues.wabash-blues.b1-4): stale by cut version — approved when the cutter was version 1, the cutter is now version 2: nothing carries the approval to this cut; a person re-decides it
- scratch copy: 1 error(s), 3 stale warning(s)
  - excerpt.classical.i-got-rythm.pdmx.b15-18: an excerpt with no approved row in excerpts.json
  - excerpts.json row 1 (excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32): stale by cut version — approved when the cutter was version 1, the cutter is now version 2: nothing carries the approval to this cut; a person re-decides it
  - excerpts.json row 2 (excerpt.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28): stale by cut version — approved when the cutter was version 1, the cutter is now version 2: nothing carries the approval to this cut; a person re-decides it
  - excerpts.json row 4 (excerpt.blues.wabash-blues.b1-4): stale by cut version — approved when the cutter was version 1, the cutter is now version 2: nothing carries the approval to this cut; a person re-decides it

The committed file unchanged by the dry run: True
