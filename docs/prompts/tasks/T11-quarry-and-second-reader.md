# T11 — The quarry for latin and hymns, reviewed by a reader instead of the owner

**Read `docs/prompts/working-rules.md` first, then `docs/00-invariants.md`, then
`docs/prompts/tasks/T5-quarry.md` (this task is T5 with the gate changed), then the
checklist in `CLAUDE.md` ("Before reporting any piece of work"). A hook puts that
checklist in front of you before your turn can end; answer it honestly and say what it
caught.**

## What changed since T5

The owner's decision (2026-09-21, `docs/pending-review.md` standing context 5): he is not
the gate. `review.py`'s rule that *"only an ear decides what is worth practising"* is
amended: **a reader deciding from the notation and the plan, with the evidence written
down, marks `keep` or `reject`.** Nothing is heard; say so.

## State on disk, to be checked before relying on it

- `build/pdmx-p22b/review/index.html` and `review.csv`: 41 rows, `decision` empty on all
  41 (measured 2026-09-21). These are already quarried and rendered.
- `build/pdmx-genres/candidates.json`: the full shortlist; 136 candidates marked
  `IN ARCHIVE` in `docs/genre-plans/*.md` have never been extracted. Latin (23 waiting) and
  hymns (19) are the best value: most waiting, holes at four or more stages each.
- All 37,261 scores are unpacked under `build/pdmx/library/`.

## Do

1. **Review the 41 first.** For each row, one item per tool call: read its notation
   (`tools/content/archive_notation.py` or `dump_score.py` on the converted file), find
   which rung the genre plan wanted it for, check it against that rung's `requires` and
   `levelBand` in the stage file and against what the plan says the rung teaches. Write
   `decision` (`keep` / `reject`), `level_override` if the estimate is plainly wrong, and a
   `note` in this shape:
   `<fields read: key, metre, staves, bars, symbols, LH pattern> | <rung> | <why it fits or does not>`
2. **Quarry latin and hymns**, per T5 steps 1–6, into `build/pdmx-p23/`. No `--skip-render`.
   Verify the render ran: `render_steps` and `render_cursor_steps` present, non-zero and
   equal on every ok row. If the preview server will not start, stop and say so; a skipped
   render is never a pass.
3. **Review the new page the same way**, one row per call.
4. **Commit into the catalog** (`commit.py`) only the rows marked `keep`, so they are in
   `content/sources/pdmx.json` and the Library. Splice text; do not re-serialise
   `pdmx.json` (`CLAUDE.md` records the 8,186-line diff that comes from doing so). Do not
   place anything on a rung: building the rungs is the next task and needs the lessons.
5. **Report the rejection rate per band.** The two earlier runs were 89 % and, at band
   7–9, 53 %; a rate far from those is itself a finding.

## Rules

- Files: `build/pdmx-p22b/review/review.csv`, everything under `build/pdmx-p23/`,
  `content/sources/pdmx.json` (splice only), and one appended entry in
  `docs/pending-review.md` (Entry 25: gate-by-gate numbers, refusals with reasons,
  rejection rate per band, every `keep` with its note, what is unverified). Nothing under
  `app/` or `tools/content/` except reading; other agents are there.
- You may use port 4173 for the quarry's render. Nobody else will.
- Do not run `vitest` or Playwright. The content build only if `commit.py` requires it;
  say so if you did.
- One item per call with its evidence line (`working-rules` §2.4). A title is not the
  music. Never state an absence without two searches. A plural is several claims.
- Your scratch folder: `C:\Users\yalir\AppData\Local\Temp\claude\C--Users-yalir-repos-Piano-Stuff\26d8772b-b51d-4e51-bd51-20002e98bae1\scratchpad\T11\`.
- Never name an AI model anywhere you write. Commit nothing to git.
- Every row on both pages gets a decision, or the entry names the rows that did not.

## Final message to the coordinator

Rows reviewed on each page; keeps and rejects per track and band; what was committed to
the catalog; the render verification numbers; what is unverified.
