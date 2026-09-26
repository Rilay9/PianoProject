===== PART 12: THE REVIEWER'S REPERTOIRE AND PDMX AUDIT (2026-09-26, while C6 ran; at 5627570) =====

Downstream guidance for E and G, not a request to interrupt C6. The reviewer inspected the T36b
repertoire trace, the P14 quarry record, the PDMX tooling, tests and import path, the stage
files, the C0 vocabulary and excerpt design and the E/G backlog, and counted placements
directly from stages 0–9.

1. **T36b's diagnosis stands and is not redone in E**: the quarry measures a rich feature
   vector that mostly disappears before selection; a scalar can invert a musical ordering
   because tuplets, grace notes and coordination are absent or weak; a whole-piece scalar
   cannot answer whether a 4–8 bar section is appropriate; whole-piece placement by band is not
   a pedagogical assignment. **The corpus-wide problem is larger**: the curriculum makes
   pedagogical claims about PDMX pieces the pipeline has never established from the music.
   `import_pdmx.py::concepts_for()` derives only coarse claims (repertoire, single-line melody,
   folk tune, keys, hand crossing, wide span); it does not establish rootless voicings, a
   montuno, repeated-note fingering or four independent voices. Yet: `jazz.7` (rootless voicings,
   quartal colour, tritone substitution) lists PDMX Jingle Bells jazz, Skating, Avalon, Tiger Rag,
   I Got Rhythm, Fly Me to the Moon; `jazz.8` (9ths, 11ths, 13ths, modulation) three PDMX
   pieces; `jazz.9` (comping, walking, soloing on one tune, while its finder says to avoid
   written-out arrangements) six PDMX files; `latin` (clave, tumbao, montuno) Cielito Lindo,
   Guantanamera, Só Danço Samba, How Insensitive, Tico-Tico, La Cumparsita; `hymns` (four-part
   harmony with walking bass and passing chords) PDMX hymn and pop arrangements whose texture
   the import does not represent; `technique.4` (scales, arpeggios, controlled touch; "avoid
   repertoire pieces") three Lemoine études; `technique.5` (repeated notes with changing
   fingers, 2:1 coordination, dynamics) three Duvernoy; `technique.6` (broken sevenths, wrist
   rotation, voicing) Czerny Op. 299 Nos. 1, 3, 4; `technique.7` (double notes, thirds, sixths,
   octaves) Czerny Op. 299 Nos. 5, 8, 10. Some may be excellent; the data path does not prove
   it. E must not validate them against the rung prose that selected them; the notation
   establishes the opportunities, and physical-technique claims still need human review. **A
   valid file is not automatically a valid teaching assignment** — the repertoire analogue of
   D's rule.
2. **Dependence on PDMX is substantial**: 439 song-option placements across stages 0–9, 326
   unique ids, 236 PDMX placements, 203 unique PDMX items on rungs — more than half of all song
   placements. By stage: 1: 3/28; 2: 20/38; 3: 38/70; 4: 62/114; 5: 36/51; 6: 28/44; 7: 25/44;
   8: 11/24; 9: 13/25. Tracks: classical 49 of 88 unique song options; chords-pop 34/42; jazz
   25/26; hymns-gospel 20/23; latin 11/12; technique 12/12; holiday 22/29. E's demands and needs
   gate is a prerequisite for trusting a large fraction of the curriculum, not cleanup.
3. **"542 PDMX rows" is never a coverage argument.** The quarry itself showed why: 254,077
   archive rows became 37,499 after basic gates; deduplication alone removed 142,078; the
   survivors skewed to fiddle and ethnographic material; of the first 368 machine-valid results,
   90 were single-line references; the easiest band was the most dangerous (70 of 80 candidates
   melody-only lead sheets, 40 unrated or low-view junk, hence the `attested()` floor). Report
   adequacy in usable musical experiences: distinct works, distinct arrangements where the task
   changes, demand coverage, texture, rhythm, key, range and coordination coverage, authentic
   repertoire versus study versus lead sheet versus reference, whole-piece versus excerpt
   opportunities, human-reviewed quality, a strong application of the intended skill. Never a
   target of N pieces per stage.
4. **Replace the three-song floor** (R23): "at least one strong application experience when the
   concept benefits from application" — a whole piece, an authentic excerpt, a technical study,
   a generated study, a creative or harmony task, accompaniment, an ear or transfer task;
   further repertoire is depth and choice, never a validator quota; an evidence-driven selector
   must not be fed three mediocre choices because an old validator demanded three songs.
5. **The needs-versus-taught gate answers two independent questions**: can the learner cope
   with this material, and does it provide the opportunity the rung claims. For every option E
   knows: measured demands of the actual file or arrangement; derived needs; the target role
   (example, guided application, independent application, transfer, repertoire for its own
   sake); which target opportunities are present; important unintended demands; provenance and
   confidence; which claims are human-supplied. The validator refuses an assignment whose target
   opportunity cannot be established. "Contains repeated notes" is measurable; "teaches healthy
   wrist rotation" is not derivable from the notes.
6. **Excerpts matter more, not less** (R5, R7, the C0 design kept: own identity; parent and
   printed range; demands measured on the slice, never inherited; `cutFor` and context; a
   lead-in that can be unjudged; excerpt progress never completes the parent; evidence over the
   excerpt describes those bars). Mine windows for pedagogically meaningful opportunities
   (reading pattern, rhythm, coordination, texture, harmonic event, cadence, accompaniment
   pattern, leaps and range, chord shapes, independence, articulation or ornament where
   detectable) with **musical boundaries**: a slice that begins mid-anacrusis and ends before
   resolution is bad material. Score candidate cuts on pedagogical fit and on musical
   completeness; mining proposes, a reviewer hears the cut in context, sees why, adjusts,
   assigns the role, approves or rejects.
7. **A real transfer ladder** (S9): controlled generated material → generated study →
   authentic excerpt → unfamiliar authentic excerpt → full repertoire; not every skill needs
   every step; C's evidence then tests whether skill evidence transferred.
8. **PDMX is a quarry, never the curriculum**: the archive is opportunistic and skewed; the
   curriculum says what is needed and the corpus answers what authentic material can serve it;
   if nothing strong, use another source, author or generate a study, recommend external
   material, or leave the slot honestly unfilled; never widen a rung or weaken a requirement
   because PDMX lacked the piece (R21 stays useful).
9. **Breadth as musical-language exposure, not genre**: homophonic versus contrapuntal; melody
   and accompaniment; chordal; polyphonic; lead sheet; walking, stride, ostinato, broken-chord
   textures; duple, triple, compound, irregular metre; straight, swing, syncopated; tonal,
   modal, blues, chromatic language; accompaniment versus solo; improvisatory versus notated;
   historical and stylistic languages where provenance supports the label. Genre stays a
   browsing and identity label (the standing rule).
10. **Repertoire for its own sake**: distinguish skill application (needs a target-opportunity
    proof), repertoire development (honest prerequisites and reasons), exploration and
    exposure, and the personal project; this survives into G's "why you're playing this".
11. **Repeated placement is not progression**: 439 placements, 326 unique; Greensleeves chords
    8 placements, the easy Canon 7, Hot Cross Buns 5, Ode to Joy RH 5, the Petzold Minuet 5;
    each placement states why this encounter differs (preview → reading → coordination →
    interpretation → memory → performance → retention, or a new perspective); with C0's role.
12. **PDMX identity work is preserved** (the regression tests over opus and catalogue numbers,
    movements, keys and titles, easy arrangement versus full score, multiple uploads, misleading
    upload titles, deterministic edition choice; never title-string deduplication) and extended
    to the provenance model (R35): composition → arrangement → edition, upload or source →
    normalised score → excerpt; two uploads may be duplicate editions; an easy arrangement and
    the original are not pedagogical duplicates; two excerpts of one score are different
    experiences of one parent.
13. **Tempo provenance stays explicit** (R11; 176 rows defaulted at T36b): written tempo if
    present; the converter's default if supplied; source and confidence; whether tempo-sensitive
    demands are trustworthy; a practice tempo may be prescribed without calling a percentage
    "of written tempo".
14. **Human review is two decisions**: source and score review (usable, faithful,
    instrumentation, notation and rendering, identity, transcription errors) and teaching-use
    review (good for the claimed role, opportunity present, demands appropriate, cut sensible, a
    teacher would assign it); one `keep` bit never implies both.
15. **"Complete enough for years"** is a longer-horizon audit: worthwhile material across
    beginner, early intermediate, intermediate, late intermediate and advanced and across the
    major experiences; look for cliffs, not empty stages (forty pieces at one level with one
    texture; six advanced jazz uploads; hundreds of folk melodies; showpieces without the bridge
    from intermediate literature; a rock learner with a folder of arrangements but no route to
    musicianship); the question: could the app keep making worthwhile assignments after six
    months, a year, three years, with repertoire retained and interests changing; no terminal
    stage.
16. **Fourteen acceptance tests for E** (into Q8): an option cannot claim a target opportunity
    its measured content does not establish unless it carries an explicit human judgement with
    provenance; needs-versus-taught is checked against the actual arrangement, not title or
    genre; an excerpt's demands are recomputed on its slice and differ when the slice differs;
    whole Anh. 113 is refused for the Stage-3 role while its designed excerpt is accepted; genre
    and tags satisfy no requirement; defaulted tempo cannot masquerade as written; a repeated
    placement requires a role and reason per placement; composition, arrangement, edition,
    source and excerpt identity survive the build; a source-level keep validates no assignment;
    the inventory reports unique works, arrangements and demand coverage; a musically valid but
    pedagogically wrong option is rejected; a whole piece too demanding beside a coherent excerpt
    that fits proves excerpts are not truncated files; technique claims separate measurable
    notation from human claims about execution; output labels measured, inferred and
    authored or human-reviewed properties.
17. **Priority unchanged**: C6, C7; D; E; F; G; X and H. The correction to preserve for E: not
    "how do we maximise PDMX" but "what musical experience does the learner need, and which
    source or excerpt can honestly provide it".

Already covered by a standing rule or row, for the reviewer's question: genre never
difficulty, skill or style (G11, I7, held by rule since 2026-09-25); the converter's defaulted
tempo (R11, T37 built the flag; the reader is E's); the excerpt design (C0a §8; R5, R7); the
three-song floor (R23); the identity tests (R15's decision preserves them); PDMX as quarry not
syllabus (R6, R8, R25, M7's freeze).
