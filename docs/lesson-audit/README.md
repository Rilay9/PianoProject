# Lesson audit — the list to fix (2026-09-19)

Every one of the 98 lessons (`content/lessons/*.md`) was read in full and every checkable
sentence checked against the built score, the curriculum or the app code. **Nothing was
fixed**: the owner asked for a list, and this is it. How each claim was checked is in
[`BRIEF.md`](BRIEF.md); the findings are in the five batch files, lesson by lesson, in
curriculum order, each with the quoted sentence, its `file:line`, what is actually true and
the evidence.

| file | lessons | findings |
|---|---|---|
| [`batch-1.md`](batch-1.md) | 0.1 – 3.1 (22) | 74 |
| [`batch-2.md`](batch-2.md) | 3.2 – 4.5 (19) | 43 |
| [`batch-3.md`](batch-3.md) | 4.6 – ragtime.5 (18) | 77 |
| [`batch-4.md`](batch-4.md) | theory.5 – classical.7 (17) | 57 |
| [`batch-5.md`](batch-5.md) | ragtime.7 – improv.9 (22) | 72 |
| **total** | **98 of 98** | **323** |

By kind: **202 FALSE**, 14 STALE, 8 WRONG-COUNT, 13 UNOFFERED, 18 THEORY, 47 JUDGEMENT,
17 UNVERIFIED, 4 HISTORY (only batch 4 used a HISTORY label; batch 5 filed history under UNVERIFIED, and how
the other three handled it was not checked).
Counted from the files' checkboxes, and each file's own summary line agrees with its count.

## Fix pass (2026-09-19)

The owner asked for the findings that need a **correction, not a build** to be fixed, with a
line on each saying what the fix did and why ([`FIX-BRIEF.md`](FIX-BRIEF.md)). Every ticked
box now has a `Fixed:` line under it.

| batch | fixed | found wrong | left open |
|---|---|---|---|
| 1 | 57 | 0 | 17 |
| 2 | 34 | 0 | 9 |
| 3 | 53 | 1 | 23 |
| 4 | 43 | 0 | 14 |
| 5 | 49 | 0 | 23 |
| **total** | **236** | **1** | **86** |

236 + 1 + 86 = 323, every finding; 236 is also the number of ticked boxes, counted. The one
found wrong is chords-pop.5:44 (*Your Song* does sound seventh chords, between the hands),
re-filed as JUDGEMENT. Left open: THEORY, JUDGEMENT, HISTORY and UNVERIFIED, which need a
musician or a source.

**Checked after the pass:** content build and `validate.py` OK (2,054 items); unit suite
2,239 passed, which includes the three-minute reading cap (`lessonShape.test.ts`) and the
Library-pointer rule (`lessonClaims.test.ts`); no file outside the lessons and this folder
changed; the seven edited lessons that carry rows in `lessonClaimsAboutMusic.test.ts` were read
against their rows and none contradicts one. **Six fixes drawn at random were checked against
the source and held** (chords-pop.6 slash bass, chords-pop.5 add9 pointer, ragtime.7 Maple
Leaf — its bars read by the fixer only, blues.3's longest song, blues.3's tool count, 3.4's
reading range). **Not checked:** the other 230 fixes beyond the fixers' own re-reading, and
nothing has been heard.

**Where a lesson promised what the app does not do, the lesson now describes the app as it
is.** Each such finding says so. Whether to build the feature instead remains the owner's
decision — the list under *Decide before fixing* below still stands, now as features to
consider rather than errors in the lessons.

**Found during the pass, not in any lesson:** the placement drill's status line says "Today
will build from here" (`DrillScreen.ts:2659`, `LessonScreen.ts:559`); `1.2.md:53` and
`technique.8.md:26–28` still use the old names "Tempo mode" and "Wait mode" (no finding
covered them); the *I Got Rhythm* score has its backward repeat after the second ending
(batch 5); the chord-chart screen has no route that opens it (batch 3); `lessonShape.test.ts`
pins `technique.6`'s "1.4 times" wording although nothing measures it (batch 4).

## How far to trust this list

The auditors can be wrong too. **Ten FALSE findings were drawn at random** (two per batch,
fixed seed) and checked against the source. Nine held, read directly: *Skip to My Lou*'s
chord changes (2.3), the missed-card pause (0.3: `MISS_PAUSE_MS` 2 s, no retry in the drill
screen), *Greensleeves in 6/8*'s rhythm (4.5), the *Écossaise* file being in F on one staff
(classical.3), the *Passacaglia*'s level 6.41 (classical.4.shelf), Rhythm only having no
swing model and a 150–200 ms window (ragtime.5), blues.6's boogies being four bars of one
chord, improv.8's lab preset locking the progression, and *Blinding Lights*' plain
chord symbols (chords-pop.7). **One was only partly checked** — *Annie's Song* having no
repeating chord cell (chords-pop.6): the catalog lists its chords but not their order.
Nine of ten is evidence the list is largely right, not that every finding is. **Check each
finding's evidence before changing the lesson.**

## Decide before fixing — the lesson or the app?

Many FALSE findings are a lesson promising something the app **half-has**: the code exists
and nothing calls it, or a catalog setting exists and nothing reads it. Each can be fixed by
changing the sentence or by finishing the feature. That is the owner's call, not the
fixer's. Confirmed by search where marked; the rest are the auditors' findings.

- **Rung pass thresholds are never read.** Every rung's `mastery.minTempoPct` and
  `mastery.minAccuracy` — the app passes everything at one global 80 % tempo
  (`Scoring.ts:153`). *Confirmed*: `app/src` searched for both names and for `mastery.<field>`.
  Lessons quoting per-rung speeds (1.1, 1.3, 1.4, 2.1 and others) rest on this.
- **Dynamics and voicing scoring are written and never called**: `shapingScore`
  (technique.5 "scored on the slope") and `voicingScore` (technique.6 "the app measures").
  *Confirmed*: each name appears in `app/src` only at its definition. Also reported: the
  held-length articulation scorer (technique.4) and the half-pedal scoring (technique.7).
- **Drill settings nobody reads** (auditors): hands-together `leftHand` and position-shift
  `shifts` (2.1, 2.5 — both drills play the same five-finger call-and-response); melodic
  dictation and *Answer the phrase* `bars`/`scale` (theory.4, improv.4 — four random notes,
  not two bars); ii–V–I `voicing: shell` (jazz.5 — asks for plain triads); the form
  tracker's `chartView` (jam).
- **Melodic dictation prints the note names on the card before the answer** (theory.4,
  auditors). If true this breaks the ear-drill rule `04` §5c (no answer before it is judged)
  and is a bug whatever the lesson says.
- **Lab presets lock the controls lessons tell the learner to change** — in 3.3,
  improv.4, chords-pop.5, improv.6, chords-pop.8, chords-pop.9, blues.8, improv.8
  (improv.8 *confirmed*: `jazz-comping` locks `progression`). Fix by pointing the rung at an
  unlocked preset, or by changing the lesson.
- **Tool paragraphs for tools the rung does not have** — jazz.7 and theory.7 describe the
  lab, technique.7 describes Duet (*confirmed*: their `tools` are play+duet, simon, none).

## Score files that are wrong, whatever the lessons say

Found while auditing; not lesson sentences. Reported by the auditors unless marked.

- `song.classical.beethoven-ludwig-van-beethoven-ecossaise.pdmx` — titled "in G major, WoO
  23", written in **F major on one staff** (*confirmed*: `fifths -1`, `staves 1`, ends on F).
- `song.classical.beethoven-ludwig-van-beethoven-joyful-joyful-we-adore-thee.pdmx` (hymns.2)
  — written like bagpipe music: no key signature, 72 grace notes, the tune on D with F
  natural, tempo 40. Needs an ear.
- The *G minor Minuet* file holds only its first 16 bars.
- *Só Danço Samba* opens with seven bars of repeated B4, and bar 10 seems to hold six beats
  in 4/4.
  **Bar 10 is not wrong** (2026-09-21, `score_checks.py`): two quarter-note triplets, four
  beats exactly; `dump_score.py` does not mark tuplets. The seven repeated B4s stand as read.
- The Mozart K. 1e item contains all of K. 1f as its Trio, so two options overlap.
- The Clementi "second and third movements" item holds only the third.
- The classical shelf: 27 of its 50 pieces are personal-build only, including pieces the
  lesson presents as on every build.

## Also noticed, with no lesson sentence attached (auditors)

- Every note-flash drill includes black keys, including Stage 1's C4–G4 treble drill.
- `drill.theory.build-major-scale` is a plain find-the-key drill.
- A held-length measure and a rolled-chord count are computed and never shown.
- Duet is on by default (`playbackHands: 'non-focused'`, *confirmed* in `settingsStore.ts`),
  so lessons saying "switch Duet on" (0.3, 1.4, 2.1) tell the learner to turn it off —
  the toggle's behaviour itself was not read.

## The instrument's limits

`tools/content/dump_score.py` (written for this audit) prints grace notes as ordinary
notes, does not mark ties or tuplets, and prints a multi-part score (1 of 1,975 files) as one
list with repeated bar numbers. A finding checked only through it, about rhythm or a
grace-noted score, deserves a second read of the MusicXML. The code line numbers cited were
read from a working tree with uncommitted changes to `DrillScreen.ts`, `fromCatalog.ts`,
`LessonScreen.ts` and `simon.ts` (T3); they may shift by a few lines.

## For the fixer

- Work lesson by lesson, one batch file at a time; tick each box as it is fixed or rejected
  (write *why* beside a rejected one).
- **THEORY** and **JUDGEMENT** items need a musician — list them for the owner rather than
  deciding.
- Each fixed factual sentence should become a row in
  `app/tests/unit/lessonClaimsAboutMusic.test.ts`, or the next edit will break it silently.
- The blue note of the blues scale is a raised fourth in every key (owner, 2026-09-19); a
  lesson spelling it G flat is a finding, one calling it a flattened fifth and writing F
  sharp is not.
- Nothing has been heard. Do not write that a piece sounds a certain way.
