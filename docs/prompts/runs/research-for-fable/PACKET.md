# Research packet for Fable (2026-10-03)

This is research only. Nothing here was built, placed or imported, and nothing was heard.

**The owner's direction (2026-10-03):**
- Make the exercises and drills extensive and accurate, from libraries plus generated code.
- Have enough real songs to round out everything else.
- No PDFs as content; the user adds their own.
- Personal project: licence is recorded as information, not a filter.
- **Correctness and accuracy are the gate.**

**Claim kinds, kept apart throughout:**
- **Observed:** read from a score or file.
- **Published:** what a method, syllabus or source says.
- **Judgement:** suitability or placement. Left to Fable and the owner, and never inferred from the other two.

**"Checked here"** marks a claim the lead re-checked directly. Everything else is the named report's reading.

**Detail lives in `reports/`, one file per research strand:**
- `source-failure-history.md`: what already went wrong with each source in this repo, citing file and line.
- `verification-tools.md`: independent witnesses, circularity, probes over 120 files.
- `generation-libraries.md`: what libraries could delete from the generators.
- `testing-approaches.md`: property, mutation and differential testing against the current tests.
- `datasets-and-generators.md`: other corpora and generators, with accuracy evidence.
- `curricula-and-mutopia.md`: concept-by-level table from Faber, ABRSM 2025–26 and RCM 2022; public-domain grade-list pieces; a 548-entry Mutopia scrape.
- `pdmx-index.md`: 245 PDMX scores read note by note, an index by characteristic, red flags per file.
- `beyer-index.md`: all 109 pieces of Beyer Op. 101, read from the Peters scan.
- `INDEPENDENT-ADDENDUM.md`: independent follow-up research on stronger edition-linked corpora, additional verification/indexing libraries, and genre/accompaniment sources. It supplements rather than replaces the reports above.

**Queryable data lives in `data/`:**
- `pdmx-index.json`: per file, its PDMX path, characteristics, red flags and edition check. The `local_file` paths point at a scratch folder that no longer exists. Re-extract by `pdmx_mxl` path, streaming `mxl.tar.gz` from Zenodo record 14648209.
- `mutopia-piano.json`.

---

## C. High-value findings (the ones likely to change what gets built)

1. **No check today catches a wrong note inside an imported score.** Per `source-failure-history.md`, the build's gates catch structure only:
   - the licence gate, the note-loss gate, `score_checks`, the truncation scan, the render check and `validate.py`.

   None catches:
   - a wrong or misspelled note;
   - a note in the wrong bar;
   - a false attribution;
   - a hand on the wrong staff or clef.

   The review record holds 4 rows, all generated items, none heard.

   **Consequence:** a song counts as verified only after comparison with an independent edition, so songs come in small verified batches.
2. **Every music21 read-back of a shipped file is circular.** music21 writes every shipped `.mxl` (`verification-tools.md`). The PDMX files carry MuseScore 3.6.2 and music21 10.5.0 tags.
   - music21's MusicXML writer fills every bar to its time signature before writing, on every route (documented at `convert.py:1144–1152`; `declare_partial_bars` marks the edition's deliberately short bars). So a music21 read-back cannot show a bar that was short before writing.
   - CF1's `independent_check.py` and CF2's `harmony_facts.py` are therefore checks against the generators' tables and the catalogue, **not** an independent witness of the written file.
   - Non-circular witnesses that worked in this container:
     - **partitura 1.9.0:** written notes matched music21 on 116 of 120 files; the 4 others differ only by tuplet float drift. Key and time matched 120 of 120.
     - **verovio 6.3.0** on MusicXML. Its MIDI value is wrong on kern input.
     - **abc2xml** against the ABC sources.
     - **xmllint** against the W3C schema.
3. **A live defect in shipped content: fingerings written inside chords are lost on the ABC route.** It affects 7 of the 33 shipped ABC files (`verification-tools.md`). The cause is `abc_tools.extract_fingerings`/`apply_fingerings`, which counts a chord as one event.
   - **Checked here:** `greensleeves-68.abc` holds 80 fingerings; the shipped `song.folk.greensleeves.68.mxl` holds 52 `<fingering>` elements.
4. **Building notes by semitone count misspells them in flat keys.**
   - **Checked here:** music21 moves C♯ up four semitones to F (not E♯), names six semitones d5, and moves E♭ up five semitones to G♯.
   - CF1 fixed this in `make_swing_pair`.
   - **Still present:** `blues_forms.roots` (`tools/content/blues_forms.py:28`, `tonic_pitch.transpose(step)`, **checked here**). It would print G♯ for E♭'s IV; the shipped blues keys (C, F, G, E, A) are unaffected.
   - The generation report names `make_modal_vamp` too. **Not confirmed:** a search found no transpose call there.
   - The project's own rule (`up` with `SEMITONE_INTERVAL`) is the fix pattern.
5. **The Python generators are already a thin layer over music21.** No library deletes much there (`generation-libraries.md`). The candidates looked at:
   - **OR-Tools CP-SAT:** probed. It works and can prove a recipe impossible, but the 24 shipped studies all succeed in 27–234 of 600 draws, so there is no failure for it to fix.
   - **partitura's pitch speller:** spelled A♭ major as G♯ A♯ B♯.
   - **mingus, musicpy, abjad:** licence or maintenance problems, or they duplicate music21.
   - **Tonal (MIT):** the one real deletion candidate is in the app, where it could replace about 200–300 TypeScript lines of chord, Roman-numeral and mode tables (inferred, not tested). But tonal 6.5.0 fails to import under Node, its chord detection disagrees with the app's bass-first rule, and it has an open minor-key Roman-numeral bug.
   - **Small, possibly safe trims:** `pad_final_bar` → music21 `makeRests`, and `study.py`'s chord spelling → `RomanNumeral`. Both need a byte-diff over the whole plan.
6. **Testing: the strongest gains are cheap** (`testing-approaches.md`).
   - Run every key in every family with music21 as the reference, instead of hand-picked key subsets.
   - Hold the evaluator twin on generated phrases, not 51 hand-built ones, only 3 of which have ties.
   - Run mutation testing on demand. Probed: mutmut on `musical_evaluator.py` left 265 of 1,876 code mutations uncaught, mostly in tie handling.
   - **Keep:** the identity pins, the catalogue sweeps and the fixed-seed distribution tests.
   - Hypothesis added little beyond enumeration in the probe.
   - Counts: 76 `test_*.py` files counted here (the report says 80).
7. **Content sources ranked by accuracy evidence, not licence:**
   - **Mutopia was the strongest real-repertoire source found in the initial pass, but it is not the strongest source found overall.** The independent follow-up found edition-linked and scholarly machine-readable corpora with stronger provenance for covered works; see `INDEPENDENT-ADDENDUM.md`. Mutopia remains useful edited LilyPond material. Its route has limits:
     - repeats get unfolded;
     - two voices in one hand are merged into chords;
     - python-ly cannot write `\alternative`;
     - spelling comes from the `.ly`.

     The useful holdings: Burgmüller Op. 100 Nos. 1–18, Czerny Op. 821 and 840, Schumann Op. 68 (20 pieces), Bach BWV Anh. 113–121 and 126–128, Tchaikovsky Op. 39 Nos. 1, 5, 16, Clementi Op. 36 No. 1, Kuhlau Op. 20 No. 1, and Handel.

     Not on Mutopia: Beyer, Gurlitt, Köhler, Türk, Duvernoy. Its text search misses entries (0 for Burgmüller against 19 in the composer list), so a zero there proves nothing.
   - **PDMX: mixed.**
     - 245 PD/CC0 candidates read.
     - 36 Anna Magdalena Notebook files match Mutopia in their first 16 right-hand pitches. Openings only; rhythm and later bars are unchecked.
     - 122 of 243 are one staff only.
     - 85 carry red flags: duplicates, mis-titled tunes, the left hand in treble clef throughout, bars that don't add up.
     - 41 two-staff files have no flags and a positive check.
     - No Beyer, Czerny (the listed opuses), Köhler or Clementi Op. 36 survived the filters.
   - **Folk melodies in quantity:**
     - **Essen:** in music21's corpus, **8,514 tunes, checked here**. It is monophonic.
     - **Nottingham Music Database:** clean melodies with chord symbols; 7 of 340 jigs had quirks.
     - **The Session:** its licence file bans processing with LLM tools, **read here**. The owner waives licence concerns.
     - **OpenEWLD:** lead sheets.

     All are melody-only or lead sheets, so a left hand would have to be generated.
   - **Others:**
     - OpenScore Lieder (voice and piano);
     - the Polish Music Heritage scores (few piano solos, same pipeline as the Chopin import);
     - the Piano Booster course (16 two-hand beginner ABC pieces; needs a parser that keeps the hands apart);
     - DCML and When in Rome (expert harmony labels, best used as independent checks of chord and function facts);
     - CIPI and PSyllabus (difficulty labels as a second opinion on ordering).
   - **Avoid for accuracy:**
     - ASAP: irregular bars in 5 of 10 samples.
     - MAESTRO, GiantMIDI, PIAST: performances without notation.
     - Verovio's MIDI value on kern input.
     - Musopen and CPDL could not be reached in the initial pass: UNKNOWN. **KernScores was reached in the independent follow-up and contains several stronger edition-linked Humdrum collections; see `INDEPENDENT-ADDENDUM.md`.**
8. **Beyer exists in this project only as a PDF scan.** It can't become content without score files. The research index is in `beyer-index.md`, and its value is as the published teaching order:
   - LH holds whole notes: Nos. 12, 23, 29, 35.
   - First eighths: 44 (a duet), 45 the first solo.
   - First dotted quarter: 48.
   - First 6/8: 52.
   - First key signature: 70 (agent's reading, not re-checked here).
   - Waltz bass from 80: **checked here**, p. 56.
   - 17 folk songs with text incipits.

   PDMX's "Beyer Nro 8–10" have the right shape but no edition.
9. **Published concept order, from `curricula-and-mutopia.md` §1a:**
   - **Faber:** I and V7 at Level 1, eighths at 2A, I/IV/V7 in C, G and F at 2B, dotted quarter at 2B.
   - **ABRSM sight-reading:** a quaver pair already at Initial.
   - **RCM:** an eighth pair at L1, a triad sequence at Prep A.
   - **Caveat:** Alfred and Bastien placements are level equivalents from the Faber chart, not where those books introduce a concept.
10. **Independent follow-up: stronger sources and tools exist beyond the initial pass.** See `INDEPENDENT-ADDENDUM.md` for the detailed evidence. High-value additions are edition-linked Humdrum corpora (including Joplin, Mozart, Beethoven and NIFC Chopin first editions), the scholarly MEI-based Digital Mozart Edition, DCML's annotated score corpora, `humlib/musicxml2hum` as an additional independent MusicXML parser, `ms3` for native MuseScore corpora, jSymbolic2/musiF for broad characteristic indexing, and FiloBass as a source-backed walking-bass research corpus. The follow-up did **not** find a mature notation-aware generator that clearly supersedes the current `music21 + project constraints` architecture.

---

## A. Repertoire index: how to query it

Use `data/pdmx-index.json` (per file: clefs, time, key, bars, ranges, note values, ties, tuplets, leaps, repeated notes, chord symbols, LH texture, hands together, red flags, edition check), `reports/pdmx-index.md` § "Index by characteristic", `reports/beyer-index.md` § "index by characteristic", and `reports/curricula-and-mutopia.md` §2d (35 Mutopia MIDI readings; MIDI carries no spelling or voices).

**Example query:** "eighths + five-finger range + no dotted rhythm + held LH + short real piece".
- PDMX index: only 2 two-staff files keep both hands within 7 semitones. Two-hand five-finger real music is scarce in every corpus searched.
- Held songs: London Bridge (two eighth pairs over held C/G; zero-length rests in its file).
- Generated families: the coordination family already has the texture.
- Beyer No. 45: no score file.

**N1–N3 specifics** are in `../CF3/RESULT.md` and `../CF3/RESEARCH.md`. Their "proposals" are now options for Fable, not decided tasks.

**The independent follow-up broadens this search layer.** Before writing more one-off corpus heuristics, use edition-linked Humdrum/MEI/DCML material where covered and existing characteristic extractors (`jSymbolic2`, `musiF`, `ms3`) for generic indexing. Named accompaniment labels remain source-backed curation, not automatic detector output.

## B. Library responsibility matrix (summary)

| Responsibility | Current mechanism | Candidate | Can replace | Stays project-specific | Recommendation |
|---|---|---|---|---|---|
| Spelling by key or interval | `generate_exercises.py:3480–3760` (`up`, `_readable`, `SEMITONE_INTERVAL`) | music21 integer transposition | Nothing: music21's default misspells (checked here) | Which spelling to print | Keep; remove the remaining semitone-count sites |
| Bar filling | `pad_final_bar` (~23 lines) | music21 `makeRests(timeRangeFromBarDuration=True)` | ~23 lines | — | Investigate with a byte-diff |
| Study chord spelling | `study.py` (~25 lines) | music21 `RomanNumeral` | ~25 lines | The grammar and the evaluator | Investigate |
| Constrained melody search | `study.py` draw-and-check | OR-Tools CP-SAT | The draws | Musical choice (evaluator) | Keep; no failure to fix |
| App chord, Roman-numeral and mode tables | `theory.ts`, `sightReading.ts:2591–2760`, `harmony.ts` | Tonal | ~200–300 TS lines (inferred) | The bass-first naming rule | Investigate, pinning 6.4.3 |
| Independent read of written files | music21 read-back (circular) | partitura, verovio, abc2xml, xmllint; follow-up adds humlib/musicxml2hum and selective MuseScore Studio import | — | Which facts to compare | Prefer differential witnesses rather than another PianoProject parser; partitura default, humlib where disagreement/source-family fit matters, abc2xml for ABC |
| Native MuseScore corpus analysis | Conversion through MusicXML | ms3 | Avoids unnecessary conversion and custom MuseScore traversal for DCML/OpenScore material | Which facts matter pedagogically | Use `ms3` for native `.mscx/.mscz` research/indexing |
| Generic repertoire characteristics | One-off corpus scripts / PDMX heuristics | jSymbolic2, musiF, existing DCML TSVs | Much generic feature extraction/indexing | Named-style authority and pedagogical placement | Reuse for candidate discovery; never let features certify a named style |
| Beaming | music21 writes it | None available here (MuseScore and LilyPond absent) | — | — | Use independent engraver/import checks selectively if Fable installs one; don't build a custom beaming oracle |
| Key × variant tests | Hand-picked key subsets | Full enumeration | Subset lists | — | Adopt |
| Code-mutation tests | 414 hand-made mutant records | mutmut, Stryker (on demand) | Some hand mutants | Musical mutants ("drop the last bar") | Investigate |
| Sight-reading seeds | Fixed seeds `[1,2,3,77,4096]` | fast-check | Seed lists | — | Investigate |

## Open, for the owner or Fable to decide

- How many songs, and from which sources first. **The initial evidence favoured Mutopia and verified PDMX Bach; the independent follow-up raises edition-linked scholarly/digital corpora above those where the same work is covered.** Essen or Nottingham melodies with a generated left hand remain useful for volume.
- Whether to fix the chord-fingering loss and the `blues_forms` spelling before expanding.
- Which differential witnesses become permanent: Partitura is the proven fast default; humlib/musicxml2hum is a strong third/source-family witness; MuseScore/Verovio are better kept selective rather than mandatory for every test.
- Who checks a song against its edition. No one in this process hears music. Reading against an edition is possible; listening is not.
