# Probe: A7b.1's first lane, Blue Bossa through the intake gate and the minor ii-V-i facts its chain relies on

ability: A7b.1
chain record: `docs/chains/A7b.1.yaml` (the contract; `draft`. The builder keeps its header and refs current as files land, as LP1 did, and changes no step.)

Build contract, drafted 2026-10-06 at HEAD 5783f22d. The worktree is cut from origin's head at dispatch; the orchestrator writes that sha here before dispatch (operating-procedure §14). Harness: operating-procedure §14, cited and not restated; what this lane adds is at the end. Report: operating-procedure §11 and §12, plus `../INTAKE-GATE.md` section (e). Shaped like `probe-latin4-bizet.md` and shorter: `docs/chains/skeletons/latin-cluster.md` §8 lists what that first slice did that this one does not repeat (below).

---

## Decision rationale (operating-procedure §10b)

- **Learner problem.** The learner cannot voice the minor ii-V-i (iiø7, V7, i) in shells, does not know a root-3-7 shell hides the half-diminished chord's flat fifth, and cannot find the progression in a tune. No jazz lesson teaches it; jazz.5's shell drill is major only and cannot express a minor key (ABILITY-MAP A7b.1, Evidence; GENERATOR-ADDENDUM G6). Its MODEL and MUSIC stations are SOURCE-NEEDED: no admitted score prints the progression.
- **Solution classes considered.**
  1. *Insensatez* (shipped, `song.folk.insensatez-how-insensitive-jobim.pdmx`) as the MODEL. Its bars 13-15 print Bm7♭5, E7 (added ♭9), Am7 by the writer's one-reader read. Not taken as the MODEL: it is already the record's unseen transfer and independence material, and a learner who studied it as the model could no longer meet it unseen.
  2. The Lab's own written ii-V-I in a minor key as the model. Not taken: it is a control, not a tune; the record uses it for keys and time (FABLE §4: real repertoire for transfer).
  3. *Fly Me to the Moon* (shipped). Rejected by the map: the shipped file prints a tritone-substituted setting.
  4. G6 first, the source later. Not taken: the two are independent. The G6 brief needs facts this lane gathers (the key and tonic quality Blue Bossa prints, what the drill outputs today).
  5. **Blue Bossa (Kenny Dorham), the quarry's lead sheet `QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6`, through the intake gate.** Chosen.
- **Why the chosen class.** The reviewer names Blue Bossa with the G6 control as the first post-Bizet ability (`docs/review/responses/a3a8771d.md`). Its 32 bars print the C minor progression four times plus a half-bar turnaround (the writer's read, H2). The map already makes it A7c.3's MUSIC (L7). Its sparse melody leaves room for the learner's own voicing (CANDIDATE-REVIEW, Blue Bossa).
- **What would reverse it.**
  - QmTj fails G1-G3, G5 or G8-G10, or does not read as `lead_sheet`.
  - The converted file loses `<harmony>` elements.
  - Station 2's independent readers do not confirm the progression at the record's bars.
  - The Chord chart cannot open it.
  - The reviewer rules a verified-content fact or a role boundary against it (never a musical like or dislike, FABLE §5).
- **Real problem or proxy.** Mostly a proxy for the plan: nothing learner-facing ships in this lane. It admits the score and establishes the facts the record's steps rest on. The record's steps 4 and 11-13 cannot run until G6 and the placement land.
- **Remaining uncertainty.**
  - Whether the harmony facts need a new verified-fact kind or can be held another way. The reviewer rules on the route (Station 2).
  - The tonic quality the G6 drill asks for (G6's decision, from the primary source).
  - Whether Comp sounds with Bass + drums off (the record's step 13).
  - How any of it sounds: *unverified as music*.

## Goal

- **The owner's words (as recorded).** Generated and found content, correct, accurate and teaching (ORCHESTRATION-CONTRACT, 2026-10-06). Repeat the proven path one ability per builder; Blue Bossa first (FABLE §2 step 5). Every repertoire row stays CANDIDATE until the intake gate has run. Copyright and public export are out of scope (2026-10-05).
- **The writer's words.** Admit Blue Bossa through the gate as a first admission, using the BZ1 scripts, not by hand. Establish, with independent readers, which bars print the minor ii-V-i in Blue Bossa and in Insensatez, on each file's current identity. Read and run the code to report what G6's drill, the Lab and the Chord chart do today for this chain. Stop at placement, as the Bizet probe stopped, with a draft of what placement needs.

## Status labels

VERIFIED (the writer observed it on 2026-10-06; the builder re-checks), HYPOTHESIS (with its refuting test), OPEN, SETTLED, OUT OF SCOPE: as in `probe-latin4-bizet.md`.

## What the first slice settled, and this lane does not repeat (skeleton §8)

- **Scripts, not a walk.** BZ1's scripts are under the main checkout's `build/probe/`, gitignored: `scan.py`, `dump.py`, `roundtrip_compare.py`, `tempo_peek.py`, `g15.py`, `cellcheck.py`. Copy what you use into the worktree's `build/` and extend it there. No manual station walk, no phone or tablet walk, no pictures: nothing is placed.
- **No cut.** The chart steps use the whole lead sheet with bars named in a lesson, so G15 is NOT RUN. Cuts are machine-independent already (CUT1).
- **Existing mechanisms.** The cells mechanism (CD1) and the generated-id manifest (E259) exist; do not rebuild them. A chord progression is not an onset cell, so CD1's route does not cover it (Station 2).
- **The CID route.** VERIFIED: QmTj is in neither `build/pdmx/candidates.json` nor `build/pdmx/index/index.json` (count 0 in each). `extract.py --cid` looks a CID up only in those two files (`named_candidates`, `extract.py:175-200`), and `quarry.py` reads only `--candidates` (`:565-590`). Use BZ1's workaround, a one-row candidates file under the worktree's `build/`, and record it BY HAND, as the second item that needed it.

## Hypotheses the builder inherits, with the tests that would refute them

- **H1.** QmTj passes G1-G3, G5 and G8-G10, and G6 reads `lead_sheet`.
  - VERIFIED, from the quarry summary `docs/review/pdmx-quarry-2026-10-05/summary/B-jazz/blue-bossa-QmTjG….txt`: LEADSHEET, one part "Piano" (program 0), one staff, 4/4, three flats, 32 bars, 24 symbols, the melody only (bars 29-30 print two-note dyads).
  - *Refuted if* any gate fails on the raw archive member, or `analyse` reads another shape.
- **H2.** The two charts print these chords, by the writer's raw `<harmony>` walk:
  - Blue Bossa, the quarry dump: Dm7♭5 (kind `half-diminished`) | G7 (kind `dominant`, degree 5 altered +1, added 9 altered +1) | Cm6 (kind `minor-sixth`) at bars 5-7, 13-15, 21-23 and 29-31 (bar 31's Cm6 adds a 9); Dm7♭5 then G7 at beat 3 of bar 16, into Cm6 at 17; E♭m9 | A♭13 | D♭maj7 at bars 9-11 and 25-27 (a major ii-V-I in D♭).
  - Insensatez, its committed `.mxl`: Bm7♭5 | E7 (added 9 altered -1) | Am7 at bars 13-15; Bm7♭5 then E7 (added ♭9) in bar 22, into Am7 at 23; Fmaj7 | E7 (added ♭9) | Am7 at 29-31, which is not a ii-V-i. Bar 13 also carries a harmony rooted on C with kind `none` before the Bm7♭5.
  - *Refuted if* a second, independent reader disagrees on root, kind or degrees in any of those bars, or the converted file drops one.
- **H3.** The Lab's minor ii-V-I already gives iiø7, V7 and i correctly in every minor key, and its tonic is a triad.
  - VERIFIED in part:
    - `romanToChord` takes quality from case and suffix and roots from the major scale (`theory.ts:305-332`); degrees 2 and 5 sit on the same pitches in major and minor;
    - the Lab's minor row is `['iiø7', 'V7', 'i', 'i']` (`sightReading.ts:2252`);
    - `accompanimentLab.test.ts:97` asserts iiø7 in A minor reads B, D, F, A.
  - HYPOTHESIS: Read it writes whole chords stacked from the floor (`voiceChord`, `sightReading.ts` near `:2745`), not shells.
  - *Refuted if* `romanToLabChord` over the nine minor keys differs from music21's `RomanNumeral` sets anywhere.
- **H4.** The chart reads the symbols as follows (`score/harmony.ts`, which reads `<degree>`):
  - Dm7♭5 is {D, F, A♭, C}; G7 with ♯5 and ♯9 is five classes, {G, B, D♯, F, A♯}; Cm6 is {C, E♭, G, A}.
  - So a three-note shell meets the 0.6 cell (3/4 and 3/5).
  - A C-E♭-B♭ shell on Cm6 does not (2/4), and a root-fifth bass does not (R41).
  - *Refuted by* `harmony.ts`'s own reading and `chordMatch` (`:180`), run.
- **H5.** Today the shell drill gives D-F-C for iiø7 and G-B-F for V7 in C, both right, and C-E-B for a minor `i`, a major-seventh shell (G6). Its catalogue row has keys C, F, B♭ and G and reads no mode parameter (`fromCatalog.ts:296-335`).
  - *Refuted if* running `shellChord` gives anything else, or a minor form already exists.

## The teaching design (from the record; ORCHESTRATION-CONTRACT §1, §8)

The record is the contract; this section restates it for the reviewer. "Recorded" is MODE-SHEET's, by section. The record's steps 4 and 11-13 cannot be played until G6 and the placement land.

### Instructional chain

| # | Learner action | Content | Tool | Scaffold | Feedback | Recorded (MODE-SHEET) | Next support removed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Reads the minor ii-V-i, the shell, the hidden ♭5, Blue Bossa's m6 tonic | lesson (home: placement seam) | lesson | definition, notation, symbols, key, numerals | none | nothing (§31) | the definition, replaced by the learner's hands |
| 2 | Builds the C minor shells and the four-note iiø7; reads the app's name | lesson | Free play, standalone | + held chord named | the name, a readout | nothing (§5) | notation, symbols, names: sound only |
| 3 | Hears a seventh chord, names its quality aloud, plays it back | `drill.ear.seventh-qualities` | Ear drills | app plays it, free replays | right or wrong per card | a drill row (§19); the name unstored | the app's sound |
| 4 | Plays iiø7, V7, i shells on demand, C minor first, then the drill's other minor keys: **the counted run** | `drill.jazz.ii-v-i-shells`, minor form (G6, not built) | Reading and theory drills | numerals, key | right or wrong; Show me costs the card | a drill row; counts when opened from the rung and named by `items` (§25, R3-R4; R28) | the named chord: the whole progression in time |
| 5 | Builds the ii-V-I in C minor with Read it; hears it | the Lab | Hear it | app plays it, notation, cursor, fixed key | own listening | no row (§3) | the app's sound |
| 6 | Plays it in Keep tempo | the Lab | Read it | notation, cursor, click, count-in, fixed key | accuracy, timing (§2) | an import's row that no rung counts (§7a) | the fixed key |
| 7 | The same in two more minor keys | the Lab | Read it | as 6 | as 6 | as 6 | notation and cursor |
| 8 | Comps the shells under the Lab's tune, bass and drums running | the Lab | Play the tune | symbols, chord tones lit, bed, app's tune | a chord-tone count per round, dropped | nothing (§7b) | lit tones, the app's tune |
| 9 | Optional: plays Blue Bossa's melody | Blue Bossa | Keep tempo | notation, cursor, click | accuracy, timing | a row nothing counts (§2) | notation |
| 10 | Listens to the app play Blue Bossa's changes; bars 5-7 and 13-15 named | Blue Bossa | Chord chart | symbols, app comps, bed, bars and progression named | own listening | nothing (§15) | the app's comping |
| 11 | Comps the chart in shells, the app's bass running | Blue Bossa | Chord chart | symbols, bed, bars named | the live cell, ≥ 0.6, unstored | nothing (§15) | the bed and the named bars |
| 12 | Comps the whole chorus, no bed, nothing named | Blue Bossa | Chord chart | symbols, count-in | the live cell | nothing | — (step 13 swaps jobs) |
| 13 | Optional, once A7c.3's bass is taught: LH bossa bass under the app's comp; the cell ignored | Blue Bossa | Chord chart | symbols, app comps | the cell reads no; own listening | nothing | the app's comping |
| 14 | Decides which progression Insensatez bars 13-15 print, and the key, before hearing | Insensatez 13-15 | lesson | symbols, bars named | none until the reveal | nothing (§31) | — (the check follows) |
| 15 | Checks with Comp on, voices it in A minor, reads the reveal | Insensatez 13-15 | Chord chart | + app comps, reveal | reveal, cell | nothing | bars, reveal, the app's sound |
| 16 | On a later rung, finds and voices every minor ii-V-i unprompted, rejecting a look-alike | Insensatez whole, then A10.1's standard | Chord chart | symbols | the cell only | nothing | final |

Experience per step (FABLE §4), the record's answers; Station 5 confirms or overturns them from Station 4's facts:
- Rhythm only drops: rhythm is not the new demand for shells (OC §2).
- Simon is not used: it echoes pitch chains (MS §6), and the target is chord structure.
- Duet does not apply to a one-staff lead sheet (MS §13).
- Hold the chords is A7b.2's job (a line over the changes).
- The Lab carries keys because the chart has no transpose (MS §15).
- The chart carries the MODEL because Blue Bossa prints symbols only.

### Failure route

| Failure | Smallest useful change in teaching strategy |
| --- | --- |
| Drill marks the tonic or dominant wrong (major third on i, minor third on V7) | Back to the definitions; build the C minor shells in Free play and read each name; the drill in C minor alone first |
| Plays D-F-A-C for the four-note iiø7, or cannot say what the shell leaves out | Free play on D-F-A-C against D-F-A♭-C; the ear drill's m7 and half-diminished cards back to back, naming before each echo |
| Plays a minor-seventh shell where Blue Bossa prints Cm6 | Back to the symbol and the sixth-chord line; build C-E♭-A in Free play; bars 5-7 of the chart again with the bed on |
| The progression breaks in a new minor key in the Lab | C minor in Read it once, then the new key slower, with Hear it first |
| Shells land late on the chart | A lower chart tempo; back to Play the tune with tones lit; then the chart with the bed before the chorus without it |
| Cannot find the progression in Insensatez | Blue Bossa bars 5-7 with Comp on; the lesson's line on the chord a fifth above the dominant's root; Insensatez 13-15 again |
| Optional bass collapses under the comp | A7c.3's control (Rhythm only, then Keep tempo); the chart slower, the cell ignored |
| Cannot hear the progression | No tool checks hearing: the chart with Comp on and named bars, the ear drill's half-diminished cards; self-checked, *unverified as music* |

### Independence test

Without the original scaffold, the learner looks at a chart no lesson has explained, finds its minor ii-V-i and says its key, rejects what only looks like one, and voices each in shells from the symbols in a key not practised. The material is Insensatez whole on a later rung (bars 22-23 never named; 29-31 the look-alike), then the A10.1 standard on jazz.9 once admitted.

- **What the app can observe:** the chart's live cell, unstored, which can say yes to a three-of-four-note shell.
- **What it cannot:** the identification, the voicing choice, hearing the progression. These are **self-checked**, in those words.
- **Completion (CT-3).** The one counted item is a run of the minor shell drill, named by the requirement's `items` (R28). No Lab row, chart cell, Free play name, ear-drill row or Blue Bossa run ever counts. "Blue Bossa contains the ii-V-i" is never completion (OC §8).

## Generated content

The lane builds none of these. It newly relies on all three and reads their state (Station 3, Station 4).

**`drill.jazz.ii-v-i-shells`, minor form (G6).**
- **Job:** CONTROL, a drill.
- **Demand isolated:** producing the three shells of the minor ii-V-i from numerals in a named key, with no rhythm and no reading.
- **Fixed and varied:** fixed, root-3-7 shells (the tonic's quality as G6 chooses) in figure order. Varied, the key, over two or three minor keys, C minor first, and the card order by seed.
- **Properties required:** pitch-class sets equal to music21's per figure and key; the ♭5 limitation stated, or the fifth added. No musical property: a mechanical drill (FABLE §4).
- **Verifiers:** music21 `roman.RomanNumeral(fig, key.Key(t))` as the oracle (CK-6). Tonal's `Key.minorKey` is the addendum's experiment for a second witness (§7). The drill's own `expected` is the thing tested, never the witness.
- **Adversarial and boundary cases:**
  - the minor `i` as C-E-B, today's output, must go red;
  - V7 with a minor third (natural-minor v) must go red;
  - the iiø7 and iim7 shells are identical, and the contract says so;
  - a flat-side key: pitch classes, so spelling is no defence.
- **Review denominator:** three figures in every key the drill lists, and a fixture over all twelve minor tonics, so a key added later is covered.
- **Transfer out of generation:** the Lab in several keys, then Blue Bossa's chart.

**`drill.ear.seventh-qualities`.**
- **Job:** CONTROL, a drill.
- **Demand isolated:** echoing a heard seventh chord, the quality named aloud first (self-checked).
- **Fixed and varied:** fixed, four qualities (maj7, 7, m7, m7♭5). Varied, the root and quality by seed.
- **Properties required:** none beyond the set echo (MS §19).
- **Verifier:** `drillFromCatalog.test.ts:227`.
- **Boundary case:** m7 against m7♭5, one semitone apart.
- **Review denominator:** the four qualities.
- **Transfer out of generation:** hearing the progression on Blue Bossa's chart.

**The Lab's progression exercise and tune (`app/src/engine/sightReading.ts`).**
- **Job:** CONTROL, a drill, for Read it. The tune under Play the tune is context and claims nothing.
- **Demand isolated:** the progression in time, in a key.
- **Fixed and varied:** fixed, the numerals iiø7, V7, i, i, the left-hand pattern and the bar count. Varied, the key (nine minors) and the tempo.
- **Properties required:** pitch classes equal to music21's per key (H3). The tune's melodic quality is UNKNOWN.
- **Verifiers:** `accompanimentLab.test.ts:97`, plus Station 4's script against music21.
- **Boundary and adversarial cases:**
  - the Lab's triad tonic against Blue Bossa's Cm6, a real difference the lesson names;
  - W12's ii-V-i numeral mismatch, which Station 4 locates.
- **Review denominator:** three figures in each of the nine minor keys.
- **Transfer out of generation:** Blue Bossa's chart.

---

## Stations, in order

Each station has an acceptance line and a stop line. A stop means: do not go on to the next station; report what was found.

### Station 1: Blue Bossa through the intake gate, a first admission

**VERIFIED (writer):** QmTj is not in `content/sources/pdmx.json` or `content/catalog.static.json`, by a search for "blue bossa" and the CID. The quarry review says ADMIT as a jazz substrate candidate (`docs/review/pdmx-quarry-2026-10-05/CANDIDATE-REVIEW.md`, "B-jazz — Blue Bossa").

Editions known:

| Edition | What it is | Why it is not chosen |
| --- | --- | --- |
| `QmW1LrCG2Z7BF7V4UxSt1fDX8MhTSBYmPht74JYMvT6mNm` | a guitar part, 17 measures with a pickup, 11 symbols, the first half of the form, Cm7 tonic | half the form, and not a piano part |
| `QmSEhWQs6biwJCkU8EidMCmdxd3K4bTPgUAjq9srGdofvY` | a tenor-saxophone solo transcription, 194 measures | a solo, not a chart |
| `QmT2nQ3ssYraG2nRymmL4ySRed6yE2b3JeHUgxbXrAsYsi`, "Blue Bossa - Improvisation" | in `candidates.json`, not read | not read |

**Do.**
1. Re-run the CSV scan (`scan.py`'s pattern) for "blue bossa", and list every hit with its shape.
2. Extract QmTj with the one-row candidates workaround. Hash the raw member.
3. Run `quarry.py`: G1-G3 and G8-G10. Run the render gate on the lane's port through `render_check`'s environment, as BZ1 did; both render gates are fixed to 4173.
4. Read G5 and G6 with `quarry_core.analyse` on the raw file. G4 is BY HAND from `dump.py`. G7 is the table in `INTAKE-GATE.md`. G11 is `identity` plus the notation. G12 is the editions above.
5. Admit by the Por Una Cabeza route: `commit.py` to a scratch table, then the guarded text splice into `content/sources/pdmx.json` before the closing `]`, and the converted `.mxl` into `content/scores/pdmx/`.
6. Build with `py -3.11 tools/content/build.py --offline --render --personal`. Fill G13 and G14.
7. Report what the file prints:
   - staves, and whether it has a left hand (H1: none);
   - symbols only, or voicings;
   - the key, the bars, the tempo, lyrics;
   - whether all 24 `<harmony>` elements survive conversion (count them on the raw and the converted file).
8. Settle the skeleton's unverified items for Blue Bossa (§9): "its harmony is unread" is closed by Station 2; the others are Station 4's.
9. Write `../intake/QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.md` under the template, with `Personal library admission: ADMITTED`, `Curriculum admission: CANDIDATE` and G15 NOT RUN (no cut).

**Acceptance.**
- G1-G14 each read PASS, FAIL, BY HAND or NOT RUN, with the tool, the command and the evidence.
- The item is in the built catalogue with a level and its hands.
- `py -3.11 tools/content/check_chains.py` lists no unresolved ref for A7b.1.

**Stop.**
- Any FAIL on G1-G3, G5 or G8-G10.
- A shape other than `lead_sheet`.
- The converted file loses a `<harmony>` element.
- The build refuses the item.

No fallback edition exists: QmW1 is half the form, as a guitar part. Report it; do not edit the tools or the file to pass.

### Station 2: the verified passage facts, on each file's current identity

**The facts the record relies on.**
- Blue Bossa (the committed file): the minor ii-V-i at bars 5-7, 13-15, 16-17, 21-23 and 29-31.
- Insensatez: bars 13-15 and 22-23, plus 29-31 as the look-alike that is not a ii-V-i.
- A bossa-bass passage: none expected. Confirm that the file prints no left hand. A7c.3's real model stays Garota's (map A7c.3, L6).

**The route.** No detector measures a chord progression. `passages.py`'s demand-fact route covers onset cells only (its docstring; `verified-facts.json` holds the kinds `hand` and `demand`). So:
1. Two independent readers on the raw and on the committed file, compared per bar on root, kind, degrees and pitch classes:
   - a raw `<harmony>` walk (extend `dump.py`);
   - music21 `harmony.ChordSymbol` from its own parse.
2. The roman figure from music21 in C minor (A minor for Insensatez).
3. The app's own reader (`score/harmony.ts`), run, recorded beside them as the consumer the Chord chart uses. It is not the witness.
4. Read what bar 13's `C` harmony with kind `none` is, and what the chart shows for it.
5. **Write no row.** A harmony fact in `content/sources/verified-facts.json` would be a new kind, a new schema meaning (FABLE §10: reviewed before building). Write the proposed route instead: the fields, the writer, staleness on file identity, and which readers must agree. Put it in the report, with the evidence under `build/`. The reviewer rules before anything uses it.

**Acceptance.** For every named bar, both readers agree with H2, or the disagreement is reported. The output is pasted into the intake record's `Claim checks`.

**Stop.** A reader disagrees on a bar the record names: report it, and leave the record's claim open.

**The facts' home (the reviewer's ruling, `responses/a7b1-bluebossa-design.md` section 3): the intake record's Claim checks, not `verified-facts.json`.** No `kind: harmony` row and no new fact kind. For each named passage the claim check records: the exact raw and converted/current identities (the G13 hashes); the normalised per-bar harmony facts the lesson will rely on; two independent readers agreeing on root, kind, alterations or degrees and the resulting pitch classes; the app's harmony reader beside them as the consumer, never as the witness; the negative Insensatez look-alike at bars 29-31 recorded explicitly; and the rule that placement or lesson work may cite the facts only while the file identity is the one the claim check names (a moved identity makes the check stale, re-run before the wording is reused). No code parses the intake record as a fact database.

### Station 3: the state of the G6 control

**Read** `theory.ts:292-380` (`MAJOR_DEGREES`, `romanToChord`, `shellChord`), `fromCatalog.ts:296-335`, the catalogue row, `drillParamsRead.test.ts:120-150`, and the placements:
- the drill is on chords-pop.5 and jazz.5 (`stage-5.json`);
- jazz.5 passes on any one of five exercises plus any song (R28).

**Run, do not reread.** In a throwaway script or test under the worktree's `build/`, never committed:
1. `shellChord` and `romanToChord` for i, iiø7 and V7 in C, G, D, F and A minor;
2. against music21's `RomanNumeral` sets, as a table of figure × key: the drill's output, the oracle, agree or not (H5).

**Report.**
- The record's three generated families: family, contract, witness, and what is missing. CK-6 is not written.
- The Python `ii_v_i` family's contract in `family_contracts.json`, noted as not used by the record.
- G6's inputs: Blue Bossa's Cm6, Insensatez's Am7, the Lab's triad tonic.
- The ruling's shape for G6 (`responses/a7b1-bluebossa-design.md` sections 1-2), reported against the current drill so G6's brief can be cut from the report: exactly three minor keys for this chain; the prompt population holds iiø7, V7 and the explicitly named tonic chord for every one of the three keys, and the ordinary run asks all nine key × chord cases (the drill cycles deterministically through its chord list and defaults to ten prompts: say whether three keys × three figures fits that shape today, and what a test would pin); no single universal tonic quality: the CONTROL includes at least a minor-sixth tonic (C minor, Cm6, the Blue Bossa case first) and a minor-seventh tonic in another configured key (the Insensatez case), each tonic prompt naming the actual chord symbol it expects (a bare `i` cannot distinguish root-3-6 from root-3-7); minor-major-seventh not required unless the source search finds a named learner-facing consumer; CK-6 compares the exact configured chord symbols or pitch-class sets, never a generic sourced `i`; the iiø7 limitation stays as the record states it (a root-3-7 shell cannot show the flat fifth: either a dedicated card with the fifth, or the lesson says the shell equals the m7 shell; the three-note drill never claims it measured the distinction).

Nothing is built.

**Acceptance.** The table, with every disagreement named.

**Stop.** A minor form already exists (the premise is wrong): report it, and do not go on with this station.

### Station 4: what the chain needs from the Lab and the Chord chart, read in code and run where cheap

Report each item as a fact with its file and line, or with its run output, or as an explicit not-done line.

**The Lab:**
- the nine minor keys in `LAB_KEYS`;
- `romanToLabChord` over them against music21 (H3);
- what Read it writes for these chords under each left-hand pattern (whole chords or shells), and the labels it prints;
- the Jazz preset's locks, and whether jazz.5's `jazz-comping` tool locks a major key;
- what Play the tune lights in a minor key;
- where W12's ii-V-i numeral mismatch is, and whether it touches the minor progression.

**The Chord chart** (the skeleton's §9 Blue Bossa lines):
- `harmony.ts`'s pitch classes for each kind both charts print (H4);
- `chordMatch` for the record's shells (D-F-C, G-B-F, C-E♭-A, C-E♭-B♭) and for root-fifth basses, per symbol;
- the discriminating check the reviewer named (`responses/a7b1-bluebossa-design.md` section 4), run in the browser on the lane's port: with Bass + drums on and Comp off, do bass and drums sound for each bar while the app supplies no chord comp? On the current code the expected answer is no (`ChordChartScreen.ts`: Bass + drums on forces `comping = true`, and the backing scheduler is called from `compBar()`, which `onBeat` calls only while `comping` is true, so turning Comp off silences the backing while the toggle still reads on). Record the result as an app capability gap, never as a Blue Bossa content defect, and draft the smallest follow-up seam in the report: backing scheduled whenever `backing` is on, independent of `comping`, with `comping` controlling only the app's chord voicing; a red-first browser case; the files it would own. Also whether Comp sounds with Bass + drums off (the record's step 12, now explicit: Comp off and Bass + drums off);
- the chart's default tempo for the admitted item;
- that the Chart door shows (`chordCount > 0`);
- no transpose, re-confirmed.

**Free play:** what `nameHeldChord` returns for D-F-C, D-F-A♭-C, G-B-F, C-E♭-A and C-E♭-B♭. The skeleton says the namer is unchecked on a shell with no fifth.

**Acceptance.** Every item done, or a not-done line.

**Stop.** None: nothing is built.

### Station 5: the report, stopped at placement

The report also carries, for the placement brief: the completion rule the reviewer fixed (`responses/a7b1-bluebossa-design.md` section 1): the minor-shell drill is the one counted row, named by the requirement's `items`; the Lab's Read it row, the chart's cell, the ear drill and a melody run of Blue Bossa never count; and the lesson's truth sentence, in substance: the app can mark the shell drill requirement; finding the progression on a chart, choosing the tonic voicing from the symbol, comping the tune and the later unseen identification are self-checked and do not become app-verified because the rung is met.

- The record's refs: the checker's output before and after Station 1.
- **The stop at placement**, as the Bizet probe stopped. No stage file, lesson text, requirement, teaching-use decision or verified-fact row. Draft instead:
  - the placement options (jazz.5, where the drill sits, R28; jazz.6, where G6 and the map's MUSIC line put it; or a new unit), each with the requirement naming the drill in `items`;
  - the R27 Lab step;
  - the prerequisites that would cover the demands. Say that `excerpts.py --candidate-rungs` cannot read a progression, so placement for this ability is a reviewer decision on verified facts (FABLE §6).
- **The experience question per step:** the record's 16 steps, each with the alternative weighed and the evidence boundary. Overturn any answer Station 4's facts contradict, saying which fact.
- **Drafts, not applied:**
  - a `docs/pending-review.md` entry;
  - the record's header lines (refs now resolving, the premises found wrong);
  - the inputs the G6 brief needs (keys, tonic quality, fifth or not, the CK-6 fixture);
  - the A7b.1 and IM-12 amendment lines for the map.
- `INTAKE-GATE.md` (e), items 1-7.

---

## Files

**Owned (created or changed):**
- `content/sources/pdmx.json`: one row, inserted by the guarded splice only;
- `content/scores/pdmx/QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.mxl` (new);
- `docs/prompts/runs/curriculum-review-2026-10-05/intake/QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.md` (new);
- `docs/chains/A7b.1.yaml`: header comment lines only;
- scratch under the worktree's `build/`. The report says which scripts the next item should keep.

**Not to touch:**
- every app file (no G6 fix);
- `tools/content/generate_exercises.py` and every generator;
- the stage files and the lessons;
- `content/sources/verified-facts.json` and `excerpts.json`;
- `tools/content/pdmx/*` (record their gaps; do not fix them);
- `ABILITY-MAP.md`, `INTAKE-GATE.md`, `count_plan_distance.py`;
- every other edition.

## Out of scope

- G6 and CK-6, G14, and the placement.
- A new verified-fact kind, and any lesson text.
- A second item, and gate code.
- Copyright and export.
- Any listening claim.

## When to deviate

- **A premise here is wrong** (a VERIFIED line does not reproduce, a file is not where it is said to be). Say so. Take the better path inside the owned files and record why, naming one alternative and why it loses (operating-procedure §13).
- **The better path needs a file not owned, or a schema change:** stop and report.

## What this lane adds to the harness (§14)

- **Browser tests:** the lane's own port, two workers; the render check only.
- **The PDMX archive:** read through `PIANOPATH_PDMX_DIR`; stream it and never unpack it.
- **The content lock:** `quarry.py` and `build.py` share it (`build/.content-lock`); never run them together.
- **Order:** the render gate only after `npm ci` and an app build in the worktree.
