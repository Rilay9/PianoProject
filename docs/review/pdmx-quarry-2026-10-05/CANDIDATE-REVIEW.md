# PDMX candidate review ledger

Date started: 2026-10-05
Branch: `chatgpt/pdmx-dump-2026-10-05`
Quarry baseline: `aaf350e57330135ee612f6bb22b4d2b4ea999549`

Purpose: persistent notation-review state for the most promising PDMX quarry candidates. This file is the working record so review state does not live only in chat context.

## Rules

- Quarry rank and metadata are leads only.
- A score is not admitted merely because it was dumped.
- Read the notation summary / MusicXML before assigning a teaching role.
- Keep these questions separate:
  1. Is this actually the intended piece / edition?
  2. What does the notation actually contain?
  3. What learner-facing job can it serve?
  4. Is it acquisition, model/transfer, music, or independence material?
  5. Does a style claim still require an external/source-backed definition?
- Dispositions:
  - **ADMIT** — notation supports a concrete curriculum role; still subject to normal intake/licensing/source gates.
  - **HIGH-PRIORITY CANDIDATE** — strong notation fit, but one important question remains.
  - **KEEP CANDIDATE** — useful enough to preserve/revisit.
  - **REJECT FOR THIS ROLE** — not suitable for the named teaching job; may still have another role.

## Reviewed candidates

### A-blues — Blues Riff in C (120 bpm)
CID: `Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi`
Source read: `summary/A-blues/blues-riff-in-c-120-bpm-...txt`

Observed notation:
- 12-bar form.
- Piano harmonic bed with roots in the lower staff and held chordal voicings above.
- Separate written riff part across the form.
- Drumset part.

Disposition: **KEEP CANDIDATE**.
Likely role: blues **MODEL / TRANSFER**, especially the bridge from a stable left-hand/form substrate to a right-hand idea across a complete blues chorus.
Not sufficient for: INDEPENDENCE; accompaniment and riff are supplied.
Follow-up: inspect whether one 2–4 bar lick/excerpt is clean enough for the historical-lick/model job and whether the harmony labeling matches the intended blues teaching language.

### C-jam — St James Infirmary
CID: `Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs`
Source read: `summary/C-jam/st-james-infirmary-...txt`

Observed notation:
- One-staff lead sheet.
- 24 measures.
- Melody plus 41 chord symbols.
- Sparse enough that the learner must supply accompaniment texture.

Disposition: **ADMIT** as a substrate candidate.
Likely role: jam/comping/walking-bass **MODEL / MUSIC substrate**; useful because the notation leaves room for the learner to construct texture rather than imitate a finished piano arrangement.
Caveat: identity is TITLE_ONLY because creator metadata is not definitive; musical-role admission is separate from bibliographic identity confirmation.

### E-latin — La Negra Tiene Tumbao
CID: `QmbYzj8P6PbJ9DwbepDeMSHTVoHyEEMhQRsuTLcqf3bqyd`
Source read: `summary/E-latin/la-negra-tiene-tumbao-...txt`

Observed notation:
- Two-staff piano arrangement.
- 68 measures, 46 chord symbols.
- Long stretches of repeated syncopated chordal/accompaniment figures with coordinated bass motion.
- Texture changes across sections rather than a single isolated loop.

Disposition: **HIGH-PRIORITY CANDIDATE**.
Likely role: Cuban/Latin accompaniment **MODEL / MUSIC**.
Required before style claim: compare the relevant bars to a source-backed definition of tumbao/guajeo/montuno. The score is promising notation evidence, but the title alone does not certify which named pattern a passage demonstrates.

### E-latin — Só Danço Samba
CID: `QmbmC9BRdBLb6XUbyf5TqSy1P1oYdNDYTJoSpd4nXByPMD`
Source read: `summary/E-latin/so-danco-samba-...txt`

Observed notation:
- One-staff lead sheet.
- 34 measures, 25 chord symbols.
- Melody-focused notation; no written two-hand bossa accompaniment pattern.

Disposition: **ADMIT** as an application substrate; **REJECT FOR THIS ROLE** as the source/model that teaches the bossa accompaniment figure.
Likely role: after a bossa accompaniment pattern is sourced and taught, use this as a real Brazilian tune over which the learner applies it.

### I-pop — Billy Joel, She's Always a Woman
CID: `QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn`
Source read: `summary/I-pop/billy-joel-shes-always-a-woman-...txt`

Observed notation:
- Full two-staff piano arrangement.
- 40 measures.
- 129 chord symbols.
- Compound-meter changes/groupings and substantial accompaniment movement.
- Melody/harmony/texture are integrated rather than represented as a bare lead sheet.

Disposition: **HIGH-PRIORITY CANDIDATE**.
Likely role: later chords-pop **MUSIC / arrangement / reduction / accompaniment-decision** work, especially where the learner must preserve harmony and characteristic texture while simplifying.
Not an early acquisition drill.

### J-rock — Muse, Hysteria
CID: `Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf`
Source read: `summary/J-rock/muse-hysteria-...txt`

Observed notation:
- Two-staff piano reduction plus drumset.
- 83 measures.
- Opening preserves a continuous accented sixteenth-note riff in the lower staff.
- Later sections add chords, octave/doubled material, denser texture and sectional contrast.

Disposition: **HIGH-PRIORITY CANDIDATE**.
Likely role: rock **MODEL → MUSIC** chain for riff/ostinato, register/density, reduction decisions, and expansion from a defining riff into a full arrangement.
Follow-up: choose specific excerpt bars for the riff-model job separately from the full-piece/capstone role.

### K-metal — Metallica, Enter Sandman
CID: `QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo`
Source read: `summary/K-metal/enter-sandman-...txt`

Observed notation:
- Full two-staff piano reduction.
- 148 measures.
- Repeated pedal/riff material, staccato attacks, accents, dynamic build and clear sectional development.
- Texture becomes progressively denser and contains material suitable for comparing riff, accompaniment, and full-arrangement treatment.

Disposition: **HIGH-PRIORITY CANDIDATE**.
Likely role: metal **MODEL / TRANSFER** through selected excerpts and later **MUSIC / project** as a full reduction/arrangement target.
Not appropriate as acquisition material in full form.

### F-improv-compose — Down in the Valley
CID: `QmWuBBaf6uwZdiWHx1dm9meAW2tXnw6EV7hb93tnDTy3S4`
Source read: `summary/F-improv-compose/down-in-the-valley-anonymous-...txt`

Observed notation:
- 24 bars in two single-staff piano parts.
- Opening 8-bar material repeats with high transparency.
- A separately labelled refrain follows.
- Melody/harmony relationship is easy to inspect because the parts are exposed.

Disposition: **KEEP CANDIDATE**.
Likely role: composition/improvisation **MODEL / TRANSFER** for phrase repetition, phrase contrast, and harmonising/reharmonising a given melody.
Follow-up: compare with other F-lane structural nominees before choosing the best form example.

### F-improv-compose — A Minuet in G Major
CID: `QmPHf2JSTdnKNosdwGu2hJqisutHgj26kCF3gxmEJF7w86`
Source read: `summary/F-improv-compose/a-minuet-in-g-major-...txt`

Observed notation:
- 32-bar grand-staff piano score.
- Explicit repeats.
- Opening phrase returns at bar 9.
- Contrasting later section.
- Repetition and variation are directly visible in notation.

Disposition: **KEEP CANDIDATE**, likely **ADMIT** once compared with neighboring form candidates.
Likely role: composition/form **MODEL** for phrase return, contrast, repetition/variation, and building a binary-form task from real notation.

### B-jazz — Fly Me to the Moon, piano arrangement
CID: `QmS2enG17nJVrbMvvCcHDW9wAN8nLSV1CPMmtghD7SZFVQ`
Source read: `summary/B-jazz/fly-me-to-the-moon-QmS2en...txt`

Observed notation:
- 22-measure two-staff piano arrangement, 10 chord symbols.
- Melody is written over explicit inner-voice voicings and bass notes rather than as a bare lead sheet.
- Useful examples of harmonized melody, voice motion, and accompaniment reduction are visible.
- The notation does not by itself justify the curriculum's minor-ii–V–i claim; that claim remains separately unverified/contradicted by the earlier review.

Disposition: **KEEP CANDIDATE**.
Likely role: jazz **MODEL** for harmonized melody / voicing / solo-piano reduction; not the preferred substrate for the full jazz cycle and not evidence for a named minor ii–V–i without a separate harmonic check.

### B-jazz — All of Me, trombone + piano
CID: `QmVbSHLuJ2CHRrfS3kHoWHsPGCqtcLTjNdBA5YCgFg7Bpw`
Source read: `summary/B-jazz/all-of-me-QmVbSH...txt`

Observed notation:
- 77 measures, trombone melody/solo part plus grand-staff piano, 62 chord symbols.
- Piano accompaniment is explicit for a long span: steady bass roots with repeated chord voicings, later more active figures.
- The arrangement supplies the comping rather than leaving the learner to create it.

Disposition: **KEEP CANDIDATE**.
Likely role: jazz **MODEL / TRANSFER** for comparing written accompaniment treatment against a melody/solo line; possibly useful for comping reduction or transcription tasks.
Not preferred for the full melody → comp → bass → solo independence cycle because too much of the texture is already supplied.

### B-jazz — Autumn Leaves transcription
CID: `QmeeqT5bwUfEqU9w8ZGXXLgp49DQra1tM23aD85ipXiXXv`
Source read: `summary/B-jazz/autumn-leaves-transcription-Qmeeq...txt`

Observed notation:
- 96-measure one-staff alto-saxophone transcription with 87 chord symbols.
- Long improvised melodic line contains eighth-note motion, triplets, rests, chromatic approaches and phrase-length variation across repeated harmonic form.
- This is not a piano arrangement and not an acquisition score.

Disposition: **HIGH-PRIORITY CANDIDATE** for a different job than the lane's main standard.
Likely role: jazz **MODEL / TRANSFER** for solo transcription, phrase analysis, motif development, chord-tone/approach-note study, and comparing improvised material across chorus-level form.
Required before specific theory claims: analyze selected passages against the printed harmony rather than inferring chord-tone behavior from style/title.

### B-jazz — There Will Never Be Another You, lead sheet
CID: `QmY7mQ3qBC5FhfJpQaqZQzTU4RFzkkDwGaahU5z9BNKrkQ`
Source read: `summary/B-jazz/there-will-never-be-another-you-QmY7...txt`

Observed notation:
- Compact 33-measure lead sheet with 39 chord symbols and a single written melody line.
- Manageable standard length and sparse texture: accompaniment, bass treatment, voicing and solo approach are left for the learner to supply.
- The first large melodic span returns with later variation, giving a stable form for repeated tasks.

Disposition: **ADMIT** as a strong jazz-cycle substrate candidate.
Likely role: full jazz **MODEL / MUSIC / INDEPENDENCE substrate**: melody, shells/comping, two-feel or walking bass, soloing, intro/ending, and a later solo-piano realization can all be different learner tasks over the same chart.
Follow-up: compare its harmonic and technical load with St James Infirmary / Blue Bossa before choosing the earliest full-cycle tune.

### B-jazz — Satin Doll, one-line arrangement/road-map
CID: `QmSC5ngWJnN3RxvpWsh6Xu5Go6QFkFjKVcZmCefFBgnjku`
Source read: `summary/B-jazz/satin-doll-QmSC5...txt`

Observed notation:
- 60 measures, one staff, no chord symbols in the extracted score.
- Contains repeated written lines, key changes, labels for Piano/Bass/Solos, an 8-bar repeated solo section, a bridge, and a return-to-head instruction.
- Many measures in the designated solo/form area contain no written notes.

Disposition: **REJECT FOR THIS ROLE** as the main jazz-cycle teaching chart.
Possible secondary role: **KEEP CANDIDATE** as a form/road-map or trading/solo-space example if the missing harmonic information is intentionally supplied elsewhere.
Reason: without harmony in the score it is weaker than the available lead sheets for comping, bass construction, and harmonic improvisation.

### B-jazz — Blue Bossa, lead sheet
CID: `QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6`
Source read: `summary/B-jazz/blue-bossa-QmTjG...txt`

Observed notation:
- 32-measure one-staff lead sheet with 24 chord symbols.
- Melody is compact and repetitive enough to leave cognitive room for accompaniment/bass tasks.
- Sparse texture makes it suitable for multiple learner realizations rather than copying an arrangement.

Disposition: **ADMIT** as a jazz-cycle substrate candidate.
Likely role: jazz **MODEL / MUSIC / INDEPENDENCE substrate** for melody, comping, bass, soloing and arrangement choices.
Caveat: the title/style does not make this the source for teaching a bossa accompaniment pattern; that pattern still needs an independently sourced definition/model.
Follow-up: inspect the actual harmony labels before claiming any particular minor ii–V–i example.

## Quarry-level unresolved issue

The pass-three identity classifier is still too categorical when an unexpected named creator/artist appears. Performer/transcriber credits or alternate legitimate settings can be classified as MISMATCH even when the title may identify the intended composition. Preserve identity/bibliographic verification as a separate gate from musical-role review; do not treat every current MISMATCH as final until this rule is corrected or manually checked.

## Next review queue

Prioritize candidates that can close learner-facing gaps rather than reading every dumped file equally:

1. B-jazz: compare the newly admitted lead-sheet substrates against After You've Gone and any stronger Autumn Leaves / Fly Me variants; verify harmony only where a specific named progression matters.
2. E-latin: Corcovado / Girl from Ipanema variants / Tico-Tico / tango-Piazzolla candidates, with separate roles for bossa substrate, Cuban pattern model, and Argentine tango/habanera/tango figures.
3. F-improv-compose: remaining top structural nominees for motif, binary/ABA, and harmonising a melody.
4. I-pop: Rocket Man, The Scientist, Hallelujah and other strong full-piano or lead-sheet candidates; compare their usefulness against She's Always a Woman rather than accumulating redundant songs.
5. J-rock/K-metal: Come As You Are, New Born, Starlight, Numb, A Little Piece of Heaven and other structurally distinctive candidates; select excerpts and capstones by teaching job.
6. Then hymns/holiday/ragtime and any quarry lane directly requested by the ability map.

Update this ledger after each notation-review batch.