# D4a pre-dispatch brief review — 1cbc38a

**Verdict: APPROVE WITH ONE REQUIRED CHANGE**

I reviewed the immutable handoff first, then the D4a brief, the amended G1 durability paragraph, the exact D4 call sites named by the handoff, D4's implementation response, and Entry 106's recorded race at commit `1cbc38a`. The central repair is correct: carry the relationship already chosen by the session through a durable snapshot, await it before enabling a transfer route, and make `runFacts` accept transfer intent and relationship as one typed fact rather than two independent optionals.

## Required change

- **BLOCKS NEXT BRIEF — bind the snapshot to the exact composed offer instance, and define its pending state consistently.** A key of only “today + item + skill” is not sufficient. The same day's card can be recomposed or its row swapped away and later produce the same item/skill tuple under a different offer state. A stale URL or delayed navigation could then consume the earlier snapshot and write a transfer-intended run for an offer that is no longer on the card. Give the composed card/offer a stable instance or revision token, carry that token in the route, require an exact match on read, and invalidate or supersede the prior snapshot when the card is recomposed or the row is swapped. The stored relationship/contact must remain the bytes from that exact offer, never a recomputation.

  The pending regression must also match the stated gate: while the snapshot read is unresolved, play cannot start and no run row is stored. After an explicit missing, stale, or unreadable result, the route may become ordinary practice and then store neither intent nor relationship while showing the fallback line. Do not model an indefinitely pending read as a completed practice run. Add the same-day recomposition/swap adversary alongside the other-item and other-day cases, and a mutant that ignores the offer-instance/revision match.

D4 closes when this fix-forward is implemented and reviewed. G1 remains after D4a because both own Score-screen changes.

## Accepted brief decisions

- **ACCEPT — exact offer truth, not an opening-time recomputation.** Today writes the session claim before navigating; the Score screen reads that snapshot; a history change between composition and opening cannot alter the relationship written on the run.
- **ACCEPT — fail to ordinary practice, never partial transfer.** Once absence/staleness/unreadability is resolved explicitly, preserving access to the material as practice is preferable to refusing play. The learner-facing line makes the downgrade visible.
- **ACCEPT — type-level pair.** `runFacts` should take either no transfer fact or the pair `{ intent: 'transfer', relationship }`. Its return type should preserve the same invariant so application code cannot construct an intent-only `RunFacts`.
- **ACCEPT — smallest durable storage.** An existing key-value/plan store is adequate if the offer-instance lifecycle above is enforced; D4a does not need a new object store or DB-version change.
- **PRUNE/MERGE — `cutIdentity`.** Removing the unused helper and its sole owning case in this fix-forward is appropriately narrow, provided the required import search is clean.
- **CONSTRAINS NEXT BRIEF — G1 durability.** The amended G1 contract resolves the pruning contradiction: compact per-material contact summaries preserve attempted/practised/performed dates and kinds after run pruning without becoming evidence. G1's query may use full run rows while present and the summary after pruning, but the two paths must produce the same encounter facts.
- **LATER WAVE — repeated unplayed offers and ranking.** Those remain outside D4a.

## Answer to the handoff question

Yes. The snapshot must expire or be superseded when the same day's card is recomposed with a different offer or the row is swapped. “Today's + this item + this skill” identifies subject matter, not the particular teaching decision whose relationship the run claims to record.

## Verification required at implementation review

In addition to the brief's named unit, browser, and mutation checks, the post-build handoff must show:

1. pending read: play remains disabled and no row is stored;
2. exact offer happy path: the route token matches and the run stores the snapshot relationship byte-for-byte;
3. history changes after composition: no recomputation changes the stored relationship;
4. same-day recomposition or swap: the old route/snapshot downgrades explicitly to practice;
5. other item/day, missing, corrupt, or unreadable snapshot: explicit practice fallback with neither intent nor relationship;
6. the type/mutant boundary rejects an intent-only run fact.

Nothing in this brief verifies the musical usefulness of the offered material, and D4a makes no such claim.
