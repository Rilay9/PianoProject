# Generator addendum to the curriculum upgrade (2026-10-05)

**What this is.** `CURRICULUM-UPGRADE.md` (this folder) is the approved plan. It has 16 rows whose needs cell says *generator* and 7 that need an existing exercise placed (counted by `count_upgrade.py`: `NEEDS ... exercise 7, generator 16`). This addendum says how generated material supports the revised plan, so those rows are not built as one-off tweaks. Its job is to make the generator layer that already exists trustworthy and useful. It is not a generator project, and it redesigns no infrastructure.

**Base.** The brief named HEAD `91e6ee47`. The working branch is now at `72850a06`. `git diff --stat 91e6ee47 HEAD` shows two files changed, both under `briefs/`, so every file read here is the same at both commits.

**Evidence marks.**
- `[O]`: observed for this addendum at HEAD. A file and line number, or a count from a read-only script run here (`py -3.11`, music21 10.5.0), is given with it. Where an `[O]` pitch fact comes from music21 reading a file music21 wrote, it is marked *(m21 read)*. That is a plain observation of what the file holds. It is not an independent witness (`verification-tools.md` §0).
- `[R]`: stated by a research report or a track record, not re-checked here.
- `[U]`: stated by `CURRICULUM-UPGRADE.md`.
- `[D]`: an external benchmark claim carried through the dossier or a report. It still awaits the primary-source check that `CURRICULUM-UPGRADE.md` §0 item 4 requires.

**Short names for the sources.**
- **RP**: the v3 restart packet in `docs/prompts/runs/restart-2026-10-05/`.
- **DOS**: `PianoProject_Thorough_Curriculum_Content_Research_2026-10-05.md`, in the same folder.
- **RF**: the cloud research folder `docs/prompts/runs/research-for-*/`. It holds `PACKET.md`, `GENERATED-CONTENT-LENGTH.md` and `reports/`.

Reports are cited by file name and section.

**The reviewer's six corrections (2026-10-05) are applied here:**
1. Dispositions now include MERGE and RETIRE. KEEP needs a consumer: §3.
2. Real models are given in three states: §0.3, §1, §4.
3. Each row resolves to one of four outcomes: §0.2, §1, §4.
4. Partitura is a parser, not a property proof: §2 and every checker in §4.
5. The 20/100 review is a sample that can expand: §5.
6. Every music-claiming family gets ordinary cases plus boundary cases, with exact denominators: §6.

Nobody in this process hears music. Every musical-quality statement here is *unverified as music*.

---

> **Governing note (the owner via the outside reviewer, 2026-10-05).** This addendum is an enabling specification, not a dispatch queue and not a separate generator project. `ABILITY-MAP.md` decides what gets built. A row whose needs cell says "generator" does not by itself create generator work. For each learner need the order is: inspected real music for MODEL and TRANSFER where it works; generation for controlled acquisition or isolation; a generated mini-piece only when real material cannot do the musical job, and then with a notation review. No new generator family is invented to satisfy this document: none of its 16 rows inherently requires one; each resolves as UNCHANGED, EXTEND/FIX, PLACE or REAL. A named-style generator needs an exact published musical definition and a narrow structural contract first; nothing is retuned on titles, metadata or plausibility. Parser agreement verifies file events, not musical correctness. No generic checker harness is built unless several authorised learner-facing consumers need it. Where a real excerpt now supplies a station this document thought absent, the station is updated and the generator work dropped. A generator is touched only when the currently approved learner chain needs controlled material from it.


## 0. Facts that shape the rest

### 0.1 There are two generator layers, and the 16 rows touch both

| Layer | What it is | Size at HEAD | Rows it carries |
| --- | --- | --- | --- |
| **Python families** | `tools/content/generate_exercises.py`. Each family is one `make_*` maker with one contract row in `tools/content/family_contracts.json`. It writes MusicXML through music21. | **57 families.** There are 57 `def make_*` in the code [O grep], 57 contract rows [O], and every maker matches a contract row both ways [O script]. That gives 1,200 items in the built catalog and 1,200 files under `app/public/content/scores/generated/` [O]. DOS §3.1 says "56"; that count is stale. | 10 of the 16 |
| **App drill kinds** | TypeScript drills generated at runtime. `app/src/engine/sightReading.ts` (3,134 lines, 7 levels, `SIGHT_READING_IN_FORCE = 2`, `:178`) handles sight-reading. `app/src/engine/drills/` (`fromCatalog.ts`, `factories.ts`, `theory.ts`) handles chord, ear, dictation and rhythm drills. | 78 rows in `content/catalog.static.json`, spread over 26 drill kinds; 9 of them are sight-reading [O script] | 6 of the 16 |

Which rungs use what was read by walking every lesson object in `content/curriculum/stage-0..9.json` for strings equal to a catalog id [O script]. "No rung" means no lesson lists the item. Some makers' docstrings say an unlisted item can still be offered through `alternativesFor` concept sharing (for example `generate_exercises.py:5281-5284`). That runtime route was not exercised here.

### 0.2 Four outcomes for a generator-related row (correction 3)

A row's "generator" cell does not by itself create generator work. Each row resolves to exactly one of:
- **UNCHANGED**: an existing family or drill kind is used as it is, perhaps with catalog data changed.
- **EXTEND/FIX**: an existing family or drill kind gets a parameter, a variant or a fix.
- **PLACE**: an existing item is only listed on a rung.
- **REAL**: no generator change, because inspected real material does the job.

None of the 16 rows needs a new family (§4).

### 0.3 Three states for the real-music side (correction 2)

- **ADMITTED**: a score or excerpt whose notation was read and which is already shipped for that job, or admitted for it. The reading is cited.
- **CANDIDATE**: a genre-plan line, a PDMX metadata hit, a staged file on a candidate branch, or a shipped score not yet read for this property. A metadata hit is not evidence that real music already solves the transfer step.
- **NONE FOUND**: the scope of the search is stated, and nothing more is claimed.

---

## 1. Content order rule

For every curriculum need, in this order:
1. **A real, inspected excerpt** wherever it can teach or transfer the skill. This follows the repository-root instructions file's "Reuse before reinvention" section, and `content-mistakes.md` item 14.
2. **Generation for controlled acquisition**, where real music cannot isolate the skill: one cell, every key, a measured number of repetitions, nothing else on the page.
3. **A generated mini-piece** only when inspected real excerpts fail the job. It is job D in §2, and it needs a human notation review.

The 16 generator rows under that rule:

| # | Row (rung) | Real model for the skill | State | Generation limited to | Resolution |
| --- | --- | --- | --- | --- | --- |
| G1 | Reading rows: key signatures and 3/4 (core) | Sight-reading needs unseen material by definition. Transfer comes from shipped core pieces that already print a signature a stage before 3.1 [R `CURRICULUM-UPGRADE` 2.1, "options carry signatures"] | CANDIDATE (for the transfer role; no piece was read for this addendum) | the daily phrase inside the level contract | UNCHANGED plus catalog data, if `unrealisable()` refuses none of the new parameter sets (§4 G1) |
| G2 | Contrary scales start at the unison (technique.4, core 4.1/4.2) | none needed: a canonical drill | — | the whole item | EXTEND/FIX `scale` |
| G3 | Minor four-octave scales, thirds and sixths in all keys, diminished sevenths (technique.8, NICE) | none needed | — | the whole item | EXTEND `scale`, `double_scale` and `seventh_arpeggio` only if the NICE row is accepted; otherwise UNCHANGED |
| G4 | Pop comping in straight eighths (chords-pop.5/7) | NONE FOUND (scope: the seven chords-pop lessons, plus a grep for "comp" over the lessons [R `chords-pop.md:64`]) | NONE FOUND | the pattern-over-loop control | EXTEND `comping` |
| G5 | Blues turnaround, I-IV-I-V variant (blues.5/7) | The shipped twelve-bar pieces were not read at bars 11-12 for this figure. No exercise exists [R `blues-boogie.md:58`] | CANDIDATE | two-bar control in several keys | EXTEND `turnaround` |
| G6 | Minor ii-V-i in shells (jazz.6) | Fly Me to the Moon's standard form ends Bm7♭5-E7-Am7, but the **shipped** file prints a tritone-substituted setting with no ii-V-I in its symbols [R `jazz.md:54,110`]. Insensatez's standard form is built on minor ii-Vs; the shipped lead sheet's symbols were not read for this [R `jazz.md:54`] | CANDIDATE (both) | the chord-by-key control | EXTEND the app `chord` drill (minor key) |
| G7 | Drop-2 drill (jazz.9, NICE) | none | — | the voicing control | EXTEND `seventh_voicing` only if accepted |
| G8 | The 16th-8th-16th ragtime figure (ragtime.5) | Harlem Rag (De Lisle arrangement, staged on the origin `xml-dump-2` and `candidate-packet` branches): the cell is on beat 2 in bars 1, 2, 4, 9, 10 and 12 [R `ragtime.md:88`]. The Tyers edition, which the upgrade wants, is still pending. The Entertainer is shipped but was not read for the cell | CANDIDATE | a one-line rhythm control | EXTEND `rhythm` |
| G9 | A key or tonic before melodic dictation and the tune drill (theory) | Catalog tunes for taking down; theory.9's eight bars by ear already exists [R `theory-ear.md:211`] | CANDIDATE | the key statement plus a dictation prompt | EXTEND app `call-response` dictation and `ear-tune` |
| G10 | Minor-key progressions by ear; keys other than C (theory) | Minor-key catalog pieces were not searched for this | NONE FOUND (not searched) | progression prompts | EXTEND `theory.ts` with minor numerals, used by the `ear-progression`, `harmonic-dictation` and `roman-numeral` kinds |
| G11 | Descending and harmonic intervals (theory.3) | none needed: an aural drill | — | the prompt | EXTEND app `ear-interval` |
| G12 | Bass-line dictation (theory.6/8) | FiloBass walking lines (rights of the source recordings unchecked) [R `generation-toolbox-verification.md` §4]; catalog left hands | CANDIDATE | the bass prompt over a played progression | EXTEND app `harmonic-dictation` (a bass mode) |
| G13 | Habanera bass cell (latin.4) | **Por Una Cabeza**: left-hand onsets 0, 1.5, 2.0, 3.0 in 56 of 66 bars, unbroken over bars 1-14. **The Crave** is the tresillo model: 0, 1.5, 3.0 in 27 of 53 bars [R `latin.md:40-41`, notation read; both shipped, on latin.6]. Bizet's Habanera and Contra Danza: dump pending [U §0 item 3] | **ADMITTED** (Por Una Cabeza, The Crave); CANDIDATE (Bizet, Contra Danza) | the cell alone, every key, side by side with the tresillo | EXTEND `tresillo` |
| G14 | Bossa accompaniment pattern (latin.5; serves jazz.8) | No printed bossa left hand. Insensatez and Só Danço Samba are melody plus symbols (28 and 25 symbols) [R `latin.md:45,90,106`] | NONE FOUND for the pattern. ADMITTED as the application substrate (shipped lead sheets) | the left-hand pattern control | EXTEND `comping` (bossa form) |
| G15 | Arpeggiated guajeo (latin.5/6) | none printed (scope: 13 placements and 5 staged files [R `latin.md:87,90`]) | NONE FOUND | the guajeo control | EXTEND `montuno` |
| G16 | Rock off-beat comping (rock.4/5) | no rock-idiom piano score in the catalog; four archive files rejected [R `CURRICULUM-UPGRADE` 2.14] | NONE FOUND | the pattern-over-loop control | EXTEND `comping` (shared with G4) |

Consumed 2026-10-05 from PARALLEL-UNBLOCKS §1, §2 (rows G14 and G15): **G14**, state: gated on a pattern -> contract supplied (one basic bossa bass pattern; the build still waits for its own brief and the map's wave 3). Straight 4/4, left-hand attacks at 0, 1.5, 2.0 and 3.5, root and fifth roles, the dotted quarter plus eighth realisation; the checker tests exactly that onset set and rejects quarter-note-only roots, tresillo and habanera onset sets; no universal bossa detector and no generator rewrite. The row's 'NONE FOUND for the pattern' is superseded for the pattern source (two teaching pages), while the application substrate stays as admitted. **G15**, state: source-blocked -> primary-source path named: Rebeca Mauleon, *101 Montunos* (Sher Music), public sample pages; the first controlled pattern is one exact published arpeggiated example (Ex. 10, *I-ii-V-IV with Arpeggio*), transcribed with its attacks, durations and chord roles, with no averaged guajeo rhythm; the sibling near-miss is the block-chord (ponchando) pattern, which must fail an arpeggiated-guajeo checker. The row's 'NONE FOUND' is superseded for the pattern source; no admitted score isolates the skill, so no row here becomes REAL. The Result sentence below counts five NONE FOUND (G4, G10, G14, G15, G16): superseded to three (G4, G10, G16).

**Result.** One row has an ADMITTED real model (G13). Six have only CANDIDATES (G1, G5, G6, G8, G9, G12). Five have NONE FOUND (G4, G10, G14, G15, G16). Four need none (G2, G3, G7, G11). No row resolves to REAL, because no admitted excerpt isolates the skill well enough to replace the control. Where a model exists, generation stops at the control step.

---

## 2. The four jobs and their quality contracts

Two rules hold for every job.

**Independent check (correction 4).** The checker derives the claimed property from parsed events and compares it with the contract, which comes from the source:
- the events are onsets, durations, pitches (letter plus octave), staff and hand, key, metre and bars;
- partitura 1.9.0 is the default parser [R `verification-tools.md` §3.1: 116 of 120 files agree with music21 on written notes, 120 of 120 on key and time];
- the facts are compared with the family contract, for example "every bar's left-hand onsets equal {0, 0.75, 1.0, 1.5}".

Agreement between music21 and partitura about a file proves almost nothing about whether a habanera, a ii-V-i or a bossa figure is right. A music21 read-back of a file music21 wrote is not independent at all (`verification-tools.md` §0; `convert.py:1148`, where the writer pads short bars). For app drills, which write no file, the check compares the drill's expected pitch sets with a music21 theory oracle (for example `RomanNumeral(figure, Key)`). There music21 acts as a theory source, not as a reader of its own output.

**Near-miss rule (`content-mistakes.md` items 4 and 5).** Every checker is shown to go red on at least one near-miss the builder did not invent: the sibling figure (tresillo against habanera), a real excerpt, or a shifted onset.

### A. Canonical technical drill: correctness and progression; musicality secondary
- [ ] Notes come from the key and form (music21 scale and spelling, `SEMITONE_INTERVAL`/`up`, never an integer transpose) and are enumerated over every key the maker accepts [R `testing-approaches.md` §3: exhaustive enumeration beats property tests over 12-15 keys].
- [ ] The structural contract holds (start, direction, span, bar count, rhythm), checked from partitura events.
- [ ] Fingering is printed only where a source covers it (`physical.fingering.printed`/`source` in the contract). Chord-member fingerings survive export (`fingered_chord`, R8 in `generation-libraries.md`).
- [ ] The physical gate holds (`family_contracts.py:298-523`: span, rate, leaps, repeats).
- [ ] Practice length is counted in opportunities, not seconds (`GENERATED-CONTENT-LENGTH.md`).
- [ ] No claim is made about healthy movement, tone or relaxation (RP §11 A).

### B. Progressive sight-reading: correctness, bounded difficulty, phrase plausibility
- [ ] A level contract is derived from published progressions, with each parameter's source named (§5): key, metre, values, range, hands, position changes, accidentals, density, length.
- [ ] Every generated phrase meets its level contract on every seed tried. Otherwise it refuses with a named reason (`unrealisable()`, `sightReading.ts:1132`).
- [ ] Bar sums, key, metre and range are read independently from the written MusicXML.
- [ ] Phrase plausibility is judged by a person reading notation, on a sample that expands on any fault (§5). The judgement is reported apart from technical legality.
- [ ] There are enough distinct events that the phrase is read, not recalled.

### C. Named style or pattern drill: source-backed definition plus an exact structural checker
- [ ] The definition is quoted from a named source, primary where one exists. Secondary sources (Wikipedia, method summaries) are marked secondary.
- [ ] The contract is written as onset positions per bar or cycle, durations, the pitch roles (root, chord tone, fifth), the harmony, keys, bars and hands.
- [ ] A structural checker for that one pattern compares parsed events with the contract. There is no general accompaniment detector (`content-mistakes.md` items 1 and 2; RP §11 C).
- [ ] The near-miss set includes the sibling pattern.
- [ ] Enough cycles and chord changes are present to establish the pattern (`GENERATED-CONTENT-LENGTH.md`, "Pattern drills").
- [ ] The promise is "drill" unless §6 approves "music".

### D. Musical mini-piece: only after real excerpts fail
- [ ] A record shows the real options were tried and failed (RP §11 D preference order: real excerpt, then simplified public-domain arrangement, then curated templates, then free generation).
- [ ] Every job-A and job-C check applies to its parts.
- [ ] It passes the outside reviewer's notation review (§6 verdicts). The owner is not the reviewer. Nobody hears it.
- [ ] Contract `heard: false` stays false, and the admission line says *unverified as music*.

---

## 3. Family inventory: all 57 families

**Count.** 57 families [O]. **Promise split** [O script over the `promise` arrays]: 41 drill-only and 16 that claim music. Of the 16, `meter` claims music only for its 12/8 item.

**Disposition rules (correction 1).**
- **KEEP** needs a current rung consumer, or a demonstrated reusable purpose named in the row.
- **FIX** is a demonstrated defect, or a latent one in the code.
- **EXTEND** means a curriculum row needs a parameter or variant.
- **RELABEL** means the promise does not match what the items hold.
- **MERGE** means the family duplicates another.
- **RETIRE** means no consumer and a duplicated purpose.

A music-claiming family's disposition is *provisional* until §6 has run.

**Jobs:** A technical drill · B reading or rhythm control · C named pattern or style · D mini-piece.

**Columns, after the family name:**
- **Job.**
- **Disp.**: the disposition, with its reason.
- **Rungs**: rungs that list the family's items [O]. "Overview" rows are track overview lessons.
- **n**: built items [O].
- **Claimed contract**: from `family_contracts.json`, abridged.
- **Mechanically checkable, and by**.
- **Score review?**
- **Library deletes code?**: from `generation-libraries.md` §2.

The shared trim `pad_final_bar` → `makeRests` (R9a) applies to every family and is not repeated in each row.

| Family | Job | Disp. | Rungs | n | Claimed contract | Mechanically checkable, and by | Score review? | Library deletes code? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| scale | A | **FIX**: 16 of 36 contrary items do not start at the unison [O *(m21 read)*, every `*contrary*` file] (§4 G2) | 2.5, 3.1, 3.3, 4.1, 4.2, classical.3/6-9, practice.5, ragtime.6/7, technique.4/5/8 | 252 | scale notes and order; fingering where sourced (Clementi Op. 42, Kelley) | yes: first onsets per staff, mirror steps, from partitura events; key enumeration | no | no (already music21, R1/R2) |
| arpeggio | A | KEEP: 13 rungs | 3.6, 4.3, classical.5-9, holiday.5/6, ragtime.7, technique.4-6 | 60 | triad arpeggio, 2 or 4 octaves; Kelley fingering | yes | no | no |
| triad_inversions | A | KEEP | 4.3, chords-pop.4, classical.7-9, hymns.4, technique.4 | 24 | root position and two inversions | yes | no | no |
| five_finger | A | KEEP | 1.1, 1.3, 2.1, 3.1, practice.1-5 | 48 | five-finger up and back | yes | no | no |
| hanon | A | KEEP: printed from the Mutopia edition | 4.4, 4.6, classical.4-9, ragtime.6-8, technique.4/5 | 60 | Nos. 1-20 as printed | yes, against the edition | no | no |
| chromatic | A | KEEP. Note: an integer transpose at `:1418` builds the run; spelling is not verified here | classical.7-9, ragtime.8, technique.4/6 | 16 | chromatic scale, McLain fingering | yes, plus spelling against McLain ch. 9 | no | no |
| seventh_arpeggio | A | KEEP | blues.4/5, chords-pop.5, classical.7-9, jazz.5, ragtime.8, technique.6 | 60 | four-note seventh arpeggio | yes | no | no |
| double_scale | A | KEEP (EXTEND only if G3 is accepted) | technique.7 | 8 | parallel diatonic thirds or sixths | yes | no | no |
| octave_scale | A | KEEP | latin.7, rock.7, technique.7 | 25 | scale in octaves, solid or broken | yes | no | no |
| broken_seventh | A | KEEP: the length finding [R `GENERATED-CONTENT-LENGTH.md`, 3.8 s] was already fixed in code; the figure repeats, 7.6 s [O `:1786-1790`] | technique.7 | 36 | 1-3-5-7-5-3 over two octaves, twice | yes | no | no |
| rhythm | B | **EXTEND**: a 2/4 row for 16th-8th-16th (G8) | 1.2, 1.4, 2.2, 2.4, 4.5, blues.3-5, improv.5, jazz.3/4, ragtime.5-8, overviews | 18 | one-line rhythm patterns (`RHYTHM_PATTERNS` `:1829`, `_EXTRA` `:1848`) | yes: onsets and durations | no | no |
| coordination | A | KEEP | 2.1, holiday overview | 10 | RH five-finger walk over a held or changing LH | yes | no | no |
| interval_reading | B | KEEP (seeded, 16 items) | 1.5, 3.4 | 16 | four-bar seconds and thirds in C position | yes | no | no |
| position_shift | B | KEEP | 2.5 | 10 | one marked shift up a fifth | yes | no | no |
| syncopation | B | KEEP: 7 consumer rungs. Titles already name what the items hold (CL15, `:2970-2975`). Revisit as a MERGE into `rhythm` after G8 lands | ragtime.5-8, technique.5/6, latin overview | 2 | a tie across the bar; a sixteenth figure over held chords (holds 16-8-16 twice, `:2992`) | yes | no | no |
| meter | B (+D at 12/8) | KEEP, provisional (§6) | technique.5/6 | 3 | 5/4 and 7/8 counting; a 12/8 blues that "behaves like the form it names" | partly: grouping and bar sums yes; "behaves like the form" no | yes, the 12/8 item | no |
| hand_independence | A | KEEP | holiday.5, technique.5-7 | 12 | 2:1, 3:1, 2:3, 3:2 | yes | no | no |
| cadence | A | KEEP; plagal items get PLACED on hymns stage 3 (§4 P5) | 2.3, 3.2, blues.3, chords-pop.3/4, classical.6, holiday.3, hymns.2/4, improv.3, overviews | 36 | I-IV-V7-I root or voice-led; plagal I-IV-I | yes: chord pitch classes per bar | no | no |
| accompaniment | C | KEEP. Three named patterns, each needing its own checker (`content-mistakes.md` item 1) | 3.6, classical.3/5, holiday.4, improv.4, rock.6, rock overview | 30 | Alberti, broken or waltz bass over I-IV-V-I | yes, per pattern | no | no |
| oompah | C | KEEP; PLACED on ragtime.5/6 (§4 P1) | 4.7, holiday.4, ragtime.9 | 8 | bass on beat, chord off it, 2/4, two bars per chord | yes | no | no |
| pedal | A | KEEP | 3.5, classical.4 shelf, classical.6, rock.6 | 6 | a pedal change per chord | yes (pedal marks) | no | no |
| repeated_notes | A | KEEP | holiday.7, latin.7, technique.5/6 | 12 | one note 3-4 times, fingers changing | yes | no | no |
| trill | A | KEEP | technique.5/6 | 12 | measured trill or mordent | yes | no | no |
| tremolo_octaves | A | KEEP | blues.5, technique.7 | 12 | octave or thirds tremolo | yes | no | no |
| rotation | A | KEEP | holiday.7, latin.7, technique.6 | 6 | Alberti in sixteenths | yes | no | no |
| articulation | A | KEEP | hymns.4, technique.4 | 8 | one phrase staccato or legato | yes (marks) | no | no |
| shaping | A | KEEP | rock.7, technique.5 | 10 | scale with a hairpin | yes (marks) | no | no |
| voicing | A | KEEP | chords-pop.7/9, holiday.6, hymns.6, improv.9, technique.6 | 5 | four-note chords, top note to sing | yes (notes) | no | no |
| pedal_variant | A | KEEP | holiday.6, hymns.6, rock.6, technique.6/7 | 8 | melody held over changing harmony; half pedal | yes | no | no |
| seventh_voicing | A | **MERGE** with `ii_v_i`: the C rootless items are note-identical in the right hand. `exercise.voicing7.c.rootless-a` and `exercise.ii-v-i.c.rootless` both have RH F4-A4-C5-E5 / F4-A4-B4-D5 / E4-G4-B4-D5; they differ in bar count (3 against 4) and LH root [O *(m21 read)*]. Shell forms differ. A comparison over all 12 keys chooses which family survives before G6/G7 are written | blues.7, chords-pop.8/9, improv.6, jazz.6-8 | 48 | ii-V-I in close, shell, rootless A or B | yes | no | no |
| four_chord_loop | A | KEEP | chords-pop.6, hymns overview | 24 | I-V-vi-IV, root or inverted | yes | no | no |
| slash_bass | A | KEEP | chords-pop.6/8/9, hymns.5, improv.9, hymns overview | 4 | stepwise descending bass as slash chords | yes | no | no |
| turnaround | C | **EXTEND**: I-IV-I-V (G5) | blues.5-7, hymns.6, improv.8, jam.7 | 12 | I-vi-ii-V, iii-VI-ii-V (`TURNAROUNDS` `:4323`) | yes | no | no |
| ii_v_i | A | **EXTEND** (minor form, if the Python side is wanted besides the app drill, G6), after the MERGE comparison above | improv.6, jazz.5/6 | 36 | ii-V-I in shells, guide tones or rootless | yes | no | no |
| tritone_sub | A | KEEP | improv.8, jazz.7/8 | 4 | ii-subV-I | yes | no | no |
| open_voicing | A | KEEP | chords-pop.7/9, improv.7/9, jazz.7, rock.5 | 16 | quartal, sus2, sus4, add9 | yes | no | no |
| walkup | C | KEEP; PLACED on hymns stage 3 (P5) | hymns.5 | 4 | bass walking up into IV, diatonic then chromatic | yes | no | no |
| passing_chord | C | KEEP; PLACED (P5) | hymns.5 | 4 | chord a semitone above the target, first | yes | no | no |
| power_chord | A | KEEP: a weight exercise by design (`:5513-5517`); the rock off-beat goes to `comping`, not here (G16) | 3.3, rock.4 | 3 | root, fifth, octave over i-♭VII-♭VI-♭VII | yes | no | no |
| walking_bass | C (music) | KEEP, provisional (§6) | 4.7, blues.5-9, jam.6, jazz.6/9, latin overview | 28 | root-third-fifth-approach quarters over a blues or ii-V-I | partly: chord tone on beat 1, approach on 4; "music" no | yes | experiment: FiloBass vocabulary (§7) |
| comping | C (music) | **EXTEND**: pop/rock form and straight eighths (G4, G16); bossa left hand (G14) | blues.8/9, chords-pop.9, improv.6, jam.5, jazz.4-6/9, overviews | 58 | ii-V-I or minor vamp comped in one rhythm. Three of five patterns carry no syncopation the app can see (contract `admission`) | yes: onsets against `COMPING_PATTERNS` (`:4108`) | yes | no |
| stride | C (music) | KEEP, provisional; PLACED on ragtime.7 (P1) | blues.7/9, holiday.7, jazz.7/9, ragtime.9 | 4 | bass, chord, tenth, chord under a RH chord | yes (onsets, registers) | yes | no |
| boogie | C (music) | KEEP, provisional; minor-blues items PLACED on blues.6 (P2) | blues.6-9 | 36 | eight-to-the-bar LH over four bars | yes | yes | no |
| blues_scale | A | KEEP | blues.3/4, improv.5, jam.7 | 16 | blues scale up and back | yes | no | no |
| clave | C (music) | **RELABEL** music → drill, provisional: eight bars of single-line rhythm [R `latin.md:89`]; the pattern table is verified correct [R `latin.md:58,74`] | 4.5, latin.3, latin overview | 10 | son, rumba, bossa clave, alone or over a pulse | yes: onsets against `CLAVE_PATTERNS` `:4870` | yes (§6 decides the label) | no |
| tumbao | C (music) | KEEP, provisional | latin.6, latin overview | 5 | tumbao bass over a two-bar minor vamp | yes | yes | no |
| montuno | C (music) | **EXTEND**: arpeggiated guajeo (G15). The current items are clave strokes as chords [R `latin.md:57`] | latin.6, latin overview | 15 | RH montuno of chord tones on the clave strokes | yes | yes | no |
| latin_groove | C (music) | KEEP, provisional | latin.6, latin overview | 5 | tumbao plus two-note montuno, eight bars | yes | yes | no |
| secondary_rag | C (music) | KEEP, provisional; PLACED on ragtime.8 (P1) | ragtime.9 | 1 | short-long sixteenth cell crossing the beat over oom-pah | yes | yes | no |
| intro | C (music) | KEEP **only** if holiday.3 places it (P4), and only after §6. Otherwise RETIRE: no rung lists it [O] | none | 5 | four-bar vamp over I-V-vi-IV, last bar blocked | yes | yes | no |
| riff | C (music) | **FIX** (latent): integer transpose `:5664`. Shipped keys A and C are spelled right [O *(m21 read)*]. A digest must not change | 1.1, 1.5 | 4 | two-bar five-finger figure repeated for eight bars | yes | yes | no |
| pentatonic | A | KEEP | 2.5, 3.1 | 6 | minor pentatonic, thumb under | yes | no | no |
| tresillo | C (music) | **EXTEND**: habanera cell (G13). Fix the integer transpose at `:5806` in the same edit; shipped C, F and G are spelled right [O] | 3.6, latin.3 | 3 | 3+3+2 in dotted quarters in the LH, 4/4 | yes: onsets {0, 1.5, 3.0} | yes | no |
| swing_pair | B | **FIX** (latent): integer transpose `:5860`. Shipped C, F and G are right [O]; a digest must not change | 2.2, jazz.3 | 3 | four straight bars, a silent bar, the same marked swing | yes | no | no |
| modal_vamp | C (music) | **FIX** (latent): integer transposes `:5940-5948`. They would print G♯ for ♭VI in C minor [R `generation-libraries.md` R4a]. Shipped A, D and E are right (D gives B♭) [O]. This corrects RF `PACKET.md` C4's "not confirmed: no transpose call there" | 3.3, rock.4 | 3 | i-♭VII-♭VI-♭VII vamp, open fifths under the chords | yes | yes | no |
| ostinato | C (music) | KEEP, provisional | 2.1, 3.3, holiday.5, rock.4/6 | 6 | one eighth figure over a held bass | yes | yes | no |
| study | D (music) | **RETIRE**, provisional: no rung lists any of its 24 items [O]. It duplicates the phrase job of `sightReading.ts`; both use one evaluator (the twin, R14). Kept only if §5 finds the Python realiser's phrases better and a rung adopts them after §6 | none | 24 (seeds 1-3) | 8-16-bar study in four-bar phrases with cadences; the musical gate is `musical_evaluator.py` | partly: cadence and phrase structure yes; "reads as a piece" no | yes | `study.py` chord spelling → `RomanNumeral`, ~25 lines (R4) |

**Not a family: the authored blues route.** `blues_forms.py` writes `exercise.blues.twelve-bar-shuffle.*` (for example on core 4.7). Line 28, `tonic_pitch.transpose(step)`, is the semitone spelling site that RF `PACKET.md` C4 confirmed. Its shipped keys are C, F, G, E and A, which are unaffected. Disposition: FIX (latent), with a byte-identical digest required.

**Dispositions: 57 in total.**

| Disposition | Count | Families |
| --- | --- | --- |
| KEEP | 44 | 9 of them provisional, because they claim music: meter, walking_bass, stride, boogie, tumbao, latin_groove, secondary_rag, intro, ostinato |
| FIX | 4 | scale (live); riff, swing_pair, modal_vamp (latent) |
| EXTEND | 6 | rhythm, turnaround, ii_v_i, comping, montuno, tresillo |
| RELABEL | 1 | clave |
| MERGE | 1 | seventh_voicing with ii_v_i |
| RETIRE | 1 | study, provisional |

---

## 4. Row mapping

Each block below gives:
- the rung or rungs;
- the family, with the smallest change;
- the source definition and its status;
- the exact contract;
- the independent checker;
- the transfer step.

Sources marked `[D]` go through the primary-source check in `CURRICULUM-UPGRADE.md` §0 item 4 before any build.

### Generator rows (16)

**G1 Reading rows: key signatures and 3/4.** Rungs: core sight-reading rows.
- *Placements* [O]: `sight-reading-1` (1.5), `-1-left` (1.3, 1.4), `-2-right` (2.2, 2.5), `-2` (3.4, classical.3), `-3` (4.5, 4.6), `-4` (4.6, technique.5).
- *Family*: app sight-reading. UNCHANGED plus data.
  - Level caps already allow keys: L2 and L3 take one sharp or flat, L4 two (`sightReading.ts:352-458`, `maxFifths`).
  - `metresAsked` accepts any metre list (`:1104-1107`).
  - Change only `fifths`/`timeSig` in `catalog.static.json`.
- *Source* `[D]`: ABRSM 2025-26 sight-reading table. G1 brings G and F major and 3/4; G2 D major [R `curricula-and-mutopia.md` §1a].
- *Contract*:
  - `timeSig: ["4/4","3/4"]` on `-1-left`, `-1` and `-2-right` (3/4 from 1.4);
  - `fifths: [-1,0,1]` on `-2` and `-3` (from 3.1);
  - `fifths: [-2..2]` on `-4`.
  - "Two accidentals by 4.2" is reachable only on L4 rows. The L3 rows at 4.5 and 4.6 cap at one. The batch either accepts that cap or adds an L4 row. A level-table change is a generator change and is versioned.
- *Checker*:
  - `sightReadingReport` returns no refusal for each new parameter set;
  - phrases over seeds 1-30 per row are written to MusicXML through `musicXmlWriter.ts`;
  - partitura reads them, and from its events the check derives: fifths in the allowed set, metre in the allowed set, bar sums in divisions, pitches diatonic to the key (unless `accidentals`), and range within the level's `rhKey`/`lhKey`.
  - musicxml-io already read 14 of 14 runtime phrases correctly [R `PACKET.md` D].
- *Transfer*: shipped core pieces in G, F and 3/4 (CANDIDATE).

**G2 Contrary scales start at the unison.** Rungs: technique.4, core 4.1 and 4.2. Family `scale`: FIX.
- *Source* `[D]`: "hands beginning on the key-note (unison)", Grades 1-7. This comes from a third-party compilation [R `technique.md:15`]; confirm it against the official ABRSM 2025-26 PDF. RCM Prep B has C contrary, one octave, hands together [R `curricula-and-mutopia.md` §1a].
- *Observed defect* [O *(m21 read)* of all 36 `exercise.scale.*contrary*` files]: 20 start at the unison and 16 do not.
  - 10 one-octave items start with the LH an octave **below**: A♭, A, B♭, B, G♭, G major; A, B♭, B, G harmonic minor.
  - 6 two-octave items start with the LH an octave **above**, so the hands cross: C, D♭, D, E♭, E, F.
  - The other 6 two-octave items (A♭, A, B♭, B, G♭, G) start at the unison.
  - Mechanism: `generate_exercises.py:1085-1101`. The LH starts at its own preferred octave, and the contrary run reads from the top of that range.
  - This corrects the technique record's "all twelve two-octave contrary files have the same construction" [R `technique.md:102`] and the upgrade's "twelve" [U 2.3]. The real set is 16 items in two shapes.
- *Contract*, for every contrary item:
  - the first onsets of the two staves have equal letter and octave;
  - the RH ascends `octaves`×7 scale steps and the LH mirrors it step for step;
  - both return to the start;
  - key, rhythm, bars and the source fingering tables are unchanged;
  - the version bumps (G21). Items whose notes do not change keep continuity through `generator_continuity.json`'s digest relation.
- *Checker*: on partitura events, assert first-onset equality per item, then mirror symmetry in scale degrees at every index. Run over all 36 items, and over every key the maker accepts.
- *Text*: `technique.4.md:26-30` ("the left hand begins on the C above").
- *Transfer*: none by contract.

**G3 technique.8 breadth (NICE).** `scale` (minor, four octaves), `double_scale` (all keys), `seventh_arpeggio` (diminished sevenths, which already exist for the minors, `:6113`). Source `[D]`: ABRSM Grade 8 and RCM Level 10. Only if the owner accepts the NICE row.

**G4 Straight-eighths pop comping.** Rungs: chords-pop.5 or 7. Family `comping`: EXTEND with a form `pop-loop` over `FOUR_CHORD_LOOP` (I-V-vi-IV), using triads (the existing `intro` tier mechanism).
- *Source* `[D]`: Berklee Pop/Rock Keyboard outline, "quarter- and eighth-note accompaniment patterns", "syncopated pocket" [R `chords-pop.md:19`]. It is an outline with no notation, so the pattern offsets must come from a printed method, and that source is still to be named.
- *Contract*:
  - 4/4, 4 bars, plus an 8-bar practice set;
  - RH triad of the bar's symbol on the sourced offsets, at least a straight-eighths pattern and one syncopated-attack pattern;
  - LH root in halves or wholes;
  - no swing marking, and no "swing" concept tag. Today every non-latin comping item is tagged "swing" (`:4255-4256` [O]), and the new form must not inherit that tag.
- *Checker*: from partitura events, RH onsets per bar equal the offsets, RH pitch classes equal the triad, and there is no swing direction text (raw-XML read).
- *Transfer*: NONE FOUND. The learner applies the pattern to their own song.

**G5 Blues turnaround, I-IV-I-V.** Rungs: blues.5 or 7. Family `turnaround`: EXTEND. Add the variant `I-IV-I-V` = [(0,"7"),(5,"7"),(0,"7"),(7,"7")] at a half-bar each.
- *Source* `[D]`: PianoGroove 12-bar variations; "turnarounds end on V7" [R `blues-boogie.md:13,17`]. These are secondary sources.
- *Contract*: two bars of 4/4; I7, IV7 | I7, V7; intro (triad) and standard (shell) tiers as now; the keys the family uses (C, F, B♭, E♭ [O]); the last chord is V7.
- *Checker*: from partitura events, sounding pitch classes per half-bar include the root, third and seventh of the contract chord; chord-symbol text is read from raw `<harmony>` (partitura's ChordSymbol alteration fields are unverified [R `verification-tools.md` §1]); the near-miss is I-vi-ii-V failing.
- *Transfer*: bars 11-12 of the shipped twelve-bar pieces (CANDIDATE, not read).

**G6 Minor ii-V-i in shells.** Rung: jazz.6.
- *Family*: the app `chord` drill (`drill.jazz.ii-v-i-shells`, now on chords-pop.5 and jazz.5 [O]). EXTEND with a `mode: "minor"` parameter.
- *Why this cannot be done with data alone* [O]: `shellChord` counts degrees on the **major** scale (`theory.ts:353-380`). A minor-key `i` would come out C-E-B, a major-seventh shell: a wrong chord. `romanToChord` reads `ø` (`:313-324`) but takes its roots from `MAJOR_DEGREES`.
- *Musical fact for the lesson*: the root-3-7 shell of iiø7 is the same as that of iim7, because the ♭5 is not in the shell. The contract must either add the fifth (a four-note iiø7) or say that the shell cannot show the half-diminished quality.
- *Source* `[D]`: Berklee Jazz Piano week 8; Jazz Piano Online lists major and minor ii-V-I [R `jazz.md:18`]. Choose the tonic quality (im7, im6 or im(maj7)) from the primary source.
- *Contract*: two or three minor keys tied to core 4.2 and theory.5/7 (the batch confirms which); iiø7, V7, i; expected pitch-class sets per chord.
- *Checker*: a fixture of `music21.roman.RomanNumeral(fig, key.Key(t))` pitch classes for every figure and key, compared with the drill's `expected` (music21 as theory oracle; no file involved).
- Python `ii_v_i` minor items are optional, and come only after the MERGE comparison (§3).
- *Transfer*: Fly Me to the Moon (the shipped edition does not print the progression) and Insensatez (symbols not read). Both are CANDIDATE.

**G7 Drop-2 (NICE).** `seventh_voicing` EXTEND with a `drop2` voicing, after the MERGE decision. Only if accepted.

**G8 The 16th-8th-16th figure.** Rung: ragtime.5. Family `rhythm`: EXTEND with one `RHYTHM_PATTERNS_EXTRA` row in 2/4.
- *Source*: the rag lesson's own "short-long-short (16th-8th-16th), played straight" (`ragtime.5.md:22-26` [R `ragtime.md:37`]). For a published source, the Harlem Rag reading below.
- *Contract*: 2/4, 4 bars, one line; the cell at onsets b, b+0.25, b+0.75 with durations 0.25, 0.5, 0.25, on beat 1 in some bars and beat 2 in others; no ties; no swing text.
- *Checker*: partitura onsets and durations against the contract. Near-misses: a dotted-eighth/sixteenth pair, and the secondary-rag cell, must fail.
- *Transfer*: the Harlem Rag excerpt (CANDIDATE, Tyers edition pending), then `exercise.oompah.*` under it (P1).

**G9 A key or tonic before dictation.** Rungs: theory.4 and 5 (`drill.ear.melodic-dictation`), theory.8 and 9 (`drill.ear.tune`, `drill.ear.tune-long`) [O]. EXTEND the dictation builders to sound and name the key before each prompt.
- *Source* `[D]`: RCM 2022 Ear Tests, "melody playback with the examiner naming the key" [R `theory-ear.md:19`].
- *Contract*: before each prompt, the tonic triad (or I-IV-V-I) in the prompt key, with the key named; the melody is diatonic in that key and its first note is stated.
- *Checker*: a unit test over fixed seeds. The first playback set equals the tonic triad's pitch classes, and every prompt pitch is in the key's scale.
- *Transfer*: CANDIDATE catalog tunes.

**G10 Minor-key progressions and numerals; keys other than C.** Rungs: the theory ear and numeral rows (`drill.ear.progressions` theory.5, `drill.theory.harmonic-dictation` jazz.6 and theory.6/7, `drill.theory.roman-numerals` chords-pop.6 and theory.6 [O]). EXTEND `theory.ts` with a minor degree table: harmonic minor for V and V7, natural for VI and ♭VII.
- *Source* `[D]`: RCM, i-iv-V-i and i-VI-iv-V in minor [R `theory-ear.md:78`].
- *Contract*: numerals i, iv, V, V7, VI, ♭VII in minor keys, plus the existing major rows transposed to the keys named in the data.
- *Checker*: the same music21 RomanNumeral fixture as G6, enumerated over every numeral and key.
- *Reuse before writing*: test Tonal 6.4.3 `Key.minorKey` against that fixture. Its chord lists are correct [R `generation-toolbox-verification.md` §1]. `Progression.fromRomanNumerals` is not usable: it loses the minor.
- *Transfer*: NONE searched.

**G11 Descending and harmonic intervals.** Rung: theory.3 (`drill.ear.intervals-within-octave`). EXTEND `earIntervalDrill` with a `direction: up | down | harmonic` parameter. Today it always plays `[root, root + size]` ascending (`factories.ts:183-205` [O]).
- *Source* `[D]`: RCM tests ascending, descending and harmonic intervals [R `theory-ear.md:81`].
- *Contract*: down = [root, root − size], ordered; harmonic = both notes at `atMs` 0, expected as an unordered set; the tritone labelled A4/d5.
- *Checker*: a unit test enumerating every size × direction.

**G12 Bass-line dictation.** Rungs: theory.6 and 8. EXTEND `harmonic-dictation` with a `bass` mode that plays the progression and expects the bass notes in order (any octave).
- *Source*: the dossier's §2.4 recommendation [D]; RCM's top-level "melody plus a harmonised left hand" [R `theory-ear.md:19`].
- *Contract*: progressions from the row's existing parameters; the tonic is given first; expected[i] = the bass of chord i (the root, or the inversion's bass where the figure says so).
- *Checker*: the music21 fixture gives the bass pitch class per figure.
- *Transfer*: FiloBass, CANDIDATE, as walking lines for jazz.6/8 (rights unchecked).

<a id="G13"></a>
**G13 Habanera bass cell.** Rung: the new latin.4. Family `tresillo`: EXTEND with a `cell: tresillo | habanera` parameter and a `timeSig` parameter.
- *Source*: the upgrade's definition [U §0 item 3]: dotted eighth, sixteenth, eighth, eighth in 2/4, compared with the tresillo (3+3+2). The Wikipedia Habanera and Tresillo pages agree (secondary) [R `latin.md:16-17`]. The primary check reads a printed habanera; Bizet's Habanera is being dumped [U].
- *Contract*:
  - 2/4; every bar's LH onsets {0, 0.75, 1.0, 1.5}, durations 0.75, 0.25, 0.5, 0.5;
  - the root on onset 0, the other onsets chord tones of the bar's chord, with harmony from the source (for example i-V7 over two bars);
  - keys C, F and G as now, minor forms only if the source says so;
  - 8 bars; the LH carries the cell and the RH holds the chord, as `make_tresillo` does (`:5797-5806` [O]).
  - The **tresillo** in the same notation is onsets {0, 0.75, 1.5}, written as new items in 2/4. The existing 4/4 tresillo v2 items stay as they are.
  - In the same edit, replace the integer transpose at `:5806` with interval spelling. For C, F and G the digest must not change.
- *Checker*: onset sets per bar from partitura's LH events. Every tresillo bar must fail the habanera check, and the reverse. **Por Una Cabeza bars 1-14** LH, read by partitura with values doubled (4/4: 0, 1.5, 2.0, 3.0), must pass. That is a real example the builder did not choose.
- *Transfer*: Por Una Cabeza and The Crave (ADMITTED); Bizet and Contra Danza (CANDIDATE).

**G14 Bossa left-hand pattern.** Rungs: latin.5, referenced from jazz.8. Family `comping`: EXTEND the `bossa` form. It already puts the bossa-clave RH stabs over `LATIN_VAMP` with a whole-note LH root (`:4886`, `:4247` [O]). Add the sourced bossa bass.
- *Source*: **not yet named.** No bossa bass definition has been read in this process. A published Brazilian or bossa piano method must supply it before any code is written. Until then the row is blocked, and nothing may be invented.
- *Contract fields to fill from that source*: the cell length (one or two bars), onsets, the root and fifth roles, the keys (`LATIN_VAMP` minor), and the bars.
- *Checker*: onset sets and root/fifth pitch classes per bar, from partitura events, against the sourced cell.
- *Transfer*: the learner applies it to Insensatez and Só Danço Samba (ADMITTED as substrate).

- Consumed 2026-10-05 from PARALLEL-UNBLOCKS §1 (G14 contract): *Source* above ('not yet named') is superseded: Piano With Jonny, *Learn How to Play Bossa Nova Piano in 5 Steps*, step 4 (left-hand sequence stated), and ChordRhythm's bossa nova piano pattern page (root to fifth, dotted quarter plus eighth, several variants stated); the Berklee jazz and latin syllabi support bossa as a distinct taught style and expose no notation. *Contract fields*: one bar of 4/4, straight eighths, no swing; left-hand attacks at onsets 0, 1.5, 2.0 and 3.5 (eighth-grid positions 0, 3, 4, 7); bass-only acquisition variant: root 0 for 1.5 beats, fifth 1.5 for 0.5, root 2.0 for 1.5, fifth 3.5 for 0.5; roles root and fifth only; the 3.5 pickup is the next chord's fifth only in a labelled anticipation variant; the `LATIN_VAMP` minor key choice and the bar count are for the build brief. *Checker*: independent read of the LH attacks, exactly the onset set and root or fifth membership per bar against the written harmony; must reject quarter-note roots on beats 1 and 3 only, tresillo and habanera onset sets, and a syncopated RH chord pattern with no stated bass contract. The exercise says it is one basic bossa bass pattern, never 'the bossa rhythm'. *Transfer*: Garota stays MODEL and TRANSFER evidence (a script compares its LH with this pattern afterward) and does not define the pattern; Insensatez and Só Danço Samba stay the application substrate.

**G15 Arpeggiated guajeo.** Rungs: latin.5 or 6. Family `montuno`: EXTEND with a variant `guajeo`.
- *Source*: Wikipedia Guajeo and Montuno (secondary): an arpeggiated chord-tone ostinato, two bars, aligned to the clave, usually octave-doubled. Mauleón's *101 Montunos* is cited and not read [R `latin.md:19`]. Read the primary source first.
- *Contract*: a two-bar period repeated; single notes, or exact octave doublings, from the chord tones of each bar; the onset pattern from the source, aligned to a named clave side.
- *Checker*: from partitura events: pitch classes ⊆ the chord tones; no simultaneity other than exact octaves; the two-bar period repeats; onsets match the sourced pattern. Near-miss: the existing chordal montuno fails.
- *Transfer*: NONE FOUND.

- Consumed 2026-10-05 from PARALLEL-UNBLOCKS §2 (G15 contract): *Source* above ('read the primary source first') is consumed: Mauleon's *101 Montunos* sample p. 40, Ex. 10 *I-ii-V-IV with Arpeggio* (2-3 clave marked), with Ex. 11 and p. 83 Ex. 47 as context. *Contract*, superseding the two-bar-period, octave-doubling and 'pitch classes within the chord tones' shape given above where it differs from the page: the figure is whatever Ex. 10 prints, encoded with its exact attacks, durations and chord-tone roles; no averaged guajeo; the categorical rules are a short repeating ostinato, a syncopated profile, content that outlines the current harmony, in the arpeggiated subtype successive attacks that change pitch content through chord tones (never one block voicing struck repeatedly), at least two cycles before a variation, one clave orientation inside one control. *Checker*: the sourced figure's onsets and roles; *near-miss*: the block-chord (ponchando) figure must fail the arpeggiated-guajeo checker. *Transfer*: still NONE FOUND for the arpeggiated figure; *La Negra Tiene Tumbao* is a MODEL for the block-chord side only. No universal guajeo detector is authorised. Open: whether encoding a transcription of this published example may ship publicly (a rights record, as the map's amendment 5.4 does); the transcription is checked against the page by a reader.

**G16 Rock off-beat comping.** Rungs: rock.4 or 5. Family `comping`: EXTEND. Use the existing `off-beats` offsets [0.5, 1.5, 2.5, 3.5] (`:4110` [O]) and the syncopated attacks from G4, over a rock form (I-IV-V, or i-♭VII-♭VI-♭VII from `POWER_CHORD_ROOTS` `:5500`), straight, with triads or power-chord dyads.
- *Source* `[D]`: Berklee Pop/Rock weeks 6-8 [R `rock-metal.md:77`]. Name a printed source for the patterns.
- *Contract and checker*: as G4. `power_chord` is unchanged.
- *Transfer*: NONE FOUND. rock.8 uses learner-supplied material.

### Exercise placements (all PLACE: data only, no family change)

| # | Row | Items [O exist in the built catalog] | Today [O] | Check |
| --- | --- | --- | --- | --- |
| P1 | Oom-pah, stride and secondary rag on the ragtime rungs | `exercise.oompah.c.octave` and `.f.octave` → ragtime.5; `exercise.oompah.*.tenth` → ragtime.6; `exercise.stride.c` → ragtime.7; `exercise.secondary-rag.c.4bar` → ragtime.8 | oompah on 4.7, holiday.4 and ragtime.9. The upgrade's "oompah ... stage 9 only `[V]`" misses the two stage-4 listings. stride on blues.7/9, holiday.7, jazz.7/9, ragtime.9; secondary-rag on ragtime.9 only | the rung audit's level band, and demands against prerequisites (existing `rung_audit.py`) |
| P2 | Minor blues on blues.6 | `exercise.boogie.{c,f,b-flat,e-flat}.{pinetop,root-fifth,walking-eighths}.minor-blues` (12) and `exercise.walking-bass.{c,f,b-flat,e-flat}.minor-blues` (4) | on no rung | as P1. The boogie and walking_bass audits (§6) run first, since both claim music |
| P3 | Rhythm rows on theory.4/5 | `drill.rhythm.eighths`, `.dotted`, `.six-eight` | on 2.2/practice.3, 2.4/practice.5 and 4.5. These are reading drills. If the row means rhythm **dictation**, a data row with `mode: "dictation"` and those values is needed; whether `buildRhythmDrill` supports values in dictation mode was not checked | none beyond data |
| P4 | Intro exercises on holiday.3 | `exercise.intro.{a,c,d,f,g}.4bar` | on no rung | `intro` claims music: the §6 verdict gates the placement |
| P5 | Walk-up, passing-chord and plagal drills on hymns Stage 3 | `exercise.walkup.c`, `exercise.passing-chord.c` (now on hymns.5), `exercise.cadence.c.plagal` (12 plagal items, none on the stage-3 `hymns` lesson) | the stage-3 `hymns` lesson lists `exercise.cadence.c.voice-led`, `slash-bass.c`, `loop4.c.inversions` | as P1 |
| P6 | Chords-pop comping (the exercise half) | `exercise.comping.c.anticipated` is already on chords-pop.9; the straight variant is G4 | — | — |
| P7 | jazz.8's chord-tone step reuses the improv.6 exercises (the needs cell names exercises but asks for no generator) | the improv.6 options | — | prerequisite data |

**Summary.** 16 of 16 generator rows map to an existing family or drill kind with no new family. 10 are Python families; 6 are app drill kinds. Resolutions: 1 UNCHANGED plus data (G1, conditional on no refusals); 13 EXTEND/FIX; 2 NICE rows that become EXTEND only if accepted; 0 REAL. Two rows are blocked on an unnamed source (G4's offsets, and G14 entirely). One row, G6, needs a code fix before data can express it.

---

## 5. Lane brief: the sight-reading experiment

**Purpose.** Find out whether the existing sight-reading generator (`sightReading.ts`, 7 levels, v2) writes material that is level-correct against published progressions and reads as plausible phrases. Compare its phrase logic with a phrase-cell approach before adopting any dataset. This lane does not rebuild the generator.

**Known facts the lane starts from:**
- **VERIFIED [O]**:
  - every level is diatonic major only (`MAJOR_STEPS`, `sightReading.ts:272-293`); no phrase is ever in a minor key;
  - L1 writes whole notes and no eighths (`:353-364`);
  - candidate search keeps 16 draws and scores them with the phrase evaluator (`CANDIDATES` `:1590`, `SCORE_TOLERANCE` `:1614`).
- **PUBLISHED, as read by a report**: ABRSM Initial sight-reading includes D minor and a quaver pair, with whole notes from Grade 2 [R `curricula-and-mutopia.md` §1a].
- **HYPOTHESIS**: the levels diverge from published order on minor keys and on note values. The lane tests this. App levels are not exam grades, so a divergence is evidence for a decision, not automatically a defect.

**Step 1. Level specification.**
- Derive one contract per level from three sources:
  - **ABRSM** 2025-26 Piano syllabus, sight-reading table p. 16. It is cumulative. A report read it from the official PDF, with the note-value glyphs checked on the rendered page [R `curricula-and-mutopia.md` "Sources used"]. That local copy (`build/ct1/`) is not in this repo [O `ls`], so obtain the official PDF again.
  - **RCM** 2022 Piano Syllabus (the published URL is in that report). The report's local copy was *inferred* to be that file. L1-L3 note values were render-read. **The L1-L3 time signatures and the Prep A/B note values are UNVERIFIED.**
  - **Faber**: the *Piano Adventures* correlation chart, May 2017, text-extracted with blurred columns. It gives concept placement only.
- The ABRSM technique compilation (`margaretdentonpiano.com`) is a third-party transcription. It covers technique, not sight-reading, and is not used here. The upgrade's track records cite a 2023-24 ABRSM PDF; the lane uses 2025-26.
- Each level parameter carries its source line: keys and modes, metre, values, range, hands, position changes, accidentals, articulation, density and length.
- The spec is derived from those sources, not copied. Where the app's rung order deliberately differs, the spec says so.

**Step 2. Generate 100 items with fixed seeds.**
- **Distribution**: L1 12, L2 14, L3 14, L4 15, L5 15, L6 15, L7 15.
- **Seeds**: level × 1000 + k, for k = 1 to n.
- **Parameters** are spread over each level's legal set: both extreme keys, every metre allowed, and every hand configuration.
- Version 2 is used and recorded per item.

**Step 3. Check all 100 mechanically against the level contracts.**
- Each phrase is written to MusicXML through `musicXmlWriter.ts`.
- partitura parses it, and from the events the check derives: key, metre, bar sums, values used, range per hand, accidentals, leaps, hands-together share and length.
- These are compared with the step 1 spec, not with `levelFacts`, which is the generator's own table and so not independent.
- musicxml-io is a second reader where partitura disagrees.
- The result is a table of 100 rows × parameters, with every failure named.

**Step 4. A person reads a fixed 20 of the 100 for phrase plausibility.**
- **The sample is deliberate, not random or even** (correction 5): at least 2 per level, every parameter boundary hit in step 2, and the cases step 3 flagged nearest a limit.
- **The judgement is separate from technical legality**: question and answer, cadence, motif reuse, contour. Each item gets PLAUSIBLE, WEAK or IMPLAUSIBLE, with a reason.
- **The denominator is reported as 20/100.**
- **Expansion rule.** If the sample shows a systematic defect, a boundary failure or a suspicious subgroup, the read expands to every item in the affected stratum (that level, metre, key extreme or hand configuration), and then to fresh seeds of that stratum, until the defect is bounded. 20/100 never approves a whole level or the generator.
- The reader is the outside reviewer, reading notation. Hearing is not performed and never claimed.

**Step 5. Compare phrase logic.**
- **Contenders**: the current draw-and-score approach, and a phrase-cell approach (2- and 4-bar templates: statement, answer, sequence, cadence; DOS §3.2 B and §7C experiment 2).
- **Source for the cells**: Nottingham (ABC melodies with chords; GPL-3.0; drop the tunes with a named composer; 7 of 340 jigs had quirks [R `datasets-and-generators.md` §1.8]). Essen is also possible: 8,514 tunes in music21's corpus [R `PACKET.md` C7]. Its CCARH licence forbids embedding in teaching material [R `datasets-and-generators.md` §1.5]; under the owner's rule that is recorded as information.
- **Method**: 10-20 cells are extracted by a script with provenance per cell, and 20 phrases are realised per contender at L3 and L5 with fixed seeds.
- **Measures**: the step 3 legality table; the evaluator score (`musical_evaluator.py`); and the same deliberate 20-item read, blind to the contender. 
- The Python `study` realiser is a third contender and settles that family's RETIRE (§3).
- **Adoption rule**: a dataset is adopted only if its phrases are measurably better on the read (the PLAUSIBLE share) at no loss of legality.

**Finish condition.** The lane delivers:
1. the level spec with a source per parameter;
2. the 100-row legality table;
3. the 20/100 read, plus any expansions, with reasons;
4. the phrase-logic comparison table and a recommendation: keep, adopt cells, or adopt the study realiser;
5. a list of the level-table changes it would make. Each is a versioned generator change, and none is made in this lane.

**Stop and report if:**
- an official syllabus PDF cannot be obtained, in which case that source's parameters are marked third-party or unknown;
- `unrealisable()` refuses more than 10% of the planned parameter sets;
- partitura and musicxml-io disagree on more than 2 of the 100 files;
- the first 20 read show an IMPLAUSIBLE share above a third. In that case expand first and do not proceed to step 5.

---

## 6. Lane brief: audit of every family that claims music

**Families.** 16 [O, `promise` arrays]: meter (12/8 only), walking_bass, comping, stride, boogie, clave, tumbao, montuno, latin_groove, secondary_rag, intro, riff, tresillo, modal_vamp, ostinato, study. DOS §7C's "14" is stale.

**Seeds and cases.** Only `study` takes a seed (seeds 1-3 shipped [O]). Every other family is deterministic for a given parameter set (`generator.seed: null` [O]). So the corpus has two kinds of case (correction 6):
- **O**: ordinary shipped items chosen to cover every variant value at least once;
- **B**: boundary or adversarial cases rendered fresh: the most sharps and most flats the maker accepts, the extremes of `bars`, and other variants.

A maker that refuses a case gives a result too: the refusal is recorded.

| Family | O (shipped) | B (fresh: maker arguments) | Denominator |
| --- | --- | --- | --- |
| meter | all 3 (5/4, 7/8, 12/8) | none: no key or length parameter | 3 |
| walking_bass | 6 covering blues, ii-V-I, minor-blues × intro/standard | ("F#","blues"), ("D-","ii-V-I"), ("B","minor-blues","intro") | 9 |
| comping | 6: each of 5 patterns in C standard, plus one intro tier | ("F#","off-beats"), ("G-","bossa"), ("B","charleston","intro") | 9 |
| stride | all 4 | ("B"), ("G-") | 6 |
| boogie | 6: 3 patterns × blues/minor-blues | ("F#","pinetop"), ("D-","walking-eighths","minor-blues"), ("B","root-fifth") | 9 |
| clave | all 10 | (son-3-2, bars=2), (son-3-2, bars=16) | 12 |
| tumbao | all 5 | ("F#"), ("G-"), ("C", bars=2) | 8 |
| montuno | 6: 2/3 voices × son-3-2/bossa | ("F#",3,"son-3-2"), ("G-",2,"bossa"), ("B",3,"bossa") | 9 |
| latin_groove | all 5 | ("F#"), ("G-") | 7 |
| secondary_rag | the 1 | (bars=1), (bars=8), (tonic "G-") | 4 |
| intro | all 5 | ("F#"), ("G-"), ("C", bars=8) | 8 |
| riff | all 4 | ("F#","falling"), ("G-","rocking"), ("A","rocking", bars=2) | 7 |
| tresillo | all 3 | ("E-"), ("F#"), ("C", bars=2) | 6 |
| modal_vamp | all 3 | ("C") (the ♭VI spelling hazard), ("F#"), ("A", bars=2) | 6 |
| ostinato | all 6 | ("F#","arpeggio"), ("G-","fifths"), ("A","arpeggio", bars=2) | 9 |
| study | 6: one per target, rungs 2.1-4.5, shipped seeds 1-3 | the same two recipes at seeds 4 and 77 (2); and 3 extreme recipes: the most-flats minor key, 6/8 at 16 bars, the densest target | 11 |
| **total** | | | **123** |

The batch confirms that each chosen shipped id exists, by exact path test, before the corpus is built.

**Per item, the corpus holds:**
- family name;
- generator version (from the contract) and the commit sha;
- seed, or the parameter case;
- the rung requested (the rung that lists it, or "none");
- the source contract (the family's `promise`, `requires`, `forbids` and `admission` text, plus the sourced definition where one exists);
- the generated MusicXML;
- the machine-check result (contract demands, the physical gate, and the family's §4 or §2 structural checker);
- the independent partitura-derived fact check (onsets, durations, pitches, hands, key, metre and bars, compared with the contract), or a simple-check result where no structural checker exists yet.

**Verdicts.** The outside reviewer reads the MusicXML and returns, per item and then per family:
- **PASS**: credible musical material;
- **PASS AS DRILL / RELABEL**: useful, but really a drill, so the promise changes to drill;
- **FIX**: musically weak but salvageable, with the fault named;
- **REJECT**: remove, or stop using.

Each verdict carries reasons. The owner is not the manual reviewer. Nobody here hears. The `heard` flag stays false, and every verdict is a notation reading.

**Rules.**
- A family verdict comes from its items. One REJECT among the B cases means FIX at least.
- A systematic fault in the O cases expands the read to every shipped item in that family.
- The verdict is written back into the contract's `admission` line, and into §3's provisional disposition.

**Finish condition.** 123 of 123 items read; 16 family verdicts; the §3 dispositions updated; a FIX list handed to the family batches.

**Stop if** a maker refuses more than one B case in a family, or crashes. In that case the case is recorded and the family is flagged before the read.

---

## 7. Library and dataset reuse decisions

The goal is less bespoke machinery, not more dependencies. Every decision cites a tested finding.

| Candidate | Would replace | Improves | Cost | Test required | Decision |
| --- | --- | --- | --- | --- | --- |
| music21 10.5.0 | — (the backbone) | correctness of spelling and theory, where the project's own `up`/`SEMITONE_INTERVAL` rule is used. Integer transposition misspells [R `PACKET.md` C4, D] | none: already pinned | key enumeration with music21 as oracle (G6, G10, G12) | **ADOPT (keep)**. Remove the semitone-count sites (§3 FIX rows). Add the RomanNumeral fixture as an oracle. Never use its read-back of its own files as a witness |
| partitura 1.9.0 | circular music21 read-backs in `independent_check.py`/`harmony_facts.py` as a witness of written files | independence of the parse (116/120 written notes, 120/120 key and time [R `verification-tools.md` §3.1]) | pip, Apache-2.0 | the property is derived from its events and compared with the contract (§2) | **ADOPT** as the parser for every checker in §4-§6. Use `notes_tied`, never music21 `stripTies`, for sounded notes |
| Hypothesis 6.168 | hand-picked seed lists in the Python study tests | coverage beyond finite enumeration | MPL-2.0, one dependency | runtime measured first; `derandomize=True` in CI | **EXPERIMENT**, narrow: only the `study` realiser, and only if `study` survives §5. In the probe it added little beyond enumeration (2 more of 1,876 mutants killed [R `testing-approaches.md` §4]). For finite families, enumeration is **adopted** instead. For `sightReading.ts`, the report's fast-check recommendation is the fit (TypeScript) |
| OR-Tools CP-SAT | `study.Realiser` draw-and-check | nothing to fix: 24/24 studies succeed in 27-234 of 600 draws; legal solutions read as B-C trills [R `generation-libraries.md` R15; `generation-toolbox-verification.md` §6] | a new dependency | — | **REJECT** unless a concrete constrained search appears (`StudyRefusal`s at a new rung) |
| Tonal | ~200-300 TS lines of chord, numeral and mode tables (inferred) [R `generation-libraries.md` R18] | letter spelling in the app | runtime dependency. 6.5.0 does not import under Node and fails `tsc` (pin 6.4.3). `Progression` loses minor quality. `Chord.detect` ranks Em#5 first for E-G-C [R `generation-toolbox-verification.md` §1] | parity with the current unit tests plus the music21 minor-numeral fixture | **EXPERIMENT**, scoped to G10 and G6: test `Key.minorKey` (correct lists) against the fixture before hand-writing a minor table. Not used: `Progression.fromRomanNumerals`, `Chord.detect` |
| FiloBass (CC BY 4.0) | hand-authored root-third-fifth-approach walking patterns (`walking_bass`) | real vocabulary: 48 tracks, every note checked twice, 1 short bar in 12,497 [R `generation-toolbox-verification.md` §4] | 434 MB. Rights of the Aebersold source recordings unchecked (recorded as information); tunes include copyrighted standards | a cell extraction whose bass-on-beat-1 chord-tone rate and approach-note share are compared with the current family, plus a §6 read | **EXPERIMENT**, after the `walking_bass` §6 verdict, only if it replaces patterns rather than adding a path |
| Essen / Nottingham | `sightReading.ts` phrase draws (possibly) | phrase plausibility (untested) | Essen licence (information); Nottingham GPL-3.0 and named-composer tunes | §5 step 5 | **EXPERIMENT**, inside §5 only. Adopted only if measurably better |
| musicxml-io 0.10.3 | — | a second reader of runtime MusicXML (14/14 sight-reading phrases [R `PACKET.md` D]) | TS, one maintainer, API unstable | — | **EXPERIMENT** as a reader in §5 only. **REJECT** as a snipper: a cut left an unended tie, and lost divisions, key, time and clefs |
| SCAMP 0.13 | — | quantised notation from event phrases | GPL-3.0; Python ≥3.12 against the repo's 3.11 | — | **REJECT**: no row needs it |
| MusicLang | — | pattern projection onto progressions | pins music21 8.1.0 against 10.5.0 | — | **REJECT** |
| MMA 25.05 | — (no generated-content use) | — | GPL; MIDI only, no notation; random unless `RndSeed`; the Blues groove's bass root on 8/12 downbeats [R `generation-toolbox-verification.md` §2] | — | **REJECT** for generated content |

**By decision.** ADOPT 2 (music21, partitura). EXPERIMENT 5 (Hypothesis, Tonal, FiloBass, Essen/Nottingham, musicxml-io as a reader). REJECT 4 (OR-Tools, SCAMP, MusicLang, MMA). musicxml-io is counted once, as EXPERIMENT; its snipper use is REJECT.

---

## 8. Counts and sequence

| Measure | Count |
| --- | --- |
| Python families found | 57; plus 26 app drill kinds over 78 static rows |
| Dispositions | KEEP 44 (9 provisional), FIX 4, EXTEND 6, RELABEL 1, MERGE 1, RETIRE 1 (provisional) |
| Music-claiming families | 16 |
| Generator rows mapped | 16 of 16: 10 Python, 6 app; 0 new families |
| Resolutions | UNCHANGED + data 1; EXTEND/FIX 13; conditional NICE 2; REAL 0 |
| Exercise-placement rows mapped | 7 (P1-P7), all PLACE |
| Real-model states over the 16 rows | ADMITTED 1, CANDIDATE 6, NONE FOUND 5, not needed 4 |
| Experiments (lanes) | 2 briefs (§5 sight-reading, 100 items; §6 audit, 123 items) and 5 library experiments |
| Libraries by decision | ADOPT 2, EXPERIMENT 5, REJECT 4 |
| Corrections to earlier records found here | 4: contrary-start set (16 items in two shapes, not "twelve"); oompah also on stage 4; modal_vamp semitone sites exist; Fly Me to the Moon's shipped edition does not print the minor ii-V-i |

**Sequence.**
1. **Source verification** of the 24 dossier-dependent rows already listed in `CURRICULUM-UPGRADE.md` §0 item 4. To those, add the definitions this addendum found unsourced or only secondarily sourced: G14's bossa bass (blocking), G4/G16's printed pattern offsets, G15's guajeo (Mauleón), G5's turnaround, G13's printed habanera, and G2's official ABRSM wording.
   - Consumed 2026-10-05 from PARALLEL-UNBLOCKS §1, §2 and SOURCE-CHECK-parallel (source verification): G14's bossa bass is no longer blocking (contract supplied) and G15's primary source is named; G4 and G16's printed pattern offsets remain blocking, and the broad Berklee blues and rock sequence does not cover them. The parallel check lifts the Berklee-based propositions only as the map's section 8.5 lists; the ABRSM and RCM rows and the hymn rows stay gated.
2. **This inventory**, with the MERGE comparison (seventh_voicing against ii_v_i over 12 keys) and the §6 audit, which together settle the provisional dispositions.
3. **Quarry decisions** for the CANDIDATE rows: the Harlem Rag Tyers edition, Bizet and Contra Danza, Insensatez's symbols, bars 11-12 of the shipped twelve-bar pieces, and catalog tunes for dictation transfer. Each ends ADMITTED or rejected.
4. **Batch briefs grouped by family and seam**:
   - `scale` (G2);
   - `tresillo`, `rhythm` and `turnaround` (G13, G8, G5), with the semitone-site class fix (riff, swing_pair, modal_vamp, blues_forms) at byte-identical digests;
   - `comping` (G4, G16, then G14 once sourced);
   - `montuno` (G15);
   - the app theory seam, `theory.ts` and `factories.ts` (G6, G9, G10, G11, G12);
   - sight-reading data (G1);
   - placements (P1-P7), one data brief;
   - the NICE rows only on the owner's word.
5. **Implementation**, verified by what each seam touches. Version bumps follow G21 and `generator_continuity.json`.
6. **The review corpora go to the outside reviewer**: §6's 123 items, §5's 20/100 sample with its expansions, and each extended family's new items under the §6 corpus rules.

Not established here:
- whether the app reaches unlisted items through `alternativesFor` at runtime;
- whether `buildRhythmDrill` takes values in dictation mode;
- whether `unrealisable()` refuses the G1 parameter sets;
- the chromatic family's spelling at `:1418`;
- any primary-source wording. Every `[D]` line is still unconfirmed.

---

## Reviewer corrections (`responses/1b0d8ac3.md`, approve with requested changes, as an enabling specification only)

These supersede the text above where they conflict; each dependent lane applies its correction before dispatch.

1. **Dispatch authority.** The plan of record is still pending; the ability map governs dispatch. The inventory dispositions above are proposals, not work orders; the family-first sequence in section 8 does not dispatch anything. Section 4's "two rows" source-block summary is wrong: G4, G14, G15 and G16 all await their primary source (G15 the guajeo definition, G16 printed pattern evidence) and cannot be built from guessed definitions; other rows stay gated by their own unresolved source claims; unrelated evidenced teaching corrections may proceed.
2. **G5's checker must match its tier.** The intro tier chooses a triadic reduction (`generate_exercises.py:4356-4359`, `_triad_figure`, `triad(quality)`); a checker demanding root, third and seventh in every half-bar fails correct intro output. Define the expected symbol and pitch set per tier (intro: the sourced triadic reduction; standard: the seventh-shell contract), state what each demonstrates, and do not add sevenths to satisfy a wrong test.
3. **The `seventh_voicing` MERGE is provisional.** A matching C rootless right hand is duplication evidence, not proof the family is redundant; the row itself records different left hands, bar counts and shell forms. Compare variants, consumers and teaching jobs; keep the voicing-control and progression or voice-leading jobs in the surviving route; the minor ii-V-i repair is not gated on this merge unless a dependency is shown.
4. **Sight-reading comparison denominators.** The contender comparison in section 5 step 5 is reported separately from the baseline 100-item progression sample, with matched cases, seeds, outputs and notation-read denominators per contender; if 20 baseline reads cannot cover the promised boundaries, expand or state which boundaries were sampled. Published grades are evidence for the app-level specification, never automatic requirements; the evaluator score is a secondary diagnostic.
5. **What may proceed now:** primary-source fact gathering, the mode sheet, narrowly needed candidate and passage inspection, and the bounded sight-reading specification and export experiment. The generic checker harness, family extensions, merge or retire implementation and the comprehensive music-family audit wait until the map names each one's learner-facing consumer and finish.
