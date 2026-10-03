"""
E57a (Entry 195), step 2: E57's scripts-pdmx-count.py, copied and scoped to the three PDMX rows E57 held (`ROWS`). Each
row's raw upload (build/e57a/pdmx/raw, from scripts-pdmx-raw.py) is converted twice, as `pdmx/quarry.py` converts it
(`convert_file(raw, destination)`, no override): once by the converter before E57 (`convert.py` at 122a5224, E57's base,
the converter that wrote the committed files) and once by today's (E57's fix, unchanged since its landing), and the two
outputs are compared byte for byte.

    python scripts-pdmx-count.py <converter-before-E57 folder> <today's converter folder> [--workers N]

Each folder holds a `convert.py`, loaded as the module `convert` in its own worker processes, every other module from
`tools/content`. Outputs go to build/e57a/pdmx/{base,new}/<cid>.mxl. A row counts as changed when the two outputs differ;
for each changed row the `<sound tempo>`s by bar are listed before and after, and the new output's sha256 beside the
prefix E57 recorded for it (runs/E57/pdmx-reconvert.txt, `RECORDED`). Output: runs/E57a/pdmx-count.txt. The only changes
from E57's script are `ROWS`, `RECORDED` and the output folders (E57's evidence under runs/E57 is never written).
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import io
import json
import re
import sys
import zipfile
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

W = Path(__file__).resolve().parents[4]
E57A = W / "build" / "e57a" / "pdmx"
LOG = W / "docs" / "prompts" / "runs" / "E57a" / "pdmx-count.txt"
ROWS = ("song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx",
        "song.pop.takeru-kanazaki-fire-emblem-three-houses-apex-of-the-world.pdmx",
        "song.pop.billy-joel-rousseau-billy-joel-piano-man.pdmx")
#: The new files' sha256 prefixes E57 recorded (runs/E57/pdmx-reconvert.txt, the three HELD lines).
RECORDED = {"song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx": "f5d8fed0bb86",
            "song.pop.takeru-kanazaki-fire-emblem-three-houses-apex-of-the-world.pdmx": "d069d41ce874",
            "song.pop.billy-joel-rousseau-billy-joel-piano-man.pdmx": "e72561d66d7e"}
_convert = None


def load(folder: str) -> None:
    global _convert
    sys.path.insert(0, str(W / "tools" / "content"))
    spec = importlib.util.spec_from_file_location("convert", Path(folder) / "convert.py")
    module = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    sys.modules["convert"] = module
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    _convert = module


def one(job: tuple[str, str]) -> tuple[str, str | None]:
    raw, dest = job
    try:
        _convert.convert_file(Path(raw), Path(dest))  # type: ignore[union-attr]
    except Exception as error:  # noqa: BLE001 - recorded, compared across the two converters
        return raw, f"{type(error).__name__}: {str(error)[:200]}"
    return raw, None


def inner(raw: bytes) -> str:
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        names = [n for n in archive.namelist() if n.lower().endswith((".xml", ".musicxml")) and not n.upper().startswith("META-INF/")]
        return archive.read(names[0]).decode("utf-8")


def tempo_by_bar(xml: str) -> list[tuple[str, str]]:
    out = []
    for number, body in re.findall(r'<measure\b[^>]*\bnumber="([^"]+)"[^>]*>(.*?)</measure>', xml, re.S):
        out += [(number, value) for value in re.findall(r'<sound tempo="([^"]+)"', body)]
    return out


def run(folder: str, out: Path, jobs: list[tuple[str, str]], workers: int) -> dict[str, str | None]:
    out.mkdir(parents=True, exist_ok=True)
    with ProcessPoolExecutor(max_workers=workers, initializer=load, initargs=(folder,)) as pool:
        return dict(pool.map(one, jobs, chunksize=1))


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("base")
    parser.add_argument("new")
    parser.add_argument("--workers", type=int, default=3)
    args = parser.parse_args(argv)
    items = [row for row in json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"] if row["id"] in ROWS]
    if sorted(row["id"] for row in items) != sorted(ROWS):
        raise SystemExit("STOP: pdmx.json does not hold exactly the three rows")
    raws = {row["cid"]: E57A / "raw" / f"{row['cid']}.mxl" for row in items}
    results = {}
    for name, folder in (("base", args.base), ("new", args.new)):
        jobs = [(str(raws[row["cid"]]), str(E57A / name / f"{row['cid']}.mxl")) for row in items]
        results[name] = run(folder, E57A / name, jobs, args.workers)
    lines = [f"{len(items)} PDMX rows (E57a's three); each raw upload converted by the converter before E57 (122a5224) and by "
             "today's (convert_file(raw, destination), as pdmx/quarry.py does); outputs compared byte for byte", ""]
    changed, same, failed, faults = [], 0, 0, []
    for row in items:
        raw = str(raws[row["cid"]])
        base_error, new_error = results["base"][raw], results["new"][raw]
        if base_error or new_error:
            if base_error == new_error:
                failed += 1
                lines.append(f"both fail {row['id']}: {base_error}")
            else:
                faults.append(f"{row['id']}: before E57 {base_error!r}, today {new_error!r}")
            continue
        old = (E57A / "base" / f"{row['cid']}.mxl").read_bytes()
        new = (E57A / "new" / f"{row['cid']}.mxl").read_bytes()
        if old == new:
            same += 1
            continue
        changed.append(row["id"])
        new_sha = hashlib.sha256(new).hexdigest()
        lines.append(f"CHANGED {row['id']} ({row['cid']}): committed-converter output {hashlib.sha256(old).hexdigest()[:12]}, "
                     f"E57's {new_sha[:12]} (E57 recorded {RECORDED[row['id']]}: {'reproduced' if new_sha.startswith(RECORDED[row['id']]) else 'NOT REPRODUCED'})")
        lines.append(f"   <sound tempo> by bar, committed converter: {tempo_by_bar(inner(old))}")
        lines.append(f"   <sound tempo> by bar, E57's converter:     {tempo_by_bar(inner(new))}")
        if not new_sha.startswith(RECORDED[row["id"]]):
            faults.append(f"{row['id']}: today's conversion {new_sha[:12]} is not the file E57 recorded ({RECORDED[row['id']]})")
    lines += ["", f"changed {len(changed)}, byte-identical {same}, failing under both converters alike {failed}, "
              f"faults {len(faults)}"]
    lines += [f"   FAULT {fault}" for fault in faults]
    lines.append("changed rows: " + (", ".join(changed) if changed else "none"))
    text = "\n".join(lines) + "\n"
    LOG.write_text(text, encoding="utf-8")
    print("\n".join(lines[-6:]))
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
