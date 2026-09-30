# X40 — Which tempo is authoritative: every tempo fact of *Maple Leaf Rag* and of every MuseTrainer and kern row read at its line, a table of what plays against what is printed, a check that fails where a sound contradicts the printed mark beside it, each wrong row's fix recorded with its identity cost (P2; evidence lane; the reader unchanged)

**Read first:**
- **Procedure.** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13.
- **The row.** `docs/prompts/backlog-2026-09-25.md`:710. **The ruling**, `docs/review/responses/questions-7fb976cb.md`:41–47: decide which fact is authoritative for playback and import, and why. Never fix the lesson to 120. Never alter the reader globally for one file. The inconsistency needs its own evidence. Also `responses/02a52fdb.md`:28–30: no lesson asserts 100 or 120 until this is resolved.
- **The tempo model.** `app/src/score/tempoFromXml.ts`:30–34 (at one position a sound beats a mark; among several sounds the first in score order wins); :224–243, `resolve` (:237 keeps the first sound); :252–264, the opening. X3d's closure is at backlog :699, X31 at :701, X38 at :708, and X31/X31a are Entries 144 and 154 in `docs/pending-review.md`.
- **Rows.** This lane closes X40 and settles no other X row. X34 (the store's regex) and X38 (music21's gaps) are about other readers. The table records Satie's pair (`pending-review.md`:28903) as data only.

## Premises at the lines (HEAD 034d4039)

1. **The source row states no tempo.** `content/sources/musetrainer.json`:632–647 has none, and no row there has a tempo field: its only "tempo" string is a concept, at :548. `kern.json` has no tempo field either. Its marks appear only as `editionNotes` prose (:283 "Tempo di marcia" for Maple Leaf's kern edition; :333; :381 "[quarter]=100").
2. **No score is committed.** `.gitignore`:36 ignores `content/scores/imported/*`, and the clones are fetched (`tools/content/fetch.py`:70–80). The app plays the build's `scores/imported/song.ragtime.joplin-maple-leaf-rag.mxl` (`import_musetrainer.py`:346). That file is a verbatim copy (:318) of the clone's `scores/Maple_Leaf_Rag_Scott_Joplin.mxl`: a single part that has a tempo is never normalised (:116). At drafting the two copies had the same size and the same tempo lines (MuseScore 2.1.0, encoded 2017-05-21).
3. **The MusicXML holds both facts** (`lg-209522180.xml`):
   - pickup bar (number 0), :104–113: ♩ = 100 with `<sound tempo="100"/>`;
   - bar 1 (:150), after a sixteenth rest (:155–161): the words "Tempo Di Marcia" with `<sound tempo="120"/>` (:162–168), then ♩ = 100 with `<sound tempo="100"/>` (:169–178);
   - bar 51: "TRIO" with 120 (:13203–13209), then ♩ = 100 with 100, twice (:13210–13229).

   The printed mark carries its own sound, so the contest is sound against sound at one position, and the reader keeps the first (:237): the app plays 100 in the pickup, 120 from bar 1's second sixteenth and from bar 51. The row's "`tempoFromXml` takes the sound" is narrower than the file.
4. **Where 100 is stated.** The printed marks above, and the catalogue's `tempoBpm`. The importer reads `tempoBpm` as the first `<sound tempo=` in the file, by regex (`import_musetrainer.py`:131–133), which here is the pickup's 100. That makes a third definition: it agrees with the app's opening but not with bars 1–84.
5. **The kern edition** `song.ragtime.joplin-maple-leaf-rag.kern` (`kern.json`:276, `variantOf`) has `*MM100` in all three spines (`mapleleaf.krn`:17). "Tempo di marcia" appears only as `!!!OMD`, at :6. Its built file writes one ♩ = 100 with a sound of 100, in bar 0, so it plays 100 throughout. Its catalogue fact is `*MM`, read by regex (`import_kern.py`:132, :314–316).
6. **Identity is the built file's sha256** (`tools/content/review.py`:270–271). Any change to a built score's bytes moves its identity. A catalogue field or a source-table field on its own does not.

## Hypothesis and its refuting test

**Hypothesis:** the source row or the importer carries a tempo that the notation contradicts, so the reader is right and the data is wrong. **Refuting test:** the MusicXML itself holds a sound tempo and a printed mark that disagree. Then the question is the reader's choice between them, which is X31's and X3d's territory: report it, and never change the reader.

At drafting the refuting condition holds for Maple Leaf (premises 1–3): the importer adds nothing and the file holds both. The lane reports the reader's choice as evidence and asks which of the two sounds the edition means; item 2 tests the same reading on every other row.

## What is decided

1. **Maple Leaf, every tempo fact.** For both files, list each tempo statement, the catalogue row, and the reference edition's opening page (`content/scores/imported/kern/joplin/reference-edition/mapleleaf.pdf`: is a metronome mark printed, or only "Tempo di marcia"?). Give each with its file and line, and the app line that uses it: `tempoFromXml.ts` for playback, and the catalogue's readers found by grep (for example `DevMicroscopeScreen.ts`:788). Then say which fact is authoritative for playback and which for import, and why. Any mechanism proposed for the 120 (for example an editor's default tempo attached to a text marking) stays a hypothesis until item 2's table shows the pattern; say which it is.
2. **The table.** One row for each row of `musetrainer.json` and `kern.json` that builds a file, with these columns:
   - id, and source (MT or kern);
   - the source-table tempo: a field, or the `editionNotes` prose quoted;
   - each printed mark, with its position and its value in quarter notes;
   - every `<sound tempo>` at the same position, in score order;
   - what plays: the reader's bpm at the opening and at each position where the facts disagree;
   - the catalogue's `tempoBpm`;
   - the verdict: agrees, sound contradicts the mark beyond R, two sounds at one position, or no tempo (defaulted).

   Read the built files through the app's reader (`tempoEvents`, `openingTempo`), never a Python copy of it (X31's rule); the raw sound list from a read-only scan beside it, labelled as such.
3. **Fixes.** Fix only data that the read proves wrong and whose change moves no identity: an `editionNotes` sentence that its own file contradicts. Every other fix changes a built file's bytes, because the MuseTrainer file is upstream's, copied as it is, and a kern file is converted through `convert.py`, which is E50a's. Record each such fix per row: the change proposed, the mechanism it would need, and the identities it moves. Defer it until E50a lands and put it to the reviewer as a question. Do not invent a per-row tempo override in an importer. `tempoFromXml.ts` and both importers' readers stay unchanged.
4. **The check.** One vitest test over the built MuseTrainer and kern scores, reading them through `tempoEvents` and the unzip that existing tests use. A finding is an event whose `from` is `'sound'`, that has a `mark` beside it, and where the larger of bpm and `mark.quarters` divided by the smaller exceeds R.
   - Set R in the test, with its reason, below 1.2 so that Maple Leaf's 120/100 fails. Use 1.1 unless the table shows a legitimate pair between 1.1 and 1.2; if it does, make the case in the test.
   - Compare the findings with a pinned list in both directions: a new finding fails, and a listed finding that no longer holds fails. Each entry names its row and X40.
   - The test must not pass vacuously. It fails, and never skips, when the built folder is missing, when Maple Leaf's file is absent, or when the number of files read differs from the catalogue's MT and kern rows that have a built file. Kern rows are tagged `nc-personal-build`, so expect them to be absent from the strict flavour.
   - Red first with the list empty, naming Maple Leaf at ordinals 1 and 51 (120 against 100). Green once the list is filled from item 2.
5. **Identity.** This lane moves no identity, so neither the ladder nor the catalogue is regenerated. Under E50a's rules a tempo repair to a built file moves that file's identity (premise 6), so any such repair waits for E50a's former-identity path. If an item seems to need a regenerated catalogue, stop and say why.

## Verification layers

- **Unit.** The new test, red then green (item 4), with synthetic cases: a pair that agrees, a pair at exactly R, a mark with no sound, and two sounds at one position.
- **Data.** The table (item 2) and the Maple Leaf fact list (item 1), every value given with its line.
- **The rest of the chain.** `npx tsc -b --noEmit`; `npm run lint`; the one test file; `python tools/docs/checks_for_paths.py` on the files touched. No Playwright.
- **Product.** Nothing a learner hears changes in this lane. Which pace Maple Leaf should play is *unverified as music*: the owner supplies no musical review, so the report gives the evidence and leaves the pace undecided wherever it needs an ear.
- **Mutants.** (a) Disable the check (the comparison returns no findings): the empty-list red on Maple Leaf kills it. (b) Widen R to 1.25: Maple Leaf's pinned entry goes stale and kills it. Keep each mutant run's output.

## Rules and files

**You own:** the new test file under `app/tests/unit/` and any fixture it needs; the `editionNotes` lines that item 3 corrects; `docs/prompts/runs/X40/`; and the `docs/08` test-map line for the test, in the entry's `## Doc rows`.

**Not yours:**
- `app/src/**`, above all `tempoFromXml.ts`; and `tools/content/import_*.py`;
- E50a's files: `convert.py`, `build.py`, `material.ts`, `catalog.schema.json`, `types.ts`, `load.ts`, `encounterStore.ts`, `progressStore.ts`, `test_convert_cache.py`, `test_measured_truth.py`; and E50's `pdmx.json` rows;
- L120c's and L120d's content-gate files: `content/lessons/4.4.md`, `content/curriculum/**`, `vocabulary/demands*.json`, `claims.py`, `untaught_on_rung.json`, `test_untaught_options.py`, `test_taught_at.py`;
- every lesson.

**Deviate** when a premise here is wrong at the line: say so, take the better path, and record why. Record and classify an adjacent problem; never fix it on the spot.

**Base.** Origin's head at dispatch (HEAD at drafting: 034d4039), stated in the entry.

**Harness.**
- Work in your own worktree. Run `npm ci` in `app/`. Copy `content/scores/imported/{kern,musetrainer}` and `build/cache` read-only from the main checkout, then run `python tools/content/build.py --offline` (or copy `app/public/content` from the main checkout and say so). Never commit, push, stash or reset. Never write in the main checkout. No Playwright.
- Keep temp state under the worktree's `build/`. Keep no log over 300 KB (keep the summary and the failing names, and say the full log was not kept). When done, delete `app/node_modules`, `app/dist` and the copied clones and caches. Every item is done or has an explicit not-done line. Never name an AI model.

## Report

**Judgement first:**
- which Maple Leaf fact is authoritative for playback and which for import, and why, with *unverified as music* in the first lines;
- whether the hypothesis held for any row;
- the pattern the table shows.

**Then** Done / Not done / Follow-ups / Questions / Files.
- **Follow-ups:** each deferred fix with its row, change, mechanism and identities; the catalogue's regex reader as a third definition, classified.
- **Questions for the reviewer:** the shape of the deferred fix; and whether "the first sound at a position" should give way to a sound that agrees with the printed mark. That rule is X3d's, not this lane's.

After those: the table (item 2) in full; the fact list (item 1); the check's red and green lines; the mutants; exit codes; what is unverified beside what passes; `## Doc rows`. Technical and pedagogical verdicts apart; the pedagogical one: nothing taught changes.

**Entry.** The number is Entry 173. Every run file goes under `docs/prompts/runs/X40/`, with the entry at `docs/prompts/runs/X40/ENTRY.md`.

## Reviewer's approval and conditions (`responses/questions-bd7d303e.md`)

Approved for dispatch 2026-09-30 as an evidence lane. The reviewer's words below govern wherever the brief's earlier text differs: no change to `tempoFromXml` or to file bytes in X40; the full table as a run artifact, the handoff showing every disagreement in full and summarising clean rows by counts; the test over the complete corpus, failing non-vacuously; the provisional product rule (a printed numeric metronome mark outranks a conflicting auxiliary sound tempo at the same position) tested against the corpus before any reader change, which is not X40's.

# 3. X40 — which tempo is authoritative

**APPROVE FOR DISPATCH AS AN EVIDENCE LANE.**

The evidence question is real and correctly separated from E50/E50a. Do not change `tempoFromXml` or file bytes in X40.

## Reporting efficiency

Scan every MuseTrainer/kern file that the brief requires, but do not turn the handoff into hundreds of repeated prose rows.

- Keep the machine-readable/full table as a run artifact.
- In the reviewer handoff, show every disagreement/nontrivial case in full and summarize clean agreement/no-tempo rows by counts/categories.
- The test still covers the complete corpus and must fail non-vacuously if expected files are absent.

## Provisional product rule

If the evidence remains exactly as described for Maple Leaf — an explicit **printed numeric metronome mark of quarter = 100** and a conflicting auxiliary `<sound tempo="120">` attached to the words *Tempo di Marcia* at the same score position — the learner-visible numeric metronome mark is the stronger authority for playback.

Reason: the learner sees an explicit numerical instruction; an invisible conflicting playback hint should not silently override it. That is a product/notation truth, not a preference for one parser field.

X40 should still test the corpus before turning that into a general reader change. If the corpus reveals legitimate cases where the first sound intentionally differs from a co-located printed mark, bring those cases back. No reader change belongs in X40 itself.
