# Lesson audit — batch 3

Instruments used throughout: `python tools/content/dump_score.py <id>` for every score claim;
the rung objects in `content/curriculum/stage-4.json` / `stage-5.json` (read in full per rung);
`app/public/content/catalog.json` rows for composer, title and `notation`; the app code named in
each finding. Nothing here has been heard.

## 4.6 — `content/lessons/4.6.md`

Claims checked: 11. Findings: 5.

- [x] **STALE** `content/lessons/4.6.md:12` — "The end of the core path."
  - Is: core rung `4.7` "Learning it from memory" follows it, in the same unit (`4.6`) of stage 4; 4.7 is the last core rung.
  - Evidence: `content/curriculum/stage-4.json`, unit `4.6`, `lessons` = [`4.6`, `4.7`], both `track: core`; a walk of all `stage-*.json` finds no core rung after `4.7`.
  - Fixed: now "Nearly the end of the core path: only *Learning it from memory* comes after it" — re-read stage-4.json: unit `4.6` holds core rungs `4.6` and `4.7`, and no stage file has a core unit after it.
- [x] **FALSE** `content/lessons/4.6.md:52` — "**Tools for this rung.** Reading ahead needs music you have not met, and the daily read on *Today* is exactly that"
  - Is: the rung's only tool is `blind` ("Play it blind", opening the first playable song blind) — the very mode lines 18–19 say trains memory rather than read-ahead. Today's sight-read is not a tool of this rung.
  - Evidence: stage-4.json rung `4.6` `tools: [{"kind":"blind"}]`; `app/src/ui/screens/LessonScreen.ts:451-455` (`case 'blind'` → `make('Play it blind', … navigateScore(id, { blind: true }))`).
  - Fixed: the paragraph now opens with the rung's actual button, *Play it blind*, which opens one of the rung's pieces with the notation hidden ("the memorising habit, not read-ahead"), and keeps the Today daily read as advice rather than as the rung's tool — rung `tools` re-read (`blind` only), `LessonScreen.ts` `case 'blind'` re-read.
- [x] **FALSE** `content/lessons/4.6.md:43` — "**Performance mode** scores you with no stopping and no second attempts"
  - Is: the score-menu row is called **Perform**; it removes Start again and loops, but does not set the practice mode, so in Wait for me the app still stops and waits for the note. "No stopping" is not enforced.
  - Evidence: `app/src/ui/screens/ScoreScreen.ts:1083` (restart row dropped), `:1101` (menu row "Perform": "no restarts, no loop"), `:1405`, `:1481` (loop off); every `performanceRun` line in the file (grep) — none sets `mode`.
  - Fixed: now "**Perform** in the score menu gives you one pass, start to finish, with no restarts and no loop. Play it in *Keep tempo*: in *Wait for me* the app still waits for each note"; the closing self-check says "played with **Perform** on" instead of "in Performance mode" — `ScoreScreen.ts:1101` menu text and the `performanceRun` lines re-read (none sets `mode`); mode labels from `MODES` (`ScoreScreen.ts:69-74`).
- [x] **UNOFFERED** `content/lessons/4.6.md:47` — "one of the easy *Für Elise* settings works well"
  - Is: the rung offers one easy setting, `song.classical.beethoven-fur-elise.easy`. A second, `song.classical.beethoven-fur-elise.beginner`, is in the catalog but not on this rung, and the lesson does not point to the Library.
  - Evidence: rung `4.6` `songOptions`; catalog title search "elise" → `.easy` (4.1), `.beginner` (4.1), the full WoO 59 (6.4).
  - Fixed: now "the easy *Für Elise* work well (a beginner setting of *Für Elise* is in the Library too)" — rung `songOptions` re-read (`.easy` only); catalog has `song.classical.beethoven-fur-elise.beginner`, `pd`, tracks `classical`/`core`.
- [ ] **JUDGEMENT** `content/lessons/4.6.md:29` — "A phrase is a musical sentence, usually two or four bars"
  - Is: standard teaching generalisation; likely right. Listed for a musician's eye only.
  - Evidence: none possible from the score.

Checked and true: Blind is in the score menu and hides the notation (`ScoreScreen.ts:1100`, `style.css:5419-5421`); Petzold *Minuet in G* is on the rung and its catalog composer is Christian Petzold, Für Elise's is Beethoven (different composers — true); Today's sight-read is a seeded phrase per day (`TodayScreen.ts:396-399`, `dailySeed(dayKey(now))`); "two pieces … 90 % … 90 %" matches `mastery` (`songsRequired: 2`, `minAccuracy: 0.9`, `minTempoPct: 0.9`).

Not checked in this lesson: whether `minAccuracy`/`minTempoPct` are enforced per rung — grep for `minAccuracy` under `app/src` finds only the type (`curriculum/types.ts:147`); passes use the global `evaluateOutcome` criteria (`engine/Scoring.ts:177-189`). The lesson's "How you'll know" is a self-check, so not listed.

## 4.7 — `content/lessons/4.7.md`

Claims checked: 10. Findings: 3.

- [x] **FALSE** `content/lessons/4.7.md:39` — "that is the app checking you have the notes before it takes them away"
  - Is: the app does not check; Blind is an unconditional toggle available on any score at any time, with no prior-pass condition.
  - Evidence: `app/src/ui/screens/ScoreScreen.ts:1060-1063` (`blindToggle` navigates with `blind: !blind`, no condition); `LessonScreen.ts:451-455` opens blind directly.
  - Fixed: now "that is you checking you have the notes before you take them away; the app does not check" — `blindToggle` (`ScoreScreen.ts:1060-1064`) re-read, no condition on it.
- [x] **FALSE** `content/lessons/4.7.md:40` — "the score disappears, the keyboard strip and the cursor stay"
  - Is: the cursor is hidden with the notation (it lives inside the hidden stage); what stays visible on the stage is the count-in, the beat dot and the corner readout, plus the keyboard strip.
  - Evidence: `app/src/score/WindowRenderer.ts:695-703` (cursor `.score-cursor` appended to the score view); `ScoreScreen.ts:384-392` comment "the cursor still tracks — it is simply not drawn where he can see it"; `app/src/style.css:5406-5442` (stage `visibility: hidden`, only `.score-countin`, `.score-beat`, `.score-stage__corner` made visible again).
  - Fixed: now "the score and its cursor disappear, the keyboard strip, the count-in and the beat dot stay" — `style.css` blind rules re-read (only count-in, beat dot and corner re-shown; no rule re-shows `.score-cursor`). The corner readout is left unnamed because it is filled only when the chrome has folded away (`ScoreScreen.ts:455-462`).
- [x] **FALSE** `content/lessons/4.7.md:43` — "the rung wants 90 % of what you managed with the page"
  - Is: nothing compares a blind run with a sighted one. The rung's rule is an absolute string, `"two clean passes, then blind at >=0.9"`, and completion is `songsRequired: 1` pass of any kind; no app code reads the custom string except a syntactic check.
  - Evidence: stage-4.json rung `4.7` `mastery`; `app/src/curriculum/selectors.ts:83-86` (`demandsMeasuredAccuracy` = regex only), `:94-117` (`lessonComplete` counts passes); grep `sighted|blind at|two clean` under `app/src` → comments only.
  - Fixed: now "so aim for 90 % of what you managed with the page. The app does not make that comparison for you; the rung counts a pass." — `selectors.ts` `lessonComplete` and `demandsMeasuredAccuracy` re-read; the grep for `sighted|blind at|two clean` returned only comments. Whether the app should compare blind with sighted runs is the owner's decision, not made here.

Checked and true: blind runs are judged exactly as sighted ones (`ScoreScreen.ts:169-177`); the twelve-bar exercise is 12 bars with harmony changes at bars 5 and 9 (`dump_score.py exercise.blues.twelve-bar-shuffle.d`: D7 ×4, G7 G7 D7 D7, A7 G7 D7 A7); the oom-pah is 8 bars, two four-bar halves (`dump_score.py exercise.oompah.c.octave`, C–F–G–C in two-bar units); "The exercises are forms" — the third exercise, `exercise.walking-bass.d.blues.intro`, is also a 12-bar blues form (dump, bars 1–12).

Not checked in this lesson: the memory-psychology claims (lines 12–23) — teaching advice, not listed.

## classical.4 — `content/lessons/classical.4.md`

Claims checked: 16. Findings: 5.

- [x] **FALSE** `content/lessons/classical.4.md:46` — "and a Gurlitt study with the two side by side"
  - Is: the Gurlitt study (Op. 82, 16 bars, 2/4) has slurs in the right hand only and no staccato mark anywhere; the left hand is unmarked repeated dyads. Legato and staccato are not written side by side.
  - Evidence: MusicXML of `song.classical.gurlitt-cornelius-gurlitt-op-82.pdmx` read directly (articulation count per staff): staff 1 = 78 notes, 14 slur starts, 0 staccato; staff 2 = 62 notes, no articulation; `dump_score.py` bars 1–16 LH A3+C4 / B3+D4 / C4+E4 / D4+F4 dyads.
  - Fixed: now "a Gurlitt study that slurs the right hand and leaves the left unmarked, so the contrast is yours to supply" — MusicXML re-read: 14 slur starts, every slurred note on staff 1; no `<articulations>` element in the file.
- [x] **FALSE** `content/lessons/classical.4.md:43` — "two of the child Mozart's minuets, K. 1e in G and K. 1f in C"
  - Is: the K. 1e item is not one minuet: bars 1–18 are the G minuet and bars 19–36 are a "Trio." in C that is note-for-note the K. 1f item (K. 1f bars 1–18), with "Menuetto da Capo al Fine". The two options overlap; the K. 1e file ends in C (`finalBass: 0`).
  - Evidence: `dump_score.py song.classical.mozart-w-a-mozart-minuet-in-g-major-k1e.pdmx` (text "Trio.", key change 1→0 fifths at bar 19, bars 19–36) against `dump_score.py song.classical.mozart-w-a-mozart-minuet-in-c-major-k1f.pdmx` bars 1–18.
  - Fixed: now "K. 1e in G (its file carries K. 1f as the Trio) and K. 1f in C on its own" — both dumps re-read: K. 1e bars 19–22 and 35–36 match K. 1f bars 1–4 and 17–18 note for note, text "Trio." on the K. 1e score. The overlapping options themselves are a curriculum question for the owner.
- [ ] **JUDGEMENT** `content/lessons/classical.4.md:45` — "Schumann's *Chorale* from the *Album for the Young*, all legato"
  - Is: nothing about touch is written: the score has no slurs and no staccato in either hand, only 9 fermatas per staff. "All legato" is a performance-practice reading of a chorale, not something the page shows.
  - Evidence: MusicXML of `song.classical.schumann-schumann-album-for-the-young-op-68-no-4-a-hymn-tune-choral.pdmx`, articulation count: staff 1 = 123 notes, fermata 9; staff 2 = 122 notes, fermata 9.
- [ ] **JUDGEMENT** `content/lessons/classical.4.md:42` — "the first sonatina most learners meet"
  - Is: a generalisation about teaching practice; a musician can confirm or not.
  - Evidence: none possible.

Checked and true: six songs on the rung (stage-4.json `classical.4` `songOptions`, 6 ids); Attwood *Sonatina in G* (catalog composer Thomas Attwood, 1 sharp, `finalBass` 7 = G); C. P. E. Bach *March in D* (catalog composer Carl Philipp Emanuel Bach, BWV Anh. 122, 2 sharps, `finalBass` 2 = D), "staccato in both hands" (staff 1: 10 staccato, staff 2: 19 staccato); K. 1e and K. 1f are four-bar phrases after a pickup (K. 1f: pickup bar 1, phrases 2–5, 6–9, pickup 10, 11–14, 15–18; K. 1e the same shape) with slurs written in (K. 1e 32 + 20 slur starts; K. 1f 3 + 2 — sparse); K. 1f is in C (no sharps, ends on C). THEORY on ornaments (appoggiatura on the beat taking time, acciaccatura crushed, trill with the upper note, starting on the upper in Mozart's time) and staccato as relative length — standard, not listed.

- [ ] **UNVERIFIED** `content/lessons/classical.4.md:41` — "Six options at Grade 1"
  - Is: by the app's own scale three of the six are Stage 5, which `docs/02-curriculum.md:22` equates with Grade 2–3: Bach *March* 5.55, K. 1e 5.8, K. 1f 5.13; the other three are Stage 4 (≈ Grade 1): Gurlitt 4.48, Schumann 4.63, Attwood 4.8. All six levels are `levelSource: estimated`, so a musician must say which grade is right.
  - Evidence: catalog `level` / `levelSource` of the six rows; no `abrsmGradeApprox` on any of them.

Not checked in this lesson: Composition dates and the Anna Magdalena notebook provenance of BWV Anh. 122 (HISTORY, matches the catalog title only).

## classical.4.shelf — `content/lessons/classical.4.shelf.md`

Claims checked: 30. Findings: 8.

- [x] **WRONG-COUNT** `content/lessons/classical.4.shelf.md:23` — "three Chopin *Préludes* and a waltz"
  - Is: four Chopin préludes are on the shelf — Op. 28 Nos. 7, 20, 6 (`.nifc`) and No. 4 (`.alt`); one waltz (Op. 64 No. 2) is right.
  - Evidence: stage-4.json `classical.4.shelf` `songOptions` (50 ids), catalog titles of `song.classical.chopin-prelude-op28-7.nifc`, `-20.nifc`, `-6.nifc`, `song.classical.chopin-prelude-op28-4.alt`.
  - Fixed: now "four Chopin *Préludes*"; the waltz moved into the Stage 8 clause ("Chopin's C-sharp minor nocturne and waltz") — all 50 shelf rows re-read: préludes Op. 28 Nos. 7, 20, 6, 4; one waltz, Op. 64 No. 2, level 8.1.
- [x] **FALSE** `content/lessons/classical.4.shelf.md:20` — "up to the Chopin nocturnes, … at Stage 8"
  - Is: of the two nocturnes on the shelf, only No. 20 (`.alt`, level 8.1) is Stage 8; Op. 9 No. 2 (easy) is level 6.1.
  - Evidence: catalog `level` of `song.classical.chopin-nocturne-20.alt` 8.1 and `song.classical.chopin-nocturne-op9-2.easy` 6.1; level is `stage.unit` (`docs/02-curriculum.md:20`).
  - Fixed: now "up to Chopin's C-sharp minor nocturne and waltz and the Schubert–Liszt *Ständchen* at Stage 8" — levels re-read: Nocturne No. 20 `.alt` 8.1, Waltz Op. 64 No. 2 8.1, Ständchen 8.2; Op. 9 No. 2 (easy) 6.1 is no longer called Stage 8.
- [x] **FALSE** `content/lessons/classical.4.shelf.md:21` — "the Handel–Halvorsen *Passacaglia* at Stage 8"
  - Is: the shelf's Passacaglia is level 6.41 (Stage 6). The highest-levelled shelf pieces are Super Mario Land 2 (8.54), Ständchen (8.2), Chopin Nocturne No. 20 and Waltz Op. 64 No. 2 (8.1).
  - Evidence: catalog `level` of `song.classical.handel-passacaglia-handel-halvorsen-piano-solo.pdmx` = 6.41 (estimated); levels of all 50 rows read.
  - Fixed: the *Passacaglia* moved out of the Stage 8 clause into the list of shelf pieces, with no stage given — level re-read, 6.41.
- [x] **FALSE** `content/lessons/classical.4.shelf.md:24` — "Elgar's *Salut d'amour* and *Nimrod*, Puccini's *O mio babbino caro*" (listed as the shelf common to every build, before "on the personal build only")
  - Is: these are personal-build-only too: both Elgar rows are `compositionStatus: in-copyright` and Puccini is `unknown`, and the strict (public) build replaces every non-`pd` row with a placeholder. The same holds for Mascagni, Kreisler, Holst's *Jupiter*, Mahler 5 (`unknown`) and Rachmaninoff 2 (`in-copyright`). 27 of the 50 are `in-copyright` or `unknown` (the three Chopin `.nifc` préludes carry no `compositionStatus` and come from a different importer; not counted). (Whether Elgar's 1888/1899 works are really in copyright is a separate catalog question — HISTORY.)
  - Evidence: `compositionStatus` of all 50 shelf rows in `app/public/content/catalog.json`; `tools/content/import_pdmx.py:207` (`bundled = status == "pd" or (personal and not strict_license)`), `:14-16` (strict build emits a placeholder).
  - Fixed: Elgar's two pieces, Puccini's, and "pieces by Mascagni, Kreisler, Holst, Mahler and Rachmaninoff" now sit after "on the personal build only"; the next paragraph says "The rest is in copyright or of unknown status" instead of "The film and game pieces are in copyright" — `compositionStatus` of all 50 rows re-read (27 non-`pd`, each now inside the personal-build list); `import_pdmx.py:206-207` re-read. The `.nifc` préludes (no `compositionStatus`) stay in the common list, unchecked, as the finding says.
- [x] **WRONG-COUNT** `content/lessons/classical.4.shelf.md:26` — "the film and game pieces the owner asked for by name: Einaudi, Zimmer, Sakamoto, Uematsu, Djawadi, Hurwitz, Glass, de Senneville, Clayderman"
  - Is: other non-`pd` film, game and modern pieces on the shelf are not named: *Across the Violet Sky* (Evan Call), *Pan's Labyrinth* theme, *Super Mario Land 2* ending (Kazumi Totaka), *Rosemary's Waltz* (Richard Rodney Bennett), *Travelling* (James Spiteri), *Days in the Sun* (arr. Abby Palmer), *G Minor Bach* (Luo Ni).
  - Evidence: catalog `composer` and `compositionStatus` (`unknown` / `in-copyright`) for those seven shelf ids.
  - Fixed: the named list is kept and followed by "and seven other film, game and modern pieces" — the seven rows re-read, each non-`pd`.
- [x] **FALSE** `content/lessons/classical.4.shelf.md:28` — "The Library's Classical filter holds what came off this shelf: … and every second edition."
  - Is: two second editions are *on* the shelf — `song.classical.chopin-nocturne-20.alt` and `song.classical.chopin-prelude-op28-4.alt` — while their first editions (`song.classical.chopin-nocturne-20`, `song.classical.chopin-prelude-op28-4`) are the ones off it.
  - Evidence: shelf `songOptions`; catalog rows with `variantOf` (all `.alt` ids listed); both originals present in the catalog.
  - Fixed: now "and other editions of shelf pieces — for the nocturne and the E minor prélude the shelf keeps the alternative edition and the Library the first" — both `.alt` rows on the shelf, both originals in the catalog with `tracks: ['classical']`, re-read. Not checked: that every other shelf piece's other editions carry `classical`.
- [x] **FALSE** `content/lessons/classical.4.shelf.md:34` — "the public build shows the row and says where to get the score"
  - Is: the placeholder's hint says the composition is not bundled and to "import your own copy of the score otherwise"; it does not say where to get one.
  - Evidence: `tools/content/import_pdmx.py:46-50` (`IMPORT_HINT`); `tools/content/import_musetrainer.py:56` (same wording).
  - Fixed: now "the public build shows the row and says to import your own copy of the score" — `IMPORT_HINT` re-read (`import_pdmx.py:46-50`).
- [x] **FALSE** `content/lessons/classical.4.shelf.md:35` — "Anything else you love — Yiruma, Tiersen, Hisaishi — buy the MusicXML or transcribe it and import it"
  - Is: a Hisaishi piece is already in the catalog: `song.classical.hisaishi-totoro-path-of-the-wind.pdmx` (*Totoro: Path of the Wind*, tracks `classical`, level 3.64, file bundled in the personal build).
  - Evidence: catalog search on id/title/composer for yiruma, tiersen, hisaishi, "river flows", amelie/amélie, comptine, totoro, spirited, merry-go-round, "kiss the rain" → that one row only.
  - Fixed: now "Yiruma, Tiersen, more Hisaishi than the Library's *Totoro: Path of the Wind*" — catalog re-searched for `hisaishi|totoro|yiruma|tiersen` and, differently shaped, `river flows|amélie|comptine|kiss the rain|spirited|merry-go|ghibli|miyazaki`: the Totoro row only (`in-copyright`, so a placeholder on the public build).

Checked and true: 50 pieces, 50 distinct ids, no two rows of one piece; *Für Elise* (easy) 4.1 and *Clair de Lune* (easy) 4.7 are Stage 4; Ständchen 8.2 is Stage 8; Satie *Gymnopédie* and *Gnossienne*, Pachelbel *Canon*, *Air on the G String*, a Chopin waltz, Grieg *Morgenstimmung*, the *Romanza*, *Swan Lake*, Vivaldi *Spring* are each on the shelf; the named Einaudi, Zimmer (2), Sakamoto (3), Uematsu, Djawadi, Hurwitz, Glass, de Senneville, Clayderman rows are all non-`pd`; *Toccata and Fugue*, *Flight of the Bumblebee*, *Rondo alla Turca* and the *Moonlight* III are in the catalog with `classical` in `tracks` (the Library track filter, `LibraryScreen.ts:105`); everything `pd` is bundled (`import_pdmx.py:207`); an import can join this rung's list if assigned to it (`curriculum/load.ts:147-180`, `overlayImports`); rung 3.5 teaches legato pedalling (`content/lessons/3.5.md:17`).

Not checked in this lesson: the THEORY of tone, voicing and pedalling (lines 41–48) — teaching advice; the composer attributions on the catalog rows (e.g. *Hungarian Sonata* under Clayderman; *Merry Christmas Mr. Lawrence* spelled "Ryuichi Salamoto" in the catalog) — HISTORY, catalog not lesson.

## chords-pop.4 — `content/lessons/chords-pop.4.md`

Claims checked: 20. Findings: 5.

- [x] **FALSE** `content/lessons/chords-pop.4.md:41` — "*Hallelujah*, in its easy setting, is the four-chord song itself"
  - Is: the easy *Hallelujah* is not I–V–vi–IV. Its left hand alternates C and A (I–vi, bars 1–8), then F–G–C (IV–V–I), an E major chord (G♯ in the bass, bar 18) to Am, and a chorus of F F Am Am F F then G–C (IV–IV–vi–vi–IV–IV–V–I). It has no chord symbols.
  - Evidence: `dump_score.py song.folk.hallelujah-easy.pdmx`, LH bars 1–29; `notation.chordCount` 0.
  - Fixed: now "is not the four-chord loop but uses mostly its chords in other orders — I and vi rocking back and forth, then IV, V and I, and a chorus of IV and vi — with no symbols, so naming them is your job" — LH re-read: bars 1–8 C/A alternating, 9–12 F, F–G, C, G, bar 18 G♯ (the E chord, hence "mostly"), bars 21–26 F F Am Am F F; `chordCount` 0.
- [ ] **THEORY** `content/lessons/chords-pop.4.md:39` — "*Scarborough Fair* and *Shenandoah* are the modal tunes where vi and ii do the work" (Scarborough Fair)
  - Is (believed wrong): this *Scarborough Fair* centres on E with C♯ (E Dorian) and its chords are Em, D, A, G — i, ♭VII, IV, ♭III of E. No chord acts as vi or ii except by reading everything relative to G, where the tonic itself would be "vi".
  - Evidence: `dump_score.py song.pop.scarborough-fair.pdmx`, bars 1–18 (C♯5 bar 7, A major bar 7, ends on Em, `finalBass` 4).
- [ ] **THEORY** `content/lessons/chords-pop.4.md:39` — "*Scarborough Fair* and *Shenandoah* are the modal tunes" (Shenandoah)
  - Is (believed wrong): *Shenandoah* here is plainly G major — key signature one sharp, `mode: major`, F♯ throughout, ends on G — not modal. It does use ii (Am, bar 2) and vi (Em, bars 6–7), so "vi and ii do the work" holds for it.
  - Evidence: `dump_score.py song.folk.traditional-music-shenandoah.pdmx`, bars 1–10; chords G, Am, C, D, D7, Em, Bm.
- [x] **FALSE** `content/lessons/chords-pop.4.md:42` — "*Alexander's Ragtime Band* is the busiest chart here, putting vi, ii and a chord borrowed from another key in a row"
  - Is: "busiest" is true (55 chord symbols, most on the rung). But vi, ii and the out-of-key chord (D / D7, a secondary dominant) never appear in a row: bars 2–3 run Am Em Dm G C (vi iii ii V I) with no D; bars 13–16 run D D7 G … Dm G with no Am; bars 27–30 run F D C G Am Em with no Dm.
  - Evidence: `dump_score.py song.classical.alexander-s-ragtime-band.pdmx`, bars 1–32.
  - Fixed: now "putting vi, iii and ii in a row and borrowing a D major chord from another key" — chord symbols re-read: bars 2–3 and 18–19 Am Em Dm (vi iii ii); D / D7 at bars 13 and 28, not adjacent to that run.
- [ ] **THEORY** `content/lessons/chords-pop.4.md:23` — "**ii–V–I** is the most common cadence in Western music"
  - Is (believed overstated): the most common cadence is the authentic cadence V–I in general; ii–V–I is the standard approach in jazz and common elsewhere, but "most common in Western music" is for a musician to confirm.
  - Evidence: THEORY — no score checks this.

Checked and true: seven songs on the rung (`songOptions`, 7 ids); *Greensleeves* twice, one tune with block triads and with a waltz bass (`dump_score.py` both, bars 0–15, same RH, LH held triads vs bass-then-two-chords); *Skye Boat Song* written in both hands with no chord symbols (48 bars, `chordCount` 0, LH bass notes); an imported lead sheet can join the rung if assigned to it (`curriculum/load.ts:147-180`); the lab tool is preset `pop-four-chord`, progression `i-v-vi-iv` = I–V–vi–IV with the key not locked (`app/src/engine/sightReading.ts` `LAB_PRESETS`, locks `['progression','leftHand']`); the lab's Jam grid lights the bar's chord tones on the keyboard strip (`app/src/ui/screens/LabScreen.ts:340-347`, `showChordOnKeys`). THEORY checked and right: diatonic triad qualities and C-major spellings; vi a minor third below the tonic; vi shares two notes with I; vi–IV–I–V is a rotation of the same loop; C/E means E in the bass.

Not checked in this lesson: "most of pop music" and "an implausible number of pop songs" — generalisations, not listed.

## blues.4 — `content/lessons/blues.4.md`

Claims checked: 22. Findings: 4.

- [x] **FALSE** `content/lessons/blues.4.md:56` — "Shuffle is a claim about timing, and the app will check it: in *Rhythm only* the long-short pair is judged where it falls and nowhere else"
  - Is: the engine has no notion of swing. Rhythm only matches each tap to the nearest step time computed from the written values, within `toleranceMs` (150–200 ms). The twelve-bar exercises write plain eighths with no swing mark, so the expected off-beat is the straight one: a shuffled off-beat is a sixth of a beat late and passes only by tolerance, and straight eighths pass too. The shuffle is not checked.
  - Evidence: `app/src/engine/PracticeEngine.ts:976-990` (`findRhythmSlot`: `Math.abs(atMs - step.tMs) <= toleranceMs`); `app/src/engine/types.ts:214`, `:227` (`toleranceMs` 200 / 150); grep `swing|swung` over `app/src` → only `audio/backingLoop.ts`, `ChordChartScreen.ts`, `DrillScreen.ts`, nothing in `engine/` or `score/`; `dump_score.py exercise.blues.twelve-bar-shuffle.c`: LH all `/eig`, `swungMark: false`.
  - Fixed: now "The shuffle itself the app does not check: *Rhythm only* judges each strike against the written straight eighths within a fixed window and has no idea of swing, so the feel is for your ear and the recording" — `findRhythmSlot` and `toleranceMs` re-read; `grep -rli "swing|swung" app/src` returned the same three files. The sentence avoids saying a shuffled note always passes: whether it falls inside 150 ms depends on the tempo. Whether to build swing judging is the owner's decision.
  - Built (2026-09-21): `EngineOptions.swing` moves the expected time of a written off-beat eighth to `SWING_OFFBEAT` (2/3 of the beat, the ratio `audio/backingLoop.ts` already swings by) in `prepareSession`, so every mode judges against it. The Score screen sets it from the piece’s measured `notation.swungMark`. **Two of this rung’s items carry the word** — *St. Louis Blues* and the shuffle-eighths exercise — and the rest do not, which the sentence now says: "the shuffle the app does check, on the pieces whose score says so".
- [x] **STALE** `content/lessons/blues.4.md:56` — "**Tools for this rung.**" (the paragraph names only *Rhythm only*)
  - Is: Rhythm only is a Score-screen mode, not a tool of this rung. The rung's tools are the lab preset `blues-shuffle` — twelve-bar blues with a locked **walking** left hand, not the boogie bass the lesson teaches — and Duet; the lesson mentions neither.
  - Evidence: stage-4.json `blues.4` `tools: [{"kind":"lab","preset":"blues-shuffle"},{"kind":"duet"}]`; `app/src/engine/sightReading.ts` `LAB_PRESETS` `blues-shuffle`: `leftHand: 'walking'`, locks `['progression','leftHand','bars']`.
  - Fixed: the paragraph now opens with the two tools — the lab "on the twelve bars with a walking bass locked in the left hand — not the boogie bass" and *Play it as a duet*, "the app on the left hand while you play the right" — `LAB_PRESETS` `blues-shuffle` re-read (`sightReading.ts:881-893`); `LessonScreen.ts` `case 'duet'` re-read (`hands: 'R'`, first playable *song*, so not one of the generated twelve-bars, which are `exercise` rows).
- [ ] **JUDGEMENT** `content/lessons/blues.4.md:44` — "the flat spelling runs out: … — and no edition prints those"
  - Is: C♭, F♭ and B𝄫 as blue notes do appear in some printed editions; "no edition" is a generalisation for a musician. The house rule (raised fourth) is respected and not reported.
  - Evidence: THEORY/JUDGEMENT; the spellings themselves (C♭ in F, F♭ in B♭, B𝄫 in E♭) are right.
- [ ] **UNVERIFIED** `content/lessons/blues.4.md:48` — "The twelve-bar left-hand patterns in C, F and G from the generator"
  - Is: ambiguous between two items. If it means the generated twelve-bar shuffles in C, F and G (`songOptions`), it is true. If it means the rung's drill titled *Twelve-bar left-hand patterns* (`drill.blues.lh-patterns`, params `keys: [C, F, G]`, `leftHandOnly`, `shuffle`), that drill plays a four-bar I–IV–V–I loop of triads in C only: its builder reads `form` (absent, so not 12-bar) and `keys[0]`, and nothing reads `leftHandOnly` or `shuffle`.
  - Evidence: catalog `drill.blues.lh-patterns`; `app/src/engine/drills/fromCatalog.ts:583-605` (`buildBackingTrack`, `twelveBarLoop(key, false)` → I, IV, V, I).

Checked and true: the twelve-bar layout in C (4 C7, 2 F7, 2 C7, G7, F7, C7, G7) matches `exercise.blues.twelve-bar-shuffle.c` bars 1–12, and the F and G versions follow the same form (dumps, chord symbols per bar); all three chords are written as dominant sevenths in all three (RH C–E–G–B♭, F–A–C–E♭, G–B–D–F in C); boogie bass root–5–6–5, C–G–A–G and F–C–D–C (C dump LH, 7 bars C, 3 bars F, 2 bars G); the blues scale C–E♭–F–F♯–G–B♭–C, F♯ spelled as a sharp (`dump_score.py exercise.blues-scale.c.1oct.right` bars 1–2); the rung offers the twelve-bar patterns in C, F and G (`songOptions`) and the shuffle exercise (`exercise.rhythm.shuffle-eighths.4bar` in `exerciseOptions`, text "Shuffle — play the eighths long-short", `swungMark: true`). THEORY checked and right: shuffle as the outer notes of a triplet; the three blue notes; a raised fourth spells in every key.

Not checked in this lesson: "Record yourself" — no app claim. "In every other style that would be a chord demanding resolution" — generalisation, not listed.

## jazz.4 — `content/lessons/jazz.4.md`

Claims checked: 19. Findings: 1.

- [ ] **THEORY** `content/lessons/jazz.4.md:28` — "The songs' chord symbols have sevenths and sixths in them — C7, Cm7, B♭m6. Here, play the triad: the letter, and minor if it says so, and nothing else."
  - Is (believed wrong as a rule for these songs): the symbols also include diminished and augmented chords, for which "the letter, and minor if it says so" gives the wrong triad: *Margie* has Fdim (bar 7), Gdim (bar 30) and F7+ (bars 20, 36); *Avalon* has C7+ (bars 13, 15). Fdim read this way becomes F major.
  - Evidence: `dump_score.py song.pop.margie.pdmx` and `song.pop.avalon.pdmx` (bars named); catalog `notation.chords` for both.

Checked and true: the shuffle-eighths exercise is four bars of eighths on one note, B4 (`dump_score.py exercise.rhythm.shuffle-eighths.4bar`); the three comping exercises are Gm, C, F triads in F (one flat), four bars each (dumps); Charleston = chord on beat 1 and the "and" of 2 then a half rest; Off-beats = chords only on the "ands"; four-on-the-floor = a short (eighth) chord on every beat, and its id/title says "four on the floor"; three songs on the rung, each titled "(1920)" and one staff with chord symbols; *Avalon* is the shortest (33 bars against 48 and 48), in 2/2, in F (one flat, ends on F); *Whispering* is in E♭ (three flats, ends on E♭); *Margie* has one flat; C7, Cm7 and B♭m6 are among the symbols (Avalon: B♭m6, C7; Whispering: Cm7, C7); the lab preset `jazz-comping` is ii–V7–I with a locked walking left hand and the key free (`LAB_PRESETS`); the next jazz rung, `jazz.5`, is "Swing, shell voicings and ii-V-I" (stage-5.json). THEORY checked and right: swing long-short ≈ two thirds / one third; the short note is late.

Not checked in this lesson: that *Margie* is "in" F — it has one flat but its last bass note is C (`finalBass: 0`); the lesson only claims the flat, so not listed.

## holiday.4 — `content/lessons/holiday.4.md`

Claims checked: 20. Findings: 0.

Checked and true: the first carol rung (`holiday`, stage-2.json) holds *Silent Night (melody)* in 6/8 (`dump_score.py song.classical.1818-franz-xaver-gruber-silent-night.pdmx`), so this rung's *Silent Night* being "in 3/4 this time" is right; four songs on the rung, each two staves with the left hand written out; *Silent Night* is in C, 3/4, with a broken-chord left hand in bars 1–23 of 24 (dump); *We Wish You a Merry Christmas* is in F (one flat, ends on F) with two-note chords in the left hand in 12 of its 16 full bars (dump, bars 1–3, 8–16); *Deck the Halls* is in C with a bass line in the left hand, chords only in bars 4 and 8 (dump); *Away in a Manger* is in F with two voices on each staff throughout (dump: RH v1/v2, LH v5/v7, bars 0–16); the two broken-chord exercises are in C and F and spread each chord one note at a time (dumps, LH C–E–G–E, F–A–C–A …); the oom-pah in F is a low bass note then the chord an octave or more up (`dump_score.py exercise.oompah.f.octave`, bars 1–8); the lab preset `ballad` plays I–vi–IV–V broken in the left hand with right hand `none` and the key not locked (`LAB_PRESETS`, locks `['progression','leftHand','rightHand']`); Free play judges and records nothing (`app/src/ui/screens/FreePlayScreen.ts:1-10`); the rung's tools are exactly `lab: ballad` and `play` (stage-4.json).

Not checked in this lesson: the sound of each device (lines 15–21) — unheard; teaching advice, not listed.

## theory.4 — `content/lessons/theory.4.md`

Claims checked: 21. Findings: 3.

- [x] **FALSE** `content/lessons/theory.4.md:41` — "**Melodic dictation.** The app plays two bars; you play them back."
  - Is: the drill plays four random notes from C4–G4, 500 ms apart — one bar of quarters at most — and its card prints the four note names (e.g. "E4 C4 G4 D4") before you answer. The item's `bars: 2` and `mode: dictation` are never read.
  - Evidence: catalog `drill.ear.melodic-dictation` `drill: {"kind":"call-response","params":{"bars":2,"mode":"dictation"}}`; `app/src/engine/drills/fromCatalog.ts:202-203` (`callResponseDrill({ ...base, count })`, params dropped); `app/src/engine/drills/factories.ts:277-296` (4-note phrase from `range(60, 67)`, `playback` at `i * 500`, `label` = note names); `app/src/ui/screens/DrillScreen.ts:1169-1298` (no `case 'call-response'` in `drawStage`, so the `default` symbol card shows `current.label`).
  - Fixed: now "The app plays four notes; you play them back. Their names are printed on the card as well, so look away from it until you have answered"; the self-check says "a four-note phrase" instead of "a two-bar melody" — `callResponseDrill` (4 notes, `label` = names), `fromCatalog.ts:202-203` and the `default` card in `DrillScreen.ts:1287-1297` re-read. The names on the card break the ear-drill rule whatever the lesson says; fixing the drill (and reading `bars`) is the owner's decision.
  - Built (2026-09-21): both. `DrillPrompt.labelIsAnswer` marks the dictation prompt and the card draws the headphone glyph until the attempt is judged, with `▶ Play again` as the replay; and `bars: 2` is read, so the phrase is eight notes rather than four. The sentence no longer has to tell the learner to look away from the card.
- [x] **FALSE** `content/lessons/theory.4.md:48` — "Melodic dictation asks you to hold two bars before you can play any of them"
  - Is: as above — four notes, and their names are on screen, so nothing has to be held in the ear.
  - Evidence: same as the finding above.
  - Fixed: now "asks you to hold four notes before you can play any of them" (the look-away advice two paragraphs up covers the names) — same evidence.
- [x] **UNOFFERED** `content/lessons/theory.4.md:56` — "triad inversions identified by their bass"
  - Is: the rung's inversion drill does not identify inversions by ear: it prints a slash chord (e.g. "Am/C") and waits for you to play it, and it only ever asks first and second inversion. Of the four exercises only the cadence drill is an ear drill about harmony.
  - Evidence: catalog `drill.chord.inversions` `kind: inversion`; `app/src/engine/drills/factories.ts:130-157` (`inversionDrill`: label `Root/Bass`, `inversion = 1 + …`); `fromCatalog.ts:325-331` (`positions` param not read); `DrillScreen.ts:1785-1787` ("Play this chord").
  - Fixed: now "triad inversions played from their slash-chord names" — `inversionDrill` re-read (label `Root/Bass`, prompt "Play this chord"). The "Inversions by ear" paragraph stays as listening advice; the rung has no drill for it.

Checked and true: the circle of fifths order and the sharps-clockwise/flats-anticlockwise rule; neighbouring keys differ by one note; relative minor a minor third below (THEORY, right); the four cadences and their numerals (THEORY, right) match the cadence drill's params exactly (`drill.ear.cadences`: authentic, half, plagal, deceptive); Simon (the rung's `simon` tool, which for a stage-4 rung opens `drill.ear.simon-chromatic` — `app/src/engine/drills/simon.ts:283-285`) grows one note a round, draws from all twelve pitch classes (`steps: "chromatic"`, G3–G4), judges the exact octave (`simon.ts:26-28` "No octave tolerance"), plays with no lights and on a miss replays the chain lit and asks for it again (`help: "keys-after-miss"`, `simon.ts:168-174`); the chromatic Simon is on the rung (`exerciseOptions`); the rung's 80 % matches `mastery.custom` `cadences-by-ear>=0.8`.

Not checked in this lesson: how each inversion "sounds" (lines 24–26) and "almost never to the key opposite" — JUDGEMENT-level teaching statements, not listed.

## improv.4 — `content/lessons/improv.4.md`

Claims checked: 17. Findings: 5.

- [x] **FALSE** `content/lessons/improv.4.md:25` — "The app plays a two-bar call; you play a two-bar answer."
  - Is: *Answer the phrase* plays four random notes, 500 ms apart, drawn chromatically from C4–G4, shows their names on the card, and marks you right only if you play those same four notes back in order — an echo, not an answer. Its `bars: 2` and `scale: "pentatonic"` params are never read.
  - Evidence: catalog `drill.improv.call-response` `{"kind":"call-response","params":{"bars":2,"scale":"pentatonic"}}`; `app/src/engine/drills/fromCatalog.ts:202-203`; `app/src/engine/drills/factories.ts:277-296` (`range(60, 67)`, 4 notes, `expected: phrase`, `ordered: true`); `DrillScreen.ts:1799-1800` ("Play it back") and the `default` symbol card at `:1287-1297`.
  - Fixed: now "The app's *Answer the phrase* drill plays four notes and marks you right only if you play the same four back, so it trains the ear rather than the answer. The answer you practise over the loop: a two-bar call of your own, then a two-bar answer" — `callResponseDrill` re-read (4 notes, `ordered: true`, `expected: phrase`). Making the drill ask for an answer (reading `bars`/`scale`) is the owner's decision.
  - Built (2026-09-21): partly. `bars` and `scale` are both read: the call is two bars (eight notes) drawn from the pentatonic rather than four chromatic notes, so every note in it belongs. It is still an echo — the drill asks for the same notes back — because "answer the phrase" has no judgeable right answer, and the lesson keeps the sentence saying so.
- [x] **FALSE** `content/lessons/improv.4.md:48` — "**Tools for this rung.** Set I–vi–IV–V in the lab and start it"
  - Is: the rung's lab button opens preset `pop-four-chord`, whose progression is I–V–vi–IV and **locked** — the progression picker is disabled, so I–vi–IV–V cannot be set from it. (The four-chord loop drill the lesson describes on line 19 is C–Am–F–G, i.e. I–vi–IV–V, so the tool and the drill disagree.)
  - Evidence: stage-4.json `improv.4` `tools: [{"kind":"lab","preset":"pop-four-chord"}]`; `LAB_PRESETS` `pop-four-chord`: `progressionId: 'i-v-vi-iv'`, locks `['progression','leftHand']`; `app/src/ui/screens/LabScreen.ts:585-601` (`applyLocks` disables the progression select).
  - Fixed: now "The lab opens on I–V–vi–IV — the same four chords in another order, and fixed there; the loop drill above is the I–vi–IV–V one" — `pop-four-chord` (`sightReading.ts:857-867`) and `applyLocks` re-read; the key is not locked, so "Change the key" stays. Pointing the rung at an unlocked I–vi–IV–V preset instead is the owner's decision.
  - Built (2026-09-21): improv.4’s lab tool is repointed from `pop-four-chord` to `ballad`, whose progression **is** I–vi–IV–V and whose right hand is `none`, so the app plays the loop and leaves the improvising to the learner. The sentence now reads "The lab opens on I–vi–IV–V, the loop drill’s own four chords".
- [x] **FALSE** `content/lessons/improv.4.md:22` — "the four-chord one moves twice as often"
  - Is: the four-chord loop changes chord every bar (4 changes per 4 bars); the I–IV–V loop is C C C C F F G G (3 changes per 8 bars), so the four-chord one moves well over twice as often.
  - Evidence: catalog `drill.improv.loop-i-iv-v` `progression: ["C","C","C","C","F","F","G","G"]`; `drill.improv.loop-four-chord` `progression: ["C","Am","F","G"]`; `fromCatalog.ts:583-591` (one progression entry per bar, `barMs = 60000/bpm*4`).
  - Fixed: now "the four-chord one changes chord every bar, where that one changes three times in eight bars" — both catalog progressions and `buildBackingTrack` (one entry per bar) re-read.
- [x] **FALSE** `content/lessons/improv.4.md:49` — "one chord a bar is twice the work of the last rung's loop"
  - Is: same arithmetic as above — the last rung's loop (`drill.improv.loop-i-iv-v`, the loop on `improv.3`) changes three times in eight bars.
  - Evidence: as above; stage-3.json `improv.3` `exerciseOptions` includes `drill.improv.loop-i-iv-v` and it has no `tools`.
  - Fixed: now "one chord a bar is far more changes than the last rung's loop" — same evidence; `improv.3` re-read (the I–IV–V loop, no `tools`).
- [ ] **THEORY** `content/lessons/improv.4.md:15` — "leaves a scale where nothing can sound wrong over a diatonic progression" / line 20 "all five notes fit all four chords"
  - Is (believed overstated): by the lesson's own reasoning (the fourth clashing with a chord's third), C over the G chord is the same clash against B, and E over F is a major seventh. A musician should confirm how to phrase it.
  - Evidence: THEORY.

Checked and true: C major pentatonic is C D E G A, the major scale minus 4 and 7; the black keys are F♯ major pentatonic (THEORY, right); the four-chord loop drill plays C–Am–F–G one chord a bar (catalog params, `buildBackingTrack`); the I–IV–V loop from `improv.3` is also on this rung (`exerciseOptions` of both rungs); the lab key is not locked in `pop-four-chord`, so "change the key" works; mastery `four-answers-recorded` matches "four two-bar answers" in spirit.

Not checked in this lesson: motif-development terms (sequence, inversion, augmentation) — THEORY, standard, not listed.

## jam — `content/lessons/jam.md`

Claims checked: 16. Findings: 3.

- [x] **STALE** `content/lessons/jam.md:18` — "The twelve-bar shuffles on this rung are written in C, F and G"
  - Is: the rung offers five: E, A, G, C and F (`exercise.blues.twelve-bar-shuffle.e`, `.a`, `.g`, `.c`, `.f`), E and A listed first. The advice to move the C one up to E and A is overtaken by the E and A versions being there.
  - Evidence: stage-4.json `jam` `songOptions`; `dump_score.py exercise.blues.twelve-bar-shuffle.e` (4 sharps, E7/A7/B7) and `.a` (3 sharps, A7/D7/E7).
  - Fixed: now "written in E, A, G, C and F: take the E, A and G ones as they stand, and move the C one up to D" (D being the one guitar key of the four the lesson names that the rung lacks) — `songOptions` re-read; key signatures of all five dumps read (4, 3, 1, 0, −1 sharps).
- [x] **FALSE** `content/lessons/jam.md:47` — "**The form tracker.** PianoPath's chord-chart view shows where you are in the form and which chorus you are on"
  - Is: the chord-chart screen does show "Bar n of 12 · chorus n", but the rung's form-tracker item, `drill.jam.form-tracker` ("Play the form with the chart"), opens as a backing-track drill on the Drill screen, whose card shows only "12 bars"; its `chartView: true` param is read by nothing, and of its five keys only the first (E) is used.
  - Evidence: `app/src/ui/screens/ChordChartScreen.ts:100` (the chorus line); catalog `drill.jam.form-tracker` `{"kind":"backing-track","params":{"form":"12-bar","keys":["E","A","G","D","C"],"chartView":true}}`; grep `chartView` under `app/src` → no matches; `fromCatalog.ts:583-591` (`keys[0]` only); `DrillScreen.ts:1255-1262` (backing-track card = "N bars"); grep `chorus` in `DrillScreen.ts` → no matches.
  - Fixed: now "The accompaniment lab's *Jam it* shows which of the twelve bars you are in and how many times round you have been … The rung's *Play the form with the chart* drill is a twelve-bar loop in E with no chart on it, so there you count the form yourself" — the lab's `drawJamForm` ("Bar n of N · pass n", `LabScreen.ts:326-337`) re-read, and the rung's lab preset `blues-shuffle` is 12 bars. Also found: nothing in `app/src` calls `router.navigateChart(` (grep returned only its definition, `router.ts:548`), and a second search for `#/chart|chart/|chart:` outside the router found no link, so the chord-chart view is reachable only by typing its URL. Showing the chart in the drill (reading `chartView`) is the owner's decision.
- [ ] **UNVERIFIED** `content/lessons/jam.md:15` — "Guitars are built around open strings in E, A, D and G, so those keys plus C are where a guitarist is comfortable"
  - Is: standard-tuning open strings are E A D G B E; the key advice is a musician's generalisation (HISTORY/JUDGEMENT), likely right.
  - Evidence: not checkable in the repository.

Checked and true: the lab's Jam it plays a bass line and drums (kick on 1 and 3, snare, hat) under the chart and loops until stopped (`LabScreen.ts:349-371`, `app/src/audio/backingLoop.ts:49`, `:80`); the rung's lab preset `blues-shuffle` leaves the key free and the lab has E major and A major (`sightReading.ts:706-707`); a blues chorus is twelve bars and most standards thirty-two (THEORY, right); shells as root–3–7 or 3–7 (THEORY, right); a walking bass lands on the root on beat one (THEORY).

Not checked in this lesson: "bands always speed up" and counting-in conventions — JUDGEMENT-level advice, not listed.

## technique.4 — `content/lessons/technique.4.md`

Claims checked: 22. Findings: 5.

- [x] **FALSE** `content/lessons/technique.4.md:38` — "The app scores these on how long you actually hold each key rather than on which notes you played"
  - Is: the held-length scorer exists (`articulationScore`, staccato < 0.5 of the value, legato 0.9–2.0) but nothing calls it; the articulation exercises pass on the ordinary accuracy and tempo rule, i.e. on which notes you played and when.
  - Evidence: `app/src/engine/Scoring.ts:214-280`; grep `articulationScore|STACCATO_MAX_HELD|LEGATO_MIN_HELD|ArticulationScore` under `app/src` → only `Scoring.ts` itself, comments in `PracticeEngine.ts:1219` and `types.ts:312`, and the re-export in `engine/index.ts:4`; pass rule `Scoring.ts:177-189` (`evaluateOutcome`: accuracy and tempo only).
  - Fixed: now "The app scores these like everything else, on which notes you played and when, and does not measure how long you hold each key — so a staccato phrase full of right notes held too long will pass, and only your ear will say so" — grep for the three names outside `Scoring.ts` re-run (two comments only); `evaluateOutcome` re-read. Wiring `articulationScore` in is the owner's decision.
  - Built (2026-09-21): `articulationScore` runs for a run of an exercise whose own `drill` block asks for it, and the summary sheet carries a *Legato* or *Staccato* line. It is reported beside the accuracy and folded into neither — a staccato phrase of right notes held too long is still a full-marks run — so the sentence now reads "The app measures how long you hold each key here: the sheet says what share of your notes were the right length".
- [x] **FALSE** `content/lessons/technique.4.md:22` — "The fingering printed on each exercise is the standard one"
  - Is: four of the thirteen exercises print no fingering at all (the C and D legato and staccato phrases), and the three Hanon No. 1 items finger about a quarter of their notes (122 of 466; 61 of 233; 61 of 233). The scale, arpeggio, chromatic and inversion exercises finger every note.
  - Evidence: MusicXML `<fingering>` count per exercise for all 13 `exerciseOptions` of `technique.4` (script over the built `.mxl`s).
  - Fixed: now "The fingering printed on the scale, arpeggio, chromatic and inversion exercises is the standard one" — `<fingering>` counts re-run on all 13 (fingered/notes): articulation 0/16 ×4; Hanon 122/466, 61/233, 61/233; inversions 42/42 ×2; chromatic 50/50, 25/25; contrary scale 58/58; arpeggio 26/26. That the printed fingerings are the standard ones stays THEORY.
- [x] **FALSE** `content/lessons/technique.4.md:25` — "**Contrary motion** is easier than it sounds … both thumbs move at the same time, so the hands mirror each other" (with line 27 "The two-octave C major here is the one to start on")
  - Is: the rung's contrary-motion exercise starts the left hand on C5, an octave *above* the right hand's C4, so in bar 1 the right hand climbs C4→C5 while the left falls C5→C4 and the hands cross through each other. The fingering is the standard mirror (RH 1-2-3-1…, LH 1-2-3-1…), but the start is not the usual shared middle C or LH-below octave.
  - Evidence: `dump_score.py exercise.scale.c-major.2oct.contrary.both.2` bar 1 (RH C4…C5, LH C5…C4); fingering sequence read from the MusicXML.
  - Fixed: the mirror sentence is kept (it is true of the pitches and fingering) and "the one to start on" now adds "it is written with the left hand starting on the C above the right hand's, so in the first bar the hands pass through each other" — bar 1 re-read (RH C4→C5, LH C5→C4). Whether the generator should start the hands that way is a separate question for the owner (the one-octave version, not on this rung, starts both on C4).
- [x] **FALSE** `content/lessons/technique.4.md:47` — "the same finger work as the exercises above with a tune over it" (No. 2)
  - Is: in No. 2 the running figure is in the left hand (C3–C4 scales in eighths) and the right hand holds triads (G–C–E, F–G–B …) — there is no tune over it.
  - Evidence: `dump_score.py song.classical.lemoine-etude-op-37-no-2.pdmx` bars 1–8.
  - Fixed: "with a tune over it" replaced by what each piece has: "No. 1 runs a scale in the right hand over left-hand chords, No. 2 gives the scale to the left hand under right-hand chords, and No. 35 is repeated and broken triads in 6/8" — bars 1–5 of all three dumps re-read (No. 1 has no tune over its figure either). "the same finger work as the exercises above" is kept; the JUDGEMENT on it below stays open.
- [ ] **JUDGEMENT** `content/lessons/technique.4.md:46` — "one figure each, the same finger work as the exercises above" (No. 35)
  - Is: No. 35 is repeated and broken triads in both hands in 6/8 (with a D.C. al Fine), not a scale or five-finger figure; it relates to the inversion exercises at most. A musician should say whether "the same finger work" stands.
  - Evidence: `dump_score.py song.classical.lemoine-etude-op-37-no-35.pdmx` bars 1–8.

Checked and true: the articulation exercises come in pairs, the same four bars once legato and once staccato, in C and in D (dumps: identical pitches; staccato versions mark all 16 notes staccato, legato versions carry the text "Joined — hold each key until the next one sounds"); the two-octave C major contrary-motion scale and the C major arpeggio hands together are on the rung; "Two exercises pass this rung" (`mastery.exercisesRequired: 2`, `songOptional: true`); Lemoine Op. 37 Nos. 1, 2 and 35 are the rung's three songs, 16 bars each; No. 1 is a right-hand scale figure over left-hand chords (dump bars 1–8); the Ladder is a Score-screen menu row that speeds a loop up a notch per clean pass and down one per mistake (`ScoreScreen.ts:927-943`, `LADDER_NOTCH_PCT` in `PracticeEngine.ts:67`). The standard fingerings printed for the scale, arpeggio and chromatic exercises are the usual ones (THEORY).

Not checked in this lesson: that the rung has no `tools` while the lesson's "Tools for this rung" names the Ladder — the Ladder is available on any looped Keep-tempo run, so not listed as false.

## rock.4 — `content/lessons/rock.4.md`

Claims checked: 19. Findings: 5.

- [x] **FALSE** `content/lessons/rock.4.md:21` — "The exercises put a two-note figure in the right hand over a bass that never moves."
  - Is: true of one of the four. `exercise.ostinato.e.fifths` is E–B over a held E pedal. `exercise.ostinato.d.arpeggio` is a four-pitch broken triad (D F A D A F D F) over a D pedal; `exercise.power-chord.d` is moving power chords (D5 C5 B♭5 C5) in both hands; `exercise.modal-vamp.e` is triads over a moving bass (E D C D).
  - Evidence: `dump_score.py` of each of the four `exerciseOptions`, bars 1–5.
  - Fixed: now "The ostinato exercises put a figure in the right hand — two notes in E minor, a broken triad in D minor — over a bass that never moves" — bars 1–2 of all four dumps re-read: `ostinato.e.fifths` E4–B4 over held E2+E3, `ostinato.d.arpeggio` D–F–A–D… over held D2+D3; the power-chord and vamp exercises are no longer described by the sentence.
- [x] **FALSE** `content/lessons/rock.4.md:8` — "The rung before this one taught the reduction … and named the textures. This is the first of them under your hands"
  - Is: the previous rock rung (`rock.overview`, stage 3) names three textures — a held chord, a broken chord, the chord repeated on the beats. It does not name the power chord or the ostinato, so neither is "the first of them".
  - Evidence: `content/lessons/rock.overview.md:22-26`; grep `power|ostinato` in that file → only the video label (line 6).
  - Fixed: now "and named three textures for that layer. This is the first rock texture under your hands" — `rock.overview.md` re-read ("a held chord, a broken chord, or the chord repeated on the beats"). The JUDGEMENT on "almost every heavy piano part" stays open.
- [x] **FALSE** `content/lessons/rock.4.md:34` — "*Play it as a duet* takes one hand away: let the app hold the tune while you drill the left hand alone, then swap."
  - Is: the rung's Duet button opens *Greensleeves (with chords)* with the learner on the **right** hand (`hands: 'R'`), so the app plays the left hand and you play the tune; to have the app hold the tune you must switch hands yourself.
  - Evidence: `app/src/ui/screens/LessonScreen.ts:444-449` (`navigateScore(id, { mode: 'tempo', hands: 'R' })`); `app/src/router.ts:176-186` ("the duet is *the hand you are not playing*").
  - Fixed: now "it opens *Greensleeves* with you on the tune; switch to the left hand and the app holds the tune while you drill it" — `case 'duet'` (`hands: 'R'`) and the router comment re-read; the rung's only song is *Greensleeves (with chords)*. Not checked here: the Score screen's hand switch itself (the audit README notes the Duet toggle's behaviour was not read).
- [ ] **UNVERIFIED** `content/lessons/rock.4.md:44` — "The library's minor-key two-hand music at this level is four settings of this tune and two of *Für Elise*"
  - Is: the catalog rows that *say* minor (`mode: minor`), two staves, up to level 4.6 are exactly four *Greensleeves* settings (`.simple` 2.4, `.chords` 3.3, `.waltz` 3.6, `.68` 4.5); the two easy *Für Elise* (4.1) have `mode: null`. Rows with `mode: null` are not classified by the catalog, so other minor pieces could exist unlabelled; I did not read them. Inside the rung's own `levelBand` [2.6, 3.4] only `greensleeves.chords` qualifies.
  - Evidence: catalog query on `notation.keys[].mode`, `staves`, `level`; `mode` is a proxy for minor key here.
- [ ] **JUDGEMENT** `content/lessons/rock.4.md:9` — "the one almost every heavy piano part is built from"
  - Is: a generalisation about a genre, for a musician to confirm.
  - Evidence: none possible.

Checked and true: a power chord is root, fifth, octave with no third (THEORY; `exercise.power-chord.d` writes D–A–D etc.); the A-minor versions were met on core rungs (`exercise.ostinato.a.fifths` on 2.1; `exercise.ostinato.a.arpeggio`, `exercise.power-chord.a`, `exercise.modal-vamp.a` on 3.3); the new keys are D minor with one flat and E minor with one sharp (dumps: `fifths -1` / `1`, `mode: minor`); the lab preset `minor-vamp` is A minor, locked, i–♭VII–♭VI–♭VII (Am G F G) over held (`whole`) roots (`LAB_PRESETS`); one song on the rung, *Greensleeves (with chords)*, in A minor with chord symbols printed (`dump_score.py song.folk.greensleeves.chords`: 15 symbols, Am/G/E7).

Not checked in this lesson: arm-weight and "thin clatter" (line 16–18) — technique advice, unheard.

## classical.5 — `content/lessons/classical.5.md`

Claims checked: 24. Findings: 6.

- [x] **FALSE** `content/lessons/classical.5.md:23` — "Clementi's Op. 36 No. 1, all three movements"
  - Is: the rung has two Clementi items: the first movement ("short edition", 38 bars, 2/2) and one titled "second and third movements" that holds a single 70-bar movement in C, 3/8 throughout, no key or time change — the Vivace only. The Andante (F major, 3/4) is not there. (HISTORY for the movement plan of Op. 36 No. 1; the file's content is from the score.)
  - Evidence: `dump_score.py song.classical.clementi-sonatina-no1-2-muzio-clementi.pdmx` (key signatures `['0']`, times `['3/8']`, 70 bars, ends on a C chord); catalog title of that row.
  - Fixed: now "Clementi's Op. 36 No. 1 — the first movement, plus one later movement in 3/8" — dump re-read (one key signature, `0`; one time, `3/8`; 70 bars). The movement is described from the notes rather than named, since which movement it is is HISTORY; the title mismatch was left out of the prose to keep the lesson within its three minutes. The catalog row titled "second and third movements" is the owner's to correct.
- [x] **FALSE** `content/lessons/classical.5.md:33` — "The Alberti exercise on this rung is that figure with nothing on top"
  - Is: the rung's Alberti exercise is hands together: the right hand plays a G major scale up and down in quarters over the Alberti left hand.
  - Evidence: `dump_score.py exercise.accompaniment.alberti.g-major.both`, bars 1–4 (RH G4 A4 B4 C5 | D5 E5 F♯5 G5 | …).
  - Fixed: now "puts that figure under a plain scale, which is where to set the weight before a tune competes for it" — bars 1–4 re-read (RH G4 up to G5 and back in quarters over the LH Alberti figure).
- [x] **FALSE** `content/lessons/classical.5.md:40` — "The written-out drill is on the technique track a stage later" (trills and mordents)
  - Is: true for trills (`exercise.trill.c.4pb.left` on `technique.6`), not for mordents: `exercise.mordent.c.2pb.left` is on `technique.5`, the same stage as this rung.
  - Evidence: search of every `stage-*.json` rung for ids containing trill/mordent/ornament/turn.
  - Fixed: now "The written-out drills are on the technique track, mordents at this stage and trills a stage later" — the search re-run over every rung's `exerciseOptions` and `songOptions`: `exercise.mordent.c.2pb.left` on `technique.5` (stage 5), `exercise.trill.c.4pb.left` on `technique.6` (stage 6).
- [x] **FALSE** `content/lessons/classical.5.md:60` — "It will hold a tempo until a pass has nothing wrong in it"
  - Is: the Ladder does not hold on a mistake: a pass with a mistake moves it *down* a notch (10 %), a clean pass moves it up one.
  - Evidence: `app/src/ui/screens/ScoreScreen.ts:1500-1516` (`climbLadder`: status "A mistake — down to n %"); menu text `:939-941` ("a pass with a mistake in it slows down one"); `LADDER_NOTCH_PCT = 10` (`PracticeEngine.ts:67`).
  - Fixed: now "It climbs a notch for each clean pass and drops one for a pass with a mistake" — `climbLadder` and the menu row text re-read.
- [ ] **JUDGEMENT** `content/lessons/classical.5.md:44` — "Schumann's *First Loss* and Tchaikovsky's *Old French Song* both want the pedal for warmth"
  - Is: neither score marks any pedal (no `<pedal>` element, no "Ped." text); the claim is performance practice for a musician to confirm.
  - Evidence: MusicXML of `song.folk.old-french-song.pdmx` and `song.classical.schumann-schumann-album-for-the-young-op-68-no-16-first-grief.pdmx`, pedal count 0 each.
- [ ] **JUDGEMENT** `content/lessons/classical.5.md:50` — "Burgmüller's *Arabesque* … each a melody carried over an accompaniment"
  - Is: the *Arabesque* opens with left-hand chords under right-hand sixteenth-note runs and staccato figures (bars 1–10) — figuration over chords rather than a singing melody; whether that counts as "a melody carried over an accompaniment" is a musician's call.
  - Evidence: `dump_score.py song.classical.burgmuller-burgmuller-arabesque-op-100-no-2.pdmx` bars 1–10.

Checked and true: six songs on the rung; Beethoven's Sonatina in G, Anh. 5 (No. 1) is on it (G, one sharp, 34 bars); Attwood's Sonatina is on `classical.4` (Stage 4, this track); Kuhlau (Op. 20 No. 1, two editions) and Diabelli (Op. 168 No. 1) sonatinas are in the catalog with `tracks: ['classical']` and not on this rung; Alberti bass was taught at Stage 3 (rung `3.6` "Broken chords, Alberti bass and waltz bass"); legato pedalling is Stage 3.5; *Old French Song* is Tchaikovsky Op. 39 No. 16 and *First Loss* is Schumann Op. 68 No. 16 (catalog composer/title); the Ladder and looping exist on the Score screen. THEORY checked and right: sonata-form outline (exposition, second theme in the dominant, development, recapitulation in the tonic) and the upper-note trill rule with its exception.

Not checked in this lesson: whether each sonatina's first movement is actually in sonata form (not claimed per piece); "a third of the volume" (unheard).

## chords-pop.5 — `content/lessons/chords-pop.5.md`

Claims checked: 20. Findings: 6.

- [x] **FALSE** `content/lessons/chords-pop.5.md:51` — "Type `ii7 V7 I` into the lab, choose a broken left hand, and *Read it* hands you the seventh voicings"
  - Is: the rung's lab button opens preset `ballad`, which locks the progression (I–vi–IV–V), the left hand (broken) and the right hand (none); the progression select is disabled, so a typed custom progression cannot be chosen from it. (The unlocked lab, from the Library, can take a typed progression and does have *Read it*.)
  - Evidence: stage-5.json `chords-pop.5` `tools: [{"kind":"lab","preset":"ballad"}]`; `LAB_PRESETS` `ballad` locks `['progression','leftHand','rightHand']`; `app/src/ui/screens/LabScreen.ts:585-601` (`applyLocks`), `:86`, `:123`, `:456-461` (custom text belongs to the progression picker).
  - Fixed: now "The lab opens on its *Ballad — broken chords* preset: I–vi–IV–V with a broken left hand, both fixed, in whatever key you pick, and *Read it* writes that accompaniment out. For `ii7 V7 I`, open the accompaniment lab from the Library instead, where the numerals and the left hand are yours to choose" — `ballad` preset (`sightReading.ts:869-879`, key not locked) re-read; the Library's button calls `router.navigateLab()` with no preset (`LibraryScreen.ts:578`), so nothing is locked (`LabScreen.ts:118-119`), and the custom numerals field accepts `V7`-style numerals (`:452-465`). Not checked: what *Read it* writes for a typed `ii7`, so the sentence no longer promises seventh voicings. Pointing the rung at an unlocked preset is the owner's decision.
  - Built (2026-09-21): chords-pop.5 now carries a second lab tool with no preset. The ballad keeps its own paragraph and `ii7 V7 I` goes to the new button: "For `ii7 V7 I`, tap *Lab — your own chords* instead and type the numerals in". What *Read it* writes for a typed `ii7` is still unchecked, so the sentence still does not promise seventh voicings.
- [x] **UNOFFERED** `content/lessons/chords-pop.5.md:28` — "C–E–G–D with the added note on top, which is what the drill plays … Learn the drill's"
  - Is: no add9 drill or exercise is on this rung (its exercises are the C7 and G7 arpeggios and the ii–V–I shells drill). The add9 exercises (intervals 0-4-7-14, the 9th on top, as described) are on `rock.5` (`exercise.open-voicing.c.add9`) and `chords-pop.7` (`.f.add9`, `.b-flat.add9`).
  - Evidence: stage-5.json `chords-pop.5` `exerciseOptions`; search of every rung's `exerciseOptions` for `add9|sus|extended-chords`; catalog `exercise.open-voicing.c.add9` params `intervals: [0,4,7,14]`.
  - Fixed: now "which is how the add9 exercises write it (they are on the rock track at this stage, and in the Library) … Learn the written one" — rung `exerciseOptions` re-read (no add9); `rock.5` (stage 5) has `exercise.open-voicing.c.add9`; catalog has four `exercise.open-voicing.*.add9` rows; `dump_score.py exercise.open-voicing.c.add9` bar 1 RH C4+E4+G4+D5 (the ninth on top).
- [x] **FALSE** `content/lessons/chords-pop.5.md:41` — "*Greensleeves* in 6/8 with its jazzier chords"
  - Is: the 6/8 setting has the same three chord symbols as the 3/4 chord settings — Am, G, E7 (15 symbols) — nothing jazzier.
  - Evidence: `dump_score.py song.folk.greensleeves.68` (`chords: Aminor, Edominant, G`) against `song.folk.greensleeves.chords` (same set).
  - Fixed: now "*Greensleeves* in 6/8, on the same Am, G and E7 as the 3/4 chord setting" — catalog `notation.chords` of `.68` and `.chords` re-read, both `Aminor, Edominant, G`, 15 symbols.
- [ ] **FALSE** `content/lessons/chords-pop.5.md:44` — "two ballads that live on seventh chords, *Your Song* and *Before You Go*"
  - Is: as arranged here, both left hands are plain triads and open fifths — *Your Song (easy)* triads in every bar (F/C, B♭/D, C/E, Am/E, Dm, G/B …); *Before You Go* F–C fifths and C, F, Dm, B♭ triads. No written seventh chord in either left hand; neither file has chord symbols.
  - Evidence: `dump_score.py song.folk.your-song-elton-john-easy-piano.pdmx` bars 1–38; `dump_score.py song.folk.before-you-go-lewis-capaldi.pdmx`, all LH patterns tallied (9 distinct, all dyads or triads); `chordCount: 0` for both.
  - Not fixed: the finding is partly wrong — it read the left hands alone. In *Your Song* the two hands together do sound seventh chords: bar 3 LH F3+E4 (a major seventh over F) under RH C5, G5, D5; bar 11 LH B2+D3+G3 under RH F4, A♭4 (a G dominant seventh). *Before You Go* was read to bar 11 only (F–C and F–D under the tune), not throughout. Whether either song "lives on" seventh chords is a musician's call — re-filed here as JUDGEMENT, left open.
- [ ] **JUDGEMENT** `content/lessons/chords-pop.5.md:42` — "*Row Row Row Your Boat* as an arpeggio study"
  - Is: its left hand is bass-then-dyad in every bar (C3, E3+G3 …), not arpeggios; the only arpeggio is the tune itself in bars 5–6 ("merrily", C5 G4 E4 C4 in repeated notes). A musician should say whether that makes it an arpeggio study.
  - Evidence: `dump_score.py song.folk.row-row-row-your-boat`, bars 1–8.
- [ ] **JUDGEMENT** `content/lessons/chords-pop.5.md:27` — "Play sus4 then the plain triad and you have the most-used gesture in pop piano"; line 29 "the one you will hear in most modern ballad writing"
  - Is: genre generalisations for a musician to confirm.
  - Evidence: none possible.

Checked and true: six songs on the rung; the full *Greensleeves* setting (`song.folk.greensleeves`, 33 bars, 3/4) sits beside the 6/8 one; *Lavender's Blue* puts left-hand broken chords under a slow right-hand tune in bars 9–16 (dump); an imported lead sheet can join the rung if assigned (`curriculum/load.ts:147-180`); the lab has a *Read it* action (`LabScreen.ts:190-210`). THEORY checked and right: Cmaj7, Dm7, G7 spellings; major vs minor seventh as half/whole step below the octave; sus4 C–F–G, sus2 C–D–G; add9 C–E–G–D.

Not checked in this lesson: how the chords "sound" (lines 15–19) — unheard.

## blues.5 — `content/lessons/blues.5.md`

Claims checked: 16. Findings: 3.

- [x] **UNOFFERED** `content/lessons/blues.5.md:15` — "The classic move is a chromatic line descending from the tonic to the fifth … ending on the V7 … Learn two of them and use them alternately"
  - Is: the rung offers one turnaround, and it is not this one: `exercise.turnaround.c.i-vi-ii-v.intro` is two bars of block triads C–Am–Dm–G (I–vi–ii–V), ending on a plain G triad, with no chromatic line. The lesson does not point to where a second turnaround or the chromatic one can be found.
  - Evidence: stage-5.json `blues.5` `exerciseOptions` (one `exercise.turnaround.*`); `dump_score.py exercise.turnaround.c.i-vi-ii-v.intro` bars 1–2.
  - Fixed: the chromatic line stays as the classic move, followed by "The turnaround exercise on this rung is a different one, I–vi–ii–V in block chords (C–Am–Dm–G), and the Library has it in other keys along with a iii–VI–ii–V" — rung re-read (one turnaround); catalog title search `turnaround` → I–vi–ii–V and iii–VI–ii–V in C, F, B♭, E♭ only, and a second, differently shaped search (`chromatic` with `turn|line|descend`, `cliché`) → nothing, so the chromatic turnaround is described but not offered; the Library has an *Exercises* filter (`LibraryScreen.ts:455`).
- [x] **FALSE** `content/lessons/blues.5.md:40` — "**Walking bass.** … one note per beat moving mostly by step through the chord tones"
  - Is: the rung's walking-bass exercise moves mostly by leap: each bar is root–third–fifth (C–E–G, F–A–C, G–B–D) then an approach note a step or half step from the next root (B1, E2, F♯2). Three of every four beats are arpeggio leaps; it does arrive on the root on beat one.
  - Evidence: `dump_score.py exercise.walking-bass.c.blues.intro`, bars 1–12.
  - Fixed: now "one note per beat — in the exercise here, the chord's root, third and fifth, then the note a half step below the next root — arriving on the root of the next chord on beat one" — bars 1–12 re-read; every fourth beat (B1, E2, F♯2) is a half step below the following bar's root.
- [ ] **JUDGEMENT** `content/lessons/blues.5.md:31` — "A blues chorus is a conversation: a two-bar phrase, then two bars of space, then the same phrase, then an answer."
  - Is: the AAB call-and-response model of the twelve-bar vocal blues; a generalisation a musician should confirm.
  - Evidence: THEORY/HISTORY, not in any score.

Checked and true: blues in F is F7–B♭7–C7 and in G is G7–C7–D7 (`dump_score.py exercise.blues.twelve-bar-shuffle.f` / `.g`, chord symbols bars 1–12, all dominant); the boogie shape transposes (same 1–5–6–5 pattern in each key's dump); tremolo thirds are two notes a third apart alternated in sixteenths (`dump_score.py exercise.tremolo-third.c.right`: C–E, D–F♯, E–G♯, F–A); the lab's Jam it with preset `blues-shuffle` (key free, F available) plays a bass and drums under the twelve bars and marks the current bar (`LabScreen.ts:328-337`, `data-current`), with a bar counter "Bar n of 12 · pass n"; the walking bass arrives on each new root on beat one (dump). THEORY checked and right: flat third crushed against the natural third; the chromatic turnaround line from tonic to fifth ending on V7.

Not checked in this lesson: "both should be slightly untidy" and the wrist advice — unheard, teaching advice. The rung's `blind` tool and its three songs are not mentioned by the lesson, so nothing to check.

## jazz.5 — `content/lessons/jazz.5.md`

Claims checked: 24. Findings: 5.

- [x] **FALSE** `content/lessons/jazz.5.md:22` — "What is left — **root, third and seventh** — is a shell: three notes … That is how the exercise on this rung writes it."
  - Is: the rung's shell exercise writes two notes per chord, root and seventh, with no third: D3+C4 (Dm7), G3+F4 (G7), C3+B3 (Cmaj7). The note the lesson says defines the chord is the one left out.
  - Evidence: `dump_score.py exercise.ii-v-i.c.shells`, bars 1–4 (LH only; RH rests).
  - Fixed: the three-note shell stays as the teaching, and "That is how the exercise on this rung writes it" is now "The exercise on this rung writes the barest version, root and seventh only; add the third once that is under the hand" — bars 1–4 re-read (D3+C4, G3+F4, C3+B3, C3+B3). Whether the generator should write the third is the owner's decision.
- [x] **UNOFFERED** `content/lessons/jazz.5.md:34` — "Learn ii–V–I in C, F, B flat and G, with the shells barely moving."
  - Is: the rung's drill in exactly those four keys, `drill.jazz.ii-v-i-shells` (`voicing: "shell"`), asks for plain root-position triads ii, V, I — no sevenths and no shell voicing; `voicing` is never read. The only shell material on the rung is the C exercise above (itself root + seventh).
  - Evidence: catalog `drill.jazz.ii-v-i-shells` `{"kind":"chord","params":{"progression":"ii-V-I","keys":["C","F","B-","G"],"voicing":"shell"}}`; `app/src/engine/drills/fromCatalog.ts:275-294` (`romanToChord(degree, key)` per key/degree), `:315-323` (`buildChord`); `app/src/engine/drills/theory.ts:305-331` (`romanToChord`: `ii` → [0,3,7], `V` → [0,4,7], `I` → [0,4,7] without a `7` suffix).
  - Fixed: the sentence is kept and followed by "The ii–V–I drill here runs those four keys but asks for plain triads, so the shells are yours to add" — `chordsFromParams` and `romanToChord` re-read (no `7` suffix → triad intervals). Making the drill read `voicing` is the owner's decision.
  - Built (2026-09-21): `voicing: "shell"` is read: `shellChord` builds the diatonic seventh on each numeral and keeps root, third and seventh, so the drill asks for three notes with no fifth in them. Built from the key rather than from the triad, because `I` and `V` are both major triads and their sevenths are a semitone apart.
- [x] **FALSE** `content/lessons/jazz.5.md:53` — "Swing is an accent and a placing, and *Rhythm only* will check both with the notes set aside"
  - Is: Rhythm only checks neither. Velocity is recorded but never compared with anything, so accents are not judged; and placing is judged against the written straight eighths within `toleranceMs` (150–200 ms), with no swing model anywhere in the engine, so a swung and a straight off-beat both pass.
  - Evidence: `app/src/engine/PracticeEngine.ts:976-990` (`findRhythmSlot`, time only); `velocity` passed only to `record()` (`:881`, `:916`, `:933`); grep `swing|swung` under `app/src` → nothing in `engine/`; `types.ts:214`, `:227`.
  - Fixed: now "Swing itself the app does not judge. *Rhythm only* times each strike against the written straight eighths within a fixed window and ignores how hard you play, so the accent and the placing are for your ear" — `findRhythmSlot` and every `velocity` line in `PracticeEngine.ts` re-read (passed to `record` only). Whether to build swing and accent judging is the owner's decision.
  - Built (2026-09-21): swing is built and the accent is not. Swing moves the expected time of an off-beat eighth where the score writes the word — and **none of jazz.5’s seven items writes it**, measured against `notation.swungMark`, so on this rung nothing changed and the sentence says so: "Swing the app judges only where the score writes the word, and none of this rung’s pieces does". The accent is **not built**: `<accent>` is not extracted from the MusicXML, so `ScoreNote` has nothing to judge a velocity against. The sentence keeps saying the accent is not judged.
- [x] **STALE** `content/lessons/jazz.5.md:53` — "**Tools for this rung.**" (names only *Rhythm only*)
  - Is: the rung's tool is the lab preset `jazz-comping` (ii–V7–I, walking left hand, locked), which the lesson does not mention; Rhythm only is a Score-screen mode available everywhere.
  - Evidence: stage-5.json `jazz.5` `tools: [{"kind":"lab","preset":"jazz-comping"}]`; `LAB_PRESETS`.
  - Fixed: the paragraph now opens "The lab's *Jazz — two five one* preset plays ii–V7–I over a walking bass, both fixed, in whatever key you pick: comp shells against it" — `jazz-comping` (`sightReading.ts:895-905`, locks progression and left hand, key free) and the `ii-v-i` progression (`['ii','V7','I','I']`, `:774-779`) re-read.
- [ ] **THEORY** `content/lessons/jazz.5.md:15` — "Same long-short division as the blues shuffle, usually a little less extreme, and with the accent on the *off*-beat … That accent is what separates swing from a shuffle."
  - Is (worth a musician's eye): off-beat accent as *the* difference between swing and shuffle is a simplification; many would put it in the feel of the rhythm section and the triplet ratio.
  - Evidence: THEORY.

Checked and true: `jazz.5` has `chords-pop.5` as its prerequisite (stage-5.json); four songs on the rung, each one staff with chord symbols and `compositionStatus: pd`, titled with the years 1902, 1910, 1918, 1922; *Limehouse Blues* changes key signature from one flat to four flats at bar 33 of 64 (MusicXML `<key>` read); *Avalon*, *Whispering*, *Margie* are on `jazz.4` and carry `jazz` in `tracks`; the twelve-bar shuffles carry `blues-boogie` in `tracks` (C, D, E, F, G, A); no *Ja-Da* in the catalog (title search `ja-da`, `jada`, `ja da`, and a regex over the raw catalog for `ja[ -]?da` in titles — all empty). THEORY checked and right: Dm7–G7–Cmaj7; guide tones C→B and F→E by half step; third and seventh define quality; shell drops to two notes with a bass player.

Not checked in this lesson: the ear drill `drill.ear.seventh-qualities` and comping exercise are on the rung but not described in the prose.

## ragtime.5 — `content/lessons/ragtime.5.md`

Claims checked: 20. Findings: 5.

- [x] **FALSE** `content/lessons/ragtime.5.md:40` — "*The Entertainer* is the only actual rag on the rung"
  - Is: *12th Street Rag* (Euday L. Bowman, 1914) is also a rag. What distinguishes it here is that the rung's copy is a one-staff lead sheet (melody and chord symbols, no left hand), not that it is not a rag.
  - Evidence: catalog `song.pop.12th-street-rag.pdmx` title "12th Street Rag (1914)", composer Euday L. Bowman; `dump_score.py`: `staves: 1`, 28 chord symbols.
  - Fixed: now "*The Entertainer* is the only rag on the rung written out for both hands … with *12th Street Rag*, a rag given here as a one-staff lead sheet, beside it" — catalog row re-read (`staves: 1`, `chordCount: 28`, composer Euday L. Bowman). That it is a rag rests on its title and the catalog (HISTORY), which the lesson already asserted.
- [x] **FALSE** `content/lessons/ragtime.5.md:54` — "*Rhythm only* … judges the moment of each strike … so anything that comes out swung is marked late before your ear has caught it"
  - Is: Rhythm only accepts any tap within `toleranceMs` (150–200 ms) of the written time, and nothing in the engine models swing. Swinging a pair of sixteenths moves the second one by a sixth of an eighth, which at the written *Entertainer* tempo (quarter = 70) is well inside that window, so a swung right hand is not marked late.
  - Evidence: `app/src/engine/PracticeEngine.ts:976-990` (`findRhythmSlot`); `app/src/engine/types.ts:214`, `:227`; grep `swing|swung` under `app/src` → nothing in `engine/`; `dump_score.py song.ragtime.joplin-entertainer` text "Moderato ( = 70 bpm)".
  - Fixed: now "the app cannot prove your right hand is: *Rhythm only* judges each strike against the written time within a fixed window and has no idea of swing, so a lightly swung right hand can still pass. That check is your ear's" — `findRhythmSlot`, `toleranceMs` (150 / 200) and the `swing|swung` grep re-read. Whether to build swing detection is the owner's decision.
  - Built (2026-09-21): swing detection is built and **this sentence stands unchanged**. None of ragtime.5’s nine items carries a swing marking (measured against `notation.swungMark`), which is right — ragtime is straight — so the timetable here is the written one, and a lightly swung right hand still falls inside the window. The check is still the ear’s.
- [x] **STALE** `content/lessons/ragtime.5.md:54` — "**Tools for this rung.**" (names only *Rhythm only*)
  - Is: the rung's one tool is Duet ("Play it as a duet", which opens the first playable song — *Greensleeves* waltz — with the learner on the right hand); the lesson does not mention it. Rhythm only is a Score-screen mode, not a rung tool.
  - Evidence: stage-5.json `ragtime.5` `tools: [{"kind":"duet"}]`; `LessonScreen.ts:403-449`.
  - Fixed: the paragraph now opens "*Play it as a duet* opens *Greensleeves* with its waltz bass, you on the tune and the app on the left hand; switch hands and the app holds the tune while you drill the leaps" — `case 'duet'` re-read (`hands: 'R'`, first playable song); `song.folk.greensleeves.waltz` is first in `songOptions`, `type: song`, with a file. Not checked: the Score screen's hand switch itself.
- [ ] **UNVERIFIED** `content/lessons/ragtime.5.md:28` — "Joplin printed the instruction *\"It is never right to play ragtime fast\"* on his covers"
  - Is: HISTORY. The sentence appears as a printed notice on some Joplin rags (on the first page of music rather than the cover, as I recall); no bundled score carries it — the rung's *Entertainer* is marked only "Moderato".
  - Evidence: `dump_score.py song.ragtime.joplin-entertainer` text on the score; not checkable against a primary source in the repository.
- [ ] **JUDGEMENT** `content/lessons/ragtime.5.md:47` — "He wrote them alongside the rags and they are the left hand without the problem on top."
  - Is: the three Joplin pieces have none of the Entertainer's sixteenth–eighth–sixteenth figure (0 bars against 12), but they are not free of right-hand syncopation: the *Augustan Club Waltz* has eighth–quarter–eighth figures across the beat (bars 36, 53) and *The Rose-bud March* holds chords across the 6/8 beat (bars 6, 8, 10, 14). Whether that is "the problem" is a musician's call.
  - Evidence: `dump_score.py` of each piece, all bars, right-hand line scanned for `16t …/eig …/16t` (Entertainer 12 bars, the three others 0) and for `eig …/qua …/eig`; bars named read directly.

Checked and true: six songs on the rung; *The Entertainer* is 2/4 with an oom-pah left hand (bass on the beat, chord on the off-beat, bars 5–8) and short–long–short right-hand figures (bar 5: sixteenth–eighth–sixteenth) — the syncopation and the oom-pah at once; *12th Street Rag*'s right hand repeats one three-note figure (E♭ D C) across the bar (bars 5–7); *Greensleeves (waltz bass)* is on the rung; *Augustan Club Waltz* is 3/4, *Combination March* is written in 4/4 (as the file has it) and *The Rose-bud March* is 6/8, all with a bass-then-chord left hand (dumps, bars 4–9); THEORY checked and right: oom-pah pattern and bass an octave or tenth below; strains of sixteen bars, AABBACCDD, key change at the trio (the *Entertainer* file changes 0 → 1 flat → 0).

Not checked in this lesson: "ragtime is played straight" (JUDGEMENT-level performance practice, widely held).

---
Batch 3: 18 of 18 lessons. 77 findings
(42 FALSE, 5 STALE, 2 WRONG-COUNT, 5 UNOFFERED, 6 THEORY, 12 JUDGEMENT, 5 UNVERIFIED).
Lessons not finished: none.

Fix pass: 53 fixed, 1 found wrong and not fixed, 23 left open (THEORY/JUDGEMENT/HISTORY/UNVERIFIED or needs a build). Lessons edited: 4.6, 4.7, classical.4, classical.4.shelf, chords-pop.4, blues.4, theory.4, improv.4, jam, technique.4, rock.4, classical.5, chords-pop.5, blues.5, jazz.5, ragtime.5.
