# CT1 measurements, 2026-10-03

These are measurements, not new mechanisms (`plan.md` §11). Each records its method, its
scope and what it cannot show. Nothing here was heard; nobody in this process can hear.

## 1. Real teaching material that already exists

> **Superseded in part by the repository's own records.** Read `content-suggestions.md`
> first. I measured this before reading what the repository records, and much of it
> repeats earlier work. Two points here are wrong against those records:
> - **"18 Joplin rags as candidates":** the rags were checked and refused. The `.ly` route
>   fails on `\alternative`, the MIDI route merges voices, and only Pine Apple Rag got in
>   (`content/sources/mutopia.json`, `docs/03-content-pipeline.md:93–150`).
> - **"Clementi Op. 36 fills the gap":** three Op. 36 rows are already committed. Nos. 2–3
>   were lost to a licence conflict in the quarry (`docs/decisions/pedagogical-quarry.md:104`).
>
> The PDMX licence field means nothing, and the Zenodo catalogue is unreliable (the owner;
> `docs/decisions/2026-09-06-p11-replan.md:61`). The PDMX hits below are leads for the owner's
> local search, nothing more.

### Mutopia

**Method.** I read Mutopia's own listing pages: composer codes from `browse.html`, then every
page of `make-table.cgi?Composer=<code>&Instrument=Piano`. This was not a sample; every page
was followed. The raw output is in `mutopia-holdings.txt`.

| Composer | Piano pieces | Teaching sets held | Licences |
|---|---|---|---|
| Burgmüller | 19 | **Op. 100: 18 of the 25 études** (Arabesque, Pastorale, Innocence, Progrès, Courant limpide, La Candeur, Ballade, La Chasse, Douce plainte, La Babillarde, Inquiétude, Consolation, Styrienne, Tendre fleur, Bergeronnette, L'Adieu, Petite réunion, La Gracieuse) | Public domain |
| Czerny | 29 | **Op. 821** (160 eight-bar exercises): 19 held. **Op. 840** (50 melodic studies): 10 held | Public domain |
| Diabelli | 36 | Op. 149: 28. **To check: Op. 149 is a set of piano duets** ("melodische Übungsstücke"), so whether these files are four-hand is not yet known. Op. 163: two sets of sonatinas, 4 movements each | CC BY-SA 3.0 |
| Schumann | 32 | **Op. 68, *Album für die Jugend*: 21 pieces**; Op. 15: 7 | PD, CC BY, CC BY-SA |
| J. S. Bach | 135 | **Anna Magdalena notebook** (BWV Anh. 113–131): 14; **Inventions 1–15** and **Sinfonias 1–15**: complete; Well-Tempered Clavier: 41 movements; little preludes (BWV 924a, 926, 928) | Mostly public domain, some CC BY-SA |
| Joplin | 18 | Maple Leaf, The Entertainer, Elite Syncopations, Solace, Bethena and 13 more | Public domain |
| Mozart | 36 | K. 545 (all three movements), K. 331 (all variations), K. 457, K. 309 (first movement) | Mostly public domain |
| Beethoven | 43 | Op. 49 (the two easy sonatas), Für Elise, WoO 82, sonatas | Mostly public domain |
| Tchaikovsky | 8 | Op. 39 (*Children's Album*): 3 | Public domain |
| Kuhlau | 3 | Op. 20 No. 1 (all three movements) | Public domain |
| Clementi | 2 | Op. 36: **only 1 sonatina**; Op. 42 (already used for fingering) | PD, CC BY-SA 4.0 |
| Handel, Grieg, Satie, Scarlatti, C. P. E. Bach, Streabbog, Hanon, Bartók | 25, 8, 16, 4, 1, 1, 1, 1 | Hanon Part I (already used) | Mixed |

**Not on Mutopia** (no composer code on its browse page): Beyer, Gurlitt, Heller, Türk,
Kirnberger.

### PDMX

**Method.** I scanned the PDMX catalogue (`PDMX.csv`, Zenodo record 15571083, CC BY 4.0,
254,077 rows). Rows were kept when they were public domain or CC0 and marked
`is_best_path`; titles and composer fields were matched by keyword. These are metadata
matches only: each file must be opened before anything is believed about it.

| Found | Count | Notes |
|---|---|---|
| Clementi, *Six Sonatinas* Op. 36 | 1 file, the whole set | **Fills Mutopia's gap** |
| Schmitt, *Preparatory Exercises* 1–45 | 1 | The classic published five-finger exercises: a real-content candidate for the `five_finger` and hand-independence families |
| Burgmüller Op. 100 | 7 | Partly duplicates Mutopia |
| Köhler Op. 93 | 1 | — |
| Duvernoy Op. 176 | 1 (No. 7) | — |
| Czerny Op. 599 | 1 (No. 69) | Op. 261 and Op. 849: none |
| Beyer | 3 single pieces | — |
| Gurlitt | 1 (Op. 82) | — |
| Heller | 0 | — |

### What this changes

1. **Real candidates exist** for the families `reuse-map.md` §9.1 marks "USE REAL CONTENT":
   - technique: Czerny Opp. 821 and 840, Burgmüller Op. 100;
   - reading: Bach's Anna Magdalena pieces, Schumann Op. 68, Tchaikovsky Op. 39;
   - five-finger: Schmitt's *Preparatory Exercises*;
   - sonatinas: Clementi Op. 36 (from PDMX), Kuhlau Op. 20, Diabelli Op. 163;
   - ragtime: 18 Joplin rags.

   **Each is a candidate only.** It is admitted by the passage-level path in `plan.md` §4.1:
   - the exact target verified in the bars;
   - its level placed by the RCM, ABRSM or Faber tables (§3);
   - its physical fit checked.
2. **Beyer, Gurlitt, Heller, Czerny Op. 599 (beyond one exercise) and Türk** exist only as
   IMSLP PDFs. Converting them needs optical music recognition (Audiveris or oemer), and
   nobody here can proof the result by eye against the page at scale. **UNSOLVED** for now.
   They are not to be generated as a substitute.
3. **The authored and generated material these replace is not removed yet.** Removal follows
   admission, item by item.

## 2. The texture oracle: accompaniment at the scope the expert labels support

**Method** (`texture_oracle.py`, beside this file).
- **Data.** The ALGOMUS archive (data.gouv.fr, doi:10.57745/OHRWPC): expert per-bar texture
  labels for the 9 movements of K. 279, 280 and 283 (annotations ODbL), and the archive's
  own MusicXML scores (CC BY-NC-SA 4.0), used privately. The scores' embedded DCML
  `<harmony>` elements were stripped, because music21 cannot parse their Roman-numeral
  function text. Notes were untouched.
- **Alignment.** Labels were placed on bars by their quarter-note offsets.
- **What counts as an expert accompaniment bar:** any part of the bar's label with a
  melodic (`M…`) layer above a layer whose function includes harmonic or static (`H`, `S`).
- **Matchers.** `figures.py` was run unchanged. Only bars it flags *under a tune* count, as
  that is the accompaniment claim.

**Results** (1,161 labelled bars; 589 expert accompaniment bars):

| Matcher | Bars flagged under a tune | Inside an expert accompaniment bar | Precision |
|---|---|---|---|
| Alberti | 68 | 61 | about 9 in 10 |
| Broken chord | 194 | 151 | about 3 in 4 |
| Waltz bass | 9 | 1 | poor |
| Oom-pah | 1 | 0 | — |
| Boogie | 1 | 0 | — |
| Any figure | 216 | 159 | — |

**Coverage.** 430 of the 589 expert accompaniment bars have no figure flagged.

**What the results mean, and what they do not:**
- **Alberti's misses are mostly a definitional disagreement, not a pattern error.** Most of
  its 7 bars outside are labelled `M1/MS1(S1/M1)`. The experts heard the low–high–middle–high
  line as partly *melodic* (MS), not purely accompanying (HS). This needs a decision, not a
  quiet fix: does the app call such a bar Alberti?
- **O3 cannot test Alberti recall.** The experts do not name Alberti.
- **Broken chord's misses** are mostly bars labelled `H1` alone, or two melodic lines
  (`M1s/M1`). The matcher finds chord tones in succession where the experts hear a single
  harmonic or melodic line. Its precision is too low for it to establish an accompaniment
  claim by itself.
- **The waltz matcher fails on this music.** It took Mozart's left-hand octaves and dyads
  (`MH2p/M2o`, `H4h_/MH2o`) for bass–chord–chord. A larger test needs waltzes. Burgmüller,
  Schumann Op. 68 and Tchaikovsky Op. 39 hold candidates; none is yet expert-labelled.
- **The figure matchers cannot stand in for "accompaniment present"** (`leftHandPattern`'s
  job): they miss most accompaniment bars. That demand needs an accompaniment detector of
  its own, validated on O3. The research group's published descriptors (O3a, GPL-3.0, over
  music21) are the candidate. A homemade rule is not.

**Decisions this leaves:**
- **The `pending-detect.patch` stays unapplied.** Its mirror rule fixes the sixteen known
  false positives, but this measurement shows the deeper fault: one rule cannot stand for
  accompaniment. The `leftHandPattern` decision waits for an O3a-based accompaniment check,
  measured the same way.
- **The waltz matcher is marked failed on this test.**
- **Alberti is kept as a candidate,** with its known 9-in-10 precision and the MS/HS question
  put to the owner.

## 3. The level sources, extracted separately

Three files in `levels/`, one per source, never merged:

| File | Values | Unread | Uncertain | Notes |
|---|---|---|---|---|
| `abrsm-2025.json` | about 205 | 0 | 2 (rest glyphs, p. 17) | Sight-reading parameters (cumulative by grade), scales and arpeggios, speed guide, aural tests. pdftotext writes flats and sharps as "-" and "+"; that mapping was confirmed by eye on pp. 17, 36 and 39 |
| `rcm-2022.json` | about 425 | 2 (the Prep A and B "Playing" staves) | 43 (mostly beam counts at Levels 7–10) | Key lists read from page images, because pdftotext drops accidentals. Six rhythm tables print no note-value column (`notPrinted`) |
| `faber-correlation.json` | 70 topics, 90 cells | 0 | 0 | Blank cells are null |

Each value carries its page, and each file states what its source's levels *mean* (an exam
grade, an exam level, a publisher's correlation guide).

**Second read not yet done.** The plan requires one, line by line, before any crosswalk.
The values are an agent's extraction, read by eye where noted.

**Inconsistencies in the sources themselves**, recorded rather than resolved:
- RCM Level 10 minors print G♯ in the scales and A♭ in the chords.
- Faber's RCM column says "Grade 1/2/3" where RCM's own levels are "Level N".
- Faber 3A and 3B both map to RCM "Grade 1".
- Faber's typos ("doted", "Level2") and a duplicated Level 4 topic.
