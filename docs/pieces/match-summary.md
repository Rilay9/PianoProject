# Step 3: wanted pieces matched against available scores (2026-10-09)

Every match here is a **candidate**. Nothing is confirmed until the quality check (below) has looked at the file.

## Inputs

- **Wanted** (`build/pieces/wanted.csv`, built by `tools/pieces/build_wanted.py`): 18,924 list rows, merged into 12,576 pieces.
  - PSyllabus v1, 13 boards: 13,662 rows.
  - ABRSM Piano 2025 & 2026, Initial–Grade 8: 433 (`docs/sources/lists/abrsm-2025-26.csv`).
  - RCM Piano Syllabus 2022 with the 2024 errata, Prep A–Level 10: 2,310 (`rcm-2022.csv`).
  - Trinity piano repertoire list from 2023 (Aug 2026 edition): 516 (`trinity-2023.csv`).
  - Style lists: ABRSM Jazz 75, ABRSM Jazz Performance 120, ANZCA Modern 1,635, Trinity Rock & Pop 118, RSL Keys 55 (`styles.csv`).
- **Available** (`build/pieces/available.csv`, built by `tools/pieces/build_available.py`): 256,090 score files.
  - PDMX: 254,077 (the 544 pieces quarried before are flagged).
  - kern scholarly editions: 1,267.
  - musetrainer: 69.
  - Mutopia rags on disk: 20.
  - Mutopia keyboard catalogue: 657 (`docs/sources/catalogues/mutopia.csv`; LilyPond, MIDI and PDF, no MusicXML).
  - OpenScore: no solo piano collection among the collections that could be reached.
- **Matching** (`tools/pieces/match.py`, output `docs/pieces/matches.csv`, up to 5 candidates per piece):
  - **Composer:** the composer's surname must agree.
  - **Conflicts dropped:** a pair is dropped when the two name different catalogue numbers (Op./No., BWV incl. Anh., HWV, K., Z, Hob., WoO, D.), keys or movements.
  - **Confidence:**
    - *high:* a catalogue number agrees.
    - *medium:* a partial catalogue match, or titles 80% alike.
    - *low:* titles 60% alike.
    - *title-only:* the list names no composer (ANZCA) and the title is identical.

## Best candidate per wanted piece, by app level

App level from each source's own level (curriculum.md, level spine; above Grade 4 approximate). PSyllabus boards other than ABRSM, RCM and Trinity are counted separately by PSyllabus level (ps0–ps10), with no app level claimed. A piece on several lists counts once per level.

| App level | wanted | high | medium | low | title-only | none |
|---|---|---|---|---|---|---|
| A | 112 | 0 | 1 | 0 | 6 | 105 |
| B | 445 | 0 | 7 | 6 | 22 | 410 |
| 1 | 605 | 14 | 17 | 26 | 14 | 534 |
| 2 | 688 | 19 | 28 | 31 | 22 | 588 |
| 3 | 690 | 28 | 34 | 29 | 36 | 563 |
| 4 | 735 | 42 | 36 | 25 | 19 | 613 |
| 5 | 1153 | 70 | 38 | 54 | 35 | 956 |
| 6 | 1244 | 97 | 69 | 83 | 44 | 951 |
| 7 | 1011 | 92 | 77 | 55 | 38 | 749 |
| 8 | 1016 | 98 | 56 | 78 | 24 | 760 |

## What was checked, and how

- **Samples read by eye:** about 70 rows across high, medium and low.
- **Bugs found in the samples and fixed:**
  - Different movements of one work were merged.
  - Op. 49 No. 4 was taken for No. 2.
  - BWV Anh. 123 was taken for BWV 123, and K. 1a for K. 1b.
  - A suite's BWV number matched a different movement.
  - Keys written without "major" were not compared.
  - First names were counted as surnames (Dennis Alexander matched Alexander Scriabin).
  - Surname-first names were misread.
- **Fix checks:** each fix was run once on its failing example (one-off runs, not saved as tests).
- **High rows at Levels 1–2 read correctly** in the last sample: Mozart K. 2, K. 1e, K. 1c, K. 7; Beethoven WoO 86, WoO 23; Haydn Hob. IX:22 No. 3; Schumann Op. 68 No. 2; Handel HWV 494; Bach BWV 514.
- **Medium rows still include wrong pieces** (a generic title with no number on one side). They are worth looking at, not trusting.
- **Not checked:** title-only rows have not been sampled. No candidate file has been opened yet.

## What it shows

1. **The upper grades are well served:** about 90–100 high-confidence candidates per grade at Grades 6–8, plus medium ones.
2. **The beginner levels are almost empty:** Levels A and B have no high candidates and Grade 1 has 14. Their list pieces are mostly modern teaching pieces published only in print (the Grade 1 pilot found the same).
3. **About 81% of wanted pieces have no candidate at all** (10,240 of 12,576).

## Next (the owner's plan: "then we can check for quality")

1. **Quality check on high and medium candidates, by script, reading plain facts from each file:**
   - number of staves and instruments (is it piano?);
   - key and time signature against the list title;
   - bars;
   - words that mark an arrangement or another instrument ("easy", "simplified", "arr.", "flute", "ukulele").
   - For Mutopia this needs the MIDI or LilyPond, since there is no MusicXML.
2. **Confirmation, only for pieces chosen for a rung:** compare the opening bars with a printed source (IMSLP or the syllabus book).
3. **For Levels P–B,** where lists give almost nothing, the teaching material has to come from elsewhere:
   - public-domain beginner methods (for example Beyer Op. 101, Czerny Op. 599, Türk, Gurlitt Op. 117, Köhler Op. 190, which appear in PSyllabus and the lists at low levels);
   - folk-song arrangements;
   - generated pieces (step 4).

## Quality check of high and medium candidates (final run 2026-10-09, `tools/pieces/quality_check.py`)

After the datasets downloaded on the owner's go (ASAP, OpenEWLD, Scriabin and the Mozart dice game in kern, Nottingham folk tunes; `content/scores/imported/SOURCES.md`) and three more matcher fixes found by sampling (mode kept in "in C minor", Roman numerals read, No. numbers compared when only one side names the opus):

- 3,080 high/medium candidate rows: **1,376 facts fit**, 1,357 flagged, 347 not checked (Mutopia files not downloaded). Per row: `docs/pieces/quality.csv`.
- **Pieces whose best candidate fits the facts, by app level (high / medium):** A 0/1, B 0/6, 1 11/9, 2 15/13, 3 20/14, 4 33/18, 5 57/19, 6 63/32, 7 65/43, 8 75/36. That is 504 high and 313 medium pieces in all levels together, PSyllabus-only boards included.
- **Precision, measured by reading a random sample of 20 per tier against the files:**
  - *High:* 15 of 20 are the right piece; 5 are the right work but the wrong or an unclear part (a whole sonatina, another movement, a set without its number); 0 are a wrong piece.
  - *Medium:* about 12–14 of 20 are the right piece, 3 partial, 3 wrong (Gymnopédie 2 against 1, Beethoven WoO 51 against Op. 53, a different Shostakovich waltz).
- **What "facts fit" means:** the file is a piano score, its key signature agrees with the title, and its title shows no arrangement. It is not a confirmation.

Matcher tuning stops here. The high facts-fit tier is the pool; a piece is confirmed (right piece, right movement, against a printed score) when it is chosen for a rung. Medium candidates are used only after that individual look.

## Format: MusicXML only (decided 2026-10-09)

Only MusicXML files (.mxl, .musicxml, .xml) go forward. Humdrum (.krn), LilyPond, MIDI and ABC are dropped. The old project recorded that music21's Humdrum parser lost most of a mazurka's notes when spines split inside a split, and placed key signatures written between bars in the wrong bar (old branch `docs/08-test-map.md` lines 98–102, `docs/03-content-pipeline.md` line 458). Mutopia offers no MusicXML at all.

With that filter, the best MusicXML candidate per piece:
- **638 pieces whose facts fit, 390 of them high:** PDMX `.mxl`, ASAP `.musicxml` and musetrainer `.mxl`.
- **By app level (high / medium):** A 0/1, B 0/6, 1 11/9, 2 15/13, 3 20/13, 4 33/18, 5 54/19, 6 50/26, 7 47/35, 8 54/23.
- **Dropped from the pool:** the 252 Humdrum best candidates (Sapp kern editions, Scriabin) and 163 Mutopia candidates, unless a MusicXML file of the same piece exists.

## Known source problems applied (old branch findings, 2026-10-09)

- **PDMX duplicates.** By the dataset's own flag, 142,078 of 254,077 rows (56%) are not the deduplicated copy (old branch `docs/decisions/2026-09-06-p14-pdmx-quarry.md`). The available list now carries the flag. The matcher prefers the canonical copy; the quality check flags a non-canonical one; `agree.py` counts agreement as independent only between canonical copies or files from different sources.
- **PDMX `composer_name` empty on many pop/film rows,** with the author in `artist_name` (same P14 record). The available list now uses the artist when the composer is empty. Names can also be mojibake or misspelt there; those matches are missed, not fixed.
- **PDMX metadata is attribution, not fact:** composer, arranger and artist are conflated, and tempo marks go missing or are defaulted (old branch `docs/prompts/content-mistakes.md` item 17). Titles and composers stay candidates until checked. Tempo from a file is not trusted.
- **MuseTrainer mislabels** (old branch `docs/decisions/2026-09-05-p4-content-licensing.md` §2) are listed in `docs/pieces/exclusions.csv` and dropped from the available list. They are *Mariage d'Amour* filed as Chopin's "Spring Waltz", a modern "G Minor Bach" filed as Bach, and a Clayderman piece filed as "Hungarian Sonata".

After this rerun (copies excluded from "facts fit"): 3,110 candidate rows, 1,090 facts fit, 1,669 flagged, 351 not checked. MusicXML pieces whose canonical upload fits the facts: **513 (294 high)**. By level (high/medium): A 0/0, B 0/4, 1 11/9, 2 13/17, 3 19/11, 4 23/17, 5 37/15, 6 32/23, 7 39/32, 8 44/16.

After the one-staff flag (606c9f40; files with one treble staff and no left hand, found by ChatGPT's review): MusicXML pieces whose canonical upload fits the facts: **481 (288 high)**. By level (high/medium): A 0/0, B 0/3, 1 11/8, 2 13/14, 3 19/10, 4 23/15, 5 37/13, 6 31/18, 7 39/29, 8 44/12.
