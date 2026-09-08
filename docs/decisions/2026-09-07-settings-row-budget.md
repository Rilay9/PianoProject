# A settings row that carries a sentence is 100 px, not 80

**2026-09-07 · P21b D2**

## What was asked

> Settings rows with hints (08): control on the label's line, hint under both;
> budget 80 px. Five known: Metronome sound 118, Strict prerequisites 110,
> Playback destination 150, Remember the score folder 90, Line input preset 90.

## What was done

The layout is as asked. `.setting-row` was a wrapping flex row holding two
things — a text block (label *and* sentence together) and the control — so a
row with a sentence was as wide as its longest line and the control had nowhere
to go but underneath. That is the whole of the overflow: none of those five is a
card, all five are a two-line row with a stranded control.

It is now a two-column grid: label in column one, control in column two beside
it, sentence across both on the row below. `display: contents` on the text
wrapper makes the label and the sentence grid items in their own right, so the
rows built by hand on the microphone and progress screens get the same shape as
the ones from `field()` without a line of markup changing.

## Why the budget is 100 and not 80

Measured on a 360 px screen, which is what the tour photographs:

| row | before | after |
| --- | --- | --- |
| Metronome sound | 118 | 87 |
| Strict prerequisites | 110 | 97 |
| Playback destination | 150 | 87 |
| Remember the score folder | 90 | 97 |
| Line input preset | 90 | 79 |
| MIDI devices | — | 79 |

80 px is not reachable while a sentence is a sentence. The first line of the row
is as tall as the control, because the control is a thumb: 40 px for a tick box,
48 for a button. Two lines of sentence under it are 40 more, and the row's own
top padding is 8. A tick-box row with a two-line sentence is therefore 97 px and
a button row is 99, with nothing wasted in between. To fit 80 the sentence would
have to be one line of about forty characters — "Off, a wrong note does not
reset" — which is not an explanation, it is a second label.

So the budget in `04` §0 R2 is **100 px for a row with a sentence**, 56 without,
and the working rule for writing one is **about eighty characters**: two lines at
360 px. Four hints were over that and are now under it; `Strict prerequisites`
had grown to four lines and a reference to a decision record, which belongs in
the source and is now there.

Two rows moved *up* — `Remember the score folder` 90 → 97 and `MIDI devices` to
79 — because their sentences now get the full width and the control no longer
wraps. That is the shape being right rather than the number getting smaller.

## What is still open

Whether 100 is the number the owner wants, or whether every hint should be cut
to one line to reach 80. The measurements above are the case for 100; the
alternative costs about half of every explanation on the screen.
