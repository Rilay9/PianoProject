# 2026-09-05 — P2 decisions: ScoreModel extraction and OSMD behaviour

Everything here was verified against OpenSheetMusicDisplay 2.1.2 by running it,
not inferred from its documentation. Where a claim is testable, the test that
holds it is named.

## 1. The step traversal is the cursor's own, by construction

`docs/01-architecture.md` §4.1 requires `step.index === the number of
cursor.next() calls from reset`. Reading the shipped bundle:

* `Cursor.next()` is `this.iterator.moveToNextVisibleVoiceEntry(false)`,
  **not** `moveToNext()` — it skips positions with no visible voice entry.
* `Cursor.reset()` is `resetIterator()`, which builds the iterator from
  `MusicPartManager` after setting `Sheet.SelectionStart/End` from
  `rules.MinMeasureToDrawIndex..MaxMeasureToDrawIndex`.

So `extractScoreModel` walks a `MusicPartManagerIterator` with
`moveToNextVisibleVoiceEntry(false)`, and the invariant falls out rather than
being maintained. Two consequences:

* **A draw range clamps the cursor.** Extracting a model from a windowed OSMD
  instance yields a model of just the window. `OsmdView.extractModel()` throws
  if a range is set, and `WindowRenderer` is always given a model extracted
  beforehand.
* **The invariant is checked against a real cursor**, not against the same code
  path: `tests/e2e/score.spec.ts` renders each of the 41 fixtures in Chromium
  and counts live `cursor.next()` calls. jsdom cannot render (see §5), so the
  Vitest side compares against an independently written iterator walk instead.

## 2. Repeats are unrolled by the iterator — confirmed

`edge/repeat-endings.musicxml` (forward repeat, 1st ending, 2nd ending) plays
m1, m2, m1, m3: six steps over three printed bars, with
`CurrentRepetitionIteration` going 1,1,1,2,2,2 and `CurrentEnrolledTimestamp`
advancing monotonically while `CurrentSourceTimestamp` jumps back.

Every step therefore carries both indexes: `measureIndex` (playback order,
which only ever increases) and `sourceMeasureIndex` (printed, which goes back).
The renderer windows on the printed index; the engine times on the unrolled
one. `ScoreNote.id` uses the unrolled index, so the same printed note gets a
different id on each pass — which is what a per-pass score needs.

## 3. Units, measured not assumed

| OSMD | Meaning | Conversion |
|---|---|---|
| `Note.halfTone` | semitones, C4 = 48 | MIDI = `halfTone + 12` (A0 → 21, C8 → 108) |
| `Fraction.RealValue` on lengths and timestamps | whole notes | beats = `× 4` |
| `iterator.CurrentBpm` | follows the **unrolled** timeline | used directly for `tempoMap` |

`tempoMap` is built from `CurrentBpm` rather than from
`SourceMeasure.TempoExpressions` because expressions carry *printed*
timestamps: a tempo change inside a repeated section has to fire on every pass,
and only the iterator knows that.

## 4. A step may legitimately hold no notes

The doc annotates `ScoreStep.notes` as "≥1". Two real cases break that, and
both must keep their step or the cursor invariant fails:

* a step whose only voice entries are rests;
* a step whose only note continues a tie already merged into the note that
  started it.

`docs/05-score-follow-engine.md` §1.1 already requires the engine to pass
through steps whose expected set is empty ("silent placeholders … so the
display stays aligned"), so nothing downstream needs a new rule. `ScoreStep`
documents it.

## 5. Tests split between Vitest and Playwright because jsdom cannot render

OSMD parses fine under jsdom but `render()` throws `Cannot set properties of
null (setting 'font')` — VexFlow measures text through a canvas 2D context that
jsdom does not implement. Installing the `canvas` package would fix it at the
cost of a native build; Chromium gives a better answer anyway, since it is the
target. So:

* **Vitest (jsdom, parse only):** golden models for all 41 fixtures, structural
  invariants, `beatToMs`.
* **Playwright (Chromium, real rendering):** the live-cursor step count,
  windowing, the note → SVG map, colouring, layouts, timings, screenshots.

## 6. Note colouring resolves per notehead, not per voice entry

`VexFlowGraphicalNote.getSVGGElement()` returns the group for the whole *voice
entry*, so all three notes of a chord share one element — colouring one would
colour all three, and P3 has to show a chord where two notes were right and one
was wrong. `OsmdView` uses `getNoteheadSVGs()[vfnoteIndex]` instead, falling
back to the group when there is no separate notehead. The e2e test "each note
of a chord gets its own element" is the regression guard.

Drawn notes are keyed by **printed** identity (`printedNoteKey`: printed
measure index, staff, voice, printed onset, pitch), because an element inside a
repeated section is drawn once and visited on every pass. `ScoreNote` gained
`sourceOnset` to make that key exact.

## 7. Cross-staff notes keep the hand of their voice

The doc says "staff 1→R, 2→L, unless MusicXML cross-staff says otherwise". The
refinement: a left-hand voice reaching up onto the treble staff is *played* by
the left hand. The home staff of each voice is decided by a histogram over the
whole piece, which is robust where a per-note rule is not — voice numbering
(1–4 upper, 5–8 lower) is a MuseScore/Finale habit, not a MusicXML rule.
`ScoreNote` reports the printed `staff`, the playing `hand`, and a `crossStaff`
flag when they disagree.

## 8. Known OSMD defect: a sixteenth-note grace truncates its measure

A `<grace>` note with `<type>sixteenth</type>` makes OSMD read the whole
measure's duration as a single quarter (or 0 when the grace group opens the
bar); the iterator then stops after the first entry and the rest of the bar is
silently lost. An eighth-note grace in the same bar parses correctly.

`tests/fixtures/scores/edge/known-issues/grace-sixteenth-truncation.musicxml`
is a minimal repro and `tests/unit/scoreModelKnownIssues.test.ts` asserts the
broken behaviour on purpose, so an OSMD upgrade tells us the workaround can go.

**It does not currently affect the planned repertoire.** All 69 files of the
`[MT]` library (`musetrainer/library`) were parsed and rendered as a one-off
check: 0 failures in Chromium, 60,514 steps. A crude "measure shorter than half
its time signature" scan flagged 6 files, but none of the flagged measures
contains a short-type grace note — the pattern (regular pairs) is consistent
with bars legitimately split at repeat boundaries. P4/P5 should still normalise
grace `<type>` on import, and should re-run that scan over whatever it imports.

## 9. Fit is a CSS transform, not an OSMD zoom

Re-rendering to fit costs ~10 ms and replaces every note element, which would
invalidate the id → element map on every resize. A `transform: scale()` on the
buffer wrapper costs one style write and leaves the elements identical.
`OsmdView.zoom` still exists for a real engraving-size change (the ± control).

## 10. The pre-render is deferred by one frame

`WindowRenderer` draws the *next* window into the spare buffer, but doing it
inline put a full ~10 ms render inside the very swap it was meant to make free
(measured: 5.90 ms per swap). Scheduling it with `requestAnimationFrame` drops
the swap to **0.80 ms**, comfortably inside one frame, and the learner has
already seen the new window by the time the next one is drawn.
