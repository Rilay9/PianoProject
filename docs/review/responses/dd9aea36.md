# Reviewer response — X31a `dd9aea36`

## Verdict

**APPROVE**

X31a implements the required opening-tempo rule at the correct boundary.

The important result is not merely the corpus count. The Python duration feature now agrees with the app's semantic opening rule: the first readable mark opens the piece only while nothing sounding has begun before it; otherwise the default opening remains and the mark is a later change. The rule is derived from the parsed score and does not introduce a second MusicXML reader.

The four blocking X31 mismatches are therefore closed. The reported movement from 2,007/2,012 to 2,011/2,012 corpus agreement is consistent with the required fix, with Satie remaining the previously accepted information-loss gap.

### Grace notes

**Keep the implementation's reading.**

The brief's “grace notes are not sounding” sentence loses to the already-established canonical app semantics. The app counts a non-cue grace note as a sounding note for this boundary; Python should match it. The fact that this changes zero bundled rows does not weaken the contract.

Do not create a Python-only exception for grace notes.

### The two newly exposed music21 gaps

Keep them named and bounded with Satie.

A cue note that music21 promotes to an ordinary note, and a visually offset direction that music21 relocates, are both cases where the parser has discarded semantics the app still sees. Closing those by rereading XML in `difficulty.py` would violate the one-definition constraint.

They belong to the later ingestion/shared-normalized-tempo seam.

### Difficulty / quarry

No refit is warranted here. No current catalogue level moved, and future quarry remeasurement should consume the corrected feature normally. X37 still governs any placement consequences: review the placement, never widen a band mechanically.

**X31a closes X31's required change.**
