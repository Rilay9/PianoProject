# Accompaniment textures and technique figures: the rules

Code: `tools/classifier/rules/texture.py` (the `texture.*` ids) and `tools/classifier/rules/technique.py` (the `technique.*` ids), registered with `score.measures`, reading notes only through `score.load`. Tests: `tools/classifier/tests/test_rules_texture.py`. Each id's meaning is its row in `docs/classifier/characteristics.yaml` (`dec`, `lacks`); this file defends how the code decides it.

## What every rule shares

**The view.** Per hand (score.py's hand rule), the onset events: the notes struck together, grace notes left out, each with its bar and its position from the notated start of the bar (a pickup is right-aligned). Per bar, its time signature. A rule never reads another rule's answer except where named (stride reads the oom-pah pairs; broken-chord includes the Alberti bars).

**The answer.** `{"present", "bars", "share", "hands"}` and the rule's own counts, with `where` the 0-based bar indices, so a placement can read density (`share`) and spread (`where`). Provenance is `exact`: the rule is a deterministic reading of the notation. Whether the rule *is* the musical characteristic is what each section below defends; that part is an operational definition, validated on the catalogue, not a certainty.

**Bar numbers.** In prose below, bars are numbered from 1 as printed; `where` is 0-based (bar 1 is `where` 0).

**Persistence.** A texture is a pattern sustained beyond one bar, so a texture is `present` only with at least two qualifying bars (ostinato: four; stop-time: three hits), and `bars` reports the qualifying bars whether or not that threshold is met. A gesture (tremolo in thirds, crushed note) and the technique figures are present from one occurrence.

**UNKNOWN, for every rule:**
- `no notes`, `no measures`, `only grace notes`: nothing to read.
- `one staff holds both hands: the hands cannot be separated`: a single-staff, single-part file whose catalogue entry says both hands (3 items). Every rule here works per hand, so none can answer.
- `N bar(s): too short to show ...`: the item is shorter than the rule's window (two bars; ostinato and stop-time four). Absence there means the item cannot show the texture, not that it lacks it.

What no rule here reads: tempo (a "tremolo" or a "run" is judged in notated values only), dynamics and articulation, swing feel, the pedal. Style is never decided here: Alberti in a jazz tune is Alberti, a crushed note in Mozart is a crushed note.

## Chord membership (shared)

A set of pitch classes "fits a chord" when it is contained in one triad (major, minor, diminished, augmented) or one seventh chord (dominant, major, minor, half-diminished, diminished, minor-major), in any transposition. Templates are written out in `texture.py` (`fits_chord`); music21's `chord.Chord` would answer the same question per chord, but here the question is whether a *succession* of single notes outlines one chord, and the template set is twelve lines (FABLE §7: keep small custom code, with the reason).

---

## texture.alberti

**Definition.** "A broken chord or arpeggiated accompaniment, where the notes of the chord are presented in the order lowest, highest, middle, highest" (Baker's Student Encyclopedia of Music, ed. Kuhn, 1999, as cited by Wikipedia, "Alberti bass").

**Operational.** Four consecutive single notes in one hand, at one even spacing of a quarter or less, with pitches a, b, c, b: a < c < b, the highest note repeated, all within an octave, the three pitch classes one triad or seventh chord (three of its tones: Mozart's V7 bars give D-G-F-G, the root, fifth and seventh). A bar is an Alberti bar when at least three quarters of that hand's notes in it, and at least four, lie in such groups (the figure fills the bar; Hanon No. 5 has one Alberti-shaped group, C-A-G-A, in a bar of eight and is not an Alberti bass).

**What draws the distinction.** A generic broken chord (low-middle-high-middle, C-E-G-E) fails the order; a two-note alternation (C-G-C-G) has two pitches; a rising arpeggio never returns to its top note.

**Positives.** `exercise.accompaniment.alberti.*` (10 of 10), `exercise.rotation.*` (6 of 6); Mozart K. 545 i, bars 1-4; Chopin's Polonaise in G minor, bars 27-28 (D-B flat-F-B flat); the Alberti variation of `song.folk.3-variations-on-happy-birthday.pdmx` (F-C-A-C).
**Near-misses.** `exercise.accompaniment.broken.*` (C-E-G-E: the wrong order); Hanon No. 5 (one Alberti-shaped group in a bar of running notes; red first); Pachelbel's Canon (broken chords that never return to the top).
**UNKNOWN.** Shared reasons only; a one-bar item is too short.

## texture.broken-chord

**Definition.** A chord whose notes are sounded one after another instead of together (the general term; Alberti bass and the arpeggio are named kinds of it, per the Alberti definition above and Wikipedia, "Arpeggio"). Operational: a hand plays only single notes through a bar (or through each half of a bar of an even number of beats, so one harmony per half bar), at one even spacing running to the end of the bar or half (a figure may enter after a short rest, as the right hand of Bach's C major prelude does over the left hand's held notes), the notes forming at least three pitch classes of one triad or seventh chord, with no step of one or two semitones between neighbours (a step is a melody's motion; a broken chord moves by chord tones), and either returning to a pitch it has left (C-E-G-E) or running at two or more notes a beat. The last clause is the line against a walking bass: one note a beat through four different chord tones (A2-C#3-E3-G#2) moves on and is a walk, the distinction `app/src/demands/detect.ts` `walkingBass` draws from the other side ("a broken chord in quarters ... circles back to its fifth and is a pattern, not a walk").

**Value.** Alberti bars are broken-chord bars (Alberti is a kind of broken chord), so `bars` includes them; `not_alberti_bars` counts the bars with a broken chord that is not Alberti, which is the generic figure a placement for "broken chords" usually wants.

**Positives.** `exercise.accompaniment.broken.*` (C-E-G-E), `exercise.broken7.*` (the seventh-to-root step allowed; red first), `exercise.intro.*`; Bach's C major prelude (right hand, entering after the rest); Pachelbel's Canon (two chords a bar, eighths); Joplin's Cascades bars 11-13 (diminished seventh in sixteenths); Schubert's Ecossaise bars 10 and 12.
**Overlap, by definition.** The walking-eighths boogie (C-E-G-B flat-C-B flat-G-E) is a broken C7, so 12 boogie exercises are broken-chord items too; `exercise.arpeggio*` items that turn back within a half bar are as well.
**Near-misses.** `exercise.walking-bass.*` (A2-C#3-E3-G#2 in quarters moves on; red first: 4 of 28 items keep a bar or two where the walk does circle back, E-G#-B-G#, which is a broken chord by this definition); the generated waltz (bass and block chords).
**UNKNOWN.** Shared reasons only.

## texture.arpeggio

**Definition.** "A type of broken chord in which the notes that compose a chord are individually sounded in a progressive rising or descending order" (Wikipedia, "Arpeggio"). The characteristic row asks for an arpeggiated *texture* over more than an octave.

**Operational.** A run of single notes in one direction, each step to a next chord tone (3 to 9 semitones, covering close and open spacing; 1 or 2 only where the run's tones make a seventh chord, the seventh to the root), every pitch class in one triad or seventh chord, at least three of them, at least four notes, no gap between onsets over a quarter. A run's turning note may start the next run. A bar is arpeggiated when at least half the hand's notes there, and at least four, lie in runs spanning more than an octave (over 12 semitones).

**Positives.** `exercise.arpeggio.*` (60 of 60); Chopin Nocturne Op. 9 No. 1 (left hand); Beethoven Pathétique ii bar 8 (E flat-A flat-C-E flat-A flat); Chopin Scherzo No. 2 bars 335ff.
**Near-misses.** The generated broken chord and Alberti (inside an octave); a single flourish in a bar of other material (under half the bar's notes).
**UNKNOWN.** Shared reasons only.

## texture.waltz-bass

**Definition.** The waltz accompaniment: a bass note on the first beat and a chord on each of the second and third (the bass-chord-chord pattern the row names; it is the "oom-pah-pah" of the oom-pah definition below in triple time).

**Operational.** A bar in 3/4, 3/8 or 3/2 (not a pickup) in which one hand plays exactly three events, one on each beat; beats two and three are chords (two notes or more, two pitch classes or more), and beat one is a bass below both chords by at least a minor third: a single note, or a fifth, seventh, octave or tenth.

**Positives.** `exercise.accompaniment.waltz.*` (10 of 10); Joplin's waltzes (Harmony Club, Binks', Augustan Club, Bethena); `song.folk.greensleeves.waltz`; `oh-my-darling-clementine.pdmx`; Piano Man; Chopin's waltzes and the bass-chord bars of his mazurkas (Op. 30 No. 4: the figure is read, the dance is not).
**Near-misses.** Duple oom-pah (wrong metre); a minuet's single-note left hand (Bach, Anh. 113); a bar with a held bass and nothing on beats two and three.
**UNKNOWN.** Shared reasons only. A pickup bar is never read.

## texture.oom-pah

**Definition.** "Multiple instruments alternating between a bass sound and off-beats in higher registers" (Wikipedia, "Oom-pah", citing the Oxford Pocket Dictionary of Current English): on the piano, a bass on the strong beats and a chord on the off-beats, in duple time.

**Operational.** A bar in two or four beats (2/4, 4/4, 2/2, 4/2, 6/8, 12/8; not a pickup) in which one hand's events fill the bar at one even spacing and alternate bass, chord, bass, chord, starting with a bass on the downbeat. The chord: two notes or more, two pitch classes or more. The bass: one note, or a fifth, seventh, octave or tenth, its lowest note at least a minor third below the chord's lowest note. `leap_bars` counts the oom-pah bars that also leap (the stride condition below).

**Positives.** `exercise.oompah.*` (8 of 8); `exercise.secondary-rag.c.4bar`; Joplin's rags and marches (42 ragtime items); Kerry Mills' At a Georgia Camp Meeting; Chopin's écossaises.
**Near-misses.** The generated waltz (triple); two dyads in a row (Moonlight iii bar 47: A flat 3-B3 is not a bass; red first); `exercise.stride.*` (beat three is the chord's own lowest note, so the alternation breaks: see the generator findings).
**Known over-reach.** A single bass-chord pair in an orchestral reduction's 2/4 bar counts (Beethoven 5 i, four bars of 500): present is two bars anywhere, so a placement should read `share`.
**UNKNOWN.** Shared reasons only.

## texture.stride

**Definition.** "The left hand characteristically plays a four-beat pulse with a single bass note (or an octave, major seventh, minor seventh or major tenth interval) on the first and third beats, and a chord on the second and fourth beats"; and "compared to the ragtime style popularized by Scott Joplin, stride players' left hands travel greater distances on the keyboard" (Wikipedia, "Stride (music)"). The pattern is the oom-pah's; what makes it stride is the travel.

**Operational.** An oom-pah bar (above) in which at least one bass-chord pair spans more than an octave from the bass's lowest note to the chord's highest: a hand covers an octave without moving, so beyond it the hand must leap between bass and chord. Stride is therefore a subset of oom-pah: every stride bar is an oom-pah bar, and an oom-pah inside the octave (C3, then E3-G3) is not stride. The threshold is a stated reason (the hand's reach), not a quoted number; it is validated below on the rags and the generated oom-pah family.

**Not read here.** Whether the music is jazz-era stride or ragtime: the curriculum tags the Joplin rags `stride`, and the row's `dec` is "stride left hand", the physical figure.

**Positives.** `exercise.oompah.*.tenth` (every bar); `exercise.oompah.*.octave` (the four bars whose bass is the root: C2 to C3-E3-G3 spans a twelfth; the fifth-bass bars, G2 to C3-E3-G3, span an octave and do not leap); Maple Leaf Rag; Joplin's Leola; Chopin's Étude Op. 25 No. 4 (the leaping left hand).
**Near-misses.** An oom-pah inside an octave (C3, then E3-G3); every stride bar is an oom-pah bar (tested).
**Generator finding.** `exercise.stride.*` (4 items) is found by neither rule: see the report.
**UNKNOWN.** Shared reasons only.

## texture.boogie-bass

**Definition.** "Boogie-woogie is characterized by a regular left-hand bass figure, which is transposed following the chord changes"; much of it is "eight to the bar", eighth notes in common time, over the twelve-bar blues (Wikipedia, "Boogie-woogie"). The row asks for the distinction from any repeated eighth figure.

**Operational.** A boogie bar: the bar has four beats and the bass hand plays exactly two onsets on every beat (on the beat, and halfway, two-thirds or three-quarters through it: straight, triplet or dotted swing), single notes or dyads, and it is the lowest line (no other hand sounds below it in the bar). The figure starts on its root, the lowest note of the bar (one chord a bar: Beethoven's Ode in eighths, G-B-D-B then C-E-G-E, starts above the bar's C). Relative to that root, every tone is one a boogie figure uses (root, minor or major third, fifth, sixth, flat seventh; the fourth and sharp fourth only together, as a walk to the fifth; the sharp fifth only with the sixth, as Pinetop's 5-#5-6 shuffle; a second, flat second or major seventh means a second harmony in the bar or another style, and a fourth without the walk is IV over the root, as in Duvernoy's G-B-D-B G-C-E-C), and the figure carries the boogie colour: the sixth or the flat seventh in the figure itself, or (a bare root-fifth figure) a flat seventh above the root in the other hand. Not an Alberti bar. Then the figure must behave as the definition says: the same figure transposed by a fourth or fifth somewhere in the item, or repeated in four bars or more, or (carrying the sixth) in two bars or more; and a counted bar has a boogie bar beside it (the figure keeps going).

**What draws the distinction.** Pachelbel's Canon (two broken chords a bar in eighths) fails the tone set; an Alberti bass in eighths is refused by name; an isolated root-sixth bar in Beethoven fails the continuity; a walking bass in quarters fails the pulse.

**Positives.** `exercise.boogie.*` (36 of 36: pinetop, walking eighths, root-fifth under the right hand's dominant seventh, major and minor blues); `exercise.blues.twelve-bar-shuffle.*` (6 of 6, the 5-6 shuffle); Pinetop's Boogie Woogie (`song.folk.boogie-woogie.pdmx`, including the 5-#5-6 bars); `song.pop.boogie-easy-for-beginners.pdmx`.
**Near-misses (red first unless marked).** Pachelbel's Canon; Beethoven's Ode in eighths (two chords a bar); Duvernoy Op. 176 No. 3 (I and IV6/4 broken over G); Moonlight iii (isolated root-sixth bars); the generated Alberti (not red: refused by name); `exercise.ostinato.*.fifths` (right hand over a lower held bass).
**UNKNOWN.** Shared reasons only.

## texture.ostinato

**Definition.** "A motif or phrase that persistently repeats in the same musical voice, frequently in the same pitch" (Wikipedia, "Ostinato"); a riff is "a brief, relaxed phrase repeated over changing melodies" and a vamp "a repeating musical figure" (same article). The row: a figure repeated unchanged N bars.

**Operational.** In one hand, a one-bar unit (positions and pitches of its events) repeated unchanged in at least four consecutive bars, or a two-bar unit repeated at least three times (six bars). N = 4 one-bar repetitions: a phrase's length, the shortest span over which repetition is persistence; a two-bar unit needs a third statement because a two-bar phrase sung twice is a repeated phrase, not an ostinato (Silent Night's opening, We Three Kings). The unit must be a figure: three onsets or more, or two onsets with two pitches or more (a held chord repeated each bar is a held harmony, not a figure).

**Overlap, by definition.** A boogie bass on one chord for four bars is an ostinato bass, and the rule says so.

**Positives.** `exercise.ostinato.*` (6 of 6), `exercise.riff.*` (4 of 4), the generated boogies on one chord; Carol of the Bells; Chopin's Mazurka Op. 6 No. 2 (the drone fifths of bars 1-4); Albéniz's Asturias.
**Near-misses.** Silent Night and We Three Kings (a two-bar phrase sung twice; red first); an accompaniment pattern that follows the harmony (the generated Alberti).
**UNKNOWN.** Items of two or three bars (524 on the catalogue, nearly all exercises): four bars are needed to show four repetitions.

## texture.pedal-point

**Definition.** "A sustained tone, typically in the bass, during which at least one foreign (i.e. dissonant) harmony is sounded in the other parts" (Wikipedia, "Pedal point").

**Operational.** Harmony windows of half a bar (a bar of an odd number of beats: the whole bar). In each, the harmony is the pitches struck twice or more in it or sounding for at least a third of it (a broken chord's repeated tones and held notes count; a run's passing notes, each struck once for a quarter of the window, do not), and the bass is its lowest pitch class. A span of windows with the same bass pitch class (held or repeated) covering at least two whole bars is a pedal point when, in at least one window of it, the other pitch classes contain a whole triad on which no chord contains the bass (C under G-B-D, or under F#-A-C, is a pedal; C under E-G-B flat is C7, not a pedal; C under F-A is IV6/4, not a pedal; G under B-D-F with a passing C is G7). `where` holds the whole bars of the span. Bach's C major prelude: bars 24-30 (0-based 23-29), the dominant pedal, exactly.

**Not read.** A pedal under a harmony that makes a seventh chord with it (D-F-A over C is Dm7/C) is not counted: the definition's "foreign (dissonant) harmony" is read as a triad the bass does not belong to, which is narrower than a listener's dissonance.

**Near-miss by name.** The generated `exercise.pedal.*` family is about the sustain pedal, not pedal point; and the `exercise.ostinato.*` family's "pedal bass" holds the tonic under its own triad, a drone with no foreign harmony, so by this definition it is not a pedal point (`texture.held-under-moving`, a separate row, is the figure it does exercise).

**Positives.** Bach's C major prelude, bars 24-30; Chopin's Étude Op. 10 No. 7.
**Near-misses (red first).** `exercise.boogie.c.root-fifth` (C under E-G-B flat is C7); Lemoine Op. 37 No. 12 bars 7-8 (a sixteenth scale over a held G chord); `exercise.study.position-shift.c-major.4-4.16bar.blocked.03` (a passing C over G7). Not red: `exercise.ostinato.*` (a drone under its own triad) and `exercise.pedal.*` (the sustain pedal).
**UNKNOWN.** Shared reasons only.

## texture.four-to-the-bar

**Definition.** Comping with a chord on every beat of a four-beat bar (the row's `dec`; the jazz term "four to the bar" for an even four-beat comp).

**Operational.** A four-beat bar in which one hand plays exactly four events, one on each beat, every one a chord (two pitch classes or more), the chords' lowest notes within a fifth of each other (one register: a stride bass, or a tango's bass fifth G2-D3 under G3-B flat-D4 chords, is excluded), and at most two different chords in the bar (a comp repeats its harmony; four different chords on four beats is a hymn's melody in chords, the next row).

**Positives.** `exercise.comping.*.four-on-the-floor` (12 of 12; the other comping patterns, off-beats, Charleston, anticipated, bossa, are correctly absent); Chopin's Funeral March (the left hand's chord on every beat); Bertini Op. 29 No. 3 bars 9-10 (tonic and dominant, alternating).
**Near-misses.** The off-beat comp; oom-pah; the tango's bass fifth under two chords (Borgmann's Tango notturno bar 23; red first); four different chords on four beats (a hymn's melody in chords, the next row).
**UNKNOWN.** Shared reasons only.

## texture.melody-in-chords

**Definition.** The melody carried as the top voice of chords in one hand (the row's `dec` and `lacks`: the top note of each chord forms the melody line).

**Operational.** In one hand, four consecutive events whose top notes are the highest sounding notes at their onsets (no other hand above them), of which at least three are chords (two pitch classes or more) and at least two have three notes or more (two-note events alone are double notes, `texture.double-notes`, or two voices in one hand, `texture.two-voice`), whose top note changes at least twice, and which span no more than a bar and a half (a chord a bar or slower is a held harmony under nothing, not a melody).

**Positives.** George Shearing's Lullaby of Birdland (block chords, right hand); Fly Me to the Moon; Amazing Grace (piano arrangement).
**Near-misses.** Chords held a bar or more (the stride exercise's right hand; red first); a repeated comp chord (the top note does not move); a single line.
**Known residue, not decided by code.** A voice-led chord succession (an inversion drill, a ii-V-I comp, the left hand's chords while the right hand rests in Chopin's Fourth Ballade, a pad's top line in Coldplay's Fix You) passes the same test as a tune in chords: whether the top line is *the melody* is a judgement the notes do not settle. On the catalogue 84 of the 372 positives are exercises of that kind (`exercise.inversions`, `.comping`, `.turnaround`, `.passing-chord`, `.slash-bass`, ...). This row's value is evidence for an agent, not a decision.
**UNKNOWN.** Shared reasons only.

## texture.tremolo-thirds

**Definition.** A measured tremolo: two notes a third apart alternated rapidly (the row: "alternating notes a third apart, or a tremolo mark").

**Operational.** In one hand, at least six consecutive single notes alternating between two pitches written a third apart (three or four semitones on letters two apart: an augmented second, B flat to C sharp, is not a third), each onset an eighth or less after the last (a bar counts where four or more of the run's notes lie, not where one spills over); or a note carrying a MusicXML tremolo mark (partitura's `ornaments`) whose partner in the same hand (struck with it, or the next marked note) is a third away (`marked` counts these). Present from one occurrence.

**Not read.** Tempo: eighths at a slow tempo pass. The blues style the row's `dec` names is not decided; Mozart's K. 545 left hand in sixteenth-note thirds is the figure.

**Positives.** `exercise.tremolo-third.*` (6 of 6); Mozart K. 545 i bars 14 and 16 (left hand B-D in sixteenths); Vivaldi's Summer (transcription) bars 74-77; the Handel-Halvorsen Passacaglia bar 48 (A-F); Moonlight iii (A sharp-C sharp, written as a third).
**Near-misses.** `exercise.tremolo.*` (octaves); `exercise.trill.*` (a second); K. 545 bar 13 (C sharp-D; the bar was marked by the next bar's run spilling into it until the four-notes-a-bar clause; red first).
**Not on the catalogue.** No item carries a tremolo mark on a third (`marked` is 0 everywhere); the mark path is untested on real data.
**UNKNOWN.** Shared reasons only.

## texture.crushed-note

**Definition.** The acciaccatura ("to crush"), in its 18th-century keyboard sense: an ornament "a tone or semitone below the chord tone, struck simultaneously with it and then immediately released" (Wikipedia, "Acciaccatura"). The row narrows it to the blues crushed note: a grace a semitone below a chord tone.

**Operational.** A grace note (zero duration in partitura's note array) a semitone below a note struck at the same onset in the same hand, where that hand strikes a chord there (two notes or more), and not one of several graces sliding into the note (no other grace in the group within a whole tone below it). Present from one occurrence; `count` counts them.

**Not read.** A crush written out in real values (a thirty-second before the chord) or as a struck minor second: neither is a grace, and neither is recognised.

**Positives.** Chopin's Mazurka Op. 68 No. 2 bar 34 (C and E flat crushed into C sharp-E); `song.pop.camille-le-festin-piano-arr-kno.pdmx` bar 46; Joplin's Country Club; the Joy to the World arrangement; Guaraldi's Skating.
**Near-misses.** Graces sliding into a note (C-D-E flat-E into F in Pinetop's Boogie Woogie); a grace onto a single melody note (the same piece's C into C sharp, bar 10): an acciaccatura, not a crush into a chord by this definition.
**UNKNOWN.** Shared reasons only; there is no short-item UNKNOWN (one grace is evidence).

## texture.stop-time

**Definition.** "An accompaniment pattern interrupting, or stopping, the normal time and featuring regular accented attacks on the first beat of each or every other measure, alternating with silence or instrumental solos" (Harvard Dictionary of Music, 2003, p. 841, as cited by Wikipedia, "Stop-time").

**Operational.** The accompaniment is the hand that sits lower (median pitch). A stop bar: that hand strikes once, on the downbeat, a hit no longer than a beat, then is silent to the end of the bar while the other hand plays after the hit. Stop bars count in chains of at least three hits (the attacks are "regular") on each bar or every other bar, where the bar between two hits a bar apart is silent in that hand (a figure bar between them is the normal time: the Classical left hand alternating an Alberti bar and a cadence note, Beethoven's Sonatina in F, Anh. 5 No. 2, bars 1-7, is not stop-time), and only when the same hand keeps time elsewhere: in at least half of its other bars it plays two onsets or more, or sounds through half the bar (the "normal time" the definition says is interrupted). A one-hand item has no accompaniment to stop: absent.

**Positives.** Rhythm and Boogie bars 9-18 and 29-30 (the left hand's G on one, the right hand's break); Mozart's Contredanse K. 15l; Czerny Op. 299 No. 4 bars 16-19; Beethoven's Sonatina in F, Anh. 5 No. 2, bars 47-50 (both hands strike, the right hand runs on); Beethoven 5 i (the orchestra's hits under the reduction's right hand).
**Near-misses (red first).** The same sonatina's bars 2, 4, 6, 8 (one note between Alberti bars: the normal time); Bach's Minuet Anh. 113 bars 29-30 (two cadence notes); a one-hand item.
**UNKNOWN.** Items under four bars (524).

---

## technique.scale-run

**Definition.** A scale passage: notes moving by step in one direction. The row asks for N.

**Operational.** At least six consecutive events in one hand, each a step from the last in the same direction: a second written as a second (one to three semitones, letters one apart: the harmonic minor's augmented second counts), or a chromatic semitone on one letter. Single notes (kind `diatonic`, or `chromatic` when every step is a semitone), or two-note events a third or a sixth apart with both voices stepping together (kind `thirds`, `sixths`). **N = 6, with its reason:** five notes in one direction fit one five-finger position; the sixth needs a crossing or a shift, which is what a scale passage trains (`technique.thumb-under` reads this row). No tempo or rhythm condition. Present from one run; `runs`, `longest` (notes) and `kinds` are reported.

**Positives.** `exercise.scale.*` (252 of 252), `.chromatic` (16), `.double-third` and `.double-sixth` (4 each), `.octave-scale` (15; red first: octaves were not read), `.blues-scale` (16) and `.pentatonic` (6) (red first: their minor-third steps broke the run); Petzold's Minuet in G minor; Chopin's Nocturne Op. 37 No. 1.
**Near-misses.** A five-finger pattern (five notes); the position-shift exercises; a diminished-seventh arpeggio (thirds in a row).
**UNKNOWN.** Shared reasons only.

## technique.arpeggio-run

**Definition.** As `texture.arpeggio`, a passage: an arpeggio run spanning two octaves or more (the row).

**Operational.** The same runs as `texture.arpeggio` (one direction, chord tones, at least four notes), counted when the run spans 24 semitones or more. Present from one run; `runs` and `widest` (semitones).

**Positives.** `exercise.arpeggio.*` and `.arpeggio7.*` (120 of 120); Chopin's Étude Op. 25 No. 1 (52 semitones); Chopin's Rondo Op. 1 bars 243ff.
**Near-misses.** Alberti and the generated broken chord (inside an octave); an arpeggio of one octave and a half counts for `texture.arpeggio` and not here.
**UNKNOWN.** Shared reasons only.

## technique.finger-independence

**Definition.** The row's `dec`: a held note plus moving notes in one hand (one finger holds while the others play: the held-note exercise of the technique books, and two voices in one hand).

**Operational.** A note in one hand that is still sounding (by its written duration) while the same hand starts at least two other notes, of at least two different pitches, none of them the held pitch, each after the held note starts and before it ends. Present from one occurrence; `held` counts them; `where` holds the bars of the moving notes.

**The curriculum uses the name differently.** The catalogue tags `finger-independence` on Hanon, repeated-note and double-note exercises (evenness of the fingers, one note at a time). Those have no held note and the rule says absent; the row's `dec` governs here, and the mismatch is reported, not resolved.

**Positives.** Joplin's Nonpareil bar 5 (A4 held under F5-E flat 5-D5-C5); Bertini Op. 29 No. 4 bar 2 (B flat 4 held over D4-F4); Merry Christmas Mr Lawrence.
**Near-misses.** `exercise.hanon.*` and `exercise.repeated-notes.*` (one note at a time, though the catalogue tags them `finger-independence`: see the report); `exercise.pedal.held-melody.*` (held in one hand, moving in the other).
**UNKNOWN.** Shared reasons only.

## technique.five-finger

**Definition.** A five-finger position spans a fifth: seven semitones from thumb to fifth finger (`app/src/demands/detect.ts` `POSITION_SPAN`; this rule is the negation of its `beyondPosition`, one definition per fact).

**Operational.** `present`: every hand's notes, over the whole item, span seven semitones or less (the item never leaves one position). `bars`: the bars in which every hand that plays fits one position, so a placement can read how much of an item that does leave the position stays in one bar by bar. `span`: each hand's whole range in semitones.

**Positives.** `exercise.five-finger.*` (48 of 48); `exercise.riff.*` (A4-E5); Gurlitt's sonatina; When the Saints (alternating hands arrangement).
**Near-misses.** `exercise.position-shift.*`; every scale.
**UNKNOWN.** Shared reasons only.

## technique.position-shift

**Definition.** Lateral travel between hand positions: a shift is needed when the next notes cannot be reached from the current five-finger position.

**Operational.** Per hand, the fewest five-finger positions (each spanning seven semitones or less) that cover its events in order; each change of position is a shift. Greedy segmentation gives the fewest (a part of a reachable run is reachable), so the count is not a fingering guess but a lower bound on the hand's moves. An event wider than a position (an octave, a wide chord) is a position of its own, and the same shape again stays in it. A return to the position before, when the two together fit an octave, is one stretched frame, not two shifts (a broken octave or a tremolo: the hand alternates, it does not travel); an octave is the widest frame a hand holds without moving, the same reach the stride rule uses. `shifts` per hand, `largest` (semitones between the centres of consecutive positions), `where` the bars where a new position starts. Present from one shift.

**Not read.** Fingering: a shift here is a change of position by the span rule, not the finger substitution or extension a player might use instead.

**Positives.** `exercise.position-shift.*` (10 of 10; one shift each: C-G position then G-D); Mozart's Andante K. 15o; the arpeggio exercises.
**Near-misses.** `exercise.five-finger.*` (no shift); an octave tremolo (one stretched frame, not a shift per note; red first).
**Known over-reach.** 1,542 of 2,013 measured items shift at least once: the row is useful as a count and a place (`shifts`, `where`), not as present/absent.
**UNKNOWN.** Shared reasons only.
