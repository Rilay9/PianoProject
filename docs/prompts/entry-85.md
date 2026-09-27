### Entry 85 — T53b: the B♭ minor scales' inner B♭ on the fourth finger, from Clementi's own two-octave print and Kelley's scale chart; the broken sevenths spelled through the arpeggios' interval contract, one helper for both; the white-root seventh arpeggios' fingering sourced (McLain, *Class Piano*), no number changed; a new finding, G♯ natural and melodic minor's left thumb on F♯, pinned (2026-09-27)

**Judgement.** Read from the built `.mxl` files the app loads (`built-after.txt`, against the baseline build's `built-before.txt`):

1. **B♭ harmonic minor, two octaves** (`exercise.scale.b-flat-harmonic-minor.2oct.similar.both.2`). The right hand goes B♭4(2) C5(1) D♭5(2) E♭5(3) F5(1) G♭5(2) A5(3) **B♭5(4)** C6(1) D♭6(2) E♭6(3) F6(1) G♭6(2) A6(3) B♭6(4), and comes down the mirror with B♭5 on 4 again. It printed A5(3) then **B♭5(2)** both ways, the hand crossing itself away from the thumb. The melodic and natural two-octave scales and the harmonic three-octave scale (B♭5 and B♭6) are fixed the same way. The left hand is unchanged, 2-1-3-2-1-4-3-2-1-3-2-1-4-3-2, which is Kelley's left hand for this key (for the melodic form, the alternative he prints in brackets).
2. **A broken E major 7th** (`exercise.broken7.e-major7.both`) is spelled E G♯ B **D♯**; it printed E♭ for the D♯. **A broken A♭ dominant 7th** (`exercise.broken7.a-flat-dominant7.both`, on stage 7's rung) is spelled **A♭** C E♭ **G♭**; it printed G♯ C E♭ F♯. It still prints no fingering, because the root is black. 17 of the plan's 36 broken sevenths are respelled, and every one now has the same four note names as the seventh arpeggio on the same root and shape.
3. **A white-root seventh arpeggio** (for example `exercise.arpeggio7.c-major7.2oct.both`) looks the same on the page: right hand 1-2-3-4-1-2-3-4-5, left hand 5-4-3-2-1-4-3-2-1, both mirrored on the way down. That fingering is now a published one: McLain gives it for every form of seventh-chord arpeggio from a white key. `fingeringVerified: true` now rests on that source. Black roots still print nothing.

**G47 took path (a), sourcing, and why.** The source came from the first searches, well inside the quarter-hour budget (started 01:13, the passage read by 01:16). The book gives one rule for all five seventh qualities from a white key, and its numbers are the ones already engraved. The owner can open it, because it is the press's open-access edition. Torkelson's sheet for Wartburg College gives the same fingers for the dominant and diminished sevenths.

Not seen on a screen, and nothing heard. As a teacher's reading: the fourth finger on B♭ inside a B♭ minor run is what both scale sources print and what a teacher would write, and a seventh chord spelled in stacked thirds is how it is written in any key. Five findings the reviewer should hear first:

- **A new fault, not this task's table.** Run over all 252 scale items, the thumb-on-a-black-key guard finds that G♯ natural minor (both ways) and G♯ melodic minor (on the way down) put the **left thumb on F♯**, in five items. Mechanism: `make_scale` fingers the melodic and natural minors from the harmonic table. In G♯ that table's thumb falls on the raised seventh, F𝄪, which is white; in the natural form that seventh is F♯, which is black. Kelley gives G♯ natural minor a left hand of its own (32132143) for this reason. The fault is pinned in the test file, and that row fails the day it is fixed. See Follow-ups.
- **The broken-seventh spelling fault was wider than the three probe items.** It hit 17 of the 36 plan items and 448 notes, and 35 of the 60 root-and-shape pairs the plan arpeggiates were spelled differently by the two makers (`red-generator-fingering.txt`).
- **`fingeringVerified` has no reader in the app.** Grep over the worktree finds it only in the generator, its tests and the docs. A learner sees whether numbers are printed, never the flag. So the product change behind G47 is that the printed numbers now rest on a source; no screen changes.
- **A test in a file I do not own still describes the old join as universal.** `test_fingering.py` › `TestTheOctaveJoin.test_the_right_hand_joins_on_its_thumb` asserts `expand_fingering(rh, 2)[7] == rh[0]` for every table. That is still true of the function's default, which I kept, but it is no longer true of the B♭ minor scale the product prints, and its docstring states the old rule as the whole truth. It passes; see Follow-ups.
- **The broken sevenths print an unsourced fingering on white roots** with `fingeringVerified: false`: 1-2-3-4-5-4-3-2, then a shift. By the reviewer's rule this is the same kind of claim as G47, in another family. It is not in the brief's decided scope, so it is recorded and not changed.

## The mechanism, and the test that told it from the alternatives

**G43, the scale join.** `expand_fingering` built a right hand as `one_octave[:-1] * octaves + [one_octave[-1]]`, so every tonic inside the run took `one_octave[0]`, the finger the table *starts* on. Entry 84's hypothesis was that this is the arpeggios' fault again. The alternative was that the table is wrong: if B♭ minor's right hand should start on 4, as Kelley's chart has it, first and last would agree and the old join would be right. The one-octave table was checked against the sources first:

- **Clementi** (the source the tables already name): prints 2 and 1 at the start and thumbs on C and F, so the table `[2, 1, 2, 3, 1, 2, 3, 4]` is his.
- **Kelley:** 4-1-2-3-1-2-3-4, the same interior with a different start.
- **The inner tonic:** 4 in both. Clementi *prints* 4 on the inner B♭ on the way down (`bes_4`), and on the way up his fingers step from the thumb on F to the thumb on C (1, 2, 3, 4). Kelley's pattern "repeats every octave".

So the start is a legitimate choice (the sources differ on it) and the join is what is wrong: only the join construction produces a 2 there.

Changing the start to 4 would also fix the inner B♭, but it would change six one-octave items that were right and move off Clementi's print. So the fix names the join instead:

- `expand_fingering` takes `join`, whose default reproduces the old construction exactly.
- `SCALE_JOIN_RH = {("B-", "minor"): 4}` carries the sourced exception, with both sources in its comment. `make_scale` passes it both ways.

**No other key changes.** Read against the right hand of each of Clementi's 24 two-octave runs (`clementi_inner_tonics.py`, `clementi-inner-tonics.txt`, a diagnostic and not a test), B♭ minor is the one key whose inner tonic differs from its table's first finger. The before and after dumps of all 624 plan staves in the three families agree: only these four right hands changed fingering (`families-diff.txt`). The mutation `the_join_the_table_starts_on`, which empties the join table, reddens the guards and the source comparison.

**G44, the broken sevenths' spelling.** The figure was `[start.transpose(i) for i in shape] + [start.transpose(12)]`, semitone counts that music21 spells by pitch class. It now uses the new `seventh_chord(root, quality)`: `SEVENTH_SPELLING`'s intervals, the semitone assertion, and `_readable` for double flats, which is exactly what `make_seventh_arpeggio` did inline. Both makers now call it; there is no second mechanism. Two things tell the cause apart:

- **Before and after.** The "same chord, same names" test (every root and shape the plan arpeggiates, built both ways) shows 35 of 60 pairs differing before and none after.
- **Mutation.** Putting semitone spelling back into the one helper (`by_semitones`) reddens the broken sevenths *and* the arpeggio, which shows both go through it.

The arpeggio's output is unchanged: no arpeggio staff moved in the dump.

**G47, the sevenths' provenance.** The numbers were already the book's, so the new source test (all 35 white-root sevenths, both hands, up and back, against `MCLAIN_SEVENTH_ASCENT` transcribed in the test) was green on the committed tree, and cannot be red first. Its power is shown by two mutations:

- `every_root_takes_the_first_finger`, T53's shipped line, reddens the guards and the source;
- `the_thumb_at_the_turn` (1-2-3-4-1-2-3-4-1, a fingering Torkelson prints for a hand that keeps going) passes every guard and fails only the source.

The code change is provenance only:

- the tables' comment names the source;
- `make_seventh_arpeggio`'s docstring says so;
- `fingered = not is_black_root(root)` is marked as the source's own condition, "starts on a white key".

## The sources

1. **Margaret Starr McLain, *Class Piano*** (Bloomington: Indiana University Press, 1974), chapter 9, "Diatonic Scales with Standard Fingering, concluded", the section "Fingering for Seventh Chord Arpeggios". I read it on 2026-09-27 in the press's open-access edition (CC BY-NC-ND 4.0): https://publish.iupress.indiana.edu/read/class-piano/section/f039d7d1-597f-4b17-87bd-95408ef56d20.
   - The page renders client-side, so the text was read from the platform's section JSON (`classpiano-ch9-section.json`, `classpiano-ch9-text.txt`).
   - The rule: every form of seventh-chord arpeggio from a white key goes up LH 5 4 3 2 1 4 3 2 1 and RH 1 2 3 4 1 2 3 4 5. Every finger is used; the left hand starts and the right hand ends on the fifth.
   - Its black-key rule is not applied: thumbs on the first white key, the other fingers in order, no fifth finger.
2. **S. Torkelson, "Triad Arpeggio Fingerings" / "Dominant and Diminished Seventh Arpeggios"**, Wartburg College, https://vip.wartburg.edu/musicdept/fandp.pdf (read 2026-09-27, both pages rendered; kept as `torkelson-fandp.pdf`). Dominant sevenths on C D E F G A B and diminished sevenths on c d e f g a b: RH 1 2 3 4 1 2 3 4 1, LH 1 4 3 2 1 4 3 2 1. This is corroboration only.
3. **Clementi, Op. 42**, Mutopia typeset at the revision `content/sources/clementi-op42-fingering.json` pins (2144afd): `clementi-op42-p1-18-scales.ily`, block `inlineScaleBesMin`, fetched as text (`clementi-op42-p1-18-scales.ily` beside this entry). Its right-hand line is transcribed verbatim in the test as `CLEMENTI_B_FLAT_MINOR_RH`.
4. **Robert Kelley, "Scale Fingering Chart for Piano, Organ, or Electric Keyboard"**, https://robertkelleyphd.com/home/keyboard-scale-fingering-chart/. The page's rules were read through a fetch tool; the chart itself is an image, read as the page's own PNG (`kelley-scalfing.png`, crop `kelley-crop-sharps.png`).
   - A♯/B♭ minor: RH 41231234 in the natural, harmonic and melodic columns; LH 21321432 (melodic 21432132, with 21321432 as the alternative).
   - G♯/A♭ minor LH: natural 32132143, harmonic and melodic 32143213.

**Not found or not read:** D. P. Horn's Wheaton arpeggio PDF (403, as for T53); the Piano World forum thread (no published chart); the Jazclass page (connection refused).

## Done

1. **G43.** `SCALE_JOIN_RH` and `expand_fingering(join=…)` as above; `make_scale` passes the join. The B♭ minor one-octave table is unchanged, checked against both sources first (`test_the_one_octave_table_is_the_sources`).
   - **Technical:** the four items print 4 on every inner B♭ both ways; no other scale staff in the plan changed.
   - **Pedagogical:** the fourth finger on the black tonic inside the run is the standard B♭ minor right hand. Starting on 2 is Clementi's choice, where Kelley starts on 4; both are places to begin.
2. **G44.** `seventh_chord` (new), called by `make_broken_seventh`'s figure and by `make_seventh_arpeggio`'s run; the old inline spelling lines are removed from both.
   - **Technical:** 17 items respelled, 0 arpeggio staves changed.
   - **Pedagogical:** each broken seventh now reads as the chord its title names. Where stacked thirds need a double flat or F♭/C♭, the file's standing `_readable` policy prints the enharmonic, now in both families alike (Unverified 4).
3. **G47, path (a).** Sourced to McLain, corroborated by Torkelson for two of the five qualities. The expected sequences and the source are explicit in `test_generator_fingering.py` (`MCLAIN_SEVENTH_ASCENT`), and `fingeringVerified` is still true. No number changed.
4. **G45.** Not resolved; see Not done.
5. **Build, tests, test map.** The content build was rerun: 1,176 generated items, 4 scale items refingered and 17 broken sevenths respelled. Every touched test is classified below. `docs/08-test-map.md` has the *Fingering on a melodic line* row (maker list, failures, tests, status with what is open) and the file list's line for `test_generator_fingering.py`.
   - `docs/02-curriculum.md` is unchanged: no sentence in it states a seventh fingering or a B♭ minor scale fingering (searched for seventh/7th beside finger, thumb, 1-2-3 or 5-4, and for B♭/B-flat/Bb minor).
   - No lesson states either (`content/lessons` searched for B♭ minor, broken seventh and seventh arpeggio: one mention of the Chopin sonata, and technique.6's "Seventh arpeggios" with no fingering).

## The red lines

All captured beside this entry.

- **`red-generator-fingering.txt`**: the final test file on the committed generator (swapped in for the run, then restored, `cmp` identical). 8 failed of 45, each for its reason:
  - `test_two_octaves_print_every_finger_clementi_prints`: `['B-5(2): Clementi prints 4']`.
  - `test_every_b_flat_minor_scale_in_the_plan_takes_each_inner_b_flat_with_the_fourth`: 16 faults over the four items. The first is `going up [2, 1, 2, 3, 1, 2, 3, 2, 1, 2, 3, 1, 2, 3, 4], the sources read [2, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4]`, then Kelley's reading, the way down, and `inner B♭ not on 4: ['B-5(2)', …]`.
  - `test_no_scale_in_the_plan_asks_for_a_hand_that_is_not_there`: 10 faults, all B♭ minor, the first `RH A5(3) B-5(2): the hand crosses itself away from the thumb`.
  - `test_every_broken_seventh_in_the_plan_is_spelled_as_stacked_thirds`: 448 faults, the first `exercise.broken7.e-major7.both: RH E-4 is not spelled for E major7`.
  - `test_sharp_and_flat_keys_and_every_quality_are_spelled_as_thirds`: E major 7th has `E-` where `D#` was wanted.
  - `test_the_broken_seventh_spells_every_chord_the_arpeggio_spells`: 35 pairs, the first `C half-diminished7: broken ['B-', 'C', 'E-', 'F#'], arpeggio ['B-', 'C', 'E-', 'G-']`.
  - Two mutation tests are red at their "the real item is clean" precondition, because the committed generator *was* the mutant state:
    - `the_old_scale_join`: `RH A5(3) B-5(2)` on the real B♭ minor item;
    - `by_semitones` on the broken seventh: 16 faults, `RH E-4 is not spelled for E major7`.
  - Green by design on the committed tree:
    - `test_every_white_root_seventh_in_the_plan_is_fingered_as_the_source_gives` (see G47 above);
    - `test_the_one_octave_table_is_the_sources` (the table was right);
    - `test_a_playable_seventh_the_source_does_not_give_fails_only_the_source`;
    - the G♯ pin.
- The first red run had the thumb rule inside the scale guard, and that is how the G♯ finding surfaced: 20 faults, the 10 B♭ minor crossings plus 10 `LH F#4(1)`/`LH F#5(1): thumb on a black key` in the five G♯ items. The guard was then split in two: the crossing and fifth-finger guard, which must be clean, and the thumb rule, with G♯ pinned. That first capture was overwritten by the rerun above, which used the same file name. The G♯ faults are still on the final tree, which the pin test asserts item by item; they are quoted here from the session.
- **`built-before.txt`**: the baseline build of the committed tree, read from its built `.mxl` files. It shows the faults in what the app loads, which also proves the baseline was not built from the changed generator: `B-5(2)` inner, `E-4` in E major 7th, `G#3 C4 E-4 F#4` for A♭7.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `test_generator_fingering` › `TestSeventhArpeggiosAgainstTheSource.test_every_white_root_seventh_in_the_plan_is_fingered_as_the_source_gives` | add | — | 35 white-root sevenths against McLain, both hands, up and back, `fingeringVerified` true, two octaves |
| › `TestBrokenSeventhSpelling` (3 tests) | add | — | nine representative chords (E, B, A, A♭, E♭; major 7th, dominant, minor 7th, half-diminished on C and F♯, diminished on E and B); the plan's 36; the broken seventh's four names equal to the arpeggio's for all 60 root-and-shape pairs |
| › `TestTheBFlatMinorScaleJoin` (5 tests) | add | — | the one-octave table against Clementi and Kelley; the two-octave melodic right hand against every finger Clementi prints; the plan's ten B♭ minor right hands, explicit sequences and 4 on every inner B♭; the crossing and fifth-finger guards over all 252 scale items; the thumb rule over them with G♯ pinned |
| › `TestTheFingeringChecksGoRedOnAMutation.test_the_old_construction_fails_the_guards_and_the_chart` | revise | the seventh checked by the guards only | and by the source |
| › `…test_a_playable_seventh_the_source_does_not_give_fails_only_the_source`, `…test_the_old_scale_join_fails_the_guards_and_the_sources`, `…test_spelling_broken_sevenths_by_semitones_fails_the_spelling_check` | add | — | the census for the new checks |
| › `spelling_faults` (helper) | revise | seventh arpeggios only | broken sevenths too, the same contract |
| › `plan_arpeggios` (helper) | revise | built the plan and kept only arpeggios | one build of the plan keeps four families (`plan_items`) |
| every other test in the file | preserve, untouched | — | green |
| `test_fingering` › `TestTheOctaveJoin.test_the_right_hand_joins_on_its_thumb` | not mine, untouched; should be **revise** | the right-hand join is the table's first finger for every key | passes on `expand_fingering`'s default; not the B♭ minor scale the product prints (Follow-ups) |
| `test_generator_invariants` › `test_the_seventh_arpeggio_is_fingered_the_way_its_tables_say`, `test_every_maker_has_a_docstring` | preserve, untouched (not mine) | — | pass: the tables' values and the docstring's phrase were kept |

## Every fingering and spelling changed

Going up; the way down is the mirror. From the dumps of all 624 plan staves in the scale, broken-seventh and seventh-arpeggio families before and after (`before-families.txt`, `after-families.txt`, `families-diff.txt`), confirmed on the built files for the items in the judgement.

| Item | Before | After | Source or "not printed" |
| --- | --- | --- | --- |
| `exercise.scale.b-flat-harmonic-minor.2oct.similar.both.2`, RH | 2-1-2-3-1-2-3-**2**-1-2-3-1-2-3-4 | 2-1-2-3-1-2-3-**4**-1-2-3-1-2-3-4 | Clementi Op. 42 (4 printed on the inner B♭; start 2 printed); Kelley scale chart 41231234 |
| `exercise.scale.b-flat-melodic-minor.2oct.similar.both.2`, RH | 2-1-2-3-1-2-3-**2**-1-2-3-1-2-3-4 | 2-1-2-3-1-2-3-**4**-1-2-3-1-2-3-4 | Clementi Op. 42 (his run is this form); Kelley 41231234 (melodic column) |
| `exercise.scale.b-flat-natural-minor.2oct.similar.both.2`, RH | 2-1-2-3-1-2-3-**2**-1-2-3-1-2-3-4 | 2-1-2-3-1-2-3-**4**-1-2-3-1-2-3-4 | Kelley 41231234 (natural column); Clementi's inner B♭ |
| `exercise.scale.b-flat-harmonic-minor.3oct.similar.both.2`, RH | 2-1-2-3-1-2-3-**2**-1-2-3-1-2-3-**2**-1-2-3-1-2-3-4 | 2-1-2-3-1-2-3-**4**-1-2-3-1-2-3-**4**-1-2-3-1-2-3-4 | Kelley 41231234, "repeats every octave"; Clementi's inner B♭ |
| all 35 white-root seventh arpeggios, both hands | RH 1-2-3-4-1-2-3-4-5, LH 5-4-3-2-1-4-3-2-1 (unsourced) | unchanged | McLain, *Class Piano* ch. 9; Torkelson (dominant, diminished) |
| the 25 black-root seventh arpeggios | not printed | not printed | not printed (`fingeringVerified: false`) |
| `exercise.broken7.a-flat-dominant7.both` | G♯ C E♭ F♯ | A♭ C E♭ G♭ | `SEVENTH_SPELLING` via `seventh_chord` (not printed: black root) |
| `exercise.broken7.a-flat-major7.both` | G♯ C E♭ G | A♭ C E♭ G | as above (not printed) |
| `exercise.broken7.a-flat-minor7.both` | G♯ B E♭ F♯ | A♭ B E♭ G♭ | as above; C♭ printed B by `_readable` (not printed) |
| `exercise.broken7.b-dominant7.both` | B E♭ F♯ A | B D♯ F♯ A | `SEVENTH_SPELLING` |
| `exercise.broken7.b-flat-dominant7.both` | B♭ D F G♯ | B♭ D F A♭ | as above (not printed) |
| `exercise.broken7.b-flat-minor7.both` | B♭ C♯ F G♯ | B♭ D♭ F A♭ | as above (not printed) |
| `exercise.broken7.b-major7.both` | B E♭ F♯ B♭ | B D♯ F♯ A♯ | `SEVENTH_SPELLING` |
| `exercise.broken7.d-flat-dominant7.both` | C♯ F G♯ B | D♭ F A♭ B | as above; C♭ printed B (not printed) |
| `exercise.broken7.d-flat-major7.both` | C♯ F G♯ C | D♭ F A♭ C | as above (not printed) |
| `exercise.broken7.d-flat-minor7.both` | C♯ E G♯ B | D♭ E A♭ B | as above; F♭ and C♭ printed E and B (not printed) |
| `exercise.broken7.e-flat-dominant7.both` | E♭ G B♭ C♯ | E♭ G B♭ D♭ | as above (not printed) |
| `exercise.broken7.e-flat-minor7.both` | E♭ F♯ B♭ C♯ | E♭ G♭ B♭ D♭ | as above (not printed) |
| `exercise.broken7.e-major7.both` | E G♯ B E♭ | E G♯ B D♯ | `SEVENTH_SPELLING` |
| `exercise.broken7.f-minor7.both` | F G♯ C E♭ | F A♭ C E♭ | `SEVENTH_SPELLING` |
| `exercise.broken7.g-flat-dominant7.both` | F♯ B♭ C♯ E | G♭ B♭ D♭ E | as above; F♭ printed E (not printed) |
| `exercise.broken7.g-flat-major7.both` | F♯ B♭ C♯ F | G♭ B♭ D♭ F | as above (not printed) |
| `exercise.broken7.g-flat-minor7.both` | F♯ A C♯ E | G♭ A D♭ E | as above; B𝄫 and F♭ printed A and E (not printed) |

Four hand-rows refingered in four items; 17 items respelled, both hands each. The broken sevenths' fingering where printed (white roots) is unchanged and unsourced (Follow-ups). No arpeggio's notes or fingers changed, and no `fingeringVerified` value changed.

## Checks (unpiped; exit codes read)

From the worktree root:

- **`python tools/content/build.py --offline`: exit 0** (`run-build.txt`). "content validation OK … (2061 catalog items)"; "wrote 1176 items".
  - The baseline build of the committed tree was also exit 0 (`run-build-baseline.txt`).
  - One docstring reflow in `make_seventh_arpeggio` landed after the build's generate step (by the build's own file timestamps). It is a docstring, so the generated files cannot differ. The unit suite below ran on the final file.
  - **Setup.** The worktree had no import libraries, so I copied the main checkout's `content/scores/imported/kern` and `musetrainer` without their version-control folders (`copy_imports.py`).
  - I also copied the main checkout's conversion cache into this worktree's `build/cache/convert` (`copy_convert_cache.py`: complete pairs only, nothing overwritten). The cache is content-addressed on the source bytes, `convert.py`, `abc_tools.py`, the music21 version and the options, and the two converter files are byte-identical in both trees (sha256 compared), so an entry can only be hit by the conversion that made it. It was copied during the baseline's kern import, so the baseline's summary counts most kern conversions as done; the second build's summary reads "162 cached, 0 converted".
  - The offline fetch rewrote the tracked `content/scores/imported/SOURCES.md` on each build. I restored it to the working copy's committed bytes after each (`SOURCES.md.committed-working-copy`), and `git status` does not list it.
- **`python tools/content/validate.py --allow-nc --personal`: exit 0** (`run-validate.txt`).
- **`python -m unittest discover -s tools/content/tests -t tools/content`: exit 0**, 983 tests, OK (skipped=4) (`run-unittest.txt`). That is Entry 84's 971 plus the twelve added here.

From `app/` (`npm ci` first, exit 0, `run-npm-ci.txt`: `node_modules` was absent):

- **`npx tsc -b`: exit 0** (`run-tsc.txt`).
- **`npm run lint`: exit 0** (`run-lint.txt`).
- **`npx vitest run`: exit 1**: 4 failed, 5,971 passed and 2 skipped of 5,977, in 258 files (`run-vitest.txt`). None of the four reads a file this change touched: `git status` lists only the three files below, all outside `app/`.
  - **Two are the worktree's CRLF checkout**, as in Entry 84. `lessonClaimsAboutApp.test.ts` › *blues.3 … Rhythm only is not one of them* and › *4.7: blind hides the score …* each test for a literal `\n` sequence in a source file: `ui/screens/ScoreScreen.ts` (test line 1568) and `style.css` (line 1778).
    - Both files are checked out here with CRLF endings.
    - The discriminating check (`crlf_check.py`, `vitest-two-reds-are-crlf.txt`): each clause is false on the file as checked out and true on the same text with LF.
  - **Two are load:** `sightReadingPromises.test.ts` › *levels 6 and 7 write a rest inside a triplet as a triplet rest*, levels 6 and 7. Both failed "Test timed out in 5000ms" in the full run.
    - The same file alone: exit 0, 51 of 51 (`run-vitest-sightReadingPromises-alone.txt`).
    - It generates sight-reading phrases in `app/src`, which this change does not touch.
  - `lessonClaimsAboutMusic.test.ts`, which holds the rows that read built generator output, passed in the full run.

No browser, no app build, no Playwright. No JSON re-serialised; `docs/08-test-map.md` was spliced as text with its CRLF endings kept (`edit_test_map.py`). No commit, push, stash or checkout.

## Unverified, beside what passes

The new tests pass. They prove the print matches the sources transcribed in the test, not that the sources are right. For an outside expert:

1. **B♭ minor's first note.** Clementi prints 2 and Kelley 4. The table keeps Clementi's 2, so the one-octave items are unchanged.
2. **Clementi's inner B♭ going up** is read by stepping from the printed thumbs, as the repository's extraction reads every entry; the 4 he *prints* is on the way down.
3. **The sevenths' way down.** McLain gives the way up; the way down is read as its mirror, the top note once, as the triads are.
4. **The mixed spellings where stacked thirds need F♭, C♭ or a double flat:** D♭ minor 7th as D♭ E A♭ B, A♭ minor 7th as A♭ B E♭ G♭, G♭ minor 7th as G♭ A D♭ E. This is the file's `_readable` policy (Entry 84's Unverified 5), now the same in the broken sevenths as in the arpeggios. Whether such chords should be respelled whole is a notation choice.
5. **McLain was read as the platform's JSON** of the section, not as the rendered page. The saved text is beside this entry.

Nothing was played or heard, and nothing was looked at on a screen.

## Not done

- **G45, the chromatic scale from E, left hand.** Not resolved. `chromatic_finger` is outside the parts of the file this task owns, and none of the sources read covers the chromatic scale. The diagnosis is under Follow-ups.
- **G♯ natural and melodic minor's left thumb on F♯.** Not fixed: not this task's table, and the melodic form needs a fingering that differs by direction. Pinned; see Follow-ups.
- **`test_fingering.py`'s join test** is not revised (not my file).
- **`docs/02-curriculum.md`** needed no change (Done 5).

Every other item in the brief is done.

## Follow-ups

- **P0-class, scale family: G♯ natural minor and G♯ melodic minor put the left thumb on F♯.** Five items:
  - `exercise.scale.g-sharp-natural-minor.1oct.similar.both.2` and `.2oct…`;
  - `exercise.scale.g-sharp-melodic-minor.1oct.similar.left.2`, `.1oct…both`, `.2oct…both`.

  `make_scale` reads `HARMONIC_MINOR_FINGERING` for all three minor forms. G♯ is the one key where that table's left thumb falls on the raised seventh (F𝄪, white), which is F♯ (black) in the natural form. Kelley gives G♯ natural minor LH 32132143. The melodic form needs the harmonic left hand going up and the natural one coming down, so the fix is a per-form, per-direction table and not a patch. `test_generator_fingering.py` pins exactly these five items and `LH F#` faults.
- **P1, broken sevenths: an unsourced printed fingering.** White roots print 1-2-3-4-5-4-3-2 and 5-4-3-2-1-2-3-4, with a shift between cells, and `fingeringVerified: false`. No screen reads the flag, so the learner sees the numbers as a claim. G47's rule applies: source it, or print nothing.
- **P1, G45: the diagnosis.** `chromatic_finger(…, first, hand)` gives the first note the thumb when it is a "second". That is right for the right hand, whose seconds (F, C) are the upper white of each pair and follow its thumb, and wrong for the left, whose seconds (E, B) are the lower white and are followed by its thumb. So the left hand from E prints E(1) F(1); from E it should begin 2-1. A chromatic-fingering source is needed before changing it.
- **P3, `test_fingering.py` › `TestTheOctaveJoin`.** Revise `test_the_right_hand_joins_on_its_thumb` and the class docstring to the sourced join: read `make_scale`'s print, or assert B♭ minor's 4.
- **P3, `extract_fingering.py` reads only Clementi's first octave**, so the committed source never saw a join. A two-octave read would put every key's inner tonic under the source test; `clementi_inner_tonics.py` is the sketch.
- **P3, the black-root sevenths.** McLain's black-key rule is a candidate source; E♭ minor 7th has no white key, so the rule needs a reading there first.
- **P3, record.** The test inventory row for `test_generator_fingering.py` (`docs/prompts/test-inventory-2026-09-26.csv`); matrix rows G43, G44 and G47 to built, and a new row for the G♯ left hand.
- **For the expert list, not a fault:** Kelley and Torkelson give the modern F♯ and C♯ harmonic minor right hand (4 on the second degree), while the tables follow Clementi's (thumbs on the third and seventh degrees). This is a choice of source.

## Questions

None that block. If the reviewer wants the broken sevenths' fingering taken off now under G47's rule, that is one line in `make_broken_seventh` plus its test row; I left it because the brief's decided scope names the seventh arpeggios.

## Files

- `tools/content/generate_exercises.py`. Only these parts changed:
  - `SCALE_JOIN_RH` (new), `expand_fingering`'s `join` and docstring, and `make_scale`'s one call site (the scale join);
  - `seventh_chord` (new), and `make_broken_seventh`'s figure;
  - `make_seventh_arpeggio`'s spelling lines (now the shared helper), its docstring and its `fingered` comment;
  - the seventh tables' comment.
- `tools/content/tests/test_generator_fingering.py`
- `docs/08-test-map.md`

Beside this entry:

- **Red lines:** `red-generator-fingering.txt`, `built-before.txt`.
- **Runs:** `run-build-baseline.txt`, `run-build.txt`, `run-validate.txt`, `run-unittest.txt`, `run-npm-ci.txt`, `run-tsc.txt`, `run-lint.txt`, `run-vitest.txt`, `run-vitest-sightReadingPromises-alone.txt`, `vitest-two-reds-are-crlf.txt` (from `crlf_check.py`), `run-generator-fingering-green.txt`, `built-after.txt`.
- **Dumps:** `before-families.txt`, `after-families.txt`, `families-diff.txt` (from `probe_families.py`, `compare_families.py`).
- **Sources read:**
  - `classpiano-ch9-section.json`, `classpiano-ch9-text.txt`, `classpiano-ch9.html`;
  - `clementi-op42-p1-18-scales.ily`, `clementi-op42-p1-19-scales.ily`;
  - `kelley-scale-chart.html`, `kelley-scalfing.png`, `kelley-crop-sharps.png`, `kelley-scalfing.svg`;
  - `torkelson-fandp.pdf`.
- **Diagnostics:** `clementi_inner_tonics.py`, `clementi-inner-tonics.txt`.
- **Scripts:** `copy_imports.py`, `copy_convert_cache.py`, `edit_test_map.py`, `read_built.py`.
- **Snapshots of the committed files:** `generate_exercises.py.HEAD`, `test_generator_fingering.py.HEAD`, `08-test-map.md.HEAD`.
