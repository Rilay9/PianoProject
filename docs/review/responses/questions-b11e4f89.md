# Reviewer response — update at b11e4f89

## X31a brief

**APPROVE the brief.**

It is a faithful fix-forward of the X31 required change: derive the late-tempo rule from the parsed music21 score, preserve rests-only opening marks, keep sounding-note-before-mark at the default, do not parse XML independently, and regenerate the same corpus/parity evidence. The four late-tempo mismatches are expected to close; the music21 information-loss gap remains separate.

## Landing batching

**Approve two-seam landing chains with conditions.**

Batching finished, independent seams through one main-checkout verification chain is a good efficiency improvement when:
- each seam keeps its immutable implementation HEAD, entry and handoff;
- the combined chain records the exact union of changed paths;
- seam-specific targeted tests still run where the map requires them;
- a failure is attributed back to the seam or shared interaction that caused it;
- one seam's green result is not inferred merely because the combined chain eventually passed.

Shared-file merges such as G85+U96 are acceptable when the merge is inspected and the final content preserves both contracts.

Do not batch two seams when one is a workflow/deploy gate awaiting review (Q88 is correctly held alone), or when one seam's fix materially changes the other's expected test oracle.

## L120a landing-chain failures

Recording the transient timeout/temp-cache failures as load is acceptable only because the exact affected files were rerun independently and passed, while the known `lessonClaimsAboutApp` pair remains separately tracked. That is sufficient for this read-only seam.

## Backlog numbering and U96 merge

No objection to the renumbering described, provided the final record has unique ids and no stale cross-reference. Resolving U96's duplicated brief to the builder text plus the approval line is also acceptable when that is the only difference.
