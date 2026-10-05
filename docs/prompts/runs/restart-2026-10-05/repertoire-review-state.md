# PianoProject repertoire review — resumable state

Updated: 2026-10-04
Review target: Rilay9/PianoProject, unchanged 94-score XML dump at commit e9592fcb1beb570a35207beaa91e1b5b2bf83941 (`docs/prompts/runs/xml-dump-2/`).

## Review method

Use an iterative two-way loop, never a title/keyword sweep:
1. Discover musically credible exemplars externally for one named feature.
2. Check whether the exact work/arrangement exists in the current catalog / PDMX / 94-score dump.
3. Inspect the actual notation of that exact file.
4. Accept only with passage-level evidence; otherwise mark near-miss, reject, or hold.
5. Archive discoveries can seed external research in the reverse direction.

Named-texture guardrails:
- Alberti = explicit repeated lowest → highest → middle → highest pitch order. A generic 4-note broken-chord loop is not enough.
- Generic broken-chord accompaniment = chord tones sounded successively as accompaniment; keep distinct from Alberti.
- Waltz-bass = actual bass attack on beat 1 plus separate chord attacks on beats 2 and 3; 3/4 or waltz-like feel alone is not enough.
- Oom-pah = alternating low bass and higher chord attacks. Do not upgrade to stride based on this alone.
- Stride = bass/chord alternation plus large-register hand travel and appropriate style/context.
- Boogie = verify a characteristic moving blues/boogie bass pattern in the notation; title/style metadata alone is insufficient.

## Current ledger

| Item | Score | Feature | Verdict | Exact evidence / reason |
|---|---|---|---|---|
| 001 | House of the Rising Sun | rock/piano repertoire | REJECT arrangement | Prior-chat notation review: lead-sheet/non-piano-teaching arrangement; do not count title hit. |
| 002 | Seven Nation Army | rock/piano repertoire | REJECT arrangement | Prior-chat notation review: percussion-only/non-piano arrangement. |
| 003 | You Really Got Me | rock/piano repertoire | REJECT arrangement | Exact XML is one nominal piano part with 8 staves including percussion/full-band material; not a usable 2-hand piano arrangement. |
| 004 | American Woman | rock/piano repertoire | REJECT arrangement | Prior-chat notation review: essentially monophonic bass, not a usable piano arrangement. |
| 005 | Chopin Nocturne Op. 9 No. 2 | strict broken-chord | NEAR MISS | Real piano texture, 12/8. m1 LH alternates low bass with upper dyad/triad groups; authentic accompaniment, but not clean one-note-at-a-time chord tones under the strict concept. |
| 007 | Satie Gymnopédie No. 1 | waltz-bass | NEAR MISS | 3/4 and waltz-like, but opening bass sustains through the bar while one upper chord attack spans beats 2–3; not bass→chord→chord attacks. |
| 008 | Mozart K.545, movement 3 | Alberti | REJECT for this file | Exact dump is movement 3, not the canonical movement-1 Alberti example. Inspected opening not Alberti; prior human pass also found no Alberti in the sampled passage. |
| 009 | Clementi Sonatina / Sonata in C | Alberti | ACCEPT | m9 LH eighths F3–D4–A3–D4 repeated = low→high→middle→high. |
| 010 | Clementi Sonatina No. 1 | Alberti | HOLD | Opening accompaniment is sparse/block-like; external sources point to Alberti elsewhere in Op.36 No.1, but exact later passage in this particular dump copy not yet verified. |
| 011 | Clementi Sonatina No.1.2 | broken-chord accompaniment | ACCEPT | Lower part around mm33–44 has repeated single-note triadic figures (e.g. G3–B3–D4; C3–E3–G3). Generic arpeggiated/broken accompaniment, not Alberti. |
| 012 | “Sonatina” / internal work-title “Bagpipe” | named accompaniment figures | REJECT current figures | 4/4 opening uses drone/long bass notes under melody. Useful metadata mismatch; not Alberti/broken/waltz-bass exemplar in inspected passage. |
| 013 | attributed Beethoven, Sonatina in G Anh.5 | Alberti | ACCEPT | mm5–6 LH contains low→high→middle→high cells; notation-confirmed. |
| 013 | same | broken-chord accompaniment | ACCEPT | m25 onward has flowing LH broken-chord coda under sustained RH; keep passage distinct from Alberti evidence. |
| 014 | attributed Beethoven, Sonatina in F Anh.5 | broken-chord accompaniment | ACCEPT | m1 LH F–A–C–A repeated = low→middle→high→middle, clean generic broken chord. CORRECTION: this is NOT Alberti. |
| 014 | same | Alberti | HOLD | Do not infer from m1; later score not yet searched for exact low→high→middle→high cell. |
| 017 | Harlem Rag | oom-pah-bass | ACCEPT | m1 in 2/4: low C bass → C-major triad → low G bass → triad. Clean alternating bass/chord pattern. Do not relabel as stride solely from hand jumps. |
| 018 | The Entertainer | oom-pah/stride | HOLD | Exact dump appears to be an unusual annotated/transcription version; early measures have RH-only material and later sparse staff-2 notes. Need a representative LH passage before any named-style verdict. |
| 027 | Carolina Shout | stride candidate | REJECT unusable file | Exact MusicXML file in unchanged dump is empty. Historically strong candidate, but no score content to inspect. |
| 031 | Ain’t Misbehavin’ (Fats Waller) | stride-bass | ACCEPT | m1 and later mm5–6 repeatedly alternate low bass notes (e.g. Eb2/C2, F2/Bb2) with triads roughly octave-plus higher on beats 2/4; swing context + large register travel + repeated pattern. |

## Continuation pass — 2026-10-04

- **`song.folk.boogie-woogie.pdmx` / Pinetop’s Boogie Woogie — strict `boogie-bass`: REJECT as the clean exemplar.** The app’s `blues.4` teaching target is root–5–6–5 eighths (optionally extended through flat 7). The exact catalog score’s prior notation dump shows bars 1–6 as LH 32nd-note tremolos and, from bar 7, dotted-eighth/sixteenth dyads over a fixed root. It may remain authentic boogie repertoire, but it does not certify the named figure the learner is taught.
- **Chopin Waltz Op. 34 No. 1, bars 17–20 — `walking-bass`: REJECT; `waltz-bass`: ACCEPT.** The old excerpt proposer ranked this passage as a perfect walking-bass candidate. External score/analysis establishes a 17-bar introduction with the dance proper beginning at bar 17; the notation there is 3/4 bass-on-one plus separate upper chord attacks on two and three. This is an adversarial false positive for walking bass and a clean waltz-bass example.
- **Walking-bass project target recovered.** `blues.6` describes the walk as root → third → fifth → semitone below the next bar’s root, distinct from its Pinetop/boogie patterns. Use that exact semantic target for the next repertoire search; do not accept generic LH motion or a 3/4 waltz pattern.
- **Retrieval note.** Several catalog scores are stored as compressed `.mxl`; the GitHub connector can locate them but cannot decode the binary. Treat this only as a retrieval gap. Use existing `dump_score` evidence where available, text-accessible source formats, or external score verification tied to the exact arrangement. Never turn the inability to open `.mxl` into a musical verdict.

## Search frontier

Current named-figure queue:
1. Finish any useful unresolved classical items only if they can change coverage (not exhaustive busywork).
2. Oom-pah: already have #017 positive; inspect additional examples only for difficulty/arrangement diversity.
3. Stride: #031 positive; #027 unusable. Find a second clean stride arrangement only if useful for coverage.
4. Boogie: for the Stage-4 named figure, use the app’s actual target root–5–6–5 eighths (optional flat-7 extension), not a generic “boogie-ish” label. `song.folk.boogie-woogie.pdmx` is now rejected as the clean exemplar for that figure. Next candidates: “Boogie (easy, for beginners)”, “Rhythm and Boogie”, and “Boogie-Boogie en Sol”; inspect exact LH notation before accepting.
5. Walking bass: project target from `blues.6` = root–3–5–semitone-below-next-root motion. The Chopin Op.34 No.1 automated candidate is now rejected as walking and accepted as waltz-bass. Next: discover a musically credible true walking-bass work externally, intersect with catalog/archive, then verify the exact arrangement.

## Known traps / corrections

- Mozart K.545: movement title matters; movement 1 reputation cannot certify movement 3.
- Gymnopédie: “waltz-like” does not equal strict waltz-bass.
- #014: F–A–C–A is generic broken-chord, not Alberti. Require explicit pitch-order evidence for every future Alberti positive.
- Ragtime oom-pah is not automatically stride. Require style + register-travel evidence.
- A catalog/lesson claim is candidate evidence only. The actual score wins.
- Empty/corrupt XML (e.g. #027) is a hard usability failure regardless of how ideal the work would be musically.

## Next resume instruction

Resume with the next BOOGIE candidate (“Boogie (easy, for beginners)” first if exact notation can be recovered); the strict target is root–5–6–5 eighths, not title/style. If binary retrieval blocks exact notation after a bounded attempt, mark HOLD and move on. In parallel for WALKING BASS, use root–3–5–approach-to-next-root as the project target. Do not trust the old generic excerpt proposer: Chopin Op.34 No.1 bars 17–20 is already a proven waltz-bass false positive.
