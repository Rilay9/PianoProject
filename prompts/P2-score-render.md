# P2 — Score rendering + ScoreModel  ·  Intended model: **Opus 5**  ·  Branch: `feat/p2-score`

(Include `_COMMON-HEADER.md`.)

Read: `docs/01-architecture.md` §4.1, §6; `docs/04-ui-spec.md` §5; `docs/05-score-follow-engine.md` §1.

## Build

1. Install `opensheetmusicdisplay@2.1.2`. Write `score/OsmdView.ts` wrapping load/render
   with options: `drawFromMeasureNumber`, `drawUpToMeasureNumber`, zoom, `autoResize: false`,
   compact engraving rules for phones (smaller margins, no title/composer header, fingering on).
2. `score/extractScoreModel.ts`: walk the OSMD cursor from reset to end **once**, building
   `ScoreStep[]` exactly aligned with cursor positions (step.index == number of `next()`
   calls). Merge ties into the first note; mark grace notes; capture staff/hand, voice,
   fingering, measure indexes (unrolled and printed); build `tempoMap` from `<sound tempo>`/
   metronome marks and a default; `timeSigMap`; `beatToMs`. Handle: chords, two voices per
   staff, repeats with 1st/2nd endings (OSMD's iterator unrolls — confirm and document), pickup
   bars, cross-staff notation, 6/8, triplets/tuplets, tempo change mid-piece.
3. Fixtures: generate with `python tools/content/generate_exercises.py --quick --out
   app/tests/fixtures/scores/generated --catalog /tmp/c.json` (needs `pip install -r
   tools/content/requirements.txt`) and hand-write ≥ 6 small MusicXML edge-case files. Golden
   JSON per fixture; a test asserting `steps.length === count of cursor.next()` for each.
4. `score/WindowRenderer.ts`: Window layout (N bars, fit-to-width landscape / fit-to-height
   portrait, double-buffered next window, `barsPerWindow` 1–8, half-window scrolling option)
   and Scroll layout (full render, auto-scroll target 25–40 % of viewport). Expose
   `showStep(stepIndex)` that moves the cursor overlay and swaps windows when needed, and
   `noteElements(stepIndex): Map<noteId, SVGGElement>` for colouring; hand dimming via a CSS
   class on the staff group.
5. Dev route `/dev/score`: pick a bundled fixture or drop a `.musicxml/.mxl` (unzip in-browser
   with `fflate`); arrows step the cursor; keys 1–8 set bars-per-window; `L` toggles layout;
   shows render timings in a corner (feed the Diagnostics timing log from P1).
6. E2E screenshot tests for window sizes 1/2/4 in both orientations on two fixtures.

## Acceptance
Golden tests pass; step-count invariant holds on all fixtures; 2-bar render < 150 ms on
desktop Chromium (log it); no OSMD exceptions on any fixture or on the `[MT]` library files
if present.
