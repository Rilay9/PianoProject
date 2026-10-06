# Familiar-song pass from the local PDMX archive (2026-10-05)

Lightweight raw material for a human read: sixteen requested titles searched in `PDMX.csv`, the retained editions
unpacked from `mxl.tar.gz` (streamed, never unpacked wholesale), readable event summaries beside the byte-for-byte
inner MusicXML. Nothing here is placed in the curriculum; the loose note is only a first read of the notation.

- `xml/<slug>-<CID>.musicxml` is the inner MusicXML of the archive's `.mxl`, byte for byte.
- `summary/<slug>-<CID>.txt` has the CID, titles, creators, parts and instruments, staff count, metres, bar count,
  chord-symbol count, tempo marks, key signatures, labels and text directions, then event summaries (`summarise_xml.summarise`
  notation: pitch:duration, `+` for chord tones, `~` tie) of the opening 16 bars, 6 to 8 bar windows at each detected
  texture or marked change, a middle sample and the last 8 bars. Parts of 24 bars or fewer are summarised whole. In mixed
  scores only piano and voice parts are windowed; other parts show their opening 8 bars. "Texture change" is detected
  mechanically (the set of rhythm signatures in a 4-bar block differs from the previous block), so it can over- or
  under-report; the labelled boundaries are the reliable ones.
- `run_pass.py` is the driver. It calls `quarry_lanes.brief/pre_key/slugify`, `quarry_core.identity/analyse/mxl_inner_xml`
  and `summarise_xml.summarise`; no new search tool.
- Bar counts are the longest part's measure count. Chord counts are MusicXML `<harmony>` elements (all but four of
  the retained editions have none).
- Method note: the tar was streamed twice, not once: a first pool of 14 candidates per title (111 files), then a
  second stream for the 38 further candidates of the widened pool (60 per title). Both streams wrote only the
  needed members to a scratch cache outside the repository. The 16 retained editions come from that pool.

## Retained editions (16 editions, 12 titles)

| title | CID | shape | bars | chords | why this edition was retained | loose note |
| --- | --- | --- | --- | --- | --- | --- |
| Mad World | QmTYMVjtzV42ztCc4vUBVgXjH1WMdXUhg9JNxxKcJBaW6k | two-staff piano, 4/4, C minor | 45 | 0 | Piano grand staff; identity MATCH (arr. by Robert Blomstereng, artist field Roland Orzabal). Full arrangement: steady eighth-note right hand over quarter-note left-hand chords | repeating-pattern candidate |
| Mad World (simple arrangement) | QmdvVUSSkbAgJHckTLcewoeJrSQm3LrimVTF2YH7tReNwW | two-staff piano, 4/4, F minor | 29 | 0 | Second edition kept because it does a different job: whole-note left hand under a broken-chord right hand, repeat bar and a slower close (tempo 85, then 65); arranger and lyricist credited in the XML | accompaniment candidate |
| Stand By Me | Qmf7ENREU9UngoF2LgRY1ZT9hAGDnCVBBYq8k3NeJUWBNt | voice line + two-staff piano, 4/4, C | 37 | 23 | Lead-sheet job with a real piano part: sung melody, chord symbols (C Am F G), Verse and Chorus labels, D.S. and Fine. Identity resolved by hand: composer field names King, Leiber and Stoller; the artist field wrongly says Charles A. Tindley (the classifier's mismatch is that field) | accompaniment candidate. **HIGH-VALUE**: four-chord pattern, off-beat chord stabs over a rooted bass figure, compact and complete, chords named |
| Stand By Me | Qmdc2i8gxkTUEcxVDUzcYvx1xh1Rim5EoYmU6bdxSVob2o | violin + voice + two-staff piano, 2/2, A | 57 | 20 | Fuller version of the same job (different key, more bars, a violin line): piano part is the same off-beat stabs over a bass figure through the whole score | accompaniment candidate (overlaps the C-major edition; the reviewer may keep only one) |
| Viva La Vida | QmRN6kRXbq7zHjrsF3RvZTJvUykkEAAFHr3irJZAQnFcPs | two-staff piano, 4/4, E-flat major, tempo 140 then 100 | 124 | 0 | The only piano-only edition among 23 hits (the rest are ensembles); arranged by Noé Christiano; starts ff with both staves in bass clef, so first bars read low | full-piece or fun repertoire candidate (notation of the opening is unusual; check clefs) |
| Someone Like You | QmXPbpPc6BkSripAS5CUxqoLiXoaaSrG7w3D3s9Zwzfcm2 | two-staff piano, 4/4 with a 2/4 bar, A | 73 | 101 | Easy piano solo with chord symbols throughout (A C#m F#m D), "Ballad" tempo 67, To Coda and D.S. al Coda; sixteenth-note arpeggio left hand under sustained right-hand chords | arrangement or reduction candidate. **HIGH-VALUE**: clean persisting left-hand arpeggio, chords named, short phrase structure |
| Someone Like You | Qma6LwHnJCfuzWadETqBuPc3ZtCEBfNNxwCSQiTQREJCr2 | voice line + two-staff piano, 4/4 with 2/4 bars, A | 80 | 0 | Same song, different job: the melody sits in a separate voice part and the piano keeps only the accompaniment (broken-chord right hand, whole-note left hand), with section letters A to D, rall. and a tempo | accompaniment candidate |
| Your Song | QmcZnZByDzCDxRpXJfSGsPqDP9reRxzqpwmcxs3HR82kHc | two-staff piano, 4/4, F, tempo 120 | 38 | 0 | "Easy Piano" arrangement (Sadie King); by far the most rated item in this pass (1414 ratings, 4.6) | arrangement or reduction candidate. **HIGH-VALUE**: short, melody over half-note left-hand chords, plainly readable, strongly rated by users |
| Your Song | QmdfyMFpSZmt9TjqXN5JBxUBUZJWWenmsEDfEJEV4o6yc5 | two-staff piano, 4/4, B-flat, tempo 130 | 127 | 0 | Full-length arrangement (rehearsal marks 1 2 C 3 4 C); the CSV subtitle says "accompaniment only", so the right hand may carry a figure rather than the vocal line (the first bars look melodic; check) | full-piece or fun repertoire candidate |
| A Thousand Miles | QmXkRAFeUbpaAc97G5qzTCqXvcVnqQfB7nAnQX1eeiLRkg | two-staff piano, 4/4, B major | 92 | 0 | The only archive edition. Identity resolved by hand (strict classifier said MISMATCH on the artist field "K"; title is exact and the credited line "Words & Music by:" carries no names, so authorship is not confirmed from the file; the sixteenth-note riff and lyric text match the known song). Lyrics sit as text directions | repeating-pattern candidate (the fast right-hand riff returns throughout) |
| Chasing Cars | QmUdnPTDdYJC2SKsMKwRUBV7ixiv3KvqLfEx7wLcxJiQfR | 11-part band score; piano part is one staff, 4/4, A | 77 | 0 | No piano or lead-sheet edition exists; this is a real keyboard part inside a mixed score (rehearsal marks A to I, eleven parts); the piano repeats an A-E eighth-note figure and a few melody bars appear near bar 65 | repeating-pattern candidate (single staff inside a band score, so a reviewer would lift the piano line out) |
| Iris | QmU2FTWY7ZDut9NGytiwBxFpvbKMg7WDQsUi617Sy4ZpuY | two-staff piano, 4/4, D major | 137 | 0 | Piano grand staff, identity MATCH (arranged by Greg Skalak, Goo Goo Dolls); 4.7 average over 60 ratings, about 20 thousand views; strummed-chord pattern with melody on top | full-piece or fun repertoire candidate |
| Creep | QmPmjHdv6GhcNe7h31sNVm1vHKQC8DfteNMyn1jBhpJEch | two-staff piano, 4/4, G | 35 | 0 | Piano grand staff, "CREEP de Radiohead" (arr. S. Hermand); short; sustained chords with quarter-note off-beats under a right-hand melody, tempo 92; 4.7 average over 23 ratings | accompaniment candidate |
| Karma Police | Qmeq6Qkqd2n8fEEdHEZziKY6Nin9osXFxUcvGMYvp3jWDk | two staves, 4/4, A minor | 48 | 105 | The only archive edition: a piano reduction with chord symbols and repeat/ending barlines. The classifier said OTHER only because the MIDI program is 41; the part is named Piano | by-ear candidate. **NOT WORTH FURTHER REVIEW**: right hand in alto clef (C3), the first measure says "Wait for loop to be set", measure numbering restarts oddly (mX1), long runs of repeated quarter-note chords |
| Take Me Home, Country Roads | QmTmhiFsKppNMNycpcjsq2dzzDRMMFGME4zjky17GLerzb | three single-staff unnamed parts (melody, chord stabs, bass), 4/4, G | 61 | 0 | The only piano-like edition among 18 hits; credited John Denver; tempo 160, repeat start and a "To Coda" text with no matching D.S. found; the left-hand chord pattern (D G+chord off-beats) persists to the end | arrangement or reduction candidate (not a grand staff: three separate staves, which a reviewer might merge) |
| Jolene | QmRKShHjy28X7GJW9WCSQa1V8terCiqXzzeQgCNjc2b9Wf | two voices + two-staff piano, 2/4, E major or C# minor | 114 | 0 | The piano part is a full accompaniment of an SSA choir arrangement (piano arranged by Alessio Bianchi); rehearsal labels Intro, Chorus, Verses, Bridge, Chorus, D.S. al Coda; the sixteenth-note riff persists | repeating-pattern candidate (choir score: the voice parts are not needed for a pianist) |

## Titles with no usable edition

Search scope: `PDMX.csv` rows whose `title`, `song_name` or `subtitle` (normalised) contains the title, plus, for the
four below, a second probe over title, subtitle, artist and composer fields for the artist or key words.

- **Let It Be:** 21 rows contain the words "let it be"; none is the Beatles song (hymn tunes "Take my life and let it be",
  "Let it be so", "Let it be now" and similar). No usable edition.
- **Ring of Fire:** 4 rows, all wind, brass or vocal arrangements (violin/clarinet/horn/tuba, saxes and drums, marching
  band, a cappella). No keyboard part. No usable edition.
- **I Walk the Line:** 2 rows, a guitar/bass/electric-guitar score (Johnny Cash credited, 105 chord symbols) and a guitar
  tab. No keyboard part and no piano or lead-sheet staff. No usable edition.
- **Tennessee Whiskey:** no row with that title (also none with "Stapleton" as a song artist; the four "stapleton"
  hits are unrelated hymn and march rows). No edition.

## Other candidates seen and not retained (for the reviewer)

- Mad World: a voice + Klavier edition with 28 chord symbols (QmPfUfL8ojhE...), key C; the 36-bar "Melodica Duet" piano edition (QmWi7d42mYh7...).
- Stand By Me: a 24-bar piano plus bass, ukulele and percussion edition in C (QmaTurv3QtTh...); a 9-bar one-line melody (QmduyZCGvJFQ...); a piano-plus-ensemble 84-bar edition (QmQhEyYbFxaA...) whose "Piano" part carries the melody from bar 20 and is not an accompaniment.
- Viva La Vida: a 100-bar single-staff "Vocals" part (QmXiMAqctnqT...).
- Country Roads: a 48-bar single-line "Recital" melody (QmVw5n9yg9Xb...); a band score with 118 chord symbols (QmT2E2TMDjj...).
- Your Song: an ensemble score with piano and 118 chord symbols (QmfDBnGXEbQt...).
- Jolene: a large-ensemble score with a piano part (QmTW1TyD5F7E...).
- Creep: a two-part Piano + Acoustic Guitar 20-bar item by a user (QmWygWjLcnT9...), melody with chord text, not retained (not the Radiohead credit, user arrangement fragment).
