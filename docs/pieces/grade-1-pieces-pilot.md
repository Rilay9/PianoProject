# Grade 1 pieces pilot: identity checks (2026-10-09)

Six Grade 1 pieces were picked from the MusicXML pieces whose facts fit (`docs/pieces/match-summary.md`), covering the Grade 1 pieces rung (1.10) with contrasting kinds. Each is on at least one board's Grade 1 list (sources in `docs/pieces/matches.csv`).

**Check used:** `tools/pieces/agree.py` compares the first 8 bars of every MusicXML candidate file of the piece, top and bottom staff, pitch and duration. Independent uploads that agree note for note are evidence the notes are right; this is weaker than a printed score.

| Piece | Lists | Files | Result |
|---|---|---|---|
| Beethoven, Russian Folk Song (Air from Little Russia) Op. 107 No. 3 | RCM 1, Trinity 1, PSyllabus ABRSM 1 | 4 | **Agree**: all 4 identical in bars 1–8 |
| Mozart, Allegro in F K. 1c | PSyllabus ABRSM 1 | 3 | **Agree**: 2 fully, the third on the top staff |
| Mozart, Minuet in F K. 2 | PSyllabus AMEB/NZMEB 1 | 4 | **Agree**: 2 fully. One "(easy)" upload differs below the top staff; "Minuet in F" (32 bars) is a different piece |
| Schumann, Soldier's March Op. 68 No. 2 | PSyllabus ABRSM 1, AMEB 2 | 2 | **Agree**: both identical in bars 1–8 |
| Bach (attrib.), Chorale BWV 514 | ABRSM 1, RCM 1 | 5 | **Unconfirmed**: one file is BWV 514; the other four are different chorales |
| Haydn, German Dance Hob. IX:22 No. 3 | RCM 1 | 2 | **Unconfirmed**: the two files are different pieces; the one labelled Hob. IX/22 No. 3 has no second source |

**Caveat on "agree":** the uploads were not checked for independence. PDMX contains re-uploads and copies; two Op. 107 No. 3 files share the same title. Copies agreeing prove nothing, so an "agree" here counts only once independence is shown (different uploaders, or PDMX's deduplication fields).

**Not yet done:**
- **Printed-score comparison:** dropped on the owner's decision. IMSLP mostly offers PDFs and has no MusicXML for the pieces checked. Confirmation rests on independent uploads agreeing plus the catalogue-number match. A piece with a single upload stays unconfirmed until the owner has played it.
- **Whole-piece checks:** bars after 8 are not compared.
- **Loading in the app:** that comes in step 6.

## Rerun with independence (2026-10-09, after the PDMX duplicate flag was applied)

Agreement now counts only between canonical uploads (PDMX's deduplicated copies) or files from different sources:

| Piece | Result |
|---|---|
| Beethoven, Russian Folk Song Op. 107 No. 3 | **Confirmed by independent agreement:** 3 canonical uploads identical in bars 1–8 (a fourth is a copy) |
| Mozart, Minuet in F K. 2 | Not confirmed: the agreeing pair is a canonical upload and its own copy |
| Mozart, Allegro in F K. 1c | Not confirmed: the two fully agreeing files are both copies; the canonical one agrees on the top staff only |
| Schumann, Soldier's March Op. 68 No. 2 | Not confirmed: the agreeing file is a copy |
| Bach, BWV 514; Haydn, Hob. IX:22 No. 3 | Not confirmed: a single upload each |

**What this shows:** independent uploads of the same piece are rare, so this check can confirm few pieces. Most pieces rest on the catalogue-number match and the facts check, until the owner plays them.
