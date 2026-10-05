# Direct readable-score addendum for Fable

Source authority for this addendum: `claude/readable-scores@c1556d70`, especially `docs/prompts/runs/readable-scores/MANIFEST-stages-0-1-2-3-4.md` and each song's `.dump.txt` / raw `.musicxml` export. Claude extracted the XML byte-for-byte from the shipped `.mxl`; no conversion was performed.

This file updates `SONG-CANDIDATE-SCORE-READS.md`. It exists because the earlier review had to leave compressed scores as `NEEDS DIRECT READ` or rely on older parsed records. Those scores are now readable directly.

## Rule for Fable

For songs/excerpts, final placement means reading the actual score. Search metadata, difficulty estimates, title matches and detector flags find candidates; they do not approve them. A song can be useful even when it is not mechanically pure, but it should not be counted as teaching a rung's central skill when the score does not actually contain that skill or imports several later systems at once.

Verdicts below use:

- **PRIMARY** — clean first real-song model for the rung.
- **TRANSFER** — useful after a clean model; carries extra demands.
- **STRETCH** — worthwhile repertoire, but materially beyond the rung's first acquisition task.
- **EXCERPT** — full score is too broad/advanced, but a clean passage is plausible.
- **MOVE/REMOVE** — wrong teaching use on this rung.
- **FIX THEN KEEP** — good musical idea with a concrete score defect.

---

# Core-path direct-read updates

## 1.1 — right hand / first C-position reading

### Kum Ba Yah — `song.folk.kum-ba-yah.pdmx`
**Direct shipped-score read.** Eight bars, single treble staff, 4/4, quarters/halves only, range G4–E5, repeated thirds/fifths rather than C-position C4–G4, no fingerings.

**MOVE/REMOVE from 1.1.** Rhythm is simple, but the notation does not reinforce the rung's C-position/finger map. The authored Mary/Ode/Au Clair choices do that job better.

## 1.2 — half/whole notes and rests

### Ah! vous dirai-je, Maman — `song.classical.ah-vous-dirais-je-maman.pdmx`
**Direct shipped-score read.** Sixteen bars, one treble staff, 2/4, only quarters/halves, C4–A4 range, repeated C→G and other position-spanning leaps, no fingerings; chord symbols C/F/G7 are printed over the melody.

**MOVE/REMOVE as a first 1.2 piece.** The rhythm is clean, but it is effectively another Twinkle-family melody with the same range/leap issue and no fingering support. Better later transfer than first long-note reading.

## 1.5 — steps and skips

### The Water Is Wide — `song.folk.the-water-is-wide.pdmx`
**Direct shipped-score read.** Eleven bars, G major, single treble staff, four ties in XML, eighth notes from bar 1 onward, dotted quarters, syncopated-looking figures, range D4–D5.

**MOVE/REMOVE from 1.5.** This directly confirms the earlier audit: too many later rhythm/key facts for the first steps-vs-skips lesson.

## 2.1 — hands together, left hand holds

### Simple Gifts — `song.folk.simple-gifts.pdmx`
**Direct shipped-score read.** Sixteen bars, one treble staff only. The score is RH-only; it contains many eighth notes and several dotted quarters.

**REMOVE from the hands-together pool.** It literally has no left hand. Keep elsewhere if useful, but do not count it toward 2.1 coverage.

## 2.2 — first eighth notes in simple time

### Michael, Row the Boat Ashore — `song.pop.michael-row-the-boat-ashore.pdmx`
**Direct shipped-score read.** Nine bars, C major, one staff, C/F/G symbols. Only two isolated eighth notes occur, both inside dotted-quarter+eighth figures; most of the piece is quarter/half/whole rhythm.

**MOVE/REMOVE as a primary eighth-note song.** It is a weak target example and introduces dotted-quarter rhythm at the same time. Could be later transfer.

### Sakura — `song.folk.sakura.pdmx`
**Direct shipped-score read.** Fifteen bars, 4/4, one staff, five clear eighth-note pairs in bars 4, 6, 8, 10 and 14; otherwise mostly quarters/halves. Chord symbols are Am/Dm/F; range reaches B3–C5; XML has two ties.

**EXCERPT / TRANSFER.** The target is real and repeated. Use a clean excerpt if Fable can avoid the wider range/tie baggage; much better candidate than songs with zero target occurrences.

### Danny Boy — `song.folk.danny-boy-c-major.pdmx`
**Direct shipped-score read.** Seventeen bars, one staff, 4/4. Eighth-note motion is pervasive, but the melody spans A4–E6 and repeatedly mixes dotted quarters with eighths.

**MOVE later / possible later sight-reading transfer.** Excellent eighth-note density but far too wide and rhythmically rich for first eighths.

### Alouette — `song.folk.alouette.pdmx`
**Direct shipped-score read.** Twenty-four bars, F major, 6/8 throughout, with repeated dotted-quarter pulse and compound-meter eighths.

**MOVE to 4.5 compound meter.** It is not the simple-time `1-and-2-and` concept of 2.2.

### Swing Low, Sweet Chariot — `song.folk.anonymous-swing-low-sweet-chariot.pdmx`
**Direct shipped-score read.** Sixteen bars, G major, one staff, many eighths, dotted-quarter figures, C/D7/G symbols, range D4–E5.

**TRANSFER later, not first model.** Real eighth-note material exists, but key signature, dotted rhythm and chord-symbol context make it a better later reading/lead-sheet song.

**2.2 conclusion:** London Bridge remains the cleanest whole-song primary. Sakura is a strong excerpt candidate. The current large option count still overstates honest first-eighth-note coverage.

## 2.3 — first C/F/G block chords

### Happy Birthday (simple) — `song.folk.happy-birthday.simple`
**Direct shipped-score read.** Nine measures including pickup, two staves, C major, C/F/G root-position LH triads. The score prints G-dominant/G7 harmony while the sounding LH on those bars is G–B–D with no seventh. RH has eighth-note pickup figures and a wide G4–G5 range.

**FIX THEN KEEP — PRIMARY/TRANSFER.** This is the one current score that genuinely gives the learner the intended simple LH block-chord task. Fix the visible G7-over-G-triad mismatch for the beginner version.

### Happy Birthday (imported) — `song.folk.happy-birthday`
**Direct shipped-score read.** Eight bars, two staves, judged 4.1. The LH uses more varied/inverted harmony and bar 5 contains the known A# spelling where B-flat is intended.

**MOVE/REMOVE until corrected, then later only.** Not a first-chord arrangement.

### Jingle Bells in G — `song.holiday.jingle-bells.g`
**Direct shipped-score read.** Eight bars, two staves, G major. LH actually writes G, C and D7; D7 sounds D–F#–C.

**MOVE to / KEEP as PRIMARY on 3.2.** Excellent material for primary chords in G and dominant seventh, but deliberately beyond the C/F/G first-chord rung.

### Was wollen wir trinken — `song.folk.was-wollen-wir-trinken.pdmx`
**Direct shipped-score read.** Thirteen bars, one staff, A-minor-oriented harmony (Am/C/Dm/G), forty tuplet markings in raw XML, many eighths and dotted figures.

**MOVE/REMOVE from 2.3.** Wrong harmony and rhythm level; later lead-sheet use is plausible.

### Dark Eyes — `song.folk.dark-eyes.pdmx`
**Direct shipped-score read.** Seventeen bars, D minor, one staff, A7/Bb/Dm/Gm6 symbols, ties and tuplets, chromatic G#/C# figures.

**MOVE/REMOVE from 2.3.** Much later minor/chromatic/harmonic vocabulary.

### Auld Lang Syne — `song.folk.auld-lang-syne.pdmx`
**Direct shipped-score read.** Seventeen measures including pickup, E-flat major with three flats, one staff, Ab/Bb7/Cm/Eb/Fm symbols and many dotted-quarter/eighth figures.

**MOVE/REMOVE from 2.3.** Useful later lead-sheet material, not first C/F/G chords.

### Skip to My Lou — `song.folk.skip-to-my-lou.pdmx`
**Direct shipped-score read.** Eight bars, D major with two sharps, one staff, D/A symbols, repeated eighth pairs.

**MOVE later.** Simple enough musically to be useful, but it teaches D-major reading and a two-chord lead sheet, not first C/F/G block chords.

**2.3 conclusion:** the old count of seven is essentially fake abundance for the rung's actual goal. Keep/fix the simple Happy Birthday and add other intentionally simple C-major C/F/G accompaniments.

## 2.4 — ties, dotted rhythm, dynamics

### Full imported Greensleeves — `song.folk.greensleeves`
**Direct shipped-score read.** Thirty-three bars, two staves, A-minor context, four ties, four tuplets, 14 fingerings, six dynamics, 60 pedal marks, multiple voices, chromatic G#/F# and wide two-hand texture.

**MOVE later / STRETCH.** This is real repertoire with many useful later features, but far too broad for the first ties/dotted-rhythm rung.

### Ga je mee op zoek naar het Koningskind — PDMX
**Direct shipped-score read.** Thirty-two bars, one staff, starts with one sharp then changes to three sharps at bar 25; 18 ties, 33 chord symbols, many eighths, unclear `?` durations in early dump bars, and harmony including B, D7, E7, Fm7, Dsus4.

**MOVE/REMOVE.** Not appropriate beginner tie/dotted material.

### Streets of Laredo — PDMX
**Direct shipped-score read.** Seventeen bars, G major, 3/4, one staff. Repeated dotted-quarter/eighth figures are genuine and easy to see; no ties in XML.

**EXCERPT.** Strong dotted-rhythm passage candidate, but not a tie example and the full score includes G-major reading/range beyond the rung.

### Careless Love — PDMX
**Direct shipped-score read.** Eight bars, D major, one staff, D/A/A7/G symbols, dotted-quarter/eighth figures and eighth-note runs.

**MOVE later / blues transfer.** More natural in the blues track than as first dotted/tie repertoire.

## 2.5 — leaving C position / first scale movement

### Ode to Joy easy variation — `song.classical.beethoven-ode-to-joy.easy`
**Direct shipped-score read.** Seventeen bars, G major, two staves, full LH triads, D2 bass notes, ties, F# key-signature reading and a C# accidental in bar 12. The catalog itself judges it 4.1.

**MOVE/REMOVE from 2.5; keep as Stage-4 transfer.** The authored `ode-to-joy.full` is the much cleaner position-shift song for this rung.

---

# Stage 3 direct-read updates

## 3.1 — sharps, flats and major-scale key signatures

### Korobeiniki — `song.folk.korobeiniki.pdmx`
**Direct shipped-score read.** Sixteen bars, **D minor**, one-flat minor key, one staff, mostly quarter/eighth rhythm.

**MOVE/REMOVE as a primary 3.1 major-key example.** It is perfectly usable music, but it teaches a minor key rather than the rung's major-scale formula. Better candidate for later minor/flat-key work.

### Loch Lomond — `song.folk.loch-lomond.pdmx`
**Direct shipped-score read.** Nine bars, **D major**, two sharps, one staff, many eighth pairs and dotted-quarter figures; range A3–B4.

**KEEP — TRANSFER.** This is genuine major-key reading where F# actually sounds. It is richer than the simplest G/F examples, but it is honest 3.1 transfer.

### Scarborough Fair — `song.folk.scarborough-fair.pdmx`
**Direct shipped-score read.** Nineteen bars, two-sharp signature, one staff, harmony Em/G/D/A/B; melody centers on E and includes C# against the two-sharp signature. This is modal/minor-context material rather than a clean major-scale demonstration.

**MOVE to modal/minor transfer; do not use as PRIMARY for the major-scale formula.** It remains a strong candidate for the separate Dorian/modal pipeline proof.

**3.1 conclusion:** Twinkle F is still the strongest clean F-major transfer; Loch Lomond is a good more advanced sharp-key transfer. Korobeiniki/Scarborough should not inflate major-scale coverage.

## 3.2 — primary chords in G/F and V7

### Oh My Darling Clementine — PDMX
**Direct shipped-score read.** Seventeen bars, F major, two staves, estimated 4.32. Multiple voices/double notes, 21 fingerings, repeated LH chord textures, and score text labels including `V Cmaj7` despite the lesson's simpler primary-chord framing.

**STRETCH, not PRIMARY.** Musically relevant to F-major harmony, but much denser than the authored Jingle Bells G / Saints F pair.

### Yankee Doodle — PDMX
**Direct shipped-score read.** Sixteen bars, G major, two staves, estimated 3.96. LH uses dyads, single bass notes and first-inversion material; score text explicitly calls out first inversion and IV first inversion.

**TRANSFER/STRETCH.** Good later harmony application, but it introduces inversion/voicing ideas beyond a clean first I/IV/V7 example.

**3.2 conclusion:** the two authored pieces are already the best first models. Keep PDMX pieces as later transfer rather than treating all five options as equivalent.

## 3.4 — ledger lines and wider two-hand reading

### Petzold Minuet in G — both editions
**Direct shipped-score read.** Thirty-two bars, two staves, broad range including RH B5, constant eighth-note passagework, independent voices in later bars, C# accidentals, LH down to G2. Both catalog entries are the same work/edition alternatives and are judged 5.1.

**KEEP — STRETCH / repertoire goal, not first ledger-line model.** Count the work once for pedagogical breadth. It is excellent real repertoire but materially harder than a first wider-reading exercise.

### Für Elise (easy) — `song.classical.beethoven-fur-elise.easy`
**Direct shipped-score read.** Twenty-two bars, two staves, A-minor context, pervasive eighths, chromatic D#/G#, broad RH range and bass down to A1; judged 4.1.

**KEEP — TRANSFER/STRETCH.** Good wider-range/chromatic reading after acquisition, not the first ledger-line teaching song.

**3.4 conclusion:** current repertoire goals are attractive but aggressive. Fable should add at least one genuinely simpler real/excerpted ledger-line piece instead of assuming these are beginner-first examples.

## 3.5 — sustain pedal

### Schumann Op. 68 No. 4 Chorale — PDMX
**Direct shipped-score read.** Thirty-two bars, two staves, genuine four-voice chorale texture, 96 fingerings, one dynamic, four ties, estimated 4.96, **zero pedal marks**.

**KEEP only as STRETCH/added-pedal repertoire.** It does not teach reading pedal notation.

Together with the already-read Ode/Greensleeves options, the rung still has **zero printed pedal marks across its song pool**. If pedal notation is an intended outcome, add a score/excerpt that actually prints pedal. Otherwise explicitly frame the songs as places where the learner adds pedal by instruction/ear.

## 3.6 — broken chords / Alberti / waltz bass

No change to the earlier conclusion: `Greensleeves (waltz bass)` is a real, clean waltz-bass example. The rung still lacks a verified Alberti song/excerpt and a verified ordinary broken-chord song/excerpt. Use actual score reads of the K.545/Clementi candidates and easy Canon passage rather than a broad accompaniment detector.

---

# Selected Stage 4 direct-read updates

## 4.2 — flat keys and minor scales

### Bella Ciao — imported
**Direct shipped-score read.** Thirty-eight bars, two staves, 62 ties, 64 chord symbols, 457 multi-voice events. The score changes key signature from one sharp to four flats at bar 11 and to three sharps at bar 21, with dense broken-chord accompaniment and extended/altered harmony.

**STRETCH, not a first flat/minor-scale song.** Interesting repertoire, but it demonstrates modulation and substantial arrangement complexity rather than a clean first flat/minor reading task.

## 4.3 — arpeggios and inversions

### Schumann Melody, Op. 68 No. 1 — PDMX
**Direct shipped-score read.** Twenty bars, two staves. LH carries continuous eighth-note broken-chord/arpeggiated motion through most bars; RH is independent melody with occasional chords/voices. Estimated 5.03.

**KEEP — strong TRANSFER/STRETCH.** This actually demonstrates the target texture and is much more honest 4.3 repertoire than a title-only assignment. It is just not a first acquisition exercise.

## 4.5 — compound time / triplets / syncopation

### Greensleeves in 6/8 — authored
**Direct shipped-score read.** Sixteen bars, two staves, genuine 6/8 throughout, A-minor/E7/G harmony, dotted-quarter pulse, compound eighth subdivisions, 52 shipped fingerings.

**KEEP — PRIMARY/TRANSFER for 6/8 after the known ABC fingering-loss defect is fixed.** Musically it fits the rung very well; correctness of the current fingering export is the blocker.

### When Johnny Comes Marching Home — PDMX
**Direct shipped-score read.** Seventeen bars, one staff, 6/8 throughout, clear dotted-quarter pulse and compound subdivision; Am/C/Em/G symbols, 16 ties in XML.

**KEEP — TRANSFER.** Honest compound-meter repertoire; one-staff/lead-sheet nature makes it different from the two-hand Greensleeves setting.

### London Bridge
Already directly read as 4/4. **Do not count it as compound-meter coverage.** It may remain only if the rung explicitly wants a comparison/control song.

## 4.6 — sight-reading / phrasing capstone

### Canon in D (easy)
**Direct shipped-score read.** Forty-nine bars, two staves, judged 5.1. Starts with continuous LH eighth-note broken-chord figures; later adds broad RH range and eventually dense sixteenth-note passagework (bars 37–44).

**KEEP — STRETCH / project repertoire, not routine sight-read.** Excellent future repertoire and a useful broken-chord excerpt source, but the full file is much too long/dense to represent an ordinary Stage-4 sight-read.

### Auld Lang Syne (two-hand PDMX)
**Direct shipped-score read.** Twenty bars, F major, four-voice/two-hand chordal texture, estimated 5.11, including chromatic G#/C# moments.

**STRETCH.** Not a casual capstone sight-read for a learner who just reached Stage 4.

### Uti vår hage
**Direct shipped-score read.** Eighteen bars, F minor with four flats, two staves, dynamics, dotted figures and sixteenth-note ornaments; estimated 4.66.

**TRANSFER/STRETCH.** More realistic Stage-4 capstone than the 5.1 pieces but still not a trivial first-read.

### Carol of the Bells (easy)
**Direct shipped-score read.** Forty bars, two staves, judged 5.1. Highly repetitive opening motif but later range expansion, accidentals and two-hand texture.

**STRETCH / memory-project candidate rather than ordinary sight-read.**

**4.6 conclusion:** the current capstone list leans heavily toward project repertoire. Fable should distinguish `sight-read now` from `learn as a Stage-4 project`; those are not the same pedagogical use.

## 4.7 — learning from memory

Harder pieces are acceptable here because the skill is memory practice on already-known material. Reuse of Für Elise / Petzold / Canon is defensible **if the learner has already learned the piece**. Do not use 4.7 placement as evidence those files were appropriately introduced on earlier rungs.

---

# What this changes for Fable

1. **Do not redesign the curriculum.** The spine is mostly sound; song placement is the weaker layer.
2. **Do not trust option counts.** Several rungs have nominal abundance but only one or two honest target pieces.
3. **Use primary / transfer / stretch distinctions.** A hard but relevant piece does not need deletion; it just should not masquerade as the learner's first example.
4. **Use excerpts aggressively.** Sakura, Streets of Laredo and Canon are already obvious examples where the full score is broader than the useful teaching passage.
5. **Read every final song/excerpt.** There are only 323 distinct curriculum songs total in Claude's export, and far fewer core-path decisions. That scale is small enough for actual score review.
6. **Exercises/drills can wait.** They are mechanically easier to inventory and verify; the song layer is where direct score reading gives the biggest immediate return.

## Immediate core repairs suggested by direct reads

- fix/simplify early authored pieces already identified in `SONG-CANDIDATE-SCORE-READS.md`;
- rebuild 2.2 around honest simple-time eighth material;
- rebuild 2.3 around simple C/F/G block-chord arrangements;
- add a simpler ledger-line real song/excerpt before Petzold/Für Elise on 3.4;
- add actual pedal-marked repertoire if 3.5 teaches pedal notation;
- fill 3.6 with verified Alberti + broken-chord transfer;
- move Alouette to 4.5;
- separate Stage-4 `sight-read` pieces from harder `project/stretch` repertoire.

This addendum should be read together with `SONG-CANDIDATE-SCORE-READS.md`, `PACKET.md`, and the readable-score export at `claude/readable-scores@c1556d70`.