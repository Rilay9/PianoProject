# CT1 session notes: the directions and state to keep across compaction

> **Superseded** by `HANDOFF.md` beside this file and by the content-recovery foundation. Kept for provenance only.

Written 2026-10-03 on `claude/content-truth`. The authoritative instructions are
`CLAUDE.md` (*Reuse before reinvention*) and the CT1 brief on
`origin/claude/piano-teaching-app-bo19td`. These notes keep the owner's and the reviewer's
later directions, which those two files do not yet hold.

## The owner's directions in this session, in order

1. **Use cheap agents for rote work.** Credits are limited.
2. **Audit and plan, do not build.** Make the plan forward, with a reviewable breakdown of
   existing content. Avoid the old mistakes.
3. **Look for what already exists:** datasets, syllabi, generators, references. Research;
   do not guess from memory.
4. **The real value is architecting library-based, correct generation of more complex
   exercises.** Translate it into common-sense instructions.
5. **Reset to one source of truth.** `CLAUDE.md` and the CT1 brief win over chat messages.
6. **Don't make a new terrible generator.** See what is worth keeping and what can be much
   better, in detail.
7. **Weigh a review before acting on it** (the reviewer's points are evidence, not orders).
8. **The local machine holds the PDMX archive** (`archive_search.py` reads the owner's
   `PDMX.csv`).
   - Put content suggestions in a clear breakdown, and the owner chooses.
   - The Zenodo catalogue is sketchy, and some Mutopia pieces have their own issues.
   - **Check what the repository already documents before measuring again.**
9. **Look at the content mistakes and the repository first.** Don't redo work already done.

## The reviewer's directions (weighed, then adopted)

- **The census is the right artifact.** Two things guard it from becoming source-of-truth too
  early:
  - every REPLACE label is a candidate;
  - each row allows five outcomes: keep, narrow, retire, replace or defer.
- **`HS1` is accompaniment, never Alberti.** An Alberti claim needs the expert accompaniment
  label **and** the sourced figure check.
- **ABRSM, RCM and Faber stay separate source tables,** then a crosswalk that records
  disagreement.
- **The generator and the checker are independent implementations** of one sourced
  definition.
- **Real content needs a verified passage-level claim.** A Joplin rag is not stride practice
  until those bars are shown to hold the figure.
- **Licences:**
  - O3's annotations are ODbL and its scores CC BY-NC-SA 4.0;
  - PSyllabus is unresolved;
  - non-commercial or unresolved data is a private oracle only.
- **The aim is less invented musical truth,** not modernising the codebase. The preference
  order is real content > data lookup > library call > small sourced rule > new algorithm.
- **Priority is semantic risk.** Prove one vertical slice before any migration. No universal
  content engine.
- **Next artifact: a content coverage matrix.** Per curriculum concept or rung, seven needs:
  - explain;
  - demonstrate;
  - isolate;
  - practise repeatedly;
  - transfer;
  - assess;
  - progress from.

  Each cell names its material's kind: REAL CONTENT, DERIVED REAL CONTENT, VERIFIED GENERATED
  DRILL, EXISTING LIBRARY OR DATA, MANUAL-ONLY or UNSOLVED. The matrix exposes the holes.
- **Four numbers show convergence** (the repository demonstrates it, not either model's
  confidence):
  1. **Unsupported claims:** only ever go down.
  2. **Hand-invented musical mechanisms:** only ever go down, unless a search proves one is
     needed.
  3. **Curriculum targets with complete trusted coverage:** only ever go up.
  4. **Known unresolved musical questions:** may rise for a while (discovering ignorance is
     progress), but each must end sourced, narrowed, manual-only or explicitly unsupported.
- **Brakes.** Stop at any of these:
  - replacement code before the evidence;
  - a grand generator framework;
  - "music21 can do X" taken as "X is pedagogically right";
  - one magic level scale;
  - genre taken as a figure;
  - new heuristics because data is inconvenient;
  - polishing infrastructure while learner-facing errors remain;
  - more tests without more independent evidence;
  - filling holes with dubious generated content instead of searching the corpus.
- **The realistic target.**
  - Everything the app asserts as fact is supportable.
  - Everything it credits is observable.
  - Everything it teaches comes from defensible pedagogy.
  - Anything that needs human judgement comes from trusted real material, or is not claimed.

## The state of the branch (newest last)

| Commit | What |
|---|---|
| `168ba4a` | reuse-map.md: part zero |
| `2e93516` | figures.py and test_figures.py (candidate matchers), concept-kinds.json, figures_catalogue.py |
| `216e28b` | reuse-map.md §8: oracles and libraries |
| `c993da7` | pending-detect.patch (not applied) |
| `6cb815c` | plan.md |
| `1aab09f` | reuse-map.md §9: the reuse census (64 rows) |
| `4ac3609` | the review's corrections; spelling-paths.txt; test_reuse_census.py |
| `2399ab0` | measurements-2026-10-03.md: Mutopia and PDMX holdings; the texture oracle |

**Open decisions for the owner:**
1. FSRS, or the current review rule.
2. Curriculum reorders after the level crosswalk.
3. Bank versus Pyodide.
4. Non-commercial data used as a private oracle only.
5. Alberti where the experts hear the line as partly melodic (`MS1`).

**Downloaded to the scratch `build/ct1/`, which is not kept:**
- the RCM, ABRSM and Faber PDFs and their text;
- the ALGOMUS archive;
- `PDMX.csv` (from Zenodo; the owner has their own copy).

The three level files are being extracted to `levels/`.
