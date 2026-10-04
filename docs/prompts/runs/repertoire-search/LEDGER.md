# Iterative repertoire search ledger

Purpose: durable evidence log for the 94-score `xml-dump-2` review. Do not infer a teaching feature from a title or canonical recording: judge the exact archive MusicXML. Internet research may nominate or contextualize a candidate, but the archive arrangement decides whether it can serve the requested teaching role.

Source dump: `e9592fcb1beb570a35207beaa91e1b5b2bf83941`, `docs/prompts/runs/xml-dump-2/`.

Target labels:
- A — power chord / open fifth / heavy riff
- B — repeating arpeggio / broken-chord accompaniment
- C — Alberti bass
- D — waltz bass / oom-pah-pah in 3/4
- E — ragtime oom-pah plus syncopated upper voice
- F — stride
- G — boogie-woogie bass
- H — walking bass
- I — blues form versus shuffle
- J — habanera / tresillo / son
- K — bossa nova accompaniment
- L — montuno / tumbao
- M — tango accompaniment/style boundary
- N — hymn four-part texture
- O — gospel walk-ups / passing movement

## Verdicts

| # | score | target | verdict | exact-arrangement evidence | next consequence |
|---|---|---|---|---|---|
| 1 | House of the Rising Sun | A | FAIL | Previous-chat inspection found a one-staff melody/chord-symbol lead sheet, not a preserved power-chord/open-fifth/heavy-riff piano texture. | Do not use title reputation as evidence for A. |
| 2 | Seven Nation Army — The White Stripes | A | FAIL | Previous-chat inspection found the dumped score was percussion-only rather than a usable piano/guitar-riff arrangement. | Reject for A. |
| 3 | You Really Got Me | A | FAIL (reconstructed) | The exact XML is a single imported part spread across eight staves, including percussion, rather than a clean playable piano exemplar. The previous chat said the first rock block failed at the arrangement layer, but its exact old row text was lost when that chat filled context. | Keep rejected unless A later has no strong exemplar; if so, re-inspect specifically for open-fifth attacks before reconsidering. |
| 4 | American Woman — The Guess Who | A | FAIL | Previous-chat inspection found essentially a monophonic bass transcription, not the characteristic heavy guitar/power-chord texture. | Reject for A. |
| 5 | Chopin, Nocturne Op. 9 No. 2 | B | PASS | Exact XML: piano grand staff, 12/8. In m.1 LH repeatedly attacks a low bass eighth (e.g. E-flat2), then higher chord tones/chords on the next two eighths, and repeats that three-eighth accompaniment cell across the bar. This is sustained, genuine accompaniment under an independent RH melody. | Strong B exemplar. Do not relabel C (not low-high-middle-high Alberti) or D (four compound-beat cells in 12/8, not 3/4 oom-pah-pah). |
| 6 | Clocks — Coldplay | B | FAIL for this archive score | External descriptions correctly nominate the canonical song for its broken-triad piano ostinato, but the exact dumped XML is a single C-clef staff whose notes are tagged to the Viola instrument (`P1-I2`); it is not the piano accompaniment arrangement we need. | Good example of web→archive validation rejecting a famous candidate. Search for another licensed archive arrangement if B needs a modern/pop exemplar. |
| 7 | Satie, Gymnopédie No. 1 | D | PARTIAL; FAIL strict oom-pah-pah | Exact XML is piano in 3/4 with a low LH bass sustained for the full measure plus an upper LH chord entering on beat 2 and lasting through beats 2–3. It gives the intended bass-then-chord waltz-like texture, but there is no separate beat-3 chord attack in this dump, so it is not a clean literal oom-pah-pah exemplar. | Useful near-neighbor/control for D; keep searching for an exact bass + chord + chord articulation. |

## Evidence discipline

For each next score: (1) read only the candidate's XML slice needed to establish texture/identity; (2) research online only when it can nominate, disambiguate, or challenge the feature; (3) append one row immediately; (4) update `STATE.md`; (5) do not carry old XML in conversational working state.
