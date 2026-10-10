# Code-detectable score characteristics: the easy batch, for review

On the owner's word (2026-10-10, `docs/inputs/2026-10-10.md`): a CSV of the definite, easy-to-implement characteristics, one implementation idea per row, drawing on the old branch's library work, newer libraries and ChatGPT's detectability review; then ChatGPT reviews; then we build. Nothing here is built yet.

## Files

| File | What |
| --- | --- |
| `characteristics-easy.csv` | **For review.** 48 rows: E01-E46 are score facts (E28 was dropped), D01-D03 are difficulty statistics. Columns: fact, ChatGPT's ids, what it reports, exact definition, implementation, library and prior evidence, pitfalls, tests (pass / fail / fool), how often the element occurs in our 842 candidate files, which rungs or checks use it, why it is easy. Written by `make_easy_csv.py`. |
| `chatgpt-detectability-213-with-claude.csv` | ChatGPT's 213 rows with two added columns: `claude_batch` (EASY Exx, PATTERNS, HARMONY, STEP 4, DONE, SKIP) and `claude_opinion` (agreement or disagreement with its label, and why). Written by `add_claude_opinion.py`. Counts: EASY 77, SKIP 82, PATTERNS 28, HARMONY 12, STEP 4 8, DONE 6. |
| `chatgpt-detectability-213.csv`, `chatgpt-detectability-README.md` | ChatGPT's review as received. |
| `old-library-findings.md` | What the old branch (commit c8b33af6) measured about libraries for these facts (a Sonnet agent's extraction; read-only). |
| `new-library-research.md` | music21 10.5.0 and partitura 1.9.0 functions run on corpus piano scores, and published difficulty code (a Sonnet agent's research). |

## Conventions every row follows

- **Staff, never hand.** Rows report staff 1 and staff 2. The old branch measured the staff rule disagreeing with a second reader on 3.3% of notes in a 33-item sample, and wrong on 41.5% of notes under printed hand words.
- **One supported layout.** One pitched part with two staves (E01). Any other layout gives UNKNOWN for every per-staff row; nothing is guessed.
- **Raw MusicXML is the reference reader; music21 is the second reader.** The old branch's raw walk read 2,020 files with 0 errors. partitura is avoided for tempo, dynamics and voices (it missed tempo marks, classed a word as a dynamic, and crashed on voice estimation and grace notes in 1.9.0).
- **Encoded, not displayed.** Accidentals are the file's `<accidental>` elements. Which accidentals a renderer shows was 11.1% wrong in the old model, so it is left out.
- **Locations use printed bar numbers** (E02), so a reader or a Haiku agent can find the bar.
- **Unknown stays unknown.** Examples: no tempo gives no notes per second; an unclosed 8va is reported as unclosed; a word outside a closed list is listed, not classified.

## How each row will be tested when built

Each row gets three kinds of hand-made case (the `tests_pass_fail_fool` column): one that must be found, one that must not, and one built to fool it. Then 30 real outputs are sampled and checked by reading the bars, with the share that is right reported before any count is quoted. These are the step-3 rules in `test_cases.py` and the memory "test scripts before use".

## Not in this batch (see `claude_batch` in the 213-row file)

- **PATTERNS (next batch):** Alberti bass, waltz bass, oom-pah, boogie and walking bass, broken chords, scale and arpeggio runs, syncopation, five-finger positions and others. Their definitions are the risk, so each needs a quoted definition and fooling cases first. Alberti and waltz bass come first, because rung 1.5 still has no piece.
- **HARMONY:** key estimation, Roman numerals, cadences. These are estimates that need their own test sets.
- **Repeat expansion:** playing order and played length. The old branch found music21's expander right on 27 of 81 disputed files and partitura's on 21.
- **STEP 4:** generator-side checks. Every easy row doubles as a check that a generated exercise contains what its spec says.

## Questions for the reviewer

1. Is any row here not actually easy, or defined so that it will mislead?
2. Is any easy, useful fact missing?
3. D02's pass mark (within one level on 70% of held-out chosen.csv files) and its fooling check (shuffled levels must score at chance): sensible?
4. D03, the published CIPI model, needs its own Python environment on Windows. Is it worth trying before or after D02?
