# Checkpoint after C6 — every slot on Today from the evidence and the strand's rung (2026-09-26)

For the reviewer's artefact-first review. The C6 commit is `8f86d53`; the chain ran over that tree; Parts 17–19 and this packet sit on top of it. Everything named here is in the repository at the commit that carries this file.

## What to inspect, in this order

1. **Entry 80**, the builder's record: `docs/prompts/entry-80.md` (a copy; `docs/pending-review.md` holds the same text but is above the fetch limit). Judgement first, the deviations with reasons, done per item with the red line and before → after, the pedagogical verdict, the tests table, the runs, not done, follow-ups, questions, unverified.
2. **The three learners' thirty days**, as the app printed them: `docs/prompts/checkpoint-2026-09-26-slots-diaries.md` — the skip learner (reads only, 2.2 → 3.1), the returning intermediate (placed 3.1, climbs to 4.6), the experienced musician (placed 4.1, held on 4.6 by Perform-on songs); every slot's item and reason line per day; plus the two ambiguity learners.
3. **The pictures**, 342 × 740, desktop Chromium, light theme: `docs/prompts/pictures/c6/` — learner A on day one, learner B with a skill-retention review and B's swap sheet, learner C with a piece-retention review; `cards.txt` beside them is the text of every card as printed, with `cut: true/false` per line.
4. **The red lines** seen on the committed snapshot before the change: `docs/prompts/checkpoint-2026-09-26-slots-reds.md`.
5. **The code**: `app/src/curriculum/session.ts` (`strandsOf`, `readerPosition`, `FALLBACK_ORDER`, the two-pass fill, `SLOT_TEXT` / `slotReason`), `app/src/curriculum/selectors.ts` (`tieredAlternatives`), `app/src/data/progressStore.ts` (`learnedPieces`, `REPERTOIRE_WINDOW_DAYS`; `reviewQueue` and `REVIEW_INTERVALS_DAYS` deleted), `app/src/ui/screens/TodayScreen.ts`, `app/src/ui/help.ts`.
6. **The tests**: new `slotsFromEvidence` (21), `repertoireRetention` (9), `fallbackOrder` (8), `alternativesShareASkill` (6), `parallelStrands` (12 — the four-strand discriminating test in two file orders, asserting the strands served and the lines printed, never which item won); the reruns' other-slot days in `firstThirtyDays` and `firstThirtyDaysOnTheLadder`; the `help` slot-words join; the e2e `today` case reading the warm-up and review reasons and the swap tier on the glass. Replaced, with the old assumption named: the due-item and level-window cases, `recordTruth`'s calendar zones, `progressStore`'s seven `reviewQueue` cases, the concept tier, lessons 0.3 and practice.3's rows.
7. **The lessons**: `content/lessons/0.3.md` and `content/lessons/practice.3.md`, rewritten because both taught the deleted 1-3-7-21-day calendar.
8. **The specs**: `docs/04-ui-spec.md` §2, `docs/02-curriculum.md` Part A §6 and Part G, `docs/08-test-map.md`.

## The orchestrator's judgement

**What I looked at**: the two learner-B pictures and the C card's text, days 1–5 and 24–25 of the intermediate's diary, and the builder's report; the rest of the diaries and pictures are the builder's reading. Nothing heard. The learners are constructed; the owner's own rows are not in the tree.

**As a teacher.** The returning intermediate's month reads as a lesson series: the rung's asks in the warm-up and new rows, the review row keeping a corner of technique warm on most days, the first fortnight's pieces brought back after fourteen days, and one skill-retention offer on day 24 ("Reading by interval: not shown in 3 weeks") for a skill the current reading row had stopped showing. The lines are ones a teacher would say. Two things I would question. At phone width the reason line is cut after about thirty characters, so the count or date after the dash is lost ("This lesson asks for it — n…"); the builder moved the claim before the dash so the cut loses the least, and a two-line reason is a P3 follow-up. And the status line and Plan still walk the old file order, so a Stage 4 learner reads "Working on Stage 1 · Chunking, and the loop" above a card drawn from four strands; the builder left `nextRecommended` alone rather than encode the bypassed-rung fallback into the new selector, which is the boundary the reviewer set (L93).

**The finding that matters most, the builder's own.** Only the nine sight-reading rows declare `targetSkills` and no catalogue item carries measured `demands` (0 of 2,061), so three of the new claims — the warm-up's skill claim, the ladder's target-skill and demand steps, the repertoire slot's demand claim — are proven on constructed items and fire on nothing shipped. On real content the slots choose from rung state, the skill ladder, the progress rows and the exposure rule. That is honest, and it is what D0 (target skills and contracts on the families) and E (measured demands on pieces) exist to feed; until then every core rung 0.1–4.7 is served by the weaker claims.

**Decisions I took, for the reviewer to overrule**: repertoire retention covers songs passed as well as mastered (a passed song is learned enough to forget); exposure may choose ahead of the ladder's first step in review and repertoire when a family has gone a week unplayed (the balance rule); the 14-day repertoire window and the 7-day exposure window are hypotheses beside the ladder's 21 days, recorded as such; repertoire-row songs count for the rung that judged them (C5's rule for pre-C1 rows applied forward); the two lesson rewrites outside the builder's files are accepted under never-teach-wrong.

## The chain, over the committed tree

Content build, validator, content tests, `tsc -b`, lint, vitest (252 files, 5,970 passed, 6 skipped), app build: exit 0. The default Playwright configuration: 790 passed, 7 skipped, one failure — the density spec's 900 px case timed out waiting for the score screen; run alone it passed (3 passed), the load-flake shape Q34 records. The states gallery: failed on the same two light-theme contrasts as after C5 (`#score-waiting` and `#score-help-more` at 4.3:1), U62, H's. CI at push time: green on 20fb6ac; the two docs-only pushes before this one were still running.

## Not done, from the builder

"Kept on the shelf" repertoire retention (a shelf piece is not a catalogue item Today can open); `nextRecommended`'s serialisation and bypassed-rung fallbacks in the status line and Plan (L93); L35's two build-side rules in `tools/`; the e2e revisions not seen red on the committed build (serving the committed snapshot was refused by the permission check); the whole default configuration not run by the builder (the chain ran it); the skill and demand claims fire on nothing shipped.

## Follow-ups recorded

L93 P1 (the status line and Plan read the strands); L88 and G1 P1 (target skills on the families, D0; measured demands on pieces, E); L95 P2 (rung lists hold items above the rung — practice.1's Hanon No. 1 at level 4.4; content, not selection); L86 (nothing in the data marks a project stage; Stage 9 is recognised by number); L90 (the vocabulary's skills carry no prerequisites); a C7 nit (`ladder.ts`'s comment names the deleted `REVIEW_INTERVALS_DAYS`); P3 a two-line reason where the title fits one; P3 exposure families by `drill.kind` are coarse.

## Questions for the reviewer

1. The two decisions above on retention and exposure: stand, or change?
2. Is the "fires on nothing shipped" finding acceptable as C6's honest state until D0 and E, or should a smaller task put `targetSkills` on the core exercise families before C7?
3. Parts 18 and 19 (the session is composed but not run; the interruption lifecycle) are recorded as X's boundary beside C6; anything there that C7 must not cement?

## The fix-forward (commit `f3c4b7e`), for the re-check

The reviewer's one correction is built: review and repertoire run a due retention, then the ladder, then exposure last; the builder found a second instance of the fault (the ladder ran every step on one strand before the next, so the first strand's exposure beat the second strand's rung option) and fixed it; the seven-day constant, its flag and the `tracks` family are gone; three red lines on the committed code, five `fallbackOrder` cases, the reruns revised. Inspect `docs/prompts/entry-80.md` from "Addendum (exposure precedence)", `app/tests/unit/fallbackOrder.test.ts`, and the after-fix diaries beside the before-fix ones. **The consequence to judge** (L96): on the three constructed learners exposure vanished from the review row rather than shrinking — every morning the rung still had an option not on the card — so the review repeats one item for days (the skip learner ten days running; those learners never play the review row, so nothing is ever counted to prefer). Breadth now lives only in the warm-up's exposure choice and in L32's reserved share, unbuilt. Question 4: is that acceptable review, or is L32's share now urgent?

