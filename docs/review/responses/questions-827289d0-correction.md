# Reviewer correction — content audit at `827289d0`

This file corrects `docs/review/responses/questions-827289d0.md`. The earlier response was created concurrently and is wrong on one factual point. Do not overwrite it; treat this correction as the reviewer’s latest explicit word for this content audit.

## Corrected verdict

**ONE NARROW CONTENT CORRECTION REQUIRED.**

The underlying L120c ownership/placement decision, L120d coping rule, E50 tempo repair and E50a identity boundary all stand. The only factual defect I found is in L120c’s new learner-facing 4.4 sentence.

## L120c — required wording correction

Current lesson text:

> **Sixteenths.** Every note but the last is a sixteenth: four to a quarter-note beat, beamed in fours, two groups to a 2/4 bar. Count "1 e and a, 2 e and a", four even notes per metronome click.

The verification itself establishes **two final half-note noteheads, one in each hand**, and two groups of four sixteenths **per hand** in each 2/4 bar. Therefore:

- “Every note but the last” is literally wrong if `note` means the printed noteheads: there are two final half-note noteheads.
- “two groups to a 2/4 bar” is ambiguous/wrong if read across the grand staff: there are two groups per hand, four beam groups total across both staves.
- “four even notes per metronome click” is better stated as four rhythmic subdivisions per click, because both hands sound noteheads on those four subdivision positions.

Use wording that states the rhythmic fact directly, for example:

> **Sixteenths.** Until the final held note in each hand, the pattern is written in sixteenths: four even subdivisions to a quarter-note beat, beamed in fours, two groups per hand to a 2/4 bar. Count "1 e and a, 2 e and a", four subdivisions per metronome click.

This is wording-only. Do **not** reopen `sixteenth-notes`, `rhythm.sixteenths.taughtAt = ["4.4"]`, the Hanon placement, or the surrounding lesson.

Everything else itemised in `e6c20b03.content.md` checked out:

- `sixteenth-notes` honestly names `rhythm.sixteenths`.
- 4.4 is the first teaching rung; ragtime.5 and technique.6 genuinely practise/claim sixteenths later on paths that already contain 4.4.
- jazz.4 genuinely teaches syncopation through the Charleston and off-beat-only comping patterns.
- *Für Elise (easy)* is the Grade-1-tagged simplified setting used by the new placements.
- Schumann’s *Chorale* item/duet sentence and Schumann’s *Melody* replacement are factually correct; the latter’s left-hand-eighths claim is notation-backed.

`finder.levelWords` is search metadata rather than a learner teaching claim. I checked it only for consistency with the repository’s own Stage 4–6 level vocabulary, not against an external current ABRSM syllabus.

## L120d — checked, no correction

All itemised claims in `4e76c768.content.md` hold:

- RH C position is C4–G4, MIDI span 60–67, explicitly taught at 1.1 by note name.
- LH C position is C3–G3, MIDI span 48–55, explicitly taught at 1.3.
- 1.5 introduces interval reading and defines a leap as a fourth or wider; 2.1 is where the C→F and C→G fourth/fifth leaps are practised.
- Therefore copying the same fixed-position coping declarations to `interval.leap` is consistent with the teaching text while leaving `interval.leap.taughtAt` and evidence semantics unchanged.

## E50 — all seven printed-tempo readings checked

I did **not** listen. I checked the encoded printed edition words preserved in each repair relation’s exact `restore.was` block. They read:

| score | printed edition value | repaired quarter tempo |
| --- | ---: | ---: |
| *Margie* | `= 160` | 160 |
| *Limehouse Blues* | `= 184` | 184 |
| *Singin' the Blues* | `= 120` | 120 |
| *Weary Blues* | `= 200` | 200 |
| *Storyville Blues* | `= 132` | 132 |
| *Wabash Blues* | `= 120` | 120 |
| *Tishomingo Blues* | `= 132` | 132 |

So all seven E50 tempo replacements are correct readings of what the encoded editions print under the already-reviewed missing-glyph/4/4 beat rule. Their old default 96 values were not edition readings.

The changed `notesPerSecond` values are also arithmetically consistent with the tempo changes (`old NPS × newTempo / 96`). The level/driver values are downstream model outputs, not new music claims in this content-fact pass.

Not checked here: whether those printed tempos are musically persuasive performance choices. That belongs to listening.

## E50a — checked, no correction

The one itemised `formerIdentities` schema claim matches the implementation: concrete historical aliases are re-proved; learner-material equality resolves them at read; stored rows are not rewritten; storage/exact-byte identity remains separate for D2/review/excerpt/checksum/cache purposes.

## Items not checked

No itemised teaching fact or E50 printed-tempo reading was skipped.

Deliberately outside this pass:

- no auditory judgement;
- no claim that the Schumann replacements are the *best* curation choices by ear;
- no external ABRSM validation of `sixteenth-notes.finder.levelWords` beyond consistency with this repository’s own stage vocabulary.

## Disposition

Make only the 4.4 wording correction through the smallest content-correction path. Everything else in the four `.content.md` manifests passes this fact/claim audit. This correction does not reopen the previously settled seam decisions or the already-dispatched L120e/E50b implementation fixes.
