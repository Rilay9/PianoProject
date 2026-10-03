# Content mistakes already made here: check your work against every one

Each of these was made in this project and caught late, by the agents, the orchestrator or the reviewer. Before you push content work (detectors, matchers, claims, generators, curriculum, levels), check it against this list and say in your entry which items you checked.

1. **One broad rule standing for several named concepts.** `claims.py:79–85` mapped Alberti, broken-chord, waltz, oom-pah, boogie and stride onto one demand. A general "accompaniment" never certifies a specific style.
2. **A loose heuristic instead of the published definition.** "The lower staff has several notes while the upper plays" is not "accompaniment under a melody": two-hand scales, Hanon and arpeggios matched it. Write the textbook definition first, then the code.
3. **Judging by names instead of notes.** Item ids and family names are not evidence. Read the notes through the matcher.
4. **Own tests passing taken as correctness.** A builder's fixtures, even when every red and green comes out as predicted, prove intent. Correctness needs examples the builder did not choose: the source's own examples, near-misses, expert-annotated data.
5. **Two implementations agreeing taken as proof.** It is corroboration. A Python port of the same mistaken idea agrees perfectly.
6. **Unknown treated as absent.** Removing an uncertain demand from the prerequisite gate lets hard music reach beginners (`eligibilityCore.ts:286`). Uncertainty may restrict; it never grants.
7. **Fixing wrong claims by deleting or demoting content.** That leaves nothing to teach. Define the concept properly instead.
8. **Tuning a threshold until examples pass, or until a table empties.** A share or a density value needs a reason in the music, not convenience.
9. **"Contains X" promoted to "practises X" or "the learner can do X".** Presence, task suitability and demonstrated skill are three claims with three kinds of support.
10. **Hand-writing what a library already does.** Keys, chords, inversions, Roman numerals, spelling and metre are in music21 (already a dependency). See `CLAUDE.md`, *Reuse before reinvention*.
11. **Notation conflated with meaning:**
    - a key signature is not the tonal key;
    - a staff is not a hand or a voice;
    - a written value is not a performed duration;
    - a printed metre is not the beat grouping.
12. **Builder notation checks read as teaching approvals.** The four rows in `content/review/decisions.jsonl` are `usableScore` notation checks, not a teacher's yes.
13. **Counts and absences read off a sample or an old checkpoint.**
    - truncated listings;
    - a checkpoint's count reported as current;
    - "none" from a limited search.

    State the scope.
14. **Generated material where real published material teaches the same thing.** Prefer the verified real excerpt; generate for control, variation or availability.
15. **Claiming what nobody can check.** Nobody here hears music. Say *unverified as music*, and never assign a musician check to someone who cannot do it.
16. **Rules piled on mid-run.** Instructions belong in the brief and `CLAUDE.md`, not in scattered messages. Where they conflict, the files win.
