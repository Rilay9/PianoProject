# Readable-score review: advanced addendum

Research/review only. No production placement changes are made here.

Authority: `claude/readable-scores@c1556d70`, using the byte-for-byte extracted shipped MusicXML and the accompanying `dump_score.py` reads.

This pass covers the high-value named claims in Stages 8–9 and makes an important distinction that should govern the final curriculum pass:

- **Score fact**: a claim that the written score itself can demonstrate — ninth-chord voicing, rootless voicing, walking bass, key change, etc.
- **Learner transformation**: something the learner is supposed to do *to* a score/chart — transpose it, improvise over it, make an arrangement, memorize a whole rag. A static MusicXML file does not need to contain the result in advance.

Do not reject suitable repertoire merely because a static file cannot certify a learner transformation. Instead verify that the score is a sensible substrate for the task.

---

# Stage 8

## `jazz.8` — ninths, elevenths, thirteenths, and music that changes key

### `Stardust`
Direct shipped-score read: 52 bars, two staves, estimated level 6.02, one written C-major key signature, no raw chord-symbol objects. The piano writing is harmonically rich, chromatic and heavily voiced, so it is good advanced jazz-piano **TRANSFER**. But the score does not explicitly label ninth/eleventh/thirteenth chords, and it has no notated key-signature change.

**Verdict:** KEEP — TRANSFER for chromatic voicing/harmony. Do not use it as the sole primary for named extension-chord reading or for a visible key-signature modulation.

### `I Got Rhythm`
Direct shipped-score read: 28 bars, two staves, Bb major, estimated level 5.5, dense 4-note RH voicings over moving quarter-note bass, chromatic/diminished movement. The raw reader reports no formal chord-symbol objects, though text on the score includes chord-like labels such as `B6` and `Bdim7/D`.

**Verdict:** KEEP — TRANSFER / strong advanced voicing example. It is useful music, but not the cleanest way to *teach the names* 9/11/13.

### `Uncle Ben's Cakewalk`
Direct shipped-score read: 111 bars, two staves, estimated level 7.59. It has a real written key-signature change from one flat to two flats at bar 55. It is dense full-performance cakewalk/rag writing with no chord-symbol objects.

**Verdict:** KEEP — STRETCH for actual modulation/key-change reading. It is the only one of the three directly read here that visibly changes key signature, but it is far too hard to be the first example of the concept.

### Better already-shipped extension examples
The earlier direct reads found two scores currently placed lower that actually make the extension vocabulary clearer:

- `Fly Me to the Moon`: chord symbols include Am7, **Am9, CMaj9, Db9, Dm9, Em9**, with two-staff voicings.
- `Skating`: chord symbols include **C9, Ab13, Bb13, EbMaj13**, plus 6ths/7ths and written two-staff comping.

These are stronger literal evidence for 9ths/13ths than most of the current `jazz.8` set. Fable should consider cross-listing/moving an excerpt rather than adding another detector.

**Rung conclusion:** split acquisition cleanly:
1. one compact labelled 9/11/13 score/excerpt where pitches and chord names visibly agree;
2. one manageable modulation/key-change excerpt;
3. current advanced pieces as transfer/stretch repertoire.

---

## `blues.8` — the form in twelve keys, and what the ninth chord adds

### `Pinetop's Boogie Woogie (1928)`
Already directly read: 97 bars, two staves, estimated level 7.04, one-flat key signature, no chord-symbol objects, very dense opening notation. Authentic and valuable, but it does not by itself demonstrate “the form in twelve keys,” and it does not visibly label a ninth chord.

**Verdict:** KEEP — STRETCH / historical repertoire. Do not count it as direct evidence for either half of the rung's title.

### `The Chevy Chase`
Direct shipped-score read: 107 bars, two staves, estimated level 7.72, key change from one flat to two flats at bar 70 and meter change 4/4 → 2/2. No chord-symbol objects. Dense full-performance writing.

**Verdict:** KEEP — STRETCH. Strong advanced reading/modulation repertoire, but not a clean ninth-chord or “twelve keys” acquisition file.

### `Black Bottom Stomp`
Direct shipped-score read: 101 bars, two staves, estimated level **8.62**, 1,216 tuplet elements, 726 ties, constant clef changes, no chord symbols. This is genuine high-end repertoire, not a teaching diagram for a ninth chord.

**Verdict:** KEEP — Stage-9/project/stretch repertoire. MOVE/REMOVE FROM CLAIM as primary evidence for `blues.8`'s named ninth-chord concept.

### Curriculum implication
“Play the twelve-bar form in twelve keys” is a **learner transformation / drill**, not something a single fixed score should contain. It should be generated/transposed systematically through all keys. Likewise “what the ninth adds” needs one small literal comparison (e.g. dominant 7 vs dominant 9 with the extra pitch visibly present), not three huge historical transcriptions.

**Rung conclusion:** use generated/key-loop work for all 12 keys; add one compact labelled dominant-9 blues example; keep the authentic full pieces as transfer/stretch.

---

## `chords-pop.8` — playing a song in the key the singer needs

This rung should **not** be audited like a named-texture rung. Transposition is the learner's task.

Representative direct reads:

### `Isabella's Lullaby`
86 bars, two staves, five-flat key signature, estimated level 7.1. Static arrangement in one key.

### `All I Want`
295 bars, two staves, 6/8, C/no sharps-flats, estimated level 6.94. Static arrangement in one key.

Neither score is “wrong” because it does not change key. The curriculum test should instead be: is the song harmonically legible enough that the learner can transpose a manageable excerpt, and does the app let them practise the same material in another requested key?

**Rung conclusion:** choose 1–3 manageable songs/excerpts, then provide the same harmonic material in several keys (generated or transposed). Do not hunt for a MusicXML file that magically proves transposition. The current huge 80–300-bar arrangements are poor *first* substrates; a shorter chordally clear excerpt would be better.

---

# Stage 9

## `jazz.9` — comping, walking and soloing on one tune

Unlike the earlier jazz rungs, several current Stage-9 candidates are genuine **two-staff piano arrangements** rather than one-staff lead sheets.

### `Take Five`
Direct read: 25 bars, two staves, 5/4, six-flat key signature, 49 chord symbols including minor sevenths, dominants and `F7sus4`. Estimated level 6.03. The LH writes an actual repeated comping/bass texture rather than leaving accompaniment completely unspecified.

**Verdict:** KEEP — strong PROJECT candidate. It is especially useful if the project wants odd-meter comping. It does not itself “contain improvisation”; soloing is what the learner does over the form.

### `Lullaby of Birdland`
Direct read: 26 bars, two staves, swing mark, 110 chord symbols, estimated level 6.06. Chords include Abmaj7, B13, Gb13, altered dominants, half-diminished shapes; the actual score writes dense two-hand voicings and rhythmic comping.

**Verdict:** KEEP — one of the strongest current advanced jazz project scores. Excellent for comping/extended harmony. Walking bass is not its sole defining texture, so do not claim every project skill is already written in the page.

### `Ain't Misbehavin'`
Direct read: 36 bars, two staves, swing, estimated level 6.89. The LH repeatedly alternates low bass notes with chord shapes, giving a genuine stride/comping texture.

**Verdict:** KEEP — strong PROJECT/TRANSFER option for bass + chord coordination and swing.

### `Linus and Lucy`
Direct read: 111 bars, two staves, estimated level 7.78, 52 chord symbols. The opening has a literal repeated low-register bass ostinato under the RH material.

**Verdict:** KEEP — STRETCH/project repertoire. Too long/difficult for the first project, but the piano texture is genuine.

### Principle for `jazz.9`
The static score only needs to be a good tune/form/texture substrate. **Comping, walking and soloing can be three learner passes over the same tune**, not three pre-written properties of the XML. Fable should pick one or two project tunes with a manageable harmonic form and supply tasks such as:
1. play written/guide comping;
2. replace LH with a walking line;
3. solo while preserving the form.

That is more honest than trying to certify “soloing” from the score file.

---

## `blues.9` — improvising over the form and making it yours

`Black Bottom Stomp` is directly read above: level 8.62 and enormously dense. It can be aspirational repertoire, but it is an unnecessarily hostile substrate for first free improvisation over a familiar blues form.

**Curriculum implication:** improvisation is again a learner transformation. Prefer a simpler, harmonically explicit 12-bar score/lead sheet for the actual improvisation project, while keeping pieces like `Black Bottom Stomp` as listening/reading/stretch repertoire. Do not demand that a written score “contain improvisation.”

The earlier dedicated 12-bar/walking-bass materials are probably better starting substrates than the hardest historical transcriptions.

---

## `chords-pop.9` — turning a chord chart into an arrangement

Representative direct reads show that many current candidates are already **finished, elaborate piano arrangements**, not chord charts:

### `Le Festin`
159 bars, two staves, 9/8 → 3/4, estimated level 7.29, 777 tuplet elements, no raw chord-symbol objects.

### `Piano Man`
273 bars, two staves, 4/4 → 3/4, estimated level 6.88, very dense full arrangement, no raw chord-symbol objects.

These may be useful as examples of an *end result*, but they are poor starting objects for the learner task “turn a chord chart into an arrangement.”

**Rung conclusion:** provide a simple chord chart / melody+symbols as the **input**, and optionally show one full arrangement as a model/output. Do not count six finished piano arrangements as six opportunities to practise arranging from a chart.

---

## `classical.9` and `ragtime.9`

These are explicitly whole-piece/project rungs rather than named-mechanical acquisition claims. Their current repertoire lists are therefore less suspicious in principle: Ballade/La Campanella/Fantaisie-Impromptu etc. are aspirational long projects, while `ragtime.9` names whole rags.

They still need ordinary file correctness/source verification, but they do **not** need to be mechanically purified to a narrow demand the way an early rung or named-technique acquisition example does.

---

# Advanced-stage conclusions for Fable

1. **Stop asking a static score to prove an action the learner performs.** Transposition, improvisation, arranging and memorising are tasks. Verify the score is a suitable substrate; verify the learner workflow separately.
2. **Keep demanding literal evidence for written technique names.** If a rung says ninth chord, rootless voicing, walking bass, montuno, pedal mark, etc., at least one acquisition score/excerpt should visibly contain exactly that thing.
3. **Advanced authentic pieces are often better as projects/excerpts than primary instruction.** `Black Bottom Stomp` (level 8.62), `Chevy Chase` (7.72), `Uncle Ben's Cakewalk` (7.59), `Linus and Lucy` (7.78) and full `Pinetop` (~7.04) are not bad content; they are simply not compact definitions of a concept.
4. **Some currently lower-rung scores are better literal examples for later concepts.** `Fly Me to the Moon` and `Skating` are clearer extension-chord material for jazz.8 than much of jazz.8's present list.
5. **For project rungs, simplify the input rather than the music.** A short lead sheet/excerpt plus a task (“transpose to E-flat,” “walk the bass,” “arrange this chart”) is more pedagogically direct than handing the learner a 200-bar finished arrangement and calling it an arranging exercise.
