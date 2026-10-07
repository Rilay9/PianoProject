# rock-metal: curriculum review record (2026-10-05)

Reviewed at HEAD `96a5b09b` (branch `claude/piano-teaching-app-bo19td`). Read-only review; this file is the only thing written.

## 0. Scope and denominator

**Units reviewed: 5/5** for this track, from `content/curriculum/stage-3.json` to `stage-7.json` (`stages[].units[]`, `track: rock-metal`): `rock-metal.3.1` (lesson `rock.overview`), `rock-metal.4.1` (`rock.4`), `rock-metal.5.1` (`rock.5`), `rock-metal.6.1` (`rock.6`), `rock-metal.7.1` (`rock.7`). The track is defined at `content/curriculum/00-tracks.json:83` (`startsAtStage: 3`, `defaultActive: false`).

**Lesson files read in full:** `content/lessons/rock.overview.md` (65 lines), `rock.4.md` (61), `rock.5.md` (53), `rock.6.md` (64), `rock.7.md` (67). Read in part for cross-track comparison: `chords-pop.5.md` (lines 22-30), `chords-pop.7.md` (lines 13-22, 43-49), `chords-pop.9.md` (lines 10-60), `theory.9.md` (all), `technique.5.md` (lines 40-50).

**Design and ladder read:** `docs/02-curriculum.md` D8 (lines 693-735), lines 160-170, 1203, 1330-1340; `docs/00-overview.md` D18 and D23 (lines 98, 103); `docs/generated/ladder.md` lines 142-152 ("Rock & metal"); `docs/prompts/rung-claims.md` lines 291-349; `docs/genre-plans/rock.md`; `docs/prompts/runs/restart-2026-10-05/Curriculum_425_Placement_Audit.csv` (13 rows with rung `rock.*`), `Fable_Curriculum_Interpretation_Audit.md` (the `rock.4`, `rock.5`, `rock.6`, `rock.7` sections), `repertoire-review-state.md` ledger rows 001-004. Exercise generators read in `tools/content/generate_exercises.py` (`make_power_chord` from line 5503, `make_modal_vamp` 5887, `make_ostinato` 5969, `make_open_voicing` 4530, `make_shaping` 2869, `make_pedal` 2369, `make_pedal_variant` 3259, `make_riff` after 5560). Shipped exercise notation parsed with music21 for `exercise.shaping.a.crescendo` only; the other exercise facts come from the generator code.

**Scores reopened** (dumps from `origin/claude/readable-scores:docs/prompts/runs/readable-scores/<id>.dump.txt`; MusicXML for the two marked *xml*): `song.folk.scarborough-fair.pdmx`, `song.folk.greensleeves.chords`, `song.folk.john-denver-annie-s-song.pdmx` (dump and *xml* harmony elements), `song.classical.ode-to-joy.full`, `song.classical.pachelbel-canon-d.easy` (bars 1-13), `song.classical.sakamoto-andata.pdmx` (bars 1-12), `song.classical.satie-erik-satie-gnossienne-n1.pdmx` (bars 1-11), `song.classical.chopin-prelude-op28-20.nifc` (bars 1-3), `song.classical.beethoven-moonlight-i` (bars 1-4), `song.classical.beethoven-moonlight-iii` (header counts only), `song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx` (all 87 bars, and *xml* tempo and dynamics elements), `song.classical.rachmaninoff-rachmaninoff-piano-concerto-no-2.pdmx` (all 56 bars).

**External sources consulted:**
- Berklee Online, Pop/Rock Keyboard (12 weeks): https://online.berklee.edu/courses/pop-rock-keyboard
- Power chord (why the third is omitted; whether distorted guitar can play thirds): https://en.wikipedia.org/wiki/Power_chord

**Not inspected:** the three other archive copies of House of the Rising Sun, and the CIDs for Wayfaring Stranger, Hava Nagila, Gymnopedie, Morning Mood, Dies Irae, Night on Bald Mountain, Mars and O Fortuna named in `docs/genre-plans/rock.md`. The ledger's rejection of four rock arrangements (section 6) was reused, not re-read.

## 1. Promised endpoint

**What the track promises.** Track description, `00-tracks.json:83`: "Mini-module: the five textures a band arrangement reduces to on one piano, taught on public-domain music you already have." Design, `docs/02-curriculum.md:693` heading "D8. Mini-modules (optional; ...)", and `:714-720`: "rock as technique on public-domain material (`00` D18) ... **The owner's songs are not the track's reason (the owner, 2026-09-28; I4; unwound in F2)**". `docs/00-overview.md` D18: taught "as *technique* on public-domain material plus an import path for the actual songs". The first lesson says the same (`rock.overview.md:12-15`: the songs "are still in copyright, and PianoPath will never ship a transcription of them. What it can do is teach the techniques those parts are made of").

**What the last rung promises.** `rock.7.md:65-67`: "You can play a passage twice - once building with register and density and once with volume alone - and hear which of the two is the music." The track's closing criterion is one self-judged listening task on classical repertoire. There is no onward pointer from `rock.7` (grep of `rock.7.md` for "next", "after this", "arrange", "transcribe": none found).

**What a competent developing pianist in this domain can do.** From the dossier (`PianoProject_Thorough_Curriculum_Content_Research_2026-10-05.md`, TRACK 14, lines 1320-1388) and the Berklee outline (https://online.berklee.edu/courses/pop-rock-keyboard): outcomes are performing keyboard grooves and textures across pop/rock genres, selecting voicings and rhythms for live and studio settings, creating melodic solos, and reading contemporary lead sheets. Weeks 1-3 are triads, quarter/eighth-note comping, arpeggiated accompaniment and voice leading; week 5 is sus4/maj7/min7; weeks 6-8 are gospel, funk/R&B and "syncopated pocket grooves"; weeks 9-12 are improvisation, ballad accompaniment and performance. The outline does not list transcription from a recording or reducing a band to piano. Those two come from this project's own design (D8: "reducing a band arrangement to a piano part (melody + bass + one texture)") and from the dossier, not from Berklee.

**Reasonable PianoProject endpoint.** Two honest endpoints exist (section 10). As built, the track is **intentionally narrower than its name**: a texture module (hold a figure, voice a sus chord, hold an arpeggio over a bass, build a passage) that says so in its description. A learner who finishes can apply four textures to classical and folk music from a chart; the track does not teach rock keyboard and has no rock-idiom piece anywhere (section 6).

**Promise versus delivery, checked.**
- "five textures": `rock.overview.md` names **four** ("Where the textures go next", lines 43-49: riff over a held bass and the power chord; open voicings; arpeggio over a pedal bass; building by register and density), plus the reduction itself as the technique. `docs/02-curriculum.md:1203` and generator comments (`generate_exercises.py` near lines 5256, 5507) also say "five". Count at HEAD: four textures plus one reduction rule. Description and lesson disagree by one.
- "taught on public-domain music you already have": ten of the 12 catalog songs tagged `rock-metal` are public-domain compositions (Ode to Joy, Greensleeves, Scarborough Fair, Canon in D, Gnossienne, Chopin 20, Moonlight I and III, Mountain King, the Rachmaninoff concerto). `song.folk.john-denver-annie-s-song.pdmx` (Denver) and `song.classical.sakamoto-andata.pdmx` (Sakamoto) are not; `rock.7.md:44-46` also calls the Rachmaninoff "a personal-library score". Scope: the 12 catalog entries with `rock-metal` in `tracks`, `app/public/content/catalog.json` (12 songs, 22 exercises).
- D8 promised and the lessons do not deliver (scope: `content/lessons/rock*.md`, grep `half-time|6/8|click|metronome|recording|drop|doubling`: only `rock.7.md:33, 48`, where "drop" means the release in a build and a tempo drop, not drop tuning; nothing teaches the other items): "6/8 and half-time ballad feels", "drop-tuned heaviness via low-register doublings", "playing with a click and with a recording", "octave ... LH" as a taught bass, "Lessons also explain how to legally obtain MusicXML for specific songs" (the only text is `rock.overview.md:54-55`, one sentence). The concept `half-time-feel` is tagged on `rock.6` (`rung-claims.md:336`) with no lesson text teaching it (grep `half-time|half time` over all 109 lessons: no hit in any rock file).

## 2. Current coverage

Stations: **C** = CONTROL, **M** = MODEL/TRANSFER, **U** = MUSIC, **I** = INDEPENDENCE.

**A. The reduction rule: melody, bass and one texture** (`rock-metal.3.1`).
- C: `drill.pattern.lh-accompaniment`, `drill.chord.symbol-flash`, `exercise.accompaniment.broken.a-minor.left` (`stage-3.json`, unit `rock-metal.3.1`; `rock.overview.md:25-26`).
- M: four songs where the learner supplies the missing layer. Ode to Joy (full): tune plus whole-note roots under C/G symbols, bars 1-17, 20 symbols, exactly as `rock.overview.md:31-33` says. Greensleeves with chords: full-triad LH, bars 1-15 ("too much of one"). Scarborough Fair: one staff, 13 symbols, no bass, bars 1-19. Canon in D (easy): LH eighth-note arpeggios, already a reduction (bars 1-13).
- U: tools only (Accompaniment lab "Rock - the minor vamp", duet).
- I: one unjudged check (`stage-3.json`: `kind: unjudged`, `rule: textures-identified`, "Name the texture a rock track's piano part keeps") and `rock.overview.md:63-65` ("play Scarborough Fair from its symbols with a bass and that one texture, without stopping"). Nothing later asks the learner to choose what to keep, defend an omission, or reduce an unseen source. **Reduction is taught once, at Stage 3, and never returned to** (scope: `rock.4`-`rock.7` read in full; grep `reduc` in `rock.4-7.md`: one hit, `rock.4.md:12`, a backward reference to the Stage 3 lesson, no task).

**B. Power chord and the repeating figure** (`rock.4`, `rock-metal.4.1`).
- C: `exercise.power-chord.d` (LH root-fifth-octave eighths, RH accented chords on beats 1 and 3, `ff`, roots i-bVII-bVI-bVII; `make_power_chord`), `exercise.ostinato.e.fifths`, `exercise.ostinato.d.arpeggio` (RH eight-eighths figure over a held low octave; `make_ostinato`), `exercise.modal-vamp.e`. Definitions at `rock.4.md:18-23` (power chord) and `:25-29` (ostinato).
- M: `song.folk.greensleeves.chords` as a vehicle, explicitly "ignore the written left hand entirely" (`rock.4.md:43-48`). The interpretation audit settled it as an application substrate; verified at HEAD: the dump shows block triads in the LH bars 1-15 and the lesson says to replace them.
- U: lab preset and duet. I: none (no task asks the learner to pick power chord or ostinato for a given tune).
- First met earlier: `exercise.power-chord.a`, `exercise.ostinato.a.arpeggio` and `exercise.modal-vamp.a` are on core 3.3 (`stage-3.json` lines 206-208) and `exercise.ostinato.a.fifths` on core 2.1 (`stage-2.json:32`); `rock.4.md:31-35` says "You met these figures in A minor on the core rungs". Verified true. `rock.4` is therefore mostly a transposition of already-met figures into D and E minor (sections 4 and 11).

**C. Open voicings: sus2, sus4, add9** (`rock.5`).
- C: `exercise.open-voicing.c.sus2`, `.c.sus4`, `.c.add9`, `.f.sus4` (I-IV-V-I roots in C or F; LH root two octaves below the RH shape, as `rock.5.md:22-25` says; `make_open_voicing`, root at octave 2 and shape from octave 4).
- M: Annie's Song and andata (what the notation holds: section 5).
- U: Accompaniment lab and Free play. I: "voice sus2, sus4 and add9 on any root without working them out" (`rock.5.md:51-53`); the four exercises cover only the roots C, F, G and B-flat.

**D. Arpeggio over a bass; pedal as colour** (`rock.6`).
- C: `exercise.ostinato.a.arpeggio` (the same item used at core 3.3 and `holiday.5`), `exercise.accompaniment.broken.a-minor.both`, `exercise.pedal.a` (clean pedal change on I-IV-V7-I in A major, `make_pedal`, the opposite of the lesson's "colour" use), `exercise.pedal.half-pedal.a` (level 7.4, scored on the CC64 value, `make_pedal_variant`).
- M: Gnossienne (LH A3 / C4+E4 / C4+E4 repeated, bars 1-9), Chopin Prelude 20 (13 bars of block chords), Moonlight I (540 tuplets in 69 bars). The audit verdict (GREEN/AMBER, distinct roles) holds at HEAD: the lesson names each piece's separate job (`rock.6.md:40-48`).
- U: duet, lab. I: "you can say why you cleared the pedal where you did" (`rock.6.md:62-64`), self-checked.

**E. Building by register and density** (`rock.7`).
- C: `exercise.shaping.a.crescendo` / `.diminuendo`, `exercise.shaping.c.crescendo`, `exercise.octave-scale.a.1oct.both`. The shaping exercise (parsed from the shipped file) is a two-octave A-major scale up and back down in 5 bars (bar 1 A4-A5, bar 2 B5-G#6, bar 3 F#6-F#5, bar 4 E5-A4, bar 5 A4), scored on a rising velocity slope. It trains **volume only**, which `rock.7.md:18-24` calls "the least" of the three ways. The octave scale (2 bars) is the nearest thing to density. **No controlled exercise trains a register change or a density change** (scope: the four `exerciseOptions` of `rock.7` in `stage-7.json`, read in full).
- M: Mountain King, Rachmaninoff, Moonlight III; all three `PROJECT_STRETCH` in the 425 CSV, levels 8.4, 6.96, 8.4.
- U: the same pieces. I: play twice and "hear which of the two is the music" (`rock.7.md:65-67`), unverified as music.

## 3. Missing or weak abilities

The dossier's candidate list (TRACK 14) checked one by one. Scope for every "absent": `content/lessons/*.md` (109 files) by grep; "in rock" means `rock.overview.md` and `rock.4.md`-`rock.7.md`, read in full.

| ability | in rock lessons | elsewhere (scope: grep over all 109 lessons) | severity |
|---|---|---|---|
| Transcribe a riff or bass line from a recording | absent; only `rock.overview.md:54-55`: "transcribe it in MuseScore - slow, and the best ear training there is", as an import aside | `theory.9.md:15` ("Take down eight bars. Melody and harmony, by ear"), `theory.8.md:29`, `chords-pop.9.md:23` | depth for a texture module; **foundational bridge** if the track is promised as serious (path B) |
| Reduce guitar, bass, drums and vocal to two hands from a band source | taught once as a rule on non-rock substrates (`rock.overview.md:17-20`); no band-source task | `chords-pop.9.md:29-35` (thin a full texture, "arrange twice") | depth (path A); foundational (path B) |
| Choose what not to play | named (`rock.overview.md:19-20` "Choosing which is the real skill", `:51-52`) but never practised or checked | `chords-pop.9.md:40-41` ("Arranging by adding. Most arrangements get better when something comes out") | depth |
| Keep an ostinato exact | present: `rock.4.md:25-29, 55-57`; `make_ostinato` docstring: eight bars, "What goes wrong goes wrong in bar six" | n/a | none |
| Syncopated chord attacks (off-beat rock comping) | absent (grep `syncop` in rock: none found); the power-chord exercise puts RH chords only on beats 1 and 3 (`make_power_chord`) | `3.5`, `4.5`, `jam.5`, `latin`, `ragtime.5`-`ragtime.8` teach syncopation in other idioms | depth; Berklee weeks 6-8 list "syncopated pocket grooves" |
| Octave melody or bass | octave appears as the top of a power chord (`rock.4.md:18`) and as density (`rock.7.md:20-21`); D8's "octave ... LH" as a bass device is not taught | `holiday.4` (melody-octave and bass-octave devices, per the interpretation audit's `holiday.4` entry) | depth |
| Repeated-note endurance | the ostinato exercise is eight eighths a bar for eight bars; no lesson names endurance | `technique.5.md:18-19` (repeated notes), `4.4.md:15` | enrichment |
| Pedal and ambient texture | present: `rock.5`, `rock.6`. Moonlight I carries Beethoven's printed "sempre pianissimo e senza sordini" (dump text), the authentic model for "pedal as colour", not cited in `rock.6` | n/a | none |
| Odd-metre counting | absent (grep `5/4|7/8|odd.meter` in rock: none found) | `technique.5.md:43` (5/4), `jazz.9.md:37` (Take Five) | enrichment; no repertoire on this track needs it |
| Half-time and 6/8 feel | absent despite D8 and the concept tag on `rock.6` | 6/8 as compound time: `4.5.md:15` | depth (promised and undelivered) |
| Build and drop | present: `rock.7.md:26-34` (needs somewhere to come from; needs a release) | n/a | CONTROL for register/density missing (section 2E) |
| Play with a click or a recording | absent (grep `click|metronome|recording|record` in rock: none found) | n/a | enrichment; D8 promised it ("Free mode + imported audio playback later") |
| Personal modern-song project (dossier `rock.9`) | absent | `chords-pop.9` is the arrange-your-own rung; `theory.9` is dictation of eight bars | path B only |

External evidence that a competent pop/rock keyboard curriculum includes comping, grooves, voicings, lead sheets and improvisation: https://online.berklee.edu/courses/pop-rock-keyboard (a 12-week course with a prerequisite; coverage evidence, not a crosswalk target). This track's estimated days sum to 76 (7 + 10 + 14 + 21 + 24, from the unit JSON); no equivalence is claimed.

**Weak abilities.**
1. **Register and density have no CONTROL.** `rock.7` teaches that volume is the weakest of three tools and then drills only volume (section 2E).
2. **The only INDEPENDENCE task of the whole track is at Stage 3** and is unjudged (`textures-identified`).
3. **No onward route.** The track ends at Stage 7 without telling the learner that `chords-pop.9` (arranging, Stage 9) and `theory.9` (taking down eight bars) are where reduction and transcription continue.

## 4. Sequencing concerns

1. **`rock.4` re-teaches what core 3.3 already taught.** The power chord, the ostinato and the modal vamp were met in A minor at core 3.3 (`stage-3.json` lines 206-208; `exercise.ostinato.a.fifths` at core 2.1). `rock.4` (stage 4, level band 2.6-3.4) adds D and E minor, not a new idea. That is a legitimate transposition step (cross-track ability B), but `rock.4.md:12-16` ("This is the first rock texture under your hands") overstates it.
2. **The Greensleeves transfer asks for a figure that does not fit the bar.** Greensleeves with chords is 3/4 in A minor (dump: `times: ['3/4']`). The ostinato exercises are 4/4 with eight eighths a bar and are in D and E minor (`make_ostinato`; `stage-4.json` rock.4 options). `rock.4.md:46-48` ("then play the ostinato under it instead") leaves the learner to refit an eight-note cell to six eighths and a new key. The root-fifth cell refits trivially; the broken-triad cell (`[0, 3, 7, 12, 7, 3, 0, 3]`, `OSTINATO_SHAPES`) does not. No text or exercise bridges this.
3. **Sus chords are taught three times with different emphasis.** `chords-pop.5.md:24-28` (stage 5): "Play sus4 then the plain triad and you have a pop-piano gesture"; it names the add9 exercises as "on the rock track at this stage". `chords-pop.7.md:15-17, 45-46`: `sus4` resolves down to the third, `sus2` often does not; "A sus that resolves is a moment". `rock.5.md:47-49`: "Common mistake. Resolving them." The facts agree; the framing does not, and the same exercises (`exercise.open-voicing.*`) serve all three.
4. **`rock.7`'s required song sits above the rung's own exercises and above its stage.** `stage-7.json` requires one song run (`kind: runs, from: songs, count: 1`) from three pieces at levels 6.96, 8.4 and 8.4, while the shaping exercises are 5.2 (`levelBand [5.2, 8.4]`). `docs/02-curriculum.md:160` puts Stage 7 at about Grade 6 and line 161 puts Stage 8 at Grade 7-8 including Beethoven sonatas; Moonlight III (201 measures) is Stage 8 or later by that table, and Mountain King (87 bars, tempo 80 to 200) is above Grade 6. The lesson says so itself (`rock.7.md:36-38`) and recommends eight bars for Play it blind, but the requirement counts a run of the piece. There is no build piece between 5.2 and 6.9 (scope: the three `songOptions`). The genre plan lists Dies Irae (16 bars) and Morning Mood as archive candidates for this stretch; not inspected.
5. **The track is a fan, not a progression.** `rock.5` and `rock.6` both require only `rock.4`; `rock.7` requires `rock.6` (the `prerequisites` fields in `stage-5.json`, `stage-6.json`, `stage-7.json`). The four texture rungs can be taken in any order with little loss; nothing in `rock.5` builds on `rock.4`'s minor-key figures (its exercises are major-key I-IV-V-I in C and F). That is acceptable for a texture module and would not be for a serious track.

## 5. Correctness concerns

**Earlier audit findings checked.** `rock.4` "Greensleeves writes full triads" (Fable RED): already resolved by the current lesson, which tells the learner to ignore the written LH (`rock.4.md:43-48`); the dump agrees the LH is block triads; the interpretation audit's REVISE stands. `rock.5`, `rock.6`, `rock.7` audit verdicts (GREEN, GREEN/AMBER, GREEN/PROJECT) re-read; sub-claims below change the evidence for `rock.5` and `rock.7`. The row "NOT FOUND annie s song" in `docs/genre-plans/rock.md` is stale: Annie's Song is in the catalog at HEAD.

Findings at HEAD:

1. **`rock.5.md:12` "a distorted guitar cannot hold one [a third]"; `rock.4.md:19-21` "exactly why it sits under a distorted guitar without fighting the singer".** Overstated. https://en.wikipedia.org/wiki/Power_chord (Analysis section): distorted guitar *can* play thirds and full chords, but they generate messy intermodulation partials, so power chords are preferred. The "without fighting the singer" rationale is not in that source. Wording fix only.
2. **`rock.5.md:31-37`: Annie's Song "uses a sus4 as a hinge ... the clearest possible illustration of the chord not settling"; "both of these print it in their chord symbols".** The MusicXML harmony elements of `song.folk.john-denver-annie-s-song.pdmx` hold `Dsus4` in **one measure only**, measure 0, where the harmony alternates D / Dsus4 / D / Dsus4: the chord resolves within the bar, which `rock.5.md:47-49` calls a mistake. The symbol set for all 57 measures is A, A7, Bm, D, Dsus4, E, Em, F#m, G: no sus2, no add9. What the score demonstrates bar after bar is the **open fifth in the LH** (bar 1 G3 D4 G4, bar 2 A3 E4 A4, bar 3 B3 F#4 B4: root-fifth-octave, no third), which is the `rock.4` shape. The audit's "GREEN, literally writes root-fifth-octave" is true of that shape and not of sus2/sus4/add9. `andata` (G-sharp minor, 65 bars) lists one `D#sus4` among m7, maj7, m7b5 and mM7 chords (`notation.chords`): a rich-chord ambient study, not a sus/add9 model; the lesson's "harder than the level suggests" is fair.
3. **`rock.7.md:22` "Used alone it runs out after about eight bars".** An unsourced number stated as fact; no source consulted gives it. Drop the number.
4. **`rock.7.md:51-53` Rachmaninoff "the chords thicken bar by bar and the dynamic follows rather than leads".** In `song.classical.rachmaninoff-rachmaninoff-piano-concerto-no-2.pdmx`, bars 1-8 sound about 7, 8, 9, 9, 8, 9, 9 pitches (my count from the dump), then the Allegro theme begins at bar 9 with LH eighth-note arpeggios. Density rises in bars 1-3 and plateaus; "bar by bar" is not borne out, and the rest of the 56 bars is a theme over arpeggios, not a build. The text on the score is only "cresc., dim., cresc., dim.", so "the dynamic follows rather than leads" cannot be checked. Soft claim.
5. **`rock.7.md:53-54` "Moonlight's finale is the one where the build is inside the writing rather than marked over it."** `song.classical.beethoven-moonlight-iii` carries 113 dynamics marks and 84 pedal marks in 201 measures (dump header counts). The build is heavily marked; the distinction as written is unsupported.
6. **`rock.4.md:26-27` figure in the right hand, `:59` "The left hand keeps the figure through a whole page".** The exercises put the eight-eighths figure in the **right** hand over a held **left-hand** octave (`make_ostinato`: `rh` gets the figure, `lh` the pedal octave). The Greensleeves instruction at `:46-48` ("play the ostinato under it") puts it in the LH. The lesson says both, and the "how you'll know" line describes a different task than the exercises.
7. **`rock.5.md:15-17` "Take the third down a step ... a sus2; ... up a step ... a sus4."** True only if "step" means a scale step (E to D, E to F in C major). Imprecise, not false; `chords-pop.5.md:24-25` states it unambiguously.
8. **`rock.5.md:47-49` "Common mistake. Resolving them."** A style preference stated as a rule. A sus4 that resolves is the standard pop gesture (`chords-pop.5.md:26-27`, same app). Heuristic stated as law.
9. **`rock.4.md:55-57` "Flat, even, and slightly boring is correct."** True of the exercise's evenness goal; `rock.7` then teaches shaping. Should say "for this exercise".
10. **Verified true at HEAD (no defect):** Scarborough Fair is E Dorian (`rock.overview.md:36-39`; dump bar 7 `B4 C#5 A4` over A major, key signature two sharps). Chopin 20 is 13 bars of block chords (`rock.6.md:42-43`; 13 measures, 0 tuplets). Moonlight I is triplet arpeggios over a bass that moves about once a bar (540 tuplets in 69 bars; dump bars 1-3: C#, B, A+F#). Mountain King tempo "quarter = 138, drops to 80, then rises toward 200" (`rock.7.md:48-50`; MusicXML `sound tempo`: bar 1 = 138, bar 6 = 80, then 85, 90, 95, 110 ... 195, bar 74 = 200). The register widening and repeated crescendo (dump: bar 2 starts at B1, bars 10-17 at F#2, octave doubling from bar 18, thirds from bar 26, D6-F#6 by bar 50, C#7 by bar 58; "cresc. poco a poco" bar 11, "cresc." bars 18, 26, 46, 58). Ode to Joy has tune, held roots and C/G symbols (`rock.overview.md:31-33`).

Moonlight I's score instruction "senza sordini" (pedal for the whole movement) is an authentic fact that `rock.6.md:29-33` does not use: a missed model, not an error.

## 6. Practice and material sufficiency

**Counts.** Catalog items tagged `rock-metal`: 12 songs, 22 exercises (`app/public/content/catalog.json`): `power-chord` a/d/e (one shape, one progression), `ostinato` a/d/e x {fifths, arpeggio}, `modal-vamp` a/d/e, `pentatonic` a/d/e x {pentatonic, blues} (on no rock rung), `riff` a/c x {falling, rocking} (core rungs 1.1 and 1.5). Exercises listed on rock rungs: `rock.overview` 3, `rock.4` 4, `rock.5` 4, `rock.6` 4, `rock.7` 4 = 19. Only 5 of those 19 distinct items are tagged `rock-metal` (the four on `rock.4`, plus `exercise.ostinato.a.arpeggio` on `rock.6`); the open-voicing, pedal, shaping, octave-scale, broken-chord and drill items are shared with jazz, chords-pop, technique and holiday. Thin family (record only): `power-chord` is one shape in one progression at three tonics.

**Revisited?** Ostinato: core 2.1, core 3.3, `rock.4`, `holiday.5`, `rock.6` (the same A-minor arpeggio item three times: `stage-3.json:206`, `stage-5.json:371`, `stage-6.json:774`; repeated, not progressed). Sus chords: `chords-pop.5`, `chords-pop.7`, `rock.5`. Reduction: once. Register and density: once, in repertoire only.

**Primary versus transfer or project material (425 CSV, 13 rows with rung `rock.*`).**
- `rock.overview`: 4 rows, all `KEEP`, `PRIMARY_OR_TRANSFER`. Appropriate: substrates the learner reduces.
- `rock.4`: 1 row, `KEEP`, `APPLICATION_SUBSTRATE`. Matches the lesson's own contract.
- `rock.5`: Annie's Song `KEEP` / `PRIMARY_OR_TRANSFER`; andata `KEEP_RECLASSIFY` / `STRETCH`. My reading (section 5.2): Annie's Song is a transfer of the open fifth and a thin sus4 illustration, not a clean primary for sus2/sus4/add9. Evidence that changed the label: the chord-symbol set and the single Dsus4 locus.
- `rock.6`: Gnossienne and Chopin 20 `KEEP_RECLASSIFY` / `TRANSFER`; Moonlight I `KEEP_RECLASSIFY` / `EXCERPT_PRIMARY`. Only Moonlight I is the literal texture, and it is level 7.1 on a Stage 6 rung.
- `rock.7`: 3 rows, all `KEEP` / `PROJECT_STRETCH`. **The rung has no primary or transfer song**; its only acquisition material is volume shaping, and the learner is required to run one of three stretch pieces (section 4.4). Primary acquisition and project stretch are confused here.
- The interpretation audit's roles for `rock.4`-`rock.7` agree with the CSV; I disagree only on the `rock.5` primary label.

**Is the material the right kind? Scarcity, stated narrowly.** All 12 songs on the track are classical or folk; no piece on any rung is rock-idiom piano writing. The seven import placeholders (`song.rock.a7x-seize-the-day`, `-dear-god`, `-so-far-away`, `-fiction`, `song.rock.lp-final-masquerade`, `-waiting-for-the-end`, `-shadow-of-the-day`) have `file: null`, are on no rung, and (checked for `a7x-dear-god` and `lp-final-masquerade`) carry `tracks: ["film-game"]`, not `rock-metal`. The named-figure ledger (`repertoire-review-state.md` items 001-004) rejected four rock PDMX files as piano material: House of the Rising Sun ("lead-sheet/non-piano-teaching arrangement"), Seven Nation Army ("percussion-only"), You Really Got Me ("one nominal piano part with 8 staves including percussion/full-band material"), American Woman ("essentially monophonic bass"). Scope of that rejection: one file per title, three of four by "prior-chat notation review", no CID recorded; I did not re-read them. The genre plan records four archive copies of House of the Rising Sun (public-domain traditional, 17 bars, e.g. `Qmc3v934xFCPJrgGpH9J8G5qTUhebhrysLwPEFEXhYgStR`); which copy was rejected is not stated, so three are uninspected. The genre plan searched public-domain titles; **no search for usable rock-idiom two-hand piano scores over the archive is recorded**, so scarcity of rock material is established for four named titles only, and I do not claim more.

**Three admissions, kept apart.**
- *Personal-library admission* (packet section 12): copyright and licence flags are not a gate for the owner's personal library; a technically sane modern-song file may sit there.
- *Curriculum admission*: a piece is on a rung only if its exact passages fit the rung's job. None of the four rejected files qualifies; a rock-idiom piece would need passage-by-passage inspection.
- *Public export*: `docs/00-overview.md` D18 and D23 (personal build only; `--strict-license` refuses in-copyright items) and `docs/02-curriculum.md:721-724` (never bundled). `rock.overview.md:13-14` says the app "will never ship a transcription of them", while `chords-pop.7.md:41` and `chords-pop.9.md:35-37` offer copyrighted-song arrangements on the personal build and show only rows publicly. The rock text reads as an absolute; the actual rule is personal-build-only (D23). Separately, the 2026-09-28 rule "builders must not fetch or embed transcriptions of these songs from any website" is a source rule, distinct from admitting an archive file.

## 7. Measurement limits

**Measured from MIDI:** note accuracy and tempo against the score for exercises (mastery `0.9/0.8` on `rock.4`-`rock.6`, `0.88/0.75` on `rock.7`, unit JSON); velocity slope for shaping (`minVelocityRange: 30`, `make_shaping`); CC64 value for half-pedal (`ccRange: [32, 96]`); pedal-change timing for `exercise.pedal.a` (0-120 ms after the new chord).

**Self-checked or unjudged:** "name the texture a rock track's piano part would keep" (`unjudged`, `textures-identified`); "hear which of the two is the music" (`rock.7.md:65-67`); "say why you cleared the pedal" (`rock.6.md:62-64`); "they sound open rather than crowded" (`rock.5.md:51-53`); whether the power chord "sounds like weight" (`rock.4.md:59-61`); whether a reduction "still sounds like the song". These are hearing and musical-quality claims that no actor in this process can decide: **unverified as music**. The structural parts (right notes, evenness of eighths, monotone crescendo, CC64 position) are measurable and measured.

**Cannot be seen even in principle by a MIDI check:** whether a texture is idiomatic rock, whether a sus voicing hangs well, whether a build works. The track's criteria are written as self-checks addressed to the learner ("you can hear"), which is the honest form.

## 8. Recommended changes

Ranked. None is a task from the 425 audit.

1. **Owner decision on name and endpoint (section 10).** Learner problem: a learner who picks "Rock & metal" expecting rock keyboard meets four texture rungs on classical and folk and no route to the bands the placeholders name. Smallest change under path A: keep the mini-module, make the name or description match (`00-tracks.json:83`), fix the texture count, and add a one-line onward pointer in `rock.7` to `chords-pop.9` and `theory.9`. Under path B: new units (section 10). Evidence: sections 1 and 6. Type: scoped-out gap, owner-decided.
2. **Fix the count mismatch** ("five textures" in `00-tracks.json:83`, `docs/02-curriculum.md:1203` and generator comments, versus four in `rock.overview.md:43-49`). Learner problem: the description promises one more texture than the track teaches. Smallest change: "four textures and the reduction rule". Type: fix.
3. **Give the track one INDEPENDENCE task for the reduction**, at the end of `rock.7` or as one optional rung: reduce 8 bars of a score the learner supplies (imported, personal-library, or a lead sheet) to melody + bass + one texture, and write down what was left out and why. Self-checked; no new detector. Reuse `theory.9`'s eight-bar dictation and `chords-pop.9`'s "arrange twice, keep the half that worked". Evidence: section 3 (reduction taught once, at Stage 3, unjudged). Under path A it replaces any need for a separate `rock.8`; under path B it is the seed of `rock.8`. Type: new small unit.
4. **Correct the wording defects in section 5:** `rock.5.md:12` and `rock.4.md:19-21` (distorted guitar "cannot"), `rock.7.md:22` (invented "eight bars"), `rock.7.md:51-54` (Rachmaninoff "bar by bar", Moonlight III "inside the writing"), `rock.4.md:26, 59` (hand mismatch), `rock.5.md:47-49` ("mistake"), `rock.5.md:31-37` (what Annie's Song shows). Learner problem: the lesson states what the notation or the source does not support. Type: fix (text only).
5. **Make `rock.7`'s acquisition material match its claim.** The lesson names register and density as the tools and drills only volume. Smallest change: name an existing exercise that isolates register as the self-set drill (for example `exercise.ostinato.e.fifths` played an octave lower, then with the octave doubled), and/or make a 16-bar excerpt the required run instead of a whole piece (Mountain King bars 2-17 sit at B1 to F#2 under "pp" and "cresc. poco a poco" from bar 11; musical effect unverified as music). Evidence: sections 2E and 4.4. Type: fix (requirement and wording); a generated register/density exercise would be a separate decision.
6. **Settle Annie's Song's role at `rock.5`:** say it is the open-fifth spacing plus one sus4, or add a piece that carries sus2/add9 symbols. Evidence: section 5.2. Type: fix (wording) or scoped-out gap (material).
7. **State the Greensleeves refit** (3/4 and A minor against 4/4 and D/E minor exercises) in one sentence, or restrict the instruction to the fifths cell. Evidence: section 4.2. Type: fix.
8. **Strike or teach the D8 items the lessons never deliver** (half-time, 6/8 feel, click and recording, low-register doublings, octave LH). Evidence: section 1. Type: scoped-out gap (decide per item; this is a design-text correction if struck).
9. **Reconcile the three sus-chord framings** (`chords-pop.5`, `chords-pop.7`, `rock.5`): `rock.5` states its goal is the unresolved sound and that `chords-pop` teaches the resolving gesture. Deletes the "Common mistake" overreach. Type: fix.
10. **Replace "never ship a transcription" (`rock.overview.md:13-14`)** with the D23 personal-build rule. Type: fix.

## 9. Confidence

- Section 0, 1: **High** (read from the files, with line numbers).
- Section 2: **High** for what lessons and generators say; **medium** for exercise-level facts read from generator code rather than every shipped score (only `exercise.shaping.a.crescendo` was parsed from the shipped file).
- Section 3: **High** for the grep-scoped absences (scope stated); **medium** that Berklee supports comping and syncopation as depth, since I read a fetched page summary, not a syllabus.
- Section 4: **High** on 4.1-4.4 (JSON and notation read); **medium** on 4.5 ("fan versus progression" is judgement).
- Section 5: **High** on items 2, 3, 5, 6, 10 (notation or lesson text); **medium** on 1 (one secondary source, fetched once), 4 (my per-bar pitch count from the dump) and 7-9 (wording judgements).
- Section 6: **High** on counts and CSV rows; **low** on rock-idiom material scarcity, because the ledger rejections are one-file prior-chat reads and the genre plan did not search for modern rock.
- Section 7: **High**.
- Sections 8 and 10: **medium**; the ranking is judgement and the owner choice is a goals question.

## 10. Owner decision required?

**Yes.** The track's name and endpoint are decided by the owner's goals, not by pedagogy sources. Sources agree on what a competent pop/rock keyboard curriculum covers (Berklee outline above) and do not decide how large this track should be.

**Path A: keep it a mini-module, say so, and close the honest gaps.**
- Name: keep "Rock & metal" with the description corrected, or rename to something like "Band textures for piano" so the name matches the promise.
- Endpoint: four textures plus the reduction rule, with one self-checked reduction task at the end (section 8, item 3) and an onward pointer to `chords-pop.9` and `theory.9`.
- Material: stays public-domain classical and folk; no rock-idiom piece required.
- Cost: wording fixes and at most one small unit. It does not deliver "transcribe from a recording" or "personal arrangement project", and does not pretend to.

**Path B: expand into a serious rock-keyboard track.**
- Name and promise: "Rock & metal" means what it says.
- Endpoint: add `rock.8` (transcribe and reduce 8-16 bars from a recording the learner chooses: bass, riff or chords, vocal or melody, rhythmic engine, decide what survives on piano) and `rock.9` (personal arrangement project: section map, textures by section, build and drop, memory, a recording), as the dossier proposes; likely also a syncopated-comping and groove strand (Berklee weeks 6-8).
- Material: no rock-idiom piano score is in the catalog; the ledger rejected four archive rock files; the seven import placeholders are `file: null`. The learner brings the source (import or MuseScore transcription) and the app cannot judge the result from MIDI beyond note accuracy, so the new rungs are largely self-checked and empty without the learner's own material.
- Cost: two new rungs, new self-check design, and a decision on how personal-library material meets curriculum admission (kept separate from public export).

Which path matches the owner's intent for the seven named songs and for the track name is not decidable from the sources: no one in this process can decide it. The fix-type items in section 8 (2, 4, 6, 7, 9, 10) apply under either path.

## 11. Cross-track abilities (A-F)

- **A. Sight-reading as a continuing strand:** not touched by this track (grep `sight` in `rock*.md`: none found).
- **B. Transposition recurring:** touched lightly. `rock.4.md:31-35` moves A-minor figures to D and E minor ("a band plays it in whatever key the singer needs"); the rock.4 exercises are in D and E minor against A at core 3.3. No later rung transposes; `rock.5` fixes C and F, and the lab fixes A minor (`rock.5.md:41-42`).
- **C. Memory as structure plus retrieval:** barely. `rock.7.md:56-60` uses Play it blind "for a reason that is not about memory"; no form-first memorisation, no landmarks (grep `memor` in rock: none found).
- **D. Ear training with production:** recognition only. `rock.overview.md:63-64` ("hear a rock track and say which one texture") is recognition and unjudged; `:54-55` calls transcribing "the best ear training there is" without a task. No singing, bass-finding or progression-to-keyboard task (grep `transcrib` in rock: that one line).
- **E. Score study before playing:** partly. `rock.overview.md:40-41` ("read it as one now, play it later") and the reduction rule ask the learner to read a score for its layers; no inspection routine (form, repeats, difficult transitions).
- **F. Performance and recovery:** barely. `rock.7.md:61-67` is about shaping a pass; no cold start, no no-stopping run, no recovery task (grep `perform` in rock: none found; the genre plan lists "Performance mode - BUILT" but no rock lesson names it).

## 12. Evidence not acted on

- `docs/genre-plans/rock.md` still says Annie's Song is "NOT FOUND" in 254,077 rows; at HEAD it is in the catalog (`song.folk.john-denver-annie-s-song.pdmx`). Stale historical file.
- The seven import placeholders carry `tracks: ["film-game"]`, not `rock-metal`, which contradicts `docs/02-curriculum.md:731-735` placing them with the rock track; `film-game` is not one of the 15 tracks in `00-tracks.json`.
- `rock.7.md:44-46` says the Rachmaninoff is personal-library only; the composition (1901) is public domain, so the reason is the edition's licence, not the composition. Not checked here.
- `docs/02-curriculum.md:731-733` lists practice vehicles on no rock rung: Bach Prelude C minor BWV 999 (ostinato) and Rachmaninoff Prelude C-sharp minor (heaviness; the genre plan says NOT FOUND). Design and rungs disagree.
- `exercise.pedal.a` (clean pedal change, A major) is offered on `rock.6`, whose lesson says the pedal here is a colour, not a joiner (`rock.6.md:29-33`); the exercise teaches the opposite use. Acceptable as the contrast, but unstated.
- `exercise.ostinato.a.arpeggio` is the same item on core 3.3, `holiday.5` and `rock.6`; the rock rung does not progress it.
- `exercise.open-voicing.c.add9` writes C E G D, a major ninth struck at once under fingers 1-2-3-5 (`make_open_voicing` docstring says the add9 is a large-hand voicing declared in `family_contracts.json`); `rock.5` offers it with no hand-size note.
- `docs/generated/ladder.md:149-150` marks `rock.4` and `rock.5` "song-optional"; the unit JSON agrees. `rock.4` has one song option only and says so (`rock.4.md:50-53`).
- The 425 CSV and Fable's `rock.5` primary label for Annie's Song both rest on the LH open fifth, not on the chord-symbol set (section 5.2).
