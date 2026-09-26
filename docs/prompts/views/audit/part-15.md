===== PART 15: THE REVIEWER'S GENERATED-CONTENT AND SIGHT-READING AUDIT (first notes 2026-09-26; completed the same day against a72b15b) =====

**First notes**, sent while the audit ran (the stale numbers among them are retired by the completed packet below):

- From the repository's own sight-reading trace (`docs/prompts/traces/2026-09-25-sight-reading.md`,
  counts over seeds 1–500 per level, on the generator as it was at Wave A): at level 2, 74 % of
  phrases had a quarter-or-longer event beginning off the beat; levels 3–4, 98–100 % — syncopation
  written below the rung that teaches it (S26 strengthened; S26 had the levels 3–4 half of this);
  the tie-closing pass can create intervals beyond the intended leap cap (S26); levels 6–7
  produced malformed triplet-rest notation in 87–89 % of sampled phrases (S2, built by T37 after
  the trace — the audit re-checks on the current generator before D inherits the number); phrases
  frequently finish without a convincing rhythmic arrival (S7, G9).
- Musical coherence is not decorative polish after the "real" reading constraints: pianists
  read intervals such as octaves as visual patterns and fluent reading proceeds through larger
  units; tonal structure affects sight-reading performance and pianists visually process harmonic
  predictability in notation. Generated material without phrase structure is not appropriate
  reading material (G9, S7: coherence is a requirement of the family, with a reader's read).
- The distinction being worked out for D: a legitimate canonical drill (a Hanon pattern being
  repetitive is not a defect) against material that promises to behave like music (a generated
  sight-reading phrase with no phrase structure is a defect). The family classification will say
  which promise each family makes.

**The completed packet.** A corpus-wide structural audit of the generated-content system: all
56 generator families in `test_generator_invariants.py` enumerated; the invariant architecture and
family promises inspected; the traces, the vocabulary design, the curriculum integration and the
matrix cross-checked; the runtime sight-reading generator, its seven levels, nine shipped rows,
promise tests and the historical 500-seed trace inspected; representative and adversarial musical
behaviour reviewed where notation or code establishes it. Not a claim that a human heard every
generated score: the space is unbounded, and heard validation stays a D and H human-review
requirement. The verdict: the generator is not fundamentally bad and is not thrown away; its
structural testing is unusually strong; structural correctness, musical usefulness, physical
plausibility and pedagogical role are still conflated, and D separates them with the abstractions
C0 already designed rather than another redesign.

1. **Stale findings retired — D starts from the current tree.** The triplet-rest figures (87 %,
   89 %) are historical reproduction evidence for S2, fixed by T37, whose promise test generates
   levels 6 and 7 repeatedly, checks every rest inside a triplet carries its tuplet and checks
   that triplet rests were met. The off-beat percentages at levels 2–4 (74 %, 98 %, 100 %) predate
   T37's `metricPlacement` for levels 1–4 and its promise tests on the absence of syncopation
   below 4.5: historical, not a D defect (S26's evidence relabelled; its tie-closing leap stays
   open). The 36-item 3.8-second broken-seventh failure is repaired (the family repeats its
   sixteenth figure to clear the five-second floor); no open row, none reopened. The black-key
   arpeggio and seventh fingering defects have dedicated tests and the policy prints no fingering
   on unverified shapes (G30's sweep stays; the old defects are not carried).
2. **The 56-family invariant suite is preserved** (bar count, key and signature, hand presence
   and silence, register, chord span, spelling, rhythm, printed directions, fingering where
   appropriate, MusicXML and export properties, family promises; the mutation census proving
   checks go red). It admits its boundary — a structural promise proves neither good music nor
   good teaching material — and D extends it, never replaces it (G22, G40).
3. **C0's architecture is used, not reinvented** (G14, G23): musical knowledge → pedagogical
   recipe → realiser → structural validator → pedagogical validator → musical-quality evaluator;
   `role?: canonical | variable | transfer` (G25); the interval-reading worked example is the
   family-contract pattern to generalise across the 56 families.
4. **Every family has an explicit pedagogical contract** (G1, G3, G4, G17, G8): primary target
   skill; legitimate secondary target skills; prerequisites and assumed demands; required
   opportunities with a minimum useful density; forbidden and unintended demands; physical
   constraints where applicable; role; whether it promises a drill or pattern or music-like
   material; what measurement could support evidence; what the app does not measure. The build
   measures the generated MusicXML with the canonical detectors, never trusting parameters or
   titles: `maxInterval: 3` is a constraint to verify, not evidence of an opportunity.
5. **Four distinct gates**, each applied as the promise requires (G23): structural validity
   (the suite); pedagogical validity (enough opportunity for the target skill, no unprepared
   demands, an appropriate combination, useful for its role — acquisition, practice, transfer,
   assessment); physical plausibility (simultaneous span, fingering, repeated-note solution,
   thumb crossings, register, leaps, velocity and tempo, duration and endurance, a defensible
   physical solution); musical validity only to the degree the family promises music — a scale,
   Hanon figure or chord drill is not a miniature composition; a sight-reading phrase, study,
   groove, accompaniment or style exercise is judged as music. Useful repetition is never
   penalised; random legal notes are never accepted as music.
6. **Open voicings, the concrete physical failure** (G38): the quartal shape asks one hand for
   C4–F4–B♭4–E♭5, 15 semitones; add9 reaches 14; the suite exempts them because the tables
   define the voicings and a pianist would split them. The exemption is not a waiver: D resolves
   the teaching intent — redistribute between hands, a narrower physically appropriate
   arrangement, or an advanced large-hand voicing declared with its physical prerequisite and
   alternatives. A structural exemption never means pedagogically acceptable.
7. **Canonical, variable and transfer become data** (G25): canonical teaches the model; variable
   changes the realisation and keeps the constraints; transfer changes surface and context enough
   to establish generalisation; never inferred from different ids or seeds. The worked example's
   admission — fixed C-position material cannot establish transfer to other positions — is the
   normal honesty. Not every family provides all three; a scale generator supplies canonical and
   variable practice while an unfamiliar passage or excerpt supplies transfer; no family is
   contorted into fake transfer to fill a schema.
8. **Family variety is not progression** (G18, G26): the round-robin in `add_technique_units.py`
   solved a catalogue problem; the learner eventually meets an intentional sequence — canonical
   model → isolated controlled practice → variable practice → combination → changed key, position
   or context → transfer material → authentic excerpt → later retention and transfer check — driven
   by target skill, demands and role, never another quota.
9. **Sight-reading is different**: since T37 and C4 key, metre, hands and tempo reach the
   generator; promises can be required or excluded; untaught demands are excluded; phrases are
   checked by the same demand vocabulary; one dimension moves at a time; seeds reproduce; phrases
   stay unseen; triplet rests and beaming have regressions — all preserved. Its remaining problem
   is musical phrase quality, not validity (S7, S18, G9): legal rhythmic cells plus a constrained
   melodic walk, chord-tone snapping at 5–7 useful but not phrase structure. S7 covers:
   convincing beginnings; rhythmic arrival; phrase ending; contour; local repetition and
   variation; a motif or recognisable cell where appropriate; tension and release; cadence or
   plausible closure; excessive oscillation; excessive arbitrary repetition; rest placement and
   breathing; the balance of predictability and novelty. The qualitative finding stays (phrases
   that stop rather than arrive); the pre-T37 percentages do not.
10. **Readable music, not random difficulty** (S7, G9): readers use patterns, interval shapes,
    rhythmic grouping, tonal expectation and harmonic structure, so a coherent phrase can be
    better reading material than a random one with the same nominal demands; D rejects the
    assumption that unpredictability is better practice — the goal is unseen, not structureless.
    **And not over-composed**: one four-bar template with one cadence teaches the generator; D
    builds a grammar and distribution of plausible phrase behaviours, tested across seeds, never
    one golden template.
11. **Constraint satisfaction apart from candidate quality** (G20): hard constraints first
    (required demand present, forbidden absent, taught material only, range, metre, key, physical);
    then valid candidates scored for soft qualities (phrase shape, arrival, contour, repetition
    and variation, density, rest quality, harmonic agreement, awkwardness, pattern degeneracy);
    chosen deterministically from the seed; soft preferences never brittle invariants.
12. **Distribution tests, not only example tests** (G22): over large deterministic seed sets,
    report and bound key, metre, interval, rhythmic-event, rest-density, repeated-note,
    contour-diversity, phrase-ending, opportunity-density, accidental, range, hand-pattern,
    rejection-rate, candidate-score and near-duplicate distributions; a family can pass every
    single-file invariant with a terrible distribution.
13. **Minimum opportunity density** (G3): presence (at least one), useful practice density,
    overconcentration (motor looping that stops testing reading or transfer); thresholds
    family-specific, never one universal percentage.
14. **The generated study is the missing middle** (G19, G16): 8–16 bars combining one target
    skill with known supporting demands, built on the same recipe, realiser and validator
    architecture with a stronger musical promise than a drill; never a generic random-melody
    machine; where phrase grammar and candidate scoring earn their complexity.
15. **Interval reading stays a priority family** (G7, G10): canonical interval shape → multiple
    starting notes → other positions and registers → other keys → fingering support reduced →
    an unfamiliar generated phrase → an authentic excerpt → natural occurrence in repertoire; a
    new seed in the same C-position family is never transfer; rung 3.4's material must create
    the away-from-middle-C opportunity.
16. **Technique assessment says what was measured** (G8): a structurally perfect five-finger
    pattern can be played unevenly; if only pitch and timing are measured, tone, evenness and
    ease are not claimed; every family carries an assessment declaration — what can be judged,
    from which input, at what precision, what stays unjudged.
17. **Style generators need narrower claims** (G11, T42–T45; no new rows): generated objects
    are named by what they are — a I–V–vi–IV loop, a i–♭VII–♭VI–♭VII vamp, son clave, a tumbao
    pattern, a ii–V–I progression, a root–fifth–octave texture — and F and G own where, how
    often and in which traditions they occur; no genre theory in a title, docstring or catalogue
    fact. **Groove and style families** (clave, tumbao, montuno, Latin groove, boogie, stride,
    comping, walking bass, secondary rag, modal vamp, riff, ostinato) make a stronger promise
    than a scale and are reviewed for it: idiomatic enough to teach under this name, the rhythmic
    relationship right, the hands making musical sense, the register plausible, the groove
    surviving repetition, a vocabulary fragment not presented as the whole style; where code
    cannot establish idiom, marked for human hearing (G32, G29).
18. **Human review, made efficient** (G28, G29, E16): the workbench shows per candidate the
    rendered notation, audio, family, seed and version, target skill, role, measured demands,
    required and forbidden constraints, physical flags, musical-quality metrics, curriculum
    destinations, GOOD / BAD / FIX with reason and category; humans concentrate on physical
    defensibility, musical shape, stylistic authenticity and usefulness; the LLM triages and is
    never the final judge.
19. **Identity includes the pedagogical specification** (G21): family + recipe + seed +
    generator version; a changed recipe never lets an old seed mean different music while the
    learner's history treats it as the same encounter.
20. **Difficulty stays multidimensional** (G2, G26): never a smarter single number; demands of
    reading, rhythm, coordination, physical, harmonic, interpretive and assessment kinds;
    `levelEstimate` a sorting summary as C0 specifies; selection on demands and readiness.
21. **`generate_exercises.py` is not split for size** (G13): split where it creates clear
    ownership of musical facts, family recipes, realisation, validators and contracts.
22. **The implementation order**: preserve the census; one authoritative family-contract table;
    populate `targetSkills` and `role`; measure generated demands with the canonical detectors;
    required and forbidden demand checks and useful-density checks; the physical gate with
    `open_voicing` first; classify every family drill versus music-like; musical-quality
    evaluation only where promised; the sight-reading phrase grammar and selection under S7 and
    G9; large-seed distribution tests; the microscope with notation and audio; the generated-study
    middle only after the validators are trusted; canonical → variable → transfer into curriculum
    and session selection; the complete family review recording heard against inspected. Never
    begin by adding families.
23. **Twenty acceptance tests** → Q41.
24. **Not rebuilt**: the census; mutation testing; the fingering tests; the sight-reading promise
    and absence tests; reproducible seeds; the demand vocabulary; C0's contract design; the three
    roles; the skill, demand, evidence and address distinction; the reader's one dimension at a
    time; honest refusal of impossible combinations.
25. **Bottom line**: a mechanically well-tested content factory not yet made into a
    pedagogically typed and musically reviewed teaching system. D's job: say exactly what each
    family is for → prove the output provides that opportunity without unintended demands → prove
    the physical request is defensible → apply musical standards proportional to the promise →
    state what the app can measure → connect the material into canonical, variable and transfer
    experiences → use human ears where notation and code cannot settle it. Sight-reading is the
    strongest test case: structurally honest now, its next layer is readable phrases.

**The reviewer's next audit**: the teaching experience around exercises and practice — from
"the teacher noticed a problem" → the appropriate exercise → controls, mode, tempo, hands →
attempt → feedback → retry or change → return to music; whether the C and D architecture becomes
a piano teacher rather than a sophisticated content selector (X's ground).
