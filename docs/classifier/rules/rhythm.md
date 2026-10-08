# Rhythm-cell and style-pattern rules

Code: `tools/classifier/rules/rhythm.py`. Tests: `tools/classifier/tests/test_rules_rhythm.py` (real catalogue items, positives and near-misses per rule). Each rule reads notes only through `score.load` and returns `{"present", "bars", ...}` with `where` (0-based measure indices), or UNKNOWN with the reason.

**What every rule claims.** Onsets, never the style (the CD1 convention for the habanera). A bar holding the son clave's onsets holds them; that the piece is a son, suits teaching the clave, or is played with its feel is not found here. Where onsets cannot decide the characteristic, the rule answers UNKNOWN and says why (`texture.tango`, part of `texture.mazurka`, part of `rhythm.shuffle`).

**Shared conventions** (the same as the app's `cellBars`, `app/src/demands/detect.ts`, where they apply):
- onsets are a hand's distinct onsets in a printed bar, as exact fractions of the bar; chords and voices merge; a tie chain is one note, so a bar entered by a tie has no onset at its start; grace notes are left out;
- a pickup bar, and any bar shorter or longer than its time signature, is never read;
- exact equality of onset sets, unless a rule says otherwise;
- **a pattern** (what "present" needs): the figure in two consecutive bars (or cycles), or in four bars anywhere. One bar is an incident. Validation: Lullaby of Birdland holds the tumbao's onsets in three scattered bars (3, 7, 21) and is not a tumbao; the generated families hold their figures in every bar.
- the habanera and tresillo sets are imported from `tools/content/cells.py`, never restated.

Measured on the built catalogue of 2026-10-07 (2,020 notated items; 4 fail to load in `score.load`, the same for every rule): see the table at the end.

## texture.clave

**Definition.** A hand whose onsets over one 16-pulse cycle are exactly a clave: son 3-2 pulses {0, 3, 6, 10, 12}, rumba 3-2 {0, 3, 7, 10, 12}, the bossa nova clave {0, 3, 6, 10, 13}; 2-3 is the same cycle started at pulse 8. Source: Wikipedia, "Clave (rhythm)" (the pulse grids for son and rumba; the bossa nova clave as the son "but the second note on the two-side is delayed by one pulse"; "The contemporary Cuban practice is to write the duple-pulse clave in a single measure of 4/4"). The generator's `CLAVE_PATTERNS` (`tools/content/generate_exercises.py`) agrees on all five.

A cycle is read in either notation: 4 quarters on sixteenths (one 4/4 or 2/2 bar, two 2/4 bars) or 8 quarters on eighths (two 4/4 or 2/2 bars, the cut-time practice). Cycles are scanned from the start and do not overlap, so a running clave stays in phase and is read as 3-2 or 2-3 by where it starts. The value names the kinds. Of the two hands, the one with more cycles is reported.

**Positives.** `exercise.clave.*` (every pattern is its own kind), `exercise.clave.*.pulse` (the clave hand; the quarter pulse in the other hand is no clave), the montuno and latin-groove right hands (clave chords), `exercise.comping.*.bossa`. Repertoire: HONNE, *Location Unknown*: the left hand's bars 28, 30, 32 … are the bossa clave's onsets on sixteenths (`{0, .75, 1.5, 2.5, 3.25}`), one bar in two.

**Near-misses.** The tresillo (the clave's first three strokes, `exercise.tresillo.c`); the rumba against the son (one stroke apart, kept apart by exact equality); one cycle alone (*Apex of the World*, bars 88-89).

**UNKNOWN.** No readable bar in 2/4, 4/4 or 2/2.

## texture.montuno

**Definition (operational).** A repeated syncopated chordal figure aligned to a son or rumba clave: in one hand, a cycle whose onsets contain every stroke of the clave, that has an onset off the beat with no onset on the next pulse, that sounds on at most half the cycle's pulses, that has chords at half its onsets or more, and that repeats exactly in a neighbouring cycle. The bossa clave is left out: the montuno is a Cuban son practice, the bossa clave Brazilian. Source for the alignment: the yaml's own "syncopated repeated figure aligned to a clave", and `latin.md` as the generator quotes it ("the montuno … on the clave"). Validated on the catalogue: the first version (clave strokes a subset of the onsets, syncopated, repeated) found 67 items, 52 of them repertoire, all ragtime syncopation and running figures that contain every clave because they sound on 13 to 16 of the 16 pulses (Joplin's *Felicity Rag* bars 5-8: 14 pulses; Chopin's Rondo Op. 16; *Rolling Girl*). The half-the-pulses and chord conditions remove every one of them and keep every generated montuno.

**Positives.** `exercise.montuno.*.son-3-2` (two- and three-note chords on the clave), `exercise.latin-groove.*`.

**Near-misses.** The bare clave (`exercise.clave.son-3-2`: single notes); the running figures above; `exercise.montuno.*.bossa` (see the generator findings).

**Not covered.** A real guajeo that sounds on more than half the pulses, or in single notes, is not found. No real montuno is in the catalogue to calibrate one against.

**UNKNOWN.** No readable bar in 2/4, 4/4 or 2/2.

## texture.tumbao

**Definition.** Left-hand onsets exactly {3/8, 3/4} of a bar in 2/4, 4/4 or 2/2: the tresillo's two offbeats, the downbeat empty. Source: Wikipedia, "Tumbao": "only the two offbeats of tresillo are sounded … often the last note of the measure is held over the downbeat of the next measure"; the generator's `TUMBAO_OFFSETS = (1.5, 3.0)` quotes `latin.md` to the same effect. The hold-over is reported (`held_over`), not required ("often").

**Positives.** `exercise.tumbao.*`, `exercise.latin-groove.*` (left hand). Repertoire: Chancho en Piedra, *Mandinga*, bars 6-7 and on (D and G on the and-of-2 and 4, 45 of 48 bars held over).

**Near-misses.** The tresillo (`exercise.tresillo.c`: it keeps its downbeat); scattered bars (Lullaby of Birdland, three bars).

**UNKNOWN.** No left hand; no readable bar in 2/4, 4/4 or 2/2.

## texture.charleston

**Definition.** Chords on exactly beat 1 and the and-of-2 of a 4/4 or 2/2 bar (onsets {0, 3/8}), in either hand. Source: the jazz comping convention, "a dotted quarter note followed by an eighth note … the first chord enters on beat one and the second chord enters on the 'and of two'" (Piano and Voice with Brenda, "The Charleston Rhythm"; the same in the jazz-guitar comping lessons the search returned). The generator's `COMPING_PATTERNS["charleston"] = [0.0, 1.5]` agrees. Chords are required because the row is the comp rhythm; a melody in the same rhythm is not a comp.

**Positives.** `exercise.comping.*.charleston` (right-hand shells). Repertoire: Harry Styles, *Falling* (left-hand triads, 44 bars from bar 0); *I Got Rhythm* (right-hand chords, six bars).

**Near-misses.** The anticipated comp (`exercise.comping.c.anticipated`, 1 and the and-of-3); the bossa comp's first bar (1, and-of-2, 4: contains the Charleston and is not it).

**Not covered.** The displaced Charleston (the and-of-1 and beat 3).

**UNKNOWN.** No readable bar in 4/4 or 2/2.

## texture.bossa

**Definition.** The bossa nova comp: a hand whose onsets over a cycle are exactly the bossa clave (as `texture.clave`), as a pattern. The surdo bass (left-hand onsets exactly 1, the and-of-2, 3 and the and-of-4: "root on beat 1 and the 5th on beat 3 … the little eighth notes before beats 1 & 3", PianoGroove, "Bossa Nova Bass Lines") is counted beside it (`bass_bars`) and never decides presence alone. Validated on the catalogue: the first version (bass or comp) found eleven repertoire items on the bass alone, none of them a bossa (Mozart K. 545, Schumann's *Happy Farmer*, Bach's Toccata, *Joy to the World*, *Linus and Lucy*): the dotted-quarter-eighth bass is common.

**Positives.** `exercise.comping.*.bossa`, `exercise.clave.bossa*`, `exercise.montuno.*.bossa`; HONNE, *Location Unknown* (onsets, not the style).

**Near-misses.** The Charleston comp; the son clave (one stroke, one sixteenth apart); the bass rhythm alone (Mozart K. 545: `bass_bars` 2, absent).

**Not covered.** The yaml row names "bass cell plus comp cell". No generated bossa writes the bass cell (the comping family's left hand holds whole notes), so the comp alone is what the rule can validate; the bass count is kept for when one does.

**UNKNOWN.** No readable bar in 2/4, 4/4 or 2/2.

## texture.tango

**Definition.** The tango accompaniment figures in the left hand: the 3-3-2 (the tresillo's onsets), the habanera, and the marcato en 4 (every quarter of the bar: quarters in 4/4, eighths in a 2/4 tango) or en 2. Sources: Link and Wendland, *Tracing Tangueros* (Oxford, 2016), as reviewed in *Music Theory Online* 25.3 (marcato, síncopa, 3-3-2, arrastre; "the dotted duple habanera/milonga pattern"); the review gives no beat-level definitions, so the onsets above are the conventional ones and the síncopa and the arrastre are not measured.

**Why it never says present.** The figures do not decide a tango. Measured: Bizet's Habanera holds the habanera in 85 left-hand bars and Gardel's *Por Una Cabeza* in 56; Joplin's *Combination March* holds 52 marcato bars; the tresillo bass of *All of Me* is the 3-3-2. A first version (both a syncopated figure and the marcato) found Vivaldi's *Spring*, *Mr Blue Sky* and six Joplin pieces and missed *Por Una Cabeza* and *El Choclo*. So:
- a repeated figure: UNKNOWN, with that reason;
- no figure as a pattern: absent (exact, about the figures);
- the style residual needs a source beyond the notes (title, genre, an agent).

**UNKNOWN.** No left hand; no readable bar in 2/4, 4/4 or 2/2; a repeated figure (above).

## texture.mazurka

**Definition.** A 3/4 bar holding both features the definition names: the figure in the right hand ("either a triplet, trill, dotted eighth note (quaver) pair, or an ordinary eighth note pair before two quarter notes": onsets 0, one or more inside beat 1, then exactly beats 2 and 3, the beat-2 note a quarter long) and an accent mark on a note off beat 1 ("strong accents unsystematically placed on the second or third beat"), both quotations Wikipedia, "Mazurka". Present when such bars are a pattern.

**Validation** (every 3/4 item with a right hand, 2026-10-07):
- the figure alone does not separate: its share of 3/4 bars runs 0 to 0.75 across the 36 Chopin mazurkas and reaches 0.71 in a Mozart minuet (K. 2), 0.44 in *O Christmas Tree*;
- off-beat accents alone do not separate either: Chopin's polonaises and waltzes and Kreisler's *Liebesleid* accent beats 2 and 3 as often;
- both in one bar: 12 of the 36 mazurkas are found; three items that are not mazurkas are found too (Lecuona's *Malagueña*, seven bars; Chopin's Polonaise in G-sharp minor, four; Holst's *Jupiter*, two consecutive). The polonaise rhythm shares the figure and the accent; this rule cannot tell them apart.

So: present = the figure-with-accent bars are a pattern (the rhythm, not the dance). Of the 36 Chopin mazurkas: 12 present; 18 UNKNOWN because the figure is a pattern but never accented in its bars (so is the Polonaise Op. 53); 1 UNKNOWN for carrying no accent mark; 5 absent because the figure is no pattern (Op. 7 No. 5 and Op. 41 No. 4 hold no such bar; so does the Waltz Op. 69 No. 2).

**UNKNOWN.** No right hand; no readable 3/4 bar; no accent mark in the item; the figure without the accent.

## rhythm.shuffle

**Definition.** Long-short pairs on the beat in the triplet ratio, as notated. Source: Wikipedia, "Shuffle rhythm": "the first note in a pair may be twice (or more) the duration of the second note"; notated as triplets, as a dotted eighth-sixteenth, in 12/8 "instead of 4/4 with triplets", or with a direction (swing "is sometimes explicitly indicated"). A bar counts when one hand has:
- **triplet:** two beats or more with onsets exactly {0, 2/3} of the beat, no more beats divided evenly, and no beat entered at its second triplet (a quarter-note triplet puts 0 and 2/3 in alternate beats and is not a shuffle: Chopin's Sonata No. 2 first movement, found by the first version);
- **12/8:** two dotted-quarter beats or more with {0, 2/3} (quarter-eighth);
- **marked:** under a Words direction matching swing, swung or shuffle (until one matching straight or even eighths), any beat of even eighths.

**Dotted pairs** ({0, 3/4}) are the one notation shared with a literal dotted rhythm. When the same hand also writes four even-eighth beats or more, the score tells the two apart and the dotted pairs are literal (absent: Mozart's *Twinkle* variations). When the dotted pairs are the only long-short pairs: UNKNOWN (twelve items, among them Tchaikovsky's *March of the Wooden Soldiers*, Czerny's March in D minor, three Chopin mazurkas, the *Brabançonne*, *Stumbling* and *Location Unknown*).

**Positives.** `exercise.meter.12-8`, `exercise.rhythm.shuffle-*.4bar`, `exercise.swing-pair.*` (bars 5-8 only: "Straight" over the first four), Black Bottom Stomp (triplets), Lullaby of Birdland ("Med-Swing"), St. Louis Blues, *Ain't Misbehavin'*.

**Near-misses.** `exercise.rhythm.dotted-quarter-eighth.4bar` (a long-short over two beats, not on the beat); quarter-note triplets; literal dotted pairs.

**Read as notated.** *Mr Blue Sky* (PDMX) carries a "Swing" direction and is read as swung; whether the edition is right no one in this process can hear. A 12/8 Chopin nocturne (Op. 55 No. 2) is found: in 12/8 the quarter-eighth is the shuffle's ratio whatever the style.

**UNKNOWN.** No readable bar in a simple metre or 12/8 (6/8 and 9/8: the long-short is the metre's own figure); dotted pairs only.

## rhythm.secondary-rag

**Definition.** Edward A. Berlin's secondary rag (*Ragtime: A Musical and Cultural History*, 1980, as summarised in the sources the search returned): unsyncopated, "a repeating three-note melodic pattern superimposed on a duple meter"; the ragpiano.com glossary: "creates syncopation through association with the beat rather than metrically with varied note lengths"; the 12th Street Rag is the standard example. Operationally, in the right hand's top line: a run of beats each divided the same way into two or four onsets (even eighths or sixteenths, or a swung or dotted pair) whose pitches repeat with period three (p[i] = p[i+3]) and not period one, long enough to come back onto the beat (nine notes, twelve at four to the beat).

**Positives.** *12th Street Rag*, both editions (the PDMX lead sheet's even eighths, bars 4-5 E-flat D C; the other edition's dotted pairs); W. C. Handy, *The Memphis Blues* (bars 13-14, C D E in eighths over 4/4); *Black Bottom Stomp* bar 81 (A-flat B-flat F in swung triplet pairs).

**Near-misses.** `exercise.secondary-rag.c.4bar` (see the generator findings); triplet arpeggios (Moonlight Sonata, first movement: three to the beat, no cross); Bach's C major prelude (a three-note right-hand figure restarting every half bar).

**UNKNOWN.** No right hand; no readable bar in 2/4, 4/4, 2/2 or 4/2.

## texture.build

**Definition (operational).** Across a span of four bars or more, the notated dynamic rises (a crescendo hairpin or cresc. direction, ended by its own end or the next level mark; or a louder level marked after a softer one) and the note density rises with it: notes per bar, both hands, the median of the span's second half at least 1.25 times its first half's. Source: OpenLearn, *Discovering music through listening*, 1.3 (the "Rossini rocket"): a build combines a "gradual increase in volume or crescendo" with "gradually adding instruments to increase the forces playing", register, harmonic pace. Volume and forces are the two read here; register and harmonic pace are not. The four-bar floor and the median were set on the catalogue: with two-bar spans and means, 138 of 354 items were found, among them one-hairpin swells in Bach inventions and Chopin's Prelude Op. 28 No. 4, whose single two-note opening bar made a "rise" into 26 notes a bar.

**Positives.** Bennet, *Rosemary's Waltz* bars 0-7 (p to mp; medians 5.5 to 8 notes a bar); Beethoven's Moonlight Sonata, third movement, bars 151-163.

**Near-misses.** A crescendo over even density (Duvernoy, Op. 176 No. 11, bars 12-16, sixteen notes a bar throughout); Chopin's Prelude Op. 28 No. 4 (above); the generated crescendo (`exercise.shaping.*.crescendo`), written only as prose ("Grow evenly from the first note to the last"), which partitura does not read as a crescendo.

**Not one definition yet.** The dynamics are read here from partitura's loudness directions. `mark.dynamics` is another row; when it is built, this rule should read it rather than its own `_dynamics`.

**UNKNOWN.** No dynamics notated (the dynamic half cannot be read).

## Generated families the rules disagree with

| Family | Declares | Rule finds | At fault, and why |
| --- | --- | --- | --- |
| `exercise.blues.twelve-bar-shuffle.*` (6) | shuffle | absent | the generator: straight eighths with no swing or shuffle direction, no triplets, no 12/8. The shuffle is in the title and concepts only. Its own convention (`generate_exercises.py` near line 1857, the rhythm rows) prints the direction; this family does not. |
| `exercise.boogie.*` (36) | `shuffle` concept | absent | the generator, the same way: straight left-hand eighths, no direction. |
| `exercise.comping.*` swing patterns (48), `exercise.walking-bass.*` (28) | `swing` concept | absent | neither: their rhythms have no eighth pairs to swing (chord hits, quarter-note walking), so "swing" there names a style, not a long-short figure. |
| `exercise.montuno.*.bossa` (5) | montuno | absent (and found as `texture.bossa`, `texture.clave` bossa) | a naming question: chords on the bossa clave are a bossa comp; the montuno is aligned to the Cuban clave. If the curriculum means any clave-chord figure by "montuno", the rule's exclusion is the thing to change. |
| `exercise.secondary-rag.c.4bar` (1) | secondary rag | absent | the generator: its figure (a sixteenth and an eighth repeated over a rising scale) crosses the beat by note lengths; Berlin's secondary rag is unsyncopated, a repeating three-note melody in even values. It is a three-over-four rhythm, not the secondary rag. |
| `exercise.shaping.*.crescendo` (5) | crescendo | absent (as `texture.build`) | neither for the build (a crescendo over even density is not a build); the crescendo itself is written only as prose, so no reader finds it as a crescendo. |

Repertoire whose concepts claim `secondary-rag` and where the rule finds none: Joplin's *Elite Syncopations* and *Pine Apple Rag* (both editions). The right hand's top line holds no stretch of seven or more notes with period-three pitches in any rhythm (`build/period3.py`, not committed). Whether the claim is wrong, or the pattern sits in an inner voice, is unverified as music.

## Catalogue counts (2026-10-07)

`python tools/classifier/measure.py --only texture.` and `--only rhythm.`; 2,020 notated items, 4 fail to load (the same 4 for every id).

| Id | Measured | Present | UNKNOWN | Errors |
| --- | --- | --- | --- | --- |
| texture.clave | 1,701 | 41 | 315 (metre) | 0 |
| texture.montuno | 1,701 | 17 | 315 (metre) | 0 |
| texture.tumbao | 1,384 | 11 | 342 no left hand, 290 metre | 0 |
| texture.charleston | 1,503 | 19 | 513 (metre) | 0 |
| texture.bossa | 1,701 | 18 | 315 (metre) | 0 |
| texture.tango | 941 | 0 | 443 figures undecidable, 342 no left hand, 290 metre | 0 |
| texture.mazurka | 70 | 15 | 1,567 metre, 218 no right hand, 133 no accent marks, 28 figure without accent | 0 |
| rhythm.shuffle | 1,916 | 21 | 88 metre, 12 dotted only | 0 |
| rhythm.secondary-rag | 1,488 | 6 | 310 metre, 218 no right hand | 0 |
| texture.build | 354 | 97 | 1,662 no dynamics | 0 |
