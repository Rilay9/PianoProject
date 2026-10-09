**Generated items (374, expected answer from the recipe): right answers per family.** A right answer is `exact` (the method names exactly the expected collection and tonic and nothing else) or, where the recipe declares no 7-class collection (melodic minor, up and down: 9 pitch classes; five-finger: 5), `correct_none` (the method names nothing). Columns are the methods; the last row is all 374.

| family | items | current detector (tonic: its own key) | current detector (tonic: reference) | music21 deriveRanked, as returned (tonic: detected key) | music21 deriveRanked + equality check (tonic: detected key) | music21 deriveRanked + equality check (tonic: reference) | music21 deriveRanked + equality check, notes spelled with sharps only (tonic: detected key) | Tonal Scale.detect exact (tonic: detected key) | Tonal Scale.detect exact (tonic: reference) | Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key) | Tonal Scale.detect exact (no tonic given) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| blues_scale | 16 | 16/16 | 16/16 | 8/16 | 8/16 | 8/16 | 10/16 | 16/16 | 16/16 | 16/16 | 0/16 |
| octave_scale | 25 | 25/25 | 25/25 | 25/25 | 25/25 | 25/25 | 25/25 | 25/25 | 25/25 | 25/25 | 0/25 |
| chromatic | 16 | 16/16 | 16/16 | 16/16 | 16/16 | 16/16 | 16/16 | 16/16 | 16/16 | 16/16 | 16/16 |
| double_scale | 8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 0/8 |
| five_finger | 48 | 48/48 | 48/48 | 0/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 |
| modal_vamp | 3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 0/3 |
| pentatonic drill: blues | 3 | 3/3 | 3/3 | 1/3 | 1/3 | 1/3 | 3/3 | 3/3 | 3/3 | 3/3 | 0/3 |
| pentatonic drill: minor pentatonic | 3 | 3/3 | 3/3 | 0/3 | 0/3 | 0/3 | 0/3 | 3/3 | 3/3 | 3/3 | 0/3 |
| scale: major | 108 | 108/108 | 108/108 | 108/108 | 108/108 | 108/108 | 108/108 | 108/108 | 108/108 | 108/108 | 0/108 |
| scale: harmonic minor | 72 | 72/72 | 72/72 | 72/72 | 72/72 | 72/72 | 72/72 | 72/72 | 72/72 | 72/72 | 0/72 |
| scale: melodic minor | 48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 48/48 | 0/48 |
| scale: natural minor | 24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 24/24 | 0/24 |
| **all** | 374 | 374/374 (100.0%) | 374/374 (100.0%) | 313/374 (83.7%) | 361/374 (96.5%) | 361/374 (96.5%) | 365/374 (97.6%) | 374/374 (100.0%) | 374/374 (100.0%) | 374/374 (100.0%) | 64/374 (17.1%) |

**Generated items, all categories (counts out of 374).**

| method | exact | right among several | wrong | missed (no name) | correct: no name | false name |
| --- | --- | --- | --- | --- | --- | --- |
| current detector (tonic: its own key) | 278 | 0 | 0 | 0 | 96 | 0 |
| current detector (tonic: reference) | 278 | 0 | 0 | 0 | 96 | 0 |
| music21 deriveRanked, as returned (tonic: detected key) | 265 | 0 | 3 | 10 | 48 | 48 |
| music21 deriveRanked + equality check (tonic: detected key) | 265 | 0 | 0 | 13 | 96 | 0 |
| music21 deriveRanked + equality check (tonic: reference) | 265 | 0 | 0 | 13 | 96 | 0 |
| music21 deriveRanked + equality check, notes spelled with sharps only (tonic: detected key) | 269 | 0 | 0 | 9 | 96 | 0 |
| Tonal Scale.detect exact (tonic: detected key) | 278 | 0 | 0 | 0 | 96 | 0 |
| Tonal Scale.detect exact (tonic: reference) | 278 | 0 | 0 | 0 | 96 | 0 |
| Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key) | 278 | 0 | 0 | 0 | 96 | 0 |
| Tonal Scale.detect exact (no tonic given) | 16 | 262 | 0 | 0 | 48 | 48 |

**Generated items: confusion pairs (expected label -> what the method named; only the answers that were not exact).** `wrong` names another collection or tonic, `false_name` names a collection where none is expected, `missed` names nothing, `right_among_several` includes the expected name among others.

- current detector (tonic: its own key): none.
- current detector (tonic: reference): none.
- music21 deriveRanked, as returned (tonic: detected key): none -> ionian (major) / mixolydian [false_name] x36; none -> aeolian (natural minor) / dorian / harmonic minor / melodic minor (ascending) [false_name] x12; blues scale -> (nothing) [missed] x10; minor pentatonic -> aeolian (natural minor) / blues scale / dorian / phrygian [wrong] x3
- music21 deriveRanked + equality check (tonic: detected key): blues scale -> (nothing) [missed] x10; minor pentatonic -> (nothing) [missed] x3
- music21 deriveRanked + equality check (tonic: reference): blues scale -> (nothing) [missed] x10; minor pentatonic -> (nothing) [missed] x3
- music21 deriveRanked + equality check, notes spelled with sharps only (tonic: detected key): blues scale -> (nothing) [missed] x6; minor pentatonic -> (nothing) [missed] x3
- Tonal Scale.detect exact (tonic: detected key): none.
- Tonal Scale.detect exact (tonic: reference): none.
- Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key): none.
- Tonal Scale.detect exact (no tonic given): ionian (major) -> aeolian (natural minor) / dorian / ionian (major) / locrian / lydian / mixolydian / phrygian [right_among_several] x141; harmonic minor -> Phrygian dominant / harmonic minor / harmonic minor set (tonic not its own) [right_among_several] x72; none -> other (composite blues) [false_name] x48; aeolian (natural minor) -> aeolian (natural minor) / dorian / ionian (major) / locrian / lydian / mixolydian / phrygian [right_among_several] x27; blues scale -> blues scale / blues scale set (tonic not its own) [right_among_several] x19; minor pentatonic -> major pentatonic / minor pentatonic / pentatonic set (tonic not its own) [right_among_several] x3

**Real items with a key in the title (226; 149 whose pitch-class set equals a table collection at the title's tonic, 77 whose set does not).** Expected: the project's table name of the item's pitch-class set at the title's tonic, or no name when the set equals no collection of at most 7 pitch classes. Tonic given to the library methods and used by the current detector: the key the project's detector found (`H.analyse`).

| method | set names a collection: exact | right among several | wrong | missed | set equals no collection: correct (no name) | false name |
| --- | --- | --- | --- | --- | --- | --- |
| current detector (tonic: its own key) | 149/149 | 0 | 0 | 0 | 77/77 | 0 |
| music21 deriveRanked, as returned (tonic: detected key) | 149/149 | 0 | 0 | 0 | 75/77 | 2 |
| music21 deriveRanked + equality check (tonic: detected key) | 149/149 | 0 | 0 | 0 | 77/77 | 0 |
| music21 deriveRanked + equality check, notes spelled with sharps only (tonic: detected key) | 149/149 | 0 | 0 | 0 | 77/77 | 0 |
| Tonal Scale.detect exact (tonic: detected key) | 149/149 | 0 | 0 | 0 | 69/77 | 8 |
| Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key) | 149/149 | 0 | 0 | 0 | 77/77 | 0 |
| Tonal Scale.detect exact (no tonic given) | 145/149 | 4 | 0 | 0 | 62/77 | 15 |

**Real items with a title key: what the wrong and false answers were (expected -> named).**

- current detector (tonic: its own key): none
- music21 deriveRanked, as returned (tonic: detected key): none -> ionian (major) / mixolydian [false_name] x2
- music21 deriveRanked + equality check (tonic: detected key): none
- music21 deriveRanked + equality check, notes spelled with sharps only (tonic: detected key): none
- Tonal Scale.detect exact (tonic: detected key): none -> other (ichikosucho) [false_name] x6; none -> other (bebop) [false_name] x2
- Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key): none
- Tonal Scale.detect exact (no tonic given): none -> other (bebop locrian) / other (bebop minor) / other (bebop) / other (ichikosucho) [false_name] x8; none -> other (composite blues) [false_name] x6; none -> other (piongio) [false_name] x1

**All 812 readable real items: how many each method gives a collection name to, by the size of the item's pitch-class set (no tonic given to the library methods; the current detector with its own key).** A name for 8 to 11 pitch classes is a false name by the page's rule (equality, not containment).

| method | fewer than 5 | 5 to 7 pitch classes | 8 to 11 pitch classes | 12 pitch classes |
| --- | --- | --- | --- | --- |
| items in the group | 8 | 147 | 326 | 331 |
| of which the set equals a table collection (or twelve) | 0 | 91 | 0 | 331 |
| current detector (tonic: its own key): items given a name | 0 | 84 | 0 | 331 |
| current detector (tonic: its own key): of those, named only with a collection outside the project's table (or with a set whose tonic is not its own) | 0 | 0 | 0 | 0 |
| music21 deriveRanked, as returned (tonic: detected key): items given a name | 8 | 141 | 0 | 331 |
| music21 deriveRanked, as returned (tonic: detected key): of those, named only with a collection outside the project's table (or with a set whose tonic is not its own) | 0 | 0 | 0 | 0 |
| music21 deriveRanked + equality check (tonic: detected key): items given a name | 0 | 87 | 0 | 331 |
| music21 deriveRanked + equality check (tonic: detected key): of those, named only with a collection outside the project's table (or with a set whose tonic is not its own) | 0 | 0 | 0 | 0 |
| Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key): items given a name | 0 | 115 | 0 | 331 |
| Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key): of those, named only with a collection outside the project's table (or with a set whose tonic is not its own) | 0 | 24 | 0 | 0 |
| Tonal Scale.detect exact (no tonic given): items given a name | 0 | 115 | 102 | 331 |
| Tonal Scale.detect exact (no tonic given): of those, named only with a collection outside the project's table (or with a set whose tonic is not its own) | 0 | 24 | 102 | 0 |

**Real items the current detector gives a mode or other non-major/minor name (8), and what each method says.** (tonic: the key the project's detector found.) Expected: see section 1 (no title or score text names a mode; truth is a reading).

| item | detected key | current | music21 + equality | music21 as returned (labels) | Tonal exact (tonic given) | Tonal exact (no tonic) |
| --- | --- | --- | --- | --- | --- | --- |
| song.classical.zimmer-time-hans-zimmer-inception.pdmx | A minor | dorian on A | dorian on A | dorian on A | dorian on A | lydian on C, mixolydian on D, aeolian (natural minor) on E, locrian on F#, ionian (major) on G, dorian on A, phrygian on |
| song.folk.anonymous-swing-low-sweet-chariot.pdmx | G major | major pentatonic on G | - | ionian (major) on G, lydian on G, mixolydian on G | major pentatonic on G | pentatonic set (tonic not its own) on D, minor pentatonic on E, major pentatonic on G, pentatonic set (tonic not its own |
| song.folk.old-macdonald | C major | major pentatonic on C | - | ionian (major) on C, lydian on C, mixolydian on C | major pentatonic on C | major pentatonic on C, pentatonic set (tonic not its own) on D, pentatonic set (tonic not its own) on E, pentatonic set  |
| song.folk.scarborough-fair-canticle.pdmx | E minor | dorian on E | dorian on E | dorian on E | dorian on E | locrian on C#, ionian (major) on D, dorian on E, phrygian on F#, lydian on G, mixolydian on A, aeolian (natural minor) o |
| song.folk.scarborough-fair.pdmx | E minor | dorian on E | dorian on E | dorian on E | dorian on E | locrian on C#, ionian (major) on D, dorian on E, phrygian on F#, lydian on G, mixolydian on A, aeolian (natural minor) o |
| song.folk.this-little-light-of-mine.pdmx | Bb major | major pentatonic on Bb | - | ionian (major) on Bb, lydian on Bb, mixolydian on Bb | major pentatonic on Bb | pentatonic set (tonic not its own) on C, pentatonic set (tonic not its own) on D, pentatonic set (tonic not its own) on  |
| song.pop.guantanamera.pdmx | A major | mixolydian on A | mixolydian on A | mixolydian on A | mixolydian on A | locrian on C#, ionian (major) on D, dorian on E, phrygian on F#, lydian on G, mixolydian on A, aeolian (natural minor) o |
| song.pop.scarborough-fair.pdmx | E minor | dorian on E | dorian on E | dorian on E | dorian on E | locrian on C#, ionian (major) on D, dorian on E, phrygian on F#, lydian on G, mixolydian on A, aeolian (natural minor) o |

**Passage level, generated scale drills: 942 single-note runs of at least 6 notes found by the project's `scale_runs`; 0 whose pitch-class set is not the declared collection (not scored); 942 scored.** Every method names the same run; the tonic given to the library methods is the run's local key tonic (as the current detector uses). Expected: the declared collection (melodic minor drills: the ascending run melodic minor, the descending run natural minor: a reading of the standard scale and the page's direction test).

| method | exact | right among several | wrong | missed | correct: no name | false name |
| --- | --- | --- | --- | --- | --- | --- |
| current detector (passage_name, local key) | 942 | 0 | 0 | 0 | 0 | 0 |
| music21 deriveRanked, as returned | 902 | 0 | 12 | 28 | 0 | 0 |
| music21 deriveRanked + equality check | 902 | 0 | 0 | 40 | 0 | 0 |
| Tonal Scale.detect exact | 942 | 0 | 0 | 0 | 0 | 0 |

**Passage level: runs by family (exact + correct no-name / scored).**

| family | scored runs | current detector (passage_name, local key) | music21 deriveRanked, as returned | music21 deriveRanked + equality check | Tonal Scale.detect exact |
| --- | --- | --- | --- | --- | --- |
| blues_scale | 48 | 48 | 24 | 24 | 48 |
| chromatic | 12 | 12 | 12 | 12 | 12 |
| pentatonic drill: blues | 6 | 6 | 2 | 2 | 6 |
| pentatonic drill: minor pentatonic | 12 | 12 | 0 | 0 | 12 |
| scale: harmonic minor | 240 | 240 | 240 | 240 | 240 |
| scale: major | 384 | 384 | 384 | 384 | 384 |
| scale: melodic minor | 144 | 144 | 144 | 144 | 144 |
| scale: natural minor | 96 | 96 | 96 | 96 | 96 |

**Passage level: what the non-exact answers were.**

- current detector (passage_name, local key): none
- music21 deriveRanked, as returned: blues scale -> (nothing) [missed] x28; minor pentatonic -> aeolian (natural minor) / blues scale / dorian / phrygian [wrong] x12
- music21 deriveRanked + equality check: blues scale -> (nothing) [missed] x28; minor pentatonic -> (nothing) [missed] x12
- Tonal Scale.detect exact: none

**Real passage: `song.folk.el-condor-pasa-if-i-could.pdmx` (the page's positive: a minor pentatonic run).** Runs of 6 or more single notes:

- bar 40 (0-based), hand R, 6 notes, set ['D', 'E', 'G', 'A', 'B'], local key E minor: current: 'minor pentatonic on E (local key)'; music21 + equality: - (tonic-free list: -); music21 as returned at that tonic: aeolian (natural minor) on E, dorian on E, phrygian on E, blues scale on E; Tonal at that tonic: minor pentatonic on E

**Runtime per item (milliseconds: mean / median / max), item level.** Measured on this machine in 12 worker processes (music21, current detector) and one Node process (Tonal); the naming step only, after the score is read and, for the current detector and the library methods that need a tonic, after the key is found.

| step | items | ms per item |
| --- | --- | --- |
| current detector, naming only (`item_name`) | 1186 | 0.13 / 0.03 / 43.60 |
| key detection the naming needs (`H.analyse`, whole analysis) | 1186 | 247.44 / 123.81 / 5745.32 |
| music21 `deriveRanked`, 13 scale classes, 12 results each | 1186 | 417.44 / 358.76 / 1098.35 |
| Tonal `Scale.detect` exact, every tonic in the set | 1186 | 0.09 / 0.07 / 0.77 |
| Tonal `Scale.detect` exact, one tonic given | 1138 | 0.01 / 0.01 / 0.32 |
| Tonal, whole batch of 2129 queries, one Node process | - | 203 ms in all |
| current detector, passage naming (`passage_name`) | 942 runs | 0.01 / 0.00 / 0.04 |
| music21 `deriveRanked`, one run's set (first time that set was seen) | 43 runs | 309.44 / 295.19 / 484.78 |