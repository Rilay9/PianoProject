# Fable Curriculum Interpretation Audit

Purpose: independent rung-by-rung audit of Fable's existing readable-score conclusions.

Method:
- Reuse Fable's direct MusicXML observations as evidence unless something looks suspicious.
- Read the actual lesson/task contract for each rung.
- Ask whether the score is meant to **demonstrate** the target or merely serve as a **vehicle/substrate** on which the learner applies it.
- Reopen exact MusicXML only when that distinction or a factual score claim could change the answer.

Verdicts:
- **AGREE** — Fable's curriculum conclusion stands.
- **REVISE** — score facts may be right, but the curriculum conclusion/colour should change.
- **PARTIAL** — core concern is right but wording/severity/role needs adjustment.
- **REOPEN SCORE** — lesson intent alone is insufficient; exact score inspection needed.

This file is appended after each rung so another chat can resume from the last completed heading.

## 1.1 — Right hand C position
**Fable:** RED — Hot Cross Buns imports eighths; Kum Ba Yah is a poor first-position file.

**Independent verdict: PARTIAL.**

The Kum Ba Yah objection is overstated. The lesson explicitly calls it **“one more tune”**, says it sits above C position, spans six notes, has no fingering, and tells the learner to work out fingering before playing. That is deliberate early transfer, not a hidden false example of C position. It therefore should not make the rung RED by itself.

The Hot Cross Buns concern remains substantive if its shipped edition really contains eighths, because this lesson explicitly introduces quarter notes and never teaches eighths before assigning Hot Cross Buns as the first fixed-position tune. That is a score/edition mismatch worth fixing or moving.

**Revised status:** **AMBER**, not RED. Keep Kum Ba Yah as explicitly labelled transfer/stretch; fix or replace the Hot Cross Buns edition if the direct read is still current.

## 1.2 — Half notes, whole notes and rests
**Fable:** RED — Twinkle's range/leaps and Frère Jacques' eighths make the option count misleading.

**Independent verdict: PARTIAL.**

Twinkle's position shift is **deliberate and explicitly taught in the lesson**: it says Twinkle needs A above the five-finger position, tells the learner to move the whole hand up a step and back, and says the fingering marks both moves. Likewise Frère Jacques' low G shift is explicitly described. Those are not hidden difficulty defects.

The remaining concern is the shipped Frère Jacques rhythm if it really introduces eighth notes before this lesson has taught them. The lesson mentions eighth notes only as a future value and does not explain how to count/play them here.

**Revised status:** **AMBER**, not RED. Keep the explicit position-shift repertoire; inspect/fix Frère Jacques only for premature rhythmic vocabulary.

## 1.3 — Left hand C position and bass clef
**Fable:** AMBER→GREEN after one fix — Mary/Ode strong; Hot Cross Buns repeats the premature eighth-note problem.

**Independent verdict: AGREE.**

The lesson's job is very clear: transfer already-known melodies into bass-clef/left-hand reading so the ear can catch mistakes. That makes reuse of Mary/Ode excellent. Familiarity is a feature here, not redundancy.

If the current Hot Cross Buns edition still contains eighths that have not actually been taught, that is unnecessary extra rhythmic burden in a rung whose purpose is clef/hand transfer. Fixing that edition is the right narrow change.

**Revised status:** **GREEN after Hot Cross Buns rhythm fix**.

## 1.4 — Grand staff and hands alternating
**Fable:** RED — two real alternating-hand songs; Lightly Row is RH-only and cannot count.

**Independent verdict: AGREE.**

This lesson explicitly says the hands **never play together** and that the key task is call-and-response handover while reading the grand staff vertically. It names the alternating-hand Ode and When the Saints as the repertoire task. A plain RH-only Lightly Row score does not provide that task, and the lesson does not instruct the learner to transform it.

**Revised status:** **RED only insofar as Lightly Row is still offered/counting toward rung coverage. Remove/reclassify that option; the rung concept itself is sound.**

## 1.5 — Steps and skips / sight-reading habit
**Fable:** AMBER — Lightly Row strong target; Water Is Wide brings later notation; Old MacDonald transfer only.

**Independent verdict: AGREE, with nuance.**

The lesson explicitly says Water Is Wide is the tune for applying interval-reading habits and openly mentions its few skips plus a fourth. That makes the leap itself intentional. However, Fable's direct read also found later rhythmic/key vocabulary in the shipped edition (eighths, dotted quarters, ties, G major). Those demands are not acknowledged here and therefore are legitimate burden concerns.

**Revised status:** **AMBER.** Keep Water Is Wide only if the score is treated as transfer/stretch or simplified/excerpted; the interval concept itself is appropriate.

## 2.1 — Hands together: left hand holds
**Fable:** GREEN after removal — Simple Gifts has no LH and must not count.

**Independent verdict: REVISE.**

The lesson already says exactly that: Simple Gifts is **“the right hand's half of this lesson”** and explicitly says the hands-together work is in the four named two-hand tunes above it. Therefore Simple Gifts being RH-only is not a defect and does not require removal from the rung unless some validator/UI falsely counts it as hands-together evidence.

**Revised status:** **GREEN.** Keep Simple Gifts as an explicitly labelled supplementary RH tune; just do not let it certify/count as the hands-together target.

## 2.2 — Eighth notes / “1 and 2 and”
**Fable:** RED — London Bridge is the clean whole-song target; Merrily/Old MacDonald contain no eighths, Alouette is 6/8, Danny Boy too broad; Sakura is promising excerpt.

**Independent verdict: PARTIAL / severity too high.**

The lesson deliberately makes **London Bridge and Sakura** the simple-time eighth-note repertoire. It also deliberately introduces **Alouette as a contrast case**: the text explicitly says its eighths are in 6/8, explains why `1-and-2-and` does not apply, and tells the learner to count `1 2 3 4 5 6`. So Alouette is not a mistaken simple-time example.

Fable is still right that repertoire options with *no* eighth-note material should not masquerade as equivalent target-bearing choices, and Danny Boy may be too broad as first acquisition.

**Revised status:** **AMBER**, not RED. London Bridge = primary; Sakura = transfer/excerpt; Alouette = explicitly labelled contrast/preview; no-eighth options should be review/transfer rather than counted as target coverage.

## 2.3 — First chords: C, F and G
**Fable:** RED — only Happy Birthday simple cleanly writes the target C/F/G blocks; Jingle Bells G belongs later; other lead sheets use later harmony; G7 label disagrees with the sounding G triad.

**Independent verdict: REVISE.**

The lesson is deliberately broader than “every song must literally be a C-major C/F/G block-chord score.” It teaches C/F/G as the first shapes, then explicitly uses:
- **Happy Birthday (simple)** as the written-block model,
- **Jingle Bells in G** as a transposed application using G/C/D7,
- **Skip to My Lou** as an even simpler two-chord D/A symbol-reading/change task,
- melody-plus-symbol songs as places where the learner supplies the chord realization.

So Fable's purity test is too narrow. The G7-over-G-triad issue is also **explicitly acknowledged by the lesson**, not a hidden factual error. It may still be worth cleaning up for beginner clarity, but it does not invalidate the rung.

**Revised status:** **GREEN/AMBER.** Keep Happy Birthday as primary; treat Jingle/Skip/lead sheets as deliberate transfer in chord-symbol reading and transposition. Consider changing the Happy Birthday visible G7 label to G, or explain simplification even more plainly in the score/UI.

## 2.4 — Ties, dotted rhythms and dynamics
**Fable:** RED/AMBER — Cielito Lindo is honest tie transfer; “current Greensleeves versions belong later”; Streets of Laredo offers a dotted-rhythm excerpt.

**Independent verdict: REVISE — Fable appears to have conflated editions.**

The actual lesson's main song is **`song.folk.greensleeves.simple`**, an authored score explicitly tagged level 2.4 with concepts `3/4,dotted-quarter,minor-key,raised-7th,held-LH`. The repo's own prior lesson audit directly checked that simple edition and found the dotted-quarter figure in about half the full bars. Fable's detailed direct-read objection was to the **full imported Greensleeves** with pedal/chromatic/voice complexity, which is not the same learner-facing beginner setting.

Streets of Laredo is also explicitly described by the lesson as a first-half excerpt whose value here is the repeated dotted-quarter/eighth figure; the lesson openly says it stops rather than ends.

**Revised status:** **GREEN/AMBER**, not RED. The authored simple Greensleeves is a legitimate primary dotted-rhythm piece. Keep Streets as an explicitly incomplete dotted-rhythm excerpt/transfer. Only the full imported Greensleeves should be moved later.

## 2.5 — Leaving C position / first scale
**Fable:** AMBER — authored Ode full is a good position-shift piece; imported “easy” Ode is actually Stage-4-ish two-hand harmony.

**Independent verdict: AGREE.**

The lesson explicitly says **Ode to Joy (full theme)** is “the piece this rung is for” and that its one move is the bar-12 position shift; the C-major scale is where thumb-under is actually trained. That is a coherent separation of jobs.

The lesson also acknowledges the “easy variation” is already in G, but does not explain away the additional two-hand/harmonic burden Fable found. Since it is not needed for the rung's core job, it should not be treated as an equivalent beginner primary.

**Revised status:** **AMBER.** Keep `ode-to-joy.full` as primary; reclassify/move the imported easy variation to later transfer/stretch if the direct-read difficulty still holds.

## 3.1 — Sharps, flats and major-scale formula
**Fable:** AMBER — Twinkle F good; Loch Lomond gives real D-major/F# reading; Korobeiniki is D minor and Scarborough Fair modal/minor-context, so current “major” abundance is false.

**Independent verdict: PARTIAL.**

The lesson's actual acquisition pair is explicit: **Ode to Joy in G** and **Twinkle in F**, plus G/F scales. It even makes the subtle point that Ode may never sound its F# despite the key signature. That is a strong lesson contract.

Korobeiniki/Scarborough being minor/modal is only a defect if the curriculum/UI presents them as equivalent demonstrations of the **major-scale formula**. They can remain useful transfer repertoire for reading signatures if labelled as such, but they should not count toward major-key coverage.

**Revised status:** **GREEN/AMBER.** Primary instruction is sound; reclassify minor/modal options as transfer rather than evidence of major-scale acquisition.

## 3.2 — Primary chords in G/F and dominant seventh
**Fable:** GREEN/AMBER — Jingle Bells G and Saints F strong primaries; Yankee Doodle useful denser transfer; Clementine much harder than a first primary-chord example.

**Independent verdict: AGREE.**

The lesson explicitly names **Jingle Bells in G** and **When the Saints in F** as the repertoire applications after the chord/voice-leading work. Those are exactly the two Fable identifies as the cleanest primaries. Harder/inversion-heavy options can remain transfer/stretch without weakening the rung.

**Revised status:** **GREEN**, provided the UI/selection logic does not present Clementine/Yankee as equivalent first-acquisition choices.

## 3.3 — A minor / relative minor / minor chords
**Fable:** GREEN but repetitive — Greensleeves simple/chords genuinely teach A minor and raised 7th/E7; three versions of the same tune are not three transfer contexts.

**Independent verdict: AGREE.**

The lesson intentionally makes **Greensleeves (with chords)** the classic demonstration of Am resolving through E7/G#. That is musically and pedagogically coherent. Multiple editions/arrangements of Greensleeves may still be useful, but they should not inflate repertoire breadth or transfer-context counts unless each has a genuinely distinct task.

**Revised status:** **GREEN**, with a dedupe/role note rather than a curriculum defect.

## 3.4 — Ledger lines / hands away from middle C
**Fable:** AMBER — Petzold/Für Elise are real wider-range repertoire but stretch pieces, not gentle first ledger-line examples; duplicate Petzold editions should not inflate variety.

**Independent verdict: PARTIAL.**

The lesson does **not** rely on Petzold as the first isolated ledger-line acquisition. It first uses extended note-flash and generated two-hand sight-reading, then names Petzold as the piece to learn. That makes an authentic stretch piece much more defensible than Fable's wording implies.

Fable is still right that Petzold should be labelled as a repertoire/stretch destination rather than evidence that the rung's first-read workload is easy, and duplicate editions should not count as breadth.

**Revised status:** **GREEN/AMBER.** Acquisition is handled by drills/generator; authentic piece can be stretch.

## 3.5 — Sustain pedal
**Fable:** RED for pedal notation — current repertoire has no pedal marks; add a pedal-marked primary or state pedal is being added to unmarked music.

**Independent verdict: REVISE.**

The lesson **already states the latter explicitly**: many editions here have no pedal marks, and in that case the learner should change pedal with the harmony. It teaches legato-pedal timing directly, gives a dedicated pedal-change drill, and then asks the learner to apply that pedalling to Greensleeves and Schumann.

Therefore absence of printed pedal marks in the repertoire is not a broken teaching-use claim. The target is **pedalling technique/timing**, not primarily score-symbol reading.

**Revised status:** **GREEN/AMBER**, not RED. A pedal-marked reading example could still improve notation literacy, but it is optional enrichment rather than required repair.

## 3.6 — Broken chords, Alberti bass and waltz bass
**Fable:** RED/AMBER — Greensleeves waltz is excellent; rung still needs literal Alberti + ordinary broken-chord song/excerpts.

**Independent verdict: REVISE.**

The lesson teaches **all three patterns explicitly in drills** and then chooses **Greensleeves (waltz bass)** as the one repertoire application. It does not claim that the song pool itself contains a literal Alberti and ordinary broken-chord example. The acquisition job is therefore already carried by the exercises; repertoire demonstrates one of the patterns in music.

A literal Alberti/broken-chord authentic example would improve transfer breadth, but absence of both does not make the rung pedagogically false.

**Revised status:** **GREEN/AMBER.** Keep Greensleeves as the authentic waltz-bass application; add Alberti/broken-chord excerpts as desirable enrichment, not blocking repair.

## 4.1 — Scales hands together: C, G, D, A
**Fable:** grouped 4.1–4.4 as AMBER / mostly transfer — several real pieces are harder full arrangements; use generated work for acquisition and classify real pieces as transfer/stretch.

**Independent verdict: AGREE WITH ROLE, but the amber warning is mostly already handled.**

This lesson teaches the actual target through scale work: contrary motion, similar motion, then two-octave hands-together scales. Only **after that** does it say “Then a Grade 1 piece” and offer easy Für Elise or Ode variation. So the repertoire is explicitly a destination/application, not the acquisition mechanism.

**Revised status:** **GREEN/AMBER.** The pedagogical structure is sound; just keep the repertoire labelled as Grade-1 transfer/stretch rather than treating it as proof the scale skill itself is easy.

## 4.2 — Flat keys and minor scales
**Fable:** grouped 4.1–4.4 as AMBER / mostly transfer.

**Independent verdict: AGREE WITH ROLE, severity too high if read as a defect.**

The target is taught through scale work (F/Bb/Eb major; A/E/D minor), and the lesson only then assigns **a Grade 1 piece in a flat or minor key** such as Bella Ciao or easy Für Elise. That makes the repertoire intentionally transfer/application, not the place where the scale forms are first isolated.

**Revised status:** **GREEN/AMBER.** Preserve the scale-first structure; label the pieces as transfer/stretch and judge them for whether their extra burden is tolerable, not for acquisition purity.

## 4.3 — Arpeggios and chord inversions
**Fable:** grouped 4.1–4.4 as AMBER / mostly transfer; Schumann Melody harder than labels imply.

**Independent verdict: AGREE WITH ROLE.**

The lesson's acquisition work is the inversion drill plus hands-separate arpeggios across several keys. Only after that does it assign a broken-chord piece such as Greensleeves or Schumann's Melody. The authentic piece therefore does not need to be a pristine first-arpeggio specimen.

Fable's difficulty warning for Schumann can still matter for selection order, but not as evidence the rung itself is conceptually wrong.

**Revised status:** **GREEN/AMBER.** Keep exercises as acquisition; classify Schumann as later transfer/stretch if needed.

## 4.4 — Hanon patterns and finger independence
**Fable:** grouped 4.1–4.4 as AMBER / mostly transfer.

**Independent verdict: REVISE — this rung is not really a repertoire-placement problem.**

The lesson is explicitly a technique/warm-up rung: Hanon 1–5 generated in-app, with safety, evenness, transposition-by-shape and sixteenth-note counting. It even states that Hanon does not substitute for repertoire. There is no need to make an authentic piece “prove” the Hanon target here.

**Revised status:** **GREEN.** Judge the generated Hanon material and the physical instructions; repertoire-purity concerns are largely irrelevant to this rung.

## 4.5 — Compound time, triplets and syncopation
**Fable:** GREEN/AMBER — Greensleeves 6/8 and When Johnny Comes Marching Home are genuine compound-meter material; Alouette belongs here rather than 2.2; fix Greensleeves-6/8 fingering loss before calling it verified.

**Independent verdict: AGREE.**

The lesson explicitly revisits Alouette/Silent Night as earlier 6/8 exposure and now makes compound metre the actual target, with Row Row Row Your Boat and Greensleeves 6/8 as the teaching pieces. That is coherent progression rather than misplaced repertoire.

Any known fingering-loss defect in the learner-facing Greensleeves edition is an edition-quality issue and should remain separate from the pedagogical verdict.

**Revised status:** **GREEN/AMBER** exactly as Fable says: musical role sound; edition fix still matters if current.

## 4.6 — Sight-reading and phrasing capstone
**Fable:** PROJECT/AMBER — several choices are project/stretch difficulty rather than clean sight-reading; use shorter suitable pieces/excerpts for first-read work.

**Independent verdict: REVISE / severity too high.**

The lesson explicitly says **nothing new is introduced** and separates the jobs:
- unfamiliar material for read-ahead comes from the daily sight-read;
- the two repertoire pieces are for polishing, phrasing, continuity and performance;
- the learner is explicitly told to choose pieces they can **already nearly play**.

Therefore a polished piece does not need to be a clean first-sight-reading specimen. Fable's warning only matters if the app auto-selects a piece too hard for the individual learner.

**Revised status:** **GREEN/AMBER.** Keep project repertoire for polishing; ensure selection respects “already nearly play,” while daily/generated material carries true sight-reading.

## 4.7 — Learning it from memory
**Fable:** grouped with 4.6 as PROJECT/AMBER because several repertoire choices are too large/advanced for first-read work.

**Independent verdict: REVISE.**

This rung is explicitly **not first-read work**. The very first instruction is to pick a piece the learner **already plays well**, verify it sighted, then remove the page and practise segmented/restartable memory. The score's job is familiarity, not acquisition purity.

Therefore complexity is only a problem if the app chooses something the learner does *not* already play securely.

**Revised status:** **GREEN.** Judge candidate eligibility by prior mastery/familiarity, not by whether the piece is an easy first-read.

## blues.3 — Blue notes before the twelve bars
**Fable:** TRANSFER — blues repertoire is real, but do not equate genre membership with isolated blue-note acquisition.

**Independent verdict: REVISE TOWARD GREEN.**

The lesson already makes exactly that distinction. It teaches blue-note sound/crush technique directly, then treats lead-sheet repertoire as the place to **apply** it. It even says *Careless Love* “has no blue notes as written, which makes it the place to add your own.” That is deliberate transformation, not false evidence.

**Revised status:** **GREEN as a learner-applied technique rung.** Do not count every blues tune as containing blue notes, but do not penalize a tune for lacking them when the lesson explicitly asks the learner to add them.

## jazz.3 — Long/short swing feel and phrase playback
**Fable:** TRANSFER — standards are repertoire/context; phrase-back/feel is a learner task.

**Independent verdict: REVISE TOWARD GREEN.**

The lesson is explicit that the repertoire was selected because the melodies contain enough eighth-note material to **apply swing feel**, while chord symbols are deliberately ignored. It also distinguishes the separate phrase-back drill from improvisation.

The scores therefore do not need to “contain” swing as a notated property; the learner is instructed to play each tune once straight and once swung.

**Revised status:** **GREEN.** Repertoire is an appropriate rhythmic substrate; the short studies and phrase-back exercise carry isolated acquisition.

## latin.3 — Clave and a tune to hear it under
**Fable:** TRANSFER — tunes provide context; clave is supplied/heard rather than proven by the melody file itself.

**Independent verdict: REVISE TOWARD GREEN.**

That is exactly the intended pedagogy. The lesson says the clave is isolated in dedicated rhythm exercises, then **Guantanamera is the tune to carry while the other hand claps the clave**. It explicitly says Cielito Lindo is in three and should *not* have clave clapped under it. The one-staff songs are substrates for coordination/listening, not supposed notated clave examples.

**Revised status:** **GREEN.** Do not require the melody files to encode the clave when the learner's task is to superimpose it.

## classical.3 — Baroque and Classical dances
**Fable:** GREEN/PROJECT — real dances/minuets; use difficulty judgement rather than narrow detector purity.

**Independent verdict: AGREE.**

The lesson is explicitly repertoire-centered: fixed pulse, two-voice listening, articulation decisions, repeats, ornaments, chunking and phrase shape. Nothing here depends on one detector proving a single isolated acquisition tag. The varied minuet/dance set is appropriate, with difficulty handled by practice method and piece choice.

**Revised status:** **GREEN/PROJECT.**

## chords-pop.3 — Playing from chord symbols
**Fable:** GREEN/AMBER — lead sheets are appropriate because playing from chord symbols is the task; verify harmony/difficulty.

**Independent verdict: AGREE, lean GREEN.**

This lesson explicitly defines the lead sheet as the target format and intentionally mixes:
- symbol-bearing arrangements,
- a bare lead sheet (*Oh! Susanna*) as the “real article,”
- a fully written *Tom Dooley* used backwards: derive and pencil in the chords.

That is smart role variety, not inconsistency.

**Revised status:** **GREEN.** Continue to verify individual harmony/difficulty, but the score-format mix is pedagogically intentional.

## hymns.4 — Four voices, two hands
**Fable:** GREEN — Amazing Grace (four parts) literally contains four written voices across two hands; strong positive control.

**Independent verdict: AGREE.**

Here the score **is** supposed to demonstrate the named texture, and the lesson explicitly says every piece on the rung prints four independent lines with no chord symbols. This is exactly the case where Fable's literal-score standard is appropriate.

**Revised status:** **GREEN.**

## blues.4 — Twelve-bar form and shuffle
**Fable:** RED — file titled `12 Bar Blues` has 11 measures; historical St. Louis/Hesitating Blues are transfer, not a clean twelve-bar primary.

**Independent verdict: PARTIAL.**

An item titled **12 Bar Blues** that actually has eleven measures is a real score/data defect and should be fixed or removed. But the lesson's acquisition mechanism is explicitly the **generated twelve-bar shuffles in C, F and G**, plus a simple riff over the same form. The historical songs need not serve as the clean form primer.

**Revised status:** **GREEN/AMBER at rung level, with one concrete RED file defect.** Preserve the generated 12-bar primary; fix/reject the 11-measure score; classify historical repertoire as transfer.

## jazz.4 — Swung eighths and comping on plain triads
**Fable:** RED — Avalon/Whispering/Margie are one-staff lead sheets with no written LH and no swing mark, so they cannot literally teach written triad comping or swung notation.

**Independent verdict: REVISE.**

The lesson explicitly says those three are **lead sheets** and instructs the learner to:
1. play the tune with the RH,
2. read the chord symbols,
3. comp one of the taught LH rhythms,
4. swing the eighths by feel,
5. then change the comping pattern.

The comping rhythms themselves are acquired in exercises. The score is intentionally a substrate, not a pre-realized comping example. The absence of written LH comping is therefore a feature, not a defect.

**Revised status:** **GREEN/AMBER.** Verify the symbol harmony/difficulty and whether the melodies actually give useful eighth-note material; do not require written LH realization.

## rock.4 — Power chord and repeating figure
**Fable:** RED — Greensleeves writes full Am/G/E7 triads, thirds included, so it is not a literal power-chord example.

**Independent verdict: REVISE.**

The lesson explicitly calls Greensleeves **“a vehicle rather than a rock song”** and tells the learner to **ignore the written left hand entirely**. The task is to use the printed chord symbols to supply power chords, then replace them with the taught ostinato. The exercises carry the literal power-chord/ostinato acquisition.

So the written triads are irrelevant to the assigned task; requiring the source score itself to omit thirds applies the wrong standard.

**Revised status:** **GREEN/AMBER.** Verify only that the melody + symbols are simple and stable enough to serve as the learner-applied texture vehicle.

## technique.4 — Scales, arpeggios and touch
**Fable:** GREEN — Lemoine studies give real scale work in each hand plus chord/touch/articulation transfer.

**Independent verdict: AGREE.**

The lesson explicitly says this rung is technique first, then uses three short Lemoine études as “where the drill turns into music.” That is exactly the correct role for those pieces.

**Revised status:** **GREEN.**

## holiday.4 — Three arrangement devices
**Fable:** SHELF/TRANSFER — verify individual file difficulty; no narrow acquisition purity required.

**Independent verdict: AGREE.**

The lesson explicitly asks the learner to **transform** each written carol: move melody octave, add bass octave, swap broken/block chords, etc. The score is a substrate/model, and the success criterion is whether the second pass audibly differs from the first.

**Revised status:** **GREEN/SHELF-TRANSFER.** Judge file quality/difficulty and whether each arrangement leaves room for the requested device; do not require the static score to already embody the final learner modification.

## classical.5 — Sonatina form and Romantic miniatures
**Fable:** GREEN — Clementi sonatina + Burgmüller/Schumann miniatures are honest, useful repertoire.

**Independent verdict: AGREE.**

The lesson is explicitly repertoire/form/performance oriented: sonatina architecture, continuous Alberti balance, ornament decisions and optional Romantic pedalling. The selected works directly support those jobs without needing artificial acquisition purity.

**Revised status:** **GREEN.**

## chords-pop.5 — Seventh chords and accompaniment textures
**Fable:** AMBER — current songs show accompaniment textures better than explicit seventh-chord-symbol reading; separate those two jobs.

**Independent verdict: AGREE WITH THE DISTINCTION, but not as a major defect.**

The lesson itself separates them:
- seventh-chord vocabulary is taught explicitly;
- broken/accompaniment textures are practised in the lab;
- repertoire mixes texture studies with ballads that use seventh harmony;
- the success criterion is a **lead sheet** played with seventh voicings and a broken-chord accompaniment.

So not every built-in piece has to simultaneously be a pristine seventh-symbol-reading specimen and a texture specimen.

**Revised status:** **GREEN/AMBER.** Keep the two jobs distinct in evidence/selection; ensure at least one actual lead-sheet task contains the seventh symbols being read.

## blues.5 — Turnarounds, blue notes and walking bass
**Fable:** RED for walking-bass coverage — all read songs are one-staff lead sheets with zero written LH walking bass.

**Independent verdict: REVISE.**

The lesson explicitly says the walking bass is **introduced here as an isolated left-hand exercise** and, verbatim, “none of this rung's pieces has one yet, and the next rung puts a right hand over it.” Therefore the absence of written walking bass in the repertoire is deliberate sequencing, not missing coverage.

The repertoire on this rung is being used for blue-note, turnaround, call-and-response and improvisatory work while the new LH line is learned separately.

**Revised status:** **GREEN/AMBER.** Judge the walking-bass exercise itself; do not demand that the song files already realize it.

## jazz.5 — Swing, shell voicings and ii–V–I
**Fable:** RED for shell-voicing coverage — standards are one-staff lead sheets; good transfer, no written shell voicing.

**Independent verdict: REVISE.**

The lesson explicitly teaches shell voicings in exercises and then says the four repertoire options are **lead sheets** to be comped with those shells. That is exactly the normal pedagogical workflow: the page supplies melody/harmony; the learner supplies the voicing.

The lesson even distinguishes what the app can and cannot read from the static score: swing/accent placement are for the learner's ear because the pieces do not print those marks.

**Revised status:** **GREEN/AMBER.** Verify that the chord symbols give suitable seventh-harmony/ii–V–I opportunities; do not require pre-written shell voicings.

## ragtime.5 — Oom-pah and syncopated RH
**Fable:** AMBER — Greensleeves waltz teaches oom-pah mechanics; full Joplin is stretch; needs a small written syncopated-rag primary.

**Independent verdict: PARTIAL.**

The lesson already scaffolds this deliberately:
- four repertoire choices isolate the leaping bass without syncopated RH;
- *12th Street Rag* isolates a recurring RH idea;
- *The Entertainer* is the only full two-hand destination;
- the success criterion is **one strain**, not the whole rag.

That effectively turns *The Entertainer* into an excerpt-level final application even though the file is complete. A purpose-built miniature rag could still be cleaner, but the current progression is not missing a teaching bridge.

**Revised status:** **GREEN/AMBER.** Keep the staged LH→RH→one-strain workflow; add a small rag primary only if learner data shows the Entertainer strain is still too large a jump.

## latin.5 (`latin`) — Clave, tumbao and montuno
**Fable:** RED for named techniques — current songs are mostly melody/lead sheets/tango; no literal montuno+tumbao+clave primary found.

**Independent verdict: REVISE.**

The lesson explicitly says **the two-hand groove is in the exercise** and that the rung's songs are mostly printed on one staff. It gives an ordered acquisition path: clave → tumbao alone → tumbao+montuno exercise. Repertoire then provides stylistic/tune context (clave-under-Guantanamera, choro, bossa, tango), not a pre-written two-hand salsa groove.

Therefore demanding a song file that literally contains montuno+tumbao+clave misreads the lesson contract.

**Revised status:** **GREEN/AMBER.** Verify the dedicated groove exercise rigorously; treat repertoire as context/transfer. A real montuno excerpt could enrich the track, but it is not required to make this rung truthful.

## technique.5 — Repeated notes, unequal hand speeds, travelling line
**Fable:** GREEN/AMBER — Duvernoy 4–6 strongly cover hands at different speeds/travelling line; repeated-note physical technique still needs a focused drill.

**Independent verdict: REVISE TOWARD GREEN.**

The lesson **already contains a dedicated repeated-note exercise** and explicitly discusses changing finger on each strike; it intentionally leaves fingering unprinted for the learner to choose. The études are then “the exercise above with a melody on it,” not the only source of the physical technique.

**Revised status:** **GREEN.** Keep the focused drill for acquisition and Duvernoy for musical transfer.

## rock.5 — Open voicings / suspended sound
**Fable:** GREEN — Annie's Song literally writes root–fifth–octave open shapes with the third omitted; excellent primary.

**Independent verdict: AGREE.**

The lesson intentionally says both repertoire options **print the sound in their chord symbols**, while the exercises teach the wide spacing and chord construction. Annie's Song is the simpler suspended-chord illustration; *andata* is the harder whole-texture study and is explicitly described as harder than its level suggests.

**Revised status:** **GREEN.**

## hymns.5 — Walk-ups, passing chords, non-diatonic dominants
**Fable:** GREEN/AMBER — Just a Closer Walk has a real written bass walk-down; What a Friend supplies non-diatonic symbol work; others are transfer.

**Independent verdict: AGREE.**

The lesson explicitly uses a mix of written examples and learner-added decoration. Several songs print the chromatic/dominant material; others are deliberately sparse so the learner can add walk-ups/passing chords on a second pass. That role mix is coherent.

**Revised status:** **GREEN.** Preserve which pieces are literal examples versus open substrates.

## classical.6 — Voicing, rubato and Romantic miniature
**Fable:** PROJECT/SHELF — real Bach/Chopin/Satie/Beethoven repertoire; judge voicing/rubato as performance tasks, not detector facts.

**Independent verdict: AGREE.**

The lesson explicitly teaches voicing, rubato, pedalling and section practice as **performance behaviours applied to real repertoire**. A static MusicXML detector cannot certify whether the learner balances voices or uses tasteful rubato.

**Revised status:** **GREEN/PROJECT-SHELF.** Verify edition/difficulty and use performance-task evidence, not narrow score tags.

## ragtime.6 — Multi-strain form and leaping LH
**Fable:** GREEN — Joplin School of Ragtime is authentic pedagogical source; full rags are appropriate transfer/projects.

**Independent verdict: AGREE.**

The lesson explicitly moves from Stage 5's isolated components to a **whole rag**, teaches strain-by-strain form, trio key changes, flat-key reading, LH travel, repeat roadmap and printed tempo, and uses Joplin's own *School of Ragtime* as the bridge. Full works are exactly the intended destination.

**Revised status:** **GREEN.**

## technique.6 — Seventh shapes, rotation and voicing
**Fable:** AMBER — Czerny studies are genuine velocity/arpeggio transfer, but rotating wrist/voicing are physical instructions, not score facts.

**Independent verdict: AGREE, lean GREEN.**

The lesson already treats rotation as a physical technique to try/listen for and voicing as a measured/perceptual exercise, while Czerny is explicitly the étude that puts evenness into music. It does not rely on the score file itself to certify forearm rotation.

**Revised status:** **GREEN/AMBER.** Keep physical/performance evidence separate from static score facts; no repertoire repair implied.

## jazz.6 — Comping, walking bass and hearing changes
**Fable:** RED for written comping/walking — standards are lead sheets; useful hearing-changes transfer but no written LH comp/walk.

**Independent verdict: REVISE.**

The lesson explicitly says **every repertoire option is a single stave with chords printed above it, which is what comping is read from**. It then instructs the learner to comp a pattern through a chorus and **walk a line under it**. The comping patterns and walking-bass construction are taught separately before being applied.

So lack of pre-written LH comping/walking is the intended challenge, not missing content.

**Revised status:** **GREEN.** Verify chord-chart suitability/modulation burden; do not require realized accompaniment in the score.

## blues.6 — Pinetop, root–fifth and walking bass
**Fable:** GREEN — dedicated boogie/walking-bass exercise literally labels and writes real walking patterns.

**Independent verdict: AGREE.**

The lesson explicitly teaches the LH patterns in exercises, takes them through twelve-bar forms, and carefully distinguishes the named “Pinetop” practice pattern from the actual historical Pinetop score. That is unusually honest about provenance and role.

**Revised status:** **GREEN.**

## chords-pop.6 — I–V–vi–IV and descending slash bass
**Fable:** GREEN/AMBER — All of Me gives a clear four-chord-family cycle; Clocks is pop ostinato transfer. Do not call patterned/arpeggiated bass “walking” by default.

**Independent verdict: AGREE, with terminology clarification.**

The lesson's “bass that walks” is specifically the **descending slash-bass line** (`C, C/B, Am, C/G, F, F/E, Dm, G`), not jazz walking bass. Its actual acquisition target is numeral-based transposition/inversions/slash chords, and it explicitly says the rung is complete on exercises even when personal-library songs are unavailable.

**Revised status:** **GREEN.** Keep “descending/stepwise slash bass” distinct from jazz walking-bass claims.

## rock.6 — Arpeggio over pedal bass / pedal as colour
**Fable:** GREEN/AMBER — Moonlight I is a literal arpeggio-over-sustained-bass example; Gnossienne/Chopin are adjacent transfer, not equivalent primaries.

**Independent verdict: AGREE.**

The lesson itself differentiates their jobs: Gnossienne for repeated LH under free RH, Chopin Prelude 20 for weight in block chords, Moonlight as the archetypal continuous arpeggio texture. They are explicitly not interchangeable examples.

**Revised status:** **GREEN/AMBER.** Preserve those distinct roles rather than counting all three as identical target evidence.

## hymns.6 — The hymn as an arrangement
**Fable:** GREEN/PROJECT — substantial two-staff arrangements with real arrangement material.

**Independent verdict: AGREE.**

The lesson explicitly changes the job from filling in missing accompaniment to **studying someone else's complete piano arrangement**: identify melody, analyze LH pattern, hear turnaround/fill writing, and simplify arranger-added difficulty when needed.

**Revised status:** **GREEN/PROJECT.**

## latin.6 — Tango accompaniment and three-voice montuno
**Fable:** RED/AMBER — tango accompaniment is genuine; The Crave is useful; no clean literal three-voice montuno primary found.

**Independent verdict: REVISE.**

The lesson explicitly says **“The montuno is in the exercises, because none of these three pieces writes one out.”** It then names the three-note montuno study, tumbao study and combined groove study. The repertoire's separate job is printed two-staff Latin accompaniment: repeated tango patterns, tresillo, and chromatic walking.

So absence of a montuno in the repertoire pool is intentional, not a failed claim.

**Revised status:** **GREEN/AMBER.** Verify the montuno/tumbao exercises directly; keep tango/tresillo pieces as printed-accompaniment transfer.

## classical.7 — Counterpoint and singing line
**Fable:** PROJECT/SHELF — K.545/Moonlight/Pathétique/Inventions are genuine contrapuntal/singing-line repertoire; edition defects still matter.

**Independent verdict: AGREE.**

The lesson is explicitly advanced performance/repertoire work: independent voices, articulation, sonata map, ornamented melody, balance. The six pieces serve distinct musical jobs rather than one isolated detector target.

**Revised status:** **GREEN/PROJECT-SHELF.** Continue to fix any known edition-specific notation defect separately.

## ragtime.7 — Stride precursors, wider leaps and slow drag
**Fable:** PROJECT/SHELF — full Joplin works are appropriate stride/slow-drag destinations; ordinary difficulty/source checks suffice.

**Independent verdict: AGREE.**

The lesson is explicitly repertoire/destination work: wider LH leaps, secondary-rag grouping, slow drag/habanera/waltz contrasts, edition comparison, and piece-specific practice choices. Full authentic works are the point.

**Revised status:** **GREEN/PROJECT-SHELF.**

## technique.7 — Double notes, octaves, polyrhythm and half pedal
**Fable:** RED for pedal half / AMBER otherwise — Czerny 5/8/10 support advanced motion, but their raw score headers have pedal count 0.

**Independent verdict: REVISE.**

The half-pedal target is a **dedicated exercise with live pedal-value feedback**, not a property the Czerny études are supposed to print. The lesson explicitly describes the exercise's 32–96 CC64 window and even handles digital pianos that only send 0/127.

Czerny serves the separate double-note/octave/broken-chord transfer job.

**Revised status:** **GREEN/AMBER**, not RED. Verify the half-pedal exercise/runtime behavior; zero pedal marks in Czerny are irrelevant.

## jazz.7 — Rootless voicings, quartal colour, tritone substitution
**Fable:** RED/AMBER — Skating/Fly Me are good advanced-harmony transfer but current set lacks a tiny literal rootless/tritone primary.

**Independent verdict: REVISE.**

The lesson explicitly acquires the target in **ii–V–I exercises and the accompaniment lab**, then asks the learner to *reharmonize* standards by substituting dominants and to apply rootless voicings to Fly Me/I Got Rhythm. Jingle Bells/Skating are the “somebody already did the work” examples.

So a tiny repertoire file that literally pre-writes every rootless/tritone target would be useful illustration, but it is not required for truthful acquisition.

**Revised status:** **GREEN/AMBER.** Verify the exercises/lab and the harmonic suitability of the standards; do not demand that every repertoire score already realizes the learner's reharmonization.

## blues.7 — Leaping LH / turnaround
**Fable:** GREEN/AMBER — Boogie-Boogie en Sol is a clear leaping-LH primary; Easy Boogie fits walking better on blues.6.

**Independent verdict: AGREE, with role clarification.**

The lesson explicitly says **none of the three repertoire pieces is required; the rung is finished on its exercises**. The songs are reading/application while stride and turnaround are acquired directly. Reusing Easy Boogie as warm-up is therefore not a false primary claim.

**Revised status:** **GREEN/AMBER.** Keep Boogie-Boogie en Sol as useful key-transfer reading; treat Easy Boogie as warm-up/review rather than new stride evidence.

## chords-pop.7 — sus2, sus4, add9 and ninth chord
**Fable:** RED — current options such as Blinding Lights have plain chords or no chord symbols; pop abundance does not directly teach sus/add9/ninth names.

**Independent verdict: REVISE.**

The lesson explicitly says the rung is **complete on its exercises** and that several songs are intentionally plain substrates whose colour is **left for the learner to add**. The task is: play one plainly, then re-voice it using the sus/add9/open-voicing work from the exercises. Blinding Lights having plain chords is therefore not a failure; it is exactly the transformation exercise.

**Revised status:** **GREEN/AMBER.** Verify the chord-colour exercises themselves and ensure at least one example like Fix You actually demonstrates printed sus colour; do not require all repertoire files to name the target chords.

## rock.7 — Building with register, density and volume
**Fable:** PROJECT/GREEN — Hall of the Mountain King literally encodes gradual build with repeated crescendos/increasing density; use excerpt/reference due level ~8.4.

**Independent verdict: AGREE.**

The lesson explicitly acknowledges the huge level range and uses Mountain King as the **most literal** build example, while exercises isolate crescendo/density first. It even recommends taking eight bars with Blind rather than a page.

**Revised status:** **GREEN/PROJECT.** Full work can remain a reference/destination; use excerpt-sized practice for the actual build experiment.

## latin.7 — The showpiece / weak-hand preparation
**Fable:** PROJECT/GREEN — El Choclo, Asturias and Malagueña are genuine large two-hand showpieces; prepare weak hand with drills; do not “purify” the showpieces.

**Independent verdict: AGREE.**

The lesson explicitly calls these the hardest pieces on the track, analyzes the less-obvious hand burden in each, and pairs them with one-hand preparatory studies before a Perform pass. Their complexity is the intended destination.

**Revised status:** **GREEN/PROJECT.**

## jam.7 — Trading fours / shared set list
**Fable:** GREEN as task substrate — lead sheets are correct format; Jazz Me Blues even prints breaks/solo directions.

**Independent verdict: AGREE.**

The lesson's job is interactive: form awareness, trading space, chart directions, transposition decisions and agreed repertoire. Single-staff lead sheets with chord symbols and band directions are exactly the right substrate.

**Revised status:** **GREEN as task substrate.**

## holiday.7 — Winter repertoire, not carols
**Fable:** SHELF — verify file/difficulty; no narrow technique claim.

**Independent verdict: AGREE, with a clearer performance role.**

The lesson is intentionally a winter-performance shelf built around demanding written LH accompaniments, with preparatory LH studies and a Perform pass. It does make a concrete technical observation — the LH controls the sustainable tempo — but not a narrow acquisition purity claim.

**Revised status:** **GREEN/SHELF-PROJECT.**

## jazz.8 — Extensions and modulation
**Fable:** AMBER/RED for acquisition — Stardust/I Got Rhythm are rich transfer; Uncle Ben's Cakewalk is high level; add a compact extension primary.

**Independent verdict: REVISE.**

The lesson explicitly acquires extensions in a **dedicated 11th/13th drill** and modulation in harmonic dictation. Repertoire then supplies contexts in which the learner chooses/places extensions: I Got Rhythm's dominant bridge, Stardust by ear, and a modern rag as application.

A compact notated extension example could be helpful, but the rung does not rely on the repertoire to teach chord construction from scratch.

**Revised status:** **GREEN/AMBER.** Verify the extension drill/dictation; treat the songs as transfer/application and Uncle Ben as stretch.

## blues.8 — Twelve keys / dominant ninth colour
**Fable:** RED for primary — advanced works have no chord-symbol teaching; “12 keys” is a generated learner task, not a score property; add small dominant-9 comparison.

**Independent verdict: REVISE.**

The lesson explicitly says **“The piece is still your own chorus, written down”** and that the rung is **finished on its exercises**. Pinetop/Chevy Chase/Black Bottom Stomp are reading/reference material while the learner transposes the form and substitutes ninths in their own chorus. So Fable was evaluating the wrong artifact.

**Revised status:** **GREEN/AMBER.** The exercises/lab + learner-written chorus are the primary. A tiny C7-vs-C9 comparison could improve instruction, but the advanced repertoire need not carry chord-symbol acquisition.

## chords-pop.8 — Transposing for the singer
**Fable:** TASK/AMBER — transposition is learner action; huge fixed-key arrangements are not wrong, just poor first substrates; prefer a short harmonically clear song/excerpt.

**Independent verdict: AGREE WITH TASK FRAMING; severity modest.**

The lesson explicitly teaches transposition in a dedicated four-bar drill and says the rung is complete on its exercises. The six songs are advanced whole-song applications: play as written, then in two new keys without a transposed copy.

Fable is right that a shorter/clearer song would make the *first full-song* transfer cheaper, but the large arrangements are not conceptually invalid at Stage 8.

**Revised status:** **GREEN/AMBER.** Keep the exercise as acquisition; rank repertoire by harmonic transparency/length and offer an easier first transfer before the hardest arrangements.

## ragtime.8 — Late rags
**Fable:** PROJECT/SHELF — late-rag repertoire; verify edition/difficulty, no narrow purity requirement.

**Independent verdict: AGREE.**

The lesson is explicitly historical/advanced repertoire work: denser syncopation, chromatic harmony, stop-time, figure recognition and stylistic transfer beyond Joplin. Full late rags are the content, not examples wrapped around a small acquisition target.

**Revised status:** **GREEN/PROJECT-SHELF.**

## classical.9 — Long-form final project
**Fable:** PROJECT/SHELF — deliberately major long-form projects; correctness/edition/difficulty are the questions, not narrow demand isolation.

**Independent verdict: AGREE.**

The lesson explicitly says nothing here is meant to be “passed”; the learner chooses one large work and stays with it for months. The curriculum job is long-form practice strategy and interpretation, not isolated skill acquisition.

**Revised status:** **GREEN/PROJECT-SHELF.**

## jazz.9 — One standard, four ways
**Fable:** GREEN/PROJECT — Take Five, Lullaby of Birdland, Ain't Misbehavin', Linus and Lucy are real two-staff textures; soloing/walking can be learner passes over the tune rather than pre-written score properties.

**Independent verdict: AGREE.**

The lesson explicitly says the point is to take **one tune** and comp it, walk+comp it, stride it, reharmonize it, learn phrases by ear, transpose it and eventually play it blind. Those are learner performances over a stable form, not features the source score must pre-encode.

**Revised status:** **GREEN/PROJECT.**

## blues.9 — Improvising over the form
**Fable:** TASK/PROJECT — improvisation is learner action; prefer a simple explicit form as substrate; keep Black Bottom Stomp etc. as stretch repertoire.

**Independent verdict: AGREE, lean GREEN.**

The lesson explicitly says **“Yours, first — nothing here is required.”** The primary substrate is the learner's own twelve-bar form / accompaniment-lab bed; the three written works are transcribed/composed examples to study for phrase construction afterward.

**Revised status:** **GREEN/PROJECT.** The simple explicit form already exists in the lab/task; historical written choruses are models, not acquisition primaries.

## chords-pop.9 — Turning a chart into an arrangement
**Fable:** RED/AMBER workflow mismatch — full finished arrangements with no chord symbols are “model outputs, not chord-chart inputs”; supply a chart first.

**Independent verdict: REVISE.**

The lesson explicitly says the six are **already somebody's arrangement — “which is the point.”** The learner plays one as written, **works its chords out from the notes**, and then builds a new arrangement. Our exact-score spot checks also found real differences in usefulness: *Falling* is an excellent transparent first model; *Piano Man* and *Rolling Girl* are good next models; *Mr. Blue Sky* and *Le Festin* are better stretch/thinning studies.

So the finished arrangements are valid **model inputs** for reverse engineering. The actual defect is the separate finder language that asks for lead-sheet-only material / avoids fully written arrangements, which contradicts the lesson.

**Revised status:** **GREEN/AMBER.** Keep the model-arrangement workflow; sequence by transparency; fix the finder contract.

## ragtime.9 — The whole rag, without the page
**Fable:** PROJECT/SHELF — whole-rag project; full authentic rags are appropriate.

**Independent verdict: AGREE.**

The lesson is exactly a final integration/memory project. It assumes the learner already knows how to dismantle a rag by strain, LH, and recurring figure; now it asks for one complete Joplin rag from memory, tested from arbitrary strain starts and then in Perform mode. Full authentic rags are therefore the correct material, not over-large acquisition examples.

**Revised status:** **GREEN/PROJECT-SHELF.**

## Overall audit conclusion

Audited **71 Fable-index rungs** against their actual lesson/task contracts, using Fable's direct readable-score observations as the starting evidence and reopening score facts only where necessary.

Verdict-family count:
- **AGREE:** 39
- **REVISE:** 25
- **PARTIAL:** 7
- **REOPEN SCORE:** 0
- **Other/mixed label:** 0

### Main finding

Fable's direct MusicXML observations are generally useful and often excellent. The dominant failure was not score reading; it was **role interpretation**. It repeatedly treated repertoire as though the static file had to contain the lesson's named technique, even when the lesson explicitly teaches that technique in a drill/exercise and then asks the learner to apply it to a lead sheet, tune, chord chart, or already-written arrangement.

The durable rule is:

1. **Demonstration score:** if the lesson says the score itself demonstrates X, require X in the score.
2. **Application substrate:** if the learner is instructed to add/do X, require the score to support that task; do not require X to be pre-written.
3. **Exercise-first acquisition:** if a drill teaches X and repertoire is subsequent transfer, judge the drill for acquisition and the repertoire for suitability of transfer.
4. **Project/shelf/capstone:** judge authenticity, edition, difficulty, musical usefulness and project fit; do not apply first-acquisition purity.
5. **Edition identity matters:** do not transfer a defect from one arrangement/edition to another merely because the title is the same.

### Highest-value Fable corrections

The most consequential revisions are the rungs where Fable called missing *written* technique a defect despite explicit learner-application instructions: `3.5`, `blues.3`, `jazz.3`, `latin.3`, `jazz.4`, `rock.4`, `blues.5`, `jazz.5`, `latin.5`, `jazz.6`, `latin.6`, `technique.7`, `jazz.7`, `chords-pop.7`, `jazz.8`, `blues.8`, and `chords-pop.9`.

Also important:
- `2.1`: Simple Gifts being RH-only is explicitly acknowledged and intentional supplementary work.
- `2.4`: Fable appears to have conflated the full imported Greensleeves with the authored `greensleeves.simple` actually intended for this rung.
- `4.6` / `4.7`: project/memory repertoire was over-penalized as if it were first-read acquisition material.

### Remaining genuine issues that survived the reinterpretation

The audit does **not** mean everything is green. Concrete issues that still deserve action include:
- premature eighth-note editions around `1.1` / `1.2` / `1.3`;
- RH-only or otherwise incompatible options if the app counts them toward a target they do not perform (`1.4` is the clearest example);
- later-demand-heavy transfer pieces being offered as equivalent primaries rather than explicitly as transfer/stretch;
- the reported 11-measure score titled `12 Bar Blues`;
- edition-level defects such as known fingering/notation problems;
- duplicate arrangements inflating apparent breadth;
- `chords-pop.9` finder language contradicting the lesson's intentional reverse-engineering workflow.

Fable should therefore remain the **score-fact evidence layer**, while curriculum admission/role decisions should use the lesson-aware rules above.
