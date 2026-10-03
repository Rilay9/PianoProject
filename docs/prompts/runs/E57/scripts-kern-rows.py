"""
E57's end-to-end case on the three kern rows X40 found: each row's kern source (the copied clone the build converts)
converted by a given `convert.py` as the kern importer converts it (`convert_file(source, dest, title, composer)`, no
tempo override) and read back through the app's own reader (scripts-reader.table.ts, `tempoEvents`), against the
tempos its `*MM` records state, in order.

    python scripts-kern-rows.py <folder holding the convert.py to use> <label>

The files go to build/e57/kern-rows/<label>/. A row passes when the reader's events carry every stated tempo in the
source's order (a statement the parser splits across two nearby positions reads as consecutive equal events, counted
once). Exit 0 when all three pass, 1 otherwise. Output: runs/E57/kern-rows-<label>.txt.
"""
from __future__ import annotations

import importlib.util
import json
import os
import re
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
KERN = W / "content" / "scores" / "imported" / "kern"
ROWS = [
    ("song.classical.chopin-rondo-op16.nifc", "chopin-first-editions/kern/016-1a-BH.krn", "Rondo in E-flat major, Op. 16", "Fryderyk Chopin"),
    ("song.classical.chopin-waltz-op70-1.nifc", "chopin-first-editions/kern/070-1-Sam-001.krn", "Waltz in G-flat major, Op. 70 No. 1", "Fryderyk Chopin"),
    ("song.ragtime.joplin-combination-march", "joplin/kern/combination.krn", "Combination March", "Scott Joplin"),
]


def stated(source: Path) -> list[float]:
    """The tempo each `*MM` record states, in order, one per record line (every spine repeats it)."""
    out = []
    for line in source.read_text(encoding="utf-8", errors="replace").splitlines():
        values = {float(token[3:]) for token in line.split("\t") if re.fullmatch(r"\*MM[0-9.]+", token)}
        if values:
            out.append(values.pop() if len(values) == 1 else -1.0)
    return out


def main(argv: list[str]) -> int:
    folder, label = Path(argv[0]).resolve(), argv[1]
    sys.path.insert(0, str(W / "tools" / "content"))
    spec = importlib.util.spec_from_file_location("convert", folder / "convert.py")
    convert = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    sys.modules["convert"] = convert
    spec.loader.exec_module(convert)  # type: ignore[union-attr]
    out = W / "build" / "e57" / "kern-rows" / label
    out.mkdir(parents=True, exist_ok=True)
    pairs = []
    for item_id, rel, title, composer in ROWS:
        dest = out / f"{item_id}.mxl"
        convert.convert_file(KERN / rel, dest, title=title, composer=composer)
        pairs.append([item_id, str(dest)])
    dump = out / "reader.jsonl"
    env = {**os.environ, "PIANOPATH_E57_FILES": json.dumps(pairs), "PIANOPATH_E57_OUT": str(dump)}
    run = subprocess.run("npx vitest run --config ../docs/prompts/runs/E57/scripts-vitest.reader.config.mts", cwd=W / "app", env=env,
                         shell=True, capture_output=True, text=True)
    if run.returncode != 0:
        print(run.stdout[-2000:], run.stderr[-2000:])
        return 1
    events = {json.loads(line)["id"]: json.loads(line)["events"] for line in dump.read_text(encoding="utf-8").splitlines() if line.strip()}
    lines = [f"convert.py under test: {folder.relative_to(W).as_posix()}; each row's kern source converted and read through the app's reader"]
    failed = 0
    for item_id, rel, _title, _composer in ROWS:
        want = stated(KERN / rel)
        got = [e["bpm"] for e in events[item_id]]
        collapsed = [bpm for i, bpm in enumerate(got) if i == 0 or bpm != got[i - 1]]
        ok = collapsed == want
        failed += not ok
        lines.append(f"{'PASS' if ok else 'FAIL'} {item_id}: *MM {want}; the reader plays "
                     f"{[(e['at'], e['bpm']) for e in events[item_id]]}")
    lines.append(f"{len(ROWS) - failed} of {len(ROWS)} rows play every tempo their source states")
    text = "\n".join(lines) + "\n"
    (W / "docs/prompts/runs/E57" / f"kern-rows-{label}.txt").write_text(text, encoding="utf-8")
    print(text)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
