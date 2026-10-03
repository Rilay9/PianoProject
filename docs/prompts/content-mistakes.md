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
17. **Treating PDMX, Mutopia, kern and MuseTrainer files as reliable because they are available.** Available is not correct. PDMX is user-uploaded MuseScore files of uneven quality. These are recorded here as backlog rows, found by a keyword search of `docs/prompts/backlog-2026-09-25.md`; the list is a sample, not complete, so search the backlog for the corpus you use. Read them before using any corpus item:
    - **Pedagogical claims the import never established** (R38): `jazz.7` claimed rootless voicings and tritone substitution over PDMX lead sheets, among them Jingle Bells.
    - **Most of the corpus is unusable for teaching** (R39): the quarry kept 37,499 of 254,077 rows, and the easiest band was 70 of 80 lead sheets. Rows are not teaching opportunities.
    - **Wrong or conflated metadata** (R15): composition, arrangement, artist and edition are mixed up, for example *Scarborough Fair* credited to Simon & Garfunkel, and `compositionStatus` is unknown on most rows. A title or composer from a corpus is an unverified attribution.
    - **Tempo marks missing, defaulted or invented** (E32, E50, E57, E59, X40):
      - seven PDMX rows print "= N" without its note;
      - only the first tempo change survives conversion;
      - 60 Chopin kern first editions and 6 MuseTrainer rows show a metronome mark no edition states;
      - *Maple Leaf Rag* plays at 120 against its printed 100.
    - **Garbled symbols** (E31): chord-symbol accidentals in a private-use font glyph draw as boxes.
    - **Levels that disagree with themselves** (X37, R31): on 308 of 542 PDMX rows the stored level differs from the model's, and the index prints 4.5 when no model is fitted.
    - **Provenance not universal** (R35), and **licences that are only user-declared** on PDMX: check each item's licence and provenance before shipping it.
    - **Fetched sources can be missing at build time** (the runner log's unfetched editions): a placeholder is not a measured score.

    Every corpus item used for teaching passes the same checks as generated content: its notes read through the matchers, its metadata treated as attributed, not verified, its tempo and spelling checked, its licence confirmed. Prefer a curated, checked source (Mutopia's edited editions, OpenScore) over a raw PDMX row. Never claim a teaching point about a corpus piece that no check established.
