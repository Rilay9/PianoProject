# F1 review — a94baee

**Verdict: APPROVE**

Implementation reviewed: `a94baee99fb1ed371ea2adf5a1a6deca2022a94a`. This response covers F1's eleven voice rewrites only. It does not close T53c or open D0.

## Evidence checked

I read the immutable F1 handoff; Entry 88; the F1 lesson diff and lint comparison; the three highlighted lessons at the implementation commit; the complete appended F1 block in `app/tests/unit/lessonClaimsAboutMusic.test.ts`; the F1 brief; and the implementation commit's file list. The commit changes exactly eleven lessons and appends 104 lines to that one test file. The twelve rows check that the old phrases are absent and the new wording is present. The diff removes the stated rankings, quantities, and absolutes without replacing them with a narrower numerical claim. The advice survives, including the rest/subdivision instruction, the Petzold ledger-line purpose, and the sus4-to-triad gesture.

The lint comparison records 600 → 592 occurrences, with eight removed and none added. Entry 88 reports the content build and validator passing, `lessonClaimsAboutMusic` 152/152 and `lessonShape` 21/21; it also reports two `lessonClaimsAboutApp` failures in files outside this seam. The raw worktree logs, `petzold-range.txt`, and the before/after word-count files named inside Entry 88 are not committed in the branch and could not be independently fetched. I treat their numbers as reported evidence, not independently verified test runs. This review accepts the textual change and its scope; it does not claim to have heard the style examples or rerun the tests.

## Findings

1. **ACCEPT — F1 voice rewrite.** The changed learner-facing sentences remove the uncounted claims while retaining useful instruction. The existence-only style pointers in `rock.4`, `jazz.7`, and `chords-pop.5` remain unverified musical claims. **LATER WAVE:** G should check those pointers against actual musical examples before treating them as teaching truth. Their presence does not block F1.

2. **SUPERSEDED — the proposed T55 diagnosis of “A raised fourth works in every key.”** At `content/lessons/blues.4.md:46`, this sentence is literally correct as a statement about interval spelling. For example, above C♯ the fourth is F♯ and its raised form is F𝄪, sounding G; the double sharp does not make the raised fourth unavailable. The nearby wording “the flat spelling runs out” is colloquial for awkward spellings, not a proof that those notes cannot be written. **CONSTRAINS NEXT BRIEF:** If F revisits this paragraph, clarify spelling versus pitch and avoid fixing the sentence on the premise that a raised fourth fails in those keys. The separate tip superlative in T55 can still be addressed. This is a correction to the follow-up's reasoning, not a required F1 implementation change.

3. **LATER WAVE — Petzold precision.** `content/lessons/3.4.md:39–40` still says “well above the staff.” Entry 88 reports B5 and four notes on or above the first ledger line. “Above the staff” would be more exact if this sentence is revised later. It does not restore the removed “first real piece” claim.

## Gate and owner decision

F1 is accepted as its own seam. T53c still requires its own handoff and ACCEPT before D0 may start. No owner decision is needed for F1.
