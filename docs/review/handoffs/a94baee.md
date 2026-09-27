# Reviewer handoff — F1, the eleven voice rewrites (its own seam)

Implementation HEAD: a94baee (F1's commit on its worktree branch, merged as daeb468; lesson text and one test file only; no other seam's file)

## What changed

The eleven F0 deferrals classed "F's voice rewrite" (twelve sentences, since row 46 holds two): each keeps its advice and drops the superlative, frequency or fake precision; no count is replaced by a smaller count; none became a different fact; none turned out to be a contested fact. All in the teacher layer. The table with before → after and the reason is in the entry; three the builder found hardest: 3.4's "the first real piece in the plan" is cut, not replaced, because the brief's candidate replacement ("the first piece here written for both hands at once") is false of the plan (rung 2.1 already offers four hands-together settings) and the earlier reader's rewrite is another ranking; chords-pop.5's sus4 sentence keeps only the instruction and a style label; blues.4's "no edition prints those" becomes "names that are awkward to read", a readability judgement. Twelve claims rows added to `lessonClaimsAboutMusic.test.ts` (no row read these sentences before; the lint listed six and pinned none), each refusing the absolute and requiring the new words. The lint fell from 600 to 592 occurrences; eight gone, none new; the other five sentences contain none of the lint's words, so the rows are their only check. Reading times hold (blues.4 and jazz.7 at 599 words against a 600 cap).

## Found on the way (rows, not fixed here)

- T55 (P1): blues.4:46 "a raised fourth works in every key" is false on C♯, G♯, D♯ and A♯ (a double sharp is needed); and `content/tips/ear-tune.md:7` carries an uncounted superlative on a learner-facing tip.
- For F: classical.9:16 "the single most common way to waste a year"; rock.6:49 "worth more here than almost anywhere"; the same superlatives in code comments (not learner-facing).
- The kept 3.4 clause "whose right hand ranges well above the staff": the right hand reaches B5 and 4 of 129 notes sit on or above the first ledger line — "well above" is generous (P3, unpinned).

## Files to inspect, in order

1. `docs/prompts/entry-88.md` — the table, the red line, the reasons; `docs/prompts/f1-lessons.diff` (the eleven lessons' diff) and `f1-lint-compare.txt`.
2. The three hardest: `content/lessons/3.4.md:39–40`, `chords-pop.5.md:26–31`, `blues.4.md:44–46`.
3. The F1 block at the end of `app/tests/unit/lessonClaimsAboutMusic.test.ts` (twelve rows).

## Verification

- The builder in its worktree, unpiped: content build 0 before and after (2,061 items), validator 0, the lint before and after; the F1 rows red against the unchanged lessons (12 of 12 rows, 26 of 26 assertions), then `lessonClaimsAboutMusic` 152 of 152, `lessonShape` 21 of 21, four other lesson-reading files 28 of 28; the three-file run's two failures are the known CRLF-checkout reds in `lessonClaimsAboutApp` (untouched files, `git diff --quiet` clean).
- The orchestrator ran nothing further by the rule of 2026-09-27 (lesson text and its rows; CI is the full run). Nothing heard; no screen. The four style pointers (rock.4, jazz.7, chords-pop.5 ×2) are unverified as music and left for G.

## Questions for the reviewer

1. Is an existence-only style pointer ("one that heavy piano parts are built from", "it turns up in film music too") the right floor to leave for G, or should the pointer be cut until G has judged it?
2. T55's false "every key" sentence: a one-line fix in F's next seam, or now?

## Do not re-review

F0 and F0a (closed); T53, T53b (closed); C7 (closed); T53c and H0 (their own handoffs when they land).
