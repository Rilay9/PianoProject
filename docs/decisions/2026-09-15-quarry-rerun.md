# The quarry re-run without PDMX's deduplication flag

2026-09-15. The shortlist stopped treating the dataset's `subset:deduplicated` as a gate and
started deciding between uploads itself (`work_key` names the piece, `best_editions` keeps one
upload per work per band by our own ranking); the tempo ceiling went to 320. Until now that
rewrite had only been run as far as a dry index. This is the record of running it end to end on
the real archive, into `build/pdmx-rerun/` so the previous run under `build/pdmx/` stays intact.

**The judgement: a clear net gain.** The rule buys back the archive's best uploads of the
pieces the flag was throwing away — Bach's C major prelude, Maple Leaf Rag, K. 545 and the
first Ballade are all chosen now and none of them was before — and 111 of the 497 shortlisted
rows (22 %) are rows the old gate rejected outright. It costs a shortlist 17 % longer, a tail
of unviewed carol uploads, and no measurable loss of quality at the machine gates: 89 % of the
new shortlist passes them. What it does **not** fix is that several of the famous admissions
then fail *conversion*, on a music21 export limitation rather than anything about the rule.

One caveat on the numbers below: the quarry ran with `--skip-render`, because a content build
held the lock and agents do not start Playwright here. Gates 1–4 and 6 are real; gate 5, the
browser render and cursor-step parity, has not been asked. The band figures are therefore
upper bounds, and the run must be repeated with the render gate before anything is committed.

## Before and after

| | before (`build/pdmx`) | after (`build/pdmx-rerun`) |
| --- | --- | --- |
| CSV rows read | 254,077 | 254,077 |
| past the gates | 37,499 | 177,773 |
| superseded by `best_editions` | — | 73,476 |
| index rows (browsable) | 37,499 | 104,463 |
| chosen by the quotas | 425 | 497 |
| named wants found | 6 | 21 |
| Part F references / tunes | 119 / 28 | 176 / 30 |
| composition status of the chosen | pd 147, unknown 248, in-copyright 30 | pd 186, unknown 281, in-copyright 30 |

Rejections, grouped by gate. The dedup component of `subsets` was 142,078 rows, more than every
other gate together; what is left is the licence-conflict recommendation, which still stands.
The `size` gate grows only because rows the dedup flag used to reject now reach it.

| gate | before | after |
| --- | --- | --- |
| subsets | 161,660 | 19,582 |
| piano tracks | 53,312 | 53,312 |
| size | 1,493 | 3,295 |
| not a draft / no mxl | 113 | 115 |

Per band and bucket, chosen (classical / folk-hymn-carol / pop-film-game / jazz-latin):

| band | before | after |
| --- | --- | --- |
| 1-2 | 21 / 50 / 24 / 0 | 24 / 57 / 46 / 0 |
| 3 | 27 / 25 / 25 / 0 | 37 / 37 / 31 / 0 |
| 4 | 37 / 15 / 32 / 5 | 42 / 17 / 33 / 5 |
| 5 | 38 / 6 / 31 / 10 | 41 / 6 / 31 / 10 |
| 6 | 20 / 1 / 21 / 5 | 20 / 1 / 21 / 6 |
| 7-9 | 21 / 0 / 11 / 0 | 21 / 0 / 11 / 0 |

**The deltas that matter.** 111 of the 497 chosen rows carry PDMX's duplicate flag, so the old
gate would have refused every one of them; so do 48,500 of the 74,798 rows the new candidate
table keeps in reserve (177,773 past the gates, 73,476 superseded as editions, and the band 1-2
remainder that has never been opened dropped by the attestation rule). Of the old
run's 425 picks, 375 are still chosen, 20 are replaced by a better-ranked edition of the same
work (all in the easy folk end: three uploads of *Scarborough Fair* and three of *The Water Is
Wide* collapse to one each), and 30 are still in the pool but pushed below the quota line by
better arrivals. Nothing was lost outright.

Machine gates, new run, 497 offered, 442 passed (89 %): round-trip 25, structure 17, convert 13.
Band 1-2 7 %, band 3 10 %, band 4 6 %, band 5 9 %, band 6 8 %, **band 7-9 53 %** — over the
README's "about half" stop rule, and the reason is legible: 8 of that band's 17 rejections are
music21 refusing to write the converted score back out (`Cannot convert "2048th" duration to
MusicXML`, `inexpressible durations`, `KeyError: '5'`). The previous full quarry under
`build/pdmx/` is a 118-row run over hand-picked index rows, not over the shortlist, so there is
no per-band before to set against this.

## The note-loss gate

It cost this run nothing. **No candidate was refused for note loss**; the 13 convert failures
are parser and exporter errors. Of the 484 files that converted, 483 came out with the same
note-event count or a few more (20 gained, which is normalisation splitting ties across a
barline) and one lost 0.28 % — *Exit Music For a Film*, 1,070 events to 1,067. Nothing came
near the 2 % limit from either side. That is the expected result: the two mechanisms the limit
was drawn around are Humdrum spine splits and a three-part collapse, and this archive is
MusicXML.

## The admissions worth having

The four the flag was rejecting are all chosen, and the twenty highest-ranked new admissions
are these (level is the quarry's estimate; `converted` is gates 1–4 and 6 only):

| cid | title | composer | band | level | rating (n) | views | converted |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `QmbHzrXuDGNG3HyzLpeBNeZ9wAj4bTDGWsZ5xz56abM8D8` | Prelude I in C major BWV 846 | Bach | 6 | 6.1 | 4.78 (3706) | 511,539 | yes |
| `QmQivFenf7PzC4UiXgYbzx3G11yvQaCXWeuwvTDMMpr6Nk` | Maple Leaf Rag | Joplin | 6 | 8.2 | 4.84 (1892) | 335,718 | yes |
| `QmXaLndsVZvGL5n1saWern2cbW1Ze1kEKpeUofRBBmhT1D` | Piano Sonata No. 16, Allegro (K. 545) | Mozart | 6 | 7.0 | 4.81 (1210) | 161,948 | yes |
| `QmWjbVXhMRhcyo9d3Gknc8rTNB543TgNwAC4teG3iMNKKW` | Canon in D (easy) | Pachelbel | 4 | 5.7 | 4.72 (1563) | 199,200 | yes, duplicate of `song.classical.pachelbel-canon-d.easy` |
| `QmTAKD3Srv4x1ukkkJQDy5nkbpmP7aQKDbn2GoDdff76Hs` | Ballade no. 1 in G minor Op. 23 | Chopin | 6 | — | 4.82 (1375) | 112,744 | no — convert |
| `QmcAYpPLdEUiDiE5wXWTbYR3E2A7cdbWya8APYgfz8SGxr` | Amazing Grace (easy piano) | Newton | 1-2 | 4.6 | 4.66 (851) | 154,561 | yes |
| `QmeDoXZNneuM5tn1Qvv8oVYRWWStjZ2tuodvctXRsBppN8` | Prelude in C minor BWV 999 | Bach | 4 | 5.9 | 4.77 (594) | 84,379 | yes |
| `QmdvfmiTwJbZuu2hVpxWAWyxjiNn4ei6vrohijLySetaQ4` | Cello Suite no. 1, Prelude (piano) | Bach | 7-9 | 7.1 | 4.77 (369) | 63,559 | yes |
| `QmUx9b8AB8eFp7hoX99ss9GHk5pSCkKL33zXrenFvhvJbW` | Fugue in G minor BWV 578 | Bach | 7-9 | 7.8 | 4.81 (321) | 37,106 | yes |
| `QmNvwJ9vARcx8XgrVn7ev45WSt3Rj2Qyx7AvqSUSrGLRRw` | Ride of the Valkyries | Wagner | 7-9 | — | 4.84 (84) | 37,414 | no — convert |
| `QmNN6zfcoxEFByxwrsrpuVGMBeRZqfMzDq7p3SRKRjcwC7` | Nocturne Op. 9 No. 2 (easy) | Chopin | 3 | 5.8 | 4.77 (668) | 36,941 | yes |
| `QmSLWP7sjUP95JdbSqdx6Beek9TZAbdQmNcdqqqbGYSocj` | Ballade No. 1 in G minor (second edition) | Chopin | 6 | — | 4.77 (96) | 39,635 | no — convert |
| `QmaVX1UdTJ38KuMyHvMbrJyefM1WYxsgbBjYUniY3UEjwR` | The Lark (No. 10) | Glinka | 7-9 | — | 4.78 (206) | 33,095 | no — convert |
| `QmQa4EcRa1F4L47u9sLA5uWS4NnaT1yUFYsHZ5jL8xNBnw` | Italian Polka | Rachmaninoff | 6 | 9.0 | 4.74 (176) | 34,546 | yes (in-copyright) |
| `QmbVdgkLoTrsnb4M7QRrAowzcgiHsdAGFK6NhqYiWVcQvQ` | Auld Lang Syne | arr. Kilpatrick | 4 | 4.8 | 4.61 (319) | 39,934 | yes |
| `QmQ7dQTkFbV7E6hpqVgqDa6SuK6nR7NpXEHQMv61cbcwoc` | Intermezzo Op. 118 No. 2 | Brahms | 5 | 7.9 | 4.83 (239) | 22,661 | yes |
| `QmQ8DeLytHHaosTE6nMyLEeWUNimofCw4fMEygr5AKFp4s` | Team Fortress 2: Main Theme | Morasky | 5 | 6.0 | 4.65 (26) | 38,774 | yes |
| `Qme9Mjr7ESP67pjnBHjfiXJhnvXeZUYucorTLQnwsNmNCP` | Rêverie | Debussy | 5 | 7.5 | 4.87 (363) | 14,455 | yes |
| `QmZHPYkrrioRqc9fR6j9PotC9qhoacwS3DR3m1jMvTosu2` | Waltz Op. 64 No. 1 "Minute" | Chopin | 4 | 7.9 | 4.80 (253) | 15,141 | yes |
| `QmSZFKxakgyQWpRDACiPuLP3h3RKsVYRSFZQfeUwmrcCef` | Nocturne in C minor | Chopin | 7-9 | — | 4.85 (44) | 14,211 | no — convert |

Read by metadata and by the quarry's own fields, **none of these twenty is noise.** Every one
is a two-staff piano file with a real title and a real composer; the level estimates are
sensible against the titles; no row is flagged single-line, and four have a defaulted tempo
(BWV 999, the easy Nocturne, *Auld Lang Syne*, Team Fortress 2), which is a review note rather
than a fault. Two
are transcriptions rather than original piano writing (the Cello Suite prelude, the Wagner) and
one is a duplicate of something already in the catalog (*Canon in D*). Six failed conversion —
see the follow-up below; that is not the selector's doing.

## The noise the new rule lets through, and the rule that would stop it

Not in the head of the list; in the tail. 72 of the 111 new admissions have no rating and fewer
than a hundred views, and the same carol survives several times: among the 497 chosen there are
seven *Joy to the World*, six *We Wish You a Merry Christmas*, five *Silent Night*, four *Auld
Lang Syne*. In proportion this is not a regression (29 repeats in 425 before, 35 in 497 now),
but the rewrite was supposed to fix it and does not, for two reasons visible in the `work` keys:

1. `best_editions` groups **per band**, deliberately, so one carol at bands 1-2, 3, 4 and 5 is
   four rows. In the easy end that intent misfires — a 17-bar and a 19-bar *Joy to the World*
   are not an easy arrangement and a full score.
2. For a row with no matched composer the key ends in the **artist string**, and the archive's
   artist column is mostly a shelf label: `Misc Christmas`, `Misc Traditional`, `Misc Praise
   Songs`, and `Misc tunes` on 125,038 rows. Two uploads of one carol under two labels are two
   works.

The rule that would stop it, **not implemented here**: treat an artist string beginning `Misc `
as absent when building the key, and group the bottom two bands together rather than
separately. Both are one-line changes in `shortlist.work_key` / `best_editions`; neither should
be made without re-running this comparison, because the second one trades a stage-1 arrangement
away to remove a duplicate.

A second, smaller cost is the mirror of the same conservatism: *Ballade no. 1* is chosen twice,
because `Chopin - Ballade no. 1 in G minor Op. 23` keys on `op23-1` and `Chopin's Ballade No. 1
in G minor` on `no1`. The docstring predicts exactly this and calls it one extra edition in
review, which is the right trade.

## Reproducing this run

From the repository root, with `py -3.11` and `PYTHONUTF8=1`. Durations were this machine's on
the date above and are not a promise: index 1m56s, shortlist 1m58s, extract 12s, quarry 9m.

```powershell
py -3.11 tools\content\pdmx\index.py --pdmx-dir "C:\Users\yalir\repos\Piano Stuff" --out build\pdmx-rerun\index
py -3.11 tools\content\pdmx\shortlist.py --pdmx-dir "C:\Users\yalir\repos\Piano Stuff" --out build\pdmx-rerun\candidates.json
py -3.11 tools\content\pdmx\extract.py --pdmx-dir "C:\Users\yalir\repos\Piano Stuff" --candidates build\pdmx-rerun\candidates.json --out build\pdmx-rerun\raw
py -3.11 tools\content\pdmx\quarry.py --candidates build\pdmx-rerun\candidates.json --raw build\pdmx-rerun\raw --out build\pdmx-rerun --catalog build\pdmx-rerun\catalog-snapshot.json --skip-render
```

`catalog-snapshot.json` is a copy of `app/public/content/catalog.json` taken before the run, so
the duplicate gate reads a table that a concurrent content build cannot rewrite underneath it.
Drop `--skip-render` and point `--catalog` back at the app's own catalog when nothing else is
building content; that is the run that should precede `review.py` and `commit.py`. The
measurements in this note come from throwaway scripts beside the outputs in `build/pdmx-rerun/`.
