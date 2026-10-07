# Readable-score review: genre addendum 1

Research/review only. No production placement changes are made here.

Authority for these reads: `claude/readable-scores@c1556d70`, which contains the MusicXML extracted byte-for-byte from the shipped `.mxl` plus `dump_score.py` reads. This note continues the core review by concentrating on named style/texture rungs, where a song can genuinely belong to a genre while still failing to demonstrate the piano technique named by the rung.

Verdict vocabulary:
- **PRIMARY** — the shipped score itself clearly demonstrates the named thing and is a sensible acquisition example.
- **TRANSFER** — good repertoire once the technique is already known, but not a clean first model.
- **STRETCH** — authentic/useful but materially harder than the rung's first teaching example should be.
- **EXCERPT** — useful bars exist, but the full score is too broad/hard.
- **MOVE/REMOVE FROM CLAIM** — do not count this score as evidence that the named technique has repertoire coverage.

The key distinction in this pass is **genre identity versus written technique**. A blues lead sheet is not automatically a walking-bass example. A Latin melody is not automatically a montuno/tumbao example. A jazz standard is not automatically a shell/rootless-voicing example.

---

## Stage 5

### `blues.5` — turnarounds, blue notes and walking bass

Current songs read:
- `song.classical.1919-blues-my-naughty-sweetie-gives-to-me.pdmx`
- `song.pop.the-memphis-blues.pdmx`
- `song.classical.royal-garden-blues.pdmx`

All three shipped scores are **one-staff lead sheets** (`staves: 1`, no written LH) with chord symbols. They are legitimate historical blues/early-jazz repertoire and contain useful altered/dominant harmony, chromatic/blue-note vocabulary and turnarounds. But none writes a walking bass because none writes a left hand at all.

Disposition:
- Keep as **TRANSFER** for melody + changes / lead-sheet reading.
- **MOVE/REMOVE FROM CLAIM** as proof that `blues.5` has walking-bass song coverage.
- Add an actual written walking-bass primary (or an authored excerpt) rather than asking a detector to infer one from chord symbols.

This is a particularly clear example of false abundance: three correct-genre titles, zero written walking-bass examples.

### `jazz.5` — swing, shell voicings and ii–V–I

Direct reads:
- `Bill Bailey` — one staff, 56 bars, 34 chord symbols, no LH.
- `Some of These Days` — one staff, 48 bars, 29 chord symbols, no LH.
- `After You've Gone` — one staff, 36 bars, 48 chord symbols, no LH.
- `Limehouse Blues` — one staff, 64 bars, 52 chord symbols, no LH.

These are useful standards/lead sheets and give real harmonic movement. They are **TRANSFER** for hearing/reading changes and repertoire familiarity.

But none can demonstrate a written shell voicing or written comping texture, because the piano voicing is absent. The learner must invent that from the symbols.

Disposition:
- Keep the standards, but stop counting them as equivalent to a shell-voicing acquisition score.
- Add one compact two-staff score/excerpt that actually writes 3rd/7th shell shapes through a ii–V–I.
- If the lesson intentionally says "you supply the shell voicing from these symbols," state that explicitly; then the lead sheets become appropriate transfer tests rather than primary demonstrations.

### `ragtime.5` — oom-pah and a syncopated right hand

Direct reads:

**`Greensleeves (waltz bass)`** — already verified elsewhere. It writes bass on beat 1 plus chord on beats 2–3. **PRIMARY for basic oom-pah/waltz-hand mechanics**, but it is not ragtime and does not supply the characteristic syncopated RH.

**`12th Street Rag (1914)`** — shipped as a **one-staff** melody/lead-sheet file (40 bars, chord symbols, no written LH). It is authentic repertoire, but it cannot demonstrate the leaping oom-pah LH. **TRANSFER**, not primary texture evidence.

**`The Entertainer`** — genuine two-staff Joplin, but the shipped file is 92 bars and judged level 7.1, with dense sixteenths, leaps, polyphony and modulation. **STRETCH / EXCERPT**, not a Stage-5 first model.

**`Augustan Club Waltz`** — genuine two-staff Joplin waltz with a literal bass-note + two chord-beats LH through long stretches. But the file is 148 bars, estimated level 6.8, and the RH quickly becomes far richer than a first oom-pah exercise. **EXCERPT** for the LH texture; not a whole-piece Stage-5 primary.

Conclusion: the rung has authentic repertoire but still needs one **small written syncopated-rag texture** at acquisition difficulty. Do not make a learner jump from Greensleeves waltz bass to the full Entertainer just because both technically cover halves of the label.

### `latin` — clave, tumbao and montuno

Direct reads:

- `Cielito Lindo` — one-staff 3/4 melody, no chord symbols or LH.
- `Guantanamera` — one-staff 4/4 lead sheet with D/G/A7 harmony.
- `Só Danço Samba` — one-staff lead sheet with extended chord symbols; Brazilian samba/bossa repertoire, no written LH.
- `Insensatez` — one-staff Jobim lead sheet with rich extended harmony, no written LH.
- `Tico-Tico no Fubá` — one-staff melodic score, no chord symbols/LH in the shipped file.
- `La Cumparsita (part A)` — genuine two-staff tango arrangement with repeated off-beat chord punctuation in the LH, but tango is not a written tumbao/montuno/clave example.

These are legitimate **Latin / Latin-American repertoire**, but that is not the same thing as coverage of the three named techniques.

Disposition:
- Keep selected titles as **TRANSFER / repertoire context**.
- **MOVE/REMOVE FROM CLAIM** all one-staff files as evidence of written tumbao or montuno.
- `La Cumparsita` is useful tango texture, but do not relabel tango accompaniment as montuno/tumbao.
- Add or author an actual Cuban/son/salsa excerpt that writes a montuno and bass tumbao against a clear clave. One good literal score is worth more than six titles from adjacent Latin styles.

### `chords-pop.5` — seventh chords and accompaniment textures

Direct reads:

**`Lavender's Blue`** — two-staff, 20 bars, genuine changing accompaniment textures; no chord symbols in the score. **PRIMARY/TRANSFER for accompaniment texture**, not for reading seventh-chord symbols.

**`Your Song (easy)`** — two-staff, 38 bars, many sustained/block LH voicings and pedal; no chord symbols in the shipped file. Estimated level 5.07. **TRANSFER for pop accompaniment/voice-leading**, not explicit seventh-chord-symbol acquisition.

**`Before You Go`** — two-staff, 36 bars in 12/8, repeated open/triadic LH textures, no chord symbols. **TRANSFER for compound-meter pop accompaniment**, not explicit seventh-chord reading.

The rung should distinguish "play richer accompaniment" from "read/build seventh chords." Current songs do the former much better than the latter.

### `rock.5` — open voicings / the chord with the third taken out

**`Annie's Song`** — strong fit. The shipped two-staff arrangement repeatedly writes open root–fifth–octave shapes such as G–D–G, A–E–A, B–F#–B and D–A–D in the LH. The third is literally absent in those voicings. There are also Dsus4 symbols in the score. **PRIMARY** for the named open-voicing idea.

**`andata` (Sakamoto)** — musically rich two-staff score, but estimated level 6.36 with five-sharp notation, major sevenths, half-diminished harmony and dense voice-leading. **STRETCH**, not the first open-voicing model.

This rung is in much better shape than several neighboring genre rungs because `Annie's Song` actually writes the claimed physical/harmonic idea.

### `hymns.5` — walk-ups, passing chords, and the chord not in the key

**`What a Friend We Have in Jesus`** — one-staff lead sheet. It *does* contain useful non-diatonic/secondary harmony in the symbols, including E major and G# diminished in D major. **PRIMARY/TRANSFER for "the chord not in the key" from symbols**, but not for written walk-up texture.

**`Down by the Riverside`** — one-staff melody + basic Bb/F/C7 symbols. Good hymn/spiritual transfer, but little evidence of the named passing/walk-up texture. **TRANSFER**.

**`This Little Light of Mine`** — one-staff lead sheet with Bb/Bb7/Eb/F7/Gm. Again useful repertoire, not written walk-up evidence. **TRANSFER**.

**`Just a Closer Walk with Thee`** — this one earns its place. Two staves, written LH, chromatic/non-diatonic colour, and bar 14 contains an explicit G–F–E–D quarter-note LH walk-down into the cadence. **PRIMARY** for the walking/passing-bass concept and useful transfer for altered harmony.

---

## Stage 6

### `blues.6` — Pinetop, root-and-fifth bass, and a line that walks

**`Boogie-woogie and blues piano exercises`** — unusually strong literal fit. The shipped score is bass-clef-only and explicitly labels sections `Diatonic Octave Walking Bass Exercise`, `Chromatic Octave Walking Bass Exercise A/B`, `12 Bar Octave Walking Bass Example`, with a swing mark. **PRIMARY**. Keep this kind of literal named-technique material.

**`Boogie (easy, for beginners)`** — genuine two-staff boogie. Opening LH walks C–E–G–A–Bb–A–G–E and analogous IV/V patterns; later bars use quarter-note walking shapes under RH riffs. **PRIMARY/TRANSFER**. Estimated level ~4.95, so musically richer than the dedicated exercise but still an honest example.

**`Pinetop's Boogie Woogie (1928)`** — authentic two-staff historical repertoire but estimated level ~7.04; the opening is dense 32nd-note writing and the file is 97 bars. **STRETCH / historical reference / excerpt**, not the first walking-bass score.

This rung has real technique coverage and should be treated as a model for how the weaker genre rungs ought to work.

### `jazz.6` — comping, walking bass, and hearing the changes

The currently read examples (`Bye Bye Blackbird`, `Limehouse Blues`, `Royal Garden Blues`) are all one-staff lead sheets with many chord symbols and **no written LH**. They are strong for "hearing/reading the changes" but cannot demonstrate written comping or walking bass.

Disposition:
- Keep them as **TRANSFER lead sheets**.
- Add one real two-staff comping/walking score or authored excerpt as **PRIMARY**.
- Do not let six standards create the illusion that six written jazz textures exist.

### `chords-pop.6` — I–V–vi–IV everywhere, and the bass that walks under it

**`Clocks`** — two-staff, real repeated pop-piano ostinato. The LH mostly sustains single bass notes/triads beneath the famous RH broken-chord figure. **TRANSFER for pop texture**, but not a walking-bass demonstration and not a clean I–V–vi–IV teaching example.

**`All of Me (easy)`** — much stronger for the progression part. The opening cycles Em–C–G–D (vi–IV–I–V, a rotation of the four-chord family), first with held bass and later with eighth-note broken LH shapes. **PRIMARY for the ubiquitous four-chord progression; TRANSFER for accompaniment texture.** The LH is patterned/arpeggiated rather than a genuinely walking bass line, so keep that claim separate.

The rung should not require one song to prove both halves. Label which song teaches the progression and which teaches moving bass.

### `rock.6` — arpeggio over a pedal bass, and pedal as colour

**`Moonlight Sonata I`** — very strong literal texture. From bar 1 the upper texture continuously arpeggiates triplet chord tones over sustained octave/bass notes. **PRIMARY / stretch-primary** for the musical idea (the whole piece is judged 7.1, so use an excerpt if Stage 6 needs acquisition difficulty).

**`Gnossienne No. 1`** — the opening is bass-note + held chord accompaniment (for example A bass against C–E), not a continuous arpeggio-over-pedal texture. **TRANSFER for sparse colour/voicing**, not the primary named arpeggio example.

**`Chopin Prelude Op. 28 No. 20`** — compact but fundamentally block-chord writing; this shipped file has zero pedal marks. **MOVE/REMOVE FROM CLAIM** as evidence of arpeggio texture or pedal notation. Keep as repertoire if the lesson has some separately stated expressive/harmonic use.

---

## Stage 7: high-risk named-technique spot checks

### `blues.7` — leaping left hand and the turnaround

**`Boogie-Boogie en Sol`** — strong literal fit. The LH repeatedly leaps from very low bass notes (for example G1) to upper chord shapes (B2–D3–G3), then back, in an unmistakable boogie texture. **PRIMARY** for the leaping-LH concept.

**`Rhythm and Boogie`** — two-staff and stylistically relevant, but the opening mostly uses repeated chord punches/root positions; later lines add movement. **TRANSFER**, not as clean a first leap model as `Boogie-Boogie en Sol`.

**`Boogie (easy, for beginners)`** — its strongest feature is walking/scalar bass, not large bass-to-chord leaps. **Better fit on blues.6 than as evidence for blues.7's named leap.**

### `jazz.7` — rootless voicings, quartal colour, tritone substitution

**`Skating`** — genuine advanced jazz piano material: two staves, swing mark, 6ths/7ths/9ths/13ths in the score, written comping and bass. However the opening explicitly includes chord roots in the LH (C, F, G, etc.), so it is not a clean first demonstration of *rootless* voicing. **Strong TRANSFER / advanced repertoire**, but do not use the title alone as proof of rootless technique.

**`Fly Me to the Moon`** — two staves with genuine inner voicings, minor/major ninths, altered dominants and chromatic approach harmony. Strong advanced jazz transfer. The opening again commonly carries roots in the LH, so it is better evidence for extended/altered harmony and voicing movement than for a clean rootless-voicing acquisition example. **TRANSFER**.

**`Jingle Bells (jazz piano)`** — authentic two-staff swing arrangement, but 76 bars, estimated level 7.15, multiple clef/time changes and very wide/register-heavy writing. **STRETCH**, not a clean first rootless/quartal/tritone model.

The rung still needs one tiny literal progression where the score makes the rootless 3rd/7th/extension relationship visually obvious, plus a separate tritone-substitution example if that concept is meant to be certified from repertoire.

### `chords-pop.7` — sus2, sus4, add9 and the ninth chord

Several current songs do not support the named claim cleanly:

- **`Blinding Lights (easy)`**: shipped chord symbols are only C, Dm, F and Gm. Two-staff and useful pop repertoire, but **MOVE/REMOVE FROM CLAIM** as evidence of sus/add9/ninth vocabulary.
- **`Fix You`**: two-staff arrangement, but raw MusicXML has no chord-symbol objects and the opening is basic triadic/voice-led harmony. Good repertoire; not explicit named-chord instruction.
- **`Welcome to Wonderland`**: two-staff, but chord symbols are E, B, C#m, A, G#; the voicings do add colour tones in places, yet the score does not present a clean labelled sus2/sus4/add9/ninth progression. **TRANSFER**, not a primary nomenclature example.
- **`For the Damaged Coda`**: two-staff patterned accompaniment but no chord symbols. Useful texture, not direct named-chord evidence.
- **`Scarborough Fair (piano solo)`**: long two-staff arrangement with no chord symbols in the shipped file. Again repertoire, not explicit chord-name teaching.
- **`Wake Me Up`**: 108-bar, estimated 7.15 arrangement with changing meters and no chord symbols; far too broad to function as the clean named-chord acquisition score.

Conclusion: `chords-pop.7` currently has **lots of pop repertoire and weak direct evidence for the actual sus/add9/ninth labels**. Fable should find or author a compact score where those chord names and their actual pitches agree, rather than relying on popular-song titles.

---

# Cross-track conclusions from this batch

1. **A genre song is not automatically a technique song.** This is now directly proven across blues, jazz and Latin.
2. **Lead sheets are valuable, but their job is transfer.** They test whether the learner can supply a previously taught texture from symbols; they should not stand in for the score that teaches the texture.
3. **Two different kinds of repertoire are needed on many genre rungs:**
   - one short literal acquisition score/excerpt that writes the named technique;
   - one or more authentic songs/lead sheets where the learner applies it.
4. **The good examples are obvious when read:** `Annie's Song` for open fifth/octave voicings, the dedicated boogie walking-bass exercise, `Boogie-Boogie en Sol` for a leaping boogie LH, `Just a Closer Walk with Thee` for a real bass walk-down, and a Moonlight I excerpt for arpeggio-over-bass.
5. **Do not delete authentic repertoire just because it fails the primary-technique test.** Reclassify it as transfer/stretch/library material. The defect is the teaching claim, not necessarily the score.
6. The remaining score pass should continue Stage 7, then Stages 8–9, with priority on named-style claims and on any rung whose current options are mostly one-staff lead sheets.
