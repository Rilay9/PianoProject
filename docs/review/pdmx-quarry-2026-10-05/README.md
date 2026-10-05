# PDMX quarry, pass three (2026-10-05)

Mechanical search and dump. No musical or pedagogical judgement; every figure comes from `PDMX.csv` or from the MusicXML itself. Built by `tools/content/pdmx/quarry_lanes.py` and `quarry_core.py` from `lanes.json`.

## Counts

- Lane entries dumped (a file listed under a lane): 212
- Unique CIDs dumped: 189
- Cross-lane duplicates (same CID listed in more than one lane; the XML is written once, under its first lane): 23
- Dumped XML plus summaries: 84.2 MB

## Matching rules

- Text is normalised (NFKD, accents stripped, lowercase, apostrophes removed, every other non-alphanumeric run becomes one space). A term matches only as a contiguous whole-token sequence: `muse` does not match `museum`, `numb` does not match `number`.
- Term fields: `song_name`, `title`, `subtitle`, `artist_name`, `composer_name`. Genres and tags are never searched.
- Terms in a lane's `exact_title_only_for` match only when `song_name` or `title` equals the term after brackets are stripped and an `Artist - ` or ` - Artist` segment is removed.
- Targets (a title plus expected creator aliases) and known CIDs get an identity verdict: **MATCH** the title is the term (or the term plus only filler words such as piano, cover, tutorial) and an expected creator alias appears in artist, composer or a title segment; **TITLE_ONLY** the title fits but the creator is absent, traditional or an arranger, or the term is only a strict part of a longer title; **MISMATCH** the title does not contain the term, or a named creator (composer or artist; bucket names such as 'Misc tunes', dates, arranger credits and 'Traditional' do not count as named) is present, none of the expected aliases appears anywhere in the row, and that creator is someone else; **NOT_FOUND** the CID is not in the CSV. Generic terms with no creator expectation show `n/a`. A MISMATCH is never dumped.
- Artists (lane L): an alias is a whole-token sequence in `artist_name` or `composer_name`, or equals one ` - ` separated segment of the title or song_name. Distinct songs are grouped by normalised song title with the artist segment removed.
- Shape comes from the XML. `PIANO_GRAND_STAFF`: every part is piano-family (MIDI program 0-7, else a piano-like part name, else the CSV programs) and some part has 2 or more staves. `MULTI_PIANO_PART`: several piano parts, none with 2 or more staves. `MIXED_WITH_PIANO`: a piano part with 2 or more staves plus non-piano parts. `LEADSHEET`: one part, one staff, 8 or more `<harmony>` elements, whatever the instrument (part names are recorded so a saxophone line is visible as one). `PIANO1`: one piano part, one staff, fewer than 8 chord symbols. `OTHER`: anything else.
- Rank: identity (MATCH and n/a before TITLE_ONLY), exact title match, XML inspected, shape (PIANO_GRAND_STAFF = LEADSHEET > MIXED_WITH_PIANO > MULTI_PIANO_PART = PIANO1 > OTHER), chord symbols present, 16-120 bars, Bayesian rating (m=10, archive mean 4.69), views. CSV fields (piano programs, bar count) only order the candidates before inspection; every hard filter uses XML facts.
- XML inspected for: every known CID, the top 15 rows per term by pre-rank (identity, exact match, CSV piano programs, n_ratings, views), the top 40 rows per artist, and every hit of the improv/compose lane. Other hits are listed as `NOT_INSPECTED`.
- Composition label: composers.py + composers.json; `pd` / `in-copyright` / `unknown`. A label only; nothing is filtered on it.
- Dump: every known CID that is not a MISMATCH and not shape OTHER, plus each lane's top distinct songs. Up to 3 editions of one song are kept when they differ materially (different shape class, bars more than 25% apart, or chord-symbol count more than 2x apart); the CSV has no uploader field, so a different arranger or uploader is not tested. XML over 3 MB is skipped and recorded; the limit is 8 MB for known CIDs, creator-confirmed (MATCH) targets in lanes I, J, K, and rows of the priority artists (Avenged Sevenfold, Metallica, Muse); A Little Piece of Heaven is dumped at any size. A CID listed in several lanes is written once.
- Files: `xml/<lane>/<slug>-<CID>.musicxml`, `summary/<lane>/<slug>-<CID>.txt`.


## Lane A-blues

Goal: one clean real twelve-bar chorus (blues.8/9); one 2-4 bar historical lick; one minor/slow-blues transfer piece

### Known CIDs, identity check

| Indexed as | CID | Verdict | Reason | CSV title / song_name | CSV composer / artist | Programs | Parts | Shape | Bars | Chords |
|---|---|---|---|---|---|---|---|---|---|---|
| Joe Turner Blues | QmXbcEgNyEXXfV5SKFQ4rK5eJi3xTtPJQm9kMVgM7GTWVK | **TITLE_ONLY** | no creator named | Joe Turner Blues / Joe Turner Blues |  / Misc tunes | 0 |  | PIANO1 | 26 | 0 |
| Jelly Roll Blues | QmbuoFtkky8Xpo8LSiAqkMXzBs2Mtc33L6GFw1kWv9T5S3 | MATCH | creator alias 'morton' found | The Jelly Roll Blues - Jelly Roll Morton - 1915 / Original Jelly Roll Blues | FERD. MORTON. / Jelly Roll Morton | 0 | Piano | PIANO_GRAND_STAFF | 61 | 0 |
| Farewell Blues | QmStEZqKASQVCFNhKaHLcQm3R3RbDUPKA477NQ6kWsNToy | **TITLE_ONLY** | no creator named | Farewell Blues / Farewell Blues |  / Misc tunes | 0 |  | PIANO1 | 33 | 0 |
| New Orleans Blues | QmbQRktDiVKVCdRwZc7XKQ7gjJxdFRzHwD68nv7AQhtRtM | MATCH | creator alias 'morton' found | New Orleans Blues - Jelly Roll Morton - 1925 / New Orleans Blues | Jelly Roll Morton / Jelly Roll Morton | 0 | Piano | PIANO_GRAND_STAFF | 56 | 0 |
| King Porter Stomp | QmcHsP43Xw6S7NyHPUvczq8xKBWFNWU7RRLzECpSGZ4P65 | **MISMATCH** | the title does not contain the term | Workaday World /  | Arr. King Porter Stomp /  | 9-32-48-48-56-57-60-71 | Clarinet in Bb; Horn in F; Trumpet in Bb; Trombone; Bells; Acoustic Bass; Viola; Violoncello | OTHER | 48 | 0 |
| Shout for Joy | QmadiFaW4tDntpiEiazA5Ec2hyvTNCAdQ1K2Ru4XhDF3Qw | **MISMATCH** | named creator 'A. M. Wortman' is not one of the expected (ammons) | Shout for joy ye holy throng - A. M. Wortman / Shout for joy ye holy throng | A. M. Wortman / A. M. Wortman | 0-0 | ;  | MULTI_PIANO_PART | 20 | 0 |

Hits: 21 rows. Identity verdicts over hits: n/a 21.

### Dumped scores

| CID | Title | Artist / composer | Identity | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | XML bytes | Why / where |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmXbcEgNyEXXfV5SKFQ4rK5eJi3xTtPJQm9kMVgM7GTWVK | Joe Turner Blues | Misc tunes /  | TITLE_ONLY | PIANO1 |  | 2/2 | 26 | 0 | 0.00 (0) | 0 |  | 70467 | known CID Joe Turner Blues (TITLE_ONLY); `xml/A-blues/joe-turner-blues-QmXbcEgNyEXXfV5SKFQ4rK5eJi3xTtPJQm9kMVgM7GTWVK.musicxml` |
| QmbuoFtkky8Xpo8LSiAqkMXzBs2Mtc33L6GFw1kWv9T5S3 | The Jelly Roll Blues - Jelly Roll Morton - 1915 | Jelly Roll Morton / FERD. MORTON. | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 61 | 0 | 0.00 (0) | 0 |  | 482466 | known CID Jelly Roll Blues (MATCH); `xml/A-blues/the-jelly-roll-blues-jelly-roll-morton-1-QmbuoFtkky8Xpo8LSiAqkMXzBs2Mtc33L6GFw1kWv9T5S3.musicxml` |
| QmStEZqKASQVCFNhKaHLcQm3R3RbDUPKA477NQ6kWsNToy | Farewell Blues | Misc tunes /  | TITLE_ONLY | PIANO1 |  | 2/4 | 33 | 0 | 0.00 (0) | 0 |  | 80143 | known CID Farewell Blues (TITLE_ONLY); `xml/A-blues/farewell-blues-QmStEZqKASQVCFNhKaHLcQm3R3RbDUPKA477NQ6kWsNToy.musicxml` |
| QmbQRktDiVKVCdRwZc7XKQ7gjJxdFRzHwD68nv7AQhtRtM | New Orleans Blues - Jelly Roll Morton - 1925 | Jelly Roll Morton / Jelly Roll Morton | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 56 | 0 | 0.00 (0) | 0 |  | 436068 | known CID New Orleans Blues (MATCH); `xml/A-blues/new-orleans-blues-jelly-roll-morton-1925-QmbQRktDiVKVCdRwZc7XKQ7gjJxdFRzHwD68nv7AQhtRtM.musicxml` |
| QmRMcZyoTUeHHZiSkZbUymkaxU45UTAaWTLpaK4bRetiRz | Boogie Woogie | Misc Traditional / Clarence Pinetop Smith (1904-1929) | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 97 | 0 | 4.63 (8) | 6813 | unknown | 945915 | top distinct song #1 (rank 1, identity n/a); `xml/A-blues/boogie-woogie-QmRMcZyoTUeHHZiSkZbUymkaxU45UTAaWTLpaK4bRetiRz.musicxml` |
| Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi | Blues Riff in C (120 bpm) | Lessons - Blues / Daniels Elizabeth Calvin | n/a | PIANO_GRAND_STAFF | Piano; Riff; Drumset | 4/4 | 12 | 0 | 4.87 (5) | 1225 | unknown | 116580 | top distinct song #2 (rank 2, identity n/a); `xml/A-blues/blues-riff-in-c-120-bpm-Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.musicxml` |
| QmduvvF9WYbSxgdNZLWZHwiPmD6Bk4bDg9kvssqRP3pu6h | 12 Bar Blues | Lessons - Blues /  | n/a | PIANO1 | Piano | 4/4 | 11 | 0 | 4.50 (19) | 4200 | unknown | 19776 | song '12 bar blues'; alternate edition kept: shape PIANO1 vs PIANO_GRAND_STAFF; `xml/A-blues/12-bar-blues-QmduvvF9WYbSxgdNZLWZHwiPmD6Bk4bDg9kvssqRP3pu6h.musicxml` |
| Qmc7nrZ28Se5SVgSoRrGFmwTU5Gij48F344eGPRhTu6kwv | Sweet Home Chicago | Robert Johnson / Robert Johnson | n/a | MIXED_WITH_PIANO | Part I; Part II; Part III; Piano | 4/4 | 81 | 0 | 4.68 (19) | 1091 | unknown | 961626 | top distinct song #3 (rank 4, identity n/a); `xml/A-blues/sweet-home-chicago-Qmc7nrZ28Se5SVgSoRrGFmwTU5Gij48F344eGPRhTu6kwv.musicxml` |
| QmXgWdLZyrDFZSLcK23xY8uhh2fN8y2AjuYYdyfUfAzJ2f | Blues in F for bass lesson |  /  | n/a | LEADSHEET | ベース | 4/4 | 36 | 39 | 0.00 (0) | 83 | unknown | 57274 | top distinct song #4 (rank 9, identity n/a); `xml/A-blues/blues-in-f-for-bass-lesson-QmXgWdLZyrDFZSLcK23xY8uhh2fN8y2AjuYYdyfUfAzJ2f.musicxml` |
| QmU7rsQ1UcCDqoY36Xk9qBQk8f6JcZgDFoAx9w96rSNYx3 | Pinetop's Boogie Woogie in F - edited by Tiny Parham | Clarence Pine Top Smith / CLARENCE PINE TOP SMITH | n/a | PIANO_GRAND_STAFF | Piano | 2/2 | 96 | 0 | 4.85 (44) | 12617 | unknown | 777212 | top distinct song #5 (rank 10, identity n/a); `xml/A-blues/pinetops-boogie-woogie-in-f-edited-by-ti-QmU7rsQ1UcCDqoY36Xk9qBQk8f6JcZgDFoAx9w96rSNYx3.musicxml` |
| QmbJaTpRSBaVyquinmmn9W4yHVX4XxZqhNJJz1quQkzjPT | Jeeves' Boogie Woogie | Misc Television / Anne Dudley | n/a | PIANO_GRAND_STAFF | Piano; Piano | 4/4 | 52 | 0 | 4.82 (36) | 1797 | unknown | 784569 | top distinct song #6 (rank 11, identity n/a); `xml/A-blues/jeeves-boogie-woogie-QmbJaTpRSBaVyquinmmn9W4yHVX4XxZqhNJJz1quQkzjPT.musicxml` |


### Next 10 ranked, undumped (MISMATCH excluded)

| Rank | CID | Title | Artist / composer | Identity | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | QmbizGFyvL8ocPFV1J6mD8uCMZF7JtYZa6bVcik8xa7SaS | Simple 12 Bar Blues Duet in E | Lessons - Blues / Stephan Peters | n/a | PIANO_GRAND_STAFF | 4/4 | 15 | 0 | 0.00 (0) | 1140 | unknown | 12 bar blues |
| 6 | QmUAWUDZeKZafF9BADu1aFfmrg1kxRAdKtpCdWMZbAacPr | Boogie Woogie | Misc Traditional /  | n/a | OTHER | 4/4 | 13 | 7 | 4.54 (8) | 2053 | pd | boogie woogie |
| 7 | Qmdc4bb8NsNFoxCU2aFYRL9Ui8WtJDmjkKrtmMdMMxtTDA | SWEET HOME CHICAGO - SOLO Trombone (Lacsap13) | Robert Johnson / Lacsap13 | n/a | OTHER | 4/4 | 24 | 0 | 4.76 (14) | 1262 | unknown | sweet home chicago |
| 8 | QmcJ7d8nt1J5s6zyFLbPT6pF4zfU7UeHWLsRuU1oGtMdUi | 12 Bar Blues in C (Major Triads) | Chuck Berry / Pablo Viva | n/a | OTHER | 12/8 | 12 | 0 | 0.00 (0) | 1255 | unknown | 12 bar blues, blues in c |
| 12 | QmXdsnjidKxwCdsMh3eML6n8nj9UCaAvL6gg31MaRdez5F | Boogie Woogie Bugle Boy | The Andrews Sisters / Arranged by Gavin Small | n/a | PIANO_GRAND_STAFF | 2/2 | 41 | 0 | 4.65 (66) | 18201 | unknown | boogie woogie |
| 13 | QmQhudKTMtqwo5Aovhv7yFdWWYdrhUvs37DZdogKFF3T19 | The Fives Boogie Woogie piano solo | Thomas George and Thomas Hersal / By GEORGE THOMAS and HERSAL THOMAS | n/a | PIANO_GRAND_STAFF | 2/2 | 72 | 0 | 4.64 (85) | 12177 | unknown | boogie woogie |
| 14 | Qma5BTZjeKWfRnG8k1cwGrM9QPzimoGmunm9oxRdd7sEHr | Simple 12 Bar Blues Duet in C |  / Stephan Peters | n/a | PIANO_GRAND_STAFF | 4/4 | 15 | 0 | 0.00 (0) | 862 | unknown | 12 bar blues |
| 15 | QmVQhVB6nRymykU2z36BbeW2PiJv72hASVkPoTVRKYmyim | Sitz Boogie Woogie |  / Hans Poser (1917-1970) | n/a | MIXED_WITH_PIANO | 4/4 | 16 | 20 | 0.00 (0) | 184 | unknown | boogie woogie |
| 16 | QmV9A2WeSzF3pjFFZTPaqP27WSanQah1oE2vAtp5J5b7tT | The Fives - composers' draught of an early boogie woogie piece | Thomas George and Thomas Hersal / MUSIC BY Hersal Thomas and Geo. W. Thomas | n/a | MIXED_WITH_PIANO | 2/2 | 53 | 0 | 4.90 (8) | 3040 | unknown | boogie woogie |
| 17 | QmUHc4f7BmJtT3FKtcRRTBVZbSifB2hBiy92NZybQ9vNqz | Ookami blues in C | andreshk2001 / A.H | n/a | MIXED_WITH_PIANO | 6/8 | 76 | 0 | 0.00 (0) | 227 | unknown | blues in c |

### Identity MISMATCH hits: 0 (none dumped)


### Terms with zero matches for the configured term

twelve bar blues, slow blues, minor blues, blues in g, turnaround blues, stormy monday, key to the highway, every day i have the blues

Hits per term: 12 bar blues=6; twelve bar blues=0; slow blues=0; minor blues=0; blues in c=2; blues in f=1; blues in g=0; turnaround blues=0; boogie woogie=11; sweet home chicago=2; stormy monday=0; key to the highway=0; every day i have the blues=0


## Lane B-jazz

Goal: one standard supporting the full jazz.9 cycle (melody, form, comp, two-feel/walk, solo, intro/ending, solo-piano pass), with chord symbols and a manageable form; flag candidates with an obvious minor ii-V-i

### Known CIDs, identity check

| Indexed as | CID | Verdict | Reason | CSV title / song_name | CSV composer / artist | Programs | Parts | Shape | Bars | Chords |
|---|---|---|---|---|---|---|---|---|---|---|
| After You've Gone | QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU | MATCH | creator alias 'creamer' found | After Youve Gone / after youve gone | CREAMER & LAYTON / Marion Harris | 0 | MusicXML Part | LEADSHEET | 20 | 30 |
| Sweet Georgia Brown | QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5 | MATCH | creator alias 'bernie' found | Beginner version - Sweet Georgia Brown / sweet georgia brown | Beginner version / Ben Bernie | 0 |  | PIANO1 | 33 | 0 |
| Indiana | Qmcy1D9Q8SPEBVa1nqy4TtjYeg8saf7mwC2CxnMpj16T9z | **TITLE_ONLY** | term is only part of a longer title; no creator named | Star of Indiana - Medea's Dance of Vengeance Hornline Transcription (1993) / Misc Tunes |  / Misc tunes | 56-56-56-57-57-57-58-60-60 | B♭ Trumpet 1; B♭ Trumpet 2; B♭ Trumpet 3; F Mellophone 1; F Mellophone 2; Baritone; Euphonium 1; Euphonium 2; Tuba | OTHER | 188 | 0 |
| Honeysuckle Rose | QmSMULfFJDNDH2UyUeNLWgm33MQ9gy2zAfjAXoEALHg7Ds | MATCH | creator alias 'waller' found | Honeysuckle Rose / honeysuckle rose | Fats Waller / Fats Waller | 56-56-56-56-56-56 | B♭ Trumpet; B♭ Trumpet; B♭ Trumpet; B♭ Trumpet; B♭ Trumpet; B♭ Trumpet | OTHER | 144 | 0 |
| Squeeze Me | QmTw3EQxygcbdDsDvKz6zRd2fjCGsvJGhG7C6aAYbCnyq8 | **MISMATCH** | named creator 'in margin-'M.Betham Towsett'' is not one of the expected (waller, williams) | Squeeze me Softly. MBe.25 / Squeeze me Softly. MBe.25 | in margin-'M.Betham Towsett' / Misc tunes | 0 |  | PIANO1 | 12 | 0 |
| Body and Soul | QmYLYgVPrVGkZeZgSjjBDYFUpTBWa8bXTB834ci6L7HQYN | **MISMATCH** | named creator 'John Coltrane' is not one of the expected (green, heyman, sour, eyton) | Body and Soul / body and soul | John Coltrane / Billie Holiday | 66 | Tenor Saxophone | OTHER | 24 | 0 |

Hits: 119 rows. Identity verdicts over hits: MATCH 38, MISMATCH 50, TITLE_ONLY 31.

### Dumped scores

| CID | Title | Artist / composer | Identity | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | XML bytes | Why / where |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU | After Youve Gone | Marion Harris / CREAMER & LAYTON | MATCH | LEADSHEET | MusicXML Part | 4/4 | 20 | 30 | 0.00 (0) | 0 |  | 43569 | known CID After You've Gone (MATCH); `xml/B-jazz/after-youve-gone-QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU.musicxml` |
| QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5 | Beginner version - Sweet Georgia Brown | Ben Bernie / Beginner version | MATCH | PIANO1 |  | 4/4 | 33 | 0 | 0.00 (0) | 0 |  | 48738 | known CID Sweet Georgia Brown (MATCH); `xml/B-jazz/beginner-version-sweet-georgia-brown-QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5.musicxml` |
| QmeeqT5bwUfEqU9w8ZGXXLgp49DQra1tM23aD85ipXiXXv | Autumn Leaves Transcription | Joseph Kosma / Josh Kim | MATCH | LEADSHEET | Alto Saxophone | 4/4 | 96 | 87 | 4.91 (20) | 1853 | unknown | 170104 | top distinct song #1 (rank 1, identity MATCH); `xml/B-jazz/autumn-leaves-transcription-QmeeqT5bwUfEqU9w8ZGXXLgp49DQra1tM23aD85ipXiXXv.musicxml` |
| QmYjsj12FbAhMvLKL2fRdok4XLzGrY7MFFPQLP1Gtj4w4i | Autumn Leaves | Joseph Kosma /  | MATCH | LEADSHEET |  | 4/4 | 18 | 26 | 0.00 (0) | 30 | unknown | 45092 | song 'autumn leaves'; alternate edition kept: bars 18 vs 96 (more than 25% apart); `xml/B-jazz/autumn-leaves-QmYjsj12FbAhMvLKL2fRdok4XLzGrY7MFFPQLP1Gtj4w4i.musicxml` |
| QmR8ycCSt3M7NwcgPCqgZ6woPFg7YCbiyoGR79VFM3zh7v | Autumn Leaves | Joseph Kosma /  | MATCH | LEADSHEET |  | 4/4 | 41 | 41 | 0.00 (0) | 8 | unknown | 55065 | song 'autumn leaves'; alternate edition kept: bars 41 vs 96 (more than 25% apart); `xml/B-jazz/autumn-leaves-QmR8ycCSt3M7NwcgPCqgZ6woPFg7YCbiyoGR79VFM3zh7v.musicxml` |
| QmeRR6uYMPKEGwESKPLQqceqFVpkKVHitRFvMsH62kxdPG | Fly me to the moon | Bart Howard /  | MATCH | LEADSHEET | Tenor Saxophone | 4/4 | 32 | 44 | 4.85 (4) | 25300 | unknown | 52465 | top distinct song #2 (rank 2, identity MATCH); `xml/B-jazz/fly-me-to-the-moon-QmeRR6uYMPKEGwESKPLQqceqFVpkKVHitRFvMsH62kxdPG.musicxml` |
| QmS2enG17nJVrbMvvCcHDW9wAN8nLSV1CPMmtghD7SZFVQ | Fly me to the moon | Bart Howard /  | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 22 | 10 | 0.00 (0) | 7505 | unknown | 89232 | song 'fly me to the moon'; alternate edition kept: shape PIANO_GRAND_STAFF vs LEADSHEET; `xml/B-jazz/fly-me-to-the-moon-QmS2enG17nJVrbMvvCcHDW9wAN8nLSV1CPMmtghD7SZFVQ.musicxml` |
| QmbLMWEPv367xSv1Ep7nQFLnUGXpBeHR4RU94USYT3Pv6A | Fly me to The Moon | Bart Howard / Andrew X. Bo | MATCH | MIXED_WITH_PIANO | Tenor Saxophone; Grand Piano; Acoustic Bass; Vibraphone; Drumset; Congas; Claves | 4/4 | 67 | 0 | 4.87 (5) | 3626 | unknown | 816951 | song 'fly me to the moon'; alternate edition kept: shape MIXED_WITH_PIANO vs LEADSHEET; `xml/B-jazz/fly-me-to-the-moon-QmbLMWEPv367xSv1Ep7nQFLnUGXpBeHR4RU94USYT3Pv6A.musicxml` |
| QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6 | Blue Bossa | Kenny Dorham / Kenny Dorham | MATCH | LEADSHEET | Piano | 4/4 | 32 | 24 | 4.61 (137) | 18881 | unknown | 48918 | top distinct song #3 (rank 7, identity MATCH); `xml/B-jazz/blue-bossa-QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.musicxml` |
| QmW1LrCG2Z7BF7V4UxSt1fDX8MhTSBYmPht74JYMvT6mNm | Blue Bossa | Kenny Dorham /  | MATCH | LEADSHEET | Guitar | 4/4 | 17 | 11 | 4.53 (55) | 7916 | unknown | 22689 | song 'blue bossa'; alternate edition kept: bars 17 vs 32 (more than 25% apart); `xml/B-jazz/blue-bossa-QmW1LrCG2Z7BF7V4UxSt1fDX8MhTSBYmPht74JYMvT6mNm.musicxml` |
| QmSEhWQs6biwJCkU8EidMCmdxd3K4bTPgUAjq9srGdofvY | Blue bossa tnor sax Dexter gordon | Misc Traditional /  | TITLE_ONLY | LEADSHEET | Saxophone Ténor | 4/4 | 194 | 158 | 4.72 (106) | 7234 | pd | 359743 | song 'blue bossa'; alternate edition kept: bars 194 vs 32 (more than 25% apart); `xml/B-jazz/blue-bossa-tnor-sax-dexter-gordon-QmSEhWQs6biwJCkU8EidMCmdxd3K4bTPgUAjq9srGdofvY.musicxml` |
| QmY7mQ3qBC5FhfJpQaqZQzTU4RFzkkDwGaahU5z9BNKrkQ | There Will Never Be Another You | Nat King Cole / Warren / Gordon | MATCH | LEADSHEET | Piano | 4/4 | 33 | 39 | 4.41 (14) | 1490 | unknown | 43728 | top distinct song #4 (rank 10, identity MATCH); `xml/B-jazz/there-will-never-be-another-you-QmY7mQ3qBC5FhfJpQaqZQzTU4RFzkkDwGaahU5z9BNKrkQ.musicxml` |
| QmQnxPJgjZg8RGGDNVZpRd9fCiGCAmSoLNTfFMn6iwmist | There will never be another you solo |  /  | TITLE_ONLY | PIANO1 | Piano | 4/4 | 65 | 0 | 0.00 (0) | 48 | unknown | 128159 | song 'there will never be another you'; alternate edition kept: shape PIANO1 vs LEADSHEET; `xml/B-jazz/there-will-never-be-another-you-solo-QmQnxPJgjZg8RGGDNVZpRd9fCiGCAmSoLNTfFMn6iwmist.musicxml` |
| Qmdye71EVqEvQ24Qy6dPy9J7aP637DYiWJNjsGVBEnCSwS | Satin Doll 1-7-17 | Duke Ellington / by Duke Ellington | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 37 | 0 | 4.77 (19) | 356 | unknown | 141717 | top distinct song #5 (rank 11, identity MATCH); `xml/B-jazz/satin-doll-1-7-17-Qmdye71EVqEvQ24Qy6dPy9J7aP637DYiWJNjsGVBEnCSwS.musicxml` |
| QmSC5ngWJnN3RxvpWsh6Xu5Go6QFkFjKVcZmCefFBgnjku | Satin Doll | Duke Ellington / Duke Ellington | MATCH | PIANO1 | Piano | 4/4 | 60 | 0 | 0.00 (0) | 187 | unknown | 54869 | song 'satin doll'; alternate edition kept: shape PIANO1 vs PIANO_GRAND_STAFF; `xml/B-jazz/satin-doll-QmSC5ngWJnN3RxvpWsh6Xu5Go6QFkFjKVcZmCefFBgnjku.musicxml` |
| QmVbSHLuJ2CHRrfS3kHoWHsPGCqtcLTjNdBA5YCgFg7Bpw | All Of Me | Seymour Simons /  | MATCH | MIXED_WITH_PIANO | Trombone; Piano | 4/4 | 77 | 62 | 4.62 (5) | 1205 | unknown | 335636 | top distinct song #6 (rank 16, identity MATCH); `xml/B-jazz/all-of-me-QmVbSHLuJ2CHRrfS3kHoWHsPGCqtcLTjNdBA5YCgFg7Bpw.musicxml` |
| QmXyzSWWSzrnKnHzKYt74DM3K3yuUr4zw9Gv47g6Qp9kaf | ALL OF ME | All Of Me / Simons & Marks | MATCH | PIANO1 | Piano | 4/4 | 32 | 0 | 0.00 (0) | 23 | unknown | 44438 | song 'all of me'; alternate edition kept: shape PIANO1 vs MIXED_WITH_PIANO; `xml/B-jazz/all-of-me-QmXyzSWWSzrnKnHzKYt74DM3K3yuUr4zw9Gv47g6Qp9kaf.musicxml` |
| Qma4PdEYH5tZRhTy4MBxkFoP4Nk9MM2iTdgEFzHi2nk6Hq | all of me solo |  /  | TITLE_ONLY | LEADSHEET | Piano | 4/4 | 39 | 23 | 0.00 (0) | 16 | unknown | 84193 | song 'all of me'; alternate edition kept: shape LEADSHEET vs MIXED_WITH_PIANO; `xml/B-jazz/all-of-me-solo-Qma4PdEYH5tZRhTy4MBxkFoP4Nk9MM2iTdgEFzHi2nk6Hq.musicxml` |


### Next 10 ranked, undumped (MISMATCH excluded)

| Rank | CID | Title | Artist / composer | Identity | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 6 | QmdbZ8vwUzVP62Ftpjzte19R6froqzqwLrgR9sY36xRxHd | Fly Me to the Moon - Lead Sheet | Bart Howard / Bart Howard | MATCH | LEADSHEET | 4/4 | 38 | 44 | 4.61 (15) | 2308 | unknown | fly me to the moon |
| 9 | Qmeaq2on2PCsqqEjxJt48tPGxyQJfCXCXMc1M9WfMEuCyz | Autumn Leaves Piano Solo - Hank Jones (Somethin' else) | Joseph Kosma /  | MATCH | PIANO_GRAND_STAFF | 4/4 | 33 | 83 | 4.51 (40) | 24064 | unknown | autumn leaves |
| 12 | QmUXmicT5AhuanHKfK5Ao3em68ZyghQGXFAx7WAyUKbeR3 | Autunm Leaves | Joseph Kosma / Johnny Mercer | MATCH | PIANO_GRAND_STAFF | 4/4 | 33 | 0 | 4.70 (7) | 1745 | unknown | autumn leaves |
| 13 | QmNRbUJDm3Cae5nEFY7V8H2ThaqyWdBX5dWPgmLK4gtT1W | Autumn Leaves | Joseph Kosma /  | MATCH | PIANO_GRAND_STAFF | 4/4 | 33 | 0 | 0.00 (0) | 13179 | unknown | autumn leaves |
| 14 | QmXguCjjXe7kPvWWQKcaDKWU4fYS5ruV52NvCnmzezfMKL | Autumn Leaves | Joseph Kosma / Transcribed | MATCH | PIANO_GRAND_STAFF | 4/4 | 32 | 0 | 0.00 (0) | 165 | unknown | autumn leaves |
| 15 | QmSNucnN1cd7T2M4pxXiPBiEofEvFqMsZ5bQC758Prn7nj | Autumn Leaves | Joseph Kosma /  | MATCH | PIANO_GRAND_STAFF | 4/4 | 28 | 0 | 0.00 (0) | 45 | unknown | autumn leaves |
| 18 | QmeKHNBpMDu3geaxeELkgf8ocGVSRvkbMkNSojk7bCr9P5 | Fly Me To The Moon | Bart Howard /  | MATCH | MIXED_WITH_PIANO | 12/8,4/4 | 41 | 0 | 4.72 (15) | 16633 | unknown | fly me to the moon |
| 20 | QmcWwdDwuS6R7iZAGcvsNb5UycCENzoBK6HWtJiqzTVrsN | Softly As In Morning Sunrise | Sigmund Romberg /  | MATCH | PIANO1 | 2/4 | 54 | 0 | 0.00 (0) | 29 | unknown | softly as in a morning sunrise |
| 22 | QmYMpzeVPVzu94hB6kDwCfW7gAcWiNrRumnnd7PWQcRTZD | Autumn Leaves | Joseph Kosma /  | MATCH | PIANO1 | 4/4 | 16 | 0 | 0.00 (0) | 15 | unknown | autumn leaves |
| 23 | QmYaaQ5HTW4ZFtdT9Hzx1zAPNm8SsEfLVxpSXAMnmTYiGF | Autumn Leaves | Joseph Kosma /  | MATCH | PIANO1 | 4/4 | 16 | 0 | 0.00 (0) | 5 | unknown | autumn leaves |

### Identity MISMATCH hits: 50 (none dumped)

- QmYZtFAGnYAzWaUn8jrKHdNQnPBrER1HJQJpeSPXngfFuZ: Cinnamons - Summertime (Ukulele) / Johny Spero for term 'summertime': named creator 'Johny Spero' is not one of the expected (gershwin)
- QmTbLFzrc3BRcoFTEMf5s7nu53AB1KS3YpL3YiP16r9EhJ: There will never be another you - Chet Baker Opening solo / Chet Baker for term 'there will never be another you': named creator 'Chet Baker' is not one of the expected (warren)
- QmZhhR4pHBdVofHP6ETvwD5G8fmv4LVprxxbwshXM9ZV9K: All Of Me - John Legend - Accompaniment / John Legend for term 'all of me': named creator 'John Legend' is not one of the expected (simons, marks)
- QmT2nQ3ssYraG2nRymmL4ySRed6yE2b3JeHUgxbXrAsYsi: Blue Bossa - Improvisation / Composer for term 'blue bossa': named creator 'chamrock' is not one of the expected (dorham)
- QmcQaa3REeKw1cNAYThQhnfsZupEZtMVMNbtjhpLWJoKLA: There Will Never Be Another You Woody Shaw Solo Transcription / Woody Shaw for term 'there will never be another you': named creator 'Woody Shaw' is not one of the expected (warren)
- QmSZudyBJnFK8xUiNE68yDhntiHSQZ5nCQ2L5EWWKb3A5A: All of Me (John Legend) - easy piano / John LegendArranged by Sadie King for term 'all of me': named creator 'John LegendArranged by Sadie King' is not one of the expected (simons, marks)
- QmVUD1YkEV54uE7HxyUGerQj3LgBDQ9e8oYwqhGJMpJbth: All of me / John Legend for term 'all of me': named creator 'John Legend' is not one of the expected (simons, marks)
- QmXVCHa77YaePBAo6DsB6cmJhkwEigmn5fJxywamKqtgih: Fly me to the moon / Composer for term 'fly me to the moon': named creator 'Frank Sinatra' is not one of the expected (howard)
- QmPdhexetyFT998KDpvKAboqMQWnohpHeBZcXw14fxWKrL: All of me-John Legend / John Legend for term 'all of me': named creator 'John Legend' is not one of the expected (simons, marks)
- QmeJk5Z2JQZatDPBt4SKLTYhLYdecG3kgRZZGHKA2Ucj4n: All Of Me - Shortened / John Stephens and Toby Gad for term 'all of me': named creator 'John Stephens and Toby Gad' is not one of the expected (simons, marks)
- ... and 40 more in quarry-results.json

### Terms with zero matches for the configured term

None.

Hits per term: autumn leaves=37; blue bossa=11; all of me=24; fly me to the moon=27; satin doll=2; there will never be another you=5; softly as in a morning sunrise=1; summertime=12; c jam blues=1


## Lane C-jam

Goal: one approachable real tune for comping (jam.5); one with harmony for building a walking bass (jam.6); ideally the same tune for both

### Known CIDs, identity check

| Indexed as | CID | Verdict | Reason | CSV title / song_name | CSV composer / artist | Programs | Parts | Shape | Bars | Chords |
|---|---|---|---|---|---|---|---|---|---|---|
| St James Infirmary | Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs | **TITLE_ONLY** | no creator named | St James Infirmary / st james infirmary | Early 1900's / Misc Traditional | 0 | P1 | LEADSHEET | 24 | 41 |
| Sweet Georgia Brown | QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5 | MATCH | creator alias 'bernie' found | Beginner version - Sweet Georgia Brown / sweet georgia brown | Beginner version / Ben Bernie | 0 |  | PIANO1 | 33 | 0 |
| After You've Gone | QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU | MATCH | creator alias 'creamer' found | After Youve Gone / after youve gone | CREAMER & LAYTON / Marion Harris | 0 | MusicXML Part | LEADSHEET | 20 | 30 |
| Indiana | Qmcy1D9Q8SPEBVa1nqy4TtjYeg8saf7mwC2CxnMpj16T9z | **TITLE_ONLY** | term is only part of a longer title; no creator named | Star of Indiana - Medea's Dance of Vengeance Hornline Transcription (1993) / Misc Tunes |  / Misc tunes | 56-56-56-57-57-57-58-60-60 | B♭ Trumpet 1; B♭ Trumpet 2; B♭ Trumpet 3; F Mellophone 1; F Mellophone 2; Baritone; Euphonium 1; Euphonium 2; Tuba | OTHER | 188 | 0 |

Hits: 10 rows. Identity verdicts over hits: MISMATCH 1, TITLE_ONLY 9.

### Dumped scores

| CID | Title | Artist / composer | Identity | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | XML bytes | Why / where |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs | St James Infirmary | Misc Traditional / Early 1900's | TITLE_ONLY | LEADSHEET | P1 | 4/4 | 24 | 41 | 4.48 (20) | 1926 | unknown | 65244 | known CID St James Infirmary (TITLE_ONLY); `xml/C-jam/st-james-infirmary-Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs.musicxml` |
| QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5 | Beginner version - Sweet Georgia Brown | Ben Bernie / Beginner version | MATCH | PIANO1 |  | 4/4 | 33 | 0 | 0.00 (0) | 0 |  | 48738 | already dumped under B-jazz; `xml/B-jazz/beginner-version-sweet-georgia-brown-QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5.musicxml` |
| QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU | After Youve Gone | Marion Harris / CREAMER & LAYTON | MATCH | LEADSHEET | MusicXML Part | 4/4 | 20 | 30 | 0.00 (0) | 0 |  | 43569 | already dumped under B-jazz; `xml/B-jazz/after-youve-gone-QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU.musicxml` |
| QmdiAvFufLNtrhKpF5Zku9sKGyogYaVY51LBpq3NKjAvnQ | St. James Infirmary | Misc tunes /  | TITLE_ONLY | LEADSHEET |  | 4/4 | 9 | 9 | 0.00 (0) | 37 | unknown | 21153 | song 'st james infirmary' (known CID dumped); alternate edition kept: bars 9 vs 24 (more than 25% apart); `xml/C-jam/st-james-infirmary-QmdiAvFufLNtrhKpF5Zku9sKGyogYaVY51LBpq3NKjAvnQ.musicxml` |
| QmPTYpb73P5ZJzXgwzg1sJAcAUxCosMCjnjRQxZk7d398y | Saint James Infirmary | Misc tunes /  | TITLE_ONLY | LEADSHEET |  | 4/4 | 9 | 9 | 0.00 (0) | 57 | unknown | 56600 | top distinct song #1 (rank 2, identity TITLE_ONLY); `xml/C-jam/saint-james-infirmary-QmPTYpb73P5ZJzXgwzg1sJAcAUxCosMCjnjRQxZk7d398y.musicxml` |


### Next 10 ranked, undumped (MISMATCH excluded)

| Rank | CID | Title | Artist / composer | Identity | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 | QmdidJSEF2SuazxAvfCQY5hQ8CYeq3YwJqegkiSuFwzTK1 | Saint James Infirmary | Misc tunes /  | TITLE_ONLY | LEADSHEET | 4/4 | 9 | 9 | 0.00 (0) | 30 | unknown | saint james infirmary |
| 5 | QmPrpKNjHggz6sJ6ZRJynufigLMEDQ4y9kLgjeCUAC2PGf | St. James Infirmary | Misc tunes /  | TITLE_ONLY | LEADSHEET | 4/4 | 9 | 9 | 0.00 (0) | 26 | unknown | st james infirmary |
| 6 | QmdtQmoNyrxTfzxtSnRVmu5FjD6k1yakXK1ajsJZn6QGJ8 | Saint James Infirmary | Misc tunes /  | TITLE_ONLY | LEADSHEET | 4/4 | 9 | 9 | 4.33 (3) | 100 | unknown | saint james infirmary |
| 7 | QmexB7VLYouFHZ9nVFXSXjUb7L2c373Ve8apuLVs5GgMxc | Saint James Infirmary Blues | Misc Traditional / anon. | TITLE_ONLY | LEADSHEET | 4/4 | 9 | 12 | 0.00 (0) | 133 | pd | saint james infirmary |
| 8 | QmYfWu2qDzVXYsA41GiGuDfa8uHw8q7o1NVtwbFhhzesnW | Saint James Infirmary Blues | Misc Traditional / anon. | TITLE_ONLY | LEADSHEET | 4/4 | 9 | 12 | 0.00 (0) | 35 | pd | saint james infirmary |
| 9 | QmPtCnJbbAbfGs69fvmfwZgQTf9MuknNHUtBYQjMaPuGav | Saint James Infirmary Blues | Misc Traditional / anon. | TITLE_ONLY | LEADSHEET | 4/4 | 9 | 12 | 0.00 (0) | 24 | pd | saint james infirmary |

### Identity MISMATCH hits: 1 (none dumped)

- Qma4qTbzHn5Hg79cpmeYzAu87uXyd3H3cusgu2kK9tCrQW: Saint James Infirmary Blues / Paroles et Musique: Clarence and Spencer Williams Arrangement Jean-Paul FINCK for term 'saint james infirmary': named creator 'Paroles et Musique: Clarence and Spencer Williams Arrangement Jean-Paul FINCK' is not one of the expected (primrose, mills, traditional)

### Terms with zero matches for the configured term

None.

Hits per term: st james infirmary=3; saint james infirmary=7


## Lane D-hymns

Goal: a correct Joyful, Joyful replacement; stronger four-part/arrangement models

### Known CIDs, identity check

| Indexed as | CID | Verdict | Reason | CSV title / song_name | CSV composer / artist | Programs | Parts | Shape | Bars | Chords |
|---|---|---|---|---|---|---|---|---|---|---|
| Joyful, Joyful (archive lead) | QmY8XeRQK9L3q6Rndkex64R2N5X4LGiQ9CA6qG7U61YyE7 | **TITLE_ONLY** | term is only part of a longer title; creator alias 'beethoven' found | Ludwig Van Beethoven - Joyful Joyful We Adore Thee / Joyful joyful we adore Thee | Ludwig Van Beethoven / Ludwig van Beethoven | 0 |  | PIANO1 | 16 | 0 |
| Holy Holy Holy | QmbLfyErVgweCgsLYtW4CV2GvCwayZjJDqtLpccRmvCgdF | **MISMATCH** | named creator 'Holy holy holy- W. H. Monk' is not one of the expected (dykes, heber) | Holy holy holy - William Henry Monk / Holy holy holy | Holy holy holy- W. H. Monk / William Henry Monk | 19-73-73-73-73 | Soprano; Alto; Tenor; Bass; Acc. | OTHER | 25 | 0 |
| Nearer My God to Thee | QmbFPMXf26skEX8RvUSZ5dGSuFXefEwFJ7GXiCfgjS6q2o | MATCH | creator alias 'dykes' found | Nearer my God to thee - John Bacchus Dykes / Nearer my God to thee |  / John Bacchus Dykes | 73-73 | Midi_74; Midi_74 | OTHER | 14 | 0 |
| Deep River | QmbP96wZt5Vev9pA8pembvkaMw2wx48M3PR3pWNMfJuASp | MATCH | creator alias 'spiritual' found | Deep river - African-American spiritual. / Deep River | African-American Spiritual / Misc Traditional | 0-0 | ;  | MULTI_PIANO_PART | 20 | 0 |
| Steal Away | QmcrnJ2b9XrAey8CPrVRj5xn55Tvy4dfZe1aFr6FVTHBBs | **TITLE_ONLY** | term is only part of a longer title; creator alias 'spiritual' found | Steal away to jesus - African-American spiritual. / Steal away to jesus | African-American Spiritual / African-American Spiritual | 0-0 | ;  | MULTI_PIANO_PART | 16 | 0 |

Hits: 130 rows. Identity verdicts over hits: MATCH 42, MISMATCH 42, TITLE_ONLY 46.

### Dumped scores

| CID | Title | Artist / composer | Identity | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | XML bytes | Why / where |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmY8XeRQK9L3q6Rndkex64R2N5X4LGiQ9CA6qG7U61YyE7 | Ludwig Van Beethoven - Joyful Joyful We Adore Thee | Ludwig van Beethoven / Ludwig Van Beethoven | TITLE_ONLY | PIANO1 |  | 4/4 | 16 | 0 | 0.00 (0) | 13 | pd | 41017 | known CID Joyful, Joyful (archive lead) (TITLE_ONLY); `xml/D-hymns/ludwig-van-beethoven-joyful-joyful-we-ad-QmY8XeRQK9L3q6Rndkex64R2N5X4LGiQ9CA6qG7U61YyE7.musicxml` |
| QmbP96wZt5Vev9pA8pembvkaMw2wx48M3PR3pWNMfJuASp | Deep river - African-American spiritual. | Misc Traditional / African-American Spiritual | MATCH | MULTI_PIANO_PART | ;  | 4/4 | 20 | 0 | 4.20 (12) | 460 | pd | 111604 | known CID Deep River (MATCH); `xml/D-hymns/deep-river-african-american-spiritual-QmbP96wZt5Vev9pA8pembvkaMw2wx48M3PR3pWNMfJuASp.musicxml` |
| QmcrnJ2b9XrAey8CPrVRj5xn55Tvy4dfZe1aFr6FVTHBBs | Steal away to jesus - African-American spiritual. | African-American Spiritual / African-American Spiritual | TITLE_ONLY | MULTI_PIANO_PART | ;  | 4/4 | 16 | 0 | 4.61 (10) | 206 | pd | 91011 | known CID Steal Away (TITLE_ONLY); `xml/D-hymns/steal-away-to-jesus-african-american-spi-QmcrnJ2b9XrAey8CPrVRj5xn55Tvy4dfZe1aFr6FVTHBBs.musicxml` |
| QmXWBURe48nbNXaFgz4Fhuv3p43nvqukyGufkYujjmFoCZ | Ode To Joy | Ludwig van Beethoven /  | MATCH | LEADSHEET |  | 4/4 | 16 | 24 | 0.00 (0) | 13 | pd | 25414 | top distinct song #1 (rank 1, identity MATCH); `xml/D-hymns/ode-to-joy-QmXWBURe48nbNXaFgz4Fhuv3p43nvqukyGufkYujjmFoCZ.musicxml` |
| QmejAvfGAAdj9ZNpU76p7BCpSvxnzSdW2RwfhxbB2mQzZF | Ode to Joy | Ludwig van Beethoven / Beethoven/arr. by Kraynak | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 34 | 0 | 0.00 (0) | 11 | pd | 25963 | song 'ode to joy'; alternate edition kept: shape PIANO_GRAND_STAFF vs LEADSHEET; `xml/D-hymns/ode-to-joy-QmejAvfGAAdj9ZNpU76p7BCpSvxnzSdW2RwfhxbB2mQzZF.musicxml` |
| QmSsj7o5AWXjdDAgKkXpohjam3ZRYZhcteQXNBw6vsex7s | Ode to Joy (for orchestra) | Ludwig van Beethoven / Tommy Thomson | MATCH | MIXED_WITH_PIANO | Piccolo; Flute; Oboe; Bassoon; C Trumpet; Trombone; Tuba; Timpani; Snare Drum; Cymbal; Piano; Violin; Viola; Violoncello; Double Bass | 4/4 | 52 | 0 | 4.72 (136) | 19086 | unknown | 830011 | song 'ode to joy'; alternate edition kept: shape MIXED_WITH_PIANO vs LEADSHEET; `xml/D-hymns/ode-to-joy-for-orchestra-QmSsj7o5AWXjdDAgKkXpohjam3ZRYZhcteQXNBw6vsex7s.musicxml` |
| QmQoPSv4kUm2wgZE4jtrsCgPHu3u6GMG9mnEzxhqKxE46z | Nearer My God to Thee - Sarah Flower Adams | Sarah Flower Adams /  | MATCH | PIANO_GRAND_STAFF | Grand Piano, Piano; Grand Piano, Piano | 4/4 | 16 | 0 | 0.00 (0) | 50 | unknown | 73957 | top distinct song #2 (rank 2, identity MATCH); `xml/D-hymns/nearer-my-god-to-thee-sarah-flower-adams-QmQoPSv4kUm2wgZE4jtrsCgPHu3u6GMG9mnEzxhqKxE46z.musicxml` |
| QmQVNEqW4vw38TNZ1ogyn7JqgTCZWzPZTHvYg6sZDYmStN | Nearer my god to thee - Arthur S. Sullivan | Arthur S. Sullivan / Arthur Seymour Sullivan 1872 | MATCH | MULTI_PIANO_PART | ;  | 4/4 | 16 | 0 | 0.00 (0) | 137 | unknown | 53777 | song 'nearer my god to thee'; alternate edition kept: shape MULTI_PIANO_PART vs PIANO_GRAND_STAFF; `xml/D-hymns/nearer-my-god-to-thee-arthur-s-sullivan-QmQVNEqW4vw38TNZ1ogyn7JqgTCZWzPZTHvYg6sZDYmStN.musicxml` |
| QmWyFckvyoMiNLFawUiRMTeH2USzFHijjt8TdEWbTRDQ7N | Holy holy holy - John B. Dykes | John B. Dykes / John Bacchus Dykes 1861 | MATCH | MULTI_PIANO_PART | ;  | 4/4 | 16 | 0 | 4.11 (6) | 135 | unknown | 98783 | top distinct song #3 (rank 19, identity MATCH); `xml/D-hymns/holy-holy-holy-john-b-dykes-QmWyFckvyoMiNLFawUiRMTeH2USzFHijjt8TdEWbTRDQ7N.musicxml` |
| QmTPmBvCqSrpJTdr87B77a5yprLJM1L6p2yUfmpoBSJW43 | Holy Holy Holy | John B. Dykes and Camp Kirkland / william | TITLE_ONLY | PIANO_GRAND_STAFF | Piano | 4/4 | 16 | 0 | 0.00 (0) | 43 | unknown | 53713 | song 'holy holy holy'; alternate edition kept: shape PIANO_GRAND_STAFF vs MULTI_PIANO_PART; `xml/D-hymns/holy-holy-holy-QmTPmBvCqSrpJTdr87B77a5yprLJM1L6p2yUfmpoBSJW43.musicxml` |
| QmcodnT6QU8nyDU29s77ipj1GoRgZCMiuzsLD365sqFnfY | Santo_Santo_Santo_Señor_omnipotente_-_Reginald_Heber | Reginald Heber /  | TITLE_ONLY | PIANO_GRAND_STAFF | Grand Piano, Piano; Grand Piano, Piano | 4/4 | 80 | 0 | 0.00 (0) | 35 | unknown | 397710 | song 'holy holy holy'; alternate edition kept: shape PIANO_GRAND_STAFF vs MULTI_PIANO_PART; `xml/D-hymns/santo-santo-santo-senor-omnipotente-regi-QmcodnT6QU8nyDU29s77ipj1GoRgZCMiuzsLD365sqFnfY.musicxml` |
| QmfDdMdSXX2GPW1e818VR5AsLU31JbKxErc5FxR24qivgo | Deep River and Swing Low Sweet Chariot Solos Only | pathouser / Arr. by P.G. Houser | TITLE_ONLY | MIXED_WITH_PIANO | Solo 1; Tenor; Piano | 4/4,5/4 | 65 | 0 | 0.00 (0) | 124 | unknown | 438165 | song 'deep river' (known CID dumped); alternate edition kept: shape MIXED_WITH_PIANO vs MULTI_PIANO_PART; `xml/D-hymns/deep-river-and-swing-low-sweet-chariot-s-QmfDdMdSXX2GPW1e818VR5AsLU31JbKxErc5FxR24qivgo.musicxml` |
| Qmd743N6JTPToRbYipMFyadJVZbbzdLVVgT2cy6eYJU2V4 | Steal Away - Seconds CYMRU | Misc Traditional /  | TITLE_ONLY | PIANO1 |  | 6/8 | 9 | 0 | 0.00 (0) | 13 | pd | 18115 | song 'steal away' (known CID dumped); alternate edition kept: shape PIANO1 vs MULTI_PIANO_PART; `xml/D-hymns/steal-away-seconds-cymru-Qmd743N6JTPToRbYipMFyadJVZbbzdLVVgT2cy6eYJU2V4.musicxml` |
| QmUFbAMfeBjxwNVwzfZxgYXR3cWv7424KN19uKNTqQad2K | Beethoven - Symphony No. 9 in D Minor Op. 125 4th Movement | Ludwig van Beethoven / Vincent | TITLE_ONLY | PIANO_GRAND_STAFF | Piano | 6/8 | 74 | 0 | 4.83 (3) | 401 | unknown | 359348 | song 'joyful joyful' (known CID dumped); alternate edition kept: shape PIANO_GRAND_STAFF vs PIANO1; `xml/D-hymns/beethoven-symphony-no-9-in-d-minor-op-12-QmUFbAMfeBjxwNVwzfZxgYXR3cWv7424KN19uKNTqQad2K.musicxml` |
| QmZwo2Muh2rip4gGET7fkkXFgaLQiK6kc6p89ssZbqysxB | Joyful joyful we adore thee | Ludwig van Beethoven /  | TITLE_ONLY | PIANO_GRAND_STAFF | Piano | 2/2 | 16 | 0 | 4.61 (54) | 3592 | pd | 131580 | song 'joyful joyful' (known CID dumped); alternate edition kept: shape PIANO_GRAND_STAFF vs PIANO1; `xml/D-hymns/joyful-joyful-we-adore-thee-QmZwo2Muh2rip4gGET7fkkXFgaLQiK6kc6p89ssZbqysxB.musicxml` |

- NOT dumped: QmZGmZScC2FyW6qT7XwoJf5XKA61r9YQZWKgNkk6y4RZJY (song 'nearer my god to thee'; alternate edition kept: shape MIXED_WITH_PIANO vs PIANO_GRAND_STAFF): no XML available
- NOT dumped: QmVUbXdavJDNpPBrmmtJDaWUU28Nu6UmMv5V265cbS6am6 (song 'nearer my god to thee'; alternate edition kept: shape PIANO1 vs PIANO_GRAND_STAFF): no XML available

### Next 10 ranked, undumped (MISMATCH excluded)

| Rank | CID | Title | Artist / composer | Identity | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | QmQJGEQWpnEB5GMHJTL4nVW7JVbhXnsJxZZWuJeVsLdUF9 | Nearer My God to Thee | Sarah Flower Adams /  | MATCH | PIANO_GRAND_STAFF | 2/2 | 16 | 0 | 0.00 (0) | 21 | unknown | nearer my god to thee |
| 6 | QmX5aJm5bL1oSuTADYETZoyMCA75h4PWeoa9R3kNMAZDsf | Ode To Joy | Ludwig van Beethoven /  | MATCH | MIXED_WITH_PIANO | 4/4 | 92 | 0 | 0.00 (0) | 81 | pd | joyful joyful, joyful we adore thee, ode to joy |
| 8 | QmRWs1XmcTTZ2JgkWaXqcUAWHdTPiLEPZFgwRJaAJQphtA | Nearer my god to thee - Lowell Mason | Lowell Mason / Lowell Mason 1856 | MATCH | MULTI_PIANO_PART | 4/4 | 16 | 0 | 0.00 (0) | 57 | pd | nearer my god to thee |
| 9 | QmWJXuGQZr1NJBx4fRPFav7acaemB8heDJ3x8r6dnEYG3L | Ode To Joy | Ludwig van Beethoven / Composer | MATCH | PIANO1 | 4/4 | 32 | 0 | 0.00 (0) | 30 | unknown | ode to joy |
| 10 | Qmf4jgyoELMmJDL6uH9cnFgfnKfdoLeLg85y4fu1cBWpcn | Ludvig Von Beethoven - ODE TO JOY | Ludwig van Beethoven / Ludvig Von Beethoven | MATCH | PIANO1 | 4/4 | 35 | 0 | 0.00 (0) | 20 | pd | ode to joy |
| 11 | QmXtfq2agBq19WvKoEbfL8b5CBadUoDfbn7yEBWBJrEEkQ | Nearer my god to thee - Bethany (Mason) Lowell Mason | Lowell Mason / Composer unknown | MATCH | MULTI_PIANO_PART |  | 16 | 0 | 0.00 (0) | 14 | unknown | nearer my god to thee |
| 12 | QmQ9epma2TQZY8SznSFWKadqcdwZb1yamGEifcroPAUQ6M | Music by Lowell Mason - Nearer My God to Thee | Lowell Mason / Music by Lowell Mason 1856Lyrics by Sarah F. Adams 1841 | MATCH | MULTI_PIANO_PART | 4/4 | 16 | 0 | 0.00 (0) | 12 | pd | nearer my god to thee |
| 13 | QmTJHYoSJXmdjpHaLsLkYAi8ykEwt42TeBB6DZQRNuHq8j | Ode to Joy | Ludwig van Beethoven / L. Van Beethoven | MATCH | PIANO1 | 4/4 | 16 | 0 | 0.00 (0) | 11 | pd | ode to joy |
| 14 | QmYiBRskHzU4ZidFUiuihRZ6fbtnCvxFVszvn3ym5cT1Pj | Ode to Joy | Ludwig van Beethoven / Ludwig van Beethoven (Schiller) | MATCH | PIANO1 | 4/4 | 16 | 0 | 0.00 (0) | 11 | pd | ode to joy |
| 15 | QmbQU5prRvrgjHpRKKBv1kLoJ5YvevjdympbzTKLUjjJz5 | Ode to Joy | Ludwig van Beethoven / Ludwig van Beethoven (Schiller) | MATCH | PIANO1 | 4/4 | 16 | 0 | 0.00 (0) | 10 | pd | ode to joy |

### Identity MISMATCH hits: 42 (none dumped)

- QmddkzK9gSWChZ96o19vmW1QrcZNwDGFMrSWJ6odMCiwRR: Holy holy holy (Sweney) - B. Hillyard Sweney / B. Hillyard Sweney for term 'holy holy holy': named creator 'B. Hillyard Sweney' is not one of the expected (dykes, heber)
- QmerFnmjpuczs9wwDoTng8kEh7aswM29Jr5m3BV57aPj4K: Holy holy holy - Alfred Stone / Alfred Stone 1863 for term 'holy holy holy': named creator 'Alfred Stone 1863' is not one of the expected (dykes, heber)
- QmVhPU59vZdU9M92Jnt7jsKTS7zwttSJYLRt4tctbGHJKD: Deep River / IrregularDEEP RIVERwww.hymnary.org/text/deep_river_my_home_is_over_jordan for term 'deep river': named creator 'IrregularDEEP RIVERwww.hymnary.org/text/deep_river_my_home_is_over_jordan' is not one of the expected (traditional, spiritual, burleigh)
- QmfFRyKLV44wFdUHuwaofnF3omigj7m81KYtbB1WeLGJfT: Holy Holy Holy / Roy Hoobler for term 'holy holy holy': named creator 'Roy Hoobler' is not one of the expected (dykes, heber)
- QmQWz8AaPbjcPfx1j76bFG9a94DPzyqoXnr8Cddxp6R8Ar: Holy holy holy - Joseph Barnby / Holy holy holy - Barnby for term 'holy holy holy': named creator 'Holy holy holy - Barnby' is not one of the expected (dykes, heber)
- QmbLfyErVgweCgsLYtW4CV2GvCwayZjJDqtLpccRmvCgdF: Holy holy holy - William Henry Monk / Holy holy holy- W. H. Monk for term 'holy holy holy': named creator 'Holy holy holy- W. H. Monk' is not one of the expected (dykes, heber)
- QmeywSZw9P4ArV1iVnVWQwLE5Qg6Dn4tYCHAitw25jHKVN: Nearer my God to Thee / PauloGlock for term 'nearer my god to thee': named creator 'PauloGlock' is not one of the expected (mason, adams, dykes, sullivan)
- QmdhqzxXBFjiUrnP8r9AvxK2ojRiToURYTky6tMBCT2Qa3: Nearer My God to Thee / Lowell Masonarr. James Horner for term 'nearer my god to thee': named creator 'Lowell Masonarr. James Horner' is not one of the expected (mason, adams, dykes, sullivan)
- QmUTU4ySdRqCXpD9spnf9d42tw93xuAors8Z6ctwkRFV8p: Nearer My God to Thee / Bethany for term 'nearer my god to thee': named creator 'Bethany' is not one of the expected (mason, adams, dykes, sullivan)
- QmWfMSHMRHhCPYgsm791gWd7Pe6HGPPb1qX9TSyWFFdcYL: Nearer My God to Thee / Arreglo: Juan Antonio Morillo for term 'nearer my god to thee': named creator 'Arreglo: Juan Antonio Morillo' is not one of the expected (mason, adams, dykes, sullivan)
- ... and 32 more in quarry-results.json

### Terms with zero matches for the configured term

None.

Hits per term: joyful joyful=14; joyful we adore thee=12; hymn to joy=3; ode to joy=32; holy holy holy=36; nearer my god to thee=37; deep river=7; steal away=5


## Lane E-latin

Goal: a score that really shows a bossa accompaniment; a real montuno/guajeo/tumbao model; more modern tango around Libertango

### Known CIDs, identity check

| Indexed as | CID | Verdict | Reason | CSV title / song_name | CSV composer / artist | Programs | Parts | Shape | Bars | Chords |
|---|---|---|---|---|---|---|---|---|---|---|
| Tico-Tico | QmWbvFZYw6cR7ytP7V2SyZm2u6VMGCD31cBnNuWwMoqFLw | **TITLE_ONLY** | no creator named | Tico Tico / Tico Tico |  / Misc tunes | 0 |  | LEADSHEET | 51 | 48 |
| So Danco Samba | QmbmC9BRdBLb6XUbyf5TqSy1P1oYdNDYTJoSpd4nXByPMD | MATCH | creator alias 'jobim' found | Só Danço Samba / so danco samba | Antonio Carlos Jobim / Antônio Carlos Jobim | 0 | Piano | LEADSHEET | 34 | 25 |
| Chega de Saudade | Qmcnc6BPWUhP1fk6GKoXEH35gSvJNi87bKz4cy5s6xuYTV | MATCH | creator alias 'jobim' found | Chega de Saudade / chega de saudade | Tom jobim e Vinicius de Moraes / Antônio Carlos Jobim | 71 | BaccidentalFlat Clarinet | OTHER | 76 | 0 |
| Girl from Ipanema | QmbePogksNuacefKjPnFMTEPad7EfR6ugFNirGLLckffJr | MATCH | creator alias 'jobim' found | The Girl from Ipanema / the girl from ipanema |  / Antônio Carlos Jobim | 56-65-71-73 | Flauta; Clarinete en Si♭; Saxofón contralto; Trompeta en Si♭ | OTHER | 44 | 0 |
| Corcovado | QmWYgg7QifpX4XtkYReco3Psk4GvNgzbeZMeqTBUvabUgF | **TITLE_ONLY** | no creator named | corcovado /  |  /  | 0 | Piano | LEADSHEET | 36 | 31 |
| Jalousie | QmbEXBfVDk9iNqKRoXudwgcVKFL9yagDcFvwqAwvLt5h5H | **TITLE_ONLY** | term is only part of a longer title; no creator named | Bezeichnung standardisiert: La Jalousie; / Bezeichnung standardisiert: La Jalousie; | Urheber unbekannt 1720 belegt / Misc tunes | 0 |  | PIANO1 | 18 | 0 |
| Por Una Cabeza | QmPqGm73syTAnvaFSwHWB5nTi3KEMybjqMYRVRox2eejWb | MATCH | creator alias 'gardel' found | Por Una Cabeza (String Quartet) / por una cabeza | Carlos GardelArranged by Michael Tan / Carlos Gardel | 40-40-41-42 | Violin; Violin; Viola; Violoncello | OTHER | 65 | 0 |
| Caminito | QmWPVaLZLid7D3fiNRhaKPxH36zWf2Pu3JLFxxQYFRRwDV | MATCH | creator alias 'filiberto' found | Caminito / Caminito |  / Misc Traditional | 21-23-40 | Ténor; Ténor; Basse | OTHER | 71 | 0 |

Hits: 93 rows. Identity verdicts over hits: MATCH 26, MISMATCH 8, TITLE_ONLY 27, n/a 32.

### Dumped scores

| CID | Title | Artist / composer | Identity | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | XML bytes | Why / where |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmWbvFZYw6cR7ytP7V2SyZm2u6VMGCD31cBnNuWwMoqFLw | Tico Tico | Misc tunes /  | TITLE_ONLY | LEADSHEET |  | 4/4 | 51 | 48 | 0.00 (0) | 33 | unknown | 124706 | known CID Tico-Tico (TITLE_ONLY); `xml/E-latin/tico-tico-QmWbvFZYw6cR7ytP7V2SyZm2u6VMGCD31cBnNuWwMoqFLw.musicxml` |
| QmbmC9BRdBLb6XUbyf5TqSy1P1oYdNDYTJoSpd4nXByPMD | Só Danço Samba | Antônio Carlos Jobim / Antonio Carlos Jobim | MATCH | LEADSHEET | Piano | 4/4 | 34 | 25 | 4.72 (47) | 3788 | unknown | 67344 | known CID So Danco Samba (MATCH); `xml/E-latin/so-danco-samba-QmbmC9BRdBLb6XUbyf5TqSy1P1oYdNDYTJoSpd4nXByPMD.musicxml` |
| QmWYgg7QifpX4XtkYReco3Psk4GvNgzbeZMeqTBUvabUgF | corcovado |  /  | TITLE_ONLY | LEADSHEET | Piano | 2/2 | 36 | 31 | 4.83 (3) | 239 | unknown | 84248 | known CID Corcovado (TITLE_ONLY); `xml/E-latin/corcovado-QmWYgg7QifpX4XtkYReco3Psk4GvNgzbeZMeqTBUvabUgF.musicxml` |
| QmbEXBfVDk9iNqKRoXudwgcVKFL9yagDcFvwqAwvLt5h5H | Bezeichnung standardisiert: La Jalousie; | Misc tunes / Urheber unbekannt 1720 belegt | TITLE_ONLY | PIANO1 |  | 2/2 | 18 | 0 | 0.00 (0) | 3 | pd | 28126 | known CID Jalousie (TITLE_ONLY); `xml/E-latin/bezeichnung-standardisiert-la-jalousie-QmbEXBfVDk9iNqKRoXudwgcVKFL9yagDcFvwqAwvLt5h5H.musicxml` |
| QmRWDfadi4gsez9ishabhEcHpHNdjC7q2efEJZe5SDa8X8 | Garota de Ipanema | Bia Giovanella 2 / Arr.: Bianca Giovanella | MATCH | PIANO_GRAND_STAFF | Piano | 2/4 | 34 | 24 | 4.67 (39) | 1054 | unknown | 173934 | top distinct song #1 (rank 2, identity MATCH); `xml/E-latin/garota-de-ipanema-QmRWDfadi4gsez9ishabhEcHpHNdjC7q2efEJZe5SDa8X8.musicxml` |
| QmTBJZppfNknV4qdmmCxjar1Qh5BRJNSyDRP919x2JdnMN | Por una Cabeza | Carlos Gardel / Carlos Gardelarr. Teddy Leong-she | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 43 | 0 | 4.77 (32) | 1395 | unknown | 606034 | top distinct song #2 (rank 3, identity MATCH); `xml/E-latin/por-una-cabeza-QmTBJZppfNknV4qdmmCxjar1Qh5BRJNSyDRP919x2JdnMN.musicxml` |
| QmNswaWYXpxK1XegKbJVDULwZMjKN6cETGTVfXQKYsYrzs | Por Una Cabeza - Carlos Gardel | Carlos Gardel / Carlos Gardel | MATCH | PIANO_GRAND_STAFF | Pianoforte | 4/4 | 66 | 0 | 4.75 (78) | 1068 | unknown | 325725 | song 'por una cabeza'; alternate edition kept: bars 66 vs 43 (more than 25% apart); `xml/E-latin/por-una-cabeza-carlos-gardel-QmNswaWYXpxK1XegKbJVDULwZMjKN6cETGTVfXQKYsYrzs.musicxml` |
| QmQSWZ1U7q2MoQHVoWBt7htbe8f1JWrGpYpnD1MKytUV2c | Por una Cabeza | Carlos Gardel / Carlos Gardel Arr: Flávio Régis Cunha | MATCH | MIXED_WITH_PIANO | Flute I. II.; Oboe; Clarinet in Bb I. II.; Violin I; Violin II; Viola; Violoncello I; Violoncello II; Double Bass; Piano | 4/4 | 65 | 0 | 4.83 (26) | 5643 | unknown | 1440744 | song 'por una cabeza'; alternate edition kept: shape MIXED_WITH_PIANO vs PIANO_GRAND_STAFF; `xml/E-latin/por-una-cabeza-QmQSWZ1U7q2MoQHVoWBt7htbe8f1JWrGpYpnD1MKytUV2c.musicxml` |
| QmZF4m2KTAiHmHpg9eYrG1y2bfQKo2chTxSNYepnmuvHtF | Girl From Ipanema | Antônio Carlos Jobim / arr Noah Zahm | MATCH | MIXED_WITH_PIANO | Trumpet; Alto Sax; Tenor Sax; Trombone; Piano; Bass; Drums; Claves | 4/4 | 51 | 0 | 4.72 (26) | 6135 | unknown | 602006 | top distinct song #3 (rank 7, identity MATCH); `xml/E-latin/girl-from-ipanema-QmZF4m2KTAiHmHpg9eYrG1y2bfQKo2chTxSNYepnmuvHtF.musicxml` |
| QmcMf1mKhg6iQpaJXRX5JjUXcqaWiP7yZSBJ8troR8wdDt | girl from impanema | Antônio Carlos Jobim /  | MATCH | MIXED_WITH_PIANO | Flute; B♭ Clarinet; Alto Saxophone; Alto Saxophone; Piano | 4/4 | 58 | 6 | 0.00 (0) | 204 | unknown | 262617 | song 'girl from ipanema'; alternate edition kept: chord symbols 6 vs 0; `xml/E-latin/girl-from-impanema-QmcMf1mKhg6iQpaJXRX5JjUXcqaWiP7yZSBJ8troR8wdDt.musicxml` |
| QmYNaW9VvQDFWoD159XYCPxmvyJmGBkhrFijb1P1PaLRUE | Adios Nonino | Astor Piazzolla /  | MATCH | MIXED_WITH_PIANO | Violin; Flute; Violin; Violoncello; Piano; Piano | 4/4,2/4 | 81 | 0 | 4.28 (4) | 735 | unknown | 838670 | top distinct song #4 (rank 9, identity MATCH); `xml/E-latin/adios-nonino-QmYNaW9VvQDFWoD159XYCPxmvyJmGBkhrFijb1P1PaLRUE.musicxml` |
| QmbYzj8P6PbJ9DwbepDeMSHTVoHyEEMhQRsuTLcqf3bqyd | La Negra Tiene Tumbao | Fernando Osorio / Victor Lopez | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 68 | 46 | 0.00 (0) | 448 | unknown | 423053 | top distinct song #5 (rank 23, identity n/a); `xml/E-latin/la-negra-tiene-tumbao-QmbYzj8P6PbJ9DwbepDeMSHTVoHyEEMhQRsuTLcqf3bqyd.musicxml` |
| QmWGTwTWmfBr63fU3crPi6q69hJiVaw7caEMs9cJeMHErQ | Chiquilin de Bachin Part Cello |  / A. Piazzolla | n/a | LEADSHEET | Piano | 3/4 | 64 | 55 | 4.66 (3) | 436 | unknown | 78684 | top distinct song #6 (rank 24, identity n/a); `xml/E-latin/chiquilin-de-bachin-part-cello-QmWGTwTWmfBr63fU3crPi6q69hJiVaw7caEMs9cJeMHErQ.musicxml` |
| QmdTRWW1YANW9XNop1c4cu3tiRHDtwGeZkPEB5GbLQWBdf | Zequinha de Abreu - Tico Tico | Zequinha de Abreu / Zequinha de Abreu 1917 | TITLE_ONLY | PIANO1 |  | 2/4 | 59 | 0 | 0.00 (0) | 69 | unknown | 150790 | song 'tico tico' (known CID dumped); alternate edition kept: shape PIANO1 vs LEADSHEET; `xml/E-latin/zequinha-de-abreu-tico-tico-QmdTRWW1YANW9XNop1c4cu3tiRHDtwGeZkPEB5GbLQWBdf.musicxml` |
| QmejFJRcT7Q9hdFQWbhPZCnewzAzCzVCckYHgsVuN7RcAM | Tico Tico | Misc tunes /  | TITLE_ONLY | PIANO1 |  | 2/2 | 193 | 0 | 0.00 (0) | 30 | unknown | 507724 | song 'tico tico' (known CID dumped); alternate edition kept: shape PIANO1 vs LEADSHEET; `xml/E-latin/tico-tico-QmejFJRcT7Q9hdFQWbhPZCnewzAzCzVCckYHgsVuN7RcAM.musicxml` |
| QmdZTLCS4kM6YJHjRX2D8kp6oEMPBD1w79nZJ2iszfqn3k | Bezeichnung standardisiert: La Jalousie; | Misc tunes / Urheber unbekannt 1720 belegt | TITLE_ONLY | MULTI_PIANO_PART | ;  | 2/2 | 14 | 0 | 0.00 (0) | 5 | pd | 38011 | song 'jalousie' (known CID dumped); alternate edition kept: shape MULTI_PIANO_PART vs PIANO1; `xml/E-latin/bezeichnung-standardisiert-la-jalousie-QmdZTLCS4kM6YJHjRX2D8kp6oEMPBD1w79nZJ2iszfqn3k.musicxml` |


### Next 10 ranked, undumped (MISMATCH excluded)

| Rank | CID | Title | Artist / composer | Identity | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | Qme3HzhbR5A5Tab5QJ684kcd9EdH4iaKiN8vbQLLYuoNWQ | Por una cabeza | The Piano Passion / Carlos Gardel | MATCH | PIANO_GRAND_STAFF | 4/4 | 74 | 0 | 4.71 (4) | 243 | unknown | por una cabeza |
| 8 | QmapaWk2ft6Yvptx58WxsWqZdEB749GUKkE8FvoQkhxrXc | Por una Cabeza | Carlos Gardel / Carlos Gardel | MATCH | MIXED_WITH_PIANO | 4/4,5/8,7/8,9/8 | 84 | 0 | 4.66 (32) | 2859 | unknown | por una cabeza |
| 10 | QmSDzs2eestyStqqunrRJUJxDi3g8i5YpomTrLd1JHpv6K | Por unas cabezas | Carlos Gardel /  | MATCH | MULTI_PIANO_PART | 4/4,3/4,1/4 | 36 | 0 | 0.00 (0) | 4999 | unknown | por una cabeza |
| 11 | QmXApgzsxGtBZpq9ZMcEcZLZf7MAzxTNfXK3DjEcEV1xid | Por una Cabeza |  / C.Gardel | MATCH | PIANO1 | 4/4 | 96 | 0 | 0.00 (0) | 505 | unknown | por una cabeza |
| 12 | QmTTV5DswxejwXjtG6TEnrvoUrHYxfAXuLDnBmqyfT57gs | Por una cabeza | Carlos Gardel / Carlos GARDEL | MATCH | OTHER | 4/4 | 65 | 53 | 4.73 (12) | 860 | unknown | por una cabeza |
| 13 | QmZdVepm6kU6HtCbGgS8X1KFSpXRoEB1hCJwZCwJ7BXnZ2 | Corcovado (guitar chords arr.) | Antônio Carlos Jobim / Jobim | MATCH | OTHER | 2/4 | 39 | 38 | 4.33 (6) | 313 | unknown | corcovado |
| 14 | QmTrNear29uWMgsAMxG29ma6sLAMQiWSkK7ksYJrztVyx3 | chega final | João Gilberto / Antonio Carlos Jobim | MATCH | OTHER | 2/2 | 258 | 138 | 0.00 (0) | 81 | unknown | chega de saudade |
| 15 | QmPqGm73syTAnvaFSwHWB5nTi3KEMybjqMYRVRox2eejWb | Por Una Cabeza (String Quartet) | Carlos Gardel / Carlos GardelArranged by Michael Tan | MATCH | OTHER | 4/4 | 65 | 0 | 4.83 (251) | 10454 | unknown | por una cabeza |
| 16 | QmUdVExcBhmih8kpm7zCrQBhLbnAXmtPHnEWy3pPvcNkWu | Por Una Cabeza | Carlos Gardel / Carlos Gardel | MATCH | OTHER | 4/8 | 69 | 0 | 4.77 (49) | 30843 | unknown | por una cabeza |
| 17 | QmeYAjqBN7CoUVmQQAHzJ8ARow5c9K85nKPn1H7hiaiAu6 | Por Una Cabeza - Carlos Gardel | Carlos Gardel / C.Gardel | MATCH | OTHER | 4/4 | 97 | 0 | 4.81 (8) | 370 | unknown | por una cabeza |

### Identity MISMATCH hits: 8 (none dumped)

- QmPjqDwzxmYiGgrGQ8fRfzoTyXFtPyjGk7kJQiopAbf9sq: Adios Nonino / ANGELA ACOSTA GIOVANINI DE MOURA for term 'adios nonino': named creator 'ANGELA ACOSTA GIOVANINI DE MOURA' is not one of the expected (piazzolla)
- QmcUpnuJpS89fXhkySVwZRQomgQ9FWMYx5uUxUa8s2Q73i: The Girl From Ipanema / Kevin Valois for term 'girl from ipanema': named creator 'Kevin Valois' is not one of the expected (jobim, moraes, de moraes, vinicius)
- QmRGy561RgkfpePX9QLT6nuh9ubmm8ofm6YRiN5tMRrawL: Urheber unbekannt - [ID 1-100b] / Urheber unbekanntErstbeleg: 1706 (Datum in der schriftlichen Quelle)Datum in der hier transkribierten schriftlichen Quelle: vermutlich vor 1767 for term 'jalousie': named creator 'Urheber unbekanntErstbeleg: 1706 (Datum in der schriftlichen Quelle)Datum in der hier transkribierten schriftlichen Quelle: vermutlich vor 1767' is not one of the expected (gade)
- Qmf9MvVVC6Ke4dP2w9a4N9RsvTxtKWXYozPXC5xTdGynGr: Urheber unbekannt - [ID 1-100b] / Urheber unbekanntErstbeleg: 1706 (Datum in der schriftlichen Quelle)Datum in der hier transkribierten schriftlichen Quelle: 1775 for term 'jalousie': named creator 'Urheber unbekanntErstbeleg: 1706 (Datum in der schriftlichen Quelle)Datum in der hier transkribierten schriftlichen Quelle: 1775' is not one of the expected (gade)
- QmPqrwq3oyBK6xcGeBseW5hKPWVa2Mni8KE23TEnUseZjt: Urheber unbekannt - [ID 1-100b] / Urheber unbekanntErstbeleg: 1706 (Datum in der schriftlichen Quelle)Datum in der hier transkribierten schriftlichen Quelle: 1792 for term 'jalousie': named creator 'Urheber unbekanntErstbeleg: 1706 (Datum in der schriftlichen Quelle)Datum in der hier transkribierten schriftlichen Quelle: 1792' is not one of the expected (gade)
- QmPyTGJoDwgi3Xw9R7rTg477YvqDhUWrLCnsx3M8g5dJw3: Por Una Cabeza Arr. / Huay Din for term 'por una cabeza': named creator 'Huay Din' is not one of the expected (gardel, le pera)
- QmP4QVELJGPXWQxsyTnYnhzPBbALJisLfCE4ZJdYUkC4o4: Contre Danze / Jalousie (HS.dGJ.178) / Bij een vergaedert ende op gestelt door Ioannes de Grúijtters for term 'jalousie': named creator 'Bij een vergaedert ende op gestelt door Ioannes de Grúijtters' is not one of the expected (gade)
- Qmavnm97ZzEbsMhqLQcddGyqx8P1Hc5AHSrquuB8ue1hgm: La jalousie Angloise (DP 43) / De Prins Frans for term 'jalousie': named creator 'De Prins Frans' is not one of the expected (gade)

### Terms with zero matches for the configured term

son montuno, salsa piano, guajeo, chan chan, tango nuevo, fuga y misterio, la muerte del angel, michelangelo 70, escualo, oye como va

Hits per term: montuno=1; son montuno=0; tumbao=2; salsa piano=0; guajeo=0; chan chan=0; piazzolla=32; tango nuevo=0; tico tico=17; so danco samba=1; chega de saudade=3; girl from ipanema=7; garota de ipanema=2; corcovado=2; jalousie=11; por una cabeza=15; caminito=1; adios nonino=3; fuga y misterio=0; la muerte del angel=0; michelangelo 70=0; escualo=0; oye como va=0


## Lane F-improv-compose

Goal: short real examples for motif, repetition/variation, harmonizing a melody, small binary/ABA form

### Known CIDs, identity check

| Indexed as | CID | Verdict | Reason | CSV title / song_name | CSV composer / artist | Programs | Parts | Shape | Bars | Chords |
|---|---|---|---|---|---|---|---|---|---|---|
| Down in the Valley | QmWuBBaf6uwZdiWHx1dm9meAW2tXnw6EV7hb93tnDTy3S4 | MATCH | creator 'Anonymous' is traditional, as expected | Down in the valley - Anonymous / down in the valley | Anonymous / Misc Traditional | 0-0 | ;  | MULTI_PIANO_PART | 24 | 0 |
| Oh Susanna | QmchjwvtpXykrxVrMHadPZLP7AHZ4ZgFjEg6qca7xpPFcm | MATCH | creator alias 'foster' found | Stephen Foster - Oh Susanna / Oh! Susanna | Stephen Foster 1847 / Stephen Foster | 0 |  | LEADSHEET | 17 | 11 |
| House of the Rising Sun | Qmc3v934xFCPJrgGpH9J8G5qTUhebhrysLwPEFEXhYgStR | MATCH | creator 'anon.' is traditional, as expected | House of the Rising Sun / The House of the Rising Sun | anon. / Misc Traditional | 0 |  | LEADSHEET | 17 | 16 |
| Autumn Leaves | QmWLjxJSdX1VjYwcEkDYhj7CDhWLX4rFbSakCxiGTJWT7T | **MISMATCH** | named creator 'Asa Hull' is not one of the expected (kosma, prevert, mercer) | Behold the changing autumn leaves - Asa Hull / Behold the changing autumn leaves |  / Asa Hull | 0 | Grand Piano | PIANO_GRAND_STAFF | 30 | 0 |

Hits: 3510 rows. Identity verdicts over hits: n/a 3510.

### Dumped scores

| CID | Title | Artist / composer | Identity | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | XML bytes | Why / where |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmWuBBaf6uwZdiWHx1dm9meAW2tXnw6EV7hb93tnDTy3S4 | Down in the valley - Anonymous | Misc Traditional / Anonymous | MATCH | MULTI_PIANO_PART | ;  | 2/4 | 24 | 0 | 0.00 (0) | 0 |  | 122099 | known CID Down in the Valley (MATCH); `xml/F-improv-compose/down-in-the-valley-anonymous-QmWuBBaf6uwZdiWHx1dm9meAW2tXnw6EV7hb93tnDTy3S4.musicxml` |
| QmchjwvtpXykrxVrMHadPZLP7AHZ4ZgFjEg6qca7xpPFcm | Stephen Foster - Oh Susanna | Stephen Foster / Stephen Foster 1847 | MATCH | LEADSHEET |  | 4/4 | 17 | 11 | 0.00 (0) | 0 |  | 21570 | known CID Oh Susanna (MATCH); `xml/F-improv-compose/stephen-foster-oh-susanna-QmchjwvtpXykrxVrMHadPZLP7AHZ4ZgFjEg6qca7xpPFcm.musicxml` |
| Qmc3v934xFCPJrgGpH9J8G5qTUhebhrysLwPEFEXhYgStR | House of the Rising Sun | Misc Traditional / anon. | MATCH | LEADSHEET |  | 3/4 | 17 | 16 | 0.00 (0) | 0 |  | 25112 | known CID House of the Rising Sun (MATCH); `xml/F-improv-compose/house-of-the-rising-sun-Qmc3v934xFCPJrgGpH9J8G5qTUhebhrysLwPEFEXhYgStR.musicxml` |
| QmPuGugz5TaJioLJg2dVZJHjHAeT6B5JZkHMat2bBJ2RwG | Prelude in F Minor (MIDIFlip) |  / Flipped by JustAnotherMan'sEmptySoul | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 35 | 1 | 0.00 (0) | 315 | unknown | 263272 | structural nomination, roles: motif-repetition; `xml/F-improv-compose/prelude-in-f-minor-midiflip-QmPuGugz5TaJioLJg2dVZJHjHAeT6B5JZkHMat2bBJ2RwG.musicxml` |
| QmQGGqN9LKPTntnAELbiRrKSHEyGUwJsa7WP3rRmZAfMWz | Prelude | Sires_ / Rodrigo Damasceno | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 35 | 0 | 0.00 (0) | 102 | unknown | 576715 | structural nomination, roles: motif-repetition; `xml/F-improv-compose/prelude-QmQGGqN9LKPTntnAELbiRrKSHEyGUwJsa7WP3rRmZAfMWz.musicxml` |
| QmWxr9gKwW1pzpsdPHt9et25U8zpWgdgdfDiCPzbHPr6kj | WALTZ. in Der Freisch\utz | Misc tunes /  | n/a | PIANO1 |  | 3/4 | 27 | 0 | 0.00 (0) | 0 | unknown | 56048 | structural nomination, roles: motif-repetition; `xml/F-improv-compose/waltz-in-der-freisch-utz-QmWxr9gKwW1pzpsdPHt9et25U8zpWgdgdfDiCPzbHPr6kj.musicxml` |
| QmeAPWQf2EFTmmhmppmnmb3sUDcG3TR7EGUvF6e8ahkH1F | The Sussex Waltz | Misc tunes /  | n/a | PIANO1 |  | 3/4 | 32 | 0 | 0.00 (0) | 9 | unknown | 38267 | structural nomination, roles: motif-repetition; `xml/F-improv-compose/the-sussex-waltz-QmeAPWQf2EFTmmhmppmnmb3sUDcG3TR7EGUvF6e8ahkH1F.musicxml` |
| QmYJ6QHJF2hx465Mn1XaXNm6e7LVX9f6fUwDhRKHhGr8Uy | Waltz | composer Uknown /  | n/a | PIANO_GRAND_STAFF | Piano | 3/4 | 16 | 0 | 0.00 (0) | 73 | unknown | 25859 | structural nomination, roles: binary-or-ABA; `xml/F-improv-compose/waltz-QmYJ6QHJF2hx465Mn1XaXNm6e7LVX9f6fUwDhRKHhGr8Uy.musicxml` |
| QmPEY3crzydpj5eUcSRcTwPit1FkB3W2i8i3YR5KMJKjtq | WALTZ FROM BOHEMIAN GIRL. | Misc tunes /  | n/a | PIANO1 |  | 3/4 | 32 | 0 | 0.00 (0) | 2 | unknown | 41589 | structural nomination, roles: binary-or-ABA; `xml/F-improv-compose/waltz-from-bohemian-girl-QmPEY3crzydpj5eUcSRcTwPit1FkB3W2i8i3YR5KMJKjtq.musicxml` |
| QmPHf2JSTdnKNosdwGu2hJqisutHgj26kCF3gxmEJF7w86 | A Minuet in G Major | Johann Sebastian Bach / Johann Sebastian Bach(Germany 1685-1750) | n/a | PIANO_GRAND_STAFF | Piano | 3/4 | 32 | 0 | 0.00 (0) | 1184 | pd | 77586 | structural nomination, roles: binary-or-ABA; `xml/F-improv-compose/a-minuet-in-g-major-QmPHf2JSTdnKNosdwGu2hJqisutHgj26kCF3gxmEJF7w86.musicxml` |
| QmPepZe1DwJjbUgcsCjWcXaiAX4dWR2WDcpnuVHNJFRqh9 | New Bath Minuet. Roose.0602 | Misc tunes /  | n/a | PIANO1 |  | 3/4 | 32 | 0 | 0.00 (0) | 2 | unknown | 43184 | structural nomination, roles: binary-or-ABA; `xml/F-improv-compose/new-bath-minuet-roose-0602-QmPepZe1DwJjbUgcsCjWcXaiAX4dWR2WDcpnuVHNJFRqh9.musicxml` |
| QmfRYEUhXHSj9a8yk5s4b5ErUsrQ3QkNNxgcJhfU65VjfE | Minuet | James Hook / James Hook | n/a | PIANO_GRAND_STAFF | Piano | 3/4 | 16 | 0 | 4.77 (6) | 77 | unknown | 38365 | structural nomination, roles: harmonizable-melody; `xml/F-improv-compose/minuet-QmfRYEUhXHSj9a8yk5s4b5ErUsrQ3QkNNxgcJhfU65VjfE.musicxml` |
| QmNUWroXAYG9wXWCoarts9czwu12XqSGUatoH6Mu4NFCHP | Sir Charles Sedley's Minuet | Misc tunes /  | n/a | LEADSHEET |  | 3/4 | 16 | 22 | 0.00 (0) | 2 | unknown | 29843 | structural nomination, roles: harmonizable-melody; `xml/F-improv-compose/sir-charles-sedleys-minuet-QmNUWroXAYG9wXWCoarts9czwu12XqSGUatoH6Mu4NFCHP.musicxml` |
| QmP2ZXtAS6AmkUD5rKSbAPPLv3fX9vrAgFZnxXA2VVQR8W | Sjijnymyra-valsen | Misc tunes /  | n/a | LEADSHEET |  | 3/4 | 16 | 16 | 0.00 (0) | 4 | unknown | 22380 | structural nomination, roles: harmonizable-melody; `xml/F-improv-compose/sjijnymyra-valsen-QmP2ZXtAS6AmkUD5rKSbAPPLv3fX9vrAgFZnxXA2VVQR8W.musicxml` |
| QmRHUvoP5kRkt9TgZJ2aWQPbWbmZJ7mHwfhZ5UnEsPkdai | Paspie Minuet | Misc tunes / A.J.Vanpelt de Maastricht (1786-1824) | n/a | LEADSHEET |  | 3/4 | 16 | 24 | 0.00 (0) | 19 | unknown | 30994 | structural nomination, roles: harmonizable-melody; `xml/F-improv-compose/paspie-minuet-QmRHUvoP5kRkt9TgZJ2aWQPbWbmZJ7mHwfhZ5UnEsPkdai.musicxml` |


### Structural nomination

Inspected 3510 hits in XML; 2124 are piano (grand staff, PIANO1 or LEADSHEET) with 4 to 40 XML bars. Signals only: they say what repeats and what is single-line, nothing about quality. Candidates per role: motif-repetition 2000, binary-or-ABA 1641, harmonizable-melody 1753.

#### Role: motif-repetition

| CID | Title | Shape | Bars | Exact-repeat measures | Transposed-repeat measures | Repeat barlines | Endings | 8/16-bar halves | Phrase returns exact at bar | Phrase returns rhythm at bar | Middle contrasts | Top-staff max simultaneity | Chords | Lower-staff support |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmPuGugz5TaJioLJg2dVZJHjHAeT6B5JZkHMat2bBJ2RwG | Prelude in F Minor (MIDIFlip) | PIANO_GRAND_STAFF | 35 | 21 | 12 | 0 | 0 | False | None | 9 | True | 2 | 1 | False |
| QmQGGqN9LKPTntnAELbiRrKSHEyGUwJsa7WP3rRmZAfMWz | Prelude | PIANO_GRAND_STAFF | 35 | 24 | 5 | 0 | 0 | False | 9 | 9 | True | 4 | 0 | False |
| QmWxr9gKwW1pzpsdPHt9et25U8zpWgdgdfDiCPzbHPr6kj | WALTZ. in Der Freisch\utz | PIANO1 | 27 | 17 | 5 | 0 | 0 | False | 19 | 10 | True | 1 | 0 | False |
| QmeAPWQf2EFTmmhmppmnmb3sUDcG3TR7EGUvF6e8ahkH1F | The Sussex Waltz | PIANO1 | 32 | 25 | 0 | 0 | 0 | True | 9 | 9 | True | 1 | 0 | False |

#### Role: binary-or-ABA

| CID | Title | Shape | Bars | Exact-repeat measures | Transposed-repeat measures | Repeat barlines | Endings | 8/16-bar halves | Phrase returns exact at bar | Phrase returns rhythm at bar | Middle contrasts | Top-staff max simultaneity | Chords | Lower-staff support |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmYJ6QHJF2hx465Mn1XaXNm6e7LVX9f6fUwDhRKHhGr8Uy | Waltz | PIANO_GRAND_STAFF | 16 | 7 | 3 | 3 | 0 | True | 9 | 9 | True | 1 | 0 | True |
| QmPEY3crzydpj5eUcSRcTwPit1FkB3W2i8i3YR5KMJKjtq | WALTZ FROM BOHEMIAN GIRL. | PIANO1 | 32 | 4 | 4 | 4 | 0 | True | 9 | 9 | True | 1 | 0 | False |
| QmPHf2JSTdnKNosdwGu2hJqisutHgj26kCF3gxmEJF7w86 | A Minuet in G Major | PIANO_GRAND_STAFF | 32 | 6 | 5 | 3 | 0 | True | 9 | 9 | True | 3 | 0 | False |
| QmPepZe1DwJjbUgcsCjWcXaiAX4dWR2WDcpnuVHNJFRqh9 | New Bath Minuet. Roose.0602 | PIANO1 | 32 | 9 | 1 | 3 | 0 | True | 9 | 9 | True | 1 | 0 | False |

#### Role: harmonizable-melody

| CID | Title | Shape | Bars | Exact-repeat measures | Transposed-repeat measures | Repeat barlines | Endings | 8/16-bar halves | Phrase returns exact at bar | Phrase returns rhythm at bar | Middle contrasts | Top-staff max simultaneity | Chords | Lower-staff support |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmfRYEUhXHSj9a8yk5s4b5ErUsrQ3QkNNxgcJhfU65VjfE | Minuet | PIANO_GRAND_STAFF | 16 | 6 | 1 | 3 | 0 | True | None | None | True | 1 | 0 | True |
| QmNUWroXAYG9wXWCoarts9czwu12XqSGUatoH6Mu4NFCHP | Sir Charles Sedley's Minuet | LEADSHEET | 16 | 0 | 4 | 4 | 0 | True | None | None | True | 1 | 22 | True |
| QmP2ZXtAS6AmkUD5rKSbAPPLv3fX9vrAgFZnxXA2VVQR8W | Sjijnymyra-valsen | LEADSHEET | 16 | 7 | 1 | 4 | 0 | True | None | None | True | 1 | 16 | True |
| QmRHUvoP5kRkt9TgZJ2aWQPbWbmZJ7mHwfhZ5UnEsPkdai | Paspie Minuet | LEADSHEET | 16 | 2 | 0 | 4 | 0 | True | None | None | True | 1 | 24 | True |

#### Signals for the four known F CIDs

| CID | Bars (no pickup) | Exact-repeat | Transposed-repeat | Repeat barlines | Halves 8/16 | Phrase returns exact | Single line top | Chords |
|---|---|---|---|---|---|---|---|---|
| QmWuBBaf6uwZdiWHx1dm9meAW2tXnw6EV7hb93tnDTy3S4 | 24 | 13 | 0 | 0 | False | 9 | False | 0 |
| QmchjwvtpXykrxVrMHadPZLP7AHZ4ZgFjEg6qca7xpPFcm | 17 | 7 | 0 | 1 | False | None | True | 11 |
| Qmc3v934xFCPJrgGpH9J8G5qTUhebhrysLwPEFEXhYgStR | 17 | 1 | 1 | 0 | False | None | True | 16 |
| QmWLjxJSdX1VjYwcEkDYhj7CDhWLX4rFbSakCxiGTJWT7T | 30 | 9 | 2 | 0 | False | None | False | 0 |

Autumn Leaves (Kosma) for this lane is cross-referenced from B-jazz, not re-dumped here: QmeeqT5bwUfEqU9w8ZGXXLgp49DQra1tM23aD85ipXiXXv (Autumn Leaves Transcription, LEADSHEET); QmYjsj12FbAhMvLKL2fRdok4XLzGrY7MFFPQLP1Gtj4w4i (Autumn Leaves, LEADSHEET); QmR8ycCSt3M7NwcgPCqgZ6woPFg7YCbiyoGR79VFM3zh7v (Autumn Leaves, LEADSHEET); Qmeaq2on2PCsqqEjxJt48tPGxyQJfCXCXMc1M9WfMEuCyz (Autumn Leaves Piano Solo - Hank Jones (Somethin' else), PIANO_GRAND_STAFF); QmUXmicT5AhuanHKfK5Ao3em68ZyghQGXFAx7WAyUKbeR3 (Autunm Leaves, PIANO_GRAND_STAFF); QmNRbUJDm3Cae5nEFY7V8H2ThaqyWdBX5dWPgmLK4gtT1W (Autumn Leaves, PIANO_GRAND_STAFF); QmXguCjjXe7kPvWWQKcaDKWU4fYS5ruV52NvCnmzezfMKL (Autumn Leaves, PIANO_GRAND_STAFF); QmSNucnN1cd7T2M4pxXiPBiEofEvFqMsZ5bQC758Prn7nj (Autumn Leaves, PIANO_GRAND_STAFF); QmYMpzeVPVzu94hB6kDwCfW7gAcWiNrRumnnd7PWQcRTZD (Autumn Leaves, PIANO1); QmYaaQ5HTW4ZFtdT9Hzx1zAPNm8SsEfLVxpSXAMnmTYiGF (Autumn Leaves, PIANO1).

### Terms with zero matches for the configured term

None.

Hits per term: minuet=652; binary form=1; theme and variation=4; prelude=651; bagatelle=34; waltz=2169


## Lane G-holiday

Goal: non-Christmas holiday material (Hanukkah) so the Holiday track can keep its promise

Hits: 18 rows. Identity verdicts over hits: n/a 18.

Excluded by the lane rule (matched only 'rock of ages', no Hanukkah term): 32 rows, for example O rock of ages - Hubert P. Main (Hubert Platt Main 1890); In Thy cleft O Rock of Ages - Robert Lowry (Robert Lowry); Blest Rock of ages cleft for me - Chas. H. Gabriel (Chas. H. Gabriel); TOPLADY (Hastings) - Thomas Hastings (77 77 77TOPLADYwww.hymnary.org/text/rock_of_ages_cleft_for_me_let_me_hide); Rock of Ages cleft for me (Lorenz) - E. S. Lorenz (E. S. Lorenz); Rock of ages hide my soul - Barney Elliott Warren (Barney E. Warren pub.1911).

### Dumped scores

| CID | Title | Artist / composer | Identity | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | XML bytes | Why / where |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmY9tPFTtU9CZU8FMZr6YSDF27aahfYxC76KJnxAYtLYEC | Maoz Tsur | Misc Praise Songs /  | n/a | PIANO1 |  | 4/4 | 16 | 2 | 0.00 (0) | 53 | unknown | 46520 | top distinct song #1 (rank 1, identity n/a); `xml/G-holiday/maoz-tsur-QmY9tPFTtU9CZU8FMZr6YSDF27aahfYxC76KJnxAYtLYEC.musicxml` |
| QmSe5SBzVY7xuqiqbPmyNF9tcMb5LBNnWUfnKbYung75mY | Maoz tsur | Misc Praise Songs /  | n/a | MULTI_PIANO_PART | S; A; T | 2/2 | 18 | 0 | 0.00 (0) | 159 | unknown | 57318 | song 'maoz tzur'; alternate edition kept: shape MULTI_PIANO_PART vs PIANO1; `xml/G-holiday/maoz-tsur-QmSe5SBzVY7xuqiqbPmyNF9tcMb5LBNnWUfnKbYung75mY.musicxml` |
| QmZetUgU9jAbbc8t2zNpMae93a6BYMcCRGQC7Guu9e5C9Y | Thank you for Hanukkah (2nd preview) | SuitcaseFan14 /  | n/a | MIXED_WITH_PIANO | Piano; Shofar; Effect Synthesizer; Pipe Organ; Guitar; Piano; Bass; Drums | 4/4 | 104 | 0 | 0.00 (0) | 18 | unknown | 953193 | top distinct song #2 (rank 9, identity n/a); `xml/G-holiday/thank-you-for-hanukkah-2nd-preview-QmZetUgU9jAbbc8t2zNpMae93a6BYMcCRGQC7Guu9e5C9Y.musicxml` |
| QmenWa22efzTQD2VSB3oCNq3tA7jSsRAuJz9oPicb9rSa5 | Thank you for Hanukkah (1st preview) | SuitcaseFan14 /  | n/a | MIXED_WITH_PIANO | Piano; Shofar; Effect Synthesizer; Pipe Organ; Guitar; Piano; Bass; Drums | 4/4 | 33 | 0 | 0.00 (0) | 12 | unknown | 265216 | song 'thank you for hanukkah'; alternate edition kept: bars 33 vs 104 (more than 25% apart); `xml/G-holiday/thank-you-for-hanukkah-1st-preview-QmenWa22efzTQD2VSB3oCNq3tA7jSsRAuJz9oPicb9rSa5.musicxml` |
| QmaA1mDoFknzx5s2Es9zchiUMGo8QRF1y2CiN4MmoyNs9Q | Dreidel_Song_Lowe(V2) | Brian Lowe 3 / TraditionalArranged by LTJG Lowe | n/a | MIXED_WITH_PIANO | Piano; Flute; Oboe; B♭ Clarinet; Bass Clarinet; Alto Saxophone; B♭ Trumpet; Trombone | 4/4 | 9 | 0 | 0.00 (0) | 15 | unknown | 157998 | top distinct song #3 (rank 11, identity n/a); `xml/G-holiday/dreidel-song-lowe-v2-QmaA1mDoFknzx5s2Es9zchiUMGo8QRF1y2CiN4MmoyNs9Q.musicxml` |
| QmUoWMKdVsCa1XKZVmeG9DyNbFCRbN2KYMf2htqUg6w64r | Oy Chanukah | Misc tunes /  | n/a | MULTI_PIANO_PART | S; A; T | 2/2,3/2 | 21 | 0 | 0.00 (0) | 16 | unknown | 105631 | top distinct song #4 (rank 12, identity n/a); `xml/G-holiday/oy-chanukah-QmUoWMKdVsCa1XKZVmeG9DyNbFCRbN2KYMf2htqUg6w64r.musicxml` |
| QmSarCz8x1vF7uW9bqG2aTxw4uwwPeK4vfDCEi2uvkiCvW | The Dreydl Song - Anonymous (Traditional) | Misc Traditional /  | n/a | MULTI_PIANO_PART | Soprano Alto; Tenor Bass | 2/4 | 16 | 0 | 4.66 (3) | 175 | pd | 74648 | top distinct song #5 (rank 13, identity n/a); `xml/G-holiday/the-dreydl-song-anonymous-traditional-QmSarCz8x1vF7uW9bqG2aTxw4uwwPeK4vfDCEi2uvkiCvW.musicxml` |


### Next 10 ranked, undumped (MISMATCH excluded)

| Rank | CID | Title | Artist / composer | Identity | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | QmenbiDtqtN5JGmCMf9eqLDJi1jxDwWHo275HV3rY5zN2C | Maoz Tsur | Misc Praise Songs / German Askenazic Melody | n/a | MULTI_PIANO_PART | 4/4 | 16 | 0 | 0.00 (0) | 114 | unknown | maoz tzur |
| 4 | Qmb1VXWFiiVzsMCxBjnN2yPcYt8JaCtt7pKvqxGjuyzxYe | Men and children everywhere - Maoz Tsur German Ashkenazic tune. | Misc Praise Songs / German Askenazic Melody | n/a | MULTI_PIANO_PART | 4/4 | 16 | 0 | 0.00 (0) | 38 | unknown | maoz tzur |
| 5 | QmTRXqr1JUb25SewJV33sJ6EzX98kMJFf3RrfFUdNGDRaz | Maoz tsur y'shuati - Marcus Jastrow | Misc Praise Songs / German Askenazic Melody | n/a | MULTI_PIANO_PART | 4/4 | 16 | 0 | 4.49 (5) | 95 | unknown | maoz tzur |
| 6 | QmcLi78cwJxX9Rh4pViufwnmoKDqwRM8DAta8Z2kiL4rEM | Maoz tsur | Misc Praise Songs /  | n/a | PIANO1 | 2/2 | 14 | 0 | 0.00 (0) | 34 | unknown | maoz tzur, rock of ages |
| 7 | Qma5qmBR5ujUvo9DtpjrJVYbf9498KGr7y1yygEgd83Hp7 | Maoz tsur | Misc Praise Songs /  | n/a | PIANO1 | 2/2 | 14 | 0 | 0.00 (0) | 32 | unknown | maoz tzur, rock of ages |
| 8 | QmRJ89juCF9d9a1zxcoBn42iZVP5LP7vvBSDKryv3rZCmG | Maoz tsur | Misc Praise Songs /  | n/a | OTHER | 4/4 | 20 | 0 | 0.00 (0) | 48 | unknown | maoz tzur, rock of ages |
| 14 | QmXKZrQuKKiQMW42E8t1xXUF4BHw6PmwhLoC2mMPW3qgYq | Hanukkah O Hanukkah | Jewish Folk Tune /  | n/a | OTHER | 4/4 | 24 | 0 | 4.85 (18) | 1829 | pd | hanukkah |
| 15 | Qmf4rmNr8FY4vHweym3WyXq5MdLMpuAEWHqcFxGWd4tP2o | Chanukah Medley for 2 Violins | dr.susan /  | n/a | OTHER | 4/4 | 68 | 0 | 4.73 (12) | 468 | unknown | chanukah |
| 16 | QmRiNs4xbATQA3i2jqPM697vqLv2g9aPpU7WuicRJJWbgV | Chanukah Chanukah | Adam Sandler /  | n/a | OTHER | 4/4 | 16 | 0 | 0.00 (0) | 75 | unknown | chanukah |
| 17 | QmfFMECKGi2GU6qEniw7cujMyJjh7ixcoW6EPYFAMkCcbp | Dreidl song | Misc Traditional /  | n/a | OTHER | 2/4 | 17 | 0 | 0.00 (0) | 28 | pd | dreidel |

### Identity MISMATCH hits: 0 (none dumped)


### Terms with zero matches for the configured term

chanukkah, hanukah, ma oz tzur, mao z tzur, hanerot halalu, sevivon, s vivon, mi y malel, mi yemalel, chanukah oh chanukah, hanukkah oh hanukkah

Hits per term: hanukkah=4; chanukah=3; chanukkah=0; hanukah=0; maoz tzur=8; ma oz tzur=0; mao z tzur=0; rock of ages=36; hanerot halalu=0; sevivon=0; s vivon=0; dreidel=4; mi y malel=0; mi yemalel=0; chanukah oh chanukah=0; hanukkah oh hanukkah=0


## Lane H-ragtime

Goal: one authentic stop-time passage if easy; lower priority

### Known CIDs, identity check

| Indexed as | CID | Verdict | Reason | CSV title / song_name | CSV composer / artist | Programs | Parts | Shape | Bars | Chords |
|---|---|---|---|---|---|---|---|---|---|---|
| The Harlem Rag (1899, Tyers) - already reviewed, keep | QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9 | MATCH | creator alias 'turpin' found | The Harlem Rag (1899 - Tyers) /  | By Tom Turpin. Revised and Arr. by W.H.Tyers. /  | 0 | Piano | PIANO_GRAND_STAFF | 115 | 0 |

Hits: 34 rows. Identity verdicts over hits: n/a 34.

### Dumped scores

| CID | Title | Artist / composer | Identity | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | XML bytes | Why / where |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9 | The Harlem Rag (1899 - Tyers) |  / By Tom Turpin. Revised and Arr. by W.H.Tyers. | n/a | PIANO_GRAND_STAFF | Piano | 2/4 | 115 | 0 | 4.90 (8) | 585 | unknown | 581471 | known CID The Harlem Rag (1899, Tyers) - already reviewed, keep (MATCH); `xml/H-ragtime/the-harlem-rag-1899-tyers-QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9.musicxml` |
| Qme3vDrh4eg9Gk4FSqeuSag3Ft5LdbrrZzWgsRphr2CuLB | Cosgrove's Cakewalk | Misc tunes /  | n/a | LEADSHEET |  | 4/4 | 17 | 23 | 0.00 (0) | 2 | unknown | 46555 | top distinct song #1 (rank 1, identity n/a); `xml/H-ragtime/cosgroves-cakewalk-Qme3vDrh4eg9Gk4FSqeuSag3Ft5LdbrrZzWgsRphr2CuLB.musicxml` |
| Qma4jk2XgsU8hYgjmUTt3EyeqtwNW8Y8ZqJaxHuKo37DzK | Heliotrope Bouquet - Joplin and Chauvin - 1907 | Scott Joplin / By SCOTT JOPLINand LOUIS CHAUVIN. | n/a | PIANO_GRAND_STAFF | Piano. | 2/4 | 87 | 0 | 4.94 (49) | 3412 | pd | 692931 | top distinct song #2 (rank 2, identity n/a); `xml/H-ragtime/heliotrope-bouquet-joplin-and-chauvin-19-Qma4jk2XgsU8hYgjmUTt3EyeqtwNW8Y8ZqJaxHuKo37DzK.musicxml` |
| QmXd7HNnNZodQvrybARoZN8NtcZ2LVpJ1Wxbkc8Gq9YJ36 | The Ragtime Dance - Scott Joplin - 1906 arrangement | Scott Joplin / By SCOTT JOPLIN | n/a | PIANO_GRAND_STAFF | Piano | 2/4 | 83 | 0 | 4.87 (183) | 18219 | pd | 533750 | top distinct song #3 (rank 3, identity n/a); `xml/H-ragtime/the-ragtime-dance-scott-joplin-1906-arra-QmXd7HNnNZodQvrybARoZN8NtcZ2LVpJ1Wxbkc8Gq9YJ36.musicxml` |
| QmPdy5cVQ2tE9qMWhwLhVd2QtZh26inRSadFmcwkoypkpN | Sunflower Slow Drag - Joplin and Hayden - 1901 | Scott Joplin / By SCOTT JOPLIN and SCOTT HAYDEN. | n/a | PIANO_GRAND_STAFF | Piano | 2/4 | 93 | 0 | 4.83 (38) | 4145 | pd | 658258 | top distinct song #4 (rank 4, identity n/a); `xml/H-ragtime/sunflower-slow-drag-joplin-and-hayden-19-QmPdy5cVQ2tE9qMWhwLhVd2QtZh26inRSadFmcwkoypkpN.musicxml` |


### Next 10 ranked, undumped (MISMATCH excluded)

| Rank | CID | Title | Artist / composer | Identity | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 6 | QmPSN2TnRH1hx3fAje4fabZYgPvAEb3sfdieKyACCoerwE | Uncle Ben's Cakewalk Tom Brier | Tom Brier / Tom Brier | n/a | PIANO_GRAND_STAFF | 2/4 | 111 | 0 | 4.84 (16) | 953 | unknown | cakewalk |
| 7 | QmNkUeyzWJByJGWVksoThUEbKpqN9SeTKKTHUbTU2yukSK | Eli Green's Cake Walk - Sadie Koninsky | Sadie Koninsky / By Sadie Koninsky. | n/a | PIANO_GRAND_STAFF | 2/4 | 119 | 0 | 4.85 (11) | 440 | unknown | cake walk |
| 8 | QmdXabACSKdCTfNeTd9UErjjzD8xaVxiHEcfA2c3sd8etC | Cake Walk Lindy (1900) | Edward B. Claypoole / ED. B. CLAYPOOLE. | n/a | PIANO_GRAND_STAFF | 2/4 | 105 | 0 | 4.85 (11) | 191 | unknown | cake walk |
| 9 | QmTCkc3QhPhVjn4P3GuQNvuoQfxnMb5NECWUVR2vYeAYZN | The King of the Cake Walk (1903) | Marius Cairanne / Marius CAIRANNE | n/a | PIANO_GRAND_STAFF | 2/4 | 90 | 0 | 4.89 (7) | 293 | unknown | cake walk |
| 10 | QmX5gyiLscCxM2fetFEPm9XntJdPSTmoTp9DXoUdEq2Txu | Alabama Dream | George D Barnard /  | n/a | PIANO_GRAND_STAFF | 2/4 | 119 | 0 | 4.85 (4) | 478 | unknown | cake walk |
| 11 | QmRoT3K2BrayjL974S3EHmy62BJUCKkoCaUXSeYjujLaEf | Chocolate Cake Walk |  / James A. Fairfield | n/a | PIANO_GRAND_STAFF | 2/4 | 103 | 0 | 4.85 (4) | 230 | unknown | cake walk |
| 12 | QmUijDkGPbFPYHkEY6bLEiNFz8W7x24vXgT1Lm3MteRZFb | The Minneapolis Journal March |  / By EDMUND BRAHAM | n/a | PIANO_GRAND_STAFF | 2/2 | 102 | 0 | 4.83 (3) | 177 | unknown | cake walk |
| 13 | QmeHMWycGyY3DiMx8McchkMy4gfNraD6Z4S3x9tFZXE4jN | Kinklets (1906) | Arthur Marshall / By Arthur MarshallComposer of Swipesy Cake Walk | n/a | PIANO_GRAND_STAFF | 2/4 | 77 | 0 | 4.77 (6) | 308 | unknown | cake walk |
| 14 | QmWsrkyCndk12u437ku3ApGXEjZC4NNGMmFvU4DuByszdK | Sun Flower Slow Drag Joplin Scott | Scott Joplin / Scott Joplin and Scott Hayden | n/a | PIANO_GRAND_STAFF | 2/4 | 93 | 0 | 4.74 (5) | 407 | pd | slow drag |
| 15 | QmezsJDqELDQ6He7V5FRaHkocHasWMxkThE1ZJrVssyzsX | Keep Moving |  / By William White | n/a | PIANO_GRAND_STAFF | 2/4 | 74 | 0 | 0.00 (0) | 379 | unknown | cake walk |

### Identity MISMATCH hits: 0 (none dumped)


### Terms with zero matches for the configured term

None.

Hits per term: stop time=1; stop-time=1; cakewalk=6; cake walk=21; slow drag=7


## Lane I-pop

Goal: real four-chord and voice-led pop; arpeggiated accompaniment; syncopated comping; by-ear/reduction targets; intro/outro/modulation examples; one or two excellent songs for chords-pop.8/.9

Hits: 248 rows. Identity verdicts over hits: MATCH 103, MISMATCH 82, TITLE_ONLY 63.

### Dumped scores

| CID | Title | Artist / composer | Identity | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | XML bytes | Why / where |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn | Billy Joel - She's Always A Woman | Billy Joel / Billy Joel | MATCH | PIANO_GRAND_STAFF | Piano | 12/8,6/8,9/8 | 40 | 129 | 4.80 (101) | 7040 | unknown | 385842 | top distinct song #1 (rank 1, identity MATCH); `xml/I-pop/billy-joel-shes-always-a-woman-QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn.musicxml` |
| QmcJRkptrVetWEAJibzZgn4FjTLZbb3NWyMnD8Ce9azWNh | Coldplay - The Scientist | Coldplay /  | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 22 | 22 | 4.71 (4) | 461 | unknown | 137734 | top distinct song #2 (rank 2, identity MATCH); `xml/I-pop/coldplay-the-scientist-QmcJRkptrVetWEAJibzZgn4FjTLZbb3NWyMnD8Ce9azWNh.musicxml` |
| QmdkybbcYoQvYXXmfRyryox5soKGquvQVkaHn2bVx6oBZ7 | The Scientist | Coldplay /  | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 36 | 0 | 0.00 (0) | 4648 | unknown | 192314 | song 'the scientist'; alternate edition kept: bars 36 vs 22 (more than 25% apart); `xml/I-pop/the-scientist-QmdkybbcYoQvYXXmfRyryox5soKGquvQVkaHn2bVx6oBZ7.musicxml` |
| QmNUahv3eDtDYj6pwcWKNXQ89UXRe5xfjT1L6MVCe8fvZP | The Scientist |  / Arranged by Letícia Rezende | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 83 | 0 | 0.00 (0) | 614 | unknown | 509179 | song 'the scientist'; alternate edition kept: bars 83 vs 22 (more than 25% apart); `xml/I-pop/the-scientist-QmNUahv3eDtDYj6pwcWKNXQ89UXRe5xfjT1L6MVCe8fvZP.musicxml` |
| QmQhzFncR7uFfyVdjDmNZBQSVgkffiyeXwhQXfYUNA4ZyN | When We Were Young - Adele - Accompaniment | Adele / Adele | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 118 | 173 | 4.58 (40) | 2279 | unknown | 366369 | top distinct song #3 (rank 3, identity MATCH); `xml/I-pop/when-we-were-young-adele-accompaniment-QmQhzFncR7uFfyVdjDmNZBQSVgkffiyeXwhQXfYUNA4ZyN.musicxml` |
| QmPoKC1KNnhFURL5QSo3DRkGEWAoRgDiDEUchNJt79dGRo | Something - The Beatles | The Beatles / George Harrison (Beatles) | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 19 | 39 | 4.54 (384) | 15395 | unknown | 52555 | top distinct song #4 (rank 4, identity MATCH); `xml/I-pop/something-the-beatles-QmPoKC1KNnhFURL5QSo3DRkGEWAoRgDiDEUchNJt79dGRo.musicxml` |
| QmPEN8ygh1ZdxQxGpoe4Mmo7ToFyWM3kGf2SLHKRgTpqdy | Something - The Beatles | The Beatles /  | MATCH | PIANO1 | Drumset | 4/4 | 57 | 0 | 0.00 (0) | 771 | unknown | 352349 | song 'something'; alternate edition kept: shape PIANO1 vs PIANO_GRAND_STAFF; `xml/I-pop/something-the-beatles-QmPEN8ygh1ZdxQxGpoe4Mmo7ToFyWM3kGf2SLHKRgTpqdy.musicxml` |
| QmSEP572SsajfnvFbv7LvX3834H2SXA48k8m3RpNjAoDyW | Something | Misc tunes /  | TITLE_ONLY | LEADSHEET |  | 4/4 | 16 | 24 | 0.00 (0) | 6 | unknown | 50165 | song 'something'; alternate edition kept: shape LEADSHEET vs PIANO_GRAND_STAFF; `xml/I-pop/something-QmSEP572SsajfnvFbv7LvX3834H2SXA48k8m3RpNjAoDyW.musicxml` |
| QmUkekPKGR983LBTg8oK7QYh1rKLkUmUNnKJrMLWRKm4Nx | Vienna Billy Joel | Billy Joel / Billy Joel | MATCH | LEADSHEET | Piano | 4/4 | 107 | 95 | 4.48 (28) | 3097 | unknown | 206341 | top distinct song #5 (rank 5, identity MATCH); `xml/I-pop/vienna-billy-joel-QmUkekPKGR983LBTg8oK7QYh1rKLkUmUNnKJrMLWRKm4Nx.musicxml` |
| QmSyDuL23d8LtVWeGEk1XSTTzbZgSWU4AsEcEmU5A7LjJt | Vienna | Billy Joel / Words and Music by Billy Joel | MATCH | PIANO_GRAND_STAFF | Piano; Piano | 4/4 | 108 | 0 | 0.00 (0) | 138 | unknown | 518746 | song 'vienna'; alternate edition kept: shape PIANO_GRAND_STAFF vs LEADSHEET; `xml/I-pop/vienna-QmSyDuL23d8LtVWeGEk1XSTTzbZgSWU4AsEcEmU5A7LjJt.musicxml` |
| QmaFkFGGac9zaNwkHMHMmvhFi5oEWDwVanGn2UEUvNTEzf | Vienna Waltz. JMT.117 | Misc tunes /  | TITLE_ONLY | PIANO1 |  | 3/8 | 33 | 0 | 0.00 (0) | 14 | unknown | 63786 | song 'vienna'; alternate edition kept: shape PIANO1 vs LEADSHEET; `xml/I-pop/vienna-waltz-jmt-117-QmaFkFGGac9zaNwkHMHMmvhFi5oEWDwVanGn2UEUvNTEzf.musicxml` |
| QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M | No Surprises | Radiohead / Radiohead | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 71 | 0 | 4.83 (33) | 1613 | unknown | 395444 | top distinct song #6 (rank 6, identity MATCH); `xml/I-pop/no-surprises-QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M.musicxml` |
| QmYZGRsLCsNASou3HBU85SfR5T1KQx5hPqZVJa9xHtsbbM | No Surprises |  / Radiohead | MATCH | MIXED_WITH_PIANO | Saxofón contralto; Piano | 4/4 | 68 | 0 | 0.00 (0) | 655 | unknown | 562158 | song 'no surprises'; alternate edition kept: shape MIXED_WITH_PIANO vs PIANO_GRAND_STAFF; `xml/I-pop/no-surprises-QmYZGRsLCsNASou3HBU85SfR5T1KQx5hPqZVJa9xHtsbbM.musicxml` |
| QmZv36W7wx6M6iQfXyeABA3PiNZM74qrVJKLqfVuB1ueoo | Radiohead - No surprises (for drums) | Radiohead / http://drummatica.ru | MATCH | PIANO1 | Набор ударных | 4/4 | 61 | 0 | 4.42 (11) | 4077 | unknown | 242567 | song 'no surprises'; alternate edition kept: shape PIANO1 vs PIANO_GRAND_STAFF; `xml/I-pop/radiohead-no-surprises-for-drums-QmZv36W7wx6M6iQfXyeABA3PiNZM74qrVJKLqfVuB1ueoo.musicxml` |
| QmeQQcvhQttDeWkUeWsMd71pG6WgJtAwv6xuDShh7YUy7B | Elton John - Rocket Man | Elton John /  | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 47 | 0 | 4.78 (146) | 9149 | unknown | 674535 | top distinct song #7 (rank 7, identity MATCH); `xml/I-pop/elton-john-rocket-man-QmeQQcvhQttDeWkUeWsMd71pG6WgJtAwv6xuDShh7YUy7B.musicxml` |
| Qmdd97Gg3wapUpvbkHqxB1cMzTgm2NntauTiLuLHWd3Dt1 | Hallelujah - Leonard Cohen | Leonard Cohen / Leonard Cohen | MATCH | PIANO_GRAND_STAFF | Piano | 6/8 | 57 | 0 | 4.83 (3) | 771 | unknown | 247264 | top distinct song #8 (rank 8, identity MATCH); `xml/I-pop/hallelujah-leonard-cohen-Qmdd97Gg3wapUpvbkHqxB1cMzTgm2NntauTiLuLHWd3Dt1.musicxml` |
| QmViUNieMPGGYJuPCjQj5AnP8a6uUUveHbEbkbXusEaeBm | Hallelujah (easy) | Leonard Cohen / PC Chin | MATCH | PIANO_GRAND_STAFF | Piano | 6/8 | 29 | 0 | 4.68 (114) | 5252 | unknown | 56396 | song 'hallelujah'; alternate edition kept: bars 29 vs 57 (more than 25% apart); `xml/I-pop/hallelujah-easy-QmViUNieMPGGYJuPCjQj5AnP8a6uUUveHbEbkbXusEaeBm.musicxml` |
| QmYw5R78E3VXopmZb68rt75AYvMbvi2ByyMhh6dreyLh6W | Hallelujah |  / Leonard Cohen | MATCH | PIANO_GRAND_STAFF | Voice; Piano | 6/8 | 131 | 0 | 0.00 (0) | 338 | unknown | 612012 | song 'hallelujah'; alternate edition kept: bars 131 vs 57 (more than 25% apart); `xml/I-pop/hallelujah-QmYw5R78E3VXopmZb68rt75AYvMbvi2ByyMhh6dreyLh6W.musicxml` |


### Next 10 ranked, undumped (MISMATCH excluded)

| Rank | CID | Title | Artist / composer | Identity | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 10 | QmdvVUSSkbAgJHckTLcewoeJrSQm3LrimVTF2YH7tReNwW | Mad World (simple arrangement) | Gary Jules / Gary Jules Michael Andrews | MATCH | PIANO_GRAND_STAFF | 4/4 | 29 | 0 | 0.00 (0) | 1030 | unknown | mad world |
| 12 | QmXAocpmyAT6PCMWzLDkz2c7j8UeafVmZsCg4eLgNKwEN7 | Imagine | John Lennon / John Lennon | MATCH | PIANO_GRAND_STAFF | 4/4 | 35 | 0 | 0.00 (0) | 397 | unknown | imagine |
| 14 | QmdHeHH6uGpk5atpTtVUShtpTiLV4MpQwGSeZLFcAFV5s6 | The Scientist | Coldplay / Coldplay | MATCH | PIANO_GRAND_STAFF | 4/4 | 31 | 0 | 0.00 (0) | 49 | unknown | the scientist |
| 15 | QmTYMVjtzV42ztCc4vUBVgXjH1WMdXUhg9JNxxKcJBaW6k | Mad World | Roland Orzabal / Arranged byRobert Blomstereng | MATCH | PIANO_GRAND_STAFF | 4/4 | 45 | 0 | 4.66 (3) | 314 | unknown | mad world |
| 17 | QmQsRid5CzsBneXBtLrsE46BDGFn2BseetPyCUQUMdVcxg | Fix You Coldplay | Coldplay / Coldplay | MATCH | PIANO_GRAND_STAFF | 4/4 | 53 | 0 | 4.68 (771) | 246303 | unknown | fix you |
| 18 | QmcZnZByDzCDxRpXJfSGsPqDP9reRxzqpwmcxs3HR82kHc | Your Song - Elton John - Easy Piano | Elton John / Elton JohnArranged by Sadie King | MATCH | PIANO_GRAND_STAFF | 4/4 | 38 | 0 | 4.64 (1414) | 78241 | unknown | your song |
| 19 | QmWi7d42mYh7Fu2XNYLKDF5hpfvo3DhLDkPRSscG6nXwYt | Mad World - Melodica Duet |  / Gary Jules | MATCH | PIANO_GRAND_STAFF | 4/4 | 36 | 0 | 4.42 (4) | 647 | unknown | mad world |
| 20 | QmdE9gDzNjsgAvwtF4vd6ddcceBHSspZCM79gqwGQuiBYC | Clocks Coldplay | Coldplay / Coldplay | MATCH | PIANO_GRAND_STAFF | 4/4 | 22 | 0 | 4.61 (1185) | 357787 | unknown | clocks |
| 21 | QmdR8DfzVRpcGbibsWoY8BuXbwzchTunE4WvASjSmauUeq | Aleluya - piano | Leonard Cohen / Leonard Cohen | MATCH | PIANO_GRAND_STAFF | 6/8 | 30 | 0 | 4.58 (85) | 4016 | unknown | hallelujah |
| 22 | QmWpzkuQx23WPUoU1Lvta6hJtK7ccBjeSwL1ATyJ47UUMU | Rousseau: Billy Joel - Piano Man | Billy Joel /  | MATCH | PIANO_GRAND_STAFF | 4/4,3/4 | 273 | 0 | 4.80 (240) | 17152 | unknown | piano man |

### Identity MISMATCH hits: 82 (none dumped)

- QmWYmN6LAJEMYFZaVKTvmRHbk66RWLsxH1Hk9isULZz5hs: Love of My Life / J-38 for term 'love of my life': named creator 'J-38' is not one of the expected (queen, freddie mercury, mercury, brian may)
- QmYuSTG72XHkHMAr1TqtmZtws3X5QiYKZDWvDrhcfqfSmy: John Playford - Vienna / John Playford 1686 for term 'vienna': named creator 'John Playford 1686' is not one of the expected (billy joel, joel)
- QmX2w4HB85MtoYoE7fQzSa7PekKLsBXKPwKGJWfGcmYtPF: Love of My Life / J-38 for term 'love of my life': named creator 'J-38' is not one of the expected (queen, freddie mercury, mercury, brian may)
- QmXkRAFeUbpaAc97G5qzTCqXvcVnqQfB7nAnQX1eeiLRkg: A Thousand Miles / Words & Music by: for term 'a thousand miles': named creator 'Words & Music by:' is not one of the expected (vanessa carlton, carlton)
- QmezcTpfqnmpEmknZVhthdisgh389F7ntqdjqnxQ6ZvjkC: Yesterday - Atmosphere / Atmosphere for term 'yesterday': named creator 'Atmosphere' is not one of the expected (beatles, lennon, mccartney, harrison, starr)
- QmVjb9yUKy24pdyVrt9R3arNS1xcEUEWxyAaTRjjLAQ9sd: Yesterday / Michael Lai1 for term 'yesterday': named creator 'Michael Lai1' is not one of the expected (beatles, lennon, mccartney, harrison, starr)
- QmdZWWR1cNCUmAb4hNXAc7V9qnxMMUpEtQyusxZ2hA5fk2: Tom Odell - Piano Man / Transcribed by Etienne Eichenauer for term 'piano man': named creator 'Tom Odell' is not one of the expected (billy joel, joel)
- QmbcFgg83SvSyh486PifDHfaFcjez9uQf6xJyAnYtrr1Av: Iris (Professor Layton and the Diabolical Box: End Theme) / Shiawase no Hako for term 'iris': named creator 'Shiawase no Hako' is not one of the expected (goo goo dolls, rzeznik)
- QmUu4hVtKC1dQynctj71LpNByaado4QMDCwL36yWagaocH: The Way (Just The Way You Are) / Bruno MarsArranged by Rebekah Bollinger for term 'just the way you are': named creator 'Bruno MarsArranged by Rebekah Bollinger' is not one of the expected (billy joel, joel)
- QmRyuCGUtT4ezbcQ4iwwxjSW8dGEPo89xeWZQGCUpxiVQ3: something / elrune4 for term 'something': named creator 'elrune4' is not one of the expected (beatles, lennon, mccartney, harrison, starr)
- ... and 72 more in quarry-results.json

### Terms with zero matches for the configured term

hey jude, here comes the sun, tiny dancer, goodbye yellow brick road, don't stop me now, bohemian rhapsody, easy on me, fake plastic trees

Hits per term: let it be=21; hey jude=0; yesterday=4; something=5; while my guitar gently weeps=1; here comes the sun=0; your song=6; tiny dancer=0; rocket man=1; goodbye yellow brick road=0; piano man=8; vienna=16; she's always a woman=3; just the way you are=4; don't stop me now=0; somebody to love=2; bohemian rhapsody=0; love of my life=2; someone like you=4; easy on me=0; when we were young=1; the scientist=5; clocks=4; fix you=7; viva la vida=23; creep=12; karma police=1; no surprises=4; fake plastic trees=0; hallelujah=47; mad world=10; stand by me=31; imagine=19; lean on me=2; bridge over troubled water=1; a thousand miles=1; chasing cars=2; iris=2


## Lane J-rock

Goal: riff/ostinato; power-chord or fifth texture that survives reduction; arpeggio over pedal; register/density/build/drop; rock.8 (reduce 8-16 bars) and rock.9 (full arrangement) candidates

Hits: 61 rows. Identity verdicts over hits: MATCH 30, MISMATCH 17, TITLE_ONLY 12, n/a 2.

### Dumped scores

| CID | Title | Artist / composer | Identity | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | XML bytes | Why / where |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmVcTJtm4y12CUByxJjVMnahC4YpxXGGzVJ1jLUwzj9hCt | Heart-Shaped Box (Advanced Piano Solo) | Nirvana / Composed by Kurt Cobain & Ramin DjawadiPiano arrangement by Nicolas Del GalloFull playthrough and more athttps://www.youtube.com/c/NDGmusicIf you want to donate please check out my Patreon âºhttps://www.patreon.com/ndg | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 64 | 0 | 4.92 (69) | 2226 | unknown | 592820 | top distinct song #1 (rank 1, identity MATCH); `xml/J-rock/heart-shaped-box-advanced-piano-solo-QmVcTJtm4y12CUByxJjVMnahC4YpxXGGzVJ1jLUwzj9hCt.musicxml` |
| QmSwE96nL8TCeEWcQxscpMdokPhncLkWEsmeL9BymCVSqk | Heart shaped box - Drum score | Nirvana /  | MATCH | PIANO1 | Drumset | 4/4 | 63 | 0 | 4.28 (4) | 528 | unknown | 380088 | song 'heart shaped box'; alternate edition kept: shape PIANO1 vs PIANO_GRAND_STAFF; `xml/J-rock/heart-shaped-box-drum-score-QmSwE96nL8TCeEWcQxscpMdokPhncLkWEsmeL9BymCVSqk.musicxml` |
| Qmd5N328ZLCNKvpbouEXSxYti12dx9n5tVEcpHpbq4GKE4 | Heart Shaped Box Drum set Part |  / Nirvana | TITLE_ONLY | PIANO1 | Drumset | 4/4 | 113 | 0 | 0.00 (0) | 349 | unknown | 657019 | song 'heart shaped box'; alternate edition kept: shape PIANO1 vs PIANO_GRAND_STAFF; `xml/J-rock/heart-shaped-box-drum-set-part-Qmd5N328ZLCNKvpbouEXSxYti12dx9n5tVEcpHpbq4GKE4.musicxml` |
| QmVsJV6oJeAC4MnbePt17zysoFrdyvs5PDokfM8NLxUhJs | Linkin Park - NUMB piano cover | Linkin Park / Linkin Parkarr. by Anatole Piano Songs | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 85 | 0 | 4.86 (12) | 1458 | unknown | 560041 | top distinct song #2 (rank 2, identity MATCH); `xml/J-rock/linkin-park-numb-piano-cover-QmVsJV6oJeAC4MnbePt17zysoFrdyvs5PDokfM8NLxUhJs.musicxml` |
| QmWQLEEEZtuRkzRLC5D951wXXVj6tToNth5C59bFVJiGga | Numb | Linkin Park /  | MATCH | MIXED_WITH_PIANO | Flauta; Violino; Violino; Violoncelo; Piano | 4/4 | 84 | 85 | 4.78 (11) | 2831 | in-copyright | 547535 | song 'numb'; alternate edition kept: shape MIXED_WITH_PIANO vs PIANO_GRAND_STAFF; `xml/J-rock/numb-QmWQLEEEZtuRkzRLC5D951wXXVj6tToNth5C59bFVJiGga.musicxml` |
| Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf | Muse - Hysteria | Muse / Muse | MATCH | PIANO_GRAND_STAFF | Piano; Drumset | 4/4 | 83 | 0 | 4.74 (44) | 7075 | unknown | 1356236 | top distinct song #3 (rank 3, identity MATCH); `xml/J-rock/muse-hysteria-Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf.musicxml` |
| QmaxP2mCUy7TnpX55nhZZsVYe4n93Z9TzSsCgtFKc4KyzH | Comfortably Numb Piano Solo | Pink Floyd / Arr. Andrew Wrangell | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 52 | 0 | 4.55 (39) | 2423 | unknown | 170939 | top distinct song #4 (rank 4, identity MATCH); `xml/J-rock/comfortably-numb-piano-solo-QmaxP2mCUy7TnpX55nhZZsVYe4n93Z9TzSsCgtFKc4KyzH.musicxml` |
| QmdGGr7gDBP2yosg6rvEBZhZE6T5ibDGCAX35YQFEvqrJ5 | Paint It Black (Advanced Piano Solo) | The Rolling Stones / Composed by The Rolling Stones & Ramin DjawadiPiano arrangement by Nicolas Del GalloFull playthrough and more athttps://www.youtube.com/c/NDGmusicIf you want to donate please check out my Patreon âºhttps://www.patreon.com/ndg | MATCH | PIANO_GRAND_STAFF | Piano | 4/4,6/8,9/8,6/4,5/4 | 153 | 0 | 0.00 (0) | 531 | unknown | 893627 | top distinct song #5 (rank 6, identity MATCH); `xml/J-rock/paint-it-black-advanced-piano-solo-QmdGGr7gDBP2yosg6rvEBZhZE6T5ibDGCAX35YQFEvqrJ5.musicxml` |
| QmdvHDt8aJcLBiY8ZmG7o5t9QDfmqDp9XhmqMquCL95knL | Starlight MUSE | Muse / Arr. Irene L?pez | MATCH | MIXED_WITH_PIANO | Violí; Piano | 4/4 | 118 | 0 | 4.79 (21) | 5017 | unknown | 705253 | top distinct song #6 (rank 9, identity MATCH); `xml/J-rock/starlight-muse-QmdvHDt8aJcLBiY8ZmG7o5t9QDfmqDp9XhmqMquCL95knL.musicxml` |
| QmUZdYocuapo9pjAs7Qbb5JSfhZHyp24Rbm9oZGnWWWq74 | Come As You Are |  / Nirvana | MATCH | MIXED_WITH_PIANO | Marimba 1; Marimba 2; Vibraphone 1; Vibraphone 2; Glockenspiel; Synthesizer; Drumset | 4/4 | 26 | 0 | 0.00 (0) | 319 | unknown | 523188 | top distinct song #7 (rank 10, identity MATCH); `xml/J-rock/come-as-you-are-QmUZdYocuapo9pjAs7Qbb5JSfhZHyp24Rbm9oZGnWWWq74.musicxml` |
| QmXQNZvfM491cT1Xxn4AK3s2Vgvjn4CEtCtWNUCPQmKoi2 | Muse - New Born | Muse / Muse | MATCH | MIXED_WITH_PIANO | Clarinette; Piano électrique; Piano; Guitare électrique; Guitare électrique; Basse acoustique; Batterie | 4/4 | 212 | 0 | 4.85 (4) | 690 | unknown | 3034460 | top distinct song #8 (rank 11, identity MATCH); `xml/J-rock/muse-new-born-QmXQNZvfM491cT1Xxn4AK3s2Vgvjn4CEtCtWNUCPQmKoi2.musicxml` |


### Next 10 ranked, undumped (MISMATCH excluded)

| Rank | CID | Title | Artist / composer | Identity | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | QmTzWWHsPTNhYHLDFopKjbwNcKCab8GHjh6VyVyQkZQKoY | Linkin Park Numb | Linkin Park /  | MATCH | PIANO_GRAND_STAFF | 4/4 | 77 | 0 | 4.46 (25) | 11164 | in-copyright | numb |
| 8 | QmSJzEuFNj2EzEMDpZLsNPQ4EEBe44yykhk6rTNqGbfVpm | Numb |  / Linkin Park | MATCH | MIXED_WITH_PIANO | 4/4 | 84 | 76 | 0.00 (0) | 177 | in-copyright | numb |
| 12 | QmYXmyZyGp2FUzjDvVF1zRT4eVcA2XrvSUq543cQW4wY3C | aloha line 2020 | Foo Fighters /  | MATCH | MIXED_WITH_PIANO | 3/4,2/4,4/4 | 168 | 0 | 0.00 (0) | 84 | unknown | everlong |
| 13 | QmRTYFZ2SkBWbqwDpAqfCsZiou1KGVUVAogH1dg7z7RUNG | Starlight - Muse | Muse / Muse | MATCH | MIXED_WITH_PIANO | 4/4 | 135 | 0 | 4.37 (5) | 21877 | unknown | starlight |
| 14 | QmWUQJBDFEQ9xHjGPWqEn6goguxFEbtu72QvM4FKnQEVWF | The Pretender | Foo Fighters / Foo Fighters | MATCH | PIANO1 | 4/4,2/4 | 119 | 0 | 4.71 (4) | 399 | unknown | the pretender |
| 15 | QmbMbvEkkzvJwKsSXfKHcufXFGv8y87GxcVgz9GRCKEEcb | Another Brick in the Wall | Pink Floyd / Pink Floyd | MATCH | PIANO1 | 4/4 | 52 | 0 | 0.00 (0) | 5661 | unknown | another brick in the wall |
| 16 | QmcAA9JrE3AbvgGiBgWy6ACTNFDPzESomoCyQe9cDpbEme | Everlong | Foo Fighters / Dave Grohl | MATCH | PIANO1 | 4/4 | 93 | 0 | 4.68 (16) | 1468 | unknown | everlong |
| 18 | QmUDpayYuFPz3b8f3PUAEHXb8sjkhsKyugUL2ahg2QaVJb | Comfortably Numb - Pink Floyd | Pink Floyd / Pink Floyd | MATCH | OTHER | 4/4 | 75 | 38 | 4.79 (7) | 411 | unknown | comfortably numb |
| 19 | QmRgEWWye1wYyQLeWFrbWaon76yPQjSFDAWcehyyVSESJn | Whis you were here (Orquesta) | Pink Floyd / Roger Waters - David Gilmour | MATCH | OTHER | 4/4 | 74 | 69 | 4.71 (4) | 2168 | unknown | wish you were here |
| 20 | QmVQw7yAM2vf6jZnFMLEY61mwegeu1dcYRv5tqDGgNF1RD | Wish You Were Here | Pink Floyd /  | MATCH | OTHER | 4/4 | 26 | 24 | 0.00 (0) | 194 | unknown | wish you were here |

### Identity MISMATCH hits: 17 (none dumped)

- QmXa9z3uvLgfHVBeipuo6vhLCQiBTg1TJxcqUUaQTX13BD: Time - Hans Zimmer - Inception / Hans Zimmer for term 'time': named creator 'Hans Zimmer' is not one of the expected (pink floyd, waters, gilmour)
- QmPGGYQQgfQ2Y23NnE5FCSePFtuy2ogSQNucSgp6oBmGYd: Time - inception Piano / Composer: Hans Zimmer Arranged by: Joey Wetzels for term 'time': named creator 'Composer: Hans Zimmer Arranged by: Joey Wetzels' is not one of the expected (pink floyd, waters, gilmour)
- Qmcg2yJgkjwhewRFbb5hzpR1BNT1u5taVR3jfA2oASbQ3K: Starlight - C. S. Beatson / C. S. Beatson for term 'starlight': named creator 'C. S. Beatson' is not one of the expected (muse, bellamy)
- QmVXqTjCoG7QefFJYNDN1S4JB5z4kmSciHLq86ZGD9BqXc: Time by Tom Waits (Piano & Voice) / Tom Waits for term 'time': named creator 'Tom Waits' is not one of the expected (pink floyd, waters, gilmour)
- QmUMQPP4oBTMpGeZTJZcwjjTgVr6Z4s2M2gwH5LNpiBekW: Time / Hans Zimmer for term 'time': named creator 'Hans Zimmer' is not one of the expected (pink floyd, waters, gilmour)
- Qmejf6PLC2wVE2ddPfQV4y76EpkfvFCBCxuRmpniiY4L7v: Starlight / henrys20008181 for term 'starlight': named creator 'henrys20008181' is not one of the expected (muse, bellamy)
- QmSREE1ZySBJBEvR6FQHX5dUfmQYodEwv4SWmJgEKGbBLN: time / Travis Lambos for term 'time': named creator 'Travis Lambos' is not one of the expected (pink floyd, waters, gilmour)
- QmdZQWD9WQx3SsPNN6yecCKFm4TFsSvGsUE3Gr8yXzh9tq: Starlight / Elizabeth Kyriakides for term 'starlight': named creator 'Elizabeth Kyriakides' is not one of the expected (muse, bellamy)
- QmeB45pszLRBaVfejyQ9diZaHZhKNVZr2R6ucMZUsY7RVx: Satisfaction / Tune is air by Purcell for term 'satisfaction': named creator 'Tune is air by Purcell' is not one of the expected (rolling stones, jagger, richards)
- Qmeqy9kKweDjSbXTvrpcdNE3HJ3VE6tfBDnaRpHcuxA2rv: Time / MKJ for term 'time': named creator 'MKJ' is not one of the expected (pink floyd, waters, gilmour)
- ... and 7 more in quarry-results.json

### Terms with zero matches for the configured term

we will rock you, another one bites the dust, day tripper, helter skelter, gimme shelter, whole lotta love, uprising, time is running out, in the end

Hits per term: we will rock you=0; another one bites the dust=0; paranoid android=2; come together=1; day tripper=0; helter skelter=0; paint it black=3; gimme shelter=0; satisfaction=1; stairway to heaven=1; kashmir=1; whole lotta love=0; comfortably numb=2; wish you were here=3; another brick in the wall=2; time=9; uprising=0; starlight=6; time is running out=0; hysteria=3; new born=1; smells like teen spirit=6; come as you are=3; heart-shaped box=3; heart shaped box=3; everlong=3; the pretender=3; numb=6; in the end=0; bring me to life=1; my immortal=1


## Lane K-metal

Goal: pedal-tone riffs; octave/fifth riff reduction; repeated-note ostinato; syncopated chord attacks; odd meter or meter change; acoustic/ballad to heavy build; multi-section song for reduction decisions; full-arrangement capstone

Hits: 52 rows. Identity verdicts over hits: MATCH 22, MISMATCH 16, TITLE_ONLY 14.

### Dumped scores

| CID | Title | Artist / composer | Identity | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | XML bytes | Why / where |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmS4UQ3cPqnpBJ2PiBZ5Z79Ky4dg4HEmfSfoJ4D6utRx2g | Iron man - Black Sabbath | Black Sabbath /  | MATCH | LEADSHEET | Guitarra Elétrica | 4/4,2/4 | 54 | 121 | 0.00 (0) | 3 | unknown | 195081 | top distinct song #1 (rank 1, identity MATCH); `xml/K-metal/iron-man-black-sabbath-QmS4UQ3cPqnpBJ2PiBZ5Z79Ky4dg4HEmfSfoJ4D6utRx2g.musicxml` |
| QmeuoFT1hEJntEUswkFFoJ8UisTFHhjNiW236bsUeiAG7X | Lonely Day | System of a Down / Arranged by Sofía Matus Cancino | MATCH | PIANO_GRAND_STAFF | Piano | 6/8 | 103 | 0 | 4.75 (9) | 314 | unknown | 536992 | top distinct song #2 (rank 2, identity MATCH); `xml/K-metal/lonely-day-QmeuoFT1hEJntEUswkFFoJ8UisTFHhjNiW236bsUeiAG7X.musicxml` |
| QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo | Enter Sandman | Metallica / MetallicaArr: Anders Thue | MATCH | PIANO_GRAND_STAFF | Piano | 4/4 | 148 | 0 | 4.88 (90) | 4507 | unknown | 1011172 | top distinct song #3 (rank 3, identity MATCH); `xml/K-metal/enter-sandman-QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo.musicxml` |
| QmXFHNzdRue8ptGgsQgBvoFiseKUSmik3FNZpV5w15fAtv | Fear of the Dark | Iron Maiden / Iron Maiden | MATCH | MIXED_WITH_PIANO | Alt Saxophon; Alt Saxophon; Tenor Saxophon; Tenor Saxophon; Bariton Saxophon; B Trompete; B Trompete; B Trompete; B Trompete; Posaune; Posaune; Posaune; Posaune; Elektrische Gitarre; Klavier; Elektrischer Bass; Schlagzeug | 4/4,2/4 | 176 | 57 | 4.82 (19) | 1482 | unknown | 6611911 | top distinct song #4 (rank 4, identity MATCH); `xml/K-metal/fear-of-the-dark-QmXFHNzdRue8ptGgsQgBvoFiseKUSmik3FNZpV5w15fAtv.musicxml` |
| QmVEitoYcGGs3WPRCkTdygEEtgdytbP7iSDuAwkAipg9wi | Hallowed_be_thy_Name | Iron Maiden / Iron Maiden | MATCH | MIXED_WITH_PIANO | Guitare électrique; Piano; Tubular Bells; Guitare Basse; Batterie | 4/4 | 204 | 185 | 4.79 (7) | 323 | unknown | 4390067 | top distinct song #5 (rank 5, identity MATCH); `xml/K-metal/hallowed-be-thy-name-QmVEitoYcGGs3WPRCkTdygEEtgdytbP7iSDuAwkAipg9wi.musicxml` |
| QmXD2aZpJZY27ZJjxsS69dysWp9FtvouuQymLi1ibBDTY9 | Dream Theater: Pull Me Under | Dream Theater / Dream Theater | MATCH | PIANO1 | Rumpusetti | 4/4 | 32 | 0 | 4.81 (8) | 1885 | unknown | 202481 | top distinct song #6 (rank 6, identity MATCH); `xml/K-metal/dream-theater-pull-me-under-QmXD2aZpJZY27ZJjxsS69dysWp9FtvouuQymLi1ibBDTY9.musicxml` |
| Qmc2BawopkxrFy6ekhYKAB8qzukZn4pxFpcefQfQ7X8tP6 | Metallica - One | Metallica / transcribed from Drumeo | MATCH | PIANO1 | Drumset | 4/4,2/4,3/4,6/4 | 198 | 0 | 0.00 (0) | 3427 | unknown | 1260506 | top distinct song #7 (rank 7, identity MATCH); `xml/K-metal/metallica-one-Qmc2BawopkxrFy6ekhYKAB8qzukZn4pxFpcefQfQ7X8tP6.musicxml` |
| QmZZoMtA54kgni7gFcrBDdSsm1TGMuE1FzomzFbuGfP7Lq | Master of Puppets: Metallica | Metallica / Composer | MATCH | PIANO1 | Piano | 4/4,5/8,2/4 | 267 | 0 | 4.61 (20) | 5658 | unknown | 571817 | top distinct song #8 (rank 8, identity MATCH); `xml/K-metal/master-of-puppets-metallica-QmZZoMtA54kgni7gFcrBDdSsm1TGMuE1FzomzFbuGfP7Lq.musicxml` |
| QmbwnWBK5FE51CVpqjZ4fSQW87SX1MNzehooGRbNPDrkfm | A Little Piece Of Heaven Avenged Sevenfold Patrick Ceelen | Avenged Sevenfold / Arranged By Patrick Ceelen | TITLE_ONLY | MIXED_WITH_PIANO | Piano; Elektrische piano; Violin 1; Violin 2; B♭ Trumpet; Bass Guitar; Electric Guitar; Drumset; Soprano; Alto Vocals; Tenor Vocals; Bass Vocals | 4/4,2/4,6/4,3/4,5/4 | 206 | 0 | 0.00 (0) | 292 | unknown | 3282927 | explicitly requested: A Little Piece of Heaven (A7X), dumped whatever its size; `xml/K-metal/a-little-piece-of-heaven-avenged-sevenfo-QmbwnWBK5FE51CVpqjZ4fSQW87SX1MNzehooGRbNPDrkfm.musicxml` |


### Next 10 ranked, undumped (MISMATCH excluded)

| Rank | CID | Title | Artist / composer | Identity | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 9 | QmT6CY7T7tZmBn9tFm8z6SvfvhdBGNubTguXHBRqCDLcAa | Nightwish - Ghost Love Score | Nightwish /  | MATCH | OTHER | 6/8,5/8,4/4,3/4 | 41 | 0 | 4.85 (17) | 1019 | unknown | ghost love score |
| 10 | QmTqqMaBHWUp9D5UZyBQLQEKH7uivDdctjuz4RftniwCUi | Sleeping Sun - Nightwish | Nightwish / Nightwish | MATCH | OTHER | 4/4 | 109 | 0 | 4.78 (24) | 2372 | unknown | sleeping sun |
| 11 | QmUogXHphbjSoZLBwi8HwmtsXYkXEKrGfRsFD6rtBeBth9 | Enter Sandman | Metallica / Metallica | MATCH | OTHER | 4/4 | 103 | 0 | 4.81 (8) | 4726 | unknown | enter sandman |
| 12 | QmQcW511ZeWiRToMi9u7YgFVfsTPqh1F3ujXxS1xieWDEE | Toxicity - by System of a Down for Pep Band | System of a Down / System of a Down | MATCH | OTHER | 6/8 | 96 | 0 | 0.00 (0) | 211 | unknown | toxicity |
| 13 | QmbBjkHNUxSYHARLNVRxC6s35gCq5BmPu5RH6zzafmAkxF | The_Trooper |  / Iron Maiden | MATCH | OTHER | 4/4 | 100 | 0 | 0.00 (0) | 64 | unknown | the trooper |
| 14 | QmSDfkymyBgWw21XnHtMaybiravQLn8GyZfpzaZqdp5Ypf | The trooper - Iron Maiden | Iron Maiden /  | MATCH | OTHER | 4/4 | 96 | 0 | 0.00 (0) | 46 | unknown | the trooper |
| 15 | QmZLzHd4oDzj2Xf5GRSCgdUcQpLgX4MbXRfkAGRWwneyaw | Can You Feel My Heart | Bring Me the Horizon / BMTH | MATCH | OTHER | 4/4 | 117 | 0 | 4.62 (5) | 743 | unknown | can you feel my heart |
| 16 | QmY4B3zHPUGLAuLYW4oXJ5ZwxiCRSyfjbMP5apEZBrJs57 | Master of Puppets | Metallica / Andreu Ramos | MATCH | OTHER | 4/4,2/4 | 293 | 0 | 4.87 (27) | 5047 | unknown | master of puppets |
| 17 | QmQRLbcCwjmGDt5RLpLEvJy82Bs85MsRPE86FSxzQYLP1H | Metallica Nothing Else Matters | Metallica / Words & Music by James Hetfield and Lars Ulrich | MATCH | OTHER | 6/8,9/8 | 150 | 0 | 4.79 (70) | 6363 | unknown | nothing else matters |
| 18 | QmSoCAJVo3tBk8AZDZWo2cThifqS2G4sJo4RC2EX1hCH6R | Fade to Black - Concert Band Arrangement | Metallica / Metallica | MATCH | OTHER | 4/4 | 219 | 0 | 0.00 (0) | 250 | unknown | fade to black |

### Identity MISMATCH hits: 16 (none dumped)

- QmYMwuVDWaUifsjW8KyvZeBoAtwZ7dtSZh5yaTaWsNfFin: Nightmare / Anne Brauer for term 'nightmare': named creator 'Anne Brauer' is not one of the expected (avenged sevenfold, a7x, m shadows, synyster gates, zacky vengeance)
- QmPkrozso5t5EUhqZ8K4xKe7TZLjQo1RamqE9CgboAoXXb: HARVEST (Tours) - Berthold Tours / Berthold Tours for term 'harvest': named creator 'Berthold Tours' is not one of the expected (opeth, akerfeldt)
- Qmbhy7Ew2Bavm1yvDZP9PU75PvPvFifoCEy9fz7ixhx2hC: HARVEST (Seward) - Theodore F. Seward / Theodore F. Seward for term 'harvest': named creator 'Theodore F. Seward' is not one of the expected (opeth, akerfeldt)
- QmZK3uU7JuHLE7oaKJEMysg1W8GQoYeEAF7i8q8mFzRK9k: HARVEST (Menthal) - R. Menthal / R. Menthal for term 'harvest': named creator 'R. Menthal' is not one of the expected (opeth, akerfeldt)
- QmcnNkzxpxU5Jvop8JEFcWLa8P13G1e36KDBsFD3zsN9bV: Harvest - Hai to Gensou no Grimgar ED / Composed by: (K)NoW_NAME for term 'harvest': named creator 'Composed by: (K)NoW_NAME' is not one of the expected (opeth, akerfeldt)
- QmQJ2eRNfiiXG6kZQ6dFKMAG8WogkNcyZZker6MzGoS6vu: Nightmare / Emily Prout for term 'nightmare': named creator 'Emily Prout' is not one of the expected (avenged sevenfold, a7x, m shadows, synyster gates, zacky vengeance)
- QmQwsDxpo5oPDKycteKCuXikrdpLrjiiDNfxBFVfw53vPo: Orion SSAA / arr. by Kileen McLeary for term 'orion': named creator 'Kenshi Yonezu (ç³æ çå)' is not one of the expected (metallica, hetfield, ulrich, hammett)
- QmQRDDdWfrNJHtx6mTnN5YMb5hSBaTb9nRf7bdANpvw6i8: HARVEST (Frost) / Charles Joseph Frost 1889 for term 'harvest': named creator 'Charles Joseph Frost 1889' is not one of the expected (opeth, akerfeldt)
- QmaJVLhaErqCLMJVKUe9yog5ZUDxR7hTWx4SKLemDpTa52: Toxicity / Joel Gonzalez for term 'toxicity': named creator 'Joel Gonzalez' is not one of the expected (system of a down, soad, serj tankian, daron malakian, tankian, malakian)
- QmNdoXtrY38tv33pf8gEPDH3vFizRmjbisGMsu7B11cdZo: One (your name) / C. Ryan for term 'one': named creator 'C. Ryan' is not one of the expected (metallica, hetfield, ulrich, hammett)
- ... and 6 more in quarry-results.json

### Terms with zero matches for the configured term

metal piano, metallica piano, avenged sevenfold piano, rock piano arrangement, metal piano arrangement, progressive metal, power metal, symphonic metal, seize the day, so far away, buried alive, bat country, aerials, chop suey, another day, the spirit carries on, war pigs, snuff, vermilion, windowpane, nemo

Hits per term: metal piano=0; metallica piano=0; avenged sevenfold piano=0; rock piano arrangement=0; metal piano arrangement=0; progressive metal=0; power metal=0; symphonic metal=0; nothing else matters=1; fade to black=2; one=4; master of puppets=4; enter sandman=2; the unforgiven=1; orion=1; seize the day=0; so far away=0; buried alive=0; nightmare=2; hail to the king=2; afterlife=1; a little piece of heaven=1; bat country=0; aerials=0; toxicity=3; chop suey=0; lonely day=1; another day=0; pull me under=1; the spirit carries on=0; fear of the dark=2; the trooper=8; hallowed be thy name=1; iron man=2; paranoid=2; war pigs=0; snuff=0; vermilion=0; windowpane=0; harvest=7; nemo=0; sleeping sun=1; ghost love score=1; can you feel my heart=1; drown=1


## Lane L-artists

Goal: personal-library expansion by artist; top 20 distinct songs per artist; flag personal-library wins even when no rung needs them

### Avenged Sevenfold: 4 rows, 4 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | A Little Piece Of Heaven Avenged Sevenfold Patrick Ceelen | QmbwnWBK5FE51CVpqjZ4fSQW87SX1MNzehooGRbNPDrkfm | 1 | MIXED_WITH_PIANO | Piano; Elektrische piano; Violin 1; Violin 2; B♭ Trumpet; Bass Guitar; Electric Guitar; Drumset; Soprano; Alto Vocals; Tenor Vocals; Bass Vocals | 4/4,2/4,6/4,3/4,5/4 | 206 | 0 | 0.00 (0) | 292 | unknown | yes |
| 2 | Avenged Sevenfold - Almost Easy | QmSc3G9zSwyGhYXksJCyGQLJBpGfKYC248hC2nTdrySSD6 | 1 | PIANO1 | Drumset, Almost Easy | 2/4,4/4,3/4 | 198 | 0 | 4.90 (8) | 862 | in-copyright | yes |
| 3 | Shepherd of Fire - Brass Ensemble | Qmcw7Z3fDFBJg2xxLRPAZt5HjVzG6hyS8jNuoxf4A3ZRRR | 1 | OTHER | Horn in F; Horn in F; B♭ Trumpet; B♭ Trumpet; Trombone; Euphonium; Euphonium; Tuba; Tubular Bells; Drumset | 4/4 | 68 | 0 | 0.00 (0) | 3129 | unknown | no |
| 4 | Chapter Four | QmcgPQjWHv1eeNRwJEPxKu1gYkrV7UNM5mqiXkbqBCvRqw | 1 | OTHER | Piccolo; Flute; B♭ Clarinet; B♭ Clarinet; Bass Clarinet; Alto Saxophone; B♭ Trumpet; B♭ Trumpet; Mellophone; Trombone; Baritone Horn; Sousaphone; Snare Drum; Tenor Drums; Bass Drums; Cymbals | 4/4,3/4 | 126 | 0 | 0.00 (0) | 184 | in-copyright | no |

### Metallica: 15 rows, 11 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Enter Sandman | QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo | 2 | PIANO_GRAND_STAFF | Piano | 4/4 | 148 | 0 | 4.88 (90) | 4507 | unknown | yes |
| 2 | for whom the bell tolls | Qmecq9RSLpMfuaEajmskZq9ueZGk97qvmdx78JFWNSuiRD | 1 | MIXED_WITH_PIANO | Voice; Electric Guitar; Electric Piano; Crystal Synthesizer; Bass Guitar; Drumset; Electric Guitar | 4/4 | 132 | 0 | 4.83 (3) | 272 | unknown | yes |
| 3 | Metallica - One | Qmc2BawopkxrFy6ekhYKAB8qzukZn4pxFpcefQfQ7X8tP6 | 1 | PIANO1 | Drumset | 4/4,2/4,3/4,6/4 | 198 | 0 | 0.00 (0) | 3427 | unknown | yes |
| 4 | Trough The Never: Metallica | QmYKpXdLhNEmuSxT9zkkmMNDuVSGRyT2bie6J9fhmiPcdn | 1 | PIANO1 | Drumset | 4/4,6/4,3/4 | 167 | 0 | 0.00 (0) | 101 | unknown | yes |
| 5 | Master of Puppets: Metallica | QmZZoMtA54kgni7gFcrBDdSsm1TGMuE1FzomzFbuGfP7Lq | 3 | PIANO1 | Piano | 4/4,5/8,2/4 | 267 | 0 | 4.61 (20) | 5658 | unknown | yes |
| 6 | The Unforgiven_Mandolin | QmXHs14JL6Y8gZ8sSGwKjaqYexHqTWxD7AtrH8kMBqJ5Yx | 1 | OTHER | Mandolin; Mandolin | 4/4,2/4 | 70 | 20 | 4.66 (6) | 233 | unknown | no |
| 7 | Unforgiven - Fingerstyle cover | QmcN25LVZE8V2p9Mku4fYetGpQJFzYYk7FWyBYZAKnY4xX | 1 | OTHER | Akustische Gitarre; Akustische Gitarre [Tabulatur] | 4/4 | 80 | 0 | 4.84 (10) | 866 | unknown | no |
| 8 | mama said | QmQPuXwbt6F6HseGd2kcFfaN6orUm32G7rqGNER1CGbc8T | 1 | OTHER | Voice; Electric Guitar; Piano; Electric Bass; Drumset | 4/4,5/4,3/4 | 89 | 0 | 0.00 (0) | 223 | unknown | no |
| 9 | Linus And Lucy | QmX8ex4XBQ3nJR1EbzYXaiM1nSk9AkefzySq6kBgNLKgSc | 1 | OTHER | Violin; Violin; Viola; Viola | 4/4 | 39 | 0 | 4.66 (3) | 172 | unknown | no |
| 10 | Metallica Nothing Else Matters | QmQRLbcCwjmGDt5RLpLEvJy82Bs85MsRPE86FSxzQYLP1H | 1 | OTHER | Alto Flute; Flute; Guitar 1; Guitar 2; Guitar 3; Guitar 4; Guitar 5; Violins; Bass; Drumset | 6/8,9/8 | 150 | 0 | 4.79 (70) | 6363 | unknown | no |
| 11 | Fade to Black - Concert Band Arrangement | QmSoCAJVo3tBk8AZDZWo2cThifqS2G4sJo4RC2EX1hCH6R | 2 | OTHER | Flute; Oboe; B♭ Clarinet; Soprano Saxophone; Alto Saxophone; Tenor Saxophone; B♭ Trumpet; Horn in F; Marimba; Drumset; Electric Guitar; Electric Guitar; Acoustic Guitar; 5-str. Electric Bass; Violin; Violoncello | 4/4 | 219 | 0 | 0.00 (0) | 250 | unknown | no |

### Muse: 35 rows, 26 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Space Dementia | QmZ3vfJw1vS5Me9KDoUYSm7RYU4FYSAwioiFHbtogRihgd | 1 | PIANO_GRAND_STAFF | Piano | 4/4,6/8 | 74 | 69 | 4.82 (75) | 11270 | unknown | yes |
| 2 | Screenager | QmPJdhKPHYYoLPspsFtYoFX8nzZUkyAuw85Rm7bhmptBub | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 41 | 30 | 4.88 (6) | 399 | unknown | yes |
| 3 | Hoodoo (Live piano) | QmQGS6WCqjnbvLW5G3HrsBhLhYxyeziMnw2YM1NXx6STUw | 1 | PIANO_GRAND_STAFF | Piano | 12/8,6/8,2/4,3/4 | 52 | 0 | 4.81 (8) | 939 | unknown | yes |
| 4 | Muse - Hysteria | Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf | 3 | PIANO_GRAND_STAFF | Piano; Drumset | 4/4 | 83 | 0 | 4.74 (44) | 7075 | unknown | yes |
| 5 | Ruled by Secrecy | QmeprydoERiDt7yuEAeGaffavEp97wAPER2AMJwsKXBr5s | 1 | PIANO_GRAND_STAFF | Piano eléctrico; Piano de cola; Piano | 6/8 | 72 | 0 | 0.00 (0) | 230 | unknown | yes |
| 6 | Muse Of Poetry (Erato) Fischer Johann Kaspar Ferdinand | QmPzbknqkv7S6dp3fcZVw3JLztdMA8tFw8qttHdtQd5vCg | 1 | PIANO_GRAND_STAFF | Harpsichord | 4/4 | 30 | 0 | 0.00 (0) | 48 | unknown | yes |
| 7 | Isolated System | QmNkxhgWU4SD1SgRWCjvWLdixkCV4YVgt2wP4F8wNACmri | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 148 | 0 | 4.92 (10) | 27223 | unknown | yes |
| 8 | Apocalypse Please | QmfVhjHh1mgJwF5jKSEZW822CqwhLUDy115Cjx6xRR2NFX | 1 | MIXED_WITH_PIANO | Piano; (Right) Synth 1; (Left) Synth 1; (Left) Synth 2; (Left) Synth 3 | 4/4 | 41 | 39 | 4.81 (13) | 1115 | unknown | yes |
| 9 | Starlight MUSE | QmdvHDt8aJcLBiY8ZmG7o5t9QDfmqDp9XhmqMquCL95knL | 2 | MIXED_WITH_PIANO | Violí; Piano | 4/4 | 118 | 0 | 4.79 (21) | 5017 | unknown | no |
| 10 | SUPREMACY | QmXuhLVT8ZPAEbpFCvMsAtiRxXeX3hYgE6UnG59PV1h8ku | 2 | MIXED_WITH_PIANO | Flute; Alto Saxophone; Alto Saxophone; Tenor Saxophone; Baritone Saxophone; BaccidentalFlat Trumpet; BaccidentalFlat Trumpet; BaccidentalFlat Trumpet; Trombone; Trombone; Electric Guitar; Electric Bass; Piano; Drumset | 3/4,4/4 | 120 | 0 | 0.00 (0) | 1139 | unknown | no |
| 11 | Madness lot tune | QmSZ3yGLHAKDLLggzmT7wMTubpe9bsd6Qdpwo4kqxij4FP | 1 | MIXED_WITH_PIANO | Marimba; Xylophone; Vibraphone; Glockenspiel; Piano | 4/4,5/4 | 32 | 0 | 0.00 (0) | 304 | unknown | no |
| 12 | Feeling Good - Muse | QmWEykmJwDqK5c2xxWmgksYEE3LoD31P3ia7j1WABo1QrT | 2 | MIXED_WITH_PIANO | Piano électrique; Saxophone Alto; Guitare électrique; Basse électrique; Batterie; Caisse claire | 6/8 | 89 | 0 | 0.00 (0) | 185 | unknown | no |
| 13 | Exogenesis: Symphony Part 3 (Redemption) | QmYP6EiWpzDazG7RCNGHv9Au8JD3hPGGbL8xBqYaB25Ek9 | 1 | MIXED_WITH_PIANO | Violins; Violas; Violoncellos; Contrabasses; Piano; Warm Synthesizer; Electric Bass; Drumset | 12/8 | 57 | 0 | 4.68 (16) | 714 | unknown | no |
| 14 | We Shall Be Known | QmdN2Ar4g4Gpuz3BY4nkpGYByEJZKR8YYfn1eJLRChZE3c | 1 | MIXED_WITH_PIANO | Oboe; Piano | 4/4 | 22 | 0 | 4.15 (10) | 937 | unknown | no |
| 15 | Muse - New Born | QmXQNZvfM491cT1Xxn4AK3s2Vgvjn4CEtCtWNUCPQmKoi2 | 1 | MIXED_WITH_PIANO | Clarinette; Piano électrique; Piano; Guitare électrique; Guitare électrique; Basse acoustique; Batterie | 4/4 | 212 | 0 | 4.85 (4) | 690 | unknown | no |
| 16 | Muse - Feeling Good (g-Moll) bass and drums | QmYNycfevEUJtDK2Ux7qE3xsEKkc2kQ9XGCozJxA4q9sGM | 1 | OTHER | Elektrischer Bass; Schlagzeug | 12/8 | 10 | 12 | 0.00 (0) | 561 | unknown | no |
| 17 | Resistance Muse | QmVq4DMmHUpAtfpWkLXciP1bfjPUfZwwqrWihTUMHvm8uF | 3 | OTHER | Trombone tenore | 4/4 | 119 | 0 | 0.00 (0) | 4241 | unknown | no |
| 18 | Muscle Museum | QmR2RdWeD4UubpU45DtMo5pRBw4Nf6337vce7inePVgJJS | 1 | OTHER | Guitare basse | 4/4 | 37 | 0 | 0.00 (0) | 448 | unknown | no |
| 19 | The Dark Side | QmT6sdjqkXRLhmf8KbXKS94S9eEwUEyuwZWhCk4JLboWQ9 | 1 | OTHER | Saxofón contralto | 4/4 | 94 | 0 | 0.00 (0) | 310 | unknown | no |
| 20 | Panic Station | QmUnAsfiGnXhKeDo8DHE5efenPTxjvMYASPkDzaRmCZV1a | 1 | OTHER | Saxofón contralto | 4/4 | 80 | 0 | 0.00 (0) | 95 | unknown | no |

### Radiohead: 24 rows, 12 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Exit Music For a Film (Advanced Piano Solo) | QmTe1Rkt8SBN7667PiUhD3FVaEGQDALGPY9Ur115aYGXyL | 1 | PIANO_GRAND_STAFF | Piano | 4/4,6/4,2/4 | 66 | 0 | 4.91 (185) | 10671 | unknown | yes |
| 2 | No Surprises | QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M | 4 | PIANO_GRAND_STAFF | Piano | 4/4 | 71 | 0 | 4.83 (33) | 1613 | unknown | yes |
| 3 | Daydreaming - Radiohead | QmQ2jgSxs7WtLpWYNhkUsRTkgvXA2q4BPSW48XsnY83N3Q | 1 | PIANO_GRAND_STAFF | Piano | 6/8,4/4 | 64 | 0 | 4.87 (13) | 1210 | unknown | yes |
| 4 | CREEP de Radiohead | QmPmjHdv6GhcNe7h31sNVm1vHKQC8DfteNMyn1jBhpJEch | 9 | PIANO_GRAND_STAFF | Piano | 4/4 | 35 | 0 | 4.73 (23) | 2966 | unknown | yes |
| 5 | Radiohead - Just | Qmao4xFiZU1ExAbaDyfxxG1pWjrutLs23dgSRgaQwLeMoM | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 70 | 0 | 4.71 (53) | 2716 | unknown | no |
| 6 | Like Spinning Plates (Live Version) | QmZcS9NvEHEyVH5wP1Y4R2cu8AxZ7jqf75Zx9MgmgSPz3d | 1 | MIXED_WITH_PIANO | Oboe; Piano; Bass Guitar; Strings | 4/4 | 85 | 0 | 4.94 (14) | 1093 | unknown | no |
| 7 | Radiohead - Codex (For Piano/Voice/Duo Trumpet) | QmQJ1UAFAArbsF9U8fSUN3ndybG9DEvdnvnAYMUkcHzFcN | 1 | MIXED_WITH_PIANO | Vocals; Piano; B♭ Trumpet | 4/4,5/4 | 40 | 0 | 4.80 (17) | 1090 | unknown | no |
| 8 | High And Dry Bass | QmWoGviXfXz7tn4eEi4hk3P6652oGjvpYdKSPs2Hh831pS | 1 | PIANO1 | Piano | 4/4 | 93 | 0 | 0.00 (0) | 664 | unknown | no |
| 9 | Karma Police | Qmeq6Qkqd2n8fEEdHEZziKY6Nin9osXFxUcvGMYvp3jWDk | 1 | OTHER | Piano | 4/4 | 48 | 105 | 0.00 (0) | 2480 | unknown | no |
| 10 | Paranoid Android - Percussion Ensemble | QmeKJv9JsEAxPG43TgRsihkv2HwH8mU17QzEkPv5r5vTXk | 2 | OTHER | Glockenspiel; Tubular Bells; Vibraphone; Xylophone; Marimba; Drumset; Bongos; Finger Cymbals; Wood Blocks; Triangle; Claves; Tambourine; Tam-tam; Vibra Slap; Cabasa | 4/4,7/8 | 88 | 0 | 4.71 (18) | 3619 | unknown | no |
| 11 | Radiohead - You (Front Ensemble Arrangement) | QmaA1RDrdz5fgdWyLJMYWT3N5LJzW9z99UUwHy4MJsAGej | 1 | OTHER | 1st Marimba; 2nd Marimba; 1st Vibraphone; 2nd Vibraphone; Bass Guitar; Drumset; Synthesizer | 6/8,5/8 | 61 | 0 | 4.55 (6) | 2566 | unknown | no |
| 12 | Motion Picture Soundtrack (Radiohead song) String Duet | QmT3jaVfEvfZg5NZJ3WLZdaC6ExsM4oiDM5EkwDr1rKjSd | 1 | OTHER | Violin; Violoncello | 4/4 | 35 | 0 | 4.50 (11) | 2911 | unknown | no |

### Pink Floyd: 33 rows, 28 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Cluster One | QmRABab4S21y1kSwm5pRfJynAZbSmwWpHs6hzZCbjT7Whp | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 92 | 22 | 4.83 (9) | 717 | unknown | yes |
| 2 | Anisina | QmcNFWCZBCoWFj7gpfjv7qJBJYX58j3SBrh9ruMBreDsg4 | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 53 | 41 | 4.87 (5) | 196 | unknown | yes |
| 3 | Autumn '68 | QmPXA4DmNdZ9i57iNvMXuggjaPjfuAU5L3NQTS3FpyTbsb | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 24 | 16 | 4.83 (3) | 264 | unknown | yes |
| 4 | Things Left Unsaid | QmQnnagVBhXDRu8vs6JEc59iP52cs1BGCdrWEnaRZie71Q | 1 | PIANO_GRAND_STAFF | Piano | 9/8,4/4 | 56 | 8 | 0.00 (0) | 703 | unknown | yes |
| 5 | Ebb and Flow | QmdBXQB9oCjzaNTAbkkwWRnzvx9TjcFeFDKtRFaQUwPium | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 24 | 4 | 0.00 (0) | 204 | unknown | no |
| 6 | Calling | Qme1x2vjMaYGAYmiQmzP92PogMHHQfSuA2DQX9LSAZALkV | 1 | PIANO_GRAND_STAFF | Piano | 4/4,2/4 | 39 | 11 | 0.00 (0) | 134 | unknown | no |
| 7 | Talkin' Hawkin' | QmZiLTrf1nhMaWv7Kbxs3YbSpd4cmccemTETuiTX4BhztJ | 1 | PIANO_GRAND_STAFF | Piano | 3/4 | 77 | 65 | 0.00 (0) | 99 | unknown | no |
| 8 | On Noodle Street | QmQW5WwGUMZcCaqfEYDFX2vi88bbi3dR7rJfiYpGKXARvq | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 44 | 83 | 0.00 (0) | 80 | unknown | no |
| 9 | Night Light | QmYz4R8uDf1Y2TeETG5TqB8aBXpY2CW5LTEbZdQLFo6P5i | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 36 | 10 | 0.00 (0) | 70 | unknown | no |
| 10 | The Lost Art of Conversation | QmYq5mGRU9Ad988BRnQ8xMJ4cKDB5G82EarHo1x81aZAmC | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 24 | 15 | 0.00 (0) | 59 | unknown | no |
| 11 | Allons-y 1 | QmcobYbcpmPHAjeKffgtGiKFW6Dd7E5494vKhYTAMK2T4Z | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 54 | 40 | 0.00 (0) | 51 | unknown | no |
| 12 | Unsung | QmerxRCze13bpAQgBa91wz2HtKfjiUPp3HJJnSm8h3eFsk | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 21 | 4 | 0.00 (0) | 49 | unknown | no |
| 13 | Allons-y 2 | QmZNT3hgiqJHZMhqoQdMZ3WbDe8hC3bzSqHh1fUyepRH28 | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 33 | 29 | 4.49 (3) | 70 | unknown | no |
| 14 | Eyes To Pearls | Qmax1R3ziiH2kdmeXPLDxeXTwVRmaKgv14dxUcmHviMTh8 | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 40 | 4 | 4.37 (5) | 141 | unknown | no |
| 15 | Sorrow | QmcXmbvTPSQ1B4ky6bxLzH14dJ2KCwGGvYkAsAxn3oPmmm | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 188 | 110 | 4.72 (8) | 860 | unknown | no |
| 16 | It's What We Do | QmTk6qsJ7A7GmD5uqx7wTAE6oWdVGXwU2n3mzD41fzo2Ca | 1 | PIANO_GRAND_STAFF | Piano | 6/8 | 146 | 26 | 4.49 (3) | 132 | unknown | no |
| 17 | Westworld - Brain Damage (S3E8) piano arrangement | QmbsWAxFRy7SpnWXohF5YQVigCbqxWdiqbdYw1pukN2yXK | 1 | PIANO_GRAND_STAFF | Piano | 4/4,3/4 | 61 | 0 | 4.76 (26) | 2388 | unknown | no |
| 18 | Comfortably Numb Piano Solo | QmaxP2mCUy7TnpX55nhZZsVYe4n93Z9TzSsCgtFKc4KyzH | 2 | PIANO_GRAND_STAFF | Piano | 4/4 | 52 | 0 | 4.55 (39) | 2423 | unknown | no |
| 19 | Another brick in the wall part II | QmfCEipLWT1XyGy7LxKcE4UG1JCTqgB1iWFYgmxq9CrZbj | 1 | MIXED_WITH_PIANO | Voice; Klavier | 4/4 | 55 | 32 | 4.44 (6) | 2298 | unknown | no |
| 20 | Keep Talking | QmWhnsDnrYbdsywhdXH3ywgozZsL5LVvu5hq4fgdhtkWW4 | 1 | MIXED_WITH_PIANO | Voice; Piano | 4/4 | 146 | 44 | 4.79 (7) | 239 | unknown | no |

### Led Zeppelin: 1 rows, 1 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Starway to heaven flutes | QmQ2ChWxgnvhbHpQEkLfzXFF9RizSjB3Jqyk49nYwBj8hS | 1 | OTHER | Flauto; Flauto | 4/4 | 30 | 0 | 4.46 (47) | 3304 | unknown | no |

### Queen: 14 rows, 11 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Aloha oe | QmZ2XRr489YtJVYSs5HUV8G89nKjqXbMUUh6o9eZhc5n51 | 3 | LEADSHEET |  | 4/4 | 18 | 19 | 0.00 (0) | 39 | unknown | yes |
| 2 | Ode To A Pumpkin I Grew | QmdyRM78Vwe2k96mHJjhaLoYwcsVPgdqNg6WjEQBFYG77A | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 16 | 0 | 0.00 (0) | 413 | unknown | yes |
| 3 | Hes coming soon - Queen Liliuokalani | QmP5sBPMPWDzBMixZdbPM9edRAoEqK6UC9dKCRNAHTPW5f | 1 | MULTI_PIANO_PART | ;  | 4/4 | 18 | 0 | 4.83 (3) | 223 | unknown | yes |
| 4 | Go and tell - Queen Liliuokalani | QmQYDH4PL6BQtmnAmpBxK6fJ9Z5PRGj1BTQD9aFYJhQtkd | 1 | MULTI_PIANO_PART | ;  | 4/4 | 18 | 0 | 0.00 (0) | 42 | unknown | yes |
| 5 | He lives on high - Queen Liliuokalani | QmTkYK2jCYi8KyZCQF9QedXMMGXK7aDYNX8DYy92UpJUSk | 1 | MULTI_PIANO_PART | ;  | 4/4 | 18 | 0 | 0.00 (0) | 34 | unknown | no |
| 6 | Susan | QmQSzRoNVt9CE3ftXNNMfC11gkKC22bbyc93Ew9s6ALcM1 | 2 | PIANO1 |  | 3/4 | 32 | 0 | 0.00 (0) | 8 | pd | no |
| 7 | England's Lamentation... HA.107 | QmSSnNWkDdvDUoEMxzW8BP7wjqgn2PxuJWtvzTysdZAujU | 1 | PIANO1 |  | 3/4 | 28 | 0 | 0.00 (0) | 8 | unknown | no |
| 8 | See see the shepherds' Queen - Thomas Tomkins | QmNXmdbCYEWfc9efcmZw59hWVWocqjLBuG4J5wnhHtR78D | 1 | OTHER | Soprano 1; Alto; Tenor; Bass | 2/2 | 96 | 0 | 0.00 (0) | 52 | unknown | no |
| 9 | God Bless You Merry Gentlemen - Tidings of Comfort and Joy as found in The overthrow of proud Holofernes and the Triumph of virtuous Queen Judith the Halliwell Collection of Broadsides No. 263 Chetham Library. | QmZdu67Y3hKzkrQRhSRZA9WRC323igMwZsjf4eTKAfZ1c1 | 1 | OTHER | Church Organ, Staff | 2/2 | 19 | 0 | 0.00 (0) | 42 | unknown | no |
| 10 | JHHS 2019 - Queen | QmQD7k97yn1mvGEfRpaWhwnuPj4CWcxGcF5fk49Aun28Uj | 1 | OTHER | Piccolo; Flute; B♭ Clarinet; Alto Saxophone; Alto Saxophone; Tenor Saxophone; B♭ Trumpet; B♭ Trumpet; Mellophone; Mellophone; Trombone; Baritone Horn; B♭ Sousaphone; Marimba; Tenor Drums; Snare Drum; Bass Drums | 4/4,3/4,2/4,6/8 | 292 | 0 | 0.00 (0) | 206 | unknown | no |
| 11 | BoRap STL Mashup | QmSTBuiWdvVuhqxijXyifBsvDD5WX4vRmPjCRDY6u3jTt1 | 1 | OTHER | Soprano; Mezzo; Alto; Tenor; Baritone; Bass; Beat Boxer; FS; MS | 5/4,4/4,2/4,3/4,12/8,6/8 | 140 | 0 | 0.00 (0) | 116 | unknown | no |

### Evanescence: 5 rows, 5 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Breathe no more EVANESCENCE | QmWKA8j5XNeR2negDESQyEkDc6M7hpu6ADou6GRHKRKRfb | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 90 | 0 | 4.78 (11) | 1721 | unknown | yes |
| 2 | my immortal in F voice & piano | QmVWSZ3vAy8prRv14TRREdLLnXk14UqrYrc1HgeisMAqqe | 1 | MIXED_WITH_PIANO | Stem; Piano, MIDI 1 | 4/4 | 48 | 65 | 0.00 (0) | 110 | unknown | yes |
| 3 | Lacrymosa SAB + Full Band | QmTTjukRKRWvhqR5CoNiFXm1uZrcSCVrGoRua4NF5dSUYv | 1 | MIXED_WITH_PIANO | Voice; Soprano; Alto; Baritone; Piano; Piano; String Synthesizer; Electric Guitar; Electric Guitar; Electric Bass; Drumset | 3/4,4/4 | 130 | 0 | 4.88 (6) | 281 | unknown | yes |
| 4 | Everybody's Fool - Evanescence | QmQaRBBTZpAsfaLHQVb28qJZb1QhWDrY6g3oF2taJpcZUQ | 1 | PIANO1 | Batterie | 4/4 | 66 | 0 | 4.56 (4) | 1837 | unknown | yes |
| 5 | Bring me to life | Qmf2LPSpTHXPH7R8UXzWX6dUqtZyucE7t23wyDRQKFetzN | 1 | OTHER | Flutes; Oboes; Clarinets in B♭; Bassoons; Horns in F; Trumpets in B♭; Timpani; Violins I; Violins II; Violas; Violoncellos; Contrabasses | 4/4 | 79 | 0 | 0.00 (0) | 2330 | unknown | no |

### System of a Down: 3 rows, 3 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Lonely Day | QmeuoFT1hEJntEUswkFFoJ8UisTFHhjNiW236bsUeiAG7X | 1 | PIANO_GRAND_STAFF | Piano | 6/8 | 103 | 0 | 4.75 (9) | 314 | unknown | yes |
| 2 | Hypnotize | QmUF29MkGVEtuy9EUPXYZKC7S123bircT6W2zJkhhW8e9C | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 136 | 0 | 0.00 (0) | 139 | unknown | yes |
| 3 | Toxicity - by System of a Down for Pep Band | QmQcW511ZeWiRToMi9u7YgFVfsTPqh1F3ujXxS1xieWDEE | 1 | OTHER | Flute I; Flute II; BaccidentalFlat Clarinet I; BaccidentalFlat Clarinet II; Alto Saxophone; Tenor Saxophone; Baritone Saxophone; BaccidentalFlat Trumpet I; BaccidentalFlat Trumpet II; F Mellophone I; F Mellophone II; Trombone I; Trombone II; BaccidentalFlat Tuba I; BaccidentalFlat Tuba II; Electric Bass; Drumset | 6/8 | 96 | 0 | 0.00 (0) | 211 | unknown | no |

### Dream Theater: 4 rows, 4 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Dream Theater - Disappear | QmbHZSWPLhqk5eU4ErBJNFmYdyFjHggpdCAd2ymqzSitFH | 1 | PIANO_GRAND_STAFF | Piano | 5/4,6/4 | 125 | 0 | 4.73 (12) | 10887 | unknown | yes |
| 2 | Wait for Sleep | QmX6C6SSN9pgaG7S9i39dU2aNoG12updXDxWjFfA3u3h8x | 1 | MIXED_WITH_PIANO | Alto; Piano; Violin; Drumset | 5/8,4/8,6/8,12/8 | 115 | 0 | 4.81 (45) | 4175 | unknown | yes |
| 3 | Puppies On Acid - A Tribute To Dream Theater | QmYNGxDPP2QiqUoEVXopowEX5F6p1FHDWEGKY8zeqSytHJ | 1 | MIXED_WITH_PIANO | Piccolo; Flute; Trumpet; Trumpet; Baritone Saxophone; Tenor Saxophone; Alto Saxophone; Alto Saxophone; Baritone Horn; Trombone; Tuba; Electric Guitar; Electric Guitar; Guitar; 12-string Guitar; Bass Guitar; Bass Guitar; Marimba; Xylophone; Drumset; Piano; Saw Synthesizer; Snare Drum; Snare Drum; Bass Drums; Sleigh Bells; Drumset | 4/4,3/4 | 169 | 0 | 0.00 (0) | 110 | unknown | no |
| 4 | Dream Theater: Pull Me Under | QmXD2aZpJZY27ZJjxsS69dysWp9FtvouuQymLi1ibBDTY9 | 1 | PIANO1 | Rumpusetti | 4/4 | 32 | 0 | 4.81 (8) | 1885 | unknown | yes |

### Iron Maiden: 7 rows, 6 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Fear of the Dark | QmXFHNzdRue8ptGgsQgBvoFiseKUSmik3FNZpV5w15fAtv | 1 | MIXED_WITH_PIANO | Alt Saxophon; Alt Saxophon; Tenor Saxophon; Tenor Saxophon; Bariton Saxophon; B Trompete; B Trompete; B Trompete; B Trompete; Posaune; Posaune; Posaune; Posaune; Elektrische Gitarre; Klavier; Elektrischer Bass; Schlagzeug | 4/4,2/4 | 176 | 57 | 4.82 (19) | 1482 | unknown | yes |
| 2 | Hallowed_be_thy_Name | QmVEitoYcGGs3WPRCkTdygEEtgdytbP7iSDuAwkAipg9wi | 1 | MIXED_WITH_PIANO | Guitare électrique; Piano; Tubular Bells; Guitare Basse; Batterie | 4/4 | 204 | 185 | 4.79 (7) | 323 | unknown | yes |
| 3 | Virus | QmZLmx4e4iS7fXab9qDW1XQkTGhkHDryn36t7g8pYfhZVv | 1 | MIXED_WITH_PIANO | Piano; Violin | 4/4,9/8 | 173 | 0 | 0.00 (0) | 3693 | unknown | yes |
| 4 | The_Trooper | QmbBjkHNUxSYHARLNVRxC6s35gCq5BmPu5RH6zzafmAkxF | 2 | OTHER | Guitare Basse; Guitare classique; Guitare classique; Guitare classique; Guitare Basse; Guitare classique; Batterie; Batterie; Batterie | 4/4 | 100 | 0 | 0.00 (0) | 64 | unknown | no |
| 5 | Iron Maiden | QmTeQfrLFtjEXhgTwFNhvMjXSPk18gY5cNVkpomwfptVsZ | 1 | OTHER | Piccolo; Flute 1; Flute 2; Oboe 1; Oboe 2; Bassoon 1; Bassoon 2; E♭ Clarinet; B♭ Clarinet 1; B♭ Clarinet 2; B♭ Clarinet 3; Bass Clarinet; Alto Saxophone 1; Alto Saxophone 2; Tenor Saxophone; Baritone Saxophone; B♭ Trumpet 1; B♭ Trumpet 2; B♭ Trumpet 3; F Horn 1 &amp; 2; F Horn 3 &amp; 4; Trombone 1; Trombone 2; Trombone 3 &amp; Bass Trombone; Euphonium; Tuba; Double Bass; Timpani; Glockenspiel; Percussion 1; Percussion 2 | 6/8,7/8,3/8 | 328 | 0 | 0.00 (0) | 205 | unknown | no |
| 6 | Dream of mirrors | QmPEPRG2hq7SLnMpRRQbVdYKnf3KnciHVW7U7CBddgitPs | 1 | OTHER | Guitar I; Guitar II; Guitar III; Guitar IV | 4/4 | 169 | 0 | 4.66 (3) | 150 | unknown | no |

### Black Sabbath: 3 rows, 3 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Iron man - Black Sabbath | QmS4UQ3cPqnpBJ2PiBZ5Z79Ky4dg4HEmfSfoJ4D6utRx2g | 1 | LEADSHEET | Guitarra Elétrica | 4/4,2/4 | 54 | 121 | 0.00 (0) | 3 | unknown | yes |
| 2 | Black Sabbath - Fluff | QmVXyyBv6Jh46KmF1pY1jGGTuB8XrYDHRT7cuQ48xsPcbe | 1 | MIXED_WITH_PIANO | Piano; Acoustic Guitar; Electric Guitar; Piano | 3/4 | 175 | 0 | 4.73 (12) | 2599 | unknown | yes |
| 3 | PARANOID for Pep Band | QmcWaSWbbgrMvypjykRkRPWe1xefSERUxhfNPCrgTztQAG | 1 | OTHER | Flute; Clarinet 1; Clarinet 2; Bass Clarinet; Alto Sax; Tenor Sax; Baritone Sax; Trumpet 1; Trumpet 2; Mellophone; Trombone; Baritone; Sousaphone; Snare Drum; Tenor Drums; Bass Drums; Cymbals | 4/4 | 73 | 0 | 4.71 (4) | 303 | unknown | no |

### Linkin Park: 16 rows, 8 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Final Masquerade | QmU6qdsWTZAN5p3wzQNA3HBS6UVSAayhQbrbnwj8LPQ6Vr | 4 | LEADSHEET | Voice | 4/4 | 25 | 25 | 0.00 (0) | 127 | in-copyright | yes |
| 2 | Leave Out All the Rest - Linkin Park | QmTAZ6A8z4vBFgQwpN5STorC5osK59XKQV6o1WWJ9vaGc5 | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 67 | 0 | 4.86 (75) | 2870 | in-copyright | yes |
| 3 | My December | QmWYEvKnbTqk4yqWj1pp41PHfTuQU9BaFvLjEqUHxa6bmK | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 97 | 0 | 4.89 (24) | 4921 | in-copyright | yes |
| 4 | Linkin Park Crawling Piano Score | QmW1fMWmYyYEVrWZMztR41GGEQ6MFvfdpNxvqp2HgDJajh | 2 | PIANO_GRAND_STAFF | Piano, acoustic_grand_piano_ydp_20080910 1 | 4/4 | 94 | 0 | 4.93 (12) | 768 | in-copyright | yes |
| 5 | Linkin Park - NUMB piano cover | QmVsJV6oJeAC4MnbePt17zysoFrdyvs5PDokfM8NLxUhJs | 4 | PIANO_GRAND_STAFF | Piano | 4/4 | 85 | 0 | 4.86 (12) | 1458 | unknown | no |
| 6 | Castle of Glass - Linkin Park | QmZ1daDL3Ubim5WfWZPQDEXN6LzerhKrX4aXSbvxTSoBdg | 2 | PIANO_GRAND_STAFF | Piano | 4/4 | 89 | 0 | 4.76 (56) | 3696 | in-copyright | no |
| 7 | Linkin Park - Iridescent | QmUHB4NY9BwyhN93d52wX5vhAJPyJZ34rZcpZqeEt8tFgf | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 73 | 0 | 4.70 (31) | 16260 | unknown | no |
| 8 | Linkin Park - What I've Done (2 melodies in RH) | QmatR9cf2tT7EhR5MJ2R1vYo1qTpwVFfbkpKMFU3nAs5Dp | 1 | PIANO_GRAND_STAFF | Grand Piano | 4/4 | 79 | 0 | 4.71 (4) | 852 | unknown | no |

### Foo Fighters: 3 rows, 2 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | aloha line 2020 | QmYXmyZyGp2FUzjDvVF1zRT4eVcA2XrvSUq543cQW4wY3C | 2 | MIXED_WITH_PIANO | Snare Drum; Tenor Drums; Bass Drums; Cymbals; Vibraphone; Xylophone; Marimba; Marimba; Piano; Drumset | 3/4,2/4,4/4 | 168 | 0 | 0.00 (0) | 84 | unknown | yes |
| 2 | The Pretender | QmWUQJBDFEQ9xHjGPWqEn6goguxFEbtu72QvM4FKnQEVWF | 1 | PIANO1 | Batterie | 4/4,2/4 | 119 | 0 | 4.71 (4) | 399 | unknown | yes |

### Coldplay: 46 rows, 18 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Coldplay - The Scientist | QmcJRkptrVetWEAJibzZgn4FjTLZbb3NWyMnD8Ce9azWNh | 3 | PIANO_GRAND_STAFF | Piano | 4/4 | 22 | 22 | 4.71 (4) | 461 | unknown | yes |
| 2 | Speed of Sound | QmYG2q5NcJCVydHQ66n3b3WULnW5X5NbvprNDtb2wnqq2C | 1 | PIANO_GRAND_STAFF | Piano; Piano | 4/4 | 77 | 0 | 4.94 (15) | 12974 | unknown | yes |
| 3 | Trouble Coldplay | QmTXa9BRcsEwYH6nUY9pyWp4TiZeDrKsuPmActkce1rkh7 | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 45 | 0 | 4.73 (314) | 78220 | unknown | yes |
| 4 | Fix You Coldplay | QmQsRid5CzsBneXBtLrsE46BDGFn2BseetPyCUQUMdVcxg | 4 | PIANO_GRAND_STAFF | Piano | 4/4 | 53 | 0 | 4.68 (771) | 246303 | unknown | yes |
| 5 | Life in Technicolor II--Coldplay | QmZRu6NmP2J9ghGEEjATPCWxCzP3p2zbF9QBe2TWSFRszv | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 106 | 0 | 4.64 (44) | 8029 | unknown | no |
| 6 | Postcard from far away. Coldplay. | QmPxzHi2TSc9L7K2ETakvrLwf1xThBToSeg8pKKVFj4QRR | 1 | PIANO_GRAND_STAFF | Opretstående klaver | 4/4 | 30 | 0 | 4.50 (7) | 2838 | unknown | no |
| 7 | Clocks Coldplay | QmdE9gDzNjsgAvwtF4vd6ddcceBHSspZCM79gqwGQuiBYC | 4 | PIANO_GRAND_STAFF | Piano | 4/4 | 22 | 0 | 4.61 (1185) | 357787 | unknown | no |
| 8 | Coldplay - Amsterdam | QmZSAMjAfzz3vTDZF7EEWRVgZifc32YaJNiL25yN9SijQ7 | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 94 | 0 | 4.57 (78) | 15934 | unknown | no |
| 9 | Viva La Vida | QmRN6kRXbq7zHjrsF3RvZTJvUykkEAAFHr3irJZAQnFcPs | 15 | PIANO_GRAND_STAFF | Piano | 4/4 | 124 | 0 | 0.00 (0) | 165 | unknown | no |
| 10 | White Shadows | Qmc4HRQdvDEuQvLbenuNfP33GY4QiGseY9kTXywuUrmDWg | 1 | MIXED_WITH_PIANO | Electric Guitar; Piano |  | 98 | 0 | 0.00 (0) | 2431 | unknown | no |
| 11 | Coldplay - Paradise | QmRJRNaEpG9Vk5NXqF7dntLbW3QJPKmmHwtgrmnRpWQopB | 3 | MIXED_WITH_PIANO | 프렛리스 일렉트릭 베이스, Paradise; 바이올린; 팬 플루트; 소프라노; 비올론첼로; 오르간; 톱 신디사이저; 일렉 기타; 드럼세트; 피아노; 비올론첼로; 어쿠스틱 기타; F 호른 | 4/4 | 76 | 0 | 0.00 (0) | 1302 | unknown | no |
| 12 | Coldplay - Orphans | QmWHXi88hBCPqUP2uwun65DbuR3rcG7i2CUGCD2vNmd4td | 1 | MIXED_WITH_PIANO | Piano; Percussive Organ; Violin; Pad Synthesiser; Warm Synthesiser; Acoustic Guitar; Electric Guitar; Electric Guitar; Bass Guitar; Electric Piano; Drumset; Hand Clap | 4/4 | 89 | 0 | 0.00 (0) | 1022 | unknown | no |
| 13 | Yellow | QmeC2Rfuvgp91Z2jLPHGAzkWif6sELoSuNXK9YA4N69kmv | 3 | MIXED_WITH_PIANO | Violin; Violin; Violoncello; Piano; Piano | 4/4 | 35 | 0 | 0.00 (0) | 524 | unknown | no |
| 14 | Coldplay - Hymn For The Weekend (condensed) | QmXD8Dk2VNXkGakqhgBec8czudFLpgTVz6oFxGqJXnjMYw | 3 | MIXED_WITH_PIANO | F1; Rafforzo; F2; F3; Ottoni; Sint. Echi; Piano; Sint. Pad; Basso el.; Batteria | 4/4 | 85 | 0 | 0.00 (0) | 230 | unknown | no |
| 15 | Coldplay Medley | QmeRk3HNbY1ZQBwETqmegMNJV74dBNZ97KH8k3UEAB8PRm | 1 | MULTI_PIANO_PART | Solo; Soprano; Alto; Tenor; Bass | 4/4 | 140 | 56 | 0.00 (0) | 1509 | unknown | no |
| 16 | Viva La Vida Steel Drums | QmZgV5k5a17ErGy46MVx7VGtMkXmwh1wB6RT7zhFNt8fMc | 1 | OTHER | Soprano Steel Drums; Alto Steel Drums; Cello Steel Drums; Bass Steel Drums | 4/4 | 99 | 0 | 0.00 (0) | 486 | unknown | no |
| 17 | Everglow violin 2 p1 | QmRZazQm79VMSVoW8Ro2uW5WxGKwDJekJ86QssfLuXLRqC | 1 | NOT_INSPECTED |  |  | 44 | None | 0.00 (0) | 87 | unknown | no |
| 18 | Viva La Freude edited quartet | QmVZcT2ufsAs7vWP88wSvSbcA1NBcNZu47Wp771MYBfDsS | 1 | NOT_INSPECTED |  |  | 88 | None | 0.00 (0) | 65 | pd | no |

### Billy Joel: 21 rows, 9 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Billy Joel - She's Always A Woman | QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn | 2 | PIANO_GRAND_STAFF | Piano | 12/8,6/8,9/8 | 40 | 129 | 4.80 (101) | 7040 | unknown | yes |
| 2 | Vienna Billy Joel | QmUkekPKGR983LBTg8oK7QYh1rKLkUmUNnKJrMLWRKm4Nx | 2 | LEADSHEET | Piano | 4/4 | 107 | 95 | 4.48 (28) | 3097 | unknown | yes |
| 3 | And So It Goes | QmWTnL3HmQ5JJuyzmYK7SdJuvZ2Xc1PZ3AWHijaQ4dhxUM | 6 | PIANO_GRAND_STAFF | Piano | 3/4,4/4,2/4 | 69 | 0 | 4.80 (161) | 16089 | unknown | yes |
| 4 | Uptown Girl | QmYp2Waj5h4khKz5Tr7D9AHwgMBbaumTxfpDkiVjBE6xKH | 2 | PIANO_GRAND_STAFF | Part_1 |  | 97 | 0 | 4.72 (19) | 1142 | unknown | yes |
| 5 | Rousseau: Billy Joel - Piano Man | QmWpzkuQx23WPUoU1Lvta6hJtK7ccBjeSwL1ATyJ47UUMU | 4 | PIANO_GRAND_STAFF | Piano | 4/4,3/4 | 273 | 0 | 4.80 (240) | 17152 | unknown | no |
| 6 | Summer Highland Falls | QmZ2kp8fL8uSXiUp7WAfTDr8vDzLjtNj5ewowgpC2nPovP | 1 | MIXED_WITH_PIANO | Tenor; Klavier | 2/2 | 144 | 0 | 4.73 (27) | 7877 | unknown | no |
| 7 | Tenor and Lead | QmRqs5kTuETRpmK6dqfBnHVCZsDkrHmbATc9CAUhXQhvvL | 1 | PIANO1 | TENOR LEAD | 4/4 | 39 | 0 | 0.00 (0) | 32 | unknown | no |
| 8 | The Longest Time | QmQ1Z57iroXMV1PzxwBXBgYUXFdVWei6esSMpQDMmzwdwV | 2 | MULTI_PIANO_PART | Tenor; Baritone; Bass | 4/4 | 70 | 0 | 3.66 (3) | 6410 | unknown | no |
| 9 | Lullaby (Goodnight My Angel) | QmQvDaWBBq6YHk2jLcPep3iG2h37eNF2HLWzFjUVveaxnK | 1 | OTHER | B♭ Trumpet; B♭ Trumpet; B♭ Trumpet; Horn in F; Horn in F; Tenor Trombone; Tenor Trombone; Euphonium; Tuba | 2/4,7/4,4/4,5/4,3/4,6/4 | 85 | 0 | 0.00 (0) | 715 | unknown | no |

### Elton John: 24 rows, 16 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Daniel Elton John/Bernie Taupin piano cover | QmSj1cyUhcFmnhKdibiMpNqoEZkFdM47NxnqbmgVsbup62 | 1 | PIANO_GRAND_STAFF | Piano | 2/2 | 126 | 163 | 4.74 (106) | 3415 | unknown | yes |
| 2 | The King | QmTLkSX6MxkF9n4dF3FMH7cvfjR4vSLkvbjQRkL3EpWVzP | 2 | PIANO_GRAND_STAFF | Piano | 4/4 | 11 | 8 | 0.00 (0) | 2586 | unknown | yes |
| 3 | Elton John - Rocket Man | QmeQQcvhQttDeWkUeWsMd71pG6WgJtAwv6xuDShh7YUy7B | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 47 | 0 | 4.78 (146) | 9149 | unknown | yes |
| 4 | [EASY PIANO] Elton John Can you Feel The Love Tonight Lion King OST | QmTwsXtFetmmCqQeGQgxQZjdjHn14n6L57B4C6dCEgEq7D | 5 | PIANO_GRAND_STAFF | Piano | 4/4 | 61 | 0 | 4.72 (149) | 6087 | unknown | yes |
| 5 | Thank you for all of your loving | QmcQSMiDchN79Ege5W6B4B1ZWca5DpqWsLLrFi9TFKMD28 | 1 | PIANO_GRAND_STAFF | Part_1 | 2/2,3/4,6/8,4/4 | 36 | 0 | 0.00 (0) | 213 | unknown | no |
| 6 | Your Song - Elton John - Easy Piano | QmcZnZByDzCDxRpXJfSGsPqDP9reRxzqpwmcxs3HR82kHc | 3 | PIANO_GRAND_STAFF | Piano | 4/4 | 38 | 0 | 4.64 (1414) | 78241 | unknown | no |
| 7 | im still standing | QmYHhaP2rpEE4yWXvQ8uWeLDbcKAEBbuEkghesQXWF5zaE | 2 | MIXED_WITH_PIANO | Elektrische Gitarre; Elektrischer Bass; Piano; Schlagzeug | 4/4 | 55 | 47 | 4.08 (9) | 1417 | unknown | no |
| 8 | Saturday Night's Alright for Fighting | QmedtcuPuY77PkDCWRCf8szucxfhmvKDumWqEbVQqesa6L | 1 | MIXED_WITH_PIANO | Lead Sheet; Piano; Pads; Drumset; Electric Bass | 4/4 | 191 | 231 | 4.89 (15) | 2816 | unknown | no |
| 9 | A word in Spanish (WIP) | QmeN9KXbXPZapPbc7yJkCg9EM8Kh2TWAjiSt72weSwENwG | 1 | MIXED_WITH_PIANO | Voice; Electric Bass; Electric Piano; Classical Guitar; Electric Guitar; Violin; Violin; Viola; Flute; Ukulele; Drumset | 4/4,2/4 | 95 | 0 | 4.85 (4) | 165 | unknown | no |
| 10 | Bennie and the Jets / Elton John + Bernie Taupin | QmWoKGeM1RQbqvXPairpdK87xbZ86EuvSurhNn4QHBJ18R | 1 | MIXED_WITH_PIANO | Voice; Piano; Electric Piano; Electric Bass; Drumset 5 lines | 4/4 | 84 | 0 | 4.67 (99) | 51236 | unknown | no |
| 11 | The Bitch Is Back | QmSfLx6L8oxuV3xHe6VNnjZEPtxTmFKXowKvipEKNbmnXt | 1 | MIXED_WITH_PIANO | Voice; Piano | 4/4 | 98 | 0 | 4.53 (10) | 773 | unknown | no |
| 12 | Can you feel love tonight | Qme5c4R4MRFd8v5pAXSW1aQXEscW6Mk9fFhiQdSrLCHTBr | 1 | OTHER | Clarinet in Bb; Clarinet in Bb; Clarinet in Bb | 4/4 | 32 | 0 | 4.89 (7) | 585 | unknown | no |
| 13 | The Lion King - arranged for Flute Choir | QmeTXPaBrnhsCsTwS1afrBtW1RmTC89QqafAUThiyvat2J | 1 | OTHER | Piccolo; Flute Solo 1; Flute 1; Flute Solo 2; Flute 2; Flute 3; Alto Flute; Bass Flute | 4/4 | 76 | 0 | 4.88 (6) | 759 | in-copyright | no |
| 14 | The Circle of Life | QmWS4D1LcscYcCgaAgVFyZcpQ2pTnsY3hVQsFcVoQDMxYz | 1 | OTHER | Flûte I; Flûte II; Clarinette en Si♭I; Clarinette en Si♭II; Clarinette Basse; Saxophone Alto I; Saxophone Alto II; Tenor Saxophone; Baritone Saxophone; Trompette en Si♭; Trumpet; Horn in F; Horn in F; Horn in F; Euphonium; Euphonium; Tuba en Si♭; Tuba; Tuba; Keyboard I; Percussion; Batterie | 4/4 | 89 | 0 | 0.00 (0) | 336 | unknown | no |
| 15 | Elton John's Crocodile Rock for Horn Choir | QmUSAtKFzJrc7XWsF7CvJDgLfmbrZdMgR44WZCSbBzFyJk | 1 | OTHER | Horn 1 in F; Horn 2 in F; Horn 3 in F; Horn 4 in F; Horn 5 in F; Horn 6 in F; Horn 7 in F; Horn 8 in F | 4/4 | 90 | 0 | 0.00 (0) | 97 | unknown | no |
| 16 | Circle | QmZPCZx9Tg1ygq5FGvgWo5DwJcqHQzeRF3ucuDc3SH36Lr | 1 | OTHER | Soprano; Alto; Tenor; Bass | 4/4,2/4,6/4,3/4 | 103 | 0 | 0.00 (0) | 78 | unknown | no |

### Beatles: 34 rows, 18 distinct songs

Top 20 distinct songs (rows beyond 20 appear only when the artist's dump quota needed them).

| # | Song | CID (best edition) | Editions | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Something - The Beatles | QmPoKC1KNnhFURL5QSo3DRkGEWAoRgDiDEUchNJt79dGRo | 2 | PIANO_GRAND_STAFF | Piano | 4/4 | 19 | 39 | 4.54 (384) | 15395 | unknown | yes |
| 2 | She is not a Girl who misses much_opening-1st-movement | QmeEtYGFYUSj7MtF3AqZ2q5BBcFBNKHYb4DxZSbSensoXJ | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 12 | 16 | 0.00 (0) | 51 | unknown | yes |
| 3 | Happy Xmas (War is over) | QmQ1qVi1RHonfqDZydkmHSwTDQ7vzE8rQdojdK2BXTPPw1 | 4 | PIANO_GRAND_STAFF | Piano | 6/8 | 33 | 0 | 4.70 (70) | 4021 | unknown | yes |
| 4 | Imagine | QmXAocpmyAT6PCMWzLDkz2c7j8UeafVmZsCg4eLgNKwEN7 | 11 | PIANO_GRAND_STAFF | Piano | 4/4 | 35 | 0 | 0.00 (0) | 397 | unknown | yes |
| 5 | sei gegrusset jesu gutig | QmQWXy6pPdUnbyrRXM5TD93RiWR66MdFNzoE4HnomCBvuE | 1 | PIANO_GRAND_STAFF | Piano | 4/4 | 3 | 0 | 0.00 (0) | 34 | unknown | no |
| 6 | Till There Was You Bossa Nova for Jazz Combo | QmbNNMbaWQsgF3avzbkK35DkJiw1DiDJdmPKPEyhTUyjCL | 1 | MIXED_WITH_PIANO | Flute; Alto Saxophone; Piano; Classical Guitar; Electric Bass; Drumset | 4/4 | 68 | 261 | 4.84 (215) | 8109 | unknown | no |
| 7 | Money (That's What I Want) | Qmdjr3YoE94iwFT4tXp1T16vRzN9QoWCaBF7wLnqHDNTpu | 1 | MIXED_WITH_PIANO | Trumpet; Alto Sax; Tenor Sax; Trombone; Guitar; Piano; Bass; Drums | 4/4 | 71 | 221 | 4.24 (5) | 2943 | unknown | no |
| 8 | Happy Xmas | QmVsPmhbYv2HS7mpWDuoGo8txNicvo9XYRMYgGkGDrM68e | 2 | MIXED_WITH_PIANO | Voice; Voice; Piano | 12/8 | 13 | 13 | 4.44 (6) | 699 | unknown | no |
| 9 | Please Please Me - The Beatles | QmSkFxTiMmgAR34Su4y2aTrrEFKH9pVdtXuBHwP78kjyeN | 1 | MIXED_WITH_PIANO | B♭ Clarinet; Violoncello; Piano | 4/4 | 68 | 0 | 4.85 (11) | 1380 | unknown | no |
| 10 | HAPPY XMAS IN SOL | QmPXDf29d7f8hvQYVq9VTV6edQSbaExDQVoFxUJGSrMdFs | 1 | MIXED_WITH_PIANO | Flauto; Piano | 12/8 | 30 | 0 | 4.49 (3) | 538 | unknown | no |
| 11 | I could not do without thee - Robert H. McCartney | QmQLf8hVD7pbUkBPR5cA67VwzPETC5QVMrHxgPYUYF57AJ | 1 | MULTI_PIANO_PART | ;  | 4/4 | 17 | 0 | 0.00 (0) | 34 | unknown | no |
| 12 | Hail to the lords anointed - Robert H. McCartney | QmccYykmJrQdohA8f8bKWTE2uwzQgySWwdnKvwshUD12ns | 1 | MULTI_PIANO_PART | ;  |  | 17 | 0 | 0.00 (0) | 11 | unknown | no |
| 13 | Jealous guy- John Lennon | QmVBCwuTG3VivYCJw5HbDys1iDkwFmqQhfxPSCHPXyp2gP | 2 | MULTI_PIANO_PART | Piano; Piano | 4/4,2/4 | 66 | 0 | 4.35 (14) | 1172 | unknown | no |
| 14 | While my guitar gently weeps | QmX2NqQZMYjCCFGgZ6Qk5Fugcnd94nm4xcRCJcbYLE8PP7 | 1 | OTHER | Soprano; Tenor | 4/4 | 51 | 2 | 3.99 (4) | 375 | unknown | no |
| 15 | 2ª voz - Então É Natal versão teste | QmVDKZxL9YHuPjLfEoxcoNbtW35pzcNFysmc5W4evsmqQD | 1 | OTHER | Flauta Doce | 3/4 | 63 | 0 | 0.00 (0) | 21 | unknown | no |
| 16 | Beautiful Boy (Darling Boy) Upper Wind Ensemble | QmesS65yMx3yaU3bgPftLWdCUGqP5Yb4Ya1u1gV1n8Hb4o | 1 | OTHER | Piccolo; Piccolo; Flute; Flute; Flute; BaccidentalFlat Clarinet; BaccidentalFlat Clarinet; BaccidentalFlat Clarinet; BaccidentalFlat Clarinet | 4/4 | 68 | 0 | 4.66 (6) | 1783 | unknown | no |
| 17 | Stand by Me | QmSu4CRmBAQ9EjHGpHxfTfYefzXaZLrBYVXER937z4fxGA | 1 | OTHER | Violin | 4/4 | 73 | 0 | 4.60 (12) | 15984 | unknown | no |
| 18 | The Sheik of Araby FH | QmX6vrb8Aix1ZRqs8XZQNRxm4BFGskp2ebJGmJWEh1mWme | 1 | OTHER | Horn in F | 2/2 | 144 | 0 | 0.00 (0) | 118 | unknown | no |

### Dumped scores

| CID | Title | Artist / composer | Identity | Shape | Parts | Meters | Bars | Chords | Rating (n) | Views | Label | XML bytes | Why / where |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QmbwnWBK5FE51CVpqjZ4fSQW87SX1MNzehooGRbNPDrkfm | A Little Piece Of Heaven Avenged Sevenfold Patrick Ceelen | Avenged Sevenfold / Arranged By Patrick Ceelen | n/a | MIXED_WITH_PIANO | Piano; Elektrische piano; Violin 1; Violin 2; B♭ Trumpet; Bass Guitar; Electric Guitar; Drumset; Soprano; Alto Vocals; Tenor Vocals; Bass Vocals | 4/4,2/4,6/4,3/4,5/4 | 206 | 0 | 0.00 (0) | 292 | unknown | 3282927 | already dumped under K-metal; `xml/K-metal/a-little-piece-of-heaven-avenged-sevenfo-QmbwnWBK5FE51CVpqjZ4fSQW87SX1MNzehooGRbNPDrkfm.musicxml` |
| QmSc3G9zSwyGhYXksJCyGQLJBpGfKYC248hC2nTdrySSD6 | Avenged Sevenfold - Almost Easy | Avenged Sevenfold / A7X | n/a | PIANO1 | Drumset, Almost Easy | 2/4,4/4,3/4 | 198 | 0 | 4.90 (8) | 862 | in-copyright | 879000 | artist Avenged Sevenfold, song #2; `xml/L-artists/avenged-sevenfold-almost-easy-QmSc3G9zSwyGhYXksJCyGQLJBpGfKYC248hC2nTdrySSD6.musicxml` |
| QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo | Enter Sandman | Metallica / MetallicaArr: Anders Thue | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 148 | 0 | 4.88 (90) | 4507 | unknown | 1011172 | already dumped under K-metal; `xml/K-metal/enter-sandman-QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo.musicxml` |
| Qmecq9RSLpMfuaEajmskZq9ueZGk97qvmdx78JFWNSuiRD | for whom the bell tolls | Metallica / metallica | n/a | MIXED_WITH_PIANO | Voice; Electric Guitar; Electric Piano; Crystal Synthesizer; Bass Guitar; Drumset; Electric Guitar | 4/4 | 132 | 0 | 4.83 (3) | 272 | unknown | 1110564 | artist Metallica, song #2; `xml/L-artists/for-whom-the-bell-tolls-Qmecq9RSLpMfuaEajmskZq9ueZGk97qvmdx78JFWNSuiRD.musicxml` |
| Qmc2BawopkxrFy6ekhYKAB8qzukZn4pxFpcefQfQ7X8tP6 | Metallica - One | Metallica / transcribed from Drumeo | n/a | PIANO1 | Drumset | 4/4,2/4,3/4,6/4 | 198 | 0 | 0.00 (0) | 3427 | unknown | 1260506 | already dumped under K-metal; `xml/K-metal/metallica-one-Qmc2BawopkxrFy6ekhYKAB8qzukZn4pxFpcefQfQ7X8tP6.musicxml` |
| QmYKpXdLhNEmuSxT9zkkmMNDuVSGRyT2bie6J9fhmiPcdn | Trough The Never: Metallica | Metallica / Composer | n/a | PIANO1 | Drumset | 4/4,6/4,3/4 | 167 | 0 | 0.00 (0) | 101 | unknown | 489362 | artist Metallica, song #4; `xml/L-artists/trough-the-never-metallica-QmYKpXdLhNEmuSxT9zkkmMNDuVSGRyT2bie6J9fhmiPcdn.musicxml` |
| QmZZoMtA54kgni7gFcrBDdSsm1TGMuE1FzomzFbuGfP7Lq | Master of Puppets: Metallica | Metallica / Composer | n/a | PIANO1 | Piano | 4/4,5/8,2/4 | 267 | 0 | 4.61 (20) | 5658 | unknown | 571817 | already dumped under K-metal; `xml/K-metal/master-of-puppets-metallica-QmZZoMtA54kgni7gFcrBDdSsm1TGMuE1FzomzFbuGfP7Lq.musicxml` |
| QmZ3vfJw1vS5Me9KDoUYSm7RYU4FYSAwioiFHbtogRihgd | Space Dementia | Muse / LYRICS & MUSIC BY MATTHEW BELLAMY | n/a | PIANO_GRAND_STAFF | Piano | 4/4,6/8 | 74 | 69 | 4.82 (75) | 11270 | unknown | 851078 | artist Muse, song #1; `xml/L-artists/space-dementia-QmZ3vfJw1vS5Me9KDoUYSm7RYU4FYSAwioiFHbtogRihgd.musicxml` |
| QmPJdhKPHYYoLPspsFtYoFX8nzZUkyAuw85Rm7bhmptBub | Screenager | Muse / LYRICS & MUSIC BY MATTHEW BELLAMY | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 41 | 30 | 4.88 (6) | 399 | unknown | 385229 | artist Muse, song #2; `xml/L-artists/screenager-QmPJdhKPHYYoLPspsFtYoFX8nzZUkyAuw85Rm7bhmptBub.musicxml` |
| QmQGS6WCqjnbvLW5G3HrsBhLhYxyeziMnw2YM1NXx6STUw | Hoodoo (Live piano) | Muse / Matthew Bellamy | n/a | PIANO_GRAND_STAFF | Piano | 12/8,6/8,2/4,3/4 | 52 | 0 | 4.81 (8) | 939 | unknown | 371863 | artist Muse, song #3; `xml/L-artists/hoodoo-live-piano-QmQGS6WCqjnbvLW5G3HrsBhLhYxyeziMnw2YM1NXx6STUw.musicxml` |
| Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf | Muse - Hysteria | Muse / Muse | n/a | PIANO_GRAND_STAFF | Piano; Drumset | 4/4 | 83 | 0 | 4.74 (44) | 7075 | unknown | 1356236 | already dumped under J-rock; `xml/J-rock/muse-hysteria-Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf.musicxml` |
| QmeprydoERiDt7yuEAeGaffavEp97wAPER2AMJwsKXBr5s | Ruled by Secrecy | Muse /  | n/a | PIANO_GRAND_STAFF | Piano eléctrico; Piano de cola; Piano | 6/8 | 72 | 0 | 0.00 (0) | 230 | unknown | 1041200 | artist Muse, song #5; `xml/L-artists/ruled-by-secrecy-QmeprydoERiDt7yuEAeGaffavEp97wAPER2AMJwsKXBr5s.musicxml` |
| QmPzbknqkv7S6dp3fcZVw3JLztdMA8tFw8qttHdtQd5vCg | Muse Of Poetry (Erato) Fischer Johann Kaspar Ferdinand | Johann Kaspar Ferdinand Fischer / J. K. F. Fischer Muse of poetry erotic poetry in particular (Erato) | n/a | PIANO_GRAND_STAFF | Harpsichord | 4/4 | 30 | 0 | 0.00 (0) | 48 | unknown | 261054 | artist Muse, song #6; `xml/L-artists/muse-of-poetry-erato-fischer-johann-kasp-QmPzbknqkv7S6dp3fcZVw3JLztdMA8tFw8qttHdtQd5vCg.musicxml` |
| QmNkxhgWU4SD1SgRWCjvWLdixkCV4YVgt2wP4F8wNACmri | Isolated System | Muse / Muse | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 148 | 0 | 4.92 (10) | 27223 | unknown | 698207 | artist Muse, song #7; `xml/L-artists/isolated-system-QmNkxhgWU4SD1SgRWCjvWLdixkCV4YVgt2wP4F8wNACmri.musicxml` |
| QmfVhjHh1mgJwF5jKSEZW822CqwhLUDy115Cjx6xRR2NFX | Apocalypse Please | Muse / Lyrics by Matthew BellamyMusic by Matthew Bellamy Chris Wolstenholme & Dominic Howard | n/a | MIXED_WITH_PIANO | Piano; (Right) Synth 1; (Left) Synth 1; (Left) Synth 2; (Left) Synth 3 | 4/4 | 41 | 39 | 4.81 (13) | 1115 | unknown | 830771 | artist Muse, song #8; `xml/L-artists/apocalypse-please-QmfVhjHh1mgJwF5jKSEZW822CqwhLUDy115Cjx6xRR2NFX.musicxml` |
| QmTe1Rkt8SBN7667PiUhD3FVaEGQDALGPY9Ur115aYGXyL | Exit Music For a Film (Advanced Piano Solo) | Radiohead /  | n/a | PIANO_GRAND_STAFF | Piano | 4/4,6/4,2/4 | 66 | 0 | 4.91 (185) | 10671 | unknown | 950026 | artist Radiohead, song #1; `xml/L-artists/exit-music-for-a-film-advanced-piano-sol-QmTe1Rkt8SBN7667PiUhD3FVaEGQDALGPY9Ur115aYGXyL.musicxml` |
| QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M | No Surprises | Radiohead / Radiohead | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 71 | 0 | 4.83 (33) | 1613 | unknown | 395444 | already dumped under I-pop; `xml/I-pop/no-surprises-QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M.musicxml` |
| QmYZGRsLCsNASou3HBU85SfR5T1KQx5hPqZVJa9xHtsbbM |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 562158 | already dumped under I-pop; `xml/I-pop/no-surprises-QmYZGRsLCsNASou3HBU85SfR5T1KQx5hPqZVJa9xHtsbbM.musicxml` |
| QmZv36W7wx6M6iQfXyeABA3PiNZM74qrVJKLqfVuB1ueoo |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 242567 | already dumped under I-pop; `xml/I-pop/radiohead-no-surprises-for-drums-QmZv36W7wx6M6iQfXyeABA3PiNZM74qrVJKLqfVuB1ueoo.musicxml` |
| QmQ2jgSxs7WtLpWYNhkUsRTkgvXA2q4BPSW48XsnY83N3Q | Daydreaming - Radiohead | Radiohead / Notatio | n/a | PIANO_GRAND_STAFF | Piano | 6/8,4/4 | 64 | 0 | 4.87 (13) | 1210 | unknown | 399952 | artist Radiohead, song #3; `xml/L-artists/daydreaming-radiohead-QmQ2jgSxs7WtLpWYNhkUsRTkgvXA2q4BPSW48XsnY83N3Q.musicxml` |
| QmPmjHdv6GhcNe7h31sNVm1vHKQC8DfteNMyn1jBhpJEch | CREEP de Radiohead | Radiohead / Arrgt : S. Hermand | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 35 | 0 | 4.73 (23) | 2966 | unknown | 135234 | artist Radiohead, song #4; `xml/L-artists/creep-de-radiohead-QmPmjHdv6GhcNe7h31sNVm1vHKQC8DfteNMyn1jBhpJEch.musicxml` |
| QmVEn9MV1dW18vwLmHgnqZ6K7gt9kHTZyeSt8u1XiEDr37 |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 1458167 | artist Radiohead, song #4; alternate edition kept: shape MIXED_WITH_PIANO vs PIANO_GRAND_STAFF; `xml/L-artists/radiohead-creep-but-its-ridiculous-QmVEn9MV1dW18vwLmHgnqZ6K7gt9kHTZyeSt8u1XiEDr37.musicxml` |
| QmdS66pdGrFFbsEN9vvBQcDvaEyJx8vABqtuMCRi77aSpm |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 812155 | artist Radiohead, song #4; alternate edition kept: shape MULTI_PIANO_PART vs PIANO_GRAND_STAFF; `xml/L-artists/twisted-measure-creep-acapella-QmdS66pdGrFFbsEN9vvBQcDvaEyJx8vABqtuMCRi77aSpm.musicxml` |
| QmRABab4S21y1kSwm5pRfJynAZbSmwWpHs6hzZCbjT7Whp | Cluster One | Pink Floyd / Transcribed by: Sam Anderson | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 92 | 22 | 4.83 (9) | 717 | unknown | 316940 | artist Pink Floyd, song #1; `xml/L-artists/cluster-one-QmRABab4S21y1kSwm5pRfJynAZbSmwWpHs6hzZCbjT7Whp.musicxml` |
| QmcNFWCZBCoWFj7gpfjv7qJBJYX58j3SBrh9ruMBreDsg4 | Anisina | Pink Floyd / Sam Anderson | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 53 | 41 | 4.87 (5) | 196 | unknown | 289285 | artist Pink Floyd, song #2; `xml/L-artists/anisina-QmcNFWCZBCoWFj7gpfjv7qJBJYX58j3SBrh9ruMBreDsg4.musicxml` |
| QmPXA4DmNdZ9i57iNvMXuggjaPjfuAU5L3NQTS3FpyTbsb | Autumn '68 | Pink Floyd / Sam Anderson | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 24 | 16 | 4.83 (3) | 264 | unknown | 99130 | artist Pink Floyd, song #3; `xml/L-artists/autumn-68-QmPXA4DmNdZ9i57iNvMXuggjaPjfuAU5L3NQTS3FpyTbsb.musicxml` |
| QmQnnagVBhXDRu8vs6JEc59iP52cs1BGCdrWEnaRZie71Q | Things Left Unsaid | Pink Floyd / Transcribed by: Sam Anderson | n/a | PIANO_GRAND_STAFF | Piano | 9/8,4/4 | 56 | 8 | 0.00 (0) | 703 | unknown | 176843 | artist Pink Floyd, song #4; `xml/L-artists/things-left-unsaid-QmQnnagVBhXDRu8vs6JEc59iP52cs1BGCdrWEnaRZie71Q.musicxml` |
| QmZ2XRr489YtJVYSs5HUV8G89nKjqXbMUUh6o9eZhc5n51 | Aloha oe | Misc tunes / Queen Lili'uokalani (1877) | n/a | LEADSHEET |  | 4/4 | 18 | 19 | 0.00 (0) | 39 | unknown | 44421 | artist Queen, song #1; `xml/L-artists/aloha-oe-QmZ2XRr489YtJVYSs5HUV8G89nKjqXbMUUh6o9eZhc5n51.musicxml` |
| QmZ5j9oh23pBPqTMvwYkpS8PzHkxARizYeBddQ8NTMA1CA |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 317843 | artist Queen, song #1; alternate edition kept: shape MIXED_WITH_PIANO vs LEADSHEET; `xml/L-artists/aloha-oe-hawaian-QmZ5j9oh23pBPqTMvwYkpS8PzHkxARizYeBddQ8NTMA1CA.musicxml` |
| QmdyRM78Vwe2k96mHJjhaLoYwcsVPgdqNg6WjEQBFYG77A | Ode To A Pumpkin I Grew |  / Queen Celena the Shy | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 16 | 0 | 0.00 (0) | 413 | unknown | 115394 | artist Queen, song #2; `xml/L-artists/ode-to-a-pumpkin-i-grew-QmdyRM78Vwe2k96mHJjhaLoYwcsVPgdqNg6WjEQBFYG77A.musicxml` |
| QmP5sBPMPWDzBMixZdbPM9edRAoEqK6UC9dKCRNAHTPW5f | Hes coming soon - Queen Liliuokalani | Queen Liliuokalani / Hawaiian tune arr. by Thoro Harris | n/a | MULTI_PIANO_PART | ;  | 4/4 | 18 | 0 | 4.83 (3) | 223 | unknown | 143038 | artist Queen, song #3; `xml/L-artists/hes-coming-soon-queen-liliuokalani-QmP5sBPMPWDzBMixZdbPM9edRAoEqK6UC9dKCRNAHTPW5f.musicxml` |
| QmQYDH4PL6BQtmnAmpBxK6fJ9Z5PRGj1BTQD9aFYJhQtkd | Go and tell - Queen Liliuokalani | Queen Liliuokalani / Arranged by Clarence R. Kohlmann | n/a | MULTI_PIANO_PART | ;  | 4/4 | 18 | 0 | 0.00 (0) | 42 | unknown | 130690 | artist Queen, song #4; `xml/L-artists/go-and-tell-queen-liliuokalani-QmQYDH4PL6BQtmnAmpBxK6fJ9Z5PRGj1BTQD9aFYJhQtkd.musicxml` |
| QmWKA8j5XNeR2negDESQyEkDc6M7hpu6ADou6GRHKRKRfb | Breathe no more EVANESCENCE | Evanescence /  | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 90 | 0 | 4.78 (11) | 1721 | unknown | 291175 | artist Evanescence, song #1; `xml/L-artists/breathe-no-more-evanescence-QmWKA8j5XNeR2negDESQyEkDc6M7hpu6ADou6GRHKRKRfb.musicxml` |
| QmVWSZ3vAy8prRv14TRREdLLnXk14UqrYrc1HgeisMAqqe | my immortal in F voice & piano | Evanescence / David Hodges Amy Lee & Ben Moody | n/a | MIXED_WITH_PIANO | Stem; Piano, MIDI 1 | 4/4 | 48 | 65 | 0.00 (0) | 110 | unknown | 389315 | artist Evanescence, song #2; `xml/L-artists/my-immortal-in-f-voice-piano-QmVWSZ3vAy8prRv14TRREdLLnXk14UqrYrc1HgeisMAqqe.musicxml` |
| QmTTjukRKRWvhqR5CoNiFXm1uZrcSCVrGoRua4NF5dSUYv | Lacrymosa SAB + Full Band | Evanescence / By Evanescence | n/a | MIXED_WITH_PIANO | Voice; Soprano; Alto; Baritone; Piano; Piano; String Synthesizer; Electric Guitar; Electric Guitar; Electric Bass; Drumset | 3/4,4/4 | 130 | 0 | 4.88 (6) | 281 | unknown | 1945736 | artist Evanescence, song #3; `xml/L-artists/lacrymosa-sab-full-band-QmTTjukRKRWvhqR5CoNiFXm1uZrcSCVrGoRua4NF5dSUYv.musicxml` |
| QmQaRBBTZpAsfaLHQVb28qJZb1QhWDrY6g3oF2taJpcZUQ | Everybody's Fool - Evanescence | Evanescence / Amy Lee Ben Moody and David Hodges | n/a | PIANO1 | Batterie | 4/4 | 66 | 0 | 4.56 (4) | 1837 | unknown | 364585 | artist Evanescence, song #4; `xml/L-artists/everybodys-fool-evanescence-QmQaRBBTZpAsfaLHQVb28qJZb1QhWDrY6g3oF2taJpcZUQ.musicxml` |
| QmeuoFT1hEJntEUswkFFoJ8UisTFHhjNiW236bsUeiAG7X | Lonely Day | System of a Down / Arranged by Sofía Matus Cancino | n/a | PIANO_GRAND_STAFF | Piano | 6/8 | 103 | 0 | 4.75 (9) | 314 | unknown | 536992 | already dumped under K-metal; `xml/K-metal/lonely-day-QmeuoFT1hEJntEUswkFFoJ8UisTFHhjNiW236bsUeiAG7X.musicxml` |
| QmUF29MkGVEtuy9EUPXYZKC7S123bircT6W2zJkhhW8e9C | Hypnotize | System of a Down / System of a Down | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 136 | 0 | 0.00 (0) | 139 | unknown | 866452 | artist System of a Down, song #2; `xml/L-artists/hypnotize-QmUF29MkGVEtuy9EUPXYZKC7S123bircT6W2zJkhhW8e9C.musicxml` |
| QmbHZSWPLhqk5eU4ErBJNFmYdyFjHggpdCAd2ymqzSitFH | Dream Theater - Disappear | Dream Theater / Jordan Rudess | n/a | PIANO_GRAND_STAFF | Piano | 5/4,6/4 | 125 | 0 | 4.73 (12) | 10887 | unknown | 467656 | artist Dream Theater, song #1; `xml/L-artists/dream-theater-disappear-QmbHZSWPLhqk5eU4ErBJNFmYdyFjHggpdCAd2ymqzSitFH.musicxml` |
| QmX6C6SSN9pgaG7S9i39dU2aNoG12updXDxWjFfA3u3h8x | Wait for Sleep | Dream Theater / Dream Theater | n/a | MIXED_WITH_PIANO | Alto; Piano; Violin; Drumset | 5/8,4/8,6/8,12/8 | 115 | 0 | 4.81 (45) | 4175 | unknown | 574641 | artist Dream Theater, song #2; `xml/L-artists/wait-for-sleep-QmX6C6SSN9pgaG7S9i39dU2aNoG12updXDxWjFfA3u3h8x.musicxml` |
| QmXD2aZpJZY27ZJjxsS69dysWp9FtvouuQymLi1ibBDTY9 | Dream Theater: Pull Me Under | Dream Theater / Dream Theater | n/a | PIANO1 | Rumpusetti | 4/4 | 32 | 0 | 4.81 (8) | 1885 | unknown | 202481 | already dumped under K-metal; `xml/K-metal/dream-theater-pull-me-under-QmXD2aZpJZY27ZJjxsS69dysWp9FtvouuQymLi1ibBDTY9.musicxml` |
| QmXFHNzdRue8ptGgsQgBvoFiseKUSmik3FNZpV5w15fAtv | Fear of the Dark | Iron Maiden / Iron Maiden | n/a | MIXED_WITH_PIANO | Alt Saxophon; Alt Saxophon; Tenor Saxophon; Tenor Saxophon; Bariton Saxophon; B Trompete; B Trompete; B Trompete; B Trompete; Posaune; Posaune; Posaune; Posaune; Elektrische Gitarre; Klavier; Elektrischer Bass; Schlagzeug | 4/4,2/4 | 176 | 57 | 4.82 (19) | 1482 | unknown | 6611911 | already dumped under K-metal; `xml/K-metal/fear-of-the-dark-QmXFHNzdRue8ptGgsQgBvoFiseKUSmik3FNZpV5w15fAtv.musicxml` |
| QmVEitoYcGGs3WPRCkTdygEEtgdytbP7iSDuAwkAipg9wi | Hallowed_be_thy_Name | Iron Maiden / Iron Maiden | n/a | MIXED_WITH_PIANO | Guitare électrique; Piano; Tubular Bells; Guitare Basse; Batterie | 4/4 | 204 | 185 | 4.79 (7) | 323 | unknown | 4390067 | already dumped under K-metal; `xml/K-metal/hallowed-be-thy-name-QmVEitoYcGGs3WPRCkTdygEEtgdytbP7iSDuAwkAipg9wi.musicxml` |
| QmZLmx4e4iS7fXab9qDW1XQkTGhkHDryn36t7g8pYfhZVv | Virus | Iron Maiden / Blaze Bayley Dave MurrayJanick Gers and Steve Harrisarr. by Robert Telling | n/a | MIXED_WITH_PIANO | Piano; Violin | 4/4,9/8 | 173 | 0 | 0.00 (0) | 3693 | unknown | 962409 | artist Iron Maiden, song #3; `xml/L-artists/virus-QmZLmx4e4iS7fXab9qDW1XQkTGhkHDryn36t7g8pYfhZVv.musicxml` |
| QmS4UQ3cPqnpBJ2PiBZ5Z79Ky4dg4HEmfSfoJ4D6utRx2g | Iron man - Black Sabbath | Black Sabbath /  | n/a | LEADSHEET | Guitarra Elétrica | 4/4,2/4 | 54 | 121 | 0.00 (0) | 3 | unknown | 195081 | already dumped under K-metal; `xml/K-metal/iron-man-black-sabbath-QmS4UQ3cPqnpBJ2PiBZ5Z79Ky4dg4HEmfSfoJ4D6utRx2g.musicxml` |
| QmVXyyBv6Jh46KmF1pY1jGGTuB8XrYDHRT7cuQ48xsPcbe | Black Sabbath - Fluff | Black Sabbath / Tony Iommi | n/a | MIXED_WITH_PIANO | Piano; Acoustic Guitar; Electric Guitar; Piano | 3/4 | 175 | 0 | 4.73 (12) | 2599 | unknown | 744174 | artist Black Sabbath, song #2; `xml/L-artists/black-sabbath-fluff-QmVXyyBv6Jh46KmF1pY1jGGTuB8XrYDHRT7cuQ48xsPcbe.musicxml` |
| QmU6qdsWTZAN5p3wzQNA3HBS6UVSAayhQbrbnwj8LPQ6Vr | Final Masquerade |  / Linkin Park | n/a | LEADSHEET | Voice | 4/4 | 25 | 25 | 0.00 (0) | 127 | in-copyright | 85524 | artist Linkin Park, song #1; `xml/L-artists/final-masquerade-QmU6qdsWTZAN5p3wzQNA3HBS6UVSAayhQbrbnwj8LPQ6Vr.musicxml` |
| QmaYoHQDWpE1ti5hDEGBxS1UKfn7SCJCpQtgQ6MLqtr7Nd |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 441641 | artist Linkin Park, song #1; alternate edition kept: shape PIANO_GRAND_STAFF vs LEADSHEET; `xml/L-artists/linkin-park-final-masquerade-QmaYoHQDWpE1ti5hDEGBxS1UKfn7SCJCpQtgQ6MLqtr7Nd.musicxml` |
| QmTAZ6A8z4vBFgQwpN5STorC5osK59XKQV6o1WWJ9vaGc5 | Leave Out All the Rest - Linkin Park | Linkin Park / Linkin Park | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 67 | 0 | 4.86 (75) | 2870 | in-copyright | 551829 | artist Linkin Park, song #2; `xml/L-artists/leave-out-all-the-rest-linkin-park-QmTAZ6A8z4vBFgQwpN5STorC5osK59XKQV6o1WWJ9vaGc5.musicxml` |
| QmWYEvKnbTqk4yqWj1pp41PHfTuQU9BaFvLjEqUHxa6bmK | My December | Linkin Park / Linkin Park | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 97 | 0 | 4.89 (24) | 4921 | in-copyright | 523460 | artist Linkin Park, song #3; `xml/L-artists/my-december-QmWYEvKnbTqk4yqWj1pp41PHfTuQU9BaFvLjEqUHxa6bmK.musicxml` |
| QmW1fMWmYyYEVrWZMztR41GGEQ6MFvfdpNxvqp2HgDJajh | Linkin Park Crawling Piano Score | Linkin Park /  | n/a | PIANO_GRAND_STAFF | Piano, acoustic_grand_piano_ydp_20080910 1 | 4/4 | 94 | 0 | 4.93 (12) | 768 | in-copyright | 620413 | artist Linkin Park, song #4; `xml/L-artists/linkin-park-crawling-piano-score-QmW1fMWmYyYEVrWZMztR41GGEQ6MFvfdpNxvqp2HgDJajh.musicxml` |
| QmYXmyZyGp2FUzjDvVF1zRT4eVcA2XrvSUq543cQW4wY3C | aloha line 2020 | Foo Fighters /  | n/a | MIXED_WITH_PIANO | Snare Drum; Tenor Drums; Bass Drums; Cymbals; Vibraphone; Xylophone; Marimba; Marimba; Piano; Drumset | 3/4,2/4,4/4 | 168 | 0 | 0.00 (0) | 84 | unknown | 2470311 | artist Foo Fighters, song #1; `xml/L-artists/aloha-line-2020-QmYXmyZyGp2FUzjDvVF1zRT4eVcA2XrvSUq543cQW4wY3C.musicxml` |
| QmcAA9JrE3AbvgGiBgWy6ACTNFDPzESomoCyQe9cDpbEme |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 413429 | artist Foo Fighters, song #1; alternate edition kept: shape PIANO1 vs MIXED_WITH_PIANO; `xml/L-artists/everlong-QmcAA9JrE3AbvgGiBgWy6ACTNFDPzESomoCyQe9cDpbEme.musicxml` |
| QmWUQJBDFEQ9xHjGPWqEn6goguxFEbtu72QvM4FKnQEVWF | The Pretender | Foo Fighters / Foo Fighters | n/a | PIANO1 | Batterie | 4/4,2/4 | 119 | 0 | 4.71 (4) | 399 | unknown | 326411 | artist Foo Fighters, song #2; `xml/L-artists/the-pretender-QmWUQJBDFEQ9xHjGPWqEn6goguxFEbtu72QvM4FKnQEVWF.musicxml` |
| QmcJRkptrVetWEAJibzZgn4FjTLZbb3NWyMnD8Ce9azWNh | Coldplay - The Scientist | Coldplay /  | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 22 | 22 | 4.71 (4) | 461 | unknown | 137734 | already dumped under I-pop; `xml/I-pop/coldplay-the-scientist-QmcJRkptrVetWEAJibzZgn4FjTLZbb3NWyMnD8Ce9azWNh.musicxml` |
| QmdkybbcYoQvYXXmfRyryox5soKGquvQVkaHn2bVx6oBZ7 |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 192314 | already dumped under I-pop; `xml/I-pop/the-scientist-QmdkybbcYoQvYXXmfRyryox5soKGquvQVkaHn2bVx6oBZ7.musicxml` |
| QmYG2q5NcJCVydHQ66n3b3WULnW5X5NbvprNDtb2wnqq2C | Speed of Sound | Coldplay / Coldplay | n/a | PIANO_GRAND_STAFF | Piano; Piano | 4/4 | 77 | 0 | 4.94 (15) | 12974 | unknown | 416097 | artist Coldplay, song #2; `xml/L-artists/speed-of-sound-QmYG2q5NcJCVydHQ66n3b3WULnW5X5NbvprNDtb2wnqq2C.musicxml` |
| QmTXa9BRcsEwYH6nUY9pyWp4TiZeDrKsuPmActkce1rkh7 | Trouble Coldplay | Coldplay / Coldplay | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 45 | 0 | 4.73 (314) | 78220 | unknown | 256149 | artist Coldplay, song #3; `xml/L-artists/trouble-coldplay-QmTXa9BRcsEwYH6nUY9pyWp4TiZeDrKsuPmActkce1rkh7.musicxml` |
| QmQsRid5CzsBneXBtLrsE46BDGFn2BseetPyCUQUMdVcxg | Fix You Coldplay | Coldplay / Coldplay | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 53 | 0 | 4.68 (771) | 246303 | unknown | 321976 | artist Coldplay, song #4; `xml/L-artists/fix-you-coldplay-QmQsRid5CzsBneXBtLrsE46BDGFn2BseetPyCUQUMdVcxg.musicxml` |
| QmaX4Pkqc1tDyVk7yy8Fkhq4nSjViaBfyLwA3rKuNKChiQ |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 575556 | artist Coldplay, song #4; alternate edition kept: shape MULTI_PIANO_PART vs PIANO_GRAND_STAFF; `xml/L-artists/fix-you-by-coldplay-QmaX4Pkqc1tDyVk7yy8Fkhq4nSjViaBfyLwA3rKuNKChiQ.musicxml` |
| QmWHuH93tfZDfidx55ac1ZnxDY9tR2sTEHbSPMAP2kpPjD |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 119800 | artist Coldplay, song #4; alternate edition kept: shape PIANO1 vs PIANO_GRAND_STAFF; `xml/L-artists/fix-you-QmWHuH93tfZDfidx55ac1ZnxDY9tR2sTEHbSPMAP2kpPjD.musicxml` |
| QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn | Billy Joel - She's Always A Woman | Billy Joel / Billy Joel | n/a | PIANO_GRAND_STAFF | Piano | 12/8,6/8,9/8 | 40 | 129 | 4.80 (101) | 7040 | unknown | 385842 | already dumped under I-pop; `xml/I-pop/billy-joel-shes-always-a-woman-QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn.musicxml` |
| QmUkekPKGR983LBTg8oK7QYh1rKLkUmUNnKJrMLWRKm4Nx | Vienna Billy Joel | Billy Joel / Billy Joel | n/a | LEADSHEET | Piano | 4/4 | 107 | 95 | 4.48 (28) | 3097 | unknown | 206341 | already dumped under I-pop; `xml/I-pop/vienna-billy-joel-QmUkekPKGR983LBTg8oK7QYh1rKLkUmUNnKJrMLWRKm4Nx.musicxml` |
| QmSyDuL23d8LtVWeGEk1XSTTzbZgSWU4AsEcEmU5A7LjJt |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 518746 | already dumped under I-pop; `xml/I-pop/vienna-QmSyDuL23d8LtVWeGEk1XSTTzbZgSWU4AsEcEmU5A7LjJt.musicxml` |
| QmWTnL3HmQ5JJuyzmYK7SdJuvZ2Xc1PZ3AWHijaQ4dhxUM | And So It Goes | Billy Joel / Billy Joel | n/a | PIANO_GRAND_STAFF | Piano | 3/4,4/4,2/4 | 69 | 0 | 4.80 (161) | 16089 | unknown | 432827 | artist Billy Joel, song #3; `xml/L-artists/and-so-it-goes-QmWTnL3HmQ5JJuyzmYK7SdJuvZ2Xc1PZ3AWHijaQ4dhxUM.musicxml` |
| QmZTntpWyVxPocpcy7XDb3R5Ck4NxSUF8PdSWWLuEH1SPb |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 556489 | artist Billy Joel, song #3; alternate edition kept: shape MULTI_PIANO_PART vs PIANO_GRAND_STAFF; `xml/L-artists/and-so-is-goes-QmZTntpWyVxPocpcy7XDb3R5Ck4NxSUF8PdSWWLuEH1SPb.musicxml` |
| QmYp2Waj5h4khKz5Tr7D9AHwgMBbaumTxfpDkiVjBE6xKH | Uptown Girl | Billy Joel /  | n/a | PIANO_GRAND_STAFF | Part_1 |  | 97 | 0 | 4.72 (19) | 1142 | unknown | 486913 | artist Billy Joel, song #4; `xml/L-artists/uptown-girl-QmYp2Waj5h4khKz5Tr7D9AHwgMBbaumTxfpDkiVjBE6xKH.musicxml` |
| QmSj1cyUhcFmnhKdibiMpNqoEZkFdM47NxnqbmgVsbup62 | Daniel Elton John/Bernie Taupin piano cover | Elton John /  | n/a | PIANO_GRAND_STAFF | Piano | 2/2 | 126 | 163 | 4.74 (106) | 3415 | unknown | 872130 | artist Elton John, song #1; `xml/L-artists/daniel-elton-john-bernie-taupin-piano-co-QmSj1cyUhcFmnhKdibiMpNqoEZkFdM47NxnqbmgVsbup62.musicxml` |
| QmTLkSX6MxkF9n4dF3FMH7cvfjR4vSLkvbjQRkL3EpWVzP | The King | Elton John / jc | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 11 | 8 | 0.00 (0) | 2586 | unknown | 29856 | artist Elton John, song #2; `xml/L-artists/the-king-QmTLkSX6MxkF9n4dF3FMH7cvfjR4vSLkvbjQRkL3EpWVzP.musicxml` |
| QmWHYEAX4AmV1nJiSsabYUip5QYg6WcnRFB1b912dU2yEp |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 49954 | artist Elton John, song #2; alternate edition kept: bars 46 vs 11 (more than 25% apart); `xml/L-artists/the-circle-of-life-QmWHYEAX4AmV1nJiSsabYUip5QYg6WcnRFB1b912dU2yEp.musicxml` |
| QmeQQcvhQttDeWkUeWsMd71pG6WgJtAwv6xuDShh7YUy7B | Elton John - Rocket Man | Elton John /  | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 47 | 0 | 4.78 (146) | 9149 | unknown | 674535 | already dumped under I-pop; `xml/I-pop/elton-john-rocket-man-QmeQQcvhQttDeWkUeWsMd71pG6WgJtAwv6xuDShh7YUy7B.musicxml` |
| QmTwsXtFetmmCqQeGQgxQZjdjHn14n6L57B4C6dCEgEq7D | [EASY PIANO] Elton John Can you Feel The Love Tonight Lion King OST | Elton John / Elton John. Piano arrranged by Hazel Nguyen | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 61 | 0 | 4.72 (149) | 6087 | unknown | 228250 | artist Elton John, song #4; `xml/L-artists/easy-piano-elton-john-can-you-feel-the-l-QmTwsXtFetmmCqQeGQgxQZjdjHn14n6L57B4C6dCEgEq7D.musicxml` |
| QmVa3v1f1ZmoqjiAveiLbTUv5NZAS4D3ibaMudNwcL5oWT |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 186813 | artist Elton John, song #4; alternate edition kept: bars 36 vs 61 (more than 25% apart); `xml/L-artists/can-you-feel-the-love-tonight-QmVa3v1f1ZmoqjiAveiLbTUv5NZAS4D3ibaMudNwcL5oWT.musicxml` |
| QmPoKC1KNnhFURL5QSo3DRkGEWAoRgDiDEUchNJt79dGRo | Something - The Beatles | The Beatles / George Harrison (Beatles) | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 19 | 39 | 4.54 (384) | 15395 | unknown | 52555 | already dumped under I-pop; `xml/I-pop/something-the-beatles-QmPoKC1KNnhFURL5QSo3DRkGEWAoRgDiDEUchNJt79dGRo.musicxml` |
| QmPEN8ygh1ZdxQxGpoe4Mmo7ToFyWM3kGf2SLHKRgTpqdy |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 352349 | already dumped under I-pop; `xml/I-pop/something-the-beatles-QmPEN8ygh1ZdxQxGpoe4Mmo7ToFyWM3kGf2SLHKRgTpqdy.musicxml` |
| QmeEtYGFYUSj7MtF3AqZ2q5BBcFBNKHYb4DxZSbSensoXJ | She is not a Girl who misses much_opening-1st-movement |  / John Lennon | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 12 | 16 | 0.00 (0) | 51 | unknown | 95018 | artist Beatles, song #2; `xml/L-artists/she-is-not-a-girl-who-misses-much-openin-QmeEtYGFYUSj7MtF3AqZ2q5BBcFBNKHYb4DxZSbSensoXJ.musicxml` |
| QmQ1qVi1RHonfqDZydkmHSwTDQ7vzE8rQdojdK2BXTPPw1 | Happy Xmas (War is over) | John Lennon / John Lennon | n/a | PIANO_GRAND_STAFF | Piano | 6/8 | 33 | 0 | 4.70 (70) | 4021 | unknown | 221468 | artist Beatles, song #3; `xml/L-artists/happy-xmas-war-is-over-QmQ1qVi1RHonfqDZydkmHSwTDQ7vzE8rQdojdK2BXTPPw1.musicxml` |
| Qmda2ATyMAktQ12TZz4oBYvPBYHkvZxrbdirqA1t4RWKWH |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 505703 | artist Beatles, song #3; alternate edition kept: bars 163 vs 33 (more than 25% apart); `xml/L-artists/happy-xmas-Qmda2ATyMAktQ12TZz4oBYvPBYHkvZxrbdirqA1t4RWKWH.musicxml` |
| QmeN4WJALWvPGMgvGjvEDtYWhtYH9R9R5LqFZaa1tCwJUY |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 363322 | artist Beatles, song #3; alternate edition kept: shape MIXED_WITH_PIANO vs PIANO_GRAND_STAFF; `xml/L-artists/happy-xmas-war-is-over-QmeN4WJALWvPGMgvGjvEDtYWhtYH9R9R5LqFZaa1tCwJUY.musicxml` |
| QmXAocpmyAT6PCMWzLDkz2c7j8UeafVmZsCg4eLgNKwEN7 | Imagine | John Lennon / John Lennon | n/a | PIANO_GRAND_STAFF | Piano | 4/4 | 35 | 0 | 0.00 (0) | 397 | unknown | 108184 | artist Beatles, song #4; `xml/L-artists/imagine-QmXAocpmyAT6PCMWzLDkz2c7j8UeafVmZsCg4eLgNKwEN7.musicxml` |
| QmaQ2NvEAyzY16spcMFJiEfQoC6MnwVdTDP3S7rpmuRprs |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 273974 | artist Beatles, song #4; alternate edition kept: bars 57 vs 35 (more than 25% apart); `xml/L-artists/imagine-john-lenon-instrumental-QmaQ2NvEAyzY16spcMFJiEfQoC6MnwVdTDP3S7rpmuRprs.musicxml` |
| QmbyERz5Byppdbvk2FkePioKy3Dc5Kv6sFakrv5gui8aHE |  |  /  |  |  |  |  |  |  | 0.00 (0) | 0 |  | 1345384 | artist Beatles, song #4; alternate edition kept: shape MIXED_WITH_PIANO vs PIANO_GRAND_STAFF; `xml/L-artists/imagine-by-john-lennon-QmbyERz5Byppdbvk2FkePioKy3Dc5Kv6sFakrv5gui8aHE.musicxml` |

- NOT dumped: QmYNGxDPP2QiqUoEVXopowEX5F6p1FHDWEGKY8zeqSytHJ (artist Dream Theater, song #3): skipped: XML 5.4 MB over the 3 MB limit


## Dumped files (first lane that wrote each)

- `xml/A-blues/joe-turner-blues-QmXbcEgNyEXXfV5SKFQ4rK5eJi3xTtPJQm9kMVgM7GTWVK.musicxml` / `summary/A-blues/joe-turner-blues-QmXbcEgNyEXXfV5SKFQ4rK5eJi3xTtPJQm9kMVgM7GTWVK.txt`
- `xml/A-blues/the-jelly-roll-blues-jelly-roll-morton-1-QmbuoFtkky8Xpo8LSiAqkMXzBs2Mtc33L6GFw1kWv9T5S3.musicxml` / `summary/A-blues/the-jelly-roll-blues-jelly-roll-morton-1-QmbuoFtkky8Xpo8LSiAqkMXzBs2Mtc33L6GFw1kWv9T5S3.txt`
- `xml/A-blues/farewell-blues-QmStEZqKASQVCFNhKaHLcQm3R3RbDUPKA477NQ6kWsNToy.musicxml` / `summary/A-blues/farewell-blues-QmStEZqKASQVCFNhKaHLcQm3R3RbDUPKA477NQ6kWsNToy.txt`
- `xml/A-blues/new-orleans-blues-jelly-roll-morton-1925-QmbQRktDiVKVCdRwZc7XKQ7gjJxdFRzHwD68nv7AQhtRtM.musicxml` / `summary/A-blues/new-orleans-blues-jelly-roll-morton-1925-QmbQRktDiVKVCdRwZc7XKQ7gjJxdFRzHwD68nv7AQhtRtM.txt`
- `xml/A-blues/boogie-woogie-QmRMcZyoTUeHHZiSkZbUymkaxU45UTAaWTLpaK4bRetiRz.musicxml` / `summary/A-blues/boogie-woogie-QmRMcZyoTUeHHZiSkZbUymkaxU45UTAaWTLpaK4bRetiRz.txt`
- `xml/A-blues/blues-riff-in-c-120-bpm-Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.musicxml` / `summary/A-blues/blues-riff-in-c-120-bpm-Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.txt`
- `xml/A-blues/12-bar-blues-QmduvvF9WYbSxgdNZLWZHwiPmD6Bk4bDg9kvssqRP3pu6h.musicxml` / `summary/A-blues/12-bar-blues-QmduvvF9WYbSxgdNZLWZHwiPmD6Bk4bDg9kvssqRP3pu6h.txt`
- `xml/A-blues/sweet-home-chicago-Qmc7nrZ28Se5SVgSoRrGFmwTU5Gij48F344eGPRhTu6kwv.musicxml` / `summary/A-blues/sweet-home-chicago-Qmc7nrZ28Se5SVgSoRrGFmwTU5Gij48F344eGPRhTu6kwv.txt`
- `xml/A-blues/blues-in-f-for-bass-lesson-QmXgWdLZyrDFZSLcK23xY8uhh2fN8y2AjuYYdyfUfAzJ2f.musicxml` / `summary/A-blues/blues-in-f-for-bass-lesson-QmXgWdLZyrDFZSLcK23xY8uhh2fN8y2AjuYYdyfUfAzJ2f.txt`
- `xml/A-blues/pinetops-boogie-woogie-in-f-edited-by-ti-QmU7rsQ1UcCDqoY36Xk9qBQk8f6JcZgDFoAx9w96rSNYx3.musicxml` / `summary/A-blues/pinetops-boogie-woogie-in-f-edited-by-ti-QmU7rsQ1UcCDqoY36Xk9qBQk8f6JcZgDFoAx9w96rSNYx3.txt`
- `xml/A-blues/jeeves-boogie-woogie-QmbJaTpRSBaVyquinmmn9W4yHVX4XxZqhNJJz1quQkzjPT.musicxml` / `summary/A-blues/jeeves-boogie-woogie-QmbJaTpRSBaVyquinmmn9W4yHVX4XxZqhNJJz1quQkzjPT.txt`
- `xml/B-jazz/after-youve-gone-QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU.musicxml` / `summary/B-jazz/after-youve-gone-QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU.txt`
- `xml/B-jazz/beginner-version-sweet-georgia-brown-QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5.musicxml` / `summary/B-jazz/beginner-version-sweet-georgia-brown-QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5.txt`
- `xml/B-jazz/autumn-leaves-transcription-QmeeqT5bwUfEqU9w8ZGXXLgp49DQra1tM23aD85ipXiXXv.musicxml` / `summary/B-jazz/autumn-leaves-transcription-QmeeqT5bwUfEqU9w8ZGXXLgp49DQra1tM23aD85ipXiXXv.txt`
- `xml/B-jazz/autumn-leaves-QmYjsj12FbAhMvLKL2fRdok4XLzGrY7MFFPQLP1Gtj4w4i.musicxml` / `summary/B-jazz/autumn-leaves-QmYjsj12FbAhMvLKL2fRdok4XLzGrY7MFFPQLP1Gtj4w4i.txt`
- `xml/B-jazz/autumn-leaves-QmR8ycCSt3M7NwcgPCqgZ6woPFg7YCbiyoGR79VFM3zh7v.musicxml` / `summary/B-jazz/autumn-leaves-QmR8ycCSt3M7NwcgPCqgZ6woPFg7YCbiyoGR79VFM3zh7v.txt`
- `xml/B-jazz/fly-me-to-the-moon-QmeRR6uYMPKEGwESKPLQqceqFVpkKVHitRFvMsH62kxdPG.musicxml` / `summary/B-jazz/fly-me-to-the-moon-QmeRR6uYMPKEGwESKPLQqceqFVpkKVHitRFvMsH62kxdPG.txt`
- `xml/B-jazz/fly-me-to-the-moon-QmS2enG17nJVrbMvvCcHDW9wAN8nLSV1CPMmtghD7SZFVQ.musicxml` / `summary/B-jazz/fly-me-to-the-moon-QmS2enG17nJVrbMvvCcHDW9wAN8nLSV1CPMmtghD7SZFVQ.txt`
- `xml/B-jazz/fly-me-to-the-moon-QmbLMWEPv367xSv1Ep7nQFLnUGXpBeHR4RU94USYT3Pv6A.musicxml` / `summary/B-jazz/fly-me-to-the-moon-QmbLMWEPv367xSv1Ep7nQFLnUGXpBeHR4RU94USYT3Pv6A.txt`
- `xml/B-jazz/blue-bossa-QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.musicxml` / `summary/B-jazz/blue-bossa-QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.txt`
- `xml/B-jazz/blue-bossa-QmW1LrCG2Z7BF7V4UxSt1fDX8MhTSBYmPht74JYMvT6mNm.musicxml` / `summary/B-jazz/blue-bossa-QmW1LrCG2Z7BF7V4UxSt1fDX8MhTSBYmPht74JYMvT6mNm.txt`
- `xml/B-jazz/blue-bossa-tnor-sax-dexter-gordon-QmSEhWQs6biwJCkU8EidMCmdxd3K4bTPgUAjq9srGdofvY.musicxml` / `summary/B-jazz/blue-bossa-tnor-sax-dexter-gordon-QmSEhWQs6biwJCkU8EidMCmdxd3K4bTPgUAjq9srGdofvY.txt`
- `xml/B-jazz/there-will-never-be-another-you-QmY7mQ3qBC5FhfJpQaqZQzTU4RFzkkDwGaahU5z9BNKrkQ.musicxml` / `summary/B-jazz/there-will-never-be-another-you-QmY7mQ3qBC5FhfJpQaqZQzTU4RFzkkDwGaahU5z9BNKrkQ.txt`
- `xml/B-jazz/there-will-never-be-another-you-solo-QmQnxPJgjZg8RGGDNVZpRd9fCiGCAmSoLNTfFMn6iwmist.musicxml` / `summary/B-jazz/there-will-never-be-another-you-solo-QmQnxPJgjZg8RGGDNVZpRd9fCiGCAmSoLNTfFMn6iwmist.txt`
- `xml/B-jazz/satin-doll-1-7-17-Qmdye71EVqEvQ24Qy6dPy9J7aP637DYiWJNjsGVBEnCSwS.musicxml` / `summary/B-jazz/satin-doll-1-7-17-Qmdye71EVqEvQ24Qy6dPy9J7aP637DYiWJNjsGVBEnCSwS.txt`
- `xml/B-jazz/satin-doll-QmSC5ngWJnN3RxvpWsh6Xu5Go6QFkFjKVcZmCefFBgnjku.musicxml` / `summary/B-jazz/satin-doll-QmSC5ngWJnN3RxvpWsh6Xu5Go6QFkFjKVcZmCefFBgnjku.txt`
- `xml/B-jazz/all-of-me-QmVbSHLuJ2CHRrfS3kHoWHsPGCqtcLTjNdBA5YCgFg7Bpw.musicxml` / `summary/B-jazz/all-of-me-QmVbSHLuJ2CHRrfS3kHoWHsPGCqtcLTjNdBA5YCgFg7Bpw.txt`
- `xml/B-jazz/all-of-me-QmXyzSWWSzrnKnHzKYt74DM3K3yuUr4zw9Gv47g6Qp9kaf.musicxml` / `summary/B-jazz/all-of-me-QmXyzSWWSzrnKnHzKYt74DM3K3yuUr4zw9Gv47g6Qp9kaf.txt`
- `xml/B-jazz/all-of-me-solo-Qma4PdEYH5tZRhTy4MBxkFoP4Nk9MM2iTdgEFzHi2nk6Hq.musicxml` / `summary/B-jazz/all-of-me-solo-Qma4PdEYH5tZRhTy4MBxkFoP4Nk9MM2iTdgEFzHi2nk6Hq.txt`
- `xml/C-jam/st-james-infirmary-Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs.musicxml` / `summary/C-jam/st-james-infirmary-Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs.txt`
- `xml/C-jam/st-james-infirmary-QmdiAvFufLNtrhKpF5Zku9sKGyogYaVY51LBpq3NKjAvnQ.musicxml` / `summary/C-jam/st-james-infirmary-QmdiAvFufLNtrhKpF5Zku9sKGyogYaVY51LBpq3NKjAvnQ.txt`
- `xml/C-jam/saint-james-infirmary-QmPTYpb73P5ZJzXgwzg1sJAcAUxCosMCjnjRQxZk7d398y.musicxml` / `summary/C-jam/saint-james-infirmary-QmPTYpb73P5ZJzXgwzg1sJAcAUxCosMCjnjRQxZk7d398y.txt`
- `xml/D-hymns/ludwig-van-beethoven-joyful-joyful-we-ad-QmY8XeRQK9L3q6Rndkex64R2N5X4LGiQ9CA6qG7U61YyE7.musicxml` / `summary/D-hymns/ludwig-van-beethoven-joyful-joyful-we-ad-QmY8XeRQK9L3q6Rndkex64R2N5X4LGiQ9CA6qG7U61YyE7.txt`
- `xml/D-hymns/deep-river-african-american-spiritual-QmbP96wZt5Vev9pA8pembvkaMw2wx48M3PR3pWNMfJuASp.musicxml` / `summary/D-hymns/deep-river-african-american-spiritual-QmbP96wZt5Vev9pA8pembvkaMw2wx48M3PR3pWNMfJuASp.txt`
- `xml/D-hymns/steal-away-to-jesus-african-american-spi-QmcrnJ2b9XrAey8CPrVRj5xn55Tvy4dfZe1aFr6FVTHBBs.musicxml` / `summary/D-hymns/steal-away-to-jesus-african-american-spi-QmcrnJ2b9XrAey8CPrVRj5xn55Tvy4dfZe1aFr6FVTHBBs.txt`
- `xml/D-hymns/ode-to-joy-QmXWBURe48nbNXaFgz4Fhuv3p43nvqukyGufkYujjmFoCZ.musicxml` / `summary/D-hymns/ode-to-joy-QmXWBURe48nbNXaFgz4Fhuv3p43nvqukyGufkYujjmFoCZ.txt`
- `xml/D-hymns/ode-to-joy-QmejAvfGAAdj9ZNpU76p7BCpSvxnzSdW2RwfhxbB2mQzZF.musicxml` / `summary/D-hymns/ode-to-joy-QmejAvfGAAdj9ZNpU76p7BCpSvxnzSdW2RwfhxbB2mQzZF.txt`
- `xml/D-hymns/ode-to-joy-for-orchestra-QmSsj7o5AWXjdDAgKkXpohjam3ZRYZhcteQXNBw6vsex7s.musicxml` / `summary/D-hymns/ode-to-joy-for-orchestra-QmSsj7o5AWXjdDAgKkXpohjam3ZRYZhcteQXNBw6vsex7s.txt`
- `xml/D-hymns/nearer-my-god-to-thee-sarah-flower-adams-QmQoPSv4kUm2wgZE4jtrsCgPHu3u6GMG9mnEzxhqKxE46z.musicxml` / `summary/D-hymns/nearer-my-god-to-thee-sarah-flower-adams-QmQoPSv4kUm2wgZE4jtrsCgPHu3u6GMG9mnEzxhqKxE46z.txt`
- `xml/D-hymns/nearer-my-god-to-thee-arthur-s-sullivan-QmQVNEqW4vw38TNZ1ogyn7JqgTCZWzPZTHvYg6sZDYmStN.musicxml` / `summary/D-hymns/nearer-my-god-to-thee-arthur-s-sullivan-QmQVNEqW4vw38TNZ1ogyn7JqgTCZWzPZTHvYg6sZDYmStN.txt`
- `xml/D-hymns/holy-holy-holy-john-b-dykes-QmWyFckvyoMiNLFawUiRMTeH2USzFHijjt8TdEWbTRDQ7N.musicxml` / `summary/D-hymns/holy-holy-holy-john-b-dykes-QmWyFckvyoMiNLFawUiRMTeH2USzFHijjt8TdEWbTRDQ7N.txt`
- `xml/D-hymns/holy-holy-holy-QmTPmBvCqSrpJTdr87B77a5yprLJM1L6p2yUfmpoBSJW43.musicxml` / `summary/D-hymns/holy-holy-holy-QmTPmBvCqSrpJTdr87B77a5yprLJM1L6p2yUfmpoBSJW43.txt`
- `xml/D-hymns/santo-santo-santo-senor-omnipotente-regi-QmcodnT6QU8nyDU29s77ipj1GoRgZCMiuzsLD365sqFnfY.musicxml` / `summary/D-hymns/santo-santo-santo-senor-omnipotente-regi-QmcodnT6QU8nyDU29s77ipj1GoRgZCMiuzsLD365sqFnfY.txt`
- `xml/D-hymns/deep-river-and-swing-low-sweet-chariot-s-QmfDdMdSXX2GPW1e818VR5AsLU31JbKxErc5FxR24qivgo.musicxml` / `summary/D-hymns/deep-river-and-swing-low-sweet-chariot-s-QmfDdMdSXX2GPW1e818VR5AsLU31JbKxErc5FxR24qivgo.txt`
- `xml/D-hymns/steal-away-seconds-cymru-Qmd743N6JTPToRbYipMFyadJVZbbzdLVVgT2cy6eYJU2V4.musicxml` / `summary/D-hymns/steal-away-seconds-cymru-Qmd743N6JTPToRbYipMFyadJVZbbzdLVVgT2cy6eYJU2V4.txt`
- `xml/D-hymns/beethoven-symphony-no-9-in-d-minor-op-12-QmUFbAMfeBjxwNVwzfZxgYXR3cWv7424KN19uKNTqQad2K.musicxml` / `summary/D-hymns/beethoven-symphony-no-9-in-d-minor-op-12-QmUFbAMfeBjxwNVwzfZxgYXR3cWv7424KN19uKNTqQad2K.txt`
- `xml/D-hymns/joyful-joyful-we-adore-thee-QmZwo2Muh2rip4gGET7fkkXFgaLQiK6kc6p89ssZbqysxB.musicxml` / `summary/D-hymns/joyful-joyful-we-adore-thee-QmZwo2Muh2rip4gGET7fkkXFgaLQiK6kc6p89ssZbqysxB.txt`
- `xml/E-latin/tico-tico-QmWbvFZYw6cR7ytP7V2SyZm2u6VMGCD31cBnNuWwMoqFLw.musicxml` / `summary/E-latin/tico-tico-QmWbvFZYw6cR7ytP7V2SyZm2u6VMGCD31cBnNuWwMoqFLw.txt`
- `xml/E-latin/so-danco-samba-QmbmC9BRdBLb6XUbyf5TqSy1P1oYdNDYTJoSpd4nXByPMD.musicxml` / `summary/E-latin/so-danco-samba-QmbmC9BRdBLb6XUbyf5TqSy1P1oYdNDYTJoSpd4nXByPMD.txt`
- `xml/E-latin/corcovado-QmWYgg7QifpX4XtkYReco3Psk4GvNgzbeZMeqTBUvabUgF.musicxml` / `summary/E-latin/corcovado-QmWYgg7QifpX4XtkYReco3Psk4GvNgzbeZMeqTBUvabUgF.txt`
- `xml/E-latin/bezeichnung-standardisiert-la-jalousie-QmbEXBfVDk9iNqKRoXudwgcVKFL9yagDcFvwqAwvLt5h5H.musicxml` / `summary/E-latin/bezeichnung-standardisiert-la-jalousie-QmbEXBfVDk9iNqKRoXudwgcVKFL9yagDcFvwqAwvLt5h5H.txt`
- `xml/E-latin/garota-de-ipanema-QmRWDfadi4gsez9ishabhEcHpHNdjC7q2efEJZe5SDa8X8.musicxml` / `summary/E-latin/garota-de-ipanema-QmRWDfadi4gsez9ishabhEcHpHNdjC7q2efEJZe5SDa8X8.txt`
- `xml/E-latin/por-una-cabeza-QmTBJZppfNknV4qdmmCxjar1Qh5BRJNSyDRP919x2JdnMN.musicxml` / `summary/E-latin/por-una-cabeza-QmTBJZppfNknV4qdmmCxjar1Qh5BRJNSyDRP919x2JdnMN.txt`
- `xml/E-latin/por-una-cabeza-carlos-gardel-QmNswaWYXpxK1XegKbJVDULwZMjKN6cETGTVfXQKYsYrzs.musicxml` / `summary/E-latin/por-una-cabeza-carlos-gardel-QmNswaWYXpxK1XegKbJVDULwZMjKN6cETGTVfXQKYsYrzs.txt`
- `xml/E-latin/por-una-cabeza-QmQSWZ1U7q2MoQHVoWBt7htbe8f1JWrGpYpnD1MKytUV2c.musicxml` / `summary/E-latin/por-una-cabeza-QmQSWZ1U7q2MoQHVoWBt7htbe8f1JWrGpYpnD1MKytUV2c.txt`
- `xml/E-latin/girl-from-ipanema-QmZF4m2KTAiHmHpg9eYrG1y2bfQKo2chTxSNYepnmuvHtF.musicxml` / `summary/E-latin/girl-from-ipanema-QmZF4m2KTAiHmHpg9eYrG1y2bfQKo2chTxSNYepnmuvHtF.txt`
- `xml/E-latin/girl-from-impanema-QmcMf1mKhg6iQpaJXRX5JjUXcqaWiP7yZSBJ8troR8wdDt.musicxml` / `summary/E-latin/girl-from-impanema-QmcMf1mKhg6iQpaJXRX5JjUXcqaWiP7yZSBJ8troR8wdDt.txt`
- `xml/E-latin/adios-nonino-QmYNaW9VvQDFWoD159XYCPxmvyJmGBkhrFijb1P1PaLRUE.musicxml` / `summary/E-latin/adios-nonino-QmYNaW9VvQDFWoD159XYCPxmvyJmGBkhrFijb1P1PaLRUE.txt`
- `xml/E-latin/la-negra-tiene-tumbao-QmbYzj8P6PbJ9DwbepDeMSHTVoHyEEMhQRsuTLcqf3bqyd.musicxml` / `summary/E-latin/la-negra-tiene-tumbao-QmbYzj8P6PbJ9DwbepDeMSHTVoHyEEMhQRsuTLcqf3bqyd.txt`
- `xml/E-latin/chiquilin-de-bachin-part-cello-QmWGTwTWmfBr63fU3crPi6q69hJiVaw7caEMs9cJeMHErQ.musicxml` / `summary/E-latin/chiquilin-de-bachin-part-cello-QmWGTwTWmfBr63fU3crPi6q69hJiVaw7caEMs9cJeMHErQ.txt`
- `xml/E-latin/zequinha-de-abreu-tico-tico-QmdTRWW1YANW9XNop1c4cu3tiRHDtwGeZkPEB5GbLQWBdf.musicxml` / `summary/E-latin/zequinha-de-abreu-tico-tico-QmdTRWW1YANW9XNop1c4cu3tiRHDtwGeZkPEB5GbLQWBdf.txt`
- `xml/E-latin/tico-tico-QmejFJRcT7Q9hdFQWbhPZCnewzAzCzVCckYHgsVuN7RcAM.musicxml` / `summary/E-latin/tico-tico-QmejFJRcT7Q9hdFQWbhPZCnewzAzCzVCckYHgsVuN7RcAM.txt`
- `xml/E-latin/bezeichnung-standardisiert-la-jalousie-QmdZTLCS4kM6YJHjRX2D8kp6oEMPBD1w79nZJ2iszfqn3k.musicxml` / `summary/E-latin/bezeichnung-standardisiert-la-jalousie-QmdZTLCS4kM6YJHjRX2D8kp6oEMPBD1w79nZJ2iszfqn3k.txt`
- `xml/F-improv-compose/down-in-the-valley-anonymous-QmWuBBaf6uwZdiWHx1dm9meAW2tXnw6EV7hb93tnDTy3S4.musicxml` / `summary/F-improv-compose/down-in-the-valley-anonymous-QmWuBBaf6uwZdiWHx1dm9meAW2tXnw6EV7hb93tnDTy3S4.txt`
- `xml/F-improv-compose/stephen-foster-oh-susanna-QmchjwvtpXykrxVrMHadPZLP7AHZ4ZgFjEg6qca7xpPFcm.musicxml` / `summary/F-improv-compose/stephen-foster-oh-susanna-QmchjwvtpXykrxVrMHadPZLP7AHZ4ZgFjEg6qca7xpPFcm.txt`
- `xml/F-improv-compose/house-of-the-rising-sun-Qmc3v934xFCPJrgGpH9J8G5qTUhebhrysLwPEFEXhYgStR.musicxml` / `summary/F-improv-compose/house-of-the-rising-sun-Qmc3v934xFCPJrgGpH9J8G5qTUhebhrysLwPEFEXhYgStR.txt`
- `xml/F-improv-compose/prelude-in-f-minor-midiflip-QmPuGugz5TaJioLJg2dVZJHjHAeT6B5JZkHMat2bBJ2RwG.musicxml` / `summary/F-improv-compose/prelude-in-f-minor-midiflip-QmPuGugz5TaJioLJg2dVZJHjHAeT6B5JZkHMat2bBJ2RwG.txt`
- `xml/F-improv-compose/prelude-QmQGGqN9LKPTntnAELbiRrKSHEyGUwJsa7WP3rRmZAfMWz.musicxml` / `summary/F-improv-compose/prelude-QmQGGqN9LKPTntnAELbiRrKSHEyGUwJsa7WP3rRmZAfMWz.txt`
- `xml/F-improv-compose/waltz-in-der-freisch-utz-QmWxr9gKwW1pzpsdPHt9et25U8zpWgdgdfDiCPzbHPr6kj.musicxml` / `summary/F-improv-compose/waltz-in-der-freisch-utz-QmWxr9gKwW1pzpsdPHt9et25U8zpWgdgdfDiCPzbHPr6kj.txt`
- `xml/F-improv-compose/the-sussex-waltz-QmeAPWQf2EFTmmhmppmnmb3sUDcG3TR7EGUvF6e8ahkH1F.musicxml` / `summary/F-improv-compose/the-sussex-waltz-QmeAPWQf2EFTmmhmppmnmb3sUDcG3TR7EGUvF6e8ahkH1F.txt`
- `xml/F-improv-compose/waltz-QmYJ6QHJF2hx465Mn1XaXNm6e7LVX9f6fUwDhRKHhGr8Uy.musicxml` / `summary/F-improv-compose/waltz-QmYJ6QHJF2hx465Mn1XaXNm6e7LVX9f6fUwDhRKHhGr8Uy.txt`
- `xml/F-improv-compose/waltz-from-bohemian-girl-QmPEY3crzydpj5eUcSRcTwPit1FkB3W2i8i3YR5KMJKjtq.musicxml` / `summary/F-improv-compose/waltz-from-bohemian-girl-QmPEY3crzydpj5eUcSRcTwPit1FkB3W2i8i3YR5KMJKjtq.txt`
- `xml/F-improv-compose/a-minuet-in-g-major-QmPHf2JSTdnKNosdwGu2hJqisutHgj26kCF3gxmEJF7w86.musicxml` / `summary/F-improv-compose/a-minuet-in-g-major-QmPHf2JSTdnKNosdwGu2hJqisutHgj26kCF3gxmEJF7w86.txt`
- `xml/F-improv-compose/new-bath-minuet-roose-0602-QmPepZe1DwJjbUgcsCjWcXaiAX4dWR2WDcpnuVHNJFRqh9.musicxml` / `summary/F-improv-compose/new-bath-minuet-roose-0602-QmPepZe1DwJjbUgcsCjWcXaiAX4dWR2WDcpnuVHNJFRqh9.txt`
- `xml/F-improv-compose/minuet-QmfRYEUhXHSj9a8yk5s4b5ErUsrQ3QkNNxgcJhfU65VjfE.musicxml` / `summary/F-improv-compose/minuet-QmfRYEUhXHSj9a8yk5s4b5ErUsrQ3QkNNxgcJhfU65VjfE.txt`
- `xml/F-improv-compose/sir-charles-sedleys-minuet-QmNUWroXAYG9wXWCoarts9czwu12XqSGUatoH6Mu4NFCHP.musicxml` / `summary/F-improv-compose/sir-charles-sedleys-minuet-QmNUWroXAYG9wXWCoarts9czwu12XqSGUatoH6Mu4NFCHP.txt`
- `xml/F-improv-compose/sjijnymyra-valsen-QmP2ZXtAS6AmkUD5rKSbAPPLv3fX9vrAgFZnxXA2VVQR8W.musicxml` / `summary/F-improv-compose/sjijnymyra-valsen-QmP2ZXtAS6AmkUD5rKSbAPPLv3fX9vrAgFZnxXA2VVQR8W.txt`
- `xml/F-improv-compose/paspie-minuet-QmRHUvoP5kRkt9TgZJ2aWQPbWbmZJ7mHwfhZ5UnEsPkdai.musicxml` / `summary/F-improv-compose/paspie-minuet-QmRHUvoP5kRkt9TgZJ2aWQPbWbmZJ7mHwfhZ5UnEsPkdai.txt`
- `xml/G-holiday/maoz-tsur-QmY9tPFTtU9CZU8FMZr6YSDF27aahfYxC76KJnxAYtLYEC.musicxml` / `summary/G-holiday/maoz-tsur-QmY9tPFTtU9CZU8FMZr6YSDF27aahfYxC76KJnxAYtLYEC.txt`
- `xml/G-holiday/maoz-tsur-QmSe5SBzVY7xuqiqbPmyNF9tcMb5LBNnWUfnKbYung75mY.musicxml` / `summary/G-holiday/maoz-tsur-QmSe5SBzVY7xuqiqbPmyNF9tcMb5LBNnWUfnKbYung75mY.txt`
- `xml/G-holiday/thank-you-for-hanukkah-2nd-preview-QmZetUgU9jAbbc8t2zNpMae93a6BYMcCRGQC7Guu9e5C9Y.musicxml` / `summary/G-holiday/thank-you-for-hanukkah-2nd-preview-QmZetUgU9jAbbc8t2zNpMae93a6BYMcCRGQC7Guu9e5C9Y.txt`
- `xml/G-holiday/thank-you-for-hanukkah-1st-preview-QmenWa22efzTQD2VSB3oCNq3tA7jSsRAuJz9oPicb9rSa5.musicxml` / `summary/G-holiday/thank-you-for-hanukkah-1st-preview-QmenWa22efzTQD2VSB3oCNq3tA7jSsRAuJz9oPicb9rSa5.txt`
- `xml/G-holiday/dreidel-song-lowe-v2-QmaA1mDoFknzx5s2Es9zchiUMGo8QRF1y2CiN4MmoyNs9Q.musicxml` / `summary/G-holiday/dreidel-song-lowe-v2-QmaA1mDoFknzx5s2Es9zchiUMGo8QRF1y2CiN4MmoyNs9Q.txt`
- `xml/G-holiday/oy-chanukah-QmUoWMKdVsCa1XKZVmeG9DyNbFCRbN2KYMf2htqUg6w64r.musicxml` / `summary/G-holiday/oy-chanukah-QmUoWMKdVsCa1XKZVmeG9DyNbFCRbN2KYMf2htqUg6w64r.txt`
- `xml/G-holiday/the-dreydl-song-anonymous-traditional-QmSarCz8x1vF7uW9bqG2aTxw4uwwPeK4vfDCEi2uvkiCvW.musicxml` / `summary/G-holiday/the-dreydl-song-anonymous-traditional-QmSarCz8x1vF7uW9bqG2aTxw4uwwPeK4vfDCEi2uvkiCvW.txt`
- `xml/H-ragtime/the-harlem-rag-1899-tyers-QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9.musicxml` / `summary/H-ragtime/the-harlem-rag-1899-tyers-QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9.txt`
- `xml/H-ragtime/cosgroves-cakewalk-Qme3vDrh4eg9Gk4FSqeuSag3Ft5LdbrrZzWgsRphr2CuLB.musicxml` / `summary/H-ragtime/cosgroves-cakewalk-Qme3vDrh4eg9Gk4FSqeuSag3Ft5LdbrrZzWgsRphr2CuLB.txt`
- `xml/H-ragtime/heliotrope-bouquet-joplin-and-chauvin-19-Qma4jk2XgsU8hYgjmUTt3EyeqtwNW8Y8ZqJaxHuKo37DzK.musicxml` / `summary/H-ragtime/heliotrope-bouquet-joplin-and-chauvin-19-Qma4jk2XgsU8hYgjmUTt3EyeqtwNW8Y8ZqJaxHuKo37DzK.txt`
- `xml/H-ragtime/the-ragtime-dance-scott-joplin-1906-arra-QmXd7HNnNZodQvrybARoZN8NtcZ2LVpJ1Wxbkc8Gq9YJ36.musicxml` / `summary/H-ragtime/the-ragtime-dance-scott-joplin-1906-arra-QmXd7HNnNZodQvrybARoZN8NtcZ2LVpJ1Wxbkc8Gq9YJ36.txt`
- `xml/H-ragtime/sunflower-slow-drag-joplin-and-hayden-19-QmPdy5cVQ2tE9qMWhwLhVd2QtZh26inRSadFmcwkoypkpN.musicxml` / `summary/H-ragtime/sunflower-slow-drag-joplin-and-hayden-19-QmPdy5cVQ2tE9qMWhwLhVd2QtZh26inRSadFmcwkoypkpN.txt`
- `xml/I-pop/billy-joel-shes-always-a-woman-QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn.musicxml` / `summary/I-pop/billy-joel-shes-always-a-woman-QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn.txt`
- `xml/I-pop/coldplay-the-scientist-QmcJRkptrVetWEAJibzZgn4FjTLZbb3NWyMnD8Ce9azWNh.musicxml` / `summary/I-pop/coldplay-the-scientist-QmcJRkptrVetWEAJibzZgn4FjTLZbb3NWyMnD8Ce9azWNh.txt`
- `xml/I-pop/the-scientist-QmdkybbcYoQvYXXmfRyryox5soKGquvQVkaHn2bVx6oBZ7.musicxml` / `summary/I-pop/the-scientist-QmdkybbcYoQvYXXmfRyryox5soKGquvQVkaHn2bVx6oBZ7.txt`
- `xml/I-pop/the-scientist-QmNUahv3eDtDYj6pwcWKNXQ89UXRe5xfjT1L6MVCe8fvZP.musicxml` / `summary/I-pop/the-scientist-QmNUahv3eDtDYj6pwcWKNXQ89UXRe5xfjT1L6MVCe8fvZP.txt`
- `xml/I-pop/when-we-were-young-adele-accompaniment-QmQhzFncR7uFfyVdjDmNZBQSVgkffiyeXwhQXfYUNA4ZyN.musicxml` / `summary/I-pop/when-we-were-young-adele-accompaniment-QmQhzFncR7uFfyVdjDmNZBQSVgkffiyeXwhQXfYUNA4ZyN.txt`
- `xml/I-pop/something-the-beatles-QmPoKC1KNnhFURL5QSo3DRkGEWAoRgDiDEUchNJt79dGRo.musicxml` / `summary/I-pop/something-the-beatles-QmPoKC1KNnhFURL5QSo3DRkGEWAoRgDiDEUchNJt79dGRo.txt`
- `xml/I-pop/something-the-beatles-QmPEN8ygh1ZdxQxGpoe4Mmo7ToFyWM3kGf2SLHKRgTpqdy.musicxml` / `summary/I-pop/something-the-beatles-QmPEN8ygh1ZdxQxGpoe4Mmo7ToFyWM3kGf2SLHKRgTpqdy.txt`
- `xml/I-pop/something-QmSEP572SsajfnvFbv7LvX3834H2SXA48k8m3RpNjAoDyW.musicxml` / `summary/I-pop/something-QmSEP572SsajfnvFbv7LvX3834H2SXA48k8m3RpNjAoDyW.txt`
- `xml/I-pop/vienna-billy-joel-QmUkekPKGR983LBTg8oK7QYh1rKLkUmUNnKJrMLWRKm4Nx.musicxml` / `summary/I-pop/vienna-billy-joel-QmUkekPKGR983LBTg8oK7QYh1rKLkUmUNnKJrMLWRKm4Nx.txt`
- `xml/I-pop/vienna-QmSyDuL23d8LtVWeGEk1XSTTzbZgSWU4AsEcEmU5A7LjJt.musicxml` / `summary/I-pop/vienna-QmSyDuL23d8LtVWeGEk1XSTTzbZgSWU4AsEcEmU5A7LjJt.txt`
- `xml/I-pop/vienna-waltz-jmt-117-QmaFkFGGac9zaNwkHMHMmvhFi5oEWDwVanGn2UEUvNTEzf.musicxml` / `summary/I-pop/vienna-waltz-jmt-117-QmaFkFGGac9zaNwkHMHMmvhFi5oEWDwVanGn2UEUvNTEzf.txt`
- `xml/I-pop/no-surprises-QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M.musicxml` / `summary/I-pop/no-surprises-QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M.txt`
- `xml/I-pop/no-surprises-QmYZGRsLCsNASou3HBU85SfR5T1KQx5hPqZVJa9xHtsbbM.musicxml` / `summary/I-pop/no-surprises-QmYZGRsLCsNASou3HBU85SfR5T1KQx5hPqZVJa9xHtsbbM.txt`
- `xml/I-pop/radiohead-no-surprises-for-drums-QmZv36W7wx6M6iQfXyeABA3PiNZM74qrVJKLqfVuB1ueoo.musicxml` / `summary/I-pop/radiohead-no-surprises-for-drums-QmZv36W7wx6M6iQfXyeABA3PiNZM74qrVJKLqfVuB1ueoo.txt`
- `xml/I-pop/elton-john-rocket-man-QmeQQcvhQttDeWkUeWsMd71pG6WgJtAwv6xuDShh7YUy7B.musicxml` / `summary/I-pop/elton-john-rocket-man-QmeQQcvhQttDeWkUeWsMd71pG6WgJtAwv6xuDShh7YUy7B.txt`
- `xml/I-pop/hallelujah-leonard-cohen-Qmdd97Gg3wapUpvbkHqxB1cMzTgm2NntauTiLuLHWd3Dt1.musicxml` / `summary/I-pop/hallelujah-leonard-cohen-Qmdd97Gg3wapUpvbkHqxB1cMzTgm2NntauTiLuLHWd3Dt1.txt`
- `xml/I-pop/hallelujah-easy-QmViUNieMPGGYJuPCjQj5AnP8a6uUUveHbEbkbXusEaeBm.musicxml` / `summary/I-pop/hallelujah-easy-QmViUNieMPGGYJuPCjQj5AnP8a6uUUveHbEbkbXusEaeBm.txt`
- `xml/I-pop/hallelujah-QmYw5R78E3VXopmZb68rt75AYvMbvi2ByyMhh6dreyLh6W.musicxml` / `summary/I-pop/hallelujah-QmYw5R78E3VXopmZb68rt75AYvMbvi2ByyMhh6dreyLh6W.txt`
- `xml/J-rock/heart-shaped-box-advanced-piano-solo-QmVcTJtm4y12CUByxJjVMnahC4YpxXGGzVJ1jLUwzj9hCt.musicxml` / `summary/J-rock/heart-shaped-box-advanced-piano-solo-QmVcTJtm4y12CUByxJjVMnahC4YpxXGGzVJ1jLUwzj9hCt.txt`
- `xml/J-rock/heart-shaped-box-drum-score-QmSwE96nL8TCeEWcQxscpMdokPhncLkWEsmeL9BymCVSqk.musicxml` / `summary/J-rock/heart-shaped-box-drum-score-QmSwE96nL8TCeEWcQxscpMdokPhncLkWEsmeL9BymCVSqk.txt`
- `xml/J-rock/heart-shaped-box-drum-set-part-Qmd5N328ZLCNKvpbouEXSxYti12dx9n5tVEcpHpbq4GKE4.musicxml` / `summary/J-rock/heart-shaped-box-drum-set-part-Qmd5N328ZLCNKvpbouEXSxYti12dx9n5tVEcpHpbq4GKE4.txt`
- `xml/J-rock/linkin-park-numb-piano-cover-QmVsJV6oJeAC4MnbePt17zysoFrdyvs5PDokfM8NLxUhJs.musicxml` / `summary/J-rock/linkin-park-numb-piano-cover-QmVsJV6oJeAC4MnbePt17zysoFrdyvs5PDokfM8NLxUhJs.txt`
- `xml/J-rock/numb-QmWQLEEEZtuRkzRLC5D951wXXVj6tToNth5C59bFVJiGga.musicxml` / `summary/J-rock/numb-QmWQLEEEZtuRkzRLC5D951wXXVj6tToNth5C59bFVJiGga.txt`
- `xml/J-rock/muse-hysteria-Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf.musicxml` / `summary/J-rock/muse-hysteria-Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf.txt`
- `xml/J-rock/comfortably-numb-piano-solo-QmaxP2mCUy7TnpX55nhZZsVYe4n93Z9TzSsCgtFKc4KyzH.musicxml` / `summary/J-rock/comfortably-numb-piano-solo-QmaxP2mCUy7TnpX55nhZZsVYe4n93Z9TzSsCgtFKc4KyzH.txt`
- `xml/J-rock/paint-it-black-advanced-piano-solo-QmdGGr7gDBP2yosg6rvEBZhZE6T5ibDGCAX35YQFEvqrJ5.musicxml` / `summary/J-rock/paint-it-black-advanced-piano-solo-QmdGGr7gDBP2yosg6rvEBZhZE6T5ibDGCAX35YQFEvqrJ5.txt`
- `xml/J-rock/starlight-muse-QmdvHDt8aJcLBiY8ZmG7o5t9QDfmqDp9XhmqMquCL95knL.musicxml` / `summary/J-rock/starlight-muse-QmdvHDt8aJcLBiY8ZmG7o5t9QDfmqDp9XhmqMquCL95knL.txt`
- `xml/J-rock/come-as-you-are-QmUZdYocuapo9pjAs7Qbb5JSfhZHyp24Rbm9oZGnWWWq74.musicxml` / `summary/J-rock/come-as-you-are-QmUZdYocuapo9pjAs7Qbb5JSfhZHyp24Rbm9oZGnWWWq74.txt`
- `xml/J-rock/muse-new-born-QmXQNZvfM491cT1Xxn4AK3s2Vgvjn4CEtCtWNUCPQmKoi2.musicxml` / `summary/J-rock/muse-new-born-QmXQNZvfM491cT1Xxn4AK3s2Vgvjn4CEtCtWNUCPQmKoi2.txt`
- `xml/K-metal/iron-man-black-sabbath-QmS4UQ3cPqnpBJ2PiBZ5Z79Ky4dg4HEmfSfoJ4D6utRx2g.musicxml` / `summary/K-metal/iron-man-black-sabbath-QmS4UQ3cPqnpBJ2PiBZ5Z79Ky4dg4HEmfSfoJ4D6utRx2g.txt`
- `xml/K-metal/lonely-day-QmeuoFT1hEJntEUswkFFoJ8UisTFHhjNiW236bsUeiAG7X.musicxml` / `summary/K-metal/lonely-day-QmeuoFT1hEJntEUswkFFoJ8UisTFHhjNiW236bsUeiAG7X.txt`
- `xml/K-metal/enter-sandman-QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo.musicxml` / `summary/K-metal/enter-sandman-QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo.txt`
- `xml/K-metal/fear-of-the-dark-QmXFHNzdRue8ptGgsQgBvoFiseKUSmik3FNZpV5w15fAtv.musicxml` / `summary/K-metal/fear-of-the-dark-QmXFHNzdRue8ptGgsQgBvoFiseKUSmik3FNZpV5w15fAtv.txt`
- `xml/K-metal/hallowed-be-thy-name-QmVEitoYcGGs3WPRCkTdygEEtgdytbP7iSDuAwkAipg9wi.musicxml` / `summary/K-metal/hallowed-be-thy-name-QmVEitoYcGGs3WPRCkTdygEEtgdytbP7iSDuAwkAipg9wi.txt`
- `xml/K-metal/dream-theater-pull-me-under-QmXD2aZpJZY27ZJjxsS69dysWp9FtvouuQymLi1ibBDTY9.musicxml` / `summary/K-metal/dream-theater-pull-me-under-QmXD2aZpJZY27ZJjxsS69dysWp9FtvouuQymLi1ibBDTY9.txt`
- `xml/K-metal/metallica-one-Qmc2BawopkxrFy6ekhYKAB8qzukZn4pxFpcefQfQ7X8tP6.musicxml` / `summary/K-metal/metallica-one-Qmc2BawopkxrFy6ekhYKAB8qzukZn4pxFpcefQfQ7X8tP6.txt`
- `xml/K-metal/master-of-puppets-metallica-QmZZoMtA54kgni7gFcrBDdSsm1TGMuE1FzomzFbuGfP7Lq.musicxml` / `summary/K-metal/master-of-puppets-metallica-QmZZoMtA54kgni7gFcrBDdSsm1TGMuE1FzomzFbuGfP7Lq.txt`
- `xml/K-metal/a-little-piece-of-heaven-avenged-sevenfo-QmbwnWBK5FE51CVpqjZ4fSQW87SX1MNzehooGRbNPDrkfm.musicxml` / `summary/K-metal/a-little-piece-of-heaven-avenged-sevenfo-QmbwnWBK5FE51CVpqjZ4fSQW87SX1MNzehooGRbNPDrkfm.txt`
- `xml/L-artists/avenged-sevenfold-almost-easy-QmSc3G9zSwyGhYXksJCyGQLJBpGfKYC248hC2nTdrySSD6.musicxml` / `summary/L-artists/avenged-sevenfold-almost-easy-QmSc3G9zSwyGhYXksJCyGQLJBpGfKYC248hC2nTdrySSD6.txt`
- `xml/L-artists/for-whom-the-bell-tolls-Qmecq9RSLpMfuaEajmskZq9ueZGk97qvmdx78JFWNSuiRD.musicxml` / `summary/L-artists/for-whom-the-bell-tolls-Qmecq9RSLpMfuaEajmskZq9ueZGk97qvmdx78JFWNSuiRD.txt`
- `xml/L-artists/trough-the-never-metallica-QmYKpXdLhNEmuSxT9zkkmMNDuVSGRyT2bie6J9fhmiPcdn.musicxml` / `summary/L-artists/trough-the-never-metallica-QmYKpXdLhNEmuSxT9zkkmMNDuVSGRyT2bie6J9fhmiPcdn.txt`
- `xml/L-artists/space-dementia-QmZ3vfJw1vS5Me9KDoUYSm7RYU4FYSAwioiFHbtogRihgd.musicxml` / `summary/L-artists/space-dementia-QmZ3vfJw1vS5Me9KDoUYSm7RYU4FYSAwioiFHbtogRihgd.txt`
- `xml/L-artists/screenager-QmPJdhKPHYYoLPspsFtYoFX8nzZUkyAuw85Rm7bhmptBub.musicxml` / `summary/L-artists/screenager-QmPJdhKPHYYoLPspsFtYoFX8nzZUkyAuw85Rm7bhmptBub.txt`
- `xml/L-artists/hoodoo-live-piano-QmQGS6WCqjnbvLW5G3HrsBhLhYxyeziMnw2YM1NXx6STUw.musicxml` / `summary/L-artists/hoodoo-live-piano-QmQGS6WCqjnbvLW5G3HrsBhLhYxyeziMnw2YM1NXx6STUw.txt`
- `xml/L-artists/ruled-by-secrecy-QmeprydoERiDt7yuEAeGaffavEp97wAPER2AMJwsKXBr5s.musicxml` / `summary/L-artists/ruled-by-secrecy-QmeprydoERiDt7yuEAeGaffavEp97wAPER2AMJwsKXBr5s.txt`
- `xml/L-artists/muse-of-poetry-erato-fischer-johann-kasp-QmPzbknqkv7S6dp3fcZVw3JLztdMA8tFw8qttHdtQd5vCg.musicxml` / `summary/L-artists/muse-of-poetry-erato-fischer-johann-kasp-QmPzbknqkv7S6dp3fcZVw3JLztdMA8tFw8qttHdtQd5vCg.txt`
- `xml/L-artists/isolated-system-QmNkxhgWU4SD1SgRWCjvWLdixkCV4YVgt2wP4F8wNACmri.musicxml` / `summary/L-artists/isolated-system-QmNkxhgWU4SD1SgRWCjvWLdixkCV4YVgt2wP4F8wNACmri.txt`
- `xml/L-artists/apocalypse-please-QmfVhjHh1mgJwF5jKSEZW822CqwhLUDy115Cjx6xRR2NFX.musicxml` / `summary/L-artists/apocalypse-please-QmfVhjHh1mgJwF5jKSEZW822CqwhLUDy115Cjx6xRR2NFX.txt`
- `xml/L-artists/exit-music-for-a-film-advanced-piano-sol-QmTe1Rkt8SBN7667PiUhD3FVaEGQDALGPY9Ur115aYGXyL.musicxml` / `summary/L-artists/exit-music-for-a-film-advanced-piano-sol-QmTe1Rkt8SBN7667PiUhD3FVaEGQDALGPY9Ur115aYGXyL.txt`
- `xml/L-artists/daydreaming-radiohead-QmQ2jgSxs7WtLpWYNhkUsRTkgvXA2q4BPSW48XsnY83N3Q.musicxml` / `summary/L-artists/daydreaming-radiohead-QmQ2jgSxs7WtLpWYNhkUsRTkgvXA2q4BPSW48XsnY83N3Q.txt`
- `xml/L-artists/creep-de-radiohead-QmPmjHdv6GhcNe7h31sNVm1vHKQC8DfteNMyn1jBhpJEch.musicxml` / `summary/L-artists/creep-de-radiohead-QmPmjHdv6GhcNe7h31sNVm1vHKQC8DfteNMyn1jBhpJEch.txt`
- `xml/L-artists/radiohead-creep-but-its-ridiculous-QmVEn9MV1dW18vwLmHgnqZ6K7gt9kHTZyeSt8u1XiEDr37.musicxml` / `summary/L-artists/radiohead-creep-but-its-ridiculous-QmVEn9MV1dW18vwLmHgnqZ6K7gt9kHTZyeSt8u1XiEDr37.txt`
- `xml/L-artists/twisted-measure-creep-acapella-QmdS66pdGrFFbsEN9vvBQcDvaEyJx8vABqtuMCRi77aSpm.musicxml` / `summary/L-artists/twisted-measure-creep-acapella-QmdS66pdGrFFbsEN9vvBQcDvaEyJx8vABqtuMCRi77aSpm.txt`
- `xml/L-artists/cluster-one-QmRABab4S21y1kSwm5pRfJynAZbSmwWpHs6hzZCbjT7Whp.musicxml` / `summary/L-artists/cluster-one-QmRABab4S21y1kSwm5pRfJynAZbSmwWpHs6hzZCbjT7Whp.txt`
- `xml/L-artists/anisina-QmcNFWCZBCoWFj7gpfjv7qJBJYX58j3SBrh9ruMBreDsg4.musicxml` / `summary/L-artists/anisina-QmcNFWCZBCoWFj7gpfjv7qJBJYX58j3SBrh9ruMBreDsg4.txt`
- `xml/L-artists/autumn-68-QmPXA4DmNdZ9i57iNvMXuggjaPjfuAU5L3NQTS3FpyTbsb.musicxml` / `summary/L-artists/autumn-68-QmPXA4DmNdZ9i57iNvMXuggjaPjfuAU5L3NQTS3FpyTbsb.txt`
- `xml/L-artists/things-left-unsaid-QmQnnagVBhXDRu8vs6JEc59iP52cs1BGCdrWEnaRZie71Q.musicxml` / `summary/L-artists/things-left-unsaid-QmQnnagVBhXDRu8vs6JEc59iP52cs1BGCdrWEnaRZie71Q.txt`
- `xml/L-artists/aloha-oe-QmZ2XRr489YtJVYSs5HUV8G89nKjqXbMUUh6o9eZhc5n51.musicxml` / `summary/L-artists/aloha-oe-QmZ2XRr489YtJVYSs5HUV8G89nKjqXbMUUh6o9eZhc5n51.txt`
- `xml/L-artists/aloha-oe-hawaian-QmZ5j9oh23pBPqTMvwYkpS8PzHkxARizYeBddQ8NTMA1CA.musicxml` / `summary/L-artists/aloha-oe-hawaian-QmZ5j9oh23pBPqTMvwYkpS8PzHkxARizYeBddQ8NTMA1CA.txt`
- `xml/L-artists/ode-to-a-pumpkin-i-grew-QmdyRM78Vwe2k96mHJjhaLoYwcsVPgdqNg6WjEQBFYG77A.musicxml` / `summary/L-artists/ode-to-a-pumpkin-i-grew-QmdyRM78Vwe2k96mHJjhaLoYwcsVPgdqNg6WjEQBFYG77A.txt`
- `xml/L-artists/hes-coming-soon-queen-liliuokalani-QmP5sBPMPWDzBMixZdbPM9edRAoEqK6UC9dKCRNAHTPW5f.musicxml` / `summary/L-artists/hes-coming-soon-queen-liliuokalani-QmP5sBPMPWDzBMixZdbPM9edRAoEqK6UC9dKCRNAHTPW5f.txt`
- `xml/L-artists/go-and-tell-queen-liliuokalani-QmQYDH4PL6BQtmnAmpBxK6fJ9Z5PRGj1BTQD9aFYJhQtkd.musicxml` / `summary/L-artists/go-and-tell-queen-liliuokalani-QmQYDH4PL6BQtmnAmpBxK6fJ9Z5PRGj1BTQD9aFYJhQtkd.txt`
- `xml/L-artists/breathe-no-more-evanescence-QmWKA8j5XNeR2negDESQyEkDc6M7hpu6ADou6GRHKRKRfb.musicxml` / `summary/L-artists/breathe-no-more-evanescence-QmWKA8j5XNeR2negDESQyEkDc6M7hpu6ADou6GRHKRKRfb.txt`
- `xml/L-artists/my-immortal-in-f-voice-piano-QmVWSZ3vAy8prRv14TRREdLLnXk14UqrYrc1HgeisMAqqe.musicxml` / `summary/L-artists/my-immortal-in-f-voice-piano-QmVWSZ3vAy8prRv14TRREdLLnXk14UqrYrc1HgeisMAqqe.txt`
- `xml/L-artists/lacrymosa-sab-full-band-QmTTjukRKRWvhqR5CoNiFXm1uZrcSCVrGoRua4NF5dSUYv.musicxml` / `summary/L-artists/lacrymosa-sab-full-band-QmTTjukRKRWvhqR5CoNiFXm1uZrcSCVrGoRua4NF5dSUYv.txt`
- `xml/L-artists/everybodys-fool-evanescence-QmQaRBBTZpAsfaLHQVb28qJZb1QhWDrY6g3oF2taJpcZUQ.musicxml` / `summary/L-artists/everybodys-fool-evanescence-QmQaRBBTZpAsfaLHQVb28qJZb1QhWDrY6g3oF2taJpcZUQ.txt`
- `xml/L-artists/hypnotize-QmUF29MkGVEtuy9EUPXYZKC7S123bircT6W2zJkhhW8e9C.musicxml` / `summary/L-artists/hypnotize-QmUF29MkGVEtuy9EUPXYZKC7S123bircT6W2zJkhhW8e9C.txt`
- `xml/L-artists/dream-theater-disappear-QmbHZSWPLhqk5eU4ErBJNFmYdyFjHggpdCAd2ymqzSitFH.musicxml` / `summary/L-artists/dream-theater-disappear-QmbHZSWPLhqk5eU4ErBJNFmYdyFjHggpdCAd2ymqzSitFH.txt`
- `xml/L-artists/wait-for-sleep-QmX6C6SSN9pgaG7S9i39dU2aNoG12updXDxWjFfA3u3h8x.musicxml` / `summary/L-artists/wait-for-sleep-QmX6C6SSN9pgaG7S9i39dU2aNoG12updXDxWjFfA3u3h8x.txt`
- `xml/L-artists/virus-QmZLmx4e4iS7fXab9qDW1XQkTGhkHDryn36t7g8pYfhZVv.musicxml` / `summary/L-artists/virus-QmZLmx4e4iS7fXab9qDW1XQkTGhkHDryn36t7g8pYfhZVv.txt`
- `xml/L-artists/black-sabbath-fluff-QmVXyyBv6Jh46KmF1pY1jGGTuB8XrYDHRT7cuQ48xsPcbe.musicxml` / `summary/L-artists/black-sabbath-fluff-QmVXyyBv6Jh46KmF1pY1jGGTuB8XrYDHRT7cuQ48xsPcbe.txt`
- `xml/L-artists/final-masquerade-QmU6qdsWTZAN5p3wzQNA3HBS6UVSAayhQbrbnwj8LPQ6Vr.musicxml` / `summary/L-artists/final-masquerade-QmU6qdsWTZAN5p3wzQNA3HBS6UVSAayhQbrbnwj8LPQ6Vr.txt`
- `xml/L-artists/linkin-park-final-masquerade-QmaYoHQDWpE1ti5hDEGBxS1UKfn7SCJCpQtgQ6MLqtr7Nd.musicxml` / `summary/L-artists/linkin-park-final-masquerade-QmaYoHQDWpE1ti5hDEGBxS1UKfn7SCJCpQtgQ6MLqtr7Nd.txt`
- `xml/L-artists/leave-out-all-the-rest-linkin-park-QmTAZ6A8z4vBFgQwpN5STorC5osK59XKQV6o1WWJ9vaGc5.musicxml` / `summary/L-artists/leave-out-all-the-rest-linkin-park-QmTAZ6A8z4vBFgQwpN5STorC5osK59XKQV6o1WWJ9vaGc5.txt`
- `xml/L-artists/my-december-QmWYEvKnbTqk4yqWj1pp41PHfTuQU9BaFvLjEqUHxa6bmK.musicxml` / `summary/L-artists/my-december-QmWYEvKnbTqk4yqWj1pp41PHfTuQU9BaFvLjEqUHxa6bmK.txt`
- `xml/L-artists/linkin-park-crawling-piano-score-QmW1fMWmYyYEVrWZMztR41GGEQ6MFvfdpNxvqp2HgDJajh.musicxml` / `summary/L-artists/linkin-park-crawling-piano-score-QmW1fMWmYyYEVrWZMztR41GGEQ6MFvfdpNxvqp2HgDJajh.txt`
- `xml/L-artists/aloha-line-2020-QmYXmyZyGp2FUzjDvVF1zRT4eVcA2XrvSUq543cQW4wY3C.musicxml` / `summary/L-artists/aloha-line-2020-QmYXmyZyGp2FUzjDvVF1zRT4eVcA2XrvSUq543cQW4wY3C.txt`
- `xml/L-artists/everlong-QmcAA9JrE3AbvgGiBgWy6ACTNFDPzESomoCyQe9cDpbEme.musicxml` / `summary/L-artists/everlong-QmcAA9JrE3AbvgGiBgWy6ACTNFDPzESomoCyQe9cDpbEme.txt`
- `xml/L-artists/the-pretender-QmWUQJBDFEQ9xHjGPWqEn6goguxFEbtu72QvM4FKnQEVWF.musicxml` / `summary/L-artists/the-pretender-QmWUQJBDFEQ9xHjGPWqEn6goguxFEbtu72QvM4FKnQEVWF.txt`
- `xml/L-artists/speed-of-sound-QmYG2q5NcJCVydHQ66n3b3WULnW5X5NbvprNDtb2wnqq2C.musicxml` / `summary/L-artists/speed-of-sound-QmYG2q5NcJCVydHQ66n3b3WULnW5X5NbvprNDtb2wnqq2C.txt`
- `xml/L-artists/trouble-coldplay-QmTXa9BRcsEwYH6nUY9pyWp4TiZeDrKsuPmActkce1rkh7.musicxml` / `summary/L-artists/trouble-coldplay-QmTXa9BRcsEwYH6nUY9pyWp4TiZeDrKsuPmActkce1rkh7.txt`
- `xml/L-artists/fix-you-coldplay-QmQsRid5CzsBneXBtLrsE46BDGFn2BseetPyCUQUMdVcxg.musicxml` / `summary/L-artists/fix-you-coldplay-QmQsRid5CzsBneXBtLrsE46BDGFn2BseetPyCUQUMdVcxg.txt`
- `xml/L-artists/fix-you-by-coldplay-QmaX4Pkqc1tDyVk7yy8Fkhq4nSjViaBfyLwA3rKuNKChiQ.musicxml` / `summary/L-artists/fix-you-by-coldplay-QmaX4Pkqc1tDyVk7yy8Fkhq4nSjViaBfyLwA3rKuNKChiQ.txt`
- `xml/L-artists/fix-you-QmWHuH93tfZDfidx55ac1ZnxDY9tR2sTEHbSPMAP2kpPjD.musicxml` / `summary/L-artists/fix-you-QmWHuH93tfZDfidx55ac1ZnxDY9tR2sTEHbSPMAP2kpPjD.txt`
- `xml/L-artists/and-so-it-goes-QmWTnL3HmQ5JJuyzmYK7SdJuvZ2Xc1PZ3AWHijaQ4dhxUM.musicxml` / `summary/L-artists/and-so-it-goes-QmWTnL3HmQ5JJuyzmYK7SdJuvZ2Xc1PZ3AWHijaQ4dhxUM.txt`
- `xml/L-artists/and-so-is-goes-QmZTntpWyVxPocpcy7XDb3R5Ck4NxSUF8PdSWWLuEH1SPb.musicxml` / `summary/L-artists/and-so-is-goes-QmZTntpWyVxPocpcy7XDb3R5Ck4NxSUF8PdSWWLuEH1SPb.txt`
- `xml/L-artists/uptown-girl-QmYp2Waj5h4khKz5Tr7D9AHwgMBbaumTxfpDkiVjBE6xKH.musicxml` / `summary/L-artists/uptown-girl-QmYp2Waj5h4khKz5Tr7D9AHwgMBbaumTxfpDkiVjBE6xKH.txt`
- `xml/L-artists/daniel-elton-john-bernie-taupin-piano-co-QmSj1cyUhcFmnhKdibiMpNqoEZkFdM47NxnqbmgVsbup62.musicxml` / `summary/L-artists/daniel-elton-john-bernie-taupin-piano-co-QmSj1cyUhcFmnhKdibiMpNqoEZkFdM47NxnqbmgVsbup62.txt`
- `xml/L-artists/the-king-QmTLkSX6MxkF9n4dF3FMH7cvfjR4vSLkvbjQRkL3EpWVzP.musicxml` / `summary/L-artists/the-king-QmTLkSX6MxkF9n4dF3FMH7cvfjR4vSLkvbjQRkL3EpWVzP.txt`
- `xml/L-artists/the-circle-of-life-QmWHYEAX4AmV1nJiSsabYUip5QYg6WcnRFB1b912dU2yEp.musicxml` / `summary/L-artists/the-circle-of-life-QmWHYEAX4AmV1nJiSsabYUip5QYg6WcnRFB1b912dU2yEp.txt`
- `xml/L-artists/easy-piano-elton-john-can-you-feel-the-l-QmTwsXtFetmmCqQeGQgxQZjdjHn14n6L57B4C6dCEgEq7D.musicxml` / `summary/L-artists/easy-piano-elton-john-can-you-feel-the-l-QmTwsXtFetmmCqQeGQgxQZjdjHn14n6L57B4C6dCEgEq7D.txt`
- `xml/L-artists/can-you-feel-the-love-tonight-QmVa3v1f1ZmoqjiAveiLbTUv5NZAS4D3ibaMudNwcL5oWT.musicxml` / `summary/L-artists/can-you-feel-the-love-tonight-QmVa3v1f1ZmoqjiAveiLbTUv5NZAS4D3ibaMudNwcL5oWT.txt`
- `xml/L-artists/she-is-not-a-girl-who-misses-much-openin-QmeEtYGFYUSj7MtF3AqZ2q5BBcFBNKHYb4DxZSbSensoXJ.musicxml` / `summary/L-artists/she-is-not-a-girl-who-misses-much-openin-QmeEtYGFYUSj7MtF3AqZ2q5BBcFBNKHYb4DxZSbSensoXJ.txt`
- `xml/L-artists/happy-xmas-war-is-over-QmQ1qVi1RHonfqDZydkmHSwTDQ7vzE8rQdojdK2BXTPPw1.musicxml` / `summary/L-artists/happy-xmas-war-is-over-QmQ1qVi1RHonfqDZydkmHSwTDQ7vzE8rQdojdK2BXTPPw1.txt`
- `xml/L-artists/happy-xmas-Qmda2ATyMAktQ12TZz4oBYvPBYHkvZxrbdirqA1t4RWKWH.musicxml` / `summary/L-artists/happy-xmas-Qmda2ATyMAktQ12TZz4oBYvPBYHkvZxrbdirqA1t4RWKWH.txt`
- `xml/L-artists/happy-xmas-war-is-over-QmeN4WJALWvPGMgvGjvEDtYWhtYH9R9R5LqFZaa1tCwJUY.musicxml` / `summary/L-artists/happy-xmas-war-is-over-QmeN4WJALWvPGMgvGjvEDtYWhtYH9R9R5LqFZaa1tCwJUY.txt`
- `xml/L-artists/imagine-QmXAocpmyAT6PCMWzLDkz2c7j8UeafVmZsCg4eLgNKwEN7.musicxml` / `summary/L-artists/imagine-QmXAocpmyAT6PCMWzLDkz2c7j8UeafVmZsCg4eLgNKwEN7.txt`
- `xml/L-artists/imagine-john-lenon-instrumental-QmaQ2NvEAyzY16spcMFJiEfQoC6MnwVdTDP3S7rpmuRprs.musicxml` / `summary/L-artists/imagine-john-lenon-instrumental-QmaQ2NvEAyzY16spcMFJiEfQoC6MnwVdTDP3S7rpmuRprs.txt`
- `xml/L-artists/imagine-by-john-lennon-QmbyERz5Byppdbvk2FkePioKy3Dc5Kv6sFakrv5gui8aHE.musicxml` / `summary/L-artists/imagine-by-john-lennon-QmbyERz5Byppdbvk2FkePioKy3Dc5Kv6sFakrv5gui8aHE.txt`
