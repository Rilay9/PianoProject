# ChatGPT, 2026-10-07: the corrected brief, after the owner's pushback (kept as given, reference only)

> Folded into `classifier-review.md`, which governs. Its "agent/human judgment" is read under FABLE §5: agent judgment of the residue only, no human gate.

**The owner's objective, as the reviewer restated it:** for every characteristic needed to accurately classify and place musical content, determine whether code can establish it reliably. If yes, automate it. If partly, automate the objective evidence and send only the residual judgment to an agent. If no, send it to an agent.

**Example rows it gave:**

| Characteristic | Can code establish it? | Method |
|---|---|---|
| pitch range | Yes, exact | MusicXML notes |
| rhythmic values | Yes, exact | MusicXML |
| metre/key changes | Yes, exact | MusicXML |
| note density | Yes, exact | derive |
| interval/leap distribution | Yes, exact | derive |
| hands/staves involved | Usually exact | score structure |
| syncopation | Yes, with a defined rule | derive from metric positions/ties |
| Alberti pattern | Yes, with a defined rule | note-pattern detector |
| scales/arpeggios | Yes, mostly | pitch/interval sequences |
| repeated-note technique | Yes | derive |
| hand independence | Measurable proxy | onset/rhythm relationship between hands |
| fingering difficulty | Model/inference | fingering solver + physical model |
| harmonic progression | Usually derivable | harmonic analysis; confidence needed |
| phrase boundaries | Inference | cadence/rhythm/rest/melodic evidence |
| genre | Inference, not proof | musical features + metadata |
| "good example of jazz comping" | Judgment after code evidence | agent/human |
| musical coherence | Judgment | agent/human |
| faithful PDMX arrangement | Cannot prove from score alone | compare references/versions + judgment |
| appropriate for introducing a skill | Code can narrow heavily; final pedagogical judgment may remain | target + prerequisites + density/interactions |
| curriculum rung | Derived once the above + rung requirements exist | placement engine |

The table should cover far more areas than these rows: notation, rhythm, pitch/reading, harmony, texture, form, technique/physical demand, coordination, expression, style/genre, musical quality and score integrity.

**On generated material:** generator specification → generated MusicXML → independent extraction → compare expected with actual. The generated MusicXML still goes through the same objective analysers as PDMX; otherwise a buggy generator can claim it produced X while producing Y. Agents are reserved for questions such as: is this exercise musically sensible, is the melody idiomatic, is this a good pedagogical example of the intended technique.

**On PDMX:** unknown or noisy MusicXML → objective extraction → integrity checks → semantic detectors → uncertain characteristics → agent judgment only for unresolved fields → curriculum placement. An agent never receives a whole score with "what level is this?". It receives the code-established facts (range C3–E5; 94% eighth/quarter notes; max melodic leap P4; 12 syncopated attacks; both hands; LH repeated 1-5-3-5 accompaniment in 21/24 bars; and so on) and judges only the unresolved questions.

**The brief:**

> You're partway there, but I need a different gap analysis.
>
> The goal is to minimize what agents/humans have to judge when we classify generated exercises and noisy PDMX/MusicXML and place them throughout the curriculum.
>
> Work out the musical/content characteristics we actually need to know for accurate placement: skills/concepts, prerequisites, difficulty, technique, rhythm, reading, harmony, texture, coordination, form, genre/style, musical quality, etc. Do not equate curriculum concept strings with required detectors.
>
> For each characteristic, classify it as:
> 1. CODE-EXACT — deterministically available/derivable from MusicXML or generator state.
> 2. CODE-RULE — reliably detectable once we define a musical rule/pattern.
> 3. CODE-INFERENCE — code can estimate it, but it needs confidence/ambiguity handling.
> 4. EXTERNAL — code can establish it only using another source/reference.
> 5. JUDGMENT — cannot be established reliably from the symbolic score; agent/human judgment remains.
>
> Also record whether the capability EXISTS NOW, PARTLY EXISTS, or is MISSING.
>
> Treat generated exercises and imported/PDMX scores separately where appropriate. Generated content has declared intent/settings, but its resulting MusicXML should still be independently checked. PDMX has no trustworthy declared intent and is noisy.
>
> The output I ultimately care about is:
>
> CHARACTERISTIC | NEEDED FOR | GENERATED/PDMX/BOTH | VERIFIABILITY CLASS | CURRENT CODE | GAP
>
> The purpose is to discover everything we can push into deterministic code so later agents only judge the genuinely non-computable residue. Don't design or implement anything yet, and don't give me another count based simply on curriculum concept names.

**Its closing line:** then review the table for omissions and challenge anything labelled JUDGMENT: can it be reduced further to measurable evidence?
