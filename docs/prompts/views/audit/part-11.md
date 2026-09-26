===== PART 11: THE REVIEWER'S GENERATOR AND CURRICULUM-SHAPE AUDIT (2026-09-26, while C6 ran) =====

Diagnostic only; nothing here disturbs C6. **The generator** is far more developed than a
typical one — roughly 56 families in the invariant suite (scales, arpeggios, chords and
inversions, Hanon, chromatic work, rhythm, coordination, interval reading, position shifts,
cadences and accompaniment, pedal, repeated notes, trills, rotation, articulation,
independence, voicing, syncopation, jazz harmony, stride, blues, Latin patterns) — with
unusually good mechanical testing (bar count, key, which hand sounds, register, chord span,
rhythmic content, spelling, printed directions, fingering in some families, MusicXML export,
renderability, and tests that go red when scores are deliberately corrupted). The suite itself
says its checks prove a generated score is valid and matches what its family claims, not that
the music is worth playing; that distinction becomes central to D. Concrete concerns: two
open-voicing shapes ask one hand to strike a 14- or 15-semitone chord and are exempted in the
invariants as an unresolved content decision — a structural validator blesses what a teacher
would question at once; the pedal family's marks have produced collisions and ambiguous
rendering with no semantically correct visual solution yet; several earlier generator bugs
(wrong modal content, a left hand in the wrong register, a wrong stated length, misplaced
printed text, spelling) were found only by looking at rendered music while structural
validation passed. The existing infrastructure can support a serious musical validator; it is
not one.

**The old comprehensiveness review** had already named holes (upper-level sight-reading,
rhythmic independence and polyrhythm, advanced pedalling, transposition, learning by ear,
upper-level improvisation, memorisation, performance practice, practice methodology,
dynamics, articulation, voicing and tone, ornaments, upper jazz, blues, pop harmony, theory,
improvisation); much was built since. The lesson: comprehensiveness answered by adding
another family, rung or track produces a gigantic checklist, not a coherent musician; the
experience-first teacher is the better answer.

**Against an external musicianship framework** (the MTNA essential-skills outcomes:
internalised pulse, literacy, physically efficient technique, audiation, creative work through
improvisation, composition, harmonisation and playing by ear; and its teacher-assessment
expectations of repertoire, technique, theory, keyboard musicianship, ensembles, ear training,
creative work, sight playing and transfer between activities), the app now covers surprisingly
many categories; its weakest area is **integration and transfer**: "you struggled reading
thirds → a controlled thirds exercise → a fresh sight-reading phrase containing thirds → an
easy real excerpt containing thirds → later thirds met naturally in repertoire → verify the
improvement transferred" is qualitatively better teaching than five features all containing
thirds. **Sight-reading's direction is strong** and matches that framework (unfamiliar, easier
material; pulse maintained; pattern and chunk recognition; reading below prepared-repertoire
difficulty; accompaniment, rhythm and chunking contributing; improvisation and ear training
associated with reading); reading should later connect to rhythm, keyboard geography, interval
recognition, audiation, harmony and improvisation, which C0–C4's demand architecture is
positioned for.

**A new requirement for D: three independent validators**, and every generated item passes
all three — (1) structural validity (renders; bars, notation, MusicXML, hands, rhythm right;
largely exists); (2) pedagogical validity (isolates or trains the intended skill; what other
demands it introduced; difficulty appropriate; physical requirement reasonable; useful for
acquisition, practice, transfer or assessment; partly missing); (3) musical validity (would a
competent teacher willingly put it in front of a student: phrase shape, intentional harmony,
purposeful repetition, music rather than randomised legal notes, convincing cadences, accents
and contours, pleasant or interesting enough to repeat; substantially missing) — a family can
pass the first and fail the other two, which is exactly C4d's structurally valid, ugly day-28
phrase. **A fourth gate for technique exercises: physical plausibility** — not whether the
pitches can theoretically be struck but whether the requested movement is appropriate for the
intended learner and objective: simultaneous span, repeated-note fingering, thumb crossings,
register, leaps, velocity, duration and repetition, and whether the exercise's supposed
technical solution is itself defensible; it catches the 15-semitone one-hand voicing.

**Difficulty** still needs major work: the monotonicity tests (two hands not easier than one;
more octaves not easier; minor not easier than its major; faster not easier) are sanity checks,
not a piano difficulty model; E reduces level to a sorting and banding summary and the teacher
thinks in reading demands, rhythmic demands, coordination, physical and technical demands,
harmonic familiarity, musical and interpretive demands and learner-specific familiarity, never
"a 5.2 learner plus a 5.1 piece".

**The curriculum's shape**: by the intermediate stages there are core, classical, blues, jazz,
pop and chords, theory, technique, improvisation, ragtime, Latin, rock, hymns, holiday,
practice, jam — great capabilities, a terrible linear syllabus if the learner feels obliged to
complete all of them. G's model: **Foundation** (reading, rhythm, keyboard fluency, technique,
ear, harmony, creative work); **Projects and interests** (classical repertoire, jazz, blues,
rock and pop, ragtime, Latin, hymns, personally meaningful songs); **teacher-selected
cross-training** (what the learner did not choose but needs). Love rock without becoming a
rock-only pianist; study classical seriously without every Latin and ragtime branch.

**Underweighted: audiation** — hearing the notes on the page, connecting eye, ear, mind and
hand, as a first-class longitudinal ability: look at a phrase → imagine it → sing or tap it →
play it; hear a phrase → reproduce it → identify its pattern → find it in notation; look at a
cadence → predict its sound → play it; read silently → find where tension, release and arrival
should fall. **Underweighted: ensemble and collaborative playing** — the app has accompaniment,
backing loops, chord charts, duet-like play and trading fours; playing with others should not
stay implicit: duets with the app; accompaniment where stopping is not allowed; melody over
backing; comping beneath a melody; trading phrases; following a form; recovering after a
mistake; entering after rests; playing from chord symbols; accompanying an external singer or
instrument — valuable precisely because solo practice does not train them.

**The division now**: C makes the teacher's observations, evidence and decisions honest; D
makes generated practice pedagogically and musically trustworthy; E makes the authentic corpus
measurable, searchable and useful as teaching material; F re-earns the right to every important
teaching claim; G turns the capabilities into comprehensive musicianship and personal musical
development rather than a pile of tracks; X and H make the teacher excellent at the piano and
across devices; across all: years, retention, transfer, repertoire memory, changing goals, no
endpoint. The reviewer's next parallel audit, downstream of C6: repertoire and PDMX — whether
the ladder is musically sensible, the estimated levels believable, the corpus clustered by
stage or style, where excerpts beat whole pieces, whether arrangements duplicate or mislead,
and whether there is enough genuinely good music for years, not merely enough rows.
