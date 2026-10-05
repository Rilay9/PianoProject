# PDMX quarry, second pass (2026-10-05)

Mechanical search and dump. No musical or pedagogical judgement; every figure comes from `PDMX.csv` or from the MusicXML itself. Built by `tools/content/pdmx/quarry_lanes.py` from `lanes.json`.

## Matching rules

- Text is normalised (NFKD, accents stripped, lowercase, every non-alphanumeric run becomes one space). A term matches only as a contiguous whole-token sequence: `muse` does not match `museum`, `numb` does not match `number`.
- Term fields: `song_name`, `title`, `subtitle`, `artist_name`, `composer_name`. Genres and tags are never searched.
- Terms listed in a lane's `exact_title_only_for` (and `extra_exact_titles`) match only when `song_name` or `title` equals the term after brackets are stripped and an `Artist - ` or ` - Artist` segment is removed.
- Exact match for ranking: the same equality test, applied to any term.
- Artists (lane L): an alias is a whole-token sequence in `artist_name` or `composer_name`, or equals one ` - ` separated segment of the title or song_name. Distinct songs are grouped by normalised song title with the artist segment removed.
- Shape comes from the XML (not the CSV): `PIANO2` all parts piano-family (MIDI program 0-7; CSV programs when the file gives none) with 2 or more staves in total; `LEADSHEET` one staff in total and 8 or more `<harmony>` elements; `PIANO1` all piano, one staff, fewer than 8 chord symbols; `MIXED_PIANO2` a piano part with 2 or more staves plus a non-piano part; `OTHER` anything else.
- Rank: exact title/term match, then inspected-XML, then shape (PIANO2 = LEADSHEET > MIXED_PIANO2 > PIANO1 > OTHER), then chord symbols present, then 16-120 bars, then Bayesian rating (m=10, archive mean 4.69), then views. `max_bars` and `piano_only` are hard filters where a lane sets them (`piano_only` uses the CSV programs; `max_bars` uses the XML bar count when inspected).
- XML inspected only for: every known CID, the top 15 rows per term by CSV pre-rank (exact match, piano-only programs, n_ratings, views) and the top 40 rows per artist. Hits outside that set are listed as `NOT_INSPECTED` and rank below inspected ones.
- Composition label: composers.py + composers.json; `pd` / `in-copyright` / `unknown`. A label only; nothing is filtered on it.
- Dump: every usable known CID (shape not OTHER) plus the lane's top distinct songs; an extra edition of a song is kept only when its shape class differs. XML over 3 MB is skipped and recorded. `xml/<lane>/<slug>-<CID>.musicxml`, `summary/<lane>/<slug>-<CID>.txt`.
- Total dumped XML plus summaries: 71.8 MB. `quarry-results.json` lists every hit per lane (lane L: top songs per artist plus counts).


## Lane A-blues

Goal: one clean real twelve-bar chorus (blues.8/9); one 2-4 bar historical lick; one minor/slow-blues transfer piece

### Known CIDs, identity check

| Indexed as | CID | Verdict | CSV title / song_name | CSV composer / artist | Programs | Shape | Bars | Chord symbols |
|---|---|---|---|---|---|---|---|---|
| Joe Turner Blues | QmXbcEgNyEXXfV5SKFQ4rK5eJi3xTtPJQm9kMVgM7GTWVK | MATCH | Joe Turner Blues / Joe Turner Blues |  / Misc tunes | 0 | PIANO1 | 26 | 0 |
| Jelly Roll Blues | QmbuoFtkky8Xpo8LSiAqkMXzBs2Mtc33L6GFw1kWv9T5S3 | MATCH | The Jelly Roll Blues - Jelly Roll Morton - 1915 / Original Jelly Roll Blues | FERD. MORTON. / Jelly Roll Morton | 0 | PIANO2 | 61 | 0 |
| Farewell Blues | QmStEZqKASQVCFNhKaHLcQm3R3RbDUPKA477NQ6kWsNToy | MATCH | Farewell Blues / Farewell Blues |  / Misc tunes | 0 | PIANO1 | 33 | 0 |
| New Orleans Blues | QmbQRktDiVKVCdRwZc7XKQ7gjJxdFRzHwD68nv7AQhtRtM | MATCH | New Orleans Blues - Jelly Roll Morton - 1925 / New Orleans Blues | Jelly Roll Morton / Jelly Roll Morton | 0 | PIANO2 | 56 | 0 |
| King Porter Stomp | QmcHsP43Xw6S7NyHPUvczq8xKBWFNWU7RRLzECpSGZ4P65 | **MISMATCH** | Workaday World /  | Arr. King Porter Stomp /  | 9-32-48-48-56-57-60-71 | OTHER | 48 | 0 |
| Shout for Joy | QmadiFaW4tDntpiEiazA5Ec2hyvTNCAdQ1K2Ru4XhDF3Qw | MATCH | Shout for joy ye holy throng - A. M. Wortman / Shout for joy ye holy throng | A. M. Wortman / A. M. Wortman | 0-0 | PIANO2 | 20 | 0 |

Hits: 21 rows pass the lane filters (21 before filters).

### Dumped scores

| CID | Title | Artist / composer | Shape | Meters | Bars | Chord symbols | Rating (n) | Views | Label | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| QmRMcZyoTUeHHZiSkZbUymkaxU45UTAaWTLpaK4bRetiRz | Boogie Woogie | Misc Traditional / Clarence Pinetop Smith (1904-1929) | PIANO2 | 4/4 | 97 | 0 | 4.63 (8) | 6813 | unknown | rank 1 top distinct song #1 |
| Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi | Blues Riff in C (120 bpm) | Lessons - Blues / Daniels Elizabeth Calvin | PIANO2 | 4/4 | 12 | 0 | 4.87 (5) | 1225 | unknown | rank 2 top distinct song #2 |
| Qmc7nrZ28Se5SVgSoRrGFmwTU5Gij48F344eGPRhTu6kwv | Sweet Home Chicago | Robert Johnson / Robert Johnson | MIXED_PIANO2 | 4/4 | 81 | 0 | 4.68 (19) | 1091 | unknown | rank 4 top distinct song #3 |
| QmduvvF9WYbSxgdNZLWZHwiPmD6Bk4bDg9kvssqRP3pu6h | 12 Bar Blues | Lessons - Blues /  | PIANO1 | 4/4 | 11 | 0 | 4.50 (19) | 4200 | unknown | rank 5 extra shape |
| QmXgWdLZyrDFZSLcK23xY8uhh2fN8y2AjuYYdyfUfAzJ2f | Blues in F for bass lesson |  /  | LEADSHEET | 4/4 | 36 | 39 | 0.00 (0) | 83 | unknown | rank 9 top distinct song #4 |
| QmU7rsQ1UcCDqoY36Xk9qBQk8f6JcZgDFoAx9w96rSNYx3 | Pinetop's Boogie Woogie in F - edited by Tiny Parham | Clarence Pine Top Smith / CLARENCE PINE TOP SMITH | PIANO2 | 2/2 | 96 | 0 | 4.85 (44) | 12617 | unknown | rank 10 top distinct song #5 |
| QmbJaTpRSBaVyquinmmn9W4yHVX4XxZqhNJJz1quQkzjPT | Jeeves' Boogie Woogie | Misc Television / Anne Dudley | PIANO2 | 4/4 | 52 | 0 | 4.82 (36) | 1797 | unknown | rank 11 top distinct song #6 |

### Next 10 ranked, undumped

| Rank | CID | Title | Artist / composer | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | QmbizGFyvL8ocPFV1J6mD8uCMZF7JtYZa6bVcik8xa7SaS | Simple 12 Bar Blues Duet in E | Lessons - Blues / Stephan Peters | PIANO2 | 4/4 | 15 | 0 | 0.00 (0) | 1140 | unknown | 12 bar blues |
| 6 | QmUAWUDZeKZafF9BADu1aFfmrg1kxRAdKtpCdWMZbAacPr | Boogie Woogie | Misc Traditional /  | OTHER | 4/4 | 13 | 7 | 4.54 (8) | 2053 | pd | boogie woogie |
| 7 | Qmdc4bb8NsNFoxCU2aFYRL9Ui8WtJDmjkKrtmMdMMxtTDA | SWEET HOME CHICAGO - SOLO Trombone (Lacsap13) | Robert Johnson / Lacsap13 | OTHER | 4/4 | 24 | 0 | 4.76 (14) | 1262 | unknown | sweet home chicago |
| 8 | QmcJ7d8nt1J5s6zyFLbPT6pF4zfU7UeHWLsRuU1oGtMdUi | 12 Bar Blues in C (Major Triads) | Chuck Berry / Pablo Viva | OTHER | 12/8 | 12 | 0 | 0.00 (0) | 1255 | unknown | 12 bar blues, blues in c |
| 12 | QmXdsnjidKxwCdsMh3eML6n8nj9UCaAvL6gg31MaRdez5F | Boogie Woogie Bugle Boy | The Andrews Sisters / Arranged by Gavin Small | PIANO2 | 2/2 | 41 | 0 | 4.65 (66) | 18201 | unknown | boogie woogie |
| 13 | QmQhudKTMtqwo5Aovhv7yFdWWYdrhUvs37DZdogKFF3T19 | The Fives Boogie Woogie piano solo | Thomas George and Thomas Hersal / By GEORGE THOMAS and HERSAL THOMAS | PIANO2 | 2/2 | 72 | 0 | 4.64 (85) | 12177 | unknown | boogie woogie |
| 14 | Qma5BTZjeKWfRnG8k1cwGrM9QPzimoGmunm9oxRdd7sEHr | Simple 12 Bar Blues Duet in C |  / Stephan Peters | PIANO2 | 4/4 | 15 | 0 | 0.00 (0) | 862 | unknown | 12 bar blues |
| 15 | QmVQhVB6nRymykU2z36BbeW2PiJv72hASVkPoTVRKYmyim | Sitz Boogie Woogie |  / Hans Poser (1917-1970) | MIXED_PIANO2 | 4/4 | 16 | 20 | 0.00 (0) | 184 | unknown | boogie woogie |
| 16 | QmV9A2WeSzF3pjFFZTPaqP27WSanQah1oE2vAtp5J5b7tT | The Fives - composers' draught of an early boogie woogie piece | Thomas George and Thomas Hersal / MUSIC BY Hersal Thomas and Geo. W. Thomas | MIXED_PIANO2 | 2/2 | 53 | 0 | 4.90 (8) | 3040 | unknown | boogie woogie |
| 17 | QmUHc4f7BmJtT3FKtcRRTBVZbSifB2hBiy92NZybQ9vNqz | Ookami blues in C | andreshk2001 / A.H | MIXED_PIANO2 | 6/8 | 76 | 0 | 0.00 (0) | 227 | unknown | blues in c |

### Terms with zero matches

twelve bar blues, slow blues, minor blues, blues in g, turnaround blues, stormy monday, key to the highway, every day i have the blues

Hits per term: 12 bar blues=6; twelve bar blues=0; slow blues=0; minor blues=0; blues in c=2; blues in f=1; blues in g=0; turnaround blues=0; boogie woogie=11; sweet home chicago=2; stormy monday=0; key to the highway=0; every day i have the blues=0


## Lane B-jazz

Goal: one standard supporting the full jazz.9 cycle (melody, form, comp, two-feel/walk, solo, intro/ending, solo-piano pass), with chord symbols and a manageable form; flag candidates with an obvious minor ii-V-i

### Known CIDs, identity check

| Indexed as | CID | Verdict | CSV title / song_name | CSV composer / artist | Programs | Shape | Bars | Chord symbols |
|---|---|---|---|---|---|---|---|---|
| After You've Gone | QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU | MATCH | After Youve Gone / after youve gone | CREAMER & LAYTON / Marion Harris | 0 | LEADSHEET | 20 | 30 |
| Sweet Georgia Brown | QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5 | MATCH | Beginner version - Sweet Georgia Brown / sweet georgia brown | Beginner version / Ben Bernie | 0 | PIANO1 | 33 | 0 |
| Indiana | Qmcy1D9Q8SPEBVa1nqy4TtjYeg8saf7mwC2CxnMpj16T9z | MATCH | Star of Indiana - Medea's Dance of Vengeance Hornline Transcription (1993) / Misc Tunes |  / Misc tunes | 56-56-56-57-57-57-58-60-60 | OTHER | 188 | 0 |
| Honeysuckle Rose | QmSMULfFJDNDH2UyUeNLWgm33MQ9gy2zAfjAXoEALHg7Ds | MATCH | Honeysuckle Rose / honeysuckle rose | Fats Waller / Fats Waller | 56-56-56-56-56-56 | OTHER | 144 | 0 |
| Squeeze Me | QmTw3EQxygcbdDsDvKz6zRd2fjCGsvJGhG7C6aAYbCnyq8 | MATCH | Squeeze me Softly. MBe.25 / Squeeze me Softly. MBe.25 | in margin-'M.Betham Towsett' / Misc tunes | 0 | PIANO1 | 12 | 0 |
| Body and Soul | QmYLYgVPrVGkZeZgSjjBDYFUpTBWa8bXTB834ci6L7HQYN | MATCH | Body and Soul / body and soul | John Coltrane / Billie Holiday | 66 | OTHER | 24 | 0 |

Hits: 119 rows pass the lane filters (119 before filters).

### Dumped scores

| CID | Title | Artist / composer | Shape | Meters | Bars | Chord symbols | Rating (n) | Views | Label | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| QmeeqT5bwUfEqU9w8ZGXXLgp49DQra1tM23aD85ipXiXXv | Autumn Leaves Transcription | Joseph Kosma / Josh Kim | LEADSHEET | 4/4 | 96 | 87 | 4.91 (20) | 1853 | unknown | rank 1 top distinct song #1 |
| QmeRR6uYMPKEGwESKPLQqceqFVpkKVHitRFvMsH62kxdPG | Fly me to the moon | Bart Howard /  | LEADSHEET | 4/4 | 32 | 44 | 4.85 (4) | 25300 | unknown | rank 2 top distinct song #2 |
| QmYZtFAGnYAzWaUn8jrKHdNQnPBrER1HJQJpeSPXngfFuZ | Cinnamons - Summertime (Ukulele) | Johny Spero /  | LEADSHEET | 4/4 | 16 | 15 | 4.76 (14) | 769 | unknown | rank 3 top distinct song #3 |
| QmTbLFzrc3BRcoFTEMf5s7nu53AB1KS3YpL3YiP16r9EhJ | There will never be another you - Chet Baker Opening solo | Chet Baker /  | LEADSHEET | 4/4 | 45 | 44 | 4.72 (47) | 16390 | unknown | rank 4 top distinct song #4 |
| QmZhhR4pHBdVofHP6ETvwD5G8fmv4LVprxxbwshXM9ZV9K | All Of Me - John Legend - Accompaniment |  / John Legend | PIANO2 | 4/4 | 96 | 125 | 4.70 (7) | 739 | unknown | rank 5 top distinct song #5 |
| QmS2enG17nJVrbMvvCcHDW9wAN8nLSV1CPMmtghD7SZFVQ | Fly me to the moon | Bart Howard /  | PIANO2 | 4/4 | 22 | 10 | 0.00 (0) | 7505 | unknown | rank 6 extra shape |
| QmT2nQ3ssYraG2nRymmL4ySRed6yE2b3JeHUgxbXrAsYsi | Blue Bossa - Improvisation | chamrock / Composer | LEADSHEET | 4/4 | 47 | 33 | 0.00 (0) | 172 | unknown | rank 7 top distinct song #6 |
| Qmeaq2on2PCsqqEjxJt48tPGxyQJfCXCXMc1M9WfMEuCyz | Autumn Leaves Piano Solo - Hank Jones (Somethin' else) | Joseph Kosma /  | PIANO2 | 4/4 | 33 | 83 | 4.51 (40) | 24064 | unknown | rank 17 extra shape |
| QmXyjeq4uxYUhV6Ya1uQFmdKf2nUjbUEp2M5SPEjsy2gt8 | Blue Bossa for bass lesson 2019-11-27 | Dexter Gordon / Composer | MIXED_PIANO2 | 4/4 | 53 | 41 | 4.87 (5) | 194 | unknown | rank 37 extra shape |
| QmVbSHLuJ2CHRrfS3kHoWHsPGCqtcLTjNdBA5YCgFg7Bpw | All Of Me | Seymour Simons /  | MIXED_PIANO2 | 4/4 | 77 | 62 | 4.62 (5) | 1205 | unknown | rank 38 extra shape |
| QmbLMWEPv367xSv1Ep7nQFLnUGXpBeHR4RU94USYT3Pv6A | Fly me to The Moon | Bart Howard / Andrew X. Bo | MIXED_PIANO2 | 4/4 | 67 | 0 | 4.87 (5) | 3626 | unknown | rank 40 extra shape |
| QmYMpzeVPVzu94hB6kDwCfW7gAcWiNrRumnnd7PWQcRTZD | Autumn Leaves | Joseph Kosma /  | PIANO1 | 4/4 | 16 | 0 | 0.00 (0) | 15 | unknown | rank 53 extra shape |

### Next 10 ranked, undumped

| Rank | CID | Title | Artist / composer | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 8 | QmRHdjpHNsGRuJfqoVPkuK4TvFNSRC7aPFAALak5vcByPZ | K.B. C Jam Blues Solo w harmonies | Duke Ellington / Transcribed by Rob Orwin | PIANO2 | 4/4 | 97 | 110 | 0.00 (0) | 157 | unknown | c jam blues |
| 9 | QmXn3d8wgWtb4tZnjdbXWsg8voD1s3sXU8mQgsEy5s1rEn | Fly me to the moon | Jazz Standard /  | PIANO2 | 4/4 | 16 | 17 | 0.00 (0) | 153 | unknown | fly me to the moon |
| 10 | QmepwWuYByddAL9RswnKs6GH36oiJdydhgMAdvko1vjcTo | Fly Me To The Moon Guitar Vocals BrianH | Bart Howard / Composer | LEADSHEET | 4/4 | 36 | 43 | 0.00 (0) | 147 | unknown | fly me to the moon |
| 11 | QmYjsj12FbAhMvLKL2fRdok4XLzGrY7MFFPQLP1Gtj4w4i | Autumn Leaves | Joseph Kosma /  | LEADSHEET | 4/4 | 18 | 26 | 0.00 (0) | 30 | unknown | autumn leaves |
| 12 | QmR8ycCSt3M7NwcgPCqgZ6woPFg7YCbiyoGR79VFM3zh7v | Autumn Leaves | Joseph Kosma /  | LEADSHEET | 4/4 | 41 | 41 | 0.00 (0) | 8 | unknown | autumn leaves |
| 13 | QmcQaa3REeKw1cNAYThQhnfsZupEZtMVMNbtjhpLWJoKLA | There Will Never Be Another You Woody Shaw Solo Transcription | Woody Shaw /  | LEADSHEET | 4/4 | 66 | 65 | 4.69 (10) | 534 | unknown | there will never be another you |
| 14 | QmdbZ8vwUzVP62Ftpjzte19R6froqzqwLrgR9sY36xRxHd | Fly Me to the Moon - Lead Sheet | Bart Howard / Bart Howard | LEADSHEET | 4/4 | 38 | 44 | 4.61 (15) | 2308 | unknown | fly me to the moon |
| 15 | QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6 | Blue Bossa | Kenny Dorham / Kenny Dorham | LEADSHEET | 4/4 | 32 | 24 | 4.61 (137) | 18881 | unknown | blue bossa |
| 16 | QmW1LrCG2Z7BF7V4UxSt1fDX8MhTSBYmPht74JYMvT6mNm | Blue Bossa | Kenny Dorham /  | LEADSHEET | 4/4 | 17 | 11 | 4.53 (55) | 7916 | unknown | blue bossa |
| 18 | QmY7mQ3qBC5FhfJpQaqZQzTU4RFzkkDwGaahU5z9BNKrkQ | There Will Never Be Another You | Nat King Cole / Warren / Gordon | LEADSHEET | 4/4 | 33 | 39 | 4.41 (14) | 1490 | unknown | there will never be another you |

### Terms with zero matches

None.

Hits per term: autumn leaves=37; blue bossa=11; all of me=24; fly me to the moon=27; satin doll=2; there will never be another you=5; softly as in a morning sunrise=1; summertime=12; c jam blues=1


## Lane C-jam

Goal: one approachable real tune for comping (jam.5); one with harmony for building a walking bass (jam.6); ideally the same tune for both

### Known CIDs, identity check

| Indexed as | CID | Verdict | CSV title / song_name | CSV composer / artist | Programs | Shape | Bars | Chord symbols |
|---|---|---|---|---|---|---|---|---|
| St James Infirmary | Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs | MATCH | St James Infirmary / st james infirmary | Early 1900's / Misc Traditional | 0 | LEADSHEET | 24 | 41 |
| Sweet Georgia Brown | QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5 | MATCH | Beginner version - Sweet Georgia Brown / sweet georgia brown | Beginner version / Ben Bernie | 0 | PIANO1 | 33 | 0 |
| After You've Gone | QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU | MATCH | After Youve Gone / after youve gone | CREAMER & LAYTON / Marion Harris | 0 | LEADSHEET | 20 | 30 |
| Indiana | Qmcy1D9Q8SPEBVa1nqy4TtjYeg8saf7mwC2CxnMpj16T9z | MATCH | Star of Indiana - Medea's Dance of Vengeance Hornline Transcription (1993) / Misc Tunes |  / Misc tunes | 56-56-56-57-57-57-58-60-60 | OTHER | 188 | 0 |

Hits: 10 rows pass the lane filters (10 before filters).

### Dumped scores

| CID | Title | Artist / composer | Shape | Meters | Bars | Chord symbols | Rating (n) | Views | Label | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs | St James Infirmary | Misc Traditional / Early 1900's | LEADSHEET | 4/4 | 24 | 41 | 4.48 (20) | 1926 | unknown | known: St James Infirmary (MATCH) |
| QmPTYpb73P5ZJzXgwzg1sJAcAUxCosMCjnjRQxZk7d398y | Saint James Infirmary | Misc tunes /  | LEADSHEET | 4/4 | 9 | 9 | 0.00 (0) | 57 | unknown | rank 2 top distinct song #1 |
| QmexB7VLYouFHZ9nVFXSXjUb7L2c373Ve8apuLVs5GgMxc | Saint James Infirmary Blues | Misc Traditional / anon. | LEADSHEET | 4/4 | 9 | 12 | 0.00 (0) | 133 | pd | rank 7 top distinct song #2 |

### Next 10 ranked, undumped

| Rank | CID | Title | Artist / composer | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | QmdiAvFufLNtrhKpF5Zku9sKGyogYaVY51LBpq3NKjAvnQ | St. James Infirmary | Misc tunes /  | LEADSHEET | 4/4 | 9 | 9 | 0.00 (0) | 37 | unknown | st james infirmary |
| 4 | QmdidJSEF2SuazxAvfCQY5hQ8CYeq3YwJqegkiSuFwzTK1 | Saint James Infirmary | Misc tunes /  | LEADSHEET | 4/4 | 9 | 9 | 0.00 (0) | 30 | unknown | saint james infirmary |
| 5 | QmPrpKNjHggz6sJ6ZRJynufigLMEDQ4y9kLgjeCUAC2PGf | St. James Infirmary | Misc tunes /  | LEADSHEET | 4/4 | 9 | 9 | 0.00 (0) | 26 | unknown | st james infirmary |
| 6 | QmdtQmoNyrxTfzxtSnRVmu5FjD6k1yakXK1ajsJZn6QGJ8 | Saint James Infirmary | Misc tunes /  | LEADSHEET | 4/4 | 9 | 9 | 4.33 (3) | 100 | unknown | saint james infirmary |
| 8 | QmYfWu2qDzVXYsA41GiGuDfa8uHw8q7o1NVtwbFhhzesnW | Saint James Infirmary Blues | Misc Traditional / anon. | LEADSHEET | 4/4 | 9 | 12 | 0.00 (0) | 35 | pd | saint james infirmary |
| 9 | QmPtCnJbbAbfGs69fvmfwZgQTf9MuknNHUtBYQjMaPuGav | Saint James Infirmary Blues | Misc Traditional / anon. | LEADSHEET | 4/4 | 9 | 12 | 0.00 (0) | 24 | pd | saint james infirmary |
| 10 | Qma4qTbzHn5Hg79cpmeYzAu87uXyd3H3cusgu2kK9tCrQW | Saint James Infirmary Blues | Misc Traditional / Paroles et Musique: Clarence and Spencer Williams Arrangement Jean-Paul FINCK | OTHER | 4/4 | 23 | 0 | 0.00 (0) | 264 | unknown | saint james infirmary |

### Terms with zero matches

None.

Hits per term: st james infirmary=3; saint james infirmary=7


## Lane D-hymns

Goal: a correct Joyful, Joyful replacement; stronger four-part/arrangement models

### Known CIDs, identity check

| Indexed as | CID | Verdict | CSV title / song_name | CSV composer / artist | Programs | Shape | Bars | Chord symbols |
|---|---|---|---|---|---|---|---|---|
| Joyful, Joyful (archive lead) | QmY8XeRQK9L3q6Rndkex64R2N5X4LGiQ9CA6qG7U61YyE7 | MATCH | Ludwig Van Beethoven - Joyful Joyful We Adore Thee / Joyful joyful we adore Thee | Ludwig Van Beethoven / Ludwig van Beethoven | 0 | PIANO1 | 16 | 0 |
| Holy Holy Holy | QmbLfyErVgweCgsLYtW4CV2GvCwayZjJDqtLpccRmvCgdF | MATCH | Holy holy holy - William Henry Monk / Holy holy holy | Holy holy holy- W. H. Monk / William Henry Monk | 19-73-73-73-73 | OTHER | 25 | 0 |
| Nearer My God to Thee | QmbFPMXf26skEX8RvUSZ5dGSuFXefEwFJ7GXiCfgjS6q2o | MATCH | Nearer my God to thee - John Bacchus Dykes / Nearer my God to thee |  / John Bacchus Dykes | 73-73 | OTHER | 14 | 0 |
| Deep River | QmbP96wZt5Vev9pA8pembvkaMw2wx48M3PR3pWNMfJuASp | MATCH | Deep river - African-American spiritual. / Deep River | African-American Spiritual / Misc Traditional | 0-0 | PIANO2 | 20 | 0 |
| Steal Away | QmcrnJ2b9XrAey8CPrVRj5xn55Tvy4dfZe1aFr6FVTHBBs | MATCH | Steal away to jesus - African-American spiritual. / Steal away to jesus | African-American Spiritual / African-American Spiritual | 0-0 | PIANO2 | 16 | 0 |

Hits: 130 rows pass the lane filters (130 before filters).

### Dumped scores

| CID | Title | Artist / composer | Shape | Meters | Bars | Chord symbols | Rating (n) | Views | Label | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| QmXa4xixopTG1f7Q96UL1KU7skUQtk25XnNjXS61QbAZy5 | Ode to Joy |  / Composer | PIANO2 | 4/4 | 16 | 78 | 0.00 (0) | 45 | unknown | rank 1 top distinct song #1 |
| QmXWBURe48nbNXaFgz4Fhuv3p43nvqukyGufkYujjmFoCZ | Ode To Joy | Ludwig van Beethoven /  | LEADSHEET | 4/4 | 16 | 24 | 0.00 (0) | 13 | pd | rank 2 top distinct song #2 |
| QmQVNEqW4vw38TNZ1ogyn7JqgTCZWzPZTHvYg6sZDYmStN | Nearer my god to thee - Arthur S. Sullivan | Arthur S. Sullivan / Arthur Seymour Sullivan 1872 | PIANO2 | 4/4 | 16 | 0 | 0.00 (0) | 137 | unknown | rank 3 top distinct song #3 |
| QmTPmBvCqSrpJTdr87B77a5yprLJM1L6p2yUfmpoBSJW43 | Holy Holy Holy | John B. Dykes and Camp Kirkland / william | PIANO2 | 4/4 | 16 | 0 | 0.00 (0) | 43 | unknown | rank 6 top distinct song #4 |
| QmejAvfGAAdj9ZNpU76p7BCpSvxnzSdW2RwfhxbB2mQzZF | Ode to Joy | Ludwig van Beethoven / Beethoven/arr. by Kraynak | PIANO2 | 4/4 | 34 | 0 | 0.00 (0) | 11 | pd | rank 11 extra shape |
| QmddkzK9gSWChZ96o19vmW1QrcZNwDGFMrSWJ6odMCiwRR | Holy holy holy (Sweney) - B. Hillyard Sweney | B. Hillyard Sweney / B. Hillyard Sweney | PIANO2 | 4/4 | 16 | 0 | 0.00 (0) | 3 | unknown | rank 13 top distinct song #5 |
| QmbP96wZt5Vev9pA8pembvkaMw2wx48M3PR3pWNMfJuASp | Deep river - African-American spiritual. | Misc Traditional / African-American Spiritual | PIANO2 | 4/4 | 20 | 0 | 4.20 (12) | 460 | pd | known: Deep River (MATCH) |
| QmSsj7o5AWXjdDAgKkXpohjam3ZRYZhcteQXNBw6vsex7s | Ode to Joy (for orchestra) | Ludwig van Beethoven / Tommy Thomson | MIXED_PIANO2 | 4/4 | 52 | 0 | 4.72 (136) | 19086 | unknown | rank 23 extra shape |
| QmX5aJm5bL1oSuTADYETZoyMCA75h4PWeoa9R3kNMAZDsf | Ode To Joy | Ludwig van Beethoven /  | MIXED_PIANO2 | 4/4 | 92 | 0 | 0.00 (0) | 81 | pd | rank 24 extra shape |
| QmVUbXdavJDNpPBrmmtJDaWUU28Nu6UmMv5V265cbS6am6 | Nearer My God to Thee SV | Lowell Mason /  | PIANO1 | 4/4,7/8 | 111 | 0 | 0.00 (0) | 2092 | pd | rank 25 extra shape |
| Qmd743N6JTPToRbYipMFyadJVZbbzdLVVgT2cy6eYJU2V4 | Steal Away - Seconds CYMRU | Misc Traditional /  | PIANO1 | 6/8 | 9 | 0 | 0.00 (0) | 13 | pd | rank 34 top distinct song #6 |
| QmUFbAMfeBjxwNVwzfZxgYXR3cWv7424KN19uKNTqQad2K | Beethoven - Symphony No. 9 in D Minor Op. 125 4th Movement | Ludwig van Beethoven / Vincent | PIANO2 | 6/8 | 74 | 0 | 4.83 (3) | 401 | unknown | rank 72 extra shape |
| QmcrnJ2b9XrAey8CPrVRj5xn55Tvy4dfZe1aFr6FVTHBBs | Steal away to jesus - African-American spiritual. | African-American Spiritual / African-American Spiritual | PIANO2 | 4/4 | 16 | 0 | 4.61 (10) | 206 | pd | known: Steal Away (MATCH) |
| QmY8XeRQK9L3q6Rndkex64R2N5X4LGiQ9CA6qG7U61YyE7 | Ludwig Van Beethoven - Joyful Joyful We Adore Thee | Ludwig van Beethoven / Ludwig Van Beethoven | PIANO1 | 4/4 | 16 | 0 | 0.00 (0) | 13 | pd | known: Joyful, Joyful (archive lead) (MATCH) |

### Next 10 ranked, undumped

| Rank | CID | Title | Artist / composer | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 | QmRWs1XmcTTZ2JgkWaXqcUAWHdTPiLEPZFgwRJaAJQphtA | Nearer my god to thee - Lowell Mason | Lowell Mason / Lowell Mason 1856 | PIANO2 | 4/4 | 16 | 0 | 0.00 (0) | 57 | pd | nearer my god to thee |
| 5 | QmQoPSv4kUm2wgZE4jtrsCgPHu3u6GMG9mnEzxhqKxE46z | Nearer My God to Thee - Sarah Flower Adams | Sarah Flower Adams /  | PIANO2 | 4/4 | 16 | 0 | 0.00 (0) | 50 | unknown | nearer my god to thee |
| 7 | QmQJGEQWpnEB5GMHJTL4nVW7JVbhXnsJxZZWuJeVsLdUF9 | Nearer My God to Thee | Sarah Flower Adams /  | PIANO2 | 2/2 | 16 | 0 | 0.00 (0) | 21 | unknown | nearer my god to thee |
| 8 | QmYRYqkBqjt5xBcB6bH4Hsfc2EDpEstGGwKYRDohSXLXpQ | Nearer my God to Thee (Lowry) - Robert Lowry | Robert Lowry /  | PIANO2 | 6/8 | 16 | 0 | 0.00 (0) | 20 | unknown | nearer my god to thee |
| 9 | QmXtfq2agBq19WvKoEbfL8b5CBadUoDfbn7yEBWBJrEEkQ | Nearer my god to thee - Bethany (Mason) Lowell Mason | Lowell Mason / Composer unknown | PIANO2 |  | 16 | 0 | 0.00 (0) | 14 | unknown | nearer my god to thee |
| 10 | QmQ9epma2TQZY8SznSFWKadqcdwZb1yamGEifcroPAUQ6M | Music by Lowell Mason - Nearer My God to Thee | Lowell Mason / Music by Lowell Mason 1856Lyrics by Sarah F. Adams 1841 | PIANO2 | 4/4 | 16 | 0 | 0.00 (0) | 12 | pd | nearer my god to thee |
| 12 | QmWrbn4L6MCU9rM1cw3ATRoUDNWPF89HpjVRC5yBR7gZkN | Nearer my god to thee - John Roberts | John Roberts / John Roberts (1822-1877) | PIANO2 |  | 16 | 0 | 0.00 (0) | 3 | unknown | nearer my god to thee |
| 14 | QmerFnmjpuczs9wwDoTng8kEh7aswM29Jr5m3BV57aPj4K | Holy holy holy - Alfred Stone | Alfred Stone / Alfred Stone 1863 | PIANO2 | 4/4 | 16 | 0 | 0.00 (0) | 2 | unknown | holy holy holy |
| 15 | QmVhPU59vZdU9M92Jnt7jsKTS7zwttSJYLRt4tctbGHJKD | Deep River | Misc Traditional / IrregularDEEP RIVERwww.hymnary.org/text/deep_river_my_home_is_over_jordan | PIANO2 | 4/4 | 20 | 0 | 4.57 (11) | 520 | unknown | deep river |
| 16 | QmWyFckvyoMiNLFawUiRMTeH2USzFHijjt8TdEWbTRDQ7N | Holy holy holy - John B. Dykes | John B. Dykes / John Bacchus Dykes 1861 | PIANO2 | 4/4 | 16 | 0 | 4.11 (6) | 135 | unknown | holy holy holy |

### Terms with zero matches

None.

Hits per term: joyful joyful=14; joyful we adore thee=12; hymn to joy=3; ode to joy=32; holy holy holy=36; nearer my god to thee=37; deep river=7; steal away=5


## Lane E-latin

Goal: a score that really shows a bossa accompaniment; a real montuno/guajeo/tumbao model; more modern tango around Libertango

### Known CIDs, identity check

| Indexed as | CID | Verdict | CSV title / song_name | CSV composer / artist | Programs | Shape | Bars | Chord symbols |
|---|---|---|---|---|---|---|---|---|
| Tico-Tico | QmWbvFZYw6cR7ytP7V2SyZm2u6VMGCD31cBnNuWwMoqFLw | MATCH | Tico Tico / Tico Tico |  / Misc tunes | 0 | LEADSHEET | 51 | 48 |
| So Danco Samba | QmbmC9BRdBLb6XUbyf5TqSy1P1oYdNDYTJoSpd4nXByPMD | MATCH | Só Danço Samba / so danco samba | Antonio Carlos Jobim / Antônio Carlos Jobim | 0 | LEADSHEET | 34 | 25 |
| Chega de Saudade | Qmcnc6BPWUhP1fk6GKoXEH35gSvJNi87bKz4cy5s6xuYTV | MATCH | Chega de Saudade / chega de saudade | Tom jobim e Vinicius de Moraes / Antônio Carlos Jobim | 71 | OTHER | 76 | 0 |
| Girl from Ipanema | QmbePogksNuacefKjPnFMTEPad7EfR6ugFNirGLLckffJr | MATCH | The Girl from Ipanema / the girl from ipanema |  / Antônio Carlos Jobim | 56-65-71-73 | OTHER | 44 | 0 |
| Corcovado | QmWYgg7QifpX4XtkYReco3Psk4GvNgzbeZMeqTBUvabUgF | MATCH | corcovado /  |  /  | 0 | LEADSHEET | 36 | 31 |
| Jalousie | QmbEXBfVDk9iNqKRoXudwgcVKFL9yagDcFvwqAwvLt5h5H | MATCH | Bezeichnung standardisiert: La Jalousie; / Bezeichnung standardisiert: La Jalousie; | Urheber unbekannt 1720 belegt / Misc tunes | 0 | PIANO1 | 18 | 0 |
| Por Una Cabeza | QmPqGm73syTAnvaFSwHWB5nTi3KEMybjqMYRVRox2eejWb | MATCH | Por Una Cabeza (String Quartet) / por una cabeza | Carlos GardelArranged by Michael Tan / Carlos Gardel | 40-40-41-42 | OTHER | 65 | 0 |
| Caminito | QmWPVaLZLid7D3fiNRhaKPxH36zWf2Pu3JLFxxQYFRRwDV | MATCH | Caminito / Caminito |  / Misc Traditional | 21-23-40 | OTHER | 71 | 0 |

Hits: 93 rows pass the lane filters (93 before filters).

### Dumped scores

| CID | Title | Artist / composer | Shape | Meters | Bars | Chord symbols | Rating (n) | Views | Label | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| QmWYgg7QifpX4XtkYReco3Psk4GvNgzbeZMeqTBUvabUgF | corcovado |  /  | LEADSHEET | 2/2 | 36 | 31 | 4.83 (3) | 239 | unknown | known: Corcovado (MATCH) |
| QmbmC9BRdBLb6XUbyf5TqSy1P1oYdNDYTJoSpd4nXByPMD | Só Danço Samba | Antônio Carlos Jobim / Antonio Carlos Jobim | LEADSHEET | 4/4 | 34 | 25 | 4.72 (47) | 3788 | unknown | known: So Danco Samba (MATCH) |
| QmWbvFZYw6cR7ytP7V2SyZm2u6VMGCD31cBnNuWwMoqFLw | Tico Tico | Misc tunes /  | LEADSHEET | 4/4 | 51 | 48 | 0.00 (0) | 33 | unknown | known: Tico-Tico (MATCH) |
| QmRWDfadi4gsez9ishabhEcHpHNdjC7q2efEJZe5SDa8X8 | Garota de Ipanema | Bia Giovanella 2 / Arr.: Bianca Giovanella | PIANO2 | 2/4 | 34 | 24 | 4.67 (39) | 1054 | unknown | rank 7 top distinct song #1 |
| QmTBJZppfNknV4qdmmCxjar1Qh5BRJNSyDRP919x2JdnMN | Por una Cabeza | Carlos Gardel / Carlos Gardelarr. Teddy Leong-she | PIANO2 | 4/4 | 43 | 0 | 4.77 (32) | 1395 | unknown | rank 8 top distinct song #2 |
| QmQSWZ1U7q2MoQHVoWBt7htbe8f1JWrGpYpnD1MKytUV2c | Por una Cabeza | Carlos Gardel / Carlos Gardel Arr: Flávio Régis Cunha | MIXED_PIANO2 | 4/4 | 65 | 0 | 4.83 (26) | 5643 | unknown | rank 12 extra shape |
| QmZF4m2KTAiHmHpg9eYrG1y2bfQKo2chTxSNYepnmuvHtF | Girl From Ipanema | Antônio Carlos Jobim / arr Noah Zahm | MIXED_PIANO2 | 4/4 | 51 | 0 | 4.72 (26) | 6135 | unknown | rank 14 top distinct song #3 |
| QmYNaW9VvQDFWoD159XYCPxmvyJmGBkhrFijb1P1PaLRUE | Adios Nonino | Astor Piazzolla /  | MIXED_PIANO2 | 4/4,2/4 | 81 | 0 | 4.28 (4) | 735 | unknown | rank 16 top distinct song #4 |
| QmXApgzsxGtBZpq9ZMcEcZLZf7MAzxTNfXK3DjEcEV1xid | Por una Cabeza |  / C.Gardel | PIANO1 | 4/4 | 96 | 0 | 0.00 (0) | 505 | unknown | rank 17 extra shape |
| QmdTRWW1YANW9XNop1c4cu3tiRHDtwGeZkPEB5GbLQWBdf | Zequinha de Abreu - Tico Tico | Zequinha de Abreu / Zequinha de Abreu 1917 | PIANO1 | 2/4 | 59 | 0 | 0.00 (0) | 69 | unknown | rank 18 top distinct song #5 |
| QmejFJRcT7Q9hdFQWbhPZCnewzAzCzVCckYHgsVuN7RcAM | Tico Tico | Misc tunes /  | PIANO1 | 2/2 | 193 | 0 | 0.00 (0) | 30 | unknown | rank 19 extra shape |
| QmbYzj8P6PbJ9DwbepDeMSHTVoHyEEMhQRsuTLcqf3bqyd | La Negra Tiene Tumbao | Fernando Osorio / Victor Lopez | PIANO2 | 4/4 | 68 | 46 | 0.00 (0) | 448 | unknown | rank 34 top distinct song #6 |
| QmZq95t9yu9JmYP47Hksx9aXGvrmxJ6KZfrWshwAetiuas | Tico Tico no fuba | Zequinha de Abreu / Zequinha Abreu | PIANO2 | 2/4 | 56 | 0 | 4.80 (890) | 83745 | unknown | rank 37 extra shape |
| QmdZTLCS4kM6YJHjRX2D8kp6oEMPBD1w79nZJ2iszfqn3k | Bezeichnung standardisiert: La Jalousie; | Misc tunes / Urheber unbekannt 1720 belegt | PIANO2 | 2/2 | 14 | 0 | 0.00 (0) | 5 | pd | rank 42 extra shape |
| QmbEXBfVDk9iNqKRoXudwgcVKFL9yagDcFvwqAwvLt5h5H | Bezeichnung standardisiert: La Jalousie; | Misc tunes / Urheber unbekannt 1720 belegt | PIANO1 | 2/2 | 18 | 0 | 0.00 (0) | 3 | pd | known: Jalousie (MATCH) |

- NOT dumped: QmWNYhKuKrE81cwH7PedcrVNTxjWiWsZoYFprwG2gAvxkg (rank 51 extra shape): skipped: XML 8.4 MB over 3 MB

### Next 10 ranked, undumped

| Rank | CID | Title | Artist / composer | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | QmZohuznXwiR1EJ59f4HMnYVGoqTBqTszxABNNWtJJ6A6N | Tico Tico | Misc tunes /  | LEADSHEET | 4/4 | 51 | 48 | 0.00 (0) | 44 | unknown | tico tico |
| 5 | QmVcaq7whQkyfAhKPaZXn1t1XS2Rzrgi398yehXzmq2iix | Tico Tico | Misc tunes /  | LEADSHEET | 4/4 | 51 | 48 | 0.00 (0) | 20 | unknown | tico tico |
| 6 | QmPaLgyYtbsoGGdR7jH9TmWHj6CbwahaQAFUyNvP3gSYg5 | Tico Tico | Misc tunes /  | LEADSHEET | 4/4 | 51 | 45 | 0.00 (0) | 18 | unknown | tico tico |
| 9 | QmNswaWYXpxK1XegKbJVDULwZMjKN6cETGTVfXQKYsYrzs | Por Una Cabeza - Carlos Gardel | Carlos Gardel / Carlos Gardel | PIANO2 | 4/4 | 66 | 0 | 4.75 (78) | 1068 | unknown | por una cabeza |
| 10 | Qme3HzhbR5A5Tab5QJ684kcd9EdH4iaKiN8vbQLLYuoNWQ | Por una cabeza | The Piano Passion / Carlos Gardel | PIANO2 | 4/4 | 74 | 0 | 4.71 (4) | 243 | unknown | por una cabeza |
| 11 | QmSDzs2eestyStqqunrRJUJxDi3g8i5YpomTrLd1JHpv6K | Por unas cabezas | Carlos Gardel /  | PIANO2 | 4/4,3/4,1/4 | 36 | 0 | 0.00 (0) | 4999 | unknown | por una cabeza |
| 13 | QmPhPbQeKAbouX4AVXgaZ6tSqdFxAzhyFwpSdn9ZXhM1FG | Gardel - Por una Cabeza for Flute Cello and Piano | Carlos Gardel / Carlos Gardel (1890 - 1935) | MIXED_PIANO2 | 2/4 | 65 | 0 | 4.75 (112) | 5106 | unknown | por una cabeza |
| 15 | QmapaWk2ft6Yvptx58WxsWqZdEB749GUKkE8FvoQkhxrXc | Por una Cabeza | Carlos Gardel / Carlos Gardel | MIXED_PIANO2 | 4/4,5/8,7/8,9/8 | 84 | 0 | 4.66 (32) | 2859 | unknown | por una cabeza |
| 20 | QmeFo2HfkeAfh9qR6sJNMHAEQYeHJjQhHLjUTnXocbuEXE | Tico Tico | Misc tunes /  | PIANO1 | 2/2 | 193 | 0 | 0.00 (0) | 18 | unknown | tico tico |
| 21 | QmTTV5DswxejwXjtG6TEnrvoUrHYxfAXuLDnBmqyfT57gs | Por una cabeza | Carlos Gardel / Carlos GARDEL | OTHER | 4/4 | 65 | 53 | 4.73 (12) | 860 | unknown | por una cabeza |

### Terms with zero matches

son montuno, salsa piano, guajeo, oye como va, chan chan, fuga y misterio, la muerte del angel, michelangelo 70, escualo, tango nuevo

Hits per term: montuno=1; son montuno=0; tumbao=2; salsa piano=0; guajeo=0; oye como va=0; chan chan=0; adios nonino=3; fuga y misterio=0; la muerte del angel=0; michelangelo 70=0; escualo=0; piazzolla=32; tango nuevo=0; tico tico=17; so danco samba=1; chega de saudade=3; girl from ipanema=7; garota de ipanema=2; corcovado=2; jalousie=11; por una cabeza=15; caminito=1


## Lane F-improv-compose

Goal: short real examples for motif, repetition/variation, harmonizing a melody, small binary/ABA form

### Known CIDs, identity check

| Indexed as | CID | Verdict | CSV title / song_name | CSV composer / artist | Programs | Shape | Bars | Chord symbols |
|---|---|---|---|---|---|---|---|---|
| Down in the Valley | QmWuBBaf6uwZdiWHx1dm9meAW2tXnw6EV7hb93tnDTy3S4 | MATCH | Down in the valley - Anonymous / down in the valley | Anonymous / Misc Traditional | 0-0 | PIANO2 | 24 | 0 |
| Oh Susanna | QmchjwvtpXykrxVrMHadPZLP7AHZ4ZgFjEg6qca7xpPFcm | MATCH | Stephen Foster - Oh Susanna / Oh! Susanna | Stephen Foster 1847 / Stephen Foster | 0 | LEADSHEET | 17 | 11 |
| House of the Rising Sun | Qmc3v934xFCPJrgGpH9J8G5qTUhebhrysLwPEFEXhYgStR | MATCH | House of the Rising Sun / The House of the Rising Sun | anon. / Misc Traditional | 0 | LEADSHEET | 17 | 16 |
| Autumn Leaves | QmWLjxJSdX1VjYwcEkDYhj7CDhWLX4rFbSakCxiGTJWT7T | MATCH | Behold the changing autumn leaves - Asa Hull / Behold the changing autumn leaves |  / Asa Hull | 0 | PIANO2 | 30 | 0 |

Hits: 1211 rows pass the lane filters (3510 before filters).

### Dumped scores

| CID | Title | Artist / composer | Shape | Meters | Bars | Chord symbols | Rating (n) | Views | Label | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| QmaNGN437JsdT2RTdnZEC8gfm7Doc8CqiusogB2PQEnoPu | Franz Xaver Gruber - Silent Night - Waltz | Franz Xaver Gruber / Franz Xaver Gruber | PIANO2 | 3/4 | 24 | 12 | 0.00 (0) | 128 | unknown | rank 1 top distinct song #1 |
| QmWzCHF7iXaZoDeWuZAQxtBhTYDWU25v76FEg8wJYVCu32 | James Hook - Minuet | James Hook / James Hook | LEADSHEET | 3/4 | 8 | 8 | 0.00 (0) | 17 | unknown | rank 2 top distinct song #2 |
| QmQReLi7RpjwRzBA7K1ynX98MaDXJQUfFEnGi19bSNXF9R | Prelude - BWV 855a - JS Bach | Johann Sebastian Bach / Johann Sebastian Bach | PIANO2 | 4/4 | 23 | 0 | 4.86 (32) | 3280 | pd | rank 3 top distinct song #3 |
| QmULtYgZ5haxhehzpuBVTSkWy7GAew1xkK9cNgj2eCD9U1 | POLDARK - Prelude (Theme extended version) | Anne Dudley / Anne Dudley | PIANO2 | 4/4 | 30 | 0 | 4.87 (13) | 1580 | unknown | rank 4 top distinct song #4 |
| QmT4sxk6RZNs91iTEaX1j323sbyPDK44Z1Abo7BBtprRap | Prelude (S.Liapounow Op.6.No.1) | Sergey Lyapunov / S.Liapounow Op.6.No.1 | PIANO2 | 4/4 | 39 | 0 | 4.87 (5) | 136 | unknown | rank 5 top distinct song #5 |
| QmUU8bnbG2i4TTxvpzBvZ8M27QtLWkjoSPVJxbRtG3v9Zs | Henry Purcell - Minuet | Henry Purcell / Henry Purcell | PIANO2 | 3/4 | 20 | 0 | 4.85 (4) | 82 | pd | rank 6 extra shape |
| QmU5R5iPDJRcbpKPJQwNhPd48XgFC1MJx6QyLmtT8fnf3T | Prelude (M.Ravel) | Maurice Ravel / M.Ravel | PIANO2 | 3/4 | 27 | 0 | 4.79 (7) | 519 | in-copyright | rank 7 top distinct song #6 |
| QmRgGKoYNhTe4ymePaix8qJepNawDCAwntcrp3s3W9q6Mz | Christoph Willibald Gluck - Minuet | Christoph Willibald Gluck / Christoph Willibald Gluck | PIANO1 | 3/4 | 28 | 0 | 0.00 (0) | 38 | unknown | rank 30 extra shape |
| QmbYqBsoSeeo9g9qke2Wja9Z1McBNNe9sYq4htD4RvAnrH | Prelude | Misc tunes /  | PIANO1 | 2/4 | 17 | 0 | 0.00 (0) | 5 | unknown | rank 39 extra shape |

### Next 10 ranked, undumped

| Rank | CID | Title | Artist / composer | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 8 | QmT4J9Eu8mutj8ob8hfLHRQB84TFjeNougJ2aQ2MSfc4fH | Prelude (A.Scriabin Op.11.No.1) | Alexander Scriabin / A.Scriabin Op.11.No.1 | PIANO2 | 2/2 | 26 | 0 | 4.83 (3) | 268 | unknown | prelude |
| 9 | QmfRYEUhXHSj9a8yk5s4b5ErUsrQ3QkNNxgcJhfU65VjfE | Minuet | James Hook / James Hook | PIANO2 | 3/4 | 16 | 0 | 4.77 (6) | 77 | unknown | minuet |
| 10 | QmeF9Q7WfB4URdVgezS1aZKt96JLjChijMrGs9TDSbtCDG | Minuet | James Hook / James Hook | PIANO2 | 3/4 | 16 | 0 | 0.00 (0) | 1706 | unknown | minuet |
| 11 | QmXihDS7T7xkehopNyJ3YqwTV8TCLowqcG5XhVkLFBZ7vz | Minuet | Johann Sebastian Bach / J.S.Bach | PIANO2 | 3/4 | 32 | 0 | 0.00 (0) | 1228 | pd | minuet |
| 12 | QmR85jrhUo2v9QcpHMzENA6z7z3RKb2JkC3Ks2aHe1NCZt | Prélude |  / Chopin | PIANO2 | 3/4 | 17 | 0 | 0.00 (0) | 769 | pd | prelude |
| 13 | Qmd8WDgKQL4Q56qzyJiw6hcspWtEKrskC1J7Rc3P7Xmt3a | Bagatelle |  /  | PIANO2 | 6/8 | 19 | 0 | 0.00 (0) | 126 | unknown | bagatelle |
| 14 | QmQGGqN9LKPTntnAELbiRrKSHEyGUwJsa7WP3rRmZAfMWz | Prelude | Sires_ / Rodrigo Damasceno | PIANO2 | 4/4 | 35 | 0 | 0.00 (0) | 102 | unknown | prelude |
| 15 | Qmdd893Gosw45TVvtVhA465xBBFop3CxcF8MkrFypv7Xff | BWV 858 - Prelude | Johann Sebastian Bach / J.S. Bach | PIANO2 | 12/16 | 30 | 0 | 0.00 (0) | 80 | pd | prelude |
| 16 | QmYJ6QHJF2hx465Mn1XaXNm6e7LVX9f6fUwDhRKHhGr8Uy | Waltz | composer Uknown /  | PIANO2 | 3/4 | 16 | 0 | 0.00 (0) | 73 | unknown | waltz |
| 17 | Qmc8jGeQafSRJ2pxZqtGWrr2MXohZKz5RK14irtRvBU7u4 | Prélude - Patrice Reich | Patrice Reich / Patrice Reich | PIANO2 | 4/4 | 29 | 0 | 0.00 (0) | 38 | unknown | prelude |

### Terms with zero matches

None.

Hits per term: minuet=652; binary form=1; theme and variation=4; prelude=651; bagatelle=34; waltz=2169


## Lane G-holiday

Goal: non-Christmas holiday material (Hanukkah) so the Holiday track can keep its promise

Hits: 50 rows pass the lane filters (50 before filters).

### Dumped scores

| CID | Title | Artist / composer | Shape | Meters | Bars | Chord symbols | Rating (n) | Views | Label | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| QmSe5SBzVY7xuqiqbPmyNF9tcMb5LBNnWUfnKbYung75mY | Maoz tsur | Misc Praise Songs /  | PIANO2 | 2/2 | 18 | 0 | 0.00 (0) | 159 | unknown | rank 1 top distinct song #1 |
| QmQ3iGnFwSZFPs2Hh9vUzctQ1gTusQRwafCZoCXE3Q53xh | Rock of ages - Thomas Hastings | Thomas Hastings / Thomas Hastings 1830 | PIANO2 | 3/2 | 13 | 0 | 0.00 (0) | 24 | unknown | rank 5 top distinct song #2 |
| QmY9tPFTtU9CZU8FMZr6YSDF27aahfYxC76KJnxAYtLYEC | Maoz Tsur | Misc Praise Songs /  | PIANO1 | 4/4 | 16 | 2 | 0.00 (0) | 53 | unknown | rank 7 extra shape |
| QmUgP4ZNMSnRcS7UiGdSMPV8RuFxYpaAQabqhu3VZxYRhd | Rock of Ages cleft for me (Ruebush) - J. H. Ruebush | J. H. Ruebush /  | PIANO2 | 3/4 | 24 | 0 | 0.00 (0) | 84 | unknown | rank 12 top distinct song #3 |
| QmbkVNik2z9eJQwDZYDvo8f8iDy2NKcovJXVJnuVVLuJ1V | Blest Rock of ages cleft for me - Chas. H. Gabriel | Chas. H. Gabriel /  | PIANO2 | 6/8,5/8,1/8,3/4 | 22 | 0 | 0.00 (0) | 34 | unknown | rank 14 top distinct song #4 |
| QmeryikFWiJRo4b1puszFYZrGeRjDRnxCroFTx43BwdejA | Praise the Lord the Rock of ages - Jno. R. Sweney | John R. Sweney /  | PIANO2 | 4/4,5/8,12/8,9/8 | 18 | 0 | 0.00 (0) | 29 | unknown | rank 15 top distinct song #5 |
| QmUp9oNAPY77qbW4aRcNf2iVGDeYSRhBALNGXFKNvKy1pU | O blessed Rock of Ages O Lamb of Calvary - J. W. Gaines | J. W. Gaines /  | PIANO2 | 4/4,3/4,1/4,9/8 | 27 | 0 | 0.00 (0) | 26 | unknown | rank 16 top distinct song #6 |

### Next 10 ranked, undumped

| Rank | CID | Title | Artist / composer | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | QmenbiDtqtN5JGmCMf9eqLDJi1jxDwWHo275HV3rY5zN2C | Maoz Tsur | Misc Praise Songs / German Askenazic Melody | PIANO2 | 4/4 | 16 | 0 | 0.00 (0) | 114 | unknown | maoz tzur |
| 3 | Qmb1VXWFiiVzsMCxBjnN2yPcYt8JaCtt7pKvqxGjuyzxYe | Men and children everywhere - Maoz Tsur German Ashkenazic tune. | Misc Praise Songs / German Askenazic Melody | PIANO2 | 4/4 | 16 | 0 | 0.00 (0) | 38 | unknown | maoz tzur |
| 4 | QmTRXqr1JUb25SewJV33sJ6EzX98kMJFf3RrfFUdNGDRaz | Maoz tsur y'shuati - Marcus Jastrow | Misc Praise Songs / German Askenazic Melody | PIANO2 | 4/4 | 16 | 0 | 4.49 (5) | 95 | unknown | maoz tzur |
| 6 | QmW8wywozM6GmjiBePAtWdyzPkA1bnX5sMg22TavXxs54q | Rock of ages cleft for me | Thomas Hastings / Thomas Hastings (1784-1872) | PIANO2 | 6/4 | 13 | 0 | 4.35 (17) | 1737 | unknown | rock of ages |
| 8 | QmcLi78cwJxX9Rh4pViufwnmoKDqwRM8DAta8Z2kiL4rEM | Maoz tsur | Misc Praise Songs /  | PIANO1 | 2/2 | 14 | 0 | 0.00 (0) | 34 | unknown | maoz tzur, rock of ages |
| 9 | Qma5qmBR5ujUvo9DtpjrJVYbf9498KGr7y1yygEgd83Hp7 | Maoz tsur | Misc Praise Songs /  | PIANO1 | 2/2 | 14 | 0 | 0.00 (0) | 32 | unknown | maoz tzur, rock of ages |
| 10 | QmRJ89juCF9d9a1zxcoBn42iZVP5LP7vvBSDKryv3rZCmG | Maoz tsur | Misc Praise Songs /  | OTHER | 4/4 | 20 | 0 | 0.00 (0) | 48 | unknown | maoz tzur, rock of ages |
| 11 | QmSiuMcoDyNcKygcMos6eK9ouCMkhCpWszhThtPYifq8ii | Rock of Ages - Toplady |  / Thomas Hastings 1830 | OTHER | 3/2 | 15 | 0 | 0.00 (0) | 761 | unknown | rock of ages |
| 13 | Qmcc7tLgGyDQrb7nhi5BsXsUFsqb8L6C7YRbDkQNR7Biy1 | Rock of Ages cleft for me (Lorenz) - E. S. Lorenz | E. S. Lorenz /  | PIANO2 | 3/4,4/4,2/4 | 48 | 0 | 0.00 (0) | 74 | unknown | rock of ages |
| 17 | QmWBfDT1XZboM4gi15EBL4CNa4PzjYr5xk5AELDbhcqsZg | Standing on the Rock of Ages - Charles Clinton Case | Charles Clinton Case / Charles Clinton Case | PIANO2 | 4/4 | 24 | 0 | 0.00 (0) | 20 | unknown | rock of ages |

### Terms with zero matches

chanukkah, hanukah, ma oz tzur, mao z tzur, hanerot halalu, sevivon, s vivon, mi y malel, mi yemalel, chanukah oh chanukah, hanukkah oh hanukkah

Hits per term: hanukkah=4; chanukah=3; chanukkah=0; hanukah=0; maoz tzur=8; ma oz tzur=0; mao z tzur=0; rock of ages=36; hanerot halalu=0; sevivon=0; s vivon=0; dreidel=4; mi y malel=0; mi yemalel=0; chanukah oh chanukah=0; hanukkah oh hanukkah=0


## Lane H-ragtime

Goal: one authentic stop-time passage if easy; lower priority

### Known CIDs, identity check

| Indexed as | CID | Verdict | CSV title / song_name | CSV composer / artist | Programs | Shape | Bars | Chord symbols |
|---|---|---|---|---|---|---|---|---|
| The Harlem Rag (1899, Tyers) - already reviewed, keep | QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9 | MATCH | The Harlem Rag (1899 - Tyers) /  | By Tom Turpin. Revised and Arr. by W.H.Tyers. /  | 0 | PIANO2 | 115 | 0 |

Hits: 34 rows pass the lane filters (34 before filters).

### Dumped scores

| CID | Title | Artist / composer | Shape | Meters | Bars | Chord symbols | Rating (n) | Views | Label | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| Qme3vDrh4eg9Gk4FSqeuSag3Ft5LdbrrZzWgsRphr2CuLB | Cosgrove's Cakewalk | Misc tunes /  | LEADSHEET | 4/4 | 17 | 23 | 0.00 (0) | 2 | unknown | rank 1 top distinct song #1 |
| Qma4jk2XgsU8hYgjmUTt3EyeqtwNW8Y8ZqJaxHuKo37DzK | Heliotrope Bouquet - Joplin and Chauvin - 1907 | Scott Joplin / By SCOTT JOPLINand LOUIS CHAUVIN. | PIANO2 | 2/4 | 87 | 0 | 4.94 (49) | 3412 | pd | rank 2 top distinct song #2 |
| QmXd7HNnNZodQvrybARoZN8NtcZ2LVpJ1Wxbkc8Gq9YJ36 | The Ragtime Dance - Scott Joplin - 1906 arrangement | Scott Joplin / By SCOTT JOPLIN | PIANO2 | 2/4 | 83 | 0 | 4.87 (183) | 18219 | pd | rank 3 top distinct song #3 |
| QmPdy5cVQ2tE9qMWhwLhVd2QtZh26inRSadFmcwkoypkpN | Sunflower Slow Drag - Joplin and Hayden - 1901 | Scott Joplin / By SCOTT JOPLIN and SCOTT HAYDEN. | PIANO2 | 2/4 | 93 | 0 | 4.83 (38) | 4145 | pd | rank 4 top distinct song #4 |
| QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9 | The Harlem Rag (1899 - Tyers) |  / By Tom Turpin. Revised and Arr. by W.H.Tyers. | PIANO2 | 2/4 | 115 | 0 | 4.90 (8) | 585 | unknown | known: The Harlem Rag (1899, Tyers) - already reviewed, keep (MATCH) |

### Next 10 ranked, undumped

| Rank | CID | Title | Artist / composer | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 6 | QmPSN2TnRH1hx3fAje4fabZYgPvAEb3sfdieKyACCoerwE | Uncle Ben's Cakewalk Tom Brier | Tom Brier / Tom Brier | PIANO2 | 2/4 | 111 | 0 | 4.84 (16) | 953 | unknown | cakewalk |
| 7 | QmNkUeyzWJByJGWVksoThUEbKpqN9SeTKKTHUbTU2yukSK | Eli Green's Cake Walk - Sadie Koninsky | Sadie Koninsky / By Sadie Koninsky. | PIANO2 | 2/4 | 119 | 0 | 4.85 (11) | 440 | unknown | cake walk |
| 8 | QmdXabACSKdCTfNeTd9UErjjzD8xaVxiHEcfA2c3sd8etC | Cake Walk Lindy (1900) | Edward B. Claypoole / ED. B. CLAYPOOLE. | PIANO2 | 2/4 | 105 | 0 | 4.85 (11) | 191 | unknown | cake walk |
| 9 | QmTCkc3QhPhVjn4P3GuQNvuoQfxnMb5NECWUVR2vYeAYZN | The King of the Cake Walk (1903) | Marius Cairanne / Marius CAIRANNE | PIANO2 | 2/4 | 90 | 0 | 4.89 (7) | 293 | unknown | cake walk |
| 10 | QmX5gyiLscCxM2fetFEPm9XntJdPSTmoTp9DXoUdEq2Txu | Alabama Dream | George D Barnard /  | PIANO2 | 2/4 | 119 | 0 | 4.85 (4) | 478 | unknown | cake walk |
| 11 | QmRoT3K2BrayjL974S3EHmy62BJUCKkoCaUXSeYjujLaEf | Chocolate Cake Walk |  / James A. Fairfield | PIANO2 | 2/4 | 103 | 0 | 4.85 (4) | 230 | unknown | cake walk |
| 12 | QmUijDkGPbFPYHkEY6bLEiNFz8W7x24vXgT1Lm3MteRZFb | The Minneapolis Journal March |  / By EDMUND BRAHAM | PIANO2 | 2/2 | 102 | 0 | 4.83 (3) | 177 | unknown | cake walk |
| 13 | QmeHMWycGyY3DiMx8McchkMy4gfNraD6Z4S3x9tFZXE4jN | Kinklets (1906) | Arthur Marshall / By Arthur MarshallComposer of Swipesy Cake Walk | PIANO2 | 2/4 | 77 | 0 | 4.77 (6) | 308 | unknown | cake walk |
| 14 | QmWsrkyCndk12u437ku3ApGXEjZC4NNGMmFvU4DuByszdK | Sun Flower Slow Drag Joplin Scott | Scott Joplin / Scott Joplin and Scott Hayden | PIANO2 | 2/4 | 93 | 0 | 4.74 (5) | 407 | pd | slow drag |
| 15 | QmezsJDqELDQ6He7V5FRaHkocHasWMxkThE1ZJrVssyzsX | Keep Moving |  / By William White | PIANO2 | 2/4 | 74 | 0 | 0.00 (0) | 379 | unknown | cake walk |

### Terms with zero matches

None.

Hits per term: stop time=1; stop-time=1; cakewalk=6; cake walk=21; slow drag=7


## Lane I-pop

Goal: real four-chord and voice-led pop; arpeggiated accompaniment; syncopated comping; by-ear/reduction targets; intro/outro/modulation examples; one or two excellent songs for chords-pop.8/.9

Hits: 248 rows pass the lane filters (248 before filters).

### Dumped scores

| CID | Title | Artist / composer | Shape | Meters | Bars | Chord symbols | Rating (n) | Views | Label | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn | Billy Joel - She's Always A Woman | Billy Joel / Billy Joel | PIANO2 | 12/8,6/8,9/8 | 40 | 129 | 4.80 (101) | 7040 | unknown | rank 1 top distinct song #1 |
| QmVrWfwZhqnxT3JWZqNHhwfRkUeuCr6MP9b7JjKjWT7pNu | Hallelujah Chorus (2020) My Messiah 06 | Georg Friedrich Händel / G.F.Handel | PIANO2 | 4/4 | 94 | 150 | 4.83 (3) | 166 | pd | rank 2 top distinct song #2 |
| QmcJRkptrVetWEAJibzZgn4FjTLZbb3NWyMnD8Ce9azWNh | Coldplay - The Scientist | Coldplay /  | PIANO2 | 4/4 | 22 | 22 | 4.71 (4) | 461 | unknown | rank 3 top distinct song #3 |
| QmWYmN6LAJEMYFZaVKTvmRHbk66RWLsxH1Hk9isULZz5hs | Love of My Life | Misc tunes / J-38 | LEADSHEET | 6/8 | 25 | 37 | 0.00 (0) | 854 | unknown | rank 4 top distinct song #4 |
| QmVXmps1eEPetMLbU9Bx33h2tLDhEXT1UiAFXmArY1ocEU | 10 minutos Hallelujah Tutorial 12 | Leonard Cohen / Leonard Cohen | LEADSHEET | 6/8 | 30 | 27 | 0.00 (0) | 481 | unknown | rank 5 extra shape |
| QmYuSTG72XHkHMAr1TqtmZtws3X5QiYKZDWvDrhcfqfSmy | John Playford - Vienna | John Playford / John Playford 1686 | LEADSHEET | 2/2 | 16 | 26 | 0.00 (0) | 7 | pd | rank 6 top distinct song #5 |
| QmSEP572SsajfnvFbv7LvX3834H2SXA48k8m3RpNjAoDyW | Something | Misc tunes /  | LEADSHEET | 4/4 | 16 | 24 | 0.00 (0) | 6 | unknown | rank 7 top distinct song #6 |
| QmQhzFncR7uFfyVdjDmNZBQSVgkffiyeXwhQXfYUNA4ZyN | When We Were Young - Adele - Accompaniment | Adele / Adele | PIANO2 | 4/4 | 118 | 173 | 4.58 (40) | 2279 | unknown | rank 8 top distinct song #7 |
| QmPoKC1KNnhFURL5QSo3DRkGEWAoRgDiDEUchNJt79dGRo | Something - The Beatles | The Beatles / George Harrison (Beatles) | PIANO2 | 4/4 | 19 | 39 | 4.54 (384) | 15395 | unknown | rank 9 extra shape |
| QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M | No Surprises | Radiohead / Radiohead | PIANO2 | 4/4 | 71 | 0 | 4.83 (33) | 1613 | unknown | rank 12 top distinct song #8 |
| QmSyDuL23d8LtVWeGEk1XSTTzbZgSWU4AsEcEmU5A7LjJt | Vienna | Billy Joel / Words and Music by Billy Joel | PIANO2 | 4/4 | 108 | 0 | 0.00 (0) | 138 | unknown | rank 26 extra shape |
| QmYZGRsLCsNASou3HBU85SfR5T1KQx5hPqZVJa9xHtsbbM | No Surprises |  / Radiohead | MIXED_PIANO2 | 4/4 | 68 | 0 | 0.00 (0) | 655 | unknown | rank 70 extra shape |
| QmRyuCGUtT4ezbcQ4iwwxjSW8dGEPo89xeWZQGCUpxiVQ3 | something | elrune4 /  | MIXED_PIANO2 | 4/4 | 32 | 0 | 0.00 (0) | 37 | unknown | rank 75 extra shape |
| QmaFkFGGac9zaNwkHMHMmvhFi5oEWDwVanGn2UEUvNTEzf | Vienna Waltz. JMT.117 | Misc tunes /  | PIANO1 | 3/8 | 33 | 0 | 0.00 (0) | 14 | unknown | rank 89 extra shape |
| QmZv36W7wx6M6iQfXyeABA3PiNZM74qrVJKLqfVuB1ueoo | Radiohead - No surprises (for drums) | Radiohead / http://drummatica.ru | PIANO1 | 4/4 | 61 | 0 | 4.42 (11) | 4077 | unknown | rank 101 extra shape |

### Next 10 ranked, undumped

| Rank | CID | Title | Artist / composer | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 10 | QmUkekPKGR983LBTg8oK7QYh1rKLkUmUNnKJrMLWRKm4Nx | Vienna Billy Joel | Billy Joel / Billy Joel | LEADSHEET | 4/4 | 107 | 95 | 4.48 (28) | 3097 | unknown | vienna |
| 11 | QmX2w4HB85MtoYoE7fQzSa7PekKLsBXKPwKGJWfGcmYtPF | Love of My Life | Misc tunes / J-38 | LEADSHEET | 6/8 | 25 | 37 | 4.09 (19) | 1634 | unknown | love of my life |
| 13 | QmeQQcvhQttDeWkUeWsMd71pG6WgJtAwv6xuDShh7YUy7B | Elton John - Rocket Man | Elton John /  | PIANO2 | 4/4 | 47 | 0 | 4.78 (146) | 9149 | unknown | rocket man |
| 14 | QmRKbMa1bCBckA8wi142ZKKwKaJTR8yp5XFxaG7BzKxW1i | Bridge over troubled water SATB | Simon & Garfunkel / Paul Simonarr. B.Salmén | PIANO2 | 4/4 | 83 | 0 | 4.80 (28) | 1295 | unknown | bridge over troubled water |
| 15 | Qmdd97Gg3wapUpvbkHqxB1cMzTgm2NntauTiLuLHWd3Dt1 | Hallelujah - Leonard Cohen | Leonard Cohen / Leonard Cohen | PIANO2 | 6/8 | 57 | 0 | 4.83 (3) | 771 | unknown | hallelujah |
| 16 | QmPmjHdv6GhcNe7h31sNVm1vHKQC8DfteNMyn1jBhpJEch | CREEP de Radiohead | Radiohead / Arrgt : S. Hermand | PIANO2 | 4/4 | 35 | 0 | 4.73 (23) | 2966 | unknown | creep |
| 17 | QmaX4Pkqc1tDyVk7yy8Fkhq4nSjViaBfyLwA3rKuNKChiQ | Fix You by Coldplay | Coldplay / Words and Muisc byGUY BERRYMAN CHRIS MARTIN JON BUCKLAND & WILL CHAMPION | PIANO2 | 4/4 | 61 | 0 | 0.00 (0) | 13154 | unknown | fix you |
| 18 | QmdkybbcYoQvYXXmfRyryox5soKGquvQVkaHn2bVx6oBZ7 | The Scientist | Coldplay /  | PIANO2 | 4/4 | 36 | 0 | 0.00 (0) | 4648 | unknown | the scientist |
| 19 | QmdvVUSSkbAgJHckTLcewoeJrSQm3LrimVTF2YH7tReNwW | Mad World (simple arrangement) | Gary Jules / Gary Jules Michael Andrews | PIANO2 | 4/4 | 29 | 0 | 0.00 (0) | 1030 | unknown | mad world |
| 20 | QmNUahv3eDtDYj6pwcWKNXQ89UXRe5xfjT1L6MVCe8fvZP | The Scientist |  / Arranged by Letícia Rezende | PIANO2 | 4/4 | 83 | 0 | 0.00 (0) | 614 | unknown | the scientist |

### Terms with zero matches

hey jude, here comes the sun, tiny dancer, goodbye yellow brick road, don't stop me now, bohemian rhapsody, easy on me, fake plastic trees

Hits per term: let it be=21; hey jude=0; yesterday=4; something=5; while my guitar gently weeps=1; here comes the sun=0; your song=6; tiny dancer=0; rocket man=1; goodbye yellow brick road=0; piano man=8; vienna=16; she's always a woman=3; just the way you are=4; don't stop me now=0; somebody to love=2; bohemian rhapsody=0; love of my life=2; someone like you=4; easy on me=0; when we were young=1; the scientist=5; clocks=4; fix you=7; viva la vida=23; creep=12; karma police=1; no surprises=4; fake plastic trees=0; hallelujah=47; mad world=10; stand by me=31; imagine=19; lean on me=2; bridge over troubled water=1; a thousand miles=1; chasing cars=2; iris=2


## Lane J-rock

Goal: riff/ostinato; power-chord or fifth texture that survives reduction; arpeggio over pedal; register/density/build/drop; rock.8 (reduce 8-16 bars) and rock.9 (full arrangement) candidates

Hits: 52 rows pass the lane filters (52 before filters).

### Dumped scores

| CID | Title | Artist / composer | Shape | Meters | Bars | Chord symbols | Rating (n) | Views | Label | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| QmVcTJtm4y12CUByxJjVMnahC4YpxXGGzVJ1jLUwzj9hCt | Heart-Shaped Box (Advanced Piano Solo) | Nirvana / Composed by Kurt Cobain & Ramin DjawadiPiano arrangement by Nicolas Del GalloFull playthrough and more athttps://www.youtube.com/c/NDGmusicIf you want to donate please check out my Patreon âºhttps://www.patreon.com/ndg | PIANO2 | 4/4 | 64 | 0 | 4.92 (69) | 2226 | unknown | rank 1 top distinct song #1 |
| QmVsJV6oJeAC4MnbePt17zysoFrdyvs5PDokfM8NLxUhJs | Linkin Park - NUMB piano cover | Linkin Park / Linkin Parkarr. by Anatole Piano Songs | PIANO2 | 4/4 | 85 | 0 | 4.86 (12) | 1458 | unknown | rank 2 top distinct song #2 |
| Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf | Muse - Hysteria | Muse / Muse | PIANO2 | 4/4 | 83 | 0 | 4.74 (44) | 7075 | unknown | rank 3 top distinct song #3 |
| Qmcg2yJgkjwhewRFbb5hzpR1BNT1u5taVR3jfA2oASbQ3K | Starlight - C. S. Beatson | C. S. Beatson /  | PIANO2 | 4/2 | 16 | 0 | 0.00 (0) | 1 | unknown | rank 4 top distinct song #4 |
| QmaUdG7t1Z24QmJcohyMud9o6Lxfnh7Pz27cbLdMTo3Ajm | Smells Like Teen Spirit -The Gallows- | Nirvana / Kurt Cobain | PIANO2 | 4/4 | 65 | 0 | 4.63 (94) | 12441 | unknown | rank 5 top distinct song #5 |
| QmaxP2mCUy7TnpX55nhZZsVYe4n93Z9TzSsCgtFKc4KyzH | Comfortably Numb Piano Solo | Pink Floyd / Arr. Andrew Wrangell | PIANO2 | 4/4 | 52 | 0 | 4.55 (39) | 2423 | unknown | rank 6 top distinct song #6 |
| QmdGGr7gDBP2yosg6rvEBZhZE6T5ibDGCAX35YQFEvqrJ5 | Paint It Black (Advanced Piano Solo) | The Rolling Stones / Composed by The Rolling Stones & Ramin DjawadiPiano arrangement by Nicolas Del GalloFull playthrough and more athttps://www.youtube.com/c/NDGmusicIf you want to donate please check out my Patreon âºhttps://www.patreon.com/ndg | PIANO2 | 4/4,6/8,9/8,6/4,5/4 | 153 | 0 | 0.00 (0) | 531 | unknown | rank 8 top distinct song #7 |
| QmWQLEEEZtuRkzRLC5D951wXXVj6tToNth5C59bFVJiGga | Numb | Linkin Park /  | MIXED_PIANO2 | 4/4 | 84 | 85 | 4.78 (11) | 2831 | in-copyright | rank 9 extra shape |
| QmVWSZ3vAy8prRv14TRREdLLnXk14UqrYrc1HgeisMAqqe | my immortal in F voice & piano | Evanescence / David Hodges Amy Lee & Ben Moody | MIXED_PIANO2 | 4/4 | 48 | 65 | 0.00 (0) | 110 | unknown | rank 11 top distinct song #8 |
| QmdvHDt8aJcLBiY8ZmG7o5t9QDfmqDp9XhmqMquCL95knL | Starlight MUSE | Muse / Arr. Irene L?pez | MIXED_PIANO2 | 4/4 | 118 | 0 | 4.79 (21) | 5017 | unknown | rank 12 extra shape |
| QmSwE96nL8TCeEWcQxscpMdokPhncLkWEsmeL9BymCVSqk | Heart shaped box - Drum score | Nirvana /  | PIANO1 | 4/4 | 63 | 0 | 4.28 (4) | 528 | unknown | rank 23 extra shape |

### Next 10 ranked, undumped

| Rank | CID | Title | Artist / composer | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 7 | QmTzWWHsPTNhYHLDFopKjbwNcKCab8GHjh6VyVyQkZQKoY | Linkin Park Numb | Linkin Park /  | PIANO2 | 4/4 | 77 | 0 | 4.46 (25) | 11164 | in-copyright | numb |
| 10 | QmSJzEuFNj2EzEMDpZLsNPQ4EEBe44yykhk6rTNqGbfVpm | Numb |  / Linkin Park | MIXED_PIANO2 | 4/4 | 84 | 76 | 0.00 (0) | 177 | in-copyright | numb |
| 13 | QmUZdYocuapo9pjAs7Qbb5JSfhZHyp24Rbm9oZGnWWWq74 | Come As You Are |  / Nirvana | MIXED_PIANO2 | 4/4 | 26 | 0 | 0.00 (0) | 319 | unknown | come as you are |
| 14 | Qmejf6PLC2wVE2ddPfQV4y76EpkfvFCBCxuRmpniiY4L7v | Starlight | henrys20008181 /  | MIXED_PIANO2 | 6/4 | 35 | 0 | 0.00 (0) | 33 | unknown | starlight |
| 15 | QmXQNZvfM491cT1Xxn4AK3s2Vgvjn4CEtCtWNUCPQmKoi2 | Muse - New Born | Muse / Muse | MIXED_PIANO2 | 4/4 | 212 | 0 | 4.85 (4) | 690 | unknown | new born |
| 16 | QmYXmyZyGp2FUzjDvVF1zRT4eVcA2XrvSUq543cQW4wY3C | aloha line 2020 | Foo Fighters /  | MIXED_PIANO2 | 3/4,2/4,4/4 | 168 | 0 | 0.00 (0) | 84 | unknown | everlong |
| 17 | QmdZQWD9WQx3SsPNN6yecCKFm4TFsSvGsUE3Gr8yXzh9tq | Starlight | Elizabeth Kyriakides / Elizabeth Kyriakides | MIXED_PIANO2 | 4/4 | 150 | 0 | 0.00 (0) | 39 | unknown | starlight |
| 18 | QmRTYFZ2SkBWbqwDpAqfCsZiou1KGVUVAogH1dg7z7RUNG | Starlight - Muse | Muse / Muse | MIXED_PIANO2 | 4/4 | 135 | 0 | 4.37 (5) | 21877 | unknown | starlight |
| 19 | QmWUQJBDFEQ9xHjGPWqEn6goguxFEbtu72QvM4FKnQEVWF | The Pretender | Foo Fighters / Foo Fighters | PIANO1 | 4/4,2/4 | 119 | 0 | 4.71 (4) | 399 | unknown | the pretender |
| 20 | QmbMbvEkkzvJwKsSXfKHcufXFGv8y87GxcVgz9GRCKEEcb | Another Brick in the Wall | Pink Floyd / Pink Floyd | PIANO1 | 4/4 | 52 | 0 | 0.00 (0) | 5661 | unknown | another brick in the wall |

### Terms with zero matches

day tripper, helter skelter, gimme shelter, whole lotta love, time pink floyd, we will rock you, another one bites the dust, uprising, time is running out, in the end

Hits per term: come together=1; day tripper=0; helter skelter=0; paint it black=3; gimme shelter=0; satisfaction=1; stairway to heaven=1; kashmir=1; whole lotta love=0; comfortably numb=2; wish you were here=3; another brick in the wall=2; time pink floyd=0; we will rock you=0; another one bites the dust=0; uprising=0; starlight=6; time is running out=0; hysteria=3; new born=1; paranoid android=2; smells like teen spirit=6; come as you are=3; heart-shaped box=3; heart shaped box=3; everlong=3; the pretender=3; numb=6; in the end=0; bring me to life=1; my immortal=1


## Lane K-metal

Goal: pedal-tone riffs; octave/fifth riff reduction; repeated-note ostinato; syncopated chord attacks; odd meter or meter change; acoustic/ballad to heavy build; multi-section song for reduction decisions; full-arrangement capstone

Hits: 52 rows pass the lane filters (52 before filters).

### Dumped scores

| CID | Title | Artist / composer | Shape | Meters | Bars | Chord symbols | Rating (n) | Views | Label | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| QmS4UQ3cPqnpBJ2PiBZ5Z79Ky4dg4HEmfSfoJ4D6utRx2g | Iron man - Black Sabbath | Black Sabbath /  | LEADSHEET | 4/4,2/4 | 54 | 121 | 0.00 (0) | 3 | unknown | rank 1 top distinct song #1 |
| QmeuoFT1hEJntEUswkFFoJ8UisTFHhjNiW236bsUeiAG7X | Lonely Day | System of a Down / Arranged by Sofía Matus Cancino | PIANO2 | 6/8 | 103 | 0 | 4.75 (9) | 314 | unknown | rank 2 top distinct song #2 |
| QmYMwuVDWaUifsjW8KyvZeBoAtwZ7dtSZh5yaTaWsNfFin | Nightmare | anni.brauer / Anne Brauer | PIANO2 | 4/4 | 55 | 0 | 0.00 (0) | 183 | unknown | rank 3 top distinct song #3 |
| QmQwsDxpo5oPDKycteKCuXikrdpLrjiiDNfxBFVfw53vPo | Orion SSAA | Kenshi Yonezu (ç³æ çå) / arr. by Kileen McLeary | PIANO2 | 4/4 | 111 | 0 | 0.00 (0) | 83 | unknown | rank 4 top distinct song #4 |
| QmPkrozso5t5EUhqZ8K4xKe7TZLjQo1RamqE9CgboAoXXb | HARVEST (Tours) - Berthold Tours | Berthold Tours /  | PIANO2 | 4/4,3/4,1/4 | 27 | 0 | 0.00 (0) | 8 | unknown | rank 5 top distinct song #5 |
| QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo | Enter Sandman | Metallica / MetallicaArr: Anders Thue | PIANO2 | 4/4 | 148 | 0 | 4.88 (90) | 4507 | unknown | rank 8 top distinct song #6 |
| QmcnNkzxpxU5Jvop8JEFcWLa8P13G1e36KDBsFD3zsN9bV | Harvest - Hai to Gensou no Grimgar ED | Misc Cartoons / Composed by: (K)NoW_NAME | PIANO2 | 4/4 | 123 | 0 | 4.66 (6) | 1432 | unknown | rank 10 top distinct song #7 |
| QmQJ2eRNfiiXG6kZQ6dFKMAG8WogkNcyZZker6MzGoS6vu | Nightmare | Emily Prout Music / Emily Prout | MIXED_PIANO2 | 4/4 | 99 | 0 | 0.00 (0) | 23 | unknown | rank 13 extra shape |
| QmcDe6Ug446hYUiKjrAuFJhxc7nD4FiDVcREc5aWbWCojr | HARVEST | Misc tunes /  | PIANO1 | 2/4 | 32 | 0 | 0.00 (0) | 2 | unknown | rank 18 extra shape |

- NOT dumped: QmXFHNzdRue8ptGgsQgBvoFiseKUSmik3FNZpV5w15fAtv (rank 11 top distinct song #8): skipped: XML 6.6 MB over 3 MB

### Next 10 ranked, undumped

| Rank | CID | Title | Artist / composer | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 6 | Qmbhy7Ew2Bavm1yvDZP9PU75PvPvFifoCEy9fz7ixhx2hC | HARVEST (Seward) - Theodore F. Seward | Theodore F. Seward /  | PIANO2 | 6/8,7/4 | 24 | 0 | 0.00 (0) | 4 | unknown | harvest |
| 7 | QmZK3uU7JuHLE7oaKJEMysg1W8GQoYeEAF7i8q8mFzRK9k | HARVEST (Menthal) - R. Menthal | R. Menthal /  | PIANO2 | 4/4 | 24 | 0 | 0.00 (0) | 2 | unknown | harvest |
| 9 | QmQRDDdWfrNJHtx6mTnN5YMb5hSBaTb9nRf7bdANpvw6i8 | HARVEST (Frost) | Misc Traditional / Charles Joseph Frost 1889 | PIANO2 | 4/4 | 12 | 0 | 0.00 (0) | 1 | unknown | harvest |
| 11 | QmXFHNzdRue8ptGgsQgBvoFiseKUSmik3FNZpV5w15fAtv | Fear of the Dark | Iron Maiden / Iron Maiden | MIXED_PIANO2 | 4/4,2/4 | 176 | 57 | 4.82 (19) | 1482 | unknown | fear of the dark |
| 12 | QmVEitoYcGGs3WPRCkTdygEEtgdytbP7iSDuAwkAipg9wi | Hallowed_be_thy_Name | Iron Maiden / Iron Maiden | MIXED_PIANO2 | 4/4 | 204 | 185 | 4.79 (7) | 323 | unknown | hallowed be thy name |
| 14 | QmbwnWBK5FE51CVpqjZ4fSQW87SX1MNzehooGRbNPDrkfm | A Little Piece Of Heaven Avenged Sevenfold Patrick Ceelen | Avenged Sevenfold / Arranged By Patrick Ceelen | MIXED_PIANO2 | 4/4,2/4,6/4,3/4,5/4 | 206 | 0 | 0.00 (0) | 292 | unknown | a little piece of heaven |
| 15 | QmXD2aZpJZY27ZJjxsS69dysWp9FtvouuQymLi1ibBDTY9 | Dream Theater: Pull Me Under | Dream Theater / Dream Theater | PIANO1 | 4/4 | 32 | 0 | 4.81 (8) | 1885 | unknown | pull me under |
| 16 | QmT2eMmmeyDgMWYuf9SABYbo3V7g5zdMAPznsULbp6mw9d | The Trooper | Misc tunes /  | PIANO1 | 6/8 | 18 | 0 | 0.00 (0) | 4 | unknown | the trooper |
| 17 | QmeQiFPTNQJqhinGSjSfwCyCeJstpusYaXDQfSvEMaWjsH | The Trooper | Misc tunes /  | PIANO1 | 6/8 | 20 | 0 | 0.00 (0) | 4 | unknown | the trooper |
| 19 | Qmc2BawopkxrFy6ekhYKAB8qzukZn4pxFpcefQfQ7X8tP6 | Metallica - One | Metallica / transcribed from Drumeo | PIANO1 | 4/4,2/4,3/4,6/4 | 198 | 0 | 0.00 (0) | 3427 | unknown | one |

### Terms with zero matches

seize the day, so far away, buried alive, bat country, aerials, chop suey, another day, the spirit carries on, war pigs, snuff, vermilion, windowpane, nemo, metal piano, metallica piano, avenged sevenfold piano, rock piano arrangement, metal piano arrangement, progressive metal, power metal, symphonic metal

Hits per term: nothing else matters=1; fade to black=2; master of puppets=4; enter sandman=2; the unforgiven=1; orion=1; seize the day=0; so far away=0; buried alive=0; nightmare=2; hail to the king=2; afterlife=1; a little piece of heaven=1; bat country=0; aerials=0; toxicity=3; chop suey=0; lonely day=1; another day=0; pull me under=1; the spirit carries on=0; fear of the dark=2; the trooper=8; hallowed be thy name=1; iron man=2; paranoid=2; war pigs=0; snuff=0; vermilion=0; windowpane=0; harvest=7; nemo=0; sleeping sun=1; ghost love score=1; can you feel my heart=1; drown=1; metal piano=0; metallica piano=0; avenged sevenfold piano=0; rock piano arrangement=0; metal piano arrangement=0; progressive metal=0; power metal=0; symphonic metal=0; one=4


## Lane L-artists

Goal: personal-library expansion by artist; top 20 distinct songs per artist; flag personal-library wins even when no rung needs them

### Avenged Sevenfold: 4 rows, 4 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | A Little Piece Of Heaven Avenged Sevenfold Patrick Ceelen | QmbwnWBK5FE51CVpqjZ4fSQW87SX1MNzehooGRbNPDrkfm | 1 | MIXED_PIANO2 | 4/4,2/4,6/4,3/4,5/4 | 206 | 0 | 0.00 (0) | 292 | unknown | no |
| 2 | Avenged Sevenfold - Almost Easy | QmSc3G9zSwyGhYXksJCyGQLJBpGfKYC248hC2nTdrySSD6 | 1 | PIANO1 | 2/4,4/4,3/4 | 198 | 0 | 4.90 (8) | 862 | in-copyright | yes |
| 3 | Shepherd of Fire - Brass Ensemble | Qmcw7Z3fDFBJg2xxLRPAZt5HjVzG6hyS8jNuoxf4A3ZRRR | 1 | OTHER | 4/4 | 68 | 0 | 0.00 (0) | 3129 | unknown | no |
| 4 | Chapter Four | QmcgPQjWHv1eeNRwJEPxKu1gYkrV7UNM5mqiXkbqBCvRqw | 1 | OTHER | 4/4,3/4 | 126 | 0 | 0.00 (0) | 184 | in-copyright | no |

### Metallica: 15 rows, 11 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Enter Sandman | QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo | 2 | PIANO2 | 4/4 | 148 | 0 | 4.88 (90) | 4507 | unknown | yes |
| 2 | for whom the bell tolls | Qmecq9RSLpMfuaEajmskZq9ueZGk97qvmdx78JFWNSuiRD | 1 | MIXED_PIANO2 | 4/4 | 132 | 0 | 4.83 (3) | 272 | unknown | yes |
| 3 | Metallica - One | Qmc2BawopkxrFy6ekhYKAB8qzukZn4pxFpcefQfQ7X8tP6 | 1 | PIANO1 | 4/4,2/4,3/4,6/4 | 198 | 0 | 0.00 (0) | 3427 | unknown | yes |
| 4 | Trough The Never: Metallica | QmYKpXdLhNEmuSxT9zkkmMNDuVSGRyT2bie6J9fhmiPcdn | 1 | PIANO1 | 4/4,6/4,3/4 | 167 | 0 | 0.00 (0) | 101 | unknown | yes |
| 5 | Master of Puppets: Metallica | QmZZoMtA54kgni7gFcrBDdSsm1TGMuE1FzomzFbuGfP7Lq | 3 | PIANO1 | 4/4,5/8,2/4 | 267 | 0 | 4.61 (20) | 5658 | unknown | yes |
| 6 | The Unforgiven_Mandolin | QmXHs14JL6Y8gZ8sSGwKjaqYexHqTWxD7AtrH8kMBqJ5Yx | 1 | OTHER | 4/4,2/4 | 70 | 20 | 4.66 (6) | 233 | unknown | no |
| 7 | Unforgiven - Fingerstyle cover | QmcN25LVZE8V2p9Mku4fYetGpQJFzYYk7FWyBYZAKnY4xX | 1 | OTHER | 4/4 | 80 | 0 | 4.84 (10) | 866 | unknown | no |
| 8 | mama said | QmQPuXwbt6F6HseGd2kcFfaN6orUm32G7rqGNER1CGbc8T | 1 | OTHER | 4/4,5/4,3/4 | 89 | 0 | 0.00 (0) | 223 | unknown | no |
| 9 | Linus And Lucy | QmX8ex4XBQ3nJR1EbzYXaiM1nSk9AkefzySq6kBgNLKgSc | 1 | OTHER | 4/4 | 39 | 0 | 4.66 (3) | 172 | unknown | no |
| 10 | Metallica Nothing Else Matters | QmQRLbcCwjmGDt5RLpLEvJy82Bs85MsRPE86FSxzQYLP1H | 1 | OTHER | 6/8,9/8 | 150 | 0 | 4.79 (70) | 6363 | unknown | no |
| 11 | Fade to Black - Concert Band Arrangement | QmSoCAJVo3tBk8AZDZWo2cThifqS2G4sJo4RC2EX1hCH6R | 2 | OTHER | 4/4 | 219 | 0 | 0.00 (0) | 250 | unknown | no |

### Muse: 35 rows, 26 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Space Dementia | QmZ3vfJw1vS5Me9KDoUYSm7RYU4FYSAwioiFHbtogRihgd | 1 | PIANO2 | 4/4,6/8 | 74 | 69 | 4.82 (75) | 11270 | unknown | yes |
| 2 | Screenager | QmPJdhKPHYYoLPspsFtYoFX8nzZUkyAuw85Rm7bhmptBub | 1 | PIANO2 | 4/4 | 41 | 30 | 4.88 (6) | 399 | unknown | yes |
| 3 | Hoodoo (Live piano) | QmQGS6WCqjnbvLW5G3HrsBhLhYxyeziMnw2YM1NXx6STUw | 1 | PIANO2 | 12/8,6/8,2/4,3/4 | 52 | 0 | 4.81 (8) | 939 | unknown | yes |
| 4 | Muse - Hysteria | Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf | 3 | PIANO2 | 4/4 | 83 | 0 | 4.74 (44) | 7075 | unknown | yes |
| 5 | Ruled by Secrecy | QmeprydoERiDt7yuEAeGaffavEp97wAPER2AMJwsKXBr5s | 1 | PIANO2 | 6/8 | 72 | 0 | 0.00 (0) | 230 | unknown | yes |
| 6 | Muse Of Poetry (Erato) Fischer Johann Kaspar Ferdinand | QmPzbknqkv7S6dp3fcZVw3JLztdMA8tFw8qttHdtQd5vCg | 1 | PIANO2 | 4/4 | 30 | 0 | 0.00 (0) | 48 | unknown | yes |
| 7 | Isolated System | QmNkxhgWU4SD1SgRWCjvWLdixkCV4YVgt2wP4F8wNACmri | 1 | PIANO2 | 4/4 | 148 | 0 | 4.92 (10) | 27223 | unknown | yes |
| 8 | Apocalypse Please | QmfVhjHh1mgJwF5jKSEZW822CqwhLUDy115Cjx6xRR2NFX | 1 | MIXED_PIANO2 | 4/4 | 41 | 39 | 4.81 (13) | 1115 | unknown | yes |
| 9 | Starlight MUSE | QmdvHDt8aJcLBiY8ZmG7o5t9QDfmqDp9XhmqMquCL95knL | 2 | MIXED_PIANO2 | 4/4 | 118 | 0 | 4.79 (21) | 5017 | unknown | no |
| 10 | SUPREMACY | QmXuhLVT8ZPAEbpFCvMsAtiRxXeX3hYgE6UnG59PV1h8ku | 2 | MIXED_PIANO2 | 3/4,4/4 | 120 | 0 | 0.00 (0) | 1139 | unknown | no |
| 11 | Madness lot tune | QmSZ3yGLHAKDLLggzmT7wMTubpe9bsd6Qdpwo4kqxij4FP | 1 | MIXED_PIANO2 | 4/4,5/4 | 32 | 0 | 0.00 (0) | 304 | unknown | no |
| 12 | Feeling Good - Muse | QmWEykmJwDqK5c2xxWmgksYEE3LoD31P3ia7j1WABo1QrT | 2 | MIXED_PIANO2 | 6/8 | 89 | 0 | 0.00 (0) | 185 | unknown | no |
| 13 | Exogenesis: Symphony Part 3 (Redemption) | QmYP6EiWpzDazG7RCNGHv9Au8JD3hPGGbL8xBqYaB25Ek9 | 1 | MIXED_PIANO2 | 12/8 | 57 | 0 | 4.68 (16) | 714 | unknown | no |
| 14 | We Shall Be Known | QmdN2Ar4g4Gpuz3BY4nkpGYByEJZKR8YYfn1eJLRChZE3c | 1 | MIXED_PIANO2 | 4/4 | 22 | 0 | 4.15 (10) | 937 | unknown | no |
| 15 | Muse - New Born | QmXQNZvfM491cT1Xxn4AK3s2Vgvjn4CEtCtWNUCPQmKoi2 | 1 | MIXED_PIANO2 | 4/4 | 212 | 0 | 4.85 (4) | 690 | unknown | no |
| 16 | Muse - Feeling Good (g-Moll) bass and drums | QmYNycfevEUJtDK2Ux7qE3xsEKkc2kQ9XGCozJxA4q9sGM | 1 | OTHER | 12/8 | 10 | 12 | 0.00 (0) | 561 | unknown | no |
| 17 | Resistance Muse | QmVq4DMmHUpAtfpWkLXciP1bfjPUfZwwqrWihTUMHvm8uF | 3 | OTHER | 4/4 | 119 | 0 | 0.00 (0) | 4241 | unknown | no |
| 18 | Muscle Museum | QmR2RdWeD4UubpU45DtMo5pRBw4Nf6337vce7inePVgJJS | 1 | OTHER | 4/4 | 37 | 0 | 0.00 (0) | 448 | unknown | no |
| 19 | The Dark Side | QmT6sdjqkXRLhmf8KbXKS94S9eEwUEyuwZWhCk4JLboWQ9 | 1 | OTHER | 4/4 | 94 | 0 | 0.00 (0) | 310 | unknown | no |
| 20 | Panic Station | QmUnAsfiGnXhKeDo8DHE5efenPTxjvMYASPkDzaRmCZV1a | 1 | OTHER | 4/4 | 80 | 0 | 0.00 (0) | 95 | unknown | no |

### Radiohead: 24 rows, 12 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Exit Music For a Film (Advanced Piano Solo) | QmTe1Rkt8SBN7667PiUhD3FVaEGQDALGPY9Ur115aYGXyL | 1 | PIANO2 | 4/4,6/4,2/4 | 66 | 0 | 4.91 (185) | 10671 | unknown | yes |
| 2 | No Surprises | QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M | 4 | PIANO2 | 4/4 | 71 | 0 | 4.83 (33) | 1613 | unknown | yes |
| 3 | Daydreaming - Radiohead | QmQ2jgSxs7WtLpWYNhkUsRTkgvXA2q4BPSW48XsnY83N3Q | 1 | PIANO2 | 6/8,4/4 | 64 | 0 | 4.87 (13) | 1210 | unknown | yes |
| 4 | CREEP de Radiohead | QmPmjHdv6GhcNe7h31sNVm1vHKQC8DfteNMyn1jBhpJEch | 9 | PIANO2 | 4/4 | 35 | 0 | 4.73 (23) | 2966 | unknown | yes |
| 5 | Radiohead - Just | Qmao4xFiZU1ExAbaDyfxxG1pWjrutLs23dgSRgaQwLeMoM | 1 | PIANO2 | 4/4 | 70 | 0 | 4.71 (53) | 2716 | unknown | no |
| 6 | Like Spinning Plates (Live Version) | QmZcS9NvEHEyVH5wP1Y4R2cu8AxZ7jqf75Zx9MgmgSPz3d | 1 | MIXED_PIANO2 | 4/4 | 85 | 0 | 4.94 (14) | 1093 | unknown | no |
| 7 | Radiohead - Codex (For Piano/Voice/Duo Trumpet) | QmQJ1UAFAArbsF9U8fSUN3ndybG9DEvdnvnAYMUkcHzFcN | 1 | MIXED_PIANO2 | 4/4,5/4 | 40 | 0 | 4.80 (17) | 1090 | unknown | no |
| 8 | High And Dry Bass | QmWoGviXfXz7tn4eEi4hk3P6652oGjvpYdKSPs2Hh831pS | 1 | PIANO1 | 4/4 | 93 | 0 | 0.00 (0) | 664 | unknown | no |
| 9 | Karma Police | Qmeq6Qkqd2n8fEEdHEZziKY6Nin9osXFxUcvGMYvp3jWDk | 1 | OTHER | 4/4 | 48 | 105 | 0.00 (0) | 2480 | unknown | no |
| 10 | Paranoid Android - Percussion Ensemble | QmeKJv9JsEAxPG43TgRsihkv2HwH8mU17QzEkPv5r5vTXk | 2 | OTHER | 4/4,7/8 | 88 | 0 | 4.71 (18) | 3619 | unknown | no |
| 11 | Radiohead - You (Front Ensemble Arrangement) | QmaA1RDrdz5fgdWyLJMYWT3N5LJzW9z99UUwHy4MJsAGej | 1 | OTHER | 6/8,5/8 | 61 | 0 | 4.55 (6) | 2566 | unknown | no |
| 12 | Motion Picture Soundtrack (Radiohead song) String Duet | QmT3jaVfEvfZg5NZJ3WLZdaC6ExsM4oiDM5EkwDr1rKjSd | 1 | OTHER | 4/4 | 35 | 0 | 4.50 (11) | 2911 | unknown | no |

### Pink Floyd: 33 rows, 28 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Cluster One | QmRABab4S21y1kSwm5pRfJynAZbSmwWpHs6hzZCbjT7Whp | 1 | PIANO2 | 4/4 | 92 | 22 | 4.83 (9) | 717 | unknown | yes |
| 2 | Anisina | QmcNFWCZBCoWFj7gpfjv7qJBJYX58j3SBrh9ruMBreDsg4 | 1 | PIANO2 | 4/4 | 53 | 41 | 4.87 (5) | 196 | unknown | yes |
| 3 | Autumn '68 | QmPXA4DmNdZ9i57iNvMXuggjaPjfuAU5L3NQTS3FpyTbsb | 1 | PIANO2 | 4/4 | 24 | 16 | 4.83 (3) | 264 | unknown | yes |
| 4 | Things Left Unsaid | QmQnnagVBhXDRu8vs6JEc59iP52cs1BGCdrWEnaRZie71Q | 1 | PIANO2 | 9/8,4/4 | 56 | 8 | 0.00 (0) | 703 | unknown | yes |
| 5 | Ebb and Flow | QmdBXQB9oCjzaNTAbkkwWRnzvx9TjcFeFDKtRFaQUwPium | 1 | PIANO2 | 4/4 | 24 | 4 | 0.00 (0) | 204 | unknown | no |
| 6 | Calling | Qme1x2vjMaYGAYmiQmzP92PogMHHQfSuA2DQX9LSAZALkV | 1 | PIANO2 | 4/4,2/4 | 39 | 11 | 0.00 (0) | 134 | unknown | no |
| 7 | Talkin' Hawkin' | QmZiLTrf1nhMaWv7Kbxs3YbSpd4cmccemTETuiTX4BhztJ | 1 | PIANO2 | 3/4 | 77 | 65 | 0.00 (0) | 99 | unknown | no |
| 8 | On Noodle Street | QmQW5WwGUMZcCaqfEYDFX2vi88bbi3dR7rJfiYpGKXARvq | 1 | PIANO2 | 4/4 | 44 | 83 | 0.00 (0) | 80 | unknown | no |
| 9 | Night Light | QmYz4R8uDf1Y2TeETG5TqB8aBXpY2CW5LTEbZdQLFo6P5i | 1 | PIANO2 | 4/4 | 36 | 10 | 0.00 (0) | 70 | unknown | no |
| 10 | The Lost Art of Conversation | QmYq5mGRU9Ad988BRnQ8xMJ4cKDB5G82EarHo1x81aZAmC | 1 | PIANO2 | 4/4 | 24 | 15 | 0.00 (0) | 59 | unknown | no |
| 11 | Allons-y 1 | QmcobYbcpmPHAjeKffgtGiKFW6Dd7E5494vKhYTAMK2T4Z | 1 | PIANO2 | 4/4 | 54 | 40 | 0.00 (0) | 51 | unknown | no |
| 12 | Unsung | QmerxRCze13bpAQgBa91wz2HtKfjiUPp3HJJnSm8h3eFsk | 1 | PIANO2 | 4/4 | 21 | 4 | 0.00 (0) | 49 | unknown | no |
| 13 | Allons-y 2 | QmZNT3hgiqJHZMhqoQdMZ3WbDe8hC3bzSqHh1fUyepRH28 | 1 | PIANO2 | 4/4 | 33 | 29 | 4.49 (3) | 70 | unknown | no |
| 14 | Eyes To Pearls | Qmax1R3ziiH2kdmeXPLDxeXTwVRmaKgv14dxUcmHviMTh8 | 1 | PIANO2 | 4/4 | 40 | 4 | 4.37 (5) | 141 | unknown | no |
| 15 | Sorrow | QmcXmbvTPSQ1B4ky6bxLzH14dJ2KCwGGvYkAsAxn3oPmmm | 1 | PIANO2 | 4/4 | 188 | 110 | 4.72 (8) | 860 | unknown | no |
| 16 | It's What We Do | QmTk6qsJ7A7GmD5uqx7wTAE6oWdVGXwU2n3mzD41fzo2Ca | 1 | PIANO2 | 6/8 | 146 | 26 | 4.49 (3) | 132 | unknown | no |
| 17 | Westworld - Brain Damage (S3E8) piano arrangement | QmbsWAxFRy7SpnWXohF5YQVigCbqxWdiqbdYw1pukN2yXK | 1 | PIANO2 | 4/4,3/4 | 61 | 0 | 4.76 (26) | 2388 | unknown | no |
| 18 | Comfortably Numb Piano Solo | QmaxP2mCUy7TnpX55nhZZsVYe4n93Z9TzSsCgtFKc4KyzH | 2 | PIANO2 | 4/4 | 52 | 0 | 4.55 (39) | 2423 | unknown | no |
| 19 | Another brick in the wall part II | QmfCEipLWT1XyGy7LxKcE4UG1JCTqgB1iWFYgmxq9CrZbj | 1 | MIXED_PIANO2 | 4/4 | 55 | 32 | 4.44 (6) | 2298 | unknown | no |
| 20 | Keep Talking | QmWhnsDnrYbdsywhdXH3ywgozZsL5LVvu5hq4fgdhtkWW4 | 1 | MIXED_PIANO2 | 4/4 | 146 | 44 | 4.79 (7) | 239 | unknown | no |

### Led Zeppelin: 1 rows, 1 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Starway to heaven flutes | QmQ2ChWxgnvhbHpQEkLfzXFF9RizSjB3Jqyk49nYwBj8hS | 1 | OTHER | 4/4 | 30 | 0 | 4.46 (47) | 3304 | unknown | no |

### Queen: 14 rows, 11 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Aloha oe | QmZ2XRr489YtJVYSs5HUV8G89nKjqXbMUUh6o9eZhc5n51 | 3 | LEADSHEET | 4/4 | 18 | 19 | 0.00 (0) | 39 | unknown | yes |
| 2 | Hes coming soon - Queen Liliuokalani | QmP5sBPMPWDzBMixZdbPM9edRAoEqK6UC9dKCRNAHTPW5f | 1 | PIANO2 | 4/4 | 18 | 0 | 4.83 (3) | 223 | unknown | yes |
| 3 | Ode To A Pumpkin I Grew | QmdyRM78Vwe2k96mHJjhaLoYwcsVPgdqNg6WjEQBFYG77A | 1 | PIANO2 | 4/4 | 16 | 0 | 0.00 (0) | 413 | unknown | yes |
| 4 | Go and tell - Queen Liliuokalani | QmQYDH4PL6BQtmnAmpBxK6fJ9Z5PRGj1BTQD9aFYJhQtkd | 1 | PIANO2 | 4/4 | 18 | 0 | 0.00 (0) | 42 | unknown | yes |
| 5 | He lives on high - Queen Liliuokalani | QmTkYK2jCYi8KyZCQF9QedXMMGXK7aDYNX8DYy92UpJUSk | 1 | PIANO2 | 4/4 | 18 | 0 | 0.00 (0) | 34 | unknown | no |
| 6 | Susan | QmQSzRoNVt9CE3ftXNNMfC11gkKC22bbyc93Ew9s6ALcM1 | 2 | PIANO1 | 3/4 | 32 | 0 | 0.00 (0) | 8 | pd | no |
| 7 | England's Lamentation... HA.107 | QmSSnNWkDdvDUoEMxzW8BP7wjqgn2PxuJWtvzTysdZAujU | 1 | PIANO1 | 3/4 | 28 | 0 | 0.00 (0) | 8 | unknown | no |
| 8 | See see the shepherds' Queen - Thomas Tomkins | QmNXmdbCYEWfc9efcmZw59hWVWocqjLBuG4J5wnhHtR78D | 1 | OTHER | 2/2 | 96 | 0 | 0.00 (0) | 52 | unknown | no |
| 9 | God Bless You Merry Gentlemen - Tidings of Comfort and Joy as found in The overthrow of proud Holofernes and the Triumph of virtuous Queen Judith the Halliwell Collection of Broadsides No. 263 Chetham Library. | QmZdu67Y3hKzkrQRhSRZA9WRC323igMwZsjf4eTKAfZ1c1 | 1 | OTHER | 2/2 | 19 | 0 | 0.00 (0) | 42 | unknown | no |
| 10 | JHHS 2019 - Queen | QmQD7k97yn1mvGEfRpaWhwnuPj4CWcxGcF5fk49Aun28Uj | 1 | OTHER | 4/4,3/4,2/4,6/8 | 292 | 0 | 0.00 (0) | 206 | unknown | no |
| 11 | BoRap STL Mashup | QmSTBuiWdvVuhqxijXyifBsvDD5WX4vRmPjCRDY6u3jTt1 | 1 | OTHER | 5/4,4/4,2/4,3/4,12/8,6/8 | 140 | 0 | 0.00 (0) | 116 | unknown | no |

### Evanescence: 5 rows, 5 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Breathe no more EVANESCENCE | QmWKA8j5XNeR2negDESQyEkDc6M7hpu6ADou6GRHKRKRfb | 1 | PIANO2 | 4/4 | 90 | 0 | 4.78 (11) | 1721 | unknown | yes |
| 2 | my immortal in F voice & piano | QmVWSZ3vAy8prRv14TRREdLLnXk14UqrYrc1HgeisMAqqe | 1 | MIXED_PIANO2 | 4/4 | 48 | 65 | 0.00 (0) | 110 | unknown | yes |
| 3 | Lacrymosa SAB + Full Band | QmTTjukRKRWvhqR5CoNiFXm1uZrcSCVrGoRua4NF5dSUYv | 1 | MIXED_PIANO2 | 3/4,4/4 | 130 | 0 | 4.88 (6) | 281 | unknown | yes |
| 4 | Everybody's Fool - Evanescence | QmQaRBBTZpAsfaLHQVb28qJZb1QhWDrY6g3oF2taJpcZUQ | 1 | PIANO1 | 4/4 | 66 | 0 | 4.56 (4) | 1837 | unknown | yes |
| 5 | Bring me to life | Qmf2LPSpTHXPH7R8UXzWX6dUqtZyucE7t23wyDRQKFetzN | 1 | OTHER | 4/4 | 79 | 0 | 0.00 (0) | 2330 | unknown | no |

### System of a Down: 3 rows, 3 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Lonely Day | QmeuoFT1hEJntEUswkFFoJ8UisTFHhjNiW236bsUeiAG7X | 1 | PIANO2 | 6/8 | 103 | 0 | 4.75 (9) | 314 | unknown | yes |
| 2 | Hypnotize | QmUF29MkGVEtuy9EUPXYZKC7S123bircT6W2zJkhhW8e9C | 1 | PIANO2 | 4/4 | 136 | 0 | 0.00 (0) | 139 | unknown | yes |
| 3 | Toxicity - by System of a Down for Pep Band | QmQcW511ZeWiRToMi9u7YgFVfsTPqh1F3ujXxS1xieWDEE | 1 | OTHER | 6/8 | 96 | 0 | 0.00 (0) | 211 | unknown | no |

### Dream Theater: 4 rows, 4 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Dream Theater - Disappear | QmbHZSWPLhqk5eU4ErBJNFmYdyFjHggpdCAd2ymqzSitFH | 1 | PIANO2 | 5/4,6/4 | 125 | 0 | 4.73 (12) | 10887 | unknown | yes |
| 2 | Wait for Sleep | QmX6C6SSN9pgaG7S9i39dU2aNoG12updXDxWjFfA3u3h8x | 1 | MIXED_PIANO2 | 5/8,4/8,6/8,12/8 | 115 | 0 | 4.81 (45) | 4175 | unknown | yes |
| 3 | Puppies On Acid - A Tribute To Dream Theater | QmYNGxDPP2QiqUoEVXopowEX5F6p1FHDWEGKY8zeqSytHJ | 1 | MIXED_PIANO2 | 4/4,3/4 | 169 | 0 | 0.00 (0) | 110 | unknown | no |
| 4 | Dream Theater: Pull Me Under | QmXD2aZpJZY27ZJjxsS69dysWp9FtvouuQymLi1ibBDTY9 | 1 | PIANO1 | 4/4 | 32 | 0 | 4.81 (8) | 1885 | unknown | yes |

### Iron Maiden: 7 rows, 6 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Fear of the Dark | QmXFHNzdRue8ptGgsQgBvoFiseKUSmik3FNZpV5w15fAtv | 1 | MIXED_PIANO2 | 4/4,2/4 | 176 | 57 | 4.82 (19) | 1482 | unknown | no |
| 2 | Hallowed_be_thy_Name | QmVEitoYcGGs3WPRCkTdygEEtgdytbP7iSDuAwkAipg9wi | 1 | MIXED_PIANO2 | 4/4 | 204 | 185 | 4.79 (7) | 323 | unknown | no |
| 3 | Virus | QmZLmx4e4iS7fXab9qDW1XQkTGhkHDryn36t7g8pYfhZVv | 1 | MIXED_PIANO2 | 4/4,9/8 | 173 | 0 | 0.00 (0) | 3693 | unknown | yes |
| 4 | The_Trooper | QmbBjkHNUxSYHARLNVRxC6s35gCq5BmPu5RH6zzafmAkxF | 2 | OTHER | 4/4 | 100 | 0 | 0.00 (0) | 64 | unknown | no |
| 5 | Iron Maiden | QmTeQfrLFtjEXhgTwFNhvMjXSPk18gY5cNVkpomwfptVsZ | 1 | OTHER | 6/8,7/8,3/8 | 328 | 0 | 0.00 (0) | 205 | unknown | no |
| 6 | Dream of mirrors | QmPEPRG2hq7SLnMpRRQbVdYKnf3KnciHVW7U7CBddgitPs | 1 | OTHER | 4/4 | 169 | 0 | 4.66 (3) | 150 | unknown | no |

### Black Sabbath: 3 rows, 3 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Iron man - Black Sabbath | QmS4UQ3cPqnpBJ2PiBZ5Z79Ky4dg4HEmfSfoJ4D6utRx2g | 1 | LEADSHEET | 4/4,2/4 | 54 | 121 | 0.00 (0) | 3 | unknown | yes |
| 2 | Black Sabbath - Fluff | QmVXyyBv6Jh46KmF1pY1jGGTuB8XrYDHRT7cuQ48xsPcbe | 1 | MIXED_PIANO2 | 3/4 | 175 | 0 | 4.73 (12) | 2599 | unknown | yes |
| 3 | PARANOID for Pep Band | QmcWaSWbbgrMvypjykRkRPWe1xefSERUxhfNPCrgTztQAG | 1 | OTHER | 4/4 | 73 | 0 | 4.71 (4) | 303 | unknown | no |

### Linkin Park: 16 rows, 8 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Final Masquerade | QmU6qdsWTZAN5p3wzQNA3HBS6UVSAayhQbrbnwj8LPQ6Vr | 4 | LEADSHEET | 4/4 | 25 | 25 | 0.00 (0) | 127 | in-copyright | yes |
| 2 | Leave Out All the Rest - Linkin Park | QmTAZ6A8z4vBFgQwpN5STorC5osK59XKQV6o1WWJ9vaGc5 | 1 | PIANO2 | 4/4 | 67 | 0 | 4.86 (75) | 2870 | in-copyright | yes |
| 3 | My December | QmWYEvKnbTqk4yqWj1pp41PHfTuQU9BaFvLjEqUHxa6bmK | 1 | PIANO2 | 4/4 | 97 | 0 | 4.89 (24) | 4921 | in-copyright | yes |
| 4 | Linkin Park Crawling Piano Score | QmW1fMWmYyYEVrWZMztR41GGEQ6MFvfdpNxvqp2HgDJajh | 2 | PIANO2 | 4/4 | 94 | 0 | 4.93 (12) | 768 | in-copyright | yes |
| 5 | Linkin Park - NUMB piano cover | QmVsJV6oJeAC4MnbePt17zysoFrdyvs5PDokfM8NLxUhJs | 4 | PIANO2 | 4/4 | 85 | 0 | 4.86 (12) | 1458 | unknown | no |
| 6 | Castle of Glass - Linkin Park | QmZ1daDL3Ubim5WfWZPQDEXN6LzerhKrX4aXSbvxTSoBdg | 2 | PIANO2 | 4/4 | 89 | 0 | 4.76 (56) | 3696 | in-copyright | no |
| 7 | Linkin Park - Iridescent | QmUHB4NY9BwyhN93d52wX5vhAJPyJZ34rZcpZqeEt8tFgf | 1 | PIANO2 | 4/4 | 73 | 0 | 4.70 (31) | 16260 | unknown | no |
| 8 | Linkin Park - What I've Done (2 melodies in RH) | QmatR9cf2tT7EhR5MJ2R1vYo1qTpwVFfbkpKMFU3nAs5Dp | 1 | PIANO2 | 4/4 | 79 | 0 | 4.71 (4) | 852 | unknown | no |

### Foo Fighters: 3 rows, 2 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | aloha line 2020 | QmYXmyZyGp2FUzjDvVF1zRT4eVcA2XrvSUq543cQW4wY3C | 2 | MIXED_PIANO2 | 3/4,2/4,4/4 | 168 | 0 | 0.00 (0) | 84 | unknown | yes |
| 2 | The Pretender | QmWUQJBDFEQ9xHjGPWqEn6goguxFEbtu72QvM4FKnQEVWF | 1 | PIANO1 | 4/4,2/4 | 119 | 0 | 4.71 (4) | 399 | unknown | yes |

### Coldplay: 46 rows, 18 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Coldplay - The Scientist | QmcJRkptrVetWEAJibzZgn4FjTLZbb3NWyMnD8Ce9azWNh | 3 | PIANO2 | 4/4 | 22 | 22 | 4.71 (4) | 461 | unknown | yes |
| 2 | Coldplay Medley | QmeRk3HNbY1ZQBwETqmegMNJV74dBNZ97KH8k3UEAB8PRm | 1 | PIANO2 | 4/4 | 140 | 56 | 0.00 (0) | 1509 | unknown | yes |
| 3 | Speed of Sound | QmYG2q5NcJCVydHQ66n3b3WULnW5X5NbvprNDtb2wnqq2C | 1 | PIANO2 | 4/4 | 77 | 0 | 4.94 (15) | 12974 | unknown | yes |
| 4 | Trouble Coldplay | QmTXa9BRcsEwYH6nUY9pyWp4TiZeDrKsuPmActkce1rkh7 | 1 | PIANO2 | 4/4 | 45 | 0 | 4.73 (314) | 78220 | unknown | yes |
| 5 | Fix You by Coldplay | QmaX4Pkqc1tDyVk7yy8Fkhq4nSjViaBfyLwA3rKuNKChiQ | 4 | PIANO2 | 4/4 | 61 | 0 | 0.00 (0) | 13154 | unknown | no |
| 6 | Life in Technicolor II--Coldplay | QmZRu6NmP2J9ghGEEjATPCWxCzP3p2zbF9QBe2TWSFRszv | 1 | PIANO2 | 4/4 | 106 | 0 | 4.64 (44) | 8029 | unknown | no |
| 7 | Postcard from far away. Coldplay. | QmPxzHi2TSc9L7K2ETakvrLwf1xThBToSeg8pKKVFj4QRR | 1 | PIANO2 | 4/4 | 30 | 0 | 4.50 (7) | 2838 | unknown | no |
| 8 | Clocks Coldplay | QmdE9gDzNjsgAvwtF4vd6ddcceBHSspZCM79gqwGQuiBYC | 4 | PIANO2 | 4/4 | 22 | 0 | 4.61 (1185) | 357787 | unknown | no |
| 9 | Coldplay - Amsterdam | QmZSAMjAfzz3vTDZF7EEWRVgZifc32YaJNiL25yN9SijQ7 | 1 | PIANO2 | 4/4 | 94 | 0 | 4.57 (78) | 15934 | unknown | no |
| 10 | Viva La Vida/Pompeii mashup (Coldplay Bastille) - [SATB A cappella] | QmfSe2qm5Q2HBXdsP1bYJg4XuJw6rEwYevpWvm2Tv762YV | 15 | PIANO2 | 4/4 | 139 | 0 | 4.70 (17) | 1372 | unknown | no |
| 11 | White Shadows | Qmc4HRQdvDEuQvLbenuNfP33GY4QiGseY9kTXywuUrmDWg | 1 | MIXED_PIANO2 |  | 98 | 0 | 0.00 (0) | 2431 | unknown | no |
| 12 | Coldplay - Paradise | QmRJRNaEpG9Vk5NXqF7dntLbW3QJPKmmHwtgrmnRpWQopB | 3 | MIXED_PIANO2 | 4/4 | 76 | 0 | 0.00 (0) | 1302 | unknown | no |
| 13 | Coldplay - Orphans | QmWHXi88hBCPqUP2uwun65DbuR3rcG7i2CUGCD2vNmd4td | 1 | MIXED_PIANO2 | 4/4 | 89 | 0 | 0.00 (0) | 1022 | unknown | no |
| 14 | Yellow | QmeC2Rfuvgp91Z2jLPHGAzkWif6sELoSuNXK9YA4N69kmv | 3 | MIXED_PIANO2 | 4/4 | 35 | 0 | 0.00 (0) | 524 | unknown | no |
| 15 | Coldplay - Hymn For The Weekend (condensed) | QmXD8Dk2VNXkGakqhgBec8czudFLpgTVz6oFxGqJXnjMYw | 3 | MIXED_PIANO2 | 4/4 | 85 | 0 | 0.00 (0) | 230 | unknown | no |
| 16 | Viva La Vida Steel Drums | QmZgV5k5a17ErGy46MVx7VGtMkXmwh1wB6RT7zhFNt8fMc | 1 | OTHER | 4/4 | 99 | 0 | 0.00 (0) | 486 | unknown | no |
| 17 | Everglow violin 2 p1 | QmRZazQm79VMSVoW8Ro2uW5WxGKwDJekJ86QssfLuXLRqC | 1 | NOT_INSPECTED |  | 44 | None | 0.00 (0) | 87 | unknown | no |
| 18 | Viva La Freude edited quartet | QmVZcT2ufsAs7vWP88wSvSbcA1NBcNZu47Wp771MYBfDsS | 1 | NOT_INSPECTED |  | 88 | None | 0.00 (0) | 65 | pd | no |

### Billy Joel: 21 rows, 9 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Billy Joel - She's Always A Woman | QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn | 2 | PIANO2 | 12/8,6/8,9/8 | 40 | 129 | 4.80 (101) | 7040 | unknown | yes |
| 2 | Vienna Billy Joel | QmUkekPKGR983LBTg8oK7QYh1rKLkUmUNnKJrMLWRKm4Nx | 2 | LEADSHEET | 4/4 | 107 | 95 | 4.48 (28) | 3097 | unknown | yes |
| 3 | And so is goes | QmZTntpWyVxPocpcy7XDb3R5Ck4NxSUF8PdSWWLuEH1SPb | 6 | PIANO2 | 3/4,4/4 | 57 | 0 | 4.95 (18) | 348 | unknown | yes |
| 4 | Uptown Girl | QmYp2Waj5h4khKz5Tr7D9AHwgMBbaumTxfpDkiVjBE6xKH | 2 | PIANO2 |  | 97 | 0 | 4.72 (19) | 1142 | unknown | yes |
| 5 | The Longest Time | QmQ1Z57iroXMV1PzxwBXBgYUXFdVWei6esSMpQDMmzwdwV | 2 | PIANO2 | 4/4 | 70 | 0 | 3.66 (3) | 6410 | unknown | no |
| 6 | Rousseau: Billy Joel - Piano Man | QmWpzkuQx23WPUoU1Lvta6hJtK7ccBjeSwL1ATyJ47UUMU | 4 | PIANO2 | 4/4,3/4 | 273 | 0 | 4.80 (240) | 17152 | unknown | no |
| 7 | Summer Highland Falls | QmZ2kp8fL8uSXiUp7WAfTDr8vDzLjtNj5ewowgpC2nPovP | 1 | MIXED_PIANO2 | 2/2 | 144 | 0 | 4.73 (27) | 7877 | unknown | no |
| 8 | Tenor and Lead | QmRqs5kTuETRpmK6dqfBnHVCZsDkrHmbATc9CAUhXQhvvL | 1 | PIANO1 | 4/4 | 39 | 0 | 0.00 (0) | 32 | unknown | no |
| 9 | Lullaby (Goodnight My Angel) | QmQvDaWBBq6YHk2jLcPep3iG2h37eNF2HLWzFjUVveaxnK | 1 | OTHER | 2/4,7/4,4/4,5/4,3/4,6/4 | 85 | 0 | 0.00 (0) | 715 | unknown | no |

### Elton John: 24 rows, 16 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Daniel Elton John/Bernie Taupin piano cover | QmSj1cyUhcFmnhKdibiMpNqoEZkFdM47NxnqbmgVsbup62 | 1 | PIANO2 | 2/2 | 126 | 163 | 4.74 (106) | 3415 | unknown | yes |
| 2 | The King | QmTLkSX6MxkF9n4dF3FMH7cvfjR4vSLkvbjQRkL3EpWVzP | 2 | PIANO2 | 4/4 | 11 | 8 | 0.00 (0) | 2586 | unknown | yes |
| 3 | Elton John - Rocket Man | QmeQQcvhQttDeWkUeWsMd71pG6WgJtAwv6xuDShh7YUy7B | 1 | PIANO2 | 4/4 | 47 | 0 | 4.78 (146) | 9149 | unknown | yes |
| 4 | [EASY PIANO] Elton John Can you Feel The Love Tonight Lion King OST | QmTwsXtFetmmCqQeGQgxQZjdjHn14n6L57B4C6dCEgEq7D | 5 | PIANO2 | 4/4 | 61 | 0 | 4.72 (149) | 6087 | unknown | yes |
| 5 | Thank you for all of your loving | QmcQSMiDchN79Ege5W6B4B1ZWca5DpqWsLLrFi9TFKMD28 | 1 | PIANO2 | 2/2,3/4,6/8,4/4 | 36 | 0 | 0.00 (0) | 213 | unknown | no |
| 6 | Your Song - Elton John - Easy Piano | QmcZnZByDzCDxRpXJfSGsPqDP9reRxzqpwmcxs3HR82kHc | 3 | PIANO2 | 4/4 | 38 | 0 | 4.64 (1414) | 78241 | unknown | no |
| 7 | im still standing | QmYHhaP2rpEE4yWXvQ8uWeLDbcKAEBbuEkghesQXWF5zaE | 2 | MIXED_PIANO2 | 4/4 | 55 | 47 | 4.08 (9) | 1417 | unknown | no |
| 8 | Saturday Night's Alright for Fighting | QmedtcuPuY77PkDCWRCf8szucxfhmvKDumWqEbVQqesa6L | 1 | MIXED_PIANO2 | 4/4 | 191 | 231 | 4.89 (15) | 2816 | unknown | no |
| 9 | A word in Spanish (WIP) | QmeN9KXbXPZapPbc7yJkCg9EM8Kh2TWAjiSt72weSwENwG | 1 | MIXED_PIANO2 | 4/4,2/4 | 95 | 0 | 4.85 (4) | 165 | unknown | no |
| 10 | Bennie and the Jets / Elton John + Bernie Taupin | QmWoKGeM1RQbqvXPairpdK87xbZ86EuvSurhNn4QHBJ18R | 1 | MIXED_PIANO2 | 4/4 | 84 | 0 | 4.67 (99) | 51236 | unknown | no |
| 11 | The Bitch Is Back | QmSfLx6L8oxuV3xHe6VNnjZEPtxTmFKXowKvipEKNbmnXt | 1 | MIXED_PIANO2 | 4/4 | 98 | 0 | 4.53 (10) | 773 | unknown | no |
| 12 | Can you feel love tonight | Qme5c4R4MRFd8v5pAXSW1aQXEscW6Mk9fFhiQdSrLCHTBr | 1 | OTHER | 4/4 | 32 | 0 | 4.89 (7) | 585 | unknown | no |
| 13 | The Lion King - arranged for Flute Choir | QmeTXPaBrnhsCsTwS1afrBtW1RmTC89QqafAUThiyvat2J | 1 | OTHER | 4/4 | 76 | 0 | 4.88 (6) | 759 | in-copyright | no |
| 14 | The Circle of Life | QmWS4D1LcscYcCgaAgVFyZcpQ2pTnsY3hVQsFcVoQDMxYz | 1 | OTHER | 4/4 | 89 | 0 | 0.00 (0) | 336 | unknown | no |
| 15 | Elton John's Crocodile Rock for Horn Choir | QmUSAtKFzJrc7XWsF7CvJDgLfmbrZdMgR44WZCSbBzFyJk | 1 | OTHER | 4/4 | 90 | 0 | 0.00 (0) | 97 | unknown | no |
| 16 | Circle | QmZPCZx9Tg1ygq5FGvgWo5DwJcqHQzeRF3ucuDc3SH36Lr | 1 | OTHER | 4/4,2/4,6/4,3/4 | 103 | 0 | 0.00 (0) | 78 | unknown | no |

### Beatles: 34 rows, 18 distinct songs

Top 20 distinct songs.

| # | Song | CID (best edition) | Editions | Shape | Meters | Bars | Chords | Rating (n) | Views | Label | Dumped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Something - The Beatles | QmPoKC1KNnhFURL5QSo3DRkGEWAoRgDiDEUchNJt79dGRo | 2 | PIANO2 | 4/4 | 19 | 39 | 4.54 (384) | 15395 | unknown | yes |
| 2 | She is not a Girl who misses much_opening-1st-movement | QmeEtYGFYUSj7MtF3AqZ2q5BBcFBNKHYb4DxZSbSensoXJ | 1 | PIANO2 | 4/4 | 12 | 16 | 0.00 (0) | 51 | unknown | yes |
| 3 | Happy Xmas (War is over) | QmQ1qVi1RHonfqDZydkmHSwTDQ7vzE8rQdojdK2BXTPPw1 | 4 | PIANO2 | 6/8 | 33 | 0 | 4.70 (70) | 4021 | unknown | yes |
| 4 | Imagine | QmXAocpmyAT6PCMWzLDkz2c7j8UeafVmZsCg4eLgNKwEN7 | 11 | PIANO2 | 4/4 | 35 | 0 | 0.00 (0) | 397 | unknown | yes |
| 5 | I could not do without thee - Robert H. McCartney | QmQLf8hVD7pbUkBPR5cA67VwzPETC5QVMrHxgPYUYF57AJ | 1 | PIANO2 | 4/4 | 17 | 0 | 0.00 (0) | 34 | unknown | no |
| 6 | Hail to the lords anointed - Robert H. McCartney | QmccYykmJrQdohA8f8bKWTE2uwzQgySWwdnKvwshUD12ns | 1 | PIANO2 |  | 17 | 0 | 0.00 (0) | 11 | unknown | no |
| 7 | Jealous guy- John Lennon | QmVBCwuTG3VivYCJw5HbDys1iDkwFmqQhfxPSCHPXyp2gP | 2 | PIANO2 | 4/4,2/4 | 66 | 0 | 4.35 (14) | 1172 | unknown | no |
| 8 | sei gegrusset jesu gutig | QmQWXy6pPdUnbyrRXM5TD93RiWR66MdFNzoE4HnomCBvuE | 1 | PIANO2 | 4/4 | 3 | 0 | 0.00 (0) | 34 | unknown | no |
| 9 | Till There Was You Bossa Nova for Jazz Combo | QmbNNMbaWQsgF3avzbkK35DkJiw1DiDJdmPKPEyhTUyjCL | 1 | MIXED_PIANO2 | 4/4 | 68 | 261 | 4.84 (215) | 8109 | unknown | no |
| 10 | Money (That's What I Want) | Qmdjr3YoE94iwFT4tXp1T16vRzN9QoWCaBF7wLnqHDNTpu | 1 | MIXED_PIANO2 | 4/4 | 71 | 221 | 4.24 (5) | 2943 | unknown | no |
| 11 | Happy Xmas | QmVsPmhbYv2HS7mpWDuoGo8txNicvo9XYRMYgGkGDrM68e | 2 | MIXED_PIANO2 | 12/8 | 13 | 13 | 4.44 (6) | 699 | unknown | no |
| 12 | Please Please Me - The Beatles | QmSkFxTiMmgAR34Su4y2aTrrEFKH9pVdtXuBHwP78kjyeN | 1 | MIXED_PIANO2 | 4/4 | 68 | 0 | 4.85 (11) | 1380 | unknown | no |
| 13 | HAPPY XMAS IN SOL | QmPXDf29d7f8hvQYVq9VTV6edQSbaExDQVoFxUJGSrMdFs | 1 | MIXED_PIANO2 | 12/8 | 30 | 0 | 4.49 (3) | 538 | unknown | no |
| 14 | While my guitar gently weeps | QmX2NqQZMYjCCFGgZ6Qk5Fugcnd94nm4xcRCJcbYLE8PP7 | 1 | OTHER | 4/4 | 51 | 2 | 3.99 (4) | 375 | unknown | no |
| 15 | 2ª voz - Então É Natal versão teste | QmVDKZxL9YHuPjLfEoxcoNbtW35pzcNFysmc5W4evsmqQD | 1 | OTHER | 3/4 | 63 | 0 | 0.00 (0) | 21 | unknown | no |
| 16 | Beautiful Boy (Darling Boy) Upper Wind Ensemble | QmesS65yMx3yaU3bgPftLWdCUGqP5Yb4Ya1u1gV1n8Hb4o | 1 | OTHER | 4/4 | 68 | 0 | 4.66 (6) | 1783 | unknown | no |
| 17 | Stand by Me | QmSu4CRmBAQ9EjHGpHxfTfYefzXaZLrBYVXER937z4fxGA | 1 | OTHER | 4/4 | 73 | 0 | 4.60 (12) | 15984 | unknown | no |
| 18 | The Sheik of Araby FH | QmX6vrb8Aix1ZRqs8XZQNRxm4BFGskp2ebJGmJWEh1mWme | 1 | OTHER | 2/2 | 144 | 0 | 0.00 (0) | 118 | unknown | no |


## Dumped files

- `xml/A-blues/joe-turner-blues-QmXbcEgNyEXXfV5SKFQ4rK5eJi3xTtPJQm9kMVgM7GTWVK.musicxml` / `summary/A-blues/joe-turner-blues-QmXbcEgNyEXXfV5SKFQ4rK5eJi3xTtPJQm9kMVgM7GTWVK.txt`
- `xml/A-blues/the-jelly-roll-blues-jelly-roll-morton-1-QmbuoFtkky8Xpo8LSiAqkMXzBs2Mtc33L6GFw1kWv9T5S3.musicxml` / `summary/A-blues/the-jelly-roll-blues-jelly-roll-morton-1-QmbuoFtkky8Xpo8LSiAqkMXzBs2Mtc33L6GFw1kWv9T5S3.txt`
- `xml/A-blues/farewell-blues-QmStEZqKASQVCFNhKaHLcQm3R3RbDUPKA477NQ6kWsNToy.musicxml` / `summary/A-blues/farewell-blues-QmStEZqKASQVCFNhKaHLcQm3R3RbDUPKA477NQ6kWsNToy.txt`
- `xml/A-blues/new-orleans-blues-jelly-roll-morton-1925-QmbQRktDiVKVCdRwZc7XKQ7gjJxdFRzHwD68nv7AQhtRtM.musicxml` / `summary/A-blues/new-orleans-blues-jelly-roll-morton-1925-QmbQRktDiVKVCdRwZc7XKQ7gjJxdFRzHwD68nv7AQhtRtM.txt`
- `xml/A-blues/shout-for-joy-ye-holy-throng-a-m-wortman-QmadiFaW4tDntpiEiazA5Ec2hyvTNCAdQ1K2Ru4XhDF3Qw.musicxml` / `summary/A-blues/shout-for-joy-ye-holy-throng-a-m-wortman-QmadiFaW4tDntpiEiazA5Ec2hyvTNCAdQ1K2Ru4XhDF3Qw.txt`
- `xml/A-blues/boogie-woogie-QmRMcZyoTUeHHZiSkZbUymkaxU45UTAaWTLpaK4bRetiRz.musicxml` / `summary/A-blues/boogie-woogie-QmRMcZyoTUeHHZiSkZbUymkaxU45UTAaWTLpaK4bRetiRz.txt`
- `xml/A-blues/blues-riff-in-c-120-bpm-Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.musicxml` / `summary/A-blues/blues-riff-in-c-120-bpm-Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.txt`
- `xml/A-blues/sweet-home-chicago-Qmc7nrZ28Se5SVgSoRrGFmwTU5Gij48F344eGPRhTu6kwv.musicxml` / `summary/A-blues/sweet-home-chicago-Qmc7nrZ28Se5SVgSoRrGFmwTU5Gij48F344eGPRhTu6kwv.txt`
- `xml/A-blues/12-bar-blues-QmduvvF9WYbSxgdNZLWZHwiPmD6Bk4bDg9kvssqRP3pu6h.musicxml` / `summary/A-blues/12-bar-blues-QmduvvF9WYbSxgdNZLWZHwiPmD6Bk4bDg9kvssqRP3pu6h.txt`
- `xml/A-blues/blues-in-f-for-bass-lesson-QmXgWdLZyrDFZSLcK23xY8uhh2fN8y2AjuYYdyfUfAzJ2f.musicxml` / `summary/A-blues/blues-in-f-for-bass-lesson-QmXgWdLZyrDFZSLcK23xY8uhh2fN8y2AjuYYdyfUfAzJ2f.txt`
- `xml/A-blues/pinetops-boogie-woogie-in-f-edited-by-ti-QmU7rsQ1UcCDqoY36Xk9qBQk8f6JcZgDFoAx9w96rSNYx3.musicxml` / `summary/A-blues/pinetops-boogie-woogie-in-f-edited-by-ti-QmU7rsQ1UcCDqoY36Xk9qBQk8f6JcZgDFoAx9w96rSNYx3.txt`
- `xml/A-blues/jeeves-boogie-woogie-QmbJaTpRSBaVyquinmmn9W4yHVX4XxZqhNJJz1quQkzjPT.musicxml` / `summary/A-blues/jeeves-boogie-woogie-QmbJaTpRSBaVyquinmmn9W4yHVX4XxZqhNJJz1quQkzjPT.txt`
- `xml/B-jazz/after-youve-gone-QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU.musicxml` / `summary/B-jazz/after-youve-gone-QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU.txt`
- `xml/B-jazz/beginner-version-sweet-georgia-brown-QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5.musicxml` / `summary/B-jazz/beginner-version-sweet-georgia-brown-QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5.txt`
- `xml/B-jazz/squeeze-me-softly-mbe-25-QmTw3EQxygcbdDsDvKz6zRd2fjCGsvJGhG7C6aAYbCnyq8.musicxml` / `summary/B-jazz/squeeze-me-softly-mbe-25-QmTw3EQxygcbdDsDvKz6zRd2fjCGsvJGhG7C6aAYbCnyq8.txt`
- `xml/B-jazz/autumn-leaves-transcription-QmeeqT5bwUfEqU9w8ZGXXLgp49DQra1tM23aD85ipXiXXv.musicxml` / `summary/B-jazz/autumn-leaves-transcription-QmeeqT5bwUfEqU9w8ZGXXLgp49DQra1tM23aD85ipXiXXv.txt`
- `xml/B-jazz/fly-me-to-the-moon-QmeRR6uYMPKEGwESKPLQqceqFVpkKVHitRFvMsH62kxdPG.musicxml` / `summary/B-jazz/fly-me-to-the-moon-QmeRR6uYMPKEGwESKPLQqceqFVpkKVHitRFvMsH62kxdPG.txt`
- `xml/B-jazz/cinnamons-summertime-ukulele-QmYZtFAGnYAzWaUn8jrKHdNQnPBrER1HJQJpeSPXngfFuZ.musicxml` / `summary/B-jazz/cinnamons-summertime-ukulele-QmYZtFAGnYAzWaUn8jrKHdNQnPBrER1HJQJpeSPXngfFuZ.txt`
- `xml/B-jazz/there-will-never-be-another-you-chet-bak-QmTbLFzrc3BRcoFTEMf5s7nu53AB1KS3YpL3YiP16r9EhJ.musicxml` / `summary/B-jazz/there-will-never-be-another-you-chet-bak-QmTbLFzrc3BRcoFTEMf5s7nu53AB1KS3YpL3YiP16r9EhJ.txt`
- `xml/B-jazz/all-of-me-john-legend-accompaniment-QmZhhR4pHBdVofHP6ETvwD5G8fmv4LVprxxbwshXM9ZV9K.musicxml` / `summary/B-jazz/all-of-me-john-legend-accompaniment-QmZhhR4pHBdVofHP6ETvwD5G8fmv4LVprxxbwshXM9ZV9K.txt`
- `xml/B-jazz/fly-me-to-the-moon-QmS2enG17nJVrbMvvCcHDW9wAN8nLSV1CPMmtghD7SZFVQ.musicxml` / `summary/B-jazz/fly-me-to-the-moon-QmS2enG17nJVrbMvvCcHDW9wAN8nLSV1CPMmtghD7SZFVQ.txt`
- `xml/B-jazz/blue-bossa-improvisation-QmT2nQ3ssYraG2nRymmL4ySRed6yE2b3JeHUgxbXrAsYsi.musicxml` / `summary/B-jazz/blue-bossa-improvisation-QmT2nQ3ssYraG2nRymmL4ySRed6yE2b3JeHUgxbXrAsYsi.txt`
- `xml/B-jazz/autumn-leaves-piano-solo-hank-jones-some-Qmeaq2on2PCsqqEjxJt48tPGxyQJfCXCXMc1M9WfMEuCyz.musicxml` / `summary/B-jazz/autumn-leaves-piano-solo-hank-jones-some-Qmeaq2on2PCsqqEjxJt48tPGxyQJfCXCXMc1M9WfMEuCyz.txt`
- `xml/B-jazz/blue-bossa-for-bass-lesson-2019-11-27-QmXyjeq4uxYUhV6Ya1uQFmdKf2nUjbUEp2M5SPEjsy2gt8.musicxml` / `summary/B-jazz/blue-bossa-for-bass-lesson-2019-11-27-QmXyjeq4uxYUhV6Ya1uQFmdKf2nUjbUEp2M5SPEjsy2gt8.txt`
- `xml/B-jazz/all-of-me-QmVbSHLuJ2CHRrfS3kHoWHsPGCqtcLTjNdBA5YCgFg7Bpw.musicxml` / `summary/B-jazz/all-of-me-QmVbSHLuJ2CHRrfS3kHoWHsPGCqtcLTjNdBA5YCgFg7Bpw.txt`
- `xml/B-jazz/fly-me-to-the-moon-QmbLMWEPv367xSv1Ep7nQFLnUGXpBeHR4RU94USYT3Pv6A.musicxml` / `summary/B-jazz/fly-me-to-the-moon-QmbLMWEPv367xSv1Ep7nQFLnUGXpBeHR4RU94USYT3Pv6A.txt`
- `xml/B-jazz/autumn-leaves-QmYMpzeVPVzu94hB6kDwCfW7gAcWiNrRumnnd7PWQcRTZD.musicxml` / `summary/B-jazz/autumn-leaves-QmYMpzeVPVzu94hB6kDwCfW7gAcWiNrRumnnd7PWQcRTZD.txt`
- `xml/C-jam/st-james-infirmary-Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs.musicxml` / `summary/C-jam/st-james-infirmary-Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs.txt`
- `xml/C-jam/beginner-version-sweet-georgia-brown-QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5.musicxml` / `summary/C-jam/beginner-version-sweet-georgia-brown-QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5.txt`
- `xml/C-jam/after-youve-gone-QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU.musicxml` / `summary/C-jam/after-youve-gone-QmWUXqfKQAKdGoB5Mw8vmHFcMFDdhpSc4t9vyAjYHJedxU.txt`
- `xml/C-jam/saint-james-infirmary-QmPTYpb73P5ZJzXgwzg1sJAcAUxCosMCjnjRQxZk7d398y.musicxml` / `summary/C-jam/saint-james-infirmary-QmPTYpb73P5ZJzXgwzg1sJAcAUxCosMCjnjRQxZk7d398y.txt`
- `xml/C-jam/saint-james-infirmary-blues-QmexB7VLYouFHZ9nVFXSXjUb7L2c373Ve8apuLVs5GgMxc.musicxml` / `summary/C-jam/saint-james-infirmary-blues-QmexB7VLYouFHZ9nVFXSXjUb7L2c373Ve8apuLVs5GgMxc.txt`
- `xml/D-hymns/ludwig-van-beethoven-joyful-joyful-we-ad-QmY8XeRQK9L3q6Rndkex64R2N5X4LGiQ9CA6qG7U61YyE7.musicxml` / `summary/D-hymns/ludwig-van-beethoven-joyful-joyful-we-ad-QmY8XeRQK9L3q6Rndkex64R2N5X4LGiQ9CA6qG7U61YyE7.txt`
- `xml/D-hymns/deep-river-african-american-spiritual-QmbP96wZt5Vev9pA8pembvkaMw2wx48M3PR3pWNMfJuASp.musicxml` / `summary/D-hymns/deep-river-african-american-spiritual-QmbP96wZt5Vev9pA8pembvkaMw2wx48M3PR3pWNMfJuASp.txt`
- `xml/D-hymns/steal-away-to-jesus-african-american-spi-QmcrnJ2b9XrAey8CPrVRj5xn55Tvy4dfZe1aFr6FVTHBBs.musicxml` / `summary/D-hymns/steal-away-to-jesus-african-american-spi-QmcrnJ2b9XrAey8CPrVRj5xn55Tvy4dfZe1aFr6FVTHBBs.txt`
- `xml/D-hymns/ode-to-joy-QmXa4xixopTG1f7Q96UL1KU7skUQtk25XnNjXS61QbAZy5.musicxml` / `summary/D-hymns/ode-to-joy-QmXa4xixopTG1f7Q96UL1KU7skUQtk25XnNjXS61QbAZy5.txt`
- `xml/D-hymns/ode-to-joy-QmXWBURe48nbNXaFgz4Fhuv3p43nvqukyGufkYujjmFoCZ.musicxml` / `summary/D-hymns/ode-to-joy-QmXWBURe48nbNXaFgz4Fhuv3p43nvqukyGufkYujjmFoCZ.txt`
- `xml/D-hymns/nearer-my-god-to-thee-arthur-s-sullivan-QmQVNEqW4vw38TNZ1ogyn7JqgTCZWzPZTHvYg6sZDYmStN.musicxml` / `summary/D-hymns/nearer-my-god-to-thee-arthur-s-sullivan-QmQVNEqW4vw38TNZ1ogyn7JqgTCZWzPZTHvYg6sZDYmStN.txt`
- `xml/D-hymns/holy-holy-holy-QmTPmBvCqSrpJTdr87B77a5yprLJM1L6p2yUfmpoBSJW43.musicxml` / `summary/D-hymns/holy-holy-holy-QmTPmBvCqSrpJTdr87B77a5yprLJM1L6p2yUfmpoBSJW43.txt`
- `xml/D-hymns/ode-to-joy-QmejAvfGAAdj9ZNpU76p7BCpSvxnzSdW2RwfhxbB2mQzZF.musicxml` / `summary/D-hymns/ode-to-joy-QmejAvfGAAdj9ZNpU76p7BCpSvxnzSdW2RwfhxbB2mQzZF.txt`
- `xml/D-hymns/holy-holy-holy-sweney-b-hillyard-sweney-QmddkzK9gSWChZ96o19vmW1QrcZNwDGFMrSWJ6odMCiwRR.musicxml` / `summary/D-hymns/holy-holy-holy-sweney-b-hillyard-sweney-QmddkzK9gSWChZ96o19vmW1QrcZNwDGFMrSWJ6odMCiwRR.txt`
- `xml/D-hymns/ode-to-joy-for-orchestra-QmSsj7o5AWXjdDAgKkXpohjam3ZRYZhcteQXNBw6vsex7s.musicxml` / `summary/D-hymns/ode-to-joy-for-orchestra-QmSsj7o5AWXjdDAgKkXpohjam3ZRYZhcteQXNBw6vsex7s.txt`
- `xml/D-hymns/ode-to-joy-QmX5aJm5bL1oSuTADYETZoyMCA75h4PWeoa9R3kNMAZDsf.musicxml` / `summary/D-hymns/ode-to-joy-QmX5aJm5bL1oSuTADYETZoyMCA75h4PWeoa9R3kNMAZDsf.txt`
- `xml/D-hymns/nearer-my-god-to-thee-sv-QmVUbXdavJDNpPBrmmtJDaWUU28Nu6UmMv5V265cbS6am6.musicxml` / `summary/D-hymns/nearer-my-god-to-thee-sv-QmVUbXdavJDNpPBrmmtJDaWUU28Nu6UmMv5V265cbS6am6.txt`
- `xml/D-hymns/steal-away-seconds-cymru-Qmd743N6JTPToRbYipMFyadJVZbbzdLVVgT2cy6eYJU2V4.musicxml` / `summary/D-hymns/steal-away-seconds-cymru-Qmd743N6JTPToRbYipMFyadJVZbbzdLVVgT2cy6eYJU2V4.txt`
- `xml/D-hymns/beethoven-symphony-no-9-in-d-minor-op-12-QmUFbAMfeBjxwNVwzfZxgYXR3cWv7424KN19uKNTqQad2K.musicxml` / `summary/D-hymns/beethoven-symphony-no-9-in-d-minor-op-12-QmUFbAMfeBjxwNVwzfZxgYXR3cWv7424KN19uKNTqQad2K.txt`
- `xml/E-latin/tico-tico-QmWbvFZYw6cR7ytP7V2SyZm2u6VMGCD31cBnNuWwMoqFLw.musicxml` / `summary/E-latin/tico-tico-QmWbvFZYw6cR7ytP7V2SyZm2u6VMGCD31cBnNuWwMoqFLw.txt`
- `xml/E-latin/so-danco-samba-QmbmC9BRdBLb6XUbyf5TqSy1P1oYdNDYTJoSpd4nXByPMD.musicxml` / `summary/E-latin/so-danco-samba-QmbmC9BRdBLb6XUbyf5TqSy1P1oYdNDYTJoSpd4nXByPMD.txt`
- `xml/E-latin/corcovado-QmWYgg7QifpX4XtkYReco3Psk4GvNgzbeZMeqTBUvabUgF.musicxml` / `summary/E-latin/corcovado-QmWYgg7QifpX4XtkYReco3Psk4GvNgzbeZMeqTBUvabUgF.txt`
- `xml/E-latin/bezeichnung-standardisiert-la-jalousie-QmbEXBfVDk9iNqKRoXudwgcVKFL9yagDcFvwqAwvLt5h5H.musicxml` / `summary/E-latin/bezeichnung-standardisiert-la-jalousie-QmbEXBfVDk9iNqKRoXudwgcVKFL9yagDcFvwqAwvLt5h5H.txt`
- `xml/E-latin/garota-de-ipanema-QmRWDfadi4gsez9ishabhEcHpHNdjC7q2efEJZe5SDa8X8.musicxml` / `summary/E-latin/garota-de-ipanema-QmRWDfadi4gsez9ishabhEcHpHNdjC7q2efEJZe5SDa8X8.txt`
- `xml/E-latin/por-una-cabeza-QmTBJZppfNknV4qdmmCxjar1Qh5BRJNSyDRP919x2JdnMN.musicxml` / `summary/E-latin/por-una-cabeza-QmTBJZppfNknV4qdmmCxjar1Qh5BRJNSyDRP919x2JdnMN.txt`
- `xml/E-latin/por-una-cabeza-QmQSWZ1U7q2MoQHVoWBt7htbe8f1JWrGpYpnD1MKytUV2c.musicxml` / `summary/E-latin/por-una-cabeza-QmQSWZ1U7q2MoQHVoWBt7htbe8f1JWrGpYpnD1MKytUV2c.txt`
- `xml/E-latin/girl-from-ipanema-QmZF4m2KTAiHmHpg9eYrG1y2bfQKo2chTxSNYepnmuvHtF.musicxml` / `summary/E-latin/girl-from-ipanema-QmZF4m2KTAiHmHpg9eYrG1y2bfQKo2chTxSNYepnmuvHtF.txt`
- `xml/E-latin/adios-nonino-QmYNaW9VvQDFWoD159XYCPxmvyJmGBkhrFijb1P1PaLRUE.musicxml` / `summary/E-latin/adios-nonino-QmYNaW9VvQDFWoD159XYCPxmvyJmGBkhrFijb1P1PaLRUE.txt`
- `xml/E-latin/por-una-cabeza-QmXApgzsxGtBZpq9ZMcEcZLZf7MAzxTNfXK3DjEcEV1xid.musicxml` / `summary/E-latin/por-una-cabeza-QmXApgzsxGtBZpq9ZMcEcZLZf7MAzxTNfXK3DjEcEV1xid.txt`
- `xml/E-latin/zequinha-de-abreu-tico-tico-QmdTRWW1YANW9XNop1c4cu3tiRHDtwGeZkPEB5GbLQWBdf.musicxml` / `summary/E-latin/zequinha-de-abreu-tico-tico-QmdTRWW1YANW9XNop1c4cu3tiRHDtwGeZkPEB5GbLQWBdf.txt`
- `xml/E-latin/tico-tico-QmejFJRcT7Q9hdFQWbhPZCnewzAzCzVCckYHgsVuN7RcAM.musicxml` / `summary/E-latin/tico-tico-QmejFJRcT7Q9hdFQWbhPZCnewzAzCzVCckYHgsVuN7RcAM.txt`
- `xml/E-latin/la-negra-tiene-tumbao-QmbYzj8P6PbJ9DwbepDeMSHTVoHyEEMhQRsuTLcqf3bqyd.musicxml` / `summary/E-latin/la-negra-tiene-tumbao-QmbYzj8P6PbJ9DwbepDeMSHTVoHyEEMhQRsuTLcqf3bqyd.txt`
- `xml/E-latin/tico-tico-no-fuba-QmZq95t9yu9JmYP47Hksx9aXGvrmxJ6KZfrWshwAetiuas.musicxml` / `summary/E-latin/tico-tico-no-fuba-QmZq95t9yu9JmYP47Hksx9aXGvrmxJ6KZfrWshwAetiuas.txt`
- `xml/E-latin/bezeichnung-standardisiert-la-jalousie-QmdZTLCS4kM6YJHjRX2D8kp6oEMPBD1w79nZJ2iszfqn3k.musicxml` / `summary/E-latin/bezeichnung-standardisiert-la-jalousie-QmdZTLCS4kM6YJHjRX2D8kp6oEMPBD1w79nZJ2iszfqn3k.txt`
- `xml/F-improv-compose/down-in-the-valley-anonymous-QmWuBBaf6uwZdiWHx1dm9meAW2tXnw6EV7hb93tnDTy3S4.musicxml` / `summary/F-improv-compose/down-in-the-valley-anonymous-QmWuBBaf6uwZdiWHx1dm9meAW2tXnw6EV7hb93tnDTy3S4.txt`
- `xml/F-improv-compose/stephen-foster-oh-susanna-QmchjwvtpXykrxVrMHadPZLP7AHZ4ZgFjEg6qca7xpPFcm.musicxml` / `summary/F-improv-compose/stephen-foster-oh-susanna-QmchjwvtpXykrxVrMHadPZLP7AHZ4ZgFjEg6qca7xpPFcm.txt`
- `xml/F-improv-compose/house-of-the-rising-sun-Qmc3v934xFCPJrgGpH9J8G5qTUhebhrysLwPEFEXhYgStR.musicxml` / `summary/F-improv-compose/house-of-the-rising-sun-Qmc3v934xFCPJrgGpH9J8G5qTUhebhrysLwPEFEXhYgStR.txt`
- `xml/F-improv-compose/behold-the-changing-autumn-leaves-asa-hu-QmWLjxJSdX1VjYwcEkDYhj7CDhWLX4rFbSakCxiGTJWT7T.musicxml` / `summary/F-improv-compose/behold-the-changing-autumn-leaves-asa-hu-QmWLjxJSdX1VjYwcEkDYhj7CDhWLX4rFbSakCxiGTJWT7T.txt`
- `xml/F-improv-compose/franz-xaver-gruber-silent-night-waltz-QmaNGN437JsdT2RTdnZEC8gfm7Doc8CqiusogB2PQEnoPu.musicxml` / `summary/F-improv-compose/franz-xaver-gruber-silent-night-waltz-QmaNGN437JsdT2RTdnZEC8gfm7Doc8CqiusogB2PQEnoPu.txt`
- `xml/F-improv-compose/james-hook-minuet-QmWzCHF7iXaZoDeWuZAQxtBhTYDWU25v76FEg8wJYVCu32.musicxml` / `summary/F-improv-compose/james-hook-minuet-QmWzCHF7iXaZoDeWuZAQxtBhTYDWU25v76FEg8wJYVCu32.txt`
- `xml/F-improv-compose/prelude-bwv-855a-js-bach-QmQReLi7RpjwRzBA7K1ynX98MaDXJQUfFEnGi19bSNXF9R.musicxml` / `summary/F-improv-compose/prelude-bwv-855a-js-bach-QmQReLi7RpjwRzBA7K1ynX98MaDXJQUfFEnGi19bSNXF9R.txt`
- `xml/F-improv-compose/poldark-prelude-theme-extended-version-QmULtYgZ5haxhehzpuBVTSkWy7GAew1xkK9cNgj2eCD9U1.musicxml` / `summary/F-improv-compose/poldark-prelude-theme-extended-version-QmULtYgZ5haxhehzpuBVTSkWy7GAew1xkK9cNgj2eCD9U1.txt`
- `xml/F-improv-compose/prelude-s-liapounow-op-6-no-1-QmT4sxk6RZNs91iTEaX1j323sbyPDK44Z1Abo7BBtprRap.musicxml` / `summary/F-improv-compose/prelude-s-liapounow-op-6-no-1-QmT4sxk6RZNs91iTEaX1j323sbyPDK44Z1Abo7BBtprRap.txt`
- `xml/F-improv-compose/henry-purcell-minuet-QmUU8bnbG2i4TTxvpzBvZ8M27QtLWkjoSPVJxbRtG3v9Zs.musicxml` / `summary/F-improv-compose/henry-purcell-minuet-QmUU8bnbG2i4TTxvpzBvZ8M27QtLWkjoSPVJxbRtG3v9Zs.txt`
- `xml/F-improv-compose/prelude-m-ravel-QmU5R5iPDJRcbpKPJQwNhPd48XgFC1MJx6QyLmtT8fnf3T.musicxml` / `summary/F-improv-compose/prelude-m-ravel-QmU5R5iPDJRcbpKPJQwNhPd48XgFC1MJx6QyLmtT8fnf3T.txt`
- `xml/F-improv-compose/christoph-willibald-gluck-minuet-QmRgGKoYNhTe4ymePaix8qJepNawDCAwntcrp3s3W9q6Mz.musicxml` / `summary/F-improv-compose/christoph-willibald-gluck-minuet-QmRgGKoYNhTe4ymePaix8qJepNawDCAwntcrp3s3W9q6Mz.txt`
- `xml/F-improv-compose/prelude-QmbYqBsoSeeo9g9qke2Wja9Z1McBNNe9sYq4htD4RvAnrH.musicxml` / `summary/F-improv-compose/prelude-QmbYqBsoSeeo9g9qke2Wja9Z1McBNNe9sYq4htD4RvAnrH.txt`
- `xml/G-holiday/maoz-tsur-QmSe5SBzVY7xuqiqbPmyNF9tcMb5LBNnWUfnKbYung75mY.musicxml` / `summary/G-holiday/maoz-tsur-QmSe5SBzVY7xuqiqbPmyNF9tcMb5LBNnWUfnKbYung75mY.txt`
- `xml/G-holiday/rock-of-ages-thomas-hastings-QmQ3iGnFwSZFPs2Hh9vUzctQ1gTusQRwafCZoCXE3Q53xh.musicxml` / `summary/G-holiday/rock-of-ages-thomas-hastings-QmQ3iGnFwSZFPs2Hh9vUzctQ1gTusQRwafCZoCXE3Q53xh.txt`
- `xml/G-holiday/maoz-tsur-QmY9tPFTtU9CZU8FMZr6YSDF27aahfYxC76KJnxAYtLYEC.musicxml` / `summary/G-holiday/maoz-tsur-QmY9tPFTtU9CZU8FMZr6YSDF27aahfYxC76KJnxAYtLYEC.txt`
- `xml/G-holiday/rock-of-ages-cleft-for-me-ruebush-j-h-ru-QmUgP4ZNMSnRcS7UiGdSMPV8RuFxYpaAQabqhu3VZxYRhd.musicxml` / `summary/G-holiday/rock-of-ages-cleft-for-me-ruebush-j-h-ru-QmUgP4ZNMSnRcS7UiGdSMPV8RuFxYpaAQabqhu3VZxYRhd.txt`
- `xml/G-holiday/blest-rock-of-ages-cleft-for-me-chas-h-g-QmbkVNik2z9eJQwDZYDvo8f8iDy2NKcovJXVJnuVVLuJ1V.musicxml` / `summary/G-holiday/blest-rock-of-ages-cleft-for-me-chas-h-g-QmbkVNik2z9eJQwDZYDvo8f8iDy2NKcovJXVJnuVVLuJ1V.txt`
- `xml/G-holiday/praise-the-lord-the-rock-of-ages-jno-r-s-QmeryikFWiJRo4b1puszFYZrGeRjDRnxCroFTx43BwdejA.musicxml` / `summary/G-holiday/praise-the-lord-the-rock-of-ages-jno-r-s-QmeryikFWiJRo4b1puszFYZrGeRjDRnxCroFTx43BwdejA.txt`
- `xml/G-holiday/o-blessed-rock-of-ages-o-lamb-of-calvary-QmUp9oNAPY77qbW4aRcNf2iVGDeYSRhBALNGXFKNvKy1pU.musicxml` / `summary/G-holiday/o-blessed-rock-of-ages-o-lamb-of-calvary-QmUp9oNAPY77qbW4aRcNf2iVGDeYSRhBALNGXFKNvKy1pU.txt`
- `xml/H-ragtime/the-harlem-rag-1899-tyers-QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9.musicxml` / `summary/H-ragtime/the-harlem-rag-1899-tyers-QmXBVYcvQsE8mhE2yxpPRbFiXLxRW7HhqXB7dK2JEXUVq9.txt`
- `xml/H-ragtime/cosgroves-cakewalk-Qme3vDrh4eg9Gk4FSqeuSag3Ft5LdbrrZzWgsRphr2CuLB.musicxml` / `summary/H-ragtime/cosgroves-cakewalk-Qme3vDrh4eg9Gk4FSqeuSag3Ft5LdbrrZzWgsRphr2CuLB.txt`
- `xml/H-ragtime/heliotrope-bouquet-joplin-and-chauvin-19-Qma4jk2XgsU8hYgjmUTt3EyeqtwNW8Y8ZqJaxHuKo37DzK.musicxml` / `summary/H-ragtime/heliotrope-bouquet-joplin-and-chauvin-19-Qma4jk2XgsU8hYgjmUTt3EyeqtwNW8Y8ZqJaxHuKo37DzK.txt`
- `xml/H-ragtime/the-ragtime-dance-scott-joplin-1906-arra-QmXd7HNnNZodQvrybARoZN8NtcZ2LVpJ1Wxbkc8Gq9YJ36.musicxml` / `summary/H-ragtime/the-ragtime-dance-scott-joplin-1906-arra-QmXd7HNnNZodQvrybARoZN8NtcZ2LVpJ1Wxbkc8Gq9YJ36.txt`
- `xml/H-ragtime/sunflower-slow-drag-joplin-and-hayden-19-QmPdy5cVQ2tE9qMWhwLhVd2QtZh26inRSadFmcwkoypkpN.musicxml` / `summary/H-ragtime/sunflower-slow-drag-joplin-and-hayden-19-QmPdy5cVQ2tE9qMWhwLhVd2QtZh26inRSadFmcwkoypkpN.txt`
- `xml/I-pop/billy-joel-shes-always-a-woman-QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn.musicxml` / `summary/I-pop/billy-joel-shes-always-a-woman-QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn.txt`
- `xml/I-pop/hallelujah-chorus-2020-my-messiah-06-QmVrWfwZhqnxT3JWZqNHhwfRkUeuCr6MP9b7JjKjWT7pNu.musicxml` / `summary/I-pop/hallelujah-chorus-2020-my-messiah-06-QmVrWfwZhqnxT3JWZqNHhwfRkUeuCr6MP9b7JjKjWT7pNu.txt`
- `xml/I-pop/coldplay-the-scientist-QmcJRkptrVetWEAJibzZgn4FjTLZbb3NWyMnD8Ce9azWNh.musicxml` / `summary/I-pop/coldplay-the-scientist-QmcJRkptrVetWEAJibzZgn4FjTLZbb3NWyMnD8Ce9azWNh.txt`
- `xml/I-pop/love-of-my-life-QmWYmN6LAJEMYFZaVKTvmRHbk66RWLsxH1Hk9isULZz5hs.musicxml` / `summary/I-pop/love-of-my-life-QmWYmN6LAJEMYFZaVKTvmRHbk66RWLsxH1Hk9isULZz5hs.txt`
- `xml/I-pop/10-minutos-hallelujah-tutorial-12-QmVXmps1eEPetMLbU9Bx33h2tLDhEXT1UiAFXmArY1ocEU.musicxml` / `summary/I-pop/10-minutos-hallelujah-tutorial-12-QmVXmps1eEPetMLbU9Bx33h2tLDhEXT1UiAFXmArY1ocEU.txt`
- `xml/I-pop/john-playford-vienna-QmYuSTG72XHkHMAr1TqtmZtws3X5QiYKZDWvDrhcfqfSmy.musicxml` / `summary/I-pop/john-playford-vienna-QmYuSTG72XHkHMAr1TqtmZtws3X5QiYKZDWvDrhcfqfSmy.txt`
- `xml/I-pop/something-QmSEP572SsajfnvFbv7LvX3834H2SXA48k8m3RpNjAoDyW.musicxml` / `summary/I-pop/something-QmSEP572SsajfnvFbv7LvX3834H2SXA48k8m3RpNjAoDyW.txt`
- `xml/I-pop/when-we-were-young-adele-accompaniment-QmQhzFncR7uFfyVdjDmNZBQSVgkffiyeXwhQXfYUNA4ZyN.musicxml` / `summary/I-pop/when-we-were-young-adele-accompaniment-QmQhzFncR7uFfyVdjDmNZBQSVgkffiyeXwhQXfYUNA4ZyN.txt`
- `xml/I-pop/something-the-beatles-QmPoKC1KNnhFURL5QSo3DRkGEWAoRgDiDEUchNJt79dGRo.musicxml` / `summary/I-pop/something-the-beatles-QmPoKC1KNnhFURL5QSo3DRkGEWAoRgDiDEUchNJt79dGRo.txt`
- `xml/I-pop/no-surprises-QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M.musicxml` / `summary/I-pop/no-surprises-QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M.txt`
- `xml/I-pop/vienna-QmSyDuL23d8LtVWeGEk1XSTTzbZgSWU4AsEcEmU5A7LjJt.musicxml` / `summary/I-pop/vienna-QmSyDuL23d8LtVWeGEk1XSTTzbZgSWU4AsEcEmU5A7LjJt.txt`
- `xml/I-pop/no-surprises-QmYZGRsLCsNASou3HBU85SfR5T1KQx5hPqZVJa9xHtsbbM.musicxml` / `summary/I-pop/no-surprises-QmYZGRsLCsNASou3HBU85SfR5T1KQx5hPqZVJa9xHtsbbM.txt`
- `xml/I-pop/something-QmRyuCGUtT4ezbcQ4iwwxjSW8dGEPo89xeWZQGCUpxiVQ3.musicxml` / `summary/I-pop/something-QmRyuCGUtT4ezbcQ4iwwxjSW8dGEPo89xeWZQGCUpxiVQ3.txt`
- `xml/I-pop/vienna-waltz-jmt-117-QmaFkFGGac9zaNwkHMHMmvhFi5oEWDwVanGn2UEUvNTEzf.musicxml` / `summary/I-pop/vienna-waltz-jmt-117-QmaFkFGGac9zaNwkHMHMmvhFi5oEWDwVanGn2UEUvNTEzf.txt`
- `xml/I-pop/radiohead-no-surprises-for-drums-QmZv36W7wx6M6iQfXyeABA3PiNZM74qrVJKLqfVuB1ueoo.musicxml` / `summary/I-pop/radiohead-no-surprises-for-drums-QmZv36W7wx6M6iQfXyeABA3PiNZM74qrVJKLqfVuB1ueoo.txt`
- `xml/J-rock/heart-shaped-box-advanced-piano-solo-QmVcTJtm4y12CUByxJjVMnahC4YpxXGGzVJ1jLUwzj9hCt.musicxml` / `summary/J-rock/heart-shaped-box-advanced-piano-solo-QmVcTJtm4y12CUByxJjVMnahC4YpxXGGzVJ1jLUwzj9hCt.txt`
- `xml/J-rock/linkin-park-numb-piano-cover-QmVsJV6oJeAC4MnbePt17zysoFrdyvs5PDokfM8NLxUhJs.musicxml` / `summary/J-rock/linkin-park-numb-piano-cover-QmVsJV6oJeAC4MnbePt17zysoFrdyvs5PDokfM8NLxUhJs.txt`
- `xml/J-rock/muse-hysteria-Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf.musicxml` / `summary/J-rock/muse-hysteria-Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf.txt`
- `xml/J-rock/starlight-c-s-beatson-Qmcg2yJgkjwhewRFbb5hzpR1BNT1u5taVR3jfA2oASbQ3K.musicxml` / `summary/J-rock/starlight-c-s-beatson-Qmcg2yJgkjwhewRFbb5hzpR1BNT1u5taVR3jfA2oASbQ3K.txt`
- `xml/J-rock/smells-like-teen-spirit-the-gallows-QmaUdG7t1Z24QmJcohyMud9o6Lxfnh7Pz27cbLdMTo3Ajm.musicxml` / `summary/J-rock/smells-like-teen-spirit-the-gallows-QmaUdG7t1Z24QmJcohyMud9o6Lxfnh7Pz27cbLdMTo3Ajm.txt`
- `xml/J-rock/comfortably-numb-piano-solo-QmaxP2mCUy7TnpX55nhZZsVYe4n93Z9TzSsCgtFKc4KyzH.musicxml` / `summary/J-rock/comfortably-numb-piano-solo-QmaxP2mCUy7TnpX55nhZZsVYe4n93Z9TzSsCgtFKc4KyzH.txt`
- `xml/J-rock/paint-it-black-advanced-piano-solo-QmdGGr7gDBP2yosg6rvEBZhZE6T5ibDGCAX35YQFEvqrJ5.musicxml` / `summary/J-rock/paint-it-black-advanced-piano-solo-QmdGGr7gDBP2yosg6rvEBZhZE6T5ibDGCAX35YQFEvqrJ5.txt`
- `xml/J-rock/numb-QmWQLEEEZtuRkzRLC5D951wXXVj6tToNth5C59bFVJiGga.musicxml` / `summary/J-rock/numb-QmWQLEEEZtuRkzRLC5D951wXXVj6tToNth5C59bFVJiGga.txt`
- `xml/J-rock/my-immortal-in-f-voice-piano-QmVWSZ3vAy8prRv14TRREdLLnXk14UqrYrc1HgeisMAqqe.musicxml` / `summary/J-rock/my-immortal-in-f-voice-piano-QmVWSZ3vAy8prRv14TRREdLLnXk14UqrYrc1HgeisMAqqe.txt`
- `xml/J-rock/starlight-muse-QmdvHDt8aJcLBiY8ZmG7o5t9QDfmqDp9XhmqMquCL95knL.musicxml` / `summary/J-rock/starlight-muse-QmdvHDt8aJcLBiY8ZmG7o5t9QDfmqDp9XhmqMquCL95knL.txt`
- `xml/J-rock/heart-shaped-box-drum-score-QmSwE96nL8TCeEWcQxscpMdokPhncLkWEsmeL9BymCVSqk.musicxml` / `summary/J-rock/heart-shaped-box-drum-score-QmSwE96nL8TCeEWcQxscpMdokPhncLkWEsmeL9BymCVSqk.txt`
- `xml/K-metal/iron-man-black-sabbath-QmS4UQ3cPqnpBJ2PiBZ5Z79Ky4dg4HEmfSfoJ4D6utRx2g.musicxml` / `summary/K-metal/iron-man-black-sabbath-QmS4UQ3cPqnpBJ2PiBZ5Z79Ky4dg4HEmfSfoJ4D6utRx2g.txt`
- `xml/K-metal/lonely-day-QmeuoFT1hEJntEUswkFFoJ8UisTFHhjNiW236bsUeiAG7X.musicxml` / `summary/K-metal/lonely-day-QmeuoFT1hEJntEUswkFFoJ8UisTFHhjNiW236bsUeiAG7X.txt`
- `xml/K-metal/nightmare-QmYMwuVDWaUifsjW8KyvZeBoAtwZ7dtSZh5yaTaWsNfFin.musicxml` / `summary/K-metal/nightmare-QmYMwuVDWaUifsjW8KyvZeBoAtwZ7dtSZh5yaTaWsNfFin.txt`
- `xml/K-metal/orion-ssaa-QmQwsDxpo5oPDKycteKCuXikrdpLrjiiDNfxBFVfw53vPo.musicxml` / `summary/K-metal/orion-ssaa-QmQwsDxpo5oPDKycteKCuXikrdpLrjiiDNfxBFVfw53vPo.txt`
- `xml/K-metal/harvest-tours-berthold-tours-QmPkrozso5t5EUhqZ8K4xKe7TZLjQo1RamqE9CgboAoXXb.musicxml` / `summary/K-metal/harvest-tours-berthold-tours-QmPkrozso5t5EUhqZ8K4xKe7TZLjQo1RamqE9CgboAoXXb.txt`
- `xml/K-metal/enter-sandman-QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo.musicxml` / `summary/K-metal/enter-sandman-QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo.txt`
- `xml/K-metal/harvest-hai-to-gensou-no-grimgar-ed-QmcnNkzxpxU5Jvop8JEFcWLa8P13G1e36KDBsFD3zsN9bV.musicxml` / `summary/K-metal/harvest-hai-to-gensou-no-grimgar-ed-QmcnNkzxpxU5Jvop8JEFcWLa8P13G1e36KDBsFD3zsN9bV.txt`
- `xml/K-metal/nightmare-QmQJ2eRNfiiXG6kZQ6dFKMAG8WogkNcyZZker6MzGoS6vu.musicxml` / `summary/K-metal/nightmare-QmQJ2eRNfiiXG6kZQ6dFKMAG8WogkNcyZZker6MzGoS6vu.txt`
- `xml/K-metal/harvest-QmcDe6Ug446hYUiKjrAuFJhxc7nD4FiDVcREc5aWbWCojr.musicxml` / `summary/K-metal/harvest-QmcDe6Ug446hYUiKjrAuFJhxc7nD4FiDVcREc5aWbWCojr.txt`
- `xml/L-artists/avenged-sevenfold-almost-easy-QmSc3G9zSwyGhYXksJCyGQLJBpGfKYC248hC2nTdrySSD6.musicxml` / `summary/L-artists/avenged-sevenfold-almost-easy-QmSc3G9zSwyGhYXksJCyGQLJBpGfKYC248hC2nTdrySSD6.txt`
- `xml/L-artists/enter-sandman-QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo.musicxml` / `summary/L-artists/enter-sandman-QmYRdRvcHEqwRE3fK9apefXYW7X2Xa9mpSG3UebFP63nbo.txt`
- `xml/L-artists/for-whom-the-bell-tolls-Qmecq9RSLpMfuaEajmskZq9ueZGk97qvmdx78JFWNSuiRD.musicxml` / `summary/L-artists/for-whom-the-bell-tolls-Qmecq9RSLpMfuaEajmskZq9ueZGk97qvmdx78JFWNSuiRD.txt`
- `xml/L-artists/metallica-one-Qmc2BawopkxrFy6ekhYKAB8qzukZn4pxFpcefQfQ7X8tP6.musicxml` / `summary/L-artists/metallica-one-Qmc2BawopkxrFy6ekhYKAB8qzukZn4pxFpcefQfQ7X8tP6.txt`
- `xml/L-artists/trough-the-never-metallica-QmYKpXdLhNEmuSxT9zkkmMNDuVSGRyT2bie6J9fhmiPcdn.musicxml` / `summary/L-artists/trough-the-never-metallica-QmYKpXdLhNEmuSxT9zkkmMNDuVSGRyT2bie6J9fhmiPcdn.txt`
- `xml/L-artists/master-of-puppets-metallica-QmZZoMtA54kgni7gFcrBDdSsm1TGMuE1FzomzFbuGfP7Lq.musicxml` / `summary/L-artists/master-of-puppets-metallica-QmZZoMtA54kgni7gFcrBDdSsm1TGMuE1FzomzFbuGfP7Lq.txt`
- `xml/L-artists/space-dementia-QmZ3vfJw1vS5Me9KDoUYSm7RYU4FYSAwioiFHbtogRihgd.musicxml` / `summary/L-artists/space-dementia-QmZ3vfJw1vS5Me9KDoUYSm7RYU4FYSAwioiFHbtogRihgd.txt`
- `xml/L-artists/screenager-QmPJdhKPHYYoLPspsFtYoFX8nzZUkyAuw85Rm7bhmptBub.musicxml` / `summary/L-artists/screenager-QmPJdhKPHYYoLPspsFtYoFX8nzZUkyAuw85Rm7bhmptBub.txt`
- `xml/L-artists/hoodoo-live-piano-QmQGS6WCqjnbvLW5G3HrsBhLhYxyeziMnw2YM1NXx6STUw.musicxml` / `summary/L-artists/hoodoo-live-piano-QmQGS6WCqjnbvLW5G3HrsBhLhYxyeziMnw2YM1NXx6STUw.txt`
- `xml/L-artists/muse-hysteria-Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf.musicxml` / `summary/L-artists/muse-hysteria-Qmc7LuzDPKUXDhC8okv6HHhJSwqKPeAaiLH1utVHn6uGCf.txt`
- `xml/L-artists/ruled-by-secrecy-QmeprydoERiDt7yuEAeGaffavEp97wAPER2AMJwsKXBr5s.musicxml` / `summary/L-artists/ruled-by-secrecy-QmeprydoERiDt7yuEAeGaffavEp97wAPER2AMJwsKXBr5s.txt`
- `xml/L-artists/muse-of-poetry-erato-fischer-johann-kasp-QmPzbknqkv7S6dp3fcZVw3JLztdMA8tFw8qttHdtQd5vCg.musicxml` / `summary/L-artists/muse-of-poetry-erato-fischer-johann-kasp-QmPzbknqkv7S6dp3fcZVw3JLztdMA8tFw8qttHdtQd5vCg.txt`
- `xml/L-artists/isolated-system-QmNkxhgWU4SD1SgRWCjvWLdixkCV4YVgt2wP4F8wNACmri.musicxml` / `summary/L-artists/isolated-system-QmNkxhgWU4SD1SgRWCjvWLdixkCV4YVgt2wP4F8wNACmri.txt`
- `xml/L-artists/apocalypse-please-QmfVhjHh1mgJwF5jKSEZW822CqwhLUDy115Cjx6xRR2NFX.musicxml` / `summary/L-artists/apocalypse-please-QmfVhjHh1mgJwF5jKSEZW822CqwhLUDy115Cjx6xRR2NFX.txt`
- `xml/L-artists/exit-music-for-a-film-advanced-piano-sol-QmTe1Rkt8SBN7667PiUhD3FVaEGQDALGPY9Ur115aYGXyL.musicxml` / `summary/L-artists/exit-music-for-a-film-advanced-piano-sol-QmTe1Rkt8SBN7667PiUhD3FVaEGQDALGPY9Ur115aYGXyL.txt`
- `xml/L-artists/no-surprises-QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M.musicxml` / `summary/L-artists/no-surprises-QmWpwi1NS1M1QxvcLk7aGBH94ZeGz6xgZwA7DQ7dCu1h1M.txt`
- `xml/L-artists/daydreaming-radiohead-QmQ2jgSxs7WtLpWYNhkUsRTkgvXA2q4BPSW48XsnY83N3Q.musicxml` / `summary/L-artists/daydreaming-radiohead-QmQ2jgSxs7WtLpWYNhkUsRTkgvXA2q4BPSW48XsnY83N3Q.txt`
- `xml/L-artists/creep-de-radiohead-QmPmjHdv6GhcNe7h31sNVm1vHKQC8DfteNMyn1jBhpJEch.musicxml` / `summary/L-artists/creep-de-radiohead-QmPmjHdv6GhcNe7h31sNVm1vHKQC8DfteNMyn1jBhpJEch.txt`
- `xml/L-artists/cluster-one-QmRABab4S21y1kSwm5pRfJynAZbSmwWpHs6hzZCbjT7Whp.musicxml` / `summary/L-artists/cluster-one-QmRABab4S21y1kSwm5pRfJynAZbSmwWpHs6hzZCbjT7Whp.txt`
- `xml/L-artists/anisina-QmcNFWCZBCoWFj7gpfjv7qJBJYX58j3SBrh9ruMBreDsg4.musicxml` / `summary/L-artists/anisina-QmcNFWCZBCoWFj7gpfjv7qJBJYX58j3SBrh9ruMBreDsg4.txt`
- `xml/L-artists/autumn-68-QmPXA4DmNdZ9i57iNvMXuggjaPjfuAU5L3NQTS3FpyTbsb.musicxml` / `summary/L-artists/autumn-68-QmPXA4DmNdZ9i57iNvMXuggjaPjfuAU5L3NQTS3FpyTbsb.txt`
- `xml/L-artists/things-left-unsaid-QmQnnagVBhXDRu8vs6JEc59iP52cs1BGCdrWEnaRZie71Q.musicxml` / `summary/L-artists/things-left-unsaid-QmQnnagVBhXDRu8vs6JEc59iP52cs1BGCdrWEnaRZie71Q.txt`
- `xml/L-artists/aloha-oe-QmZ2XRr489YtJVYSs5HUV8G89nKjqXbMUUh6o9eZhc5n51.musicxml` / `summary/L-artists/aloha-oe-QmZ2XRr489YtJVYSs5HUV8G89nKjqXbMUUh6o9eZhc5n51.txt`
- `xml/L-artists/hes-coming-soon-queen-liliuokalani-QmP5sBPMPWDzBMixZdbPM9edRAoEqK6UC9dKCRNAHTPW5f.musicxml` / `summary/L-artists/hes-coming-soon-queen-liliuokalani-QmP5sBPMPWDzBMixZdbPM9edRAoEqK6UC9dKCRNAHTPW5f.txt`
- `xml/L-artists/ode-to-a-pumpkin-i-grew-QmdyRM78Vwe2k96mHJjhaLoYwcsVPgdqNg6WjEQBFYG77A.musicxml` / `summary/L-artists/ode-to-a-pumpkin-i-grew-QmdyRM78Vwe2k96mHJjhaLoYwcsVPgdqNg6WjEQBFYG77A.txt`
- `xml/L-artists/go-and-tell-queen-liliuokalani-QmQYDH4PL6BQtmnAmpBxK6fJ9Z5PRGj1BTQD9aFYJhQtkd.musicxml` / `summary/L-artists/go-and-tell-queen-liliuokalani-QmQYDH4PL6BQtmnAmpBxK6fJ9Z5PRGj1BTQD9aFYJhQtkd.txt`
- `xml/L-artists/breathe-no-more-evanescence-QmWKA8j5XNeR2negDESQyEkDc6M7hpu6ADou6GRHKRKRfb.musicxml` / `summary/L-artists/breathe-no-more-evanescence-QmWKA8j5XNeR2negDESQyEkDc6M7hpu6ADou6GRHKRKRfb.txt`
- `xml/L-artists/my-immortal-in-f-voice-piano-QmVWSZ3vAy8prRv14TRREdLLnXk14UqrYrc1HgeisMAqqe.musicxml` / `summary/L-artists/my-immortal-in-f-voice-piano-QmVWSZ3vAy8prRv14TRREdLLnXk14UqrYrc1HgeisMAqqe.txt`
- `xml/L-artists/lacrymosa-sab-full-band-QmTTjukRKRWvhqR5CoNiFXm1uZrcSCVrGoRua4NF5dSUYv.musicxml` / `summary/L-artists/lacrymosa-sab-full-band-QmTTjukRKRWvhqR5CoNiFXm1uZrcSCVrGoRua4NF5dSUYv.txt`
- `xml/L-artists/everybodys-fool-evanescence-QmQaRBBTZpAsfaLHQVb28qJZb1QhWDrY6g3oF2taJpcZUQ.musicxml` / `summary/L-artists/everybodys-fool-evanescence-QmQaRBBTZpAsfaLHQVb28qJZb1QhWDrY6g3oF2taJpcZUQ.txt`
- `xml/L-artists/lonely-day-QmeuoFT1hEJntEUswkFFoJ8UisTFHhjNiW236bsUeiAG7X.musicxml` / `summary/L-artists/lonely-day-QmeuoFT1hEJntEUswkFFoJ8UisTFHhjNiW236bsUeiAG7X.txt`
- `xml/L-artists/hypnotize-QmUF29MkGVEtuy9EUPXYZKC7S123bircT6W2zJkhhW8e9C.musicxml` / `summary/L-artists/hypnotize-QmUF29MkGVEtuy9EUPXYZKC7S123bircT6W2zJkhhW8e9C.txt`
- `xml/L-artists/dream-theater-disappear-QmbHZSWPLhqk5eU4ErBJNFmYdyFjHggpdCAd2ymqzSitFH.musicxml` / `summary/L-artists/dream-theater-disappear-QmbHZSWPLhqk5eU4ErBJNFmYdyFjHggpdCAd2ymqzSitFH.txt`
- `xml/L-artists/wait-for-sleep-QmX6C6SSN9pgaG7S9i39dU2aNoG12updXDxWjFfA3u3h8x.musicxml` / `summary/L-artists/wait-for-sleep-QmX6C6SSN9pgaG7S9i39dU2aNoG12updXDxWjFfA3u3h8x.txt`
- `xml/L-artists/dream-theater-pull-me-under-QmXD2aZpJZY27ZJjxsS69dysWp9FtvouuQymLi1ibBDTY9.musicxml` / `summary/L-artists/dream-theater-pull-me-under-QmXD2aZpJZY27ZJjxsS69dysWp9FtvouuQymLi1ibBDTY9.txt`
- `xml/L-artists/virus-QmZLmx4e4iS7fXab9qDW1XQkTGhkHDryn36t7g8pYfhZVv.musicxml` / `summary/L-artists/virus-QmZLmx4e4iS7fXab9qDW1XQkTGhkHDryn36t7g8pYfhZVv.txt`
- `xml/L-artists/iron-man-black-sabbath-QmS4UQ3cPqnpBJ2PiBZ5Z79Ky4dg4HEmfSfoJ4D6utRx2g.musicxml` / `summary/L-artists/iron-man-black-sabbath-QmS4UQ3cPqnpBJ2PiBZ5Z79Ky4dg4HEmfSfoJ4D6utRx2g.txt`
- `xml/L-artists/black-sabbath-fluff-QmVXyyBv6Jh46KmF1pY1jGGTuB8XrYDHRT7cuQ48xsPcbe.musicxml` / `summary/L-artists/black-sabbath-fluff-QmVXyyBv6Jh46KmF1pY1jGGTuB8XrYDHRT7cuQ48xsPcbe.txt`
- `xml/L-artists/final-masquerade-QmU6qdsWTZAN5p3wzQNA3HBS6UVSAayhQbrbnwj8LPQ6Vr.musicxml` / `summary/L-artists/final-masquerade-QmU6qdsWTZAN5p3wzQNA3HBS6UVSAayhQbrbnwj8LPQ6Vr.txt`
- `xml/L-artists/leave-out-all-the-rest-linkin-park-QmTAZ6A8z4vBFgQwpN5STorC5osK59XKQV6o1WWJ9vaGc5.musicxml` / `summary/L-artists/leave-out-all-the-rest-linkin-park-QmTAZ6A8z4vBFgQwpN5STorC5osK59XKQV6o1WWJ9vaGc5.txt`
- `xml/L-artists/my-december-QmWYEvKnbTqk4yqWj1pp41PHfTuQU9BaFvLjEqUHxa6bmK.musicxml` / `summary/L-artists/my-december-QmWYEvKnbTqk4yqWj1pp41PHfTuQU9BaFvLjEqUHxa6bmK.txt`
- `xml/L-artists/linkin-park-crawling-piano-score-QmW1fMWmYyYEVrWZMztR41GGEQ6MFvfdpNxvqp2HgDJajh.musicxml` / `summary/L-artists/linkin-park-crawling-piano-score-QmW1fMWmYyYEVrWZMztR41GGEQ6MFvfdpNxvqp2HgDJajh.txt`
- `xml/L-artists/aloha-line-2020-QmYXmyZyGp2FUzjDvVF1zRT4eVcA2XrvSUq543cQW4wY3C.musicxml` / `summary/L-artists/aloha-line-2020-QmYXmyZyGp2FUzjDvVF1zRT4eVcA2XrvSUq543cQW4wY3C.txt`
- `xml/L-artists/the-pretender-QmWUQJBDFEQ9xHjGPWqEn6goguxFEbtu72QvM4FKnQEVWF.musicxml` / `summary/L-artists/the-pretender-QmWUQJBDFEQ9xHjGPWqEn6goguxFEbtu72QvM4FKnQEVWF.txt`
- `xml/L-artists/coldplay-the-scientist-QmcJRkptrVetWEAJibzZgn4FjTLZbb3NWyMnD8Ce9azWNh.musicxml` / `summary/L-artists/coldplay-the-scientist-QmcJRkptrVetWEAJibzZgn4FjTLZbb3NWyMnD8Ce9azWNh.txt`
- `xml/L-artists/coldplay-medley-QmeRk3HNbY1ZQBwETqmegMNJV74dBNZ97KH8k3UEAB8PRm.musicxml` / `summary/L-artists/coldplay-medley-QmeRk3HNbY1ZQBwETqmegMNJV74dBNZ97KH8k3UEAB8PRm.txt`
- `xml/L-artists/speed-of-sound-QmYG2q5NcJCVydHQ66n3b3WULnW5X5NbvprNDtb2wnqq2C.musicxml` / `summary/L-artists/speed-of-sound-QmYG2q5NcJCVydHQ66n3b3WULnW5X5NbvprNDtb2wnqq2C.txt`
- `xml/L-artists/trouble-coldplay-QmTXa9BRcsEwYH6nUY9pyWp4TiZeDrKsuPmActkce1rkh7.musicxml` / `summary/L-artists/trouble-coldplay-QmTXa9BRcsEwYH6nUY9pyWp4TiZeDrKsuPmActkce1rkh7.txt`
- `xml/L-artists/billy-joel-shes-always-a-woman-QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn.musicxml` / `summary/L-artists/billy-joel-shes-always-a-woman-QmfTLaPFzNpyAXD9uRWuokokHm7QPznv2GnNbBBT5ogjDn.txt`
- `xml/L-artists/vienna-billy-joel-QmUkekPKGR983LBTg8oK7QYh1rKLkUmUNnKJrMLWRKm4Nx.musicxml` / `summary/L-artists/vienna-billy-joel-QmUkekPKGR983LBTg8oK7QYh1rKLkUmUNnKJrMLWRKm4Nx.txt`
- `xml/L-artists/and-so-is-goes-QmZTntpWyVxPocpcy7XDb3R5Ck4NxSUF8PdSWWLuEH1SPb.musicxml` / `summary/L-artists/and-so-is-goes-QmZTntpWyVxPocpcy7XDb3R5Ck4NxSUF8PdSWWLuEH1SPb.txt`
- `xml/L-artists/uptown-girl-QmYp2Waj5h4khKz5Tr7D9AHwgMBbaumTxfpDkiVjBE6xKH.musicxml` / `summary/L-artists/uptown-girl-QmYp2Waj5h4khKz5Tr7D9AHwgMBbaumTxfpDkiVjBE6xKH.txt`
- `xml/L-artists/daniel-elton-john-bernie-taupin-piano-co-QmSj1cyUhcFmnhKdibiMpNqoEZkFdM47NxnqbmgVsbup62.musicxml` / `summary/L-artists/daniel-elton-john-bernie-taupin-piano-co-QmSj1cyUhcFmnhKdibiMpNqoEZkFdM47NxnqbmgVsbup62.txt`
- `xml/L-artists/the-king-QmTLkSX6MxkF9n4dF3FMH7cvfjR4vSLkvbjQRkL3EpWVzP.musicxml` / `summary/L-artists/the-king-QmTLkSX6MxkF9n4dF3FMH7cvfjR4vSLkvbjQRkL3EpWVzP.txt`
- `xml/L-artists/elton-john-rocket-man-QmeQQcvhQttDeWkUeWsMd71pG6WgJtAwv6xuDShh7YUy7B.musicxml` / `summary/L-artists/elton-john-rocket-man-QmeQQcvhQttDeWkUeWsMd71pG6WgJtAwv6xuDShh7YUy7B.txt`
- `xml/L-artists/easy-piano-elton-john-can-you-feel-the-l-QmTwsXtFetmmCqQeGQgxQZjdjHn14n6L57B4C6dCEgEq7D.musicxml` / `summary/L-artists/easy-piano-elton-john-can-you-feel-the-l-QmTwsXtFetmmCqQeGQgxQZjdjHn14n6L57B4C6dCEgEq7D.txt`
- `xml/L-artists/something-the-beatles-QmPoKC1KNnhFURL5QSo3DRkGEWAoRgDiDEUchNJt79dGRo.musicxml` / `summary/L-artists/something-the-beatles-QmPoKC1KNnhFURL5QSo3DRkGEWAoRgDiDEUchNJt79dGRo.txt`
- `xml/L-artists/she-is-not-a-girl-who-misses-much-openin-QmeEtYGFYUSj7MtF3AqZ2q5BBcFBNKHYb4DxZSbSensoXJ.musicxml` / `summary/L-artists/she-is-not-a-girl-who-misses-much-openin-QmeEtYGFYUSj7MtF3AqZ2q5BBcFBNKHYb4DxZSbSensoXJ.txt`
- `xml/L-artists/happy-xmas-war-is-over-QmQ1qVi1RHonfqDZydkmHSwTDQ7vzE8rQdojdK2BXTPPw1.musicxml` / `summary/L-artists/happy-xmas-war-is-over-QmQ1qVi1RHonfqDZydkmHSwTDQ7vzE8rQdojdK2BXTPPw1.txt`
- `xml/L-artists/imagine-QmXAocpmyAT6PCMWzLDkz2c7j8UeafVmZsCg4eLgNKwEN7.musicxml` / `summary/L-artists/imagine-QmXAocpmyAT6PCMWzLDkz2c7j8UeafVmZsCg4eLgNKwEN7.txt`
