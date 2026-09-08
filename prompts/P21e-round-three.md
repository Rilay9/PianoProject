# P21e — Round three: the swap works; what is left is the size, the slide, and what P21d skipped

## Common header (unchanged, applies to everything below)

Work on the branch `claude/piano-teaching-app-bo19td`. Commit early and often, conventional
commit messages. **Never name an AI model in a commit message, a comment, a doc or code — and
that includes a `Co-Authored-By` trailer** (the last fifteen commits got this right; keep it
so). Verify by commands you actually ran and paste the exact output;
`docs/prompts/verifying.md` is the concrete version of that rule. Keep scope; anything you
notice and do not do goes under **Follow-ups**. Report as **Done · Not done/blocked ·
Follow-ups · Questions for the owner · Files touched** — and **Not done must list every
numbered item of the prompt that was not done**, not only the ones you chose to mention. P21d's
report listed one deviation and three follow-ups and did not say that §A6, the tablet rule and
§D1–D3 were untouched. That is what the tour is for, and it found them; it should not have to.

## What this is

The third tour, on `4ea470d` (P21c and P21d as delivered), 2026-09-08 03:30, plus a sequence
run that drove the score screen bar by bar with the spoofed piano in both orientations
(`app/tests/tour/sequence.spec.ts`, added by this prompt — see §E).

**What is right.** The slot swap is exactly as specified: with the cursor on the last note of
bar 1 the next bar is below it; entering bar 2 leaves bar 2 untouched and the top slot becomes
bar 3; entering bar 3 the bottom becomes bar 4, and so on to the end. Seven photographs and a
log of both slots at every step agree. `Hear it` is on the bar, the modes say what they do,
long-press plays a bar, the beat is visible, paper is dark, the metronome and skills screens use
both halves sideways, Library and lessons are two columns sideways, sub-screen titles share the
back link's line. Keep all of it.

---

## §A — The score screen

**A1 — Upright, the bar wraps again** (`20`, `21`–`33` upright, every sequence frame): `Hear
it` pushed `⋯` onto a second row and the mode select reads `Wait fo`. One row is the rule
(`04` §5). Sideways it fits. Upright: the mode select's labels shorten to `Wait · Tempo · Play
· Free` below 400 px (the long names stay in the sheet and sideways), and if that is not enough
`Hear it` becomes `▶♪` with its label as `aria-label`. Measure, do not guess: the bar's
`scrollHeight` at 360 px must equal one row.

**A2 — The notation changes size from window to window.** The sequence log has the slot
height at 272 px for bars 1–2, 334 px for bars 2–3, 294 px for bars 4–5: the fit runs per
window, so a bar with three notes is engraved larger than a bar with four, and the staff grows
and shrinks under his eyes as he plays. Fit **once per piece**, to the window that needs the
most height, and hold that zoom for the run. A change of window must not change the size of a
staff line. Unit test: after `fitToStage` the zoom is the same for every window of *Mary Had a
Little Lamb*; e2e: the front buffer's height is identical (± 2 px) at every frame of the
sequence.

**A3 — Sideways, the slide is a two-bar jump with the cursor at the left edge.** P21c A2 asked
for a slide by one bar at the barline with the cursor held about a third of the way in. Measured:
the cursor sits at 11 % of the width after a jump and 50 % before the next, and the window
moves two bars at a time. Stride one bar, cursor kept in 25–45 %; the e2e in P21c §A (the
cursor's x from bar 3 on) is the test, and it must be in the suite.

**A4 — Bar numbers start at 0.** The authored songs number their first measure `0`
(`content/scores/authored/…`, from the generator): the sheet prints `0` on the first system
and the second system says `1`. Number from 1 in the generator and rebuild; a pickup bar is
the only measure that may be 0, and *Mary Had a Little Lamb* has none.

**A5 — P21d §A6, verbatim, not done:** the header into the bar's left end, the stage taking
the bar's row while the bar hides, the keyboard strip at 56 px sideways and the `ribbon`
option, `drawMetronomeMarks: false` and OSMD's page margins at 0, the per-scene stage-share and
ink-share lines in the audit. And **the tablet rule** (the window holds as many bars as fill
the height). Read P21d §A6 again and do all of it; the stage sideways grows during a run
already (194 → 242 px in the log, because the bar hides), which is the first half of one item.

## §B — The PDF viewer: P21d §D1–D3, verbatim, not done

Fill the height with the following systems dimmed (D1); one row of chrome, bpm and bars behind
the Timed chip, Adjust cuts as text (D2); Timed learns its interval from the last two taps
(D3). D4 (dark paper) and D5 (turn the phone) are done and stay. `66` sideways still shows two
rows of chips above the page and a bpm row below it.

## §C — Sideways leftovers

**C1 — Today still has three header rows** (`01` sideways): the MIDI chip on a row of its own,
then the week line, then the length chips. P21d A1 asked for one line: week line left, length
chips and the MIDI chip right. The cards below are two columns and right.

**C2 — Plan's grid mixes stage rows and lesson rows** (`03` sideways): `Stage 1 · First notes`
appears mid-grid in the right column between two lessons of Stage 0, so the hierarchy is gone.
A stage row spans both columns; its lessons flow in two columns under it; the next stage row
spans again. `grid-column: 1 / -1` on `[data-stage]` rows.

**C3 — The `ink-flush` check is wrong under the slide.** It reports the notation at −515 to
−3,558 px from the stage edge in every sideways score scene: it measures the whole sheet, which
under the slide is wider than the stage by design. Measure the *visible* ink (the sheet's box
clipped to the stage) and report the inset from the stage's left and right edges as P21b asked.

**C4 — R5's selector.** `12-lesson` 129 px, `90-lesson-locked` 181 px, `74-paper-summary`
322 px are the check not knowing where a lesson's or a run's first content is. Teach it
`.lesson-text`, the first option card, and the paper readout; then any real finding stands out.

## §D — Two decisions, so nothing waits on the owner

**D1 — The folder row** (102 px against 96): `level 1.0 est.`, `in-copyright`, `lyrics` are
facts, not states, and do not need to be badges. They join the detail line as tokens —
`Composer 0 · 16 bars · level 1.0 est. · in-copyright · lyrics` — with B3's whole-token
truncation. Two lines, about 72 px. A badge is for a *state* (rusty, passed, import needed).

**D2 — `barsPerWindow` stays at 2** upright (one bar per slot). The swap gives a full bar of
warning at that setting and the owner chooses for himself in P20 step 9; no measurement is
owed here.

## §E — The sequence is part of the tour now

`app/tests/tour/sequence.spec.ts` is committed with this prompt: it opens *Mary Had a Little
Lamb* in Wait mode, plays it with the MIDI mock, and photographs the last note of bar 1, the
first of bar 2, the last of bar 2, the first of bar 3, and the first of bars 4, 5 and 6, in
both orientations, with a JSON log of every slot's box and cursor state. Wire it as `npm run
tour:sequence`, run it from `npm run tour` after the scenes, put its frames on the contact
sheet as `22a`–`22g`, and add three assertions from its log: the front slot's height is the
same at every frame (A2), the bar after the cursor's is on screen at every frame, and sideways
the cursor's x is within 25–45 % of the stage from `22d` on (A3).

## §F — Prove

`npm run lint`, `npm run test`, `CI=1 npx playwright test` from `app/`, each to a file, last
line and `EXIT=` pasted. `npm run tour` once at the end: zero gaps, zero identical, `ink-flush`
and R5 clean or explained per scene. Before/after: `20` upright (the bar), `22a`–`22g` both
ways, `66` sideways, `01` and `03` sideways, `80` upright, and `20` sideways in the three
`keys` states. One line each on what you see.
