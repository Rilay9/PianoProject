"""
E50 item 5(i): the seven raw uploads streamed read-only out of PDMX's `mxl.tar.gz` into build/e50/raw/<cid>.mxl, each
checked against its row's `rawSha256` in `content/sources/pdmx.json`. Members are matched by their file name
(`<cid>.mxl`), whatever folder prefix the archive writes (PDMX.csv's `./mxl/<a>/<b>/`); the member name found is
printed. The archive is never written. Output: runs/E50/raw.txt.
"""
from __future__ import annotations

import hashlib
import json
import sys
import tarfile
from pathlib import Path

W = Path(__file__).resolve().parents[4]
TARBALL = Path(r"C:\Users\yalir\repos\Piano Stuff\mxl.tar.gz")
OUT = W / "build" / "e50" / "raw"
SEVEN = ["song.pop.margie.pdmx", "song.jazz.django-reinhardt-limehouse-blues.pdmx", "song.blues.singin-the-blues",
         "song.blues.weary-blues", "song.blues.storyville-blues", "song.blues.wabash-blues", "song.blues.tishomingo-blues"]


def main() -> int:
    items = {r["id"]: r for r in json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]}
    wanted = {f"{items[i]['cid']}.mxl": items[i] for i in SEVEN}
    OUT.mkdir(parents=True, exist_ok=True)
    found: dict[str, str] = {}
    lines: list[str] = []
    with tarfile.open(TARBALL, mode="r|gz") as tar:
        for member in tar:
            if not member.isfile():
                continue
            name = member.name.rsplit("/", 1)[-1]
            if name not in wanted or name in found:
                continue
            data = tar.extractfile(member).read()  # type: ignore[union-attr]
            (OUT / name).write_bytes(data)
            found[name] = member.name
            if len(found) == len(wanted):
                break
    faults = 0
    for name, row in wanted.items():
        if name not in found:
            lines.append(f"MISSING {row['id']}: {name}")
            faults += 1
            continue
        sha = hashlib.sha256((OUT / name).read_bytes()).hexdigest()
        same = sha == row["rawSha256"]
        faults += not same
        lines.append(f"{'ok  ' if same else 'DIFF'} {row['id']}: member {found[name]}, sha256 {sha} "
                     f"{'==' if same else '!='} rawSha256 {row['rawSha256']}")
    lines.append(f"{len(found)} of {len(wanted)} members found; {faults} faults")
    text = "\n".join(lines) + "\n"
    (W / "docs/prompts/runs/E50/raw.txt").write_text(text, encoding="utf-8")
    print(text)
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main())
