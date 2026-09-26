===== PART 17: THE REVIEWER'S MUSICIANSHIP AUDIT — EAR, AUDIATION, HARMONY, IMPROVISATION, ENSEMBLE, ARRANGING, COMPOSITION AS ONE LONGITUDINAL SYSTEM (2026-09-26, against 29e3914 with the D0 draft) =====

0. **A correction to the D0 draft, made before dispatch.** The draft called
   `tools/content/demands.py` the build-side twin of `app/src/demands/detect.ts` and asked the
   agent to diff the two over the 56 families. That is not C2's architecture: the script's own
   header says the definitions are the TypeScript detectors, that it runs score files through
   `app/tests/unit/demandsOfFiles.test.ts` under Vitest and reads back the ids, that a second
   implementation would be the level model's two ports again, and that nothing in the build
   calls it yet; `docs/03-content-pipeline.md` says a demand has one definition and it is the
   app's; the C2 entry says one implementation. Verified at the lines. The parity hypothesis is
   deleted; the useful test is a bridge regression — generated outputs through the script return
   exactly the ids the detectors produce — and then the canonical path across every family. A
   literal reading of the draft could have created or normalised two implementations and undone
   one of C2's strongest decisions. Otherwise the reviewer reads D0 as very good: the contract as
   data, drill apart from music, the three roles, the physical gate apart, a new seed never
   transfer, musical evaluation left to the later briefs.

1. **Verdict.** The app holds far more musicianship machinery than its learner-facing structure
   shows: interval, major and minor, chord-quality, seventh-quality, cadence and progression
   hearing; melodic and harmonic dictation; ear-tune reconstruction; Simon; rhythm dictation;
   chord and inversion construction; Roman numerals; secondary dominants; modes; chord-scale
   drills; extended chords; transposition; accompaniment patterns; charts; backing loops; blues;
   comping; walking bass; form tracking; call and response; trading fours; improvisation;
   listen-back; arranging; reharmonisation; composition; Free Play; duet and accompaniment. Not
   another pile of features: the deficiency is integration. The app teaches nouns — interval,
   cadence, numeral, scale, chord, mode, progression, transposition, motif, form — and a musician
   needs them as representations and uses of one heard relationship: hear it → anticipate it →
   sing or tap it → find it → identify it → see it → play it → transpose it → accompany it →
   improvise with it → recognise it in repertoire → create with it. Confirms I17, I18, I19,
   T21, T22, L24, M10 and the G and X plan.
2. **The curriculum's long arc is preserved**: theory-ear from intervals and I–IV–V through
   cadences and inversions, sevenths, progressions and modes, Roman numerals and harmonic
   dictation, secondary dominants, modulation, whole-form hearing and transcription;
   improvisation from a small note set through call and response, blues, changes, modes and
   guide tones, colour, reharmonisation, composition; chords-pop toward accompaniment,
   transposition and arranging; jazz toward comping, walking bass, hearing changes, extended
   harmony; jam toward form-following and trading. The strands advance beside one another
   instead of converging.
3. **I17 is the central musicianship invariant**: important musical knowledge eventually
   appears in multiple modalities and real musical contexts; a concept is never "learned"
   because its isolated drill passed. The V–I example: hear tension and resolution → sing the
   resolution → find the bass movement → identify V → I → construct it in several keys → read it
   → predict its sound → accompany a melody containing it → recognise it in unfamiliar
   repertoire → improvise into the resolution → transpose it → use it in an arrangement; not
   every concept traverses twelve steps. I17 with L24, no subsystem.
4. **Audiation is a real longitudinal ability** (I18, T22, M10): sound ↔ internal hearing ↔
   notation ↔ keyboard ↔ function; hear → imitate, sing, find; see → imagine, sing or tap, play
   after imagining; hear → identify pattern or function, locate it in notation; see a cadence →
   predict its sound; see a phrase → anticipate arrival, tension and release; hear → reproduce,
   notate; recognise a function in repertoire; use the heard relationship in accompaniment and
   improvisation; living in reading, repertoire, harmony, improvisation, accompaniment and
   composition, not only Theory & Ear.
5. **Auditory memory apart from ear musicianship** (T22, L24): Simon exercises sequence memory
   and a longer chain establishes no tonal hearing, scale-degree function, interval recognition
   in context, harmonic hearing, anticipation, transcription or playing by ear; literal echo
   tests reproduction, not tonal understanding. Ear-experience roles, named honestly: auditory
   memory; echo and reproduction; tonal-pattern hearing; interval hearing; scale-degree and
   function hearing; harmonic hearing; prediction and audiation; dictation and transcription;
   playing by ear; transfer into repertoire; creative use. Never ten permanent learner scores
   because ten roles are named.
6. **`earTuneDrill` shows why** (T22, I18, D's contracts): a diatonic random walk with the last
   note forced to tonic, whose comment (`app/src/engine/drills/harmony.ts:256`) calls it the
   shape of every folk melody the ear knows — not a defensible generalisation; random diatonic
   reconstruction can test short-term pitch memory without teaching function, phrase, motif,
   expectation, cadence, scale-degree hearing or chunking. Not made prettier: D and G decide
   what an ear-tune item is for — memory said as memory; tonal audiation generated from a tonal
   phrase grammar with scale-degree function and phrase structure; transcription preparation
   from increasingly authentic phrases and then real excerpts.
7. **Ear training progresses toward authentic music** (T22, I17, E, G): controlled tones and
   patterns → short tonal phrases → familiar tune fragments → unfamiliar coherent phrases →
   authentic excerpts → the learner's repertoire → external music and other musicians; never
   "eight random bars, but longer"; at height the challenge is real phrase structure, harmony,
   bass motion, inner voices, form, repetition and variation, modulation, texture, extracting
   information from actual music; E's excerpts serve ear training too.
8. **Playing it back and writing it down differ** (L24, T22, F): theory 9 asks to hear eight
   bars three times and write them down, while the machinery is MIDI reproduction; reproduce by
   ear, identify function, play bass and chords, notate rhythm, notate melody, a lead-sheet
   reduction, a full transcription are distinct; "dictation" is never awarded because MIDI notes
   matched; without notation entry the app says it can check the played reconstruction and
   writing it down is an external task, a self-report or a project milestone.
9. **Harmony moves label → sound → function → use** (T21, I17): what is it called, what does
   it sound like, where does it go, build it, recognise it in another key, transpose it, voice
   it, use it under a melody, hear it in repertoire, improvise through it; Roman numerals unify
   the tasks across keys; drills are not flash cards with MIDI answers.
10. **Chord-scale work stays a constrained exercise, never harmonic truth** (F0, T21, L24):
    `chordScaleDrill` can prescribe Ionian over a maj7 and mark Lydian wrong because the table
    chose one scale — its own comment knows it; the honest contract is "practise this specified
    mapping", never "find the scale that fits"; later, context, alternatives, chord and guide
    tones, tension choices; one mapping table is never universal harmony.
11. **Extended-chord construction is not voicing** (T21, G38, L24): the drills require every
    chord tone, useful as "spell the complete theoretical chord", not "voice this idiomatically";
    spell → hear quality → identify function → choose essential tones → voice physically →
    voice-lead → comp in context; connects to D0's physical contract.
12. **Harmonic dictation's segmentation is uncertain evidence** (L68, kept): the 120 ms chord
    boundary and the next-expected-chord heuristic are measurement machinery, confounded by
    rolled chords, slow attacks and expressive timing; record segmentation confidence and never
    read an uncertain split as certain failure. No new row.
13. **Improvisation develops constraints, listening and intention, not correctness** (L67):
    the strong ideas kept — few notes, rhythm and silence, call and response, motif and
    variation, guide tones, changes, reharmonisation, listen-back, trading — become a clearer
    progression of creative constraints: pulse and form, phrase entry, phrase length, silence,
    rhythmic continuity, motif reuse and development, register, chord- and guide-tone targeting
    where relevant, tension and release, response to a call, recovery after losing the form;
    never "improvisation accuracy 82 %". **Objective apart from interpretive** (L67, L24):
    measurable — entered in own bars, stayed in form, stopped in the partner's bars, rhythmic
    continuity, range, a repeated motif detected, chord-tone incidence where harmony is known;
    not machine-judged — interesting, expressive, tasteful, phrasing, space, style; reflection
    and listen-back for those, never fake objective scores.
14. **Listen-back is pedagogically central** (L67, M10, X, G): "listen once without playing;
    pick one phrase you would keep and one place the line lost direction", then "another chorus
    keeping the phrase and changing only the weak area" — play → listen → reflect → revise,
    not play → score; for improvisation, arrangement and composition.
15. **Ensemble musicianship gets an explicit progression** (I19, X14, X15) on machinery that
    exists (Duet, backing tracks, accompaniment, charts, the form tracker, trading, call and
    response, walking bass, comping): entering after rests, keeping time while another part
    continues, not stopping after an error, recovering the form, listening while playing,
    balancing, accompanying rather than dominating, following symbols and a form, cueing and
    counting in, trading, responding, adapting register and texture to leave space — ensemble
    musicianship even when the other musician is software. **Role awareness** (I19, L22, X5):
    play the melody, accompany it, comp behind a solo, supply bass or omit it, fill or leave
    space, play from a chart, a complete solo texture — the teacher says which role the learner
    occupies, in "why you're playing this" and the intent. **Trading fours trains listening**
    (L67, I19): turn boundary → stay in form → a short coherent phrase → deliberate silence →
    reuse something from the call → vary and respond → a conversation through a chorus;
    motif-response detection not required before it is reliable.
16. **Arrangement is a bridge discipline** (R20, I17): melody, bass, chords, voicing, texture,
    rhythm, register, form, transposition, ear and style combine; one tune moves melody only →
    melody and roots → block chords → an accompaniment pattern → chord-symbol realisation →
    reharmonisation → intro and ending → an alternate texture → transposition → improvisation; a
    transfer environment, not another track.
17. **Composition is meaningful and operationally external** (I20, L86, R18): `improv.9` asks
    for a finished two-to-three-minute piece written down and heard; the only tool is Free Play,
    which keeps no recording; no artefact is owned by the app. No notation editor for that: the
    boundary is explicit and a project can be an external artefact while the app tracks title,
    goal, milestone, form or constraint, next task, reflection, an imported score, MIDI or PDF
    when available, a performance or recording, completed or paused — projects represent
    externally authored creative artefacts, not only repertoire. **Process, not pass or fail**
    (L24, L86, I20): choose a form, make an A idea, create contrast, choose harmony, make a bass
    or accompaniment, revise texture, write an ending, make a readable artefact, perform and
    listen, revise, finish — some known from an imported artefact, others learner-reported;
    never an accuracy rubric.
18. **Free Play stays free** (T23, I15): optional descriptive observation and optional prompts
    — only three notes; a question and an answer; the second phrase starting the same and
    ending differently; a melody over this progression; three voicings of a chord; play then
    sing it back; sing then find it; transpose your idea — and always "just play".
19. **Theory explanation follows experience** (F, M10, T21): hear or play → notice → name →
    explain → use elsewhere, for tonic and dominant, cadence, inversion, mode, secondary
    dominant, modulation, phrase and form, syncopation, harmonic rhythm; F's
    experience-before-explanation gate applied to musicianship.
20. **Lesson statements for F's epistemic audit** (F, F0; no new architecture): perfect
    intervals "simplest, therefore hollow"; the bass note "most of the answer" in dictation; the
    bass "tells you the chord"; a picked-out triad "should" be read as three chords; random
    diatonic tonic-ending material as every familiar folk melody; almost every memorable Western
    melody a repeated motif with small changes; most weak solos weak rhythmically; bands always
    speed up; an arranging trick "the oldest"; almost all short music one repeated-varied phrase
    structure — heuristics at best, never universal facts without support.
21. **The learner model is not a theory checklist** (C0's distinction kept): no hundred tiny
    permanent skills ("hears V7/vi in second inversion"); the model reasons at meaningful
    abilities — ear and audiation, harmonic function, chord construction, transposition,
    accompaniment, improvisation, form, ensemble continuity — plus observed demands; fine-grained
    task data stays evidence and context.
22. **The musicianship topology, an audit model not a database**: Hear (pulse, melody, bass,
    harmony, function, form); Imagine (audiation, prediction, silent reading, singing and
    tapping); Understand (intervals, scale degree, chords, function, form, notation); Find and
    reproduce (keyboard, playing by ear, dictation, transposition); Participate (accompaniment,
    charts, ensemble, continuity, form, listening while playing); Create (improvise, vary,
    reharmonise, arrange, compose); Transfer (authentic repertoire, unfamiliar music, personal
    projects, other musicians). Ear, Theory, Improv, Jazz, Chords, Jam and Composition are never
    seven courses to finish (L89). **Integration chains** are examples of I17, not tracks:
    melody (hear → sing → find the first note → reproduce → identify contour → find it on the
    page → transpose → vary → recognise in repertoire); harmony (hear a cadence → sing the bass
    → identify function → build → voice-lead → transpose → accompany → recognise → improvise →
    arrange); rhythm (hear and tap → count → notate → play on one pitch → coordinate → maintain
    against accompaniment → use the groove in repertoire); form (hear sections → mark form →
    follow a chart → recover → trade → memorise by form → improvise or arrange by form).
23. **Long-horizon behaviour** (I16, I17, I18, L92): musicianship grows less quiz-like —
    identify this interval → sing the bass under this phrase → what function did you hear →
    find it → play the progression in another key → accompany this melody → improvise over it
    → where does the same move occur in your repertoire → use it deliberately in an arrangement;
    the existing machinery stays useful without Stages 10–50.
24. **Twenty-four acceptance tests** → Q43 (a Q row per wave's acceptance set is the pattern
    since Q8, Q41 and Q42; these are G's, with X's workflows).
25. **Row reconciliation**: T21, T22, T23, L24, L67, L68, I15, I16, I17 (central), I18, I19,
    I20, L86, L89, L92, R18, R20, M10, F and F0, X — no new musicianship feature row.
26. **Wave ownership**: D honest contracts for generated ear, harmony and style material,
    coherent tonal phrase generation where generation fits, memory material told from
    audiation material; E authentic excerpts for ear, harmony, form and transfer; F correct
    claims, no universals or fake causal certainty, experience before explanation, honest words
    for what each exercise teaches; G the longitudinal musicianship topology, audiation,
    integration and transfer, ensemble, improvisation development, arranging and composition
    projects, long-horizon continuation; X the workflows (hear → answer → retry → transfer),
    accompaniment, jam and trading, listen-back and reflection, hands-busy creative work; H walks
    the finished system as musicians, listening, and checks the experiences feel connected.
27. **Bottom line**: the danger is a pianist who passed an interval drill, a cadence drill, a
    Roman-numeral drill, a chord-scale drill, a dictation drill, an improv rung and a jam rung
    without one connected ability; the teacher keeps asking — can you hear it, imagine it before
    it sounds, find it, name what matters, play it in another key, recognise it in real music,
    use it playing with someone, make something of your own with it. The reviewer's reading of
    the direction: no "ear training 2.0", no improvisation module, no composition editor — the
    connective tissue over the machinery already present.
