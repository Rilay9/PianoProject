"""A7a.3 probe, Station 1: St James Infirmary editions and St. Louis Blues in PDMX, read-only.

Adapted from the A7b.1 probe's scan_bb.py.
1. Read every row of PDMX.csv; keep rows whose title, song_name, subtitle, artist_name or
   composer_name contains "james infirmary" (any spelling of St/St./Saint before it is covered).
2. quarry_core.identity("st james infirmary", [traditional aliases]) on each hit.
3. Stream mxl.tar.gz once (never unpacked) and read the hits plus the named CIDs (St. Louis
   Blues) with quarry_core.analyse; save raw bytes under build/a7a3/raw/ and their sha256.

Usage: py -3.11 scan_stj.py   (PIANOPATH_PDMX_DIR must point at the archive folder)
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
import sys
import tarfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(REPO / "tools" / "content"))

from pdmx.quarry_core import analyse, identity, mxl_inner_xml  # noqa: E402

csv.field_size_limit(10**9)
ARCHIVE = Path(os.environ["PIANOPATH_PDMX_DIR"])
TERMS = ("james infirmary",)
FIELDS = ("title", "song_name", "subtitle", "artist_name", "composer_name")
NAMED = {"QmYutJi8H9KmexPTGDuRXTzQNkqnu1Jk8ERW1gZiMs33ZG"}  # St. Louis Blues (Handy 1914)
OUT = HERE / "raw"


def programs(t: str) -> list[int]:
    try:
        return [int(x) for x in t.split("-")] if t and t != "NA" else []
    except ValueError:
        return []


def main() -> int:
    hits, total = [], 0
    with open(ARCHIVE / "PDMX.csv", encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            total += 1
            text = " ".join((row.get(f) or "") for f in FIELDS).lower()
            cid = (row.get("mxl") or "").rsplit("/", 1)[-1][:-4]
            if any(t in text for t in TERMS) or cid in NAMED:
                hits.append(row)
    print(f"rows read: {total}; hits (incl. named): {len(hits)}")
    out = []
    for row in hits:
        cid = row["mxl"].rsplit("/", 1)[1][:-4]
        brief = {"title": row["title"], "song_name": row["song_name"], "subtitle": row["subtitle"],
                 "composer": row["composer_name"], "artist": row["artist_name"]}
        if cid in NAMED:
            verdict, why = identity("st louis blues", ["handy", "w. c. handy"], brief)
        else:
            verdict, why = identity("st james infirmary", ["traditional", "primrose", "mills"], brief)
        out.append({
            "cid": cid, "member": row["mxl"].lstrip("./"), "title": row["title"], "song_name": row["song_name"],
            "composer": row["composer_name"], "artist": row["artist_name"], "tracks": row["tracks"],
            "n_tracks": row["n_tracks"], "bars": row["song_length.bars"], "rating": row["rating"],
            "n_ratings": row["n_ratings"], "dedup": row["subset:deduplicated"], "license": row.get("license"),
            "identity": verdict, "identity_why": why,
        })
    wanted = {r["member"]: r for r in out}
    print(f"members to read from the tarball: {len(wanted)}")
    OUT.mkdir(parents=True, exist_ok=True)
    seen = 0
    with tarfile.open(ARCHIVE / "mxl.tar.gz", mode="r|gz") as tar:
        for info in tar:
            name = info.name.lstrip("./")
            if name in wanted:
                data = tar.extractfile(info).read()
                (OUT / f"{wanted[name]['cid']}.mxl").write_bytes(data)
                wanted[name]["rawSha256"] = hashlib.sha256(data).hexdigest()
                try:
                    wanted[name]["analyse"] = analyse(mxl_inner_xml(data), programs(wanted[name]["tracks"]))
                except Exception as error:  # noqa: BLE001
                    wanted[name]["analyse"] = {"error": f"{type(error).__name__}: {error}"}
                seen += 1
                if seen == len(wanted):
                    break
    print(f"members read: {seen}")
    (HERE / "scan.json").write_text(json.dumps(out, indent=1, ensure_ascii=False, default=str), encoding="utf-8")
    for r in out:
        a = r.get("analyse") or {}
        print(f"{r['cid']}  {r['title'][:40]!r:42} tracks={r['tracks']:<10} csvbars={r['bars']:<4} "
              f"rating={r['rating']}/{r['n_ratings']} dedup={r['dedup']} id={r['identity']} "
              f"sha={str(r.get('rawSha256'))[:12]}"
              + (f"  shape={a.get('shape')} parts={a.get('n_parts')} staves={a.get('max_staves')} "
                 f"meters={a.get('meters')} key={a.get('key')} bars={a.get('bars')} harmony={a.get('harmony')}"
                 if a else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
