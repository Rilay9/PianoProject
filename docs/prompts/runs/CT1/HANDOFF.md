# CT1 (`claude/content-truth`) — final handback

This session is stopped. It hands back what it learned and decides nothing about what comes
next. The direction of record is `docs/prompts/content-recovery-foundation.md` and
`docs/prompts/content-queue.md` (draft PR #2, `chatgpt/content-recovery-path`). Read
against this repository, those files contradict nothing found here. Their summary of CT1's
corrected findings is accurate.

**Base:** `abb62a0`. **Head of this branch at handback:** the commit that adds this file.
No application code was changed on this branch.

---

## 1. SAFE TO CARRY FORWARD

Each item is supported by code read at the base, an external source opened here, or a
measurement whose method is written down. Its scope is stated.

**Code facts at `abb62a0`** (observed by reading or scripting the code):
- **`leftHandPattern` reads two-hand exercises as accompaniment.** `app/src/demands/detect.ts:514`
  finds a "pattern" whenever staff 2 strikes more than once per bar under a playing staff 1.
  So two-hand scales, Hanon and arpeggios read as accompaniment. The 16 golden models in
  the CT1 brief's appendix were re-read here.
- **Seven named styles share one demand.** `tools/content/claims.py:79–85` maps seven named
  styles onto that one demand.
- **Chords are never identified from notes.**
  - `tools/`: no call to music21's `romanNumeralFromChord`, `commonName`, `chordify` or
    `inversion()`. The one hit is a comment explaining why `midi_to_musicxml.py:769` avoids
    `chordify`.
  - `app/src`: Roman numerals go one way only, numeral to chord, to build drill prompts
    (`engine/drills/harmony.ts:201`, `theory.ts:305`).
- **Key estimation is Aarden–Essen.** music21 10.5's `analyze('key')` resolves to
  `AardenEssen` (checked); the app's browser port in `app/src/import/midi/key.ts` copies
  those weights.
- **Key naming is hand-written at least seven times in the Python tools.**
  - `notation.key_name:138`;
  - `import_kern.key_name:158` and `mode_for:255`;
  - `import_musetrainer.key_name:143`;
  - `build._key_words:276` and `settle_key_signatures:291`;
  - `author.key_name:156`;
  - `score_checks.signature_key:420`;
  - `candidates.sounds_minor:69`.
- **Unlisted chord kinds are matched on a major triad.** `app/src/score/harmony.ts:137` does
  this for any MusicXML `<kind>` outside its 20-entry table.
- **The review pick ignores its own sort.** `curriculum/session.ts:1490` sorts the due list
  by overdue, then `pick()` (`:446`) returns `due[seed % len]`, so the sort decides nothing.
  This is CL12a's file: a dependency, not touched here.
- **Review intervals.**
  - Skills: `RETENTION_DAYS = 21` (`evidence/ladder.ts:80`).
  - Pieces: `REPERTOIRE_WINDOW_DAYS = 14` (`session.ts:463`).
  - Both are labelled hypotheses in the code.
- **`requests` is unused.** It is declared in `tools/content/requirements.txt` and imported
  nowhere under `tools/` (grep).
- **The generators' spelling paths** (`spelling-paths.txt`, a call-graph script):
  - **`up()` and `SEMITONE_INTERVAL`.** About 25 families spell chord tones through `up()`,
    which gives each semitone count one interval name (`SEMITONE_INTERVAL`,
    `generate_exercises.py:3480`). 6 semitones is always A4 and 8 always m6.
  - **No key-derived helper:** `chromatic`, `blues_scale`, `pentatonic`, `riff`, `tresillo`,
    `swing_pair` and `modal_vamp`.
  - **The `up()` table only:** `triad_inversions`, `five_finger` and `ostinato`.
  - **Literal note names:** `rhythm`, `clave`, `syncopation`, `meter` and `modal_vamp`.
  - **Composed separately:** `study.py`.
  - A name passed through `pitch.Pitch` is not thereby checked.
- **The accompaniment table matches its source.** `generate_exercises.py:2189`'s Alberti
  order `[0, 2, 1, 2]` over the chord's notes, low to high, is low–high–middle–high,
  Hutchinson §14.3's definition (as quoted in search results; the page itself was blocked
  at the time).

**External sources opened or fetched here** (2026-10-03):
- **RCM Piano Syllabus 2022:** fetched from the RCM S3 link in `reuse-map.md`.
- **ABRSM Piano 2025–26:** fetched with a browser user-agent. Its sight-reading parameters
  table is on PDF p. 17 (printed p. 16), and it is cumulative by grade.
- **ABRSM Music Theory specification (April 2023):** fetched.
- **Faber Piano Adventures correlation chart (2017, 3 pp.):** fetched. It is a publisher's
  guide for moving between method books, not an exam.
- **ALGOMUS "Mozart Piano Sonatas"** (doi:10.57745/OHRWPC; data.gouv.fr file id 596605):
  - per-bar texture labels for K. 279, 280 and 283;
  - **annotations ODbL, scores CC BY-NC-SA 4.0** (the archive's README);
  - the syntax: layers M (melody), H (harmonic), S (static); `HS1` is a single-voice
    accompaniment layer (ISMIR 2022 paper, which says a typical Alberti bass is an `HS1`
    example, not that every `HS1` is Alberti).
- **Texture descriptor code:** `gitlab.com/algomus.fr/symbolic-texture-dataset` and
  `comparing-texture`. GPL-3.0 (GitLab API), Python over music21 streams.
- **PIG fingering dataset:** non-profit academic use only, with registration (its site,
  as reported by search).
- **PDMX:** the Zenodo dataset record is CC BY 4.0. Per-score licence fields mean nothing,
  per the repository's own record (`docs/decisions/2026-09-06-p11-replan.md:61`).
- **PSyllabus:** licence **unresolved** (sources disagree). A private oracle only, if used.

**Measurement: the texture oracle** (`measurements-2026-10-03.md` §2; `texture_oracle.py`;
`texture-oracle.json`):
- **Set-up.** The candidate `figures.py` was run unchanged against the ALGOMUS expert labels:
  - 1,161 labelled bars over 9 movements;
  - 589 expert accompaniment bars (a melodic layer above an H or S layer);
  - the archive's own MusicXML, with `<harmony>` stripped, and the notes untouched.
- **Results:**

  | Matcher | Bars flagged under a tune | Inside expert accompaniment |
  |---|---|---|
  | Alberti | 68 | 61 |
  | Broken chord | 194 | 151 |
  | Waltz | 9 | 1 |

- **Coverage.** 430 of the 589 expert accompaniment bars carry no figure flag.
- **What it establishes:**
  - **Figure matchers cannot stand in for "accompaniment present".**
  - **The waltz matcher fails on this repertoire:** it takes left-hand octaves and dyads for
    bass–chord–chord.
  - **4 of Alberti's 7 misses** fall on bars the experts label `M1/MS1(S1/M1)`, a
    partly-melodic lower layer.
- **What it cannot establish:** Alberti recall, because the experts do not name Alberti.

**Licence and scope rule (adopted by the foundation):** non-commercial or unresolved data
is a private test oracle only, never shipped.

---

## 2. CANDIDATE / NOT ESTABLISHED

These are proposals or unverified work. None of them is evidence on its own.

**Candidate code and inventories:**
- **`reuse-map.md` §1–§9:**
  - Every label (KEEP, REPLACE WITH LIBRARY, REPLACE WITH DATA, ADAPT EXISTING, USE REAL
    CONTENT, UNSOLVED) is a candidate.
  - R0–R12 is a candidate list, not a plan.
  - The 64-row census and its counted totals are an inventory of candidates.
  - Its file and line facts are observations, as in §1.
- **`tools/content/figures.py` and `test_figures.py`:**
  - Candidate matchers for seven figures. Its 20 tests pass, and the 16 appendix false
    positives come out negative on the golden models.
  - Alberti: about 9 in 10 precision against expert accompaniment, with recall unknown.
  - Broken chord: about 3 in 4.
  - Waltz: failed.
  - Oom-pah, stride, walking and boogie: untested on expert data.
  - Its "mirrored" rule and the stride leap of 12 semitones or more are this session's own
    readings, not sourced numbers.
- **`tools/content/figures_catalogue.py`:** a catalogue runner, **never run**.
- **`pending-detect.patch`:** **not applied, not typechecked, not tested.** The foundation
  rules it out as a quick fix.
- **`concept-kinds.json`:** 286 concepts classed (a) 187, (b) 33, (c) 66. An agent drafted it
  and I corrected the kinds, with no second read.
- **`levels/abrsm-2025.json`, `rcm-2022.json`, `faber-correlation.json`:** an agent's
  extraction with page provenance.
  - **Not second-read.** RCM has 2 unread values and 43 uncertain ones.
  - Only ABRSM's sight-reading table was compared with my own reading of the text.
  - No crosswalk exists.
- **`tools/content/tests/test_reuse_census.py`:** a coverage test for the census. It proves
  its own red. It enforces a candidate document, so whether it belongs on the working branch
  is the orchestrator's call.

**Candidate proposals:**
- **`plan.md` (all sections):** the pipeline idea (recipe, then library realisation, then
  independent checks), the workstreams W1–W11, the source register S1–S8 and O1–O10, and the
  owner decisions. Proposals only; the foundation and the queue govern.
- **`content-suggestions.md`:** candidate content leads tied to gaps recorded in
  `rung-claims.md` and the backlog. **Leads only:** nothing was admitted, and no passage was
  verified.
- **Reference implementations** (`reuse-map.md` §9.0): PianoBooster, ynot99, Perfect Ear,
  ftrain and others. Read through page summaries; function names unverified.
- **Further oracles found by search, not opened:**
  - FiloBass (walking-bass statistics);
  - the iRb corpus and Jazz Harmony Treebank (jazz progressions);
  - DCML Mozart and When in Rome (Roman numerals);
  - CIPI (difficulty);
  - ASAP (performance alignment).
- **Library suggestions:** Tonal for theory tables, ts-fsrs for review, partitura's pitch
  spelling as the independent spelling check, OR-tools for constrained generation, and
  MusPy metrics. Each is a candidate whose fit is unmeasured.

---

## 3. SUPERSEDED / WRONG

**Never resurrect these.**

1. **"Every generator family spells correctly by construction through music21"**
   (`reuse-map.md` §9.1 at `1aab09f`). Wrong: corrected at `4ac3609` from the call graph
   (§1 above).
2. **"O3-labelled `HS1` bars are Alberti material"** (`plan.md` §4.1, §4.6 and §10 before
   `4ac3609`). Wrong: `HS1` is accompaniment function only.
3. **"One definition, used in both directions"** (the generator and the matcher sharing one
   object; `plan.md` §2.5 before `4ac3609`). Wrong: it would be self-certification.
4. **"One level table" merging RCM, ABRSM, Faber and ABRSM theory** (`plan.md` §4.2 and W8
   before `4ac3609`). Wrong: separate source tables, then a crosswalk that keeps
   disagreement.
5. **O3 "CC BY 4.0"** (`plan.md` §3b, `reuse-map.md` §8.3, before `4ac3609`). Wrong:
   annotations ODbL, scores CC BY-NC-SA 4.0. **PSyllabus "CC BY 4.0"** is wrong as a settled
   fact: it is unresolved.
6. **Census totals typed as estimates** (30 / 15 / 12 / 13 / 12 / 5). Replaced by the
   counted 23 / 14 / 9 / 9 / 7 / 2 over 64 rows; those are still candidate labels.
7. **"18 Joplin rags on Mutopia are candidates"** (`measurements-2026-10-03.md` §1). Wrong
   against `content/sources/mutopia.json` and `docs/03-content-pipeline.md:93–150`: the rags
   were checked and refused, and only Pine Apple Rag is in.
8. **"Clementi Op. 36 from PDMX fills the gap."** Wrong: three Op. 36 rows are already
   committed, and Nos. 2–3 were lost to a licence conflict
   (`docs/decisions/pedagogical-quarry.md:104`).
9. **The Mutopia and PDMX holdings presented as new findings**
   (`measurements-2026-10-03.md` §1). They repeat earlier quarry work: the repository's
   records win, and the Zenodo catalogue is unreliable.
10. **"Joplin from KernScores for stride, oom-pah and the secondary rag"** as material. Not
    established: genre proves nothing, and each passage needs verifying.
11. **The first texture-oracle run** (before `2399ab0`'s numbers). Its gold parser dropped
    the `2h[…]` prefixes and the comma-split parts of a label; the published numbers are the
    rerun's.
12. **`plan.md` as the program of work.** Superseded by the foundation and the queue. In
    particular, "level extraction now" sits at the queue's end, after coverage is stable.
13. **"The Mozart scores for O3 are already fetched" as the oracle's input.** The kern files
    exist (`content/scores/imported/kern/mozart-piano-sonatas/kern/sonata0{1,2,5}-*.krn`),
    but the measurement used ALGOMUS's own MusicXML, to which the labels are keyed.

---

## 4. FILES WORTH PRESERVING

All files are under `docs/prompts/runs/CT1/` on `claude/content-truth`, unless a path says
otherwise.

| File (commit) | Allowed to establish |
|---|---|
| `HANDOFF.md` (this commit) | Which CT1 outputs are evidence, candidate or wrong |
| `measurements-2026-10-03.md` (`2399ab0`, `0055fba`, `4e2b4d9`) | §2: the texture-oracle numbers and their limits. §1: nothing beyond "Mutopia's listing pages show these titles"; the superseded note at its top governs. §3: the extraction's status only |
| `texture_oracle.py`, `texture-oracle.json` (`2399ab0`) | Reproduces §2, given the ALGOMUS archive (file id 596605) and the `<harmony>` strip described in it |
| `spelling-paths.txt`, `families-ast.txt` (`4ac3609`, `1aab09f`) | Which helper each generator family's spelling passes through, and which tables and music21 calls each uses, at `abb62a0`. Not whether any spelling is right |
| `reuse-map.md` (up to `4ac3609`) | The component inventory with file and line, as observation. All labels and R-items are candidates |
| `levels/abrsm-2025.json`, `levels/rcm-2022.json`, `levels/faber-correlation.json` (`4e2b4d9`) | Page-cited leads to what each source prints. **Not second-read.** Use only after a line-by-line check against the PDFs |
| `content-suggestions.md` (`0055fba`) | Leads tied to recorded gaps. Nothing admitted |
| `tools/content/figures.py`, `tools/content/tests/test_figures.py` (`2e93516`) | Candidate matchers and their constructed tests; the texture results above are their only outside evidence |
| `tools/content/tests/test_reuse_census.py`, `docs/08-test-map.md` row (`4ac3609`) | A coverage check over a candidate document. The orchestrator decides whether it lands |
| `concept-kinds.json` (`2e93516`) | A drafted and corrected classification of 286 concepts; not second-read |
| `pending-detect.patch` (`c993da7`) | Kept for the record only; ruled out as a fix |
| `SESSION-NOTES.md` (`8b4f6b9`) | The directions given during this session, for provenance. **Superseded by this handback and the foundation** |
| `plan.md` | Provenance only; not a plan of record |

**Not committed** (scratch `build/ct1/`, lost with the container):
- the fetched PDFs and their text;
- the ALGOMUS archive;
- the Zenodo `PDMX.csv`.

All of them can be fetched again from the links above.
