# Brief: primary-source check for the sight-reading and early-reading rows (fact-gathering, 2026-10-05)

Decision rationale (§10b): wave 1(d), the sight-reading specification experiment, may fix no parameter until the named primary sources are read (`docs/review/responses/e8ac9382.md`, application 4), and the dossier-dependent rows in core and theory that touch reading carry a `[D]` gate. Alternatives: trust the dossier (rejected by the reviewer), or third-party transcriptions where official pages returned 403 (rejected: official PDFs exist). What would reverse it: nothing; sources are read or the rows are downgraded. Uncertainty: some official pages may still not load; then the row stays gated and says so.

The agent writes exactly one file, `docs/prompts/runs/curriculum-review-2026-10-05/SOURCE-CHECK-reading.md`, changes nothing else, commits nothing. It may fetch the web. Never name an AI model. No pedagogical judgement: quotes, page numbers, URLs and a confirmed/downgraded verdict per claim.

## The rows to check

From `CURRICULUM-UPGRADE.md` section 0 item 4 (the dossier-dependent list) and section 2.1 (core) and 2.9 (theory-ear), every row whose evidence cell cites `[D]` and concerns reading, sight-reading, notation marks, rhythm or metre, key signatures, aural tests at Grade 1, or the Faber reading and transposition claims. List them by track and item text first, then check each.

## Sources, primary only

- ABRSM Piano Practical syllabus 2025-26 PDF (the dossier's URL; if it fails, the ABRSM site's current syllabus PDF): the sight-reading parameter table by grade, the aural tests at Grades 1-3, scale requirements at Grades 1-2.
- RCM Piano Syllabus 2022 PDF (the dossier's URL or the RCM teacher portal): sight reading and ear tests at Preparatory and Levels 1-2.
- Faber Piano Adventures: the Primer, Level 1, 2A and 2B "things to know" or Q&A pages (the dossier's URLs), for where eighths, dotted quarter, I-IV-V7 in C, G, F, and transposition are introduced.
- Where a page returns 403 or will not load, try the official site's current equivalent once; if that fails, say "not reachable on 2026-10-05" and leave the row gated. Do not substitute a third-party transcription.

## Output per claim

Row id and text; the source actually read (title, URL, page or section); the quote (short, under 25 words) or the table cell; verdict CONFIRMED, CONFIRMED WITH CORRECTION (state it), or NOT REACHABLE; what the app-level specification may take from it (evidence input, never an automatic requirement).

End with a table of all rows and verdicts, and the list of sources reached and not reached. Reply in at most ten lines: the file path; rows checked n/n; confirmed, corrected, unreachable counts; the corrections in one line each.
