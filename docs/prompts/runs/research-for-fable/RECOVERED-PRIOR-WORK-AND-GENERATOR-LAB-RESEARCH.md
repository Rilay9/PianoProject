# Recovered prior work + generator/lab research for Fable — 2026-10-03

This appends the research packet. It does not replace `PACKET.md` or `INDEPENDENT-ADDENDUM.md`.

The purpose of this pass was to recover earlier PianoProject work that had already solved parts of the repertoire/content problem, then connect it to newer external tools and research. The biggest conclusion is that the project should **not restart song discovery, excerpt mining, genre research, or sight-reading generation from zero**. A lot of the useful machinery and evidence already exists.

No product code or content was changed here.

---

## 1. The old PDMX work is much richer than the recent packet implied

### 1.1 The pedagogical quarry already searched the 254,077-row archive

`docs/decisions/2026-09-15-pedagogical-quarry.md` records a serious archive pass, not a toy shortlist:

- 254,077 PDMX CSV rows read;
- 177,773 passed the initial gates;
- 104,427 browsable index rows after edition collapsing;
- 729 candidates selected in the first run;
- 667 passed all machine gates;
- 154 teaching pieces proposed in the first run, concentrated at stages 5–6 where the curriculum was thin.

The quarry found substantial pedagogical collections already in PDMX:

- Lemoine Op. 37 — 34 usable studies;
- Czerny — 37 candidates across Op. 299, 599, 740, 821, 300, 139 and others;
- Mozart Nannerl notebook / London Sketchbook — 23;
- Bach Two-Part Inventions — all 15;
- Schumann Op. 68 — 13 additional pieces;
- Bach Little Preludes — 5;
- Mendelssohn Songs Without Words — 4;
- Bach Anna Magdalena — 3;
- Beethoven, Bertini, Duvernoy, Schubert, Streabbog and individual Beyer/Burgmüller/Grieg/Gurlitt/Kuhlau/Köhler/Scarlatti/Tchaikovsky candidates.

It also found and fixed two shortlist defects that matter if Fable reuses this work:

1. Duvernoy Op. 176 studies were being collapsed as duplicate editions because the study number followed `Etude` instead of `No.`. Fixing `work_key` recovered thirteen more Op. 176 studies around levels 4.4–5.9.
2. `match_want` originally ignored `composer_name`; it was expanded to search that as well as `artist_name`.

**Implication:** use the existing quarry/index/search code and its fixed work identity rules. Do not build another PDMX search layer unless a concrete gap remains.

### 1.2 The genre plans are already a web-research-to-PDMX lookup table

The old `docs/genre-plans/*.md` files are exactly the bridge we wanted: researched repertoire names grouped by teaching/genre progression, then searched against all 254,077 archive rows. Each candidate is marked `IN CATALOG`, `IN ARCHIVE` with an exact PDMX content id, or `NOT FOUND`.

Examples worth preserving:

#### Jazz

`docs/genre-plans/jazz.md` includes exact PDMX ids for:

- Swing Low, Sweet Chariot;
- Indiana;
- For Me and My Gal;
- After You've Gone;
- Sweet Georgia Brown;
- Japanese Sandman;
- At the Jazz Band Ball;
- Twelfth Street Rag;
- Dinah;
- Honeysuckle Rose;
- The Crave;
- Squeeze Me;
- Carolina Shout;
- Body and Soul;

and identifies already-held material such as Bill Bailey, Some of These Days, Darktown Strutters' Ball, Margie, Whispering, Avalon, Limehouse Blues, Bye Bye Blackbird, Rose Room, Tiger Rag, Muskrat Ramble, Royal Garden Blues, Jazz Me Blues, Stardust, I Got Rhythm, Take Five and Lullaby of Birdland.

#### Blues / boogie

`docs/genre-plans/blues.md` similarly records exact PDMX hits for Joe Turner Blues, Make Me a Pallet, Jelly Roll Blues, Farewell Blues, New Orleans Blues, King Porter Stomp, Carolina Shout and Shout for Joy, plus held lead sheets and the existing boogie material.

#### Ragtime

`docs/genre-plans/ragtime.md` records PDMX hits for At a Georgia Campmeeting, Whistling Rufus, Harlem Rag, Creole Belles, The Strenuous Life, The Sycamore, The Ragtime Dance, Euphonic Sounds, Dill Pickles, Hilarity Rag and American Beauty Rag, while the catalog already contains a large Joplin shelf.

These old files are more useful now than when they were written because we now have stronger verification sources: Joplin/Humdrum reference editions, DCML, DIME, Partitura, humlib and Verovio. The old candidate list can nominate the PDMX score; the stronger edition/tool can verify it.

### 1.3 The archive's genre metadata was already proven too weak

Earlier archive work found the native PDMX genre vocabulary too sparse/noisy for curriculum search: most rows were `na` or generic classical, with effectively no coverage for several target styles. That is why the title/artist/composer quarry and external candidate research mattered.

**Keep that lesson:** external/source research should nominate works; PDMX should answer “do we have a symbolic score?” rather than “what genre should I teach from this?”

---

## 2. The project already built the right kind of excerpt miner

`docs/prompts/tasks/E1-excerpts-first-class.md` and `docs/prompts/entry-101.md` are probably the highest-value recovered work in this pass.

### 2.1 Existing design

The excerpt system already treats a passage as its own content object tied to:

- exact parent identity;
- printed bar range;
- hand selection;
- cut version;
- the parent's built bytes.

The proposer examines 4–8-bar windows and scores/gates them using:

- target opportunity density;
- absence of untaught demands;
- phrase-start evidence (rest, long note, double bar, rehearsal/repeat boundary, strong bass change, etc.);
- plausible ending/resolution or an honest “leads onward” result;
- hand continuity;
- useful length;
- physical plausibility;
- enough occurrences of the intended feature.

It explicitly **does not rank by lowest whole-piece difficulty** and it proposes rather than declaring pedagogical truth.

That architecture already matches the desired pipeline:

> researched candidate → symbolic score → exact useful passage → locally measured facts → verification → curation.

### 2.2 It already found useful passages the whole-piece score obscured

The older repertoire trace on the PDMX Minuet in F, BWV Anh. 113 found that the whole piece contained later demands that made the whole-piece level misleading, while bars 5–8 and 17–24 were locally appropriate for the earlier learner state. This is the concrete proof that **passage mining is better than whole-piece levelling for transfer practice**.

### 2.3 E1 produced both positive examples and an invaluable negative corpus

The E1 run mechanically approved five candidate passages, with teaching use deliberately left undecided:

- BWV Anh. 113 bars 25–32 — key-signature / reading material;
- Hark! The Herald Angels Sing jazz lead sheet bars 25–28 — actual tied/off-beat syncopation;
- Ode to Joy easy variation bars 9–12 — page shows an actual bass-note-then-chord oom-pah pattern;
- I Got Rhythm bars 15–18 — page shows an actual walking bass: single quarter notes on every beat, chord tones plus chromatic approaches, not repeated/chordal;
- Wabash Blues bars 1–4 — chromatic-note opportunity.

More important for future verification, it recorded false positives:

#### Walking-bass false positives

The old broad detector called all of these walking bass although the page did not support the named style:

- Chopin Waltz Op. 34 No. 1 bars 17–20;
- Fikrimin İnce Gülü bars 1–4, 13–20, 21–28;
- Streabbog, La Violette bars 37–40;
- Chopin Mazurka Op. 33 No. 4 bars 66–69 and 194–197;
- Czerny, Santa Lucia bars 13–16;
- Elgar, Pomp and Circumstance bars 1–8 and 29–36;
- Prahlow, Solanum's Theme bars 1–8;
- Duvernoy Op. 176 No. 18 bars 1–4.

#### Oom-pah / generic LH-pattern false positive

Beethoven Symphony No. 7, second movement, simple arrangement bars 1–8 was rejected because the LH is a broken chord rather than bass-note-then-chord, even though the broad pattern detector accepted it.

#### Syncopation false positive

Lemoine Op. 37 No. 44 bars 1–8 was rejected because its “syncopation” was merely the RH entering after rests while LH played beats 1 and 3; no note/tie actually starts off the beat in the intended way.

#### Other useful rejected material

- Beyer No. 38 bars 9–16 was the strongest leap candidate but had leaps in only 3 of 8 bars, below the intended practice density.
- Bizet Carmen overture bars 51–54 RH was rejected for chromatic practice because it repeated one dyad rather than providing a useful line.
- Grieg Åse's Death bars 29–32 RH exposed the dangerous clef/staff assumption: an upper staff written in bass clef became a detector misread.

**Do not throw these away.** They are a ready-made adversarial corpus for any future characteristic search or named-style verifier. A future rule for walking bass, oom-pah, syncopation, etc. should have to accept the genuine passage and reject these recorded counterexamples before it is trusted.

---

## 3. A much better repertoire workflow now emerges from the old and new work together

For real songs/pieces, Fable can use this stack instead of starting from blank searches:

1. **Need / characteristic.** Example: walking bass, held LH, first eighths, Dorian shuttle, syncopation, oom-pah.
2. **External/source research nominates works.** Use published methods, scholarly corpora, genre sources and the old genre plans.
3. **Search the existing PDMX quarry/index by title/composer/collection.** The old matcher and work-key fixes are already there.
4. **Prefer or compare multiple editions where available.** Do not let `best_editions` hide useful disagreement during verification.
5. **Compare the symbolic score with a stronger edition-linked source where one exists:** Humdrum/Joplin, DIME, DCML, NIFC Chopin, Mutopia, etc.
6. **Parse differentially:** music21 for the app/generator path, Partitura as fast independent MusicXML witness, humlib/musicxml2hum where a third implementation or native Humdrum comparison matters, Verovio/MuseScore selectively for rendering/import behavior.
7. **Run the existing excerpt proposer on the locally verified score.** Mine the exact 4–8 bars that give enough opportunities without later prerequisites.
8. **Use source-backed named labels only when justified.** Generic features may nominate “arpeggiated LH”; a source or direct structural contract is needed for “Alberti bass,” “walking bass,” “stride,” etc.
9. **Fable/owner makes the teaching-placement decision.** Mechanical facts and source evidence inform placement; neither silently chooses it.

This is substantially stronger than either “trust PDMX” or “manually curate every score from scratch.”

---

## 4. Difficulty/search: reuse modern research instead of the old whole-piece scalar

The 2026 paper *Difficulty-aware score generation for piano sight-reading* is unusually relevant to the exact problem PianoProject has been struggling with. The authors trained on 41,170 high-rated, two-staff PDMX piano pieces segmented into 16-bar fragments and used interpretable difficulty supervision rather than trusting PDMX's own level metadata.

Sources:
- https://doi.org/10.1016/j.eswa.2026.132088
- https://arxiv.org/abs/2509.16913

Its difficulty signal builds on the RubricNet / CIPI line of work. RubricNet is open source and uses interpretable descriptors rather than a black-box “level” alone:
- https://github.com/PRamoneda/rubricnet
- https://github.com/pramoneda/difficulty-prediction-CIPI

The paper specifically names descriptors such as pitch range, pitch entropy, rhythmic density, hand displacement, average pitch and structural repetitiveness.

**High-value use for PianoProject:** do not make such a model the curriculum authority. Use these descriptors / an existing difficulty model as an additional **candidate-ranking feature** for mined excerpts. The rung's taught/untaught gate remains hard; the difficulty model answers “among mechanically eligible windows, which look easier/harder?” That fixes the old mistake where one opaque whole-piece number dominated selection.

The same principle applies to `jSymbolic2`, `musiF`, `ms3` and DCML TSVs: use mature feature extraction to search large corpora, then let local exact checks and curation decide.

---

## 5. Exercise/drill generation: keep the strong existing architecture, but feed it better material

### 5.1 The current sight-reading generator is already more sophisticated than a replacement library would be

`app/src/engine/sightReading.ts` already has several properties worth preserving:

- deterministic seed + generator version as identity;
- hard musical constraints before a phrase is accepted;
- multiple valid candidates scored for phrase shape rather than first-valid-only;
- tri-state controls for eighths, ties, dotted quarters, syncopation, triplets, accidentals, ledger lines, leaps, position and left-hand pattern;
- explicit refusal when a requested combination cannot be generated within the budget;
- named LH recipe choices (`whole`, `chord`, `alberti`, `broken`, `walking`).

The old generator audit also already documented the failure classes that must remain adversaries: wrong mode, impossible/odd hand range, wrong length, off-page text, enharmonic spelling errors, title/content mismatch and inconsistent key signatures.

### 5.2 External research supports hard constraints + quality ranking, not uncontrolled generation

A 2020 Frontiers paper generated sight-reading exercises using expert models plus an evolutionary search. Its hard configuration included length, time signature, key signature, range, ties and rests; aesthetic/technical suitability was optimized over candidates. This is conceptually very close to PianoProject v2's “hard faults then choose best candidate.”

Source: https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2020.497530/full

The 2026 difficulty-aware generator goes further with learned MusicXML generation and expert difficulty supervision, and expert pianists rated its output positively. But it also shows that simple conditioning can collapse: asking a model for a level does not guarantee the global property.

**Practical conclusion:** if Fable experiments with a learned generator later, use it only as a candidate proposer. The permanent truth path should still be:

> requested property → generated candidate → hard verifier → independent parser/witness → quality/difficulty rank → result or honest refusal.

Do not replace a deterministic verifiable generator with “prompt says eighth notes / Dorian / level 3.”

### 5.3 A creative hybrid worth testing: source-backed micro-pattern banks

For several drill families, the best source of musicality may be **verified real passages rather than a more elaborate random composer**.

Possible pipeline:

1. Mine short cells from verified editions or approved excerpts.
2. Normalize the cell to scale degrees / rhythm / chord-relative degrees.
3. Store provenance to the source bars.
4. Re-realize it in another permitted key/register/rhythm context with music21.
5. Verify the transformed result mechanically and with the independent parser.

This gives the app variety without asking custom code to invent musical style from scratch. It is especially promising for:

- short sight-reading contours;
- cadence cells;
- accompaniment figures;
- modal characteristic-note figures;
- syncopation cells;
- walking-bass approach patterns;
- Latin clave/tumbao/montuno cells where the source definition is explicit.

It also makes “why is this pattern legitimate?” answerable: the prototype came from a named source, and the transformation contract is explicit.

---

## 6. Named accompaniment figures: use corpora/templates, not another universal detector

### Walking bass

There is now an excellent research source: FiloBass contains 48 manually verified professional jazz-bass transcriptions with 50,000+ notes, MusicXML, performance-aligned MIDI, beats/downbeats, chord symbols and form markers. The published analysis also reports usable statistical tendencies such as roots on new chords and semitone approaches.

Sources:
- https://zenodo.org/records/10069709
- https://zenodo.org/records/10265335
- https://aim-qmul.github.io/FiloBass/

Combine this with the repo's genuine `I Got Rhythm` bars 15–18 and its existing false-positive list. That is enough to design a **walking-bass generator contract and adversarial test set** without pretending a broad stepwise-bass detector defines the style.

### Alberti / broken-chord texture

The manually annotated Symbolic Texture dataset contains 1,164 bar-level texture labels from early Mozart piano sonatas and publishes low-level texture descriptors. Use it as a bounded research/reference set, then use edition-linked Mozart material (DIME / DCML / Humdrum) for exact notation examples.

Source: https://zenodo.org/records/7316712

This is much stronger evidence than “four notes happen to be low-high-middle-high 30% of the time.”

### Ragtime / stride precursor / oom-pah

Use the old genre plan + the Joplin shelf + the edition-linked Joplin Humdrum collection. The old E1 run already gives one true oom-pah passage and one broken-chord false positive. Stride should be treated as a source-backed progression from ragtime/stride repertoire, not certified by the generic left-hand pattern detector.

### Boogie

The repo already has `exercise.boogie.*`, a PDMX boogie score, and an old genre plan with known candidate titles. This remains weaker than FiloBass/Joplin as an external research base. Before expanding the boogie generator, use those known scores plus a published boogie/piano source or a style engine's explicit boogie pattern as the reference contract; do not extrapolate from the current generic LH detector.

---

## 7. Modes: split “the pitch collection” from “music that establishes the mode”

This is an area where the app can become both simpler and more accurate.

### 7.1 Pitch collections are library facts

music21 already has concrete `DorianScale`, `PhrygianScale`, `LydianScale`, `MixolydianScale`, `LocrianScale` and natural-minor/Aeolian support. Use these instead of maintaining custom modal pitch tables where possible.

Source: https://music21.org/music21docs/moduleReference/moduleScale.html

A scale drill can therefore be mechanically verified:

- exact tonic;
- exact mode class;
- every note belongs to the scale;
- required characteristic degree appears;
- requested range/rhythm/fingering constraints hold.

### 7.2 A modal vamp needs more than “all notes belong to the scale”

Open Music Theory's modal-schema chapter provides concrete pop/rock schemas and color-note distinctions:

- Mixolydian: I–♭VII shuttle / related schemas;
- Dorian: i–IV shuttle;
- Lydian: I–II♯ shuttle / cadence;
- Aeolian: i–♭VII and related schemas.

Source: https://viva.pressbooks.pub/openmusictheory/chapter/modal-schemas/

That suggests a safer modal-vamp contract:

1. build pitches from the music21 mode;
2. keep tonic structurally clear;
3. require the characteristic/color degree in melody or harmony often enough to make the exercise useful;
4. use a **source-backed modal schema**, not an arbitrary diatonic chord loop;
5. verify the generated chord roots/qualities and melody pitch set mechanically;
6. do not claim “this definitely sounds Dorian” from pitch membership alone.

For transfer, use the same passage-mining workflow: research a real song/passage known for the relevant modal schema, find the symbolic score (PDMX/DCML/etc.), verify the actual bars, then cut the useful passage.

### 7.3 Lab can teach the difference explicitly

A good modal lesson/lab can have three forms rather than one vague “modal vamp”:

- **Hear the color note:** tonic drone/bed, app alternates the major/minor reference degree and the modal degree.
- **Play over the schema:** source-backed Dorian/Mixolydian/Lydian/Aeolian progression, learner improvises with the scale.
- **Find it in real music:** verified excerpt whose notes/chords actually establish the schema.

That creates a clean ladder from mechanical collection → aural identity → transfer.

---

## 8. The Lab has useful existing machinery, but some roles are conflated

Earlier project planning already described the most useful split:

- **Hold the chords:** app/backing plays progression while learner plays melody/improvises.
- **Play the tune:** app supplies melody/bed while learner comps.

The current Lab already has named presets, progressions and locks. Old lesson audits show, for example:

- `primary-chords` locks an I–IV–V–I progression and LH;
- `jazz-comping` uses ii–V7–I with `leftHand: walking`, locks progression/LH, key free;
- `blues-shuffle` is reused across many rungs.

That is useful machinery, but Fable should check whether the **backing part is accidentally doing the learner's target skill**. If the rung teaches walking bass, a walking-bass bed is useful for hearing/duet/improv but cannot substitute for a walking-bass exercise the learner plays. If the rung teaches comping, a piano comping track should be removable so the learner has harmonic space to do the comping.

### 8.1 Established backing-track engines are worth studying for Lab, even if not adopted directly

#### JJazzLab

JJazzLab is active and open-source. You enter chord symbols, select a style, and it generates bass/drums/guitar/piano/etc.; its current jjSwing style specifically advertises intelligent walking bass and drums, and its toolkit exposes the generation core without the GUI.

Sources:
- https://github.com/jjazzboss/JJazzLab
- https://www.jjazzlab.org/

This is more directly relevant to Lab backing than to written exercise generation. Possible uses:

- research/reference for what a mature backing engine exposes;
- offline generation of backing MIDI for selected presets;
- comparison target for walking-bass/swing/comping behavior;
- inspiration for track overrides (e.g. keep drums/bass, remove piano so learner comps).

#### MMA — Musical MIDI Accompaniment

MMA is also actively packaged and generates accompaniment from chord progressions/directives; its groove ecosystem includes 3/4, 4/4, 6/8, jazz/ballad and other styles.

Sources:
- https://www.mellowood.ca/mma/
- https://github.com/sciurius/mma-grooves

Again, this is a Lab/backing research tool, not a notation authority.

#### Impro-Visor

Impro-Visor is particularly relevant to jazz pedagogy: chord-symbol backing, user-definable accompaniment styles, grammar-derived melodic material, roadmap/key/chord-brick analysis and trading fours.

Source: https://sourceforge.net/projects/impro-visor/

The old PianoProject already built trading fours and lab presets independently; this is useful confirmation that those are sensible teaching interactions, and a source of ideas for making them musically richer without turning them into learner-credit oracles.

#### AccoMontage2

AccoMontage2 can harmonize a melody and arrange accompaniment with style control, and provides a 5k+ progression/style dataset.

Source: https://github.com/billyblu2000/accomontage2

Use as research/candidate-generation inspiration, not as a correctness authority for controlled beginner drills.

---

## 9. Specific old defects/findings that should shape future work

This pass found several already-recorded problems that directly answer “what should we verify?”

1. **Boogie lesson/content mismatch:** an old lesson claimed a boogie pattern through a whole twelve-bar form in C then F, but the actual boogie exercises were four bars on one chord; the C/F exercises were not equivalent. Any future genre drill must verify form + key + pattern together, not infer them from a title.
2. **Mode wording overclaim:** the lesson audit already caught the statement that Mixolydian “never pulls home” as too absolute. Future modal content should state the concrete mechanism (flat 7 removes the major-key leading tone) rather than claim an inevitable perceptual result.
3. **Clef assumption:** E1 found a real PDMX piece whose upper staff was bass clef and therefore broke detector assumptions. Any passage indexer should read the actual clef by staff/measure rather than staff-number = hand/clef.
4. **Generic LH detector cannot name figures:** E1/CQ1 recorded concrete false positives across waltz, broken chord, oom-pah and walking-bass cases. Treat the negatives as a permanent regression set.
5. **Generated score invariants caught real faults:** wrong mode, hand range, bar count, text placement, enharmonic spelling. Those are still the right mechanical verifier classes for new families.
6. **ABC chord fingering is currently lossy:** already recorded in the main packet. Any source-backed fingering drill that goes through ABC needs this route fixed or avoided first.
7. **music21 read-back is not an independent serialization witness:** generated content can still use music21 for construction, but final file verification should use another parser when the property could be damaged by the writer.

---

## 10. A concrete handoff shape for Fable

Fable should inherit **assets**, not another abstract program.

### Reuse immediately

- `docs/decisions/2026-09-15-pedagogical-quarry.md` — archive quarry and fixed matching rules;
- `docs/genre-plans/*.md` — externally researched repertoire names already mapped to exact PDMX ids where found;
- `docs/prompts/tasks/E1-excerpts-first-class.md` — passage mining design;
- `docs/prompts/entry-101.md` — actual approved/rejected excerpt evidence and genre false positives;
- current `pdmx-index.json` and old quarry output logic;
- current sight-reading v2 hard-constraint + candidate-scoring architecture;
- family-contract/mechanical invariants where they express real generator promises;
- the new independent-source/tool matrix in `INDEPENDENT-ADDENDUM.md`.

### The most promising combined content strategy

**Controlled exercise**

> sourced definition / source-backed prototype → deterministic music21 realization → hard contract → Partitura/humlib witness where needed → property/adversarial tests.

**Musical mini-piece / sight read**

> existing hard constraints → several valid candidates → rank with musical-quality + interpretable difficulty features → independent parse → deliver or refuse.

**Real transfer passage**

> researched work → PDMX/edition-linked symbolic source → verify against stronger edition → existing excerpt miner → local untaught-demand gate → Fable curation.

**Lab / genre practice**

> explicit progression/form + source-backed accompaniment recipe → app or established backing engine generates bed → learner role kept separate from backing role → ungraded unless objective MIDI facts are actually measured.

**Named accompaniment style**

> published/corpus-backed definition + positive reference passages + the repo's historical negative counterexamples → small generator contract or curated excerpt set. No universal classifier required.

This lets the project use the enormous amount of work already done while still benefiting from better libraries and external research. It also gives Fable a way to add much more content without turning every new piece or exercise into a new bespoke verification subsystem.
