# Lesson audit — batch 4

Instruments: `python tools/content/dump_score.py <id>` for every score named below; the
rung JSON in `content/curriculum/stage-<n>.json`; the catalog rows in
`app/public/content/catalog.json` (`notation`, `tracks`, `tags`, `source`, `drill.params`);
the MusicXML read directly where the dump does not show a thing (ties, fingerings,
`<words>`, repeats); the app code cited per finding. Nothing here has been heard.

## theory.5 — `content/lessons/theory.5.md`

Claims checked: 16. Findings: 3.

- [x] **STALE** `content/lessons/theory.5.md:44` — "**Simon, on every key.** The chain game from Stage 3 again"
  - Is: the every-key chain (`drill.ear.simon-chromatic`) is already on the Stage 4 theory rung, so Stage 5 is its second appearance, not the step up from Stage 3's white keys. The white-key chain is on `1.5` and `theory.3`.
  - Evidence: `theory.4` `exerciseOptions` = cadences, melodic-dictation, inversions, `drill.ear.simon-chromatic` (`stage-4.json`); `simonForStage` in `app/src/engine/drills/simon.ts` names Stage 4 as the switch. The rest of the paragraph checks out: range G3–G4 chromatic, `help: keys-after-miss`, replay-lit-and-retry (`simon.ts` `SIMON_HELP_LEVELS`).
  - Fixed: now "The every-key chain game from Stage 4 again … drawn from all twelve keys around middle C rather than the white ones of Stage 3" — `drill.ear.simon-chromatic` is in `theory.4` `exerciseOptions` (stage-4.json:973) and `simonForStage` switches at stage 4 (`simon.ts:283-284`); the white-key chain is on stage-1 and stage-3 rungs.
  - Second read (2026-09-22): HOLDS — in the sample of 2026-09-21 and re-run here. The authored rungs walked: `theory.4` (stage 4) and `theory.5` (stage 5) both hold `drill.ear.simon-chromatic`, `1.5` (stage 1) and `theory.3` (stage 3) both hold `drill.ear.simon-c-major`, and `simonForStage` returns the chromatic item at `stageNumber >= 4`. The chromatic row's params are `{low G3, high G4, steps chromatic, rounds 12, help keys-after-miss}` — twelve keys around middle C, so both halves of the sentence are on the data.
  - Row: `lessonClaimsAboutApp.test.ts` › "theory.5: the every-key chain starts at Stage 4, and Stage 3's chain is the white-key one"
- [ ] **JUDGEMENT** `content/lessons/theory.5.md:12` — "**Four seventh-chord qualities** cover nearly everything"
  - Is: this leaves out the fully diminished seventh. The drill does test exactly these four (`drill.ear.seventh-qualities` qualities `maj7, 7, m7, m7b5`), so it matches the app. Whether it "covers nearly everything" is for a musician to judge.
  - Evidence: catalog `drill.params`.
  - Reader 1: REWRITE — "**Four seventh-chord qualities** are the ones this rung drills, and they cover most of what you will meet". The sentence's job is to say which four to learn, and the rung's own drill settles that: `drill.ear.seventh-qualities` tests exactly `maj7, 7, m7, m7b5`. "Cover nearly everything" is a claim about the repertoire, and it is the clause that has to leave out the fully diminished seventh to stay true. The rewrite ties the four to the drill, which is checkable, and hedges the coverage, which is not.
- [ ] **JUDGEMENT** `content/lessons/theory.5.md:37` — "Mixolydian's flat seventh removes the leading tone, so the music never pulls home and can circle indefinitely"
  - Is: the flat seventh is correct theory. "never pulls home" is a generalisation a musician might dispute.
  - Evidence: theory knowledge only.
  - Reader 1: REWRITE — "Mixolydian's flat seventh removes the leading tone, so nothing leans on the tonic the way a major key does and the music can circle." The theory in the first clause is right and stays. "Never pulls home" overstates it: the tonic is still the tonic, and a Mixolydian phrase can settle on it perfectly well — what is gone is the semitone pull of the leading tone, which is the actual mechanism the paragraph is teaching. The rewrite says the mechanism instead of the outcome.

Not checked in this lesson: the mastery line "two progressions recognised in unfamiliar music, and one tune transposed into three keys". The rung has no transposition item, and the lesson does not say it has one.

## improv.5 — `content/lessons/improv.5.md`

Claims checked: 13. Findings: 1.

- [x] **FALSE** `content/lessons/improv.5.md:39` — "At the end of a backing-track run the app plays your own notes back to you, at the speed and the dynamics you played them."
  - Is: nothing plays by itself. The result sheet shows a *Listen back* button, but only when something was recorded, and it plays only when tapped. The playback keeps your onsets and velocities, but every note sounds for a fixed 0.9 s, so note lengths are not as you played them.
  - Evidence: `app/src/ui/screens/DrillScreen.ts:2095-2097` (the button, shown only if `lastRecording.length > 0`); `playRecording` at `:480-495`, `durationSec: 0.9` at `:491`; `lastRecording` is set only for `BackingTrackDrill` (`:2027`).
  - Fixed: now "tap *Listen back* and the app plays your own notes back to you, with the timing and the dynamics you played them, though every note is held for the same short length" — the button is offered only when a recording exists and plays only on tap (`DrillScreen.ts` ~2095), and `playRecording` keeps onsets and velocities with `durationSec: 0.9` (~491). Whether to replay note lengths is the owner's decision.
  - Second read (2026-09-22): HOLDS — the code has moved down the file and says the same thing: `DrillScreen.ts:2236-2238` renders the *Listen back* button only inside `lastRecording.length > 0` and only its `onClick` calls `playRecording`; `:2168` sets `lastRecording` from `drill.recording` only when the drill `instanceof BackingTrackDrill`; `playRecording` (`:505`) replays each note at its own `tMs` and `velocity` with a fixed `durationSec: 0.9` (`:516`). So the sentence's three clauses — a tap, the timing and dynamics kept, one length for every note — are each on the page.
  - Row: `lessonClaimsAboutApp.test.ts` › "improv.5: Listen back is a tapped button that replays each note's own velocity at one fixed length"

Checked and true: the blues scale is C E♭ F F♯ G B♭ C (`exercise.blues-scale.c.1oct.right` bar 1). The three songs are the same twelve bars in C, F and G (`exercise.blues.twelve-bar-shuffle.c/f/g`, IV at bar 5 and V at bar 9, LH written). The shuffle was met on the blues track (`blues.4`). The backing track's twelve-bar puts IV at bar 5 and V at bar 9 (`fromCatalog.ts` `twelveBarLoop`). The blues track gives the reason for spelling the fifth as a raised fourth (`blues.4.md:37-46`). "Nothing to save" is correct: the recording is not persisted (`DrillScreen.ts:476-478`).

Not checked in this lesson: nothing.

## latin — `content/lessons/latin.md`

Claims checked: 24. Findings: 2.

- [x] **FALSE** `content/lessons/latin.md:43` — "Its second part and *El Choclo* — another tango — are under Latin in the Library"
  - Is: *La Cumparsita* part B is not under Latin. Its `tracks` field is `['classical']` only. *El Choclo* is under Latin (`['latin', 'classical']`), and so are *Carioquinha* (`['latin']`) and *Malagueña* (`['latin', 'classical']`).
  - Evidence: catalog `tracks` of `song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-b.pdmx`. The Library's Track filter matches `item.tracks` (`LibraryScreen.ts:105`).
  - Fixed: now "Its second part is under Classical in the Library, and *El Choclo* — another tango — is under Latin there" — catalog `tracks`: part B `['classical']`, El Choclo `['latin', 'classical']`.
  - Second read (2026-09-22): WRONG (part B is under Latin now, so the original sentence was the true one and the fix made it misleading) — `content/sources/pdmx.json` gives `song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-b.pdmx` `tracks: ["latin"]` and the built `catalog.json` row carries `['classical', 'latin']`; part A is `['classical', 'latin']` and El Choclo `['latin', 'classical']`. The curation changed under the fix: the audit read `['classical']` on 2026-09-19 and the source file is unmodified in the working tree, so the change is committed history, not this tree. **Corrected:** `latin.md:43` is back to "Its second part and *El Choclo* — another tango — are under Latin in the Library, with *Carioquinha* …"; body 496 words, `readingTime` 3 unchanged.
  - Row: `lessonClaimsAboutApp.test.ts` › "latin: both La Cumparsita parts, El Choclo, Carioquinha and Malagueña are under Latin in the Library"
- [ ] **HISTORY** `content/lessons/latin.md:42` — "*La Cumparsita* (1916)"
  - Is: the catalog does not record a year. Its `editionNotes` say "composer not in composers.json". A historian should confirm the date.
  - Evidence: catalog `source.editionNotes` of the part-A row.
  - Reader 1: UNSURE (nothing in the repository dates it, and the catalog is thinner than the finding's own note suggests) — both rows re-read: `…parte-a.pdmx` is titled "La Cumparsita (part A)" with `composer: "Gerardo Matos Rodríguez, arr. Javier Tucat Moreno"` and `…parte-b.pdmx` with `composer: "NA"`; neither carries a year field, and the `editionNotes` on each are the importer's boilerplate, ending "Composition status: unknown — composer not in composers.json" and "— no composer named". So the app knows who wrote it and not when. This reader believes the 1916 date is the conventional one and will not assert it: the lesson prints it as a bare fact beside titles whose other years (Tico-Tico 1917) **are** carried in the catalog, and the difference matters. **What would settle it:** a year on the row, the way the 1920 jazz rows and the 1928 Pinetop row carry theirs in their titles.

Checked and true:
- The clave strokes match the exercises: 3-2 offsets `[0, 1.5, 3, 5, 6]` and 2-3 offsets `[1, 2, 4, 5.5, 7]`.
- The tumbao falls on the "and" of 2 and on beat 4, with beat one empty (`exercise.tumbao.c` bar 1: `r/qua. G2/qua r/eig F2/qua`).
- The montuno is in thirds and locked to the clave (`exercise.montuno.c.2note.son-3-2`).
- The rung has six songs, as the lesson says. *Cielito Lindo* is in 3/4. The two bossa novas are Jobim.
- Tico-Tico 1917 matches the catalog's `editionNotes` ("Abreu 1917").
- *Rhythm only* judges timing only (`GuideScreen.ts:153`, `ScoreScreen.ts:2311`).
- "*La Cucaracha* is not in the library yet": a raw search of `catalog.json` for "cucar" found 0 matches, and a second search over titles and ids found 0.

Not checked in this lesson: "the one unmistakable error in the style" and "the hardest coordination in the app" are judgements, not listed.

## technique.5 — `content/lessons/technique.5.md`

Claims checked: 22. Findings: 6.

- [x] **FALSE** `content/lessons/technique.5.md:30` — "These exercises are scored on the slope: the app checks that the velocity rises across the run and covers real ground, so a line that wobbles will not pass."
  - Is: no code judges the slope. `shapingScore` exists but nothing in the app calls it. `exercise.shaping.a.crescendo` opens as an ordinary score, judged on pitch and timing. Also, its notes rise from A4 to A6 in bars 1–2 and fall back to A4 in bars 3–4, and the score carries no crescendo marking beyond the text "Grow evenly from the first note to the last".
  - Evidence: `shapingScore` is defined at `app/src/engine/Scoring.ts:376`. A grep for `shapingScore` in `app/src` finds only that definition. A second, case-insensitive grep for `shaping` in `app/src` finds only `Scoring.ts`. There is no `shaping` case in `fromCatalog.ts`.
  - Fixed: now "The exercise here opens as an ordinary score, judged on the notes and their timing; the app does not measure the velocity, so the slope is yours to judge." — rechecked: `targetFor` opens any item with a `file` as a score (`openItem.ts:23-31`); `drillFromCatalog` has no `shaping` case; `shapingScore` has no caller (grep `shapingScore` and `'shaping'` in `app/src`). Whether to wire the scorer is the owner's decision.
  - Built (2026-09-21): `shapingScore` runs for a run of the shaping exercise, against the `minVelocityRange` the row itself states, and the sheet carries a *Crescendo* line. The sentence now reads "The app measures the slope: the sheet says how far your line travelled against the distance this exercise asks for". The rule’s known weakness — a line that sits and then jumps passes — is unchanged and the lesson already named it.
  - Second read (2026-09-22): HOLDS of the sentence as it stands now, which the build changed under the fix — `technique.5.md:29-31` reads "The app measures the slope: the sheet says how far your line travelled against the distance this exercise asks for, and how much of it went the right way." `shapingScore` now has a caller: `Scoring.ts:519`, inside `techniqueMeasureFor`, which `ScoreScreen.ts:2076` calls for the run's own item; the `shaping` branch (`Scoring.ts:515-535`) reads `minVelocityRange` off the row's own `drill.params` and writes "travelled N of the M asked for, P% of it in the right direction". `exercise.shaping.a.crescendo` carries `{kind: shaping, params: {key A, shape crescendo, minVelocityRange 30}}`, so the distance is the exercise's own and not a constant in the code.
  - Row: `lessonClaimsAboutApp.test.ts` › "technique.5: the shaping exercise is measured against its own minVelocityRange, and the sheet line says the distance travelled and the share in the right direction"
- [x] **WRONG-COUNT** `content/lessons/technique.5.md:30` — "These exercises are scored on the slope"
  - Is: the rung has one shaping exercise, `exercise.shaping.a.crescendo`.
  - Evidence: the `technique.5` `exerciseOptions` (13 items) in `stage-5.json`.
  - Fixed: same sentence, now singular ("The exercise here") — `technique.5` `exerciseOptions` has one shaping item, `exercise.shaping.a.crescendo` (stage-5.json:638).
  - Second read (2026-09-22): HOLDS — all 13 of `technique.5`'s `exerciseOptions` were walked and exactly one carries `drill.kind === 'shaping'`, `exercise.shaping.a.crescendo`; no other option on the rung carries a `shaping` drill block. The fix's singular was overwritten by T10's rebuild of the same sentence ("The app measures the slope"), which names no count at all, so nothing in the lesson asserts a plural now either.
  - Row: `lessonClaimsAboutApp.test.ts` › "technique.5: exactly one exercise on this rung asks to be scored on a slope"
- [x] **FALSE** `content/lessons/technique.5.md:34` — "since the app will tell you it passed: a line that stays quiet and then jumps at the end also satisfies the rule."
  - Is: the app does not apply this rule, so it never tells you a crescendo passed. Read on its own, the unused code would pass such a line: level steps count as "moving the right way".
  - Evidence: as above. The rule is `range >= 30 && monotonic >= 0.7` with `delta >= 0` counted (`Scoring.ts:386-402`).
  - Fixed: now "a line that stays quiet and then jumps at the end passes just the same … even though the score does not" — the app will pass it, because the score is judged on pitch and timing only (evidence above); no velocity rule applies.
  - Second read (2026-09-22): HOLDS, for a different reason than the fix gave — the fix's reason ("no velocity rule applies") stopped being true when T10 wired `shapingScore`, and the sentence is still right, which is `working-rules` §2.16 in the other direction. Read at `Scoring.ts:379-407`: `range` is `last − first` and `monotonic` is the share of adjacent pairs whose delta is `>= 0`, so a line that sits flat and then jumps has every delta at 0 except one large positive — `monotonic` 1.0 against `minMonotonic` 0.7 and a `range` well over the exercise's 30 — and `passed` is true. The rule's own docstring names this weakness.
  - Row: `lessonClaimsAboutApp.test.ts` › "technique.5: a flat line that jumps at the end passes the slope rule, and a line that only rises a little does not"
- [x] **FALSE** `content/lessons/technique.5.md:66` — "the score will pass both, as the lesson says above"
  - Is: the same fault. Neither a jump nor a real crescendo is judged on velocity.
  - Evidence: as above.
  - Fixed: sentence left as it is — with the paragraph above corrected, "the score will pass both, as the lesson says above" is now true: an ordinary score passes a jump and a crescendo alike (evidence above).
  - Second read (2026-09-22): HOLDS — still true after the build, by a different route: the slope is now measured but cannot fail a run. `techniqueMeasureFor` reports the *Crescendo* line beside the accuracy (`Scoring.ts:515-535`) and `ScoreScreen.ts:2093` makes it binding only when `demandsTechniqueMeasure(rung?.mastery.custom, kind)` is true; that function returns false for an undefined `custom` (`Scoring.ts:706-707`), and `technique.5`'s `mastery` is `{exercisesRequired 2, songsRequired 0, minAccuracy 0.9, minTempoPct 0.8}` with no `custom` key at all. So a jump and a real crescendo both pass, which is what the mastery line says.
  - Row: `lessonClaimsAboutApp.test.ts` › "technique.5: the slope is reported beside the accuracy and this rung does not make it a condition of passing"
- [x] **FALSE** `content/lessons/technique.5.md:56` — "in the left hand, which is where a mordent is hardest and where the music of Stage 6 will ask for it"
  - Is: no Stage 6 rung item has a left-hand mordent. The only mordents in Stage 6 are 3 in the right hand of `song.classical.chopin-waltz-a-minor` (`classical.6`).
  - Evidence: a script over all 88 file-backed song and exercise options in `stage-6.json` counted `<mordent>`/`<inverted-mordent>` elements per staff. It found LH 0 and RH 3, all in that one piece. The other 12 options are drills with no score. The count is a proxy: it does not see mordents written out as plain notes.
  - Fixed: the clause "and where the music of Stage 6 will ask for it" is deleted; the sentence ends "which is where a mordent is hardest." — re-ran a count over the 83 file-backed options in stage-6.json: 3 `mordent` notes, all staff 1 of `song.classical.chopin-waltz-a-minor`, none in a left hand (a proxy that does not see written-out mordents).
  - Second read (2026-09-22): HOLDS, on a corrected count — every Stage 6 rung's `songOptions` and `exerciseOptions` were walked (112 options, 103 of them file-backed; the stage has grown since the fix, which read 83) and each `.mxl` opened and searched note by note for `mordent`. Five marked notes now, not three: three in `song.classical.chopin-waltz-a-minor` and two in `song.folk.por-una-cabeza-carlos-gardel.pdmx`, and **all five are staff 1**. So Stage 6 still asks for no left-hand mordent and the deletion stands. The same proxy limit as the fix: a mordent written out as plain notes carries no `<mordent>` and is not counted.
  - Row: `lessonClaimsAboutMusic.test.ts` › "technique.5: the rung's mordent exercise is left hand only, two notes to the beat, each one main–below–main" — the deleted clause itself gets no row: there is no sentence left to read, and a row over Stage 6's mordents would pin a deletion rather than a claim. The row reads what the sentence still says.
- [ ] **UNVERIFIED** `content/lessons/technique.5.md:60` — "one page each"
  - Is: page count is not in any field. The études are 31, 22 and 21 bars.
  - Evidence: catalog `notation.bars`.
  - Reader 1: WRONG to leave as a measurement, and it cannot be made one — a page is a property of an engraving, and this app re-engraves every score at the reader's own size, zoom and window, so "one page" is not a fact about the file and never will be. The measurable thing is the length: Duvernoy Op. 176 Nos. 4, 5 and 6 are 31, 22 and 21 bars, re-read from `notation.bars`. Smallest true change: say the bars, or say "short" — "three études of twenty to thirty bars each". **What would verify the sentence as written:** nothing available; there is no page-count field and no fixed engraving to count.

Checked and true:
- The repeated notes are fingered 3-2-1 on every group (`exercise.repeated-notes.c.3x.left`: triplet eighths, `<fingering>` 3 2 1 ×8).
- The 2:1 exercise has eighths over quarters (`exercise.independence.c.2v1`).
- The tie across the bar line is F4 tied into bar 2 (`<tie>`, `exercise.syncopation.tied-across-bar`).
- 5/4 is marked "Count 3 + 2".
- The sight-reading generator is at level 4.
- The mordent is written main–below–main on the beat in the LH, two notes to the beat (`exercise.mordent.c.2pb.left`).
- Duvernoy Op. 176 Nos. 4, 5 and 6 are on the rung in that order.
- The rung has a Duet tool.

Not checked in this lesson: "4-3-2-1 for four" is not on this rung (it is on `technique.6`), and "always coming towards you" was read as advice.

## rock.5 — `content/lessons/rock.5.md`

Claims checked: 15. Findings: 5.

- [x] **FALSE** `content/lessons/rock.5.md:28` — "these are the two pieces in the library that actually print it"
  - Is: seven library songs print a suspended chord symbol. Beyond the two on the rung (*Annie's Song* Dsus4, *andata* D♯sus4) they are:
    - `song.folk.ga-je-mee-op-zoek-naar-het-koningskind.pdmx` (Dsus4)
    - `song.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx` (Dsus4)
    - `song.jazz.george-shearing-lullaby-of-birdland.pdmx` (E♭7sus4)
    - `song.jazz.the-dave-brubeck-quartet-take-five.pdmx` (F7sus4)
    - `song.jazz.marc-sabatella-harmony-and-chord-progressions.pdmx` (A7sus4, D9sus4)
  - Evidence: a scan of `notation.chords` over every `song.*` row for `sus|add9|add2` returned 7 rows. This proxy covers chord symbols only. Unlabelled sus voicings in the notes were not searched.
  - Fixed: now "this rung teaches a sound, and both of these print it in their chord symbols" — the "only two in the library" claim is gone; both rung songs do print a sus chord (Annie's Song bar 0 Dsus4; andata `suspended-fourth` in `dump_score.py`).
  - Second read (2026-09-22): HOLDS — in the sample of 2026-09-21 and re-run here per song rather than as a pair. `rock.5` has exactly two `songOptions`; `song.folk.john-denver-annie-s-song.pdmx` `notation.chords` is `[A, A7, Bm, D, Dsus4, E, Em, F#m, G]` and `song.classical.sakamoto-andata.pdmx` is `[A#m7(b5), B, BM7, C#m, C#m7, D#, D#sus4, EM7, F#7, G#, G#m, G#mM7]` — one suspended symbol printed in each, so "both of these print it" is two claims and both are on the data. The library-wide superlative is gone from the sentence and was not re-run.
  - Row: `lessonClaimsAboutMusic.test.ts` › "rock.5: both of the rung's two songs print a suspended chord symbol"
- [x] **FALSE** `content/lessons/rock.5.md:19` — "the rest of the chord well above it, nothing bunched in the middle of the keyboard"
  - Is: the root is two octaves down, but the other four notes sit in close position inside one octave starting at middle C, with a second at the bottom in the sus2 set. For example C4 D4 G4 C5 over C2, and F4 B♭4 C5 F5 over F2.
  - Evidence: `dump_score.py exercise.open-voicing.c.sus2`, `.c.sus4`, `.c.add9` and `.f.sus4`, bars 1–4 of each.
  - Fixed: now "the root low in the left hand, two octaves below the right, which holds the rest of the chord together from middle C up. Play all of it close together in one hand…" — `dump_score.py` of all four rung exercises (c.sus2, c.sus4, c.add9, f.sus4): LH C2/F2/G2/B♭2, RH close from C4–G4 up, root two octaves apart in every bar.
  - Second read (2026-09-22): HOLDS — in the sample of 2026-09-21 and re-dumped here, all four of the rung's `exerciseOptions` and every bar of each. In each bar the single LH whole note is exactly 24 semitones below the lowest RH note (F2/F4, G2/G4, C2/C4, B♭2/B♭4), and no RH note is below middle C. Both halves of the sentence — two octaves, and the rest of the chord from middle C up — are per-bar true in all four.
  - Row: `lessonClaimsAboutMusic.test.ts` › "rock.5: in every bar of the four open-voicing exercises the left hand is two octaves below the lowest right-hand note, which is never under middle C"
- [x] **FALSE** `content/lessons/rock.5.md:32` — "and a great deal of silence"
  - Is: *andata* is almost continuously sustained, mostly whole notes in both hands. There are rests in only 5 of 65 bars: 26, 34, 51, 56 and 65.
  - Evidence: `dump_score.py song.classical.sakamoto-andata.pdmx`, all bars.
  - Fixed: "a great deal of silence" is now "chords held for whole bars" — `dump_score.py song.classical.sakamoto-andata.pdmx` bars 1–20: whole notes in both hands in most bars; rests only in inner voices or a few bars.
  - Second read (2026-09-22): HOLDS, over all 65 bars rather than the fix's twenty — every bar of the dump was tested for a whole note in either hand and **none** is without one (bars 4, 6, 8, 14 and 16, where the left hand moves in halves and quarters, each still hold a right-hand whole note). So "chords held for whole bars" is true of the piece and not of its opening. Nothing has been heard; this is the writing, and the claim about sound the sentence used to make is gone.
  - Row: `lessonClaimsAboutMusic.test.ts` › "rock.5: every bar of andata holds a whole note in one hand or the other"
- [ ] **JUDGEMENT** `content/lessons/rock.5.md:29` — "*Annie's Song* uses a sus4 as a hinge in a plain folk progression"
  - Is: the only Dsus4 is in bar 0, the opening figure (D–Dsus4–D–Dsus4). No chord symbol in bars 1–57 is suspended. Whether that counts as a "hinge" is for a musician.
  - Evidence: `dump_score.py song.folk.john-denver-annie-s-song.pdmx | grep sus` matches only bar 0.
  - Reader 1: REWRITE — "*Annie's Song* opens on a sus4 and resolves it before the tune starts: D–Dsus4–D–Dsus4 in the pickup bar, and no suspension anywhere after it." A "hinge" implies the chord is doing structural work through the song, and it appears once, in bar 0. The rewrite is the same teaching — there is the gesture, hear it — stated as what the page shows, and it is stronger for the learner because it tells them where to look. The existing music-test row ("*Annie's Song* uses a sus4") still passes against it, since `notation.chords` holds `Dsus4` either way.
- [ ] **JUDGEMENT** `content/lessons/rock.5.md:8` — "The power chord left the third out because a distorted guitar cannot hold one."
  - Is: a common explanation, but a historical and acoustic generalisation for a musician to confirm.
  - Evidence: none in repository.
  - Reader 1: REWRITE — "The power chord leaves the third out, which is what lets a distorted guitar hold it cleanly." The acoustics behind it are real — distortion multiplies the intermodulation between the notes, and a major third is the interval it muddies worst — but "cannot hold one" is an absolute about an instrument, and "left the third out **because**" is a claim about how the voicing came to be, which is history nobody here can source. The rewrite states the consequence, which is the part the pianist is being asked to hear, and claims no origin.

Checked and true:
- sus2 is 0-2-7, sus4 is 0-5-7, and add9 is 0-4-7-14 with the third kept (exercise `intervals`).
- *Free play* names C–D–G over C as "C sus2" (`nameHeldChord`, `app/src/engine/drills/theory.ts:160-187`, with sus2 at `:114`).
- The `minor-vamp` preset exists (`sightReading.ts` `LAB_PRESETS`) and is a rung tool.
- The rung has two songs.

Not checked in this lesson: *andata* "harder than the level suggests" (a judgement).

## jam.5 — `content/lessons/jam.5.md`

Claims checked: 12. Findings: 1.

- [x] **FALSE** `content/lessons/jam.5.md:21` — "The exercises here write it in E, A, G and D"
  - Is: the Charleston is written only in E and A. The G exercise is off-beats, and the D exercise is anticipated.
  - Evidence: `pattern` values on `exercise.comping.e.charleston.intro`, `.a.charleston.intro`, `.g.off-beats.intro` and `.d.anticipated.intro`, confirmed by `dump_score.py`. Charleston E bar 1 has chords at beats 1 and 2&. D bar 1 has chords at 1 and 3&. G has every off-beat.
  - Fixed: now "The exercises here write it in E and A, and the figures below in G and D, which are the keys a guitarist actually calls" — catalog `pattern`: e/a charleston, g off-beats, d anticipated (`jam.5` exerciseOptions, stage-5.json:773-777).
  - Second read (2026-09-22): HOLDS — all four comping options re-read from the catalog's own `drill.params`, one at a time: `e.charleston.intro` `{key E, pattern charleston, offsets [0, 1.5]}`, `a.charleston.intro` `{key A, pattern charleston, offsets [0, 1.5]}`, `g.off-beats.intro` `{key G, pattern off-beats, offsets [0.5, 1.5, 2.5, 3.5]}`, `d.anticipated.intro` `{key D, pattern anticipated, offsets [0, 2.5]}`. Two Charlestons in E and A, and the other two figures in G and D, is exactly the split the sentence makes.
  - Row: `lessonClaimsAboutApp.test.ts` › "jam.5: the Charleston is written in E and A, and the off-beat and anticipated figures in G and D"

Checked and true:
- The Charleston is beat 1 plus the "and" of 2 (offsets `[0, 1.5]`).
- The earlier rung (`jam`, `lessons/jam.md:15`) sets the guitar keys.
- The rung has a form tracker (`drill.jam.form-tracker`).
- The *Blues — twelve bars* preset is a rung tool. Its jam has a bass and a drum kit (`LabScreen.ts:415`, `backingLoop.ts`), and nothing on that screen is judged (`LabScreen.ts:24, 420, 436`).

Not checked in this lesson: "keep the form without keeping time *for* you" was read as meaning the loop does not follow the player. The lab does run a metronome and drums.

## classical.6 — `content/lessons/classical.6.md`

Claims checked: 22. Findings: 3.

- [x] **FALSE** `content/lessons/classical.6.md:13` — "The pieces on this rung ... both hands are playing at once and only one of them is the tune."
  - Is: this is true of five of the six. The Prelude in C, BWV 846, has no tune in either hand. It is one broken-chord figure shared between the hands: RH G4 C5 E5 over LH C4 and E4 in bar 1.
  - Evidence: each of the six was dumped:
  - Fixed: now "both hands are playing at once and, in all but the Prelude in C, only one of them is the tune." — `dump_score.py song.classical.bach-wtc1-prelude-1` bars 1–4: one broken-chord figure across the hands. readingTime raised 3→4 (606 words); classical.6 is on `KNOWN_LONG` in `lessonShape.test.ts`.
    - Bach BWV 846, bars 1–2: no tune in either hand.
    - Satie: melody over chords in the RH.
    - Waltz: RH melody with LH oom-pah.
    - Für Elise, Prelude 7 and Prelude 4: dumped. Fits the claim.
  - Second read (2026-09-22): HOLDS — in the sample of 2026-09-21; re-read per piece here. The rung's six `songOptions` all carry `notation.staves` 2 (BWV 846, Préludes Op. 28 Nos. 4 and 7, the A minor waltz, *Gymnopédie* No. 1, *Für Elise*), so "both hands are playing at once" is six claims and all six hold. For the exception: every right-hand note in BWV 846 is a sixteenth apart from the final bar's whole-note chord — the only written values in the RH across all 34 bars are `16t`, an eighth rest and that `who` — so there is no longer line to be a tune, which is what "in all but the Prelude in C" excepts. **Which of the other five hands carries the tune is a musician's reading and stays one**; the row below does not assert it.
  - Row: `lessonClaimsAboutMusic.test.ts` › "classical.6: all six pieces are on two staves, and the excepted one has nothing but sixteenths in its right hand until the last bar"
- [ ] **JUDGEMENT** `content/lessons/classical.6.md:13` — "none of them is fast"
  - Is: *Für Elise* has thirty-second-note runs (bar 32) and the A minor Waltz is marked *Allegretto*. Whether that is "fast" is for a musician.
  - Evidence: `dump_score.py song.classical.beethoven-fur-elise` bar 32; `song.classical.chopin-waltz-a-minor` text "Allegretto".
  - Reader 1: REWRITE — "none of them lives on speed". What the paragraph is telling the learner is that nothing on this rung is won by playing quickly, and that survives both counter-examples: *Für Elise*'s thirty-seconds are a two-bar flourish rather than the piece's business, and an *Allegretto* waltz is not a fast piece so much as a moving one. "None of them is fast" is a flat claim about six pieces' tempi that two of the six are already arguing with, and nothing here has been heard, so it cannot be settled by listening either.
- [ ] **HISTORY** `content/lessons/classical.6.md:26` — "Chopin's own description was that the left hand keeps time while the right hand is free"
  - Is: this is usually reported second-hand, through pupils' accounts. It needs checking by someone who can cite the source.
  - Evidence: none in repository.
  - Reader 1: UNSURE (the image is well attested; "Chopin's own description" is the part that needs a source) — the left-hand-as-conductor account of rubato comes down through pupils and contemporaries rather than through anything Chopin published, and attributing it to him in his own words is the claim a citation would have to carry. The repository has nothing: a search of `content/` and `docs/` for the phrasing returns the lesson line itself and this audit file and nothing else, and the catalog's `composer` and `source` fields hold no quotations. **What would settle it:** a citation to a letter or a documented account. Meanwhile the smallest safe change is to drop the attribution and keep the image — "the old description of it is that the left hand keeps time while the right hand is free" — which asserts nothing about who said it.

Checked and true:
- The rung has six songs.
- Prelude No. 7 is sixteen bars plus a pickup (bar 0 + 1–16).
- Prelude No. 4 has a modern transcription on the rung (MuseTrainer) and the first edition in the Library (`.nifc`, "First edition: BH"). A third copy (`.alt`) also exists.
- *Für Elise* is complete (A, B at bar 23 and C at bar 61, through to bar 105).
- The Prelude in C is BWV 846.
- Preludes 6 and 20 and the mazurkas are under Classical.
- The two pedal exercises are on the rung.
- *Blind* exists as a mode (`GuideScreen.ts:156`).

Not checked in this lesson: nothing.

## ragtime.6 — `content/lessons/ragtime.6.md`

Claims checked: 34. Findings: 10.

- [x] **FALSE** `content/lessons/ragtime.6.md:58` — "These editions carry Joplin's own markings — *Not fast* on *The Entertainer*, *Not too fast* on *Peacherine Rag*, *Not fast* on *The Easy Winners*"
  - Is: none of the three files has such a marking. *The Entertainer* has "Moderato ( = 70 bpm)" and "Repeat 8va". *Peacherine* has only a metronome mark of 100, and *The Easy Winners* only 72.
  - Evidence: the MusicXML of each was grepped for `<words>`, `<per-minute>` and `<sound tempo>`, and the `dump_score.py` "text on the score" line was read. The Entertainer is from MuseTrainer. The other two are from the craigsapp/joplin edition (catalog `source`).
  - Fixed: heading and sentence now "**The tempo is printed on the music.** These editions carry a metronome mark — 70 on *The Entertainer*, which also says *Moderato*, 100 on *Peacherine Rag*, 72 on *The Easy Winners*" — MusicXML `<words>`/`<sound tempo>`/`<per-minute>` re-read for all six rung rags: no "Not fast" anywhere; Entertainer words "Moderato ( = 70 bpm)", "Repeat 8va".
  - Second read (2026-09-22): HOLDS — the MusicXML of all six rung rags re-read, one at a time, for `<words>`, `<per-minute>` and `<sound tempo>`. *The Entertainer*: `<sound tempo="70.0002">` and the two `<words>` "Moderato ( = 70 bpm)" and "Repeat 8va" — so 70 and *Moderato* are both on the page, and the mark is a `<sound>` rather than a `<per-minute>`. *Peacherine Rag*: `<per-minute>100</per-minute>`, `<sound tempo="100">`, no words. *The Easy Winners*: 72 and 72, no words. (The other three, unnamed by the sentence: School of Ragtime 100, Swipesy 72, Sunflower 90.) "Not fast" appears in none of the six.
  - Row: `lessonClaimsAboutMusic.test.ts` › "ragtime.6: the three rags named print 70, 100 and 72, and only The Entertainer prints a word for its tempo"
- [x] **FALSE** `content/lessons/ragtime.6.md:60` — "and the app takes its default tempo from them"
  - Is: there is no "Not fast" marking to take it from. The files' own tempos are 70, 100 and 72.
  - Evidence: as above.
  - Fixed: "the app takes its default tempo from them" now refers to those metronome marks, which is true — the score's tempo map comes from the file's `<sound tempo>` (`extractScoreModel.ts` ~341, `bpmAt` in `score/types.ts:252`).
  - Second read (2026-09-22): HOLDS — re-read at the symbol rather than the line number, which has moved. `extractScoreModel.ts:308-311` pushes `it.CurrentBpm` into `tempoMap` at each onset where it changes, and `:367-368` unshifts `options.defaultBpm ?? DEFAULT_BPM` **only** when the map is empty or its first entry starts after beat 0; `bpmAt` (`score/types.ts:264-271`) then reads the map. So a file that states a tempo supplies it and the app's own default is the fallback, which is what "takes its default tempo from them" says. The three rags each state one (70, 100, 72, above), so none of them is falling back.
  - Row: `lessonClaimsAboutApp.test.ts` › "ragtime.6: the score's tempo comes from the file, and the app's own default is used only when the file states none"
- [x] **FALSE** `content/lessons/ragtime.6.md:65` — "Rags use repeat marks and *D.C.* far more than anything you have played so far"
  - Is: the rung's rags use repeat marks (4–6 each) and first and second endings. None of them contains a da capo, segno or coda.
  - Evidence: MusicXML grep for `dacapo|<segno|<coda|D.C.` in `joplin-entertainer`, `-peacherine-rag`, `-easy-winners` and `-school-of-ragtime` returned nothing. Swipesy and Sunflower were not grepped.
  - Fixed: now "Rags use repeat marks far more than anything you have played so far" — "and *D.C.*" removed. Grep of all six rung rags (Swipesy and Sunflower included) for `dacapo|segno|coda|D.C.|fine` returned 0; repeats 6–8 each. First and second endings are only in *The Entertainer* (16 `<ending>`), so they were not added.
  - Second read (2026-09-22): HOLDS — the six MusicXML files searched again, per file, for `dacapo`, `<segno`, `<coda`, `dalsegno`, `<fine`, `D.C.` and `D.S.`: **no hit in any of the six**, which is the second differently shaped search the first pass's single grep needed. `<repeat>` counts are School of Ragtime 6, Swipesy 6, Easy Winners 8, Peacherine 8, Sunflower 8, Entertainer 8; `<ending>` is 16 in the Entertainer and 0 in the other five, so the endings the sentence still does not mention are one file's.
  - Row: `lessonClaimsAboutMusic.test.ts` › "ragtime.6: every rag on the rung is full of repeat marks and none of them carries a da capo, segno or coda"
- [x] **STALE** `content/lessons/ragtime.6.md:75` — "the one you already half know from Stage 5, now complete"
  - Is: `ragtime.5` offers the same item, `song.ragtime.joplin-entertainer`, all 92 bars. Stage 5 did not give half of it.
  - Evidence: `ragtime.5` `songOptions` in `stage-5.json`.
  - Fixed: now "the same complete score Stage 5 offered, now read as a whole" — `song.ragtime.joplin-entertainer` is in `ragtime.5` songOptions (stage-5.json:333) and has 92 bars.
  - Second read (2026-09-22): HOLDS — in the sample of 2026-09-21 and re-walked here. `ragtime.5`'s six `songOptions` hold `song.ragtime.joplin-entertainer` and so do `ragtime.6`'s: the same id on both rungs, one catalog row, `notation.bars` 92 and two key signatures (0 and −1). There is no second, shorter Entertainer row for Stage 5 to have offered, so "the same complete score Stage 5 offered" is the honest wording and "half know" was not.
  - Row: `lessonClaimsAboutMusic.test.ts` › "ragtime.6: the Entertainer is one 92-bar row offered whole by both ragtime.5 and ragtime.6"
- [x] **FALSE** `content/lessons/ragtime.6.md:47` — "**tenths** instead of octaves in the bass note, sometimes rolled;"
  - Is: no left-hand chord in any of the rung's six rags spans a tenth or more.
  - Evidence: a script over the `dump_score.py` output of all six (Entertainer, Peacherine, Easy Winners, Swipesy, Sunflower, School of Ragtime) looked for LH simultaneities of 15 semitones or more. It found none in any of the six.
  - Fixed: the bullet is now "**octaves** for the bass note instead of a single key;" — a script over `dump_score.py` of all six rung rags found no LH simultaneity of 15+ semitones, and octave (12+) basses in every one (Entertainer 11, Peacherine 110, Easy Winners 177, Swipesy 121, Sunflower 161, School 33).
  - Second read (2026-09-22): HOLDS — re-measured off the MusicXML rather than the dump, grouping each `<chord/>` member with the note that carries its beat, per file: exact-octave left-hand simultaneities number School of Ragtime 33, Swipesy 120, Peacherine 110, Sunflower 159, Easy Winners 177, Entertainer 11, so every one of the six writes octave basses. The widest left-hand simultaneity in any of the six is **14 semitones** (Swipesy; Sunflower reaches 13, the other four stop at 12) — a ninth, so no tenth is struck as a chord anywhere and the bullet's "octaves" is the right word. Two counts differ from the fix's by one (Swipesy 120 not 121, Sunflower 159 not 161), which is the dump's grace notes; the conclusion is unchanged.
  - Row: `lessonClaimsAboutMusic.test.ts` › "ragtime.6: every rag on the rung writes octave basses and none of the six strikes a left-hand tenth"
- [x] **FALSE** `content/lessons/ragtime.6.md:49` — "**octave leaps of a tenth or more** in the second and fourth strains"
  - Is: in *The Entertainer* (rehearsal marks: intro 1, A 5, B 22/30, A 39, trio 55/63, interlude 72, D 76/84), bass leaps of a tenth or more fall at bars 20, 54, 57, 58, 65, 66, 75 and 92. That is mostly the trio. There are none in the second strain, and in the fourth only the final bar.
  - Evidence: the same script, comparing the lowest LH note to the next; rehearsal bars from the MusicXML. *Peacherine* (leaps at 60, 76, 77, 84, 85) and *Easy Winners* (16 bars) have no strain marks in the file, so they are unchecked against "second and fourth".
  - Fixed: now "**leaps of a tenth or more** — in *The Entertainer* mostly in the trio —" — rechecked lowest-note to lowest-note in the Entertainer LH: leaps of 15+ semitones at bars 5, 20, 54, 57, 58, 65, 66, 75, 92 (trio 55–71 holds four). Peacherine and Easy Winners have no strain marks, so no strain is named for them.
  - Second read (2026-09-22): OVERREACH ("mostly in the trio" is a majority claim that four of the nine bars do not make) — the fix's own evidence line is the one that shows it, which is `working-rules` §2.16. Re-measured from the MusicXML: consecutive lowest left-hand notes jump 15 semitones or more **eleven times, in nine bars** — 5, 20, 54, 57 (twice), 58, 65 (twice), 66, 75, 92. The trio is bars 55–71 (`<fifths>` goes to −1 at bar 55 and back to 0 at bar 72; the rehearsal marks agree, E.1 at 55, E.2 at 63, F at 72), and it holds **four of the nine bars and six of the eleven leaps** — the densest stretch by far, four bars in seventeen against five in the other seventy-five, but not most of the bars that carry one. **Corrected:** `ragtime.6.md:49` now reads "in *The Entertainer* clustered in the trio", which is true on either count; body word count unchanged, `readingTime` unchanged. Peacherine and Easy Winners still carry no strain marks and no strain is claimed for them.
  - Row: `lessonClaimsAboutMusic.test.ts` › "ragtime.6: the Entertainer's bass leaps of a tenth or more cluster in the F trio, which is denser than the rest of the rag"
- [x] **FALSE** `content/lessons/ragtime.6.md:96` — "drops the tempo the moment a leap is missed"
  - Is: the Ladder changes tempo only between passes. A pass with any mistake sets the next pass one notch slower; nothing changes mid-pass.
  - Evidence: `nextLadderTempo`, `app/src/engine/PracticeEngine.ts:95-108`; `ScoreScreen.ts:1384` ("the ladder moving the tempo between passes").
  - Fixed: now "the *Ladder* does the taking-up for you — a clean pass goes up a notch, a pass with a missed leap comes down one —" — `nextLadderTempo` (`PracticeEngine.ts:103-108`) moves the tempo only between passes. Whether to drop mid-pass is the owner's decision.
  - Second read (2026-09-22): HOLDS — traced end to end rather than at the one function. `climbLadder` (`ScoreScreen.ts:1599-1624`) is called only where a lap ends (`:2812`), computes `clean` as "no new missed and no new wrong since the last lap", and hands it to `nextLadderTempo`, which (`PracticeEngine.ts:105-109`) adds `LADDER_NOTCH_PCT` when clean and subtracts it otherwise, clamped between the slider's own ends and `max(LADDER_CEILING_PCT, startedAtPct)`. Nothing writes `tempoPct` inside a lap, so the sentence's "a clean pass goes up, a pass with a missed leap comes down" is the whole of the behaviour. "With a loop set" is also on the code: `ladderApplies()` (`:1534-1536`) is `mode === 'tempo' && loopBars !== null && !performanceRun`.
  - Row: `lessonClaimsAboutApp.test.ts` › "ragtime.6: a clean pass moves the ladder up one notch and a pass with a mistake moves it down one, and it needs a loop in Keep tempo"
- [x] **FALSE** `content/lessons/ragtime.6.md:35` — "The other two live in three to five flats"
  - Is: *Peacherine*'s second strain is in B♭, two flats (key signatures −3, −2, −3, −4). The lesson itself says so at line 79.
  - Evidence: `dump_score.py song.ragtime.joplin-peacherine-rag` key-signature line.
  - Fixed: "three to five flats" is now "two to five flats" — MusicXML `<fifths>`: Peacherine −3, −2, −3, −4; Easy Winners −4, −5.
  - Second read (2026-09-22): HOLDS — in the sample of 2026-09-21 and re-read here from the MusicXML of each. *Peacherine Rag*'s `<fifths>` run −3, −2, −3, −4 and *The Easy Winners*' −4, −5, so across the two the signatures span two flats to five and the sentence's range is exact at both ends. The same read settles the clause before it: *The Entertainer* is 0, −1, 0 — "C, with one flat in the trio".
  - Row: `lessonClaimsAboutMusic.test.ts` › "ragtime.6: the Entertainer is C with one flat in its trio, and the other two named rags span two to five flats"
- [ ] **HISTORY** `content/lessons/ragtime.6.md:75` — "(1902)", "(1901)", "(1901)"; "a rag two-step"; "its name is a joke"
  - Is: the catalog has no year field for these rows. The two-step subtitle is not in the Easy Winners file. The "joke" is unsourced.
  - Evidence: catalog rows. Composer credits for Swipesy (with Arthur Marshall) and Sunflower (with Scott Hayden) do match the `composer` field.
  - Reader 1: UNSURE on the three dates and the subtitle, RIGHT on the collaborations — the rung's six rows were re-read: `joplin-swipesy-cakewalk`'s `composer` is "Scott Joplin and Arthur Marshall" and `joplin-sunflower-slow-drag`'s is "Scott Joplin and Scott Hayden", so both collaborations the lesson names are in the data. Nothing else is: none of the six rows carries a year, and titles here are bare ("The Easy Winners", "Peacherine Rag", "Sunflower Slow Drag") where the jazz and blues rungs' titles carry theirs in brackets. So three publication dates, a subtitle the file does not print, and the joke about the name are all unsourced here. **What would settle them:** the years in the titles, as the 1920 and 1928 rows already do it; for the subtitle, an edition that prints it.
- [ ] **JUDGEMENT** `content/lessons/ragtime.6.md:80` — "Gentler syncopation than *The Entertainer*"; "The most work of the three"
  - Is: the app's levels are Entertainer 7.1, Peacherine 7.0 and Easy Winners 7.0, which does not rank Easy Winners hardest. These are for a musician.
  - Evidence: catalog `level`.
  - Reader 1: REWRITE — drop "The most work of the three" and keep the syncopation comparison as a comparison: "Gentler syncopation than *The Entertainer*". The ranking is the part the app contradicts: all six of the rung's levels were re-read — School of Ragtime 6.4, Swipesy 6.8, Easy Winners 7.0, Peacherine 7.0, Sunflower 7.0, Entertainer 7.1 — so *Easy Winners* is level-tied with two others and below the *Entertainer*, and a lesson that ranks it hardest is arguing with the number on its own row. The syncopation half is a musician's reading and is worth keeping as one; it is not a ranking and nothing on the page disputes it.

Checked and true:
- The key changes are C→F→C, E♭→B♭→E♭→A♭, and A♭→D♭.
- The newly flattened notes are D♭ in the Peacherine trio and G♭ in the Easy Winners trio.
- The rung has six songs, and one is required.
- *School of Ragtime* is the shortest at 33 bars, with six repeat-ended sections.
- Swipesy and Sunflower are both in 2/4, at levels 6.8 and 7.0.
- Weeping Willow is under Ragtime.
- The A♭ and E♭ two-octave scales are on the rung.
- The Entertainer's walk-ups are present (bar 12: G2 A2 B2).

Not checked in this lesson: that the Easy Winners has four strains (the file has no strain marks). Swipesy and Sunflower were not checked for D.C.

## technique.6 — `content/lessons/technique.6.md`

Claims checked: 15. Findings: 1.

- [x] **FALSE** `content/lessons/technique.6.md:33` — "The app measures it: the top note's velocity against the average of the notes underneath, wanting the top at least 1.4 times the rest."
  - Is: nothing in the app runs this measurement. `voicingScore` exists but has no caller. `exercise.voicing.a` opens as an ordinary score, and its `topNoteRatio: 1.4` is read by nothing.
  - Evidence: `voicingScore` is defined at `app/src/engine/Scoring.ts:313`. A grep for `voicingScore|topNoteRatio` in `app/src` (excluding tests) finds only that definition. A second, case-insensitive grep for `voicing` in `app/src` finds only comments and unrelated uses (`fromCatalog.ts:296`, `sightReading.ts`, `ChordChartScreen.ts`, `GuideScreen.ts`).
  - Fixed: now "The app does not measure it: the exercise opens as an ordinary score, judged on the notes and their timing. Aim for the top note's velocity at least 1.4 times the rest — a rule of thumb, not musical law, and here only your ear checks it." — rechecked: `voicingScore` has no caller in `app/src`; `exercise.voicing.a` has a `file`, so it opens as a score (`openItem.ts:29`). The phrase "at least 1.4 times the rest" is kept because `app/tests/unit/lessonShape.test.ts:59-62` pins it to `VOICING_MIN_RATIO`; it is now advice, not a claim the app measures. Whether to wire the scorer (and whether that test should still pin the phrase) is the owner's decision.
  - Built (2026-09-21): `voicingScore` runs for a run of `exercise.voicing.a`, against that row’s own `topNoteRatio` (1.4), and the sheet carries a *Top note* line. The pin in `lessonShape.test.ts` is now a real claim, and `lessonClaimsAboutApp.test.ts` adds the row that matters more: the 1.4 in the prose is the 1.4 on the exercise. The sentence now reads "The app measures it: the summary sheet says how many of your chords sang the top note at least 1.4 times the rest".
  - Second read (2026-09-22): HOLDS of the sentence as it stands now, which the build changed under the fix — `technique.6.md:32-35` reads "The app measures it: the summary sheet says how many of your chords sang the top note at least 1.4 times the rest, and what your average was. That number is the exercise's own". Re-read at the symbol: `techniqueMeasureFor`'s `voicing` branch (`Scoring.ts:493-514`) takes `topNoteRatio` off the item's own `drill.params`, falls back to `VOICING_MIN_RATIO` only if the row states none, calls `voicingScore`, and writes "N% of M chords sang the top note at least R times the rest (mean X×)" — the count and the average the sentence promises. `ScoreScreen.ts:2076` is the caller. `technique.6`'s only voicing option, `exercise.voicing.a`, carries `{kind: voicing, params: {key A, topNoteRatio: 1.4}}`, so the prose's 1.4 is the exercise's and not the constant's — and the constant happens to be 1.4 too (`Scoring.ts:297`), which is why the row below reads the row and not the constant.
  - Row: `lessonClaimsAboutApp.test.ts` › "technique.6: the 1.4 in the prose is the voicing exercise's own topNoteRatio, and the sheet line counts chords against it"

Checked and true:
- The three seventh qualities are on the rung (`exercise.arpeggio7.c-major7`, `-minor7`, `-half-diminished7`).
- Alberti bass is at Stage 3 (rung `3.6`).
- The rotation exercise is an Alberti figure.
- The trill is written with "4 notes to the beat", starting on the upper note and ending on the main note in every group (`exercise.trill.c.4pb.left`).
- The held-melody pedal exercise ties A5 across 4 bars (6 `<tie>`).
- Czerny Op. 299 Nos. 1, 3 and 4 are on the rung and are running sixteenths.

Not checked in this lesson: nothing.

## jazz.6 — `content/lessons/jazz.6.md`

Claims checked: 21. Findings: 0.

Checked and true:
- Stage 5 covered shells and ii–V–I (`jazz.5` concepts).
- The Charleston offsets are `[0, 1.5]`.
- The walking lines are root–third–fifth with the fourth note a semitone below the next root, in every bar of `exercise.walking-bass.c.blues` (12 bars) and `.f.ii-v-i` (4 bars).
- Harmonic dictation plays a progression and closes a chord after 120 ms of silence (`CHORD_BOUNDARY_MS`, `app/src/engine/drills/harmony.ts:363`).
- The theory Stage 6 lesson explains that rule (`theory.6.md:24`).
- A walking blues in C is on the rung.
- The rung has six songs. The years match the catalog `editionNotes`, all six are licensed `cc-zero` with composition status "pd", and all are single-staff lead sheets with chord symbols.
- The `jazz-comping` preset leaves the key free and has a bass and drum kit.

Not checked in this lesson: "Four patterns cover most of it" is a judgement. Only two of the four patterns have exercises on this rung (Charleston C, off-beats F), and the lesson does not claim more.

## blues.6 — `content/lessons/blues.6.md`

Claims checked: 18. Findings: 5.

- [x] **FALSE** `content/lessons/blues.6.md:47` — "Its left hand is the bass this lesson names."
  - Is: the left hand in the rung's *Pinetop's Boogie Woogie* is not the root–3–5–6–♭7 eighth-note climb. From bar 7 it is dotted-eighth/sixteenth dyads over a fixed root: F2+C3, G♯2, F2+A2, F2+D3, and so on. Bars 1–6 are LH thirty-second-note tremolos.
  - Evidence: `dump_score.py song.folk.boogie-woogie.pdmx`, bars 1–16.
  - Fixed: now "Its left hand in this edition is not the climb above: from bar 7 it is two-note chords over the root in a dotted rhythm." — `dump_score.py song.folk.boogie-woogie.pdmx` bars 7–12: LH F2+C3, F2+D3 … in dotted-eighth/sixteenth; bars 1–6 have no LH climb.
  - Second read (2026-09-22): HOLDS — re-dumped and the left hand read bar by bar. Bars 1–6 are thirty-second-note tremolos in *both* hands (LH A3–C4, F3–E♭4, F3–C4, F3–E♭4, B♭3–F4, B♭3–F♭4), not a bass at all; from bar 7 the left hand is dotted-eighth-plus-sixteenth pairs of two-note chords over a fixed root — bar 7 `F2+C3, G♯2, F2+A2, F2+C3, F2+D3`, bars 11–12 `F2+C3, F2+D3, F2+C3, F2+A♭2` — so the root–3–5–6–♭7 climb the lesson teaches is nowhere in the piece. Both clauses of the sentence, "not the climb" and "from bar 7", are on the page.
  - Row: `lessonClaimsAboutMusic.test.ts` › "blues.6: Pinetop's Boogie Woogie has no left hand below bar 7 that climbs, and from bar 7 its left hand is dotted pairs over a held root"
- [x] **FALSE** `content/lessons/blues.6.md:46` — "which is above this rung"
  - Is: its level, 7.47, is inside the rung's `levelBand` [3.5, 7.5]. It is above every other item on the rung (exercises 5.4–6.4, songs 3.52 and 4.95) but not above the rung.
  - Evidence: catalog `level`; `blues.6` `levelBand` in `stage-6.json`.
  - Fixed: now "which is levelled above everything else on this rung" — catalog levels: Pinetop 7.47; exercises 5.4–6.4; songs 3.52 and 4.95; `blues.6` levelBand [3.5, 7.5].
  - Second read (2026-09-22): HOLDS — every one of the rung's eight options re-read for its `level`, not a sample: songs 4.95 (*Boogie — easy for beginners*), 3.52 (*Boogie woogie and blues piano exercises*) and 7.47 (Pinetop); exercises `boogie.c.pinetop` 6.2, `boogie.f.walking-eighths` 6.2, `walking-bass.c.blues` 6.2, `turnaround.c.i-vi-ii-v` 6.4, `boogie.c.root-fifth` 5.4. 7.47 is strictly above all seven others and inside the rung's `levelBand` [3.5, 7.5], so "above everything else on this rung" is right where "above this rung" was not. The level is the catalog's estimate and is a proxy for difficulty, not a reading of the music.
  - Row: `lessonClaimsAboutApp.test.ts` › "blues.6: Pinetop's Boogie Woogie is levelled above every other option on the rung and still inside the rung's band"
- [x] **FALSE** `content/lessons/blues.6.md:42` — "One boogie pattern through all twelve bars in C, then the same in F."
  - Is: the rung has no boogie exercise that runs twelve bars or moves through the blues chords. Each one is four bars of a single chord. None is offered in both keys: Pinetop and root-and-fifth are in C only (C7 throughout), and walking-eighths is in F only (F7 throughout).
  - Evidence: `dump_score.py exercise.boogie.c.pinetop`, `.c.root-fifth` and `.f.walking-eighths`, bars 1–4 of each; `notation.chords` is a single chord for each.
  - Fixed: now "The boogie exercises give each pattern four bars on one chord — Pinetop and root-and-fifth in C, walking eighths in F. Take one through all twelve bars in C, moving it to each chord yourself, then the same in F." — `dump_score.py` of the three boogie exercises: 4 bars, one chord each (C7, C7, F7). The mastery line "Pinetop's bass in two keys" is left as a goal; the rung has Pinetop in C only.
  - Second read (2026-09-22): HOLDS — **read at the MusicXML, not the dump**, as `T12`'s item 2b asks, because the claim is about bar lengths and the dump marks neither ties nor tuplets. All three files opened: each has `<measure number>` 1 to 4 and no more; each carries four `<harmony>` elements, one per bar, all the same (`exercise.boogie.c.pinetop` C dominant ×4, `.c.root-fifth` C dominant ×4, `.f.walking-eighths` F dominant ×4); and each has **zero** `<tie>`, zero `<time-modification>`/`<tuplet>`, zero `<grace>` and zero `<dot/>` — so there is nothing the dump was hiding and nothing spilling past bar 4. The left hand is 32 eighths (eight a bar) and the right 12 whole notes (a held triad a bar) in all three.
  - Row: `lessonClaimsAboutMusic.test.ts` › "blues.6: each boogie exercise is four bars on a single chord, two in C and one in F, with no tie or tuplet in any of them"
- [ ] **HISTORY** `content/lessons/blues.6.md:28` — "Jimmy Yancey's own left hand was a dotted habanera figure ... and he ended almost everything in E flat"
  - Is: the rung has no Yancey item; I did not search the catalog for one. A historian should confirm this. Pinetop 1928 does match the catalog title "(1928)".
  - Evidence: none in repository.
  - Reader 1: UNSURE (a performer's habit, and there is nothing here to check it against) — the search the finding left undone was run: the whole catalog's ids, titles and composers were searched for `yancey` and **nothing** comes back, so there is no Yancey score in the app, on this rung or anywhere else. That closes the "did I look" half and leaves the claim itself where it was: that Yancey's left hand ran a dotted habanera figure and that he ended almost everything in E flat are facts about recordings, and the repository holds no recordings and no discography. `scout-spellings.md` reached the same conclusion from the other direction and listed this line as unverifiable for want of a score to dump. **What would settle it:** a citation, or a Yancey transcription in the catalog to read. The Pinetop date stands — the catalog title carries "(1928)".
- [ ] **UNVERIFIED** `content/lessons/blues.6.md:55` — "a boogie that speeds up never gets past the first notch of it"
  - Is: this depends on whether early notes in Keep tempo count as wrong or missed. The timing window in `PracticeEngine.feedTempo` was not traced.
  - Evidence: `nextLadderTempo` raises only on a clean pass (`PracticeEngine.ts:103-108`). That part is true.
  - Reader 1: RIGHT, with one caveat — traced now, which is what the finding said was missing. `feedTempo` (`PracticeEngine.ts:859-904`) converts the strike to music time and calls `findSlot`, which (`:962-976`) matches only a step whose `|atMs - step.tMs| <= toleranceMs`; a strike outside every open window returns `null`, and the engine then calls `record(midi, velocity, rawTMs, null, false)` and emits `noteJudged { ok: false }` — so a note played too early is a **wrong note**, not a missed one. `climbLadder` (`ScoreScreen.ts:1603-1605`) computes `clean` as "no new missed and no new wrong", so one such note makes the lap unclean and `nextLadderTempo` takes the tempo **down** a notch rather than up. A boogie that runs away therefore cannot climb, which is exactly what the sentence claims. **The caveat:** a rush that stays inside `toleranceMs` (150 ms by default, 200 in the engine's own defaults) is matched and judged clean, so "never gets past the first notch" is true of speeding up and not of hurrying slightly.

Checked and true:
- The root-and-fifth pattern alternates in eighths (offsets `[0, 7, …]`).
- Pinetop's climb is `[0, 4, 7, 9, 10, 9, 7, 4]`.
- 12 × 8 = 96.
- The walking bass is root–3–5–semitone below the next root (`exercise.walking-bass.c.blues`).
- The rung offers two short boogies and the Pinetop.

Not checked in this lesson: "every boogie bass since is a variation on it" (a judgement).

## chords-pop.6 — `content/lessons/chords-pop.6.md`

Claims checked: 20. Findings: 5.

- [x] **FALSE** `content/lessons/chords-pop.6.md:45` — "the lab's key setting is the cheapest way to get there: same progression, a different tonic each day"
  - Is: the rung's lab tool is the `ballad` preset, and it plays I–vi–IV–V with the progression locked. That is not this rung's I–V–vi–IV. The preset that plays I–V–vi–IV is `pop-four-chord`.
  - Evidence: `chords-pop.6` `tools` `{"kind": "lab", "preset": "ballad"}`; `LAB_PRESETS` in `app/src/engine/sightReading.ts` (`ballad`: `progressionId: 'i-vi-iv-v'`, locks progression, left hand and right hand); `LabScreen.ts` `applyLocks`.
  - Fixed: now "The lab preset on this rung, *Ballad — broken chords*, fixes its progression at I–vi–IV–V rather than this rung's loop, but its key is free" — `LAB_PRESETS` `ballad` (`sightReading.ts:869-879`): `i-vi-iv-v`, locks progression/leftHand/rightHand, not key. Pointing the rung at `pop-four-chord` is the owner's decision.
  - Second read (2026-09-22): HOLDS — re-read at the symbol; the preset has moved to `sightReading.ts:943-957`. `chords-pop.6`'s `tools` are `[{lab, preset ballad}, {play}]`, and `ballad` is `{label 'Ballad — broken chords', keyId f-major, progressionId 'i-vi-iv-v', leftHand broken, rightHand none, bars 8, bpm 72, locks ['progression','leftHand','rightHand']}`. So the lesson's label, its progression, its lock and its free key are four claims and all four are on the preset — `key` is absent from `locks`, which is the one the whole tools paragraph rests on.
  - Row: `lessonClaimsAboutApp.test.ts` › "chords-pop.6: the rung's lab preset is the ballad, whose progression is I–vi–IV–V and locked, and whose key is not"
- [x] **FALSE** `content/lessons/chords-pop.6.md:37` — "Play each from its chord symbols before you play it from the page"
  - Is: five of the six scores print no chord symbols (`chordCount: 0`). Only *Annie's Song* has them.
  - Evidence: catalog `notation.chordCount` for each of the six.
  - Fixed: now "Only *Annie's Song* prints chord symbols: play it from them before you play it from the page" — `chordCount` 0 for the other five, 108 for Annie's Song (`dump_score.py` notation lines).
  - Second read (2026-09-22): HOLDS — all six of the rung's `songOptions` re-read for `notation.chordCount`, one row each: *Clocks* 0, *All of Me (easy)* 0, *Dancing Queen* 0, *Flying Theme* 0, *Fallen Down (Reprise)* 0, *Annie's Song* 108. "Only" is a claim about all six and all six were counted.
  - Row: `lessonClaimsAboutMusic.test.ts` › "chords-pop.6: Annie's Song is the only one of the rung's six songs with chord symbols printed"
- [x] **FALSE** `content/lessons/chords-pop.6.md:34` — "*Clocks* and *Dancing Queen* are the four chords driven by a rhythm"
  - Is: neither is the I–V–vi–IV loop. *Clocks* is three chords, E♭–B♭m–B♭m–Fm (bars 1–4). *Dancing Queen*'s bass runs E, C♯, F♯, B, D, B–E, A, D, A… through bars 1–21, with no fixed four-chord loop.
  - Evidence: `dump_score.py song.pop.coldplay-clocks-coldplay.pdmx` bars 1–8; `song.pop.abba-dancing-queen.pdmx` LH bars 1–21.
  - Fixed: now "*All of Me* is a four-chord loop under a ballad, *Clocks* a three-chord loop driven by a rhythm" and *Dancing Queen* is listed among those without one fixed loop — Clocks LH/RH bars 1–8: E♭, B♭m, B♭m, Fm twice; Dancing Queen LH bars 1–22: no repeating four-chord cell; All of Me LH bars 1–12: E–C–G–D repeated.
  - Second read (2026-09-22): HOLDS — each bar's left hand reduced to its pitch-class set, off the MusicXML, over the whole of both files. *Clocks*: bars 5–8 are `{E♭,G,B♭}`, `{B♭,D♭,F}`, `{B♭,D♭,F}`, `{A♭,C,F}` — **three** distinct chords — and bars 16–19 repeat all four bars exactly, so "a three-chord loop" is right. *Dancing Queen*: over all 42 bars there is **no** bar where the next four bars repeat the four before them, so it has no four-bar cell to be the rung's loop. *All of Me*: bars 5–8 are four distinct sets and bars 9–12 repeat them bar for bar.
  - Row: `lessonClaimsAboutMusic.test.ts` › "chords-pop.6: Clocks' left hand loops three chords and Dancing Queen's never repeats a four-bar cell"
- [x] **FALSE** `content/lessons/chords-pop.6.md:33` — "every one of them a song built on a loop"
  - Is: *All of Me* (Em–C–G–D) and *Clocks* do loop. *Dancing Queen* (above) does not. Neither does *Annie's Song*: its symbols run D G A Bm G D D Bm A7 G F♯m Em G A7…, with no repeating cell.
  - Evidence: as above, plus `dump_score.py song.folk.john-denver-annie-s-song.pdmx` chord list. *Flying Theme* and *Fallen Down* were not dumped for a loop.
  - Fixed: "every one of them a song built on a loop" is gone; the paragraph now says *All of Me*, *Clocks* and *Fallen Down* loop and "*Dancing Queen*, *Annie's Song* and the *Flying Theme* … move through their chords without one fixed loop" — Annie's Song chord list read in full (verses G–A–Bm–G–D–Bm–A7–G–F♯m–Em–G–A7, no short cell); Fallen Down LH bars 1–15: an eight-bar broken-chord loop (D, D, B, B, G, Gm, D, A) repeated; Flying Theme LH read for bars 1–20 only (no fixed cell there) — bars 21–52 unchecked.
  - Second read (2026-09-22): HOLDS, and the fix's own unchecked bars are now read — all six songs, every bar of each, left hand reduced to pitch-class sets. The three said to loop do: *All of Me* repeats a four-bar cell at bars 5–12 and again at 14–21, 31–38 and 39–46; *Clocks* repeats bars 5–8 at 16–19; *Fallen Down* has bars 1–7 repeated exactly at 9–15 (bar 16 alters bar 8's chord, so the cell is seven bars of eight rather than the fix's flat "eight"). The three said not to do not: over **all** of *Dancing Queen* (42 bars), *Annie's Song* (57) and the *Flying Theme* (52) — including the Flying Theme's 21–52, which the fix left unread — there is no place where four bars of left hand are repeated by the next four.
  - Row: `lessonClaimsAboutMusic.test.ts` › "chords-pop.6: the three songs called loops repeat a left-hand cell and the three called loopless never repeat four bars"
- [x] **FALSE** `content/lessons/chords-pop.6.md:21` — "The chords stay put and the bass walks down the scale"
  - Is: in the lesson's own line, and in the exercise, only C/B, C/G and F/E keep the chord over the new bass. Am, Dm and G are new chords.
  - Evidence: `dump_score.py exercise.slash-bass.c`: RH C, C, Am, C, F, F, Dm, G over LH C B A G F E D G.
  - Fixed: now "The bass walks down the scale; some chords stay put over it and the others change: C, C/B, Am, C/G, F, F/E, Dm, G." — `dump_score.py exercise.slash-bass.c`: RH C, C, Am, C, F, F, Dm, G over LH C B A G F E D G. The following sentence ("Reading `C/B` and knowing it is still a C chord") is untouched and true of C/B.
  - Second read (2026-09-22): HOLDS — re-dumped and read half-note by half-note. The exercise is four bars of two half notes: LH C3 B2 | A2 G2 | F2 E2 | D2 G2, and RH C–C | Am–C | F–F | Dm–G, with printed symbols C, C, Am, C, F, F, Dm, G. So the bass steps down seven scale degrees and then leaps to G for the cadence, three of the eight places keep the chord over a new bass (C/B, C/G, F/E) and the rest change chord — which is exactly the split the sentence now makes, and is why "the chords stay put" on its own was not true.
  - Row: `lessonClaimsAboutMusic.test.ts` › "chords-pop.6: the slash-bass exercise steps its bass down C–B–A–G–F–E–D under the eight chords the lesson lists"

Checked and true:
- The root-position motion is a fifth, a second and a third.
- The three-key practice matches the three `loop4` exercises (D, A♭, B).
- The rung has six songs.
- All six are tagged `personal-build`, and the public build uses placeholders for them (`tools/content/import_pdmx.py:235`).

Not checked in this lesson: *Flying Theme* and *Fallen Down* "a loop under a melody nobody sings" (not dumped for a loop).

## theory.6 — `content/lessons/theory.6.md`

Claims checked: 14. Findings: 1.

- [x] **FALSE** `content/lessons/theory.6.md:46` — "on the modes drill, *Show me* engraves the answer in the key signature that fits it, so B flat aeolian prints five flats"
  - Is: the mechanism is right. `fifthsFor` picks the signature with the fewest accidentals, and B♭ aeolian would get five flats. But this rung's modes drill never asks for a B♭ mode. Its roots are C, D, E, F, G and A. B♭ only comes up in `drill.theory.modes-all`, which is not on this rung.
  - Evidence: catalog `drill.theory.modes` `params.roots`; `buildMode` honours `roots` (`fromCatalog.ts:410-420`); `fifthsFor` in `answerSheet.ts:36`.
  - Fixed: example now "so F aeolian prints four flats and no accidentals" — `drill.theory.modes` params: roots C D E F G A, modes include aeolian; F aeolian's notes are A♭ major's, the only signature with all seven in key under `fifthsFor` (`answerSheet.ts:36-49`).
  - Second read (2026-09-22): HOLDS, and the example is now one the rung can actually ask for — `drill.theory.modes` (the rung's only mode drill) is `{modes: [dorian, mixolydian, lydian, aeolian, ionian], roots: [C, D, E, F, G, A]}`, so F and aeolian are both in the drill's own lists and B♭ is in neither (B♭ appears only in `drill.theory.modes-all`, which is not on this rung). `fifthsFor` (`answerSheet.ts:36-50`) scores each signature by how many of the notes are in key and takes the best, walking `[0, −1, 1, −2, 2, −3, 3, −4, …]`: F aeolian's seven pitch classes are A♭ major's, so −4 is the first and only candidate that scores 7 — four flats and nothing left to accidentalise.
  - Row: `lessonClaimsAboutApp.test.ts` › "theory.6: F aeolian is a card this rung's mode drill can deal, and the answer sheet engraves it in four flats with no accidental"

Checked and true:
- V in C is G, and V in E♭ is B♭.
- The 120 ms silence rule and the "note of the next chord" rule are in the code (`harmony.ts:363`, `feed` and `startsTheNextChord`).
- The previous lesson taught four modes and its rung had no modes drill (`theory.5` `exerciseOptions`).
- The rung has four dictation progressions, as the lesson says.
- The rung has no songs, and `songOptional` is set.
- The every-key Simon is on the rung, with the keys-after-miss behaviour (`simon.ts`).

Not checked in this lesson: nothing.

## improv.6 — `content/lessons/improv.6.md`

Claims checked: 11. Findings: 2.

- [x] **FALSE** `content/lessons/improv.6.md:37` — "Put `ii7 V7 I` in the lab and run it."
  - Is: the rung's lab tool opens the `minor-vamp` preset, which locks both the key (A minor) and the progression (i–♭VII–♭VI–♭VII). The progression picker is disabled there, so ii7 V7 I cannot be entered from this rung's tool. The unpreset lab, opened from the Library, does allow it.
  - Evidence: `improv.6` `tools` `{"kind": "lab", "preset": "minor-vamp"}`; `LAB_PRESETS` `minor-vamp` `locks: ['key', 'progression', 'leftHand']`; `LabScreen.ts` `applyLocks` disables the locked picker.
  - Fixed: now "The lab opens here on the minor vamp, which fixes its progression, so tap *Free*, choose *Custom…*, put `ii7 V7 I` in and run it." — `minor-vamp` locks key/progression/leftHand (`sightReading.ts:907-919`); the lab's own preset row has a *Free* chip (`LabScreen.ts` ~684) and the progression select has *Custom…* (`LabScreen.ts:471`) with typed numerals. Pointing the rung at an unlocked preset is the owner's decision.
  - Second read (2026-09-22): HOLDS of the sentence as it stands now, which a later build changed again — the owner's decision the fix left open was taken. `improv.6.md:37-38` now reads "*Accompaniment lab* opens here on the minor vamp with its chords left to you, so put `ii7 V7 I` in and run it", with no *Free* detour, and the rung's tool is `{kind: lab, preset: minor-vamp, unlock: ["progression"]}`. `minor-vamp`'s own `locks` are still `['key', 'progression', 'leftHand']` (`sightReading.ts:1011`), and `labLocksFor(preset, unlock)` (`:882-889`) subtracts the rung's freed names, so this rung opens the lab with the progression select live and the key still fixed at A minor. The sentence and the rung agree.
  - Row: `lessonClaimsAboutApp.test.ts` › "improv.6: the rung frees the minor vamp's progression so ii7 V7 I can be typed there, and leaves its key locked"
- [x] **FALSE** `content/lessons/improv.6.md:38` — "the third and the seventh are two of them"
  - Is: this holds for ii7 and V7. The lesson's own input writes the last chord as `I`, which the lab builds as a triad, so the seventh of I is not lit.
  - Evidence: `romanToLabChord` goes through `anyRomanToChord` to `romanToChord` (`app/src/engine/drills/theory.ts:315-326`), where no `7` in the suffix gives `[0, 4, 7]`. The lit keys are those pitch classes (`LabScreen.ts` `showChordOnKeys`).
  - Fixed: now "and on ii7 and V7 the third and the seventh are two of them" — `romanToChord` (`theory.ts:305-331`) builds `I` as a triad; typing `Imaj7` would not help, because any `7` suffix on a major numeral gives [0, 4, 7, 10], a dominant seventh.
  - Second read (2026-09-22): HOLDS — in the sample of 2026-09-21 and re-read at `theory.ts:305-332`. The three numerals the sentence's own input names, one at a time: `ii7` is lower-case with a `7`, so `[0, 3, 7, 10]` — third and seventh both there; `V7` is upper-case with a `7`, so `[0, 4, 7, 10]` — likewise; `I` has no `7`, so `[0, 4, 7]` — no seventh to light. `showChordOnKeys` (`LabScreen.ts:456-462`) lights exactly the bar's chord's pitch classes through `guideNotes`, so what is lit is what the parser built. The sentence's restriction to ii7 and V7 is the correct one.
  - Row: `lessonClaimsAboutApp.test.ts` › "improv.6: ii7 and V7 are built with a third and a seventh and I is built as a plain triad"

Checked and true:
- Guide tones and D dorian over Dm7 are correct theory.
- The ii–V–I guide-tone exercise and the Charleston comping are on the rung.
- The rung has no songs.

Not checked in this lesson: nothing.

## rock.6 — `content/lessons/rock.6.md`

Claims checked: 18. Findings: 4.

- [x] **FALSE** `content/lessons/rock.6.md:46` — "let the app hold the arpeggio while you play the melody and the bass"
  - Is: Duet plays one whole hand, not one voice. In *Moonlight* the melody and the triplet arpeggio share the right-hand staff (bar 5: melody in voice 1, arpeggio in voice 2), and in bar 5 the left hand carries arpeggio notes as well. In *Gnossienne* the repeating figure and the bass are both in the left hand. In neither piece can the app take the arpeggio alone.
  - Evidence: `dump_score.py song.classical.beethoven-moonlight-i` bars 1–5; `song.classical.satie-erik-satie-gnossienne-n1.pdmx` bars 1–9. Duet plays `playbackHands` by hand (`ScoreScreen.ts` `drawRunRows`; `ScoreSession.ts` ~940-990).
  - Fixed: now "the app plays one hand while you play the other, then swap. In *Gnossienne* it keeps the left hand going under your tune, then the tune while you hold the figure. It takes a hand, not a voice: *Moonlight*'s melody and arpeggio share the right hand, so it cannot hold the arpeggio alone." — `ScoreSession.ts` ~940-965 plays `pitchesToPlay(step, which, focus)` by hand; Gnossienne LH bars 1–4 A3 then C4+E4, RH the tune; Moonlight bar 5 RH v1 melody over v2 arpeggio. Paragraph trimmed to keep the lesson at 600 words (three-minute cap, `lessonShape.test.ts`).
  - Second read (2026-09-22): HOLDS — in the sample of 2026-09-21; re-read at the function this time rather than at a line range. `pitchesToPlay` (`ScoreSession.ts:1002`) is `appPitches`, and `appPitches` (`:61-77`) filters a step's notes on `note.hand` alone — `focus === 'R'` keeps the `'L'` notes and the other way round. There is no voice anywhere in it, so "it takes a hand, not a voice" is the code's own shape. *Moonlight* bar 5 has the melody in the right hand's voice 1 (`G#4/eig. G#4/16t`) and the arpeggio in its voice 2 (`C#4 E4 C#4 E4 …`), so both are `hand: 'R'` and Duet cannot separate them; *Gnossienne* bars 1–5 put the repeating figure in the left (`A3/qua C4+E4/hal C4+E4/qua`, unchanged bar to bar) and the tune in the right, so there Duet's split is the piece's own.
  - Row: `lessonClaimsAboutApp.test.ts` › "rock.6: Duet chooses what to play by hand and not by voice, so Moonlight's right-hand melody and arpeggio go together"
- [x] **FALSE** `content/lessons/rock.6.md:31` — "The exercises start well below the pieces"
  - Is: three of the four do (3.4, 3.5 and 3.6 against pieces at 4.6, 6.0 and 7.1). The half-pedal exercise is level 7.4, above all three pieces.
  - Evidence: catalog `level` of `exercise.pedal.half-pedal.a` and the three songs.
  - Fixed: now "The exercises, bar the half-pedal one, start well below the pieces" — catalog levels: ostinato 3.4, broken 3.6, pedal 3.5, half-pedal 7.4; songs 4.6, 6.0, 7.1.
  - Second read (2026-09-22): HOLDS — in the sample of 2026-09-21 and re-read per row. All seven of the rung's options: songs *Gnossienne* 4.6, Prélude Op. 28 No. 20 6.0, *Moonlight* I 7.1; exercises `ostinato.a.arpeggio` 3.4, `pedal.a` 3.5, `accompaniment.broken.a-minor.both` 3.6, `pedal.half-pedal.a` 7.4. Three exercises below the lowest song and the fourth above the highest — the exception the clause names is the only one, so the sentence is exact. Catalog `level` is the app's estimate and stands here for difficulty rather than measuring it.
  - Row: `lessonClaimsAboutApp.test.ts` › "rock.6: three of the four exercises are levelled below every song on the rung and the half-pedal one is above all of them"
- [x] **FALSE** `content/lessons/rock.6.md:20` — "The exercises here run the figure in A minor, first as a bare ostinato and then as the fuller broken chord"
  - Is: the ostinato is the figure over a held A (LH A2+A3 whole notes). The "broken chord" exercise is not that figure: the right hand plays a scale and the left plays broken chords whose bass moves A–D–E–A. Nothing is held underneath.
  - Evidence: `dump_score.py exercise.ostinato.a.arpeggio` bars 1–5; `exercise.accompaniment.broken.a-minor.both` bars 1–4.
  - Fixed: now "The exercises are in A minor: the figure as a bare ostinato over a held A, then a broken-chord left hand under a scale" — `dump_score.py exercise.ostinato.a.arpeggio` (LH A2+A3 whole) and `exercise.accompaniment.broken.a-minor.both` (RH scale, LH A–C–E–C, D–F–A–F, E–G–B–G).
  - Second read (2026-09-22): HOLDS — both exercises re-dumped bar by bar. `exercise.ostinato.a.arpeggio`: every bar is the same right-hand eighths `A4 C5 E5 A5 E5 C5 A4 C5` over a left hand that never moves, `A2+A3` as whole notes — "a bare ostinato over a held A". `exercise.accompaniment.broken.a-minor.both`: the right hand is a stepwise scale (`A4 B4 C5 D5 | E5 F5 G5 A5 | A5 G5 F5 E5 | D5 C5 B4 A4`) and the left is broken triads whose bass moves `A–D–E–A` (`A3 C4 E4 C4 | D4 F4 A4 F4 | E4 G4 B4 G4 | A3 C4 E4 C4`) — a broken-chord left hand under a scale, with nothing held. The two are different figures, which the old sentence ran together.
  - Row: `lessonClaimsAboutMusic.test.ts` › "rock.6: the ostinato repeats one right-hand figure over an unmoving held A, and the broken-chord exercise moves its bass under a scale"
- [ ] **JUDGEMENT** `content/lessons/rock.6.md:39` — "the clearest example in the library of weight placed rather than struck"
  - Is: this is not checkable. The notes do match: thirteen bars of block chords.
  - Evidence: `dump_score.py song.classical.chopin-prelude-op28-20.nifc`.
  - Reader 1: REWRITE — "thirteen bars of block chords and nothing else to hide behind, which is why it is the one to practise weight on". A superlative over the whole library ("the clearest example in the library") is a survey of 2,053 rows that nobody has run, and it is the only part of the sentence that can be wrong; the reason it is a good example is already in the same clause and is measured — `notation.bars` is 13 and the texture is blocks throughout. The rewrite keeps the recommendation and drops the ranking.

Checked and true:
- The rung has three songs, all bundled: none is tagged `personal-build`.
- *Gnossienne*'s left hand repeats A3 then C4+E4.
- *Moonlight* has triplet arpeggios over a bass that moves about once a bar.
- The half-pedal exercise exists.
- The `minor-vamp` preset is A minor with held roots (`leftHand: 'whole'`).

Not checked in this lesson: "Everywhere else in this app the sustain pedal is changed *after* the new chord" was not audited app-wide.

## jam.6 — `content/lessons/jam.6.md`

Claims checked: 12. Findings: 2.

- [x] **FALSE** `content/lessons/jam.6.md:34` — "play a walking line and watch it name the chord you are implying"
  - Is: *Free play* names only notes held down at the same moment, three or more of them. A walking line plays one note at a time, so it names nothing. Released notes leave the set, with or without the pedal.
  - Evidence: `FreePlayScreen.ts` `onNote` (`held.add` / `held.delete`) and `draw()` → `nameHeldChord(notes)`; `nameHeldChord` returns null under 3 notes (`theory.ts:160-163`).
  - Fixed: now "it names a chord only from three or more notes held down together, so a line played one note at a time names nothing — hold a bar's notes down at once and watch it name the chord you are implying" — `FreePlayScreen.ts:139-153` (`held.delete` on note-off) and `nameHeldChord` returns null under 3 notes (`theory.ts:160-163`).
  - Second read (2026-09-22): HOLDS — in the sample of 2026-09-21 and re-read at both symbols. `FreePlayScreen.ts:142-143` is `held.add(event.midi)` on a note-on and `held.delete(event.midi)` on anything else, so the set is the keys down *now* and a released note leaves it; `:153` passes that set to `nameHeldChord`, which returns `null` under three midis **and** under three distinct pitch classes (`theory.ts:160-163`) — so an octave doubling does not make a third note either. A line played one note at a time therefore never reaches three and never names anything, which is what the sentence says.
  - Row: `lessonClaimsAboutApp.test.ts` › "jam.6: a line of single notes names nothing and three notes held together name a chord, and an octave doubling is not a third note"
- [x] **FALSE** `content/lessons/jam.6.md:36` — "The lab's *Blues — twelve bars* preset walks a bass under the form itself ... listen to one chorus of its line"
  - Is: *Jam it* plays a bass of root on beat 1 and fifth on beat 3, not a walk. The preset's `leftHand: 'walking'` exists only in the score *Read it* writes, which has to be opened and played back to be heard. The key is free, as the lesson says.
  - Evidence: `barSchedule` in `app/src/audio/backingLoop.ts` (bass at beat 0 and beat 2 only), used by `LabScreen.ts` `scheduleBacking`; `LAB_PRESETS` `blues-shuffle`.
  - Fixed: now "preset writes a walking bass under the form itself … press *Read it* and listen to one chorus of its line in the score, then play your own. *Jam it* plays a plainer bass, root and fifth." — `barSchedule` (`backingLoop.ts:52-76`) puts bass on beats 1 and 3 only; `blues-shuffle` `leftHand: 'walking'` is used by the score *Read it* writes. Whether *Jam it* should walk is the owner's decision.
  - Second read (2026-09-22): HOLDS — in the sample of 2026-09-21; re-read after the loop was rebuilt. `barSchedule` has moved to `backingLoop.ts:130-172` and still emits exactly two `bass` events a bar, the root at beat 0 and the chord's third listed pitch class — its fifth — at beat 2, and nothing else in the function touches the bass. `blues-shuffle` (`sightReading.ts:959-975`) is still `{leftHand: 'walking', locks: ['progression','leftHand','bars']}` with `key` absent, and E, A and D major are all in `LAB_KEYS`, so "set it to E, A or D" is settable. **One thing the sentence does not mention and a reader might now hear**: `barSchedule` grew a chord voice on 2026-09-22 and `LabScreen.ts:473` passes `comp: compPattern()`, so *Jam it* voices chords as well as the two bass notes; the sentence claims only what the bass does, and that is unchanged.
  - Row: `lessonClaimsAboutApp.test.ts` › "jam.6: the twelve-bar preset writes a walking left hand, Jam it's bass is root then fifth, and E, A and D are settable keys"

Checked and true:
- The walking exercises are four quarters a bar, with approach notes a step from the next root (`exercise.walking-bass.e.blues.intro` bars 1–5).
- The intro tier has no right hand. The standard tier has RH chords (`exercise.walking-bass.a.blues`).
- The keys are E, A and D.

Not checked in this lesson: the mastery line asks for the E walk "with chords on top", but the rung has a with-chords version in A only. That was read as a goal, not listed.

## classical.7 — `content/lessons/classical.7.md`

Claims checked: 20. Findings: 6.

- [x] **FALSE** `content/lessons/classical.7.md:32` — "the development is the part nobody can, because it is the only part that is not repeated"
  - Is: in this score the development is repeated. K. 545 i repeats bars 1–28 (the exposition) and bars 29–73 (development and recapitulation).
  - Evidence: MusicXML of `song.classical.mozart-k545-i`: forward repeat at bar 1, backward at 28, forward at 29, backward at 73.
  - Fixed: the reason "because it is the only part that is not repeated" is removed; the sentence ends "the development is the part nobody can." — MusicXML of `song.classical.mozart-k545-i`: repeats forward 1 / backward 28, forward 29 / backward 73.
  - Second read (2026-09-22): HOLDS — the MusicXML re-read bar by bar for `<repeat>`: forward at bar 1, backward at 28, forward at 29, backward at 73, and 73 measures in the file. So the second repeat encloses everything from 29 to the end — the development and the recapitulation together — and there is no unrepeated part at all in this edition. The deletion was right. What is left of the sentence, "the development is the part nobody can", is a teaching judgement and the row below does not touch it.
  - Row: `lessonClaimsAboutMusic.test.ts` › "classical.7: K. 545's first movement repeats both halves, so no part of it is played once" — pins the reason that was removed rather than the sentence that stands, which asserts nothing checkable.
- [x] **UNOFFERED** `content/lessons/classical.7.md:36` — "A Chopin nocturne writes the tune once plainly and then again with a spray of small notes over it."
  - Is: there is no nocturne among the rung's six options: K. 545, Moonlight, Pathétique II, Mazurka Op. 7 No. 1, and Inventions 1 and 4. Nocturnes are in the Library, but this paragraph does not point there.
  - Evidence: `classical.7` `songOptions` in `stage-7.json`.
  - Fixed: now "A Chopin nocturne (several are in the Library) writes the tune once plainly…" — catalog has 13 nocturne rows, all `tracks: ['classical']`, none tagged `personal-build`.
  - Second read (2026-09-22): HOLDS — the rung's six `songOptions` re-read (K. 545 i, *Moonlight* i, *Pathétique* ii, the Op. 7 No. 1 mazurka, Inventions BWV 772 and BWV 775): no nocturne among them, so the pointer is still needed. The catalog still holds 13 rows whose title says "Nocturne", every one `tracks: ['classical']`, so "several are in the Library" is true and the Library's Classical filter is where they are. The pointer also satisfies `lessonClaims.test.ts`'s rule, which accepts a named piece the rung does not offer only in a sentence matching `librar|import|find more|shelf`.
  - Row: `lessonClaimsAboutApp.test.ts` › "classical.7: no nocturne is on the rung and several are in the Library under Classical"
- [x] **UNOFFERED** `content/lessons/classical.7.md:54` — "The other inventions, waltzes and nocturnes are in the Library."
  - Is: the other 13 inventions are in the Library under Classical. But "other waltzes and nocturnes" implies some are on this rung, and none are.
  - Evidence: catalog search for `invention` returned BWV 772–786, all `tracks: ['classical']`. `songOptions` as above.
  - Fixed: now "The other inventions, and Chopin's waltzes and nocturnes, are in the Library." — no longer implies waltzes or nocturnes on the rung; catalog: 15 inventions (BWV 772–786) and 15 Chopin waltz rows, all `['classical']`.
  - Second read (2026-09-22): HOLDS — in the sample of 2026-09-21 and recounted here, and two of the three counts have moved since the fix, which is the argument for the row. The catalog now holds **15** invention rows, **12** Chopin waltz rows and **13** nocturne rows; the rung offers two of the inventions and none of the waltzes or nocturnes. The sentence claims only that the others are in the Library, which no count disturbs — so the row asserts the shape ("more than the rung offers, none of them on the rung") and not the numbers, which is the right thing for a figure that changes with every import.
  - Row: `lessonClaimsAboutApp.test.ts` › "classical.7: the rung offers two inventions and no waltz or nocturne, and the Library holds more of all three"
- [x] **UNOFFERED** `content/lessons/classical.7.md:56` — "Taking the nocturnes too slowly. They are marked *Andante* and *Larghetto*"
  - Is: no nocturne is on the rung. The two nocturnes meant are not named, so the tempo markings could not be checked against a file.
  - Evidence: as above.
  - Fixed: now "Taking nocturnes too slowly. Op. 9 No. 2 is marked *Andante* and No. 1 *Larghetto*" — `dump_score.py` text lines: `chopin-nocturne-op9-2` "Andante", `chopin-nocturne-op9-1` "Larghetto"; both in the catalog, tagged `musetrainer`.
  - Second read (2026-09-22): HOLDS, and it took a second search to say so. Collecting the distinct `<words>` of `song.classical.chopin-nocturne-op9-1` and printing the first five alphabetically showed **Adagio** and no Larghetto, which read as a flat contradiction of the sentence's "*Larghetto*, not *Adagio*". Re-run per measure instead of as a set, the file says `Larghetto` at **bar 1** and `Adagio` at bars 24, 25 and 26 — a passing marking inside the piece, not its tempo. `song.classical.chopin-nocturne-op9-2` says `Andante` at bar 0. So both markings the sentence names are the opening ones, and the "not *Adagio*" is about the pace rather than about a word the file lacks. Searched across all 13 nocturne rows for a printed tempo word: five carry one — Op. 9 No. 1 (Larghetto), Op. 9 No. 2 and its easy copy (Andante), Op. 15 No. 2 (Larghetto) and No. 20 (Lento con gran espressione) — and the other eight state only a metronome number.
  - Row: `lessonClaimsAboutMusic.test.ts` › "classical.7: Op. 9 No. 2 opens marked Andante and Op. 9 No. 1 opens marked Larghetto"
- [x] **UNOFFERED** `content/lessons/classical.7.md:66` — "a nocturne where the ornament sounds like one gesture rather than a scale"
  - Is: this mastery line needs a piece the rung does not offer.
  - Evidence: as above.
  - Fixed: now "a nocturne from the Library where the ornament…" — the mastery line still asks for a piece the rung does not offer; whether to put a nocturne on the rung is the owner's decision.
  - Second read (2026-09-22): HOLDS — the mastery line at `classical.7.md:66-67` reads "a nocturne from the Library where the ornament sounds like one gesture rather than a scale", and the rung's six `songOptions` still hold no nocturne, so the pointer is doing the same work as the one at `:36` and the sentence no longer asks for something the rung cannot supply.
  - Row: no row of its own — the same assertion as the `:36` finding's row (`lessonClaimsAboutApp.test.ts` › "classical.7: no nocturne is on the rung and several are in the Library under Classical"); a second identical row would test the same two facts twice. The clause about how the ornament *sounds* is unheard and untestable, and nothing here asserts it.
- [ ] **JUDGEMENT** `content/lessons/classical.7.md:50` — "a left hand that leans on beat two or three, not one — the mazurka's accent"
  - Is: this is correct as a description of the genre. The Op. 7 No. 1 file was not read for accent marks.
  - Evidence: none read.
  - Reader 1: RIGHT about the beat, WRONG about the hand — the file was read this time. `song.classical.chopin-mazurka-op7-1.nifc` carries **five** `<accent>` elements and no `<strong-accent>`, and every one of the five falls on **beat 2**: bars 28, 32, 48 and 52 in the right hand, and bar 52 in the left as well. So "leans on beat two or three, not one" is on the page, and it is beat two specifically in this piece. But the sentence attributes the lean to "a left hand", and four of the five marks are the right hand's — the accompaniment's characteristic stress is a genre fact the engraving does not carry. Smallest true change: "an accent on beat two or three, not one — the mazurka's own lean", leaving the hand out.

Checked and true:
- Stage 6 was melody over accompaniment.
- The rung has six songs.
- The inventions are No. 1 in C and No. 4 in D minor.
- Duet plays the other hand at a fixed velocity of 70 (`app/src/score/ScoreSession.ts`, `velocity: 70`).
- *Moonlight* and *Pathétique* II are the named movements.

Not checked in this lesson: "Bach wrote almost no dynamics" (HISTORY, correct in general, not listed).

---
Batch 4: 17 of 17 lessons. 57 findings
(36 FALSE, 2 STALE, 1 WRONG-COUNT, 4 UNOFFERED, 0 THEORY, 8 JUDGEMENT, 2 UNVERIFIED; plus 4 HISTORY).
Lessons not finished: none.

Fix pass: 43 fixed, 0 found wrong and not fixed, 14 left open (THEORY/JUDGEMENT/HISTORY/UNVERIFIED or needs a build). Lessons edited: theory.5, improv.5, latin, technique.5, rock.5, jam.5, classical.6, ragtime.6, technique.6, blues.6, chords-pop.6, theory.6, improv.6, rock.6, jam.6, classical.7.
