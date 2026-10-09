# mark.repeat and notation.times: the current detectors against the library readers (step 3, two characteristics), 2026-10-08

**What this is.** One of the bounded comparisons of handoff step 3 (`docs/prompts/handoff-2026-10-08.md`), on two characteristics only: `mark.repeat` (area 1A, validation status failing) and `notation.times` (area 1C, failing). It follows the method of the pilot (`docs/classifier/evidence/1B/comparison/key.md`): the expected answers for the named items are stated before the readers are run, every figure below comes from a script in this folder, what did not run is listed, and the page ends in one recommendation line per characteristic. Nothing is rewritten and no rule page, survey or validation file is edited. Base commit c47f18c7; no file outside `docs/classifier/evidence/1A/comparison/` changed (scratch caches are under `build/cmp1A/`, ignored by git).

**Labels.** *measured*: a script in this folder produced it on the data named. *reading*: my reading of a score's printed structure (repeat signs, voltas, jump words, bar lengths), a hand-written bar path that `rep_readings.py` only adds up, or a reading of a source file; not run as a reader. Nothing here has been heard.

## 1. What was compared

**Catalogue.** The built catalogue `app/public/content` of the main checkout, read in place (`catalog.json`, 2,100 items; 2,020 with a notated file). Python 3.11.9, music21 10.5.0, partitura 1.9.0 (the repo's `.venv`).

**mark.repeat.**
- *Current detector*: the unroller of `evidence/1A/validation/r_repeat.py` (`unroll`, written to the spec in `rules/area-1A.md` section 23), run unchanged on the validators' raw MusicXML walk (`walk.py`, `common.py`). Both are executed from their source with two path substitutions in `walk.py` (the catalogue folder instead of the validators' build folder; the cache under `build/cmp1A/`), see `rcommon.py`.
- *Fix the validation row points to*: the two-coda-signs convention, which the validators already implemented as `unroll(w, coda_pair=True)` (the first of two coda signs with no "To Coda" words is the jump point). Measured by re-running the same function with it, and nothing more.
- *music21*: `repeat.Expander(part 0)`, defaults (`repeatAfterJump=False`), through the validators' own `m21_played`; `None` = `isExpandable()` is false.
- *partitura*: `score.unfold_part_maximal(part)` (default `ignore_leaps=True`), `unfold_part_maximal(part, ignore_leaps=False)` (no repeats after a leap, the nearest to the page's convention) and `unfold_part_minimal(part)`, found in the installed `partitura/score.py` (the module also has `iter_unfolded_parts`, `unfold_paths`, `unfold_part_alignment`); count = number of `Measure` objects of the unfolded part, a fresh `load_musicxml` for each call because `get_paths` adds segments to the part.
- *Files*: every catalogue file with repeat structure, by the predicate of the validators' `survey_repeat.py` (a forward or backward repeat barline, an ending, a segno, a coda, or a jump / Fine / Coda word in part 0): **329 files** (`rep_structure.py`: 211 PDMX ids, 118 other, 0 generated; 45 with jump words). The rules page (section 23, "Validation") counts 211 PDMX and 120 other; this run finds 118 other. The 2-file difference is not traced (the validators' copy of the catalogue was taken earlier the same day; their file list is not in the repo).
- *Right count*: for the named items, stated before running (`expected_repeat_named.json`); for every file where the readers disagree, a bar path read from the printed structure by hand (`rep_readings.py`), with the convention it needs named. The reading rules (R1 to R4 at the top of `rep_readings.py`) are the page's rules plus the usual engraving rules, so the unroller agreeing with the reading is partly by construction; the information is in the files where it does not, and in the files where a reading depends on a convention or the file does not say.

**notation.times.**
- *Current detector*: `evidence/1C/validation/times.py` (`measures`, `classify`, `device_runs`), unchanged, through `tcommon.py` (one path substitution in `common.py`: the built catalogue instead of the validators' `content` copy).
- *Fix the validation row points to*: drop the clause "a one-bar signature longer than the bars around it is a cadenza bar". Measured by re-running `times.py`'s source with its one label `cadenza bar (one longer bar)` replaced by `change`, and nothing more (`tm_run.py`).
- *Plain read, music21*: part 0's `Measure` list, the `meter.TimeSignature` in each measure (`ratioString`), carried forward; a change is a bar whose signature differs from the one before.
- *Plain read, partitura*: part 0's `TimeSignature` objects (`beats`, `beat_type`) placed at their `Measure`'s start, carried forward, same change rule.
- *Items*: the 49 catalogue items with a signature change (the validation row's number; reproduced, `tm_changes.py`), and the nine named ones.
- *Expected answers*: `expected_times_named.json`, written from the validation row and the rule page. **Order, stated plainly:** the current detector's labels for all 49 items (`tm_changes.txt`) and the bar-by-bar view (`tm_detail.py`) had been printed before that file was written; the expectations come from the row's wording and the bar lengths, not from those labels.

## 2. What did not run, and the limits

- **Nothing was heard**; no printed page was seen. Every "right count" is a reading of a score file's structure. Where a printed edition could differ (a coda sign at the start or end of a bar, a volta bracket that stops before its `:|`), the table says so.
- **The unroller's agreement with my reading is partly by construction** (same rules). It is not an independent check of the rules; it checks the code against its own spec and exposes where the spec leaves a choice.
- **The 241 files where the readers that gave a count agree were not read one by one.** A random sample of 12 of them (seed 7, drawn by `rep_spot.py`, read in `rep_readings.py`) was read: the agreed count equals the reading in 12 of 12. Agreement can be wrong (the Romance, where music21 and partitura both give 64), so this is a sample, not a clearance; in this set only one file has jump words (`tango-la-cumparsita...`, a bare Fine).
- **partitura errors**: `unfold_part_maximal` raised `IndexError('list index out of range')` on 6 files (in `list_of_destinations_from_last_segment`, reached through a 400-deep recursion of `unfold_paths`; seen in a traceback on `song.folk.so-danco-samba.pdmx`; cause not traced), `unfold_part_minimal` on 7. They count as "no count".
- **music21 errors**: one file does not parse (`song.classical.mozart-k545-i.alt`: `MusicXMLImportException: incorrect accidental 9.0 for pitch F3`); 38 files are not expandable (`isExpandable()` false).
- **Neither library takes a D.C., D.S. or coda from the words in the catalogue except music21 for the words it recognises**: partitura builds jump objects only from `<sound>` attributes; 1 of 329 files carry any (the Hungarian Sonata; there `unfold_part_maximal` returns the 49 printed bars and `get_paths` with `all_repeats=False` raises the same IndexError; `rep_pt_paths.py`).
- **Timing** (measured, 8 worker processes at once on this PC, so the relation matters, not the figures): per file, mean over the 329 files, unroller under 0.01 s after the raw walk (`rep_structure.py`, which walks all 2,020 files and fills the cache, took 53 s once), music21 parse + `Expander` 0.501 s (maximum 14.142 s), partitura three loads and unfoldings 0.826 s (maximum 5.05 s).
- Not run: any other library's repeat expansion (the survey names none); the printed-page check; a larger sample of the agreed files.

## 3. mark.repeat

### 3.1 Which readers gave a count (`rep_readers.py`, summarised by `rep_analysis.py`)

| reader | gave a count | error | no count (not expandable) |
| --- | --- | --- | --- |
| unroller (`r_repeat.unroll`) | 329 | 0 | 0 |
| unroller with the coda-pair fix | 329 | 0 | 0 |
| music21 `repeat.Expander` (part 0) | 290 | 1 | 38 |
| partitura `unfold_part_maximal` (default `ignore_leaps=True`) | 323 | 6 | 0 |
| partitura `unfold_part_maximal(ignore_leaps=False)` | 323 | 6 | 0 |
| partitura `unfold_part_minimal` | 322 | 7 | 0 |

### 3.2 The named items

Expected counts were written to `expected_repeat_named.json` from the printed structure and the sign positions (`rep_structure.py`, `rep_signs.py`) before `rep_readers.py` was run. Right = the reader's count equals the expected one. Carioca has no single right count (see below).

| item | expected (reading, written before the readers ran) | unroller | unroller + fix | music21 | partitura maximal (no leaps) | partitura minimal |
| --- | --- | --- | --- | --- | --- | --- |
| classical.anonymous-romance-anonimo-romanza.pdmx | 80 | 80 (right) | 80 (right) | 64 (wrong) | 64 (wrong) | 32 (wrong) |
| classical.haydn-sonata-in-g-major-hob-xvi-8.pdmx | 194 | 194 (right) | 194 (right) | 956 (wrong) | 194 (right) | 97 (wrong) |
| classical.beethoven-bagatelle-in-d-major-op-119-no-3.pdmx | 115 (or 114) | 133 (wrong) | 115 (right) | 115 (right) | 97 (wrong) | 61 (wrong) |
| folk.down-by-the-riverside.pdmx.2 | 78 | 122 (wrong) | 78 (right) | 78 (right) | 66 (wrong) | 66 (wrong) |
| classical.nazareth-carioca-1913.pdmx | none stated | 169 (no single right count) | 136 (no single right count) | none (no single right count) | 155 (no single right count) | 75 (no single right count) |

- **Romance (80)**: only the unroller takes the "D.C. al Fine" (the words carry an empty `<font>` markup); music21 and partitura both give 64 and agree on a wrong count. (*measured*, `rep_readers.json`.)
- **Haydn Hob. XVI:8 (194)**: music21 gives 956, partitura 194 and the unroller 194. Eight sections end in `:|`; four have a `|:` (18 to 46, 55 to 62, 68 to 73, 82 to 97) and four are closed by a lone `:|` (bars 17, 54, 67, 81), read as repeating the section since the previous `:|` (or bar 1); if a lone `:|` returned further back the count would be larger.
- **Bagatelle Op. 119 No. 3 (115)**: the unroller as it is gives 133; music21 115; partitura 97 (it ignores the D.C. al Coda). With the coda-pair fix the unroller gives 115. The first coda sign is written at offset 0.00 of bar 18 (`rep_signs.txt`); read literally the jump comes before bar 18 and the count is 114, music21 and the page read it as 115.
- **Down by the Riverside .2 (78)**: unroller 122, fix 78, music21 78, partitura 66. The coda sign is at the end of bar 16, so bars 5 to 16 are played.
- **Carioca (no single right count)**: the printed structure is bar 1, A with voltas 1 and 2 (bars 17, 18), B with voltas (50, 51) and "D.S. al Coda" at the end of 51, then the coda from 53 with its own `|:` and voltas (69, 70), then "D.C. al" at bar 78 whose Fine is the end of bar 18, volta 2 of an A section whose first volta is numbered "1,3". Up to the D.C. the reading gives 153 bars with the coda's own repeats played (137 if they are not played after the jump); the D.C. tail is 16, 17 or 33 bars depending on how volta "1,3" and the Fine in volta 2 are read, so the total is 169, 170 or 186 with the coda's repeats; the file does not say which. The unroller gives 169 (`rep_trace.txt`: the coda sign at bar 16 is not marked "To Coda", so after the D.S. it plays on through the whole piece; it takes only one jump, so the D.C. at bar 78 is never taken; the number is near a reading by coincidence), with the fix 136 (it skips both coda voltas, bars 69 and 70, by asking for volta 3, and still never takes the D.C.); 136 is below the smallest reading before the D.C. (137), so it is wrong under every reading. music21 cannot expand it; partitura gives 155 (repeats only, no jumps). Reported as the validation row did: unconfirmed.
- **Joplin rags (music21 over-expands)**: 49 files under `song.ragtime.*` have repeat structure; music21 expands 44 and equals the unroller on 31. Of the 13 ragtime files in the disagreement set where music21 gave a count, it differs from the reading in all 13: 12 over-expansions (1.2 to 9.0 times the reading; *School of Ragtime*, 33 printed bars, reading 66 bars, music21 592) and one under-expansion (*Maple Leaf Rag*, 130 against 145). The over-expanded files close their sections with a lone `:|` or have `|:` signs the reading pairs differently; music21's mechanism was not traced (a first guess, every lone `:|` returning to bar 1 once, gives 135 for *School of Ragtime*, not 592, so that is not it).

### 3.3 Agreement between the readers, all 329 files

| pair | files | agree | disagree | one reader gave no count |
| --- | --- | --- | --- | --- |
| unroller / music21 | 329 | 258 | 32 | 39 |
| unroller with the coda-pair fix / music21 | 329 | 260 | 30 | 39 |
| unroller / partitura maximal (no repeats after a leap) | 329 | 257 | 66 | 6 |
| unroller with fix / partitura maximal (no leaps) | 329 | 257 | 66 | 6 |
| unroller / partitura maximal (default) | 329 | 257 | 66 | 6 |
| music21 / partitura maximal (no leaps) | 329 | 240 | 50 | 39 |
| unroller / partitura minimal | 329 | 9 | 313 | 7 |

By group (pipeline, whether the file has jump words):

| group (pipeline, jump words in the file) | files | unroller = music21 | unroller ≠ music21 | music21 gave no count | unroller = partitura (no leaps) | unroller ≠ partitura | partitura gave no count |
| --- | --- | --- | --- | --- | --- | --- | --- |
| other, jump words | 4 | 1 | 0 | 3 | 0 | 4 | 0 |
| other, no jump words | 114 | 83 | 19 | 12 | 102 | 12 | 0 |
| pdmx, jump words | 41 | 23 | 6 | 12 | 1 | 39 | 1 |
| pdmx, no jump words | 170 | 151 | 7 | 12 | 154 | 11 | 5 |

All three of unroller + fix, music21 and partitura (no leaps) give the same count on 233 files, are not all equal on 57, and on 39 a reader gave no count. The unroller as it is gives the same three-way split (the fix changes 7 files, none of which is one of the 233).

### 3.4 The 88 files where the readers disagree: structure read, right count stated

A file is in this table when the counts given by the unroller, the unroller with the fix, music21 and partitura (no leaps) are not all equal. The partitura column is mostly a blind spot (it takes no jump words); music21 is not. "Right count (reading)" is my hand-written bar path (full paths and alternatives in `rep_readings.json`); *kind* is in `rep_readings.json` too: right = one count follows; convention = one count follows under the stated rule, the alternative is given; undetermined = the file does not say. Of the 88: 54 right, 27 convention, 7 undetermined.

| # | file | printed bars; structure printed in the score (`\|:` forward repeat, `:\|` backward, `V1` volta, signs and jump words; bar numbers 1-based) | right count (reading) | unroller | + fix | music21 | partitura (no leaps) | note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | beautiful.hungarian-sonata | 49; `10[SEGNO] 14[TOCODA] 31[JUMP:DS/coda] 32[CODA]` | 54 | 54 | 54 | 54 | 49 | D.S. al Coda from the end of 31 to the segno at 10, To Coda at the end of 14, coda 32-49 |
| 2 | beautiful.merry-christmas-mr-lawrence | 75; `16[:\|] 17[\|: SEGNO] 24[V1 :\| v-end] 25[V2 v-end] 57[JUMP:DS/None] 58[CODA]` | 138 | 138 | 138 | none | 98 | plain 'D.S.' (no 'al Fine' or 'al Coda') read as: segno 17 to the end of the piece; the coda sign at 58 has no 'To Coda' to pair with |
| 3 | blues.aunt-hagars-blues | 52; `41[\|:]` | 52 (64 if \|: at 41 repeats to the end (partitura)) | 52 | 52 | none | 64 | unbalanced: one \|: at 41, no :\| |
| 4 | blues.jazz-me-blues | 41; `21[\|:]` | 41 (62 if \|: at 21 repeats to the end (partitura)) | 41 | 41 | none | 62 | unbalanced: one \|: at 21, no :\| |
| 5 | blues.riverside-blues | 41; `16[V1 :\| v-end] 17[V2 v-end] 18[\|:] 29[:\|] 41[:\|]` | 80 | 80 | 80 | 136 | 80 | volta 1 = 16, volta 2 = 17; the :\| at 41 returns to bar 30 (R1) |
| 6 | blues.st-james-infirmary | 24; `17[\|:]` | 24 (32 if \|: at 17 repeats to the end (partitura)) | 24 | 24 | none | 32 | unbalanced: one \|: at 17, no :\| |
| 7 | blues.weary-blues | 43; `1[\|:] 11[CODA] 12[:\|] 13[\|:] 24[V1 :\| v-end] 25[V2 JUMP:DC/coda v-end] 26[CODA] 28[\|:]` | 77 | 90 | 77 | none | 82 | D.C. al Coda: to the coda sign at the end of bar 11, coda at 26; bar 11 holds two coda directions (offsets 0 and 4) |
| 8 | classical.beethoven-fur-elise | 106; `9[V1 :\| v-end] 10[V2] 11[\|:] 24[V1 :\| v-end] 25[V2 v-end]` | 127 | 127 | 127 | 106 | 127 | volta 1 = 9, volta 2 = 10; volta 1 = 24, volta 2 = 25 |
| 9 | classical.chopin-mazurka-op24-3.nifc | 46; `2[\|:] 15[\|:] 38[:\|]` | 70 (83 if the \|: at 2 pairs with the :\| at 38) | 70 | 70 | none | 83 | unbalanced: \|: at 2 and at 15, one :\| at 38; R1 pairs the :\| with the nearer \|: |
| 10 | classical.chopin-mazurka-op6-1.nifc | 75; `16[:\|] 18[\|:] 41[:\|] 43[\|:]` | 115 (148 if \|: at 43 repeats to the end (partitura)) | 115 | 115 | none | 148 | unbalanced: a final \|: at 43 |
| 11 | classical.chopin-mazurka-op6-2.nifc | 75; `9[\|:] 17[:\|] 18[\|:] 34[:\|] 35[\|:]` | 101 (142 if \|: at 35 repeats to the end (partitura)) | 101 | 101 | none | 142 | unbalanced: a final \|: at 35 |
| 12 | classical.chopin-mazurka-op68-2.nifc | 66; `18[\|:] 29[:\|] 31[\|:] 37[:\|] 38[:\|]` | 86 | 86 | 86 | 142 | 86 | a :\| at 38 straight after the :\| at 37 is read as a one-bar section (R1); no \|: is printed at 38 |
| 13 | classical.chopin-mazurka-op7-2.nifc | 60; `17[:\|] 18[\|:] 34[:\|] 59[:\|]` | 119 | 119 | 119 | 187 | 119 | the :\| at 59 returns to bar 35 (after the :\| at 34) |
| 14 | classical.chopin-polonaise-g-minor.nifc | 38; `12[:\|] 13[\|:] 22[:\|] 30[:\|] 31[\|:] 38[:\|]` | 76 | 76 | 76 | 120 | 76 |  |
| 15 | classical.chopin-polonaise-g-sharp-minor.nifc | 61; `12[:\|] 13[\|:] 27[:\|] 39[:\|] 40[\|:] 61[:\|]` | 122 | 122 | 122 | 176 | 122 |  |
| 16 | jazz.the-crave | 53; `52[JUMP:DS/coda]` | not stated (D.S. to bar 1, no coda sign: replays all: 105) | 105 | 105 | none | 53 | 'D.S. al Coda' but no segno and no coda sign anywhere in the file |
| 17 | ragtime.joplin-cascades | 76; `5[\|:] 21[\|:] 22[\|:] 37[:\|] 43[\|:] 58[:\|] 60[\|:] 75[:\|]` | 124 (141 if the \|: at 5 pairs with the :\| at 37) | 124 | 124 | none | 141 | unbalanced: \|: at 5, 21 and 22, one :\| at 37 (R1 pairs it with 22) |
| 18 | ragtime.joplin-chrysanthemum | 104; `5[\|:] 20[:\|] 37[:\|] 55[\|:] 70[:\|] 72[\|:] 87[:\|]` | 169 | 169 | 169 | 205 | 169 |  |
| 19 | ragtime.joplin-crush-collision-march | 107; `6[\|:] 21[:\|] 23[\|:] 38[:\|] 41[\|:] 56[:\|] 73[:\|] 75[\|:] 106[:\|]` | 204 | 204 | 204 | 308 | 204 |  |
| 20 | ragtime.joplin-elite-syncopations | 88; `5[\|:] 20[:\|] 37[:\|] 70[:\|] 72[\|:]` | 154 (171 if \|: at 72 repeats to the end (partitura)) | 154 | 154 | none | 171 | unbalanced: a final \|: at 72 |
| 21 | ragtime.joplin-eugenia | 103; `5[\|:] 20[:\|] 22[\|:] 37[:\|] 55[\|:] 71[\|:] 102[:\|]` | 167 (183 if the \|: at 55 pairs with the :\| at 102 (partitura)) | 167 | 167 | none | 183 | unbalanced: \|: at 55 and 71, one :\| at 102 |
| 22 | ragtime.joplin-leola | 85; `2[\|:] 17[:\|] 19[\|:] 34[:\|] 67[:\|] 84[:\|]` | 167 | 167 | 167 | 431 | 167 | lone :\| at 67 returns to bar 35, at 84 to bar 68 |
| 23 | ragtime.joplin-maple-leaf-rag | 85; `2[\|:] 17[V1 :\| v-end] 19[\|:] 34[V1 :\| v-end] 35[V2 v-end] 52[\|:] 67[V1 :\| v-end] 68[V2 v-end] 69[\|:] 84[V1 :\| v-end] 85[V2 v-end]` | 145 | 145 | 145 | 130 | 130 | volta 1 = 17 with no volta 2: skipped on the repeat, play goes on at 18 |
| 24 | ragtime.joplin-maple-leaf-rag.kern | 85; `2[\|:] 17[:\|] 19[\|:] 34[:\|] 52[\|:] 67[:\|] 84[:\|]` | 150 | 150 | 150 | 265 | 150 |  |
| 25 | ragtime.joplin-march-majestic | 89; `5[\|:] 20[:\|] 22[\|:] 36[:\|] 37[:\|] 55[:\|] 57[\|:] 88[:\|]` | 171 | 171 | 171 | 374 | 171 | a :\| at 37 straight after the :\| at 36 is a one-bar section (R1) |
| 26 | ragtime.joplin-new-rag | 111; `5[\|:] 20[:\|] 37[:\|] 55[\|:] 70[:\|]` | 160 | 160 | 160 | 196 | 160 |  |
| 27 | ragtime.joplin-nonpareil | 72; `5[\|:] 20[:\|] 22[\|:] 37[:\|] 54[:\|] 56[\|:] 71[:\|]` | 137 | 137 | 137 | 206 | 137 |  |
| 28 | ragtime.joplin-pleasant-moments | 98; `35[:\|] 36[:\|] 70[:\|]` | 168 | 168 | 168 | 380 | 168 | a :\| at 36 straight after the :\| at 35 is a one-bar section (R1) |
| 29 | ragtime.joplin-rose-bud-march | 94; `5[\|:] 20[:\|] 22[\|:] 37[:\|] 71[:\|] 78[\|:] 93[:\|]` | 176 | 176 | 176 | 245 | 176 |  |
| 30 | ragtime.joplin-rose-leaf-rag | 88; `5[\|:] 20[:\|] 22[\|:] 37[:\|] 55[\|:] 70[:\|] 72[\|:]` | 136 (153 if \|: at 72 repeats to the end (partitura)) | 136 | 136 | none | 153 | unbalanced: a final \|: at 72 |
| 31 | ragtime.joplin-school-of-ragtime | 33; `5[:\|] 9[:\|] 13[:\|] 17[:\|] 25[:\|] 33[:\|]` | 66 | 66 | 66 | 592 | 66 | six exercises, each closed by a lone :\| (R1); music21 592 returns to bar 1 each time |
| 32 | ragtime.joplin-stoptime-rag | 87; `8[:\|] 10[\|:] 17[:\|] 27[\|:] 42[:\|] 44[\|:] 51[:\|] 54[\|:] 61[:\|] 63[\|:] 70[:\|] 71[\|:] 79[\|:] 86[:\|]` | 151 | 151 | 151 | none | 159 | \|: at 71 and 79, one :\| at 86 (R1 pairs it with 79) |
| 33 | ragtime.joplin-swipesy-cakewalk | 88; `5[\|:] 20[:\|] 22[\|:] 37[:\|] 70[:\|] 87[:\|]` | 170 | 170 | 170 | 443 | 170 |  |
| 34 | ragtime.joplin-weeping-willow | 88; `5[\|:] 20[:\|] 22[\|:] 37[:\|] 70[:\|] 72[\|:] 87[:\|]` | 169 | 169 | 169 | 238 | 169 |  |
| 35 | classical.ah-vous-dirais-je-maman.pdmx | 16; `16[JUMP:DC/fine]` | not stated (D.C. replays all 16 bars: 32) | 32 | 32 | none | 16 | 'D.C. al Fine' with no Fine sign anywhere in the file: where the replay stops is not stated |
| 36 | classical.anonymous-romance-anonimo-romanza.pdmx | 33; `16[FINE :\|] 17[\|:] 32[V1 :\| v-end] 33[V2 JUMP:DC/fine v-end]` | 80 | 80 | 80 | 64 | 64 | D.C. al Fine to the Fine at the end of 16, no repeats |
| 37 | classical.beethoven-bagatelle-in-d-major-op-119-no-3.pdmx | 61; `9[:\|] 10[\|:] 18[CODA :\|] 19[\|:] 27[:\|] 28[\|:] 36[JUMP:DC/coda :\|] 37[CODA]` | 115 (114 if first coda sign taken at the START of bar 18 (offset 0.00): jump before bar 18) | 133 | 115 | 115 | 97 | two coda signs, no 'To Coda' words: the first is the jump point (the validation page's rule; offset 0.00 in bar 18 makes it 114 if taken literally) |
| 38 | classical.beethoven-ecossaise.pdmx | 18; `9[FINE] 10[\|:] 18[JUMP:DC/fine :\|]` | 36 | 36 | 36 | 36 | 27 | D.C. al Fine, Fine at the end of 9 |
| 39 | classical.burgmuller-le-courant-limpide-the-crystal-clear-stream.pdmx | 16; `8[FINE] 16[JUMP:DC/fine]` | 24 | 24 | 24 | 24 | 16 |  |
| 40 | classical.duvernoy-etude-op-176-no-8.pdmx | 24; `16[FINE] 24[JUMP:DC/fine]` | 40 | 40 | 40 | 40 | 24 |  |
| 41 | classical.handel-handel-g-f-menuet-hwv-434-4.pdmx | 38; `16[FINE :\|] 17[\|:] 38[JUMP:DC/fine :\|]` | 92 | 92 | 92 | 92 | 76 |  |
| 42 | classical.haydn-sonata-in-g-major-hob-xvi-8.pdmx | 97; `17[:\|] 18[\|:] 46[:\|] 54[:\|] 55[\|:] 62[:\|] 67[:\|] 68[\|:] 73[:\|] 81[:\|] 82[\|:] 97[:\|]` | 194 | 194 | 194 | 956 | 194 | lone :\| at 54, 67, 81 each return to the bar after the previous :\| (R1); if they returned to the start the count would be far larger (music21 956) |
| 43 | classical.hisaishi-totoro-path-of-the-wind.pdmx | 34; `2[\|:] 9[V1 :\| v-end]` | 41 | 41 | 41 | 34 | 34 | volta 1 = bar 9 only; no volta 2 printed, so bar 9 is skipped on the repeat and play goes on at 10 |
| 44 | classical.kohler-sonatina-op-300-no-1.pdmx | 113; `77[:\|] 93[:\|]` | 206 | 206 | 206 | 360 | 206 |  |
| 45 | classical.lemoine-etude-op-37-no-14.pdmx | 32; `16[FINE] 32[JUMP:DC/fine]` | 48 | 48 | 48 | 48 | 32 |  |
| 46 | classical.lemoine-etude-op-37-no-17.pdmx | 27; `9[:\|] 10[\|:] 18[FINE :\|] 19[\|:] 27[JUMP:DC/fine]` | 63 | 63 | 63 | none | 54 |  |
| 47 | classical.lemoine-etude-op-37-no-18.pdmx | 52; `16[FINE] 52[JUMP:DC/fine]` | 68 | 68 | 68 | 68 | 52 |  |
| 48 | classical.lemoine-etude-op-37-no-21.pdmx | 36; `10[\|:] 18[FINE :\|] 19[\|:] 27[:\|] 28[\|:] 36[JUMP:DC/fine :\|]` | 81 | 81 | 81 | 81 | 63 |  |
| 49 | classical.lemoine-etude-op-37-no-25.pdmx | 72; `5[SEGNO] 38[FINE] 39[\|:] 55[:\|] 56[\|:] 72[JUMP:DS/fine]` | 123 | 123 | 123 | none | 106 | no :\| at 72: 56-72 once; D.S. al Fine from the segno at 5 to the Fine at the end of 38 |
| 50 | classical.lemoine-etude-op-37-no-26.pdmx | 50; `2[SEGNO] 17[FINE] 50[JUMP:DS/fine]` | 66 | 66 | 66 | 66 | 50 |  |
| 51 | classical.lemoine-etude-op-37-no-27.pdmx | 36; `9[:\|] 10[\|:] 18[FINE :\|] 19[\|:] 27[:\|] 36[JUMP:DC/fine]` | 81 | 81 | 81 | 81 | 63 |  |
| 52 | classical.lemoine-etude-op-37-no-29.pdmx | 48; `8[:\|] 24[FINE] 25[\|:] 32[:\|] 48[JUMP:DC/fine]` | 88 | 88 | 88 | 88 | 64 |  |
| 53 | classical.lemoine-etude-op-37-no-32.pdmx | 32; `16[FINE :\|] 32[JUMP:DC/fine]` | 64 | 64 | 64 | 64 | 48 |  |
| 54 | classical.lemoine-etude-op-37-no-33.pdmx | 16; `8[FINE] 16[JUMP:DC/fine]` | 24 | 24 | 24 | 24 | 16 |  |
| 55 | classical.lemoine-etude-op-37-no-35.pdmx | 16; `8[FINE] 16[JUMP:DC/fine]` | 24 | 24 | 24 | 24 | 16 |  |
| 56 | classical.lemoine-etude-op-37-no-36.pdmx | 34; `2[SEGNO] 17[FINE] 34[JUMP:DS/fine]` | 50 | 50 | 50 | 50 | 34 |  |
| 57 | classical.lemoine-etude-op-37-no-39.pdmx | 32; `8[FINE] 32[JUMP:DC/fine]` | 40 | 40 | 40 | 40 | 32 |  |
| 58 | classical.lemoine-etude-op-37-no-40.pdmx | 27; `8[FINE] 27[JUMP:DC/fine]` | 35 | 35 | 35 | 35 | 27 |  |
| 59 | classical.lemoine-etude-op-37-no-42.pdmx | 40; `16[FINE] 40[JUMP:DC/fine]` | 56 | 56 | 56 | 56 | 40 |  |
| 60 | classical.lemoine-etude-op-37-no-44.pdmx | 28; `8[FINE] 28[JUMP:DC/fine]` | 36 | 36 | 36 | 36 | 28 |  |
| 61 | classical.lemoine-etude-op-37-no-45.pdmx | 20; `8[FINE] 20[JUMP:DC/fine]` | 28 | 28 | 28 | 28 | 20 |  |
| 62 | classical.lemoine-etude-op-37-no-6.pdmx | 40; `8[:\|] 16[FINE] 17[\|:] 24[:\|] 40[JUMP:DC/fine]` | 72 | 72 | 72 | 72 | 56 |  |
| 63 | classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx | 80; `29[\|:] 49[V1 v-end] 52[:\|]` | 103 (100 if volta 1 taken to span 49-52 (the :\| is at 52)) | 103 | 103 | none | 104 | volta 1 is stopped at bar 49 in the file but the :\| is at 52 and no volta 2 exists |
| 64 | classical.mozart-contredanse-in-a-major-k-15l.pdmx | 32; `16[FINE :\|] 17[\|:] 24[:\|] 25[\|:] 32[JUMP:DC/fine :\|]` | 80 | 80 | 80 | 80 | 64 |  |
| 65 | classical.mozart-contredanse-in-f-major-k-15h.pdmx | 24; `12[FINE :\|] 13[\|:] 24[JUMP:DC/fine :\|]` | 60 | 60 | 60 | 60 | 48 |  |
| 66 | classical.mozart-minuet-in-c-major-fragment-k-15rr.pdmx | 13; `8[:\|] 9[\|:]` | 21 (26 if \|: at 9 repeats to the end (partitura)) | 21 | 21 | none | 26 | unbalanced: a final \|: at 9 |
| 67 | classical.mozart-rondo-in-f-major-k-15hh.pdmx | 62; `16[FINE] 62[JUMP:DC/fine]` | 78 | 78 | 78 | none | 62 | 'Da capo al Fine' (words with italics markup), Fine at the end of 16 |
| 68 | classical.mozart-w-a-mozart-minuet-in-g-major-k1e.pdmx | 36; `9[:\|] 10[\|:] 18[FINE] 27[:\|] 28[\|:] 36[JUMP:DC/fine :\|]` | 90 | 90 | 90 | 72 | 72 | Fine at the end of 18 sits inside the repeat 10-27 and is ignored on the first passes; 'Menuetto da Capo al Fine' from 36 |
| 69 | classical.nazareth-carioca-1913.pdmx | 78; `2[\|: SEGNO] 16[CODA] 17[V13 :\| v-end] 18[V2 FINE v-end] 19[\|:] 50[V1 :\| v-end] 51[V2 JUMP:DS/coda v-end] 53[CODA] 54[\|:] 69[V1 :\| v-end] 70[V2 v-end] 78[JUMP:DC/None]` | not stated (before the D.C. (repeats inside the coda taken): 153, before the D.C. (no repeats inside the coda): 137) | 169 | 136 | none | 155 | the 'D.C. al' at bar 78 returns to bar 1 and the Fine is at the end of bar 18, volta 2 of an A section whose volta 1 is numbered '1,3' (bar 17): the tail is not determined, and whether the coda's own repeats are played after the jump is not stated |
| 70 | classical.pachelbel-pachelbel-chaconne-in-f-minor.pdmx | 185; `177[JUMP:DC/None]` | not stated (whole piece again (the unroller): 362) | 362 | 362 | none | 185 | 'Thema da capo' at bar 177 names the theme, not the piece; no Fine sign; bars 178-185 follow |
| 71 | classical.radetzky-march-for-easy-piano.pdmx | 88; `88[JUMP:DC/fine]` | not stated (D.C. replays all 88 bars: 176) | 176 | 176 | none | 88 | 'D.C. al Fine' with no Fine sign in the file |
| 72 | classical.st-louis-blues.pdmx | 28; `1[\|:] 12[:\|] 28[JUMP:DC/fine]` | not stated (D.C. replays all 28 bars: 68) | 68 | 68 | none | 40 | 'D.C. al Fine' with no Fine sign in the file |
| 73 | classical.streabbog-la-violette.pdmx | 52; `16[:\|] 17[\|:] 32[FINE :\|] 37[\|:] 52[JUMP:DC/fine :\|]` | 132 | 132 | 132 | 132 | 100 | D.C. al Fine, Fine at the end of 32 |
| 74 | folk.carioquinha.pdmx | 77; `7[\|: SEGNO] 36[CODA] 37[V1 v-end] 38[:\|] 39[V2 v-end] 72[JUMP:DS/coda] 73[CODA]` | 138 (137 if bar 38 belongs to volta 1 (the :\| is at its end)) | 172 | 137 | none | error | volta 1 is stopped at bar 37 in the file but the :\| is at bar 38; D.S. al Coda to the sign at the end of bar 36 |
| 75 | folk.dark-eyes.pdmx | 17; `2[\|:]` | 17 (33 if \|: at 2 repeats to the end (partitura)) | 17 | 17 | none | 33 | unbalanced: one \|: at 2, no :\| |
| 76 | folk.down-by-the-riverside.pdmx.2 | 66; `5[SEGNO] 16[CODA] 60[JUMP:DS/coda] 61[CODA]` | 78 | 122 | 78 | 78 | 66 | coda sign at the end of bar 16 (offset 4.00 of 4.00) |
| 77 | folk.margaritaville-keyboard-part.pdmx | 100; `7[SEGNO] 33[CODA] 38[JUMP:DS/coda] 39[CODA] 100[FINE]` | 127 | 132 | 127 | none | 100 | coda sign at the end of bar 33 |
| 78 | folk.o-holy-night-piano-solo.pdmx | 96; `23[\|:] 50[V1] 62[:\| v-end]` | 123 | 123 | 123 | 96 | 96 | volta 1 = 50-62 (:\| at 62), no volta 2 printed: skipped on the repeat, play goes on at 63 |
| 79 | jazz.bart-howard-fly-me-to-the-moon.pdmx | 22; `11[V1] 16[:\| v-end]` | 32 | 32 | 32 | 22 | 22 | volta 1 = 11-16, :\| at 16 with no \|: (back to bar 1) |
| 80 | jazz.vince-guaraldi-skating.pdmx | 137; `2[\|:] 5[:\|x4] 38[SEGNO] 57[CODA] 58[\|:] 61[V1 :\| v-end] 62[V2 v-end] 93[\|:] 96[:\|x3] 106[JUMP:DS/coda] 107[\|: CODA] 110[V1 :\| v-end] 111[V2 v-end] 127[\|:] 130[:\|x7]` | 179 (207 if repeats inside the coda taken) | 227 | 179 | 209 | 155 | times=4, 3, 7 read as total plays; D.S. al Coda from 106 to the segno at 38, To Coda at the end of 57, coda from 107; whether the coda's own repeats are played after the jump is not stated |
| 81 | pop.after-you-ve-gone.pdmx | 36; `17[\|:]` | 36 (56 if \|: at 17 repeats to the end (partitura)) | 36 | 36 | none | 56 | unbalanced: one \|: at 17, no :\| |
| 82 | pop.avalon.pdmx | 33; `2[\|:]` | 33 (65 if \|: at 2 repeats to the end (partitura)) | 33 | 33 | none | 65 | unbalanced: one \|: at 2, no :\| |
| 83 | pop.coldplay-clocks-coldplay.pdmx | 22; `4[:\|] 5[\|:] 8[JUMP:DC/None :\|] 9[\|:] 11[:\|] 12[\|:] 15[:\|] 16[\|:] 19[V1 :\| v-end] 20[V2 v-end]` | 37 | 37 | 37 | 38 | 40 | a plain 'D.C.' at the end of bar 8, before 14 more bars; read as: replay from bar 1 without repeats to the end, taking the last volta (20) |
| 84 | pop.coldplay-fix-you-coldplay.pdmx | 53; `13[\|:] 27[V1] 30[:\| v-end] 31[\|: V2 v-end] 38[:\|] 39[\|:] 46[:\|]` | 83 | 83 | 83 | 127 | 83 | volta 1 = 27-30, volta 2 = 31, then \|: at 31 repeats 31-38 |
| 85 | pop.eiffel-65-i-m-blue.pdmx | 61; `2[\|:] 3[:\|x3] 6[\|:] 7[:\|x3] 10[\|:] 11[:\|x3] 30[\|:] 31[:\|x3] 34[\|:] 35[:\|x3] 50[\|:] 51[:\|x3] 54[\|:] 55[:\|x3] 58[\|:] 59[:\|x3]` | 93 (77 if times=3 read as 2 plays (partitura)) | 93 | 93 | 93 | 77 | times=3 = three plays in all (music21's Repeat.times docstring) |
| 86 | pop.harry-styles-falling-by-harry-styles.pdmx | 89; `9[\|:] 16[V1 :\| v-end] 17[V2 v-end] 76[\|:] 82[V1] 83[:\| v-end]` | 102 | 102 | 102 | 96 | 96 | second volta pair: volta 1 = 82-83 with :\| at 83, no volta 2: skipped on the repeat, play goes on at 84 |
| 87 | pop.margie.pdmx | 48; `17[\|:]` | 48 (80 if \|: at 17 repeats to the end (partitura)) | 48 | 48 | none | 80 | unbalanced: one \|: at 17, no :\| |
| 88 | pop.toby-fox-sans-from-undertale-for-piano.pdmx | 12; `12[JUMP:DC/None]` | not stated (D.C. replays all 12 bars: 24) | 24 | 24 | none | 12 | a bare 'D.C.' on the last bar, no Fine sign |

Why 34 of the 88 depend on a reading or are not stated:

| why the count depends on a reading or is not stated | files |
| --- | --- |
| unbalanced repeat signs (a \|: with no :\|, several \|: before one :\|) | 16 |
| a :\| straight after another :\| (a one-bar section) | 3 |
| lone :\| read as ending the section after the previous :\| | 1 |
| volta bracket stops before the :\| (or no second volta) | 2 |
| jump taken to a sign or words the file does not hold (no Fine, no segno, no coda, bare D.C.) | 6 |
| jump words that need a reading (plain D.S., D.C. mid-piece, coda sign position, repeats inside the coda, a D.C. whose Fine is in a volta) | 5 |
| `times` on a :\| (music21 and the unroller read 3 as three plays; partitura as two) | 1 |
| all | 34 |

### 3.5 The readers against the reading (`rep_summary.py`), on the 81 determinable files of those 88

(Undetermined files, 7, are left out. "Right" counts a convention file as right when the reader gives the primary reading.)

| reader | right | wrong | gave no count | of |
| --- | --- | --- | --- | --- |
| unroller | 75 | 6 | 0 | 81 |
| unroller + coda-pair fix | 80 | 1 | 0 | 81 |
| music21 `Expander` | 27 | 30 | 24 | 81 |
| partitura maximal (no leaps) | 21 | 59 | 1 | 81 |
| partitura maximal (default) | 21 | 59 | 1 | 81 |
| partitura minimal | 7 | 72 | 2 | 81 |

- music21 is wrong on 30 files: 22 over-expansions (more bars than the reading; the largest is *School of Ragtime*, 592 against 66) and 8 under-expansions (for example Für Elise, 106 against 127, and O Holy Night, 96 against 123: its count equals the printed bar count, no repeat taken). It gave no count on 24 of these files. Split by jump words (*measured*, `rep_summary.txt`; the 88 files are selected for disagreement, so these are not catalogue rates): with jump words 26 right, 4 wrong, 7 no count; without 1 right, 26 wrong, 17 no count. Over the whole catalogue it gave a count on 290 files and equals the fixed unroller on 260 of them; the 30 others are the 30 wrong ones (the agreed 260 are taken as right, 12 of them sampled).
- partitura (no leaps), same split: with jump words 36 wrong of 37 (it takes none), without 21 right and 23 wrong; it equals one of the listed alternative readings (typically a lone `|:` repeated to the end) on 16 of the 27 files that have one, music21 on 0.
- The unroller as it is is wrong on 6 files; all six have two coda signs and no "To Coda" words, which is the case the fix addresses.

### 3.6 The fix (`unroll(w, coda_pair=True)`)

| file | unroller | + fix | music21 | right count (reading) |
| --- | --- | --- | --- | --- |
| blues.weary-blues | 90 | 77 | none | 77 |
| classical.beethoven-bagatelle-in-d-major-op-119-no-3.pdmx | 133 | 115 | 115 | 115 (114 by the alternative) |
| classical.nazareth-carioca-1913.pdmx | 169 | 136 | none | not stated (153; 137 by the alternative) |
| folk.carioquinha.pdmx | 172 | 137 | none | 138 (137 by the alternative) |
| folk.down-by-the-riverside.pdmx.2 | 122 | 78 | 78 | 78 |
| folk.margaritaville-keyboard-part.pdmx | 132 | 127 | none | 127 |
| jazz.vince-guaraldi-skating.pdmx | 227 | 179 | 209 | 179 (207 by the alternative) |

Measured: the fix corrects 5 of the 6 files the unroller got wrong against the reading (Bagatelle, Down by the Riverside .2, Weary Blues, Margaritaville, Skating) and leaves Carioquinha wrong. Carioquinha is a different fault: the unroller resets its pass counter at the `:|` of bar 38, which sits after the first-ending bracket (stopped at bar 37) and before the second ending (bar 39), so it never plays bar 39 (`rep_trace.txt`: path `7-36 38 40-72`); its 137 equals the reading's alternative (bar 38 inside volta 1, 137), but by a path that plays bar 38 and drops bar 39, so it is right for the wrong reason under that alternative and 1 short of the primary reading (138). Carioca's count goes from 169 to 136 (section 3.2): the fix does not touch the one-jump limit or the volta-by-number rule that break it. After the fix the unroller is wrong against the reading on 1 of 81 determinable files (Carioquinha) and is wrong or unconfirmable on Carioca.

### 3.7 The page's two-witness rule, measured

The rule on `rules/area-1A.md` section 23: the unroller and music21 agree, then accept (`two-witnesses`); otherwise UNKNOWN or `one-witness`, flagged. With the fix, music21 as the witness:
- accepted (unroller + fix = music21): 260 of 329 files; of those, 27 were read (they are in the disagreement set, mostly jump files) and 0 are wrong by the reading; the other 233 were not individually read (sample of 12: all right).
- flagged (they disagree, or music21 cannot expand): 69 files; of the 54 of those that were read and have a determinable count, the fixed unroller's count is right in 53; 8 flagged files were not read (music21 gave no count and the unroller and partitura agree).
- of the 34 files whose count depends on a reading or is not stated, the rule flags 32 and accepts 2 (classical.beethoven-bagatelle-in-d-major-op-119-no-3.pdmx, pop.eiffel-65-i-m-blue.pdmx): the Bagatelle (115 against 114 by the sign position) and *I'm Blue* (`times=3`, read as three plays by both music21 and the unroller).
- Without the fix the same rule accepts 258, flags 71; no accepted file that was read is wrong.
- partitura (no leaps) as the witness: agrees with the fixed unroller on 257 of 329 files, none of the read ones wrong (0), but it agrees only where there is nothing to jump.

### 3.8 What the numbers say

- *The current unroller with the validation row's fix is the most accurate reader on our catalogue* against my reading: right on 80 of 81 determinable disagreement files, against music21's 27 of 81 (and 24 with no count) and partitura's 21 of 81. It is the only reader whose count follows the jump words, except in files with two jumps (it takes one).
- *The fix is measured*: Bagatelle 133 to 115 and Down by the Riverside .2 122 to 78, as the row says; it also corrects Weary Blues (90 to 77), Margaritaville (132 to 127) and Skating (227 to 179), and makes Carioca worse (169 to 136).
- *But a count is only as good as the reading rules*: 34 of the 88 disagreement files (and, among the 241 unread agreed files, any like them) depend on a convention (unbalanced repeat signs, a one-bar `:|` section, a plain D.S., repeats inside a coda, `times`) or on words the file does not complete (a D.C. al Fine with no Fine). Library agreement does not settle those: music21 passes 2 of the 34.
- *music21's disagreements are informative*: it flags 32 of those 34, but within the 88 disagreement files it is wrong on 30 of the 57 where it gave a count, so as a second reader it sends many right counts to the agent (flagged files whose unroller count is right: 53 of 54 read).

## 4. notation.times

### 4.1 The 49 items with a signature change (`tm_changes.py`, `tm_run.py`, `tm_summary.py`)

| count over the 49 items with a signature change | signature changes / changes of metre |
| --- | --- |
| signature changes, raw reader (`times.classify`) | 187 |
| signature changes, music21 plain read | 187 |
| signature changes, partitura plain read | 187 |
| current detector: counted as changes of metre | 116 |
| current detector: reported apart as cadenza bar by words | 5 |
| current detector: reported apart as cadenza bar by the longer-bar clause | 32 |
| current detector: reported apart as device (pair or final bar) | 9 |
| current detector: reported apart as device? (one short bar at a boundary) | 25 |
| current + fix (longer-bar clause dropped): counted as changes of metre | 148 |
| items where the plain read and the current detector give a different count | 30 of 49 |
| items whose count the fix changes | 8 of 49 |

*measured.* The plain reads of music21 and partitura agree with the raw reader on all 49 items: same bar count, same signature per bar, same change indices (187 changes). So as a read of signatures and their bars they are interchangeable with the validators' walk. The current detector reports 116 of the 187 as changes of metre and sets 71 apart: 32 by the longer-bar clause, 25 as "device?" candidates, 9 as devices (pairs and final bars), 5 as cadenza bars by words.

### 4.2 The named items

Expected answers: `expected_times_named.json`. Two criteria are given: *item*, the number of changes of metre counted for the file equals the expected number; *named bars*, every named bar that is a signature change carries the expected class (a "device?" candidate counts as device). The plain reads cannot class a bar, so they count every signature change.

| item | expected (reading) | signature changes in the file | current detector: changes of metre / named bars | current + fix | music21 plain read | partitura plain read |
| --- | --- | --- | --- | --- | --- | --- |
| beautiful.mariage-damour | change, 22 change(s) of metre | 22 | 15 (wrong); named bars wrong | 22 (right); named bars right | 22 (right); named bars right | 22 (right); named bars right |
| folk.scarborough-fair-piano-solo.pdmx | change, 2 change(s) of metre | 2 | 1 (wrong); named bars wrong | 2 (right); named bars right | 2 (right); named bars right | 2 (right); named bars right |
| pop.misc-television-the-lonely-man-theme.pdmx | change, 2 change(s) of metre | 2 | 1 (wrong); named bars wrong | 2 (right); named bars right | 2 (right); named bars right | 2 (right); named bars right |
| classical.holy-holy-holy-lord-god-of-hosts-hugg-geo-c-hugg.pdmx | change, 1 change(s) of metre | 1 | 0 (wrong); named bars wrong | 1 (right); named bars right | 1 (right); named bars right | 1 (right); named bars right |
| classical.radetzky-march-for-easy-piano.pdmx | device, 0 change(s) of metre | 2 | 2 (wrong); named bars wrong | 2 (wrong); named bars wrong | 2 (wrong); named bars wrong | 2 (wrong); named bars wrong |
| classical.beethoven-bagatelle-in-d-major-op-119-no-3.pdmx | device, 0 change(s) of metre | 9 | 3 (wrong); named bars right | 3 (wrong); named bars right | 9 (wrong); named bars wrong | 9 (wrong); named bars wrong |
| classical.mozart-w-a-mozart-minuet-in-g-major-k1e.pdmx | device, 0 change(s) of metre | 6 | 3 (wrong); named bars wrong | 3 (wrong); named bars wrong | 6 (wrong); named bars wrong | 6 (wrong); named bars wrong |
| classical.mozart-w-a-mozart-minuet-in-c-major-k1f.pdmx | device, 0 change(s) of metre | 2 | 1 (wrong); named bars wrong | 1 (wrong); named bars wrong | 2 (wrong); named bars wrong | 2 (wrong); named bars wrong |
| classical.chopin-nocturne-op9-2 | cadenza, 0 change(s) of metre | 3 | 0 (right); named bars right | 0 (right); named bars right | 3 (wrong); named bars wrong | 3 (wrong); named bars wrong |

Named bars, by label:

| item | named bars (0-based index): label under the current detector | label under current + fix |
| --- | --- | --- |
| beautiful.mariage-damour | 2: cadenza-longer | 2: change |
| folk.scarborough-fair-piano-solo.pdmx | 101: cadenza-longer | 101: change |
| pop.misc-television-the-lonely-man-theme.pdmx | 3: cadenza-longer | 3: change |
| classical.holy-holy-holy-lord-god-of-hosts-hugg-geo-c-hugg.pdmx | 15: cadenza-longer | 15: change |
| classical.radetzky-march-for-easy-piano.pdmx | 71: change | 71: change |
| classical.beethoven-bagatelle-in-d-major-op-119-no-3.pdmx | 8: device, 9: device, 26: (no signature change), 27: device?, 35: device, 36: device, 60: device | 8: device, 9: device, 26: (no signature change), 27: device?, 35: device, 36: device, 60: device |
| classical.mozart-w-a-mozart-minuet-in-g-major-k1e.pdmx | 8: device?, 9: change, 17: device?, 18: change, 26: device?, 27: change | 8: device?, 9: change, 17: device?, 18: change, 26: device?, 27: change |
| classical.mozart-w-a-mozart-minuet-in-c-major-k1f.pdmx | 8: device?, 9: change | 8: device?, 9: change |
| classical.chopin-nocturne-op9-2 | 33: cadenza-words, 35: cadenza-words, 36: cadenza-words | 33: cadenza-words, 35: cadenza-words, 36: cadenza-words |

Right out of the nine items: current: item 1, named bars 2, fix: item 5, named bars 6, music21: item 4, named bars 4, partitura: item 4, named bars 4.

- **The four rows' failures reproduce** (*measured*): *Mariage d'amour* idx 2 and six more 5/4 bars, *Scarborough Fair* idx 101, *The Lonely Man* idx 3 and *Holy, Holy, Holy* idx 15 are called cadenza bars by the longer-bar clause, so the detector counts 15 of 22, 1 of 2, 1 of 2 and 0 of 1 changes. Dropping the clause gives 22, 2, 2 and 1: right on all four.
- **The clause fires on 32 bars in 8 files** (section 4.3). The four named files, the two other *Mariage d'amour* variants (same bars; `.alt` also a 5/4 then 6/4 pair at idx 80 and 81), *Levi's Choice* idx 32 (a 5/4 bar ending on a double barline, *reading*: a measured change) and *Super Mario Land 2* idx 3, 172, 304 and 308 (12/4, 8/4, 11/8 and 33/16, one bar each; the 12/4 bar follows "poco rit." and the 33/16 bar carries "A tempo": *reading*, plausibly long free bars, which is the rule's own example; undetermined without the printed page).
- **Where the row says the pair clause is right, the measured labels differ**: on the Bagatelle the named pair and final-bar bars that are signature changes (6) are all labelled device or "device?", but the three bars that return to 3/8 (idx 10, 28, 37) are counted as changes, so the item shows 3 changes of metre where the page says none (the row's wording note); on Mozart K. 1e and K. 1f the 2/4 bar is only a "device?" candidate and its 1-beat partner (3/4 signature, one beat long) is counted as a change (3 and 1 changes). Cause (*reading* of `times.py`): the pair test adds the two bars' signature lengths (2 + 3), not the notated lengths (2 + 1), so a pair whose second bar keeps the signature never matches.
- **Radetzky (idx 71, a 1/4 bar)**: every method counts it and its return bar as 2 changes; the row says code has no test for a section pickup, and the measured labels agree ("change (short bar, no boundary)").
- **Op. 9 No. 2**: the words clause is right (0 changes of metre, 3 cadenza bars); the plain reads, which cannot see "Senza tempo", report 3 changes.

### 4.3 Every use of the longer-bar clause (`tm_summary.py`)

| file | bars the clause calls cadenza bars | signatures (before, bar, after) of the first |
| --- | --- | --- |
| beautiful.mariage-damour | 7 | 4/4, 5/4, 4/4 (idx 2) |
| beautiful.mariage-damour.alt | 10 | 4/4, 5/4, 4/4 (idx 2) |
| beautiful.mariage-damour.alt2 | 7 | 4/4, 5/4, 4/4 (idx 2) |
| classical.holy-holy-holy-lord-god-of-hosts-hugg-geo-c-hugg.pdmx | 1 | 4/4, 6/4, None (idx 15) |
| classical.s-awecki-super-mario-land-2-ending-theme-as-played-by-tom-brier.pdmx | 4 | 3/4, 12/4, 3/4 (idx 3) |
| folk.scarborough-fair-piano-solo.pdmx | 1 | 3/4, 4/4, 3/4 (idx 101) |
| pop.hiroyuki-sawano-levi-s-choice-thanksat-t-kt-attack-on-titan.pdmx | 1 | 4/4, 5/4, 4/4 (idx 32) |
| pop.misc-television-the-lonely-man-theme.pdmx | 1 | 4/4, 5/4, 4/4 (idx 3) |
| all | 32 in 8 files | |

### 4.4 What the numbers say

- A plain read of the signatures is exact: both libraries equal the raw reader on 187 changes in 49 items. What the libraries cannot give is the class of a change (device, pickup, cadenza), which needs the bar's notated length, the barlines and the words.
- The current detector's class labels are wrong on the four named measured changes (15 of 22, 1 of 2, 1 of 2, 0 of 1 counted) and its pair clause does not fire on Mozart K. 1e and K. 1f; with the clause dropped it is right on 6 of 9 named items by named bars and 5 of 9 by item count, against 2 and 1 now and 4 and 4 for either plain read.
- What is left after the fix is the device and pickup class (Radetzky, K. 1e, K. 1f, the Bagatelle's return bars): signatures held for one or two bars next to a repeat, a double barline or a Fine, where the notated length differs from the signature. The row already calls the pickup undecidable by code.

## 5. Scripts and data in this folder

| file | what it does | writes |
| --- | --- | --- |
| `rcommon.py` | loads the 1A validators' `walk.py`, `common.py`, `r_repeat.py` from source with two path substitutions | - |
| `rep_structure.py` | selects the 329 files with repeat structure; prints each file's printed structure | `rep_structure.json` |
| `rep_signs.py` | where segno / coda / Fine signs sit in their bars | `rep_signs.txt` |
| `expected_repeat_named.json` | the expected counts of the named items, written before the readers ran | - |
| `rep_readers.py` | the played-bar count of each file by the unroller (and with the fix), music21 `Expander`, partitura unfolding | `rep_readers.json` (per-item counts, errors, times) |
| `rep_analysis.py` | agreement tables, the disagreement list | `rep_analysis.json`, `rep_disagreements.json`, `rep_analysis.txt` |
| `rep_readings.py` | my hand-written bar paths for the 88 disagreement files, summed and compared with the readers; 12-file spot check | `rep_readings.json`, `rep_readings.txt` |
| `rep_spot.py` | draws the 12-file spot-check sample (seed 7) and checks it against `rep_readings.py` | `rep_spot.txt` |
| `rep_summary.py` | named-item verdicts, reader verdicts, the fix, the two-witness rule | `rep_summary.json`, `rep_summary.txt` |
| `rep_trace.py` | the bar path the unroller follows (diagnosis of Carioquinha and Carioca) | `rep_trace.txt` |
| `rep_pt_paths.py` | files where partitura could see a jump (`<sound>` attributes) | `rep_pt_paths.json`, `rep_pt_paths.txt` |
| `tcommon.py` | loads the 1C validators' `common.py` and `times.py` from source with one path substitution | - |
| `tm_changes.py`, `tm_detail.py` | the current detector's output on all 2,020 files; the bar-by-bar view | `tm_current.json`, `tm_changes.txt` |
| `expected_times_named.json` | the expected classes of the named times items | - |
| `tm_run.py` | current detector, the fix (one label replaced), music21 and partitura plain reads on the 49 items | `tm_results.json`, `tm_run.txt` |
| `tm_summary.py` | the times tables and the clause's firings | `tm_summary.json`, `tm_summary.txt` |
| `build_page.py` | assembles this page from the JSON files | `repeat-times.md` |

To reproduce: with the main checkout's `.venv` and `-X utf8`, run the scripts in the order of the table from this worktree (they read `app/public/content` of the main checkout in place); `rep_readers.py --all` takes about a minute with 8 processes, `tm_run.py` about 80 seconds.

## 6. Recommendation

mark.repeat: code + agent (code counts with the unroller plus the coda-pair fix and flags a file when music21 disagrees or cannot expand it, when its repeat signs are unbalanced, or when a jump word has no sign to go to; the agent decides the count then) — the fixed unroller is right on 80 of 81 determinable files where the readers differ (music21 27 right, 30 wrong, 24 no count; partitura 21 right), but 34 of the 88 depend on a reading the file does not settle and music21's disagreement flags 32 of them.
notation.times: code + agent (code lists every signature with its bar by the plain music21 TimeSignature read and flags bars whose notated length differs from the signature, signatures held for one or two bars, and changes inside a words passage; the agent decides change of metre, device, pickup or cadenza) — the plain read gives 187 changes in 49 items, identical in music21, partitura and the raw reader, the current detector counts 116 of them as changes of metre (right on 1 of 9 named items), dropping the longer-bar clause gives 148 (right on 5 of 9) and still gets the pair and pickup cases wrong.
