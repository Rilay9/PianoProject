# CT1 — the plan forward: what exists, where truth comes from, and how to build exercises correctly

> **Not a plan of record.** Superseded by `docs/prompts/content-recovery-foundation.md` and `content-queue.md` (draft PR #2). For what survives, see `HANDOFF.md` beside this file.

Written 2026-10-03 on `claude/content-truth` at the base `abb62a0`, after part zero
(`reuse-map.md`), for the owner and the reviewer to check before more is built.
**This is a plan, not a report of built work.** What was built this session is listed in
§9, every item of it a candidate that the plan's oracles still have to pass.

---

## 0. The verdict in five lines

1. **The fault.** Nearly every musical fact in this app was hand-written from memory and
   tested with examples its writer chose. So each wrong idea was tested by the same wrong
   idea (§1).
2. **What exists.** Almost everything we hand-built already exists in two forms:
   - published **definitions**: syllabi, textbooks;
   - maintained **libraries**: music21, Tonal, partitura, OR-tools.

   Experts have also published **labelled data** that can test our code against human
   judgement: Mozart texture labels, Roman-numeral corpora, graded difficulty (§3).
3. **The change.** One rule replaces the pile: **source → library → independent check →
   only then our own glue code** (§2).
4. **The biggest win.** A generation pipeline for exercises:
   - specified, not written;
   - realised by libraries;
   - drawn from real music first;
   - checked by something other than the generator (§4).
5. **Convergence.** It is a finite list of workstreams. Each has a named source, a named
   independent check and a yes/no exit (§5). The owner decides five things (§7).

---

## 1. Why the same mistakes kept happening (the mechanism, with its evidence)

| Cause | Evidence in this repository | What breaks |
|---|---|---|
| Code before search | 19 detectors, 57 generator families, a phrase grammar, seven copies of key naming, theory tables in four places, an SMF parser and a Markdown parser, all hand-written (`reuse-map.md` §1–§7) | Each brings its own bugs: `leftHandPattern` reads two-hand scales as accompaniment (16 of 25 golden models) |
| The builder's own tests as proof | CL10a's fixtures all came out as predicted while its corpus diff showed scales read as accompaniment (`operating-procedure.md` §12) | A wrong definition passes its own tests |
| Broad buckets standing for named concepts | `claims.py:79–85` maps seven named styles onto one vague demand | Claims cannot be checked, because nothing defines them |
| The browser constraint over-applied | Analysis that runs at **build** time, where music21 is installed, was written in TypeScript too | Library-grade facts recomputed badly |
| Numbers from memory | Levels, ranges, thresholds and review intervals chosen by hand. Stages carry `abrsmGradeApprox` labels, with no syllabus cited (`docs/02-curriculum.md:21`) | Plausible but uncheckable |

**The same fault, this session.** I wrote `tools/content/figures.py` before I found the
experts' Mozart texture annotations (§3, row O3). The rule in §2 would have caught it.
`figures.py` therefore stays a **candidate** until it passes O3.

---

## 2. The rule, in plain words (it replaces the process rules about musical content)

1. **Before writing any musical code, write two links:**
   - who **defined** this: a syllabus, a textbook, a standard;
   - who already **computes** it: a library function.

   No link means no code. "I searched X and Y and found nothing" is a valid link.
2. **Make it with one thing, check it with another.** The generator is never its own
   judge. The check is, best first:
   - **experts' labelled data;**
   - the **source's own worked examples;**
   - a **different library's** answer;
   - only then our fixtures, which never count alone.
3. **Real music first.** In this order:
   - a verified real piece or excerpt;
   - real music transformed (transposed, one hand isolated, simplified);
   - then generated material.
4. **Every number comes from a table someone published:** key lists, ranges, note values,
   lengths, tempi, the grade at which a thing appears. When none exists, the number is
   labelled a guess and treated as one.
5. **One definition in words, two independent implementations.** The generator and the
   checker cite the same sourced definition, but they are written separately and the
   checker reads the produced score file. A generator never certifies its own output. The
   checker is itself proven on source examples and expert-labelled data (corrected after
   review, 2026-10-03).
6. **What nobody here can check is not claimed:** whether a phrase is musical, whether a
   learner has truly mastered something, tone. The app says *unverified as music* or says
   nothing.
7. **Analysis runs at build time in Python with the libraries; the browser reads the
   result.** The browser computes only what must be live: imports, runtime phrases, input.
   A browser copy must agree with the build on the whole catalogue.

These seven lines go into `operating-procedure.md` §10a, replacing its wording, in the
first change that implements this plan.

---

## 3. The source register: what settles each question

**Reachable here** says whether this cloud session could fetch the source on 2026-10-03:
- **yes** means tested and fetched: `curl` for the RCM syllabus, `git ls-remote` for the
  GitHub repositories;
- **blocked** means the network policy refused the host when tested;
- **untested** means no fetch was tried.

**Licences.** Where a licence is marked *as reported*, it came from a search agent's
reading of search results and was not opened here. The reviewer confirms it.

### 3a. Definitions and level tables (when a concept is taught, with what parameters)

| Id | Source | What it settles | Reachable here | Licence and use |
|---|---|---|---|---|
| S1 | [RCM Piano Syllabus 2022](https://rcmusic-kentico-cdn.s3.amazonaws.com/rcm/media/main/about%20us/rcm%20publishing/piano-syllabus-2022-edition.pdf) | Per level, Prep A to 10: technical requirements, sight-reading (time signatures, note values, length, keys), ear tests, repertoire lists by composer and title | **yes**; 8,273 lines of text with `pdftotext -layout`. Some table cells are glyphs, so the tables need a hand-checked extraction | Read and cite; never ship the text |
| S2 | [ABRSM Piano Practical 2025–26](https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20&%202026%20Prac%20syllabus%2020240524_access.pdf) | Grades 1–8: scales and arpeggios with ranges and speeds; a sight-reading parameters table (cumulative, p. 16, as reported); aural tests | blocked (abrsm.org) | Read and cite |
| S3 | [ABRSM Music Theory specification 2023](https://www.abrsm.org/sites/default/files/2023-09/Music%20Theory%20Qual%20Spec%20April%202023%20[2023%20rebrand].pdf) | Grades 1–8: when each theory concept is examined (intervals, keys, chords, cadences) | blocked | Read and cite |
| S4 | RCM Theory Syllabus 2016 (Prep to Level 8, as reported) | The order of the rudiments | untested | Read and cite |
| S5 | [Faber Piano Adventures correlation chart](https://pianoadventures.com/wp-content/uploads/sites/2/2017/09/Piano-Adventures-Correlation-Chart.pdf) | Topics per Faber level, aligned to Alfred, Bastien, Piano Safari, Celebration Series, RCM and ABRSM levels | blocked | One document maps the method books to both exam ladders |
| S6 | [Hutchinson, *Music Theory for the 21st-Century Classroom*](https://musictheory.pugetsound.edu/mt21c/MusicTheory.html) | Definitions with examples: accompanimental textures, voice leading, cadences | blocked (also its LibreTexts mirror) | Openly licensed text |
| S7 | [Open Music Theory](https://openmusictheory.github.io/contents.html) | Definitions: rhythm, meter, triads, sevenths, cadences, phrase | untested | Openly licensed (reported CC BY) |
| S8 | [MusicXML 4.0](https://www.w3.org/2021/06/musicxml40/), [SMuFL](https://w3c.github.io/smufl/latest/), [MIDI 1.0](https://midi.org/specs), [Web MIDI](https://www.w3.org/TR/webmidi/) | The formats | untested | Standards |

### 3b. Expert-labelled data: the independent checks (oracles)

| Id | Data | What it checks | Reachable here | Licence (as reported) |
|---|---|---|---|---|
| O1 | [DCML Annotated Mozart Sonatas](https://github.com/DCMLab/mozart_piano_sonatas) ([paper](https://transactions.ismir.net/articles/10.5334/tismir.63)) | Harmony, Roman numerals and cadences, labelled by experts per beat, for all the Mozart sonatas | **yes** (git) | CC BY-NC-SA 4.0: a check only |
| O2 | [When in Rome](https://github.com/MarkGotham/When-in-Rome) | Roman-numeral analyses across many styles, in RomanText, which music21 reads | **yes** (git) | CC BY-SA 4.0 |
| O3 | [ALGOMUS Mozart texture annotations](https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.57745/OHRWPC) ([ISMIR 2022](https://archives.ismir.net/ismir2022/paper/000061.pdf)) | **Melody versus accompaniment and texture type per bar**, labelled by experts: 1,164 labels on 9 movements (K. 279, 280 and 283, as reported) | **yes** (fetched since, `plan.md` §10) | **Annotations ODbL; scores CC BY-NC-SA 4.0** (the dataset's README). A private oracle; the scores are never shipped |
| O4 | CIPI ([code](https://github.com/PRamoneda/difficulty-prediction-CIPI), [data](https://zenodo.org/records/8037327)) | Henle difficulty levels for 652 pieces | blocked (zenodo) | CC BY-NC-SA 4.0 |
| O5 | PSyllabus ([paper](https://arxiv.org/pdf/2403.03947v2), [data](https://zenodo.org/records/14794592)) | Piano Syllabus levels for 7,901 pieces, matchable by title | untested | **Unresolved:** the Zenodo page reportedly says research use only, and another record says CC BY 4.0. A private oracle only, until settled |
| O6 | S1's and S2's **repertoire lists** | The level at which an exam board places a named public-domain piece, matched to catalogue titles. S1 names at least 59 lines with Burgmüller, Czerny, Clementi, Kabalevsky or Gurlitt (grep of the extracted text) | **yes** (S1) | Facts read off the list |
| O7 | [ASAP](https://github.com/CPJKU/asap-dataset) | Real performances aligned note by note to scores, to test score following | **yes** (git) | CC BY-NC-SA 4.0 |
| O8 | [PIG fingering dataset](https://beam.kisarazu.ac.jp/research/PianoFingeringDataset/) | Fingering by pianists, for 150 pieces | untested; registration required | Non-profit academic use only: a check, never shipped |

### 3c. Libraries: what computes or realises

| Id | Library | What it does for us | Where it runs |
|---|---|---|---|
| L1 | music21 10.5 (installed) | Keys (`analyze('key')`, Aarden–Essen); chords (`commonName`, `inversion`); Roman numerals (`romanNumeralFromChord`, and `RomanNumeral` to pitches); RomanText in and out; metre (`beatStrength`); intervals; `chordify`; `transpose`; **`figuredBass.realizer`** (keyboard-style voicing under voice-leading rules); **`voiceLeading`** (parallel fifths and octaves, hidden intervals) | build (Python) |
| L2 | [Tonal](https://github.com/tonaljs/tonal) (MIT) | The same theory facts in TypeScript: Note, Interval, Chord, Scale, Key, RomanNumeral | browser |
| L3 | [partitura](https://github.com/CPJKU/partitura) (Apache-2.0) | A second opinion on pitch spelling, key and voice separation | build |
| L4 | [OR-tools CP-SAT](https://developers.google.com/optimization/cp/cp_solver) or [CPMpy](https://cpmpy.readthedocs.io/) | **Constraint solving:** a melody or bass that meets every stated rule, exactly, with no rejection sampling. Published precedent: rhythm exercises by constraint satisfaction ([academia.edu](https://www.academia.edu/333607/Generating_Targeted_Rhythmic_Exercises_for_Music_Students_With_Constraint_Satisfaction_Programming)) and four-voice tonal harmony ([IJCAI 2024](https://www.ijcai.org/proceedings/2024/0858.pdf)) | build |
| L5 | [MusPy](https://github.com/salu133445/muspy) (MIT) | Standard measurements of a piece (pitch range, scale consistency, empty-beat rate, polyphony), to compare a generated bank with real pieces at the same level | build |
| L6 | [pianoplayer](https://pypi.org/project/pianoplayer/) | Suggests fingering where no published chart exists; labelled as computed | build |
| L7 | [basic-pitch](https://github.com/spotify/basic-pitch), [parangonar](https://github.com/sildater/parangonar) (Apache-2.0) | Offline checks for the microphone and score-following paths | test only |
| L8 | Existing generators: OSME, SightScore, ftrain/sightreading, SREGen (`reuse-map.md` §8) | Comparison points for the sight-reading generator; candidates, not dependencies | — |

### 3d. Real teaching music: the first choice for material

These collections are already fetched by `fetch.py`: Mutopia (git), KernScores (Mozart,
Beethoven, Haydn, Chopin, Joplin, Scarlatti, Bach chorales), PDMX, MuseTrainer, and the
NIFC Chopin first editions.

To check:
- whether Mutopia's repository holds Czerny (Opp. 599, 261, 299, 849), Burgmüller Op. 100, Clementi Op. 36, Beyer Op. 101, Duvernoy Op. 176 and Gurlitt;
- whether IMSLP does (its site is blocked here, and its PDFs need conversion);
- O6 names which of these pieces sit at which exam level.

---

## 4. The exercise pipeline (the most valuable part)

**Goal, in common sense.** We want harder exercises than scales and five-finger tunes:
- an Alberti accompaniment under a melody;
- a waltz with a secondary dominant;
- a walking bass over a twelve-bar blues;
- four-part keyboard harmony from a figured bass;
- ii–V–I comping;
- sight-reading at a stated grade.

Each must be **right by construction** and **checked by something that did not make it**.

**Shape, in one line:** a written recipe → libraries realise it → independent checks →
admitted with its provenance. Our own code is only the recipe format and the glue between
libraries.

### 4.1 Material in priority order, before anything is generated

1. **Published teaching pieces** (§3d): études, sonatinas, method-style pieces in the public
   domain, at the level O6 gives.
2. **Derived from verified real music.** music21 transforms an excerpt that an oracle has
   confirmed holds the concept:
   - **Isolate.** Take a passage whose exact target is verified: for Alberti, O3 marks the
     bar as an accompaniment layer (`HS1`) *and* the separately sourced Alberti check finds
     low–high–middle–high there. `HS1` alone means accompaniment, never Alberti.
   - **Transpose with respelling.** music21 `transpose` plus key-aware spelling.
   - **Simplify.** `chordify` a passage into block chords before its broken form; thin the
     rhythm to the note values the level allows.
   - **Loop.** Repeat a figure bar as an ostinato drill.
   - **Every derived item records its parent:** the piece, the bars, and the transformation.
   - **A transformation makes new content.** The derived item is checked again for the claim
     it makes. Transposition rarely changes the claim; simplifying, isolating, thinning
     and looping can.
   - **Real content is admitted only through the same checks as generated content:**
     source → exact target verified in the passage → level and physical fit → admitted.
     A piece's genre or composer establishes nothing. A Joplin rag is not stride or
     oom-pah practice until those bars are shown to hold the figure.
3. **Generated**, only where 1 and 2 have nothing at the level. A short written comparison
   says why, as `operating-procedure.md` §12 already requires.

### 4.2 The recipe: a declarative exercise specification

One JSON object per family and level, validated by a schema. It holds **no music**, only
what must be true. An example, abridged:

```json
{
  "concepts": ["alberti-bass"],
  "level": {"source": "S1", "level": 3},
  "key":   {"from": "S1.level3.sightReading.keys"},
  "metre": {"from": "S1.level3.sightReading.timeSignatures"},
  "length": {"bars": 8},
  "harmony": {"romantext": "m1 I | m2 IV | m3 V7 | m4 I", "or": "sample O1/O2 progressions at this level"},
  "texture": {"lower": {"figure": "alberti", "voicing": "figuredBass.keyboard"}, "upper": {"melody": "constrained"}},
  "melody": {"strongBeats": "chordTones", "maxLeap": {"from": "S1.level3"}, "range": {"from": "S1.level3"}, "cadence": "PAC"},
  "fingering": {"from": ["published chart", "pianoplayer:computed"]},
  "checks": ["L1.key", "L1.roman", "figures.alberti", "L1.voiceLeading", "L5.withinLevelDistribution", "difficulty.inBand", "render"]
}
```

Every `from` points at a row of **one named source table** (§5, W8). There is one table per
source, S1, S2, S3 and S5, each keeping its version, page and exact meaning: exam
sight-reading parameters are not method-book sequencing. A recipe names which source it
follows. No number is typed into a generator.

### 4.3 The realisation layers, each a library

| Layer | What it decides | Done by | Our code |
|---|---|---|---|
| Harmony | Chord per beat | RomanText → `music21.roman.RomanNumeral` → spelled pitches; progressions taken from O1 and O2 at the level, or written in RomanText by the recipe | Choosing which progression |
| Voicing | Where each chord sits | `music21.figuredBass.realizer`: keyboard style, forbids voice crossing and overlap, limits spacing; or close position for beginners | Picking the rule set per level |
| Texture | The figure | **One figure object per concept**, with `generate(voicedChord, metre)` and `match(bars)`. Alberti is [lowest, highest, middle, highest] of the voiced chord (S6). The same object is the matcher | The figure objects (short, cited) |
| Melody | The tune | **CP-SAT** (L4) with rules read from the recipe: chord tones on strong beats (`beatStrength`), maximum leap and range from the level table, no augmented intervals, an approach to the cadence. The solver either meets every rule or says none can be met | The rule list (cited) |
| Rhythm | Note values | The recipe's palette from the level table, or rhythms sampled from real melodies at that level | — |
| Fingering | Fingers | A published chart (Clementi, Kelley, McLain: already cited in `generate_exercises.py`); else pianoplayer, marked computed | — |
| Output | The file | `music21` writes MusicXML; the existing `convert.normalise` keeps the bytes stable | — |

### 4.4 The checks, none of which is the generator

A generated item is admitted only if all of these pass. A failure is reported, and the item
is regenerated or the recipe fixed; a check is never loosened to let an item through.

1. **Key.** `analyze('key')` agrees with the recipe's key.
2. **Harmony.** `romanNumeralFromChord` on `chordify` reads the recipe's numerals back, bar
   by bar.
3. **Figure.** The concept's matcher finds the figure in the bars it was meant for, and
   finds no other named figure.
4. **Voice leading**, for chorale and keyboard-harmony families. `voiceLeading` finds no
   parallel fifths or octaves and no crossing.
5. **Level.**
   - Every parameter is inside the level table's row.
   - The difficulty model's estimate falls in the rung's band.
   - **MusPy's measurements fall within the range of real pieces at that level (O6)**: out
     of distribution is flagged.
6. **Physical.** The existing physical gate: span, leaps, repeated notes.
7. **Render.** OSMD loads the file (the existing render check).
8. **Provenance.** Recipe, seed, sources and check results recorded on the item; marked
   generated and *unverified as music*.

### 4.5 Where it runs

- **Build time (Python):** every family above. The build writes a bank of items per family
  and level: thousands of small MusicXML files, cached by recipe and seed. The app selects
  from the bank.
- **Runtime (TypeScript):** only the endless sight-reading phrase (`engine/sightReading.ts`)
  stays live. Three things change:
  - its parameters come from the same level table, shipped as JSON;
  - its theory facts come from Tonal;
  - a parity test runs the Python checks (§4.4) over a seeded sample of its output, so the
    two cannot drift apart.
- **Considered and not chosen:** music21 in the browser through Pyodide. It is possible,
  but it puts tens of MB in an offline PWA; the bank gives the same items without that.
  This is reversible, so it is flagged for the owner (§7) rather than decided silently.

### 4.6 What this pipeline makes possible, at stated levels

Each row is a recipe family. "Real first" names the published or derived source tried
before any generation.

| Family | Real first | Generated with |
|---|---|---|
| Alberti under a tune | Passages verified as Alberti by both checks (O3 `HS1` plus the sourced figure check), in Mozart and Clementi Op. 36 | RomanText I–IV–V7–I in keys from the level table; Alberti figure; CP-SAT melody |
| Waltz bass, oom-pah | Waltz and march passages in Burgmüller, Gurlitt and Joplin, each verified for the figure (to check, §3d) | The waltz figure over progressions sampled from O2 |
| Keyboard harmony from figured bass | Bach chorales (KernScores, already fetched) | `figuredBass.realizer`, checked by `voiceLeading` |
| Cadences: authentic, plagal, half | Cadences located by O1's labels in real excerpts | RomanText cadence formulas, in every key the level allows |
| Secondary dominants, modulation | O1 and O2 passages labelled V/V and the like | RomanText with secondaries; `analyze('key')` checks the tonicisation |
| Walking bass, twelve-bar, ii–V–I | Public-domain blues and jazz in PDMX (to check) | Chord symbols to pitches (L1/L2); bass by CP-SAT: chord tone on beats 1 and 3, step or chromatic approach into the next root. Rule from the cited definition |
| Sight-reading at a grade | S1/S2 specimen parameters; OSME as a comparison | The pipeline above with the grade's row; the TS runtime for endless practice |
| Scales and arpeggios | — | music21 scales (already), the published fingering charts, the forms and ranges in S1/S2's technical tables |

---

## 5. Workstreams

Each workstream is listed with:
- **Question:** what it settles;
- **Source:** where the truth comes from;
- **Check:** the independent check, per §2;
- **Exit:** the yes/no test that closes it;
- **Who:** who does it, by actor tier.

The order is by what the learner meets wrongly today.

**W1. Accompaniment figures (the proven harm)**
- **Question:** which items truly hold Alberti, waltz, oom-pah, stride, walking, boogie or
  a broken-chord accompaniment?
- **Source:** S6 and the cited definitions.
- **Check:** O3 per bar. Before integrating, `figures.py` is run on K. 279, 280 and 283 and
  compared with the experts' accompaniment labels: agreement and disagreements, each
  disagreement read in the score.
- **Exit:**
  - no figure is claimed on any of the appendix's 16 (already true on the golden models,
    `test_figures.py`);
  - agreement with O3 is reported, and each disagreement is either explained or fixes the
    definition;
  - a catalogue run is itemised;
  - the decision on `pending-detect.patch` follows from that run.
- **Who:** builder (strong); runs: a script.

**W2. Notation facts (13 of the 19 detectors)**
- **Question:** steps, skips, leaps, note values, ties, triplets, compound metre, key
  signature, accidentals, ledger lines, clef.
- **Source:** S7 and the standard; the library is L1.
- **Check:** music21's answer against `detect.ts` on the whole catalogue (two independent
  computations).
- **Exit:** every disagreement is classed as music21 wrong, detect.ts wrong or a definition
  difference, and fixed at the source.
- **Who:** a script writes the diff; a mid-tier agent classes it; the strong tier decides
  definition differences.

**W3. Harmony concepts**
- **Question:** chords, inversions, Roman numerals, cadences, I–IV–V, ii–V–I, twelve-bar,
  secondary dominants, turnarounds, modulation.
- **Source:** S3 and S7; the library is L1.
- **Check:** O1 and O2. music21's Roman-numeral reading of their scores is compared with
  the experts' labels, which measures how far music21 can be trusted before it judges our
  catalogue.
- **Exit:**
  - an agreement rate is stated per concept;
  - a concept whose agreement is too low to trust is moved to "claim less";
  - a catalogue run is done.
- **Who:** script plus strong tier.

**W4. Item tags (G12)**
- **Question:** which of the catalogue's tags are true of the item?
- **Source:** the concepts' sourced definitions.
- **Check:** the matchers from W1 to W3.
- **Observed at this build:** 437 distinct tags over 2,009 items in `build/catalog.*.json`,
  of which 154 are curriculum concept ids. (G12 recorded 315; the difference is unexamined.)
- **Exit:** every tag that names a definable concept is checked, and the rest move to a
  descriptive field.
- **Who:** script plus mid tier.

**W5. Deny by default**
- **Question:** does any concept without a sourced definition and a check grant credit or
  establish a claim?
- **Source:** CT1 part four.
- **Check:** a test with an invented concept: it grants nothing.
- **Exit:** CT1's checks 2 and 3 pass.
- **Who:** builder.

**W6. Rungs**
- **Question:** does every rung's claimed concept appear in at least one of its options?
- **Check:** W1 to W3's matchers on the options.
- **Exit:** a gap list. A gap is a missing piece, never a deleted rung.
- **Who:** script.

**W7. Generators: the §4 pipeline**
- **Question:** does each family produce what it claims, built from libraries?
- **Check:** §4.4.
- **Exit:**
  - every family in `family_contracts.json` is either rebuilt as a recipe with all checks
    passing, or kept, listed with the reason;
  - hand theory tables are gone (R4, R5).
- **Who:** builder; the families in batches.

**W8. Levels**
- **Question:** when does each concept first appear and become required, by RCM, ABRSM and
  Faber, against our rungs?
- **Source:** S1, S2, S3 and S5.
- **Three source tables, then a crosswalk.** Each source is extracted separately into
  `content/sources/levels/{rcm-2022,abrsm-2025,faber-correlation}.json`, preserving the
  version, page and exact meaning of each value. Each extraction is checked line by line by
  a second reader. Only then is a **crosswalk** built: per concept, where each source places
  it, with agreement and disagreement recorded, never averaged. Where they agree, that is
  evidence. Where they differ, it is a decision for the owner, and the spread may itself
  show a concept's flexibility.
- **Exit:**
  - a disagreement list with a recommendation per item;
  - **the owner decides any reorder.**
- **Who:** mid tier extracts; strong tier compares.

**W9. Difficulty**
- **Question:** does the level model agree with published levels?
- **Check:** O4, O5 and O6.
- **Exit:** a correlation per source over matched titles. Owned by CL17.
- **Who:** script.

**W10. The modes credit only what they observe**
- **Source:** CT1 part three's table.
- **Check:** the real engine path, driven by the attempt that must not pass.
- **Exit:** every row tested.
- **Who:** builder.

**W11. Library swaps**
- **Scope:** R1 to R12 in `reuse-map.md`, except R6 (the owner's) and R7 (CL17's).
- **Exit:** each swapped with its existing tests green, or kept with the reason.
- **Who:** builder, low priority after W1 to W8.

**The remaining concepts** (`concept-kinds.json`: 187 in the notes, 33 only in how they are
played, 66 not in the notes) get classification only, unless a rung or tag claims them.
Kind (b) is claimed only where the input reports it; kind (c) is lesson text only.

**How the work converges:** W1 to W11 are the whole list. Each checkpoint pushes its counts
as *done out of total*. A new idea found along the way joins a workstream that owns it, or
waits; it never starts a new audit.

---

## 6. Where the CT1 brief is wrong or can be done better

1. **"Every kind (a) concept gets its own matcher."** This is the wrong size. 187 concepts
   are kind (a). Most are library facts (W2, W3). Others, such as sonata form,
   counterpoint, motif development and voice leading as a skill, are definable only by
   analysis, with no reliable automatic test. Those should **claim less** until an
   expert-labelled corpus covers them. Custom matchers are needed for about ten figures.
2. **"Prove it against examples you did not invent."** This is right, but the brief's best
   examples are the source's own. Expert-labelled corpora (O1 to O3) are stronger and
   exist. They should be the first oracle wherever they cover a concept.
3. **Generators.** The brief asks that each generator be fixed to meet its claim. The
   better path is §4: rebuild the families as recipes realised by libraries. Patching
   57 hand-built families one by one repeats the cause.
4. **Levels.** The brief asks for "RCM, ABRSM and Faber where they state it". S5, one
   chart, aligns all three plus the other method books. Start there.

---

## 7. Decisions only the owner can make (one line each)

1. **Review scheduling.** Replace the 21- and 14-day rules with FSRS (`ts-fsrs`)? It needs
   new stored fields. Separately, the current pick ignores its own overdue sort
   (`session.ts:1490`); that is a bug either way.
2. **Curriculum order.** After W8, reorder rungs where the syllabi disagree? W8 brings the
   list with a recommendation per item.
3. **Network.** Allow the blocked hosts so this session can read its sources:
   - `abrsm.org`
   - `pianoadventures.com`
   - `zenodo.org`
   - `entrepot.recherche.data.gouv.fr`
   - `imslp.org`
   - `mutopiaproject.org`
   - `musictheory.pugetsound.edu`

   The change is under the environment's **Network access** setting, as Custom with those
   domains added ([docs](https://code.claude.com/docs/en/cloud-environments#network-access)).
   Without it, W1 waits on O3 and W8 on S2 and S5.
4. **Bank versus browser.** Build-time banks (§4.5), or music21 in the browser via Pyodide?
   Recommended: banks.
5. **Licence posture.** Non-commercial data is used as checks only and never shipped, so
   the personal build is unaffected. Confirm.

Nothing else in this plan waits on the owner.

---

## 8. The common-sense version (for any agent, before any musical work)

- Find out who **already defined** it and who **already computes** it. Write both links
  down. If you find neither, write down what you searched.
- **Use their code.** Write only the glue.
- **Use real music before making music up.**
- Take numbers (keys, ranges, lengths, levels) from a **published table**, never from
  memory.
- **Never let the thing that made it be the thing that checks it.** The best check is
  experts' labels.
- If nobody here can check it, **don't claim it**.
- Report **counts and disagreements**, not "all passed".

---

## 9. State of the branch, for the next agent

| Commit | What it holds | Status |
|---|---|---|
| `168ba4a` | `reuse-map.md`: every component classed, with a decision; replacement plan R0–R12 | Done; the reviewer checks it |
| `2e93516` | `concept-kinds.json` (286 concepts: 187 in the notes, 33 played, 66 neither; drafted by an agent, reviewed and corrected); `figures.py`, `test_figures.py` (20 tests pass), `figures_catalogue.py` | Candidates: `figures.py` awaits O3 (W1). `figures_catalogue.py` has not been run |
| `216e28b` | `reuse-map.md` §8: the owner's candidate oracles and libraries | Licences as reported |
| `c993da7` | `pending-detect.patch`: `leftHandPattern` and `walkingBass` fixed by the mirror rule, `EVIDENCE_DEFINITIONS` 6 → 7 | **Not applied, not typechecked, not tested;** decided by W1's catalogue run |
| this commit | `plan.md` | For the owner and the reviewer |

**The content build** (`python3 tools/content/build.py`, personal, online) exited 0 at
this base. Its log is in the scratch `build/ct1/build.log`, which is not kept.

**Not done:** CT1 parts one to four beyond the candidates above; no catalogue counts yet;
no oracle comparisons; nothing heard (no one in this process can hear).

---

## 10. Update after the reuse census (`reuse-map.md` §9, 2026-10-03)

The census changes six things in this plan.

**1. Every source in §3 is now readable** except IMSLP's PDFs, which need conversion:
- **S2:** the ABRSM sight-reading parameters table (p. 16) and its aural tests.
- **S5:** the Faber correlation chart.
- **O3:** the experts' texture labels (annotations ODbL). The research group's own texture
  descriptors (GPL-3.0, over music21) are now **O3a**.

So W1, W8 and the texture vocabulary no longer wait on the network.

**2. W1's exit is corrected.** The experts label *function*, not style names. An Alberti
bass is `HS1`, a single-voice harmonic-static accompaniment. So O3 checks two things:
- **melody over accompaniment:** both precision and recall;
- **a matcher's figure bars fall inside accompaniment layers:** precision only.

O3 cannot check Alberti recall. W1 reports exactly that and claims no more.

**3. Texture concepts take a published vocabulary.** O3a's layers and diacritics:
- layers M, H and S;
- h, p, o, t, r, b and s.

They replace the `texture.*` demands' home-made terms. The named styles stay as figure
definitions under that vocabulary, with the generator and the checker implemented
independently (§2.5).

**4. Generators: real content first, now listed per family** (`reuse-map.md` §9.1):
- **Czerny, Burgmüller, Beyer, Duvernoy, Gurlitt and Clementi Op. 36** for technique,
  reading and accompaniment;
- **Joplin from KernScores** (already fetched) as *candidates* for stride, oom-pah and the
  secondary rag, each passage verified for its figure before it is claimed;
- passages that are **both** in an O3 `HS1` layer and verified as Alberti by the sourced
  check, for the Alberti family. `HS1` alone is accompaniment.

The first action of W7 is listing Mutopia's holdings of those opus numbers. `study.py`'s
grammar is retired.

**5. More oracles:**
- **O9 FiloBass** (walking bass statistics);
- **O10 iRb / Jazz Harmony Treebank** (real jazz progressions, replacing `II_V_I` and
  turnaround tables).

**6. Reference implementations adopted as ideas, not code:**
- PianoBooster's early cut-off and beginner stop point for Wait mode;
- ynot99's order-free chord window, if O7 shows chord-order misses;
- the "uncertain, unscored" microphone outcome;
- rhythm difficulty on its own axis.

**The census totals** are counted, not estimated: 64 labelled rows (`reuse-map.md` §9.9).

---

## 11. Corrections after the outside review (2026-10-03)

The review was weighed against the repository; each point was accepted where it held there.

**1. Spelling, stated exactly** (`spelling-paths.txt`, a call-graph script over
`generate_exercises.py`):
- **Spelled from the key:** most families spell through `scale_pitches`, `_diatonic_run`,
  `_walk` or `_transpose_name`, the key's degrees.
- **Spelled by `up()`, about 25 families:** chord tones go through `up()`. It turns a
  semitone count into **one** interval name through the hand table `SEMITONE_INTERVAL`
  (`generate_exercises.py:3480`), so 6 semitones is always A4 and never d5, and 8 is
  always m6 and never A5. Context is lost exactly there.
- **No key-derived helper:** `chromatic`, `blues_scale`, `pentatonic`, `riff`, `tresillo`,
  `swing_pair` and `modal_vamp`.
- **The `up()` table only:** `triad_inversions`, `five_finger` and `ostinato`.
- **Literal note names:** `rhythm` and `clave` (a one-line staff, which is fine);
  `syncopation` and `meter` (C3, E3, G3); `modal_vamp` (E2).
- **Composed separately:** `study`, in `study.py`.

**The independent check.** partitura's pitch-spelling estimator (Meredith's PS13, from the
pitches alone) is run over every generated item, and every disagreement with the printed
spelling is read. Until then, "spelled by music21" means only "passed through music21".

**2. `HS1` is accompaniment, never Alberti.** Fixed in §4.1, §4.6 and §10. An Alberti
candidate is a bar in an O3 accompaniment layer that **also** passes the sourced Alberti
check.

**3. Separate source tables, then a crosswalk.** Fixed in §4.2 and W8.

**4. No self-certification.** Fixed in §2.5: one sourced definition, two independent
implementations, and the checker reads the produced file. The generator's figure table and
`figures.py` are already separate code and stay so. Merging them, as §2.5 first said, would
have removed the independence.

**5. Real content needs a verified passage-level claim.** Fixed in §4.1 and §10. The
admission path is source → exact target verified → level and physical fit → admit.

**6. REPLACE labels are candidates.** A library settles mechanics, not pedagogy. Every
REPLACE in `reuse-map.md` §9 is a candidate until three things are recorded:
- its **semantic fit**, checked;
- its **limitations and failure modes**, searched;
- a **"why not simpler?"** line.

FSRS stays an owner decision about what piano review should be. A figured-bass realizer
gives legal voicings, not the hand shapes to teach.

**7. Licences.** O3's annotations are ODbL and its scores CC BY-NC-SA 4.0. PSyllabus is
unresolved. Anything non-commercial or unresolved is a private oracle only, never shipped.

**8. Coverage made executable where a registry exists.**
`tools/content/tests/test_reuse_census.py` fails when a registered mechanism has no census
row, and when one has two. The registries are:
- the generator families (`family_contracts.json`);
- the detectors (`DETECTOR_IDS`);
- the drill kinds (`catalog.static.json`).

Scoring rules and progression mechanisms have **no registry in code**. Inventing one to
make the check pass would be process for its own sake, so they stay listed by hand in §9
and the test says so.

**What this audit is for** (the reviewer's sentence, adopted): *not to modernise the
codebase, but to reduce the amount of musical truth this project invents.*

**What follows from it:**
- **Every row allows five outcomes:** keep as is, narrow the claim, retire, replace, or
  defer as unsolved. Narrowing or retiring is preferred when it solves the correctness
  problem.
- **Four decisions stay separate:** content source, musical definition, implementation, and
  pedagogical placement.
- **Preference order:** real content > data lookup > library call > small sourced rule >
  new algorithm.
- **Priority is semantic risk first:** false teaching, false evidence, wrong gating, wrong
  labels, wrong generated content. Elegance and duplicate code come later.
- **Before any broad replacement,** one representative vertical slice is proven end to end
  against an independent oracle.
- **No universal content engine.** §4's pipeline is a pattern each family may use; it is
  not a shared abstraction to migrate everything into.
- **No new musical mechanism during the measurements.**
