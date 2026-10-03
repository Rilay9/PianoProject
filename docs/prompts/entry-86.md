### Entry 86 — T53c: every minor form fingered from its own table, and G♯ minor's left hand from Kelley's chart and Clementi's run, so the thumb no longer lands on F♯; the broken sevenths print no fingering, having no source; the chromatic scale from E starts the left hand 2-1, from McLain's chromatic figure (2026-09-27)

**Judgement.** Read from the built `.mxl` files the app loads (`built-after.txt`, against the baseline build's `built-before.txt`):

1. **G♯ natural minor, two octaves, left hand** (`exercise.scale.g-sharp-natural-minor.2oct.similar.both.2`). It goes G♯3(3) A♯3(2) B3(1) C♯4(3) D♯4(2) E4(1) F♯4(4) G♯4(3) A♯4(2) B4(1) C♯5(3) D♯5(2) E5(1) F♯5(4) G♯5(3) and comes down the mirror, so the thumb is on B and E only. It printed C♯4(4) D♯4(3) E4(2) **F♯4(1)**, the thumb on F♯ four times in the run. The right hand is unchanged (3-4-1-2-3-1-2-3, thumbs on B and E).
2. **G♯ melodic minor coming down** (`exercise.scale.g-sharp-melodic-minor.1oct.similar.left.2`, and the 1-octave and 2-octave hands-together items). Going up is unchanged: G♯3(3) A♯3(2) B3(1) C♯4(4) D♯4(3) E♯4(2) F𝄪4(1) G♯4(3). Coming down now takes the natural minor's fingering for the natural minor's notes: F♯4(4) E4(1) D♯4(2) C♯4(3) B3(1) A♯3(2) G♯3(3). It printed **F♯4(1)** E4(2) D♯4(3) C♯4(4). The fingering changes at the top, where the notes change.
3. **A broken C major 7th** (`exercise.broken7.c-major7.both`) prints no finger numbers in either hand. The notes are the same: C3 E3 G3 B3 C4 B3 G3 E3, then the octave above, twice. It printed right hand 1-2-3-4-5-4-3-2 and left hand 5-4-3-2-1-2-3-4 in every cell while flagged unverified. No source for this figure was found, so all 36 broken sevenths now print nothing and say so.
4. **The chromatic scale from E, left hand** (`exercise.chromatic.e.1oct.left` and two more) begins E3(2) F3(1) F♯3(3); it began E3(1) F3(1), the thumb on two neighbouring keys. A chromatic source turned up in the book already used for the sevenths, so the brief's G45 condition was met.

Not seen on a screen, and nothing heard. As a teacher's reading: 3-2-1-3-2-1-4-3 is the G♯ minor left hand for the natural notes in both sources, and a teacher would write it. Changing fingers at the top of a melodic minor is what that scale asks of a hand. A broken seventh with no numbers leaves the choice to the learner, which is honest and a little less helpful than a sourced fingering would be. E(2) F(1) is the left-hand chromatic pattern the book prints. Four findings the reviewer should hear first:

- **The harmonic table was right for its own notes. What was wrong was using it for every form.** Kelley's harmonic and melodic (ascending) columns and Clementi's printed ascent all give G♯ minor's left hand 3-2-1-4-3-2-1-3. Kelley's natural column and Clementi's descent give 3-2-1-3-2-1-4-3. So the fix is the selection, not the table.
- **No other key's natural minor needed its own row, according to Clementi's descents.** Every minor run in Op. 42 is melodic, so each descent prints the natural minor's fingering. I read all twelve descents with the repository's parser (`clementi_descents.py`, a diagnostic and not a test). The harmonic table's thumbs match Clementi's on the natural notes in 23 of the 24 hands; the 24th is G♯ minor's left hand (`clementi-descents-before.txt`). After the change all 24 match (`clementi-descents-after.txt`).
- **The repository's LilyPond note pattern drops a printed finger that follows a `!`.** `extract_hanon.NOTE_RE` stops at the forced-accidental mark, so it loses `e!-1`, the very thumb that shows G♯'s descent. The committed extraction reads only the first octave going up, where no fingered `!` note occurs, so the committed JSON is unaffected. The diagnostic removes the `!` before parsing. See Follow-ups.
- **A melodic minor in contrary motion brings its left hand down through the raised notes** (A melodic minor, contrary: A3 G♯3 F♯3 E3 …, probed directly). `make_scale`'s `run()` builds the contrary-motion descent from the ascending form. The plan ships no melodic minor in contrary motion, so no learner meets it. It is not this task's; see Follow-ups.

## The mechanism, and the test that told it from the alternatives

**G48, the G♯ minor left hand.** `make_scale` set `fing = HARMONIC_MINOR_FINGERING.get(spec.tonic)` in the harmonic, melodic and natural branches alike, and fingered both directions from that one table.

- **Hypothesis:** the table is right for the notes it was made for (the raised seventh F𝄪 is white, so its thumb there is fine) and wrong for the natural notes, where that degree is F♯, a black key.
- **Alternative:** the G♯ table is itself wrong, and even the harmonic form should use 3-2-1-3-2-1-4-3.
- **The test between them is the sources, form by form.** Kelley's chart: natural LH 32132143, harmonic 32143213, melodic (ascending) 32143213. Clementi's `inlineScaleGisMin` left hand prints every finger of the first octave up as 3-2-1-4-3-2-1-3 (E♯ and F𝄪 raised). Coming down (`fis!`, `e!`) it prints the thumb on E and on B, never on F♯.

So the table stands for the raised form, and the model gains the distinction the reviewer asked for:

- `NATURAL_MINOR_FINGERING` is a table of its own, twelve rows. It is sourced from Clementi's descents, with G♯ minor's left hand also from Kelley's natural column. It equals the harmonic table in eleven keys and in G♯ minor's right hand, because that is what the descents show.
- `MINOR_FINGERING` names the four forms and their tables: harmonic; natural; melodic ascending, which is the table headed harmonic and is what Clementi's melodic ascents print and `test_fingering.py` checks against; and melodic descending, which is the natural table because the notes are the natural minor's.
- `MINOR_SCALE_FORMS` says which form each scale takes going up and coming down: harmonic both ways, natural both ways, melodic ascending then descending.
- `make_scale` now builds each direction from its own table (`fing_up`, `fing_down`), in both motions. No item id, no key and no pitch is special-cased.

**The one-octave table first, then the join.** The natural table's G♯ left hand, `[3, 2, 1, 3, 2, 1, 4, 3]`, is Kelley's column digit for digit. Clementi's descent, read upwards, is the same: the printed thumbs are on E and B, and the stepping between them gives the rest. Then the join:

- The pattern starts and ends on 3. Kelley's pattern "repeats every octave", so every inner G♯ takes 3.
- In Clementi's descent the inner G♯ steps as B(1), A♯(2), G♯(3) from his printed B above it.
- `expand_fingering`'s left-hand default puts the table's last finger on an inner tonic, which is 3. So no join entry is needed, and `SCALE_JOIN_RH` gains none. The right hand's inner G♯ is the table's first finger, 3, and Clementi's descent steps A♯(4), G♯(3).

**The diff.** Before and after dumps of every RH and LH staff the full plan builds were compared line by line: 1,937 staves of 1,153 items. The plan's other 23 items, clave and rhythm, have no staff named RH or LH. The files are `before-all.txt`, `after-all.txt` and `families-diff.txt`.
- **Fingering changed on 50 staves in 29 items:** five G♯ minor left hands, three chromatic-from-E left hands, and 42 broken-seventh staves (21 items, both hands).
- **Notes changed on no staff,** and `fingeringVerified` changed on none.
- **No other scale family moved:** G♯ harmonic minor, every G♯ right hand, B♭ minor's join, and every other key's natural and melodic scales print what they printed.

The mutation `the_harmonic_table_for_every_form` points the natural and melodic-descending forms back at the harmonic table. It reddens the thumb guard and the source sequences.

**G49, the broken sevenths.** A printed number is a claim, and `fingeringVerified` has no reader in the app (Entry 85). The white roots printed 1-2-3-4-5-4-3-2 and 5-4-3-2-1-2-3-4 with the flag false. That is the third state the reviewer ruled out. The search for a source came first (see The sources), and found none for this figure. So the path is (b): `make_broken_seventh` prints no fingering from any root, and its flag is now the same variable as its print (`fingered = False`), so the two cannot disagree again.

Does McLain apply? No. Her rule is for seventh-chord arpeggios over two octaves: the right hand goes 1-2-3-4-1-2-3-4-5, with the thumb on the first octave and the hand going on. This figure turns at the octave, one hand position wide, then leaps. Her rule does not say what finger the turn takes, and 5 there would be my inference, not her statement.

**G45, the chromatic scale from E.** `chromatic_finger` gave a "second" (the finger-2 white key) the thumb when it began the run, in both hands.
- **Right hand:** its seconds are F and C, the upper white of each pair. A run starting there has no lower partner before it, so the thumb is free to begin.
- **Left hand:** its seconds are E and B, the lower white, and its thumb is wanted on the very next note (F or C). So from E it printed E(1) F(1).
- **The source that decides it:** McLain's chromatic figure prints the left hand's E on 2 and F on 1, and her rule gives each pair of white keys 1 and 2, never the same finger twice. The exception is now right-hand only.
- **What the source does not decide:** the right hand's thumb start on C. Her figure, drawn as a cycle, fingers that C with 2. The item keeps the thumb, as the scale tables let a first note be fingered for a hand that starts there. The test names it as the one allowance, and it is on the expert list.

## The sources

1. **Robert Kelley, "Scale Fingering Chart for Piano, Organ, or Electric Keyboard"**, https://robertkelleyphd.com/home/keyboard-scale-fingering-chart/. The chart image is T53b's saved copy (`../T53b/kelley-scalfing.png`, crop `kelley-crop-sharps.png`), read again here.
   - G♯/A♭ minor: RH 34123123 in the natural, harmonic and melodic columns; LH natural 32132143, harmonic 32143213, melodic 32143213.
   - The melodic column is headed "Melodic Minor (ascending)". The chart has no descending column.
2. **Clementi, Op. 42**, Mutopia typeset at the revision the committed JSON pins (T53b's saved `clementi-op42-p1-18-scales.ily`). The left hand of `inlineScaleGisMin` is transcribed verbatim as `CLEMENTI_G_SHARP_MINOR_LH`. All twelve minor descents were read for the diagnostic.
3. **Margaret Starr McLain, *Class Piano*** (Indiana University Press, 1974; open-access edition, CC BY-NC-ND 4.0), chapter 9, "Chromatic Scale Fingering", the same section JSON T53b saved (`../T53b/classpiano-ch9-section.json`).
   - The rule is in the text. The figure is an image in that section (`/api/proxy/ingestion_sources/9792885b-…`), which I read when a fetch returned it: RH 2 3 1 3 1 2 3 1 3 1 3 1 2 and LH 1 3 1 3 2 1 3 1 3 1 3 2 1, from C up to C.
   - It is transcribed as `MCLAIN_CHROMATIC_FROM_C`. The image and the ABRSM PDF below were saved by the fetch tool into the session's tool-results folder, not into the repository.
4. **The broken-seventh search** (G49): 03:15–03:21 and 03:46–03:48, twelve searches and seven reads (one refused), stopped inside the quarter hour.
   - **What was read:** McLain's chapter text (seventh arpeggios and the chromatic scale; no broken figure). Torkelson's Wartburg sheet (dominant and diminished seventh arpeggios only). Margaret Denton's "ABRSM Exam System Technique Requirements" PDF (triad broken chords at grades 1–2, seventh arpeggios named with no figure). Living Pianos (Estrin; no numbers in the text). bluesjazzpiano.com (no numbers). The informance.biz chapter "Arpeggios of the Dominant Seventh" (arpeggios; the numbers are in images). The search results' summaries of PianoTV's RCM pages say four-note seventh forms may take any comfortable fingering; that page was not opened.
   - **Not reachable:** the Piano Street thread (403). Beringer's *Daily Technical Studies*, Plaidy's *Technical Studies* and ABRSM's scale manual appear only as paid copies or page scans.
   - **Found:** nothing that fingers a seventh chord broken up to the octave and back.

## Done

1. **G48.** `NATURAL_MINOR_FINGERING`, `MINOR_FINGERING` (the four forms) and `MINOR_SCALE_FORMS` are new; `make_scale` selects one table per direction by form; the comment on `SCALE_JOIN_RH` is corrected (it said the melodic and natural forms share the harmonic table).
   - **Technical:** the five items print the sources' left hand. The plan's twelve G♯ minor items match Kelley both hands. No scale in the plan has a thumb on a black key (252 items). No other staff in the plan moved.
   - **Pedagogical:** 3-2-1-3-2-1-4-3 for the natural notes and 3-2-1-4-3-2-1-3 for the raised ones is the standard pair. A melodic minor that changes fingers at the top teaches the scale as it is.
2. **G49, path (b).** No fingering on any broken seventh, and the flag is tied to the print.
   - **Technical:** 21 white-root items lost their numbers (42 staves); the 15 black-root items were already bare; none is flagged verified.
   - **Pedagogical:** nothing wrong is taught. Whether a learner at stage 7 needs a fingering here is a teaching question; a sourced one can be added the day it is found.
3. **G45.** `chromatic_finger`'s first-note exception is right-hand only; the docstring names McLain.
   - **Technical:** three left hands changed at their first note; the right hands, and every other start, are unchanged.
   - **Pedagogical:** E(2) F(1) is the standard left-hand start from E.
4. **G46's docstring:** `test_fingering.py` is untouched, as the brief says.
5. **Build, tests, test map.** The content build was rerun (1,176 generated items). Every touched test is classified below. `docs/08-test-map.md`, the row *Fingering on a melodic line* (makers, failures, tests, status) and the file list's line for `test_generator_fingering.py`, spliced as text with its CRLF endings kept (`edit_test_map.py`).
   - No lesson or curriculum sentence states any of the three fingerings. I searched `content/lessons` and `docs/02-curriculum.md` for broken sevenths, G♯ minor beside finger or thumb, and chromatic beside finger; the only hit is `docs/02-curriculum.md`'s "broken 7ths" in a stage list, with no fingering.

## The red lines

**`red-generator-fingering.txt`**: the final test file run against the committed generator, in a scratch copy of the content tools (`make_red_tree.py`: the committed `generate_exercises.py` snapshot and the new test file; the worktree was not touched). 13 of 57 red, each for its reason:

- **G48**
  - `test_no_scale_in_the_plan_puts_the_thumb_on_a_black_key`: the five items, ten faults, the first `exercise.scale.g-sharp-melodic-minor.1oct.similar.left.2: ['LH F#4(1): thumb on a black key']`.
  - `test_the_five_items_print_the_left_hand_the_sources_give`: `[3, 2, 1, 4, 3, 2, 1, 3, 1, 2, 3, 4, 1, 2, 3] != [3, 2, 1, 3, 2, 1, 4, 3, 4, 1, 2, 3, 1, 2, 3]` for the natural 1-octave item.
  - `test_every_g_sharp_minor_scale_in_the_plan_is_fingered_as_the_sources_give`: five items, the first `…melodic-minor.1oct.similar.left.2 LH: prints [3, 2, 1, 4, 3, 2, 1, 3, 1, 2, 3, 4, 1, 2, 3], the chart reads [3, 2, 1, 4, 3, 2, 1, 3, 4, 1, 2, 3, 1, 2, 3]`.
  - `test_clementi_s_run_is_the_melodic_left_hand_both_ways`: `['E4(2): Clementi prints 1']`.
  - `test_the_one_octave_tables_are_the_sources`, `test_the_natural_table_differs_from_the_harmonic_only_in_g_sharp_minor_s_left_hand` and `test_every_minor_form_s_table_keeps_the_thumb_on_white_keys` are ERROR: `AttributeError: module 'generate_exercises' has no attribute 'MINOR_FINGERING'` (and `'NATURAL_MINOR_FINGERING'`). The committed generator had no per-form model to check.
  - The mutation `test_the_harmonic_table_for_every_minor_form_fails_the_guard_and_the_sources` is red at its "the real item is clean" precondition, four `LH F#…(1)` faults: the committed generator *was* the mutant.
- **G49**
  - `test_no_broken_seventh_in_the_plan_prints_a_fingering`: 21 items, the first `exercise.broken7.c-dominant7.both: verified=False, printed 64 fingers, the first ['RH C3(1)']`.
  - `test_a_white_root_prints_none_as_a_black_root_does`: `exercise.broken7.c-dominant7.both RH`.
- **G45**
  - `test_every_chromatic_scale_in_the_plan_takes_the_book_s_finger_on_every_key`: six faults over the three items, e.g. `LH E3(1): the book's figure gives 2` and `LH E3(1) F3(1): one finger on two different notes`.
  - `test_the_left_hand_from_e_begins_on_the_second_finger`: `[('E3', 1), ('F3', 1), ('F#3', 3)] != [('E3', 2), …]`.
  - The mutation `test_a_thumb_start_in_the_left_hand_fails_the_chromatic_source` is red at its precondition (the committed generator was the mutant).
- **Green on the committed tree by design:** `test_the_scale_from_c_is_the_book_s_figure` (the C scale was already the figure, bar the right hand's first note), and every preserved test, including the count assertions (252 scales, 36 broken sevenths, 16 chromatic scales), which shows the scratch copy built the full plan.

**`built-before.txt`**: the baseline build of the committed tree, read from its `.mxl` files. It shows `F#4(1)` in the G♯ natural and melodic left hands, `C3(1) E3(2) …` on the broken sevenths and `E3(1) F3(1)` from E. That also proves the baseline was built from the committed generator.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `test_generator_fingering` › `TestTheBFlatMinorScaleJoin.test_the_thumb_takes_a_black_key_only_where_g_sharp_minor_borrows_its_harmonic_table` → `test_no_scale_in_the_plan_puts_the_thumb_on_a_black_key` | **replace** | five G♯ minor items with the left thumb on F♯ are a known fault, pinned (the exact list and `LH F#`) | no scale in the plan has a thumb on a black key; 252 counted |
| › `TestSeventhArpeggioFingering.test_a_broken_seventh_on_a_black_root_prints_no_fingering` → `TestBrokenSeventhFingering` (2 tests) | **replace** | a white-root broken seventh prints 1-2-3-4-5-4-3-2 (the unsourced fingering, asserted for C) | no broken seventh in the plan (36) prints a finger or is flagged verified; C, A and D♭, every hands setting |
| › `TestTheMinorFormsFingerings` (6 tests) | add | — | the four forms' G♯ tables against Kelley; the melodic-ascending LH against Clementi's printed octave; `MINOR_SCALE_FORMS`; Clementi's run against the melodic left hand both ways; the five items' left hands as explicit sequences read from the chart; the plan's twelve G♯ minor items both hands; the natural table equal to the harmonic but for G♯'s left hand (Clementi's descents); every form's table in every key held to thumb-on-white and four-between-thumbs on its own notes |
| › `TestChromaticLeftHand.test_the_left_hand_from_e_begins_on_the_second_finger`, `…test_the_scale_from_c_is_the_book_s_figure`, `…test_every_chromatic_scale_in_the_plan_takes_the_book_s_finger_on_every_key` | add | — | the three from-E items start E(2) F(1); the C scale is McLain's figure bar the right hand's start; all 16 chromatic items note by note against the figure, plus the crossing guard |
| › `TestTheFingeringChecksGoRedOnAMutation.test_the_harmonic_table_for_every_minor_form_fails_the_guard_and_the_sources`, `…test_a_thumb_start_in_the_left_hand_fails_the_chromatic_source` | add | — | the census for the new checks |
| › `read_lilypond` (helper) | revise | single sharps and flats, undotted durations | double sharps and flats and dotted durations too (Clementi's G♯ line has `fisis` and `gis2.`); the B♭ line reads as before |
| › `PLAN_FAMILIES` (helper) | revise | four families | the chromatic scales too, from the same one build of the plan |
| › `chromatic_source_faults`, `read_scale_pattern` (helpers) | add | — | as above |
| every other test in the file | preserve, untouched | — | green |
| `test_fingering` (whole file) | not mine, untouched | its Clementi and rule tests read `HARMONIC_MINOR_FINGERING` only | pass: that table's values are unchanged; the natural and melodic tables are held to the same rules by the new test above. `test_the_right_hand_joins_on_its_thumb` is still G46's |
| `test_generator` › the `chromatic_finger` rows; `test_generator_invariants` › `test_the_two_hands_do_not_finger_the_chromatic_scale_alike`, `test_every_maker_has_a_docstring` | preserve, untouched (not mine) | — | pass: the right hand's start is unchanged; `make_scale` still carries no docstring, as that test requires |

## Every fingering changed

Every staff that changed, from the dumps of all 1,937 RH/LH staves the plan builds (`families-diff.txt`), confirmed on the built files for the items in the judgement (`built-after.txt`). Up and back, as printed.

| Item | Hand | Before | After | Source or "not printed" |
| --- | --- | --- | --- | --- |
| `exercise.scale.g-sharp-natural-minor.1oct.similar.both.2` | LH | 3-2-1-4-3-2-**1**-3-**1**-2-3-4-1-2-3 | 3-2-1-**3-2-1-4**-3-**4-1-2-3**-1-2-3 | Kelley natural LH 32132143; Clementi's descent (thumbs on E and B) |
| `exercise.scale.g-sharp-natural-minor.2oct.similar.both.2` | LH | 3-2-1-4-3-2-1-3-2-1-4-3-2-1-3-1-2-3-4-1-2-3-1-2-3-4-1-2-3 | 3-2-1-3-2-1-4-3-2-1-3-2-1-4-3-4-1-2-3-1-2-3-4-1-2-3-1-2-3 | Kelley 32132143, "repeats every octave"; Clementi's descent |
| `exercise.scale.g-sharp-melodic-minor.1oct.similar.left.2` | LH | 3-2-1-4-3-2-1-3-**1-2-3-4**-1-2-3 | 3-2-1-4-3-2-1-3-**4-1-2-3**-1-2-3 | up: Kelley melodic (ascending) 32143213, Clementi's printed ascent; down: Kelley natural, Clementi's descent |
| `exercise.scale.g-sharp-melodic-minor.1oct.similar.both.2` | LH | as above | as above | as above |
| `exercise.scale.g-sharp-melodic-minor.2oct.similar.both.2` | LH | 3-2-1-4-3-2-1-3-2-1-4-3-2-1-3-1-2-3-4-1-2-3-1-2-3-4-1-2-3 | 3-2-1-4-3-2-1-3-2-1-4-3-2-1-3-4-1-2-3-1-2-3-4-1-2-3-1-2-3 | as above |
| `exercise.chromatic.e.1oct.left` | LH | **1**-1-3-1-3-1-3-2-1-3-1-3-2-… | **2**-1-3-1-3-1-3-2-1-3-1-3-2-… (rest unchanged) | McLain, *Class Piano* ch. 9, chromatic figure (LH E 2, F 1) |
| `exercise.chromatic.e.1oct.both` | LH | as above | as above | as above |
| `exercise.chromatic.e.2oct.both` | LH | **1**-1-3-… | **2**-1-3-… (rest unchanged) | as above |
| the 21 white-root broken sevenths: `exercise.broken7.{c,g,d,a,e,b,f}-{dominant7,major7,minor7}.both` | RH | 1-2-3-4-5-4-3-2 each cell, 32 notes | not printed | not printed (no source found; `fingeringVerified: false`) |
| the same 21 | LH | 5-4-3-2-1-2-3-4 each cell, 32 notes | not printed | not printed |
| the 15 black-root broken sevenths | both | not printed | not printed | not printed |

Five scale left hands, three chromatic left hands and 42 broken-seventh staves: 50 staves in 29 items. No note changed, and no `fingeringVerified` value changed.

## Checks (unpiped; exit codes read)

From the worktree root:

- **`python tools/content/build.py --offline`: exit 0** (`run-build.txt`): "wrote 1176 items", "content validation OK … (2061 catalog items)".
  - The baseline build of the committed tree was exit 0 too (`run-build-baseline.txt`).
  - **Setup.** The worktree had no import libraries or conversion cache. I copied the main checkout's `content/scores/imported/kern` and `musetrainer` without their version-control folders (`copy_imports.py`), and its `build/cache/convert` (`copy_convert_cache.py`: complete pairs only, nothing overwritten), as T53b did. The second build's kern line reads "162 cached, 0 converted".
  - The offline fetch rewrote the tracked `content/scores/imported/SOURCES.md` on each build. I restored it to the committed bytes after each (`SOURCES.md.committed-working-copy`), and `git status` does not list it.
  - Two comment edits landed after the second build's generate step and after the full unit suite had loaded its modules: the broken-seventh comment's wording in the generator ("inside a quarter of an hour") and a Kelley comment line in the test file. Neither can change a generated file or a test's logic. The final files were then run again: the fingering test file green (57 of 57, `run-generator-fingering-green.txt`) and red on the committed generator (13 of 57, `red-generator-fingering.txt`).
- **`python tools/content/validate.py --allow-nc --personal`: exit 0** (`run-validate.txt`).
- **`python -m unittest discover -s tools/content/tests -t tools/content`: exit 0**, 995 tests, OK (skipped=4) (`run-unittest.txt`). That is Entry 85's 983 plus the twelve added here.

From `app/` (`npm ci` first, exit 0, `run-npm-ci.txt`: `node_modules` was absent):

- **`npx tsc -b`: exit 0** (`run-tsc.txt`).
- **`npm run lint`: exit 0** (`run-lint.txt`).
- **`npx vitest run`: exit 1**: 4 failed, 5,977 passed and 2 skipped of 5,983, in 259 files (`run-vitest.txt`). They are the same four as Entry 85, and none reads a file this change touched: `git status` lists only the three files below, all outside `app/`.
  - **Two are the worktree's CRLF checkout.** `lessonClaimsAboutApp.test.ts` › *blues.3 … Rhythm only is not one of them* and › *4.7: blind hides the score …* each test for a literal `\n` sequence, in `ui/screens/ScoreScreen.ts` (test line 1568) and `style.css` (line 1778). The discriminating check (`crlf_check.py`, `vitest-two-reds-are-crlf.txt`): each clause is false on the file as checked out, which has CRLF endings, and true on the same text with LF.
  - **Two are load.** `sightReadingPromises.test.ts` › *levels 6 and 7 write a rest inside a triplet as a triplet rest*, levels 6 and 7, both "Test timed out in 5000ms" in the full run. The same file alone: exit 0, 51 of 51 (`run-vitest-sightReadingPromises-alone.txt`). It generates sight-reading phrases in `app/src`, which this change does not touch.
  - `lessonClaimsAboutMusic.test.ts`, which holds the rows that read built generator output, passed in the full run.

No browser, no app build, no Playwright. No JSON re-serialised. No commit, push, stash or checkout, and nothing added to the index.

## Unverified, beside what passes

The new tests pass. They prove the print matches the sources transcribed in the test, not that the sources are right. For an outside expert:

1. **The natural table's other eleven keys** rest on my reading of Clementi's descents. The diagnostic uses the repository's parser and stepping fill; a few unprinted notes at the turns are left unread, and the comparison is by thumb. The test holds the table to that reading (natural equals harmonic but for G♯'s left hand). The committed extraction does not yet read descents (Follow-ups).
2. **The melodic minor coming down takes the natural minor's fingering** because it has the natural minor's notes. Kelley's chart implies this by having no descending column; Clementi prints it. No source states it in words.
3. **The chromatic right hand from C begins on the thumb**, where McLain's figure, drawn as a cycle, has 2. It is kept as a first-note choice and named in the test.
4. **The broken sevenths print nothing.** Whether a learner at stage 7 is better served by no numbers than by an unsourced but plausible 1-2-3-4-5 is a teaching judgement I have not made. The reviewer's rule decides it until a source turns up.
5. **McLain's chromatic figure was read as an image** the fetch tool returned. Kelley's chart is T53b's saved image, and Clementi is the saved `.ily`.

Nothing was played or heard, and nothing was looked at on a screen.

## Not done

- **`test_fingering.py` › `test_the_right_hand_joins_on_its_thumb`'s docstring** (G46) is not revised, as the brief says.
- **The melodic minor's contrary-motion pitches** (finding above) are not changed: not this task's, and not in the plan.

Every other item in the brief is done, G45 included, because the source condition was met.

## Follow-ups

- **P3, extraction tooling (with G46).**
  - `extract_hanon.NOTE_RE` drops a printed finger after a forced-accidental `!` (`e!-1`).
  - `extract_fingering.py` reads only Clementi's first octave going up.
  - A read of the descents would put the natural table's eleven unchanged keys under the committed source test. `clementi_descents.py` is the sketch.
- **P3, `make_scale` in contrary motion with a melodic minor** brings the left hand down through the raised notes (`run(start, "down")` reverses the ascending form). Not in the plan. If contrary-motion melodic items are ever added, the descent should take the natural notes; the fingering already selects by direction.
- **P3, record.**
  - The test inventory row for `test_generator_fingering.py` (`docs/prompts/test-inventory-2026-09-26.csv`) still describes the T53-era file.
  - Matrix rows G45, G48 and G49 go to built.
- **For the expert list, not a fault:** Kelley's chart and McLain's text give F♯ and C♯ natural minor a right hand with the thumb on the sixth degree. The tables follow Clementi, whose descent puts it on the seventh; this is a choice of source, like B♭ minor's start. Torkelson's sheet gives G♯ minor's left hand 3-2-1-4-3-2-1 without naming a form.

## Questions

None that block.

## Files

- `tools/content/generate_exercises.py`. Only these parts changed:
  - `NATURAL_MINOR_FINGERING`, `MINOR_FINGERING` and `MINOR_SCALE_FORMS` (new), and `SCALE_JOIN_RH`'s comment;
  - `make_scale`'s table selection and fingering construction, and its `fingeringVerified`;
  - `chromatic_finger`'s first-note condition and docstring (G45);
  - `make_broken_seventh`'s fingering block and its `fingeringVerified`.
- `tools/content/tests/test_generator_fingering.py`
- `docs/08-test-map.md`

Beside this entry:

- **Red lines:** `red-generator-fingering.txt` (from `make_red_tree.py`), `built-before.txt`.
- **Runs:** `run-build-baseline.txt`, `run-build.txt`, `run-validate.txt`, `run-unittest.txt`, `run-npm-ci.txt`, `run-tsc.txt`, `run-lint.txt`, `run-vitest.txt`, `run-vitest-sightReadingPromises-alone.txt`, `vitest-two-reds-are-crlf.txt` (from `crlf_check.py`), `run-generator-fingering-first.txt`, `run-generator-fingering-green.txt`, `built-after.txt` (from `read_built.py`).
- **Dumps:** `before-all.txt`, `after-all.txt`, `families-diff.txt` (from `probe_families.py`, `compare_all.py`).
- **Diagnostics:** `clementi_descents.py`, `clementi-descents-before.txt`, `clementi-descents-after.txt`.
- **Scripts:** `copy_imports.py`, `copy_convert_cache.py`, `edit_test_map.py`, `make_red_tree.py`, `crlf_check.py`.
- **Snapshots of the committed files:** `generate_exercises.py.HEAD`, `test_generator_fingering.py.HEAD`, `08-test-map.md.HEAD`, `SOURCES.md.committed-working-copy`.
