# Harmony and form rules

Code: `tools/classifier/rules/harmony.py` (the shared analysis and the `harmony.*`, `key.minor-form`, `scale.collection`,
`melody.chord-relation`, `texture.bass-walk-up` ids) and `tools/classifier/rules/form.py` (the `form.*` ids). Tests:
`tools/classifier/tests/test_rules_harmony.py` (real catalogue items only; skipped when the built catalogue is absent).
Run: `python tools/classifier/measure.py --only harmony.` (and `form.`, `key.`, `scale.`, `melody.`, `texture.bass-walk-up`).

Each rule below gives its definition with its source or its validation, the real items it was checked on (positive and
near-miss), and when it answers UNKNOWN. A source named here is the convention the rule follows; no rule quotes a page.
Where a threshold is mine, the reason and the measurement that set it are given instead. Nothing here has been heard:
every result is unverified as music.

## The shared analysis (`harmony.analyse`)

Every rule reads one analysis per score: the key, the chord timeline, the bass line and the melody.

**The chord timeline.**
- *From printed chord symbols* (460 of 2,020 notated items print them): music21 reads each `<harmony>` element
  (`MeasureParser.xmlToChordSymbol`); partitura keeps only the root and drops the kind, so it cannot be used for this.
  The positions come from a small walk of the MusicXML (divisions, backup, forward, offset). A symbol lasts until the
  next one. Provenance `one-witness` when the key is settled (confidence ≥ 0.85), else `inferred` with the key's confidence.
- *From the notes* (no symbols): template matching after Pardo and Birmingham (2002), *Algorithms for chordal analysis*,
  Computer Music Journal 26(2): six templates (major, dominant seventh, minor, diminished seventh, half-diminished
  seventh, diminished), score = weight of notes in the template − weight of notes outside − missing template notes,
  their tie-breaks (root weight, then template order). Minimal segments are beats; the best partition of each bar into
  beat spans is chosen by dynamic programming (the published method segments at every onset; beats are my simplification).
  One addition, measured below: the bass note sounding on a template's root adds its duration to that template's score
  (`BASS_W = 1`).
- **Validation of the notes path** (`build/h/validate_notes.py`, not committed): the notes path run on the 383 items that
  print symbols and have more than one line, compared beat by beat with the printed symbol's root (14,397 symbol beats).
  Root agreement by the share of the segment's sounding duration the chosen chord explains ("coverage"):

  | coverage | beats | root agrees | root and triad agree |
  | --- | --- | --- | --- |
  | 0.9-1.0 | 5,890 | 0.90 | 0.81 |
  | 0.8-0.9 | 2,225 | 0.78 | 0.64 |
  | 0.7-0.8 | 1,194 | 0.52 | 0.43 |
  | 0.6-0.7 | 583 | 0.67 | 0.63 |

  Published Pardo-Birmingham without the bass weight agreed on 0.774 of resolved beats, with it 0.811; adding minor-seventh
  and major-seventh templates lowered agreement (0.743), so they are not used. A segment below 0.8 coverage, or with fewer
  than three template notes present, is left unresolved (`MIN_COVERAGE`); a resolved segment's confidence is its band's
  measured agreement (0.90 or 0.78). With these settings the notes path leaves 6,282 of the 14,397 symbol beats
  unresolved and agrees on the root in 0.864 of the 8,115 it resolves. By family: generated exercises 1.00 except the
  ii-V-I exercises (0.67), whose rootless voicings defeat a root-finding template; PDMX classical, pop and folk 0.80-0.81,
  ragtime 0.91, jazz songs 0.54, blues songs 0.30 (176 beats), `song.beautiful` 0.47. The notes path is weak on jazz and
  blues textures; most of those items print symbols, which take precedence. The symbols are the witness here, and PDMX
  lead-sheet symbols are themselves one witness, so these are agreement rates, not accuracy.
- **UNKNOWN**: "melody only" when no two notes ever sound together and there are no symbols; "the texture does not show
  the chords" when fewer than 60% of sounding beats resolve (`MIN_RESOLVED`; scales and Hanon in two hands resolve 0%).

**The key** (a helper, not a registered id; `key.tonic-mode` is another builder's row and should replace it when it
exists). The signature gives two candidates, its major key and the relative minor. Three witnesses vote: the ending
(the final chord's root and quality, or the lowest note of the last onset; weight 2, or 1 when that is a lone
right-hand note in a two-hand piece), the opening (the first chord, or the lowest first note; weight 1), and partitura's
Krumhansl-Schmuckler estimate (Krumhansl 1990; weight 1). The candidate with at least two votes and more than the other
wins; a single uncontradicted vote gives confidence 0.6; the ending and K-S agreeing on a key outside the signature are
accepted at 0.7; otherwise UNKNOWN with the votes listed. A minor triad with its minor seventh at the end (Dm7 = F6, a
common jazz ending) gives no ending vote. **Validation**: on the 438 generated exercises whose id names their key, 433
right, 2 wrong (two left-hand broken-chord exercises in A and D minor that end on the relative major chord), 3 UNKNOWN.
PDMX keys are not checked against any reference.

**Numerals** are jazz-style, so they read the way the lessons name chords: degree (with b or # against the major scale,
or against natural minor with the raised sixth and seventh unmarked), case by the triad (upper for major, dominant and
augmented, lower for minor and diminished), suffix `7`, `maj7`, `6`, `°`, `°7`, `ø7`, `+`, `sus`. music21's
`romanNumeralFromChord` was tried and rejected for this: it names a C7 in C as `Ib753`.

**Lines**: the bass is the lowest left-hand note per onset (none for a one-staff item that is not a left-hand part); the
melody is the highest right-hand note per onset (score.py's hand rule).

## harmony.roman

**Definition**: the numeral of every chord change in the key (above). Value: `{key, source, chords: [[bar, beat, numeral]],
resolved}` (resolved: the notes path's share of resolved beats).
**Positives**: `exercise.ii-v-i.c` (ii7 V7 Imaj7), `exercise.tritone-sub.c` (ii7 bII7 Imaj7), `exercise.walking-bass.c.minor-blues`
(C minor), `exercise.cadence.c.root` (notes: I IV V7 I).
**Near-misses**: `exercise.blues-scale.c.1oct.right` (melody only), `exercise.scale.a-harmonic-minor.1oct.similar.both.2`
(two lines, no chords), `song.blues.blues-riff-in-c.pdmx` (one bass note a bar under a riff; 25% of beats resolve).
**UNKNOWN**: no symbols and a melody-only or unresolved texture; the key unresolved.

## key.minor-form

**Definition** (the three forms of the minor scale, as taught in every harmony text, e.g. Kostka and Payne, *Tonal
Harmony*, ch. 1): in a minor key, per hand in onset order, a raised sixth moving to the raised seventh (or from the fifth
up through it) is **melodic**; a raised seventh not preceded by the raised sixth is **harmonic**; a lowered seventh is
**natural** (it is also the melodic form's descent, so ["melodic", "natural"] is the full melodic minor scale). Value
`{mode, forms, counts}`; a major key gives `forms: []`.
**Positives**: `exercise.scale.a-harmonic-minor.1oct.similar.both.2` (harmonic), `...a-melodic-minor...right.2` (melodic),
`...a-natural-minor.1oct.similar.both.2` (natural). **Near-miss**: `exercise.scale.c-major.1oct.similar.both.2` (major, none).
**UNKNOWN**: the key unresolved (159 items, mostly single-line items where the K-S estimate and the ending disagree).

## scale.collection

**Definition**: the item's pitch-class set, and each hand's, equal to a named collection: the diatonic set (named as the
mode on the key's tonic: ionian, dorian, ... aeolian), harmonic minor, melodic minor (ascending, and both directions),
major and minor pentatonic, the blues scale (1 b3 4 #4 5 b7), whole-tone; or "all twelve pitch classes"; or "fewer than
five pitch classes"; or "no named collection (n)". Equality, not containment: three notes fit many collections and
identify none. A hand's collection is marked "(no scale run)" when the hand never plays four different notes in one
direction by steps of one to three semitones, so sounding a set in chords or figures is told from playing it as a scale.
Four-bar passages whose set is a pentatonic, blues or whole-tone collection different from the hand's whole set, and
which contain such a run, are listed. Provenance `exact` when the name needs no key, else `inferred` with the key's confidence.
**Positives**: `exercise.blues-scale.c.1oct.right` (blues scale on C), `exercise.pentatonic.a.pentatonic` (minor
pentatonic on A), `exercise.scale.c-major.1oct.similar.both.2` (ionian on C).
**Near-misses**: `exercise.five-finger.c-major.right` (five notes, no named collection), `exercise.blues.twelve-bar-shuffle.c`
(the shuffle bass over C7 and F7 sounds an F pentatonic set in bars 5-8: no passage, it is no scale run; red before the
run test), `exercise.open-voicing.c.quartal` (stacked fourths are a pentatonic set: "(no scale run)").
**UNKNOWN**: never (an item with notes always has a set); the name falls back to the set when the key is unknown.

## harmony.progression

**Definitions**, over the chord changes with inversions ignored:
- **I-IV-V only** (the primary triads): every chord is I, IV or V(7) (i, iv, V in minor) and all three occur.
- **V7-I, V-I, IV-I** (minor: V7-i, iv-i): the two chords consecutive.
- **ii-V-I / ii-V-i** (Levine, *The Jazz Theory Book*, ch. on II-V-I): a minor (or, before a minor tonic, half-diminished
  or minor) chord, a dominant a fourth up, a major (or minor) chord a fourth up again; on the home tonic, or labelled
  "(local, to X)" on another degree.
- **Named four-chord progressions** (major keys, exact order once): I-V-vi-IV, I-vi-IV-V, vi-IV-I-V, I-vi-ii-V.
- **Four-chord loop**: four chords with at least three roots played three times running (two times is a repeated phrase).
- **Rhythm changes** (Gershwin's *I Got Rhythm*): the bridge III7-VI7-II7-V7, each chord at least a bar, after an A
  section containing I-vi-ii-V (or I-VI7-ii-V); the bridge alone is reported as a "III7-VI7-II7-V7 chain".
**Positives**: `exercise.ii-v-i.c`; `song.jazz.kenny-dorham-blue-bossa.pdmx` (ii-V-i 5 times and the ii-V-I to bII,
the tune's move to D flat); `exercise.loop4.c.root` (I-V-vi-IV); `exercise.cadence.c.root` (I-IV-V only).
**Near-misses**: `exercise.loop4.c.root` is one pass, not a loop; `exercise.turnaround.c.i-vi-ii-v` ends on V (no ii-V-I).
**Not validated**: rhythm changes. No item in the catalogue gives a positive: `song.classical.i-got-rythm.pdmx` resolves
only 51% of its beats from the notes and is UNKNOWN. The rule runs; it has never been seen to fire correctly.
**UNKNOWN**: the chord timeline or key is UNKNOWN.

## harmony.applied

**Definitions** (Kostka and Payne, chs. on secondary functions; Levine on tritone substitution):
- **V/x, V7/x**: a major triad or dominant seventh, not in the key, whose root is a fifth above the next chord, which is a
  major or minor triad on a diatonic degree other than I. Not counted when the tonic chord is a dominant seventh most of
  the time (the blues' I7 is the home chord, not V7/IV).
- **vii°/x**: a diminished chord, not in the key, a semitone below such a target.
- **subV7**: a dominant seventh a semitone above the chord it moves to.
- **chromatic approach**: a chord not in the key, of the next chord's quality, a semitone above or below it and no
  longer than it (the generator's own description of `exercise.passing-chord`: "the chord a semitone above the one you
  meant, played first").
- **passing**: a chord not in the key whose root lies by step between its neighbours' roots, all moving one way, the
  span two or three semitones.
- **tonicised**: the degrees reached by a resolving secondary dominant or by their own ii-V.
- **pivot chords: NOT DONE.** A pivot chord is defined by the modulation it serves (a chord diatonic in both keys); it
  needs `key.change`, which no registered code measures yet.
**Positives**: `exercise.passing-chord.c` (chromatic approach ×2: Ebm7→Dm7, Ab7→G7; subV7 ×1: Ab7→G7),
`exercise.tritone-sub.c` (subV7, and passing: Dm7-Db7-Cmaj7), `song.folk.amazing-grace-in-g-major-for-piano-breezepiano.pdmx`
(V7/IV at bar 3: G7 with B in the bass to C, checked by hand).
**Near-misses**: `exercise.blues.twelve-bar-shuffle.c` (C7→F7 is not V7/IV here; red before the blues-tonic guard),
`exercise.ii-v-i.c` (diatonic: nothing applied).
**UNKNOWN**: the chord timeline or key is UNKNOWN.

## harmony.voicing

**Definitions** (Levine, *The Jazz Piano Book* and *The Jazz Theory Book*: shell, rootless and fourth voicings; close
and open position as in Aldwell and Schachter, *Harmony and Voice Leading*), for each hand's attack of two or more
notes under a chord symbol, against the symbol's root and tones (music21's pitches for the symbol, so an add9 counts its
ninth):
- **quartal**: three or more notes stacked in perfect fourths (a major third allowed on top);
- **shell**: the root with the third and/or seventh (or sixth) and nothing else, two or three pitch classes;
- **shell (split hands)**: the third and seventh in this hand with the other hand sounding the root below;
- **guide tones (3-7)**: the third and seventh alone, no root sounding below;
- **rootless**: no root, the third and seventh present, three or more pitch classes;
- **close**: chord tones only, the notes above the lowest within an octave, no chord tone skipped between neighbours;
- **open**: chord tones only, spanning an octave or more, not close;
- **other**: anything else (a dyad of root and fifth, a sonority with non-chord tones).
Value: counts per hand and type.
**Positives**: `exercise.voicing7.c.shell`, `.rootless-a` (F A C E over Dm7), `.rootless-b`, `.close`;
`exercise.open-voicing.c.quartal`; `exercise.open-voicing.c.add9` (open); `exercise.ii-v-i.c` (shell split hands: D in
the bass, F-C, F-B, E-B above).
**Near-misses**: `exercise.open-voicing.c.sus4` (C4 F4 G4 C5: close, the doubled root does not make it open);
`exercise.stride.c` (the left hand's E-G over C is "other", its B-F over G7 is guide tones).
**UNKNOWN**: no chord symbols (a rootless or quartal voicing hides its root from the notes, so the notes path is not
used); no hand plays two notes at once under a symbol.

## harmony.bass-behaviour

**Definitions**:
- **root on change**: of the chord changes the bass strikes, the share where it strikes the root; a printed slash bass
  struck instead is counted separately.
- **pedal point** (Kostka and Payne: a sustained or repeated note, usually in the bass, against which the harmony
  changes, some chords not containing it): one bass pitch class for every bass note across at least two chord changes,
  at least one chord in the span not containing it, the span at least two bars (my threshold: one bar's neighbour chord
  over a held bass, common in any accompaniment, is not counted; checked on `song.classical.beethoven-moonlight-iii`,
  where the one-bar threshold fired on a single bar of D sharp under D#7-C#°-D#7).
- **anticipation** (the anticipated bass of Latin bass lines; Mauleón, *Salsa Guidebook*): the next chord's root struck
  within the beat before the change, not a tone of the current chord, and no new bass note at the change.
- **walking bass: not here.** It is defined once in `app/src/demands/detect.ts` (`walkingBass`, onedef); this rule does
  not define it a second time.
**Positives**: `exercise.tumbao.c` (4 anticipations: F2 on beat 4 under Cm into Fm; the bass never strikes on the change),
`exercise.slash-bass.c` (3 slash basses of 8 changes), `exercise.blues.twelve-bar-shuffle.c` (root on all 7 changes).
**UNKNOWN**: the chord timeline or key is UNKNOWN; no bass line.

## melody.chord-relation

**Definitions**, for each melody note under a chord:
- **strong-beat chord tones**: the share of notes on strong beats (the downbeat, and the half bar in four-beat and longer
  even meters) that are chord tones;
- **guide tones on strong beats**: the third or seventh of a seventh chord (Levine);
- **approach notes**: a non-chord tone on a weak beat that moves by one or two semitones to a chord tone of the next
  note's chord; chromatic (not in the key, a semitone) or diatonic;
- **blue notes** (major keys): the lowered third, fifth or seventh of the key, *spelled* as such (E flat, G flat, B flat
  in C; a D sharp or F sharp is a chromatic approach), not a chord tone, or the seventh over the blues' I7. In minor keys
  the lowered fifth only. The spelling test was added after the first run counted 266 items with "blue fifths", 177 of
  them classical, nearly all F sharp leading to G; it now counts 39. It under-counts blues written with sharps
  (`song.blues.livery-stable-blues` writes F# for the blue third in E flat); that is the price of not over-claiming;
- **anticipations** (Kostka and Payne's non-chord tones): a tone of the next chord, foreign to the current one, struck
  within the beat before the change and held into it or struck again on it.
**Positives**: `exercise.blues.twelve-bar-shuffle.c` (every strong beat a chord tone, guide tones, blue sevenths over I7).
**UNKNOWN**: the chord timeline or key is UNKNOWN; no right-hand line (`exercise.cadence.c.root`); no strong-beat note under a chord.

## texture.bass-walk-up

**Definition** (operational; the walk-up of country, gospel and boogie bass lines, and the generator's own
`exercise.walkup`): two to four bass notes rising by one or two semitones into the root of the next chord, all sounding
under the one chord before it, not inside a walking texture (a bass striking a new pitch on every beat of this bar and the
bar before).
**Positives**: `exercise.walkup.c` (2: C D E into F, C C# D E into F); `song.folk.boogie-woogie.pdmx` bar 47 (A Bb B
into C7, checked by hand).
**Near-misses**: `exercise.voicing.a` (A, B, C# under I, ii, iii, one bass note per chord: a root progression by step) and
`exercise.modal-vamp.a` (F G A under VI VII i); both counted before the one-chord condition, 0 after.
**UNKNOWN**: the chord timeline or key is UNKNOWN; no bass line.

## harmony.cadence

**Phrase ends: notated ones only.** Phrase segmentation (`form.phrase`) is a separate research row with no code. What
can be found defensibly is where the notation marks an end: the final bar, the end of every repeat, every double bar,
and every fermata (the chorale convention: a fermata closes each phrase). An unmarked phrase end inside a section is
not found, so the list is a lower bound and says so in its value (`phrase_ends: "notated only"`).
**Definitions** (Kostka and Payne, ch. on cadences; Caplin, *Classical Form*): at each notated end, the last two chords:
**authentic** V(7)→I (**perfect** when both are in root position, the lowest sounding note at each onset being the
root, and the tonic is the highest note at the end; else **imperfect**), **authentic (leading-tone)** vii°→I, **half**
ending on V, **plagal** IV→I, **deceptive** V→vi (VI in minor), else none.
**Positives**: `exercise.cadence.c.root` (imperfect authentic: G on top at the end), `exercise.cadence.c.plagal`
(plagal), `exercise.blues.twelve-bar-shuffle.c` (half: the chorus ends on V7).
**UNKNOWN**: the chord timeline or key is UNKNOWN.

## form.twelve-bar

**Definition** (the twelve-bar blues and its variants as documented in Levine, *The Jazz Theory Book*, ch. on the blues):
per bar of a twelve-bar block, the root degree of the chord on the downbeat must be: 1 I; 2 I or IV (**quick IV** when
IV); 3 I; 4 I or the minor v of a ii-V into IV; 5 IV; 6 IV or #iv°; 7 I or iii; 8 I, VI, iii or bIII; 9 V or ii; 10 IV,
V or ii; 11 I or iii; 12 anything (the turnaround). The tonic and bar 5 are major-quality (I7 counts). **Minor**: i i i i
| iv iv i i | V, bVI or ii° | V or iv | i | any, the tonic minor. Blocks are found left to right without overlap, so
an intro or a sixteen-bar strain around them does not matter.
**Two witnesses**: where the item prints symbols and has a bass, the downbeat bass read as the bar's root must give the
same verdict, else UNKNOWN. **Validation**: on 2,053 bars with a symbol on the downbeat and a bass, the downbeat bass is
the symbol's root in 0.906 (generated 1.00; PDMX 0.72-0.97); the twelve-bar verdict from the bass alone agreed with the
verdict from the symbols on all 344 items with both (27 twelve-bar, 317 not). So where the notes do not show the chords,
the downbeat bass is used alone (`basis: "downbeat bass as root"`, confidence the key's × 0.9).
**Positives**: `exercise.blues.twelve-bar-shuffle.c` (standard, two witnesses), `exercise.walking-bass.c.minor-blues`
(minor), `song.blues.riverside-blues` (quick IV), `song.blues.blues-riff-in-c.pdmx` (bass basis: C C C C F F C C G F C C).
**Near-misses**: `exercise.walking-bass.c.ii-v-i` (four bars), `song.pop.careless-love-blues.pdmx` (an eight-bar song
named a blues), `song.blues.st-james-infirmary` (a minor song called a blues, not the form),
`exercise.study.metre-compound.e-flat-major.6-8.12bar.blocked.01` (twelve bars, not a blues).
**UNKNOWN**: no timeline and no bass or key; the symbols and the bass disagree.

## form.turnaround

**Definition** (Levine: a progression at the end of a section that leads back to its start): at each chorus end (a
twelve-bar block's end, a marked section boundary, a repeat's end back to its start, the end of the item back to bar 1),
the last two bars hold at least two different chords ending on a dominant (V, bII7 or vii°) and the bar it returns to
starts on the tonic. Value: the count and the numeral patterns.
**Positives**: `exercise.turnaround.c.i-vi-ii-v` (Imaj7-vi7-ii7-V7, back to the top), `exercise.blues.twelve-bar-shuffle.c`
(I7-V7 in bars 11-12).
**Near-misses**: `exercise.cadence.c.root` (ends on I: a cadence, not a turnaround); `song.folk.chicken-reel.pdmx`
(two bars of V7 before the repeat: a half cadence; counted as "V7-V7" until the two-chord condition).
**UNKNOWN**: the chord timeline or key is UNKNOWN.

## form.multi-strain

**Definition** (classic rag and march form, Berlin, *Ragtime: A Musical and Cultural History*: AABBACCDD, sixteen-bar
strains, a trio in the subdominant): sections between marked boundaries (repeat starts and ends with their second
endings, double bars that are not repeat signs, key-signature changes); a section's length counts a first ending once
and leaves out a pickup bar. **Multi-strain** when three or more sections are sixteen or thirty-two bars; **trio in the
subdominant** when a key signature one flat more than the home key starts one of them.
**Positives**: `song.ragtime.joplin-maple-leaf-rag` (16 16 16 16 16, trio in D flat), `song.ragtime.joplin-entertainer`
(trio in F), `song.ragtime.joplin-crush-collision-march`.
**Near-misses**: `song.classical.bach-little-prelude-in-c-major-bwv-933.pdmx` (binary, not multi-strain). Chopin
waltzes and mazurkas with several sixteen-bar sections also count as multi-strain: the rule reads the sections, not the
genre.
**UNKNOWN**: no repeats, double bars or key changes (1,560 items, most generated exercises).

## form.thirty-two-bar

**Definition** (the AABA chorus of the American popular song, Forte, *The American Popular Ballad of the Golden Era*):
the bars in playing order (repeats unfolded, first endings skipped on the second pass); for a start in the first nine
bars, four eight-bar sections; section similarity = the mean of melody similarity (per bar, the shared (position,
pitch) events over all events) and, where the chord timeline stands, the share of bars with the same downbeat root and
quality. **AABA** when both pairs of A sections are at least 0.6 alike and the B at most 0.35 alike to either A, and
the AABA is the chorus: at most eight bars follow it, or what follows starts the chorus again. **Not AABA** when no two
A's reach 0.25 at any start, or when what follows the AABA is the bridge again (a rounded binary with repeats unfolds
to A A B A B A). **Thresholds**: set on the sections of `song.pop.frank-sinatra-let-it-snow-leadsheet.pdmx` (A-A
0.93-0.95, A-B 0.05-0.07), `song.jazz.george-shearing-lullaby-of-birdland.pdmx` (0.81-0.98 vs 0.08-0.14),
`song.jazz.bart-howard-fly-me-to-the-moon.pdmx` (A-A 0.03-0.25) and `song.jazz.fats-waller-ain-t-misbehavin.pdmx`
(an AABA tune in a varied stride arrangement: A-A 0.36, so UNKNOWN, not a wrong "no").
**Positives**: Let It Snow, Lullaby of Birdland, `song.classical.i-got-rythm.pdmx`.
**Near-misses**: Fly Me to the Moon (not AABA); `song.classical.burgmuller-burgmuller-arabesque-op-100-no-2.pdmx`
(AABA followed by the bridge again: not AABA; it was AABA before the chorus condition). Short ternary études with a
repeated first section (Bertini op. 29 no. 4, Duvernoy op. 176 no. 19) still read AABA: the rule finds the section
pattern, and whether it is a song chorus is a style question it does not answer.
**Exact negative**: fewer than 32 bars played (value `form: null`).

## form.binary-ternary

**Definition** (Green, *Form in Tonal Music*; Caplin, *Classical Form*): **binary** when two repeated sections follow
one another and cover the piece; **rounded binary** when, in addition, the opening (up to four bars) returns in the
second half of B at 0.6 similarity or more; **ternary (da capo al fine)** when the file marks D.C. and Fine; **ternary**
when three marked sections are A, contrasting B (similarity ≤ 0.35) and A again (≥ 0.6); otherwise "other (n marked
sections)".
**Positives**: `song.classical.bach-little-prelude-in-c-major-bwv-933.pdmx` (binary),
`song.classical.mozart-andantino-in-c-major-k-15b.pdmx` (rounded binary), `song.classical.mozart-contredanse-in-a-major-k-15l.pdmx`
(Fine at bar 8, D.C. at the end).
**UNKNOWN**: no repeats, double bars or D.C. marked (1,558 items).

## What is not here

- **Pivot chords** (in `harmony.applied`): NOT DONE; they need `key.change`.
- **Walking bass** (in `harmony.bass-behaviour`): defined in `app/src/demands/detect.ts`; not repeated here.
- **Rhythm changes** (in `harmony.progression`): the rule exists and has no measured positive in the catalogue.
- **Unmarked phrase ends** (in `harmony.cadence`): need `form.phrase`.
- **A second witness for the notes path**: a trained Roman-numeral model (AugmentedNet, named in characteristics.yaml)
  is not installed; it would give the notes path the independent witness that the symbols give the symbol path.
