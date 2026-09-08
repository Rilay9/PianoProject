# P21c — The next bar is always on the screen, and hearing the piece is one tap

## Common header (unchanged, applies to everything below)

Work on the branch `claude/piano-teaching-app-bo19td`. Commit early and often, conventional
commit messages. **Never name an AI model in a commit message, a comment, a doc or code — and
that includes a `Co-Authored-By` trailer.** Verify by commands you actually ran and paste the
exact output; `docs/prompts/verifying.md` is the concrete version of that rule. Keep scope;
anything you notice and do not do goes under **Follow-ups**. Report as **Done · Not
done/blocked · Follow-ups · Questions for the owner · Files touched**.

## The ask, in the owner's words (2026-09-07, first evening with the phone on the piano)

> "is there a way to play the notes for the music xml files out loud to show me what it sounds
> like? … the move by playing works great, but it seems like someone playing wouldn't have
> enough time to match the playing since they won't see the next bar in time … shouldn't the
> next bar always be visible? there's gotta be an intuitive way to use the space better and
> show more stuff or time things better"

Both exist and he found neither. Listen mode is the third entry in a dropdown labelled with a
verb that reads like an input setting; the always-see-ahead behaviour is `halfWindowScrolling`,
off by default, named after the mechanism rather than the effect. This prompt is those two
things made visible, and the read-ahead done properly rather than by a setting.

Run after P21b. Read first: `docs/04-ui-spec.md` §0 and §5, `docs/05-score-follow-engine.md`
§4, `app/src/score/WindowRenderer.ts` (`windowFor`, `showStep`, the double buffer),
`docs/decisions/2026-09-07-ux-decisions.md` decision 5.

---

## §A — The next bar is always on the screen

**A1 — Upright: two systems, and the one you are playing is never redrawn.** Today a two-bar
window in portrait is two stacked one-bar systems, and with `halfWindowScrolling` on the window
advances by one bar — which moves the bar being played from the bottom system to the top,
mid-phrase, every other bar. That is the jump he felt.

Do it the way page-turn apps do: the two systems are two *slots*. While the cursor is in the
upper slot, the lower shows what comes next. When the cursor enters the lower slot, the upper
slot is re-rendered with what comes after the lower — the eye goes top, bottom, top, and the
next bar is always in view. The slot with the cursor in it is never touched. The double buffer
already draws the next window into the spare buffer; this is the same machinery with the swap
applied to one slot rather than the whole stage. Each slot holds `barsPerWindow / 2` bars
(one, at the default of two); at `barsPerWindow` 4 each slot holds two.

The slot that changes fades in over about 150 ms rather than popping: the swap happens while
he is reading the other slot, and peripheral vision ignores a fade and notices a flash. The
swap happens the moment the cursor *enters* the other slot, not when it finishes — that is
what turns "the next bar appears as I need it" into "the next bar has been there for a whole
bar". At one bar per window there is nothing to alternate; fall back to A2's slide.

The last window of a piece has nothing after it: the other slot goes blank (not a repeat of
earlier bars), and a piece shorter than two slots draws what it has.

**A2 — Sideways: one system that slides.** Landscape draws one system, so there is nothing to
alternate. Slide the sheet left as the cursor advances, holding the cursor at about a third of
the stage width, so roughly two bars of read-ahead stay to its right. Slide by bar at the
barline, not continuously per note: a sheet that moves under a note being read is worse than
one that jumps once a bar. The scroll layout's auto-scroll (`autoScrollTo`) is the vertical
version of this; do the horizontal one the same way, with the same "manual scroll pauses
auto-scroll for 5 s" rule from `04` §5.

**A3 — The setting goes.** `halfWindowScrolling` is removed from the settings store (with the
usual migration: an old value is ignored) and from Settings → Practice; A1 and A2 are how the
window works, not an option. `04` §5 and §7 say so; `04` §7c's row about "auto-advance to next
window lead" is deleted, because this decides it.

**A4 — A beat of warning in Tempo and Listen.** The cursor band marks the current step; in the
clock-driven modes also mark the *next* step faintly (a second band at 30 % opacity) so the eye
has somewhere to go before the clock gets there. Wait mode has no clock and no next-band.

Tests: unit tests on `windowFor`/the slot logic (a 5-bar piece at 2 bars per window: which
slot holds which bar at each step, the last window blank on one side, a 1-bar piece); an e2e
on `#/score/<a bundled 8-bar piece>` that walks the steps with the MIDI mock and asserts the
system containing the cursor's bar is the same DOM node across the bars it contains (never
re-rendered), and that the bar after the cursor's is visible at every step; a landscape e2e
that the cursor's x stays within 25–45 % of the stage width from bar 3 on. Reshoot `20`–`33`
in both orientations and put `21` and `22` (upright and sideways) before/after in the report.

## §B — Hearing the piece is one tap

**B1 — A `Hear it` button on the bar**, between `▶` and the mode select, in every mode: plays
the whole piece (or the loop, if one is set) with both hands through the current Sound
destination, cursor moving, nothing judged; tapping it again stops. It is Listen mode without
having to know that Listen mode exists. The mode select stays as the way to *stay* in Listen
mode; `Hear it` does not change the selected mode.

**B2 — The modes say what they do.** The select's labels become `Wait for me`, `Keep tempo`,
`Play it to me`, `Free play`. The ids do not change (`wait`, `tempo`, `listen`, `free`), so
nothing that stores a mode is touched.

**B3 — The other hand plays by default, and says so.** `playbackHands` defaults to
`non-focused` already; with `R` or `L` selected, the status line under the title says `Playing
the left hand for you` (or right) the first time in a run, so he knows the sound is the app and
not a fault.

Tests: e2e that `Hear it` starts a run with `playbackHands: 'both'` and no judging, stops on
the second tap, and leaves the mode select where it was; unit test that the four labels map to
the four unchanged ids. Reshoot `20` and `26`.

## §C — Prove

`npm run lint`, `npm run test`, `CI=1 npx playwright test` from `app/`, each to a file, last
line and `EXIT=` pasted. `npm run tour` once at the end: zero gaps, zero identical. Pictures
named above, one line each on what you see.
