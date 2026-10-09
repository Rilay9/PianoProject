### Parse of `<harmony>` (reading the notation)

| pipeline | items with `<harmony>` | symbols raw: current walk / music21 | after de-duplication: walk / music21 | N.C.: walk / music21 | slash chords: walk / music21 (reference) | items whose symbols (root, bass, N.C.) equal the reference: current / music21 | music21 errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| generated | 327 | 1520 / 1520 | 1520 / 1520 | 0 / 0 | 12 / 12 (12) | 327 / 327 | 0 |
| pdmx | 96 | 4984 / 4984 | 3619 / 3617 | 56 / 56 | 299 / 299 (299) | 96 / 95 | 0 |
| other | 37 | 1364 / 1370 | 1268 / 1268 | 6 / 6 | 104 / 104 (104) | 37 / 37 | 0 |
| all | 460 | 7868 / 7874 | 6407 / 6405 | 62 / 62 | 415 / 415 (415) | 460 / 459 | 0 |

**Text route**: {"distinct": 239, "symbols": 2628, "m21": {"strings_parsed": 150, "strings_root_bass_right": 126, "symbols_parsed": 2250, "symbols_root_bass_right": 1803}, "tonal": {"strings_parsed": 202, "strings_root_bass_right": 202, "symbols_parsed": 2489, "symbols_root_bass_right": 2489}, "regex": {"strings_parsed": 174, "strings_root_bass_right": null, "symbols_parsed": 2408, "symbols_root_bass_right": null}}

music21 chord kinds read from `<harmony>` over all 460 items: {"major": 2397, "minor": 850, "dominant-seventh": 1877, "minor-seventh": 529, "major-seventh": 263, "minor-11th": 16, "suspended-second": 16, "suspended-fourth": 31, "power": 13, "major-sixth": 65, "minor-ninth": 23, "minor-sixth": 28, "augmented": 8, "diminished": 102, "augmented-seventh": 19, "dominant-ninth": 18, "half-diminished-seventh": 40, "minor-major-seventh": 7, "other": 8, "diminished-seventh": 23, "major-ninth": 1, "dominant-13th": 8, "major-13th": 1}

### Parse of symbols typed as text (239 distinct printed strings, 2,628 symbols, built from each symbol's own printed root, kind text and bass)

| parser | strings parsed | strings with the right root and bass | symbols parsed | symbols with the right root and bass |
| --- | --- | --- | --- | --- |
| current text rule (the validators' pattern, `CHORD_TXT`) | 174 / 239 | n/a (matches a pattern only) | 2408 / 2628 | n/a |
| music21 `harmony.ChordSymbol(text)` | 150 / 239 | 126 | 2250 / 2628 | 1803 |
| Tonal `Chord.get` (tonal 6.2.0) | 202 / 239 | 202 | 2489 / 2628 | 2489 |

### Text candidates on the named items without `<harmony>`

| item | what it holds (reading) | words the current rule offers as symbols | Tonal | music21 |
| --- | --- | --- | --- | --- |
| song.pop.coldplay-fix-you-coldplay.pdmx | reading: real chord symbols typed as words (validation row) | Ex2, Gmx2, Cmx2, Gm/B, B | E: E major; Gm: G minor; Cm: C minor; Gm/B: G minor over B; B: B major | E: major; Gm: minor; Cm: minor; Gm/B: minor; B: major |
| song.classical.i-got-rythm.pdmx | reading: real chord symbols typed as words (validation row) | B6x2, F10, Bdim7/D, Cm9x2, E, D | B6: B sixth; F10: not a chord; Bdim7/D: B diminished seventh over D; Cm9: C minor ninth; E: E major; D: D major | B6: major-sixth; F10: ; Bdim7/D: diminished-seventh; Cm9: minor-ninth; E: major; D: major |
| song.classical.handel-halvorsen-passacaglia | reading: real chord symbols typed as words (validation row) | Amx2, Dmx2, G, C, F, E | Am: A minor; Dm: D minor; G: G major; C: C major; F: F major; E: E major | Am: minor; Dm: minor; G: major; C: major; F: major; E: major |
| song.classical.chopin-chopin-waltz-in-a-minor-piano-solo.pdmx | reading: note-name reading aids, not chord symbols (validation row) | Ex2, Ax2, B, Cx3 | E: E major; A: A major; B: B major; C: C major | E: major; A: major; B: major; C: major |
| song.classical.mozart-mozart-minuet-in-f-major-k2-easy.pdmx | reading: digit words (fingerings), not Nashville numbers (validation row) | none | - | - |

### Role of the notes under each symbol, named items (symbols right / symbols)

| item | expected role (source) | symbols | current step 3 | with the family fix | skyline | MidiBERT |
| --- | --- | --- | --- | --- | --- | --- |
| exercise.montuno.a.2note.son-3-2 | over written accompaniment (score: right hand only, two-note chord-tone figure on the clave strokes, no line; contract name 'a right-hand montuno of chord tones') | 4 | 0 ({'over a melody line': 4}) | 4 ({'over written accompaniment': 4}) | 0 | 0 / 4 ({'over a melody line': 4}) |
| song.classical.1818-franz-xaver-gruber-silent-night.pdmx | over a melody line (score: one staff, single notes (the tune), symbols above it) | 11 | 11 ({'over a melody line': 11}) | 11 ({'over a melody line': 11}) | 11 | 9 / 11 ({'over a melody line': 9, 'over written accompaniment': 2}) |
| exercise.blues.twelve-bar-shuffle.c | over written accompaniment (score: right-hand seventh chords on beats 1 and 3, left-hand shuffle bass; no line) | 12 | 0 ({'over a melody line': 12}) | 0 ({'over a melody line': 12}) | 0 | 7 / 12 ({'over written accompaniment': 7, 'over a melody line': 5}) |
| exercise.slash-bass.c | over written accompaniment (score: held triads in the right hand, walking bass in the left; no line) | 8 | 0 ({'UNKNOWN role of the notes': 8}) | 0 ({'UNKNOWN role of the notes': 8}) | 0 | 8 / 8 ({'over written accompaniment': 8}) |
| song.classical.czerny-the-school-of-velocity-op-299-no-10.pdmx | per bar: right hand sounds -> over a melody line; left hand alone -> over written accompaniment (score (reading): the left hand is a continuous broken-chord figure, the right hand the running line; judged, not annotated) | 122 | 81 ({'over written accompaniment': 6, 'over a melody line': 75, 'UNKNOWN role of the notes': 41}) | 81 ({'over written accompaniment': 6, 'over a melody line': 75, 'UNKNOWN role of the notes': 41}) | 116 | 122 / 122 ({'over written accompaniment': 6, 'over a melody line': 116}) |

### Generated items with symbols: current step 3 answer per symbol, the fix, and the same-signature count

| family | items | current answers (symbols) | answers with the montuno fix | items whose only sounding staff plays chords in every symbol bar and are answered 'over a melody line' |
| --- | --- | --- | --- | --- |
| comping | 58 | {'UNKNOWN role of the notes': 184, 'over a melody line': 48} | {'UNKNOWN role of the notes': 184, 'over a melody line': 48} | 0 |
| seventh_voicing | 48 | {'UNKNOWN role of the notes': 144} | {'UNKNOWN role of the notes': 144} | 0 |
| boogie | 36 | {'over a melody line': 144} | {'over a melody line': 144} | 0 |
| ii_v_i | 36 | {'UNKNOWN role of the notes': 36, 'over a melody line': 72} | {'UNKNOWN role of the notes': 36, 'over a melody line': 72} | 24 |
| walking_bass | 28 | {'UNKNOWN role of the notes': 155, 'over a melody line': 137} | {'UNKNOWN role of the notes': 155, 'over a melody line': 137} | 0 |
| four_chord_loop | 24 | {'UNKNOWN role of the notes': 96} | {'UNKNOWN role of the notes': 96} | 0 |
| open_voicing | 16 | {'UNKNOWN role of the notes': 64} | {'UNKNOWN role of the notes': 64} | 0 |
| montuno | 15 | {'over a melody line': 60} | {'over written accompaniment': 60} | 15 |
| turnaround | 12 | {'UNKNOWN role of the notes': 48} | {'UNKNOWN role of the notes': 48} | 0 |
| oompah | 8 | {'over a melody line': 32} | {'over a melody line': 32} | 0 |
| None | 6 | {'over a melody line': 72} | {'over a melody line': 72} | 0 |
| intro | 5 | {'over a melody line': 15, 'UNKNOWN role of the notes': 5} | {'over a melody line': 15, 'UNKNOWN role of the notes': 5} | 0 |
| latin_groove | 5 | {'UNKNOWN role of the notes': 40} | {'UNKNOWN role of the notes': 40} | 0 |
| tumbao | 5 | {'over a melody line': 40} | {'over a melody line': 40} | 0 |
| passing_chord | 4 | {'UNKNOWN role of the notes': 24} | {'UNKNOWN role of the notes': 24} | 0 |
| slash_bass | 4 | {'UNKNOWN role of the notes': 32} | {'UNKNOWN role of the notes': 32} | 0 |
| stride | 4 | {'UNKNOWN role of the notes': 16} | {'UNKNOWN role of the notes': 16} | 0 |
| tritone_sub | 4 | {'UNKNOWN role of the notes': 12} | {'UNKNOWN role of the notes': 12} | 0 |
| walkup | 4 | {'UNKNOWN role of the notes': 16} | {'UNKNOWN role of the notes': 16} | 0 |
| power_chord | 3 | {'UNKNOWN role of the notes': 12} | {'UNKNOWN role of the notes': 12} | 0 |
| meter | 1 | {'over a melody line': 12} | {'over a melody line': 12} | 0 |
| secondary_rag | 1 | {'over a melody line': 4} | {'over a melody line': 4} | 0 |