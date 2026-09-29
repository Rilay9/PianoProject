"""
The measured finding on Mutopia's Joplin folder, one row per fetched edition (Q76 item 1; the brief's stop clause).

For each single-file .ly under content/scores/imported/mutopia/ftp/JoplinS (fetched at one pinned revision):
  - the licence the header states (`license`, else `copyright`), and how many `\\alternative` blocks it has
    (python-ly's writer does not implement `\\alternative`: it prints "Alternative not implemented");
  - A: python-ly's writer and convert.py as they stand (convert.parse_lilypond, the path docs/03 names);
  - B: the same after a preprocessing with python-ly's own tools (rel2abs, rhythm_explicit) and every repeat
    unfolded (scripts-proto-unfold.py), which is the most this machine can do without lilypond;
  - for every file that converts: bars written, the left-hand pattern's every-bar verdict (the printed bars
    where it fails), the ties, the level model's estimate. The two multi-file editions (Bethena, Solace:
    `\\include` of part files) are listed and not converted: neither is ragtime.8's.
"""
import json
import re
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
HERE = Path(__file__).resolve()
REPO = HERE.parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
sys.path.insert(0, str(HERE.parent))

import importlib.util  # noqa: E402

import convert  # noqa: E402
import demands as D  # noqa: E402
import difficulty  # noqa: E402
from music21 import converter  # noqa: E402

spec = importlib.util.spec_from_file_location("proto", HERE.parent / "scripts-proto-unfold.py")
proto = importlib.util.module_from_spec(spec)
spec.loader.exec_module(proto)

ROOT = REPO / "content" / "scores" / "imported" / "mutopia" / "ftp" / "JoplinS"
OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)


def header(text, key):
    m = re.search(rf'^\s*{key}\s*=\s*"([^"]*)"', text, re.M)
    return m.group(1) if m else None


rows = {}
to_measure = {}
for ly in sorted(ROOT.rglob("*.ly")):
    rel = ly.relative_to(ROOT).as_posix()
    text = ly.read_text(encoding="utf-8", errors="replace")
    if ly.parent.name.endswith("-lys"):
        if ly.name == "header.ly":
            rows[rel] = {"licence": header(text, "license") or header(text, "copyright"), "note": "multi-file edition (\\include of part files); not converted, not ragtime.8's"}
        continue
    row = {"licence": header(text, "license") or header(text, "copyright") or "(markup)", "date": header(text, "date"),
           "alternatives": len(re.findall(r"\\alternative", text))}
    try:
        r = convert.convert_file(ly, OUT / f"{ly.stem}.A.mxl")
        row["A"] = f"converts: {r.measures} bars written"
        to_measure[str(OUT / f"{ly.stem}.A.mxl")] = (rel, "A")
    except Exception as exc:  # noqa: BLE001
        row["A"] = f"refused: {type(exc).__name__}: {str(exc).splitlines()[0][:120]}"
    try:
        pre = proto.preprocess(text)
        mid = OUT / f"{ly.stem}.pre.ly"
        mid.write_text(pre, encoding="utf-8")
        r = convert.convert_file(mid, OUT / f"{ly.stem}.B.mxl")
        row["B"] = f"converts: {r.measures} bars written"
        to_measure[str(OUT / f"{ly.stem}.B.mxl")] = (rel, "B")
    except Exception as exc:  # noqa: BLE001
        row["B"] = f"refused: {type(exc).__name__}: {str(exc).splitlines()[0][:120]}"
    rows[rel] = row

answered = D.measure_each([Path(p) for p in to_measure])
for path, (rel, route) in to_measure.items():
    got = answered[path]
    if "error" in got:
        rows[rel][route] += f"; the app cannot load it: {got['error']}"
        continue
    opp = got.get("opportunities") or {}
    every = (got.get("everyBar") or {}).get("texture.left-hand-pattern") or []
    printed = got.get("printedBars") or 0
    failing = sorted(set(range(1, printed + 1)) - set(every))
    level = difficulty.estimate(difficulty.features(converter.parse(path))).level
    rows[rel][route] += (f"; left-hand pattern {'in every bar' if not failing else 'fails at printed bar(s) ' + (str(failing[:6]) + (' and more' if len(failing) > 6 else ''))}"
                         f"; ties located {int(opp.get('rhythm.ties', 0))}; level model {level}")
for rel, row in rows.items():
    print(rel, json.dumps(row, ensure_ascii=False))
