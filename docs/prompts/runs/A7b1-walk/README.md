# A7b.1 acceptance walk, phone held sideways

The browser walk of `docs/chains/A7b.1.yaml` (minor ii-V-i with shells; Blue Bossa as its tune) on an emulated
phone held sideways: 780 x 360, touch and mobile emulation on. A7c.1's walk covered the upright phone. The owner chose
the sideways phone on 2026-10-07.

- Spec: `app/tests/e2e/a7b1-landscape-walk.spec.ts` (first line `// acceptance-ability: A7b.1`, the checker's R9).
- Record of the run: `results.json` in this folder (every step: what was done, what was seen, the verdict, the pictures).
- What the journey proves: the ability's own named evidence, and no rung completion (the ruling
  `docs/review/responses/pf2-landing.md`). Step 4 plays the counted drill until jazz.6 reads "1 of 2"; the walk asserts
  nothing about the rung being complete.
- Input: the learner's piano is the MIDI mock (`fixtures/midiMock.ts`); Keep tempo runs are played in time by
  `fixtures/playInTime.ts`; on the chord chart the shells are struck from inside the page on its own frames, each read off
  the chord symbol the chart prints in the sounding bar (root, third, and the seventh or the sixth). Taps are touch taps.
- Nothing here was heard. Every line about sound (Play it to me, Hear it, the chart's comp, bass and drums) is read from
  the screen's state and the app's own count of notes scheduled: unverified as music. The spoken quality in step 3 is
  self-checked and not stored, so not asserted.
- Run: one worker, own port (4391), a copy of the Playwright configuration whose storage state is keyed to that port,
  from a fresh build of the app on origin 6c9e73f1. Result: the test fails at its end, as designed, because four
  steps are STOP (11, 12, 13, 16); the other twelve rows PASS.

## Steps

The `route` row is the way in (Plan, the tracks sheet, Jazz on, Stage 6, the rung); the numbered rows are the record's
steps in order.

| Step | Verdict | What was done and seen |
| --- | --- | --- |
| route | PASS | Plan, tracks sheet, Jazz on, Stage 6 row, the jazz.6 page: 8 exercise rows, 8 song rows, "What the app counts — 0 of 2". |
| 1 lesson | PASS | The page carries the minor ii-V-i line (Dm7♭5 – G7 – Cm), the shell as root, third and seventh, Cm6 as a minor triad with a major sixth and its shell C, E♭, A, and the omitted-fifth sentence. The last paragraph is the Insensatez answer. Screenshot `01.png`. |
| 2 Free play | PASS | From Today. D-F-A♭-C: "D half-diminished 7th"; A♭ raised to A: "D minor 7th"; fifth lifted, D-F-C: no chord name; G-B-F and C-E♭-B♭ (Cm7 shell): no name; C-E♭-A: "A diminished / C". The readout, notes line and keys all fit in the 360 px height (`02-*.png`). See finding L1. |
| 3 ear drill | PASS | Opened from jazz.5 (Plan, Stage 5, the jazz rung, the drill row; URL carries `rung=jazz.5`). Ten echo cards answered through the mock with the cards' own `data-expects`; the stored row is jazz.5's (`lessonId jazz.5`, accuracy 1); jazz.6 still reads 0 of 2. The spoken quality was not and cannot be checked. |
| 4 minor shell drill | PASS | Opened from the jazz.6 row (`rung=jazz.6`). Ten cards, in the record's order (Dm7♭5, G7, Cm6 in C minor; Bm7♭5, E7, Am7 in A minor; Am7♭5, D7, Gm7 in G minor; then the first again), three notes each, the answer staff drawn in the key the card names (`04-card-3-answered.png`, `04-card-4-answered.png`). Stored row: `lessonId jazz.6`, accuracy 1. Back on the page: "What the app counts — 1 of 2". |
| 5 Lab, Read it and Play it to me | PASS | jazz.6's *Accompaniment lab* door opens the Jazz two-five-one preset; key set to C minor; summary "ii–V–I in C minor · walking + chord tones · 8 bars at 100"; Read it opens the written score (three flats, naturals on B and A); Play it to me runs and the app schedules piano notes. |
| 6 Read it, Keep tempo | PASS | The same Lab build played in time to a summary (accuracy 100 %); jazz.6 stays at 1 of 2. |
| 7 two more keys | PASS | A minor and G minor (the drill's other keys, which the lesson names), Lab tempo 70 (lower than the preset's 100), each Read it and played in time to a summary; jazz.6 stays at 1 of 2. |
| 8 Play the tune | PASS | Lab, C minor, Play the tune pressed, Jam it: the grid iiø7 Dø7 / V7 G7 / i Cm / i Cm twice; shells for iiø7 and V7 and the C minor triad struck bar by bar; the lab's line "Time round 1 · 24 of 24 on the bar's chord". "Nothing here is scored" is on the screen. |
| 9 Blue Bossa Keep tempo (optional) | PASS | Opened from its jazz.6 row, Keep tempo, played in time: accuracy 100 %; jazz.6 stays at 1 of 2. |
| 10 chart, Comp and Bass + drums on | PASS | Chart opened from the row. 32 cells; bars 5-7 print Dmi7b5, G7, Cmi6; bars 13-15 the same; bar 16 prints Dmi7b5 and G7 as a split cell. Both chips on, Count off: the sounding bar moved 1 to 8, the app scheduled piano (40 to 75), bass (18 to 34), kick and snare. Each of bars 1-8 was wholly on screen at its downbeat. |
| 11 chart, Comp off, Bass + drums on | **STOP** | Done as written, two things stop it. (a) Bars 10 and 26 print A♭13 and a root-3-7 shell (A♭, C, G♭) reads **no**: the cell asks for 60 % of the symbol's pitch classes and A♭13 has seven (3 of 7 = 43 %). Every other bar read yes, including bars 5-7, 13-15 and both halves of bar 16 (Dmi7b5 then G7, each yes); the bass and kick sounded with Comp off. (b) Only bars 1-8 were wholly on screen at their downbeat; bars 9-32 were not (see L2). |
| 12 chart, both off, whole chorus | **STOP** | Same two findings as step 11 (bars 10 and 26 read no; bars 9-32 off screen at their downbeat). No bass, kick, snare or hat was scheduled with Bass + drums off. |
| 13 bossa bass (optional) | **STOP** | The step is offered once A7c.3's bossa bass is on the learner's path and the lesson says to ignore the cell; jazz.6's lesson mentions neither, and no lesson in the app teaches a bossa bass. What the record asked to be read first was read: Comp on with Bass + drums off sounds (piano 75 to 79 scheduled). |
| 14 Insensatez, decide first | PASS | Opened from its jazz.6 row (`Chart` door): silent, not running, Comp and Bass + drums off, bars 13-15 print Bmi7b5, E7, Ami7, no live cell showing before playback, and the chart screen's own words name neither the progression nor the key. The lesson says it gives the answer at its very end; the walk decided on the chart before reading it. |
| 15 Insensatez, check | PASS | Comp on, Count off: the app played bars 13-15 (piano 79 to 133 at bar 13, 146 by bar 16). Comp off, Count off, the learner scrolled bars 9-16 into view during the count-in (Count off and Stop stayed on screen): Bm7♭5 [B, D, A], E7 [E, G♯, D], Am7 [A, C, G] each read yes, each cell wholly on screen. Back on the lesson, the last paragraph is the answer. |
| 16 independence, later rung | **STOP** | First half done: Insensatez whole; bar 22 prints Bmi7b5 and E7 as a split cell, bar 23 Ami7; shells struck in both read yes (bars 22-23 on screen after the learner scrolled to them); the look-alike (bars 29-31: Fma7, E7, Ami7) is printed and the app cannot reject it, it is self-checked. Second half cannot be done: "the A10.1 standard on jazz.9 once it is admitted": there is no `docs/chains/A10.1.yaml` and jazz.9 lists six songs (Take Five, Ain't Misbehavin', Lullaby of Birdland, Linus and Lucy, Stardust, When the Saints), none named as that standard. |

## Findings the walk makes that are the record's or the app's, not the walk's (nothing was fixed)

- **L1. Free play's notes line spells flats as sharps** (`D4 · F4 · G#4 · C5` for D, F, A♭, C; `D#4`, `A#4` for E♭ and
  B♭) while the chord line beside it is right and the lesson writes A♭. A learner who follows the lesson's "hold D, F,
  A♭ and C" is shown G#4. Observed in step 2; not asserted.
- **L2. On a sideways phone the chord chart shows one row of eight bars below the transport and the keys; it does not
  follow the sounding bar.** Bars 9-32 of Blue Bossa lie below the window at their downbeats (in `10-chart.png` the
  second row of cells is cut off at the bottom edge of the window). The learner can scroll during a count-in (as
  steps 15 and 16 do) but not while both hands are on the keys, so the whole-chorus steps (11, 12) cannot be done from
  the chart as the record writes them. The walk records it as a STOP; the owner may rule that it is a design limit of
  the sideways phone, not a defect of the step.
- **L3. A root-3-7 shell reads no on a thirteenth chord.** Blue Bossa's bars 10 and 26 print A♭13 (seven pitch classes);
  the shell holds three. It is the cell's 60 % rule against extended symbols, and the lesson's "comp its chords in
  shells" does not say what to do at those bars. Fmi9 and E♭mi9 (five pitch classes) read yes under their shells.
- **L4. The Keep tempo runs of steps 6, 7 and 9 were played at 70 %** of the written (or suggested) tempo, the
  speed the screen opened at, and their summaries say a pass needs 80-85 %; these Lab and Blue Bossa runs count for no
  rung, so it changes nothing here.
- The walk's `Back` after a Keep tempo summary lands on the Library, not the lesson (the lesson was reopened by
  address, as A7c.1's walk does); recorded in step 7's observations.

## Pictures

One or more per step, named by step: `route.png`, `01.png`, `02-half-diminished.png`, `02-minor-seventh.png`,
`02-shell.png`, `03-card.png`, `03-summary.png`, `04-card-3-answered.png`, `04-card-4-answered.png`, `04-summary.png`,
`04-counts.png`, `05-lab.png`, `05-listen.png`, `06.png`, `07-a-minor.png`, `07-g-minor.png`, `08-jam.png`,
`08-verdict.png`, `09.png`, `10-chart.png`, `10-bar-6.png`, `11-end.png`, `12-end.png`, `13-comp-only.png`, `14.png`,
`15-shells.png`, `15-answer.png`, `16.png`; a `-stop.png` beside a STOP step is the screen at the point it was recorded.
