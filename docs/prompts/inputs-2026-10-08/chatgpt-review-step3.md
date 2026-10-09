# ChatGPT's review of the step 3 comparisons (relayed by the owner, 2026-10-08)

Relayed after the key pilot (`docs/classifier/evidence/1B/comparison/key.md`) and the repeat and times comparison (`docs/classifier/evidence/1A/comparison/repeat-times.md`). The reviewer had not rerun the benchmarks or read the other comparisons. Its six corrections, to be applied when the failing rules are revised (handoff step 3), not as new work:

| Characteristic | Smallest useful correction |
| --- | --- |
| key.tonic-mode | Treat model agreement as confidence, not certainty: two methods can share an error (the Chopin relative-major cases); on disagreement the agent gets the competing keys and the passages behind them. |
| key.change | Code produces a timeline of candidate key regions with boundaries, confidence and evidence; the agent judges tonicisation, modulation, section-level change or unresolved, and may inspect the harmonic timeline beyond the flags (about a quarter of annotated changes are never flagged). |
| mark.repeat | Two outputs: the written repeat structure (signs, endings, jumps and their places) and the playback sequence of bars (or UNKNOWN where the directions are ambiguous); the bar count is derived from the sequence, and validation compares sequences, not counts. Use the known Carioquinha failure as the test. |
| notation.times | Keep the notated signature change (exact, read) separate from the actual change of metre and from devices (pickup, partial bar, cadenza), which are interpretation; an uncertain classification never removes the read fact. |
| reading.accidental-kinds | Two outputs, what the MusicXML encodes and what the learner-facing renderer displays; the second is authoritative for teaching, derived from the existing rendering path, not a second engraving algorithm. |
| rhythm.syncopation | Keep the evidence types separate (held over the beat, off-beat attack, accent, rest, bass-then-chord); the ability being taught chooses which count, so an accompaniment's off-beat chords never certify tied syncopation. SynPy and AMADS are witnesses for the kinds they cover, not authorities for the whole characteristic. |

Not to change: restart the survey, add auditors, replace all custom code with models, or rewrite all 68 rules. The reviewer's highest-value next review: whether the seven comparison results justify the proposed rules, especially where a method scores well on a benchmark but answers a subtly different musical question.
