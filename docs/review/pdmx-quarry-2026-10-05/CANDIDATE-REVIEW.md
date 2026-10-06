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

## Quarry-level unresolved issue

The pass-three identity classifier is still too categorical when an unexpected named creator/artist appears. Performer/transcriber credits or alternate legitimate settings can be classified as MISMATCH even when the title may identify the intended composition. Preserve identity/bibliographic verification as a separate gate from musical-role review; do not treat every current MISMATCH as final until this rule is corrected or manually checked.

## Next review queue

Prioritize candidates that can close learner-facing gaps rather than reading every dumped file equally:

1. B-jazz: strongest standard/lead-sheet candidates, especially those useful for a complete melody → comp → bass → solo cycle and any candidate with a real minor ii–V–i.
2. E-latin: Corcovado / Girl from Ipanema variants / Tico-Tico / tango-Piazzolla candidates, with separate roles for bossa substrate, Cuban pattern model, and Argentine tango/habanera/tango figures.
3. F-improv-compose: remaining top structural nominees for motif, binary/ABA, and harmonising a melody.
4. I-pop: Rocket Man, The Scientist, Hallelujah and other strong full-piano or lead-sheet candidates; compare their usefulness against She's Always a Woman rather than accumulating redundant songs.
5. J-rock/K-metal: Come As You Are, New Born, Starlight, Numb, A Little Piece of Heaven and other structurally distinctive candidates; select excerpts and capstones by teaching job.
6. Then hymns/holiday/ragtime and any quarry lane directly requested by the ability map.

Update this ledger after each notation-review batch.