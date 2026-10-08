# Phase 1a draft: abilities from the RCM Piano Syllabus (2026-10-08)

**What this is.** The abilities a learner must *do* to meet the Royal Conservatory of Music Piano Syllabus, 2022 Edition, from Preparatory A to Level 10. It also covers the Keyboard Harmony examinations the syllabus names as optional corequisites at Levels 9 and 10. This is one source family's draft for FABLE.md §2, Phase 1a. It is not a placement, a rule or an implementation.

**How it was read (measured by reading the source).** The public syllabus PDF (132 pages) was text-extracted with PyMuPDF. The text drops the music glyphs (time signatures, note values, tempo notes), so every level's Technical Tests and Musicianship pages were also rendered as images and read: pp. 9, 14, 19–20, 25–26, 31–32, 38–39, 45–46, 53–54, 61–62, 70–71, 80–81, 91–92, and the technical examples on pp. 120–123. Time-signature cells were re-read at higher resolution on pp. 26, 32, 39, 46, 54, 62, 71, 81 and 92. Page numbers below are the printed page numbers, which equal the PDF page numbers in this file. The Keyboard Harmony and Theory chord-vocabulary pages come from the RCM Theory Syllabus, 2016 Edition (pp. 18, 21, 23, 25, 27, 29, 32–35).

**Labels.** *Syllabus* means the row restates what the cited page requires. *Reading* means I inferred the row from a list heading or from the titles in a list; the syllabus does not state that ability. Nothing here has been heard or played: every musical claim is *unverified as music*.

**Grain.** One row per item the syllabus grades separately: a technical-test line, an ear test, a sight-reading task, a repertoire list. Where one graded item changes in kind between levels, it is split; examples are hands separately vs together, root position vs inversions, and broken vs alternate-note. Where only parameters grow (keys, tempo, octaves, length), the row keeps one ability and section 2 gives the parameters per level.

Sources: [rcm] = RCM Piano Syllabus 2022 Edition PDF; [thy] = RCM Theory Syllabus 2016 Edition PDF; [pop] = RCM Popular Selection List 2025 Edition PDF. The full URLs are in section 3. "c.md:NN" = `docs/classifier/audits/iter1/completeness.md` line NN. Existing ability ids are the `#### A…` headings of `docs/prompts/runs/curriculum-review-2026-10-05/ABILITY-MAP.md`. "(partial)" means the existing ability overlaps but is not the same act.

## 1. Abilities

### 1a. Technical tests: scales

| draft id | ability (what the learner does) | level range (RCM) | component | source | existing ability | completeness.md row |
| --- | --- | --- | --- | --- | --- | --- |
| RC-001 | Play a major or minor pentascale (five-finger pattern) from the tonic up to the dominant and back, each hand alone, **legato**, and end on a solid root-position tonic triad | Prep A–Prep B | technical | [rcm] p.9: "tonic to dominant, ascending and descending" | A9.1 (partial) | c.md:39 |
| RC-002 | Play the same pentascale **staccato**, each hand alone | Prep A–Prep B | technical | [rcm] p.9: "Staccato Pentascales" | A9.1 (partial) | c.md:25 |
| RC-003 | Play a one-octave major or natural-minor scale, each hand alone, ascending and descending | Prep B | technical | [rcm] p.14: "One-octave Scales" | A9.1 (partial) | none |
| RC-004 | Play a contrary-motion scale hands together, both hands starting on the tonic (C major): 1 octave at Prep B, 2 octaves at Level 1 | Prep B–1 | technical | [rcm] p.14: "Contrary Motion Scale" | A9.1 (partial) | c.md:18 (cites ABRSM/Trinity; RCM confirms) |
| RC-005 | Play a two-octave major or minor scale, each hand alone | 1–2 | technical | [rcm] p.19: "Two-octave" (HS, 2 octaves) | A9.1 (partial) | c.md:21 |
| RC-006 | Play a two-octave scale hands together in similar motion. The distance between the hands is not stated on the pages read | 3–7 | technical | [rcm] p.31: "HT 2 octaves" | A9.1 (partial) | c.md:21; c.md:13 |
| RC-007 | Play a four-octave scale hands together | 8–10 | technical | [rcm] p.70: "Four-octave" | A9.1 (partial) | c.md:21 |
| RC-008 | Play the **natural** minor form of a scale | Prep B–1 | technical | [rcm] p.19: "A, E, D minor (natural and harmonic)" | A9.1 (partial) | c.md:22 |
| RC-009 | Play the **harmonic** minor form of a scale; the formula patterns and chord progressions also use it | 1–10 | technical | [rcm] p.19 (as RC-008); p.123: "based on the harmonic minor scale" | A9.1 (partial) | c.md:22 |
| RC-010 | Play the **melodic** minor form of a scale | 2–10 | technical | [rcm] p.25: "E, D, G minor (harmonic and melodic)" | A9.1 (partial) | c.md:22 |
| RC-011 | Play the RCM **formula pattern**: one continuous scale, hands together, that alternates similar and contrary motion. Section 2 describes the motion; 2 octaves at Levels 2–7, 4 octaves at Levels 8–9 | 2–9 | technical | [rcm] p.25: "Formula Pattern"; p.120: "Two-octave formula pattern" (notated example) | A9.1 (partial) | c.md:20 (corrected, section 1h) |
| RC-012 | Play a one-octave chromatic scale, each hand alone, from a named note | 1–4 | technical | [rcm] p.19: "Starting on C" (Chromatic row; HS, 1 octave) | A9.1 (partial) | c.md:23 |
| RC-013 | Play a chromatic scale hands together from named notes: 1 octave (L5), 2 octaves (L6–8), 4 octaves (L9). At L9 the start is any note from C to F | 5–9 | technical | [rcm] p.80: "starting on any note from C–F" | A9.1 (partial) | c.md:23 |
| RC-014 | Play a scale in octaves, hands together, 2 octaves, either solid staccato or broken legato; broken legato is the small-hands substitute | 9–10 | technical | [rcm] p.80: "solid/blocked staccato" / "broken legato" | A9.1 (partial) | c.md:27 |
| RC-015 | Play a chromatic scale in octaves, hands together, 2 octaves, starting on any note from F♯ to B | 10 | technical | [rcm] p.91: "Chromatic in Octaves" | A9.1 (partial) | c.md:27 |
| RC-016 | Play a four-octave scale hands together with the hands a **third** apart | 10 | technical | [rcm] p.91: "Separated by a 3rd" | A9.1 (partial) | c.md:16 |
| RC-017 | Play a four-octave scale hands together with the hands a **sixth** apart | 10 | technical | [rcm] p.91: "Separated by a 6th" | A9.1 (partial) | c.md:16 |

### 1b. Technical tests: chords and arpeggios

| draft id | ability | level range | component | source | existing ability | completeness.md row |
| --- | --- | --- | --- | --- | --- | --- |
| RC-018 | Play the triad sequence: the triad on each degree of C major, one octave up, each hand alone, first broken and then solid | Prep A | technical | [rcm] p.9: "Triad Sequence"; p.121 example | A9.1 (partial) | c.md:31 (corrected) |
| RC-019 | Play a **broken** tonic triad in root position and both inversions: each hand alone (1 octave Prep B–L2, 2 octaves L3), then hands together over 2 octaves (L4–6) | Prep B–6 | technical | [rcm] p.14: "1 octave (root position and inversions)" | A9.1 (partial) | c.md:31 |
| RC-020 | Play a **solid** tonic triad in root position and inversions: with rests at L1–4, without rests and hands together at L5–6 | 1–6 | technical | [rcm] p.121: "Solid/blocked triads with rests (Levels 1–4)" | A9.1 (partial) | c.md:31 |
| RC-021 | Close a chord pattern with the stated cadence progression in its key: I–V–I (L5–6), I–IV–V–I (L7), I–IV–V⁶₄–⁵₃–I (L8), I–vi–IV–V⁶₄–V⁸⁻⁷–I (L9–10). Minor keys use the harmonic minor | 5–10 | technical | [rcm] p.45: "ending with I–V–I progression"; p.123 examples | A9.1 (partial) | c.md:38 (corrected) |
| RC-022 | Play a **broken** tonic four-note chord (root doubled at the octave) in root position and inversions, hands together over 2 octaves | 7–9 | technical | [rcm] p.61: "Tonic Four-Note • broken only" | A9.1 (partial) | c.md:32 |
| RC-023 | Play a **solid** tonic four-note chord in root position and inversions, hands together | 9–10 | technical | [rcm] p.80: "solid/blocked" | A9.1 (partial) | c.md:32 |
| RC-024 | Play four-note chords in the **broken alternate-note pattern**. At L9 it is an option for tonic chords, the small-hands substitute for solid. At L10 it is required for tonic, dominant 7th and diminished 7th chords | 9–10 | technical | [rcm] p.80: "broken alternate-note pattern"; p.122 example | A9.1 (partial) | c.md:32 (corrected) |
| RC-025 | Play a **broken** dominant 7th chord of a major key in root position and inversions: each hand alone (1 octave L5, 2 octaves L6), then hands together over 2 octaves (L7–9) | 5–9 | technical | [rcm] p.45: "Dominant 7th Chords"; p.121 example | A9.1 (partial) | c.md:33 |
| RC-026 | Play a **solid** dominant 7th chord in root position and inversions (same hands and ranges as RC-025; L10 too) | 5–10 | technical | [rcm] p.45 (as RC-025) | A9.1 (partial) | c.md:33 |
| RC-027 | Play a **broken** leading-tone diminished 7th chord of a minor key in root position and inversions: each hand alone (L6), then hands together (L7–9) | 6–9 | technical | [rcm] p.53: "Leading-tone Diminished 7th Chords" | A9.1 (partial) | c.md:34 (corrected start level) |
| RC-028 | Play a **solid** leading-tone diminished 7th chord in root position and inversions | 6–10 | technical | [rcm] p.53 (as RC-027) | A9.1 (partial) | c.md:34 |
| RC-029 | Play a tonic arpeggio in root position only, each hand alone, over 2 octaves | 4–6 | technical | [rcm] p.38: "(root position only)" (Arpeggios, Tonic row) | A9.1 (partial) | c.md:35 |
| RC-030 | Play a tonic arpeggio hands together in root position and both inversions: 2 octaves (L7), 4 octaves (L8–10). At L10 the inversions may be played singly or in sequence | 7–10 | technical | [rcm] p.61: "(root position and inversions)"; p.91: "either individually or in sequence" | A9.1 (partial) | c.md:36 (corrected start level) |
| RC-031 | Play a dominant 7th arpeggio in root position only: each hand alone (L6), then hands together over 2 octaves (L7) and 4 octaves (L8) | 6–8 | technical | [rcm] p.53: "Dominant 7th" (arpeggios, root position only) | A9.1 (partial) | c.md:35 |
| RC-032 | Play a dominant 7th arpeggio hands together over 4 octaves in root position and all three inversions | 9–10 | technical | [rcm] p.80: "(root position and inversions)"; p.123 example | A9.1 (partial) | c.md:36 |
| RC-033 | Play a leading-tone diminished 7th arpeggio in root position only: each hand alone (L6), then hands together (L7–8) | 6–8 | technical | [rcm] p.53: "Leading-tone Diminished 7th" (arpeggios) | A9.1 (partial) | c.md:35 |
| RC-034 | Play a leading-tone diminished 7th arpeggio hands together over 4 octaves in root position and inversions | 9–10 | technical | [rcm] p.80 (as RC-032) | A9.1 (partial) | c.md:36 |

### 1c. Technical tests: conditions on every item

| draft id | ability | level range | component | source | existing ability | completeness.md row |
| --- | --- | --- | --- | --- | --- | --- |
| RC-035 | Play each technical item at or above the stated minimum metronome speed, in the stated note value (quarters, eighths, triplet eighths, sixteenths) | Prep A–10 | technical | [rcm] p.7: "a guideline for the minimum tempo of each requirement" | A9.1 (partial) | c.md:40 |
| RC-036 | Play every scale, chord and arpeggio pattern from memory, in the key the examiner names. The examiner samples the list | Prep A–10 | technical | [rcm] p.7: "must be played from memory"; "representative sampling of items" | A9.1 (partial) | c.md:117 |
| RC-037 | Play the patterns ascending and descending, legato unless marked otherwise, with logical fingering, good tone and a steady tempo | Prep A–10 | technical | [rcm] p.120: "with good tone and logical fingering, at a steady tempo" | A9.1 (partial) | none |

### 1d. Repertoire and études

| draft id | ability | level range | component | source | existing ability | completeness.md row |
| --- | --- | --- | --- | --- | --- | --- |
| RC-038 | Perform a programme of contrasting pieces at the level: three (Prep A–L7), four (L8–9), five (L10). The L9 programme is at most 15 minutes and the L10 programme at most 30 | Prep A–10 | repertoire | [rcm] p.8: "three selections from the Syllabus List"; p.82: "should not exceed 15 minutes" | A4.1 (partial) | c.md:84 |
| RC-039 | Perform a Baroque piece (List A; at L1–2 the list is Baroque and Classical; at L10 it is works by J.S. Bach) | 1–10 | repertoire | [rcm] p.4: "List A: Baroque Repertoire" | none | c.md:84 |
| RC-040 | Perform a Classical or Classical-style piece. By *reading* of the list contents: sonatina movements at L1–7, sonata movements at L8–10, and complete sonatas offered at L9–10 | 1–10 | repertoire | [rcm] p.4: "List B: Classical and Classical-style Repertoire"; p.78: "Sonata in F Major, Hob. XVI:23 (complete)" | none | c.md:84; c.md:86 (corrected) |
| RC-041 | Perform a Romantic piece. It is its own list at L8–10; at L1–7 it shares a list with 20th- and 21st-century music | 1–10 | repertoire | [rcm] p.4: "List C: Romantic Repertoire" | none | c.md:84 |
| RC-042 | Perform a post-Romantic, Impressionist, 20th- or 21st-century piece. It is its own list at L8–9; at L10 it splits into List D (post-Romantic, Impressionist, early 20th century) and List E (20th and 21st century) | 1–10 | repertoire | [rcm] p.4: "List E: 20th- and 21st-century Repertoire" | none | c.md:84 |
| RC-043 | Perform an "Invention" at elementary level (List C). By *reading* of the titles (Bartók *Conversation*, *Follow My Leader*, *Teapot Invention*): a short two-voice piece in which the hands imitate or answer each other | 1–2 | repertoire | [rcm] p.4: "List C: Inventions"; p.18 list | none | c.md:85 (corrected) |
| RC-044 | Perform a contrapuntal Baroque keyboard work by J.S. Bach, inside List A: two-part inventions (L7–8), three-part sinfonias and a prelude and fugue (L9), preludes and fugues from *The Well-Tempered Clavier* and suite movements (L10) | 7–10 | repertoire | [rcm] p.63: "Two-part Inventions"; p.82: "Sinfonias (Three-part Inventions)"; p.93: "The Well-Tempered Clavier" | none | c.md:85 |
| RC-045 | Perform repertoire from memory. Memory marks are optional at Prep A–L8; at L9–10 a mark is deducted for each piece not memorised | Prep A–10 | repertoire | [rcm] p.5: "memory marks are awarded for each repertoire selection performed by memory" | A4.1 (partial) | none |
| RC-046 | Follow da capo and dal segno signs in performance; play repeats only where the syllabus says to | Prep A–10 | repertoire | [rcm] p.4: "students should observe da capo and dal segno signs" | A1.1 | c.md:78 (cites ABRSM; RCM states the same) |
| RC-047 | Perform études at the level: one at L1–2, two technically contrasting ones at L3–10. Memory is not required. The syllabus does not name the skill each étude trains | 1–10 | études | [rcm] p.31: "two technically contrasting etudes from the following list"; p.7: "Etudes do not need to be memorized." | A7f.2 | c.md:87 |
| RC-048 | Perform a non-classical arrangement from the Popular Selection List in place of one étude (optional) | 1–10 | études | [rcm] p.5: "a compilation of contemporary arrangements"; [pop] p.2: "non-classical pieces carefully selected to suit each level" | none | none |

### 1e. Ear tests

| draft id | ability | level range | component | source | existing ability | completeness.md row |
| --- | --- | --- | --- | --- | --- | --- |
| RC-049 | Clap, tap or sing back the rhythm of a short melody heard twice, after the examiner names the time signature and counts one bar | Prep A–4 | ear | [rcm] p.9: "clap, tap, or sing the rhythm of a short melody" | A8.1 | none |
| RC-050 | Name a heard triad major or minor. At Prep A–B it follows the first five notes of the scale; at L1 it is played broken then solid; from L2 solid, once | Prep A–4 | ear | [rcm] p.9: "identify the quality (major or minor) of a triad" | none | c.md:96 |
| RC-051 | Hear a broken triad, then a single note, and name the note as its root, third or fifth | 3–4 | ear | [rcm] p.32: "identify a single note as the root, third, or fifth" | none | none |
| RC-052 | Name the quality of a heard chord played solid in close position: major and minor triads and dominant 7th (L5); plus diminished 7th (L6); plus augmented triad (L7–8); major and minor four-note chords in root position and first inversion (L9–10); plus major 7th and minor 7th (L10) | 5–10 | ear | [rcm] p.46: "identify the quality of the following chords" | none | c.md:96 |
| RC-053 | Name an interval heard melodically, ascending and descending: m3 and M3 (L1), + P5 (L2), + P4 (L3), + P8 (L4) | 1–4 | ear | [rcm] p.20: "play each interval in melodic form (ascending and descending) once" | none | c.md:96 |
| RC-054 | Name an interval heard melodically then harmonically (L5–9), or in either form (L10). The set grows to all intervals within the octave, including the tritone (L8), and minor and major 9ths (L10) | 5–10 | ear | [rcm] p.46: "melodic form (ascending or descending) followed by harmonic form" | none | c.md:96 |
| RC-055 | Sing or hum a named interval above or below a note the examiner plays (an alternative to RC-053/054) | 1–10 | ear | [rcm] p.20: "sing or hum any of the following intervals" | none | none |
| RC-056 | Name a heard three-chord progression (keyboard style, bass rising from the tonic): I–IV–I or I–V–I (L5); minor forms too (L6); plus I–IV–V and i–iv–V (L7) | 5–7 | ear | [rcm] p.46: "identify chord progressions in major keys as I–IV–I or I–V–I" | A3.1 (partial) | c.md:96 |
| RC-057 | Name each chord of a progression heard twice, with a pause on each chord the second time. Four chords from set lists (L8); four chords from I, IV, V, vi / i, iv, V, VI (L9); five chords plus the cadential ⁶₄ (L10) | 8–10 | ear | [rcm] p.71: "identify each chord in a four-chord progression" | A3.1 (partial) | c.md:96 |
| RC-058 | Play back a single-line melody after the key is named and the tonic chord sounded. The melody uses the first three scale notes (Prep A–B), five notes (L1–4), five notes plus the upper tonic (L5), then the whole scale (L6–8). It is heard twice, or three times from L5, when the learner claps the rhythm or sings the melody after the second hearing | Prep A–8 | ear | [rcm] p.9: "play back a melody based on the first three notes of a major scale"; p.46: "the student will clap the rhythm or sing the melody" | A3.1 (partial: a heard melody, not a recording) | c.md:93; c.md:94 |
| RC-059 | Play back the **upper part** of a heard two-part phrase | 9 | ear | [rcm] p.81: "play back the upper part of a two-part phrase" | A3.1 (partial) | c.md:94 |
| RC-060 | Play back a heard diatonic melody and harmonise it with left-hand solid chords from I, IV and V | 10 | ear | [rcm] p.92: "play back a diatonic melody and harmonize it" | A3.1 (partial); A6.1 (partial) | none |
| RC-061 | Play back a given four-bar question phrase and improvise an answer that makes an eight-bar **parallel** period (the playback option) | 5–6 | ear | [rcm] p.46: "improvise an answer phrase to create an eight-measure parallel period" | none | c.md:95 (corrected level span) |
| RC-062 | The same, making an eight-bar **contrasting** period; minor keys and an upbeat are possible at L8 | 7–8 | ear | [rcm] p.62: "eight-measure contrasting period" | none | c.md:95 |
| RC-063 | Play back a two-bar opening, complete the question (antecedent) phrase, and improvise an answer (consequent) to make an eight-bar contrasting period | 9–10 | ear | [rcm] p.81: "complete the question (antecedent) phrase, and improvise an answer (consequent) phrase" | none | c.md:95 |

### 1f. Sight reading

| draft id | ability | level range | component | source | existing ability | completeness.md row |
| --- | --- | --- | --- | --- | --- | --- |
| RC-064 | Tap a steady beat for one bar, then keep tapping while speaking, tapping or clapping a written rhythm in **simple** time (2/4, 3/4, 4/4), with metric accent. From L4 the rhythm is that of a given melody | Prep A–10 | sight-reading | [rcm] p.9: "Tap a steady beat with their hand or foot for one measure." | A8.1 (partial) | none |
| RC-065 | Do the same in **compound** time (6/8) | 5–10 | sight-reading | [rcm] p.46: time signatures 3/4, 4/4, 6/8 (rhythm table; glyphs read from the page image) | A8.1 (partial) | c.md:43 (cites ABRSM/Trinity) |
| RC-066 | Sight-play two four-note melodies: one in the treble with the right hand alone, one in the bass with the left hand alone. They move by step in one direction (a note may repeat), with fingering only on the first note | Prep A | sight-reading | [rcm] p.9: "The melodies will move by step in one direction only" | none | c.md:89; c.md:90; c.md:91 |
| RC-067 | Sight-play a short melody divided between the hands, one hand at a time, in five-finger positions. At L1 it is four bars, in C, G or F major or A minor, with fingering on the first note of each hand | Prep B–1 | sight-reading | [rcm] p.14: "a short melody written on the grand staff, divided between the hands" | A1.2 (partial: G and F signatures from L1) | c.md:90; c.md:91 |
| RC-068 | Sight-play a melody divided between the hands that moves **beyond the five-finger position** | 2 | sight-reading | [rcm] p.26: "Melodies may move beyond the five-finger position." | none | c.md:48 (cites ABRSM) |
| RC-069 | Sight-play a four-bar passage **hands together** (L3 in 4/4; L4 in 3/4 or 4/4) | 3–4 | sight-reading | [rcm] p.32: "play a four-measure passage, hands together" | A1.2 (partial) | c.md:49 (cites ABRSM) |
| RC-070 | Sight-play a passage comparable to repertoire three levels lower (L5 reads Level 2 pieces … L10 reads Level 7 pieces). Length grows from 8 to 16 bars and keys reach up to five sharps or flats | 5–10 | sight-reading | [rcm] p.46: "play a passage of music comparable to Level 2 repertoire" | A1.2 (partial) | c.md:88; c.md:42; c.md:45 |
| RC-071 | Sight-play in compound time (6/8) | 5–10 | sight-reading | [rcm] p.46: time signatures 3/4, 4/4, 6/8 (playing table; page image) | A1.2 (partial) | c.md:43 |
| RC-072 | Sight-play a passage that begins with an upbeat (anacrusis) | 8 (stated); 9–10 not stated | sight-reading | [rcm] p.71: "(may include an upbeat)" | none | c.md:55 |
| RC-073 | Sight-play in any time signature | 9–10 | sight-reading | [rcm] p.82: Time Signatures "any" | A1.2 (partial) | c.md:43 |
| RC-074 | Read a lead sheet (melody with root/quality chord symbols) at sight and play an accompaniment from the symbols (an alternative to RC-070). The chord vocabulary follows that level's theory syllabus (section 2) | 5–10 | sight-reading | [rcm] p.46: "read a lead sheet (with a melody and root/quality chord symbols)" | none (nearest: cluster 5; A10.1 "comp") | c.md:92 (corrected level span) |
| RC-075 | Make the lead-sheet accompaniment creative and fitting to the style of the melody. It is encouraged at L7–8 and expected at L9–10 | 7–10 | sight-reading | [rcm] p.62: "creative accompaniments appropriate to the style"; p.82: "Students are expected to provide creative accompaniments" | none | c.md:92 |

### 1g. Keyboard Harmony (optional corequisite in place of the written Harmony exams, Levels 9–10)

| draft id | ability | level range | component | source | existing ability | completeness.md row |
| --- | --- | --- | --- | --- | --- | --- |
| RC-076 | Improvise a four-bar answer (consequent) to each of two given four-bar questions, one major and one minor: one making a parallel period, one a contrasting period, with bass notes at the cadences | KH9–KH10 | other (theory: keyboard harmony) | [thy] p.32: "Improvise a four-measure consequent (answer) to each of two" | none | c.md:95 |
| RC-077 | Make each improvised consequent **modulate** to a suitable goal key, and add a bass line under the given phrase | KH10 | other (keyboard harmony) | [thy] p.34: "Both consequents should modulate to an appropriate goal key." | none | c.md:95; c.md:47 (cites Trinity) |
| RC-078 | Add non-chord tones to a given melody with bass: passing, neighbour, appoggiatura, suspension, échappée, anticipation | KH9 | other (keyboard harmony) | [thy] p.32: "Add non-chord tones to a given excerpt" | none | none |
| RC-079 | Improvise the missing upper or lower part of a short two-part contrapuntal piece in half and quarter notes, using varied contrapuntal motion | KH9 | other (keyboard harmony) | [thy] p.33: "Complete an upper or lower part of a short two-part contrapuntal composition" | none | none |
| RC-080 | Play a diatonic sequence in the key the examiner names: descending fifths with triads (KH9); at KH10, descending fifths with seventh chords or ascending 5–6 (the learner chooses) | KH9–KH10 | other (keyboard harmony) | [thy] p.33: "Play a diatonic descending fifths sequence in a major or minor key" | none | none |
| RC-081 | Play a chord progression in keyboard style from functional chord symbols over a given soprano line | KH9–KH10 | other (keyboard harmony) | [thy] p.33: "Play chord progressions in keyboard style." | none | none |
| RC-082 | Harmonise a given soprano and bass in keyboard style: from some functional symbols or figures (KH9), from figured bass (KH10) | KH9–KH10 | other (keyboard harmony) | [thy] p.33: "Harmonize a given soprano and bass in keyboard style."; p.34: "Figured bass symbols will be provided." | A6.1 (partial) | none |
| RC-083 | Make up an accompaniment in a fitting style for a given melody, with or without chord symbols | KH9–KH10 | other (keyboard harmony) | [thy] p.33: "Create an accompaniment in an appropriate style for a given melody." | A6.1 (partial) | none |
| RC-084 | Play a short passage, then name the function of each chord, the circled non-chord tones and, if asked, the tonal hierarchy (T/PD/D) | KH9–KH10 | other (keyboard harmony) | [thy] p.33: "indicating the functional chord symbol for each chord after playing it" | A5.1 (partial) | none |
| RC-085 | Analyse a piece's form and cadences: a simple 18th-century dance as binary, rounded binary or ternary, with its cadences and their keys (KH9). At KH10 the piece is a compound-ternary, rondo or sonata-form movement or a fugal exposition | KH9–KH10 | other (keyboard harmony) | [thy] p.33: "identify the form as binary, rounded binary, or ternary"; p.35: "compound ternary form, rondo form, sonata form" | A5.1 (partial) | none |

### 1h. Check of completeness.md's 32 RCM lines

Each line was checked against the cited page. Verdict: **keep** (correct as written), **correct** (wrong page, level or description) or **split** (the line holds several graded items).

| c.md line | demand as written | verdict | what the syllabus says | rows |
| --- | --- | --- | --- | --- |
| 16 | Scales a third/sixth apart, RCM p.91 | keep | L10 only, 4 octaves HT (p.91) | RC-016, RC-017 |
| 20 | Formula pattern "(contrary then similar motion)", p.45, p.70 | correct | The p.120 example begins in **similar** motion (both hands up one octave from C4/C3). It then goes contrary outward and inward and back to similar, and repeats from the top. Levels: 2–9, not only 5 and 8 | RC-011 |
| 21 | Scale range 1, 2 or 4 octaves, p.70 | keep, split | 1 octave Prep B; 2 octaves HS L1–2; 2 octaves HT L3–7; 4 octaves L8–10 | RC-003, RC-005, RC-006, RC-007 |
| 23 | Chromatic scale, p.45 | correct (level span) | Starts at L1 (p.19), HS 1 octave to L4; HT from L5 | RC-012, RC-013 |
| 25 | Legato and staccato scales "(examiner's choice)", p.9 pentascales | correct | RCM requires **both** legato and staccato pentascales at Prep (two separate items, p.9, p.14). Scales are otherwise all legato (p.19). Staccato returns only as solid octaves (L9–10) | RC-001, RC-002, RC-014, RC-037 |
| 27 | Scales in octaves; chromatic in octaves, p.91 | keep, split | Octaves at L9 (p.80) and L10 (p.91); chromatic in octaves at L10 only | RC-014, RC-015 |
| 31 | Broken and solid tonic triads with inversions, p.9, p.45 | correct, split | p.9 (Prep A) is the **triad sequence** on each degree of C, not tonic triads with inversions. Broken tonic triads with inversions start at Prep B (p.14), solid ones at L1 (p.19) | RC-018, RC-019, RC-020 |
| 32 | Four-note tonic chords, broken alternate-note pattern, p.70, p.91 | correct, split | p.70 (L8) has four-note chords **broken only**, not alternate-note. The alternate-note pattern is the L9 small-hands option (p.80) and is required at L10 (p.91). Solid four-note chords L9–10 | RC-022, RC-023, RC-024 |
| 33 | Dominant 7th broken and solid with inversions, p.45 | keep, split | From L5; broken and solid are graded separately | RC-025, RC-026 |
| 34 | Leading-tone diminished 7th chords, p.70 | correct (start level) | From L6 (p.53), not first at L8 | RC-027, RC-028 |
| 35 | Arpeggios: which chord, p.70 | keep, split | Tonic from L4 (p.38); dominant 7th and diminished 7th from L6 (p.53) | RC-029, RC-031, RC-033 |
| 36 | Arpeggios in inversions, p.91 | correct (start level) | Tonic arpeggio inversions from L7 (p.61); dom7 and dim7 inversions from L9 (p.80); p.91 adds "individually or in sequence" | RC-030, RC-032, RC-034 |
| 38 | Progressions I–V–I, I–IV–V–I, I–VI–IV–V⁶₄–V–I, p.45, 70, 91 | correct | p.45 I–V–I (L5–6); I–IV–V–I is L7 (p.61), not p.70; p.70 (L8) is I–IV–V⁶₄–⁵₃–I; I–vi–IV–V⁶₄–V⁸⁻⁷–I is L9 (p.80) and L10 (p.91) | RC-021 |
| 39 | Pentascales tonic to dominant, p.9 | keep | Prep A and Prep B | RC-001 |
| 40 | Scale and arpeggio speeds by grade, p.45, p.70 | keep | The speeds are a minimum guideline (p.7) | RC-035 |
| 42 | Sight-reading length "4 bars to one page", p.71 | correct (RCM range) | RCM's range is four notes (Prep A) to "up to sixteen measures" (L9–10, p.82); p.71 says eight to twelve | RC-066, RC-070 |
| 45 | Keys by grade, p.71 "up to four sharps or flats" | keep | L8 traditional reading, up to four; L8 lead sheet up to three; L9–10 up to five | RC-070, RC-074 |
| 55 | Anacrusis, p.71 | keep | L8 sight playing, playback and improvisation (p.71); L9–10 tables do not mention it | RC-072, RC-062 |
| 84 | Lists by era | keep | p.4 | RC-038 to RC-042 |
| 85 | "RCM Inventions list, Levels 8–9" | correct | The list titled "Inventions" is List C at **L1–2** (p.4). Bach two-part inventions sit inside List A at L7–8 (p.63, p.72); sinfonias at L9 (p.82) | RC-043, RC-044 |
| 86 | "RCM Classical sonatas list, Level 9" | correct | At L8–9, List B is "Classical Repertoire" (sonata movements and some complete sonatas). A list titled "Classical Sonatas" exists only at ARCT (p.4) | RC-040 |
| 87 | Études per level, p.7 | keep | One at L1–2, two technically contrasting at L3–10 | RC-047 |
| 88 | Sight playing "comparable to Level N", p.71 | keep | L5–10, always three levels lower | RC-070 |
| 89 | Prep A melodies: four notes, by step, one direction | keep | p.9 | RC-066 |
| 90 | Fingering for the first note only, p.9 | keep | Prep A; Prep B–L1 give it for the first note of each hand | RC-066, RC-067 |
| 91 | Treble melody RH, bass melody LH, p.9 | keep | Prep A | RC-066 |
| 92 | Lead sheet "(Level 8 option)", p.71 | correct (level span) | Option at **L5–10** (p.46, 54, 62, 71, 82, 93) | RC-074, RC-075 |
| 93 | Playback on the first three notes, p.9 | keep | Prep A–B | RC-058 |
| 94 | Playback begins on tonic, mediant, dominant or upper tonic, p.71 | keep | The upper tonic is added from L5; earlier levels use subsets | RC-058 |
| 95 | Improvised answer making a contrasting period, p.71 | keep, split | Parallel at L5–6; contrasting at L7–8; opening plus antecedent plus consequent at L9–10 | RC-061, RC-062, RC-063 |
| 96 | Chord quality, progressions, intervals by ear, p.7 | keep, split | Graded separately per level | RC-050 to RC-057 |
| 117 | All technical work from memory, p.7 | keep | p.7 | RC-036 |

Also checked: c.md line 5 says only Prep A, L5, L8 and L10 technical tests were read. Every other level's technical and musicianship pages are read here.

## 2. Coverage: every component at every level read

Parameters are read from the page images (keys, tempo in quarter-note beats per minute, note values, length). "Repertoire lists" counts each list as one component.

### All levels: general requirements (pp. 4–7, 120)

| component | parameters | ability ids |
| --- | --- | --- |
| Da capo and dal segno observed; repeats ignored unless the syllabus says otherwise (p.4) | | RC-046 |
| Memorisation policy (p.5) | optional with marks Prep A–L8; deduction L9–10 | RC-045 |
| Technical tests: from memory, examiner samples the list, speeds are minimums (p.7) | | RC-035, RC-036 |
| Technical patterns ascending and descending, legato unless marked, good tone, logical fingering, steady tempo (p.120) | | RC-037 |
| Substitution rules: syllabus, teacher's choice, popular selection (pp. 5–6) | | n/a: an administrative rule, nothing the learner does. The popular-selection option is RC-048 |
| Remote examinations: sight-reading excerpts given 22 hours ahead (p.7) | | n/a: administrative |

### Preparatory A (pp. 8–9)

| component | parameters | ability ids |
| --- | --- | --- |
| Repertoire: 3 selections from one syllabus list | no era lists at Prep | RC-038 |
| Memory | 2 marks per piece, optional | RC-045 |
| Legato pentascales | C, G, D major; A minor; HS; ♩=100 in quarters; end on solid triad | RC-001, RC-035–037 |
| Staccato pentascales | same keys; staccato quarters | RC-002 |
| Triad sequence, broken and solid | C major; HS; 1 octave up; broken ♩=60, solid ♩=72 | RC-018 |
| Ear: clapback | 3/4, 4/4; whole to eighth notes; two bars | RC-049 |
| Ear: chords | major/minor triads, root position, after the first five scale notes | RC-050 |
| Ear: playback | first 3 notes of a major scale; starts on tonic or mediant; C, G major; four notes; heard twice | RC-058 |
| Sight reading: rhythm | 4/4; whole, half, quarter, eighths; two bars | RC-064 |
| Sight reading: playing | two four-note melodies, RH treble and LH bass; 4/4; whole, half, quarter | RC-066 |

### Preparatory B (pp. 13–14)

| component | parameters | ability ids |
| --- | --- | --- |
| Repertoire: 3 selections | | RC-038 |
| Memory | optional | RC-045 |
| Legato pentascales | D, A, F major; E, D minor; HS; ♩=60 in eighths | RC-001 |
| Staccato pentascales | same | RC-002 |
| One-octave scales | C, G major; A minor (natural); HS; ♩=60 in eighths | RC-003, RC-008 |
| Contrary-motion scale | C major; HT; 1 octave; ♩=60 | RC-004 |
| Tonic triads, broken | C, G major; A minor; HS; 1 octave; root position and inversions; ♩=50 in triplet eighths | RC-019 |
| Ear: clapback | 3/4, 4/4; two bars | RC-049 |
| Ear: chords | as Prep A | RC-050 |
| Ear: playback | first 3 notes of a major or minor scale; tonic or mediant; C, G major, A minor; four notes | RC-058 |
| Sight reading: rhythm | 4/4; two bars | RC-064 |
| Sight reading: playing | melody divided between the hands; 4/4; fingering on the first note of each hand | RC-067 |

### Level 1 (pp. 18–20)

| component | parameters | ability ids |
| --- | --- | --- |
| List A: Baroque and Classical | | RC-039, RC-040 |
| List B: Romantic, 20th and 21st century | | RC-041, RC-042 |
| List C: Inventions | | RC-043 |
| Memory | optional | RC-045 |
| Étude (one; popular-selection substitute allowed) | | RC-047, RC-048 |
| Two-octave scales | C, G, F major; A, E, D minor (natural and harmonic); HS; ♩=69 in eighths; all legato | RC-005, RC-008, RC-009, RC-037 |
| Contrary-motion scale | C major; HT; 2 octaves; ♩=69 | RC-004 |
| Chromatic scale | from C; HS; 1 octave; ♩=69 | RC-012 |
| Tonic triads, broken and solid | C, G, F major; A, E, D minor; HS; 1 octave; inversions; broken ♩=50, solid ♩=100 | RC-019, RC-020 |
| Ear: clapback | 3/4, 4/4; adds dotted quarter and eighth; two to three bars | RC-049 |
| Ear: intervals | m3, M3; melodic, ascending and descending; or sing them | RC-053, RC-055 |
| Ear: chords | major/minor; broken then solid | RC-050 |
| Ear: playback | first five notes; tonic or dominant; C, G major, A minor; five notes | RC-058 |
| Sight reading: rhythm | 4/4; two bars | RC-064 |
| Sight reading: playing | four bars divided between the hands; C, G, F major, A minor; 4/4 | RC-067 |

### Level 2 (pp. 24–26)

| component | parameters | ability ids |
| --- | --- | --- |
| Lists A, B, C (as L1) | | RC-039–RC-043 |
| Memory | optional | RC-045 |
| Étude (one) | | RC-047, RC-048 |
| Two-octave scales | G, F, B♭ major; E, D, G minor (harmonic and melodic); HS; ♩=80 in eighths | RC-005, RC-009, RC-010 |
| Formula pattern | C, G major; HT; 2 octaves; ♩=80 | RC-011 |
| Chromatic scale | from G; HS; 1 octave; ♩=80 | RC-012 |
| Tonic triads, broken and solid | G, F, B♭ major; E, D, G minor; HS; 1 octave; broken ♩=60, solid ♩=112 | RC-019, RC-020 |
| Ear: clapback | 3/4, 4/4; two to three bars | RC-049 |
| Ear: intervals | m3, M3, P5 | RC-053, RC-055 |
| Ear: chords | major/minor, solid | RC-050 |
| Ear: playback | first five notes; tonic or dominant; G, F major, D minor; five notes | RC-058 |
| Sight reading: rhythm | 3/4, 4/4; quarter rest; two to four bars | RC-064 |
| Sight reading: playing | four bars divided between the hands, beyond the five-finger position; C, G, F major, A, D minor; 4/4 | RC-067, RC-068 |

### Level 3 (pp. 30–32)

| component | parameters | ability ids |
| --- | --- | --- |
| List A: Baroque | | RC-039 |
| List B: Classical and Classical-style (sonatinas, by reading) | | RC-040 |
| List C: Romantic, 20th and 21st century | | RC-041, RC-042 |
| Memory | optional | RC-045 |
| Études (two, technically contrasting; one optional étude is for the LH alone) | | RC-047, RC-048 |
| Two-octave scales | D, F, B♭ major; B, D, G minor (harmonic and melodic); HT; ♩=80 in eighths | RC-006, RC-009, RC-010 |
| Formula pattern | D major; HT; 2 octaves; ♩=80 | RC-011 |
| Chromatic scale | from D; HS; 1 octave; ♩=80 | RC-012 |
| Tonic triads, broken and solid | D, F, B♭ major; B, D, G minor; HS; 2 octaves; broken ♩=69, solid ♩=120 | RC-019, RC-020 |
| Ear: clapback | 3/4, 4/4; three to four bars | RC-049 |
| Ear: intervals | m3, M3, P4, P5 | RC-053, RC-055 |
| Ear: chords | major/minor, solid; and root, third or fifth of a broken triad | RC-050, RC-051 |
| Ear: playback | first five notes; tonic, mediant or dominant; D, F major, D, G minor; five to six notes | RC-058 |
| Sight reading: rhythm | 3/4, 4/4; dotted quarter, rests; four bars | RC-064 |
| Sight reading: playing | four bars hands together; C, G, D, F major, A, D minor; 4/4 | RC-069 |

### Level 4 (pp. 37–39)

| component | parameters | ability ids |
| --- | --- | --- |
| Lists A, B, C (as L3) | | RC-039–RC-042 |
| Memory | optional | RC-045 |
| Études (two; one optional étude is for the RH alone) | | RC-047, RC-048 |
| Two-octave scales | D, A, B♭, E♭ major; B, G, C minor (harmonic and melodic); HT; ♩=92 in eighths | RC-006, RC-009, RC-010 |
| Formula pattern | C minor (harmonic); HT; 2 octaves; ♩=92 | RC-011, RC-009 |
| Chromatic scale | from C; HS; 1 octave; ♩=104 | RC-012 |
| Tonic triads, broken and solid | D, A, B♭, E♭ major; B, G, C minor; **HT**; 2 octaves; broken ♩=60, solid ♩=120 | RC-019, RC-020 |
| Tonic arpeggios | same keys; HS; 2 octaves; root position only; ♩=72 in eighths | RC-029 |
| Ear: clapback | 3/4, 4/4, **6/8**; dotted eighth and sixteenth; two to four bars | RC-049 |
| Ear: intervals | m3, M3, P4, P5, P8 | RC-053, RC-055 |
| Ear: chords | as L3 | RC-050, RC-051 |
| Ear: playback | first five notes; tonic, mediant or dominant; D, A major, G, C minor; six to eight notes | RC-058 |
| Sight reading: rhythm (of a given melody) | 3/4, 4/4; four bars | RC-064 |
| Sight reading: playing | four bars hands together; C, G, D, F major, A, E, D minor; 3/4, 4/4 | RC-069 |

### Level 5 (pp. 44–46)

| component | parameters | ability ids |
| --- | --- | --- |
| Lists A, B, C | | RC-039–RC-042 |
| Memory | optional | RC-045 |
| Études (two) | | RC-047, RC-048 |
| Two-octave scales | A, E, F, A♭ major; A, E, F minor (harmonic and melodic); HT; ♩=104 in eighths | RC-006, RC-009, RC-010 |
| Formula pattern | A major, A minor (harmonic); HT; 2 octaves; ♩=104 | RC-011 |
| Chromatic scale | from A and F; **HT**; 1 octave; ♩=104 | RC-013 |
| Tonic triads, broken and solid | A, E, F, A♭ major; A, E, F minor; HT; 2 octaves; end with I–V–I; ♩=66 | RC-019, RC-020, RC-021 |
| Dominant 7th chords, broken and solid | A, E, A♭ major; HS; 1 octave; inversions; broken ♩=72, solid ♩=60 | RC-025, RC-026 |
| Tonic arpeggios | A, E, F, A♭ major; A, E, F minor; HS; 2 octaves; root position; ♩=80 | RC-029 |
| Ear: intervals | m3, M3, P4, P5, m6, M6, P8; melodic then harmonic | RC-054, RC-055 |
| Ear: chords | major/minor triads, dominant 7th | RC-052 |
| Ear: chord progressions | I–IV–I, I–V–I | RC-056 |
| Ear: playback (traditional) | five notes plus the upper tonic; A, E major and minor; 3/4, 4/4; up to eight notes | RC-058 |
| Ear: playback (improvised) | parallel period; C, G, F major; 3/4, 4/4 | RC-061 |
| Sight reading: rhythm | 3/4, 4/4, 6/8; four bars | RC-064, RC-065 |
| Sight reading: playing (traditional) | Level 2 repertoire; up to two sharps or flats; 3/4, 4/4, 6/8; eight bars | RC-070, RC-071 |
| Sight reading: playing (lead sheet) | up to two sharps or flats; eight bars; Level 5 Theory chords: I, i, IV, iv, V, V7 in root position ([thy] p.18: "root/quality chord symbols (for example, C, Am, G7)") | RC-074 |
| Theory corequisite: Level 5 Theory (written) | | UNCOVERED: a written exam that names no keyboard ability; out of this brief's scope. Its chord list sets RC-074's vocabulary |

### Level 6 (pp. 52–54)

| component | parameters | ability ids |
| --- | --- | --- |
| Lists A, B, C | | RC-039–RC-042 |
| Memory | optional | RC-045 |
| Études (two) | | RC-047, RC-048 |
| Two-octave scales | G, E, B, D♭ major; G, E, C♯ minor; HT; ♩=60 in sixteenths | RC-006, RC-009, RC-010 |
| Formula pattern | E major, E minor (harmonic); HT; 2 octaves; ♩=60 | RC-011 |
| Chromatic scale | from E and D♭; HT; 2 octaves; ♩=60 | RC-013 |
| Tonic triads, broken and solid | HT; 2 octaves; end with I–V–I; ♩=80 | RC-019, RC-020, RC-021 |
| Dominant 7th chords, broken and solid | G, E, B, D♭ major; HS; 2 octaves; broken ♩=88, solid ♩=72 | RC-025, RC-026 |
| Leading-tone diminished 7th chords, broken and solid | G, E, C♯ minor; HS; 2 octaves; broken ♩=88, solid ♩=72 | RC-027, RC-028 |
| Arpeggios: tonic, dominant 7th, diminished 7th | HS; 2 octaves; root position; ♩=92 | RC-029, RC-031, RC-033 |
| Ear: intervals | adds m2, M2 | RC-054, RC-055 |
| Ear: chords | adds diminished 7th | RC-052 |
| Ear: chord progressions | I–IV–I, I–V–I, i–iv–i, i–V–i | RC-056 |
| Ear: playback (traditional) | whole scale; G, E major and minor; 3/4, 4/4; up to nine notes | RC-058 |
| Ear: playback (improvised) | parallel period; C, G, F major | RC-061 |
| Sight reading: rhythm | 3/4, 4/4, 6/8; four bars | RC-064, RC-065 |
| Sight reading: playing (traditional) | Level 3 repertoire; up to three sharps or flats; 2/4, 3/4, 4/4, 6/8; eight bars | RC-070, RC-071 |
| Sight reading: playing (lead sheet) | up to two sharps or flats; Level 6 Theory: root-position I, IV/iv, V for the implied harmony of a melody ([thy] p.21) | RC-074 |
| Theory corequisite: Level 6 Theory (written) | | UNCOVERED: written, no keyboard ability; out of scope |

### Level 7 (pp. 60–62)

| component | parameters | ability ids |
| --- | --- | --- |
| Lists A, B, C (List A includes Bach two-part inventions, p.63) | | RC-039–RC-042, RC-044 |
| Memory | optional | RC-045 |
| Études (two) | | RC-047, RC-048 |
| Two-octave scales | C, D, F, A♭, G♭ major; C, D, F, G♯, F♯ minor; HT; ♩=76 in sixteenths | RC-006, RC-009, RC-010 |
| Formula pattern | D major, D minor (harmonic); HT; 2 octaves; ♩=76 | RC-011 |
| Chromatic scale | from D and G♭; HT; 2 octaves; ♩=76 | RC-013 |
| Tonic four-note chords, broken only | HT; 2 octaves; inversions; end with I–IV–V–I; ♩=60 | RC-022, RC-021 |
| Dominant 7th chords, broken and solid | HT; 2 octaves; broken ♩=60, solid ♩=80 | RC-025, RC-026 |
| Diminished 7th chords, broken and solid | HT; 2 octaves | RC-027, RC-028 |
| Tonic arpeggios | HT; 2 octaves; root position and inversions; ♩=60 | RC-030 |
| Dominant 7th and diminished 7th arpeggios | HT; 2 octaves; root position only; ♩=60 | RC-031, RC-033 |
| Ear: intervals | adds m7, M7 | RC-054, RC-055 |
| Ear: chords | adds the augmented triad | RC-052 |
| Ear: chord progressions | adds I–IV–V, i–iv–V | RC-056 |
| Ear: playback (traditional) | whole scale; D, F major and minor; up to ten notes (time signatures as the p.62 table) | RC-058 |
| Ear: playback (improvised) | contrasting period; C, G, F major | RC-062 |
| Sight reading: rhythm | 2/4, 3/4, 4/4, 6/8; four bars | RC-064, RC-065 |
| Sight reading: playing (traditional) | Level 4 repertoire; up to three sharps or flats; 8–12 bars | RC-070, RC-071 |
| Sight reading: playing (lead sheet) | up to three sharps or flats; Level 7 Theory: triads on any degree, V7 and inversions, vii°7 ([thy] p.23); creative accompaniment encouraged | RC-074, RC-075 |
| Theory corequisite: Level 7 Theory (written) | | UNCOVERED: written, no keyboard ability; out of scope |

### Level 8 (pp. 68–71)

| component | parameters | ability ids |
| --- | --- | --- |
| List A: Baroque (includes Bach two-part inventions) | | RC-039, RC-044 |
| List B: Classical | | RC-040 |
| List C: Romantic | | RC-041 |
| List D: Post-Romantic, 20th and 21st century | | RC-042 |
| Memory | 1.5 marks per piece, optional | RC-045 |
| Études (two) | | RC-047, RC-048 |
| Four-octave scales | C, D, E, B♭, E♭, G♭ major; C, D, E, B♭, E♭, F♯ minor; HT; ♩=88 in sixteenths | RC-007, RC-009, RC-010 |
| Formula pattern | E♭ major, E♭ minor (harmonic); HT; **4 octaves**; ♩=88 | RC-011 |
| Chromatic scale | from E♭ and E; HT; 2 octaves; ♩=88 | RC-013 |
| Tonic four-note chords, broken only | HT; 2 octaves; end with I–IV–V⁶₄–⁵₃–I; ♩=80 | RC-022, RC-021 |
| Dominant 7th chords, broken and solid | HT; 2 octaves; broken ♩=80, solid ♩=100 | RC-025, RC-026 |
| Diminished 7th chords, broken and solid | HT; 2 octaves | RC-027, RC-028 |
| Tonic arpeggios | HT; 4 octaves; root position and inversions; ♩=69 | RC-030 |
| Dominant 7th and diminished 7th arpeggios | HT; 4 octaves; root position only; ♩=69 | RC-031, RC-033 |
| Ear: intervals | adds the augmented 4th / diminished 5th | RC-054, RC-055 |
| Ear: chords | as L7 | RC-052 |
| Ear: chord progressions | each chord of four: I–IV–V–I, I–IV–V–vi, I–vi–IV–V, I–vi–IV–I and the minor forms | RC-057 |
| Ear: playback (traditional) | whole scale; B♭, E♭ major, C, E minor; 2/4, 3/4, 4/4, 6/8; may include an upbeat; up to eleven notes | RC-058 |
| Ear: playback (improvised) | contrasting period; C, G, F major, A, E, D minor; may include an upbeat | RC-062 |
| Sight reading: rhythm | 2/4, 3/4, 4/4, 6/8; four bars | RC-064, RC-065 |
| Sight reading: playing (traditional) | Level 5 repertoire; up to four sharps or flats; may include an upbeat; 8–12 bars | RC-070, RC-071, RC-072 |
| Sight reading: playing (lead sheet) | up to three sharps or flats; may include an upbeat; Level 8 Theory: triads on any degree with inversions, V7 inversions, vii°7 ([thy] p.25); the p.130 example uses slash chords such as Cm/E | RC-074, RC-075, RC-072 |
| Theory corequisite: Level 8 Theory (written) | | UNCOVERED: written, no keyboard ability; out of scope |

### Level 9 (pp. 78–82)

| component | parameters | ability ids |
| --- | --- | --- |
| List A: Baroque (sinfonias, a prelude and fugue) | | RC-039, RC-044 |
| List B: Classical (complete sonatas offered) | | RC-040 |
| List C: Romantic | | RC-041 |
| List D: Post-Romantic, 20th and 21st century | | RC-042 |
| Programme at most 15 minutes | | RC-038 |
| Memory: required, with deduction | | RC-045 |
| Études (two; one optional étude is for the left hand) | | RC-047, RC-048 |
| Four-octave scales | C, D♭, D, E♭, E, F major; C, C♯, D, E♭, E, F minor; HT; ♩=104 | RC-007, RC-009, RC-010 |
| Formula pattern | F, D♭ major; F, C♯ minor (harmonic); HT; 4 octaves; ♩=104 | RC-011 |
| Chromatic scale | from any note C–F; HT; 4 octaves; ♩=104 | RC-013 |
| Scales in octaves | F, D♭ major; F, C♯ minor; HT; 2 octaves; solid staccato ♩=60 or broken legato ♩=72 | RC-014 |
| Tonic four-note chords | HT; 2 octaves; broken ♩=104; solid ♩=80 or alternate-note ♩=80; end with I–vi–IV–V⁶₄–V⁸⁻⁷–I | RC-022, RC-023, RC-024, RC-021 |
| Dominant 7th chords, broken and solid | C, D♭, D, E♭, E, F major; HT; 2 octaves; ♩=104 | RC-025, RC-026 |
| Diminished 7th chords, broken and solid | C, C♯, D, E♭, E, F minor; HT; 2 octaves; ♩=104 | RC-027, RC-028 |
| Arpeggios: tonic, dominant 7th, diminished 7th | HT; 4 octaves; root position and inversions; ♩=84 | RC-030, RC-032, RC-034 |
| Ear: intervals | as L8 | RC-054, RC-055 |
| Ear: chords | major/minor four-note chords (root and 1st inversion), augmented triad, dom7, dim7 | RC-052 |
| Ear: chord progressions | each of four chords; I, IV, V, vi / i, iv, V, VI | RC-057 |
| Ear: playback (traditional) | upper part of a two-part phrase; any key up to four sharps or flats; up to nine notes | RC-059 |
| Ear: playback (improvised) | two-bar opening plus antecedent plus consequent; up to two sharps or flats | RC-063 |
| Sight reading: rhythm | 2/4, 3/4, 4/4, 6/8; four to six bars | RC-064, RC-065 |
| Sight reading: playing (traditional) | Level 6 repertoire; up to five sharps or flats; any time signature; up to sixteen bars | RC-070, RC-071, RC-073 |
| Sight reading: playing (lead sheet) | up to four sharps or flats; any time signature; Level 9 Harmony chords ([thy] p.27); creative accompaniment expected | RC-074, RC-075 |
| Keyboard Harmony 9 (optional in place of Level 9 Harmony) | keys up to two sharps or flats ([thy] pp.32–33) | RC-076, RC-078, RC-079, RC-080, RC-081, RC-082, RC-083, RC-084, RC-085 |
| Theory corequisites: Level 8 Theory; Level 9 Harmony (written); Level 9 History | | UNCOVERED: written exams naming no keyboard ability; out of scope |

### Level 10 (pp. 89–93)

| component | parameters | ability ids |
| --- | --- | --- |
| List A: Works by J.S. Bach (preludes and fugues, suites) | | RC-039, RC-044 |
| List B: Classical | | RC-040 |
| List C: Romantic | | RC-041 |
| List D: Post-Romantic, Impressionist, early 20th century | | RC-042 |
| List E: 20th and 21st century | | RC-042 |
| Programme at most 30 minutes | | RC-038 |
| Memory: required, with deduction | | RC-045 |
| Études (two; one may be a popular selection) | | RC-047, RC-048 |
| Four-octave scales | G♭, G, A♭, A, B♭, B major; F♯, G, G♯, A, B♭, B minor; HT; ♩=120 | RC-007, RC-009, RC-010 |
| Scales separated by a 3rd | G♭, G, A♭ major; HT; 4 octaves; ♩=104 | RC-016 |
| Scales separated by a 6th | A, B♭, B major; HT; 4 octaves; ♩=104 | RC-017 |
| Scales in octaves | B♭, B major and minor; HT; 2 octaves; solid staccato ♩=80 or broken legato ♩=92 | RC-014 |
| Chromatic in octaves | from any note F♯–B; HT; 2 octaves; ♩=80 | RC-015 |
| Tonic four-note chords | broken alternate-note ♩=96; solid ♩=120; HT; 2 octaves; end with I–vi–IV–V⁶₄–V⁸⁻⁷–I | RC-024, RC-023, RC-021 |
| Dominant 7th chords | broken alternate-note ♩=96; solid ♩=120 | RC-024, RC-026 |
| Diminished 7th chords | broken alternate-note ♩=96; solid ♩=120 | RC-024, RC-028 |
| Arpeggios: tonic, dominant 7th, diminished 7th | HT; 4 octaves; inversions singly or in sequence; ♩=92 | RC-030, RC-032, RC-034 |
| Ear: intervals | melodic **or** harmonic; adds m9, M9 | RC-054, RC-055 |
| Ear: chords | adds major 7th and minor 7th | RC-052 |
| Ear: chord progressions | each of five; I, IV, V, vi / i, iv, V, VI, plus the cadential ⁶₄ | RC-057 |
| Ear: playback (traditional) | diatonic melody harmonised with LH I, IV, V; any key up to four sharps or flats; four bars | RC-060 |
| Ear: playback (improvised) | opening plus antecedent plus consequent; up to three sharps or flats | RC-063 |
| Sight reading: rhythm | 2/4, 3/4, 4/4, 6/8; four to six bars | RC-064, RC-065 |
| Sight reading: playing (traditional) | Level 7 repertoire; up to five sharps or flats; any time signature; up to sixteen bars | RC-070, RC-071, RC-073 |
| Sight reading: playing (lead sheet) | up to four sharps or flats; Level 10 Harmony chords ([thy] p.29: all diatonic 7ths, V9/V13, applied chords); the p.130 example uses Bm7, E7, Dmaj7 | RC-074, RC-075 |
| Keyboard Harmony 10 (optional in place of Level 10 Harmony & Counterpoint) | keys up to three sharps or flats ([thy] pp.34–35) | RC-076, RC-077, RC-080, RC-081, RC-082, RC-083, RC-084, RC-085 |
| Theory corequisites: Level 8 Theory; Level 9 Harmony; Level 9 History; Level 10 Harmony & Counterpoint; Level 10 History (written) | | UNCOVERED: written exams naming no keyboard ability; out of scope |

**What the out-of-scope written theory would add (not drafted; it needs the orchestrator's decision on scope).** By reading [thy] pp.18–29, the written exams name further abilities done with music, though not at the keyboard. Examples: transpose a melody to any key (Level 7), write a parallel or contrasting period (Levels 5–8), identify cadences, modes, and pentatonic, blues, whole-tone and octatonic scales in a score (Levels 7–8), and write SATB and keyboard-style harmony (Levels 9–10). The brief limited this draft to theory "where they name abilities at the keyboard". If Phase 1a's full set should include notated and analytical abilities, the written theory syllabus is the next RCM source to draft.

## 3. Sources

### Read

| short name | URL | what was read |
| --- | --- | --- |
| [rcm] | https://rcmusic-kentico-cdn.s3.amazonaws.com/rcm/media/main/about%20us/rcm%20publishing/piano-syllabus-2022-edition.pdf | Piano Syllabus, 2022 Edition (132 pp.; the cover also prints "2023 Edition"). Text of the whole file. Page images of pp. 9, 14, 19, 20, 25, 26, 31, 32, 38, 39, 45, 46, 53, 54, 61, 62, 70, 71, 80, 81, 91, 92, 120–123. Text of pp. 3–8 (introduction, lists, substitutions, memory, technical and musicianship rules), the level overview pages 8, 13, 18, 24, 30, 37, 44, 52, 60, 68, 78, 89, and pp. 82, 93 (L9–10 sight playing), 124–131 |
| [thy] | https://rcmusic-kentico-cdn.s3.amazonaws.com/rcm/media/main/documents/examinations/syllabi/s44_theorysyl_2016_online_rcm_v2_f.pdf | Theory Syllabus, 2016 Edition: Level 5 Theory p.18, Level 6 p.21, Level 7 p.23, Level 8 p.25 (chord and harmony sections); Level 9 Harmony p.27; Level 10 Harmony & Counterpoint p.29 (vocabulary); Level 9 Keyboard Harmony pp.32–33; Level 10 Keyboard Harmony pp.34–35 (text) |
| [pop] | https://rcmusic-kentico-cdn.s3.amazonaws.com/rcm/media/main/documents/examinations/syllabi/rcm-popular-selection-list-2025.pdf | Popular Selection List, 2025 Edition: cover and preface (pp. 1–2) only |
| errata page | https://www.rcmusic.com/learning/examinations/academic-resources-and-policies/syllabi-and-syllabi-errata | Fetched; only the site navigation came back (see below) |

### Not accessible or not read

- **The syllabi and errata page** returned navigation only, no page content. So it is **not confirmed** whether errata to the 2022 piano syllabus exist, or whether the 2016 Theory Syllabus is still current. A web search (2026-10-08) found no piano syllabus newer than 2022; the Popular Selection List has a 2025 edition.
- **The musicianship examples, pp. 124–128**, were read as text only (their headings). Their notated examples (clapback, playback, improvisation and progression samples) were rendered but not viewed. The lead-sheet examples on pp. 129–130 were read only as chord-symbol text.
- **The complete repertoire lists** (e.g. pp. 10–12, 15–17, 20–23, … 93–99) were not read item by item. Only the list headings and the entries found by searching for "Sonatina", "Invention", "Sinfonia", "Fugue", "Well-Tempered", "French Suite" and "(complete)" were seen. The repertoire rows (RC-039 to RC-044) therefore rest on list headings plus those entries. What a given list's pieces demand technically (ornaments, Alberti bass, pedalling, voicing) is a property of pieces (Phase 1b) and is not established here.
- **The paid RCM books named as the technical and musicianship sources** were not accessed: *Technical Requirements for Piano* (2015), *Four Star Sight Reading and Ear Tests* (2015), *Celebration Series, Sixth Edition* (Repertoire and Etudes volumes), and RCM Online Ear Training / Sight Reading. In particular, the technical skill each listed étude trains is not named in the syllabus (RC-047).
- **Not read: the ARCT and LRCM diplomas, pp. 100–117.** They are outside Preparatory A–Level 10.
- **Not read: the written theory exams below Level 5** (Preparatory to Level 4 Theory). The piano syllabus names no theory corequisite before Level 5 (corequisites appear first on p.44).
- **Not read: the Level 9 and 10 History syllabi** (no keyboard ability).

## 4. Counts (measured by counting the rows of this file)

| what | count |
| --- | --- |
| Abilities (RC-001 to RC-085) | 85 (scales 17; chords and arpeggios 17; technical conditions 3; repertoire and études 11; ear 15; sight reading 12; Keyboard Harmony 10) |
| Abilities labelled *reading* rather than *syllabus* | 2 (RC-040's sonatina/sonata reading, RC-043's imitative reading); the rest restate the cited page |
| Abilities mapped to an existing A-id (incl. partial) | 58; 27 have none |
| completeness.md RCM lines checked | 32: 20 kept (as written, or kept and split), 12 corrected |
| Coverage lines (components × levels, section 2) | 217 |
| Components covered by at least one ability | 209 |
| Components marked n/a (administrative, nothing the learner does) | 2 |
| Components UNCOVERED | 6, all written-theory corequisites: one line each at L5, L6, L7 and L8; at L9 one line for three exams; at L10 one line for five exams. They are uncovered because they fall outside this brief's scope (they name no keyboard ability), not because an ability is missing |
