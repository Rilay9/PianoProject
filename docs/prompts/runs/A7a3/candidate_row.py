"""The one-row candidates.json for QmTj (H1 workaround; extract.py --cid and quarry.py read
only candidates.json or index.json). Instead of writing the row by hand, the QmTj CSV row is
put in a one-row CSV and run through shortlist.select() itself (its gates, composer match,
bucket, band), with a quota that admits it, so the candidate fields are the shortlist's own.
The header is the real archive's fingerprint (shortlist.fingerprint over the full CSV), which
commit.py reads to name the Zenodo record.

Usage: py -3.11 candidate_row.py   (PIANOPATH_PDMX_DIR set)
"""
from __future__ import annotations

import csv
import json
import os
import sys
from dataclasses import asdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(REPO / "tools" / "content"))
from pdmx import shortlist  # noqa: E402
from pdmx.composers import ComposerTable  # noqa: E402

CIDS = {"Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs", "QmYutJi8H9KmexPTGDuRXTzQNkqnu1Jk8ERW1gZiMs33ZG"}
ARCHIVE = Path(os.environ["PIANOPATH_PDMX_DIR"])
csv.field_size_limit(10**9)

(HERE / "pdmx").mkdir(exist_ok=True)
one = HERE / "pdmx" / "one-row.csv"
total = 0
with open(ARCHIVE / "PDMX.csv", encoding="utf-8", newline="") as fh, open(one, "w", encoding="utf-8", newline="") as out:
    reader = csv.DictReader(fh)
    writer = csv.DictWriter(out, fieldnames=reader.fieldnames)
    writer.writeheader()
    for row in reader:
        total += 1
        if shortlist.cid_of(row.get("mxl") or "") in CIDS:
            writer.writerow(row)
            print({k: row[k] for k in ("title", "song_name", "composer_name", "artist_name", "tracks", "n_tracks",
                                       "song_length.bars", "rating", "n_ratings", "n_views", "license", "genres",
                                       "subset:deduplicated", "has_lyrics", "metadata", "mxl")})
quotas = {b: {k: 2 for k in ("classical", "folk-hymn-carol", "pop-film-game", "jazz-latin")} for b in shortlist.BANDS}
# The shortlist's `subsets` gate (subset:no_license_conflict) rejects QmTj: a licence
# recommendation, and rights gate nothing here (owner decision 2026-10-05). It is why the row is
# in neither candidates.json nor the index. Dropped for this one row only, and recorded; every
# other gate runs as written.
first = shortlist.select(one, ComposerTable.load(), shortlist.load_wants(), quotas, 0,
                         shortlist.load_verifications())
print("with every gate: chosen", len(first[0]), "rejections", dict(first[1].counts))
shortlist.GATES = tuple(g for g in shortlist.GATES if g[0] != "subsets")
print("gates run:", [g[0] for g in shortlist.GATES])
chosen, rejections, summary = shortlist.select(one, ComposerTable.load(), shortlist.load_wants(), quotas, 0,
                                               shortlist.load_verifications())
print("rejections:", dict(rejections.counts))
print("chosen:", [(c.cid, c.bucket, c.band, c.over_quota, c.composition_status) for c in chosen])
header = {"pdmxDir": str(ARCHIVE), "layout": "mxl.tar.gz",
          "note": "two-row shortlist for the A7a.3 probe (the BB1 workaround): the Qmdyj (St James) and QmYutJ (St. Louis Blues) CSV rows run through "
                  "shortlist.select() over a one-row CSV; extract.py --cid and quarry.py read only "
                  "candidates.json or index.json"}
header.update(shortlist.fingerprint(ARCHIVE / "PDMX.csv", total))
(HERE / "pdmx" / "candidates.json").write_text(
    json.dumps({"header": header, "candidates": [asdict(c) for c in chosen]}, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8")
print("wrote candidates.json; header", {k: header[k] for k in header if k != "note"})

