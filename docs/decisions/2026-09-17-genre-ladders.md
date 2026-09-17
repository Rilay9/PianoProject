# The blues ladder, filled from the archive (2026-09-17)

## The judgement

The blues track had a rung with one song on it and two with none, and the two empty ones
were at Stages 8 and 9 where a learner has the least patience for a page that says
"nothing here". They are song-optional rungs and they pass validation empty, which is
exactly why they stayed empty: nothing was failing. What was wrong was pedagogical, not
mechanical — a learner who has just written a twelve-bar chorus in two keys wants to see
what somebody who could really do it wrote down, and the archive has those pages.

So: one quarry over the blues wants, one review, and the three upper rungs filled with
music rather than with more exercises. The rungs stay song-optional. The piece on Stage 8
is still the learner's own chorus and the piece on Stage 9 is still their own solo; what
the archive supplies is what to read while writing them.

**Two pieces did not go where the plan put them, and both times the measured level is the
reason.** The plan's levels came from the index's proxy estimate; the quarry measures the
converted score.

- *Handful of Keys* was planned for `blues.7` at an estimated 7.9. It converts and reads
  at 8.73. Putting it on a Stage 7 rung would have stretched that rung's band to 8.8,
  which is a rung spanning four and a half levels and means nothing to the learner reading
  it on the lesson page. It is on `blues.9` instead, where it is the hardest thing on the
  track and says so.
- *Boogie and Blues Bass Lines* was planned for `blues.6`/`blues.7` at an estimated 5.9.
  It reads 3.69, and reading it confirms why: it is a page of left-hand bass-line studies,
  not a piece. It is in the Library and on no rung.

**A third piece was held out on the owner's instruction.** *The Crave* is quarried, passes
every gate and is not committed: its publication date is not settled, and a Morton piece
first published late is exactly the kind of row that should not be decided by an agent in
a hurry. Its want row stays in `pdmx-wants.json` so the question can be reopened.

**One thing outside the brief was fixed.** `blues.3`'s lesson says "one of these is in the
minor, and it is the one to start with", and until today none of its three songs was in
the minor: the rung was committed before the quarry ran, from what was already in the
catalog. *St. James Infirmary* — the minor blues the paragraph was written for — is now on
it, with *Wabash Blues* and *Tishomingo Blues*, and the lesson has the repertoire paragraph
it was missing.

## What the quarry did, gate by gate

The shortlist read the whole archive: 254,077 rows, 177,773 through the machine gates,
73,544 superseded editions, 793 chosen against the quotas, 343 of those matching a named
want. Filtered to the blues wants, 26 candidates went to the converter.

All five gates, all 26:

| band | offered | passed | rejection rate |
|---|---:|---:|---:|
| 1–2 | 4 | 4 | 0% |
| 3 | 14 | 14 | 0% |
| 4 | 1 | 1 | 0% |
| 5 | 1 | 1 | 0% |
| 6 | 3 | 3 | 0% |
| 7–9 | 3 | 3 | 0% |

Nothing failed convert, round-trip, structure, dedup or render. That is a better rate than
either earlier run (89% and, at band 7–9, 53%) and the reason is the wants list: every row
was looked up in the index before it was written down, so the quarry was handed 26 rows
somebody had already checked existed rather than a quota's worth of guesses. The render
gate ran against the app's own loader with port 4173 idle — an earlier attempt had left
every row at zero steps, which is what a skipped render looks like and must never be read
as a pass. Every committed row's cursor-step count equals its step count.

## Kept, and refused

**Kept: 21.** Three on `blues.3`, two on `blues.7`, two on `blues.8`, three on `blues.9`
(one of them shared with `blues.8`), and the rest in the Library under Blues. Every row is
in Part F with its level and its rung.

**Refused: 5, all `later`.**

- *The Crave* — the date, above.
- *Careless Love* and *Boogie Woogie* — the quarry found the same CIDs that are already in
  the catalog as `song.pop.careless-love-blues.pdmx` and `song.folk.boogie-woogie.pdmx`.
  The want list had asked for "an easier setting" and "a fuller edition"; the archive has
  neither. `blues.8` therefore takes the Pinetop file that is already on `blues.6`, which
  is honest: it is the record every boogie bass since is a copy of, and meeting it twice is
  not a mistake.
- The second editions of *Rhythm and Boogie* and of *Stumbling*. One edition per work, and
  in both cases the other one is the one its rung wants — the easier of the two boogies,
  and the full 105-bar Confrey rather than a 32-bar lead sheet four levels under Stage 9.

**Composition status.** Every pre-1930 publication among the kept rows carries
`compositionStatus: pd` with its year as the reason, so the strict-licence deploy carries
them; the three rows with no named composer and no date — two uploader studies and a
living composer's boogie — stay `unknown` and are personal-build only. That is a
judgement, written here so it can be reversed in one place.

## Reproducing this run

From the repository root, with the archive at `C:\Users\yalir\repos\Piano Stuff` and
**no other Playwright suite alive** — the render gate needs port 4173.

```powershell
node tools/content/python.cjs tools/content/pdmx/index.py --pdmx-dir "C:\Users\yalir\repos\Piano Stuff" --out build/pdmx-genres/index
node tools/content/python.cjs tools/content/pdmx/shortlist.py --pdmx-dir "C:\Users\yalir\repos\Piano Stuff" --out build/pdmx-genres/candidates.json
node tools/content/python.cjs tools/content/pdmx/extract.py --pdmx-dir "C:\Users\yalir\repos\Piano Stuff" --candidates build/pdmx-genres/candidates-blues.json --out build/pdmx-genres/raw
node tools/content/python.cjs tools/content/pdmx/quarry.py --candidates build/pdmx-genres/candidates-blues.json --raw build/pdmx-genres/raw --out build/pdmx-genres --catalog app/public/content/catalog.json
node tools/content/python.cjs tools/content/pdmx/commit.py --quarried build/pdmx-genres/quarried.json --candidates build/pdmx-genres/candidates-blues.json --review build/pdmx-genres/review/review.csv --converted build/pdmx-genres/converted --table build/pdmx-genres/table.json
```

`candidates-blues.json` is the whole shortlist filtered to the rows whose `want` is one of
the blues ids; the filter is a three-line script and is not worth a tool. `commit.py`
writes a side table, which is then merged into `content/sources/pdmx.json` with the plan's
ids, the cleaned titles and the real composers — the archive's own title and composer
columns carry things like a year inside the composer field and a definite article welded
to the end of a title, and those must not reach a learner's screen.

Then the ordinary build: `tools/content/build.py --offline`, `ladder_report.py`, the
build again.
