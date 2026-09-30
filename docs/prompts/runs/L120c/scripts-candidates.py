"""
L120c item 8: the songs the gate would admit at a rung (nothing untaught there, never refused before the coping
question), within the rung's core reach, with the facts a placement is read from: level, metre, staves, pedal
marks in the file, the rungs already listing it. A shortlist to read at its notation, never a placement.

    python docs/prompts/runs/L120c/scripts-candidates.py CONTENT_DIR RUNG OUT.txt [--pedal]
"""
from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
import claims  # noqa: E402
import untaught_options as U  # noqa: E402


def pedal_marks(content: Path, rel: str | None) -> int:
    if not rel:
        return 0
    path = content / rel
    if not path.is_file():
        return 0
    try:
        with zipfile.ZipFile(path) as archive:
            name = next(n for n in archive.namelist() if n.endswith((".musicxml", ".xml")) and "container" not in n.lower())
            return len(re.findall(r"<pedal\b", archive.read(name).decode("utf-8", "replace")))
    except (zipfile.BadZipFile, StopIteration):
        return 0


def main(argv: list[str]) -> int:
    content, rung, out_path = Path(argv[0]), argv[1], Path(argv[2])
    want_pedal = "--pedal" in argv
    catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
    curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
    _skills, demands = claims.load_vocabulary()
    ancestry = claims.rung_ancestry(curriculum)
    stage = next(s["number"] for s, _u, l in claims.lessons_in_order(curriculum) if l["id"] == rung)
    listed: dict[str, list[str]] = {}
    for _s, _u, lesson in claims.lessons_in_order(curriculum):
        for item_id in lesson.get("songOptions", []) + lesson.get("exerciseOptions", []):
            listed.setdefault(item_id, []).append(lesson["id"])
    rows = []
    for item in catalog:
        if item.get("type") != "song" or item.get("level") is None or float(item["level"]) > stage + 2.0:
            continue
        if (item.get("measurement") or {}).get("status") != "measured":
            continue
        if U.refused_before_coping(item) is not None:
            continue
        if claims.untaught_on(item, rung, ancestry, demands, curriculum):
            continue
        pedals = pedal_marks(content, item.get("file"))
        if want_pedal and pedals == 0:
            continue
        notation = item.get("notation") or {}
        rows.append((float(item["level"]), item["id"], item.get("title"), notation.get("times"), notation.get("staves"),
                     notation.get("bars"), pedals, listed.get(item["id"], [])))
    out = [f"# Songs the gate admits at {rung} (Stage {stage}, level <= {stage + 2.0:g}){' with pedal marks' if want_pedal else ''}: {len(rows)}", ""]
    for level, ident, title, times, staves, bars, pedals, on in sorted(rows):
        out.append(f"- {level:g} {ident} ({title}): times {times}, staves {staves}, bars {bars}, pedal marks {pedals}; on {', '.join(on) or 'no rung'}")
    out_path.write_text("\n".join(out) + "\n", encoding="utf-8")
    print("\n".join(out[:60]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
