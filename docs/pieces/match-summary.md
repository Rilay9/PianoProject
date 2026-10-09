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
