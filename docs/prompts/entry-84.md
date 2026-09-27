### Entry 84 — T53: fingering truth — the arpeggio join fixed where it was built, every triad arpeggio read from one published chart, the black-key roots, the sevenths' left hand and the arpeggios' spelling corrected; *Ode to Joy (full)* bar 12 on the thumb; the two half-pedal comments to the dampers' partial engagement; 4.3's warning gone and its row turned round (2026-09-27)

**Judgement.** A learner no longer meets a printed arpeggio fingering that a hand cannot play, in the 120 arpeggio items the plan ships. Read from the built `.mxl` files the app loads:

1. **Two-octave left-hand C major** (`exercise.arpeggio.c-major.2oct.left`): going up C2(5) E2(4) G2(2) C3(1) E3(4) G3(2) C4(1), and coming down the mirror, 1-2-4-1-2-4-5. It printed 5-3-2-**5**-3-2-1. This is now the fingering lesson 4.3 teaches ("5-4-2-1, then finger 4 … crosses over the thumb to the next E"), and the rung's other five keys (G, F, A minor, D minor, E minor) print the same shape in both hands.
2. **A♭ major, two octaves** (`exercise.arpeggio.a-flat-major.2oct.both`): spelled A♭ C E♭ under its four-flat signature. The right hand goes A♭4(2) C5(1) E♭5(2) A♭5(4) C6(1) E♭6(2) A♭6(4), and the left hand 2-1-4-2-1-4-2. It printed G♯ for every A♭, and the right hand put finger 2 on E♭5 and again on the G♯ a fourth above it.
3. **Bar 12 of *Ode to Joy (full theme)*** (`song.classical.ode-to-joy.full`): right hand C4(1) D4(2) G3(**1**). The hand shifts after the D, the thumb takes the G, and the half note gives time to get back to C position for bar 13's E4(3). It printed finger 5 on G3 under a thumb on C4. The edition note in the score now says the same thing.

Not seen on a screen: no browser in this task, and nothing was heard. As a teacher's reading, these are the fingerings a teacher would write for these shapes. The chart supplies the key-by-key choices, the left hand's 3 or 4 for example, and the chart itself says those two fingers "are often interchangeable". Which choices an expert should still confirm is listed under *Unverified*. Three findings the reviewer should hear first:

- **The same fault was in the sevenths.** All 35 white-root seventh arpeggios printed 5-4-3-2-**5**-4-3-2-1 in the left hand, and they were 35 of Entry 82's 89 flagged items. They are fixed by the same construction.
- **The same kind of fault is in one scale family I do not own.** The B♭ minor two- and three-octave scales print right-hand A(3) → B♭(2) at each inner tonic, because `expand_fingering`'s right-hand join takes the table's first finger (2) where the table ends on 4. Four items; see Follow-ups.
- **The old tests asserted the fault.** `test_generator_fingering.py` held the left hand to `[5, 3, 2, 5, 3, 2, 1]` and the black-root right hand to `[2, 1, 2, 2, 1, 2, 4]`, so it passed. The test inventory had classed the file `preserve`.

## The mechanism, and the test that told it from the alternatives

The brief's premise holds at the lines. At HEAD, `make_arpeggio` (`generate_exercises.py:867–872`) built each hand as `table[:3] * octaves + [table[3]]`, and `make_seventh_arpeggio` built its sevenths the same way (`SEVENTH_ARPEGGIO_FINGERING_LH * octaves + [1]`). The construction gives every root inside the run the *first* root's finger. That is right only where the first root and the later roots share a finger:

- a right hand on a white root, 1 and 1, which is why it was right;
- a left hand on a black root, 2 and 2, which is also right.

It is wrong wherever they differ:

- a left hand on a white root takes 5 at the start and 1 at each join, so it printed 5 after 2;
- a right hand on a black root takes 2 at the start and 4 at each join, so it printed 2 twice.

**The discriminating test.** If the cause is the construction and not a bad table value, then every item where those two fingers differ is flagged, and no item where they agree is. The scan's counts match exactly:

- 34 white-root triad items with a left hand, plus 35 white-root sevenths, gives the scan's 69;
- 20 black-root triad items with a right hand gives its 20;
- none of the 6 right-hand-only white items is flagged.

`expand_fingering` (scales) had the same fault and already carries the fix, with a docstring telling the same story; the arpeggio makers never used it.

**The fix is the construction.** `arpeggio_ascent(first, join, top, octaves)` names the join finger instead of reusing the first. `chart_ascent` reads a chart pattern into it. Both makers call it. The tables are now one sourced table, `ARPEGGIO_CHART`: 24 keys × 2 hands, transcribed from the chart below. No per-key patch remains. The mutation `every_root_takes_the_first_finger` puts the old line back behind the chart tables and turns the guards and the chart comparison red. The generator committed at HEAD fails the same checks the same way (the red lines below).

**Spelling.** `start.transpose(12 * o + i)` is a count of semitones, and music21 spells a semitone count by pitch class. That gave 51 of the 120 items wrong spellings: G♯ for A♭, C♯/G♯ for D♭/A♭, F♯/C♯ for G♭/D♭, E♭ for D♯ in B major, G♯ for A♭ in F minor, E♭ as E major 7th's seventh, and a raised fourth in every half-diminished chord. Both makers now spell by interval, an octave at a time (`by_octaves`, `up`, and for sevenths `SEVENTH_SPELLING` with `_readable`). The mutation `by_semitones` puts the semitone spelling back and turns the spelling check red.

## The source

**Robert Kelley, Ph.D., "Arpeggio Fingering Chart for Piano, Organ, or Electric Keyboard"**, https://robertkelleyphd.com/home/teaching/keyboard/keyboard-arpeggio-fingering-chart/ (© 2026 Robert Kelley). I read it on 2026-09-26 through a fetch tool, twice; the second read asked for the verbatim text, and both gave the same patterns and key lists. It gives one four-finger pattern per hand for root, third, fifth and octave, with the keys under each pattern: RH 1231, 2124, 2312; LH 1421, 1321, 2142, 3213. Its rules:

1. "The arpeggio fingering pattern repeats every three notes, so that every octave has the same fingering."
2. "The thumb always stays on the white keys, except when there are no white keys (F♯/G♭ major and D♯/E♭ minor)."
3. "The fifth finger is only used at a starting place, a stopping place, or a turning-around place."
4. "The fourth and third finger are often interchangeable in the patterns."

**The reading of the chart is my judgement, written as a rule.** The first digit fingers the first root and the last digit every later root; this is rule 1, and it is the only reading under which 2124 gives "every octave the same fingering". The thumb gives way to 5 at the left hand's start and the right hand's turn: rule 3 permits it, and lesson 4.3 and the right hand the generator already printed both use it.

**Corroboration for the left hand's 5-start and the all-black exception.** Andrew Thayer, "Major and minor arpeggios in all inversions", https://pianoscience.blogspot.com/2020/11/major-and-minor-arpeggios-in-all.html, read through a fetch tool's summary, says the left hand starts "with the 5th finger on the initial note", and of G♭ major and E♭ minor, "we treat them no differently to if they were on white keys".

**Not read:**

- The Baylor open textbook's arpeggio appendix and D. P. Horn's Wheaton PDF: both returned 403.
- Hanon No. 41, which the old comment cited for the black-key shape. Mutopia holds only Part I (its `ftp/HanonCL` listing), and IMSLP was not opened. The claim is removed rather than kept unverified, and the old code did not follow it at the join in any case.

## Done

1. **The arpeggio fingering (G41, decided 1).** `ARPEGGIO_CHART` and the construction above.
   - **Black-key roots:** right hand 2-1-2-4, 1-2-4 (D♭, E♭, A♭, B♭ major; C♯, F♯, G♯ minor). B♭ minor is 2-3-1-2 in the right hand and 3-2-1-3 in the left, and B♭ major's left hand is 3-2-1-3.
   - **The thumb on black keys:** the old black-key table put the thumb on D♭ in B♭ minor and on G♭ in E♭ minor. It is now on white keys everywhere except G♭ major and E♭ minor, which have no white key; there the chart fingers them from the thumb (RH 1231, LH 1321 / 1421).
   - **Sevenths:** white-root sevenths keep 1-2-3-4 and 5-4-3-2, with the thumb on every later root. Black-root sevenths still print nothing and say so.
   - **Spelling:** A♭ major is spelled A♭, and every arpeggio is spelled for its key.
   - **`fingeringVerified`** is now computed from the chart (true for all 24 keys). A key missing from the chart would print no fingering and say so, the `make_blues_scale` policy.
   - No shape needed "no fingering" in place of a sourced one: every triad the plan ships is in the chart.
   - `make_arpeggio` still has no docstring. `test_generator_invariants.py` › `test_every_maker_has_a_docstring` asserts that it has none, and that file is not mine, so the explanation is in comments.
2. **The score (R48, decided 2).** `content/scores/authored/ode-to-joy-full.abc` (found through the catalogue id `song.classical.ode-to-joy.full`). Bar 12's `!5!G,2` → `!1!G,2`, and the `editionNotes` sentence ("so finger 5 takes it") corrected in the same file. New test `TestOdeToJoyBarTwelve` reads the ABC through the build's own path (`prepare_abc`, `converter.parse`, `apply_fingerings`, bars counted from 1 as `convert.renumber_measures` numbers them). It refuses a right-hand finger above the thumb on a lower pitch in any bar, allowing only 2, 3 or 4 crossing over directly after the thumb.
3. **The comments (G42, decided 3).** `app/src/engine/drills/special.ts` (the `halfPedalRange` doc comment only) and `generate_exercises.py`'s `make_pedal_variant` docstring. Both now say what technique.7 says, sourced to Lehtonen, Askenfelt and Välimäki (2009): pressed part-way, the pedal lifts the dampers only a little, so they still touch the strings, and a loud sound is cut short but not stopped. They add that a pedal sending only 0 or 127 cannot report that place. There is no register claim, and neither "cannot play (late) Romantic music" nor the treble/bass model remains.
4. **4.3's warning (decided 4).** The sentence "The left-hand fingering printed on this rung's two-octave arpeggios is wrong where the octaves join … so play the one above instead." is removed. The lesson is 583 → 548 words, and `readingTime: 3` still holds (⌈548/200⌉ = 3). Its row in `lessonClaimsAboutMusic.test.ts` › *F0* › 4.3 is replaced. The new row checks, for all six keys the lesson names:
   - each hands-separate arpeggio is on the rung;
   - the right hand prints `1231235` going up;
   - the left hand prints `5421421` going up;
   - the lesson says "The left hand going up plays 5-4-2-1" and "then finger 4 (or 3) crosses over the thumb";
   - the lesson no longer says "is wrong where the octaves join".

   Any regression of the join turns it red. The F0 block's header comment is updated to say so.
5. **The build and the census (decided 5).**
   - The content build was rerun and regenerated all 1,176 generated items. 89 arpeggio items changed fingering and 51 changed spelling (tables below). The authored Ode was reconverted ("31 cached, 1 converted").
   - The census for the new checks is `TestTheFingeringChecksGoRedOnAMutation` in `test_generator_fingering.py`, with five named mutations. Each is required to leave the real item clean and to turn its check red:
     - `every_root_takes_the_first_finger`, the shipped line, reddens the guards and the chart comparison on C major LH, A♭ major RH, E minor both, and the C dominant 7th;
     - `a_right_hand_table_on_the_left` reddens the guards;
     - `a_playable_table_the_chart_does_not_give` (5-3-2-1 for C) reddens **only** the chart comparison. The guards pass it. That is why the guards are guards and the chart is the truth;
     - `the_major_table_on_b_flat_minor` reddens the thumb-on-black guard;
     - `by_semitones` reddens the spelling check.
   - The census in `test_generator_invariants.py` is not extended (Not done).
6. **Docs.**
   - `docs/02-curriculum.md` 4.3: "RH 1-2-3-5 / LH 5-3-2-1" becomes the two-octave statement (in C, RH 1-2-3-1-2-3-5 and LH 5-4-2-1-4-2-1; the thumb on every root after the first; the fifth finger only at the ends; the other keys from one published chart). At HEAD the sentence is at `:365`, not `:351`: the file grew after F0 cited it.
   - `docs/08-test-map.md`: the *Fingering on a melodic line* row (failures, tests, status with what is unverified), the *Never teach wrong* row's note on the 4.3 row, and the file list's line for `test_generator_fingering.py`.

## The red lines

All of these were captured beside this entry, run on the committed generator, score and lesson, before any fix:

- **`red-generator-fingering.txt`**: the fingering file on the committed generator. 13 failed and 3 errored of 33. The three errors are the mutation tests that patch `ARPEGGIO_CHART`, which did not exist yet (AttributeError). They are not red for a reason about the music, and are proved by their own assertions afterwards. Each failure was red for its reason:
  - `test_a_white_root_starts_on_the_thumb_and_tops_with_the_fifth`: `[5, 3, 2, 5, 3, 2, 1] != [5, 4, 2, 1, 4, 2, 1]`;
  - `test_the_black_root_shape_takes_every_later_root_with_the_fourth`: `[2, 1, 2, 2, 1, 2, 4] != [2, 1, 2, 4, 1, 2, 4]`;
  - `test_a_chord_with_no_white_key_is_fingered_as_if_it_were_white`: G♭ `[2, 1, 2, 2, 1, 2, 4] != [1, 2, 3, 1, 2, 3, 5]`;
  - `test_a_flat_major_is_spelled_with_flats`: `'G#'` where `'A-'` was wanted;
  - `test_the_c_major_left_hand_is_the_one_the_lesson_teaches`: `[5, 3, 2, 5, 3, 2, 1]`;
  - `test_every_triad_arpeggio_in_the_plan_is_fingered_as_the_chart_reads`: 62 disagreements, the first `c-major.2oct.both: LH prints [5, 3, 2, 5, 3, 2, 1], the chart 1421 reads [5, 4, 2, 1, 4, 2, 1]`;
  - `test_no_arpeggio_in_the_plan_asks_for_a_hand_that_is_not_there`: 492 guard faults, the first `c-major.2oct.both: LH G2(2) C3(5): the hand crosses itself away from the thumb`, then `C3(5): finger 5 in the middle of the run`, the sevenths' `B-3(2) C4(5)`, and the black roots' one finger on two notes and thumb on D♭/G♭;
  - `test_every_arpeggio_in_the_plan_is_spelled_for_its_key`: 668, the first `c-half-diminished7 … F#4 is not spelled for C half-diminished7`, then B major's `E-5`, E major 7th's `E-5`, and A♭'s `G#`;
  - the seventh test: `[5, 4, 3, 2, 5, 4, 3, 2, 1] != [5, 4, 3, 2, 1, 4, 3, 2, 1]`;
  - two mutation tests red at their "the real item is clean" precondition, because the committed generator *was* the mutant state: `the_old_construction` (5 faults on C major LH) and `by_semitones` (10 `G#` notes in A♭ major);
  - the two Ode tests (next item).
- **`red-ode-bar-12.txt`**: `TestOdeToJoyBarTwelve` on the committed score. `['G3(5) under a thumb on C4'] != []` in bar 12, and `{12: ['G3(5) under a thumb on C4']}` from the sweep of every bar. The first red run read bar 13, because music21 numbers this tune from 0. The test now counts bars from 1 as the build does, and the capture is the rerun. `test_the_rule_refuses_the_bar_that_shipped` was green by design: it is the rule's unit check on the shipped bar.
- **`red-vitest-4.3-row.txt`** and **`red-vitest-4.3-row-clauses.txt`**: the new 4.3 row against the build of the committed tree, `expected false to be true`. The row is a single boolean, so the second capture reads each clause off the same built files. All six left hands print `5-3-2-5-3-2-1` (so `5421421` fails), and `lesson still warns: True`. Afterwards (`built-4.3-after.txt`): all six print `5421421` and `1231235`, and the warning is gone.
- **Mutation proofs**: the five mutation tests are green on the final tree. Green here means each check fails on its mutant, and each mutation test first asserts the real item is clean.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `test_generator_fingering` › `TestArpeggioFingering.test_a_white_root_starts_on_the_thumb_and_tops_with_the_fifth` | revise | asserted the fault: LH `[5, 3, 2, 5, 3, 2, 1]` | LH `[5, 4, 2, 1, 4, 2, 1]`, the chart and the lesson |
| › `test_a_black_root_never_takes_the_thumb` | revise | G♭ major in the list, so no thumb on its root | G♭ removed (the chart's exception, tested separately); B♭ major, D♭ major, C♯ minor, G♯ minor added |
| › `test_the_black_root_shape_is_hanons` → `test_the_black_root_shape_takes_every_later_root_with_the_fourth` | revise (renamed) | asserted the fault: RH `[2, 1, 2, 2, 1, 2, 4]`, sourced to Hanon unread | RH `[2, 1, 2, 4, 1, 2, 4]`, LH unchanged `[2, 1, 4, 2, 1, 4, 2]` |
| › `test_no_arpeggio_in_the_plan_puts_the_thumb_on_a_black_root` | revise | every black root, G♭ major and E♭ minor included | exempts the two chords with no white key; reads the plan once, shared |
| › `test_a_chord_with_no_white_key_is_fingered_as_if_it_were_white`, `test_a_flat_major_is_spelled_with_flats` | add | — | the chart's exception; A♭ spelled A♭ |
| `TestArpeggiosAgainstTheChart` (3 tests) | add | — | the chart names every key once per hand; C major LH is the lesson's; all 60 triad items, both hands, as the chart reads |
| `TestArpeggioGuards` (3 tests) | add | — | the guards over all 120 arpeggio items; spelling for the key; `fingeringVerified` true exactly where fingering is printed |
| `TestTheFingeringChecksGoRedOnAMutation` (5 tests) | add | — | the census above |
| `TestSeventhArpeggioFingering.test_a_white_root_is_one_finger_a_note_with_the_thumb_under_after_the_fourth` | revise | asserted the fault: LH `[5, 4, 3, 2, 5, 4, 3, 2, 1]` | LH `[5, 4, 3, 2, 1, 4, 3, 2, 1]` |
| `TestOdeToJoyBarTwelve` (3 tests) | add | — | bar 12 is C4(1) D4(2) G3(1); no bar puts a right-hand finger under its thumb; the rule refuses the shipped bar |
| every other test in the file (sevenths' black roots, broken seventh, walking bass, chromatic, tumbao, hands-separate) | preserve, untouched | — | — |
| `lessonClaimsAboutMusic` › *F0* › 4.3 | replace | the lesson's warning held to the fault (left hand `5325`) | the six arpeggios held to the lesson's fingering, and the warning absent |
| `test_generator_invariants` › `test_the_seventh_arpeggio_is_fingered_the_way_its_tables_say`, `test_every_maker_has_a_docstring` | preserve, untouched (not mine) | — | pass unchanged: the tables' values, the first four fingers and the docstring phrase were kept |

## Every fingering changed

Going up; the way down is the mirror, the top note once. From the probe dumps of all 120 arpeggio items before and after (`before-arpeggios.txt`, `after-arpeggios.txt`), plus the score.

| Item | Hand | Before (going up) | After (going up) | Source or judgement |
| --- | --- | --- | --- | --- |
| `exercise.arpeggio.c-major.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.c-major.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-4-2-1-4-2-1-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.c-dominant7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.c-major7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.c-minor7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.c-half-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.g-major.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.g-major.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-4-2-1-4-2-1-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.g-dominant7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.g-major7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.g-minor7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.g-half-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.d-major.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-3-2-1-3-2-1 | Kelley chart, LH 1321; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.d-major.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-3-2-1-3-2-1-3-2-1-3-2-1 | Kelley chart, LH 1321; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.d-dominant7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.d-major7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.d-minor7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.d-half-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.a-major.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-3-2-1-3-2-1 | Kelley chart, LH 1321; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.a-major.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-3-2-1-3-2-1-3-2-1-3-2-1 | Kelley chart, LH 1321; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.a-dominant7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.a-major7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.a-minor7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.a-half-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.e-major.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-3-2-1-3-2-1 | Kelley chart, LH 1321; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.e-major.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-3-2-1-3-2-1-3-2-1-3-2-1 | Kelley chart, LH 1321; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.e-dominant7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.e-major7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.e-minor7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.e-half-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.b-major.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-3-2-1-3-2-1 | Kelley chart, LH 1321; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.b-major.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-3-2-1-3-2-1-3-2-1-3-2-1 | Kelley chart, LH 1321; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.b-dominant7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.b-major7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.b-minor7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.b-half-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.f-major.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.f-major.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-4-2-1-4-2-1-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.f-dominant7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.f-major7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.f-minor7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio7.f-half-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.b-flat-major.2oct.both` | RH | 2-1-2-2-1-2-4 | 2-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.b-flat-major.2oct.both` | LH | 2-1-4-2-1-4-2 | 3-2-1-3-2-1-3 | Kelley chart, LH 3213 |
| `exercise.arpeggio.b-flat-major.4oct.both` | RH | 2-1-2-2-1-2-2-1-2-2-1-2-4 | 2-1-2-4-1-2-4-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.b-flat-major.4oct.both` | LH | 2-1-4-2-1-4-2-1-4-2-1-4-2 | 3-2-1-3-2-1-3-2-1-3-2-1-3 | Kelley chart, LH 3213 |
| `exercise.arpeggio.e-flat-major.2oct.both` | RH | 2-1-2-2-1-2-4 | 2-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.e-flat-major.4oct.both` | RH | 2-1-2-2-1-2-2-1-2-2-1-2-4 | 2-1-2-4-1-2-4-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.a-flat-major.2oct.both` | RH | 2-1-2-2-1-2-4 | 2-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.a-flat-major.4oct.both` | RH | 2-1-2-2-1-2-2-1-2-2-1-2-4 | 2-1-2-4-1-2-4-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.d-flat-major.2oct.both` | RH | 2-1-2-2-1-2-4 | 2-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.d-flat-major.4oct.both` | RH | 2-1-2-2-1-2-2-1-2-2-1-2-4 | 2-1-2-4-1-2-4-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.g-flat-major.2oct.both` | RH | 2-1-2-2-1-2-4 | 1-2-3-1-2-3-5 | Kelley chart, RH 1231; the fifth finger at the turn (chart rule 3) |
| `exercise.arpeggio.g-flat-major.2oct.both` | LH | 2-1-4-2-1-4-2 | 5-3-2-1-3-2-1 | Kelley chart, LH 1321; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.g-flat-major.4oct.both` | RH | 2-1-2-2-1-2-2-1-2-2-1-2-4 | 1-2-3-1-2-3-1-2-3-1-2-3-5 | Kelley chart, RH 1231; the fifth finger at the turn (chart rule 3) |
| `exercise.arpeggio.g-flat-major.4oct.both` | LH | 2-1-4-2-1-4-2-1-4-2-1-4-2 | 5-3-2-1-3-2-1-3-2-1-3-2-1 | Kelley chart, LH 1321; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.a-minor.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.a-minor.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-4-2-1-4-2-1-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.a-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.e-minor.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.e-minor.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-4-2-1-4-2-1-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.e-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.d-minor.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.d-minor.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-4-2-1-4-2-1-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.d-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.g-minor.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.g-minor.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-4-2-1-4-2-1-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.g-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.c-minor.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.c-minor.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-4-2-1-4-2-1-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.c-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.b-minor.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.b-minor.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-4-2-1-4-2-1-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.b-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.f-minor.2oct.both` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.f-minor.4oct.both` | LH | 5-3-2-5-3-2-5-3-2-5-3-2-1 | 5-4-2-1-4-2-1-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio7.f-diminished7.2oct.both` | LH | 5-4-3-2-5-4-3-2-1 | 5-4-3-2-1-4-3-2-1 | judgement: the chart's rules 1 and 3 (every octave alike; 5 only at start, turn, stop); the thumb on the second root — outside expert |
| `exercise.arpeggio.f-sharp-minor.2oct.both` | RH | 2-1-2-2-1-2-4 | 2-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.f-sharp-minor.4oct.both` | RH | 2-1-2-2-1-2-2-1-2-2-1-2-4 | 2-1-2-4-1-2-4-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.c-sharp-minor.2oct.both` | RH | 2-1-2-2-1-2-4 | 2-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.c-sharp-minor.4oct.both` | RH | 2-1-2-2-1-2-2-1-2-2-1-2-4 | 2-1-2-4-1-2-4-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.g-sharp-minor.2oct.both` | RH | 2-1-2-2-1-2-4 | 2-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.g-sharp-minor.4oct.both` | RH | 2-1-2-2-1-2-2-1-2-2-1-2-4 | 2-1-2-4-1-2-4-1-2-4-1-2-4 | Kelley chart, RH 2124 |
| `exercise.arpeggio.b-flat-minor.2oct.both` | RH | 2-1-2-2-1-2-4 | 2-3-1-2-3-1-2 | Kelley chart, RH 2312 |
| `exercise.arpeggio.b-flat-minor.2oct.both` | LH | 2-1-4-2-1-4-2 | 3-2-1-3-2-1-3 | Kelley chart, LH 3213 |
| `exercise.arpeggio.b-flat-minor.4oct.both` | RH | 2-1-2-2-1-2-2-1-2-2-1-2-4 | 2-3-1-2-3-1-2-3-1-2-3-1-2 | Kelley chart, RH 2312 |
| `exercise.arpeggio.b-flat-minor.4oct.both` | LH | 2-1-4-2-1-4-2-1-4-2-1-4-2 | 3-2-1-3-2-1-3-2-1-3-2-1-3 | Kelley chart, LH 3213 |
| `exercise.arpeggio.e-flat-minor.2oct.both` | RH | 2-1-2-2-1-2-4 | 1-2-3-1-2-3-5 | Kelley chart, RH 1231; the fifth finger at the turn (chart rule 3) |
| `exercise.arpeggio.e-flat-minor.2oct.both` | LH | 2-1-4-2-1-4-2 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.e-flat-minor.4oct.both` | RH | 2-1-2-2-1-2-2-1-2-2-1-2-4 | 1-2-3-1-2-3-1-2-3-1-2-3-5 | Kelley chart, RH 1231; the fifth finger at the turn (chart rule 3) |
| `exercise.arpeggio.e-flat-minor.4oct.both` | LH | 2-1-4-2-1-4-2-1-4-2-1-4-2 | 5-4-2-1-4-2-1-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.c-major.2oct.left` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.g-major.2oct.left` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.f-major.2oct.left` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.a-minor.2oct.left` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.d-minor.2oct.left` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `exercise.arpeggio.e-minor.2oct.left` | LH | 5-3-2-5-3-2-1 | 5-4-2-1-4-2-1 | Kelley chart, LH 1421; the fifth finger at the start (chart rule 3) |
| `song.classical.ode-to-joy.full`, bar 12 | RH | C4(1) D4(2) G3(5) | C4(1) D4(2) G3(1) | judgement: the shift lesson 2.5 teaches for this bar — the thumb lands on the G; no printed fingering in the MuseTrainer edition it was checked against — outside expert |

97 hand-rows changed across 89 items, plus the score's one note. The 31 arpeggio items unchanged: the 25 black-root sevenths, which print no fingering, and the six right-hand-only white items, which were right.

## Every arpeggio respelled

The first five notes of one hand, before and after (music21 names: `-` is a flat).

| Item | Before (first five notes, one hand) | After |
| --- | --- | --- |
| `exercise.arpeggio7.c-half-diminished7.2oct.both` | C4 E-4 F#4 B-4 C5 | C4 E-4 G-4 B-4 C5 |
| `exercise.arpeggio7.g-half-diminished7.2oct.both` | G4 B-4 C#5 F5 G5 | G4 B-4 D-5 F5 G5 |
| `exercise.arpeggio7.d-half-diminished7.2oct.both` | D4 F4 G#4 C5 D5 | D4 F4 A-4 C5 D5 |
| `exercise.arpeggio7.e-major7.2oct.both` | E4 G#4 B4 E-5 E5 | E4 G#4 B4 D#5 E5 |
| `exercise.arpeggio.b-major.2oct.both` | B4 E-5 F#5 B5 E-6 | B4 D#5 F#5 B5 D#6 |
| `exercise.arpeggio.b-major.4oct.both` | B3 E-4 F#4 B4 E-5 | B3 D#4 F#4 B4 D#5 |
| `exercise.arpeggio7.b-dominant7.2oct.both` | B4 E-5 F#5 A5 B5 | B4 D#5 F#5 A5 B5 |
| `exercise.arpeggio7.b-major7.2oct.both` | B4 E-5 F#5 B-5 B5 | B4 D#5 F#5 A#5 B5 |
| `exercise.arpeggio7.f-minor7.2oct.both` | F4 G#4 C5 E-5 F5 | F4 A-4 C5 E-5 F5 |
| `exercise.arpeggio7.f-half-diminished7.2oct.both` | F4 G#4 B4 E-5 F5 | F4 A-4 B4 E-5 F5 |
| `exercise.arpeggio7.b-flat-dominant7.2oct.both` | B-4 D5 F5 G#5 B-5 | B-4 D5 F5 A-5 B-5 |
| `exercise.arpeggio7.b-flat-minor7.2oct.both` | B-4 C#5 F5 G#5 B-5 | B-4 D-5 F5 A-5 B-5 |
| `exercise.arpeggio7.b-flat-half-diminished7.2oct.both` | B-4 C#5 E5 G#5 B-5 | B-4 D-5 E5 A-5 B-5 |
| `exercise.arpeggio7.e-flat-dominant7.2oct.both` | E-4 G4 B-4 C#5 E-5 | E-4 G4 B-4 D-5 E-5 |
| `exercise.arpeggio7.e-flat-minor7.2oct.both` | E-4 F#4 B-4 C#5 E-5 | E-4 G-4 B-4 D-5 E-5 |
| `exercise.arpeggio7.e-flat-half-diminished7.2oct.both` | E-4 F#4 A4 C#5 E-5 | E-4 G-4 A4 D-5 E-5 |
| `exercise.arpeggio.a-flat-major.2oct.both` | G#4 C5 E-5 G#5 C6 | A-4 C5 E-5 A-5 C6 |
| `exercise.arpeggio.a-flat-major.4oct.both` | G#3 C4 E-4 G#4 C5 | A-3 C4 E-4 A-4 C5 |
| `exercise.arpeggio7.a-flat-dominant7.2oct.both` | G#4 C5 E-5 F#5 G#5 | A-4 C5 E-5 G-5 A-5 |
| `exercise.arpeggio7.a-flat-major7.2oct.both` | G#4 C5 E-5 G5 G#5 | A-4 C5 E-5 G5 A-5 |
| `exercise.arpeggio7.a-flat-minor7.2oct.both` | G#4 B4 E-5 F#5 G#5 | A-4 B4 E-5 G-5 A-5 |
| `exercise.arpeggio7.a-flat-half-diminished7.2oct.both` | G#4 B4 D5 F#5 G#5 | A-4 B4 D5 G-5 A-5 |
| `exercise.arpeggio.d-flat-major.2oct.both` | C#4 F4 G#4 C#5 F5 | D-4 F4 A-4 D-5 F5 |
| `exercise.arpeggio.d-flat-major.4oct.both` | C#3 F3 G#3 C#4 F4 | D-3 F3 A-3 D-4 F4 |
| `exercise.arpeggio7.d-flat-dominant7.2oct.both` | C#4 F4 G#4 B4 C#5 | D-4 F4 A-4 B4 D-5 |
| `exercise.arpeggio7.d-flat-major7.2oct.both` | C#4 F4 G#4 C5 C#5 | D-4 F4 A-4 C5 D-5 |
| `exercise.arpeggio7.d-flat-minor7.2oct.both` | C#4 E4 G#4 B4 C#5 | D-4 E4 A-4 B4 D-5 |
| `exercise.arpeggio7.d-flat-half-diminished7.2oct.both` | C#4 E4 G4 B4 C#5 | D-4 E4 G4 B4 D-5 |
| `exercise.arpeggio.g-flat-major.2oct.both` | F#4 B-4 C#5 F#5 B-5 | G-4 B-4 D-5 G-5 B-5 |
| `exercise.arpeggio.g-flat-major.4oct.both` | F#3 B-3 C#4 F#4 B-4 | G-3 B-3 D-4 G-4 B-4 |
| `exercise.arpeggio7.g-flat-dominant7.2oct.both` | F#4 B-4 C#5 E5 F#5 | G-4 B-4 D-5 E5 G-5 |
| `exercise.arpeggio7.g-flat-major7.2oct.both` | F#4 B-4 C#5 F5 F#5 | G-4 B-4 D-5 F5 G-5 |
| `exercise.arpeggio7.g-flat-minor7.2oct.both` | F#4 A4 C#5 E5 F#5 | G-4 A4 D-5 E5 G-5 |
| `exercise.arpeggio7.g-flat-half-diminished7.2oct.both` | F#4 A4 C5 E5 F#5 | G-4 A4 C5 E5 G-5 |
| `exercise.arpeggio7.a-diminished7.2oct.both` | A4 C5 E-5 F#5 A5 | A4 C5 E-5 G-5 A5 |
| `exercise.arpeggio7.e-diminished7.2oct.both` | E4 G4 B-4 C#5 E5 | E4 G4 B-4 D-5 E5 |
| `exercise.arpeggio7.d-diminished7.2oct.both` | D4 F4 G#4 B4 D5 | D4 F4 A-4 B4 D5 |
| `exercise.arpeggio7.g-diminished7.2oct.both` | G4 B-4 C#5 E5 G5 | G4 B-4 D-5 E5 G5 |
| `exercise.arpeggio7.c-diminished7.2oct.both` | C4 E-4 F#4 A4 C5 | C4 E-4 G-4 A4 C5 |
| `exercise.arpeggio7.b-diminished7.2oct.both` | B4 D5 F5 G#5 B5 | B4 D5 F5 A-5 B5 |
| `exercise.arpeggio.f-minor.2oct.both` | F4 G#4 C5 F5 G#5 | F4 A-4 C5 F5 A-5 |
| `exercise.arpeggio.f-minor.4oct.both` | F3 G#3 C4 F4 G#4 | F3 A-3 C4 F4 A-4 |
| `exercise.arpeggio7.f-diminished7.2oct.both` | F4 G#4 B4 D5 F5 | F4 A-4 B4 D5 F5 |
| `exercise.arpeggio.g-sharp-minor.2oct.both` | G#4 B4 E-5 G#5 B5 | G#4 B4 D#5 G#5 B5 |
| `exercise.arpeggio.g-sharp-minor.4oct.both` | G#3 B3 E-4 G#4 B4 | G#3 B3 D#4 G#4 B4 |
| `exercise.arpeggio.b-flat-minor.2oct.both` | B-4 C#5 F5 B-5 C#6 | B-4 D-5 F5 B-5 D-6 |
| `exercise.arpeggio.b-flat-minor.4oct.both` | B-3 C#4 F4 B-4 C#5 | B-3 D-4 F4 B-4 D-5 |
| `exercise.arpeggio7.b-flat-diminished7.2oct.both` | B-4 C#5 E5 G5 B-5 | B-4 D-5 E5 G5 B-5 |
| `exercise.arpeggio.e-flat-minor.2oct.both` | E-4 F#4 B-4 E-5 F#5 | E-4 G-4 B-4 E-5 G-5 |
| `exercise.arpeggio.e-flat-minor.4oct.both` | E-3 F#3 B-3 E-4 F#4 | E-3 G-3 B-3 E-4 G-4 |
| `exercise.arpeggio7.e-flat-diminished7.2oct.both` | E-4 F#4 A4 C5 E-5 | E-4 G-4 A4 C5 E-5 |
51 items respelled

## Checks (unpiped; exit codes read)

From the worktree root:

- `python tools/content/build.py --offline`: **exit 0** (`run-build.txt`). "content validation OK … (2061 catalog items)".
  - The baseline build of the committed tree is also exit 0 (`run-build-baseline.txt`), on its second attempt. The first attempt failed validation with 117 errors because this worktree had no fetched sources. I copied the main checkout's `content/scores/imported/kern` and `musetrainer` into this worktree's ignored import folder, without their `.git` folders.
  - Because of that, the offline fetch step rewrites the tracked `content/scores/imported/SOURCES.md` (every row's `fetched` and `revision`) on each build. I restored it to its committed bytes after every run with `restore_sources.py` (beside this entry), and `git status` shows it unmodified.
- `python tools/content/validate.py --allow-nc --personal`: **exit 0** (`run-validate.txt`).
- `python -m unittest discover -s tools/content/tests -t tools/content`: **exit 0**, 971 tests, OK (skipped=4) (`run-unittest.txt`).

From `app/` (`npm ci` first: `node_modules` was absent):

- `npx tsc -b`: **exit 0** (`run-tsc.txt`).
- `npm run lint`: **exit 0** (`run-lint.txt`).
- `npx vitest run`: **exit 1**: 2 failed, 5,942 passed and 2 skipped of 5,946, in 254 files (`run-vitest.txt`).
  - Both failures are in `lessonClaimsAboutApp.test.ts`: *blues.3 … Rhythm only is not one of them* and *4.7: blind hides the score …*.
  - Both read source files I did not touch (`app/src/ui/screens/ScoreScreen.ts`, `app/src/style.css`; `git diff --quiet` exit 0) and look for literal `\n` sequences in them. This worktree checked both files out with CRLF line endings; the main checkout's `style.css` is LF.
  - The discriminating check (`vitest-two-reds-are-crlf.txt`): each clause is false on the file as checked out and true on the same content with LF.
  - The change does not cause them. They would fail the same way in this worktree without it (inferred: the files they read are untouched).
  - `lessonClaimsAboutMusic.test.ts` alone: exit 0, 139 of 139, with the new 4.3 row and the 2.5 row (*Ode to Joy (full theme) leaves C position only in bar 12, and no finger crosses under a thumb*) both green (`run-vitest-lessonClaimsAboutMusic.txt`).
- No browser, no app build, no Playwright.
- No JSON was re-serialised, so the round-trip check had nothing to check.
- No commit, push, stash or checkout. Line endings were kept as the working copy had them (CRLF).

## Unverified, beside what passes

The guards and the chart comparison pass on all 120 items. They prove the print matches the chart and breaks none of the guards, not that the chart is right. For an outside expert:

1. **The chart's key-by-key choices** (one source). The left hand plays 5-3-2-1 in D, E, A, B and G♭ major, and 5-4-2-1 in C, F, G major and every white-root minor. B♭ major's left hand is 3-2-1-3. B♭ minor's right hand is 2-3-1-2, turning at the top on finger 2 (I kept the chart's digit: the fifth-finger substitution applies only where the chart gives the thumb). The chart itself says 3 and 4 are often interchangeable.
2. **The reading of four digits over two and four octaves.** The last digit goes on every later root, and 5 replaces the thumb at the left hand's start and the right hand's turn. The chart's rules 1 and 3 support it, and lesson 4.3 and Thayer agree for the left-hand start.
3. **G♭ major and E♭ minor from the thumb**, on black keys: the chart's stated exception, and Thayer's.
4. **The seventh arpeggios' left-hand join** (5-4-3-2-1-4-3-2-1): my judgement from the triad chart's general rules. No seventh-arpeggio chart was read.
5. **The spelling of sevenths whose stacked thirds need F♭, C♭ or a double flat.** They are printed as enharmonics by the file's standing `_readable` policy, which gives mixed spellings such as D♭ minor 7th as D♭ E A♭ B, and C diminished 7th as C E♭ G♭ A. The root now matches the title, and before it did not: the old spelling was C♯ E G♯ B under a D♭ title. Whether those chords should be respelled whole is a notation choice for the expert or the owner.
6. **Ode bar 12's thumb on G3 after a shift**: a teacher's judgement, consistent with lesson 2.5's "lift, move, land" and its sentence that a number not following on from the last one signals a shift. The MuseTrainer edition the score was checked against prints no fingering (read from its `.mxl`: no `<fingering>` elements).

Nothing was played or heard, and nothing was looked at on a screen.

## Not done

- **The census in `test_generator_invariants.py`** (`TestTheChecksGoRedOnAMutation`, `test_every_family_has_at_least_one_mutation_that_reddens_it`) is not extended. That file is not in my list. The equivalent census, five named mutations each required to turn a check red, is `TestTheFingeringChecksGoRedOnAMutation` in `test_generator_fingering.py`, which is mine. If the reviewer wants the fingering axis in the family census, it belongs to whoever owns that file.

Every other item in the brief is done.

## Follow-ups

- **P0, scale family (not mine).** Four scale items print right-hand **A(3) → B♭(2)** at each inner tonic, a finger crossing over another away from the thumb:
  - `exercise.scale.b-flat-harmonic-minor.2oct.similar.both.2`
  - `…b-flat-melodic-minor.2oct…`
  - `…b-flat-natural-minor.2oct…`
  - `…b-flat-harmonic-minor.3oct…`

  The mechanism is the arpeggios' mechanism: `expand_fingering`'s right-hand rule makes the join `one_octave[0]`, and `HARMONIC_MINOR_FINGERING["B-"]`'s right hand begins on 2 and ends on 4. The one-octave items are right. Found by running this task's guards over every other fingered family in the plan (`sweep_other_families.py`, `sweep-other-families.txt`), a diagnostic and not a test.
- **P0-class spelling, broken sevenths (not an arpeggio maker, not mine).** `make_broken_seventh` builds its tones by semitone count too. Observed (`broken7-spelling-probe.txt`):
  - `exercise.broken7.e-major7.both`: E G♯ B **E♭**;
  - `a-flat-dominant7`: **G♯** C E♭ **F♯**;
  - `c-half-diminished7`: C E♭ **F♯** B♭.

  `SEVENTH_SPELLING` is now there to use. Its left hand also moves up an octave from E(4) to C(5), a shift on a rising line; the family already says `fingeringVerified: false`.
- **P1, chromatic family (not mine).** `exercise.chromatic.e.1oct.left`, `.1oct.both` and `.2oct.both` start the left hand E3(**1**) F3(**1**): the thumb on two neighbouring notes. `chromatic_finger(…, index == 0, "left")` gives the first note the thumb, and F takes it by rule. Observed in the same sweep.
- **The sweep's other hits are not findings.** The guards are shaped for a run that goes up and comes back. On position-based lines (Hanon's cells turning on 5, bass lines leaping with 5, broken octaves alternating 1 and 5, the broken sevenths' cells), finger 5 away from the extremes and the same finger on a leap are the design. G30's family-by-family sweep needs a rule per family, not these.
- **P3, test fixtures (not mine).** `app/tests/fixtures/scores/generated/exercise.arpeggio.{a-minor,c-major,f-major,g-major}.2oct.both.mxl`, their golden JSON and `app/tests/fixtures/levelling.json` still hold the old left hand (5-3-2-5). They are parser and levelling fixtures and are not shown to a learner. Regenerate them with `export_levelling_fixture.py` and the golden writer when someone owns them.
- **P3, record.** `docs/prompts/test-inventory-2026-09-26.csv:642` classes `test_generator_fingering.py` `preserve`. Two of its assertions encoded the fault, and the file is now mostly `add`, with four `revise`.

## Questions

None that block. For the reviewer, in case it changes what F writes: the flat-root sevenths' spelling (Unverified 5) follows the file's existing readability policy. Changing that policy is a notation decision, and I did not take it.

## Files

- `tools/content/generate_exercises.py`. Only these parts changed:
  - the arpeggio tables (`ARPEGGIO_CHART`, the seventh tables' comment);
  - `arpeggio_ascent`, `chart_ascent` and `up_and_back` (new);
  - `make_arpeggio`, and `make_seventh_arpeggio` with its docstring;
  - `SEVENTH_SPELLING` (new);
  - `make_pedal_variant`'s docstring (G42).
- `tools/content/tests/test_generator_fingering.py`
- `content/scores/authored/ode-to-joy-full.abc`
- `content/lessons/4.3.md`
- `app/tests/unit/lessonClaimsAboutMusic.test.ts` (the F0 › 4.3 row and the block's header sentence about it)
- `app/src/engine/drills/special.ts` (the comment only)
- `docs/02-curriculum.md` (4.3's fingering sentence, `:365` at HEAD)
- `docs/08-test-map.md`

Beside this entry:

- Red lines: `red-generator-fingering.txt`, `red-ode-bar-12.txt`, `red-vitest-4.3-row.txt`, `red-vitest-4.3-row-clauses.txt`.
- Runs: `run-build-baseline.txt`, `run-build.txt`, `run-validate.txt`, `run-unittest.txt`, `run-tsc.txt`, `run-lint.txt`, `run-vitest.txt`, `run-vitest-lessonClaimsAboutMusic.txt`, `run-generator-fingering-green.txt`, `vitest-two-reds-are-crlf.txt`.
- Before and after dumps of all 120 items: `before-arpeggios.txt`, `after-arpeggios.txt` (from `probe_arpeggios.py`).
- The built files read: `built-4.3-after.txt`, `built-ode-bars-11-13.txt`.
- Diagnostics: `sweep-other-families.txt`, `broken7-spelling-probe.txt`.
- The generated table: `fingering-table.md`.
