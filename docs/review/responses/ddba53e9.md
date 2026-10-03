# Reviewer response — F2b `ddba53e9`

Implementation HEAD: `ddba53e9` (merged at `51fd9e6c`). Seam: F2b, Entry 123.

## Verdict

**APPROVE WITH ONE REQUIRED CHANGE**

Both required parts of F2a landed correctly. `practice.1` now stands on 1.1, so the practice track opens from the second rung of Stage 1 and its ancestry reads the floor's step material as taught while keeping the study's skips untaught until 1.5. The learner-facing leap split is also correct: Stage 2 now presents the fourth-or-fifth concept, while the advanced octave-or-more concept remains on `blues.7` and `ragtime.9`. The 342 × 740 captures show both names and finder sheets clearly; “Wide leaps” is an acceptable short learner-facing label because the sheet immediately states the octave-or-more contract.

One claim boundary is still false. `claims.CONCEPT_DEMANDS` maps both `leap` and `leaps` to `interval.leap`, but that detector recognizes a fourth or wider. It can establish the beginner's fourth-or-fifth claim; it cannot establish the advanced concept's octave-or-more claim. The resulting candidate report already demonstrates the defect: primer fourths in the Bach menuet and the 2.1 studies can satisfy a claim attributed to `blues.7` or `ragtime.9`.

## Required change

- **BLOCKS NEXT BRIEF — unmap advanced `leaps` from `interval.leap` before X1 consumes these curriculum claims.** Keep `"leap": "interval.leap"` for the beginner concept. Remove the advanced `"leaps": "interval.leap"` mapping unless a distinct detector that actually proves octave-or-more material is introduced. Until such a detector exists, the advanced rungs' claim must be explicitly unmeasured, not credited by the weaker fourth-or-wider fact. Regenerate the census and reports, remove the false leap `sharedBy` relationship, and add a regression proving fourth-only material cannot establish the advanced concept. A changed census is the honest consequence, not a regression to suppress.

## Other decisions

- **CONSTRAINS NEXT BRIEF — X1 must preserve the observed 1.2 session consequence deliberately.** On the 30-minute card the newly opened practice row currently takes the New slot, displacing 1.2's own new material. X1 may retain or alter that ordering only as an explicit teaching-policy decision; it must not emerge accidentally from source ranking.
- **LATER WAVE — give the beginner leap material of its own level.** “0 to practise” is truthful now and is preferable to the old advanced drills. Tagging or generating an honest fourth-or-fifth exercise remains separate work.
- **LATER WAVE — resolve the ten pre-existing duplicate concept display names pair by pair.** The scoped collision guard is acceptable for F2b because it prevents new collisions and records the existing set without pretending F2b repaired unrelated curriculum identities.
- **PRUNE/MERGE — keep the two leap identities distinct.** Do not merge the beginner reading leap back into the advanced octave-or-more technique concept merely to recover one detector or one Skills entry.

## Verification basis

I read the immutable F2b handoff first, Entry 123, the exact implementation and named tests at `ddba53e9`, the census and diary artifacts, red/green evidence, orchestrator status lines, candidate report, and all six after pictures at 342 × 740.

The ancestry change is narrow and behaves as claimed. The before/after census keeps every non-practice count stable, reduces practice untaught rows from seven to four and generated practice combinations from sixteen to twelve, and leaves the study's skip as the floor's only genuine untaught row. All five diaries are byte-identical. The unit session case distinguishes placement at 1.1, 1.2, 1.5 and 2.1; the Today captures corroborate the absent row at 1.1 and present row at 1.2.

The concept split is also mechanically complete. The curriculum changes 1.5 and 2.1 from `leaps` to `leap`; the advanced id remains only on `blues.7` and `ragtime.9`; the Skills browser case verifies the two independent entries, their stage filing, complete titles and distinct finder contracts. The added `claims.py` line for the beginner concept is necessary: without it the build moves the teaching derivation away from 2.1.

The merged-chain content build, validator, record check, complete content suite, map checks, typecheck, lint, app build and 53 targeted browser tests exit 0. The whole unit suite's exit 1 is limited to the two recorded CRLF-sensitive assertions. The local disk and heap failures reproduced green after resource pressure cleared. None changes the required claim correction above.
