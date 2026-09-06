# P14 — the quarry run, the levelling model, and where it stops

Date: 2026-09-06 · Branch: `feat/p14-pdmx-quarry` (from `feat/p13-pdmx-tooling`)

## Where this run stops, and why

**Nothing from PDMX is committed.** The design's central rule (replan §2.5) is that
nothing is bundled that a person has not marked `keep`, and `commit.py` enforces it by
refusing a row with no decision. The review is the owner's, it needs ears, and no test in
this repository can do it. This session ran everything up to that point and left the review
page and the decision sheet ready:

    build/pdmx/review/index.html   the page — preview, facts, flags, MuseScore link
    build/pdmx/review/review.csv   the sheet — cid, decision, level_override, note

The `note` column is pre-filled with what the machine noticed (a duplicate, a defaulted
tempo, a single line). The `decision` column is deliberately empty: pre-filling one would
defeat the rule.

So items 2, 4, 5, 6, 6a and 7 of the P14 prompt are **not done** — every one of them is
downstream of a decision only the owner can make. Everything that is not is done, and is
listed below.

## What the archive actually is

The fingerprint matched exactly: `PDMX.csv` 209,574,867 bytes, `mxl.tar.gz` 1,894,335,797
bytes. The Zenodo record id is recorded as **`unknown`** — the owner was asleep and was not
asked. The CSV's sha256 and the two byte counts identify the archive precisely enough to
fill the id in later without re-running anything.

254,077 rows in; 37,499 past the gates; 425 chosen by the quotas and the two named lists. What rejected the rest, largest first:

| rejected | reason |
|---:|---|
| 142,078 | not the deduplicated copy (the dataset's own flag) |
| 19,582 | licence conflict (the dataset's own recommendation) |
| ~34,000 | more than two tracks, or a non-piano program |
| the rest | draft, paywalled, or outside 8–400 bars / ≥ 30 notes |

The deduplication flag alone removes **56 %** of the archive. That is the single largest
fact about PDMX for this project and it is the dataset's own judgement, not ours.

## Three things the first run taught, each of which was a bug

### 1. The band heuristic could never reach the top

MuseScore's `complexity` column is 1 for 27,496 of the 37,499 rows that pass the gates and
never exceeds 3. The first draft's rule — "complexity ≤ 5 → band 6, else 7–9" — is therefore
satisfied by every row in the dataset, and band 7–9 was empty. The bands now follow the
archive's own notes-per-bar distribution (3.0 at the 5th percentile, 7.3 at the median, 17.6
at the 90th, 28.2 at the 99th) and complexity only ever pushes a row *up*, which is what a
score like that can honestly do. All six bands fill now.

### 2. The unmatched-composer list is a fiddle collection

The top of it, by frequency: William Marshall (353), Alexander Walker (170), Tradicional
(144), *Teton Sioux band 1911-1914* (113), "after Chief F. O'Neill" (104), Niel Gow (84),
Nathaniel Gow (81), Carolan (58). PDMX's public-domain slice, once the gates have run, is
overwhelmingly the **Scottish and Irish fiddle corpus** plus Densmore's ethnographic
transcriptions — not the classical library the ladder was written around.

Twenty-three names and twenty-five traditional aliases added. Names whose dates I could not be
sure of — Alexander Walker, and the several collectors filed as "Hand of …" — are
deliberately absent: `unknown` is a harmless label (the strict build refuses it anyway) and a
wrong death year is not.

### 3. `composer_name` is empty where it matters most

It is `NA` for 59 of the 306 chosen rows, and every one of those has an `artist_name`. On a
pop or film row the artist is the composition's author as far as the licence question goes,
so it is asked now, and which column the answer came from is recorded — because "Linkin
Park" is a band and not a person. Both bands are in the table as decoys.

The archive also contains mojibake: one candidate's composer is `åæé¾ä` — 坂本龍一 encoded
twice — with a clean `Ryuichi Sakamoto` in `artist_name`, and another spells him "Ryuichi
Salamoto". The reviewer will see titles in that state too.

## What the machine gates said, in the end

425 candidates offered, **368 through every gate** — convert, round-trip,
structure, the P2 truncation scan, render with cursor-step parity, duplicates.

| band | passed | rejection rate | what rejected the rest |
|---|---:|---:|---|
| 1–2 | 80 / 95 | 16 % | structure 13, convert 1, render 1 |
| 3 | 69 / 77 | 10 % | structure 4, round-trip 3, convert 1 |
| 4 | 81 / 89 | 9 % | structure 4, round-trip 3, render 1 |
| 5 | 79 / 85 | 7 % | round-trip 3, structure 3 |
| 6 | 44 / 47 | 6 % | round-trip 1, structure 1, convert 1 |
| **7–9** | **15 / 32** | **53 %** | convert 8, round-trip 6, structure 3 |

Band 7–9 is above the "stop and look" line, so I looked. Eight of its sixteen
failures are music21 refusing to *export* what it read: `Cannot convert "2048th"
duration`, `Cannot convert inexpressible duration`, a `StreamException` on a
measure. These are the big Romantic scores, and it is the same family of
limitation P10 met with the thirteen Chopin files. The band is small by design
(31 of 425) and its failures are the converter's, not the selector's, so the
selector was not adjusted for it.

Of the 368: **90 are single-line** — the Part F reference set and the
sight-reading corpus, not repertoire — and every level came from the fitted
model rather than the fallback table.

| | |
|---|---|
| by bucket | classical 142, pop-film-game 125, folk-hymn-carol 85, jazz-latin 16 |
| by composition status | unknown 216, pd 127, in-copyright 25 |
| estimated level | L1 4, L2 49, L3 46, L4 27, L5 73, L6 59, L7 84, L8 22, L9 4 |

## Two bugs in the render gate, found by running it

Both were mine, both looked like content failures, and the first run rejected **all 306
candidates** because of them.

1. **The gate could not reach the files it was judging.** The render spec loads each item
   from `/PianoProject/content/<file>` — a URL, not a path — so a file outside the served
   content root is unreachable, and every item reported "Could not retrieve requested URL 0".
   Candidates are staged into the served root now (both `public/` and `dist/`, because
   `reuseExistingServer` can skip the rebuild) and removed in a `finally`: left behind they
   would be precached into the app and shipped, which is files nobody has reviewed in a
   directory nothing else knows about.
2. **The gate replayed its own failures.** The spec's manifest is keyed on each file's
   sha256 and replays a remembered verdict rather than rendering again — right for a pass,
   wrong for a failure, because a failed render is exactly what changes when the thing that
   broke it is fixed. The second run reproduced the first's 249 failures without opening a
   browser. Failures are dropped from the quarry's manifest before each batch now.

The lesson is P11's, again: **a harness defect looks exactly like broken content.** The
first run's headline number was "0 of 306 usable", and it was a lie about the archive.

## The levelling model

Fitted, and it meets the bar. 173 judged songs — every song in the catalog whose level a
person decided — **Spearman 0.885**, **leave-one-out median absolute error 0.440 stages**,
against §2.4's 0.8 and 0.7. Committed to `content/sources/level-model.json`; the coarse
fallback table stays beside it for a model file that has no weights.

Twelve features survive. Seven were dropped for producing a weight with the wrong sign,
which is the monotone constraint doing exactly what it exists for. The largest weights:

| weight | feature |
|---:|---|
| +1.06 | ledger-line note ratio |
| −0.88 | shortest note value (smaller = faster = harder) |
| +0.69 | bars |
| +0.50 | left-hand range |
| +0.49 | black-key ratio |
| +0.45 | notes per bar |
| +0.38 | key-signature accidentals |

Which is roughly what a teacher would say if you asked them why a piece is hard.

The furthest miss is *Bella Ciao*: judged 4.2, estimated 6.46. It is a folk tune the model
reads as long and busy, which is a fair description of that file and a poor description of
the piece. The next worst are the Chopin preludes, estimated **low** by about 1.4 stages —
the model has no feature for "this is Chopin", and that is the honest limit of counting
notes.

## The ladder report

`tools/content/ladder_report.py` writes `docs/generated/ladder.md`: every rung of every
track with its options, their levels, the band it spans, and a ⚠ where it is under the
floor, plus the placeholders the ladder wants and no source has. `validate.py` fails the
build when the committed copy is stale.

`02` Part D now says which of its columns is which: *focus* is pedagogy and stays authored,
*repertoire wanted* is a wish list kept because P15's finder needs it, and the generated
report is the answer to "what can I actually play on this rung".

`levelBand` is on all 87 lessons, in the schema, and checked.

## The Part F skip list

28 of the 34 tunes P5 skipped for want of an edition to check against **are** in the
archive — and every one of them was below the quota line, which is why ranking alone would
never have surfaced them. They have a list of their own now (`verify` in `pdmx-wants.json`),
admitted outside the quotas: 119 candidates, of which **27 tunes still have a passing
reference** after the machine gates. They are not repertoire; they are the reference an
authored ABC is checked against, which is the verification P5 lacked.

The six with no candidate at all: Go Tell Aunt Rhody, Aura Lee, This Old Man, Beautiful
Dreamer, Ma'oz Tzur, Sevivon.

## The named wants

Of the fourteen (seven rock-module songs, seven *Beautiful* suggestions), **three** have a
candidate that survived the gates: *River Flows in You* (three uploads), *Merry Christmas Mr
Lawrence* (two), *Final Masquerade* (one). The other eleven — including every Avenged
Sevenfold song — are absent from the surviving rows. Whether the three are kept is the
owner's call; all three are in-copyright compositions, so a kept one goes into the personal
build and the strict build keeps its placeholder.

## What no one has heard

As P10 said: no ear has been near any of these files, and now there are 368 of them.
Nothing is committed, so the list of ten to play first cannot be written yet — it would be
ten files chosen from a set that has not been reviewed. The review page is where that
starts, and **the lowest bands are where a wrong transcription does the most harm**: 80 of
the 368 are band 1–2 and 69 are band 3, and a learner at that level cannot tell a bad
transcription from their own bad playing. Review those two bands first, and play each one
before deciding.

### The first ten to play

From the two lowest bands, best-rated first — these are where a wrong
transcription does the most damage, and they are what to open before deciding
anything:

| est. level | band | title | composition |
|---:|---|---|---|
| 3.9 | 3 | Song of Storms (Easy) | in-copyright |
| 6.8 | 3 | Minecraft Calm | unknown |
| 7.1 | 3 | Title theme from *Good Omens* | unknown |
| 4.7 | 3 | Mozart: Minuet in F major K.2 (easy) | pd |
| 7.3 | 3 | Minecraft Nether | unknown |
| 6.8 | 3 | Scarborough Fair, piano solo | unknown |
| 4.1 | 1–2 | The Skye Boat Song | unknown |
| 6.6 | 3 | Light the World | unknown |
| 5.2 | 3 | Катюша (Katyusha) | pd |
| 3.5 | 3 | Twinkle Twinkle Little Star (Easy) | unknown |

Notice what that table shows: **the band and the level disagree**, sometimes by
four stages. The band comes from the CSV's notes-per-bar and orders the review
queue; the level comes from the model reading the converted score. A "band 3"
file estimated at 7.1 is not a contradiction to fix silently — it is the two
measurements disagreeing, and the one to trust is the one computed from the
notes. It is also a thing to watch while reviewing: if the model keeps calling
easy-looking arrangements level 7, it is wrong about something and the
calibration set is where to look.

## Follow-ups

- **Band 7–9's converter failures.** Eight files music21 will read and refuse to write. The
  same limitation cost P10 thirteen Chopin scores; a `bisect_render`-style look at one of
  them would say whether a normalisation could rescue them.
- **The composer table will be wrong about somebody.** It is 111 entries against an archive
  of 254,077 rows written by strangers. The unmatched list is printed on every run and is
  the instrument for it.
- **`build.py` and the quarry must not run at once.** One run here failed because vite's
  `copyDir` raced `build.py` clearing `app/public/content/scores`. Harmless, obvious in the
  log, and worth knowing before it happens at two in the morning.
