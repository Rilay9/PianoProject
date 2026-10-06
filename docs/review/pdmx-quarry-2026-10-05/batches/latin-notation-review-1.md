# Latin notation review batch 1

Branch: `chatgpt/pdmx-dump-2026-10-05`
Quarry baseline: `aaf350e57330135ee612f6bb22b4d2b4ea999549`
Parent ledger: `../CANDIDATE-REVIEW.md`

This file records notation-reading results separately so the review does not depend on chat context. Metadata/title is not accepted as proof of a named style figure.

## Corcovado
CID: `QmWYgg7QifpX4XtkYReco3Psk4GvNgzbeZMeqTBUvabUgF`
Read: `summary/E-latin/corcovado-...txt`

Observed:
- one-staff lead sheet, 36 bars, 31 chord symbols, 2/2;
- melody only; no written two-hand accompaniment pattern.

Disposition: **ADMIT as APPLICATION SUBSTRATE**; **REJECT FOR THIS ROLE** as the source/model that teaches bossa accompaniment.
Role: real Brazilian tune after the bossa pattern has been sourced/taught elsewhere.
Identity caveat: TITLE_ONLY/no creator metadata in this file; bibliographic confirmation remains separate.

## Girl from Ipanema — big-band arrangement
CID: `QmZF4m2KTAiHmHpg9eYrG1y2bfQKo2chTxSNYepnmuvHtF`
Read: `summary/E-latin/girl-from-ipanema-...txt`, including the piano-part excerpt.

Observed:
- 51-bar eight-part arrangement: brass/reeds, two-staff piano, bass, drums, claves;
- explicit open-for-solos section;
- piano opening uses sustained/block chord voicings over bass motion rather than a clean isolated bossa piano figure;
- ensemble score contains useful texture/orchestration evidence, but not a simple acquisition pattern.

Disposition: **KEEP CANDIDATE** for later ensemble/arrangement or MUSIC work; **REJECT FOR THIS ROLE** as the primary bossa accompaniment MODEL.

## Garota de Ipanema — solo-piano arrangement
CID: `QmRWDfadi4gsez9ishabhEcHpHNdjC7q2efEJZe5SDa8X8`
Read: `summary/E-latin/garota-de-ipanema-...txt`

Observed:
- 34-bar grand-staff piano score, 2/4, 24 chord symbols;
- from the opening, the LH repeatedly places compact extended-chord voicings in a syncopated attack/rest pattern beneath the melody;
- the same accompaniment rhythm is preserved as the harmony changes, making the rhythmic cell visually easy to isolate;
- the middle section changes harmonic color while largely keeping a controlled accompaniment texture; return material restores the opening pattern.

Disposition: **HIGH-PRIORITY CANDIDATE; current best quarry candidate for a written bossa accompaniment MODEL**.
Likely role: real-score MODEL after a tiny CONTROL pattern, followed by application to `Só Danço Samba` or `Corcovado` lead sheets.
Required gate: compare the exact LH onset/duration pattern from selected opening bars against a published/source-backed bossa piano/accompaniment definition before calling it the canonical pattern. The score proves what this arrangement writes; the title/genre does not by itself prove the pedagogical label.
Edition note: arranger metadata is Bianca/Bia Giovanella rather than Jobim; treat it as an arrangement/model edition, not an authoritative original score.

## Tico-Tico — long one-staff arrangement
CID: `QmejFJRcT7Q9hdFQWbhPZCnewzAzCzVCckYHgsVuN7RcAM`
Read: `summary/E-latin/tico-tico-Qmej...txt`

Observed:
- 193-bar one-staff piano-family score, 2/2, no chord symbols;
- dense continuous eighth-note writing, frequent dyads/chords and sequential/virtuosic figures;
- no separate lower-hand/accompaniment staff from which to teach a named accompaniment pattern.

Disposition: **KEEP CANDIDATE** for later Latin rhythmic fluency / advanced MUSIC; **REJECT FOR THIS ROLE** as a clean accompaniment-pattern acquisition/model score.
Reason: notation is musically rich but pedagogically too fused for the missing pattern bridge.

## Adiós Nonino
CID: `QmYNaW9VvQDFWoD159XYCPxmvyJmGBkhrFijb1P1PaLRUE`
Read: `summary/E-latin/adios-nonino-...txt`, including active second-piano passages.

Observed:
- 81 measures, mixed ensemble with strings/flute plus two two-staff piano parts;
- strong sectional/tempo contrast and extensive articulation;
- second piano contains repeated, clearly patterned accompaniment/bass attacks under melodic material, while another piano part is sometimes tacet;
- substantially more complex than an acquisition exercise.

Disposition: **HIGH-PRIORITY CANDIDATE** for Argentine tango **MODEL / MUSIC / advanced arrangement analysis**.
Not yet a named-figure admission: if a passage is to be called tango/habanera by a specific rhythmic name, compare exact onsets to the source-backed definition first.

## Por Una Cabeza — Carlos Gardel piano arrangement
CID: `QmNswaWYXpxK1XegKbJVDULwZMjKN6cETGTVfXQKYsYrzs`
Read: `summary/E-latin/por-una-cabeza-carlos-gardel-...txt`

Observed:
- 66-bar grand-staff solo-piano arrangement;
- persistent LH accompaniment pattern near the opening: bass attack, delayed inner/bass event, staccato chord/bass response, final beat; pattern repeats through many measures;
- strong integrated tango texture with melody, chordal RH writing and recurring accompaniment treatment.

Disposition: **ADMIT as tango MODEL / MUSIC candidate**.
Important correction: the notation is not, by itself, proof that the recurring LH figure is the curriculum's named **habanera** pattern. Do not use title/genre as a substitute for a rhythmic-definition check. If the earlier generator addendum calls this an admitted habanera model, that specific claim still requires comparing the exact onset/duration pattern to the sourced habanera definition.

## Batch conclusion

The quarry now **does contain a strong written bossa-pattern candidate**: the solo-piano `Garota de Ipanema` edition `QmRWD...`. It is not admitted as the canonical bossa pattern until its opening LH rhythm is checked against a published definition, but it changes the earlier conclusion that only application substrates had been found. `Só Danço Samba` and `Corcovado` remain excellent application lead sheets after the pattern is taught. The big-band Girl edition is later ensemble/arrangement material. `La Negra Tiene Tumbao` remains the strongest Cuban-pattern candidate pending definition matching. `Por Una Cabeza` and `Adiós Nonino` remain strong Argentine texture models with named-pattern claims kept separate from title/style.

Next Latin work: source-match the selected `Garota de Ipanema` opening bars; source-match `La Negra Tiene Tumbao`; then inspect another Piazzolla/Libertango candidate only if it adds a distinct teaching job rather than redundancy.