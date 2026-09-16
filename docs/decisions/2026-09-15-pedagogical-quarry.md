# Quarrying the graded teaching collections

2026-09-15. The middle of the curriculum had no teaching literature: three Czerny, two
Burgmüller, one Duvernoy, one Gurlitt, one Clementi sonatina, and nothing at all of Köhler,
Lemoine, Le Couppey, Streabbog, Schytte, Heller, Bertini, Loeschhorn, Beyer or Türk. This run
added 57 named wants for that shelf and put the whole shortlist through the quarry with the
render gate on, into `build/pdmx-pedagogy/`.

**The judgement: the archive holds two of these collections nearly whole, a third in useful
part, and most of the rest hardly at all.** Lemoine's *Études enfantines* Op. 37 (34 usable
studies) and the child Mozart's notebook and London Sketchbook (23 pieces) come out almost
complete; Bach's Two-Part Inventions (15 of 15) and Schumann's Op. 68 (13 more, on top of the
five already committed) likewise. Czerny is well stocked but not in the books that were asked
for — Op. 299 yes, Op. 599 one study, Op. 849 not at all, and the bulk of what is there is Op.
740, Op. 821 and Op. 300. Everything else is thin to empty: **Le Couppey, Schytte, Heller,
Loeschhorn, Türk, Burgmüller Op. 109, Gurlitt Op. 117 and Op. 140, Streabbog Op. 63 and Op. 64,
Bertini Op. 100, Beethoven Op. 126, Grieg Op. 38 and Schubert's D. 365 / D. 366 / D. 783 sets
produced nothing usable.** 154 pieces are proposed in `build/pdmx-pedagogy/proposed.json`,
levels 2.7 to 8.6, with 109 of them at stages 5 and 6 — which is the gap this was for.

The single largest cost is not the archive's: `best_editions` collapses thirteen Duvernoy
Op. 176 études into one. See the last section.

## What went into the wants list, and why the patterns look odd

57 entries appended to `content/sources/pdmx-wants.json` (95 wants in all). Two things about
`fold` shaped every one of them, and both were found by grepping the CSV before writing:

- `fold` strips `op.` as a credit word, so `op 100` and `Op. 100` both fold to `100`. An opus
  pattern is therefore a **bare number**, safe only with an `artist` beside it. Where the
  uploader puts the surname in the title instead, a second broader entry catches it with no
  artist constraint — hence pairs like `czerny-op299` / `czerny-studies`.
- `no. 2` folds to `no2`, so a pattern has to be spelled the way the fold leaves it.

Burgmüller's entry carries all 25 Op. 100 titles in French and English, gated by artist, because
the archive files several of them under the title alone (`la pastorale`, `L'arabesque`).

One real limit, written into the file: **`match_want` reads the title and `artist_name` only,
never `composer_name`.** Uploads whose title is bare and whose artist is `NA` but whose composer
column names the composer — several Gurlitt pieces, Türk's *Das Rondo im Kleinen*, one
Burgmüller — cannot be reached from this file at all.

`tools.content.tests.test_pdmx.TestSelection` was run after the edit and is green.

## The run

| | |
| --- | --- |
| CSV rows read | 254,077 |
| past the gates | 177,773 |
| superseded by `best_editions` | 73,558 |
| index rows (browsable) | 104,427 |
| chosen (not over quota) | 729 |
| named wants among them | 258, of which 240 are the new entries |
| extracted | 729 of 729 |
| passed every machine gate | 667 of 729 |

Per band, passed/offered: 1-2 122/132, 3 141/152, 4 160/169, 5 117/127, 6 88/94, 7-9 39/55.
Only band 7-9 is near the README's stop rule, and its rejections are the familiar music21
export failures, not selection. Whole-run rejections by gate: round-trip 30, structure 18,
convert 12, **render 2** — one cursor-parity mismatch and one score whose repeat structure sent
the extractor past 100,000 steps. Gate 5 was really asked this time; nothing was skipped.

Of the 240 new-want rows, 233 passed every machine gate (round-trip 5, structure 2).

## What is proposed, per collection

| collection | proposed | |
| --- | --- | --- |
| Lemoine Op. 37 | 34 | Nos. 1-50, most of the book |
| Czerny | 37 | Op. 299 × 11, Op. 599 × 1, Op. 740 × 7, Op. 821 × 10, Op. 300 × 3, Op. 139 × 2, Op. 32, Op. 335, a march |
| Mozart, Nannerl's notebook and the London Sketchbook | 23 | K. 1-K. 4 and K. 15b-15rr |
| Bach, Two-Part Inventions | 15 | BWV 772-786, complete |
| Schumann Op. 68 | 13 | on top of five already committed |
| Bach, Little Preludes | 5 | BWV 924, 928, 933, 935, 936 |
| Mendelssohn, Songs Without Words | 4 | Op. 19 Nos. 1, 3, 6 and Op. 30 No. 1 |
| Bach, Anna Magdalena notebook | 3 | BWV Anh. 114, 115, 129 |
| Bertini | 3 | Op. 29, not the Op. 100 asked for |
| Beethoven | 3 | Écossaise, Anh. 5 No. 2, Bagatelle Op. 119 No. 3 |
| Duvernoy Op. 176 | 2 | see below — sixteen passed the CSV gates |
| Schubert | 2 | an Écossaise and a D. 841 German dance |
| Streabbog | 2 | *La Violette*, *Karussell-Walzer*, neither naming an opus |
| one each | 8 | Beyer, Burgmüller Op. 100 No. 3, Grieg Op. 47 No. 2, Gurlitt, Kuhlau Op. 20 No. 1, Köhler Op. 300 No. 1, Scarlatti K. 32, Tchaikovsky Op. 39 No. 8 |

Ids are `song.classical.<surname>-<slug of the clean title>.pdmx`; titles and composers were set
by hand from the archive record (the CSV's are uploader text like `Burgmuller Op.100 No.2
Arabesque`). Where a work passed in two editions the better-attested one is proposed and the
other's cid is in its `notes`.

## What was rejected, and by which gate

240 new-want rows shortlisted; 86 did not reach the proposal.

- **33 are already in `content/sources/pdmx.json` by cid** — the catalog had more of this shelf
  than the brief's count suggested, including five of Op. 68 and two Burgmüller.
- **35 are noise or a second edition** (below).
- **11 are not `pd`.** Six of them are real pieces the composer-status table could not vouch
  for — Burgmüller's *Petite Réunion*, Czerny's Op. 599 No. 69, three Beyer exercises and
  Türk's *Das Rondo im Kleinen*; the rest were noise anyway.
- **7 failed a machine gate**: round-trip 5, structure 2.
- `duplicate_of` excluded nothing extra; the six rows it flagged are the same rows already
  excluded by cid.

Earlier, at the CSV gates, the licence-conflict recommendation is what cost the most: it is why
**Burgmüller's Op. 100 Ballade, Harmony of the Angels, Consolation, Progrès, Inquiétude and
Op. 100 No. 1**, Clementi's Op. 36 Nos. 2 and 3, Kuhlau's Op. 55, Diabelli's Op. 151, both
surviving Heller études and the only Loeschhorn upload are not here. Czerny's Op. 849 exists as
one 2,423-bar complete book and fails both licence and size; Tchaikovsky's complete Op. 39 fails
size the same way.

## The noise the patterns let through

35 rows, and the pattern that let each in is legible:

- **22 second editions** of a piece another row already carries (three of BWV Anh. 114, three of
  Op. 299 No. 1, two of Invention No. 11, and so on). Not a pattern fault: `best_editions` groups
  per band, so one work in two bands is two rows.
- **Substring over-matches on catalogue numbers**: `k 32` matched Scarlatti's K. 328, `k 34`
  matched K. 345, `kv 1` matched a flute concerto's KV 131, `k 2` matched K. 285. Folded
  matching has no word boundary; with an `artist` constraint the damage stayed at four rows.
- **Arrangements**: Scarlatti K. 34 exists only for accordion, the K. 467 concerto for two
  pianos, Liszt's variation on Diabelli's waltz, Bach's C major prelude in Czerny's edition.
- **Wrong person**: *Marche van Beyeren*, a hymn by a different Koehler, Kohler's Hornpipe (that
  last one never reached the shortlist — the artist constraint held).
- **Out of range but genuine**: Bach's three Sinfonias, BWV Anh. 144, Mozart's K. 350 lullaby
  (which is Flies's, not Mozart's).

## The bug worth fixing before the next run

`shortlist.work_key` gives every Duvernoy Op. 176 étude the same key. The archive titles them
`Elementary Studies (op 176) Etude 1 by Jean Baptiste Duvernoy` — the number follows *Etude*,
not `no.`, so `_NUMBERED` does not see it, `numbers` is `["op176"]` for all of them, and
`best_editions` keeps one per band. **Sixteen Op. 176 études passed the CSV gates; three were
shortlisted and two are proposed.** Lemoine is unharmed only because its uploader wrote
`op. 37 no. 4` adjacently.

The fix is one line in `work_key`: when an opus is found with no `no.` beside it, fall back to a
trailing integer in the title. It is code this agent does not own, and re-running the shortlist
after it would bring back about thirteen more études at stages 4 to 6 — the densest graded
sequence the archive has at exactly the levels the curriculum is short of.

## Reproducing this run

From the repository root. Durations were this machine's and are not a promise.

```powershell
node tools/content/python.cjs tools/content/pdmx/index.py --pdmx-dir "C:\Users\yalir\repos\Piano Stuff" --out build/pdmx-pedagogy/index
node tools/content/python.cjs tools/content/pdmx/shortlist.py --pdmx-dir "C:\Users\yalir\repos\Piano Stuff" --out build/pdmx-pedagogy/candidates.json
node tools/content/python.cjs tools/content/pdmx/extract.py --pdmx-dir "C:\Users\yalir\repos\Piano Stuff" --candidates build/pdmx-pedagogy/candidates.json --out build/pdmx-pedagogy/raw
node tools/content/python.cjs tools/content/pdmx/quarry.py --candidates build/pdmx-pedagogy/candidates.json --raw build/pdmx-pedagogy/raw --out build/pdmx-pedagogy --catalog app/public/content/catalog.json
```

No `--skip-render`, and `--catalog` points at the app's own catalog, which is the configuration
`2026-09-15-quarry-rerun.md` said should precede `review.py` and `commit.py`. `proposed.json`
was written beside the outputs from `quarried.json` and `candidates.json`; nothing in
`content/scores/` or the catalog was touched.

---

## 2026-09-15, later: the `work_key` fix, and the rerun it paid for

The bug named in the section above is fixed, and the run above is redone on top of it. **Thirteen
more Duvernoy Op. 176 études are proposed — fifteen where there were two** — and that is the whole
point of the exercise: they sit at levels 4.4 to 5.9, in the part of the curriculum this quarry was
opened for. The second, smaller fault is fixed too, and it turns out to be worth much less: it
reaches twenty-three more rows and only one of them survives review.

### What changed in the code

**`shortlist.work_key`.** An opus with no `no.` beside it now takes its piece number from the title
itself: an integer directly after a study word (*etude*, *study*, *exercise*, *no*, *nr*), else a
bare integer the title ends on. The opus's own digits are excluded by span, so `Etude Op. 176` stays
`op176` rather than becoming `op176-176`, and a trailing number after *book*, *vol*, *part*,
*movement* or *hands* is not read as the piece's — `Etudes Op. 37 Book 1` must not collide with
`Op. 37 No. 1`. It applies to an opus only, for the reason the surrounding code already gives: a K.,
BWV or D. number is the whole identity on its own.

The rule can only ever *split* a group, never merge two, so it errs in the direction `work_key`'s
docstring asks for. The cost is one extra edition in review where one upload numbers itself and
another does not, and that is the cheap mistake.

**`shortlist.match_want`** now matches a want's artist pattern against `composer_name` as well as
`artist_name`, and every caller passes the column: `select` in `shortlist.py`, and both calls in
`index.py`. `NA` is treated as absent in either column, so a want gated by artist is not loosened
into matching everything.

Tests are in `tools/content/tests/test_pdmx.py`: `TestWorkKey` gains the two Duvernoy cases, the
opus-digits case and the volume-number case (its Chopin, Mozart, Bach and Joplin cases are
untouched and still pass), and a new `TestMatchWant` covers the composer column, the artist column
alone, a row naming neither, and that every caller hands the column over. Both were checked red
before the change: with the fallback stubbed out, Étude 1 and Étude 2 share a key.

### The rerun

```powershell
node tools/content/python.cjs tools/content/pdmx/shortlist.py --pdmx-dir "C:\Users\yalir\repos\Piano Stuff" --out build/pdmx-pedagogy/candidates.json
node tools/content/python.cjs tools/content/pdmx/extract.py --pdmx-dir "C:\Users\yalir\repos\Piano Stuff" --candidates build/pdmx-pedagogy/candidates.json --out build/pdmx-pedagogy/raw
node tools/content/python.cjs tools/content/pdmx/quarry.py --candidates build/pdmx-pedagogy/candidates.json --raw build/pdmx-pedagogy/raw --out build/pdmx-pedagogy --catalog app/public/content/catalog.json
node tools/content/python.cjs build/pdmx-pedagogy/propose.py
```

The shortlist read the same 254,077 rows and the same 177,773 passed the gates; nothing about the
gates changed. What changed is downstream of them:

| | before | after |
| --- | --- | --- |
| superseded by `best_editions` | 73,558 | 73,544 |
| chosen (not over quota) | 729 | 766 |
| named wants among them | 258 | 295 |
| extracted | 729 | 766 (38 new members; 728 reused) |
| passed every machine gate | 667 of 729 | 700 of 766 |

Per band, passed/offered: 1-2 125/135, 3 150/163, 4 176/185, 5 118/129, 6 91/98, 7-9 40/56.
Whole-run rejections by gate: round-trip 30, structure 21, convert 12, render 3. Not one verdict
changed for a file that had already been quarried — the reuse is by source bytes and every one of
the 728 matched — so the whole difference is the 38 new rows. The render gate ran on them; its
first attempt died because the preview server would not start, which left every new row marked
`render`, and the second attempt (the same command, nothing else changed) rendered them.

Of the 38 rows newly chosen, 14 are the `work_key` fix — the thirteen études and Czerny's `Op 299
19`, which the same collapse had been hiding — 23 are the `composer_name` fix, and one is a ranking
shuffle inside a quota. One row left: a better-attested *River Flows In You*, itself reachable only
through the composer column, displaced the edition chosen before.

### What is proposed now

**151**, against 154 before, and the difference is not subtraction of quality:

| collection | before | after | |
| --- | --- | --- | --- |
| Duvernoy Op. 176 | 2 | **15** | Nos. 2-11, 13, 15, 16, 18, 19; No. 1 is already in `pdmx.json` |
| Czerny | 37 | 20 | Op. 740 and Op. 821 dropped by the owner; Op. 300 kept |
| Schubert | 2 | 3 | a German dance in A-flat, unreachable until a want could read `composer_name` |
| everything else | 113 | 113 | unchanged |

Sixteen Op. 176 études passed the CSV gates; all sixteen are now shortlisted, where three were
before. One of them is Étude 1, already committed — under the raw uploader title, which is a
separate untidiness in `content/sources/pdmx.json` and not touched here. The other fifteen are
proposed, at bands 3 to 5.

The owner's decisions, applied: the seven Op. 740 and ten Op. 821 rows are marked noise with the
reason recorded in `propose.py`; Op. 300 stays; the Scarlatti K. 328 and K. 345 substring
over-matches and BWV Anh. 144 stay out, as before. Bands now read 1-2 × 2, 3 × 30, 4 × 56, 5 × 24,
6 × 29, 7-9 × 10 — thirteen more at band 4, sixteen fewer at 5 to 9, which is the shape asked for.

The twenty-three rows the `composer_name` fix reached are a fair measure of what that fault cost:
one is proposed, and the rest are second editions of pieces already carried (K. 1d, Invention No.
13), arrangements (a horn concerto movement, an Invention with the hands swapped), sets rather than
pieces (five German dances in one 178-bar file), or unnameable — `aus der Sammlung Op.82.` says
which collection a Gurlitt piece is from and not which piece, so it is dropped for the same reason
as the unnumbered Lemoine étude. The fault was real; the shelf behind it was thin.

`build/pdmx-pedagogy/index` was **not** rebuilt. It is a second full pass over the CSV and the brief
did not ask for one; it is stale with respect to both fixes until it is rerun. Nothing in
`content/sources/pdmx.json`, `content/sources/pdmx-wants.json`, `content/scores/` or the catalog was
touched.
