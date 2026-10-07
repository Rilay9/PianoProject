"""Station 1 step 1, the shape half (A7a.1 probe), adapted from BB1's scan_bb.py: stream mxl.tar.gz
once (never unpacked) for every CID in hits.json, save the raw bytes under scan-raw/, hash them, and
read each with quarry_core.analyse and quarry_core.identity("blues riff", the creator's names).

Usage: py -3.11 scan_br.py  (PIANOPATH_PDMX_DIR set; run csv_hits.py first)
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import tarfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "tools" / "content"))
from pdmx.quarry_core import analyse, identity, mxl_inner_xml  # noqa: E402

ARCHIVE = Path(os.environ["PIANOPATH_PDMX_DIR"])
OUT = HERE / "scan-raw"


def programs(t: str) -> list[int]:
    try:
        return [int(x) for x in t.split("-")] if t and t != "NA" else []
    except ValueError:
        return []


def main() -> int:
    hits = json.loads((HERE / "hits.json").read_text(encoding="utf-8"))
    rows = {}
    for key in ("blues_riff", "twelve_bar_same_creator", "by_creator"):
        for r in hits[key]:
            rows[r["member"]] = r
    OUT.mkdir(exist_ok=True)
    seen = 0
    with tarfile.open(ARCHIVE / "mxl.tar.gz", mode="r|gz") as tar:
        for info in tar:
            name = info.name.lstrip("./")
            if name in rows:
                data = tar.extractfile(info).read()
                r = rows[name]
                (OUT / f"{r['cid']}.mxl").write_bytes(data)
                r["sha256"] = hashlib.sha256(data).hexdigest()
                try:
                    r["analyse"] = analyse(mxl_inner_xml(data), programs(r["tracks"]))
                except Exception as error:  # noqa: BLE001
                    r["analyse"] = {"error": f"{type(error).__name__}: {error}"}
                brief = {"title": r["title"], "song_name": r["song_name"], "subtitle": "",
                         "composer": r["composer"], "artist": r["artist"]}
                r["identity"] = identity("blues riff", ["daniels", "elizabeth calvin daniels"], brief)
                seen += 1
                if seen == len(rows):
                    break
    print(f"members wanted {len(rows)}, read {seen}")
    (HERE / "scan.json").write_text(json.dumps(list(rows.values()), indent=1, ensure_ascii=False, default=str),
                                    encoding="utf-8")
    for r in rows.values():
        a = r.get("analyse") or {}
        print(f"{r['cid']} {r['title'][:40]!r} sha256={r.get('sha256', '')[:16]} id={r.get('identity')} "
              f"shape={a.get('shape')} parts={a.get('n_parts')} staves={a.get('max_staves')} meters={a.get('meters')} "
              f"bars={a.get('bars')} harmony={a.get('harmony_count', a.get('n_harmony'))} "
              f"part_list={[(p.get('id'), p.get('name'), p.get('staves')) for p in a.get('parts', [])] if isinstance(a.get('parts'), list) else a.get('parts')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
