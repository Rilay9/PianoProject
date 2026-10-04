# PDMX, piano only, licence-safe, deduplicated

From `PDMX.csv` (254,077 rows): kept rows with `subset:no_license_conflict`, `subset:valid_mxl_pdf` and `is_best_unique_arrangement` all true, and every track a General MIDI piano program (0 to 7). **42196 rows**, sorted by title, split into `piano-NN.csv` files of 2500 rows; `piano-rated.csv` holds the 4163 rows with at least one rating.

`cid` fetches the score (the orchestrator extracts the MusicXML on request). Columns are uploader metadata plus PDMX's three computed features: they nominate candidates and never establish what the music contains.
