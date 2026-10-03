# Independent research addendum for Fable — 2026-10-03

This appends the existing `research-for-fable` packet. It does not replace Claude's reports. The goal of this pass was to answer two questions the initial packet left too narrow:

1. Are there stronger symbolic-score sources than PDMX and Mutopia for correctness and provenance?
2. Are there established libraries/tools that can remove more custom PianoProject analysis, verification or indexing code without pretending to solve pedagogy?

No product code or content was changed here.

## 1. Stronger score sources than the initial PDMX/Mutopia pair

### 1.1 Humdrum/KernScores is a serious source family, not UNKNOWN

KernScores is reachable and currently reports more than 100,000 symbolic score files. Its holdings include piano-relevant composers and genres including Beethoven, Chopin, Clementi, Grieg, Joplin, Liszt, Mozart, Schumann, Scarlatti, etudes, ragtime, sonatas/sonatinas and waltzes.

Source: https://kern.humdrum.org/

The important distinction is that **KernScores itself is a library of many collections with different provenance**, so Fable should prefer named digital editions with an explicit reference edition or reference scans rather than treating all KernScores files as equally authoritative.

Particularly strong subcollections found in this pass:

- **Scott Joplin digital edition** — Humdrum encodings plus the scanned music used as the reference edition in the repository. This is much stronger material for researching ragtime accompaniment and syncopated piano textures than PDMX metadata or a generic left-hand detector.
  - https://github.com/craigsapp/joplin
- **Mozart piano sonatas** — 17-sonata digital edition, encoded in Humdrum, explicitly based on the 1878 Breitkopf & Härtel *Alte Mozart-Ausgabe*; the repository includes a `reference-edition` directory.
  - https://github.com/craigsapp/mozart-piano-sonatas
- **Beethoven piano sonatas** — all 32 sonatas, encoded in Humdrum, with an explicit reference edition (Durand 1915, edited by Paul Dukas) and a `reference-edition` directory.
  - https://github.com/craigsapp/beethoven-piano-sonatas
- **Chopin first editions from the Fryderyk Chopin Institute (NIFC)** — hundreds of Humdrum encodings of specific first editions, with publisher/edition identity carried in filenames and institutional editors listed. This is materially stronger provenance than an anonymous/user-uploaded transcription.
  - https://github.com/pl-wnifc/humdrum-chopin-first-editions
  - https://chopin.humdrum.org/

**Research implication:** for a real piece where one of these edition-linked collections has coverage, use it ahead of an unverified PDMX transcription. PDMX can still nominate candidates; the edition-linked corpus should be the stronger symbolic witness.

### 1.2 Digital Mozart Edition (DIME) is a scholarly MEI source

The Internationale Stiftung Mozarteum's Digital Interactive Mozart Edition is a fully digital scholarly edition encoded in MEI. The viewer exposes downloadable MEI and editorial interventions/regularizations, and the project is based on / continues the Neue Mozart-Ausgabe tradition.

Sources:
- https://dme.mozarteum.at/movi/en
- https://music-encoding.org/projects/digital-interaktive-mozart-edition.html

**Use:** where the relevant Mozart work is present, DIME is preferable as a correctness/provenance reference to PDMX and often preferable to a volunteer edition. It is also valuable as a native MEI input for Verovio/jSymbolic rather than forcing everything through MusicXML first.

### 1.3 DCML's Distant Listening Corpus is much more useful than the packet's one-line mention

The Distant Listening Corpus (DLC) is an annotated-score infrastructure covering 1,283 scores by 36 composers in the 2025 data report. It includes substantial piano/keyboard material: Beethoven sonatas, Mozart sonatas, Chopin mazurkas, Grieg *Lyric Pieces*, Schumann *Kinderszenen*, Tchaikovsky *The Seasons*, Ravel, Rachmaninoff, Scarlatti, Bach keyboard works and others.

For each score the corpus can provide:
- native MuseScore (`.mscx`),
- note-head TSV,
- measure TSV,
- onset/chord/markup TSV,
- expert harmony/cadence/phrase annotations where available.

Sources:
- https://github.com/DCMLab/distant_listening_corpus
- https://www.nature.com/articles/s41597-025-04976-z

The annotated Mozart-sonata corpus specifically follows the Neue Mozart Ausgabe and publishes score, harmony and cadence data:
- https://github.com/DCMLab/mozart_piano_sonatas

**Use:** this is not a beginner-placement oracle. It is a strong source for factual harmony/function, phrase/cadence evidence, and characteristic search; it can also supply independent labelled material for checking PianoProject's harmonic claims.

### 1.4 OpenScore Lieder is useful for accompaniment research even though it is not solo-piano repertoire

OpenScore Lieder provides native MuseScore files for nineteenth-century songs with piano accompaniment and can be batch-converted to MusicXML. This makes it useful for research on accompaniment textures and for testing score readers on real two-staff piano writing.

Source: https://github.com/OpenScore/Lieder

It should not be mistaken for a beginner piano curriculum source, but it is a better large, structured accompaniment corpus than trying to infer every accompaniment pattern from PDMX.

### 1.5 MuseData / CCARH is an additional scholarly encoding source, but lower priority for this app

CCARH reports more than 1,100 works encoded in MuseData, with source information carried in score headers. Verovio/humlib can read MuseData through the Humdrum path.

Source: https://wiki.ccarh.org/wiki/MuseData

This is useful as another independent symbolic source for covered classical works, but the repertoire mix is less directly aligned with PianoProject's beginner solo-piano needs than the edition-linked Humdrum and DCML collections above.

## 2. Better library/tool stack for verification

The initial packet's conclusion that partitura is useful is sound, but **partitura should not be the only second reader**. The stronger architecture is differential verification with different parsers for different source families.

### 2.1 `partitura`: keep as the fast default MusicXML witness

Partitura remains a good default independent MusicXML parser. Version 1.9.0 (2026-05-25) added/fixed score-import details including same-as IDs in MEI, local grace-note order, chord attributes, cue-note parsing and ties.

Source: https://github.com/CPJKU/partitura/releases

Use it for note-level facts, timings, measures, staves, clefs, ties and signatures. Do not use its pitch speller as the generator's notation authority given the flat-key failure already observed in the packet.

### 2.2 `humlib` / `musicxml2hum`: add as a genuinely different MusicXML parser

Humlib provides a C++ Humdrum parser/toolkit and its `musicxml2hum` command is the current MusicXML-to-Humdrum converter used by Verovio Humdrum Viewer. The VHV documentation explicitly calls it more advanced/recent than the old `xml2hum` converter.

Sources:
- https://github.com/craigsapp/humlib
- https://doc.verovio.humdrum.org/interface/musicxml/

Why it is valuable here:
- different implementation stack from music21 and partitura;
- converts MusicXML into `**kern`, which has explicit pitch spelling and exact/rational rhythm semantics;
- directly interoperates with the higher-provenance Humdrum corpora above;
- gives Fable a way to compare `generated MusicXML -> humlib` against a source encoded natively in Humdrum without writing another PianoProject parser.

**Recommendation:** research/prototype this as the third witness for the musical facts where partitura and music21 disagree, and as the natural bridge for edition-linked Humdrum content.

### 2.3 `ms3`: use native MuseScore parsing instead of MusicXML when the source is MuseScore

`ms3` 2.6.x parses MuseScore 3 **and 4** `.mscx`/`.mscz` directly and extracts notes, rests, measures, labels, chord/harmony annotations, dynamics/articulations and metadata into DataFrames. It was developed around the DCML corpus workflow.

Sources:
- https://github.com/johentsch/ms3
- https://ms3.readthedocs.io/en/latest/manual/index.html

This matters because OpenScore and DCML already provide native MuseScore files. Converting those to MusicXML before analysis throws away information and creates another conversion surface for no benefit.

**Recommendation:** for DCML/OpenScore-native material, let `ms3` do the corpus extraction. Do not write a PianoProject MuseScore parser and do not force these corpora through music21 merely to index them.

### 2.4 MuseScore Studio CLI: heavyweight, but a useful independent application-level witness

MuseScore Studio's CLI can import MusicXML and export MuseScore, MusicXML, MIDI, PDF, PNG and SVG, and supports batch jobs.

Sources:
- https://handbook.musescore.org/pl/appendix/command-line-usage
- https://handbook.musescore.org/file-management/working-with-musicxml-files

For **music21-generated** exercises, MuseScore is an independent notation application and therefore useful for:
- import success/failure,
- rendering/layout sanity,
- a second serialization,
- comparing note/staff/bar structure after import.

It is not independent for PDMX files that originally came from MuseScore, and it is not an edition oracle.

**Recommendation:** optional Fable/CI witness for high-value generated families and newly imported scores, not a required parser for every unit test.

### 2.5 Verovio remains valuable, and its current MusicXML importer has improved

Verovio 6.3.0 (2026-08-19) includes further MusicXML importer improvements; 6.1 also improved fingering import. It can import MusicXML directly to MEI, render SVG, and produce timing/MIDI information.

Source: https://github.com/rism-digital/verovio/blob/develop/CHANGELOG.md

Keep it as a third/visual witness, especially for MEI-native sources such as DIME. Do not use its known-bad Humdrum MIDI-value path as a pitch oracle where the packet already found an error.

### 2.6 Do not adopt LilyPond `musicxml2ly` as a standard verifier

LilyPond can import MusicXML, and its separate engraver would look attractive as another witness, but LilyPond's current documentation explicitly says the format-conversion programs such as `musicxml2ly` are effectively maintained "as-is" and bug reports are unlikely to be resolved.

Source: https://lilypond.org/doc/v2.26/Documentation/usage/converting-from-other-formats

Use it only as an occasional manual third opinion if already available, not as a foundation of PianoProject verification.

### 2.7 MusPy / MusicRender is not a better notation oracle

MusPy can read/write MusicXML, but its own MusicXML interface explicitly does not support grace notes and unpitched notes. It is useful for event/pianoroll/generative representations, not for preserving all of the notation detail PianoProject needs to teach from a score.

Source: https://muspy.readthedocs.io/en/latest/io/musicxml.html

PDMX's `MusicRender` extends MusPy to preserve more score/performance information, but it is still part of the same PDMX ingestion pipeline, so it does not solve independent correctness verification.

## 3. Better tools for grouping repertoire by characteristics

The PDMX index's custom texture heuristics were useful for discovery, but Fable does not need to keep inventing feature extractors.

### 3.1 `jSymbolic2`: broad, established characteristic extraction

jSymbolic2 implements 246 symbolic-music features (1,497 values when expanded), covering pitch, melodic intervals, chords/vertical intervals, rhythm, texture, instrumentation and other statistical characteristics. It reads MIDI and MEI and can run over windows rather than only whole pieces.

Sources:
- https://github.com/DDMAL/jSymbolic2
- https://zenodo.org/records/1492420

**Use in PianoProject:** candidate search/ranking, clustering and broad characteristic indexing. Examples: register, melodic interval profile, amount of arpeggiation, rhythmic density, vertical texture statistics.

**Do not use it as:** a named-style authority. A high arpeggiation statistic does not prove "Alberti bass"; texture features nominate passages for source-backed inspection.

For MEI-native DIME files, it can operate without a MusicXML conversion. For MusicXML corpora, a Verovio/humlib conversion to MEI introduces a conversion step, so the results are discovery evidence rather than correctness evidence.

### 3.2 `musiF`: useful for corpus-scale feature extraction where music21 is already acceptable

`musiF` is a corpus feature-extraction framework with stock feature modules and integration of music21 features. It can extract measures, range/register, rhythmic and other score characteristics into tables and supports windowed analysis/custom modules.

Sources:
- https://github.com/DIDONEproject/musif
- https://musif.didone.eu/Feature_definition.html

**Use:** replace one-off Python scripts that compute generic repertoire-search features over a corpus.

**Limit:** because it relies in part on music21, it is not an independent verifier of music21 serialization. It is a search/indexing tool.

### 3.3 `ms3` + DCML TSVs may remove even more custom feature code for those corpora

For DCML corpora, the note/measure/chord/harmony TSVs are already generated and schema-described. Fable should query those tables before writing custom MusicXML traversal for range, note values, chord labels, measures, cadences or phrase positions.

## 4. Generation: no hidden magic replacement was found

The independent search did **not** find a mature notation-aware generator library that clearly supersedes the current `music21 + PianoProject-specific constraints` architecture.

That is useful information:
- music21 remains the sensible Python notation object model for the generated exercises;
- OR-Tools/CP-SAT remains appropriate only when a real discrete search/unsatisfiable-constraint problem appears;
- Partitura is stronger as a parser/witness than as a pitch-spelling/generation authority;
- MusPy/MidiTok are aimed more at event/token representations and model generation than precise pedagogical notation; MidiTok still lists MusicXML support as a TODO;
- Abjad/LilyPond is a different engraving pipeline rather than a drop-in MusicXML generator and would increase conversion complexity.

The better improvement is therefore **not replacing music21 wholesale**. It is:
1. keep generation thin;
2. use sourced/pedagogical constraints only where the app truly owns them;
3. check the result with another parser/application;
4. delete small duplicated theory/spelling code where a library demonstrably has parity.

## 5. Testing: refine the initial packet rather than reversing it

### Finite parameter spaces

For key x variant combinations such as CF1, exhaustive enumeration is still better than Hypothesis. Keep that conclusion.

### Where Hypothesis becomes worthwhile

Hypothesis is valuable where the input space stops being a small cartesian product, especially:
- arbitrary but valid combinations of score parameters;
- ties/tuplets/voices/pickups/repeats interacting;
- transformations chained through write -> parse -> transpose -> rewrite;
- round-trip properties where shrinking a complex failing score to the smallest counterexample saves debugging time.

Hypothesis' stateful testing can generate sequences of operations rather than one value at a time.

Source: https://hypothesis.readthedocs.io/en/latest/stateful.html

**Recommendation:** do not install it merely to replace `for key in keys`. Use it when Fable has a transformation/state space for which hand enumeration is no longer complete.

### Differential testing should become the main notation-testing pattern

For the important facts, prefer disagreement detection among independent implementations over another hand-written PianoProject checker:

- `music21 generator -> Partitura`
- `music21 generator -> humlib/musicxml2hum`
- `music21 generator -> MuseScore import/render` for selected/high-value cases
- `ABC source -> abc2xml` versus the shipped MusicXML
- `MuseScore-native source -> ms3` before any conversion
- `Humdrum-native source -> humlib` before any conversion

When two independent readers disagree, keep the case and resolve it against the edition/source rather than teaching one parser to imitate the other.

## 6. Better source map for genre/accompaniment research

The named accompaniment problem should be researched from stronger source families rather than rebuilt as a universal detector.

### Alberti / broken-chord accompaniment

Strong source families:
- DIME Mozart MEI;
- the Mozart piano-sonata Humdrum digital edition with reference edition;
- DCML Mozart sonatas with score + harmony data.

Search mechanically for low-high-mid-high / repeated broken-triad patterns, but attach the **Alberti** label only where a published/source-backed description supports it. Raw pattern facts can still be indexed everywhere.

### Waltz bass / oom-pah-like accompaniment

Strong sources:
- NIFC Chopin first-edition Humdrum corpus for waltzes;
- KernScores waltz collections;
- Beyer (already indexed) for explicitly pedagogical early examples.

A work being a waltz plus a persistent beat-1 bass / later-beat chord texture is much stronger evidence than a generic `leftHandPattern` flag.

### Ragtime / stride-adjacent accompaniment

The Scott Joplin Humdrum digital edition is a major upgrade over PDMX for this research because it ships symbolic encodings alongside the reference scans used to encode them. It contains rags, marches/two-steps and concert waltzes.

Use it to characterize alternating bass/chord, octave reach, syncopation and register movement. Do **not** automatically relabel every Joplin left hand as "stride"; keep the named style tied to published terminology and exact passage evidence.

### Walking bass

**FiloBass** is a purpose-built research corpus of 48 manually verified professional jazz bass transcriptions (more than 50,000 note events), with score, performance-aligned MIDI, beat/downbeat, chord-symbol and form metadata.

Sources:
- https://aim-qmul.github.io/FiloBass/
- https://zenodo.org/records/10265335

This is far better reference material for deriving/validating what a walking-bass generator should do than guessing from a PianoProject detector. It is bass accompaniment research, not beginner piano repertoire, so use it to source rules and characteristic distributions, then make the piano teaching decision separately.

### Boogie bass

No comparably strong symbolic corpus was found in this pass. Do not manufacture confidence from weak web MIDI files. Treat this as a remaining targeted-research gap: use published boogie-woogie pedagogy / source scores and curate a small set of verified examples rather than training a broad detector from noisy files.

## 7. Revised source hierarchy for Fable

For correctness of a real score, prefer roughly:

1. **Scholarly/institutional digital edition with machine-readable score and explicit source/editorial provenance** (e.g. DIME; NIFC Chopin; suitable DCML corpora).
2. **Edition-linked digital encoding with the reference scan/edition beside it** (e.g. Joplin, Mozart/Beethoven Humdrum repositories).
3. **Curated digital score project with native source files** (e.g. OpenScore corpora), cross-checked where learner-critical.
4. **Mutopia**, especially where its LilyPond source can be compared with an edition.
5. **PDMX**, as a large candidate pool; promote individual files only after source/edition verification.
6. **Unverified web MIDI/score aggregations**, discovery only.

This does not make any source infallible. The important upgrade over the initial packet is that PDMX and Mutopia no longer have to carry responsibilities better handled by edition-linked symbolic corpora.

## 8. What I would hand Fable

Do not make Fable repeat this research. Give it these concrete directions:

- **Generated exercises:** keep music21; add Partitura/humlib differential witnesses where the fact matters; use MuseScore/Verovio selectively for application/render checks.
- **MuseScore-native corpora:** parse with `ms3`, not via MusicXML when avoidable.
- **Humdrum corpora:** query/verify with humlib and keep the source reference edition attached.
- **Repertoire search:** use existing DCML TSVs and/or musiF/jSymbolic2 for generic characteristic indexing instead of growing custom PDMX heuristics into a framework.
- **Named accompaniment:** use mechanical features only to find candidates; source-backed labels remain curated.
- **Real-piece correctness:** for learner-critical pieces, compare against the edition-linked source rather than relying on agreement between parsers of the same potentially wrong transcription.

That gives the project a better route than either extreme: neither "trust PDMX/Mutopia" nor "write PianoProject's own musicology stack."