# Reviewer handoff — U92: the Skills detail line never shows a cut count (Entry 143)

Implementation HEAD: 4de29cdd (merged at 51b15bac; the entry and this handoff in the record commit at HEAD). Respond in `responses/4de29cdd.md`. U90's follow-up 1, which you ruled a separate repair (`responses/994586f9.md`); a narrow fix-forward under 788427c, dispatched with a for-information line.

## What is asked

Whether the Skills row's detail line can no longer show a number that reads as another: the count first, a visible ellipsis on `#skills-list` alone where a token is cut, the count itself measured whole at 342 px on the app's stack and under the wide face (a wrap only if the measurement demanded it); U90's title rule untouched; the Library and Today detail lines untouched. The pictures: the two rows U90 pictured, before and after, and under the wide face.

**What was wrong, measured.** On the app's stack at 342 × 740, eleven concept rows showed a count cut to a different number (*Shifting position* "1" for 15, *Swing* "8" for 81, *F major* "3" for 34) and one dropped a stage from its list; under the wide face the lines read "Stage 2 · co". Two causes, one of them a premise the brief got wrong: the detail line was one `nowrap` line clipped at the row's edge with no ellipsis, and the Skills row does go through `fitDetail` (the brief said it did not), which dropped the count entirely on 71 long lines.

**The wrap was chosen by the brief's own rule, not by taste.** The builder first built the count first on one line with an ellipsis and measured it with a Range: on the stack the four three-figure counts were still cut; under the wide face 172 counts were cut. So the Skills detail wraps (`#skills-list` alone), and every count reads whole in both faces; `fitDetail` now drops tracks, then stages, never the count. The cost is height: on the stack most concept rows take two detail lines and the concept rows' combined height grows by about three tenths here; under the wide face by about a half (U100). The two pictures that decided it are under `pictures/u92/`.

**Two observations for you, neither built.** (1) 110 of 285 concept rows now lead with *0 to practise* — a question about U90's words, not their order (U101). (2) Under the wide face the stage list can split after *Stage*; a non-breaking space would fix it but changes the string's characters, so the builder left it (U101).

**Not run as the map writes it.** The whole browser suite ran at two workers on the lane's port, not four on the default port: 797 passed, 39 failed, none of the 39 opening Skills (classified by first error and scope; that none is U92's is inferred, not rerun). The tour's Skills scene is unverified.

## Files to inspect

`docs/prompts/entry-143.md` (the pictures under `pictures/u92/`); `app/src/ui/screens/SkillsScreen.ts` at the row's `meta`; `app/src/style.css` at the `#skills-list` rule; `app/tests/e2e/plan.spec.ts` at the U92 case; the unit test named in the entry.

## Not done, with the reason

See the entry's Not done lines.

## Do not re-review

U90 as accepted (`responses/994586f9.md`); every closed seam.
