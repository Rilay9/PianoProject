# The reviewer's full-tree sweep (2026-09-27), item by item, against the matrix

The reviewer enumerated the branch at 422e0cf with the repository tool and sent 45 observations,
17 consolidated additions and one overarching sentence (Part 9 of
`audit-2026-09-25-outside.md`). This table says, for each, which matrix row already held it,
which row was added, the wave, and where the orchestrator agrees, qualifies or disagrees.
Nothing here changes C4.5; every item lands in a later wave, as the reviewer asked.

**The overarching sentence**, now at the head of the plan's later waves: *the finished
teacher chooses an experience before it chooses an item; features are teaching tools, not
destinations.* Balanced, at the reviewer's strategy review: the choice responds to evidence,
curriculum intent, retention and transfer, the learner's goals and well-rounded exposure (L26),
never only to the weakest measured skill. The same review split R33/R34 between E (import truth)
and X (the learner workflow), made E14's gate measurable, and kept L67/L68 out of C5.

| # | The reviewer's point | Row | Wave | Verdict |
|---|---|---|---|---|
| 1 | Keep C4.5 on course | — | — | agree; nothing here touches C4a–C4c |
| 2 | Content delivery outgrows "precache everything": core offline, the rest cached or downloaded | **E14** (new) | E, X | agree, gated on E's corpus actually growing; today's corpus fits precache and nothing is built before it does not |
| 3 | `ScoreViewportPlan` as a real, pure abstraction OSMD renders; testable without booting the renderer; the portrait karaoke depends on it | U23 (decision strengthened) | H (T) | agree |
| 4 | Layout understands musical density, not only geometry; renderer density is never a second definition of learner difficulty | U14, U15 (decision strengthened) | H | agree; U15 consumes R28's `PieceAnalysis` |
| 5 | Audit every notation surface (OSMD score, drill staff, chord charts, PDF, keyboard strips and ribbons, lesson-embedded notation) against common learner-facing principles | **U55** (new) | H | agree |
| 6 | A real-hardware truth corpus: the same performances through the HP-130 MIDI, the phone microphone and any third route; compare the learner-facing conclusions | L38 (decision widened) | C (AT-11), H | agree, with one qualification: the recordings are the one thing only the owner can supply, so the capture is scripted to one sitting and everything after it is automatic |
| 7 | Generator architecture: musical knowledge → pedagogical recipe → realiser → structural validator → pedagogical validator → musical-quality evaluator | G14, G23 (decision restated as the six stages) | D | agree |
| 8 | Generator identity and cache: family + pedagogical specification + seed + generator version | G21 | D | agree; already the row's decision |
| 9 | The generator microscope | G28, E5 | D (T) | agree; already rows |
| 10 | A first-readable latency threshold for huge scores on a real phone; excerpt files, segmentation or preprocessing rather than whole-score parsing | **E15** (new) | E, H | agree; R5's excerpts solve most of it |
| 11 | The laptop deserves a deliberate experience; separate device capability from interaction context (at the piano, hands occupied; planning and browsing), not phone = playing, laptop = analysis | U29 (decision replaced) | X | agree; the replacement is better than the row's old wording |
| 12 | MIDI import as a first-class learner workflow: bring me music I care about → convert and analyse → what is usable → sections into a project, excerpt or plan; transcription uncertainty visible; provenance and confidence, never silently canonical | **R33** (new) | E, X | agree; this answers the owner's earlier question about the converter's place in the plan |
| 13 | The harmony and improvisation machinery already present (chords, charts, live matching, backing loops, modes, chord-scale, Roman numerals, transposition, ear tunes, dictation, trading fours) becomes one sequenced musicianship strand; build no new harmony feature | I11, I6, M10 (decision restated with the arc) | G, X, F | agree |
| 14 | Trading fours: a later improvisation evidence grammar (form, entry, phrase length, continuity, chord-tone targeting, scale fit, motif reuse, register, response), never "72 % improvisation accuracy"; not evidence today is correct | **L67** (new) | C (later), G | agree |
| 15 | The backing loop: pedagogical backing (clear, exposes harmony and rhythm) is not the same audio design as musically satisfying backing | **I13** (new) | X, G | agree |
| 16 | Chord charts need the same hands-busy audit as scores; the audit spans Score, Chord Chart, Drills, Jam and trading, PDF, Free Play | **X14** (new) | X, H | agree |
| 17 | Ear training as a progression: hear → imitate → identify → sing or anticipate → find on the keyboard → recognise in repertoire → use in improvisation | T22 (decision restated with the arc) | D (AT-8), X, G | agree |
| 18 | The chord-dictation silence threshold is a measurement, not a construct; segmentation carries confidence in the eventual evidence audit | **L68** (new) | C (evidence audit), later | agree |
| 19 | MIDI import's hand split user-correctable; the correction saved and reflected in rendering, demands, difficulty and assignments | **R34** (new) | E, X | agree |
| 20 | Imported-score difficulty is not another source of truth: estimated level plus measured demands; recommendations use the demands; keep the parity tests | R16, R1 (decision widened to imported scores) | E | agree |
| 21 | PDF system detection makes "Follow my PDF" viable: system navigation, automatic progression, timer, bookmarks, goals; never pretending to know the notes | X12 (decision restated) | X, E | agree |
| 22 | No full OMR until the non-OMR PDF experience is excellent | X12 (rule added) | X, E | agree |
| 23 | Diagnostics become a guided setup and calibration in learner words; the technical screen stays for troubleshooting | E7 (decision restated) | X | agree |
| 24 | `devicePreview.ts` extended into a device-matrix harness (342 × 740, ~412 × 915, both orientations, tablet, laptop, short laptop, browser chrome and keyboard) | U30, E10 (decision restated) | H | agree; extend, never a new framework |
| 25 | The test infrastructure is richer than credited (four Playwright configurations, an on-demand render workflow): extend the existing harnesses | Q10, Q13 (decision restated) | H | agree; an implementation correction |
| 26 | The content toolchain becomes one developer-facing workbench around the most useful existing machinery, not more command-line tools | **E16** (new) | D, E (T) | agree |
| 27 | E evolves the existing `tools/content/pdmx/` quarry, shortlist and review into the excerpt workbench, not a new pipeline | R7 (decision restated) | E (AT-6) | agree; a correction to how E was described |
| 28 | Content provenance universal across authored, generated, PDMX, Kern, MuseTrainer, imported MIDI, PDF and external: where from, transformations, measured vs inferred vs supplied, analyser and generator versions | **R35** (new) | E (invariant) | agree; fits C's evidence rule and M6 |
| 29 | An external recommendation as its own object (title, why, target skills, demands, source, availability, interest, project status), never a catalog item pretending to have notation | **I14** (new) | G, E | agree |
| 30 | A content-source decision policy: the teacher chooses the kind of experience first (drill, generated exercise, generated study, sight-reading phrase, PDMX excerpt, full repertoire, ear drill, chord chart, jam or trading, PDF project, external recommendation), then the content | L22, S9 (decision restated; the overarching sentence in the plan) | X, E, G | agree; this is the model the plan already states, now with its list |
| 31 | Evidence grammars differ by experience (sight-reading; technique; ear; harmony; improvisation; repertoire; PDF and external as practice history or self-report); one learner model consumes all without pretending they are measured alike | L24 (decision restated) | C onward | agree; C's rule when it expands; L67 is its first non-score grammar |
| 32 | Feature-packed means composable experiences with a reason, not a menu of modes | L32, X1, X5 (decision restated) | X | agree |
| 33 | Hands-busy as a cross-cutting interaction context (playing / between attempts / browsing) governing auto-start, count-in, cues, control visibility, accidental taps, continuation, notation changes, feedback timing, settings lock | **X15** (new); U18, U19, U20, U39 become its cases | X | agree; stronger than screen by screen |
| 34 | Audio cues as the hands-free channel (count-in, ready, complete, repeat, next, listening) | **X16** (new) | X | agree, with one caution: cues must be told apart from the metronome click and from the piano's own sound, so X tests them at the instrument |
| 35 | Voice control not yet; lifecycle, count-ins, pauses, reachable controls, MIDI-triggerable controls and audio cues first | X16 (decision) | X | agree |
| 36 | MIDI gestures as commands (an unused extreme key, a chord, a pedal gesture) outside judged windows, opt-in | **X17** (new) | X | agree in principle; the risk the reviewer names is the row's first sentence: musical input must never become UI input by accident |
| 37 | Free play feeds the teacher descriptively (time, keys explored, register, rhythmic activity, chords), never a score | **I15** (new) | G, X (later) | agree, much later, and opt-in and visible: recording free play at all changes how it feels |
| 38 | Keep the difficulty parity tests; the scalar level becomes a sort key, not the decision variable | R1 (decision restated) | E | agree |
| 39 | Documentation supersession hygiene: current / superseded / historical on major decision docs | **E18** (new) | H | agree |
| 40 | Decompose the giant modules (style.css, WindowRenderer, sightReading, ScoreSession, help, router) only when H or X works that area, along conceptual boundaries | **E19** (new) | H, X | agree with the caveat as stated |
| 41 | Help as contextual support: how to operate, what the musical thing means, why the teacher assigned this, in different places | **X18** (new); T12 | X, F | agree |
| 42 | Setup ends by proving the practice loop (connect → play a few notes → the app responds → count-in → a tiny exercise → feedback) | E7 (decision restated) | X | agree |
| 43 | Accessibility survives the notation push: audited in the playing state (touch targets, labels, contrast, reduced motion, focus, non-colour feedback) | **U56** (new); Q27 | H | agree |
| 44 | Performance budgets per device class (the owner's phone, a midrange Android, tablet, laptop); the owner's phone the primary truth | **E20** (new); Q14 | H | agree |
| 45 | Don't build everything now; record the requirements in their waves | this file | — | agree; and M7 (freeze expansion until the existing content is trustworthy) stays the gate on every feature row above |

**The 17 consolidated additions** map onto the rows above: 1 → E14; 2 → R33, R34; 3 → R35;
4 → I14; 5 → E16; 6 → I11, I6, T22; 7 → L24, L67; 8 → X15; 9 → X16, X17; 10 → X12; 11 → U23,
U15; 12 → U30; 13 → L38; 14 → G14, G21, G28; 15 → E15; 16 → U29; 17 → E18.

**Where the orchestrator pushes back, in one place.** Nothing in the sweep is wrong, and none of
it is built now. Three rows are product features whose appeal is obvious (R33 the MIDI workflow,
X12 the PDF companion, X17 the MIDI gestures); M7's freeze holds them behind the content and
evidence work, and the plan's waves keep them where the reviewer put them. Two rows need the
owner at the instrument (L38's recordings; U56's and E20's device checks), which is the one
kind of manual step the plan cannot script away; they are batched so the owner sits down once
per wave, not per task.
