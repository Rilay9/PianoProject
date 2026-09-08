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

## Not done

**The tablet rule** (P21d: the window holds as many bars as fill the height). The slot
arithmetic is two slots; three is a real change to `slots.ts` and the renderer, and the owner
has a phone (`00` D19). Left for when a tablet exists.

## The sequence is in the tour

`npm run tour` now runs `sequence.spec.ts` after the scenes: seven frames of *Mary Had a Little
Lamb* driven by the spoofed piano in both orientations, on the contact sheet as `22a`–`22g`,
with three assertions from a log of both slots at every frame — one height for the run, the
next bar always on the screen, and sideways the cursor between 25 % and 45 % of the stage from
the first chunk swap on. It is how A2 and A3 were found, and it is how they stay fixed.
