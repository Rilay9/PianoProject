# Readable-score review: early branches and technique/classical addendum

Research/review only. No production placement changes are made here.

Authority: `claude/readable-scores@c1556d70`, using byte-for-byte extracted shipped MusicXML and the accompanying score dumps.

This pass fills two gaps left by the core/genre/advanced notes:
1. early style branches in Stages 3–4, where bad placement matters early;
2. technique/classical tracks, to check that the previous genre problems are not being projected onto everything.

The reassuring result is that several technique/classical/hymn areas are genuinely well grounded. The problem is concentrated in specific branch claims, especially where genre titles were allowed to stand in for written technique.

---

# Stage 4 early branches

## `jazz.4` — swung eighths and comping on plain triads

Direct reads of **all three current song options**:

- `Avalon (1920)`: 33 bars, **one staff**, 22 chord symbols, no written LH, `swungMark: false`.
- `Whispering (1920)`: 48 bars, **one staff**, 37 chord symbols, no written LH, `swungMark: false`.
- `Margie (1920)`: 48 bars, **one staff**, 50 chord symbols, no written LH, `swungMark: false`.

These are legitimate early-jazz standards/lead sheets. They are useful **TRANSFER** once the learner has been taught how to swing and how to supply triad comping.

But the shipped scores themselves demonstrate neither half of the rung title:
- no explicit swing mark in any of the three dumps;
- no written LH/comping texture in any of the three.

**Disposition:** keep as lead-sheet transfer. Add one short written swing + plain-triad comping primary, or make the lesson explicitly generate/supply the comping and swing while the lead sheet is the application test.

---

## `blues.4` — twelve-bar form and the shuffle

### `12 Bar Blues`
Direct read: despite the title, the shipped file has **11 measures**, one staff, no chord symbols and no swing mark. The notes trace repeating blues-like cells, but the file is not a trustworthy literal definition of a 12-bar blues form.

**Verdict: FIX/REPLACE as primary.** Do not let the title certify the form.

### `St. Louis Blues (1914)`
Direct read: 28 bars, one-staff lead sheet, 23 chord symbols, explicit score text `loose Swing Blues` and `Gritty New orleans dirge, heavy triplet feel`, `swungMark: true`. This is real blues repertoire and useful for swing/feel transfer, but it is a multi-section song, not a clean twelve-bar teaching diagram.

**Verdict: KEEP — TRANSFER.** Good historical blues/swing material, not the first 12-bar-form proof.

### `Hesitating Blues`
Direct read: 48 bars, one-staff lead sheet, 50 chord symbols, chromatic/diminished harmony, no swing mark in the normalized score. Again authentic repertoire, not a clean first 12-bar form.

**Verdict: KEEP — TRANSFER.**

**Rung conclusion:** the current song set contains authentic blues but no clean literal primary for the named 12-bar form. The simplest repair is a compact generated/authored 12-bar score with bar numbers and shuffle/swing indication, followed by the historical lead sheets as transfer.

---

## `rock.4` — the power chord and the figure that repeats

The only current song is `Greensleeves (with chords)`.

Direct read: 16 bars, A minor, two staves, chord symbols Am/G/E7; the LH writes full triads such as A–C–E, G–B–D and E–G#–D. Those voicings explicitly **contain thirds**.

That is the opposite of a power chord, whose defining sonority removes the third and uses root/fifth (often octave).

**Verdict: MOVE/REMOVE FROM CLAIM.** `Greensleeves (with chords)` is good 3.3/chordal material, but it provides **zero literal power-chord repertoire coverage**. This branch needs a real root–fifth/octave riff or an authored rock excerpt.

This is one of the clearest remaining placement defects because there is no ambiguity about the notes.

---

## `hymns.4` — four voices, two hands and the inner parts

### `Amazing Grace (four parts)`
Direct read: 19 bars, two staves, **four simultaneous written voices** (two RH voices and two LH voices) from the opening. The dump explicitly separates `RH:v1/v2` and `LH:v1/v2` and shows independent inner lines.

**Verdict: KEEP — PRIMARY.** This is exactly what the rung says it is.

This is a useful positive control: when the score really contains the claimed texture, the direct read makes that obvious immediately.

---

# Technique track

## `technique.4` — scales, arpeggios and the two ways to touch a key

Direct reads:

### Lemoine Op. 37 No. 1
16 bars, two staves, estimated level 4.96. The RH repeatedly runs descending stepwise eighth-note scales while the LH sustains chords. **Strong scale/legato transfer.**

### Lemoine Op. 37 No. 2
16 bars, two staves, estimated level 4.75. The relationship reverses: LH runs ascending eighth-note scales while RH sustains triadic shapes. **Strong opposite-hand scale/coordination transfer.**

### Lemoine Op. 37 No. 35
16 bars, two staves, 6/8, 111 fingerings and 121 articulation elements. The writing repeatedly attacks multi-note chord shapes in rhythmic patterns rather than merely running scales. **Useful touch/articulation/chord-control transfer.**

**Rung conclusion:** this set is defensible. The songs/études do not each need to demonstrate every subskill; together they provide distinct technique contexts. Keep generated drills as acquisition, use these as transfer.

---

## `technique.5` — repeated notes, two hands at different speeds, and a line that travels

Direct reads of all three Duvernoy études:

### Op. 176 No. 4
31 bars, two staves, estimated level 4.98. The opening puts continuous wide-ranging RH eighth-note broken patterns against LH half notes; from bar 9 the relationship flips and the LH carries the eighth-note motion under long RH values. **Excellent literal evidence for hands at different speeds and handing the moving line from one hand to the other.**

### Op. 176 No. 5
22 bars, two staves, estimated level 4.84. Continuous stepwise eighth figures travel across a broad register; slower sustained/chordal material sits in the other hand, then both hands become active. **Excellent travelling-line/differential-speed transfer.**

### Op. 176 No. 6
21 bars, two staves, estimated level 4.39. RH sings quarter/eighth melody while the LH repeatedly moves in eighth-note broken patterns; later both lines travel. **Strong independence/different-speed transfer.**

What the openings do **not** clearly supply is a focused same-note repeated-note technique. That physical skill should remain a dedicated drill unless a later passage is selected specifically for it.

**Rung conclusion:** healthy for independence/travelling line; do not pretend the three études equally cover repeated-note technique.

---

## `technique.6` — seventh shapes, rotating wrist and voicing

Direct reads:

### Czerny Op. 299 No. 1
22 bars, two staves, level ~6.06. Long continuous RH sixteenth-note scale runs over sustained LH chords; chord labels include C/F/G/G7/Dm/etc. This is primarily velocity/scale transfer.

### Czerny Op. 299 No. 3
24 bars, two staves, level ~6.03. Dense sixteenth-note arpeggiated triadic figures move rapidly through registers while the LH punctuates with notes/chords. Again primarily velocity/arpeggio transfer.

### Czerny Op. 299 No. 4
26 bars, two staves, 6/8, level ~6.0. RH chromatic-neighbour sixteenth cells run continuously over changing LH chord shapes; normalized harmony includes multiple dominant-seventh chords.

These are legitimate advanced technical studies, but **“rotating wrist” is a physical execution instruction, not a MusicXML property**, and the scores are not clean diagrams of seventh-hand shapes or voicing.

**Rung conclusion:** KEEP as transfer études. Teach wrist motion, seventh shapes and voicing explicitly in generated drills/lesson demonstration; do not expect the repertoire list to mechanically certify body motion.

---

## `technique.7` — two notes at once in one hand, octaves, and pedal that is not a switch

Direct reads:

### Czerny Op. 299 No. 5
52 bars, level ~7.37. Opens with long single-note RH sixteenth scales over punctuated LH notes/double notes. It later has multi-note shapes, but the opening is not a clean double-note/octave primer.

### Czerny Op. 299 No. 8
55 bars, level ~6.94. Again starts with continuous single-note sixteenth scale figures over LH chord punches.

### Czerny Op. 299 No. 10
30 bars, level ~6.29, 6/8. Continuous 32nd-note LH figuration; later RH passages include genuine octave/double-note writing (e.g. paired G4+G5 / G5+G6 shapes). **Useful double-note/octave transfer**, but far too dense as first acquisition.

Crucially, the raw-XML headers for all three report **pedal count 0**.

**Rung conclusion:** current études can support advanced double-note/octave transfer, especially No. 10, but they do not teach pedal notation or nuanced pedal change. The pedal half needs its own explicit lesson/drill and at least one score with actual pedal markings if reading pedal notation is claimed.

---

# Classical track sanity checks

## `classical.5` — sonatina form and Romantic miniatures

Representative direct reads confirm the set is basically honest:

### Clementi Op. 36 No. 1, first movement
38 bars, two staves, C major, 2/2, estimated level 5.68. Actual sonatina movement with contrasting themes/passages, scale work and accompaniment changes. **KEEP — PRIMARY for sonatina-form repertoire.**

### Burgmüller Arabesque Op. 100 No. 2
33 bars, two staves, A minor, estimated level 5.91, dynamics/articulations and characteristic fast sixteenth figures. **KEEP — PRIMARY/TRANSFER as a Romantic pedagogical miniature.**

### Schumann Op. 68 No. 16 `First Loss`
34 bars, two staves, E-minor context, estimated level 5.65, expressive markings including `Nicht schnell`, cresc., `Etwas langsamer`, `Im Tempo`. **KEEP — PRIMARY/TRANSFER for Romantic miniature/phrasing.**

No redesign indicated here. These are the sort of real pieces the classical branch should contain.

---

## `ragtime.6` — multi-strain form and the leaping left hand

### Joplin `School of Ragtime`
Direct read: 33 bars, two staves, 2/4, estimated level 6.4. Dense syncopated RH writing with the characteristic bass/chord support and many multi-note attacks. It is explicitly pedagogical Joplin material rather than a genre-title guess.

**Verdict: KEEP — PRIMARY/REFERENCE.** This is exactly the kind of source that should anchor named-ragtime technique before full rags such as `The Entertainer` become project/stretch material.

The remaining full Joplin rags can remain repertoire/project choices; they do not each need separate detector certification once file correctness is established.

---

# Consolidated new high-priority corrections

1. **`rock.4` is currently unsupported by its song.** `Greensleeves (with chords)` writes full thirds/triads, not power chords. Replace/cross-list a real root–fifth/octave riff.
2. **`jazz.4` has zero written comping examples.** All three are one-staff lead sheets and all three dumps say `swungMark: false`. Keep them as transfer, add a literal primary.
3. **`blues.4` needs a clean 12-bar primary.** The file titled `12 Bar Blues` has 11 measures. St. Louis/Hesitating are useful historical transfer but are not simple 12-bar diagrams.
4. **`technique.7` has zero pedal markings across its three Czerny files.** If the rung teaches pedal reading/use, that must come from explicit drill/score material rather than the current repertoire.
5. **Positive controls matter:** `Amazing Grace (four parts)`, the Lemoine/Duvernoy studies, Clementi/Burgmüller/Schumann, and Joplin `School of Ragtime` show that direct reading often validates the intended placement. Do not rebuild those areas merely because other branches are weak.

The broad pattern remains: fix the claims/options that fail direct score reading; leave the genuinely good repertoire alone.
