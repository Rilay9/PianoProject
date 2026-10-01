"""
E57 item 3, step 2: PDMX's exposure, counted. Every committed PDMX row's raw upload (build/e57/pdmx/raw, from
scripts-pdmx-raw.py) is converted twice, as `pdmx/quarry.py` converts it (`convert_file(raw, destination)`, no
override): once by the committed converter and once by E57's, and the two outputs are compared byte for byte.

    python scripts-pdmx-count.py <committed converter folder> <E57 converter folder> [--workers N]

Each folder holds a `convert.py` (the committed one taken at the base, and the worktree's changed one), loaded as the
module `convert` in its own worker processes, every other module from `tools/content`. Outputs go to
build/e57/pdmx/{base,new}/<cid>.mxl. A row counts as changed when the two outputs differ; for each changed row the
`<sound tempo>`s by bar are listed before and after. A conversion that fails fails in both or is a fault.
Output: runs/E57/pdmx-count.txt.
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
E57 = W / "build" / "e57" / "pdmx"
LOG = W / "docs" / "prompts" / "runs" / "E57" / "pdmx-count.txt"
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
        return dict(pool.map(one, jobs, chunksize=4))


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("base")
    parser.add_argument("new")
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args(argv)
    items = json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]
    raws = {row["cid"]: E57 / "raw" / f"{row['cid']}.mxl" for row in items}
    results = {}
    for name, folder in (("base", args.base), ("new", args.new)):
        jobs = [(str(raws[row["cid"]]), str(E57 / name / f"{row['cid']}.mxl")) for row in items]
        results[name] = run(folder, E57 / name, jobs, args.workers)
    lines = [f"{len(items)} committed PDMX rows; each raw upload converted by the committed converter and by E57's "
             "(convert_file(raw, destination), as pdmx/quarry.py does); outputs compared byte for byte", ""]
    changed, same, failed, faults = [], 0, 0, []
    for row in items:
        raw = str(raws[row["cid"]])
        base_error, new_error = results["base"][raw], results["new"][raw]
        if base_error or new_error:
            if base_error == new_error:
                failed += 1
                lines.append(f"both fail {row['id']}: {base_error}")
            else:
                faults.append(f"{row['id']}: committed {base_error!r}, E57 {new_error!r}")
            continue
        old = (E57 / "base" / f"{row['cid']}.mxl").read_bytes()
        new = (E57 / "new" / f"{row['cid']}.mxl").read_bytes()
        if old == new:
            same += 1
            continue
        changed.append(row["id"])
        lines.append(f"CHANGED {row['id']} ({row['cid']}): committed-converter output {hashlib.sha256(old).hexdigest()[:12]}, "
                     f"E57's {hashlib.sha256(new).hexdigest()[:12]}")
        lines.append(f"   <sound tempo> by bar, committed converter: {tempo_by_bar(inner(old))}")
        lines.append(f"   <sound tempo> by bar, E57's converter:     {tempo_by_bar(inner(new))}")
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
