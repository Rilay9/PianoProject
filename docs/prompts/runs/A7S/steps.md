# A7c.1: which control reaches each step on the deployed app (lane A7S, 2026-10-06)

FABLE §1's phone-build condition. The builder has no phone, so this is read from the code at origin's head
`4f372bf1` (the worktree's base, the branch `pages.yml` deploys; whether that run deployed is not checked
here) and from the lessons' words, never observed on a device. Nothing heard.

**Numbering.** The record (`docs/chains/A7c.1.yaml`) has 24 steps. The lesson (`content/lessons/latin.4.md`)
numbers them 1 to 19 with 6-7, 7a-7c and 9-10 grouped, and the brief and Entry 259 call the later-rung line
"step 20"; the brief's "20 steps" is the lesson's count. Both numbers are given.

**The route to latin.4.** Plan, with the Latin track switched on in the tracks sheet, lists latin.4 on Stage 4
(`latin4.placement.spec.ts`, Entry 252); its row opens the lesson page, whose option rows each open the Score
screen with ▶, judged by latin.4 (`RUNG_TEXT.opensFromHere`). latin.6 and latin.7 are on Stages 6 and 7 of the
same track. **Score screen controls** (`app/src/ui/screens/ScoreScreen.ts`): the mode menu *Wait for me*,
*Keep tempo*, *Play it to me* (133-135); *Hear it* (1375); the hand buttons *R*, *L*, *Both* (182); behind ⋯
*Rhythm only* (1947), *Loop* (2208) and *Duet* (2009); the tempo slider; a loop of chosen bars by double-tap
(3525).

| Record | Lesson | Tool | Item | Control or route | Reached |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | lesson | `latin.4.md` | Plan → latin.4 row → the lesson page; the grid is a code-span list | yes |
| 2 | 2 | Hear it | 4/4 tresillo in C | its exercise row ▶ → *Hear it* | yes |
| 3 | 3 | Hear it | Bizet LH cut | its song row ▶ → *Hear it* | yes |
| 4 | 4 | Rhythm only | 4/4 tresillo in C | row ▶ → *Keep tempo*, *L* → ⋯ *Rhythm only* → ▶ | yes |
| 5 | 5 | Rhythm only | Bizet LH cut | row ▶ → *Keep tempo*, *L*, *Rhythm only* → ▶ | yes |
| 6 | 6 | Rhythm only | 2/4 tresillo control | row ▶ → *Keep tempo*, *L*, *Rhythm only* → ▶ | yes |
| 7 | 7 | Rhythm only | 2/4 habanera in C | row ▶ → *Keep tempo*, *L*, *Rhythm only* → ▶ | yes |
| 8 | 7a | Keep tempo | 2/4 habanera in C | row ▶ → *Rhythm only* off → *Keep tempo*, *L* (⋯ *Duet*, or *Both*) → ▶ | yes |
| 9 | 7b | Keep tempo | 2/4 habanera in F | its row ▶ → *Keep tempo* → ▶ | yes |
| 10 | 7b | Keep tempo | 2/4 habanera in G | its row ▶ → *Keep tempo* → ▶ | yes |
| 11 | 7c | Keep tempo (counted) | 2/4 tresillo control | row ▶ → *Keep tempo*, *L*, slider 80-100 % → ▶, all eight bars | yes |
| 12 | 8 | Keep tempo | 4/4 tresillo in C | row ▶ → *Keep tempo*, *L* → ▶ | yes |
| 13 | 9 | Keep tempo | 4/4 tresillo in F | its row ▶ → *Keep tempo* → ▶ | yes |
| 14 | 10 | Keep tempo | 4/4 tresillo in G | its row ▶ → *Keep tempo* → ▶ | yes |
| 15 | 11 | Hear it | Bizet whole, bars 1-12 | the whole aria's row ▶ → *Hear it* (the lesson adds a loop of 1-12; not in this step's scaffold) | yes, without the loop |
| 16 | 12 | Wait for me | Bizet LH cut | row ▶ → *Wait for me* → ▶ | yes |
| 17 | 13 | Keep tempo (counted) | Bizet LH cut | row ▶ → *Keep tempo*, *L*, *Rhythm only* off, slider → ▶, all twelve bars | yes |
| 18 | 14 | Keep tempo | Bizet whole, LH, bars 1-12 looped | aria row ▶ → *L*, ⋯ *Duet* on → loop bars 1-12 → *Keep tempo* → ▶ | **the loop of bars 1-12 not shown reachable** (below) |
| 19 | 15 | Hear it | The Crave, bars 21-26 | its song row ▶ → *Hear it* (the lesson adds a loop of 21-26; not in this step's scaffold) | yes, without the loop |
| 20 | 16 | Rhythm only | The Crave, bars 21-22 looped | row ▶ → loop 21-22 → *Keep tempo*, *L*, *Rhythm only* → ▶ | **the loop of bars 21-22 not shown reachable** |
| 21 | 17 | lesson | Por Una Cabeza, bars 1-14 | its song row ▶, the page read before pressing anything | yes |
| 22 | 18 | Hear it | Por Una Cabeza, bars 1-14 | *Hear it* (the lesson adds a loop of 1-14; not in this step's scaffold) | yes, without the loop |
| 23 | 19 | Rhythm only | Por Una Cabeza, bars 1-14 looped | loop 1-14 → *Keep tempo*, *L*, *Rhythm only* → ▶ | **the loop of bars 1-14 not shown reachable** |
| 24 | 20 | lesson | the latin.6 and latin.7 pieces | Plan → Stage 6 latin.6 (Por Una Cabeza, The Crave, La Cumparsita B) and Stage 7 latin.7 (El Choclo): the task line is the page's first paragraph after the opening (Entry 259); each piece's row ▶ opens it | yes |

**Summary.** 21 of 24 steps are reached by a control on the deployed app's code; steps 18, 20 and 23
(lesson 14, 16 and 19), whose scaffold is a loop of named bars, are not shown reachable, and steps 15, 19 and
22 are reached without the loop the lesson adds.

**Why the loops are not shown reachable** (code reading; not run on a device; no Playwright in this lane).
The one control that sets a loop of chosen bars on these pieces is the double-tap: the first marks the start,
the second the end (`ScoreScreen.ts` 3525-3545). The bar it marks comes from `measureAt` (3659-3667), which
reads `data-measure` from the tapped element; no element in `app/src` carries that attribute, so it falls back
to the current window's first bar, wherever the tap lands (`score.pickup-numbers.spec.ts` 37-40 says the same
and relies on it). Stopped, the window starts at bar 1; the Scroll layout draws the whole piece as one sheet
(`WindowRenderer.ts` 1274-1283), so by the same reading its first bar is bar 1 again (inferred, not run). A loop of 21-22, 1-14 or 1-12 then needs the window to start
at each end bar when tapped, which happens, if at all, only mid-playback and only for a bar that starts a
window. The other loop sources do not apply: the three pieces have no named sections (`teaching.sections` is
absent in the built catalog, so the *Practice section* select is hidden), the summary's *Loop* takes the worst
bar and the next, *Carry on from bar N* loops to the end, and the `?loop=` route parameter (`router.ts` 512) is
set by no lesson row or learner control on this path. latin.4 (lines 59-60), latin.6 (22) and latin.7 (20) tell
the learner to double-tap the first bar and then the last: by this reading the code ignores which bar is tapped.

This is a question for `shipped` (FABLE §1: every step playable), not for this lane: either a device check
shows a learner can set those loops, or the loop scaffold of steps 18, 20 and 23 is not playable as written
and the record, the lessons or the app changes. Recorded, not fixed (the brief's files exclude `app/src` and
the lessons). The ranges in `latin4Completion.test.ts` stand for the rows such loops would write; the test does
not show a learner can make them.

**Plan's badge for latin.4 when met** (reported, unchanged; Entry 252's own seam): `rungBadge` returns
`RUNG_TEXT.met`, the word *complete* (`app/src/ui/help.ts` 776 and 1005), drawn by Plan as a badge in the
*passed* style (`PlanScreen.ts` 248-254).
