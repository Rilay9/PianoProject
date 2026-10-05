# jazz: curriculum review record (2026-10-05)

## 0. Scope and denominator

Units reviewed: 7/7 for this track, from `content/curriculum/stage-3.json` to `stage-9.json`: `jazz.3.1`, `jazz.4.1`, `jazz.5.1`, `jazz.6.1`, `jazz.7.1`, `jazz.8.1`, `jazz.9.1` (one lesson each: `jazz.3` to `jazz.9`).

Lesson files read in full: `content/lessons/jazz.3.md`, `jazz.4.md`, `jazz.5.md`, `jazz.6.md`, `jazz.7.md`, `jazz.8.md`, `jazz.9.md`. Also read in full for ownership questions: `improv.6.md`, `improv.8.md`, `latin.3.md`, `latin.md` (lines 1-50), `chords-pop.9.md`, `theory.7.md`; `jam.6.md` and `jam.7.md` read in part (walking bass, tags).

Also read: `docs/02-curriculum.md` D4 (lines 530-551), `docs/generated/ladder.md` Jazz table (lines 191-203), `docs/genre-plans/jazz.md` (all), the 32 `jazz.*` rows of `Curriculum_425_Placement_Audit.csv` (count taken by `cut -d, -f2 | grep -c '^jazz\.'`), the `jazz.*` sections of `Fable_Curriculum_Interpretation_Audit.md` (lines 272-760), packet sections 0, 5, 6, 7, 8, 10, 16, 17, 18, 21 (10 only by its heading; the audit counts were taken from the CSV), dossier sections 1, 2 and TRACK 7. Generator facts from `tools/content/generate_exercises.py` (rootless table lines 3383-3390, stride lines 4268-4305, walking bass lines 4005-4080) and `content/catalog.static.json` drill entries.

HEAD note: the repository is at `a42c1a15`, one commit after the brief's `96a5b09b`; `git diff --stat 96a5b09b HEAD` over the seven jazz lesson files and `content/curriculum/` printed nothing, so the lesson and unit text below is the same at both.

Scores reopened (MusicXML or dump from `origin/claude/readable-scores`): `song.classical.i-got-rythm.pdmx` (dump bars 1-28), `song.jazz.bart-howard-fly-me-to-the-moon.pdmx` (chord symbols by bar), `song.jazz.the-dave-brubeck-quartet-take-five.pdmx` (chord symbols by bar). Dump header counts only (chord-symbol count, bars): Stardust, Ain't Misbehavin', Lullaby of Birdland, Linus and Lucy, Saints (jazz), Avalon.

External sources consulted:
- Berklee Online, Jazz Piano (12-week outline): https://online.berklee.edu/courses/jazz-piano
- ABRSM Jazz Piano (grades 1-5 syllabus; improvisation from Grade 1, aural and quick-study with improvisation): https://www.abrsm.org/en-gb/instruments/jazz/jazz-piano and https://www.abrsm.org/sites/default/files/2023-12/jazz-piano-syllabus-grades-1-5.pdf (the PDF itself was not opened; the claim comes from the search summary of the first page)
- Jazz Piano Online, jazz theory and composition (major and minor ii-V-I both listed): https://www.jazzpianoonline.com/pages/jazz-theory-composition
- Tritone substitution: https://en.wikipedia.org/wiki/Chord_substitution (shared third and seventh; chromatic bass motion)
- Rootless voicings A (3-5-7-9) and B (7-9-3-5), 13th for the 5th on dominants: https://piano.org/theory/rootless-voicings/ and https://jazzedge.academy/how-to-play-rootless-voicings-like-bill-evans/ (summary level; Levine's own text was not readable: https://www.jazzbooks.com/mm5/samples/D-JP.pdf returned binary)
- Walking-bass approach notes from a half step above or below: https://www.freejazzlessons.com/walking-bass-line/ and https://www.pianogroove.com/jazz-piano-lessons/walking-bass-line-tutorial/ (search summaries, pages not opened in full)

These are evidence of coverage, not a crosswalk.

## 1. Promised endpoint

Track description (D4 heading and table, `docs/02-curriculum.md:530-551`): a jazz track from Stage 3 whose repertoire column wants swing 8ths, 7th chords, shells, ii-V-I, rootless A/B, guide-tone lines, walking bass, bebop scales, enclosures, tritone subs, ballad block chords, stride, upper-structure triads, quartal voicings, reharmonisation, solo piano arranging, Latin jazz (bossa/clave), transcription, modern voicings and odd meters. The last rung's own words (`jazz.9.md:11`): "Everything on this track has been a piece of a tune. This rung is the tune." Its unit title is "playing a standard without the page" (`stage-9.json`, `jazz.9.1`); its lesson title is "Comping, walking and soloing on one tune"; its finder skill is "comping, walking and soloing on the same tune in one sitting" (`stage-9.json`).

A competent developing jazz pianist (Berklee Jazz Piano outline, ABRSM Jazz Piano): comps and voices standards, plays bass lines, plays a melody with swing, improvises over the changes with chord tones and approach notes, handles major and minor ii-V-I, has a bossa or Latin-jazz setting, learns and memorises a standard, arranges it for solo piano with an intro and an ending.

Reasonable PianoProject endpoint: one standard that the learner can comp, walk, play as a solo-piano arrangement and improvise a chorus on, from memory, in a second key, with a way in and a way out. The track as built reaches a narrower endpoint: voicing and accompaniment vocabulary (shells, rootless, quartal, tritone sub, extensions) plus a capstone that re-plays one tune in four accompaniment textures. Improvisation, minor harmony, arranging and the integrated standard are carried only partly, by other tracks (see sections 2 and 3). The track is intentionally narrower than "jazz piano" in the sense that D4 allots those items to Stages 7-9 and the lessons did not carry them; the lesson text does not say they are out of scope, so this is a gap rather than a declared boundary.

## 2. Current coverage

Format: ability, where taught (file:line), then stations. A station is only named when something in the files supplies it.

| ability | taught at | CONTROL | MODEL/TRANSFER | MUSIC | INDEPENDENCE |
| --- | --- | --- | --- | --- | --- |
| Swing eighths | `jazz.3.md:12-19`; `jazz.4.md:12-18`; `jazz.5.md:14-21` | `exercise.swing-pair.c/f/g`, `exercise.rhythm.shuffle-eighths.4bar` (`stage-3.json`, `stage-4.json`); Rhythm-only tool (`jazz.3.md:53-55`) | four pre-1930 single-stave tunes (`jazz.3.md:44-49`) | tune swung twice (`jazz.3.md:62-64`) | none; the app judges swing only where the score writes the word (`jazz.5.md:59`), so ear-only |
| Triad comping from symbols | `jazz.4.md:20-34` | three comping exercises in F | Avalon, Whispering, Margie as lead-sheet substrate (`jazz.4.md:40-45`; CSV rows `LEAD_SHEET_SUBSTRATE`) | tune RH and comp LH (`jazz.4.md:44-45`, lab tool) | trading fours in lab (`jazz.4.md:52-58`), ungraded |
| Shells and major ii-V-I, guide-tone resolution | `jazz.5.md:22-41` (falling half steps stated correctly: C to B, F to E) | `drill.jazz.ii-v-i-shells` (C, F, B flat, G), `exercise.ii-v-i.c.shells` | four lead sheets (`jazz.5.md:43-52`) | "one standard comped through twice" (`jazz.5.md:67`) | none |
| Comping rhythms, walking bass | `jazz.6.md:14-26` | `exercise.comping.c.charleston`, `exercise.walking-bass.c.blues`, `exercise.walking-bass.f.ii-v-i` | six chord-symbol tunes (`jazz.6.md:37-47`); duet tool on Bye Bye Blackbird (`jazz.6.md:60-66`) | blues "comped in one pattern with a walking line" (`jazz.6.md:68-69`) | none |
| Hearing changes | `jazz.6.md:28-32`; `jazz.8.md:23-28` | `drill.theory.harmonic-dictation`, `...-modulation` | none | none | none |
| Rootless A/B, quartal, tritone sub, stride, rhythm changes | `jazz.7.md:16-34`, `jazz.7.md:47-54` | `exercise.voicing7.c.rootless-a`, `...f.rootless-b`, `exercise.open-voicing.c.quartal`, `exercise.tritone-sub.c`, `exercise.stride.c` | Avalon, Tiger Rag, Fly Me to the Moon, I Got Rhythm; jazz Jingle Bells and Skating as "when somebody has already done the work" (`jazz.7.md:43-46`) | "one chorus where you substitute every dominant" (`jazz.7.md:65-66`) | none |
| Extensions 9/11/13, modulation | `jazz.8.md:11-28` | `drill.jazz.extended-chords-13` (roots C, E flat, F, B flat) | Stardust, I Got Rhythm, Uncle Ben's Cakewalk | tools line (`jazz.8.md:38-46`) | none |
| One tune in four ways, ear learning, numerals | `jazz.9.md:14-30`; tools `jazz.9.md:42-52` | `drill.ear.tune-long`, `drill.theory.roman-numerals-secondary`, comping, walking and stride exercises in E flat and B flat | six options, "pick one and stay with it" (`jazz.9.md:32-38`) | the blind-play run | "start the tune in a key you have not practised it in" (`jazz.9.md:54-55`), unscored |

Lead sheets are the right substrate for `jazz.4` to `jazz.8` by the interpretation audit (`Fable_Curriculum_Interpretation_Audit.md:333-760`); not repeated.

## 3. Missing or weak abilities

Scope for every absence in this section: the seven `jazz.*.md` files read in full, plus this grep over `content/lessons/` (all lesson files): `minor ii|ii°|iiø|m7♭5|m7b5|ii.V.i|altered|melodic minor|bossa|approach|enclosure|bebop|chord.tone|tag|intro|ending|drop-2|transcri|memoris|lead sheet`, and a second grep of the jazz files for `solo|improvis|listen|record`. The grep output was read in full, not cut.

1. **Minor ii-V-i and melodic-minor material: not taught in the jazz track.** `jazz.5.md:32-41` teaches ii-V-I in major only, in "C, F, B flat and G" (`drill.jazz.ii-v-i-shells` params, `catalog.static.json`); `jazz.7.md` and `jazz.8.md` stay with ii-V-I and dominants. In the lessons, `theory.5.md:18` names the half-diminished chord and `theory.7.md:33` lists locrian for it; `4.2.md:31-36` teaches melodic minor as a scale; `improv.6.md` mentions a "minor vamp" in the lab (`improv.6.md:37`). No lesson joins these into ii-half-diminished, V7, i. The generator has half-diminished shapes (`generate_exercises.py:1449`, `:6094`) but no minor ii-V-i form (`generate_exercises.py` grep for `ii-V-i` returns only the major `ii-V-I` strings at lines 3801, 3974, 4035, 4481). The shipped repertoire carries the progression untaught: Fly Me to the Moon, a jazz.7 option, is a chain that ends in the minor ii-V-i (Bm7b5, E7, Am7) in its standard form, and `Insensatez` (a `latin` rung option, `stage-5.json`) is a Jobim tune built on minor ii-Vs; these two tune descriptions rest on the tunes' standard published forms, not on the shipped files, whose chord symbols are sparse (Fly Me to the Moon: 20 symbols in 22 bars, at bars 1, 3, 4, 8, 11, 13, 17, 22 per my parse). Evidence of coverage: Berklee Jazz Piano week 8 (minor key harmony: relative, harmonic and jazz melodic minor); Jazz Piano Online lists major and minor ii-V-I together. Severity: **foundational bridge**. D4 stage 6 listed "guide-tone lines" and the dossier asks for "introduce minor ii-V" at jazz.6.

2. **Soloing is promised, then never taught in the jazz track (chord-tone then approach-note line building as a progression).** `jazz.9` carries "soloing" in its lesson title and finder skill; the body (`jazz.9.md:11-55`) has comping, walking, stride and "play the melody with your own harmony" and nothing on improvising a chorus (the word "improvis" appears in no jazz lesson body; grep above). The pieces that exist sit in other tracks: guide tones through a ii-V-I with the lab handing the changes back (`improv.6.md:15-21`, `:29-30`), "each note is either a chord tone or a step from one" (`improv.3.md:18`), reharmonisation (`improv.8.md`). No lesson anywhere teaches approach-note or enclosure line construction on a soloing line: `approach` hits are the walking-bass approach note (`jazz.6.md:23`, `jam.6.md:23-26`) and approach chords (`improv.8.md:19-21`), neither a melodic line. Bebop scales and enclosures were in D4 stage 7 and are in no lesson. The jazz track has no prerequisite on `improv.6`; `jazz.9` prerequisites are `['jazz.8']` (`stage-9.json`). Evidence of coverage: Berklee weeks 9 (chord-tone soloing) and 10 (approach notes); ABRSM Jazz Piano requires improvisation from Grade 1 and in the aural and quick-study tests. Severity: **foundational bridge** (the promised capstone skill has no development).

3. **Learning and memorising a standard as a taught process: weak.** What exists: an ear-tune drill (`jazz.9.md:19-22`), numerals as memory (`jazz.9.md:23-27`), the blind tool (`jazz.9.md:42-47`), "stay with one tune" (`jazz.9.md:32-38`). What does not: form-before-memory, naming the sections and landmark chords, starting from several points, cold starts. The drill `drill.ear.tune-long` is a generated eight-bar tune in G at 92 bpm (`catalog.static.json`: `keys: ["G"]`, `bars: 8`, `barsPerPhrase: 2`), not the learner's chosen standard, so "That is how a standard is actually learned" (`jazz.9.md:21-22`) describes the process and the drill rehearses it on something else. Other tracks do teach memory structure (`4.7`, `ragtime.9.md:18-25`) but jazz does not point to them. Evidence of coverage: Berklee week 9 (practice techniques for mastering repertoire, learning tunes efficiently, memorising); packet section 7C. Severity: **depth**.

4. **Intros, endings and tags: absent from the jazz track.** Scope above; `intro|ending|tag` hits in lessons are in `chords-pop.9.md:20` (use the last eight bars for an intro), `jam.7.md:28` (read the chart's tag), `improv.9.md:19`, `holiday.3.md:34` and `holiday.6.md:58`. None is in `jazz.*`. Evidence of coverage: Berklee weeks 11-12 (introductions, endings, tags). Severity: **depth**; the chords-pop.9 line is the likeliest bridge.

5. **Solo-piano arranging (harmonised melody, drop-2 or comparable): one sentence.** `jazz.9.md:15-16` says "Then play the melody with your own harmony underneath", with no technique. No lesson in `content/lessons/` contains `drop-2`, `drop 2`, `block chord` or `locked hands` in a jazz sense (grep above; `chords-pop.9.md:13-17` teaches four arranging decisions for pop charts, not jazz). D4 stage 7 wanted "ballad playing with block chords" and stage 8 "solo piano arranging" and "upper-structure triads"; none of these three is in a jazz lesson (`jazz.8` is extensions only). Evidence of coverage: Berklee weeks 11-12 (solo piano arranging with drop-2 voicings). Severity: **foundational bridge** for the endpoint in section 1 (jazz.9 cannot be an arrangement capstone without it), **depth** otherwise.

6. **Bossa in a jazz context: owned by no jazz lesson and only gestured at by latin.** Lessons scope: `bossa` appears in `latin.md:40-41` and `latin.3.md:40` only, as repertoire description ("where the syncopation goes quiet and the chords do the work"). The `latin.3` options include `exercise.clave.bossa` (`stage-3.json:1116`) and the `latin` rung's concepts include `bossa-nova` (`stage-5.json:686`), but neither lesson body teaches a bossa pattern or its harmony. So the latin track nominally owns bossa (D8 latin part, `concepts.json` id `bossa-nova`) and teaches an Afro-Cuban clave, tumbao and montuno instead; the jazz track states nothing. Evidence of coverage: Berklee week 7 (bossa fundamentals); D4 stage 8 "Latin jazz (bossa/clave)". Severity: **depth** for jazz; to be settled with the latin record. Which track owns it: latin, by the concept id, and by the repertoire it lists.

7. **Historical listening and transcription: none in the lessons.** Each jazz lesson carries one video link in front matter; no lesson asks the learner to listen to a named recording, transcribe a solo or comp, or identify a style by ear (grep `listen|record` in jazz files above: the only hits are "listen to the join" in `jazz.3.md:20` and "listen to which one you meant" in `jazz.8.md:20`, neither a recording). D4 stage 9 lists "transcription". Berklee week 1 covers jazz history. Severity: **enrichment**. Listening cannot be verified by anyone in this process (see section 7).

8. **One tune across melody, comping, bass, improvisation and solo arrangement: partial.** `jazz.9.md:14-18` gives comp, walk, stride, own-harmony melody on the same form, plus a transposed pass. Improvisation and a defined arrangement are missing (items 2 and 5), and the options do not all support the four passes (section 6). So jazz.9 is closer to three or four techniques on one tune than to an integrated capstone. This is the dossier's own test ("a genuinely integrated capstone rather than three techniques on one tune", TRACK 7 recommendation for jazz.9). Severity: **foundational bridge**, derived from items 2, 4 and 5.

Also noted, smaller: no jazz blues track connection in the jazz lessons beyond a walking line over the blues (`jazz.6.md:34-35`); the shipped blues track carries it.

## 4. Sequencing concerns

1. **Exercises listed on rungs whose lesson does not teach them.** `jazz.6` lists `exercise.ii-v-i.c.rootless` (`stage-6.json`) while rootless voicings are taught at `jazz.7.md:16-21`; `jazz.6`'s own finder says "avoid ... rootless voicings without a bass" (`stage-6.json`). D4 put rootless at stage 6 (`docs/02-curriculum.md:539`); the lesson moved it to 7, the exercise did not. `jazz.7` lists `drill.jazz.chord-scale` and `jazz.8` lists `drill.theory.modes-all` and `drill.reading.sight-reading-7`; none of the three topics (chord-scale, modes, sight-reading) is explained in `jazz.7.md` or `jazz.8.md` (grep for `chord.scale|mode|dorian|mixolydian` in jazz files returns nothing). The chord-scale explanation is `theory.7.md:30-39`, which says the drill marks only the scale it named. A learner meeting the chord-scale drill from jazz.7 gets no pointer to that. Severity: low; a lesson-to-drill link problem, not a missing ability.

2. **The track skips the minor ii-V and the improvisation steps between jazz.6 and jazz.9** (section 3, items 1 and 2). The jump from jazz.8 (extension voicings, `jazz.8.md`) to jazz.9 (a whole tune in four textures plus soloing) rests on nothing that develops a solo, a way in or a way out.

3. **Late arrival of the harmonic frame for the capstone repertoire.** `jazz.9` options include three tunes with no chord symbols (section 6), yet "Comp it" is the first of four instructions (`jazz.9.md:14`) and "a tune you know as chord symbols" is the premise of the memory paragraph (`jazz.9.md:23-27`). `jazz.8.md:34-37` states the Stardust problem ("printed here with no chord symbols, so where its harmony goes is yours to hear") and nothing in jazz.8 or jazz.9 teaches how a learner finds a harmony from a written arrangement. `chords-pop.9.md:30` gives the move ("work its chords out from the notes"); jazz does not reference it.

4. **Rhythm-changes section placed on the rootless rung (`jazz.7.md:47-54`) while the changes are not printed** in the shipped I Got Rhythm (see section 6): a topic list rather than a development, but not a prerequisite break.

5. Ordering of the first five rungs is a defensible development: feel (3), triad comping (4), shells and ii-V-I (5), walking and comping rhythm (6), voicing alternatives (7), extensions (8). `jazz.5` states its prerequisite correctly: "Jazz needs the chord vocabulary from the Chords & pop track at Stage 5 first" (`jazz.5.md:12`), and `chords-pop.5.md:11-17` teaches the three sevenths.

## 5. Correctness concerns

Older audit findings checked: the interpretation audit's jazz sections (lines 272-760) and the brief's example of fixed text (`theory.7` chord-scale wording) were checked against the current files. `theory.7.md:30-39` now states the chord-scale approach as a choice, "not a law of harmony", so no defect remains there. `jazz.5.md:59` and `jazz.3.md:56-60` already say what the app can and cannot judge about swing. The Fable-era finding that jazz.4 and jazz.5 lack written chord-symbol-free comping scores is closed by the demonstrate-versus-apply rule (`Fable_Curriculum_Interpretation_Audit.md:333-500`). No stale defects reported below.

Statements correct against sources (checked, no change needed):
- Tritone substitution: G7 and D♭7 share B and F (D♭7's C♭ spelled as B) (`jazz.7.md:25-28`); the sourced fact matches https://en.wikipedia.org/wiki/Chord_substitution. Bass moves down a semitone rather than a fourth (same source).
- Guide-tone resolution in Dm7-G7-Cmaj7 (C to B, F to E) (`jazz.5.md:32-37`).
- Rhythm changes: A sections I-vi-ii-V, bridge D7-G7-C7-F7 two bars each (`jazz.7.md:47-54`); bridge confirmed in the shipped score bars 12, 14, 16, 18 (`song.classical.i-got-rythm.pdmx`: LH D, G, C, F roots with 7ths, per the dump), though the score is a 28-bar written arrangement with no chord symbols (see section 6).
- Rootless A is 3-5-7-9 and B is 7-9-3-5 (`jazz.7.md:16-20`; generator table `generate_exercises.py:3389-3390`; https://piano.org/theory/rootless-voicings/).
- Quartal stack D-G-C-F as "a D minor eleventh" (`jazz.7.md:22-23`) is a defensible reading (Dm11 without the fifth and ninth).
- Margie's Fdim and F7+ spellings (`jazz.4.md:30-32`).

Concerns, each with file:line:

1. **Walking-bass approach note stated as one fixed rule.** `jazz.6.md:22-23`: "the fourth one is the trick: a semitone below the next bar's root. Root, third, fifth, approach." The generator does it that way every time (`generate_exercises.py:4076` `-m2`). Published walking-bass sources give a half step above or below (https://www.freejazzlessons.com/walking-bass-line/, search summary). Inside this repo `jam.6.md:23-26` says "one step above or below the new root", so the two tracks disagree. A recipe presented as the trick, not as one of two choices and one beginner default. Severity: heuristic stated as a law; wording change only.

2. **Rootless voicing on a dominant.** `jazz.7.md:16-20` gives the fixed shape as third, fifth, seventh, ninth for all chords. Sources describe the 13th replacing the 5th on dominants for the same voicing (https://piano.org/theory/rootless-voicings/, https://jazzedge.academy/how-to-play-rootless-voicings-like-bill-evans/); the app's dominants use 3-5-b7-9 (`generate_exercises.py:3389`), which is a valid rootless G9 but not the common one. Not wrong; incomplete, and `jazz.8.md` later builds thirteenths without linking back. Severity: low.

3. **"exactly as well".** `jazz.7.md:27`: "D♭7 resolves to C exactly as well as G7 does". Shared third and seventh and a chromatic bass motion make it work; "exactly" is too strong (the melody note and the voice leading of the upper structure change). Severity: low, overclaim.

4. **Stride sentence is confusing at best.** `jazz.7.md:32-34`: "bass, chord, tenth, chord, the tenth being the chord's own bottom note again and not a bass note". The exercise (`generate_exercises.py:4268-4305`) plays the third, one octave above the bass, as a single note on beat 3 (a tenth above the root). "Not a bass note" and "the chord's own bottom note" are both misleading: it is a bass-register note, and stride players more often play the root on beats 1 and 3 or a tenth, an interval, not "the chord's bottom note". Also "Beat one is the leap you will miss" is an unsupported claim about learners. Severity: medium for a taught fact that a learner would act on; the fix is a one-sentence rewrite.

5. **Eleventh and thirteenth wording.** `jazz.8.md:11-20` says a thirteenth chord is "a seventh chord with the ninth and the thirteenth added" and teaches "all six notes", then says "Play C13 with and without the eleventh". By convention a dominant 13th does not include the natural 11th (it clashes with the third, as the lesson itself explains at lines 17-20), so "with the eleventh" describes a different chord. The claim "That is why sharp elevenths exist and why the sus chords do too" is a causal story for two separate conventions. Severity: low; internal inconsistency within one paragraph, no source needed beyond the lesson's own explanation.

6. **"Play the triad" for C7 and B♭m6 (`jazz.4.md:28-32`)** is stated as the learner's instruction at this rung ("C7 is a C chord"), and the next rung's shells are explicitly the repair (`jazz.4.md:32-33`). It is a labelled simplification, not a defect.

7. The Fly Me to the Moon description. `jazz.7.md:42` calls it "a chain of ii-V-Is and the place to put the rootless voicings"; the shipped score's chord symbols at bars 1, 3, 4, 8 read Am7, D♭9, CMaj9 and F♯7 (my parse of `song.jazz.bart-howard-fly-me-to-the-moon.pdmx`, edition-specific), i.e. a tritone-substituted setting with no ii-V-I printed in the symbols that exist. Whether the learner can reconstruct it depends on the notes; I read only the symbols. Edition-specific: this says nothing about another edition of the tune. Severity: low, unverified beyond the symbols.

No wrong note names or false "teaches X" statements found in the seven lessons beyond the items above, within the files read. Nothing in them is unsafe.

## 6. Practice and material sufficiency

**Controlled practice.** Rungs 3-6 have 4-7 exercises each and a progressive path from feel to comping to shells to walking. Rung 7 has seven (rootless A in C, rootless B in F, quartal, tritone sub, stride, chord-scale, extended chords). Rung 8's options include one extended-chord drill (roots C, E flat, F, B flat) and a modulating dictation drill. Rung 9's exercises are five and cover numerals, ear-tune, comping, walking and stride in E flat and B flat (`stage-9.json`). Rungs 6-9 are `songOptional` (`ladder.md:200-203`), so exercises carry the rung's completion; the unit's `requirements` list `runs from exercises count 1` for 6-9 (stage files). That makes completion rest on one exercise run, which says nothing about the capstone behaviours (comp, walk, solo, arrange).

**Revisited?** Shells (rung 5) come back in `jazz.6` exercise `exercise.voicing7.c.shell`, rootless returns in `jazz.8` (`exercise.voicing7.e-flat.rootless-b`, `exercise.tritone-sub.e-flat`), stride and walking return in `jazz.9` in new keys. Good revisiting for voicing material. Not revisited: swing eighths after rung 5 (only stated), any improvisation, minor harmony, extensions in a tune.

**Transfer / project vs primary material (425 CSV, the 32 `jazz.*` rows).**
- `jazz.3` rows 1-4: `PRIMARY_OR_TRANSFER`, `KEEP` (Swing Low, Bye Bye Blackbird, Alexander's Ragtime Band, Ole Miss). Consistent with the lesson's contract.
- `jazz.4` rows: Avalon, Whispering, Margie `LEAD_SHEET_SUBSTRATE`, `KEEP`.
- `jazz.5` rows: Bill Bailey, Some of These Days, After You've Gone, Limehouse Blues `LEAD_SHEET_SUBSTRATE`.
- `jazz.6` rows: six lead sheets `LEAD_SHEET_SUBSTRATE`.
- `jazz.7` rows: Jingle Bells (jazz piano) `STRETCH`; Skating and Fly Me to the Moon `ADVANCED_TRANSFER` ("roots remain in LH, not literal rootless acquisition"); Avalon, Tiger Rag, I Got Rhythm `PRIMARY_OR_TRANSFER`. The rung is acquisition of rootless voicings, and the CSV says none of its pieces prints a rootless voicing as a clean primary; the exercises are the acquisition and the lesson says the repertoire is for substitution and "when somebody has already done the work" (`jazz.7.md:40-46`). This is consistent with the apply rule; I have no objection beyond noting the exercises carry the whole acquisition load.
- `jazz.8` rows: Uncle Ben's Cakewalk `STRETCH_MODULATION`; Stardust and I Got Rhythm `ADVANCED_HARMONY_TRANSFER`.
- `jazz.9` rows: six `PROJECT_SUBSTRATE` placements. The interpretation audit judged this by authenticity, which is the right standard for a project rung (brief rule).

**Material sufficiency for the capstone (new finding, from the dump headers).** `jazz.9.md:14-18` asks the learner to comp, walk and stride one standard, and calls "a tune you know as chord symbols" the working premise. Chord-symbol counts in the dumps for the six options: Take Five 49 (25 bars), Lullaby of Birdland 110 (26 bars), Linus and Lucy 52 (111 bars); Stardust 0, Ain't Misbehavin' 0, Saints (jazz) 0. For three of the six, comping and walking "from the chart" has no chart; the learner must derive the harmony from a written piano arrangement, a skill the jazz lessons do not teach (section 4, item 3). Two of the options with symbols are short forms (Take Five 25 bars; its chords are an Ebm7 and Bbm7 vamp for bars 1-9 and 18-25 with a bridge at bars 10-17 per my parse), so "stay inside the form" has little form in it to be inside. Take Five is the tune the blind tool opens (`jazz.9.md:45-46`). I did not open Ain't Misbehavin' or Linus and Lucy bar by bar; the symbol counts are header counts only.

I Got Rhythm (`song.classical.i-got-rythm.pdmx`): 28 bars, one stave pair, 0 chord symbols, a written chordal arrangement, not a lead sheet. Offered on jazz.7 and jazz.8 as the place for rootless voicings, substitution and thirteenths (`jazz.7.md:43`, `jazz.8.md:34-37`); the lesson's own description of rhythm changes (`jazz.7.md:47-54`) supplies the changes the file lacks. Edition-specific: this note is about this file only. Verified at bars 11-18: the bridge dominants D7, G7, C7, F7 appear in the left hand.

**Thin generated families noticed (record only).** Extended-chord drills use 4-5 roots (`catalog.static.json`); `drill.ear.tune-long` has one key; the ii-V-I shell drill has four keys and one form; no minor family exists (section 3, item 1).

## 7. Measurement limits

- Verifiable from MIDI: timing of each written note, chord tones in the bar (the lab's "how many of your notes were chord tones", `jazz.4.md:50-52`, `jazz.8.md:42-45`, `jazz.9.md:50-52`), whether a chord was held together, run completion in the blind and perform tools, whether a dictation answer matches.
- Not verifiable by the app, and said so in the lessons: swing placing (`jazz.5.md:59`: judged "only where the score writes the word", none of rung 5's pieces does), accents, comping rhythm quality ("the 'ands' sound lazy rather than hurried", `jazz.4.md:65`), quality of a walking line, the sound of a tritone substitution, whether a solo "sounds like it knows the tune".
- Self-checked outcomes in the "How you'll know you've got it" lines: most of them are self-reports (`jazz.3.md:62-64`, `jazz.4.md:63-65`, `jazz.9.md:54-55`).
- No actor in this process hears music. Musical quality of swing, voicing choices, substitutions and any improvised line is therefore unverified as music. Section 8 does not propose listening.
- What a notation reading can settle, and has: chord spelling, interval statements, shared notes of a tritone substitution, the shape of a rhythm-changes bridge, chord-symbol presence and counts in the shipped scores.
- The app cannot score an improvised chorus for style or approach-note use; it can count chord tones. Any soloing development must be stated as self-checked or chord-tone-counted.

## 8. Recommended changes

Ranked. None is made here. The first three are scoped-out gaps or new units; the rest are fixes.

1. **Add a minor ii-V-i step** (learner problem: Fly Me to the Moon, Insensatez and any minor-key standard contain a progression the track never names). Smallest change: a section in `jazz.6.md` or a short new rung between 6 and 7 teaching ii half-diminished, V7, i in two or three keys with shells, tied back to `theory.5.md:18`, `theory.7.md:33` and `4.2.md:31-36`; a minor-form option for `drill.jazz.ii-v-i-shells` is a generator question for the owner of that family, not this record. Evidence: Berklee week 8, Jazz Piano Online. New unit or lesson section; deletes nothing. Class: scoped-out gap (foundational bridge).

2. **Give "soloing" in `jazz.9` a development, or take the word out of its title and finder.** Learner problem: the capstone promises soloing and has no instruction. Smallest change: point `jazz.9` at `improv.6` (guide tones over a ii-V-I) and add a short chord-tone to approach-note section (one chord tone on the beat, one approach note a half step above or below a chord tone), after item 1. A concrete route: either make `improv.6` a prerequisite of `jazz.9`, or write the soloing steps into jazz.8/9. Evidence: Berklee weeks 9-10, ABRSM Jazz Piano (improvisation from Grade 1). A new lesson section, or a fix to the promise. Class: scoped-out gap (foundational bridge). If the owner prefers the narrow track, the fix is renaming, not building (see section 10).

3. **Make `jazz.9` one tune with a defined arc.** Smallest change: rewrite the lesson as a sequence, each step on the same standard: learn and memorise (form first, landmarks, start from the bridge), comp, walk or two-feel, chord-tone chorus, a short intro and ending, a solo-piano pass (melody with block or drop-2 chords). `chords-pop.9.md` already teaches the four arranging decisions and "steal the intro from the last eight bars" (`:20-21`); reuse it by reference rather than rewriting. Evidence: Berklee weeks 9-12, dossier TRACK 7 (the jazz.9 recommendation). Deletes the "four ways" paragraph as a list; replaces it. Class: fix to a lesson plus a reference, no new generator. Needs items 1 and 2 first to be honest.

4. **Make the capstone options support the instruction.** Learner problem: three of six options have no chord symbols (Stardust, Ain't Misbehavin', Saints jazz). Smallest change: say in `jazz.9.md` which of the six carry a chart (Take Five, Lullaby of Birdland, Linus and Lucy) and name how to get the chart for the others (the `chords-pop.9.md:30` move). No score change implied. Evidence: dump headers cited in section 6. Fix; deletes nothing.

5. **Fix the walking-bass wording** to "a half step above or below, and a scale step also works" so that jazz.6 and jam.6 agree (`jazz.6.md:22-23`, `jam.6.md:23-26`). Fix.

6. **Rewrite the stride sentence** (`jazz.7.md:32-34`): beat 1 bass note, beat 2 chord, beat 3 the chord's third an octave above the bass (a tenth) or another bass note, beat 4 chord. Fix.

7. **Clean up lesson-to-drill mismatches**: `exercise.ii-v-i.c.rootless` on `jazz.6`, `drill.jazz.chord-scale` on `jazz.7`, `drill.theory.modes-all` and `drill.reading.sight-reading-7` on `jazz.8`: either move them or add a one-line pointer ("the chord-scale drill is explained in the theory track's Stage 7 lesson"). Fix.

8. **Smaller wording fixes**: "exactly as well" (`jazz.7.md:27`), "C13 with and without the eleventh" (`jazz.8.md:20`), the dominant 13th note in the rootless paragraph (`jazz.7.md:16-20`). Fix.

9. **Bossa:** decide in the latin record whether the latin track teaches a bossa pattern; if not, either teach one in the jazz track (D4 stage 8 "Latin jazz (bossa/clave)") or drop the D4 wording. Scoped-out gap; depends on item 10 of section 10 and on the latin reviewer.

10. **Historical listening and transcription:** leave as enrichment and say it is outside the track; do not add. Scoped-out.

## 9. Confidence

| section | confidence | reason |
| --- | --- | --- |
| 0, 1 | High | read the files and the D4 text directly |
| 2 | High | every cell is from the lesson files, the stage JSON or the catalog entries |
| 3 | High for absences within the stated grep scope; medium for how much an owner would value each | scope is all of `content/lessons/`; severity depends on the endpoint chosen in section 10 |
| 4 | High for the exercise listings (read directly), medium for the capstone-sequence argument | depends on the endpoint in section 1 |
| 5 | Medium | sources for rootless, tritone and walking-bass points were read as search summaries and a Wikipedia article; Levine's text was not readable; the stride reading is from the generator code, not from a stride text |
| 6 | Medium | the 32 CSV rows were read in full; the capstone symbol counts are header counts and the minor-key claim about Fly Me and Insensatez rests on the tunes' standard forms plus partial symbols from the shipped files |
| 7 | High | this follows directly from lesson text and the brief's rule |
| 8 | Medium | rank depends on the owner's endpoint (section 10) |

## 10. Owner decision required?

Yes, one: the track's endpoint.

- Path A (keep the name and the "soloing" promise): treat Berklee-style functional jazz as the endpoint. Add a minor ii-V-i step, a chord-tone to approach-note soloing step, and rewrite `jazz.9` as one integrated tune with intro, ending and a solo-piano pass. About two new lesson sections plus a rewritten capstone.
- Path B (narrow the track to what it teaches): name it as comping, voicing and accompaniment for jazz standards, delegate soloing to `improv` and arranging to `chords-pop.9`, and strip "soloing" from the `jazz.9` title and finder. Smallest change to the files; the promise to the learner shrinks.

Reputable sources do not settle this: the Berklee outline and ABRSM Jazz Piano cover improvisation, but PianoProject splits improvisation into its own track by design (`improv`). The choice turns on whether that split is the product. The remaining items are fixes and need no decision. Bossa belongs to the latin record's decision.

## 11. Cross-track abilities (A–F)

A. Sight-reading: not touched by this track in the lesson body. `jazz.8` lists `drill.reading.sight-reading-7` among its exercises (`stage-8.json`) without a word in the lesson. Scope: jazz lesson files; grep for `sight` in jazz files returns nothing.

B. Transposition: touched. Shells and ii-V-I in four keys (`jazz.5.md:36-38`), rootless in several keys (`jazz.7.md:65`), the same tune a fourth higher and "start the tune in a key you have not practised" (`jazz.9.md:30`, `:54-55`), numerals as the transposable form (`jazz.9.md:23-27`). Taught as a skill only through the numerals paragraph; no key-change task on a lead sheet that the app scores.

C. Memory as structure plus retrieval: weakly touched (section 3, item 3). Numerals and the blind tool; no landmarks, cold starts or interruption recovery in the jazz files.

D. Ear training with production: partly. Harmonic dictation (`jazz.6.md:28-32`, `jazz.8.md:23-28`) and ear-tune playback (`jazz.9.md:19-22`) are production tasks, MIDI-checkable; singing is not taught. `jazz.5.md:67` says "sing the melody" while comping, a self-checked production task.

E. Score study before playing: not touched. The nearest is `jazz.3.md:37` ("reading a tune while ignoring what is printed over it is its own small skill") and `jam.7.md:27-29` for chart instructions; no jazz lesson asks for form, key and difficulty inspection first.

F. Performance and recovery: touched only through the blind tool and "nothing is recorded" tool notes. No cold start, no no-stopping run, no recovery in the jazz files; `jazz.9`'s tools line mentions marked runs (`jazz.9.md:42-47`).

## 12. Evidence not acted on

- `drill.ear.tune-long` is one key (G) and one length; a jazz-specific ear drill is a generator question (`catalog.static.json`).
- I Got Rhythm (`song.classical.i-got-rythm.pdmx`) is a 28-bar written arrangement shown on both jazz.7 and jazz.8; a shorter-than-32-bar form is worth recording if a lesson claims 32 bars (`jazz.7.md:48-49` claims the standard 32-bar form; the file is 28).
- `song.jazz.bart-howard-fly-me-to-the-moon.pdmx` has 20 symbols over 22 bars, at bars 1, 3, 4, 8, 11, 13, 17, 22; a reader following chord symbols gets a sparse chart (edition-specific).
- `jazz.9` lists `songOptional: True` and a single exercise run as the requirement; the unit can be completed without the capstone behaviours (`stage-9.json`).
- Take Five (`song.jazz.the-dave-brubeck-quartet-take-five.pdmx`) is 25 bars and mostly a two-chord vamp (my parse of bars 1-25); it is both the blind-tool entry and the first of the six capstone options.
- Tools: the `improv.6` lab opens "on the minor vamp" (`improv.6.md:37`) while the lesson text works on `ii7 V7 I`; a note for the improv record.
- `jazz.4.md:64-65` and `jazz.6.md:55-58` give app-behaviour descriptions ("it opens on Play the tune") inside lesson text; UX-adjacent, not reviewed.
- `latin` options include `Insensatez` (minor ii-V material) at level 2.3 (`ladder.md`), before any jazz harmony is taught; for the latin record.
- Interpretation audit note: `jazz.6` song options include `Bye Bye Blackbird` which also sits on `jazz.3` (`ladder.md:197, 200`), so one edition serves two rungs.
