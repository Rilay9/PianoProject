# The first run on the real phone

2026-09-07. The owner installed the Pages build on the S25, connected the HP-130 and played
*Suo Gân*. Three things came back: a run that would not advance, a diagnostic that contradicted
itself, and a screen that was two-thirds empty.

## The run that would not advance

**The engine was right the whole time.** Bar 1 of *Suo Gân* is D4 · E4 · F♯4 · A4; the two
green noteheads behind the cursor are D4 and E4, and it was waiting for F♯4 — MIDI 66. The
debug report's last hundred messages cover about forty seconds of trying, and every note-on in
them is one of E3, F3, G3, A3, B3, C4, D4, E4. **F♯4 was never sent.** The highest note played
was E4.

So the question is not why the app refused, it is why the note could not be found. The Score
screen built its keyboard strip with **no range**, which means all 88 keys. On a 360 px screen
that is 52 white keys at about 7 px each, and the blue key marking the expected note was a
sliver among eighty-eight slivers.

The drill screen has called `scrollToMiddleC()` since P8. The Score screen never scrolled the
strip at all, and never fitted it. That asymmetry is why drills felt fine and this did not.

The strip now takes the range the piece actually uses, padded to whole octaves with a floor of
two, and follows the expected note when a piece is wider than the screen. For *Suo Gân*: 88 keys
become 25 — C4 to C6 — and the key it asks for is wide enough to hit.

`scrollToNote` also does what its comment had always claimed and only now does: nothing, when
the key is already comfortably in view. Called on every step, the old unconditional version
would have slid the strip under a finger on every note.

## The diagnostic that contradicted itself

The report said `precached 0/1258` and listed `catalog.json` as missing — on a phone holding
**1,413 cache entries** that had just run the whole app. Both cannot be true.

`caches.match(url)` was asked for a bare URL. Workbox stores a revisioned entry under the URL
*plus* `?__WB_REVISION__=<hash>`, and every content file is revisioned — only the built assets
carry a hash in their name. So every one of the 1,258 read as missing. One `ignoreSearch: true`.

The reason it shipped is the test: the assertion was `toContainText('Precached')`, which passes
just as happily on "Precached 0 of 1258". It reads both numbers now and requires them equal.
Checked both ways — the old code against the new assertion fails with *"Diagnostics says 0 of
1258 are precached"*, which is the owner's report reproduced in a browser.

This is also check 2 of the owner guide's §9 script, so it would have had him reporting a
failure that was not one.

## The screen that was two-thirds empty

Measured on the S25: the stage is 360 × 708 and the two-bar window drew 358 × 237 — a third of
the height, the rest black, with the notes at desktop size on a phone propped on a music stand.

The existing `fit()` scales the drawn sheet with a CSS transform, but only ever *downwards*
(`scale < 1`). It could not help here for a better reason than that: the engraving already
filled the width, so a uniform scale that filled the height would have overflowed sideways by
3×.

What makes this solvable is a fact about OpenSheetMusicDisplay that was **measured rather than
assumed**: raising its zoom grows the staff's height and leaves the system's width where it is.

```
zoom   one-bar system      sheet
1.0    349 × 109 px        358 × 237
1.5    344 × 163 px        358 × 356
2.0    340 × 218 px        358 × 474
2.5    340 × 218 px        358 × 474   ← stops here
4.0    340 × 218 px        358 × 474
```

So the renderer now picks the zoom that fills the height, capped at 2 because that is where the
engraver stops responding — asking for more costs a render and gives nothing back. **The
two-bar window goes from 33% of the screen to 67%, and the staff from 109 px to 218 px: exactly
twice the size, with no horizontal overflow.**

Two consequences worth writing down:

- **The owner's zoom is now a multiplier on the fitted size**, not the absolute zoom handed to
  OSMD. It had to become one: a fit cancels an absolute zoom exactly, so the `＋`/`－` buttons
  would have become ornaments. 1.0 means "as big as the screen allows".
- **The fit is scheduled, not immediate.** It is computed inside a draw, and re-entering the
  draw from within itself leaves the buffers half-written — the first attempt did exactly that
  and rendered nothing at all. It measures now and redraws after the next paint, once per stage
  size, guarded so the redraw it causes cannot ask for another.

## A bug in the fix, worth recording because it is the same shape as three others this week

`setZoom` read the fitted base *after* storing the new multiplier. `fittedZoom()` divides by
`userZoom`, so it divided by the very number about to be multiplied back in, and the zoom
buttons did nothing whatsoever. Caught by the test written to prove they still worked.

## Numbers

88 keys → 25 · sheet 33% → 67% of the screen · staff 109 px → 218 px · precache 0/1258 →
1258/1258. 1,415 unit tests, 244 e2e.

## Still open, from the same report

- `Status: Connected — no MIDI inputs found` while the log is full of messages from an input
  called *USB MIDI Interface*. Most likely the cable was out when the report was generated;
  worth a second look if it recurs with the piano plugged in.

---

## Naming the note

The owner asked for the expected note to be named, and only when the existing **Note names**
setting is on — a setting that until now did nothing on the Score screen at all. In Wait mode
it puts *Waiting for F♯4* under the status line; in the clock-driven modes nothing is ever
waited for, so it says nothing. Off by default, because he reads notation and a name is a
crutch for the moment he is stuck rather than a running commentary.
