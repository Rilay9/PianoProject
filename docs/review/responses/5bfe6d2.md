# Review response — E0a taught-by-ancestry fix

Implementation HEAD reviewed: `5bfe6d2786e16d7769bf00fc343355436dd26346`

## Verdict

**APPROVE WITH ONE REQUIRED CHANGE**

E0a fixes the structural defect identified in the E0 review. The app and build now derive taught material from a rung's actual ancestry rather than the flattened storage order, sibling tracks no longer teach one another by adjacency, and the learner's reached rungs provide the separate learner-specific reading. The two-track regression, shipped-curriculum cases, build/app parity check, gate consumers, and unchanged core-path diaries are the right evidence.

One newly exposed curriculum promise is not merely backlog: the jazz track explicitly teaches walking bass at `jazz.6`, but the vocabulary credits only `blues.5`. Leaving that mismatch in place makes the path-correct gate suppress material the learner has actually been taught and makes the jazz.8 lesson/row contract false. Correct that teaching metadata before E0 closes.

## Findings

1. **ACCEPT — BLOCKS NEXT BRIEF.** The ancestry mechanism satisfies the required E0 fix. `rungAncestry` builds the core spine in stage/unit order, follows explicit track prerequisites, and adds the completed core spine up to a track rung's stage; `taughtAtRung` then unions that structural ancestry with the learner's reached-rung ancestries. The swap sheet receives the same `buildSession().reached` set that Today used, and the build's `claims.py` implements the same path reading. The regression coverage proves the important distinction: a demand taught on sibling track A is unavailable on track B, but becomes available when the learner actually reached A. This closes the original file-order defect in `responses/f3b75b7.md`.

2. **BLOCKING — BLOCKS NEXT BRIEF.** Walking bass is taught on the jazz track. `content/lessons/jazz.6.md` does not make a passing reference: its title names walking bass, it explains the four-note pattern and approach tone, assigns a walking line hands separately and together, integrates it into the rung's repertoire, and defines success as comping with a walking line underneath. By contrast, `content/curriculum/vocabulary/demands.json` assigns `texture.walking-bass.taughtAt` only to `blues.5`. E0a therefore correctly reveals the metadata as false, but the shipped result now withholds walking bass from jazz.8's level-7 row even after the learner completed jazz.6.

   **Required mechanism:** allow a demand to name multiple genuine teaching rungs and set walking bass to at least `[\"blues.5\", \"jazz.6\"]`. Update the schema, validator, TypeScript vocabulary type, and every `taughtAt` reader so a demand is taught when any listed teaching rung is in the relevant ancestry/reached set. Add regressions proving (a) jazz.6 teaches walking bass without blues.5, (b) jazz.8 may keep its walking-bass promise after jazz.6, and (c) an unrelated sibling track still does not inherit it. Do not solve this by weakening the ancestry gate or by special-casing the generator.

3. **ACCEPT — CONSTRAINS NEXT BRIEF.** `theory.9` remains a distinct off-path promise. Its lesson says the level-7 generator supplies “triplets and a walking bass,” but its ancestry reaches neither blues.5 nor jazz.6. Adding jazz.6 as a second teaching rung must not accidentally credit theory.9. Either remove/change that sentence and the row promise, or later give the theory path an actual teaching prerequisite/rung. Until then, the generator should continue omitting walking bass there and the promise regression should continue naming the mismatch.

4. **ACCEPT — CONSTRAINS NEXT BRIEF.** Preserve the distinction between structural ancestry and learner history. A track rung's prerequisites plus core spine answer what every learner at that rung has been taught; `reached` answers what this particular learner additionally completed. Do not fold arbitrary active-track storage order into either reading.

5. **ACCEPT — LATER WAVE.** L109's remaining file-order readers (`anchorFor`, placement “behind,” and the swap sheet's last resort) are outside this seam. Record them against the same path model, but do not expand E0a's fix-forward beyond the walking-bass teaching metadata required above.

6. **ACCEPT — PRUNE/MERGE.** The stale build artifact in the orchestrator checkout is not an implementation failure: the parity test passes after the content build, and CI's enforced order builds before testing. The one transient temporary-directory error and unrelated CRLF reds are also outside this seam. Keep the fresh-build CI result as authority; do not add application changes for those observations.

## Answers to the handoff

1. **Yes. Walking bass is taught at `jazz.6`.** The lesson is explicit instruction and assigned practice, so the vocabulary must credit that rung. Use a multi-rung teaching representation rather than moving the sole teaching rung from blues.5.
2. **The original E0 ancestry defect is fixed, but E0 does not close until the walking-bass metadata/type fix above is separately reviewed and accepted.** E1/E2 work that relies on E0's readiness result remains gated on that acceptance.

No owner decision is required for this response.
