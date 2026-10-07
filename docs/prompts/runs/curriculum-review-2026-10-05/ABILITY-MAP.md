# Ability map: remediation by learning chain (2026-10-05)

**What this is.** The map that brief `briefs/ability-map.md` asks for. It turns the fifteen track reviews, the curriculum upgrade, the generator addendum and the mode sheet into abilities. Each ability is followed through four stations (CONTROL, MODEL/TRANSFER, MUSIC, INDEPENDENCE). Each station is matched to the mode that can honestly serve it, and to the verification its new material needs. The map is reviewed before any build brief is written (brief, last line).

**Authority.** The map governs dispatch (brief, correction 9). Where it conflicts with SYNTHESIS §H's batch list, with the upgrade's §6 step 3 re-cut, or with the addendum's family-first sequence (§8), the map wins. §8.4 says where. A planned station is not yet a learning experience someone can use. Finishing the map is not finishing remediation. A wave is accepted when its learning gaps are closed or honestly scoped. It is never accepted because a checker, a corpus or a census is finished.

**Inputs read** (all in this folder unless named): `extracts/<track>.md` for the fifteen tracks (record sections 2, 3, 4, 6, 8 and 11, plus the technique amendment); `CURRICULUM-UPGRADE.md` in full; `GENERATOR-ADDENDUM.md` §0, §1, §4, §5, §6, §7, §8 and its closing reviewer corrections; `MODE-SHEET.md` in full; `SYNTHESIS.md` in full; the restart packet §2, §3, §5, §7 and §8 and the dossier §1 and §2 (`../restart-2026-10-05/`); `docs/02-curriculum.md` Parts A and G. Not read: the app code (by brief, the mode sheet stands in for it); `docs/04-ui-spec.md` (the mode sheet cites it where it matters).

**Evidence marks.**
- **[R track §n]** is stated by that track's record extract. The record's own evidence (a file:line or a notation read) is carried with it and was not re-read here.
- **[U row]** is stated by `CURRICULUM-UPGRADE.md`. Row ids are `track#n`, meaning the n-th row of that track's §2 table with every class counted (`count_upgrade.py` and `count_ability_map.py` parse rows the same way). For example, `core#5` is "Transposition as a core task".
- **[A]** is stated by the generator addendum (rows G1-G16 and P1-P7, sections). **[S]** is stated by `SYNTHESIS.md` (A1-A20, B, D). **[P]** is the restart packet; **[DOS]** is the dossier; **[G]** is `docs/02-curriculum.md`.
- **[M §n]** is stated by `MODE-SHEET.md`, block n. That sheet's own [O]/[I]/[U] tag is carried where it changes a decision.
- **[D-gate]**: the block rests on a row that cites an external benchmark through the dossier. Per the upgrade's §0 item 4, the primary source is read first and the row is confirmed or downgraded.
- **[C]** means counted in this run by `count_ability_map.py` (§7) or `count_upgrade.py`. **[C] is the only observation made in this run.** I read no app code, ran no app and heard nothing (brief, Actors). Every statement about musical quality stays *unverified as music*.

**Priority classes** (the owner's order, used to sort clusters and abilities): P1 wrong teaching; P2 missing foundational bridges; P3 abilities that appear but never develop; P4 controlled practice; P5 real transfer; P6 independent use; P7 promised endpoints; P8 polish. Mapping to the packet's six (brief correction 2): P1 is the packet's 1 and P2 its 2. P3 is its 3 ("missing or weak rungs"). P4, P5 and P6 sit under its 4 ("insufficient practice or transfer"). Its 5 ("bad primary material") is carried inside P4 and P5 as material rows. P7 is its 6.

**Station states.** EXISTING means shipped and fit for the station now. REPAIR means shipped, but a sentence, placement, parameter or label must change. NEW means it must be written (a task, a section, a rung or an item). SOURCE-NEEDED means it cannot be built until a named source is read (a primary definition, an edition or a dump); nothing is built from a guessed definition (addendum reviewer correction 1). SHARED means a station of another ability or track supplies it; the station is named, and it counts as planned, not missing. NO-SEPARATE-ARTIFACT means nothing needs to be made, and the reason is given; it also counts as planned. A station's state is the state of the work still needed to supply it. Where items differ, the supply cell gives each item's own state.

**Mode cell.** One or more canonical names from §3.0, joined by " + ". "—" means no app mode: the station is text, paper or an outside recorder, and is self-checked.

---

## 1. Ability clusters in priority order

| # | Cluster | Worst MUST ability | Tracks taking part | MUST blocks |
| --- | --- | --- | --- | --- |
| W | Wrong teaching and misleading measurement (corrections across all clusters, §2.0) | P1 | all fifteen | — (18 dispositions) |
| 1 | Early reading and sight-reading | P2 | core (owner); technique, theory-ear, jazz, chords-pop, classical (reading rows) | A1.1, A1.2 |
| 2 | Transposition | P2 | core (owner); practice, hymns, holiday, jam, chords-pop, blues, jazz (recurrence) | A2.1 |
| 3 | Ear to keyboard production, playing by ear and transcription | P2 | theory-ear (owner); chords-pop (by ear); core, blues, jazz, improv, latin, rock (recurrence) | A3.1 |
| 4 | Performance, structural memory and recovery (solo and ensemble) | P2 | core 4.6/4.7, practice (owner); classical, jam (own owner for ensemble), ragtime, jazz, holiday, latin, hymns, blues | A4.1, A4.2 |
| 5 | Practical harmony and harmonic accompaniment | P2 | theory-ear and chords-pop (owners); hymns, jazz, blues, jam | A5.1 |
| 6 | Improvisation and composition | P2 | improv-compose (owner); blues, jazz, rock (recurrence) | A6.1, A6.2 |
| 7 | Style vocabulary: 7a blues, 7b jazz, 7c latin, 7d ragtime (P2); 7e rock (P3); 7f classical interpretation (P4); 7g hymns and spirituals (P6); 7h holiday (no MUST ability) | P2 | the nine style tracks | 15 blocks |
| 8 | Rhythm, pulse and metre | P3 | core (owner); theory-ear, blues, ragtime, latin, jam | A8.1 |
| 9 | Technique foundations | P4 | technique (owner); classical (MUSIC station) | A9.1 |
| 10 | Advanced integration: capstones and projects | P7 | jazz, chords-pop, rock | A10.1, A10.2 |
| 11 | Practice method and score study | — (SHOULD only) | practice, core 4.6, classical.6 | — |

**Changes from the brief's starting list, and why.**
- "Wrong teaching" is a priority class that cuts across clusters, not an ability. Its 36 rows [C] are disposed first, in §2.0, and each is tied to the cluster it protects.
- Ensemble recovery (jam) joins solo performance and memory in cluster 4. The jam record ranks it a foundational bridge [R jam §3.1], and the method is the same: landmarks, keep going, re-enter. The upgrade gives it its own owner (jam.5/6), and §4 keeps that.
- Harmonic accompaniment is widened to "practical harmony" because theory's MUST is application to repertoire [U theory-ear#4]. Practical harmony is a strand in correction 8.
- Classical interpretation is added as sub-cluster 7f. The brief's style list omits classical, but classical#2 and #3 are abilities, not corrections.
- Practice method and score study (cluster 11) has no MUST block. Practice's two MUST abilities (the cold start, and the whole-piece unit practice.6) are built in cluster 4: the upgrade names practice as co-owner of performance preparation (§1, "Performance preparation and recovery"). Its correction is W3. Score study is SHOULD in both the ownership table and the rows (core#9, classical#5), and stays SHOULD.
- Rhythm, pulse and metre is kept, with one MUST (core#6). No mode measures an unaided pulse or a heard-rhythm echo: Keep tempo supplies the clock [M §2], and the item called "Rhythm dictation" is a read-and-tap drill [M §23]. The strand needs a stated self-check, not a detector.
- Holiday has no MUST ability block. Its two MUST rows are corrections (W15) [U holiday#1, #2].

**Ordering rule.** Clusters are sorted by their worst non-correction MUST ability. Ties go to the cluster whose stations more other tracks reuse, so strand owners come first. Inside cluster 7, sub-clusters follow the same rule.

---

## 2. Ability blocks

Every MUST row of the upgrade (74 [C]) and every accepted addition (practice#4, latin#1, latin#9, rock-metal#8, rock-metal#9; four of them are already MUST) is cited here. A row is cited either by a W disposition (§2.0) or by an ability block's **Rows** line. A row split between abilities is cited by each block it feeds. SHOULD rows are listed one line each at the end of their cluster.

### 2.0 Wrong teaching and misleading measurement (P1): dispositions W1-W18

All are wave 1(a) (§6). Each row was re-read at the line before editing wherever SYNTHESIS marks it "reviewer" rather than "verified".

| W | Rows | What is wrong (evidence) | Disposition | Protects |
| --- | --- | --- | --- | --- |
| W1 | core#2, core#11 | Hot Cross Buns bar 3 (0.3, 1.1, 1.3) and Frère Jacques bars 5-6 (1.2) print eighths before 2.2 teaches them [S A10 verified; R core §4.1]. 0.1 says "leaning from the hips", gives a fixed curved-finger rule and a no-sound key test, with no pain rule [S A19 reviewer] | text: either a two-eighths-in-one-beat sentence at 1.1/1.2, or the bars simplified (the batch chooses; the 425 audit already says FIX_THEN_KEEP). 0.1 wording fixed, with a pain rule or a pointer to practice.4 | A1.1, A9.1 |
| W2 | core#7, core#8 | 4.6's gate measures two Perform runs while its title promises read-ahead and phrasing. 4.7 has no prerequisite. 4.7's blind gate states three thresholds [R core §4.6, §8.7-8.8]. A run with the score hidden is not recorded as such [M §10; stage-4.json:589-591] | text + data: retitle 4.6 to what its gate measures, or add a measured read-ahead item (phrase shape stays unverified as music). Add `prerequisites: ["4.6"]` to 4.7. State one threshold, and say the hidden page is self-checked | A4.1 |
| W3 | practice#1 | practice.3:26-28 states "the second visit ... is where the learning happens" as fact. The music evidence is small-sample and mixed, and practice.1 prescribes blocked repetition without reconciling the two [S A17 verified; R practice §3.1-3.2] | text: hedge the claim; say when blocked repetition is the right tool; two sentences on acquisition versus retention | cluster 11 |
| W4 | technique#1 | 16 of the 36 contrary files do not start at the unison. 10 one-octave files start an octave apart; 6 two-octave files (C, D♭, D, E♭, E, F) start crossed. technique.4:26-30 presents the crossing as the way in; core 4.1:29-31 says the opposite [S A1 verified; A G2, m21 read; R technique, amendment] | generator FIX on `scale` (start parameter; identity, rhythm and fingering kept; version bumped); delete the technique.4 sentence; CK-1, CO-1 | A9.1, core 4.1 |
| W5 | technique#4, technique#5 | technique.6 names Czerny 1, 3, 4 as 3:1 and chromatic études (none has tuplets; only No. 4 has a chromatic run). technique.5 names Duvernoy 4-6 as repeated-note transfer (0-4 repeats each). The half-pedal window 32-96 is unlabelled, and :61 says "between 0 and 127" [S A20; R technique §8.3, §8.5] | text | A9.1, A7f.1 |
| W6 | classical#1, classical#9 | classical.5 asks the learner to mark exposition, development and recapitulation, but the Beethoven Anh. 5 edition reads A-B-A plus coda (medium confidence). The speed recipe is called "the method that works". Also: rubato "this kind", counting in cross-rhythm, the K.331 metre [S A18; R classical §4.1, §8.6] | text | A7f.1 |
| W7 | chords-pop#1, chords-pop#9 | stage-9.json:326 says "chord chart or lead sheet only" and :332 says avoid "fully written-out arrangements", against six written-out options. The same `avoid` is at stage-8.json:496; stage-7 asks for "chord symbols printed". Wording: "walking" at .4, "shapes" at .8, "lives on sevenths" at .5, "sounds like jazz" at .7 [S A9 verified; R chords-pop §8.1, §8.5] | data (finder lines) + text | A10.2, A3.1 |
| W8 | blues-boogie#2, blues-boogie#5 | The 425 audit's REPLACE_FILE for 12 Bar Blues rests on a printed-bar count. The backward repeat at bar 2 and the unroll give twelve bars plus a closing bar [S A11]. Wording set: blues.7, .4, .6, the .8 title ("twelve keys" for two), and .9 ("twelve-bar choruses" for pieces that are not) [S A13 reviewer] | data (catalog role: right-hand riff over the form) + text | A7a.1-A7a.3 |
| W9 | jazz#5 | The walking approach note is fixed a semitone below, while jam.6 says either side. The stride tenth is misdescribed. "C13 with the eleventh"; "exactly as well" [S A12 reviewer] | text | A7b.1, A10.1 |
| W10 | ragtime#4 | "Not fast" claimed for several editions but found only on Frog Legs; Bethena's keys; "single most characteristic"; "no other cause"; 2/4 counting [S A8; R ragtime §8.3] | text | A7d.1 |
| W11 | theory-ear#1, theory-ear#2, theory-ear#3, theory-ear#5, theory-ear#11 | The modulation item `C:I, C:vi, A:V7/V, D:V, D:I` sounds B7 and is not the lesson's pivot [S A2; the derivation was read from fromCatalog.ts, not run]. "Identified at 80 %" is claimed over play-back drills, and singing and writing are unframed [R theory §8.2]; nothing is named, only echoed [M §19-§22]; the item called "Rhythm dictation" is read-and-tap [M §23]. Lydian, Phrygian, Locrian, ° and V/ii are used by drills before any lesson defines them [R theory §4]. The theory.9 finder asks for ABA, AABA or 32-bar, and the lesson names none [R theory §3.10]. "Inversions by ear" is a slash-chord reading drill [R theory §2.7] | data: one progression, after running the drill once to hear what it plays (CK-3). text: "How you'll know" says what is played back versus self-checked; definitions; form names; relabels | A5.1, A3.1, A8.1 |
| W12 | improv-compose#4, improv-compose#5 | The improv.6 lab preset locks A minor while the lesson asks for three keys; a ii-V-i numeral mismatch; "four answers recorded" though nothing is recorded. Fourths "has no name" (the app's namer has sus4 and sus2); black-key pentatonic "over anything"; "that single fact"; "works everywhere"; "any chord" [S A6 verified; R improv §8.3] | data + text | A6.1, A7b.2 |
| W13 | improv-compose#3 | The row adds `unjudged` rules so that improv.6-9 cannot be passed on exercise runs alone. But an `unjudged` reading is filtered out before "met" is computed, so the promised effect is impossible [M §32.7; rungState.ts:341; brief correction 4] | superseded by CT-1 (§8.2): the lesson's rule is added as an `unjudged` requirement for display only, and the lesson says what "met" means there | A6.1, A6.2 |
| W14 | hymns-gospel#1, hymns-gospel#2, hymns-gospel#3, hymns-gospel#7 | Jesus Loves Me is called four-part, but it is a melody over broken chords [S A3 verified]. The hymns.2 Joyful edition lowers the third [S A4 verified]. "Three or four chords", "nearly everywhere", "any chord" [R hymns §8.3]. Rename to Hymns & spirituals [U §0.1] | text. Edition: label it, replace it (IM-5) or drop it (the batch decides). data: `00-tracks.json` and the stage-3 unit title | A7g.1, A7g.2 |
| W15 | holiday#1, holiday#2 | O Christmas Tree bar 32 prints C♭ major in F under G, A, B♭, E; the harmony is evidently C7 [S A5 verified]. "33 of 40 bars"; the Auld Lang Syne texture; "above the staff"; the range stated as a limit; the pulse rule meant for a group [S A15 reviewer] | score fix after reading the source edition (IM-4) + text | cluster 7h |
| W16 | latin#2, latin#5 | Rumba and bossa clave are listed and defined nowhere [R latin §3.6; the generator rows were verified against the definitions]. "Neither is on the beat" (the tumbao strikes beat 4); the montuno called "arpeggiated"; the Malagueña description [S A16] | text | A7c.1-A7c.3 |
| W17 | rock-metal#1, rock-metal#2 | "Five textures" against four plus the rule. A distorted guitar "cannot"; the Rachmaninoff and Moonlight III claims; which hand carries the figure; "eight bars"; what Annie's Song really demonstrates [S A14; R rock §8.2, §8.4] | data + text | A7e.1 |
| W18 | jam#3, jam#9 | jam.6:44-48 sends a correct walking bass to a lab count against the blues scale, so a correct E walk reads as about half right [S A7; M §7b]. The bed's drums wording; "1920" [R jam §8.6] | text: remove or explain the verdict sentence; the lab itself is not changed | A4.2 |

- Amended 2026-10-05 from the quarry (H1, W14, hymns.2 material; protects A7g.1 and A7g.2): State REPAIR -> REPAIR, unchanged. The quarry's 'requested correct *Joyful, Joyful* replacement' `QmZwo2Muh2rip4gGET7fkkXFgaLQiK6kc6p89ssZbqysxB` is already shipped as `song.classical.beethoven-joyful-joyful-we-adore-thee.pdmx`, the hymns.4 edition (16 bars, grand staff, G major, level 5.36). W14 concerns a different file, the single-line hymns.2 edition `...beethoven-ludwig-van-beethoven-joyful...pdmx` (D, no key signature), so the quarry's candidate is rejected for the IM-5 role, a single line with F-sharp at Stage 2. W14's choice stays (a) label, (b) replace from another single-line edition, or (c) drop. Verification boundary: none; a reader confirms the F-sharp of any replacement. Admission and public export: shipped. The quarry's wording loses to the map here (amendment section 2, point 2).
- Amended 2026-10-05 from the quarry (W16, the Cuban terms): the three Cuban-term corrections stated under A7c.2 (the latin.6 sentence, the montuno docstring and title, the montuno finder) move into wave 1(a) with W16, seam 1a.6. W16's 'arpeggiated' item is not found in `content/lessons/latin*.md` at HEAD; the orchestrator checks where it points before the wave 1(a) brief.

**Promoted from SHOULD (conflict C2, §8.1).** blues-boogie#9 has a data half: Blind on blues.8 opens the 97-bar Pinetop, not a twelve-bar form [R blues §3.7]. That is a tool pointing a form-memory test at a piece with no such form. It joins wave 1(a). The landmark sentence stays SHOULD.

### 2.1 Cluster 1 — Early reading and sight-reading (P2)

#### A1.1 Read the marks the shipped scores print
- **Rows:** core#1. **Priority:** P2. **Tracks:** core; transfer to classical and holiday. [D-gate] The benchmark (ABRSM's Grade 1 staccato parameter) supports the row, but the need rests on shipped scores [R core §3.1], so the source check does not block the change.
- **Capability:** at 3.4-4.7 the learner reads and obeys repeat signs, first and second endings, D.C., fermatas, natural signs and staccato in the pieces they are given.
- **Evidence:** no lesson names these marks (grep over 105 lesson files) [R core §3.1]. The core scores print them: Petzold 3 repeats and 12 staccatos; the Schumann Chorale 18 fermatas; easy Für Elise 4 naturals; Bella Ciao 6 repeats, 12 endings and 4 naturals; Canon 2 repeats [R core §3.1]. SYNTHESIS B core, verified.

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | One section: the natural beside the accidental rule at 3.1 (NEW); repeats, endings, D.C., fermata and staccato at 3.4 or 4.5, where the pieces first need them (NEW); a trace-the-route-with-a-finger task (precedent ragtime.6:67-68). `drill.reading.note-flash-accidentals` (3.1) is EXISTING, but whether it writes naturals was not checked | NEW | Note flash |
| MODEL/TRANSFER | Petzold (repeats, staccato), Bella Ciao (endings), Schumann Chorale (fermatas), Für Elise easy (naturals), all on 3.4-4.7 (EXISTING) | EXISTING | Keep tempo |
| MUSIC | The 4.6 capstone pool (Canon, Carol of the Bells) under Perform | SHARED | Perform |
| INDEPENDENCE | The route read before playing, as a step of the score-study routine (cluster 11, core 4.6, core#9) | SHARED | — |
- Amended 2026-10-05 from the quarry (notation marks, CONTROL): the notation-marks section left wave 1(a). Repeats, endings, ties and key signatures first print from 1.1 to 2.4, earlier than the later text location this block names; it is now an owned design seam, section 8.7. The CONTROL cell above stays as written until that seam decides, mark by mark.

- **Falls through:** CONTROL (no lesson names the marks).
- **Measurement:** MIDI: the notes of the unrolled route in Keep tempo. A backward repeat is unrolled (`extractScoreModel.ts:12-13` [S A11]); whether endings and D.C. are unrolled was not examined [R core §3.1]. Fermata length cannot be judged, because the clock runs on [M §2]. self-checked: naming the marks and tracing the route. no actor is needed: no musical judgement is involved.
- **Completion:** CT-3 (3.4 and 4.5 are met by runs of the pieces that print the marks; nothing changes).
- Consumed 2026-10-05 from SOURCE-CHECK-parallel: not covered, gate stays. ABRSM's Grade 1 staccato parameter is an ABRSM row; the parallel check did not read ABRSM, and the row's own note that the need rests on shipped scores is unchanged.

#### A1.2 Read and sight-read in a key signature and in 3/4
- **Rows:** core#3, core#4. **Priority:** P2. **Tracks:** core (owner); technique.5, theory.6/9, jazz.8, chords-pop.8 use reading rows. [D-gate] The ABRSM sight-reading table supplies the parameters as evidence, not as a copy [U §1].
- **Capability:** the learner knows what a G or F signature does in the pieces that carry one before 3.1, and meets G/F and 3/4 in unseen reading by the rungs that taught them.
- **Evidence:** options carry signatures from 1.5 to 2.5, and 2.3-2.5 say nothing about them [R core §4.2]. All six core reading rows write `fifths: 0` and no 3/4 [R core §4.3-4.4]. The level caps already allow one sharp or flat at L2-L3 and two at L4; `metresAsked` takes any list [A G1]. Today's read adapts up to `maxFifthsFor(level)` [M §16].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | `drill.reading.note-flash-accidentals` and build-a-scale at 3.1 (EXISTING) | EXISTING | Note flash |
| MODEL/TRANSFER | One sentence each at 2.3, 2.4 and 2.5 naming the sharp in Jingle Bells in G, Streets of Laredo and the easy Ode (REPAIR); Ode in G and Twinkle in F at 3.1 (EXISTING). Shipped 3/4 pieces for the metre role are CANDIDATE: none was read for it [A G1] | REPAIR | Keep tempo |
| MUSIC | Core repertoire 3.1-4.7 in G, F and 3/4 | SHARED | Keep tempo |
| INDEPENDENCE | Unseen rows: `timeSig ["4/4","3/4"]` on `sight-reading-1-left`, `-1`, `-2-right`; `fifths [-1,0,1]` on `-2`, `-3`; `fifths [-2..2]` on `-4` [A G1], after the wave 1(d) experiment and CK-2. The L3 rows at 4.5/4.6 keep a one-accidental cap; `-4` reaches two at 4.6, so no level-table change is needed | REPAIR | Daily sight-read |
- Amended 2026-10-05 from the quarry (key signatures, MODEL/TRANSFER): the one-sentence-each text at 2.3-2.5 left wave 1(a), because key signatures first print at 1.5 and 2.2, before the sentences the MODEL/TRANSFER cell places. It is part of the owned design seam in section 8.7. The cell above stays as written until that seam decides.

- **Falls through:** INDEPENDENCE (the rows write neither signatures nor 3/4) and MODEL/TRANSFER (2.3-2.5 are silent).
- **Measurement:** MIDI: right pitch and time on an unseen first attempt, per demand. The practice standard needs keep-tempo and unseen; the full standard adds guide-off and names-off [M §16]. The app cannot tell which demand caused a miss [M §16]. self-checked: naming the key. no actor can judge phrase plausibility as music; CO-2 is a notation reading.
- **Completion:** CT-3 (the `reads` requirements at 1.5 and 3.4 are measured [M §16]).

- SHOULD core#10: Sixteenth reading before Canon in D (4.4). Disposition: wave 5; a reading line at 4.4, or keep Canon out of the default 4.6/4.7 pool [R core §3.6].
- Consumed 2026-10-05 from SOURCE-CHECK-parallel: not covered, gate stays. This rests on ABRSM's sight-reading table; ABRSM and RCM technical and reading rows were not read by the parallel check.

### 2.2 Cluster 2 — Transposition (P2)

#### A2.1 Transpose a known tune and a I-IV-V7 into a second key
- **Rows:** core#5. **Priority:** P2. **Tracks:** core (owner); recurs in practice, hymns, holiday, jam, chords-pop, blues, jazz (§4). [D-gate] Faber Level 4 and dossier 2.2 [U core#5].
- **Capability:** at 1.2 the learner plays a five-finger tune again a step or a fifth higher. At 2.5/3.2 they play I-IV-V7 and a known tune in a second key without a printed copy, and then choose a key nobody printed.
- **Evidence:** transposition is never a core task. The grep finds only 4.4, and `drill.reading.transposition` sits at level 6.3. The G-major five-finger items are on 1.1 and 1.3 but are never framed as transposition [R core §3.2]. practice.5 asks a Stage 1 learner to transpose with no how-to; Ode RH up a fifth needs no accidentals [R practice §4.1]. SYNTHESIS C, row B.

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | 1.2 task (NEW): play the C five-finger tune (Ode RH) again in G, then check it against `exercise.five-finger.g-major.right/left` (EXISTING, 1.1/1.3) with the page hidden and the keys guide off | NEW | Blind |
| MODEL/TRANSFER | 2.5/3.2 task (REPAIR of `3.2.md:12-14`'s claim): I-IV-V7 in G and F on the cadence drills in C, G, F (EXISTING); Ode in G, Twinkle in F and Saints in F played from the C version, checked against the printed second-key copy with the page hidden (EXISTING) | REPAIR | Blind + Theory drills |
| MUSIC | holiday.3 carol a step lower (EXISTING, self-checked); chords-pop.3 Saints in C, F and G (EXISTING) | SHARED | — |
| INDEPENDENCE | One task at 3.2 or 4.4 (NEW): pick a tune you know and a key nobody printed (D, say), and play it with I-IV-V7. Standalone Free play names each held chord as a readout | NEW | Free play |

- **Falls through:** CONTROL (no core task frames transposition).
- **Measurement:** MIDI: the notes of the second-key version, judged against the printed second-key copy. Blind is not recorded as Blind, and the keys guide stays lit unless switched off [M §10]. The chord drill judges sets in any octave [M §25]. self-checked: that no copy was read, and the unprinted-key task. no actor judgement is involved.
- **Completion:** CT-1 (1.2 and 3.2 are met by their existing runs; the transposition task is shown as the lesson's `unjudged` rule and called self-checked).

- SHOULD jam#5: Transposition by numerals on jam.7 (a worked example on eight bars, or narrowed). Disposition: wave 5, text; uses A2.1's method; the chart has no transpose control [M §15].
- Consumed 2026-10-05 from SOURCE-CHECK-parallel: not covered, gate stays. This rests on Faber Level 4 and the dossier; the parallel check read neither.

### 2.3 Cluster 3 — Ear to keyboard production, playing by ear and transcription (P2)

#### A3.1 Learn a song by ear from a recording
- **Rows:** chords-pop#3. **Priority:** P2 (the bridge to the arranging endpoint; the upgrade marks it owner-directed). **Tracks:** chords-pop (owner); jazz.9, hymns.2, holiday.2, theory.9 recur [U §1]. [D-gate] Berklee and RCM harmonic hearing.
- **Capability:** from a recording, find the tonic, then the bass, then the progression and the chord rhythm, then the melody, and play it.
- **Evidence:** the drill chords-pop.9 names is `drill.ear.tune-long`, melody playback of a generated tune. Nothing asks for tonic, bass or progression [R chords-pop §3.6]. Tune playback cannot establish playing a real melody by ear [M §24]. Harmonic dictation echoes generated progressions in C [M §22; R theory §2.15].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | Harmonic dictation (theory.6/7) for progressions as chord sets; Simon for holding a heard line, on a help level without lit keys | SHARED | Simon + Harmonic dictation |
| MODEL/TRANSFER | A worked routine (NEW, chords-pop.8): hear a shipped chord-symbol song (Oh! Susanna, 27 symbols, chords-pop.3, EXISTING) without looking; find the tonic, bass and chords; then check against its printed symbols | NEW | Play it to me |
| MUSIC | The chords-pop.9 arrangement of the learner's own song (A10.2) | SHARED | — |
| INDEPENDENCE | The learner's own song from their own recording (NEW task, chords-pop.8/9), with each found chord checked by standalone Free play's held-chord name | NEW | Free play |

- **Falls through:** MODEL/TRANSFER (no task asks for tonic, bass and progression).
- **Measurement:** MIDI: generated progressions as chord sets, and an exact pitch chain in Simon. A real recording is never judged, and Play it to me records nothing [M §3]. self-checked: the tonic, bass, chord rhythm and melody of a real song. no actor can say whether the learner's version matches the recording; nobody here hears.
- **Completion:** CT-1 (chords-pop.8/9 are met by one exercise run [R chords-pop §6]).

- SHOULD theory-ear#6: A key or tonic before melodic dictation and the tune drill. Disposition: wave 5, G9 [A]; [D] RCM.
- SHOULD theory-ear#7: Minor-key progressions and numerals by ear; keys other than C. Disposition: wave 5, G10 (test Tonal `Key.minorKey` first) [A].
- SHOULD theory-ear#8: Descending and harmonic intervals; the tritone named. Disposition: wave 5, G11 [A].
- SHOULD theory-ear#10: Bass-line and function dictation. Disposition: wave 5, G12; FiloBass stays CANDIDATE, rights unchecked [A].
- SHOULD theory-ear#12: Singing scale degrees (movable do) as a self-checked habit. Disposition: wave 5, text; never claimed as measured [DOS 2.4].
- SHOULD improv-compose#8: Transcribe two bars of a real tune, vary one element, use it. Disposition: wave 5; the one shared transcription template, written once at theory.9 (§4).
- SHOULD blues-boogie#7: One historical lick to transcribe and transform. Disposition: wave 5; uses the shared template; a licensed lick is a content search.
  - Amended 2026-10-05 from the quarry Served by B2's Morton excerpt once it is cut (A7a.1 amendment).
- SHOULD latin#8: A listening or transcription example per rung. Disposition: wave 5; uses the shared template.
- Consumed 2026-10-05 from SOURCE-CHECK-parallel: not covered, gate stays. This rests on Berklee ear-training and RCM harmonic hearing; the parallel check read the Berklee jazz, blues and rock, latin and improvisation pages, none of which is the ear-training source, and it did not read RCM.

### 2.4 Cluster 4 — Performance, structural memory and recovery (P2)

#### A4.1 Prepare and give a one-pass performance, recovering at a landmark
- **Rows:** practice#2, practice#4, classical#4. **Priority:** P2 (retrieval and recovery are absent until 4.6/4.7 and from the project rung). **Tracks:** core 4.6/4.7 and practice (owners); classical.9 first full application; holiday, ragtime, latin, hymns and jazz get the two-line template (SHOULD, §4). [D-gate] practice#4 cites Chaffin and Imreh and Williamon.
- **Capability:** next day, play it cold before warming up and note what slipped. Practise a whole piece by sections and joins. Start anywhere. Give one no-stop run. Record it and listen. After an error, restart from a named landmark.
- **Evidence:** retrieval appears in the practice track only as one "starting cold" line; the real treatment is at 4.7:29-31 [R practice §3.3]. Record-and-listen and no-stopping runs are absent from the practice track [R practice §3.5-3.6]. classical.9 only names Perform [R classical §3.5]. Perform cannot establish recovery or landmark choice, and nothing in the code reads them [M §9, §32.6].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | Cold-start check, one line in practice.3 or practice.5 (NEW): next day, first, before the warm-up, note what slipped. Keep tempo's hot-spot bars show where | NEW | Keep tempo |
| MODEL/TRANSFER | core 4.7 start from several points, hear it away from the piano (`4.7.md:29-31`); 4.6 drop a note and carry on (`4.6.md:23-27`) | SHARED | Blind |
| MUSIC | classical.9 paragraph (REPAIR) built from the §4 template: cold start, one no-stop run, restart from a named landmark after an error, record and listen | REPAIR | Perform |
| INDEPENDENCE | practice.6, a new Stage 4 rung after 4.6 (NEW, text only): the learner chooses units by structure, schedules cold starts, records and listens, and changes strategy when repetition stops helping | NEW | Perform |

- **Falls through:** CONTROL (no retrieval check before 4.7) and INDEPENDENCE (no whole-piece method).
- **Measurement:** MIDI: a flagged one-pass take's accuracy and, in Keep tempo, its timing. `performance: true` counts only with the normal standard [M §9; rungState.ts:377-378]. self-checked: what slipped on the cold start, the landmark chosen, the restart, the listening. no actor can judge whether the performance is musical (unverified as music) or whether it was done for an audience [M §9].
- **Completion:** CT-2 for practice.6 (a learner's-word rung: its material is the learner's own piece). CT-1 for classical.9.
- Consumed 2026-10-05 from SOURCE-CHECK-parallel (Practice / memory, Chaffin and Imreh 2002; Williamon and Valentine 2002; Practice quality, Williamon and Valentine 2000): source-checked 2026-10-05 (parallel): confirmed, §Practice / memory and §Practice quality. Gate lifted on this block. Confirmed: formal structure can organise memory; performance and retrieval cues matter; retrieval practice is distinct from merely removing the page; structural restart points belong in memory training; raw practice minutes alone are not a quality measure (confirmed with caution: it is never read as 'longer segments are better' or 'blocked repetition is bad'). Not supplied: the memory study is one expert's case study, so no restart count, spacing interval or threshold comes from it; those stay local design choices.

#### A4.2 Start, stay in, recover and end together in an ensemble form
- **Rows:** jam#1, jam#2, jam#4. **Priority:** P2 (the jam endpoint, "can function with another musician"). **Tracks:** jam (its own owner, upgrade §1); core 4.6's keep-going is the solo precedent. [D-gate] jam#1 cites the ABRSM jazz solo section with a rhythm section that does not stop.
- **Capability:** count in unambiguously at three tempos; keep the form while the band runs; when lost, sit out and re-enter at bar 5 or 9 by ear and the counter, then with the chart covered; end on the chart's printed cues.
- **Evidence:** there is no recovery task; "you are never lost" is a claim, not a drill [R jam §3.1]. Ending cues are printed (Storyville bars 53-56 "rit." and "Tag"; Riverside bar 36) and never taught [R jam §3.2]. The count-in paragraph is ambiguous [R jam §3.4; U jam#4]. Jam it runs a metronome-clocked bed and marks the sounding bar; nothing is stored [M §7b]. The chart has Count off and a bar tracker [M §15]. Trading fours reports entry inside your own bars, also unstored [M §8].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | Count-in at a slow, a medium and a quick tempo, aloud, then the chart's Count off at the same tempo (REPAIR of `jam.md:30-32`; the tools are EXISTING) | REPAIR | Chord chart |
| MODEL/TRANSFER | The lost-and-find protocol on the existing lab (NEW, jam.5): one chorus; stop for two bars while the bed runs; come back in at bar 5 or 9 | NEW | Lab: Jam it |
| MUSIC | End on the printed cues: Storyville bars 53-56, Riverside bar 36; the tag sentence corrected (REPAIR, jam.7) | REPAIR | Chord chart |
| INDEPENDENCE | The protocol with the chart covered, then without the counter (NEW). Entering inside your own bars after a trade is the app's one entry signal | NEW | Lab: Jam it + Trading fours |

- **Falls through:** MODEL/TRANSFER (no recovery task).
- **Measurement:** MIDI: nothing is stored in Jam it [M §7b]. Trading fours shows whether the first note came inside the window, not stored, and early playing over the call reads as "not inside" [M §8]. self-checked: the re-entry bar, the count-in tempo, ending together. no actor can say whether the ensemble sounded together (unverified as music).
- **Completion:** CT-1 (jam.5 and jam.7 are met by exercise and chart runs [R jam §6]).

- SHOULD classical#8: Structural memorisation requirement on classical.6-9. Disposition: wave 5; the §4 memory requirement line as display (CT-1).
- SHOULD blues-boogie#9: Form landmarks as retrieval cues; Blind on a twelve-bar form at blues.8. Disposition: the data half is promoted to wave 1(a) (C2); the landmark sentence goes in wave 5.
- SHOULD ragtime#6: Strain-seam step in the ragtime.9 memory method. Disposition: wave 5, text (C3: SHOULD, not MUST).
- SHOULD jazz#7: Learning and memorising a standard as a process. Disposition: folded into A10.1 INDEPENDENCE by reference to core 4.7.
- SHOULD jam#6: A muted-bars lab setting that reads the re-entry bar. Disposition: later; code; it would make A4.2 INDEPENDENCE measurable.
- SHOULD jam#8: Listening while playing, leaving space, role switching as tasks. Disposition: wave 5, text.
- Consumed 2026-10-05 from SOURCE-CHECK-parallel: not covered, gate stays. This rests on the ABRSM jazz solo section with a rhythm section; ABRSM was not read by the parallel check.

### 2.5 Cluster 5 — Practical harmony and harmonic accompaniment (P2)

#### A5.1 Find taught harmony in real pieces
- **Rows:** theory-ear#4. **Priority:** P2 (the bridge from drill to independence [R theory §3.1]). **Tracks:** theory-ear (owner of function); chords-pop (owner of symbols and voicings); hymns, jazz, classical supply the pieces.
- **Capability:** after each theory rung, find the taught thing in a shipped piece: a cadence in a minuet or a hymn, I-vi-IV-V in a pop song, a V/V in a song or standard, the chords that are not in the key in a hymn.
- **Evidence:** every theory rung has `songOptions: []`. Nothing taught is found in a real piece [R theory §3.1; U theory-ear#4, verified]. Instances already read in other records include Petzold cadences at bars 8, 16, 24, 32 [R classical §2]; Hallelujah's C, Am, F, G in bars 1-16 [R chords-pop §2.5]; Alexander's Ragtime Band bar 13, D then D7 to G in C (V/V) [R chords-pop §2.5, §3.8]; What a Friend's G♯dim, E and D7 [R hymns §2.6].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | The rung drills: cadences, progressions, harmonic dictation, secondary dominants, numerals (EXISTING) | EXISTING | Ear: cadence / progression + Harmonic dictation |
| MODEL/TRANSFER | One named shipped piece per rung, as a sentence or `songOptions` after the ids are confirmed at HEAD (REPAIR). Instances already read: the Petzold cadences, Hallelujah, Alexander's Ragtime Band bar 13, What a Friend. The rest come from the genre plan and are CANDIDATE until a notation read | REPAIR | Play it to me |
| MUSIC | The same pieces on their own tracks (classical.3, chords-pop.4, hymns.5) | SHARED | Keep tempo |
| INDEPENDENCE | Naming the cadence points and the harmony of a piece being learned anyway: the score-study routine's cadence step (cluster 11) | SHARED | — |
- Consumed 2026-10-05 from FAMILIAR-SONG-VERDICT (MODEL/TRANSFER, a familiar accompaniment-transfer candidate beside the REPAIR instances above): State REPAIR -> REPAIR (one candidate added, not admitted). Mode Chord chart + Keep tempo. Artefact: *Stand By Me*, the C-major voice-plus-piano edition `Qmf7ENREU9UngoF2LgRY1ZT9hAGDnCVBBYq8k3NeJUWBNt`, 37 bars, 23 chord symbols: a C, Am, F, G loop under named symbols, an off-beat chord-stab right hand, a rooted left-hand bass, Verse and Chorus labels, repeat, D.S. and Fine navigation. Job: early-to-middle chords-pop accompaniment transfer after basic I/vi/IV/V or chord-change work; the navigation notation is not required on first use. The fuller A-major edition (`Qmdc2i8gxkTUEcxVDUzcYvx1xh1Rim5EoYmU6bdxSVob2o`) is not used unless a harder-version need appears. State: CANDIDATE (the intake gate of the packet's section 13 not yet run); personal-library admission possible; curriculum admission by a later brief. Quarry folder: XML `docs/review/familiar-song-pass-2026-10-05/xml/stand-by-me-Qmf7ENREU9UngoF2LgRY1ZT9hAGDnCVBBYq8k3NeJUWBNt.musicxml`, summary `docs/review/familiar-song-pass-2026-10-05/summary/stand-by-me-Qmf7ENREU9UngoF2LgRY1ZT9hAGDnCVBBYq8k3NeJUWBNt.txt`; verdict `docs/review/pdmx-quarry-2026-10-05/FAMILIAR-SONG-VERDICT.md`. No one in this process can judge whether the stab pattern feels right (unverified as music).

- **Falls through:** MODEL/TRANSFER.
- **Measurement:** MIDI: the drills echo generated progressions; no name or function is ever asked [M §20, §22]. self-checked: finding and naming the harmony in the piece. no actor is needed for the learner's check, but each instance named in a lesson must be verified by a notation read before it ships (never teach wrong).
- **Completion:** CT-1 (theory.6-9 are met by one drill run [R theory §6]).

- SHOULD chords-pop#4: Texture by melody density and register; bass-line options. Disposition: wave 5, text at chords-pop.9/.5; walking stays with blues/jazz by reference.
  - Consumed 2026-10-05 from SOURCE-CHECK-technique-hymns-rock §Rock / blues keyboard progression (OPIAN-220, Pop/Rock Keyboard): partly lifted. Supported: bass lines (shuffle, walking and boogie bass) and arpeggiated, voice-led parts as taught keyboard vocabulary before advanced soloing. Still gated: texture by melody density and register, and the root, root-fifth and stepwise options, which neither course page names.
- SHOULD chords-pop#5: Intros and endings beyond one sentence; countermelody; build and release. Disposition: wave 5, text; jazz.9 reuses it (A10.1).
- SHOULD chords-pop#6: Pop rhythmic comping. Disposition: text, wave 5; G4 is source-blocked (printed offsets unnamed) [A, reviewer correction 1].
  - Consumed 2026-10-05 from SOURCE-CHECK-technique-hymns-rock §Rock / blues keyboard progression (OPIAN-220, Pop/Rock Keyboard): the category proposition is supported (comping, including modern-rock and New Orleans comping, is a foundational taught job). G4 stays source-blocked: no printed offsets, no pattern, so nothing from the check dictates an eighth-note or syncopated pattern.
- SHOULD chords-pop#7: Loop exercise on .4 or its mastery line moved. Disposition: wave 5, data.
- SHOULD chords-pop#8: Declare core 4.3 and theory.7 as prerequisites. Disposition: wave 5, data.
- SHOULD chords-pop#10: Slash chords as inversion versus added bass. Disposition: wave 5, text.
- SHOULD chords-pop#11: Reconcile D2 to the lessons. Disposition: wave 5, docs (the spec serves the code).
- SHOULD jam#7: A real tune to comp behind and walk under at jam.5/6. Disposition: wave 5; genre-plan ids confirmed first; the chart opens any chord-symbol piece [M §15].
  - Amended 2026-10-05 from the quarry *St James Infirmary*: the id is confirmed shipped, with 41 symbols, and it opens in the chart.

### 2.6 Cluster 6 — Improvisation and composition (P2)

#### A6.1 Harmonise your own melody
- **Rows:** improv-compose#1. **Priority:** P2. **Tracks:** improv-compose (owner); hymns.2 (chords under a tune) is the nearest precedent.
- **Capability:** choose chords for the eight bars you wrote, try them against the melody, and keep the ones that fit.
- **Evidence:** harmonising is absent; the learner reharmonises someone else's tune at improv.8 but never their own [R improv §3.1, trace table]. The lab takes typed numerals and has "Hold the chords" [M §7b]. No lesson teaches choosing chords for melody notes [R hymns §3.4].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | One paragraph (NEW, improv.5 or 6): chord tones on strong beats, one chord per bar first. Standalone Free play names the chord held under each melody note | NEW | Free play |
| MODEL/TRANSFER | Harmonise a known tune with its symbols hidden, then compare with the printed chart: Swing Low (20 symbols, hymns.2) or Oh! Susanna (EXISTING material; NEW task) | NEW | Chord chart |
| MUSIC | The learner's eight bars over their own progression, typed into the lab, playing the melody over Hold the chords (NEW task; the lab is EXISTING) | NEW | Lab: Hold the chords |
| INDEPENDENCE | The harmony of the improv.9 piece, chosen unprompted | SHARED | — |

- **Falls through:** CONTROL (no lesson asks).
- **Measurement:** MIDI: nothing about the choice. Free play's chord name is a readout, not a verdict [M §5]. Hold the chords counts notes in the scale per round, unstored, with chord tones lit [M §7b]. self-checked: whether each chord supports the melody. no actor can judge whether it sounds good (unverified as music).
- **Completion:** CT-1 (improv.5/6 are met on exercise runs; W13).

#### A6.2 Write down and keep what you made, honestly
- **Rows:** improv-compose#2. **Priority:** P2 (the endpoint is "a finished written piece"). **Tracks:** improv-compose (owner); theory.9 (take-down) and blues.9 ("record it on whatever is in your pocket") are the precedents.
- **Capability:** notate a melody or miniature on paper, or in notation software and import the MusicXML; record a take on an outside recorder; follow one consistent piece of advice about keeping takes.
- **Evidence:** written music is required with no method. The app has no notation entry or export of a take. The recording advice contradicts itself across improv.3, 5, 7 and 9 [R improv §3.2]. Notation export is deferred by D7 [G D7; R improv §3.2].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | theory.9's take-down method ("contour first, then detail", theory.4) applied to your own phrase | SHARED | — |
| MODEL/TRANSFER | One honest paragraph at improv.5 (REPAIR): paper, or notation software then MusicXML import to the shelf (`classical.4.shelf.md:40`); a take on an outside recorder. The advice is made consistent across improv.3/5/7/9 | REPAIR | — |
| MUSIC | The written melody imported and heard back, then played on the Score screen | NO-SEPARATE-ARTIFACT | Play it to me |
| INDEPENDENCE | improv.9: the finished miniature notated (REPAIR, the write-down paragraph repeated at improv.9) | REPAIR | — |

The MUSIC station needs no artefact of its own: shelf import, Play it to me and the Score screen exist, and the MODEL paragraph points to them.

- **Falls through:** MODEL/TRANSFER.
- **Measurement:** MIDI: an import's run is judged against what the learner wrote. That shows they play what they notated, not that the notation is right, and it belongs to no rung [M §7a, R1]. self-checked: the notation matches what was meant. no actor can judge whether the notation is musically right or the piece good. In-app notation entry stays a scoped-out product decision, outside this map.
- **Completion:** CT-1 (improv.9 is met on an exercise run).

- SHOULD improv-compose#6: A 16-bar binary or ABA miniature, written and harmonised (improv.7). Disposition: wave 5; builds on A6.1 and A6.2.
- SHOULD improv-compose#7: Motif development as a written task. Disposition: wave 5, text.
- SHOULD improv-compose#9: Models of composition in real music before writing. Disposition: wave 5; genre-plan ids confirmed first.
  - Amended 2026-10-05 from the quarry James Hook's *Minuet* `QmfRYEUhXHSj9a8yk5s4b5ErUsrQ3QkNNxgcJhfU65VjfE` (16 bars, 8+8, quarry ADMIT) is a candidate model of composition, not imported. A6.1's MODEL keeps Swing Low and Oh! Susanna, because those carry a printed chart to check against; *New Bath Minuet* has none.
- SHOULD improv-compose#10: Revise after listening on improv.6-9. Disposition: wave 5; outside recorder (A6.2's paragraph).
- SHOULD blues-boogie#8: Rhythmic phrasing variety as a task. Disposition: wave 5; self-checked (Trading fours counts pitch classes only [M §8]).

### 2.7 Cluster 7 — Style vocabulary

- SHOULD core#14: Style-track exercises on core rungs (riff, ostinato, tresillo, clave, swing pair). Disposition: wave 5; one line per rung or removal [R core §6].

#### 7a Blues (P2)

#### A7a.1 Improvise a right hand over your own left-hand groove
- **Rows:** blues-boogie#1. **Priority:** P2. **Tracks:** blues-boogie. [D-gate] Berklee weeks 8-10.
- **Capability:** keep a shuffle or boogie left hand through the twelve bars while the right hand improvises blue-note fragments. Start with bars 1-4 and build to the whole form, removing support step by step.
- **Evidence:** this is built nowhere. The boogie exercises hold RH shells; Jam it and Trading fours supply the app's bass; Duet gives the app the left hand [R blues §3.1]. Nothing between blues.5 and blues.9 rehearses it [R blues §4]. The lab bed always has its own bass [R jam §4.4; M §7b]. The chord chart has Comp and "Bass + drums" toggles, Count off and a bar tracker [M §15; no line cited there].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | Authored twelve-bar shuffles in C, F, G (blues.4; the root-5-6-5 LH moved to every chord): the LH alone, then with the written held-seventh RH | EXISTING | Keep tempo + Duet |
| MODEL/TRANSFER | Graded task (NEW, blues.7 or 8): the LH groove plus RH blue-note fragments over bars 1-4 only, then bars 1-4 and 9-12, then the form, over the chart with Comp and Bass + drums off (click and bar tracker only) | NEW | Chord chart |
| MUSIC | blues.9 choruses "over your own left hand" (`blues.9.md:26-29`, EXISTING), now with a ramp | EXISTING | Chord chart |
| INDEPENDENCE | Last step (REPAIR of the blues.9 wording): support removed (no tracker, no click), the LH figure and key chosen by the learner, one chorus a day on an outside recorder, listened to once | REPAIR | — |
- Amended 2026-10-05 from the quarry (B1, CONTROL): State EXISTING -> EXISTING. Artefact: the authored shuffles `exercise.blues.twelve-bar-shuffle.c/f/g` (blues.4), unchanged; chord plan C C C C F F C C G F C G. The quarry adds nothing to this station and says the real scores must not replace it. Published definition: no named style claim beyond the printed twelve-bar form. Verification boundary: no new checker (shipped material); Keep tempo measures LH notes and timing, Duet measures the chosen hand only. Completion: the LH shuffle alone through 12 bars at the rung's pass pair, then with the held RH. Nothing above is superseded. Generators keep only CONTROL in this block; B2 and B3 are real scores.
- Amended 2026-10-05 from the quarry (B2, MODEL/TRANSFER, the MODEL half before the graded task): State NEW -> NEW (a real MODEL added; candidates until intake, not admitted). Mode Keep tempo + Loop; Duet for a hand alone. Artefact: (a) *Original Jelly Roll Blues* (Morton) `QmbuoFtkky8Xpo8LSiAqkMXzBs2Mtc33L6GFw1kWv9T5S3`: 61 bars, grand staff, 4/4, 'Tempo di Blues'; bars 7-8 hold an octave-doubled two-bar riff in both hands (an observation, not a selection: the quarry chose no bars); (b) *Pinetop's Boogie Woogie*, Parham edition, `QmU7rsQ1UcCDqoY36Xk9qBQk8f6JcZgDFoAx9w96rSNYx3`: 96 bars, 2/2, tempo 160; the LH figure starts at bar 7 after six bars of tremolo; bars still to choose. It is a second edition of the piece shipped as `song.folk.boogie-woogie.pdmx` (already used by blues.8), so the shipped edition stays the default until the IM-8 comparison decides. Published definition: none supplied for 'boogie bass' or 'blue note'; any such lesson word needs the build brief's definition under the D-gate (Berklee weeks 8-10). Verification boundary: CK-7 on the chosen bars; CO-5 (the outside reviewer chooses and reads the bars; two more cuts); phrasing self-checked; no one here can decide whether it sounds like blues (unverified as music). Completion: the learner plays the chosen Morton riff and the chosen Pinetop LH bars in Keep tempo at the pass pair, says what the riff does (notes, rhythm), then uses one fragment of it in the graded task. Admission: quarry ADMIT / HIGH-PRIORITY for both; neither is in `catalog.json`: intake IM-7 and IM-8. Public export: not decided; README label unknown for both; Morton's metadata dates it 1915 and the shipped Pinetop edition is recorded `pd`; likely eligible by date [inferred]; the project's composition record decides. Wave: joins wave 2 item 7, not wave 1(c). The MODEL/TRANSFER cell above (the graded task only, no real model) is superseded in part: the real MODEL now precedes it.
- Amended 2026-10-05 from the quarry (B3, MODEL/TRANSFER, the full-form TRANSFER half): State NEW -> NEW (candidate, not admitted). Mode Keep tempo; Duet (the RH riff while the app plays the bed); the chord chart cannot open it (0 chord symbols). Artefact: *Blues Riff in C* `Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi`, bars 1-12, three parts, an arrangement by a lesson uploader: whole-note roots C2, F2, G2 under rootless voicings (B-flat E G, E-flat A C, F B D), one-line riff, and a drum-set part; form I I I I IV IV I I V IV I I (bar 12 stays on I, where the shuffles have G). To be played it must be re-staffed (the riff to the RH, the roots to the LH). Published definition: 'twelve-bar blues' is a structural claim read from the bars. Verification boundary: CK-7 extended to a re-staffing (the events must equal the source parts' events; as written CK-7 checks a cut only). **Open question, not resolved: the riff repeats B-natural 4 in bars 3-4, 7-8 and 12 against the B-flat 3 of the C7 voicing; a reader decides whether that is a typo or intended before the score ships (never teach wrong).** Holding the LH while the riff moves is self-checked; no one here can decide the idiom (unverified as music). Completion: the riff over the written root bed through all 12 bars in Keep tempo, then over the learner's own blues.4 C shuffle (the same plan except bar 12), self-checked. Admission: quarry KEEP CANDIDATE ('the cleaner controlled full-chorus bridge'); not imported: intake IM-9. Public export: not decided; licence field `publicdomain`, README label unknown, creator 'Lessons - Blues'; needs a rights record. Wave: joins wave 2 item 7.
  - Consumed 2026-10-05 from PARALLEL-UNBLOCKS §4 (Blues Riff in C): the open question above is CLOSED as a design decision: the B-natural recurs at corresponding places, so it is structural and never silently changed to B-flat. Keep the item as TRANSFER material with a harmony and note-choice caveat; it is not the canonical clean C7 blues-note MODEL until a source-based musical decision says what the B-natural does (see §8.6 item 11).
- Amended 2026-10-05 from the quarry (examined, no change): A7a.1 MUSIC (EXISTING) and INDEPENDENCE (REPAIR) match the quarry's independence step.

- **Falls through:** MODEL/TRANSFER (no ramp).
- **Measurement:** MIDI: the written LH, and the LH with held RH, in Keep tempo. The improvised RH is judged by nothing: on the Score screen improvised notes count as wrong keys [M §2], and the lab's in-scale count is pitch-class only, unstored, over a bass that would clash [M §7b]. self-checked: a steady LH through the form, the RH ideas, the listening. no actor can say whether the chorus sounds like blues (unverified as music).
- **Completion:** CT-1 (blues.7/8 are met on exercise runs; the improvised step is called self-checked).
- Consumed 2026-10-05 from SOURCE-CHECK-parallel (Blues / rock, Berklee Online *Blues and Rock Keyboard Techniques*): source-checked 2026-10-05 (parallel): confirmed, §Blues / rock. Gate lifted on this block. Confirmed: the broad sequence of accompaniment and time feel with a phrasing foundation, then idiomatic patterns and licks, then improvisation and application. Not supplied: the exact turnaround formula and the six-step blues ladder, which stay local and need notation or source-specific evidence.

#### A7a.2 Begin, turn around and end a blues chorus
- **Rows:** blues-boogie#3. **Priority:** P2. **Tracks:** blues-boogie; chords-pop.9's intro line by reference. [D-gate] Berklee "intros, turnarounds, endings" and PianoGroove.
- **Capability:** name and play the plainest blues turnaround (I7-IV7-I7-V7) next to the jazz-flavoured I-vi-ii-V, and play a short intro and an ending tag.
- **Evidence:** the only turnaround exercised is I-vi-ii-V (Cmaj7-Am7-Dm7-G7), and blues.7 calls it "the standard" [R blues §3.4; S A13]. No intros or endings appear in blues.3-9 [R blues §3.3]. G5's variant is a SHOULD generator change, with its checker defined per tier [A G5; reviewer correction 2].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | `exercise.turnaround.c.i-vi-ii-v(.intro)` relabelled as jazz-flavoured (REPAIR); I7-IV7-I7-V7 played from symbols on the chord drill (EXISTING kind). The G5 generated variant is wave 5 (SHOULD) | REPAIR | Theory drills |
| MODEL/TRANSFER | Bars 11-12 of the shipped twelve-bar pieces (St. Louis Blues, Hesitating Blues, the authored shuffles), not yet read for the figure [A G5] | SOURCE-NEEDED | Keep tempo |
| MUSIC | A chorus with a two-bar intro and a tag (REPAIR: one paragraph at blues.5 or 7) | REPAIR | Chord chart |
| INDEPENDENCE | A7a.1's choruses begin and end with a chosen intro and ending | SHARED | — |
- Amended 2026-10-05 from the quarry (examined, no change): MODEL/TRANSFER (the bars 11-12 turnaround) stays SOURCE-NEEDED. It is not supplied: *Blues Riff in C* stays on I in bars 11-12, and no turnaround in Morton or Pinetop was read.

- **Falls through:** CONTROL (the blues turnaround is never exercised).
- **Measurement:** MIDI: the chord drill judges sets; written bars in Keep tempo. self-checked: the intro and ending in the learner's chorus. no actor can judge the idiom (unverified as music).
- **Completion:** CT-1 (blues.5/7 are met on exercise runs).
- Consumed 2026-10-05 from SOURCE-CHECK-parallel: not covered, gate stays. The blues and rock page confirms only the broad accompaniment-then-vocabulary sequence; the blues turnaround and the blues intro and ending convention are not in it (the intros and endings lesson read is in the jazz course). The exact turnaround formula stays unchecked.
- Consumed 2026-10-05 from SOURCE-CHECK-technique-hymns-rock §Rock / blues keyboard progression (Berklee Online *Blues and Rock Keyboard Techniques*, OPIAN-220): source-checked 2026-10-05 (technique-hymns-rock): confirmed. Gate lifted on this block for the category proposition only: intros, turnarounds and endings are taught as part of blues phrasing and vocabulary, after bass lines, shuffle bass and comping, and before improvisation. This supersedes the line above to that extent (the two reads of the same course differ on whether its outline names turnarounds and endings; the later read quotes the sequence, so the proposition is taken as supported). Not supplied, still local: the exact turnaround formula, the six-step blues ladder and any intro or ending convention; the MODEL station stays SOURCE-NEEDED because bars 11-12 of the shipped pieces are unread [A G5]. The token above stays for the count script; the lift is carried here.

#### A7a.3 Play the form variants: minor blues and the quick IV
- **Rows:** blues-boogie#4. **Priority:** P4 (the material exists and is placed nowhere). **Tracks:** blues-boogie.
- **Capability:** play the twelve-bar form in minor, and with the IV in bar 2.
- **Evidence:** the generated minor-blues boogie and walking items exist on no rung. blues_forms.py leaves the quick change out "because no lesson introduces it", yet St. Louis Blues bar 2 is A7 [R blues §3.5]. P2 lists 16 items, and the boogie and walking_bass audits run first because both families claim music [A P2].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | P2: 12 `exercise.boogie.*.minor-blues` and 4 `exercise.walking-bass.*.minor-blues` placed on blues.6 (REPAIR, data), after CO-3 and the placement gate CK-4 | REPAIR | Keep tempo |
| MODEL/TRANSFER | St. Louis Blues bar 2 (quick IV) and St. James Infirmary (D minor), both shipped; one sentence each at blues.4/6 (REPAIR) | REPAIR | Keep tempo |
| MUSIC | Choruses on the chosen variant (A7a.1) | SHARED | Chord chart |
| INDEPENDENCE | The variant is chosen inside A7a.1's chorus task | NO-SEPARATE-ARTIFACT | — |
- Amended 2026-10-05 from the quarry (examined, no change): the quarry's ADMIT for *St James Infirmary* adds no new material. It is already shipped as `song.blues.st-james-infirmary` (24 bars, 41 symbols, D minor, opens in the chart) and is already this block's MODEL; A7a.3 is unchanged.

The INDEPENDENCE station needs no artefact: choosing the form is one more choice in A7a.1's last step, and a separate task would duplicate it.

- **Falls through:** CONTROL (the exercises exist but are placed nowhere).
- **Measurement:** MIDI: the written minor-blues items in Keep tempo. self-checked: the quick IV in your own chorus. no actor can judge the generated boogie as music; CO-3 is a notation reading.
- **Completion:** CT-3 (blues.6's exercise runs then include the placed items).

- SHOULD blues-boogie#10: Prerequisites: blues.4 on blues.3 and 4.5; blues.8 on theory.6. Disposition: wave 5, data.
- SHOULD blues-boogie#11: A twelve-bar chorus in the Stage 8-9 repertoire. Disposition: wave 5; the dossier CIDs are uninspected; Carolina Shout's dump copy is empty.

#### 7b Jazz (P2)

#### A7b.1 Minor ii-V-i with shells
- **Rows:** jazz#1. **Priority:** P2. **Tracks:** jazz (owner); theory.5/7 and core 4.2 supply the pieces of it. [D-gate] Berklee week 8; the tonic quality (im7, im6, im(maj7)) is chosen from the primary source [A G6].
- **Capability:** voice iiø7, V7, i with shells in two or three minor keys; know that a root-3-7 shell cannot show the ♭5; recognise the progression in a tune.
- **Evidence:** it is absent from every jazz lesson [R jazz §3.1; U jazz#1, verified]. `shellChord` counts degrees on the major scale, so a minor i comes out as a major-seventh shell, and data alone cannot express the progression [A G6]. **The shipped Fly Me to the Moon does not demonstrate it:** that file prints a tritone-substituted setting [A G6; brief correction 7]. Insensatez's symbols were not read [A G6].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | `drill.jazz.ii-v-i-shells` with `mode: "minor"`: code fix in `shellChord`/`romanToChord` plus data [A G6]; CK-6 | REPAIR | Theory drills |
| MODEL/TRANSFER | A shipped piece that prints iiø7-V7-i. None is admitted: Fly Me does not print it, and Insensatez's 28 symbols must be read [A G6] | SOURCE-NEEDED | Keep tempo |
| MUSIC | Comp that tune's chart with the jazz.6 rhythms; it depends on the MODEL piece | SOURCE-NEEDED | Chord chart |
| INDEPENDENCE | The jazz.9 standard is or includes a minor-key tune, and the learner names its ii-V-i unprompted (A10.1) | SHARED | — |
- Amended 2026-10-05 from the quarry (examined, no change): MODEL and MUSIC stay SOURCE-NEEDED. The quarry supplies no score that prints iiø7-V7-i, and A7b.1 still has no score that prints the minor ii-V-i. Its *Fly Me to the Moon* is the shipped file this map already rejects; the harmony of *Blue Bossa* and of *Autumn Leaves* is explicitly unread and the summaries print no chord symbols. The cheapest next step for the wave 2.3 brief is to read those two files' `<harmony>` elements.

- **Falls through:** CONTROL (no drill can express minor) and MODEL/TRANSFER.
- **Measurement:** MIDI: once fixed, the chord drill's expected sets against the music21 fixture (CK-6). self-checked: hearing the progression in a tune. no actor can judge voicing sound (unverified as music).
- **Completion:** CT-3 (jazz.6's exercise runs measure the voicing once the drill is right).
- Consumed 2026-10-05 from SOURCE-CHECK-parallel (Jazz, Berklee Online *Jazz Piano*, OPIAN-315): source-checked 2026-10-05 (parallel): confirmed, §Jazz. Gate lifted on this block. Confirmed: minor ii-V-i belongs in a developed jazz-piano pathway after basic comping and walking-bass work, with arranging and intros and endings later. Not supplied: voicing, key list, repetition count and rung number (local); the tonic quality (im7, im6, im(maj7)) is still chosen from the primary source [A G6], which the syllabus does not settle. The MODEL stays SOURCE-NEEDED (no score prints the minor ii-V-i).

#### A7b.2 Solo over changes: chord tones, then approach notes
- **Rows:** jazz#2. **Priority:** P2. **Tracks:** jazz; improv.6 (guide tones) is the control owner. [D-gate] Berklee weeks 9-10; ABRSM Jazz Piano.
- **Capability:** improvise a line over a ii-V-I: chord tones on the beat first, then a half-step approach from above or below into a chord tone.
- **Evidence:** "soloing" is in the jazz.9 title and is never taught; no lesson teaches building an approach-note line; jazz.9's prerequisite is jazz.8 only [R jazz §3.2]. Guide tones are taught at improv.6 [R improv §2E]. P7 reuses the improv.6 exercises and adds a prerequisite [A P7].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | improv.6's guide-tone work over the lab's ii-V-I, declared as a prerequisite of jazz.9 (data) | SHARED | Lab: Hold the chords |
| MODEL/TRANSFER | New jazz.8 section (NEW): one chord tone per beat over jazz.5's ii-V-I, then one half-step approach above or below into the next chord tone | NEW | Lab: Hold the chords |
| MUSIC | One chorus over the jazz.9 standard's chart (A10.1) | SHARED | Chord chart |
| INDEPENDENCE | Choosing where to approach, and resolving a wrong note by step, inside the jazz.9 solo pass (A10.1) | SHARED | — |
- Amended 2026-10-05 from the quarry (J1, MODEL/TRANSFER): State NEW -> NEW. Mode Lab: Hold the chords (the NEW jazz.8 section); Chord chart (*After You've Gone*); Play it to me (the transcription). Artefact: the NEW jazz.8 section stays the core; then the whole 20-bar chart of *After You've Gone* `QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU` (30 symbols, labelled A/B), the shortest full standard, with comp, bass and solo all left to the learner; then 2-4 bar passages of the *Autumn Leaves* transcription `QmeeqT5bwUfEqU9w8ZGXXLgp49DQra1tM23aD85ipXiXXv` (96 bars, one staff, alto saxophone, 87 symbols), chosen where the printed harmony shows a chord tone approached by a half step; the passages are not yet chosen. Published definition: 'chord tone' and 'approach note' stay under the map's D-gate (Berklee weeks 9-10, ABRSM Jazz Piano); the quarry adds no definition. Verification boundary: no checker for an improvised line; Hold the chords gives an unstored in-scale count and the chart's live cell is unstored; the outside reviewer chooses the transcription passages; a chord tone on each beat and the approach resolving are self-checked; no one here can judge style. Completion: one chorus of *After You've Gone* with a chord tone on each beat, then with one half-step approach into each new chord (self-checked); in two transcription bars, the learner names the approach note and its target. Admission: *After You've Gone* ADMIT / HIGH-PRIORITY and the transcription HIGH-PRIORITY CANDIDATE in the quarry; neither is imported (IM-10; the transcription waits until passages are chosen). Public export: not decided; *After You've Gone* licence `publicdomain`, label unknown, the metadata gives no date, so it needs a rights record; the transcription's label is unknown and the tune is presumed in copyright [inferred]. Nothing above is superseded.
- Amended 2026-10-05 from the quarry (lead sheets as a ladder, one sheet per job): *St James Infirmary* (already shipped, A7a.3's MODEL); *After You've Gone* (A7b.2, after the lab ii-V-I; public-build fallback for jazz.9); *Blue Bossa* (A7c.3 MUSIC, after G14); *There Will Never Be Another You* (A10.1); the *Autumn Leaves* transcription (A7b.2 MODEL analysis, not an acquisition score); *Fly Me to the Moon* (already shipped; a voicing model for the harmonised-melody pass only, not evidence for minor ii-V-i).

- **Falls through:** MODEL/TRANSFER (no line-building step).
- **Measurement:** MIDI: Hold the chords shows in-scale notes per round, unstored, with chord tones lit, so it says nothing about choice [M §7b]. Trading fours cannot certify style [M §8]. self-checked: a chord tone on the beat, and the approach resolving. no actor can judge stylistic quality (unverified as music).
- **Completion:** CT-1 (jazz.8 is met on exercise runs).

- SHOULD jazz#6: Lesson-to-drill mismatches (rootless on jazz.6, chord-scale on jazz.7, modes and sight-reading on jazz.8). Disposition: wave 5, data or a pointer line.
- Consumed 2026-10-05 from SOURCE-CHECK-parallel (Jazz, Lesson 9 chord-tone soloing; Improvisation, Berklee Online *Basic Improvisation*, OPERF-110): source-checked 2026-10-05 (parallel): confirmed, §Jazz and §Improvisation. Gate lifted on the Berklee proposition (chord-tone and harmony-aware choices, motivic development and variation, transcription as a foundation). The ABRSM Jazz Piano citation in the line above was not read by the parallel check and stays gated for that citation alone. Not supplied: order, vocabulary or stage (Berklee's twelve-week order and chromatic vocabulary are not required here).

#### 7c Latin (P2), substrates assigned by tradition (brief correction 6; §8.3)

#### A7c.1 Habanera and tresillo as distinct cells
- **Rows:** latin#1. **Priority:** P2. **Tracks:** latin (new latin.4 at Stage 4); ragtime.7 (Solace) mentions the habanera. [D-gate] The upgrade's definition [U §0.3]; the primary check reads a printed habanera (the Bizet dump, IM-3).
- **Capability:** play the habanera bass (dotted eighth, sixteenth, eighth, eighth in 2/4) and the tresillo (3+3+2); tell them apart on the page and by ear; know that the Argentine tango figures descend from the habanera.
- **Evidence:** Por Una Cabeza's left hand is the habanera (onsets 0, 1.5, 2, 3 in 4/4) in 56 of 66 bars, unbroken over bars 1-14. The Crave's left hand is the tresillo (0, 1.5, 3) in 27 of 53 bars. No lesson names either [R latin §2, §3.1]. G13 extends `tresillo` with `cell` and `timeSig` parameters; both models are ADMITTED [A G13]. The learning need stands although the old candidates failed [U §0.3; S D].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | `exercise.tresillo.c` (EXISTING, 4/4) plus new 2/4 habanera and tresillo items, C, F, G, side by side [A G13]: generator EXTEND with CK-5 and CO-4. The integer transpose at `:5806` gets interval spelling in the same edit | REPAIR | Rhythm only + Keep tempo |
| MODEL/TRANSFER | Por Una Cabeza bars 1-14 (habanera) and The Crave (tresillo) cut as excerpts on latin.4 (shipped; the cut is REPAIR) under CK-7 and the placement gate CK-4; the habanera named in latin.4 and latin.6 | REPAIR | Keep tempo |
| MUSIC | Por Una Cabeza whole and La Cumparsita on latin.6 | SHARED | Keep tempo |
| INDEPENDENCE | Before playing each latin.6/7 piece, say which cell its left hand uses and where it breaks (NEW, one task line) | NEW | — |
- Amended 2026-10-05 from the quarry (L1, MODEL/TRANSFER): State REPAIR -> REPAIR. Mode Keep tempo. Artefact: *Por Una Cabeza* `QmNswaWYXpxK1XegKbJVDULwZMjKN6cETGTVfXQKYsYrzs` (the shipped `song.folk.por-una-cabeza-carlos-gardel.pdmx`), bars 1-14: in every one of bars 1-14 the LH is quarter, eighth rest, eighth, quarter, quarter, onsets 0, 1.5, 2, 3; *The Crave* unchanged. **For the habanera MODEL, the quarry retained neither Bizet nor *Contra Danza*:** neither was dumped or reviewed, so IM-3 stays CANDIDATE with its dumps pending. Published definition: the upgrade's cell [U 0.3], with the Wikipedia Habanera and Tresillo pages as a secondary source; STYLE-VERIFICATION restates the cell without a citation; the primary check, a printed habanera (IM-3), is still unread. Verification boundary: CK-5 (onset sets and the cross-failure with the tresillo), CK-7, CO-4 and CO-5 as in the map; the written durations differ from the cell (a quarter plus an eighth rest where the doubled cell has a dotted quarter), so the cell's identity rests on the onsets, which CK-5 checks; the app's +/-150 ms window cannot resolve the cell at speed; no one can judge the feel. Completion: unchanged from the map. Admission: shipped and ADMITTED here; where the quarry's habanera note is weaker ('not, by itself, proof'), the map wins and CK-5 is kept. Public export: shipped (the catalogue records composition status unknown).

- **Falls through:** CONTROL (no habanera drill) and MODEL/TRANSFER (the models are never named).
- **Measurement:** MIDI: onsets within ±150 ms in Keep tempo and Rhythm only. At moderate tempo that window may not separate the habanera from a dotted-pair near-miss, and the evidence refuses timing it cannot resolve [M §2(ii)]. So the app checks the notes and rough timing, not the cell's identity at speed; CK-5 checks the cell in the files. self-checked: hearing the difference. no actor can judge the feel (unverified as music).
- **Completion:** CT-3 (latin.4 is met by runs of its habanera and tresillo items, with the timing caveat in the lesson).
- Consumed 2026-10-05 from SOURCE-CHECK-parallel (Latin, Berklee Online *Latin Piano Styles*, OPIAN-300, Lessons 3, 6 and 10): source-checked 2026-10-05 (parallel): confirmed, §Latin. Gate lifted on the category proposition: tango patterns derived from the habanera, Cuban clave-based figures and Brazilian bossa and samba are distinct teaching categories. The primary check of a printed habanera (the Bizet dump, IM-3, in the line above) is a different check and stays open.

#### A7c.2 Comp a Cuban tune: tumbao and montuno under Guantanamera
- **Rows:** latin#3, latin#4. **Priority:** P3 (the figures are drilled, never applied). **Tracks:** latin. [D-gate] latin#3 cites the dossier and Berklee on separating traditions. This block takes the Cuban part of both rows; A7c.3 takes the Brazilian part.
- **Capability:** know that the clave, tumbao and montuno are Cuban; apply the tumbao and montuno to Guantanamera's chord symbols, locked to a clave side the learner names.
- **Evidence:** there is no comping or application station; tumbao and montuno have no printed transfer anywhere in the track [R latin §3.3, §6]. Guantanamera has 29 symbols in 21 bars [R latin §2]. The montuno exercise is the clave's rhythm played as chords, not a guajeo [R latin §3.5]; G15 (guajeo) is source-blocked [A, reviewer correction 1].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | `exercise.tumbao.c/.g`, `exercise.montuno.c.2note/3note.son-3-2`, `exercise.latin-groove.c/d` on latin.5 | EXISTING | Keep tempo |
| MODEL/TRANSFER | latin.5 task (NEW): the tradition named; the tumbao alone under Guantanamera's symbols, then the montuno two notes at a time | NEW | Chord chart |
| MUSIC | Sixteen bars of tune over your own tumbao and montuno: the existing end-of-lesson test (`latin.md:59-61`) pointed at Guantanamera (REPAIR) | REPAIR | Chord chart |
| INDEPENDENCE | One tradition-choice task (NEW, latin.6 or 7): given a lead sheet, say Cuban, Brazilian or Argentine, choose the matching accompaniment, and name the clave side | NEW | — |
- Amended 2026-10-05 from the quarry (L2, CONTROL): State EXISTING -> REPAIR. Mode Keep tempo. Artefact: the shipped `exercise.tumbao.c/.g`, `exercise.montuno.*` and `exercise.latin-groove.*` keep their rhythms; the repairs are wording only (the Cuban-term line below): the latin.6 sentence, the montuno docstring and title, the finder's avoid line. G15 (SHOULD latin#7) stays gated on one published guajeo pattern; Mauleon is still unread, and the quarry surfaced two more books without reading them (Patino and Moreno, *Afro-Cuban Keyboard Grooves*; Moore, *Beyond Salsa Piano*). Published definition: guajeo is the broader repeated syncopated ostinato, often arpeggiated; montuno has several meanings, one of them a piano guajeo; tumbao is historically a bass rhythm and in timba also a piano guajeo; ponchando is the block-chord, non-arpeggiated guajeo with its attack points foregrounded (all cited to Wikipedia, a secondary source). Verification boundary: unchanged for the existing items; a reader confirms each changed sentence against the definitions; no one can judge the feel. Completion: the learner plays the tumbao and the block-chord clave study under the names the lesson now gives them. Superseded in part: the CONTROL cell's 'exercise.montuno' is not called a guajeo; the montuno exercise is the clave's rhythm played as chords, not an arpeggiated guajeo, and the result is never to be called one.
- Amended 2026-10-05 from the quarry (Cuban terms at HEAD, brief seam 1a.6 with W16, wave 1(a)): MUST change: (1) `content/lessons/latin.6.md:35-38`, 'The three-note study in D minor is the figure itself: every note is a clave stroke', must call it a block-chord study on the clave strokes, a preparation for the montuno (a rhythm-lock drill), unless a published source prints it as a ponchando; (2) `tools/content/generate_exercises.py:5155` (docstring 'A guajeo is chord tones on the clave's own strokes'), `:5171` (title 'Montuno - n notes on son 3 2') and `:5174` (direction): fix the docstring (not learner-facing) and retitle (learner-facing); the rhythm and digests are unaffected; the latin-groove title at `:5221` ('tumbao and montuno') follows the retitle; (3) the montuno finder in the concepts file (the amendment cites `content/curriculum/concepts.json:2278-2292`, avoid line at `:2289`: 'block chord accompaniment') contradicts the shipped montuno items, which are block chords, and excludes the ponchando. KEEP: the `latin.md:23-26` tumbao bass definition (add one clause: some players call the piano figure a tumbao, as the rung's own video does); `latin.md:6`'s video label (the video's own title, explained by that clause); `latin.md:28-31`'s montuno definition (add one clause that montuno also names a section and the family of figures is the guajeo; it must never become 'arpeggiated'); the tumbao finder, `stage-5.json:737-742`, `00-tracks.json:76`, `TUMBAO_OFFSETS` and `:5114-5127`. A grep of `content/lessons/latin*.md` finds no 'arpeggiat' at HEAD, so W16's 'arpeggiated' item is not in those files now; the orchestrator checks where it points. G15 keeps the name 'arpeggiated guajeo' as one type of guajeo, not as the montuno; its near-miss proves arpeggiated is not block chords.
- Amended 2026-10-05 from the quarry (L3, MODEL/TRANSFER): State NEW -> NEW. Mode Chord chart; then Keep tempo + Loop for a printed excerpt. Artefact: the NEW latin.5 task under *Guantanamera* stays; added as a candidate: *La Negra Tiene Tumbao* `QmbYzj8P6PbJ9DwbepDeMSHTVoHyEEMhQRsuTLcqf3bqyd` (68 bars, two staves, 46 symbols). Bars are chosen only after they are classified from their note motion as arpeggiated guajeo, ponchando or bass tumbao; the quarry's own reading is that much of the inspected opening and verse texture is block-chordal. Published definition: the tightened terms; the title never classifies the figure. Verification boundary: CK-7 on the cut; a reader classifies the bars against a published 2-3 or 3-2 example; clave alignment is self-checked; no one can judge the feel. Completion: the learner plays the chosen bars and says which family, as the lesson defines them, the bars show and why. Admission: quarry HIGH-PRIORITY CANDIDATE; not imported (IM-13, after classification). Public export: no (label unknown, presumed in copyright [inferred]; personal-library and curriculum admission are separate decisions, as for Libertango).
  - Consumed 2026-10-05 from PARALLEL-UNBLOCKS §4 (La Negra Tiene Tumbao): the classification is CLOSED: the retained bars are repeated non-arpeggiated block-chord attacks, a ponchando or block-chord-guajeo MODEL, not an arpeggiated guajeo. The title 'Tumbao' does not override the notes (see §8.6 item 11).
- Amended 2026-10-05 from the quarry (L4, MUSIC): State REPAIR -> REPAIR. Mode Chord chart. Artefact: the end-of-lesson test pointed at *Guantanamera* stays; *La Negra*, whole, is a personal-library MUSIC candidate after L3. Verification boundary: the chart's live cell gives no verdict for a tumbao; self-checked. Completion as in the map. Admission and public export as L3: candidate, not imported, public export no.

- **Falls through:** MODEL/TRANSFER (no application station).
- **Measurement:** MIDI: the written exercises in Keep tempo. The chart's live cell needs 60 % of the chord held at an instant, which a tumbao's single bass notes will rarely give, so the cell is no verdict here [M §15]. self-checked: clave alignment, and the tune sung or played over the groove. no actor can judge the feel (unverified as music).
- **Completion:** CT-1 (latin.5 can be met by any of twelve exercises, six of them generic [R latin §6]; the latin#10 SHOULD row would close that route).
- Consumed 2026-10-05 from SOURCE-CHECK-parallel (Latin, Berklee Online *Latin Piano Styles*, Lesson 3): source-checked 2026-10-05 (parallel): confirmed, §Latin. Gate lifted on this block: guajeo and montuno, tumbao, and the other Cuban clave-based figures are taught as distinct categories, separate from Brazilian and Argentine ones. The public syllabus names categories and sequence; it gives no event-level contract, which is why the G15 contract below comes from the Mauleon sample pages.
- Consumed 2026-10-05 from PARALLEL-UNBLOCKS §2 (G15, the guajeo and montuno boundary): State: G15 stays source-gated no longer; a primary-source path exists (build still waits for its brief and the map's wave 3). Primary source: Rebeca Mauleon, *101 Montunos* (Sher Music), its public sample pages, read by the reviewer: p. 40, Ex. 10 *I-ii-V-IV with Arpeggio* (2-3 clave orientation marked), then Ex. 11 over a standard tumbao; p. 83, Ex. 47 (the text advises repeating an idea before varying it). The first controlled G15 pattern is **one exact published example, Ex. 10**, transcribed with its attacks, durations and chord roles. No averaged 'guajeo rhythm', and no universal guajeo detector: the contract is categorical (a short repeating ostinato, a syncopated profile, content that outlines the current harmony, for the arpeggiated subtype successive attacks that change pitch content through chord tones, at least two cycles before a variation, one clave orientation kept inside one control). The sibling near-miss is the block-chord (ponchando) pattern: it may be valid Cuban accompaniment, but it must fail an arpeggiated-guajeo checker. *La Negra Tiene Tumbao* stays the real MODEL for the block-chord side and is not evidence for the arpeggiated figure (its retained bars are block-chord attacks, see §8.6 item 11). G15's only gate is musical: the published Mauleón example (Ex. 10) defines the arpeggiated-guajeo control, the block-chord (ponchando) sibling stays the near-miss, and it is built when the wave reaches it. The transcription is checked against the page by a reader, and no one in this process can judge the feel (unverified as music). [Owner correction applied 2026-10-05: the earlier open item about shipping a transcription in the public build is removed; see the copyright note in section 8.5.]

#### A7c.3 Comp a Brazilian tune: a bossa accompaniment under Insensatez and Só Danço Samba
- **Rows:** latin#3, latin#4. **Priority:** P3. **Tracks:** latin; jazz.8 refers to it (a SHOULD line below). [D-gate] latin#3; the bossa pattern itself is G14, source-blocked.
- **Capability:** apply a sourced bossa left-hand pattern to the two Brazilian lead sheets.
- **Evidence:** no lesson teaches a bossa pattern. The two tunes are one-staff melody plus symbols (Insensatez 28 symbols, Só Danço Samba 25) [R latin §2, §3.3-3.4; R jazz §3.6]. No bossa bass definition has been read in this process; the row is blocked and nothing may be invented [A G14; reviewer correction 1]. Until it is unblocked, latin.5 says the Brazilian tunes are melody and symbols and that the bossa accompaniment is not yet taught (latin#3, text).

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | The bossa LH pattern from a published Brazilian or bossa method: `comping` bossa form EXTEND after the source is read (G14). `exercise.clave.bossa` (rhythm only) is EXISTING but is not the pattern | SOURCE-NEEDED | Keep tempo |
| MODEL/TRANSFER | Insensatez and Só Danço Samba, ADMITTED as substrate [A G14]; the application task waits on CONTROL | SOURCE-NEEDED | Chord chart |
| MUSIC | jazz.8's bossa-in-jazz reference uses the same pattern (SHOULD, cluster 7c) | SHARED | Chord chart |
| INDEPENDENCE | A7c.2's tradition-choice task | SHARED | — |
- Amended 2026-10-05 from the quarry (L5, CONTROL): State SOURCE-NEEDED -> SOURCE-NEEDED, narrowed: gated on one published pattern and its exact contract, no longer blocked on the style. Mode Keep tempo. Artefact: G14 EXTENDS the `comping` bossa form with one or more sourced patterns; the build brief chooses one pattern from a published source and writes its onset, duration and pitch-role contract. The quarry names these sources: three Piano With Jonny pages, an *O Piano Brasileiro* unit 6 sample, 8notes and PianoGroove; they are teaching pages and a sample of a method, not a whole method read. G14's 'root and fifth roles' fits the published two-layer picture (an LH root/fifth bass under syncopated RH chords) but not the Garota edition, whose LH strikes root and chord in one attack with no separate bass; the brief must say which texture its CONTROL teaches. `exercise.clave.bossa` stays rhythm-only. Published definition (the boundary the quarry found): a coordinated bass plus a syncopated chordal rhythm, taught as several progressively syncopated patterns, not one universal rhythm. Verification boundary: onset sets and root/fifth pitch classes per bar against the chosen published cell, plus a sibling near-miss that must fail (the clave-only item, for instance); the outside reviewer checks that the contract transcribes the published example; no one can judge the feel. Completion: the chosen pattern under a two-chord vamp in Keep tempo at the pass pair, in the keys the source gives. Admission: a generator row, none. G14 therefore moves from 'source-blocked' to 'gated on a pattern': it still waits on one published pattern and its exact contract, and nothing is built until both exist. Superseded in part: the Evidence sentence 'No bossa bass definition has been read' and 'the row is blocked' (the style boundary is now sourced; the build requirement is unchanged).
- Amended 2026-10-05 from the quarry (L6, MODEL/TRANSFER): State SOURCE-NEEDED -> NEW for the MODEL item (a); SOURCE-NEEDED for the TRANSFER item (b) until L5. Mode Keep tempo + Duet (the LH alone under the app's melody, then hands together); Chord chart for the transfer. Artefact: (a) MODEL: *Garota de Ipanema* `QmRWDfadi4gsez9ishabhEcHpHNdjC7q2efEJZe5SDa8X8`, arranged by Bianca Giovanella: 34 bars, 2/4, grand staff, 24 symbols. LH cells: a two-bar cell in bars 1-2, 3-4 and 24-27 (bar 1 onsets 0, 0.75, 1.75; bar 2 onsets 0.25, 0.75, 1.5, in quarter-note units), whose first bar returns in bars 5 and 28; bar 6 varies it; a one-bar cell (onsets 0, 0.5, 1.25) in bars 7-8, 10-12, 14-16, 18 and 30-33; held half-note chords in bars 9, 13, 17 and 19-23. The quarry says 'bars 1-7'; the proposed excerpt is bars 1-8 (the two-bar cell, then the one-bar cell), a selection for the build brief. (b) TRANSFER: apply the taught CONTROL pattern to *So Danco Samba* (shipped, 25 symbols) and *Insensatez* (shipped, 28 symbols). Published definition: as L5; Garota is 'a real written bossa accompaniment in context', not *the* pattern. Verification boundary: CK-7 on the cut; once L5 has chosen a pattern, a script compares Garota's LH onsets with it, and that comparison decides whether the lesson may say 'the pattern you practised' or must say 'a related pattern'; CO-5; the application to the lead sheets is self-checked; no one can judge the feel. Completion: Garota bars 1-8, LH, in Keep tempo, then hands together; then 16 bars of *So Danco Samba* from its symbols over the taught pattern (self-checked). Admission: quarry ADMIT AS BOSSA MODEL / TRANSFER CANDIDATE: a candidate, not admitted; not imported (IM-6; rights decision first). Insensatez and So Danco Samba stay ADMITTED as substrate. Public export: no until a rights record exists (licence `cc-zero` for the upload; the composition is presumed in copyright [inferred]). If the MODEL cannot ship, the public build carries A7c.3 on CONTROL plus the application on shipped sheets, and the lesson says so: the open public-build question of section 8.6 item 4.
- Amended 2026-10-05 from the quarry (L7, MUSIC): State SHARED -> SHARED. Mode Chord chart. Artefact: jazz.8's reference to bossa inside jazz (SHOULD jazz#9) gets *Blue Bossa* `QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6` (32 bars, 24 symbols) as its substrate, played with the A7c.3 pattern; the quarry says it is 'not source for bossa pattern', and its harmony is unread. Verification boundary: live cell unstored; self-checked. Completion: one chorus of *Blue Bossa* over the taught pattern. Admission: quarry ADMIT; not imported (IM-12, with jazz#9). Public export: not decided; label unknown, presumed in copyright [inferred]; rights open (amendment 5.4 item 1).
- Amended 2026-10-05 from the quarry (L8, INDEPENDENCE): State SHARED -> SHARED. Artefact: A7c.2's tradition-choice task plus *Corcovado*: the shipped `song.pop.corcovado.pdmx`, 31 symbols, currently placed on chords-pop only; the learner chooses and adapts a taught pattern with no written accompaniment in front of them. Published definition: as L5. Verification boundary: self-checked. Completion: the learner names the tradition and plays *Corcovado* with a chosen bossa pattern, unprompted. Admission: shipped; quarry ADMIT AS APPLICATION SUBSTRATE, identity TITLE_ONLY. Public export: shipped.
- Amended 2026-10-05 from the quarry (wave): A7c.3 moves from wave 4 item 5 to wave 3, beside A7c.2 (its priority is P3). The dispatch condition becomes 'the build brief names one published pattern and its contract', no longer 'the style's source is read'. The Garota MODEL joins only after intake and a rights decision.

- **Falls through:** CONTROL (no sourced pattern).
- **Measurement:** MIDI: the written pattern in Keep tempo, once it exists. self-checked: applying it to the tunes. no actor can judge the feel (unverified as music).
- **Completion:** CT-1 (latin.5, as in A7c.2).
- Consumed 2026-10-05 from SOURCE-CHECK-parallel (Latin, Berklee Online *Latin Piano Styles*, Lesson 6; Jazz, Lesson 7 *Playing a Bossa Nova*): source-checked 2026-10-05 (parallel): confirmed, §Latin and §Jazz. Gate lifted on this block: bossa is a distinct taught piano style. The syllabi do not expose enough notation to define a pattern; the pattern contract below comes from the two teaching pages the reviewer read.
- Consumed 2026-10-05 from PARALLEL-UNBLOCKS §1 (G14, the bossa contract): State SOURCE-NEEDED -> contract supplied for CONTROL (the station table above is unchanged and section 7 counts the table; the build still waits for its own brief and the map's wave 3). Contract: **one basic bossa bass pattern, never 'the bossa rhythm'**, a single beginner control and not a definition of all bossa nova. Straight 4/4, straight eighths, no swing. One bar, left-hand attacks only: onset 0 (beat 1), 1.5 (the and of 2), 2.0 (beat 3), 3.5 (the and of 4), in the bass-only acquisition variant realised as a dotted quarter plus an eighth twice (root, onset 0, 1.5 beats; fifth, onset 1.5, 0.5 beat; root, onset 2.0, 1.5 beats; fifth, onset 3.5, 0.5 beat). Pitch roles root and fifth only, relative to the written harmony. The 3.5 pickup is the fifth of the next chord only in a labelled anticipation variant, otherwise the current chord's fifth. Checker: read the LH attacks independently and require exactly the onset set (0, 1.5, 2.0, 3.5) with root or fifth membership per bar; it must reject quarter-note roots on beats 1 and 3 only, the tresillo and habanera onset sets, and a syncopated RH chord pattern with no stated bass contract. No universal bossa detector and no generator rewrite: G14 EXTENDS the `comping` bossa form with this one pattern. Sources, as the reviewer read them: a Piano With Jonny lesson (step 4 states the left-hand sequence) and ChordRhythm's bossa pattern page (root to fifth, dotted quarter plus eighth, and it says there are several variants); these are teaching pages, not a whole method read. The Berklee syllabi support bossa as a taught style and expose no notation. Texture: this CONTROL teaches the two-layer picture (an LH root and fifth bass under syncopated RH chords), the bass half only, so the earlier warning about the Garota edition stands: Garota remains MODEL and TRANSFER evidence, not the source that defines this pattern, and a script compares its LH onsets with the sourced family afterward, as L6 says. The pitch-role and onset statements are the contract's; no one in this process can judge the feel (unverified as music).

#### A7c.4 Modern tango: ostinato, accent, articulation and texture
- **Rows:** latin#9. **Priority:** P7 (a promised endpoint, the new latin.8). **Tracks:** latin.
- **Capability:** play tango nuevo texture: a repeated accented bass ostinato, articulation and sustained rhythmic drive under changing upper harmony.
- **Evidence:** the two-staff Piazzolla Libertango arrangement `QmakqtZzLrMc3CqFnwiqjyxmhrThav2Hmu15E6Jrg9oap2` has these properties. The excerpt choice is refined after the El gordo triste dump. Public export is no (Piazzolla is in copyright); personal-library and curriculum admission are separate decisions [U §0.2, latin#9]. Both earlier candidates were rejected [S D; R latin §8.3].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | The ostinato bars of the arrangement, looped. A generated control only if a sourced pattern is defined later [U latin#9]. Intake IM-2 | SOURCE-NEEDED | Loop + Ladder |
| MODEL/TRANSFER | The chosen excerpt of the arrangement (IM-2; cut under CK-7; teaching use under CO-5) | SOURCE-NEEDED | Keep tempo |
| MUSIC | The whole arrangement as project material in the personal library | SOURCE-NEEDED | Perform |
| INDEPENDENCE | latin.8 task (NEW): set a traditional tango left hand (Por Una Cabeza, latin.6) beside the nuevo ostinato, say what changed, and apply the accented ostinato to a tango already played | NEW | — |
- Amended 2026-10-05 from the quarry (examined, no change to state): *Adios Nonino* `QmYNaW9VvQDFWoD159XYCPxmvyJmGBkhrFijb1P1PaLRUE` is a HIGH-PRIORITY CANDIDATE for Argentine tango MODEL, MUSIC and advanced arrangement analysis (81 bars, an ensemble with two two-staff piano parts). It is recorded as a second candidate for this block's MUSIC and analysis role, in the personal library, not as a replacement; no named-figure claim is made for it. Libertango (IM-2) stays the primary candidate (the quarry did not review its CID). Public export stays no; all four stations stay SOURCE-NEEDED.

- **Falls through:** CONTROL and MODEL/TRANSFER (the rung is not built and its material is not yet admitted).
- **Measurement:** MIDI: the excerpt's notes and timing in Keep tempo; the take in Perform. self-checked: accent and articulation (velocity is measured only in the dynamics drill [M §26]). no actor can judge the texture as music (unverified as music).
- **Completion:** CT-2 pending. A rung whose only material is personal-library cannot be met in the public build. Its public-build behaviour is open (§8.6).

- SHOULD latin#6: A bossa accompaniment pattern. Disposition: source-blocked (G14), see A7c.3.
  - Amended 2026-10-05 from the quarry Moves with L5: gated on one pattern, no longer source-blocked.
  - Consumed 2026-10-05 from PARALLEL-UNBLOCKS §1 (latin#6): the pattern contract is supplied (A7c.3); the SHOULD row still dispatches only with A7c.3.
- SHOULD latin#7: An arpeggiated guajeo as the second montuno step. Disposition: source-blocked (G15; Mauleón to be read).
  - Amended 2026-10-05 from the quarry G15 stays gated on one published guajeo example; the quarry narrows the terminology only and adds two unread books.
  - Consumed 2026-10-05 from PARALLEL-UNBLOCKS §2 (latin#7): a primary-source path now exists (Mauleon Ex. 10, see A7c.2); the arpeggiated step stays a SHOULD behind the Cuban CONTROL and its own build brief.
- SHOULD latin#10: Generic exercises can satisfy the latin.5 requirement. Disposition: wave 5, data (makes A7c.2 CT-3).
- SHOULD latin#11: `startsAtStage` 5 while latin.3 exists. Disposition: wave 5, data.
- SHOULD jazz#9: Bossa in a jazz context (latin owns it). Disposition: after G14 is unblocked; a jazz.8 reference line.
  - Amended 2026-10-05 from the quarry *Blue Bossa* is the substrate, after G14 (L7); wave 3 with A7c.3.
  - Consumed 2026-10-05 from PARALLEL-UNBLOCKS §1 (jazz#9): G14 now has its contract, so the jazz.8 reference waits only on A7c.3's build.

#### 7d Ragtime (P2)

#### A7d.1 Keep a duple oom-pah under early syncopation
- **Rows:** ragtime#1, ragtime#2, ragtime#3. **Priority:** P2. **Tracks:** ragtime (ragtime.5-8); oom-pah is also on 4.7 and holiday.4 [A P1].
- **Capability:** keep a bass-chord oom-pah steady (octave reach, then tenth) under a syncopated right hand, moving from a generated control through a two-hand excerpt to a full rag.
- **Evidence:** the first leap-bearing options are 85-148-bar works at level 6.8 or above. The controls exist but sit on no rung from 5 to 8. School of Ragtime does rung 5's job (syncopation over steady chords) but is placed on rung 6 [R ragtime §3.1, §4; S B ragtime]. The Harlem Rag reading is of the **De Lisle** arrangement (`QmaUQo…`, bars 0-16: oom-pah in bars 1, 2, 4, 5, 9, 10, 12, 13 and the figure in 1, 2, 4, 9, 10, 12) [R ragtime §3.2(d)]. The upgrade wants the **Tyers** edition, which is distinct and stays CANDIDATE until read [U ragtime#1; brief correction 7]. `make_oompah` writes quarter-note pairs where the printed rags write eighths [R ragtime §6].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | P1 placements: `exercise.oompah.c/f.octave` on 5, `.tenth` on 6, `exercise.stride.c` on 7, `exercise.secondary-rag.c.4bar` on 8 (REPAIR, data; placement gate CK-4) | REPAIR | Keep tempo + Ladder |
| MODEL/TRANSFER | Harlem Rag strain A, bars 0-16, bars 1-8 first, from the Tyers edition (IM-1, CANDIDATE; the cut under CK-7; teaching use under CO-5), LH alone then with the app's RH. School of Ragtime added on ragtime.5 and described as what it is (REPAIR). Combination March bars 4-19 is a shipped 4/4 oom-pah excerpt [R ragtime §6] and stays a CANDIDATE fallback | SOURCE-NEEDED | Duet |
| MUSIC | The Entertainer, one strain, on rungs 5 and 6 | EXISTING | Keep tempo |
| INDEPENDENCE | ragtime.9: the whole rag from memory, starting at any strain (`ragtime.9.md:16-33`) | EXISTING | Blind |
- Amended 2026-10-05 from the quarry (R1, MODEL/TRANSFER): State SOURCE-NEEDED -> NEW (an import and a cut; the source has now been read). Mode Duet (the LH alone, then with the app's RH); Keep tempo + Ladder. Artefact: *The Harlem Rag*, Tyers edition, `QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9`: 115 bars, 2/4, 'Moderato', by Turpin, revised and arranged by Tyers. Strain A is bars 5-20 (repeat from bar 5, first ending bar 20, second ending bar 21). The LH alternates bass and chord in eighths in every bar from 5 to 19; the RH plays dyads in straight eighths in the odd bars and a tied-sixteenth syncopation in the even bars. Bars 1-4 are an octave unison introduction and a break, with no oom-pah. **The window becomes bars 5-12 first, then bars 5-20.** Superseded: this block's 'bars 0-16, bars 1-8 first' (MODEL/TRANSFER cell above) and the Evidence sentence reading the De Lisle edition, and the same window in sections 5.1, 5.3 and IM-1; the map's window was read from the De Lisle edition, as the map itself warned. Published definition: ragtime in the broad sense, a syncopated treble over a steady bass, normally in contrasting strains (Library of Congress); 'oom-pah' is the map's word for the bass-chord alternation, a structural claim. Verification boundary: CK-7 and CO-5; IM-1's second-edition comparison now has both CIDs (Tyers, and De Lisle `QmaUQo93TVPNaJ6UDzttTyksRcPDcyafR8Nxct8qXHeEsj`); straight, not swung, is self-checked; no one can judge the feel. Completion: the LH of bars 5-12 at the rung's pass pair in Keep tempo (Duet), then bars 5-20 with the RH. Admission: quarry ADMIT / HIGH-PRIORITY; not imported; IM-1 resolves to this CID and stays CANDIDATE until intake. Public export: not decided; README label unknown, the title metadata dates it 1899, likely eligible [inferred]; the project's composition record decides. Wave unchanged (2.5).

- **Falls through:** CONTROL (the controls sit on rung 9 only) and MODEL/TRANSFER (no level-appropriate two-hand model).
- **Measurement:** MIDI: LH and both-hands accuracy and timing in Keep tempo. Duet measures the chosen hand only, not hands together [M §13]. self-checked: straight, not swung, syncopation, and silent leaps. no actor can judge "played straight" as a feel (unverified as music).
- **Completion:** CT-3 (ragtime.5 is met by runs of measured items).

- SHOULD ragtime#5: Whistling Rufus whole as a build-your-own-oom-pah application; Creole Belles bars 1-16 after its key signature is checked. Disposition: wave 5; would raise A7d.1's INDEPENDENCE before rung 9.
- SHOULD ragtime#8: Stop-time: one passage, or "awareness only". Disposition: wave 5, search or text.
  - Amended 2026-10-05 from the quarry *The Ragtime Dance* `QmXd7HNnNZodQvrybARoZN8NtcZ2LVpJ1Wxbkc8Gq9YJ36` shows the contrast between accented interruption and continuous texture. The label 'stop-time' stays gated until a direct definition is supplied; 'awareness only', taught as the observable contrast, is now possible with a real score. Wave 5.

#### 7e Rock (P3, with P7 for the new units)

#### A7e.1 Reduce a band texture to piano
- **Rows:** rock-metal#3, rock-metal#8. **Priority:** P3 (taught once at Stage 3, never returned to) and P7 (rock.8 by owner decision, upgrade §0.1). **Tracks:** rock-metal; theory.9 (take-down) and chords-pop.9 (arranging) by reference.
- **Capability:** from a supplied score or a recording, take 8-16 bars; find the bass, riff, melody and rhythmic engine; reduce them to melody, bass and one texture; write down what was left out and why.
- **Evidence:** reduction is taught once, at Stage 3, unjudged, on classical and folk substrates [R rock §2A]. There is no rock-idiom piano score in the catalog, and four archive files were rejected [R rock §6]. The learner supplies the source [U rock-metal#3, #8].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | rock.overview's reduction rule on four substrates (Ode, Greensleeves, Scarborough Fair, Canon) | EXISTING | Keep tempo |
| MODEL/TRANSFER | rock.8 step 1 (NEW): reduce eight bars of a score the learner supplies to melody, bass and one texture | NEW | — |
| MUSIC | rock.8 step 2 (NEW): take 8-16 bars down from a recording (bass, riff, melody, engine) by the theory.9 method, decide what survives, play it | NEW | — |
| INDEPENDENCE | The written defence of what was left out, carried into the rock.9 project (A10.2) | SHARED | — |
- Amended 2026-10-05 from the quarry (K1, MODEL/TRANSFER): State NEW -> NEW (an optional supplied source; learner-supplied material stays the public default). Mode: none (paper); a notated and imported reduction is judged on the Score screen against what the learner wrote. Artefact: rock.8 step 1 stays 'a score the learner supplies'. Added: one optional supplied source, *Come As You Are* `QmUZdYocuapo9pjAs7Qbb5JSfhZHyp24Rbm9oZGnWWWq74`, a 26-bar percussion-ensemble arrangement (two grand-staff marimbas, vibraphones, glockenspiel, synth and drums); the opening exposes the riff and later sections turn it into fifths and dyads, block attacks and broken figures; the eight bars to reduce are to be chosen. Published definition: no style claim; the quarry warns against claiming guitar technique from a mallet arrangement. Verification boundary: nothing measures the reduction itself; the outside reviewer chooses the bars; no one can say whether the reduction sounds like the song (unverified as music). Completion: the learner reduces eight bars to melody, bass and one texture, and writes down what was left out. Admission: quarry HIGH-PRIORITY CANDIDATE; not imported. Public export: no; personal library only (label unknown, presumed in copyright [inferred]). The other rock jobs stay distinct: *New Born* and *Starlight* and *Hysteria* belong to SHOULD rock-metal#4 (wave 5); *Iron Man* attaches to no MUST station.

- **Falls through:** MODEL/TRANSFER.
- **Measurement:** MIDI: nothing about an unnotated, learner-supplied reduction. If the learner notates and imports it, the Score screen checks they play what they wrote [M §7a]. self-checked: what survives and what was omitted. no actor can say whether the reduction sounds like the song (no audio in the app; unverified as music).
- **Completion:** CT-2 (rock.8 is a learner's-word rung: text only, with learner material).

- SHOULD rock-metal#4: Register and density get a control; rock.7's required run becomes an excerpt. Disposition: wave 5, data and text.
  - Amended 2026-10-05 from the quarry *Starlight* and *Hysteria* (with *New Born*) are the candidate excerpts. Wave 5.
- SHOULD rock-metal#5: Greensleeves refit stated (3/4, A minor). Disposition: wave 5, text.
- SHOULD rock-metal#6: Sus-chord framings reconciled. Disposition: wave 5, text.
- SHOULD rock-metal#7: Syncopated chord attacks and an off-beat rock comping pattern. Disposition: source-blocked (G16 needs printed pattern evidence).
  - Amended 2026-10-05 from the quarry Not moved. The 'repeated offbeat chord figures' of *A Little Piece of Heaven* have no bars and no published definition; G16 stays source-blocked.
  - Consumed 2026-10-05 from SOURCE-CHECK-technique-hymns-rock §Rock / blues keyboard progression: the category (modern-rock comping, arpeggiated and repeated parts) is supported; the row's exact claim, an off-beat syncopated chord pattern, is not. G16 stays source-blocked on a printed pattern, and the check authorises no onset contract.
- SHOULD rock-metal#10: Half-time and 6/8 feel, click and recording, low doublings promised by D8. Disposition: wave 5, text or struck from D8.

#### 7f Classical interpretation (P4 and P5)

#### A7f.1 Use the technique stations inside the classical repertoire
- **Rows:** classical#3. **Priority:** P4. **Tracks:** classical, using the technique track's measured exercises.
- **Capability:** before a classical rung's articulation, voicing, half-pedal or 2:3 demand, drill it with the technique track's exercise, then carry it into the piece.
- **Evidence:** classical.4 prescribes articulation, while the articulation exercises sit on technique.4 and hymns.4 and are not pointed to [R classical §4.5]. The interpretive controls are mounted on technique.4-7 [R classical §6]. Voicing is split, with half on technique.6 and half on classical.6 [R technique §4.5].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | technique.4 articulation, technique.6 voicing (ratio 1.4), technique.7 half pedal (CC64 32-96) and 2:3 | SHARED | Keep tempo |
| MODEL/TRANSFER | Three cross-reference sentences at classical.4, 6 and 8 (REPAIR) | REPAIR | Keep tempo |
| MUSIC | The classical.4-8 repertoire | EXISTING | Keep tempo |
| INDEPENDENCE | classical.7: choose an articulation for each voice (`classical.7.md:25`) | EXISTING | — |

- **Falls through:** MODEL/TRANSFER (the pointer is missing).
- **Measurement:** MIDI: the technique items' own measures (note length, voicing velocity ratio, CC64 share), which gate no rung: `measure` has 0 shipped requirements [M R7]. self-checked: applying the touch in the piece. no actor can judge tone or balance as music.
- **Completion:** CT-3 (the rungs' song runs measure the pieces; nothing changes).

#### A7f.2 Play an étude at its written tempo
- **Rows:** classical#2. **Priority:** P5 (bad or missing primary material for a stated success line). **Tracks:** classical; technique supplies the control.
- **Capability:** meet classical.8's success line: one étude at its written tempo without the skill it teaches breaking down.
- **Evidence:** none of rung 8's six options is an étude. The Library holds Czerny Op. 299 (5.8-7.5), Bertini Op. 29, and Chopin Op. 10 No. 6 and Op. 25 Nos. 1 and 9 [R classical §3.2].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | technique.6-7 Czerny studies; technique.8 scales | SHARED | Ladder |
| MODEL/TRANSFER | One shipped étude within rung 8's band on its options (Czerny Op. 299 at 6.9-7.5, or Op. 25 No. 9 at 8.8), behind the placement gate CK-4; or the success line reworded to "an étude from the Library" (REPAIR) | REPAIR | Ladder |
| MUSIC | The étude itself at tempo | NO-SEPARATE-ARTIFACT | Keep tempo |
| INDEPENDENCE | "Name the problem before you start" (`classical.8.md:18-19`) | EXISTING | — |

The MUSIC station needs no artefact: an étude is both the model and the music.

- **Falls through:** MODEL/TRANSFER.
- **Measurement:** MIDI: accuracy at the tempo percentage in Keep tempo. The Ladder's climb within a sitting is not stored [M §12]. self-checked: "without the skill breaking down". no actor can judge the musical result.
- **Completion:** CT-3.

- SHOULD classical#6: Phrase and cadence shaping carried past rung 3. Disposition: wave 5, text at classical.6.
- SHOULD classical#7: Romantic and Impressionist pedal colour, half pedal. Disposition: wave 5, text referring to technique.7.

#### 7g Hymns and spirituals (P6 and P4)

#### A7g.1 Accompany a singer
- **Rows:** hymns-gospel#5. **Priority:** P6. **Tracks:** hymns-gospel (renamed, W14); holiday.3 and chords-pop.8 supply the methods. [D-gate] The narrowed promise still says "accompany" [U hymns-gospel#5].
- **Capability:** choose a key for the singer, count in or play an intro from the last line, keep a steady singing tempo, and play one hymn in a second key.
- **Evidence:** no hymns lesson teaches a key for a singer, a count-in or a tempo for voices, and transposition is absent [R hymns §3.2-3.3]. holiday.3 states the principles and sets no task [R holiday §2.2].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | holiday.3's cadence in C, G and F, and its intro-from-the-last-line principle; chords-pop.8's transposition | SHARED | Theory drills |
| MODEL/TRANSFER | hymns.5 task (NEW): a lead-sheet hymn (What a Friend, 32 symbols) at a singing tempo, counted in and introduced from its last line | NEW | Chord chart |
| MUSIC | The same hymn in a second key chosen for a stated range (NEW task). No transpose control exists [M §15] | NEW | — |
| INDEPENDENCE | holiday.3's room accompaniment, including recovery when singers skip (holiday#3, SHOULD) | SHARED | — |
- Amended 2026-10-05 from the quarry (H1, hymns.2 material): see the W14 amendment in section 2.0; no change to this block's states. The quarry's Dykes *Holy, Holy, Holy* `QmWyFckvyoMiNLFawUiRMTeH2USzFHijjt8TdEWbTRDQ7N` repairs no MUST station here (this MODEL is a lead-sheet task) and is two separate single-staff parts, which raises the same intake question as D1.

- **Falls through:** MODEL/TRANSFER.
- **Measurement:** MIDI: nothing about singing. The chart's live cell is unstored [M §15]. self-checked: the tempo, the key, the count-in. no actor is present as a singer and nobody here hears, so whether a singer is supported cannot be decided.
- **Completion:** CT-1 (hymns.5's song run measures playing the hymn, not accompanying).
- Consumed 2026-10-05 from SOURCE-CHECK-parallel: not covered, gate stays. The hymn-specific sources were not read by the parallel check.
- Consumed 2026-10-05 from SOURCE-CHECK-technique-hymns-rock §Hymns / gospel (Berklee Online *Gospel Music for Keyboard*, OPIAN-410): source-checked 2026-10-05 (technique-hymns-rock): confirmed with a sequencing boundary. Gate lifted on this block for one proposition only: accompanying a singer (ear-led backing of a singer, hymns, traditional cadences) is part of hymn and gospel keyboard competence that grows beyond melody plus block chords. The course is advanced and lists scales, chords, jazz piano and blues or rock keyboard as prerequisites, so it supports the endpoint of the ladder and nothing from it loads the beginner hymn rungs or this block's tasks. Still local and unsupported by it: choosing a key for a singer, the count-in, the singing tempo and the second-key task; the vamp between verses (holiday.3 SHOULD) stays gated. The owner's narrowing to Hymns & spirituals stands, and the gospel-rungs REJECT row stays by that decision. The token above stays for the count script; the lift is carried here.

#### A7g.2 Decorate a hymn where the decoration is taught
- **Rows:** hymns-gospel#4. **Priority:** P4. **Tracks:** hymns-gospel.
- **Capability:** practise the walk-up, the passing chord and the plagal close on the rung that first asks for them.
- **Evidence:** Stage 3 introduces the devices, and their drills appear only at Stage 5. Twelve plagal items exist, none on Stage 3 [R hymns §2.3, §4.1; A P5].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | P5: `exercise.walkup.c`, `exercise.passing-chord.c` and `exercise.cadence.c.plagal` on the stage-3 hymns unit (REPAIR, data; placement gate CK-4) | REPAIR | Keep tempo |
| MODEL/TRANSFER | What a Friend, Just a Closer Walk (a written bass walk), This Little Light | EXISTING | Keep tempo |
| MUSIC | hymns.5's exit: plain, then with the bass walking into two changes (`hymns.5.md:57-60`) | EXISTING | — |
| INDEPENDENCE | hymns.5: the learner chooses which changes to decorate | EXISTING | — |
- Amended 2026-10-05 from the quarry (H1, hymns.2 material): see the W14 amendment in section 2.0; no change to this block's states. The hymns record already lists shipped written four-voice settings (Amazing Grace SATB, Abide with Me, Rock of Ages); *Deep River* `QmbP96wZt5Vev9pA8pembvkaMw2wx48M3PR3pWNMfJuASp` repairs no MUST station here. Choosing among hymns is by gap, not by volume.

- **Falls through:** CONTROL.
- **Measurement:** MIDI: the written studies in Keep tempo. self-checked: decorating the hymn. no actor can judge the sound (unverified as music).
- **Completion:** CT-3.

- SHOULD hymns-gospel#6: Build one arrangement yourself from a lead sheet (hymns.6 exit). Disposition: wave 5, text.
- SHOULD hymns-gospel#9: The passing-chord definition acknowledges the dominant-chain usage. Disposition: wave 5, text.

#### 7h Holiday (no MUST ability; corrections in W15)

- SHOULD holiday#3: Vamp or turnaround between verses; recovery when singers skip; simplify on the fly. Disposition: wave 5; the P4 intro items wait for the `intro` family read [A P4].
- SHOULD holiday#4: Choosing key and range as a practised task. Disposition: wave 5; uses A2.1 and A7g.1.
- SHOULD holiday#5: Description widened to Stages 5-7. Disposition: wave 5, data.
- SHOULD holiday#6: Hanukkah pieces: remove from D8 or add to the Library. Disposition: wave 5, docs (the spec serves the code).
  - Amended 2026-10-05 from the quarry (D1, MUSIC (Library)): State: the 'remove or add' disposition becomes add after intake (candidates; wave 5). 7h has no MUST block. Mode Keep tempo, after intake. Artefact: *Maoz Tzur* `QmSe5SBzVY7xuqiqbPmyNF9tcMb5LBNnWUfnKbYung75mY`, 18 bars in three single-staff parts (S, A and T), not SATB, so making it playable at the keyboard is itself the arranging task; *Dreidel Song*, Lowe arrangement, `QmaA1mDoFknzx5s2Es9zchiUMGo8QRF1y2CiN4MmoyNs9Q`, 9 bars, an ensemble with a grand-staff piano giving bass-and-chord support. Published definition: none. Verification boundary: it is not established whether the Score screen can run a three-part single-staff score as a two-hand item; intake answers that; the arrangement is self-checked. Completion: the learner plays the *Dreidel Song* piano part and arranges *Maoz Tzur*'s three voices for two hands. Admission: *Maoz Tzur* ADMIT / HIGH-PRIORITY, *Dreidel Song* ADMIT / KEEP CANDIDATE; neither imported (IM-14). Public export: not decided; *Maoz Tzur* licence `publicdomain`, *Dreidel Song* `cc-zero`, label unknown for both; a rights record is needed.

### 2.8 Cluster 8 — Rhythm, pulse and metre (P3)

#### A8.1 Feel and show the pulse, say two or three time, echo a rhythm
- **Rows:** core#6. **Priority:** P3 (named in placement, never taught). **Tracks:** core (owner); jam's count-in (A4.2) and theory.3 recur. [D-gate] ABRSM Grade 1 aural.
- **Capability:** at Stages 1-2, clap the pulse of a heard piece, say whether it moves in two or three, and clap back a short rhythm.
- **Evidence:** no clap, echo or sing appears in the 27 core lessons, though placement item 2 asks for a clap-back [R core §3.3]. Keep tempo supplies the clock and cannot show an unaided pulse [M §2]. "Rhythm dictation" shows the rhythm on the card [M §23]. Play it to me records nothing [M §3].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | 1.2 task (NEW): clap the pulse while the app plays a known piece | NEW | Play it to me |
| MODEL/TRANSFER | 1.4 or 2.4 task (NEW): two-or-three-time listening on shipped 4/4 and 3/4 pieces; a two-bar clap echo at 2.2, self-checked | NEW | Play it to me |
| MUSIC | The pulse carries every Keep tempo piece | NO-SEPARATE-ARTIFACT | Keep tempo |
| INDEPENDENCE | Counting yourself in before playing: A4.2's count-in at three tempos | SHARED | — |

The MUSIC station needs no artefact: every piece already uses the pulse, and a separate pulse piece would add nothing a mode could measure.

- **Falls through:** CONTROL (nothing in Stages 0-2).
- **Measurement:** MIDI: no mode reads an unaided pulse or a heard-rhythm echo [M §2, §23]. self-checked: all of it, and the lesson says so. no actor can observe a clap.
- **Completion:** CT-1.

- SHOULD theory-ear#9: Existing rhythm rows (eighths, dotted, six-eight) on theory.4/5. Disposition: wave 5, data; they stay read-and-tap drills [A P3].
- SHOULD blues-boogie#6: Shuffle versus straight versus 12/8 slow blues, said once. Disposition: wave 5, text; [D] Berklee.
  - Consumed 2026-10-05 from SOURCE-CHECK-technique-hymns-rock §Rock / blues keyboard progression: still gated. OPIAN-220 names shuffle bass but does not establish the shuffle, straight and 12/8 slow-blues distinction.
- SHOULD ragtime#7: A 16th-8th-16th rhythm control. Disposition: wave 5; G8 with its near-misses [A].
- Consumed 2026-10-05 from SOURCE-CHECK-parallel: not covered, gate stays. This rests on ABRSM Grade 1 aural; ABRSM was not read by the parallel check.

### 2.9 Cluster 9 — Technique foundations (P4)

#### A9.1 Practise each listed technical exercise with instruction and a stop condition
- **Rows:** technique#2, technique#3. **Priority:** P4 (controlled practice without instruction; safety by omission). **Tracks:** technique; classical supplies MUSIC.
- **Capability:** every exercise on a technique rung has a sentence saying what it trains, and every rung says when to stop.
- **Evidence:** a stop or tension condition exists on one rung of five (technique.8:31-33) [R technique §3.1]. 7/8, sixteenth syncopation, the chromatic scale, tremolo and Hanon 11 are listed with no sentence [R technique §3.4]. Any two exercises pass a rung [R technique §4.2].

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | The listed exercises with one sentence each, or removed from the rung (REPAIR, text or data) | REPAIR | Keep tempo |
| MODEL/TRANSFER | The technique.4-7 études (Lemoine, Duvernoy, Czerny), with transfer claims corrected by W5 | EXISTING | Keep tempo |
| MUSIC | The classical.4-8 repertoire, by design [R technique §2] | SHARED | Keep tempo |
| INDEPENDENCE | A stop and tension condition on technique.4-7, pointing to practice.4 and 4.4; for technique.7, "if the forearm or wrist tightens or aches, stop" (REPAIR) | REPAIR | — |

- **Falls through:** CONTROL (exercises without instruction) and INDEPENDENCE (no stop condition).
- **Measurement:** MIDI: exercise accuracy and tempo; the technique measures are computed and gate nothing [M R7]. self-checked: tension and ache. no actor can observe the body.
- **Completion:** CT-1 (any two exercises pass; the page says which exercises carry the rung's promise; the technique#10 SHOULD row would tie the requirement to the promise).

- SHOULD technique#6: Each physical topic gets a demonstration, cue, self-check, stop and transfer. Disposition: wave 5; videos cannot be read here.
- SHOULD technique#7: Voicing cross-reference to classical.6; relaxation pointer to practice.4. Disposition: wave 5, text.
- SHOULD technique#10: Rung requirement tied to the rung's promise. Disposition: wave 5, data.

### 2.10 Cluster 10 — Advanced integration: capstones and projects (P7)

#### A10.1 Take one jazz standard through every role
- **Rows:** jazz#3, jazz#4. **Priority:** P7 (the soloing promise is kept, upgrade §0.1). **Tracks:** jazz; chords-pop.9 (intros and endings), core 4.7 (memory), improv.6 by reference.
- **Capability:** with one standard, learn and memorise it (form, landmarks, start from the bridge), comp, walk or two-feel, play a chord-tone chorus, add an intro and an ending, and play a solo-piano pass with a harmonised melody.
- **Evidence:** jazz.9 is four accompaniment passes [R jazz §3.8]. Three of the six options print no symbols (Stardust, Ain't Misbehavin', Saints jazz: 0 each) [R jazz §6]. "Comp it" is the first instruction [R jazz §4.3]. Conflict C7 (§8.1): the solo-piano pass is part of this MUST at the harmonised-melody level.

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | jazz.5-8 controls (shells, comping rhythms, walking, rootless) | EXISTING | Keep tempo |
| MODEL/TRANSFER | Say which options carry a chart (Take Five, Lullaby of Birdland, Linus and Lucy) and how to derive harmony for the others (the `chords-pop.9.md:30` move) (REPAIR) | REPAIR | Chord chart |
| MUSIC | jazz.9 rewritten as one arc on one standard (REPAIR): comp, walk, A7b.2's chorus, intro and ending by reference to chords-pop.9, a solo-piano pass with a harmonised melody | REPAIR | Chord chart |
| INDEPENDENCE | Memorise and start from several points (core 4.7's method), then play in a key not practised (`jazz.9.md:54-55`) | SHARED | Blind |
- Amended 2026-10-05 from the quarry (J2, MODEL/TRANSFER): State REPAIR -> REPAIR. Mode Chord chart. Artefact: the REPAIR sentence about which jazz.9 options carry a chart adds *There Will Never Be Another You* `QmY7mQ3qBC5FhfJpQaqZQzTU4RFzkkDwGaahU5z9BNKrkQ` (33 bars, 39 symbols) and *After You've Gone* after intake; Take Five, Lullaby of Birdland and Linus and Lucy stay as before. Published definition: none. Verification boundary: a script can confirm after intake that `chordCount > 0`, which is what draws the Chart door; rights decide whether a chart is in the public build. Completion: the learner opens the chosen standard in the chord chart from the rung. Admission: both ADMIT in the quarry; not imported (IM-10, IM-11). Public export: no for *There Will Never Be Another You* until a rights record exists (presumed in copyright [inferred], label unknown); *After You've Gone* as in the A7b.2 line.
- Amended 2026-10-05 from the quarry (J3, MUSIC): State REPAIR -> REPAIR. Mode Chord chart. Artefact: jazz.9's one standard is *There Will Never Be Another You*: melody, shells, bass, solo, intro and ending, then a solo-piano realisation; the harmonised-melody pass takes the shipped *Fly Me to the Moon* (`QmS2enG17nJVrbMvvCcHDW9wAN8nLSV1CPMmtghD7SZFVQ`, `song.jazz.bart-howard-fly-me-to-the-moon.pdmx`) as its voicing model (not evidence for minor ii-V-i). If *There Will Never Be Another You* cannot ship publicly, the public-build fallback is *After You've Gone*, and jazz.9 faces the same open public-build question as latin.8 (section 8.6 item 4). Verification boundary: live cell unstored; each role self-checked; no one can judge the performance. Completion: one arc on one standard: comp, walk, a chord-tone chorus, intro and ending, a harmonised-melody pass. Admission: *There Will Never Be Another You* ADMIT in the quarry, a substrate candidate until intake (IM-11, rights); *Fly Me* shipped. Public export: no for the standard until a rights record exists. Superseded in part: the MUSIC cell's unnamed 'one standard' is now named.
- Amended 2026-10-05 from the quarry (J4, INDEPENDENCE): State SHARED -> SHARED. Artefact: memorise the standard, start it from several points, then play it in a key not practised, on the open chart of *There Will Never Be Another You*, never on a finished arrangement. Verification boundary: a Blind run looks the same as a sighted one; self-checked. Completion: as in the map. Admission and public export as J3.

- **Falls through:** MUSIC (no integrated arc; soloing absent).
- **Measurement:** MIDI: the written controls. The chart's live cell (≥60 % of the chord's pitch classes) is unstored [M §15]. A Blind run looks the same as a sighted one [M §10]. self-checked: each role on the standard. no actor can judge the performance as music.
- **Completion:** CT-1 (jazz.9 is met by one exercise run [R jazz §6]).

#### A10.2 Arrange a full song for piano: from a chart, from a finished arrangement, or from a recording
- **Rows:** chords-pop#2, rock-metal#9. **Priority:** P7 (rock.9 by owner decision). **Tracks:** chords-pop.9 (pop owner), rock.9; classical.9's project method by reference.
- **Capability:** start chords-pop.9 from either a bare chart or a finished arrangement to reverse-engineer. Build a personal arrangement project in rock.9 with a section map, textures by section, build and drop, memory and a recording.
- **Evidence:** the six chords-pop.9 models are finished outputs with zero symbols, and the two starts are never named [R chords-pop §8.2]. A personal modern-song project is absent [R rock §3]. The upgrade's §0.1 decision.

| Station | Supply | State | Mode |
| --- | --- | --- | --- |
| CONTROL | chords-pop.3-7 vocabulary: chart reading, LH rhythms, slash bass, sevenths, colour | EXISTING | Chord chart |
| MODEL/TRANSFER | chords-pop.9 names its two starts (REPAIR): Tom Dooley's pencilled chart (chords-pop.3) as the chart-first example; the six arrangements to reverse-engineer | REPAIR | Play it to me |
| MUSIC | rock.9 project (NEW rung, text): section map, textures by section, build and drop, memory, a recording | NEW | Perform |
| INDEPENDENCE | rock.9's written defence of every omission, and the song chosen by the learner | NEW | — |
- Amended 2026-10-05 from the quarry (K2, MUSIC): State NEW -> NEW (optional supplied capstones). Mode Perform. Artefact: the learner's own song stays the default, because INDEPENDENCE is the song chosen by the learner. Optional supplied capstones: *Enter Sandman* `QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo`, a 148-bar two-staff piano reduction for pedal, riff and build; and *A Little Piece of Heaven* `QmbwnWBK5FE51CVpqjZ4fSQW87SX1MNzehooGRbNPDrkfm`, a 206-bar mixed score in 4/4, 2/4, 6/4, 3/4 and 5/4. Published definition: none. Verification boundary: Perform records one take; the arrangement decisions are self-checked; no one can judge the arrangement. Completion: as in the map. Admission: both quarry HIGH-PRIORITY CANDIDATES; neither imported. Public export: no for both; personal library only (presumed in copyright [inferred]).
- Consumed 2026-10-05 from FAMILIAR-SONG-VERDICT (MODEL/TRANSFER, the finished-arrangement start): State REPAIR -> REPAIR (one candidate added, not admitted). Mode Play it to me. Artefact: *Your Song*, easy piano `QmcZnZByDzCDxRpXJfSGsPqDP9reRxzqpwmcxs3HR82kHc`, 38 bars in F, two-staff, no chord symbols: the melody plainly exposed in the right hand over a slow half-note then whole-note chordal left hand. Job: an accessible full-piece option for melody over chordal accompaniment; later the learner simplifies or revoices the left hand rather than copying it, which is the reverse-engineering start this station names. State: CANDIDATE (the intake gate of the packet's section 13 not yet run); personal-library admission possible; curriculum admission by a later brief. Quarry folder: XML `docs/review/familiar-song-pass-2026-10-05/xml/your-song-QmcZnZByDzCDxRpXJfSGsPqDP9reRxzqpwmcxs3HR82kHc.musicxml`, summary `docs/review/familiar-song-pass-2026-10-05/summary/your-song-QmcZnZByDzCDxRpXJfSGsPqDP9reRxzqpwmcxs3HR82kHc.txt`; verdict `docs/review/pdmx-quarry-2026-10-05/FAMILIAR-SONG-VERDICT.md`. Not the 127-bar fuller arrangement. The revoicing is self-checked; no one in this process can judge it as music (unverified as music).
- Consumed 2026-10-05 from FAMILIAR-SONG-VERDICT (MUSIC, a later optional transfer): State NEW -> NEW (optional; the learner's own song stays the default). Mode Perform. Artefact: *Someone Like You*, easy piano `QmXPbpPc6BkSripAS5CUxqoLiXoaaSrG7w3D3s9Zwzfcm2`, 73 bars, A major (three sharps), 101 chord symbols, a 2/4 bar: a persistent left-hand arpeggiated-sixteenth pattern (A, C#, E, C# then chord-specific shapes) under the right-hand melody, with the texture expanding later, so it shows an accompaniment engine surviving while the arrangement gets denser. Job: a later optional transfer piece for arpeggiated-accompaniment continuity and texture building; not an early level despite the title 'easy piano' (constant sixteenths and a three-sharp key make it a later task than *Your Song*). State: CANDIDATE (the intake gate of the packet's section 13 not yet run); personal-library admission possible; curriculum admission by a later brief. Quarry folder: XML `docs/review/familiar-song-pass-2026-10-05/xml/someone-like-you-QmXPbpPc6BkSripAS5CUxqoLiXoaaSrG7w3D3s9Zwzfcm2.musicxml`, summary `docs/review/familiar-song-pass-2026-10-05/summary/someone-like-you-QmXPbpPc6BkSripAS5CUxqoLiXoaaSrG7w3D3s9Zwzfcm2.txt`; verdict `docs/review/pdmx-quarry-2026-10-05/FAMILIAR-SONG-VERDICT.md`. Not the 80-bar voice-plus-piano edition. No one in this process can judge the pattern's evenness as music (unverified as music).

- **Falls through:** MODEL/TRANSFER (chords-pop.9) and MUSIC (rock has no project).
- **Measurement:** MIDI: a flagged take of anything the learner notates and imports [M §9, §7a]. self-checked: the arrangement decisions. no actor can judge the arrangement as music.
- **Completion:** CT-1 for chords-pop.9 (met by one exercise run; the arrangement is never run [R chords-pop §6]). CT-2 for rock.9.

- SHOULD jazz#8: Solo-piano arranging technique (harmonised melody; drop-2 later). Disposition: the harmonised-melody level is folded into A10.1's MUSIC station (C7); drop-2 stays NICE, G7 only if accepted, and is not gated on the provisional `seventh_voicing` merge.

### 2.11 Cluster 11 — Practice method and score study (SHOULD only)

No MUST ability. practice#1 is W3; practice#2 and practice#4 are built in A4.1.
- SHOULD core#9: Score-study routine (owner core 4.6). Disposition: wave 5, one paragraph. It is the INDEPENDENCE station that A1.1 and A5.1 share (§4).
- SHOULD classical#5: Score-study routine deepened at classical.6 (cadences, texture, edition). Disposition: wave 5, one paragraph.
- SHOULD practice#3: Soften "never a page"; transposition how-to at practice.5. Disposition: wave 1(b) carries the transposition clause (it points to A2.1); "never a page" goes in wave 5.

---

## 3. Mode responsibility per cluster

### 3.0 Vocabulary and the distinct honest purposes

Canonical names, one per mode-sheet block: Wait for me (§1), Keep tempo (§2), Play it to me (§3), Score Free play (§4), Free play, meaning the standalone screen (§5), Simon (§6), Lab: Read it (§7a), Lab: Jam it, meaning Bed only (§7b), Lab: Hold the chords (§7b), Lab: Play the tune (§7b), Trading fours (§8), Perform (§9), Blind (§10), Loop (§11), Ladder (§12), Duet (§13), Rhythm only (§14), Chord chart (§15), Daily sight-read (§16), Note flash (§17), Find the key (§18), Ear: interval / chord (§19), Ear: cadence / progression (§20), Melodic dictation, which includes "Answer the phrase" (§21), Harmonic dictation (§22), Rhythm drill, which includes "Rhythm dictation" (§23), Tune playback (§24), Theory drills, meaning chord, inversion, extended, roman numeral, chord-scale, modes and transposition (§25), Pedal / dynamics (§26), Backing track (§27), Paper (§28), Checklist (§29), Metronome and PDF viewer (§30).

The five modes the packet requires to have distinct honest purposes (packet §3, Blocker 3; brief correction 11):
- **Simon** reproduces a heard pitch chain exactly, held in short-term memory. It is used only on a help level without lit keys: on "Keys shown" the chain can be copied from the lights, and the row does not store the help level [M §6]. It establishes neither structural repertoire memory nor harmonisation. Used for: A3.1 CONTROL.
- **The Lab (Read it)** practises a written accompaniment pattern the generator wrote; the Score screen judges it as an import that counts toward no rung [M §7a]. No MUST station needs it; it stays the place for practising a written accompaniment pattern.
- **Jam (the Lab's Jam it: Bed only, Hold the chords, Play the tune)** plays against a running time and harmony frame on the same screen, a different activity from Read it. Nothing is stored, and the chord tones are lit, so it never tests choice [M §7b, §32.3]. Used for: A4.2 MODEL and INDEPENDENCE (re-entry while the bed runs), A6.1 MUSIC, A7b.2 CONTROL and MODEL.
- **Trading fours (inside Jam it)** checks coming in on your own bars after a call. It gives entry and scale-membership feedback only, never relation to the call or to style [M §8]. Used for: A4.2 INDEPENDENCE.
- **Free play (standalone)** shows the notes and the chord being held: a readout, not a verdict, and it records nothing [M §5]. Used for: A2.1, A3.1 and A6.1, wherever the learner needs to check a chord they found.
- **Perform** is one uninterrupted, flagged take. It establishes neither recovery, nor landmark choice, nor memory, nor an audience [M §9]. Used for: A1.1 MUSIC, A4.1 MUSIC and INDEPENDENCE, A7c.4 MUSIC, A10.2 MUSIC.
- And **Blind** hides the notation only. The row is not marked blind, and the keys guide still lights the next key unless switched off [M §10]. Used for: A2.1 CONTROL and MODEL (the second-key check), A4.1 MODEL, A7d.1 INDEPENDENCE, A10.1 INDEPENDENCE.

Two modes this map never asks to measure what they cannot: **Wait for me** meets no rung and establishes no tempo [M §1, §32.1], so no station relies on it. **Backing track** is never judged [M §27].

### 3.1 Cluster 1 — reading

| Station | Mode | Why this mode, not another | Measures honestly |
| --- | --- | --- | --- |
| A1.1 CONTROL | Note flash | The only drill that reads a single sign to a key. Repeat routes have no drill, so they stay a text task | staff position to pitch class, if the item writes naturals (unchecked) |
| A1.1 MODEL | Keep tempo | Wait establishes no tempo [M §1]; Keep tempo plays the unrolled route | the route's notes in time; not fermata length |
| A1.1 MUSIC | Perform | The capstone's one-pass take | a take's accuracy and timing |
| A1.2 CONTROL | Note flash | Accidental reading in isolation | pitch class from staff |
| A1.2 MODEL | Keep tempo | Reading a printed signature in a piece | notes in time |
| A1.2 MUSIC | Keep tempo | Repertoire runs | notes in time |
| A1.2 INDEPENDENCE | Daily sight-read | Unseen first attempt is the only reading evidence the ladder takes [M R2, §16] | pitch and time per demand on an unseen phrase |

### 3.2 Cluster 2 — transposition

| Station | Mode | Why | Measures honestly |
| --- | --- | --- | --- |
| A2.1 CONTROL | Blind | Hides the second-key copy while the app judges against it; no transposition mode exists at Stage 1 (the drill is level 6.3) | the second-key notes; not that the page was hidden |
| A2.1 MODEL | Blind + Theory drills | The chord drill produces I-IV-V7 in a named key | chord sets; tune notes against the hidden copy |
| A2.1 INDEPENDENCE | Free play | No printed copy exists for the chosen key; Free play names what is held | a readout only |
| A2.1 MUSIC | — | The chart has no transpose control [M §15] | self-checked |

### 3.3 Cluster 3 — ear production

| Station | Mode | Why | Measures honestly |
| --- | --- | --- | --- |
| A3.1 CONTROL | Simon + Harmonic dictation | Simon holds a heard line; harmonic dictation turns a heard progression into chords. Tune playback is generated and rhythmless [M §24] | exact chain; chord sets in order |
| A3.1 MODEL | Play it to me | The only way to hear a shipped song without reading it | nothing; self-checked against the printed symbols afterwards |
| A3.1 INDEPENDENCE | Free play | Checks each chord found on the learner's own song | a readout only |

### 3.4 Cluster 4 — performance, memory, recovery

| Station | Mode | Why | Measures honestly |
| --- | --- | --- | --- |
| A4.1 CONTROL | Keep tempo | A cold run's row shows hot-spot bars [M §2] | where accuracy dropped |
| A4.1 MODEL | Blind | 4.7's start-anywhere method with the page hidden | notes; not that it was blind or from memory |
| A4.1 MUSIC, INDEPENDENCE | Perform | One flagged pass | a take; not recovery [M §9] |
| A4.2 CONTROL, MUSIC | Chord chart | Count off, tempo field and bar tracker [M §15] | nothing stored |
| A4.2 MODEL | Lab: Jam it | The bed runs on when the learner stops: the condition the protocol needs | nothing stored |
| A4.2 INDEPENDENCE | Lab: Jam it + Trading fours | Trading fours is the app's only entry signal | first note inside one's own bars, unstored |

### 3.5 Cluster 5 — practical harmony

| Station | Mode | Why | Measures honestly |
| --- | --- | --- | --- |
| A5.1 CONTROL | Ear: cadence / progression + Harmonic dictation | The existing rung drills | echo of generated chords; no naming |
| A5.1 MODEL | Play it to me | Hear the cadence in the piece, then find it on the page | nothing; self-checked |
| A5.1 MUSIC | Keep tempo | The pieces' own rungs | notes in time |

### 3.6 Cluster 6 — improvisation and composition

| Station | Mode | Why | Measures honestly |
| --- | --- | --- | --- |
| A6.1 CONTROL | Free play | Names the chord held under a melody note | a readout only |
| A6.1 MODEL | Chord chart | Shows the printed symbols after the learner's own attempt | live cell ≥60 %, unstored |
| A6.1 MUSIC | Lab: Hold the chords | The learner's typed progression under their own melody | in-scale count, unstored; tones lit |
| A6.2 MUSIC | Play it to me | Hear what was written, after import | nothing |

### 3.7 Cluster 7 — style vocabulary

| Station | Mode | Why | Measures honestly |
| --- | --- | --- | --- |
| A7a.1 CONTROL | Keep tempo + Duet | The LH figure measured; Duet keeps the RH context | chosen hand's notes and timing |
| A7a.1 MODEL, MUSIC | Chord chart | Comp and Bass + drums off leave a click and the form tracker. The lab's bed always has a bass [R jam §4.4]. Metronome is the fallback (§6, wave 1(c)) | nothing stored |
| A7a.2 CONTROL | Theory drills | The chord drill plays named sevenths | chord sets |
| A7a.2 MODEL | Keep tempo | Written bars 11-12, once read | notes in time |
| A7a.2, A7a.3 MUSIC | Chord chart | As A7a.1 | nothing stored |
| A7a.3 CONTROL, MODEL | Keep tempo | Written items | notes in time |
| A7b.1 CONTROL | Theory drills | The shell drill once fixed | expected sets (CK-6) |
| A7b.1 MODEL; MUSIC | Keep tempo; Chord chart | Printed tune; its chart | notes; live cell |
| A7b.2 CONTROL, MODEL | Lab: Hold the chords | A line over the app's ii-V-I. Trading fours ignores the call and cannot judge style [M §8] | in-scale count, unstored |
| A7b.2 MUSIC | Chord chart | The standard's chart | live cell |
| A7c.1 CONTROL | Rhythm only + Keep tempo | Tap the cell first, then play it | onsets within ±150 ms (cannot resolve the cell's identity at speed) |
| A7c.1 MODEL, MUSIC | Keep tempo | Printed models | notes in time |
| A7c.2 CONTROL | Keep tempo | Written figures | notes in time |
| A7c.2, A7c.3 MODEL and MUSIC | Chord chart | Lead sheets with symbols and Count off | live cell (no verdict for a tumbao) |
| A7c.3 CONTROL | Keep tempo | The written pattern, once sourced | notes in time |
| A7c.4 CONTROL; MODEL; MUSIC | Loop + Ladder; Keep tempo; Perform | Repetition of the ostinato bars; the excerpt; the project take | lap accuracy and tempo; notes; take |
| A7d.1 CONTROL | Keep tempo + Ladder | Measured placed controls | notes, timing, tempo within a sitting |
| A7d.1 MODEL | Duet | LH or duet excerpt [U ragtime#1] | chosen hand only |
| A7d.1 MUSIC; INDEPENDENCE | Keep tempo; Blind | The Entertainer; ragtime.9 from memory | notes; not that it was blind |
| A7e.1 CONTROL | Keep tempo | Substrates of the reduction rule | notes in time |
| A7f.1 CONTROL, MODEL, MUSIC | Keep tempo | Technique items carry their own measures | measures that gate nothing [M R7] |
| A7f.2 CONTROL, MODEL; MUSIC | Ladder; Keep tempo | Tempo built by clean passes; the étude at tempo | tempo in a sitting; accuracy at tempo |
| A7g.1 CONTROL | Theory drills | Cadences in several keys | chord sets |
| A7g.1 MODEL | Chord chart | Count off at a singing tempo | nothing stored |
| A7g.2 CONTROL, MODEL | Keep tempo | Written studies and hymns | notes in time |

### 3.8 Cluster 8 — rhythm

| Station | Mode | Why | Measures honestly |
| --- | --- | --- | --- |
| A8.1 CONTROL, MODEL | Play it to me | The app supplies the music; the learner supplies the pulse. Keep tempo would supply the pulse too [M §2] | nothing; self-checked |
| A8.1 MUSIC | Keep tempo | Every piece | notes against the app's clock |

### 3.9 Cluster 9 — technique

| Station | Mode | Why | Measures honestly |
| --- | --- | --- | --- |
| A9.1 CONTROL, MODEL, MUSIC | Keep tempo | Measured exercises and études | accuracy and tempo; technique measures gate nothing |

### 3.10 Cluster 10 — integration

| Station | Mode | Why | Measures honestly |
| --- | --- | --- | --- |
| A10.1 CONTROL | Keep tempo | Written controls | notes in time |
| A10.1 MODEL, MUSIC | Chord chart | The standard's chart, Count off, tracker | live cell, unstored |
| A10.1 INDEPENDENCE | Blind | Memory and key-change pass | notes; not blind |
| A10.2 CONTROL | Chord chart | Chart reading | live cell |
| A10.2 MODEL | Play it to me | Hear a finished arrangement before taking it apart | nothing |
| A10.2 MUSIC | Perform | Project take | a take |

Where a mode cannot measure the station (A2.1 MUSIC, A3.1 MODEL, A4.2 overall, A6.1, A7a.1 MODEL to INDEPENDENCE, A7b.2, A7c.2-A7c.3 MODEL, A7e.1, A7g.1, A8.1), the station is self-checked, and the lesson says so in those words.

---

## 4. Cross-track strands fixed once

"One owner" means one developmental method, introduced once and recurring in context, not one lesson followed by references (brief correction 8). No lesson is copied into another track. Each recurring track gets a requirement line, a task or one sentence.

| Strand | Owning cluster and where it is built | The method, built once | Recurrence in other tracks (kind) |
| --- | --- | --- | --- |
| Sight-reading | 1; core rows 1.3-4.6 plus Today's daily read [U §1; M §16] | unseen, first attempt, keep tempo, guide off; the adaptive offer; rows carry signatures and 3/4 (A1.2) | one sentence at each drill row: technique.5, theory.6/9, jazz.8, chords-pop.8 ("your level's unseen row: one first attempt counts"); classical.3's Today pointer stays. No other track builds reading |
| Transposition (basic) | 2; core 1.2, 2.5/3.2, an independent task (A2.1) | play it again a step or fifth away from the hidden copy; then an unprinted key; numerals as the carrier | practice.5 clause pointing to 1.2 (task, wave 1(b)); hymns.5 second key (A7g.1 task); holiday.3 (exists); blues.8 (exists); jazz.9 unpractised key (exists); chords-pop.3/4/6/8 own chart transposition (exists); jam.7 worked example or narrowed (jam#5). REJECT for ragtime and latin (practice in several keys is not a transposition skill there) [U §1] |
| Ear production and by-ear learning | 3; theory-ear (play-back by MIDI) and chords-pop.8/9 (A3.1) | hear, hold, find at the keyboard, check against print; what the app judges versus what is self-checked stated every time (W11) | core 1.2/2.2 pulse and echo (A8.1 task); jazz.6/8 dictation (exists); one shared transcription template written once at theory.9 and used by a task line in blues.9, jazz.9, improv.4/5, latin (one rung) and rock.8 (SHOULD, except rock.8 which is A7e.1 MUSIC) |
| Score study | 11; core 4.6 routine, deepened at classical.6 (SHOULD core#9, classical#5) | key and metre, sections and repeats, hardest bars, recurring accompaniment, starting points, cadence points | one-line reference where a prompt already exists: classical.5/8/9, hymns.6, jam.7, ragtime.6, chords-pop.9, holiday.5; jazz.9 (which options carry a chart, A10.1); latin.6 (which cell, A7c.1 INDEPENDENCE) |
| Structural memory | 4; core 4.7 (sections as units, several starting points, away from the piano) | name the sections, start from three points, then Blind with the keys guide off | an `unjudged` requirement line (display, CT-1) plus one sentence pointing to 4.7 on classical.6+, ragtime.9, jazz.9, holiday.6, latin.7, blues.8/9, improv.9; ragtime.9 strain seam (SHOULD); blues.8 Blind on a twelve-bar form (promoted, wave 1(a)) |
| Performance and recovery (solo) | 4; core 4.6 (keep going) and practice.6 (whole-piece method), with the practice.3/5 cold-start line (A4.1) | cold start, no-stop run, restart from a named landmark, record and listen | classical.9 full application (MUST, A4.1 MUSIC); a two-line template on holiday.6/7, ragtime.9, latin.7, hymns.6, jazz.9 (SHOULD) |
| Ensemble recovery | 4; jam.5-7 (A4.2), its own owner [U §1] | count in, keep form, sit out and re-enter at a landmark, end on cues | improv.5's "never lost" claim softened to point there (W12 batch) |
| Rhythm and metre | 8; core 1.2, 1.4, 2.2, 2.4, 4.5 (A8.1 plus the existing rows) | feel and show the pulse, name the metre, echo; the app's clock is never offered as proof of an unaided pulse | style cells taught in their style with one line back to core: habanera (latin.4, A7c.1), shuffle (blues.4), the ragtime figure (ragtime.5, SHOULD); theory.4/5 rhythm rows (SHOULD); jam count-in (A4.2) |
| Practical harmony | 5; theory-ear for function and numerals, chords-pop for symbols and voicings; numerals are the shared carrier (theory.6, chords-pop.6) | name it in the drill; find it in a real piece (A5.1); use it in an accompaniment | hymns.5 (non-diatonic chords, exists); jazz.5/6 (ii-V-I, exists; minor A7b.1); blues.8 (numerals, prerequisite theory.6, SHOULD) |
| Composition | 6; improv-compose (A6.1, A6.2; 16-bar step SHOULD) | write, harmonise, write down, revise after listening | arranging is a separate domain owner (chords-pop.9, rock.8/9, classical.9; A10.2); blues.9 own chorus; jazz.9 own harmony under the melody |

---

## 5. Derived verification needs

### 5.1 What must be trusted, from the REPAIR and NEW stations

- **Generated families and drills that change:** `scale` (W4, start fix); the app sight-reading generator at L1-L4 (A1.2, data on six rows); `tresillo` (A7c.1, a new cell and metre); the app `chord` drill in minor (A7b.1, a code fix in `shellChord`); one `harmonic-dictation-modulation` progression (W11).
- **Existing items placed on new rungs:** P1 (oom-pah, stride, secondary rag; A7d.1), P2 (minor-blues boogie and walking bass; A7a.3), P5 (walk-up, passing chord, plagal; A7g.2). A placed item makes a teaching-use claim, so the F2 rule applies: a current `goodTeachingUse: yes` by a named reviewer is required, and an excerpt needs its own [G, Part G "Placing an item on a rung"].
- **Excerpts cut from shipped or imported scores:** Por Una Cabeza bars 1-14 and The Crave (A7c.1); Harlem Rag bars 0-16 (A7d.1); the Libertango excerpt (A7c.4).
- **Not trusted by this map, and why:** the 16-family music audit as a whole (only the families with a consumer are read: boogie and walking_bass for P2, and the new tresillo items); the `seventh_voicing` MERGE (no MUST path depends on it; provisional, reviewer correction 3); G4, G14, G15 and G16 (source-blocked); G5, G8 and G9-G12 (SHOULD rows, dispatched with their SHOULD consumer in wave 5).

### 5.2 Checkers

| Id | Kind | Checks | Consumer (station) | Wave |
| --- | --- | --- | --- | --- |
| CK-1 | NEW | Contrary start: from partitura events, the first onsets of the two staves have equal letter and octave; mirror symmetry in scale degrees at every index; all 36 items and every key the maker accepts [A G2] | W4 (A9.1 CONTROL, core 4.1) | 1(a) |
| CK-2 | NEW | Sight-reading level contract L1-L4: `sightReadingReport` refuses none of the new parameter sets; seeds 1-30 per changed row written through `musicXmlWriter.ts`; from partitura events: fifths and metre in the allowed set, bar sums, pitches diatonic unless accidentals are allowed, range within the level's keys; compared with the §5 spec, not with `levelFacts` [A G1, §5 step 3] | A1.2 INDEPENDENCE | 1(d) |
| CK-3 | NEW | Modulation progression oracle: `music21.roman.RomanNumeral` pitch classes of the replacement pivot progression (the lesson's own: C, Am as pivot, then D7, G) against what the drill builds, after one run that confirms the present sound [R theory §8.1; S A2] | W11 | 1(a) |
| CK-4 | EXISTING | Placement gate: `rung_audit.py` level band and prerequisites [A P1], plus the F2 teaching-use record on the item or excerpt identity | A5.1, A7a.3, A7c.1, A7d.1, A7f.2, A7g.2 | 2 onwards |
| CK-5 | NEW | Habanera and tresillo onset contract: per-bar LH onset sets from partitura; every tresillo bar fails the habanera check and the reverse; Por Una Cabeza bars 1-14, read with values doubled, must pass; digest unchanged for C, F and G after the interval-spelling edit [A G13] | A7c.1 CONTROL | 2 |
| CK-6 | NEW | Minor ii-V-i oracle: a fixture of `RomanNumeral(fig, key.Key(t))` pitch classes for iiø7, V7 and the sourced i, per key, compared with the drill's `expected`; the shell's ♭5 limitation stated or the fifth added [A G6] | A7b.1 CONTROL | 2 |
| CK-7 | NEW | Excerpt-cut fidelity: the cut's partitura events equal the source bars, with ties closed, divisions, key, time and clefs intact (musicxml-io is rejected as a snipper for an unended tie [A §7]) | A7c.1 MODEL, A7d.1 MODEL, A7c.4 MODEL | 2 to 4 |

- Amended 2026-10-05 from the quarry (record changes, section 4 of the amendment; carried as text, not as table rows, so that section 7's counts stay as the tables give them): CK-7 is extended to re-staffing (part events equal source events) for *Blues Riff in C*; G14's checker gains one structural comparison (Garota's LH onsets against the chosen published cell); section 5.1 'Not trusted' and 8.5 move G14 from 'source-blocked' to 'gated on a pattern' (G4, G15 and G16 stay). Harlem Rag bars 0-16 in 5.1 and CO-5 read bars 5-12 and 5-20 (Tyers).

Deferred with their SHOULD consumers, not counted here: G5's per-tier turnaround checker (reviewer correction 2: intro tier is the sourced triadic reduction, standard tier the seventh shell), G8's figure and near-misses, and G9-G12's unit tests and fixtures. Source-blocked: G4/G16 (printed offsets), G14 (bossa bass), G15 (guajeo).

### 5.3 Review corpora for the outside reviewer

| Id | Corpus | Denominator | Consumer | Wave |
| --- | --- | --- | --- | --- |
| CO-1 | The 16 contrary items after the fix, read at bar 1 and at the turn | 16/16 | W4 | 1(a) |
| CO-2 | Sight-reading L1-L4: a deliberate sample of the 55 seeded items (L1 12, L2 14, L3 14, L4 15), at least 2 per level plus every boundary case CK-2 flags, reported as n/55 and expanded by stratum under the addendum §5 step 4 rule; a 12/55 read never approves a level | at least 12/55 | A1.2 | 1(d) |
| CO-3 | The boogie and walking_bass families under the addendum §6 rules (9 O and B cases each), because P2 places their minor-blues items | 18/18 | A7a.3 | 2 |
| CO-4 | The new 2/4 habanera and tresillo items (C, F, G × 2) plus the §6 tresillo B cases (E♭ minor, F♯, two bars) | 9/9 | A7c.1 | 2 |
| CO-5 | Each excerpt cut for its teaching-use decision: Por Una Cabeza bars 1-14, The Crave, Harlem Rag bars 0-16 (after IM-1), the Libertango excerpt (after IM-2) | 4 cuts | A7c.1, A7d.1, A7c.4 | 2 to 4 |

- Amended 2026-10-05 from the quarry: CO-5 gains four cuts: Morton, Pinetop-Parham, *Blues Riff in C* and Garota (wave 2 for the blues cuts; the Garota cut waits for intake and a rights decision). The row above is unchanged.

- Amended 2026-10-05 (reviewer ruling `docs/review/responses/5831d42d.md`, item 2): CO-2's notation classifications are reported as n/20, or n/the number actually read after any expansion, with "35 not notation-reviewed" stated; the CK-2 results stay n/55; only if every item is read may the notation judgement use n/55. The 'reported as n/55' wording in the CO-2 row above is superseded for the notation read.

Every corpus verdict is a notation reading; the `heard` flag stays false; the owner is not the manual reviewer [A §6].

### 5.4 Imports needing the intake gate and a second-edition comparison

| Id | Material | Compared with | State | Consumer |
| --- | --- | --- | --- | --- |
| IM-1 | Harlem Rag, Tyers edition; CID to be confirmed from the reviewer's dump | the inspected De Lisle arrangement `QmaUQo93TVPNaJ6UDzttTyksRcPDcyafR8Nxct8qXHeEsj` | CANDIDATE until read (brief correction 7) | A7d.1 MODEL |
| IM-2 | Piazzolla Libertango two-staff arrangement `QmakqtZzLrMc3CqFnwiqjyxmhrThav2Hmu15E6Jrg9oap2`; excerpt after the El gordo triste dump | the uninspected 590-rating piano Libertango index row [S D] | personal-library and curriculum admissions separate; public export no | A7c.4 |
| IM-3 | Bizet's Habanera and Contra Danza (dumps pending) | each other and the shipped Por Una Cabeza cell | CANDIDATE [A G13] | A7c.1 (primary printed habanera; extra transfer) |
| IM-4 | O Christmas Tree source edition, read before the bar-32 fix | a second edition of the carol | fix of a shipped score | W15 |
| IM-5 | A single-line Joyful, Joyful edition with F♯, only if the batch chooses "replace" | the archive copies the genre plan lists | CANDIDATE, uninspected | W14 |

- Amended 2026-10-05 from the quarry (new imports, carried as text, not as table rows): IM-1 is now the Tyers CID `QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9`, compared with De Lisle `QmaUQo...`, window bars 5-20. IM-6 Garota (rights decision first); IM-7 Morton; IM-8 Pinetop-Parham, compared with the shipped `song.folk.boogie-woogie.pdmx`; IM-9 *Blues Riff in C* (needs re-staffing and the B-natural read); IM-10 *After You've Gone*; IM-11 *There Will Never Be Another You* (rights); IM-12 *Blue Bossa*, with jazz#9; IM-13 *La Negra*, after classification (rights); IM-14 *Maoz Tzur* and *Dreidel Song*, in wave 5; optional personal-library intake: *Come As You Are*, *Enter Sandman*, *A Little Piece of Heaven*. All are candidates, not admissions: a quarry ADMIT is not curriculum admission, a quarry score not in `catalog.json` opens only as a shelf import counting toward no rung, and public export is a third decision.

### 5.5 The reusable core, scoped by wave one

Wave one's checkers need exactly this: a partitura parse into events (onset, duration, pitch, staff, bar, with `notes_tied` for sounded notes [A §7]) plus key and time (CK-1, CK-2); a small contract-assertion helper over those events (CK-1, CK-2); the music21 RomanNumeral oracle, already a dependency (CK-3); and a corpus export writing each item's MusicXML with its derived facts and the check result (CO-1, CO-2). Wave two reuses the same core for CK-5 to CK-7 and CO-3 to CO-5. No generic 57-family harness, no 123-item audit and no family census is built for wave one. Their consumers are not in it (addendum reviewer correction 5; brief correction 9).

---

## 6. Wave one, then the later waves

Wave one has four parts, as the brief specifies. Nothing in the evidence changes them. The one adjustment is that 1(d) is bounded to L1-L4, because only those levels have a wave-one consumer.

### Wave 1(a) Correct what is wrong at HEAD
- **Learner problem.** A learner following a track today meets false or contradictory statements and tools: crossed-hand contrary scales against core 4.1, a "modulation" that is not one, finders that reject the rung's own models, a lab verdict that marks a correct walking bass half wrong, gates that measure something other than their titles, an unsupported practice law, technique rungs with no stop condition, and notation marks used but never named.
- **Solution classes considered.** Fix per track, as each record listed (SYNTHESIS §H batch 1). Fold each correction into its ability's later seam. Or run one correction wave first, grouped by seam (lesson text, stage JSON, one generator family, one catalog row, two score or edition decisions).
- **Chosen path.** One correction wave first, grouped by seam so each file is opened once. A wrong statement harms every learner now, and none of these needs a new station.
- **What would reverse it.** A correction that turns out to need a station its ability builds later moves into that ability's wave. For example, if the eighths route needs a new reading item, the row moves.
- **Real problem or proxy.** The proxy is "rows closed". The finish is: each listed statement is true at HEAD or removed; the 16 contrary items start at the unison under CK-1; the modulation item sounds the lesson's pivot under CK-3 and one run; and no completion or tool claim says more than the mode sheet allows.
- **Remaining uncertainty.** Evidence that SYNTHESIS marks "reviewer" is re-read at the line before each edit. The eighths route and the Joyful edition are content choices the batch makes. ABRSM's official wording for the contrary start is a [D] claim the fix does not depend on, because core 4.1 and the record already require the unison.

Seam: **lessons** 0.1, 1.1, 1.2, 2.3-2.5 (A1.2 MODEL sentences), 3.1 with 3.4 or 4.5 (A1.1 CONTROL section), 4.6/4.7, practice.1/3, technique.4-8 (all of A9.1), classical.3/5/6/8, chords-pop.4/5/7/8, blues.4-9, jazz.6-8, ragtime.5-7, theory.3-9, improv.4-8, the hymns lessons, holiday.3/5, the latin lessons, rock.overview/4/5/7, jam.md/5/6/7. **Modes:** none changed; tool claims are rewritten to what the mode sheet says each mode measures. **Drill and data:** `scale` FIX (16 items); one `harmonic-dictation-modulation` progression; finder lines in stage-7/8/9; `unjudged` display rules on improv.6-9 (CT-1); 4.7's prerequisite; the blues.8 Blind target; `00-tracks.json` (hymns rename, rock count). **Scores:** O Christmas Tree bar 32 (IM-4); Joyful (IM-5, a label, or drop). **Checkers:** CK-1, CK-3. **Corpus:** CO-1. **D-gate:** core#1's ABRSM line is checked in parallel; it does not block, because shipped scores carry the need.

- Amended 2026-10-05 from the quarry (wave 1(a)): (1) the Cuban-term corrections of A7c.2 join W16 in seam 1a.6 (the latin lessons are already in that seam; fix the terms before G15 or any lesson text). (2) A1.1's notation-marks section and A1.2's key-signature sentences left wave 1(a): see section 8.7. Wave one is not complete until that seam has its decision.

### Wave 1(b) Early core transposition
- **Learner problem.** A core learner is told a song in C "becomes a song you can play in any key" but is never asked to do it. practice.5 asks a Stage 1 learner to transpose with no how-to. Hymns, holiday, jam, chords-pop, blues and jazz all assume the skill later.
- **Solution classes considered.** Wait for the transposition drill (level 6.3, far too late). Generate transposition items. Write text tasks on existing paired material with an honest check. Or leave transposition to chords-pop.
- **Chosen path.** Text tasks: at 1.2, a five-finger tune a step or a fifth up, checked against the existing G-major items with the page hidden. At 2.5/3.2, I-IV-V7 and a known tune in a second key, checked against the existing second-key copies (Ode in G, Twinkle in F, Saints in F). Then one independent task in a key nobody printed. practice.5's clause points to 1.2 (practice#3's transposition half). No generator is presumed.
- **What would reverse it.** If the primary source (Faber Level 4; dossier 2.2) [D] places transposition later, the tasks stay but move after 2.5. If Blind with the guide off cannot hide the keys guide, the CONTROL becomes self-checked only.
- **Real problem or proxy.** The proxy is "a task sentence exists". The finish is: a 1.2 learner plays a five-finger tune in a second key without the page, and the app judges the notes against the printed copy; a 3.2 learner plays I-IV-V7 and a tune in an unprinted key, self-checked and stated as such.
- **Remaining uncertainty.** Blind is not recorded as Blind [M §10], so the app cannot tell a hidden-page run from a read one. That stays self-checked, and the lesson says so.

Seam: **lessons** 1.2, 2.5 or 3.2, an independent task at 3.2 or 4.4, the practice.5 clause. **Mode:** Blind with the keys guide off; the chord and cadence drills in C, G and F; standalone Free play for the unprinted key. **Drill:** none new. **Excerpt:** none. **Checker:** none, because no generated or imported material changes.

### Wave 1(c) The blues right hand over the learner's own left hand
- **Learner problem.** blues.9 asks for choruses "over your own left hand", and nothing between blues.5 and blues.9 rehearses it. The lab and Duet supply the app's bass, so the learner's left hand is silent whenever they improvise.
- **Solution classes considered.** Code a bass-off lab setting. Generate a new "LH groove plus RH fragment" family. Write a graded text task on the existing shuffles, using the chord chart's click and bar tracker. Or drop the promise.
- **Chosen path.** A graded task at blues.7 or 8. First the authored twelve-bar shuffle's LH alone in Keep tempo, then the written LH with the held RH (both measured). Then the LH with RH blue-note fragments over bars 1-4, then bars 1-4 and 9-12, then the whole form, over the chart with Comp and Bass + drums off. Then with no tracker and no click. The take is recorded on an outside recorder and listened to once (blues.9's own sentence).
- **What would reverse it.** If the chart cannot turn bass and comp off, or no twelve-bar item carries symbols, the Metronome serves the click and the tracker is lost. A code change is then a product decision outside this seam. If the Berklee weeks 8-10 primary source [D] contradicts the order, the order changes; the ability does not.
- **Real problem or proxy.** The proxy is "the task is in the lesson". The finish is: a learner can follow measured steps to a twelve-bar chorus over their own left hand with every support removed, and the rung page says the improvised step is theirs to check.
- **Remaining uncertainty.** No actor hears whether the chorus sounds like blues (unverified as music). The mode sheet names the chart's toggles without a line (§15). The orchestrator checks that citation before this seam is briefed.

Seam: **lessons** the blues.7/8 task and the blues.9 wording. **Mode:** Keep tempo with Duet; Chord chart with the toggles off; Metronome as fallback. **Drill:** the authored shuffles in C, F and G (blues.4) and the held-RH boogie items (blues.6), unchanged. **Excerpt:** none. **Checker:** none.

### Wave 1(d) The sight-reading specification and export experiment (alongside)
- **Learner problem.** Every core reading row writes no key signature and no 3/4, while core teaches both from 1.4 and 3.1. Unseen reading is the strand the daily read carries every session, and its level contract has never been checked against a published progression.
- **Solution classes considered.** Change `fifths` and `timeSig` and trust the generator. Run the full 100-item, seven-level experiment first. Run a bounded experiment on the levels wave one changes, then make the data change. Or adopt a phrase dataset.
- **Chosen path.** The addendum §5 lane, bounded to L1-L4: the levels the six core rows and Today's read use up to Stage 4. A level spec drawn from the official ABRSM 2025-26 PDF, RCM 2022 and Faber, with a source per parameter; 55 seeded items checked by CK-2; a deliberate notation read (CO-2); then G1's data change.
- **What would reverse it.** Stop and report if `unrealisable()` refuses more than 10 % of the new parameter sets, or if partitura and musicxml-io disagree on more than 2 files (the addendum §5 stop rules). If the read finds a systematic defect, expand by stratum before the data change.
- **Real problem or proxy.** The proxy is "experiment table complete". The finish is: the core rows write G/F and 3/4 within a checked contract, and Today's read can offer them at the rungs that taught them.
- **Remaining uncertainty.** Phrase plausibility is a notation reading by the outside reviewer, unverified as music. App levels are not exam grades, so a divergence from ABRSM is a decision, not a defect [A §5]. The phrase-cell comparison (§5 step 5) and L5-L7 wait for their consumers.

Seam: **lessons** one sentence where a row starts writing signatures. **Mode:** Daily sight-read (Keep tempo). **Drill:** data on `sight-reading-1-left`, `-1`, `-2-right`, `-2`, `-3`, `-4`. **Checker:** CK-2. **Corpus:** CO-2. **Core:** §5.5.

### Later waves, in order

A wave is accepted when its learning gaps are closed or honestly scoped (brief correction 9).
- **Wave 2: foundational bridges with existing or near-existing material (P2).**
  1. A4.2, ensemble start, recovery and ending (text only).
  2. A6.1 and A6.2, composition bridges (text).
  3. A7b.1 and A7b.2, jazz bridges: the G6 code fix with CK-6, the Insensatez symbol read for MODEL, and the improv.6 prerequisite. This unblocks A10.1.
  4. A7c.1, latin.4: G13 with CK-5, CK-7, CO-4 and CO-5; the printed-habanera check through IM-3.
  5. A7d.1, ragtime bridge: P1 data first, then IM-1, CK-7 and CO-5.
  - Amended 2026-10-05 from the quarry: IM-1 resolves to the Tyers CID `QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9`; the window becomes bars 5-12 first, then bars 5-20 (A7d.1). Wave unchanged.
  6. A5.1, A3.1 and A8.1: theory application, the by-ear routine, pulse (text and `songOptions`).
  7. A7a.2 and A7a.3: text, then P2 after CO-3.
  - Amended 2026-10-05 from the quarry: A7a.1's real MODEL and TRANSFER items (B2 Morton and Pinetop-Parham; B3 *Blues Riff in C*) join this item, the blues seam with A7a.2 and A7a.3, where CK-7 and CO-5 are available. Wave 1(c) is unchanged: it has no excerpt and no checker. They are candidates until intake (IM-7 to IM-9).
  8. A4.1: cold start, classical.9, the practice.6 rung.
- **Wave 3: development, controlled practice, transfer and independent use (P3-P6).** A7c.2 (P3), A7g.2 and A7f.1 (P4), A7f.2 (P5), A7g.1 (P6). A7a.3 (P4) goes earlier, in wave 2, because it shares the blues seam with A7a.2.
  - Amended 2026-10-05 from the quarry: **A7c.3 (P3) moves here from wave 4 item 5, beside A7c.2.** Its dispatch condition is that the build brief names one published pattern and its exact contract (G14 gated on a pattern, not unblocked); the Garota MODEL joins only after intake and a rights decision. Unchanged by the quarry: A7d.1 (wave 2.5), A7c.1 (2.4), A10.1 (4.1), A7e.1 (4.2), A10.2 (4.3), W14 (1(a)) and holiday#6 (wave 5).
  - Consumed 2026-10-05 from PARALLEL-UNBLOCKS §1 (wave 3): A7c.3's dispatch condition ('the build brief names one published pattern and its exact contract') is met by the contract recorded under A7c.3; it still dispatches only through its own brief in wave 3.
- **Wave 4: promised endpoints (P7).**
  1. A10.1, jazz.9 rewritten, after wave 2.3.
  2. A7e.1, rock.8.
  3. A10.2: chords-pop.9's two starts and the rock.9 project.
  4. A7c.4, latin.8, after IM-2 and the public-build decision (§8.6).
  5. A7c.3, Brazilian comping, only after G14's source is read. [Superseded 2026-10-05: moved to wave 3, see the Wave 3 line below.]
- **Wave 5: SHOULD rows by cluster,** each with its own consumer. Generator SHOULDs (G5, G8, G9-G12) go with their abilities. Source-blocked rows (G4, G14, G15, G16) wait for their sources. NICE rows go only on the owner's word.
  - Consumed 2026-10-05 from PARALLEL-UNBLOCKS §1, §2 (wave 5 source-blocked rows): of the rows named above, G14 (contract supplied) and G15 (primary source named) no longer wait for a source; G4 and G16 still do, and the broad Berklee sequence does not cover their exact rock patterns.

---

## 7. Counts

Produced by `count_ability_map.py` (beside this file), run at the end on this file and on `CURRICULUM-UPGRADE.md`. Pasted verbatim [C].

```
ABILITY MAP COUNTS (count_ability_map.py)
MUST abilities (blocks): 28
Stations: 112 = EXISTING 18 + REPAIR 27 + NEW 26 + SOURCE-NEEDED 9 + SHARED 28 + NO-SEPARATE-ARTIFACT 4  (sum 112; four per block: 112)
  planned as SHARED or NO-SEPARATE-ARTIFACT (not missing work): 32
  work to supply (REPAIR + NEW + SOURCE-NEEDED): 62
Modes used: 19 of 34 in the vocabulary; stations with no app mode: 29
  Keep tempo 30; Chord chart 17; Play it to me 6; Perform 5; Blind 5; Theory drills 4; Ladder 4; Free play 3; Lab: Hold the chords 3; Note flash 2; Harmonic dictation 2; Lab: Jam it 2; Duet 2; Daily sight-read 1; Simon 1; Trading fours 1; Ear: cadence / progression 1; Rhythm only 1; Loop 1
Checkers required: 7 (NEW 6, EXISTING 1)
Review corpora for the outside reviewer: 5
Imports needing the intake gate and a second-edition comparison: 5
Target rows: MUST 74 + accepted additions 5 (practice#4, latin#1, latin#9, rock-metal#8, rock-metal#9; 4 already MUST) = 75
  traced by ability blocks 39; by W dispositions 36; split over more than one disposition 2 (latin#3, latin#4); untraced 0; non-target cited 0
  W dispositions: 18 covering 36 row citations
SHOULD rows with a SHOULD line: 63 of 63 (SHOULD 64 less the accepted addition practice#4)
Dossier-dependent target rows: 11; blocks carrying [D-gate]: 12 (A1.2, A3.1, A4.1, A4.2, A7a.1, A7a.2, A7b.1, A7b.2, A7c.1, A7c.2, A7c.3, A7g.1)
Completion treatments: 3 defined; blocks per treatment: CT-1 17, CT-2 4, CT-3 9
MUST/SHOULD conflicts listed: 7
Wave-one clusters with the six-line rationale: 4 of 4
```

Counts re-run 2026-10-05 after the quarry fold-in; the script exits 0. The station tables are unchanged by the fold-in, so the station, mode and checker counts above are the counts of the tables as written; the amended states (amendment section 5.1) are carried on the dated amendment lines under each block and are not in these counts. The two dossier lines (11 target rows, 12 blocks) differ from the earlier paste (14 and 15): the same script gives the same two numbers on the pre-fold map, because CURRICULUM-UPGRADE.md was edited after the earlier paste; the fold-in did not change them.

Counts re-run 2026-10-05 after consuming the parallel unblocks (PARALLEL-UNBLOCKS and SOURCE-CHECK-parallel). The amendments are dated lines and a seam table in section 8 and under blocks; no station table changed, so every number is unchanged and the script exits 0. Pasted verbatim [C]; this block does not supersede the one above, which it equals.

```
ABILITY MAP COUNTS (count_ability_map.py)
MUST abilities (blocks): 28
Stations: 112 = EXISTING 18 + REPAIR 27 + NEW 26 + SOURCE-NEEDED 9 + SHARED 28 + NO-SEPARATE-ARTIFACT 4  (sum 112; four per block: 112)
  planned as SHARED or NO-SEPARATE-ARTIFACT (not missing work): 32
  work to supply (REPAIR + NEW + SOURCE-NEEDED): 62
Modes used: 19 of 34 in the vocabulary; stations with no app mode: 29
  Keep tempo 30; Chord chart 17; Play it to me 6; Perform 5; Blind 5; Theory drills 4; Ladder 4; Free play 3; Lab: Hold the chords 3; Note flash 2; Harmonic dictation 2; Lab: Jam it 2; Duet 2; Daily sight-read 1; Simon 1; Trading fours 1; Ear: cadence / progression 1; Rhythm only 1; Loop 1
Checkers required: 7 (NEW 6, EXISTING 1)
Review corpora for the outside reviewer: 5
Imports needing the intake gate and a second-edition comparison: 5
Target rows: MUST 74 + accepted additions 5 (practice#4, latin#1, latin#9, rock-metal#8, rock-metal#9; 4 already MUST) = 75
  traced by ability blocks 39; by W dispositions 36; split over more than one disposition 2 (latin#3, latin#4); untraced 0; non-target cited 0
  W dispositions: 18 covering 36 row citations
SHOULD rows with a SHOULD line: 63 of 63 (SHOULD 64 less the accepted addition practice#4)
Dossier-dependent target rows: 11; blocks carrying [D-gate]: 12 (A1.2, A3.1, A4.1, A4.2, A7a.1, A7a.2, A7b.1, A7b.2, A7c.1, A7c.2, A7c.3, A7g.1)
Completion treatments: 3 defined; blocks per treatment: CT-1 17, CT-2 4, CT-3 9
MUST/SHOULD conflicts listed: 7
Wave-one clusters with the six-line rationale: 4 of 4
```

Counts re-run 2026-10-05 after consuming FAMILIAR-SONG-VERDICT and SOURCE-CHECK-technique-hymns-rock. The amendments are dated lines under blocks and in section 8.5; no station table, row id, SHOULD line or [D-gate] token changed, so the counts are those above, and the script exits 0.

```
ABILITY MAP COUNTS (count_ability_map.py)
MUST abilities (blocks): 28
Stations: 112 = EXISTING 18 + REPAIR 27 + NEW 26 + SOURCE-NEEDED 9 + SHARED 28 + NO-SEPARATE-ARTIFACT 4  (sum 112; four per block: 112)
  planned as SHARED or NO-SEPARATE-ARTIFACT (not missing work): 32
  work to supply (REPAIR + NEW + SOURCE-NEEDED): 62
Modes used: 19 of 34 in the vocabulary; stations with no app mode: 29
  Keep tempo 30; Chord chart 17; Play it to me 6; Perform 5; Blind 5; Theory drills 4; Ladder 4; Free play 3; Lab: Hold the chords 3; Note flash 2; Harmonic dictation 2; Lab: Jam it 2; Duet 2; Daily sight-read 1; Simon 1; Trading fours 1; Ear: cadence / progression 1; Rhythm only 1; Loop 1
Checkers required: 7 (NEW 6, EXISTING 1)
Review corpora for the outside reviewer: 5
Imports needing the intake gate and a second-edition comparison: 5
Target rows: MUST 74 + accepted additions 5 (practice#4, latin#1, latin#9, rock-metal#8, rock-metal#9; 4 already MUST) = 75
  traced by ability blocks 39; by W dispositions 36; split over more than one disposition 2 (latin#3, latin#4); untraced 0; non-target cited 0
  W dispositions: 18 covering 36 row citations
SHOULD rows with a SHOULD line: 63 of 63 (SHOULD 64 less the accepted addition practice#4)
Dossier-dependent target rows: 11; blocks carrying [D-gate]: 12 (A1.2, A3.1, A4.1, A4.2, A7a.1, A7a.2, A7b.1, A7b.2, A7c.1, A7c.2, A7c.3, A7g.1)
Completion treatments: 3 defined; blocks per treatment: CT-1 17, CT-2 4, CT-3 9
MUST/SHOULD conflicts listed: 7
Wave-one clusters with the six-line rationale: 4 of 4
```

---

## 8. Reconciliations, completion, supersession, gates and open items

### 8.1 MUST/SHOULD conflicts between the ownership table (upgrade §1) and the rows (§2) (brief correction 5)

The orchestrator adds a dated reconciliation note to the upgrade afterwards.

| C | Ability | §1 says | §2 says | Resolution and reason |
| --- | --- | --- | --- | --- |
| C1 | hymns.5 second-key task | SHOULD (transposition recurrence) | MUST (hymns-gospel#5, singer, count-in, tempo, second key) | **MUST.** The narrowed promise keeps "accompany" (§0.1), and choosing a key for a singer is the core of accompanying. §1 should read MUST for hymns.5 |
| C2 | blues.8 Blind on a non-form piece | MUST (data) | SHOULD (blues-boogie#9) | **Split.** The data half is a misleading tool pointer (a form-memory test aimed at a 97-bar piece [R blues §3.7]) and joins wave 1(a). The landmark sentence stays SHOULD |
| C3 | ragtime.9 strain seams | MUST (text) | SHOULD (ragtime#6) | **SHOULD.** ragtime.9 already teaches structure and the mid-strain start; the record rates the seam "depth" [R ragtime §3.1.5] |
| C4 | A key before dictation | MUST | SHOULD (theory-ear#6) | **SHOULD.** It is a generator change (G9) and the record rates it depth [R theory §3.3]. What is MUST is the honest wording that today's drill gives no key (W11, theory-ear#2) |
| C5 | Cold start in the practice track | SHOULD ("practice additions") | MUST (practice#2) | **MUST.** It is the CONTROL station of the shared performance and memory method (A4.1), one line of text, and retrieval is otherwise absent before 4.7 [R practice §3.3] |
| C6 | Performance and recovery on classical.9 | SHOULD (the two-line template) | MUST (classical#4) | **MUST at classical.9, SHOULD elsewhere.** classical.9 is the project rung and the template's first full application (A4.1 MUSIC); the other rungs get the two-line template as SHOULD |
| C7 | jazz.9 solo-piano pass | jazz#3 (MUST) includes "solo-piano pass" | jazz#8 (SHOULD) "solo-piano arranging technique" | **MUST at the harmonised-melody level, inside A10.1.** Drop-2 stays NICE. The §0.1 decision keeps an integrated capstone, which cannot end on an untaught pass |

### 8.2 Completion and reporting treatments (brief correction 4)

The fact being absorbed is that `rungState.ts:341` filters `unjudged` readings out before "met" is computed. A rung with `runs` plus `unjudged` is met by the runs alone, and a rung whose every requirement is `unjudged` is never met, moving on only by the learner's word [M §32.7; rungState.ts:345-350]. None of the treatments below changes the evidence system.

| CT | Treatment | What the rung claims when passed | What stays self-checked | Used when |
| --- | --- | --- | --- | --- |
| CT-1 | Display and wording. The lesson's rule is added as an `unjudged` requirement, so the page prints it as the lesson's and never counts it. "How you'll know" says the rung is met by the named measured runs and the ability is the learner's to check | "met on these measured runs"; the ability itself is not claimed | the ability the runs do not show | an existing rung is passable on exercise runs that do not exercise the ability |
| CT-2 | A learner's-word rung. Every requirement is `unjudged`; the rung moves on by "Mark done", and the page says why | nothing measured; the learner's word, shown apart | everything | a new text-only rung whose material is the learner's own (practice.6, rock.8, rock.9; latin.8 pending) |
| CT-3 | No change. The rung's runs already measure the ability's playable part honestly | the measured playing | named items only (for example, the habanera's identity at speed) | the runs are runs of the ability's own items |

Per ability (the **Completion** line in each block): CT-1 for A2.1, A3.1, A4.1 (classical.9), A4.2, A5.1, A6.1, A6.2, A7a.1, A7a.2, A7b.2, A7c.2, A7c.3, A7g.1, A8.1, A9.1, A10.1, A10.2 (chords-pop.9). CT-2 for A4.1 (practice.6), A7e.1, A10.2 (rock.9), and A7c.4 pending. CT-3 for A1.1, A1.2, A7a.3, A7b.1, A7c.1, A7d.1, A7f.1, A7f.2, A7g.2. W13 records that improv-compose#3's promised gating is impossible as written and is replaced by CT-1.

### 8.3 Latin substrates by tradition (brief correction 6)

| Tradition | Pattern taught | Substrate | Block |
| --- | --- | --- | --- |
| Cuban | son and rumba clave, tumbao, montuno (guajeo later, G15 blocked) | Guantanamera (29 symbols) | A7c.2 |
| Brazilian | a sourced bossa left hand (G14 blocked); bossa clave as rhythm only | Insensatez (28 symbols), Só Danço Samba (25) | A7c.3 |
| Argentine (Río de la Plata) tango | habanera, then the tango figures derived from it | Por Una Cabeza (habanera LH, bars 1-14), La Cumparsita A/B (written tango LH) | A7c.1, latin.6 |
| Tango nuevo | accented ostinato, articulation, texture | the Libertango arrangement (IM-2) | A7c.4 |
| Tresillo model | the tresillo cell beside the habanera | The Crave (tresillo LH in 27 of 53 bars). Its tradition is not stated in the records read here, so it is used as a cell model and not presented as Argentine | A7c.1 |

The upgrade's single "apply the tumbao and montuno to Insensatez, Só Danço Samba, Guantanamera" (latin#4) is split accordingly. The tumbao and montuno are never set over the Brazilian tunes.

- Consumed 2026-10-05 from PARALLEL-UNBLOCKS §1, §2 (latin substrates): in the table above, 'G15 blocked' is superseded (one exact Mauleon example is the first controlled pattern; Guantanamera stays the substrate) and 'G14 blocked' is superseded (one basic bossa bass pattern, contract under A7c.3).

### 8.4 Where this map supersedes earlier plans (brief correction 9)

- **SYNTHESIS §H.** Batch 1 (corrections A1-A20) becomes wave 1(a), W1-W18, with the contrary set corrected from twelve files to 16. Batch 2 (bridges) is re-cut by ability into waves 1(b)-1(d) and wave 2. Batch 3 (owner-gated) is decided (upgrade §0.1) and lives in A7g.1, A7e.1, A10.1 and A10.2. The map wins.
- **The upgrade's §6 step 3** (batch 2 for MUST text, data and existing exercises; batch 3 for generator and repertoire): superseded. A generator or repertoire change ships inside its consumer ability's seam, never in a generator batch.
- **The addendum's §8 family-first sequence:** no family batch dispatches as a family. G2 (`scale`) goes with W4 in wave 1(a). G1 (sight-reading data) goes in wave 1(d). G13 (`tresillo`) goes with A7c.1 in wave 2. G6 (theory seam) goes with A7b.1 in wave 2. G9-G12, G5 and G8 go with their SHOULD rows in wave 5. G4, G14, G15 and G16 wait for their sources. P1, P2 and P5 go with A7d.1, A7a.3 and A7g.2; P3 and P4 with their SHOULD rows; P6 is already placed; P7 is folded into A7b.2. The semitone-site class fix (riff, swing_pair, modal_vamp, blues_forms) has no consumer in the MUST map and is not dispatched by it; only G13's interval spelling at `:5806` travels, with A7c.1.
- **The addendum's §5 experiment:** bounded to L1-L4 (55 items) for wave 1(d). L5-L7 and the phrase-cell comparison wait for their consumers (technique.5, theory.6/9, jazz.8, chords-pop.8).
- **The addendum's §6 audit (123 items):** not dispatched whole. Only boogie and walking_bass (CO-3, wave 2) and the new tresillo items (CO-4) are read, because those have consumers; `intro` (P4) waits for holiday#3.

### 8.5 Source gates and candidate states kept

- **The 24 dossier-dependent rows** [C, `count_upgrade.py`] stay marked until their primary source is read. The 14 among the target rows carry [D-gate] on their blocks (§7 confirms all are marked). The rest are SHOULD lines marked [D] where cited. The source checks are the first task of each wave's brief: Faber level guides, Berklee course pages, and the official ABRSM and RCM PDFs; "403, therefore a third-party transcription" is not accepted where an official PDF exists [U §0.4].
- **The Tyers Harlem Rag edition** is distinct from the inspected De Lisle file and stays CANDIDATE until read (IM-1).
- **The shipped Fly Me to the Moon does not demonstrate the minor ii-V-i** [A G6]. A7b.1's MODEL is SOURCE-NEEDED.
- **Four rows are source-blocked:** G4 and G16 (printed pattern offsets), G14 (bossa bass), G15 (guajeo) [A, reviewer correction 1]. [Superseded in part 2026-10-05, consumed from PARALLEL-UNBLOCKS §1, §2: G14 has a contract and G15 has a primary-source path; G4 and G16 stay source-blocked.]
- **G5's checker is defined per tier** (reviewer correction 2).
- **The `seventh_voicing` MERGE is provisional** and gates nothing in this map (reviewer correction 3).
- **Admission states** carried as given: Por Una Cabeza and The Crave ADMITTED for the habanera and tresillo [A G13]; Insensatez and Só Danço Samba ADMITTED as substrate only [A G14]; Bizet and Contra Danza CANDIDATE; Combination March bars 4-19 CANDIDATE (shipped, unreviewed for the role).

- Amended 2026-10-05 from the quarry (admission states): Garota is a MODEL candidate. *Blue Bossa*, *After You've Gone* and *There Will Never Be Another You* are substrate candidates. Bizet and *Contra Danza* stay CANDIDATE and were not dumped by the quarry. G14 is gated on one published pattern and its exact contract (no longer 'source-blocked on the style'); G4, G15 and G16 stay source-blocked. The Harlem Rag Tyers CID is `QmXBVY...`, a candidate until intake.

- Consumed 2026-10-05 from SOURCE-CHECK-parallel (source gates, section 8.5): the 24 dossier-dependent rows are partly source-checked. Gates lifted (by block, with each block's own dated line): A4.1, A7a.1, A7b.1, A7b.2 (Berklee proposition only), A7c.1 (category proposition only), A7c.2, A7c.3. Gates left, by name: A1.1, A1.2 and A8.1 (ABRSM), A4.2 (ABRSM jazz solo), A2.1 (Faber), A3.1 (Berklee ear training and RCM), A7a.2 (blues turnaround and endings not covered), A7g.1 (hymns), and A7b.2's ABRSM Jazz Piano citation. The ABRSM and RCM technical-list rows, the hymn-specific rows and the exact rock-pattern claims the broad Berklee sequence does not cover stay gated. The sources support the propositions and do not dictate rung numbers, repetition counts, thresholds or generator parameters.

- Consumed 2026-10-05 from SOURCE-CHECK-technique-hymns-rock (source gates, section 8.5): gates lifted, by id: **A7a.2** (intros, turnarounds and endings as taught blues vocabulary; category only), **A7g.1** (accompanying a singer as hymn and gospel competence; endpoint only), SHOULD chords-pop#4 (bass-line vocabulary only, partly), SHOULD chords-pop#6 (the category only; G4 stays blocked), and the technique NICE row **technique#9** (advanced breadth: four-octave major and harmonic and melodic minor scales, scales a sixth and a third apart, contrary motion, chromatic and whole-tone work, major and minor arpeggios, dominant and diminished sevenths; ABRSM Grade 8 and RCM Level 10, confirmed with correction). The correction: both syllabi use named key subsets for several patterns, so the upgrade row's 'in all keys' wording is not supported; the lift is breadth only, never a grade equivalence, an exam key list or an exam tempo, and technique#9 stays NICE (it has no ability block and no SHOULD line, so it is carried here only). The blues and rock progression (vocabulary and bass, comping, phrasing and turnarounds, stylistic patterns, improvisation, independent accompaniment choices; Berklee) and the hymn and gospel trajectory (hymns, traditional cadences, reharmonisation, call-and-response, ear-led accompaniment; Berklee, an advanced course) are supported as broad propositions; no current row asks for reharmonisation, call-and-response or ear-led accompaniment, so those stay recorded for a later gospel extension and nothing from the gospel course loads the beginner hymn rungs. Gates left, by id: A1.1, A1.2 and A8.1 (ABRSM and RCM reading, rhythm and aural rows: the check read the Grade 8 technical requirements and RCM Level 10 technical tests only), A4.2 (the ABRSM jazz solo section: not read), A2.1 (Faber), A3.1 (Berklee ear training and RCM harmonic hearing), A7b.1 (SOURCE-NEEDED MODEL), SHOULD blues-boogie#6 (shuffle versus straight), SHOULD rock-metal#7 and G16, SHOULD chords-pop#6's G4, the vamp-between-verses SHOULD (holiday.3), the dictation-key, scale-degree-singing and chords-pop#4 texture-by-density rows. The sources support the propositions and do not dictate rung numbers, repetition counts, thresholds or generator parameters. Not established by the check: a PianoProject-to-ABRSM/RCM grade equivalence, exact generator onset contracts for rock or gospel, that any shipped score embodies the cited style.

- Consumed 2026-10-05 from FAMILIAR-SONG-VERDICT (the fun shelf; a note, not stations): optional or fun repertoire unless a map gap needs it, by the verdict's own wording. *Take Me Home, Country Roads* `QmTmhiFsKppNMNycpcjsq2dzzDRMMFGME4zjky17GLerzb` separates melody, a chord-stab accompaniment and a bass into three single-staff parts, which suits a reduction or arrangement task (the learner chooses which of the accompaniment and bass parts to combine under the melody, or reduces three parts to two hands). *A Thousand Miles* `QmXkRAFeUbpaAc97G5qzTCqXvcVnqQfB7nAnQX1eeiLRkg` has the real recurring riff, but five sharps and dense sixteenths make it a later project, not an early item. *Creep*, *Mad World*, *Jolene* and *Iris* are optional or fun repertoire; *Creep* must not displace *Stand By Me*. The *Karma Police* edition is rejected (alto-clef right hand, placeholder loop and numbering faults); *Chasing Cars* is low priority (one staff of an 11-part band score). No useful current archive edition: *Let It Be*, *Ring of Fire*, *I Walk the Line*, *Tennessee Whiskey*. Familiarity is allowed as a reason for optional repertoire; no familiar song becomes a required rung item by this note, and the three candidates in A5.1 and A10.2 are CANDIDATES, not rung items. Folder: `docs/review/familiar-song-pass-2026-10-05` (xml and summary); verdict `docs/review/pdmx-quarry-2026-10-05/FAMILIAR-SONG-VERDICT.md`.

- Copyright and public export are out of scope by owner direction (2026-10-05); older rights or public-export wording in the quarry files and earlier amendments is historical and non-gating; no current disposition, brief or dispatch condition depends on it.

### 8.6 Not resolved here

1. Whether the chord chart's Comp and Bass + drums toggles can both be turned off: the mode sheet names them without a line (§15). Wave 1(c) depends on it, and the orchestrator checks it before briefing. A twelve-bar blues item with printed chord symbols for the chart is also unconfirmed.
2. Whether the Score screen unrolls first and second endings and D.C. as it does a backward repeat (A1.1's MIDI claim) [R core §3.1].
3. Whether `drill.reading.note-flash-accidentals` writes naturals (A1.1 CONTROL).
4. latin.8's public-build behaviour when its only material is personal-library under copyright. This is a product decision; until then A7c.4 stays CT-2 pending.
5. The Crave's tradition attribution (not in the records read).
6. The modulation item's actual sound: SYNTHESIS derived it from code without running it, and CK-3's first step runs it.
7. Whether `alternativesFor` already surfaces unplaced items at runtime [A §8], which bears on how much P1, P2 and P5 change for a learner.
8. Which further shipped pieces carry each theory rung's harmony (A5.1). Only instances already read in records are named; the rest stay CANDIDATE.
9. Every musical-quality question: *unverified as music*. No one in this process can decide these, and each such station stays self-checked or goes to a notation read, never to a listening claim.

10. Amended 2026-10-05 from the quarry (open items, amendment 5.4): (1) rights and the public build: Garota, *La Negra*, *Blue Bossa*, *There Will Never Be Another You* and the rock and metal scores are presumed in copyright [inferred], the quarry's composition label is `unknown`, and item 4 above now also covers A7c.3's MODEL, jazz.9's standard, K1 and K2; the owner decides that as a product question on a rights record; public export is no for those works until a record exists. (2) G14: which published pattern, its exact contract, and whether Garota's LH matches it (a script settles the match once the pattern is chosen). (3) Classifying *La Negra*'s bars (a reader, against a published example). (4) The B-natural in *Blues Riff in C* against the C7 voicing: typo or intended (a reader); OPEN. (5) Bar selection: Morton, Pinetop, Garota (bars 1-8 proposed) and the *Autumn Leaves* passages; then the Pinetop edition comparison (IM-8). (6) A7b.1's MODEL is still SOURCE-NEEDED and no score prints the minor ii-V-i; read the `<harmony>` of *Blue Bossa* and *Autumn Leaves*. (7) Bizet and *Contra Danza* were not dumped; the primary printed-habanera check (IM-3) stays open. (8) Whether the Score screen runs three-part or two-single-staff scores as two-hand items (*Maoz Tzur*, the Dykes hymn, *Deep River*): not established. (9) Stop-time has no direct definition. (10) W16's 'arpeggiated' montuno wording is not found in `content/lessons/latin*.md` at HEAD; the orchestrator checks where the item points. (11) Every musical-quality question stays *unverified as music*.
- Amended 2026-10-06 (probe drafting): item (7) above is stale: Bizet's Habanera and *Contra Danza* are both in `docs/review/pdmx-dump-2026-10-05/` (`search.json`), and a second Bizet piano edition `QmVwLkktZ9vQDNhuy8Z857L7BRqAGqUeEZduRjwJNu2zze` exists outside the dump's list; the probe brief (`briefs/probe-latin4-bizet.md`) chooses it, its left hand printing the habanera cell in all of bars 1-12 (checked by the orchestrator with music21: onsets 0, 0.75, 1, 1.5 in 2/4). *Contra Danza*'s left hand prints the cell in none of its 51 bars by the drafter's count, so it cannot serve this row. IM-3's primary printed-habanera check moves to the probe.
- Amended 2026-10-06 (the latin.4 probe, Entry 241), IM-3: Bizet `QmVw…` has been in the catalogue since Entry 44 (`song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx`); it was re-admitted through the intake gate (`intake/QmVwLkktZ9vQDNhuy8Z857L7BRqAGqUeEZduRjwJNu2zze.md`), so its import disposition is ADMITTED; *Contra Danza* stays REJECTED.
- Amended 2026-10-06 (the latin.4 probe, Entry 241), A7c.1: the MODEL cut (bars 1-12, left hand) passed the cell check with two readers on three files and was approved, but latin.4 is blocked at placement: `excerpts.py --candidate-rungs` lists the cut for 4.4, ragtime.5 and technique.6 only, because the cut's `rhythm.sixteenths` is taught at 4.4, off a Stage 4 track rung's path (the core through 3.6 plus its prerequisites), and because habanera and tresillo map to no demand, so the rung has no measurable claim. The cut's built tempo is 96 against the printed 60 (the one-hand cutter drops the staff carrying the mark; held out of the catalogue until fixed). The rung waits on a placement decision (prerequisites 4.4 and latin.3) and on the habanera and tresillo cells as measured demands (the CK-5 matcher in the app and the build; G13's checker).

11. Consumed 2026-10-05 from PARALLEL-UNBLOCKS §4 (the two quarry score reads, notation-read already): (a) *Blues Riff in C*: the B-natural 4 against the C7 voicing recurs structurally at corresponding places, so it is not a typo and no builder silently rewrites it to B-flat. Keep it as a 12-bar TRANSFER candidate with a harmony and note-choice caveat; it is not the clean canonical beginner MODEL for ordinary C7 and blues note choice until a source-based musical decision says what the B-natural is doing. CLOSED (PARALLEL-UNBLOCKS §4); item 10 (4) is superseded. (b) *La Negra Tiene Tumbao*: the retained bars are repeated non-arpeggiated block-chord attacks, a ponchando or block-chord-guajeo MODEL and not G15's arpeggiated figure. CLOSED (PARALLEL-UNBLOCKS §4); item 10 (3) is superseded for these bars. Neither is an open question in later planning. Still open and unchanged: rights and intake for both scores.

### 8.7 Notation at first print: an owned design seam (2026-10-05)

Added 2026-10-05. The notation-marks and key-signature rows (A1.1 CONTROL, A1.2 MODEL/TRANSFER) left wave 1(a) because repeats, endings, ties and key signatures first appear from 1.1 to 2.4. That is the 1(a) drafter's finding (`briefs/wave1a-views/99-tail.md`): repeat signs from 1.1, first and second endings from 2.3, a coda at 2.4, ties at 1.5, 2.2 and 2.3 before 2.4 teaches them, and key signatures at 1.5 and 2.2 before 3.1. A sentence at 2.3-2.5 or a section at 3.4 would leave earlier prints unexplained, so the reverse condition of wave 1(a) applies.

The seam is owned, not dropped. It must decide mark by mark whether the learner is taught the mark at first print or the early item that prints it moves (several of those items carry the 425 audit's MOVE verdict). A generic paragraph at 2.3-3.4 does not satisfy it. **Wave one is not complete until that seam has its decision.** The outside reviewer's ruling (`docs/review/responses/5831d42d.md`) approves the move out of the correction batch and requires it to be recorded as an owned design seam, so the removal is never a silent omission.

Consumed 2026-10-05 from PARALLEL-UNBLOCKS §3 (the per-mark decisions), taken as the decisions of this seam. The evidence anchor is `briefs/wave1a-views/99-tail.md`; published methods do not require one ordering (one introduces marks cumulatively, another teaches endings and D.C. later), so the decision follows the learner's actual encounter and not an external grade crosswalk.

| Mark | First printed | Decision |
| --- | --- | --- |
| Repeat sign | 1.1 (Kum Ba Yah) | TEACH AT FIRST ENCOUNTER, minimally: one short sentence before the tune (a double bar with dots means go back to the matching repeat or the start and play that section again). Keep the tune if it keeps its musical job; 1.1 does not become a roadmap lesson |
| Key signature | 1.5 (The Water Is Wide) | MOVE The Water Is Wide off 1.5 rather than teach four premature concepts (eighths, dotted values, ties, the G signature); it already carries the 425 audit's MOVE verdict |
| Key signature | 2.2 (Alouette in F, Swing Low in G) | TEACH MINIMALLY at 2.2, where the retained F and G material needs it: the sharps or flats right after the clef apply throughout unless cancelled; read F major's B-flat and G major's F-sharp. Later 3.x keeps broader key-signature fluency, not first exposure |
| Tie | 1.5 | MOVE the overloaded 1.5 case; do not teach ties at 1.5 to save it |
| Tie | 2.2 and 2.3 | One sentence at the earliest retained 2.x score that genuinely uses a tie (the same pitch joined by a curve: strike once and hold through both values). The builder names that exact retained score before editing text. If the tie is only editorial and an equally good owned item can replace it without losing its job, moving it is acceptable. 2.4 stays the full tie, slur and dotted-rhythm lesson, including tie versus slur |
| First and second endings | 2.3 (Was wollen wir trinken) | TEACH BRIEFLY at first encounter: on the first pass take ending 1 and repeat; on the second pass skip ending 1 and take ending 2. A play-the-page sentence, not a theory unit |
| Coda | 2.4 (Ga je mee) | MOVE or REPLACE the early item (to the first later rung that teaches roadmap marks, or an equivalent 2.4 option with no coda) unless coda navigation is made a named learner objective; it is not added to the dense ties, dotted rhythms and dynamics lesson |

Seam acceptance (from the same section): the seam is closed when (1) no retained core item asks the learner to interpret a repeat, key signature, tie, volta or coda before either a minimal first-exposure instruction or an explicit move; (2) the full teaching lesson can still occur later without pretending the mark was unseen; (3) no early lesson gains unrelated notation prose solely to rescue a poor placement. The exact contract (files, sentences, the named retained scores, the moved items' replacements) is drafted separately after the current builder lands, because it touches the same core lesson files. **Wave one is still not complete until that seam lands.** This is a design record, not a dispatch.
