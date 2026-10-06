# Just-in-time curriculum unblocks — 2026-10-06

Purpose: close only evidence questions that block named upcoming ability-map seams. This is not a new curriculum audit or dispatch queue. Claude should review these findings against the current map before consuming them.

## 1. A3.1 — learn a song by ear from a recording

**Verdict: CONFIRMED, with a narrower product inference.**

Primary/current Berklee Online evidence read:

- **Ear Training Fundamentals (OEART-116)**: the course says learners read, perform and write rhythms, melodies and simple chord progressions; transcription and song-based exercises reinforce beginning ear training. Its outcomes include recognizing/performing I-IV-V progressions and connecting melody, bass and harmony by ear, and transcribing simple melodies. The course description says learners transcribe rhythms, melodies and simple chord progressions directly from recorded music.
  Source: https://online.berklee.edu/courses/ear-training-fundamentals
- **Ear Training for Live Performance (OEART-215)**: explicitly frames the goal as recognizing what is heard on recordings or from other players and translating it to the instrument; learners transcribe short melodic/rhythmic phrases directly from recordings and connect inner hearing, voice and instrument.
  Source: https://online.berklee.edu/courses/ear-training-for-live-performance

What this supports for PianoProject:
- a learner-facing task to take a short familiar passage from a recording and find/play it on the keyboard;
- short melody/bass/harmony extraction by ear;
- singing/audiation may support the task but is not required to be machine-judged.

What it does **not** dictate:
- the exact rung;
- exact passage length;
- a scoring threshold;
- whether the app must transcribe notation automatically.

So A3.1's source gate can be lifted for the proposition. Its exact product contract remains a local design/build decision.

## 2. A4.2 — start, stay in, recover and end together in an ensemble form

**Verdict: PARTLY CONFIRMED; do not overclaim the recovery clause from these sources.**

Current ABRSM evidence read:

- ABRSM Jazz Ensembles requires interactive comping and/or improvising from the rhythm section, encourages flexibility and on-the-spot decision-making, and tells players to position themselves so they can make eye contact and hear each other comfortably.
  Source: https://www.abrsm.org/en-rs/other-assessments/group-exams/jazz-ensembles
- ABRSM Jazz Piano Performance Grades describes the form as head → improvised solo → return of the melody → ending/coda/turnaround, and allows live rhythm-section accompaniment using the same structures.
  Source: https://www.abrsm.org/en-ad/instruments/jazz/jazz-piano

This directly supports:
- keeping a shared form with other players;
- listening/interaction while comping;
- a deliberate return and ending;
- flexibility/on-the-spot response in ensemble playing.

It does **not**, from the material read, explicitly prescribe a beginner exercise for recovering after losing the form or a specific count-in/start routine. Therefore:
- lift the source gate for **shared-form interaction and ending**;
- keep **recovery after getting lost** as an owner/product pedagogy choice unless a more specific source is required by the map;
- do not keep the whole block source-blocked merely because the recovery subskill is not explicitly named by ABRSM.

## 3. A7b.1 — real MODEL for minor ii–V–i with shells

**Verdict: REAL SCORE EVIDENCE FOUND; the content question is resolved enough to proceed to intake/placement.**

Exact quarry file:

- *Blue Bossa*, Kenny Dorham
- CID `QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6`
- `docs/review/pdmx-quarry-2026-10-05/xml/B-jazz/blue-bossa-QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.musicxml`

The MusicXML harmony elements print:

- bar 5: **D minor seventh flat five** (`Dø7`; XML kind `half-diminished`)
- bar 6: **G7** with altered/additional extensions
- bar 7: **C minor sixth**

That is an explicit minor ii–V–i in C minor in the score itself. The opening also establishes C minor as the tonal center.

Therefore the previous statement that the quarry had no score printing iiø7–V7–i is stale. *Blue Bossa* is now a valid **MODEL/TRANSFER candidate** for A7b.1. No further jazz-candidate search is required to establish that a real score exists.

Boundary:
- this proves the printed progression, not that the current edition has already passed whatever admission/intake process the app requires;
- the CONTROL shell-voicing drill can still be generated/controlled;
- the real score should be used to see/hear/apply the progression in musical context rather than replacing the isolated control.

## 4. Stale gates that need consumption, not research

The existing `SOURCE-CHECK-reading.md` already source-checks the propositions behind A1.1, A1.2, A2.1 and A8.1. If the current map still labels those blocks source-gated, that is bookkeeping/consumption work, not a reason to run new research.

Recommended action: Claude should compare the current map text against `SOURCE-CHECK-reading.md`, lift only the stale gates whose propositions are already confirmed (preserving corrections/qualifiers), and leave genuinely distinct unresolved subclaims intact.

## 5. IM-3 — Bizet Habanera and Contra Danza exact score read

**Correction to the first version of this packet:** the XML was already present on `chatgpt/pdmx-dump-2026-10-05` from commit `fae9f529`. The old dump README was stale; its index was corrected at `0f20820a`. Before declaring a locally-sourced artifact missing, check the branch contents/path directly rather than trusting a possibly stale README.

### Bizet, *Habanera* — CONFIRMED primary MODEL

Exact files:
- `docs/review/pdmx-dump-2026-10-05/xml/habanerapianosologeorgesbizet-Qmc6P2a11mJaEgAdyvsqiWW9dSt7HazcVSSsU7oRtQ3ptu.musicxml`
- matching summary under `summary/`

CID `Qmc6P2a11mJaEgAdyvsqiWW9dSt7HazcVSSsU7oRtQ3ptu`.

The opening is in 2/4. In bars 1–7 the left hand repeatedly gives:
- attack at beat-position `0`: bass D2 eighth;
- attack at `0.75`: A2 sixteenth after an eighth + sixteenth-rest span;
- attack at `1.0`: F3 eighth;
- attack at `1.5`: A2 eighth.

Normalised to the app's doubled 4/4 comparison frame, the attacks are exactly:

`0, 1.5, 2.0, 3.0`

That matches the G13 habanera cell already observed in *Por Una Cabeza*. The same rhythmic skeleton persists while the harmony/pitches vary, including later after the key change. This is stronger than a title/genre inference: the notation itself supplies the pattern.

Disposition: **ADMIT as the primary printed MODEL candidate for the basic habanera bass cell** when the intake path reaches A7c.1/G13. A short left-hand-only opening excerpt is pedagogically cleaner than the whole 60-bar arrangement for initial MODEL use.

### *Contra Danza* — useful contrast, not a second proof of the same cell

Exact files:
- `docs/review/pdmx-dump-2026-10-05/xml/contradanza-QmYAihNhTVzw5EyFcXFRD7f5gkwnnDKRnH1gTnf4e5frxs.musicxml`
- matching summary under `summary/`

CID `QmYAihNhTVzw5EyFcXFRD7f5gkwnnDKRnH1gTnf4e5frxs`.

Its opening 2/4 accompaniment is materially different. For example bars 2–3 use a quarter-note bass attack followed by two eighth-note chord attacks, i.e. onset positions approximately:

`0, 1.0, 1.5`

Later the score changes into 6/8 and uses additional accompaniment textures before returning to 2/4. Therefore it should **not** be cited as another instance of the exact G13 habanera cell merely because of its title/tradition.

Disposition: **keep as contrast/transfer candidate**, useful for showing that related dance repertory does not reduce to one onset mask. It is not needed to establish the G13 pattern because Bizet already does that directly.

## 6. What remains outside this packet

- Actual admission/placement of *Blue Bossa* and Bizet is implementation/content-intake work, not further research.
- No broad map/source audit is authorized by this note.
