# Step 3 pilot: finding the ABRSM Grade 1 list as real scores (2026-10-09)

**Question:** given a published graded list, how many of its pieces can be found as score files, and can we tell they are the right pieces?

**List used:** ABRSM Piano Practical Grades 2025 & 2026, Grade 1, lists A, B, C (48 entries; Spec 25-26 pp. 21–22).
**Searched:** the full PDMX catalogue on disk (254,077 rows; `PDMX.csv`, files from `mxl.tar.gz`); the curated scores already on disk (`content/scores/imported/`: kern, musetrainer, Mutopia rags); Mutopia online (searches "Hook", "Purcell", "BWV 514").
**Method:** match by composer (whole word) and title words; then read plain facts from each candidate file with music21 (key signature, analysed key, time signature, measures, first notes). Scripts: scratchpad `g1_search.py`, `g1_search2.py`, `g1_extract.py`.

## Result (measured)

| Kind of entry | Entries | Found as the listed version | Found as some other version |
|---|---|---|---|
| Modern teaching pieces published in one book (e.g. Anand, Marmion, Gillock, Barratt, Alexander duets) | 27 | 0 | 0 |
| Pop/film songs in a named arrangement (Imagine, Beauty and the Beast, Let It Go, Remember Me, Can't Stop the Feeling) | 5 | 0 | 5 (14, 10, 4, 3 and 1 PDMX arrangements) |
| Traditional songs in a named arrangement (Muss i denn, Mango Walk, Tu tu Gbovi) | 3 | 0 | 2 |
| Classical originals or classical arrangements (Handel ×2, Köhler, Bach, Gurlitt, Hook, L. Mozart, Mozart, Purcell, Türk, Dunhill, Grechaninov, Spindler) | 13 | candidates read for 5, none confirmed | Mozart K. 487 No. 8: 3 hits on "487", not examined |

Classical candidates read from the files:

| Entry | PDMX candidate | Key / time / measures | Status |
|---|---|---|---|
| A5 Bach, *Deal with Me, Lord*, BWV 514 | "Schaff's mit mir Gott", subtitle "BWV 514", 2 staves | C major, 3/4, 16 | Catalogue number matches; the list states no key; no reference text compared |
| A10 Hook, Gavotte in C, Op. 81 No. 3 | James Hook "Gavotte", 2 staves | C major, 4/4, 16 | Key matches; no opus in the file; no reference compared |
| A11 L. Mozart, Minuet in F (Nannerl No. 6) | "Minuet in F", Leopold Mozart, 2 staves | F major, 3/4, 32 | Key matches; no reference compared |
| A13 Purcell, Minuet in A minor, Z. 649 | "Henry Purcell – Minuet", 3 parts | A minor, 3/4, 20 | Key matches; no Z number; 3 parts unexplained. Two other hits are ukulele arrangements (rejected) |
| B15 Spindler, Song without Words | Fritz Spindler "Song without words", 2 staves | A minor, 3/8, 33 | Title only; the list gives no opus, so the piece cannot be pinned down |
| A8 Handel, Gavotte in C | Handel gavottes in G and A only | — | Not found in C |
| A2 Köhler, A7 Gurlitt, A15 Türk, B1 Dunhill, B8 Grechaninov | none | — | Not found |

Curated sources: none of the 48 is in the curated scores on disk or found on Mutopia by the three searches.

## What the pilot shows

1. **ABRSM's Grade 1 list is mostly unavailable as files:** 27 of 48 are modern pieces that exist only in print, and the songs are graded as one specific published arrangement.
2. **PDMX gives candidates, not confirmations.** Title, composer and key can match while the piece, the edition or the arrangement differs; nothing in PDMX itself proves identity. A confirmation needs a reference text (opening bars, bar count) from a second source.
3. **The curated sources are thin at this level:** the scholarly editions on disk are advanced repertoire, and Mutopia had none of the searched pieces.
4. **Other arrangements of listed songs exist, but the list's grade does not transfer to them.** Their level cannot come from the list.
