######## improv-compose
## 2. Current coverage

CONTROL / MODEL / MUSIC / INDEPENDENCE stations per major ability. "Lab", "Simon", "Free play", "Trading fours", "Listen back" are the app tools named in the lessons; I verified in the app source what each does (section 7).

**A. Improvising over a loop or form (rhythm first, space, answering)**
- CONTROL: `improv.3.md:21-26` (one note, rhythm and silence first, then 2-4 notes); `drill.improv.loop-i-iv-v` (8 bars C C C C F F G G, 72 bpm, `scored:false`, `catalog.static.json` id `drill.improv.loop-i-iv-v`).
- MODEL: none. No real excerpt, tune or lead sheet shows what a good answer or a good chorus looks or sounds like (`songOptions: []` on improv.3, .4, .6 to .9; improv.5 lists generated shuffle exercises only).
- MUSIC: the loop and blues bed are the music; `improv.3.md:50-52` how-you'll-know (three choruses, each phrase answered, a full bar of silence, hum something back). Self-checked.
- INDEPENDENCE: `improv.4.md:65-67` (one chorus from a single motif), `improv.5.md:23-26` (landmarks at bars 5, 9, 12), `improv.6.md:25-27` (choose a rhythm first). Learner chooses what to play; there is no step where the learner picks the bed, key or form unprompted (the lab key picker is offered: `improv.4.md:57-58`).

**B. Pentatonic and blues scale**
- CONTROL: `improv.4.md:12-17`; `improv.5.md:12-21`; Simon blues scale (`drill.ear.simon-blues-c`, `improv.5.md:46-49`) and the blues-scale exercise.
- MODEL/MUSIC: `improv.4.md:19-25` over C-Am-F-G; `improv.5.md:23-26` over twelve bars; lab "Blues - twelve bars" counts notes in the blues scale (`improv.5.md:51-52`).
- INDEPENDENCE: none beyond how-you'll-know (`improv.5.md:60-62`).

**C. Call and answer / question and answer**
- CONTROL: the "Answer the phrase" drill is an echo (`improv.4.md:27-29`: marks you right only if you play the same notes back). It trains the ear, not the answer, as the lesson says.
- MODEL/TRANSFER: `improv.4.md:29-37` three rules for an answer (match rhythm, end more settled, keep register); Trading fours, two bars each (`improv.4.md:58-63`).
- MUSIC/INDEPENDENCE: `improv.4.md:65-66` four answers to four different calls. Calls are app-generated from the loop's harmony (`app/src/engine/tradingFours.ts` header, "The call is generated"), never a real tune.

**D. Motif and its development**
- `improv.3.md:33-35` (motif, repeat, step higher, longer last note); `improv.4.md:39-43` (repeat, sequence, inversion, augmentation, compression); `improv.4.md:66-67` a chorus from one motif. CONTROL and MUSIC are the same activity (improvising); no MODEL (no real tune analysed); INDEPENDENCE implied by the improvised chorus. Not revisited after improv.4 except `improv.5.md:35-37` (bars 3-4 "the idea varied", bars 7-8 "the idea returning").

**E. Guide tones, chord-scale pool, rhythm-first over changes**
- CONTROL: `improv.6.md:15-19, 29-30` (3rd and 7th of each chord; ii-V-I in three keys); exercises `exercise.ii-v-i.c`, `exercise.voicing7.c.shell`, `drill.jazz.chord-scale`, `drill.theory.modes`, `exercise.comping.c.charleston` (`stage-6.json`).
- MODEL: none. MUSIC: lab on the minor vamp, chord tones lit (`improv.6.md:37-44`). INDEPENDENCE: `improv.6.md:50-51` land on a chord tone at the start of each bar "without planning it". Self-checked.

**F. Colour and texture ("a sound of your own")**
- `improv.7.md:14-22, 24-27`: quartal voicings, extensions as colour, constraint (three notes and one rhythm for two minutes). CONTROL: `exercise.open-voicing.c.quartal`, `drill.jazz.extended-chords` (`stage-7.json`). MUSIC: the two-minute constrained improvisation (`improv.7.md:29-31`). INDEPENDENCE: "a constraint you wrote down first" (`improv.7.md:30-31`) is the first place the learner sets their own constraint. This is the track's only "choose texture" step, and it is a choice of sound for an improvisation, not of accompaniment texture for a written piece.

**G. Reharmonisation**
- CONTROL: tritone substitution and approach chords (`improv.8.md:15-21`); exercises `exercise.tritone-sub.c/.f`, `exercise.turnaround.c.iii-vi-ii-v`, `drill.jazz.extended-chords-13` (`stage-8.json`).
- MODEL: none (no tune is supplied; `songOptions: []`; the genre plan's Autumn Leaves, Summertime, Danny Boy are not attached to the rung).
- MUSIC: three reharmonised versions of eight bars, written down (`improv.8.md:28-29, 31-32`); lab "Play the tune" with typed numerals (`improv.8.md:37-46`). INDEPENDENCE: "the tune has to survive" (`improv.8.md:34-35`) is a stated test the learner applies.

**H. Writing an 8-bar melody** (the only whole-melody writing task before improv.9)
- `improv.5.md:33-37`: improvise, record, listen back, keep two good bars, build the other six: bars 1-2 idea, 3-4 idea varied, 5-6 contrasting, 7-8 idea returning with an ending (A A' B A''). This is the track's one real composition recipe. CONTROL: none separate. MODEL: none. MUSIC: the melody itself. INDEPENDENCE: not asked again. Requirement text `stage-5.json` `eight-bar-melody-written`, unjudged.

**I. Writing a finished piece in a form**
- `improv.9.md:15-17` ABA with a contrasting B (quieter, another key or a different LH); `improv.9.md:19-20` write the ending first; `improv.9.md:22-24` take it down from yourself; `improv.9.md:26-27` same piece daily. CONTROL: `drill.ear.tune-long` (generated 8-bar tune playback, `catalog.static.json`), plus harmony exercises (`drill.theory.roman-numerals-secondary`, `exercise.slash-bass.e-flat`, `exercise.open-voicing.f.quartal`, `exercise.open-voicing.c.sus2`, `exercise.voicing.a`) that are vocabulary, not composition. MODEL: none. MUSIC: the piece. INDEPENDENCE: this is the track's independence rung by construction (the repertoire is "Your piece", `improv.9.md:29`).

**Trace requested by the brief: where the learner does each composition act**

| act | where (file:line) | status |
|---|---|---|
| change an ending | `improv.3.md:28-31` (answer "same rhythm, different ending"); `improv.4.md:33-35` (end somewhere more settled) | present, inside improvisation; no written "rewrite the last bars" task |
| write a two-bar answer | `improv.4.md:27-37, 65-66` (played, not written) | present as playing; not a written task |
| four-bar question/answer | `improv.4.md:29-30, 58-63` (two-bar call + two-bar answer); `blues.9.md:12-14` (4+4+4 chorus, other track) | present as playing |
| eight-bar melody with a motif | `improv.5.md:33-37`, requirement `eight-bar-melody-written` (unjudged) | present once |
| harmonise it | none in this track (grep over `content/lessons/*.md`, pattern `harmonis|harmoniz|your own melody`: only `hymns.4.md:26`, `hymns.6.md:6`, `improv.8.md`, `jazz.7.md:40`, `jazz.8.md:42`, `3.2.md:50`, `chords-pop.4.md:55`, none of which asks the learner to put chords under a melody they wrote) | absent |
| form (ABA, binary) | `improv.9.md:15-17` only in this track; `improv.5.md:35-37` implies A A' B A''; `jazz.7.md:48` (AABA 32-bar, other track) | one paragraph, no earlier small-form task |
| develop a motif | `improv.3.md:33-35`; `improv.4.md:39-43, 66-67` | present, as improvisation; not as a written development |
| reharmonise | `improv.8.md:12-49` | present; substrate left to the learner ("a tune you know") |
| compose over a form | `improv.9.md:15-24` (form chosen, no form supplied as a bed); blues own-chorus in `blues.8.md:33`, `blues.9.md:12-14` (other track) | thin |
| choose texture | `improv.7.md:14-31` (sound for improvisation); `chords-pop.9.md:12-36` (arranging, other track) | partial |
| revise after listening | `improv.5.md:34-36, 39-44` (Listen back); `blues.9.md:35-39` (other track: record, listen once, delete) | one rung; no Listen back tool exists at improv.6 to improv.9 (it is built only into the backing-track drills: `DrillScreen.ts:3043-3045` shows it only when the drill is a `BackingTrackDrill`) |
| notate a finished miniature | `improv.9.md:12-13, 41-42`; `improv.5.md:60-62`; `improv.8.md:28-29` | stated as required; no instruction, no tool (section 3 item 2) |

**Trace requested by the brief: transcription of short real phrases (transcribe 1-2 bars, play, vary one element, integrate)**

Scope of the absence claim: the seven improv lessons read in full, plus grep over `content/lessons/*.md` (109 files) for `transcrib|lick|take down|taking down|by ear`. Findings:
- `theory.4.md:41-46`: melodic dictation of an app-generated eight-note phrase; "Contour first, then detail" (a transcription method, in another track).
- `theory.9.md:12-14, 30-31, 43`: "Take down eight bars. Melody and harmony, by ear", "Write it out"; the source of the eight bars is the generated ear-tune drill, not a real recording.
- `improv.9.md:22-24`: "take it down from yourself ... the same way you would take down somebody else's tune."
- `blues.9.md:12-17`: "a solo built from licks does not [sound finished]" (cautions against licks; no lick-taking task).
- No lesson asks the learner to take 1-2 bars of a real tune or solo from a recording, play it, vary one element and use it in an improvisation (Berklee outcome "transcribe and internalize phrasing from master improvisers"; dossier TRACK 10 lines 1139-1144). Transcription of real phrases is absent; transcription of generated phrases and of the learner's own playing is present.

**Improvisation strand against the external outline**

Berklee Basic Improvisation (URL in section 0) against this track:
- pentatonic scales, blues forms, call-and-response: `improv.4`, `improv.5` (covered).
- rhythmic synchronisation with ensembles: rhythm-first in `improv.3.md:21-24`; ensembles in `jam.*` (other track) (covered).
- melodic motifs, blue notes, complete-solo structure: `improv.4.md:39-43`, `improv.5.md:12-21`, `blues.9.md:12-14` (covered).
- minor blues: not in this track (improv.6 uses the minor vamp only as a bed). Scope: improv.3 to improv.9 read in full; not searched in the blues track.
- chord tones and chord-scale soloing: `improv.6.md:15-23` (covered, guide tones first).
- chromatic approach techniques and combining them: absent from improv.3 to improv.9 (read in full); `jam.6.md:23-26` teaches one approach note, in another track.
- transcribe and internalise phrasing from master improvisers: absent (above).
- synthesis into personal improvisations: `improv.7.md:24-48`, `improv.9`.

Trinity (second source): its three stimuli map onto this track as stylistic (improvise over an accompaniment: the lab, improv.3 to improv.6), harmonic (improvise from a chord sequence: improv.6 types its own `ii7 V7 I`), and motivic (improvise from a short melodic fragment given to you). The motivic stimulus has no counterpart: the learner invents their own motif and never improvises from a supplied fragment (calls are generated and answered, `tradingFours.ts`, not developed). Source disagreement: Berklee sequences chord tones and chromatic approach before synthesis; Trinity is stimulus-based and carries no chord-scale requirement. Recorded; the track's guide-tone-first choice is consistent with Berklee and is not contradicted by Trinity.

## 3. Missing or weak abilities

1. **Harmonising your own melody.** Why it matters: the track promises composition, and the learner who writes eight bars at improv.5 never puts chords under them, then reharmonises somebody else's tune at improv.8 (`improv.8.md:12-13` calls reharmonising "composition with the melody already written"), then writes a piece at improv.9 whose harmony is unprompted. Evidence: dossier lines 1124-1126 ("harmonize it"); packet section 8 ("harmonization"). Scope: improv.3 to improv.9 read in full and the grep in section 2. Severity: foundational bridge for the composition half. The tools exist to do it (lab with a typed progression and "Hold the chords" bed, `improv.4.md:52-57`, `improv.6.md:37-41`); no lesson asks for it.
2. **Writing it down.** The track description and `improv.5.md:60-62`, `improv.8.md:28-29`, `improv.9.md:12-13, 41-42` all require written music; no lesson in `content/lessons/*.md` (grep `staff paper|manuscript|notation software|MuseScore|write it out`: only `theory.9.md:31` "Write it out" and `blues.8.md:33`) says how to write it down, and the app has no notation entry or export of a played take (`DrillScreen.ts:522-523, 2989` keeps the notes in memory only; grep over `app/src` for MIDI-file or MusicXML export of a recording found none; D7 itself says "notation export is a later feature", `docs/02-curriculum.md:623-624`). The lessons also tell the learner in opposite directions: `improv.3.md:39-41` and `improv.5.md:43-44` say the recording is not saved ("nothing to save"), `improv.5.md:34-36` says to keep two good bars from it, `improv.7.md:33-34` says "Record ... and keep one a week", `improv.9.md:31-36` says "no record kept". `blues.9.md:35-39` resolves it ("record it on whatever is in your pocket") but improv.7 and improv.9 do not. Severity: foundational bridge for the endpoint "notate a finished miniature"; depth for the early rungs.
3. **Transcribing real phrases and using them.** Evidence: Berklee outcome (section 0), dossier lines 1139-1144. Scope as in section 2. Severity: depth (the app has no audio of real solos; the catalog's own tunes could serve as the source phrases, which would also supply MODEL material).
4. **Models of composition in real music.** Nothing asks the learner to find the question/answer, the A A' B A'' shape, the motif's development or the contrast section in an existing tune before writing one. Scope: the seven lessons plus grep for `antecedent|consequent|question.{0,20}answer` over `content/lessons/*.md` (no hit about phrase structure; the only hits are "Classical-period"). The genre plan lists catalog tunes for each rung (Clementine, Amazing Grace, Sakura, Scarborough Fair, Greensleeves, Danny Boy, Summertime: `docs/genre-plans/improv.md`) but none is attached (`songOptions: []`). Severity: depth. Packet rule "repertoire first" (memory) favours a verified real excerpt; I do not propose which tune.
5. **Revise after listening beyond improv.5.** One rung asks for it (`improv.5.md:39-44`). improv.6 to improv.9 have no listen-back tool; the learner's only revision mechanism is memory or an outside recorder. Severity: depth.
6. **Written compositional development of a motif** (as opposed to improvised). `improv.4.md:39-43` lists the devices as "decision[s] you can make in real time"; no task has the learner write a motif and its inversion or sequence. Severity: depth.
7. **Chromatic approach notes and enclosures** between guide tones (Berklee weeks 9-11). Scope as in section 2. Severity: depth (needed for improv.6's "land on a chord tone at the start of each bar" to become a line, but `jam.6.md:23-26` carries one approach note).
8. **Minor blues** (Berklee weeks 3-4) and **improvising from a supplied motif** (Trinity motivic). Severity: enrichment.
9. **LH ostinato and modal vamp as designed in D7 stage 6** (`docs/02-curriculum.md:621`) are not in improv.6 as shipped; `rock.4` and `rock.6` teach ostinato, `improv.6.md` does not mention it. Design-versus-lesson difference recorded; severity enrichment (the track as shipped does not promise it).
10. **Arranging a PD song** (D7 stage 7+) has no rung here; `chords-pop.9` covers arranging from a chart. Recorded.

## 4. Sequencing concerns

- **The 8-bar melody is asked once and then dropped.** improv.5 (`improv.5.md:33-37`) is the only eight-bar-melody task; improv.6 and improv.7 are improvisation-only (`improv.6.md:12-51`, `improv.7.md:12-48`); improv.8 returns to eight bars but of someone else's tune; improv.9 jumps to a two-to-three-minute piece (`improv.9.md:12`). Nothing sits between "eight bars" and "a finished piece" (no 16-bar, no binary, no ABA in miniature). A topic list rather than a development at this point.
- **improv.5 to improv.6 is the sharp step.** improv.5 level band 3.4-5.1, improv.6 band 5.4-7.2 (`stage-5.json`, `stage-6.json`). The unit declares only `prerequisites: ['improv.5']`. improv.6 depends on seventh chords, ii-V-I and modes (`improv.6.md:15-23`) taught in other tracks (`chords-pop.5`, `theory.5`/`theory.6` per the theory lessons' own text); the dependency is not declared. I did not trace those prerequisite edges in full; treated as a lead, not a finding.
- **"Chord tone" is used before it is taught as a target.** `improv.5.md:23-24` asks the learner to land on a chord tone at bar 5 and bar 9; guide tones and chord tones as a method arrive at `improv.6.md:15-19`. Core triad lessons supply the term, so the use is intelligible; the targeting skill is introduced early and only practised formally one rung later. Low severity.
- **improv.4 asks for stage-3 skill on a stage-4 tool.** `improv.4.md:52-57` opens the lab in a different key from the loop drill (`ballad` preset is F major: `app/src/engine/sightReading.ts` preset `ballad`, `keyId: 'f-major'`), while the lesson says "Use C major pentatonic throughout" for the C-Am-F-G loop (`improv.4.md:19-21`); the lesson does say "Change the key" (`improv.4.md:57-58`). Minor; the learner can reconcile it.
- **improv.7 (colour) sits between guide tones and reharmonisation without a bridge.** It is a sound-world rung (`improv.7.md:12`), with the ear and constraint work the later composition rungs need, but its CONTROL exercises (quartal shapes, extensions) are vocabulary, not a compositional skill. Acceptable as a rung; recorded that it contributes no composition act.
- **The how-you'll-know tasks are heavier than the rungs' stated time.** `improv.9`'s estimated 180 days (`stage-9.json`) is realistic for a finished piece; improv.7's 120 days (`estimatedDays`) for "one extension a day in five keys" plus a weekly improvisation is not a sequencing fault. No finding.

## 6. Practice and material sufficiency

- **Practice gates measure the wrong activity.** `rungState.ts:199-203` states "a backing track's constant 0 is not judged", so a run of `drill.improv.loop-i-iv-v`, `drill.improv.loop-four-chord` or `drill.improv.blues-backing` (all `scored: false` in `catalog.static.json`) cannot meet a `runs` requirement. Consequently the `runs: 2` requirement on improv.3 (`stage-3.json`) can only be met by the two cadence exercises (`exercise.cadence.c.root`, `exercise.cadence.c.voice-led`); on improv.4 by `drill.improv.call-response` (an echo) or the LH broken-chord exercise; on improv.5 by the blues-scale, shuffle, call-response or Simon items; on improv.6 to improv.9 by one exercise run at 0.9 accuracy and 0.85 tempo (`mastery`, `stage-6.json` to `stage-9.json`: ii-V-I, shell voicings, quartal shapes, secondary-dominant numerals, sus2). So the app's own completion test never asks the learner to improvise, write, or finish a piece. The track's real abilities are covered by `unjudged` requirements (improv.3 to improv.5 only: `three-choruses-recorded`, `four-answers-recorded`, `eight-bar-melody-written`), which "bind nothing" (`app/src/engine/Scoring.ts:1145-1147`, `rungState.ts:432-433`). improv.6 to improv.9 have no `unjudged` requirement at all, so their how-you'll-know sentences (`improv.6.md:50-51`, `improv.7.md:47-48`, `improv.8.md:48-49`, `improv.9.md:41-42`) are not surfaced as a rung rule. Recorded as measurement honesty and as an advancement fact; not acted on.
- **Controlled practice in the track's own activity is thin after improv.5.** improv.6 to improv.9 each provide one lab or Free play screen that judges nothing, and the lessons say so honestly. Quantity of tasks is small (what to practise: `improv.6.md:29-30`, `improv.7.md:29-31`, `improv.8.md:28-29`, `improv.9.md:26-27`); that is a consequence of the unmeasurable subject, not a defect in itself, but no rung revisits an earlier composition act.
- **Revisiting:** rhythm-first and space (improv.3) is repeated at `improv.6.md:25-27` and `improv.6.md:34-35`; motif at improv.3, improv.4, improv.5 (bars 3-4, 7-8); form at improv.5 (A A' B A'') and improv.9 (ABA). Writing a melody (improv.5) is not revisited as a task. The chord tone (improv.5 bars 5 and 9) is revisited at improv.6.
- **Transfer:** improv.4 to improv.9 do not name a real piece. improv.5's "Repertoire" is the generated twelve-bar shuffle in C, F and G (`stage-5.json` `songOptions`: `exercise.blues.twelve-bar-shuffle.c/f/g`; ladder: 3 songs at levels 3.4, 4.1, 4.1), used "as the form to improvise over" (`improv.5.md:28-31`): substrate under a learner task, judged as substrate. improv.6 to improv.9 say "Not required", "Your own", "The three versions", "Your piece" (`improv.6.md:32`, `improv.7.md:33`, `improv.8.md:31`, `improv.9.md:29`). Primary material and transfer material are not confused: the track has none of the second kind. The audit CSVs have no row for this track, so no row relied on.
- **Substrate for improv.8.** The lesson asks for "eight bars of a tune you know" (`improv.8.md:28`) and the lab's "Play the tune" supplies the app's generated melody for a ii-V-I (`improv.8.md:41-44`); the learner must supply the tune and its original changes from elsewhere (the finder at `stage-8.json` asks for "a well-known melody with its original changes"). The genre plan's candidates (Autumn Leaves in the archive by CID, Summertime and Danny Boy in the catalog: `docs/genre-plans/improv.md`, stage 7 table) are not attached. Recorded as a material gap, not as a demand to build.
- **Generated families:** `drill.improv.*` are four runtime-generated drills and `drill.ear.tune-long` (8 bars, 4 phrases, key G only: `catalog.static.json` params `keys: ["G"]`). One key and one length: thin. Recorded only.

## 8. Recommended changes

Ranked. None is a generator rewrite or a detector.

1. **Add a "harmonise your own eight bars" step.** Learner problem: writes a melody (`improv.5.md:33-37`) with no harmony, then reharmonises another's tune. Smallest change: one paragraph and a how-you'll-know line at improv.5 or improv.6 telling the learner to choose chords for the eight bars they wrote, using the lab with a typed progression and "Hold the chords" (the tool exists). Evidence: section 3 item 1, dossier lines 1124-1126. Deletes nothing; extends one rung. Classification: fix (wording and task), not a new unit.
2. **Make "written down" teachable.** Learner problem: the track's description and three rungs require written music with no instruction or tool; recording is simultaneously "not saved" (`improv.3.md:39-41`, `improv.5.md:43-44`) and "keep one a week" (`improv.7.md:33-34`). Smallest change: one honest paragraph (at improv.5 and again at improv.9) saying how the learner writes it down, either on paper in notation or by entering it in free notation software and importing the MusicXML to the shelf (the shelf and import exist: `classical.4.shelf.md:40`), and that recording a take is something done with an outside recorder (the sentence `blues.9.md:35-39` already uses). Whether the app should ever enter or export notation is a product decision recorded as a scoped-out gap (D7 itself defers it, `docs/02-curriculum.md:623-624`). Classification: fix for the wording; scoped-out gap for notation entry.
3. **Correct the three small factual overclaims and the tool sentences** (`improv.7.md:39-42` Free play and fourths; `improv.4.md:15-17` black keys; `improv.5.md:19-21` "that single fact"; `improv.8.md:15-21` "works everywhere" and "any chord"; `improv.6.md` lab key and numeral mismatch; the `four-answers-recorded` requirement text). Each is a sentence-level edit with the source in section 5. Classification: fix.
4. **Surface the lesson's own rule on improv.6 to improv.9** as an `unjudged` requirement (improv.3 to improv.5 already have one), so a completed rung does not read as "one exercise passed" for an ability the exercise does not measure. Evidence: section 6. Classification: fix; no new measurement is proposed.
5. **Add one real-phrase task** (take 1-2 bars of a real tune from the catalog, play it, change one element, use it in a chorus) at improv.4 or improv.5, using a catalog tune the genre plan already names rather than a generated phrase. Evidence: Berklee outcome; dossier lines 1139-1144; the lessons' absence (section 2). Classification: scoped-out gap or a new task in an existing rung, not a new unit; the owner need not decide.
6. **Attach a substrate to improv.8** (a catalog tune with its changes) so "a tune you know" has a default. The genre plan lists candidates; the audit has not looked at them (no PDMX placement for this track), so I do not name one. Classification: scoped-out gap pending an exact-edition check.
7. **Optional enrichment, not required for the endpoint:** one paragraph on chromatic approach notes after the guide-tone work (Berklee weeks 9-11), improv from a supplied motif (Trinity motivic), minor blues. Classification: scoped-out gaps.

## 11. Cross-track abilities (A to F)

- **A. Sight-reading as a continuing strand:** not touched by this track (no improv lesson reads unseen music; scope: improv.3 to improv.9 read in full). `theory.9.md:20-24` carries it in the theory track.
- **B. Transposition recurring:** touched. `improv.4.md:57-58` (change the key when the pentatonic "starts playing itself"), `improv.6.md:29-30` (ii-V-I "in three keys"; but see section 5 item 10, the lab's key is locked), `improv.7.md:29-30` (one extension a day in five keys), `improv.5.md:46-48` (lab key set by the learner). improv.8 and improv.9 do not ask for transposition.
- **C. Memory as structure plus retrieval:** partly. Form-first is taught (`improv.9.md:15-20`, ending first, ABA; `improv.5.md:35-37`), and "can play from memory" appears once (`improv.5.md:61-62`). No cold start, no restart from a landmark, no recovery after interruption. (Those are in `blues.9` and `jazz.*` "Play it blind", other tracks.)
- **D. Ear training with production:** touched. Production by hum and by ear: `improv.3.md:51-52` (hum back something you played, self-checked), `improv.4.md:27-29` (echo drill), Simon blues scale (`improv.5.md:46-49`), `improv.9.md:22-24` (take down from yourself, backed by `drill.ear.tune-long`). Recognition without production is not what this track does.
- **E. Score study before playing:** not touched by this track. improv.8's "ask what the melody note could be" (`improv.8.md:23-26`) is analysis of a melody before harmonising, a related habit, not a score-study step. No lesson here asks the learner to inspect form, sections or texture of a written piece before playing it.
- **F. Performance and recovery:** weakly. "Would play to somebody" (`improv.5.md:61-62`) and "prepared to let someone hear it" (`improv.9.md:41-42`); no cold start, no recovery from a breakdown during a chorus, no no-stopping run. A silence and "answer a mistake with space" idea is implicit at `improv.3.md:43-44` and `improv.6.md:34-35` but not stated as recovery.

