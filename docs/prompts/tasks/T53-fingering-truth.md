# T53 — Fingering truth: the generator's arpeggios, one authored score, two comments (small; P0; written 2026-09-26 for the reviewer's pre-dispatch read; after C7 unless the reviewer says before)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/prompts/entry-82.md` (F0's finding: "P0 in the generator"); `docs/prompts/f0-arpeggio-fingering-scan.txt` and the builder's `fingerscan.py` rules quoted in Entry 82 (89 of 120 arpeggio items flagged); the matrix rows G41, R48, G42, G30 (`docs/prompts/views/backlog/G.md`, `R.md`); `tools/content/generate_exercises.py` (the arpeggio makers and their fingering tables; the A♭ spelling), `tools/content/tests/test_generator_fingering.py` (what it checks and why it did not catch this), `tools/content/tests/test_generator_invariants.py` (the fingering policy: no fingering printed on shapes the tables cannot finger); `content/lessons/4.3.md` (the warning F0 left and the `lessonClaimsAboutMusic` row tied to it); the *Ode to Joy (full)* score at bar 12; `app/src/engine/drills/special.ts:202–205` and `generate_exercises.py:2834–2837` (the old half-pedal model in comments).

## The goal, in the orchestrator's words

A learner opening a two-octave left-hand arpeggio sees 5-3-2-**5**-3-2-1 printed going up, which no hand plays; black-key arpeggios put finger 2 on two consecutive notes a fourth apart; A♭ major is spelled with G♯; and *Ode to Joy (full)* prints finger 5 on G3 under a thumb on C4. F0 could not touch the generator, so lesson 4.3 warns the learner that the printed left hand is wrong. That warning is the right stopgap and the wrong end state: printed fingering is the app teaching, and a wrong fingering is never-teach-wrong at P0. After this task no arpeggio item prints a fingering a hand cannot play, the score is right at bar 12, the two comments say what the corrected lesson says, and 4.3's warning is gone.

## What is decided

1. **The arpeggio fingering** (G41): the two-octave left-hand table is corrected to a playable pattern (the common 5-4-2-1 / 5-3-2-1 families are the reference; the builder says which and why in the entry, with the same source discipline as F0 — a fingering reference the owner can open, or the teacher's judgement written as one); the black-key arpeggios get a fingering with no consecutive finger on non-repeated notes; A♭ major is spelled A♭. Where a shape cannot be fingered honestly by a table, **print no fingering** rather than a wrong one — the generator already does this for one scale family (`generate_exercises.py:4236`, "No fingering is printed") — and the item says so in its contract notes. The mechanism, verified by the orchestrator and the reviewer at `generate_exercises.py:869–871`: `make_arpeggio` builds multi-octave fingering as `table[:3] * octaves + [table[3]]`, which for a white-root left-hand table `[5, 3, 2, 1]` yields 5-3-2-5-3-2-1 and for a black-root right-hand table repeats finger 2 across the octave join; the fix is the construction, not a patch per key. Source-backed expected sequences per key are the truth where available; the mechanical adversaries (the same finger on two different adjacent pitches; finger 5 mid-ascent) are guards, never substitutes for a source. The *Ode to Joy (full)* score is `content/scores/authored/ode-to-joy-full.abc`. Red first: the scan's cases as a test in `test_generator_fingering.py` (no consecutive identical finger on different pitches; no finger 5 mid-ascent in the left hand's rising pattern; the thumb never on a black key in these shapes unless the table says so and a source backs it; spelling matches the key), seen failing on the committed generator, then green.
2. **The score** (R48): bar 12's right-hand fingering corrected in the authored *Ode to Joy (full)*; a test reads the bar and refuses a finger above the thumb on a lower pitch.
3. **The comments** (G42): both rewritten to the dampers' partial engagement, no register claim.
4. **4.3's warning** removed and its test row replaced by one that asserts the printed fingering is now the one the lesson teaches (the row fails if the generator regresses).
5. **The content build** rerun; the catalogue's affected items regenerated; the mutation census extended so a wrong fingering table makes the new check go red.

## Rules and files

You own `tools/content/generate_exercises.py` (the arpeggio makers, their tables, the spelling — nothing else in the file), `tools/content/tests/test_generator_fingering.py`, the authored score file for *Ode to Joy (full)* (find it through the catalogue; say the path), `content/lessons/4.3.md` and its rows in `app/tests/unit/lessonClaimsAboutMusic.test.ts`, `app/src/engine/drills/special.ts` (the comment only), `docs/08-test-map.md`, `docs/02-curriculum.md:351` (the one-octave fingering sentence made true for two octaves). Never name an AI model. Never assert a number measured on this machine. Every change red first; every touched test classified. Runs unpiped: the content build, validator and content tests from the repository root; `npx tsc -b`, `npm run lint`, `npx vitest run` from `app/`; no browser. Before any JSON is re-serialised, the round-trip check in `CLAUDE.md`. No commits, no push, no stash, never `git add`. Your entry to your scratch folder as `ENTRY.md`, headed "### Entry NN — T53: …" with the number given at dispatch, with a table of every fingering changed: item, before, after, source or judgement.

## When to deviate

If a correct fingering for a shape needs a judgement you cannot source and cannot write honestly as a heuristic, print no fingering on that shape and list it for the outside expert. Never trade one wrong fingering for another.

## Report

Judgement first: what a learner now sees on the two-octave left-hand C major arpeggio and on an A♭ major arpeggio, and bar 12 of *Ode to Joy*; then Done / Not done / Follow-ups / Questions / Files; the fingering table; the red lines; exit codes; unverified beside what passes (which fingerings an expert must still confirm).

**Delivered 2026-09-27**, Entry 84: one sourced chart and one construction for both arpeggio makers, spelling by interval, the Ode bar, the two comments, 4.3's warning gone; the mutation census in `test_generator_invariants.py` not extended (not in the files; the equivalent five mutations live in the fingering tests); the same fault found in four B♭ minor scales and the broken sevenths' spelling (G43, G44).

## Record

lane: T53 · closes: — · entry: 84
index: Fingering truth: the generator's arpeggio fingering (89 of 120 items flagged; 5-3-2-5-3-2-1 ascending in the left hand), Ode to Joy bar 12, two half-pedal comments, 4.3's warning removed | build | **done 2026-09-27**, Entry 84; **accepted by the reviewer** for the triads, spelling, the Ode bar and 4.3; T53b required before D0 |
state: closed: the T53 chain closed (T53c's row)
