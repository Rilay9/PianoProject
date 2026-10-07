"""The one-row candidates.json for Qmb7 (BB1's single-CID workaround, the third item to need it;
extract.py --cid and quarry.py read only candidates.json or index.json). The Qmb7 CSV row is put
in a one-row CSV and run through shortlist.select() itself, so the candidate fields are the
shortlist's own; the header is the real archive's fingerprint, which commit.py reads.
Copied from BB1's build/probe/A7b1-probe/candidate_row.py with the CID and the note changed.

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

CID = "Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi"
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
        if shortlist.cid_of(row.get("mxl") or "") == CID:
            writer.writerow(row)
            print({k: row[k] for k in ("title", "song_name", "composer_name", "artist_name", "tracks", "n_tracks",
                                       "song_length.bars", "rating", "n_ratings", "license", "genres",
                                       "subset:deduplicated", "subset:no_license_conflict", "has_lyrics", "mxl")})
quotas = {b: {k: 1 for k in ("classical", "folk-hymn-carol", "pop-film-game", "jazz-latin")} for b in shortlist.BANDS}
first = shortlist.select(one, ComposerTable.load(), shortlist.load_wants(), quotas, 0,
                         shortlist.load_verifications())
print("with every gate: chosen", len(first[0]), "rejections", dict(first[1].counts))
with open(one, encoding="utf-8", newline="") as fh:
    the_row = next(csv.DictReader(fh))
print("each gate on the row:", {name: fn(the_row) for name, fn in shortlist.GATES})
# Two CSV gates are set aside for this one row only, recorded:
# - `subsets` (subset:no_license_conflict) is a licence recommendation; rights gate nothing here
#   (owner decision 2026-10-05), as BB1 did for Blue Bossa;
# - `piano tracks` reads the CSV's track count (3, want 1 or 2). Shape is read from the XML, never
#   from the CSV (INTAKE-GATE G5-G7, packet section 13); G4-G7 decide this file's shape by hand.
# Every other gate runs as written.
DROPPED = ("subsets", "piano tracks")
shortlist.GATES = tuple(g for g in shortlist.GATES if g[0] not in DROPPED)
print("gates run:", [g[0] for g in shortlist.GATES])
chosen, rejections, summary = shortlist.select(one, ComposerTable.load(), shortlist.load_wants(), quotas, 0,
                                               shortlist.load_verifications())
print("rejections:", dict(rejections.counts))
print("chosen:", [(c.cid, c.bucket, c.band, c.over_quota, c.composition_status) for c in chosen])
header = {"pdmxDir": str(ARCHIVE), "layout": "mxl.tar.gz",
          "note": "one-row shortlist for the A7a.1 probe (single-CID workaround): the Qmb7 CSV row run through "
                  "shortlist.select() over a one-row CSV; extract.py --cid and quarry.py read only "
                  "candidates.json or index.json"}
header.update(shortlist.fingerprint(ARCHIVE / "PDMX.csv", total))
(HERE / "pdmx" / "candidates.json").write_text(
    json.dumps({"header": header, "candidates": [asdict(c) for c in chosen]}, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8")
print("wrote candidates.json; header", {k: header[k] for k in header if k != "note"})
