# Lesson audit — batch 5

Instruments used throughout: `python tools/content/dump_score.py <id>` (bars per staff); a
scratch reader of the built `.mxl` for per-bar key signatures, repeats and the words printed
on the score (dump_score prints the key-signature list but not where each change falls);
the rung objects in `content/curriculum/stage-<n>.json`; catalog rows in
`app/public/content/catalog.json`; tool code in `app/src/ui/screens/LessonScreen.ts`
(`toolButton`, lines 403-461) and `app/src/ui/screens/ScoreScreen.ts`; lab presets in
`app/src/engine/sightReading.ts`. Nothing was heard; every claim about sound is unverified.

## ragtime.7 — `content/lessons/ragtime.7.md`

Claims checked: 26. Findings: 8.

- [x] **FALSE** `content/lessons/ragtime.7.md:16` — "a genuine leap: a tenth or more down to a single note, back up to a chord"
  - Is: the bass the left hand leaps to is an octave, two notes, not a single note, in every bass-and-chord bar of the rung's Maple Leaf (e.g. bar 1 `Ab2+Ab3`, bar 18 `Bb2+Bb3`, bar 19 `Eb2+Eb3`).
  - Evidence: `dump_score.py song.ragtime.joplin-maple-leaf-rag`, bars 1-8, 17-36.
  - Fixed: now "a tenth or more down to a bass octave, back up to a chord" — `dump_score.py song.ragtime.joplin-maple-leaf-rag` re-read: every bass the left hand leaps to is an octave (bar 1 `Ab2+Ab3`, bar 18 `Bb2+Bb3`, bar 19 `Eb2+Eb3`).
- [x] **FALSE** `content/lessons/ragtime.7.md:17` — "back up to a chord, twice a bar, at tempo"
  - Is: only the second strain (bars 18-28) is bass-chord-bass-chord. The first strain's bars 1-4 are bass-chord-chord-bass, and bars 9-16 have no bass at all: the left hand repeats a chord around middle C (`D4+F4+Ab4+B4` x4, `Eb4+Ab4+C5` x4).
  - Evidence: `dump_score.py song.ragtime.joplin-maple-leaf-rag`, bars 1-4, 9-16, 18-28.
  - Fixed: now "twice a bar in the second strain" — re-read bars 1-4 (bass-chord-chord-bass), 9-16 (chords around middle C, no bass) and 18-28 (bass-chord-bass-chord).
- [x] **FALSE** `content/lessons/ragtime.7.md:19` — "the practice is the same as it was at Stage 5 and will be at Stage 8: left hand alone"
  - Is: ragtime.5 says it (lines 19, 36). ragtime.8's lesson does not prescribe left hand alone; its drill instruction (line 21) is to practise the secondary-rag figure alone.
  - Evidence: `grep -n -i "left hand\|alone" content/lessons/ragtime.8.md` returned lines 14, 21, 30; none is a left-hand-alone instruction.
  - Fixed: now "the practice is the same as it was at Stage 5"; the Stage 8 clause is gone — `ragtime.8.md` re-read in full: its practice instruction (line 20-21) is to play the figure alone, not the left hand; `ragtime.5.md` lines 19 and 36 do say left hand alone.
- [ ] **JUDGEMENT** `content/lessons/ragtime.7.md:23` — "Three of the pieces here deliberately are not [rags]"
  - Is: true on the page for Solace (subtitle "A Mexican Serenade") and Bethena ("A Concert Waltz"). Heliotrope Bouquet's own subtitle is "A Slow Drag Two Step", a ragtime form, and it is syncopated from bar 1; whether it "is not a rag" is for a musician.
  - Evidence: catalog `subtitle` of the three rows; `dump_score.py song.ragtime.joplin-heliotrope-bouquet` bar 1.
- [ ] **UNVERIFIED** `content/lessons/ragtime.7.md:33` — "the harmony wanders further than anything else Joplin published"
  - Is: HISTORY and JUDGEMENT; a comparison against the whole Joplin output that nothing in the repository measures.
  - Evidence: none possible from the repository.
- [x] **FALSE** `content/lessons/ragtime.7.md:36` — "a three-note figure repeats against a four-beat bar, so the accent moves each time and only comes back round after three bars"
  - Is: the piece is in 2/4 throughout, not a four-beat bar. Reading every right-hand bar (1-88), the syncopated figures group 3+3+2 sixteenths inside one bar and restart at each bar line (bars 6, 8, 13-14, 34-35, 39-40, 72-86); no three-note figure runs across bar lines for three bars.
  - Evidence: `dump_score.py song.ragtime.joplin-elite-syncopations`, all 88 bars; `times: ["2/4"]`. My reading of the rhythm is itself worth a musician's second look.
  - Fixed: now "groups its sixteenths in threes against a two-beat bar — three, three, two, starting again at each bar line" — `times: ["2/4"]` in the dump header; bars 5-6 and 13-14 re-read (chords on the fourth and seventh sixteenths: 3+3+2). The auditor's reading of the rhythm, which this sentence now follows, is still worth a musician's look at bars 72-86.
- [x] **WRONG-COUNT** `content/lessons/ragtime.7.md:42` — "The library has the scholarly Humdrum edition and a MuseScore transcription."
  - Is: the catalog has three Maple Leaf editions: `song.ragtime.joplin-maple-leaf-rag` (source "MuseTrainer public-domain MusicXML library"), `.kern` (Humdrum) and `.pdmx` (PDMX, a MuseScore upload). The one on this rung is the MuseTrainer edition, which is neither of the two named.
  - Evidence: catalog rows by title "Maple Leaf Rag", `source.name`; `songOptions` of ragtime.7 in `content/curriculum/stage-7.json`.
  - Fixed: heading now "Three editions of Maple Leaf" and the sentence "Besides the one on this rung, the library has the scholarly Humdrum edition and a MuseScore transcription" — catalog has three rows titled Maple Leaf Rag (`song.ragtime.joplin-maple-leaf-rag` MuseTrainer, `.kern` craigsapp/joplin, `.pdmx`); the rung's `songOptions` hold the MuseTrainer one.
- [ ] **JUDGEMENT** `content/lessons/ragtime.7.md:47` — "*Sugar Cane*, a rag in the Maple Leaf mould at a gentler pace"
  - Is: the printed marking supports it ("Slow March Tempo" against Maple Leaf's "Tempo Di Marcia"), but both catalog rows have `tempoBpm: 100`, so the app plays them at the same speed. "Maple Leaf mould" is HISTORY, unchecked.
  - Evidence: movement-title of `song.ragtime.joplin-sugar-cane.mxl`; catalog `tempoBpm` of both rows.

Checked and true: Stage 6 on form and flat keys (ragtime.6 title and lesson lines 17-25); Solace subtitle "A Mexican Serenade" and marking "Very slow march time" (catalog `subtitle`, score movement-title); Solace's habanera left hand dotted-eighth, sixteenth, eighth, eighth (bars 5-17 LH v2); Solace has the fewest left-hand leaps on the rung (successive left-hand events spanning a tenth or more: Solace 0.53 per bar, the other five 1.22-2.11); Bethena in 3/4 with five strains in five keys (G bars 1-28, B flat 29-52, F 77-101, B minor 102-118, D 119-134, return to G); Heliotrope co-written with Louis Chauvin (catalog `composer`) and subtitled a slow drag; Maple Leaf marked "Tempo Di Marcia" (score text); "Six options" (six `songOptions`); the five named plus Sugar Cane are exactly those six; Original Rags, Fig Leaf, Paragon, Antoinette and Pleasant Moments each have a catalog row whose `tracks` include `ragtime`, which is what the Library's track filter reads (`LibraryScreen.ts:105`); the rung's `tools` include `duet`; the Duet button opens the rung's first playable song with R selected (`LessonScreen.ts:443-449`), and choosing L on the score screen makes the app play the right hand (`playbackHands` defaults to `non-focused`, `settingsStore.ts:156`; `ScoreScreen.ts:2330-2340`).

Not checked in this lesson: the piano-roll history in lines 52-53 (HISTORY, not in the repository); that the Duet button opens Maple Leaf, not Solace, which the lesson recommends first (the lesson does not claim otherwise; the learner must open Solace from the list).

## technique.7 — `content/lessons/technique.7.md`

Claims checked: 22. Findings: 7.

- [x] **FALSE** `content/lessons/technique.7.md:12` — "Everything on this rung is one hand doing two things at once."
  - Is: two of the thirteen exercises are single-note broken dominant sevenths (`exercise.broken7.a-dominant7.both`, `exercise.broken7.a-flat-dominant7.both`: one note at a time in each hand, bars 1-2), and the lesson never mentions them.
  - Evidence: `dump_score.py exercise.broken7.a-dominant7.both`; `exerciseOptions` of technique.7 in `content/curriculum/stage-7.json`.
  - Fixed: now "Nearly everything on this rung is one hand doing two things at once; the two broken dominant sevenths are the exception, one note at a time in each hand" — `exerciseOptions` of technique.7 re-read (13 items, both `broken7` ones present); `dump_score.py exercise.broken7.a-dominant7.both` bars 1-2 are single sixteenths in each hand.
- [x] **FALSE** `content/lessons/technique.7.md:16` — "Both fingers are printed, as the standard three-group cycle: 1-3, 2-4, 3-5 and round again"
  - Is: true of the scales in thirds (right 1-3, 2-4, 3-5; left 5-3, 4-2, 3-1, retraced descending). The scales in sixths print a different fingering: right hand 1-5, 1-5, 2-5, 1-4, 1-5, 1-5, 2-5, 1-4 …; left hand 5-1, 5-1, 5-2, 4-1 …
  - Evidence: `<fingering>` elements of `exercise.double-third.c.1oct.right`/`.left` and `exercise.double-sixth.c.1oct.right`/`.left` (scratch reader of the built `.mxl`).
  - Fixed: the cycle is now said of the thirds only, and the sixths are described as "mostly 1-5, with 2-5 and 1-4 among them" — `<fingering>` read from the four built `.mxl` files: thirds RH 1-3, 2-4, 3-5 cycling; sixths RH 1-5, 1-5, 2-5, 1-4 repeating, LH 5-1, 5-1, 5-2, 4-1.
- [ ] **THEORY** `content/lessons/technique.7.md:35` — "Held part-way it clears the treble while the bass keeps ringing, which is how most Romantic music is actually pedalled."
  - Is: the first half is the usual description of half-pedalling and I believe it right; "most Romantic music" is a generalisation for a musician. The same idea is in the drill code comment (`special.ts:201-203`).
  - Evidence: knowledge; not checkable in the repository.
- [x] **FALSE** `content/lessons/technique.7.md:37` — "This exercise is scored on the pedal *value* rather than its timing: the app wants it somewhere in the middle of its travel"
  - Is: `exercise.pedal.half-pedal.a` has a file, so it opens on the Score screen (`openItem.ts:29`), where CC64 is reduced to down/up at 64 (`PracticeEngine.ts:559`). The value scorer `halfPedalResult` (`special.ts:340`) runs only when a `PedalDrill` is built with `halfPedalRange`; grep for `halfPedalRange|ccRange` under `app/src` found it only in `special.ts`, and `buildPedal` (`fromCatalog.ts:567`) never passes it.
  - Evidence: the files and lines named; catalog `drill.params.ccRange: [32, 96]` is read by nothing I found (grep `ccRange` under `app/src`: no hits).
  - Fixed: now "This exercise opens as an ordinary score: the app follows the notes and reads the pedal only as down or up, so the depth is for your ear to judge" — the item has a `file`, so `targetFor` returns `score` (`openItem.ts:29`); the score engine sets `sustainDown = value >= 64` (`PracticeEngine.ts:559`); `buildPedal` (`fromCatalog.ts:567-577`) never passes `halfPedalRange`, and grep `ccRange` under `app/src` returns nothing. Whether to build the value scorer into the score screen is the owner's separate decision.
- [x] **FALSE** `content/lessons/technique.7.md:38` — "and will tell you if your pedal only ever reports 0 or 127"
  - Is: `binaryPedal` is computed in `special.ts:351` and grep for `binaryPedal|partialPedal` under `app/src` finds no reader outside that file, so no screen says it; and per the finding above that code path is not reached for this exercise.
  - Evidence: grep as stated.
  - Fixed: the app no longer promises to tell you; the sentence now points at the MIDI log in Settings → Diagnostics — `binaryPedal` has no reader outside `special.ts` (grep `binaryPedal|partialPedal` under `app/src`); `DiagnosticsScreen.ts:361-368` prints each logged CC as `cc64=<value>`, and `WebMidiSource.ts` drops only clock and active sensing before the log; Diagnostics is listed in Settings (`SettingsScreen.ts:389`).
- [x] **FALSE** `content/lessons/technique.7.md:42` — "Czerny Op. 299 No. 5, No. 8 and No. 10, the faster ones: scales in both hands, broken chords across the keyboard, and the double-note figures"
  - Is: per piece: No. 5 has scales in both hands (RH bars 1-14, LH bars 15-22 and 35-42) and right-hand double notes (bars 16-22); No. 8 has right-hand scales and broken chords (bars 17-22) but the left hand only plays chords, and the right hand has no double notes; No. 10 has no scales in either hand: a 32nd-note broken-chord left hand with a repeated C4 throughout, a right-hand melody with octaves (bars 9-24) and thirds (25-29).
  - Evidence: `dump_score.py` on the three `.pdmx` items, all bars, with a per-bar count of stepwise runs and two-note chords.
  - Fixed: each étude now gets its own contents — No. 5 scales in both hands and right-hand double notes, No. 8 broken chords, No. 10 a broken-chord left hand under right-hand octaves and thirds — re-read with `dump_score.py`: No. 5 bars 1-2 (RH scales), 16-18 (LH scales, RH thirds); No. 8 bars 17-19 (RH broken chords, LH bass and chord); No. 10 bars 1-2 (32nd-note LH), 17-18 (RH octaves), 25-27 (RH thirds). "the faster ones" kept, still unchecked.
- [x] **FALSE** `content/lessons/technique.7.md:47` — "*Duet* will hold one of them: choose the hand playing the three, let the app play the two"
  - Is: technique.7 has no `tools` at all, so no Duet button is drawn. Were one added without an `item`, it would open the first song (Czerny No. 5), not the 2:3 exercise (`LessonScreen.ts:404-412`).
  - Evidence: technique.7 in `content/curriculum/stage-7.json`: no `tools` key.
  - Fixed: now "None of its own, but … the score screen's *Duet* will hold one of them: open the exercise, choose the hand …" — technique.7 has no `tools` key in `stage-7.json`; the score screen's Duet row appears when one hand is chosen and plays the other (`ScoreScreen.ts:2326-2339`, `playbackHands` default `non-focused`); `exercise.independence.c.2v3` has both hands. Whether to give the rung a Duet button is the owner's decision.

Checked and true: thirds and sixths keep changing between major and minor (every printed third and sixth in the C exercises is diatonic); octave fingering 1-5 on white keys and 1-4 on black in both hands (`exercise.octave-scale.a.1oct.both` and `exercise.broken-octaves.a.1oct.right` fingerings: C#, F#, G# take 4); the broken form is the same notes one at a time (bars 1-2); two against three in both directions (`exercise.independence.c.2v3` and `.3v2` both on the rung; 2v3 right hand two per beat, left three); the three Czerny études are the rung's three `songOptions`; technique.6 offers a trill (`exercise.trill.c.4pb.left`) and repeated notes (`exercise.repeated-notes.c.4x.left`).

Not checked in this lesson: "the faster ones" (the three print 80, 100 and 60 as tempos, in different metres; which Op. 299 numbers are "faster" is for a musician); "A hand that plays every octave 1-5 will not survive D flat" (JUDGEMENT, plain teaching); the rung offers no D-flat octave exercise for the "how you'll know" line at 53, which is advice rather than a claim.

## jazz.7 — `content/lessons/jazz.7.md`

Claims checked: 27. Findings: 5.

- [x] **FALSE** `content/lessons/jazz.7.md:35` — "The tenth on beat three is what makes it stride, and it is the leap you will miss."
  - Is: in the rung's stride exercise the beat-three note is the bottom note of the beat-two chord played alone (bar 1: `E3+G3` then `E3`; bar 2: `B3+F4` then `B3`), so beat three is not a leap at all. It is a tenth above the beat-one bass (C2 to E3), which is what the param `tenth` names. The leaps are beat one (down to C2, G2, F2) from the chord on beat four.
  - Evidence: `dump_score.py exercise.stride.c`, bars 1-4; catalog `drill.params.pattern: ["bass","chord","tenth","chord"]`.
  - Fixed: now "The leap you will miss is the one back down to the bass on beat one" — `dump_score.py exercise.stride.c` bars 1-4 re-read: beat three is the bottom of the beat-two chord (`E3+G3` then `E3`), and each bar starts on a low bass (C2, G2, C2, F2) after a chord on beat four.
- [ ] **THEORY** `content/lessons/jazz.7.md:35` — "bass, chord, tenth, chord. The tenth on beat three is what makes it stride"
  - Is: worth a musician's eye. Stride is usually described as bass notes (single, octave or tenth) on beats one and three with chords on two and four; a tenth in the middle register on three, as written here, is not the usual definition.
  - Evidence: knowledge.
  - Open: THEORY — the "what makes it stride" clause went with the FALSE fix above; "bass, chord, tenth, chord" stays because it is the exercise's own `pattern` param. Whether that pattern is stride as usually defined still needs a musician.
- [ ] **JUDGEMENT** `content/lessons/jazz.7.md:24` — "it is the sound of modal jazz and of most film music written since 1960"
  - Is: a generalisation only a musician or historian can weigh.
  - Evidence: none possible from the repository.
- [x] **FALSE** `content/lessons/jazz.7.md:54` — "The copy in the Library is shortened — one A section before the bridge"
  - Is: the rung's copy writes the A section once with a repeat sign and first and second endings (forward repeat bar 2, first ending bar 9, backward repeat and second ending bar 10), then the bridge (11-18) and the last A (19-28): the full AABA. The app unrolls repeats including endings (`app/src/score/extractScoreModel.ts:12-14`), so it plays AABA.
  - Evidence: scratch reader of `song.classical.i-got-rythm.pdmx`'s `.mxl` (repeat and ending elements per bar); `dump_score.py song.classical.i-got-rythm.pdmx`, bars 1-28.
  - Fixed: now "The copy in the Library writes the first two A sections once, with a repeat and two endings"; the advice to take the form from a chart went with the false premise — `.mxl` barlines re-read: forward repeat bar 2, ending 1 bars 9, ending 2 bar 10. One thing the auditor did not say: the backward repeat is on the right barline of bar 10 (inside ending 2), not at the end of ending 1, so the file's repeat is malformed and what the app actually plays there was not checked. The new sentence says only what is written.
- [x] **FALSE** `content/lessons/jazz.7.md:61` — "**Tools for this rung.** The lab's typed numerals take flats and sevenths, so `ii7 V7 I` and `ii7 ♭II7 I` can be built as two loops"
  - Is: jazz.7's `tools` are `play` and `duet`; there is no lab button on this rung. The lab itself would accept the numerals (`romanToLabChord`, `sightReading.ts:999-1024`, reads a `♭` prefix and a trailing 7), but the learner has to reach `#/lab` some other way.
  - Evidence: jazz.7 in `content/curriculum/stage-7.json`, `tools`; `sightReading.ts:987-1024`.
  - Fixed: now "The accompaniment lab — opened from the Library, not from this rung — takes typed numerals …" — jazz.7 `tools` are `play` and `duet`; the Library has an *Accompaniment lab* button that opens the lab with no preset (`LibraryScreen.ts:578`), and typed numerals fill the bars in rotation (`LabScreen.ts:132-134`). The lesson is now at exactly 600 words, the three-minute limit.

Checked and true: rootless A and B voicings are third, fifth, seventh and ninth in two arrangements (`exercise.voicing7.c.rootless-a`: Dm7 F-A-C-E, G7 F-A-B-D, Cmaj7 E-G-B-D; `exercise.voicing7.f.rootless-b`: Gm7 F-A-B♭-D, C7 E-G-B♭-D, Fmaj7 E-G-A-C) with the root in the left hand; quartal voicings are stacked fourths and the chart names them as minor elevenths (`exercise.open-voicing.c.quartal`: C-F-B♭-E♭ "C minor-11th") and move through three roots (C, F, G); D-G-C-F as D minor eleventh (THEORY, right); G7 and D♭7 share B/C♭ and F (THEORY, right; the exercise spells D♭7's seventh as B); the exercise's bass walks D2-D♭2-C2 (`exercise.tritone-sub.c` bars 1-3); "Six options" (six `songOptions`); Avalon and Tiger Rag carry dominant chord symbols to substitute (notation `chords`); Fly Me to the Moon's bass moves A-D-G-C-F-B-E-A (bars 1-8), a chain of ii-V-Is, with a D♭9 already substituted in bar 3; Jingle Bells jazz setting and Guaraldi's Skating are on the rung (catalog `composer`); rhythm changes as 32-bar AABA, B♭-Gm7-Cm7-F7 two beats a chord, bridge D7-G7-C7-F7 two bars each (THEORY, right); I Got Rhythm 1930 (HISTORY, not in the catalog; `composer` George Gershwin agrees).

Not checked in this lesson: "A great many bebop tunes are new melodies over these chords" (HISTORY, right as far as I know); that the lab plays an audible bass line under typed numerals (depends on the left-hand picker, not checked).

## blues.7 — `content/lessons/blues.7.md`

Claims checked: 19. Findings: 5.

- [x] **FALSE** `content/lessons/blues.7.md:12` — "Two leaps a bar, both of them downward-then-upward"
  - Is: the rung's stride exercise has one leap pair a bar: down to the bass on beat one, up to the chord on beat two. Beat three is the bottom note of the beat-two chord played alone (bar 1: `A3+C4` then `A3`), and beat four repeats the chord.
  - Evidence: `dump_score.py exercise.stride.f`, bars 1-4.
  - Fixed: now "One leap a bar, down to the bass and back up to the chord, and it cannot be watched" — `dump_score.py exercise.stride.f` bars 1-4 re-read: bass on beat one (F2, C2, F2, B♭2), chord on two, the chord's bottom note alone on three, the chord again on four.
- [x] **FALSE** `content/lessons/blues.7.md:32` — "Three, and all of them are a left hand that never stops."
  - Is: per piece: *Boogie (easy, for beginners)* keeps a moving bass in eighths then quarters (bars 1-7, 9-20; bar 8 a whole note). *Boogie-Boogie en Sol* keeps eighths throughout. *Rhythm and Boogie* does not: its lower staff plays one eighth then rests in bars 9-18 and 29-38 and is silent in bars 21-28 (a "Clap or tap" section); the running boogie figure is written on the upper staff.
  - Evidence: `dump_score.py` on the three `songOptions`, all bars; rehearsal mark "Clap or tap:" at bar 21 (scratch `.mxl` reader).
  - Fixed: now "Three, and two of them are a left hand that never stops" — `dump_score.py song.blues.rhythm-and-boogie`: lower staff one eighth then rests in bars 9-10, 17-18, 29-30, 37-38, silent from bar 21 (words "Clap or tap:" at bar 21 in the `.mxl`); the running figure is on the upper staff. The other two not re-read beyond the auditor's line.
- [ ] **JUDGEMENT** `content/lessons/blues.7.md:34` — "*Rhythm and Boogie* is forty bars of shuffle"
  - Is: forty bars is right. It is written in straight eighths with no swing marking (`swungMark: false`, no swing words on the score); whether it is meant as a shuffle is for a musician.
  - Evidence: catalog `notation`; `dump_score.py song.blues.rhythm-and-boogie`.
- [x] **FALSE** `content/lessons/blues.7.md:34` — "with the turnaround written out, so you can see the two bars rather than invent them"
  - Is: the last two bars of each twelve-bar chorus (19-20 and 39-40) are a G-F♯-E-D walk down to a held G that stops; neither is the lesson's I-vi-ii-V or the rung's iii-VI-ii-V, and bar 20 leads into a clapping section rather than back to the top.
  - Evidence: `dump_score.py song.blues.rhythm-and-boogie`, bars 17-21 and 37-40, both staves.
  - Fixed: now "with the boogie figure on the upper staff and a section to clap; each half ends on a written walk down to G rather than a turnaround" — bars 19-20 and 39-40 re-read, both staves: G-F♯-E-D then held G. "forty bars of shuffle" is kept; its JUDGEMENT finding stays open.
- [x] **FALSE** `content/lessons/blues.7.md:44` — "**Tools for this rung.** … *Rhythm only* takes them apart"
  - Is: blues.7's `tools` are `duet` and `blind`; neither is described. *Rhythm only* is not a rung tool but a Score-screen setting, shown only in Tempo mode and not in a blind run (`ScoreScreen.ts:2313`), so it is reachable on the stride exercise from the score's own menu, not from this rung's tool row.
  - Evidence: blues.7 in `content/curriculum/stage-7.json`, `tools`; `ScoreScreen.ts:895-916`, `2312-2318`.
  - Fixed: now "the score screen's *Rhythm only* setting, in Keep tempo, takes them apart" — blues.7 `tools` are `duet` and `blind`; the Rhythm only row is shown only when `mode === 'tempo' && !blind && !performanceRun` (`ScoreScreen.ts:2312`), and its own text says to tap on any key, one tap per written note or chord (`ScoreScreen.ts:912`). The rung's own tools are still not described; adding a paragraph for them is new prose, not a correction.

Checked and true: the turnaround is the last two bars and I-vi-ii-V is the standard (THEORY, right); the rung's variant is iii-VI-ii-V, the third-above chord for the tonic and a dominant VI (`exercise.turnaround.f.iii-vi-ii-v`: Am7, D7, Gm7, C7); the stride pattern's tenth is a tenth above the bass (F2 to A3); "the boogie from Stage 6" (blues.6 offers `exercise.boogie.c.pinetop`, `.f.walking-eighths`, `.c.root-fifth`); *Boogie (easy, for beginners)* is on blues.6 too (`songOptions`); "Three" (three `songOptions`); *Boogie-Boogie en Sol* is short and in G (21 bars, one sharp, ends on a G chord); "None of the three is required" (`songOptional: true`, `mastery.songsRequired: 0`).

Not checked in this lesson: "the short one is late rather than the long one being early" (JUDGEMENT about feel, plain teaching); "what you reach for when the tune has already sat on the tonic for eight bars" (JUDGEMENT); "One turnaround in three keys" is advice, but the rung offers the turnaround in F only.

## chords-pop.7 — `content/lessons/chords-pop.7.md`

Claims checked: 22. Findings: 5.

- [x] **FALSE** `content/lessons/chords-pop.7.md:34` — "*Fix You* and *Blinding Lights* are sus and add9 colour over a bass that barely moves"
  - Is: per piece: *Fix You* has it: B♭sus4-B♭ in bars 22, 24 and 26 (printed words), over a bass holding one note a bar in bars 21-26 and 33-40. *Blinding Lights (easy)* does not: its chord symbols are plain Gm, Dm, F, C (`chords` in the catalog) and the left hand holds two-note shells, G-B♭, D-A, F-A, C-G, changing every two bars. Any sus or add9 colour is only the melody against those shells.
  - Evidence: scratch `.mxl` reader for Fix You's printed words; `dump_score.py` on both, Fix You all 53 bars of LH, Blinding Lights bars 1-24.
  - Fixed: now "*Fix You* is sus colour over a bass that barely moves, and *Blinding Lights* four plain chords over two-note shells, the colour left for you to add" — catalog `notation.chords` of Blinding Lights is C, Dm, F, Gm; `dump_score.py` bars 1-11 LH G-B♭, D-A, F-A, C-G two bars each; Fix You's `.mxl` words read `B` `sus` `B` in bars 22, 24, 26 and 34-52. The add9 half of the claim is dropped for both (the auditor found none written).
- [ ] **JUDGEMENT** `content/lessons/chords-pop.7.md:35` — "*Welcome to Wonderland* and *For the Damaged Coda* are the open, spread voicings this rung is about"
  - Is: *Welcome to Wonderland*'s right hand plays close-position chords inside a sixth (B3-E4-A♭4, B3-E4-F♯4) over a left-hand octave (bars 0-9); *For the Damaged Coda*'s left hand is a broken figure spanning about a tenth (bars 1-6). Whether that is "open, spread voicing" in the rung's sense (ninth up an octave) is for a musician.
  - Evidence: `dump_score.py` on both, bars 0-10.
- [x] **FALSE** `content/lessons/chords-pop.7.md:37` — "*Wake Me Up* is the loop with a syncopated left hand under it"
  - Is: the loop is there (B minor, G, D, A). The left hand is on-the-beat quarters (bars 1-4) and then bass-then-chord eighths on every beat (bars 5-29); the only off-beat entries are a rest-then-dotted-quarter in bars 21 and 25.
  - Evidence: `dump_score.py song.folk.wake-me-up-avicii.pdmx`, bars 1-30 LH.
  - Fixed: now "the loop with a bass-and-chord left hand on every beat under it" — `dump_score.py song.folk.wake-me-up-avicii.pdmx` bars 1-2 (quarters) and 5-6 (bass then chord, eighths, every beat) re-read; bars 21 and 25 have the rest-then-dotted-quarter the auditor names, which the sentence no longer calls the texture.
- [x] **FALSE** `content/lessons/chords-pop.7.md:48` — "*Hear it* sounds the ninth chord, so C, Cadd9 and C9 can be compared in one breath"
  - Is: *Hear it* and *Show me* are on the drill screen (`DrillScreen.ts:1856-1857`), but `drill.jazz.extended-chords` only ever prompts 9, m9 and maj9 chords on C, D, F, G and A in a seeded order (catalog `drill.params`), so it never sounds C or Cadd9 and does not let the learner pick C9.
  - Evidence: catalog row `drill.jazz.extended-chords`; `buildExtendedChord` dispatch at `fromCatalog.ts:210`.
  - Fixed: *Hear it* now "sounds the chord it has asked for — a ninth, minor ninth or major ninth", and C, Cadd9 and C9 in a row are sent to *Free play* — catalog `drill.jazz.extended-chords` params `qualities: [9, m9, maj9]`, roots C D F G A; `extended-chord` is in `REVEALABLE_KINDS` (`feedback.ts:41-50`), so Show me / Hear it are drawn (`DrillScreen.ts:1854-1857`).
- [x] **STALE** `content/lessons/chords-pop.7.md:47` — "**Tools for this rung.**" (the paragraph describes the drill's buttons)
  - Is: chords-pop.7's `tools` are `play` (Free play) and `lab` with preset `ballad` (I-vi-IV-V, broken left hand, right hand none, all three locked: `sightReading.ts:869-878`). The paragraph describes neither.
  - Evidence: chords-pop.7 in `content/curriculum/stage-7.json`, `tools`.
  - Fixed: the paragraph now also names the rung's two tools — *Free play* (for C, Cadd9, C9) and the lab, "loops I–vi–IV–V in broken chords, fixed, in any key you set" — chords-pop.7 `tools`: `play`, `lab` preset `ballad`; `ballad` is `i-vi-iv-v`, left hand `broken`, right hand `none`, locks progression, leftHand, rightHand, key free (`sightReading.ts:869-879`).

Checked and true: sus chords have no third, sus4 resolves down to the third, both one finger from the triad (THEORY, right; exercises `exercise.open-voicing.c.sus4` C-F-G-C, `.c.sus2` C-D-G-C); add9 is a triad plus ninth without the seventh and a ninth chord has the seventh (THEORY, right); the add9 voicings put the ninth above the octave (`exercise.open-voicing.f.add9` F-A-C-G5, `.b-flat.add9` B♭-D-F-C6), so "written the second way on purpose" holds for add9; the rung has ninth chords in a jazz drill (`drill.jazz.extended-chords` is in `exerciseOptions`); "Six options" (six `songOptions`); all six carry the `personal-build` tag, and a strict build writes them as placeholders with an import hint (`tools/content/import_pdmx.py:46-50`, `207-214`); the rung is complete on exercises (`songOptional: true`, `songsRequired: 0`); *Scarborough Fair* solo setting is modal (D minor signature, B♭ 45 times and B natural 6 times: mostly Aeolian rather than the usual Dorian).

Not checked in this lesson: "It is the sound of most pop piano" (JUDGEMENT, plain teaching); the sus2 and sus4 voicings are not spread past the octave (`intervals` [0,2,7,12] and [0,5,7,12]); the lesson's "written the second way on purpose" names only the ninth, so I have not counted this as a finding.

## theory.7 — `content/lessons/theory.7.md`

Claims checked: 12. Findings: 3.

- [ ] **THEORY** `content/lessons/theory.7.md:27` — "Those three are not opinions — they are what the chord tones already spell."
  - Is: I believe this wrong. A seventh chord's tones fix four of the scale's seven notes; the ninth, eleventh and thirteenth are a choice. A dominant seventh also takes lydian dominant or the altered scale, a minor seventh aeolian or phrygian, a half-diminished chord locrian ♮2. Mixolydian, dorian and locrian are the defaults, not what the chord tones spell. A musician should confirm.
  - Evidence: knowledge; the code comment makes the same claim (`app/src/engine/drills/theory.ts:217-218`).
- [x] **FALSE** `content/lessons/theory.7.md:29` — "the app names one and says so, and you should trust your ear over it"
  - Is: the chord-scale drill names one: its hint is "play the scale that fits — ionian" for a maj7 (`harmony.ts:121`). It does not say there was a choice. It also scores the notes of the named mode in order (`expected: modePitches(root, mode)`, `ordered: true`), so a lydian answer over Cmaj7, Fmaj7 or B♭maj7 (all in this drill's `chords`) is marked wrong. Trusting your ear over it costs the answer.
  - Evidence: `app/src/engine/drills/harmony.ts:107-133`; `CHORD_SCALES.maj7 = 'ionian'` (`theory.ts:224`); catalog `drill.jazz.chord-scale` params.
  - Fixed: now "the drill names one — ionian — and marks only the scale it named, so a lydian answer counts as wrong there; trust your ear over it everywhere else" — `chordScaleDrill` (`harmony.ts:107-133`): hint `play the scale that fits — ${mode}`, `expected: modePitches(root, mode)`, `ordered: true`; `CHORD_SCALES.maj7 = 'ionian'` (`theory.ts:224`); the rung's drill includes Cmaj7, Fmaj7 and B♭maj7 (catalog params). Whether the drill should accept lydian is the owner's decision (the code comment at `harmony.ts:103-106` argues it should not mark lydian wrong, and it does).
- [x] **FALSE** `content/lessons/theory.7.md:40` — "**Tools for this rung.** The accompaniment lab reads `V/V` as a numeral"
  - Is: the lab does read it (`romanToLabChord` → `anyRomanToChord` → `secondaryToChord`, `sightReading.ts:999-1004`, `theory.ts:334-347`), but theory.7's only tool is `simon`; there is no lab button on this rung, and Simon is not described.
  - Evidence: theory.7 in `content/curriculum/stage-7.json`, `tools: [{"kind":"simon"}]`.
  - Fixed: now "The accompaniment lab — opened from the Library, not from this rung — reads `V/V` as a numeral" — theory.7 `tools` is `simon` only; the Library's *Accompaniment lab* button opens the lab with no preset (`LibraryScreen.ts:578`); `V/V` parses through `romanToLabChord` → `anyRomanToChord` (`sightReading.ts:999-1004`, auditor's lines, not re-read). Simon is still not described.

Checked and true: V/V in C is D major with F♯ (THEORY, right); tonicisation against modulation as a difference of length (THEORY, a fair simplification); the rung has a secondary-dominant ear drill (`drill.theory.secondary-dominants`: I-V/V-V-I, I-V7/vi-vi-IV, I-V7/IV-IV-V) and a chord-scale drill; maj7 has two defensible scales and the app picks ionian (`theory.ts:224`); "None required" (no `songOptions`, `songOptional: true`); `I V/V V I` in C gives D major in bar 2 (V of G).

Not checked in this lesson: "your ear knows it long before your analysis does" and the common-mistake paragraph (plain teaching).

## improv.7 — `content/lessons/improv.7.md`

Claims checked: 7. Findings: 0.

Checked and true: stacked fourths have no third-based identity and one shape sits over several chords (THEORY, right; the rung's quartal exercises chart the same shape as C, F, G minor elevenths and B♭, C, F minor elevenths: `exercise.open-voicing.c.quartal`, `.f.quartal`, intervals [0,5,10,15]); "One extension a day in five keys" matches the ninth-chord drill's five roots C, D, F, G, A (`drill.jazz.extended-chords` params); "Repertoire for this rung. Your own." (no `songOptions`, `songOptional: true`); the rung offers a modes drill for "one quartal shape moved through a mode" (`drill.theory.modes-all`).

Not checked in this lesson: the colour words for ninth, flat ninth and sharp eleventh (JUDGEMENT, standard teaching; note that the rung's extension drill offers only 9, m9 and maj9, no ♭9 or ♯11); "thirty seconds of film music" (JUDGEMENT); "Record the constraint improvisations" is advice, but the rung's only tool, Free play, records nothing (`FreePlayScreen.ts:8`, `51`), so the recording has to be made outside the app.

## rock.7 — `content/lessons/rock.7.md`

Claims checked: 16. Findings: 5.

- [x] **WRONG-COUNT** `content/lessons/rock.7.md:9` — "It is the last of the five things the overview named"
  - Is: the overview's "Where the textures go next" list has four items; building by register and density is the fourth and last.
  - Evidence: `content/lessons/rock.overview.md:43-49`.
  - Fixed: now "the last of the four things the overview named" — `rock.overview.md` "Where the textures go next" re-read: four numbered items, building by register and density the fourth (Stage 7).
- [x] **FALSE** `content/lessons/rock.7.md:33` — "The shaping exercises are four bars of one line getting louder and then quieter"
  - Is: each shaping exercise goes one way only: `exercise.shaping.a.crescendo` and `.c.crescendo` are marked "Grow evenly from the first note to the last", `exercise.shaping.a.diminuendo` "Fade evenly from the first note to the last". The line rises and falls in pitch, not in volume. Each is written as five bars: four of eighths and a final note in bar 5.
  - Evidence: `dump_score.py` on the A crescendo and A diminuendo (text on the score, bars 1-5); catalog `drill.params.shape`.
  - Fixed: now "four bars of one line and a last note, each going one way only, louder or quieter" — rung `exerciseOptions` hold `shaping.a.crescendo`, `.a.diminuendo`, `.c.crescendo`; catalog `drill.params.shape` one direction each, `notation.bars` 5; `dump_score.py exercise.shaping.a.crescendo` bars 1-5 (eighths in 1-4, one note in 5; words "Grow evenly from the first note to the last").
- [x] **FALSE** `content/lessons/rock.7.md:39` — "Three options, all bundled"
  - Is: bundled in the owner's personal build only for one of them: the Rachmaninoff row carries `personal-build` and `compositionStatus: in-copyright`, so a strict (public) build writes it as a placeholder (`tools/content/import_pdmx.py:207-214`). Grieg (`pd`) and Moonlight III (`pd`) are bundled in both.
  - Evidence: catalog `tags` and `compositionStatus` of the three `songOptions`.
  - Fixed: "all bundled" is gone; the sentence now says the Rachmaninoff is a personal-library score whose row the public build shows with where to get it (the wording chords-pop.7 already uses) — catalog: Rachmaninoff `tags` include `personal-build`, `compositionStatus: in-copyright`; Grieg `pd`, Moonlight III `pd`; `import_pdmx.py:207-214` bundles only `pd` rows in a strict build.
- [x] **FALSE** `content/lessons/rock.7.md:40` — "one sixteen-bar idea repeated while the register widens and the tempo grows"
  - Is: the register widening is written (right hand single line bars 2-17, octaves from 18, left-hand octaves from 48). The tempo growth is not: this edition has one tempo (138, bar 1) and its only words after bar 2 are "cresc." and "simile"; no accelerando, stretto or più mosso, so the app plays it at one speed.
  - Evidence: scratch `.mxl` reader (every `<words>` and `<sound tempo>` in 87 bars); `dump_score.py song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx`.
  - Fixed: the tempo clause now reads "under a crescendo marked again and again (this copy asks for no speeding up, and the app keeps one tempo)" — `.mxl` re-read: one `<sound tempo="138">` (bar 1), words after bar 2 are only cresc. marks (bars 11, 18, 26, 46, 58, 86), "simile" (43) and "m.g." (87). "sixteen-bar idea" kept; its JUDGEMENT finding stays open. The lesson is now 598 words.
- [ ] **JUDGEMENT** `content/lessons/rock.7.md:40` — "one sixteen-bar idea repeated"
  - Is: the unit that repeats is eight bars (bars 2-9, stated again in 10-17, then in octaves in 18-25); sixteen bars is that phrase twice. Whether to call the idea eight or sixteen bars is for a musician.
  - Evidence: `dump_score.py` bars 2-25, with a per-bar note count.

Checked and true: register and density as ways to build (plain teaching); "the rung's range runs from level 5 to beyond 8" (`levelBand: [5.2, 8.4]`); the octave scale is on the rung (`exercise.octave-scale.a.1oct.both`); Grieg's first half stays small (pp in bar 2, "cresc. poco a poco" from bar 11); the Rachmaninoff opening thickens (right hand 3 notes in bar 1, 4 from bar 2; left hand 3 then 4 from bar 3) with "cresc." from bar 2; *Play it blind* is the rung's tool (`tools: [{"kind":"blind"}]`), and the button opens the rung's first playable song blind (`LessonScreen.ts:451-456`).

Not checked in this lesson: "Used alone it runs out after about eight bars" and "the ear stops hearing an increase as an increase" (JUDGEMENT); *Moonlight*'s finale "the build is inside the writing rather than marked over it" (JUDGEMENT; I did not count its dynamics).

## classical.8 — `content/lessons/classical.8.md`

Claims checked: 20. Findings: 3.

- [x] **FALSE** `content/lessons/classical.8.md:58` — "The method above is on the score screen … the raising and the dropping back happen while your attention stays on the hand"
  - Is: the *Ladder* is a different rule from "the method above" (five perfect passes, up four clicks, on failure down two and stay a day). It moves the tempo 10 % of written after every single pass, up after a clean pass and down after one with a mistake, and stops at the written tempo (`nextLadderTempo`, `LADDER_NOTCH_PCT = 10`, `LADDER_CEILING_PCT = 100`: `PracticeEngine.ts:67`, `77`, `103-108`). It is also a Score-screen setting, not one of this rung's tools (`blind`, `duet`), neither of which the paragraph describes.
  - Evidence: the lines named; classical.8 in `content/curriculum/stage-8.json`, `tools`.
  - Fixed: now "The score screen has a simpler version of the method above, the *Ladder*: … each clean pass raises the tempo by a tenth of the written speed and each faulty one drops it by the same, up to the written tempo" — `nextLadderTempo` (`PracticeEngine.ts:103-108`), `LADDER_NOTCH_PCT = 10`, ceiling `max(LADDER_CEILING_PCT = 100, startedAtPct)`; the Ladder applies only in Keep tempo with a loop (`ladderApplies`, `ScoreScreen.ts:1480-1482`). The rung's own tools, `blind` and `duet`, are still not described.
- [x] **FALSE** `content/lessons/classical.8.md:58` — "loop two beats of the étude, switch the *Ladder* on"
  - Is: a loop is whole printed bars (`loopForPrintedBars(from, to)`, `ScoreScreen.ts:862`, `1405`; the double-tap marks one bar, `1723-1726`), so the shortest loop is one bar, not two beats.
  - Evidence: `ScoreScreen.ts` lines named; menu text "Repeat a few bars over and over" (`1089`).
  - Fixed: now "loop the bar that holds the figure" (no longer "two beats of the étude", which also named a piece the rung does not offer) — every loop goes through `loopForPrintedBars` (`ScoreScreen.ts:862`, `1405`, `1723`, `2214`), whole printed bars; the Loop row's text is "Repeat a few bars over and over" (`ScoreScreen.ts:1089`).
- [ ] **UNVERIFIED** `content/lessons/classical.8.md:47` — "the *Moonlight* finale, which is the fastest thing on the rung"
  - Is: probably true. Notes per second at the first printed tempo, per staff: Moonlight III 6.05 / 7.56; Rondo alla turca 5.05 / 3.77; Arabesque 3.61 / 3.18; Nocturne Op. 9 No. 1 1.92 / 3.77; Waltz Op. 64 No. 2 2.48 / 1.41; Clair de lune 1.37 / 1.64. My measure is a proxy: it uses the first tempo only, and four of the six change tempo.
  - Evidence: scratch reader of each built `.mxl` (onsets per staff over total quarters at the first `<sound tempo>`).

Checked and true: Op. 25 No. 9, Op. 25 No. 1 and Op. 10 No. 6 as the lesson describes them (THEORY, right, as far as I know); all three are in the Library under the classical track (`song.classical.chopin-etude-op25-9.nifc`, `-op25-1.nifc`, `chopin-etude-in-e-flat-minor-op-10-no-6.pdmx`); "Six options" (six `songOptions`) and each named piece is one of them (Rondo alla turca, Moonlight III, Waltz Op. 64 No. 2, Nocturne Op. 9 No. 1, Clair de lune, Arabesque No. 1); preludes, polonaises, the Berceuse and the études are catalog rows with `tracks: ["classical"]` (28 Op. 28 preludes and études listed by a title search, nine polonaises, `song.classical.chopin-berceuse.nifc`); the summary reports where the ladder ended ("ended at N % of written", `ScoreScreen.ts:2042`).

Not checked in this lesson: "repeats it for three minutes" (JUDGEMENT); the cross-rhythm paragraph names no piece, so there was nothing on the rung to check it against; none of the six songs is an étude, so "loop two beats of the étude" and "One étude at its written tempo" need a Library piece or the `paperHint`'s own copy (the lesson does point to the Library at line 50).

## ragtime.8 — `content/lessons/ragtime.8.md`

Claims checked: 24. Findings: 6.

- [x] **FALSE** `content/lessons/ragtime.8.md:18` — "the secondary rag — three-note groups across a four-beat bar — turns up in whole strains"
  - Is: both named rags are in 2/4, not a four-beat bar. Pine Apple's trio strain (bars 23-37) is built from 3+3+2 sixteenth groupings (`A4 A5 / G4 G5 / A4 A5`), but they restart inside each bar or two-bar unit. A search for any right-hand top-note pattern repeating every three events for seven or more events found only short spots in Gladiolus (bars 9, 12-13, 43, 46-47), none a strain long.
  - Evidence: `dump_score.py` on `song.ragtime.joplin-pine-apple-rag` and `-gladiolus-rag`, all bars; catalog `times: ["2/4"]` on both; scratch period-3 detector over the right-hand top line.
  - Fixed: now "groups three sixteenths long running across the bar line — fills a whole strain of *Pine Apple* rather than turning up in passing" — both rags are 2/4 (`dump_score.py` headers), so "four-beat bar" was wrong. The finding is only half right: `dump_score.py song.ragtime.joplin-pine-apple-rag` bars 23-38 are built throughout from a two-bar unit of 3+3+3+3+2+2 sixteenths, the third group tied across the bar line (bars 23-24, 25-26, 31-32, 33-34), so a whole strain *is* made of it. The claim is now made of Pine Apple only; Gladiolus's short spots (auditor) are not claimed.
- [ ] **UNVERIFIED** `content/lessons/ragtime.8.md:17` — "*Pine Apple Rag* and *Gladiolus Rag* put the ragtime figure on nearly every beat instead of once a bar"
  - Is: holds for Pine Apple (a sixteenth-eighth-sixteenth figure in 53 of 89 bars), doubtful for Gladiolus (26 of 86 bars). My count is a proxy: it reads only the first right-hand voice and misses figures written with ties.
  - Evidence: scratch count over `dump_score.py` output of both.
- [ ] **UNVERIFIED** `content/lessons/ragtime.8.md:25` — "goes through four keys and spends a whole strain in the minor"
  - Is: the score has two key signatures (B♭ bars 1-63 and 84-109, D♭ bars 64-83). Reading the bass, I hear B♭ major (5-20), G minor (22-38), B♭ with E♭ excursions (39-62) and B♭ minor (64-83): three or four centres by that reading, and two strains in the minor, not one. The count of keys needs a musician.
  - Evidence: scratch `.mxl` reader (keys and repeats per bar); `dump_score.py song.ragtime.joplin-magnetic-rag`, all 109 bars LH.
- [ ] **UNVERIFIED** `content/lessons/ragtime.8.md:40` — "Five late Joplin rags — *Pine Apple*, *Gladiolus*, *Magnetic*, *The Cascades* and *Scott Joplin's New Rag*"
  - Is: HISTORY. By my knowledge *The Cascades* is 1904, which is mid-period rather than late (the others are 1907-1914). No catalog field carries a date for these rows.
  - Evidence: catalog rows have no year; knowledge only.
- [x] **FALSE** `content/lessons/ragtime.8.md:48` — "Joplin's *Euphonic Sounds*, which is not in the public-domain edition this library was built from"
  - Is: it is not in the source edition: `craigsapp/joplin` holds 47 rags and Euphonic Sounds is not one, checked 2026-09-05. But that edition is licensed CC BY-NC-SA, not public domain, which is why its rows are tagged `nc-personal-build`.
  - Evidence: `content/sources/kern.json`, `absentFromSource["joplin/euphonic"]`; catalog `source.license` "CC BY-NC-SA" on the Joplin kern rows (e.g. `song.ragtime.joplin-bethena`).
  - Fixed: now "which is not in the edition these Joplin rags come from" — `kern.json` `absentFromSource["joplin/euphonic"]` re-read; catalog `source.license` "CC BY-NC-SA" and tag `nc-personal-build` on Pine Apple, Gladiolus and Magnetic (the rung's Joplin rows read; Cascades and New Rag not read).
- [x] **FALSE** `content/lessons/ragtime.8.md:56` — "**Tools for this rung.** … Play a strain in *Rhythm only*"
  - Is: ragtime.8's only tool is `blind`, which the paragraph does not describe. *Rhythm only* is a Score-screen setting available in Tempo mode on any score, not a tool of this rung (`ScoreScreen.ts:895-916`, `2312-2318`).
  - Evidence: ragtime.8 in `content/curriculum/stage-8.json`, `tools: [{"kind":"blind"}]`.
  - Fixed: now "Play a strain with the score screen's *Rhythm only* setting on, in Keep tempo" — ragtime.8 `tools` is `blind` only; Rhythm only is a Score-screen row shown only in Keep tempo, not blind, not a performance (`ScoreScreen.ts:2312`). *Play it blind* is still not described.

Checked and true: Stage 7 was about the left hand (ragtime.7 lesson and title); *Magnetic Rag* is dated 1914 and is the last rag Joplin published (HISTORY, agrees with my knowledge; not in the catalog); *Stoptime Rag* is in the Library (`song.ragtime.joplin-stoptime-rag`, track `ragtime`), not on this rung, and its built score carries no stamping instruction (only "Fast or slow."; a search of the whole `.musicxml` for stamp, heel or foot returned nothing), while its catalog note says Joplin printed it; "Six options" (six `songOptions`: the five Joplin rags named plus *Frog Legs Rag*); *Wall Street* and *Reflection Rag* are catalog rows on the `ragtime` track; *Frog Legs Rag* (1906) by James Scott (catalog title and `composer`); *Ragtime Nightingale* is not in the catalog (title search for "nightingale" and "lamb": only Mary Had a Little Lamb rows), and `kern.json` lists it under `absentFromSource`; the tempo markings are slow ("Slow March tempo" on Pine Apple and Gladiolus, "Not fast." on Frog Legs).

Not checked in this lesson: "the other great rag of the Sedalia school" (HISTORY); "Most late rags are four or five figures in different clothes" (JUDGEMENT); "the difficulty is in hearing the harmony" (JUDGEMENT).

## technique.8 — `content/lessons/technique.8.md`

Claims checked: 13. Findings: 2.

- [x] **FALSE** `content/lessons/technique.8.md:35` — "**Tools for this rung.** Moving it up a few beats at a time is what the *Ladder* does with a loop set"
  - Is: technique.8 has no `tools`, so no tool row is drawn. The Ladder is a Score-screen setting, available with a loop in Tempo mode. It does step up after a clean pass and down after a faulty one, by 10 % of the written tempo, which is 12 at 120 (`PracticeEngine.ts:67`, `103-108`; `ScoreScreen.ts:1481`).
  - Evidence: technique.8 in `content/curriculum/stage-8.json` (no `tools` key); the code lines named.
  - Fixed: now "None of its own, but moving it up is what the score screen's *Ladder* does with a loop set, in Keep tempo: a tenth of the written tempo at a time, twelve at 120" — technique.8 has no `tools` key in `stage-8.json`; `LADDER_NOTCH_PCT = 10` and `nextLadderTempo` (`PracticeEngine.ts:103-108`); `ladderApplies` needs Keep tempo and a loop (`ScoreScreen.ts:1480-1482`). "a few beats at a time" is gone from this sentence (twelve is more than a few); the How-to-get-there paragraph still says it as advice for a metronome.
- [x] **FALSE** `content/lessons/technique.8.md:37` — "Loop one octave while you are finding the tempo"
  - Is: a loop is whole printed bars (`loopForPrintedBars`, `ScoreScreen.ts:862`, `1405`). In these exercises one bar holds two octaves of sixteenths (bar 1 of the C scale runs C4 to D6), so the shortest loop is two octaves, and the turn at the top sits inside bar 2.
  - Evidence: `dump_score.py exercise.scale.c-major.4oct.similar.both.1`, bars 1-4.
  - Fixed: now "A loop is whole bars, and one bar here is two octaves up, so loop the first bar while you are finding the tempo" — `loopForPrintedBars` takes printed bars (`ScoreScreen.ts:862`, `1405`); `dump_score.py exercise.scale.c-major.4oct.similar.both.1` bar 1 runs C4 to D6 in the right hand, bar 2 turns at C8. Only this one of the twelve exercises was re-read.

Checked and true: four octaves in sixteenths at a quarter-note pulse of 120 (all twelve `exerciseOptions` have `rhythm: 0.25`, four octaves, and a printed tempo of 120, read one by one from each `.mxl`); eight notes a second per hand (arithmetic, right); four octaves up and down fit the four bars (C4 up to C8 and back, bars 1-4); the scales are ones met earlier (C major scales on Stage 1 `practice.2` and Stage 2 `2.5`); Wait mode holds until the right notes arrive (no clock in Wait, `PracticeEngine.ts:534-537`); the Ladder drops back after a pass that is not clean (`nextLadderTempo`).

Not checked in this lesson: "it is the standard this stage is measured against" (the rung's mastery asks for `minTempoPct: 0.8`, i.e. 96, not 120; I read the sentence as describing the target rather than the pass mark, so it is not listed); "the first thing to fail is not accuracy but the wrist" (JUDGEMENT); "roughly twice the work of two" (JUDGEMENT).

## jazz.8 — `content/lessons/jazz.8.md`

Claims checked: 14. Findings: 2.

- [ ] **JUDGEMENT** `content/lessons/jazz.8.md:33` — "*Stardust* (1927) is a standard whose bridge modulates, as most 1920s bridges do, and it is all bridge"
  - Is: "most 1920s bridges modulate" and "it is all bridge" are generalisations for a musician. The rung's 52-bar copy has one key signature (C) throughout and no chord symbols, so the score cannot settle either.
  - Evidence: catalog `notation` (`keys: [{"fifths": 0}]`, `chordCount: 0`); `dump_score.py song.jazz.hoagy-carmichael-stardust-hoagy-carmichael.pdmx` header.
- [ ] **UNVERIFIED** `content/lessons/jazz.8.md:29` — "Ninth chords in five roots"
  - Is: advice, but it points at a drill this rung does not offer. The five-root ninth drill (`drill.jazz.extended-chords`, roots C, D, F, G, A) is on jazz.7 and chords-pop.7. This rung's extension drill is `drill.jazz.extended-chords-13` (11, m11, 13, m13, maj13 on four roots: C, E♭, F, B♭).
  - Evidence: jazz.8 `exerciseOptions` in `content/curriculum/stage-8.json`; catalog `drill.params` of both drills.
  - Open: UNVERIFIED as filed, so left. It is checkable and the auditor's evidence holds (jazz.8 `exerciseOptions` carry `drill.jazz.extended-chords-13`, not the five-root ninth drill); if it is re-filed as FALSE, the correction is to name the rung's own eleventh and thirteenth drill on C, E♭, F and B♭.

Checked and true: a thirteenth chord as seventh plus ninth plus thirteenth, six notes (THEORY, right as the lesson defines it; the drill's `13` is exactly [0,4,7,10,14,21], `theory.ts:75`); the natural eleventh over a dominant is a minor ninth above the third (THEORY, right); the rung's dictation drill changes key partway (`drill.theory.harmonic-dictation-modulation`: C:I C:V7/V G:V G:I, and two more); it is also on theory.8, whose lesson explains the pivot and says the moment you hear is not the pivot (`theory.8.md:16`, `21`); "Three options" (three `songOptions`); Stardust dated 1927 (catalog title); I Got Rhythm's bridge walks a circle of dominants (the rung's copy, bars 11-18: A-D, D-G, G-C, C-F in the bass); *Uncle Ben's Cakewalk* is by Tom Brier (catalog `composer`), a modern rag.

Not checked in this lesson: "That is why sharp elevenths exist and why the sus chords do too" (JUDGEMENT); the rung's `11` quality is written with the major third and the natural eleventh together ([0,4,7,10,14,17], `theory.ts:73`), the clash this lesson warns about; that may deserve a musician's eye but is a drill question, not a lesson claim. The rung's tools, Free play and the `jazz-comping` lab, are not mentioned.

## blues.8 — `content/lessons/blues.8.md`

Claims checked: 18. Findings: 4.

- [x] **STALE** `content/lessons/blues.8.md:36` — "it is the same file you met a rung ago"
  - Is: *Pinetop's Boogie Woogie* (`song.folk.boogie-woogie.pdmx`) is on blues.6, two rungs back. blues.7's three songs are *Boogie (easy, for beginners)*, *Rhythm and Boogie* and *Boogie-Boogie en Sol*.
  - Evidence: `songOptions` of blues.6 (`stage-6.json`) and blues.7 (`stage-7.json`).
  - Fixed: now "the same file you met at Stage 6" — `song.folk.boogie-woogie.pdmx` is in `songOptions` of blues.6 (`stage-6.json:371`) and blues.8 (`stage-8.json:339`); blues.7's three songs do not include it.
- [ ] **JUDGEMENT** `content/lessons/blues.8.md:36` — "the record every boogie bass since is a copy of"
  - Is: HISTORY and JUDGEMENT; the date 1928 matches the catalog title and note.
  - Evidence: catalog row `song.folk.boogie-woogie.pdmx`.
- [x] **FALSE** `content/lessons/blues.8.md:45` — "Typed numerals carry their sevenths, so `I7 IV7 V7` set in E flat builds the whole form in the new key"
  - Is: three typed numerals fill the bars one per bar in rotation (`typed[bar % typed.length]`, `LabScreen.ts:132-134`), giving I7 IV7 V7 I7 IV7 V7 …, not the twelve-bar form (I I I I IV IV I I V IV I I). The preset's own `blues` progression already builds the form, in whatever key is picked.
  - Evidence: `LabScreen.ts:129-138`; `LAB_PROGRESSIONS` entry `blues` (`sightReading.ts:789-794`).
  - Fixed: the typed `I7 IV7 V7` is gone; the sentence now says the lab opens on its twelve-bar blues, "the form fixed and every chord already a seventh; set the key to E flat and *Read it* prints the whole form" — typed numerals rotate one per bar (`LabScreen.ts:131-135`); `blues-shuffle` uses progression `blues` = `BLUES_MAJOR` I7 I7 I7 I7 IV7 IV7 I7 I7 V7 IV7 I7 V7 (`sightReading.ts:746-750`, `789-794`), locks progression, leftHand, bars and leaves the key free (`sightReading.ts:881-893`). *Read it* was not re-read beyond the file comment (`LabScreen.ts:13`).
- [x] **FALSE** `content/lessons/blues.8.md:45` — "Typed numerals …" (as reached from this rung)
  - Is: the rung's lab button opens the `blues-shuffle` preset, which locks `progression`, `leftHand` and `bars` (`sightReading.ts:880-892`). The progression picker is disabled (`LabScreen.ts:584-601`), so the typed-numerals option cannot be chosen from this rung's lab. The key is not locked, so E flat can be set.
  - Evidence: the lines named; blues.8 `tools` in `stage-8.json`.
  - Fixed by the same change: the paragraph no longer asks for typed numerals on a preset that disables the progression picker (`applyLocks`, `LabScreen.ts:584-601`); it uses only the key, which the preset leaves free.

Checked and true: the twelve bars are I, IV and V (THEORY, right); the rung has a four-on-the-floor comping exercise (`exercise.comping.b-flat.four-on-the-floor`) and a walking bass (`exercise.walking-bass.e-flat.blues`, in E flat); ninth chords are on the rung (`drill.jazz.extended-chords`); the rung is finished on exercises (`songOptional: true`, `songsRequired: 0`); Pinetop 1928, Chevy Chase by Eubie Blake 1914, Black Bottom Stomp by Jelly Roll Morton 1926 (catalog titles, `composer`, edition notes); *The Chevy Chase*'s left hand strides, bass then chord (bars 5-16); *Black Bottom Stomp* is the highest-levelled of the three (8.62 against 7.72 and 7.47, all `estimated`) and moves from B flat to E flat without a new key signature (A♭ accidentals from about bar 57, final chord E♭ in bar 101); *Read it* is a lab action (`LabScreen.ts:13-14`).

Not checked in this lesson: "every one of them takes a ninth without asking" and "The thirteenth … is what you hear on records" (JUDGEMENT); the off-beat comping pattern the lesson calls harder is not on this rung (only four-on-the-floor), which the lesson does not claim; *Play it blind*, the rung's other tool, is not described.

## chords-pop.8 — `content/lessons/chords-pop.8.md`

Claims checked: 13. Findings: 3.

- [x] **FALSE** `content/lessons/chords-pop.8.md:45` — "Build the song's changes once as numerals, move the key down a tone and start the loop"
  - Is: the rung's lab button opens the `primary-chords` preset, which locks `progression` and `leftHand` (`sightReading.ts:845-855`). The progression picker is disabled (`LabScreen.ts:584-601`), so a song's own numerals cannot be typed in from this rung; the loop stays I-IV-V-I. The key is deliberately left free, so "move the key down a tone" works.
  - Evidence: the lines named; chords-pop.8 `tools` in `stage-8.json`.
  - Fixed: now "Here it loops I–IV–V–I and leaves the key to you: play along, move the key down a tone and start the loop again"; building the song's own changes is gone — chords-pop.8's lab is preset `primary-chords`: progression `i-iv-v-i` (I, IV, V, I), locks `progression` and `leftHand`, key free (`sightReading.ts:845-855`, `760-765`); locked rows are disabled (`applyLocks`, `LabScreen.ts:584-601`). Pointing the rung at an unlocked preset instead is the owner's decision. *Play it blind* is still not described.
- [ ] **UNVERIFIED** `content/lessons/chords-pop.8.md:36` — "*If I Had a Chicken* is the fastest of them"
  - Is: by notes per second at the printed tempo it has the most notes over both hands (4.21 + 3.64), but *Silhouette* has a faster tempo (182 against 125) and the busier single staff (left hand 4.52 a second). "Fastest" depends on the measure; this is a proxy.
  - Evidence: scratch reader over each built `.mxl` (onsets per staff over total quarters at the first printed tempo).
- [ ] **JUDGEMENT** `content/lessons/chords-pop.8.md:35` — "*Isabella's Lullaby*, *Levi's Choice* and *Undertale* are themes whose keys were chosen for an orchestra, not a voice"
  - Is: to my knowledge *Isabella's Lullaby* is sung (hummed) in the show and *Undertale*'s theme is a game score, not orchestral. A musician should word this.
  - Evidence: knowledge only; catalog `composer` fields name the composers and arrangers.

Checked and true: the transposition drill prints four bars (`bars: 4`) and asks for them a stated interval away ("Play in X", hint "up N semitones"), judging against the written melody plus the shift with any octave accepted (`harmony.ts:317-346`); secondary-dominant numerals are on the rung (`drill.theory.roman-numerals-secondary`: V/V, V7/vi, V7/IV, vii°/V, V/ii); "Six options" (six `songOptions`); *All I Want* (Kodaline) and *Silhouette* (KANA-BOON) are songs with singers; all six carry `personal-build`, the strict build writes them as placeholders with an import hint, and the rung is complete on exercises (`songOptional: true`); the lab's key is free on this preset.

Not checked in this lesson: "What to practise. Four bars up a tone, then a minor third, then down a fourth" is advice; the rung's drill picks among +3, +4, +6 and -5 semitones (`drill.params.targets`), so "up a tone" is never one of its prompts. *Play it blind*, the rung's other tool, is not described.

## theory.8 — `content/lessons/theory.8.md`

Claims checked: 9. Findings: 1.

- [ ] **JUDGEMENT** `content/lessons/theory.8.md:33` — "the bridge of almost any standard modulates"
  - Is: a generalisation a musician may dispute: many bridges tonicise a new chord for a few bars (by this lesson's own line 36-37 test, "back home in two bars, nothing modulated") rather than change home. jazz.8 line 34 makes the same claim.
  - Evidence: knowledge only.

Checked and true: Am is vi in C and ii in G, and D7 follows as V7 of G (THEORY, right); the rung's dictation drill writes key, colon, numeral and the key changes partway (`drill.theory.harmonic-dictation-modulation`: `C:I C:V7/V G:V G:I`, `C:I C:vi A:V7/V D:V D:I`, `F:I F:IV C:V7 C:I`), and the learner sees that text because each progression's label is its tokens joined (`fromCatalog.ts:533-537`); "Three modulating progressions" (three in the drill's params); "Repertoire … Not required" (no `songOptions`, `songOptional: true`).

Not checked in this lesson: "a good modulation is inaudible until it has happened" and "usually the bar after you thought something changed" (JUDGEMENT, plain teaching); the label is the prompt's own `label` (`harmony.ts:415-420`), so it may be on screen while the learner is meant to be "taking it down by ear" (line 29). I did not read the drill screen to see when it is shown; that is a drill question for the fixer, not a lesson finding. The rung's tool, Simon, is not described.

## improv.8 — `content/lessons/improv.8.md`

Claims checked: 12. Findings: 1.

- [x] **FALSE** `content/lessons/improv.8.md:37` — "A secondary dominant is a numeral the accompaniment lab will read, so an approach chord can be typed in … Build your three versions there"
  - Is: the lab does read `V7/x` (`romanToLabChord` → `anyRomanToChord`, `sightReading.ts:999-1004`). But this rung's lab button opens the `jazz-comping` preset, which locks `progression` and `leftHand` (`sightReading.ts:895-904`). The progression picker is disabled (`LabScreen.ts:584-601`), so nothing can be typed in from this rung; the loop stays ii-V-I.
  - Evidence: the lines named; improv.8 `tools` in `stage-8.json`.
  - Fixed: added "Type them into the lab opened from the Library: this rung's lab button opens a ii–V–I whose chords are fixed" — improv.8's lab is preset `jazz-comping`, progression `ii-v-i` (ii, V7, I, I), locks `progression` and `leftHand` (`sightReading.ts:774-779`, `895-905`); the Library's *Accompaniment lab* button opens the lab with no preset (`LibraryScreen.ts:578`), where typed numerals including `V7/x` are read (`romanToLabChord` → `anyRomanToChord` → `secondaryToChord`, `sightReading.ts:999-1004`, `theory.ts:358-366`). Pointing the rung at an unlocked preset is the owner's decision.

Checked and true: every dominant can take the dominant a tritone away and the bass becomes a chromatic descent (THEORY, right; `exercise.tritone-sub.c` and `.f` on the rung, bass D-D♭-C and G-G♭-F); any chord can be preceded by its own dominant (THEORY, right); a melody C as root of C, third of A♭, fifth of F, seventh of D, ninth of B♭ and sharp eleventh of F♯ (B♯ spelled as C): six harmonies, each right (THEORY); "Repertoire … The three versions" (no `songOptions`, `songOptional: true`); the rung's turnaround exercise supplies approach chords (`exercise.turnaround.c.iii-vi-ii-v`: Em7, A7, Dm7, G7).

Not checked in this lesson: "the best way to learn composition" and "the first things you have composed that have a subject" (JUDGEMENT, plain teaching).

## classical.9 — `content/lessons/classical.9.md`

Claims checked: 14. Findings: 2.

- [x] **FALSE** `content/lessons/classical.9.md:39` — "Six options, and they are all long"
  - Is: not the Étude Op. 10 No. 4: 83 bars at a printed 176, about two minutes by my count. The rest run from about four minutes up (La Campanella 150 bars; Fantaisie-impromptu 138; Heroic polonaise 181; Ballade No. 1 262; Marche funèbre 85 bars with repeats). My durations are a proxy: first printed tempo only, repeats not unrolled.
  - Evidence: catalog `notation.bars`; scratch reader of each built `.mxl` (total quarters over the first `<sound tempo>`).
  - Fixed: now "Six options, and all but the étude are long" — catalog: `chopin-etude-op10-4.nifc` 83 bars of 4/4 at `tempoBpm` 176, about two minutes by arithmetic (332 quarters / 176); the other five run 85-262 bars (Ballade 262 at 68, La campanella 150 in 6/8 at 97; three rows carry no `tempoBpm`). Durations are a proxy, repeats not unrolled; the Marche funèbre at 85 bars is "long" only by the auditor's estimate with repeats.
- [ ] **JUDGEMENT** `content/lessons/classical.9.md:13` — "ten minutes of music, several months of work"
  - Is: only the first Ballade is near ten minutes; the étude is about two. A musician should word it (the same fault as above, as a generalisation).
  - Evidence: as above.

Checked and true: "There is no rung above this one" (Stage 9 is the last stage file, and no rung in stages 0-9 lists `classical.9` as a prerequisite); "The Stage 8 habit" of sections out of order is in classical.8 (lines 38-40); "Six options" (six `songOptions`), each the piece named (Ballade No. 1, Heroic polonaise Op. 53, Fantaisie-impromptu, Étude Op. 10 No. 4 in C-sharp minor, Marche funèbre from Sonata No. 2 in B-flat minor, La Campanella by Liszt); the other ballades (Nos. 2, 3, 4, plus a second No. 4 edition), the scherzo (No. 2), the rest of the études and the sonata movements (Op. 35 movements 1, 2, 4; Op. 58 movement 4) are catalog rows with `tracks: ["classical"]`.

Not checked in this lesson: "A ballade is fifteen sections wearing a trench coat" (JUDGEMENT); "La campanella … purely about the hands" (JUDGEMENT); the practice advice (plain teaching). The rung's tool, *Play it blind*, is not described.

## jazz.9 — `content/lessons/jazz.9.md`

Claims checked: 17. Findings: 4.

- [x] **FALSE** `content/lessons/jazz.9.md:15` — "The same 32 bars each time"
  - Is: true of the kind of standard the lesson has in mind, not of most of the six options. By piece: *When the Saints* is a 9-bar copy of a 16-bar tune; *Take Five* is 25 bars in 5/4 (bars 2-17 repeated); *Linus and Lucy* is 111 bars, not a song form; *Lullaby of Birdland* is 26 bars with a repeat and endings; *Stardust* is 52 bars; *Ain't Misbehavin'* is 36. The tools paragraph repeats "the thirty-two bars" (line 46).
  - Evidence: catalog `notation.bars`; scratch `.mxl` reader for repeats and endings.
  - Fixed: now "The same form each time", and the tools paragraph's "the thirty-two bars" is now "the form" — catalog `notation.bars` of the six options re-read: Take Five 25, Ain't Misbehavin' 36, Lullaby of Birdland 26, Linus and Lucy 111, Stardust 52, When the Saints (jazz) 9.
- [x] **FALSE** `content/lessons/jazz.9.md:34` — "*Lullaby of Birdland* for a fast tune made of ii–V–Is"
  - Is: the ii-V-Is are there (Fm7-B♭7, B♭m7-E♭7, Gm7♭5-C7 and more among its 110 chord symbols). "Fast" is not: the copy is marked "Med-Swing" at 96.
  - Evidence: catalog `notation.chords`; the score's words and tempo at bar 1.
  - Fixed: now "*Lullaby of Birdland* for a medium-swing tune made of ii–V–Is" — the score's only words are "Med-Swing" (`dump_score.py` header) and catalog `tempoBpm` is 96.
- [x] **FALSE** `content/lessons/jazz.9.md:36` — "*Linus and Lucy* for a left-hand ostinato that never stops"
  - Is: the ostinato (A♭1-E♭2-A♭2 eighths) runs bars 1-24, 31-46, 64-77 and 95-98. It stops for chord stabs with rests (25-30), a bridge in dotted-quarter bass (47-63), a walking bass in quarters (78-94), an arpeggio (99-100) and the held ending (107-111).
  - Evidence: `dump_score.py song.jazz.vince-guaraldi-linus-and-lucy-fixed-piano-only.pdmx`, all 111 bars LH, filtered for bars that leave the eighth-note pattern.
  - Fixed: now "a left-hand ostinato that keeps coming back" — `dump_score.py song.jazz.vince-guaraldi-linus-and-lucy-fixed-piano-only.pdmx` LH re-read: the A♭1-E♭2-F2 figure at bar 24, octave stabs with rests in 25-30, a dotted-quarter bass at 47, quarter-note walking at 79.
- [x] **FALSE** `content/lessons/jazz.9.md:45` — "*Blind* takes the lead sheet away and changes nothing else about the run"
  - Is: nearly: the app still follows and marks the run (menu text, `ScoreScreen.ts:1100`). But *Rhythm only* is unavailable during a blind run (`ScoreScreen.ts:1473`, `2311`).
  - Evidence: the lines named.
  - Fixed: now "*Blind* takes the lead sheet away while the app still follows and marks the run" — the Blind row's own text (`ScoreScreen.ts:1100`); *Rhythm only* is hidden in a blind run (`ScoreScreen.ts:2312`), so "changes nothing else" is gone. The rung's other tool, the `jazz-comping` lab, is still not described.

Checked and true: the ear-tune drill gives eight bars and plays them back a phrase at a time (`drill.ear.tune-long`: `bars: 8`, `barsPerPhrase: 2`); `V7/vi` names the same chord function in every key and the secondary-dominant drill is on the rung (`drill.theory.roman-numerals-secondary`); "Six options" (six `songOptions`), each named piece among them; *Stardust* was on jazz.8 (`songOptions` of jazz.8); *Ain't Misbehavin'* has a stride left hand, bass then chord on every beat pair (bars 1-36); *Take Five* is in 5/4, and the technique track counted 5/4 (`exercise.meter.5-4` on technique.5); *Blind* is one of the rung's tools.

Not checked in this lesson: "Changing tune partway through restarts the clock" (figurative: I found no timer it could refer to, and did not search for one); "The second tune takes a fifth of the time the first one did" (JUDGEMENT); the rung's other tool, the `jazz-comping` lab, is not described.

## blues.9 — `content/lessons/blues.9.md`

Claims checked: 15. Findings: 1.

- [x] **WRONG-COUNT** `content/lessons/blues.9.md:12` — "This rung is the point of the other four."
  - Is: the blues track has six other rungs, blues.3 to blues.8 (stages 3-8), all in units with `track: "blues-boogie"`.
  - Evidence: a scan of every rung id starting `blues` across `content/curriculum/stage-0.json` … `stage-9.json`: blues.3, .4, .5, .6, .7, .8, .9.
  - Fixed: now "the point of the other six" — `"id": "blues.<n>"` across `stage-0.json` … `stage-9.json` returns rungs blues.3, .4, .5, .6, .7, .8 and .9 (plus unit ids blues.6.1-9.1).

Checked and true: twelve bars as four, four again, four answering (AAB, THEORY, right); the ear-tune drill on this rung takes eight bars back a phrase at a time (`drill.ear.tune-long`); *Listen back* is a drill-screen button shown when an improvisation was recorded (`DrillScreen.ts:262`, `2093-2098`), and the blues track's backing-track drills sit at Stages 4 and 5 (`drill.blues.lh-patterns` on blues.4 and blues.5, `drill.improv.blues-backing` on blues.5); "nothing here is required" (`songOptional: true`); *Stumbling* is by Zez Confrey and has a three-beat figure over 4/4 (bars 26-27: D-E, G-A, B-B repeating across the bar line; bars 30-31: A-A♭, G-F♯, E); *Black Bottom Stomp* is also on blues.8 ("the rung below"); *Handful of Keys* is by Fats Waller, swung, at a printed 240 with a stride left hand (bars 9-12 onward), and is the highest-levelled song on the whole blues track (8.73; the next is Black Bottom Stomp at 8.62); no eight-bar right-hand block in its 176 bars repeats exactly (my proxy for "never repeats a chorus"); *Jam it* judges and records nothing (`LabScreen.ts:24`, `420`), and the `blues-shuffle` preset fixes twelve bars (`locks` includes `bars`) with the tempo free.

Not checked in this lesson: the dates 1922, 1926 and 1929 (HISTORY; 1926 matches Black Bottom Stomp's edition note, the other two are not in the catalog rows I read); "never once losing the bar" and "If you can sing what you played, it was music" (JUDGEMENT, plain teaching). *Play it blind*, the rung's other tool, is not described.

## chords-pop.9 — `content/lessons/chords-pop.9.md`

Claims checked: 13. Findings: 5.

- [x] **FALSE** `content/lessons/chords-pop.9.md:31` — "play it as written once, then strip it back to its chord symbols and build your own"
  - Is: none of the six prints any chord symbols (`notation.chordCount` is 0 on every one), so the learner has to work the chords out from the notes. There are no symbols to strip back to.
  - Evidence: catalog `notation.chordCount` of the six `songOptions`.
  - Fixed: now "work its chords out from the notes (none of the six prints chord symbols) and build your own" — catalog `notation.chordCount` is 0 on all six `songOptions` of chords-pop.9, read one by one.
- [x] **FALSE** `content/lessons/chords-pop.9.md:34` — "*Rolling Girl* and *Apex of the World* are the fast ones"
  - Is: *Apex of the World* is the slowest of the six by printed tempo (86) and by notes per second (1.2 / 1.35). *Rolling Girl*'s 96 is a default, not printed (tag `tempo-defaulted`). The faster ones by printed tempo are *Mr. Blue Sky* (160) and *Le Festin* (150). Notes per second is my proxy; nothing has been heard.
  - Evidence: first `<sound tempo>` of each built `.mxl`; scratch onsets-per-second count; catalog `tags`.
  - Fixed: "the fast ones" moved to *Mr. Blue Sky* and *Le Festin*, "the fastest by their printed tempos"; *Rolling Girl* and *Apex of the World* now just "complete the six" — catalog `tempoBpm`: Mr. Blue Sky 160, Le Festin 150, Falling 110, Rolling Girl 96 (tag `tempo-defaulted`, so not printed), Apex 86, Piano Man 70. Printed tempo is the measure used; nothing has been heard.
- [ ] **JUDGEMENT** `content/lessons/chords-pop.9.md:32` — "*Piano Man* and *Falling* are ballads where the left hand decides everything"
  - Is: both are the slowest in left-hand notes per second (0.97 and 1.05); whether the left hand "decides everything" is for a musician.
  - Evidence: scratch onsets-per-second count.
- [ ] **JUDGEMENT** `content/lessons/chords-pop.9.md:20` — "The oldest arranging trick there is"
  - Is: a historical generalisation for a musician.
  - Evidence: none possible.
- [x] **FALSE** `content/lessons/chords-pop.9.md:44` — "Put the chart in the lab, start it, and try three different left hands over the same sixteen bars"
  - Is: the rung's lab button opens the `ballad` preset, which locks `progression`, `leftHand` and `rightHand` (`sightReading.ts:868-879`). A chart cannot be typed in (the progression picker is disabled) and the left hand cannot be changed (`LabScreen.ts:584-601`). Only key, bars and tempo are free.
  - Evidence: the lines named; chords-pop.9 `tools` in `stage-9.json`.
  - Fixed: now "This rung's lab button opens a ballad whose chords and left hand are fixed, so type the chart into the lab opened from the Library instead" — chords-pop.9 lab preset `ballad` locks progression, leftHand, rightHand (`sightReading.ts:869-879`); the Library's lab button opens with no preset (`LibraryScreen.ts:578`); a typed chart offers 4, 8 or 16 bars (`LabScreen.ts:487-488`). Pointing the rung at an unlocked preset is the owner's decision. `readingTime` raised to 3 (406 words).

Checked and true: the eight-bar ear drill is on the rung (`drill.ear.tune-long`); "Six options" (six `songOptions`), each the song named; *Mr. Blue Sky* and *Le Festin* are busy in both hands (2.39 / 2.34 and 2.9 / 2.34 notes a second); all six carry `personal-build`, so the strict build shows placeholders with an import hint, and the rung is complete on exercises (`songOptional: true`); nothing is judged or kept in a jam (`LabScreen.ts:24`, `420`).

Not checked in this lesson: the four arranging decisions and "Most arrangements get better when something comes out" (plain teaching); *Play it blind*, the rung's other tool, is not described.

## theory.9 — `content/lessons/theory.9.md`

Claims checked: 8. Findings: 0.

Checked and true: "The last theory rung" (theory.9 is on Stage 9, the last stage file, and no rung lists it as a prerequisite; the same prerequisite scan as for classical.9); the rung takes eight bars down a phrase at a time (`drill.ear.tune-long`: `bars: 8`, `barsPerPhrase: 2`) and has harmonic dictation for the harmony half (`drill.theory.harmonic-dictation-modulation`); the level-7 sight-reading generator is on the rung (`drill.reading.sight-reading-7`) and its spec allows up to four accidentals (`maxFifths: 4`), triplets and a walking left hand (`sightReading.ts:226-240`); it generates from a seed, so each page is new ("unseen by construction"); "Repertoire … Whatever you took down" (no `songOptions`, `songOptional: true`).

Not checked in this lesson: "Almost all short music is built this way" (JUDGEMENT, plain teaching); "four accidentals" reads as always four, where the spec says at most four; I have not listed it. The generator writes eight bars (`bars: 8`), while the practice line says four bars a day; that is advice, not a claim about the drill. The rung's tool, Simon, is not described.

## improv.9 — `content/lessons/improv.9.md`

Claims checked: 5. Findings: 0.

Checked and true: ABA as A, a contrasting B and A's return (THEORY, right, plain teaching); "That is what the ear drill has been training" (the eight-bar phrase-by-phrase ear drill is on this rung, `drill.ear.tune-long`, and on jazz.9, blues.9, chords-pop.9 and theory.9); "Repertoire for this rung. Your piece." (no `songOptions`, `songOptional: true`); the rung's only tool is Free play (`tools: [{"kind":"play"}]`), which the lesson does not describe and which records nothing (`FreePlayScreen.ts:8`).

Not checked in this lesson: "Two or three minutes" and the practice advice (plain teaching); "The second piece is not better than the first one finished" (JUDGEMENT, plain teaching).

Pattern for the fixer, across this batch: most "Tools for this rung" paragraphs describe something other than the rung's `tools`. Some name a Score-screen setting (Rhythm only, Ladder, loops), which are whole bars only. Others type numerals or change hands in a lab preset that locks those very controls (blues.8, chords-pop.8, improv.8, chords-pop.9); others name a lab on a rung with no lab button (jazz.7, theory.7). technique.7 names Duet on a rung with no tools. Checking each lesson's paragraph against its rung's `tools` and the preset's `locks` would catch the class.

---
Batch 5: 22 of 22 lessons. 72 findings
(44 FALSE, 2 STALE, 3 WRONG-COUNT, 0 UNOFFERED, 3 THEORY, 13 JUDGEMENT, 7 UNVERIFIED).
Lessons not finished: none.

Fix pass: 49 fixed, 0 found wrong and not fixed, 23 left open (THEORY/JUDGEMENT/HISTORY/UNVERIFIED or needs a build). Lessons edited: ragtime.7, technique.7, jazz.7, blues.7, chords-pop.7, theory.7, rock.7, classical.8, ragtime.8, technique.8, blues.8, chords-pop.8, improv.8, classical.9, jazz.9, blues.9, chords-pop.9.
