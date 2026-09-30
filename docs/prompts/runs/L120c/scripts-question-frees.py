"""
L120c item 9's stop line: what a held repair would free, never built. For a demand and the taughtAt it would get,
the table on the built content with that one list patched in, against the table as built: every pair that would
leave, by rung and item, and the core's first teaching rung before and after.

    python docs/prompts/runs/L120c/scripts-question-frees.py CONTENT_DIR DEMAND RUNG[,RUNG...] OUT.txt
"""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
import claims  # noqa: E402
import untaught_options as U  # noqa: E402


def main(argv: list[str]) -> int:
    content, demand, rungs, out_path = Path(argv[0]), argv[1], argv[2].split(","), Path(argv[3])
    catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
    curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
    skills, demands = claims.load_vocabulary()
    patched = copy.deepcopy(demands)
    patched[demand]["taughtAt"] = rungs
    before = U.table(catalog, curriculum, skills, demands)
    after = U.table(catalog, curriculum, skills, patched)
    pairs = lambda report: {(l["rung"], l["item"], d["id"]): (l["title"], d["class"], d["verdict"])  # noqa: E731
                            for l in report["lines"] for d in l["demands"]}
    pb, pa = pairs(before), pairs(after)
    freed = sorted(k for k in pb if k not in pa)
    others = sorted(k for k in freed if k[2] != demand)
    lines_before = {(l["rung"], l["item"]) for l in before["lines"]}
    lines_after = {(l["rung"], l["item"]) for l in after["lines"]}
    ancestry = claims.rung_ancestry(curriculum)
    core = [lesson["id"] for _s, unit, lesson in claims.lessons_in_order(curriculum) if unit.get("track") == "core"]
    first = lambda listed: next((r for r in core if any(t in ancestry[r] for t in listed)), None)  # noqa: E731
    out = [f"# If {demand} were taught at {rungs} (held, not built)", "",
           f"- taughtAt as built: {demands[demand]['taughtAt']}; the core's first teaching rung: {first(demands[demand]['taughtAt'])}",
           f"- taughtAt held: {rungs}; the core's first teaching rung: {first(rungs)}",
           f"- {demand} pairs that would leave the table: {len(freed) - len(others)}; other demands' pairs: {len(others)}",
           f"- options that would leave the table entirely (nothing else untaught): {len(lines_before - lines_after)}", ""]
    for key in freed:
        title, cls, verdict = pb[key]
        whole = " — the option leaves the table" if (key[0], key[1]) not in lines_after else " — still refused for another demand"
        out.append(f"- {key[0]} {key[1]} ({title}): {key[2]} {cls}, {verdict}{whole}")
    out_path.write_text("\n".join(out) + "\n", encoding="utf-8")
    print("\n".join(out[:6]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
