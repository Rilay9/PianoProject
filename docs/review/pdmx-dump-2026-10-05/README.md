# PDMX dump for latin.4, ragtime.4 and latin.8 (2026-10-05)

This is the raw material for the reviewer's edition review. There is no pedagogical judgment here. Every fact comes from `PDMX.csv` or from the MusicXML itself.

- `xml/`: 26 uncompressed MusicXML files. Each file is named `<title slug>-<CID>.musicxml`.
- `summary/`: one text file per score. It lists each measure's notes by staff and voice. A token reads `pitch:duration` (`q` quarter, `8` eighth, `16` sixteenth, a dot for dotted). Chord notes are joined with `+`, `r` is a rest and `~` is a tie. The file also gives key, time, tempo, repeats and accents.
- `rows.json`: the CSV row for each of the ten given CIDs, and every exact-title copy. Each copy is marked dumped or not, with the reason. A copy was dumped when it is a valid file and every track is a piano sound (General MIDI program 0–7).
- `search.json`: two term searches. They look in song name, title, subtitle, artist, composer, tags and genres, ignoring case and accents. For each search it gives the total matches, the count per term, and the top 20 rows. Rows matching more terms rank first, then by views.

## Read this first: staff count

Counted from each file's `<staves>` element and its parts. Each part's summary header gives the count.

- **Two staves, piano solo:** the three Harlem Rag editions, the piano Libertango (QmakqtZzLrMc…) and Oblivion (M83).
- **One staff only:** all 11 Whistling Rufus copies, Creole Belles, both At a Georgia Camp Meeting files, La Paloma, the Libertango guitar part, Glory of Cyrodiil and Grimes's Oblivion.

The CSV calls these one-staff files piano, but they have no bass staff. Creole Belles, Whistling Rufus (Qmc5tchYeaAX…) and the piano Georgia Camp Meeting (QmdSRtEBHxju…) contain no chords at all: they are the melody alone. The other one-staff files were not checked for chords.

## The given CIDs, checked against the CSV

| Lane | Indexed as | CID | What the CSV says it is | Tracks (GM program) | Bars |
|---|---|---|---|---|---|
| latin.4 | La Paloma | Qmcgs76azinB… | La Paloma, Iradier | one track, guitar (24) | 83 |
| latin.4 | El Manisero | QmQYBa6d8TFc… | The Peanut Vendor, Simons, arr. Kempton | piano plus choir (0, 52) | 89 |
| latin.4 | Siboney | QmQXGEUjpn8E… | Siboney | piano, bass, strings (0, 32, 48) | 65 |
| latin.4 | Maria Elena | QmbL2Uaqiiw8… | **"La vaca estudiosa"**, a children's song by María Elena Walsh | piano (0, 6) | 16 |
| ragtime.4 | At a Georgia Campmeeting | QmY7h6JChL1C… | Mills, **French horn part** | horn (60) | 160 |
| ragtime.4 | Whistling Rufus | Qmc5tchYeaAX… | Whistling Rufus | piano | 33 |
| ragtime.4 | Harlem Rag | QmaUQo93TVPN… | Harlem Rag (1899, DeLisle), Turpin | piano | 130 |
| ragtime.4 | Creole Belles | QmQiUJZTS6rG… | Creole Belles | piano | 102 |
| latin.8 | Libertango | Qmbhyzu7ry2J… | "Libertango Part 1"; the CSV's song name is **El Choclo** | guitar (24) | 152 |
| latin.8 | Oblivion | Qmb87WHov6CX… | **"Glory of Cyrodiil", Jeremy Soule** (a video-game theme) | piano | 32 |

## Other piano-only editions in the dump

- **Libertango:** QmakqtZzLrMc… (piano solo/accordion solo), 188 bars, rated 4.72 by 590 people, 125,293 views. A search of every piano-only row mentioning Piazzolla, Libertango or Oblivion found this as the only piano-solo Libertango.
- **Oblivion:** every Piazzolla Oblivion in PDMX has another instrument or is an ensemble. The two piano-only "Oblivion" files in the dump are pop songs: QmRqYM9Xi5QZ… (Grimes) and QmX8ubweNcet… (M83).
- **At a Georgia Camp Meeting:** QmdSRtEBHxju…, piano, 53 bars.
- **Whistling Rufus:** 11 piano copies, between 17 and 143 bars long. All of them are dumped.
- **Harlem Rag:** two more piano editions besides the given one: QmV57a6npmno… "Harlem Rag (1897)", 130 bars, and QmXBVYcvQsE8… "The Harlem Rag (1899, Tyers)", 147 bars. The first pass missed both because the title match does not strip brackets, so they were added in a second pass.
- **Maria Elena:** PDMX has no copy with this title.
- **La Paloma:** all four copies are for guitar or ensemble. There is no piano copy.

## Search rows not in this dump (CSV data only)

- **Qmc6P2a11mJa…**, Bizet, Habanera, piano solo, 60 bars, rated 4.85 by 451 people.
- **QmYAihNhTVzw…**, "Contra Danza", anonymous, piano, 87 bars.
- **QmXuMn7vq7C5…**, Piazzolla, "El gordo triste", piano, 75 bars.

Ask for their MusicXML by CID if the review needs it.

### Added on the second request (now in `xml/` and `summary/`; rows in `rows.json` under `added_2026_10_05_second_request`)

| CID | Title | Composer | Staves | Meter | Bars | Licence in the CSV |
|---|---|---|---|---|---|---|
| Qmc6P2a11mJaEgAdyvsqiWW9dSt7HazcVSSsU7oRtQ3ptu | Habanera, piano solo | Bizet | 2 | 2/4 | 60 | cc-zero |
| QmYAihNhTVzw5EyFcXFRD7f5gkwnnDKRnH1gTnf4e5frxs | Contra Danza | anonymous | 2 | 2/4, and 6/8 for part of the piece | 87 | cc-zero |
| QmXuMn7vq7C5PEYMc3J6yU5sfCrN13jRmcHy2PG3xVRhsG | El gordo triste | Piazzolla, lyrics by Ferrer | 2 | 4/4 | 75 | cc-zero |

**Rights: an open question, not decided here.** For both Piazzolla scores (this one and Libertango QmakqtZzLrMc…), the cc-zero is the licence the uploader gave their own arrangement. Piazzolla died in 1992, so his compositions are presumably still under copyright, and the uploader's cc-zero would not clear that. The project ships only what it has rights to. Before either Piazzolla score is marked KEEP, someone has to decide whether the project can ship a Piazzolla arrangement. Bizet (who died in 1875) and Turpin's rags (1897 and 1899) have no such question.

## Searches with zero matches

Saumell, Milonga del Ángel, Primavera Porteña, Verano Porteño and "tango nuevo" matched no row in the fields listed above.
