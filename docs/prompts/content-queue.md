# The content queue: one job at a time, in this order (the owner, 2026-10-03)

**Order principle: reuse and research first, to minimise the work left.** Replacing hand-built code with established libraries and data removes whole classes of bugs before anyone fixes them by hand. Then research only the gaps no library covers. Then align what remains.

**Every job:**
- reads `CLAUDE.md` (its first section, *Reuse before reinvention*) and `docs/prompts/content-mistakes.md`;
- **starts from what is already discovered**:
  - `docs/prompts/runs/CT1/reuse-map.md` and `plan.md` on branch `claude/content-truth`, the cloud session's census of 64 labelled rows;
  - the backlog (`docs/prompts/backlog-2026-09-25.md`, the R, E, G and L rows above all; use `docs/prompts/views/`);
  - `docs/prompts/runs/CL10a/` (the research note, the oracle, the corpus diff);
  - the reviewer's responses in `docs/review/responses/`;
  - `docs/prompts/pending-review.md`.

  Never rediscover what is recorded, and never contradict it without evidence.
- **is one cloud session on its own branch** `claude/cq<N>`, cut from the current head of `claude/piano-teaching-app-bo19td`, and pushed only there. Never merge, never push to the working branch.
- **takes no new instructions mid-job.** A change goes into this file or `CLAUDE.md`, never into the chat.
- **ends with:**
  - its finish check met;
  - `docs/prompts/runs/CQ<N>/ENTRY.md`, with the five questions of `CLAUDE.md` answered and the content-mistakes items checked;
  - a push.

  Then the outside reviewer reviews it before the next job starts.

## 1. Adopt the libraries and the data (removes the most hand-built code)

- **Build time:** music21 computes the notation facts (keys, chords and inversions, Roman numerals, metre and beat strength, ties, tuplets, clefs, ledger lines, intervals) for the built catalogue, and the app reads them.
- **App side:** Tonal replaces the hand-written theory and spelling tables, per the reuse map's R4.
- **The expert-annotated datasets and published syllabi** are fetched as test oracles where their licences allow: DCML, When in Rome, the Couturier, Bigo and Levé Mozart textures, CIPI, PSyllabus, ASAP; RCM and ABRSM.
- **Delete each hand-built path the library replaces,** or reduce it to an adapter checked against the library on the whole catalogue.

**Finish check:** every row the reuse map marks REPLACE WITH LIBRARY or REPLACE WITH DATA is done, or carries a recorded reason. The catalogue is rebuilt, and every claim that changed is itemised.

## 2. Research and build only the gaps (what no library covers)

- **The named accompaniment figures:** Alberti, broken-chord, waltz bass, oom-pah, stride, boogie, walking bass, each from its published definition. Start from `tools/content/figures.py` and its tests on `claude/content-truth`, reviewed as they stand.
- **Split `claims.py:79–85` into one claim per figure.**
- **Test** against the source's examples, near-misses (scales, Hanon, arpeggios: the 16 golden models and CL10a's oracle items) and the Mozart texture annotations where they cover the bars.
- **Anything else the reuse map marks UNSOLVED:** research it, or claim less.

**Finish check:** every claimed concept is backed by a library function or a sourced matcher. The known false positives are refused.

## 3. Align what remains

- **Rungs:** every claimed concept is present in the rung's music, with the bars named, or listed as a gap.
- **Generators**, build-time and live: they produce what they claim, with spelling from music21. A generator that does not is fixed; the claim is never bent to fit.
- **Corpus items used for teaching:** the checks in content-mistakes item 17.
- **Levels** against RCM, ABRSM and Faber: a report. Reorders are the owner's decision.

**Finish check:** the three reports are complete, and every mismatch is fixed or recorded with its owner.

## 4. The modes credit only what they observe

The adversarial table from CT1 version 2 becomes tests through the real record path.

**Finish check:** every row passes.

**Safety net throughout:** an unsupported claim may restrict, keeping music from a beginner, but never grant: it never teaches, establishes or earns credit. It runs through one deny-by-default resolver.
