"""
E59 item 1 (PDMX's inventory, at the builder's HEAD) and item 4 (the transform against the converter's own output).
Every committed PDMX row's raw upload (build/e59/pdmx/raw, from scripts-pdmx-raw.py) is converted twice, as
`pdmx/quarry.py:448` converts it (`convert_file(raw, destination)`, no override): once by the committed converter (base)
and once by E59's. E57's `scripts-pdmx-count.py`, with what E59 needs added:

- **the branch**: a row takes the no-tempo `else:` exactly when the conversion reports `added_tempo` (quarry passes no
  override, so the override branch, the other one that sets it, never runs); counted under both converters and set
  against the rows `content/sources/pdmx.json` tags `tempoDefaulted`;
- **the change**: the two outputs compared byte for byte; every changed row must be in the branch and every row in the
  branch changed, and the E59 output must be the base output through `scripts-pdmx-transform.transform_text` (the four
  metronome lines become `<words />`), zipped as the converter zips: the transform is the converter's own change;
- **the committed file**: where the committed (dated) file's undated form is the base output (the file reproduces from its
  upload), its transform must be the E59 output byte for byte; where it does not reproduce, said, and the transform of
  the committed file is checked against the shapes alone (scripts-pdmx-transform.py --check).

    python scripts-pdmx-count.py <committed converter folder> <E59 converter folder> [--workers N]

Each folder holds a `convert.py`, loaded as the module `convert` in its own worker processes, every other module from
`tools/content`. Outputs go to build/e59/pdmx/{base,new}/<cid>.mxl. Output: runs/E59/pdmx-count.txt.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

W = Path(__file__).resolve().parents[4]
E59 = W / "build" / "e59" / "pdmx"
LOG = W / "docs" / "prompts" / "runs" / "E59" / "pdmx-count.txt"
_convert = None


def load(folder: str) -> None:
    global _convert
    sys.path.insert(0, str(W / "tools" / "content"))
    spec = importlib.util.spec_from_file_location("convert", Path(folder) / "convert.py")
    module = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    sys.modules["convert"] = module
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    _convert = module


def one(job: tuple[str, str]) -> tuple[str, dict]:
    raw, dest = job
    try:
        result = _convert.convert_file(Path(raw), Path(dest))  # type: ignore[union-attr]
    except Exception as error:  # noqa: BLE001 - recorded, compared across the two converters
        return raw, {"error": f"{type(error).__name__}: {str(error)[:200]}"}
    return raw, {"added_tempo": result.added_tempo, "tempo_bpm": result.tempo_bpm}


def run(folder: str, out: Path, jobs: list[tuple[str, str]], workers: int) -> dict[str, dict]:
    out.mkdir(parents=True, exist_ok=True)
    with ProcessPoolExecutor(max_workers=workers, initializer=load, initargs=(folder,)) as pool:
        return dict(pool.map(one, jobs, chunksize=4))


def transform_module():
    sys.path.insert(0, str(W / "tools" / "content"))
    spec = importlib.util.spec_from_file_location("e59_transform", Path(__file__).with_name("scripts-pdmx-transform.py"))
    module = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("base")
    parser.add_argument("new")
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args(argv)
    items = json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]
    raws = {row["cid"]: E59 / "raw" / f"{row['cid']}.mxl" for row in items}
    results = {}
    for name, folder in (("base", args.base), ("new", args.new)):
        jobs = [(str(raws[row["cid"]]), str(E59 / name / f"{row['cid']}.mxl")) for row in items]
        results[name] = run(folder, E59 / name, jobs, args.workers)
    tx = transform_module()
    convert = sys.modules["convert"]  # tools/content/convert.py, imported by the transform module
    lines = [f"{len(items)} committed PDMX rows; each raw upload converted by the committed converter and by E59's "
             "(convert_file(raw, destination), as pdmx/quarry.py:448 does, no override); outputs compared byte for byte", ""]
    tagged = {row["id"] for row in items if row.get("tempoDefaulted") is True}
    branch_base, branch_new, changed, faults, failed = set(), set(), set(), [], 0
    reproduced = not_reproduced = 0
    for row in items:
        raw = str(raws[row["cid"]])
        b, n = results["base"][raw], results["new"][raw]
        if "error" in b or "error" in n:
            if b.get("error") == n.get("error"):
                failed += 1
                lines.append(f"both fail {row['id']}: {b.get('error')}")
            else:
                faults.append(f"{row['id']}: committed {b.get('error')!r}, E59 {n.get('error')!r}")
            continue
        if b["added_tempo"]:
            branch_base.add(row["id"])
        if n["added_tempo"]:
            branch_new.add(row["id"])
        if (b["added_tempo"], b["tempo_bpm"]) != (n["added_tempo"], n["tempo_bpm"]):
            faults.append(f"{row['id']}: added_tempo/tempo_bpm {b} under the committed converter, {n} under E59's")
        old = (E59 / "base" / f"{row['cid']}.mxl").read_bytes()
        new = (E59 / "new" / f"{row['cid']}.mxl").read_bytes()
        if old == new:
            continue
        changed.add(row["id"])
        entries = convert._entries(old)
        at = convert._score_at(entries, undated=True)
        try:
            text, shape = tx.transform_text(entries[at][1].decode("utf-8"))
        except ValueError as error:
            faults.append(f"{row['id']}: the E59 output is not the base output's transform ({error})")
            continue
        through = list(entries)
        through[at] = (entries[at][0], text.encode("utf-8"))
        if convert.pinned_archive(through) != new:
            faults.append(f"{row['id']}: the base output's transform, zipped, is not E59's output")
            continue
        committed = (W / "content" / f"scores/pdmx/{row['cid']}.mxl").read_bytes()
        dated = convert.dated_form(committed)
        if dated is not None and dated["undated"] == hashlib.sha256(old).hexdigest():
            reproduced += 1
            moved, _ = tx.transform_file(committed)
            same = moved == new
            if not same:
                faults.append(f"{row['id']}: the committed file reproduces from its upload, but its transform is not E59's output")
            how = f"the committed file reproduces from its upload; its transform = E59's output: {same}"
        else:
            not_reproduced += 1
            how = "the committed file does not reproduce from its upload under the committed converter (an older converter's output)"
        lines.append(f"CHANGED {row['id']} ({row['cid']}): {shape}; base {hashlib.sha256(old).hexdigest()[:12]} -> E59 "
                     f"{hashlib.sha256(new).hexdigest()[:12]}; = the base output's transform; {how}")
    lines += [
        "",
        f"the no-tempo branch (added_tempo, no override): {len(branch_base)} rows under the committed converter, {len(branch_new)} under E59's",
        f"tagged tempoDefaulted in pdmx.json: {len(tagged)}; tagged and in the branch: {len(tagged & branch_base)}; "
        f"in the branch, not tagged: {sorted(branch_base - tagged) or 'none'}; tagged, not in the branch: {sorted(tagged - branch_base) or 'none'}",
        f"changed by E59: {len(changed)}; changed and not in the branch: {sorted(changed - branch_base) or 'none'}; in the branch and "
        f"not changed: {sorted(branch_base - changed) or 'none'}",
        f"of the changed: the committed file reproduces from its upload {reproduced}, does not {not_reproduced}",
        f"failing under both converters alike {failed}, faults {len(faults)}",
    ] + [f"   FAULT {fault}" for fault in faults]
    if branch_base != tagged or changed != branch_base:
        faults.append("the branch, the tag and the change are not one set")
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[-6 - len(faults):]))
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
