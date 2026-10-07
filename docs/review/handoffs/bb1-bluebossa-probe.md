# Reviewer handoff — BB1 landed: the Blue Bossa probe, stopped at placement; three seams to rank and one placement to decide

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** A7c.1 (Bizet, latin.4) is `reviewed`; the owner's phone walk is its only gate. A7b.1 stays `draft`.

The commit carrying this handoff. Respond in `responses/bb1-bluebossa-probe.md`. Response required before the G6 build and the placement: both are design decisions (FABLE §10). Nothing heard.

## 1. What to read

- `docs/pending-review.md` Entry 266: the probe's findings by station, with tool, command and evidence for each.
- `docs/prompts/runs/curriculum-review-2026-10-05/intake/QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.md`: the intake gates and the harmony claim checks, two readers, bound to the raw and committed hashes (your ruling's §3).
- `docs/chains/A7b.1.yaml`: its refs all resolve now (`0 unresolved`); the header records the corrections and the wrong premises; four steps corrected (§2 below).
- `docs/prompts/runs/BB1/`: Station 4's evidence, the chart cases A-D (`chart-backing.json`) and the app-side facts (`app-facts.json`), with the probes that wrote them.
- `content/sources/pdmx.json`: one row added by text splice, `song.jazz.kenny-dorham-blue-bossa.pdmx`, personal library only, on no rung.

## 2. Record changes, itemised

| Where | Before | After | Why |
| --- | --- | --- | --- |
| Header, harmony | one reader's facts, "a claim until Station 2" | verified by two readers; bar 16's G7 is plain; Insensatez 29-31 is ♭VI-V-i | Station 2 |
| Header, premises | absent | the chart keeps a bar's first symbol; the chart prints kind text; Free play names no three-note shell; the Read it page has no chord symbols | Station 4 |
| Step 2 | builds the three shells and reads the app's name for each | builds the four-note iiø7 and iim7, reads their names, then lifts the fifth to the shell, which the app does not name | the namer names none of D-F-C, G-B-F, C-E♭-B♭ and calls C-E♭-A "A diminished / C"; the old feedback line was false |
| Steps 6 and 7 | scaffold includes chord symbols | chord symbols removed at step 6 | the Score page that Read it writes prints no chord symbols; the labels are only on the Lab grid |
| `repairedTempoLineage.test.ts` | every tempo-defaulted PDMX row has an E59 repair relation | every defaulted row the former-identities table records has one; a defaulted row with no former identity has none | Blue Bossa is defaulted and new; it is the only one of the 170 defaulted rows with no former identity |
| Step 8 | comps the ii-V-I in shells | shells for iiø7 and V7; the tonic as the Lab writes it, a C minor triad | the Lab's i is a triad, so a B♭ or A over it counts as no chord tone in the step's own feedback |

## 3. Asked

1. **The chart's backing seam.** Your ruling's §4 decided it: backing and comp switch independently, in `ChordChartScreen.ts` only, red first on the probe's case B (Bass + drums on, Comp off schedules nothing today). Entry 266 drafts the files and the cases. I read it as a narrow seam under FABLE §10 and am dispatching it now, landing before its artefact review. Object if any of the six conditions fails.
2. **G6, the minor control.** Your ruling fixed its shape: three minor keys, nine cases all asked, a minor-sixth tonic (C minor, Cm6) and a minor-seventh tonic (A minor, Am7), labels naming the symbol, CK-6 against music21. Entry 266 confirms the defect in all five minor keys tested and gives the inputs. The brief comes to you before dispatch, because it changes what a drill teaches. Say now if any input is wrong: the third key's tonic (I propose an m7 key on the flat side, G minor with Gm7, as the case that must also hold), or the fifth's treatment (I propose the lesson's sentence, not a dedicated card).
3. **One chord per bar.** The chart keeps only a bar's first symbol (`score/harmony.ts` `chartBars`, used by the Chord chart for every chart item). Blue Bossa's bar-16 G7 and Insensatez's bar-22 E7 never show, never sound, and a correct shell there scores no. That is app-wide, so it is app work under FABLE §10, and it is a design decision. The shape I propose: each bar holds its symbols with their beats; the grid splits a two-chord bar; the comp plays each at its beat; the live cell judges against the chord sounding when the note is struck. Rule on the shape, or say which A7b.1 steps should avoid split bars instead. Steps 10 and 16 depend on it.
4. **Placement.** Options in Entry 266: jazz.5, jazz.6, or a new unit. I recommend jazz.6: the ability map's A7b.1 block comps the tune "with the jazz.6 rhythms" and completes on CT-3, "jazz.6's exercise runs", and jazz.5 stays its prerequisite. Placement waits for G6, because a counted run today would teach C-E-B as the C minor tonic. Rule on the rung, or name the fact that decides it.

Not asked: Free play's shell naming is a readout gap one chain meets; step 2 now avoids it, and it stays recorded.
