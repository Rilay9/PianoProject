# Direct song score review — core Stages 1–2

Research/review only. No production placement changes are made here.

Authority for compressed/imported scores: `claude/readable-scores` at `c1556d70`, especially `docs/prompts/runs/readable-scores/MANIFEST-stages-0-1-2-3-4.md` and the per-song `.dump.txt` / unchanged `.musicxml` files. Authored pieces were also read from their committed source earlier in this pass. Do not substitute title, metadata, detector output, or estimated level for these score reads.

This chunk deliberately covers the core skill spine only: 1.1–1.5 and 2.1–2.5. Practice/holiday/hymn side rungs and later stages are separate chunks.

Verdicts:

- **KEEP — PRIMARY**: good first/clean model for the rung.
- **KEEP — TRANSFER**: useful after a cleaner model, but carries extra difficulty.
- **EXCERPT**: full piece is not clean enough; mine a suitable passage if one exists.
- **FIX THEN KEEP**: musical idea is useful but current notation/arrangement has a concrete defect.
- **MOVE/REMOVE**: wrong current teaching use.

The goal is not purity for its own sake. A piece may contain small incidental demands. The question is whether it is a sensible learner-facing song for the rung it is supposed to teach.

---

## 1.1 — Right hand C position

### `song.folk.hot-cross-buns` — Hot Cross Buns
**MOVE/REMOVE as currently written; author a true 1.1 variant.**

The current authored arrangement contains a full bar of eighth notes. That defeats the sequence because eighths are introduced at 2.2. The tune itself is ideal; the arrangement is not. Make the repeated-note bar quarters/halves for the 1.1 version and keep the current rhythmic version later.

### `song.folk.mary-had-a-little-lamb` — Mary Had a Little Lamb
**KEEP — PRIMARY.**

Eight bars, C-position, quarter/half rhythm, mostly steps/repeats. One small third is harmless here.

### `song.folk.merrily-we-roll-along` — Merrily We Roll Along
**KEEP — PRIMARY, but pedagogically redundant with Mary.**

Same melodic family and same basic demand. Do not count Mary + Merrily as two distinct kinds of coverage.

### `song.folk.au-clair-de-la-lune` — Au Clair de la Lune
**KEEP — PRIMARY.**

Very small C/D/E pitch set, simple quarters/halves/whole values, no later meter/key/rhythm demand.

### `song.classical.ode-to-joy.rh` — Ode to Joy (theme)
**KEEP — PRIMARY; strongest current clean 1.1 song.**

C–G range, repeated notes and steps, quarter/half rhythm, no eighths or key surprises.

### `song.folk.kum-ba-yah.pdmx` — Kum Ba Yah
**MOVE/REMOVE from 1.1.**

Direct exported dump at `c1556d70`: eight bars, one treble staff, 4/4, quarters/halves only, but range G4–E5 and large repeated thirds/fifths (`G-B-D`) rather than C-position finger mapping. No fingerings. It is a perfectly valid easy melody, just not a good first C-position teaching file.

**Rung call:** healthy after removing the fake count. Mary, Au Clair and Ode are enough good models; fix Hot Cross Buns rather than padding with Kum Ba Yah.

---

## 1.2 — Half notes, whole notes and rests

### `song.folk.lightly-row` — Lightly Row
**KEEP — PRIMARY/TRANSFER.**

Clean quarter/half-note phrasing. Several thirds preview steps/skips but do not introduce a new notation system.

### `song.holiday.jingle-bells.rh` — Jingle Bells (chorus)
**KEEP — PRIMARY.**

C-position, quarters/halves/whole-note length, repeated-note reading, no eighths.

### `song.folk.twinkle.rh` — Twinkle, Twinkle, Little Star
**MOVE/REMOVE as a primary 1.2 song; later transfer is fine.**

Spans beyond the five-finger position and explicitly requires hand movement for A. Useful music, wrong early job.

### `song.folk.frere-jacques` — Frère Jacques
**MOVE/REMOVE from 1.2.**

Contains explicit eighth-note runs and a lower G outside the intended position. Better later.

### `song.classical.ah-vous-dirais-je-maman.pdmx` — Ah! vous dirai-je, Maman
**MOVE/REMOVE from 1.2.**

Direct exported dump: 16 bars, 2/4, one treble staff, quarter/half notes and C/F/G7 chord symbols. Melody spans C4–A4 and repeatedly leaps C–G/A. It duplicates the Twinkle melody family while importing the same range/leap issue. Good library/transfer material, not another clean long-note starter.

**Rung call:** Jingle Bells and Lightly Row are good. Add one or two genuinely simple long-note/rest pieces instead of counting Twinkle/Frère/Ah-vous as equivalent fits.

---

## 1.3 — Left hand C position and bass clef

### `song.folk.hot-cross-buns.lh`
**MOVE/REMOVE as currently written; fix the rhythm.**

It repeats the RH version’s full eighth-note bar in the first LH/bass-clef lesson. A quarter-note version is the obvious repair.

### `song.folk.mary-had-a-little-lamb.lh`
**KEEP — PRIMARY.**

Bass staff, C3–G3 position, simple rhythm and clear fingering.

### `song.classical.ode-to-joy.lh`
**KEEP — PRIMARY; strongest 1.3 choice.**

Straightforward bass-clef repeated/stepwise reading in the intended hand position.

**Rung call:** strong once Hot Cross Buns is repaired.

---

## 1.4 — Grand staff and hands alternating

### `song.classical.ode-to-joy.alternating`
**KEEP — PRIMARY.**

Exactly the teaching texture: RH phrase then LH phrase; no overlap.

### `song.folk.when-the-saints.alternating`
**KEEP — TRANSFER.**

Genuinely alternates hands, with slightly less minimal pickup/rest phrasing. Good second example.

### `song.folk.lightly-row`
**MOVE/REMOVE.**

The shipped/source arrangement is one-staff/right-hand material. It does not demonstrate alternating hands and cannot count toward this rung merely because it is easy.

**Rung call:** currently only two genuine song options. Add/author a third if desired rather than keeping Lightly Row as filler.

---

## 1.5 — Steps and skips, first sight-reading habit

### `song.folk.lightly-row`
**KEEP — PRIMARY.**

Repeatedly contrasts seconds and thirds in a small range. Best current target song.

### `song.classical.ode-to-joy.rh`
**KEEP — CONTROL/TRANSFER.**

Mostly steps/repeats; useful as the stepwise side of the comparison, but weak as skip practice.

### `song.folk.old-macdonald`
**KEEP — TRANSFER only.**

Contains larger leaps and spans a sixth. Useful after the learner knows what a skip is, not as the clean first discrimination example.

### `song.folk.the-water-is-wide.pdmx` — The Water Is Wide
**MOVE/REMOVE from 1.5.**

Direct exported dump: G major, 11 bars, one treble staff, eighths, dotted quarters, ties and range D4–D5. Those are later demands. It is not a first steps/skips song.

**Rung call:** Lightly Row is the clean target. Find another genuine step/skip tune rather than using Water Is Wide.

---

# Stage 2

## 2.1 — Hands together: the left hand holds

### `song.classical.ode-to-joy.ht`
**KEEP — PRIMARY.**

Moving RH over long C/G LH notes; only cadence bars split the LH into halves. Excellent first coordination song.

### `song.folk.mary-had-a-little-lamb.ht`
**KEEP — PRIMARY; probably the purest example.**

One whole-note LH pitch per bar under the melody.

### `song.holiday.jingle-bells.ht`
**KEEP — TRANSFER.**

Starts with whole-note LH and later introduces half-bar changes. Good progression after Mary/Ode.

### `song.folk.twinkle.ht`
**KEEP — TRANSFER, not first model.**

LH changes twice within many bars and RH covers a wider span. Useful next step after the held-note cases.

### `song.folk.simple-gifts.pdmx` — Simple Gifts
**MOVE/REMOVE from 2.1.**

Direct exported dump: 16 bars, one treble staff only, no LH at all, with many eighth notes and dotted-quarter rhythm. It literally cannot teach hands together / held LH.

**Rung call:** genuinely strong once Simple Gifts is removed. No need to inflate the count.

---

## 2.2 — Eighth notes in simple time

### `song.folk.london-bridge`
**KEEP — PRIMARY.**

Clear recurring eighth-note pair in simple meter, with a simple held LH. There is a modest RH position move, but the target rhythm is obvious and repeated.

### `song.folk.merrily-we-roll-along`
**MOVE/REMOVE.**

Contains no eighth notes.

### `song.folk.old-macdonald`
**MOVE/REMOVE.**

Contains no eighth notes.

### `song.pop.michael-row-the-boat-ashore.pdmx`
**KEEP — TRANSFER or EXCERPT, not primary.**

Direct exported dump: only two isolated eighth notes, both following dotted quarters; 4/4, one staff, C/F/G chord symbols. It technically contains the target but mostly teaches dotted-quarter/eighth rhythm rather than repeated “1-and-2-and” subdivision.

### `song.folk.sakura.pdmx`
**EXCERPT / KEEP — TRANSFER.**

Direct exported dump: 15 bars in 4/4 with five clear eighth-note pairs at bars 4, 6, 8, 10 and 14. This is real target material. Full piece also spans B3–C5, contains ties and minor-harmony symbols, so a short excerpt is preferable for first use.

### `song.folk.danny-boy-c-major.pdmx`
**MOVE/REMOVE from first-eighths work.**

Direct exported dump: eighth-note saturation is real, but the melody ranges A4–E6 and repeatedly uses dotted-quarter/eighth figures. Too broad and rhythmically loaded for the first eighth-note rung.

### `song.folk.alouette.pdmx`
**MOVE to compound-meter work around 4.5.**

Direct exported dump: 24 bars in 6/8, one-flat key. The eighths belong to compound meter, not the simple-time subdivision this rung teaches.

### `song.folk.anonymous-swing-low-sweet-chariot.pdmx`
**KEEP — TRANSFER, not primary.**

Direct exported dump: 16 bars in 4/4 with abundant repeated eighth-note groups, but G major, chord symbols including D7, dotted quarters and wider range. Musically useful after the simple model.

**Rung call:** London Bridge is the one obvious clean whole-song model. Sakura is a strong excerpt candidate. Add at least one more simple-time beginner tune rather than pretending all eight current titles do the same job.

---

## 2.3 — First chords: C, F and G

### `song.folk.happy-birthday.simple`
**FIX THEN KEEP — PRIMARY.**

Direct exported dump: two-staff C-major arrangement, 9 measures, long LH block triads. C/F/G pitch content is exactly the intended family. However its chord symbols label the G triad as `Gdominant` / G7 even while the LH notes are G–B–D, not a seventh chord. Fix the symbol/semantic mismatch. It also has an eighth-note pickup and a wide RH melody, so this is not the absolute easiest notation, but the chord task itself is sound.

### `song.folk.happy-birthday` — imported version
**MOVE/REMOVE from 2.3.**

Direct exported dump: judged level 4.1; uses G7-type voicings, multiple voices, wider accompaniment and a clearly wrong A-sharp spelling in bar 5. This is not the beginner C/F/G block-chord file.

### `song.holiday.jingle-bells.g`
**MOVE to 3.2 / KEEP there.**

Direct exported dump: excellent block-chord arrangement, but it is explicitly in G major with C and D-dominant harmony. Its own judged level is 3.2. It is a strong Stage-3 primary-chord song, not a Stage-2 first-C/F/G model.

### `song.folk.was-wollen-wir-trinken.pdmx`
**MOVE/REMOVE from 2.3.**

Direct exported dump: one-staff 3/4 melody in A minor with 40 tuplet elements and Am/C/Dm/G symbols. No written LH block chords. Wrong harmony and texture for the rung.

### `song.folk.dark-eyes.pdmx`
**MOVE/REMOVE.**

Direct exported dump: D minor, A7/Bb/Dm/Gm6 harmony, tuplets, ties and chromatic G#/C#. One staff. Clearly later material.

### `song.folk.auld-lang-syne.pdmx`
**MOVE/REMOVE.**

Direct exported dump: E-flat major with three flats and Ab/Bb7/Cm/Eb/Fm chord symbols; one-staff lead-sheet texture. Not first C/F/G block-chord work.

### `song.folk.skip-to-my-lou.pdmx`
**MOVE/REMOVE from 2.3; possible later lead-sheet transfer.**

Direct exported dump: D major, two sharps, one treble staff, A/D chord symbols only. No LH block chords.

**Rung call:** current abundance is mostly fake. `happy-birthday.simple` is the only current song close to the intended Stage-2 first block-chord task, and it needs a notation fix. Add/author 2–3 simple C-major two-staff C/F/G arrangements rather than retaining unrelated lead sheets.

---

## 2.4 — Ties, dotted rhythms and dynamics

This rung currently mixes several different ideas, so songs should not all be expected to demonstrate every one. The current problem is that some choices also import much later harmony/notation.

### `song.folk.greensleeves.simple`
**KEEP — TRANSFER for dotted rhythm; better home is 3.3 for harmony.**

Direct exported dump: 16-bar two-staff A-minor arrangement, judged 2.4. Dotted-quarter/eighth figures are clear and recurrent. But bars 6–7 and 14 use G#/F# over E major, so the score already depends on harmonic-minor / dominant-minor vocabulary taught explicitly at 3.3. It is musically useful but not a clean first 2.4 song.

### `song.folk.greensleeves`
**MOVE to 3.3+; not a 2.4 teaching piece.**

Direct exported dump: full 33-bar arrangement, judged 5.1, two staves, four tuplets, ties, dynamics, 60 pedal marks, polyphony and chromatic minor harmony. Valuable repertoire, far beyond this rung.

### `song.folk.greensleeves.chords`
**MOVE to 3.3; KEEP there.**

Direct exported dump: judged 3.3, two staves, explicit Am/G/E-dominant harmony with G#/F#. Excellent minor-harmony transfer piece; not a Stage-2 dotted-rhythm starter.

### `song.folk.ga-je-mee-op-zoek-naar-het-koningskind.pdmx`
**MOVE/REMOVE from 2.4.**

Direct exported dump: 32 bars, key change from one sharp to three sharps, large chord vocabulary including sus, sevenths, minor chords, and several bars whose durations do not even dump as ordinary simple values. Estimated 3.39. Too much later material.

### `song.folk.streets-of-laredo.pdmx`
**KEEP — PRIMARY/TRANSFER for dotted rhythm.**

Direct exported dump: one-staff G-major 3/4 melody, 17 bars, recurring dotted-quarter/eighth figures and some eighth pairs. No chord symbols, tuplets, pedal, or polyphony. The one-sharp key is a mild preview, but this is much cleaner than most current 2.4 choices.

### `song.pop.careless-love-blues.pdmx`
**KEEP — TRANSFER / possible excerpt.**

Direct exported dump: 8 bars, D major, one-staff melody with recurring dotted-quarter/eighth figures and A/A7/D/G symbols. Useful rhythmic transfer but key/harmony belong later than the clean first model.

### `song.folk.cielito-lindo.simple`
**MOVE later / EXCERPT only for 2.4.**

Direct exported dump: 32-bar two-staff arrangement, judged level 3.0, with C/Dm/F/G/G7 harmony and 26 ties. It does provide abundant tie practice, but the full arrangement is already a larger harmonic/coordination task than a first Stage-2 notation lesson.

**Rung call:** Streets of Laredo is the cleanest existing real-song fit for dotted rhythm. Cielito can provide tie-rich excerpts. The rung still needs a very simple dynamics-marked song because several current files contain zero dynamics.

---

## 2.5 — Leaving C position: thumb under and the first scale

### `song.classical.ode-to-joy.full`
**KEEP — PRIMARY.**

Direct exported dump: judged 2.5, two staves, C major, mostly simple C/G held LH with RH movement extending down to G3. Eighths occur in a few phrase turns, but the overall arrangement is coherent with moving beyond fixed C position and a first broader keyboard range. Strong current fit.

### `song.classical.beethoven-ode-to-joy.easy`
**MOVE to Stage 4; remove from 2.5.**

Direct exported dump: its own judged level is 4.1. Two staves in G major; full LH triads, D2 bass notes, ties, chromatic C# in bar 12 and broader two-hand accompaniment. This is not a first “leave C position / first scale” song despite the title “easy variation.”

**Rung call:** the authored full-theme Ode is good. Add another piece that visibly rewards a scale/position crossing rather than using the Stage-4 arrangement as a second option.

---

# Stage 1–2 summary for Fable

The main issue is not lack of songs. It is that counts currently include songs that do not perform the rung’s job.

Highest-priority corrections from this chunk:

1. Repair the two Hot Cross Buns beginner arrangements so 1.1/1.3 do not introduce eighths early.
2. Remove non-alternating Lightly Row from 1.4.
3. Remove one-staff Simple Gifts from the 2.1 hands-together pool.
4. Rebuild 2.2 around London Bridge + a Sakura excerpt + one or two additional simple-time eighth-note tunes.
5. Rebuild 2.3 around actual written C/F/G block-chord arrangements. Fix the `happy-birthday.simple` G-vs-G7 symbol error; move the G-major Jingle Bells arrangement to 3.2 where it belongs.
6. Use Streets of Laredo as the cleanest current 2.4 dotted-rhythm song; use excerpts for tie-heavy pieces rather than forcing full later-level arrangements onto the rung.
7. Keep `ode-to-joy.full` at 2.5; remove the judged-4.1 “easy variation” from that rung.

Do not regenerate or redesign the curriculum around these findings. Fix placements/files and fill the few real gaps with better repertoire.