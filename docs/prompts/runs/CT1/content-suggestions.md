# Content suggestions for the owner to choose from (CT1, 2026-10-03)

**What this is.** A list of candidate content, ordered by the gaps the repository already
records. The owner runs the searches on the local PDMX archive (`archive_search.py` reads
the local `PDMX.csv`) and chooses.

**Every item is a candidate, not a claim.** Before an item is admitted:
- **The exact target is verified in its bars:** the leap, the accidental or the figure,
  with a sourced check.
- **Its level is placed** from the RCM, ABRSM or Faber tables (`levels/`, being extracted
  separately).
- **It passes the quarry's gates and `review.py`.**

A genre or composer establishes nothing. Nothing has been heard.

**Already recorded, so not repeated here:**
- **PDMX quarry** (`tools/content/pdmx/README.md`; `docs/decisions/2026-09-15-quarry-rerun.md`):
  - the licence field means nothing;
  - the dataset's dedup flag is unreliable;
  - pieces get lost to licence conflicts.
- **Classical rows already committed** (`content/sources/pdmx.json`): Lemoine Op. 37 (34),
  Bach (29), Mozart (24), Schumann Op. 68 (18), Duvernoy Op. 176 (16), Czerny Op. 299 and 300
  (14), Clementi Op. 36 (3), Tchaikovsky Op. 39 (3), Bertini Op. 29 (3), Burgmüller Op. 100 (3).
- **Gave nothing usable** (`docs/decisions/pedagogical-quarry.md`): Heller, Türk, Gurlitt Op.
  117 and 140, Le Couppey, Schytte, Loeschhorn and others.
- **Mutopia** (`content/sources/mutopia.json`, `docs/03-content-pipeline.md:93–150`):
  - the `.ly` route is unusable for `\alternative` editions;
  - the MIDI route writes repeats out and merges voices;
  - 10 of 16 Joplin rags are refused, and only Pine Apple Rag is in.
- **The wanted list** (`content/sources/pdmx-wants.json`): its unobtained titles are the
  owner's own list.

My earlier Mutopia and PDMX holdings (`measurements-2026-10-03.md` §1) re-measured much of
this. Where they disagree with the records above, **the records win**.

---

## A. Rung claims no option establishes (`docs/prompts/rung-claims.md`)

First, a caution: part of this gap may be the detector, not the content. `walkingBass`
misreads stride and clave (E22). Fixing the detector is CT1's own work; this list covers the
content.

| Gap | Rungs | Candidates to search | Local search | Known risks |
|---|---|---|---|---|
| A walking bass | `jazz.6`, `blues.6`, `jam.6`, `blues.8`; introduced on `blues.5` (0 of 11) | Pre-1930 published boogie-woogie and blues piano. **Pinetop Smith, "Pinetop's Boogie Woogie"** (1928): only the 7.5 edition is committed, and the full edition is on the wanted list. Early published blues with a walking left hand (W. C. Handy rows exist; check their left hands) | `archive_search.py --title "boogie"`, `--title "walking bass"`, `--title "Pinetop"`, `--title "blues" --pd` | Composition status per piece (pd, unknown or in copyright); many boogie classics are later and in copyright. A "boogie" title can have a broken-octave left hand, which is not a walk |
| The oom-pah figure | `ragtime.5` (0 of 9) | Ragtime and march left hands: Joplin through KernScores (`kern/joplin`, already fetched; not all imported), Scott and Lamb rags in PDMX, Sousa piano marches | `--title "rag" --pd`, `--title "march" --pd`, `--artist "Joplin"` | The figure has to be verified bar by bar. Joplin through Mutopia is refused as recorded, so use KernScores or PDMX editions |

## B. Concepts introduced with no piece (`rung-claims.md`, "Concepts a rung introduces")

| Gap | Rung | Candidates | Local search | Check before admitting |
|---|---|---|---|---|
| A leap of a fourth or fifth | 1.5 (0 of 9) | Beginner folk tunes whose melody leaps: *Twinkle* (the opening fifth), *Lightly Row*, *Old MacDonald* (fourth), *Brahms' Lullaby* (fourth), *Kumbaya* (fourth). Lemoine Op. 37's easiest numbers are already committed: check whether any sits at 1.5's level | `--title "Twinkle" --pd`, `--title "Lightly Row"`, `--title "Lullaby" --pd` | The leap itself is in the notes. Five-finger range (1.5 is still in position). One hand or hands separately |
| Accidentals | 3.1 (0 of 11) | Easy pieces with written accidentals in the key: Bach's Anna Magdalena minuets (Anh. 114 and 115 have chromatic notes; already committed? check by id), Schumann Op. 68 Nos. 1–3, Türk's *Handstücke* (not found in the quarry), Kabalevsky (in copyright, so excluded) | `--title "Minuet" --artist "Bach"`, `--artist "Schumann" --title "Album"` | Accidentals that are really in the notes, not just in the key signature. The level fits 3.1 |

## C. Gaps named in the backlog

| Gap | Where recorded | Candidates | Local search |
|---|---|---|---|
| No piece with printed dynamics on 2.4 | Q79 | Lemoine Op. 37 and Duvernoy Op. 176 rows are committed: check which **print** dynamics (read the file). Otherwise Burgmüller Op. 100 Nos. 1–5 (on Mutopia; PDMX losses recorded) | Read the committed files first; no search needed |
| Sixteenths taught nowhere | L123 | Czerny Op. 299 and Duvernoy Op. 176 rows (committed) hold sixteenths, so the gap is the rung's teaching, not content. A curriculum question for W8 | — |
| Unbuilt rungs `latin.4`, `latin.8`, `ragtime.4` | R26, Entry 44 | The music exists, but the level model puts it 2–4 levels above the stage. W9 (difficulty against published levels) comes first; no new search until then | — |

## D. Real content in place of generated families (`reuse-map.md` §9.1)

Each row replaces generated material only after its passage-level check.

| Generated family | Real candidates | Where | Recorded risk |
|---|---|---|---|
| `five_finger`, `coordination`, early `hand_independence` | **Schmitt, *Preparatory Exercises* Op. 16** (Nos. 1–45, the classic five-finger set) | PDMX: `--title "Schmitt" --title "Preparatory"`. Seen in the Zenodo CSV as "Schmitt Preparatory Exercises 1-45" | The Zenodo catalogue is unreliable (the owner); check the file. Its level is earlier than most études |
| `interval_reading`, `position_shift`, early reading | **Czerny Op. 821** (160 eight-bar exercises), **Czerny Op. 599**, Beyer Op. 101, Köhler Op. 93 | Op. 821: 19 on Mutopia, as single-file editions to check. Op. 599: 1 in the Zenodo CSV. Beyer: 3 pieces. Köhler: 1 | Mutopia's MIDI route merges voices and writes out repeats; prefer a PDMX edition where one exists |
| `trill`, `repeated_notes`, `tremolo_octaves`, `rotation` | Czerny Op. 299 (committed: check which numbers target these), Op. 840 (10 on Mutopia), Burgmüller Op. 100 (*La Babillarde* for repeated notes, *Arabesque* for alternating hands) | Committed rows first, then Mutopia | Licence-conflict losses recorded for several Op. 100 numbers in PDMX |
| `accompaniment` (Alberti, broken chord, waltz) | Clementi Op. 36 (3 committed; Nos. 2–3 lost to licence conflict), Kuhlau Op. 20, Diabelli Op. 163 and 168, Mozart K. 545 | Committed rows; Mutopia Kuhlau Op. 20 No. 1, Diabelli Op. 163 | Alberti claims need the figure verified bar by bar, and `HS1` accompaniment where the expert labels exist |
| `study` (`study.py`, to retire) | Lemoine Op. 37, Duvernoy Op. 176, Burgmüller Op. 100, Czerny Op. 299: all already committed | Already in the catalogue | Level placement (W8) |

## E. What the owner decides

1. **Which of A–D to search for on the local archive.** The local `archive_search.py`
   commands are above. The search finds candidates; the quarry's gates and `review.py`
   decide what is admitted.
2. **Whether an empty rung stays empty** rather than taking a near miss. `pdmx-wants.json`'s
   own comment: *"An empty rung that says so is better than a rung filled with the wrong
   music."*
