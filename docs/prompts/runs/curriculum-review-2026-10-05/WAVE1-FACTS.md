# Wave-one pre-dispatch facts (2026-10-05)

Brief: `briefs/wave1-facts.md`. Fact-gathering only; nothing else was changed. Marks: **[O]** observed (file:line, or the script output named), **[I]** inferred from what was read. Paths are under `app/` unless a full path is given. Scripts: `py -3.11`, `PYTHONIOENCODING=utf-8`, music21 as installed; catalogue reads are of `app/public/content/catalog.json` (2,092 rows) unless stated.

## Summary

| Question | Answer |
| --- | --- |
| 1(c)-1 Comp and Bass + drums silenceable from the chart UI | **Yes, and both are off by default.** Two chips, `#chart-comp` and `#chart-backing`, both start unpressed. |
| 1(c)-2 Which items open in the chart | Any catalogue item whose file parses to at least one chord symbol. The doors are gated on `notation.chordCount > 0`. The three authored shuffles on blues.4 (C, F, G) qualify; `song.classical.12-bar-blues.pdmx` does not (no chord symbols). |
| 1(c)-3 Tracker and click | **Fails for a last "no support" step.** The form tracker cannot be hidden. The click has no chart control; it is silenced only by the global Settings volume. The chart stores nothing and judges nothing that is kept. |
| 1(b) Exact target for a Blind check of a transposition | **Yes for two tunes.** Ode to Joy: `song.classical.ode-to-joy.g` right hand equals `song.classical.ode-to-joy.full` right hand plus a perfect fifth, bars 1-17, event for event. Twinkle: `song.folk.twinkle.f` equals `song.folk.twinkle.rh` plus a perfect fourth, bars 1-12. The 8-bar `ode-to-joy.rh` does **not** transpose to the G edition exactly (bars 4 and 8 differ). |

## Part 1: wave 1(c), the blues right hand over the learner's own left hand

### 1. Can the comp layer and the bass-and-drums layer each be silenced from the chart UI?

- **Controls.** Two toggle chips drawn in the transport row: **Comp** (`#chart-comp`, `ui/screens/ChordChartScreen.ts:376-382`) and **Bass + drums** (`#chart-backing`, `:384-397`). They are drawn by `showTransport` (`:411-422`), so they exist only when a chart loaded.
- **Defaults.** `let comping = false` (`:157`) and `let backing = false` (`:159`); the chip widget starts `aria-pressed=false` (`ui/widgets.ts:93-106`). A fresh chart therefore has **both off**: a count-off click, the form tracker and the chord cells, and nothing else sounding [O].
- **What the toggles do.**
  - `compBar` plays the chord block and calls `scheduleBacking` (`:233-244`).
  - `compBar` runs only `if (comping)` (`:229`).
  - `scheduleBacking` returns unless `backing` is true (`:254-257`); its bass is root on beat 1 and fifth on beat 3, plus kick, snare and hat (`audio/backingLoop.ts:130-170`).
  - Pressing Bass + drums on forces Comp on (`:392-395`; asserted by `tests/e2e/carry-overs.spec.ts:132-141`).
  - **Consequence [I from `:229,243,254`]:** bass and drums run only through the comp's per-bar call. The state "Comp off, Bass + drums on" is not reachable: pressing Comp off while Bass + drums is on silences both. Wave 1(c) needs only the both-off state, which is the default.
- **Which hands.** The chart has no hand setting and no hand-specific judging; the live cell compares whatever is held, both hands together (`:204-216`) [O].
- **The live cell is not a judgement of a blues take.** `chordMatch` is the fraction of the bar chord's pitch classes that are held (`score/harmony.ts:180-185`); `MATCH_THRESHOLD` is 0.6 (`ChordChartScreen.ts:58`). Dominant kinds carry four pitch classes (`score/harmony.ts:37`), so three must be held at once for `yes`. A single-note left-hand figure, or a right-hand blue-note fragment, will mostly show `no`, and nothing held shows `idle` (`:215`) [I from those lines].
- **Verdict: yes.**

### 2. Which items open in the chord chart?

- **The screen's own rule [O].** `findItem(itemId)`, then fetch the file, then `parseHarmony(xml)` (`:541-571`). Zero symbols gives the dead end "has no chord symbols in it" with an *Open on the Score screen* button (`:573-590`). An unknown id, an unbundled item and a failed fetch each dead-end (`:542-568,604-610`). There is no flag or track test, so any catalogue id opens `#/chart/<id>` if its file carries `<harmony>`.
- **The doors [O].** `hasChordSymbols(item)` is true when `targetFor(item) === 'score'` and (`imported` or `notation.chordCount > 0`) (`ui/openItem.ts:95-99`). A **Chart** button is drawn on a lesson page's option rows where it is true (`ui/screens/LessonScreen.ts:296-318`; `optionRow` serves both `exerciseOptions` and `songOptions`, `:858-861`). The Score screen's `⋯` sheet shows a chart row under the same test (`ui/screens/ScoreScreen.ts:5349`). Back returns to the rung through `?from=` (`ChordChartScreen.ts:88-93`; spec `docs/04-ui-spec.md` §3b, "Two doors" and "Back returns to the rung").
- **Measured symbols, from the catalogue [O; `py -3.11` over `catalog.json`].** `chordCount > 0` on 459 rows overall; 107 rows carry the `blues-boogie` track with `chordCount > 0`. The blues.4 to blues.9 candidates:

| id | bars | chordCount | tempo | opens in chart |
| --- | --- | --- | --- | --- |
| `exercise.blues.twelve-bar-shuffle.c` (blues.4, 5; level 3.4) | 12 | 12 | 88 | yes |
| `exercise.blues.twelve-bar-shuffle.f` (blues.4, 5; level 4.1) | 12 | 12 | 88 | yes |
| `exercise.blues.twelve-bar-shuffle.g` (blues.4, 5; level 4.1) | 12 | 12 | 92 | yes |
| `exercise.blues.twelve-bar-shuffle.a`, `.d`, `.e` (in the catalogue, not on the blues.3 to 9 option lists) | 12 | 12 | 88 | yes |
| `song.classical.12-bar-blues.pdmx` (blues.4 song option) | 11 | 0 | 150 | **no**: dead end; no Chart door |
| `song.pop.careless-love-blues.pdmx` (blues.3, 4) | 8 | 10 | 96 | yes (not a twelve-bar form) |
| `song.blues.st-james-infirmary` (blues.3) | 24 | 41 | 96 | yes (minor, not twelve-bar) |
| `exercise.walking-bass.{c,f,...}.blues` (blues.5, 6, 7, 8, 9) | 13 | 13 | | yes (13 bars: a twelve-bar form plus a final bar) |

- **The shuffles' symbols [O; the script reproduces the chart's parse].** One `<harmony>` per bar, kind `dominant`, which prints as `C7`, `F7`, `G7` (`score/harmony.ts:37,136-147`). C: bars 1-12 are C C C C F F C C G F C G. F: F F F F Bb Bb F F C Bb F C. G: G G G G C C G G D C G D. Measure numbers are 1 to 12, so `chartBars` gives 12 cells (`:571-572`). The tempo field starts at the item's 88 or 92 (`:591-600`).
- **Resolved:** the map's open question (ABILITY-MAP §8.6 item 1: "a twelve-bar blues item with printed chord symbols for the chart is also unconfirmed") is yes: three shuffles on blues.4/5 (C, F, G) open in the chart.
- **Verdict: items open; the three authored shuffles qualify. `song.classical.12-bar-blues.pdmx` does not.**

### 3. Tracker, click, and storage

- **Form tracker.** Always drawn once a chart loads: `drawForm` writes "Bar n of N · chorus c" and marks the current cell (`:195-202`); it is called from `start` and every bar change (`:289,227`). There is no control that hides it. `form.hidden` is set only in `deadEnd` (`:525`) [O]. **A "no tracker" step cannot be run in the chart.**
- **Click.** `Count off ▶` starts the metronome (`:266-281`) with `countInBars` count-in bars (default 1, `data/settingsStore.ts:147`; settable 0 to 4 in Settings, `ui/screens/SettingsScreen.ts:242`). The chart has no click on/off control (controls are Count off, Stop, bpm, Swing, Comp, Bass + drums, `:411-420`). The click's loudness is the global **Metronome volume** setting, read at start (`:274`), which can be set to 0 on the Settings screen (`SettingsScreen.ts:370-373`, min 0; default 0.6, `data/midiSettings.ts:40`). A zero gain mutes it (`audio/Metronome.ts:186-188`; all voices connect to that gain, `:243,272,291`). That setting is global and also scales the bass-and-drums kit (`:280`); with Bass + drums off nothing else is affected [I]. **"No click" is possible only through a Settings change outside the chart, not as a chart step.**
- **Stored or judged.** `ChordChartScreen.ts` imports no run, session or progress module (imports `:39-55`; a grep for `recordRun|progressStore|db` over the file finds nothing) [O]. It reads `getImport` only to load an imported file (`:553`). **No session row of any kind is written, and nothing is judged for the record.** This agrees with `MODE-SHEET.md` §15 ("Records. Nothing"; live bar cell `yes/no/idle` only). Opening it from a rung (`?from=`) only changes Back (`:88-93,98`); there is no row, so no `lessonId`. A chart step cannot count toward any rung requirement or skill evidence (`MODE-SHEET.md` R1-R3) [I].

### 4. Does any of 1 to 3 fail?

- **Fails: the last "no support" step (no tracker and no click) cannot be built in the chart.** The tracker is permanent; the click is a global Settings volume, not a chart control.
- **Holds:** Comp and Bass + drums are both silenceable and both start off; the shuffles open in the chart; the chart stores nothing.
- **For the brief, taking the reviewer's fallback:** the steps "over the chart with Comp and Bass + drums off" are buildable (the default state). The final "no tracker, no click" step takes the Metronome or self-check fallback (a click alone through the Metronome screen, or the learner plays unaccompanied and self-checks); it is not a chart state. If the brief wants the chart to offer it, that is a code change, which the map names a product decision outside this seam (ABILITY-MAP wave 1(c), "What would reverse it").

## Part 2: wave 1(b), early core transposition

### 1. Shipped second-key copies of core tunes

All are authored ABC sources under `content/scores/authored/`, built to `app/public/content/scores/authored/*.mxl`; ids and fields from `catalog.json`. Searched: ids, titles, `variantOf`, `variantLabel` and a full-text `transpos` match over `catalog.json`; the `catalog.static.json` text for `transpos`, ode, twinkle and saints (it holds only the drills `drill.reading.transposition`, `drill.reading.transposition-hard` and two theory drills, no score editions) [O].

| id | key | hands | bars | variantOf, label | on rungs |
| --- | --- | --- | --- | --- | --- |
| `song.classical.ode-to-joy.rh` (original) | C | right | 8 | none | 1.1, 1.5, practice.1/2/5 |
| `song.classical.ode-to-joy.full` (original) | C | both | 17 | `ode-to-joy.rh`, "full theme, hands together" | 2.5, 3.5 |
| `song.classical.ode-to-joy.g` | G | both | 17 | `ode-to-joy.full`, "in G major" | 3.1, 4.1 |
| `song.folk.twinkle.rh` / `.ht` (original) | C | right / both | 12 | | 1.2 / 2.1 |
| `song.folk.twinkle.f` | F | both | 12 | `twinkle.ht`, "in F major" | 3.1, 4.2 |
| `song.folk.when-the-saints.alternating` (original) | C | both | 9 (pickup is bar 0) | | 1.4, hymns.2 |
| `song.folk.when-the-saints.f` | F | both | 9 | `saints.alternating`, "in F major with chords" | 3.1, 3.2, chords-pop.3, hymns |
| `song.holiday.jingle-bells.g` | G | both | 8 | `jingle-bells.ht`, "in G major, block chords" | 2.3, 3.2, chords-pop.3, holiday.3 |

Other "in G" or "in F" titles are not second-key copies of a core tune (a Bach minuet excerpt, a Bach fugue). `exercise.five-finger.*` are separate generated exercises, one per key, 3 bars. No other authored transposed edition was found by these searches (the authored directory also lists blues shuffles in six keys, which are the same form in each key, not a tune's second key).

### 2. music21 comparison, event by event

Method [O]: parse each `.mxl` with music21, drop chord-symbol objects, list `(bar, offset in quarters, MIDI pitches, quarterLength)` per staff, add the interval in semitones to the original, compare per bar with the shipped edition.

- **Ode, `ode-to-joy.rh` (C, bars 1-8) up a perfect fifth (+7) against `ode-to-joy.g` right hand, bars 1-8.** 28 expected events, 30 shipped. Bars 1, 2, 3, 5, 6, 7 are identical in pitch (octave included) and duration. **Bars 4 and 8 differ:**
  - bar 4: expected B4 (2.0), A4 (2.0); shipped B4 (1.5), A4 (0.5), A4 (2.0).
  - bar 8: expected A4 (2.0), G4 (2.0); shipped A4 (1.5), G4 (0.5), G4 (2.0).
  - Why: the 8-bar `.rh` ends each phrase on two half notes, whereas the 17-bar edition (and the G edition built on it) writes dotted quarter, eighth, then the repeated note as a half. The G edition is a transposition of `ode-to-joy.full`, not of `.rh`. The same two bars differ between `.rh` and `.full` in C (script output).
- **Ode, `ode-to-joy.full` right hand (C) +7 against `ode-to-joy.g` right hand, bars 1-17.** 63 expected, 63 shipped, **all 17 bars identical**, octave included. Left hand: the G edition's left hand is +7 in bars 1, 3, 5, 7, 12, 13, 15, 17 and an octave lower than +7 elsewhere (D2 where +7 gives D3); this is the shipped bass voicing and does not matter for a right-hand check.
- **Twinkle, `twinkle.rh` (C) +5 against `twinkle.f` right hand, bars 1-12.** 42 expected, 42 shipped, **all 12 bars identical**. `twinkle.ht` right hand +5 is identical too, and `twinkle.ht` left hand +5 is identical to `twinkle.f`'s left hand (22 events). Note the interval is **+5, a perfect fourth up**, not a fifth; F major has B-flat in the signature.
- **Saints, `when-the-saints.alternating` (C) +5 against `.f` (F).** The shipped F edition is a different arrangement (melody in the right hand throughout, block chords in the left; the C edition passes the melody between the hands). Merging the C edition's two staves into one melody (17 events) against the F right hand (17 events): bars 0-3 identical; **bars 4-8 are the same notes an octave higher in the F edition (+12 beyond +5)**. Not an exact event target.
- **Jingle Bells, `.ht` +7 against `.g` right hand.** 25 events, identical, bars 1-8. The left hand is block chords against single notes, so not a transposition.

### 3. `exercise.five-finger.g-major.right` against the transposed Ode

- Five-finger G right: G4 A4 B4 C5 | D5 C5 B4 A4 | G4 (9 events, 3 bars, quarters).
- Ode `.rh` +7: B4 B4 C5 D5 | D5 C5 B4 A4 | G4 G4 A4 B4 | ...
- **Not the same events.** First difference is event 1 (bar 1, beat 1): G4 against B4. Bar 2 is a coincidental match (D5 C5 B4 A4); bar 3 differs (a single G4 against G4 G4 A4 B4) [O, script]. The exercise is a scale fragment up and down, the Ode is a tune that happens to use the same five notes (G A B C D), so the G-major exercise is a position warm-up and not a target for the tune.

### 4. Exact target for a Blind check; what Blind can and cannot show

- **Exact targets that exist [O].**
  - **Ode to Joy: `song.classical.ode-to-joy.g`, right hand, bars 1-17**, for a learner who transposes the right hand of **`song.classical.ode-to-joy.full`** up a perfect fifth. Every event matches (pitch with octave, onset, duration).
  - **Twinkle: `song.folk.twinkle.f`, right hand, bars 1-12**, for a learner who transposes **`song.folk.twinkle.rh`** (a rung 1.2 item) up a perfect fourth. Every event matches. Its left hand also matches `twinkle.ht` +5, so a hands-together transposition is exact as well.
- **Not exact [O].**
  - `ode-to-joy.g` bars 1-8 for a learner who transposes the 8-bar `ode-to-joy.rh` (bars 4 and 8 differ as above). A correct transposition would be counted as missed notes there; a Blind check on those eight bars is exact only in bars 1-3 and 5-7.
  - `when-the-saints.f` as a target for the alternating C version (octave and arrangement differ).
  - `exercise.five-finger.g-major.right` as a target for any tune.
- **Conclusion for the brief.** If the first transposition task is at rung 1.2, the exact target is `twinkle.rh` to `twinkle.f` (a fourth), not the Ode and not a fifth. If it is at 2.5 or 3.x with the Ode, the source must be `ode-to-joy.full` (the 2.5 item), not `ode-to-joy.rh`. A transposition of `ode-to-joy.rh` into G is self-checked, or checked against bars 1-3 and 5-7 only. The independent task in a key nobody printed has no shipped copy and is self-checked, as the map already says.
- **What Blind shows and cannot.** From `MODE-SHEET.md` §10: Blind hides the notation and keeps everything else running; the run is an ordinary row of the chosen mode, with "no `blind` field on the row"; the key strip still lights the next key unless the keys guide is changed (`settingsStore.ts:164-165`). So Blind judged against `ode-to-joy.g` or `twinkle.f` can show **that the notes played (and, in Keep tempo, their timing) match the shipped edition's events**. It **cannot show that the learner transposed rather than read the shipped copy** (the copy is one tap away in the Library), cannot show the page was hidden (not recorded), and cannot show the guide was off. [Cited from the mode sheet, not re-read at code.] Hand choice, and what the app plays for the other hand, are Score-screen settings (`MODE-SHEET.md` §§1-2, 13).

## Not established

- Whether the Score screen's *Section* (bar range) can restrict a Keep tempo or Wait run to a sub-range as a way around the bars 4 and 8 mismatch: not read.
- Blind's hands and keys-guide behaviour at code level (`ScoreScreen.ts:321-332,839-846,2123,2130`): cited from the mode sheet, not re-read.
- The tracker, click and stored claims are from code and the mode sheet; nobody has driven the chart for this brief.
- Nothing here has been heard (unverified as music).
