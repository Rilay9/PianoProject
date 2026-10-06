# Style source-match notes 1 — bossa and Cuban piano patterns

Date: 2026-10-05
Branch: `chatgpt/pdmx-dump-2026-10-05`
Purpose: keep external style-definition evidence separate from what the PDMX score itself contains.

## Bossa nova — source evidence gathered

Sources consulted:
- *O Piano Brasileiro*, unit 6 sample text: explicitly treats bossa nova with multiple rhythmic patterns and says its first solo-piano technique combines a left-hand accompaniment (chords + rhythm) with right-hand melody. It labels at least two accompaniment patterns rather than implying one immutable universal figure.
- Piano With Jonny, `Learn How to Play Bossa Nova Piano in 5 Steps`: teaches a specific accompaniment by reducing chords to shells and applying a recurring syncopated LH rhythm; it explicitly treats Girl from Ipanema harmony as a bossa teaching substrate.
- Piano With Jonny, `The Jobim Chord Progression`: describes LH root/5th bass behavior plus a syncopated repeating bossa rhythm in the other layer, including anticipation of the next chord.
- 8notes, `Introduction to Bossa Nova for Piano`: states that bossa rhythms vary, but a basic pedagogical form combines steady on-beat bass with more syncopated chordal rhythm.
- PianoGroove bossa lessons: similarly separate steady bass from syncopated rootless chord voicings and melody.

Source-derived conclusion:
- There is **not one single universally mandatory bossa piano cell**. A trustworthy curriculum should teach a sourced basic pattern/coordination principle and explicitly allow variants.
- The repeated accompaniment rhythm in the solo-piano `Garota de Ipanema` PDMX edition is **structurally compatible with the sourced pedagogical picture**: repeating syncopated chord attacks under melody, preserved across chord changes.
- This is enough to keep it as the current best real-score MODEL candidate, but not enough to say its exact onset sequence is *the* canonical bossa pattern without matching it against a notated source example.

Curriculum consequence:
- CONTROL: one or more explicitly sourced bossa coordination patterns, named as basic patterns/variants rather than universal law.
- MODEL: selected opening bars from `Garota de Ipanema` CID `QmRWD...`, after exact rhythm comparison.
- MUSIC/APPLICATION: `Só Danço Samba` and `Corcovado` lead sheets, where learner supplies the pattern instead of copying it.

## Cuban piano — terminology/source evidence gathered

Sources consulted:
- Rebeca Mauleón references surfaced through educational/reference material: *Salsa Guidebook for Piano and Ensemble* and *101 Montunos* are repeatedly cited for piano guajeo/montuno practice.
- Kevin Moore, *Beyond Salsa Piano*, surfaced as a source on early Cuban piano tumbao.
- California School of Music, `Salsa, Afro Cuban Montunos for Piano`: distinguishes examples in 2-3 and 3-2 clave and presents montuno/tumbao patterns across common harmonic progressions.
- Prof. Samuel Guzmán's educational example explicitly attributes a two-hand son-montuno guajeo/tumbao to Manny Patiño & Jorge Moreno, *Afro-Cuban Keyboard Grooves*, in 2-3 clave.
- Reference summaries of `guajeo` describe it as a repeated, usually syncopated, often arpeggiated harmonic/melodic ostinato; `montuno` and `tumbao` overlap in practitioner usage but are not perfectly interchangeable in every context.
- `Ponchando` is specifically described in the literature as a block-chord/non-arpeggiated guajeo-type texture where attack points rather than an arpeggiated pitch sequence carry the pattern.

Source-derived conclusion:
- The current curriculum must **not collapse tumbao, montuno and guajeo into one universal block-chord pattern** merely because a score title contains `tumbao`.
- `La Negra Tiene Tumbao` CID `QmbY...` contains strong repeated syncopated keyboard ostinato material, but much of the inspected opening/verse texture is block-chordal. It may be better described as a specific comping/ponchando-like or arrangement texture unless exact selected bars match a sourced guajeo/tumbao pattern.
- The next verification should compare exact attack points and pitch-role/arpeggiation behavior of selected `La Negra` bars with a published 2-3/3-2 source example; clave relationship matters.

Curriculum consequence:
- Teach `guajeo/montuno/tumbao` with terminology caveat and source-specific examples, not as synonyms with one invented detector rule.
- Generated CONTROL figures should be derived from an explicit published example/contract.
- Real-score MODEL status for `La Negra Tiene Tumbao` stays **CANDIDATE** until selected bars are source-matched.

## Important boundary

The source research answers **what the style/pattern family ought to mean**. The PDMX notation read answers **what this score actually writes**. A parser/checker can compare exported events to a contract, but cannot decide that the contract itself is musically authoritative. Keep these as separate gates.