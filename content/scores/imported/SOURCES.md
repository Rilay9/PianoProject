# Imported score provenance

One row per fetched source, appended by `tools/content/fetch.py`. This file is
the record that satisfies rule 6 of `docs/03-content-pipeline.md` §1: anything
bundled with the app has to be traceable back to where it came from and under
what licence.

Rows are keyed by source id + path, so re-running the fetch updates a row in
place rather than appending a duplicate.

| source | path | url | licence | pd_region | fetched | revision | files |
|---|---|---|---|---|---|---|---|
| kern-bach-370-chorales | kern/bach-370-chorales | https://github.com/craigsapp/bach-370-chorales.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-05T06:48:08+00:00 | 0fd9e00 | 370 |
| kern-bach-370-chorales | kern\bach-370-chorales | https://github.com/craigsapp/bach-370-chorales.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T03:20:01+00:00 | 0fd9e00 | 370 |
| kern-beethoven-piano-sonatas | kern/beethoven-piano-sonatas | https://github.com/craigsapp/beethoven-piano-sonatas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-05T06:48:08+00:00 | 2d6627b | 103 |
| kern-beethoven-piano-sonatas | kern\beethoven-piano-sonatas | https://github.com/craigsapp/beethoven-piano-sonatas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T03:20:01+00:00 | 2d6627b | 103 |
| kern-chopin-mazurkas | kern/chopin-mazurkas | https://github.com/craigsapp/chopin-mazurkas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-05T06:48:08+00:00 | fc3a8fb | 52 |
| kern-chopin-mazurkas | kern\chopin-mazurkas | https://github.com/craigsapp/chopin-mazurkas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T03:20:01+00:00 | fc3a8fb | 52 |
| kern-chopin-preludes | kern/chopin-preludes | https://github.com/craigsapp/chopin-preludes.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-05T06:48:08+00:00 | f8fb01f | 24 |
| kern-chopin-preludes | kern\chopin-preludes | https://github.com/craigsapp/chopin-preludes.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T03:20:01+00:00 | f8fb01f | 24 |
| kern-haydn-piano-sonatas | kern/haydn-piano-sonatas | https://github.com/craigsapp/haydn-piano-sonatas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-05T06:48:08+00:00 | 299abc8 | 25 |
| kern-haydn-piano-sonatas | kern\haydn-piano-sonatas | https://github.com/craigsapp/haydn-piano-sonatas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T03:20:01+00:00 | 299abc8 | 25 |
| kern-joplin | kern/joplin | https://github.com/craigsapp/joplin.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-05T06:48:08+00:00 | ad0840e | 47 |
| kern-joplin | kern\joplin | https://github.com/craigsapp/joplin.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T03:20:01+00:00 | ad0840e | 47 |
| kern-mozart-piano-sonatas | kern/mozart-piano-sonatas | https://github.com/craigsapp/mozart-piano-sonatas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-05T06:48:08+00:00 | 0f1f49d | 69 |
| kern-mozart-piano-sonatas | kern\mozart-piano-sonatas | https://github.com/craigsapp/mozart-piano-sonatas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T03:20:01+00:00 | 0f1f49d | 69 |
| kern-scarlatti-keyboard-sonatas | kern/scarlatti-keyboard-sonatas | https://github.com/craigsapp/scarlatti-keyboard-sonatas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-05T06:48:08+00:00 | 567731b | 65 |
| kern-scarlatti-keyboard-sonatas | kern\scarlatti-keyboard-sonatas | https://github.com/craigsapp/scarlatti-keyboard-sonatas.git | see repository LICENSE/README (Humdrum editions by Craig Sapp) | worldwide | 2026-09-06T03:20:01+00:00 | 567731b | 65 |
| musetrainer | musetrainer | https://github.com/musetrainer/library.git | Public Domain (blanket claim by musetrainer/library; no LICENSE file, no per-file terms) | US | 2026-09-06T03:20:01+00:00 | 9128876 | 69 |
| nifc-chopin | kern\chopin-first-editions | https://github.com/pl-wnifc/humdrum-chopin-first-editions.git | CC BY 4.0 (Fryderyk Chopin Institute; LICENSE.txt) | worldwide | 2026-09-06T03:20:01+00:00 | 95dfb10 | 512 |
