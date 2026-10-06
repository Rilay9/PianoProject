# Parallel unblock package — Latin contracts + notation-at-first-print

Date: 2026-10-05
Purpose: resolve non-overlapping evidence/design questions while wave-one builders run. This is not a new dispatch queue. `ABILITY-MAP.md` remains the plan of record.

## 1. G14 — one concrete bossa acquisition contract

### Source boundary
Berklee Online's current Jazz Piano course teaches a dedicated bossa lesson with `Comping Patterns for Bossa Nova`, and Berklee's Latin Piano Styles course separately teaches `Bossa Nova (Tom Jobim, João Gilberto)` after samba patterns. Those course outlines support bossa as a distinct taught piano style, but they do **not** expose enough notation publicly to define one exact generator pattern.

For one concrete public acquisition pattern, use Jonny May / Piano With Jonny, `Learn How to Play Bossa Nova Piano in 5 Steps`, Step 4, which states the left-hand sequence explicitly: root on beat 1, the bottom note on the `and` of 2, the top note on beat 3, and a pickup on the `and` of 4; the pickup is the fifth of the next chord. A second public piano source, ChordRhythm's `Bossa Nova Piano Pattern`, describes the bass as root-to-fifth with dotted-quarter-plus-eighth rhythm and explicitly says there are multiple bossa variants.

### G14 contract
This is a **single beginner control pattern**, not a definition of all bossa nova.

In 4/4, one bar, eighth-note grid positions numbered 0..7:

- attack 0 / beat 1: current-chord root;
- attack 3 / `and` of 2: current-chord fifth (or lower chord-shell note only if the family is explicitly voicing-based rather than bass-only);
- attack 4 / beat 3: current-chord root or fifth according to the chosen fixed variant;
- attack 7 / `and` of 4: fifth of the **next** chord as pickup when a next chord exists.

For the bass-only acquisition variant, use the simpler dotted-quarter/eighth realization:

- root: onset 0, duration 1.5 beats;
- fifth: onset 1.5, duration 0.5 beat;
- root: onset 2.0, duration 1.5 beats;
- fifth/pickup: onset 3.5, duration 0.5 beat.

Pitch roles are therefore root/fifth only. Straight eighth subdivision; no swing. The generated exercise should state that this is *one basic bossa bass pattern*, never `the bossa rhythm`.

### Checker
For each generated bar, read the LH attacks independently and require onset positions `{0, 1.5, 2.0, 3.5}` and root/fifth membership relative to the written harmony. For bars before a harmony change, the 3.5 attack may be checked as the fifth of the following harmony only in the chosen anticipation variant; otherwise keep it current-harmony fifth and label that variant accordingly.

Near misses that must fail:
- quarter-note roots on beats 1 and 3 only (not this pattern);
- tresillo/habanera onset sets;
- a syncopated RH chord pattern with no stated bass contract.

### Important scope
The real `Garota de Ipanema` candidate remains MODEL/TRANSFER evidence, not the source that defines this control pattern. Its notation can be compared against the sourced family afterward.

Sources:
- https://online.berklee.edu/courses/jazz-piano
- https://online.berklee.edu/courses/latin-piano-styles
- https://pianowithjonny.com/piano-lessons/learn-how-to-play-bossa-nova-piano-in-5-steps/
- https://chordrhythm.com/accompaniment-patterns/bossa-nova-piano-pattern/

## 2. G15 — guajeo/montuno contract boundary

### Primary source actually read
Sher Music exposes a one-page sample from Rebeca Mauleón's *101 Montunos*, p. 40, `Ex. 10. I-ii-V-IV with Arpeggio`, followed by `Ex. 11. I-ii-V-ii Over Standard Tumbao`. The prose says the next step is to add a `simple arpeggio idea` and create a four-bar phrase. The score marks 2-3 clave orientation. This is a primary published piano-method example, not a metadata inference.

Sher also exposes p. 83, `Ex. 47. Dominant Seventh Chord Montunos w/ Rhythm Section`; the surrounding text explicitly advises repeating an idea before moving to a variation and changing it subtly phrase to phrase. That supports repetition/ostinato as a real design property rather than a detector invention.

### Category definition
For G15, do **not** define `guajeo` as one universal onset mask. The musically safe contract is categorical:

- short repeating piano ostinato / vamp;
- syncopated rhythmic profile;
- harmonic/melodic content outlines the current harmony;
- for the G15 **arpeggiated** subtype, successive attacks must change pitch content through chord tones rather than repeatedly striking the same block voicing;
- repeat the idea for at least two cycles before variation;
- preserve the chosen clave orientation for the example rather than mixing 2-3 and 3-2 inside one control.

For the first generator implementation, transcribe **one exact Mauleón sample figure** (Ex. 10 is the clean public choice) as the source pattern and encode *that figure's* exact attacks, durations and chord-tone roles. Do not generate an invented average of several montunos. The source page is available publicly from Sher Music's `101 Montunos` product page under `Sample Pages & CD Tracks -> I-ii-V-IV with Arpeggio`.

### Sibling near-miss
A non-arpeggiated block-chord figure is **not** G15's arpeggiated subtype. Treat ponchando/block-chord guajeo as the sibling near-miss: it may be valid Cuban accompaniment, but it must fail an `arpeggiated_guajeo` checker because successive attacks do not articulate a changing chord-tone line.

This is exactly why `La Negra Tiene Tumbao` should not be used as proof of the G15 arpeggiated figure: its retained passages are dominated by repeated block-chord attacks and are better MODEL material for ponchando/block-chord guajeo.

Sources:
- https://www.shermusic.com/products/101-montunos (publisher page)
- sample p. 40: `101 Montunos - I-ii-V-IV with Arpeggio`
- sample p. 83: `101 Montunos - Dominant Seventh Chord Montunos w/ Rhythm Section`

## 3. Notation-at-first-print design seam

Evidence anchor: `docs/prompts/runs/curriculum-review-2026-10-05/briefs/wave1a-views/99-tail.md` at reviewed HEAD. It established first prints earlier than the old plan: repeat sign 1.1; key signatures/ties at 1.5; ties and key signatures again at 2.2; first/second endings at 2.3; coda at 2.4. `SOURCE-CHECK-reading.md` also shows that published methods do not require one single ordering: ABRSM introduces different notation marks cumulatively, while Faber teaches endings/D.C. later. Therefore the app should decide from the actual learner encounter, not force an external grade crosswalk.

### Decision per mark

#### Repeat sign at 1.1 — TEACH AT FIRST PRINT
Keep *Kum Ba Yah* if it remains on 1.1 for its musical job. Add one short sentence before the tune: a double bar with dots means go back to the matching repeat/start and play that section again. This is a tiny navigation concept and does not justify moving an otherwise useful beginner tune.

Do **not** turn 1.1 into a full roadmap lesson; teach only the mark the learner sees.

#### Key signature first seen at 1.5 — MOVE THE OFFENDING ITEM, THEN TEACH AT 2.2
`The Water Is Wide` is already recorded by the 425 audit as MOVE and also prints several other not-yet-taught features (eighths, dotted values, ties, G signature). Do not burden 1.5 with four unrelated notation concepts to preserve that placement.

At 2.2, however, *Alouette* (F) and *Swing Low* (G) print one-flat/one-sharp signatures and the learner is already handling black-key/rhythm expansion. Teach the minimal key-signature reading there: the sharps/flats immediately after the clef apply throughout unless cancelled; identify F major's Bb and G major's F#. This is earlier than the old 3.1 text because the learner sees the marks earlier.

Keep later 3.x material for broader key-signature fluency, not first exposure.

#### Ties first seen at 1.5 — MOVE THE 1.5 ITEM; TEACH AT THE EARLIEST RETAINED 2.x PRINT
Again, do not teach ties at 1.5 merely to save *The Water Is Wide*. It is already overloaded and marked MOVE.

The evidence says ties also appear at 2.2 and 2.3 before 2.4. If those retained scores genuinely need their ties to play correctly, add one short first-exposure sentence at the earliest retained occurrence: same pitch joined by a curve = strike once and hold through the second value. Keep 2.4 as the real tie/slur/dotted-rhythm lesson, including the distinction between tie and slur.

If the 2.2/2.3 tie is ornamental/editorial and the item can be replaced by an equally good already-owned option without losing its learning job, moving that item is acceptable; otherwise first-exposure teaching is cheaper and pedagogically honest. The builder must name the exact retained score before editing text.

#### First/second endings at 2.3 — TEACH AT FIRST PRINT
Keep *Was wollen wir trinken* if it is otherwise valid. Add a compact navigation sentence beside its introduction: on the first pass take ending 1 and repeat; on the second pass skip ending 1 and take ending 2. This is a direct play-the-page instruction, not a new theory unit.

#### Coda at 2.4 — MOVE THE EARLY ITEM UNLESS CODA NAVIGATION IS THE ITEM'S JOB
Do not add coda navigation to the already dense `Ties, dotted rhythms and dynamics` lesson just because *Ga je mee* happens to print one. Coda reading is unrelated to 2.4's core job and is a larger roadmap convention than a repeat sign or volta.

Preferred action: move/replace *Ga je mee* to the first later rung that explicitly teaches roadmap/navigation marks, or choose an equivalent 2.4 option without a coda. If a later design decision deliberately wants coda reading at 2.4, that must become a named learner objective rather than an incidental one-line patch.

### Seam acceptance
Wave one may call this design seam closed when:
- no retained core item asks the learner to interpret a repeat, key signature, tie, volta or coda before either a minimal first-exposure instruction or an explicit move;
- the full teaching lesson can still occur later without pretending the mark was unseen before;
- no early lesson gains unrelated notation prose solely to rescue a poor placement.

## 4. Two quarry score reads — status

These were already notation-read and remain unchanged:

### Blues Riff in C
The B-natural against the C7 bed is repeated structurally, not a one-note typo. It occurs in multiple corresponding places, so no builder should silently rewrite it to Bb. Keep it as a 12-bar TRANSFER candidate with a harmony/note-choice caveat; do not use it as the clean canonical beginner MODEL for ordinary C7/blues note choice until a source-based musical decision says what the B-natural is doing.

### La Negra Tiene Tumbao
The retained passages contain repeated non-arpeggiated block-chord attacks. They fit a ponchando/block-chord-guajeo MODEL role much better than G15's arpeggiated-guajeo control. Do not let the title `Tumbao` override the actual notes.

## 5. What this unblocks

- G14 may now proceed to a narrow **basic bossa bass-pattern acquisition** implementation if/when the ability map dispatches it; it does not authorize a general bossa generator rewrite.
- G15 now has a primary-source path: transcribe one exact Mauleón public sample figure, encode that figure, and use block-chord ponchando as the sibling near-miss. No universal guajeo detector is authorized.
- The notation-at-first-print seam has per-mark teach-or-move decisions and can be converted into an exact brief without reopening wave 1(a).
- The two quarry ambiguities should no longer be treated as open questions in later planning.
