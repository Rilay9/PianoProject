# Draft abilities: the style tracks (Phase 1a, 2026-10-08)

**What this is.** The abilities that published sources teach or grade for the styles the app's tracks cover beyond classical graded repertoire: jazz, blues and boogie-woogie, popular and chord-symbol playing, Latin, ragtime and stride, rock, hymns and gospel, playing by ear, improvisation and composition, playing with others. Written from origin `aa4f602a` for FABLE.md §2, phase 1a. A draft for the independent checks in FABLE.md §3; nothing here is settled.

**What an ability is here.** Something a learner does, at the grain the sources teach or grade it, worded so an observer can tell whether a learner can do it. Properties of pieces are phase 1b's.

**How the sources were read (the validation for every row).**
- PDFs (ABRSM, Trinity, RSL, LCM, RCM syllabi; Levine's and Mauleón's tables of contents; Joplin's *School of Ragtime*; the Church of Jesus Christ *Keyboard Course*; the Link and Wendland article) were downloaded through the fetch tool and converted with `pdftotext`; every quote from them was read in the converted text. **Measured:** the quotes are verbatim from the converted text (table cells reassembled where the layout split them, marked "(table)").
- HTML pages (Hal Leonard, Schott, Sher Music, Berklee, PianoGroove, BYU, pianodao) were read through the fetch tool, which returns a model's summary of the page. **Their quotes are as the tool returned them and are unverified as verbatim**; each row resting only on such a page says so in its last-but-one column.
- Levels are each source's own: ABRSM, Trinity, RSL and LCM grades (Initial, Debut, Step, Grade 1-8), RCM levels, Berklee course weeks, a method book's chapter. Where a source names no level, the cell says so. No levels were converted between sources.
- The completeness audit (`docs/classifier/audits/iter1/completeness.md`) already read ABRSM's classical syllabus, RCM 2022 and Trinity's classical piano syllabus (improvisation stimuli, composition). Its rows are reused, not re-read, except RCM's lead-sheet and answer-phrase options, re-read here because they are style abilities; one correction to the audit follows from that (see §5).

**Existing ability ids** are the 28 in `docs/prompts/runs/curriculum-review-2026-10-05/ABILITY-MAP.md`. "partial" means the row covers part of the existing block's capability line; §4 lists which existing abilities the sources read do not support.

## 1. Abilities

Source keys resolve to URLs in §3. Quotes are under 15 words.

### 1.1 Jazz: feel, heads, solos, programme

| draft id | ability (what the learner does) | track(s) | level range | source (URL + quote) | where sources differ | existing id |
| --- | --- | --- | --- | --- | --- | --- |
| ST-001 | Play a tune, scale or arpeggio in the feel asked for: swung quavers or straight eighths, switching on request. | jazz, blues-boogie, technique | ABRSM Jazz G1-5; LCM Jazz G1-8 (swung pentatonic from G1); RSL Popular Piano G3-8 | [ABRSM-JP] "From memory, straight 8s or swing, as directed by the examiner"; [ABRSM-JP] each tune gives "an indication of the feel (straight 8s or swing)"; [LCM-R] "C major pentatonic - one octave, hands separately, swung" (G1) | ABRSM asks every scale in either feel at the examiner's choice; LCM fixes the feel per item (majors straight, pentatonic and blues swung); RSL Popular lets the candidate choose "either a straight or swung feel" (G3+) | none |
| ST-002 | Play the notated head (melody) of a jazz tune in its stated feel and tempo. | jazz | ABRSM Jazz G1-8; LCM Jazz G1-8 | [ABRSM-JPG] "HEAD: Play the `melody', which is generally notated in its simplest form." | ABRSM G1-5 heads are fully notated arrangements; G6-8 Lists A and B are generic lead sheets | partial A10.1 |
| ST-003 | Embellish a jazz head: alter rhythm and pitches, add fills, in the tune's style, without simplifying it. | jazz | ABRSM Jazz G1-8 ("encouraged at all grades"); LCM Jazz G3-5 | [ABRSM-JPG] "The melody should be embellished in a way that suits"; [ABRSM-JPG] "embellishment is encouraged at all grades"; [LCM-R] "an increasing amount of embellishment and fills" (G3-4) | LCM makes embellishment a G3-4 expectation and says G1-2 priorities are "accuracy and a feel for the styles"; ABRSM encourages it from G1 | partial A10.1 |
| ST-004 | Improvise a solo over a tune's written solo section (its chord sequence), keep the form, and return to the head. | jazz, blues-boogie, improv-compose | ABRSM Jazz G1-8; LCM Jazz G6-8 (head and two choruses); Trinity Rock & Pop solos G4-8 | [ABRSM-JP] "at least one section for improvisation (solo)"; [ABRSM-JPG] "RETURN OF HEAD: After playing the solo, continue with the remaining part"; [LCM-R] "the head and two improvised choruses" | ABRSM G1-5 solos are unaccompanied and the length is set by the book's repeats; ABRSM G6-8 sets bar counts per tune with a backing track; LCM G6-8 asks two choruses, backing optional | A7b.2, A10.1 |
| ST-005 | Solo over changes with jazz vocabulary: chord tones first, then approach notes, then scales. | jazz, improv-compose | Berklee Online Jazz Piano week 10; ABRSM Jazz G6-8 | [BK-JAZZ] week 10 "Playing Over the Changes–Using Approach Notes to Expand the Jazz Language"; [BK-JAZZ] outcome "Improvise jazz piano solos using chord tones, approach notes, and scales" (fetch-tool text); [ABRSM-JPG] "an improvised solo should be played using suitable jazz vocabulary" | ABRSM names "jazz vocabulary" without an order; Berklee orders chord tones, approach notes, scales | A7b.2 |
| ST-006 | Improvise with chord-scale relationships: choose a mode or scale for each chord and use it melodically (horizontal and vertical approaches). | jazz, improv-compose | Levine chs 9-11; Richards *Exploring Jazz Piano 1* (Grade 4 standard and above) | [LEV] "Chapter Nine: Scale Theory"; [LEV] "Chapter Ten: Putting Scales To Work"; [REJ] "Horizontal and vertical improvisation" (fetch-tool text); [ABRSM-JP] "scales have been integrated with the keys/modes of the tunes" | Levine teaches scale theory per chord family (major, melodic minor, diminished, whole-tone); Richards pairs horizontal (key-centred) and vertical (chord-by-chord); ABRSM ties the scales to the set tunes rather than to chords | partial A7b.2 |
| ST-007 | Improvise with pentatonic and blues scales over a tune or a blues. | blues-boogie, jazz, improv-compose, chords-pop | Levine ch 15; Harrison *Blues Piano*; Mackworth-Young *Piano by Ear*; LCM Jazz G5 (knowledge) | [LEV] "Chapter Fifteen: Pentatonic Scales"; [HL-BLUES] "How to solo with blues scales" (fetch-tool text); [PBE] "improvising using pentatonic and blues scales" (fetch-tool text); [LCM-R] "knowledge of pentatonic and blues scale structures" (G5) | Mackworth-Young starts beginners here; Levine places it after voicing and scale-theory chapters | A7a.1 |
| ST-008 | Perform a programme of tunes as one continuous performance, managing the transitions and contrasting moods. | jazz, chords-pop | ABRSM Jazz Performance Grades G1-8 | [ABRSM-JPG] "Candidates present four Tunes in one continuous performance"; [ABRSM-JPG] "managing the transitions from one Tune to another" | only ABRSM's performance grades ask this; its practical grades, LCM, Trinity and RSL mark pieces separately | partial A4.1 |
| ST-009 | Keep a bank of tunes memorised and play one from memory with jazz interpretation. | jazz, jam | LCM Jazz G1-8 (optional); ABRSM Jazz (optional, unmarked) | [LCM-R] "A good bank of memorised pieces contributes to enjoyment"; [ABRSM-JPG] "There is no requirement to perform from memory" | LCM assesses a memorised free-choice piece; ABRSM gives no marks for memory; Berklee teaches it as tune-learning (ST-010) | partial A10.1, partial A4.1 |
| ST-010 | Learn a tune efficiently by analysing its harmony: label the progression (ii-V-I, turnarounds) and use the analysis to memorise it. | jazz, theory-ear | Berklee Online Jazz Piano weeks 2 and 9 | [BK-JAZZ] week 2 "How to Label Progressions and Interpret Melodies"; [BK-JAZZ] week 9 "Practice Techniques for Mastering Repertoire" (fetch-tool text) | no graded syllabus read tests this directly; LCM tests knowledge of II-V-I at G7 (ST-055) | partial A10.1, partial A5.1 |
| ST-011 | Arrange a tune for solo piano: harmonised melody, then an intro and an ending. | jazz, chords-pop | Berklee Online Jazz Piano weeks 11-12 | [BK-JAZZ] week 11 "Arranging Techniques for Solo Piano"; week 12 "Arranging a Song with Intros and Endings" (fetch-tool text) | ABRSM G6-8 List C gives arranged heads instead and asks candidates to "expand upon the given musical material" | A10.1, partial A7a.2 |
| ST-012 | Play a tune in jazz-waltz 3/4 as well as 4/4, keeping the swing feel. | jazz | LCM Jazz G5-8 creative response; ABRSM Jazz G4 (Three-Four Blues) | [LCM-R] "It will either be in 4/4 time or 3/4 time (jazz waltz)" (G5) | ABRSM's evidence is only a tune title on the G4 list; LCM tests it unseen | none |
| ST-013 | Play a rhythm-section vamp from memory for at least two choruses, adding fills after the first. | jazz, jam | LCM Jazz G8 (iconic vamp option) | [LCM-R] "play, from memory, one of the two iconic vamps by Herbie Hancock"; [LCM-R] "At least TWO choruses should be played" | only LCM | partial A4.2 |
| ST-014 | Interpret a hymn or nursery tune in a jazz style. | jazz, hymns-gospel | LCM Jazz G1-3 free choice | [LCM-R] "some hymns also sometimes lend themselves to jazz interpretation" | only LCM | none |

### 1.2 Jazz: voicings, comping, bass

| draft id | ability | track(s) | level range | source (URL + quote) | where sources differ | existing id |
| --- | --- | --- | --- | --- | --- | --- |
| ST-020 | Voice a major-key II-V-I with three-note voicings (root, 3rd, 7th), moving the 7th down a half step, in all twelve keys. | jazz | Levine chs 2-3 (no grade); LCM Jazz G7 (knowledge only, three keys) | [LEV] "Notice that the seventh always comes down a half step."; [LEV] "Now try it in all twelve keys."; [LCM-R] "knowledge of II-V-I patterns (G, C and F majors only)" | Levine: all twelve keys, played; LCM G7: G, C and F only, asked as knowledge in the musical-awareness talk | none (A7b.1 is the minor form) |
| ST-021 | Voice a minor-key ii-V-i (half-diminished ii, dominant V, minor i). | jazz | Berklee Online Jazz Piano week 8 (minor key) | [BK-JAZZ] week 8 "Setting the Mood in a Minor Key" (fetch-tool text) | none of the graded syllabi read names a minor ii-V-i; LCM G7's "minor II7" is the ii chord of a major key ([LCM-R] aural G7). Weakly sourced: the Berklee title names minor-key playing, not the progression | A7b.1 (weak support) |
| ST-022 | Add notes to three-note voicings (9ths, 13ths) and alter them (b9, #9, b13). | jazz, blues-boogie | Levine chs 5 and 8; Berklee Jazz week 4; Richards *Improvising Blues Piano* ch 4 | [LEV] "Chapter Five: Adding Notes to Three-Note Voicings"; [BK-JAZZ] week 4 "Getting the Jazz Sound: Adding Tensions to Your Chords"; [RIB] "Chapter 4: Ninth and thirteenth chords" (fetch-tool text) | Richards reaches 9ths and 13ths inside blues; Levine inside II-V-I | none |
| ST-023 | Play left-hand rootless voicings under a right-hand line. | jazz | Levine chs 7-8; Richards *Exploring Jazz Piano 1* | [LEV] "Chapter Seven: Left-Hand Voicings"; [REJ] "rootless voicings" (fetch-tool text) | Levine follows with altering them (ch 8); Richards pairs them with two-handed voicings | none |
| ST-024 | Voice sus and Phrygian chords, and recognise a sus chord by ear. | jazz | Levine ch 4; LCM Jazz G8 (technical work and aural) | [LEV] "Chapter Four: Sus and Phrygian Chords"; [LCM-R] "The sus chord on any note" (G8); [LCM-R] "identify whether it is a tritone substitution or a sus chord" | LCM puts sus at G8; Levine at chapter 4, before left-hand voicings | none |
| ST-025 | Use tritone substitution for a dominant chord, and recognise it by ear. | jazz | Levine ch 6; Richards *Exploring Jazz Piano 1*; LCM Jazz G8 | [LEV] "Chapter Six: Tritone Substitution"; [LCM-R] "knowledge of tritone substitutions, sus chords and turnarounds" | LCM asks knowledge and ear identification; Levine plays it | none |
| ST-026 | Play two-handed voicings: So What chords, fourth chords, upper structures. | jazz | Levine chs 12-14, 16; Richards *Exploring Jazz Piano 1* | [LEV] "Chapter Twelve: So What Chords"; [LEV] "Chapter Fourteen: Upper Structures"; [REJ] "two-handed voicings" (fetch-tool text) | no graded syllabus read sets these | none |
| ST-027 | Play block chords (locked hands) under a melody. | jazz | Levine ch 19; LCM Jazz G7 technical work | [LEV] "Chapter Nineteen: Block Chords"; [LCM-R] "BLOCK CHORDS On G, D, E, F and A" (G7) | LCM sets them as technical work on five roots; Levine as a melodic texture | none |
| ST-028 | Play Bud Powell voicings (left-hand shells) under a bebop right-hand line. | jazz | Levine ch 17 | [LEV] "Chapter Seventeen: Stride and Bud Powell Voicings" | only Levine | none |
| ST-029 | Comp from a lead sheet behind a melody or a soloist: choose voicings and place them rhythmically. | jazz, chords-pop, jam | ABRSM Jazz G6-8; Levine ch 21; Berklee Pop/Rock week 2; Harrison *Modern Pop Keyboard* | [ABRSM-JPG] "suitable jazz vocabulary and comping voicing"; [LEV] "Chapter Twenty-One: `Comping"; [LCM-R] "assessment of their harmonic, comping and rhythmic skills" | ABRSM and LCM assess comping solo (the pianist's own melody or solo); Berklee and Hal Leonard teach comping as a band role | A10.1 |
| ST-030 | Play a walking bass line in the left hand under right-hand chords or melody. | jazz, blues-boogie | Berklee Jazz week 6; Harrison *Blues Piano*; Richards *Exploring Jazz Piano 1*; ABRSM Jazz G3 (Walking Blues) | [BK-JAZZ] week 6 "Setting the Groove with Bass Lines"; [HL-BLUES] "Left-hand patterns; walking bass"; [REJ] "walking bass lines" (fetch-tool text) | ABRSM's evidence is a G3 tune title only | partial A10.1 ("walk or two-feel") |
| ST-031 | Play a jazz head from a generic lead sheet: melody in the right hand with an accompaniment realised from the chord symbols. | jazz, chords-pop | ABRSM Jazz G6-8 | [ABRSM-JPG] "The Head should be performed with a clear melody and appropriate"; [ABRSM-JPG] "accompaniment realised from the chord sequence on the lead sheet" | RCM's lead-sheet option (ST-061) is the classical-board version; ABRSM adds embellishment and a solo | A10.1 |

### 1.3 Jazz and style technique (technical work the style syllabi set)

| draft id | ability | track(s) | level range | source (URL + quote) | where sources differ | existing id |
| --- | --- | --- | --- | --- | --- | --- |
| ST-040 | Play the modes from memory (Dorian, Mixolydian, Lydian, Aeolian, Phrygian), straight or swung. | jazz, technique, improv-compose | ABRSM Jazz G1-5; LCM Jazz G2-7; RSL Popular Piano G1-8 | [ABRSM-JP] "Dorian on D; Mixolydian on G; C major (two octaves)" (G1); [LCM-R] "Dorian starting on D and A - two octaves" (G2); [LCM-R] "Phrygian starting on A" (G7) | ABRSM starts Dorian and Mixolydian at G1, Lydian at G3; LCM starts Dorian at G2, Aeolian G3, Mixolydian G4, Lydian G5, Phrygian G7; RSL Popular has A Aeolian at G1 and Dorian and Mixolydian at G2 | partial A9.1 |
| ST-041 | Play major, minor and b3 pentatonic scales (five-note and octave forms). | jazz, blues-boogie, technique | ABRSM Jazz G1-5; LCM Jazz G1-4; RSL Popular Piano G1-5 | [ABRSM-JP] "Major pentatonic on C; b3 pentatonic on G (five notes)" (G1) | the b3 pentatonic is ABRSM's alone ("* Jazz Piano only" on its pattern page) | partial A9.1 |
| ST-042 | Play the blues scale, swung, hands separately. | blues-boogie, jazz, technique | ABRSM Jazz G2-5; LCM Jazz G3-8; RSL Popular Piano G3-8 | [ABRSM-JP] "Blues scale on D (one octave)" (G2); [LCM-R] "D blues scale - one octave, hands separately, swung" (G3) | ABRSM starts at G2, LCM and RSL Popular at G3; LCM states the hands-together form is not required | partial A7a.1, partial A9.1 |
| ST-043 | Play seventh-chord arpeggios and broken chords (dominant 7th, minor 7th, major 7th), swung, a dominant 7th resolving to its tonic. | jazz, technique, theory-ear | ABRSM Jazz G4-5; LCM Jazz G4-5; RSL Keys G3-5 (chord voicings); RSL Popular Piano G5-8 | [ABRSM-JP] "Formed from the chords of C7, G7, Am7 and Gm7" (G4); [LCM-R] "resolving on the tonic, swung" (G4); [RSL-K] "Group C: Dominant 7ths" (G3) | RSL Keys orders voicing groups dom7 (G3), m7 (G4), maj7 (G5); ABRSM mixes dom7 and m7 at G4; LCM sets dom7 only | none |
| ST-044 | Play ninth-chord arpeggios (major 9, dominant 9, minor 9) to the ninth. | jazz, technique | ABRSM Jazz (pattern page; grades not stated in the pages read) | [ABRSM-JP] "C9 to a ninth" and "Cm9 to a ninth" (pattern examples) | the grade that sets them was not found in the pages read | none |
| ST-045 | Play augmented, diminished, whole-tone and diminished (octatonic) scales and arpeggios as jazz technique. | jazz, technique | LCM Jazz G6-8; RSL Popular Piano G6-8 | [LCM-R] "WHOLE TONE SCALES Starting on C" (G8); [LCM-R] "DIMINISHED SCALES Starting on C" (G8); [RSL-P] "augmented arpeggios" (G8) | LCM offers them as alternatives the candidate chooses among; RSL Popular requires them at G8 | none |
| ST-046 | Play a chord shape from memory with one hand on request (major, minor and named jazz chords). | jazz, chords-pop | LCM Jazz Step 1-2 | [LCM-R] "play the following chords, from memory, with the right hand" | LCM sets it below Grade 1 | none |
| ST-047 | Play a progression of triads with each hand, moving to the nearest inversion (voice-leading) rather than jumping in root position. | chords-pop, rock-metal, jazz | RSL Keys Debut-G5 | [RSL-K] "using the nearest right hand inversions for the stated chords" | RSL Keys alone among the graded syllabi read; Berklee Pop/Rock week 1 teaches the triads ([BK-POP] "Quarter-Note Triads in Pop/Rock Music") | none |

### 1.4 Blues and boogie-woogie

| draft id | ability | track(s) | level range | source (URL + quote) | where sources differ | existing id |
| --- | --- | --- | --- | --- | --- | --- |
| ST-050 | Play the 12-bar blues form on I, IV and V (dominant sevenths), knowing where each chord falls. | blues-boogie, jazz | ABRSM Jazz G1-5 (a Blues list at every grade); Trinity improvising G3; Berklee Jazz week 3; RSL Keys G3 (twelve-bar riff) | [BK-JAZZ] week 3 "Playing a Swing Blues" (fetch-tool text); [RSL-K] "play an twelve bar riff to the backing track" (G3); [LCM-R] "knowledge of blues structures" (G6) | LCM tests blues structure as knowledge at G6; ABRSM puts a blues on every grade from G1; Trinity's improvising test takes the blues style at G3 | partial A7a.1 |
| ST-051 | Keep a boogie-woogie or shuffle left-hand pattern steady through the form. | blues-boogie | Harrison *Blues Piano*; Lowry *Boogie-Woogie Piano*; Richards *Improvising Blues Piano* (around grade 3 entry); Berklee Blues/Rock; Trinity improvising G5 (shuffle) | [RIB] "Authentic left-hand patterns and bass lines" (fetch-tool text); [HL-BLUES] "Left-hand patterns; walking bass" (fetch-tool text); [BK-BR] week 4 "Blues Technique" (fetch-tool text) | Richards assumes "a basic competence of around grade 3"; Trinity sets "shuffle" as an improvising style at G5 | A7a.1 |
| ST-052 | Improvise or play right-hand riffs and licks while the left hand keeps its pattern (hand independence). | blues-boogie | Richards *Improvising Blues Piano*; Lowry *Boogie-Woogie Piano*; Berklee Blues/Rock week 5 | [RIB] "Co-ordination exercises for both hands" (fetch-tool text); [HL-BW] "inventing your own melodic riffs" (fetch-tool text); [BK-BR] "Perform blues- and rock-based licks and use them to create improvised solos" (fetch-tool text) | none recorded | A7a.1 |
| ST-053 | Play blues turnarounds and endings. | blues-boogie, jazz | Harrison *Blues Piano*; LCM Jazz G3-4 (performance), G8 (knowledge) | [HL-BLUES] "Endings and turnarounds" (fetch-tool text); [LCM-R] "awareness of turnaround figures" (G3-4) | none of the sources read names which turnaround is plainest; A7a.2's I7-IV7-I7-V7 versus I-vi-ii-V contrast is not in them | A7a.2 |
| ST-054 | Play the blues with minor and diminished chords (minor blues). | blues-boogie | Richards *Improvising Blues Piano* ch 5; RSL Keys G5 ear test (i7, iv, v) | [RIB] "Chapter 5: Minor and diminished chords" (fetch-tool text); [RSL-K] "chords i 7, iv and v in the key of either G blues" | Richards' chapter is a chord type, not explicitly the minor-blues form; RSL tests minor-blues chords by ear only | partial A7a.3 |
| ST-055 | Play the blues on triads and sixth chords, then seventh chords, then ninths and thirteenths (chord-type progression of a blues method). | blues-boogie | Richards *Improvising Blues Piano* chs 1-4 | [RIB] "Chapter 1: Triads"; "Chapter 2: Sixth chords"; "Chapter 3: Seventh chords" (fetch-tool text) | only Richards orders a blues method by chord type | none |
| ST-056 | Play solo blues piano: one player supplies bass, harmony and melody. | blues-boogie | Berklee Blues/Rock week 9; Valerio *Stride & Swing Piano* (early blues) | [BK-BR] week 9 "Solo Blues Piano"; [BK-BR] "Adapt blues and rock keyboard techniques for solo piano and band settings" (fetch-tool text) | none recorded | partial A7a.1 |
| ST-057 | Play New Orleans and rock 'n' roll piano figures. | blues-boogie, rock-metal | Berklee Blues/Rock weeks 6-7; Valerio *Stride & Swing Piano* | [BK-BR] week 6 "Rock and Roll Piano"; week 7 "New Orleans Piano" (fetch-tool text); [HL-STRIDE] "New Orleans jazz" (fetch-tool text) | none recorded | none |

### 1.5 Popular and chord-symbol playing

| draft id | ability | track(s) | level range | source (URL + quote) | where sources differ | existing id |
| --- | --- | --- | --- | --- | --- | --- |
| ST-060 | Read a chord symbol and play the chord it names, across the pop vocabulary by stage: triads, sevenths, sus4, added 6th, slash chords, power chords, 9ths, diminished and augmented. | chords-pop, rock-metal, jazz | Trinity Rock & Pop improvising Initial-G8 (chord vocabulary by grade) | [TCL] "simple major and minor chords only" (Initial, table); [TCL] "power chords, added 6th chords (major and minor), slash chords" (G6, table) | Trinity grades the vocabulary: I, IV, V (Initial); diatonic (G1); 7ths (G3); maj7 and m7 (G4); sus4 (G5); power, add6, slash (G6); 9ths, dim, aug (G7); RSL Popular grades the chords heard (ST-091), not read | none |
| ST-061 | Read a lead sheet (melody with chord symbols) and realise an accompaniment from the symbols at sight. | chords-pop, hymns-gospel, holiday | RCM Levels 5-10 (sight-reading option); RSL Popular Piano G6 and G8 (quick study); Trinity playback G5 (symbols in the chart) | [RCM] "read a lead sheet (with a melody and root/quality chord symbols)"; [RCM] "realize an accompaniment based on the chord symbols provided"; [RSL-P] "The outline is in the form of a `lead sheet' or `session chart'" | RCM offers it from Level 5 with harmony tied to that level's theory syllabus; RSL from G6 with a backing track; RCM Level 8 adds "creative accompaniments appropriate to the style" | none |
| ST-062 | Accompany from a chord chart with lyrics (no melody line). | chords-pop, holiday, jam | Trinity Rock & Pop (own-choice format, all grades) | [TCL] "A chord chart with lyrics" | Trinity accepts it as a score format; no syllabus read tests it unseen | none |
| ST-063 | Play pop accompaniment textures: quarter-note triads, eighth-note comping, arpeggiated parts, repeated right-hand patterns. | chords-pop, rock-metal | Berklee Pop/Rock weeks 1-3; Trinity Rock & Pop G1 parameters; Harrison *Modern Pop Keyboard* | [BK-POP] week 2 "Eighth-Note Comping Patterns in Pop/Rock Music"; week 3 "Arpeggiated Keyboard Parts in Pop/Rock Music" (fetch-tool text); [TCL] "repeated RH accompaniment patterns" (G1) | Trinity describes them as features of graded songs; Berklee as patterns to apply to any chart | none |
| ST-064 | Improvise over an unseen chord chart and backing track in a named style, with a feel for the groove. | chords-pop, improv-compose, rock-metal, jam | Trinity Rock & Pop Initial-G8 (session skills); RSL Keys Debut-G5 (I&I); RSL Popular Piano G1-5 (I&I) | [TCL] "improvise in a specified style over a recorded" backing track; [TCL] "a fundamental sense of feel for the suggested groove"; [RSL-P] "a performance made up of chords and/or single notes" | Trinity: looped track played four times, 4-16 bars by grade, style named; RSL Keys: 4-12 bars over a CD track; RSL Popular: 4-16 bars at 60-80 bpm, chords or single notes, no track stated | partial A7b.2 |
| ST-065 | Improvise fills, short solos and solo breaks inside a song's arrangement. | chords-pop, rock-metal | Trinity Rock & Pop G4-8 (song parameters); Trinity improvising G6-8 (solo break) | [TCL] "Improvised solos of about four bars, improvised fills and accompaniments" (G4); [TCL] "Multiple improvised solos, fills and accompaniments of any length" (G8) | lengths grow by grade: 4 bars (G4), 8 (G5), 12 (G6), 16 (G7), any (G8) | none |
| ST-066 | Play keyboard grooves in named popular styles: rock, pop, ballad, country, reggae, R&B, funk, disco, shuffle, Latin, metal, gospel. | chords-pop, rock-metal, hymns-gospel | Trinity improvising Initial-G8 (styles by grade); Berklee Pop/Rock weeks 5-11 | [TCL] "simple rock, pop" (Initial, table); [TCL] "funk, shuffle, disco" (G5, table); [BK-POP] "Perform keyboard grooves and textures across multiple pop- and rock-based genres" (fetch-tool text) | Trinity grades styles (pop and rock Initial; ballad and heavy rock G1; country G2; blues G3; reggae and R'n'B G4; funk, shuffle, disco G5; Latin, metal G6; jazz, boogie-woogie G7; hybrids G8); Berklee teaches them unordered by grade | none |
| ST-067 | Play a riff in one shape and move it to the chord roots the chart gives, to a backing track. | chords-pop, rock-metal | RSL Keys Debut-G5 (Group C/D riff) | [RSL-K] "The riff pattern shown in bars 1 & 2 should be played in the same shape" (G3) | only RSL Keys | none |
| ST-068 | Adapt a printed popular piece to one's own playing style, adding improvised passages within its style. | chords-pop | RSL Popular Piano G1-8 | [RSL-P] "include improvisational passages, so long as these adaptations keep" within the style | only RSL Popular | partial A10.2 |
| ST-069 | Arrange a cover version of a song for keyboard (one's own arrangement). | chords-pop, rock-metal | Trinity Rock & Pop (own-choice song, all grades); RSL Popular Piano | [TCL] "A cover version that the candidate has arranged"; [RSL-P] "arranging hit tunes as part of the performed repertoire" | both accept it as exam repertoire; neither states a method | A10.2 |
| ST-070 | Choose voicings, rhythms and registers that keep a pop or rock part clear and moving. | chords-pop, rock-metal | Berklee Pop/Rock (course outcome) | [BK-POP] "Choose voicings, rhythms, and registers that enhance clarity and momentum" (fetch-tool text) | only Berklee states it as an outcome | none |
| ST-071 | Choose a keyboard sound and use the pedals and expressive devices to suit the style. | chords-pop, rock-metal | Trinity Rock & Pop improvising (by grade); RSL Keys (patches per test) | [TCL] "choosing a suitable keyboard voice; changing the voice at some point" | an acoustic-piano player meets only the pedal and dynamics parts; Trinity says "not all of these can be demonstrated" on acoustic piano | none |
| ST-072 | Transpose a song or hymn to another key at the keyboard. | chords-pop, hymns-gospel, holiday | BYU Organ Practicum (learning outcome) | [BYU] "melody harmonization, figured bass, transposition, improvisation" (fetch-tool text) | none of the graded style syllabi read tests transposition; ABRSM's jazz performance grades forbid transposing set tunes ("must not transpose into any other key", an exam rule, not pedagogy) | A2.1 (weak support from these sources) |

### 1.6 Rock

| draft id | ability | track(s) | level range | source (URL + quote) | where sources differ | existing id |
| --- | --- | --- | --- | --- | --- | --- |
| ST-080 | Comp and solo in rock styles (classic, pop, blues, southern, hard, progressive, alternative rock, metal). | rock-metal | Miller *Rock Keyboard*; Berklee Blues/Rock week 8; Trinity improvising G1 (heavy rock), G6 (metal) | [HL-ROCK] "Learn to comp or solo in any of your favorite rock styles" (fetch-tool text); [BK-BR] week 8 "Modern Rock" | Trinity grades heavy rock at G1 and metal at G6; Miller lists the styles unordered | none |
| ST-081 | Adapt a band keyboard part for solo piano, and a solo-piano idea for a band. | rock-metal, chords-pop | Berklee Blues/Rock (course outcome) | [BK-BR] "Adapt blues and rock keyboard techniques for solo piano and band settings" (fetch-tool text) | no graded syllabus read tests reduction; Trinity's arranged cover (ST-069) is the nearest | partial A7e.1 |
| ST-082 | Play power chords and octave-bass riffs. | rock-metal | Trinity improvising G6 | [TCL] "power chords" (G6, table) | only Trinity | none |

### 1.7 Ragtime and stride

| draft id | ability | track(s) | level range | source (URL + quote) | where sources differ | existing id |
| --- | --- | --- | --- | --- | --- | --- |
| ST-090 | Play ragtime right-hand syncopations exactly, holding every tied note its full value, at a slow march tempo before any faster. | ragtime | Joplin *School of Ragtime* Exercises 1-6 (1908, no grade); ABRSM Jazz G4 (Original Rags) | [JOP] "by scrupulously observing the ties"; [JOP] "Play slowly until you catch the swing" | Joplin forbids fast tempos outright ("never play ragtime fast at any time"); no other source read sets a tempo rule | A7d.1 |
| ST-091 | Read a tied syncopation as one tone and an untied repeated note as two, telling them apart on the page. | ragtime, core | Joplin *School of Ragtime* Exercise 4 | [JOP] "a syncopation only when the tied notes are on the same degree" | only Joplin | partial A7d.1 |
| ST-092 | Keep a steady march (oom-pah) left hand in a rag without vamping or rushing. | ragtime | Joplin *School of Ragtime* Exercise 2; Valerio *Stride & Swing Piano* | [JOP] "careless with the left hand, and are prone to vamp"; [HL-STRIDE] "left- and right-hand techniques including chords, bass runs, patterns" (fetch-tool text) | Joplin warns against vamping (improvised left-hand filler); Valerio teaches bass runs as part of the left-hand style | A7d.1 |
| ST-093 | Play a stride left hand: bass notes or tenths on the strong beats, chords on the weak beats, under a melody. | ragtime, jazz | Levine ch 17; Valerio *Stride & Swing Piano*; Berklee Intermediate Keyboard week 11; LCM Jazz G8 study | [LEV] "Chapter Seventeen: Stride and Bud Powell Voicings"; [BK-INT] week 11 "Ragtime and Stride" (fetch-tool text); [LCM-R] "Stridin' and Behavin'" (G8 study) | LCM places a stride study at G8; Berklee in an intermediate course; the beat assignment in this row's wording is the common description, not quoted from a source read (unverified as stated) | partial A7d.1 |

### 1.8 Latin

| draft id | ability | track(s) | level range | source (URL + quote) | where sources differ | existing id |
| --- | --- | --- | --- | --- | --- | --- |
| ST-100 | Hear, clap and keep the clave: son clave and rumba clave in both directions (2-3, 3-2), and 6/8 clave. | latin | Mauleón ch III; Berklee Latin Piano Styles weeks 1-3 | [MAU] "Son Clave", "Rumba Clave", "6/8 Clave" (ch III headings); [BK-LAT] week 1 "Mother of All Rhythms" (fetch-tool text) | Mauleón also treats a "Brazilian Clave"; Berklee groups 12/8-derived patterns with clave-based ones | partial A7c.2 |
| ST-101 | Phrase a melody or a piano part so it agrees with the clave. | latin | Mauleón chs III-IV | [MAU] "Phrasing With The Clave"; [MAU] "The Melody and Clave" | only Mauleón | partial A7c.2 |
| ST-102 | Play a piano montuno (guajeo) over a chord progression, locked to the clave. | latin, jazz | Mauleón ch IV (Piano, p. 117); Levine ch 20; Berklee ILPN-246; Valerio *Latin Jazz Piano*; Martignon *Salsa Piano* | [MAU] "-Piano 117" under "Instrument Patterns and Clave"; [SHER] "how montuno patterns function within real ensemble contexts" (fetch-tool text); [ILPN246] "rhythmic aspects and the historical context of Afro-Cuban piano montunos" (fetch-tool text) | the pattern itself was not read in any source (tables of contents and descriptions only); ABILITY-MAP's G15 recorded the guajeo as source-blocked, and these sources name it without supplying it | A7c.2 |
| ST-103 | Play a bass tumbao (anticipated bass) in the left hand under a montuno. | latin | Mauleón ch IV (Bass, p. 105) | [MAU] "-Bass 105"; [SHER] "how bass tumbaos lock with piano and percussion" (fetch-tool text) | Mauleón teaches the tumbao as the bassist's part; piano use of it is the learner's transfer, not stated in what was read | A7c.2 |
| ST-104 | Tell the Cuban styles apart and play a pattern for each: son, son-montuno, danzón, cha-cha-chá, mambo, songo, guaguancó. | latin | Mauleón ch V; Berklee Latin weeks 2-4 | [MAU] "Rhythmic Style Score Samples" (ch V, with son, danzón, mambo, songo); [BK-LAT] week 2 "Cuban Styles" (fetch-tool text) | Mauleón gives ensemble scores; Berklee piano parts | none |
| ST-105 | Comp a bossa nova and a samba from a lead sheet. | latin, jazz | Berklee Jazz week 7; Berklee Latin week 6; Willey and Cardim *Brazilian Piano*; ABRSM Jazz G5 (Blue Bossa) | [BK-JAZZ] week 7 "Playing a Bossa Nova"; [BK-LAT] week 6 "More Brazilian Styles: Samba and Bossa Nova" (fetch-tool text); [HL-BRAZ] "choro, samba, and bossa nova" (fetch-tool text) | no source read prints the bossa left-hand pattern (the ABILITY-MAP's G14 stays blocked on the pattern, not on the ability) | A7c.3 |
| ST-106 | Tap two-handed Latin rhythm patterns (upper and lower parts at once): samba, bossa nova, beguine; identify mambo and rumba patterns. | latin, theory-ear | LCM Jazz G5 aural | [LCM-R] "tap (one hand upper pattern, one hand lower pattern)"; [LCM-R] "either the Samba, Bossa Nova or Beguine example" | only LCM; the patterns are printed in LCM's Jazz Piano Handbook 1, not read | partial A7c.3 |
| ST-107 | Play choro and maxixe (Brazilian tango) piano parts. | latin | Willey and Cardim *Brazilian Piano*; Berklee Latin week 5 | [BK-LAT] week 5 "Brazilian Styles: Maxixe (Brazilian Tango) and Choro" (fetch-tool text) | none recorded | none |
| ST-108 | Play the tango accompaniment rhythms: marcato, síncopa and 3-3-2, with arrastre and yumba. | latin | Link and Wendland (tango scholarship); Berklee Latin week 10 | [LW] "accompanimental tango rhythms of marcato, síncopa, and 3-3-2"; [LW] "a live demonstration of the yumba technique on the piano" | Link and Wendland describe the Argentine orquesta tradition; A7c.4's tango-nuevo ostinato is not named in what was read | partial A7c.4, partial A7c.1 (3-3-2) |
| ST-109 | Play a Latin piano part in each of the three jazz-pianist roles: rhythm-section member, ensemble lead, soloist. | latin, jazz, jam | Valerio *Latin Jazz Piano* | [HL-LJ] "chord voicings, comping techniques, montunos, and lead sheets" (fetch-tool text, likely paraphrase) | only Valerio frames it by role | none |
| ST-110 | Play accompaniments in further Latin American styles: Peruvian and Argentine 6/8 and 3/4, Colombian and Venezuelan, Puerto Rican bomba and plena, merengue. | latin | Berklee Latin weeks 8, 11; Mauleón ch V | [BK-LAT] week 8 "6/8 and 3/4 Peruvian and Argentine styles" (fetch-tool text); [MAU] "-Bomba 212", "-Plena 213", "-Merengue 215" | breadth beyond the app's latin track description (clave, tumbao, montuno); recorded so the gap is visible, not proposed as scope | none |

### 1.9 Hymns, gospel and accompanying singing

| draft id | ability | track(s) | level range | source (URL + quote) | where sources differ | existing id |
| --- | --- | --- | --- | --- | --- | --- |
| ST-120 | Play a simplified hymn in two or three parts, two notes in one hand where needed. | hymns-gospel, holiday | Church of Jesus Christ *Keyboard Course* section 4 (beginner course, no grade) | [LDS] "there is always a soprano and a bass line"; [LDS] "you will usually need to play two notes with the same hand" | none recorded | none |
| ST-121 | Play a four-part (SATB) hymn from the hymnbook as written. | hymns-gospel | *Keyboard Course* section 4; BYU Organ Practicum | [LDS] "Playing four-part hymns from the hymnbook is the next step" | the course reaches it after the three-part stage; BYU assumes it | none |
| ST-122 | Play a hymn introduction that gives the singers the key, the tempo and the mood. | hymns-gospel, holiday | *Keyboard Course* (glossary) | [LDS] "An introduction gives the key or pitch, the tempo, and the mood" | none recorded | A7g.1 |
| ST-123 | Accompany a congregation, choir or group singing a hymn. | hymns-gospel, holiday | *Keyboard Course*; BYU Organ Practicum; RSCM Church Music Skills (organ) | [LDS] "be a keyboard accompanist for hymn singing"; [BYU] "accompany choirs at the organ, interpreting and preparing the score" (fetch-tool text) | BYU and RSCM are organ courses; the Keyboard Course is for any keyboard | A7g.1 |
| ST-124 | Harmonise a hymn melody (choose chords under a given tune). | hymns-gospel, improv-compose | BYU Organ Practicum (outcome) | [BYU] "melody harmonization, figured bass, transposition, improvisation" (fetch-tool text) | only BYU among the sources read names it, for organists | partial A6.1 |
| ST-125 | Decorate a hymn's harmony with gospel passing chords and walk-ups: chromatic dominant chords and ii-V approaches into the next chord. | hymns-gospel | PianoGroove lessons (Hayden; Roussel); Cowling *Gospel Piano*; Berklee Pop/Rock week 6 | [PG-WALK] "string together multiple chromatic passing chords before a chord change" (fetch-tool text); [PG-HYMN] "approach the C chord with its V7 chord G7" (fetch-tool text) | PianoGroove teaches it on gospel blues and hymns; Cowling's description names "harmonic techniques" without detail; no source read names the plagal close | A7g.2 |
| ST-126 | Play gospel grooves and rhythmic devices within a gospel song's form. | hymns-gospel | Cowling *Gospel Piano*; Berklee Pop/Rock week 6 | [HL-GOSPEL] "rhythmic devices, grooves, melodic and harmonic techniques, and formal design" (fetch-tool text) | description-level only | none |
| ST-127 | Accompany a singer: choose rhythm, voicing and register that support the voice, and arrange the song for voice and piano. | hymns-gospel, holiday, chords-pop, jam | Berklee ILPN-227; Berklee Latin Piano Styles; Deutsch *Piano for Singers* | [ILPN227] "Focuses on rhythm, voicing, registration, and overall arrangement." (fetch-tool text); Berklee Latin: "piano accompanying a singer" (search-result text) | Berklee ILPN-227 is for singers accompanying themselves; no graded syllabus read examines singer accompaniment | A7g.1 |
| ST-128 | Sing while playing one's own accompaniment. | chords-pop, holiday | Berklee ILPN-227 | [ILPN227] "Practical intermediate keyboard skills for self-accompanying vocalists" (fetch-tool text) | only ILPN-227 | none |

### 1.10 Playing with others

| draft id | ability | track(s) | level range | source (URL + quote) | where sources differ | existing id |
| --- | --- | --- | --- | --- | --- | --- |
| ST-130 | Play with a rhythm section or a minus-one track (bass and drums, no piano): enter after the count-in, keep the form, leave the solos to the pianist's turn. | jam, jazz, chords-pop | ABRSM Jazz Performance G6-8; LCM Jazz G6-8 (optional backing); Trinity session skills (all grades); RSL Keys | [ABRSM-JPG] "with bass and drums but no piano"; [ABRSM-JPG] "directly applicable to a typical jam session scenario"; [LCM-R] "so that the pianist can demonstrate their rhythm section skills" | ABRSM G1-5 tunes are unaccompanied; Trinity and RSL use tracks from the lowest grade | A4.2 |
| ST-131 | Switch roles within one performance between groove accompanist and soloist. | jam, jazz, chords-pop | Berklee Intermediate Keyboard week 9; Berklee Pop/Rock week 11 | [BK-INT] week 9 "Switching Roles: Grooving Accompanist to Soloist"; [BK-POP] week 11 "The Art of the Jam" (fetch-tool text) | none recorded | partial A4.2 |
| ST-132 | Play a piece with a duet partner. | jam, jazz | LCM Jazz G1 | [LCM-R] "Lucy's Blues [to be played with duet partner]" | only LCM | partial A4.2 |

### 1.11 Playing by ear, and aural abilities the style syllabi set

| draft id | ability | track(s) | level range | source (URL + quote) | where sources differ | existing id |
| --- | --- | --- | --- | --- | --- | --- |
| ST-140 | Play back a heard melody on the keyboard (2-8 bars, given the key and sometimes the first note). | theory-ear, chords-pop, improv-compose | RSL Popular Piano G1-8; RSL Keys Debut-G5; Trinity playback Initial-G8; ABRSM Jazz quick study by ear G1-5; RCM playback all levels (completeness audit) | [RSL-P] "a playback test where the candidate hears a melody"; [TCL] "candidates should repeat each of these straight back in turn"; [ABRSM-JP] "to play the first two bars by ear will hear them played three times" | Trinity: phrase-by-phrase over a running backing track, reading the chart allowed; RSL: whole melody after two hearings, key given, first note given at G1-5 only; ABRSM: three hearings then an improvised continuation | A3.1 |
| ST-141 | Play back a heard bass line in the left hand. | theory-ear, blues-boogie | RSL Keys G2, G5 | [RSL-K] "play back a simple two bar bassline" (G2); [RSL-K] "a four bar bass clef melody composed from either the G blues" (G5) | only RSL Keys | partial A3.1 |
| ST-142 | Play back a heard chord progression in its rhythm. | theory-ear, chords-pop | RSL Keys G1-5 | [RSL-K] "play back on their keyboard a given two bar rhythmic chord progression" | RSL Keys asks it played; RSL Popular asks it named (ST-143) | A3.1 |
| ST-143 | Recognise a heard chord progression by function and quality (I-IV-V; then ii7, V7, vi7, iii7, viiø; root movement in any key). | theory-ear, chords-pop | RSL Popular Piano G2-8 | [RSL-P] "recognize a chord sequence using chords from the following" (G3-6); [RSL-P] "recognize the root movement and chord type of a chord progression" (G8) | major/minor single chords at G2; I, IV, V at G3; ii7, V7, vi7 G4-5; full diatonic with maj7 and viiø at G6; any key and root movement G8 | partial A3.1, partial A5.1 |
| ST-144 | Identify jazz chord types and progressions by ear: major 7, minor 7, dominant 7; II7 versus V7; a tritone substitution versus a sus chord; the modes. | theory-ear, jazz | LCM Jazz aural G6-8 | [LCM-R] "identify whether it is the minor II7 chord or the V7 chord" (G7); [LCM-R] "identify which mode was played" (G6) | only LCM among those read | none |
| ST-145 | Learn a song by ear and accompany it with the left hand. | chords-pop, theory-ear | Mackworth-Young *Piano by Ear* (beginner, no grade) | [PBE] "able not only to play this melody by ear, but also to accompany themselves with the left hand" (fetch-tool text, from a review) | the book works from known songs; A3.1 works from a recording | A3.1 |
| ST-146 | Clap the pulse of heard music, then clap on a named beat (backbeat, last beat, a set quaver) while it plays. | theory-ear, jazz, core | ABRSM Jazz aural G1-5 | [ABRSM-JP] "To clap the pulse of a passage of music in 3 or 4 time"; [ABRSM-JP] "To clap on the last beat of each bar" (G1) | the set beat moves by grade: last beat (G1), second or last (G2), any (G3), fourth or last quaver (G4), any quaver (G5) | A8.1 |
| ST-147 | Clap back a heard rhythm, including syncopations. | theory-ear, core | ABRSM Jazz aural G1-5; RSL Keys Debut; RSL Popular G1; LCM Jazz aural G3-4 | [ABRSM-JP] "To clap the rhythm of a short extract"; [RSL-K] "play back on their keyboard a two bar rhythm" (Debut) | RSL Keys has it played on one key with a drum backing; ABRSM clapped | A8.1 |
| ST-148 | Identify a groove by ear (swing, rock, Latin; down-beat versus back-beat) and state the metre. | theory-ear, jazz | ABRSM Jazz aural G4-5; LCM Jazz aural G1 | [ABRSM-JP] "to identify the groove as swing, rock or Latin" (G4); [LCM-R] "identify the piece as `down beat' or `back beat'" (G1) | LCM starts at G1 with down/back beat; ABRSM at G4 with three grooves | partial A8.1 |
| ST-149 | Sing back, as an echo in strict time, short phrases played in a key or mode. | theory-ear | ABRSM Jazz aural G1-3 | [ABRSM-JP] "To sing, as an echo, four two-bar phrases" | range grows from a 3rd (G1) to a 6th (G3) | none |
| ST-150 | Recognise by ear the form of a heard piece (AABA, ABAB and similar) and its key and modulations. | theory-ear, jazz | LCM Jazz aural G8; LCM musical awareness G5 | [LCM-R] "describe the overall form" (G8) | only LCM | none |

### 1.12 Improvisation and composition

| draft id | ability | track(s) | level range | source (URL + quote) | where sources differ | existing id |
| --- | --- | --- | --- | --- | --- | --- |
| ST-160 | Play a given opening (2 or 4 bars) at sight or by ear and improvise its continuation in strict time from the named scale or the given chords. | improv-compose, jazz | ABRSM Jazz G1-5 (quick study); LCM Jazz G1-8 (creative response); RSL Keys G4-5 (improvised two-bar ending) | [ABRSM-JP] "to improvise a two-bar continuation based on the scale indicated"; [LCM-S] "improvise the continuation of the passage according to given chord indications" | ABRSM: 2+2 bars (G1-2), 4+4 (G3-5), scale-led with chord symbols, sight or ear; LCM: 2+2 (G1-2), 4+4 (G3-5), then opening plus chords (G6-8); RSL: a two-bar improvised ending after a sight-read piece | none |
| ST-161 | Improvise an answer phrase to a given question phrase to make an eight-bar period (parallel, then contrasting). | improv-compose, theory-ear | RCM Levels 5-8 and 10 (playback option) | [RCM] "play back a given four-measure question phrase and improvise an answer phrase" | parallel period at Levels 5-6, contrasting from Level 7; the same option was not found by text search at Level 9 | none |
| ST-162 | Improvise answering phrases in time, call and response, over a running groove. | improv-compose, jazz, jam | ABRSM Jazz aural G1-5; LCM Jazz aural G2-4 | [ABRSM-JP] "To sing or play improvised answering phrases to four two-bar phrases"; [LCM-R] "a two-bar improvised response in a swing style" (G2) | ABRSM: sung or played over the examiner's groove; LCM: clapped (G2) or sung or played on a rhythm (G3-4) | none |
| ST-163 | Improvise with melodic development: build a solo from an idea and develop it rather than stringing unrelated fragments. | improv-compose | Trinity Rock & Pop learning outcome 4.2, Initial-G8 | [TCL] "Improvise with some melodic development" (Initial); [TCL] "Improvise with melodic development" (G4) | the qualifier grows by grade ("creative approach" G2, "controlled" G3, "well-controlled" G5, "imaginative" G6, "creative" G7); Trinity's classical improvisation (completeness audit) sets a motivic stimulus | none |
| ST-164 | Compose an original piece or song in a style and perform it as exam repertoire. | improv-compose, jazz, chords-pop | Trinity Rock & Pop (own choice, all grades); RSL Popular Piano G1-8; LCM Jazz G6-8 (set forms) | [TCL] "An original song that the candidate has written"; [RSL-P] "either a self-composed piece or a piece of established popular repertoire"; [LCM-R] "Own composition (based on the Blues)" (G6) | LCM fixes the form by grade: blues (G6), "II-V-I structures" (G7), "Rhythm Changes" (G8); Trinity and RSL leave it free | partial A6.2 |
| ST-165 | Write one's composition down as a lead sheet, a chord chart or a full score. | improv-compose | Trinity Rock & Pop (own-choice formats) | [TCL] "A lead sheet with lyrics, chords and melody line"; [TCL] "A full score using conventional staff notation" | Trinity accepts handwritten or computer-generated scores | A6.2 |
| ST-166 | Create original keyboard parts and accompaniments in a style (blues, rock, Latin). | improv-compose, blues-boogie, rock-metal, latin | Berklee Blues/Rock and Latin Piano Styles (outcomes) | [BK-BR] "Apply blues and rock harmonic concepts to create original keyboard parts"; [BK-LAT] "Apply Latin rhythmic concepts to create original piano parts and accompaniments" (fetch-tool text) | only Berklee states it | none |
| ST-167 | Talk about the style of what one played: its harmony, form, influences, and one's own performance. | theory-ear, jazz | LCM Jazz musical awareness G1-8; RSL General Musicianship Questions | [LCM-R] "demonstrate knowledge of blues structures, chord structures, and modes" (G6); [LCM-R] "demonstrate stylistic understanding and awareness" (G6) | LCM grows from naming notation (G1-2) to context and self-criticism (G6-8); RSL asks five questions on a piece | partial A5.1 |

## 2. Coverage

Every graded component and method-book chapter read, with the abilities that cover it. "UNCOVERED" gives why. "classical family" means the component is a classical or general skill outside the style tracks, recorded for the other drafts.

### 2.1 ABRSM Jazz Piano Practical Grades 1-5 [ABRSM-JP]

| component | covering ids |
| --- | --- |
| Tunes: Blues list | ST-002, ST-004, ST-050 |
| Tunes: Standards list | ST-002, ST-004 |
| Tunes: Contemporary Jazz list | ST-002, ST-004 |
| Tunes: feel indication (straight 8s or swing) | ST-001 |
| Tunes: improvisation (solo) section | ST-004 |
| Tunes: embellishments (Introduction to the books) | ST-003 (the Introduction itself was not read) |
| Scales: modes | ST-040 |
| Scales: major (two octaves) | UNCOVERED here: classical-family technique (completeness audit rows) |
| Scales: pentatonic and b3 pentatonic | ST-041 |
| Scales: blues | ST-042 |
| Scales: chromatic | UNCOVERED here: classical-family technique |
| Arpeggios: common chords | UNCOVERED here: classical-family technique |
| Broken chords: seventh chords (G4-5) | ST-043 |
| Pattern page: ninth arpeggios | ST-044 |
| Quick study (sight or ear, then improvise) | ST-160, ST-140 (ear option) |
| Aural A1 pulse; G4-5 state time and groove | ST-146, ST-148 |
| Aural A2 clap on a set beat | ST-146 |
| Aural A3 clap the rhythm | ST-147 |
| Aural B echo singing (G1-3) | ST-149 |
| Aural C / B1 improvised answering phrases | ST-162 |
| Aural B2 sing and identify intervals (G4-5) | UNCOVERED here: theory-ear interval skill, classical family (the completeness audit's interval rows) |
| Assessment criteria pp. 47-51 | not in the PDF read; the regulations' summary ("inventive and stylish improvisation") is cited under ST-004 |

### 2.2 ABRSM Jazz Piano Performance Grades from 2026 [ABRSM-JPG]

| component | covering ids |
| --- | --- |
| Four tunes in one continuous performance; performance as a whole | ST-008 |
| Programme times | UNCOVERED: a length limit, not an ability |
| Piece structures G6-8 (head, solo, return of head) | ST-002, ST-004 |
| Accompaniment G6-8: minus-one tracks, live rhythm section | ST-130 |
| Interpreting the score G6-8 Lists A, B (lead sheet) | ST-031, ST-003, ST-004, ST-029 |
| Interpreting the score List C (expand given material) | ST-003, ST-011 |
| Performing from memory (optional) | ST-009 |
| Pedalling, hand stretch, page-turns | UNCOVERED: general performance conditions, classical family |
| Repeats (G1-5 include solo sections) | ST-004 |

### 2.3 Trinity Rock & Pop Keyboards, graded exams from 2018 [TCL]

| component | covering ids |
| --- | --- |
| Songs 1-2 (songbook) | ST-063, ST-066 (graded features); the songs' notated skills are classical-family reading |
| Song 3 technical focus (per grade, e.g. swing rhythm G1; arpeggiated chords G2; legato fifths, tremolo G4, from the grade pages) | ST-001, ST-063; the rest (staccato, octave leaps, tremolo, chromatic scale) UNCOVERED here: classical-family technique |
| Own-choice song: original song | ST-164 |
| Own-choice song: arranged cover | ST-069 |
| Own-choice song: formats (lead sheet, chord chart, full score) | ST-165, ST-061, ST-062 |
| Own-choice song: backing track or live accompaniment | ST-130 |
| Own-choice parameters by grade: improvisation row (G4-8) | ST-065 |
| Own-choice parameters: part writing (repeated RH patterns; blues-scale chromaticism) | ST-063, ST-042 |
| Session skills: playback | ST-140 |
| Session skills: improvising (styles, chords, solo breaks by grade) | ST-064, ST-060, ST-066, ST-065, ST-071, ST-082 |
| Learning outcome 4.2 (improvise with melodic development) | ST-163 |
| Sight reading / study piece (learning outcome 4.1) | UNCOVERED here: classical-family reading |
| Digital assessment: performance mark | ST-008 (nearest; Trinity marks each song, not a programme) |

### 2.4 RSL (Rockschool) Keys, band-based, Debut-Grade 5, 2009-2012 [RSL-K] and the current keys page [RSL-WEB]

| component | covering ids |
| --- | --- |
| Performance pieces (with CD backing) | ST-130 |
| Technical exercises Group A scales | ST-040, ST-041, ST-042 |
| Group B chords (I-IV, I-V, i-iv-v, nearest inversions) | ST-047 |
| Group C riff (Debut-G2), Group D riff (G4-5) | ST-067 |
| Group C chord voicings: dominant 7ths (G3), minor 7ths (G4), major 7ths (G5) | ST-043 |
| Sight reading | UNCOVERED here: classical-family reading |
| Sight reading G4-5: improvised two-bar ending | ST-160 |
| Improvisation & Interpretation (4-12 bars over CD; comping chords G2) | ST-064, ST-029 |
| Ear test: rhythm recall (Debut) | ST-147 |
| Ear test: melodic recall | ST-140 |
| Ear test: bassline recall (G2, G5) | ST-141 |
| Ear test: chord and rhythm recall | ST-142 |
| General Musicianship Questions | ST-167 |
| Current page [RSL-WEB]: chord voicings from memory; improvisation on a 4-6 bar chord progression; chord-quality ear test; Quick Study Pieces G6-8 | ST-043, ST-064, ST-143, ST-061 (the current 2019 syllabus PDF itself was not accessible) |

### 2.5 RSL Popular Piano syllabus guide (undated; text cites 2014) [RSL-P]

| component | covering ids |
| --- | --- |
| Performance pieces; free choice (self-composed or popular repertoire) | ST-164, ST-068 |
| Performance Certificate (five pieces) | ST-008 (nearest) |
| Technical exercises: scales, modes, pentatonic, blues, chromatic, diminished, whole-tone | ST-040, ST-041, ST-042, ST-045; major and minor UNCOVERED here (classical family) |
| Technical exercises: arpeggios incl. dominant 7th, minor 7th, diminished 7th, augmented | ST-043, ST-045 |
| Sight reading | UNCOVERED here: classical-family reading |
| Improvisation & Interpretation G1-5 | ST-064 |
| Quick Study Piece G6, G8 (lead sheet or session chart) | ST-061, ST-065 |
| Ear test 1: playback | ST-140 |
| Ear test 2: clap back (G1); major or minor (G2); chord sequences (G3-8) | ST-147, ST-143 |
| General Musicianship Questions | ST-167 |

### 2.6 LCM (LCME) Jazz Piano, syllabus and repertoire list 2016 [LCM-S], [LCM-R]

| component | covering ids |
| --- | --- |
| Step 1-2 chords (right hand, from memory) | ST-046 |
| Step 1-2 performance (John Thompson blues and boogie) | ST-050, ST-001 |
| Technical work: major and minor scales, arpeggios | UNCOVERED here: classical-family technique |
| Technical work: pentatonic, blues, modes, chromatic | ST-041, ST-042, ST-040 |
| Technical work: dominant 7th broken chords resolving (G4-5) | ST-043 |
| Technical work: augmented and diminished arpeggios (G6) | ST-045 |
| Technical work: block chords (G7) | ST-027 |
| Technical work: sus chord voicing; whole-tone; diminished scales (G8) | ST-024, ST-045 |
| Technical work: mode exercise from major scales (G6) | ST-040 |
| Technical work Option 2: studies (incl. *Stridin' and Behavin'*, *Latin Sundae*, *Plus Nine Blues*) | ST-093, ST-102 (nearest), ST-022 |
| Exercise (Jazz Piano Handbook 1) | UNCOVERED: the handbook was not read, so the exercise's content is unknown |
| Performance G1-5 (accuracy and feel; embellishment, fills, turnarounds) | ST-001, ST-003, ST-053 |
| Performance G6-8 (head and two choruses; backing optional) | ST-004, ST-130 |
| Iconic vamp option (G8) | ST-013 |
| Free choice memory option | ST-009, ST-014 |
| Own composition pieces (G6 blues, G7 II-V-I, G8 Rhythm Changes) | ST-164 |
| Duet piece (G1) | ST-132 |
| Musical awareness G1-8 | ST-167, ST-020 (G7 II-V-I), ST-025 (G8) |
| Creative response test G1-8 | ST-160, ST-012 |
| Aural G1 down beat / back beat; pitch | ST-148; pitch items UNCOVERED here (classical-family intervals) |
| Aural G2-4 swing, syncopation, rock rhythms: identify, clap, improvise | ST-147, ST-162 |
| Aural G5 Latin patterns (tap two hands; identify note values) | ST-106 |
| Aural G5-7 intervals and cadences | UNCOVERED here: classical-family theory-ear |
| Aural G6 modes, blues-scale intervals | ST-144 |
| Aural G7 II7 versus V7; chord types | ST-144 |
| Aural G8 tritone sub or sus; modes; form, key, modulation | ST-144, ST-150 |
| Recital grades, Leisure Play, Performance Awards | UNCOVERED: exam formats reusing the components above |

### 2.7 RCM Piano Syllabus 2022 [RCM] (style components only; the rest is the completeness audit's)

| component | covering ids |
| --- | --- |
| Musicianship: playback (traditional or improvised answer phrase), Levels 5-10 | ST-140, ST-161 |
| Sight reading: playing (traditional or lead sheet reading), Levels 5-10 | ST-061 |
| Popular Selection List substitution for an étude | ST-068 (nearest); otherwise a repertoire rule, not an ability |

### 2.8 Mark Levine, *The Jazz Piano Book* (Sher Music, 1989), table of contents [LEV]

| chapter | covering ids |
| --- | --- |
| 1 Intervals and Triads (review) | UNCOVERED here: classical-family theory (intervals, triads) |
| 2 The Major Modes and II-V-I | ST-020, ST-040 |
| 3 Three-Note Voicings | ST-020 |
| 4 Sus and Phrygian Chords | ST-024 |
| 5 Adding Notes to Three-Note Voicings | ST-022 |
| 6 Tritone Substitution | ST-025 |
| 7 Left-Hand Voicings | ST-023 |
| 8 Altering Notes in Left-Hand Voicings | ST-022, ST-023 |
| 9 Scale Theory (major, melodic minor, diminished, whole-tone harmony) | ST-006, ST-045 |
| 10 Putting Scales To Work | ST-006 |
| 11 Practicing Scales | ST-040 |
| 12 So What Chords | ST-026 |
| 13 Fourth Chords | ST-026 |
| 14 Upper Structures | ST-026 |
| 15 Pentatonic Scales | ST-007, ST-041 |
| 16 Voicings, Voicings, Voicings | ST-026 |
| 17 Stride and Bud Powell Voicings | ST-093, ST-028 |
| 18 Four-Note Scales | UNCOVERED: chapter title only; what the learner does was not read |
| 19 Block Chords | ST-027 |
| 20 Salsa and Latin Jazz | ST-102, ST-105 |
| 21 'Comping | ST-029 |
| 22 Loose Ends | UNCOVERED: miscellany, contents not read |
| 23 Practice, Practice, Practice | UNCOVERED here: practice-track method, not a style ability |

### 2.9 Tim Richards (Schott) [RIB], [REJ]

| chapter or listed topic | covering ids |
| --- | --- |
| *Improvising Blues Piano* ch 1 Triads | ST-055 |
| ch 2 Sixth chords | ST-055 |
| ch 3 Seventh chords | ST-050, ST-055 |
| ch 4 Ninth and thirteenth chords | ST-022, ST-055 |
| ch 5 Minor and diminished chords | ST-054 |
| left-hand patterns and bass lines; co-ordination; licks and riffs | ST-051, ST-052 |
| *Exploring Jazz Piano 1* (chapters 1-5; topics only read): chord types | ST-043, ST-055 |
| chord/scale relationships, modes; horizontal and vertical improvisation | ST-006 |
| pentatonic and blues scales | ST-007 |
| walking bass lines | ST-030 |
| Latin rhythms and bass lines | ST-105 (nearest) |
| diatonic cycle, secondary dominants, II V I | ST-020 |
| tritone substitution | ST-025 |
| two-handed and rootless voicings | ST-026, ST-023 |
| accompaniment styles | ST-029 |
| ear-training | ST-140 (nearest) |
| *Exploring Jazz Piano 2* | not read (see §3) |

### 2.10 Rebeca Mauleón, *Salsa Guidebook for Piano and Ensemble* (Sher Music), table of contents [MAU]

| chapter or section | covering ids |
| --- | --- |
| I A Brief Survey of Salsa | UNCOVERED: history, no learner action |
| II Salsa Instruments and Ensembles | UNCOVERED: ensemble knowledge, no keyboard action |
| III The Clave (pulse; 6/8, son, rumba clave; phrasing; variations; Brazilian clave) | ST-100, ST-101 |
| IV Instrument Patterns and Clave: percussion and drumset | UNCOVERED: other instruments' parts |
| IV Bass | ST-103 |
| IV Piano | ST-102 |
| IV Horn section; The Melody and Clave | ST-101 |
| V Rhythms of salsa; common Cuban and non-Cuban styles; score samples | ST-104, ST-110 |
| V Song Form and Structures | UNCOVERED: the section's content was not read beyond its title; a likely candidate for a form ability (montuno section, mambo) |
| V A Note on Arranging | UNCOVERED: content not read |

### 2.11 Hal Leonard Keyboard Style Series (descriptions only) [HL-…]

| book | covering ids |
| --- | --- |
| Harrison, *Blues Piano*: scales and chords; left-hand patterns, walking bass; endings and turnarounds; right-hand techniques; soloing with blues scales; crossover licks | ST-050, ST-051, ST-030, ST-053, ST-052, ST-007 |
| Lowry, *Boogie-Woogie Piano* | ST-051, ST-052 |
| Valerio, *Stride & Swing Piano* | ST-092, ST-093, ST-057, ST-056 |
| Martignon, *Salsa Piano* | ST-102, ST-104 |
| Willey and Cardim, *Brazilian Piano* | ST-105, ST-107 |
| Valerio, *Latin Jazz Piano* | ST-109, ST-102, ST-105 |
| Miller, *Rock Keyboard* | ST-080 |
| Harrison, *Modern Pop Keyboard* | ST-063, ST-029 |
| Cowling, *Gospel Piano* | ST-125, ST-126 |
| Deutsch, *Piano for Singers* (learn to accompany yourself and others) | ST-127 |
| The other fourteen titles in the series (worship, intro to jazz, contemporary jazz, country, jazz-blues, beginning rock, R&B, smooth jazz, bebop, progressive rock, rock'n'roll, West Coast jazz, jazz-rock, post-bop) | not read; listed so the gap is visible |

### 2.12 Berklee [BK-…], [ILPN…]

| course and week | covering ids |
| --- | --- |
| Online Jazz Piano wk 1 history | UNCOVERED: history |
| wk 2 label progressions, interpret melodies | ST-010 |
| wk 3 swing blues | ST-050 |
| wk 4 tensions | ST-022 |
| wk 5 essential voicings, practice techniques | ST-020, ST-023 |
| wk 6 bass lines | ST-030 |
| wk 7 bossa nova | ST-105 |
| wk 8 minor key | ST-021 |
| wk 9 mastering repertoire | ST-010, ST-009 |
| wk 10 approach notes | ST-005 |
| wk 11 arranging for solo piano | ST-011 |
| wk 12 intros and endings | ST-011 |
| Online Blues and Rock Keyboard Techniques wk 1 vocabulary exercises | ST-052 |
| wk 2 Mixolydian theory | ST-040 |
| wk 3 comping | ST-029 |
| wk 4 blues technique; wk 5 phrasing and vocabulary | ST-051, ST-052 |
| wk 6 rock and roll; wk 7 New Orleans | ST-057 |
| wk 8 modern rock | ST-080 |
| wk 9 solo blues piano | ST-056 |
| wk 10-11 reviews; wk 12 performance with tracks | ST-130 |
| course outcomes (adapt for solo piano and band; original parts) | ST-081, ST-166 |
| Online Pop/Rock Keyboard wk 1-3 triads, eighth-note comping, arpeggiated parts | ST-047, ST-063 |
| wk 4 dominant 7th and blues licks | ST-052 |
| wk 5 new chords and styles; wk 7 funk, R&B; wk 8 country; wk 10 ballads | ST-060, ST-066 |
| wk 6 gospel influences | ST-125, ST-126 |
| wk 9 improvisation | ST-064 |
| wk 11 the art of the jam | ST-131, ST-130 |
| wk 12 performances | ST-008 (nearest) |
| course outcomes (voicings, rhythms, registers; lead sheets) | ST-070, ST-061 |
| Online Latin Piano Styles wk 1-4 clave and Cuban styles | ST-100, ST-104 |
| wk 5 maxixe, choro | ST-107 |
| wk 6 samba, bossa nova | ST-105 |
| wk 7 baião, afoxê, frevo, maracatu | ST-110 (breadth; these styles named, not read) |
| wk 8 6/8 and 3/4 Peruvian, Argentine | ST-110 |
| wk 9-10 Río de la Plata; tango | ST-108 |
| wk 11 Colombian, Venezuelan | ST-110 |
| wk 12 synthesis | ST-166 |
| Online Intermediate Keyboard wk 1-5, 7, 10, 12 (technique, crossing hands, sevenths, ballads, pop, blues) | ST-043, ST-063, ST-050; the technique weeks UNCOVERED here (classical family) |
| wk 6 bossa and boogie-woogie | ST-105, ST-051 |
| wk 8 shuffle, jump, swing | ST-001, ST-051 |
| wk 9 switching roles | ST-131 |
| wk 11 ragtime and stride | ST-093 |
| College ILPN-227 accompaniment for the singer/pianist | ST-127, ST-128 |
| College ILPN-246 Latin montunos lab | ST-102 |

### 2.13 Other sources

| source and part | covering ids |
| --- | --- |
| Joplin, *School of Ragtime* (1908): Remarks | ST-090 |
| Exercise 1 (ties, slow, never fast) | ST-090 |
| Exercise 2 (left hand, no vamping; full note lengths) | ST-092, ST-090 |
| Exercise 3 (dotted lines guide the rendering) | ST-090 |
| Exercise 4 (a syncopation only when tied notes share a degree) | ST-091 |
| Exercise 5 (eighth note in place of tied sixteenths) | ST-091 |
| Exercise 6 (careless or too-fast playing destroys the effect) | ST-090 |
| Link and Wendland, tango article (marcato, síncopa, 3-3-2, arrastre, yumba) | ST-108 |
| *Keyboard Course* section 4: three-part hymns | ST-120 |
| section 4: using the hymnbook; four-part hymns | ST-121 |
| glossary: Introduction | ST-122 |
| sections 1-3 (notes, rhythm, key signature, daily exercises) | UNCOVERED here: core-track reading, classical family |
| organ chapters | UNCOVERED: organ registration and pedals, outside the app |
| BYU Music 465A Organ Practicum outcomes: hymn playing, choir accompaniment, keyboard skills | ST-121, ST-123, ST-124, ST-072; figured bass UNCOVERED (classical family) |
| RSCM Church Music Skills (search-result description only) | ST-123 |
| PianoGroove: walk-ups; passing chords to hymns | ST-125 |
| Mackworth-Young, *Piano by Ear* (review) | ST-145, ST-007 |

## 3. Sources

### 3.1 Read

PDF sources, converted with `pdftotext` and read in the converted text:

- [ABRSM-JP]: ABRSM Jazz Piano syllabus Grades 1-5 (regulations, tunes, scales, quick study, aural, patterns pages): https://www.abrsm.org/sites/default/files/2023-12/jazz-piano-syllabus-grades-1-5.pdf
- [ABRSM-JPG]: ABRSM Jazz Piano Performance Grades Syllabus from 2026 (Grades 1-8): https://www.abrsm.org/sites/default/files/2025-09/Jazz%20Piano%20Performance%20Grades%20Syllabus%20from%202026.pdf
- [TCL]: Trinity College London, Rock & Pop Keyboards syllabus, graded exams from 2018: https://trinitycollege.com/resource?id=7900 ; grade pages read through the fetch tool: https://www.trinityrock.com/instruments/keyboards/grade4 (G1 and G2 skill lists from the search-result text)
- [RSL-K]: RSL (Rockschool) Band Based Keyboards syllabus guide, Debut-Grade 5, 2009-2012: https://cloud.rslawards.com/file/download/rockschoolbandbasedkeyssyllabus.pdf
- [RSL-P]: RSL Popular Piano and Electronic Keyboards syllabus guide (undated in the text read; cites 2014): https://cloud.rslawards.com/file/download/rockschoolpianosyllabus.pdf
- [LCM-S]: LCME Jazz Grades Syllabus 2016: https://lcme.uwl.ac.uk/media/l2ikj2zw/jazz-grades-syllabus-2016.pdf
- [LCM-R]: LCME Jazz Piano Grades repertoire list 2016 (technical work, creative response, musical awareness, aural tests by grade): https://lcme.uwl.ac.uk/media/n2zfptnc/jazz-piano-rep-list-2016.pdf
- [RCM]: RCM Piano Syllabus 2022 Edition (searched for lead sheet, improvise, playback, popular selection): https://rcmusic-kentico-cdn.s3.amazonaws.com/rcm/media/main/about%20us/rcm%20publishing/piano-syllabus-2022-edition.pdf
- [LEV]: Mark Levine, *The Jazz Piano Book*, table of contents and sample pages: https://www.jazzbooks.com/mm5/samples/D-JP.pdf
- [MAU]: Rebeca Mauleón, *Salsa Guidebook*, table of contents: https://cdn.shopify.com/s/files/1/0684/9524/5503/files/The_Salsa_Guidebook_-_Table_of_Contents.pdf?v=1781833857
- [JOP]: Scott Joplin, *School of Ragtime* (1908), text pages: https://archive.org/download/imslp-of-ragtime-joplin-scott/Joplin_-_School_of_Ragtime_text.pdf
- [LW]: Kacey Link and Kristin Wendland, report on Argentine tango instrumental music, *Diagonal* (UC Riverside), 2013: https://cilam.ucr.edu/diagonal/issues/2013/LinkandWendland.pdf
- [LDS]: The Church of Jesus Christ of Latter-day Saints, *Basic Music Course: Keyboard Course* (section 4 and glossary read): https://www.churchofjesuschrist.org/bc/content/shared/english/pdf/callings/music/KeyboardCourse_33620_eng.pdf

HTML pages read through the fetch tool (quotes as the tool returned them; unverified as verbatim):

- [ABRSM-WEB]: https://www.abrsm.org/en-gb/instruments/jazz/jazz-piano (search-result text only)
- [RSL-WEB]: https://www.rslawards.com/learn-keyboard/
- [SHER]: Sher Music page for the *Salsa Guidebook*: https://www.shermusic.com/0961470194.php
- [RIB]: Schott, Tim Richards, *Improvising Blues Piano*: https://www.schott-music.com/en/improvising-blues-piano-no445670.html
- [REJ]: Schott, Tim Richards, *Exploring Jazz Piano 1*: https://www.schott-music.com/en/exploring-jazz-piano-1-no443188.html
- [HL-BLUES]: https://www.halleonard.com/product-family/PC463/blues-piano
- [HL-BW]: https://www.halleonard.com/product-family/PC8603/boogie-woogie-piano
- [HL-STRIDE]: https://www.halleonard.com/product-family/PC1554/stride-swing-piano
- [HL-SALSA]: https://www.halleonard.com/product/311049/salsa-piano-the-complete-guide-with-online-audio
- [HL-BRAZ]: https://www.halleonard.com/product/311469/brazilian-piano-choro-samba-and-bossa-nova
- [HL-LJ]: https://www.halleonard.com/product/311345/latin-jazz-piano-the-complete-guide-with-online-audio
- [HL-ROCK]: https://www.halleonard.com/product-family/PC1553/rock-keyboard-the-complete-guide-with-online-audio
- [HL-POP]: https://www.halleonard.com/product/146596/modern-pop-keyboard-the-complete-guide-with-audio
- [HL-GOSPEL]: https://www.halleonard.com/product/311327/gospel-piano
- [HL-SING]: https://www.halleonard.com/product/311771/piano-for-singers
- [HL-SERIES]: series list: https://www.halleonard.com/menu/1003/keyboard-style-series?seriesfeature=HLKSS
- [BK-JAZZ]: https://online.berklee.edu/courses/jazz-piano
- [BK-BR]: https://online.berklee.edu/courses/blues-and-rock-keyboard-techniques
- [BK-POP]: https://online.berklee.edu/courses/pop-rock-keyboard
- [BK-LAT]: https://online.berklee.edu/courses/latin-piano-styles
- [BK-INT]: https://online.berklee.edu/courses/intermediate-keyboard
- [ILPN227]: https://college.berklee.edu/courses/ilpn-227
- [ILPN246]: https://college.berklee.edu/courses/ilpn-246
- [BYU]: https://catalog.byu.edu/courses/13677-000
- [PG-WALK]: https://www.pianogroove.com/blues-piano-lessons/gospel-walk-ups/
- [PG-HYMN]: https://www.pianogroove.com/blues-piano-lessons/adding-passing-chords-to-hymns/
- [PBE]: review of Lucinda Mackworth-Young, *Piano by Ear* (Faber): https://pianodao.com/2015/09/01/lucinda-mackworth-young-piano-by-ear/
- [RSCM]: https://www.rscm.org.uk/learn-with-us/rscm-church-music-skills/ (search-result text only)
- [IMSLP-JOP]: https://imslp.org/wiki/School_of_Ragtime_(Joplin,_Scott) (date check)

### 3.2 Not accessible, or not read

- RSL Keys syllabus specification 2019 (the current one): https://rockschool.ameb.edu.au/wp-content/uploads/2019/02/RSL_Keys_Syllabus_Guide_2019_SFS_20Feb2019.pdf returned HTTP 403. The 2009-2012 band-based guide and the current keys page were read instead; the grades 6-8 Keys content is known only from the page summary.
- RSL Keys sample pack: https://www.rockschoolbc.com/wp-content/uploads/2024/04/RSLKeysSamplePack.pdf exceeded the fetch tool's 10 MB limit.
- ABRSM Jazz Piano Practical Grades assessment criteria (pp. 47-51 of the regulations): not in the PDF fetched.
- ABRSM *Jazz Piano Pieces* introductions (how to embellish), *Jazz Piano Scales*, quick-study and aural books: not online; not read.
- LCME *Jazz Piano Handbook* 1 and 2 (the exercises, Latin rhythm patterns, II-V-I sequences they refer to): not online; not read.
- LCME popular piano: no LCME popular-piano syllabus PDF was found; a search-result summary said grades 4-7 include accompanying an unseen melody, which was not verified and is not used.
- Tim Richards' own contents page (http://www.timrichards.ndo.co.uk/exploringjazzpiano.html): certificate error. *Exploring Jazz Piano 2* not read.
- Blake Neely, *How to Play from a Fake Book* (Hal Leonard): the chapter list was seen only in a search engine's summary of a Scribd copy; the publisher-side page read (https://www.ejazzlines.com/how-to-play-from-a-fake-book-blake-neely) gives no contents. Not used as a source.
- Link and Wendland's book *Tracing Tangueros* (OUP, 2016), the chapter on arranging and performance techniques: https://academic.oup.com/book/2271/chapter/142382572 showed navigation only.
- Library of Congress record for *School of Ragtime*: https://www.loc.gov/item/2023864271/ returned HTTP 403 (the text was read from the archive.org copy).
- The Church of Jesus Christ *Accompanying Others* page: https://www.churchofjesuschrist.org/music/accompanying-others?lang=eng is a link hub; the guidelines it links were not read.
- Hal Leonard book interiors (tables of contents): not on the product pages; only descriptions read. Fourteen series titles not read at all (see §2.11).
- The RCM's own contemporary or jazz offering: none found beyond the Popular Selection List and the lead-sheet and improvisation options in the piano syllabus.
- No published source was found for playing with a guitarist in guitar keys; it is therefore not an ability row (an ability row needs a source) and is recorded against A4.2 in §4.

## 4. Against the existing 28 abilities

Mapping of ABILITY-MAP's style abilities (A3-A10) to the rows above, and what the sources read do or do not support. The A1, A2, A7f and A9 blocks are mostly outside the style family; A2.1 is listed because ST-072 touches it.

| existing id | supported by | what the sources read do not support |
| --- | --- | --- |
| A2.1 transpose | ST-072 (BYU outcome only) | no graded style syllabus read sets transposition; the support here is one organ course's outcome line |
| A3.1 learn a song by ear | ST-140, ST-141, ST-142, ST-145 | learning from a recording specifically: the sources play back examiner or track material, or known songs (Mackworth-Young) |
| A4.1 one-pass performance, recovery | ST-008, ST-009 (performance programme, memory) | recovery at a landmark, cold runs, record-and-listen: none of the style sources read (practice-family sources may) |
| A4.2 ensemble form | ST-130, ST-131, ST-132, ST-013 | re-entry after getting lost; playing in guitar keys with a guitarist (no source found); trading fours; count-in at three tempos |
| A5.1 find taught harmony in pieces | ST-010, ST-143, ST-167 | finding a cadence in a minuet or hymn is classical and theory-ear family; not in the style sources |
| A6.1 harmonise your own melody | ST-124 (a hymn tune, organ course) | harmonising one's own melody specifically |
| A6.2 write down and keep what you made | ST-164, ST-165 | recording takes and advice on keeping them |
| A7a.1 RH improvisation over own LH groove | ST-051, ST-052, ST-007, ST-042, ST-056 | supported |
| A7a.2 begin, turn around, end a blues | ST-053, ST-011 | the specific claim that I7-IV7-I7-V7 is the plainest turnaround |
| A7a.3 minor blues, quick IV | ST-054 (partial) | the quick-IV change: no source read names it |
| A7b.1 minor ii-V-i with shells | ST-021 (weak) | the sources read name the major II-V-I (Levine, LCM) and minor-key playing (Berklee week 8) but not the minor ii-V-i with shells; weakly supported |
| A7b.2 solo over changes | ST-004, ST-005, ST-006 | supported |
| A7c.1 habanera and tresillo | ST-108 (3-3-2 only) | the habanera cell is not named in any source read |
| A7c.2 tumbao and montuno over clave | ST-100-ST-103 | the patterns themselves are not printed in what was read |
| A7c.3 bossa accompaniment | ST-105, ST-106 | the bossa left-hand pattern itself is not printed in what was read |
| A7c.4 modern tango | ST-108 (partial) | tango nuevo's accented ostinato: Link and Wendland describe the traditional orquesta rhythms |
| A7d.1 oom-pah under syncopation | ST-090, ST-091, ST-092, ST-093 | supported |
| A7e.1 reduce a band texture | ST-081, ST-069 | writing down what was left out and why |
| A7g.1 accompany a singer | ST-122, ST-123, ST-127 | choosing a key for the singer is not stated in what was read |
| A7g.2 decorate a hymn | ST-125 | the plagal close is not named in what was read |
| A8.1 pulse and rhythm | ST-146, ST-147, ST-148 | supported (ABRSM Jazz aural) |
| A10.1 one standard through every role | ST-002-ST-004, ST-009-ST-011, ST-029-ST-031 | supported |
| A10.2 arrange a full song | ST-069, ST-068, ST-011 | arranging from a recording |

Style abilities in this draft with no existing id (gaps in the 28; 45 rows, listed by script from the last column): ST-001, ST-012, ST-014, ST-020, ST-022, ST-023, ST-024, ST-025, ST-026, ST-027, ST-028, ST-043, ST-044, ST-045, ST-046, ST-047, ST-055, ST-057, ST-060, ST-061, ST-062, ST-063, ST-065, ST-066, ST-067, ST-070, ST-071, ST-080, ST-082, ST-104, ST-107, ST-109, ST-110, ST-120, ST-121, ST-126, ST-128, ST-144, ST-149, ST-150, ST-160, ST-161, ST-162, ST-163, ST-166. Most of the chords-pop track's core (reading chord symbols, realising a lead sheet, pop accompaniment textures, improvising over a chart) has no ability among the 28.

## 5. A correction for the completeness audit

`docs/classifier/audits/iter1/completeness.md` row "Read a lead sheet and realise an accompaniment (Level 8 option) [RCM p.71]": in the RCM 2022 PDF the same option appears at Levels 5, 6, 7, 8, 9 and 10 (six occurrences of "read a lead sheet", measured by text search of the converted PDF), with the harmonic vocabulary tied to each level's theory syllabus. The improvised-answer-phrase option likewise appears at Levels 5-8 and 10 (parallel period at 5-6, contrasting from 7). The audit's "Level 8" is one instance, not the start.

## 6. Counts

Measured by a script over this file (`build/count.py` and `build/fix.py` in the worktree, not committed).

- Ability rows: 104 (ids ST-001 to ST-167, not contiguous; each section starts at a multiple of ten). By section: jazz feel and form 14; jazz voicings and comping 12; style technique 8; blues and boogie 8; popular and chord-symbol 13; rock 3; ragtime and stride 4; Latin 11; hymns, gospel, singers 9; playing with others 3; ear and aural 11; improvisation and composition 8.
- Every row has at least one source. Rows whose source column rests only on fetch-tool (unverified-verbatim) quotes: 24 (ST-010, ST-011, ST-021, ST-030, ST-051, ST-052, ST-055, ST-056, ST-057, ST-070, ST-072, ST-080, ST-081, ST-105, ST-107, ST-109, ST-124, ST-125, ST-126, ST-127, ST-128, ST-131, ST-145, ST-166).
- Rows mapped to an existing ability (full, partial or weak): 59; rows with no existing ability: 45.
- Existing abilities checked in §4: 23 (A2.1 and A3-A10's style blocks); supported with no reservation: 5 (A7a.1, A7b.2, A7d.1, A8.1, A10.1); weakly supported: 2 (A2.1, A7b.1); supported with named unsupported elements: 16.
- Coverage lines (§2): 220, of which 30 are UNCOVERED with a reason; every ability id appears in at least one coverage line.
- Sources read: 13 PDFs and 29 HTML pages (§3.1). Not accessible or not read: 14 items (§3.2).
