# Reviewer handoff: the discrepancy pass on the proving run

**Scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** All other work is stopped by the owner; this is the only lane.

Respond in `responses/classifier-discrepancies.md`. Nothing heard. Your ruling is transcribed in `responses/classifier-proving-run.md` with six REVIEW-OPEN lines; this handoff reports each. The raw results are preserved unchanged in `docs/classifier/proving/2026-10-07/`. The table changes are in `docs/classifier/characteristics.yaml`, each row's `gap` carrying its reason and the run it rests on.

## Done, per requirement

- **CPR-six-feature-rows-partly.** `technique.velocity`, `technique.span`, `technique.leap-size`, `technique.hand-crossing`, `difficulty.features` and `difficulty.tempo` are now PARTLY. Each `gap` says the implementation is real, its stored output covers 0 of 2,020 items, and where it was run its meaning disagreed with the witness on a share of items.
- **CPR-generated-key-semantics.** `generated.spec-declared` keeps the raw parameters and says `key` is used three ways (100 of 1,134 files). A new row, `generated.spec-interpreted` (EXACT, SOURCED_RULE, MISSING), holds each parameter's musical meaning per family, sourced from the family contract.
- **CPR-tempo-partial.** `mark.tempo-text` is now PARTLY. Its gap records 60 items whose file writes a tempo but whose row has none, and the 174 defaulted-tempo items, whose provenance tag is the only record (the file holds the default).
- **CPR-render-gap.** The 45 is a subtraction artefact. The local render report is from 2026-09-18:
  - it lacks 59 of today's notated items, all added since: 6 excerpts, 28 generated, 25 songs;
  - it holds 14 items that have left the catalogue.

  CI runs the render check on every push (`ci.yml:474`). But the last CI run to finish (`cc9c5629`) failed earlier, at the content tests (a duplicate review id since fixed), and later runs were cancelled. So no run has reached the render step on the current catalogue. `integrity.render` is now PARTLY until one does.
- **CPR-syncopation-adjudicate.** Not a representative set: all 83, mechanically, from the build's own positions cache.
  - In 82 the detector's syncopation is located in printed bar 1, and each of those files opens with a pickup. In 81 that pickup is the only place it was found.
  - One item (bars 80-82, no pickup) is unexplained.

  Recorded on `rhythm.syncopation`'s gap; the detector is unchanged. [My reading: the rest-entry clause of T37's rule, written for generated phrases, counts an anacrusis. Whether an anacrusis is syncopation is the definition to quote; I have not found a published source that settles it.]
- **CPR-walking-bass-adjudicate.** The eleven disagreements, read from the scores (the lowest left-hand note per onset, first three bars):

  | Item | Left hand | Witness |
  | --- | --- | --- |
  | five clave pulse exercises | B4 B4 B4 B4, every bar | detector only |
  | four stride exercises | root, then one chord note three times (Bb2 D4 D4 D4, F2 A3 A3 A3) | detector only |
  | Outer Wilds theme | C2 C2 C2 C2, then D2 … | detector only |
  | Scarborough Fair | E3 G3 B3 in 3/4, every bar | witness only |

  - **The definition.** Friedland, *Building Walking Bass Lines* (1995), as cited by Wikipedia (I have not read the book): unsyncopated equal values, usually quarters, built from scale tones, arpeggios, chromatic runs and passing tones that outline the harmony. [By that definition neither a single repeated pitch nor a root followed by a repeated chord note is a walking line.]
  - **Scarborough Fair** is a broken triad repeated per bar. The definition admits arpeggios and does not exclude it; it stays unresolved.
  - **The detector is unchanged.** Recorded on `texture.walking-bass`'s gap, with near-miss fixtures named as the precondition for any change.

## Two process faults of mine

- **CI.** My classifier handoffs broke the content tests. Their clause maps used rows for clauses with no mechanism, which the clause guard rejects. And their REVIEW-OPEN lines changed the open set that `test_check_chains.py` pins. Every push since `e521937e` carried the clause-guard failure and every push since `67f2b21f` the pinned-set failure; the CI runs were cancelled before reporting them. Fixed here:
  - the four handoffs now say `No ruling closes in this handoff.`, with their unenforced clauses under a heading of their own;
  - the pinned set lists the fifteen ids the three classifier rulings opened, and the test's name no longer carries a count.
- **Trailer.** Commit `bef01fb0` carries a model-name trailer the owner's CLAUDE.md forbids; per your note it stays.

## Asked

1. Close what is done, or say what is missing.
2. The anacrusis question for syncopation: whether a source is known to you, or how it should be decided.
3. Whether the near-miss fixtures for walking bass come before or after the 42 direct rows.

## Clause map

No ruling closes in this handoff.
