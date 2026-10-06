# Familiar / motivating song review

Date: 2026-10-05
Branch: `chatgpt/pdmx-dump-2026-10-05`

Purpose: a second-pass catalogue of songs a learner is reasonably likely to recognize. This is intentionally separate from required Fable remediation. Familiarity can make timing, phrasing, ear-checking and motivation easier, but a famous title does not make a score pedagogically useful.

Owner scope: copyright/public-export questions are out of scope. Review only musical identity where needed for correctness, notation content, pedagogical use, and whether the score already appears in the curriculum.

Disposition vocabulary:
- **PROMOTE INTO A LEARNING STATION** — familiar score also cleanly supplies a currently useful musical job.
- **OPTIONAL / SUGGESTED REPERTOIRE** — useful and motivating, but no need to make it a required rung item.
- **ALREADY WELL USED** — current curriculum already gives it a sensible role.
- **REPOSITION / SUGGEST MORE PROMINENTLY** — already present, but familiarity could be used better.
- **REJECT THIS EDITION** — recognizable title, but the quarried file is not useful piano material.
- **PENDING READ** — title/shape is promising but notation not yet inspected enough.

## High-value familiar finds

### Imagine — John Lennon
CID: `QmXAocpmyAT6PCMWzLDkz2c7j8UeafVmZsCg4eLgNKwEN7`
Shape: PIANO_GRAND_STAFF, 35 bars, 4/4.

Notation read:
- bars 1-2 expose the accompaniment immediately: repeated RH chordal figures over simple C/F bass movement;
- verses keep a very legible melody-over-accompaniment relationship;
- later bars simplify the bass to repeated quarter-note roots, making texture change easy to see and hear;
- the arrangement is compact enough to use as a whole piece rather than only a microscopic excerpt.

Disposition: **PROMOTE INTO A LEARNING STATION or OPTIONAL/SUGGESTED REPERTOIRE**, depending on where the ability map still needs a real pop accompaniment/ear-transfer example.
Potential jobs:
- MODEL: recognizable melody over repeated accompaniment;
- TRANSFER: reduce the written texture to melody + bass/chords, then rebuild it;
- ear/by-ear: because the tune is likely familiar, compare what the learner expects against the page;
- MUSIC: full familiar piece without being an enormous capstone.

Do not force it into a rung merely because it is famous; it is especially attractive as an optional familiar transfer piece.

### Vienna — Billy Joel, lead-sheet-style edition
CID: `QmUkekPKGR983LBTg8oK7QYh1rKLkUmUNnKJrMLWRKm4Nx`
Shape: LEADSHEET, 107 bars, 95 chord symbols.

Observed from quarry summary/metadata:
- long single-staff melody with dense harmonic labeling;
- leaves accompaniment texture, bass treatment, voicing and reduction choices to the learner.

Disposition: **PROMOTE INTO A LEARNING STATION candidate** for later chords-pop / accompaniment / arrangement / independence.
Potential jobs:
- MODEL/TRANSFER substrate: play melody from the chart, then supply accompaniment;
- MUSIC/INDEPENDENCE: build a complete personal arrangement from symbols rather than copying a written piano texture.

### Vienna — Billy Joel, fuller piano edition
CID: `QmSyDuL23d8LtVWeGEk1XSTTzbZgSWU4AsEcEmU5A7LjJt`
Shape: two piano parts, including a two-staff piano part, 108 bars.

Notation read:
- substantial melody and harmony material across the full form;
- the fuller piano part supplies finished voicings/accompaniment decisions absent from the lead-sheet edition.

Disposition: **OPTIONAL / SUGGESTED REPERTOIRE** and a particularly good companion to the open Vienna edition.
Best pedagogical use: learner creates an accompaniment/arrangement from the open version first, then compares choices against the fuller realization. Do not reverse that order if the goal is independence.

### No Surprises — Radiohead
CID: `QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M`
Shape: PIANO_GRAND_STAFF, 71 bars, 4/4.

Notation read:
- opens with a highly regular repeating RH broken-chord/ostinato figure over simple bass;
- the repeated figure continues while melody/inner material is layered in;
- later sections alter the bass and texture while preserving recognisable continuity.

Disposition: **PROMOTE INTO A LEARNING STATION candidate** for ostinato/accompaniment continuity and texture-building, or **OPTIONAL/SUGGESTED REPERTOIRE** if that station is already fully supplied.
Potential jobs:
- MODEL: sustain a repeated figure while other material changes;
- TRANSFER: strip to bass + ostinato, then add melody;
- MUSIC: a familiar full piece whose repeating texture gives the learner a stable anchor.

### For Whom the Bell Tolls — Metallica
CID: `Qmecq9RSLpMfuaEajmskZq9ueZGk97qvmdx78JFWNSuiRD`
Shape: mixed 7-part score, 132 bars, including a two-staff Electric Piano part plus guitars, synth, bass and drums.

Notation read so far:
- guitar material very clearly exposes repeated fifth/power-chord attacks and repeated riff structures;
- the Electric Piano part is actually pitched and active (unlike several famous-title drum-only quarry hits), so this is a legitimate keyboard/reduction source;
- full score makes it more suitable for arrangement/reduction/form work than for early acquisition.

Disposition: **OPTIONAL/SUGGESTED REPERTOIRE / advanced reduction candidate**. Keep for a later focused piano-part read before exact placement.
Potential job: decide which guitar/bass/synth identities must survive in a playable keyboard reduction, then compare with the existing electric-piano layer.

## Famous title, bad edition

### Almost Easy — Avenged Sevenfold
CID: `QmSc3G9zSwyGhYXksJCyGQLJBpGfKYC248hC2nTdrySSD6`
Observed: the entire quarried edition is a 198-bar Drumset part.
Disposition: **REJECT THIS EDITION** for piano curriculum. Familiarity does not rescue the wrong musical layer.

### One — Metallica
CID: `Qmc2BawopkxrFy6ekhYKAB8qzukZn4pxFpcefQfQ7X8tP6`
Observed: the entire quarried edition is a Drumset transcription.
Disposition: **REJECT THIS EDITION** for piano curriculum. Could be rhythm-study material only if that need ever exists.

## Familiar material already present in the current curriculum

### Piano Man — Billy Joel
Current status: already in `chords-pop.9`; an earlier PDMX extraction is committed and its tempo behavior was explicitly repaired/reviewed in E57a.
Current lesson role: one of six written arrangements the learner plays, analyzes for chords, then rebuilds as their own arrangement.
Disposition: **ALREADY WELL USED**. This is exactly the sort of familiar advanced arrangement task the optional/familiar pass should preserve.

### Blinding Lights — The Weeknd
Current status: already in `chords-pop.7`.
Known audit result: useful two-staff pop repertoire, but its printed harmony does not prove the rung's sus/add9 vocabulary; the lesson now treats it as a substrate for the learner to add/revoice color rather than evidence that the song already contains it.
Disposition: **ALREADY WELL USED / role corrected**. Good example of keeping a familiar song without lying about what it teaches.

### Clocks — Coldplay
Current status: present in `chords-pop.6` generated ladder/current repertoire options.
Disposition: **ALREADY PRESENT**; before proposing another Coldplay item for the same job, compare whether it adds a genuinely different ability.

### Dancing Queen / Annie's Song / All of Me (easy) / How to Train Your Dragon theme
Current status: already present in `chords-pop.6` repertoire list.
Disposition: **ALREADY PRESENT**. Familiarity coverage is better than the quarry-only view suggested.

## Promising quarry titles still worth notation-reading

These came from the existing mechanical quarry counts or table and are not yet admitted simply because their title matched:

- **Mad World (simple arrangement)** — CID `QmdvVUSSkbAgJHckTLcewoeJrSQm3LrimVTF2YH7tReNwW`; quarry table says PIANO_GRAND_STAFF, 29 bars. **PENDING READ; high priority** because short/familiar/simple is exactly the useful combination.
- **Stand By Me** — 31 raw term hits. Need edition/creator filtering and a piano-usable score read.
- **Let It Be** — 21 raw term hits. Need identity filtering; potentially excellent basic accompaniment/harmony material if a clean edition survives.
- **Viva La Vida** — 23 raw term hits. Need identity/shape filtering; likely useful for repeated progression/accompaniment if a clean edition survives.
- **Someone Like You** — 4 raw term hits. Potential piano-accompaniment/texture model; inspect before claiming.
- **Your Song** — 6 raw term hits. Potential accompaniment/arrangement candidate.
- **Chasing Cars** — 2 raw term hits. Potential repeated-pattern / build candidate.
- **Iris** — 2 raw term hits. Potential texture/arrangement candidate.
- **A Thousand Miles** — 1 raw hit. The quarry's strict creator-field classifier called it MISMATCH because its creator field was literally `Words & Music by:`; that is not enough to reject the composition manually. Recover and inspect this row before discarding it.
- **Creep** — 12 raw term hits; likely familiar but compare against already-strong rock/pop progression material.
- **Karma Police** — 1 hit; potentially useful piano/rock harmony candidate.

## Country / other familiar-song lane

The current fifteen-track curriculum has no dedicated `country` learning track. Do **not** invent one merely to house familiar songs.

If a country song is pedagogically useful, place/suggest it by musical job instead: chord accompaniment and inversions in chords-pop; by-ear/transcription in the ear strand; accompaniment/reharmonization as an optional project; groove/form in the relevant style/application work.

A direct country-title sweep still needs to be run against the owner's local full `PDMX.csv` rather than inferred from repository code search. Useful terms for that local discovery pass include `take me home country roads`, `jolene`, `ring of fire`, `folsom prison blues`, `i walk the line`, `tennessee whiskey`, `the gambler`, `wagon wheel`, `on the road again`, and `friends in low places`. The result should remain a candidate list until the notation is read.

## Product recommendation

Familiar songs should be represented in three ways, not all forced into the rung gate:
1. **Required real transfer** only when the exact score genuinely supplies a missing ability station.
2. **Optional/suggested repertoire** when the song is musically useful and recognition/motivation is the main advantage.
3. **Compare/rebuild projects** where an open chart and a finished arrangement exist for the same familiar song (Vienna is the clearest current example).

This preserves curriculum rigor while exploiting a real pedagogical advantage: the learner can hear timing, phrase shape, wrong notes and harmonic expectation against a tune already in memory.
