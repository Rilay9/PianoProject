# 08 — Test map: which state machine is proved by what

The tour's pictures show moments. The faults that reached the owner lived *between* moments —
what one event did to the next — and no number of pictures would have shown them. This map
says, for each state machine in the app, which test drives it through its transitions and
checks what must hold, and which pieces are still open. It exists so the pieces are not
forgotten while any one of them is being worked on.

A test named here is the reproduction: every failure prints the seed and the action trace.

## The pieces

| Piece | What can go wrong | Proved by | Status |
| --- | --- | --- | --- |
| **Session** (`ScoreSession`): start, stop, restart, pause, resume, finish, lap | a stop or restart reported as a finish; a lap that moves the engine but not the cursor; a warning mark asked for in Wait mode | `tests/unit/scoreSession.test.ts` — fake renderer, hand-cranked frames | done |
| **Engine** (`PracticeEngine`): Wait, Tempo, Listen, loops, count-in, pedal, mic | judging, advancement, laps, restarts on the grid | `tests/unit/engineWait.test.ts`, `engineTempo.test.ts`, `engineMic.test.ts`, `engineScoring.test.ts` | done (P3) |
| **Rhythm first** (`EngineOptions.rhythmOnly`, `findRhythmSlot`, `SessionScore.rhythmOnly`): judging when and not what | a run that forgives the moment as well as the note; a chord counted three times in the timing histogram or once in the accuracy; the toggle half-honoured in a mode with no clock; and the one that matters — a rhythm run recorded as a pass, so tapping one key on the strip masters a piece | `tests/unit/engineRhythmOnly.test.ts` — accepted inside the window and refused outside it with the *same* pitch, the chord as one tap with the slots it filled, the tag present and absent, and Wait mode ignoring the option; `tests/e2e/score.rhythm-ladder.spec.ts` — the same pair through the screen with the toggle on and again with it off, and a perfect run at 130 % that still leaves the piece `started` | done (P21f) |
| **The tempo ladder** (`nextLadderTempo`, `LADDER_NOTCH_PCT`, `LADDER_CEILING_PCT`) | a ladder that climbs past the written tempo, or past a learner's own faster choice; one that steps under the slider's floor; one that counts a demonstration as a clean pass; a restart fired from inside the lap event it is reacting to | `tests/unit/tempoLadder.test.ts` — off is a no-op, clean up, a mistake down, both ends clamped, the learner's own ceiling kept, and up-then-down returning to where it started; `tests/e2e/score.rhythm-ladder.spec.ts` — a loop nobody plays walking down to the floor and a loop tapped clean climbing to the ceiling, each asserted at the end of the ladder rather than on a rung in flight | done (P21f) |
| **The duet row** (`playbackHands`, bound at the Score screen) | a setting nobody can find; a row offering a hand the piece does not have, or one the learner is already playing; a second setting that drifts from the first | `tests/e2e/score.rhythm-ladder.spec.ts` — hidden with Both, named with R and with L, and the stored `playbackHands` read back after the toggle | done (P21f) |
| **Slot plan** (`slots.ts`): which bars each slot holds | the wrong next range at a repeat or ending | `tests/unit/slots.test.ts` | done (P21c) |
| **Renderer** (`WindowRenderer`): steps forward, back, jumps; rotation; bars per window; hands | a stale element map; a slot engraved while hidden; no redraw after a rotation; two slots at two scales; the band off the note | `tests/e2e/score.renderer.fuzz.spec.ts` — seeded random walk on the dev harness, invariants after every move | done; extend with zoom and scroll layout |
| **Score screen** (`ScoreScreen`): everything a learner can do during a run | summary over a live run; a recorded half-run; the warning mark after a stop; a Wait run with nothing to wait for; a freeze | `tests/e2e/score.fuzz.spec.ts` — seeded random walk with the spoofed piano, invariants after every action, long-task watch; the fifth seed walks the tablet sizes | done; the `⋯` sheet's rows are proved by their own specs rather than under the walk (`score.blind`, `score.stepper-limits` for size and bars, `score.sheet-rows`, `keys-guide`, `score.rhythm-ladder`); still not walked: section loops and the summary's Slower/Faster/Loop the weak bars |
| **A whole song** on every form factor | a stall; a size change mid-run; the next bar not on the screen; the slide losing the cursor | `tests/tour/sequence.spec.ts` — plays what the app asks for, first note to summary; `SEQ_SONG`/`SEQ_FACTORS` choose the song and sizes | done |
| **Pictures**: the first, a middle and the last input, before and after | what a person sees | the sequence's `…-bar01`, `…-after-first`, `…-after-mid`, the last bar and `…z-finished` frames, per form factor | done; read them every round |
| **The corpus**: thirteen pieces chosen to differ — one staff and two, 4/4, 3/4, 6/8, a pickup, chord symbols, a key signature, repeats, a long piece, the longest, words under the notes, and one piece in the scroll layout — on six form factors — the four the tour shoots plus the owner's real 342x740 and 740x342 | a fault that one song never shows: the pickup piece drawn a bar late; nothing coloured on a repeat's first pass; the stave moving on a piece the probe cannot measure; the summary off the screen on a tablet | `tests/tour/corpus.spec.ts` (`npm run corpus`, around three quarters of an hour since the owner's two sizes and the Nocturne joined it; `CORPUS=` and `CORPUS_FACTORS=` narrow it) — the sequence's invariants plus: the notes coloured current are the notes the run waits for, and the next bar *in playing order* is on the screen; a log and three pictures a leg under `build/corpus/`, tiled by `tools/contact_sheet.py` | done; read the sheets every round |
| **The guide** (`GuideScreen`): every section, every picture shipped, every button landing | a picture the build does not carry; a button on the wrong screen | `tests/e2e/guide.spec.ts`; the pictures from `guide-shots.spec.ts` under `GUIDE_SHOTS=1` | done |
| **The guided tour of the practice modes** (`drill.tour.app-basics`, `04` §5c-1): three steps, each opening the real Score screen in its own mode and coming back to the next | a tour that is a one-way door; a step that opens in the learner's default instead of the mode it is about; a loop step that arrives looping nothing; a position lost because the learner never pressed Back; a second run that resumes a finished tour; Back bouncing between the drill and the piece it just left | `tests/unit/drillWalkthrough.test.ts` (the drill half: which route each step asks for, the position across a remount, Start over, Again, a stored step past the end, an unknown step id, and Back leaving for the tab rather than into the score), `tests/unit/scoreTourRoute.test.ts` (the Score half: `?mode=` over the default, `?loop=` on a pickup piece and on one past the end, all three exits, and Blind/Perform carrying the tour), `tests/unit/router.test.ts` (the three parameters parse, refuse rubbish and round-trip), `tests/e2e/tour-practice-modes.spec.ts` (the two halves meeting on a real engraving) | done (2026-09-12) |
| **The setup tour** (`SetupScreen`): first launch, skip, finish, run again, the live preview | the tour on a deep link; a setting the tour changed that Settings does not show; a preview that does not redraw | `tests/e2e/setup.spec.ts` — starts from an empty origin, walks all eight steps, checks Settings after | done |
| **The state gallery**: every branch of `08`, measured and photographed, including the owner's own 342x740 and 740x342 and a 53-character title | a caption that is not what the picture shows | `tests/states/` (`npm run states`) — each cell records claims and the gallery goes red where the record disagrees; a harness self-check runs first | done; read every cell |
| **Fit and freeze** (`scaleFor`, the probe, `setRunning`) | the size changing during a run; the last window doubling; a frozen scale outliving a rotation | the sequence's one-scale assertion; the screen fuzz's mid-run scale check; `tests/e2e/score.layout.spec.ts` | done |
| **Read-ahead sideways** (`readAheadScale`, `NEXT_NOTE_PEEK_STAVES`, the slide target between `SLIDE_TARGET_MIN` and a third) | the next bar off the right edge while a bar is played — the counting test cannot see it, the extra measures are in the SVG either way; or the read-ahead bought by shrinking the music to half the height | `tests/unit/readAheadScale.test.ts`; `tests/e2e/score.readahead.spec.ts` (the next-step mark and the paler next key, Tempo and Listen only, none in Wait); `score.layout.spec.ts` "the next bar is on the glass" on Hot Cross Buns and Twinkle at 1, 2, 4 bars, at rest and through a run; the sequence's `nextBarVisible` measures the bar's first note, not the sheet; `score.rotate.spec.ts`'s sideways verdict accepts a sheet short of the height only when the stage's `data-fit` says the read-ahead priced it and the stave is over the floor | done (2026-09-14) |
| **Timing budgets** | a swap or a coloured note over budget; a freeze | `tests/e2e/perf.spec.ts`; the screen fuzz's long-task limit | done; the 780-bar open budget is marginal on this laptop |
| **Keys strip and ribbon** during a run | the wanted key not shown; a wrong key not red; the strip not scrolling to the note; the guide, the finger numbers and the flash not following their settings | `tests/e2e/keyboard-strip.spec.ts`, `score.run.spec.ts`, `keys-guide.spec.ts`; `tests/unit/scoreSession.test.ts` | partial: not under the random walk yet |
| **Tempo and Listen timing**: count-in, beat dot, cursor cadence, pause on hidden | the cursor drifting from the clock; a count-in that does not count; a run that catches up silently after a phone call | `engineTempo.test.ts` (engine only); `tests/unit/countIn.test.ts` (the arithmetic: the notated meter, the beat the run starts on); `tests/e2e/score.countin.spec.ts` (the count-in drawn large over the notation and the beat dot during a run, both ways up) | partial: the count-in and the dot are proved; open are a walk that watches the cursor's cadence against the clock, and the visibility-change pause |
| **Microphone input path** | a guess painted red; a chord counted rolled | `engineMic.test.ts`, `mic.spec.ts` | done (engine); the screen under mic input not walked |
| **Lesson, drill and paper screens' runs** | the same stop/finish confusions in another host | `lesson-flow.spec.ts`, `drills.spec.ts` | read (2026-09-12) and the fault is there: `End drill` calls the same `finish()` a completed set does, so abandoning a ten-card drill after one card records a run at that card's accuracy with `passed: false`, against `08` §16's "a stop is not a finish: nothing recorded". Every kind has a natural ending, so `End drill` is never the only way to complete one. **done (2026-09-12)** — `End drill` draws the summary and records nothing; `Count this set` under it writes the run, and a line beside it says so. A set that runs out still records itself. Paper was read too and was already right: it is the model this copied. `drills.spec` covers both halves and the completion. Lesson still unread — its two self-pass buttons converged, `handoff` §5ae |
| **PDF viewer** (`PdfScreen`): pages, systems, Timed, learn from taps, Adjust cuts | a Timed interval learned from a double-tap; a cut that loses a system | `tests/unit/pdfTiming.test.ts`, `pdf.spec.ts` | partial: the page/system state under a walk is open |
| **Scroll layout** | auto-scroll fighting a manual scroll; the cursor off the target fraction | `score.spec.ts` (the scroll layout draws the whole piece, on the dev harness). The *sideways slide's* target — the cursor held about a third across — is `score.slide.spec.ts`; the scroll layout's own 25–40 % auto-scroll target has no test | open under the walk, and the auto-scroll target is untested |
| **Blind and Perform modes** | the score coming back; a performance flag on a loop; the count-in, the dot and the corner hidden with the notation | `score.blind.spec.ts` (the stage hidden and the three things on it that must not be); `score.screen.spec.ts` (the blind block: the route, the `⋯` row, the status line); `shelf.spec.ts` (a blind run is still scored); `scoreTourRoute.test.ts` (Blind and Perform carrying the tour's parameters) | done (P18–P20, 2026-09-12); not walked |
| **Rotation** (`stageChanged`, `updateReadAhead`, the freeze): a turn mid-run, paused, twice quickly, in Scroll, and the tour's miniature | a turn that re-fits without re-engraving, so the sheet on the screen belongs to the other orientation; a frozen scale that outlives the stage it was taken on; a fit left over from a wider stage | `tests/e2e/score.rotate.spec.ts` — ten cases, at the round sizes *and* at the owner's 740x342 / 342x740, asserting what was engraved and not only how wide the ink came out | done (2026-09-10) |
| **Fingering on a melodic line** (`make_arpeggio`, `make_seventh_arpeggio`, `make_walking_bass`, `make_chromatic`) | a thumb on a black-key root, sixty arpeggios; the thumb below the second finger on the walking bass's approach note; the left hand given the right hand's chromatic shape — none of which `confirm_fingering` can see, because a line is not a chord | `tools/content/tests/test_generator_fingering.py` — the Hanon black-key shape on every black root in the shipping plan, 1-2-3-4 on white-root sevenths and nothing printed on black ones, the approach-note rule as arithmetic and over every walking bass, the two chromatic hands note by note, the tumbao's tie across the barline, and the hands-separate arpeggios unit 4.3 describes | done (2026-09-14) |
| **Where a song may sit** (`core_reach_errors`) | a Stage 2 rung offering a level-3.7 film theme because the quarry attached by band and the band widened to fit | `tools/content/tests/test_validate_reach.py`; `validate.py` runs it on every build. A companion rule, no song on no rung, was withdrawn the next day (handoff §5aj) | done (2026-09-14) |
| **Wide screens** (`04` §7a: `--page-max`, `--column-max`, `--stage-max`, the laptop clause of the two-column grid, the centred keys row) | a screen stretched across a laptop because the tablet test wants height; a capped column pinned to the left instead of centred; a phone changed by a rule written for a laptop; a page that scrolls sideways; a stage the renderer grows to its cap and then engraves for, so the sheet comes back off the screen | `tests/e2e/wide.spec.ts` — the owner's two phone shapes as controls, tablet both ways, 1366 × 768, 1536 × 864 and 1920 × 1080; every screen photographed under `build/wide/`; gutters equal either side, page and content no wider at 1920 than at 1366, both themes at 115 % text. Relationships only, no pixel of this machine | done (2026-09-16); read the pictures — the one-bar-per-system stretch on a wide stage is the renderer's and still open |
| **A score that lost notes on import** (the Humdrum spine-split fault) | the render check, the step-parity check and the validator all passed a mazurka missing over half its notes; it crashed only in the minified build and read as a CI flake | 53 first editions are excluded by hand in `content/sources/kern.json`; the gate that would have caught them is the row below (handoff §5aj). `score.fill`, `score.strip-span` and the tour corpus moved from the Op. 27 No. 1 nocturne to Op. 48 No. 1 for the same reason | the gate is done (2026-09-15, next row); the hand exclusions still stand |
| **The note-loss gate** (`convert.py`: `source_note_events`, `note_loss`, `collapse_to_two`) | a conversion that quietly ships fewer notes than the source has. Two mechanisms were doing it: music21's Humdrum parser drops most of a file whose spines split inside a split, and the merge that reduces three or more parts to a grand staff asked a *part* for the offset of a note that lives inside one of its *measures* — music21 raises on that, the `except` around it swallowed every raise, and the whole middle part vanished under the words "merged N parts into 2 staves by register". A rag shipped without a third of its notes and an arrangement without more than half, and every later check — render, step parity, validator — passed both | `tools/content/tests/test_note_loss.py` — the kern counter against an inline fixture with a `**dynam` spine, a chord, a positioned rest and a split that merges back; the MusicXML counter against an inline chord and rest; `note_loss` as a pure decision (refuses above the limit, warns at or under it, ignores a gain, ignores an unknown source count); the cache sidecar round trip with and without the new fields; and a three-spine rag converted end to end, asserting the source count **equals** the output count rather than what either is. `test_convert.py` holds the grand-staff ordering the merge must not disturb | done (2026-09-15) |
| **Lengths the MusicXML writer cannot name** (`convert.py`: `settle_durations`, `writable_quarter_length`, `refuse_unwritable`) | a conversion refused at the *export* end, on an editor's arithmetic rather than anything about the music. MusicXML counts time in integer ticks, an irregular tuplet does not divide evenly into them, and the editor rounds each note of the run to the nearest tick — so the run overhangs its barline, music21 ties it across, and the sliver left over is a length no printed note value expresses. It came back as three different sentences (`2048th`, `inexpressible durations`, a bare `KeyError` from `makeTies`) and cost the PDMX re-run most of its band 7-9 admissions | `tools/content/tests/test_export_durations.py` — three MusicXML fixtures whose tick counts *are* the fault, each first shown to be unwritable as it arrives; then a rounded tuplet run that converts with its note-event count unchanged, its printed ratio intact and a warning naming the number of lengths settled; a grace chain that comes through untouched beside one; a length with no printed value at all, refused in a sentence naming the bar rather than rounded up onto the barline; and one real upload from `build/pdmx-rerun/raw/`, skipped when that run is not on the machine, asserting only that its two note counts agree | done (2026-09-15) |
| **A bar the edition wrote short** (`convert.py`: `declare_partial_bars`, `drop_seam_bars`) | notes moved without one going missing, which the note-loss gate above cannot see. music21's MusicXML writer fills every measure out to its time signature before it writes it, so a bar an edition wrote short comes back with a rest on the end and everything after it in the file is late by what was added. `**kern` writes a change of strain that way — a double barline inside the bar, the rest of the bar standing after it as the pickup into the next strain — and where that barline falls on a barline instead, the parser leaves a measure holding nothing but the barline, which the writer turns into a whole bar of silence. Half a Joplin rag played a bar late behind silence he did not write, and Chopin's op. 18 waltz grew a bar where it turns to D flat | `tools/content/tests/test_bar_splits.py` — inline kern fixtures for both shapes, each length read off the fixture above it: the split bar and its remainder keeping their lengths through `normalise` and through the written file, the double barline and the seam's barline surviving, the seam not becoming a bar of silence, an anacrusis still an anacrusis; and the rag itself, skipped when that edition is not in the tree, asserting only that the conversion starts every note where the source does and lasts as long | done (2026-09-15) |
| **A key signature Humdrum writes between two bars** (`convert.py`: `place_loose_attributes`) | a strain engraved in the key of the strain before it. music21's Humdrum parser hands back a `*k[...]` standing between two barline records as a `KeySignature` in the *part*, outside every measure, and the MusicXML writer rescues loose attributes into the first measure and only the first — so an opening signature survives and every later one is dropped without a word. *Cleopha* modulates at the double bar inside bar 54 and its second half was printed with one flat where Joplin wrote two, every B flat of it spelled out as an accidental; a mid-piece clef change was going the same way. The same fault `drop_superseded_key_signatures` covers, arriving by the other door: there the wrong signature printed, here the right one with nowhere to print it | `tools/content/tests/test_loose_attributes.py` — an inline kern strain change, first asserting the parser really does leave the signature outside every bar (the fault), then that it lands inside the bar its offset falls in on both staves with a warning naming what moved, and that a tune with nothing loose is untouched; the relation asserted on the written file is that every signature the source prints reaches the page **at the instant the source puts it**, never a count. Plus the rag itself, skipped when that edition is not in the tree: the same relation, and two flats in force in its last bar | done (2026-09-15) |
| **A PDF in the score folder** (`folderKind`, the listed suffixes) | the owner's folder holds PDFs beside the scores and the screen refused to list them, sending each through Import by hand | `tests/unit/folderLibrary.test.ts` — a `.pdf` is a listed file of kind `pdf`, and Add hands it to the import store as a PDF import | done (2026-09-15) |
| **Sight-reading for the left hand alone** (`generateSightReading`, `hands: 'L'` at a level with no left-hand part) | lesson 1.3 teaches the bass clef and C3–G3, and the generator could only read level 1 in the right hand; the drill for the left hand did not exist | `tests/unit/sightReading.test.ts` — the same seed gives the same tune in either hand an octave apart, on the bass staff, inside C3–G3, and the model reports the left hand only | done (2026-09-15) |
| **A progression the owner typed, turned into chords** (`romanToLabChord`, `chordsForProgression`, `romansForProgression`, `04` §3c) | a numeral read against the wrong ladder — ♭VI in A minor is F, and a lab that dropped the accidental would build F sharp instead, on the one bar the progression turns on. A label can agree while the notes do not, so nothing here is checked by its name alone | `tests/unit/accompanimentLab.test.ts` — every progression as *pitch classes* in a major and a minor key, the flat and sharp prefixes in both spellings, a seventh and a half-diminished named by what is in them, the blues form bar by bar with its flat seventh, a minor blues turning on the minor tonic and keeping a major dominant, an unreadable numeral refused rather than guessed, and every one of the twenty-one keys having its own tonic as the root of its own I chord | done (2026-09-15) |
| **The fixed-harmony builder** (`buildLabExercise`) | an accompaniment pattern written as something else — Alberti that does not go root, fifth, third, fifth; a block chord written as three notes in a row, which triples the bar; a bar count that is not the one asked for; a left hand asked for and no staff to put it on | `tests/unit/accompanimentLab.test.ts` — through OSMD and `extractScoreModel`, as `sightReading.test.ts` does: the measure count against the harmony it was handed, the left hand's notes in order for each pattern, one onset for a block chord, one staff when there is no left hand, the melody landing on a chord tone at the top of every bar, the same seed giving the same page and another seed a different one, and every pitch on a real piano in all twenty-one keys. `tests/unit/sightReading.test.ts` stays green, which is the assertion that nothing here changed what `generateSightReading` produces | done (2026-09-15) |
| **The day's seed and the run of days** (`dailySeed`, `dailyReadStreak`, `readToday`, `04` §2) | a daily read that is a fresh phrase on every tap, so "the same one again" is impossible; consecutive days landing on neighbouring seeds, which through `makeRng` is seven takes of one phrase; and a run broken by a day that is not over yet — the daily-streak guilt the weekly header exists to avoid | `tests/unit/accompanimentLab.test.ts` (the seed: stable per date, distinct across a month, inside the range the generator takes), `tests/unit/dailyReadStreak.test.ts` (the run: ending today, ending yesterday with today still unread, reset by a real gap, counting only the run that reaches here and not the longest ever, across a month boundary, and independent of the order the days were written down) | done (2026-09-15) |
| **The two routes that carry them** (`?seed=`, `#/lab`) | a seed dropped in the hash, so a reload or a back gesture silently gives a different day; rubbish carried through to a generator that then picks its own without saying so; a lab route that does not keep Library highlighted | `tests/unit/labRoute.test.ts` — parse and round-trip including zero and the top of the 32-bit range, six shapes that are not a seed refused, the seed riding beside `blind` and `mode`, `navigateScore` writing it into the hash and two seeds counting as two routes; `#/lab` parsing over the Library tab and leaving it seen as a change | done (2026-09-15) |
| **The accompaniment lab and Today's daily card, end to end** (`04` §2, §3c) | "you cannot get there" — the way either of these actually fails; a Read it that piles up a library row per press; a jam whose chart says bars it is not playing; a card whose tick never arrives | `tests/e2e/lab.spec.ts` (**unrun**) — opened from the Library line rather than deep-linked: the summary naming every choice, Read it landing on the Score screen with the chosen bars in its title and an engraving on the stage, the same settings twice leaving one row and a different combination two, Jam it drawing a cell a bar with the chords in order and three keys lit and Stop stopping it, a setting changed under a running loop stopping it, the blues replacing the bar chips, an unreadable numeral named, and Today's card carrying the seed into the route and ticking after a recorded run and across a reload | written (2026-09-15); needs a run |
| **The doors** (`04` §2, §2b, §4): Today's tools row, the Library's *Open as…*, and free play | "you cannot get there" — a mode built and reachable from nowhere, which is what the owner asked about; a door that opens a *different* daily phrase from the card beside it; a mode chosen in the sheet that the Score screen does not arrive in; `rhythmOnly` left on from a previous choice, so *Keep tempo* is silently judged on timing; a Duet opened with no hand chosen, where the app has no hand to play; every Library row grown 35 px because the stylesheet counts buttons to find the imports | `tests/e2e/doors.spec.ts` — each Today door landing on its screen and the sight-read carrying the card's own seed; the seven `Open as…` choices read off the Score screen's own state (`data-mode`, `data-rhythm`, `data-blind`, the hands segment, the Duet row in the `⋯` sheet); a rhythm choice followed by a tempo choice; the control absent on a drill row; the catalog row's links beside its words upright and an import's underneath; free play naming a held C–E–G and an inversion through `installMidiMock`, the strip as an input, and the no-device sentence with its link. Pictures under `build/doors/` at five shapes, both themes and 115 % text. `tests/unit/heldChord.test.ts` holds the naming and `tests/unit/simonDrill.test.ts` the stage rule, derived from the built curriculum rather than restated | done (2026-09-16) |
| **A revealed drill answer is judged but not counted** (`PromptDrill.reveal`) | Show me and Hear it would otherwise pass a drill by tapping them ten times, and hiding the answer until a wrong note left a learner no way into a mode they did not know | `tests/unit/harmonyDrills.test.ts` — the revealed prompt is marked correct and `revealed`, the next one counts, and a reveal after the answer does nothing | done (2026-09-15) |
| **What happens after a miss** (`engine/drills/feedback.ts`) | the one moment in a drill with something to learn from went past at the speed of a right answer: the expected keys lit for the same few hundred milliseconds and the next card arrived, so a learner who had just been shown the answer never saw it | `tests/unit/drillAfterAMiss.test.ts` — the pause as a pure decision: every kind with keys to light holds a miss longer than a hit and draws an answer on it, a hit is unchanged, and the ear kinds and the kinds with a flow of their own are unchanged either way. Asserted as the *relation* between the two waits and against the named constants, never a millisecond. `tests/e2e/drills-review.spec.ts` drives the real screen: the staff, the red keys, the lit keys, and a tap that moves on — proved by measuring the two waits and comparing them, not by timing either | done (2026-09-15) |
| **Going over the ones you missed** (`engine/drills/review.ts`, `PromptDrill.revealed`) | a second round that quietly scores — the whole point is that it counts nothing — or one built from the wrong prompts, or one that records a run of its own over the result the drill already wrote | `tests/unit/drillAfterAMiss.test.ts` — the round is exactly the prompts that did not count (wrong, skipped, and shown-then-right), in order, renumbered from the start, and a going-over played perfectly still scores nothing. `tests/e2e/drills-review.spec.ts` — the button appears only when something was missed, the staff and keys are up before a note is played, the counter carries no score, and the practice history still holds one run for the item and not two | done (2026-09-15) |
| **Simon** (`engine/drills/simon.ts`): the chain grows, breaks, and is scored | a chain redrawn each round instead of grown; a wrong note that does not end it; a game that cannot be repeated from its seed; and a score that is an accuracy — breaking at the sixth round is five chains right out of six, which as a percentage says the same thing as breaking at the twelfth | `tests/unit/simonDrill.test.ts` — one more note a round with the previous chain as its start, a wrong note ending it on the note it fell on, the octave counting, a skipped round breaking it, the same seed drawing the same game and not every seed the same one, the pass reading the chain, and the best chain surviving the round trip through the stored accuracy it is kept as. The two catalog items are read from `catalog.static.json` and played: the white-key game stays on the white keys of its octave, the chromatic one reaches the black keys, and it is the higher level of the two. `tests/e2e/drills-review.spec.ts` drives three rounds and the note that breaks the fourth | done (2026-09-15) |
| **Simon's three levels of help** (`04` §5c-2): the ladder, what each rung reveals, and the missed chain that comes back | a chip that changes the pressed state and nothing else; a rung that lights the keys *and* claims to be by ear; a missed chain that is replayed but not re-asked, or re-asked but grown a note; a card that moves on partway through its own replay; an ear-first game with no ending at all, because the chain never grows and nothing else stops it; a rung remembered for Simon everywhere rather than per item; the top rung silently made the default for the chromatic game a beginner was never meant to open lit | `tests/unit/simonDrill.test.ts` — the ladder ordered by how much help each rung gives, counted from what it does rather than written down twice; exactly one rung lighting the keys as it plays and exactly one replaying after a miss; an unknown rung falling back rather than throwing; the hold growing with the chain and with the step between its notes, asserted as comparisons and never as a number of milliseconds; the same chain asked again and not grown until it is right; the depth scored rather than the tries; the card budget ending a game whose every answer is wrong; and the rung read at the moment of the miss, not at the moment the drill was built. The two catalog items' defaults are read from `catalog.static.json` and neither is the engine's fallback. `tests/e2e/drills-review.spec.ts` — the card and the keys sampled continuously from before the chain plays (they are transients: by the time an assertion reached note two, note one had gone), so each note is proved lit *while its own name was on the card*, one at a time and in order; the miss replay with the card held and the same chain asked again with no result sheet; and the rung surviving a reload on one item while the other keeps its own | done (2026-09-16) |
| **Simon's chain on a staff** (`04` §5c-2, `simonChainSteps`): the notes appearing as they sound, and going with the lights | a staff that is still on screen when the learner's turn begins, which is the chain written down and would take the memory task away; a staff drawn on the rungs that are meant to be by ear; one that re-engraves itself part-way through a chain because the key signature or the clef was chosen from the notes drawn so far; one that grows a bar at the ninth note and takes the card with it, pushing the buttons off the screen; one lost when a key pressed early redraws the card mid-chain; one left behind on the next card, or after a rung change, or on the way off the screen | `tests/unit/simonDrill.test.ts` — one moment per note of the chain, each carrying the note that sounds and everything heard so far, a silent playback step counted as neither, and the list handed back unshareable. `tests/unit/answerSheet.test.ts` — the growing-run rules above, and every prefix of every run up to sixteen notes drawn on exactly one bar while a run drawn once still spreads. `tests/e2e/drills-review.spec.ts` — the staff sampled by the same continuous reader as the card and the keys (it is the same transient), so it is proved to *follow* the chain — never holding more notes than have been played — rather than to hold exactly the right number in the same reading as the name, which would be asserting that this machine kept up when the screen's own rule is to skip a prefix rather than queue; gone once the card is back to the glyph; never drawn at all on the other two rungs, watched for as long as the lit rung needed to draw one; and drawn under the ear-first rung's replay after a miss, gone again before that same chain is asked for. And the short screen, where there is no room for one: the chain still lights and names itself, no staff is drawn, and the three chips are proved to lie inside the card — a comparison between two elements, never a pixel | done (2026-09-16) |
| **The answer as notation** (`answerSheet`, `fifthsFor`) | a mode named and lit on the keys but never shown as notes, so the shape — where the half-steps fall — was never seen; and a key signature chosen badly prints a mode as a thicket of accidentals | `tests/unit/answerSheet.test.ts` — a mode gets its parent major key with no accidentals, a triad stays in C, a scale is eighths in one bar and a longer run quarters over bars, a chord is one whole note with chord members, a low answer takes the bass clef; and, for a run drawn again and again as it grows (Simon's play-along staff), the key signature, the clef and the note value taken from the *finished* run rather than from the notes on it so far, each prefix drawing one more note and nothing else moving | done (2026-09-16) |
| **The piece measurement** (`pieceExtent`) | a height reserved that no system in the piece has, which shrinks every window of a dense piece | `tests/unit/pieceExtent.test.ts` — synthetic systems where the widest staves, the highest ink and the lowest ink belong to three different systems | done (2026-09-10) |
| **Anything that grows**: the practice `sessions` store, the error log, the render-timing ring | a store with no retention rule at all; a cap that nothing ever ran against | `tests/unit/sessionRetention.test.ts` (a real IndexedDB, seeded past the cap), `tests/unit/logsAreBounded.test.ts` (each log driven thousands of entries past its limit) | done (2026-09-10) |
| **A long list's letter rail** (`ui/alphaRail.ts` in Library and the score folder): a jump, a search that narrows it, a letter with nothing behind it | letters that describe the drawn page instead of the list, so twenty-six of them read empty one tap after a jump; a tap that silently does nothing; a jump that draws more than one page | `tests/unit/alphaRail.test.ts` (the component, including the windowed case), `tests/unit/folderScreenAtScale.test.ts` (the real screen over a 600-row listing: a jump, the count of rows it draws, the letters after it, and a search), `tests/e2e/folder.rail-cost.spec.ts` (5,000 scores, one page) | done (2026-09-11) |
| **Which saved folder the score-folder screen shows**: one listing, several picked | the screen showing whichever folder name sorts first, for ever, with the archive invisible and Forget pointed at the wrong one | `tests/unit/folderScreenAtScale.test.ts` — two listings with different `addedAt`, the newest shown and the other named | done (2026-09-11) |
| **What opening the score-folder screen reads out of the database** | a whole 37,261-row listing deserialized to draw sixty rows, because the listing was one record; adding one piece rewriting all of them; a rescan replacing the listing and taking the app's own knowledge of each row with it | `tests/unit/folderStorage.test.ts` — records in and out are counted per store by wrapping `IDBObjectStore.prototype`, and every assertion is a **relationship**: the same work over a small folder and one twenty times its size must touch the same number of score records. Opening reads ten rows plus one index record whatever the folder holds; listing saved folders reads no score rows at all; a dead row marks one record and the folder's small row and leaves the index alone; a rescan reads keys, not records, and marks rather than deletes | done (2026-09-12) |
| **Whether what the app holds is safe, and whether it is being saved at all** | nothing ever asking `navigator.storage.persist()`, so a year of practice that exists nowhere else sat in best-effort mode; a `blocked` open that fires neither `success` nor `error`, so the open promise never settled and the app launched with no tab bar; an answer recorded where the owner cannot read it | `tests/unit/storagePersistence.test.ts` — the four persistence answers and that `persisted()` is preferred so the phone is not asked twice; a held older connection, asserting the bounded give-up **and** the recovery when the other copy lets go; this page closing itself when it is the one in the way; and the sentence reaching `#settings-durability` beside the usage figure | done (2026-09-12) |
| **What a screen load reads out of the `imports` store** | every imported file's bytes deserialized to take a title off each row, on every screen; the cache going on describing the imports the phone had before a backup was restored | `tests/unit/importSummaries.test.ts` — rows come back without `data`, the store is read once however many screens ask, and again after a write or a restore (the read count is spied on `IDBObjectStore.prototype.getAll`) | done (2026-09-11) |
| **The day a practice session belongs to, and what a restore does to it** | minutes and passes keyed in UTC, so an evening is filed under tomorrow and a Saturday counts towards next week; a write-through cache putting the pre-restore streak back over the restored one | `tests/unit/progressAtScale.test.ts` — the timezone is pinned to the owner's, so the runner's cannot decide whether the test can fail | done (2026-09-11) |
| **Finding a rare run in a long history**: performances, one drill's own last two runs | a rare thing looked for inside a recent window, so a few weeks of practice makes it vanish and the screen says the opposite of the truth | `tests/unit/progressAtScale.test.ts` — a performance behind 120 later runs, a drill behind 80; both assert what the old window returned as well as what the new query does | done (2026-09-11) |
| **A screen's status line** | `status--error` added by fifteen screens and removed by none, so one failure prints every later `Saved.` in red | `tests/unit/statusLine.test.ts` | done (2026-09-11) |
| **Today's input chip against a piano that connects late** | the chip deciding before MIDI auto-connect returns and never changing — a path only the owner's device takes, since no runner has Web MIDI | `tests/unit/todayInputChip.test.ts` — a fake source that connects after the screen is mounted, and the unsubscribe on dispose | done (2026-09-11) |
| **The MIDI cable, pulled and put back** (`WebMidiSource` port lifetime) | an unplugged port still counted as connected, because the API leaves it in `access.inputs` with `state: 'disconnected'`; a key held when the cable went never released; the same port silent after a re-plug, because a closed port needs `onmidimessage` assigned again; `send()` to a departed output throwing on every note | `tests/unit/WebMidiSource.test.ts` — "the cable, pulled and put back" (7 tests) against a fake that models a disconnect in place rather than a deletion; `tests/e2e/midi.unplug.spec.ts` (9 tests — the file's own header still says ten — **unrun** as far as this map knows) through the real screen | done (2026-09-11); the e2e half needs a run |
| **The pinned MIDI input that is not plugged in** | a radio group with nothing selected over an app listening to every input, since ids are not stable across plug-ins (`05` §9) | `tests/unit/midiScreenDevices.test.ts`; `midi.unplug.spec.ts`'s second block | done (2026-09-11) |
| **A microphone prompt dismissed rather than denied** | the same `NotAllowedError` for Block and for a prompt swiped away, answered as a permanent refusal — the Connect button, the meter and the calibration all removed, and directions to a setting nothing changed | `tests/unit/micScreenRefusal.test.ts` (the Permissions API telling the two apart); `tests/e2e/empty-states.spec.ts`'s two refusal tests, one of which used to describe a dismissal while asserting a denial | done (2026-09-11) |
| **The microphone's lifetime across screens** | a stream left open after the Microphone screen is left: the recording indicator on and the detector running all session | `tests/unit/micScreenRefusal.test.ts` — "closes the microphone when the screen is left" | done (2026-09-11) for `MicScreen`; **open** for `DiagnosticsScreen`, which connects and never releases |
| **The service worker and the update prompt** | a check recorded that never reached the server, so "last update check" reported when the app was opened; a worker already waiting at load never offered, so the update never arrives on a phone nobody reloads; "registered but not controlling" printed for a page with no worker at all | `tests/unit/serviceWorkerUpdates.test.ts` (9 tests, against the extracted `app/updates.ts`), `tests/unit/offlineStatus.test.ts` (10), `tests/e2e/offline.report.spec.ts` (4, **unrun**) | done (2026-09-11); the e2e half needs a run |
| **How many systems the stage holds, and who decides it** | the count comes from the probe's measurement, the probe's load is deferred to idle, and a run freezes 150 ms after it starts — so the freeze usually wins and the count is the two-system default. Twenty-eight of the corpus's forty-eight upright legs froze blind, and Twinkle used 48 % of the phone's height at 342 px against 84 % at 360 px, purely on which side of the race it landed; and the count the prediction names can draw a stave under the floor across half the width | `tests/e2e/score.arrange-race.spec.ts` — compares a run started at once against one started after the measurement, comparing integers and no pixels; `score.fill.spec.ts` holds the width floor on the dense pieces | done (2026-09-14) — the freeze waits for the measurement, bounded, and the drawn stave and width can lower the count once (`08` §3.3) |
| **Two sheet rows that carry state across a toggle** (Duet, Ladder) | Off/On on the Duet writing `non-focused` over a learner's `both`; the Ladder left on under a hidden row after the loop was cleared, so the next loop moved the tempo with nothing on screen having asked | `tests/unit/scoreSheetRows.test.ts` — the real Score screen in jsdom with the engraver and session stubbed, as `scoreTourRoute.test.ts` does: Off then On on the Duet gives back `both`; a loop cleared with the ladder on leaves the toggle unpressed, and a section chosen afterwards loops with the ladder off | done |
| **Merging an unbarred part into a barred staff** (`merge_part_into`, `bar_against`) | the extra's notes inserted at part level into a staff that has measures, which is outside every bar and everything the writer drops; the note-loss gate refuses the file, the music is already gone | `tools/content/tests/test_convert.py` `TestMergeLoosePart` — a two-bar target with a bar left short, loose notes at the barline, on the beat the short bar lacks, mid-bar and past the end; nothing loose afterwards, every note inside a bar at the offset it held, and a bar of its own for the late one | done |
| **What a drill does with an answer that was not right, observed rather than polled** | `data-feedback` and `data-paused` are transients (a few hundred ms, a couple of seconds) and a wait installed after the notes were sent finds nothing under load | `tests/e2e/drills-review.spec.ts` — a `MutationObserver` on the drill element, installed before the notes go, records every value with the page's clock and a snapshot of the card; the tap that ends a pause is dispatched by the observer on seeing the pause begin; the Simon card is checked for the note *name* it must not show, not a MIDI number nothing prints | done |
| **Every runtime drill in the shipped catalog** (`drillFromCatalog`, `RUNTIME_DRILL_KINDS`) | a new drill item with a parameter nobody implemented, failing on the phone as "no drill" instead of at build time; a kind in the list twice; `sight-reading` mistaken for a runtime kind | `tests/unit/drillFromCatalog.test.ts` — reads `app/public/content/catalog.json` rather than a fixture, builds every runtime drill and checks it honours its parameters; the list is a set and excludes `sight-reading` | done (P8; kept current as kinds were added) |
| **The documents against the code** (`docs/03` sections cited from the pipeline, `*.py` names in `03`, the router's sub-screens in `04`) | a section renumbered and forty citations pointing at the old number; a module renamed and the doc naming the old one for months; a screen the router knows that the spec never describes | `tests/unit/docsConsistency.test.ts` — every `docs/03 §N` in `tools/content/**/*.py` is a heading `03` has; every `*.py` named in `03` exists under `tools/content`; every `SUB_IDS` entry has a `##`/`###` heading in `04` naming it. Relationships only, no counts | done (2026-09-16) |

## How to run the pieces

```bash
# the fast ones (seconds)
npx vitest run tests/unit/scoreSession.test.ts tests/unit/engineWait.test.ts tests/unit/slots.test.ts
# the walks (a few minutes; a failure prints seed and trace)
CI=1 npx playwright test score.fuzz score.renderer.fuzz --retries=0
# one song through, pictures included (about 30 s per form factor)
SEQ_SONG=song.folk.twinkle.rh SEQ_FACTORS=portrait,landscape npx playwright test --config playwright.tour.config.ts sequence.spec.ts
# the state gallery (builds first) and the corpus
npm run states            # or states:only, without the build; playwright.states.config.ts
npm run corpus            # playwright.corpus.config.ts; CORPUS= and CORPUS_FACTORS= narrow it
```

Four Playwright configs, one at a time (they share port 4173 and `test-results/`, `00-invariants.md`
§3): `playwright.config.ts` (e2e, four workers locally), `playwright.tour.config.ts` (the tour, the
sequence and the choices — it sets an `actionTimeout`, because a click on a button that never
enables otherwise retries for ever and reads as a hang), `playwright.corpus.config.ts` and
`playwright.states.config.ts`.

## What the corpus found (2026-09-09)

Four faults no single song could show, all found by an assertion rather than a picture: on a
piece with a pickup every window was drawn one bar late and nothing was ever coloured (the
engraver's draw range counts from the pickup's 0); on a piece with repeats nothing was coloured
on the first pass (one element, two ids, the second toggle undid the first); on the 780-bar
piece the stave moved between windows (no measurement, so the placement anchored on the ink);
and on a tablet the summary sheet sat above the screen (a grid with no explicit rows). The
assertion that found the first two — *the notes coloured current are the notes the run waits
for* — had not existed; the pictures had been read with the band over a white note and nobody
noticed the note was white.

## What a walk found, so far (2026-09-08)

Seven faults from reading the code (`decisions/2026-09-08-p21e-round-three.md`, round four), then
five more from the walks in their first hour: the engraver handing out detached elements for bars
it no longer shows; a slot engraved while `display: none`; no redraw after turning the phone; the
warning mark left on the sheet after a stop; a Wait run with a hand that has no notes. And three
from the before-and-after pictures of one song on the phone: a silent staff of rests taking half
of every window; the bar over the lower staff at the start of a run sideways; half the screen
black at the end of a song. The walks and the pictures find different things; both are run.

## Every spec file, one line each (2026-09-16)

The table above is a map of state machines; this is the index of files, so that a spec can be
found by name and nothing in the tree is a mystery. One line each, from the file's own header.
When a file is added, add its line; the table above gets a row only when the file proves a
transition.

### `app/tests/e2e/` — Playwright, headless Chromium, mocked Web MIDI (`playwright.config.ts`)

- `app-shell.spec.ts` — lands on Today, the five tabs, each tab's screen and hash.
- `audio.spec.ts` — the bundled soundfont is served and under budget; a gesture starts the AudioContext and notes schedule without throwing.
- `bisect-render.spec.ts` — batch worker for `tools/content/bisect_render.py`; skipped unless `CONTENT_BISECT_PLAN` is set.
- `carry-overs.spec.ts` — the six P18 carry-overs on screen: the control exists, the gesture works, the layout changes at the breakpoint.
- `chart.spec.ts` — the chord-chart view (`04` §3b) and the tablet breakpoint (§7a).
- `content-render.spec.ts` — every catalog item through the app's loader (`03` §3 step 10); writes `build/render-manifest.json`, keyed by file hash and OSMD version.
- `dark-ink.spec.ts` — notation readable in the dark wherever an `OsmdView` is on screen, the drill card included.
- `drills-harmony.spec.ts` — the seven P12b drill kinds, each answered with scripted input.
- `drills-review.spec.ts` — a miss pauses, going over the missed ones, Simon and its three levels of help, and the chain building up on a staff as it sounds; observed with a `MutationObserver` and, for the lit chain, a sampler that reads the card, the keys and the staff together (`04` §5c, §5c-2).
- `doors.spec.ts` — the three doors (`04` §2, §2b, §4): Today's tools, the Library's *Open as…* sheet, free play; pictures under `build/doors/`.
- `drills.spec.ts` — every drill kind with scripted input, and the keyboard strip as the instrument.
- `empty-states.spec.ts` — `04` §0 R4 on every screen, including the microphone's refusal pair.
- `engine.spec.ts` — the P3 acceptance criteria through the real renderer and a `ReplaySource` on `/dev/score`.
- `feedback-placement.spec.ts` — R6: a message beside the control that caused it, measured on Drill and Settings.
- `finder.spec.ts` — finders and the two-tap import: the action count against a simulated share.
- `folder.add.spec.ts` — adding a score from the folder all the way into the library.
- `folder.manifest.spec.ts` — the manifest-first listing at 342 × 740: the two sentences it has to say, and R1 held.
- `folder.rail-cost.spec.ts` — a letter jump moves the window rather than drawing the list up to it.
- `folder.readable.spec.ts` — archive titles readable upright: the words take the width, the buttons drop to their own line.
- `folder.spec.ts` — the score folder at the archive's size, seeded: pick, search, filter, Add's refusals.
- `generate-audio-fixtures.spec.ts` — one-off renderer for the mic detector's fixtures (`GENERATE_AUDIO_FIXTURES=1`).
- `guide-shots.spec.ts` — photographs the app for the guide into `public/guide/` (`GUIDE_SHOTS=1`).
- `guide.spec.ts` — the guide: every section in order, every picture shipped, every button landing.
- `keyboard-strip.spec.ts` — an update touches only the keys that changed and never rebuilds the DOM.
- `keys-guide.spec.ts` — the keys' three settings, each on its own: the guide ahead, finger numbers, the flash.
- `lab.spec.ts` — the accompaniment lab from the Library line, and Today's daily sight-read (`04` §2, §3c).
- `landscape.spec.ts` — R5: sideways on a phone the header is one line and the first content is within 48 px.
- `lesson-flow.spec.ts` — Today → Score → screen keys → summary → Progress → the review queue, joined.
- `library.spec.ts` — Library and own-score import: pick a file, see it, open it, keep it after a reload.
- `metronome.spec.ts` — the standalone metronome: reachable, the controls change what they say, Start runs the scheduler, leaving stops it.
- `mic.spec.ts` — the microphone path end to end through a real AudioWorklet, fed from a WAV.
- `midi.spec.ts` — the MIDI screen with the mock: connect, the strip lights, the log fills.
- `midi.unplug.spec.ts` — the cable pulled and put back in the real DOM; the pinned input that is not there.
- `offline.report.spec.ts` — what Diagnostics says about the offline story: the worker line, precached *n* of *m*.
- `offline.spec.ts` — the app works with the network off; Workbox's silent size skip is the fault it catches.
- `pdf-paper.spec.ts` — dark paper under the dark theme, and the one-off "turn the phone" sentence.
- `pdf.spec.ts` — the PDF viewer: one system at a time, adjust cuts surviving a reload, `?page=`.
- `perf.spec.ts` — the `01` §6 budgets under ×4 CPU throttling: regressions, not the phone's number.
- `plan.hierarchy.spec.ts` — Plan at 342 × 740: rows within R2, the one filled box, no unit heading repeated.
- `plan.spec.ts` — Plan, the lesson page and Skills review: every lesson openable, a self-pass badged apart.
- `progress.hierarchy.spec.ts` — Progress and Today's card at 342 × 740: row heights, the week's figure first.
- `progress.spec.ts` — Progress, Settings and Diagnostics: the P7 flow, the review queue tomorrow, the backup round trip.
- `score.arrange-race.spec.ts` — how many systems the stage holds must not depend on who wins the probe/freeze race.
- `score.bar-targets.spec.ts` — the control bar's targets against R4's forty pixels, in one row.
- `score.blind.spec.ts` — a blind run hides the notation and nothing else: count-in, dot and corner stay.
- `score.countin.spec.ts` — the count-in drawn large over the notation, and the beat dot during a run.
- `score.density.spec.ts` — how much room the music may take and where it sits: never stretched past natural spacing.
- `score.fill.spec.ts` — the music uses the screen it is on: a width floor on the dense pieces.
- `score.fuzz.spec.ts` — the seeded random walk over the whole Score screen, invariants after every action.
- `score.hearbar.spec.ts` — long-press a bar to hear it: one bar, both hands, once, the run put back.
- `score.layout.spec.ts` — screenshots at 1, 2 and 4 bars per window, and "the next bar is on the glass".
- `score.pickup-numbers.spec.ts` — one bar, one number everywhere: the pickup piece's bar 0 through the loop machinery.
- `score.readahead.spec.ts` — a beat of warning: the next-step mark and the paler next key, Tempo and Listen only.
- `score.renderer.fuzz.spec.ts` — the seeded random walk over `WindowRenderer` alone, on the dev harness.
- `score.rhythm-ladder.spec.ts` — rhythm only, the tempo ladder and the duet row on the real screen.
- `score.rotate.spec.ts` — turning the phone mid-run, paused, twice, in Scroll, and the tour's miniature.
- `score.run.spec.ts` — a whole run through the screen keys, first note to a summary that says so.
- `score.screen.spec.ts` — one test per control on the Score screen, a scripted run in each judged mode, the blind block.
- `score.sheet-rows.spec.ts` — a `⋯` row stays in one piece at 342 px: the steppers do not wrap.
- `score.slide.spec.ts` — sideways the sheet slides by bar, holding the cursor about a third across.
- `score.slots.spec.ts` — the two slots on a real engraving: the playing slot never redrawn, the next bar already there.
- `score.spec.ts` — the dev harness: the render budget, the window and scroll layouts, hands, bars per window.
- `score.stepper-limits.spec.ts` — a stepper at the end of its range greys out and costs nothing, no restart.
- `score.strip-span.spec.ts` — the keyboard strip shows the whole chord, not the bottom of it.
- `settings-rules.spec.ts` — `04` §0 on Settings: row heights, eight settings on the first screenful.
- `setup-layout.spec.ts` — the setup tour judged by geometry: nothing overlapping, at the owner's sizes.
- `setup.spec.ts` — the setup tour from an empty origin: every step, skip and finish remembered, Settings after.
- `shelf.spec.ts` — the shelf, paper practice and blind mode: no accuracy on paper, the score hidden while scored.
- `sweeps.spec.ts` — every lesson, every drill kind, one item of every type and source, walked.
- `tips.spec.ts` — the right tips file for a drill's parameters, open the first time and collapsed after; the practice module's rungs.
- `today.spec.ts` — Today: the session from the templates, Swap on every row with the "not a song" filter.
- `tour-practice-modes.spec.ts` — the guided tour's three steps opening the real Score screen and coming back.
- `update.tab-nav.spec.ts` — the tab bar survives a service-worker update.
- `wide.spec.ts` — wide screens (`04` §7a): seven shapes, gutters symmetric, content no wider at 1920 than at 1366.
- `scoreControls.ts`, `fixtures/` — not specs: the shared helpers for the `⋯` and tempo sheets, and the MIDI mock.

### `app/tests/unit/` — Vitest, no browser (`npx vitest run`)

- `AudioEngine.test.ts` — the AudioContext wrapper against a fake context: resume on a gesture, the gain node.
- `BeatScheduler.test.ts` — beats inside the look-ahead horizon and no others.
- `Metronome.test.ts` — the look-ahead loop on a clock the test owns: a beat the timer woke too late for, a control moved mid-run.
- `Piano.test.ts` — the soundfont URL against every base path, and inside the precache glob.
- `RingBuffer.test.ts` — oldest-first under capacity, oldest overwritten when full.
- `WebMidiSource.test.ts` — the cable pulled and put back, against a fake that models a disconnect in place.
- `accompanimentLab.test.ts` — the lab's harmony as pitch classes in every key, the fixed-harmony builder through OSMD, the day's seed.
- `alphaRail.test.ts` — which letter a title files under, and what the rail does with a list.
- `answerSheet.test.ts` — the staff behind *Show me*: the answer as notation with a key signature that fits, and a run drawn again as it grows without re-engraving what is already on it.
- `articulationVoicingShaping.test.ts` — staccato, legato, voicing and the half pedal: the edges of each judgement.
- `autoFit.test.ts` — fitting the sheet to the screen: zoom grows the staff's height and leaves the width alone.
- `backingLoop.test.ts` — one bar of the chord chart's backing loop: what plays, on which beat, at what pitch.
- `backup.test.ts` — export and restore: a PDF's bytes through base64, a merge that keeps later progress, a newer file refused.
- `backupStreaming.test.ts` — the backup never exists as one string.
- `boot.test.ts` — the shell's mount sequenced against `hydratePersisted()`, so the tab bar survives an update.
- `chordChart.test.ts` — the chart's beat handler: the first bar of every run drawn.
- `coaching.test.ts` — five coaching rules and one silence, the silence tested first.
- `compositionStatus.test.ts` — what the Library sheet says about a song's copyright, apart from its edition's licence.
- `contentFetchTimeout.test.ts` — a content read that stalls fails rather than hangs.
- `countIn.test.ts` — the count-in's arithmetic: the notated meter, the beat the run starts on.
- `curriculumIntegrity.test.ts` — every lesson points at a text file and catalog items that exist.
- `curriculumSelectors.test.ts` — `02` Part G as amended by D21, and the "swap this" query.
- `dailyReadStreak.test.ts` — the daily sight-read's run of days: the kind rule, a real gap resets.
- `dbUpgrades.test.ts` — every database version this app has shipped, upgraded, including skipped ones.
- `devicePreview.test.ts` — the tour's miniature stands for a phone even when not running on one.
- `diagnosticsMicRelease.test.ts` — Diagnostics closes the microphone it opened for a clip.
- `difficulty.test.ts` — the two levelling implementations agree within 0.2 stages over the fixtures.
- `drillAfterAMiss.test.ts` — how long a missed card stays up, and which prompts the going-over round is built from.
- `drillFromCatalog.test.ts` — every runtime drill in the shipped catalog builds and honours its parameters.
- `drillNotation.test.ts` — the transposition drill engraves each card once.
- `drillPrompts.test.ts` — every drill says what to do in words that are not its own name.
- `drillTheory.test.ts` — the translation between how the catalog talks and how the engine counts.
- `drillWalkthrough.test.ts` — the guided tour's drill half: routes, the position across a remount, Start over, Again, Back.
- `drills.test.ts` — the twelve original drill kinds, logic only.
- `el.test.ts` — `el()`'s selector understands `input#folder-search` as well as `div.row.wide`.
- `engineMic.test.ts` — the engine's microphone adaptations: an unsure report never advances or counts.
- `engineRhythmOnly.test.ts` — rhythm first: the same strike accepted inside the window and refused outside it.
- `engineScoring.test.ts` — outcome, hot spots, the timing histogram and stats, the weak-bars loop.
- `engineTempo.test.ts` — Tempo mode, the `05` §10 matrix.
- `engineWait.test.ts` — Wait mode, the `05` §10 matrix plus its edges.
- `errorBoundary.test.ts` — the banner and the debug report read one log; repeats counted, not stacked.
- `errorLogOverflow.test.ts` — the fifty-first kind of error is counted, not dropped.
- `everyOptionOpens.test.ts` — every option a lesson offers is real, and one that cannot be opened says why.
- `expectedNote.test.ts` — naming the note Wait mode is waiting for.
- `fitDetail.test.ts` — detail lines cut by whole facts, not mid-word.
- `folderAssign.test.ts` — a score added from the folder can reach a rung.
- `folderHandles.test.ts` — remembering the score folder: the stored handle, and every way it falls back to the picker.
- `folderLibrary.test.ts` — the manifest read by field name; a PDF listed as kind `pdf` and added as a PDF import.
- `folderListing.test.ts` — what the screen says about a listing it did not build by walking.
- `folderManifestFirst.test.ts` — the manifest is the index; the walk is the fallback.
- `folderReopen.test.ts` — reopening a saved folder and adding one piece out of it, without re-reading the archive.
- `folderScreenAtScale.test.ts` — the folder screen over a 600-row listing: the rail, a jump, a search; the newest folder shown.
- `folderStorage.test.ts` — what a listing costs to read and change: relationships between a small folder and one twenty times its size.
- `folderWalkWorker.test.ts` — the walk goes to a worker, comes home when it cannot, and resumes when interrupted.
- `harmony.test.ts` — chord symbols out of MusicXML: root, kind, measure number.
- `harmonyDrills.test.ts` — the seven P12b harmony and ear drills, the chord-boundary rule most of all; a revealed prompt judged but not counted.
- `heldChord.test.ts` — naming a chord from the keys that are down: the bass decides between two names for one set of notes, an inversion keeps its root.
- `importOverlay.test.ts` — an imported piece becomes an option of the rung.
- `importStore.test.ts` — importing the owner's scores: the happy path and the parser's one sentence.
- `importSummaries.test.ts` — the catalog overlay stops reading every score's bytes on every screen.
- `inputPolicy.test.ts` — the microphone's effect on playback, metronome and scoring.
- `inputSources.test.ts` — `ScreenKeyboardSource` and `ReplaySource`, and the replay script parser.
- `labRoute.test.ts` — `?seed=` and `#/lab`: parse, round-trip, refusals.
- `latency.test.ts` — pairing taps with clicks and signing the delta.
- `lessonCompletePerf.test.ts` — `lessonComplete` no longer rebuilds two Sets over the whole history per call.
- `lessonPaperBookPicker.test.ts` — "I have this on paper" asks which book when there is more than one.
- `lessonShape.test.ts` — what every lesson owes a learner, and the numbers it is allowed to quote.
- `lessonVideos.test.ts` — every lesson's video links are links to a video, not a channel page.
- `levelOverrides.test.ts` — the owner's own difficulty numbers reach every reader of a level and survive a backup.
- `levelSource.test.ts` — what the app does with `levelSource`: how a level prints, which alternative comes first.
- `libraryRowRanking.test.ts` — the Library's rows ranked: `RH`/`LH` only where it is news; the drop target is the list.
- `logsAreBounded.test.ts` — the render-timing ring and the error log stay bounded however long the app runs.
- `loopbackLatency.test.ts` — the acoustic loopback measurement, and the gate that keeps it away from a MIDI user.
- `markdown.test.ts` — the lesson-page markdown renderer builds DOM and keeps markup as text.
- `metronomeScreenStop.test.ts` — Stop and leaving cancel the late-painted beat dots.
- `micCalibration.test.ts` — the calibration measurements against rendered piano.
- `micCalibrationStore.test.ts` — a stored calibration from an older or corrupted build degrades to "not calibrated".
- `micLatencyOnce.test.ts` — the input delay is removed exactly once, on every path.
- `micScreenRefusal.test.ts` — a dismissed prompt is not a refusal; leaving the screen closes the microphone.
- `micSourceConnect.test.ts` — `connect()` called twice, and the clock a note is stamped on.
- `midiConnectInFlight.test.ts` — two callers asking for the piano at once is one prompt.
- `midiScreenDevices.test.ts` — the Inputs list when the pinned input is not there.
- `needs.test.ts` — the rung's shortfall counted at runtime, in step with `validate.py`'s `write_needs`.
- `offlineStatus.test.ts` — what Diagnostics is told about the offline story.
- `paperScreenTwin.test.ts` — a shelf piece's twin checked before "Practise with the score" is offered.
- `parseMidiMessage.test.ts` — the MIDI parser: velocity-0, the CCs, note names.
- `pdfDetectionOrder.test.ts` — the PDF viewer's background detector fans out from the opened page.
- `pdfPageCache.test.ts` — the rendered-page cache never evicts a page a draw needs.
- `pdfScreenDetection.test.ts` — only the opened page is detected before the viewer draws; the result is written back once.
- `pdfSystemPlan.test.ts` — the reading position survives cuts edited on another page.
- `pdfSystems.test.ts` — cutting a page into systems, on images built for each case.
- `pdfTiming.test.ts` — Timed learns a system's length from two taps, else bpm × bars.
- `persist.test.ts` — the settings mirror: IndexedDB the record, localStorage the sync read, the asymmetric case.
- `pieceExtent.test.ts` — how much room a system of a piece needs: no height that no system has.
- `pitchDetector.test.ts` — the detector against real piano audio, the `05` §11.6 thresholds.
- `pitchDsp.test.ts` — the DSP pure functions: spectrum, harmonic score, background, confusion guards.
- `placementTargets.test.ts` — every placement outcome names a unit that exists.
- `planHierarchy.test.ts` — what the Plan screen says first, second and last.
- `planNoUnobtainableRungs.test.ts` — no rung is built around music the owner can never get.
- `planStageChevron.test.ts` — the chevron closes a stage as well as opening it.
- `planTracksGrouped.test.ts` — the Tracks sheet: what is on, in stored order, then the rest in families.
- `planTracksSheet.test.ts` — the Tracks sheet's own status line, and `core`'s refusal said inside it.
- `plural.test.ts` — one of a thing without an s, none with one.
- `prerequisites.test.ts` — strict prerequisites both ways; D17 first.
- `progressAtScale.test.ts` — the day a session belongs to, a restore, and finding a rare run in a long history.
- `progressRanking.test.ts` — Progress ranked: the figure first, no badge on every row, rows that open the piece.
- `progressScreenRepertoireAndGoal.test.ts` — the repertoire list capped; the weekly-goal message beside its control.
- `progressStore.test.ts` — pass, master, the review queue and the weekly goal, on the memory fallback.
- `readAheadScale.test.ts` — the read-ahead cap on the sideways fit.
- `redrawFailure.test.ts` — a redraw that fails says so instead of leaving the old screen standing.
- `reorder.test.ts` — reordering arithmetic, the off-by-one both ways.
- `rhythmCountIn.test.ts` — the rhythm drill's count-in and clock.
- `router.test.ts` — every route shape parses, refuses rubbish, and round-trips; every real lesson id.
- `rungFor.test.ts` — an estimated level turned into the rung it refers to.
- `scoreModel.test.ts` — the golden models for every fixture.
- `scoreModelKnownIssues.test.ts` — upstream OSMD defects asserted *broken* on purpose, so an upgrade says when a workaround can go.
- `scoreSession.test.ts` — the session's state machine with a fake renderer and a hand-cranked frame.
- `scoreSheetRows.test.ts` — the Duet and Ladder rows carry state across a toggle.
- `scoreSmoke.test.ts` — the fixtures exist and one extracts.
- `scoreTourRoute.test.ts` — the Score screen opened by the guided tour: `?mode=`, `?loop=`, the three exits.
- `scoreTypes.test.ts` — beats, ticks, tempo and time-signature lookups, note ids.
- `selectorsCacheInvariant.test.ts` — the hoisted-Sets cache keyed on array identity, and the one way it could go wrong.
- `serviceWorkerUpdates.test.ts` — the update prompt and the update check, against `app/updates.ts`.
- `session.test.ts` — the session builder: templates, no item twice, an unfillable row dropped, the swap sheet never empty.
- `sessionRetention.test.ts` — the `sessions` store does not grow without limit.
- `settingsDownload.test.ts` — "Download everything now": progress, Stop, and where its message appears.
- `settingsRoundTrip.test.ts` — every setting survives being read back.
- `setupProgress.test.ts` — coming back to the setup tour where you left it.
- `sheetIsolation.test.ts` — a sheet takes the screen behind it out of reach.
- `shelf.test.ts` — the shelf's migration, its place in the backup, and which rungs a paper pass may finish.
- `shelfLoadFailure.test.ts` — a shelf that cannot be loaded says so.
- `shelfRanking.test.ts` — the Shelf ranked: no heading over its own title, the piece's title gets the room.
- `shelfScreenRedraw.test.ts` — saving one piece redraws that piece, not the whole shelf.
- `shelfTwinSearch.test.ts` — the twin search debounced, bounded at six, matching the composer too.
- `sightReading.test.ts` — the generator through OSMD and the extractor, including the left hand alone.
- `simonDrill.test.ts` — Simon: the chain grows, breaks, is scored, the two catalog items played, the three levels of help and the missed chain that comes back, the chain as a list of moments the screen lights, names and engraves from, and `simonForStage` checked against where the curriculum puts them.
- `skillsFromPractice.test.ts` — finishing a lesson by playing it teaches its concepts.
- `slots.test.ts` — the two slots' arithmetic, including what "next" means at a repeat.
- `spaFallback.test.ts` — a static host's `index.html` for a missing path is not a tips file.
- `staffCard.test.ts` — the hand-drawn staff puts G4 and F3 where every reader expects them.
- `stats.test.ts` — mean, sample sigma, range, median.
- `statusLine.test.ts` — the error colour belongs to the message, not the line.
- `steadiness.test.ts` — tempo steadiness on scripted onsets: chords once, orphans excluded.
- `storagePersistence.test.ts` — whether the browser promised to keep the storage, a blocked open, and the owner told.
- `stripRange.test.ts` — how much keyboard the strip shows.
- `systemPlan.test.ts` — detected staff bands into steppable systems, corrected by hand, in fractions of the page.
- `tablet.test.ts` — the tablet breakpoint on the shortest side.
- `tapTempo.test.ts` — tap tempo: the average of the last four, a restart after silence, a duplicate tap dropped.
- `tempoLadder.test.ts` — the tempo ladder as one pure rule.
- `tips.test.ts` — the tips index after a launch that lost the network.
- `toastStack.test.ts` — the error banner and the update toast stack rather than overlap.
- `todayCardRanking.test.ts` — Today's card ranked.
- `todayInputChip.test.ts` — the input chip follows a piano that connects late.
- `todaySessionLength.test.ts` — the session-length picker remembers which day it belongs to.
- `tracks.test.ts` — one answer to "which tracks are on".
- `trimMusicXml.test.ts` — the probe loads the first bars of a piece, not the piece.
- `wavEncode.test.ts` — the WAV writer behind the Diagnostics capture round-trips.
- `docsConsistency.test.ts` — the documents against the code: `03`'s sections and module names, `04`'s sub-screen headings.
- `helpers/` — shared fixtures and fakes, not tests.

### `app/tests/states/` — the score screen's state gallery (`npm run states`, `playwright.states.config.ts`)

- `score.states.spec.ts` — one picture per state of `08-score-render-states.md` §2, each measured against §9 and its own claims.
- `audit.ts` — the geometric sweep: chrome over chrome, clipping, off-viewport controls, targets under 40 px.
- `gallery.ts` — shooting a cell, checking it against the record, building the sheet.
- `probe.ts` — what the screen is, measured in one `page.evaluate` per cell.

### `app/tests/tour/` — the UX tour (`npm run tour`, `corpus`, `choices`; `playwright.tour.config.ts`, `playwright.corpus.config.ts`)

- `tour.spec.ts` — not a test: every screen and state photographed on four form factors into `build/tour/`.
- `sequence.spec.ts` — the whole song through, first note to summary, on every form factor; `SEQ_SONG`, `SEQ_FACTORS`.
- `corpus.spec.ts` — thirteen pieces chosen to differ, on six form factors, the sequence's invariants after every step.
- `choices.spec.ts` — the same screen shot several ways, for the owner to pick between.
- `audit.ts` — the machine's half of the review: the six shapes of defect the pictures showed, looked for on every screen.
- `seed.ts` — a used phone's worth of data put into the app before photographing it.
- `shoot.ts` — the camera and the contact sheet, shared so every run names its pictures the same way.

### `tools/content/tests/` — Python, `python -m unittest discover tools/content/tests`

- `test_abc_tools.py` — the ABC preprocessor: inline voices to blocks, fingerings extracted.
- `test_author.py` — `author.py` against the real authored sources.
- `test_bar_splits.py` — a bar the edition wrote short stays short (`03` §3d).
- `test_convert.py` — `convert.py` against a sample of every input format; the grand-staff merge.
- `test_convert_cache.py` — the conversion cache: same inputs hit, anything that changes the file misses.
- `test_export_durations.py` — lengths the MusicXML writer cannot name, settled or refused (`03` §3c).
- `test_finder.py` — the generated finders, search line and chat prompt.
- `test_fingering.py` — the generator's fingering tables against Clementi's chart: the thumb positions.
- `test_generator.py` — the exercise generator's catalog output; ids that must not collide.
- `test_generator_fingering.py` — fingerings on melodic lines the chord check cannot see.
- `test_hanon.py` — Hanon 1–20 against the printed score.
- `test_harmony_families.py` — the P12b harmony families, one class per family.
- `test_import_kern.py` — the `[KERN]` importer's licence gate on tiny fixture repositories.
- `test_import_musetrainer.py` — the two builds carry the same ids.
- `test_levels.py` — the one level table.
- `test_licensing.py` — the licence gate: NC never bundles, absent never bundles, undated never bundles.
- `test_loose_attributes.py` — a key signature Humdrum writes between two bars reaches the bar it belongs to.
- `test_note_loss.py` — the note-loss gate: the counters, the decision, one rag end to end.
- `test_pdmx.py` — the PDMX quarry gate by gate and once end to end, on a fixture archive.
- `test_render_check.py` — the judgements `render_check.py` makes about a render report.
- `test_renumber.py` — bars numbered from 1 unless the first bar is a pickup.
- `test_serve_lan.py` — the laptop as the app's origin: the manifest type, `Service-Worker-Allowed`, the certificate.
- `test_silent_staff.py` — a staff with nothing to play is left out.
- `test_technique_units.py` — `add_technique_units.py` is idempotent.
- `test_tips.py` — drill tips and their rules: a kind without a file, a `when:` no drill carries.
- `test_truncation_scan.py` — the grace-16th truncation scan catches the signature and not the ordinary short bars.
- `test_validate.py` — the cross-reference and option-count rules.
- `test_validate_p11.py` — one track list, orphans, estimated levels.
- `test_validate_reach.py` — a core rung may not reach too far above its stage for a song.
- `test_validate_sections.py` — named sections name bars the piece has, from either bar-count source.
- `mxlutil.py`, `fixtures/` — helpers and fixtures, not tests.
