# Ability-map amendment: the PDMX quarry's content evidence (2026-10-05)

**What this is.** The amendment that `briefs/map-amendment-quarry.md` asks for. It is a wave-content table for each ability station that the outside reviewer's PDMX quarry (`docs/review/pdmx-quarry-2026-10-05/`, merged at HEAD) repairs, strengthens or changes. `ABILITY-MAP.md` is not edited here. The orchestrator folds this file in after review.

**Read.** These quarry files, in the brief's order: `REVIEW-INDEX.md`, `STYLE-VERIFICATION.md`, `CURRICULUM-USE-SYNTHESIS.md` and `HANDOFF-TO-CLAUDE.md`. Then the batch files: blues-2, jazz-2, latin-1, style-source-match-1, ragtime-1, hymn-1, holiday-1, rock-1, metal-1 and improv-compose-1. Then `CANDIDATE-REVIEW.md` and the summaries of the retained candidates that a row cites. From this folder: `ABILITY-MAP.md` §2.0, §2.1 to §2.11, §3, §5, §6 and §8; `GENERATOR-ADDENDUM.md` G13 to G16 and its reviewer corrections; `WAVE1-FACTS.md`; and `MODE-SHEET.md` §0, §2, §7a, §13 and §15. For the Cuban terms I also read the lines of the lessons, generator and data files cited in §1.3. Read-only scripts checked which quarry CIDs `app/public/content/catalog.json` already ships, and pulled each candidate's licence field and its composition label in the quarry README.

**Marks.**
- **[Q file:line]**: a quarry document.
- **[S]**: a quarry summary file (`summary/<lane>/<slug>-<CID>.txt`). **[S, read here]** means I made the observation from that summary in this amendment. It is not a quarry verdict.
- **[MAP n]**: an `ABILITY-MAP.md` line. **[M §n]**: a `MODE-SHEET.md` block. **[A Gn]**: a generator-addendum row. **[WF n]**: a `WAVE1-FACTS.md` line.
- **[I]**: inferred, not established by any document read here.

Nobody in this process has heard any of this music. Every statement about musical quality stays *unverified as music*.

**Block numbering.** The brief's "A7d to A7g (ragtime, rock, hymns, holiday)" maps onto these blocks: ragtime is A7d.1, rock is A7e.1, hymns are A7g.1/A7g.2 and holiday is 7h. 7h has no MUST block. A7f (classical) is not touched.

**Two kinds of admission.** A quarry disposition (ADMIT, HIGH-PRIORITY CANDIDATE, KEEP CANDIDATE, REJECT FOR THIS ROLE) is not curriculum admission. The quarry says so itself: ADMIT is "still subject to normal intake/licensing/source gates" [Q CANDIDATE-REVIEW:21], and the handoff says not to equate ADMIT with rung placement. A quarry score that is not in `catalog.json` can be opened only as a shelf import, and a shelf import counts toward no rung [M §7a; R3]. Every new score below therefore needs an intake row (§4) before any rung lists it. Public export is a third, separate decision. The quarry README's composition label is `unknown` for most candidates, so the quarry does not settle rights.

**State vocabulary** follows the map: EXISTING, REPAIR, NEW, SOURCE-NEEDED, SHARED and NO-SEPARATE-ARTIFACT [MAP 19]. A row's state is the state of the work still needed to supply that station.

---

## 1. Wave-content table

Each block has the eight-field table, then a companion table with admission, public export and evidence.

### 1.1 A7a Blues

Deficiency (all rows): **A7a.1, improvise a right hand over your own left-hand groove** [MAP 285-299].

| Row | (2) Station | (3) Mode | (4) Source type | (5) Exact artefact | (6) Published definition | (7) Verification boundary | (8) Completion condition | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | CONTROL | Keep tempo + Duet | generated or authored control | Authored shuffles `exercise.blues.twelve-bar-shuffle.c/f/g` (blues.4), unchanged. Chord plan C C C C F F C C G F C G [WF 47]. The quarry adds nothing to this station and says the real scores must not replace it [Q CURRICULUM-USE-SYNTHESIS:22] | No named style claim beyond the printed twelve-bar form | Checker: none needed (shipped material). Keep tempo measures LH notes and timing [M §2]; Duet measures the chosen hand only [M §13] | The LH shuffle alone through 12 bars at the rung's pass pair, then with the held RH | EXISTING → EXISTING |
| B2 | MODEL/TRANSFER (the MODEL half, before the graded task) | Keep tempo + Loop; Duet for a hand alone | inspected real score, excerpt | (a) *Original Jelly Roll Blues* `QmbuoFtkky8Xpo8LSiAqkMXzBs2Mtc33L6GFw1kWv9T5S3`: 61 bars, grand staff, 4/4, "Tempo di Blues". One 2-4 bar riff; the quarry chose no bars. Bars 7-8 hold an octave-doubled two-bar riff in both hands [S, read here]. That is an observation, not a selection. (b) *Pinetop's Boogie Woogie*, Parham edition, `QmU7rsQ1UcCDqoY36Xk9qBQk8f6JcZgDFoAx9w96rSNYx3`: 96 bars, 2/2, tempo 160. The LH figure (dotted eighth and sixteenth, F2 under C3/D3/A♭2) starts at bar 7, after six bars of tremolo [S, read here]; bars still to choose. This is a second edition of a piece already shipped as `song.folk.boogie-woogie.pdmx`, a different CID that blues.8 already uses [MAP 84] | The quarry supplies no published definition for "boogie bass" or "blue note". Any such lesson word needs the build brief's definition, under the map's D-gate (Berklee weeks 8-10) [MAP 286] | Checker: CK-7 cut fidelity on the chosen bars. Reader: the outside reviewer chooses and reads the bars (CO-5, two more cuts). Self-checked: phrasing. No one here can decide whether it sounds like blues (unverified as music) | The learner plays the chosen Morton riff and the chosen Pinetop LH bars in Keep tempo at the pass pair, says what the riff does (notes, rhythm), then uses one fragment of it in the graded task | NEW → NEW (a real MODEL added; candidates until intake) |
| B3 | MODEL/TRANSFER (the full-form TRANSFER half) | Keep tempo; Duet (the RH riff while the app plays the bed). The chord chart cannot open it: 0 chord symbols [S; WF 32-33] | inspected real score (an arrangement by a lesson uploader), all 12 bars | *Blues Riff in C* `Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi`, bars 1-12, in three parts. The piano has whole-note roots C2, F2, G2 under rootless voicings (B♭-E-G, E♭-A-C, F-B-D). The riff is one line, and there is a drum-set part. The form is I I I I IV IV I I V IV I I; bar 12 stays on I, where the shuffles have G [S, read here; WF 47]. To be played it must be re-staffed (the riff to the RH, the roots to the LH) | "Twelve-bar blues" is a structural claim, read from the bars | Checker: CK-7 extended to a re-staffing, so that the events must equal the source parts' events. As written, CK-7 checks a cut only. Reader: **the riff repeats B♮4 in bars 3-4, 7-8 and 12 against the B♭3 of the C7 voicing** [S, read here]. A reader decides whether that is a typo or intended before the score ships (never teach wrong). Self-checked: holding the LH while the riff moves. No one here can decide the idiom | The riff over the written root bed through all 12 bars in Keep tempo, then over the learner's own blues.4 C shuffle (the same plan except bar 12), self-checked | NEW → NEW (candidate) |

| Row | Admission (quarry, then project) | Public export | Evidence |
| --- | --- | --- | --- |
| B1 | shipped | shipped | MAP 292; WF 38-47; Q CURRICULUM-USE-SYNTHESIS:15-22; M §2, §13 |
| B2 | Morton: ADMIT / HIGH-PRIORITY [Q blues-2:23-34]. Pinetop-Parham: ADMIT / HIGH-PRIORITY [Q blues-2:7-21]. Neither is in `catalog.json`: intake IM-7 and IM-8 (§4) | README label unknown for both. Morton's metadata dates it 1915. The shipped Pinetop edition is recorded `pd` ("Smith 1928") in its catalogue editionNotes. Likely eligible by date [I]; the project's composition record decides | Q blues-2:7-41; Q HANDOFF-TO-CLAUDE:43-52; S A-blues (both files); MAP 293; M §2, §11, §13 |
| B3 | KEEP CANDIDATE [Q CANDIDATE-REVIEW:28-41], "the cleaner controlled full-chorus bridge" [Q blues-2:34]. Not imported: intake IM-9 | Licence field `publicdomain`; README label unknown; creator "Lessons - Blues". Needs a rights record | Q CANDIDATE-REVIEW:28-41; S A-blues/blues-riff-in-c; WF 32-47; MAP 293 |

**Examined, no change.**
- A7a.1 MUSIC (EXISTING) and INDEPENDENCE (REPAIR): the quarry's independence step matches the map's [Q CURRICULUM-USE-SYNTHESIS:20; MAP 294-295].
- A7a.2 MODEL (the bars 11-12 turnaround, SOURCE-NEEDED, MAP 309) is not supplied. *Blues Riff in C* stays on I in bars 11-12 [S]. No turnaround in Morton or Pinetop was read.
- A7a.3 is unchanged.

**Generators keep only CONTROL in this block** (brief): B1 is unchanged, and B2 and B3 are real scores.

### 1.2 A7b Jazz and A10.1

**The lead sheets as a ladder of more independent work.** One sheet per job, deliberately:

| Sheet | Artefact | Station it serves | Why this sheet there |
| --- | --- | --- | --- |
| *St James Infirmary* | `Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs`, **already shipped** as `song.blues.st-james-infirmary` (24 bars, 41 symbols, D minor, opens in the chart) [WF 44] | A7a.3 MODEL (already in the map, MAP 325); SHOULD jam#7, comping and walking at jam.5/6 (MAP 235) | The sparsest chart, already admitted. The quarry's ADMIT adds no new material [Q CANDIDATE-REVIEW:43-55] |
| *After You've Gone* | `QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU` (20 bars, 30 symbols, labelled A/B) | A7b.2, the first real chart after the lab ii-V-I (row J1); the public-build fallback for jazz.9 (row J3) | The shortest full standard; comp, bass and solo are all left to the learner [Q jazz-2:7-17] |
| *Blue Bossa* | `QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6` (32 bars, 24 symbols) | A7c.3 MUSIC, bossa inside jazz (SHOULD jazz#9), after G14 (row L7) | A substrate only; "not source for bossa pattern" [Q CANDIDATE-REVIEW:230; Q REVIEW-INDEX:46]. Harmony unread |
| *There Will Never Be Another You* | `QmY7mQ3qBC5FhfJpQaqZQzTU4RFzkkDwGaahU5z9BNKrkQ` (33 bars, 39 symbols) | A10.1 MUSIC and INDEPENDENCE, as jazz.9's one standard (rows J3, J4) | A longer conventional form with every role left to the learner. It is an open chart, so it suits an INDEPENDENCE station [Q CANDIDATE-REVIEW:193-204; Q HANDOFF-TO-CLAUDE:65] |
| *Autumn Leaves* transcription | `QmeeqT5bwUfEqU9w8ZGXXLgp49DQra1tM23aD85ipXiXXv` (96 bars, one staff, alto saxophone, 87 symbols) | A7b.2 MODEL: a real improvised line to analyse (row J1) | Material for phrase and approach-note analysis, not an acquisition score. Passages not yet chosen [Q CANDIDATE-REVIEW:180-191] |
| *Fly Me to the Moon* | `QmS2enG17nJVrbMvvCcHDW9wAN8nLSV1CPMmtghD7SZFVQ`, **already shipped** as `song.jazz.bart-howard-fly-me-to-the-moon.pdmx` | A10.1 MUSIC: a voicing model for the harmonised-melody pass only (row J3) | The same file the map already holds. Not evidence for minor ii-V-i [Q CANDIDATE-REVIEW:154-165; MAP 343, 1013] |

| Row | (1) Deficiency | (2) Station | (3) Mode | (4) Source type | (5) Exact artefact | (6) Published definition | (7) Verification boundary | (8) Completion condition | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| J1 | A7b.2, solo over changes: chord tones, then approach notes [MAP 356-372] | MODEL/TRANSFER | Lab: Hold the chords (the NEW jazz.8 section); Chord chart (*After You've Gone*); Play it to me (the transcription) | lesson task + inspected real chart + inspected transcription | The NEW jazz.8 section stays the core [MAP 364]. Then the whole 20-bar chart of *After You've Gone*. Then 2-4 bar passages of the *Autumn Leaves* transcription, chosen where the printed harmony shows a chord tone approached by a half step. Choosing them is a harmony read against the printed symbols [Q CANDIDATE-REVIEW:191] | "Chord tone" and "approach note": the map's D-gate, Berklee weeks 9-10 and ABRSM Jazz Piano [MAP 357]. The quarry adds no definition | Checker: none for an improvised line. Hold the chords gives an unstored in-scale count [M §7b]; the chart's live cell is unstored [M §15]. Reader: the outside reviewer chooses the transcription passages. Self-checked: a chord tone on each beat; the approach resolves. No one here can judge style | One chorus of *After You've Gone* with a chord tone on each beat, then with one half-step approach into each new chord (self-checked). In two transcription bars, the learner names the approach note and its target | NEW → NEW |
| J2 | A10.1, take one jazz standard through every role [MAP 622-636] | MODEL/TRANSFER | Chord chart | inspected real charts | The REPAIR sentence about which jazz.9 options carry a chart [MAP 630] adds *There Will Never Be Another You* and *After You've Gone* after intake. Take Five, Lullaby of Birdland and Linus and Lucy stay as before | none | Checker: a script can confirm after intake that `chordCount > 0`, which is what draws the Chart door [WF 33]. Rights decide whether a chart is in the public build | The learner opens the chosen standard in the chord chart from the rung | REPAIR → REPAIR |
| J3 | A10.1 | MUSIC | Chord chart | inspected real chart + shipped arrangement | jazz.9's one standard is *There Will Never Be Another You*: melody, shells, bass, solo, intro and ending, then a solo-piano realisation [Q CURRICULUM-USE-SYNTHESIS:33]. The harmonised-melody pass takes the shipped *Fly Me* as its voicing model. If *There Will Never Be Another You* cannot ship publicly, the public-build fallback is *After You've Gone* | none | Live cell unstored [M §15]. Self-checked: each role. No one here can judge the performance | One arc on one standard: comp, walk, a chord-tone chorus, intro and ending, a harmonised-melody pass | REPAIR → REPAIR |
| J4 | A10.1 | INDEPENDENCE | Blind | inspected real chart | Memorise the standard, start it from several points, then play it in a key not practised, on the open chart of *There Will Never Be Another You*, never on a finished arrangement [Q HANDOFF-TO-CLAUDE:65] | none | A Blind run looks the same as a sighted one [M §10]. Self-checked | As in the map [MAP 632] | SHARED → SHARED |

| Row | Admission (quarry, then project) | Public export | Evidence |
| --- | --- | --- | --- |
| J1 | *After You've Gone*: ADMIT / HIGH-PRIORITY [Q jazz-2:15]. Transcription: HIGH-PRIORITY CANDIDATE [Q CANDIDATE-REVIEW:189]. Neither is imported (IM-10; the transcription waits until passages are chosen) | *After You've Gone*: licence `publicdomain`, label unknown, and the metadata gives no date. Needs a rights record. Transcription: label unknown; the tune is presumed in copyright [I] | Q jazz-2:7-25; Q CANDIDATE-REVIEW:180-191; MAP 364; M §3, §7b, §15 |
| J2 | Both ADMIT [Q CANDIDATE-REVIEW:202; Q jazz-2:15]; IM-10, IM-11 | *There Will Never Be Another You*: presumed in copyright [I; label unknown]. *After You've Gone*: as J1 | MAP 630; WF 33 |
| J3 | *There Will Never Be Another You*: ADMIT. *Fly Me*: shipped | As J2. If the standard cannot ship publicly, jazz.9 faces the same open public-build question as latin.8 [MAP 8.6 item 4] | Q CURRICULUM-USE-SYNTHESIS:24-37; MAP 631 |
| J4 | As J3 | As J2 | Q HANDOFF-TO-CLAUDE:54-65; MAP 632; M §10 |

**Examined, no change.** A7b.1 MODEL and MUSIC (SOURCE-NEEDED, MAP 348-349). The quarry supplies no score that prints iiø7-V7-i. Its *Fly Me* is the shipped file the map already rejects. The harmony of *Blue Bossa* and of *Autumn Leaves* is explicitly unread [Q CANDIDATE-REVIEW:191, 231], and the summaries print no chord symbols [S]. The cheapest next step for the wave 2.3 brief is to read those two files' `<harmony>` elements.

### 1.3 A7c Latin

**Cuban terms at HEAD, against the tightened terms.** Guajeo is the broader repeated syncopated ostinato, often arpeggiated. Montuno has several meanings, one of them a piano guajeo. Tumbao is historically a bass rhythm, and in timba also a piano guajeo. Ponchando is the block-chord, non-arpeggiated guajeo with its attack points foregrounded [Q STYLE-VERIFICATION:44-50; Q HANDOFF-TO-CLAUDE:28-37]. Those definitions cite Wikipedia (Guajeo, Montuno, Tumbao, Guajeo#Ponchando), a secondary source.

| Where | Text at HEAD | Term and sense used | Against the tightened terms | Must change? |
| --- | --- | --- | --- | --- |
| `content/lessons/latin.md:23-26` | "**Tumbao** is the bass pattern: not on beat one…" | tumbao, in the bass sense | matches the historical bass usage | Keep. Add one clause: some players call the piano figure a tumbao, as the rung's own video does |
| `latin.md:6` (video label) | "How to play a Salsa montuno (tumbao) on the piano" | montuno = tumbao, in the piano (timba) sense | contradicts the lesson's bass definition, with no explanation | The label is the video's own title; the clause above explains it |
| `latin.md:28-31` | "**Montuno** is the right-hand pattern: a repeating syncopated figure built from the chord's notes, usually in octaves or thirds, locked to the clave" | montuno = a piano guajeo | an allowed usage. It omits that montuno also names a section, and that the family of figures is the guajeo | Add one clause. It must never become "arpeggiated". A grep of `content/lessons/latin*.md` finds no "arpeggiat" at HEAD, so W16's "arpeggiated" item [MAP 80] is not in those files now |
| `content/lessons/latin.6.md:35-38` | "The three-note study in D minor is the figure itself: every note is a clave stroke" | montuno = clave strokes played as chords | The published families are the guajeo and the ponchando. No source read here prints chords on each clave stroke as a montuno or a ponchando. The latin record says it is "the clave's rhythm played as chords, not a guajeo" (MAP 395) | **Must change**: call it a block-chord study on the clave strokes, a preparation for the montuno, unless a published source prints it as a ponchando |
| `tools/content/generate_exercises.py:5155` (docstring), `:5171` (title), `:5174` (direction) | "A guajeo is chord tones on the clave's own strokes"; "Montuno — n notes on son 3 2"; "Every note is a clave stroke" | guajeo = clave strokes | The docstring contradicts the published definition, and the title overclaims | **Must change**: fix the docstring (not learner-facing) and retitle (learner-facing; the catalogue titles regenerate). The rhythm and the digests are unaffected |
| `generate_exercises.py:5221` (latin-groove title) | "tumbao and montuno" | inherits from the montuno title | as above | Follows the montuno retitle |
| `generate_exercises.py:5114-5127`, `TUMBAO_OFFSETS` `:4907` | bass on the "and" of 2 and on 4, with the anticipation | tumbao, in the bass sense | matches | Keep |
| `content/curriculum/concepts.json:2278-2292` (montuno finder) | constraint "a montuno figure"; avoid "block chord accompaniment" (`:2289`) | montuno excludes block chords | contradicts the shipped montuno items, which are block chords, and excludes the ponchando | **Must change** with the term fix |
| `concepts.json:4031-4045` (tumbao finder); `content/curriculum/stage-5.json:737-742`; `content/curriculum/00-tracks.json:76` | "tumbao bass line"; "locking a montuno to the clave with a tumbao bass underneath"; "clave, tumbao and montuno" | tumbao is bass; montuno is piano | allowed | Keep |
| MAP 8.3 table; SHOULD latin#7 [MAP 441]; G15 title [A G15] | "montuno (guajeo later)"; "an arpeggiated guajeo as the second montuno step" | the arpeggiated guajeo as one type of guajeo | allowed, if it is named as one type and not as *the* montuno | G15 keeps the name "arpeggiated guajeo". Its near-miss (the chordal items fail) proves arpeggiated ≠ block chords, not montuno ≠ non-montuno |

| Row | (1) Deficiency | (2) Station | (3) Mode | (4) Source type | (5) Exact artefact | (6) Published definition | (7) Verification boundary | (8) Completion condition | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L1 | A7c.1, habanera and tresillo as distinct cells [MAP 376-390] | MODEL/TRANSFER | Keep tempo | inspected real score excerpts (shipped) | *Por Una Cabeza* `QmNswaWYXpxK1XegKbJVDULwZMjKN6cETGTVfXQKYsYrzs`, which is the shipped `song.folk.por-una-cabeza-carlos-gardel.pdmx`, bars 1-14. In every one of bars 1-14 the LH is quarter, eighth rest, eighth, quarter, quarter: onsets 0, 1.5, 2, 3 [S, read here]. *The Crave* is unchanged. **For the habanera MODEL, the quarry retained neither Bizet nor *Contra Danza*.** A grep for "bizet" and "contra" finds them in none of README.md, lanes.json or the batches, so neither was dumped or reviewed. IM-3 stays CANDIDATE with its dumps pending | The habanera is dotted eighth, sixteenth, eighth, eighth in 2/4: the upgrade's definition [U §0.3], with the Wikipedia Habanera and Tresillo pages as a secondary source [A G13]. STYLE-VERIFICATION §3 restates the cell without a citation [Q STYLE-VERIFICATION:69]. The primary check, a printed habanera (IM-3), is still unread | Checker: CK-5 (onset sets, and the cross-failure with the tresillo), CK-7, CO-4 and CO-5, all as in the map. The written durations differ from the cell: a quarter plus an eighth rest stands where the doubled cell has a dotted quarter. So the cell's identity rests on the onsets, which is what CK-5 checks [S]. The app's ±150 ms window cannot resolve the cell at speed [M §2(ii)]. No one here can judge the feel | Unchanged from the map [MAP 384, 390] | REPAIR → REPAIR |
| L2 | A7c.2, comp a Cuban tune: tumbao and montuno under *Guantanamera* [MAP 392-406] | CONTROL | Keep tempo | generated control + lesson text | The shipped items `exercise.tumbao.c/.g`, `exercise.montuno.*`, `exercise.latin-groove.*` keep their rhythms. The wording repairs are the "must change" lines in the terms table above: the latin.6 sentence, the montuno docstring and title, and the finder's avoid line. G15 (SHOULD latin#7) stays gated on one published guajeo pattern. Mauleón is still unread, and the quarry surfaced two more books without reading them: Patiño and Moreno's *Afro-Cuban Keyboard Grooves*, and Moore's *Beyond Salsa Piano* [Q style-source-match-1:29-33] | The tightened terms above [Q STYLE-VERIFICATION:44-50] | Checker: unchanged for the existing items. A reader confirms each changed sentence against the definitions. No one here can judge the feel | The learner plays the tumbao and the block-chord clave study under the names the lesson now gives them | EXISTING → REPAIR |
| L3 | A7c.2 | MODEL/TRANSFER | Chord chart; then Keep tempo + Loop for a printed excerpt | lesson task + inspected real score excerpt | The NEW latin.5 task under *Guantanamera* stays [MAP 400]. Added as a candidate: *La Negra Tiene Tumbao* `QmbYzj8P6PbJ9DwbepDeMSHTVoHyEEMhQRsuTLcqf3bqyd` (68 bars, two staves, 46 symbols). Bars are to be chosen **only after** they have been classified from their note motion as arpeggiated guajeo, ponchando or bass tumbao [Q STYLE-VERIFICATION:56-60]. The quarry's own reading is that "much of the inspected opening/verse texture is block-chordal" [Q style-source-match-1:38] | The tightened terms. The title never classifies the figure [Q HANDOFF-TO-CLAUDE:37] | Checker: CK-7 on the cut. Reader: the classification against a published 2-3 or 3-2 example [Q style-source-match-1:39]. Self-checked: clave alignment. No one here can judge the feel | The learner plays the chosen bars and says which family, as the lesson defines them, the bars show and why | NEW → NEW |
| L4 | A7c.2 | MUSIC | Chord chart | lesson task; inspected real score (personal library) | The end-of-lesson test pointed at *Guantanamera* stays [MAP 401]. *La Negra*, whole, is a personal-library MUSIC candidate after L3 | As L3 | Chart live cell: no verdict for a tumbao [M §15]. Self-checked | As in the map | REPAIR → REPAIR |
| L5 | A7c.3, comp a Brazilian tune with a bossa accompaniment [MAP 408-421] | CONTROL | Keep tempo | generated control from a published pattern | G14: EXTEND the `comping` bossa form with "one or more sourced bossa accompaniment patterns" [Q STYLE-VERIFICATION:32]. The build brief chooses one pattern from a published source and writes its onset, duration and pitch-role contract [Q HANDOFF-TO-CLAUDE:26]. The quarry names these sources: three Piano With Jonny pages (URLs at Q STYLE-VERIFICATION:16-21), an *O Piano Brasileiro* unit 6 sample [Q style-source-match-1:10], 8notes, and PianoGroove [Q style-source-match-1:13-14]. Those are teaching pages and a sample of a method, not a whole method read. The addendum's contract field "root and fifth roles" [A G14] fits the published two-layer picture (an LH root/fifth bass under syncopated RH chords [Q STYLE-VERIFICATION:16]). It does not fit the Garota edition, whose LH strikes root and chord in one attack with no separate bass [S, read here]. The brief must say which texture its CONTROL teaches. `exercise.clave.bossa` stays rhythm-only | **The boundary the quarry found:** a coordinated bass plus a syncopated chordal rhythm, taught as several progressively syncopated patterns, not as one universal rhythm [Q STYLE-VERIFICATION:13-34; Q style-source-match-1:16-19] | Checker: onset sets and root/fifth pitch classes per bar against the chosen published cell [A G14], plus a sibling near-miss that must fail (the clave-only item, for instance). Reader: the outside reviewer checks that the contract transcribes the published example. No one here can judge the feel | The chosen pattern under a two-chord vamp in Keep tempo at the pass pair, in the keys the source gives | SOURCE-NEEDED → SOURCE-NEEDED, narrowed: gated on one pattern, no longer blocked on the style |
| L6 | A7c.3 | MODEL/TRANSFER | Keep tempo + Duet (the LH alone under the app's melody, then hands together); Chord chart for the transfer | inspected real score excerpt; shipped lead sheets | **(a) MODEL:** *Garota de Ipanema* `QmRWDfadi4gsez9ishabhEcHpHNdjC7q2efEJZe5SDa8X8`, arranged by Bianca Giovanella: 34 bars, 2/4, grand staff, 24 symbols. Its LH cells [S, read here]: a two-bar cell in bars 1-2, 3-4 and 24-27 (bar 1 onsets 0, 0.75, 1.75; bar 2 onsets 0.25, 0.75, 1.5, in quarter-note units), whose first bar returns in bars 5 and 28; bar 6 varies it; a one-bar cell (onsets 0, 0.5, 1.25) in bars 7-8, 10-12, 14-16, 18 and 30-33; held half-note chords in bars 9, 13, 17 and 19-23. The quarry says "bars 1-7" [Q STYLE-VERIFICATION:11]. The proposed excerpt is bars 1-8 (the two-bar cell, then the one-bar cell), which is a selection for the build brief. **(b) TRANSFER:** apply the taught CONTROL pattern to *Só Danço Samba* (shipped, 25 symbols) and *Insensatez* (shipped, 28 symbols) | As L5. Garota is "a real written bossa accompaniment in context", not *the* pattern [Q STYLE-VERIFICATION:24-26]. Its layout, LH chords under an RH melody, matches *O Piano Brasileiro*'s first solo-piano technique as the quarry reports it [Q style-source-match-1:10]; I report that, I did not read it | Checker: CK-7 on the cut. Once L5 has chosen a pattern, a script compares Garota's LH onsets with it. That comparison decides whether the lesson may say "the pattern you practised" or must say "a related pattern". Reader: CO-5. Self-checked: the application to the lead sheets. No one here can judge the feel | Garota bars 1-8, LH, in Keep tempo, then hands together; then 16 bars of *Só Danço Samba* from its symbols over the taught pattern (self-checked) | SOURCE-NEEDED → NEW for (a); SOURCE-NEEDED for (b) until L5 |
| L7 | A7c.3 | MUSIC | Chord chart | inspected real chart | jazz.8's reference to bossa inside jazz (SHOULD jazz#9) gets *Blue Bossa* `QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6` as its substrate, played with the A7c.3 pattern | As L5 | Live cell, unstored. Self-checked | One chorus of *Blue Bossa* over the taught pattern | SHARED → SHARED |
| L8 | A7c.3 | INDEPENDENCE | — | shipped lead sheet | A7c.2's tradition-choice task [MAP 402], plus *Corcovado*: the shipped `song.pop.corcovado.pdmx`, 31 symbols, currently placed on chords-pop only. The learner chooses and adapts a taught pattern with no written accompaniment in front of them [Q CURRICULUM-USE-SYNTHESIS:51] | As L5 | Self-checked | The learner names the tradition and plays *Corcovado* with a chosen bossa pattern, unprompted | SHARED → SHARED |

| Row | Admission (quarry, then project) | Public export | Evidence |
| --- | --- | --- | --- |
| L1 | Shipped; ADMITTED [MAP 1017]. Quarry: KEEP AS HABANERA MODEL candidate [Q STYLE-VERIFICATION:72] | Shipped (the catalogue records composition status unknown) | Q STYLE-VERIFICATION:67-76; Q latin-1:73-83; S E-latin/por-una-cabeza-carlos-gardel; MAP 384, 857 |
| L2 | Shipped items | Shipped | Q STYLE-VERIFICATION:41-65; Q style-source-match-1:26-44; the file lines in the terms table; MAP 80, 399, 441 |
| L3 | *La Negra*: HIGH-PRIORITY CANDIDATE [Q CANDIDATE-REVIEW:67; Q STYLE-VERIFICATION:54]; not imported (IM-13, after classification) | Label unknown; presumed in copyright [I]. Personal-library and curriculum admission are separate decisions, as for Libertango | Q CANDIDATE-REVIEW:57-69; Q style-source-match-1:36-44; MAP 400 |
| L4 | As L3 | As L3 | MAP 401; M §15 |
| L5 | — (a generator row) | — | Q STYLE-VERIFICATION:8-34; Q style-source-match-1:7-24; Q HANDOFF-TO-CLAUDE:19-26; A G14; MAP 415 |
| L6 | Garota: ADMIT AS BOSSA MODEL / TRANSFER CANDIDATE [Q STYLE-VERIFICATION:24]; HIGH-PRIORITY CANDIDATE [Q latin-1:43]. Not imported: IM-6. *Só Danço Samba* and *Insensatez* shipped, ADMITTED as substrate [MAP 1017] | Garota: licence `cc-zero` for the upload; README label unknown; the composition is presumed in copyright [I]. Public export is no until a rights record exists. **If the MODEL cannot ship, the public build carries A7c.3 on CONTROL plus the application on shipped sheets, and the lesson says so.** That is the open public-build question of MAP 8.6 item 4 | Q latin-1:33-46; Q STYLE-VERIFICATION:8-34; S E-latin/garota-de-ipanema; MAP 416; M §2, §13, §15 |
| L7 | *Blue Bossa*: ADMIT [Q CANDIDATE-REVIEW:228]; not imported (IM-12, with jazz#9) | Label unknown; presumed in copyright [I] | Q CANDIDATE-REVIEW:219-231; MAP 417, 444 |
| L8 | *Corcovado* shipped; quarry: ADMIT AS APPLICATION SUBSTRATE, identity TITLE_ONLY [Q latin-1:17-19] | Shipped | Q latin-1:9-19; Q CURRICULUM-USE-SYNTHESIS:50-51; MAP 418 |

**Examined, no change.** A7c.4 MODEL/MUSIC (SOURCE-NEEDED, MAP 431-433). Libertango (IM-2) stays the primary candidate; the quarry did not review its CID [Q README:288 names it only as a lane goal]. *Adiós Nonino* `QmYNaW9VvQDFWoD159XYCPxmvyJmGBkhrFijb1P1PaLRUE` is a HIGH-PRIORITY CANDIDATE for Argentine tango MODEL, MUSIC and advanced arrangement analysis: 81 bars, an ensemble with two two-staff piano parts [Q latin-1:60-71]. It is recorded as a second candidate for A7c.4's MUSIC and analysis role, in the personal library, not as a replacement. No named-figure claim is made for it.

### 1.4 A7d Ragtime

| Row | (1) Deficiency | (2) Station | (3) Mode | (4) Source type | (5) Exact artefact | (6) Published definition | (7) Verification boundary | (8) Completion condition | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | A7d.1, keep a duple oom-pah under early syncopation [MAP 448-462] | MODEL/TRANSFER | Duet (the LH alone, then with the app's RH) [M §13]; Keep tempo + Ladder | inspected real score excerpt | *The Harlem Rag*, Tyers edition, `QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9`: 115 bars, 2/4, "Moderato", by Turpin, revised and arranged by Tyers. From the summary [S, read here]: strain A is bars 5-20 (repeat from bar 5, first ending bar 20, second ending bar 21). The LH alternates bass and chord in eighths in every bar from 5 to 19. The RH plays dyads in straight eighths in the odd bars and a tied-sixteenth syncopation in the even bars. Bars 1-4 are an octave unison introduction and a break, with no oom-pah. **The window becomes bars 5-12 first, then bars 5-20.** It replaces the map's "bars 0-16, bars 1-8 first" [MAP 456], which was read from the De Lisle edition | Ragtime in the broad sense: a syncopated treble over a steady bass, normally in contrasting strains (Library of Congress, cited at Q STYLE-VERIFICATION:82). "Oom-pah" is the map's word for the bass-chord alternation, a structural claim | Checker: CK-7 and CO-5. IM-1's second-edition comparison now has both CIDs (Tyers, and De Lisle `QmaUQo93TVPNaJ6UDzttTyksRcPDcyafR8Nxct8qXHeEsj`). Self-checked: straight, not swung. No one here can judge the feel | The LH of bars 5-12 at the rung's pass pair in Keep tempo (Duet), then bars 5-20 with the RH | SOURCE-NEEDED → NEW (an import and a cut; the source has now been read) |

| Row | Admission (quarry, then project) | Public export | Evidence |
| --- | --- | --- | --- |
| R1 | ADMIT / HIGH-PRIORITY [Q ragtime-1:16]; not imported. IM-1 resolves to this CID | README label unknown; the title metadata dates it 1899; likely eligible [I]; the project's composition record decides | Q ragtime-1:7-18; Q STYLE-VERIFICATION:82; S H-ragtime/the-harlem-rag-1899-tyers; MAP 451, 456, 855 |

### 1.5 A7e Rock and A10.2

| Row | (1) Deficiency | (2) Station | (3) Mode | (4) Source type | (5) Exact artefact | (6) Published definition | (7) Verification boundary | (8) Completion condition | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| K1 | A7e.1, reduce a band texture to piano. The map's evidence: "There is no rock-idiom piano score in the catalog" [MAP 469-483, 472] | MODEL/TRANSFER | — (paper); a notated and imported reduction is judged on the Score screen against what the learner wrote [M §7a] | inspected real score (ensemble), reduced by the learner | rock.8 step 1 stays "a score the learner supplies" [MAP 477]. Added: one optional supplied source, *Come As You Are* `QmUZdYocuapo9pjAs7Qbb5JSfhZHyp24Rbm9oZGnWWWq74`. It is a 26-bar percussion-ensemble arrangement: two grand-staff marimbas, vibraphones, glockenspiel, synth and drums. The opening exposes the riff, and later sections turn it into fifths and dyads, block attacks and broken figures [Q rock-1:7-18]. The eight bars to reduce are to be chosen | No style claim. The quarry warns against claiming guitar technique from a mallet arrangement [Q rock-1:18] | Nothing measures the reduction itself [MAP 482]. Reader: the outside reviewer chooses the bars. No one here can say whether the reduction sounds like the song | The learner reduces eight bars to melody, bass and one texture, and writes down what was left out | NEW → NEW (an optional supplied source; learner-supplied material stays the public default) |
| K2 | A10.2, arrange a full song: rock.9's project [MAP 638-652] | MUSIC | Perform | inspected real scores (personal library) | The learner's own song stays the default, because INDEPENDENCE is "the song chosen by the learner" [MAP 648]. Optional supplied capstones: *Enter Sandman* `QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo`, a 148-bar two-staff piano reduction for pedal, riff and build [Q CANDIDATE-REVIEW:112-124; Q metal-1:7-12]; and *A Little Piece of Heaven* `QmbwnWBK5FE51CVpqjZ4fSQW87SX1MNzehooGRbNPDrkfm`, a 206-bar mixed score in 4/4, 2/4, 6/4, 3/4 and 5/4 [Q metal-1:29-43] | none | Perform records one take [M §9]. Self-checked: the arrangement decisions. No one here can judge the arrangement | As in the map | NEW → NEW (optional supplied capstones) |

| Row | Admission (quarry, then project) | Public export | Evidence |
| --- | --- | --- | --- |
| K1 | HIGH-PRIORITY CANDIDATE [Q rock-1:16]; not imported | Label unknown; presumed in copyright [I]. Personal library only | Q rock-1:7-18, 54-61; MAP 472, 477 |
| K2 | *Enter Sandman*: HIGH-PRIORITY CANDIDATE. *A Little Piece of Heaven*: HIGH-PRIORITY CANDIDATE. Neither is imported | Both presumed in copyright [I]. Personal library only | Q metal-1:7-43, 71-77; MAP 647-648 |

The rock jobs stay distinct and are not flattened into "rock repertoire". Here is where each attaches, or why it does not:
- *Come As You Are*: a riff turned into a fifths texture, and an ensemble to reduce for keyboard (K1).
- *New Born*: a broken-chord ostinato kept through changes of harmony.
- *Starlight*: a bass groove kept under a density build. With *New Born*, this belongs to SHOULD rock-metal#4 (register and density; rock.7's required run becomes an excerpt) [MAP 485], in wave 5.
- *Hysteria*: a dense riff grown into a full arrangement. Also SHOULD rock-metal#4.
- *Iron Man*: a clean fifth or power riff, but no MUST station asks for it.
- *Enter Sandman* and *A Little Piece of Heaven*: K2.

Source: [Q rock-1:54-61; Q metal-1:71-77].

### 1.6 A7g Hymns and 7h Holiday

| Row | (1) Deficiency | (2) Station | (3) Mode | (4) Source type | (5) Exact artefact | (6) Published definition | (7) Verification boundary | (8) Completion condition | State |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| H1 | W14: the hymns.2 *Joyful, Joyful* edition lowers the tune's third. It protects A7g.1 and A7g.2 [MAP 78] | MODEL/TRANSFER (hymns.2 material) | Keep tempo | shipped score decision | The quarry's "requested correct *Joyful, Joyful* replacement", `QmZwo2Muh2rip4gGET7fkkXFgaLQiK6kc6p89ssZbqysxB` [Q hymn-1:7-16], is **already shipped** as `song.classical.beethoven-joyful-joyful-we-adore-thee.pdmx`. That is the hymns.4 edition: 16 bars, grand staff, G major, level 5.36. W14 concerns a different file, the single-line hymns.2 edition `...beethoven-ludwig-van-beethoven-joyful...pdmx` (D, no key signature) [SYNTHESIS:14]. So the quarry's candidate does not serve the IM-5 role, a single line with F♯ at Stage 2. W14's choice stays (a) label, (b) replace from another single-line edition, or (c) drop | none | Checker: none. A reader confirms the F♯ of any replacement | As in W14 | REPAIR → REPAIR (unchanged; the quarry candidate is rejected for this role) |
| D1 | 7h: SHOULD holiday#6, "Hanukkah pieces: remove from D8 or add to the Library" [MAP 572] | MUSIC (Library) | Keep tempo, after intake | inspected real scores | *Maoz Tzur* `QmSe5SBzVY7xuqiqbPmyNF9tcMb5LBNnWUfnKbYung75mY`: 18 bars in three single-staff parts, S, A and T. It is not SATB, and making it playable at the keyboard is itself the arranging task [Q holiday-1:7-21]. *Dreidel Song*, Lowe arrangement, `QmaA1mDoFknzx5s2Es9zchiUMGo8QRF1y2CiN4MmoyNs9Q`: 9 bars, an ensemble with a grand-staff piano giving bass-and-chord support [Q holiday-1:23-36] | none | It is not established whether the Score screen can run a three-part single-staff score as a two-hand item. Intake answers that. Self-checked: the arrangement | The learner plays the *Dreidel Song* piano part, and arranges *Maoz Tzur*'s three voices for two hands | the "remove or add" disposition → add after intake (candidates; wave 5) |

| Row | Admission (quarry, then project) | Public export | Evidence |
| --- | --- | --- | --- |
| H1 | The quarry's HIGH-PRIORITY CANDIDATE is the shipped hymns.4 file | Shipped | Q hymn-1:7-16; catalogue row; SYNTHESIS:14; MAP 78, 859 |
| D1 | *Maoz Tzur*: ADMIT / HIGH-PRIORITY. *Dreidel Song*: ADMIT / KEEP CANDIDATE. Neither is imported (IM-14) | *Maoz Tzur*: licence `publicdomain`, label unknown. *Dreidel Song*: `cc-zero`, arranged by Lowe, label unknown. A rights record is needed | Q holiday-1:7-43; MAP 572 |

**Hymns: examined, no change.** *Holy, Holy, Holy* (Dykes, `QmWyFckvyoMiNLFawUiRMTeH2USzFHijjt8TdEWbTRDQ7N`) and *Deep River* (`QmbP96wZt5Vev9pA8pembvkaMw2wx48M3PR3pWNMfJuASp`) repair no MUST station the map marks as deficient. A7g.1's MODEL is a lead-sheet task, and A7g.2's MODEL is EXISTING [MAP 540, 556]. W14's "four-part" fix is text, and the hymns record already lists shipped written four-voice settings: Amazing Grace SATB, Abide with Me and Rock of Ages (`extracts/hymns-gospel.md:13`). The Dykes file is also two separate single-staff parts [Q hymn-1:22], which raises the same intake question as D1. Choosing among hymns is by gap, not by volume.

---

## 2. Where the quarry and the map's prior evidence disagree

| # | Point | Quarry | Map or prior record | Which wins, and why |
| --- | --- | --- | --- | --- |
| 1 | *Por Una Cabeza* as the habanera | The latin batch says the notation is "not, by itself, proof" [Q latin-1:83]. STYLE-VERIFICATION then keeps it as a candidate [Q STYLE-VERIFICATION:72], but only by restating the map's own onsets [Q STYLE-VERIFICATION:69] | ADMITTED, with CK-5 [MAP 384, 1017] | **The map wins**, with CK-5 kept. The quarry's §3 is not an independent read. My read of the summary confirms onsets 0, 1.5, 2, 3 in bars 1-14 [S] |
| 2 | *Joyful, Joyful* replacement | The quarry calls `QmZwo2…` "the requested correct replacement" [Q hymn-1:15] | W14 and IM-5 concern the single-line hymns.2 edition [MAP 78, 859] | **The map wins.** The quarry's file is the shipped hymns.4 grand-staff edition, not a Stage 2 single line |
| 3 | The Harlem Rag window | The Tyers edition is retained [Q ragtime-1:7-18] | "bars 0-16, bars 1-8 first" [MAP 456], read from De Lisle | **The Tyers summary wins.** The map's window came from another edition, as the map itself warned [MAP 451]; in Tyers, bars 1-4 are an introduction with no oom-pah |
| 4 | Whether bossa is sourced | The style boundary is sourced, and so is a MODEL [Q STYLE-VERIFICATION:23-34] | "No bossa bass definition has been read"; blocked [MAP 411; A G14] | **The quarry wins on the style boundary**, because it cites sources. **The map wins on the build requirement**: the exact contract comes from a published pattern. G14 is therefore gated on a pattern |
| 5 | Garota's patterned bars | "bars 1-7" [Q STYLE-VERIFICATION:11] | — | **The summary wins for the excerpt boundary.** The two-bar cell runs in bars 1-4, its first bar returns in bar 5, bar 6 varies, and the one-bar cell starts at bar 7 [S] |
| 6 | Which Pinetop edition | Parham edition, ADMIT [Q blues-2:16] | The shipped Pinetop is already on blues.8 [MAP 84] | **Neither yet.** A second-edition comparison (IM-8) decides. The shipped edition stays the default because it has already passed intake |
| 7 | What "guajeo" means in the generator | Repeated syncopated ostinato, often arpeggiated [Q STYLE-VERIFICATION:44] | `generate_exercises.py:5155`: "A guajeo is chord tones on the clave's own strokes" | **The quarry wins**, because it cites published definitions (secondary). The docstring and the titles change (§1.3) |

The quarry and the map agree on these points: St James Infirmary is already admitted; *Fly Me* does not show the minor ii-V-i; Só Danço Samba and Corcovado are substrates and not models.

---

## 3. SHOULD lines the quarry touches (no MUST row)

| SHOULD line | Effect |
| --- | --- |
| latin#6, a bossa pattern [MAP 440] | Moves with L5: gated on one pattern, no longer source-blocked |
| latin#7, the arpeggiated guajeo [MAP 441] | G15 stays gated on one published guajeo example. The quarry narrows the terminology only (§1.3) |
| jazz#9, bossa inside jazz [MAP 444] | *Blue Bossa* is the substrate, after G14 (L7) |
| ragtime#8, stop-time [MAP 465] | *The Ragtime Dance* `QmXd7HNnNZodQvrybARoZN8NtcZ2LVpJ1Wxbkc8Gq9YJ36` shows the contrast between accented interruption and continuous texture. The label "stop-time" stays gated until a direct definition is supplied [Q STYLE-VERIFICATION:85-88]. "Awareness only", taught as the observable contrast, is now possible with a real score. Wave 5 |
| rock-metal#4, register and density [MAP 485] | *Starlight* and *Hysteria* are the candidate excerpts (§1.5). Wave 5 |
| rock-metal#7, off-beat comping (G16) [MAP 488] | Not moved. The "repeated offbeat chord figures" of *A Little Piece of Heaven* [Q metal-1:37] have no bars and no published definition |
| blues-boogie#7, one historical lick [MAP 166] | Served by B2's Morton excerpt once it is cut |
| jam#7, a real tune at jam.5/6 [MAP 235] | *St James Infirmary*: the id is confirmed shipped, with 41 symbols, and it opens in the chart [WF 44] |
| improv-compose#9, models of composition | James Hook's *Minuet* `QmfRYEUhXHSj9a8yk5s4b5ErUsrQ3QkNNxgcJhfU65VjfE` (16 bars, 8+8, ADMIT) [Q improv-compose-1:21-35]. A6.1's MODEL keeps Swing Low and Oh! Susanna, because those carry a printed chart to check against. *New Bath Minuet* has none [Q improv-compose-1:37-50] |

**Considered and not entered, with the reason.**
- *Sunflower Slow Drag*: no slow-drag job is named [Q ragtime-1:41-43].
- Pop (*Hallelujah* easy, *The Scientist*, *She's Always a Woman*): no pop station is marked NEW or SOURCE-NEEDED. *The Scientist* is a natural reverse-engineering example for A10.2's REPAIR MODEL, which is the orchestrator's call.
- *Numb*, *Hallowed Be Thy Name* and *Pull Me Under*: the last is rejected; it is a drum-set part [Q metal-1:45-55].
- The big-band *Girl from Ipanema*, *Tico-Tico*, *Satin Doll* and *All of Me*: each is rejected for the role, or the job is already covered.

---

## 4. Proposed record changes for the orchestrator to fold in

- **IM-1:** the CID is now `QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9` (Tyers). It is compared with De Lisle `QmaUQo…`, and the window becomes bars 5-20.
- **New imports:**
  - IM-6: Garota (rights decision first).
  - IM-7: Morton.
  - IM-8: Pinetop-Parham, compared with the shipped `song.folk.boogie-woogie.pdmx`.
  - IM-9: *Blues Riff in C* (needs re-staffing and the B♮ read).
  - IM-10: *After You've Gone*.
  - IM-11: *There Will Never Be Another You* (rights).
  - IM-12: *Blue Bossa*, with jazz#9.
  - IM-13: *La Negra*, after classification (rights).
  - IM-14: *Maoz Tzur* and *Dreidel Song*, in wave 5.
  - Optional personal-library intake: *Come As You Are*, *Enter Sandman*, *A Little Piece of Heaven*.
- **CK-7** is extended to re-staffing (part events equal source events) for *Blues Riff in C*.
- **CO-5** gains four cuts: Morton, Pinetop, *Blues Riff in C* and Garota.
- **G14's checker** gains one structural comparison: Garota's LH onsets against the chosen published cell.
- **Map §5.1 "Not trusted", §5.2 and §8.5:** G14 moves from "source-blocked" to "gated on a pattern"; G4, G15 and G16 stay.
- **Map §8.5 admission states:** Garota is a MODEL candidate. *Blue Bossa*, *After You've Gone* and *There Will Never Be Another You* are substrate candidates. Bizet and *Contra Danza* stay CANDIDATE and were not dumped by the quarry.

---

## 5. Summary

### 5.1 Rows by previous and new state

Twenty rows: B1-B3, J1-J4, L1-L8, R1, K1-K2, H1 and D1.

| Previous state | Rows | New state |
| --- | --- | --- |
| EXISTING (2) | B1 | EXISTING |
| | L2 | REPAIR |
| NEW (6) | B2, B3, J1, L3, K1, K2 | NEW |
| REPAIR (5) | J2, J3, L1, L4, H1 | REPAIR |
| SOURCE-NEEDED (3) | L5 | SOURCE-NEEDED, narrowed to one pattern |
| | L6 | NEW for the MODEL item; SOURCE-NEEDED for the TRANSFER item |
| | R1 | NEW |
| SHARED (3) | J4, L7, L8 | SHARED |
| SHOULD disposition (1) | D1 | add after intake |

New-state totals: EXISTING 1, REPAIR 6, NEW 9 (L6's MODEL item counted here), SOURCE-NEEDED 1 (L5), SHARED 3 and one SHOULD disposition. L6 also keeps a SOURCE-NEEDED TRANSFER item.

### 5.2 Blocks whose wave assignment changes

1. **A7c.3 moves from wave 4 item 5 to wave 3, beside A7c.2** (its priority is P3) [MAP 929]. The dispatch condition becomes "the build brief names one published pattern and its contract", no longer "the style's source is read". The Garota MODEL joins only after intake and a rights decision.
2. **A7c.2's term repair moves from wave 3 to wave 1(a), with W16.** The latin lessons are already in that seam, and the brief says to fix the terms before G15 or any lesson text.
3. **A7a.1's real MODEL and TRANSFER items (B2, B3) join wave 2 item 7**, the blues seam with A7a.2 and A7a.3, where CK-7 and CO-5 are available [MAP 921]. Wave 1(c) is unchanged: it has no excerpt and no checker.

These waves do not change: A7d.1 (wave 2.5; IM-1 is resolved and the window changes), A7c.1 (2.4), A10.1 (4.1), A7e.1 (4.2), A10.2 (4.3), W14 (1(a)) and holiday#6 (5).

### 5.3 Generator rows that move from source-blocked to gated on a pattern

- **G14 moves.** The style boundary is sourced; the build brief must choose one published pattern and write its onset, duration and pitch-role contract.
- G15 does not move: its blocker is still one published guajeo example, and the quarry adds terminology and two unread books.
- G16 and G4 do not move.
- G13 was never source-blocked.

### 5.4 What remains open

1. **Rights and the public build.** Garota, *La Negra*, *Blue Bossa*, *There Will Never Be Another You* and the rock and metal scores are presumed in copyright [I]. The quarry's composition label is `unknown`. So MAP 8.6 item 4's question (what a rung does when its material is personal-library only) now also covers A7c.3's MODEL, jazz.9's standard, K1 and K2. The owner decides that as a product question, on a rights record.
2. **G14:** which published pattern, its exact contract, and whether Garota's LH matches it. A script settles the match once the pattern is chosen.
3. **Classifying *La Negra*'s bars** (a reader, against a published example).
4. **The B♮ in *Blues Riff in C*** against the C7 voicing: a typo or intended (a reader).
5. **Bar selection:** Morton, Pinetop, Garota (bars 1-8 proposed) and the *Autumn Leaves* passages. Then the Pinetop edition comparison (IM-8).
6. **A7b.1's MODEL is still SOURCE-NEEDED.** Read the `<harmony>` of *Blue Bossa* and *Autumn Leaves*.
7. **Bizet and *Contra Danza* were not dumped.** The primary printed-habanera check (IM-3) stays open.
8. **Whether the Score screen runs three-part or two-single-staff scores as two-hand items** (*Maoz Tzur*, the Dykes hymn, *Deep River*). Not established.
9. **Stop-time** has no direct definition.
10. **W16's "arpeggiated" montuno wording is not found in `content/lessons/latin*.md` at HEAD.** The orchestrator checks where the item points before the wave 1(a) brief.
11. **Every musical-quality question.** No one in this process can decide these; they stay *unverified as music*.
