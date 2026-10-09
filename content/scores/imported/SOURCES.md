# Imported score provenance

One row per fetched source, appended by `tools/content/fetch.py`. This file is
the record that satisfies rule 6 of `docs/03-content-pipeline.md` §1: anything
bundled with the app has to be traceable back to where it came from and under
what licence.

Rows are keyed by source id + path, so re-running the fetch updates a row in
place rather than appending a duplicate.

| source | path | url | licence | pd_region | fetched | revision | files |
|---|---|---|---|---|---|---|---|
| kern-bach-370-chorales | kern/bach-370-chorales | https://github.com/craigsapp/bach-370-chorales.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T04:13:49+00:00 | 0fd9e00 | 370 |
| kern-beethoven-piano-sonatas | kern/beethoven-piano-sonatas | https://github.com/craigsapp/beethoven-piano-sonatas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T04:13:45+00:00 | 2d6627b | 103 |
| kern-chopin-mazurkas | kern/chopin-mazurkas | https://github.com/craigsapp/chopin-mazurkas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T04:13:46+00:00 | fc3a8fb | 52 |
| kern-chopin-preludes | kern/chopin-preludes | https://github.com/craigsapp/chopin-preludes.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T04:13:45+00:00 | f8fb01f | 24 |
| kern-haydn-piano-sonatas | kern/haydn-piano-sonatas | https://github.com/craigsapp/haydn-piano-sonatas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T04:13:50+00:00 | 299abc8 | 25 |
| kern-joplin | kern/joplin | https://github.com/craigsapp/joplin.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T04:13:48+00:00 | ad0840e | 47 |
| kern-mozart-piano-sonatas | kern/mozart-piano-sonatas | https://github.com/craigsapp/mozart-piano-sonatas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T04:13:44+00:00 | 0f1f49d | 69 |
| kern-scarlatti-keyboard-sonatas | kern/scarlatti-keyboard-sonatas | https://github.com/craigsapp/scarlatti-keyboard-sonatas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T04:13:47+00:00 | 567731b | 65 |
| musetrainer | musetrainer | https://github.com/musetrainer/library.git | Public Domain (blanket claim by musetrainer/library; no LICENSE file, no per-file terms) | US | 2026-09-06T04:13:43+00:00 | 9128876 | 69 |
| mutopia | mutopia/published/JoplinS/PineappleRag | https://www.mutopiaproject.org/ftp/JoplinS/PineappleRag | Public Domain (the edition's .ly header) | worldwide | 2026-09-29 | Mutopia-2014/01/12-1899 | 2 |
| nifc-chopin | kern/chopin-first-editions | https://github.com/pl-wnifc/humdrum-chopin-first-editions.git | CC BY 4.0 (Fryderyk Chopin Institute; LICENSE.txt) | worldwide | 2026-09-06T04:13:52+00:00 | 95dfb10 | 512 |
| asap-dataset | asap-dataset | https://github.com/fosfrancesco/asap-dataset.git | CC BY-NC-SA 4.0 (README License section; LICENSE.md) | worldwide | 2026-10-09 | afc815c | 235 musicxml scores (plus 1302 performance .mid, not used) |
| cipi | - | https://zenodo.org/records/8037327 | not stated (Zenodo access_right: restricted) | - | 2026-10-09 | - | skipped: Zenodo record 8037327 is restricted access (no downloadable files); GitHub repos PRamoneda/CIPI_ismir and difficulty-prediction-CIPI hold code and about 10 example musicxml only, not the dataset |
| openewld | openewld | https://github.com/00sapo/OpenEWLD.git | MIT (LICENSE); README: all content "should be free of copyright" (public-domain lead sheets) | unspecified (claimed public domain) | 2026-10-09 | ec03cbd | 479 mxl (486 in repo; 7 not checked out on Windows: '?' or over-long file names) |
| kern-scriabin | scriabin | https://github.com/craigsapp/scriabin.git | none stated (no LICENSE file; README only) | worldwide | 2026-10-09 | 7daa113 | 207 krn |
| kern-musikalisches-wuerfelspiel | musikalisches-wuerfelspiel | https://github.com/craigsapp/Musikalisches-Wuerfelspiel.git | none stated (no LICENSE file) | worldwide | 2026-10-09 | 55f93e6 | 1 krn |
| nottingham-dataset | nottingham-dataset | https://github.com/jukedeck/nottingham-dataset.git | GPL-3.0 (LICENSE.md; cleaned copy of the Nottingham Music Database) | worldwide (traditional tunes) | 2026-10-09 | 0992bb6 | 28 abc (14 ABC_cleaned + 14 ABC_original; 1034 tunes in cleaned) |
