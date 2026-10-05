# Song candidate score reads for Fable

Research/review only. No placement changes are made here.

This is the score-by-score pass the project should have done earlier: for the relatively small set of songs that are actually candidates for a curriculum rung, read the music and decide whether the song really does that rung's job. Search metadata, level estimates and detector flags are candidate-finding evidence, not the decision.

## Evidence labels

- **DIRECT SOURCE READ** — I read the committed authored ABC score itself in this pass. These are the notes that build the MusicXML.
- **PARSED MXL RECORD** — the repository already contains a `dump_score.py`, direct-XML census, or rung-claims/lesson-audit record produced from the built `.mxl`. I read that record in this pass. I am not pretending GitHub's text interface opened the compressed `.mxl` for me.
- **NEEDS DIRECT MXL READ** — current placement exists, but I do not yet have enough note-level evidence to make the teaching-use call. Do not infer approval from the fact that it is on a rung.

Verdicts:

- **KEEP — PRIMARY**: good first/clean model for the rung.
- **KEEP — TRANSFER**: useful after the clean model, but carries extra difficulty.
- **EXCERPT**: the full file is not clean enough for the rung; mine/cut a suitable passage if one exists.
- **FIX THEN KEEP**: the musical idea is useful but the current notation/arrangement has a concrete problem.
- **MOVE/REMOVE**: the current rung is the wrong teaching use.
- **NEEDS DIRECT READ**: no teaching verdict yet.

The point is not to force every song to be mechanically pure. A small incidental skip is different from putting 6/8, chromatic notes, ledger lines, triplets or a whole later harmony vocabulary onto a beginner rung. The question is whether the piece is a sensible **teaching option for this rung**, not whether a detector can find every fact in it.

---

# Core path

## 1.1 — first notes / C-position / basic quarter-half-whole reading

### `song.folk.hot-cross-buns` — Hot Cross Buns
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/hot-cross-buns.abc`.

**MOVE/REMOVE from 1.1 as currently written.** Bars 1–2 and 4 are simple quarter/half material, but bar 3 is eight consecutive eighth notes (`C C C C D D D D` with `L:1/8`). Eighths are not the point until 2.2. This is a good tune, but this arrangement defeats the early-rhythm sequence. Easiest fix: author a quarter-note 1.1 variant and keep this version for 2.2.

### `song.folk.mary-had-a-little-lamb` — Mary Had a Little Lamb
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/mary-had-a-little-lamb.abc`.

**KEEP — PRIMARY.** Eight bars, C-position, quarters/halves, mostly stepwise/repeated. There is an E→G third in bar 4, so it is not an interval-purity exercise, but it is a reasonable first tune and materially cleaner than several alternatives.

### `song.folk.merrily-we-roll-along` — Merrily We Roll Along
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/merrily-we-roll-along.abc`.

**KEEP — PRIMARY, but redundant with Mary.** Same melodic family and essentially the same difficulty: quarter/half rhythm, C-position, one small skip. Do not count Mary + Merrily as two kinds of pedagogical coverage merely because they have two titles.

### `song.folk.au-clair-de-la-lune` — Au Clair de la Lune
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/au-clair-de-la-lune.abc`.

**KEEP — PRIMARY.** Uses only C/D/E, quarters/halves/whole, eight bars. It has C→E skips, but no later rhythm or range problem. Very clean early repertoire.

### `song.classical.ode-to-joy.rh` — Ode to Joy (theme)
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/ode-to-joy-rh.abc`.

**KEEP — PRIMARY; strongest clean 1.1 song in the current set.** C–G, quarter/half notes, repeated notes and steps, eight bars, no eighths or key/range surprises.

### `song.folk.kum-ba-yah.pdmx` — Kum Ba Yah
**Evidence: PARSED MXL RECORD** — `docs/prompts/rung-claims.md` records untaught skip/leap/range-beyond-position on 1.1; `docs/lesson-audit/batch-1.md` also records that this file has 0 fingerings on 26 notes.

**MOVE/REMOVE.** It is a worse beginner teaching file than the authored alternatives: wider/leaping notation and no fingering at the very point the course is establishing position/finger mapping.

**Rung verdict:** enough good material remains, but Hot Cross Buns needs a simplified 1.1 version and Kum Ba Yah should not be used to make the count look fuller.

---

## 1.2 — longer note values / rests / phrasing

### `song.folk.lightly-row` — Lightly Row
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/lightly-row.abc`.

**KEEP — PRIMARY/TRANSFER.** Clean quarters and half notes with repeated phrase shapes. It does contain several thirds (G→E, F→D, C→E→G), so it previews the later steps/skips lesson, but it does not import a later rhythm/meter/key.

### `song.holiday.jingle-bells.rh` — Jingle Bells (chorus)
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/jingle-bells-rh.abc`.

**KEEP — PRIMARY.** Eight bars, C-position, quarters/halves/whole-note length, repeated notes, no eighths. Strong fit.

### `song.folk.twinkle.rh` — Twinkle, Twinkle, Little Star
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/twinkle-rh.abc`; rung-claims also marks leap + range-beyond-position as untaught on 1.2.

**MOVE/REMOVE as a primary 1.2 song; potentially KEEP — TRANSFER later.** It spans C4–A4, explicitly moves the hand for A, and repeatedly leaps C→G. Those are useful skills, but they are not the point of 1.2 and the course has not taught position movement yet.

### `song.folk.frere-jacques` — Frère Jacques
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/frere-jacques.abc`; rung-claims also flags eighths/shorter-than-quarter, range and leaps.

**MOVE/REMOVE from 1.2.** Bars 5–6 contain explicit eighth-note runs (`G/F/E/D/`), and the closing bell figure drops to G below middle C. This is a nice later tune but not a clean long-note beginner song.

### `song.classical.ah-vous-dirais-je-maman.pdmx` — Ah! vous dirai-je, Maman
**Evidence: PARSED MXL RECORD** — rung-claims marks leap + range-beyond-position untaught on 1.2.

**MOVE/REMOVE pending a better later use.** It duplicates the Twinkle melody family while carrying the same range/leap problem.

**Rung verdict:** Jingle Bells and Lightly Row are good. The rung needs one or two additional genuinely simple long-note/rest pieces rather than counting Twinkle/Frère/Ah-vous as equivalent fits.

---

## 1.3 — left hand C-position / bass clef

### `song.folk.hot-cross-buns.lh`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/hot-cross-buns-lh.abc`.

**MOVE/REMOVE as currently written.** It repeats the right-hand version's bar of eight eighth notes, now in the LH. That imports 2.2 rhythm into the first bass-clef lesson. A quarter-note LH variant would be trivial to author and would solve this cleanly.

### `song.folk.mary-had-a-little-lamb.lh`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/mary-had-a-little-lamb-lh.abc`.

**KEEP — PRIMARY.** Bass staff, C3–G3 position, quarter/half/whole rhythm, clear fingering. One E→G skip is incidental rather than a new notation system.

### `song.classical.ode-to-joy.lh`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/ode-to-joy-lh.abc`.

**KEEP — PRIMARY; strongest current 1.3 choice.** Straightforward bass-clef stepwise/repeated reading in the intended hand position.

**Rung verdict:** good foundation, but replacing/fixing Hot Cross Buns would restore three genuinely appropriate song choices.

---

## 1.4 — grand staff / hands alternating

### `song.folk.lightly-row`
**Evidence: DIRECT SOURCE READ** — same one-staff/right-hand source as 1.2.

**REMOVE from this rung.** It is not an alternating-hands arrangement at all. It cannot demonstrate the rung's central task merely because it is easy.

### `song.classical.ode-to-joy.alternating`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/ode-to-joy-alternating.abc`.

**KEEP — PRIMARY.** Exactly the intended texture: RH plays four bars, LH answers four bars, and the hands never overlap.

### `song.folk.when-the-saints.alternating`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/oh-when-the-saints-alternating.abc`.

**KEEP — TRANSFER.** It really does alternate hands, but includes a pickup/rest-led phrase structure that is less clean than Ode to Joy. Good second example.

**Rung verdict:** currently only two real alternating-hand songs. Add/author one more instead of using Lightly Row to satisfy a number.

---

## 1.5 — steps vs skips / first sight-reading habit

### `song.classical.ode-to-joy.rh`
**Evidence: DIRECT SOURCE READ.**

**KEEP — CONTROL, not the main target.** Mostly steps/repeats; useful as the 'this is what stepwise feels like' side of the contrast, but weak as skip practice.

### `song.folk.lightly-row`
**Evidence: DIRECT SOURCE READ.**

**KEEP — PRIMARY.** Repeatedly mixes seconds and thirds in a very small range. This is the best current real tune for the actual steps-vs-skips target.

### `song.folk.old-macdonald`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/old-macdonald.abc`; rung-claims flags leap + range-beyond-position.

**KEEP — TRANSFER only.** It spans a sixth and has C→G leaps. That is useful once the learner knows steps/skips and is seeing what a larger leap looks like, but it is not a clean first discrimination piece.

### `song.folk.the-water-is-wide.pdmx`
**Evidence: PARSED MXL RECORD** — rung-claims records leap, eighths/shorter values, dotted quarter, ties, syncopation, key signature and range-beyond-position as untaught at 1.5.

**MOVE/REMOVE.** Far too much later notation for this rung.

**Rung verdict:** Lightly Row is the good target piece. Find another genuine step/skip tune rather than using Water Is Wide.

---

## 2.1 — hands together, moving RH over held/simple LH

### `song.classical.ode-to-joy.ht`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/ode-to-joy-ht.abc`.

**KEEP — PRIMARY.** RH moves over LH C/G whole notes; only the cadence bars split the LH into halves. Excellent first coordination song.

### `song.folk.mary-had-a-little-lamb.ht`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/mary-had-a-little-lamb-ht.abc`.

**KEEP — PRIMARY.** Every LH bar is one whole note (C or G). Probably the purest current example.

### `song.holiday.jingle-bells.ht`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/jingle-bells-ht.abc`.

**KEEP — TRANSFER.** First half is whole-note LH; later bars introduce half-bar C/G/F changes. Good progression after Mary/Ode.

### `song.folk.twinkle.ht`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/twinkle-ht.abc`; rung-claims marks range-beyond-position.

**KEEP — TRANSFER, not the first model.** LH changes twice inside many bars and the RH shifts for the sixth-span melody. Useful after the simpler held-note pieces.

### `song.folk.simple-gifts.pdmx`
**Evidence: PARSED MXL RECORD** — `docs/lesson-audit/batch-1.md` directly read the built file: one treble staff only, no LH; 45 eighths, 31 quarters, 4 halves, five dotted quarters; largest interval a fifth. Rung-claims also flags eighths/dotted/range as untaught.

**REMOVE from 2.1's hands-together song pool.** It literally has no left hand. It can live in the Library or a later RH-reading rung, but it cannot count as evidence that 2.1 has another coordination song.

**Rung verdict:** actually strong once the fake fifth option is removed. Mary and Ode are excellent; Jingle/Twinkle are sensible transfers. CF3's Beyer Nos. 12/23/35 are strong future additions if Fable wants published teaching pieces.

---

## 2.2 — eighth notes in simple time

### `song.folk.london-bridge`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/london-bridge.abc`.

**KEEP — PRIMARY.** The opening phrase has the tune's A–G eighth pair; it recurs later. LH is one held note per bar. There is a marked RH position move to cover D4–A4, so it is not absolutely minimal, but the target rhythm is clear and repeated.

### `song.folk.merrily-we-roll-along`
**Evidence: DIRECT SOURCE READ.**

**REMOVE.** It contains no eighth notes at all.

### `song.folk.old-macdonald`
**Evidence: DIRECT SOURCE READ + PARSED MXL RECORD.** `docs/lesson-audit/batch-1.md` counted 20 quarters, 2 halves, 2 wholes and zero eighths.

**REMOVE.** It does not contain the lesson's target.

### `song.folk.sakura.pdmx`
**Evidence: PARSED MXL RECORD** — batch 1 read the built file: ten eighths = five pairs, in bars 4/6/8/10/14; four pairs fall on beat 2 and one on beat 1. Rung-claims also says the full song brings ties, ledger-line reading and range beyond position before they are taught.

**EXCERPT.** The eighth-pair material is genuinely useful, but the full file is not a clean 2.2 song. Mine a passage containing the repeated eighth-pair bars while excluding the later demands if possible.

### `song.pop.michael-row-the-boat-ashore.pdmx`
**Evidence: PARSED MXL RECORD** — rung-claims flags dotted quarter, syncopation and range-beyond-position as untaught at 2.2.

**MOVE/REMOVE full song; EXCERPT if a clean eighth passage exists.**

### `song.folk.danny-boy-c-major.pdmx`
**Evidence: PARSED MXL RECORD** — ledger lines, dotted quarter, syncopation, wider range on the 2.2 placement.

**MOVE/REMOVE.** Too much later notation for first eighths.

### `song.folk.alouette.pdmx`
**Evidence: PARSED MXL RECORD** — batch 1: 6/8, one-flat key, 20 eighths among 44 quarters and 2 halves; rung-claims also flags ties/compound meter/key/range.

**MOVE to the compound-meter work around 4.5.** It contains eighths, but they are the counting unit of 6/8, not the paired subdivision 2.2 teaches.

**Rung verdict:** this rung is much weaker than its option count suggests. London Bridge is the one clearly clean whole-song target. Sakura is promising as an excerpt. Fable should actively find/add simple-time eighth-note tunes rather than retaining songs that do not contain the target or import later notation.

---

## 2.3 — first chord symbols / C, F, G block triads

### `song.folk.happy-birthday.simple`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/happy-birthday-simple.abc`; batch 1 also checked every LH chord in the built score.

**FIX THEN KEEP — PRIMARY.** The LH really is root-position C/F/G triads, which is exactly useful. But the score prints `G7` above plain G–B–D triads, so the visible chord-symbol vocabulary says a seventh before the learner has learned V7. It also has an eighth-note pickup and a sizeable RH position move. Best fix: make the beginner 2.3 variant honestly print G over the triad; preserve a later G7 version if desired.

### `song.holiday.jingle-bells.g`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/jingle-bells-g.abc`.

**MOVE to / KEEP on 3.2, not 2.3.** It is in G major and actually sounds G, C and D7 (D–F#–C). Excellent 3.2 material; not the clean first C/F/G lesson.

### `song.folk.happy-birthday` — fuller imported setting
**Evidence: PARSED MXL RECORD** — batch 1: rests then inverted seventh-ish LH shapes; rung-claims flags chromatic + range. The research packet also records the live A# where B-flat is intended.

**REMOVE until corrected, then reconsider later.** It is not a first-triad arrangement and currently contains a known spelling defect.

### `song.folk.was-wollen-wir-trinken.pdmx`
**Evidence: PARSED MXL RECORD** — one-staff melody/lead-sheet form; dotted quarter, syncopation, triplets and wider range before taught.

**MOVE/REMOVE.** It can later be useful for playing LH from symbols, but is a poor first C/F/G block-chord song.

### `song.folk.dark-eyes.pdmx`
**Evidence: PARSED MXL RECORD** — one staff; dotted/tied/syncopated/triplet rhythm, key signature, chromatic notes and wider range.

**MOVE/REMOVE.** Much later musical vocabulary.

### `song.folk.auld-lang-syne.pdmx`
**Evidence: PARSED MXL RECORD** — one staff; ledger, dotted rhythm, syncopation, key signature and wider range.

**MOVE/REMOVE.** Useful later lead-sheet material, not first chords.

### `song.folk.skip-to-my-lou.pdmx`
**Evidence: PARSED MXL RECORD** — one staff; ledger/key/range beyond this rung.

**MOVE/REMOVE or later lead-sheet transfer.**

**Rung verdict:** the count is badly misleading. Only Happy Birthday (simple) actually writes the intended C/F/G blocks, and it needs its G/G7 notation cleaned up. The one-staff lead sheets are a valid *later* chord-symbol skill, but their current musical difficulty makes them poor 2.3 fillers. Add simple C-major folk melodies with C/F/G accompaniment rather than pretending seven titles equal seven first-chord songs.

---

## 2.4 — ties / dotted-quarter rhythm / dynamics vocabulary

### `song.folk.greensleeves.simple`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/greensleeves-simple.abc`; batch 1 independently counted the dotted-quarter+eighth figure in 7 of 15 full bars.

**MOVE to 3.3 / later transfer.** It is genuinely good dotted-rhythm material, but it is in A minor and explicitly contains G# and F# (raised 7th/6th), plus a substantial RH position change. Those accidentals/minor facts are taught at 3.3. It also does not solve the tie half of 2.4.

### `song.folk.greensleeves.chords`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/greensleeves-chords.abc`.

**MOVE to 3.3.** Explicit Am/G/E7 harmony and raised G#/F#. This is excellent 3.3 material and unnecessarily advanced at 2.4.

### `song.folk.greensleeves` — fuller imported setting
**Evidence: PARSED MXL RECORD** — rung-claims puts ledger, syncopation, triplets, chromatic and range-beyond-position on its 2.4 use; catalog level is much later.

**MOVE/REMOVE from 2.4.**

### `song.folk.streets-of-laredo.pdmx`
**Evidence: PARSED MXL RECORD** — batch 1 read all 17 bars: one staff only; 3/4; dotted quarters occur on beat 2 in bars 3,5,7,11,15; file is only the first half of the tune. Rung-claims also flags key/range/syncopation.

**EXCERPT.** Real dotted-rhythm transfer exists, but the full truncated one-staff setting is not a clean early song. A short phrase may be useful.

### `song.pop.careless-love-blues.pdmx`
**Evidence: PARSED MXL RECORD** — rung-claims flags ledger/key/range beyond the rung.

**MOVE/REMOVE full song; inspect for excerpt only if needed.**

### `song.folk.ga-je-mee-op-zoek-naar-het-koningskind.pdmx`
**Evidence: PARSED MXL RECORD** — ledger, syncopation, key signature, chromatic note(s), wider range before taught.

**MOVE/REMOVE.**

### `song.folk.cielito-lindo.simple`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/cielito-lindo-simple.abc`.

**KEEP — TRANSFER / possible PRIMARY for ties after a range check.** This one really contains repeated bar-line ties, and the source note says the RH melody and ties were checked against two independent PDMX editions. LH is one held chord-root note per bar. Its weakness is range/position movement, not the target itself. If Fable wants a very first tie song, cut or simplify a short phrase; otherwise this is much more honest 2.4 material than the advanced Greensleeves settings.

**Rung verdict:** ties and dotted rhythm should probably have separate clean song/excerpt examples. Cielito is the strongest current tie transfer. The Greensleeves material belongs later.

---

## 2.5 — moving positions / thumb-under preview / octave-range movement

### `song.classical.ode-to-joy.full`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/ode-to-joy-full.abc`.

**KEEP — PRIMARY.** Sixteen bars, explicit marked RH move down for G3 and back, plus the B section. It also contains the already-taught eighth/dotted figures. This is exactly the kind of 'same familiar tune, now move' progression that works pedagogically.

### `song.classical.beethoven-ode-to-joy.easy`
**Evidence: PARSED MXL RECORD** — rung-claims flags ledger, key signature and chromatic notes as untaught on 2.5.

**MOVE/REMOVE from 2.5; keep for Stage 4 transfer.**

**Rung verdict:** only one clean song now. Find another genuinely simple position-shift piece rather than using the harder variation to fill the row.

---

## 3.1 — G/F major key signatures / sharps & flats

### `song.classical.ode-to-joy.g`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/ode-to-joy-g.abc`.

**KEEP — TRANSFER, not the main G-major reading example.** It displays a one-sharp key signature, but the score's own edition note is correct: the melody never actually sounds F#. The LH is only G/D. So it demonstrates *seeing* a G-major signature without giving the learner much F# reading practice.

### `song.folk.twinkle.f`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/twinkle-f.abc`.

**KEEP — PRIMARY for F major.** Every B in the melody/harmony is B-flat; the key signature materially changes notes the learner plays. It does include chord-symbol/harmony material (including C7 labels), so use it after a simpler scale/note-flash introduction rather than as the first sight of the flat.

### `song.folk.when-the-saints.f`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/oh-when-the-saints-f.abc`.

**KEEP — TRANSFER / strong bridge into 3.2.** The B-flat key signature is real, and the LH writes F/Bb/C7. That makes it excellent primary-chord material one rung later as well.

### `song.folk.korobeiniki.pdmx`
**Evidence: current placement + mechanical score reading only; no sufficient phrase-level read in this pass.**

**NEEDS DIRECT READ.** Do not infer approval from the current catalog/rung.

### `song.folk.loch-lomond.pdmx`
**Evidence: current placement only in this pass.**

**NEEDS DIRECT READ.**

### `song.folk.scarborough-fair.pdmx`
**Evidence: title/placement and older research only; the recent web/PDMX match was explicitly not yet opened in the new research pass.**

**NEEDS DIRECT READ.** It is a good candidate for the separate Dorian pipeline proof, but not approved here.

**Rung verdict:** Twinkle F is the strongest currently read transfer piece. Ode G is weaker than its title suggests because the F# is never played. Read the three PDMX candidates before Fable relies on the count.

---

## 3.2 — I/IV/V7 in C, G and F / smooth voice leading

### `song.holiday.jingle-bells.g`
**Evidence: DIRECT SOURCE READ.**

**KEEP — PRIMARY.** G major, written block G/C/D7, with the D7 actually sounding D–F#–C. This is exactly useful 3.2 material.

### `song.folk.when-the-saints.f`
**Evidence: DIRECT SOURCE READ.**

**KEEP — PRIMARY.** F major, written F/Bb/C7. Strong complementary key example.

### `song.folk.happy-birthday.simple`
**Evidence: DIRECT SOURCE READ.**

**KEEP — TRANSFER only after its 2.3 symbol cleanup.** It is useful as the C/F/G plain-triad contrast, but it does not actually sound the seventh under its G7 labels.

### `song.folk.yankee-doodle.pdmx`
**Evidence: current rung only in this pass.**

**NEEDS DIRECT READ.**

### `song.folk.oh-my-darling-clementine.pdmx`
**Evidence: current rung only in this pass.**

**NEEDS DIRECT READ.**

**Rung verdict:** already has two very strong authored song models in two keys. Do not spend time manufacturing more until Yankee/Clementine are actually read.

---

## 3.3 — A minor / raised 7th / minor chords and E7

### `song.folk.greensleeves.simple`
**Evidence: DIRECT SOURCE READ.**

**KEEP — PRIMARY melody transfer.** The tune is genuinely A minor and repeatedly uses G# (and F# in the melodic form). Here those accidentals are the point rather than an intrusion.

### `song.folk.greensleeves.chords`
**Evidence: DIRECT SOURCE READ + PARSED MXL AUDIT.** Batch 2 independently traced the harmony: Am, G, E7, with both returns to A minor coming through E7.

**KEEP — PRIMARY.** Strongest current real-song demonstration of raised seventh + E7.

### `song.folk.greensleeves` — fuller imported setting
**Evidence: current level/placement and prior mechanical readings only in this pass.**

**KEEP only as later/stretch if direct read supports it.** It is much harder and does not add repertoire diversity because all three choices are the same tune.

**Rung verdict:** musically coherent but monotonous: three versions of Greensleeves is not three distinct transfer contexts. Add one other verified minor-key song rather than another detector.

---

## 3.4 — ledger lines / wider reading range

### `song.classical.mozart-petzold-minuet-g.easy` and alternative edition
**Evidence: PARSED MXL/lesson-audit record** — batch 2 notes the complete Petzold keyboard piece and that the RH reaches B5; the two current options are editions of the same work.

**KEEP — PRIMARY, but count the work once for pedagogical breadth.** Two editions can be useful for source comparison, not as two different learning experiences.

### `song.classical.beethoven-fur-elise.easy`
**Evidence: existing parsed-score placement but not enough note-level detail re-read here.**

**NEEDS DIRECT READ before final placement sign-off.** It is plausible wider-range transfer, but this file should get the same explicit note/range read as the others.

**Rung verdict:** likely healthy, but duplicated editions inflate apparent variety.

---

## 3.5 — pedal basics

Current songs in the ladder include *Ode to Joy (full theme)*, *Greensleeves (waltz bass)* and Schumann Op. 68 No. 4 *Chorale*.

**Evidence: DIRECT SOURCE READ for Ode/Greensleeves + PARSED MXL AUDIT for all three.** `docs/lesson-audit/batch-2.md` explicitly reports **zero `<pedal>` elements in all three files**.

- `ode-to-joy.full`: **KEEP — TRANSFER** for adding pedal by ear/harmony, but it teaches no pedal notation.
- `greensleeves.waltz`: **KEEP — TRANSFER**, harmonically clear but really stronger as accompaniment-pattern material.
- Schumann Chorale: **KEEP provisionally** as repertoire if the direct score read supports the intended harmonic/pedal use.

**Rung verdict:** exercises can teach the physical pedal change, but the song set currently contains **no score that teaches reading pedal marks**. If the lesson claims pedal notation as an outcome, add at least one verified score/excerpt that actually prints it, or state clearly that the learner is adding pedal to unmarked music.

---

## 3.6 — broken chords / Alberti / waltz accompaniment

### `song.folk.greensleeves.waltz`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/greensleeves-waltz.abc`.

**KEEP — PRIMARY for waltz bass.** Exact bass-on-1 + chord-on-2-and-3 texture, repeated throughout. Named style and notes agree.

### Missing song coverage
The current generated ladder effectively has only this one song on 3.6. That means **Alberti and ordinary broken-chord transfer are not represented by songs even though the rung teaches all three patterns.**

Use existing research instead of inventing a detector:

- **Alberti:** open and verify the K.545/Clementi candidates already found by title; if the current K.545 file is the one with absurd 8/9-sharp markings, fix/reject that edition before using it.
- **Broken chord:** the existing easy *Canon in D* record says its LH breaks chords in eighths for the first twelve bars and then changes texture. That is an excellent **excerpt** candidate for this rung if the actual file is re-read and independently verified.

**Rung verdict:** strong waltz example; needs one genuine Alberti excerpt/song and one genuine broken-chord excerpt/song.

---

# Selected Stage-4 corrections already obvious from this pass

## 4.5 — compound meter / 6/8

### `song.folk.row-row-row-your-boat`
**Evidence: DIRECT SOURCE READ** — `content/scores/authored/row-row-row-your-boat.abc`.

**KEEP — PRIMARY for 6/8 transfer.** Real 6/8, two dotted-quarter pulses, explicit eighth-note groups, with a bass/chord accompaniment. Slightly richer than a first rhythm example, but musically coherent.

### `song.folk.alouette.pdmx`
**Evidence: PARSED MXL RECORD** — 6/8 with twenty eighths.

**MOVE HERE / consider as transfer**, rather than pretending it is a simple-time eighth-note song at 2.2.

### `song.folk.london-bridge`
**Evidence: DIRECT SOURCE READ** — 4/4.

If 4.5 is specifically the compound-meter rung, **do not count London Bridge as 6/8 song coverage**. It can only be there for some other separately stated requirement/comparison.

### `song.folk.greensleeves.68` (if/where offered)
The source is promising 6/8 repertoire, but the research packet has already confirmed the ABC conversion loses chord fingerings: source has 80 fingering marks, shipped MusicXML 52. **FIX THE ABC ROUTE / FILE BEFORE USING IT AS VERIFIED REPERTOIRE.**

---

# Cross-rung conclusions for Fable

## 1. The early core has enough *raw tunes* but not enough honest rung fits
The biggest problem is not shortage. It is that the option floor made later/irrelevant songs count as if they did the lesson's job.

The most obvious current false abundance:

- 1.4 counts a RH-only `Lightly Row` as an alternating-hands song.
- 2.1 counts one-staff `Simple Gifts` as a hands-together option.
- 2.2 counts songs with **zero eighth notes**, 6/8 material, or later ledger/tie/syncopation demands.
- 2.3 has seven song titles but only two write LH block chords, and only one is the target C/F/G beginner case.
- 3.3 has three song options but they are three versions of the same tune.
- 3.4 has two Petzold options that are editions of the same work.

Do not fix this by lowering a count. Fix it by replacing weak options with actual music.

## 2. Excerpts are the fastest repair for PDMX material
Where a full song is too advanced but contains a clean target passage, cut the passage. Strong current candidates:

- `Sakura` for simple-time eighth pairs;
- `Streets of Laredo` for dotted-quarter rhythm;
- easy `Canon in D` bars 1–12 for broken-chord transfer;
- K.545/Clementi once an Alberti-positive edition is actually opened and verified.

The existing excerpt system already exists; use it.

## 3. Keep authored variants when they deliberately isolate a rung
The authored Ode/Mary/London Bridge/Greensleeves variants are often better teaching content than a random 'real' full score because their purpose is explicit. The answer is not 'replace authored music with PDMX'. It is:

- authored/generated = controlled acquisition;
- real song/excerpt = authentic transfer.

## 4. A current song should not be approved by detector output alone
For final Fable placement, every real song/excerpt should have a short read note like:

`bars / hands / meter / key / target occurrences / extra demands / range / phrase or excerpt boundary / source comparison status`.

For a few hundred songs this is tractable and materially safer than another classification system.

## 5. Immediate song work with the highest payoff

1. Fix/replace the four obvious early authored-placement problems: Hot Cross Buns 1.1/1.3 eighths, Frère Jacques 1.2 eighths/range, Lightly Row on 1.4, Happy Birthday simple's G7-over-G-triad beginner notation.
2. Rebuild 2.2's song list around genuine simple-time eighth material; use Sakura as an excerpt if the clean bars survive cutting.
3. Rebuild 2.3 around genuinely simple C/F/G chord-symbol songs rather than later one-staff lead sheets.
4. Move Greensleeves simple/chords out of 2.4 and let them strengthen 3.3, where their A-minor/E7/G# material actually belongs.
5. Add an actual pedal-marked score/excerpt to 3.5 if pedal notation is meant to be taught.
6. Fill 3.6 with verified Alberti + broken-chord transfer alongside the already-good Greensleeves waltz.

---

# What remains for the next score-read batch

This file deliberately does not fake review of compressed files I have not substantively read. Highest-priority next reads:

- 3.1: Korobeiniki, Loch Lomond, Scarborough Fair;
- 3.2: Yankee Doodle, Clementine;
- 3.4: the exact Für Elise easy file;
- 3.5: Schumann Chorale;
- Stage 4: Bella Ciao, Minuet editions, easy Canon, Uti vår hage, Auld Lang Syne, When Johnny Comes Marching Home;
- then the genre tracks, starting with the songs currently claimed as examples of a named texture/style.

For PDMX `.mxl` files, use the same rule as the earlier audit: actually parse/dump the file and read the bars. Do not promote a `NEEDS DIRECT READ` row from this document merely because its metadata looks plausible.
