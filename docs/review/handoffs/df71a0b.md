# Reviewer handoff — T53c, fingering truth, third (its own seam; gates D0)

Implementation HEAD: df71a0b (T53c's commit on its worktree branch, merged into the branch after F1's a94baee; generator, fingering tests and the test map only)

## What changed

- **G48, the minor scales by form and direction** — the reviewer's requirement, modelled: `NATURAL_MINOR_FINGERING` (twelve explicit rows), `MINOR_FINGERING` (harmonic; natural; melodic ascending, the harmonic-headed table that Clementi's melodic ascents print; melodic descending, the natural table, those being the natural minor's notes), `MINOR_SCALE_FORMS`, and `make_scale` building each direction from its own table; no item id, key or pitch special-cased. The one-octave G♯ natural table matches Kelley's 32132143 digit for digit and Clementi's printed descent (the thumb on E and B, never F♯); the pattern starts and ends on 3, so no join entry is needed. A diagnostic over all twelve of Clementi's descents shows the harmonic table's thumbs matched his natural notes in 23 of 24 hands before, the 24th being G♯'s left hand, and 24 of 24 after. The T53b pin is replaced (class: replace; the old assumption "five G♯ items with the thumb on F♯ are a known fault") by a thumb-on-black rule over all 252 scale items with no exception.
- **G49, path (b): no fingering on any broken seventh.** Twelve searches and seven reads (03:15–03:21, 03:46–03:48) found nothing that fingers a seventh chord broken up to the octave and back; McLain's rule covers two-octave arpeggios that carry on through the octave, and this figure turns there. `fingeringVerified` is now the same variable as the print. Twenty-one white-root items lose their printed 1-2-3-4-5-4-3-2 / 5-4-3-2-1-2-3-4; the fifteen black-root items were already unprinted.
- **G45, done because a source turned up**: McLain, *Class Piano* ch. 9, "Chromatic Scale Fingering", gives RH 2 3 1 3 1 2 3 1 3 1 3 1 2 and LH 1 3 1 3 2 1 3 1 3 1 3 2 1 from C, with the left hand's E on 2; `chromatic_finger`'s thumb-on-the-first-note exception now applies to the right hand only, so the left hand from E begins 2-1 (three items).
- **The diff of every staff in the plan** (1,937 staves across 1,153 items, before and after): fingering changed on exactly 50 staves in 29 items — the five G♯ items, the three chromatic-from-E items, the 21 white-root broken sevenths; no note changed; no `fingeringVerified` changed except the broken sevenths' unification; G♯ harmonic, every G♯ right hand, B♭ minor and every other key's natural and melodic scales unchanged.
- `test_fingering.py` untouched (G46's owner). The test map's row and file-list line spliced as text.

## As a learner meets it (read from the built files by the builder; no screen; nothing heard)

G♯ natural minor two octaves, left hand: G♯3(3) A♯3(2) B3(1) C♯4(3) D♯4(2) E4(1) F♯4(4) G♯4(3) … then the mirror, the thumb only on B and E; it printed the thumb on F♯ four times. G♯ melodic minor coming down: F♯(4) E(1) D♯(2) C♯(3) B(1) A♯(2) G♯(3), where it was F♯(1) E(2) D♯(3) C♯(4); going up unchanged with the thumb on F𝄪. A broken C major seventh: the same notes, no finger numbers in either hand. The chromatic scale from E, left hand: E3(2) F3(1).

## Files to inspect, in order

1. `docs/prompts/entry-86.md` — the mechanism, the sources and how each was read, the four-form model, the diff counts, the red lines, the table.
2. `docs/prompts/runs/T53c/` — `built-before.txt`, `built-after.txt`, `before-all.txt`, `after-all.txt`, `families-diff.txt`, the Clementi-descent diagnostic outputs, the red and run captures (committed this time, so the numbers can be checked).
3. `tools/content/generate_exercises.py` — `NATURAL_MINOR_FINGERING`, `MINOR_FINGERING`, `MINOR_SCALE_FORMS`, `make_scale`, `chromatic_finger`, `make_broken_seventh`.
4. `tools/content/tests/test_generator_fingering.py` — `TestTheMinorFormsFingerings` (6), the thumb rule with no exception, `TestBrokenSeventhFingering` (2), the three chromatic tests, the two mutations; `read_lilypond` now reads double accidentals and dotted durations.

## Verification

- The builder in its worktree, unpiped: content build 0 (baseline 0), validator 0, content tests 0 (995, 4 skipped), tsc 0, lint 0; vitest 1 with the known four failures in files not touched (two CRLF-checkout, two `sightReadingPromises` under load; the file alone 51 of 51); the final fingering file green 57 of 57 and red 13 of 57 against the committed generator in a scratch copy of the tools.
- The orchestrator ran nothing further by the rule of 2026-09-27 (generator and tests only; CI is the full run).
- Unverified for an expert: the natural table's other eleven keys rest on the builder's diagnostic reading of Clementi's descents (thumbs compared; a few unprinted notes at the turns unread); "the melodic minor comes down with the natural minor's fingering" is implied by Kelley's chart (no descending column) and printed by Clementi but stated in words by no source; McLain's chromatic figure was read from an image; the chromatic right hand from C starts on the thumb where McLain's figure has 2 (kept as a first-note choice); Kelley and McLain put the thumb on the 6th degree in F♯ and C♯ natural minor where the tables follow Clementi's 7th.

## Questions for the reviewer

1. Does this close the T53 chain, so D0 dispatches?
2. The broken sevenths now print no fingering at stage 7: acceptable until a source exists (the rule), or is that a teaching loss worth an expert's fingering as an authored table?

## Do not re-review

T53 and T53b (accepted); F1 (accepted); C7 and L98 (closed).
