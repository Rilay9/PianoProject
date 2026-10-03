# CF3: real repertoire for N1–N3 — hand-back

## Preflight

| Item | Answer |
|---|---|
| Plan step | CF3 |
| Unit of work | For each of N1–N3, a small set of real music, chosen with published teaching evidence, with the exact score inspected |
| Learner problem | The transfer music on these rungs is weak, misplaced or unchecked |
| Disposition | CURATE: published methods are evidence, public-domain and held scores are the material, and music21 only reads the notes |
| Finish condition | A few pieces per need with provenance and purpose; N1's four homemade versions assessed; then stop |

**What every judgement below rests on.** Each one comes from reading the notation and the published sources. Nothing was heard. Placement is proposed here and not applied. The owner approves, edits or rejects each proposal, and one commit then applies them.

## Published evidence used

- **The Faber *Piano Adventures* correlation chart** (May 2017; local copy `build/ct1/faber.txt`, not in the repository). It maps Faber's levels onto Alfred, Bastien, RCM and ABRSM.
  - Level 1: "I and V7 chords in C and G".
  - Level 2A: "8th note rhythm patterns".
  - Level 2B: "I, IV, and V7 chords in C, G, and F".
  - So a leading method teaches the primary chords as functions across C, G and F, and V7 before IV.
- **The ABRSM Piano syllabus 2025 & 2026** (`build/ct1/abrsm.txt`, the same location). Its public-domain beginner pieces include:
  - Initial Grade: Beyer, *Melody in G*, Op. 101 No. 39; A. Reinagle, *Allegretto*, Op. 1 No. 9.
  - Grade 1: Köhler, *Melody in F*, Op. 190 No. 27; Türk, *Arioso in F*; Gurlitt, Op. 117 No. 15; Hook, Op. 81 No. 3; L. Mozart, *Minuet in F* (from the *Notebook for Nannerl*).

  Beyer's Op. 101 is the classic public-domain beginner method.

## N1: hands together, the left hand holds while the right moves (rung 2.1)

### The four project-authored versions, read note by note

| Piece | What the hands do | Judgement |
|---|---|---|
| *Mary Had a Little Lamb* (8 bars, C) | The right hand stays in the C position. The left hand holds one whole note per bar, C or G, changing once a phrase. | **Keep.** This is exactly the skill, at its simplest, and the standard way methods introduce it (Faber Level 1's I and V in C, with the root alone). |
| *Ode to Joy* (8 bars, C) | The right hand stays in the C position. The left hand holds C or G a bar at a time, with two half notes in the cadence bars. The dotted rhythm is written as halves, and the edition note says so. | **Keep.** Same skill. The simplification is common in beginner editions and is declared. |
| *Twinkle* (12 bars, C) | The left hand changes every half bar through most of the piece (C–F, C–G). The right hand shifts up a step for the A. | **Keep, but as the harder step.** This is the "left hand changes" skill plus a hand shift, not "holds". It belongs after *Mary* and *Ode*, or at the coordination "change" step. |
| *Jingle Bells* (chorus, 8 bars, C) | The left hand holds C for four bars, then F, C and G. | **Revise or replace.** It stops at the chorus's half cadence: the melody ends D–G ("sleigh, hey!") with a "C" symbol and a C in the left hand under the G. Usual harmony there is G (V). The fix is either the full 16-bar chorus ending on C, or another piece. |

**Overall verdict on N1's four.** They are deliberate teaching arrangements of the kind methods use, not homemade stand-ins for something better held. Two are right as they are; *Twinkle* is mislabelled as a "holds" piece; *Jingle Bells* ends in the wrong place.

### Real-music candidates

- **London Bridge (held, authored, CC0):** the left hand holds C or G a bar at a time, under a tune with two eighth pairs. It suits N1 and N2 together, and currently sits on 2.2.
- ***Mozart K. 331 theme* (PDMX, cc-zero, MuseScore 5744456, arranger unknown):** the left hand holds one dotted half per bar while the right hand moves. It is in C major and 3/4, and the original's siciliano rhythm is removed, so it is a simplification that keeps little of the piece's character. **Not proposed.**
- **Beyer, Op. 101:** PDMX lists "Beyer Nro 8", "Nro 9" and "Nro 10" (cc-zero, single track, 24–32 bars). The ABRSM Initial list names No. 39.
  - **This is the right source** for real N1 music at this level.
  - **The files are not in this environment.** Only the archive's metadata is here, so they were not inspected and nothing is claimed about them.
  - **Import request for the owner's machine:** extract PDMX `Beyer Nro 8`, `Nro 9` and `Nro 10` (`archive_search.py` / `extract.py`), so their left hands can be read before any placement.
- **Beyer No. 38 (held, level 2.67):** the right hand holds long notes and the left hand plays a broken chord in quarters (G–D–B–D). That is the next skill, the left hand moving under the right, **not N1**.

### Misplaced on rung 2.1

- ***Simple Gifts* (PDMX):** one staff, no left hand, full of eighths and with dotted quarters (taught at 2.2 and 2.4). It trains nothing rung 2.1 teaches.

## N2: eighth notes and counting (rung 2.2)

Rhythm read from each held candidate's notes:

| Piece | Eighths | Also asks for | Fit |
|---|---|---|---|
| *Hot Cross Buns* (authored, level 1.1) | A whole bar of eighths, "one a penny, two a penny" | Nothing else; C position | **Best first-eighths tune held.** It sits at 1.1, before eighths are taught |
| *Frère Jacques* (authored, level 1.2) | Bars 5–6, G F E D | A G3 below the C position | **Good.** It also sits before 2.2 |
| *London Bridge* (authored, 2.2) | Two eighth pairs | A left hand holding C/G | **Good, small dose.** Every right-hand bar opens with a zero-length rest, a notation quirk |
| *Merrily We Roll Along* (authored, level 1.1) | **None** | — | **Not N2** |
| *Old MacDonald* (authored, 2.2) | **None** in this edition | — | **Not N2** |
| *Michael, Row* (PDMX) | 2 | A dotted quarter (2.4) | Weak |
| *Sakura* (PDMX) | 10 | A tie (2.4) | Later |
| *Alouette* (PDMX, F major) | 20 | Dotted quarters and ties (2.4) | Later |
| *Swing Low* (PDMX, G major) | 44 | Dotted quarters (2.4) | Later |
| *Danny Boy* (PDMX) | 75 | Up to E6, ledger lines, dotted quarters | Much later |

## N3: first chords I, IV and V (rung 2.3)

This is read from what the left hand plays, not from the chord symbols (CF2's table reads the symbols).

| Piece | Left hand as written | Fit |
|---|---|---|
| *Happy Birthday (simple)* (authored, 2.3, C, 3/4) | Root-position block chords: C, G, F. The symbol says G7; the hand plays a plain G triad | **The rung's own controlled piece. Keep** |
| *Jingle Bells (in G)* (authored, level 3.2) | Root-position G, C, D7 (D–F♯–C) | **Transfer in G**, which Faber Level 2B covers. Its catalogue key reads "1 sharp" (CF2) |
| *When the Saints (in F)* (authored, level 3.2, not on 2.3) | Whole-note block chords F, B♭, C7 (C–E–B♭) | **Transfer in F**, which Faber Level 2B covers |
| *Happy Birthday* (MuseTrainer import, level 4.1) | Inversions throughout, a C7 over E with its B♭ **misspelled A♯**, a V7 without its root | **Not 2.3.** The symbols (C, G7) understate what the hand plays, and the A♯ is a spelling error |
| *Skip to My Lou* (PDMX lead sheet, D) | No left hand: the learner builds D and A from the symbols | A chord-symbol reading exercise, in D (Faber puts D at 2A). **Optional** |
| *Was wollen wir trinken*, *Dark Eyes*, *Auld Lang Syne* (PDMX lead sheets) | No left hand; CF2 reads chords outside I, IV and V | **Not N3** |

## Proposals for the owner (one approval applies them in one commit; none is applied yet)

1. **Rung 2.1** (`songOptions`):
   - Keep *Mary*, *Ode to Joy* and *Twinkle*, with *Twinkle* moved to last and described as the left hand changing.
   - Remove *Simple Gifts*.
   - Replace *Jingle Bells (chorus, hands together)* with a full-chorus version ending on C. That is one edit to the authored ABC, extending it to 16 bars from the same public-domain tune.
2. **Rung 2.2** (`songOptions`):
   - Add *Hot Cross Buns* and *Frère Jacques*.
   - Remove *Merrily We Roll Along* and *Old MacDonald*, which have no eighths, and *Danny Boy*.
   - Keep *London Bridge*.
   - Keep the PDMX songs with dotted quarters only if the rung should preview them; the default is to remove them to 2.4.
3. **Rung 2.3** (`songOptions`):
   - Keep *Happy Birthday (simple)* and *Jingle Bells (G)*.
   - Add *When the Saints (in F)*.
   - Remove the imported *Happy Birthday* and the three PDMX lead sheets *Was wollen wir trinken*, *Dark Eyes* and *Auld Lang Syne*.
   - Keep *Skip to My Lou* as the optional chord-symbol piece.
   - This follows Faber's C, G and F order, and the lesson already uses another key for transfer.
4. **Import request (owner's machine):** Beyer Op. 101 Nos. 8, 9 and 10 from PDMX, to be read before any placement on 2.1. Archive paths:
   - No. 8: `./mxl/9/52/QmRxtrDbgW6Pj4dab7ivA2tHVJ2dLwDAMFrvP22j1XQevV.mxl`
   - No. 9: `./mxl/9/57/QmRZ943PepFQiRitGjEvyPWzmf8XaGX8vLYDVPca8o1u3n.mxl`
   - No. 10: `./mxl/4/35/QmeoxeqGQq5YPmnCJyk6dazX7cDwjDs4rfgnKBNYXC43Xk.mxl`

   None of the three files is anywhere on this machine: the filesystem was searched for each by name.

## Not done, by the plan

- No placement edited.
- No file imported.
- No new tool, schema or detector.
- The level numbers of *Hot Cross Buns* (1.1) and *Frère Jacques* (1.2) were not changed. Whether a tune can sit before the rung that teaches its eighths, as a rote piece, is a curation question for CF5.
- The imported *Happy Birthday*'s A♯ spelling error and *London Bridge*'s zero-length rests are recorded for CF4/CF5, not fixed.
