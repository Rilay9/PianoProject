# Reviewer response — E57a (Entry 195)

## Verdict

**APPROVE WITH ONE REQUIRED CHANGE**

The three previously held PDMX rows now carry the tempo statements E57 preserves from the raw uploads, the lesson claims have been corrected to match those files, the three new identities are in the same reviewed-repair learner-continuity relation as the rest of E57, and the regenerated counts are internally consistent with the landed set. The restraint-sentence repair is also correct.

The one required change is smaller than the provisional exception E57a added: **do not create a permanent `KNOWN_LONG`/four-minute exception for three words.** Remove exactly **“on this track”** from the first sentence:

> Every texture so far has been something to hold steady.

That is the clean three-word cut outside every reviewer-approved sentence; it changes no teaching proposition. Restore `readingTime: 3`, remove `rock.7.md` from `KNOWN_LONG`, and remove the E57a docs note that records it as a long-lesson exception. Keep the ordinary 600-word rule intact.

This is a fast-path correction. No new content, architecture or pedagogy decision is open.

## Question 2 — restraint sentence

**Confirm.**

> The piece teaches restraint better than anything else here because the first half must stay small.

Naming the referent is necessary once the Grieg sentence ends in “the app follows those written changes”; leaving `It` there would make the pronoun grammatically point at the app. This is a mechanical coherence correction and preserves the original claim.

## Question 3 — *Piano Man* as a ballad

**Keep the sentence.** `Ballad` is a genre/character label here, not a promise that the notated quarter-note value must be numerically slow. The newly preserved quarter = 160 statement therefore does not by itself falsify “*Piano Man* and *Falling* are ballads where the left hand decides everything.”

Whether this particular arrangement at its encoded tempo *feels* like the intended song or whether the left-hand characterization is the best musical description remains unverified as music; E57a does not need to invent a new lesson claim to resolve that uncertainty.

## Historical/current counts

**Keep the earlier E57 record immutable.** Entry 183 and its handoff record what E57 knew and landed at that time: 93 PDMX rows with three held and the then-current mark count. E57a is the later event that supersedes those figures for the current tree: 96 PDMX rows, 99 moved identities, 102 E57 relations, 109 repair entries plus the cut, and the updated mark/row totals. Do not rewrite the old event to look as though the three rows were never held.

## Content check

I checked the itemised content changes against the implementation and the prior E57 ruling:

- the three `convertedSha256` moves are exactly the three formerly held rows;
- Grieg's lesson wording matches the reader evidence E57a pins: 138 at the opening, 80 at bar 6, then the non-falling rise toward 200;
- the false `chords-pop.9` printed-tempo ranking is removed rather than replaced with another unsupported ranking;
- the common-mistake sentence correctly separates written accelerando from accidental speeding-up;
- the restraint pronoun is repaired without changing its teaching claim.

Not checked by ear: whether Grieg's, Apex's or Piano Man's encoded tempo trajectories sound musically appropriate. That remains explicitly unverified as music and does not invalidate the source-fidelity/content-truth fix.

Once the three-word cut and exception rollback land with the existing targeted checks green, E57a may close.