# Candidate packet: retrieval only (no classification)

Find each candidate below in the local PDMX archive or the app catalogue. Save its original MusicXML unchanged. Write one manifest. **Never decide whether a piece has the musical characteristic:** the reviewer reads the XML afterwards.

## Tools and data (local)
- **Archive CSV:** `C:\Users\yalir\repos\Piano Stuff\PDMX.csv`, with about 37,000 rows of uploader metadata. Search it with `python tools/content/archive_search.py --title "<title>" [--artist "<name>"] --limit 30` (repeat `--title` for aliases; `--help` lists the options).
- **Scores:** the `.mxl` files are in `C:\Users\yalir\repos\Piano Stuff\mxl.tar.gz`, or already unpacked under `build/pdmx/library/<first two chars of cid>/<cid>.mxl`. Read `tools/content/archive_notation.py` to see how it locates and opens a content id (cid).
- **Catalogue items** (ids such as `song.classical.beethoven-moonlight-i`): `app/public/content/catalog.json` gives each one's `file`; the file is under `app/public/content/`.
- **An `.mxl` is a zip.** Read `META-INF/container.xml` for the root file's path, then write that XML out byte-for-byte as UTF-8. Never re-export, convert, simplify, quantize, merge voices, or strip chord symbols, directions or articulations.

## Rules
- **Search aliases:** punctuation variants, composer or artist names, likely arrangement names.
- **Prefer piano or piano-solo arrangements;** keep a full score if that is all there is.
- **Up to 3 materially different arrangements per candidate.**
- **A cid named below is used as given;** you may add up to 2 more arrangements.
- **Not found:** write a row with `NOT FOUND`. Never substitute a similar piece.
- **Montuno and tumbao (L.5):** add other titles only when a reputable external source names them as montuno or tumbao vehicles. Say which source in `why_candidate`, and never pick by genre adjacency.

## Output
- **Files:** each XML as `C:\Users\yalir\repos\Piano Stuff\PianoProject\build\candidate-packet\<target letter>-<short-slug>-<cid or catalog id>.musicxml`.
- **Manifest:** `build/candidate-packet/MANIFEST.md`, a markdown table with these columns:
  `target | candidate | artist/composer | archive/catalog id | filename | arrangement/version | parts/staves | bars | why_candidate | notes`
  - Parts and staves come from the XML (count `<score-part>` and `<staves>`); bars are the count of `<measure` in the first part.
  - `why_candidate` repeats the reason given below, for example "repertoire research suggests a canonical power-chord riff". **It never says "verified".**
- **Order:** do targets A to L first, then N and O.
- **Never commit, push, switch branches or edit tracked files.** Write only under `build/candidate-packet/`.
- **Reply:** a short summary with the count found and not found per target, and any tool problem.

## The candidates (verbatim from the reviewer)

A. Power chord / open fifth / heavy riff:
1. You Really Got Me (The Kinks): central repeated root–fifth riff.
2. Iron Man (Black Sabbath): main riff as moving power-chord dyads.
3. All Day and All of the Night (The Kinks).
4. Smells Like Teen Spirit (Nirvana).
5. Blitzkrieg Bop (Ramones).
6. Paranoid (Black Sabbath).
7. Smoke on the Water (Deep Purple): ADVERSARY. The riff is parallel fourths in the original.
8. Seven Nation Army (The White Stripes): ADVERSARY or section test.
9. Also House of the Rising Sun, cid `Qmc3v934xFCPJrgGpH9J8G5qTUhebhrysLwPEFEXhYgStR`, as a comparison only.

B. Repeating arpeggio / broken-chord accompaniment:
1. House of the Rising Sun, cid `Qmc3v934xFCPJrgGpH9J8G5qTUhebhrysLwPEFEXhYgStR`.
2. Moonlight Sonata I, catalogue `song.classical.beethoven-moonlight-i`.
3. Chopin Nocturne Op. 9 No. 2, cid `QmeE94j6WFzcwouwfE2LTAgfVMfeS4XM7ZyLtezSmrSLUt`.
4. Satie Gymnopédie No. 1, cid `Qmb69dY9CoqiRXre3yTcR6NDcgadeZJsBAbSuqBW6kZt7M`: CONTRAST.
5. Nothing Else Matters (Metallica): search.
6. Clocks (Coldplay): search; ostinato contrast.

C. Alberti bass:
1. Mozart K. 545 first movement, cid `QmPaDt5oro5S5MxK47tRyuppCxwhyyTfe5568yRv4494KE` if it is that movement; otherwise another K. 545 copy.
2. Catalogue `song.pop.sonatina-in-g.pdmx`.
3. Clementi Sonatina Op. 36 No. 1: search composer and work-number variants.
4. Moonlight I: negative.
5. House of the Rising Sun: negative.

D. Waltz bass:
1. Catalogue `song.classical.chopin-chopin-waltz-in-a-minor-piano-solo.pdmx`.
2. Catalogue `song.classical.chopin-waltz-op69-2.nifc`.
3. The Blue Danube (Johann Strauss II): search.
4. Catalogue `song.folk.happy-birthday.simple`.
5. Gymnopédie No. 1: NEGATIVE.
6. Bethena (Joplin): NEGATIVE.

E. Ragtime:
1. At a Georgia Campmeeting, `QmY7h6JChL1C6qr1SetxcTPtNan4mtPaSjphi2QKZ6x9fw`.
2. Whistling Rufus, `Qmc5tchYeaAXcWs6eadtwesTcn8oXiyJMvJYiSWxR87ZkY`.
3. Harlem Rag, `QmaUQo93TVPNaJ6UDzttTyksRcPDcyafR8Nxct8qXHeEsj`.
4. Creole Belles, `QmQiUJZTS6rGpgqQJxthN2Bzckf9oZvpTw8bN3y8oxWAkp`.
5. The Strenuous Life, `QmT34q9w9QBs4cQ3NsMV7ku2ssXXLtr8CB741M3E6PVEd9`.
6. The Entertainer (catalogue).
7. The Easy Winners (catalogue).
8. Maple Leaf Rag (catalogue).
9. The Ragtime Dance, `QmQqgminBuThDMiK7kKiiebrXeF3uvNxUGH2Pce5CJ3Wut`.

F. Stride:
1. Carolina Shout, `QmX3XfoL3Mfdg1pvtTkft7xezdEJQPbu3H9z8qoH7TNrda`.
2. Catalogue `song.blues.handful-of-keys`.
3. Twelfth Street Rag, `QmdDBR2fHDvdhMvF69mr8rj2kJggBFhZNbpxYEcBHPutmc`.
4. Honeysuckle Rose, `QmSMULfFJDNDH2UyUeNLWgm33MQ9gy2zAfjAXoEALHg7Ds`.
5. Squeeze Me, `QmTw3EQxygcbdDsDvKz6zRd2fjCGsvJGhG7C6aAYbCnyq8`.
6. The Entertainer: boundary.

G. Boogie-woogie:
1. Catalogue `song.folk.boogie-woogie.pdmx`.
2. Catalogue `exercise.boogie.a.pinetop`: a reference only.
3. Pinetop's Boogie Woogie: search aliases.
4. Honky Tonk Train Blues (Meade Lux Lewis): search.
5. Yancey Special (Jimmy Yancey): search.
6. Jelly Roll Blues, `QmbuoFtkky8Xpo8LSiAqkMXzBs2Mtc33L6GFw1kWv9T5S3`: boundary.
7. Royal Garden Blues (catalogue): negative.

H. Walking bass:
1. Autumn Leaves, `QmWLjxJSdX1VjYwcEkDYhj7CDhWLX4rFbSakCxiGTJWT7T`.
2. Sweet Georgia Brown, `QmSpTeaiyNZDk45njpe1Fe7VGcFAzBhJy4HuuGj2btnwb5`.
3. Catalogue `song.pop.ray-henderson-bye-bye-blackbird.pdmx`.
4. Body and Soul, `QmYLYgVPrVGkZeZgSjjBDYFUpTBWa8bXTB834ci6L7HQYN`.
5. At the Jazz Band Ball, `QmNuUoVirfoCCXKEsHyvT2JNczwEDp8vAuVdygoo25h7GQ`.
6. Catalogue `song.folk.muskrat-ramble.pdmx`.

I. Blues form, shuffle and "called blues":
1. Careless Love (catalogue).
2. St. Louis Blues, the catalogue copy plus `QmYutJi8H9KmexPTGDuRXTzQNkqnu1Jk8ERW1gZiMs33ZG`.
3. Joe Turner Blues, `QmXbcEgNyEXXfV5SKFQ4rK5eJi3xTtPJQm9kMVgM7GTWVK`.
4. Jelly Roll Blues, `QmbuoFtkky8Xpo8LSiAqkMXzBs2Mtc33L6GFw1kWv9T5S3`.
5. Royal Garden Blues (catalogue).
6. Farewell Blues, `QmStEZqKASQVCFNhKaHLcQm3R3RbDUPKA477NQ6kWsNToy`.
7. New Orleans Blues, `QmbQRktDiVKVCdRwZc7XKQ7gjJxdFRzHwD68nv7AQhtRtM`.

J. Habanera, tresillo and son:
1. La Paloma, `Qmcgs76azinB9yQhdDYdtxANyCGnNRoztYusifLBEC9rjr`.
2. Habanera from Carmen (Bizet): search.
3. El Manisero, `QmQYBa6d8TFceraxiiZPSyufbgmR6tQZWycAWUafpQ7YHv`.
4. Catalogue `song.pop.guantanamera.pdmx`.
5. La Bamba, `QmbiVDmVP66oR6FTV6xdzRRjPSVk9NKjboh6JgrezTW6HT`: boundary.

K. Bossa nova:
1. The Girl from Ipanema, `QmbePogksNuacefKjPnFMTEPad7EfR6ugFNirGLLckffJr`.
2. Corcovado, `QmWYgg7QifpX4XtkYReco3Psk4GvNgzbeZMeqTBUvabUgF`.
3. Chega de Saudade, `Qmcnc6BPWUhP1fk6GKoXEH35gSvJNi87bKz4cy5s6xuYTV`.
4. Só Danço Samba, `QmbmC9BRdBLb6XUbyf5TqSy1P1oYdNDYTJoSpd4nXByPMD`.
5. Catalogue `song.folk.insensatez-how-insensitive-jobim.pdmx`.

L. Montuno and tumbao:
1. Oye Como Va: search.
2. Son de la Loma: search.
3. El Cuarto de Tula: search.
4. Chan Chan: search.
5. Others named by a reputable external source as montuno or tumbao vehicles; record why. Do not use Tico-Tico, La Bamba, a tango or a generic Latin piece.
6. El Manisero as a comparison.

M. Tango:
1. La Cumparsita (catalogue).
2. El Choclo (catalogue).
3. Por una Cabeza, `QmPqGm73syTAnvaFSwHWB5nTi3KEMybjqMYRVRox2eejWb`.
4. Jalousie, `QmbEXBfVDk9iNqKRoXudwgcVKFL9yagDcFvwqAwvLt5h5H`.
5. Caminito, `QmWPVaLZLid7D3fiNRhaKPxH36zWf2Pu3JLFxxQYFRRwDV`.

N. Hymn four-part texture:
1. Holy, Holy, Holy, `QmbLfyErVgweCgsLYtW4CV2GvCwayZjJDqtLpccRmvCgdF`.
2. Nearer, My God, to Thee, `QmbFPMXf26skEX8RvUSZ5dGSuFXefEwFJ7GXiCfgjS6q2o`.
3. O Sacred Head, `QmdaDUP6oT6F8GzuiwAH1p2fM3mFDjCFJAVKBqVnBs1zTJ`.
4. Abide With Me (catalogue).
5. The Old Rugged Cross, `QmWWXx9wyvbokCusjeDXuxxxn4UBEqS1YoxRPdZ7Nfz2cL`.

O. Gospel walk-ups:
1. Just a Closer Walk with Thee (catalogue).
2. Down by the Riverside, `Qmb9PJUwBUhctigVCmYjYRbXCreScTLWcBWjL8bFW3Lr4w`.
3. Wade in the Water, `QmQD2gCz8DdiQi2PXv5NGqFNjXjCyTkiNYKXJwonegt3Wm`.
4. This Little Light of Mine, `QmdJuSiZwpjM6eSVwnFADjegSDNq5un3sffnvKjGSj5ujz`.
5. Oh Happy Day, `QmX54pQMc7EsMigfosNb4ifAzdiSDh8PcEtSzhBLSCV2NK`.

For a catalogue item named by title only ("(catalogue)"), find its id in `catalog.json` by title. More than one match: include up to 3. None: NOT FOUND.
