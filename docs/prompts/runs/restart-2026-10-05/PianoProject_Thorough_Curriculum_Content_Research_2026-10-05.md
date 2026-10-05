# PianoProject — Thorough Curriculum & Content Research Dossier
## Pre-research for Fable’s curriculum completeness/correctness gate

**Prepared:** 2026-10-05  
**Repository baseline inspected:** `Rilay9/PianoProject@cb44f417d4ea99e8a72bd815058beaadba3ebcc7`

## Status and scope

This is a **research dossier and candidate map**, not the final curriculum verdict.

It covers the **15 current track families at a high level** and identifies:
- external benchmarks worth using;
- likely missing or underweighted abilities;
- high-value correctness questions;
- exact PDMX candidates already known from the repository’s earlier whole-archive searches;
- places where generated content can improve;
- places where a library/reference implementation can reduce custom responsibility;
- what Fable still needs to verify against the exact current lessons and options.

It does **not** claim:
- that 15/15 tracks are pedagogically verified;
- that every current rung has been reread during this research pass;
- that an `IN ARCHIVE` PDMX candidate is a good transcription;
- that historical `docs/genre-plans/*.md` placement decisions still match the current curriculum.

The old genre-plan files are valuable here mainly because they record **whole-archive PDMX searches over 254,077 rows and exact CIDs**. Their musical/placement decisions remain historical evidence only.

---

# 1. The most important research result

A good PianoProject curriculum should not be evaluated by:

> “Does each concept occur somewhere?”

It should be evaluated by whether important abilities travel through a development cycle:

## CONTROL → MODEL / TRANSFER → MUSIC → INDEPENDENCE

1. **CONTROL**  
   An exercise isolates the new problem enough that the learner can acquire it.

2. **MODEL / TRANSFER**  
   A real excerpt, simple piece, lead sheet, or structured task makes the skill work in musical context.

3. **MUSIC**  
   The skill contributes to a satisfying full piece, arrangement, improvisation, accompaniment, or performance.

4. **INDEPENDENCE**  
   At later stages the learner can recognize when the skill is useful, choose it, recover when it fails, and apply it without being led through every step.

Not every rung needs four separate items. But a major ability should not be taught once and then disappear.

This is consistent with:
- ABRSM Practical Grades keeping repertoire, scales/arpeggios, sight-reading, and aural work developing in parallel through Grade 8;
- RCM sequencing technical work, sight-reading, rhythm reading, ear training, and theory over levels;
- Faber repeatedly revisiting reading, transposition, technique, memorization, repertoire, and sight-reading instead of treating them as one-off topics.

### Sources
- ABRSM Piano Practical Grades: https://www.abrsm.org/en-ag/piano
- ABRSM 2025–26 Piano Practical syllabus: https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20%26%202026%20Prac%20syllabus%2020240524_access.pdf
- RCM Piano Syllabus 2022: https://teacherportal.rcmusic.com/getattachment/57f3734d-97e5-4777-b67e-4b1111ee31a3/piano-syllabus-2022-edition.pdf
- Faber Primer reading process: https://pianoadventures.com/piano-books/basic-piano-adventures/primer/q-and-a/
- Faber Level 4: https://pianoadventures.com/piano-books/basic-piano-adventures/level-4/things-to-know/

---

# 2. Cross-track abilities that deserve explicit recurrence

These are the strongest cross-cutting additions/questions from the research.

## 2.1 Sight-reading must stay separate from repertoire learning

PianoProject already made a good decision by putting a short sight-reading slot into regular sessions.

External methods strongly support keeping this alive as repertoire becomes harder:
- ABRSM retains unseen sight-reading at every Practical Grade.
- RCM keeps rhythm reading and sight playing as continuing musicianship work.
- Faber explicitly warns that harder repertoire takes longer to learn, so separate sight-reading material protects reading fluency.

### Fable check
Track when reading moves from:
- directional / guide-note reading;
- intervals;
- multi-position reading;
- key signatures;
- compound rhythm;
- polyphony;
- denser textures;
- larger leaps / faster processing.

The sight-reading generator should have a source-backed progression rather than an internally invented generic “level.”

---

## 2.2 Transposition should recur, not live in one lesson

Faber uses transposition very early because it reinforces:
- intervallic reading;
- theory;
- pattern recognition;
- keyboard geography.

For PianoProject it also matters later for:
- chord charts;
- singers;
- jazz standards;
- blues in multiple keys;
- jam sessions;
- hymns;
- pop accompaniment;
- improvisation.

### Recommendation
Make transposition a recurring transfer task:
- Stage 1–2: transpose a five-finger pattern / tiny melody.
- Stage 3–4: transpose I–IV–V and short tunes.
- Stage 5–6: transpose chord charts and accompaniment patterns.
- Stage 7–8: transpose a lead-sheet tune, blues, voicing pattern, or improvised chorus.
- Stage 9: choose a practical key under time pressure.

---

## 2.3 Memory should mean structure + retrieval, not only “play without page”

Research on expert piano memory by Chaffin/Imreh and Williamon shows formal structure and deliberate retrieval cues matter in expert memorization. More advanced pianists increasingly organize practice around structural locations rather than only the bars that feel difficult.

### Sources
- Chaffin & Imreh, *Practicing perfection: piano performance as expert memory*: https://pubmed.ncbi.nlm.nih.gov/12137137/
- Williamon et al., *The role of retrieval structures in memorizing music*: https://pubmed.ncbi.nlm.nih.gov/11814308/
- Williamon & Egner, *Memory structures for encoding and retrieving a piece of music*: https://pubmed.ncbi.nlm.nih.gov/15561499/

### Recommendation
Add/reinforce:
- identify form before memorizing;
- start from multiple structural landmarks;
- cold-start from arbitrary sections;
- practice transitions;
- recover after a deliberate interruption;
- name harmonic/formal cues;
- distinguish motor memory from aural/harmonic/visual/form memory.

This is more useful than simply making “Blind mode” the endpoint.

---

## 2.4 Ear training should include production, not only recognition

RCM and Berklee both include forms of:
- melody playback;
- rhythm performance;
- transcription;
- harmonic hearing;
- connecting sound to notation/function.

Berklee’s ear-training curriculum repeatedly uses **singing/solfège, conducting, transcription, and playback**, not only multiple-choice recognition.

### Sources
- Berklee Ear Training Fundamentals: https://online.berklee.edu/courses/ear-training-fundamentals
- Ear Training 1: https://online.berklee.edu/courses/ear-training-1
- Ear Training 2: https://online.berklee.edu/courses/ear-training-2
- Harmonic Ear Training: https://online.berklee.edu/courses/harmonic-ear-training-recognizing-chord-progressions
- RCM syllabus above.

### Recommendation
Even if the app cannot score the voice:
- sing a scale degree before playing it;
- clap/conduct rhythm before playing;
- sing bass/root;
- play back short melody;
- transcribe short rhythm/melody;
- hear progression and find it at keyboard;
- compare imagined note with played note.

The app should state when these are self-checked rather than pretending MIDI verifies audiation.

---

## 2.5 Score study should become an explicit skill

Before playing an intermediate/advanced piece, the learner should increasingly learn to inspect:
- key/metre;
- form;
- recurring patterns;
- difficult transitions;
- hand distribution;
- fingering hazards;
- cadences;
- texture;
- likely practice units.

This is useful across classical, jazz arrangements, ragtime, holiday projects, and imported repertoire.

### Recommendation
Add a reusable “Before you play” task rather than another detector:
1. identify key/metre;
2. find repeats/sections;
3. mark hardest-looking passage;
4. name recurring accompaniment;
5. choose 2–4 structural starting points.

---

## 2.6 Performance preparation deserves its own recurrence

A learner can be good at repair practice and still fail at a one-pass performance.

Useful recurring tasks:
- cold start;
- one no-stopping run;
- record and listen;
- recover after a mistake;
- restart from a structural point rather than the beginning;
- simulate audience pressure;
- evaluate musical priorities after playback.

PianoProject already has Performance mode. The missing question is whether lessons explicitly teach how to use it.

---

# 3. Generated content — deeper recommendation

## 3.1 Do not replace the existing generator wholesale

The repository already has **56 generator families** in `tools/content/family_contracts.json`.

That is enough architecture.

The contracts are unusually honest about what they can and cannot establish:
- scale: notes/timing yes; actual fingers, thumb passage, tone and evenness no;
- arpeggio: same;
- inversion drill: pitches/time yes; voicing balance/fingering no;
- music-family structural correctness does not establish musical quality.

The next gains should come from **better content definitions and better independent checking**, not a larger generator framework.

---

## 3.2 Four distinct generated-content jobs

### A. Canonical technical drills
Examples:
- scales;
- arpeggios;
- inversions;
- repeated notes;
- double notes;
- octaves;
- hand-independence patterns;
- canonical accompaniment figures.

Keep these intentionally drill-like.

Requirements:
- source-backed fingering where printed;
- physical bounds;
- exact notation/structure;
- variant keys/rhythms only when pedagogically useful;
- no “musical” quality claim.

### B. Progressive sight-reading
This deserves the most generator improvement.

Use external graded progressions to define:
- keys;
- metre;
- note values;
- range;
- hand position changes;
- texture;
- articulation;
- accidentals;
- rhythmic density;
- polyphony;
- length.

Then generate **musical phrases inside those limits**.

A promising design is a small provenance-preserving phrase grammar:
- 2- and 4-bar phrase templates;
- step/skip balance;
- motif repetition + variation;
- cadential endings;
- question/answer contour;
- simple bass archetypes;
- rhythmic cells allowed at that level.

Templates can be curated from public-domain pedagogical literature rather than inferred by a fuzzy “musicality” model.

### C. Named style/pattern drills
Examples:
- Alberti;
- oom-pah/waltz bass;
- broken chords;
- stride;
- boogie;
- walking bass;
- clave;
- tresillo;
- tumbao;
- montuno.

Use:
`sourced definition → generator contract → independent structural checker`

Do not revive a universal arbitrary-score detector.

### D. Musical mini-pieces
Highest-risk generator category.

Preference:
1. real public-domain excerpt;
2. simplified/authored arrangement of a public-domain tune;
3. curated phrase/harmony/accompaniment templates;
4. freer generated mini-piece only where the first three cannot serve.

Every family that promises “music” should be auditioned/curated.

---

## 3.3 Libraries and reference implementations

### music21 — KEEP / EXPAND NARROWLY
Already in project.

Good for:
- parsed pitches/durations;
- intervals/chords/keys;
- voice-leading checks;
- score structure;
- corpus analysis;
- independent checking of generated harmonic facts.

Its `voiceLeading` module includes explicit motion/resolution analysis.

Docs:
https://music21.org/music21docs/

Do not promote it into a pedagogy oracle.

### Hypothesis — HIGH VALUE
Strong candidate for generator adversarial testing:
- random keys;
- hands;
- spans;
- metres;
- rhythms;
- edge-note ranges;
- serialize/parse round trips;
- invariant checks.

Hypothesis explicitly recommends round-trip and equivalence properties and automatically searches/shrinks edge cases.

Docs:
https://hypothesis.readthedocs.io/en/latest/

### OR-Tools / CP-SAT — ONLY IF IT DELETES COMPLEX SEARCH
Potentially useful for one constrained generator whose search has become brittle.
Do not introduce as general generator architecture.

### Existing open-source sight-reading apps — REFERENCE, NOT AUTHORITY
Example found:
`ftrain/sightreading` — 23 progressive levels, procedural exercises, RH→LH→both, MIDI, MusicXML/Verovio.

Useful research questions:
- how it constrains progressive difficulty;
- how it avoids impossible/ugly material;
- whether its curriculum choices map onto ABRSM/RCM/Faber.

Do **not** copy/adopt merely because it exists. Its pedagogical quality has not been established here.

---

# 4. PDMX strategy — what the deeper pass found

## 4.1 Ratings/views are useful queue signals

The PDMX paper reports that user-rating statistics can be used as a useful quality signal. The CSV also records:
- rating;
- number of ratings;
- views;
- favorites;
- official flag;
- title/song/composer/artist metadata;
- track/program information;
- MXL path.

Sources:
- PDMX paper: https://openreview.net/pdf?id=BkCqkdKUtv
- PDMX January 2025 Zenodo record matching the repo’s archive record: https://zenodo.org/records/14648209

### Recommended ranking
Use metadata to decide **what to inspect first**, not what is pedagogically true.

Priority:
1. exact curriculum need / title match;
2. adequate rating count;
3. Bayesian rating;
4. views/favorites;
5. official flag as weak bonus;
6. actual score inspection.

Genre tag: advisory at most.

---

## 4.2 The repo has already done whole-archive searches

`docs/genre-plans/*.md` is an underused asset.

Those files searched the entire 254,077-row archive for named wants and record:
- IN CATALOG;
- IN ARCHIVE with exact CID;
- NOT FOUND.

They explicitly warn that nobody listened to the archive files.

So Fable should start from those CIDs rather than rerunning broad title searches.

---

# 5. Three missing rungs that already have archive candidates

These are the clearest immediate savings.

## 5.1 `latin.4` — habanera / tresillo

The current curriculum says this rung was not built because there was no catalog song.

But the older whole-PDMX search already found:

| Candidate | PDMX status | Example CID |
|---|---|---|
| La Paloma | 4 archive copies | `Qmcgs76azinB9yQhdDYdtxANyCGnNRoztYusifLBEC9rjr` |
| El Manisero | 1 archive copy | historical genre plan has exact archive row |
| Siboney | 1 archive copy | historical genre plan has exact archive row |
| Maria Elena | 1 archive copy | historical genre plan has exact archive row |

**Action:** inspect exact MusicXML, especially accompaniment rhythm and difficulty.  
A clean excerpt is sufficient if the whole arrangement is too hard.

The goal is not “find a song called Habanera.”  
The goal is an actual score/passsage where the learner can hear/see and perform the habanera/tresillo relationship.

Repo source: `docs/genre-plans/latin.md`.

---

## 5.2 `latin.8` — modern tango

Already found in PDMX:
- **Libertango** — 4 copies, example CID  
  `Qmbhyzu7ry2JY3k86aBoge32BSAitnn9YQE6G5US2UiCGc`
- **Oblivion** — 4 copies, example CID  
  `Qmb87WHov6CXsqUBMwmFyqa6GKinfsz9CMWhCNCQgG246e`

**Action:** inspect arrangement quality and actual musical vocabulary.

Do not trust PDMX composer strings blindly; historical PDMX metadata in the repo has known misattributions/mojibake.

---

## 5.3 `ragtime.4` — cakewalk before full ragtime

Already found:
- **At a Georgia Campmeeting** —  
  `QmY7h6JChL1C6qr1SetxcTPtNan4mtPaSjphi2QKZ6x9fw`
- **Whistling Rufus** —  
  `Qmc5tchYeaAXcWs6eadtwesTcn8oXiyJMvJYiSWxR87ZkY`
- **Harlem Rag** — archive copies recorded
- **Creole Belles** —  
  `QmQiUJZTS6rGpgqQJxthN2Bzckf9oZvpTw8bN3y8oxWAkp`

**Action:** look for a manageable excerpt that establishes:
- bass-chord / oom-pah foundation;
- early syncopated RH;
- cakewalk/rag precursor context.

This is especially valuable because current ragtime jumps into repertoire whose complete-score difficulty is already high.

Repo source: `docs/genre-plans/ragtime.md`.

---

# 6. Track-by-track research crosswalk

The following is **15/15 tracks considered for research direction**, not 15/15 verified curriculum tracks.

---

## TRACK 1 — CORE

### Current shape
Stages 0–4 form the common spine:
- orientation;
- first notes;
- two hands;
- keys/chords/reading;
- fluency/technique.

The design already includes:
- reading;
- two-hand playing;
- rhythm;
- chord symbols;
- keys;
- pedal basics;
- scales/arpeggios;
- sight-reading.

### External benchmark strengths
Faber strongly supports:
- experience before naming;
- directional/intervallic reading alongside note names;
- systematic small note-range expansion;
- transposition;
- lots of short sight-reading;
- physical technique concepts;
- memorization.

ABRSM/RCM support continuing:
- technique;
- sight-reading;
- aural;
- repertoire.

### Likely additions / checks

#### Stage 0
Verify:
- bench distance/height;
- relaxed alignment;
- hand shape as flexible rather than fixed;
- pain/tension warning;
- MIDI/app setup.

Do not overteach biomechanics the app cannot observe.

#### Stage 1
Strengthen:
- interval/directional reading;
- steady pulse independent of cursor;
- very short unseen reading;
- imitation and playback;
- transposition of tiny five-finger patterns.

#### Stage 2
Strengthen:
- two-hand independence beyond fixed C position;
- chord-symbol literacy;
- pattern recognition;
- short memory/retrieval;
- simple melody + chord task.

#### Stage 3
Make explicit:
- score preview;
- transposition across C/G/F/A minor;
- cadence awareness;
- basic pedal listening;
- sight-reading in multiple positions.

#### Stage 4
Protect parallel development:
- scales/arpeggios;
- unseen reading;
- advanced rhythm;
- phrase/articulation;
- structural memory;
- performance run.

### Fable priority
High. Core omissions propagate into every track.

---

## TRACK 2 — PRACTICE

### Current five lessons
1. Chunking and loops.
2. Slow practice / tempo ladder.
3. Interleaving / session structure.
4. Tension, pain, when to stop.
5. Plateaus / things to change.

Repo: `content/lessons/practice.1.md`–`.5.md`.

### Major research correction
The current `practice.3` is better hedged than its historical description, but still contains lines such as:

> “The second visit, after something else has intervened, is where the learning happens.”

That is too categorical.

Practice research is context-dependent:
- interleaving can improve retention/transfer in some music-practice settings;
- other studies find blocked practice can outperform interleaving for delayed retention on difficult excerpts;
- spacing findings in piano tasks are mixed depending task/learner/timescale.

### Recommendation: turn Practice into a diagnostic toolbox

Add/reinforce:

#### A. Acquisition vs retention
“Feels better now” is not the same as “is available tomorrow.”

#### B. Blocked practice has a legitimate job
Use it when:
- stabilizing a newly understood movement;
- solving a very specific passage;
- building enough fluency to test something.

Then vary/revisit when transfer/retention is the goal.

#### C. Retrieval / cold starts
Start from:
- section B;
- cadence;
- transition;
- arbitrary structural landmark.

#### D. Structural practice
Practice form/transitions, not only “hard bars.”

#### E. Record/listen
One run recorded, then identify:
- rhythm problem;
- balance problem;
- continuity problem;
- musical-shape problem.

#### F. Performance practice
No stopping; recover.

#### G. End mindless repetition
After a few unchanged failures, change:
- tempo;
- unit size;
- hand;
- rhythm;
- fingering/physical approach;
- context;
- task.

### Suggested change
Do not necessarily add ten new practice rungs.
Could make these permanent “practice tools” surfaced as the learner advances.

### Priority
**Very high**, because good curriculum content is wasted if practice strategy is poor.

---

## TRACK 3 — TECHNIQUE

### Current sequence from repo
- `technique.4` — scales, arpeggios, legato/staccato.
- `technique.5` — repeated notes, hand independence, 2:1, travelling line/dynamics.
- `technique.6` — seventh shapes, broken chords, rotation, Alberti, voicing.
- `technique.7` — double notes, thirds/sixths, octaves, pedal colour.
- `technique.8` — four-octave sixteenths, velocity/endurance, metronome last.

This is already broad.

### Main risk
The app can check note/time structure but not:
- finger choice;
- unnecessary tension;
- thumb passage quality;
- forearm use;
- tone production;
- voicing balance reliably;
- healthy octave mechanics.

The generator contracts already acknowledge this.

### Recommendation

Keep exact technical drills, but every physical topic should have:
1. a reputable demonstration/source;
2. a concise physical cue;
3. a self-check;
4. a stop condition;
5. a musical transfer example.

Examples:
- scale → phrase using the same key/passage;
- repeated notes → repertoire excerpt;
- rotation → broken-chord/alberti passage;
- voicing → chorale/romantic melody;
- octaves → controlled excerpt before virtuoso project.

### Potential missing/underweighted
- deliberate leap-landing practice;
- repeated-chord accuracy;
- rapid chord changes;
- relaxation between attacks;
- sound/balance self-listening;
- explicit technique transfer.

### Priority
High correctness, medium new-content volume.

---

## TRACK 4 — CLASSICAL

### Current historical progression
The genre plan tracks:
3. dances / five-finger shapes & shifts  
4. Grade-1 pieces / articulation / ornaments  
5. sonatina / Alberti / Romantic miniature  
6. melody-over-accompaniment / rubato / longer forms  
7. polyphony / sonata / octaves  
8. étude / fugue / Impressionism / project planning  
9. long-term project piece

### What is already strong
- varied periods/forms;
- escalating repertoire;
- duet/hand-focus/loops/performance modes;
- polyphony and form eventually appear.

### Strong additions/checks

#### Stage 3–4
- distinguish articulation by musical context, not “staccato means X milliseconds”;
- phrase/cadence awareness;
- simple ornament realization from source/style.

#### Stage 5
- sonatina form;
- Alberti acquisition + musical balance;
- edition/fingering awareness.

#### Stage 6
- melody projection;
- pedal listening;
- rubato over a stable underlying pulse;
- score study before playing.

#### Stage 7
- independence of voices;
- articulation differences between voices;
- sonata-allegro landmarks;
- memorize by form/harmony, not only repetition.

#### Stage 8
- stylistic pedal/color for Romantic/Impressionist repertoire;
- étude as a technical/musical study, not just “hard fast piece”;
- fugue subject/entries/voices.

#### Stage 9
- project planning over weeks/months;
- source/edition comparison;
- performance preparation;
- long-form memory/recovery.

### PDMX candidates already recorded
- K.545: `QmPaDt5oro5S5MxK47tRyuppCxwhyyTfe5568yRv4494KE`
- Pathétique candidate: `QmWEwo7KqesGn9PP1AVXaqEbUo4J17fDehkxCY7gncPZDw`
- Invention No.1: `QmeyZtPcEoyso7jNgUE9GYd6qPqJEA6UbYuRGnfJqJvmYg`
- Nocturne Op.9 candidate: `QmeE94j6WFzcwouwfE2LTAgfVMfeS4XM7ZyLtezSmrSLUt`
- Fantaisie-Impromptu: `QmcYxasH7fxcQvYNuNBjjKor8TGj2VsZFpTfqmfH8JFPYq`
- Revolutionary Étude: `QmfQKXZf9jRfYbvmZU8usVRg2ktCbtqbsJG6inTLH19D6g`

These are archive existence leads only.

### Priority
Medium-high. Repertoire supply is strong; interpretive pedagogy is the bigger question.

---

## TRACK 5 — CHORDS & POP

### Current track direction
Current lessons have evolved from the old genre plan, but the live sequence includes:
- chord symbols;
- inversions and pop progression vocabulary;
- sevenths/accompaniment;
- I–V–vi–IV / bass work;
- sus/add9/ninth vocabulary;
- transposition;
- arranging from chord chart.

### External benchmark
Berklee Keyboard Method and Pop/Rock Keyboard emphasize:
- voice-led triads;
- slash chords;
- shell voicings;
- guide tones;
- spread voicings;
- rhythmic comping;
- lead sheets;
- tensions;
- groove;
- choosing register/texture for context.

Sources:
- https://online.berklee.edu/courses/berklee-keyboard-method
- https://online.berklee.edu/courses/pop-rock-keyboard

### Likely additions

#### Stage 3
- chord symbol → actual voicing;
- roots vs inversions;
- transpose simple chart.

#### Stage 4
- voice leading as a **sound/efficiency** goal, not merely naming inversions;
- slash chords / bass-note awareness.

#### Stage 5
- several accompaniment textures on same progression;
- choose texture based on melody density/register.

#### Stage 6
- bass-line construction;
- harmonic function;
- simple secondary-dominant color if not already owned by theory.

#### Stage 7
- sus/add9/extensions with voice leading;
- rhythmic comping.

#### Stage 8
- practical singer-key transposition;
- ear → find tonic/bass/chords;
- play same song in two or three keys.

#### Stage 9
- intro;
- ending;
- countermelody;
- density/register;
- build/release;
- arrangement plan;
- record/listen/revise.

### Important probable omission
**Playing by ear from a recording.**

Suggested advanced task:
1. find tonic;
2. find bass/root;
3. infer progression;
4. reproduce chord rhythm;
5. add melody;
6. create personal arrangement.

### Existing archive leads
Historical whole-archive search found:
- Oh Susanna — `QmchjwvtpXykrxVrMHadPZLP7AHZ4ZgFjEg6qca7xpPFcm`
- Michael Row the Boat — `QmcqzVhKibAzLXXXehwFjozu9SNKJMj7KK12uNkQYH7mxj`
- Down in the Valley — `QmWuBBaf6uwZdiWHx1dm9meAW2tXnw6EV7hb93tnDTy3S4`
- Black Is the Colour — `QmYDRawzfxyPytD4oBwJC1jtMZFiQ36tXHPh632KBzS6D6`
- She Moved Through the Fair — `QmcoHVE1SwNJTx3RS7dhmpPWJwJB54LPmdCZkANptsNNqf`
- Georgia on My Mind — `QmUqUhQ5Whm9pMRaVGA9sfR5tMYDbMXEnRdUhTEaw8VUMp`
- Over the Rainbow — `QmWxdemawp7iraNct5dFHEwriXd6mqNAEcRyZ1WjmyiPbS`

Again: exact-score inspection required.

### Priority
High because it supports practical everyday piano.

---

## TRACK 6 — BLUES & BOOGIE

### Existing progression is promising
Historical plan:
3. blue notes + 12-bar awareness  
4. shuffle + boogie bass + form  
5. turnarounds / walking / F & G  
6. boogie LH / 12/8 / minor blues  
7. full-chorus improv / gospel-blues / New Orleans  
8. 12 keys + ninth  
9. fast boogie / stride-blues / transcription

This is close to a real developmental ladder.

### External benchmark
Berklee Blues and Rock Keyboard:
- blue notes;
- bass lines;
- grace notes;
- Mixolydian;
- Texas shuffle;
- comping;
- blues scale/triplets;
- calls/phrasing;
- intros, turnarounds, endings;
- rock-and-roll straight vs swing;
- walking/boogie bass;
- New Orleans style.

Source:
https://online.berklee.edu/courses/blues-and-rock-keyboard-techniques

### Highest-value additions/checks
- explicitly teach **intros/endings**, not only turnarounds;
- lick transcription by ear;
- keep LH groove while RH improvises;
- vary rhythmic phrasing, not only note choice;
- distinguish shuffle, straight, 12/8 slow blues;
- whole-chorus form memory;
- simplify while preserving groove;
- transcribe one short historical lick and transform it.

### Exact PDMX leads
- Joe Turner Blues — `QmXbcEgNyEXXfV5SKFQ4rK5eJi3xTtPJQm9kMVgM7GTWVK`
- Jelly Roll Blues — `QmbuoFtkky8Xpo8LSiAqkMXzBs2Mtc33L6GFw1kWv9T5S3`
- Farewell Blues — `QmStEZqKASQVCFNhKaHLcQm3R3RbDUPKA477NQ6kWsNToy`
- New Orleans Blues — `QmbQRktDiVKVCdRwZc7XKQ7gjJxdFRzHwD68nv7AQhtRtM`
- King Porter Stomp — `QmcHsP43Xw6S7NyHPUvczq8xKBWFNWU7RRLzECpSGZ4P65`
- Carolina Shout — `QmX3XfoL3Mfdg1pvtTkft7xezdEJQPbu3H9z8qoH7TNrda`

### Priority
Medium: structure is good; focus on authentic vocabulary, listening and coordination.

---

## TRACK 7 — JAZZ

### Current late rungs from live repo
- `jazz.7`: rootless voicings, quartal colour, tritone substitution.
- `jazz.8`: 9/11/13 and modulation.
- `jazz.9`: comping, walking and soloing on one tune.

Earlier current rungs include swing, comping/triads, shells/ii–V–I, and walking-bass development.

### External benchmark: Berklee Jazz Piano
A particularly useful 12-step reference:
1. major scales, swing, diatonic sevenths, voice-led blues;
2. Roman numerals, ii–V;
3. comping + blues improv;
4. tensions;
5. essential voicings;
6. two-feel + walking bass;
7. bossa;
8. minor ii–V–I / melodic minor;
9. learn + memorize a standard; chord-tone soloing;
10. approach-note line creation;
11. solo piano arranging / harmonized melody / drop-2;
12. intros/endings/tags.

Source:
https://online.berklee.edu/courses/jazz-piano

### Likely gaps in PianoProject
Not necessarily absent, but they should be explicitly checked:
- minor ii–V–I;
- bossa in a jazz context;
- learning/memorizing standards;
- chord-tone → approach-note improvisation progression;
- intros/endings/tags;
- solo-piano arrangement;
- playing the **same tune** in solo, comping, and ensemble roles;
- historical listening/transcription.

### Recommendation for current stage placement

#### jazz.3
Swing feel, call/response, simple tune.

#### jazz.4
Triadic comping, blues, trading.

#### jazz.5
Shells + ii–V–I.

#### jazz.6
Two-feel/walking + guide tones; introduce minor ii–V.

#### jazz.7
Rootless / quartal / tritone is reasonable, but require actual voicing practice and listening.

#### jazz.8
Extensions/modulation + approach-note solo language; bossa/minor harmony if not elsewhere.

#### jazz.9
One standard:
- learn melody/harmony;
- memorize;
- comp;
- walk/two-feel;
- improvise;
- solo-piano arrangement;
- intro;
- ending.

That would make `jazz.9` a genuinely integrated capstone rather than three techniques on one tune.

### PDMX archive leads
Historical archive searches already found:
- After You’ve Gone — `QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU`
- Sweet Georgia Brown — `QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5`
- Indiana — `Qmcy1D9Q8SPEBVa1nqy4TtjYeg8saf7mwC2CxnMpj16T9z`
- Carolina Shout — `QmX3XfoL3Mfdg1pvtTkft7xezdEJQPbu3H9z8qoH7TNrda`
- plus archive rows for Honeysuckle Rose, The Crave, Squeeze Me, Body and Soul.

### Priority
**Very high.** Current track has impressive vocabulary, but vocabulary ≠ functional jazz musicianship.

---

## TRACK 8 — RAGTIME

### Current major issue
`ragtime.4` is still missing, while `ragtime.5+` quickly reaches difficult full rags.

### Recommended progression
4. cakewalk / march root / oom-pah + early syncopation  
5. steady bass-chord against syncopated RH, preferably excerpt-first  
6. multi-strain form + larger LH leaps  
7. slow drag / wider stride precursor / memory  
8. late rag textures and performance  
9. complete rag project

### Why `ragtime.4` matters
It gives the learner a historical/motor bridge between:
- simple bass-chord accompaniment;
- full syncopated ragtime.

### Exact archive candidates
See section 5.3.

### Additional content direction
Teach:
- strain labels and repeat map;
- tempo/style (not “as fast as possible”);
- efficient LH leap practice;
- harmonic landing points;
- memorizing strain transitions;
- syncopation while LH stays metrically stable.

### Priority
**Very high immediate content fix**, because the gap is already known and candidate material already exists.

---

## TRACK 9 — THEORY & EAR

### Current documented progression
From `docs/02-curriculum.md`:

- Stage 1 core: note names, steps/skips, high/low.
- Stage 2 core: intervals 2nd–5th; major/minor triads by ear.
- Stage 3: intervals within octave; key signatures to 3 sharps/flats; I–IV–V in songs; rhythm dictation.
- Stage 4: circle of fifths; triad inversions by ear; melodic dictation; cadences.
- Stage 5: seventh-chord qualities; progressions; modes intro; transposition.
- Stage 6: secondary dominants; modulation; Roman numerals/figured bass; harmonic dictation.
- Stage 7: extended chords; chord-scale; form.
- Stage 8–9: chromatic harmony, counterpoint, jazz reharmonization, composition.

This is broad.

### Main research opportunity
Strengthen **sound ↔ voice ↔ keyboard ↔ notation ↔ function**.

Berklee/RCM consistently use:
- singing;
- clapping/conducting;
- transcription;
- melody playback;
- bass/root hearing;
- progression recognition;
- notation.

### Recommended additions
- optional/required singing even if unscored;
- scale degrees rather than only interval labels;
- bass-line dictation;
- chord-function dictation;
- melody + bass together;
- harmonic rhythm;
- transcribe from a real song excerpt;
- analyze repertoire currently being learned;
- write what was heard.

### Current correctness note
An earlier audit flagged `theory.7` chord-scale wording. The **current file is already corrected**: it explicitly says chord tones fix only four notes and the other scale notes are choices; chord-scale is a framework, not a law.

Do not report that old finding as current.

### Priority
High, especially production/transcription.

---

## TRACK 10 — IMPROVISATION & COMPOSITION

### Current documented progression
- Stage 3: RH improv over I–IV–V.
- Stage 4: pentatonic + answer-the-phrase.
- Stage 5: blues scale + write an 8-bar melody.
- Stage 6: modal vamps, LH ostinato, motif development.
- Stage 7+: reharmonize melodies, arrange PD song, compose in a form.
- Current build extends through `improv.8` and `improv.9`.

### External benchmark: Berklee Basic Improvisation
Progression includes:
- pentatonic/blues;
- melody as source;
- call-response;
- rhythm/pocket;
- motifs;
- register/density/expression;
- chord tones;
- voice leading;
- chord scales;
- chromatic approaches;
- transcription and internalization.

Source:
https://online.berklee.edu/courses/basic-improvisation

### Main likely issue
The track appears stronger on **improvisation** than on **composition**.

### Recommended composition strand
Recur alongside improv:

#### Early
- change ending;
- write 2-bar answer;
- make 4-bar question/answer.

#### Middle
- 8-bar melody with motif;
- harmonize it;
- ABA / binary form;
- bass/accompaniment choice.

#### Later
- develop motif;
- reharmonize;
- compose over a form;
- arrange instrumentation/texture;
- revise after listening;
- notate a finished miniature.

### Important addition
Transcription should be explicit:
- transcribe 1–2 bars of a solo/lick;
- play it;
- vary one element;
- integrate it into own improvisation.

### Priority
**High**, because “composition” in the track name should be real.

---

## TRACK 11 — HYMNS / GOSPEL

### Current actual ladder
Historical/current direction is mostly:
2. tune + four chords  
3. four-part texture  
4. inner voices  
5. walk-ups / passing chords  
6. hymn as arrangement

That is a coherent **hymn/spiritual accompaniment** curriculum.

### Research finding
It is **not yet a comprehensive gospel-keyboard curriculum**.

Berklee’s Gospel Music for Keyboard includes:
- gospel history/style;
- spiritual/blues roots;
- call-and-response/testimony;
- church cadences/chants;
- repertoire across eras;
- choir accompaniment;
- praise/worship/CCM;
- talk/shout music;
- reharmonization;
- backing singer/preacher;
- live listening/adaptation.

Source:
https://online.berklee.edu/courses/gospel-music-for-keyboard

### Two defensible options

#### Option A — rename/narrow
“Hymns & spirituals” / “Hymn accompaniment & gospel foundations”

Then current endpoint is defensible:
- harmonize;
- four-part read;
- voice lead;
- passing chords;
- arrange;
- transpose/accompany.

#### Option B — actually extend Gospel
Add later rungs:
7. gospel cadences / call-response / richer voicings  
8. shout/talk textures / choir & singer accompaniment  
9. live adaptation / reharm / ear-led backing / complete gospel project

This is an owner-level product choice because it changes promised breadth.

### PDMX archive pool already known
- Kumbaya — `QmYXxo6f3yMpi7aoSgnYz78a2rcZZBo5ANbSHNUmrx2mtQ`
- Holy Holy Holy — `QmbLfyErVgweCgsLYtW4CV2GvCwayZjJDqtLpccRmvCgdF`
- Nearer My God to Thee — `QmbFPMXf26skEX8RvUSZ5dGSuFXefEwFJ7GXiCfgjS6q2o`
- Old Rugged Cross — `QmWWXx9wyvbokCusjeDXuxxxn4UBEqS1YoxRPdZ7Nfz2cL`
- Wade in the Water — `QmQD2gCz8DdiQi2PXv5NGqFNjXjCyTkiNYKXJwonegt3Wm`
- This Little Light — `QmdJuSiZwpjM6eSVwnFADjegSDNq5un3sffnvKjGSj5ujz`
- Deep River — `QmbP96wZt5Vev9pA8pembvkaMw2wx48M3PR3pWNMfJuASp`

### Priority
High product-definition question.

---

## TRACK 12 — HOLIDAY

### Current ladder
2. accessible carols  
3. accompanying singers / transposition  
4. arranging devices  
5. carol as piano piece  
6. concert carols / performance  
7. winter repertoire

This is a good **use-case ladder**, not an open-ended genre mastery ladder.

### Recommendation
Do not force Stages 8–9 just for symmetry.

Honest endpoint:
> Can sight-read familiar seasonal music, accompany singers, transpose, create a fuller arrangement, prepare a performance, and play a substantial winter piece.

### Possible additions
- medley design;
- vamp/intro between verses;
- recover when singers skip/repeat;
- simplify accompaniment on the fly;
- choose key/range for group singing.

### Archive supply is already rich
Examples:
- Hark the Herald — `Qmb3qagci48d1B8ic1LDKfgVH9mMEckDVoJGiZF4kBfmHn`
- O Come All Ye Faithful — `QmcoQSuUJWzoBobX8KBMNPrRKzKXaNGdvxuyMTnnPQQjxk`
- In the Bleak Midwinter — `QmbZMs2e7CfQsKLzFPzqjXz1wUna6eGJ6DLaEecfRrCgYQ`
- Coventry Carol — `QmbsVRZYvySYNZSMWbGqxtpVngw5Av4D6smhHSAD2bpvdU`
- Wexford Carol — `QmcwBq2QuKqnXRmRrvBy1gVRaYpjKUGJBHvhZqLb4NBLZi`

### Priority
Low-medium. Purpose is already coherent.

---

## TRACK 13 — LATIN

### Current structural problem
The broad label “Latin” covers distinct traditions.
Current built sequence still omits:
- `latin.4` habanera/tresillo;
- `latin.8` modern tango.

### External benchmark: Berklee Latin Piano
Berklee separates:
- 12/8 bell pattern;
- Cuban styles;
- clave/cáscara/campana;
- guajeo/montuno;
- tumbao;
- cha-cha;
- timba;
- transcription;
- Brazilian styles such as maxixe/choro;
- comping and improvisation.

Source:
https://online.berklee.edu/courses/latin-piano-styles

### Recommended structure

#### latin.3
Pulse/clave orientation; distinguish pattern from generic syncopation.

#### latin.4
Habanera/tresillo through real repertoire.
Exact archive candidates already exist.

#### latin.5
Tumbao/montuno + bossa as distinct tasks.
Do not teach “Latin groove” as one blended thing.

#### latin.6
Three-voice montuno + tango accompaniment.
Clarify that Cuban and tango practices are separate traditions sharing a track for breadth.

#### latin.7
Concert repertoire / larger technical settings / transcription.

#### latin.8
Modern tango with *Libertango* / *Oblivion* candidate editions.

### Cross-cutting addition
Every Latin rung should say:
- timeline/pattern;
- relation to clave if applicable;
- accompaniment role;
- whether learner reproduces, varies, comps, or improvises;
- a listening/transcription example.

### Priority
**Very high.** Two missing rungs already have archive candidates, and external pedagogy confirms they are musically meaningful topics.

---

## TRACK 14 — ROCK / METAL

### Current progression
3. reduce band arrangement to piano textures  
4. power chord / repeating figure  
5. open voicings  
6. arpeggio/pedal textures  
7. register/density/build

This is useful, but it stops relatively early.

### External benchmark
Berklee Pop/Rock Keyboard emphasizes:
- triads/voice leading;
- comping;
- dominant 7ths/blues vocabulary;
- groove;
- add9/fourths;
- lead-sheet interpretation;
- improvisation;
- stylistic keyboard parts;
- performance context.

Source:
https://online.berklee.edu/courses/pop-rock-keyboard

### Rock/metal-specific abilities worth adding
- transcribe a riff from recording;
- reduce guitar+bass/drums into two-hand piano texture;
- keep rhythmic ostinato exact;
- syncopated chord attacks;
- octave melody/bass;
- repeated-note endurance;
- pedal/ambient texture;
- odd-meter counting when repertoire needs it;
- arrangement build/drop;
- choose what **not** to play;
- personal modern repertoire project.

### Suggested missing advanced rungs

#### rock.8 — transcription and reduction
Take 8–16 bars from a favorite recording:
1. bass;
2. riff/chords;
3. vocal/melody;
4. rhythmic engine;
5. decide what survives on piano.

#### rock.9 — full personal arrangement/project
- arrangement map;
- textures by section;
- dynamics/build;
- memory;
- performance recording.

These could use imported/personal PDMX scores when available rather than pretending public-domain repertoire must look like rock.

### Historical archive leads useful as substrates
- House of Rising Sun — `Qmc3v934xFCPJrgGpH9J8G5qTUhebhrysLwPEFEXhYgStR`
- Wayfaring Stranger — `QmWSZBozoVKxNWJvoX1BH8JEq7DA9MrnagpVFsoNLDsWCR`
- Hava Nagila — `Qmcrjg6TGmNxe9iuHjnoq1UzjogX61xNFGrstLVNz7KZqy`
- Gymnopédie candidate — `Qmb69dY9CoqiRXre3yTcR6NDcgadeZJsBAbSuqBW6kZt7M`

### Priority
High if “rock-metal” is promised as a serious track rather than a short texture module.

---

## TRACK 15 — JAM / PLAYING WITH OTHERS

### Current ladder
4. head/chorus/count-in/guitar keys  
5. comp behind someone  
6. walking bass if no bass player  
7. trading fours + shared set list

This is a solid start.

### Major practical additions
Real ensemble skill includes:
- listen while playing;
- leave space;
- recover if lost;
- find the form again;
- follow cues;
- adjust dynamics;
- simplify under pressure;
- switch role between comp/solo;
- count off;
- end together.

### Best new exercise
## Recovery drill
Backing track continues.
Learner is intentionally dropped/muted for 1–2 bars and must re-enter:
- next bar;
- next phrase;
- next chorus.

The goal is not perfect note accuracy.
It is knowing where you are.

### Other useful tasks
- stop comping for singer phrase;
- follow a surprise repeated chorus;
- four-bar count-in at several tempos;
- comp sparsely vs densely;
- end on cue;
- trade 4s/8s.

### Archive leads
- St James Infirmary — `Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs`
- Sweet Georgia Brown — `QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5`
- After You’ve Gone — `QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU`
- Indiana — `Qmcy1D9Q8SPEBVa1nqy4TtjYeg8saf7mwC2CxnMpj16T9z`

### Priority
Medium-high. The endpoint should be “can function with another musician,” not “can play a chord chart alone.”

---

# 7. High-priority candidate work queue for Fable

This is the work I would put **before** broad UX polish.

## A. Immediate repertoire/content inspection
1. Inspect `latin.4` exact archive candidates.
2. Inspect `latin.8` Libertango/Oblivion candidates.
3. Inspect `ragtime.4` cakewalk candidates.
4. Decide whether each yields:
   - full rung piece;
   - excerpt;
   - transfer model;
   - or reject.

No new archive-wide search is needed before these exact candidates are checked.

---

## B. Curriculum completeness questions most likely to change the product

1. **Hymns-gospel:** rename/narrow or add true gospel rungs?
2. **Rock-metal:** does it need Stage 8–9 transcription/project rungs?
3. **Jazz:** are minor ii–V–I, bossa, approach-note language, tune memorization, solo arranging, intros/endings adequately covered?
4. **Improv-compose:** is composition a real recurring strand or mostly one 8-bar melody task?
5. **Theory-ear:** is there enough singing/transcription/production, not only keyboard recognition?
6. **Practice:** does it teach when blocked practice is useful, structural retrieval, recording/listening and performance practice?
7. **Core:** do transposition, memory, score study and sight-reading recur enough?

---

## C. Generator improvement experiments

### Experiment 1 — source-backed sight-reading spec
Take one representative current sight-reading level.
Map it to:
- ABRSM/RCM/Faber constraints.
Generate 100 examples.
Independent checks:
- range;
- metre;
- rhythm;
- key;
- accidentals;
- hand demands;
- length.
Human audition/read 20 random examples for phrase plausibility.

**Success:** material is both mechanically level-correct and feels like readable musical syntax.

### Experiment 2 — phrase-template generation
Build 10–20 tiny public-domain-derived phrase templates:
- statement;
- answer;
- sequence;
- cadence;
- repeated motive;
- simple bass pattern.

Generate variants by:
- key;
- register;
- rhythm within rung limits.

Compare against current free generation.

### Experiment 3 — Hypothesis adversary
For each high-use family:
- all keys;
- highest/lowest range;
- each allowed hand configuration;
- shortest/longest duration;
- meter edges;
- serialize → parse → compare.

Let Hypothesis find minimized counterexamples.

### Experiment 4 — “music” family audition
For the 14 generator families whose contract promises music:
- sample multiple seeds;
- human listen/read;
- classify:
  - genuinely musical;
  - useful drill only;
  - repetitive/awkward;
  - physically bad;
  - harmonically awkward.
If a family is really a drill, relabel it instead of teaching the app to certify “musicality.”

---

# 8. PDMX search sheet format Fable should use

For each real-content gap create:

| Field | Meaning |
|---|---|
| need_id | rung / skill |
| learner_task | what learner actually does |
| target_role | demonstration / application substrate / transfer / project |
| must_be_written | facts that must literally be in score |
| may_be_applied | facts learner adds |
| title/composer queries | candidate retrieval |
| known CIDs | reuse old archive searches |
| rating/views | priority only |
| difficulty window | screening |
| exact edition checked | yes/no |
| exact passage | bars/measures |
| teaching decision | keep/move/excerpt/reject |
| reason | pedagogical, not detector output |

This format directly prevents the earlier failure where “target technique not printed” automatically meant “bad repertoire.”

---

# 9. Things I would NOT have Fable spend time on yet

- another universal accompaniment detector;
- genre classification of PDMX;
- exhaustive semantic tagging of the archive;
- more generator families just because a generator can be written;
- automatic “musicality” scoring;
- automatic ABRSM/RCM/Faber crosswalk;
- broad Score redesign;
- old backlog rows with no current learner consequence;
- re-searching PDMX titles already recorded as IN ARCHIVE before inspecting the known CIDs.

---

# 10. Most important likely curriculum changes, ranked

## Tier 1 — likely worth doing before relying on the curriculum
1. Complete/reassess `latin.4`.
2. Complete/reassess `latin.8`.
3. Complete/reassess `ragtime.4`.
4. Resolve what “gospel” promises.
5. Strengthen practice curriculum with evidence-nuanced blocked/interleaved/retrieval/performance practice.
6. Add/verify production/transcription in ear training.
7. Make memory/structure/recovery explicit.

## Tier 2 — likely important for track depth
8. Jazz: tune learning/memory + minor ii–V + approach-note line building + solo arrangement/intros/endings.
9. Improv-compose: real composition/revision strand.
10. Rock-metal: transcription/reduction + advanced project endpoint.
11. Chords-pop: playing by ear + register/groove/ensemble role.

## Tier 3 — refinement
12. Classical: stronger style/edition/score-study pedagogy.
13. Jam: recovery/cues/role listening.
14. Holiday: medley/singer recovery/simplification.
15. Blues: transcription and LH-groove-under-improv tasks.

---

# 11. Research source list

## General piano
- ABRSM Piano: https://www.abrsm.org/en-ag/piano
- ABRSM 2025/26 Piano Practical syllabus:
  https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20%26%202026%20Prac%20syllabus%2020240524_access.pdf
- RCM Piano Syllabus 2022:
  https://teacherportal.rcmusic.com/getattachment/57f3734d-97e5-4777-b67e-4b1111ee31a3/piano-syllabus-2022-edition.pdf
- Faber Primer Q&A:
  https://pianoadventures.com/piano-books/basic-piano-adventures/primer/q-and-a/
- Faber Level 1 Q&A:
  https://pianoadventures.com/piano-books/basic-piano-adventures/level-1/q-and-a/
- Faber Level 2A:
  https://pianoadventures.com/piano-books/basic-piano-adventures/level-2a/things-to-know/
- Faber Level 4:
  https://pianoadventures.com/piano-books/basic-piano-adventures/level-4/things-to-know/

## Harmony / contemporary keyboard
- Berklee Keyboard Method:
  https://online.berklee.edu/courses/berklee-keyboard-method
- Pop/Rock Keyboard:
  https://online.berklee.edu/courses/pop-rock-keyboard
- Reharmonization Techniques:
  https://online.berklee.edu/courses/reharmonization-techniques

## Jazz / blues / improv / Latin / gospel
- Jazz Piano:
  https://online.berklee.edu/courses/jazz-piano
- Blues and Rock Keyboard Techniques:
  https://online.berklee.edu/courses/blues-and-rock-keyboard-techniques
- Basic Improvisation:
  https://online.berklee.edu/courses/basic-improvisation
- Latin Piano Styles:
  https://online.berklee.edu/courses/latin-piano-styles
- Gospel Music for Keyboard:
  https://online.berklee.edu/courses/gospel-music-for-keyboard

## Ear/theory
- Ear Training Fundamentals:
  https://online.berklee.edu/courses/ear-training-fundamentals
- Ear Training 1:
  https://online.berklee.edu/courses/ear-training-1
- Ear Training 2:
  https://online.berklee.edu/courses/ear-training-2
- Harmonic Ear Training:
  https://online.berklee.edu/courses/harmonic-ear-training-recognizing-chord-progressions
- Music Theory 101:
  https://online.berklee.edu/courses/music-theory-101

## Practice / memory
- Chaffin & Imreh 2002:
  https://pubmed.ncbi.nlm.nih.gov/12137137/
- Williamon et al. retrieval structures:
  https://pubmed.ncbi.nlm.nih.gov/11814308/
- Williamon & Egner:
  https://pubmed.ncbi.nlm.nih.gov/15561499/

## Generator engineering
- music21:
  https://music21.org/music21docs/
- music21 voice-leading:
  https://music21.org/music21docs/moduleReference/moduleVoiceLeading.html
- Hypothesis:
  https://hypothesis.readthedocs.io/en/latest/

## PDMX
- Paper:
  https://openreview.net/pdf?id=BkCqkdKUtv
- January 2025 archive:
  https://zenodo.org/records/14648209
- Upstream repository:
  https://github.com/pnlong/PDMX

---

# 12. Repo evidence Fable should read before doing new research

Current:
- `docs/02-curriculum.md`
- `docs/generated/ladder.md`
- `docs/prompts/rung-claims.md`
- `tools/content/family_contracts.json`
- current `content/lessons/*.md`

Historical candidate/search evidence:
- `docs/genre-plans/blues.md`
- `docs/genre-plans/chords-pop.md`
- `docs/genre-plans/classical.md`
- `docs/genre-plans/holiday.md`
- `docs/genre-plans/hymns.md`
- `docs/genre-plans/improv.md`
- `docs/genre-plans/jam.md`
- `docs/genre-plans/jazz.md`
- `docs/genre-plans/latin.md`
- `docs/genre-plans/ragtime.md`
- `docs/genre-plans/rock.md`

Existing independent repertoire work to supply:
- `Curriculum_323_Song_Audit.csv`
- `Curriculum_425_Placement_Audit.csv`
- `Curriculum_323_Song_Audit_Summary.md`
- `Fable_Curriculum_Interpretation_Audit.md`

---

# 13. What Fable still has to do

This dossier intentionally does **not** replace the formal gate.

Fable still needs to:
1. establish current canonical track/rung denominator;
2. read every current track’s exact lessons/rungs;
3. compare against the relevant benchmark;
4. distinguish required skill from optional enrichment;
5. verify every proposed factual correction;
6. inspect candidate MusicXML editions/passages;
7. write one explicit record per current track;
8. state the denominator before saying “curriculum review complete.”

The research work above is meant to turn that from an open-ended research project into a targeted verification job.
