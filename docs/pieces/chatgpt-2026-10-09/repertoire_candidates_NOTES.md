# Improved older-project repertoire candidate ledger

**180 rows**; this is a source-backed candidate inventory, **not** a complete independently graded inventory. The original 128 rows are retained; **47 individually named Joplin Kern editions, 3 individually named pop/film/rock PDMX leads, and 2 aggregate quarry leads** were added. Duplicates across source editions are deliberately preserved.

## Newly recovered strong leads

- **Ragtime:** The older `content/sources/kern.json` individually names 47 Joplin scores with original Humdrum file paths, estimated grades and pedagogical concepts. These are substantially stronger leads than an anonymous genre count. **Grade is old-project estimate, not an ABRSM grade confirmation.** The old source says the Sapp editions are **CC BY-NC-SA**, so do not assume public redistribution rights.
- **Pop/film/rock:** *River Flows in You* (3 machine-passing uploads), *Merry Christmas Mr. Lawrence* (2), and *Final Masquerade* (1). The P14 quarry says these survived machine gates but explicitly says no listening review occurred. Their rungs are therefore **Unassigned**, not guessed from reputation. Copyright also restricts distribution.
- **Broader PDMX:** the old first-run record reports **125** pop/film/game and **16** jazz/Latin machine-passing rows. These are aggregate buckets, not 141 individually identified suitable piano arrangements, and they may overlap named leads. They are not fabricated into individual song rows.
- **Teaching music:** Retains Bach inventions, Duvernoy, Lemoine, Mozart, Schumann and others from the prior ledger, with collection-level summaries clearly distinct from individually named works.

## Four separate evidence dimensions

1. **Identity evidence**: exact named file vs reported collection vs broad aggregate.
2. **Transcription evidence**: technical machine-gate acceptance vs hash-tied passage fact vs independent score comparison (not performed here).
3. **External grading**: a verifiable syllabus citation, distinct from the older project's approximate grade. No new independently confirmed board grades were added in this revision.
4. **Rung confidence**: whether an actual arrangement's suitability for the current rung is established. `Low` and `Unknown` are intentional. Genre rungs (`RG.3`) indicate a teaching destination, not a precise graded equivalence.

## What remains missing

The full old `content/sources/pdmx.json` is large and could not be retrieved through the available GitHub fetch interface. Its **individual entries remain unaccounted for**; the large Chopin/Kern grouped editions likewise remain unenumerated. The old quarry's proposed output lives in a local build directory and was not present in the accessible tracked record. The 34 Lemoine studies and 23 early Mozart pieces are therefore kept as *collection leads* rather than given invented individual identifiers. No claim of exhaustive identification, grade research, or score verification is made.

Source baseline: `claude/piano-teaching-app-bo19td` at `https://github.com/Rilay9/PianoProject`; P14 decision record `docs/decisions/2026-09-06-p14-pdmx-quarry.md`; curated Kern source `content/sources/kern.json`.
