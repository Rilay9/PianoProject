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

## 5. What remains outside this packet

- Bizet *Habanera* / *Contra Danza* exact score read still requires their MusicXML from the owner's local PDMX archive. The repo index identifies candidates but says to request XML by CID.
- Actual admission/placement of *Blue Bossa* is implementation/content-intake work, not further research.
- No broad map/source audit is authorized by this note.
