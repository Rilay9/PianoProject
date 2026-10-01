"""
E57a (Entry 195), step 1: E57's scripts-pdmx-raw.py, copied and scoped to the three PDMX rows E57 held (`ROWS`): each
row's raw upload streamed read-only out of the archive the pdmx README names, into build/e57a/pdmx/raw/<cid>.mxl (temp
state, deleted at the lane's end; the archive itself is never copied, unpacked or written).

    python scripts-pdmx-raw.py [--pdmx-dir <folder holding PDMX.csv and mxl.tar.gz>]

Without --pdmx-dir the tools' own environment variable (PIANOPATH_PDMX_DIR) is read, as every pdmx tool does
(`pdmx/paths.find_archive`). Each row's `cid` (`content/sources/pdmx.json`) is matched against the archive's own
PDMX.csv the way `pdmx/shortlist.py` does (`cid_of` of the `mxl` column; `member_name` gives the tar member), then
`pdmx/extract.extract_from_tar` streams the tarball once. Each extracted file's sha256 is checked against the row's
`rawSha256`. Output: runs/E57a/pdmx-raw.txt (machine paths replaced). The only changes from E57's script are `ROWS`
and the two output folders (E57's evidence under runs/E57 is never written).
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
from pdmx.extract import extract_from_tar  # noqa: E402
from pdmx.paths import find_archive  # noqa: E402
from pdmx.shortlist import cid_of, member_name  # noqa: E402

RAW = W / "build" / "e57a" / "pdmx" / "raw"
LOG = W / "docs" / "prompts" / "runs" / "E57a" / "pdmx-raw.txt"
#: The three rows E57 held as committed (runs/E57/pdmx-reconvert.py's HELD), the whole of E57a's PDMX scope.
ROWS = ("song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx",
        "song.pop.takeru-kanazaki-fire-emblem-three-houses-apex-of-the-world.pdmx",
        "song.pop.billy-joel-rousseau-billy-joel-piano-man.pdmx")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdmx-dir")
    args = parser.parse_args(argv)
    archive = find_archive(args.pdmx_dir)
    every = json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]
    items = [row for row in every if row["id"] in ROWS]
    if sorted(row["id"] for row in items) != sorted(ROWS):
        raise SystemExit(f"STOP: pdmx.json does not hold exactly the three rows ({[row['id'] for row in items]})")
    by_cid = {row["cid"]: row for row in items}
    RAW.mkdir(parents=True, exist_ok=True)
    csv.field_size_limit(1 << 30)
    members: dict[str, str] = {}
    with archive.csv.open(encoding="utf-8", newline="") as handle:
        for record in csv.DictReader(handle):
            cid = cid_of(record.get("mxl") or "")
            if cid in by_cid and cid not in members:
                members[cid] = member_name(record["mxl"])
    wanted = {members[cid]: RAW / f"{cid}.mxl" for cid in members if not (RAW / f"{cid}.mxl").is_file()}
    result = extract_from_tar(archive.tarball, wanted, progress=False) if wanted and archive.tarball else None
    lines = [f"archive layout {archive.layout}; {len(items)} rows (E57a's three); {len(members)} cids found in PDMX.csv; "
             f"{len(wanted)} member(s) streamed this run" + (f" ({result.summary()})" if result else "")]
    faults = 0
    for row in items:
        path = RAW / f"{row['cid']}.mxl"
        if row["cid"] not in members:
            lines.append(f"NOT IN CSV {row['id']} ({row['cid']})")
            faults += 1
        elif not path.is_file():
            lines.append(f"NOT EXTRACTED {row['id']} (member {members[row['cid']]})")
            faults += 1
        elif hashlib.sha256(path.read_bytes()).hexdigest() != row["rawSha256"]:
            lines.append(f"RAW SHA DIFFERS {row['id']} (member {members[row['cid']]})")
            faults += 1
        else:
            lines.append(f"ok {row['id']} ({row['cid']}): raw sha256 {row['rawSha256'][:12]}… equal to the row's rawSha256")
    lines.append(f"{len(items) - faults} of {len(items)} raw uploads extracted, each sha256 equal to its row's rawSha256; "
                 f"{faults} fault(s)")
    text = "\n".join(lines) + "\n"
    LOG.write_text(text, encoding="utf-8")
    print(text)
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
