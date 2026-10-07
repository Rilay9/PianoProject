# A7c.1: the phone walk of latin.4, automated (2026-10-06)

The owner's walk (`phone-walk.md`, read with `steps.md` and the gate `docs/review/responses/a7c1-shipped.md` §3),
driven by Playwright on an emulated phone instead of by hand. Every row of the walk, in order, in one browser
context, so the walk's state carries from row to row as it does for a learner. Nothing was heard.

## The run

- **Head:** `c6c4ab6a` (origin's head, in the worktree `wt-phone-walk`).
  Content built at that head (`tools/content/build.py --offline`, exit 0) and the app built from it
  (`npm run build:app`, exit 0), so latin.4's lesson, the G13 items and the loop fix (LB1) are the ones walked.
- **Spec:** `app/tests/e2e/a7c1-phone-walk.spec.ts`. Machine-readable record of the same run:
  `phone-walk-playwright/results.json`.
- **Viewport and emulation:** 390 × 844 portrait, `isMobile: true`, `hasTouch: true`, device scale factor 3, an
  Android Chrome user agent; Chromium (Playwright 1.63). Taps are touch taps (`locator.tap`); each double-tap is two
  touch taps on one point of the bar (`page.touchscreen.tap` twice); every double-tap in the run reached the
  screen's double-tap as two touch taps (no fallback was used).
- **Input:** the MIDI mock (`fixtures/midiMock.ts`, permission granted). Keep tempo and Rhythm only runs are played
  in time by `fixtures/playInTime.ts`; Wait for me runs strike one step at a time through the same mock.
- **Command** (from `app/`, ports 4173, 5173 and 4291 checked free first; the only Playwright run on the machine):

  ```
  npx playwright test --config build/phone-walk/playwright.config.ts --workers=1
  ```

  The config copy (deleted after the run, per `operating-procedure.md` §14) was the repository config with three
  changes: its own port (4291, serving the built `dist` with `vite preview`), one worker, and only this spec.
  Result: 1 test passed; 24 of 24 rows PASS, 0 STOP.

## The walk

The 20 rows of `phone-walk.md` are split where a row names more than one piece (6 and 7; 8, 9 and 10), which also
gives the record's 24 actions their own lines. "What the app counts" is the summary line of the lesson page's
counted list, read on the lesson page before and after each step.

| Step | Did | Expected | Observed | Verdict | Screenshot |
| --- | --- | --- | --- | --- | --- |
| route | Plan → tracks sheet → Latin on → Stage 4 → the rung's row | 7 exercise rows, 4 song rows | Stage 4 lists the rung; its page shows 7 exercise and 4 song rows | PASS | `phone-walk-playwright/route.png` |
| 1 | Read the grid | the two counting lines, habanera and tresillo | code lines `count 1 e & a 2 e & a`, `habanera X . . X X . X .`, `tresillo X . . X . . X .`; counts 0 of 2 | PASS | `phone-walk-playwright/01.png` |
| 2 | *Tresillo bass in C — three, three, two* ▶ → *Hear it* | plays; nothing counted | `data-hearing` true; the app scheduled piano notes; the counter showed bars 1–8 and the demonstration ended on its own; "1 . . 2 . . 3 ." drawn with the music; counts 0 of 2 → 0 of 2 | PASS | `phone-walk-playwright/02.png` |
| 3 | the Bizet left-hand cut ▶ → *Hear it* | the bass alone, twelve bars | hearing; notes scheduled; counter bars 1–12; every note drawn while it played is the left hand's | PASS | `phone-walk-playwright/03.png` |
| 4 | the 4/4 tresillo in C ▶ → *Keep tempo*, *L* → ⋯ *Rhythm only* on → ▶, tapped | hits and early/late in the summary; not counted | Rhythm only Off → On; summary *Rhythm run*, "Judged Rhythm only — the notes were not, so this does not count as playing the piece", Wrong notes 0, Missed 0, timing with "% of them early"; counts 0 of 2 → 0 of 2 | PASS | `phone-walk-playwright/04.png` |
| 5 | the Bizet cut ▶ → *Keep tempo*, *L*, *Rhythm only* still on → ▶ | same | Rhythm only read On on opening (not touched); summary *Rhythm run* with hits and early %; counts unchanged | PASS | `phone-walk-playwright/05.png` |
| 6 | *Tresillo bass in C, in 2/4* ▶, *Keep tempo*, *L*, *Rhythm only* on, ▶ | "1 . . a . . & ." printed with the music | drawn text "Count: 1 . . a . . & ."; Rhythm only already On; rhythm run to its summary; counts unchanged | PASS | `phone-walk-playwright/06.png` |
| 7 | *Habanera bass in C, in 2/4* ▶, same settings, ▶ | "1 . . a 2 . & ." printed with the music | drawn text "Count: 1 . . a 2 . & ."; rhythm run to its summary; counts unchanged | PASS | `phone-walk-playwright/07.png` |
| 7a | the habanera in C ▶ → *Rhythm only* off → *Keep tempo*, *L*, ⋯ *Duet* on → ▶, played | plays; does not count | The piece opened in *Wait for me*, where ⋯ has no *Rhythm only* row, so *Keep tempo* was chosen first and then Rhythm only On → Off (see the note below); Duet already On, its row "the app plays the right hand"; the app scheduled piano notes during the run (the chord); summary *Run finished* at 70 %; counts 0 of 2 → 0 of 2 | PASS (order swapped) | `phone-walk-playwright/07a.png` |
| 7b | the habanera in F, then in G ▶ → *Keep tempo* → ▶ | one flat, one sharp; not counted | key signature read from its glyph's ink: F one glyph, flat-shaped; G one glyph, sharp-shaped; both run to *Run finished*; counts unchanged | PASS | `phone-walk-playwright/07b-f.png`, `phone-walk-playwright/07b-g.png` |
| 7c | *Tresillo bass in C, in 2/4* ▶ → *Keep tempo*, *L*, Rhythm only off, slider 90 % → ▶, all eight bars, no loop | counted: 1 of 2 | opened with `?from=latin.4`; slider 70 % → 90 % (54 bpm); counter bars 1–8; summary *Passed*, Tempo 90 % of written; counts **0 of 2 → 1 of 2**, the tresillo line "(counted: Tresillo bass in C, in 2/4)", the Bizet line "(not yet)" | PASS | `phone-walk-playwright/07c.png`, `phone-walk-playwright/07c-lesson.png` |
| 8 | the 4/4 tresillo in C ▶ → *Keep tempo*, *L* → ▶ | plays; not counted | *Run finished* at 70 %; counts 1 of 2 → 1 of 2 | PASS | `phone-walk-playwright/08.png` |
| 9 | the 4/4 tresillo in F, same | plays; not counted | same | PASS | `phone-walk-playwright/09.png` |
| 10 | the 4/4 tresillo in G, same | plays; not counted | same | PASS | `phone-walk-playwright/10.png` |
| 11 | the whole aria ▶ → loop bars 1–12 → *Hear it* | the bass alone for three bars, the tune enters in bar 4 | bar 1 double-tapped at rest ("Loop start: bar 1"); played in Wait for me to bar 12 and paused, the start stayed marked; bar 12 double-tapped → loop "Bars 1–12"; Hear it played bars 1–12 and came round to 1; notes drawn: bars 1–3 left hand only, bar 4 left and right | PASS | `phone-walk-playwright/11-loop.png`, `phone-walk-playwright/11.png` |
| 12 | the Bizet cut ▶ → *Wait for me* → ▶ | the page waits for each right key | for four steps: no move in 2 s with no key, no move on a wrong key, a move on the right key; the rest played to *Notes ready*, "Tempo Not judged in Wait for me"; counts 1 of 2 → 1 of 2 | PASS | `phone-walk-playwright/12.png` |
| 13 | the Bizet cut ▶ → *Keep tempo*, *L*, Rhythm only off, slider 90 % → ▶, all twelve bars, no loop | counted: 2 of 2; latin.4 complete on Plan | opened with `?from=latin.4`; no loop; counter bars 1–12; *Passed*, 90 %; counts **1 of 2 → 2 of 2**; Plan's Stage 4 row wears the badge "complete" | PASS | `phone-walk-playwright/13.png`, `phone-walk-playwright/13-lesson.png`, `phone-walk-playwright/13-plan.png` |
| 14 | the whole aria ▶ → *L*, ⋯ *Duet* on → loop 1–12 → *Keep tempo* → ▶, the bass played | the app plays the right hand; your bass under it; not counted | Duet On, "the app plays the right hand"; loop 1–12 set by double-taps as at step 11 and kept when *Keep tempo* was chosen; the bass played in time for a lap and more (counter 1–12 then 1–3), the app scheduling its own notes throughout; counts stay 2 of 2 (already met, so this cannot show "not counted") | PASS | `phone-walk-playwright/14-set.png`, `phone-walk-playwright/14.png` |
| 15 | *The Crave* ▶ → loop bars 21–26 → *Hear it* | three, three, two in the left hand | played in Wait for me to bar 21, paused, double-tapped; on to 26, paused, double-tapped → "Bars 21–26"; Hear it played 21–26 and came round to 21. The left hand's three, three, two is a reading of the music and is not asserted (but see step 16) | PASS | `phone-walk-playwright/15-loop.png`, `phone-walk-playwright/15.png` |
| 16 | *The Crave* ▶ → loop 21–22 → *Keep tempo*, *L*, *Rhythm only* on → ▶, tapped | three taps a bar; not counted | loop "Bars 21–22" by double-taps; the run asked the left hand for three steps in bar 21 and three in bar 22 (chords of 3, 3 and 2 notes); the counter stayed in 21–22 over two laps; counts unchanged | PASS | `phone-walk-playwright/16-set.png`, `phone-walk-playwright/16.png` |
| 17 | *Por Una Cabeza* ▶, nothing pressed | the page does not say until its end | the answer is paragraph 31 of 31 on the lesson page; no earlier paragraph names its cell; the Score screen's text names neither cell; counter "bar 0 / 65" | PASS | `phone-walk-playwright/17.png` |
| 18 | loop bars 1–14 → *Hear it* | plays | bar 1 (after the pickup, bar 0) double-tapped at rest; played in Wait for me to 14, paused, double-tapped → "Bars 1–14"; Hear it played 1–14 and came round to 1 | PASS | `phone-walk-playwright/18-loop.png`, `phone-walk-playwright/18.png` |
| 19 | loop still on → *Keep tempo*, *L*, *Rhythm only* on → ▶, tapped; then the lesson's end | the reveal is the last paragraph | loop still 1–14; tapped in time for a lap and more (counter 1–14 then 1–2); the lesson's last paragraph begins "The answer for Por Una Cabeza." | PASS | `phone-walk-playwright/19.png`, `phone-walk-playwright/19-lesson.png` |
| 20 | Plan → Stage 6 → latin.6; Stage 7 → latin.7; each piece's row ▶ | latin.6 opens with "Before you play, name each left hand yourself", latin.7 with "Before you play El Choclo…"; each row opens its piece | latin.6: paragraph 2 of 10 (the first after the opening) begins with the task line; the rows of *Por Una Cabeza*, *The Crave* and *La Cumparsita* (Parte B) each opened its Score screen with `?from=latin.6`. latin.7: paragraph 2 of 10 begins "Before you play El Choclo"; its row opened El Choclo with `?from=latin.7` | PASS | `phone-walk-playwright/20-latin6.png`, `phone-walk-playwright/20-latin7.png` |

**Step 7a's order.** `phone-walk.md` writes this row as ▶ → *Rhythm only* off → *Keep tempo*. The drill opened
from its row in *Wait for me* (step 7 had chosen Keep tempo on the same drill; the choice was not kept; the
opening mode of the other steps' pieces was not recorded, since each step chose its mode), and in Wait for me ⋯
has no *Rhythm only* row, so the row's literal order cannot be followed: Keep tempo has to come first. The lesson's own step 7a reads differently ("Open ⋯ and switch *Rhythm only* off. Open
*Habanera bass in C, in 2/4* in *Keep tempo*…"), which a learner can follow from the step-7 screen, where Keep
tempo is still on. Recorded as PASS with the order swapped; whether the walk row's wording matters is the
owner's call, not this run's.

## Also looked at

- **Plan after step 13:** latin.4's row reads "The habanera bass, and the tresillo beside it · 7 exercises · 4
  songs · ~14 days" and wears one badge, "✓ complete" (`13-plan.png`). Entry 252 records
  that wording on a self-checked ability as app work.
- **Today after step 7c and after step 13:** neither counted item was offered. Both times Today showed Stage 0
  ("Working on Stage 0 · Your instrument and your body"): *Finger-number tap drill* and *Posture and hand-shape
  checklist* (`today-after-07c.png`, `today-after-13.png`; the card's slots are in `results.json`). This profile
  started empty, was never placed, and reached latin.4 only through Plan, so Today here says what an unplaced
  learner sees, not what the owner's phone, with its own history, will offer.

## What this walk is not

- It is emulated Chromium on this machine, not the owner's physical phone and not the deployed Pages build: the
  app was built from `c6c4ab6a` and served locally. Touch, the native mode picker and the slider were driven by
  Playwright (the mode by `selectOption`, the speed by setting the slider's value in its sheet), not by a finger.
- Nothing was heard. A *Hear it* step is evidence that the demonstration ran over the stated bars and that the
  app scheduled piano notes, not that the music sounds right; whether *The Crave*'s bars 21–26 sound like three,
  three, two, and whether the habanera has its lilt, no one in this process can decide.
- The playing is the MIDI mock striking exactly the notes each step asks for, a few milliseconds after the beat.
  It shows that each run can be played and counted as the lesson says, not that a person can play it. Rhythm only
  runs struck the written keys, and the written chords as chords, rather than one tap on any key.
- The profile was fresh, with the setup tour and the explain-once cards marked seen (the suite's usual storage
  state), so the cards a first-time learner meets on each mode were not shown.
- The return to the lesson page after each step was *Done* on the summary, then *← Back*; the trips to Plan and
  Today were by address, not the tab bar.
