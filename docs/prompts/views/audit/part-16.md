===== PART 16: THE REVIEWER'S TEACHING-LOOP AUDIT — FROM A NOTICED PROBLEM TO THE RETURN TO MUSIC (2026-09-26, against 29e3914) =====

The path traced: recommendation or originating musical problem → why this activity → the
Score, Drill, Lab or Jam, chord-chart, PDF or paper experience → hands-on-piano setup → run →
measurements → summary → Again, slower, faster, weak-bar loop, Done → the stored observation →
the later recommendation; with the different evidence capabilities of Score, Drill, Lab and Jam,
chord chart, PDF and Free Play compared rather than assumed alike. The question: can the app
behave like a teacher who notices a problem, forms a cautious hypothesis, prescribes a useful
intervention, watches the result, changes course when necessary, and returns the learner to the
music to see whether it worked? Today, not yet. The verdict: the toolbox is already strong
(Wait, Keep tempo, hands focus, Duet, Rhythm only, sections, loops, the weak-bar loop, slower
and faster, the tempo ladder, metronome, Hear it, the one-bar preview, Blind, Performance,
keyboard guidance, generated exercises, drills, Lab and Jam, charts, PDF, sight-reading,
repertoire, backing tracks) and the engine already records enough (per-step outcomes, wrong
pitches, misses, early notes, per-measure hot spots, timing deltas, pitch and timing apart,
hands, loop, mode, input, technique measures, provenance, what was and was not judged) — C1–C5
made that consumable. The deficiency is orchestration: tools the learner chooses, not
interventions with a reason and an exit criterion. Most ingredients exist in L19, L32–L34, L76,
L91, X5, X14–X18 and I17; one abstraction is missing.

1. **L19 becomes a causal coaching pipeline with an explicit epistemic boundary.** The app may
   say "bars 12–13 had three misses and two late entries" when measured, and "the transition
   into bar 13 may be the problem" as a hypothesis; never "your left hand is weak" or "you don't
   understand the rhythm" without a discriminating observation. The grammar: what happened →
   what it might mean → what we will try → what result would distinguish the hypothesis; under
   ambiguity, "I'm not sure whether the leap or the rhythm is causing this; let's hold the rhythm
   simple and test the leap" — better teaching than confident misdiagnosis. → L19.
2. **L76's probe is a general principle**: persistent ambiguous difficulty → isolate one
   plausible demand holding the others stable → observe → update only if the probe discriminates
   → otherwise preserve uncertainty; telling pitch-reading from rhythm, one hand from
   coordination, note acquisition from tempo, a leap from its neighbours, decoding from
   fingering, rhythm from synchronisation, memory from motor execution. Probes only when the
   distinction would change the intervention and ordinary evidence stays ambiguous, never after
   every mistake. **When diagnosing, change one important thing** (the practice twin of C4's
   reader): not tempo, a hand, the span, the key, the rhythm and guidance at once, or the
   learner improves and the teacher learns nothing; remediation after diagnosis may combine
   tools freely. → L76.
3. **The missing abstraction: the practice episode** — a transient teaching object, not a
   hierarchy, carrying the originating item or project; the passage, section or bars if known;
   the triggering observation; candidate explanations; confidence or ambiguity; the practice
   intent; the selected intervention; the changed settings and why; the exit criterion; the
   attempts; the result; the reintegration target; the reintegration result. Example: origin
   Nocturne bars 11–13; observed a repeated late or missed left-hand entry at bar 12;
   hypothesis a transition or leap, not yet established; intervention bars 11–12 left hand at
   60 % until three clean entries; then both hands, same span; then bars 9–14 in context; result
   stable in context, still unstable, or inconclusive. The schema is the builder's; the concept
   is necessary — without it the app remembers runs and skills and forgets why this run
   happened. Usually short-lived: most episodes close after a few attempts; enough history is
   kept to answer what strategies helped this piece before, whether this problem recurs,
   whether isolated success transferred back, whether the learner is repeatedly stuck on one
   demand; the live state stays light. → X19 (new).
4. **Practice intent above modes** (X5): learn the notes, solve the rhythm, coordinate the
   hands, fix a transition, build tempo, build continuity, shape dynamics and articulation,
   memorise, test memory, prepare a performance, sight-read, listen and analyse; the teacher
   translates "I keep breaking at the left-hand leap" into loop, left hand, 50 %, ladder off;
   the learner may override. **Every intervention has an exit criterion** drawn from the
   intervention, the skill and the learner's state — three clean starts into the transition,
   two clean loops without slowing, the rhythm right twice before restoring pitch, each hand
   once then together, the phrase twice without stopping, one random start per section, the
   whole piece once without restart — examples, never one global "three times". **The smallest
   useful change**: ±10 % is a manual control, never the universal adaptation; an intervention
   may need a small or large tempo cut, Wait, rhythm-only, no metronome, hands apart, a shorter
   span at the same tempo, or one isolated demand with everything else unchanged. → X5.
5. **Isolated success is not the end** — the most important requirement: play → notice →
   diagnose or probe → isolate → practise → combine → reintegrate → later transfer and
   retention; a clean exercise does not solve the repertoire problem, a clean left-hand loop
   does not establish both hands, a clean slow passage does not establish continuity in
   context. **Reintegration in stages**: problem bar → bar plus entry → phrase → surrounding
   section → full piece → later cold return; the section metadata, loops and history become
   teaching tools. **A failure path**: easier version, a different probe, a different strategy,
   a prerequisite exercise, generated targeted material, an easier authentic excerpt,
   explanation or demonstration, defer and return — repeated failure of one prescription is
   information about the prescription. **A too-easy path**: restore context, raise one demand,
   move to transfer, mark the intervention unnecessary, continue the project; no forced quota,
   especially for returning and uneven learners. → L34, I17.
6. **"Loop the weak bars" overclaims its prescription.** Verified at `ScoreScreen.ts:3538`:
   the action takes the hot spot with the most damage and loops that printed bar plus the
   next. The extra bar is often good teaching, but the evidence did not say why it is needed:
   isolating the damaged bar, practising the entry into it, and practising the exit after it
   are three interventions. Keep the button; the coaching layer chooses the span by the current
   hypothesis or calls it a generic "bar plus connection"; transition trouble is never inferred
   from aggregate bar damage. **Again, Slower −10 %, Faster +10 %, Loop, Done are mechanics,
   not coaching**: preserved as manual controls; a teacher-selected intervention says why ("the
   notes were mostly right, but the beat broke in bars 8–9; same notes, one step slower, to test
   continuity"; "clean twice at this tempo; one step faster"). → L34, X5.
7. **Hands-separate is prescribed, not ritualised**: F reviews the prose that starts almost
   every piece hands apart; X uses it when one hand does not know its material, coordination
   obscures a secure hand, the accompaniment needs automation, or fingering needs stabilising;
   when both hands are secure apart and fail together, more hands-apart is the wrong
   prescription. **Strategy is contextual** (L33, L91): chunking when the span is too large,
   slow practice when execution is unstable, rhythm-only for timing, hands apart for isolation,
   overlap and next-note practice at boundaries, backward chaining for endings and connections,
   random starts for memory, mental practice for memory and audiation, recording for
   performance and listening, interleaving when several skills are stable; F owns correctness
   and wording, X when and how it appears, G its revisiting across years. → L33, L91.
8. **Different experiences, different exit evidence** (X14): Score, measured pitch, timing and
   continuity where available; technique, only what the input measures — tone and ease are
   not inferred from pitch accuracy; ear, recognition or reproduction under no-visual
   conditions; improvisation and Jam, form, continuity and constraint adherence where
   measurable plus reflection, never note accuracy; PDF and paper, practice time, page or system
   progress, the learner's report, microphone or MIDI evidence only where genuinely connected,
   never notes it could not observe; Lab judges nothing today and can still be an intervention
   whose completion is practice or reflection; Free Play, optional descriptive observation,
   never compulsory grading. The episode orchestrates without making the grammars identical.
   **Self-report** (Rough, OK, Clean) is evidence of experience, never proof of competence:
   did it feel easier, was it comfortable, did the strategy help, ready to try it in context —
   never rhythm, tone, technique or notes; used without laundering into mastery (the standing
   rule since C5). → X14, L19.
9. **Repertoire is the origin and destination of many episodes**: real musical problem →
   targeted practice → return to real music; exercises are never destinations because they are
   easier to score; thirds in a piece → original passage → controlled thirds exercise → variable
   phrase → original passage → later fresh excerpt; the reason line keeps the relationship
   ("this is here because bars 18–20 of the piece were giving you trouble", never "practise
   thirds"). **D and E connect here**: a generated exercise is selected from an episode's need
   (target demand, readiness, role, physical envelope, controlled variables) rather than browsed
   among 1,183 items; E's excerpts bridge controlled drill → authentic short context → the
   learner's own repertoire; complementary roles, not competing catalogues. → I17, X19.
10. **Hands-busy: the between-attempts state strengthened** (X15): playing — no prose changes,
    no surprise controls, no intrusive diagnosis; between attempts — one concise result and one
    recommended next action, hands on the piano; browsing — full explanation, alternatives,
    history and settings; no paragraph of pedagogy while the learner is poised to replay a loop.
    **Hands-free is not fully automatic** (X16, X17): automatic continuation for loops,
    prescribed attempts, immediate reintegration, call and response, accompaniment, with
    predictable stop points — ready cue → attempt → completion cue → short result → the next
    attempt when the prescription calls for it, with an obvious stop; non-verbal cues before
    voice; MIDI gestures optional, only outside judged windows, opt-in, learnable, impossible to
    trigger through normal playing — a low A in the piece never means "repeat". → X15–X17.
11. **The coaching layer is surface-independent**: never a giant ScoreScreen conditional; an
    episode may move repertoire Score → generated exercise → Drill → Lab → original Score, or PDF
    → a rhythm intervention → PDF, or chart → chord drill → chart with backing; each surface
    reports what it knows; the episode owns purpose and sequence. **Two scales**: L32's session
    composition ("what do we work on today and why do these belong together") and the episode
    ("what are we doing about this problem right now") are not collapsed; a session holds
    several episodes plus sight-reading, maintenance, creative work or an easy fluency
    experience. → X19, L32.
12. **Progress eventually remembers strategies, not only scores**: this transition responded
    to overlap practice; this piece loses continuity in the development; left-hand-only helped
    and failed on reintegration; random starts repaired memory; tempo was restored after slow
    work; this skill transferred to a fresh excerpt — historical context for coaching, never
    deterministic rules about the learner. → X19, G.
13. **Twenty-five acceptance tests** → Q42.
14. **Wave ownership**: D trustworthy intervention material and contracts; E excerpts and
    measured opportunities; F correct practice-method teaching and wording; G long-horizon
    strategy, projects, lifecycle, transfer and retention; X the primary owner of the episode,
    causal coaching, intent, orchestration, reintegration and the between-attempt flow; H
    real-device and learner-trajectory proof that it feels like practising at a piano rather
    than operating software.
15. **Bottom line**: not more practice features — the loop: notice honestly → a cautious
    hypothesis → discriminate if necessary → the smallest useful intervention → tell the learner
    why → practise with a clear criterion → adapt if it fails or is too easy → restore musical
    context → verify the fix survived → later check transfer and retention. The glue is the
    transient episode that remembers why the learner left the music and takes them back.
    Without it the product is an excellent adaptive exercise selector.

**The reviewer's next audit**: ear training, audiation, harmony, improvisation, accompaniment
and creative musicianship as one connected longitudinal strand (I18 and its neighbours) — whether
it develops a musician over years or stays a collection of good modes.
