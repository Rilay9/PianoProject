# P21e, done by the reviewer: one size for the run, chunks sideways, and the rest of P21d

2026-09-08. The third tour found the slot swap working and three things wrong around it; P21d
had also left five items undone without saying so. The builder attempted the size jump (A2),
disproved four theories about it and reverted. This records what was actually the matter and
what was done.

## A2 — the staff changed size between windows

Not a leak in the held scale, and not the renderer writing a transform behind the fit's back.
`fitSlots` computed the CSS scale from the ink of *whichever bars were on the screen*: a bar with
a ledger line under it has a taller ink box than a bar without, so the scale shrank to fit it
and grew back when it left. The first window carried the tempo mark above the stave as well,
which is why it was smallest of all. 272, 334 and 294 px for three windows of an eight-bar song.

The fix is to fit to the piece, not to the window. A third `OsmdView` that is never shown draws
the whole score once per zoom, one frame after the first paint; every drawn element is bucketed
to the nearest system by its y, and the tallest system — how far its ink reaches above the top
stave, the staves' own span, how far below — is what the scale fits. A window drawn at the same
zoom cannot be taller than that. The slots are placed on the *stave*, not the ink, so the staves
sit at the same height in every window even when one has a chord symbol above it and the next
does not. Until the probe has run, the tallest window seen so far stands in and is never
released. The metronome mark is no longer drawn on the score screen (the bar says the bpm) and
OSMD's page margins are zero; the fit's own six-pixel inset is the only margin.

Three things the first attempt got wrong, each found by a measurement rather than a theory:

- **Loading the probe eagerly doubled the longest score's open time** (108 s against a 60 s
  budget under a fourfold throttle). It loads on idle now, a frame after the first paint, and
  engraves only the first 48 bars; the held sizes cover what comes later.
- **A measurement arriving mid-run was the size change again, late.** On a busy phone the idle
  callback fired three bars in. A run now freezes the scale it started at — after a short wait
  for the stage to take the bar's row — and a later measurement applies at the next fit.
- **The tallest system is the wrong target.** Suo Gân's four probe systems were 79, 96, 79 and
  156 px tall; the 156 is two bars of low notes, and fitting every window to it cost 40 % of
  the size everywhere. The fit takes the upper quartile of the systems' extents above and
  below the stave; a rarer bar shrinks the sheet once when it comes, which the held sizes
  already do.

Measured with `tests/tour/sequence.spec.ts`: one scale at all seven frames in both
orientations, the staves at the same y in every one. It is now an assertion.

## A3 — the slide sideways jumped two bars and landed the cursor on the left edge

The drawn range began at the window, so a fresh chunk put the bar being played at x = 0 and
the slide — which only ever moves the sheet left — had nothing to pull it back with. The chunk
is now the window with two bars behind it and two ahead; the slide holds the cursor at a third
from the first swap on (measured: 35 %), and the swap is invisible because the same bars sit at
the same places on both sheets. The pre-render prepares the next chunk in the same shape.

## The rest of P21d, which the report had not listed as undone

- **A6.** Sideways on a phone the header row is not drawn; `← Back`, the title and the status
  line are mirrored into the bar's left end by a `MutationObserver` on the originals. During a
  run the stage takes the bar's row (`.screen--score[data-running='true'] .score-stage
  { margin-bottom: 0 }`) so there is one fit at the run's start and the bar overlays when asked
  back. The keyboard strip is 56 px sideways. A **ribbon** (`ui/KeyRibbon.ts`) is the strip's
  information as a 32 px band with the wanted note's name over it; `keyboardStrip: boolean`
  became `keys: 'strip' | 'ribbon' | 'off'` with an old `false` read as `off`, and the `⋯`
  sheet's Keys row is a three-way segment. The session takes a `KeyView` and can be handed a
  new one mid-run.
- **D1–D3.** The PDF viewer fills the height with the following systems, dimmed; the bpm and
  bars fields moved into a sheet behind the `Timed` chip and `Adjust cuts` is text at the end
  of a one-row bar; Timed learns its interval from the gap between the last two manual
  advances and says so.
- **A4.** `convert.renumber_measures`: bars numbered from 1 unless the first is a pickup. The
  authored songs — 32 of 35 — started at 0.
- **C1–C4, D1–D2 of P21e.** Today's header is one line sideways; a Plan stage row spans both
  columns; the `ink-flush` check measures the edge the sheet stops at rather than the one it
  runs past by design; the R5 check knows where a lesson's, a drill's and a paper run's content
  starts. Bars per window stays at 2.

## Round four: the state machines

The owner, on a desktop browser in tablet mode: "there's like 2 cursors, and things are fading
weird … it was barely able to do a full song without something going wrong … check your state
machines." The tour's pictures had not shown it because the tour photographs moments, and
these are faults in what happens *between* moments. Read from the code, each one confirmed by
a test that now exists:

- **Stopping was finishing.** The engine reports a stop as a `finished` event and the screen
  took every finish for the end of a run. Restarting — which changing hands, changing mode,
  setting a loop and clearing one all do — opened the summary sheet over the new run and wrote
  the half-run into the practice history as a failure. `Hear it` reaching the end did the
  same for a demonstration nobody played, under whichever mode the select showed. The session
  now swallows the finish it caused itself, and a demonstration ending is not a run.
- **A loop's lap left the cursor behind.** The engine went back to the loop's first step
  without saying so; the cursor sat on the last bar until the *second* step of the new lap
  was reached. A lap now emits the step change like any other.
- **The crossing engraved on the input path.** Upright, the slot the cursor left was re-drawn
  inside the same paint that coloured the note just played: an OSMD render between the key
  and its colour, once every crossing — the hitch every other bar, and 42–56 ms against a
  30 ms budget on the throttled desktop. The crossing is a class toggle now; the vacated slot
  is re-drawn on idle time, at the latest 100 ms later, which nobody is looking at — and a
  second note on the heels of the first is coloured before the engraving starts. The swap
  sideways no longer forces a layout to learn the stage height either; the last fit's
  measurement stands until the stage changes.
- **The bands did not follow a refit.** The cursor and the warning mark are placed in stage
  pixels; a refit — the stage taking the bar's row when a run starts, the probe's measurement
  landing, the run ending — left them where the old scale had put the notes until the next
  step. A fit now puts them back.
- **The last window doubled.** With the other slot blank at the end of a piece, the fit gave
  the remaining system the whole height: a pop the moment the summary appeared. Each slot is
  half the stage whether or not both are drawn.
- **Two cursors.** The warning mark was a second band at 30 %; it is a line under the stave.
- **The frozen scale outlived a rotation.** A run's frozen scale capped the fit of the other
  arrangement after turning the phone. A new arrangement clears it.

And the tablet: a screen at least 600 px tall has the two slots sideways as well. Fitting one
system to a 900 px height drew Suo Gân with note heads the size of a thumb, and the tour had
photographed it. `TWO_SYSTEMS_MIN_PX`.

## What the walks found, the same evening

Then the owner: "there are way better tests you could do to fix half the state machine stuff
without me doing visual inspection." Three were built (`docs/08-test-map.md`): the session's
transitions with a fake renderer, a seeded random walk over the renderer, and a seeded random
walk over the score screen with the spoofed piano, each checking invariants after every event.
In their first hour:

- **The engraver handed out dead elements.** OSMD keeps the graphical notes of every measure an
  instance has ever drawn, each still pointing at the `<g>` of the drawing it was in. Once one
  slot drew a bar the other had drawn before, the merged note map held a detached node for it:
  the band went to the page's origin and the colour to a node nobody could see. Any seek, any
  backward move, any turn of the phone. Only connected elements are handed out now.
- **A slot was engraved while `display: none`.** Blanked at the end of the piece and drawn
  again — a lap, `Again`, a step back — it laid out into a width of nought. Shown before it is
  engraved.
- **Turning the phone drew nothing.** The plan was reset and only a step draws, so the old
  arrangement sat squeezed in the new stage, band and all, until the next note; in Wait mode,
  indefinitely. The resize now redraws when the arrangement changes.
- **The warning mark outlived a stop.** The frame that would have cleared it was the one the
  stop cancelled.
- **A Wait run with nothing to wait for.** `L` on a right-hand song sat on its first step for
  ever. The screen now says so and does not start.

And the owner's simpler request — Twinkle, phone both ways up, before and after the first, a
middle and the last input — showed three more: the silent bass staff of rests that fourteen
authored one-hand songs carry took half of every window (dropped in the pipeline now); sideways
the control bar sat over the lower staff for the first three seconds of every run (0.7 s at a
run's start now); and the end of every song left the top half of the screen black (the other
slot keeps the bars just played).

And one more from the Twinkle pictures' numbers, sideways: the sheet shrank 6 % at bar 10. The
engraver had set the fingering over one high note nine units higher on that chunk's page than
on the others, the drawn group's box grew by that gap of nothing, and the "smaller, never
larger" rule honoured it. Two changes: the stave is anchored on its lines, from the engraver's
model, so a fingering set higher cannot move it; and a run keeps its scale while the fit would
shrink it by less than a tenth — that ink runs into the margin — and shrinks only for more,
where a note clipped off the stage would be the worse fault.

## Round five: the state gallery, and the slots

The builder's state gallery (`npm run states`, `docs/08` §2 driven cell by cell, each shot
measured) put a number on what the Mary pictures had shown: upright, the width limits the size,
and the two slots used 42 % of the stage on the phone and 18 % on a tablet. The owner's rule is
that the notes must not get smaller; so the height that is left over buys **more systems at the
same size**, not bigger ones and not black. The slot plan is the same arithmetic for any count
(`slots.ts`: the cursor's slot is never touched, the slots round from it hold the coming
blocks, the vacated one takes the block after the last on the screen), the renderer holds up to
four engravers for a piece the probe can measure and two for a longer one, and the count is
chosen at the first fit from the width-limited system height and held for a run like the scale.
The tablet's four-bar default went: its extra height buys slots, not bars a slot, which with
the lesson panel had made the notes small. Measured after: 67 % on the phone upright, 52 % and
78 % on the tablet, at the same or a larger scale than before; the gallery guards it as
invariant 35.

## The sequence plays the whole song

`sequence.spec.ts` now asks the app at every step what it is waiting for and plays exactly
that, from the first note to the summary sheet, on all four form factors, and photographs the
first note of every bar (`22-bar01`…) and the stage after the run has ended. It asserts that
the score moved on after every step, one scale from the first note to after the summary, the
next bar on the screen at every step but the last, and the slide holding a third across where
the sheet slides.

## Not done

**The tablet rule** (P21d: the window holds as many bars as fill the height). Two slots
sideways is done (above); three or more per screen is a real change to `slots.ts` and the
renderer, and the owner has a phone (`00` D19). Bars per window is a setting, and 4 on a
tablet puts two bars in each slot.

## The sequence is in the tour

`npm run tour` now runs `sequence.spec.ts` after the scenes: seven frames of *Mary Had a Little
Lamb* driven by the spoofed piano in both orientations, on the contact sheet as `22a`–`22g`,
with three assertions from a log of both slots at every frame — one height for the run, the
next bar always on the screen, and sideways the cursor between 25 % and 45 % of the stage from
the first chunk swap on. It is how A2 and A3 were found, and it is how they stay fixed.
